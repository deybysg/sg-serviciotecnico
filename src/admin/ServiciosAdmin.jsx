import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import Swal from "sweetalert2";
import Select from "react-select";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas"; 
import jsPDF from "jspdf"; 
import ComprobantePDF from "./ComprobantePDF"; 
import ModalDetalles from "./ModalDetalles";
import "./ServiciosAdmin.css";
import { toIdString } from "../utils/id";

const TIPO_SERVICIO_OPTIONS = [
    { value: "reparacion", label: "Reparación" },
    { value: "mantenimiento", label: "Mantenimiento" },
    { value: "instalacion", label: "Instalación" },
    { value: "otro", label: "Otro" },
];

const TIPO_EQUIPO_OPTIONS = [
    { value: "celulares", label: "Celulares" },
    { value: "computadora", label: "Computadora" },
    { value: "parlantes", label: "Parlantes" },
    { value: "otros", label: "Otros" },
];

const BRAND_OPTIONS = {
    celulares: ["Samsung", "Apple", "Xiaomi", "Motorola", "Huawei", "Otro"],
    computadora: ["HP", "Dell", "Lenovo", "Asus", "Acer", "Otro"],
    parlantes: ["JBL", "Bose", "Sony", "Philips", "Otro"],
    otros: []
};

const MODEL_OPTIONS = {
    celulares: ["Galaxy S22", "iPhone 13", "Redmi Note 11", "Moto G Power", "Otro"],
    computadora: ["Pavilion", "Inspiron", "ThinkPad", "ZenBook", "Aspire", "Otro"],
    parlantes: ["Flip", "Charge", "SoundLink", "SRS-XB", "Otro"],
    otros: []
};

const ESTADO_OPTIONS = [
    { value: "pendiente", label: "Pendiente" },
    { value: "enRevision", label: "En Revisión" },
    { value: "revisionTerminada", label: "En Reparación" },
    { value: "terminado", label: "Terminado" },
    { value: "entregado", label: "Entregado" },
];

const METODO_PAGO_OPTIONS = [
    { value: "efectivo", label: "Efectivo" },
    { value: "transferencia", label: "Transferencia" },
    { value: "tarjeta", label: "Tarjeta" },
    { value: "mercadopago", label: "Mercado Pago" },
    { value: "otro", label: "Otro" },
];

const URL_BASE_PUBLICA = "http://192.168.1.22:5173";

