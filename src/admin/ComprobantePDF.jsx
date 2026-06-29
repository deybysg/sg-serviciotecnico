import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toIdString } from '../utils/id';

const ComprobantePDF = ({ service, TIPO_SERVICIO_OPTIONS, ESTADO_OPTIONS }) => {
    const getTipoLabel = (value) => TIPO_SERVICIO_OPTIONS.find(o => o.value === value)?.label || value;
    const getEstadoLabel = (value) => ESTADO_OPTIONS.find(o => o.value === value)?.label || value;

    const formatDate = (isoString) => {
        if (!isoString) return '—';
        const date = new Date(isoString.split('T')[0] + 'T12:00:00');
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    const formatDateTime = (isoString) => {
        if (!isoString) return '—';
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

    const servicioNumero = service.servicioNumero || '—';
    const urlSeguimiento = `https://sg-serviciotecnico.vercel.app/seguimiento/${servicioNumero}`;

    return (
        <div style={S.wrap}>
            {/* ================= CLIENTE ================= */}
            <div style={S.cliente}>
                {/* Header */}
                <div style={S.header}>
                    <div style={S.headerLeft}>
                        <img src="/img/logo2.png" style={S.logoImg} alt="SG" />
                        <div>
                            <div style={S.title}>COMPROBANTE DE SERVICIO TÉCNICO</div>
                            <div style={S.localInfo}>📍 Av. Sarmiento 2da Cuadra | 📞 3816491380</div>
                        </div>
                    </div>
                    <div style={S.headerRight}>
                        <div style={S.qrBox}>
                            <div style={S.qrTextBlock}>
                                <div style={S.qrOrder}>N° Orden: {servicioNumero}</div>
                                <div style={S.qrLabel}>Escaneá para ver el estado<br/>de tu equipo →</div>
                            </div>
                            <QRCodeSVG value={urlSeguimiento} size={56} level="H" />
                        </div>
                    </div>
                </div>

                {/* Cliente + Equipo en dos columnas */}
                <div style={S.cols2}>
                    <div style={S.col}>
                        <div style={S.secTitle}>DATOS DEL CLIENTE</div>
                        <div style={S.line}><b>Cliente:</b> {service.clienteNombre || service.cliente?.nombreCompleto || '—'}</div>
                        <div style={S.line}><b>Email:</b> {service.clienteCorreo || service.cliente?.correo || '—'}</div>
                        <div style={S.line}><b>Dirección:</b> {service.clienteDireccion || service.cliente?.direccion || '—'}</div>
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
                {(service.asunto || service.notasAdicionales || service.notas_adicionales || service.metodoPago) && (
                    <div style={S.box}>
                        <div style={S.secTitle}>INFO ADICIONAL</div>
                        <div style={S.cols2}>
                            {service.asunto && <div style={S.line}><b>Asunto:</b> {service.asunto}</div>}
                            {service.metodoPago && <div style={S.line}><b>Pago:</b> {service.metodoPago || service.metodo_pago}</div>}
                        </div>
                        {(service.notasAdicionales || service.notas_adicionales) && (
                            <div style={S.line}><b>Notas:</b> {service.notasAdicionales || service.notas_adicionales}</div>
                        )}
                    </div>
                )}

                {/* Totales */}
                <div style={S.totalesBox}>
                    <div style={S.secTitle}>RESUMEN</div>
                    <div style={S.totalesGrid}>
                        <div style={S.totalRow}>
                            <span style={S.totalLabel}>TOTAL ESTIMADO:</span>
                            <span style={S.totalValue}>${Number(presupuestoTotal).toFixed(2)}</span>
                        </div>
                        {service.anticipo && Number(service.anticipo) > 0 && (
                            <div style={S.totalRow}>
                                <span style={S.totalLabel}>SEÑA / ANTICIPO:</span>
                                <span style={S.totalValueSeña}>${Number(service.anticipo).toFixed(2)}</span>
                            </div>
                        )}
                        <div style={S.totalRowFinal}>
                            <span style={S.totalLabelFinal}>TOTAL A PAGAR:</span>
                            <span style={S.totalValueFinal}>${Math.round(Number(presupuestoTotal - (Number(service.anticipo) || 0))).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Aviso */}
                <div style={S.aviso}>
                    <span style={S.avisoLabel}>Aviso:</span> Los equipos deberán ser retirados dentro de los 60 días de finalizada la reparación. Pasado ese plazo, el local no se responsabiliza por su guarda ni conservación, y podrá disponer del equipo por considerarlo abandonado.
                </div>

                {/* Footer cliente */}
                <div style={S.footerCliente}>
                    <div>
                        <div style={S.thanks}>¡Gracias por tu confianza!</div>
                        <div style={S.small}>Conservá este comprobante para seguimiento.</div>
                    </div>
                    <div style={S.orderInfo}>
                        <div><b>Fecha:</b> {formatDate(service.fechaEntrada)}</div>
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
                    <img src="/img/logo2.png" style={S.ticketLogoImg} alt="SG" />
                    <div style={S.ticketLabel}>COPIA VENDEDOR</div>
                </div>

                <div style={S.ticketBody}>
                    {/* Cliente */}
                    <div style={S.ticketField}>
                        <div style={S.ticketLabel2}>CLIENTE</div>
                        <div style={S.ticketValue2}>{service.clienteNombre || service.cliente?.nombreCompleto || '—'}</div>
                    </div>

                    {/* Equipo */}
                    <div style={S.ticketField}>
                        <div style={S.ticketLabel2}>EQUIPO</div>
                        <div style={S.ticketValue2}>{service.tipoEquipo || service.tipo_equipo || '—'} {service.marcaProducto || service.marca_producto || ''} {service.modeloProducto || service.modelo_producto || ''}</div>
                    </div>

                    {/* Falla */}
                    <div style={S.ticketField}>
                        <div style={S.ticketLabel2}>FALLA / PROBLEMA</div>
                        <div style={S.ticketValue2}>{service.fallaReportada || service.falla_reportada || service.detalles || '—'}</div>
                    </div>

                    {/* Asunto */}
                    {service.asunto && (
                        <div style={S.ticketField}>
                            <div style={S.ticketLabel2}>ASUNTO</div>
                            <div style={S.ticketValue2}>{service.asunto}</div>
                        </div>
                    )}

                    <div style={S.ticketSep} />

                    {/* Totales */}
                    <div style={S.ticketTotales}>
                        <div style={S.ticketTotalRow}>
                            <span style={S.ticketTotalLabel}>Subtotal:</span>
                            <span style={S.ticketTotalValue}>${Number(presupuestoTotal).toFixed(2)}</span>
                        </div>
                        {service.anticipo && Number(service.anticipo) > 0 && (
                            <div style={S.ticketTotalRow}>
                                <span style={S.ticketTotalLabel}>Seña / Anticipo:</span>
                                <span style={S.ticketTotalValueSeña}>-${Number(service.anticipo).toFixed(2)}</span>
                            </div>
                        )}
                        <div style={S.ticketTotalRowFinal}>
                            <span style={S.ticketTotalLabelFinal}>Total:</span>
                            <span style={S.ticketTotalValueFinal}>${Math.round(Number(presupuestoTotal - (Number(service.anticipo) || 0))).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Fecha y Orden */}
                    <div style={S.ticketRow2}>
                        <div><span style={S.ticketK2}>N° Orden:</span> <span style={S.ticketV2}>{servicioNumero}</span></div>
                        <div><span style={S.ticketK2}>Fecha:</span> <span style={S.ticketV2}>{formatDateTime(service.fechaEntrada)}</span></div>
                    </div>
                </div>

                <div style={S.ticketFoot}>Control interno — No válido como factura</div>
            </div>
        </div>
    );
};

const S = {
    wrap: {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '9.5pt',
        color: '#222',
        padding: '0',
        backgroundColor: '#fff',
        margin: '0 auto',
        boxSizing: 'border-box',
        width: '190mm',
        maxHeight: '277mm',
        overflow: 'hidden',
        lineHeight: 1.25,
    },

    // Cliente
  cliente: {
    border: '1px solid #999',
    padding: '5mm',
    backgroundColor: '#fff',
    maxHeight: '277mm',
    overflow: 'hidden',
},
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: '1.5px solid #007bff',
    },
    headerLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    logoImg: {
        height: '38px',
        width: 'auto',
        objectFit: 'contain',
    },
    title: {
        fontSize: '13pt',
        fontWeight: '900',
        color: '#007bff',
        margin: 0,
    },
    localInfo: {
        fontSize: '9pt',
        color: '#0b2545',
        margin: '3px 0 0 0',
        fontWeight: '700',
    },
    qrBox: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '8px',
    },
    qrTextBlock: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '3px',
    },
    qrOrder: {
        fontSize: '9.5pt',
        color: '#0b2545',
        fontWeight: '800',
        textAlign: 'right',
    },
    qrLabel: {
        fontSize: '8pt',
        color: '#0b2545',
        textAlign: 'right',
        fontWeight: '700',
        lineHeight: 1.3,
    },
    headerRight: {
        textAlign: 'right',
        fontSize: '8pt',
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
        gap: '8px 14px',
        marginTop: '10px',
        marginBottom: '10px',
    },
    col: {
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        padding: '8px 10px',
        background: '#fafbfc',
    },
    secTitle: {
        fontSize: '8.5pt',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#444',
        borderBottom: '1px solid #ddd',
        paddingBottom: '3px',
        marginBottom: '4px',
    },
    line: {
        fontSize: '9.5pt',
        margin: '2px 0',
    },
    box: {
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        padding: '8px 10px',
        background: '#fafbfc',
        marginTop: '8px',
    },
    falla: {
        fontSize: '9.5pt',
        whiteSpace: 'pre-wrap',
        background: '#fff',
        border: '1px solid #e0e0e0',
        padding: '8px',
        borderRadius: '4px',
        minHeight: '40px',
    },

    totalesBox: {
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '10px 14px',
        background: '#fafbfc',
        marginTop: '10px',
    },
    totalesGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
    },
    totalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '9.5pt',
        padding: '2px 0',
    },
    totalLabel: {
        fontWeight: '600',
        color: '#555',
    },
    totalValue: {
        fontWeight: '700',
        color: '#222',
        fontSize: '10.5pt',
    },
    totalValueSeña: {
        fontWeight: '700',
        color: '#222',
        fontSize: '10.5pt',
    },
    totalRowFinal: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '10.5pt',
        padding: '5px 0 2px 0',
        borderTop: '1px solid #ccc',
        marginTop: '3px',
    },
    totalLabelFinal: {
        fontWeight: '800',
        color: '#222',
        fontSize: '11.5pt',
    },
    totalValueFinal: {
        fontWeight: '800',
        color: '#222',
        fontSize: '12.5pt',
    },

    aviso: {
        marginTop: '8px',
        padding: '7px 10px',
        fontSize: '8.5pt',
        color: '#555',
        background: '#fdf6ec',
        border: '1px dashed #e0c97a',
        borderRadius: '4px',
        lineHeight: 1.4,
    },
    avisoLabel: {
        fontWeight: '700',
    },

    footerCliente: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '10px',
        paddingTop: '8px',
        borderTop: '2px solid #007bff',
        background: '#f0f7ff',
        padding: '8px 12px',
        borderRadius: '4px',
    },
    thanks: {
        fontWeight: '900',
        fontSize: '11pt',
        color: '#007bff',
        margin: 0,
        letterSpacing: '0.02em',
    },
    small: {
        fontSize: '9pt',
        color: '#444',
        margin: '3px 0 0 0',
        fontWeight: '600',
    },
    orderInfo: {
        textAlign: 'right',
        fontSize: '8.5pt',
        color: '#444',
        lineHeight: 1.4,
    },

    // Corte
    corte: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        background: 'repeating-linear-gradient(45deg, #fff9f0, #fff9f0 6px, #fff0d9 6px, #fff0d9 12px)',
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
        fontSize: '1rem',
        color: '#e0a800',
    },
    corteTxt: {
        fontSize: '0.65rem',
        fontWeight: '700',
        color: '#b38600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
    },

    // Ticket vendedor
    ticket: {
        maxWidth: '380px',
        margin: '0 auto',
        padding: '8px 14px',
        background: '#fff',
        border: '2px dashed #ffc107',
        borderRadius: '5px',
        fontSize: '9pt',
    },
    ticketHead: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '5px',
        borderBottom: '1.5px dashed #e0e0e0',
        marginBottom: '6px',
    },
    ticketLogoImg: {
        height: '26px',
        width: 'auto',
        objectFit: 'contain',
    },
    ticketLabel: {
        fontSize: '0.65rem',
        fontWeight: '800',
        color: '#b38600',
        textTransform: 'uppercase',
        background: '#fff8e1',
        padding: '2px 7px',
        borderRadius: '3px',
    },
    ticketBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    ticketField: {
        background: '#fafbfc',
        border: '1px solid #e8e8e8',
        borderRadius: '3px',
        padding: '4px 6px',
    },
    ticketLabel2: {
        fontSize: '7pt',
        fontWeight: '800',
        color: '#888',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '1px',
    },
    ticketValue2: {
        fontSize: '9pt',
        fontWeight: '700',
        color: '#222',
        lineHeight: 1.3,
    },
    ticketRow2: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '8.5pt',
        color: '#444',
    },
    ticketK2: {
        color: '#666',
        fontWeight: '600',
    },
    ticketV2: {
        color: '#0b2545',
        fontWeight: '700',
    },
    ticketSep: {
        height: 0,
        borderTop: '1.5px dashed #ccc',
        margin: '3px 0',
    },
    ticketTotales: {
        background: '#fafbfc',
        border: '1px solid #e8e8e8',
        borderRadius: '3px',
        padding: '5px 6px',
    },
    ticketTotalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '8.5pt',
        padding: '1px 0',
    },
    ticketTotalLabel: {
        color: '#666',
        fontWeight: '600',
    },
    ticketTotalValue: {
        color: '#222',
        fontWeight: '700',
    },
    ticketTotalValueSeña: {
        color: '#222',
        fontWeight: '700',
    },
    ticketTotalRowFinal: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '9.5pt',
        padding: '3px 0 1px 0',
        borderTop: '1px solid #ccc',
        marginTop: '2px',
    },
    ticketTotalLabelFinal: {
        color: '#222',
        fontWeight: '800',
    },
    ticketTotalValueFinal: {
        color: '#222',
        fontWeight: '800',
    },
    ticketFoot: {
        textAlign: 'center',
        fontSize: '7pt',
        color: '#aaa',
        marginTop: '4px',
        paddingTop: '4px',
        borderTop: '1px dashed #ccc',
    },
};

export default ComprobantePDF;
