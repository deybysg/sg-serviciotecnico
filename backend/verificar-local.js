import 'dotenv/config';
import { Pool } from 'pg';

async function verificarLocal() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'servicio_tecnico',
    user: 'postgres',
    password: 'deyby1234',
    ssl: false
  });
  const client = await pool.connect();
  try {
    const tablas = ['usuarios', 'productos', 'clientes', 'servicios', 'ventas', 'carts'];
    console.log('=== Verificación de PostgreSQL LOCAL ===\n');
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

verificarLocal();
