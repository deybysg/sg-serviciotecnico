import crypto from 'crypto';

/**
 * CSRF Protection - Double Submit Cookie Pattern
 * 
 * Cómo funciona:
 * 1. El backend genera un token CSRF y lo envía en una cookie (no HttpOnly)
 * 2. El frontend lee el token de la cookie y lo envía en el header X-CSRF-Token
 * 3. El backend verifica que ambos tokens coincidan
 * 
 * Un atacante no puede leer ni enviar el token CSRF porque:
 * - No puede leer las cookies de otro dominio (same-origin policy)
 * - No puede enviar el header X-CSRF-Token desde otro dominio
 */

const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generar token CSRF firmado
 */
function generateCsrfToken() {
  const payload = crypto.randomBytes(32).toString('hex');
  const signature = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

/**
 * Verificar token CSRF
 */
function verifyCsrfToken(token) {
  if (!token || typeof token !== 'string') return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expectedSignature = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Middleware: Establecer cookie CSRF en requests GET
 * El frontend puede leer esta cookie y enviarla como header
 */
export function setCsrfCookie(req, res, next) {
  // Solo establecer cookie en requests GET/HEAD (según estándar doble submit cookie)
  if (req.method === 'GET' || req.method === 'HEAD') {
    const token = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // El frontend DEBE poder leer esta cookie
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });
  }
  next();
}

/**
 * Middleware: Verificar token CSRF en requests mutation
 * Solo aplica a POST, PUT, PATCH, DELETE
 */
export function verifyCsrf(req, res, next) {
  // No verificar en GET/HEAD/OPTIONS
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // Excluir endpoints públicos de auth (login, register, forgot-password, reset-password)
  // Estos no tienen sesión activa y no necesitan CSRF
  if (req.path.includes('/auth/login') || 
      req.path.includes('/auth/register') || 
      req.path.includes('/auth/forgot-password') || 
      req.path.includes('/auth/reset-password')) {
    return next();
  }

  // Excluir webhook de MercadoPago (usa firma propia)
  if (req.path.includes('/mercadopago/webhook')) {
    return next();
  }

  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({ 
      mensaje: 'Token CSRF faltante. Recarga la página e intenta de nuevo.',
      code: 'CSRF_MISSING'
    });
  }

  if (!verifyCsrfToken(cookieToken) || !verifyCsrfToken(headerToken)) {
    return res.status(403).json({ 
      mensaje: 'Token CSRF inválido. Recarga la página e intenta de nuevo.',
      code: 'CSRF_INVALID'
    });
  }

  if (cookieToken !== headerToken) {
    return res.status(403).json({ 
      mensaje: 'Token CSRF no coincide. Recarga la página e intenta de nuevo.',
      code: 'CSRF_MISMATCH'
    });
  }

  next();
}
