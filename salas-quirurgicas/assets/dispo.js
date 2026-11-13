/* =====================================================================
   CLEMI · Ficha de disposición final de componente anatómico (PDF A4)
   Misma hoja membretada del acta de entrega. Requiere jsPDF.
   ===================================================================== */
(function () {
  'use strict';
  var VERDE = [27, 63, 44], DORADO = [142, 108, 28], ORO_SUAVE = [246, 237, 211], GRIS = [92, 107, 97], TINTA = [28, 42, 33], LINEA = [221, 210, 182];
  var X0 = 24, X1 = 186, ANCHO = X1 - X0, Y_INI = 72, Y_MAX = 255;
  var MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function fecha(m, sinHora) { if (!m) return ''; var p = m.slice(0, 10).split('-'); return +p[2] + ' de ' + MES[+p[1] - 1] + ' de ' + p[0] + (sinHora || m.length < 16 ? '' : ' · ' + m.slice(11, 16)); }
  function limpio(s) { return String(s == null ? '' : s).replace(/[–—]/g, '-').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/→/g, '->').replace(/°/g, ' grados'); }
  function cargar(url) {
    if (!url) return Promise.resolve(null);
    if (/^data:/.test(url)) return Promise.resolve(url);
    return fetch(url, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw 0; return r.blob(); }).then(function (b) {
      return new Promise(function (ok) { var f = new FileReader(); f.onload = function () { ok(f.result); }; f.onerror = function () { ok(null); }; f.readAsDataURL(b); });
    }).catch(function () { return null; });
  }
  function medir(src) { return new Promise(function (ok) { if (!src) return ok(null); var i = new Image(); i.onload = function () { ok(i); }; i.onerror = function () { ok(null); }; i.src = src; }); }

  /* c = componente con disposicion, partes, asignaciones; o = { archivo, nombre(id), generadoPor, ahora, ingreso:[dataURL], salida:[dataURL], hallazgos:[], nombreParte } */
  function disposicion(c, o) {
    var jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) return Promise.reject({ error: 'No se pudo cargar el generador de PDF.' });
    var d = c.disposicion;
    return Promise.all([cargar(o.fondo || 'assets/fondo_acta.jpg'), cargar(o.archivo(d.entrega_firma)), cargar(o.archivo(d.recibe_firma))]).then(function (res) {
      return Promise.all([medir(res[1]), medir(res[2])]).then(function (dims) { return dibujar(jsPDF, c, d, o, res[0], [res[1], res[2]], dims); });
    });
  }

  function dibujar(jsPDF, c, d, o, fondo, firmas, dims) {
    var doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    var num = 'DF-' + d.fecha_hora.slice(0, 4) + '-' + ('000' + d.id).slice(-4), y = Y_INI;
    var R = {}; try { R = JSON.parse(d.resumen || '{}'); } catch (e) {}
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
    function filaCampos(lista) {
      var w = (ANCHO - (lista.length - 1) * 6) / lista.length, hs = lista.map(function (f, i) { return campo(f[0], f[1], X0 + i * (w + 6), w); });
      y += Math.max.apply(null, hs) + 3;
    }
    function parrafo(t) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.4); color(TINTA);
      doc.splitTextToSize(limpio(t), ANCHO).forEach(function (l) { espacio(5); doc.text(l, X0, y); y += 4.3; }); y += 1;
    }
    hoja();
    doc.setFont('times', 'bold'); doc.setFontSize(14.5); color(VERDE);
    doc.text('FICHA DE DISPOSICIÓN FINAL DE COMPONENTE ANATÓMICO', 105, y, { align: 'center' }); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); color(DORADO);
    doc.text(limpio(num + '   ·   ' + c.codigo + '   ·   ' + d.tipo + '   ·   ' + fecha(d.fecha_hora)), 105, y, { align: 'center' });
    y += 4; doc.setDrawColor(198, 161, 59); doc.setLineWidth(0.6); doc.line(80, y, 130, y); y += 8;

    seccion('1. Identificación del componente');
    filaCampos([['Código', c.codigo], ['Tipo', c.tipo], ['Sexo', c.sexo], ['Edad', c.edad != null && c.edad !== '' ? c.edad + ' años' : 'No registrada']]);
    filaCampos([['Fecha de ingreso', fecha(c.fecha_ingreso, true)], ['Conservación', c.conservacion], ['Procedencia / convenio', c.procedencia || '-']]);
    filaCampos([['Permanencia en CLEMI', (R.dias != null ? R.dias + ' días' : '-')], ['Eventos en que se usó', R.eventos != null ? String(R.eventos) : '-'], ['Usos de partes', R.usos != null ? String(R.usos) : '-'], ['Partes registradas', R.partes != null ? String(R.partes) : '-']]);

    seccion('2. Disposición final');
    filaCampos([['Qué sucede con el cuerpo', d.tipo], ['Fecha y hora de salida', fecha(d.fecha_hora)]]);
    filaCampos([['Destino / lugar', d.destino], ['Entidad que recibe', d.entidad || '-']]);
    filaCampos([['Documento soporte', d.documento || '-']]);

    seccion('3. Estado corporal a la salida');
    parrafo(d.estado_corporal);
    if (d.observaciones) { etiqueta('Observaciones', X0, y); y += 4; parrafo(d.observaciones); }

    // Estado de las partes antes de la disposición
    var est = R.estados || {}, claves = Object.keys(est);
    if (claves.length) {
      espacio(12); etiqueta('Estado de las partes antes de la salida', X0, y); y += 4.5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9.2); color(TINTA);
      doc.text(limpio(claves.map(function (k) { return k + ': ' + est[k]; }).join('   ·   ')), X0, y); y += 6;
    }
    var usadas = (c.asignaciones || []).filter(function (a) { return a.estado === 'Consumida' || a.estado === 'Devuelta a morgue'; });
    if (usadas.length) {
      seccion('4. Historial de uso en eventos');
      var cols = [{ t: 'Evento', w: 64 }, { t: 'Parte', w: 50 }, { t: 'Resultado', w: 48 }];
      var cab = function () { doc.setFillColor(ORO_SUAVE[0], ORO_SUAVE[1], ORO_SUAVE[2]); doc.rect(X0, y - 4.2, ANCHO, 6.4, 'F'); var x = X0; doc.setFont('helvetica', 'bold'); doc.setFontSize(7.4); color(DORADO); cols.forEach(function (k) { doc.text(k.t.toUpperCase(), x + 2, y); x += k.w; }); y += 5; };
      cab(); doc.setFontSize(8.8);
      usadas.forEach(function (a) {
        doc.setFont('helvetica', 'normal');
        var ev = doc.splitTextToSize(limpio(a.evento_titulo + ' · ' + fecha(a.fecha, true)), cols[0].w - 4), pa = doc.splitTextToSize(limpio(a.parte_codigo + ' ' + (o.nombreParte ? o.nombreParte(a) : '')), cols[1].w - 4),
          rs = doc.splitTextToSize(limpio(a.estado + (a.obs ? ': ' + a.obs : '')), cols[2].w - 4), h = Math.max(ev.length, pa.length, rs.length) * 3.9 + 2.4;
        if (y + h > Y_MAX) { nueva(); cab(); }
        color(TINTA); doc.text(ev, X0 + 2, y + 1); doc.text(pa, X0 + cols[0].w + 2, y + 1); doc.text(rs, X0 + cols[0].w + cols[1].w + 2, y + 1);
        y += h; linea(y - 2.4); y += 1.4;
      });
    }

    var nSec = usadas.length ? 5 : 4;
    var hall = o.hallazgos || [];
    if (hall.length) {
      seccion(nSec++ + '. Hallazgos registrados en la vista 3D');
      doc.setFontSize(9);
      hall.forEach(function (h, i) {
        var t = doc.splitTextToSize(limpio((i + 1) + '. [' + h.momento + '] ' + h.tipo + ': ' + h.texto + ' (' + h.autor + ', ' + fecha(h.fecha) + ')'), ANCHO);
        espacio(t.length * 4.2 + 1); doc.setFont('helvetica', 'normal'); color(TINTA); doc.text(t, X0, y); y += t.length * 4.2 + 1;
      });
      y += 1;
    }

    // Registro visual comparativo
    var ing = (o.ingreso || []).filter(Boolean), sal = (o.salida || []).filter(Boolean);
    if (ing.length || sal.length) {
      espacio(80); seccion(nSec++ + '. Registro visual: ingreso y salida');
      doc.setFont('helvetica', 'italic'); doc.setFontSize(8); color(GRIS);
      doc.text(o.textoVisual || 'Imágenes del cuerpo tomadas al ingreso y a la salida.', X0, y); y += 4;
      [['Ingreso', ing], ['Salida', sal]].forEach(function (fila) {
        if (!fila[1].length) return;
        var fw = (ANCHO - 9) / 4, fh = fw * 1.4;
        try { var p0 = doc.getImageProperties(fila[1][0]); fh = Math.min(fw * 1.6, fw * p0.height / p0.width); } catch (e) {}
        espacio(fh + 10);
        etiqueta(fila[0], X0, y); y += 2;
        fila[1].forEach(function (img, i) {
          var x = X0 + i * (fw + 3);
          doc.setFillColor(13, 26, 19); doc.rect(x, y, fw, fh, 'F');
          try { var p = doc.getImageProperties(img), k = Math.min(fw / p.width, fh / p.height), iw = p.width * k, ih = p.height * k; doc.addImage(img, 'JPEG', x + (fw - iw) / 2, y + (fh - ih) / 2, iw, ih); } catch (e) {}
          doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]); doc.rect(x, y, fw, fh);
        });
        y += fh + 5;
      });
    }

    // Firmas
    espacio(58); seccion(nSec + '. Firmas');
    doc.setFont('helvetica', 'italic'); doc.setFontSize(8.2); color(GRIS);
    var nota = doc.splitTextToSize(limpio('Con la firma de esta ficha se deja constancia de la salida del componente anatómico ' + c.codigo + ' de CLEMI para ' + d.tipo.toLowerCase() + ', en el estado corporal descrito, y de su entrega a quien recibe.'), ANCHO);
    doc.text(nota, X0, y); y += nota.length * 3.7 + 3;
    var w = ANCHO / 2 - 4, alto = 40;
    [{ rol: 'Entrega (CLEMI)', nombre: d.entrega_nombre, cedula: d.entrega_cedula, extra: 'Morgue CLEMI', img: firmas[0], dim: dims[0] },
     { rol: 'Recibe', nombre: d.recibe_nombre, cedula: d.recibe_cedula, extra: [d.recibe_cargo, d.entidad].filter(Boolean).join(' · '), img: firmas[1], dim: dims[1] }].forEach(function (p, i) {
      var x = X0 + i * (w + 8);
      doc.setFillColor(255, 255, 253); doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]); doc.setLineWidth(0.3); doc.roundedRect(x, y, w, alto, 2, 2, 'FD');
      etiqueta(p.rol, x + 4, y + 5.5);
      if (p.img && p.dim) { var mw = w - 12, mh = 18, k = Math.min(mw / p.dim.width, mh / p.dim.height), iw = p.dim.width * k, ih = p.dim.height * k; doc.addImage(p.img, 'PNG', x + (w - iw) / 2, y + 8 + (mh - ih) / 2, iw, ih); }
      doc.setDrawColor(150, 150, 140); doc.setLineWidth(0.25); doc.line(x + 6, y + 27, x + w - 6, y + 27);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.6); color(TINTA); doc.text(limpio(p.nombre || '-'), x + w / 2, y + 31.5, { align: 'center', maxWidth: w - 8 });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); color(GRIS);
      var sub = [p.cedula ? 'C.C. ' + p.cedula : '', p.extra || ''].filter(Boolean).join(' · '); if (sub) doc.text(limpio(sub), x + w / 2, y + 35.5, { align: 'center', maxWidth: w - 8 });
    });
    y += alto + 5;

    var n = doc.getNumberOfPages();
    for (var pg = 1; pg <= n; pg++) {
      doc.setPage(pg); doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8); color(GRIS);
      doc.text(limpio('Ficha ' + num + ' · Registró: ' + (o.nombre ? o.nombre(d.creado_por) : '') + ' · Generada el ' + fecha(o.ahora) + (o.generadoPor ? ' por ' + o.generadoPor : '')), X0, 259.5);
      doc.text('Página ' + pg + ' de ' + n, X1, 259.5, { align: 'right' });
    }
    doc.setProperties({ title: 'Ficha de disposición final ' + num + ' - ' + c.codigo, subject: 'Disposición final de componente anatómico', author: 'CLEMI', creator: 'CLEMI Morgue' });
    return { doc: doc, nombre: 'Disposicion-final-' + num + '-' + String(c.codigo).replace(/[^A-Za-z0-9-]+/g, '') + '.pdf' };
  }

  window.FichaPDF = { disposicion: disposicion };
})();
