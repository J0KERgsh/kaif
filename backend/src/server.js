import { backup } from 'node:sqlite';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { db } from './db.js';
dotenv.config();
const app = express();
const PORT = Number(process.env.PORT || 4000);
const SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-secret-change-before-deploy');
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(uploadDir, { recursive: true });
if (process.env.NODE_ENV === 'production' && SECRET.length < 32) console.warn('WARNING: set a JWT_SECRET of at least 32 characters in production.');
app.disable('x-powered-by');
const allowedOrigins = process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',').map(s => s.trim()) : null;
app.use(cors({ origin: (origin, callback) => { if (!origin || !allowedOrigins || allowedOrigins.includes(origin)) return callback(null, true); return callback(new Error('Origin is not allowed by CORS')); } }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(uploadDir, { fallthrough: false, maxAge: '1d' }));
const storage = multer.diskStorage({
 destination: (_req, _file, cb) => cb(null, uploadDir),
 filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});
const upload = multer({ storage, limits: { fileSize: 4 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, cb) => {
  const allowed = new Map([['image/jpeg','.jpg'],['image/png','.png'],['image/webp','.webp']]);
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.has(file.mimetype) || allowed.get(file.mimetype) !== ext) return cb(new Error('Разрешены только JPG, PNG и WebP'));
  cb(null, true);
}});
const fields = 'id,name,species,breed,age_months,sex,description,image_url,gallery_json,health,status,featured,created_at';
function auth(req, res, next) {
 const header = req.headers.authorization || '';
 const token = header.startsWith('Bearer ') ? header.slice(7) : '';
 if (!token || !SECRET) return res.status(401).json({ error: 'Требуется авторизация' });
 try { req.admin = jwt.verify(token, SECRET); next(); } catch { return res.status(401).json({ error: 'Сессия истекла. Войдите снова.' }); }
}
function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '')); }
function intInRange(value, min, max, fallback) { const n = Number.parseInt(value, 10); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback; }
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Доброе Сердце API' }));
app.get('/api/animals', (req, res) => {
 const where = [], params = [];
 const q = String(req.query.q || '').trim().slice(0, 100);
 const species = String(req.query.species || '');
 const sex = String(req.query.sex || '');
 const status = String(req.query.status || '');
 const breed = String(req.query.breed || '').trim().slice(0, 80);
 if (q) { where.push('(name LIKE ? OR breed LIKE ? OR description LIKE ?)'); params.push(`%${q}%`,`%${q}%`,`%${q}%`); }
 if (['Кошка','Собака'].includes(species)) { where.push('species=?'); params.push(species); }
 if (['Мальчик','Девочка','Не указан'].includes(sex)) { where.push('sex=?'); params.push(sex); }
 if (['Ищет дом','На лечении','Нашёл дом'].includes(status)) { where.push('status=?'); params.push(status); }
 if (breed) { where.push('breed LIKE ?'); params.push(`%${breed}%`); }
 if (req.query.minAge !== undefined) { where.push('age_months >= ?'); params.push(intInRange(req.query.minAge,0,600,0)); }
 if (req.query.maxAge !== undefined) { where.push('age_months <= ?'); params.push(intInRange(req.query.maxAge,0,600,600)); }
 const allowedSort = new Map([['newest','id DESC'],['name','name COLLATE NOCASE ASC'],['age','age_months ASC'],['oldest','id ASC']]);
 const order = allowedSort.get(String(req.query.sort || 'newest')) || 'id DESC';
 const page = intInRange(req.query.page,1,100000,1), limit = intInRange(req.query.limit,1,50,9), offset = (page-1)*limit;
 const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
 const total = db.prepare(`SELECT COUNT(*) count FROM animals ${clause}`).get(...params).count;
 const data = db.prepare(`SELECT ${fields} FROM animals ${clause} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...params,limit,offset);
 res.json({ data, total, page, limit, pages: Math.ceil(total/limit) });
});
app.get('/api/animals/:id', (req, res) => {
 const id = Number(req.params.id); if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Некорректный ID' });
 const animal = db.prepare(`SELECT ${fields} FROM animals WHERE id=?`).get(id);
 return animal ? res.json(animal) : res.status(404).json({ error: 'Животное не найдено' });
});
app.post('/api/applications', (req, res) => {
 const b = req.body || {};
 const name = String(b.applicant_name || '').trim(), phone = String(b.phone || '').trim(), email = String(b.email || '').trim().toLowerCase();
 const animalId = Number(b.animal_id);
 if (name.length < 2 || name.length > 120) return res.status(400).json({ error: 'Имя должно содержать от 2 до 120 символов' });
 if (!/^[+0-9()\-\s]{7,24}$/.test(phone)) return res.status(400).json({ error: 'Укажите корректный номер телефона' });
 if (!validEmail(email) || email.length > 160) return res.status(400).json({ error: 'Укажите корректный e-mail' });
 if (b.consent !== true) return res.status(400).json({ error: 'Необходимо согласие на обработку персональных данных' });
 if (!Number.isSafeInteger(animalId) || animalId < 1) return res.status(400).json({ error: 'Выберите питомца' });
 const animal = db.prepare('SELECT id,status FROM animals WHERE id=?').get(animalId);
 if (!animal || animal.status !== 'Ищет дом') return res.status(400).json({ error: 'Питомец недоступен для усыновления' });
 const result = db.prepare('INSERT INTO applications(animal_id,applicant_name,phone,email,message,consent) VALUES(?,?,?,?,?,?)').run(animalId,name,phone,email,String(b.message||'').trim().slice(0,2000),1);
 res.status(201).json({ id: Number(result.lastInsertRowid), message: 'Заявка отправлена. Спасибо за заботу!' });
});
app.post('/api/auth/login', (req, res) => {
 const email = String(req.body?.email || '').trim().toLowerCase(), password = String(req.body?.password || '');
 if (!email || !password || !validEmail(email)) return res.status(400).json({ error: 'Введите корректный e-mail и пароль' });
 const admin = db.prepare('SELECT * FROM admins WHERE email=?').get(email);
 if (!admin || !bcrypt.compareSync(password, admin.password_hash)) return res.status(401).json({ error: 'Неверный логин или пароль' });
 res.json({ token: jwt.sign({ id: admin.id, email: admin.email }, SECRET, { expiresIn: '8h' }), admin: { id: admin.id, email: admin.email } });
});
app.get('/api/admin/animals', auth, (_req,res) => res.json(db.prepare(`SELECT ${fields} FROM animals ORDER BY id DESC`).all()));
app.post('/api/admin/animals', auth, upload.array('images', 6), (req,res) => {
 const b = req.body || {};
 const name = String(b.name || '').trim(), species = String(b.species || ''), status = String(b.status || 'Ищет дом');
 if (name.length < 2 || name.length > 100 || !['Кошка','Собака'].includes(species) || !['Ищет дом','На лечении','Нашёл дом'].includes(status)) return res.status(400).json({ error: 'Проверьте имя, вид и статус животного' });
 const age = Number(b.age_months ?? 12);
 if (!Number.isInteger(age) || age < 0 || age > 600) return res.status(400).json({ error: 'Возраст должен быть от 0 до 600 месяцев' });
 const gallery = (req.files || []).map(file => `/uploads/${file.filename}`);
 const imageUrl = gallery[0] || String(b.image_url||'/images/dog-hero.svg');
 const result = db.prepare('INSERT INTO animals(name,species,breed,age_months,sex,description,image_url,gallery_json,health,status,featured) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(name,species,String(b.breed||'Метис').slice(0,100),age,String(b.sex||'Не указан'),String(b.description||'').slice(0,3000),imageUrl,JSON.stringify(gallery.length ? gallery : [imageUrl]),String(b.health||'Не указан').slice(0,300),status,b.featured==='true'||b.featured===true?1:0);
 res.status(201).json(db.prepare(`SELECT ${fields} FROM animals WHERE id=?`).get(Number(result.lastInsertRowid)));
});
app.patch('/api/admin/animals/:id', auth, (req,res) => {
 const id = Number(req.params.id), animal = db.prepare(`SELECT ${fields} FROM animals WHERE id=?`).get(id);
 if (!animal) return res.status(404).json({ error: 'Животное не найдено' });
 const b = { ...animal, ...(req.body || {}) };
 if (String(b.name).trim().length < 2 || !['Кошка','Собака'].includes(b.species) || !['Ищет дом','На лечении','Нашёл дом'].includes(b.status)) return res.status(400).json({ error: 'Некорректные данные животного' });
 const age = Number(b.age_months); if (!Number.isInteger(age)||age<0||age>600) return res.status(400).json({ error: 'Некорректный возраст' });
 db.prepare('UPDATE animals SET name=?,species=?,breed=?,age_months=?,sex=?,description=?,image_url=?,gallery_json=?,health=?,status=?,featured=? WHERE id=?').run(String(b.name).trim().slice(0,100),b.species,String(b.breed||'Метис').slice(0,100),age,String(b.sex||'Не указан'),String(b.description||'').slice(0,3000),String(b.image_url||'/images/dog-hero.svg'),String(b.gallery_json||JSON.stringify([b.image_url||'/images/dog-hero.svg'])),String(b.health||'').slice(0,300),b.status,b.featured?1:0,id);
 res.json(db.prepare(`SELECT ${fields} FROM animals WHERE id=?`).get(id));
});
app.delete('/api/admin/animals/:id', auth, (req,res) => { const id=Number(req.params.id); const result=db.prepare('DELETE FROM animals WHERE id=?').run(id); return result.changes ? res.status(204).end() : res.status(404).json({error:'Животное не найдено'}); });
app.get('/api/applications', auth, (_req,res) => res.json(db.prepare('SELECT a.*,an.name animal_name FROM applications a JOIN animals an ON an.id=a.animal_id ORDER BY a.id DESC').all()));
app.patch('/api/applications/:id', auth, (req,res) => {
 const status=String(req.body?.status||''); if(!['Новая','В работе','Одобрена','Отклонена'].includes(status))return res.status(400).json({error:'Некорректный статус'});
 const result=db.prepare('UPDATE applications SET status=? WHERE id=?').run(status,Number(req.params.id));
 return result.changes?res.json(db.prepare('SELECT * FROM applications WHERE id=?').get(Number(req.params.id))):res.status(404).json({error:'Заявка не найдена'});
});
app.get('/api/admin/applications.csv', auth, (_req,res) => {
 const rows=db.prepare('SELECT a.id,a.created_at,a.applicant_name,a.phone,a.email,an.name animal,a.status FROM applications a JOIN animals an ON an.id=a.animal_id ORDER BY a.id DESC').all();
 const esc=v=>`"${String(v??'').replaceAll('"','""')}"`;
 res.setHeader('Content-Type','text/csv; charset=utf-8'); res.setHeader('Content-Disposition','attachment; filename="applications.csv"');
 res.send('\uFEFF'+['id,created_at,applicant_name,phone,email,animal,status',...rows.map(r=>Object.values(r).map(esc).join(','))].join('\r\n'));
});
app.use((err,_req,res,_next) => { console.error(err); const msg=err instanceof multer.MulterError ? (err.code==='LIMIT_FILE_SIZE'?'Файл должен быть меньше 4 МБ':'Ошибка загрузки файла') : (err.message==='Разрешены только JPG, PNG и WebP'?err.message:'Внутренняя ошибка сервера'); res.status(err instanceof multer.MulterError || msg==='Разрешены только JPG, PNG и WebP'?400:500).json({error:msg}); });
async function backupDatabase() {
 const dir = path.resolve(process.env.BACKUP_DIR || './backups'); fs.mkdirSync(dir, { recursive: true });
 const stamp = new Date().toISOString().replace(/[:.]/g, '-'); await backup(db, path.join(dir, `dobroe-serdtse-${stamp}.sqlite`));
 const files = fs.readdirSync(dir).filter(name => name.endsWith('.sqlite')).sort().reverse(); for (const old of files.slice(7)) fs.rmSync(path.join(dir, old), { force: true });
}
if (process.env.NODE_ENV !== 'test') { app.listen(PORT, () => console.log(`Доброе Сердце API: http://localhost:${PORT}`)); backupDatabase().catch(err => console.error('Не удалось создать резервную копию:', err.message)); const timer = setInterval(() => backupDatabase().catch(err => console.error('Не удалось создать резервную копию:', err.message)), 24 * 60 * 60 * 1000); timer.unref(); }
export { app };
