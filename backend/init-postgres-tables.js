import 'dotenv/config';
import { initPostgres } from './src/database/postgres.js';

(async () => {
  try {
    await initPostgres();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
