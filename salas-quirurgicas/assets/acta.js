/* =====================================================================
   CLEMI · Acta de entrega de instrumental en PDF (hoja membretada A4)
   Requiere jsPDF (assets/jspdf.umd.min.js). Todo se genera en el navegador.
   ===================================================================== */
(function () {
  'use strict';
  var VERDE = [27, 63, 44], DORADO = [142, 108, 28], ORO_SUAVE = [246, 237, 211], GRIS = [92, 107, 97], TINTA = [28, 42, 33], LINEA = [221, 210, 182];
  var X0 = 24, X1 = 186, ANCHO = X1 - X0, Y_INI = 72, Y_MAX = 255;
  var MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function fecha(m) { if (!m) return ''; var p = m.slice(0, 10).split('-'); return +p[2] + ' de ' + MES[+p[1] - 1] + ' de ' + p[0] + ' · ' + m.slice(11, 16); }
  function limpio(s) { return String(s == null ? '' : s).replace(/[–—]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/→/g, '->'); }

  function cargar(url) {
    if (!url) return Promise.resolve(null);
    if (/^data:/.test(url)) return Promise.resolve(url);
    return fetch(url, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) {
      return new Promise(function (ok) { var f = new FileReader(); f.onload = function () { ok(f.result); }; f.onerror = function () { ok(null); }; f.readAsDataURL(b); });
    }).catch(function () { return null; });
  }
  function medir(src) {
    return new Promise(function (ok) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = src; });
  }
  // Recorta la foto para llenar el recuadro (como object-fit: cover)
  function cubrir(src, w, h) {
    return medir(src).then(function (img) {
      if (!img) return null;
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var k = Math.max(w / img.width, h / img.height), dw = img.width * k, dh = img.height * k;
      var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
      return c.toDataURL('image/jpeg', 0.85);
    });
  }

  /* r = entrega (con items, fotos), o = { archivo(f)->url, generadoPor, evento, fondo } */
  function crear(r, o) {
    var jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) return Promise.reject({ error: 'No se pudo cargar el generador de PDF.' });
    var firmas = ['entrega_firma', 'recibe_firma', 'dev_entrega_firma', 'dev_recibe_firma'];
    var dev = o.tipo === 'devolucion';
    var fotos = (r.fotos || []).filter(function (f) { return dev ? f.momento === 'Devolución' : f.momento !== 'Devolución'; });
    r = Object.assign({}, r, { fotos: fotos });
    return Promise.all([cargar(o.fondo || 'assets/fondo_acta.jpg')]
      .concat(firmas.map(function (k) { return cargar(r[k] ? o.archivo(r[k]) : null); }))
      .concat(fotos.map(function (f) { return cargar(o.archivo(f.archivo)).then(function (d) { return d ? cubrir(d, 640, 480) : null; }); })))
      .then(function (res) {
        var fondo = res[0], F = {}; firmas.forEach(function (k, i) { F[k] = res[i + 1]; });
        var FT = res.slice(1 + firmas.length);
        return Promise.all(firmas.map(function (k) { return F[k] ? medir(F[k]) : Promise.resolve(null); })).then(function (dims) {
          var D = {}; firmas.forEach(function (k, i) { D[k] = dims[i]; });
          return dibujar(jsPDF, r, o, fondo, F, D, FT);
        });
      });
  }

  function dibujar(jsPDF, r, o, fondo, F, D, FT) {
    var doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    var dev = o.tipo === 'devolucion';
    var numEnt = 'ENT-' + (r.fecha_hora || '').slice(0, 4) + '-' + ('000' + r.id).slice(-4);
    var num = dev ? 'DEV-' + (r.dev_fecha_hora || '').slice(0, 4) + '-' + ('000' + r.id).slice(-4) : numEnt;
    var y = Y_INI;
    function hoja() { if (fondo) doc.addImage(fondo, 'JPEG', 0, 0, 210, 297, 'fondo', 'FAST'); }
    function nueva() { doc.addPage(); hoja(); y = Y_INI; }
    function espacio(h) { if (y + h > Y_MAX) nueva(); }
    function color(c) { doc.setTextColor(c[0], c[1], c[2]); }
    function linea(y1, c, w) { c = c || LINEA; doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(w || 0.25); doc.line(X0, y1, X1, y1); }
    function etiqueta(t, x, yy) { doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8); color(GRIS); doc.text(limpio(t).toUpperCase(), x, yy, { charSpace: 0.25 }); }
    function seccion(t) {
      espacio(14); y += 3;
      doc.setFont('times', 'bold'); doc.setFontSize(11.5); color(VERDE); doc.text(limpio(t), X0, y);
      doc.setDrawColor(198, 161, 59); doc.setLineWidth(0.5); doc.line(X0, y + 1.8, X0 + 18, y + 1.8);
      doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]); doc.setLineWidth(0.2); doc.line(X0 + 18, y + 1.8, X1, y + 1.8);
      y += 7;
    }
    function campo(lbl, val, x, w) {
      etiqueta(lbl, x, y);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.6); color(TINTA);
      var ls = doc.splitTextToSize(limpio(val || '-'), w); doc.text(ls, x, y + 4.4);
      return 4.4 + ls.length * 4.2;
    }
    hoja();

    // Título
    doc.setFont('times', 'bold'); doc.setFontSize(15); color(VERDE);
    doc.text(dev ? 'ACTA DE DEVOLUCIÓN DE INSTRUMENTAL Y EQUIPOS' : 'ACTA DE ENTREGA DE INSTRUMENTAL Y EQUIPOS', 105, y, { align: 'center' });
    y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); color(DORADO);
    doc.text(dev ? num + '   ·   ' + fecha(r.dev_fecha_hora) + '   ·   ' + limpio(r.dev_novedad || 'Sin novedades') : num + '   ·   ' + fecha(r.fecha_hora) + '   ·   ' + limpio(r.estado), 105, y, { align: 'center' });
    y += 4; doc.setDrawColor(198, 161, 59); doc.setLineWidth(0.6); doc.line(80, y, 130, y); y += 8;
    if (dev) return dibujarDevolucion();

    // Datos generales
    var mitad = ANCHO / 2 - 4, h1, h2;
    h1 = campo('Empresa que entrega', r.empresa, X0, mitad); h2 = campo('Evento / entrenamiento', r.evento_titulo || 'Sin evento asociado', X0 + ANCHO / 2 + 4, mitad); y += Math.max(h1, h2) + 3;
    h1 = campo('Ubicación del equipo / instrumental', r.ubicacion, X0, ANCHO); y += h1 + 3;

    // Tabla de elementos
    seccion('Equipos e instrumental entregado');
    var cols = [{ t: '#', w: 8 }, { t: 'Descripción', w: 82 }, { t: 'Referencia / lote', w: 38 }, { t: 'Cant.', w: 14, a: 'right' }, { t: 'Estado', w: 20 }];
    function cabecera() {
      doc.setFillColor(ORO_SUAVE[0], ORO_SUAVE[1], ORO_SUAVE[2]); doc.rect(X0, y - 4.2, ANCHO, 6.4, 'F');
      var x = X0; doc.setFont('helvetica', 'bold'); doc.setFontSize(7.4); color(DORADO);
      cols.forEach(function (c) { doc.text(c.t.toUpperCase(), c.a === 'right' ? x + c.w - 2 : x + 2, y, { align: c.a === 'right' ? 'right' : 'left' }); x += c.w; });
      y += 5;
    }
    cabecera();
    doc.setFontSize(9.2);
    var total = 0;
    (r.items || []).forEach(function (it, i) {
      doc.setFont('helvetica', 'normal');
      var d = doc.splitTextToSize(limpio(it.desc), cols[1].w - 4), rf = doc.splitTextToSize(limpio(it.ref || '-'), cols[2].w - 4);
      var h = Math.max(d.length, rf.length) * 4.1 + 2.6;
      if (y + h > Y_MAX) { nueva(); cabecera(); }
      color(TINTA); var x = X0, yy = y + 1.2;
      doc.text(String(i + 1), x + 2, yy); x += cols[0].w;
      doc.text(d, x + 2, yy); x += cols[1].w;
      doc.text(rf, x + 2, yy); x += cols[2].w;
      doc.setFont('helvetica', 'bold'); doc.text(String(it.cant), x + cols[3].w - 2, yy, { align: 'right' }); x += cols[3].w;
      doc.setFont('helvetica', 'normal'); doc.text(limpio(it.estado), x + 2, yy);
      total += +it.cant || 0;
      y += h; linea(y - 2.6);
      y += 1.6;
    });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.6); color(VERDE);
    doc.text((r.items || []).length + ' referencias · ' + total + ' unidades en total', X1, y + 1, { align: 'right' }); y += 5;

    if (r.observaciones) {
      seccion('Observaciones');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.4); color(TINTA);
      doc.splitTextToSize(limpio(r.observaciones), ANCHO).forEach(function (l) { espacio(5); doc.text(l, X0, y); y += 4.3; });
      y += 1;
    }

    // Firmas
    function bloqueFirmas(titulo, a, b, nota) {
      espacio(58);
      seccion(titulo);
      if (nota) {
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8.2); color(GRIS);
        var ln = doc.splitTextToSize(limpio(nota), ANCHO); doc.text(ln, X0, y); y += ln.length * 3.7 + 3;
      }
      var w = ANCHO / 2 - 4, alto = 40;
      [a, b].forEach(function (p, i) {
        var x = X0 + i * (w + 8);
        doc.setFillColor(255, 255, 253); doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]); doc.setLineWidth(0.3); doc.roundedRect(x, y, w, alto, 2, 2, 'FD');
        etiqueta(p.rol, x + 4, y + 5.5);
        if (p.img && p.dim) {
          var mw = w - 12, mh = 18, k = Math.min(mw / p.dim.width, mh / p.dim.height), iw = p.dim.width * k, ih = p.dim.height * k;
          doc.addImage(p.img, 'PNG', x + (w - iw) / 2, y + 8 + (mh - ih) / 2, iw, ih);
        }
        doc.setDrawColor(150, 150, 140); doc.setLineWidth(0.25); doc.line(x + 6, y + 27, x + w - 6, y + 27);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.6); color(TINTA); doc.text(limpio(p.nombre || '-'), x + w / 2, y + 31.5, { align: 'center', maxWidth: w - 8 });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(GRIS);
        var sub = [p.cedula ? 'C.C. ' + p.cedula : '', p.extra || ''].filter(Boolean).join(' · ');
        if (sub) doc.text(limpio(sub), x + w / 2, y + 35.5, { align: 'center', maxWidth: w - 8 });
      });
      y += alto + 5;
    }
    bloqueFirmas('Firmas de entrega', { rol: 'Entrega (empresa)', nombre: r.entrega_nombre, cedula: r.entrega_cedula, extra: [r.entrega_cargo, r.entrega_telefono].filter(Boolean).join(' · '), img: F.entrega_firma, dim: D.entrega_firma },
      { rol: 'Recibe (CLEMI)', nombre: r.recibe_nombre, cedula: r.recibe_cedula, extra: 'Instrumentación quirúrgica', img: F.recibe_firma, dim: D.recibe_firma },
      'Con la firma de esta acta, las partes dejan constancia de la entrega del instrumental y los equipos relacionados, en el estado descrito, para su uso y custodia en las salas de entrenamiento de CLEMI.');
    if (r.estado === 'Devuelto') {
      espacio(10); doc.setFont('helvetica', 'italic'); doc.setFontSize(8.4); color(DORADO);
      doc.text(limpio('Devuelto a la empresa el ' + fecha(r.dev_fecha_hora) + ' · ver Acta de devolución DEV-' + (r.dev_fecha_hora || '').slice(0, 4) + '-' + ('000' + r.id).slice(-4) + '.'), X0, y); y += 6;
    }

    return terminar();

    function dibujarDevolucion() {
      var mitad = ANCHO / 2 - 4, h1, h2;
      h1 = campo('Empresa que recibe la devolución', r.empresa, X0, mitad); h2 = campo('Evento / entrenamiento', r.evento_titulo || 'Sin evento asociado', X0 + ANCHO / 2 + 4, mitad); y += Math.max(h1, h2) + 3;
      h1 = campo('Acta de entrega de referencia', numEnt + ' · ' + fecha(r.fecha_hora), X0, mitad); h2 = campo('Ubicación durante la custodia', r.ubicacion, X0 + ANCHO / 2 + 4, mitad); y += Math.max(h1, h2) + 2;

      seccion('Revisión del instrumental y equipos devueltos');
      var cols = [{ t: '#', w: 7 }, { t: 'Descripción', w: 70 }, { t: 'Ref. / lote', w: 29 }, { t: 'Entreg.', w: 15, a: 'right' }, { t: 'Devuel.', w: 15, a: 'right' }, { t: 'Estado', w: 26 }];
      function cabecera() {
        doc.setFillColor(ORO_SUAVE[0], ORO_SUAVE[1], ORO_SUAVE[2]); doc.rect(X0, y - 4.2, ANCHO, 6.4, 'F');
        var x = X0; doc.setFont('helvetica', 'bold'); doc.setFontSize(7.2); color(DORADO);
        cols.forEach(function (c) { doc.text(c.t.toUpperCase(), c.a === 'right' ? x + c.w - 2 : x + 2, y, { align: c.a === 'right' ? 'right' : 'left' }); x += c.w; });
        y += 5;
      }
      cabecera();
      var items = (r.dev_items && r.dev_items.length) ? r.dev_items : (r.items || []).map(function (it) { return { desc: it.desc, ref: it.ref, cant: it.cant, cant_dev: it.cant, estado: 'Completo', nota: '' }; });
      var te = 0, td = 0, conNov = 0;
      items.forEach(function (it, i) {
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        var d = doc.splitTextToSize(limpio(it.desc), cols[1].w - 4), rf = doc.splitTextToSize(limpio(it.ref || '-'), cols[2].w - 4);
        var nota = it.nota ? doc.splitTextToSize(limpio('Novedad: ' + it.nota), ANCHO - cols[0].w - 4) : [];
        var h = Math.max(d.length, rf.length) * 4 + 2.6 + (nota.length ? nota.length * 3.7 + 1 : 0);
        if (y + h > Y_MAX) { nueva(); cabecera(); }
        var mal = it.estado !== 'Completo'; if (mal) conNov++;
        if (mal) { doc.setFillColor(251, 239, 214); doc.rect(X0, y - 3, ANCHO, h - 0.6, 'F'); }
        color(TINTA); var x = X0, yy = y + 1.2;
        doc.text(String(i + 1), x + 2, yy); x += cols[0].w;
        doc.text(d, x + 2, yy); x += cols[1].w;
        doc.text(rf, x + 2, yy); x += cols[2].w;
        doc.text(String(it.cant), x + cols[3].w - 2, yy, { align: 'right' }); x += cols[3].w;
        doc.setFont('helvetica', 'bold'); doc.text(String(it.cant_dev), x + cols[4].w - 2, yy, { align: 'right' }); x += cols[4].w;
        if (mal) doc.setTextColor(169, 58, 50); else doc.setTextColor(46, 125, 79);
        doc.text(limpio(it.estado), x + 2, yy);
        if (nota.length) { doc.setFont('helvetica', 'italic'); doc.setFontSize(8.2); doc.setTextColor(142, 90, 18); doc.text(nota, X0 + cols[0].w + 2, y + Math.max(d.length, rf.length) * 4 + 1.6); }
        te += +it.cant || 0; td += +it.cant_dev || 0;
        y += h; linea(y - 2.6); y += 1.6;
      });
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.6); color(VERDE);
      doc.text(td + ' de ' + te + ' unidades devueltas' + (conNov ? ' · ' + conNov + (conNov === 1 ? ' elemento con novedad' : ' elementos con novedad') : ' · sin novedades'), X1, y + 1, { align: 'right' }); y += 5;

      seccion('Novedades de la devolución');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.4); color(TINTA);
      var txt = r.dev_obs ? r.dev_obs : (conNov ? 'Ver las novedades registradas por elemento en la tabla anterior.' : 'Se devuelve la totalidad del instrumental y los equipos relacionados, completos y en el estado en que fueron recibidos. Sin novedades.');
      doc.splitTextToSize(limpio(txt), ANCHO).forEach(function (l) { espacio(5); doc.text(l, X0, y); y += 4.3; });
      y += 2;

      bloqueFirmas('Firmas de devolución', { rol: 'Devuelve (CLEMI)', nombre: r.dev_entrega_nombre, cedula: r.dev_entrega_cedula, extra: 'Instrumentación quirúrgica', img: F.dev_entrega_firma, dim: D.dev_entrega_firma },
        { rol: 'Recibe (empresa)', nombre: r.dev_recibe_nombre, cedula: r.dev_recibe_cedula, extra: r.empresa, img: F.dev_recibe_firma, dim: D.dev_recibe_firma },
        'Con la firma de esta acta, la empresa recibe el instrumental y los equipos relacionados en las cantidades y el estado descritos, incluidas las novedades registradas, y se da por terminada su custodia en CLEMI.');
      return terminar();
    }

    function terminar() {
    // Registro fotográfico
    var fotos = (r.fotos || []).map(function (f, i) { return { f: f, img: FT[i] }; }).filter(function (x) { return x.img; });
    if (fotos.length) {
      espacio(60); seccion('Registro fotográfico');
      var fw = (ANCHO - 8) / 3, fh = fw * 0.75;
      fotos.forEach(function (p, i) {
        var c = i % 3;
        if (c === 0 && i) y += fh + 8;
        if (c === 0 && y + fh + 6 > Y_MAX) { nueva(); }
        var x = X0 + c * (fw + 4);
        doc.addImage(p.img, 'JPEG', x, y, fw, fh);
        doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]); doc.setLineWidth(0.3); doc.rect(x, y, fw, fh);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7); color(GRIS);
        doc.text(limpio(p.f.momento + ' · ' + fecha(p.f.creado_en)), x, y + fh + 3.6);
      });
      y += fh + 8;
    }

    // Pie en cada página
    var n = doc.getNumberOfPages();
    for (var p = 1; p <= n; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); color(GRIS);
      doc.text(limpio('Acta ' + num + ' · Registró: ' + (o.nombre ? o.nombre(dev ? (r.dev_entrega_id || r.creado_por) : r.creado_por) : '') + ' · Generada el ' + fecha(o.ahora) + (o.generadoPor ? ' por ' + o.generadoPor : '')), X0, 259.5);
      doc.text('Página ' + p + ' de ' + n, X1, 259.5, { align: 'right' });
    }
    doc.setProperties({ title: 'Acta ' + num + ' - ' + limpio(r.empresa), subject: dev ? 'Acta de devolución de instrumental' : 'Acta de entrega de instrumental', author: 'CLEMI', creator: 'CLEMI Salas Quirúrgicas' });
    return { doc: doc, nombre: 'Acta-' + num + '-' + limpio(r.empresa).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 40) + '.pdf' };
    }
  }

  window.ActaPDF = { crear: crear };
})();
