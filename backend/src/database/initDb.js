import { isMongo, isPostgres } from '../config/dbProvider.js';
import { connect } from 'mongoose';
import { MONGODB_URI } from '../config.js';
import { initPostgres } from './postgres.js';

export async function initDb() {
  if (isMongo()) {
    try {
      const resp = await connect(MONGODB_URI);
      console.log(`MongoDB conectado en ${resp.connection.name}`);
    } catch (error) {
      console.error('Error conectando MongoDB:', error);
      throw error;
    }
  }

  if (isPostgres()) {
    await initPostgres();
  }
  
  if (!isMongo() && !isPostgres()) {
    console.error('ERROR: DB_PROVIDER debe ser "mongo" o "postgres"');
    throw new Error('DB_PROVIDER no configurado correctamente');
  }
}
