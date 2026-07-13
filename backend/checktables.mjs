import pkg from 'pg';
const { Pool } = pkg;
const p = new Pool({host:'localhost',port:5432,database:'servicio_tecnico',user:'postgres',password:'postgres'});
p.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'").then(r=>{
  console.log('Tablas en servicio_tecnico:',r.rows.map(x=>x.table_name));
  p.end();
}).catch(e=>{console.error(e);p.end();});
