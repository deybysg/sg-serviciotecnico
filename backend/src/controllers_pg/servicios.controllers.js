import { getPool } from '../database/postgres.js';

let nextServicioNumero = 100;

async function getNextServicioNumero() {
  const pool = getPool();
  const { rows } = await pool.query('SELECT MAX(servicio_numero) as max FROM servicios');
  const max = rows[0].max;
  if (max) return max + 1;
  return nextServicioNumero;
}

export const obtenerServicios = async (req, res) => {
  try {
    const pool = getPool();
    const { rows } = await pool.query(`
      SELECT s.*, c.nombre_completo as cliente_nombre, c.celular as cliente_celular, c.correo as cliente_correo
      FROM servicios s
      LEFT JOIN clientes c ON s.cliente_id = c.id
      ORDER BY s.id
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const obtenerServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    let query;
    let params;
    if (/^\d+$/.test(id)) {
      query = `
        SELECT s.*, c.nombre_completo as cliente_nombre, c.celular as cliente_celular, c.correo as cliente_correo
        FROM servicios s LEFT JOIN clientes c ON s.cliente_id = c.id WHERE s.servicio_numero = $1
      `;
      params = [parseInt(id)];
    } else {
      query = `
        SELECT s.*, c.nombre_completo as cliente_nombre, c.celular as cliente_celular, c.correo as cliente_correo
        FROM servicios s LEFT JOIN clientes c ON s.cliente_id = c.id WHERE s.id = $1
      `;
      params = [id];
    }
    const { rows } = await pool.query(query, params);
    if (rows.length === 0) return res.status(404).json({ mensaje: "Servicio no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const crearServicio = async (req, res) => {
  try {
    const { cliente, marcaProducto, modeloProducto, tipoServicio, tipoEquipo, fallaReportada, asunto, detalles, notasAdicionales, metodoPago, anticipo, presupuesto, estado, fechaEntrada } = req.body;
    const pool = getPool();
    const { rows: clienteRows } = await pool.query('SELECT * FROM clientes WHERE id = $1', [cliente]);
    if (clienteRows.length === 0) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }
    const servicioNumero = await getNextServicioNumero();
    const presupuestoItems = presupuesto?.items || [];
    const presupuestoSubtotal = Number(presupuesto?.subtotal) || 0;
    const presupuestoIva = Number(presupuesto?.iva) || 0;
    const presupuestoTotal = Number(presupuesto?.total) || 0;
    const anticipoNum = Number(anticipo) || 0;
    const { rows } = await pool.query(
      `INSERT INTO servicios (servicio_numero, cliente_id, tipo_equipo, marca_producto, modelo_producto, tipo_servicio, falla_reportada, asunto, detalles, notas_adicionales, metodo_pago, anticipo, presupuesto_items, presupuesto_subtotal, presupuesto_iva, presupuesto_total, estado, fecha_entrada)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [servicioNumero, cliente, tipoEquipo || '', marcaProducto || 'Sin marca', modeloProducto || '', tipoServicio || 'reparacion', fallaReportada || '', asunto || '', detalles || '', notasAdicionales || '', metodoPago || '', anticipoNum, JSON.stringify(presupuestoItems), presupuestoSubtotal, presupuestoIva, presupuestoTotal, estado || 'pendiente', fechaEntrada || new Date()]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("ERROR CREAR SERVICIO:", error.message || error);
    res.status(500).json({ mensaje: error.message || "Error al crear el servicio" });
  }
};

export const actualizarServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const { rows: existing } = await pool.query('SELECT * FROM servicios WHERE id = $1', [id]);
    if (existing.length === 0) return res.status(404).json({ mensaje: "Servicio no encontrado" });
    const body = req.body;
    const fields = [];
    const values = [];
    let idx = 1;
    if (body.cliente !== undefined) { fields.push(`cliente_id = $${idx}`); values.push(body.cliente); idx++; }
    if (body.tipoEquipo !== undefined) { fields.push(`tipo_equipo = $${idx}`); values.push(body.tipoEquipo); idx++; }
    if (body.marcaProducto !== undefined) { fields.push(`marca_producto = $${idx}`); values.push(body.marcaProducto); idx++; }
    if (body.modeloProducto !== undefined) { fields.push(`modelo_producto = $${idx}`); values.push(body.modeloProducto); idx++; }
    if (body.tipoServicio !== undefined) { fields.push(`tipo_servicio = $${idx}`); values.push(body.tipoServicio); idx++; }
    if (body.fallaReportada !== undefined) { fields.push(`falla_reportada = $${idx}`); values.push(body.fallaReportada); idx++; }
    if (body.asunto !== undefined) { fields.push(`asunto = $${idx}`); values.push(body.asunto); idx++; }
    if (body.detalles !== undefined) { fields.push(`detalles = $${idx}`); values.push(body.detalles); idx++; }
    if (body.notasAdicionales !== undefined) { fields.push(`notas_adicionales = $${idx}`); values.push(body.notasAdicionales); idx++; }
    if (body.metodoPago !== undefined) { fields.push(`metodo_pago = $${idx}`); values.push(body.metodoPago); idx++; }
    if (body.anticipo !== undefined) { fields.push(`anticipo = $${idx}`); values.push(body.anticipo === '' || body.anticipo === null ? 0 : Number(body.anticipo)); idx++; }
    if (body.presupuesto !== undefined) {
      fields.push(`presupuesto_items = $${idx}`); values.push(JSON.stringify(body.presupuesto.items || [])); idx++;
      fields.push(`presupuesto_subtotal = $${idx}`); values.push(Number(body.presupuesto.subtotal) || 0); idx++;
      fields.push(`presupuesto_iva = $${idx}`); values.push(Number(body.presupuesto.iva) || 0); idx++;
      fields.push(`presupuesto_total = $${idx}`); values.push(Number(body.presupuesto.total) || 0); idx++;
    }
    if (body.estado !== undefined) { fields.push(`estado = $${idx}`); values.push(body.estado); idx++; }
    if (body.motivoNotificacion !== undefined) { fields.push(`motivo_notificacion = $${idx}`); values.push(body.motivoNotificacion); idx++; }
    if (body.estadoAnterior !== undefined) { fields.push(`estado_anterior = $${idx}`); values.push(body.estadoAnterior); idx++; }
    if (body.detalleCliente !== undefined) { fields.push(`detalle_cliente = $${idx}`); values.push(body.detalleCliente); idx++; }
    if (body.fechaEntrada !== undefined) { fields.push(`fecha_entrada = $${idx}`); values.push(body.fechaEntrada); idx++; }
    if (body.fechaSalida !== undefined) { fields.push(`fecha_salida = $${idx}`); values.push(body.fechaSalida); idx++; }
    if (body.seguimiento !== undefined) { fields.push(`seguimiento = $${idx}`); values.push(JSON.stringify(body.seguimiento)); idx++; }
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE servicios SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`,
      values
    );

    // Cuando pasa a "entregado", guardar detalles del servicio en el cliente
    if (body.estado === 'entregado' && rows.length > 0) {
      const servicio = rows[0];
      const clienteId = servicio.cliente_id;
      if (clienteId) {
        try {
          const { rows: clienteRows } = await pool.query('SELECT servicios_realizados FROM clientes WHERE id = $1', [clienteId]);
          if (clienteRows.length > 0) {
            let serviciosRealizados = clienteRows[0].servicios_realizados || [];
            if (typeof serviciosRealizados === 'string') serviciosRealizados = JSON.parse(serviciosRealizados);

            const yaExiste = serviciosRealizados.some(s => String(s.id) === String(servicio.id));
            if (!yaExiste) {
              serviciosRealizados.push({
                id: servicio.id,
                servicioNumero: servicio.servicio_numero,
                tipoServicio: servicio.tipo_servicio,
                marcaProducto: servicio.marca_producto,
                modeloProducto: servicio.modelo_producto,
                fallaReportada: servicio.falla_reportada,
                detalles: servicio.detalles,
                presupuesto: {
                  items: servicio.presupuesto_items || [],
                  subtotal: servicio.presupuesto_subtotal || 0,
                  iva: servicio.presupuesto_iva || 0,
                  total: servicio.presupuesto_total || 0
                },
                estado: 'entregado',
                fechaEntrada: servicio.fecha_entrada,
                fechaSalida: servicio.fecha_salida,
                entregadoEn: new Date()
              });
              await pool.query(
                'UPDATE clientes SET servicios_realizados = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [JSON.stringify(serviciosRealizados), clienteId]
              );
            }
          }
        } catch (err) {
          console.error('Error al guardar servicio en cliente:', err);
        }
      }
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const marcarEntregado = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const { rows } = await pool.query(
      `UPDATE servicios SET estado = 'entregado', fecha_salida = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ mensaje: "Servicio no encontrado" });

    // Guardar detalles del servicio en el cliente
    const servicio = rows[0];
    const clienteId = servicio.cliente_id;
    if (clienteId) {
      try {
        const { rows: clienteRows } = await pool.query('SELECT servicios_realizados FROM clientes WHERE id = $1', [clienteId]);
        if (clienteRows.length > 0) {
          let serviciosRealizados = clienteRows[0].servicios_realizados || [];
          if (typeof serviciosRealizados === 'string') serviciosRealizados = JSON.parse(serviciosRealizados);

          const yaExiste = serviciosRealizados.some(s => String(s.id) === String(servicio.id));
          if (!yaExiste) {
            serviciosRealizados.push({
              id: servicio.id,
              servicioNumero: servicio.servicio_numero,
              tipoServicio: servicio.tipo_servicio,
              marcaProducto: servicio.marca_producto,
              modeloProducto: servicio.modelo_producto,
              fallaReportada: servicio.falla_reportada,
              detalles: servicio.detalles,
              presupuesto: {
                items: servicio.presupuesto_items || [],
                subtotal: servicio.presupuesto_subtotal || 0,
                iva: servicio.presupuesto_iva || 0,
                total: servicio.presupuesto_total || 0
              },
              estado: 'entregado',
              fechaEntrada: servicio.fecha_entrada,
              fechaSalida: servicio.fecha_salida,
              entregadoEn: new Date()
            });
            await pool.query(
              'UPDATE clientes SET servicios_realizados = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
              [JSON.stringify(serviciosRealizados), clienteId]
            );
          }
        }
      } catch (err) {
        console.error('Error al guardar servicio en cliente:', err);
      }
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const eliminarServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const { rows } = await pool.query('DELETE FROM servicios WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) return res.status(404).json({ mensaje: "Servicio no encontrado" });
    res.json({ mensaje: "Servicio eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const agregarSeguimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { mensaje, tipo, autor, marcarSinSolucion, marcarNotificacion } = req.body;
    const pool = getPool();
    const { rows: existing } = await pool.query('SELECT * FROM servicios WHERE id = $1', [id]);
    if (existing.length === 0) return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    const servicio = existing[0];
    let seguimiento = servicio.seguimiento || [];
    if (typeof seguimiento === 'string') seguimiento = JSON.parse(seguimiento);
    const entry = {
      tipo: tipo || (marcarNotificacion || marcarSinSolucion ? 'notificacion' : 'nota'),
      mensaje: mensaje || '',
      autor: autor || 'taller',
      fecha: new Date()
    };
    seguimiento.push(entry);
    let updates = ["seguimiento = $1"];
    let values = [JSON.stringify(seguimiento)];
    let idx = 2;
    if (entry.tipo === 'notificacion' || marcarNotificacion || marcarSinSolucion) {
      if (!servicio.estado_anterior) {
        updates.push(`estado_anterior = $${idx}`); values.push(servicio.estado); idx++;
      }
      updates.push(`estado = $${idx}`); values.push('notificacion'); idx++;
      updates.push(`detalle_cliente = $${idx}`); values.push(mensaje || servicio.detalle_cliente || ''); idx++;
      updates.push(`motivo_notificacion = $${idx}`); values.push(mensaje || servicio.motivo_notificacion || ''); idx++;
    }
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE servicios SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`,
      values
    );
    return res.json({ mensaje: 'Seguimiento agregado', servicio: rows[0] });
  } catch (error) {
    console.error('Error agregarSeguimiento:', error);
    return res.status(500).json({ mensaje: error.message });
  }
};
