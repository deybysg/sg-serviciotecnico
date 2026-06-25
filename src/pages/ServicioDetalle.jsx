import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaDesktop,
  FaWindows,
  FaMobileAlt,
  FaTabletAlt,
  FaPlug,
  FaBatteryFull,
  FaShieldAlt,
  FaGem,
  FaArrowLeft,
  FaWhatsapp,
  FaCheckCircle,
} from "react-icons/fa";
import "./ServicioDetalle.css";

const serviciosData = [
  {
    id: 1,
    icono: <FaDesktop />,
    titulo: "REPARACIÓN DE PC",
    descripcionCorta: "Solucionamos fallas de hardware y software, limpieza, optimización y más.",
    color: "cyan",
    descripcionLarga:
      "Ofrecemos un servicio completo de reparación de computadoras. Diagnosticamos y solucionamos todo tipo de fallas, desde problemas de hardware hasta virus y errores de software.",
    imagenes: [
      "https://picsum.photos/seed/pc1/600/400",
      "https://picsum.photos/seed/pc2/600/400",
      "https://picsum.photos/seed/pc3/600/400",
    ],
    caracteristicas: [
      "Diagnóstico gratuito y sin compromiso",
      "Reparación de fallas de hardware y software",
      "Limpieza profunda interna y externa",
      "Optimización del sistema operativo",
      "Eliminación de virus y malware",
      "Recuperación de datos",
      "Actualización de componentes y drivers",
    ],
    pasos: [
      "Traé tu PC a nuestro local",
      "Realizamos un diagnóstico completo y gratuito",
      "Te presupuestamos la reparación antes de proceder",
      "Ejecutamos la reparación ",
      "Probamos y verificamos que todo funcione perfecto",
      "Te devolvemos tu PC con garantía",
    ],
  },
  {
    id: 2,
    icono: <FaWindows />,
    titulo: "INSTALACIÓN DE WINDOWS",
    descripcionCorta: "Instalación de Windows 10 / 11, drivers y programas esenciales.",
    color: "blue",
    descripcionLarga:
      "Instalamos y configuramos Windows 10 o 11 de forma profesional. Nos encargamos de todos los drivers, programas esenciales y la personalización según tus necesidades. Tu equipo listo para usar desde el primer momento.",
    imagenes: [
      "https://picsum.photos/seed/win1/600/400",
      "https://picsum.photos/seed/win2/600/400",
      "https://picsum.photos/seed/win3/600/400",
    ],
    caracteristicas: [
      "Instalación limpia de Windows 10 / 11",
      "Instalación de todos los drivers necesarios",
      "Programas esenciales preinstalados",
      "Configuración personalizada",
      "Activación y licenciamiento",
      "Actualizaciones completas",
    ],
    pasos: [
      "Backup de tu información importante",
      "Formateo e instalación limpia de Windows",
      "Instalación de drivers originales",
      "Carga de programas esenciales",
      "Configuración y personalización",
      "Verificación final y entrega",
    ],
  },
  {
    id: 3,
    icono: <FaMobileAlt />,
    titulo: "SERVICIO TÉCNICO DE CELULARES",
    descripcionCorta: "Reparación de fallas de software y hardware en todas las marcas.",
    color: "purple",
    descripcionLarga:
      "Somos especialistas en la reparación de celulares de todas las marcas: Samsung, iPhone, Xiaomi, Motorola, Huawei y más. Solucionamos fallas de software como pantallas de error, y problemas hardware como placas, conectores y más.",
    imagenes: [
      "https://picsum.photos/seed/cel1/600/400",
      "https://picsum.photos/seed/cel2/600/400",
      "https://picsum.photos/seed/cel3/600/400",
    ],
    caracteristicas: [
      "Reparación de todas las marcas",
      "Solución de fallas de software",
      "Reparación de componentes hardware",
      "Cambio de baterías",
      "Reparación de placas",
      "Recuperación de datos",
    ],
    pasos: [
      "Traé tu celular al local",
      "Diagnosticamos el problema",
      "Te damos un presupuesto preciso",
      "Reparamos con repuestos de calidad",
      "Probamos todas las funciones",
      "Entregamos con garantía",
    ],
  },
  {
    id: 4,
    icono: <FaTabletAlt />,
    titulo: "CAMBIO DE PANTALLA",
    descripcionCorta: "Reemplazo de pantallas quebradas con garantía.",
    color: "pink",
    descripcionLarga:
      "Reemplazamos pantallas rotas o dañadas en celulares. Trabajamos con repuestos distintas calidades y ofrecemos garantía en cada cambio. Recuperá la vista perfecta de tu dispositivo.",
    imagenes: [
      "https://picsum.photos/seed/pant1/600/400",
      "https://picsum.photos/seed/pant2/600/400",
      "https://picsum.photos/seed/pant3/600/400",
    ],
    caracteristicas: [
      "Pantallas originales y de alta calidad",
      "Cambio rápido y profesional",
      "Garantía incluida",
      "Trabajamos con todas las marcas",
      "Presupuesto sin compromiso",
      "Calidad garantizada",
    ],
    pasos: [
      "Traé tu dispositivo con pantalla dañada",
      "Evaluamos el estado y tipo de pantalla",
      "Presupuestamos el cambio",
      "Reemplazamos la pantalla ",
      "Probamos touch y visualización",
      "Entregamos con garantía",
    ],
  },
  {
    id: 5,
    icono: <FaPlug />,
    titulo: "CAMBIO DE PIN DE CARGA",
    descripcionCorta: "Solucionamos problemas de carga y conexión.",
    color: "cyan",
    descripcionLarga:
      "Si tu celular no carga, carga lento o el puerto está suelto, solucionamos el problema. Reparamos y reemplazamos puertos de carga USB-C, Lightning y micro USB con repuestos de calidad.",
    imagenes: [
      "https://picsum.photos/seed/carga1/600/400",
      "https://picsum.photos/seed/carga2/600/400",
      "https://picsum.photos/seed/carga3/600/400",
    ],
    caracteristicas: [
      "Reparación de puertos USB-C, Lightning y micro USB",
      "Carga rápida restaurada",
      "Repuestos de calidad",
      "Reparación rápida",
      "Garantía incluida",
      "Diagnóstico gratuito",
    ],
    pasos: [
      "Traé tu dispositivo con problemas de carga",
      "Diagnosticamos el estado del puerto",
      "Te informamos el costo y tiempo",
      "Reemplazamos el puerto dañado",
      "Verificamos la carga correcta",
      "Entregamos con garantía",
    ],
  },
  {
    id: 6,
    icono: <FaBatteryFull />,
    titulo: "CAMBIO DE BATERÍA",
    descripcionCorta: "Baterías originales y de alta calidad para tu dispositivo.",
    color: "blue",
    descripcionLarga:
      "¿Tu batería no dura nada o se hincho? Cambiamos la batería de tu celular o tablet con repuestos de calidad. Recuperá la autonomía original de tu dispositivo.",
    imagenes: [
      "https://picsum.photos/seed/bat1/600/400",
      "https://picsum.photos/seed/bat2/600/400",
      "https://picsum.photos/seed/bat3/600/400",
    ],
    caracteristicas: [
      "Baterías de capacidad",
      "Instalación profesional",
      "Garantía incluida",
      "Compatible con todas las marcas",
      "Rendimiento como nuevo",
      "Cambio rápido",
    ],
    pasos: [
      "Traé tu dispositivo con batería agotada",
      "Verificamos el modelo y compatibilidad",
      "Reemplazamos la batería",
      "Calibramos el sistema",
      "Entregamos con garantía",
    ],
  },
  {
    id: 7,
    icono: <FaShieldAlt />,
    titulo: "CAMBIO DE GLASS",
    descripcionCorta: "Reemplazamos el glass de tu celular cuando se rompe o astilla.",
    color: "purple",
    descripcionLarga:
      "¿Se te rompió el glass de la pantalla? Lo reemplazamos con repuestos de calidad. Trabajamos con todas las marcas y modelos, devolviéndole la protección y el aspecto original a tu dispositivo.",
    imagenes: [
      "https://picsum.photos/seed/glass1/600/400",
      "https://picsum.photos/seed/glass2/600/400",
      "https://picsum.photos/seed/glass3/600/400",
    ],
    caracteristicas: [
      "Repuestos de alta calidad",
      "Compatible con todas las marcas",
      "Cambio rápido y profesional",
      "Garantía incluida",
      "Protección como nueva",
      "Presupuesto sin compromiso",
    ],
    pasos: [
      "Traé tu celular con el glass roto",
      "Evaluamos el estado y modelo",
      "Te informamos el costo y tiempo",
      "Reemplazamos el glass dañado",
      "Verificamos el resultado",
      "Entregamos con garantía",
    ],
  },
  {
    id: 8,
    icono: <FaGem />,
    titulo: "Y MUCHO MÁS",
    descripcionCorta: "Actualizaciones, formateos, respaldo de información y más servicios.",
    color: "pink",
    descripcionLarga:
      "Además de todos nuestros servicios especializados, ofrecemos una amplia gama de soluciones: actualizaciones de software, formateo profesional, respaldo y recuperación de información, configuración de redes y mucho más.",
    imagenes: [
      "https://picsum.photos/seed/mas1/600/400",
      "https://picsum.photos/seed/mas2/600/400",
      "https://picsum.photos/seed/mas3/600/400",
    ],
    caracteristicas: [
      "Actualizaciones de software",
      "Formateo profesional",
      "Respaldo de información",
      "Configuración de redes",
      "Mantenimiento preventivo",
      "Asesoramiento personalizado",
    ],
    pasos: [
      "Consultanos por tu necesidad",
      "Te asesoramos sobre la mejor solución",
      "Ejecutamos el servicio",
      "Verificamos el resultado",
      "Entregamos con garantía",
    ],
  },
];

