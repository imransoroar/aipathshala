/* CLI seeder: resets the data file and loads demo data.  Run: npm run seed */
const fs = require('fs');
const path = require('path');
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(DB_FILE, '{}'); // reset (overwrite avoids unlink perms)

const db = require('./db');
const { seedDatabase } = require('./seed-core');
db.load();
const r = seedDatabase(db);
db.persistNow();
console.log('Seed complete.');
console.log('  Admin   -> admin@aipathshala.com / admin123');
console.log('  Student -> student@aipathshala.com / student123');
console.log('  Courses:', r.courses, ' Lessons:', r.lessons);
