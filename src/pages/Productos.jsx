import { useEffect, useState } from "react";
import ProductoCard from "../components/ProductoCard";
import { useAuth } from "../context/AuthContext"; // ⬅️ NUEVO IMPORT: Para saber si el usuario está logueado
import "./Productos.css";
import "../components/HamburguesaMenu.css";

const DEFAULT_CATEGORIES = ["todos", "celulares", "computadoras", "accesorios"];

function Productos({ categoriasDisponibles = DEFAULT_CATEGORIES }) {
  // ⬅️ OBTENEMOS EL ESTADO DE AUTENTICACIÓN
  const { user } = useAuth(); 
  const isLoggedIn = !!user; // true si 'user' existe

  const [productos, setProductos] = useState([]);
  const [categoria, setCategoria] = useState(categoriasDisponibles[0] || "todos");
  const [showFiltroMovil, setShowFiltroMovil] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("http://localhost:3001/productos")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setProductos(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Error cargando productos:", err));
    return () => {
      mounted = false;
    };
  }, []);

  // Cerrar el filtro móvil si se redimensiona la ventana a escritorio
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900 && showFiltroMovil) {
        setShowFiltroMovil(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [showFiltroMovil]);

  // Filtrado: SIEMPRE comparando exactamente con la categoría elegida
  const productosFiltrados =
    categoria === "todos"
      ? productos
      : productos.filter(
          (p) => p && p.categoria && p.categoria.trim() === categoria.trim()
        );

  // Título dinámico
  const tituloCategoria =
    categoria === "todos"
      ? "Productos"
      : categoria.charAt(0).toUpperCase() + categoria.slice(1);

  return (
    <div className="home-container">
      <div className="home-layout">
        {/* Filtro desktop (MANTENIDO) */}
        <div className="filtro-desktop">
          <h3>Filtrar por categoría</h3>

          {/* Botón "Todos" */}
          <button
            className={categoria === categoriasDisponibles[0] ? "btn-activo" : ""}
            onClick={() => setCategoria(categoriasDisponibles[0])}
          >
            {categoriasDisponibles[0]}
          </button>

          {/* Categorías fijas */}
          {categoriasDisponibles.slice(1).map((cat) => (
            <button
              key={cat}
              className={categoria === cat ? "btn-activo" : ""}
              onClick={() => setCategoria(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Botón y menú hamburguesa móvil (MANTENIDO) */}
        <button
          className="filtro-movil-hamburguesa"
          onClick={() => setShowFiltroMovil(true)}
          aria-label="Abrir filtro"
        >
          <span>
            <svg viewBox="0 0 32 32" width="32" height="32" fill="#fff">
              <rect y="6" width="32" height="4" rx="2" />
              <rect y="14" width="32" height="4" rx="2" />
              <rect y="22" width="32" height="4" rx="2" />
            </svg>
          </span>
        </button>

        {/* Menú lateral móvil (MANTENIDO) */}
        {showFiltroMovil && (
          <>
            <div className="filtro-movil" role="dialog" aria-modal="true">
              <h2>Filtrar por categoría</h2>

              <button
                className={categoria === categoriasDisponibles[0] ? "btn-activo" : ""}
                onClick={() => {
                  setCategoria(categoriasDisponibles[0]);
                  setShowFiltroMovil(false);
                }}
              >
                {categoriasDisponibles[0]}
              </button>

              {categoriasDisponibles.slice(1).map((cat) => (
                <button
                  key={cat}
                  className={categoria === cat ? "btn-activo" : ""}
                  onClick={() => {
                    setCategoria(cat);
                    setShowFiltroMovil(false);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Botón cerrar */}
            <button
              className="btn-cerrar-filtro"
              onClick={() => setShowFiltroMovil(false)}
              aria-label="Cerrar filtro"
            >
              &times;
            </button>
          </>
        )}

        <div className="contenedor-productos">
          <div className="productos-wrapper">
            <h2 className="titulo-productos-movil">{tituloCategoria}</h2>
            <section className="productos-lista-movil">
              {productosFiltrados.length === 0 ? (
                <p>No hay productos para mostrar.</p>
              ) : (
                productosFiltrados.map((producto) => (
                  <ProductoCard 
                      key={producto.id ?? producto._id} 
                      producto={producto} 
                      isLoggedIn={isLoggedIn} // ⬅️ PASAMOS LA PROP REQUERIDA
                  />
                ))
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Productos;