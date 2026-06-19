/*
 * Lightweight JSON-file data store.
 * -------------------------------------------------------------
 * Zero native dependencies, so the app runs on any host with no
 * compile step. All collections live in one JSON file on disk and
 * are kept in memory for fast reads. Writes are debounced + atomic
 * (write to a temp file, then rename).
 *
 * The store is isolated behind a small API (find / findOne / insert
 * / update / remove) so a production deployment can swap the engine
 * for PostgreSQL / MySQL without touching route handlers.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const COLLECTIONS = [
  'users', 'courses', 'lessons', 'enrollments',
  'orders', 'reviews', 'categories',
];

function emptyDb() {
  const db = { _meta: { seq: {} } };
  for (const c of COLLECTIONS) db[c] = [];
  return db;
}

let store = emptyDb();

function load() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      store = Object.assign(emptyDb(), JSON.parse(raw || '{}'));
      if (!store._meta) store._meta = { seq: {} };
      if (!store._meta.seq) store._meta.seq = {};
    } else {
      persistNow();
    }
  } catch (err) {
    console.error('[db] failed to load, starting empty:', err.message);
    store = emptyDb();
  }
}

let persistTimer = null;
function persist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => { persistTimer = null; persistNow(); }, 50);
}

function persistNow() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const json = JSON.stringify(store, null, 2);
    const tmp = DB_FILE + '.tmp';
    try {
      fs.writeFileSync(tmp, json);
      fs.renameSync(tmp, DB_FILE); // atomic where supported
    } catch (e) {
      // Some filesystems (e.g. Windows over existing file) block rename; overwrite directly.
      fs.writeFileSync(DB_FILE, json);
      try { fs.unlinkSync(tmp); } catch (_e) {}
    }
  } catch (err) {
    console.error('[db] persist failed:', err.message);
  }
}

function nextId(collection) {
  const seq = store._meta.seq;
  seq[collection] = (seq[collection] || 0) + 1;
  return seq[collection];
}

function matches(item, query) {
  return Object.keys(query).every((k) => item[k] === query[k]);
}

const api = {
  load,
  persistNow,
  raw: () => store,
  all(collection) { return store[collection].slice(); },
  find(collection, query = {}) { return store[collection].filter((it) => matches(it, query)); },
  findOne(collection, query = {}) { return store[collection].find((it) => matches(it, query)) || null; },
  findById(collection, id) { return store[collection].find((it) => it.id === Number(id)) || null; },
  insert(collection, doc) {
    const now = new Date().toISOString();
    const record = { id: nextId(collection), createdAt: now, updatedAt: now, ...doc };
    if (!record.id) record.id = nextId(collection);
    store[collection].push(record);
    persist();
    return record;
  },
  update(collection, id, patch) {
    const item = api.findById(collection, id);
    if (!item) return null;
    Object.assign(item, patch, { updatedAt: new Date().toISOString() });
    persist();
    return item;
  },
  remove(collection, id) {
    const idx = store[collection].findIndex((it) => it.id === Number(id));
    if (idx === -1) return false;
    store[collection].splice(idx, 1);
    persist();
    return true;
  },
  count(collection, query = {}) { return api.find(collection, query).length; },
};

module.exports = api;
