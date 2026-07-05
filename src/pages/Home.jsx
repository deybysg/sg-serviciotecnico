import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaCreditCard,
  FaGift,
  FaHeadset,
  FaInstagram,
  FaMapMarkerAlt,
  FaMedal,
  FaSearch,
  FaShieldAlt,
  FaShoppingCart,
  FaTools,
  FaWhatsapp,
  FaWrench,
} from "react-icons/fa";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import useCartStore from "../store/cartStore";
import "../styles/pages/Home.css";

const heroSlides = [
  {
    eyebrow: "Servicio técnico DEYBY",
    title: ["Reparamos", "Solucionamos", "Conectamos"],
    text: "Soluciones técnicas confiables, accesorios y productos para tu equipo.",
    image: "/img/SERVICIOS.png",
  },
  {
    eyebrow: "Tecnología lista para rendir",
    title: ["Optimizamos", "Actualizamos", "Potenciamos"],
    text: "Mantenimiento, upgrades y diagnóstico para notebooks, PCs y dispositivos móviles.",
    image: "/img/TALLER.png",
  },
  {
    eyebrow: "Ventas y soporte",
    title: ["Elegí", "Comprá", "Disfrutá"],
    text: "Productos seleccionados, garantía y atención personalizada antes y después de comprar.",
    image: "/img/PRODUCTOS.png",
  },
];

const fallbackProducts = [
  {
    id: "home-phone",
    nombre: "Smartphone Pro Max",
    categoria: "Celulares",
    precio: 1199.99,
    stock: 4,
    imagen: "/img/fondo3.png",
    descripcion: "Celular premium con pantalla de alta definición.",
  },
  {
    id: "home-auriculares",
    nombre: "Auriculares Pro",
    categoria: "Auriculares",
    precio: 249.99,
    stock: 8,
    imagen: "/img/image.png",
    descripcion: "Audio inalámbrico con estuche de carga.",
  },
  {
    id: "home-cargador",
    nombre: "Cargador Rápido 65W",
    categoria: "Cargadores",
    precio: 29.99,
    stock: 20,
    imagen: "/img/fondo1.jpg",
    descripcion: "Carga rápida USB-C para todos tus dispositivos.",
  },
  {
    id: "home-camara",
    nombre: "Cámara de Seguridad WiFi",
    categoria: "Camaras",
    precio: 89.99,
    stock: 15,
    imagen: "/img/fondo2.png",
    descripcion: "1080p con visión nocturna y detección de movimiento.",
  },
];

const serviceCards = [
  { icon: <FaWrench />, title: "Servicio técnico", text: "Reparamos tus dispositivos con garantía y confianza." },
  { icon: <FaShoppingCart />, title: "Productos", text: "Venta de accesorios y tecnología de las mejores marcas." },
  { icon: <FaShieldAlt />, title: "Garantía", text: "Todos nuestros trabajos y ventas cuentan con respaldo." },
  { icon: <FaHeadset />, title: "Soporte", text: "Atención personalizada para cada consulta técnica." },
];

const benefits = [
  { icon: <FaMedal />, title: "Calidad garantizada", text: "Productos de calidad y reparaciones Garantizadas." },
  { icon: <FaCreditCard />, title: "Métodos de pago", text: "Compra fácil con tarjetas, transferencias y más." },
  { icon: <FaShieldAlt />, title: "Precios justos", text: "Tecnología y servicio al mejor precio posible." },
  { icon: <FaGift />, title: "Promociones", text: "Ofertas y descuentos especiales para vos." },
];

const CATEGORIAS_BASE = [
  "celulares",
  "auriculares",
  "parlantes",
  "cargadores",
  "camaras",
  "hogar",
  "linternas",
  "mouse",
  "accesorio para auto",
  "varios",
];

// Mezcla aleatoria (Fisher-Yates)
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const LS_ORDER_KEY = "home_cat_order_v1";
const LS_INDEX_KEY = "home_cat_index_v1";
const LS_TIME_KEY  = "home_cat_time_v1";

