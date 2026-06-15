import 'dotenv/config';
import { getPool } from './src/database/postgres.js';

async function pruebaDirecta() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    // Contar productos antes
    const before = await client.query('SELECT COUNT(*) as count FROM productos');
    console.log('Productos ANTES:', before.rows[0].count);

    // Insertar un producto de prueba directamente
    const { rows } = await client.query(`
      INSERT INTO productos (nombre, categoria, precio, stock, descripcion, imagen)
      VALUES ('Producto Test Directo', 'Test', 99.99, 5, 'Prueba directa a Render', 'https://via.placeholder.com/150')
      RETURNING id
    `);
    console.log('Producto insertado ID:', rows[0].id);

    // Contar productos después
    const after = await client.query('SELECT COUNT(*) as count FROM productos');
    console.log('Productos DESPUÉS:', after.rows[0].count);

    // Verificar que el producto está en Render
    const producto = await client.query('SELECT * FROM productos WHERE id = $1', [rows[0].id]);
    console.log('Producto encontrado:', producto.rows[0]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

pruebaDirecta();
