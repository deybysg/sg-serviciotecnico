import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';

let pool = null;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;
    
    if (connectionString) {
      pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
      });
    } else {
      pool = new Pool({
        host: process.env.PGHOST || 'localhost',
        port: process.env.PGPORT || 5432,
        database: process.env.PGDATABASE || 'ServicioTecnico',
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        ssl: { rejectUnauthorized: false }
      });
    }
  }
  return pool;
}

export async function initPostgres() {
  const pgPool = getPool();
  try {
    const client = await pgPool.connect();
    console.log('PostgreSQL conectado');

    // Crear tablas si no existen
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        email VARCHAR(255),
        is_protected BOOLEAN DEFAULT false,
        reset_password_token_hash VARCHAR(255),
        reset_password_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        categoria VARCHAR(50) NOT NULL DEFAULT 'General',
        precio DECIMAL(10,2) NOT NULL DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        descripcion TEXT DEFAULT '',
        imagen TEXT DEFAULT '/img/default-product.png',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nombre_completo VARCHAR(255) NOT NULL,
        celular VARCHAR(255) NOT NULL,
        correo VARCHAR(255) DEFAULT '',
        direccion VARCHAR(255) DEFAULT '',
        dni VARCHAR(255) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS servicios (
        id SERIAL PRIMARY KEY,
        servicio_numero INTEGER UNIQUE,
        cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,
        tipo_equipo VARCHAR(255) DEFAULT '',
        marca_producto VARCHAR(255) NOT NULL,
        modelo_producto VARCHAR(255) DEFAULT '',
        tipo_servicio VARCHAR(50) NOT NULL,
        falla_reportada TEXT DEFAULT '',
        asunto TEXT DEFAULT '',
        detalles TEXT DEFAULT '',
        notas_adicionales TEXT DEFAULT '',
        metodo_pago VARCHAR(255) DEFAULT '',
        anticipo DECIMAL(10,2) DEFAULT 0,
        presupuesto_items JSONB DEFAULT '[]',
        presupuesto_subtotal DECIMAL(10,2) DEFAULT 0,
        presupuesto_iva DECIMAL(10,2) DEFAULT 0,
        presupuesto_total DECIMAL(10,2) DEFAULT 0,
        estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
        motivo_notificacion TEXT DEFAULT NULL,
        estado_anterior VARCHAR(50) DEFAULT NULL,
        detalle_cliente TEXT DEFAULT NULL,
        seguimiento JSONB DEFAULT '[]',
        fecha_entrada TIMESTAMP NOT NULL,
        fecha_salida TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Migración: agregar columnas que puedan faltar en tablas existentes
    const columnasClientes = [
      { name: 'servicios_realizados', definition: "JSONB DEFAULT '[]'" },
    ];
    for (const col of columnasClientes) {
      const check = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'clientes' AND column_name = $1
        ) AS exists
      `, [col.name]);
      if (!check.rows[0].exists) {
        await client.query(`ALTER TABLE clientes ADD COLUMN ${col.name} ${col.definition}`);
        console.log(`Columna ${col.name} agregada a clientes`);
      }
    }

    const columnasServicios = [
      { name: 'motivo_notificacion', definition: 'TEXT DEFAULT NULL' },
      { name: 'estado_anterior', definition: 'VARCHAR(50) DEFAULT NULL' },
      { name: 'detalle_cliente', definition: 'TEXT DEFAULT NULL' },
    ];
    for (const col of columnasServicios) {
      const check = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'servicios' AND column_name = $1
        ) AS exists
      `, [col.name]);
      if (!check.rows[0].exists) {
        await client.query(`ALTER TABLE servicios ADD COLUMN ${col.name} ${col.definition}`);
        console.log(`Columna ${col.name} agregada a servicios`);
      }
    }

    await client.query(`
      CREATE TABLE IF NOT EXISTS ventas (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        fecha_compra TIMESTAMP NOT NULL,
        total_venta DECIMAL(10,2) NOT NULL,
        metodo_pago VARCHAR(255) NOT NULL,
        estado VARCHAR(50) NOT NULL DEFAULT 'Completado',
        productos_comprados JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS carts (
        username VARCHAR(255) PRIMARY KEY,
        items JSONB DEFAULT '[]',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours'
      );
    `);

    // Asegurar superadmin por defecto
    const { rows } = await client.query(`SELECT * FROM usuarios WHERE username = 'admin' OR role = 'superadmin' LIMIT 1`);
    if (rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordEncriptada = await bcrypt.hash('admin123', salt);
      await client.query(`
        INSERT INTO usuarios (username, password, role, email, is_protected)
        VALUES ($1, $2, $3, $4, $5)
      `, ['admin', passwordEncriptada, 'superadmin', 'admin@sg.com', true]);
      console.log('Superadmin creado en PostgreSQL');
    }

    client.release();
    console.log('PostgreSQL inicializado correctamente');
  } catch (error) {
    console.error('Error inicializando PostgreSQL:', error);
    throw error;
  }
}

export async function closePostgres() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
