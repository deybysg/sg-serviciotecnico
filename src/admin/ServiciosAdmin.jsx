import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import Swal from "sweetalert2";
import Select from "react-select";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ComprobantePDF from "./ComprobantePDF";
import ModalDetalles from "./ModalDetalles";
import "../styles/admin/ServiciosAdmin.css";
import { toIdString } from "../utils/id";
import {
  FiUser, FiPhone, FiMail, FiMapPin, FiHash, FiCheckSquare,
  FiTool, FiSmartphone, FiTag, FiList, FiFileText, FiDollarSign,
  FiCreditCard, FiActivity, FiPlus, FiSave, FiX, FiSearch,
  FiEye, FiFile, FiTrash2, FiClipboard, FiClock, FiCheckCircle,
  FiAlertTriangle, FiTruck, FiSettings, FiCalendar, FiUserPlus, FiPrinter
} from "react-icons/fi";
import {
  TIPO_SERVICIO_OPTIONS,
  TIPO_EQUIPO_OPTIONS,
  BRAND_OPTIONS,
  MODEL_OPTIONS,
  ESTADO_OPTIONS,
  METODO_PAGO_OPTIONS,
} from "../constants";

const URL_BASE_PUBLICA = 'https://sg-serviciotecnico.vercel.app';

// Capitaliza la primera letra de cada palabra
function capitalizeWords(str) {
    if (!str) return str;
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

// Normaliza propiedades snake_case a camelCase para compatibilidad entre MongoDB y PostgreSQL
function normalizeServicio(s) {
    if (!s) return s;
    const id = s.id || s._id;
    let clienteId;
    if (s.cliente_id != null) {
        clienteId = String(s.cliente_id);
    } else if (s.clienteId != null)  {
        clienteId = String(s.clienteId);
    } else if (s.cliente && typeof s.cliente === 'object') {
        clienteId = String(s.cliente.id || s.cliente._id);
    } else if (s.cliente != null) {
        clienteId = String(s.cliente);
    }
    return {
        id: id,
        _id: id,
        servicioNumero: s.servicio_numero ?? s.servicioNumero,
        clienteId: clienteId,
        cliente: clienteId,
        cliente_nombre: s.cliente_nombre || '',
        cliente_celular: s.cliente_celular || '',
        cliente_correo: s.cliente_correo || '',
        cliente_dni: s.cliente_dni || '',
        tipoEquipo: s.tipo_equipo ?? s.tipoEquipo,
        marcaProducto: s.marca_producto ?? s.marcaProducto,
        modeloProducto: s.modelo_producto ?? s.modeloProducto,
        tipoServicio: s.tipo_servicio ?? s.tipoServicio,
        fallaReportada: s.falla_reportada ?? s.fallaReportada,
        asunto: s.asunto,
        detalles: s.detalles,
        notasAdicionales: s.notas_adicionales ?? s.notasAdicionales,
        metodoPago: s.metodo_pago ?? s.metodoPago,
        anticipo: s.anticipo,
        presupuesto: s.presupuesto || {
            items: s.presupuesto_items || [],
            subtotal: s.presupuesto_subtotal || 0,
            iva: s.presupuesto_iva || 0,
            total: s.presupuesto_total || 0
        },
        estado: s.estado,
        detalleCliente: s.detalle_cliente ?? s.detalleCliente,
        seguimiento: s.seguimiento || [],
        fechaEntrada: s.fecha_entrada ?? s.fechaEntrada,
        fechaSalida: s.fecha_salida ?? s.fechaSalida,
        createdAt: s.created_at ?? s.createdAt,
        updatedAt: s.updated_at ?? s.updatedAt,
    };
}

function normalizeCliente(c) {
    if (!c) return c;
    return {
        id: c.id || c._id,
        nombreCompleto: c.nombre_completo || c.nombreCompleto || '',
        celular: c.celular || '',
        correo: c.correo || c.email || '',
        direccion: c.direccion || '',
        dni: c.dni || '',
    };
}

function ServiciosAdmin() {
    const comprobanteRef = useRef(null);

    const initialClientState = {
        nombreCompleto: "",
        celular: "",
        correo: "",
        direccion: "",
        dni: "",
    };

    const initialServiceState = {
        tipoServicio: "",
        tipoEquipo: "",
        marcaProducto: "",
        modeloProducto: "",
        fallaReportada: "",
        asunto: "",
        notasAdicionales: "",
        anticipo: "",
        totalEstimado: "",
        metodoPago: "",
        estado: "pendiente",
    };

    const [clientes, setClientes] = useState([]);
    const [clientesOptions, setClientesOptions] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [isNewClient, setIsNewClient] = useState(false);
    const [clientData, setClientData] = useState(initialClientState);
    const [serviceData, setServiceData] = useState(initialServiceState);
    const [showListaServicios, setShowListaServicios] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterMonth, setFilterMonth] = useState("");
    const [filterDay, setFilterDay] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalService, setModalService] = useState(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewService, setViewService] = useState(null);
    const [serviceToPrint, setServiceToPrint] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const clientesRaw = await api.get('/clientes');
                const clientesData = Array.isArray(clientesRaw) ? clientesRaw.map(normalizeCliente) : [];
                setClientes(clientesData);
                const options = clientesData.map((c) => ({
                    value: c.id || c._id,
                    label: c.nombreCompleto,
                    data: c,
                }));
                setClientesOptions(options);

                const serviciosRaw = await api.get('/servicios');
                const serviciosData = Array.isArray(serviciosRaw) ? serviciosRaw.map(normalizeServicio) : [];
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

    useEffect(() => {
        if (isPrinting && serviceToPrint) {
            // Esperar a que el DOM se renderice antes de capturar
            const capturePdf = async () => {
                // Dar tiempo a React para renderizar el div oculto
                await new Promise(resolve => setTimeout(resolve, 300));
                
                if (!comprobanteRef.current) {
                    console.error('No se encontró el elemento del comprobante para generar PDF');
                    Swal.fire('Error', 'No se pudo generar el comprobante PDF: elemento no encontrado.', 'error');
                    setServiceToPrint(null);
                    setIsPrinting(false);
                    return;
                }
                
                try {
                    const canvas = await html2canvas(comprobanteRef.current, { scale: 1.5 });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                    const imgProps = pdf.getImageProperties(imgData);
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    const imgWidth = imgProps.width;
                    const imgHeight = imgProps.height;
                    const ratio = pageWidth / imgWidth;
                    const scaledHeight = imgHeight * ratio;
                    
                    let heightLeft = scaledHeight;
                    let position = 0;
                    
                    pdf.addImage(imgData, 'PNG', 0, position, pageWidth, scaledHeight);
                    heightLeft -= pageHeight;
                    
                    while (heightLeft > 0) {
                        position -= pageHeight;
                        pdf.addPage();
                        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, scaledHeight);
                        heightLeft -= pageHeight;
                    }
                    
                    const nombreFuente = serviceToPrint?.clienteNombre || serviceToPrint?.cliente?.nombreCompleto || '';
                    const nombreClienteLimpio = nombreFuente.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_') || 'Cliente';
                    const sid = serviceToPrint.servicioNumero || serviceToPrint.servicio_numero || toIdString(serviceToPrint._id || serviceToPrint.id);
                    pdf.save(`Servicio_${sid}_${nombreClienteLimpio}.pdf`);
                    Swal.fire('PDF Generado', 'El comprobante ha sido descargado.', 'success');
                } catch (error) {
                    console.error("Error al generar el PDF:", error);
                    Swal.fire('Error', 'No se pudo generar el comprobante PDF.', 'error');
                }
                setServiceToPrint(null);
                setIsPrinting(false);
            };
            
            capturePdf();
        }
    }, [isPrinting, serviceToPrint]);

    const generarComprobante = (service, clienteOverride = null) => {
        const cid = service.clienteId || service.cliente;
        let clienteData = clienteOverride || clientes.find(c => String(c.id) === String(cid)) || null;
        if (clienteData) clienteData = normalizeCliente(clienteData);
        const serviceEnriched = {
            ...service,
            clienteNombre: clienteData?.nombreCompleto || service.clienteNombre || service.cliente_nombre || '—',
            clienteTelefono: clienteData?.celular || service.clienteTelefono || service.cliente_celular || '—',
            clienteDni: clienteData?.dni || service.clienteDni || service.cliente_dni || '—',
            clienteCorreo: clienteData?.correo || service.clienteCorreo || service.cliente_correo || '—',
            clienteDireccion: clienteData?.direccion || service.clienteDireccion || service.cliente_direccion || '—',
            cliente: clienteData || service.cliente,
            presupuesto: service.presupuesto || {
                items: service.presupuesto_items || [],
                subtotal: Number(service.presupuesto_subtotal || 0),
                iva: Number(service.presupuesto_iva || 0),
                total: Number(service.presupuesto_total || 0)
            }
        };
        setServiceToPrint(serviceEnriched);
        setIsPrinting(true);
    };

    const handleClientChange = (e) => {
        const { name, value } = e.target;
        setClientData((prev) => ({ ...prev, [name]: value }));
    };

    const handleServiceChange = (e) => {
        const { name, value } = e.target;
        setServiceData((prev) => ({ ...prev, [name]: value }));
    };

    const handleClienteSelect = (selectedOption) => {
        setClienteSeleccionado(selectedOption);
        if (selectedOption && selectedOption.data) {
            const c = selectedOption.data;
            setClientData({
                nombreCompleto: c.nombreCompleto || '',
                celular: c.celular || '',
                correo: c.correo || '',
                direccion: c.direccion || '',
                dni: c.dni || '',
            });
        } else {
            setClientData(initialClientState);
        }
    };

    const handleToggleNewClient = (checked) => {
        setIsNewClient(checked);
        if (checked) {
            setClienteSeleccionado(null);
            setClientData(initialClientState);
        } else {
            setClientData(initialClientState);
        }
    };

    const handleCheckDuplicateClient = () => {
        if (!clientData.celular && !clientData.dni) return null;
        
        const clienteExistente = clientes.find(c => 
            (clientData.celular && c.celular === clientData.celular) ||
            (clientData.dni && c.dni === clientData.dni)
        );
        
        return clienteExistente || null;
    };

    const handleLimpiarFormulario = () => {
        setClientData(initialClientState);
        setServiceData(initialServiceState);
        setClienteSeleccionado(null);
        setIsNewClient(false);
    };

    // Función para obtener datos del cliente del estado (usado en la lista de servicios)
    const getClienteData = (clienteId) => {
        if (typeof clienteId === 'object' && clienteId !== null) {
            if (clienteId.nombreCompleto) return clienteId;
            clienteId = String(clienteId);
        }
        if (!clienteId || clienteId === 'null' || clienteId === 'undefined') return null;
        return clientes.find(c => String(c._id || c.id) === String(clienteId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let clienteIdToUse = null;

        if (isNewClient) {
            if (!clientData.nombreCompleto || !clientData.celular) {
                Swal.fire("Atención", "Nombre y celular son requeridos para el nuevo cliente.", "warning");
                return;
            }

            const clienteDuplicado = handleCheckDuplicateClient();
            if (clienteDuplicado) {
                const result = await Swal.fire({
                    icon: 'question',
                    title: 'Cliente ya existe',
                    html: `Ya existe un cliente con esos datos:<br><strong>${clienteDuplicado.nombreCompleto}</strong><br>¿Deseas usar ese cliente en lugar de crear uno nuevo?`,
                    showCancelButton: true,
                    confirmButtonText: 'Sí, usar existente',
                    cancelButtonText: 'Crear nuevo',
                    confirmButtonColor: '#22c55e',
                    cancelButtonColor: '#8b5cf6',
                });

                const dupId = clienteDuplicado.id || clienteDuplicado._id;
                if (result.isConfirmed && dupId) {
                    clienteIdToUse = dupId;
                    const clienteOption = { value: dupId, label: clienteDuplicado.nombreCompleto, data: clienteDuplicado };
                    setClienteSeleccionado(clienteOption);
                } else {
                    try {
                        const nuevoCliente = await api.post('/clientes', {
                            nombreCompleto: capitalizeWords(clientData.nombreCompleto),
                            celular: clientData.celular,
                            correo: clientData.correo,
                            direccion: capitalizeWords(clientData.direccion),
                            dni: clientData.dni,
                        });
                        const nuevoClienteNormalizado = normalizeCliente(nuevoCliente);
                        clienteIdToUse = nuevoClienteNormalizado.id;
                        const newClientOption = { value: nuevoClienteNormalizado.id, label: nuevoClienteNormalizado.nombreCompleto, data: nuevoClienteNormalizado };
                        setClientes((prev) => [...prev, nuevoClienteNormalizado]);
                        setClientesOptions((prev) => [...prev, newClientOption]);
                        setClienteSeleccionado(newClientOption);
                    } catch (err) {
                        Swal.fire("Error", `No se pudo crear el cliente: ${err.message}`, "error");
                        return;
                    }
                }
            } else {
                try {
                    const nuevoCliente = await api.post('/clientes', {
                        nombreCompleto: capitalizeWords(clientData.nombreCompleto),
                        celular: clientData.celular,
                        correo: clientData.correo,
                        direccion: capitalizeWords(clientData.direccion),
                        dni: clientData.dni,
                    });
                    const nuevoClienteNormalizado = normalizeCliente(nuevoCliente);
                    clienteIdToUse = nuevoClienteNormalizado.id;
                    const newClientOption = { value: nuevoClienteNormalizado.id, label: nuevoClienteNormalizado.nombreCompleto, data: nuevoClienteNormalizado };
                    setClientes((prev) => [...prev, nuevoClienteNormalizado]);
                    setClientesOptions((prev) => [...prev, newClientOption]);
                    setClienteSeleccionado(newClientOption);
                } catch (err) {
                    Swal.fire("Error", `No se pudo crear el cliente: ${err.message}`, "error");
                    return;
                }
            }
        } else {
            if (!clienteSeleccionado) {
                Swal.fire("Atención", "Debe seleccionar un cliente existente.", "warning");
                return;
            }
            clienteIdToUse = clienteSeleccionado.value;
        }

        if (!serviceData.tipoServicio || !serviceData.tipoEquipo || !serviceData.marcaProducto) {
            Swal.fire("Atención", "Tipo de Servicio, Tipo de Equipo y Marca son obligatorios.", "warning");
            return;
        }

        const dataToSend = {
            cliente: clienteIdToUse,
            tipoServicio: serviceData.tipoServicio,
            tipoEquipo: serviceData.tipoEquipo,
            marcaProducto: capitalizeWords(serviceData.marcaProducto),
            modeloProducto: capitalizeWords(serviceData.modeloProducto),
            fallaReportada: capitalizeWords(serviceData.fallaReportada),
            asunto: capitalizeWords(serviceData.asunto),
            detalles: capitalizeWords(serviceData.asunto),
            notasAdicionales: capitalizeWords(serviceData.notasAdicionales),
            anticipo: Math.round(Number(serviceData.anticipo) || 0),
            metodoPago: serviceData.metodoPago,
            presupuesto: {
                items: [{ descripcion: capitalizeWords(serviceData.asunto || serviceData.fallaReportada || 'Servicio'), costo: Math.round(Number(serviceData.totalEstimado) || 0) }],
                subtotal: Math.round(Number(serviceData.totalEstimado) || 0),
                iva: 0,
                total: Number(serviceData.totalEstimado) || 0,
            },
            estado: serviceData.estado,
            fechaEntrada: new Date().toISOString(),
        };

        try {
            const nuevoServicio = await api.post('/servicios', dataToSend);

            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1200,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });

            Toast.fire({ icon: 'success', title: 'Servicio creado y asociado al cliente' });

            const nuevoServicioNormalizado = normalizeServicio(nuevoServicio);
            setServicios((prev) => [...prev, nuevoServicioNormalizado]);

            // Obtener datos del cliente para el comprobante
            let clienteParaComprobante = null;
            if (isNewClient) {
                clienteParaComprobante = normalizeCliente({
                    id: clienteIdToUse,
                    nombre_completo: clientData.nombreCompleto,
                    celular: clientData.celular,
                    correo: clientData.correo,
                    direccion: clientData.direccion,
                    dni: clientData.dni,
                });
            } else if (clienteSeleccionado?.data) {
                clienteParaComprobante = normalizeCliente(clienteSeleccionado.data);
            }

            handleLimpiarFormulario();
            generarComprobante(nuevoServicioNormalizado, clienteParaComprobante);
        } catch (err) {
            console.error("Error en la creación del servicio:", err);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: err.message || "No se pudo completar la operación.",
                confirmButtonColor: '#8b5cf6'
            });
        }
    };

    const handleSaveEdit = async () => {
        try {
            const updated = await api.put(`/servicios/${editData._id || editData.id}`, editData);
            setServicios((prev) => prev.map(s => (s._id || s.id) === (updated._id || updated.id) ? updated : s));
            setEditId(null);
            setEditData(null);
            Swal.fire({ icon: 'success', title: 'Servicio actualizado', timer: 1200, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message || "No se pudieron guardar los cambios." });
        }
    };

    const handleDeleteServicio = async (id) => {
        const confirm = await Swal.fire({
            title: "¿Eliminar servicio?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
        });
        if (!confirm.isConfirmed) return;

        try {
            await api.delete(`/servicios/${id}`);
            setServicios((prev) => prev.filter((s) => (s._id || s.id) !== id));
            Swal.fire({ icon: 'success', title: 'Servicio eliminado', timer: 1200, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message || "No se pudo eliminar el servicio." });
        }
    };

    const openModal = async (service) => {
        let serviceToShow = service;
        const cid = service.clienteId || service.cliente;
        if (cid) {
            try {
                const clienteFull = await api.get(`/clientes/${cid}`);
                serviceToShow = { ...service, cliente: clienteFull };
            } catch (err) {
                console.warn('No se pudo obtener cliente completo, usando datos locales:', err);
                const clienteLocal = clientes.find(c => String(c.id) === String(cid));
                if (clienteLocal) {
                    serviceToShow = { ...service, cliente: clienteLocal };
                }
            }
        }
        setModalService(serviceToShow);
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setModalService(null); };

    const openViewModal = async (service) => {
        let serviceToShow = service;
        const cid = service.clienteId || service.cliente;
        if (cid) {
            try {
                const clienteFull = await api.get(`/clientes/${cid}`);
                serviceToShow = { ...service, cliente: clienteFull };
            } catch (err) {
                const clienteLocal = clientes.find(c => String(c.id) === String(cid));
                if (clienteLocal) {
                    serviceToShow = { ...service, cliente: clienteLocal };
                }
            }
        }
        setViewService(serviceToShow);
        setViewModalOpen(true);
    };

    const closeViewModal = () => { setViewModalOpen(false); setViewService(null); };

    const handleModalSave = async (id, dataToSave) => {
        try {
            const updated = await api.put(`/servicios/${id}`, dataToSave);
            const updatedNormalized = normalizeServicio(updated);
            setServicios((prev) => prev.map(s => (s._id || s.id) === (updatedNormalized._id || updatedNormalized.id) ? updatedNormalized : s));
            closeModal();
            Swal.fire({ icon: 'success', title: 'Servicio actualizado', timer: 1200, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'No se pudo guardar.' });
        }
    };

    const handleModalDelete = async (id) => {
        await handleDeleteServicio(id);
        closeModal();
    };

    const serviciosFiltrados = servicios.filter((s) => {
        const query = (searchQuery || '').toString().toLowerCase();
        const clienteId = s.clienteId;
        const clienteData = clientes.find(c => String(c.id) === String(clienteId));
        const clienteNombre = clienteData?.nombreCompleto || '';
        const servicioNumero = s.servicioNumero ? s.servicioNumero.toString() : "";
        const marca = (s.marcaProducto || '').toString().toLowerCase();
        const tipo = (s.tipoServicio || '').toString().toLowerCase();
        const matchText = !query || servicioNumero.includes(query) || marca.includes(query) || tipo.includes(query) || (clienteNombre || '').toString().toLowerCase().includes(query);

        let matchMonth = true;
        let matchDay = true;

        if (s.fechaEntrada) {
            const fecha = new Date(s.fechaEntrada);
            if (filterMonth) {
                const mesServicio = String(fecha.getMonth() + 1).padStart(2, '0');
                matchMonth = mesServicio === filterMonth;
            }
            if (filterDay) {
                const diaServicio = String(fecha.getDate()).padStart(2, '0');
                matchDay = diaServicio === filterDay;
            }
        } else {
            if (filterMonth || filterDay) {
                matchMonth = false;
                matchDay = false;
            }
        }

        return matchText && matchMonth && matchDay;
    });

    const serviciosOrdenados = [...serviciosFiltrados].sort((a, b) => {
        const fa = a.fechaEntrada ? new Date(a.fechaEntrada) : new Date(0);
        const fb = b.fechaEntrada ? new Date(b.fechaEntrada) : new Date(0);
        return fb - fa;
    });

    return (
        <div className="sn-page">
            <div className="sn-container">
                <div className="sn-header">
                    <div>
                        <h1 className="sn-title">Nuevo Servicio</h1>
                        <p className="sn-subtitle">Completa la información para registrar un nuevo servicio técnico.</p>
                    </div>
                </div>

                <form className="sn-form" onSubmit={handleSubmit}>
                    <div className="sn-grid-2col">
                        {/* SECCION 1: Datos del Cliente */}
                        <div className="sn-card">
                            <h2 className="sn-card-title">
                                <span className="sn-icon sn-icon-info"><FiUser /></span>
                                Datos del Cliente
                            </h2>

                            <div className="cliente-toggle-container">
                                <button
                                    type="button"
                                    className={`cliente-toggle-btn ${!isNewClient ? 'active' : ''}`}
                                    onClick={() => handleToggleNewClient(false)}
                                >
                                    <FiSearch size={14} /> Cliente Existente
                                </button>
                                <button
                                    type="button"
                                    className={`cliente-toggle-btn ${isNewClient ? 'active' : ''}`}
                                    onClick={() => handleToggleNewClient(true)}
                                >
                                    <FiUserPlus size={14} /> Nuevo Cliente
                                </button>
                            </div>

                            {!isNewClient ? (
                                <div className="sn-field">
                                    <label className="sn-label"><FiSearch size={12} /> Buscar cliente</label>
                                    <Select
                                        options={clientesOptions}
                                        onChange={handleClienteSelect}
                                        value={clienteSeleccionado}
                                        placeholder="Escribe para buscar..."
                                        classNamePrefix="sn-react-select"
                                        isClearable
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="sn-field">
                                        <label className="sn-label"><FiUser size={12} /> Nombre completo <span className="sn-required">*</span></label>
                                        <input
                                            type="text"
                                            className="sn-input"
                                            placeholder="Ej: Juan Perez"
                                            value={clientData.nombreCompleto}
                                            onChange={(e) => setClientData({ ...clientData, nombreCompleto: e.target.value })}
                                        />
                                    </div>

                                    <div className="sn-field">
                                        <label className="sn-label"><FiPhone size={12} /> Celular <span className="sn-required">*</span></label>
                                        <div className="sn-input-with-icon">
                                            <input
                                                type="text"
                                                name="celular"
                                                className="sn-input"
                                                placeholder="Ej: 11 1234 5678"
                                                value={clientData.celular}
                                                onChange={(e) => setClientData({ ...clientData, celular: e.target.value })}
                                            />
                                            <span className="sn-input-icon-right"><FiPhone size={14} /></span>
                                        </div>
                                    </div>

                                    <div className="sn-field">
                                        <label className="sn-label"><FiMail size={12} /> Correo</label>
                                        <input
                                            type="email"
                                            name="correo"
                                            className="sn-input"
                                            placeholder="Ej: juanperez@email.com"
                                            value={clientData.correo}
                                            onChange={(e) => setClientData({ ...clientData, correo: e.target.value })}
                                        />
                                    </div>

                                    <div className="sn-field">
                                        <label className="sn-label"><FiMapPin size={12} /> Dirección</label>
                                        <input
                                            type="text"
                                            name="direccion"
                                            className="sn-input"
                                            placeholder="Ej: Av. Siempre Viva 123, CABA"
                                            value={clientData.direccion}
                                            onChange={(e) => setClientData({ ...clientData, direccion: e.target.value })}
                                        />
                                    </div>

                                    <div className="sn-field">
                                        <label className="sn-label"><FiHash size={12} /> DNI (opcional)</label>
                                        <input
                                            type="text"
                                            name="dni"
                                            className="sn-input"
                                            placeholder="Ej: 12.345.678"
                                            value={clientData.dni}
                                            onChange={(e) => setClientData({ ...clientData, dni: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* SECCION 2: Datos del Servicio */}
                        <div className="sn-card">
                            <h2 className="sn-card-title">
                                <span className="sn-icon sn-icon-service"><FiTool /></span>
                                Datos del Servicio
                            </h2>

                            <div className="sn-field-row-2">
                                <div className="sn-field">
                                    <label className="sn-label"><FiTool size={12} /> Tipo de Servicio <span className="sn-required">*</span></label>
                                    <select name="tipoServicio" className="sn-select" value={serviceData.tipoServicio} onChange={handleServiceChange}>
                                        <option value="">Seleccionar tipo de servicio</option>
                                        {TIPO_SERVICIO_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sn-field">
                                    <label className="sn-label"><FiSmartphone size={12} /> Tipo de Equipo <span className="sn-required">*</span></label>
                                    <select name="tipoEquipo" className="sn-select" value={serviceData.tipoEquipo} onChange={handleServiceChange}>
                                        <option value="">Seleccionar tipo de equipo</option>
                                        {TIPO_EQUIPO_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="sn-field-row-2">
                                <div className="sn-field">
                                    <label className="sn-label"><FiTag size={12} /> Marca <span className="sn-required">*</span></label>
                                    {serviceData.tipoEquipo === 'otros' || !BRAND_OPTIONS[serviceData.tipoEquipo] ? (
                                        <input type="text" name="marcaProducto" className="sn-input" placeholder="Ej: Apple, Samsung, HP, Dell..." value={serviceData.marcaProducto} onChange={handleServiceChange} />
                                    ) : (
                                        <select name="marcaProducto" className="sn-select" value={serviceData.marcaProducto} onChange={handleServiceChange}>
                                            <option value="">Seleccionar marca...</option>
                                            {(BRAND_OPTIONS[serviceData.tipoEquipo] || []).map((m) => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="sn-field">
                                    <label className="sn-label"><FiSettings size={12} /> Modelo <span className="sn-required">*</span></label>
                                    {serviceData.tipoEquipo === 'otros' || !MODEL_OPTIONS[serviceData.tipoEquipo] ? (
                                        <input type="text" name="modeloProducto" className="sn-input" placeholder="Ej: iPhone 13, Galaxy S21, Inspiron 15..." value={serviceData.modeloProducto} onChange={handleServiceChange} />
                                    ) : (
                                        <>
                                            <input
                                                list={`model-options-${serviceData.tipoEquipo}`}
                                                type="text"
                                                name="modeloProducto"
                                                className="sn-input"
                                                placeholder="Ej: iPhone 13, Galaxy S21, Inspiron 15..."
                                                value={serviceData.modeloProducto}
                                                onChange={handleServiceChange}
                                            />
                                            <datalist id={`model-options-${serviceData.tipoEquipo}`}>
                                                {(MODEL_OPTIONS[serviceData.tipoEquipo] || []).map((mo) => (
                                                    <option key={mo} value={mo} />
                                                ))}
                                            </datalist>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="sn-field">
                                <label className="sn-label"><FiAlertTriangle size={12} /> Falla Reportada <span className="sn-required">*</span></label>
                                <textarea
                                    name="fallaReportada"
                                    className="sn-textarea"
                                    rows="3"
                                    placeholder="Describe la falla o problema del equipo..."
                                    value={serviceData.fallaReportada}
                                    onChange={handleServiceChange}
                                />
                            </div>

                            <div className="sn-field">
                                <label className="sn-label"><FiFileText size={12} /> Asunto / Detalle del Servicio <span className="sn-required">*</span></label>
                                <textarea
                                    name="asunto"
                                    className="sn-textarea"
                                    rows="3"
                                    placeholder="Describe el trabajo a realizar, repuestos necesarios, observaciones, etc..."
                                    value={serviceData.asunto}
                                    onChange={handleServiceChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="sn-grid-2col">
                        {/* SECCION 3: Información Adicional */}
                        <div className="sn-card">
                            <h2 className="sn-card-title">
                                <span className="sn-icon sn-icon-notes"><FiFileText /></span>
                                Información Adicional
                            </h2>

                            <div className="sn-field">
                                <label className="sn-label"><FiFileText size={12} /> Notas adicionales</label>
                                <div className="sn-textarea-wrapper">
                                    <textarea
                                        name="notasAdicionales"
                                        className="sn-textarea"
                                        rows="5"
                                        maxLength="500"
                                        placeholder="Agrega cualquier información adicional relevante..."
                                        value={serviceData.notasAdicionales}
                                        onChange={handleServiceChange}
                                    />
                                    <span className="sn-char-count">{serviceData.notasAdicionales.length}/500</span>
                                </div>
                            </div>
                        </div>

                        {/* SECCION 4: Costos y Pago */}
                        <div className="sn-card">
                            <h2 className="sn-card-title">
                                <span className="sn-icon sn-icon-payment"><FiDollarSign /></span>
                                Costos y Pago
                            </h2>

                            <div className="sn-field-row-2">
                                <div className="sn-field">
                                    <label className="sn-label"><FiDollarSign size={12} /> Seña / Anticipo</label>
                                    <div className="sn-input-prefix">
                                        <span className="sn-prefix">$</span>
                                        <input
                                            type="number"
                                            name="anticipo"
                                            className="sn-input sn-input-with-prefix"
                                            placeholder="0,00"
                                            value={serviceData.anticipo}
                                            onChange={handleServiceChange}
                                        />
                                    </div>
                                    <span className="sn-help-text">Monto recibido como señal o anticipo</span>
                                </div>
                                <div className="sn-field">
                                    <label className="sn-label"><FiDollarSign size={12} /> Total Estimado</label>
                                    <div className="sn-input-prefix">
                                        <span className="sn-prefix">$</span>
                                        <input
                                            type="number"
                                            name="totalEstimado"
                                            className="sn-input sn-input-with-prefix"
                                            placeholder="0,00"
                                            value={serviceData.totalEstimado}
                                            onChange={handleServiceChange}
                                        />
                                    </div>
                                    <span className="sn-help-text">Precio total estimado del servicio</span>
                                </div>
                            </div>

                            <div className="sn-field-row-2">
                                <div className="sn-field">
                                    <label className="sn-label"><FiCreditCard size={12} /> Método de Pago</label>
                                    <select name="metodoPago" className="sn-select" value={serviceData.metodoPago} onChange={handleServiceChange}>
                                        <option value="">Seleccionar método de pago</option>
                                        {METODO_PAGO_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sn-field">
                                    <label className="sn-label"><FiActivity size={12} /> Estado Inicial</label>
                                    <select name="estado" className="sn-select" value={serviceData.estado} onChange={handleServiceChange}>
                                        {ESTADO_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BOTONES DE ACCION */}
                    <div className="sn-actions-bottom">
                        <button type="button" className="sn-btn sn-btn-clear" onClick={handleLimpiarFormulario}>
                            <FiX size={14} /> Limpiar Formulario
                        </button>
                        <div className="sn-actions-right">
                            <button type="button" className="sn-btn sn-btn-cancel" onClick={handleLimpiarFormulario}>
                                <FiX size={14} /> Cancelar
                            </button>
                            <button type="submit" className="sn-btn sn-btn-save">
                                <FiSave size={14} /> Guardar Servicio
                            </button>
                        </div>
                    </div>
                </form>

                {/* BOTON MOSTRAR/OCULTAR SERVICIOS */}
                <button className="sn-btn-toggle" onClick={() => setShowListaServicios(!showListaServicios)}>
                    <FiClipboard size={16} /> {showListaServicios ? "Ocultar Servicios" : "Mostrar Servicios"}
                </button>

                {showListaServicios && (
                    <div className="sn-filters">
                        <div className="sn-buscador">
                            <FiSearch size={16} />
                            <input
                                type="text"
                                placeholder="Buscar por N° Orden, cliente, marca o tipo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="sn-filter-group">
                            <div className="sn-filter-item">
                                <FiCalendar size={14} />
                                <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
                                    <option value="">Todos los meses</option>
                                    <option value="01">Enero</option>
                                    <option value="02">Febrero</option>
                                    <option value="03">Marzo</option>
                                    <option value="04">Abril</option>
                                    <option value="05">Mayo</option>
                                    <option value="06">Junio</option>
                                    <option value="07">Julio</option>
                                    <option value="08">Agosto</option>
                                    <option value="09">Septiembre</option>
                                    <option value="10">Octubre</option>
                                    <option value="11">Noviembre</option>
                                    <option value="12">Diciembre</option>
                                </select>
                            </div>
                            <div className="sn-filter-item">
                                <FiCalendar size={14} />
                                <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)}>
                                    <option value="">Todos los días</option>
                                    {Array.from({ length: 31 }, (_, i) => (
                                        <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>
                                    ))}
                                </select>
                            </div>
                            {(filterMonth || filterDay || searchQuery) && (
                                <button
                                    className="sn-filter-clear"
                                    onClick={() => { setFilterMonth(""); setFilterDay(""); setSearchQuery(""); }}
                                >
                                    <FiX size={14} /> Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {showListaServicios && (
                    <div className="sn-servicios-lista">
                        <div className="sn-lista-header">
                            <span className="sn-lista-col sn-col-orden"># Orden</span>
                            <span className="sn-lista-col sn-col-cliente">Cliente</span>
                            <span className="sn-lista-col sn-col-equipo">Equipo</span>
                            <span className="sn-lista-col sn-col-tipo">Tipo</span>
                            <span className="sn-lista-col sn-col-fecha">Fecha Entrada</span>
                            <span className="sn-lista-col sn-col-estado">Estado</span>
                            <span className="sn-lista-col sn-col-acciones">Acciones</span>
                        </div>
                        {serviciosOrdenados.map((s) => {
                            const clienteData = getClienteData(s.clienteId);
                            const clienteNombre = clienteData?.nombreCompleto || "Cliente desconocido";
                            const servicioId = s._id || s.id;
                            const servicioNumero = s.servicioNumero || 'N/A';
                            const estadoClass = s.estado || 'pendiente';
                            const iniciales = clienteNombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                            const fechaEntrada = s.fechaEntrada ? new Date(s.fechaEntrada).toLocaleDateString('es-AR') : 'N/A';
                            const equipo = [s.marcaProducto, s.modeloProducto].filter(Boolean).join(' ') || 'Sin equipo';
                            const tipoLabel = TIPO_EQUIPO_OPTIONS.find(o => o.value === s.tipoEquipo)?.label || s.tipoServicio || 'N/A';

                            return (
                                <div key={servicioId} className="sn-lista-row">
                                    <span className="sn-lista-col sn-col-orden">
                                        <span className="sn-lista-orden-num">{servicioNumero}</span>
                                    </span>
                                    <span className="sn-lista-col sn-col-cliente">
                                        <div className="sn-lista-cliente">
                                            <div className="sn-lista-avatar">{iniciales}</div>
                                            <span className="sn-lista-nombre">{clienteNombre}</span>
                                        </div>
                                    </span>
                                    <span className="sn-lista-col sn-col-equipo">{equipo}</span>
                                    <span className="sn-lista-col sn-col-tipo">{tipoLabel}</span>
                                    <span className="sn-lista-col sn-col-fecha">{fechaEntrada}</span>
                                    <span className="sn-lista-col sn-col-estado">
                                        <span className={`sn-lista-badge ${estadoClass}`}>
                                            {ESTADO_OPTIONS.find(o => o.value === s.estado)?.label || s.estado}
                                        </span>
                                    </span>
                                    <span className="sn-lista-col sn-col-acciones">
                                        <button onClick={() => openViewModal(s)} className="sn-lista-btn-ver">
                                            Ver más
                                        </button>
                                        <button onClick={() => openModal(s)} className="sn-lista-btn-editar">
                                            Editar
                                        </button>
                                    </span>
                                </div>
                            );
                        })}
                        {serviciosOrdenados.length === 0 && (
                            <div className="sn-no-results">
                                <FiSearch size={48} />
                                <p>No se encontraron servicios.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {serviceToPrint && isPrinting && (
                <div ref={comprobanteRef} style={{ position: 'absolute', left: '-9999px', width: '210mm', minHeight: '297mm', padding: '0', backgroundColor: '#fff' }}>
                    <ComprobantePDF service={serviceToPrint} TIPO_SERVICIO_OPTIONS={TIPO_SERVICIO_OPTIONS} ESTADO_OPTIONS={ESTADO_OPTIONS} />
                </div>
            )}

            {modalOpen && modalService && (
                <ModalDetalles
                    isOpen={modalOpen}
                    onClose={closeModal}
                    servicio={modalService}
                    clientes={[modalService.cliente]}
                    onSave={handleModalSave}
                    onDelete={handleModalDelete}
                    onPrint={generarComprobante}
                />
            )}

            {viewModalOpen && viewService && (
                <div className="sv-backdrop">
                    <div className="sv-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sv-header">
                            <div className="sv-header-left">
                                <div className="sv-header-icon">
                                    <FiTool size={20} />
                                </div>
                                <div>
                                    <h3 className="sv-title">Detalle del Servicio</h3>
                                    <span className="sv-subtitle">
                                        #{viewService.servicioNumero || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <button className="sv-close-btn" onClick={closeViewModal}>
                                <FiX size={20} />
                            </button>
                        </div>

                        <div className="sv-body">
                            <div className="sv-section">
                                <div className="sv-grid">
                                    <div className="sv-field">
                                        <span className="sv-label">Cliente</span>
                                        <span className="sv-value">{viewService.cliente?.nombreCompleto || viewService.cliente_nombre || 'N/A'}</span>
                                    </div>
                                    <div className="sv-field">
                                        <span className="sv-label">Tipo de Servicio</span>
                                        <span className="sv-value">{TIPO_SERVICIO_OPTIONS.find(o => o.value === viewService.tipoServicio)?.label || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="sv-grid">
                                    <div className="sv-field">
                                        <span className="sv-label">Tipo de Equipo</span>
                                        <span className="sv-value">{TIPO_EQUIPO_OPTIONS.find(o => o.value === viewService.tipoEquipo)?.label || 'N/A'}</span>
                                    </div>
                                    <div className="sv-field">
                                        <span className="sv-label">Marca</span>
                                        <span className="sv-value">{viewService.marcaProducto || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="sv-grid">
                                    <div className="sv-field">
                                        <span className="sv-label">Modelo</span>
                                        <span className="sv-value">{viewService.modeloProducto || 'N/A'}</span>
                                    </div>
                                    <div className="sv-field">
                                        <span className="sv-label">Seña / Anticipo</span>
                                        <span className="sv-value sv-money">${Number(viewService.anticipo || 0).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="sv-field-full">
                                    <span className="sv-label">Falla Reportada</span>
                                    <span className="sv-value">{viewService.fallaReportada || 'N/A'}</span>
                                </div>

                                <div className="sv-field-full">
                                    <span className="sv-label">Asunto / Detalle</span>
                                    <span className="sv-value">{viewService.detalles || viewService.asunto || 'N/A'}</span>
                                </div>

                                <div className="sv-resumen-pago">
                                    <div className="sv-pago-row">
                                        <span>Subtotal</span>
                                        <span>${Number(viewService.presupuesto?.subtotal || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="sv-pago-row">
                                        <span>Seña / Anticipo</span>
                                        <span className="sv-money">-${Number(viewService.anticipo || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="sv-pago-divider"></div>
                                    <div className="sv-pago-row sv-pago-total">
                                        <span>Total</span>
                                        <span>${Math.round(Number(viewService.presupuesto?.subtotal || 0) - Number(viewService.anticipo || 0)).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="sv-footer">
                            <div className="sv-footer-left">
                                <button onClick={() => { closeViewModal(); handleDeleteServicio(viewService._id || viewService.id); }} className="sv-btn-delete">
                                    <FiTrash2 size={14} /> Eliminar
                                </button>
                                <button onClick={() => { generarComprobante(viewService); }} className="sv-btn-print">
                                    <FiPrinter size={14} /> Imprimir
                                </button>
                            </div>
                            <div className="sv-footer-right">
                                <button onClick={closeViewModal} className="sv-btn-close">Cerrar</button>
                                <button onClick={() => { closeViewModal(); openModal(viewService); }} className="sv-btn-edit">Editar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ServiciosAdmin;
