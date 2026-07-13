import { Router } from "express";
import { getPool } from "../database/postgres.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

function getDb() {
  const pool = getPool();
  return pool;
}

// Mapear snake_case de PostgreSQL a camelCase para el frontend
function mapPago(p) {
  return {
    _id: p.id,
    username: p.username,
    fechaCompra: p.fecha_compra,
    totalVenta: parseFloat(p.total_venta),
    comprobante: p.comprobante,
    productosComprados: Array.isArray(p.productos_comprados) ? p.productos_comprados : JSON.parse(p.productos_comprados || '[]'),
    estado: p.estado,
    notasAdmin: p.notas_admin,
    revisadoPor: p.revisado_por,
    fechaRevision: p.fecha_revision,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
}

// Crear pago pendiente (usuario envía comprobante)
router.post("/", async (req, res) => {
  try {
    const { username, fechaCompra, totalVenta, comprobante, productosComprados } = req.body;
    const pool = getDb();
    const result = await pool.query(
      `INSERT INTO pagos_pendientes (username, fecha_compra, total_venta, comprobante, productos_comprados, estado)
       VALUES ($1, $2, $3, $4, $5, 'Pendiente')
       RETURNING *`,
      [username, fechaCompra, totalVenta, comprobante, JSON.stringify(productosComprados)]
    );
    res.status(201).json({ message: "Pago registrado, esperando aprobación", pago: result.rows[0] });
  } catch (error) {
    console.error("Error al crear pago pendiente:", error.message);
    res.status(500).json({ message: "Error al registrar pago", error: error.message });
  }
});

// Obtener pagos pendientes (admin/superadmin)
router.get("/", authenticate, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const pool = getDb();
    const result = await pool.query(`SELECT * FROM pagos_pendientes ORDER BY created_at DESC`);
    res.json(result.rows.map(mapPago));
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res.status(500).json({ message: "Error al obtener pagos" });
  }
});

// Obtener MIS pagos (usuario logueado)
router.get("/mis-pagos", authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const result = await pool.query(
      `SELECT * FROM pagos_pendientes WHERE username = $1 ORDER BY created_at DESC`,
      [req.user.username]
    );
    res.json(result.rows.map(mapPago));
  } catch (error) {
    console.error("Error al obtener mis pagos:", error);
    res.status(500).json({ message: "Error al obtener pagos" });
  }
});

// Obtener pagos pendientes count (para notificaciones)
router.get("/count", authenticate, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const pool = getDb();
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM pagos_pendientes WHERE estado = 'Pendiente'`
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error("Error al contar pagos:", error);
    res.status(500).json({ message: "Error al contar pagos" });
  }
});

// Métricas de pagos (admin)
router.get("/metricas", authenticate, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const pool = getDb();
    
    const [totalPendientes, totalAceptados, totalRechazados, montoPendiente, montoAceptado, tiempoPromedio] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM pagos_pendientes WHERE estado = 'Pendiente'`),
      pool.query(`SELECT COUNT(*) as count FROM pagos_pendientes WHERE estado = 'Aceptado'`),
      pool.query(`SELECT COUNT(*) as count FROM pagos_pendientes WHERE estado = 'Rechazado'`),
      pool.query(`SELECT COALESCE(SUM(total_venta), 0) as total FROM pagos_pendientes WHERE estado = 'Pendiente'`),
      pool.query(`SELECT COALESCE(SUM(total_venta), 0) as total FROM pagos_pendientes WHERE estado = 'Aceptado'`),
      pool.query(`
        SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (fecha_revision - created_at)) / 3600), 0) as horas_promedio
        FROM pagos_pendientes 
        WHERE estado IN ('Aceptado', 'Rechazado') AND fecha_revision IS NOT NULL
      `)
    ]);

    res.json({
      pendientes: parseInt(totalPendientes.rows[0].count),
      aceptados: parseInt(totalAceptados.rows[0].count),
      rechazados: parseInt(totalRechazados.rows[0].count),
      montoPendiente: parseFloat(montoPendiente.rows[0].total),
      montoAceptado: parseFloat(montoAceptado.rows[0].total),
      tiempoPromedioHoras: parseFloat(parseFloat(tiempoPromedio.rows[0].horas_promedio).toFixed(1))
    });
  } catch (error) {
    console.error("Error al obtener métricas:", error);
    res.status(500).json({ message: "Error al obtener métricas" });
  }
});

