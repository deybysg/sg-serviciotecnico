import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaArrowDown,
  FaDesktop,
  FaWindows,
  FaMobileAlt,
  FaTabletAlt,
  FaBatteryFull,
  FaPlug,
  FaShieldAlt,
  FaWhatsapp,
  FaInstagram,
  FaFacebook,
  FaTools,
  FaCheck,
  FaClock,
  FaUserCheck,
  FaThumbsUp,
  FaGem,
  FaArrowCircleRight,
  FaStar,
} from "react-icons/fa";
import "./NuestrosServicios.css";

const servicios = [
  {
    id: 1,
    icono: <FaDesktop />,
    titulo: "REPARACIÓN DE PC",
    descripcion:
      "Solucionamos fallas de hardware y software, limpieza, optimización y más.",
    color: "cyan",
  },
  {
    id: 2,
    icono: <FaWindows />,
    titulo: "INSTALACIÓN DE WINDOWS",
    descripcion:
      "Instalación de Windows 10 / 11, drivers y programas esenciales.",
    color: "blue",
  },
  {
    id: 3,
    icono: <FaMobileAlt />,
    titulo: "SERVICIO TÉCNICO DE CELULARES",
    descripcion:
      "Reparación de fallas de software y hardware en todas las marcas.",
    color: "purple",
  },
  {
    id: 4,
    icono: <FaTabletAlt />,
    titulo: "CAMBIO DE PANTALLA",
    descripcion:
      "Reemplazo de pantallas quebradas con garantía.",
    color: "pink",
  },
  {
    id: 5,
    icono: <FaPlug />,
    titulo: "CAMBIO DE PIN DE CARGA",
    descripcion:
      "Solucionamos problemas de carga y conexión.",
    color: "cyan",
  },
  {
    id: 6,
    icono: <FaBatteryFull />,
    titulo: "CAMBIO DE BATERÍA",
    descripcion:
      "Baterías originales y de alta calidad para tu dispositivo.",
    color: "blue",
  },
  {
    id: 7,
    icono: <FaShieldAlt />,
    titulo: "GLASS DISEÑO",
    descripcion:
      "Personalizá la parte trasera de tu celular con los mejores diseños en glass.",
    color: "purple",
  },
  {
    id: 8,
    icono: <FaGem />,
    titulo: "Y MUCHO MÁS",
    descripcion:
      "Actualizaciones, formateos, respaldo de información y más servicios.",
    color: "pink",
  },
];

const beneficios = [
  {
    icono: <FaShieldAlt />,
    titulo: "GARANTÍA ASEGURADA",
    descripcion: "Todos nuestros trabajos cuentan con garantía.",
  },
  {
    icono: <FaClock />,
    titulo: "RAPIDEZ Y EFICIENCIA",
    descripcion: "Soluciones rápidas y efectivas para ti.",
  },
  {
    icono: <FaUserCheck />,
    titulo: "TÉCNICOS EXPERTOS",
    descripcion: "Profesionales con años de experiencia.",
  },
  {
    icono: <FaThumbsUp />,
    titulo: "CLIENTES SATISFECHOS",
    descripcion: "Confianza y calidad comprobada.",
  },
];

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

