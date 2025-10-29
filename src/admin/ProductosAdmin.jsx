import React, { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
import { shortId } from "../utils/id";
import Swal from "sweetalert2";
import "./ProductosAdmin.css"; 

const CATEGORIAS_VALIDAS = ["celulares", "computadoras", "accesorios", "otros"];
const UMBRAL_STOCK_BAJO = 5; // Constante para el umbral de stock bajo o crítico

// =================================================================
// 2. COMPONENTE INTERNO: AlertaStockModal (Muestra la lista de detalles)
// El modal que se abre al tocar el icono ☰
// =================================================================
function AlertaStockModal({ productosAAlertar, onClose }) {
    // Clasificamos productosAAlertar para mostrar mejor el detalle
    const productosAgotados = productosAAlertar.filter(p => p.stock === 0);
    // Corregido: Solo productos con stock > 0 pero <= UMBRAL
    const productosCasiAgotados = productosAAlertar.filter(p => p.stock > 0 && p.stock <= UMBRAL_STOCK_BAJO);

    return (
        <div className="stock-alerta-modal-fondo" onClick={onClose}>
            <div
                className="stock-alerta-modal-contenido"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-titulo"
                // Evita que el clic en el contenido cierre el modal
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="modal-titulo" className="stock-alerta-modal-titulo">
                    ⚠️ Alerta de Stock ({productosAAlertar.length})
                </h2>
                <button onClick={onClose} className="stock-alerta-modal-cerrar-btn" aria-label="Cerrar">&times;</button>
                
                <ul className="stock-alerta-lista">
                    {productosAgotados.length > 0 && (
                        <li className="stock-alerta-grupo-titulo">🚨 Productos AGOTADOS ({productosAgotados.length})</li>
                    )}
                    {productosAgotados.map((prod) => (
                                                <li key={prod._id || prod.id} className="stock-alerta-item stock-alerta-item--cero">
                            <span className="stock-alerta-item-nombre">
                                {prod.nombre} 
                                <span className="stock-alerta-categoria">({prod.categoria.charAt(0).toUpperCase() + prod.categoria.slice(1)})</span>
                            </span>
                            <span className="stock-alerta-item-detalle">
                                Stock: **0** (Crítico)
                            </span>
                        </li>
                    ))}
                    
                    {productosCasiAgotados.length > 0 && (
                        <li className="stock-alerta-grupo-titulo">⚠️ Productos BAJO Stock ({productosCasiAgotados.length})</li>
                    )}
                    {productosCasiAgotados.map((prod) => (
                                                <li key={prod._id || prod.id} className="stock-alerta-item stock-alerta-item--bajo">
                            <span className="stock-alerta-item-nombre">
                                {prod.nombre}
                                <span className="stock-alerta-categoria">({prod.categoria.charAt(0).toUpperCase() + prod.categoria.slice(1)})</span>
                            </span>
                            <span className="stock-alerta-item-detalle">
                                Stock: **{prod.stock}** (Umbral: {UMBRAL_STOCK_BAJO})
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

// =================================================================
// 3. COMPONENTE INTERNO: ProductoFormModal (Formulario de Edición/Creación)
// Este componente no se modifica
// =================================================================
function ProductoFormModal({ productoInicial, onClose, onGuardar }) {
    const [formData, setFormData] = useState({
        _id: productoInicial?._id || productoInicial?.id || "",
        nombre: productoInicial?.nombre || "",
        categoria: productoInicial?.categoria || CATEGORIAS_VALIDAS[0],
        descripcion: productoInicial?.descripcion || "",
        precio: productoInicial?.precio || 0,
        stock: productoInicial?.stock || 0,
        imagen: productoInicial?.imagen || "",
    });    const [useFileMode, setUseFileMode] = useState(false);
    const [localFile, setLocalFile] = useState(null);

    const isEditing = !!productoInicial;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'precio' || name === 'stock' ? Number(value) : value,
        }));
    };
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setLocalFile(file); 
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.precio <= 0 || formData.stock < 0 || formData.nombre.trim() === "") {
            alert("Por favor, complete los campos obligatorios correctamente.");
            return;
        }

        let finalData = { ...formData };
        
        if (useFileMode && localFile) {
            finalData.imagen = "https://placehold.co/400x300/e9ecef/868e96?text=Imagen+Local"; 
        } else if (useFileMode && !localFile && !isEditing) {
            alert("Debe seleccionar un archivo si eligió la opción de archivo local.");
            return;
        }
        
        if (!useFileMode && finalData.imagen.trim() === "") {
            finalData.imagen = "https://placehold.co/400x300/e9ecef/868e96?text=Sin+Imagen";
        }

        onGuardar(finalData);
    };

    return (
        <div className="modal-producto-backdrop">
            <div className="modal-producto-content">
                <h3 className="modal-producto-title">
                    {isEditing ? "Editar Producto" : "Crear Nuevo Producto"}
                </h3>
                
                <button className="modal-producto-close" onClick={onClose} aria-label="Cerrar">&times;</button>

                <form onSubmit={handleSubmit} className="modal-producto-form">
                    
                    <div className="modal-producto-group">
                        <label htmlFor="nombre">Nombre:</label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="modal-producto-group">
                        <label htmlFor="categoria">Categoría:</label>
                        <select
                            id="categoria"
                            name="categoria"
                            value={formData.categoria}
                            onChange={handleChange}
                            required
                        >
                            {CATEGORIAS_VALIDAS.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="modal-producto-group-inline">
                        <div className="modal-producto-group">
                            <label htmlFor="precio">Precio ($):</label>
                            <input
                                type="number"
                                id="precio"
                                name="precio"
                                value={formData.precio}
                                onChange={handleChange}
                                min="0.01"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className="modal-producto-group">
                            <label htmlFor="stock">Stock:</label>
                            <input
                                type="number"
                                id="stock"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                min="0"
                                required
                            />
                        </div>
                    </div>
                
                    {/* Lógica de Carga de Imagen */}
                    <div className="modal-producto-group-image">
                        <label>Carga de Imagen:</label>
                        <div className="modal-producto-toggle-group">
                            <button 
                                type="button" 
                                className={`btn-toggle ${!useFileMode ? 'active' : ''}`}
                                onClick={() => setUseFileMode(false)}>
                                Usar URL
                            </button>
                            <button 
                                type="button" 
                                className={`btn-toggle ${useFileMode ? 'active' : ''}`}
                                onClick={() => setUseFileMode(true)}>
                                Subir Archivo
                            </button>
                        </div>

                        {!useFileMode ? (
                            <input id="urlImagen-productos"
                                type="text"
                                name="imagen"
                                placeholder="Pega la URL de la imagen aquí..."
                                value={formData.imagen}
                                onChange={handleChange}
                            />
                        ) : (
                            <div className="modal-producto-file-input-wrapper">
                                <input
                                    type="file"
                                    id="fileUpload"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="fileUpload" className="btn-file-upload">
                                    {localFile ? `Archivo: ${localFile.name}` : "Seleccionar Imagen Local"}
                                </label>
                                {localFile && (
                                    <span className="file-info-text">
                                        Listo para guardar.
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Fin Lógica de Carga de Imagen */}

                    <div className="modal-producto-group">
                        <label htmlFor="descripcion">Descripción:</label>
                        <textarea
                            id="descripcion"
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="modal-producto-actions">
                        <button type="button" className="btn-cancelar" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-guardar">
                            {isEditing ? "Guardar Cambios" : "Crear Producto"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// =================================================================
// 4. COMPONENTE PRINCIPAL: ProductosAdmin
// =================================================================
function ProductosAdmin() {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [showStockModal, setShowStockModal] = useState(false);
    // NUEVO ESTADO PARA EL BUSCADOR
    const [searchTerm, setSearchTerm] = useState(''); 
    
    // Cálculo Dinámico de las Alertas (se actualiza automáticamente con 'productos')
    const productosAAlertar = productos.filter(p => p.stock <= UMBRAL_STOCK_BAJO);
    const productosAgotados = productosAAlertar.filter(p => p.stock === 0);
    const productosCasiAgotados = productosAAlertar.filter(p => p.stock > 0 && p.stock <= UMBRAL_STOCK_BAJO);
    const totalAlertas = productosAAlertar.length;
    
    // FUNCIÓN DE ALERTA MODIFICADA
    const getAlertaTexto = () => {
        const totalBajoStock = productosCasiAgotados.length;
        const totalAgotados = productosAgotados.length;
        
        if (totalAlertas === 0) return null;
        
        let texto = `🚨 Tienes **${totalAgotados} producto${totalAgotados !== 1 ? 's' : ''} AGOTADO${totalAgotados !== 1 ? 'S' : ''}**.`;
        
        if (totalBajoStock > 0) {
            texto += ` Además, **${totalBajoStock}** ${totalBajoStock === 1 ? 'está' : 'están'} con stock BAJO (≤${UMBRAL_STOCK_BAJO}).`;
        } else {
            texto = `🚨 Tienes **${totalAgotados} producto${totalAgotados !== 1 ? 's' : ''} AGOTADO${totalAgotados !== 1 ? 'S' : ''}**.`;
        }
        
        if (totalAgotados === 0 && totalBajoStock > 0) {
            texto = `⚠️ Tienes **${totalBajoStock} producto${totalBajoStock !== 1 ? 's' : ''}** con stock BAJO (≤${UMBRAL_STOCK_BAJO}).`;
        }

        return texto;
    };
    
    const alertaTexto = getAlertaTexto();


    // Función para obtener los datos de la API
    const fetchProductos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // GET /productos es público (no requiere auth)
            const data = await api.get('/productos', false);
            setProductos(Array.isArray(data) ? data : []); 
        } catch (err) {
            setError(err.message || "Error al cargar productos");
        } finally {
            setLoading(false);
        }
    }, []);    useEffect(() => {
        fetchProductos();
    }, [fetchProductos]); 
    
    // --- LÓGICA DE FILTRADO ---
    const productosFiltrados = productos.filter(producto => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        
        // Si el término de búsqueda está vacío, muestra todos
        if (!lowerCaseSearch) return true;

        // Filtra por nombre o categoría
        return (
            producto.nombre.toLowerCase().includes(lowerCaseSearch) ||
            producto.categoria.toLowerCase().includes(lowerCaseSearch)
        );
    });


    // --- Handlers CRUD (Crear, Editar, Guardar, Eliminar) ---
    const handleCrear = () => {
        setProductoSeleccionado(null); 
        setShowModal(true);
    };

    const handleEditar = (producto) => {
        setProductoSeleccionado(producto);
        setShowModal(true);
    };

    const handleGuardar = async (producto) => {
        const isEditing = !!productoSeleccionado;

        try {
            let resultado;
            
            if (isEditing) {
                // PUT /productos/:id (requiere auth)
                const id = producto._id || producto.id;
                // No enviar _id ni id en el body
                const { _id, id: oldId, ...productoData } = producto;
                resultado = await api.put(`/productos/${id}`, productoData);
            } else {
                // POST /productos (requiere auth)
                // No necesitamos generar ID, MongoDB lo hace automáticamente
                const { _id, id, ...productoData } = producto;
                resultado = await api.post('/productos', productoData);
            }
            
            setShowModal(false); 
            fetchProductos(); // Recargar la lista
            
            // Toast notification
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });

            Toast.fire({
                icon: 'success',
                title: isEditing ? '✅ Producto actualizado exitosamente' : '✅ Producto creado exitosamente'
            });
            
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message || `Error al ${isEditing ? "guardar los cambios" : "crear el producto"}.`,
                confirmButtonColor: '#3b82f6'
            });
        }
    };    const handleEliminar = async (id, nombre) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: `Se eliminará el producto: ${nombre}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) return;

        try {
            // DELETE /productos/:id (requiere auth)
            await api.delete(`/productos/${id}`);
            
            // Actualizar la lista localmente - convertir a String para comparación
            setProductos((prev) => prev.filter((p) => String(p._id || p.id) !== String(id)));
            
            // Toast notification
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });

            Toast.fire({
                icon: 'success',
                title: `🗑️ Producto "${nombre}" eliminado exitosamente`
            });
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.message || "Error al eliminar el producto.",
                confirmButtonColor: '#3b82f6'
            });
        }
    };
    if (loading) return <div className="admin-producto-loading">Cargando productos...</div>;
    if (error) return <div className="admin-producto-error">Error: {error}</div>;

    return (
        <div className="admin-producto-container">
            <h2 className="admin-producto-header">Gestión de Inventario de Productos</h2>
            
            <div className="admin-producto-header-actions">
                 <button className="admin-producto-btn-nuevo" onClick={handleCrear}>
                     Crear Nuevo Producto
                 </button>
            </div>
            
            {/* --- 1. Buscador (NUEVO) --- */}
            <div className="admin-producto-search-bar">
                <input
                    type="text"
                    placeholder="Buscar por Nombre o Categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="admin-producto-search-input"
                />
            </div>

            {/* --- 2. Aviso de Stock Resumido con Icono de Menú --- */}
            {totalAlertas > 0 && (
                <div className="stock-alerta-contenedor">
                    <div className="stock-alerta-aviso stock-alerta-aviso--activo">
                        <p dangerouslySetInnerHTML={{ __html: alertaTexto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                        <button
                            onClick={() => setShowStockModal(true)}
                            className="stock-alerta-boton-detalle" // Este es el botón ☰
                            aria-label="Ver detalles de stock"
                        >
                            ☰ 
                        </button>
                    </div>
                </div>
            )}
            
            
            {/* --- Tabla de Productos --- */}
            <div className="admin-producto-tabla-wrapper">
                <table className="admin-producto-tabla">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="admin-producto-no-data">
                                    No se encontraron productos con el término de búsqueda.
                                </td>
                            </tr>
                        ) : (
                            productosFiltrados.map((producto) => (
                                <tr key={producto._id || producto.id} className={producto.stock <= UMBRAL_STOCK_BAJO ? 'fila-stock-bajo' : ''}>
                                                    <td className="admin-producto-id">
                                                        {shortId(producto._id || producto.id, 6)}
                                                    </td>
                                    <td>{producto.nombre}</td>
                                    <td>{producto.categoria.charAt(0).toUpperCase() + producto.categoria.slice(1)}</td>
                                    <td className="admin-producto-precio">${producto.precio.toLocaleString('es-AR')}</td>
                                    <td>
                                        <span className={`admin-producto-stock admin-producto-stock-${producto.stock > UMBRAL_STOCK_BAJO ? 'ok' : producto.stock === 0 ? 'cero' : 'alerta'}`}>
                                            {producto.stock}
                                        </span>
                                    </td>
                                    <td className="admin-producto-actions">
                                        <button 
                                            className="admin-producto-btn-editar" 
                                            onClick={() => handleEditar(producto)}>
                                                Editar
                                        </button>
                                        <button 
                                            className="admin-producto-btn-eliminar" 
                                                                                        onClick={() => handleEliminar(producto._id || producto.id, producto.nombre)}>
                                                Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Modal de Edición/Creación --- */}
            {showModal && (
                <ProductoFormModal
                    productoInicial={productoSeleccionado}
                    onClose={() => setShowModal(false)}
                    onGuardar={handleGuardar}
                />
            )}
            
            {/* --- Modal de Alertas de Stock (Muestra los detalles) --- */}
            {showStockModal && (
                <AlertaStockModal
                    productosAAlertar={productosAAlertar}
                    onClose={() => setShowStockModal(false)}
                />
            )}
        </div>
    );
}

export default ProductosAdmin;