function getStoredOrder() {
  try {
    const raw = localStorage.getItem(LS_ORDER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function getStoredIndex() {
  try {
    const raw = localStorage.getItem(LS_INDEX_KEY);
    if (raw) return Number(raw);
  } catch {}
  return 0;
}

function getStoredTime() {
  try {
    const raw = localStorage.getItem(LS_TIME_KEY);
    if (raw) return Number(raw);
  } catch {}
  return 0;
}

function saveOrderState(order, index, time) {
  try {
    localStorage.setItem(LS_ORDER_KEY, JSON.stringify(order));
    localStorage.setItem(LS_INDEX_KEY, String(index));
    localStorage.setItem(LS_TIME_KEY, String(time));
  } catch {}
}

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  const [heroIndex, setHeroIndex] = useState(0);
  const [productIndex, setProductIndex] = useState(0);
  const [products, setProducts] = useState(fallbackProducts);

  // Generar orden aleatorio UNA SOLA VEZ (persistido en localStorage)
  const [catOrder, setCatOrder] = useState(() => {
    const stored = getStoredOrder();
    if (stored && Array.isArray(stored) && stored.length === CATEGORIAS_BASE.length) {
      return stored;
    }
    const nuevo = shuffle(CATEGORIAS_BASE);
    saveOrderState(nuevo, 0, Date.now());
    return nuevo;
  });

  const [categoriaIndex, setCategoriaIndex] = useState(() => {
    return getStoredIndex();
  });

  const activeHero = heroSlides[heroIndex];

  // Mezclar productos rotando el orden de las categorías cada hora
  const featuredProducts = useMemo(() => {
    if (products.length === 0) return [];

    // Agrupar productos por categoría
    const byCategory = {};
    products.forEach((p) => {
      const cat = String(p.categoria || "varios").toLowerCase();
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(p);
    });

    // Orden de categorías para esta hora (determinístico basado en categoriaIndex)
    const order = catOrder.slice(categoriaIndex)
      .concat(catOrder.slice(0, categoriaIndex));

    // Concatenar productos en ese orden de categorías
    const mezclados = [];
    order.forEach((cat) => {
      if (byCategory[cat]) {
        mezclados.push(...byCategory[cat]);
      }
    });

    // Si quedan productos de categorías no listadas, agregarlos al final
    products.forEach((p) => {
      if (!mezclados.includes(p)) mezclados.push(p);
    });

    return mezclados;
  }, [products, categoriaIndex]);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const interval = setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 5200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;

    api
      .get("/productos")
      .then((data) => {
        if (!mounted || !Array.isArray(data) || data.length === 0) return;
        setProducts(data);
      })
      .catch((error) => {
        console.error("Error cargando productos destacados:", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Al montar: verificar si ya pasó 1h desde la última rotación
  useEffect(() => {
    const lastTime = getStoredTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (lastTime && now - lastTime >= oneHour) {
      const hoursPassed = Math.floor((now - lastTime) / oneHour);
      const newIndex = (getStoredIndex() + hoursPassed) % catOrder.length;
      setCategoriaIndex(newIndex);
      setProductIndex(0);
      saveOrderState(catOrder, newIndex, now);
    }
  }, [catOrder]);

  // Rotar categoría destacada cada 1 hora
  useEffect(() => {
    const interval = setInterval(() => {
      setCategoriaIndex((current) => {
        const next = (current + 1) % catOrder.length;
        saveOrderState(catOrder, next, Date.now());
        return next;
      });
      setProductIndex(0); // reset scroll cuando cambia categoría
    }, 60 * 60 * 1000); // 1 hora

    return () => clearInterval(interval);
  }, [catOrder]);

  const goHero = (direction) => {
    setHeroIndex((current) => (current + direction + heroSlides.length) % heroSlides.length);
  };

  const goProducts = (direction) => {
    if (featuredProducts.length === 0) return;
    setProductIndex((current) => (current + direction + featuredProducts.length) % featuredProducts.length);
  };

  const visibleProducts = useMemo(() => {
    if (featuredProducts.length <= 4) return featuredProducts;

    return Array.from({ length: 4 }, (_, index) => {
      return featuredProducts[(productIndex + index) % featuredProducts.length];
    });
  }, [featuredProducts, productIndex]);

  const handleAddProduct = (product) => {
    if (!user) {
      Swal.fire({
        icon: "info",
        title: "Iniciá sesión",
        text: "Para agregar productos al carrito primero tenés que iniciar sesión.",
        confirmButtonText: "Ir al login",
        confirmButtonColor: "#00b7ff",
      }).then((result) => {
        if (result.isConfirmed) navigate("/login");
      });
      return;
    }

    if (product.stock <= 0) {
      Swal.fire("Sin stock", `${product.nombre} está agotado.`, "warning");
      return;
    }

    addToCart(product);
  };

  return (
    <main className="tech-home">
      <section className="tech-hero" aria-label="Inicio TechFix">
        <div className="hero-glow hero-glow-cyan" />
        <div className="hero-glow hero-glow-purple" />

        <div className="tech-hero-panel">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.eyebrow}
              className={`tech-hero-bg ${index === heroIndex ? "active" : ""}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
          ))}

          <button className="hero-arrow hero-arrow-left" onClick={() => goHero(-1)} aria-label="Anterior">
            <FaChevronLeft />
          </button>
          <button className="hero-arrow hero-arrow-right" onClick={() => goHero(1)} aria-label="Siguiente">
            <FaChevronRight />
          </button>

          <div className="tech-hero-copy">
            <span className="section-kicker">{activeHero.eyebrow}</span>
            <h1>
              <span>{activeHero.title[0]}</span>
              <span>{activeHero.title[1]}</span>
              <span>{activeHero.title[2]}</span>
            </h1>
            <p>{activeHero.text}</p>
            <div className="hero-actions">
              <Link className="neon-btn neon-btn-fill" to="/nuestros-servicios">
                Ver servicios <FaArrowRight />
              </Link>
              <Link className="neon-btn neon-btn-outline" to="/productos">
                Ver productos
              </Link>
              <Link className="neon-btn neon-btn-outline" to="/seguimiento">
                <FaSearch /> Estado de Reparación
              </Link>
            </div>
          </div>

          <div className="hero-dots" aria-label="Indicadores del carrusel">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.eyebrow}
                className={index === heroIndex ? "active" : ""}
                onClick={() => setHeroIndex(index)}
                aria-label={`Ir al slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="service-strip" aria-label="Funciones principales">
        {serviceCards.map((card) => (
          <article className="neon-info-card" key={card.title}>
            <div className="neon-icon">{card.icon}</div>
            <div>
              <h2>{card.title}</h2>
              <p>{card.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="featured-products" aria-labelledby="productos-destacados">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Lo mejor en tecnología</span>
            <h2 id="productos-destacados">Productos <span>destacados</span></h2>
          </div>
          <Link className="neon-btn neon-btn-outline" to="/productos">
            Ver todos <FaArrowRight />
          </Link>
        </div>

        <button className="products-arrow products-arrow-left" onClick={() => goProducts(-1)} aria-label="Productos anteriores">
          <FaChevronLeft />
        </button>
        <button className="products-arrow products-arrow-right" onClick={() => goProducts(1)} aria-label="Productos siguientes">
          <FaChevronRight />
        </button>

        <div className="product-grid">
          {visibleProducts.map((product) => (
            <article className="home-product-card" key={product.id ?? product._id}>
              <div className="product-image-wrap">
                <img src={product.imagen || "/img/image.png"} alt={product.nombre} />
              </div>
              <span className="product-category">{product.categoria || "Tecnología"}</span>
              <h3>{product.nombre}</h3>
              <div className="product-card-footer">
                <strong>${Number(product.precio || 0).toLocaleString("es-AR")}</strong>
                <button onClick={() => handleAddProduct(product)} aria-label={`Agregar ${product.nombre} al carrito`}>
                  <FaShoppingCart />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="product-dots" aria-label="Indicadores de productos">
          {featuredProducts.slice(0, Math.min(featuredProducts.length, 6)).map((product, index) => (
            <button
              key={product.id ?? product._id ?? index}
              className={index === productIndex ? "active" : ""}
              onClick={() => setProductIndex(index)}
              aria-label={`Ver producto ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <section className="benefits-bar" aria-label="Beneficios de compra">
        {benefits.map((benefit) => (
          <article key={benefit.title}>
            <div className="neon-icon">{benefit.icon}</div>
            <div>
              <h2>{benefit.title}</h2>
              <p>{benefit.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="contact-panel" id="contacto">
        <div>
          <span className="section-kicker">Contactanos</span>
          <h2>Soporte técnico y ventas para tus equipos</h2>
          <p><FaMapMarkerAlt /> Av Sarmiento 2da cuadra - San Pedro de Colalao, Tucumán</p>
        </div>
        <div className="contact-actions">
          <a className="neon-btn neon-btn-fill" href="https://wa.me/543816491380" target="_blank" rel="noreferrer">
            <FaWhatsapp /> WhatsApp
          </a>
          <a className="neon-btn neon-btn-outline" href="https://instagram.com/" target="_blank" rel="noreferrer">
            <FaInstagram /> Instagram
          </a>
          <Link className="neon-btn neon-btn-outline" to="/seguimiento">
            <FaTools /> Seguimiento
          </Link>
        </div>
      </section>

      <footer className="tech-footer">
        <p>© 2026 DEYBY - Servicio técnico & ventas</p>
      </footer>
    </main>
  );
}

export default Home;
