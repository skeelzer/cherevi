// ── DB.JS — IndexedDB persistence layer ──────────────────────────────────────
const DB_NAME = 'faluche_quiz';
const DB_VERSION = 2;

let _db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('qstats')) {
        db.createObjectStore('qstats', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('sessions')) {
        const ss = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        ss.createIndex('ts', 'ts');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      // v2: user-defined songs
      if (!db.objectStoreNames.contains('songs_data')) {
        db.createObjectStore('songs_data', { keyPath: 'id' });
      }
    };
    req.onsuccess = e => { _db = e.target.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

function tx(store, mode = 'readonly') {
  return _db.transaction(store, mode).objectStore(store);
}

// ── Question stats ────────────────────────────────────────────────────────────
async function getQStats(id) {
  await openDB();
  return new Promise(resolve => {
    const req = tx('qstats').get(id);
    req.onsuccess = () => resolve(req.result || { id, correct: 0, partial: 0, wrong: 0, seen: 0, lastSeen: null });
  });
}

async function getAllQStats() {
  await openDB();
  return new Promise(resolve => {
    const all = {};
    const req = tx('qstats').openCursor();
    req.onsuccess = e => {
      const cur = e.target.result;
      if (cur) { all[cur.value.id] = cur.value; cur.continue(); }
      else resolve(all);
    };
  });
}

async function updateQStat(id, result) {
  await openDB();
  const stat = await getQStats(id);
  stat[result] = (stat[result] || 0) + 1;
  stat.seen = (stat.seen || 0) + 1;
  stat.lastSeen = Date.now();
  return new Promise(resolve => {
    const req = tx('qstats', 'readwrite').put(stat);
    req.onsuccess = () => resolve();
  });
}

async function resetAllStats() {
  await openDB();
  return new Promise(resolve => {
    const req = tx('qstats', 'readwrite').clear();
    req.onsuccess = () => resolve();
  });
}

// ── Sessions ──────────────────────────────────────────────────────────────────
async function saveSession(session) {
  await openDB();
  return new Promise(resolve => {
    const req = tx('sessions', 'readwrite').add(session);
    req.onsuccess = () => resolve(req.result);
  });
}

async function getSessions(limit = 30) {
  await openDB();
  return new Promise(resolve => {
    const sessions = [];
    const req = tx('sessions').index('ts').openCursor(null, 'prev');
    req.onsuccess = e => {
      const cur = e.target.result;
      if (cur && sessions.length < limit) { sessions.push(cur.value); cur.continue(); }
      else resolve(sessions);
    };
  });
}

async function clearSessions() {
  await openDB();
  return new Promise(resolve => {
    tx('sessions', 'readwrite').clear().onsuccess = () => resolve();
  });
}

// ── Songs CRUD ────────────────────────────────────────────────────────────────
// Songs are stored in their own object store: { id, title, level, addedAt }

async function getAllSongs() {
  await openDB();
  // Migrate: ensure 'songs' store exists (added in v2 if needed)
  return new Promise(resolve => {
    const songs = [];
    try {
      const req = tx('songs_data').openCursor();
      req.onsuccess = e => {
        const cur = e.target.result;
        if (cur) { songs.push(cur.value); cur.continue(); }
        else resolve(songs.sort((a,b) => a.title.localeCompare(b.title, 'fr')));
      };
      req.onerror = () => resolve([]);
    } catch(e) { resolve([]); }
  });
}

async function addSong(title) {
  await openDB();
  const id = 'song_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
  const song = { id, title: title.trim(), level: 0, addedAt: Date.now() };
  return new Promise(resolve => {
    tx('songs_data', 'readwrite').add(song).onsuccess = () => resolve(song);
  });
}

async function updateSongLevel(id, level) {
  await openDB();
  return new Promise(resolve => {
    const store = tx('songs_data', 'readwrite');
    const req = store.get(id);
    req.onsuccess = () => {
      const song = req.result;
      if (!song) return resolve();
      song.level = level;
      store.put(song).onsuccess = () => resolve();
    };
  });
}

async function updateSongTitle(id, title) {
  await openDB();
  return new Promise(resolve => {
    const store = tx('songs_data', 'readwrite');
    const req = store.get(id);
    req.onsuccess = () => {
      const song = req.result;
      if (!song) return resolve();
      song.title = title.trim();
      store.put(song).onsuccess = () => resolve();
    };
  });
}

async function deleteSong(id) {
  await openDB();
  return new Promise(resolve => {
    tx('songs_data', 'readwrite').delete(id).onsuccess = () => resolve();
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────
async function getSetting(key, def) {
  await openDB();
  return new Promise(resolve => {
    const req = tx('settings').get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : def);
  });
}

async function setSetting(key, value) {
  await openDB();
  return new Promise(resolve => {
    tx('settings', 'readwrite').put({ key, value }).onsuccess = () => resolve();
  });
}

// ── Extra DB functions needed by sync ─────────────────────────────────────────
async function clearAllSongs() {
  await openDB();
  return new Promise(resolve => {
    tx('songs_data', 'readwrite').clear().onsuccess = () => resolve();
  });
}

async function putSong(song) {
  await openDB();
  return new Promise(resolve => {
    tx('songs_data', 'readwrite').put(song).onsuccess = () => resolve();
  });
}

async function putQStat(stat) {
  await openDB();
  return new Promise(resolve => {
    tx('qstats', 'readwrite').put(stat).onsuccess = () => resolve();
  });
}
