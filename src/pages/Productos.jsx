import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaCreditCard,
  FaFilter,
  FaHeadphonesAlt,
  FaHeart,
  FaList,
  FaMouse,
  FaSearch,
  FaShoppingCart,
  FaSlidersH,
  FaThLarge,
  FaTimes,
  FaWhatsapp,
  FaVolumeUp,
  FaPlug,
  FaHome,
  FaCamera,
  FaLightbulb,
  FaUsb,
  FaCar,
  FaEllipsisH,
} from "react-icons/fa";
import { BsPhone } from "react-icons/bs";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import useCartStore from "../store/cartStore";
import "../styles/pages/Productos.css";

/* =====================================================
   CONFIGURA TUS IMÁGENES AQUÍ
   Cambiá las URLs de los slides que necesites
   ===================================================== */
const SLIDE_AURICULARES_IMAGEN = "https://ik.imagekit.io/2upopbnzjh/fondos%20para%20banner/ee266281-757c-43bb-8526-03f8aa747a34.png";
const SLIDE_CAMARAS_IMAGEN = "https://ik.imagekit.io/2upopbnzjh/fondos%20para%20banner/9a82b5b2-698a-4fb4-9167-54693796525e.png";
const SLIDE_LINTERNAS_IMAGEN = "https://ik.imagekit.io/2upopbnzjh/fondos%20para%20banner/979ce618-f495-42e6-ac20-339d1386fbe7.png";
const SLIDE_PARLANTES_IMAGEN = "https://ik.imagekit.io/2upopbnzjh/fondos%20para%20banner/d4cffcc5-470d-4a5b-9d11-502cd73a9bdf.png";

const DEFAULT_CATEGORIES = [
  "todos",
  "accesorio para auto",
  "auriculares",
  "cables usb",
  "camaras",
  "cargadores",
  "celulares",
  "hogar",
  "linternas",
  "mouse",
  "parlantes",
  "perifericos",
  "varios",
];

const categoryMeta = {
  todos: { label: "Todos los productos", icon: <FaThLarge /> },
  celulares: { label: "Celulares", icon: <BsPhone /> },
  perifericos: { label: "Periféricos", icon: <FaMouse /> },
  auriculares: { label: "Auriculares", icon: <FaHeadphonesAlt /> },
  parlantes: { label: "Parlantes", icon: <FaVolumeUp /> },
  cargadores: { label: "Cargadores", icon: <FaPlug /> },
  hogar: { label: "Hogar", icon: <FaHome /> },
  camaras: { label: "Cámaras", icon: <FaCamera /> },
  linternas: { label: "Linternas", icon: <FaLightbulb /> },
  "cables usb": { label: "Cables USB", icon: <FaUsb /> },
  mouse: { label: "Mouse", icon: <FaMouse /> },
  "accesorio para auto": { label: "Accesorios para Auto", icon: <FaCar /> },
  varios: { label: "Varios", icon: <FaEllipsisH /> },
};

const fallbackProducts = [
  { id: "demo-iphone", nombre: "iPhone 15 Pro Max", categoria: "celulares", descripcion: "256GB - Titanio Negro", precio: 1199.99, stock: 8, imagen: "/img/fondo3.png" },
  { id: "demo-samsung", nombre: "Samsung Galaxy S24", categoria: "celulares", descripcion: "128GB - Negro", precio: 809.99, stock: 7, imagen: "/img/fondo3.png" },
  { id: "demo-mouse", nombre: "Mouse Gamer Logitech G502", categoria: "perifericos", descripcion: "Hero - 16K DPI", precio: 59.99, stock: 14, imagen: "/img/fondo4.png" },
  { id: "demo-cargador", nombre: "Cargador Rápido 65W", categoria: "cargadores", descripcion: "USB-C Power Delivery", precio: 29.99, stock: 20, imagen: "/img/fondo1.jpg" },
  { id: "demo-camara", nombre: "Cámara de Seguridad WiFi", categoria: "camaras", descripcion: "1080p - Visión nocturna", precio: 89.99, stock: 15, imagen: "/img/image.png" },
  { id: "demo-auricular", nombre: "Auriculares Bluetooth Pro", categoria: "auriculares", descripcion: "Cancelación de ruido activa", precio: 149.99, stock: 10, imagen: "/img/fondo2.png" },
  { id: "demo-parlante", nombre: "Parlante Portátil 20W", categoria: "parlantes", descripcion: "Bluetooth 5.0 - Waterproof", precio: 49.99, stock: 18, imagen: "/img/sonidos.png" },
  { id: "demo-linterna", nombre: "Linterna Táctica LED", categoria: "linternas", descripcion: "1000 lúmenes - Recargable", precio: 34.99, stock: 25, imagen: "/img/fondo4.png" },
];

