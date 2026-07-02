import 'dotenv/config';

const WHATSAPP_API_URL = `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

export const sendWhatsAppMessage = async (to, message) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!token) {
    console.warn('WHATSAPP_ACCESS_TOKEN no configurado');
    return { success: false, error: 'Token no configurado' };
  }

  if (!to || !message) {
    console.warn('Número o mensaje faltante para WhatsApp');
    return { success: false, error: 'Datos faltantes' };
  }

  const cleanPhone = to.replace(/\D/g, '');

  const payload = {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'text',
    text: {
      preview_url: false,
      body: message
    }
  };

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', data);
      return { success: false, error: data };
    }

    console.log('WhatsApp enviado exitosamente:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    return { success: false, error: error.message };
  }
};

export const sendWhatsAppTemplate = async (to, templateName, languageCode = 'es') => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!token) {
    console.warn('WHATSAPP_ACCESS_TOKEN no configurado');
    return { success: false, error: 'Token no configurado' };
  }

  const cleanPhone = to.replace(/\D/g, '');

  const payload = {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode }
    }
  };

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('WhatsApp template error:', data);
      return { success: false, error: data };
    }

    console.log('WhatsApp template enviado:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error enviando WhatsApp template:', error);
    return { success: false, error: error.message };
  }
};

export const MENSAJES_ESTADO = {
  pendiente: '🎉 ¡Tu equipo ha sido recibido! Estamos preparándolo para el servicio. Te informaremos sobre el progreso.',
  enRevision: '🔍 Tu equipo está siendo revisado por nuestros técnicos. Te mantendremos informado.',
  diagnostico: '📋 Ya tenemos el diagnóstico. Por favor consulta el presupuesto en nuestra página.',
  notificacion: '⚠️ Hay una notificación importante sobre tu equipo. Por favor comunícate con nosotros.',
  reparacion: '🔧 ¡Buenas noticias! Tu equipo está en reparación. Pronto estará listo.',
  terminado: '✅ ¡Tu equipo está listo para ser retirado! Pass por nuestro local para buscarlo.',
  entregado: '🙏 Gracias por confiar en nosotros. Tu equipo ha sido entregado exitosamente. ¡Hasta pronto!'
};