function NuestrosServicios() {
  const [heroRef, heroVisible] = useReveal();
  const [gridRef, gridVisible] = useReveal();
  const [barRef, barVisible] = useReveal();
  const [ctaRef, ctaVisible] = useReveal();

  return (
    <main className="nuestros-servicios-page">
      {/* Particles background */}
      <div className="particles-container">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 8}s`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
            }}
          />
        ))}
      </div>

      {/* Social sidebar */}
      <div className="social-sidebar">
        <a href="https://instagram.com/" target="_blank" rel="noreferrer">
          <FaInstagram />
        </a>
        <a href="https://facebook.com/" target="_blank" rel="noreferrer">
          <FaFacebook />
        </a>
        <a href="https://wa.me/543816491380" target="_blank" rel="noreferrer">
          <FaWhatsapp />
        </a>
      </div>

      {/* Hero */}
      <section
        ref={heroRef}
        className={`servicios-hero-modern ${heroVisible ? "reveal" : ""}`}
      >
        <div className="servicios-hero-gradient" />
        <div className="servicios-hero-content">
          <div className="servicios-hero-badge">
            <FaStar /> SERVICIO TÉCNICO PROFESIONAL
          </div>
          <h1 className="hero-title">
            <span className="hero-line1" data-text="SOLUCIONAMOS">SOLUCIONAMOS</span>
            <span className="hero-line2" data-text="LO QUE OTROS">LO QUE OTROS</span>
            <span className="hero-line3" data-text="NO PUEDEN">NO PUEDEN</span>
          </h1>
          <p className="servicios-hero-sub">
            Reparación de computadoras, instalación de Windows,
            servicio técnico de celulares y mucho más.
            <br />
            <span className="hero-sub-accent">Calidad, garantía y confianza.</span>
          </p>
          <div className="servicios-hero-actions">
            <a
              className="btn-secondary"
              href="https://wa.me/543816491380"
              target="_blank"
              rel="noreferrer"
            >
              <FaWhatsapp /> CONTÁCTANOS
            </a>
          </div>
          <div className="scroll-down-center">
            <button
              className="btn-scroll-down"
              onClick={() => {
                const section = document.querySelector('.servicios-grid-section');
                if (section) {
                  const rect = section.getBoundingClientRect();
                  const scrollY = window.scrollY || window.pageYOffset;
                  window.scrollTo({ top: scrollY + rect.top - 120, behavior: 'smooth' });
                }
              }}
              aria-label="Ver más servicios"
            >
              <FaArrowDown />
            </button>
          </div>
        </div>

        {/* Guarantee badge floating */}
        <div className="guarantee-float">
          <div className="guarantee-icon">
            <FaShieldAlt />
          </div>
          <div className="guarantee-text">
            <strong>GARANTÍA</strong>
            <span>100%</span>
            <small>EN TODOS NUESTROS SERVICIOS</small>
          </div>
        </div>
      </section>

      {/* Servicios grid */}
      <section
        ref={gridRef}
        className={`servicios-grid-section ${gridVisible ? "reveal" : ""}`}
      >
        <div className="section-header">
          <span className="section-tag">NUESTROS SERVICIOS</span>
          <h2>
            ¿Qué podemos hacer <span className="gradient-text">por ti?</span>
          </h2>
        </div>

        <div className="servicios-modern-grid">
          {servicios.map((s, i) => (
            <article
              className="servicio-modern-card"
              key={s.id}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <Link to={`/nuestros-servicios/${s.id}`} className={`card-icon-neon ${s.color}`}>
                {s.icono}
              </Link>
              <h3 className={`card-title-${s.color}`}>{s.titulo}</h3>
              <p>{s.descripcion}</p>
              <Link to={`/nuestros-servicios/${s.id}`} className="card-arrow">
                <FaArrowCircleRight />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Beneficios bar */}
      <section
        ref={barRef}
        className={`beneficios-bar-section ${barVisible ? "reveal" : ""}`}
      >
        <div className="beneficios-bar">
          {beneficios.map((b, i) => (
            <div className="beneficio-bar-item" key={i}>
              <div className="beneficio-bar-icon">{b.icono}</div>
              <div className="beneficio-bar-text">
                <strong>{b.titulo}</strong>
                <span>{b.descripcion}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        ref={ctaRef}
        className={`cta-section ${ctaVisible ? "reveal" : ""}`}
      >
        <div className="cta-content">
          <h2>
            ¿Tu equipo tiene problemas?
            <br />
            <span className="gradient-text">¡Nosotros lo solucionamos!</span>
          </h2>
          <p>
            Escríbenos ahora por WhatsApp y recibí atención inmediata.
          </p>
          <div className="cta-actions">
            <a
              className="btn-primary large"
              href="https://wa.me/543816491380"
              target="_blank"
              rel="noreferrer"
            >
              <FaWhatsapp /> ESCRÍBENOS AHORA
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="tech-footer">
        <p>© 2026 DEYBY — Servicio técnico & ventas</p>
      </footer>
    </main>
  );
}

export default NuestrosServicios;
