/* =====================================================================
   CLEMI · Ilustraciones interactivas de los Eventos CLEMI
   EvArte.html(tema) → SVG animado; EvArte.activar(raíz) → al pasar el
   mouse se anima y al tocar suelta una lluvia de figuras del tema.
   ===================================================================== */
(function () {
  'use strict';
  var C = { vino: '#4a2433', vinoOsc: '#1c0e14', oro: '#C6A13B', oroC: '#E8C25B', crema: '#FBF6EA', verde: '#1B3F2C', verdeC: '#2E7D4F', azul: '#13213C' };
  var TEMAS = {
    plan: { nombre: 'Plan estratégico · integración', fondo: ['#13213C', '#2a3d63'], fig: ['estrella', 'pieza'], colores: [C.oroC, '#7fb3e0', '#ffffff', C.oro] },
    residentes: { nombre: 'Residentes', fondo: ['#1B3F2C', '#2E7D4F'], fig: ['birrete', 'estrella'], colores: [C.oroC, '#ffffff', '#9fd6b4'] },
    viaje: { nombre: 'Viaje CLEMI', fondo: ['#2a6f97', '#89c2d9'], fig: ['nube', 'estrella'], colores: ['#ffffff', C.oroC, '#f4a261'] },
    amistad: { nombre: 'Amor y amistad', fondo: ['#7a1f3d', '#c9184a'], fig: ['corazon'], colores: ['#ffccd5', '#ff4d6d', '#ffffff', C.oroC] },
    brujitas: { nombre: 'Brujitas', fondo: ['#1a0f2e', '#3c1f5c'], fig: ['murcielago', 'dulce'], colores: ['#f77f00', '#9d4edd', '#fcbf49', '#2b2d42'] },
    despedida: { nombre: 'Despedida CLEMI', fondo: ['#1c0e14', '#4a2433'], fig: ['estrella', 'confeti'], colores: [C.oroC, '#ffffff', '#e63946', '#2a9d8f'] },
    celebracion: { nombre: 'Celebración', fondo: ['#4a2433', '#8a3b55'], fig: ['confeti', 'estrella'], colores: [C.oroC, '#ffffff', '#f4a261', '#2a9d8f'] }
  };
  var CSS = '.eva{position:relative;width:100%;height:100%;min-height:150px;overflow:hidden;cursor:pointer;user-select:none;-webkit-user-select:none;isolation:isolate}' +
    '.eva svg{position:absolute;inset:0;width:100%;height:100%;display:block}.eva canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2}' +
    '.eva .tip{position:absolute;right:8px;top:8px;z-index:3;font:700 10px/1 "Source Sans 3",system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:rgba(0,0,0,.28);padding:4px 7px;border-radius:20px;opacity:.85;pointer-events:none;transition:opacity .3s}' +
    '.eva:hover .tip{opacity:0}' +
    '@keyframes evaFlota{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes evaLatido{0%,100%{transform:scale(1)}15%{transform:scale(1.12)}30%{transform:scale(.97)}45%{transform:scale(1.08)}}' +
    '@keyframes evaGira{to{transform:rotate(360deg)}}@keyframes evaBrilla{0%,100%{opacity:.35}50%{opacity:1}}@keyframes evaVuela{0%{transform:translateX(-80px)}100%{transform:translateX(480px)}}' +
    '@keyframes evaAleteo{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.55)}}@keyframes evaVaiven{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}' +
    '.eva .flota{animation:evaFlota 3.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.eva .late{animation:evaLatido 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}' +
    '.eva .brilla{animation:evaBrilla 2s ease-in-out infinite}.eva .gira{animation:evaGira 14s linear infinite;transform-box:fill-box;transform-origin:center}' +
    '.eva .vuela{animation:evaVuela 9s linear infinite}.eva .aleteo{animation:evaAleteo .35s ease-in-out infinite;transform-box:fill-box;transform-origin:center}.eva .vaiven{animation:evaVaiven 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:top center}' +
    '.eva .hov{transition:transform .5s cubic-bezier(.3,1.6,.5,1);transform-box:fill-box;transform-origin:center}' +
    '.eva:hover .hov-up{transform:translateY(-14px)}.eva:hover .hov-izq{transform:translateX(14px)}.eva:hover .hov-der{transform:translateX(-14px)}.eva:hover .hov-gro{transform:scale(1.15)}.eva:hover .hov-rot{transform:rotate(-12deg)}' +
    '.eva:hover .late{animation-duration:.8s}.eva:hover .vuela{animation-duration:4s}';
  (function () { if (document.getElementById('eva-css')) return; var s = document.createElement('style'); s.id = 'eva-css'; s.textContent = CSS; document.head.appendChild(s); })();

  function fondo(t, id) {
    return '<defs><linearGradient id="g' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + t.fondo[0] + '"/><stop offset="1" stop-color="' + t.fondo[1] + '"/></linearGradient></defs><rect width="400" height="260" fill="url(#g' + id + ')"/>';
  }
  function estrellas(n, sem) { var s = ''; for (var i = 0; i < n; i++) { var x = (i * 73 + sem * 31) % 390 + 5, y = (i * 47 + sem * 17) % 120 + 6; s += '<circle class="brilla" style="animation-delay:' + (i % 7) * .3 + 's" cx="' + x + '" cy="' + y + '" r="' + (1 + i % 2) + '" fill="#fff"/>'; } return s; }
  var DIBUJO = {
    plan: function () {
      return estrellas(14, 1) +
        '<g transform="translate(200 132)"><circle r="70" fill="#fff" opacity=".1"/><circle class="gira" r="58" fill="none" stroke="' + C.oroC + '" stroke-width="3" stroke-dasharray="10 8"/>' +
        '<circle r="44" fill="#fff" opacity=".9"/><circle r="32" fill="' + C.oro + '"/><circle r="20" fill="#fff"/><circle r="9" fill="#c0392b"/></g>' +
        '<g class="hov hov-izq"><path d="M70 150h34a10 10 0 1 1 18 0h34v40h-34a10 10 0 1 0-18 0H70z" fill="#7fb3e0" stroke="#fff" stroke-width="2"/></g>' +
        '<g class="hov hov-der"><path d="M244 150h34a10 10 0 1 0 18 0h34v40h-34a10 10 0 1 1-18 0h-34z" fill="' + C.oroC + '" stroke="#fff" stroke-width="2"/></g>' +
        '<g class="flota"><path d="M300 60 228 124" stroke="#fff" stroke-width="4"/><path d="M300 60l14-4-4 14z M300 60l-6-12 12 6z" fill="' + C.oroC + '"/></g>' +
        '<text x="200" y="244" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#fff" letter-spacing="3">PLAN ESTRATÉGICO</text>';
    },
    residentes: function () {
      var gorro = function (x, y, s, d) { return '<g class="flota" style="animation-delay:' + d + 's" transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-40 0 0-18 40 0 0 18z" fill="#111"/><path d="M-24 8v16c0 8 48 8 48 0V8L0 18z" fill="#222"/><path d="M28 2v24" stroke="' + C.oroC + '" stroke-width="2"/><circle cx="28" cy="28" r="4" fill="' + C.oroC + '"/></g>'; };
      return estrellas(10, 2) + '<g class="hov hov-up">' + gorro(110, 90, .9, 0) + gorro(290, 80, .8, .6) + '</g>' + gorro(200, 70, 1.2, .3) +
        '<g transform="translate(200 175)"><path d="M-46-26c0 40 10 54 30 54s30-14 30-54" fill="none" stroke="#dfe7e2" stroke-width="6" stroke-linecap="round"/><circle cx="14" cy="28" r="0" fill="none"/>' +
        '<path d="M-16 28c0 18 24 26 40 10" fill="none" stroke="#dfe7e2" stroke-width="6" stroke-linecap="round"/><circle class="late" cx="30" cy="34" r="12" fill="' + C.oroC + '" stroke="#fff" stroke-width="3"/></g>' +
        '<text x="200" y="244" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#fff" letter-spacing="3">RESIDENTES</text>';
    },
    viaje: function () {
      return '<circle class="late" cx="320" cy="62" r="26" fill="#ffd166"/>' +
        '<g class="flota"><ellipse cx="90" cy="60" rx="34" ry="12" fill="#fff" opacity=".9"/><ellipse cx="112" cy="52" rx="22" ry="12" fill="#fff" opacity=".9"/></g>' +
        '<g class="flota" style="animation-delay:1s"><ellipse cx="230" cy="40" rx="28" ry="10" fill="#fff" opacity=".8"/></g>' +
        '<path d="M0 200 80 120l50 50 60-80 80 90 50-40 80 60v60H0z" fill="#1B3F2C"/><path d="M190 90l24 30-14-6-10 12-10-12-14 6z" fill="#fff" opacity=".85"/>' +
        '<path d="M0 230c80-24 160-24 240-8s120 10 160 0v38H0z" fill="#2E7D4F"/>' +
        '<g class="vuela"><g transform="translate(0 92)"><path d="M0 8h46l14-8 4 2-8 10h-8l-18 14h-8l10-14H8z" fill="#fff"/><path d="M14 8 6 0h6l12 8z" fill="#e0e0e0"/></g></g>' +
        '<g class="hov hov-up"><g transform="translate(150 200)"><rect width="100" height="32" rx="6" fill="' + C.oroC + '"/><rect x="8" y="6" width="16" height="12" rx="2" fill="#bde0fe"/><rect x="30" y="6" width="16" height="12" rx="2" fill="#bde0fe"/><rect x="52" y="6" width="16" height="12" rx="2" fill="#bde0fe"/><rect x="76" y="6" width="16" height="18" rx="2" fill="#bde0fe"/><circle cx="22" cy="34" r="7" fill="#222"/><circle cx="78" cy="34" r="7" fill="#222"/><text x="50" y="29" text-anchor="middle" font-size="7" font-weight="700" fill="#4a2433">CLEMI</text></g></g>';
    },
    amistad: function () {
      var cor = function (x, y, s, col, cls, d) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path class="' + cls + '" style="animation-delay:' + d + 's" d="M0 30C-40 2-36-26-14-26-4-26 0-16 0-12 0-16 4-26 14-26 36-26 40 2 0 30z" fill="' + col + '" stroke="#fff" stroke-width="2"/></g>'; };
      return estrellas(8, 3) + '<g class="hov hov-izq">' + cor(160, 120, 2, '#ff4d6d', 'late', 0) + '</g><g class="hov hov-der">' + cor(240, 128, 1.7, '#ffccd5', 'late', .3) + '</g>' +
        cor(70, 60, .8, '#ff8fa3', 'flota', .5) + cor(330, 70, .7, '#fff', 'flota', 1) + cor(340, 190, .6, '#ff4d6d', 'flota', .2) + cor(60, 190, .6, '#ffccd5', 'flota', .8) +
        '<text x="200" y="244" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#fff" letter-spacing="3">AMOR Y AMISTAD</text>';
    },
    brujitas: function () {
      var mur = function (x, y, s, d) { return '<g class="flota" style="animation-delay:' + d + 's" transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="aleteo"><path d="M0 0c-8-10-20-12-30-6 6 2 8 8 6 12 4-4 12-4 14 2 2-6 6-8 10-8 4 0 8 2 10 8 2-6 10-6 14-2-2-4 0-10 6-12C20-12 8-10 0 0z" fill="#111"/></g></g>'; };
      var cal = function (x, s, d) { return '<g class="hov hov-gro" transform="translate(' + x + ' 208) scale(' + s + ')"><g class="late" style="animation-delay:' + d + 's"><ellipse rx="26" ry="20" fill="#f77f00"/><path d="M-10 -20c0 14 0 26 0 40M10-20c0 14 0 26 0 40" stroke="#c75b00" stroke-width="2" fill="none"/><path d="M-12-4l6-6 6 6zM2-4l6-6 6 6z" fill="#1a0f2e"/><path d="M-12 6q12 10 24 0l-4 6-4-3-4 3-4-3-4 3z" fill="#1a0f2e"/><path d="M0-20c0-6 4-10 8-10" stroke="#2E7D4F" stroke-width="3" fill="none"/></g></g>'; };
      return estrellas(12, 4) + '<circle cx="310" cy="64" r="34" fill="#fcbf49"/><circle cx="294" cy="54" r="30" fill="#24123d"/>' +
        mur(100, 60, 1, 0) + mur(200, 40, .7, .4) + mur(260, 90, .8, .8) +
        '<g class="vaiven" transform="translate(200 150)"><path d="M-52 34h104c-10-6-30-10-52-10s-42 4-52 10z" fill="#3c096c"/><path d="M-26 26 6-66l10 22-6 6 18 62z" fill="#5a189a"/><rect x="-26" y="18" width="52" height="8" fill="#f77f00"/></g>' +
        cal(110, 1, 0) + cal(290, .8, .5) + '<path d="M0 230h400v30H0z" fill="#10091d"/>';
    },
    despedida: function () {
      var luces = ''; for (var i = 0; i < 12; i++) { var x = 20 + i * 33, y = 28 + Math.sin(i / 1.5) * 10; luces += '<circle class="brilla" style="animation-delay:' + (i % 4) * .35 + 's" cx="' + x + '" cy="' + y + '" r="5" fill="' + [C.oroC, '#e63946', '#2a9d8f', '#ffffff'][i % 4] + '"/>'; }
      return '<path d="M0 24q200 30 400 0" stroke="#fff" stroke-opacity=".4" fill="none"/>' + luces + estrellas(10, 5) +
        '<g class="hov hov-up" transform="translate(200 160)"><g class="flota"><rect x="-34" y="-20" width="68" height="54" rx="4" fill="#e63946"/><rect x="-6" y="-20" width="12" height="54" fill="' + C.oroC + '"/><rect x="-38" y="-30" width="76" height="14" rx="3" fill="#c1121f"/><rect x="-6" y="-30" width="12" height="14" fill="' + C.oroC + '"/>' +
        '<path d="M0-30c-18-22-34-8-18 0zM0-30c18-22 34-8 18 0z" fill="none" stroke="' + C.oroC + '" stroke-width="5"/></g></g>' +
        '<g class="gira" transform="translate(84 130)"><path d="M0-24 6-7 24-7 10 4 15 22 0 11-15 22-10 4-24-7-6-7z" fill="' + C.oroC + '"/></g>' +
        '<g class="gira" style="animation-duration:20s" transform="translate(320 140) scale(.7)"><path d="M0-24 6-7 24-7 10 4 15 22 0 11-15 22-10 4-24-7-6-7z" fill="#fff"/></g>' +
        '<text x="200" y="244" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="' + C.oroC + '" letter-spacing="3">DESPEDIDA CLEMI</text>';
    },
    celebracion: function () {
      var glob = function (x, y, col, d) { return '<g class="flota" style="animation-delay:' + d + 's"><ellipse cx="' + x + '" cy="' + y + '" rx="22" ry="28" fill="' + col + '"/><path d="M' + x + ' ' + (y + 28) + 'q-6 30 4 60" stroke="#fff" stroke-opacity=".7" fill="none"/></g>'; };
      return estrellas(10, 6) + '<g class="hov hov-up">' + glob(120, 100, C.oroC, 0) + glob(200, 80, '#e63946', .4) + glob(280, 105, '#2a9d8f', .8) + '</g>' +
        '<text x="200" y="244" text-anchor="middle" font-family="Georgia,serif" font-size="15" fill="#fff" letter-spacing="3">CELEBRACIÓN</text>';
    }
  };
  var n = 0;
  function html(tema) {
    var t = TEMAS[tema] || TEMAS.celebracion, id = 'eva' + (++n);
    return '<div class="eva" data-eva="' + (TEMAS[tema] ? tema : 'celebracion') + '" role="img" aria-label="' + t.nombre + '"><svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice">' + fondo(t, id) + DIBUJO[TEMAS[tema] ? tema : 'celebracion']() + '</svg><span class="tip">Toque la imagen</span></div>';
  }

  // Lluvia de figuras al tocar
  function figura(x, tipo, col) {
    x.fillStyle = col; x.strokeStyle = col; x.beginPath();
    if (tipo === 'corazon') { x.moveTo(0, 6); x.bezierCurveTo(-12, -2, -8, -12, 0, -6); x.bezierCurveTo(8, -12, 12, -2, 0, 6); x.fill(); }
    else if (tipo === 'estrella') { for (var i = 0; i < 10; i++) { var r = i % 2 ? 4 : 9, a = i * Math.PI / 5 - Math.PI / 2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); }
    else if (tipo === 'murcielago') { x.moveTo(0, 0); x.quadraticCurveTo(-8, -8, -16, -2); x.quadraticCurveTo(-10, 0, -8, 4); x.quadraticCurveTo(-4, 1, 0, 4); x.quadraticCurveTo(4, 1, 8, 4); x.quadraticCurveTo(10, 0, 16, -2); x.quadraticCurveTo(8, -8, 0, 0); x.fill(); }
    else if (tipo === 'birrete') { x.moveTo(-10, 0); x.lineTo(0, -5); x.lineTo(10, 0); x.lineTo(0, 5); x.closePath(); x.fill(); x.fillRect(-5, 2, 10, 5); }
    else if (tipo === 'nube') { x.arc(-5, 0, 6, 0, 7); x.arc(4, -2, 7, 0, 7); x.arc(10, 2, 5, 0, 7); x.fill(); }
    else if (tipo === 'dulce') { x.arc(0, 0, 5, 0, 7); x.fill(); x.moveTo(5, 0); x.lineTo(10, -4); x.lineTo(10, 4); x.moveTo(-5, 0); x.lineTo(-10, -4); x.lineTo(-10, 4); x.fill(); }
    else if (tipo === 'pieza') { x.fillRect(-6, -6, 12, 12); x.arc(0, -6, 3, 0, 7); x.fill(); }
    else { x.fillRect(-4, -2, 8, 4); }
  }
  function lluvia(raiz, ev) {
    var t = TEMAS[raiz.getAttribute('data-eva')] || TEMAS.celebracion;
    var cv = raiz.querySelector('canvas'); if (!cv) { cv = document.createElement('canvas'); raiz.appendChild(cv); }
    var b = raiz.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = b.width * dpr; cv.height = b.height * dpr;
    var x = cv.getContext('2d'), ox = ev ? (ev.clientX - b.left) : b.width / 2, oy = ev ? (ev.clientY - b.top) : b.height / 2;
    var P = []; for (var i = 0; i < 46; i++) { var a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 5; P.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, r: Math.random() * 6, vr: (Math.random() - .5) * .3, s: .7 + Math.random() * .9, f: t.fig[i % t.fig.length], c: t.colores[i % t.colores.length], vida: 1 }); }
    var ini = performance.now();
    (function paso(ts) {
      var el = (ts - ini) / 1000; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height); x.scale(dpr, dpr);
      P.forEach(function (p) { p.vy += .12; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vida = Math.max(0, 1 - el / 1.8); x.save(); x.globalAlpha = p.vida; x.translate(p.x, p.y); x.rotate(p.r); x.scale(p.s, p.s); figura(x, p.f, p.c); x.restore(); });
      if (el < 1.8) requestAnimationFrame(paso); else x.clearRect(0, 0, cv.width, cv.height);
    })(ini);
  }
  function activar(raiz) {
    (raiz || document).querySelectorAll('.eva:not([data-on])').forEach(function (el) { el.setAttribute('data-on', '1'); el.addEventListener('click', function (e) { e.stopPropagation(); lluvia(el, e); }); });
  }
  window.EvArte = { html: html, activar: activar, temas: function () { var o = {}; Object.keys(TEMAS).forEach(function (k) { o[k] = TEMAS[k].nombre; }); return o; } };
})();
