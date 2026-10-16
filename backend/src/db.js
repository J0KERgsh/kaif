import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config();
const file = path.resolve(process.env.DATABASE_FILE || './data.sqlite');
fs.mkdirSync(path.dirname(file), { recursive: true });
export const db = new DatabaseSync(file);
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS admins (
 id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS animals (
 id INTEGER PRIMARY KEY, name TEXT NOT NULL, species TEXT NOT NULL CHECK(species IN ('Кошка','Собака')),
 breed TEXT NOT NULL DEFAULT 'Метис', age_months INTEGER NOT NULL DEFAULT 12 CHECK(age_months >= 0),
 sex TEXT NOT NULL DEFAULT 'Не указан', description TEXT NOT NULL DEFAULT '',
 image_url TEXT NOT NULL DEFAULT '/images/dog-hero.svg', gallery_json TEXT NOT NULL DEFAULT '[]', health TEXT NOT NULL DEFAULT 'Осмотрен ветеринаром',
 status TEXT NOT NULL DEFAULT 'Ищет дом' CHECK(status IN ('Ищет дом','На лечении','Нашёл дом')),
 featured INTEGER NOT NULL DEFAULT 0 CHECK(featured IN (0,1)), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS applications (
 id INTEGER PRIMARY KEY, animal_id INTEGER NOT NULL, applicant_name TEXT NOT NULL,
 phone TEXT NOT NULL, email TEXT NOT NULL, message TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'Новая' CHECK(status IN ('Новая','В работе','Одобрена','Отклонена')),
 consent INTEGER NOT NULL DEFAULT 0 CHECK(consent IN (0,1)),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(animal_id) REFERENCES animals(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_animals_species ON animals(species);
CREATE INDEX IF NOT EXISTS idx_animals_status ON animals(status);
CREATE INDEX IF NOT EXISTS idx_animals_age ON animals(age_months);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
`);
// Safe schema upgrade for databases created by the earlier project version.
const animalColumns = db.prepare('PRAGMA table_info(animals)').all().map(c => c.name);
if (!animalColumns.includes('featured')) db.exec('ALTER TABLE animals ADD COLUMN featured INTEGER NOT NULL DEFAULT 0');
if (!animalColumns.includes('gallery_json')) db.exec("ALTER TABLE animals ADD COLUMN gallery_json TEXT NOT NULL DEFAULT '[]'");
const applicationColumns = db.prepare('PRAGMA table_info(applications)').all().map(c => c.name);
if (!applicationColumns.includes('consent')) db.exec('ALTER TABLE applications ADD COLUMN consent INTEGER NOT NULL DEFAULT 0');
