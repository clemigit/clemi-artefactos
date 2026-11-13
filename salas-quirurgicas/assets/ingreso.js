/* =====================================================================
   CLEMI · Ingreso de participantes con código QR
   - Genera el QR de cada participante (qrcode-generator).
   - Detecta la lectura de un escáner 2D por teclado (LEXA u otro en modo
     teclado USB/HID): caracteres muy seguidos terminados en Enter.
   - PDF: carnés con QR y check list de ingreso por participante.
   ===================================================================== */
(function () {
  'use strict';
  var MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MESC = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var VERDE = [27, 63, 44], DORADO = [142, 108, 28], ORO_SUAVE = [246, 237, 211], GRIS = [92, 107, 97], TINTA = [28, 42, 33], LINEA = [221, 210, 182];
  function limpio(s) { return String(s == null ? '' : s).replace(/[–—]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/→/g, '->'); }
  function fecha(m) { if (!m) return ''; var p = m.slice(0, 10).split('-'); return +p[2] + ' de ' + MES[+p[1] - 1] + ' de ' + p[0] + (m.length >= 16 ? ' · ' + m.slice(11, 16) : ''); }
  function fcorta(f) { var p = f.split('-'); return +p[2] + ' ' + MESC[+p[1] - 1]; }
  function rango(ev) { return ev.fecha_fin && ev.fecha_fin !== ev.fecha ? fcorta(ev.fecha) + ' al ' + fcorta(ev.fecha_fin) + ' ' + ev.fecha_fin.slice(0, 4) : fecha(ev.fecha); }

  // ---------------------------------------------------------------- QR
  function qrCanvas(texto, px, margen) {
    var q = window.qrcode(0, 'M'); q.addData(String(texto)); q.make();
    var n = q.getModuleCount(), m = margen == null ? 4 : margen, t = Math.max(1, Math.floor(px / (n + m * 2))), lado = t * (n + m * 2);
    var c = document.createElement('canvas'); c.width = c.height = lado; var g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, lado, lado); g.fillStyle = '#10231a';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (q.isDark(y, x)) g.fillRect((x + m) * t, (y + m) * t, t, t);
    return c;
  }
  function qrDataURL(texto, px) { return qrCanvas(texto, px || 360).toDataURL('image/png'); }
  function qrSvg(texto) {
    var q = window.qrcode(0, 'M'); q.addData(String(texto)); q.make();
    var n = q.getModuleCount(), d = '';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (q.isDark(y, x)) d += 'M' + x + ' ' + y + 'h1v1h-1z';
    return '<svg class="qr-svg" viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" shape-rendering="crispEdges" role="img" aria-label="Código QR ' + texto + '"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#fff"/><path d="' + d + '" fill="#10231a"/></svg>';
  }

  // Tarjeta PNG para enviar por WhatsApp / correo
  function tarjetaPNG(p, ev, letras) {
    return new Promise(function (ok) {
      var W = 900, H = 1200, c = document.createElement('canvas'); c.width = W; c.height = H; var g = c.getContext('2d');
      g.fillStyle = '#fffdf8'; g.fillRect(0, 0, W, H);
      var gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#1f3d2e'); gr.addColorStop(1, '#0f231a'); g.fillStyle = gr; g.fillRect(0, 0, W, 190);
      g.fillStyle = '#C6A13B'; g.fillRect(0, 190, W, 8);
      function fin() {
        g.textAlign = 'center'; g.fillStyle = '#1c2a21'; g.font = 'bold 50px Georgia, serif';
        var ln = partir(g, p.nombre + ' ' + (p.apellido || ''), W - 120).slice(0, 2); ln.forEach(function (l, i) { g.fillText(l, W / 2, (ln.length === 1 ? 300 : 280) + i * 58); });
        g.font = '28px sans-serif'; g.fillStyle = '#5c6b61'; g.fillText((p.tipo_doc || 'CC') + ' ' + p.documento + (p.especialidad ? ' · ' + p.especialidad : ''), W / 2, ln.length === 1 ? 360 : 395);
        var q = qrCanvas(p.codigo, 560, 2); g.drawImage(q, (W - q.width) / 2, 430);
        g.font = 'bold 40px monospace'; g.fillStyle = '#10231a'; g.fillText(p.codigo, W / 2, 430 + q.height + 55);
        g.fillStyle = '#2A5A41'; g.font = 'bold 30px sans-serif';
        partir(g, ev.titulo, W - 120).slice(0, 2).forEach(function (l, i) { g.fillText(l, W / 2, 1080 + i * 38); });
        g.font = '24px sans-serif'; g.fillStyle = '#8a6d1f'; g.fillText(rango(ev) + (ev.sala ? ' · ' + ev.sala : ''), W / 2, 1160);
        c.toBlob(function (b) { ok(b); }, 'image/png');
      }
      if (letras) { var im = new Image(); im.onload = function () { var h = 110, w = im.width * h / im.height; g.drawImage(im, (W - w) / 2, 40, w, h); fin(); }; im.onerror = fin; im.src = letras; }
      else { g.fillStyle = '#E8C25B'; g.font = 'bold 80px Georgia, serif'; g.textAlign = 'center'; g.fillText('CLEMI', W / 2, 125); fin(); }
    });
  }
  function partir(g, t, w) { var ps = String(t).split(/\s+/), l = [], a = ''; ps.forEach(function (p) { var x = a ? a + ' ' + p : p; if (g.measureText(x).width > w && a) { l.push(a); a = p; } else a = x; }); if (a) l.push(a); return l; }

  // ---------------------------------------------------------------- escáner (teclado HID)
  // Un escáner en modo teclado "escribe" el código en milisegundos y termina con Enter.
  function escuchar(alLeer) {
    var buf = '', t0 = 0, tu = 0;
    function reset() { buf = ''; t0 = 0; tu = 0; }
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      var ahora = performance.now();
      if (tu && ahora - tu > 120) reset();
      if (e.key === 'Enter' || e.key === 'Tab') {
        var dur = ahora - t0, n = buf.length;
        if (n >= 6 && dur / Math.max(1, n - 1) < 45) {
          var el = document.activeElement, enTexto = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
          if (enTexto && el.value && el.value.slice(-n).toUpperCase() === buf.toUpperCase()) el.value = el.value.slice(0, -n);
          e.preventDefault(); e.stopPropagation();
          var leido = buf; reset(); alLeer(leido); return;
        }
        reset(); return;
      }
      if (e.key && e.key.length === 1) { if (!buf) t0 = ahora; buf += e.key; tu = ahora; }
    }, true);
  }

  // ---------------------------------------------------------------- sonidos
  var actx = null;
  function sonar(tipo) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var notas = tipo === 'ok' ? [[880, 0, 0.09], [1320, 0.1, 0.12]] : tipo === 'repetido' ? [[990, 0, 0.12]] : [[220, 0, 0.18], [180, 0.2, 0.25]];
      notas.forEach(function (n) {
        var o = actx.createOscillator(), v = actx.createGain(); o.type = tipo === 'error' ? 'square' : 'sine'; o.frequency.value = n[0];
        v.gain.setValueAtTime(0.0001, actx.currentTime + n[1]); v.gain.exponentialRampToValueAtTime(0.25, actx.currentTime + n[1] + 0.01); v.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + n[1] + n[2]);
        o.connect(v); v.connect(actx.destination); o.start(actx.currentTime + n[1]); o.stop(actx.currentTime + n[1] + n[2] + 0.02);
      });
    } catch (e) {}
  }

  // ---------------------------------------------------------------- PDF
  function cargar(url) {
    if (!url) return Promise.resolve(null);
    return fetch(url, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) {
      return new Promise(function (ok) { var f = new FileReader(); f.onload = function () { ok(f.result); }; f.onerror = function () { ok(null); }; f.readAsDataURL(b); });
    }).catch(function () { return null; });
  }
  function medir(src) { return new Promise(function (ok) { if (!src) return ok(null); var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = src; }); }

  /* Carnés: 10 por hoja A4 (2 × 5), tamaño tarjeta 85 × 54 mm */
  function carnes(lista, ev, o) {
    var jsPDF = window.jspdf && window.jspdf.jsPDF; if (!jsPDF) return Promise.reject({ error: 'No se pudo cargar el generador de PDF.' });
    return cargar(o.letras || 'assets/letras.png').then(function (letras) {
      return medir(letras).then(function (dl) {
        var doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true }), W = 85, H = 54, X = [17, 108], Y0 = 12, G = 3.5;
        lista.forEach(function (p, i) {
          var k = i % 10; if (i && !k) doc.addPage();
          var x = X[k % 2], y = Y0 + Math.floor(k / 2) * (H + G);
          doc.setDrawColor(210, 200, 170); doc.setLineWidth(0.2); doc.setLineDashPattern([1.2, 1.2], 0); doc.rect(x - 1.5, y - 1.5, W + 3, H + 3); doc.setLineDashPattern([], 0);
          doc.setFillColor(255, 253, 248); doc.setDrawColor(198, 161, 59); doc.setLineWidth(0.5); doc.roundedRect(x, y, W, H, 2.5, 2.5, 'FD');
          doc.setFillColor(31, 61, 46); doc.roundedRect(x, y, W, 11, 2.5, 2.5, 'F'); doc.rect(x, y + 6, W, 5, 'F');
          if (letras && dl) { var lh = 6.4, lw = dl.width * lh / dl.height; doc.addImage(letras, 'PNG', x + 4, y + 2.3, lw, lh); }
          doc.setFont('helvetica', 'bold'); doc.setFontSize(6.2); doc.setTextColor(232, 194, 91); doc.text('INGRESO A CURSO', x + W - 4, y + 6.7, { align: 'right' });
          var qs = 34, qx = x + W - qs - 3, qy = y + 13.5;
          doc.addImage(qrDataURL(p.codigo, 400), 'PNG', qx, qy, qs, qs);
          doc.setFont('courier', 'bold'); doc.setFontSize(7.4); doc.setTextColor(16, 35, 26); doc.text(p.codigo, qx + qs / 2, qy + qs + 3.4, { align: 'center' });
          var tx = x + 4, tw = W - qs - 10;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(TINTA[0], TINTA[1], TINTA[2]);
          var nom = doc.splitTextToSize(limpio((p.nombre + ' ' + (p.apellido || '')).trim()), tw).slice(0, 2); doc.text(nom, tx, y + 18);
          var yy = y + 18 + nom.length * 4.4;
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7.6); doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]);
          doc.text(limpio((p.tipo_doc || 'CC') + ' ' + p.documento), tx, yy); yy += 3.6;
          if (p.especialidad) { doc.text(doc.splitTextToSize(limpio(p.especialidad), tw).slice(0, 1), tx, yy); yy += 3.6; }
          yy = Math.max(yy + 1.5, y + 34);
          doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]); doc.setLineWidth(0.2); doc.line(tx, yy - 2.6, tx + tw, yy - 2.6);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7.4); doc.setTextColor(VERDE[0], VERDE[1], VERDE[2]);
          var ct = doc.splitTextToSize(limpio(ev.titulo), tw).slice(0, 2); doc.text(ct, tx, yy); yy += ct.length * 3.2;
          doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); doc.setTextColor(DORADO[0], DORADO[1], DORADO[2]);
          doc.text(limpio(rango(ev) + (ev.sala ? ' · ' + ev.sala : '')), tx, yy + 0.6);
          if (p.estacion) { doc.setTextColor(GRIS[0], GRIS[1], GRIS[2]); doc.text(limpio('Estación ' + p.estacion), tx, yy + 4); }
        });
        doc.setProperties({ title: 'Carnés QR - ' + limpio(ev.titulo), author: 'CLEMI' });
        return { doc: doc, nombre: 'Carnes-QR-' + limpio(ev.titulo).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').slice(0, 40) + '.pdf' };
      });
    });
  }

  /* Check list de ingreso: una sección por participante (y por día) */
  function checklist(filas, ev, lista, o) {
    var jsPDF = window.jspdf && window.jspdf.jsPDF; if (!jsPDF) return Promise.reject({ error: 'No se pudo cargar el generador de PDF.' });
    return cargar(o.fondo || 'assets/fondo_acta.jpg').then(function (fondo) {
      var doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true }), X0 = 24, X1 = 186, AN = X1 - X0, Y_INI = 72, Y_MAX = 255, y = Y_INI;
      function hoja() { if (fondo) doc.addImage(fondo, 'JPEG', 0, 0, 210, 297, 'fondo', 'FAST'); }
      function color(c) { doc.setTextColor(c[0], c[1], c[2]); }
      hoja();
      filas.forEach(function (f, idx) {
        if (idx) { doc.addPage(); hoja(); y = Y_INI; }
        var p = f.inscrito, a = f.asistencia, its = (a && a.items) || {};
        doc.setFont('times', 'bold'); doc.setFontSize(14); color(VERDE); doc.text('CHECK LIST DE INGRESO AL CURSO', 105, y, { align: 'center' }); y += 6;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); color(DORADO);
        doc.text(limpio(ev.titulo + '   ·   ' + (a ? fecha(a.fecha) : 'Sin ingreso registrado') + (ev.sala ? '   ·   ' + ev.sala : '')), 105, y, { align: 'center', maxWidth: AN }); y += 4;
        doc.setDrawColor(198, 161, 59); doc.setLineWidth(0.6); doc.line(80, y, 130, y); y += 9;
        var qs = 30; doc.addImage(qrDataURL(p.codigo, 360), 'PNG', X1 - qs, y - 4, qs, qs);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8); color(GRIS); doc.text('PARTICIPANTE', X0, y);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(13); color(TINTA); doc.text(limpio((p.nombre + ' ' + (p.apellido || '')).trim()), X0, y + 6);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9.4); color(GRIS);
        var dat = [(p.tipo_doc || 'CC') + ' ' + p.documento, p.especialidad, p.institucion, p.estacion ? 'Estación ' + p.estacion : ''].filter(Boolean).join('  ·  ');
        doc.text(doc.splitTextToSize(limpio(dat), AN - qs - 6), X0, y + 11.5);
        doc.setFont('courier', 'bold'); doc.setFontSize(8.5); color(TINTA); doc.text('Código ' + p.codigo, X0, y + 20);
        y += 30;
        doc.setFillColor(ORO_SUAVE[0], ORO_SUAVE[1], ORO_SUAVE[2]); doc.rect(X0, y - 4.4, AN, 7, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.6); color(DORADO);
        doc.text(limpio(a ? 'INGRESO: ' + a.ingreso_en.slice(11, 16) + ' · ' + (a.medio === 'QR' ? 'CÓDIGO QR' : a.medio.toUpperCase()) + ' · REGISTRÓ ' + o.nombre(a.ingreso_por).toUpperCase() : 'SIN INGRESO REGISTRADO'), X0 + 2, y);
        var hechos = lista.filter(function (t) { return its[t]; }).length;
        doc.text(hechos + ' / ' + lista.length + ' ÍTEMS', X1 - 2, y, { align: 'right' }); y += 7;
        lista.forEach(function (t, i) {
          var r = its[t], ls = doc.splitTextToSize(limpio(t), AN - 64), h = ls.length * 4.2 + 3;
          if (y + h > Y_MAX) { doc.addPage(); hoja(); y = Y_INI; }
          doc.setDrawColor(r ? 46 : 190, r ? 125 : 60, r ? 79 : 50); doc.setLineWidth(0.4); doc.rect(X0 + 1, y - 3.4, 4.2, 4.2);
          if (r) { doc.setDrawColor(46, 125, 79); doc.setLineWidth(0.7); doc.line(X0 + 1.8, y - 1.3, X0 + 2.9, y - 0.1); doc.line(X0 + 2.9, y - 0.1, X0 + 4.6, y - 2.9); }
          doc.setFont('helvetica', 'normal'); doc.setFontSize(9.4); color(TINTA); doc.text(ls, X0 + 8, y);
          doc.setFontSize(7.6); color(r ? GRIS : [169, 58, 50]);
          doc.text(limpio(r ? o.nombre(r.por) + ' · ' + r.en.slice(11, 16) : 'Pendiente'), X1, y, { align: 'right' });
          y += h; doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]); doc.setLineWidth(0.2); doc.line(X0, y - 2.4, X1, y - 2.4); y += 1.2;
        });
        if (a && a.obs) { y += 3; doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8); color(GRIS); doc.text('OBSERVACIONES', X0, y); y += 4; doc.setFont('helvetica', 'normal'); doc.setFontSize(9.2); color(TINTA); var ob = doc.splitTextToSize(limpio(a.obs), AN); doc.text(ob, X0, y); y += ob.length * 4.2; }
        y += 4; doc.setFont('helvetica', 'bold'); doc.setFontSize(9); color(a && a.completo ? [46, 125, 79] : [183, 121, 31]);
        doc.text(a && a.completo ? 'CHECK LIST COMPLETO' : 'CHECK LIST INCOMPLETO', X0, y);
      });
      var n = doc.getNumberOfPages();
      for (var pg = 1; pg <= n; pg++) { doc.setPage(pg); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); color(GRIS); doc.text(limpio('Generado el ' + fecha(o.ahora) + ' por ' + o.generadoPor), X0, 259.5); doc.text('Página ' + pg + ' de ' + n, X1, 259.5, { align: 'right' }); }
      doc.setProperties({ title: 'Check list de ingreso - ' + limpio(ev.titulo), author: 'CLEMI' });
      var uno = filas.length === 1 ? '-' + limpio(filas[0].inscrito.apellido || filas[0].inscrito.nombre) : '';
      return { doc: doc, nombre: ('Checklist-ingreso' + uno + '-' + limpio(ev.titulo)).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').slice(0, 60) + '.pdf' };
    });
  }

  window.Ingreso = { qrSvg: qrSvg, qrDataURL: qrDataURL, tarjetaPNG: tarjetaPNG, escuchar: escuchar, sonar: sonar, carnes: carnes, checklist: checklist };
})();
