// backend/src/controllers_pg/mercadopago.controllers.js

import { MercadoPagoConfig, Preference } from 'mercadopago';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { sendEmail } from '../helpers/emailHelper.js';
import { getPool } from '../database/postgres.js';

// Configurar Mercado Pago con tu Access Token
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN 
});

export const createPreference = async (req, res) => {
    try {
        if (!process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN.trim() === '') {
            console.error('[MercadoPago] Access Token no configurado');
            return res.status(500).json({ error: 'Access Token de Mercado Pago no configurado. Agrega MERCADOPAGO_ACCESS_TOKEN en el .env.' });
        }

        const { items, email, userId, username } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No hay items en el carrito' });
        }

        if (!email) {
            return res.status(400).json({ error: 'Email es requerido' });
        }

        if (!process.env.FRONTEND_URL) {
            console.error('[MercadoPago] FRONTEND_URL no configurado en .env');
            return res.status(500).json({ error: 'Configuración de URLs incompleta' });
        }

        const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

        const mpItems = items.map(item => ({
            title: item.nombre,
            quantity: item.cantidad,
            unit_price: parseFloat(item.precio),
            currency_id: 'ARS'
        }));

        const preference = new Preference(client);
        
        const frontendUrl = (process.env.FRONTEND_URL || '').trim();
        const backendUrl = (process.env.BACKEND_URL || '').trim();
        
        console.log('[MP] Creando preferencia con:', {
            items: mpItems.length,
            email,
            frontend: frontendUrl,
            backend: backendUrl
        });

        const result = await preference.create({
            body: {
                items: mpItems,
                payer: { email },
                back_urls: {
                    success: `${frontendUrl}/pago-exitoso`,
                    failure: `${frontendUrl}/pago-fallido`,
                    pending: `${frontendUrl}/pago-pendiente`
                },
                notification_url: `${backendUrl}/api/mercadopago/webhook`,
                metadata: {
                    userId,
                    username,
                    email,
                    items: JSON.stringify(items)
                }
            }
        });

        res.json({
            preferenceId: result.id,
            initPoint: result.init_point
        });

    } catch (error) {
        console.error('Error creando preferencia:', error?.message || error);
        const msg = error?.message || 'Error al crear preferencia de pago';
        res.status(500).json({ error: msg });
    }
};

export const createQR = async (req, res) => {
    try {
        if (!process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN.trim() === '') {
            return res.status(500).json({ error: 'Access Token de Mercado Pago no configurado' });
        }

        const { items, email, userId, username } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No hay items en el carrito' });
        }

        if (!email) {
            return res.status(400).json({ error: 'Email es requerido' });
        }

        const frontendUrl = (process.env.FRONTEND_URL || '').trim();
        const backendUrl = (process.env.BACKEND_URL || '').trim();

        const mpItems = items.map(item => ({
            title: item.nombre,
            quantity: item.cantidad,
            unit_price: parseFloat(item.precio),
            currency_id: 'ARS'
        }));

        const preference = new Preference(client);

        const result = await preference.create({
            body: {
                items: mpItems,
                payer: { email },
                back_urls: {
                    success: `${frontendUrl}/pago-exitoso`,
                    failure: `${frontendUrl}/pago-fallido`,
                    pending: `${frontendUrl}/pago-pendiente`
                },
                notification_url: `${backendUrl}/api/mercadopago/webhook`,
                metadata: {
                    userId,
                    username,
                    email,
                    items: JSON.stringify(items)
                }
            }
        });

        const qrImage = await QRCode.toDataURL(result.init_point, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
        });

        res.json({
            preferenceId: result.id,
            qrCode: qrImage,
            initPoint: result.init_point
        });

    } catch (error) {
        console.error('Error creando QR:', error?.message || error);
        res.status(500).json({ error: error?.message || 'Error al crear código QR' });
    }
};

