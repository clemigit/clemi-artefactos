/* =====================================================================
   CLEMI · Vista previa: fases del convenio (Negociación → Cotización →
   Administrativo → La operación), agenda general con cupo de 2 eventos
   por fecha, plazo de 3 días hábiles del cliente, listado de personas,
   seguimiento con porcentajes y alertas, firmas y CERRAR NEGOCIACIÓN.
   Datos de ejemplo en memoria; nada se guarda.
   ===================================================================== */
(function () {
  'use strict';
  var D = window.CLEMI_DEMO; if (!D || !D.ctx || !D.CTI) return;
  var X = D.ctx, I = D.CTI, F = D.FIRMAS || { FIR: [], vigente: function () { return null; } };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function E(msg, st, extra) { throw { st: st || 400, body: Object.assign({ ok: false, error: msg }, extra || {}) }; }
  function t(x, n) { return String(x == null ? '' : x).trim().slice(0, n || 4000); }
  function dia(n) { return X.dia(n); }
  function ahora() { return X.ahora(); }
  function addD(f, n) { var d = new Date(f.slice(0, 10) + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  var FN = { negociacion: 'Negociación del evento', cotizacion: 'Cotización', administrativo: 'Administrativo', operacion: 'La operación' }, ORD = { negociacion: 1, cotizacion: 2, administrativo: 3, operacion: 4 };
  var CUPO = 2;
  // Festivos de Colombia 2026 y 2027
  var FEST = ['2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25',
    '2027-01-01', '2027-01-11', '2027-03-22', '2027-03-25', '2027-03-26', '2027-05-01', '2027-05-10', '2027-05-31', '2027-06-07', '2027-07-05', '2027-07-20', '2027-08-07', '2027-08-16', '2027-10-18', '2027-11-01', '2027-11-15', '2027-12-08', '2027-12-25'];
  function habil(f) { var w = new Date(f + 'T12:00:00').getDay(); return w >= 1 && w <= 5 && FEST.indexOf(f) < 0; }
  function sumarHab(f, n) { f = f.slice(0, 10); var k = 0; while (k < n) { f = addD(f, 1); if (habil(f)) k++; } return f; }
  function restarHab(f, n) { f = f.slice(0, 10); var k = 0; while (k < n) { f = addD(f, -1); if (habil(f)) k++; } return f; }
  function habDesde(desde) { if (!desde) return 0; var f = desde.slice(0, 10), h = dia(0), n = 0; while (f < h) { f = addD(f, 1); if (habil(f)) n++; } return n; }

  // ---------------------------------------------------------------- estado inicial de cada convenio
  function derivada(c) {
    if (c.firma_estado === 'firmado' || c.estado === 'Contratado' || c.estado === 'Finalizado') return 'operacion';
    if (c.ppto_estado === 'aceptado' || /por_firmar/.test(c.firma_estado || '')) return 'administrativo';
    return 'cotizacion';
  }
  var NOMS = [['Participante', 'Natalia', 'Suárez (ejemplo)'], ['Participante', 'Julián', 'Mora (ejemplo)'], ['Participante', 'Sofía', 'Castro (ejemplo)'], ['Participante', 'Diego', 'Rincón (ejemplo)'], ['Instructor', 'Ricardo', 'León (ejemplo)'], ['Staff', 'Paola', 'Méndez (ejemplo)']];
  function listadoEj(c, n) { return NOMS.slice(0, n).map(function (x, k) { return { rol: x[0], nombre: x[1], apellido: x[2], tipo_doc: 'CC', documento: String(1010000000 + c.id * 100 + k), correo: '', telefono: '', especialidad: x[0] === 'Instructor' ? 'Ortopedia' : '', institucion: '' }; }); }
  I.CT.forEach(function (c, k) {
    c.fase = derivada(c); c.fase_desde = c.actualizado_en || c.creado_en || X.ahora(); c.cotiz_limite = null;
    if (c.fase !== 'cotizacion' || c.ppto_estado === 'solicitado') c.listado = listadoEj(c, 6);
  });
  // Un ejemplo con el plazo del cliente corriendo y otro con alerta de más de 2 días hábiles
  (function () {
    var sel = I.CT.filter(function (c) { return c.fase === 'cotizacion' && ['sin_presupuesto', 'seleccion'].indexOf(c.ppto_estado) >= 0 && c.estado !== 'Cancelado'; });
    if (sel[0]) { sel[0].fase_desde = ahora(); sel[0].cotiz_limite = sumarHab(dia(0), 3); }
    var otro = I.CT.find(function (c) { return c.fase === 'cotizacion' && c !== sel[0] && c.estado !== 'Cancelado'; });
    if (otro) { var f = restarHab(dia(0), 3); otro.fase_desde = f + ' 09:00:00'; if (['sin_presupuesto', 'seleccion'].indexOf(otro.ppto_estado) >= 0) otro.cotiz_limite = sumarHab(f, 3); }
  })();

  function cotiz(c) {
    var lim = c.cotiz_limite, env = ['sin_presupuesto', 'seleccion'].indexOf(c.ppto_estado) < 0, h = dia(0), r = { limite: lim, enviado: env, abierto: true, vencido: false, habiles_restantes: null };
    if (lim && !env) { r.vencido = h > lim; r.abierto = !r.vencido; var n = 0, d = addD(h, 1); while (d <= lim) { if (habil(d)) n++; d = addD(d, 1); } r.habiles_restantes = r.vencido ? 0 : n; }
    return r;
  }
  function listRes(c) { var L = c.listado || [], r = { total: L.length, Participante: 0, Instructor: 0, Staff: 0 }; L.forEach(function (p) { r[p.rol] = (r[p.rol] || 0) + 1; }); return { n: L.length, roles: r, nombre: c.listado_nombre || (L.length ? 'Listado del cliente (ejemplo).xlsx' : ''), en: c.listado_en || null, por: c.listado_por || '' }; }
  function prog(c) { return !!(I.progDe && I.progDe(c.id).length); }
  function seg(c) {
    var f = c.fase, nl = I.PPL.filter(function (l) { return l.contrato_id === c.id; }).length + I.PPE.filter(function (e) { return e.contrato_id === c.id; }).length, pe = c.ppto_estado, fv = F.vigente(c.id);
    var pas = function (x) { return ORD[f] > ORD[x]; };
    var L = I.PPL.filter(function (l) { return l.contrato_id === c.id; }), lis = L.filter(function (l) { return l.prep_estado === 'Listo'; }).length;
    var ev = c.evento_id && X.EV.find(function (e) { return e.id === c.evento_id && e.estado !== 'cancelado'; });
    var B = {
      negociacion: [['Solicitud registrada', 1], ['Enlace del cliente generado', c.acceso_token || pas('negociacion') ? 1 : 0]],
      cotizacion: [['El cliente eligió lo que necesita', nl ? 1 : 0], ['Programa / agenda', prog(c) ? 1 : 0], ['Listado de personas', (c.listado || []).length ? 1 : 0],
        ['El cliente finalizó su pedido', ['solicitado', 'emitido', 'aceptado', 'ajustes'].indexOf(pe) >= 0 || pas('cotizacion') ? 1 : 0], ['Presupuesto emitido', ['emitido', 'aceptado'].indexOf(pe) >= 0 || pas('cotizacion') ? 1 : 0],
        ['Aceptado por el cliente', pe === 'aceptado' || pas('cotizacion') ? 1 : 0], ['Aprobado y cerrado por Cotizaciones', pas('cotizacion') ? 1 : 0]],
      administrativo: [['Convenio listo para firmar', fv || pas('administrativo') ? 1 : 0], ['Firma del cliente', (fv && fv.cliente_firma) || pas('administrativo') ? 1 : 0], ['Firma de CLEMI', (fv && fv.clemi_firma) || pas('administrativo') ? 1 : 0], ['Negociación cerrada', pas('administrativo') ? 1 : 0]],
      operacion: (function () { var op = opProg(c.id); return [['Aceptado por Operaciones', ['en_preparacion', 'listo'].indexOf(c.op_estado) >= 0 ? 1 : 0], ['Programado en la agenda', ev ? 1 : 0], ['Check list de preparación', op.total ? op.listos / op.total : (ev ? 1 : 0), op.total ? op.listos + ' de ' + op.total + ' listos' : 'Sin ítems']]; })()
    };
    var out = {};
    Object.keys(B).forEach(function (k) {
      var s = 0, P = B[k].map(function (p) { s += p[1]; return { t: p[0], ok: p[1] >= 1, v: p[1], det: p[2] || '' }; }), pct = Math.round(s * 100 / B[k].length);
      if (pas(k) && k !== 'operacion') pct = 100; if (ORD[k] > ORD[f]) pct = Math.min(pct, 99);
      out[k] = { pct: pct, pasos: P };
    });
    return out;
  }
  function pendiente(c) {
    var f = c.fase, pe = c.ppto_estado, fv = F.vigente(c.id);
    if (f === 'cotizacion') return { sin_presupuesto: 'Cliente (armar y finalizar su pedido)', seleccion: 'Cliente (armar y finalizar su pedido)', ajustes: 'Cliente (armar y finalizar su pedido)', solicitado: 'Presupuesto (emitir)', emitido: 'Cliente (aceptar el presupuesto)', aceptado: 'Cotizaciones (aprobar y cerrar)' }[pe] || 'Cotización';
    if (f === 'administrativo') return !fv ? 'Administrativo (preparar el convenio para firma)' : !fv.cliente_firma ? 'Firma del cliente' : !fv.clemi_firma ? 'Firma de CLEMI' : 'Administrativo (CERRAR NEGOCIACIÓN)';
    if (f === 'negociacion') return 'Negociación';
    if (c.op_estado === 'por_aceptar') return 'Operaciones (aceptar el convenio)';
    if (c.op_estado === 'listo') return 'Nada: salas listas';
    return 'Operación (check list de preparación)';
  }
  function alerta(c, s) {
    if (c.estado === 'Cancelado' || c.estado === 'Finalizado') return null;
    if (c.fase === 'operacion') {
      s = s || seg(c); if (s.operacion.pct >= 100 || c.fecha_inicio < dia(0)) return null;
      var n = 0, d = dia(0); while (d < c.fecha_inicio) { if (habil(d)) n++; d = addD(d, 1); }
      return n <= 2 ? { fase: 'operacion', dias: n, texto: 'Faltan ' + n + ' día(s) hábil(es) para el inicio y la preparación va en ' + s.operacion.pct + ' %.' } : null;
    }
    var h = habDesde(c.fase_desde); if (h <= 2) return null;
    return { fase: c.fase, dias: h, texto: 'La fase ' + FN[c.fase] + ' lleva ' + h + ' días hábiles sin cerrarse · pendiente: ' + pendiente(c) + '.' };
  }
  function pasar(c, f, det) { var YO = X.yo(); X.reg(YO ? YO.id : null, 'contrato', c.id, null, 'El convenio ' + c.codigo + ' pasó a la fase ' + FN[f], FN[c.fase] + ' → ' + FN[f] + (det ? '\n' + det : '')); c.fase = f; c.fase_desde = ahora(); }
  function salasDe(c) { return c.salas_ids && c.salas_ids.length ? c.salas_ids : [c.sala_id]; }
  function salasNom(L) { return L.map(function (i) { return (X.SALAS.find(function (s) { return s.id === +i; }) || {}).nombre || 'Sala ' + i; }).join(', '); }
  function enriquecer(o) { if (!o || !o.id) return o; var c = I.CT.find(function (k) { return k.id === +o.id; }); if (!c) return o; o.fase = c.fase; o.salas = salasDe(c); o.salas_nombres = salasNom(o.salas); o.salas_n = o.salas.length; o.instructores_n = c.instructores_n || 0; o.staff_n = c.staff_n || 0; o.cotiz = cotiz(c); o.listado = listRes(c); if (o.acceso) o.acceso.hasta = c.fecha_fin; return o; }

  // ---------------------------------------------------------------- cupo de la agenda (máximo 2 por fecha)
  function ocupacion(desde, hasta, exC, exE) {
    var o = {}, add = function (f, x) { (o[f] = o[f] || []).push(x); };
    var exEv = exC ? (I.CT.find(function (c) { return c.id === exC; }) || {}).evento_id : null;
    X.EV.forEach(function (e) { if (e.estado === 'cancelado' || e.id === exE || e.id === exEv) return; (e.dias && e.dias.length ? e.dias.map(function (d) { return d.fecha; }) : [e.fecha]).forEach(function (f) { if (f >= desde && f <= hasta) add(f, e.titulo + (e.empresa ? ' · ' + e.empresa : '')); }); });
    I.CT.forEach(function (c) {
      if (['Solicitud', 'Cotización', 'Contratado'].indexOf(c.estado) < 0 || c.id === exC || (exE && c.evento_id === exE)) return;
      if (c.evento_id && X.EV.some(function (e) { return e.id === c.evento_id && e.estado !== 'cancelado'; })) return;
      for (var f = c.fecha_inicio > desde ? c.fecha_inicio : desde; f <= c.fecha_fin && f <= hasta; f = addD(f, 1)) add(f, c.codigo + ' · ' + c.cliente + ' · ' + c.curso);
    });
    return o;
  }
  function cupo(desde, hasta, exC, exE) {
    if (!desde || !hasta || hasta < desde) return; var o = ocupacion(desde, hasta, exC, exE);
    Object.keys(o).sort().forEach(function (f) { if (o[f].length >= CUPO) E('El ' + f.split('-').reverse().join('/') + ' la agenda ya tiene ' + o[f].length + ' eventos (' + o[f].slice(0, 3).join('; ') + '). Por fecha solo se pueden cruzar ' + CUPO + ' eventos: elija otras fechas.', 409, { cupo: true }); });
  }
  function importarListado(c, eid) {
    var n = 0; (c.listado || []).forEach(function (p) {
      if (X.INS.some(function (i) { return i.evento_id === eid && i.documento === p.documento; })) return;
      X.INS.push({ id: X.INS.reduce(function (m, i) { return Math.max(m, i.id); }, 0) + 1, evento_id: eid, codigo: 'CLMDEMO' + Math.random().toString(36).slice(2, 6).toUpperCase(), rol: p.rol, nombre: p.nombre, apellido: p.apellido, tipo_doc: 'CC', documento: p.documento, especialidad: p.especialidad || '', institucion: p.institucion || '', correo: p.correo || '', telefono: p.telefono || '', estacion: '', nota: '', origen: 'Listado del cliente', dietas: [], restriccion: '', creado_en: ahora() });
      n++;
    });
    return n;
  }
  function limpiarListado(F2) {
    if (!Array.isArray(F2) || !F2.length) E('El listado no tiene filas con nombre y documento.');
    var vis = {}, out = [];
    F2.forEach(function (f) { var nom = t(f.nombre, 120), doc = t(f.documento, 40).replace(/\s+/g, ''); if (!nom || !doc || vis[doc]) return; vis[doc] = 1; var r = String(f.rol || '').toLowerCase();
      out.push({ nombre: nom, apellido: t(f.apellido, 120), tipo_doc: t(f.tipo_doc, 40), documento: doc, rol: /instruct|docente|profesor|ponente|speaker|conferencista|tutor/.test(r) ? 'Instructor' : /staff|apoyo|log[ií]st|organiza|coordina|equipo|personal/.test(r) ? 'Staff' : 'Participante', correo: t(f.correo, 160), telefono: t(f.telefono, 40), especialidad: t(f.especialidad, 120), institucion: t(f.institucion, 200) }); });
    if (!out.length) E('El listado no tiene filas con nombre y documento.');
    return out;
  }
  function tieneAD(YO) { var u = X.U.find(function (k) { return k.id === YO.id; }) || YO; return YO.rol === 'admin' || (I.AREAS[u.rol] || []).concat(String(u.areas_extra || '').split(',')).indexOf('ad') >= 0; }
  function puedeCT(YO) { return YO.rol === 'admin' || YO.rol === 'comercial'; }
  function puedePS(YO) { var u = X.U.find(function (k) { return k.id === YO.id; }) || YO; return YO.rol === 'admin' || (I.AREAS[u.rol] || []).concat(String(u.areas_extra || '').split(',')).indexOf('ps') >= 0; }

  // ---------------------------------------------------------------- acciones
  function adC(id) { var c = I.CT.find(function (k) { return k.id === +id; }); if (!c) E('El convenio no existe.', 404); return c; }
  function enFirmas(c) { if (c.fase !== 'administrativo') E(c.fase === 'operacion' ? 'La negociación ya está cerrada: el convenio está en La operación.' : 'El convenio aún no llega a Administrativo: Cotizaciones debe aprobar y cerrar la cotización.', 409); }
  function abierta(c) { var f = F.vigente(c.id); if (!f) E('Primero prepare el convenio para firma.', 409); if (f.estado === 'Firmado') E('El convenio ya está firmado y archivado.', 409); return f; }
  function recalcular(f, c) {
    if (f.cliente_firma && f.clemi_firma) { f.estado = 'Firmas completas'; c.firma_estado = 'por_cerrar'; }
    else if (f.cliente_firma) { f.estado = 'Por firmar CLEMI'; c.firma_estado = 'por_firmar_clemi'; }
    else { f.estado = 'Por firmar el cliente'; c.firma_estado = 'por_firmar_cliente'; }
  }
  function firmante(v, lado, c, YO) {
    var nom = t(v.nombre, 160), doc = t(v.documento, 40), car = t(v.cargo, 120);
    if (lado === 'clemi') { nom = nom || I.CLEMI_D.rep_legal; doc = doc || I.CLEMI_D.rep_doc || '—'; car = car || 'Representante legal'; }
    if (nom.length < 5 || doc.length < 1 || !car) E('Escriba el nombre completo, el documento y el cargo de quien firma.');
    return { nombre: nom, tipo_doc: v.tipo_doc || 'cédula de ciudadanía', documento: doc, cargo: car, usuario: 'registrada por ' + YO.usuario, registrada_por: YO.nombre, fecha: ahora(), ip: '190.0.0.50' };
  }
  function manejar(a, q, v, YO) {
    var c, f, x;
    switch (a) {
      case 'agenda':
        var desde = /^\d{4}-\d{2}-\d{2}$/.test(q.desde || '') ? q.desde : dia(0), hasta = /^\d{4}-\d{2}-\d{2}$/.test(q.hasta || '') ? q.hasta : addD(desde, 6);
        var evs = X.EV.filter(function (e) { return e.fecha <= hasta && (e.fecha_fin || e.fecha) >= desde; }).map(function (e) {
          var cc = I.CT.find(function (k) { return k.evento_id === e.id; });
          return { id: e.id, titulo: e.titulo, especialidad: e.especialidad, empresa: e.empresa, sala_id: e.sala_id, fecha: e.fecha, fecha_fin: e.fecha_fin || e.fecha, hora_ini: e.hora_ini, hora_fin: e.hora_fin, responsable_id: e.responsable_id, tanatologo_id: e.tanatologo_id, estado: e.estado,
            participantes: e.participantes, personas: X.INS.filter(function (i) { return i.evento_id === e.id; }).length, convenio: cc ? cc.codigo : null, dias: clone(e.dias && e.dias.length ? e.dias : [{ fecha: e.fecha, hora_ini: e.hora_ini, hora_fin: e.hora_fin }]) };
        });
        var res = I.CT.filter(function (k) { return ['Solicitud', 'Cotización', 'Contratado'].indexOf(k.estado) >= 0 && k.fecha_inicio <= hasta && k.fecha_fin >= desde && !(k.evento_id && X.EV.some(function (e) { return e.id === k.evento_id && e.estado !== 'cancelado'; })); })
          .map(function (k) { return { id: k.id, codigo: k.codigo, cliente: k.cliente, curso: k.curso, especialidad: k.especialidad, sala_id: k.sala_id, salas: salasDe(k), fecha_inicio: k.fecha_inicio, fecha_fin: k.fecha_fin, hora_ini: k.hora_ini, hora_fin: k.hora_fin, estado: k.estado, fase: k.fase, participantes: k.participantes }; });
        var oc = {}, O = ocupacion(desde, hasta); Object.keys(O).forEach(function (k) { oc[k] = O[k].length; });
        return { eventos: evs, reservas: res, ocupacion: oc, cupo: CUPO, desde: desde, hasta: hasta, festivos: FEST, hoy: dia(0) };
      case 'adm_alertas':
        if (!tieneAD(YO)) E('Administrativo: sin acceso a esta sección.', 403);
        return { alertas: I.CT.filter(function (k) { return k.fecha_fin >= dia(0); }).map(function (k) { var al = alerta(k); return al ? { id: k.id, codigo: k.codigo, cliente: k.cliente, curso: k.curso, fecha_inicio: k.fecha_inicio, fase: al.fase, dias: al.dias, texto: al.texto, clave: k.id + '-' + al.fase + '-' + al.dias } : null; }).filter(Boolean) };
      case 'adm_convenio':
        if (!tieneAD(YO)) E('Administrativo: sin acceso a esta sección.', 403);
        c = adC(q.id); var P = I.ppCompleto(c); f = F.vigente(c.id);
        var o = enriquecer(I.vista(c, true)); o.convenio = c.nombre_convenio || ('Convenio ' + c.cliente + ' · ' + c.curso);
        var fp = f ? F.fpub(f) : null;
        if (fp) { ['cliente_firma', 'clemi_firma'].forEach(function (k) { if (f[k] && f[k].modo !== 'anexo') fp[k].imagen = f[k].img || F.ejemplo; }); fp.html = F.fhtml(f); fp.hash = fp.hash || 'demo0000000000000000'; }
        var u = I.ultimo(c.id);
        return { contrato: o, ppto: { lineas: P.lineas, totales: P.totales, especiales: P.especiales, version: P.versiones[0] || null, estado: c.ppto_estado },
          programa: clone(I.progDe(c.id)), documentos: [], listado: clone(c.listado || []), plan: u ? { version: u.version, resumen: I.resumen(u.items), autor: u.autor_nombre, en: u.creado_en } : null,
          firma: fp, faltantes: I.docFaltan(c, I.docDatos(c), P.totales), clemi: clone(I.CLEMI_D), fases: seg(c), fase: c.fase, pendiente: pendiente(c), alerta: alerta(c), nombres: FN,
          puede_cerrar: c.fase === 'administrativo' && !!f && !!f.cliente_firma && !!f.clemi_firma && f.estado !== 'Firmado',
          bitacora: clone(X.BIT.filter(function (b) { return ['contrato', 'ppto'].indexOf(b.entidad) >= 0 && b.entidad_id === c.id; }).slice(-60).reverse()) };
      case 'adm_firma_preparar':
        c = adC(v.contrato_id); enFirmas(c); if (c.ppto_estado !== 'aceptado') E('El presupuesto debe estar aceptado por el cliente.', 409);
        var P2 = I.ppCompleto(c), fal = I.docFaltan(c, I.docDatos(c), P2.totales); if (fal.length) E('Antes de preparar el convenio para firma faltan estos datos (los completa Negociación en «Documento del convenio»): ' + fal.join(', ') + '.', 409);
        var ant = F.vigente(c.id); if (ant) { ant.estado = 'Anulado'; ant.anulado_motivo = 'Reemplazado por una nueva versión'; ant.anulado_en = ahora(); }
        var ver = F.FIR.filter(function (k) { return k.contrato_id === c.id; }).length + 1;
        F.FIR.push({ id: F.FIR.reduce(function (m, k) { return Math.max(m, k.id); }, 0) + 1, contrato_id: c.id, clave: null, version: ver, estado: 'Por firmar el cliente', hash: Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2) + 'demo', total: P2.totales.total, enviado_por: YO.nombre, enviado_en: ahora(), cliente_firma: null, clemi_firma: null });
        c.firma_estado = 'por_firmar_cliente'; X.reg(YO.id, 'contrato', c.id, null, 'Preparó el convenio ' + c.codigo + ' para firma (versión ' + ver + ')', 'Total ' + P2.totales.total);
        return { firma_id: F.FIR.length, correos: 0 };
      case 'adm_firma':
        c = adC(v.contrato_id); enFirmas(c); f = abierta(c); var lado = v.lado === 'clemi' ? 'clemi' : 'cliente';
        if (f[lado + '_firma']) E('Esa firma ya está registrada. Quítela primero si necesita reemplazarla.', 409);
        if (v.clave !== 'demo') E('La contraseña no coincide. En la vista previa es «demo».', 401); if (!v.firma) E('Dibuje la firma en el recuadro.');
        f[lado + '_firma'] = Object.assign(firmante(v, lado, c, YO), { modo: 'pad', img: v.firma }); f[lado + '_firmado_en'] = ahora(); recalcular(f, c);
        X.reg(YO.id, 'contrato', c.id, null, 'Registró la firma ' + (lado === 'clemi' ? 'de CLEMI' : 'del cliente') + ' en el convenio ' + c.codigo, f[lado + '_firma'].nombre + ' · ' + f[lado + '_firma'].cargo);
        return { estado: f.estado };
      case 'adm_firma_quitar':
        c = adC(v.contrato_id); enFirmas(c); f = abierta(c); var l2 = v.lado === 'clemi' ? 'clemi' : 'cliente'; if (t(v.motivo).length < 4) E('Escriba el motivo.');
        f[l2 + '_firma'] = null; f[l2 + '_firmado_en'] = null; recalcular(f, c); X.reg(YO.id, 'contrato', c.id, null, 'Quitó la firma ' + (l2 === 'clemi' ? 'de CLEMI' : 'del cliente') + ' del convenio ' + c.codigo, t(v.motivo)); return {};
      case 'adm_cerrar':
        c = adC(v.contrato_id); enFirmas(c);
        if (['CERRAR NEGOCIACION', 'CERRAR NEGOCIACIÓN'].indexOf(t(v.confirmar).toUpperCase()) < 0) E('Escriba CERRAR NEGOCIACIÓN para confirmar.');
        f = F.vigente(c.id); if (!f || !f.cliente_firma || !f.clemi_firma) E('Faltan firmas: el convenio necesita la firma del cliente y la de CLEMI.', 409);
        f.estado = 'Firmado'; f.archivo = 1; var antes = c.estado; c.estado = 'Contratado'; c.firma_estado = 'firmado'; c.valor = f.total; c.op_estado = 'por_aceptar';
        X.reg(YO.id, 'contrato', c.id, null, 'CERRÓ LA NEGOCIACIÓN del convenio ' + c.codigo, 'Convenio con las dos firmas, archivado.' + (antes !== 'Contratado' ? '\nEstado: ' + antes + ' → Contratado' : ''));
        pasar(c, 'operacion', 'Se distribuyen las tareas contratadas a cada área (Preparación).'); return {};
      case 'cotiz_plazo':
        if (!puedeCT(YO)) E('Solo Negociación puede hacer esto.', 403); c = adC(v.contrato_id);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v.limite || '') || v.limite < dia(0)) E('Indique una fecha límite desde hoy en adelante.'); if (v.limite > c.fecha_fin) E('El plazo no puede pasar de la fecha de finalización del evento.');
        X.reg(YO.id, 'contrato', c.id, null, 'Amplió el plazo del cliente para el pedido de cotización de ' + c.codigo, (c.cotiz_limite || '—') + ' → ' + v.limite); c.cotiz_limite = v.limite; return {};
      case 'cotiz_cerrar':
        if (!puedeCT(YO) && !puedePS(YO)) E('Solo Cotizaciones cierra la cotización.', 403); c = adC(v.contrato_id);
        if (c.fase !== 'cotizacion') E('El convenio no está en la fase de Cotización.', 409); if (c.ppto_estado !== 'aceptado') E('Primero el cliente debe aceptar el presupuesto emitido.', 409);
        if (!prog(c)) E('Falta el programa / agenda del entrenamiento.', 409); if (!(c.listado || []).length) E('Falta el listado de personas del cliente (sin listado no hay QR ni ingreso).', 409);
        if (c.estado === 'Solicitud') c.estado = 'Cotización';
        pasar(c, 'administrativo', 'Cotización aprobada y cerrada. Administrativo revisa lo solicitado y cotizado, recoge las firmas y cierra la negociación.'); return {};
      case 'contrato_listado':
        if (!puedeCT(YO) && !puedePS(YO)) E('Sin permiso.', 403); c = adC(v.contrato_id);
        c.listado = limpiarListado(v.filas); c.listado_nombre = t(v.archivo, 180); c.listado_en = ahora(); c.listado_por = YO.nombre;
        X.reg(YO.id, 'contrato', c.id, null, 'Cargó el listado de personas de ' + c.codigo, c.listado.length + ' personas');
        return { n: c.listado.length, importados: c.evento_id ? importarListado(c, c.evento_id) : 0 };
      case 'listado_traer':
        var e = X.EV.find(function (k) { return k.id === +v.evento_id; }); c = e && I.CT.find(function (k) { return k.evento_id === e.id; });
        if (!c) E('Este entrenamiento no está vinculado a un convenio.'); if (!(c.listado || []).length) E('El cliente aún no ha entregado el listado de personas.');
        return { importados: importarListado(c, e.id), total: c.listado.length };
    }
    return null;
  }
  D.subirForm = function (accion, fd) {
    var YO = X.yo(), v = { contrato_id: fd.get('contrato_id'), lado: fd.get('lado'), nombre: fd.get('nombre'), cargo: fd.get('cargo'), tipo_doc: fd.get('tipo_doc'), documento: fd.get('documento') }, arch = fd.get('archivo');
    try {
      var c = adC(v.contrato_id); enFirmas(c); var f = abierta(c), lado = v.lado === 'clemi' ? 'clemi' : 'cliente';
      if (f[lado + '_firma']) E('Esa firma ya está registrada. Quítela primero si necesita reemplazarla.', 409);
      if (!arch || !arch.name) E('Adjunte el convenio firmado digitalmente.');
      f[lado + '_firma'] = Object.assign(firmante(v, lado, c, YO), { modo: 'anexo', anexo_nombre: arch.name, anexo_url: URL.createObjectURL(arch) }); f[lado + '_firmado_en'] = ahora(); recalcular(f, c);
      X.reg(YO.id, 'contrato', c.id, null, 'Anexó la firma digital ' + (lado === 'clemi' ? 'de CLEMI' : 'del cliente') + ' al convenio ' + c.codigo, arch.name);
      return Promise.resolve({ ok: true, estado: f.estado });
    } catch (e) { return Promise.resolve(e && e.body ? e.body : { ok: false, error: String(e) }); }
  };
  // En la vista previa, el anexo se abre desde la memoria del navegador.
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a.adf-anexo'); if (!a) return;
    var m = /[?&]id=(\d+)&lado=(\w+)/.exec(a.getAttribute('href')); var f = m && F.FIR.find(function (k) { return k.id === +m[1]; }), x = f && f[m[2] + '_firma'];
    ev.preventDefault(); if (x && x.anexo_url) window.open(x.anexo_url, '_blank');
  }, true);

  // ---------------------------------------------------------------- Preparación de salas (recepción en La operación)
  var P = D.PREP || {}, OPC = [], opSeq = 0;
  function opChecks(c) {
    if (OPC.some(function (k) { return k.contrato_id === c.id; })) return;
    var u = I.ultimo(c.id), n = (c.listado || []).length;
    [['sala', 'op', 'Sala montada según la distribución del cliente' + (u ? ' (versión ' + u.version + ')' : ' (distribución base de la sala)')], ['listado', 'op', 'Listado de personas con su código QR revisado' + (n ? ' (' + n + ' personas)' : '')],
      ['programa', 'op', 'Programa / agenda del entrenamiento revisado con el equipo']].concat(c.componentes > 0 ? [['componentes', 'mo', 'Componentes anatómicos / segmentos preparados: ' + c.componentes + (c.tipo_componente ? ' · ' + c.tipo_componente : '')]] : [])
      .forEach(function (x) { OPC.push({ id: ++opSeq, contrato_id: c.id, clave: x[0], area: x[1], texto: x[2], estado: 'Pendiente', por: null, en: null, nota: '' }); });
  }
  I.CT.forEach(function (c) { if (c.fase === 'operacion' && c.estado !== 'Cancelado') { c.op_estado = c.evento_id ? 'en_preparacion' : 'por_aceptar'; if (c.evento_id) { c.op_aceptado_por = 'Teresa Cuéllar'; c.op_aceptado_en = c.actualizado_en || ahora(); opChecks(c); } } });
  function opProg(cid) {
    var L = I.PPL.filter(function (l) { return l.contrato_id === cid; }), K = OPC.filter(function (k) { return k.contrato_id === cid; });
    var t = L.length + K.length, l = L.filter(function (x) { return x.prep_estado === 'Listo'; }).length + K.filter(function (x) { return x.estado === 'Listo'; }).length;
    return { total: t, listos: l, pct: t ? Math.floor(l * 100 / t) : 0 };
  }
  function opRecalc(c) {
    if (['en_preparacion', 'listo'].indexOf(c.op_estado) < 0) return; var p = opProg(c.id), YO = X.yo();
    if (p.total && p.listos === p.total && c.op_estado !== 'listo') { c.op_estado = 'listo'; c.op_listo_en = ahora(); X.reg(YO.id, 'plan', c.id, c.evento_id, 'Salas listas: el check list de ' + c.codigo + ' quedó completo', p.total + ' ítems listos'); }
    else if (c.op_estado === 'listo' && p.listos < p.total) { c.op_estado = 'en_preparacion'; c.op_listo_en = null; }
  }
  function misAreas(YO) { var u = X.U.find(function (k) { return k.id === YO.id; }) || YO; return YO.rol === 'admin' ? ['op', 'mo', 'av', 'lg', 'bm', 'ps'] : (I.AREAS[u.rol] || []).concat(String(u.areas_extra || '').split(',')); }
  function puedeAceptar(YO) { return YO.rol === 'admin' || (YO.rol === 'instrumentador' && misAreas(YO).indexOf('op') >= 0); }
  function opManejar(a, q, v, YO) {
    var c, k;
    if (a === 'op_detalle') {
      c = adC(q.id); if (c.fase !== 'operacion') E('Este convenio aún no llega a la operación.', 409);
      var s = X.SALAS.find(function (z) { return z.id === c.sala_id; }) || {}, u = I.ultimo(c.id), ev = c.evento_id ? X.EV.find(function (e) { return e.id === c.evento_id; }) : null;
      var L = I.PPL.filter(function (l) { return l.contrato_id === c.id; }).map(function (l) { var ar = P.areaL(l), lp = P.linPrep(l), it = l.item_id ? I.PPI.find(function (z) { return z.id === l.item_id; }) : null;
        return { id: l.id, area: ar, prep: P.areaPrep(ar, l.categoria), categoria: l.categoria, descripcion: l.descripcion, codigo: it ? it.codigo : '', unidad: l.unidad, cantidad: l.cantidad, dias: l.dias, opcion: l.opcion || '', nota: l.nota, especial: !!l.especial_id, prep_estado: lp.prep_estado, prep_por: lp.prep_por, prep_en: lp.prep_en, prep_nota: lp.prep_nota, datos: l.datos || null }; });
      return { contrato: { id: c.id, codigo: c.codigo, convenio: c.nombre_convenio || ('Convenio ' + c.cliente + ' · ' + c.curso), cliente: c.cliente, curso: c.curso, especialidad: c.especialidad, sala_id: c.sala_id, sala: s.nombre, fecha_inicio: c.fecha_inicio, fecha_fin: c.fecha_fin, hora_ini: c.hora_ini, hora_fin: c.hora_fin,
          participantes: c.participantes, estaciones: c.estaciones, componentes: c.componentes || 0, tipo_componente: c.tipo_componente || '', observaciones: c.observaciones, contacto: c.contacto_nombre, contacto_telefono: c.contacto_telefono, op_estado: c.op_estado, op_aceptado_por: c.op_aceptado_por, op_aceptado_en: c.op_aceptado_en, op_listo_en: c.op_listo_en },
        sala: clone(s), plan: u ? { version: u.version, items: clone(u.items), autor: u.autor_nombre, en: u.creado_en, resumen: I.resumen(u.items) } : null, evento: ev ? { id: ev.id, titulo: ev.titulo, fecha: ev.fecha, fecha_fin: ev.fecha_fin || ev.fecha, estado: ev.estado } : null,
        inscritos: ev ? clone(X.INS.filter(function (i) { return i.evento_id === ev.id; })) : [], listado: ev ? [] : clone(c.listado || []), lineas: L, componentes: L.filter(function (l) { return l.area === 'Morgue'; }),
        especiales: clone(I.PPE.filter(function (e) { return e.contrato_id === c.id && e.estado === 'Aprobada'; })), programa: clone(I.progDe(c.id)), av: [], checks: clone(OPC.filter(function (z) { return z.contrato_id === c.id; })), progreso: opProg(c.id),
        areas: P.areasPrepDe(YO), mis_areas: misAreas(YO), puede_aceptar: puedeAceptar(YO),
        bitacora: clone(X.BIT.filter(function (b) { return b.entidad === 'plan' && b.entidad_id === c.id && /^(Preparación|Operaciones|Salas listas|Check list)/.test(b.accion); }).slice(-60).reverse()) };
    }
    if (a === 'op_aceptar') {
      if (!puedeAceptar(YO)) E('Solo Operaciones (instrumentación) acepta los convenios.', 403); c = adC(v.contrato_id); if (c.op_estado !== 'por_aceptar') E('Este convenio ya fue aceptado.', 409);
      if (!c.evento_id) {
        if (!+v.responsable_id) E('Seleccione el instrumentador a cargo.'); cupo(c.fecha_inicio, c.fecha_fin, c.id, 0);
        var dias = [], f = c.fecha_inicio; while (f <= c.fecha_fin) { dias.push({ fecha: f, hora_ini: c.hora_ini, hora_fin: c.hora_fin, hora_fin_ext: null, justificacion: '' }); f = addD(f, 1); }
        var u2 = I.ultimo(c.id); X.seq.ev++;
        var ne = { id: X.seq.ev, titulo: c.curso, especialidad: c.especialidad, empresa: c.cliente, sala_id: c.sala_id, fecha: c.fecha_inicio, fecha_fin: c.fecha_fin, hora_ini: c.hora_ini, hora_fin: c.hora_fin, responsable_id: +v.responsable_id, tanatologo_id: +v.tanatologo_id || null, apoyo: [], dias: dias,
          participantes: c.participantes, componentes: c.componentes, descripcion: 'Curso contratado ' + c.codigo, estado: 'programado', layout: u2 ? clone(u2.items) : [], creado_por: YO.id, creado_en: ahora(), actualizado_por: YO.id, actualizado_en: ahora() };
        X.EV.push(ne); c.evento_id = ne.id; X.reg(YO.id, 'evento', ne.id, ne.id, 'Creó el evento desde el convenio ' + c.codigo, c.curso);
      }
      importarListado(c, c.evento_id); opChecks(c); c.op_estado = 'en_preparacion'; c.op_aceptado_por = YO.nombre; c.op_aceptado_en = ahora();
      X.reg(YO.id, 'plan', c.id, c.evento_id, 'Operaciones aceptó el convenio ' + c.codigo + ': pasa a «En preparación»', c.cliente + ' · ' + c.curso);
      return { evento_id: c.evento_id, personas: X.INS.filter(function (i) { return i.evento_id === c.evento_id; }).length };
    }
    if (a === 'op_check') {
      k = OPC.find(function (z) { return z.id === +v.id; }); if (!k) E('No existe.', 404); c = adC(k.contrato_id);
      if (c.op_estado === 'por_aceptar') E('Primero Operaciones debe aceptar el convenio.', 409); if (misAreas(YO).indexOf(k.area) < 0) E('Este ítem lo marca otra área.', 403);
      k.estado = v.estado === 'Listo' ? 'Listo' : 'Pendiente'; k.por = YO.nombre; k.en = ahora();
      X.reg(YO.id, 'plan', c.id, c.evento_id, 'Check list de ' + c.codigo + ': ' + k.texto + ' → ' + k.estado.toLowerCase(), ''); opRecalc(c); return { progreso: opProg(c.id) };
    }
    return null;
  }

  // ---------------------------------------------------------------- Paquetes estándar de Audiovisuales, flyer y reel
  var PAQ = [["foto1","Fotografía y diseño","Paquete fotográfico Esencial · Registro fotográfico de curso","Incluye: fotografía de apertura del curso, registro de participantes en clase, fotografías del instructor, detalles de materiales, equipos o prácticas, fotografía grupal final y entrega digital optimizada.\nEntrega: 30 a 50 fotografías en alta calidad en Google Drive.\nIdeal para: cursos internos CLEMI, talleres de formación y capacitaciones empresariales pequeñas.\nValor sugerido: desde $350.000.","paquete",350000,""],["foto2","Fotografía y diseño","Paquete fotográfico Profesional · Curso + evidencia institucional","Incluye: registro fotográfico completo del curso, fotografías individuales de participantes en práctica, fotografías grupales, detalles del proceso formativo, fotografías del instructor, portada visual para informe y selección de fotos destacadas en formato institucional.\nEntrega: 60 a 90 fotografías en alta calidad en Google Drive.\nIdeal para: empresas, aliados industriales, programas de formación técnica y cursos certificados.\nValor sugerido: desde $650.000.","paquete",650000,""],["foto3","Fotografía y diseño","Paquete fotográfico Premium · Curso + diplomas digitales","Incluye: registro fotográfico profesional del curso, fotografía grupal, fotografías individuales de participantes, diseño de diploma o certificado digital con identidad CLEMI y personalización con nombre del participante, nombre del curso, fecha, intensidad horaria y firma institucional.\nEntrega: 80 a 120 fotografías en alta calidad en Google Drive y diplomas digitales en PDF individual para cada participante.\nIdeal para: cursos certificados, diplomados cortos, entrenamientos empresariales y capacitaciones con valor académico.\nValor sugerido: desde $850.000 + $12.000 por diploma digital personalizado.","paquete",850000,""],["foto3d","Fotografía y diseño","Diploma digital personalizado (adicional al paquete Premium)","Diploma o certificado digital con identidad CLEMI, personalizado por participante, en PDF.","diploma",12000,""],["foto4","Fotografía y diseño","Paquete fotográfico Integral · Fotografía + diseño e impresión de diplomas","Incluye: registro fotográfico profesional del curso, fotografías de entrega de certificados, fotografías grupales e individuales, diseño de diploma institucional CLEMI, personalización de cada diploma, preparación para impresión, impresión física en papel fino y entrega organizada. Hasta 20 diplomas impresos incluidos.\nEntrega: 100 a 150 fotografías en alta calidad en Google Drive, diplomas físicos impresos y versión digital PDF de cada diploma.\nIdeal para: ceremonias de cierre, cursos empresariales, formación técnica, eventos académicos y capacitaciones para la industria.\nValor sugerido: desde $1.350.000, hasta 20 participantes.","paquete",1350000,""],["foto4p","Fotografía y diseño","Participante adicional con diploma impreso (paquete Integral)","Diploma personalizado e impreso para cada participante adicional a los 20 incluidos en el paquete Integral.","participante",22000,""],["ev1","Audiovisuales","Paquete de evento Esencial · Auditorio básico con sonido y proyección","Auditorio: auditorio sin traducción ($1.152.598).\nSonido y proyección: consola de sonido, baffle, micrófono y trípode ($950.400), TV auxiliar sala 40\" ($382.800), video beam ($392.040), señaladores ($15.568), adaptadores, cables y conectores ($63.250).\nIdeal para: charlas cortas, capacitaciones internas y jornadas académicas sin transmisión.\nValor sugerido: desde $2.957.000 por día completo de auditorio.","paquete por día",2957000,""],["ev2","Audiovisuales","Paquete de evento Profesional · Evento con soporte técnico y registro","Todo lo del paquete Esencial, más:\nSoporte técnico: persona de soporte técnico VCC por día ($156.816), pruebas antes del evento sin traducción ($26.730).\nRegistro y edición: grabación del evento en video o canal ($83.398), edición de video mp4 ($83.160), módulo de registro ($362.553), participantes con soporte virtual ($1.604 por unidad).\nIdeal para: empresas y aliados industriales que necesitan registro confiable y soporte en sala.\nValor sugerido: desde $3.670.000 por día completo, hasta 50 participantes virtuales.","paquete por día",3670000,""],["ev3","Audiovisuales","Paquete de evento Premium · Evento con transmisión y producción","Todo lo del paquete Profesional, más:\nTransmisión: plataforma VCC por día ($1.654.844), canal Vimeo de transmisión ($356.400), internet canal dedicado ($891.000).\nProducción: videograbadora 4K + trípode ($427.680), Atom mini ($142.560), computador i7 para transmisión ($178.200).\nInteracción: preguntas y votaciones por actividad ($415.800).\nIdeal para: eventos híbridos, lanzamientos institucionales y formación con audiencia virtual activa.\nValor sugerido: desde $8.730.000 por día completo con transmisión en vivo.","paquete por día",8730000,""],["ev4","Audiovisuales","Paquete de evento Integral · Evento completo con traducción y difusión","Todo lo del paquete Premium, más:\nTraducción: traducción español\/inglés doble vía, 2 traductores ($3.373.920), pruebas antes del evento con traducción ($53.460).\nDifusión del evento: envío de newsletter ($130.680), impactos en redes sociales ($102.168), banners de página web ($71.280).\nIdeal para: eventos institucionales de cierre, congresos bilingües y lanzamientos con cobertura externa.\nValor sugerido: desde $12.460.000 por día completo con traducción simultánea y difusión digital.","paquete por día",12460000,""],["flyer","Fotografía y diseño","Diseño de flyer del evento","Flyer con la identidad del evento para redes sociales e impresión. Al pedirlo se diligencian los datos obligatorios: nombre del evento, fechas, horario, lugar, instructores, temas, público, inscripciones, formatos y fecha de entrega.","flyer",null,"flyer"],["reel","Fotografía y diseño","Reel promocional del evento","Video corto vertical para redes sociales. Al pedirlo se diligencian los datos obligatorios: nombre del evento, fechas, horario, lugar, instructores, temas, público, inscripciones, duración, enfoque y fecha de publicación.","reel",null,"reel"]];
  var BRIEF = {"flyer":[["titulo","Nombre del evento o curso",1,""],["fechas","Fechas",1,"Ej. 11 y 12 de diciembre de 2026"],["horario","Horario",1,"Ej. 7:00 a. m. a 5:00 p. m."],["lugar","Lugar",1,"Ej. CLEMI · Sala 2"],["instructores","Instructores (uno por línea, con su título o especialidad)",1,""],["agenda","Temas o agenda resumida",1,"Los puntos que deben aparecer"],["dirigido","Dirigido a",1,"Ej. Ortopedistas y residentes de ortopedia"],["inscripciones","Inscripciones: enlace, teléfono o correo",1,""],["organiza","Organiza \/ aliados (logos que deben ir)",0,""],["valor","Valor de la inscripción o cupos",0,"Si se publica"],["observaciones","Indicaciones adicionales",0,"Colores, fotos de referencia, textos legales…"],["formato","Formatos que necesita",1,"Ej. post 1080×1080, historia 1080×1920, impreso carta"],["entrega","Fecha en que necesita el flyer",1,""]],"reel":[["titulo","Nombre del evento o curso",1,""],["fechas","Fechas",1,"Ej. 11 y 12 de diciembre de 2026"],["horario","Horario",1,"Ej. 7:00 a. m. a 5:00 p. m."],["lugar","Lugar",1,"Ej. CLEMI · Sala 2"],["instructores","Instructores (uno por línea, con su título o especialidad)",1,""],["agenda","Temas o agenda resumida",1,"Los puntos que deben aparecer"],["dirigido","Dirigido a",1,"Ej. Ortopedistas y residentes de ortopedia"],["inscripciones","Inscripciones: enlace, teléfono o correo",1,""],["organiza","Organiza \/ aliados (logos que deben ir)",0,""],["valor","Valor de la inscripción o cupos",0,"Si se publica"],["observaciones","Indicaciones adicionales",0,"Colores, fotos de referencia, textos legales…"],["duracion","Duración del reel",1,"15, 30 o 60 segundos"],["enfoque","Mensaje o enfoque del reel",1,"Qué debe transmitir"],["publicacion","Fecha en que debe publicarse",1,""]]};
  if (I.AVI && I.AVCAT) {
    if (I.AVCAT.indexOf('Paquetes estándar') < 0) I.AVCAT.unshift('Paquetes estándar');
    PAQ.forEach(function (p, k) {
      if (I.PPI.some(function (i) { return i.nombre === p[2]; })) return;
      var aid = I.AVI.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1;
      I.AVI.push({ id: aid, categoria: 'Paquetes estándar', nombre: p[2], descripcion: p[3], unidad: p[4], stock: null, opciones: [], activo: 1, orden: I.AVI.length + 1 });
      I.PPI.push({ id: I.PPI.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1, codigo: 'PP-P' + (k + 1), categoria: p[1], nombre: p[2], descripcion: p[3], unidad: p[4], precio: p[5], grupo: 'Bienes y servicios', activo: 1, orden: 9000 + k, origen: 'Paquetes estándar de Audiovisuales', visible_cliente: 1, area: 'Audiovisual', av_item_id: aid, opciones: [], formulario: p[6] });
    });
  }
  function briefValidar(tipo, d) {
    if (!BRIEF[tipo]) return null; d = d || {}; var o = { _tipo: tipo }, falta = [];
    BRIEF[tipo].forEach(function (c) { var x = t(d[c[0]], 2000); if (c[2] && !x) falta.push(c[1].toLowerCase()); o[c[0]] = x; });
    if (falta.length) E('Para crear el ' + tipo + ' faltan estos datos obligatorios: ' + falta.join(', ') + '.', 400, { falta_brief: true });
    return o;
  }
  function itemDe(id) { return I.PPI.find(function (i) { return i.id === +id; }); }

  // ---------------------------------------------------------------- Real Time (pantalla pública, sin datos delicados)
  function tiempoReal(q) {
    var hoy = dia(0), desde = /^\d{4}-\d{2}-\d{2}$/.test(q.desde || '') ? q.desde : (function () { var d = new Date(); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.toISOString().slice(0, 10); })(), hasta = addD(desde, 6);
    var sal = X.SALAS.map(function (s) { return { id: s.id, nombre: s.nombre }; }), sn = function (id) { return (X.SALAS.find(function (s) { return s.id === id; }) || {}).nombre || ''; };
    var diasDe = function (e) { return (e.dias && e.dias.length ? e.dias : [{ fecha: e.fecha, hora_ini: e.hora_ini, hora_fin: e.hora_fin }]).map(function (d) { return { fecha: d.fecha, hora_ini: d.hora_ini, hora_fin: d.hora_fin_ext || d.hora_fin }; }); };
    var hoyEv = X.EV.filter(function (e) { return e.estado !== 'cancelado' && diasDe(e).some(function (d) { return d.fecha === hoy; }); }).map(function (e) {
      var d = diasDe(e).find(function (x) { return x.fecha === hoy; }), V = (X.VER || []).filter(function (x) { return x.evento_id === e.id; });
      return { id: e.id, titulo: e.titulo, empresa: e.empresa, sala_id: e.sala_id, estado: e.estado, hora_ini: d.hora_ini, hora_fin: d.hora_fin, sala: sn(e.sala_id), personas: X.INS.filter(function (i) { return i.evento_id === e.id; }).length,
        ingresos: (X.ASI || []).filter(function (a) { return a.evento_id === e.id && a.fecha === hoy; }).length, verif_total: V.length, verif_hechos: V.filter(function (x) { return x.estado !== 'pendiente'; }).length,
        novedades: X.NOV.filter(function (n) { return n.evento_id === e.id && n.creado_en.slice(0, 10) === hoy; }).length };
    });
    var ids = hoyEv.map(function (e) { return e.id; }), PUB = ['evento', 'verificacion', 'asistencia', 'novedad', 'entrega', 'layout'];
    var bit = X.BIT.filter(function (b) { return ids.indexOf(b.evento_id) >= 0 && PUB.indexOf(b.entidad) >= 0 && String(b.momento).slice(0, 10) === hoy && b.id > (+q.tras || 0); }).slice(-80).reverse().map(function (b) {
      var e = hoyEv.find(function (x) { return x.id === b.evento_id; }), ac = b.entidad === 'novedad' ? 'Registró una novedad' : /^(Eliminó|Modificó datos)/.test(b.accion) ? 'Actualizó el evento' : b.accion;
      return { id: b.id, hora: String(b.momento).slice(11, 16), quien: /^Cliente/.test(b.usuario_nombre || '') || !b.usuario_nombre ? 'CLEMI' : b.usuario_nombre, tipo: b.entidad, accion: ac, evento: e.titulo, sala: e.sala };
    });
    if (q.a === 'bitacora') return { ok: true, hoy: hoy, eventos_hoy: hoyEv, bitacora: bit };
    var evs = X.EV.filter(function (e) { return e.estado !== 'cancelado' && e.fecha <= hasta && (e.fecha_fin || e.fecha) >= desde; }).map(function (e) { return { id: e.id, titulo: e.titulo, empresa: e.empresa, sala_id: e.sala_id, fecha: e.fecha, fecha_fin: e.fecha_fin || e.fecha, estado: e.estado, dias: diasDe(e) }; });
    var res = I.CT.filter(function (k) { return ['Solicitud', 'Cotización', 'Contratado'].indexOf(k.estado) >= 0 && k.fecha_inicio <= hasta && k.fecha_fin >= desde && !(k.evento_id && X.EV.some(function (e) { return e.id === k.evento_id && e.estado !== 'cancelado'; })); })
      .map(function (k) { return { curso: k.curso, sala_id: k.sala_id, salas: salasDe(k), fecha_inicio: k.fecha_inicio, fecha_fin: k.fecha_fin, hora_ini: k.hora_ini, hora_fin: k.hora_fin }; });
    var oc = {}, O = ocupacion(desde, hasta); Object.keys(O).forEach(function (k) { oc[k] = O[k].length; });
    return { ok: true, ensayo: null, hoy: hoy, desde: desde, hasta: hasta, salas: sal, eventos: evs, reservas: res, ocupacion: oc, cupo: CUPO, festivos: FEST, eventos_hoy: hoyEv, bitacora: bit };
  }

  // ---------------------------------------------------------------- enrutador
  function resp(st, out) { return new Promise(function (ok) { setTimeout(function () { ok(new Response(JSON.stringify(out), { status: st, headers: { 'Content-Type': 'application/json' } })); }, 50); }); }
  function qs(url) { var q = {}; (url.split('?')[1] || '').split('&').forEach(function (p) { var kv = p.split('='); if (kv[0]) q[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); }); return q; }
  function cuerpo(init) { try { return init && init.body && typeof init.body === 'string' ? JSON.parse(init.body) : {}; } catch (e) { return {}; } }
  function post(p, fn) { return p.then(function (r) { return r.clone().json().then(function (j) { try { if (j.ok) fn(j); } catch (e) { console.warn(e); } return new Response(JSON.stringify(j), { status: r.status, headers: { 'Content-Type': 'application/json' } }); }, function () { return r; }); }); }
  var previo = window.fetch, ENS = null;
  window.fetch = function (url, init) {
    if (typeof url !== 'string') return previo.apply(this, arguments);
    var q = qs(url), v = cuerpo(init), self = this, args = arguments;
    // Página del cliente: plazo, fase y listado de personas
    if (url.indexOf('cliente-api.php') === 0) {
      var cc = q.c ? I.CT.find(function (k) { return k.id === +q.c; }) : I.CT.find(function (k) { return k.acceso_token && k.acceso_token === q.t; });
      if (!cc && /^demo-/.test(q.t || '')) cc = I.CT[2];
      if (cc && q.a === 'listado_guardar') { try { cc.listado = limpiarListado(v.filas); cc.listado_nombre = t(v.archivo, 180); cc.listado_en = ahora(); cc.listado_por = 'Cliente'; return resp(200, { ok: true, n: cc.listado.length }); } catch (e) { return resp(e.st || 400, e.body || { ok: false, error: String(e) }); } }
      if (cc && q.a === 'ppto_enviar' && !(cc.listado || []).length && I.progDe(cc.id).length) return resp(409, { ok: false, falta_listado: true, error: 'Cargue el listado de personas (participantes, instructores y staff): sin listado no se genera el código QR y nadie puede ingresar.' });
      if (cc && q.a === 'ppto_linea') {
        try {
          var itC = +v.id ? null : itemDe(v.item_id), lC = +v.id ? I.PPL.find(function (l) { return l.id === +v.id; }) : null, foC = itC ? itC.formulario : (lC && lC.item_id ? (itemDe(lC.item_id) || {}).formulario : '');
          var brC = foC && (itC || v.datos) ? briefValidar(foC, v.datos) : null;
        } catch (e) { return resp(e.st || 400, e.body); }
        return post(previo.apply(self, args), function () { if (brC) { var ln = lC || I.PPL.filter(function (l) { return l.contrato_id === cc.id; }).slice(-1)[0]; if (ln) ln.datos = brC; } });
      }
      if (cc && q.a === 'datos') return post(previo.apply(self, args), function (j) {
        if (!j.ppto) return;
        j.ppto.brief = BRIEF;
        (j.ppto.catalogo || []).forEach(function (i) { var it = itemDe(i.id); if (it && it.formulario) i.formulario = it.formulario; });
        (j.ppto.lineas || []).forEach(function (l) { var o = I.PPL.find(function (z) { return z.id === l.id; }); if (o && o.datos) l.datos = o.datos; });
        j.ppto.listado_filas = clone(cc.listado || []); var z = cotiz(cc); j.ppto.cotiz = z; j.ppto.fase = cc.fase; j.ppto.listado = listRes(cc); j.ppto.listado_editable = cc.fase !== 'operacion' && cc.fecha_inicio > dia(0);
        if (j.ppto.editable && z.limite && z.vencido && cc.ppto_estado !== 'ajustes') { j.ppto.editable = false; j.ppto.catalogo = []; }
        if (j.acceso) j.acceso.hasta = cc.fecha_fin;
      });
      return previo.apply(this, arguments);
    }
    if (url.indexOf('tiempo-real-api.php') === 0) return resp(200, tiempoReal(q));
    if (url.indexOf('api.php') !== 0) return previo.apply(this, arguments);
    var YO = X.yo(), a = q.a; if (!YO) return previo.apply(this, arguments);
    if (a === 'ensayo_iniciar') { if (YO.rol !== 'admin') return resp(403, { ok: false, error: 'Solo la administradora.' }); ENS = { activo: true, desde: ahora(), por: YO.nombre, nombre: t(v.nombre, 120) || 'Ensayo del proceso', marcas: { contratos: I.CT.reduce(function (m, k) { return Math.max(m, k.id); }, 0), eventos: X.EV.reduce(function (m, k) { return Math.max(m, k.id); }, 0) } }; return resp(200, { ok: true, ensayo: ENS }); }
    if (a === 'ensayo_resumen') { if (!ENS) return resp(400, { ok: false, error: 'No hay un ensayo en curso.' }); return resp(200, { ok: true, ensayo: ENS, resumen: { contratos: I.CT.filter(function (k) { return k.id > ENS.marcas.contratos; }).map(function (k) { return { id: k.id, codigo: k.codigo, cliente: k.cliente, curso: k.curso, estado: k.estado }; }), eventos: X.EV.filter(function (k) { return k.id > ENS.marcas.eventos; }).map(function (k) { return { id: k.id, titulo: k.titulo, fecha: k.fecha }; }), inscritos: 0, clientes: [] } }); }
    if (a === 'ensayo_terminar') { if (!ENS) return resp(400, { ok: false, error: 'No hay un ensayo en curso.' }); var nb = { contratos: 0, eventos: 0, inscritos: 0 };
      if (+v.borrar) { if (String(v.confirmar || '').trim().toUpperCase() !== 'BORRAR ENSAYO') return resp(400, { ok: false, error: 'Escriba BORRAR ENSAYO para confirmar.' }); var m = ENS.marcas;
        for (var i = I.CT.length - 1; i >= 0; i--) if (I.CT[i].id > m.contratos) { I.CT.splice(i, 1); nb.contratos++; }
        for (var k3 = X.EV.length - 1; k3 >= 0; k3--) if (X.EV[k3].id > m.eventos) { X.EV.splice(k3, 1); nb.eventos++; } }
      ENS = null; return resp(200, { ok: true, borrado: +v.borrar ? nb : null }); }
    if (a === 'tick' || a === 'yo') return post(previo.apply(self, args), function (j) { j.ensayo = ENS; });
    try { var r0 = opManejar(a, q, v, YO); if (r0) return resp(200, Object.assign(r0, { ok: true })); } catch (e) { if (e && e.body) return resp(e.st, e.body); return resp(500, { ok: false, error: 'Error en la vista previa: ' + (e && e.message) }); }
    if (a === 'prep_estado') { var pl = I.PPL.find(function (l) { return l.id === +v.id; }), pc = pl && I.CT.find(function (k2) { return k2.id === pl.contrato_id; });
      if (pc && pc.op_estado === 'por_aceptar') return resp(409, { ok: false, error: 'Primero Operaciones debe aceptar el convenio.' });
      return post(previo.apply(self, args), function (j) { if (pc) { opRecalc(pc); j.progreso = opProg(pc.id); } }); }
    if (a === 'prep_lista') return post(previo.apply(self, args), function (j) {
      var A = j.areas || []; j.puede_aceptar = puedeAceptar(YO);
      (j.contratos || []).forEach(function (o) { var c = I.CT.find(function (k2) { return k2.id === o.id; }); if (!c) return; if (!c.op_estado) { c.op_estado = 'en_preparacion'; opChecks(c); }
        o.op_estado = c.op_estado; o.op_aceptado_por = c.op_aceptado_por; o.op_aceptado_en = c.op_aceptado_en; o.progreso = opProg(c.id); o.checks = clone(OPC.filter(function (k2) { return k2.contrato_id === c.id && A.indexOf(k2.area) >= 0; })); });
    });
    try { var r = manejar(a, q, v, YO); if (r) return resp(200, Object.assign(r, { ok: true })); } catch (e) { if (e && e.body) return resp(e.st, e.body); return resp(500, { ok: false, error: 'Error en la vista previa: ' + (e && e.message) }); }
    try {
      if (a === 'contrato_guardar') {
        var nuevo = !+v.id, c0 = nuevo ? null : I.CT.find(function (k) { return k.id === +v.id; });
        if (nuevo || (c0 && (c0.fecha_inicio !== v.fecha_inicio || c0.fecha_fin !== v.fecha_fin))) cupo(v.fecha_inicio, v.fecha_fin, nuevo ? 0 : +v.id, 0);
        if (c0) ['valor', 'forma_pago', 'estado_pago', 'fecha_contratacion', 'responsable_id'].forEach(function (k) { if (!(k in v)) v[k] = c0[k]; });
        if (nuevo) { v.estado = 'Solicitud'; v.fecha_contratacion = dia(0); v.responsable_id = YO.id; }
        // Cantidad de salas: elegidas o asignadas entre las libres
        var nS = +v.salas_n || (c0 ? salasDe(c0).length : 1), selS = (v.salas || []).map(Number);
        if (nS < 1 || nS > X.SALAS.length) E('Indique la cantidad de salas (de 1 a ' + X.SALAS.length + ').');
        if (selS.length && selS.length !== nS) E('Indicó ' + nS + ' sala(s) pero eligió ' + selS.length + '. Elija exactamente ' + nS + ' o no elija ninguna para que la plataforma asigne las libres.');
        if (!selS.length) X.SALAS.forEach(function (s) { if (selS.length >= nS) return; var ocup = I.CT.some(function (k) { return k.id !== +v.id && ['Solicitud', 'Cotización', 'Contratado'].indexOf(k.estado) >= 0 && k.fecha_inicio <= v.fecha_fin && k.fecha_fin >= v.fecha_inicio && salasDe(k).indexOf(s.id) >= 0; }); if (!ocup) selS.push(s.id); });
        if (selS.length < nS) E('En esas fechas solo hay ' + selS.length + ' sala(s) libre(s).', 409);
        v.sala_id = selS[0]; v.forzar = 1;
        var extra = function (c) { c.salas_ids = selS; c.instructores_n = +v.instructores_n || 0; c.staff_n = +v.staff_n || 0; };
        var ini = Object.assign({}, init || {}, { body: JSON.stringify(v) });
        if (!nuevo) return post(previo.call(self, url, ini), function () { extra(c0); });
        return post(previo.call(self, url, ini), function (j) {
          var c = I.CT.find(function (k) { return k.id === +j.id; }); if (!c) return;
          extra(c);
          c.nombre_convenio = t(v.nombre_convenio, 200) || ('Convenio ' + c.cliente + ' · ' + c.curso);
          c.fase = 'cotizacion'; c.fase_desde = ahora(); c.cotiz_limite = sumarHab(dia(0), 3); c.listado = [];
          c.acceso_token = 'demo-' + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12); c.acceso_pin = String(100000 + Math.floor(Math.random() * 900000)); c.acceso_creado_en = ahora(); c.acceso_anulado_en = null;
          X.reg(YO.id, 'contrato', c.id, null, 'Registró la solicitud ' + c.codigo + ' y cerró la fase de Negociación', 'Fecha reservada en la agenda. Enlace del cliente vigente hasta el ' + c.fecha_fin + '. Pasa a Cotización: el cliente tiene hasta el ' + c.cotiz_limite + ' (3 días hábiles).');
          j.nuevo = true; j.token = c.acceso_token; j.pin = c.acceso_pin; j.cotiz_limite = c.cotiz_limite; j.acceso = { desde: dia(0), hasta: c.fecha_fin, cambios_hasta: addD(c.fecha_inicio, -3), vigente: true };
        });
      }
      if (a === 'evento_guardar' && !+v.id) cupo(v.fecha, v.fecha_fin || v.fecha, 0, 0);
      if (a === 'contrato_programar') { var cp = I.CT.find(function (k) { return k.id === +v.contrato_id; }); if (cp) cupo(cp.fecha_inicio, cp.fecha_fin, cp.id, 0); return post(previo.apply(self, args), function (j) { if (cp && j.evento_id) j.listado = importarListado(cp, j.evento_id); }); }
    } catch (e) { if (e && e.body) return resp(e.st, e.body); }
    if (a === 'pp_catalogo') return post(previo.apply(self, args), function (j) { j.brief = BRIEF; });
    if (a === 'ppto_linea_guardar') {
      try { var itI = +v.id ? null : itemDe(v.item_id), brI = itI && itI.formulario ? briefValidar(itI.formulario, v.datos) : null; } catch (e) { return resp(e.st || 400, e.body); }
      return post(previo.apply(self, args), function (j) { if (brI) { var ln2 = I.PPL.find(function (l) { return l.id === +j.id; }) || I.PPL.slice(-1)[0]; if (ln2) ln2.datos = brI; } });
    }
    if (a === 'ppto') return post(previo.apply(self, args), function (j) { enriquecer(j.contrato); ((j.ppto || {}).lineas || []).forEach(function (l) { var o = I.PPL.find(function (z) { return z.id === l.id; }); if (o && o.datos) l.datos = o.datos; }); });
    if (a === 'contrato' || a === 'plan') return post(previo.apply(self, args), function (j) { enriquecer(j.contrato); });
    if (a === 'contratos') return post(previo.apply(self, args), function (j) { (j.contratos || []).forEach(enriquecer); });
    if (a === 'planes') return post(previo.apply(self, args), function (j) { (j.planes || []).forEach(enriquecer); });
    if (a === 'adm_seguimiento') return post(previo.apply(self, args), function (j) {
      j.nombres = FN;
      (j.convenios || []).forEach(function (o) { var c = I.CT.find(function (k) { return k.id === o.id; }); if (!c) return; var s = seg(c); o.fase = c.fase; o.fase_desde = c.fase_desde; o.fases = s; o.pendiente = pendiente(c); o.alerta = alerta(c, s); o.listado = (c.listado || []).length; o.cotiz = cotiz(c); });
    });
    if (a === 'inscritos') return post(previo.apply(self, args), function (j) { var c = I.CT.find(function (k) { return k.evento_id === +q.evento_id; }); j.listado_cliente = c ? { contrato_id: c.id, codigo: c.codigo, n: (c.listado || []).length } : null; });
    if (a === 'firma_clemi') { var f0 = F.FIR.find(function (k) { return k.id === +v.id; }), c1 = f0 && I.CT.find(function (k) { return k.id === f0.contrato_id; }), est0 = c1 && c1.estado;
      return post(previo.apply(self, args), function () { if (c1 && c1.fase === 'administrativo') { f0.estado = 'Firmas completas'; f0.archivo = null; c1.estado = est0; c1.firma_estado = 'por_cerrar'; } }); }
    if (a === 'ppto_emitir' || a === 'ppto_respuesta') return previo.apply(self, args);
    return previo.apply(this, arguments);
  };
})();
