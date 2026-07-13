import pkg from 'pg';
const { Pool } = pkg;
const p = new Pool({host:'localhost',port:5432,database:'servicio_tecnico',user:'postgres',password:'postgres'});
p.query("SELECT COUNT(*) as count FROM pagos_pendientes").then(r=>{
  console.log('Total pagos en BD:', r.rows[0].count);
  return p.query("SELECT id, username, total_venta, estado, created_at FROM pagos_pendientes ORDER BY id DESC LIMIT 5");
}).then(r=>{
  console.log('Últimos pagos:', r.rows);
  p.end();
}).catch(e=>{console.error('Error:', e);p.end();});
