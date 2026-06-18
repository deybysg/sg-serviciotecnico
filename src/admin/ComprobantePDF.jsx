import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toIdString } from '../utils/id';

const ComprobantePDF = ({ service, TIPO_SERVICIO_OPTIONS, ESTADO_OPTIONS }) => {
    const getTipoLabel = (value) => TIPO_SERVICIO_OPTIONS.find(o => o.value === value)?.label || value;
    const getEstadoLabel = (value) => ESTADO_OPTIONS.find(o => o.value === value)?.label || value;

    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString.split('T')[0] + 'T12:00:00');
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        return new Date(isoString).toLocaleString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

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
    const filasVacias = presupuestoCero ? Array(2).fill({ descripcion: '_________________________', costo: 0 }) : [];
    const filasAMostrar = presupuestoCero ? filasVacias : itemsPresupuesto;

    const servicioNumero = service.servicioNumero || 'N/A';
    const urlSeguimiento = `${import.meta.env.VITE_FRONTEND_URL || 'https://sg-serviciotecnico.vercel.app'}/seguimiento/${servicioNumero}`;

    return (
        <div style={S.wrap}>
            {/* ================= CLIENTE ================= */}
            <div style={S.cliente}>
                {/* Header */}
                <div style={S.header}>
                    <div style={S.headerLeft}>
                        <div style={S.logo}>SG</div>
                        <div>
                            <div style={S.title}>COMPROBANTE DE SERVICIO TÉCNICO</div>
                            <div style={S.subtitle}>Original Cliente — SG Servicio Técnico</div>
                        </div>
                    </div>
                    <div style={S.headerRight}>
                        <div><b>N° Orden:</b> {servicioNumero}</div>
                        <div><b>Fecha:</b> {formatDate(service.fechaEntrada)}</div>
                    </div>
                </div>

                {/* Cliente + Equipo en dos columnas */}
                <div style={S.cols2}>
                    <div style={S.col}>
                        <div style={S.secTitle}>DATOS DEL CLIENTE</div>
                        <div style={S.line}><b>Cliente:</b> {service.clienteNombre || service.cliente?.nombreCompleto || '—'}</div>
                        <div style={S.line}><b>Email:</b> {service.clienteCorreo || service.cliente?.correo || '—'}</div>
                        <div style={S.line}><b>Dir:</b> {service.clienteDireccion || service.cliente?.direccion || '—'}</div>
                    </div>
                    <div style={S.col}>
                        <div style={S.secTitle}>DATOS DEL EQUIPO</div>
                        <div style={S.line}><b>Equipo:</b> {service.tipoEquipo || service.tipo_equipo || '—'}</div>
                        <div style={S.line}><b>Marca:</b> {service.marcaProducto || service.marca_producto || '—'}</div>
                        <div style={S.line}><b>Modelo:</b> {service.modeloProducto || service.modelo_producto || '—'}</div>
                        <div style={S.line}><b>Servicio:</b> {getTipoLabel(service.tipoServicio || service.tipo_servicio)}</div>
                    </div>
                </div>

                {/* Falla */}
                <div style={S.box}>
                    <div style={S.secTitle}>PROBLEMA REPORTADO / FALLA</div>
                    <div style={S.falla}>{service.fallaReportada || service.falla_reportada || service.detalles || 'No se registraron detalles.'}</div>
                </div>

                {/* Info adicional compacta */}
                {(service.asunto || service.notasAdicionales || service.notas_adicionales || service.metodoPago || service.anticipo) && (
                    <div style={S.box}>
                        <div style={S.secTitle}>INFO ADICIONAL</div>
                        <div style={S.cols2}>
                            {service.asunto && <div style={S.line}><b>Asunto:</b> {service.asunto}</div>}
                            {service.metodoPago && <div style={S.line}><b>Pago:</b> {service.metodoPago || service.metodo_pago}</div>}
                            {service.anticipo && Number(service.anticipo) > 0 && <div style={S.line}><b>Anticipo:</b> ${Number(service.anticipo).toFixed(2)}</div>}
                        </div>
                        {(service.notasAdicionales || service.notas_adicionales) && (
                            <div style={S.line}><b>Notas:</b> {service.notasAdicionales || service.notas_adicionales}</div>
                        )}
                    </div>
                )}

                {/* Presupuesto */}
                <div style={S.box}>
                    <div style={S.secTitle}>PRESUPUESTO ESTIMADO</div>
                    <table style={S.table}>
                        <thead>
                            <tr><th style={S.th}>Descripción</th><th style={S.thR}>Costo</th></tr>
                        </thead>
                        <tbody>
                            {filasAMostrar.map((item, i) => (
                                <tr key={i}><td style={S.td}>{item.descripcion}</td><td style={S.tdR}>{presupuestoCero ? '' : `$${Number(item.costo || 0).toFixed(2)}`}</td></tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td style={S.tdTotalL}>{presupuestoCero ? 'TOTAL (A COMPLETAR):' : 'TOTAL ESTIMADO:'}</td>
                                <td style={S.tdTotalR}>{presupuestoCero ? '___________' : `$${Number(presupuestoTotal).toFixed(2)}`}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <div style={S.note}>
                        {presupuestoCero ? '___________________________________________________________' : '* Presupuesto estimado, el costo final puede variar.'}
                    </div>
                </div>

                {/* Footer cliente */}
                <div style={S.footerCliente}>
                    <div>
                        <div style={S.thanks}>¡Gracias por tu confianza!</div>
                        <div style={S.small}>Conservá este comprobante para seguimiento.</div>
                    </div>
                    <div style={S.qrWrap}>
                        <QRCodeSVG value={urlSeguimiento} size={42} level="H" />
                        <div style={S.qrText}>Ver estado</div>
                    </div>
                </div>
            </div>

            {/* ================= CORTE ================= */}
            <div style={S.corte}>
                <div style={S.corteLine} />
                <span style={S.corteIcon}>✂</span>
                <span style={S.corteTxt}>Recortar aquí</span>
                <div style={S.corteLine} />
            </div>

            {/* ================= TICKET VENDEDOR ================= */}
            <div style={S.ticket}>
                <div style={S.ticketHead}>
                    <div style={S.ticketLogo}>SG</div>
                    <div style={S.ticketLabel}>COPIA VENDEDOR</div>
                </div>
                <div style={S.ticketBody}>
                    <div style={S.ticketRow}><span style={S.ticketK}>N° Orden:</span><span style={S.ticketV}>{servicioNumero}</span></div>
                    <div style={S.ticketRow}><span style={S.ticketK}>Fecha:</span><span style={S.ticketV}>{formatDateTime(service.fechaEntrada)}</span></div>
                    <div style={S.ticketSep} />
                    <div style={S.ticketRow}><span style={S.ticketK}>Cliente:</span><span style={S.ticketV}>{service.clienteNombre || service.cliente?.nombreCompleto || '—'}</span></div>
                    <div style={S.ticketRow}><span style={S.ticketK}>Equipo:</span><span style={S.ticketV}>{service.tipoEquipo || service.tipo_equipo || '—'} {service.marcaProducto || service.marca_producto || ''}</span></div>
                    <div style={S.ticketSep} />
                    <div style={S.ticketRow}><span style={S.ticketK}>Total:</span><span style={S.ticketV}>${Number(presupuestoTotal).toFixed(2)}</span></div>
                </div>
                <div style={S.ticketFoot}>Control interno — No válido como factura</div>
            </div>
        </div>
    );
};

const S = {
    wrap: {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '8.5pt',
        color: '#222',
        padding: '4mm',
        backgroundColor: '#fff',
        margin: '0 auto',
        boxSizing: 'border-box',
        maxWidth: '190mm',
        lineHeight: 1.25,
    },

    // Cliente
    cliente: {
        border: '1px solid #999',
        padding: '5mm',
        backgroundColor: '#fff',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '4px',
        paddingBottom: '4px',
        borderBottom: '1.5px solid #007bff',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    logo: {
        width: '28px',
        height: '28px',
        borderRadius: '4px',
        background: 'linear-gradient(90deg, #0b2545, #1f6f9f)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '0.75rem',
    },
    title: {
        fontSize: '11pt',
        fontWeight: '900',
        color: '#007bff',
        margin: 0,
    },
    subtitle: {
        fontSize: '7.5pt',
        color: '#666',
        margin: 0,
    },
    headerRight: {
        textAlign: 'right',
        fontSize: '7.5pt',
        lineHeight: 1.3,
    },
    badge: (estado) => ({
        padding: '0px 4px',
        borderRadius: '2px',
        fontWeight: 'bold',
        fontSize: '7pt',
        color: '#fff',
        backgroundColor: estado === 'ENTREGADO' ? '#28a745' : estado === 'REVISIÓN' ? '#ffc107' : '#007bff',
    }),

    cols2: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px 10px',
        marginTop: '4px',
        marginBottom: '4px',
    },
    col: {
        border: '1px solid #e0e0e0',
        borderRadius: '3px',
        padding: '4px 6px',
        background: '#fafbfc',
    },
    secTitle: {
        fontSize: '7.5pt',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#444',
        borderBottom: '1px solid #ddd',
        paddingBottom: '1px',
        marginBottom: '3px',
    },
    line: {
        fontSize: '8pt',
        margin: '1px 0',
    },
    box: {
        border: '1px solid #e0e0e0',
        borderRadius: '3px',
        padding: '4px 6px',
        background: '#fafbfc',
        marginTop: '4px',
    },
    falla: {
        fontSize: '8pt',
        whiteSpace: 'pre-wrap',
        background: '#fff',
        border: '1px solid #e0e0e0',
        padding: '4px',
        borderRadius: '2px',
        minHeight: '24px',
    },

    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '3px',
        fontSize: '8pt',
    },
    th: {
        border: '1px solid #bbb',
        backgroundColor: '#e9ecef',
        padding: '2px 4px',
        textAlign: 'left',
        fontSize: '7pt',
        fontWeight: 'bold',
    },
    thR: {
        border: '1px solid #bbb',
        backgroundColor: '#e9ecef',
        padding: '2px 4px',
        textAlign: 'right',
        fontSize: '7pt',
        fontWeight: 'bold',
        width: '18%',
    },
    td: {
        border: '1px solid #e0e0e0',
        padding: '2px 4px',
        fontSize: '8pt',
    },
    tdR: {
        border: '1px solid #e0e0e0',
        padding: '2px 4px',
        textAlign: 'right',
        fontSize: '8pt',
    },
    tdTotalL: {
        borderTop: '1px solid #555',
        padding: '2px 4px',
        textAlign: 'right',
        fontWeight: 'bold',
        fontSize: '8pt',
        backgroundColor: '#f0f0f0',
    },
    tdTotalR: {
        borderTop: '1px solid #555',
        padding: '2px 4px',
        textAlign: 'right',
        fontWeight: 'bold',
        fontSize: '9pt',
        backgroundColor: '#e9ecef',
        color: '#007bff',
    },
    note: {
        fontSize: '6.5pt',
        color: '#777',
        marginTop: '2px',
    },

    footerCliente: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '4px',
        paddingTop: '4px',
        borderTop: '1px solid #ddd',
    },
    thanks: {
        fontWeight: 'bold',
        fontSize: '9pt',
        color: '#0b2545',
        margin: 0,
    },
    small: {
        fontSize: '6.5pt',
        color: '#888',
        margin: 0,
    },
    qrWrap: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1px',
    },
    qrText: {
        fontSize: '6pt',
        color: '#888',
    },

    // Corte
    corte: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 12px',
        background: 'repeating-linear-gradient(45deg, #fff9f0, #fff9f0 8px, #fff0d9 8px, #fff0d9 16px)',
        borderTop: '1.5px dashed #e0a800',
        borderBottom: '1.5px dashed #e0a800',
        margin: '2px 0',
    },
    corteLine: {
        flex: 1,
        height: 0,
        borderTop: '1.5px dashed #e0a800',
    },
    corteIcon: {
        fontSize: '1.1rem',
        color: '#e0a800',
    },
    corteTxt: {
        fontSize: '0.7rem',
        fontWeight: '700',
        color: '#b38600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
    },

    // Ticket vendedor
    ticket: {
        maxWidth: '420px',
        margin: '0 auto',
        padding: '14px 22px',
        background: '#fff',
        border: '2.5px dashed #ffc107',
        borderRadius: '8px',
        fontSize: '11pt',
    },
    ticketHead: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '10px',
        borderBottom: '2px dashed #e0e0e0',
        marginBottom: '10px',
    },
    ticketLogo: {
        width: '42px',
        height: '42px',
        borderRadius: '6px',
        background: 'linear-gradient(90deg, #0b2545, #1f6f9f)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: '1.1rem',
    },
    ticketLabel: {
        fontSize: '0.85rem',
        fontWeight: '800',
        color: '#b38600',
        textTransform: 'uppercase',
        background: '#fff8e1',
        padding: '4px 10px',
        borderRadius: '4px',
    },
    ticketBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    ticketRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10.5pt',
        lineHeight: 1.5,
    },
    ticketK: {
        color: '#555',
        fontWeight: '600',
    },
    ticketV: {
        color: '#222',
        fontWeight: '700',
        textAlign: 'right',
    },
    ticketSep: {
        height: 0,
        borderTop: '1.5px dashed #ccc',
        margin: '8px 0',
    },
    ticketFoot: {
        textAlign: 'center',
        fontSize: '8.5pt',
        color: '#888',
        marginTop: '10px',
        paddingTop: '8px',
        borderTop: '1.5px dashed #ccc',
    },
};

export default ComprobantePDF;
