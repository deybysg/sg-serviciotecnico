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
        // Usa T12:00:00 para evitar problemas de zona horaria al formatear solo la fecha
        const date = new Date(isoString.split('T')[0] + 'T12:00:00'); 
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // --- Lógica del Presupuesto ---
    const presupuestoCero = service.presupuesto.total === 0 && service.presupuesto.items.every(item => (item.costo === 0 || !item.descripcion));
    const itemsPresupuesto = service.presupuesto.items.filter(item => item.descripcion || item.costo > 0);
    
    // Si el presupuesto es cero, crea filas vacías para completar a mano (3 líneas por defecto)
    const filasVacias = presupuestoCero ? Array(3).fill({ descripcion: '_________________________', costo: 0 }) : [];
    const filasAMostrar = presupuestoCero ? filasVacias : itemsPresupuesto;

    const servicioNumero = service.servicioNumero || 'N/A';

    return (
        <div style={styles.comprobanteContainer}>
            
            {/* Cabecera y QR - Reordenado */}
            <div style={styles.header}>
                <p style={styles.qrText}>Escanea para seguimiento</p>
                <div style={styles.qrCode}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <QRCodeSVG 
                            value={`http://192.168.1.22:5173/seguimiento/${servicioNumero}`} 
                            size={85} 
                            level="H"
                            bgColor="#ffffff"
                            fgColor="#000000"
                        />
                        <img 
                            src="/img/logo2.png"
                            alt="Logo"
                            style={{
                                position: 'absolute',
                                top: '50%',
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
                <div style={styles.headerInfo}>
                    <h1 style={styles.title}>COMPROBANTE DE SERVICIO TÉCNICO</h1>
                    <p style={styles.subtitle}>SG SERVICIO TECNICO</p>
                    <p style={styles.headerDetail}>N° de Orden: <span style={styles.highlight}>{servicioNumero}</span> | <strong>Fecha Ingreso:</strong> <span style={styles.highlight}>{formatDate(service.fechaEntrada)}</span></p>
                </div>
            </div>

            <div style={styles.separator} />

            {/* Sección de Datos del Cliente y Equipo */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>DATOS DEL SERVICIO Y CLIENTE</h2>
                <div style={styles.grid}>
                    <p style={styles.gridItem}><strong>Cliente:</strong> {service.clienteNombre}</p>
                    <p style={styles.gridItem}><strong>Contacto:</strong> {service.clienteTelefono || 'N/A'}</p>
                    <p style={styles.gridItem}><strong>Equipo (Marca/Mod):</strong> {service.marcaProducto}</p>
                    <p style={styles.gridItem}><strong>Tipo de Equipo:</strong> {getTipoLabel(service.tipoServicio)}</p>
                    <p style={styles.gridItem}><strong>Estado Actual:</strong> <span style={styles.statusBadge(service.estado)}>{getEstadoLabel(service.estado)}</span></p>
                    <p style={styles.gridItem}><strong>Nro. Serie:</strong> {service.serial || 'N/A'}</p>
                </div>
            </div>

            <div style={styles.separatorThin} />

            {/* Problema Reportado */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>PROBLEMA REPORTADO POR EL CLIENTE</h2>
                <p style={styles.details}>{service.detalles || 'No se registraron detalles. (Revisión Pendiente)'}</p>
            </div>

            <div style={styles.separatorThin} />

            {/* Sección de Presupuesto */}
            <div style={styles.section}>
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
                                    {presupuestoCero ? '' : `$${(item.costo || 0).toFixed(2)}`}
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
                                {presupuestoCero ? '___________' : `$${service.presupuesto.total.toFixed(2)}`}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                <p style={styles.note}>
                    {presupuestoCero 
                        ? '_____________________________________________________________________' // Línea para escribir
                        : '* Este es un presupuesto estimado, el costo final puede variar tras la revisión técnica o aprobación del cliente.'
                    }
                </p>
            </div>
            
            <div style={styles.separator} />

            {/* Pie de Página */}
            <div style={styles.footer}>
                <div style={styles.signature}>
                    <p style={styles.signatureLine}>_________________________</p>
                    <p style={styles.signatureText}>Firma del Cliente/Receptor</p>
                    {/* <p style={styles.qrText}>Escanea para seguimiento: {`tu-web.com/seguimiento/${service.id}`}</p> */}
                </div>
                <div style={styles.companyContact}>
                    <p>¡Gracias por tu confianza!</p>
                    <p>Dirección, Teléfono, Email.</p>
                </div>
            </div>

        </div>
    );
};

// --- Estilos Mejorados y Modernos ---
const styles = {
    // Colores: Primario (#007bff o un tono más oscuro), Fondo (#f8f9fa), Texto (#343a40), Bordes (#dee2e6)
    
    comprobanteContainer: {
        fontFamily: 'Roboto, Arial, sans-serif',
        fontSize: '10pt',
        color: '#343a40', // Gris oscuro para texto
        padding: '15mm', // Más espacio alrededor
        border: '1px solid #adb5bd', // Borde suave
        backgroundColor: '#ffffff',
        margin: '0 auto',
        boxSizing: 'border-box'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        paddingBottom: '10px'
    },
    qrCode: {
        // Estilo específico para mover el QR
        marginRight: '20px',
        padding: '5px',
        border: '1px solid #dee2e6',
    },
    headerInfo: {
        flexGrow: 1,
        textAlign: 'right',
    },
    title: {
        fontSize: '18pt',
        margin: '0',
        color: '#007bff', // Color primario
        fontWeight: '900',
    },
    subtitle: {
        fontSize: '11pt',
        margin: '2px 0 0 0',
        fontWeight: 'bold'
    },
    headerDetail: {
        fontSize: '9pt',
        marginTop: '5px',
    },
    highlight: {
        fontWeight: 'bold',
        color: '#495057',
    },
    separator: {
        height: '1px',
        backgroundColor: '#007bff',
        margin: '10px 0 20px 0',
    },
    separatorThin: {
        height: '1px',
        backgroundColor: '#dee2e6',
        margin: '5px 0 15px 0',
    },
    section: {
        marginBottom: '15px',
    },
    sectionTitle: {
        fontSize: '11pt',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#495057',
        borderBottom: '2px solid #ced4da',
        paddingBottom: '3px',
        marginBottom: '10px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px 20px', // Espacio vertical y horizontal
    },
    gridItem: {
        margin: 0,
    },
    statusBadge: (estado) => ({
        padding: '2px 5px',
        borderRadius: '3px',
        fontWeight: 'bold',
        color: '#ffffff',
        backgroundColor: estado === 'ENTREGADO' ? '#28a745' : estado === 'REVISIÓN' ? '#ffc107' : '#007bff', // Colores condicionales
    }),
    details: {
        whiteSpace: 'pre-wrap',
        border: '1px solid #ced4da',
        backgroundColor: '#f8f9fa', // Fondo claro
        padding: '10px',
        borderRadius: '4px',
        lineHeight: '1.4',
        minHeight: '40px', // Para que se vea bien si no hay detalles
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '10px',
    },
    th: {
        border: '1px solid #adb5bd',
        backgroundColor: '#e9ecef', // Fondo para encabezados de tabla
        color: '#343a40',
        padding: '7px',
        textAlign: 'left',
        fontSize: '9.5pt',
        textTransform: 'uppercase',
    },
    thCosto: {
        border: '1px solid #adb5bd',
        backgroundColor: '#e9ecef',
        color: '#343a40',
        padding: '7px',
        textAlign: 'right',
        width: '15%',
        fontSize: '9.5pt',
        textTransform: 'uppercase',
    },
    td: {
        border: '1px solid #f8f9fa', // Borde muy sutil
        borderBottom: '1px solid #e9ecef', // Separador de fila
        padding: '7px',
        fontSize: '10pt',
    },
    tdCosto: {
        border: '1px solid #f8f9fa',
        borderBottom: '1px solid #e9ecef',
        padding: '7px',
        textAlign: 'right',
        fontSize: '10pt',
    },
    tdTotalLabel: {
        borderTop: '2px solid #495057',
        padding: '7px',
        textAlign: 'right',
        fontSize: '10pt',
        fontWeight: 'bold',
        backgroundColor: '#f8f9fa',
    },
    tdTotalValue: {
        borderTop: '2px solid #495057',
        padding: '7px',
        textAlign: 'right',
        backgroundColor: '#e9ecef',
        fontSize: '11pt',
        fontWeight: 'bold',
        color: '#007bff',
    },
    note: {
        fontSize: '8pt',
        marginTop: '10px',
        color: '#6c757d',
    },
    footer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: '30px',
        paddingTop: '15px',
    },
    signature: {
        textAlign: 'left',
        width: '50%',
        fontSize: '9pt',
        color: '#6c757d',
    },
    signatureLine: {
        margin: '0',
        borderBottom: '1px dashed #6c757d',
        marginBottom: '5px',
        paddingTop: '15px',
        textAlign: 'center',
    },
    signatureText: {
        margin: '0',
        fontSize: '8pt',
        textAlign: 'center',
    },
    qrText: {
        fontSize: '14pt',
        marginTop: '15px',
        textAlign: 'left',
        color: '#007bff',
    },
    companyContact: {
        textAlign: 'right',
        width: '50%',
        fontSize: '9pt',
        color: '#6c757d',
    }
};

export default ComprobantePDF;