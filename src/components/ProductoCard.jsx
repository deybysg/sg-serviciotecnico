
import { useState } from "react";
import useCartStore from "../store/cartStore"; 
import Swal from "sweetalert2"; 
import "./ProductoCard.css";

function ProductoCard({ producto, isLoggedIn = true }) {
  const [modalOpen, setModalOpen] = useState(false);
  const addToCart = useCartStore(state => state.addToCart); 

  const handleAddToCart = () => {
    if (producto.stock > 0) {
      addToCart(producto);
      
      // Toast moderno arriba a la derecha
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `${producto.nombre} añadido`,
        html: `<div style="font-size: 0.85rem; color: #666;">Agregado al carrito</div>`,
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.style.marginTop = '80px';
          toast.style.marginRight = '12px';
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        },
        willClose: () => {
          // Asegurar que se limpie correctamente
        },
        customClass: {
          popup: 'toast-custom-popup',
          title: 'toast-custom-title',
          icon: 'toast-custom-icon'
        }
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Sin stock",
        text: `${producto.nombre} está agotado.`,
      });
    }
  };

  return (
    <>
      <div className="producto-card">
        <div className="producto-img">
          <img src={producto.imagen} alt={producto.nombre} />
        </div>

        <div className="producto-info">
          <h3>{producto.nombre}</h3>
          <p><strong>Categoría:</strong> {producto.categoria}</p>
          <p><strong>Precio:</strong> ${producto.precio}</p>
          <span className={`stock ${producto.stock > 0 ? "ok" : "no"}`}>
            {producto.stock > 0
              ? `Stock disponible: ${producto.stock}`
              : `Sin stock: 0`}
          </span>

          <div className="producto-actions">
            <button className="btn-detalles" onClick={() => setModalOpen(true)}>
              Ver detalles
            </button>

            {isLoggedIn && (
              <button
                className="btn-agregar-carrito"
                onClick={handleAddToCart}
                disabled={producto.stock === 0}
              >
                {producto.stock > 0 ? "Agregar al Carrito" : "Agotado"}
              </button>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              &times;
            </button>
            <h2>{producto.nombre}</h2>
            <img src={producto.imagen} alt={producto.nombre} />
            <p><strong>Descripción:</strong> {producto.descripcion}</p>
            <p><strong>Categoría:</strong> {producto.categoria}</p>
            <p><strong>Precio:</strong> ${producto.precio}</p>
            <span className={`stock ${producto.stock > 0 ? "ok" : "no"}`}>
              {producto.stock > 0
                ? `Stock disponible: ${producto.stock}`
                : `Sin stock: 0`}
            </span>

            {isLoggedIn && (
              <button
                className="btn-agregar-carrito-modal"
                onClick={() => {
                  handleAddToCart();
                  setModalOpen(false);
                }}
                disabled={producto.stock === 0}
              >
                {producto.stock > 0 ? "Agregar al Carrito" : "Agotado"}
              </button>
            )}
          </div>
        </div>
      )}

    </>
  );
}

export default ProductoCard;
