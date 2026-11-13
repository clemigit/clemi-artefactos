/* =====================================================================
   CLEMI · Acta de entrega de dotación (PDF A4, hoja membretada)
   Requiere jsPDF. Todo se genera en el navegador.
   ===================================================================== */
(function () {
  'use strict';
  var VERDE = [27, 63, 44], DORADO = [142, 108, 28], ORO_SUAVE = [246, 237, 211], GRIS = [92, 107, 97], TINTA = [28, 42, 33], LINEA = [221, 210, 182];
  var X0 = 24, X1 = 186, ANCHO = X1 - X0, Y_INI = 72, Y_MAX = 255;
  var MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function fecha(m) { if (!m) return ''; var p = m.slice(0, 10).split('-'); return +p[2] + ' de ' + MES[+p[1] - 1] + ' de ' + p[0] + (m.length >= 16 ? ' · ' + m.slice(11, 16) : ''); }
  function limpio(s) { return String(s == null ? '' : s).replace(/[–—]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/→/g, '->'); }
  function cargar(url) {
    if (!url) return Promise.resolve(null);
    if (/^data:/.test(url)) return Promise.resolve(url);
    return fetch(url, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) {
      return new Promise(function (ok) { var f = new FileReader(); f.onload = function () { ok(f.result); }; f.onerror = function () { ok(null); }; f.readAsDataURL(b); });
    }).catch(function () { return null; });
  }
  function medir(src) { return new Promise(function (ok) { if (!src) return ok(null); var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = src; }); }

  /* p = funcionario, e = entrega { id, periodo, fecha_programada, fecha_entrega, items, observaciones, entrega_nombre, entrega_cargo, entrega_firma, recibe_firma, creado_en },
     o = { archivo(f)->url, generadoPor, ahora, nombre(id) } */
  function acta(p, e, o) {
    var jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) return Promise.reject({ error: 'No se pudo cargar el generador de PDF.' });
    return Promise.all([cargar(o.fondo || 'assets/fondo_acta.jpg'), cargar(o.archivo(e.entrega_firma)), cargar(o.archivo(e.recibe_firma))]).then(function (res) {
      return Promise.all([medir(res[1]), medir(res[2])]).then(function (dims) { return dibujar(jsPDF, p, e, o, res[0], [res[1], res[2]], dims); });
    });
  }

  function dibujar(jsPDF, p, e, o, fondo, firmas, dims) {
    var doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    var num = 'DOT-' + String(e.fecha_entrega).slice(0, 4) + '-' + ('000' + e.id).slice(-4), y = Y_INI;
    var nombre = limpio((p.nombres + ' ' + p.apellidos).trim());
    function hoja() { if (fondo) doc.addImage(fondo, 'JPEG', 0, 0, 210, 297, 'fondo', 'FAST'); }
    function nueva() { doc.addPage(); hoja(); y = Y_INI; }
    function espacio(h) { if (y + h > Y_MAX) nueva(); }
    function color(k) { doc.setTextColor(k[0], k[1], k[2]); }
    function linea(y1) { doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]); doc.setLineWidth(0.25); doc.line(X0, y1, X1, y1); }
    function etiqueta(t, x, yy) { doc.setFont('helvetica', 'bold'); doc.setFontSize(6.8); color(GRIS); doc.text(limpio(t).toUpperCase(), x, yy, { charSpace: 0.25 }); }
    function seccion(t) {
      espacio(14); y += 3;
      doc.setFont('times', 'bold'); doc.setFontSize(11.5); color(VERDE); doc.text(limpio(t), X0, y);
      doc.setDrawColor(198, 161, 59); doc.setLineWidth(0.5); doc.line(X0, y + 1.8, X0 + 18, y + 1.8);
      doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]); doc.setLineWidth(0.2); doc.line(X0 + 18, y + 1.8, X1, y + 1.8);
      y += 7;
    }
    function campo(lbl, val, x, w) {
      etiqueta(lbl, x, y); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.6); color(TINTA);
      var ls = doc.splitTextToSize(limpio(val == null || val === '' ? '-' : val), w); doc.text(ls, x, y + 4.4); return 4.4 + ls.length * 4.2;
    }
    function fila(lista) { var w = (ANCHO - (lista.length - 1) * 6) / lista.length, hs = lista.map(function (f, i) { return campo(f[0], f[1], X0 + i * (w + 6), w); }); y += Math.max.apply(null, hs) + 3; }
    hoja();

    doc.setFont('times', 'bold'); doc.setFontSize(15); color(VERDE);
    doc.text('ACTA DE ENTREGA DE DOTACIÓN', 105, y, { align: 'center' }); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); color(DORADO);
    var per = e.periodo ? 'Entrega ' + e.periodo.slice(5) + ' de ' + e.periodo.slice(0, 4) + (e.fecha_programada ? ' (fecha límite ' + fecha(e.fecha_programada) + ')' : '') : 'Entrega adicional';
    doc.text(limpio(num + '   ·   ' + fecha(e.fecha_entrega) + '   ·   ' + per), 105, y, { align: 'center' });
    y += 4; doc.setDrawColor(198, 161, 59); doc.setLineWidth(0.6); doc.line(80, y, 130, y); y += 8;

    seccion('1. Datos del funcionario');
    fila([['Nombre', nombre], [p.tipo_doc || 'Documento', p.documento]]);
    fila([['Área', p.area + (p.subarea && p.subarea !== p.area ? ' · ' + p.subarea : '')], ['Cargo', p.cargo], ['Fecha de ingreso', fecha(p.fecha_ingreso)]]);

    seccion('2. Elementos entregados');
    var cols = [{ t: '#', w: 8 }, { t: 'Elemento', w: 92 }, { t: 'Zona / uso', w: 32 }, { t: 'Talla', w: 16 }, { t: 'Cant.', w: 14, a: 'right' }];
    function cabecera() {
      doc.setFillColor(ORO_SUAVE[0], ORO_SUAVE[1], ORO_SUAVE[2]); doc.rect(X0, y - 4.2, ANCHO, 6.4, 'F');
      var x = X0; doc.setFont('helvetica', 'bold'); doc.setFontSize(7.4); color(DORADO);
      cols.forEach(function (c) { doc.text(c.t.toUpperCase(), c.a === 'right' ? x + c.w - 2 : x + 2, y, { align: c.a === 'right' ? 'right' : 'left' }); x += c.w; });
      y += 5;
    }
    cabecera(); doc.setFontSize(9.2);
    var total = 0;
    (e.items || []).forEach(function (it, i) {
      doc.setFont('helvetica', 'normal');
      var d = doc.splitTextToSize(limpio(it.nombre), cols[1].w - 4), z = doc.splitTextToSize(limpio(it.zona || '-'), cols[2].w - 4);
      var h = Math.max(d.length, z.length) * 4.1 + 2.6;
      if (y + h > Y_MAX) { nueva(); cabecera(); }
      color(TINTA); var x = X0, yy = y + 1.2;
      doc.text(String(i + 1), x + 2, yy); x += cols[0].w;
      doc.text(d, x + 2, yy); x += cols[1].w;
      doc.setFontSize(8.2); color(GRIS); doc.text(z, x + 2, yy); x += cols[2].w; doc.setFontSize(9.2); color(TINTA);
      doc.text(limpio(it.talla || '-'), x + 2, yy); x += cols[3].w;
      doc.setFont('helvetica', 'bold'); doc.text(String(it.cantidad), x + cols[4].w - 2, yy, { align: 'right' });
      total += +it.cantidad || 0;
      y += h; linea(y - 2.6); y += 1.6;
    });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.6); color(VERDE);
    doc.text((e.items || []).length + ' elementos · ' + total + ' unidades en total', X1, y + 1, { align: 'right' }); y += 6;

    if (e.observaciones) {
      seccion('Observaciones');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.4); color(TINTA);
      doc.splitTextToSize(limpio(e.observaciones), ANCHO).forEach(function (l) { espacio(5); doc.text(l, X0, y); y += 4.3; }); y += 1;
    }

    espacio(62); seccion('3. Firmas');
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8.2); color(GRIS);
    var nota = doc.splitTextToSize(limpio('El funcionario declara haber recibido la dotación aquí descrita, en buen estado y en las tallas indicadas, y se compromete a usarla durante su jornada laboral y a cuidarla, conforme al Código Sustantivo del Trabajo y al reglamento interno de CLEMI.'), ANCHO);
    doc.text(nota, X0, y); y += nota.length * 3.7 + 3;
    var w = ANCHO / 2 - 4, alto = 40;
    [{ rol: 'Entrega (CLEMI)', nombre: e.entrega_nombre, extra: e.entrega_cargo || 'Talento Humano', img: firmas[0], dim: dims[0] },
     { rol: 'Recibe (funcionario)', nombre: nombre, extra: [p.documento ? (p.tipo_doc === 'Cédula de ciudadanía' ? 'C.C. ' : '') + p.documento : '', p.cargo].filter(Boolean).join(' · '), img: firmas[1], dim: dims[1] }].forEach(function (q, i) {
      var x = X0 + i * (w + 8);
      doc.setFillColor(255, 255, 253); doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]); doc.setLineWidth(0.3); doc.roundedRect(x, y, w, alto, 2, 2, 'FD');
      etiqueta(q.rol, x + 4, y + 5.5);
      if (q.img && q.dim) { var mw = w - 12, mh = 18, k = Math.min(mw / q.dim.width, mh / q.dim.height), iw = q.dim.width * k, ih = q.dim.height * k; doc.addImage(q.img, 'PNG', x + (w - iw) / 2, y + 8 + (mh - ih) / 2, iw, ih); }
      doc.setDrawColor(150, 150, 140); doc.setLineWidth(0.25); doc.line(x + 6, y + 27, x + w - 6, y + 27);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.6); color(TINTA); doc.text(limpio(q.nombre || '-'), x + w / 2, y + 31.5, { align: 'center', maxWidth: w - 8 });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(GRIS); if (q.extra) doc.text(limpio(q.extra), x + w / 2, y + 35.5, { align: 'center', maxWidth: w - 8 });
    });
    y += alto + 5;

    var n = doc.getNumberOfPages();
    for (var pg = 1; pg <= n; pg++) {
      doc.setPage(pg); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); color(GRIS);
      doc.text(limpio('Acta ' + num + ' · Registró: ' + (o.nombre ? o.nombre(e.creado_por) : '') + ' · Generada el ' + fecha(o.ahora) + (o.generadoPor ? ' por ' + o.generadoPor : '')), X0, 259.5);
      doc.text('Página ' + pg + ' de ' + n, X1, 259.5, { align: 'right' });
    }
    doc.setProperties({ title: 'Acta de entrega de dotación ' + num + ' - ' + nombre, subject: 'Entrega de dotación', author: 'CLEMI', creator: 'CLEMI Talento Humano' });
    return { doc: doc, nombre: 'Acta-dotacion-' + num + '-' + nombre.replace(/[^A-Za-z0-9]+/g, '-') + '.pdf' };
  }

  window.DotacionPDF = { acta: acta };
})();