// Obtener historial de acciones admin
router.get("/acciones", authenticate, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const pool = getDb();
    const result = await pool.query(
      `SELECT * FROM admin_actions_log ORDER BY created_at DESC LIMIT 50`
    );
    res.json(result.rows.map(a => ({
      id: a.id,
      pagoId: a.pago_id,
      username: a.username,
      accion: a.accion,
      notas: a.notas,
      adminUser: a.admin_user,
      monto: parseFloat(a.monto || 0),
      createdAt: a.created_at
    })));
  } catch (error) {
    console.error("Error al obtener acciones:", error);
    res.status(500).json({ message: "Error al obtener acciones" });
  }
});

// Cancelar pago (usuario - solo si está Pendiente)
router.patch("/:id/cancelar", authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const pagoResult = await pool.query(
      `SELECT * FROM pagos_pendientes WHERE id = $1 AND username = $2`,
      [req.params.id, req.user.username]
    );

    if (pagoResult.rows.length === 0) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    const pago = pagoResult.rows[0];
    if (pago.estado !== 'Pendiente') {
      return res.status(400).json({ message: "Solo se pueden cancelar pagos pendientes" });
    }

    const result = await pool.query(
      `UPDATE pagos_pendientes 
       SET estado = 'Cancelado', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND username = $2
       RETURNING *`,
      [req.params.id, req.user.username]
    );

    res.json({ message: "Pago cancelado", pago: result.rows[0] });
  } catch (error) {
    console.error("Error al cancelar pago:", error);
    res.status(500).json({ message: "Error al cancelar pago" });
  }
});

// Reenviar comprobante (usuario - solo si está Rechazado)
router.patch("/:id/reenviar", authenticate, async (req, res) => {
  try {
    const { comprobante } = req.body;
    if (!comprobante) {
      return res.status(400).json({ message: "Se requiere un nuevo comprobante" });
    }

    const pool = getDb();
    const pagoResult = await pool.query(
      `SELECT * FROM pagos_pendientes WHERE id = $1 AND username = $2`,
      [req.params.id, req.user.username]
    );

    if (pagoResult.rows.length === 0) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    const pago = pagoResult.rows[0];
    if (pago.estado !== 'Rechazado') {
      return res.status(400).json({ message: "Solo se pueden reenviar comprobantes rechazados" });
    }

    const result = await pool.query(
      `UPDATE pagos_pendientes 
       SET comprobante = $1, estado = 'Pendiente', notas_admin = '', revisado_por = '', fecha_revision = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND username = $3
       RETURNING *`,
      [comprobante, req.params.id, req.user.username]
    );

    // Registrar acción
    await pool.query(
      `INSERT INTO admin_actions_log (pago_id, username, accion, notas, admin_user, monto)
       VALUES ($1, $2, 'Reenviado por usuario', 'Comprobante actualizado', 'sistema', $3)`,
      [req.params.id, req.user.username, pago.total_venta]
    );

    res.json({ message: "Comprobante reenviado, pendiente de revisión", pago: result.rows[0] });
  } catch (error) {
    console.error("Error al reenviar comprobante:", error);
    res.status(500).json({ message: "Error al reenviar comprobante" });
  }
});

