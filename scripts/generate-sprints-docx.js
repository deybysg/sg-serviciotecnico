// Genera un archivo DOCX con el plan de sprints (Frontend/Backend)
// Ejecutar: npm run gen:sprints-docx

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

const outDir = path.join(process.cwd(), 'entregables');
const outFile = path.join(outDir, 'Sprints-Octubre-2025.docx');

const sprints = [
  {
    titulo: 'Sprint 1 (01–07 oct 2025)',
    frontend: [
      ['Estructura de UI y routing', 'Base de layout, rutas con react-router y PrivateRoute.', '4 horas'],
      ['Navbar pública y condicional', 'Menú con opciones según rol del usuario.', '3 horas'],
      ['Home: Hero + carrusel', 'Carrusel desktop/móvil, controles y subtítulos sincronizados.', '5 horas'],
      ['Estilos base y tema', 'Variables, tipografías, botones y alertas coherentes.', '4 horas'],
      ['Login y persistencia', 'Maquetación, validación y AuthContext con localStorage.', '5 horas'],
      ['Footer y redes sociales', 'Pie de página con contacto e íconos sociales.', '2 horas'],
      ['Responsive inicial', 'Ajustes móviles para hero, navbar y cards.', '3 horas'],
      ['Infra de front (Vite/ESLint)', 'Config Vite, rutas de assets y reglas ESLint.', '3 horas'],
      ['Animaciones básicas', 'Transiciones de entrada/hover y microinteracciones.', '2 horas'],
    ],
    backend: [
      ['Servidor base y CORS', 'Config de Express, CORS y middlewares iniciales.', '3 horas'],
      ['Conexión a base de datos', 'Configuración dbConnection y variables de entorno.', '3 horas'],
      ['Modelos iniciales', 'Usuarios, productos, servicios, carritos.', '4 horas'],
      ['Auth y JWT', 'Registro, login, emisión/validación de tokens y guards.', '5 horas'],
      ['Rutas públicas v1', 'Healthcheck y estáticos (si aplica).', '2 horas'],
      ['Esqueleto de controladores', 'Auth, productos y servicios (estructura + handlers).', '3 horas'],
      ['Colección Postman inicial', 'Escenarios básicos de autenticación y recursos.', '3 horas'],
      ['Errores y logging', 'Manejo de errores centralizado y logger.', '3 horas'],
    ],
  },
  {
    titulo: 'Sprint 2 (08–14 oct 2025)',
    frontend: [
      ['Catálogo de productos', 'Grid, detalles mínimos y filtros básicos.', '4 horas'],
      ['Servicios (vista cliente)', 'Listado y alta de servicios del usuario.', '5 horas'],
      ['Carrito de compras', 'Lógica de carrito, subtotal y control de stock.', '5 horas'],
      ['Historial de compras (modal)', 'Modal con compras, totales y links a comprobantes.', '4 horas'],
      ['Comprobante PDF y QR', 'html2canvas + jsPDF + QR del comprobante.', '5 horas'],
      ['Preguntas frecuentes (FAQ)', 'Sección de FAQ con toggles.', '1 hora'],
      ['Rutas protegidas & guards', 'Protección de vistas según rol/estado de sesión.', '2 horas'],
      ['Feedback UX', 'Toasts/confirmaciones (alta, compra, errores).', '2 horas'],
    ],
    backend: [
      ['CRUD productos', 'Endpoints, validaciones y estados.', '4 horas'],
      ['CRUD servicios', 'Altas, edición de datos y estados del servicio.', '5 horas'],
      ['Órdenes y stock', 'Carrito → orden, actualización de stock.', '5 horas'],
      ['Comprobantes (servidor)', 'Generación/registro y consulta de comprobantes.', '3 horas'],
      ['Gestión de clientes', 'Endpoints para clientes con validaciones.', '3 horas'],
      ['Archivos/estáticos (si aplica)', 'Servir comprobantes/imágenes.', '2 horas'],
      ['Tests de integración v1', 'Escenarios de compra y servicio.', '3 horas'],
    ],
  },
  {
    titulo: 'Sprint 3 (15–21 oct 2025)',
    frontend: [
      ['Panel de Trabajo (admin)', 'Visor por hover con acciones copiar/notificar/entregar/detalles.', '8 horas'],
      ['ABM de productos (admin)', 'Alta/edición/borrado con validaciones.', '5 horas'],
      ['ABM de clientes (admin)', 'Formulario, listado y búsqueda.', '4 horas'],
      ['Gestión de usuarios (admin)', 'UI de roles y permisos visibles.', '4 horas'],
      ['Dashboard de estadísticas', 'KPIs, filtros y gráficos base.', '6 horas'],
      ['Interacciones avanzadas', 'Selects, búsquedas extendidas y ordenamientos.', '3 horas'],
      ['Accesibilidad básica', 'Focus, roles ARIA, navegación teclado.', '2 horas'],
    ],
    backend: [
      ['Estados y seguimiento', 'Cambio de estado, filtros por estado/fecha.', '6 horas'],
      ['Estadísticas KPIs', 'Top 3, totales, ventas por mes y comparativas.', '6 horas'],
      ['Paginación y filtros', 'Búsqueda avanzada y paginación en listados.', '5 horas'],
      ['Mensajería/notificaciones', 'Generación de mensajes (placeholder).', '3 horas'],
      ['Validaciones robustas', 'express-validator/Joi en entradas críticas.', '4 horas'],
      ['Seed/migraciones iniciales', 'Scripts para datos base.', '3 horas'],
    ],
  },
  {
    titulo: 'Sprint 4 (22–31 oct 2025)',
    frontend: [
      ['Home: accesos rápidos + mapa', 'Botones de Contacto/Ubicación con scroll suave + Google Maps.', '3 horas'],
      ['Estadísticas (tema oscuro)', 'Ajustes visuales, consistencia y legibilidad.', '4 horas'],
      ['Rendimiento (front)', 'Splitting, memo y lazy en rutas pesadas.', '3 horas'],
      ['QA responsive final', 'Pruebas en vistas clave y correcciones menores.', '5 horas'],
      ['Bugfixing (varios)', 'Incidencias reportadas de UX/funcionalidad.', '4 horas'],
      ['Build y pre-deploy', 'Optimización y verificación de bundle.', '2 horas'],
    ],
    backend: [
      ['Cron limpieza carritos', 'Cron/script limpiar-carritos y verificación.', '4 horas'],
      ['Permisos y cierres finales', 'Ajustes de permisos/endpoints restantes.', '4 horas'],
      ['Errores/logs avanzados', 'Respuestas consistentes y logs útiles.', '3 horas'],
      ['Hardening seguridad', 'CORS fino, expiración JWT y headers.', '3 horas'],
      ['Postman final + docs', 'Escenarios completos y README/API docs.', '4 horas'],
      ['Preparación de despliegue', 'Ambientes, pm2/nodemon, variables y checklists.', '3 horas'],
    ],
  },
];

