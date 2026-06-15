require('dotenv').config();
const { Pool } = require('pg');

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  console.log('DATABASE_URL:', connectionString ? '***configurada***' : 'NO CONFIGURADA');
  console.log('DB_PROVIDER:', process.env.DB_PROVIDER);

  if (!connectionString) {
    console.error('No hay DATABASE_URL');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('render.com') ? { rejectUnauthorized: false } : false
  });

  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, version();');
    console.log('✅ Conexión exitosa a PostgreSQL');
    console.log('📅 Hora del servidor:', result.rows[0].now);
    console.log('🔧 Versión:', result.rows[0].version);
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