// Aceptar pago
router.patch("/:id/aceptar", authenticate, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const { notas } = req.body;
    const pool = getDb();

    const pagoResult = await pool.query(`SELECT * FROM pagos_pendientes WHERE id = $1`, [req.params.id]);
    if (pagoResult.rows.length === 0) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    const pago = pagoResult.rows[0];

    // Insertar en ventas como "Completado"
    await pool.query(
      `INSERT INTO ventas (username, fecha_compra, total_venta, metodo_pago, estado, productos_comprados)
       VALUES ($1, $2, $3, 'Transferencia', 'Completado', $4)`,
      [pago.username, pago.fecha_compra, pago.total_venta, JSON.stringify(pago.productos_comprados)]
    );

    // Actualizar stock
    const productos = Array.isArray(pago.productos_comprados) ? pago.productos_comprados : JSON.parse(pago.productos_comprados || '[]');
    for (const producto of productos) {
      if (producto.productId) {
        await pool.query(`UPDATE productos SET stock = stock - $1 WHERE id = $2`, [producto.cantidad, producto.productId]);
      }
    }

    // Actualizar estado
    const result = await pool.query(
      `UPDATE pagos_pendientes 
       SET estado = 'Aceptado', revisado_por = $1, fecha_revision = CURRENT_TIMESTAMP, notas_admin = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [req.user.username, notas || '', req.params.id]
    );

    // Registrar acción
    await pool.query(
      `INSERT INTO admin_actions_log (pago_id, username, accion, notas, admin_user, monto)
       VALUES ($1, $2, 'Aceptado', $3, $4, $5)`,
      [req.params.id, pago.username, notas || '', req.user.username, pago.total_venta]
    );

    // Enviar email de notificación (no bloqueante)
    sendEmailNotification(pago.username, 'aceptado', pago.total_venta, notas).catch(err => 
      console.warn('Error enviando email:', err.message)
    );

    res.json({ message: "Pago aceptado y venta registrada", pago: result.rows[0] });
  } catch (error) {
    console.error("Error al aceptar pago:", error);
    res.status(500).json({ message: "Error al aceptar pago: " + error.message });
  }
});

// Rechazar pago
router.patch("/:id/rechazar", authenticate, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const { notas } = req.body;
    const pool = getDb();
    
    const pagoResult = await pool.query(`SELECT * FROM pagos_pendientes WHERE id = $1`, [req.params.id]);
    if (pagoResult.rows.length === 0) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }
    const pago = pagoResult.rows[0];

    const result = await pool.query(
      `UPDATE pagos_pendientes 
       SET estado = 'Rechazado', revisado_por = $1, fecha_revision = CURRENT_TIMESTAMP, notas_admin = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [req.user.username, notas || '', req.params.id]
    );

    // Registrar acción
    await pool.query(
      `INSERT INTO admin_actions_log (pago_id, username, accion, notas, admin_user, monto)
       VALUES ($1, $2, 'Rechazado', $3, $4, $5)`,
      [req.params.id, pago.username, notas || '', req.user.username, pago.total_venta]
    );

    // Enviar email de notificación (no bloqueante)
    sendEmailNotification(pago.username, 'rechazado', pago.total_venta, notas).catch(err => 
      console.warn('Error enviando email:', err.message)
    );

    res.json({ message: "Pago rechazado", pago: result.rows[0] });
  } catch (error) {
    console.error("Error al rechazar pago:", error);
    res.status(500).json({ message: "Error al rechazar pago" });
  }
});