const normalize = (value) => String(value || "").trim().toLowerCase();
const productKey = (product) => String(product.id ?? product._id);

function Productos({ categoriasDisponibles = DEFAULT_CATEGORIES }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const addToCart = useCartStore((state) => state.addToCart);

  const [productos, setProductos] = useState([]);
  const [categoria, setCategoria] = useState(categoriasDisponibles[0] || "todos");
  const [search, setSearch] = useState("");
  const [showFiltroMovil, setShowFiltroMovil] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [page, setPage] = useState(1);
  const [quantities, setQuantities] = useState({});

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const slides = [
    {
      imagen: SLIDE_AURICULARES_IMAGEN,
      titulo: "Auriculares Inalámbricos",
      subtitulo: "Audio libre y sin cables para todo el día.",
      cta: "Explorar",
      categoria: "auriculares",
    },
    {
      imagen: SLIDE_CAMARAS_IMAGEN,
      titulo: "Cámaras de Seguridad",
      subtitulo: "Protegé tu hogar y negocio las 24 horas.",
      cta: "Ver cámaras",
      categoria: "camaras",
    },
    {
      imagen: SLIDE_LINTERNAS_IMAGEN,
      titulo: "Linternas Tácticas",
      subtitulo: "Iluminación potente para cualquier aventura.",
      cta: "Descubrir",
      categoria: "linternas",
    },
    {
      imagen: SLIDE_PARLANTES_IMAGEN,
      titulo: "Parlantes Potentes",
      subtitulo: "Sonido envolvente para cada momento.",
      cta: "Escuchar",
      categoria: "parlantes",
    },
  ];

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const goToSlide = (index) => setCurrentSlide(index);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    let mounted = true;

    const fetchProductos = async () => {
      try {
        const data = await api.get("/productos");
        if (!mounted) return;
        setProductos(Array.isArray(data) && data.length > 0 ? data : fallbackProducts);
      } catch (err) {
        console.error("Error cargando productos:", err);
        if (mounted) setProductos(fallbackProducts);
      }
    };

    fetchProductos();

    const handlePurchaseComplete = () => fetchProductos();
    window.addEventListener("purchaseCompleted", handlePurchaseComplete);

    return () => {
      mounted = false;
      window.removeEventListener("purchaseCompleted", handlePurchaseComplete);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900 && showFiltroMovil) setShowFiltroMovil(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [showFiltroMovil]);

  useEffect(() => {
    setPage(1);
  }, [categoria, search]);

  const categories = useMemo(() => {
    const fromProducts = productos.map((p) => normalize(p.categoria)).filter(Boolean);
    const all = Array.from(new Set([...(categoriasDisponibles || []), ...fromProducts]));
    // Ordenar alfabéticamente, manteniendo "todos" siempre al principio
    return all.sort((a, b) => {
      if (a === "todos") return -1;
      if (b === "todos") return 1;
      return a.localeCompare(b, "es");
    });
  }, [categoriasDisponibles, productos]);

  const countByCategory = useMemo(() => {
    return productos.reduce((acc, product) => {
      const key = normalize(product.categoria);
      acc[key] = (acc[key] || 0) + 1;
      acc.todos = (acc.todos || 0) + 1;
      return acc;
    }, { todos: 0 });
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    const query = normalize(search);
    return productos.filter((product) => {
      const productCategory = normalize(product.categoria);
      const matchesCategory = normalize(categoria) === "todos" || productCategory === normalize(categoria);
      const matchesSearch = !query || [product.nombre, product.descripcion, product.categoria]
        .map(normalize)
        .some((value) => value.includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [categoria, productos, search]);

  const perPage = viewMode === "grid" ? 8 : 6;
  const totalPages = Math.max(1, Math.ceil(productosFiltrados.length / perPage));
  const visibleProducts = productosFiltrados.slice((page - 1) * perPage, page * perPage);

  const setQuantity = (product, delta) => {
    const key = productKey(product);
    const stock = Math.max(Number(product.stock || 1), 1);
    setQuantities((current) => {
      const next = Math.min(stock, Math.max(1, (current[key] || 1) + delta));
      return { ...current, [key]: next };
    });
  };

  const handleAddToCart = (product) => {
    if (Number(product.stock || 0) <= 0) {
      Swal.fire("Sin stock", `${product.nombre} está agotado.`, "warning");
      return;
    }

    const quantity = quantities[productKey(product)] || 1;
    for (let i = 0; i < quantity; i += 1) addToCart(product);
  };

  const clearFilters = () => {
    setCategoria("todos");
    setSearch("");
    setShowFiltroMovil(false);
  };

  const renderFilters = (mobile = false) => (
    <aside className={mobile ? "products-filter products-filter-mobile" : "products-filter"}>
      <div className="filter-title-row">
        <h2>Filtrar productos</h2>
        <FaSlidersH />
      </div>

      <label className="products-search">
        <input
          type="search"
          placeholder="Buscar productos..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <FaSearch />
      </label>

      <div className="filter-section-title">
        <span>Categorías</span>
        <FaChevronDown />
      </div>

      <div className="category-list">
        {categories.map((cat) => {
          const key = normalize(cat);
          const meta = categoryMeta[key] || { label: cat, icon: <FaFilter /> };
          return (
            <button
              key={cat}
              className={normalize(categoria) === key ? "active" : ""}
              onClick={() => {
                setCategoria(cat);
                if (mobile) setShowFiltroMovil(false);
              }}
            >
              <span className="category-icon">{meta.icon}</span>
              <span>{meta.label}</span>
              <strong>{countByCategory[key] || 0}</strong>
            </button>
          );
        })}
      </div>

      <button className="clear-filters" onClick={clearFilters}>
        <FaTimes /> Limpiar filtros
      </button>
    </aside>
  );

  return (
    <main className="products-page">
      <section
        className="products-hero"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="carousel-track">
          {slides.map((slide, index) => (
            <div key={index} className={`carousel-slide ${index === currentSlide ? "active" : ""}`}>
              <img src={slide.imagen} alt={slide.titulo} />
              <div className="carousel-overlay" />
              <div className="carousel-content">
                <span className="carousel-badge">Destacado</span>
                <h2>{slide.titulo}</h2>
                <p>{slide.subtitulo}</p>
                <button
                  className="carousel-cta"
                  onClick={() => {
                    setCategoria(slide.categoria);
                    window.scrollTo({ top: 420, behavior: "smooth" });
                  }}
                >
                  {slide.cta} <FaChevronRight />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button className="carousel-nav carousel-prev" onClick={prevSlide} aria-label="Anterior">
          <FaChevronLeft />
        </button>
        <button className="carousel-nav carousel-next" onClick={nextSlide} aria-label="Siguiente">
          <FaChevronRight />
        </button>

        <div className="carousel-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={index === currentSlide ? "active" : ""}
              onClick={() => goToSlide(index)}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      <div className="mobile-top-bar">
        <button className="mobile-filter-btn" onClick={() => setShowFiltroMovil(true)} aria-label="Abrir filtros">
          <FaSlidersH /> Filtros
        </button>
        <label className="mobile-search-bar">
          <input
            type="search"
            placeholder="Buscar productos..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <FaSearch />
        </label>
      </div>

      {showFiltroMovil && (
        <div className="filter-overlay">
          {renderFilters(true)}
          <button className="close-filter" onClick={() => setShowFiltroMovil(false)} aria-label="Cerrar filtros">
            <FaTimes />
          </button>
        </div>
      )}

      <section className="products-shell">
        {renderFilters()}

        <div className="products-content-panel">
          <div className="products-toolbar">
            <p>
              Mostrando {visibleProducts.length ? (page - 1) * perPage + 1 : 0} - {Math.min(page * perPage, productosFiltrados.length)} de {productosFiltrados.length} productos
            </p>
            <div className="view-actions">
              <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")} aria-label="Vista grilla">
                <FaThLarge />
              </button>
              <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")} aria-label="Vista lista">
                <FaList />
              </button>
            </div>
          </div>

          <section className={`products-grid ${viewMode === "list" ? "list-mode" : ""}`}>
            {visibleProducts.length === 0 ? (
              <p className="empty-products">No hay productos para mostrar.</p>
            ) : (
              visibleProducts.map((product, index) => {
                const quantity = quantities[productKey(product)] || 1;
                const category = normalize(product.categoria);
                return (
                  <article className="tech-product-card" key={productKey(product)}>
                    {index === 0 && page === 1 && <span className="product-badge">Nuevo</span>}
                    <button className="favorite-btn" aria-label={`Guardar ${product.nombre}`}>
                      <FaHeart />
                    </button>
                    <div className="tech-product-image" onClick={() => setSelectedProduct(product)} style={{ cursor: 'zoom-in' }}>
                      <img src={product.imagen || "/img/image.png"} alt={product.nombre} />
                    </div>
                    <span className="tech-product-category">{categoryMeta[category]?.label || product.categoria || "Tecnología"}</span>
                    <h3>{product.nombre}</h3>
                    <p className="product-description">{product.descripcion || "Producto seleccionado con garantía."}</p>
                    <div className="product-rating" aria-label="Calificación 4.8 de 5">
                      <span>★★★★★</span>
                      <small>4.8 ({Math.max(12, Number(product.stock || 1) * 8)})</small>
                    </div>
                    <div className="product-price-row">
                      <strong>${Number(product.precio || 0).toLocaleString("es-AR")}</strong>
                    </div>
                    <span className={Number(product.stock || 0) > 0 ? "stock-pill in-stock" : "stock-pill no-stock"}>
                      {Number(product.stock || 0) > 0 ? "En stock" : "Sin stock"}
                    </span>
                    <div className="product-actions-row">
                      <div className="quantity-control">
                        <button onClick={() => setQuantity(product, -1)} aria-label="Restar cantidad">-</button>
                        <span>{quantity}</span>
                        <button onClick={() => setQuantity(product, 1)} aria-label="Sumar cantidad">+</button>
                      </div>
                      <button className="add-cart-btn" onClick={() => handleAddToCart(product)} aria-label={`Agregar ${product.nombre} al carrito`}>
                        <FaShoppingCart />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </section>

          <div className="products-pagination">
            <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
              <FaChevronLeft />
            </button>
            {Array.from({ length: Math.min(totalPages, 4) }, (_, index) => index + 1).map((item) => (
              <button key={item} className={page === item ? "active" : ""} onClick={() => setPage(item)}>
                {item}
              </button>
            ))}
            {totalPages > 4 && <span>...</span>}
            {totalPages > 4 && (
              <button className={page === totalPages ? "active" : ""} onClick={() => setPage(totalPages)}>
                {totalPages}
              </button>
            )}
            <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
              <FaChevronRight />
            </button>
          </div>
        </div>
      </section>

      <section className="products-help-panel">
        <div className="help-copy">
          <FaHeadphonesAlt />
          <div>
            <h2>¿Necesitás ayuda para elegir?</h2>
            <p>Nuestro equipo está listo para asesorarte.</p>
          </div>
        </div>
        <a className="whatsapp-help" href="https://wa.me/543816491380" target="_blank" rel="noreferrer">
          <FaWhatsapp /> Hablar por WhatsApp
        </a>
        <div className="payment-methods">
          <span>Métodos de pago aceptados</span>
          <div>
            <i>VISA</i>
            <i>MC</i>
            <i>MP</i>
            <i><FaCreditCard /></i>
          </div>
        </div>
      </section>

      {selectedProduct && (
        <div className="home-product-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="home-product-modal" onClick={(e) => e.stopPropagation()}>
            <button className="home-product-modal-close" onClick={() => setSelectedProduct(null)}>&times;</button>
            <div className="home-product-modal-body">
              <div className="home-product-modal-img">
                <img src={selectedProduct.imagen || "/img/image.png"} alt={selectedProduct.nombre} />
              </div>
              <div className="home-product-modal-info">
                <span className="home-product-modal-category">{selectedProduct.categoria || "Tecnología"}</span>
                <h2>{selectedProduct.nombre}</h2>
                <p className="home-product-modal-desc">{selectedProduct.descripcion || "Producto seleccionado con garantía."}</p>
                <div className="home-product-modal-price">
                  ${Number(selectedProduct.precio || 0).toLocaleString("es-AR")}
                </div>
                <span className={`home-product-modal-stock ${Number(selectedProduct.stock || 0) > 0 ? 'in-stock' : 'no-stock'}`}>
                  {Number(selectedProduct.stock || 0) > 0 ? `Stock disponible: ${selectedProduct.stock}` : "Sin stock"}
                </span>
                <div className="home-product-modal-actions">
                  {user ? (
                    <button className="home-modal-add-btn" onClick={() => { handleAddToCart(selectedProduct); setSelectedProduct(null); }} disabled={Number(selectedProduct.stock || 0) === 0}>
                      <FaShoppingCart /> {Number(selectedProduct.stock || 0) > 0 ? "Agregar al Carrito" : "Agotado"}
                    </button>
                  ) : (
                    <button className="home-modal-add-btn" onClick={() => { setSelectedProduct(null); navigate('/login'); }}>
                      Iniciá sesión para comprar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Productos;
