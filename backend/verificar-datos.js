import 'dotenv/config';
import { getPool } from './src/database/postgres.js';

async function verificarDatos() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    const tablas = ['usuarios', 'productos', 'clientes', 'servicios', 'ventas', 'carts'];
    console.log('=== Verificación de datos en PostgreSQL (Render) ===\n');
    for (const tabla of tablas) {
      try {
        const count = await client.query(`SELECT COUNT(*) FROM ${tabla}`);
        console.log(`📦 ${tabla}: ${count.rows[0].count} registros`);
      } catch (e) {
        console.log(`❌ ${tabla}: ${e.message}`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

verificarDatos();