// Aceptar múltiples pagos (batch)
router.post("/batch-aceptar", authenticate, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const { ids, notas } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Se requiere un array de IDs" });
    }

    const pool = getDb();
    let aceptados = 0;

    for (const id of ids) {
      try {
        const pagoResult = await pool.query(`SELECT * FROM pagos_pendientes WHERE id = $1 AND estado = 'Pendiente'`, [id]);
        if (pagoResult.rows.length === 0) continue;
        const pago = pagoResult.rows[0];

        await pool.query(
          `INSERT INTO ventas (username, fecha_compra, total_venta, metodo_pago, estado, productos_comprados)
           VALUES ($1, $2, $3, 'Transferencia', 'Completado', $4)`,
          [pago.username, pago.fecha_compra, pago.total_venta, JSON.stringify(pago.productos_comprados)]
        );

        const productos = Array.isArray(pago.productos_comprados) ? pago.productos_comprados : JSON.parse(pago.productos_comprados || '[]');
        for (const producto of productos) {
          if (producto.productId) {
            await pool.query(`UPDATE productos SET stock = stock - $1 WHERE id = $2`, [producto.cantidad, producto.productId]);
          }
        }

        await pool.query(
          `UPDATE pagos_pendientes 
           SET estado = 'Aceptado', revisado_por = $1, fecha_revision = CURRENT_TIMESTAMP, notas_admin = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [req.user.username, notas || '', id]
        );

        await pool.query(
          `INSERT INTO admin_actions_log (pago_id, username, accion, notas, admin_user, monto)
           VALUES ($1, $2, 'Aceptado (batch)', $3, $4, $5)`,
          [id, pago.username, notas || '', req.user.username, pago.total_venta]
        );

        sendEmailNotification(pago.username, 'aceptado', pago.total_venta, notas).catch(() => {});
        aceptados++;
      } catch (err) {
        console.error(`Error aceptando pago ${id}:`, err.message);
      }
    }

    res.json({ message: `${aceptados} pagos aceptados`, aceptados });
  } catch (error) {
    console.error("Error en batch aceptar:", error);
    res.status(500).json({ message: "Error al aceptar pagos" });
  }
});

// Rechazar múltiples pagos (batch)
router.post("/batch-rechazar", authenticate, authorize("admin", "superadmin"), async (req, res) => {
  try {
    const { ids, notas } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Se requiere un array de IDs" });
    }

    const pool = getDb();
    let rechazados = 0;

    for (const id of ids) {
      try {
        const pagoResult = await pool.query(`SELECT * FROM pagos_pendientes WHERE id = $1 AND estado = 'Pendiente'`, [id]);
        if (pagoResult.rows.length === 0) continue;
        const pago = pagoResult.rows[0];

        await pool.query(
          `UPDATE pagos_pendientes 
           SET estado = 'Rechazado', revisado_por = $1, fecha_revision = CURRENT_TIMESTAMP, notas_admin = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [req.user.username, notas || '', id]
        );

        await pool.query(
          `INSERT INTO admin_actions_log (pago_id, username, accion, notas, admin_user, monto)
           VALUES ($1, $2, 'Rechazado (batch)', $3, $4, $5)`,
          [id, pago.username, notas || '', req.user.username, pago.total_venta]
        );

        sendEmailNotification(pago.username, 'rechazado', pago.total_venta, notas).catch(() => {});
        rechazados++;
      } catch (err) {
        console.error(`Error rechazando pago ${id}:`, err.message);
      }
    }

    res.json({ message: `${rechazados} pagos rechazados`, rechazados });
  } catch (error) {
    console.error("Error en batch rechazar:", error);
    res.status(500).json({ message: "Error al rechazar pagos" });
  }
});

