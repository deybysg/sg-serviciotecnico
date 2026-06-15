import 'dotenv/config';

export const DB_PROVIDER = process.env.DB_PROVIDER || 'mongo';

export const isPostgres = () => DB_PROVIDER === 'postgres';
export const isMongo = () => DB_PROVIDER === 'mongo';
