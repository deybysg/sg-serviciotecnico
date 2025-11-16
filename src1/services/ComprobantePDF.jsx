import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Se asume que este componente estará en el mismo directorio que ServiciosAdmin.jsx

const ComprobantePDF = ({ service, TIPO_SERVICIO_OPTIONS, ESTADO_OPTIONS }) => {
    // Helpers para obtener labels
    const getTipoLabel = (value) => TIPO_SERVICIO_OPTIONS.find(o => o.value === value)?.label || value;
    const getEstadoLabel = (value) => ESTADO_OPTIONS.find(o => o.value === value)?.label || value;
    
    // Formateo de fechas
    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        // Usa T12:00:00 para evitar problemas de zona horaria al formatear solo la fecha
        const date = new Date(isoString.split('T')[0] + 'T12:00:00'); 
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div style={styles.comprobanteContainer}>
            <div style={styles.header}>
                <h1 style={styles.title}>Comprobante de Servicio Técnico</h1>
                <p style={styles.subtitle}>**[Nombre de tu Empresa Aquí]**</p>
            </div>

            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Datos del Servicio</h2>
                <div style={styles.grid}>
                    <p><strong>ID de Servicio:</strong> {service.id}</p>
                    <p><strong>Cliente:</strong> {service.clienteNombre}</p>
                    <p><strong>Marca / Modelo:</strong> {service.marcaProducto}</p>
                    <p><strong>Tipo de Equipo:</strong> {getTipoLabel(service.tipoServicio)}</p>
                    <p><strong>Fecha de Ingreso:</strong> {formatDate(service.fechaEntrada)}</p>
                    <p><strong>Estado Actual:</strong> {getEstadoLabel(service.estado)}</p>
                </div>
            </div>

            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Problema Reportado</h2>
                <p style={styles.details}>{service.detalles || 'No se registraron detalles.'}</p>
            </div>

            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Presupuesto (Detalle)</h2>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Descripción</th>
                            <th style={styles.thCosto}>Costo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {service.presupuesto.items.filter(item => item.descripcion || item.costo > 0).map((item, index) => (
                            <tr key={index}>
                                <td style={styles.td}>{item.descripcion || 'Servicio General'}</td>
                                <td style={styles.tdCosto}>${(item.costo || 0).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style={styles.tdTotalLabel}><strong>TOTAL ESTIMADO:</strong></td>
                            <td style={styles.tdTotalValue}><strong>${service.presupuesto.total.toFixed(2)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
                <p style={styles.note}>* Este es un presupuesto estimado, el costo final puede variar tras la revisión técnica.</p>
            </div>
            
            <div style={styles.footer}>
                <div style={styles.qrCode}>
                    <QRCodeSVG 
                        value={`http://192.168.1.22:5173/seguimiento/${service.id}`} 
                        size={80} 
                    />
                    <p style={styles.qrText}>Escanea para hacer seguimiento a tu servicio</p>
                </div>
                <div style={styles.signature}>
                    <p>_________________________</p>
                    <p>Firma del Cliente/Receptor</p>
                </div>
            </div>

        </div>
    );
};

// Estilos básicos en línea para asegurar la apariencia en la generación de PDF
const styles = {
    comprobanteContainer: {
        fontFamily: 'Arial, sans-serif',
        fontSize: '10pt',
        color: '#333',
        padding: '10mm',
        border: '1px solid #ccc',
        margin: '0 auto',
        boxSizing: 'border-box'
    },
    header: {
        textAlign: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #333',
        paddingBottom: '10px'
    },
    title: {
        fontSize: '16pt',
        margin: '0',
    },
    subtitle: {
        fontSize: '12pt',
        margin: '5px 0 0 0',
        fontWeight: 'bold'
    },
    section: {
        marginBottom: '20px',
    },
    sectionTitle: {
        fontSize: '12pt',
        borderBottom: '1px solid #eee',
        paddingBottom: '5px',
        marginBottom: '10px',
        color: '#555',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '5px',
    },
    details: {
        whiteSpace: 'pre-wrap',
        border: '1px dashed #ccc',
        padding: '10px',
        borderRadius: '5px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '10px',
    },
    th: {
        border: '1px solid #ccc',
        backgroundColor: '#f5f5f5',
        padding: '5px',
        textAlign: 'left',
        fontSize: '9pt',
    },
    thCosto: {
        border: '1px solid #ccc',
        backgroundColor: '#f5f5f5',
        padding: '5px',
        textAlign: 'right',
        width: '80px',
        fontSize: '9pt',
    },
    td: {
        border: '1px solid #eee',
        padding: '5px',
        fontSize: '10pt',
    },
    tdCosto: {
        border: '1px solid #eee',
        padding: '5px',
        textAlign: 'right',
        fontSize: '10pt',
    },
    tdTotalLabel: {
        borderTop: '2px solid #333',
        padding: '5px',
        textAlign: 'right',
        fontSize: '10pt',
    },
    tdTotalValue: {
        borderTop: '2px solid #333',
        padding: '5px',
        textAlign: 'right',
        backgroundColor: '#f0f0f0',
        fontSize: '11pt',
    },
    note: {
        fontSize: '8pt',
        marginTop: '10px',
        color: '#888',
    },
    footer: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: '40px',
        borderTop: '1px solid #ccc',
        paddingTop: '20px',
    },
    qrCode: {
        textAlign: 'center',
    },
    qrText: {
        fontSize: '8pt',
        marginTop: '5px',
    },
    signature: {
        textAlign: 'center',
    }
};

export default ComprobantePDF;