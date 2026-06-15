import 'dotenv/config';
import { connect, disconnect } from 'mongoose';
import { MONGODB_URI } from './src/config.js';
import { getPool } from './src/database/postgres.js';
import bcrypt from 'bcrypt';

async function migrate() {
  try {
    console.log('Conectando a MongoDB...');
    await connect(MONGODB_URI);
    console.log('MongoDB conectado');

    const pool = getPool();
    console.log('PostgreSQL conectado');

    // 1. Migrar usuarios
    const UsuariosModel = (await import('./src/models/usuariosSchema.js')).default;
    const usuarios = await UsuariosModel.find();
    console.log(`Migrando ${usuarios.length} usuarios...`);
    for (const u of usuarios) {
      const { rows } = await pool.query('SELECT id FROM usuarios WHERE username = $1', [u.username]);
      if (rows.length === 0) {
        await pool.query(
          `INSERT INTO usuarios (username, password, role, email, is_protected, reset_password_token_hash, reset_password_expires, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [u.username, u.password, u.role, u.email || null, u.isProtected || false, u.resetPasswordToken || null, u.resetPasswordExpires || null, u.createdAt || new Date(), u.updatedAt || new Date()]
        );
      }
    }

    // 2. Migrar productos
    const ProductosModel = (await import('./src/models/productosSchema.js')).default;
    const productos = await ProductosModel.find();
    console.log(`Migrando ${productos.length} productos...`);
    for (const p of productos) {
      const { rows } = await pool.query('SELECT id FROM productos WHERE nombre = $1 AND categoria = $2', [p.nombre, p.categoria]);
      if (rows.length === 0) {
        await pool.query(
          `INSERT INTO productos (nombre, categoria, precio, stock, descripcion, imagen, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [p.nombre, p.categoria, p.precio, p.stock, p.descripcion, p.imagen, p.createdAt || new Date(), p.updatedAt || new Date()]
        );
      }
    }

    // 3. Migrar clientes
    const ClientesModel = (await import('./src/models/clientesSchema.js')).default;
    const clientes = await ClientesModel.find();
    console.log(`Migrando ${clientes.length} clientes...`);
    const clienteIdMap = {}; // old MongoDB _id -> new PostgreSQL id
    for (const c of clientes) {
      const { rows } = await pool.query(
        `INSERT INTO clientes (nombre_completo, celular, correo, direccion, dni, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [c.nombreCompleto, c.celular, c.correo || '', c.direccion || '', c.dni || '', c.createdAt || new Date(), c.updatedAt || new Date()]
      );
      clienteIdMap[c._id.toString()] = rows[0].id;
    }

    // 4. Migrar servicios
    const ServiciosModel = (await import('./src/models/serviciosSchema.js')).default;
    const servicios = await ServiciosModel.find();
    console.log(`Migrando ${servicios.length} servicios...`);
    for (const s of servicios) {
      const clienteId = s.cliente ? (clienteIdMap[s.cliente.toString()] || null) : null;
      await pool.query(
        `INSERT INTO servicios (servicio_numero, cliente_id, tipo_equipo, marca_producto, modelo_producto, tipo_servicio, falla_reportada, asunto, detalles, notas_adicionales, metodo_pago, anticipo, presupuesto_items, presupuesto_subtotal, presupuesto_iva, presupuesto_total, estado, detalle_cliente, seguimiento, fecha_entrada, fecha_salida, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)`,
        [
          s.servicioNumero || null,
          clienteId,
          s.tipoEquipo || '',
          s.marcaProducto,
          s.modeloProducto || '',
          s.tipoServicio,
          s.fallaReportada || '',
          s.asunto || '',
          s.detalles || '',
          s.notasAdicionales || '',
          s.metodoPago || '',
          s.anticipo || 0,
          JSON.stringify(s.presupuesto?.items || []),
          s.presupuesto?.subtotal || 0,
          s.presupuesto?.iva || 0,
          s.presupuesto?.total || 0,
          s.estado || 'pendiente',
          s.detalleCliente || null,
          JSON.stringify(s.seguimiento || []),
          s.fechaEntrada || new Date(),
          s.fechaSalida || null,
          s.createdAt || new Date(),
          s.updatedAt || new Date()
        ]
      );
    }

    // 5. Migrar ventas
    const VentasModel = (await import('./src/models/ventasSchema.js')).default;
    const ventas = await VentasModel.find();
    console.log(`Migrando ${ventas.length} ventas...`);
    for (const v of ventas) {
      await pool.query(
        `INSERT INTO ventas (username, fecha_compra, total_venta, metodo_pago, estado, productos_comprados, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          v.username,
          v.fechaCompra || new Date(),
          v.totalVenta,
          v.metodoPago,
          v.estado || 'Completado',
          JSON.stringify(v.productosComprados || []),
          v.createdAt || new Date(),
          v.updatedAt || new Date()
        ]
      );
    }

    // 6. Migrar carritos
    const CartsModel = (await import('./src/models/cartsSchema.js')).default;
    const carritos = await CartsModel.find();
    console.log(`Migrando ${carritos.length} carritos...`);
    for (const c of carritos) {
      await pool.query(
        `INSERT INTO carts (username, items, updated_at, expires_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (username) DO UPDATE SET items = $2, updated_at = $3, expires_at = $4`,
        [
          c.username,
          JSON.stringify(c.items || []),
          c.updatedAt || new Date(),
          c.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000)
        ]
      );
    }

    console.log('Migración completada exitosamente');
    await disconnect();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error en migración:', error);
    process.exit(1);
  }
}

migrate();
