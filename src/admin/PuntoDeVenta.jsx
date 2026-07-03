import React, { useEffect, useState, useMemo, useRef } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import "./PuntoDeVenta.css";
import {
  FiSearch, FiShoppingCart, FiPlus, FiMinus, FiTrash2,
  FiPackage, FiChevronLeft, FiChevronRight, FiEdit2
} from "react-icons/fi";
import {
  FaMoneyBillWave, FaCreditCard, FaUniversity, FaQrcode,
  FaUsers, FaBox, FaDollarSign, FaHistory, FaUndo
} from "react-icons/fa";

const CATEGORIAS = [
  { id: "todos", label: "Todos" },
  { id: "accesorio para auto", label: "Accesorios" },
  { id: "auriculares", label: "Audio" },
  { id: "cables usb", label: "Cables" },
  { id: "perifericos", label: "Componentes" },
  { id: "otros", label: "Gaming" },
  { id: "hogar", label: "Iluminación" },
  { id: "varios", label: "Más" },
];

const METODOS_PAGO = [
  { id: "efectivo", label: "Efectivo", icon: FaMoneyBillWave, color: "#10b981" },
  { id: "tarjeta", label: "Tarjeta", icon: FaCreditCard, color: "#3b82f6" },
  { id: "transferencia", label: "Transferencia", icon: FaUniversity, color: "#06b6d4" },
  { id: "qr", label: "QR / Yape", icon: FaQrcode, color: "#06b6d4" },
];

const ITEMS_PER_PAGE = 12;

