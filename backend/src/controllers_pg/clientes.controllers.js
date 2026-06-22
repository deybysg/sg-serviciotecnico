import { getPool } from '../database/postgres.js';

export const obtenerClientes = async (req, res) => {
  try {
    const pool = getPool();
    const { rows: clientes } = await pool.query('SELECT * FROM clientes ORDER BY id');

    // Enriquecer cada cliente con los servicios asociados por cliente_id
    const idsClientes = clientes.map(c => c.id);
    let serviciosMap = {};
    if (idsClientes.length > 0) {
      const { rows: servicios } = await pool.query(
        `SELECT * FROM servicios WHERE cliente_id = ANY($1) ORDER BY fecha_entrada DESC`,
        [idsClientes]
      );
      servicios.forEach(s => {
        if (!serviciosMap[s.cliente_id]) serviciosMap[s.cliente_id] = [];
        serviciosMap[s.cliente_id].push(s);
      });
    }

    const clientesEnriquecidos = clientes.map(c => {
      const serviciosBD = serviciosMap[c.id] || [];
      // Merge: servicios de la BD + servicios guardados en servicios_realizados (sin duplicados)
      let serviciosRealizados = [...serviciosBD];
      const idsExistentes = new Set(serviciosBD.map(s => String(s.id)));
      const guardados = c.servicios_realizados || [];
      guardados.forEach(s => {
        const sid = String(s.id);
        if (!idsExistentes.has(sid)) {
          serviciosRealizados.push(s);
        }
      });

      return {
        ...c,
        servicios_realizados: serviciosRealizados
      };
    });

    res.json(clientesEnriquecidos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const obtenerCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const { rows } = await pool.query('SELECT * FROM clientes WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });
    const cliente = rows[0];

    // Obtener servicios asociados por cliente_id
    const { rows: serviciosBD } = await pool.query(
      'SELECT * FROM servicios WHERE cliente_id = $1 ORDER BY fecha_entrada DESC',
      [id]
    );

    // Merge sin duplicados
    let serviciosRealizados = [...serviciosBD];
    const idsExistentes = new Set(serviciosBD.map(s => String(s.id)));
    const guardados = cliente.servicios_realizados || [];
    guardados.forEach(s => {
      const sid = String(s.id);
      if (!idsExistentes.has(sid)) {
        serviciosRealizados.push(s);
      }
    });

    res.json({ ...cliente, servicios_realizados: serviciosRealizados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const crearCliente = async (req, res) => {
  try {
    const { nombreCompleto, celular, telefono, correo, email, direccion, dni } = req.body;
    const pool = getPool();
    const { rows } = await pool.query(
      `INSERT INTO clientes (nombre_completo, celular, correo, direccion, dni)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombreCompleto, celular || telefono || '', correo || email || '', direccion || '', dni || '']
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear el cliente" });
  }
};

export const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreCompleto, celular, correo, direccion, dni } = req.body;
    const pool = getPool();
    const { rows } = await pool.query(
      `UPDATE clientes SET nombre_completo = $1, celular = $2, correo = $3, direccion = $4, dni = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [nombreCompleto, celular, correo, direccion, dni, id]
    );
    if (rows.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};

export const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = getPool();
    const { rows } = await pool.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) return res.status(404).json({ mensaje: "Cliente no encontrado" });
    res.json({ mensaje: "Cliente eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: error.message });
  }
};
