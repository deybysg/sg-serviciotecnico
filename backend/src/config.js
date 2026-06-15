import 'dotenv/config';

export const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb+srv://serviciotecnicodeyby_db_user:aq1Dt8Wu1I5c5YvN@servicio-tecnicodb.2ooux35.mongodb.net/?appName=Servicio-TecnicoDB';

export const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
export const JWT_EXPIRES_IN = '7d'; // Token expira en 7 días

// PostgreSQL config
export const DB_PROVIDER = process.env.DB_PROVIDER || 'mongo';
export const DATABASE_URL = process.env.DATABASE_URL || process.env.PG_CONNECTION_STRING;
export const PGHOST = process.env.PGHOST || 'localhost';
export const PGPORT = process.env.PGPORT || 5432;
export const PGDATABASE = process.env.PGDATABASE || 'ServicioTecnico';
export const PGUSER = process.env.PGUSER || 'postgres';
export const PGPASSWORD = process.env.PGPASSWORD || 'postgres';
export const PG_SSL = process.env.PG_SSL === 'true';
