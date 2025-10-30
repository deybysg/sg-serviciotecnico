import { useState } from "react";
import useCartStore from "../store/cartStore"; 
import Swal from "sweetalert2"; 

function ProductoCard({ producto, isLoggedIn = true }) {
  const [modalOpen, setModalOpen] = useState(false);
  const addToCart = useCartStore(state => state.addToCart); 

  const handleAddToCart = () => {
    if (producto.stock > 0) {
      addToCart(producto);
      Swal.fire({
        icon: "success",
        title: "Agregado",
        text: `${producto.nombre} añadido al carrito.`,
        timer: 1500,
        showConfirmButton: false,
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

      <style>{`
        .producto-card {
          display: flex;
          flex-direction: row;
          align-items: center;
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 16px 12px;
          border-bottom: 1px solid #ddd;
          background: linear-gradient(135deg, #f7fafd 60%, #e0e7ff 100%);
          transition: background 0.2s, transform 0.2s;
        }
        .producto-card:hover {
          background: linear-gradient(135deg, #eef2ff 60%, #d9e1ff 100%);
        }
        .producto-img {
          width: 140px;
          height: 140px;
          margin: 0 16px 0 0;
          flex-shrink: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 16px;
          background: #fff;
          overflow: hidden;
        }
        .producto-img img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .producto-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .producto-info h3 {
          font-size: 1.1rem;
          color: #2e3192;
          margin-bottom: 6px;
          font-weight: 700;
          text-align: left;
        }
        .producto-info p {
          font-size: 0.95rem;
          margin: 2px 0;
          color: #444;
          text-align: left;
        }
        .stock {
          display: inline-block;
          margin-top: 6px;
          padding: 0.4rem 1rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          color: #fff;
        }
        .stock.ok {
          background: linear-gradient(90deg, #1bb934, #4be36a);
        }
        .stock.no {
          background: linear-gradient(90deg, #d90429, #ff6a7a);
        }
        .producto-actions {
          display: flex;
          flex-direction: row;
          gap: 10px;
          margin-top: 8px;
        }
        .btn-detalles {
          background: #145a6a;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 6px 12px;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .btn-detalles:hover {
          background: #0e3f4d;
          transform: scale(1.05);
        }
        .btn-agregar-carrito {
          background: #2e3192;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 6px 12px;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .btn-agregar-carrito:hover {
          background: #1f2168;
          transform: scale(1.05);
        }
        .btn-agregar-carrito:disabled {
          background: #6c757d;
          cursor: not-allowed;
          transform: none;
        }
        .btn-agregar-carrito-modal {
          margin-top: 15px;
          width: 100%;
          padding: 10px;
          font-size: 1rem;
          background: #2e3192;
          color: #fff;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .btn-agregar-carrito-modal:hover {
          background: #1f2168;
          transform: scale(1.02);
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          backdrop-filter: blur(6px);
        }
        .modal-card {
          background: linear-gradient(135deg, #f7fafd, #e0e7ff);
          border-radius: 24px;
          padding: 2rem;
          max-width: 420px;
          width: 90%;
          position: relative;
          text-align: center;
          box-shadow: 0 16px 48px rgba(44,62,80,0.25);
          border: 2px solid #2e3192;
          animation: scaleUp 0.3s ease-out;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-card img {
          width: 100%;
          max-height: 220px;
          object-fit: contain;
          margin: 1rem 0;
          border-radius: 12px;
          box-shadow: 0 4px 18px rgba(44,62,80,0.1);
        }
        .modal-close {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #2e3192;
          color: #fff;
          border: none;
          border-radius: 50%;
          width: 2.2rem;
          height: 2.2rem;
          font-size: 1.2rem;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        @keyframes scaleUp {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @media (max-width: 768px) {
          .producto-card {
            padding: 10px 0;
          }
          .producto-img {
            width: 110px;
            height: 110px;
            margin-right: 12px;
          }
          .producto-info h3 {
            font-size: 1rem;
          }
          .producto-info p {
            font-size: 0.85rem;
          }
          .stock {
            font-size: 0.8rem;
            padding: 4px 8px;
          }
          .producto-actions {
            flex-direction: column;
            gap: 5px;
          }
          .producto-actions .btn-detalles,
          .producto-actions .btn-agregar-carrito {
            width: 100%;
          }
          .modal-card {
            width: 95%;
            max-width: 95%;
            max-height: 90vh;
            overflow-y: auto;
            padding: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}

export default ProductoCard;
