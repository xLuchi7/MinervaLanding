# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Que es esto

Landing page de **Minerva Systems** — el sistema de gestion para **representadoras**. Sitio
**estatico, editable a mano**: sin framework, sin paso de build. Unica dependencia de runtime: nodemailer (para el modal de demo). La
unica dependencia externa son las fuentes de Google Fonts (Bricolage Grotesque + Instrument Sans).

- `index.html` — markup. **Este es el archivo que se edita** (junto con los dos de abajo).
- `styles.css` — todo el CSS.
- `script.js` — todo el JS (un unico IIFE con secciones comentadas: reveals, nav/scroll, FAQ,
  lightbox, canvas de fondo, galeria, tilt de cards).
- `assets/` — imagenes referenciadas por el HTML:
  - `minerva-logo.jpg` — logo (nav, hero, banner OG). 640x640, recortado a mano para que el anillo
    dorado del diseño quede exactamente al borde del cuadrado (la fuente original tenia relleno
    navy asimetrico alrededor, por eso el `border-radius:50%` en CSS se veia descentrado con un
    borde azul afuera del dorado).
  - `favicons/` — set completo (favicon.ico, 16/32px, apple-touch-icon 180px, android-chrome
    192/512px, `site.webmanifest`) linkeado desde el `<head>`. Viene del mismo proyecto de origen
    (`GestionSoftware_Web`), no generado por IA — es el icono "solo owl" sin anillo ni texto, mejor
    para tamaños chicos.
  - `og-banner.jpg` — banner 1200x630 para previews de WhatsApp/LinkedIn (`og:image`). **La URL de `og:image`/`twitter:image` tiene que ser ABSOLUTA** (`https://www.minervasystemsar.com/assets/og-banner.jpg`): WhatsApp/LinkedIn/Facebook no resuelven rutas relativas. Si cambia el dominio, actualizar tambien `og:url` y `canonical` en el `<head>`. Las plataformas cachean la vista previa: para refrescarla usar el Post Inspector de LinkedIn o el depurador de Facebook. Generado
    programaticamente (Python/Pillow) replicando la identidad del sitio: logo + headline del hero +
    checks, sobre el mismo navy con glow dorado y grilla de puntos. El script que lo genera no se
    versiona; si hay que rehacerlo, es un canvas 1200x630 con el mismo logo + tipografia Bricolage
    Grotesque/Instrument Sans (variable fonts de Google Fonts, ejes weight/width) + un glow radial
    suave (ojo con la intensidad: sin cuidado se come el navy y queda todo oliva/dorado).
  - `team-patricio.jpg` y `team-luciano.jpg` — fotos del equipo en el cierre, recorte cuadrado de 480x480
    centrado en la cara (la de Patricio salio de un original de 1088x1446, recorte de 960x960 en x=85,y=84: el
    recorte anterior terminaba justo en el menton y se veia "cortado", ahora deja cuello y saco abajo; la de Luciano
    salio de un original de 1448x1086, recorte de 940x940 en x=375,y=20;
    los PNG originales de ~2 MB no se versionan). Juan Chueco sigue con el placeholder `.team__ph` (iniciales)
    hasta que haya foto. En la seccion de cierre las fotos miden `clamp(88px,9vw,112px)` con un halo dorado suave (antes 64px; pedido del cliente/jefe: agrandarlas).
  - `system/` — capturas reales del sistema para la galeria de `#cadena` (ver mas abajo). 8 archivos
    (5 `.jpg` y 3 `.png`: `gastos-mensuales`, `ventas-dashboard` y `comisiones-de-empresa`), entre 1905 y 2161 de
    ancho, todos ~16:9 (1.764–1.786 contra 1.778: con `object-fit:cover` el recorte de costados es
    imperceptible). OJO: `gastos-mensuales.png` todavia trae arriba al centro el boton redondo con una X de "salir de pantalla
    completa" de Chrome (el cartel "Esc" ya no) — conviene volver a sacar esa captura sin ese control. Vienen de una cuenta de prueba — si en algun momento hay que confirmar si
    los datos que se ven (nombres de clientes, vendedores, montos) son reales o de demo, preguntar
    antes de tocar el texto `vista__note` ("Capturas del sistema real, con datos de una cuenta de
    prueba" — es un supuesto mio, no confirmado).

Se edita `index.html`, `styles.css` y `script.js` a mano (no hay copia que regenerar: el archivo `Minerva Systems - landing.html` que existia por compatibilidad con el nombre historico se elimino; `server.js` igual responde `/Minerva Systems - landing.html` con `index.html`, por si queda algun link viejo).

> Nota historica: hasta 2026-09 el sitio era un bundle de ~2.8 MB exportado por una herramienta
> visual (loader que desempaquetaba assets embebidos en `DOMContentLoaded`). Se reemplazo por HTML
> escrito a mano — al principio con CSS/JS inline en un unico archivo (por venir de un bundle de
> una sola pieza), despues separado en `styles.css`/`script.js` porque ya no habia motivo para
> mantenerlo todo junto y separado es mas prolijo para trabajar. Sigue sin paso de build.

## Estructura del HTML

Markup en `index.html`, estilos en `styles.css`, comportamiento en `script.js`. Secciones del HTML,
en orden:

1. Nav fijo (`#nav`) — **pegado arriba de borde a borde** (`top:0`, ancho completo, sin bordes redondeados; antes era una pastilla flotante y el jefe pidio que no lo fuera). **Siempre visible** (entra con animacion al cargar). Sobre el hero es mas transparente y alto (76px, 68px en mobile); al bajar de 40px de scroll pasa a `.scrolled`: mas compacto (66px, 60px en mobile) y solido. **Todo el texto del header va en MAYUSCULAS** (links y "Hablemos": display, 12-12.5px, `letter-spacing` .15em, `text-transform:uppercase`; el logo ya lo estaba). Como en mayusculas ocupan mas, el paso a **iconos** ocurre en <=1024px (antes 880). El fondo pasa de transparente a solido animando `--navbg` (registrada con `@property`). El contenido se alinea con el ancho de pagina via `padding-inline:max(16px, (100% - var(--wrap))/2 + 20px)`. Los links marcan la seccion activa (`.is-active`, subrayado dorado) via `spy` en `render()` de script.js. **Una sola capa**: la linea dorada de abajo (`border-bottom:1.5px`), con un **dibujo fino y chico** (enredadera ondulada con hojitas y rombos, tile SVG de 88x10px en data-URI, `repeat-x`, en `.nav__inner::after`) que la recorre de punta a punta — el jefe pidio menos capas y un dibujo mas fino, no las esquinas grandes (se sacaron los `.nav__orn`, el symbol `#navCorner`, la linea interior, la luz orbital, la sombra y la piecita colgante). Los `<symbol>` `#roseCorner`/`#roseCrown` (solo de la galeria) viven en un `<svg class="vista__defs">` global al inicio del `<body>`. **"Hablemos" lleva a `#contacto`** (la seccion de cierre), ya no a WhatsApp. En mobile/tablet (<=1024px) los links pasan a **iconos** (`.nav__ico`, SVG inline; el texto queda en `aria-label`/`title`), la seccion activa se marca en dorado con un punto, y siguen navegando a las secciones.
2. Hero (`#top`) — canvas de particulas conectadas (constelacion) + parallax de puntero, logo
   flotante, badge, CTAs a WhatsApp. En mobile (<=880px) **no se muestra "Coordinar una reunión"** (`.hero__actions .btn--gold`), queda solo "Ver el sistema"; tampoco existe mas la barra fija inferior de mobile (`.sticky-cta` se elimino: el CTA en mobile es "Hablemos" del header).
3. Franja de pilares (no es `.section`, altura de contenido).
4. "El problema" — comparativa *Con planillas / Con Minerva* + orbs de fondo. Cada fila (`.cmp__row`) es un par de tarjetas — izquierda "papel" con borde punteado y cruz, derecha navy con check dorado — unidas por un conector (`.cmp__arrow`: circulo con flecha por mascara SVG, linea dorada detras, la flecha "empuja" y late en loop). El hover reacciona a la FILA entera (la izquierda se corre y se apaga, la derecha sube con brillo dorado y destello, el conector se rellena de oro). Entrada escalonada con `.rv` + `--i` por fila. En mobile se apila y la flecha apunta hacia abajo.
5. `#cadena` — "Del pedido a la cobranza": 6 pasos + galeria de capturas del sistema (`.gallery`,
   ver mas abajo) + orbs.
6. `#sistema` — "Que incluye el sistema": 3 modulos (Comercial / Cobranzas / Administracion) +
   canvas de cometas.
7. `#implementacion` — planes (Sin costo / Un pago por mes) + orbs.
8. Testimonio + origen — glow de fondo (igual que el hero) + canvas de cometas.
9. `#preguntas` — FAQ acordeon (`<details>` con animacion de alto por JS, una sola abierta) + orbs.
10. Cierre — equipo + CTA a WhatsApp / mail + canvas de particulas.
11. Footer (`.foot`) — antes era una linea de texto; ahora tiene el borde superior con la misma enredadera fina del header (`--vine`, variable global en `:root` con el tile SVG; la usan `.nav__inner::after` y `.foot::before`), un resplandor dorado suave, tres columnas (marca con logo + descripcion + pill "Hecho adentro de una representadora" / "Explorar" con los links a las secciones / "Contacto" con WhatsApp `+54 9 11 5007-2651`, `info@minervasystemsar.com` y "Solicitar una demo") y una barra inferior con © (año actual por JS: `#year`) y "Volver arriba". Los links tienen una rayita dorada que crece en hover. "Solicitar una demo" del footer abre el mismo modal: cualquier elemento con `data-demo-open` lo abre (el boton del cierre y el del footer). En <=860px las columnas pasan a 2 y en <=520px a 1. No se inventaron direcciones ni redes sociales (no hay datos). OJO con el ancho: el resplandor `.foot::after` mide `min(900px,100%)` y `.foot` lleva `overflow-x:clip` — con `120%` se salia 38px por la derecha en mobile (la pagina "quedaba con espacio libre a la derecha"). Para detectar desbordes NO alcanza mirar `documentElement.scrollWidth` de un elemento: comparar `document.body.scrollWidth` contra `documentElement.clientWidth` (los pseudo-elementos `::before/::after` tampoco salen en `querySelectorAll`). Ademas: lightbox y modal de demo.

Convenciones:

- **Layout de 100vh por seccion**: `.section` (y el `.hero`) tienen `min-height:100vh` (con fallback
  `100svh`) y centran su contenido verticalmente con flexbox. Si el contenido de una seccion es mas
  alto que la pantalla, la seccion simplemente crece (es un minimo, no una altura fija) — por eso
  `#cadena` y `#sistema` terminan siendo mas altas que 100vh y no hay que "hacerlas entrar".
- **Botones**: un solo estilo de CTA primario, `.btn--gold` (fondo dorado, barrido de brillo continuo
  en loop — pausado bajo `prefers-reduced-motion`). Se usa en el nav ("Hablemos"), el hero
  ("Coordinar una reunión"), implementación ("Pedí el abono...") y el cierre ("Escribinos por
  WhatsApp"). `.btn--ghost-navy` es el unico secundario. No agregar variantes nuevas de botón sin
  necesidad — la unificación fue deliberada.
- **Galeria del sistema** (`#gallery` en `#cadena`): la foto ocupa todo el ancho disponible de
  `.vista` (hasta 1180px) — sin maqueta de laptop ni barra de navegador falsa, para que la captura
  se aprecie grande y nítida. Es un "álbum" recto — sin tilt/perspectiva 3D, deliberadamente plano
  (hubo una version con `.gallery__stack` inclinado en 3D siguiendo el cursor; se sacó por pedido
  del cliente, "no tiene que estar como doblada"). Es una pila de cards: la activa al frente
  (`.gallery__frame`, solo marco redondeado + sombra) y dos "peeks" detras (`#galPeek1`/`#galPeek2`)
  mostrando, achicadas y desplazadas (sin rotación — sólo `translate` + `scale`, para que se lean
  como capas derechas de un álbum, no como fotos tiradas), las imagenes de las proximas slides
  (clickeables para saltar ahi). **En mobile (<=680px) las flechas se ocultan** para darle todo el ancho a la foto (se navega deslizando o con los puntos). El contador "01 / 04" es un chip discreto sobre la esquina de la
  foto (abajo a la derecha); abajo a la izquierda, otro chip (`#galStat`, `.gallery__stat`, con un
  punto dorado que pulsa) muestra un dato puntual de esa pantalla — sumar/cambiar capturas requiere
  escribir el suyo (ver mas abajo). Las flechas (`#galPrev`/`#galNext`) van **a los costados de la
  foto, no encima** (`.gallery__row`, flex: flecha — pila — flecha; antes estaban superpuestas
  sobre la imagen como vidrio y no gustaban ahí). Sin círculo/botón alrededor en reposo — probamos
  esa versión y resultaba "de más"; queda sólo el chevron en `--gold-deep`, y recién en hover
  aparece un círculo muy sutil detrás (`::before`, 42x42 fijo — **cuadrado**, centrado con
  `top/left:50% + translate(-50%,-50%)`, no `inset` sobre el botón entero: el botón mide 34x64, así
  que un `inset` ahí da una elipse, no un círculo) con relleno `rgba(201,168,76,.09)`, y el chevron
  se corre 3px hacia el lado al que apunta y se pone `--gold`. Debajo de la galeria, puntos
  tipo "historia" de Instagram: la activa se va llenando de oro durante el autoplay (5.5s,
  `--autoplay-ms` en `#galDots`), las anteriores quedan llenas, las que faltan vacias. **Al pasar el
  mouse por la galeria, el autoplay se pausa de verdad** (no se reinicia): el JS guarda cuanto
  tiempo quedaba (`remaining`, en vez del clasico `setInterval` fijo usa `setTimeout` re-armado a
  mano — `armTimer`/`pause`/`resume` — para poder retomar exactamente donde quedó) y el relleno del
  punto activo se congela con `animation-play-state:paused` (clase `.is-paused` en `#galDots`) en
  vez de reiniciarse a cero; al sacar el mouse retoma ambos desde donde estaban. La navegación manual
  (flecha, punto, drag, teclado, peek) sí arranca de cero siempre (`restart()`) — pero como las
  flechas están *adentro* de `#gallery`, clickear una no dispara `mouseleave` (el mouse sigue
  encima); `restart()` chequea una bandera `hovering` (la setean `pause`/`resume` en
  `mouseenter`/`mouseleave`) y si sigue en hover, deja el temporizador sin armar y mantiene
  `.is-paused` en vez de arrancarlo igual de fondo — antes lo arrancaba igual, entonces el punto
  quedaba visualmente congelado en 0% pero el timer de JS seguía corriendo invisible, y el slide
  saltaba solo cuando se cumplían los 5.5s aunque la barra nunca se hubiera llenado ("se queda
  trabada y de la nada pasa de imagen").
  Navegacion por flechas, **drag** con mouse o touch (Pointer Events, unificado) y **flechas del
  teclado** cuando la galeria esta a la vista. El cambio de slide entra con deslizamiento direccional
  (`--enter-x`, lo fija `goTo(i, dir)` antes de activar la slide — el `dir` lo pasan
  `next()`/`prev()`; un click en un punto/peek lo infiere por índice) ademas del fundido; la que
  sale usa `--exit-x` (signo contrario a `--enter-x`, clase `.is-leaving` temporal que el JS le
  agrega/saca) para que viaje en el mismo sentido que la que entra en vez de cruzarse con ella —
  ese cruce era la causa del "pasaje de imagenes raro" que se reportó cuando ambas usaban la misma
  variable. (Hubo tambien un cursor falso deambulando por la foto, tipo "esto se usa en vivo" — se
  sacó: con Ken Burns + el brillo que cruza + el chip de dato pulsando ya hay suficiente movimiento
  ambiental, y uno genérico que no interactúa con nada real de la captura sumaba ruido sin aportar.)
  El fondo detras de la pila (`.gallery__aura`) tiñe su
  glow con el color de acento de la slide activa via `--glow-rgb` (variable CSS en formato
  `"r,g,b"`, la fija el JS desde `data-glow` de cada slide; sin eso cae al dorado de siempre) — el
  cambio de color es un corte, no una transicion (animar gradientes con colores distintos no
  interpola bien entre navegadores). Para sumar una captura nueva alcanza con otro
  `<div class="gallery__slide" data-tag="..." data-quote="..." data-quote-accent="..." data-stat="..." data-glow="r,g,b">`
  con su `<img>` dentro de `#galViewport` — el JS arma puntos/peeks/badge/texto/stat/glow segun
  cuantos `.gallery__slide` encuentre. Con una sola imagen oculta flechas, puntos y peeks solo.
  Las 8 slides actuales (`assets/system/*` — Dashboard, Pedidos, Mapa de clientes, Órdenes de
  compra, Caja, Gastos mensuales, Reportes de ventas, Comisiones) son capturas reales, no placeholder
  (`comisiones-de-empresa.png` es la última en sumarse; `data-stat` de Gastos y el texto de Reportes
  se actualizaron cuando cambiaron esas capturas — si vuelven a cambiar, revisar que el dato destacado
  siga coincidiendo con lo que se ve). El texto grande de
  arriba (`.vista__intro` →
  `#galDesc` + `<span id="galDescAccent">`, tipografía display grande tipo headline, `font-weight:700`)
  va dentro de un marco dorado con ornamentos y **de altura fija**: `equalizeIntro()` (script.js) mide el `.vista__intro` con el texto de cada slide puesto por un instante, toma el mas alto y lo fija como `min-height`; se recalcula en `resize`, `load` y cuando cargan las fuentes, y el contenido queda centrado vertical (`display:flex;justify-content:center`) — por eso el marco no cambia de tamano al pasar de imagen (`.vista__intro`: borde en degradé de 1.5px que se enciende en las
  esquinas TL/BR — truco `padding-box`/`border-box` con `border:transparent`, radio 24px —, línea interior
  redondeada más tenue en `::before`, halo exterior con `outline-offset`, luz que da la vuelta al perímetro en
  `::after` con `conic-gradient` + `@property --ang`; y ornamentos SVG: una estrella-joya de 4 puntas (curva, con rombo y punto adentro; combina con los rombos del pill) con
  zarcillos y hojitas en cada esquina, y la misma estrella chica con volutas cabalgando el borde de abajo (antes eran rosas;
  el cliente pidio sacarlas — zarcillos, hojas y bordes se mantuvieron). Los SVG se definen
  una sola vez como `<symbol id="roseCorner">`/`#roseCrown` dentro de `.vista__intro` y se espejan por CSS
  (`.vista__rose.tl/.tr/.bl/.br`, `.vista__crown`); en mobile se achican) y el nombre
  de la pantalla (`#galLabel`) es una pill navy con letras doradas y un rombo dorado a cada lado, que cabalga el borde de arriba (con `z-index` sobre la luz orbital), posicionada con la
  propiedad `translate` (no `transform`) para no pisarse con la animación `.swap` que el JS reinicia
  en `applyText()` al cambiar de slide (fundido + subida de 8px; la primera vez no anima). Pedido del
  cliente: el texto "pasaba desapercibido". Es el único texto descriptivo por slide que queda — antes había uno chico arriba (`#galDesc` plano,
  desde `data-desc`) Y uno grande abajo de la galería (`.pull`/`#galQuote`, desde `data-quote`) con
  el mismo contenido repetido; el de abajo se sacó por pedido del cliente ("es el mismo texto en dos
  lados, pero arriba queda mejor") y su tipografía grande se trasladó arriba, a `#galDesc`. Por eso
  ya no existe `data-desc` como atributo — el único texto por slide es `data-quote`/`data-quote-accent`,
  y `applyText()` pisa el nodo de texto suelto de `#galDesc` antes del `<span>`, asi que el markup
  de `#galDesc` tiene que mantener esa forma (texto + `<span id="galDescAccent">`) si se edita a
  mano — igual que antes lo mantenía `#galQuote` (ya no existe). El texto inicial de
  `#galLabel`/`#galDesc`+`#galDescAccent`/`#galStat` en el HTML tiene que coincidir con los
  `data-*` del primer slide (`.is-active`). Los colores de acento (`data-glow`) se eligieron a mano
  por pantalla (no por extraccion automatica del screenshot — varias de las capturas son tablas
  blancas/grises con muy poco color saturado como para extraer algo util) para que las slides se
  sientan distintas entre si.
- **Reveal on scroll**: clases `.rv` / `.rv-l` / `.rv-r` / `.rv-group` (stagger de hijos). Un solo
  IntersectionObserver les agrega `.in`. Sin JS, quedan visibles igual solo si se agrega `.in` a mano
  — por eso todo contenido importante debe seguir siendo legible aunque el observer no dispare.
- **Motion**: el movimiento decorativo (particulas, brillo del boton, autoplay/puntos de la galeria,
  foco de las cards, Ken Burns) corre siempre — no se apaga con `prefers-reduced-motion`. Es
  deliberado: sitio de marketing, no una app. Lo unico que sigue respetando esa preferencia es el
  parallax de puntero (hero y galeria) y el scroll suave de los anchors del nav. La grilla de
  puntitos de fondo (`.hero__grid`, un `linear-gradient` de líneas finas enmascarado en un óvalo) que
  tenían el hero, `#sistema` y el testimonio se sacó del todo (CSS y HTML) por pedido del cliente —
  quedan con `.hero__glow` (el resplandor) y su canvas de partículas/cometas nada más, mismo
  criterio que ya tenía el cierre (`.close-cta__glow` + `#cta-canvas`, sin grilla). `cometField()`
  (script.js) ahora toma un 3er parámetro opcional `{seed, cap, rate, rateReduce}` para variar la
  densidad de cometas por canvas — el default subió (antes `seed(7)`/tope 30/prob. 0.045; ahora
  `seed 14`/tope 46/prob. 0.075) porque en `#sistema` quedaban pocas; el testimonio (`#quote-canvas`,
  sumado de cero — antes esa sección no tenía canvas) usa una densidad más baja a propósito
  (`seed:8, cap:26, rate:0.045`), por ser una sección más chica.
- **Colores/tipografia**: tokens en `:root` (`--navy`, `--gold`, `--cream`, `--display`, `--body`, ...).
- **Contacto**: numero de WhatsApp `5491150072651` y `info@minervasystemsar.com`, hardcodeados en los
  `href` (buscar `wa.me/5491150072651`).
- **Solicitar Demo** (cierre, al lado del boton de WhatsApp, mismo `.btn--gold` y **mismas dimensiones**: `.close-cta__actions` es un grid de 2 columnas `1fr`, que iguala el ancho al del mas largo; una sola columna en mobile): abre el modal
  `#demo` (Nombre / Email / Mensaje, mismos campos y textos que `GestionSoftware_Web/Views/Minerva/AboutUs.cshtml`)
  y hace `POST /api/demo` (JSON `{name,email,message,website}`). Pantalla de exito con check animado y
  resumen. **El modal solo se cierra con la cruz**: sin clic en el fondo, sin Escape y sin boton Cerrar (pedido del cliente). Validacion en el cliente (mensajes iguales al original) y otra vez en el servidor. `website` es
  un honeypot invisible. Logica en el bloque "MODAL SOLICITAR DEMO" de `script.js`, estilos `.demo*` en
  `styles.css`.
- **Servidor (`server.js`)**: reemplaza a `serve`. Sirve SOLO el sitio (`index.html`, `styles.css`,
  `script.js` y `assets/**` (la ruta vieja `/Minerva Systems - landing.html` devuelve `index.html`); todo lo demas, incluidos
  `server.js`, `email/`, `.env` y este archivo, da 404) y expone `POST /api/demo`, que manda dos mails con
  nodemailer por Gmail SMTP (smtp.gmail.com:587): aviso interno (asunto "Nueva solicitud de demo — {nombre}",
  con Reply-To al cliente) y confirmacion al cliente ("Solicitud de demo — {nombre}"). Mismos templates HTML
  que el original, copiados en `email/email-cliente.html` y `email/email-interno.html` (placeholders
  `{NOMBRE}`, `{EMAIL}`, `{MENSAJE}`, `{NOMBRE_URL}`). Diferencias deliberadas respecto de
  `MinervaController.cs`: los datos del usuario se escapan a HTML antes de entrar al template, el aviso
  interno va primero (si la casilla del cliente rebota el lead no se pierde y igual se responde OK),
  limite de 5 envios por hora por IP y tope de largo por campo.
- **Envio de mails en PRODUCCION = relay por Apps Script (Railway bloquea el SMTP saliente).** Al desplegar, el envio directo por SMTP daba `Error al enviar el mail: Connection timeout` (smtp.gmail.com:587 no es alcanzable desde Railway en planes sin SMTP saliente; local si andaba). Por eso `server.js` tiene `deliver()`: si hay `MAIL_RELAY_URL`, hace un POST por HTTPS (fetch global, Node >= 18, `engines` en package.json) a un Google Apps Script (`email/relay-apps-script.gs`, con las instrucciones de instalacion adentro) que manda el mail con `MailApp` desde la misma cuenta de Gmail; sin `MAIL_RELAY_URL` usa SMTP directo con nodemailer (util en local). El script se instala UNA vez en script.google.com logueado como la cuenta de Gmail, como "Aplicacion web" (ejecutar como "Yo", acceso "Cualquier persona"), y el secreto compartido `TOKEN` del script tiene que ser igual a `MAIL_RELAY_TOKEN`. Si se edita el script hay que publicar "Nueva version" de la implementacion. Cuota de Google para cuentas gratuitas: ~100 destinatarios/dia. Apps Script contesta con un 302 a una URL de googleusercontent: `fetch` lo sigue solo. El log del servidor dice el motivo de cada fallo (`el relay rechazo el envio: token invalido`, etc.).
- **Credenciales: NUNCA en el repo.** Variables de entorno en Railway (Variables del servicio): `MAIL_RELAY_URL` (URL `/exec` del Apps Script) y `MAIL_RELAY_TOKEN` (el secreto compartido) para producción; `SMTP_USER` (cuenta de Gmail: destinatario del aviso interno) y opcional `MAIL_TO` (si el aviso debe ir a otra casilla). `SMTP_PASS` (contraseña de aplicacion) solo hace falta para SMTP directo, es decir en local (`.env`, en `.gitignore`). Sin destino de envio el endpoint responde 500 y el modal muestra el error. `MAIL_DRY_RUN=1` arma los mails y los imprime en consola sin enviar (para probar sin mandar nada).

## Correr localmente

```bash
npm install
npm start        # o: npm run dev  — http://localhost:3000 (o $PORT)
```

`npm start` corre `node server.js`. Para probar el modal sin mandar mails reales:
`MAIL_DRY_RUN=1 npm start` (en PowerShell: `$env:MAIL_DRY_RUN=1; npm start`). Abrir `index.html` directo en el
browser sigue mostrando el sitio, pero el boton de demo no funciona sin el servidor (`/api/demo`).

## Deploy (GitHub -> Railway)

- `package.json`: dependencia unica `nodemailer`; `npm start` = `node server.js` (usa `$PORT`).
- Railway (Nixpacks) detecta Node, corre `npm install` y `npm start`. `$PORT` lo inyecta Railway.
- **Variables de Railway para que el modal envie mails: `MAIL_RELAY_URL`, `MAIL_RELAY_TOKEN` y `SMTP_USER`** (ver arriba; `SMTP_PASS` no sirve en Railway porque bloquea el SMTP saliente).
- No hace falta Dockerfile ni `railway.json`.

Flujo: commit + push a GitHub -> Railway "New Project" -> "Deploy from GitHub repo" -> este repo.
Deploys automaticos en cada push a la rama por defecto.
