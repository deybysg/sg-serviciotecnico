import 'dotenv/config';
import { Pool } from 'pg';

const localPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'servicio_tecnico',
  user: 'postgres',
  password: 'deyby1234',
  ssl: false
});

const renderPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrar() {
  const local = await localPool.connect();
  const render = await renderPool.connect();
  try {
    console.log('=== MIGRACIÓN: Local → Render ===\n');

    // 1. Migrar usuarios (excepto el admin que ya existe en Render)
    const { rows: usuarios } = await local.query('SELECT * FROM usuarios');
    let usuariosMigrados = 0;
    for (const u of usuarios) {
      if (u.username === 'admin') continue;
      try {
        await render.query(`
          INSERT INTO usuarios (id, username, password, role, email, is_protected, reset_password_token_hash, reset_password_expires, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            password = EXCLUDED.password,
            role = EXCLUDED.role,
            email = EXCLUDED.email,
            is_protected = EXCLUDED.is_protected,
            updated_at = CURRENT_TIMESTAMP
        `, [u.id, u.username, u.password, u.role, u.email, u.is_protected, u.reset_password_token_hash, u.reset_password_expires, u.created_at, u.updated_at]);
        usuariosMigrados++;
      } catch (e) {
        console.log(`⚠️ Usuario ${u.username}: ${e.message}`);
      }
    }
    console.log(`✅ Usuarios migrados: ${usuariosMigrados}`);

    // 2. Migrar productos
    const { rows: productos } = await local.query('SELECT * FROM productos');
    for (const p of productos) {
      try {
        await render.query(`
          INSERT INTO productos (id, nombre, categoria, precio, stock, descripcion, imagen, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            nombre = EXCLUDED.nombre,
            categoria = EXCLUDED.categoria,
            precio = EXCLUDED.precio,
            stock = EXCLUDED.stock,
            descripcion = EXCLUDED.descripcion,
            imagen = EXCLUDED.imagen,
            updated_at = CURRENT_TIMESTAMP
        `, [p.id, p.nombre, p.categoria, p.precio, p.stock, p.descripcion, p.imagen, p.created_at, p.updated_at]);
      } catch (e) {
        console.log(`⚠️ Producto ${p.id}: ${e.message}`);
      }
    }
    console.log(`✅ Productos migrados: ${productos.length}`);

    // 3. Migrar clientes
    const { rows: clientes } = await local.query('SELECT * FROM clientes');
    for (const c of clientes) {
      try {
        await render.query(`
          INSERT INTO clientes (id, nombre_completo, celular, correo, direccion, dni, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET
            nombre_completo = EXCLUDED.nombre_completo,
            celular = EXCLUDED.celular,
            correo = EXCLUDED.correo,
            direccion = EXCLUDED.direccion,
            dni = EXCLUDED.dni,
            updated_at = CURRENT_TIMESTAMP
        `, [c.id, c.nombre_completo, c.celular, c.correo, c.direccion, c.dni, c.created_at, c.updated_at]);
      } catch (e) {
        console.log(`⚠️ Cliente ${c.id}: ${e.message}`);
      }
    }
    console.log(`✅ Clientes migrados: ${clientes.length}`);

    // 4. Migrar servicios
    const { rows: servicios } = await local.query('SELECT * FROM servicios');
    for (const s of servicios) {
      try {
        await render.query(`
          INSERT INTO servicios (id, servicio_numero, cliente_id, tipo_equipo, marca_producto, modelo_producto, tipo_servicio, falla_reportada, asunto, detalles, notas_adicionales, metodo_pago, anticipo, presupuesto_items, presupuesto_subtotal, presupuesto_iva, presupuesto_total, estado, detalle_cliente, seguimiento, fecha_entrada, fecha_salida, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
          ON CONFLICT (id) DO UPDATE SET
            servicio_numero = EXCLUDED.servicio_numero,
            cliente_id = EXCLUDED.cliente_id,
            tipo_equipo = EXCLUDED.tipo_equipo,
            marca_producto = EXCLUDED.marca_producto,
            modelo_producto = EXCLUDED.modelo_producto,
            tipo_servicio = EXCLUDED.tipo_servicio,
            falla_reportada = EXCLUDED.falla_reportada,
            asunto = EXCLUDED.asunto,
            detalles = EXCLUDED.detalles,
            notas_adicionales = EXCLUDED.notas_adicionales,
            metodo_pago = EXCLUDED.metodo_pago,
            anticipo = EXCLUDED.anticipo,
            presupuesto_items = EXCLUDED.presupuesto_items,
            presupuesto_subtotal = EXCLUDED.presupuesto_subtotal,
            presupuesto_iva = EXCLUDED.presupuesto_iva,
            presupuesto_total = EXCLUDED.presupuesto_total,
            estado = EXCLUDED.estado,
            detalle_cliente = EXCLUDED.detalle_cliente,
            seguimiento = EXCLUDED.seguimiento,
            fecha_entrada = EXCLUDED.fecha_entrada,
            fecha_salida = EXCLUDED.fecha_salida,
            updated_at = CURRENT_TIMESTAMP
        `, [
          s.id, s.servicio_numero, s.cliente_id, s.tipo_equipo, s.marca_producto, s.modelo_producto,
          s.tipo_servicio, s.falla_reportada, s.asunto, s.detalles, s.notas_adicionales,
          s.metodo_pago, s.anticipo, JSON.stringify(s.presupuesto_items), s.presupuesto_subtotal,
          s.presupuesto_iva, s.presupuesto_total, s.estado, s.detalle_cliente,
          JSON.stringify(s.seguimiento), s.fecha_entrada, s.fecha_salida, s.created_at, s.updated_at
        ]);
      } catch (e) {
        console.log(`⚠️ Servicio ${s.id}: ${e.message}`);
      }
    }
    console.log(`✅ Servicios migrados: ${servicios.length}`);

    // 5. Migrar ventas
    const { rows: ventas } = await local.query('SELECT * FROM ventas');
    for (const v of ventas) {
      try {
        await render.query(`
          INSERT INTO ventas (id, username, fecha_compra, total_venta, metodo_pago, estado, productos_comprados, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            username = EXCLUDED.username,
            fecha_compra = EXCLUDED.fecha_compra,
            total_venta = EXCLUDED.total_venta,
            metodo_pago = EXCLUDED.metodo_pago,
            estado = EXCLUDED.estado,
            productos_comprados = EXCLUDED.productos_comprados,
            updated_at = CURRENT_TIMESTAMP
        `, [v.id, v.username, v.fecha_compra, v.total_venta, v.metodo_pago, v.estado, JSON.stringify(v.productos_comprados), v.created_at, v.updated_at]);
      } catch (e) {
        console.log(`⚠️ Venta ${v.id}: ${e.message}`);
      }
    }
    console.log(`✅ Ventas migradas: ${ventas.length}`);

    // 6. Migrar carts
    const { rows: carts } = await local.query('SELECT * FROM carts');
    for (const c of carts) {
      try {
        await render.query(`
          INSERT INTO carts (username, items, updated_at, expires_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (username) DO UPDATE SET
            items = EXCLUDED.items,
            updated_at = EXCLUDED.updated_at,
            expires_at = EXCLUDED.expires_at
        `, [c.username, JSON.stringify(c.items), c.updated_at, c.expires_at]);
      } catch (e) {
        console.log(`⚠️ Cart ${c.username}: ${e.message}`);
      }
    }
    console.log(`✅ Carts migrados: ${carts.length}`);

    console.log('\n🎉 MIGRACIÓN COMPLETADA');
    console.log('📌 Ahora necesitás reiniciar el backend para que apunte a Render');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    local.release();
    render.release();
    await localPool.end();
    await renderPool.end();
  }
}

migrar();