// Función para enviar emails usando SendGrid
async function sendEmailNotification(username, accion, total, notas) {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const EMAIL_FROM = process.env.EMAIL_FROM || 'Sistema SG <serviciotecnico.deyby@gmail.com>';

  if (!SENDGRID_API_KEY || SENDGRID_API_KEY.includes('placeholder')) {
    console.log('📧 [EMAIL] SendGrid no configurado, saltando notificación por email');
    return;
  }

  // Obtener email del usuario
  const pool = getDb();
  const userResult = await pool.query(`SELECT email FROM usuarios WHERE username = $1`, [username]);
  const userEmail = userResult.rows[0]?.email;
  if (!userEmail) {
    console.log(`📧 [EMAIL] No se encontró email para ${username}`);
    return;
  }

  const color = accion === 'aceptado' ? '#23dd5f' : '#ff4d4d';
  const titulo = accion === 'aceptado' ? 'Pago Aceptado' : 'Pago Rechazado';
  const emoji = accion === 'aceptado' ? '✅' : '❌';
  const mensaje = accion === 'aceptado' 
    ? 'Tu pago ha sido aprobado. ¡Gracias por tu compra!'
    : `Tu pago fue rechazado.${notas ? ` Motivo: ${notas}` : ''} Puedes reenviar un nuevo comprobante desde tu historial de compras.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid rgba(0,183,255,0.15);">
      <div style="background: linear-gradient(135deg, #00b7ff, #bf32ff); padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${emoji} ${titulo}</h1>
      </div>
      <div style="padding: 32px; color: #e2e8f0;">
        <p style="font-size: 16px; margin-bottom: 8px;">Hola <strong>${username}</strong>,</p>
        <p style="font-size: 14px; color: #94a3b8; margin-bottom: 24px;">${mensaje}</p>
        <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 20px; border: 1px solid rgba(0,183,255,0.1);">
          <p style="margin: 0 0 8px; font-size: 14px; color: #94a3b8;">Monto:</p>
          <p style="margin: 0; font-size: 28px; font-weight: bold; color: ${color};">$${new Intl.NumberFormat('es-AR').format(total)}</p>
        </div>
        ${notas ? `<div style="background: rgba(255,196,0,0.08); border: 1px solid rgba(255,196,0,0.2); border-radius: 8px; padding: 12px; margin-top: 16px;"><p style="margin: 0; font-size: 13px; color: #ffc400;"><strong>Nota del admin:</strong> ${notas}</p></div>` : ''}
        <p style="font-size: 12px; color: #64748b; margin-top: 24px; text-align: center;">Sistema SG - Servicio Técnico</p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: userEmail }] }],
        from: { email: 'serviciotecnico.deyby@gmail.com', name: 'Sistema SG' },
        subject: `${emoji} ${titulo} - $${new Intl.NumberFormat('es-AR').format(total)}`,
        content: [{ type: 'text/html', value: html }]
      })
    });

    if (response.ok) {
      console.log(`📧 [EMAIL] Notificación enviada a ${userEmail} (${accion})`);
    } else {
      const errText = await response.text();
      console.warn(`📧 [EMAIL] Error SendGrid ${response.status}:`, errText);
    }
  } catch (error) {
    console.error('📧 [EMAIL] Error enviando email:', error.message);
  }
}

// ==========================================
// RUTAS DE LIMPIEZA DE HISTORIAL (solo superadmin)
// ==========================================

// Limpiar mi propio historial (usuario)
router.delete("/mi-historial", authenticate, async (req, res) => {
  try {
    const pool = getDb();
    const username = req.user.username;
    await pool.query('DELETE FROM pagos_pendientes WHERE username = $1', [username]);
    await pool.query('DELETE FROM ventas WHERE username = $1', [username]);
    console.log('🗑️ Historial propio limpiado por', username);
    res.json({ message: "Tu historial fue eliminado" });
  } catch (error) {
    console.error("Error al limpiar historial propio:", error);
    res.status(500).json({ message: "Error al limpiar historial" });
  }
});

// Limpiar TODO el historial (ventas + pagos pendientes + log admin)
router.delete("/limpiar-todo", authenticate, authorize("superadmin"), async (req, res) => {
  try {
    const pool = getDb();
    await pool.query('DELETE FROM admin_actions_log');
    await pool.query('DELETE FROM pagos_pendientes');
    await pool.query('DELETE FROM ventas');
    console.log('🗑️ Historial completo limpiado por', req.user.username);
    res.json({ message: "Todo el historial fue eliminado" });
  } catch (error) {
    console.error("Error al limpiar historial:", error);
    res.status(500).json({ message: "Error al limpiar historial" });
  }
});

// Limpiar solo pagos pendientes
router.delete("/limpiar-pendientes", authenticate, authorize("superadmin"), async (req, res) => {
  try {
    const pool = getDb();
    await pool.query('DELETE FROM pagos_pendientes');
    console.log('🗑️ Pagos pendientes limpiados por', req.user.username);
    res.json({ message: "Pagos pendientes eliminados" });
  } catch (error) {
    console.error("Error al limpiar pagos pendientes:", error);
    res.status(500).json({ message: "Error al limpiar pagos pendientes" });
  }
});

// Limpiar solo historial de ventas completadas
router.delete("/limpiar-ventas", authenticate, authorize("superadmin"), async (req, res) => {
  try {
    const pool = getDb();
    await pool.query('DELETE FROM ventas');
    console.log('🗑️ Ventas limpiadas por', req.user.username);
    res.json({ message: "Historial de ventas eliminado" });
  } catch (error) {
    console.error("Error al limpiar ventas:", error);
    res.status(500).json({ message: "Error al limpiar ventas" });
  }
});

// Limpiar solo log de acciones admin
router.delete("/limpiar-acciones", authenticate, authorize("superadmin"), async (req, res) => {
  try {
    const pool = getDb();
    await pool.query('DELETE FROM admin_actions_log');
    console.log('🗑️ Log de acciones limpiado por', req.user.username);
    res.json({ message: "Historial de acciones eliminado" });
  } catch (error) {
    console.error("Error al limpiar acciones:", error);
    res.status(500).json({ message: "Error al limpiar acciones" });
  }
});

export default router;
