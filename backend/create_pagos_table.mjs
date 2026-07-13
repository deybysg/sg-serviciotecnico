import pkg from 'pg';
const { Pool } = pkg;
const p = new Pool({host:'localhost',port:5432,database:'servicio_tecnico',user:'postgres',password:'postgres'});
const sql = `
CREATE TABLE IF NOT EXISTS pagos_pendientes (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  fecha_compra TIMESTAMP NOT NULL,
  total_venta DECIMAL(10,2) NOT NULL,
  comprobante TEXT NOT NULL,
  productos_comprados JSONB DEFAULT '[]',
  estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
  notas_admin TEXT DEFAULT '',
  revisado_por VARCHAR(255) DEFAULT '',
  fecha_revision TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
p.query(sql).then(()=>{
  console.log('Tabla pagos_pendientes creada o ya existente');
  p.end();
}).catch(e=>{console.error('Error:',e);p.end();});