export const webhook = async (req, res) => {
    try {
        const { type, data } = req.body;

        if (type === 'payment') {
            const paymentId = data.id;
            
            const payment = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
                }
            }).then(r => r.json());

            if (payment.status === 'approved') {
                const metadata = payment.metadata;
                const items = JSON.parse(metadata.items);
                const pool = getPool();

                const productosComprados = items.map(item => ({
                    productId: item._id || item.id,
                    nombre: item.nombre,
                    precioUnitario: item.precio,
                    categoria: item.categoria,
                    cantidad: item.cantidad,
                    subtotal: item.precio * item.cantidad,
                    imagen: item.imagen || ""
                }));

                const { rows } = await pool.query(
                    `INSERT INTO ventas (username, fecha_compra, total_venta, metodo_pago, estado, productos_comprados)
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [metadata.username, new Date(), payment.transaction_amount, 'Mercado Pago', 'Completado', JSON.stringify(productosComprados)]
                );
                const nuevaVenta = rows[0];
                nuevaVenta.productosComprados = productosComprados;

                for (const item of items) {
                    await pool.query(
                        'UPDATE productos SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                        [item.cantidad, item._id || item.id]
                    );
                }

                await enviarComprobante(metadata.email, nuevaVenta, items);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error en webhook:', error);
        res.status(500).send('Error');
    }
};

const enviarComprobante = async (email, venta, items) => {
    try {
        const pdfBuffer = await crearComprobantePDF(venta, items);

        await sendEmail({
            to: email,
            subject: `Comprobante de compra #${venta.id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0ea5e9;">¡Gracias por tu compra!</h2>
                    <p>Hola <strong>${venta.username}</strong>,</p>
                    <p>Tu pago ha sido procesado exitosamente.</p>
                    
                    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Resumen de tu compra</h3>
                        <p><strong>Número de orden:</strong> #${venta.id}</p>
                        <p><strong>Fecha:</strong> ${new Date(venta.fecha_compra).toLocaleDateString('es-AR')}</p>
                        <p><strong>Total:</strong> $${venta.total_venta.toFixed(2)}</p>
                        <p><strong>Método de pago:</strong> ${venta.metodo_pago}</p>
                    </div>

                    <div style="background: #fff9f0; padding: 15px; border-left: 4px solid #fbbf24; margin: 20px 0;">
                        <p style="margin: 0;"><strong>🏪 Retiro en local</strong></p>
                        <p style="margin: 5px 0 0 0; font-size: 14px;">
                            Tu pedido estará listo para retirar en nuestro local en las próximas 24-48 horas.
                        </p>
                    </div>

                    <p>Adjuntamos el comprobante de tu compra en formato PDF.</p>
                    
                    <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
                        Si tienes alguna consulta, no dudes en contactarnos.
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename: `comprobante-${venta.id}.pdf`,
                    content: pdfBuffer,
                    type: 'application/pdf'
                }
            ]
        });

        console.log('Email enviado a:', email);
    } catch (error) {
        console.error('Error enviando email:', error);
    }
};

const crearComprobantePDF = (venta, items) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(20).text(process.env.STORE_NAME || 'Tu Tienda', { align: 'center' });
        doc.fontSize(10).text('Comprobante de Compra', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Número de orden: #${venta.id}`);
        doc.text(`Cliente: ${venta.username}`);
        doc.text(`Fecha: ${new Date(venta.fecha_compra).toLocaleDateString('es-AR')}`);
        doc.text(`Método de pago: ${venta.metodo_pago}`);
        doc.moveDown();

        doc.fontSize(14).text('Productos:', { underline: true });
        doc.moveDown(0.5);

        items.forEach((item, index) => {
            doc.fontSize(10);
            doc.text(`${index + 1}. ${item.nombre}`);
            doc.text(`   Cantidad: ${item.cantidad} x $${item.precio.toFixed(2)} = $${(item.cantidad * item.precio).toFixed(2)}`);
            doc.moveDown(0.3);
        });

        doc.moveDown();
        doc.fontSize(14).text(`Total: $${venta.total_venta.toFixed(2)}`, { align: 'right' });

        doc.moveDown(2);
        doc.fontSize(10).fillColor('#92400e');
        doc.text('🏪 RETIRO EN LOCAL', { align: 'center' });
        doc.fontSize(9).fillColor('#000');
        doc.text('Tu pedido estará listo para retirar en 24-48 horas.', { align: 'center' });

        doc.end();
    });
};
