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
  FaLaptop,
  FaList,
  FaMicrochip,
  FaMouse,
  FaSearch,
  FaShoppingCart,
  FaSlidersH,
  FaThLarge,
  FaTimes,
  FaWhatsapp,
} from "react-icons/fa";
import { BsPhone } from "react-icons/bs";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import useCartStore from "../store/cartStore";
import "./Productos.css";

const DEFAULT_CATEGORIES = ["todos", "celulares", "computadoras", "audio", "accesorios", "componentes", "perifericos"];

const categoryMeta = {
  todos: { label: "Todos los productos", icon: <FaThLarge /> },
  celulares: { label: "Smartphones", icon: <BsPhone /> },
  smartphones: { label: "Smartphones", icon: <BsPhone /> },
  computadoras: { label: "Laptops", icon: <FaLaptop /> },
  laptops: { label: "Laptops", icon: <FaLaptop /> },
  audio: { label: "Audio", icon: <FaHeadphonesAlt /> },
  accesorios: { label: "Accesorios", icon: <FaHeadphonesAlt /> },
  componentes: { label: "Componentes", icon: <FaMicrochip /> },
  perifericos: { label: "Periféricos", icon: <FaMouse /> },
};

const fallbackProducts = [
  { id: "demo-iphone", nombre: "iPhone 15 Pro Max", categoria: "celulares", descripcion: "256GB - Titanio Negro", precio: 1199.99, stock: 8, imagen: "/img/fondo3.png" },
  { id: "demo-rog", nombre: "ASUS ROG Zephyrus G14", categoria: "computadoras", descripcion: "Ryzen 9 7940HS - 16GB RAM", precio: 1299.99, stock: 5, imagen: "/img/fondo2.png" },
  { id: "demo-airpods", nombre: "AirPods Pro 2", categoria: "audio", descripcion: "2da generación", precio: 249.99, stock: 12, imagen: "/img/image.png" },
  { id: "demo-keyboard", nombre: "Teclado Mecánico RGB", categoria: "accesorios", descripcion: "Switch blue", precio: 79.99, stock: 10, imagen: "/img/fondo1.jpg" },
  { id: "demo-samsung", nombre: "Samsung Galaxy S24", categoria: "celulares", descripcion: "128GB - Negro", precio: 809.99, stock: 7, imagen: "/img/fondo3.png" },
  { id: "demo-macbook", nombre: "MacBook Air M2", categoria: "computadoras", descripcion: "13.6 - 8GB RAM - 256GB", precio: 1099.99, stock: 3, imagen: "/img/fondo2.png" },
  { id: "demo-sony", nombre: "Sony WH-1000XM5", categoria: "audio", descripcion: "Cancelación de ruido", precio: 349.99, stock: 6, imagen: "/img/image.png" },
  { id: "demo-mouse", nombre: "Mouse Gamer Logitech G502", categoria: "perifericos", descripcion: "Hero - 16K DPI", precio: 59.99, stock: 14, imagen: "/img/fondo4.png" },
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
    return Array.from(new Set([...(categoriasDisponibles || []), ...fromProducts]));
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
      <section className="products-hero">
        <div className="products-hero-copy">
          <h1>Productos</h1>
          <p>Encuentra la mejor tecnología con garantía y al mejor precio.</p>
        </div>
        <div className="products-hero-art">
          <span className="cart-line"><FaShoppingCart /></span>
          <img src="/img/fondo2.png" alt="Tecnología destacada" />
        </div>
      </section>

      <button className="mobile-filter-btn" onClick={() => setShowFiltroMovil(true)} aria-label="Abrir filtros">
        <FaSlidersH /> Filtros
      </button>

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
                    <div className="tech-product-image">
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
    </main>
  );
}

export default Productos;
