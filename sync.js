// ── SYNC.JS — Auth Supabase + synchronisation cloud ──────────────────────────
// Offline-first : IndexedDB est toujours la source locale.
// Le cloud est une copie de secours synchronisée dès qu'on a du réseau.

// ── Client Supabase minimal (pas de dépendance npm) ──────────────────────────
const SB = (() => {
  const headers = () => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON,
    'Authorization': 'Bearer ' + (AUTH.token || SUPABASE_ANON),
  });

  const rest = (path, opts = {}) =>
    fetch(SUPABASE_URL + '/rest/v1/' + path, {
      ...opts,
      headers: { ...headers(), ...(opts.headers || {}) },
    }).then(r => r.ok ? r.json() : r.json().then(e => { throw e; }));

  const auth = (path, body) =>
    fetch(SUPABASE_URL + '/auth/v1/' + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON },
      body: JSON.stringify(body),
    }).then(r => r.json());

  return {
    signUp:  (email, pass) => auth('signup',  { email, password: pass }),
    signIn:  (email, pass) => auth('token?grant_type=password', { email, password: pass }),
    signOut: () => fetch(SUPABASE_URL + '/auth/v1/logout', { method: 'POST', headers: headers() }),
    getUser: () => fetch(SUPABASE_URL + '/auth/v1/user', { headers: headers() }).then(r => r.ok ? r.json() : null),
    refreshToken: (refresh_token) => auth('token?grant_type=refresh_token', { refresh_token }),

    // Upsert entire user data blob (one row per user in user_data table)
    saveData: (uid, blob) => fetch(SUPABASE_URL + '/rest/v1/user_data', {
      method: 'POST',
      headers: {
        ...headers(),
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({ user_id: uid, data: blob, updated_at: new Date().toISOString() }),
    }).then(r => r.ok ? true : false),

    loadData: (uid) => rest('user_data?user_id=eq.' + uid + '&select=data,updated_at')
      .then(rows => rows && rows[0] ? rows[0] : null)
      .catch(() => null),
  };
})();

// ── Auth state ────────────────────────────────────────────────────────────────
const AUTH = {
  user: null,
  token: null,
  refreshToken: null,
  _listeners: [],

  async load() {
    try {
      const raw = localStorage.getItem('faluche_auth');
      if (!raw) return;
      const saved = JSON.parse(raw);
      this.token = saved.token;
      this.refreshToken = saved.refresh;
      this.user = saved.user;
    } catch(e) {}
  },

  save() {
    if (this.user) {
      localStorage.setItem('faluche_auth', JSON.stringify({
        token: this.token, refresh: this.refreshToken, user: this.user
      }));
    } else {
      localStorage.removeItem('faluche_auth');
    }
  },

  async refresh() {
    if (!this.refreshToken) return false;
    try {
      const r = await SB.refreshToken(this.refreshToken);
      if (r.access_token) {
        this.token = r.access_token;
        this.refreshToken = r.refresh_token || this.refreshToken;
        this.save();
        return true;
      }
    } catch(e) {}
    return false;
  },

  async signIn(email, pass) {
    const r = await SB.signIn(email, pass);
    if (r.error) throw new Error(r.error.message || r.error_description || 'Erreur de connexion');
    this.token = r.access_token;
    this.refreshToken = r.refresh_token;
    this.user = r.user || { id: r.user_id, email };
    this.save();
    this._notify();
    return this.user;
  },

  async signUp(email, pass) {
    const r = await SB.signUp(email, pass);
    if (r.error) throw new Error(r.error.message || 'Erreur de création de compte');
    // Auto sign in after signup
    return this.signIn(email, pass);
  },

  async signOut() {
    try { await SB.signOut(); } catch(e) {}
    this.user = null; this.token = null; this.refreshToken = null;
    this.save();
    this._notify();
  },

  isLoggedIn() { return !!this.user && !!this.token; },

  onChange(fn) { this._listeners.push(fn); },
  _notify() { this._listeners.forEach(fn => fn(this.user)); },
};

