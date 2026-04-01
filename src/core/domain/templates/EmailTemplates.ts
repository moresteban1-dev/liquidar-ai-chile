export const EmailTemplates = {
  orderUpdate: (orderId: string, status: string, clientName: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #333;">Actualización de tu pedido</h2>
      <p>Hola <strong>${clientName}</strong>,</p>
      <p>Te informamos que tu pedido <strong>#${orderId.slice(0, 8)}</strong> ha cambiado su estado a:</p>
      <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; font-size: 1.2em; text-align: center; margin: 20px 0;">
        <strong>${status.toUpperCase()}</strong>
      </div>
      <p>Puedes ver más detalles en tu panel de cliente.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 0.8em; color: #888;">Este es un mensaje automático, por favor no respondas a este correo.</p>
    </div>
  `,

  orderCreated: (orderId: string, total: number, clientName: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #333;">Confirmación de pedido</h2>
      <p>Hola <strong>${clientName}</strong>,</p>
      <p>Gracias por tu confianza. Tu pedido <strong>#${orderId.slice(0, 8)}</strong> ha sido creado exitosamente.</p>
      <p>Monto total: <strong>$${total.toLocaleString()}</strong></p>
      <p>Estamos procesando tu solicitud y te avisaremos cuando haya actualizaciones.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 0.8em; color: #888;">© Dropservice Platform</p>
    </div>
  `
}
