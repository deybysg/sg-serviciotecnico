import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import "dotenv/config";
import { initDb } from './src/database/initDb.js';
import productosRoutes from './src/routes/productos.routes.js';
import usuariosRoutes from './src/routes/usuarios.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import clientesRoutes from './src/routes/clientes.routes.js';
import serviciosRoutes from './src/routes/servicios.routes.js';
import seguimientoRoutes from './src/routes/seguimiento.routes.js';
import ventasRoutes from './src/routes/ventas.routes.js';
import cartsRoutes from './src/routes/carts.routes.js';
import estadisticasRoutes from './src/routes/estadisticas.routes.js';
import mercadopagoRoutes from './src/routes/mercadopago.routes.js';



const app = express();

// Configuración CORS
const FRONTEND_URL = process.env.FRONTEND_URL;
console.log('FRONTEND_URL:', FRONTEND_URL);

// Si FRONTEND_URL está configurado, usarlo. Si no, permitir todas las peticiones (solo para desarrollo)
const corsOptions = {
  origin: FRONTEND_URL ? [FRONTEND_URL, 'https://sg-serviciotecnico.vercel.app'] : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Manejar preflight requests
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/seguimiento', seguimientoRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/carts', cartsRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/mercadopago', mercadopagoRoutes);

// Endpoint de verificación de datos en PostgreSQL
app.get('/api/health/db', async (req, res) => {
  try {
    const { getPool } = await import('./src/database/postgres.js');
    const pool = getPool();
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM usuarios) as usuarios,
        (SELECT COUNT(*) FROM productos) as productos,
        (SELECT COUNT(*) FROM clientes) as clientes,
        (SELECT COUNT(*) FROM servicios) as servicios,
        (SELECT COUNT(*) FROM ventas) as ventas,
        (SELECT COUNT(*) FROM carts) as carts
    `);
    res.json({ database: 'postgresql', counts: result.rows[0] });
  } catch (error) {
    console.error('Error en health check:', error);
    res.status(500).json({ error: error.message });
  }
});

app.set('port', process.env.PORT || 4000);

(async () => {
  try {
    await initDb();
    app.listen(app.get('port'), () => {
      console.log(`app running on port ${app.get('port')}`);
    });
  } catch (error) {
    console.error('Error al iniciar la aplicación:', error);
    process.exit(1);
  }
})();
