/* =====================================================================
   CLEMI · Plano de salas — dibujo y editor de distribución
   Unidades: centímetros. Plano visto desde arriba; el borde superior
   es la pared del fondo que se ve en la fotografía de la sala.
   ===================================================================== */
(function () {
  'use strict';

  var FEATURES = {
    puerta:      { nombre: 'Puerta', w: 14, h: 100 },
    ventana:     { nombre: 'Ventana', w: 14, h: 120 },
    ventana_int: { nombre: 'Ventana interior', w: 14, h: 120 },
    columna:     { nombre: 'Columna', w: 60, h: 60 },
    tv:          { nombre: 'TV / monitor de pared', w: 14, h: 120 },
    pantalla:    { nombre: 'Pantalla de proyección', w: 250, h: 14 },
    rejilla:     { nombre: 'Rejilla de piso', w: 40, h: 100 },
    toma:        { nombre: 'Toma de piso', w: 20, h: 20 },
    aire:        { nombre: 'Aire acondicionado', w: 110, h: 40 },
    ventilador:  { nombre: 'Ventilador de pared', w: 40, h: 40 },
    extintor:    { nombre: 'Extintor', w: 24, h: 24 },
    lavamanos:   { nombre: 'Lavamanos', w: 90, h: 50 }
  };
  var FORMAS = {
    camilla_cuerpo: 'Camilla con cuerpo', camilla: 'Camilla', mesa: 'Mesa', torre: 'Torre de equipo',
    monitor: 'Monitor', arco: 'Arco en C', caja: 'Caja / carro', circulo: 'Circular',
    persona: 'Persona (personaje)', mesa_aud: 'Mesa de auditorio', silla: 'Silla'
  };
  // Inicial que identifica a cada personaje según su nombre
  function inicialPersona(n) {
    n = (n || '').toLowerCase();
    if (/doctor|m[eé]dic|cirujan/.test(n)) return 'D';
    if (/instrument/.test(n)) return 'I';
    if (/tanat/.test(n)) return 'T';
    if (/staff|apoyo|personal/.test(n)) return 'S';
    return (n.trim()[0] || 'P').toUpperCase();
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function aclarar(hex, t) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    r = Math.round(r + (255 - r) * t); g = Math.round(g + (255 - g) * t); b = Math.round(b + (255 - b) * t);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function m(cm) { return (cm / 100).toFixed(1).replace('.', ','); }

  // Motas de terrazo deterministas (mismo patrón en todos los navegadores)
  var TERRAZO = (function () {
    var s = 7, out = '', cols = ['#b9b2a6', '#9a9489', '#d6cfc2', '#8c8a86', '#c9b99a'];
    function r() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    for (var i = 0; i < 70; i++) {
      out += '<circle cx="' + (r() * 160).toFixed(1) + '" cy="' + (r() * 160).toFixed(1) + '" r="' + (0.8 + r() * 2.6).toFixed(1) + '" fill="' + cols[Math.floor(r() * cols.length)] + '"/>';
    }
    return out;
  })();

  function defs(uid) {
    return '<defs>' +
      '<pattern id="terr' + uid + '" width="160" height="160" patternUnits="userSpaceOnUse"><rect width="160" height="160" fill="#f3f1ec"/>' + TERRAZO + '</pattern>' +
      '<pattern id="rej' + uid + '" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#8f978f"/><rect width="8" height="3" fill="#5f675f"/></pattern>' +
      '<pattern id="hatch' + uid + '" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#e3e5e1"/><line x1="0" y1="0" x2="0" y2="10" stroke="#b4bab3" stroke-width="3"/></pattern>' +
      '<filter id="sh' + uid + '" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="3" dy="5" stdDeviation="4" flood-color="#1b2a20" flood-opacity=".28"/></filter>' +
      '</defs>';
  }

  function pared(f, sala) {
    if (f.x <= 20) return 'izq';
    if (f.x + f.w >= sala.ancho - 20) return 'der';
    if (f.y <= 20) return 'arr';
    return 'aba';
  }

  function dibujarFeature(f, sala, uid, i, sel) {
    var x = f.x, y = f.y, w = f.w, h = f.h, s = '', lab = f.label || '';
    switch (f.t) {
      case 'columna':
        s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="url(#hatch' + uid + ')" stroke="#7d877e" stroke-width="3"/>'; break;
      case 'puerta':
        var p = pared(f, sala), L = Math.max(w, h), arc = '';
        if (p === 'izq') arc = 'M' + (x + w) + ' ' + y + ' L' + (x + w + L) + ' ' + y + ' A' + L + ' ' + L + ' 0 0 1 ' + (x + w) + ' ' + (y + h);
        else if (p === 'der') arc = 'M' + x + ' ' + y + ' L' + (x - L) + ' ' + y + ' A' + L + ' ' + L + ' 0 0 0 ' + x + ' ' + (y + h);
        else if (p === 'arr') arc = 'M' + x + ' ' + (y + h) + ' L' + x + ' ' + (y + h + L) + ' A' + L + ' ' + L + ' 0 0 0 ' + (x + w) + ' ' + (y + h);
        else arc = 'M' + x + ' ' + y + ' L' + x + ' ' + (y - L) + ' A' + L + ' ' + L + ' 0 0 1 ' + (x + w) + ' ' + y;
        s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#fff" stroke="#C6A13B" stroke-width="3"/>' +
            '<path d="' + arc + '" fill="rgba(198,161,59,.08)" stroke="#C6A13B" stroke-width="2.5" stroke-dasharray="8 6"/>'; break;
      case 'ventana': case 'ventana_int':
        var hor = w >= h;
        s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#cfe6ef" stroke="#5a8fa8" stroke-width="3"' + (f.t === 'ventana_int' ? ' stroke-dasharray="10 5"' : '') + '/>' +
            (hor ? '<line x1="' + x + '" y1="' + (y + h / 2) + '" x2="' + (x + w) + '" y2="' + (y + h / 2) + '" stroke="#5a8fa8" stroke-width="2"/>'
                 : '<line x1="' + (x + w / 2) + '" y1="' + y + '" x2="' + (x + w / 2) + '" y2="' + (y + h) + '" stroke="#5a8fa8" stroke-width="2"/>'); break;
      case 'tv':
        s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3" fill="#1e2522" stroke="#000" stroke-width="2"/>'; break;
      case 'pantalla':
        s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#4d63d8" stroke="#2c3b91" stroke-width="2"/>'; break;
      case 'rejilla':
        s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3" fill="url(#rej' + uid + ')" stroke="#4d554e" stroke-width="2"/>'; break;
      case 'toma':
        s = '<circle cx="' + (x + w / 2) + '" cy="' + (y + h / 2) + '" r="' + (w / 2) + '" fill="#39413b"/><circle cx="' + (x + w / 2) + '" cy="' + (y + h / 2) + '" r="' + (w / 5) + '" fill="#9aa39d"/>'; break;
      case 'aire':
        s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="#eef1ef" stroke="#8e978f" stroke-width="2.5"/>' +
            '<line x1="' + (x + 8) + '" y1="' + (y + h * .35) + '" x2="' + (x + w - 8) + '" y2="' + (y + h * .35) + '" stroke="#8e978f" stroke-width="2"/>' +
            '<line x1="' + (x + 8) + '" y1="' + (y + h * .65) + '" x2="' + (x + w - 8) + '" y2="' + (y + h * .65) + '" stroke="#8e978f" stroke-width="2"/>'; break;
      case 'ventilador':
        var cx = x + w / 2, cy = y + h / 2, r = w / 2;
        s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#e6e9e7" stroke="#39413b" stroke-width="2"/>' +
            '<path d="M' + cx + ' ' + cy + ' l0 -' + (r * .8) + ' q' + (r * .4) + ' ' + (r * .2) + ' 0 ' + (r * .8) + 'M' + cx + ' ' + cy + ' l' + (r * .7) + ' ' + (r * .4) + ' q-' + (r * .1) + ' ' + (r * .4) + ' -' + (r * .7) + ' -' + (r * .4) + 'M' + cx + ' ' + cy + ' l-' + (r * .7) + ' ' + (r * .4) + ' q-' + (r * .2) + ' -' + (r * .4) + ' ' + (r * .7) + ' -' + (r * .4) + '" fill="#39413b"/>'; break;
      case 'extintor':
        s = '<circle cx="' + (x + w / 2) + '" cy="' + (y + h / 2) + '" r="' + (w / 2) + '" fill="#c0392b" stroke="#7b1e14" stroke-width="2"/>'; break;
      case 'lavamanos':
        s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="#f7f8f7" stroke="#8e978f" stroke-width="2.5"/><ellipse cx="' + (x + w / 2) + '" cy="' + (y + h / 2) + '" rx="' + (w * .32) + '" ry="' + (h * .3) + '" fill="#dfe7ea" stroke="#8e978f" stroke-width="2"/>'; break;
      default:
        s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#ddd" stroke="#888"/>';
    }
    var selRect = sel ? '<rect x="' + (x - 8) + '" y="' + (y - 8) + '" width="' + (w + 16) + '" height="' + (h + 16) + '" fill="none" stroke="#C6A13B" stroke-width="4" stroke-dasharray="10 6" class="pl-sel"/>' : '';
    return '<g class="pl-f" data-i="' + i + '"' + (lab ? '><title>' + esc(lab) + '</title>' : '>') + s + selRect + '</g>';
  }

  function dibujarForma(c, w, h) {
    var col = c.color || '#7A8B80', hw = w / 2, hh = h / 2, s = '';
    switch (c.forma) {
      case 'camilla_cuerpo':
      case 'camilla':
        s = '<rect x="' + (-hw) + '" y="' + (-hh) + '" width="' + w + '" height="' + h + '" rx="10" fill="#dfe4e1" stroke="#6f7a72" stroke-width="3"/>' +
            '<rect x="' + (-hw + 6) + '" y="' + (-hh + 6) + '" width="' + (w - 12) + '" height="' + (h - 12) + '" rx="7" fill="' + aclarar(col, .72) + '" stroke="' + col + '" stroke-width="2"/>';
        [[-hw + 10, -hh + 4], [hw - 10, -hh + 4], [-hw + 10, hh - 4], [hw - 10, hh - 4]].forEach(function (p) {
          s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="#39413b"/>';
        });
        if (c.forma === 'camilla_cuerpo') {
          var bh = h * .56, head = Math.min(bh * .42, 17);
          s += '<circle cx="' + (-hw + 16 + head) + '" cy="0" r="' + head + '" fill="#efe6d2" stroke="#b09c77" stroke-width="2"/>' +
               '<rect x="' + (-hw + 22 + head * 2) + '" y="' + (-bh / 2) + '" width="' + (w - 44 - head * 2) + '" height="' + bh + '" rx="' + (bh / 2) + '" fill="#efe6d2" stroke="#b09c77" stroke-width="2"/>' +
               '<rect x="' + (-hw + 34 + head * 2) + '" y="' + (-bh / 2 - 3) + '" width="' + (w * .46) + '" height="' + (bh + 6) + '" rx="8" fill="' + col + '" opacity=".85"/>';
        }
        break;
      case 'mesa':
        s = '<rect x="' + (-hw) + '" y="' + (-hh) + '" width="' + w + '" height="' + h + '" rx="4" fill="' + aclarar(col, .55) + '" stroke="' + col + '" stroke-width="3"/>';
        for (var k = 1; k < 5; k++) {
          var xx = -hw + w * k / 5;
          s += '<line x1="' + xx + '" y1="' + (-hh + 10) + '" x2="' + (xx + 6) + '" y2="' + (hh - 10) + '" stroke="#6f7a72" stroke-width="2.5" stroke-linecap="round"/>';
        }
        break;
      case 'torre':
        s = '<rect x="' + (-hw) + '" y="' + (-hh) + '" width="' + w + '" height="' + h + '" rx="6" fill="' + col + '" stroke="#0b2233" stroke-width="3"/>' +
            '<rect x="' + (-hw + 6) + '" y="' + (-hh + 6) + '" width="' + (w - 12) + '" height="' + (h * .3) + '" rx="3" fill="#0e1a22"/>' +
            '<circle cx="' + (hw - 12) + '" cy="' + (hh - 12) + '" r="4" fill="#7fe0a0"/>';
        break;
      case 'monitor':
        s = '<rect x="' + (-hw) + '" y="' + (-hh) + '" width="' + w + '" height="' + h + '" rx="6" fill="' + aclarar(col, .6) + '" stroke="' + col + '" stroke-width="3"/>' +
            '<rect x="' + (-hw + 4) + '" y="' + (-hh - 6) + '" width="' + (w - 8) + '" height="12" rx="3" fill="#10181d"/>';
        break;
      case 'arco':
        s = '<rect x="' + (hw - w * .3) + '" y="' + (-hh) + '" width="' + (w * .3) + '" height="' + h + '" rx="6" fill="' + aclarar(col, .5) + '" stroke="' + col + '" stroke-width="3"/>' +
            '<path d="M' + (hw - w * .3) + ' ' + (-hh * .7) + ' L' + (-hw + h * .35) + ' ' + (-hh * .7) + ' A' + (hh * .7) + ' ' + (hh * .7) + ' 0 0 0 ' + (-hw + h * .35) + ' ' + (hh * .7) + ' L' + (hw - w * .3) + ' ' + (hh * .7) + '" fill="none" stroke="' + col + '" stroke-width="12" stroke-linecap="round"/>';
        break;
      case 'persona':
        var ini = inicialPersona(c.nombre), bata = /^D$/.test(ini);
        s = '<ellipse cx="0" cy="2" rx="' + hw + '" ry="' + hh + '" fill="' + (bata ? '#f7f7f4' : col) + '" stroke="' + (bata ? col : '#1b2a20') + '" stroke-width="' + (bata ? 4 : 2) + '"/>' +
            (bata ? '<ellipse cx="0" cy="2" rx="' + (hw * 0.45) + '" ry="' + (hh * 0.8) + '" fill="' + col + '"/>' : '') +
            '<circle cx="' + (-hw * 0.78) + '" cy="' + (hh * 0.35) + '" r="' + (hh * 0.32) + '" fill="#d9c2a0" stroke="#1b2a20" stroke-width="1.5"/>' +
            '<circle cx="' + (hw * 0.78) + '" cy="' + (hh * 0.35) + '" r="' + (hh * 0.32) + '" fill="#d9c2a0" stroke="#1b2a20" stroke-width="1.5"/>' +
            '<circle r="' + (hh * 0.62) + '" fill="' + col + '" stroke="#fff" stroke-width="3"/>' +
            '<text y="' + (hh * 0.24) + '" text-anchor="middle" font-family="Source Sans 3, Segoe UI, sans-serif" font-weight="800" font-size="' + (hh * 0.72) + '" fill="#fff">' + ini + '</text>' +
            '<path d="M-6 ' + (hh + 2) + ' L0 ' + (hh + 10) + ' L6 ' + (hh + 2) + 'Z" fill="' + col + '"/>';
        break;
      case 'mesa_aud':
        s = '<rect x="' + (-hw) + '" y="' + (-hh) + '" width="' + w + '" height="' + h + '" rx="3" fill="#c79b6b" stroke="#8a6238" stroke-width="3"/>' +
            '<line x1="' + (-hw + 8) + '" y1="' + (-hh + 8) + '" x2="' + (hw - 8) + '" y2="' + (-hh + 8) + '" stroke="#e2c59e" stroke-width="2"/>';
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { s += '<rect x="' + (p[0] * (hw - 8) - 3) + '" y="' + (p[1] * (hh - 6) - 3) + '" width="6" height="6" fill="#4b4f4c"/>'; });
        break;
      case 'silla':
        s = '<rect x="' + (-hw) + '" y="' + (-hh) + '" width="' + w + '" height="' + h + '" rx="6" fill="' + aclarar(col, .35) + '" stroke="' + col + '" stroke-width="3"/>' +
            '<rect x="' + (-hw) + '" y="' + (-hh) + '" width="' + w + '" height="' + (h * 0.22) + '" rx="4" fill="' + col + '"/>';
        break;
      case 'circulo':
        var r = Math.min(w, h) / 2;
        s = '<circle r="' + r + '" fill="' + aclarar(col, .45) + '" stroke="' + col + '" stroke-width="3"/><circle r="' + (r * .35) + '" fill="' + col + '"/>';
        break;
      default:
        s = '<rect x="' + (-hw) + '" y="' + (-hh) + '" width="' + w + '" height="' + h + '" rx="5" fill="' + aclarar(col, .55) + '" stroke="' + col + '" stroke-width="3"/>' +
            '<line x1="' + (-hw + 6) + '" y1="0" x2="' + (hw - 6) + '" y2="0" stroke="' + col + '" stroke-width="2"/>';
    }
    return s;
  }

  function catIdx(catalogo) {
    var o = {}; (catalogo || []).forEach(function (c) { o[c.id] = c; }); return o;
  }

  /* Dibuja el plano completo como texto SVG.
     o = { sala, plano, items, catalogo, sel, selF, uid, etiquetas, cotas } */
  function svg(o) {
    var s = o.sala, W = +s.ancho, H = +s.largo, uid = o.uid || Math.random().toString(36).slice(2, 7);
    var cats = catIdx(o.catalogo), pad = 70;
    var out = '<svg xmlns="http://www.w3.org/2000/svg" class="pl-svg" viewBox="' + (-pad) + ' ' + (-pad) + ' ' + (W + pad * 2) + ' ' + (H + pad * 2) + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Plano de ' + esc(s.nombre) + '">';
    out += defs(uid);
    out += '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#terr' + uid + ')"/>';
    // cuadrícula de 1 m
    var g = '';
    for (var x = 100; x < W; x += 100) g += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + H + '"/>';
    for (var y = 100; y < H; y += 100) g += '<line x1="0" y1="' + y + '" x2="' + W + '" y2="' + y + '"/>';
    out += '<g stroke="#9fae9f" stroke-opacity=".28" stroke-width="1.5">' + g + '</g>';
    out += '<rect x="-8" y="-8" width="' + (W + 16) + '" height="' + (H + 16) + '" fill="none" stroke="#2c3a30" stroke-width="16"/>';
    // arquitectura
    (o.plano || []).forEach(function (f, i) { out += dibujarFeature(f, s, uid, i, o.selF === i); });
    // cotas
    if (o.cotas !== false) {
      out += '<g font-family="Source Sans 3, Segoe UI, sans-serif" font-size="30" fill="#4a5a4f" text-anchor="middle">' +
        '<text x="' + (W / 2) + '" y="' + (-28) + '">' + m(W) + ' m</text>' +
        '<text transform="translate(' + (-28) + ' ' + (H / 2) + ') rotate(-90)">' + m(H) + ' m</text>' +
        '<text x="' + (W / 2) + '" y="' + (H + 52) + '" font-size="24" fill="#8a968d">PUERTA DE LA FOTO · el largo se mide desde aquí</text></g>';
    }
    // elementos
    (o.items || []).forEach(function (it, i) {
      var c = cats[it.cat] || { forma: 'caja', color: '#999', ancho: 60, largo: 60, nombre: 'Elemento' };
      var w = +c.ancho, h = +c.largo, sel = o.sel === i;
      out += '<g class="pl-i' + (sel ? ' is-sel' : '') + '" data-i="' + i + '" transform="translate(' + it.x + ' ' + it.y + ') rotate(' + (it.r || 0) + ')" filter="url(#sh' + uid + ')">' +
        '<title>' + esc(c.nombre + (it.label ? ' · ' + it.label : '')) + '</title>' +
        '<rect x="' + (-w / 2 - 10) + '" y="' + (-h / 2 - 10) + '" width="' + (w + 20) + '" height="' + (h + 20) + '" fill="transparent"/>' +
        dibujarForma(c, w, h) +
        (sel ? '<rect x="' + (-w / 2 - 9) + '" y="' + (-h / 2 - 9) + '" width="' + (w + 18) + '" height="' + (h + 18) + '" rx="10" fill="none" stroke="#C6A13B" stroke-width="5" stroke-dasharray="12 7"/>' : '') +
        '</g>';
    });
    if (o.etiquetas !== false) {
      out += '<g font-family="Source Sans 3, Segoe UI, sans-serif" font-weight="700" text-anchor="middle" pointer-events="none">';
      (o.items || []).forEach(function (it) {
        if (!it.label) return;
        var c = cats[it.cat] || { ancho: 60, largo: 60 };
        var rr = ((it.r || 0) % 180 + 180) % 180, ext = (rr > 45 && rr < 135) ? c.ancho / 2 : c.largo / 2;
        out += '<text x="' + it.x + '" y="' + (it.y + ext + 34) + '" font-size="26" fill="#16301f" stroke="#fff" stroke-width="7" paint-order="stroke" stroke-linejoin="round">' + esc(it.label) + '</text>';
      });
      out += '</g>';
    }
    return out + '</svg>';
  }

  function resumen(items, catalogo) {
    var cats = catIdx(catalogo), r = {};
    (items || []).forEach(function (it) { var n = (cats[it.cat] || {}).nombre || 'Elemento'; r[n] = (r[n] || 0) + 1; });
    return Object.keys(r).sort().map(function (k) { return { nombre: k, n: r[k], color: (catalogo.find(function (c) { return c.nombre === k; }) || {}).color }; });
  }

  /* ------------------------------------------------------------------
     Editor interactivo
     opts = { sala, plano, items, catalogo, modo: 'items'|'plano', editable, onChange(items|plano) }
     ------------------------------------------------------------------ */
  function Editor(host, opts) {
    this.host = host; this.o = opts;
    this.items = JSON.parse(JSON.stringify(opts.items || []));
    this.plano = JSON.parse(JSON.stringify(opts.plano || []));
    this.sel = -1; this.vista = 'plano'; this.uid = 'e' + Math.random().toString(36).slice(2, 7);
    this.montar();
  }
  Editor.prototype.lista = function () { return this.o.modo === 'plano' ? this.plano : this.items; };
  Editor.prototype.montar = function () {
    var self = this, o = this.o, ed = o.editable;
    var paleta = '';
    if (ed) {
      if (o.modo === 'plano') {
        paleta = Object.keys(FEATURES).map(function (k) {
          return '<button type="button" class="pl-chip" data-add-f="' + k + '"><span class="pl-sw pl-sw-' + k + '"></span>' + FEATURES[k].nombre + '</button>';
        }).join('');
      } else {
        paleta = (o.catalogo || []).filter(function (c) { return +c.activo; }).map(function (c) {
          return '<button type="button" class="pl-chip" data-add="' + c.id + '"><span class="pl-sw" style="background:' + esc(c.color) + '"></span>' + esc(c.nombre) + '</button>';
        }).join('');
      }
    }
    this.host.innerHTML =
      '<div class="pl-wrap">' +
      (ed ? '<div class="pl-paleta"><span class="pl-paleta-t">' + (o.modo === 'plano' ? 'Agregar elemento fijo' : 'Agregar a la sala') + '</span>' + paleta + '</div>' : '') +
      '<div class="pl-barra">' +
        '<div class="pl-vistas" role="group" aria-label="Vista"><button type="button" class="is-on" data-vista="plano">Plano</button><button type="button" data-vista="3d">Vista 3D</button></div>' +
        '<div class="pl-selbar" hidden></div>' +
      '</div>' +
      '<div class="pl-stage" tabindex="0"><div class="pl-persp"></div></div>' +
      '<div class="pl-3d" hidden></div>' +
      '<div class="pl-resumen"></div>' +
      '</div>';
    this.stage = this.host.querySelector('.pl-stage');
    this.persp = this.host.querySelector('.pl-persp');
    this.selbar = this.host.querySelector('.pl-selbar');
    this.host.querySelectorAll('[data-add]').forEach(function (b) {
      b.addEventListener('click', function () { self.agregar(+b.getAttribute('data-add')); });
    });
    this.host.querySelectorAll('[data-add-f]').forEach(function (b) {
      b.addEventListener('click', function () { self.agregarF(b.getAttribute('data-add-f')); });
    });
    this.host.querySelectorAll('[data-vista]').forEach(function (b) {
      b.addEventListener('click', function () {
        self.vista = b.getAttribute('data-vista');
        self.host.querySelectorAll('[data-vista]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        var d3 = self.host.querySelector('.pl-3d'), en3d = self.vista === '3d' && window.Plano3D;
        if (self.v3) { self.v3.destruir(); self.v3 = null; }
        self.stage.hidden = !!en3d; d3.hidden = !en3d;
        if (self.vista === '3d') self.sel = -1;
        self.pintar();
        if (en3d) self.v3 = window.Plano3D.montar(d3, { sala: self.o.sala, plano: self.plano, items: self.items, catalogo: self.o.catalogo });
        else self.stage.classList.toggle('is-3d', self.vista === '3d');
      });
    });
    this.stage.addEventListener('keydown', function (e) { self.tecla(e); });
    this.pintar();
  };
  Editor.prototype.cats = function () { return catIdx(this.o.catalogo); };
  Editor.prototype.pintar = function () {
    var o = this.o, plano = this.o.modo === 'plano';
    this.persp.innerHTML = svg({ sala: o.sala, plano: this.plano, items: this.items, catalogo: o.catalogo, uid: this.uid,
      sel: plano ? -1 : this.sel, selF: plano ? this.sel : -1 });
    this.svg = this.persp.querySelector('svg');
    this.enlazar();
    this.pintarSel();
    var r = resumen(this.items, o.catalogo);
    this.host.querySelector('.pl-resumen').innerHTML = r.length
      ? r.map(function (x) { return '<span class="pl-tag"><i style="background:' + esc(x.color || '#999') + '"></i>' + x.n + ' × ' + esc(x.nombre) + '</span>'; }).join('')
      : '<span class="pl-vacio">' + (o.editable && !plano ? 'La sala está vacía. Toque un elemento de la lista de arriba para ponerlo en la sala y luego arrástrelo a su lugar.' : 'Sin camillas ni equipos ubicados.') + '</span>';
  };
  Editor.prototype.pt = function (e) {
    var p = this.svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(this.svg.getScreenCTM().inverse());
  };
  Editor.prototype.enlazar = function () {
    var self = this;
    if (!this.o.editable || this.vista === '3d') return;
    var sel = this.o.modo === 'plano' ? '.pl-f' : '.pl-i';
    this.svg.querySelectorAll(sel).forEach(function (g) {
      g.style.cursor = 'grab';
      g.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        var i = +g.getAttribute('data-i'), it = self.lista()[i], p0 = self.pt(e), x0 = it.x, y0 = it.y, movio = false;
        if (self.sel !== i) { self.sel = i; self.pintar(); g = self.svg.querySelector(sel + '[data-i="' + i + '"]'); }
        self.stage.focus({ preventScroll: true });
        var svgEl = self.svg;
        svgEl.setPointerCapture && svgEl.setPointerCapture(e.pointerId);
        function mover(ev) {
          var p = self.pt(ev), nx = Math.round((x0 + p.x - p0.x) / 5) * 5, ny = Math.round((y0 + p.y - p0.y) / 5) * 5;
          if (!movio && Math.abs(p.x - p0.x) + Math.abs(p.y - p0.y) < 4) return;
          movio = true;
          var lim = self.limites(it); it.x = Math.max(lim[0], Math.min(lim[2], nx)); it.y = Math.max(lim[1], Math.min(lim[3], ny));
          if (self.o.modo === 'plano') { var gf = self.svg.querySelector('.pl-f[data-i="' + i + '"]'); if (gf) gf.setAttribute('transform', 'translate(' + (it.x - x0) + ' ' + (it.y - y0) + ')'); }
          else { var gg = self.svg.querySelector('.pl-i[data-i="' + i + '"]'); if (gg) gg.setAttribute('transform', 'translate(' + it.x + ' ' + it.y + ') rotate(' + (it.r || 0) + ')'); }
        }
        function soltar() {
          svgEl.removeEventListener('pointermove', mover); svgEl.removeEventListener('pointerup', soltar); svgEl.removeEventListener('pointercancel', soltar);
          if (movio) { self.pintar(); self.cambio(); }
        }
        svgEl.addEventListener('pointermove', mover); svgEl.addEventListener('pointerup', soltar); svgEl.addEventListener('pointercancel', soltar);
      });
    });
    this.svg.addEventListener('pointerdown', function (e) {
      if (e.target.closest(sel)) return;
      if (self.sel !== -1) { self.sel = -1; self.pintar(); }
    });
  };
  Editor.prototype.limites = function (it) {
    var s = this.o.sala;
    if (this.o.modo === 'plano') return [0, 0, s.ancho - it.w, s.largo - it.h];
    var c = this.cats()[it.cat] || { ancho: 60, largo: 60 }, rr = ((it.r || 0) % 180 + 180) % 180, rad = rr * Math.PI / 180;
    var ex = Math.abs(c.ancho / 2 * Math.cos(rad)) + Math.abs(c.largo / 2 * Math.sin(rad));
    var ey = Math.abs(c.ancho / 2 * Math.sin(rad)) + Math.abs(c.largo / 2 * Math.cos(rad));
    return [ex, ey, s.ancho - ex, s.largo - ey];
  };
  Editor.prototype.cambio = function () { if (this.o.onChange) this.o.onChange(this.o.modo === 'plano' ? this.plano : this.items); };
  Editor.prototype.nuevoId = function () { return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); };
  Editor.prototype.agregar = function (catId) {
    var s = this.o.sala, c = this.cats()[catId] || { ancho: 60, largo: 60 };
    var pos = this.libre(+c.ancho, +c.largo);
    var it = { id: this.nuevoId(), cat: catId, x: pos[0], y: pos[1], r: 0, label: '' };
    if (c && c.forma === 'camilla_cuerpo') {
      var k = this.items.filter(function (x) { var cc = this.cats()[x.cat]; return cc && cc.forma === 'camilla_cuerpo'; }, this).length + 1;
      it.label = 'Estación ' + k;
    }
    this.items.push(it); this.sel = this.items.length - 1; this.pintar(); this.cambio();
  };
  // Busca el primer espacio libre (sin chocar con otros elementos ni con columnas/rejillas)
  Editor.prototype.libre = function (w, h) {
    var s = this.o.sala, cats = this.cats(), cajas = [], m = 25;
    this.items.forEach(function (x) {
      var c = cats[x.cat] || { ancho: 60, largo: 60 }, rr = ((x.r || 0) % 180 + 180) % 180, rot = rr > 45 && rr < 135;
      var ww = rot ? +c.largo : +c.ancho, hh = rot ? +c.ancho : +c.largo;
      cajas.push([x.x - ww / 2, x.y - hh / 2, x.x + ww / 2, x.y + hh / 2]);
    });
    this.plano.forEach(function (f) { if (/columna|rejilla|lavamanos|aire/.test(f.t)) cajas.push([f.x, f.y, f.x + f.w, f.y + f.h]); });
    for (var y = 60 + h / 2; y <= s.largo - 60 - h / 2; y += 25) {
      for (var x = 60 + w / 2; x <= s.ancho - 60 - w / 2; x += 25) {
        var a = [x - w / 2 - m, y - h / 2 - m, x + w / 2 + m, y + h / 2 + m];
        if (!cajas.some(function (b) { return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]; })) return [Math.round(x / 5) * 5, Math.round(y / 5) * 5];
      }
    }
    return [Math.round(s.ancho / 2 / 5) * 5, Math.round(s.largo / 2 / 5) * 5];
  };
  Editor.prototype.agregarF = function (t) {
    var s = this.o.sala, d = FEATURES[t];
    this.plano.push({ t: t, x: Math.round((s.ancho - d.w) / 2), y: Math.round((s.largo - d.h) / 2), w: d.w, h: d.h, label: d.nombre });
    this.sel = this.plano.length - 1; this.pintar(); this.cambio();
  };
  Editor.prototype.pintarSel = function () {
    var self = this, bar = this.selbar, L = this.lista(), it = L[this.sel];
    if (!this.o.editable || !it || this.vista === '3d') { bar.hidden = true; bar.innerHTML = ''; return; }
    bar.hidden = false;
    if (this.o.modo === 'plano') {
      bar.innerHTML = '<strong>' + esc(FEATURES[it.t] ? FEATURES[it.t].nombre : it.t) + '</strong>' +
        '<label>Ancho <input type="number" min="10" step="5" data-k="w" value="' + it.w + '"> cm</label>' +
        '<label>Largo <input type="number" min="10" step="5" data-k="h" value="' + it.h + '"> cm</label>' +
        '<button type="button" data-act="girar" title="Girar 90°">↻ 90°</button>' +
        '<button type="button" data-act="dup">Duplicar</button>' +
        '<button type="button" data-act="del" class="pl-del">Quitar</button>';
    } else {
      var c = this.cats()[it.cat] || { nombre: 'Elemento' };
      bar.innerHTML = '<strong>' + esc(c.nombre) + '</strong>' +
        '<label class="pl-lab">Etiqueta <input type="text" maxlength="60" data-k="label" value="' + esc(it.label || '') + '" placeholder="Ej. Estación 1 · Rodilla"></label>' +
        '<button type="button" data-act="rl" title="Girar 15° a la izquierda">↺ 15°</button>' +
        '<button type="button" data-act="rr" title="Girar 15° a la derecha">↻ 15°</button>' +
        '<button type="button" data-act="r90" title="Girar 90°">↻ 90°</button>' +
        '<button type="button" data-act="dup">Duplicar</button>' +
        '<button type="button" data-act="del" class="pl-del">Quitar</button>';
    }
    bar.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var k = inp.getAttribute('data-k');
        if (k === 'label') it.label = inp.value.trim().slice(0, 60);
        else it[k] = Math.max(10, Math.min(3000, Math.round(+inp.value || 10)));
        self.pintar(); self.cambio();
      });
    });
    bar.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () { self.accion(b.getAttribute('data-act')); });
    });
  };
  Editor.prototype.accion = function (a) {
    var L = this.lista(), it = L[this.sel]; if (!it) return;
    if (a === 'rl') it.r = ((it.r || 0) - 15 + 360) % 360;
    else if (a === 'rr') it.r = ((it.r || 0) + 15) % 360;
    else if (a === 'r90') it.r = ((it.r || 0) + 90) % 360;
    else if (a === 'girar') { var t = it.w; it.w = it.h; it.h = t; }
    else if (a === 'dup') {
      var n = JSON.parse(JSON.stringify(it)); n.x += 30; n.y += 30; if (n.id) n.id = this.nuevoId();
      if (this.o.modo !== 'plano') { var cc = this.cats()[n.cat] || { ancho: 60, largo: 60 }, rr = ((n.r || 0) % 180 + 180) % 180, rot = rr > 45 && rr < 135, lp = this.libre(rot ? +cc.largo : +cc.ancho, rot ? +cc.ancho : +cc.largo); n.x = lp[0]; n.y = lp[1]; }
      if (n.label && /\d+$/.test(n.label) && this.o.modo !== 'plano') n.label = n.label.replace(/\d+$/, function (d) { return +d + 1; });
      L.push(n); this.sel = L.length - 1;
    } else if (a === 'del') { L.splice(this.sel, 1); this.sel = -1; }
    if (this.sel >= 0) { var lim = this.limites(L[this.sel]); var x = L[this.sel]; x.x = Math.max(lim[0], Math.min(lim[2], x.x)); x.y = Math.max(lim[1], Math.min(lim[3], x.y)); }
    this.pintar(); this.cambio();
  };
  Editor.prototype.tecla = function (e) {
    if (!this.o.editable || this.sel < 0 || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    var it = this.lista()[this.sel], d = e.shiftKey ? 50 : 5, k = e.key;
    if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); return this.accion('del'); }
    if (k === 'r' || k === 'R') { e.preventDefault(); return this.accion(this.o.modo === 'plano' ? 'girar' : 'rr'); }
    var mv = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[k];
    if (!mv) return;
    e.preventDefault();
    var lim = this.limites(it);
    it.x = Math.max(lim[0], Math.min(lim[2], it.x + mv[0])); it.y = Math.max(lim[1], Math.min(lim[3], it.y + mv[1]));
    this.pintar(); this.cambio();
  };
  Editor.prototype.valor = function () { return this.o.modo === 'plano' ? this.plano : this.items; };

  window.Plano = { svg: svg, Editor: Editor, resumen: resumen, FEATURES: FEATURES, FORMAS: FORMAS, inicialPersona: inicialPersona };
})();
