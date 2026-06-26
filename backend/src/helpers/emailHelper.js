import sgMail from '@sendgrid/mail';
import 'dotenv/config';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendResetEmail = async (to, token, username) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${token}&username=${encodeURIComponent(username)}`;

  const text = [
    `Se solicitó restablecer la contraseña para ${username}.`,
    `Enlace (válido por 1 hora): ${resetUrl}`,
    `Si no solicitaste este cambio, ignorá este correo.`
  ].join('\n\n');

  const html = `<!DOCTYPE html>
  <html lang="es">
    <body style="margin:0;padding:0;background:#f4f6f8;font-family:Segoe UI,Roboto,Arial,sans-serif;color:#1f2937;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding:32px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
              <tr>
                <td style="padding:28px 28px 0 28px;">
                  <h1 style="margin:0 0 8px;font-size:22px;color:#111827;">Restablecer contraseña</h1>
                  <p style="margin:0 0 16px;color:#4b5563;line-height:1.5;">
                    Hola, recibimos una solicitud para restablecer la contraseña de tu cuenta <strong>${username}</strong>.
                  </p>
                  <p style="margin:0 0 24px;color:#6b7280;line-height:1.5;">
                    Este enlace es válido por 1 hora. Si no solicitaste este cambio, ignorá este correo.
                  </p>
                  <div style="text-align:center;margin:24px 0 12px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
                      Restablecer contraseña
                    </a>
                  </div>
                  <p style="margin:16px 0 0;color:#6b7280;font-size:12px;">
                    Si el botón no funciona, copiá y pegá este enlace en tu navegador:
                  </p>
                  <p style="word-break:break-all;font-size:12px;color:#374151;margin:6px 0 0;">
                    <a href="${resetUrl}" style="color:#2563EB;text-decoration:underline;">${resetUrl}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 28px 28px 28px;color:#9ca3af;font-size:12px;border-top:1px solid #f3f4f6;">
                  Sistema SG • No respondas a este mensaje
                </td>
              </tr>
            </table>
            <p style="color:#9ca3af;font-size:11px;margin:14px 0 0;">© 2025 Sistema SG</p>
          </td>
        </tr>
      </table>
    </body>
  </html>`;

  const msg = {
    from: process.env.SMTP_FROM || 'Sistema SG <no-reply@example.com>',
    to,
    subject: 'Solicitud de restablecimiento de contraseña',
    text,
    html
  };

  try {
    const info = await sgMail.send(msg);
    return info;
  } catch (error) {
    console.error('SendGrid error:', error.response?.body || error.message);
    throw error;
  }
};
