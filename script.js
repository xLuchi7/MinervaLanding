  (function(){
    'use strict';
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- reveal on scroll ---------- */
    var revealEls = document.querySelectorAll('.rv, .rv-l, .rv-r, .rv-group');
    if ('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      revealEls.forEach(function(el){ io.observe(el); });
    } else {
      revealEls.forEach(function(el){ el.classList.add('in'); });
    }

    /* ---------- entrada escalonada del hero (progresiva: sin JS se ve igual) ---------- */
    var heroWrap = document.getElementById('heroWrap');
    if (heroWrap && !reduce){
      heroWrap.classList.add('anim');
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){ heroWrap.classList.add('go'); });
      });
    }

    /* ---------- barras flotantes + progreso + parallax ---------- */
    var nav = document.getElementById('nav');
    var progress = document.getElementById('scrollProgress');
    var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    var spy = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]:not(.btn)')).map(function(a){
      return { a: a, el: document.querySelector(a.getAttribute('href')) };
    });
    var ticking = false;

    function onScroll(){
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(render);
    }
    function render(){
      ticking = false;
      var y = window.scrollY || window.pageYOffset, vh = window.innerHeight;
      if (nav) nav.classList.toggle('scrolled', y > 40);
      // link activo del header según la sección que está a la vista
      var cur = -1;
      for (var s = 0; s < spy.length; s++){
        if (spy[s].el && spy[s].el.getBoundingClientRect().top <= vh * 0.4) cur = s;
      }
      for (var s2 = 0; s2 < spy.length; s2++) spy[s2].a.classList.toggle('is-active', s2 === cur);

      if (progress){
        var max = document.documentElement.scrollHeight - vh;
        progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      }

      if (!reduce){
        for (var k = 0; k < parallaxEls.length; k++){
          var pe = parallaxEls[k];
          var f = parseFloat(pe.getAttribute('data-parallax')) || 0;
          var mid = pe.getBoundingClientRect().top + pe.offsetHeight / 2 - vh / 2;
          pe.style.setProperty('--py', (mid * f).toFixed(1) + 'px');
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    /* ---------- FAQ: una sola abierta + animación de alto ---------- */
    var faq = document.getElementById('faq');
    if (faq){
      var items = Array.prototype.slice.call(faq.querySelectorAll('details'));
      items.forEach(function(d){
        var summary = d.querySelector('summary');
        var ans = d.querySelector('.ans');
        summary.addEventListener('click', function(ev){
          ev.preventDefault();
          var isOpen = d.open;
          items.forEach(function(o){ if (o !== d && o.open){ collapse(o); } });
          if (isOpen){ collapse(d); } else { expand(d); }
        });
      });
      var FAQ_EASE = 'cubic-bezier(.22,1,.36,1)';
      function expand(d){
        var ans = d.querySelector('.ans');
        d.open = true;
        var h = ans.scrollHeight;
        ans.style.height = '0px';
        requestAnimationFrame(function(){
          ans.style.transition = 'height .38s ' + FAQ_EASE;
          ans.style.height = h + 'px';
        });
        ans.addEventListener('transitionend', function te(){ ans.style.height = 'auto'; ans.style.transition = ''; ans.removeEventListener('transitionend', te); });
      }
      function collapse(d){
        var ans = d.querySelector('.ans');
        var h = ans.scrollHeight;
        ans.style.height = h + 'px';
        requestAnimationFrame(function(){
          ans.style.transition = 'height .34s ' + FAQ_EASE;
          ans.style.height = '0px';
        });
        ans.addEventListener('transitionend', function te(){ d.open = false; ans.style.height = ''; ans.style.transition = ''; ans.removeEventListener('transitionend', te); });
      }
    }

    /* ---------- lightbox: imagenes de la galería y, con el botón "agrandar", las QR ---------- */
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lightboxImg');
    var lbClose = document.getElementById('lightboxClose');
    if (lb && lbImg && lbClose){
      function openLb(src, alt){
        lbImg.src = src;
        lbImg.alt = alt || '';
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
      function closeLb(){ lb.classList.remove('open'); document.body.style.overflow = ''; }
      document.querySelectorAll('.gallery__slide img').forEach(function(img){
        img.addEventListener('click', function(){ openLb(img.currentSrc || img.src, img.alt); });
      });
      // botón "agrandar" de cada QR: sólo la QR grande en pantalla, para escanear en una reunión
      document.querySelectorAll('[data-qr-zoom]').forEach(function(btn){
        btn.addEventListener('click', function(){ openLb(btn.getAttribute('data-qr-zoom'), btn.getAttribute('data-qr-alt')); });
      });
      lbClose.addEventListener('click', closeLb);
      lb.addEventListener('click', function(e){ if (e.target === lb) closeLb(); });
      document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeLb(); });
    }

    /* ======================================================================
       FONDOS EN CANVAS
       El movimiento ambiental (deriva de partículas) es sutil y siempre corre.
       Con "reduce motion" sólo se atenúa un poco y se apaga el parallax de
       puntero, que es lo que más puede molestar.
       ====================================================================== */
    function rnd(a,b){ return Math.random()*(b-a)+a; }
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var damp = reduce ? 0.7 : 1;

    // puntero global normalizado (-1..1) para un parallax muy leve
    var ptr = { x:0, y:0, tx:0, ty:0 };
    if (!reduce){
      window.addEventListener('pointermove', function(e){
        ptr.tx = (e.clientX / window.innerWidth  - 0.5) * 2;
        ptr.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive:true });
    }

    // Mide el canvas de forma robusta y lo deja nítido en pantallas HiDPI.
    function sizeCanvas(canvas){
      var r = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width  || canvas.offsetWidth  || canvas.parentElement.offsetWidth));
      var h = Math.max(1, Math.round(r.height || canvas.offsetHeight || canvas.parentElement.offsetHeight));
      var pw = Math.round(w * DPR), ph = Math.round(h * DPR);
      if (canvas.width !== pw || canvas.height !== ph){ canvas.width = pw; canvas.height = ph; }
      return { w:w, h:h };
    }
    // Re-mide varias veces: el layout cambia al terminar de cargar la fuente.
    function whenSized(canvas, cb){
      var tries = 0;
      (function tick(){
        cb(sizeCanvas(canvas));
        if (++tries < 8) setTimeout(tick, tries < 4 ? 120 : 500);
      })();
      window.addEventListener('load',   function(){ cb(sizeCanvas(canvas)); });
      window.addEventListener('resize', function(){ cb(sizeCanvas(canvas)); });
    }
    function fadeIn(canvas){ requestAnimationFrame(function(){ canvas.style.opacity = '1'; }); }

    /* ---------- campo de partículas (deriva + oscilación + destello) ---------- */
    function particleField(canvas, count, colors, opts){
      opts = opts || {};
      var link = !!opts.link;
      var parallax = (opts.parallax !== false) && !reduce;
      var ctx = canvas.getContext('2d');
      var parts = [], w = 1, h = 1, t = 0;

      function make(){
        var c = colors[(Math.random()*colors.length)|0];
        return {
          bx: rnd(0,w), y: rnd(0,h), r: rnd(1,3),
          a: rnd(0.3,0.85), c: c,
          vy: rnd(-0.55,-0.16) * damp,
          drift: rnd(-0.12,0.12) * damp,
          swA: rnd(6,20), swF: rnd(0.004,0.013), ph: rnd(0,Math.PI*2),
          twF: rnd(0.6,1.8)
        };
      }
      function seed(){ parts = []; for (var i=0;i<count;i++) parts.push(make()); }

      function frame(){
        t += 1;
        ctx.setTransform(DPR,0,0,DPR,0,0);
        ctx.clearRect(0,0,w,h);

        var ox = 0, oy = 0;
        if (parallax){
          ptr.x += (ptr.tx - ptr.x) * 0.05;
          ptr.y += (ptr.ty - ptr.y) * 0.05;
          ox = ptr.x * 16; oy = ptr.y * 12;
        }

        // posición efectiva de cada partícula
        for (var i=0;i<parts.length;i++){
          var p = parts[i];
          p.bx += p.drift; p.y += p.vy;
          if (p.y + p.r < -2){ p.y = h + p.r; p.bx = rnd(0,w); }
          if (p.bx < -20) p.bx = w + 20; else if (p.bx > w + 20) p.bx = -20;
          p.cx = p.bx + Math.sin(t * p.swF + p.ph) * p.swA + ox;
          p.cy = p.y + oy;
        }

        // líneas de conexión (constelación) — sólo en campos densos
        if (link){
          for (var m=0;m<parts.length;m++){
            for (var n=m+1;n<parts.length;n++){
              var a = parts[m], b = parts[n];
              var dx = a.cx - b.cx, dy = a.cy - b.cy;
              var d2 = dx*dx + dy*dy;
              if (d2 < 15000){
                var o = (1 - d2/15000) * 0.16;
                ctx.strokeStyle = 'rgba(201,168,76,' + o.toFixed(3) + ')';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(a.cx,a.cy); ctx.lineTo(b.cx,b.cy); ctx.stroke();
              }
            }
          }
        }

        // puntos con destello y glow
        for (var k=0;k<parts.length;k++){
          var q = parts[k];
          var tw = 0.6 + 0.4 * Math.sin(t * 0.02 * q.twF + q.ph);
          ctx.beginPath();
          ctx.arc(q.cx, q.cy, q.r, 0, Math.PI*2);
          ctx.fillStyle   = 'rgba('+q.c[0]+','+q.c[1]+','+q.c[2]+','+(q.a*tw).toFixed(3)+')';
          ctx.shadowColor = 'rgba('+q.c[0]+','+q.c[1]+','+q.c[2]+',0.8)';
          ctx.shadowBlur  = q.r * 3;
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        requestAnimationFrame(frame);
      }

      whenSized(canvas, function(s){
        var re = (w !== s.w || h !== s.h);
        w = s.w; h = s.h;
        if (re || !parts.length) seed();
      });
      fadeIn(canvas);
      requestAnimationFrame(frame);
    }

    /* ---------- cometas diagonales ---------- */
    function cometField(canvas, colors, opts){
      opts = opts || {};
      var SEED = opts.seed != null ? opts.seed : 14;
      var CAP  = opts.cap  != null ? opts.cap  : 46;
      var RATE = opts.rate != null ? opts.rate : 0.075;
      var RATE_REDUCE = opts.rateReduce != null ? opts.rateReduce : 0.03;
      var ctx = canvas.getContext('2d');
      var comets = [], w = 1, h = 1;
      function make(){
        var c = colors[(Math.random()*colors.length)|0];
        return { x:rnd(-120,w+120), y:rnd(-120,h*0.55), length:rnd(110,260),
                 speed:rnd(0.7,1.5) * damp, angle:rnd(30,50)*Math.PI/180,
                 alpha:rnd(0.34,0.7), width:rnd(1,2.2), c:c, life:0, maxLife:rnd(170,300) };
      }
      function stroke(c){
        var pr = c.life / c.maxLife;
        var alpha = Math.max(0, pr < 0.15 ? (pr/0.15)*c.alpha : pr > 0.7 ? ((1-pr)/0.3)*c.alpha : c.alpha);
        var hx = c.x + Math.cos(c.angle)*c.life, hy = c.y + Math.sin(c.angle)*c.life;
        var tx = hx - Math.cos(c.angle)*c.length, ty = hy - Math.sin(c.angle)*c.length;
        var g = ctx.createLinearGradient(tx,ty,hx,hy);
        g.addColorStop(0, 'rgba('+c.c[0]+','+c.c[1]+','+c.c[2]+',0)');
        g.addColorStop(1, 'rgba('+c.c[0]+','+c.c[1]+','+c.c[2]+','+alpha+')');
        ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(hx,hy);
        ctx.strokeStyle = g; ctx.lineWidth = c.width; ctx.lineCap = 'round'; ctx.stroke();
        // cabeza brillante
        ctx.beginPath();
        ctx.arc(hx,hy,c.width*1.4,0,Math.PI*2);
        ctx.fillStyle = 'rgba('+c.c[0]+','+c.c[1]+','+c.c[2]+','+alpha+')';
        ctx.shadowColor = 'rgba('+c.c[0]+','+c.c[1]+','+c.c[2]+',0.9)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      function seed(n){ comets = []; for (var i=0;i<n;i++){ var c = make(); c.life = rnd(0, c.maxLife*0.7); comets.push(c); } }
      whenSized(canvas, function(s){ w = s.w; h = s.h; if (!comets.length) seed(SEED); });
      fadeIn(canvas);
      (function loop(){
        ctx.setTransform(DPR,0,0,DPR,0,0);
        ctx.clearRect(0,0,w,h);
        if (Math.random() < (reduce ? RATE_REDUCE : RATE) && comets.length < CAP) comets.push(make());
        comets = comets.filter(function(c){ return c.life < c.maxLife + c.length; });
        comets.forEach(function(c){ c.life += c.speed; stroke(c); });
        requestAnimationFrame(loop);
      })();
    }

    var GOLD = [201,168,76], GOLD_HI = [226,199,124], MIST = [150,171,201];
    var small = window.innerWidth < 720;
    var heroC  = document.getElementById('hero-canvas');
    var cometC = document.getElementById('comet-canvas');
    var quoteC = document.getElementById('quote-canvas');
    var ctaC   = document.getElementById('cta-canvas');
    // en mobile, menos partículas que antes (46→30, 34→22): el cliente avisó que el
    // texto del hero y del cierre "se perdía" contra el fondo animado en el celular —
    // con menos puntos hay menos lineas de constelación (crecen en cuadrado con la
    // cantidad) y el fondo queda más tranquilo detrás del texto, sin sacar el efecto
    if (heroC)  particleField(heroC, small ? 22 : 90, [GOLD, GOLD, GOLD_HI, MIST], { link:true });
    if (cometC) cometField(cometC, [GOLD, GOLD, GOLD_HI]);
    // versión más calma para la franja del testimonio — sección más chica,
    // no hace falta la misma densidad que "qué incluye el sistema"
    if (quoteC) cometField(quoteC, [GOLD, GOLD_HI, MIST], { seed:8, cap:26, rate:0.045, rateReduce:0.02 });
    if (ctaC)   particleField(ctaC, small ? 22 : 58, [GOLD, GOLD, GOLD_HI, MIST], { link:true, parallax:false });

    /* ======================================================================
       GALERÍA DEL SISTEMA (N imágenes, lista para crecer)
       Pila plana (sin tilt) con la card activa + dos "peeks" rectos del
       contenido que sigue, puntos tipo historia (se llenan solos), drag con
       mouse/touch unificado por Pointer Events, flechas a los costados y
       teclado. El autoplay corre siempre — no se apaga con
       prefers-reduced-motion, mismo criterio que el resto del movimiento
       ambiental del sitio.
       ====================================================================== */
    (function(){
      var gallery = document.getElementById('gallery');
      if (!gallery) return;
      var slides = Array.prototype.slice.call(gallery.querySelectorAll('.gallery__slide'));
      if (!slides.length) return;
      var viewport = document.getElementById('galViewport');
      var dotsWrap = document.getElementById('galDots');
      var prevBtn  = document.getElementById('galPrev');
      var nextBtn  = document.getElementById('galNext');
      var labelEl  = document.getElementById('galLabel');
      var descEl   = document.getElementById('galDesc');
      var descAccentEl = document.getElementById('galDescAccent');
      var indexEl  = document.getElementById('galIndex');
      var statEl   = document.getElementById('galStat');
      var peek1    = document.getElementById('galPeek1');
      var peek2    = document.getElementById('galPeek2');
      var peek1Img = peek1 && peek1.querySelector('img');
      var peek2Img = peek2 && peek2.querySelector('img');

      var idx = Math.max(0, slides.findIndex(function(s){ return s.classList.contains('is-active'); }));
      var timer = null;          // handle del setTimeout en curso (null si está en pausa)
      var AUTOPLAY = 5500;
      var remaining = AUTOPLAY;  // ms que faltan para el próximo avance
      var runningSince = 0;      // timestamp en que arrancó el tramo actual
      var hovering = false;      // mouse encima de la galería ahora mismo
      if (dotsWrap) dotsWrap.style.setProperty('--autoplay-ms', AUTOPLAY + 'ms');

      function srcOf(n){ var img = slides[(n + slides.length) % slides.length].querySelector('img'); return img ? img.currentSrc || img.src : ''; }

      // el marco del texto mide siempre lo mismo: se mide el más alto de todos los slides
      // (con cada texto puesto un instante) y se fija como min-height; se recalcula al
      // cambiar el ancho o al cargar la fuente
      var introEl = descEl && descEl.closest ? descEl.closest('.vista__intro') : null;
      function equalizeIntro(){
        if (!introEl || !descEl || !descAccentEl) return;
        var keepMain = descEl.firstChild.nodeValue, keepAcc = descAccentEl.textContent, max = 0;
        introEl.style.minHeight = '';
        slides.forEach(function(s){
          descEl.firstChild.nodeValue = (s.dataset.quote || '') + ' ';
          descAccentEl.textContent = s.dataset.quoteAccent || '';
          max = Math.max(max, introEl.offsetHeight);
        });
        descEl.firstChild.nodeValue = keepMain;
        descAccentEl.textContent = keepAcc;
        introEl.style.minHeight = max + 'px';
      }
      var eqTimer = 0;
      window.addEventListener('resize', function(){ clearTimeout(eqTimer); eqTimer = setTimeout(equalizeIntro, 120); });
      window.addEventListener('load', equalizeIntro);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(equalizeIntro);
      equalizeIntro();

      var textShown = false;
      function swap(el){
        if (!el) return;
        el.classList.remove('swap');
        void el.offsetWidth;
        el.classList.add('swap');
      }
      function applyText(i){
        var s = slides[i];
        // la primera vez no anima (ya está el texto inicial del HTML)
        if (textShown){ swap(labelEl); swap(descEl); }
        textShown = true;
        if (labelEl && s.dataset.tag)  labelEl.textContent = s.dataset.tag;
        if (indexEl) indexEl.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
        if (statEl && s.dataset.stat) statEl.textContent = s.dataset.stat;
        // el texto grande tiene un tramo fijo + un <span> dorado al final
        // (galDescAccent) — se pisa el nodo de texto, no el span entero
        if (descEl && descAccentEl && s.dataset.quote){
          descEl.firstChild.nodeValue = s.dataset.quote + ' ';
          descAccentEl.textContent = s.dataset.quoteAccent || '';
        }
        if (s.dataset.glow) gallery.style.setProperty('--glow-rgb', s.dataset.glow);
        if (peek1Img) peek1Img.src = srcOf(i + 1);
        if (peek2Img) peek2Img.src = srcOf(i + 2);
      }
      function restartDot(n){
        if (!dotsWrap) return;
        var dot = dotsWrap.children[n];
        if (!dot) return;
        var fill = dot.querySelector('i');
        fill.classList.remove('run');
        void fill.offsetWidth; // reflow: reinicia el keyframe aunque sea la misma clase
        fill.classList.add('run');
      }
      function goTo(i, dir){
        var newIdx = (i + slides.length) % slides.length;
        if (dir === undefined) dir = newIdx === idx ? 1 : (newIdx > idx ? 1 : -1);
        var prevSlide = slides[idx];
        var changed = newIdx !== idx;
        // la que entra arranca corrida hacia el lado del que "viene" y la
        // que sale se va hacia el lado contrario (--exit-x) — así viajan en
        // el mismo sentido en vez de cruzarse. Reflow antes de activar para
        // que el navegador registre el punto de partida y anime el
        // deslizamiento (si no, salta directo al final).
        viewport.style.setProperty('--enter-x', dir > 0 ? '30px' : '-30px');
        viewport.style.setProperty('--exit-x', dir > 0 ? '-30px' : '30px');
        void viewport.offsetWidth;
        idx = newIdx;
        if (changed && prevSlide){
          prevSlide.classList.add('is-leaving');
          setTimeout(function(){ prevSlide.classList.remove('is-leaving'); }, 520);
        }
        slides.forEach(function(s,n){
          var active = n === idx;
          s.classList.toggle('is-active', active);
          if (active) s.classList.remove('is-leaving');
        });
        if (dotsWrap){
          Array.prototype.forEach.call(dotsWrap.children, function(d,n){
            d.classList.toggle('is-past', n < idx);
            d.classList.toggle('is-active', n === idx);
          });
          restartDot(idx);
        }
        applyText(idx);
      }
      function next(){ goTo(idx + 1, 1); }
      function prev(){ goTo(idx - 1, -1); }
      function clearTimer(){ if (timer){ clearTimeout(timer); timer = null; } }
      function armTimer(ms){
        clearTimer();
        runningSince = Date.now();
        timer = setTimeout(function(){ timer = null; next(); restart(); }, ms);
      }
      // navegación manual (flechas, puntos, drag, teclado, peeks): arranca
      // de cero — slide nueva, cuenta nueva, punto se llena desde vacío.
      // Si esto pasa con el mouse todavía encima (p.ej. clickeando una
      // flecha, que está adentro de #gallery) el temporizador no arranca —
      // se queda pausado igual que ya estaba — porque si no, quedaba
      // corriendo de fondo mientras el punto seguía congelado por
      // .is-paused, y el timer disparaba el siguiente slide "de la nada"
      // sin que la barra se haya llenado.
      function restart(){
        remaining = AUTOPLAY;
        restartDot(idx);
        if (hovering){
          clearTimer();
          if (dotsWrap) dotsWrap.classList.add('is-paused');
        } else {
          if (dotsWrap) dotsWrap.classList.remove('is-paused');
          armTimer(remaining);
        }
      }
      // al pasar el mouse: pausa donde está (temporizador y relleno del
      // punto), no reinicia — retoma el tiempo que faltaba al salir
      function pause(){
        hovering = true;
        if (!timer) return; // ya pausado (p.ej. restart() mientras se hovereaba)
        remaining -= (Date.now() - runningSince);
        if (remaining < 60) remaining = 60;
        clearTimer();
        if (dotsWrap) dotsWrap.classList.add('is-paused');
      }
      function resume(){
        hovering = false;
        if (timer) return;
        armTimer(remaining);
        if (dotsWrap) dotsWrap.classList.remove('is-paused');
      }

      if (slides.length > 1){
        slides.forEach(function(_, n){
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'gallery__dotbtn';
          b.innerHTML = '<i></i>';
          b.setAttribute('aria-label', 'Ver imagen ' + (n + 1) + ' de ' + slides.length);
          b.addEventListener('click', function(){ goTo(n); restart(); });
          dotsWrap.appendChild(b);
        });
        if (prevBtn) prevBtn.addEventListener('click', function(){ prev(); restart(); });
        if (nextBtn) nextBtn.addEventListener('click', function(){ next(); restart(); });
        if (peek1) peek1.addEventListener('click', function(){ next(); restart(); });
        if (peek2) peek2.addEventListener('click', function(){ goTo(idx + 2); restart(); });

        gallery.addEventListener('mouseenter', pause);
        gallery.addEventListener('mouseleave', resume);

        /* arrastre unificado mouse + touch (Pointer Events); si hubo drag
           real, se cancela el click que abriría el lightbox */
        var dragX = null, justDragged = false;
        viewport.addEventListener('pointerdown', function(e){
          dragX = e.clientX;
          if (viewport.setPointerCapture) { try { viewport.setPointerCapture(e.pointerId); } catch(err){} }
        });
        viewport.addEventListener('pointerup', function(e){
          if (dragX === null) return;
          var dx = e.clientX - dragX;
          dragX = null;
          if (Math.abs(dx) > 40){
            justDragged = true;
            dx < 0 ? next() : prev();
            restart();
          }
        });
        viewport.addEventListener('pointercancel', function(){ dragX = null; });
        viewport.addEventListener('click', function(e){
          if (justDragged) { e.stopPropagation(); e.preventDefault(); justDragged = false; }
        }, true);

        /* flechas del teclado, sólo cuando la galería está a la vista */
        var galleryInView = false;
        if ('IntersectionObserver' in window){
          var galIo = new IntersectionObserver(function(entries){ galleryInView = entries[0].isIntersecting; }, { threshold: 0.4 });
          galIo.observe(gallery);
        }
        window.addEventListener('keydown', function(e){
          if (!galleryInView) return;
          if (e.key === 'ArrowLeft'){ prev(); restart(); }
          else if (e.key === 'ArrowRight'){ next(); restart(); }
        });

        goTo(idx);   // fija is-active/is-past en los puntos antes del primer autoplay
        restart();
      } else {
        if (prevBtn) prevBtn.remove();
        if (nextBtn) nextBtn.remove();
        if (peek1) peek1.remove();
        if (peek2) peek2.remove();
        applyText(idx);
      }

    })();

    /* ======================================================================
       MODAL "SOLICITAR DEMO" — POST /api/demo (server.js manda los mails).
       Mismos campos y mismos mensajes que el AboutUs original.
       ====================================================================== */
    (function(){
      var modal = document.getElementById('demo');
      var openBtns = Array.prototype.slice.call(document.querySelectorAll('[data-demo-open]'));
      var form = document.getElementById('demoForm');
      if (!modal || !openBtns.length || !form) return;
      var errEl = document.getElementById('demoError');
      var submit = document.getElementById('demoSubmit');
      var fields = {
        name: document.getElementById('demoName'),
        email: document.getElementById('demoEmail'),
        message: document.getElementById('demoMessage')
      };
      var lastFocus = null;

      function open(){
        lastFocus = document.activeElement;
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(function(){ if (!modal.classList.contains('is-ok')) fields.name.focus(); }, 120);
      }
      function close(){
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        setTimeout(reset, 350);
        if (lastFocus && lastFocus.focus) lastFocus.focus();
      }
      function reset(){
        if (modal.classList.contains('open')) return;
        modal.classList.remove('is-ok');
        form.reset();
        showError('');
      }
      function showError(msg, field){
        errEl.textContent = msg;
        Object.keys(fields).forEach(function(k){ fields[k].parentNode.classList.toggle('bad', k === field); });
        if (field) fields[field].focus();
      }

      openBtns.forEach(function(b){ b.addEventListener('click', open); });
      document.getElementById('demoClose').addEventListener('click', close);

      form.addEventListener('submit', function(e){
        e.preventDefault();
        var name = fields.name.value.trim(), email = fields.email.value.trim(), message = fields.message.value.trim();
        if (!name)    return showError('Completá tu nombre', 'name');
        if (!email)   return showError('Completá tu email', 'email');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showError('Ingresá un email con formato válido', 'email');
        if (!message) return showError('Escribí un mensaje', 'message');
        showError('');

        submit.textContent = 'Enviando...';
        submit.disabled = true;
        fetch('/api/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json;charset=UTF-8', 'Accept': 'application/json' },
          body: JSON.stringify({ name: name, email: email, message: message, website: document.getElementById('demoHp').value })
        }).then(function(r){ return r.json(); }).then(function(data){
          if (!data.success) return showError(data.error || 'Error al enviar. Intentá de nuevo en unos segundos');
          document.getElementById('demoOkTitle').textContent = '¡Todo listo, ' + name.split(' ')[0] + '!';
          document.getElementById('demoOkName').textContent = name;
          document.getElementById('demoOkEmail').textContent = email;
          modal.classList.add('is-ok');
        }).catch(function(){
          showError('Sin conexión. Revisá tu conexión e intentá de nuevo');
        }).then(function(){
          submit.textContent = 'Enviar solicitud';
          submit.disabled = false;
        });
      });
    })();

    /* ---------- foco que sigue al cursor en las cards ---------- */
    (function(){
      if (!window.matchMedia('(hover:hover)').matches) return;
      var cards = Array.prototype.slice.call(document.querySelectorAll('.step, .mod'));
      cards.forEach(function(card){
        var raf = 0;
        card.addEventListener('pointermove', function(e){
          if (raf) return;
          raf = requestAnimationFrame(function(){
            raf = 0;
            var r = card.getBoundingClientRect();
            card.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100).toFixed(1) + '%');
            card.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100).toFixed(1) + '%');
          });
        });
      });
    })();

  })();