// ── Sync engine ───────────────────────────────────────────────────────────────
const SYNC = {
  _pending: false,
  _lastSync: null,
  _timer: null,

  // Collect all local data into one blob
  async collectLocalData() {
    const [qstats, sessions, songs, customQuestions] = await Promise.all([
      getAllQStats(),
      getSessions(500),
      getAllSongs(),
      getAllCustomQuestions(),
    ]);
    return {
      qstats,
      sessions,
      songs,
      customQuestions,
      exportedAt: Date.now(),
    };
  },

  // Apply cloud blob to local DB (merge strategy: cloud wins on conflict by timestamp)
  async applyCloudData(blob) {
    if (!blob) return;
    try {
      // Songs: replace local songs with cloud songs
      if (blob.songs && Array.isArray(blob.songs)) {
        await clearAllSongs();
        for (const s of blob.songs) await putSong(s);
      }
      // Custom questions: replace local with cloud
      if (blob.customQuestions && Array.isArray(blob.customQuestions)) {
        await clearAllCustomQuestions();
        for (const q of blob.customQuestions) await putCustomQuestion(q);
      }
      // qstats: merge (take max seen/correct/wrong per question)
      if (blob.qstats) {
        const local = await getAllQStats();
        for (const [id, remote] of Object.entries(blob.qstats)) {
          const loc = local[id] || { id, seen:0, correct:0, partial:0, wrong:0 };
          await putQStat({
            id,
            seen:    Math.max(loc.seen || 0,    remote.seen || 0),
            correct: Math.max(loc.correct || 0, remote.correct || 0),
            partial: Math.max(loc.partial || 0, remote.partial || 0),
            wrong:   Math.max(loc.wrong || 0,   remote.wrong || 0),
            lastSeen: remote.lastSeen || loc.lastSeen,
          });
        }
      }
      // Sessions: append any remote sessions not in local (by ts)
      if (blob.sessions && Array.isArray(blob.sessions)) {
        const local = await getSessions(500);
        const localTs = new Set(local.map(s => s.ts));
        for (const s of blob.sessions) {
          if (!localTs.has(s.ts)) await saveSession(s);
        }
      }
    } catch(e) {
      console.warn('applyCloudData error:', e);
    }
  },

  async push() {
    if (!AUTH.isLoggedIn() || !navigator.onLine) return;
    try {
      const blob = await this.collectLocalData();
      const ok = await SB.saveData(AUTH.user.id, blob);
      if (ok) {
        this._lastSync = Date.now();
        this._pending = false;
        SYNC_STATE.lastSync = this._lastSync;
        SYNC_STATE.status = 'synced';
        renderSyncIndicator();
      }
    } catch(e) {
      SYNC_STATE.status = 'error';
      renderSyncIndicator();
      // Try token refresh once
      if (e.message && e.message.includes('401')) {
        await AUTH.refresh();
      }
    }
  },

  async pull() {
    if (!AUTH.isLoggedIn() || !navigator.onLine) return null;
    try {
      const row = await SB.loadData(AUTH.user.id);
      if (row && row.data) {
        await this.applyCloudData(row.data);
        this._lastSync = Date.now();
        SYNC_STATE.lastSync = this._lastSync;
        SYNC_STATE.status = 'synced';
        renderSyncIndicator();
        return row.data;
      }
    } catch(e) {
      console.warn('pull error:', e);
    }
    return null;
  },

  markDirty() {
    this._pending = true;
    SYNC_STATE.status = 'pending';
    renderSyncIndicator();
    clearTimeout(this._timer);
    this._timer = setTimeout(() => this.push(), 3000);
  },

  startAutoSync() {
    // Sync every 5 minutes if online
    setInterval(() => {
      if (navigator.onLine && AUTH.isLoggedIn() && this._pending) {
        this.push();
      }
    }, 5 * 60 * 1000);

    // Sync on coming back online
    window.addEventListener('online', () => {
      if (AUTH.isLoggedIn()) {
        SYNC_STATE.status = 'syncing';
        renderSyncIndicator();
        this.push();
      }
    });

    window.addEventListener('offline', () => {
      SYNC_STATE.status = 'offline';
      renderSyncIndicator();
    });
  },
};

// ── Sync status indicator (top bar) ──────────────────────────────────────────
const SYNC_STATE = { status: 'idle', lastSync: null };

function renderSyncIndicator() {
  const el = document.getElementById('syncIndicator');
  if (!el) return;
  const icons = { idle:'', synced:'☁️', pending:'⏳', syncing:'🔄', error:'⚠️', offline:'📵' };
  const labels = {
    idle: AUTH.isLoggedIn() ? AUTH.user.email.split('@')[0] : 'Non connecté',
    synced: 'Sauvegardé',
    pending: 'À sync...',
    syncing: 'Sync...',
    error: 'Erreur sync',
    offline: 'Hors ligne',
  };
  el.textContent = (icons[SYNC_STATE.status] || '') + ' ' + (labels[SYNC_STATE.status] || '');
  el.style.color = SYNC_STATE.status === 'error' ? '#f44336'
    : SYNC_STATE.status === 'synced' ? '#4CAF50'
    : SYNC_STATE.status === 'offline' ? '#FF9800'
    : '#888';
}
