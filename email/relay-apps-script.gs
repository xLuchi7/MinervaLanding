/**
 * RELAY DE MAILS para el formulario "Solicitar Demo" de Minerva Systems.
 *
 * Por qué existe: Railway bloquea el SMTP saliente (smtp.gmail.com da "Connection timeout"), así que el
 * servidor no puede mandar mails directo. En su lugar le hace un POST por HTTPS a este script, y el
 * script envía el mail desde la cuenta de Google con la que se despliega.
 *
 * CÓMO INSTALARLO (una sola vez, ~5 minutos), logueado en la cuenta de Gmail que envía (sessaregoluchi@gmail.com):
 *  1. Entrar a https://script.google.com -> "Nuevo proyecto".
 *  2. Borrar el código de ejemplo y pegar TODO este archivo.
 *  3. Cambiar TOKEN (abajo) por un texto largo y secreto (ej. 40 caracteres al azar). Guardarlo: va igual en Railway.
 *  4. "Implementar" -> "Nueva implementación" -> tipo "Aplicación web":
 *       - Ejecutar como: "Yo"
 *       - Quién tiene acceso: "Cualquier persona"
 *     Google pide autorizar el permiso de enviar correo: aceptar (Avanzado -> Ir a proyecto).
 *  4b. Copiar la "URL de la aplicación web" (termina en /exec).
 *  5. En Railway, Variables del servicio:
 *       MAIL_RELAY_URL   = la URL /exec del paso anterior
 *       MAIL_RELAY_TOKEN = el mismo TOKEN del paso 3
 *     (SMTP_USER queda: es el destinatario del aviso interno. SMTP_PASS ya no hace falta en producción.)
 *
 * Si se cambia el código del script hay que hacer "Implementar -> Administrar implementaciones -> Editar ->
 * Nueva versión"; si no, sigue corriendo la versión anterior.
 * Límite de Google para cuentas gratuitas: unos 100 destinatarios por día (sobra para un formulario de demos).
 */
var TOKEN = 'CAMBIAR-POR-UN-SECRETO-LARGO';

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (!d.token || d.token !== TOKEN) return out({ ok: false, error: 'token invalido' });
    if (!d.to || !d.subject || !d.html) return out({ ok: false, error: 'faltan datos' });
    MailApp.sendEmail({
      to: d.to,
      subject: d.subject,
      body: 'Este mensaje requiere un cliente de correo que muestre HTML.',
      htmlBody: d.html,
      name: d.fromName || 'Minerva Systems',
      replyTo: d.replyTo || ''
    });
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

// Abrir la URL /exec en el navegador debe mostrar esto: sirve para verificar que la implementación está viva.
function doGet() {
  return out({ ok: true, service: 'minerva-mail-relay' });
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
