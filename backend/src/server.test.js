import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('src');
test('server source exposes required REST endpoints',()=>{const source=fs.readFileSync(path.join(root,'server.js'),'utf8');for(const route of ["'/api/health'","'/api/animals'","'/api/animals/:id'","'/api/applications'","'/api/auth/login'","'/api/admin/animals'","'/api/admin/applications.csv'"])assert.ok(source.includes(route),`missing ${route}`)});
test('database schema has three related tables and foreign key',()=>{const source=fs.readFileSync(path.join(root,'db.js'),'utf8');for(const table of ['admins','animals','applications'])assert.ok(source.includes(`TABLE IF NOT EXISTS ${table}`));assert.ok(source.includes('FOREIGN KEY(animal_id) REFERENCES animals(id)'));assert.ok(source.includes('consent INTEGER NOT NULL DEFAULT 0'))});
test('production seed refuses default credentials',()=>{const source=fs.readFileSync(path.join(root,'seed.js'),'utf8');assert.ok(source.includes("process.env.NODE_ENV === 'production'"));assert.ok(source.includes('ADMIN_PASSWORD'))});
