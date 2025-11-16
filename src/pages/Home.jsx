import "./Home.css";
import {FaInstagram, FaWhatsapp, FaMobileAlt, FaLaptop, FaVolumeUp, FaChevronDown, FaMapMarkerAlt, FaHeadset, FaTools } from "react-icons/fa";
import { useState, useEffect } from "react";


function Home() {
  const alertaActiva = false;
  const mensajeAlerta =
    "Hoy no estamos atendiendo por viaje, disculpen las molestias.";

  const [showAlert, setShowAlert] = useState(alertaActiva);
  // Ubicación: cambiá este texto por tu dirección real
  const MAP_QUERY = 'Av Sarmiento 2da cuadra - San Pedro de Colalao, Tucumán'; //cambiá esto por tu dirección real
  const MAP_EMBED_SRC = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;
  const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;
  // Estado de conectividad para fallback sin WiFi/Internet
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Carrusel desktop
  const images = [
    "/img/fondo4.png", // Índice 0
    "/img/fondo2.png", // Índice 1
    "/img/fondo3.png", // Índice 2
  ];
  const [current, setCurrent] = useState(0);

  // **NUEVO: Array de textos/frases sincronizadas**
  const textosSincronizados = [
    "Reparamos celulares de manera rápida, profesional y con garantía.", // Frase 1 (Índice 0)
    "Potencia tu trabajo: Servicio técnico especializado en computadoras.", // Frase 2 (Índice 1)
    "Vuelve a disfrutar de tu música: Reparación experta de parlantes y audio.", // Frase 3 (Índice 2)
  ];
    
  // Función para obtener el texto actual (maneja HTML para negritas, etc.)
  const getCurrentText = () => {
    return { __html: textosSincronizados[current] };
  };
    
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    const update = () => setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const nextSlide = () => setCurrent((current + 1) % images.length);
  const prevSlide = () =>
    setCurrent((current - 1 + images.length) % images.length);

  // Scroll suave con control de duración y offset por navbar
  const smoothScrollTo = (id, duration = 900, offset = 70) => {
    const el = document.getElementById(id);
    if (!el) return;
    const startY = window.scrollY || window.pageYOffset;
    const targetY = el.getBoundingClientRect().top + startY - offset;
    const diff = targetY - startY;
    const startTime = performance.now();
    const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(t);
      window.scrollTo(0, startY + diff * eased);
      if (elapsed < duration) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return (
    <div className="home-container">
      {/* Banner de alerta */}
      {showAlert && (
        <div className="alert-banner">
          <span>{mensajeAlerta}</span>
          <button className="close-alert" onClick={() => setShowAlert(false)}>
            ×
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="hero">
        {/* Imagen para móviles */}
        <div
          className="mobile-only-slide"
          style={{ backgroundImage: "url('/img/image.png')" }}
        ></div>

        {/* Carrusel desktop */}
        <div className="hero-slider">
          {images.map((img, index) => (
            <div
              key={index}
              className={`slide ${index === current ? "active" : ""}`}
              style={{ backgroundImage: `url(${img})` }}
            ></div>
          ))}
          <button className="prev" onClick={prevSlide} aria-label="Anterior">
            ❮
          </button>
          <button className="next" onClick={nextSlide} aria-label="Siguiente">
            ❯
          </button>
        </div>

        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="hero-title">SERVICIO TÉCNICO</h1>
            <p className="hero-subtitle" 
                // **AQUÍ ESTÁ LA SINCRONIZACIÓN**
                dangerouslySetInnerHTML={getCurrentText()} 
            />
            <FaChevronDown className="scroll-down" size={35} />
            <FaChevronDown className="scroll-down" size={40} />
<section className="quick-links">
  <h2>Accesos Rápidos</h2>
  <div className="quick-links-container">
          <button
            className="quick-link-btn"
            onClick={() => smoothScrollTo('servicios',900,30)}
          >
            <FaTools size={18} />
            <span>Servicios</span>
          </button>
          <button
            className="quick-link-btn"
            onClick={() => smoothScrollTo('contacto',900,24)}
          >
            <FaWhatsapp size={18} />
            <span>Contacto</span>
          </button>
          <button
            className="quick-link-btn"
            onClick={() => smoothScrollTo('ubicacion',900,24)}
          >
            <FaMapMarkerAlt size={18} />
            <span>Ubicación</span>
          </button>
        </div>
      </section>
          </div>
        </div>
      </div>

      {/* Accesos Rápidos */}
      

  {/* Servicios */}
  <section id="servicios" className="about-us">
        <h2>Servicios Destacados</h2>
        <div className="services-cards">
          <div className="service-card">
            <FaMobileAlt size={50} color="#fff" />
            <h3>Celulares</h3>
            <p>Reparación rápida y confiable de pantallas, baterías y software.</p>
          </div>
          <div className="service-card">
            <FaLaptop size={50} color="#fff" />
            <h3>Computadoras</h3>
            <p>Mantenimiento de PC, optimización, limpieza y upgrades.</p>
          </div>
          <div className="service-card">
            <FaTools size={50} color="#fff" />
            <h3>Soporte Técnico</h3>
            <p>  Te brindamos asistencia remota para resolver problemas de software 
            y configuraciones de manera rápida y segura.</p>
          </div>
        
        </div>
      </section>

      {/* ¿Por qué elegirnos? */}
      <section id="por-que-elegirnos" className="location">
        <h2>¿Por qué elegirnos?</h2>
        <p>
          Con más de 3 años de experiencia en reparaciones, ofrecemos soluciones
          rápidas, garantía en todos nuestros trabajos y atención personalizada.
        </p>
      </section>

      {/* Contacto */}
      <section id="contacto" className="socials">
        <h2>Contáctanos</h2>
        <p><FaMapMarkerAlt /> Av Sarmiento 2da cuadra - San Pedro de Colalao</p>
      <p>
  <span className="emoji">✉️</span>{" "}
  <a href="mailto:deybydeleon@gmail.com" className="email-link">
    deybydeleon@gmail.com
  </a>
</p>


<div className="social-icons">
  <a
    href="https://instagram.com/"
    target="_blank"
    rel="noreferrer"
    className="instagram"
  >
    <FaInstagram size={35} />
  </a>
  <a
    href="https://wa.me/543816491380"
    target="_blank"
    rel="noreferrer"
    className="whatsapp"
  >
    <FaWhatsapp size={35} />
  </a>
</div>
</section>

      {/* Ubicación - Mapa */}
      <section id="ubicacion" className="map-section">
        <h2>Ubicación</h2>
        <p className="map-address">
          <FaMapMarkerAlt /> {MAP_QUERY}
        </p>
        <div className="map-container">
          {isOnline ? (
            <iframe
              title="Mapa - SG Servicios Técnicos"
              width="100%"
              height="400"
              style={{ border: 0, borderRadius: '12px' }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={MAP_EMBED_SRC}
            />
          ) : (
            <div className="map-fallback">
              <p>Sin conexión. Ver ubicación en Google Maps:</p>
              <a className="map-link-btn" href={MAP_LINK} target="_blank" rel="noreferrer">Abrir en Google Maps</a>
            </div>
          )}
        </div>
      </section>

{/* Footer */}
<footer className="home-footer">
        <p>© 2025 SG Servicios Técnicos - Todos los derechos reservados</p>
    </footer>
</div>
);
}

export default Home;