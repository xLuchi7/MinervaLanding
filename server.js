'use strict';
// Sirve el sitio estático y expone POST /api/demo (solicitud de demo por mail).
// Credenciales SMTP: SÓLO por variables de entorno (Railway) o un .env local
// ignorado por git — nunca en el repo.
//   MAIL_RELAY_URL / MAIL_RELAY_TOKEN  PRODUCCIÓN: URL del Apps Script que envía los mails (ver email/relay-apps-script.gs)
//                y el secreto compartido. Railway bloquea SMTP saliente, por eso no se usa SMTP ahí.
//   SMTP_USER  cuenta de Gmail (recibe el aviso interno; en local también envía por SMTP)
//   SMTP_PASS  contraseña de aplicación de esa cuenta (sólo hace falta para SMTP directo, o sea local)
//   MAIL_TO    (opcional) destinatario de la notificación interna; default SMTP_USER
//   MAIL_DRY_RUN=1  no envía: arma los mails y los imprime en consola (para probar)

const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach(function (l) {
    var m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (e) { /* sin .env, se usan las variables del entorno */ }

const PORT = process.env.PORT || 3000;
const DRY = process.env.MAIL_DRY_RUN === '1';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.webp': 'image/webp'
};
// Sólo se sirve el sitio: nada de server.js, .env, email/, CLAUDE.md, etc.
const PAGES = {
  '/': 'index.html', '/index.html': 'index.html',
  '/styles.css': 'styles.css', '/script.js': 'script.js',
  '/Minerva Systems - landing.html': 'index.html' // link viejo (nombre historico del proyecto): muestra lo mismo
};
const ASSETS = path.join(__dirname, 'assets');

function serveFile(res, file, cache) {
  fs.readFile(file, function (err, buf) {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('No encontrado'); }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': cache
    });
    res.end(buf);
  });
}

// ---------- mail ----------
const TPL_CLIENTE = fs.readFileSync(path.join(__dirname, 'email', 'email-cliente.html'), 'utf8');
const TPL_INTERNO = fs.readFileSync(path.join(__dirname, 'email', 'email-interno.html'), 'utf8');

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function fill(tpl, d) {
  return tpl
    .replace(/{NOMBRE_URL}/g, encodeURIComponent(d.name))
    .replace(/{NOMBRE}/g, esc(d.name))
    .replace(/{EMAIL}/g, esc(d.email))
    .replace(/{MENSAJE}/g, esc(d.message).replace(/\r?\n/g, '<br>'));
}

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (DRY) transporter = nodemailer.createTransport({ jsonTransport: true });
  else if (process.env.SMTP_USER && process.env.SMTP_PASS)
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 587, secure: false, requireTLS: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  return transporter;
}

// Entrega un mail. Railway (planes sin SMTP saliente) da "Connection timeout" contra smtp.gmail.com,
// así que en producción se usa el RELAY: un POST por HTTPS a un Google Apps Script (email/relay-apps-script.gs)
// que manda el mail desde la misma cuenta de Gmail. Sin MAIL_RELAY_URL se usa SMTP directo (sirve en local).
async function deliver(m) {
  if (!DRY && process.env.MAIL_RELAY_URL) {
    const r = await fetch(process.env.MAIL_RELAY_URL, {
      method: 'POST', redirect: 'follow', signal: AbortSignal.timeout(25000),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        token: process.env.MAIL_RELAY_TOKEN || '', to: m.to, subject: m.subject, html: m.html,
        replyTo: m.replyTo ? m.replyTo.address : '', fromName: 'Minerva Systems'
      })
    });
    const txt = await r.text();
    let j;
    try { j = JSON.parse(txt); } catch (e) { throw new Error('el relay respondió algo inesperado (HTTP ' + r.status + ')'); }
    if (!j.ok) throw new Error('el relay rechazó el envío: ' + (j.error || 'sin detalle'));
    return null;
  }
  const t = getTransporter();
  if (!t) throw new Error('falta MAIL_RELAY_URL o SMTP_USER/SMTP_PASS');
  return t.sendMail({
    from: process.env.SMTP_USER || 'demo@localhost',
    to: m.toName ? { name: m.toName, address: m.to } : m.to,
    replyTo: m.replyTo, subject: m.subject, html: m.html
  });
}

async function sendDemo(d) {
  const to = process.env.MAIL_TO || process.env.SMTP_USER || (DRY ? 'demo@localhost' : '');
  if (!to) throw new Error('falta MAIL_TO o SMTP_USER (destinatario del aviso interno)');

  // primero el aviso interno: si la casilla del cliente rebota, el lead no se pierde
  const interno = await deliver({
    to: to, replyTo: { name: d.name, address: d.email },
    subject: 'Nueva solicitud de demo — ' + d.name, html: fill(TPL_INTERNO, d)
  });
  if (DRY && interno) console.log('[dry-run] interno →', to, '\n', interno.message);

  try {
    const cliente = await deliver({
      to: d.email, toName: d.name,
      subject: 'Solicitud de demo — ' + d.name, html: fill(TPL_CLIENTE, d)
    });
    if (DRY && cliente) console.log('[dry-run] cliente →', d.email, '\n', cliente.message);
  } catch (e) {
    console.error('No se pudo enviar la confirmación al cliente:', e.message);
  }
}

// ---------- /api/demo ----------
const hits = new Map(); // ip -> timestamps; evita que el formulario se use para spamear
function limited(ip) {
  const now = Date.now(), h = (hits.get(ip) || []).filter(function (t) { return now - t < 3600e3; });
  if (h.length >= 5) { hits.set(ip, h); return true; }
  h.push(now); hits.set(ip, h); return false;
}
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function handleDemo(req, res) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  let raw = '';
  req.on('data', function (c) { raw += c; if (raw.length > 10000) req.destroy(); });
  req.on('end', async function () {
    let b;
    try { b = JSON.parse(raw); } catch (e) { return json(res, 400, { success: false, error: 'Datos inválidos' }); }
    if (b.website) return json(res, 200, { success: true }); // honeypot: los bots lo completan
    const d = {
      name: String(b.name || '').trim(), email: String(b.email || '').trim(), message: String(b.message || '').trim()
    };
    if (!d.name || d.name.length > 120 || !d.message || d.message.length > 2000 ||
        d.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))
      return json(res, 400, { success: false, error: 'Revisá los datos ingresados' });
    if (limited(ip)) return json(res, 429, { success: false, error: 'Demasiados intentos, probá más tarde' });
    try {
      await sendDemo(d);
      json(res, 200, { success: true });
    } catch (e) {
      console.error('Error al enviar el mail:', e.message);
      json(res, 500, { success: false, error: 'Error al enviar el mail' });
    }
  });
}

http.createServer(function (req, res) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname); }
  catch (e) { res.writeHead(400); return res.end(); }

  if (pathname === '/api/demo') {
    if (req.method !== 'POST') { res.writeHead(405, { Allow: 'POST' }); return res.end(); }
    return handleDemo(req, res);
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  if (PAGES[pathname]) return serveFile(res, path.join(__dirname, PAGES[pathname]), 'no-cache');
  if (pathname.indexOf('/assets/') === 0) {
    const f = path.join(__dirname, pathname);
    if (f.indexOf(ASSETS + path.sep) === 0) return serveFile(res, f, 'public, max-age=86400');
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('No encontrado');
}).listen(PORT, function () {
  console.log('Minerva landing en http://localhost:' + PORT + (DRY ? '  (mail en modo dry-run)' : ''));
});