function PuntoDeVenta() {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [carrito, setCarrito] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("todos");
  const [currentPage, setCurrentPage] = useState(1);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [descuento, setDescuento] = useState(0);
  const [ventasHoy, setVentasHoy] = useState(0);
  const [totalVentasHoy, setTotalVentasHoy] = useState(0);
  const [clientesCount, setClientesCount] = useState(0);
  const [ventasList, setVentasList] = useState([]);
  const [showDevolucion, setShowDevolucion] = useState(false);

  const busquedaRef = useRef(null);

  const fetchStats = async () => {
    try {
      const hoy = new Date().toISOString().slice(0, 10);
      const [ventas, clientes] = await Promise.all([
        api.get("/ventas").catch(() => []),
        api.get("/clientes").catch(() => []),
      ]);
      const ventasArray = Array.isArray(ventas) ? ventas : [];
      const ventasDelDia = ventasArray.filter((v) => {
        const fechaStr = v.fecha_compra || v.fecha || "";
        return fechaStr.slice(0, 10) === hoy;
      });
      setVentasHoy(ventasDelDia.length);
      setTotalVentasHoy(ventasDelDia.reduce((acc, v) => acc + (Number(v.total_venta) || Number(v.total) || 0), 0));
      setVentasList(ventasDelDia.slice(0, 10));
      setClientesCount(Array.isArray(clientes) ? clientes.length : 0);
    } catch {
      // stats no disponibles
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await api.get("/productos", false);
        setProductos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al cargar productos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideBusqueda =
        !busqueda ||
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.codigo?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria =
        categoriaActiva === "todos" || p.categoria === categoriaActiva;
      return coincideBusqueda && coincideCategoria;
    });
  }, [productos, busqueda, categoriaActiva]);

  const totalPages = Math.ceil(productosFiltrados.length / ITEMS_PER_PAGE);
  const productosPaginados = productosFiltrados.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, categoriaActiva]);

  // Focus automático en el buscador al cargar y al cambiar página/categoría
  useEffect(() => {
    if (busquedaRef.current) {
      busquedaRef.current.focus();
    }
  }, [currentPage, categoriaActiva]);

  const agregarAlCarrito = (producto) => {
    if (producto.stock <= 0) {
      Swal.fire({ icon: "warning", title: "Sin stock", text: "No tiene stock disponible", timer: 1200, showConfirmButton: false });
      return;
    }
    setCarrito((prev) => {
      const existe = prev.find((item) => (item._id || item.id) === (producto._id || producto.id));
      if (existe) {
        if (existe.cantidad >= producto.stock) {
          Swal.fire({ icon: "warning", title: "Stock insuficiente", text: `Solo hay ${producto.stock} unidades`, timer: 1200, showConfirmButton: false });
          return prev;
        }
        return prev.map((item) =>
          (item._id || item.id) === (producto._id || producto.id) ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  // Escaneo automático por código de barras (debounce)
  useEffect(() => {
    if (!busqueda.trim()) return;
    const match = productos.find(
      (p) => p.codigo && p.codigo.toLowerCase().trim() === busqueda.toLowerCase().trim()
    );
    if (match) {
      const timer = setTimeout(() => {
        agregarAlCarrito(match);
        setBusqueda("");
        if (busquedaRef.current) busquedaRef.current.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [busqueda, productos]);

  const actualizarCantidad = (id, delta) => {
    setCarrito((prev) => {
      return prev
        .map((item) => {
          if ((item._id || item.id) !== id) return item;
          const nuevaCantidad = item.cantidad + delta;
          if (nuevaCantidad <= 0) return null;
          if (nuevaCantidad > item.stock) {
            Swal.fire({ icon: "warning", title: "Stock insuficiente", text: `Solo hay ${item.stock} unidades`, timer: 1200, showConfirmButton: false });
            return item;
          }
          return { ...item, cantidad: nuevaCantidad };
        })
        .filter(Boolean);
    });
  };

  const eliminarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((item) => (item._id || item.id) !== id));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    setDescuento(0);
  };

  const subtotal = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const total = subtotal - descuento;

  const handleDevolver = async (ventaId) => {
    const result = await Swal.fire({
      title: "¿Devolver venta?",
      text: "El stock de los productos se reintegrará al inventario.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f59e0b",
      cancelButtonColor: "#475569",
      confirmButtonText: "Sí, devolver",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await api.patch(`/ventas/${ventaId}/devolver`);
      Swal.fire({ icon: "success", title: "Devolución realizada", timer: 1500, showConfirmButton: false });
      fetchStats();
      const data = await api.get("/productos", false);
      setProductos(Array.isArray(data) ? data : []);
      setShowDevolucion(false);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: err.message || "No se pudo procesar la devolución" });
    }
  };

  const handleCobrar = () => {
    if (carrito.length === 0) {
      Swal.fire({ icon: "warning", title: "Carrito vacío", text: "Agregá productos antes de cobrar", timer: 1200, showConfirmButton: false });
      return;
    }
    Swal.fire({
      title: "¿Confirmar venta?",
      html: `<div style="text-align:left;padding:10px;"><p><strong>Productos:</strong> ${carrito.length}</p><p><strong>Total:</strong> $${total.toFixed(2)}</p><p><strong>Método:</strong> ${METODOS_PAGO.find(m => m.id === metodoPago)?.label}</p></div>`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#475569",
      confirmButtonText: "Sí, cobrar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const ventaData = {
            username: user?.username || "Admin",
            totalVenta: total,
            metodoPago,
            estado: "Completado",
            productosComprados: carrito.map((item) => ({
              nombre: item.nombre,
              cantidad: item.cantidad,
              precioUnitario: item.precio,
              subtotal: item.precio * item.cantidad,
            })),
          };
          await api.post("/ventas", ventaData);
          for (const item of carrito) {
            await api.patch(`/productos/${item._id || item.id}/stock`, {
              codigo: item.codigo,
              nombre: item.nombre,
              categoria: item.categoria || "General",
              precio: item.precio || 0,
              stock: item.stock - item.cantidad,
              descripcion: item.descripcion || "",
              imagen: item.imagen || "/img/default-product.png",
            });
          }
          Swal.fire({ icon: "success", title: "¡Venta realizada!", html: `<div style="text-align:center;"><p style="font-size:18px;"><strong>Total: $${total.toFixed(2)}</strong></p><p style="color:#64748b;">${carrito.length} producto(s)</p></div>`, timer: 2000, showConfirmButton: false });
          vaciarCarrito();
          fetchStats();
          const data = await api.get("/productos", false);
          setProductos(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error(err);
          Swal.fire({ icon: "error", title: "Error", text: err.message || "No se pudo procesar la venta", confirmButtonColor: "#2563eb" });
        }
      }
    });
  };

  // Atajo de teclado F3 para cobrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F3") {
        e.preventDefault();
        if (carrito.length > 0) {
          handleCobrar();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [carrito.length, metodoPago, descuento]);

  if (loading) {
    return (
      <div className="pv-loading">
        <div className="pv-loader">
          <div className="pv-loader-dot"></div>
          <div className="pv-loader-dot"></div>
          <div className="pv-loader-dot"></div>
        </div>
        <p>Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="pv-wrapper">
      {/* Main panels */}
      <div className="pv-panels-row">
      {/* Panel Izquierdo */}
      <div className="pv-panel-left">
        {/* Stats */}
        <div className="pv-stats">
          <div className="pv-stat-card">
            <div className="pv-stat-icon pv-stat-ventas"><FaDollarSign size={22} /></div>
            <div className="pv-stat-info">
              <span className="pv-stat-label">Ventas del día</span>
              <span className="pv-stat-value">${totalVentasHoy.toFixed(2)}</span>
              <span className="pv-stat-sub">{ventasHoy} venta(s)</span>
            </div>
          </div>
          <div className="pv-stat-card">
            <div className="pv-stat-icon pv-stat-productos"><FaBox size={22} /></div>
            <div className="pv-stat-info">
              <span className="pv-stat-label">Productos</span>
              <span className="pv-stat-value">{productos.length}</span>
              <span className="pv-stat-sub">en inventario</span>
            </div>
          </div>
          <div className="pv-stat-card">
            <div className="pv-stat-icon pv-stat-clientes"><FaUsers size={22} /></div>
            <div className="pv-stat-info">
              <span className="pv-stat-label">Clientes</span>
              <span className="pv-stat-value">{clientesCount}</span>
              <span className="pv-stat-sub">registrados</span>
            </div>
          </div>
          <div className="pv-stat-card" style={{ cursor: "pointer" }} onClick={() => setShowDevolucion(true)}>
            <div className="pv-stat-icon pv-stat-historial"><FaHistory size={22} /></div>
            <div className="pv-stat-info">
              <span className="pv-stat-label">Historial hoy</span>
              <span className="pv-stat-value">{ventasList.length}</span>
              <span className="pv-stat-sub">ventas registradas</span>
            </div>
          </div>
        </div>

        {/* Header productos */}
        <div className="pv-products-header">
          <div className="pv-section-label">PRODUCTOS</div>
          <div className="pv-products-search">
            <FiSearch size={14} />
            <input
              ref={busquedaRef}
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const match = productos.find(
                    (p) => p.codigo && p.codigo.toLowerCase().trim() === busqueda.toLowerCase().trim()
                  );
                  if (match) {
                    agregarAlCarrito(match);
                    setBusqueda("");
                  }
                }
              }}
            />
          </div>
          <div className="pv-cat-filter">
            <span>Categoría:</span>
            <select value={categoriaActiva} onChange={(e) => setCategoriaActiva(e.target.value)}>
              {CATEGORIAS.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className="pv-sort">
            <span>Ordenar:</span>
            <select>
              <option>Nombre A-Z</option>
              <option>Precio</option>
              <option>Stock</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="pv-products-grid">
          {productosPaginados.length === 0 ? (
            <div className="pv-no-products">
              <FiPackage size={48} strokeWidth={1.5} />
              <p>No se encontraron productos</p>
            </div>
          ) : (
            productosPaginados.map((producto) => (
              <div key={producto._id || producto.id} className="pv-product-card">
                <div className="pv-product-img">
                  <img
                    src={producto.imagen || "https://placehold.co/300x300/1a1a2e/64748b?text=Sin+Imagen"}
                    alt={producto.nombre}
                    onError={(e) => { e.target.src = "https://placehold.co/300x300/1a1a2e/64748b?text=Sin+Imagen"; }}
                  />
                </div>
                <div className="pv-product-info">
                  <div className="pv-product-name">{producto.nombre}</div>
                  <div className="pv-product-price">${Number(producto.precio || 0).toFixed(2)}</div>
                  <div className="pv-product-stock">Stock: {producto.stock}</div>
                </div>
                <button
                  className="pv-product-add"
                  onClick={() => agregarAlCarrito(producto)}
                  disabled={producto.stock <= 0}
                >
                  <FiPlus size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="pv-pagination">
            <button className="pv-page-btn" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <FiChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              return (
                <button key={pageNum} className={`pv-page-num ${currentPage === pageNum ? "active" : ""}`} onClick={() => setCurrentPage(pageNum)}>
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && <><span className="pv-page-dots">...</span><button className="pv-page-num" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button></>}
            <button className="pv-page-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              <FiChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Panel Derecho - Carrito */}
      <div className="pv-panel-right">
        {/* Header */}
        <div className="pv-cart-header">
          <div className="pv-cart-header-left">
            <FiShoppingCart size={18} />
            <span>VENTA ACTUAL</span>
          </div>
          <button className="pv-cart-clear" onClick={() => setShowDevolucion(true)} style={{ background: "rgba(255,255,255,0.15)", marginRight: "8px" }}>
            <FaUndo size={14} /> Devolución
          </button>
          <button className="pv-cart-clear" onClick={vaciarCarrito}>
            <FiTrash2 size={14} /> Vaciar carrito
          </button>
        </div>

        {/* Lista */}
        <div className="pv-cart-body">
          {/* Table header */}
          <div className="pv-cart-table-head">
            <span className="pv-col-product">PRODUCTO</span>
            <span className="pv-col-qty">CANT.</span>
            <span className="pv-col-price">PRECIO</span>
            <span className="pv-col-total">TOTAL</span>
            <span className="pv-col-action"></span>
          </div>

          {carrito.length === 0 ? (
            <div className="pv-cart-empty">
              <FiShoppingCart size={40} strokeWidth={1} />
              <p>Carrito vacío</p>
            </div>
          ) : (
            <>
              {/* Items */}
              {carrito.map((item) => (
                <div key={item._id || item.id} className="pv-cart-item">
                  <div className="pv-col-product">
                    <img
                      src={item.imagen || "https://placehold.co/44x44/1a1a2e/64748b?text=?"}
                      alt={item.nombre}
                      className="pv-item-img"
                    />
                    <div className="pv-item-info">
                      <span className="pv-item-name">{item.nombre}</span>
                      <span className="pv-item-unit">${Number(item.precio).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="pv-col-qty">
                    <button onClick={() => actualizarCantidad(item._id || item.id, -1)}><FiMinus size={12} /></button>
                    <span>{item.cantidad}</span>
                    <button onClick={() => actualizarCantidad(item._id || item.id, 1)}><FiPlus size={12} /></button>
                  </div>
                  <div className="pv-col-price">${Number(item.precio).toFixed(2)}</div>
                  <div className="pv-col-total">${(item.precio * item.cantidad).toFixed(2)}</div>
                  <button className="pv-col-action" onClick={() => eliminarDelCarrito(item._id || item.id)}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pv-cart-footer">
          {/* Resumen + Métodos */}
          <div className="pv-cart-summary-row">
            <div className="pv-summary-left">
              <div className="pv-summary-line">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="pv-summary-line pv-discount-line">
                <span><FiEdit2 size={12} /> Descuento</span>
                <div className="pv-discount-input">
                  <span>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={descuento}
                    onChange={(e) => setDescuento(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="pv-total-line">
                <span>TOTAL</span>
                <span className="pv-total-value">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="pv-payment-grid">
              {METODOS_PAGO.map((metodo) => {
                const Icon = metodo.icon;
                return (
                  <button
                    key={metodo.id}
                    className={`pv-pay-btn ${metodoPago === metodo.id ? "active" : ""}`}
                    onClick={() => setMetodoPago(metodo.id)}
                  >
                    <Icon size={16} />
                    <span>{metodo.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cobrar */}
          <button className="pv-checkout" onClick={handleCobrar} disabled={carrito.length === 0}>
            COBRAR &nbsp; ${total.toFixed(2)} &nbsp; <span className="pv-f3">F3</span>
          </button>
        </div>
      </div>
      </div>

      {/* Modal de Historial / Devoluciones */}
      {showDevolucion && (
        <div className="pv-devolucion-overlay" onClick={() => setShowDevolucion(false)}>
          <div className="pv-devolucion-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pv-devolucion-header">
              <h3><FaHistory /> Historial de ventas del día</h3>
              <button className="pv-devolucion-close" onClick={() => setShowDevolucion(false)}>✕</button>
            </div>
            <div className="pv-devolucion-body">
              {ventasList.length === 0 ? (
                <div className="pv-devolucion-empty">No hay ventas registradas hoy.</div>
              ) : (
                ventasList.map((v) => {
                  const productos = v.productosComprados || v.productos_comprados || [];
                  const esDevuelta = (v.estado || "").toLowerCase() === "devuelto";
                  const fechaObj = new Date(v.fecha_compra || v.fecha);
                  const fechaStr = fechaObj.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
                  const horaStr = fechaObj.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={v.id} className="pv-historial-card">
                      {/* Imagen del primer producto */}
                      <div className="pv-historial-img-wrap">
                        <img
                          src={productos[0]?.imagen || "https://placehold.co/80x80/1a1a2e/64748b?text=Sin+Img"}
                          alt={productos[0]?.nombre || "Venta"}
                          onError={(e) => { e.target.src = "https://placehold.co/80x80/1a1a2e/64748b?text=Sin+Img"; }}
                        />
                        {productos.length > 1 && (
                          <span className="pv-historial-badge">+{productos.length - 1}</span>
                        )}
                      </div>

                      {/* Info central */}
                      <div className="pv-historial-info">
                        <div className="pv-historial-products">
                          {Array.isArray(productos) && productos.map((p, i) => (
                            <span key={i} className="pv-historial-prod-name">{p.nombre}{i < productos.length - 1 ? ", " : ""}</span>
                          ))}
                        </div>
                        <div className="pv-historial-meta">
                          <span className="pv-historial-fecha"><strong>Fecha:</strong> {fechaStr}</span>
                          <span className="pv-historial-hora"><strong>Hora:</strong> {horaStr} hs</span>
                          <span className="pv-historial-id">Venta #{v.id}</span>
                        </div>
                      </div>

                      {/* Total + botón */}
                      <div className="pv-historial-actions">
                        <span className={`pv-historial-total ${esDevuelta ? "devuelto" : ""}`}>
                          ${Number(v.total_venta || v.total || 0).toFixed(2)}
                        </span>
                        {esDevuelta ? (
                          <span className="pv-devolucion-tag devuelto">Devuelto</span>
                        ) : (
                          <button className="pv-devolucion-btn" onClick={() => handleDevolver(v.id)}>
                            <FaUndo size={12} /> Devolver
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PuntoDeVenta;