function ServiciosAdmin() {
    const comprobanteRef = useRef(null);

    const initialClientState = {
        nombreCompleto: "",
        telefono: "",
        email: "",
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
    const [servicios, setServicios] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [isNewClient, setIsNewClient] = useState(false);
    const [clientData, setClientData] = useState(initialClientState);
    const [serviceData, setServiceData] = useState(initialServiceState);
    const [showListaServicios, setShowListaServicios] = useState(false);
    const [editId, setEditId] = useState(null);
    const [editData, setEditData] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalService, setModalService] = useState(null);
    const [serviceToPrint, setServiceToPrint] = useState(null);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const clientesData = await api.get('/clientes');
                const options = clientesData.map((c) => ({
                    value: c._id || c.id,
                    label: c.nombreCompleto,
                }));
                setClientes(options);

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

    useEffect(() => {
        if (isPrinting && comprobanteRef.current) {
            const timeoutId = setTimeout(async () => {
                try {
                    const canvas = await html2canvas(comprobanteRef.current, { scale: 2 });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                    const imgProps = pdf.getImageProperties(imgData);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    const nombreFuente = serviceToPrint?.clienteNombre || serviceToPrint?.cliente?.nombreCompleto || '';
                    const nombreClienteLimpio = nombreFuente.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
                    const sid = toIdString(serviceToPrint._id || serviceToPrint.id);
                    pdf.save(`Servicio_${sid}_${nombreClienteLimpio}.pdf`);
                    Swal.fire('PDF Generado', 'El comprobante ha sido descargado.', 'success');
                } catch (error) {
                    console.error("Error al generar el PDF:", error);
                    Swal.fire('Error', 'No se pudo generar el comprobante PDF.', 'error');
                }
                setServiceToPrint(null);
                setIsPrinting(false);
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [isPrinting, serviceToPrint]);

    const generarComprobante = (service) => {
        setServiceToPrint(service);
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
    };

    const handleLimpiarFormulario = () => {
        setClientData(initialClientState);
        setServiceData(initialServiceState);
        setClienteSeleccionado(null);
        setIsNewClient(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let clienteIdToUse = null;

        if (isNewClient) {
            if (!clientData.nombreCompleto || !clientData.telefono) {
                Swal.fire("Atención", "Nombre y teléfono son requeridos para el nuevo cliente.", "warning");
                return;
            }
            try {
                const nuevoCliente = await api.post('/clientes', {
                    nombreCompleto: clientData.nombreCompleto,
                    celular: clientData.telefono,
                    correo: clientData.email,
                    direccion: clientData.direccion,
                    dni: clientData.dni,
                });
                clienteIdToUse = nuevoCliente._id;
                const newClientOption = { value: nuevoCliente._id, label: nuevoCliente.nombreCompleto };
                setClientes((prev) => [...prev, newClientOption]);
                setClienteSeleccionado(newClientOption);
            } catch (err) {
                Swal.fire("Error", `No se pudo crear el cliente: ${err.message}`, "error");
                return;
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
            marcaProducto: serviceData.marcaProducto,
            modeloProducto: serviceData.modeloProducto,
            fallaReportada: serviceData.fallaReportada,
            asunto: serviceData.asunto,
            detalles: serviceData.asunto,
            notasAdicionales: serviceData.notasAdicionales,
            anticipo: Number(serviceData.anticipo) || 0,
            metodoPago: serviceData.metodoPago,
            presupuesto: {
                items: [{ descripcion: serviceData.asunto || serviceData.fallaReportada || 'Servicio', costo: Number(serviceData.totalEstimado) || 0 }],
                subtotal: Number(serviceData.totalEstimado) || 0,
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
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });

            Toast.fire({ icon: 'success', title: 'Servicio creado y asociado al cliente' });

            setServicios((prev) => [...prev, nuevoServicio]);
            handleLimpiarFormulario();
            generarComprobante(nuevoServicio);
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
            Swal.fire({ icon: 'success', title: 'Servicio actualizado', timer: 2000, showConfirmButton: false });
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
            Swal.fire({ icon: 'success', title: 'Servicio eliminado', timer: 2000, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message || "No se pudo eliminar el servicio." });
        }
    };

    const openModal = async (service) => {
        let serviceToShow = service;
        try {
            if (service && service.cliente && typeof service.cliente === 'string') {
                const clienteFull = await api.get(`/clientes/${service.cliente}`);
                serviceToShow = { ...service, cliente: clienteFull };
            }
        } catch (err) {
            console.warn('No se pudo obtener cliente completo:', err);
        }
        setModalService(serviceToShow);
        setModalOpen(true);
    };

    const closeModal = () => { setModalOpen(false); setModalService(null); };

    const handleModalSave = async (id, dataToSave) => {
        try {
            const updated = await api.put(`/servicios/${id}`, dataToSave);
            setServicios((prev) => prev.map(s => (s._id || s.id) === (updated._id || updated.id) ? updated : s));
            closeModal();
            Swal.fire({ icon: 'success', title: 'Servicio actualizado', timer: 2000, showConfirmButton: false });
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
        const clienteId = (s.cliente && typeof s.cliente === 'object') ? (s.cliente._id || s.cliente.id || '') : (s.cliente || '');
        const clienteNombre = (s.cliente && typeof s.cliente === 'object') ? (s.cliente.nombreCompleto || '') : (clientes.find(c => c.value === clienteId)?.label || "");
        const servicioNumero = s.servicioNumero ? s.servicioNumero.toString() : "";
        const marca = (s.marcaProducto || '').toString().toLowerCase();
        const tipo = (s.tipoServicio || '').toString().toLowerCase();
        return servicioNumero.includes(query) || marca.includes(query) || tipo.includes(query) || (clienteNombre || '').toString().toLowerCase().includes(query);
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
                                <span className="sn-icon sn-icon-info">ℹ</span>
                                Datos del Cliente
                            </h2>

                            <div className="sn-field">
                                <label className="sn-label">Nombre completo <span className="sn-required">*</span></label>
                                <input
                                    type="text"
                                    className="sn-input"
                                    placeholder="Ej: Juan Perez"
                                    disabled={!isNewClient && !!clienteSeleccionado}
                                    value={isNewClient ? clientData.nombreCompleto : ''}
                                    onChange={(e) => setClientData({ ...clientData, nombreCompleto: e.target.value })}
                                />
                            </div>

                            {!isNewClient && (
                                <div className="sn-field">
                                    <label className="sn-label">Seleccionar cliente existente</label>
                                    <Select
                                        options={clientes}
                                        onChange={handleClienteSelect}
                                        value={clienteSeleccionado}
                                        placeholder="Buscar cliente..."
                                        classNamePrefix="sn-react-select"
                                    />
                                </div>
                            )}

                            <div className="sn-field">
                                <label className="sn-label">Teléfono <span className="sn-required">*</span></label>
                                <div className="sn-input-with-icon">
                                    <input
                                        type="text"
                                        name="telefono"
                                        className="sn-input"
                                        placeholder="Ej: 11 1234 5678"
                                        disabled={!isNewClient && !!clienteSeleccionado}
                                        value={isNewClient ? clientData.telefono : ''}
                                        onChange={(e) => setClientData({ ...clientData, telefono: e.target.value })}
                                    />
                                    <span className="sn-input-icon-right">💬</span>
                                </div>
                            </div>

                            <div className="sn-field">
                                <label className="sn-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="sn-input"
                                    placeholder="Ej: juanperez@email.com"
                                    disabled={!isNewClient && !!clienteSeleccionado}
                                    value={isNewClient ? clientData.email : ''}
                                    onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                                />
                            </div>

                            <div className="sn-field">
                                <label className="sn-label">Dirección</label>
                                <input
                                    type="text"
                                    name="direccion"
                                    className="sn-input"
                                    placeholder="Ej: Av. Siempre Viva 123, CABA"
                                    disabled={!isNewClient && !!clienteSeleccionado}
                                    value={isNewClient ? clientData.direccion : ''}
                                    onChange={(e) => setClientData({ ...clientData, direccion: e.target.value })}
                                />
                            </div>

                            <div className="sn-field">
                                <label className="sn-label">DNI (opcional)</label>
                                <input
                                    type="text"
                                    name="dni"
                                    className="sn-input"
                                    placeholder="Ej: 12.345.678"
                                    disabled={!isNewClient && !!clienteSeleccionado}
                                    value={isNewClient ? clientData.dni : ''}
                                    onChange={(e) => setClientData({ ...clientData, dni: e.target.value })}
                                />
                            </div>

                            <label className="sn-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={isNewClient}
                                    onChange={() => {
                                        setIsNewClient(!isNewClient);
                                        if (!isNewClient) {
                                            setClienteSeleccionado(null);
                                        }
                                    }}
                                />
                                <span>Crear nuevo cliente</span>
                            </label>
                        </div>

                        {/* SECCION 2: Datos del Servicio */}
                        <div className="sn-card">
                            <h2 className="sn-card-title">
                                <span className="sn-icon sn-icon-service">🔧</span>
                                Datos del Servicio
                            </h2>

                            <div className="sn-field-row-2">
                                <div className="sn-field">
                                    <label className="sn-label">Tipo de Servicio <span className="sn-required">*</span></label>
                                    <select name="tipoServicio" className="sn-select" value={serviceData.tipoServicio} onChange={handleServiceChange}>
                                        <option value="">Seleccionar tipo de servicio</option>
                                        {TIPO_SERVICIO_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sn-field">
                                    <label className="sn-label">Tipo de Equipo <span className="sn-required">*</span></label>
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
                                    <label className="sn-label">Marca <span className="sn-required">*</span></label>
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
                                    <label className="sn-label">Modelo <span className="sn-required">*</span></label>
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
                                <label className="sn-label">Falla Reportada <span className="sn-required">*</span></label>
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
                                <label className="sn-label">Asunto / Detalle del Servicio <span className="sn-required">*</span></label>
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
                                <span className="sn-icon sn-icon-notes">📝</span>
                                Información Adicional
                            </h2>

                            <div className="sn-field">
                                <label className="sn-label">Notas adicionales</label>
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
                                <span className="sn-icon sn-icon-payment">💰</span>
                                Costos y Pago
                            </h2>

                            <div className="sn-field-row-2">
                                <div className="sn-field">
                                    <label className="sn-label">Seña / Anticipo</label>
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
                                    <label className="sn-label">Total Estimado</label>
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
                                    <label className="sn-label">Método de Pago</label>
                                    <select name="metodoPago" className="sn-select" value={serviceData.metodoPago} onChange={handleServiceChange}>
                                        <option value="">Seleccionar método de pago</option>
                                        {METODO_PAGO_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sn-field">
                                    <label className="sn-label">Estado Inicial</label>
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
                            🗑 Limpiar Formulario
                        </button>
                        <div className="sn-actions-right">
                            <button type="button" className="sn-btn sn-btn-cancel" onClick={handleLimpiarFormulario}>
                                Cancelar
                            </button>
                            <button type="submit" className="sn-btn sn-btn-save">
                                💾 Guardar Servicio
                            </button>
                        </div>
                    </div>
                </form>

                {/* BOTON MOSTRAR/OCULTAR SERVICIOS */}
                <button className="sn-btn-toggle" onClick={() => setShowListaServicios(!showListaServicios)}>
                    {showListaServicios ? "Ocultar Servicios" : "Mostrar Servicios"}
                </button>

                {showListaServicios && (
                    <div className="sn-buscador">
                        <input
                            type="text"
                            placeholder="Buscar por N° Orden, cliente, marca o tipo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}

                {showListaServicios && (
                    <div className="sn-servicios-lista">
                        <div className="sn-servicios-cards">
                            {serviciosOrdenados.map((s) => {
                                const clienteId = (s.cliente && typeof s.cliente === 'object') ? (s.cliente._id || s.cliente.id || '') : (s.cliente || '');
                                const clienteObj = clientes.find(c => c.value === clienteId);
                                const clienteNombre = (s.cliente && typeof s.cliente === 'object') ? (s.cliente.nombreCompleto || '') : (clienteObj?.label || "Cliente desconocido");
                                const servicioId = s._id || s.id;
                                const servicioNumero = s.servicioNumero || 'N/A';
                                const qrUrl = `${URL_BASE_PUBLICA}/seguimiento/${servicioNumero}`;

                                return (
                                    <div key={servicioId} className="sn-servicio-card">
                                        <div className="sn-card-qr">
                                            <h4>N° Orden: {servicioNumero}</h4>
                                            <QRCodeSVG value={qrUrl} size={70} level="H" />
                                        </div>
                                        <div className="sn-card-info">
                                            <div className="sn-card-grid">
                                                <div className="sn-card-label">Cliente</div>
                                                <div className="sn-card-label">Tipo</div>
                                                <div className="sn-card-label">Marca</div>
                                                <div className="sn-card-label">Modelo</div>
                                                <div className="sn-card-label">Entrada</div>
                                                <div className="sn-card-value">{clienteNombre}</div>
                                                <div className="sn-card-value">{TIPO_EQUIPO_OPTIONS.find(o => o.value === s.tipoEquipo)?.label || s.tipoServicio}</div>
                                                <div className="sn-card-value">{s.marcaProducto || 'N/A'}</div>
                                                <div className="sn-card-value">{s.modeloProducto || 'N/A'}</div>
                                                <div className="sn-card-value">{s.fechaEntrada ? new Date(s.fechaEntrada).toLocaleDateString() : 'N/A'}</div>
                                            </div>
                                            <div className="sn-card-actions">
                                                <button onClick={() => openModal(s)} className="sn-btn sn-btn-detail">Ver más</button>
                                                <button onClick={() => generarComprobante(s)} className="sn-btn sn-btn-pdf">PDF</button>
                                                <button onClick={() => handleDeleteServicio(servicioId)} className="sn-btn sn-btn-delete">Eliminar</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {serviciosFiltrados.length === 0 && <p className="sn-no-results">No se encontraron servicios.</p>}
                        </div>
                    </div>
                )}
            </div>

            {serviceToPrint && isPrinting && (
                <div ref={comprobanteRef} style={{ position: 'absolute', left: '-9999px', width: '210mm', minHeight: '297mm', padding: '10mm', backgroundColor: '#fff' }}>
                    <ComprobantePDF service={serviceToPrint} TIPO_SERVICIO_OPTIONS={TIPO_EQUIPO_OPTIONS} ESTADO_OPTIONS={ESTADO_OPTIONS} />
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
        </div>
    );
}

export default ServiciosAdmin;