function heading(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { after: 200 },
  });
}

function subheading(text) {
  return new Paragraph({
    children: [
      new TextRun({ text, bold: true }),
    ],
    spacing: { before: 100, after: 100 },
  });
}

function tableFor(items) {
  const borders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
  };

  const header = new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Nombre del proceso', bold: true })] })],
        width: { size: 33, type: WidthType.PERCENTAGE },
        borders,
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Descripción del proceso', bold: true })] })],
        width: { size: 52, type: WidthType.PERCENTAGE },
        borders,
      }),
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: 'Tiempo empleado', bold: true })] })],
        width: { size: 15, type: WidthType.PERCENTAGE },
        borders,
      }),
    ],
    tableHeader: true,
  });

  const rows = items.map(([a, b, c]) => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph(a)], borders }),
      new TableCell({ children: [new Paragraph(b)], borders }),
      new TableCell({ children: [new Paragraph({ text: c, alignment: AlignmentType.CENTER })], borders }),
    ],
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...rows],
  });
}

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const doc = new Document({
    creator: 'SG Servicios Técnicos',
    title: 'Plan de Sprints - Octubre 2025',
    description: 'Frontend / Backend con tiempos por actividad',
    styles: {
      default: {
        document: {
          run: { font: 'Segoe UI' },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'Plan de Sprints - Octubre 2025',
            heading: HeadingLevel.TITLE,
            spacing: { after: 300 },
          }),
          ...sprints.flatMap(({ titulo, frontend, backend }) => [
            heading(titulo),
            subheading('Frontend'),
            tableFor(frontend),
            new Paragraph({ text: '' , spacing: { after: 150 } }),
            subheading('Backend'),
            tableFor(backend),
            new Paragraph({ text: '' , spacing: { after: 300 } }),
          ]),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outFile, buffer);
  console.log(`Archivo generado: ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
