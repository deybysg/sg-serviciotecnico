import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
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
import ajustesRoutes from './src/routes/ajustes.routes.js';
import pagosPendientesRoutes from './src/routes/pagosPendientes.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();

// Configuración CORS - Permitir múltiples orígenes
const ALLOWED_ORIGINS = [
  'https://sg-serviciotecnico.vercel.app',
  'https://sg-serviciotecnico.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4000'
];

// Si FRONTEND_URL está configurado, también lo permitimos
if (process.env.FRONTEND_URL) {
  let url = process.env.FRONTEND_URL;
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }
  if (!ALLOWED_ORIGINS.includes(url)) {
    ALLOWED_ORIGINS.push(url);
  }
}

if (process.env.NODE_ENV === 'development') {
  console.log('ALLOWED_ORIGINS:', ALLOWED_ORIGINS);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (curl, Postman, móviles, etc.)
    if (!origin) return callback(null, true);
    
    // Permitir cualquier subdominio de vercel.app (preview deploys)
    if (origin.includes('vercel.app')) return callback(null, true);
    
    // Permitir cualquier subdominio de onrender.com
    if (origin.includes('onrender.com')) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    
    console.log('CORS bloqueado para origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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
app.use('/api/ajustes', ajustesRoutes);
app.use('/api/pagos-pendientes', pagosPendientesRoutes);

// Endpoint simple para verificar que el servidor está corriendo (Uptime Robot)
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

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

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

(async () => {
  try {
    await initDb();
    const server = app.listen(app.get('port'), () => {
      console.log(`app running on port ${app.get('port')}`);
    });
    server.on('error', (err) => {
      console.error('Server error:', err);
    });
  } catch (error) {
    console.error('Error al iniciar la aplicación:', error);
    process.exit(1);
  }
})();
