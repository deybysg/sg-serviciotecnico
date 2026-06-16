import React, { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";
import { shortId } from "../utils/id";
import Swal from "sweetalert2";
import "./ProductosAdmin.css";
import { FiBox, FiTag, FiDollarSign, FiHash, FiImage, FiFileText, FiPlus, FiEdit3, FiTrash2, FiSearch, FiAlertTriangle, FiPackage, FiX, FiSave, FiUpload, FiLink } from "react-icons/fi"; 

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
                onClick={(e) => e.stopPropagation()}
            >
                <div className="stock-alerta-modal-header">
                    <div className="stock-alerta-modal-avatar">
                        <FiAlertTriangle size={20} />
                    </div>
                    <div className="stock-alerta-modal-header-info">
                        <h2 id="modal-titulo">Alerta de Stock</h2>
                        <span>{productosAAlertar.length} productos requieren atención</span>
                    </div>
                    <button onClick={onClose} className="stock-alerta-modal-cerrar-btn" aria-label="Cerrar">
                        <FiX size={20} />
                    </button>
                </div>

                <ul className="stock-alerta-lista">
                    {productosAgotados.length > 0 && (
                        <li className="stock-alerta-grupo-titulo stock-alerta-grupo--cero">
                            <FiPackage size={14} /> Agotados ({productosAgotados.length})
                        </li>
                    )}
                    {productosAgotados.map((prod) => (
                        <li key={prod._id || prod.id} className="stock-alerta-item stock-alerta-item--cero">
                            <span className="stock-alerta-item-nombre">
                                {prod.nombre}
                                <span className="stock-alerta-categoria">{prod.categoria.charAt(0).toUpperCase() + prod.categoria.slice(1)}</span>
                            </span>
                            <span className="stock-alerta-item-detalle">
                                Stock: <strong>0</strong>
                            </span>
                        </li>
                    ))}

                    {productosCasiAgotados.length > 0 && (
                        <li className="stock-alerta-grupo-titulo stock-alerta-grupo--bajo">
                            <FiAlertTriangle size={14} /> Stock Bajo ({productosCasiAgotados.length})
                        </li>
                    )}
                    {productosCasiAgotados.map((prod) => (
                        <li key={prod._id || prod.id} className="stock-alerta-item stock-alerta-item--bajo">
                            <span className="stock-alerta-item-nombre">
                                {prod.nombre}
                                <span className="stock-alerta-categoria">{prod.categoria.charAt(0).toUpperCase() + prod.categoria.slice(1)}</span>
                            </span>
                            <span className="stock-alerta-item-detalle">
                                Stock: <strong>{prod.stock}</strong> / umbral {UMBRAL_STOCK_BAJO}
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
        precio: productoInicial?.precio ?? "",
        stock: productoInicial?.stock ?? "",
        imagen: productoInicial?.imagen || "",
    });    const [useFileMode, setUseFileMode] = useState(false);
    const [localFile, setLocalFile] = useState(null);
    const [localFileBase64, setLocalFileBase64] = useState(null);

    const isEditing = !!productoInicial;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'precio' || name === 'stock' ? (value === '' ? '' : Number(value)) : value,
        }));
    };
    
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tamaño máximo (2MB)
            const maxSize = 2 * 1024 * 1024; // 2MB en bytes
            if (file.size > maxSize) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Imagen muy grande',
                    text: 'La imagen no debe superar los 2MB. Usá una URL de imagen o comprimí la imagen.',
                    timer: 3000
                });
                setLocalFile(null);
                setLocalFileBase64(null);
                return;
            }
            setLocalFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalFileBase64(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setLocalFile(null);
            setLocalFileBase64(null);
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // ===== VALIDACIONES FRONTEND =====
        
        // Validar nombre no vacío
        if (!formData.nombre || formData.nombre.trim() === "") {
            Swal.fire({
                icon: 'warning',
                title: 'Nombre requerido',
                text: 'El nombre del producto es obligatorio',
                timer: 2000
            });
            return;
        }

        // Validar nombre mínimo 2 caracteres
        if (formData.nombre.trim().length < 2) {
            Swal.fire({
                icon: 'warning',
                title: 'Nombre muy corto',
                text: 'El nombre debe tener al menos 2 caracteres',
                timer: 2000
            });
            return;
        }

        // Validar descripción (opcional, puede estar vacía)
        if (!formData.descripcion) {
            formData.descripcion = "";
        }

        let finalData = { ...formData };
        
        // Validar precio (puede ser 0)
        if (finalData.precio === "" || finalData.precio === null || finalData.precio === undefined) {
            finalData.precio = 0;
        }

        // Validar stock (puede ser 0)
        if (finalData.stock === "" || finalData.stock === null || finalData.stock === undefined) {
            finalData.stock = 0;
        }

        // Validar stock no negativo
        if (finalData.stock < 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Stock inválido',
                text: 'El stock no puede ser negativo',
                timer: 2000
            });
            return;
        }

        // Validar URL de imagen (solo si se proporcionó una URL)
        if (!useFileMode && formData.imagen && formData.imagen.trim() !== "") {
            const urlRegex = /^(https?:\/\/)/i;
            if (!urlRegex.test(formData.imagen)) {
                Swal.fire({
                    icon: 'warning',
                    title: 'URL inválida',
                    text: 'La URL debe comenzar con http:// o https://',
                    timer: 2500
                });
                return;
            }
        }

        if (useFileMode && localFileBase64) {
            // Validar tamaño del base64 (máximo 8MB para ser seguro)
            const maxBase64Length = 8 * 1024 * 1024; // 8MB aproximado en base64
            if (localFileBase64.length > maxBase64Length) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Imagen muy grande',
                    text: 'La imagen es muy grande. Usá una URL de imagen o una imagen más liviana.',
                    timer: 3000
                });
                return;
            }
            finalData.imagen = localFileBase64;
        } else if (useFileMode && !localFileBase64 && !isEditing) {
            Swal.fire({
                icon: 'warning',
                title: 'Archivo requerido',
                text: 'Debe seleccionar un archivo si eligió la opción de archivo local',
                timer: 2000
            });
            return;
        }
        
        if (!useFileMode && finalData.imagen.trim() === "") {
            finalData.imagen = "https://placehold.co/400x300/e9ecef/868e96?text=Sin+Imagen";
        }

        onGuardar(finalData);
    };    return (
        <div className="modal-producto-backdrop">
            <div className="modal-producto-content">
                {/* Header */}
                <div className="modal-producto-header">
                    <div className="modal-producto-avatar">
                        <FiBox size={20} />
                    </div>
                    <div className="modal-producto-header-info">
                        <h3>{isEditing ? "Editar Producto" : "Nuevo Producto"}</h3>
                        <span>{isEditing ? "Modificá los datos del producto" : "Completá los datos del nuevo producto"}</span>
                    </div>
                    <button className="modal-producto-close" onClick={onClose} aria-label="Cerrar">
                        <FiX size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-producto-form">
                    <div className="modal-producto-body">
                        {/* Row 1: Nombre + Categoría */}
                        <div className="modal-producto-row">
                            <div className="modal-producto-field">
                                <label className="modal-producto-label">
                                    <FiTag size={12} /> Nombre <span className="modal-producto-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    className="modal-producto-input"
                                    placeholder="Ej: iPhone 13 Pro"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="modal-producto-field">
                                <label className="modal-producto-label">
                                    <FiPackage size={12} /> Categoría <span className="modal-producto-required">*</span>
                                </label>
                                <select
                                    name="categoria"
                                    className="modal-producto-input modal-producto-select"
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
                        </div>

                        {/* Row 2: Precio + Stock */}
                        <div className="modal-producto-row">
                            <div className="modal-producto-field">
                                <label className="modal-producto-label">
                                    <FiDollarSign size={12} /> Precio ($) <span className="modal-producto-required">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="precio"
                                    className="modal-producto-input"
                                    placeholder="0.00"
                                    value={formData.precio}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="modal-producto-field">
                                <label className="modal-producto-label">
                                    <FiHash size={12} /> Stock <span className="modal-producto-required">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    className="modal-producto-input"
                                    placeholder="0"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Imagen */}
                        <div className="modal-producto-field">
                            <label className="modal-producto-label">
                                <FiImage size={12} /> Imagen
                            </label>
                            <div className="modal-producto-toggle-group">
                                <button
                                    type="button"
                                    className={`modal-producto-toggle-btn ${!useFileMode ? 'active' : ''}`}
                                    onClick={() => setUseFileMode(false)}
                                >
                                    <FiLink size={12} /> URL
                                </button>
                                <button
                                    type="button"
                                    className={`modal-producto-toggle-btn ${useFileMode ? 'active' : ''}`}
                                    onClick={() => setUseFileMode(true)}
                                >
                                    <FiUpload size={12} /> Subir
                                </button>
                            </div>

                            {!useFileMode ? (
                                <input
                                    type="text"
                                    name="imagen"
                                    className="modal-producto-input"
                                    placeholder="https://ejemplo.com/imagen.jpg"
                                    value={formData.imagen}
                                    onChange={handleChange}
                                />
                            ) : (
                                <div className="modal-producto-file-wrapper">
                                    <input
                                        type="file"
                                        id="fileUpload"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="fileUpload" className="modal-producto-file-btn">
                                        <FiUpload size={14} />
                                        {localFile ? localFile.name : "Seleccionar imagen"}
                                    </label>
                                    {localFile && (
                                        <span className="modal-producto-file-info">Listo para guardar</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Descripción */}
                        <div className="modal-producto-field">
                            <label className="modal-producto-label">
                                <FiFileText size={12} /> Descripción
                            </label>
                            <textarea
                                name="descripcion"
                                className="modal-producto-input modal-producto-textarea"
                                placeholder="Descripción del producto..."
                                value={formData.descripcion}
                                onChange={handleChange}
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="modal-producto-footer">
                        <button type="button" className="modal-producto-btn modal-producto-btn-cancel" onClick={onClose}>
                            <FiX size={14} /> Cancelar
                        </button>
                        <button type="submit" className="modal-producto-btn modal-producto-btn-save">
                            <FiSave size={14} /> {isEditing ? "Guardar" : "Crear"}
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
        <div className="admin-producto-full">
            <div className="admin-producto-shell">
                {/* Header */}
                <div className="admin-producto-workboard-header">
                    <div>
                        <h1>Gestión de Productos</h1>
                        <p>Administra el inventario, stock y precios de todos los productos.</p>
                    </div>
                    <div className="admin-producto-workboard-actions">
                        <button className="admin-producto-primary-btn" onClick={handleCrear}>
                            <FiPlus size={18} /> Nuevo Producto
                        </button>
                        {totalAlertas > 0 && (
                            <button
                                className="admin-producto-icon-btn"
                                onClick={() => setShowStockModal(true)}
                                aria-label="Ver alertas de stock"
                                title="Ver alertas de stock"
                            >
                                <FiAlertTriangle size={18} />
                                <strong>{totalAlertas}</strong>
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="admin-producto-summary">
                    <div className="admin-producto-summary-card featured">
                        <span className="admin-producto-summary-icon"><FiBox /></span>
                        <div>
                            <p>Total Productos</p>
                            <strong>{productos.length}</strong>
                        </div>
                    </div>
                    <div className="admin-producto-summary-card warning">
                        <span className="admin-producto-summary-icon"><FiAlertTriangle /></span>
                        <div>
                            <p>Stock Bajo</p>
                            <strong>{productosCasiAgotados.length}</strong>
                        </div>
                    </div>
                    <div className="admin-producto-summary-card danger">
                        <span className="admin-producto-summary-icon"><FiPackage /></span>
                        <div>
                            <p>Agotados</p>
                            <strong>{productosAgotados.length}</strong>
                        </div>
                    </div>
                </div>

                {/* Buscador */}
                <div className="admin-producto-filters">
                    <div className="admin-producto-search">
                        <FiSearch size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o categoría..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Grid de Productos */}
                <div className="admin-producto-grid">
                    {productosFiltrados.length === 0 ? (
                        <div className="admin-producto-empty">
                            <FiSearch size={48} />
                            <p>No se encontraron productos</p>
                            <span>Intentá con otro término de búsqueda</span>
                        </div>
                    ) : (
                        productosFiltrados.map((producto) => {
                            const iniciales = producto.nombre
                                ? producto.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                : '??';
                            const stockClass = producto.stock === 0 ? 'cero' : producto.stock <= UMBRAL_STOCK_BAJO ? 'bajo' : 'ok';
                            return (
                                <div key={producto._id || producto.id} className={`admin-producto-card card-stock-${stockClass}`}>
                                    {/* Header */}
                                    <div className="admin-producto-card-header">
                                        <div className="admin-producto-card-avatar">
                                            {iniciales}
                                        </div>
                                        <div className="admin-producto-card-header-info">
                                            <h4>{producto.nombre}</h4>
                                            <span className="admin-producto-card-cat">
                                                {producto.categoria.charAt(0).toUpperCase() + producto.categoria.slice(1)}
                                            </span>
                                        </div>
                                        <div className={`admin-producto-stock-badge stock-${stockClass}`}>
                                            {producto.stock} u
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="admin-producto-card-body">
                                        <div className="admin-producto-data-row">
                                            <span className="admin-producto-data-icon"><FiDollarSign size={14} /></span>
                                            <span className="admin-producto-data-label">Precio</span>
                                            <span className="admin-producto-data-value">${producto.precio.toLocaleString('es-AR')}</span>
                                        </div>
                                        <div className="admin-producto-data-row">
                                            <span className="admin-producto-data-icon"><FiHash size={14} /></span>
                                            <span className="admin-producto-data-label">Stock</span>
                                            <span className="admin-producto-data-value">{producto.stock} unidades</span>
                                        </div>
                                        <div className="admin-producto-data-row">
                                            <span className="admin-producto-data-icon"><FiTag size={14} /></span>
                                            <span className="admin-producto-data-label">ID</span>
                                            <span className="admin-producto-data-value">{shortId(producto._id || producto.id, 6)}</span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="admin-producto-card-footer">
                                        <button
                                            className="admin-producto-card-btn admin-producto-btn-edit"
                                            onClick={() => handleEditar(producto)}
                                        >
                                            <FiEdit3 size={14} /> Editar
                                        </button>
                                        <button
                                            className="admin-producto-card-btn admin-producto-btn-delete"
                                            onClick={() => handleEliminar(producto._id || producto.id, producto.nombre)}
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* --- Modal de Edición/Creación --- */}
                {showModal && (
                    <ProductoFormModal
                        productoInicial={productoSeleccionado}
                        onClose={() => setShowModal(false)}
                        onGuardar={handleGuardar}
                    />
                )}

                {/* --- Modal de Alertas de Stock --- */}
                {showStockModal && (
                    <AlertaStockModal
                        productosAAlertar={productosAAlertar}
                        onClose={() => setShowStockModal(false)}
                    />
                )}
            </div>
        </div>
    );
}

export default ProductosAdmin;