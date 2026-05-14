// ── DB.JS — IndexedDB persistence layer ──────────────────────────────────────
const DB_NAME = 'faluche_quiz';
const DB_VERSION = 1;

let _db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      // stats per question
      if (!db.objectStoreNames.contains('qstats')) {
        db.createObjectStore('qstats', { keyPath: 'id' });
      }
      // session history
      if (!db.objectStoreNames.contains('sessions')) {
        const ss = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        ss.createIndex('ts', 'ts');
      }
      // settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
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
