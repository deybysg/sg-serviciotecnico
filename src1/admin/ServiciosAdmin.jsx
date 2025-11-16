import React, { useState, useEffect, useRef } from "react";
import { GoDownload } from "react-icons/go";
import { api } from "../services/api";
import Swal from "sweetalert2";
import Select from "react-select";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas"; 
import jsPDF from "jspdf"; 
import ComprobantePDF from "./ComprobantePDF"; 
import ModalDetalles from "./ModalDetalles";
import "./serviciosAdmin.css";
import { shortId, toIdString } from "../utils/id";

const TIPO_SERVICIO_OPTIONS = [
    { value: "celulares", label: "Celulares" },
    { value: "computadora", label: "Computadora" },
    { value: "parlantes", label: "Parlantes" },
    { value: "otros", label: "Otros" },
];

// Opciones de marca dependientes del tipo de equipo
const BRAND_OPTIONS = {
    celulares: ["Samsung", "Apple", "Xiaomi", "Motorola", "Huawei", "Otro"],
    computadora: ["HP", "Dell", "Lenovo", "Asus", "Acer", "Otro"],
    parlantes: ["JBL", "Bose", "Sony", "Philips", "Otro"],
    otros: [] // Para 'otros' dejamos campo libre
};

// Opciones de modelo dependientes del tipo de equipo
const MODEL_OPTIONS = {
    celulares: ["Galaxy S22", "iPhone 13", "Redmi Note 11", "Moto G Power", "Otro"],
    computadora: ["Pavilion", "Inspiron", "ThinkPad", "ZenBook", "Aspire", "Otro"],
    parlantes: ["Flip", "Charge", "SoundLink", "SRS-XB", "Otro"],
    otros: [] // Campo libre para 'otros'
};

const ESTADO_OPTIONS = [
    { value: "pendiente", label: "Pendiente" },
    { value: "enRevision", label: "En Revisión" },
    { value: "revisionTerminada", label: "En Reparacion" },
    { value: "terminado", label: "Terminado" },
    { value: "entregado", label: "Entregado" },
];

const URL_BASE_PUBLICA = "http://192.168.1.22:5173"; 