export default function ServicioDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const servicio = serviciosData.find((s) => s.id === parseInt(id));

  if (!servicio) {
    return (
      <div className="sd-not-found">
        <h2>Servicio no encontrado</h2>
        <Link to="/nuestros-servicios" className="sd-back-btn">
          <FaArrowLeft /> Volver a servicios
        </Link>
      </div>
    );
  }

  const colorMap = {
    cyan: "#00d4ff",
    blue: "#668cff",
    purple: "#a855f7",
    pink: "#ec4899",
  };

  const accentColor = colorMap[servicio.color] || "#00d4ff";

  return (
    <div className="sd-page">
      <div className="sd-hero" style={{ "--accent": accentColor }}>
        <Link to="/nuestros-servicios" className="sd-back-link">
          <FaArrowLeft /> Volver a servicios
        </Link>

        <div className="sd-hero-content">
          <div className={`sd-icon sd-icon-${servicio.color}`}>
            {servicio.icono}
          </div>
          <h1 className="sd-title">{servicio.titulo}</h1>
          <p className="sd-subtitle">{servicio.descripcionCorta}</p>
        </div>
      </div>

      <div className="sd-gallery">
        <h2 className="sd-section-title">Galería del Servicio</h2>
        <div className="sd-gallery-grid">
          {servicio.imagenes.map((img, i) => (
            <div className="sd-gallery-item" key={i}>
              <img src={img} alt={`${servicio.titulo} ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      <div className="sd-description">
        <h2 className="sd-section-title">Descripción</h2>
        <p>{servicio.descripcionLarga}</p>
      </div>

      <div className="sd-features">
        <h2 className="sd-section-title">¿Qué incluye?</h2>
        <ul className="sd-features-list">
          {servicio.caracteristicas.map((feat, i) => (
            <li key={i}>
              <FaCheckCircle className="sd-check" style={{ color: accentColor }} />
              {feat}
            </li>
          ))}
        </ul>
      </div>

      <div className="sd-steps">
        <h2 className="sd-section-title">¿Cómo funciona?</h2>
        <div className="sd-steps-grid">
          {servicio.pasos.map((paso, i) => (
            <div className="sd-step" key={i} style={{ "--accent": accentColor }}>
              <span className="sd-step-num" style={{ background: accentColor }}>
                {i + 1}
              </span>
              <p>{paso}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="sd-cta" style={{ "--accent": accentColor }}>
        <h2>¿Te interesa este servicio?</h2>
        <p>Contactanos ahora y resolvemos tu consulta</p>
        <a
          href="https://wa.me/543816491380"
          target="_blank"
          rel="noreferrer"
          className="sd-whatsapp-btn"
        >
          <FaWhatsapp /> Chateá por WhatsApp
        </a>
        <button className="sd-back-btn" onClick={() => navigate("/nuestros-servicios")}>
          <FaArrowLeft /> Volver a servicios
        </button>
      </div>
    </div>
  );
}
