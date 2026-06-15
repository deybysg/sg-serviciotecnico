import 'dotenv/config';
import { initDb } from '../src/database/initDb.js';
import { isPostgres } from '../src/config/dbProvider.js';
import { getPool } from '../src/database/postgres.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Usuarios from '../src/models/usuariosSchema.js';

(async () => {
  try {
    await initDb();
    const newPass = process.argv[2];
    if (!newPass) {
      console.error('Uso: npm run set-superadmin -- <nueva_contraseña>');
      process.exit(1);
    }
    if (newPass.length < 6) {
      console.error('Error: la contraseña debe tener al menos 6 caracteres.');
      process.exit(1);
    }

    const hash = await bcrypt.hash(newPass, 10);

    if (isPostgres()) {
      const pool = getPool();
      const { rows } = await pool.query('SELECT * FROM usuarios WHERE role = $1 AND is_protected = true LIMIT 1', ['superadmin']);
      let user = rows[0];
      if (!user) {
        const { rows: fallback } = await pool.query('SELECT * FROM usuarios WHERE role = $1 LIMIT 1', ['superadmin']);
        user = fallback[0];
      }
      if (!user) {
        console.error('No se encontró un usuario con rol superadmin en PostgreSQL.');
        process.exit(1);
      }
      await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hash, user.id]);
      console.log(`✅ Contraseña actualizada para el superadmin: ${user.username}`);
    } else {
      let user = await Usuarios.findOne({ role: 'superadmin', isProtected: true });
      if (!user) {
        user = await Usuarios.findOne({ role: 'superadmin' });
      }
      if (!user) {
        console.error('No se encontró un usuario con rol superadmin en MongoDB.');
        process.exit(1);
      }
      user.password = hash;
      await user.save();
      console.log(`✅ Contraseña actualizada para el superadmin: ${user.username}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al actualizar la contraseña del superadmin:', err.message);
    process.exit(1);
  } finally {
    try { await mongoose.disconnect(); } catch {}
    try {
      const { getPool } = await import('../src/database/postgres.js');
      const pool = getPool();
      await pool.end();
    } catch {}
  }
})();