function ServiciosAdmin() {
    // Referencia para el componente de impresión oculta
    const comprobanteRef = useRef(null); 

    const initialState = {
        clienteId: null,
        marcaProducto: "",
        modeloProducto: "",
        tipoServicio: TIPO_SERVICIO_OPTIONS[0].value,
        detalles: "",
        presupuesto: { items: [{ descripcion: "", costo: "" }], subtotal: 0, iva: 0, total: 0, senia: 0 },
        estado: ESTADO_OPTIONS[0].value,
        fechaEntrada: new Date().toISOString(), 
        fechaSalida: null,
    };

    const [formData, setFormData] = useState(initialState);
    const [clientes, setClientes] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [showListaServicios, setShowListaServicios] = useState(false);
    const [editId, setEditId] = useState(null); 
    const [editData, setEditData] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    // presupuesto toggle removed from tarjeta: no UI state needed here
    const [modalOpen, setModalOpen] = useState(false);
    const [modalService, setModalService] = useState(null);
    
    // ** ESTADO CLAVE AÑADIDO: Para forzar el doble renderizado **
    const [serviceToPrint, setServiceToPrint] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false); 

    // Carga inicial de clientes y servicios
    useEffect(() => {
        const loadData = async () => {
            try {
                // Cargar clientes
                const clientesData = await api.get('/clientes');
                const options = clientesData.map((c) => ({
                    value: c._id || c.id,
                    label: c.nombreCompleto,
                }));
                setClientes(options);

                // Cargar servicios
                const serviciosData = await api.get('/servicios');
                setServicios(serviciosData);
            } catch (error) {
                console.error("Error al cargar datos:", error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.message || "No se pudieron cargar los datos.",
                });
            }
        };
        loadData();
    }, []);

    // Helper para calcular totales del presupuesto
    // Ahora acepta senia (seña) y descuenta del total
    const calcularTotal = (items, senia = 0) => {
        const subtotal = items.reduce((sum, item) => sum + Number(item.costo || 0), 0);
        const total = subtotal - Number(senia || 0);
        return { subtotal, iva: 0, total };
    };

    // toggleBudget removed — presupuesto no se muestra en la tarjeta
    
    // ----------------------------------------
    // Generación de Comprobante PDF (MODIFICADO)
    // ----------------------------------------
    const generarComprobante = (service) => {
        // 1. Establece el servicio y activa la bandera de impresión.
        // Esto causa el primer renderizado del componente oculto <ComprobantePDF>.
        setServiceToPrint(service); 
        setIsPrinting(true);
    };

    // ** NUEVO useEffect para la Captura Asíncrona **
    // Se ejecuta cada vez que isPrinting cambia a true.
    useEffect(() => {
        if (isPrinting && comprobanteRef.current) {
            
            // Usamos setTimeout para asegurar que React complete el renderizado 
            // del componente ComprobantePDF en el DOM oculto.
            const timeoutId = setTimeout(async () => {
                try {
                    // Captura el contenido del div oculto (ComprobantePDF)
                    const canvas = await html2canvas(comprobanteRef.current, { scale: 2 });
                    const imgData = canvas.toDataURL('image/png');
                    
                    // Crea el documento PDF
                    const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4',
                    });

                    const imgProps = pdf.getImageProperties(imgData);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width; 

                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    
                    // ** SOLUCIÓN AL NOMBRE DEL ARCHIVO: Usar el nombre del cliente **
                    // Eliminamos caracteres especiales/espacios para un nombre de archivo limpio
                    const nombreFuente = serviceToPrint?.clienteNombre || serviceToPrint?.cliente?.nombreCompleto || '';
                    const nombreClienteLimpio = nombreFuente.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
                    const sid = toIdString(serviceToPrint._id || serviceToPrint.id);
                    pdf.save(`Servicio_${sid}_${nombreClienteLimpio}.pdf`);

                    Swal.fire('PDF Generado', 'El comprobante ha sido descargado.', 'success');
                } catch (error) {
                    console.error("Error al generar el PDF:", error);
                    Swal.fire('Error', 'No se pudo generar el comprobante PDF.', 'error');
                }
                
                // 3. Limpia el estado después de generar el PDF para ocultar el componente
                setServiceToPrint(null); 
                setIsPrinting(false);
            }, 100); // 100ms deberían ser suficientes

            return () => clearTimeout(timeoutId);
        }
    }, [isPrinting, serviceToPrint]); // Dependencias del useEffect

    // ----------------------------------------
    // Form nuevo servicio (Lógica de Presupuesto y Cambios Generales)
    // ----------------------------------------
    const handlePresupuestoChange = (index, e) => {
        const { name, value } = e.target;
        const newValue = name === "costo" && value !== "" ? Number(value) : value; 
        
        const newItems = formData.presupuesto.items.map((item, i) =>
            i === index ? { ...item, [name]: newValue } : item
        );
        const senia = formData.presupuesto?.senia || 0;
        const { subtotal, iva, total } = calcularTotal(newItems, senia);
        setFormData({ ...formData, presupuesto: { items: newItems, subtotal, iva, total, senia } });
    };

    const addPresupuestoItem = () => {
        const newItems = [...formData.presupuesto.items, { descripcion: "", costo: "" }];
        const senia = formData.presupuesto?.senia || 0;
        const { subtotal, iva, total } = calcularTotal(newItems, senia);
        setFormData({ ...formData, presupuesto: { items: newItems, subtotal, iva, total, senia } });
    };

    const removePresupuestoItem = (index) => {
        const newItems = formData.presupuesto.items.filter((_, i) => i !== index);
        const senia = formData.presupuesto?.senia || 0;
        const { subtotal, iva, total } = calcularTotal(newItems, senia);
        setFormData({ ...formData, presupuesto: { items: newItems, subtotal, iva, total, senia } });
    };

    const handleGeneralChange = (e) => {
        const { name, value } = e.target;
        // Si cambia el tipo de servicio, reiniciamos la marca para forzar re-selección
        if (name === 'tipoServicio') {
            setFormData({ ...formData, tipoServicio: value, marcaProducto: '', modeloProducto: '' });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleClienteSelect = (selectedOption) => {
        setClienteSeleccionado(selectedOption);
        setFormData((prev) => ({ ...prev, clienteId: selectedOption.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.clienteId) {
            Swal.fire("Atención", "Debe seleccionar un cliente.", "warning");
            return;
        }
        
        const dataToSend = {
            cliente: formData.clienteId, // Backend espera "cliente", no "clienteId"
            marcaProducto: formData.marcaProducto,
            modeloProducto: formData.modeloProducto,
            tipoServicio: formData.tipoServicio,
            detalles: formData.detalles,
            estado: formData.estado,
            fechaEntrada: new Date().toISOString(), 
            presupuesto: {
                ...formData.presupuesto,
                items: formData.presupuesto.items.map(item => ({
                    ...item,
                    costo: Number(item.costo) || 0
                }))
            }
        };

        try {
            // El backend maneja automáticamente la relación cliente-servicio
            const nuevoServicio = await api.post('/servicios', dataToSend);
            
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
                title: '✅ Servicio creado y asociado al cliente'
            });
            
            setServicios((prev) => [...prev, nuevoServicio]);
            setFormData(initialState);
            setClienteSeleccionado(null);
            
        } catch (err) {
            console.error("Error en la creación del servicio:", err);
            Swal.fire({
                icon: "error", 
                title: "Error", 
                text: err.message || "No se pudo completar la operación.",
                confirmButtonColor: '#3b82f6'
            });
        }
    };

    // ----------------------------------------
    // Edición y eliminación
    // ----------------------------------------
    const handleEditClick = (serviceId) => {
        const serviceToEdit = servicios.find(s => (s._id || s.id) === serviceId);
        if (serviceToEdit) {
            setEditId(serviceId);
            const clonedData = JSON.parse(JSON.stringify(serviceToEdit));
            // Extraer el ID del cliente si es un objeto poblado
            if (clonedData.cliente && typeof clonedData.cliente === 'object') {
                clonedData.cliente = clonedData.cliente._id;
            }
            // Asegurar modeloProducto
            clonedData.modeloProducto = clonedData.modeloProducto || '';
            clonedData.presupuesto.items = clonedData.presupuesto.items.map(item => ({
                ...item,
                costo: item.costo === 0 ? "" : item.costo
            }));
            clonedData.presupuesto.senia = clonedData.presupuesto.senia || 0;
            setEditData(clonedData);
        }
    };
    
    const handleCancelEdit = () => {
        setEditId(null);
        setEditData(null);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;
        
        // Si el usuario deja el campo vacío en fechaSalida, se guarda como null
        if (name === "fechaSalida" && value === "") {
            newValue = null;
        }
        
        // Si cambia el tipo en el modo edición, reiniciar marcaProducto
        if (name === 'tipoServicio') {
            setEditData({ ...editData, tipoServicio: newValue, marcaProducto: '', modeloProducto: '' });
            return;
        }

        setEditData({ ...editData, [name]: newValue });
    };

    const handleEditPresupuestoChange = (i, e) => {
        const { name, value } = e.target;
        const newValue = name === "costo" && value !== "" ? Number(value) : value; 
        
        const newItems = editData.presupuesto.items.map((item, idx) =>
            idx === i ? { ...item, [name]: newValue } : item
        );
        const senia = editData.presupuesto?.senia || 0;
        const { subtotal, iva, total } = calcularTotal(newItems, senia);
        setEditData({ ...editData, presupuesto: { items: newItems, subtotal, iva, total, senia } });
    };

    const addEditPresupuestoItem = () => {
        const newItems = [...editData.presupuesto.items, { descripcion: "", costo: "" }];
        const senia = editData.presupuesto?.senia || 0;
        const { subtotal, iva, total } = calcularTotal(newItems, senia);
        setEditData({ ...editData, presupuesto: { items: newItems, subtotal, iva, total, senia } });
    };

    const removeEditPresupuestoItem = (i) => {
        const newItems = editData.presupuesto.items.filter((_, idx) => idx !== i);
        const senia = editData.presupuesto?.senia || 0;
        const { subtotal, iva, total } = calcularTotal(newItems, senia);
        setEditData({ ...editData, presupuesto: { items: newItems, subtotal, iva, total, senia } });
    };

    const handleSaveEdit = async () => {
        const dataToSave = JSON.parse(JSON.stringify(editData));
        
        dataToSave.presupuesto.items = dataToSave.presupuesto.items.map(item => ({
             ...item,
             costo: Number(item.costo) || 0
        }));
        
        // Si el estado es 'entregado' y no tiene fecha de salida, la establece con la hora actual
        if (dataToSave.estado === 'entregado' && !dataToSave.fechaSalida) {
            dataToSave.fechaSalida = new Date().toISOString(); 
        } 
        
        try {
            // PUT /servicios/:id (requiere auth)
            const updated = await api.put(`/servicios/${dataToSave._id || dataToSave.id}`, dataToSave);
            
            setServicios(prevServicios => prevServicios.map(s => 
                (s._id || s.id) === (updated._id || updated.id) ? updated : s
            ));
            
            setEditId(null); 
            setEditData(null);
            
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
                title: '✅ Servicio actualizado exitosamente'
            });
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Error", 
                text: err.message || "No se pudieron guardar los cambios.",
                confirmButtonColor: '#3b82f6'
            });
        }
    };

    const handleDeleteServicio = async (id) => {
        const confirm = await Swal.fire({
            title: "¿Eliminar servicio?",
            text: "Esta acción no se puede deshacer. También se desvinculará del cliente.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            // Forzar render dentro del body para evitar stacking context issues
            target: document.body,
            allowOutsideClick: false,
            didOpen: () => {
                // Asegurar que el swal está por encima de modales con z-index muy alto
                const containers = document.querySelectorAll('.swal2-container');
                const popups = document.querySelectorAll('.swal2-popup');
                containers.forEach(c => { c.style.zIndex = '2147483647'; c.style.position = 'fixed'; });
                popups.forEach(p => { p.style.zIndex = '2147483647'; });
            }
        });
        if (!confirm.isConfirmed) return;

        try {
            // El backend maneja automáticamente la desvinculación del cliente
            await api.delete(`/servicios/${id}`);

            setServicios((prev) => prev.filter((s) => (s._id || s.id) !== id));
            
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
                title: '🗑️ Servicio eliminado exitosamente'
            });
        } catch (err) {
            console.error("Error al eliminar:", err);
            Swal.fire({
                icon: "error",
                title: "Error", 
                text: err.message || "No se pudo eliminar el servicio.",
                confirmButtonColor: '#3b82f6'
            });
        }
    };

    // ---------------------------
    // Modal "Ver más" handlers
    // ---------------------------
    const openModal = async (service) => {
        // Asegurarse de que el campo cliente esté poblado con el objeto cliente
        let serviceToShow = service;
        try {
            if (service && service.cliente && typeof service.cliente === 'string') {
                const clienteFull = await api.get(`/clientes/${service.cliente}`);
                serviceToShow = { ...service, cliente: clienteFull };
            }
        } catch (err) {
            // Si falla, seguimos mostrando lo que tengamos
            console.warn('No se pudo obtener cliente completo para modal:', err);
        }
        setModalService(serviceToShow);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalService(null);
    };

    const handleModalSave = async (id, dataToSave) => {
        try {
            const updated = await api.put(`/servicios/${id}`, dataToSave);
            setServicios(prevServicios => prevServicios.map(s => (s._id || s.id) === (updated._id || updated.id) ? updated : s));
            closeModal();

            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
            });
            Toast.fire({ icon: 'success', title: '✅ Servicio actualizado' });
        } catch (err) {
            console.error('Error guardando desde modal:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'No se pudo guardar.' });
        }
    };

    const handleModalDelete = async (id) => {
        // Reuse the existing delete flow (incluye confirmación)
        await handleDeleteServicio(id);
        closeModal();
    };

    const handleModalPrint = (service) => {
        generarComprobante(service);
    };


    // ----------------------------------------
    // Filtrado y Ordenamiento
    // ----------------------------------------
    const serviciosFiltrados = servicios.filter((s) => {
        const query = (searchQuery || '').toString().toLowerCase();
        // cliente puede ser null, un id (string) o un objeto poblado
        const clienteId = (s.cliente && typeof s.cliente === 'object') ? (s.cliente._id || s.cliente.id || '') : (s.cliente || '');
        const clienteNombre = (s.cliente && typeof s.cliente === 'object') ? (s.cliente.nombreCompleto || '') : (clientes.find(c => c.value === clienteId)?.label || "");
        const servicioNumero = s.servicioNumero ? s.servicioNumero.toString() : "";
        const marca = (s.marcaProducto || '').toString().toLowerCase();
        const tipo = (s.tipoServicio || '').toString().toLowerCase();
        return (
            servicioNumero.includes(query) ||
            marca.includes(query) ||
            tipo.includes(query) ||
            (clienteNombre || '').toString().toLowerCase().includes(query)
        );
    });

    const serviciosOrdenados = [...serviciosFiltrados].sort((a, b) => {
        // Ordena por fecha de entrada más reciente primero
        const fa = a.fechaEntrada ? new Date(a.fechaEntrada) : new Date(0);
        const fb = b.fechaEntrada ? new Date(b.fechaEntrada) : new Date(0);
        return fb - fa;
    });

    return (
        <div className="servicios-full">
            <div className="servicios-container">
                <h2>Creación de Nuevo Servicio 🛠️</h2>

                {/* FORMULARIO NUEVO SERVICIO */}
                <form className="servicio-form" onSubmit={handleSubmit}>
                    <fieldset className="seccion-form">
                        <legend>Datos del Cliente y Producto</legend>
                        <label>Cliente:</label>
                        <Select 
                            options={clientes} 
                            onChange={handleClienteSelect} 
                            value={clienteSeleccionado} 
                            placeholder="Buscar cliente..." 
                            classNamePrefix="react-select"
                        />
                        <label>Tipo de Equipo:</label>
                        <select name="tipoServicio" value={formData.tipoServicio} onChange={handleGeneralChange}>
                            {TIPO_SERVICIO_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <label>Marca del Producto:</label>
                        {formData.tipoServicio === 'otros' ? (
                            <input type="text" name="marcaProducto" value={formData.marcaProducto} onChange={handleGeneralChange} placeholder="Especifique la marca" required />
                        ) : (
                            <select name="marcaProducto" value={formData.marcaProducto} onChange={handleGeneralChange} required>
                                <option value="">Seleccione marca...</option>
                                {(BRAND_OPTIONS[formData.tipoServicio] || []).map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        )}
                        <label>Modelo del Producto:</label>
                        {formData.tipoServicio === 'otros' ? (
                            <input type="text" name="modeloProducto" value={formData.modeloProducto} onChange={handleGeneralChange} placeholder="Especifique el modelo" />
                        ) : (
                            <>
                                {/* Allow typing or selecting a suggested model via datalist */}
                                <input
                                    list={`model-options-${formData.tipoServicio}`}
                                    type="text"
                                    name="modeloProducto"
                                    value={formData.modeloProducto}
                                    onChange={handleGeneralChange}
                                    placeholder="Seleccione o escriba el modelo"
                                />
                                <datalist id={`model-options-${formData.tipoServicio}`}>
                                    {(MODEL_OPTIONS[formData.tipoServicio] || []).map((mo) => (
                                        <option key={mo} value={mo} />
                                    ))}
                                </datalist>
                            </>
                        )}
                        <label>Detalles:</label>
                        <textarea name="detalles" value={formData.detalles} onChange={handleGeneralChange} rows="3" />
                        
                        <label>Fecha de Entrada:</label>
                        <input 
                            // ** (2) FORMULARIO:** Usa tipo="date" para ocultar la hora
                            type="date" 
                            name="fechaEntrada" 
                            // Muestra solo la fecha (YYYY-MM-DD)
                            value={formData.fechaEntrada ? formData.fechaEntrada.split('T')[0] : ''} 
                            onChange={handleGeneralChange} 
                            required 
                        />
                    </fieldset>

                    <fieldset className="seccion-form presupuesto-section">
                        <legend>Presupuesto</legend>
                        {formData.presupuesto.items.map((item, i) => (
                            <div key={i} className="presupuesto-item">
                                <input type="text" name="descripcion" placeholder="Descripción" value={item.descripcion} onChange={(e) => handlePresupuestoChange(i, e)} />
                                <input type="number" name="costo" placeholder="Costo" value={item.costo} onChange={(e) => handlePresupuestoChange(i, e)} />
                                <button type="button" onClick={() => removePresupuestoItem(i)} className="btn-remove-item">&times;</button>
                            </div>
                        ))}
                        <div style={{display:'flex', gap: '8px', alignItems:'center', marginTop: '8px'}}>
                            <label style={{minWidth: '70px'}}>Seña:</label>
                            <input type="number" name="senia" value={formData.presupuesto.senia || ''} onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                const { subtotal, iva, total } = calcularTotal(formData.presupuesto.items, val);
                                setFormData({ ...formData, presupuesto: { ...formData.presupuesto, senia: val, subtotal, iva, total } });
                            }} />
                        </div>
                        <button type="button" onClick={addPresupuestoItem}>+ Agregar ítem</button>
                        <div className="presupuesto-resumen">
                            <p>Subtotal: ${formData.presupuesto.subtotal.toFixed(2)}</p>
                            <p>Seña: -${(formData.presupuesto.senia || 0).toFixed(2)}</p>
                            <p>Total a Pagar: ${formData.presupuesto.total.toFixed(2)}</p>
                        </div>
                    </fieldset>

                    <button type="submit" className="btn-primary-servicio">Registrar Nuevo Servicio 🚀</button>
                </form>

                {/* BOTÓN MOSTRAR/OCULTAR SERVICIOS */}
                <button className="btn-toggle-lista-servicios" onClick={() => setShowListaServicios(!showListaServicios)}>
                    {showListaServicios ? "Ocultar Servicios" : "Mostrar Servicios"}
                </button>

                {/* BUSCADOR */}
                {showListaServicios && (
                    <div className="buscador-servicios">
                        <input
                            type="text"
                            placeholder="Buscar por N° Orden, cliente, marca o tipo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}

                {/* LISTA DE SERVICIOS */}
                {showListaServicios && (
                    <div className="servicios-lista-wrapper">
                        <div className="servicios-lista-cards">
                            {serviciosOrdenados.map((s) => {
                                // El backend puede enviar cliente como objeto poblado, ID o null
                                    const clienteId = (s.cliente && typeof s.cliente === 'object') ? (s.cliente._id || s.cliente.id || '') : (s.cliente || '');
                                    const clienteObj = clientes.find(c => c.value === clienteId);
                                    const clienteNombre = (s.cliente && typeof s.cliente === 'object') ? (s.cliente.nombreCompleto || '') : (clienteObj?.label || "Cliente desconocido");
                                const servicioId = s._id || s.id;
                                const servicioNumero = s.servicioNumero || 'N/A';
                                const isEditing = editId === servicioId;
                                const qrUrl = `${URL_BASE_PUBLICA}/seguimiento/${servicioNumero}`;

                                return (
                                    <div 
                                        key={servicioId} 
                                        className={`servicio-card ${isEditing ? 'editando' : ''}`} 
                                    >
                                        <div className="qr-info-header">
                                            <h4>
                                                N° Orden: {servicioNumero}{' '}
                                                <span
                                                    title="Copiar número de orden"
                                                    onClick={async () => {
                                                        try {
                                                            await navigator.clipboard.writeText(String(servicioNumero));
                                                            const Toast = Swal.mixin({
                                                                toast: true,
                                                                position: 'top-end',
                                                                showConfirmButton: false,
                                                                timer: 2000,
                                                                timerProgressBar: true,
                                                            });
                                                            Toast.fire({ icon: 'success', title: 'Número copiado al portapapeles' });
                                                        } catch {}
                                                    }}
                                                    style={{ cursor: 'pointer', marginLeft: 6 }}
                                                >📋</span>
                                            </h4>
                                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                                <QRCodeSVG value={qrUrl} size={80} level="H" />
                                                <img 
                                                    src="/img/logo2.png"
                                                    alt="Logo"
                                                    style={{
                                                        position: 'absolute',
                                                        top: '47%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        width: '26px',
                                                        height: '26px',
                                                        borderRadius: '50%',
                                                        backgroundColor: 'white',
                                                        padding: '0px',
                                                        // border: '1px solid #ccc'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        {isEditing && editData ? (
                                            <>
                                                {/* MODO EDICIÓN */}
                                                <label>Cliente:</label>
                                                <select name="cliente" value={editData.cliente} onChange={handleEditChange}>
                                                    {clientes.map(c => (
                                                         <option key={c.value} value={c.value}>{c.label}</option>
                                                     ))}
                                                 </select>
                                                 <label>Marca Producto:</label>
                                                 {editData.tipoServicio === 'otros' ? (
                                                     <input type="text" name="marcaProducto" value={editData.marcaProducto} onChange={handleEditChange} />
                                                 ) : (
                                                     <select name="marcaProducto" value={editData.marcaProducto} onChange={handleEditChange}>
                                                         <option value="">Seleccione marca...</option>
                                                         {(BRAND_OPTIONS[editData.tipoServicio] || []).map((m) => (
                                                             <option key={m} value={m}>{m}</option>
                                                         ))}
                                                     </select>
                                                 )}
                                                 <label>Modelo Producto:</label>
                                                 {editData.tipoServicio === 'otros' ? (
                                                     <input type="text" name="modeloProducto" value={editData.modeloProducto || ''} onChange={handleEditChange} />
                                                 ) : (
                                                     <>
                                                         <input
                                                             list={`model-options-${editData.tipoServicio}`}
                                                             type="text"
                                                             name="modeloProducto"
                                                             value={editData.modeloProducto || ''}
                                                             onChange={handleEditChange}
                                                             placeholder="Seleccione o escriba el modelo"
                                                         />
                                                         <datalist id={`model-options-${editData.tipoServicio}`}>
                                                             {(MODEL_OPTIONS[editData.tipoServicio] || []).map((mo) => (
                                                                 <option key={mo} value={mo} />
                                                             ))}
                                                         </datalist>
                                                     </>
                                                 )}
                                                 <label>Tipo de Servicio:</label>
                                                 <select name="tipoServicio" value={editData.tipoServicio} onChange={handleEditChange}>
                                                     {TIPO_SERVICIO_OPTIONS.map((o) => (
                                                          <option key={o.value} value={o.value}>{o.label}</option>
                                                      ))}
                                                  </select>
                                                  <label>Detalles:</label>
                                                  <textarea name="detalles" value={editData.detalles} onChange={handleEditChange} rows="3" />
                                                  <label>Estado:</label>
                                                  <select name="estado" value={editData.estado} onChange={handleEditChange}>
                                                      {ESTADO_OPTIONS.map((o) => (
                                                           <option key={o.value} value={o.value}>{o.label}</option>
                                                       ))}
                                                   </select>
                                                   
                                                   <label>Fecha de Entrada:</label>
                                                   <input 
                                                       // ** (2) FORMULARIO:** Usa tipo="date" en edición
                                                       type="date" 
                                                       name="fechaEntrada" 
                                                       // Muestra solo la fecha (YYYY-MM-DD)
                                                       value={editData.fechaEntrada ? editData.fechaEntrada.split('T')[0] : ''} 
                                                       onChange={handleEditChange} 
                                                       required
                                                   />

                                                   <label>Fecha de Salida (Entregado):</label>
                                                   <input 
                                                       type="date" 
                                                       name="fechaSalida" 
                                                       value={editData.fechaSalida ? new Date(editData.fechaSalida).toISOString().split('T')[0] : ''} 
                                                       onChange={handleEditChange} 
                                                   />
                                                   
                                                   <fieldset className="presupuesto-section">
                                                       <legend>Presupuesto</legend>
                                                       {editData.presupuesto.items.map((item, idx) => (
                                                               <div key={idx} className="presupuesto-item">
                                                                   <input type="text" name="descripcion" placeholder="Descripción" value={item.descripcion} onChange={(e) => handleEditPresupuestoChange(idx, e)} />
                                                                   <input type="number" name="costo" placeholder="Costo" value={item.costo} onChange={(e) => handleEditPresupuestoChange(idx, e)} />
                                                                   <button type="button" onClick={() => removeEditPresupuestoItem(idx)} className="btn-remove-item">&times;</button>
                                                               </div>
                                                           ))}
                                                       <div style={{display:'flex', gap: '8px', alignItems:'center', marginTop: '8px'}}>
                                                           <label style={{minWidth: '70px'}}>Seña:</label>
                                                           <input type="number" name="senia" value={editData.presupuesto.senia || ''} onChange={(e) => {
                                                               const val = e.target.value === '' ? 0 : Number(e.target.value);
                                                               const { subtotal, iva, total } = calcularTotal(editData.presupuesto.items, val);
                                                               setEditData({ ...editData, presupuesto: { ...editData.presupuesto, senia: val, subtotal, iva, total } });
                                                           }} />
                                                       </div>
                                                       <button type="button" onClick={addEditPresupuestoItem}>+ Agregar ítem</button>
                                                       <div className="presupuesto-resumen">
                                                               <p>Subtotal: ${editData.presupuesto.subtotal.toFixed(2)}</p>
                                                               <p>Seña: -${(editData.presupuesto.senia || 0).toFixed(2)}</p>
                                                               <p>Total a Pagar: ${editData.presupuesto.total.toFixed(2)}</p>
                                                       </div>
                                                   </fieldset>

                                                   <div className="acciones-servicio">
                                                        <button onClick={handleSaveEdit} className="btn-edit-servicio">Guardar</button>
                                                        <button onClick={handleCancelEdit} className="btn-cancel-edit">Cancelar</button>
                                                   </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* MODO VISUALIZACIÓN: Grid con etiquetas arriba y valores abajo */}
                                                <div className="servicio-info">
                                                    <div className="card-grid">
                                                        <div className="grid-label">Cliente</div>
                                                        <div className="grid-label">Tipo</div>
                                                        <div className="grid-label">Marca</div>
                                                        <div className="grid-label">Modelo</div>
                                                        <div className="grid-label">Entrada</div>

                                                        <div className="grid-value">{clienteNombre}</div>
                                                        <div className="grid-value">{TIPO_SERVICIO_OPTIONS.find(o => o.value === s.tipoServicio)?.label || s.tipoServicio}</div>
                                                        <div className="grid-value">{s.marcaProducto || 'N/A'}</div>
                                                        <div className="grid-value">{s.modeloProducto || 'N/A'}</div>
                                                        <div className="grid-value">{
                                                            s.fechaEntrada
                                                                ? new Date(s.fechaEntrada.split('T')[0] + 'T12:00:00').toLocaleDateString()
                                                                : 'N/A'
                                                        }</div>
                                                    </div>

                                                    <div className="acciones-servicio">
                                                        <button onClick={() => openModal(s)} className="btn-ver-mas">Ver más</button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {serviciosFiltrados.length === 0 && <p style={{textAlign: 'center', marginTop: '20px'}}>No se encontraron servicios.</p>}
                    </div>
                )}
            </div>
            
            {/* Contenedor oculto para la generación del PDF. 
            Solo se renderiza si isPrinting es true y serviceToPrint tiene datos. */}
            {serviceToPrint && isPrinting && ( 
                <div 
                    ref={comprobanteRef} 
                    style={{ 
                        position: 'absolute', 
                        left: '-9999px', 
                        width: '210mm', // Ancho A4
                        minHeight: '297mm', // Alto A4
                        padding: '10mm',
                        backgroundColor: '#fff' 
                    }}
                >
                    <ComprobantePDF service={serviceToPrint} TIPO_SERVICIO_OPTIONS={TIPO_SERVICIO_OPTIONS} ESTADO_OPTIONS={ESTADO_OPTIONS} />
                </div>
            )}
            {/* Modal de 'Ver más' con todas las opciones: ver/editar/eliminar/imprimir */}
            {modalOpen && modalService && (
                <ModalDetalles
                    isOpen={modalOpen}
                    onClose={closeModal}
                    servicio={modalService}
                    clientes={[modalService.cliente]}
                    onSave={handleModalSave}
                    onDelete={handleModalDelete}
                    onPrint={handleModalPrint}
                />
            )}
        </div>
    );
}

export default ServiciosAdmin;