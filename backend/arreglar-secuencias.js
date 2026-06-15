import 'dotenv/config';
import { getPool } from './src/database/postgres.js';

async function arreglarSecuencias() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    console.log('=== Arreglando secuencias de PostgreSQL ===\n');

    const tablas = [
      { tabla: 'usuarios', columna: 'id', seq: 'usuarios_id_seq' },
      { tabla: 'productos', columna: 'id', seq: 'productos_id_seq' },
      { tabla: 'clientes', columna: 'id', seq: 'clientes_id_seq' },
      { tabla: 'servicios', columna: 'id', seq: 'servicios_id_seq' },
      { tabla: 'ventas', columna: 'id', seq: 'ventas_id_seq' }
    ];

    for (const { tabla, columna, seq } of tablas) {
      try {
        await client.query(`
          SELECT setval('${seq}', COALESCE((SELECT MAX(${columna}) FROM ${tabla}), 0) + 1, false)
        `);
        const result = await client.query(`SELECT last_value FROM ${seq}`);
        console.log(`✅ ${tabla}: secuencia ajustada a ${result.rows[0].last_value}`);
      } catch (e) {
        console.log(`❌ ${tabla}: ${e.message}`);
      }
    }

    console.log('\n🎉 Secuencias arregladas. Ahora podés crear datos nuevos sin errores.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

arreglarSecuencias();
