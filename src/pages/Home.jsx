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
import "./Home.css";

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
    id: "home-airpods",
    nombre: "Auriculares Pro",
    categoria: "Audio",
    precio: 249.99,
    stock: 8,
    imagen: "/img/image.png",
    descripcion: "Audio inalámbrico con estuche de carga.",
  },
  {
    id: "home-laptop",
    nombre: "Notebook Gamer",
    categoria: "Computadoras",
    precio: 1299.99,
    stock: 5,
    imagen: "/img/fondo2.png",
    descripcion: "Notebook de alto rendimiento para trabajo y juegos.",
  },
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
    id: "home-keyboard",
    nombre: "Teclado Mecánico RGB",
    categoria: "Accesorios",
    precio: 79.99,
    stock: 12,
    imagen: "/img/fondo1.jpg",
    descripcion: "Teclado mecánico con iluminación RGB.",
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

const CATEGORIAS_ROTATIVAS = [
  "celulares",
  "computadoras",
  "audio",
  "accesorios",
  "auriculares",
  "parlantes",
  "cargadores",
  "camaras",
];

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);
  const [heroIndex, setHeroIndex] = useState(0);
  const [productIndex, setProductIndex] = useState(0);
  const [products, setProducts] = useState(fallbackProducts);
  const [categoriaIndex, setCategoriaIndex] = useState(0);

  const activeHero = heroSlides[heroIndex];
  const categoriaActiva = CATEGORIAS_ROTATIVAS[categoriaIndex];

  const featuredProducts = useMemo(() => {
    const filtrados = products.filter(
      (p) => String(p.categoria).toLowerCase() === categoriaActiva
    );
    return filtrados.length > 0 ? filtrados : products.slice(0, 8);
  }, [products, categoriaActiva]);

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

  // Rotar categoría destacada cada 10 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      setCategoriaIndex((current) => (current + 1) % CATEGORIAS_ROTATIVAS.length);
      setProductIndex(0); // reset scroll cuando cambia categoría
    }, 10 * 60 * 1000); // 10 minutos

    return () => clearInterval(interval);
  }, []);

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
                <FaSearch /> Seguimiento
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
            <h2 id="productos-destacados">
              {featuredProducts.length > 0 && featuredProducts !== products.slice(0, 8)
                ? <>{categoriaActiva.charAt(0).toUpperCase() + categoriaActiva.slice(1)} <span>destacados</span></>
                : <>Productos <span>destacados</span></>
              }
            </h2>
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
