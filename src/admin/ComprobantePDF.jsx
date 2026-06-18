import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { shortId, toIdString } from '../utils/id';

// Se asume que este componente estará en el mismo directorio que ServiciosAdmin.jsx

const ComprobantePDF = ({ service, TIPO_SERVICIO_OPTIONS, ESTADO_OPTIONS }) => {
    // --- Helpers para obtener labels ---
    const getTipoLabel = (value) => TIPO_SERVICIO_OPTIONS.find(o => o.value === value)?.label || value;
    const getEstadoLabel = (value) => ESTADO_OPTIONS.find(o => o.value === value)?.label || value;
    
    // --- Formateo de fechas ---
    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString.split('T')[0] + 'T12:00:00'); 
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // --- Lógica del Presupuesto ---
    const presupuesto = service.presupuesto || {
        items: service.presupuesto_items || [],
        subtotal: Number(service.presupuesto_subtotal || 0),
        iva: Number(service.presupuesto_iva || 0),
        total: Number(service.presupuesto_total || 0)
    };
    const presupuestoTotal = Number(presupuesto.total || 0);
    const presupuestoItems = presupuesto.items || [];
    const presupuestoCero = presupuestoTotal === 0 && presupuestoItems.every(item => (Number(item.costo || 0) === 0 || !item.descripcion));
    const itemsPresupuesto = presupuestoItems.filter(item => item.descripcion || Number(item.costo || 0) > 0);
    
    const filasVacias = presupuestoCero ? Array(3).fill({ descripcion: '_________________________', costo: 0 }) : [];
    const filasAMostrar = presupuestoCero ? filasVacias : itemsPresupuesto;

    const servicioNumero = service.servicioNumero || 'N/A';
    const urlSeguimiento = `${import.meta.env.VITE_FRONTEND_URL || 'https://sg-serviciotecnico.vercel.app'}/seguimiento/${servicioNumero}`;

    // ============================
    // PARTE SUPERIOR: CLIENTE
    // ============================
    const ClienteSection = () => (
        <div style={styles.bloqueCliente}>
            {/* Cabecera */}
            <div style={styles.headerCliente}>
                <div style={styles.headerLeft}>
                    <div style={styles.logoBox}>SG</div>
                    <div>
                        <h1 style={styles.titleCliente}>COMPROBANTE DE SERVICIO TÉCNICO</h1>
                        <p style={styles.subtitleCliente}>SG SERVICIO TECNICO — Original Cliente</p>
                    </div>
                </div>
                <div style={styles.headerRight}>
                    <div style={styles.metaRow}><strong>N° Orden:</strong> <span style={styles.metaHighlight}>{servicioNumero}</span></div>
                    <div style={styles.metaRow}><strong>Fecha Ingreso:</strong> {formatDate(service.fechaEntrada)}</div>
                    <div style={styles.metaRow}><strong>Estado:</strong> <span style={styles.statusBadge(service.estado)}>{getEstadoLabel(service.estado)}</span></div>
                </div>
            </div>

            <div style={styles.sepBlue} />

            {/* Datos del Cliente */}
            <div style={styles.sectionBox}>
                <h2 style={styles.sectionTitle}>DATOS DEL CLIENTE</h2>
                <div style={styles.grid2}>
                    <p style={styles.gridItem}><strong>Cliente:</strong> {service.clienteNombre || service.cliente?.nombreCompleto || 'N/A'}</p>
                    <p style={styles.gridItem}><strong>Teléfono:</strong> {service.clienteTelefono || service.cliente?.celular || 'N/A'}</p>
                    <p style={styles.gridItem}><strong>DNI:</strong> {service.clienteDni || service.cliente?.dni || 'N/A'}</p>
                    <p style={styles.gridItem}><strong>Correo:</strong> {service.clienteCorreo || service.cliente?.correo || 'N/A'}</p>
                    <p style={styles.gridItem}><strong>Dirección:</strong> {service.clienteDireccion || service.cliente?.direccion || 'N/A'}</p>
                </div>
            </div>

            <div style={styles.sepThin} />

            {/* Datos del Equipo */}
            <div style={styles.sectionBox}>
                <h2 style={styles.sectionTitle}>DATOS DEL SERVICIO Y EQUIPO</h2>
                <div style={styles.grid2}>
                    <p style={styles.gridItem}><strong>Equipo:</strong> {service.tipoEquipo || service.tipo_equipo || 'N/A'}</p>
                    <p style={styles.gridItem}><strong>Marca:</strong> {service.marcaProducto || service.marca_producto || 'N/A'}</p>
                    <p style={styles.gridItem}><strong>Modelo:</strong> {service.modeloProducto || service.modelo_producto || 'N/A'}</p>
                    <p style={styles.gridItem}><strong>Tipo de Servicio:</strong> {getTipoLabel(service.tipoServicio || service.tipo_servicio)}</p>
                    <p style={styles.gridItem}><strong>Estado:</strong> <span style={styles.statusBadge(service.estado)}>{getEstadoLabel(service.estado)}</span></p>
                    <p style={styles.gridItem}><strong>Nro. Orden:</strong> {service.servicioNumero || service.servicio_numero || 'N/A'}</p>
                </div>
            </div>

            <div style={styles.sepThin} />

            {/* Problema */}
            <div style={styles.sectionBox}>
                <h2 style={styles.sectionTitle}>PROBLEMA REPORTADO / FALLA</h2>
                <p style={styles.detailsBox}>{service.fallaReportada || service.falla_reportada || service.detalles || 'No se registraron detalles. (Revisión Pendiente)'}</p>
            </div>

            {/* Info Adicional */}
            {(service.asunto || service.notasAdicionales || service.notas_adicionales || service.metodoPago || service.anticipo) && (
                <>
                    <div style={styles.sepThin} />
                    <div style={styles.sectionBox}>
                        <h2 style={styles.sectionTitle}>INFORMACIÓN ADICIONAL</h2>
                        <div style={styles.grid2}>
                            {service.asunto && <p style={styles.gridItem}><strong>Asunto:</strong> {service.asunto}</p>}
                            {service.metodoPago && <p style={styles.gridItem}><strong>Método de Pago:</strong> {service.metodoPago || service.metodo_pago}</p>}
                            {service.anticipo && Number(service.anticipo) > 0 && (
                                <p style={styles.gridItem}><strong>Anticipo:</strong> ${Number(service.anticipo).toFixed(2)}</p>
                            )}
                        </div>
                        {(service.notasAdicionales || service.notas_adicionales) && (
                            <p style={styles.detailsBox}><strong>Notas:</strong> {service.notasAdicionales || service.notas_adicionales}</p>
                        )}
                    </div>
                </>
            )}

            <div style={styles.sepThin} />

            {/* Presupuesto */}
            <div style={styles.sectionBox}>
                <h2 style={styles.sectionTitle}>PRESUPUESTO ESTIMADO / DETALLE DE REPARACIÓN</h2>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>DESCRIPCIÓN</th>
                            <th style={styles.thCosto}>COSTO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filasAMostrar.map((item, index) => (
                            <tr key={index}>
                                <td style={styles.td}>{item.descripcion}</td>
                                <td style={styles.tdCosto}>
                                    {presupuestoCero ? '' : `$${Number(item.costo || 0).toFixed(2)}`}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style={styles.tdTotalLabel}>
                                {presupuestoCero ? 'COSTO TOTAL (A COMPLETAR):' : 'TOTAL ESTIMADO:'}
                            </td>
                            <td style={styles.tdTotalValue}>
                                {presupuestoCero ? '___________' : `$${Number(presupuestoTotal).toFixed(2)}`}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                <p style={styles.note}>
                    {presupuestoCero 
                        ? '_____________________________________________________________________'
                        : '* Este es un presupuesto estimado, el costo final puede variar tras la revisión técnica o aprobación del cliente.'
                    }
                </p>
            </div>

            <div style={styles.sepBlue} />

            {/* Footer Cliente */}
            <div style={styles.footerCliente}>
                <div style={styles.footerLeft}>
                    <p style={styles.footerThanks}>¡Gracias por tu confianza!</p>
                    <p style={styles.footerSmall}>Conservá este comprobante para seguimiento y reclamos.</p>
                </div>
                <div style={styles.footerQr}>
                    <QRCodeSVG value={urlSeguimiento} size={50} level="H" bgColor="#ffffff" fgColor="#000000" />
                    <span style={styles.qrLabel}>Escaneá para seguimiento</span>
                </div>
            </div>
        </div>
    );

    // ============================
    // PARTE INFERIOR: TICKET VENDEDOR
    // ============================
    const TicketVendedor = () => (
        <div style={styles.ticketVendedor}>
            <div style={styles.ticketHeader}>
                <div style={styles.ticketLogo}>SG</div>
                <div style={styles.ticketTipo}>COPIA VENDEDOR</div>
            </div>
            
            <div style={styles.ticketBody}>
                <div style={styles.ticketRow}>
                    <span style={styles.ticketLabel}>N° Orden:</span>
                    <span style={styles.ticketValue}>{servicioNumero}</span>
                </div>
                <div style={styles.ticketRow}>
                    <span style={styles.ticketLabel}>Fecha:</span>
                    <span style={styles.ticketValue}>{formatDateTime(service.fechaEntrada)}</span>
                </div>
                <div style={styles.ticketSep} />
                <div style={styles.ticketRow}>
                    <span style={styles.ticketLabel}>Cliente:</span>
                    <span style={styles.ticketValue}>{service.clienteNombre || service.cliente?.nombreCompleto || '—'}</span>
                </div>
                <div style={styles.ticketRow}>
                    <span style={styles.ticketLabel}>Teléfono:</span>
                    <span style={styles.ticketValue}>{service.clienteTelefono || service.cliente?.celular || '—'}</span>
                </div>
                <div style={styles.ticketRow}>
                    <span style={styles.ticketLabel}>Equipo:</span>
                    <span style={styles.ticketValue}>{service.tipoEquipo || service.tipo_equipo || '—'} {service.marcaProducto || service.marca_producto || ''}</span>
                </div>
                <div style={styles.ticketSep} />
                <div style={styles.ticketRow}>
                    <span style={styles.ticketLabel}>Estado:</span>
                    <span style={styles.ticketValue}>{getEstadoLabel(service.estado)}</span>
                </div>
                <div style={styles.ticketRow}>
                    <span style={styles.ticketLabel}>Total:</span>
                    <span style={styles.ticketValue}>${Number(presupuestoTotal).toFixed(2)}</span>
                </div>
            </div>

            <div style={styles.ticketFooter}>
                Control interno — No válido como factura
            </div>
        </div>
    );

    // ============================
    // RENDER PRINCIPAL
    // ============================
    return (
        <div style={styles.container}>
            <ClienteSection />
            
            {/* Línea de corte */}
            <div style={styles.corteLinea}>
                <div style={styles.corteLine} />
                <span style={styles.corteIcon}>✂</span>
                <span style={styles.corteText}>Recortar aquí</span>
                <div style={styles.corteLine} />
            </div>
            
            <TicketVendedor />
        </div>
    );
};

// ============================
// ESTILOS
// ============================
const styles = {
    container: {
        fontFamily: 'Roboto, Arial, sans-serif',
        fontSize: '9pt',
        color: '#343a40',
        padding: '10mm',
        backgroundColor: '#ffffff',
        margin: '0 auto',
        boxSizing: 'border-box',
        maxWidth: '190mm'
    },

    // === CLIENTE ===
    bloqueCliente: {
        border: '1px solid #adb5bd',
        padding: '8mm',
        backgroundColor: '#ffffff',
        marginBottom: '4mm',
    },
    headerCliente: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '6px',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    logoBox: {
        width: '40px',
        height: '40px',
        borderRadius: '6px',
        background: 'linear-gradient(90deg, #0b2545, #1f6f9f)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '0.9rem',
    },
    titleCliente: {
        fontSize: '13pt',
        margin: '0',
        color: '#007bff',
        fontWeight: '900',
    },
    subtitleCliente: {
        fontSize: '9pt',
        margin: '2px 0 0 0',
        fontWeight: 'bold',
        color: '#6c757d',
    },
    headerRight: {
        textAlign: 'right',
        fontSize: '8.5pt',
        lineHeight: '1.4',
    },
    metaRow: {
        marginBottom: '2px',
    },
    metaHighlight: {
        fontWeight: 'bold',
        color: '#0b2545',
    },
    statusBadge: (estado) => ({
        padding: '1px 6px',
        borderRadius: '3px',
        fontWeight: 'bold',
        fontSize: '8pt',
        color: '#ffffff',
        backgroundColor: estado === 'ENTREGADO' ? '#28a745' : estado === 'REVISIÓN' ? '#ffc107' : '#007bff',
    }),

    sepBlue: {
        height: '2px',
        backgroundColor: '#007bff',
        margin: '8px 0',
    },
    sepThin: {
        height: '1px',
        backgroundColor: '#dee2e6',
        margin: '6px 0',
    },

    sectionBox: {
        marginBottom: '6px',
    },
    sectionTitle: {
        fontSize: '9pt',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#495057',
        borderBottom: '1px solid #ced4da',
        paddingBottom: '2px',
        marginBottom: '6px',
        marginTop: '0',
    },
    grid2: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3px 12px',
    },
    gridItem: {
        margin: 0,
        fontSize: '9pt',
    },
    detailsBox: {
        whiteSpace: 'pre-wrap',
        border: '1px solid #ced4da',
        backgroundColor: '#f8f9fa',
        padding: '8px',
        borderRadius: '4px',
        lineHeight: '1.4',
        minHeight: '35px',
        fontSize: '9pt',
        margin: '0',
    },

    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '6px',
    },
    th: {
        border: '1px solid #adb5bd',
        backgroundColor: '#e9ecef',
        color: '#343a40',
        padding: '3px 6px',
        textAlign: 'left',
        fontSize: '8pt',
        textTransform: 'uppercase',
    },
    thCosto: {
        border: '1px solid #adb5bd',
        backgroundColor: '#e9ecef',
        color: '#343a40',
        padding: '3px 6px',
        textAlign: 'right',
        width: '15%',
        fontSize: '8pt',
        textTransform: 'uppercase',
    },
    td: {
        border: '1px solid #f8f9fa',
        borderBottom: '1px solid #e9ecef',
        padding: '3px 6px',
        fontSize: '9pt',
    },
    tdCosto: {
        border: '1px solid #f8f9fa',
        borderBottom: '1px solid #e9ecef',
        padding: '3px 6px',
        textAlign: 'right',
        fontSize: '9pt',
    },
    tdTotalLabel: {
        borderTop: '1px solid #495057',
        padding: '3px 6px',
        textAlign: 'right',
        fontSize: '9pt',
        fontWeight: 'bold',
        backgroundColor: '#f8f9fa',
    },
    tdTotalValue: {
        borderTop: '1px solid #495057',
        padding: '3px 6px',
        textAlign: 'right',
        backgroundColor: '#e9ecef',
        fontSize: '10pt',
        fontWeight: 'bold',
        color: '#007bff',
    },
    note: {
        fontSize: '7pt',
        marginTop: '4px',
        color: '#6c757d',
    },

    footerCliente: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #dee2e6',
    },
    footerLeft: {
        textAlign: 'left',
    },
    footerThanks: {
        margin: '0',
        fontWeight: 'bold',
        fontSize: '10pt',
        color: '#0b2545',
    },
    footerSmall: {
        margin: '2px 0 0 0',
        fontSize: '7.5pt',
        color: '#888',
    },
    footerQr: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
    },
    qrLabel: {
        fontSize: '7pt',
        color: '#888',
    },

    // === CORTE ===
    corteLinea: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 16px',
        background: 'repeating-linear-gradient(45deg, #fff9f0, #fff9f0 10px, #fff0d9 10px, #fff0d9 20px)',
        borderTop: '2px dashed #ffd699',
        borderBottom: '2px dashed #ffd699',
        margin: '4px 0',
    },
    corteLine: {
        flex: 1,
        height: 0,
        borderTop: '2px dashed #e0a800',
    },
    corteIcon: {
        fontSize: '1.3rem',
        color: '#e0a800',
    },
    corteText: {
        fontSize: '0.75rem',
        fontWeight: '700',
        color: '#b38600',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
    },

    // === TICKET VENDEDOR ===
    ticketVendedor: {
        maxWidth: '320px',
        margin: '0 auto',
        padding: '10px 14px',
        background: '#fff',
        border: '2px dashed #ffc107',
        borderRadius: '6px',
        fontSize: '9pt',
    },
    ticketHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '6px',
        borderBottom: '2px dashed #e0e0e0',
        marginBottom: '6px',
    },
    ticketLogo: {
        width: '32px',
        height: '32px',
        borderRadius: '5px',
        background: 'linear-gradient(90deg, #0b2545, #1f6f9f)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '0.8rem',
    },
    ticketTipo: {
        fontSize: '0.7rem',
        fontWeight: '800',
        color: '#b38600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: '#fff8e1',
        padding: '2px 6px',
        borderRadius: '3px',
    },
    ticketBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
    },
    ticketRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.85rem',
        lineHeight: '1.3',
    },
    ticketLabel: {
        color: '#666',
        fontWeight: '600',
    },
    ticketValue: {
        color: '#333',
        fontWeight: '700',
        textAlign: 'right',
    },
    ticketSep: {
        height: 0,
        borderTop: '1px dashed #ddd',
        margin: '3px 0',
    },
    ticketFooter: {
        textAlign: 'center',
        fontSize: '0.65rem',
        color: '#aaa',
        marginTop: '6px',
        paddingTop: '4px',
        borderTop: '1px dashed #ddd',
    },
};

export default ComprobantePDF;
