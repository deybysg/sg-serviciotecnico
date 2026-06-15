// backend/src/controllers/mercadopago.controllers.js

import { MercadoPagoConfig, Preference } from 'mercadopago';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import Venta from '../models/ventasSchema.js';
import Producto from '../models/productosSchema.js';

// Configurar Mercado Pago con tu Access Token
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN 
});

/**
 * Crear preferencia de pago en Mercado Pago
 */
export const createPreference = async (req, res) => {
    try {
        // Validar Access Token presente
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

        // Validar URLs configuradas
        if (!process.env.FRONTEND_URL) {
            console.error('[MercadoPago] FRONTEND_URL no configurado en .env');
            return res.status(500).json({ error: 'Configuración de URLs incompleta' });
        }

        // Calcular total
        const total = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

        // Crear items para Mercado Pago
        const mpItems = items.map(item => ({
            title: item.nombre,
            quantity: item.cantidad,
            unit_price: parseFloat(item.precio),
            currency_id: 'ARS' // Cambiar según tu país
        }));

        // Crear preferencia
        const preference = new Preference(client);
        
        console.log('[MP] Creando preferencia con:', {
            items: mpItems.length,
            email,
            frontend: process.env.FRONTEND_URL,
            backend: process.env.BACKEND_URL
        });
        
        const result = await preference.create({
            body: {
                items: mpItems,
                payer: {
                    email: email
                },
                back_urls: {
                    success: `${process.env.FRONTEND_URL}/pago-exitoso`,
                    failure: `${process.env.FRONTEND_URL}/pago-fallido`,
                    pending: `${process.env.FRONTEND_URL}/pago-pendiente`
                },
                notification_url: `${process.env.BACKEND_URL}/api/mercadopago/webhook`,
                metadata: {
                    userId: userId,
                    username: username,
                    email: email,
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
        console.error('Error completo:', JSON.stringify(error, null, 2));
        // Pasar mensaje más detallado si viene de la API de MP
        const msg = error?.message || 'Error al crear preferencia de pago';
        res.status(500).json({ error: msg });
    }
};

/**
 * Webhook para recibir notificaciones de Mercado Pago
 */
export const webhook = async (req, res) => {
    try {
        const { type, data } = req.body;

        // Mercado Pago envía notificaciones de tipo "payment"
        if (type === 'payment') {
            const paymentId = data.id;
            
            // Obtener información del pago
            const payment = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: {
                    'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
                }
            }).then(r => r.json());

            // Si el pago fue aprobado
            if (payment.status === 'approved') {
                const metadata = payment.metadata;
                const items = JSON.parse(metadata.items);

                // 1. Crear la venta en la base de datos
                const nuevaVenta = new Venta({
                    username: metadata.username,
                    fechaCompra: new Date(),
                    totalVenta: payment.transaction_amount,
                    metodoPago: 'Mercado Pago',
                    estado: 'Completado',
                    productosComprados: items.map(item => ({
                        productId: item._id || item.id,
                        nombre: item.nombre,
                        precioUnitario: item.precio,
                        categoria: item.categoria,
                        cantidad: item.cantidad,
                        subtotal: item.precio * item.cantidad
                    }))
                });

                await nuevaVenta.save();

                // 2. Actualizar stock de productos
                for (const item of items) {
                    await Producto.findByIdAndUpdate(
                        item._id || item.id,
                        { $inc: { stock: -item.cantidad } }
                    );
                }

                // 3. Enviar email con comprobante
                await enviarComprobante(metadata.email, nuevaVenta, items);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error en webhook:', error);
        res.status(500).send('Error');
    }
};

/**
 * Enviar email con comprobante de compra
 */
const enviarComprobante = async (email, venta, items) => {
    try {
        // Configurar transporter de nodemailer (usa tus credenciales)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // tu-email@gmail.com
                pass: process.env.EMAIL_PASSWORD // contraseña de aplicación
            }
        });

        // Crear PDF del comprobante
        const pdfBuffer = await crearComprobantePDF(venta, items);

        // Enviar email
        await transporter.sendMail({
            from: `"${process.env.STORE_NAME || 'Tu Tienda'}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Comprobante de compra #${venta._id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #0ea5e9;">¡Gracias por tu compra!</h2>
                    <p>Hola <strong>${venta.username}</strong>,</p>
                    <p>Tu pago ha sido procesado exitosamente.</p>
                    
                    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Resumen de tu compra</h3>
                        <p><strong>Número de orden:</strong> #${venta._id}</p>
                        <p><strong>Fecha:</strong> ${new Date(venta.fechaCompra).toLocaleDateString('es-AR')}</p>
                        <p><strong>Total:</strong> $${venta.totalVenta.toFixed(2)}</p>
                        <p><strong>Método de pago:</strong> ${venta.metodoPago}</p>
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
                    filename: `comprobante-${venta._id}.pdf`,
                    content: pdfBuffer
                }
            ]
        });

        console.log('Email enviado a:', email);
    } catch (error) {
        console.error('Error enviando email:', error);
    }
};

/**
 * Crear PDF del comprobante
 */
const crearComprobantePDF = (venta, items) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text(process.env.STORE_NAME || 'Tu Tienda', { align: 'center' });
        doc.fontSize(10).text('Comprobante de Compra', { align: 'center' });
        doc.moveDown();

        // Información de la compra
        doc.fontSize(12).text(`Número de orden: #${venta._id}`);
        doc.text(`Cliente: ${venta.username}`);
        doc.text(`Fecha: ${new Date(venta.fechaCompra).toLocaleDateString('es-AR')}`);
        doc.text(`Método de pago: ${venta.metodoPago}`);
        doc.moveDown();

        // Tabla de productos
        doc.fontSize(14).text('Productos:', { underline: true });
        doc.moveDown(0.5);

        items.forEach((item, index) => {
            doc.fontSize(10);
            doc.text(`${index + 1}. ${item.nombre}`);
            doc.text(`   Cantidad: ${item.cantidad} x $${item.precio.toFixed(2)} = $${(item.cantidad * item.precio).toFixed(2)}`);
            doc.moveDown(0.3);
        });

        doc.moveDown();
        doc.fontSize(14).text(`Total: $${venta.totalVenta.toFixed(2)}`, { align: 'right' });

        // Nota de retiro
        doc.moveDown(2);
        doc.fontSize(10).fillColor('#92400e');
        doc.text('🏪 RETIRO EN LOCAL', { align: 'center' });
        doc.fontSize(9).fillColor('#000');
        doc.text('Tu pedido estará listo para retirar en 24-48 horas.', { align: 'center' });

        doc.end();
    });
};
