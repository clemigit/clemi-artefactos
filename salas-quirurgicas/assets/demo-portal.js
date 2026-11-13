/* =====================================================================
   CLEMI · VISTA PREVIA — Portal de clientes, firma electrónica del
   contrato, archivo de contratos y preparación por áreas.
   Simula en memoria portal-api.php y las acciones nuevas de api.php y
   cliente-api.php. Nada se guarda.
   ===================================================================== */
(function () {
  'use strict';
  var D = window.CLEMI_DEMO, X = D && D.ctx, I = D && D.CTI;
  if (!I) return;
  var clone = X.clone, ahora = X.ahora, dia = X.dia, hace = I.hace, E = I.E, t = I.t;
  var CTR = window.DEMO_CTR || {};
  function ss(k, v) { try { if (v === undefined) return JSON.parse(sessionStorage.getItem(k) || 'null'); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function pesos(v) { return '$' + Math.round(+v || 0).toLocaleString('es-CO'); }

  // ---------------------------------------------------------------- usuarios y áreas
  if (!X.U.some(function (u) { return u.usuario === 'claudia.reyes'; })) X.U.push({ id: 28, usuario: 'claudia.reyes', nombre: 'Claudia Reyes', cedula: '', rol: 'firma', activo: 1, debe_cambiar: 0 });
  var w = X.U.find(function (u) { return u.usuario === 'wendy.cardenas'; }); if (w) w.activo = 0;
  I.AREAS.firma = ['fi']; if (I.AREAS.admin.indexOf('fi') < 0) I.AREAS.admin.push('fi');
  ['almacen', 'audiovisual'].forEach(function (r) { ['planes', 'plan'].forEach(function (a) { if (I.PERM[r].indexOf(a) < 0) I.PERM[r].push(a); }); });
  I.CLEMI_D.rep_doc = I.CLEMI_D.rep_doc || '00.000.000 (ejemplo)';

  // ---------------------------------------------------------------- áreas del catálogo («carrito» del cliente)
  var AREAS_PP = ['Audiovisual', 'Morgue', 'Instrumentación', 'Biomédica', 'Logística y servicios'];
  function areaCat(cat, nombre) {
    var n = String(nombre || '').toLowerCase();
    if (cat === 'Personal') return n.indexOf('tanat') >= 0 ? 'Morgue' : n.indexOf('instrument') >= 0 ? 'Instrumentación' : n.indexOf('audiovis') >= 0 ? 'Audiovisual' : 'Biomédica';
    return { 'Audiovisuales': 'Audiovisual', 'Fotografía y diseño': 'Audiovisual', 'Componentes anatómicos': 'Morgue', 'Instrumental': 'Instrumentación', 'Equipos': 'Biomédica', 'Insumos': 'Biomédica' }[cat] || 'Logística y servicios';
  }
  function areaPrep(a, cat) { if (a === 'Biomédica') return cat === 'Equipos' ? 'bm' : 'ps'; return { 'Audiovisual': 'av', 'Morgue': 'mo', 'Instrumentación': 'op', 'Logística y servicios': 'lg' }[a] || 'ps'; }
  I.PPI.forEach(function (i) { if (!i.area) i.area = areaCat(i.categoria, i.nombre); if (!i.opciones) i.opciones = []; });
  function areaL(l) { if (l.area) return l.area; var i = l.item_id ? I.PPI.find(function (k) { return k.id === l.item_id; }) : null; return i ? i.area : areaCat(l.categoria, l.descripcion); }

  // ---------------------------------------------------------------- empresas y usuarios del portal
  var CLI = [
    { id: 1, razon: 'Casa comercial de ejemplo S.A.S.', nit: '900.123.456-7', sigla: '', tipo_entidad: 'entidad de derecho privado', domicilio: 'Bogotá D.C.', direccion: 'Carrera de ejemplo # 4-56, Bogotá', rep_legal: 'Paula Ríos (ejemplo)', rep_tipo_doc: 'cédula de ciudadanía', rep_doc: '2.000.000.000', correo_factura: 'facturas@ejemplo.com', telefono: '6010000000', notas: '', activo: 1 },
    { id: 2, razon: 'Distribuidora médica de ejemplo', nit: '900.555.444-1', sigla: '', tipo_entidad: 'entidad de derecho privado', domicilio: 'Bogotá D.C.', direccion: 'Calle de ejemplo # 1-23, Bogotá', rep_legal: 'Andrea Gómez (ejemplo)', rep_tipo_doc: 'cédula de ciudadanía', rep_doc: '1.000.000.000', correo_factura: 'facturacion@ejemplo.com', telefono: '6011111111', notas: '', activo: 1 }
  ];
  var CU = [
    { id: 1, cliente_id: 1, usuario: 'paula.rios', nombre: 'Paula Ríos (ejemplo)', cargo: 'Gerente de educación médica', correo: 'educacion@ejemplo.com', telefono: '3001234567', debe_cambiar: 0, activo: 1, ultimo_ingreso: hace(3000), creado_en: hace(9000) },
    { id: 2, cliente_id: 2, usuario: 'andrea.gomez', nombre: 'Andrea Gómez (ejemplo)', cargo: 'Coordinadora de eventos académicos', correo: 'andrea@ejemplo.com', telefono: '3100000000', debe_cambiar: 0, activo: 1, ultimo_ingreso: hace(200), creado_en: hace(8000) }
  ];
  var c1 = I.CT[0], c3 = I.CT[2];
  c1.cliente_id = 1; c3.cliente_id = 2;

  // ---------------------------------------------------------------- semillas: contratos firmados y por firmar
  function lin(c, nombre, q, d, p, nota, prep) { I.ppLinea(c.id, nombre, q, d, p, 'cliente', nota || '', c.contacto_nombre); var l = I.PPL[I.PPL.length - 1]; if (prep) { l.prep_estado = prep[0]; l.prep_por = prep[1]; l.prep_en = hace(prep[2] || 300); } return l; }
  Object.assign(c1, { ppto_estado: 'aceptado', ppto_admin_pct: 25, firma_estado: 'firmado' });
  lin(c1, 'Sala de entrenamiento', 1, 2, 2400000); lin(c1, 'Estación de trabajo', 6, 2, 850000); lin(c1, 'Torre de video', 6, 2, 600000, '', ['Listo', 'Osvaldo Naar', 400]);
  lin(c1, 'Instrumental básico de disección', 6, 2, 300000, '', ['En preparación', 'Sergio Saavedra', 200]); lin(c1, 'Segmento anatómico', 6, 1, 1500000, 'Hombro', ['Listo', 'Holman Anaya', 150]);
  lin(c1, 'Televisor de 85"', 2, 2, 250000); lin(c1, 'Almuerzo', 30, 2, 38000, '', ['Pendiente']);
  I.ppEmitir(c1, 'Osvaldo Naar', hace(6000)); var v1 = I.PPV[I.PPV.length - 1]; Object.assign(v1, { respuesta: 'aceptado', respuesta_por: 'Paula Ríos (Casa comercial de ejemplo S.A.S.)', respuesta_en: hace(5800) }); c1.ppto_estado = 'aceptado';
  c3.firma_estado = 'por_firmar_clemi';
  var c7 = I.nuevoCT({ estado: 'Cotización', cliente: 'Distribuidora médica de ejemplo', nit: '900.555.444-1', contacto_nombre: 'Andrea Gómez (ejemplo)', contacto_correo: 'andrea@ejemplo.com', curso: 'Curso de artroscopia de rodilla (ejemplo)',
    especialidad: 'Ortopedia', sala_id: 4, fecha_inicio: dia(40), fecha_fin: dia(41), participantes: 12, estaciones: 3, componentes: 3, tipo_componente: 'Segmento rodilla', fecha_contratacion: dia(-6), ppto_admin_pct: 25,
    doc_datos: { rep_legal: 'Andrea Gómez (ejemplo)', rep_doc: '1.000.000.000', direccion: 'Calle de ejemplo # 1-23, Bogotá', correo_factura: 'facturacion@ejemplo.com' }, cliente_id: 2, origen: 'portal', firma_estado: 'por_firmar_cliente', plan_estado: 'enviado' });
  lin(c7, 'Sala de entrenamiento', 1, 2, 2400000); lin(c7, 'Estación de trabajo', 3, 2, 850000); lin(c7, 'Torre de video', 3, 2, 600000); lin(c7, 'Instrumental básico de disección', 3, 2, 300000);
  lin(c7, 'Segmento anatómico', 3, 1, 1500000, 'Rodilla'); lin(c7, 'Técnico de audiovisuales', 1, 2, 350000); lin(c7, 'Almuerzo', 18, 2, 38000);
  I.plan(c7.id, [I.L(1, 200, 260, 0, 'Estación 1'), I.L(1, 420, 260, 0, 'Estación 2'), I.L(1, 640, 260, 0, 'Estación 3'), I.L(5, 200, 380), I.L(5, 420, 380), I.L(5, 640, 380)], 'cliente', 'Andrea Gómez (Distribuidora médica de ejemplo)', null, 'Enviada con la solicitud de presupuesto', hace(1500));
  I.ppEmitir(c7, 'Osvaldo Naar', hace(900)); var v7 = I.PPV[I.PPV.length - 1]; Object.assign(v7, { respuesta: 'aceptado', respuesta_por: 'Andrea Gómez (Distribuidora médica de ejemplo)', respuesta_en: hace(700) }); c7.ppto_estado = 'aceptado';

  function firmaDe(nombre, cargo, doc, usuario, min) { return { nombre: nombre, tipo_doc: 'cédula de ciudadanía', documento: doc, cargo: cargo, usuario: usuario, fecha: hace(min), ip: '190.0.0.' + (10 + min % 50) }; }
  var FIR = [
    { id: 1, contrato_id: c1.id, clave: 'c1', version: 1, estado: 'Firmado', hash: CTR.c1_hash || '', total: CTR.c1_total || c1.valor, enviado_por: 'Natalia Cogua', enviado_en: hace(5000),
      cliente_firma: firmaDe('Paula Ríos (ejemplo)', 'Gerente de educación médica', '2.000.000.000', 'paula.rios', 4700), cliente_firmado_en: hace(4700), clemi_firma: firmaDe('Claudia Reyes', 'Representante legal', I.CLEMI_D.rep_doc, 'claudia.reyes', 4300), clemi_firmado_en: hace(4300), archivo: 1 },
    { id: 2, contrato_id: c3.id, clave: 'c3', version: 1, estado: 'Por firmar CLEMI', hash: CTR.c3_hash || '', total: CTR.c3_total || c3.valor, enviado_por: 'Natalia Cogua', enviado_en: hace(180),
      cliente_firma: firmaDe('Andrea Gómez (ejemplo)', 'Representante legal', '1.000.000.000', 'andrea.gomez', 90), cliente_firmado_en: hace(90), clemi_firma: null, clemi_firmado_en: null },
    { id: 3, contrato_id: c7.id, clave: 'c7', version: 1, estado: 'Por firmar el cliente', hash: CTR.c7_hash || '', total: CTR.c7_total || c7.valor, enviado_por: 'Natalia Cogua', enviado_en: hace(60), cliente_firma: null, clemi_firma: null }
  ];
  c1.valor = FIR[0].total; c3.valor = FIR[1].total; c7.valor = FIR[2].total;

  // Firma dibujada de ejemplo (cuando la firma no se dibujó en esta página)
  var FIRMA_EJ = (function () {
    try { var cv = document.createElement('canvas'); cv.width = 320; cv.height = 90; var x = cv.getContext('2d'); x.strokeStyle = '#13213C'; x.lineWidth = 2.6; x.lineCap = 'round'; x.beginPath();
      for (var i = 0; i <= 280; i += 4) { var y = 48 + Math.sin(i / 14) * 22 * Math.cos(i / 60); if (i === 0) x.moveTo(20, y); else x.lineTo(20 + i, y); } x.stroke(); return cv.toDataURL('image/png'); } catch (e) { return ''; }
  })();
  function vigente(cid) { var L = FIR.filter(function (f) { return f.contrato_id === cid && f.estado !== 'Anulado'; }); return L.length ? L[L.length - 1] : null; }
  function fhtml(f) {
    var k = f.clave || 'c3', est = f.clemi_firma ? 'ambas' : f.cliente_firma ? 'cliente' : 'sin';
    var h = CTR[k + '_' + est] || '<p>Contrato de ejemplo no disponible.</p>';
    h = h.split('__FIRMA_CLIENTE__').join((f.cliente_firma && f.cliente_firma.img) || FIRMA_EJ).split('__FIRMA_CLEMI__').join((f.clemi_firma && f.clemi_firma.img) || FIRMA_EJ);
    if (!f.clave) h = '<div class="cl-aviso" style="margin-bottom:12px">Vista previa: se muestra el contrato de ejemplo. En la plataforma real aquí aparece el contrato de este curso.</div>' + h;
    return h;
  }
  function fpub(f) { if (!f) return null; var o = clone(f); ['cliente_firma', 'clemi_firma'].forEach(function (k) { if (o[k]) delete o[k].img; }); return o; }
  function regC(uid, cid, acc, det, ent) { X.reg(uid, ent || 'contrato', cid, null, acc, det || ''); }
  var MC = [];
  var ESTPREP = ['Pendiente', 'En preparación', 'Listo', 'No disponible'];
  function linPrep(l) { return Object.assign({ prep_estado: 'Pendiente', prep_por: null, prep_en: null, prep_nota: '' }, l); }

  // ---------------------------------------------------------------- api.php: acciones nuevas
  var NUEVAS = ['clientes', 'cliente_guardar', 'cliente_usuario_guardar', 'cliente_usuario_clave', 'contrato_cliente', 'firma_info', 'firma_enviar', 'firma_anular', 'firmas', 'firma_ver', 'firma_clemi', 'archivo_lista', 'prep_lista', 'prep_estado'];
  function claveIni() { var l = 'abcdefghjkmnpqrstuvwxyz', s = ''; for (var i = 0; i < 4; i++) s += l[Math.floor(Math.random() * l.length)]; return 'Clemi-' + s.charAt(0).toUpperCase() + s.slice(1) + '-' + (1000 + Math.floor(Math.random() * 9000)); }
  function urlPortal() { return location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, '') + 'portal.html'; }
  function areasPrepDe(YO) { var T = ['op', 'mo', 'av', 'lg', 'bm', 'ps']; if (['admin', 'comercial', 'administrativo'].indexOf(YO.rol) >= 0) return T; var u = X.U.find(function (k) { return k.id === YO.id; }) || YO; var a = (I.AREAS[u.rol] || ['op']).slice(); String(u.areas_extra || '').split(',').forEach(function (x) { if (x) a.push(x); }); return T.filter(function (x) { return a.indexOf(x) >= 0; }); }
  function manejar(a, q, v, YO) {
    var uid = YO.id, CTok = YO.rol === 'admin' || YO.rol === 'comercial', c, x, f;
    var soloCT = function () { if (!CTok) E('Solo Operaciones · Contratación puede hacer esto.', 403); };
    switch (a) {
      case 'clientes':
        soloCT();
        return { clientes: CLI.map(function (k) { var o = clone(k); o.usuarios = clone(CU.filter(function (u) { return u.cliente_id === k.id; })); o.solicitudes = I.CT.filter(function (c2) { return c2.cliente_id === k.id; }).map(function (c2) { return { id: c2.id, codigo: c2.codigo, curso: c2.curso, estado: c2.estado, ppto_estado: c2.ppto_estado, firma_estado: c2.firma_estado || '', fecha_inicio: c2.fecha_inicio }; }); return o; }),
          sin_cliente: I.CT.filter(function (c2) { return !c2.cliente_id && ['Cancelado', 'Finalizado'].indexOf(c2.estado) < 0; }).map(function (c2) { return { id: c2.id, codigo: c2.codigo, cliente: c2.cliente, nit: c2.nit, curso: c2.curso, estado: c2.estado, fecha_inicio: c2.fecha_inicio }; }), url_portal: urlPortal() };
      case 'cliente_guardar':
        soloCT(); if (!t(v.razon)) E('Escriba la razón social de la empresa.');
        var d = {}; ['razon', 'nit', 'sigla', 'tipo_entidad', 'domicilio', 'direccion', 'rep_legal', 'rep_tipo_doc', 'rep_doc', 'correo_factura', 'telefono', 'notas'].forEach(function (k) { d[k] = t(v[k], 300); }); d.activo = v.activo ? 1 : 0;
        if (+v.id) { Object.assign(CLI.find(function (k) { return k.id === +v.id; }), d); regC(uid, +v.id, 'Actualizó la empresa cliente ' + d.razon, 'NIT ' + d.nit, 'cliente'); return { id: +v.id }; }
        d.id = CLI.length + 1; CLI.push(d); regC(uid, d.id, 'Creó la empresa cliente ' + d.razon, 'NIT ' + d.nit, 'cliente'); return { id: d.id };
      case 'cliente_usuario_guardar':
        soloCT(); var us = String(v.usuario || '').toLowerCase().replace(/[^a-z0-9._@-]/g, '');
        if (!t(v.nombre) || us.length < 4) E('Escriba el nombre y un usuario de al menos 4 caracteres.');
        if (CU.some(function (u) { return u.usuario === us && u.id !== +v.id; }) || X.U.some(function (u) { return u.usuario === us; })) E('Ese usuario ya existe. Elija otro.');
        var du = { usuario: us, nombre: t(v.nombre, 120), cargo: t(v.cargo, 120), correo: t(v.correo, 160), telefono: t(v.telefono, 40), activo: v.activo ? 1 : 0 };
        if (+v.id) { Object.assign(CU.find(function (u) { return u.id === +v.id; }), du); return {}; }
        if (!CLI.some(function (k) { return k.id === +v.cliente_id; })) E('Elija la empresa.');
        du.id = CU.length + 1; du.cliente_id = +v.cliente_id; du.debe_cambiar = 1; du.creado_en = ahora(); du.ultimo_ingreso = null; CU.push(du);
        regC(uid, du.cliente_id, 'Creó el usuario del portal ' + us, du.nombre + ' · contraseña inicial entregada personalmente', 'cliente');
        return { usuario: us, clave: claveIni(), url: urlPortal() };
      case 'cliente_usuario_clave':
        soloCT(); x = CU.find(function (u) { return u.id === +v.id; }); if (!x) E('El usuario no existe.'); x.debe_cambiar = 1;
        return { usuario: x.usuario, clave: claveIni(), url: urlPortal() };
      case 'contrato_cliente':
        soloCT(); c = I.ct(v.contrato_id); c.cliente_id = +v.cliente_id || null; regC(uid, c.id, c.cliente_id ? 'Vinculó el contrato ' + c.codigo + ' a una empresa del portal' : 'Desvinculó el contrato ' + c.codigo + ' del portal'); return {};
      case 'firma_info':
        soloCT(); c = I.ct(q.id); f = vigente(c.id);
        var P = I.ppCompleto(c), dd = I.docDatos(c);
        return { firma: f ? Object.assign(fpub(f), { html: fhtml(f) }) : null, historial: FIR.filter(function (k) { return k.contrato_id === c.id; }).slice().reverse().map(fpub), faltantes: I.docFaltan(c, dd, P.totales), ppto_estado: c.ppto_estado,
          cliente_id: c.cliente_id || null, usuarios_portal: CU.filter(function (u) { return u.cliente_id === c.cliente_id; }).map(function (u) { return { nombre: u.nombre, usuario: u.usuario, correo: u.correo, activo: u.activo }; }),
          clientes: CLI.filter(function (k) { return k.activo; }).map(function (k) { return { id: k.id, razon: k.razon, nit: k.nit }; }) };
      case 'firma_enviar':
        soloCT(); c = I.ct(v.contrato_id);
        if (c.ppto_estado !== 'aceptado') E('Primero el cliente debe aceptar el presupuesto.', 409);
        if (!c.cliente_id) E('Vincule el contrato a la empresa del portal de clientes: el cliente firma con su usuario y contraseña.', 409);
        var P2 = I.ppCompleto(c), fal = I.docFaltan(c, I.docDatos(c), P2.totales); if (fal.length) E('Complete antes de enviar: ' + fal.join(', ') + '.', 409);
        var ant = vigente(c.id); if (ant && ant.estado === 'Firmado') E('El contrato ya está firmado por las dos partes.', 409);
        if (ant) { ant.estado = 'Anulado'; ant.anulado_motivo = 'Reemplazado por una nueva versión enviada por ' + YO.nombre; ant.anulado_en = ahora(); }
        var ver = FIR.filter(function (k) { return k.contrato_id === c.id; }).length + 1, cl = { 1: 'c1', 3: 'c3', 7: 'c7' }[c.id] || null;
        FIR.push({ id: FIR.length + 1, contrato_id: c.id, clave: cl, version: ver, estado: 'Por firmar el cliente', hash: (CTR[(cl || 'c3') + '_hash'] || '').split('').reverse().join(''), total: P2.totales.total, enviado_por: YO.nombre, enviado_en: ahora(), cliente_firma: null, clemi_firma: null });
        c.firma_estado = 'por_firmar_cliente'; regC(uid, c.id, 'Envió el contrato ' + c.codigo + ' a firma del cliente (versión ' + ver + ')', 'Total ' + pesos(P2.totales.total));
        return { version: ver, correos: CU.filter(function (u) { return u.cliente_id === c.cliente_id && u.activo && u.correo; }).length };
      case 'firma_anular':
        soloCT(); f = FIR.find(function (k) { return k.id === +v.id; }); if (!f) E('No existe.'); if (['Firmado', 'Anulado'].indexOf(f.estado) >= 0) E('Este contrato ya está ' + f.estado.toLowerCase() + '.', 409);
        if (!t(v.motivo)) E('Escriba el motivo.'); f.estado = 'Anulado'; f.anulado_motivo = t(v.motivo, 500); f.anulado_en = ahora(); I.ct(f.contrato_id).firma_estado = ''; return {};
      case 'firmas':
        if (['admin', 'firma'].indexOf(YO.rol) < 0) E('Sin permiso.', 403);
        var fila = function (k) { var c2 = I.ct(k.contrato_id); return { id: k.id, version: k.version, estado: k.estado, hash: k.hash, total: k.total, enviado_por: k.enviado_por, enviado_en: k.enviado_en, cliente_firmado_en: k.cliente_firmado_en, clemi_firmado_en: k.clemi_firmado_en,
          contrato_id: c2.id, codigo: c2.codigo, cliente: c2.cliente, curso: c2.curso, fecha_inicio: c2.fecha_inicio, fecha_fin: c2.fecha_fin, firmante: k.cliente_firma ? k.cliente_firma.nombre + ' · ' + k.cliente_firma.cargo : '' }; };
        var de = function (e) { return FIR.filter(function (k) { return k.estado === e; }).map(fila); };
        return { pendientes: de('Por firmar CLEMI'), firmados: de('Firmado').reverse(), esperando_cliente: de('Por firmar el cliente').reverse(), puede_firmar: YO.rol === 'firma', clemi: clone(I.CLEMI_D) };
      case 'firma_ver':
        if (['admin', 'firma', 'comercial'].indexOf(YO.rol) < 0) E('Sin permiso.', 403);
        f = FIR.find(function (k) { return k.id === +q.id; }); if (!f) E('No existe.', 404); c = I.ct(f.contrato_id);
        return { firma: fpub(f), html: fhtml(f), contrato: { id: c.id, codigo: c.codigo, cliente: c.cliente, curso: c.curso }, hash_ok: true, puede_firmar: YO.rol === 'firma' && f.estado === 'Por firmar CLEMI' };
      case 'firma_clemi':
        if (YO.rol !== 'firma') E('Solo la representante legal de CLEMI firma los contratos.', 403);
        f = FIR.find(function (k) { return k.id === +v.id; }); if (!f || f.estado !== 'Por firmar CLEMI') E('Este contrato no está esperando la firma de CLEMI.', 409);
        if (!v.leido) E('Confirme que leyó el contrato.'); if (v.clave !== 'demo') E('La contraseña no coincide. En la vista previa es «demo».', 401); if (!v.firma) E('Dibuje su firma.');
        f.clemi_firma = Object.assign(firmaDe(YO.nombre, 'Representante legal', I.CLEMI_D.rep_doc, YO.usuario, 0), { img: v.firma }); f.clemi_firmado_en = ahora(); f.estado = 'Firmado'; f.archivo = 1;
        c = I.ct(f.contrato_id); var antes = c.estado; c.estado = 'Contratado'; c.firma_estado = 'firmado'; c.valor = f.total;
        regC(uid, c.id, 'Firmó electrónicamente el contrato ' + c.codigo + ' por CLEMI (versión ' + f.version + ')', 'Contrato firmado por las dos partes y archivado.');
        if (antes !== 'Contratado') regC(uid, c.id, 'Cambió el estado del contrato ' + c.codigo, antes + ' → Contratado');
        regC(uid, c.id, 'Contrato firmado: inicia la preparación de ' + c.codigo, c.cliente + ' · ' + c.curso, 'plan');
        return {};
      case 'archivo_lista':
        soloCT();
        return { contratos: FIR.filter(function (k) { return k.estado === 'Firmado'; }).slice().reverse().map(function (k) { var c2 = I.ct(k.contrato_id), p = function (x) { return x ? { nombre: x.nombre, cargo: x.cargo, usuario: x.usuario, ip: x.ip } : null; };
          return { id: k.id, version: k.version, hash: k.hash, archivo_hash: k.hash.split('').reverse().join(''), total: k.total, cliente_firma: p(k.cliente_firma), clemi_firma: p(k.clemi_firma), cliente_firmado_en: k.cliente_firmado_en, clemi_firmado_en: k.clemi_firmado_en, enviado_por: k.enviado_por,
            contrato_id: c2.id, codigo: c2.codigo, cliente: c2.cliente, nit: c2.nit, curso: c2.curso, fecha_inicio: c2.fecha_inicio, fecha_fin: c2.fecha_fin, estado: c2.estado }; }), anulados: FIR.filter(function (k) { return k.estado === 'Anulado'; }).length };
      case 'prep_lista':
        var A = areasPrepDe(YO); if (!A.length) E('Sin permiso.', 403);
        return { areas: A, estados: ESTPREP, contratos: I.CT.filter(function (c2) { return c2.estado === 'Contratado' && (c2.firma_estado === 'firmado' || c2.ppto_estado === 'aceptado') && c2.fecha_fin >= dia(-1); }).sort(function (p1, p2) { return p1.fecha_inicio < p2.fecha_inicio ? -1 : 1; }).map(function (c2) {
          var L = I.PPL.filter(function (l) { return l.contrato_id === c2.id; }).map(function (l) { var ar = areaL(l), it = l.item_id ? I.PPI.find(function (k) { return k.id === l.item_id; }) : null, lp = linPrep(l);
            return { id: l.id, area: ar, prep: areaPrep(ar, l.categoria), categoria: l.categoria, descripcion: l.descripcion, codigo: it ? it.codigo : '', unidad: l.unidad, cantidad: l.cantidad, dias: l.dias, opcion: l.opcion || '', nota: l.nota, especial: !!l.especial_id, prep_estado: lp.prep_estado, prep_por: lp.prep_por, prep_en: lp.prep_en, prep_nota: lp.prep_nota }; })
            .filter(function (l) { return A.indexOf(l.prep) >= 0; });
          var ev = c2.evento_id ? X.EV.find(function (e) { return e.id === c2.evento_id; }) : null;
          return { id: c2.id, codigo: c2.codigo, cliente: c2.cliente, curso: c2.curso, especialidad: c2.especialidad, sala: I.salaN(c2.sala_id), sala_id: c2.sala_id, fecha_inicio: c2.fecha_inicio, fecha_fin: c2.fecha_fin, hora_ini: c2.hora_ini, hora_fin: c2.hora_fin,
            participantes: c2.participantes, estaciones: c2.estaciones, componentes: c2.componentes, tipo_componente: c2.tipo_componente, observaciones: c2.observaciones, plan_estado: c2.plan_estado, firma_estado: c2.firma_estado || '', evento: ev ? { id: ev.id, estado: ev.estado } : null, lineas: L };
        }) };
      case 'prep_estado':
        x = I.PPL.find(function (l) { return l.id === +v.id; }); if (!x) E('No existe.');
        var pa = areaPrep(areaL(x), x.categoria), mias = (function () { var u = X.U.find(function (k) { return k.id === YO.id; }) || YO; return (I.AREAS[u.rol] || []).concat(String(u.areas_extra || '').split(',')); })(); if (areasPrepDe(YO).indexOf(pa) < 0 || (YO.rol !== 'admin' && mias.indexOf(pa) < 0)) E('Esta línea la prepara otra área.', 403);
        if (ESTPREP.indexOf(v.estado) < 0) E('Estado no válido.'); if (v.estado === 'No disponible' && !t(v.nota)) E('Explique por qué no está disponible.');
        Object.assign(x, { prep_estado: v.estado, prep_nota: t(v.nota, 500), prep_por: YO.nombre, prep_en: ahora() }); c = I.ct(x.contrato_id);
        regC(uid, c.id, 'Preparación de ' + c.codigo + ': ' + x.descripcion + ' → ' + v.estado.toLowerCase(), areaL(x), 'plan'); return {};
    }
  }
  function resp(st, out) { return new Promise(function (ok) { setTimeout(function () { ok(new Response(JSON.stringify(out), { status: st, headers: { 'Content-Type': 'application/json' } })); }, 60); }); }
  function qs(url) { var q = {}; (url.split('?')[1] || '').split('&').forEach(function (p) { var kv = p.split('='); if (kv[0]) q[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); }); return q; }
  function cuerpo(init) { try { return init && init.body ? (typeof FormData !== 'undefined' && init.body instanceof FormData ? { _archivo: init.body.get('archivo') } : JSON.parse(init.body)) : {}; } catch (e) { return {}; } }
  function correr(fn) { try { return resp(200, Object.assign(fn() || {}, { ok: true })); } catch (e) { if (e && e.body) return resp(e.st, e.body); return resp(500, { ok: false, error: 'Error en la vista previa: ' + (e && e.message) }); } }

  // ---------------------------------------------------------------- portal-api.php
  function sesion() { var id = ss('demo_portal'); return id ? CU.find(function (u) { return u.id === id && u.activo; }) : null; }
  // Las solicitudes nuevas se recuerdan mientras dure la pestaña (para abrirlas en la página de la solicitud).
  (ss('demo_portal_sol') || []).forEach(function (f) { I.nuevoCT(f); });
  // Programas adjuntados desde el portal (se recuerdan mientras dure la pestaña).
  (function () { var pr = ss('demo_portal_prog') || {}; Object.keys(pr).forEach(function (id) { var c = I.CT.find(function (k) { return k.id === +id; }); if (c && !I.progDe(c.id).length) I.progAdd(c, pr[id].nombre, pr[id].tamano, null, pr[id].quien || 'Cliente'); }); })();
  I.progSemilla();
  function manejarPortal(a, v) {
    var u = sesion();
    if (a === 'estado') return u ? { dentro: true, csrf: 'demo', usuario: { nombre: u.nombre, usuario: u.usuario, debe_cambiar: 0, empresa: CLI.find(function (k) { return k.id === u.cliente_id; }).razon } } : { dentro: false };
    if (a === 'entrar') {
      var x = CU.find(function (k) { return k.usuario === String(v.usuario || '').toLowerCase().trim(); });
      if (!x || v.clave !== 'demo') E('Usuario o contraseña incorrectos. En la vista previa: usuario «andrea.gomez» o «paula.rios», contraseña «demo».', 401);
      ss('demo_portal', x.id); x.ultimo_ingreso = ahora(); return { csrf: 'demo', debe_cambiar: 0 };
    }
    if (!u) E('Ingrese con su usuario y contraseña.', 401, { login: true });
    var emp = CLI.find(function (k) { return k.id === u.cliente_id; });
    if (a === 'salir') { ss('demo_portal', null); return {}; }
    if (a === 'cambiar_clave') E('En la vista previa las contraseñas no se cambian. En la plataforma real sí.');
    if (a === 'inicio') return { empresa: clone(emp), usuario: { nombre: u.nombre, cargo: u.cargo, correo: u.correo },
      solicitudes: I.CT.filter(function (c) { return c.cliente_id === emp.id; }).sort(function (p, q2) { return p.fecha_inicio < q2.fecha_inicio ? 1 : -1; }).map(function (c) { var f = vigente(c.id), vv = I.PPV.filter(function (k) { return k.contrato_id === c.id; }).pop();
        return { id: c.id, codigo: c.codigo, curso: c.curso, especialidad: c.especialidad, fecha_inicio: c.fecha_inicio, fecha_fin: c.fecha_fin, sala: I.salaN(c.sala_id), participantes: c.participantes, estado: c.estado, ppto_estado: c.ppto_estado, plan_estado: c.plan_estado,
          firma: f ? f.estado : '', total: vv ? vv.total : null, n_lineas: I.PPL.filter(function (l) { return l.contrato_id === c.id; }).length }; }),
      salas: X.SALAS.map(function (s) { return { id: s.id, nombre: s.nombre, ancho: s.ancho, largo: s.largo }; }), ppto_estados: I.PPEST, hoy: dia(0) };
    if (a === 'empresa_guardar') { if (!t(v.razon)) E('Escriba la razón social.'); ['razon', 'nit', 'sigla', 'tipo_entidad', 'domicilio', 'direccion', 'rep_legal', 'rep_tipo_doc', 'rep_doc', 'correo_factura', 'telefono'].forEach(function (k) { emp[k] = t(v[k], 200); }); return {}; }
    if (a === 'solicitud_nueva') {
      if (!t(v.curso)) E('Escriba el nombre del curso.'); if (!v.fecha_inicio || !v.fecha_fin) E('Indique las fechas del curso.'); if (v.fecha_fin < v.fecha_inicio) E('La fecha final no puede ser anterior a la de inicio.');
      if (v.fecha_inicio <= dia(3)) E('Las solicitudes se reciben con al menos 4 días de anticipación al curso.');
      var f = { estado: 'Solicitud', cliente: emp.razon, nit: emp.nit, contacto_nombre: u.nombre, contacto_cargo: u.cargo, contacto_correo: u.correo, curso: t(v.curso, 200), especialidad: t(v.especialidad, 120), sala_id: +v.sala_id || 1,
        fecha_inicio: v.fecha_inicio, fecha_fin: v.fecha_fin, hora_ini: v.hora_ini || '07:00', hora_fin: v.hora_fin || '17:00', participantes: +v.participantes || 0, estaciones: +v.estaciones || 0, componentes: +v.componentes || 0, tipo_componente: t(v.tipo_componente, 120),
        observaciones: t(v.observaciones, 2000), fecha_contratacion: dia(0), valor: 0, ppto_estado: 'seleccion', cliente_id: emp.id, origen: 'portal', creado_en: ahora() };
      var lista = ss('demo_portal_sol') || []; lista.push(f); ss('demo_portal_sol', lista);
      var c = I.nuevoCT(clone(f)); return { id: c.id, ocupada: false };
    }
    E('Acción desconocida.');
  }

  // ---------------------------------------------------------------- cliente-api.php con ?c= (portal) y complementos del carrito y del contrato
  function cliPpto(c, P) {
    if (!P) return P;
    P.areas = AREAS_PP;
    if (P.catalogo) P.catalogo = P.catalogo.map(function (i) { var it = I.PPI.find(function (k) { return k.id === i.id; }) || {}; i.area = it.area || areaCat(i.categoria, i.nombre); i.opciones = it.opciones || []; return i; });
    P.lineas = (P.lineas || []).map(function (l) { var o = I.PPL.find(function (k) { return k.id === l.id; }); l.area = o ? areaL(o) : areaCat(l.categoria, l.descripcion); l.opcion = o && o.opcion || ''; return l; });
    return P;
  }
  function cliContrato(c, portal) {
    var f = vigente(c.id); if (!f) return null;
    return { id: f.id, version: f.version, estado: f.estado, hash: f.hash, enviado_en: f.enviado_en, total: f.total, cliente_firma: fpub(f).cliente_firma, clemi_firma: fpub(f).clemi_firma, html: fhtml(f),
      puede_firmar: portal && f.estado === 'Por firmar el cliente', descargable: f.estado === 'Firmado' };
  }
  function manejarCli(q, v, prev) {
    var a = q.a, portal = q.c != null, c, tok;
    if (portal) {
      var u = sesion();
      if (!u) return { valido: false, login: true, mensaje: 'Su sesión terminó. Ingrese de nuevo al portal de clientes.' };
      c = I.CT.find(function (k) { return k.id === +q.c && k.cliente_id === u.cliente_id; });
      if (!c) return { valido: false, mensaje: 'Esta solicitud no existe o no pertenece a su empresa.' };
      if (!c.acceso_token) c.acceso_token = 'portal-' + c.id;
      I.SES[c.id] = { nombre: u.nombre };
      if (a === 'estado') return { valido: true, portal: true, cliente: c.cliente, curso: c.curso, dentro: true, nombre: u.nombre, csrf: 'demo' };
      if (a === 'firmar') {
        var f = vigente(c.id); if (!f || f.estado !== 'Por firmar el cliente' || +v.firma_id !== f.id) E('Este contrato ya no está esperando su firma. Recargue la página.', 409);
        if (!v.leido) E('Confirme que leyó el contrato y sus anexos.'); if (v.clave !== 'demo') E('La contraseña no coincide. En la vista previa es «demo».', 401);
        if (t(v.nombre).length < 5 || t(v.documento).length < 4 || !t(v.cargo)) E('Escriba su nombre completo, documento y cargo.');
        f.cliente_firma = { nombre: t(v.nombre, 160), tipo_doc: v.tipo_doc, documento: t(v.documento, 40), cargo: t(v.cargo, 120), usuario: u.usuario, fecha: ahora(), ip: '190.0.0.99', img: v.firma };
        f.cliente_firmado_en = ahora(); f.estado = 'Por firmar CLEMI'; c.firma_estado = 'por_firmar_clemi'; return {};
      }
      if (a === 'ppto_enviar' && ['sin_plan', 'abierto'].indexOf(c.plan_estado) >= 0) {
        if (c.plan_borrador && c.plan_borrador.length) { I.plan(c.id, c.plan_borrador, 'cliente', u.nombre + ' (' + c.cliente + ')', null, 'Enviada con la solicitud de presupuesto'); c.plan_estado = 'enviado'; c.plan_borrador = null; }
        else if (!I.ultimo(c.id)) E('Arme la sala en «2 · Arme su sala» antes de enviar la solicitud: así CLEMI sabe cómo la quiere.', 409, { falta_sala: true });
      }
      if (a === 'programa_subir' && v._archivo) { var pr = ss('demo_portal_prog') || {}; pr[c.id] = { nombre: v._archivo.name, tamano: v._archivo.size, quien: u.nombre }; ss('demo_portal_prog', pr); }
      tok = c.acceso_token;
    } else tok = q.t;
    if (a === 'ppto_linea' && !+v.id) {
      var it = I.PPI.find(function (k) { return k.id === +v.item_id; });
      if (it && it.opciones.length && it.opciones.indexOf(v.opcion) < 0) E('Elija una opción para «' + it.nombre + '».');
    }
    var r = I.manejarCliente(a, tok, v);
    if (a === 'ppto_linea' && !+v.id) { var nl = I.PPL[I.PPL.length - 1]; if (nl && nl.contrato_id === (c || {}).id) { nl.opcion = v.opcion || ''; } }
    if (a === 'datos' && r && r.curso) {
      if (!c) c = I.CT.find(function (k) { return k.acceso_token === tok; }) || I.CT[2];
      r.ppto = cliPpto(c, r.ppto); r.portal = portal; r.contrato = cliContrato(c, portal);
    }
    return r;
  }

  D.PREP = { areaL: areaL, areaPrep: areaPrep, linPrep: linPrep, areasPrepDe: areasPrepDe };
  D.FIRMAS = { FIR: FIR, vigente: vigente, fhtml: fhtml, fpub: fpub, firmaDe: firmaDe, ejemplo: FIRMA_EJ };
  // ---------------------------------------------------------------- enrutador
  var previo = window.fetch;
  window.fetch = function (url, init) {
    if (typeof url !== 'string') return previo.apply(this, arguments);
    if (url.indexOf('portal-api.php') === 0) { var q0 = qs(url), v0 = cuerpo(init); return correr(function () { return manejarPortal(q0.a, v0); }); }
    if (url.indexOf('cliente-api.php') === 0) { var q1 = qs(url), v1 = cuerpo(init); return correr(function () { return manejarCli(q1, v1); }); }
    if (url.indexOf('api.php') === 0) {
      var q = qs(url), YO = X.yo();
      // Marcación corporal sobre el modelo anatómico 3D (vista previa en memoria).
      if (YO && (q.a === 'marca_cuerpo_guardar' || q.a === 'marca_cuerpo_borrar')) { var vm = cuerpo(init); return correr(function () {
        if (q.a === 'marca_cuerpo_borrar') { MC = MC.filter(function (m) { return m.id !== +vm.id; }); return {}; }
        if (!t(vm.tipo) || !t(vm.texto)) E('Escriba la descripción del hallazgo.');
        var m = { id: MC.length ? MC[MC.length - 1].id + 1 : 1, componente_id: +vm.componente_id, modelo: vm.modelo === 'femenino' ? 'femenino' : 'masculino', x: +vm.x, y: +vm.y, z: +vm.z, tipo: t(vm.tipo, 60), texto: t(vm.texto, 500), creado_por: YO.id, creado_en: ahora() };
        MC.push(m); X.reg(YO.id, 'componente', m.componente_id, null, 'Marcó un hallazgo en el modelo 3D del cuerpo', m.tipo + ': ' + m.texto); return { id: m.id, creado_por: YO.id, creado_en: m.creado_en }; }); }
      if (YO && q.a === 'componente') return previo.apply(this, arguments).then(function (r) { return r.clone().json().then(function (j) { if (j.ok && j.componente) j.componente.marcas_cuerpo = MC.filter(function (m) { return m.componente_id === j.componente.id; }); return new Response(JSON.stringify(j), { status: r.status, headers: { 'Content-Type': 'application/json' } }); }); });
      if (YO && NUEVAS.indexOf(q.a) >= 0) { var v = cuerpo(init); return correr(function () { return manejar(q.a, q, v, YO); }); }
      if (YO && YO.rol === 'firma' && ['yo', 'logout', 'cambiar_clave', 'base', 'tick', 'bitacora'].indexOf(q.a) < 0) return resp(403, { ok: false, error: 'Su usuario de firma solo puede leer y firmar los contratos.' });
    }
    return previo.apply(this, arguments);
  };

  // Descargas del contrato firmado: en la vista previa se descarga el contrato de ejemplo en PDF.
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href*="a=archivo_docx"], a[href*="a=contrato_docx&c="]');
    if (!a) return; ev.preventDefault();
    var m = /[?&](?:id|c)=(\d+)/.exec(a.getAttribute('href')), f = null, c = null;
    if (/archivo_docx/.test(a.getAttribute('href'))) { f = FIR.find(function (k) { return k.id === +(m && m[1]); }); c = f ? I.ct(f.contrato_id) : I.CT[0]; } else c = I.CT.find(function (k) { return k.id === +(m && m[1]); }) || I.CT[0];
    if (D.contratoDocx) D.contratoDocx(c, false);
  }, true);
})();
/* Modelos anatómicos 3D: en la vista previa se cargan desde un script y se entregan al visor como datos. */
(function () {
  var D = window.CLEMI_DEMO; if (!D) return; var buf = {};
  var ARCH = { masculino: ['cuerpo-masculino-glb.js', 'DEMO_GLB_MASC'], femenino: ['cuerpo-femenino-glb.js', 'DEMO_GLB_FEM'] };
  D.modeloCuerpo = function (mo) {
    var a = ARCH[mo] || ARCH.masculino;
    if (buf[mo]) return Promise.resolve(buf[mo].slice(0));
    return new Promise(function (ok) {
      var s = document.createElement('script'); s.src = 'assets/modelos/' + a[0];
      s.onload = function () { var b = atob(window[a[1]]), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); buf[mo] = u.buffer; window[a[1]] = null; ok(buf[mo].slice(0)); };
      s.onerror = function () { ok('assets/modelos/cuerpo-' + mo + '.glb'); };
      document.head.appendChild(s);
    });
  };
})();
