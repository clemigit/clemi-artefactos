/* =====================================================================
   CLEMI · VISTA PREVIA — Operaciones (contratación), planificación del
   cliente y Audiovisuales. Simula en memoria las acciones nuevas de
   api.php y cliente-api.php. Nada se guarda.
   ===================================================================== */
(function () {
  'use strict';
  var X = window.CLEMI_DEMO.ctx;
  var clone = X.clone, ahora = X.ahora, dia = X.dia;
  function t(s, max) { return String(s == null ? '' : s).trim().slice(0, max || 2000); }
  function E(msg, st, extra) { var o = { ok: false, error: msg }; if (extra) for (var k in extra) o[k] = extra[k]; throw { st: st || 400, body: o }; }
  function sumarD(f, n) { var p = f.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function ftxt(f) { var M = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'], p = f.split('-'); return +p[2] + ' de ' + M[+p[1] - 1] + ' de ' + p[0]; }
  function hace(min) { var d = new Date(Date.now() - min * 60000), z = function (n) { return ('0' + n).slice(-2); }; return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes()) + ':00'; }
  function L(cat, x, y, r, label) { return { id: 'i' + Math.random().toString(36).slice(2, 9), cat: cat, x: x, y: y, r: r || 0, label: label || '' }; }
  var AREAS = { admin: ['op', 'mo', 'ct', 'ps', 'av', 'ad', 'lg', 'bm'], administrativo: ['ad'], biomedica: ['bm'], instrumentador: ['op', 'mo'], tanatologo: ['op', 'mo'], comercial: ['ct'], audiovisual: ['av'], almacen: ['ps'] };
  var AVEST = ['Solicitado', 'En preparación', 'Listo', 'Instalado / entregado', 'No disponible'];
  var AVCAT = ['Equipos audiovisuales', 'Certificaciones', 'Marcación', 'Material impreso y papelería', 'Otros'];
  var CATS_AV = ['Arte para marcación', 'Programa académico'];

  // ---------------------------------------------------------------- datos de ejemplo
  var pdf = ['Impresos', 'Solo PDF generado'];
  var AVI = [
    ['Equipos audiovisuales', 'Video beam / proyector', 'Proyector con cable HDMI', 'unidad', 4, []], ['Equipos audiovisuales', 'Pantalla de proyección', '', 'unidad', 4, []],
    ['Equipos audiovisuales', 'Televisor o monitor', 'Con soporte de piso o pared', 'unidad', 8, []], ['Equipos audiovisuales', 'Sonido (cabina y consola)', '', 'kit', 3, []],
    ['Equipos audiovisuales', 'Micrófono inalámbrico de mano', '', 'unidad', 6, []], ['Equipos audiovisuales', 'Micrófono de solapa', '', 'unidad', 4, []],
    ['Equipos audiovisuales', 'Computador portátil para presentaciones', '', 'unidad', 4, []], ['Equipos audiovisuales', 'Presentador / apuntador láser', '', 'unidad', 6, []],
    ['Equipos audiovisuales', 'Cámara cenital por estación', 'Transmite el campo quirúrgico a las pantallas', 'unidad', 6, []], ['Equipos audiovisuales', 'Transmisión en vivo (streaming)', '', 'servicio', 1, []],
    ['Equipos audiovisuales', 'Grabación de video del curso', '', 'servicio', 2, []], ['Equipos audiovisuales', 'Fotografía del curso', '', 'servicio', 2, []],
    ['Certificaciones', 'Certificados de asistencia', 'Para cada participante', 'unidad', null, pdf], ['Certificaciones', 'Certificados de ponentes / instructores', '', 'unidad', null, pdf],
    ['Marcación', 'Marca de salas', 'Logo del cliente en la sala', 'pieza', null, []], ['Marcación', 'Marca de lockers', '', 'pieza', null, []],
    ['Marcación', 'Marca de estaciones', 'Identificación de cada estación', 'pieza', null, []], ['Marcación', 'Habladores', 'Habladores de mesa', 'unidad', null, []],
    ['Marcación', 'Marca de batas', '', 'unidad', null, ['Bordado', 'Estampado', 'Parche']], ['Marcación', 'Pendón / roll-up', '', 'unidad', null, []],
    ['Material impreso y papelería', 'Libretas', '', 'unidad', null, ['Con logo del cliente', 'Con logo CLEMI']], ['Material impreso y papelería', 'Lapiceros', '', 'unidad', null, ['Con logo del cliente', 'Con logo CLEMI']],
    ['Material impreso y papelería', 'Impresión de programas', 'Programa académico del curso', 'unidad', null, []], ['Material impreso y papelería', 'Escarapelas / credenciales', 'Con el QR de ingreso de cada participante', 'unidad', null, pdf],
    ['Equipos audiovisuales', 'Gafas de realidad virtual', 'Visores de realidad virtual para práctica o demostración', 'unidad', 0, []], ['Equipos audiovisuales', 'Tablet', '', 'unidad', 0, []]
  ].map(function (x, i) { return { id: i + 1, categoria: x[0], nombre: x[1], descripcion: x[2], unidad: x[3], stock: x[4], opciones: x[5], activo: 1, orden: i + 1 }; });
  // Inventario físico de la sala de audiovisuales (equipos con código, serial y estado)
  var AVEQ_EST = ['Funcional', 'Parcialmente funcional', 'Enciende · por probar', 'Pendiente de revisión', 'Disfuncional'], AVEQ_SIT = ['Alta', 'Por definir', 'Dado de baja'];
  var EQ = (window.DEMO_AVEQ || []).map(function (q, n) { var it = q.ofrece ? AVI.find(function (k) { return k.nombre === q.ofrece; }) : null; var o = Object.assign({ id: n + 1, item_id: it ? it.id : null }, q); delete o.ofrece; return o; });
  function eqSync() { AVI.forEach(function (k) { var L = EQ.filter(function (e) { return e.item_id === k.id; }); if (L.length) k.stock = L.reduce(function (s, e) { return s + (e.situacion === 'Alta' && e.estado === 'Funcional' ? +e.cantidad : 0); }, 0); }); }
  eqSync();
  var CT = [], PL = [], PN = [], CAV = [], ARC = [], sq = { ct: 0, pn: 0, cav: 0, arc: 0 };
  function nota(cid, ver, tipo, texto, vis, autor, aid, area, cuando) { PN.push({ id: ++sq.pn, contrato_id: cid, version: ver, tipo: tipo, texto: texto || '', visible_cliente: vis ? 1 : 0, autor_nombre: autor, autor_id: aid, area: area, creado_en: cuando || ahora() }); }
  function plan(cid, items, tipo, autor, aid, notas, cuando) { var v = PL.filter(function (p) { return p.contrato_id === cid; }).length + 1; PL.push({ id: PL.length + 1, contrato_id: cid, version: v, items: items, autor_tipo: tipo, autor_nombre: autor, autor_id: aid, notas: notas || '', creado_en: cuando || ahora() }); return v; }
  function linea(cid, item, cant, op, det, est, uid) { CAV.push({ id: ++sq.cav, contrato_id: cid, item_id: item, cantidad: cant, opcion: op || '', detalle: det || '', estado: est || 'Solicitado', estado_por: est && est !== 'Solicitado' ? uid : null, estado_en: est && est !== 'Solicitado' ? hace(200) : null, creado_por: 20, creado_en: hace(2000) }); }
  function nuevoCT(o) {
    var c = Object.assign({ id: ++sq.ct, codigo: 'CT-' + dia(0).slice(0, 4) + '-' + ('00' + (sq.ct)).slice(-3), estado: 'Contratado', nit: '', contacto_nombre: '', contacto_cargo: '', contacto_correo: '', contacto_telefono: '',
      especialidad: '', hora_ini: '07:00', hora_fin: '17:00', participantes: 0, estaciones: 0, componentes: 0, tipo_componente: '', valor: 0, forma_pago: '', estado_pago: 'Pendiente',
      fecha_contratacion: dia(-10), observaciones: '', responsable_id: 20, evento_id: null, acceso_token: null, acceso_pin: null, acceso_creado_en: null, acceso_anulado_en: null, acceso_anulado_motivo: null, acceso_ultimo: null,
      plan_estado: 'sin_plan', plan_estado_prev: null, plan_nota: '', plan_borrador: null, plan_borrador_en: null, plan_borrador_por: null, cambio_motivo: null, cambio_en: null, cambio_por: null,
      revision_ins: null, revision_ins_resultado: null, revision_ins_por: null, revision_ins_en: null, revision_ins_version: null,
      ppto_estado: 'sin_presupuesto', ppto_admin_pct: 0, ppto_iva: 19, ppto_anticipo: 70, ppto_nota: '', ppto_ajustes: '', doc_datos: {}, creado_por: 20, creado_en: hace(3000), actualizado_por: 20, actualizado_en: hace(3000) }, o);
    CT.push(c); return c;
  }
  (function sembrar() {
    var c1 = nuevoCT({ cliente: 'Casa comercial de ejemplo S.A.S.', nit: '900.123.456-7', contacto_nombre: 'Dra. Paula Ríos (ejemplo)', contacto_cargo: 'Gerente de educación médica', contacto_correo: 'educacion@ejemplo.com', contacto_telefono: '3001234567',
      curso: 'Curso avanzado de artroscopia de hombro (ejemplo)', especialidad: 'Ortopedia', sala_id: 3, fecha_inicio: dia(10), fecha_fin: dia(11), participantes: 24, estaciones: 6, componentes: 6, tipo_componente: 'Segmento hombro fresco congelado',
      valor: 48500000, forma_pago: '50% anticipo, saldo a 30 días', estado_pago: 'Abono', acceso_token: 'demo-hombro-2026-acceso-cliente', acceso_pin: '123456', acceso_creado_en: hace(2800), acceso_ultimo: hace(300), plan_estado: 'aprobado' });
    var it1 = [L(1, 180, 220, 0, 'Estación 1'), L(1, 420, 220, 0, 'Estación 2'), L(1, 660, 220, 0, 'Estación 3'), L(1, 180, 560, 0, 'Estación 4'), L(1, 420, 560, 0, 'Estación 5'), L(1, 660, 560, 0, 'Estación 6'),
      L(5, 180, 320), L(5, 420, 320), L(5, 660, 320), L(5, 180, 660), L(5, 420, 660), L(5, 660, 660), L(3, 300, 120), L(3, 540, 120)];
    var v1 = plan(c1.id, it1.slice(0, 10), 'cliente', 'Paula Ríos (Casa comercial de ejemplo S.A.S.)', null, 'Necesitamos las torres frente a cada camilla', hace(2400));
    nota(c1.id, v1, 'Enviada por el cliente', 'Necesitamos las torres frente a cada camilla', 1, 'Paula Ríos (Casa comercial de ejemplo S.A.S.)', null, 'Cliente', hace(2400));
    c1.revision_ins = 'Faltan torres en las estaciones 4 a 6 y las mesas de instrumental.'; c1.revision_ins_resultado = 'Requiere ajustes'; c1.revision_ins_por = 2; c1.revision_ins_en = hace(2000); c1.revision_ins_version = 1;
    nota(c1.id, v1, 'Revisión de instrumentación · Requiere ajustes', c1.revision_ins, 0, 'Sergio Saavedra', 2, 'Instrumentación', hace(2000));
    var v2 = plan(c1.id, it1, 'clemi', 'Natalia Cogua · CLEMI', 20, 'Completamos torres y mesas de instrumental según la revisión de instrumentación', hace(1800));
    nota(c1.id, v2, 'Ajuste de CLEMI', 'Completamos torres y mesas de instrumental según la revisión de instrumentación', 1, 'Natalia Cogua', 20, 'Operaciones', hace(1800));
    nota(c1.id, v2, 'Planificación aprobada', 'Quedó aprobada. ¡Gracias!', 1, 'Natalia Cogua', 20, 'Operaciones', hace(1700));
    linea(c1.id, 9, 6, '', 'Una por estación', 'Listo', 24); linea(c1.id, 1, 1, '', '', 'Listo', 24); linea(c1.id, 13, 24, 'Solo PDF generado', '', 'En preparación', 24);
    linea(c1.id, 17, 6, '', 'Logo del cliente a color', 'En preparación', 24); linea(c1.id, 19, 30, 'Bordado', 'Logo del cliente en el pecho', 'Solicitado'); linea(c1.id, 23, 30, '', '', 'Solicitado');
    var c2 = nuevoCT({ cliente: 'Laboratorio de ejemplo Ltda.', contacto_nombre: 'Ing. Camilo Duarte (ejemplo)', contacto_correo: 'camilo@ejemplo.com', contacto_telefono: '3109876543', curso: 'Taller de columna — abordaje posterior (ejemplo)', especialidad: 'Neurocirugía',
      sala_id: 5, fecha_inicio: dia(6), fecha_fin: dia(6), hora_ini: '08:00', hora_fin: '16:00', participantes: 12, estaciones: 4, componentes: 4, tipo_componente: 'Segmento columna', valor: 26000000, estado_pago: 'Pagado',
      acceso_token: 'demo-columna-2026-acceso-cliente', acceso_pin: '654321', acceso_creado_en: hace(4000), acceso_ultimo: hace(90), plan_estado: 'cambio_solicitado', plan_estado_prev: 'enviado', cambio_motivo: 'Necesitamos una estación más para el instructor principal, cerca de la pantalla.', cambio_en: hace(80), cambio_por: 'Camilo Duarte' });
    var v3 = plan(c2.id, [L(1, 170, 320, 90, 'Estación 1'), L(1, 370, 320, 90, 'Estación 2'), L(1, 570, 320, 90, 'Estación 3'), L(1, 370, 750, 0, 'Estación 4'), L(5, 170, 480), L(5, 370, 480), L(5, 570, 480), L(6, 600, 880)], 'cliente', 'Camilo Duarte (Laboratorio de ejemplo Ltda.)', null, '', hace(600));
    nota(c2.id, v3, 'Enviada por el cliente', '', 1, 'Camilo Duarte (Laboratorio de ejemplo Ltda.)', null, 'Cliente', hace(600));
    nota(c2.id, v3, 'Cambio solicitado por el cliente', c2.cambio_motivo, 1, 'Camilo Duarte (Laboratorio de ejemplo Ltda.)', null, 'Cliente', hace(80));
    linea(c2.id, 7, 1, '', '', 'Listo', 24); linea(c2.id, 13, 12, 'Impresos', '', 'Solicitado');
    nuevoCT({ cliente: 'Distribuidora médica de ejemplo', contacto_nombre: 'Andrea Gómez (ejemplo)', curso: 'Workshop de reemplazo de cadera (ejemplo)', especialidad: 'Ortopedia', sala_id: 2, fecha_inicio: dia(25), fecha_fin: dia(25),
      participantes: 16, estaciones: 4, componentes: 4, valor: 32000000, acceso_token: 'demo-cadera-2026-acceso-cliente', acceso_pin: '112233', acceso_creado_en: hace(500) });
    nuevoCT({ estado: 'Cotización', cliente: 'Sociedad científica de ejemplo', curso: 'Curso de anatomía laparoscópica (ejemplo)', sala_id: 1, fecha_inicio: dia(45), fecha_fin: dia(46), participantes: 30, estaciones: 8, valor: 61000000, fecha_contratacion: dia(-2) });
  })();

  // ---------------------------------------------------------------- reglas
  function acceso(c) {
    var h = dia(0), r = { desde: c.fecha_contratacion, hasta: sumarD(c.fecha_inicio, -1), cambios_hasta: sumarD(c.fecha_inicio, -3), vigente: false, en_plazo: false, editable: false, puede_solicitar: false, motivo: '' };
    if (!c.acceso_token) { r.motivo = 'sin_acceso'; return r; }
    if (c.acceso_anulado_en) { r.motivo = 'anulado'; return r; }
    if (c.estado === 'Cancelado' || c.estado === 'Finalizado') { r.motivo = 'cerrado'; return r; }
    if (h < c.fecha_contratacion) { r.motivo = 'no_iniciado'; return r; }
    if (h > r.hasta) { r.motivo = 'vencido'; return r; }
    r.vigente = true; r.en_plazo = h <= r.cambios_hasta;
    r.editable = r.en_plazo && ['sin_plan', 'abierto'].indexOf(c.plan_estado) >= 0;
    r.puede_solicitar = r.en_plazo && ['enviado', 'aprobado'].indexOf(c.plan_estado) >= 0;
    return r;
  }
  function ultimo(cid) { var v = PL.filter(function (p) { return p.contrato_id === cid; }); return v.length ? v[v.length - 1] : null; }
  function catNom(id) { var c = X.CAT.find(function (k) { return k.id === +id; }); return c ? c.nombre : 'Elemento'; }
  function resumen(items) { var r = {}; items.forEach(function (x) { var n = catNom(x.cat); r[n] = (r[n] || 0) + 1; }); var k = Object.keys(r).sort(); return k.length ? k.map(function (n) { return r[n] + ' × ' + n; }).join(', ') : 'Sala vacía'; }
  function avDe(cid) { return CAV.filter(function (a) { return a.contrato_id === cid; }).map(function (a) { var i = AVI.find(function (k) { return k.id === a.item_id; }); return Object.assign({}, a, { item_nombre: i.nombre, categoria: i.categoria, unidad: i.unidad, stock: i.stock }); }).sort(function (a, b) { return AVI.findIndex(function (k) { return k.id === a.item_id; }) - AVI.findIndex(function (k) { return k.id === b.item_id; }); }); }
  function salaN(id) { return (X.SALAS.find(function (s) { return s.id === +id; }) || {}).nombre || '—'; }
  function vista(c, completo) {
    var o = clone(c), u = ultimo(c.id); o.sala_nombre = salaN(c.sala_id); o.acceso = acceso(c);
    o.plan_version = u ? u.version : 0; o.plan_autor = u ? u.autor_nombre : ''; o.plan_autor_tipo = u ? u.autor_tipo : ''; o.plan_en = u ? u.creado_en : ''; o.plan_resumen = u ? resumen(u.items) : ''; o.plan_n = u ? u.items.length : 0;
    var av = CAV.filter(function (a) { return a.contrato_id === c.id; }); o.av_n = av.length; o.av_listos = av.filter(function (a) { return a.estado === 'Listo' || a.estado === 'Instalado / entregado'; }).length;
    o.tiene_borrador = !!c.plan_borrador; delete o.plan_borrador;
    if (!completo) ['valor', 'forma_pago', 'estado_pago', 'nit', 'contacto_correo', 'contacto_telefono', 'observaciones', 'acceso_token', 'acceso_pin', 'cambio_por', 'doc_datos', 'ppto_nota', 'ppto_ajustes', 'ppto_admin_pct', 'ppto_iva', 'ppto_anticipo'].forEach(function (k) { delete o[k]; });
    return o;
  }
  function ct(id) { var c = CT.find(function (x) { return x.id === +id; }); if (!c) E('El contrato no existe.', 404); return c; }
  function activo(c) { if (c.estado === 'Cancelado' || c.estado === 'Finalizado') E('El contrato está ' + c.estado.toLowerCase() + '.', 409); }
  function comprometido(item, d, h, excl) { return CAV.filter(function (a) { var c = CT.find(function (k) { return k.id === a.contrato_id; }); return a.item_id === item && a.id !== excl && ['Cotización', 'Contratado'].indexOf(c.estado) >= 0 && a.estado !== 'No disponible' && c.fecha_inicio <= h && c.fecha_fin >= d; }).reduce(function (s, a) { return s + a.cantidad; }, 0); }
  function vencer() { var h = dia(0); CT.forEach(function (c) { if (c.acceso_token && !c.acceso_anulado_en && (c.fecha_inicio <= h || c.estado === 'Cancelado' || c.estado === 'Finalizado')) { c.acceso_anulado_en = ahora(); c.acceso_anulado_motivo = c.fecha_inicio <= h ? 'Vencimiento automático: llegó la fecha de inicio del curso' : 'Contrato ' + c.estado.toLowerCase(); X.reg(null, 'plan', c.id, c.evento_id, 'Se anuló el acceso del cliente a la planificación', c.cliente); } }); }
  function filtroBit(rol) { return function (b) { if (rol === 'admin') return true; if (rol === 'comercial') return ['contrato', 'plan', 'av', 'av_item', 'ppto', 'pp_item'].indexOf(b.entidad) >= 0; if (rol === 'almacen') return ['ppto', 'pp_item'].indexOf(b.entidad) >= 0; if (rol === 'audiovisual') return ['plan', 'av', 'av_item', 'av_equipo'].indexOf(b.entidad) >= 0; return ['contrato', 'av_equipo', 'ppto', 'pp_item'].indexOf(b.entidad) < 0; }; }
  function limpio(items) { if (!Array.isArray(items)) E('Distribución no válida.'); return items.filter(function (i) { return X.CAT.some(function (c) { return c.id === +i.cat; }); }).map(function (i) { return { id: String(i.id || 'i' + Math.random().toString(36).slice(2, 8)), cat: +i.cat, x: Math.round(+i.x), y: Math.round(+i.y), r: (+i.r || 0) % 360, label: t(i.label, 80) }; }); }
  var AREA = { admin: 'Administración', comercial: 'Operaciones', audiovisual: 'Audiovisuales', instrumentador: 'Instrumentación', tanatologo: 'Morgue' };

  // ---------------------------------------------------------------- Presupuesto (almacén) · vista previa
  var PPI = (window.DEMO_PPI || []).map(function (x) { return Object.assign({}, x); });
  var PPCAT = window.DEMO_PP_CAT || [], PPGR = ['Bienes y servicios', 'Alimentación'], ESPEST = ['Pendiente', 'En consulta', 'Aprobada', 'No es posible'];
  var PPEST = { sin_presupuesto: 'Sin presupuesto', seleccion: 'En selección', solicitado: 'En Presupuesto (por valorar)', emitido: 'Emitido al cliente', ajustes: 'El cliente pidió ajustes', aceptado: 'Aceptado por el cliente' };
  var PPL = [], PPE = [], PPV = [], CLEMI_D = { razon: 'FUNDACIÓN CENTRO LATINOAMERICANO DE ENTRENAMIENTO MÉDICO E INVESTIGACIÓN (CLEMI)', nit: '900.136.179-9', domicilio: 'Sopó, Cundinamarca, Colombia', rep_legal: 'Dra. Claudia Reyes', rep_doc: '', ciudad_firma: 'Sopó, Cundinamarca' };
  var psq = { l: 0, e: 0 };
  // Inventario biomédico (informe de Biomédica, corte octubre 2026)
  var BIO_CORTE = 'Octubre 2026';
  (function () {
    var gen = PPI.find(function (i) { return i.nombre === 'Arco en C' && i.categoria === 'Equipos'; }); if (gen) { gen.activo = 0; gen.descripcion = 'Reemplazado por Arco en C GE y Arco en C SIEMENS (inventario biomédico)'; }
    [['Arco en C GE', 1, 1, 0, 0], ['Arco en C SIEMENS', 3, 3, 0, 0], ['Bombas de irrigación CONMED', 5, 4, 1, 0], ['Bombas de irrigación RICHARD WOLF', 4, 2, 2, 0], ['Electrobisturí', 7, 7, 0, 0], ['Fuentes de luz', 9, 5, 4, 6],
     ['Lámpara cielítica', 10, 10, 0, 0], ['Módulo de Grabación', 5, 1, 4, 0], ['Monitores', 15, 10, 1, 4], ['Neumoinsufladores', 10, 7, 3, 0], ['Shaver CONMED', 4, 3, 1, 0], ['Shaver RICHARD WOLF', 0, 0, 0, 7],
     ['Shaver SMITH', 6, 3, 3, 1], ['Shaver STRYKER', 1, 0, 1, 0], ['Videoprocesadores', 10, 10, 0, 2]].forEach(function (e) {
      var id = PPI.reduce(function (m, i) { return Math.max(m, i.id); }, 0) + 1;
      PPI.push({ id: id, codigo: 'PP-' + ('00' + id).slice(-3), categoria: 'Equipos', nombre: e[0], descripcion: '', unidad: 'unidad por día', precio: null, grupo: 'Bienes y servicios', activo: 1, visible_cliente: 1, area: 'Biomédica', orden: id, origen: 'Inventario biomédico',
        inv_bio: 1, inv_total: e[1], inv_disp: e[2], inv_mant: e[3], inv_baja: e[4], inv_obs: '' });
    });
  })();
  function bioEstado(i) { var d = +i.inv_disp, t = +i.inv_total; return d <= 0 ? 'Agotado' : (t > 0 && d / t <= 0.25 ? 'Bajo stock' : 'Disponible'); }
  function bioComp(itemId, c) { return PPL.filter(function (l) { if (l.item_id !== itemId || l.contrato_id === c.id) return false; var k = CT.find(function (x) { return x.id === l.contrato_id; }); return k && (k.estado === 'Cotización' || k.estado === 'Contratado') && k.fecha_inicio <= c.fecha_fin && k.fecha_fin >= c.fecha_inicio; }).reduce(function (s2, l) { return s2 + Math.ceil(+l.cantidad); }, 0); }
  function bioPara(i, c) { return i.inv_bio ? Math.max(0, +i.inv_disp - bioComp(i.id, c)) : null; }
  function bioValidar(itemId, cant, c, exLinea) {
    var i = PPI.find(function (k) { return k.id === +itemId; }); if (!i || !i.inv_bio) return;
    var ya = PPL.filter(function (l) { return l.contrato_id === c.id && l.item_id === i.id && l.id !== exLinea; }).reduce(function (s2, l) { return s2 + +l.cantidad; }, 0);
    var q = Math.max(0, bioPara(i, c) - Math.ceil(ya));
    if (cant > q) E(q ? 'De «' + i.nombre + '» hay ' + q + ' disponible' + (q === 1 ? '' : 's') + ' para las fechas del curso.' : '«' + i.nombre + '» no tiene unidades disponibles para las fechas del curso. Puede pedirlo como solicitud especial.', 409);
  }
  function ppIt(nombre) { return PPI.find(function (i) { return i.nombre === nombre; }); }
  function ppLinea(cid, nombre, cant, dias, precio, origen, nota, autor) { var i = ppIt(nombre); PPL.push({ id: ++psq.l, contrato_id: cid, item_id: i.id, especial_id: null, categoria: i.categoria, descripcion: i.nombre, unidad: i.unidad, cantidad: cant, dias: dias || 1, precio: precio == null ? null : precio, grupo: i.grupo, nota: nota || '', origen: origen || 'clemi', autor_nombre: autor || 'Natalia Cogua', creado_en: hace(900) }); }
  function ppEsp(cid, texto, cant, estado, resp, autor) { PPE.push({ id: ++psq.e, contrato_id: cid, texto: texto, cantidad: cant || '', estado: estado || 'Pendiente', respuesta: resp || '', autor_nombre: autor || 'Cliente', origen: 'cliente', creado_en: hace(700), respondido_por: estado && estado !== 'Pendiente' ? 'Osvaldo Naar' : null, respondido_en: estado && estado !== 'Pendiente' ? hace(400) : null }); return psq.e; }
  function ppEspLinea(cid, eid, desc, cat, unidad, cant, dias, precio) { PPL.push({ id: ++psq.l, contrato_id: cid, item_id: null, especial_id: eid, categoria: cat, descripcion: desc, unidad: unidad, cantidad: cant, dias: dias, precio: precio, grupo: 'Bienes y servicios', nota: 'Solicitud especial', origen: 'especial', autor_nombre: 'Osvaldo Naar', creado_en: hace(400) }); }
  var ORD_CAT = {}; PPCAT.forEach(function (c, i) { ORD_CAT[c] = i; });
  function ppLineas(cid) { return PPL.filter(function (l) { return l.contrato_id === cid; }).sort(function (a, b) { var x = ORD_CAT[a.categoria] == null ? 99 : ORD_CAT[a.categoria], y = ORD_CAT[b.categoria] == null ? 99 : ORD_CAT[b.categoria]; return x === y ? a.id - b.id : x - y; }).map(function (l) { var o = clone(l); o.total = l.precio == null ? null : Math.round(l.precio * l.cantidad * Math.max(1, l.dias)); return o; }); }
  function ppTot(c, L) {
    var g = { 'Bienes y servicios': 0, 'Alimentación': 0 }, sin = 0;
    L.forEach(function (l) { if (l.total == null) { sin++; return; } g[g[l.grupo] != null ? l.grupo : 'Bienes y servicios'] += l.total; });
    var base = g['Bienes y servicios'] + g['Alimentación'], adm = Math.round(base * c.ppto_admin_pct / 100), sub = base + adm, iva = Math.round(sub * c.ppto_iva / 100), tot = sub + iva, p1 = Math.round(tot * c.ppto_anticipo / 100);
    return { grupos: g, base: base, admin_pct: c.ppto_admin_pct, admin: adm, subtotal: sub, iva_pct: c.ppto_iva, iva: iva, total: tot, anticipo_pct: c.ppto_anticipo, pago1: p1, pago2: tot - p1, sin_precio: sin,
      por_estacion: c.estaciones ? Math.round(tot / c.estaciones) : null, por_participante: c.participantes ? Math.round(tot / c.participantes) : null };
  }
  function ppCompleto(c) { var L = ppLineas(c.id); return { lineas: L, totales: ppTot(c, L), especiales: clone(PPE.filter(function (e) { return e.contrato_id === c.id; })), versiones: clone(PPV.filter(function (v) { return v.contrato_id === c.id; }).slice().reverse()), estado: c.ppto_estado, nota: c.ppto_nota, ajustes: c.ppto_ajustes }; }
  function ppEmitir(c, quien, cuando) {
    var P = ppCompleto(c), ver = PPV.filter(function (v) { return v.contrato_id === c.id; }).length + 1;
    PPV.push({ id: PPV.length + 1, contrato_id: c.id, version: ver, datos: { lineas: P.lineas, totales: P.totales, especiales: P.especiales, nota: c.ppto_nota }, total: P.totales.total, emitido_por: quien, emitido_en: cuando || ahora(), respuesta: null, respuesta_texto: '', respuesta_por: null, respuesta_en: null });
    c.ppto_estado = 'emitido'; c.ppto_ajustes = ''; c.valor = P.totales.total; if (c.estado === 'Solicitud') c.estado = 'Cotización'; return ver;
  }
  function ppAbierto(c) { activo(c); if (['emitido', 'aceptado'].indexOf(c.ppto_estado) >= 0) E('El presupuesto ya fue ' + (c.ppto_estado === 'emitido' ? 'emitido' : 'aceptado') + '. Para modificarlo, use «Reabrir presupuesto».', 409); }
  function ppEditableCli(c) { return ['Solicitud', 'Cotización'].indexOf(c.estado) >= 0 && ['sin_presupuesto', 'seleccion', 'ajustes'].indexOf(c.ppto_estado) >= 0; }
  function regP(uid, cid, acc, det) { X.reg(uid, 'ppto', cid, null, acc, det || ''); }
  function precioIn(v) { var s = String(v == null ? '' : v).replace(/[^\d]/g, ''); return s === '' ? null : +s; }
  function pesosD(v) { return '$' + Math.round(+v || 0).toLocaleString('es-CO'); }
  function linTxt(l) { return l.descripcion + ' × ' + l.cantidad + (l.dias > 1 ? ' × ' + l.dias + ' días' : ''); }
  function docDatos(c) {
    var d = Object.assign({ tipo_entidad: 'entidad de derecho privado', domicilio: 'Bogotá D.C., Colombia', direccion: '', rep_legal: '', rep_tipo_doc: 'cédula de ciudadanía', rep_doc: '', sigla: '', dirigido_a: c.especialidad ? 'médicos especialistas en ' + c.especialidad : '', objetivo: '',
      tipo_actividad: 'Cerrada', asistentes: '', directores: '', instructores: '', salas: '1 sala de entrenamiento', enlaces: c.contacto_nombre ? c.contacto_nombre + (c.contacto_correo ? ' (' + c.contacto_correo + ')' : '') : '', razon_factura: c.cliente, nit_factura: c.nit, correo_factura: '',
      exclusiones: '', aportes_contratante: '', transporte: '', dias_participantes: 10, dias_cambios: 8, pago1_dias: 10, pago2_dias: 10 }, {});
    Object.keys(c.doc_datos || {}).forEach(function (k) { if (c.doc_datos[k] !== '' && c.doc_datos[k] != null) d[k] = c.doc_datos[k]; });
    return d;
  }
  function docFaltan(c, d, T) {
    var f = []; if (!c.nit) f.push('NIT del cliente'); if (!d.rep_legal) f.push('representante legal del cliente'); if (!d.rep_doc) f.push('documento del representante legal'); if (!d.direccion) f.push('dirección del cliente');
    if (!d.correo_factura) f.push('correo de facturación'); if (!T.total) f.push('valores del presupuesto'); if (T.sin_precio) f.push(T.sin_precio + ' línea(s) del presupuesto sin precio'); if (!CLEMI_D.rep_doc) f.push('cédula de la representante legal de CLEMI (Administración → datos de CLEMI)'); return f;
  }
  function areasDe(u) { var a = (AREAS[u.rol] || ['op']).slice(); String(u.areas_extra || '').split(',').forEach(function (x) { if (x && a.indexOf(x) < 0) a.push(x); }); return a; }
  function esPS(YO) { var u = X.U.find(function (k) { return k.id === YO.id; }) || YO; return YO.rol === 'admin' || areasDe(u).indexOf('ps') >= 0; }
  var PSA = ['pp_catalogo', 'pp_item_guardar', 'pp_importar', 'ppto_bandeja', 'ppto', 'ppto_linea_guardar', 'ppto_linea_quitar', 'ppto_especial_guardar', 'ppto_especial_responder', 'ppto_especial_quitar',
    'ppto_condiciones', 'ppto_solicitar', 'ppto_emitir', 'ppto_respuesta', 'ppto_reabrir', 'contrato_doc_datos', 'clemi_datos_guardar', 'bod_inventario', 'bod_producto_guardar', 'bod_movimiento_guardar', 'bod_movimiento_borrar', 'bio_inventario', 'bio_guardar'];
  function manejarPP(a, q, v, YO) {
    if (/^bod_/.test(a)) return manejarBod(a, q, v, YO);
    var uid = YO.id, CTok = YO.rol === 'admin' || YO.rol === 'comercial', PS = esPS(YO), c, x;
    var ctops = function () { if (!CTok && !PS) E('Sin permiso para el presupuesto.', 403); };
    var soloPS = function () { if (!PS) E('Solo el equipo de Presupuesto (almacén) puede hacer esto.', 403); };
    var bmOk = function () { var u = X.U.find(function (k) { return k.id === YO.id; }) || YO; if (YO.rol !== 'admin' && areasDe(u).indexOf('bm') < 0) E('Solo Biomédica puede ver y actualizar el inventario biomédico.', 403); };
    switch (a) {
      case 'pp_catalogo': ctops(); var exB = bodEx(); return { items: clone(PPI).map(function (i) { i.stock = i.inv_bio ? i.inv_disp : (i.bodega_id ? (exB[i.bodega_id] || { stock: 0 }).stock : null); if (i.inv_bio) i.inv_estado = bioEstado(i); return i; }).sort(function (a2, b2) { return (ORD_CAT[a2.categoria] - ORD_CAT[b2.categoria]) || a2.orden - b2.orden; }), categorias: PPCAT, grupos: PPGR, puede_editar: PS };
      case 'bio_inventario':
        bmOk(); var hoyB = dia(0);
        return { equipos: clone(PPI.filter(function (i) { return i.inv_bio; })).map(function (i) {
          i.inv_estado = bioEstado(i); var cs = {};
          PPL.forEach(function (l) { if (l.item_id !== i.id) return; var k = CT.find(function (x) { return x.id === l.contrato_id; }); if (!k || (k.estado !== 'Cotización' && k.estado !== 'Contratado') || k.fecha_fin < hoyB) return; (cs[k.id] = cs[k.id] || { id: k.id, codigo: k.codigo, cliente: k.cliente, curso: k.curso, fecha_inicio: k.fecha_inicio, fecha_fin: k.fecha_fin, estado: k.estado, cantidad: 0 }).cantidad += +l.cantidad; });
          i.cursos = Object.keys(cs).map(function (k) { return cs[k]; }).sort(function (a2, b2) { return a2.fecha_inicio < b2.fecha_inicio ? -1 : 1; }); return i; }),
          corte: BIO_CORTE, fuente: 'Informe Oficial de Inventario Biomédico CLEMI', puede_editar: true, hoy: hoyB,
          bitacora: clone(X.BIT.filter(function (b) { return b.entidad === 'pp_item' && (/biomédic/.test(b.accion)); }).reverse()) };
      case 'bio_guardar':
        bmOk(); var nb = function (k) { var z = String(v[k] == null ? '' : v[k]).replace(/\D/g, ''); return z === '' ? 0 : Math.min(100000, +z); };
        var db2 = { inv_total: nb('total'), inv_disp: nb('disponibles'), inv_mant: nb('mantenimiento'), inv_baja: nb('bajas'), inv_obs: t(v.obs, 500) };
        if (db2.inv_disp + db2.inv_mant > db2.inv_total && db2.inv_total > 0) E('Disponibles más en mantenimiento no puede superar el total.');
        if (t(v.corte)) BIO_CORTE = t(v.corte, 60);
        if (+v.id) { var ob = PPI.find(function (i) { return i.id === +v.id && i.inv_bio; }); if (!ob) E('El equipo no existe.'); var cam = []; [['inv_total', 'Total'], ['inv_disp', 'Disponibles'], ['inv_mant', 'Mantenimiento'], ['inv_baja', 'Bajas']].forEach(function (k) { if (+ob[k[0]] !== db2[k[0]]) cam.push(k[1] + ': ' + ob[k[0]] + ' → ' + db2[k[0]]); }); Object.assign(ob, db2); X.reg(uid, 'pp_item', ob.id, null, 'Actualizó el inventario biomédico: ' + ob.nombre, cam.join(' · ')); return { id: ob.id }; }
        if (!t(v.nombre)) E('Escriba el nombre del equipo.');
        var idb = PPI.reduce(function (m, i) { return Math.max(m, i.id); }, 0) + 1;
        PPI.push(Object.assign({ id: idb, codigo: 'PP-' + ('00' + idb).slice(-3), categoria: 'Equipos', nombre: t(v.nombre, 160), descripcion: '', unidad: 'unidad por día', precio: null, grupo: 'Bienes y servicios', activo: 1, visible_cliente: 1, area: 'Biomédica', orden: idb, origen: 'Inventario biomédico', inv_bio: 1 }, db2));
        X.reg(uid, 'pp_item', idb, null, 'Agregó al inventario biomédico: ' + t(v.nombre, 160), db2.inv_disp + ' disponibles de ' + db2.inv_total); return { id: idb };
      case 'pp_item_guardar':
        soloPS(); if (!t(v.nombre)) E('Escriba el nombre del elemento.');
        var d = { codigo: t(v.codigo, 30), categoria: PPCAT.indexOf(v.categoria) >= 0 ? v.categoria : 'Otros', nombre: t(v.nombre, 160), descripcion: t(v.descripcion, 400), unidad: t(v.unidad, 40) || 'unidad', precio: precioIn(v.precio), grupo: PPGR.indexOf(v.grupo) >= 0 ? v.grupo : 'Bienes y servicios', activo: v.activo ? 1 : 0, visible_cliente: v.visible_cliente == null || v.visible_cliente ? 1 : 0 };
        if (+v.id) { Object.assign(PPI.find(function (i) { return i.id === +v.id; }), d); X.reg(uid, 'pp_item', +v.id, null, 'Actualizó el catálogo de presupuesto: ' + d.nombre, d.precio == null ? 'por cotizar' : pesosD(d.precio)); }
        else { d.id = PPI.length + 1; d.orden = d.id; d.origen = 'Plataforma'; if (!d.codigo) d.codigo = 'PP-' + ('00' + d.id).slice(-3); PPI.push(d); X.reg(uid, 'pp_item', d.id, null, 'Agregó al catálogo de presupuesto: ' + d.nombre, d.categoria); }
        return {};
      case 'pp_importar':
        soloPS(); var n = { nuevos: 0, actualizados: 0, omitidos: 0, desactivados: 0 }, vistos = [];
        (v.filas || []).forEach(function (f) {
          var nom = t(f.nombre, 160); if (!nom) { n.omitidos++; return; }
          var cat = PPCAT.find(function (k) { return k.toLowerCase() === String(f.categoria || '').trim().toLowerCase(); }) || PPCAT.find(function (k) { var s2 = String(f.categoria || '').toLowerCase(); return s2 && (k.toLowerCase().indexOf(s2) >= 0 || s2.indexOf(k.toLowerCase()) >= 0); }) || 'Otros';
          var pr = typeof f.precio === 'number' ? Math.round(f.precio) : precioIn(String(f.precio == null ? '' : f.precio).split(',')[0]);
          var o = t(f.codigo) ? PPI.find(function (i) { return i.codigo === t(f.codigo); }) : PPI.find(function (i) { return i.nombre.toLowerCase() === nom.toLowerCase() && i.categoria === cat; });
          var dd = { categoria: cat, nombre: nom, descripcion: t(f.descripcion, 400), unidad: t(f.unidad, 40) || 'unidad', precio: pr, grupo: cat === 'Alimentación' ? 'Alimentación' : 'Bienes y servicios', activo: 1, origen: 'Excel de almacén' };
          if (o) { Object.assign(o, dd); vistos.push(o.id); n.actualizados++; } else { dd.id = PPI.length + 1; dd.orden = dd.id; dd.codigo = t(f.codigo, 30); PPI.push(dd); vistos.push(dd.id); n.nuevos++; }
        });
        if (v.desactivar_resto) PPI.forEach(function (i) { if (i.activo && vistos.indexOf(i.id) < 0) { i.activo = 0; n.desactivados++; } });
        X.reg(uid, 'pp_item', null, null, 'Cargó el catálogo de presupuesto desde Excel', n.nuevos + ' nuevos · ' + n.actualizados + ' actualizados'); return n;
      case 'ppto_bandeja':
        soloPS(); return { presupuestos: CT.filter(function (k) { return ['Cancelado', 'Finalizado'].indexOf(k.estado) < 0 && (k.ppto_estado !== 'sin_presupuesto' || k.estado === 'Solicitud'); }).sort(function (p1, p2) { return p1.fecha_inicio > p2.fecha_inicio ? 1 : -1; }).map(function (k) {
          var L = ppLineas(k.id), T = ppTot(k, L), E2 = PPE.filter(function (e) { return e.contrato_id === k.id; });
          return { id: k.id, codigo: k.codigo, cliente: k.cliente, curso: k.curso, estado: k.estado, ppto_estado: k.ppto_estado, fecha_inicio: k.fecha_inicio, fecha_fin: k.fecha_fin, sala_nombre: salaN(k.sala_id), participantes: k.participantes, estaciones: k.estaciones,
            lineas: L.length, sin_precio: T.sin_precio, total: T.total, especiales: E2.length, especiales_pend: E2.filter(function (e) { return e.estado === 'Pendiente' || e.estado === 'En consulta'; }).length };
        }), estados: PPEST };
      case 'ppto':
        ctops(); c = ct(q.id); var P = ppCompleto(c), o2 = vista(c, CTok); delete o2.doc_datos;
        if (PS) { var exP = bodEx(); P.lineas.forEach(function (l) { var it = l.item_id ? PPI.find(function (i) { return i.id === l.item_id; }) : null; if (it && it.bodega_id) l.bodega = (exP[it.bodega_id] || { stock: 0 }).stock; }); }
        var out = { contrato: o2, ppto: P, estados: PPEST, especial_estados: ESPEST, categorias: PPCAT, grupos: PPGR, es_ps: PS, es_ct: CTok, bitacora: clone(X.BIT.filter(function (b) { return b.entidad === 'ppto' && b.entidad_id === c.id; }).reverse()) };
        if (CTok) { var dd2 = docDatos(c); out.doc = { datos: dd2, faltan: docFaltan(c, dd2, P.totales), clemi: clone(CLEMI_D), zip: true }; }
        return out;
      case 'ppto_linea_guardar':
        ctops(); c = ct(v.contrato_id); ppAbierto(c);
        var cant = parseFloat(String(v.cantidad).replace(',', '.')); if (!(cant > 0)) E('Revise la cantidad.'); var dias = Math.max(1, Math.min(60, +v.dias || 1));
        if (+v.id) {
          x = PPL.find(function (l) { return l.id === +v.id; }); var antes = clone(x); if (!PS && x.item_id && cant > +x.cantidad) bioValidar(x.item_id, cant, c, x.id);
          x.cantidad = cant; x.dias = dias; x.nota = t(v.nota, 500); if (!x.item_id && t(v.descripcion)) x.descripcion = t(v.descripcion, 200); if (t(v.unidad) && !x.item_id) x.unidad = t(v.unidad, 40);
          if (PS) { x.precio = precioIn(v.precio); if (PPGR.indexOf(v.grupo) >= 0) x.grupo = v.grupo; }
          regP(uid, c.id, 'Modificó el presupuesto de ' + c.codigo + ': ' + x.descripcion, ((antes.cantidad !== cant || antes.dias !== dias ? 'Cantidad: ' + linTxt(antes) + ' → ' + linTxt(x) : '') + (PS && antes.precio !== x.precio ? '\nPrecio unitario: ' + (antes.precio == null ? 'sin precio' : pesosD(antes.precio)) + ' → ' + (x.precio == null ? 'sin precio' : pesosD(x.precio)) : '')).replace(/^\n/, ''));
        } else if (+v.item_id) {
          var it = PPI.find(function (i) { return i.id === +v.item_id && i.activo; }); if (!it) E('Ese elemento ya no está en el catálogo.'); if (!PS) bioValidar(it.id, cant, c, 0);
          if (PPL.some(function (l) { return l.contrato_id === c.id && l.item_id === it.id && l.nota === t(v.nota, 500); })) E('«' + it.nombre + '» ya está en el presupuesto. Modifique la cantidad de esa línea.');
          PPL.push({ id: ++psq.l, contrato_id: c.id, item_id: it.id, especial_id: null, categoria: it.categoria, descripcion: it.nombre, unidad: it.unidad, cantidad: cant, dias: dias, precio: it.precio, grupo: it.grupo, nota: t(v.nota, 500), origen: 'clemi', autor_nombre: YO.nombre, creado_en: ahora() });
          if (c.ppto_estado === 'sin_presupuesto') c.ppto_estado = 'seleccion'; regP(uid, c.id, 'Agregó al presupuesto de ' + c.codigo, it.nombre + ' × ' + cant + (dias > 1 ? ' × ' + dias + ' días' : ''));
        } else {
          if (!PS) E('Para algo que no está en el catálogo, registre una solicitud especial.'); if (!t(v.descripcion)) E('Escriba la descripción.');
          PPL.push({ id: ++psq.l, contrato_id: c.id, item_id: null, especial_id: null, categoria: PPCAT.indexOf(v.categoria) >= 0 ? v.categoria : 'Otros', descripcion: t(v.descripcion, 200), unidad: t(v.unidad, 40) || 'unidad', cantidad: cant, dias: dias, precio: precioIn(v.precio), grupo: PPGR.indexOf(v.grupo) >= 0 ? v.grupo : 'Bienes y servicios', nota: t(v.nota, 500), origen: 'clemi', autor_nombre: YO.nombre, creado_en: ahora() });
          regP(uid, c.id, 'Agregó al presupuesto de ' + c.codigo, t(v.descripcion));
        }
        return {};
      case 'ppto_linea_quitar':
        ctops(); x = PPL.find(function (l) { return l.id === +v.id; }); if (!x) E('La línea no existe.'); c = ct(x.contrato_id); ppAbierto(c);
        if (x.especial_id) E('Esta línea viene de una solicitud especial aprobada. Cambie la respuesta de la solicitud para quitarla.');
        PPL.splice(PPL.indexOf(x), 1); regP(uid, c.id, 'Quitó del presupuesto de ' + c.codigo, linTxt(x)); return {};
      case 'ppto_especial_guardar':
        ctops(); c = ct(v.contrato_id); ppAbierto(c); if (t(v.texto).length < 4) E('Describa el equipo, insumo o servicio que se necesita.');
        PPE.push({ id: ++psq.e, contrato_id: c.id, texto: t(v.texto, 1500), cantidad: t(v.cantidad, 60), estado: 'Pendiente', respuesta: '', autor_nombre: YO.nombre, origen: 'clemi', creado_en: ahora() });
        if (c.ppto_estado === 'sin_presupuesto') c.ppto_estado = 'seleccion'; regP(uid, c.id, 'Registró una solicitud especial en ' + c.codigo, t(v.texto)); return {};
      case 'ppto_especial_responder':
        soloPS(); x = PPE.find(function (e) { return e.id === +v.id; }); if (!x) E('La solicitud no existe.'); c = ct(x.contrato_id); ppAbierto(c);
        var est = ESPEST.indexOf(v.estado) >= 0 ? v.estado : 'Pendiente', rs = t(v.respuesta, 1500);
        if ((est === 'No es posible' || est === 'En consulta') && !rs) E(est === 'No es posible' ? 'Explique al cliente por qué no es posible.' : 'Escriba qué se está consultando o qué información falta.');
        var li = PPL.find(function (l) { return l.especial_id === x.id; });
        if (est === 'Aprobada') {
          var dl = { categoria: PPCAT.indexOf(v.categoria) >= 0 ? v.categoria : 'Otros', descripcion: t(v.descripcion, 200) || x.texto.slice(0, 200), unidad: t(v.unidad, 40) || 'unidad', cantidad: parseFloat(v.cantidad) || 1, dias: Math.max(1, +v.dias || 1), precio: precioIn(v.precio), grupo: PPGR.indexOf(v.grupo) >= 0 ? v.grupo : 'Bienes y servicios' };
          if (li) Object.assign(li, dl); else PPL.push(Object.assign({ id: ++psq.l, contrato_id: c.id, item_id: null, especial_id: x.id, nota: 'Solicitud especial', origen: 'especial', autor_nombre: YO.nombre, creado_en: ahora() }, dl));
        } else if (li) PPL.splice(PPL.indexOf(li), 1);
        x.estado = est; x.respuesta = rs; x.respondido_por = YO.nombre; x.respondido_en = ahora();
        regP(uid, c.id, 'Respondió una solicitud especial de ' + c.codigo + ': ' + est.toLowerCase(), x.texto + (rs ? '\nRespuesta: ' + rs : '')); return {};
      case 'ppto_especial_quitar':
        ctops(); x = PPE.find(function (e) { return e.id === +v.id; }); if (!x) E('La solicitud no existe.'); c = ct(x.contrato_id); ppAbierto(c); if (x.estado !== 'Pendiente') E('Solo se puede quitar una solicitud que aún no ha sido respondida.');
        PPE.splice(PPE.indexOf(x), 1); regP(uid, c.id, 'Quitó una solicitud especial de ' + c.codigo, x.texto); return {};
      case 'ppto_condiciones':
        soloPS(); c = ct(v.contrato_id); ppAbierto(c);
        c.ppto_admin_pct = Math.max(0, Math.min(100, parseFloat(v.admin_pct) || 0)); c.ppto_iva = Math.max(0, Math.min(100, v.iva === '' ? 19 : parseFloat(v.iva))); c.ppto_anticipo = Math.max(0, Math.min(100, v.anticipo === '' ? 70 : parseFloat(v.anticipo))); c.ppto_nota = t(v.nota, 2000);
        regP(uid, c.id, 'Ajustó las condiciones del presupuesto de ' + c.codigo, 'Administración ' + c.ppto_admin_pct + '% · IVA ' + c.ppto_iva + '% · primer pago ' + c.ppto_anticipo + '%'); return {};
      case 'ppto_solicitar':
        ctops(); c = ct(v.contrato_id); ppAbierto(c);
        if (!PPL.some(function (l) { return l.contrato_id === c.id; }) && !PPE.some(function (e) { return e.contrato_id === c.id; })) E('Agregue al menos un elemento del catálogo o una solicitud especial.');
        if (!progDe(c.id).length) E('Falta el programa o agenda del entrenamiento: es obligatorio. Pídalo al cliente (lo adjunta en su enlace) o adjúntelo en «Documentos» con el tipo «Programa / agenda del entrenamiento».', 409, { falta_programa: true });
        c.ppto_estado = 'solicitado'; regP(uid, c.id, 'Pidió el presupuesto de ' + c.codigo + ' al área de Presupuesto', c.codigo + ' · ' + c.cliente + (t(v.nota) ? '\nNota: ' + t(v.nota) : '')); return {};
      case 'ppto_emitir':
        soloPS(); c = ct(v.contrato_id); ppAbierto(c); var P2 = ppCompleto(c);
        if (!P2.lineas.length) E('El presupuesto no tiene elementos.'); if (P2.totales.sin_precio) E('Hay ' + P2.totales.sin_precio + ' línea(s) sin precio. Asigne el valor unitario antes de emitir.');
        var pe = P2.especiales.filter(function (e) { return e.estado === 'Pendiente' || e.estado === 'En consulta'; }); if (pe.length) E('Responda primero las ' + pe.length + ' solicitud(es) especial(es) pendientes o en consulta.');
        var era = c.estado, ver = ppEmitir(c, YO.nombre); regP(uid, c.id, 'Emitió el presupuesto de ' + c.codigo + ' (versión ' + ver + ')', 'Total ' + pesosD(c.valor) + ' IVA incluido');
        if (era === 'Solicitud') X.reg(uid, 'contrato', c.id, null, 'Cambió el estado del contrato ' + c.codigo, 'Solicitud → Cotización\nPresupuesto emitido (versión ' + ver + ')'); return { version: ver };
      case 'ppto_respuesta':
        if (!CTok) E('Solo Operaciones registra la respuesta del cliente.', 403); c = ct(v.contrato_id); if (c.ppto_estado !== 'emitido') E('No hay un presupuesto emitido esperando respuesta.', 409);
        var r = v.respuesta === 'aceptado' ? 'aceptado' : 'ajustes'; if (r === 'ajustes' && t(v.texto).length < 4) E('Escriba qué ajustes pidió el cliente.');
        var u2 = PPV.filter(function (k) { return k.contrato_id === c.id; }).pop(); Object.assign(u2, { respuesta: r, respuesta_texto: t(v.texto, 1500), respuesta_por: YO.nombre + ' (Operaciones)', respuesta_en: ahora() });
        c.ppto_estado = r; c.ppto_ajustes = r === 'ajustes' ? t(v.texto, 1500) : ''; regP(uid, c.id, r === 'aceptado' ? 'Registró que el cliente aceptó el presupuesto de ' + c.codigo : 'Registró ajustes pedidos por el cliente al presupuesto de ' + c.codigo, t(v.texto)); return {};
      case 'ppto_reabrir':
        ctops(); c = ct(v.contrato_id); if (['emitido', 'aceptado'].indexOf(c.ppto_estado) < 0) E('El presupuesto ya está abierto.'); if (t(v.motivo).length < 4) E('Escriba el motivo para reabrir el presupuesto.');
        c.ppto_estado = 'solicitado'; regP(uid, c.id, 'Reabrió el presupuesto de ' + c.codigo, t(v.motivo)); return {};
      case 'contrato_doc_datos':
        if (!CTok) E('Solo Operaciones puede editar los datos del contrato.', 403); c = ct(v.contrato_id);
        if (t(v.correo_factura) && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t(v.correo_factura))) E('El correo de facturación no es válido.');
        c.doc_datos = {}; Object.keys(v).forEach(function (k) { if (k !== 'contrato_id') c.doc_datos[k] = t(v[k], 1500); });
        X.reg(uid, 'contrato', c.id, null, 'Actualizó los datos para el documento del contrato ' + c.codigo, ''); return {};
      case 'clemi_datos_guardar':
        if (YO.rol !== 'admin') E('Solo la administradora puede cambiar los datos de CLEMI.', 403); Object.keys(CLEMI_D).forEach(function (k) { if (v[k] != null && t(v[k])) CLEMI_D[k] = t(v[k], 300); }); return {};
    }
  }
  // En la vista previa el Word no se genera en el navegador: se descarga un contrato de ejemplo hecho por la plataforma.
  window.CLEMI_DEMO.contratoDocx = function (c, guardar) {
    var YO = X.yo();
    X.reg(YO.id, 'contrato', c.id, null, 'Generó el documento del contrato ' + c.codigo, 'Vista previa: se descargó el contrato de ejemplo');
    return fetch('assets/contrato-ejemplo.pdf').then(function (r) { return r.blob(); }).then(function (b) {
      var a = document.createElement('a');
      if (window.claude && window.claude.use) return window.claude.use('downloads').then(function (dl) { if (dl) return dl.save({ filename: 'Contrato-ejemplo-CLEMI.pdf', data: b }); });
      a.href = URL.createObjectURL(b); a.download = 'Contrato-ejemplo-CLEMI.pdf'; document.body.appendChild(a); a.click(); a.remove();
    }).then(function () {
      var t2 = document.createElement('div'); t2.className = 'toast'; t2.innerHTML = 'En la vista previa se descarga un <b>contrato de ejemplo en PDF</b>; en la plataforma se descarga en Word, con los datos y el presupuesto de este contrato.';
      var h = document.getElementById('toasts'); if (h) { h.appendChild(t2); setTimeout(function () { t2.remove(); }, 6000); }
    }, function () {});
  };

  (function sembrarPP() {
    var c3 = CT[2], c4 = CT[3], qn = 'Osvaldo Naar';
    function bp(cid, quien, acc, det, min) { X.BIT.push({ id: ++X.seq.bit, momento: hace(min), usuario_id: null, usuario_nombre: quien, entidad: 'ppto', entidad_id: cid, evento_id: null, accion: acc, detalle: det || '' }); }
    // Contrato de cadera: presupuesto aceptado (listo para el contrato en Word)
    Object.assign(c3, { nit: '900.555.444-1', contacto_correo: 'andrea@ejemplo.com', ppto_admin_pct: 25, ppto_nota: 'Valores válidos por 30 días.',
      doc_datos: { rep_legal: 'Andrea Gómez (ejemplo)', rep_doc: '1.000.000.000', direccion: 'Calle de ejemplo # 1-23, Bogotá', correo_factura: 'facturacion@ejemplo.com', asistentes: '22 (16 participantes, 2 directores, 4 instructores)', exclusiones: 'hospedaje y transporte aéreo' } });
    ppLinea(c3.id, 'Sala de entrenamiento', 1, 1, 2400000, 'cliente', '', 'Andrea Gómez'); ppLinea(c3.id, 'Estación de trabajo', 4, 1, 850000, 'cliente', '', 'Andrea Gómez');
    ppLinea(c3.id, 'Instrumental básico de disección', 4, 1, 300000, 'cliente', '', 'Andrea Gómez'); ppLinea(c3.id, 'Insumos quirúrgicos desechables', 4, 1, 180000, 'cliente', '', 'Andrea Gómez');
    ppLinea(c3.id, 'Segmento anatómico', 4, 1, 1500000, 'cliente', 'Cadera', 'Andrea Gómez'); ppLinea(c3.id, 'Almuerzo', 22, 1, 38000, 'cliente', '', 'Andrea Gómez'); ppLinea(c3.id, 'Refrigerio', 44, 1, 15000, 'cliente', '', 'Andrea Gómez');
    ppLinea(c3.id, 'Paquete Profesional · curso + evidencia institucional', 1, 1, 650000, 'clemi');
    var e1 = ppEsp(c3.id, 'Sierra oscilante para osteotomía', '4 (una por estación)', 'Aprobada', 'La conseguimos con un proveedor aliado; se entrega instalada el día anterior.', 'Andrea Gómez');
    ppEspLinea(c3.id, e1, 'Sierra oscilante (alquiler)', 'Equipos', 'unidad por día', 4, 1, 420000);
    ppEsp(c3.id, 'Navegador quirúrgico', '1', 'No es posible', 'No contamos con navegador ni proveedor disponible en esas fechas; puede ingresarlo la industria.', 'Andrea Gómez');
    ppEmitir(c3, qn, hace(300)); var v = PPV[PPV.length - 1]; Object.assign(v, { respuesta: 'aceptado', respuesta_por: 'Andrea Gómez (Distribuidora médica de ejemplo)', respuesta_en: hace(200) }); c3.ppto_estado = 'aceptado';
    bp(c3.id, 'Cliente · Andrea Gómez (Distribuidora médica de ejemplo)', 'Envió su selección para el presupuesto', c3.curso, 700);
    bp(c3.id, qn, 'Respondió una solicitud especial de ' + c3.codigo + ': aprobada', 'Sierra oscilante para osteotomía', 400);
    bp(c3.id, qn, 'Emitió el presupuesto de ' + c3.codigo + ' (versión 1)', 'Total ' + pesosD(c3.valor) + ' IVA incluido', 300);
    bp(c3.id, 'Cliente · Andrea Gómez (Distribuidora médica de ejemplo)', 'Aceptó el presupuesto (versión 1)', '', 200);
    // Cotización emitida, esperando respuesta del cliente
    Object.assign(c4, { ppto_admin_pct: 25 });
    ppLinea(c4.id, 'Sala de entrenamiento', 1, 2, 2400000); ppLinea(c4.id, 'Estación de trabajo', 8, 2, 850000); ppLinea(c4.id, 'Torre de video', 8, 2, 600000); ppLinea(c4.id, 'Cuerpo completo', 4, 1, 6500000);
    ppLinea(c4.id, 'Almuerzo', 34, 2, 38000); ppLinea(c4.id, 'Estación de café', 1, 2, 250000);
    ppEmitir(c4, qn, hace(150)); bp(c4.id, qn, 'Emitió el presupuesto de ' + c4.codigo + ' (versión 1)', 'Total ' + pesosD(c4.valor) + ' IVA incluido', 150);
    // Solicitudes nuevas
    var c5 = nuevoCT({ estado: 'Solicitud', cliente: 'Asociación de ejemplo de cirugía plástica', contacto_nombre: 'Dr. Mateo Cruz (ejemplo)', contacto_correo: 'mateo@ejemplo.com', curso: 'Taller de colgajos (ejemplo)', especialidad: 'Cirugía plástica',
      sala_id: 4, fecha_inicio: dia(60), fecha_fin: dia(61), participantes: 16, estaciones: 4, fecha_contratacion: dia(-1), valor: 0, acceso_token: 'demo-solicitud-2027-acceso-cliente', acceso_pin: '445566', acceso_creado_en: hace(1300), ppto_estado: 'solicitado' });
    ppLinea(c5.id, 'Sala de entrenamiento', 1, 2, null, 'cliente', '', 'Mateo Cruz'); ppLinea(c5.id, 'Estación de trabajo', 4, 2, null, 'cliente', '', 'Mateo Cruz'); ppLinea(c5.id, 'Segmento anatómico', 4, 1, null, 'cliente', 'Cabeza y cuello', 'Mateo Cruz');
    ppLinea(c5.id, 'Instrumental básico de disección', 4, 2, null, 'cliente', '', 'Mateo Cruz'); ppLinea(c5.id, 'Almuerzo', 20, 2, null, 'cliente', '', 'Mateo Cruz');
    ppEsp(c5.id, 'Microscopio quirúrgico para microcirugía', '2', 'Pendiente', '', 'Mateo Cruz'); ppEsp(c5.id, '¿Tienen Doppler portátil para marcar perforantes?', '1', 'Pendiente', '', 'Mateo Cruz');
    bp(c5.id, 'Cliente · Mateo Cruz (Asociación de ejemplo de cirugía plástica)', 'Envió su selección para el presupuesto', c5.curso, 60);
    var c6 = nuevoCT({ estado: 'Solicitud', cliente: 'Fundación de ejemplo para la educación médica', contacto_nombre: 'Lina Pardo (ejemplo)', curso: 'Curso de vía aérea difícil (ejemplo)', especialidad: 'Anestesiología',
      sala_id: 6, fecha_inicio: dia(75), fecha_fin: dia(75), participantes: 18, estaciones: 6, fecha_contratacion: dia(0), valor: 0, acceso_token: 'demo-seleccion-2027-acceso-cliente', acceso_pin: '778899', acceso_creado_en: hace(30), ppto_estado: 'seleccion' });
    ppLinea(c6.id, 'Sala de entrenamiento', 1, 1, null, 'cliente', '', 'Lina Pardo');
  })();


  // ---------------------------------------------------------------- Bodega de almacén · vista previa (sin observaciones ni soportes)
  var BODC = ['Insumos médicos', 'Cafetería', 'Servicios generales', 'Dotación', 'Papelería', 'Otros'];
  var BP = ((window.DEMO_BOD || {}).productos || []).map(function (x, i) { return Object.assign({ id: i + 1, activo: 1 }, x); });
  var BM = ((window.DEMO_BOD || {}).movimientos || []).map(function (m, i) { var pr = BP.find(function (x) { return x.codigo === m.codigo; }); return { id: i + 1, fecha: m.fecha, tipo: m.tipo, producto_id: pr ? pr.id : 0, cantidad: m.cantidad, ubicacion: m.ubicacion, responsable: m.responsable, documento: '', obs: '', contrato_id: null, origen: 'Excel de bodega', creado_por: null, creado_en: hace(2000) }; }).filter(function (m) { return m.producto_id; });
  function bodEx() { var r = {}; BM.forEach(function (m) { var o = r[m.producto_id] = r[m.producto_id] || { entradas: 0, salidas: 0, stock: 0 }; if (m.tipo === 'Entrada') o.entradas += m.cantidad; else o.salidas += m.cantidad; o.stock = o.entradas - o.salidas; }); return r; }
  var INTERNOS = ['VICK VAPORUB', 'AXE ANTITRANSPIRANTE', 'SAL SACO X 25 KG', 'SAL X 1 KG', 'GUARDIAN 3L', 'VINIPEL GRANDE', 'VINIPEL PEQUEÑO', 'HILO PARA CIERRE CADAVERES', 'ALCOHOL ANTISÉPTICO 20 LITROS'];
  function frase(t) { t = String(t).replace(/\s+/g, ' ').trim().toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); }
  BP.filter(function (b) { return b.categoria === 'Insumos médicos'; }).forEach(function (b) { PPI.push({ id: PPI.length + 1, codigo: b.codigo, categoria: 'Insumos', nombre: frase(b.nombre), descripcion: '', unidad: b.unidad.toLowerCase(), precio: null, grupo: 'Bienes y servicios', activo: 1, orden: PPI.length + 1, origen: 'Bodega de almacén', visible_cliente: INTERNOS.indexOf(b.nombre.replace(/\s+/g, ' ').trim().toUpperCase()) >= 0 ? 0 : 1, bodega_id: b.id }); });
  PPI.forEach(function (i) { if (i.visible_cliente == null) i.visible_cliente = 1; });
  function manejarBod(a, q, v, YO) {
    var PS = esPS(YO); if (!PS) E('Solo el equipo de Presupuesto (almacén) puede hacer esto.', 403);
    var ex = bodEx(), p;
    if (a === 'bod_inventario') {
      var ub = [], re = []; BM.forEach(function (m) { if (m.ubicacion && ub.indexOf(m.ubicacion) < 0) ub.push(m.ubicacion); if (m.responsable && re.indexOf(m.responsable) < 0) re.push(m.responsable); }); ub.sort(); re.sort();
      return { productos: BP.map(function (b) { var e = ex[b.id] || { entradas: 0, salidas: 0, stock: 0 }; return Object.assign({}, b, e, { bajo: e.stock <= b.stock_min && b.stock_min > 0 ? 1 : 0 }); }),
        movimientos: BM.slice().sort(function (x, y) { return x.fecha === y.fecha ? y.id - x.id : (x.fecha < y.fecha ? 1 : -1); }).map(function (m) { var b = BP.find(function (k) { return k.id === m.producto_id; }), c = m.contrato_id ? CT.find(function (k) { return k.id === m.contrato_id; }) : null; return Object.assign({}, m, { codigo: b.codigo, producto: b.nombre, unidad: b.unidad, contrato_codigo: c ? c.codigo : null }); }),
        categorias: BODC, ubicaciones: ub, responsables: re, contratos: CT.filter(function (c) { return c.estado !== 'Cancelado'; }).map(function (c) { return { id: c.id, codigo: c.codigo, cliente: c.cliente, curso: c.curso, fecha_inicio: c.fecha_inicio, fecha_fin: c.fecha_fin }; }), hoy: dia(0) };
    }
    if (a === 'bod_producto_guardar') {
      if (!t(v.nombre)) E('Escriba el nombre del producto.');
      var cod = t(v.codigo, 30).toUpperCase(); if (!cod) cod = 'BCL-' + ('00' + (BP.reduce(function (mx, b) { return Math.max(mx, +b.codigo.slice(4) || 0); }, 0) + 1)).slice(-3);
      if (BP.some(function (b) { return b.codigo === cod && b.id !== +v.id; })) E('Ya existe un producto con el código ' + cod + '.');
      var d = { codigo: cod, nombre: t(v.nombre, 200), categoria: BODC.indexOf(v.categoria) >= 0 ? v.categoria : 'Otros', unidad: t(v.unidad, 30) || 'Unidad', stock_min: Math.max(0, +v.stock_min || 0), obs: t(v.obs, 500), activo: v.activo ? 1 : 0 };
      if (+v.id) Object.assign(BP.find(function (b) { return b.id === +v.id; }), d); else { d.id = BP.length + 1; BP.push(d); if (v.al_catalogo) PPI.push({ id: PPI.length + 1, codigo: cod, categoria: 'Insumos', nombre: frase(d.nombre), descripcion: '', unidad: d.unidad.toLowerCase(), precio: null, grupo: 'Bienes y servicios', activo: 1, orden: PPI.length + 1, origen: 'Bodega de almacén', visible_cliente: 1, bodega_id: d.id }); }
      X.reg(YO.id, 'pp_item', null, null, (+v.id ? 'Actualizó el producto de bodega ' : 'Agregó a la bodega el producto ') + cod + ' · ' + d.nombre, ''); return { id: +v.id || d.id, codigo: cod };
    }
    if (a === 'bod_movimiento_guardar') {
      p = BP.find(function (b) { return b.id === +v.producto_id; }); if (!p) E('Seleccione el producto.');
      var tipo = v.tipo === 'Entrada' ? 'Entrada' : 'Salida', cant = parseFloat(String(v.cantidad).replace(',', '.')); if (!(cant > 0)) E('Escriba la cantidad.');
      var st = (ex[p.id] || { stock: 0 }).stock;
      if (tipo === 'Salida' && cant > st && !v.forzar) E('En bodega hay ' + st + ' (' + p.unidad.toLowerCase() + ') de «' + p.nombre + '». La salida dejaría la existencia en negativo.', 409, { sin_stock: true });
      if (tipo === 'Salida' && (!t(v.ubicacion) || !t(v.responsable))) E('Indique a dónde sale y quién lo recibe.');
      BM.push({ id: BM.length + 1, fecha: /^\d{4}-\d{2}-\d{2}$/.test(v.fecha) ? v.fecha : dia(0), tipo: tipo, producto_id: p.id, cantidad: cant, ubicacion: t(v.ubicacion, 80) || (tipo === 'Entrada' ? 'Bodega' : ''), responsable: t(v.responsable, 120) || YO.nombre, documento: t(v.documento, 120), obs: t(v.obs, 500), contrato_id: +v.contrato_id || null, origen: 'Plataforma', creado_por: YO.id, creado_en: ahora() });
      X.reg(YO.id, 'pp_item', null, null, (tipo === 'Entrada' ? 'Entrada a bodega: ' : 'Salida de bodega: ') + p.codigo + ' · ' + p.nombre, cant + ' · ' + (t(v.ubicacion) || 'Bodega')); return {};
    }
    if (a === 'bod_movimiento_borrar') { var m = BM.find(function (k) { return k.id === +v.id; }); if (!m) E('El movimiento no existe.'); if (m.origen !== 'Plataforma') E('Solo puede anular movimientos registrados en la plataforma.'); BM.splice(BM.indexOf(m), 1); return {}; }
  }

  // ---------------------------------------------------------------- api.php (acciones nuevas)
  var NUEVAS = ['contratos', 'contrato', 'contrato_guardar', 'contrato_estado', 'contrato_borrar', 'acceso_generar', 'acceso_anular', 'planes', 'plan', 'plan_guardar', 'plan_decidir', 'plan_nota', 'plan_revision_ins',
    'contrato_programar', 'contrato_vincular', 'contrato_archivo_borrar', 'av_catalogo', 'av_item_guardar', 'av_equipos', 'av_equipo_guardar', 'av_pedidos', 'contrato_av_guardar', 'contrato_av_quitar', 'av_estado'];
  function manejar(a, q, v, YO) {
    var uid = YO.id, rol = YO.rol, CTok = rol === 'admin' || rol === 'comercial', AVok = rol === 'admin' || rol === 'audiovisual';
    var soloCT = function () { if (!CTok) E('Solo el equipo de Operaciones (contratación) puede hacer esto.', 403); };
    var soloAV = function () { if (!AVok) E('Solo el equipo de Audiovisuales puede hacer esto.', 403); };
    var c, i, x;
    switch (a) {
      case 'contratos': soloCT(); vencer(); return { contratos: CT.slice().sort(function (p, q) { return p.fecha_inicio < q.fecha_inicio ? 1 : -1; }).map(function (k) { return vista(k, true); }), hoy: dia(0) };
      case 'contrato': case 'plan':
        if (a === 'contrato') soloCT(); vencer(); c = ct(q.id);
        var o = vista(c, CTok); if (CTok) o.borrador = c.plan_borrador;
        var e = c.evento_id ? X.EV.find(function (k) { return k.id === c.evento_id; }) : null;
        return { contrato: o, versiones: clone(PL.filter(function (p) { return p.contrato_id === c.id; }).reverse()), notas: clone(PN.filter(function (n) { return n.contrato_id === c.id; }).reverse()),
          archivos: clone(ARC.filter(function (f) { return f.contrato_id === c.id; }).reverse()), av: avDe(c.id), evento: e ? clone(e) : null,
          bitacora: clone(X.BIT.filter(function (b) { return ['contrato', 'plan', 'av'].indexOf(b.entidad) >= 0 && b.entidad_id === c.id; }).reverse()), hoy: dia(0) };
      case 'contrato_guardar':
        soloCT();
        if (!t(v.cliente)) E('Escriba el nombre del cliente.'); if (!t(v.curso)) E('Escriba el nombre del curso.');
        if (!v.fecha_inicio || !v.fecha_fin) E('Indique las fechas del curso.'); if (v.fecha_fin < v.fecha_inicio) E('La fecha final no puede ser anterior a la de inicio.');
        if (!+v.sala_id) E('Seleccione la sala.');
        var f = { cliente: t(v.cliente, 200), nit: t(v.nit), contacto_nombre: t(v.contacto_nombre), contacto_cargo: t(v.contacto_cargo), contacto_correo: t(v.contacto_correo), contacto_telefono: t(v.contacto_telefono),
          curso: t(v.curso, 200), especialidad: t(v.especialidad), sala_id: +v.sala_id, fecha_inicio: v.fecha_inicio, fecha_fin: v.fecha_fin, hora_ini: v.hora_ini || '07:00', hora_fin: v.hora_fin || '17:00',
          participantes: +v.participantes || 0, estaciones: +v.estaciones || 0, componentes: +v.componentes || 0, tipo_componente: t(v.tipo_componente), valor: +v.valor || 0, forma_pago: t(v.forma_pago),
          estado_pago: v.estado_pago || 'Pendiente', fecha_contratacion: v.fecha_contratacion || dia(0), observaciones: t(v.observaciones, 4000), responsable_id: +v.responsable_id || null };
        if (!v.forzar) { x = CT.find(function (k) { return k.id !== +v.id && k.sala_id === f.sala_id && ['Solicitud', 'Cotización', 'Contratado'].indexOf(k.estado) >= 0 && k.fecha_inicio <= f.fecha_fin && k.fecha_fin >= f.fecha_inicio; });
          if (x) E('La sala ya está comprometida en esas fechas con ' + x.codigo + ' (' + x.cliente + ' · ' + x.curso + ').', 409, { cruce: true }); }
        if (+v.id) { c = ct(v.id); Object.assign(c, f, { actualizado_por: uid, actualizado_en: ahora() }); X.reg(uid, 'contrato', c.id, null, 'Modificó el contrato ' + c.codigo, 'Datos actualizados (vista previa)'); vencer(); return { id: c.id }; }
        c = nuevoCT(Object.assign(f, { estado: ['Solicitud', 'Cotización'].indexOf(v.estado) >= 0 ? v.estado : 'Contratado', creado_por: uid, creado_en: ahora(), actualizado_por: uid, actualizado_en: ahora() }));
        X.reg(uid, 'contrato', c.id, null, 'Creó el contrato ' + c.codigo, c.cliente + ' · ' + c.curso); X.reg(uid, 'plan', c.id, null, 'Registró un curso contratado', c.cliente + ' · ' + c.curso); return { id: c.id };
      case 'contrato_estado':
        soloCT(); c = ct(v.contrato_id); if (v.estado === 'Cancelado' && !t(v.motivo)) E('Escriba el motivo de la cancelación.');
        X.reg(uid, 'contrato', c.id, null, 'Cambió el estado del contrato ' + c.codigo, c.estado + ' → ' + v.estado); c.estado = v.estado; vencer(); return {};
      case 'contrato_borrar':
        if (rol !== 'admin') E('Solo la administradora puede hacer este cambio.', 403); if (v.confirmar !== 'BORRAR') E('Escriba BORRAR para confirmar.');
        c = ct(v.contrato_id); CT.splice(CT.indexOf(c), 1); X.reg(uid, 'contrato', c.id, null, 'Eliminó el contrato ' + c.codigo, c.cliente); return {};
      case 'acceso_generar':
        soloCT(); c = ct(v.contrato_id); activo(c); if (dia(0) >= c.fecha_inicio) E('El curso ya inició: el acceso del cliente solo puede estar vigente hasta el día anterior al inicio.', 409);
        c.acceso_token = 'demo-' + Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12); c.acceso_pin = String(100000 + Math.floor(Math.random() * 900000)); c.acceso_creado_en = ahora(); c.acceso_anulado_en = null; c.acceso_ultimo = null;
        X.reg(uid, 'contrato', c.id, null, 'Creó el acceso del cliente para ' + c.codigo, c.cliente); X.reg(uid, 'plan', c.id, c.evento_id, 'Habilitó el acceso de ' + c.cliente + ' para planificar la sala', c.curso);
        return { token: c.acceso_token, pin: c.acceso_pin, acceso: acceso(c) };
      case 'acceso_anular':
        soloCT(); c = ct(v.contrato_id); if (!t(v.motivo)) E('Escriba el motivo.'); c.acceso_anulado_en = ahora(); c.acceso_anulado_motivo = 'Anulado por ' + YO.nombre + ': ' + t(v.motivo);
        X.reg(uid, 'contrato', c.id, null, 'Anuló el acceso del cliente de ' + c.codigo, t(v.motivo)); return {};
      case 'planes':
        vencer(); return { planes: CT.filter(function (k) { return k.estado !== 'Cancelado' && (q.todos || k.fecha_fin >= dia(-30)); }).map(function (k) { return vista(k, CTok); }), hoy: dia(0) };
      case 'plan_guardar':
        soloCT(); c = ct(v.contrato_id); activo(c);
        var ver = plan(c.id, limpio(v.items), 'clemi', YO.nombre + ' · CLEMI', uid, t(v.notas)); if (c.plan_estado === 'sin_plan' || c.plan_estado === 'abierto') c.plan_estado = 'enviado'; c.plan_borrador = null;
        nota(c.id, ver, 'Ajuste de CLEMI', t(v.notas), 1, YO.nombre, uid, AREA[rol]); X.reg(uid, 'plan', c.id, c.evento_id, 'Ajustó la planificación de ' + c.cliente + ' (versión ' + ver + ')', t(v.notas)); return { version: ver };
      case 'plan_decidir':
        soloCT(); c = ct(v.contrato_id); activo(c); var ac = acceso(c), u = ultimo(c.id), est = c.plan_estado, nv, tipo, txt = t(v.texto);
        var plazo = function () { if (dia(0) > ac.cambios_hasta) E('El plazo para que el cliente haga cambios venció el ' + ftxt(ac.cambios_hasta) + ' (3 días antes del inicio). Si hace falta un ajuste, hágalo desde CLEMI con «Ajustar planificación».', 409); };
        if (v.decision === 'aprobar') { if (['enviado', 'abierto'].indexOf(est) < 0 || !u) E('No hay una planificación enviada para aprobar.'); nv = 'aprobado'; tipo = 'Planificación aprobada'; }
        else if (v.decision === 'devolver') { if (!txt) E('Escriba qué debe ajustar el cliente.'); plazo(); nv = 'abierto'; tipo = 'Devuelta al cliente para ajuste'; }
        else if (v.decision === 'autorizar') { if (est !== 'cambio_solicitado') E('No hay una solicitud de cambio pendiente.'); plazo(); nv = 'abierto'; tipo = 'Cambio autorizado'; }
        else { if (est !== 'cambio_solicitado') E('No hay una solicitud de cambio pendiente.'); if (!txt) E('Escriba el motivo para no autorizar el cambio.'); nv = c.plan_estado_prev || 'enviado'; tipo = 'Cambio no autorizado'; }
        c.plan_estado_prev = est; c.plan_estado = nv; c.plan_nota = txt; nota(c.id, u ? u.version : null, tipo, txt, 1, YO.nombre, uid, AREA[rol]);
        X.reg(uid, 'plan', c.id, c.evento_id, tipo + ' · ' + c.cliente, txt); return { plan_estado: nv };
      case 'plan_nota':
        if (rol === 'tanatologo') E('Morgue consulta la planificación del cliente, sin registrar observaciones.', 403);
        c = ct(v.contrato_id); if (!t(v.texto)) E('Escriba la observación.'); var vis = CTok && v.visible_cliente; u = ultimo(c.id);
        nota(c.id, u ? u.version : null, vis ? 'Mensaje para el cliente' : 'Observación', t(v.texto), vis, YO.nombre, uid, AREA[rol]); X.reg(uid, 'plan', c.id, c.evento_id, 'Registró una observación sobre la planificación de ' + c.cliente, t(v.texto)); return {};
      case 'plan_revision_ins':
        if (['admin', 'instrumentador'].indexOf(rol) < 0) E('La revisión la registra instrumentación quirúrgica.', 403);
        c = ct(v.contrato_id); u = ultimo(c.id); if (!u) E('El cliente todavía no ha enviado la planificación.');
        var res = v.resultado === 'Requiere ajustes' ? 'Requiere ajustes' : 'Sin ajustes'; if (res === 'Requiere ajustes' && !t(v.texto)) E('Describa los ajustes que se requieren.');
        Object.assign(c, { revision_ins: t(v.texto), revision_ins_resultado: res, revision_ins_por: uid, revision_ins_en: ahora(), revision_ins_version: u.version });
        nota(c.id, u.version, 'Revisión de instrumentación · ' + res, t(v.texto), 0, YO.nombre, uid, 'Instrumentación'); X.reg(uid, 'plan', c.id, c.evento_id, 'Revisó la planificación de ' + c.cliente + ': ' + res.toLowerCase(), t(v.texto)); return {};
      case 'contrato_programar':
        soloCT(); c = ct(v.contrato_id); activo(c); if (c.evento_id) E('El contrato ya está en la agenda de instrumentación.');
        if (!+v.responsable_id) E('Seleccione el instrumentador a cargo.'); if (!+v.tanatologo_id) E('Seleccione el tanatólogo a cargo.');
        var dias = [], d = c.fecha_inicio; while (d <= c.fecha_fin) { dias.push({ fecha: d, hora_ini: c.hora_ini, hora_fin: c.hora_fin, hora_fin_ext: null, justificacion: '' }); d = sumarD(d, 1); }
        u = ultimo(c.id); X.seq.ev++;
        var nev = { id: X.seq.ev, titulo: c.curso, especialidad: c.especialidad, empresa: c.cliente, sala_id: c.sala_id, fecha: c.fecha_inicio, fecha_fin: c.fecha_fin, hora_ini: c.hora_ini, hora_fin: c.hora_fin,
          responsable_id: +v.responsable_id, tanatologo_id: +v.tanatologo_id, apoyo: [], dias: dias, participantes: c.participantes, componentes: c.componentes, descripcion: 'Curso contratado ' + c.codigo,
          estado: 'programado', layout: u ? clone(u.items) : [], creado_por: uid, creado_en: ahora(), actualizado_por: uid, actualizado_en: ahora() };
        X.EV.push(nev); c.evento_id = nev.id;
        X.reg(uid, 'evento', nev.id, nev.id, 'Creó el evento desde Operaciones (contratación)', c.curso + ' · ' + c.cliente + (u ? '\nDistribución inicial: planificación del cliente, versión ' + u.version : '')); return { evento_id: nev.id };
      case 'contrato_vincular':
        soloCT(); c = ct(v.contrato_id); c.evento_id = +v.evento_id || null; X.reg(uid, 'contrato', c.id, null, c.evento_id ? 'Vinculó ' + c.codigo + ' a un entrenamiento' : 'Desvinculó ' + c.codigo + ' de la agenda', ''); return {};
      case 'contrato_archivo_borrar':
        x = ARC.find(function (k) { return k.id === +v.id; }); if (!x) E('El archivo no existe.'); ARC.splice(ARC.indexOf(x), 1); return {};
      case 'av_catalogo':
        return { items: AVI.map(function (k) { var o = clone(k); var L = EQ.filter(function (e) { return e.item_id === k.id; }); o.equipos = L.length; o.equipos_revisar = L.filter(function (e) { return e.situacion !== 'Dado de baja' && e.estado !== 'Funcional'; }).length; if (k.stock != null && q.desde) o.disponible = Math.max(0, k.stock - comprometido(k.id, q.desde, q.hasta, 0)); return o; }), categorias: AVCAT, estados: AVEST };
      case 'av_item_guardar':
        soloAV(); if (!t(v.nombre)) E('Escriba el nombre del elemento.');
        var dd = { categoria: v.categoria, nombre: t(v.nombre, 120), descripcion: t(v.descripcion, 300), unidad: t(v.unidad) || 'unidad', stock: String(v.stock).trim() === '' ? null : Math.max(0, +v.stock), opciones: String(v.opciones || '').split(/\n/).map(function (s) { return s.trim(); }).filter(Boolean), activo: v.activo ? 1 : 0 };
        if (+v.id && EQ.some(function (e) { return e.item_id === +v.id; })) delete dd.stock;
        if (+v.id) Object.assign(AVI.find(function (k) { return k.id === +v.id; }), dd); else AVI.push(Object.assign({ id: AVI.length + 1, orden: AVI.length + 1 }, dd));
        X.reg(uid, 'av_item', +v.id || AVI.length, null, (+v.id ? 'Actualizó' : 'Agregó al') + ' el inventario audiovisual: ' + dd.nombre, ''); return {};
      case 'av_equipos':
        soloAV(); return { equipos: EQ.map(function (e) { var o = clone(e), it = AVI.find(function (k) { return k.id === e.item_id; }); o.item_nombre = it ? it.nombre : null; return o; }).sort(function (p, q2) { return p.codigo < q2.codigo ? -1 : 1; }),
          items: AVI.filter(function (k) { return k.categoria === 'Equipos audiovisuales'; }).map(function (k) { return { id: k.id, nombre: k.nombre }; }), estados: AVEQ_EST, situaciones: AVEQ_SIT };
      case 'av_equipo_guardar':
        soloAV(); if (!t(v.equipo)) E('Escriba el nombre del equipo.');
        var sit = AVEQ_SIT.indexOf(v.situacion) >= 0 ? v.situacion : 'Alta', cod = t(v.codigo, 20).toUpperCase();
        if (!cod) cod = 'AV-' + ('00' + (EQ.reduce(function (m, e) { return /^AV-\d+$/.test(e.codigo) ? Math.max(m, +e.codigo.slice(3)) : m; }, 0) + 1)).slice(-3);
        if (EQ.some(function (e) { return e.codigo === cod && e.id !== +v.id; })) E('Ya existe un equipo con el código ' + cod + '.');
        var de = { codigo: cod, equipo: t(v.equipo, 120), marca: t(v.marca, 80), referencia: t(v.referencia, 80), serial: t(v.serial, 80), estado: AVEQ_EST.indexOf(v.estado) >= 0 ? v.estado : 'Funcional', situacion: sit,
          fecha_baja: sit === 'Dado de baja' ? (/^\d{4}-\d{2}-\d{2}$/.test(v.fecha_baja) ? v.fecha_baja : dia(0)) : '', observacion: t(v.observacion, 500), accesorios: t(v.accesorios, 300), cantidad: Math.max(1, Math.min(999, +v.cantidad || 1)), asignado: t(v.asignado, 80), item_id: +v.item_id || null };
        x = +v.id ? EQ.find(function (e) { return e.id === +v.id; }) : null;
        var antes = x ? x.situacion : '';
        if (x) Object.assign(x, de); else { x = Object.assign({ id: EQ.length + 1, origen: 'Registrado en la plataforma' }, de); EQ.push(x); }
        eqSync();
        X.reg(uid, 'av_equipo', x.id, null, (!antes ? 'Agregó al inventario el equipo ' : sit === 'Dado de baja' && antes !== sit ? 'Dio de baja el equipo ' : 'Actualizó el equipo ') + cod + ' · ' + de.equipo, de.estado + ' · ' + sit + ' · ' + de.cantidad + ' unidad' + (de.cantidad > 1 ? 'es' : ''));
        return { id: x.id, codigo: cod };
      case 'av_pedidos':
        soloAV(); return { pedidos: CT.filter(function (k) { return ['Cotización', 'Contratado'].indexOf(k.estado) >= 0 && (q.todos || k.fecha_fin >= dia(-7)); }).sort(function (p, q2) { return p.fecha_inicio > q2.fecha_inicio ? 1 : -1; }).map(function (k) {
          var o = vista(k, rol === 'admin'); o.av = avDe(k.id); o.archivos = clone(ARC.filter(function (f) { return f.contrato_id === k.id && CATS_AV.indexOf(f.categoria) >= 0; })); return o; }), estados: AVEST, hoy: dia(0) };
      case 'contrato_av_guardar':
        if (!CTok && !AVok) E('Sin permiso.', 403); c = ct(v.contrato_id); activo(c); i = AVI.find(function (k) { return k.id === +v.item_id; }); if (!i) E('Seleccione el elemento.');
        var cant = +v.cantidad; if (!(cant >= 1)) E('Revise la cantidad.');
        if (i.opciones.length && i.opciones.indexOf(v.opcion) < 0) E('Elija una opción para «' + i.nombre + '»: ' + i.opciones.join(' o ') + '.');
        if (i.stock != null && !v.forzar) { var disp = Math.max(0, i.stock - comprometido(i.id, c.fecha_inicio, c.fecha_fin, +v.id || 0)); if (cant > disp) E('En esas fechas ' + (disp ? 'solo quedan ' + disp + ' disponibles' : 'no quedan disponibles') + ' de «' + i.nombre + '» (hay ' + i.stock + ' en inventario; el resto ya está comprometido en esas fechas).', 409, { sin_stock: true, disponible: disp }); }
        if (+v.id) Object.assign(CAV.find(function (k) { return k.id === +v.id; }), { item_id: i.id, cantidad: cant, opcion: i.opciones.length ? v.opcion : '', detalle: t(v.detalle, 1000) });
        else linea(c.id, i.id, cant, i.opciones.length ? v.opcion : '', t(v.detalle, 1000));
        X.reg(uid, 'av', c.id, c.evento_id, (+v.id ? 'Modificó' : 'Agregó') + ' audiovisuales de ' + c.cliente, i.nombre + ' × ' + cant); return {};
      case 'contrato_av_quitar':
        if (!CTok && !AVok) E('Sin permiso.', 403); x = CAV.find(function (k) { return k.id === +v.id; }); CAV.splice(CAV.indexOf(x), 1); return {};
      case 'av_estado':
        soloAV(); x = CAV.find(function (k) { return k.id === +v.id; }); var it2 = AVI.find(function (k) { return k.id === x.item_id; }); c = ct(x.contrato_id);
        X.reg(uid, 'av', c.id, c.evento_id, 'Audiovisuales · ' + it2.nombre + ': ' + String(v.estado).toLowerCase(), c.cliente + ' · ' + x.estado + ' → ' + v.estado);
        x.estado = v.estado; x.estado_por = uid; x.estado_en = ahora(); return {};
    }
  }
  var COMUN = ['yo', 'logout', 'cambiar_clave', 'base', 'tick', 'bitacora', 'planes', 'plan', 'av_catalogo', 'contrato_archivo_ver'];
  var PERM = {
    almacen: ['yo', 'logout', 'cambiar_clave', 'base', 'tick', 'bitacora'].concat(PSA),
    comercial: COMUN.concat(PSA, ['contratos', 'contrato', 'contrato_guardar', 'contrato_estado', 'acceso_generar', 'acceso_anular', 'plan_guardar', 'plan_decidir', 'plan_nota', 'contrato_archivo_subir', 'contrato_archivo_borrar', 'contrato_av_guardar', 'contrato_av_quitar', 'contrato_programar', 'contrato_vincular', 'eventos']),
    audiovisual: COMUN.concat(['av_pedidos', 'av_item_guardar', 'av_equipos', 'av_equipo_guardar', 'av_estado', 'contrato_av_guardar', 'contrato_av_quitar', 'contrato_archivo_subir', 'contrato_archivo_borrar', 'plan_nota'])
  };
  function resp(st, out) { return new Promise(function (ok) { setTimeout(function () { ok(new Response(JSON.stringify(out), { status: st, headers: { 'Content-Type': 'application/json' } })); }, 60); }); }

  var previo = window.fetch;
  window.fetch = function (url, init) {
    if (typeof url === 'string' && url.indexOf('cliente-api.php') === 0) return cliente(url, init);
    if (typeof url !== 'string' || url.indexOf('api.php') !== 0) return previo.apply(this, arguments);
    var q = {}; (url.split('?')[1] || '').split('&').forEach(function (p) { var kv = p.split('='); q[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); });
    var body = {}; try { body = init && init.body ? JSON.parse(init.body) : {}; } catch (e) {}
    var YO = X.yo(), a = q.a;
    if (YO && PERM[YO.rol] && PERM[YO.rol].indexOf(a) < 0) return resp(403, { ok: false, error: YO.rol === 'comercial' ? 'Su usuario de Operaciones (contratación) no tiene acceso a esta sección.' : YO.rol === 'almacen' ? 'Su usuario de Presupuesto (almacén) no tiene acceso a esta sección.' : 'Su usuario de Audiovisuales no tiene acceso a esta sección.' });
    if (YO && PSA.indexOf(a) >= 0) { try { return resp(200, Object.assign(manejarPP(a, q, body, YO) || {}, { ok: true })); } catch (e) { if (e && e.body) return resp(e.st, e.body); return resp(500, { ok: false, error: 'Error en la vista previa: ' + (e && e.message) }); } }
    if (YO && YO.rol === 'tanatologo' && (a === 'planes' || a === 'plan')) { try { return resp(200, Object.assign(manejar(a, q, body, YO), { ok: true })); } catch (e) { return resp(e.st || 500, e.body || { ok: false, error: String(e) }); } }
    if (YO && NUEVAS.indexOf(a) >= 0) { try { return resp(200, Object.assign(manejar(a, q, body, YO) || {}, { ok: true })); } catch (e) { if (e && e.body) return resp(e.st, e.body); return resp(500, { ok: false, error: 'Error en la vista previa: ' + (e && e.message) }); } }
    return previo.apply(this, arguments).then(function (r) {
      if (!YO || ['yo', 'tick', 'bitacora', 'eventos', 'evento', 'layout_guardar'].indexOf(a) < 0) return r;
      return r.clone().json().then(function (j) {
        if (!j.ok) return r;
        var F = filtroBit(YO.rol);
        if (a === 'yo') j.usuario.areas = areasDe(X.U.find(function (k) { return k.id === j.usuario.id; }) || j.usuario);
        if (a === 'tick' && j.nuevos) j.nuevos = j.nuevos.filter(F);
        if (a === 'bitacora') j.bitacora = j.bitacora.filter(F);
        if (a === 'eventos' && j.actividad) j.actividad = j.actividad.filter(F);
        if (a === 'evento') {
          j.bitacora = (j.bitacora || []).filter(F);
          var c = CT.find(function (k) { return k.evento_id === j.evento.id; });
          if (c) { var o = vista(c, YO.rol === 'admin'); var u = ultimo(c.id); o.plan = u ? clone(u) : null; o.av = avDe(c.id); j.cliente = o; }
        }
        if (a === 'layout_guardar' && +body.plan_version) { var b = X.BIT[X.BIT.length - 1]; if (b) b.detalle = 'Tomada de la planificación del cliente, versión ' + body.plan_version + (b.detalle ? '\n' + b.detalle : ''); }
        return new Response(JSON.stringify(j), { status: 200, headers: { 'Content-Type': 'application/json' } });
      });
    });
  };

  // ---------------------------------------------------------------- cliente-api.php (página del cliente)
  var SES = {};
  function cliente(url, init) {
    var q = {}; (url.split('?')[1] || '').split('&').forEach(function (p) { var kv = p.split('='); q[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); });
    var v = {}; try { v = init && init.body ? (typeof FormData !== 'undefined' && init.body instanceof FormData ? { _archivo: init.body.get('archivo') } : JSON.parse(init.body)) : {}; } catch (e) {}
    try { return resp(200, Object.assign(manejarCliente(q.a, q.t, v), { ok: true })); } catch (e) { return resp(e.st || 500, e.body || { ok: false, error: String(e) }); }
  }
  // Programa / agenda del entrenamiento (obligatorio para enviar la solicitud)
  function progDe(cid) { return ARC.filter(function (f) { return f.contrato_id === cid && f.categoria === 'Programa académico'; }); }
  function progAdd(c, nombre, tamano, url, quien) { ARC.push({ id: ++sq.arc, contrato_id: c.id, categoria: 'Programa académico', nombre: nombre, mime: 'application/pdf', tamano: tamano || 0, descripcion: quien ? 'Adjuntado por el cliente: ' + quien : 'Programa de ejemplo', creado_por: 0, creado_en: ahora(), _url: url || null }); }
  function progEditable(c) { return c.estado !== 'Cancelado' && c.estado !== 'Finalizado' && c.fecha_inicio > dia(0); }
  function progCli(c) { return progDe(c.id).map(function (a) { return { id: a.id, nombre: a.nombre, tamano: a.tamano, creado_en: a.creado_en, del_cliente: !a.creado_por, url: a._url || null }; }); }
  function progSemilla() {
    CT.forEach(function (c) {
      if (progDe(c.id).length || ['sin_presupuesto', 'seleccion', 'ajustes'].indexOf(c.ppto_estado) >= 0 && c.estado !== 'Contratado') return;
      progAdd(c, 'Agenda ' + c.codigo + ' (ejemplo).txt', 2048, URL.createObjectURL(new Blob(['Programa / agenda de ejemplo del curso ' + c.curso + '\n08:00 Bienvenida\n08:30 Práctica en estaciones\n12:30 Almuerzo\n13:30 Práctica guiada\n17:00 Cierre'], { type: 'text/plain' })), '');
    });
  }
  function cliPpto(c) {
    var ed = ppEditableCli(c);
    return { estado: c.ppto_estado, estados: PPEST, editable: ed, nota: c.ppto_nota, ajustes: c.ppto_ajustes,
      catalogo: ed ? PPI.filter(function (i) { return i.activo && i.visible_cliente; }).sort(function (a2, b2) { return (ORD_CAT[a2.categoria] - ORD_CAT[b2.categoria]) || a2.orden - b2.orden; }).map(function (i) { return { id: i.id, categoria: i.categoria, nombre: i.nombre, descripcion: i.descripcion, unidad: i.unidad, disponible: bioPara(i, c) }; }) : [],
      programa: progCli(c), programa_editable: progEditable(c),
      categorias: PPCAT, lineas: ppLineas(c.id).map(function (l) { return { id: l.id, item_id: l.item_id, categoria: l.categoria, descripcion: l.descripcion, unidad: l.unidad, cantidad: l.cantidad, dias: l.dias, nota: l.nota, origen: l.origen }; }),
      especiales: clone(PPE.filter(function (e) { return e.contrato_id === c.id; })), versiones: clone(PPV.filter(function (k) { return k.contrato_id === c.id; }).slice().reverse()), puede_responder: c.ppto_estado === 'emitido' };
  }
  function manejarCliente(a, tok, v) {
    vencer();
    var c = CT.find(function (k) { return k.acceso_token && k.acceso_token === tok; });
    // Vista previa: la página del cliente se abre aparte y no comparte memoria con el panel; un enlace generado allí muestra un contrato de ejemplo.
    if (!c && /^demo-/.test(tok || '')) c = CT[2];
    if (!c) return { valido: false, mensaje: 'Este enlace no es válido o fue reemplazado por uno nuevo. Pida el enlace vigente a CLEMI.' };
    var ac = acceso(c);
    if (!ac.vigente) return { valido: false, mensaje: { vencido: 'El acceso para planificar la sala estuvo vigente hasta el ' + ftxt(ac.hasta) + ' y ya se cerró.', anulado: 'Este acceso fue cerrado. Si necesita algo, comuníquese con su asesor de CLEMI.', cerrado: 'El curso ya no está activo.' }[ac.motivo] || 'El acceso no está disponible.' };
    var s = SES[c.id], quien = function () { return 'Cliente · ' + s.nombre + ' (' + c.cliente + ')'; };
    function regC(acc, det) { X.BIT.push({ id: X.BIT.length ? X.BIT[X.BIT.length - 1].id + 1 : 1, momento: ahora(), usuario_id: null, usuario_nombre: quien(), entidad: 'plan', entidad_id: c.id, evento_id: c.evento_id, accion: acc, detalle: det || '' }); }
    if (a === 'estado') return { valido: true, cliente: c.cliente, curso: c.curso, dentro: !!s, nombre: s ? s.nombre : '', csrf: 'demo' };
    if (a === 'entrar') {
      if (String(v.pin || '').replace(/\D/g, '') !== c.acceso_pin) E('El código de acceso no coincide. En esta vista previa el código es ' + c.acceso_pin + '.', 401);
      if (t(v.nombre).length < 3) E('Escriba su nombre completo: la planificación queda registrada con él.');
      SES[c.id] = s = { nombre: t(v.nombre, 120) }; c.acceso_ultimo = ahora(); regC('Ingresó a la planificación de la sala', c.curso); return { csrf: 'demo', nombre: s.nombre };
    }
    if (!s) E('Ingrese con el código de acceso.', 401, { pin: true });
    var sala = X.SALAS.find(function (k) { return k.id === c.sala_id; });
    if (a === 'datos') return { curso: { cliente: c.cliente, curso: c.curso, especialidad: c.especialidad, fecha_inicio: c.fecha_inicio, fecha_fin: c.fecha_fin, hora_ini: c.hora_ini, hora_fin: c.hora_fin, participantes: c.participantes, estaciones: c.estaciones, componentes: c.componentes, tipo_componente: c.tipo_componente },
      sala: clone(sala), catalogo: clone(X.CAT), estado: c.plan_estado, nota: c.plan_nota, cambio_motivo: c.cambio_motivo, acceso: ac, hoy: dia(0), borrador: c.plan_borrador ? clone(c.plan_borrador) : null, borrador_en: c.plan_borrador_en, borrador_por: c.plan_borrador_por,
      versiones: clone(PL.filter(function (p) { return p.contrato_id === c.id; }).reverse()), mensajes: clone(PN.filter(function (n) { return n.contrato_id === c.id && n.visible_cliente; }).reverse()),
      av: avDe(c.id).map(function (x) { return { nombre: x.item_nombre, categoria: x.categoria, unidad: x.unidad, cantidad: x.cantidad, opcion: x.opcion, detalle: x.detalle, estado: x.estado }; }), nombre: s.nombre,
      contrato_estado: c.estado, ppto: cliPpto(c) };
    function regPC(acc, det) { X.BIT.push({ id: ++X.seq.bit, momento: ahora(), usuario_id: null, usuario_nombre: quien(), entidad: 'ppto', entidad_id: c.id, evento_id: null, accion: acc, detalle: det || '' }); }
    if (a === 'ppto_linea') {
      if (!ppEditableCli(c)) E('En este momento el presupuesto no se puede modificar.', 409);
      var cant = parseFloat(String(v.cantidad).replace(',', '.')); if (!(cant > 0)) E('Revise la cantidad.'); var dd = Math.max(1, Math.min(60, +v.dias || 1)), nt = t(v.nota, 500);
      if (+v.id) { var l0 = PPL.find(function (l) { return l.id === +v.id && l.contrato_id === c.id; }); if (!l0) E('La línea no existe.'); if (l0.item_id && cant > +l0.cantidad) bioValidar(l0.item_id, cant, c, l0.id); l0.cantidad = cant; l0.dias = dd; l0.nota = nt; regPC('Cambió la cantidad en su presupuesto', l0.descripcion + ' → ' + cant); return {}; }
      var it = PPI.find(function (i) { return i.id === +v.item_id && i.activo; }); if (!it) E('Ese elemento no está disponible.'); bioValidar(it.id, cant, c, 0);
      if (PPL.some(function (l) { return l.contrato_id === c.id && l.item_id === it.id && l.nota === nt; })) E('«' + it.nombre + '» ya está en su selección. Cambie la cantidad allí.');
      PPL.push({ id: ++psq.l, contrato_id: c.id, item_id: it.id, especial_id: null, categoria: it.categoria, descripcion: it.nombre, unidad: it.unidad, cantidad: cant, dias: dd, precio: it.precio, grupo: it.grupo, nota: nt, origen: 'cliente', autor_nombre: s.nombre, creado_en: ahora() });
      if (c.ppto_estado === 'sin_presupuesto') c.ppto_estado = 'seleccion'; regPC('Agregó a su presupuesto', it.nombre + ' × ' + cant); return {};
    }
    if (a === 'ppto_quitar') { if (!ppEditableCli(c)) E('En este momento el presupuesto no se puede modificar.', 409); var l1 = PPL.find(function (l) { return l.id === +v.id && l.contrato_id === c.id && !l.especial_id; }); if (!l1) E('La línea no existe.'); PPL.splice(PPL.indexOf(l1), 1); regPC('Quitó de su presupuesto', l1.descripcion); return {}; }
    if (a === 'ppto_especial') {
      if (!ppEditableCli(c)) E('En este momento el presupuesto no se puede modificar.', 409); if (t(v.texto).length < 4) E('Describa el equipo, insumo o servicio que necesita.');
      PPE.push({ id: ++psq.e, contrato_id: c.id, texto: t(v.texto, 1500), cantidad: t(v.cantidad, 60), estado: 'Pendiente', respuesta: '', autor_nombre: s.nombre, origen: 'cliente', creado_en: ahora() });
      if (c.ppto_estado === 'sin_presupuesto') c.ppto_estado = 'seleccion'; regPC('Hizo una solicitud especial', t(v.texto)); return {};
    }
    if (a === 'ppto_especial_quitar') { if (!ppEditableCli(c)) E('En este momento el presupuesto no se puede modificar.', 409); var e0 = PPE.find(function (e) { return e.id === +v.id && e.contrato_id === c.id && e.estado === 'Pendiente'; }); if (!e0) E('Solo puede quitar solicitudes que CLEMI aún no ha respondido.'); PPE.splice(PPE.indexOf(e0), 1); regPC('Quitó una solicitud especial', e0.texto); return {}; }
    if (a === 'programa_subir') {
      if (!progEditable(c)) E('El programa ya no se puede modificar desde aquí.', 409);
      var pf = v._archivo; if (!pf || !pf.name) E('No se pudo recibir el archivo.');
      if (!/\.(pdf|docx?|xlsx?|pptx?|jpe?g|png)$/i.test(pf.name)) E('Adjunte el programa en PDF, Word, Excel, PowerPoint o imagen (JPG o PNG).');
      progAdd(c, pf.name, pf.size, URL.createObjectURL(pf), s ? s.nombre : 'Cliente'); regC('Adjuntó el programa / agenda del entrenamiento', pf.name); return {};
    }
    if (a === 'programa_quitar') {
      if (!progEditable(c) || !ppEditableCli(c)) E('El programa ya fue enviado con la solicitud.', 409);
      var pq = ARC.find(function (f) { return f.id === +v.id && f.contrato_id === c.id && f.categoria === 'Programa académico' && !f.creado_por; }); if (!pq) E('El archivo no existe.');
      ARC.splice(ARC.indexOf(pq), 1); return {};
    }
    if (a === 'ppto_enviar') {
      if (!ppEditableCli(c)) E('El presupuesto ya fue enviado.', 409);
      if (!PPL.some(function (l) { return l.contrato_id === c.id; }) && !PPE.some(function (e) { return e.contrato_id === c.id; })) E('Elija al menos un elemento o haga una solicitud especial.');
      if (!progDe(c.id).length) E('Adjunte el programa o agenda de su entrenamiento: es obligatorio para enviar la solicitud.', 409, { falta_programa: true });
      c.ppto_estado = 'solicitado'; regPC('Envió su selección para el presupuesto', c.curso + (t(v.notas) ? '\nNota: ' + t(v.notas) : '')); if (t(v.notas)) nota(c.id, null, 'Comentario sobre el presupuesto', t(v.notas), 1, s.nombre + ' (' + c.cliente + ')', null, 'Cliente'); return {};
    }
    if (a === 'ppto_responder') {
      if (c.ppto_estado !== 'emitido') E('No hay un presupuesto esperando su respuesta.', 409);
      var rr = v.respuesta === 'aceptado' ? 'aceptado' : 'ajustes'; if (rr === 'ajustes' && t(v.texto).length < 4) E('Cuéntenos qué ajustes necesita.');
      var uv = PPV.filter(function (k) { return k.contrato_id === c.id; }).pop(); Object.assign(uv, { respuesta: rr, respuesta_texto: t(v.texto, 1500), respuesta_por: s.nombre + ' (' + c.cliente + ')', respuesta_en: ahora() });
      c.ppto_estado = rr; c.ppto_ajustes = rr === 'ajustes' ? t(v.texto, 1500) : ''; regPC(rr === 'aceptado' ? 'Aceptó el presupuesto (versión ' + uv.version + ')' : 'Pidió ajustes al presupuesto (versión ' + uv.version + ')', t(v.texto)); return {};
    }
    if (a === 'borrador') { if (!ac.editable) E('En este momento la planificación no se puede modificar.', 409); c.plan_borrador = limpio(v.items); c.plan_borrador_en = ahora(); c.plan_borrador_por = s.nombre; return { en: c.plan_borrador_en }; }
    if (a === 'enviar') {
      if (!ac.editable) E(ac.en_plazo ? 'La planificación ya fue enviada. Para cambiarla, solicite el cambio.' : 'El plazo para hacer cambios terminó el ' + ftxt(ac.cambios_hasta) + '.', 409);
      var it = limpio(v.items); if (!it.length) E('La sala está vacía. Ubique al menos un elemento antes de enviar.');
      var autor = s.nombre + ' (' + c.cliente + ')', ver = plan(c.id, it, 'cliente', autor, null, t(v.notas));
      c.plan_estado_prev = c.plan_estado; c.plan_estado = 'enviado'; c.plan_borrador = null; nota(c.id, ver, 'Enviada por el cliente', t(v.notas), 1, autor, null, 'Cliente');
      regC('Envió la planificación de la sala (versión ' + ver + ')', resumen(it)); return { version: ver };
    }
    if (a === 'solicitar') {
      if (!ac.puede_solicitar) E('En este momento no se puede solicitar un cambio.', 409); if (t(v.motivo).length < 5) E('Cuéntenos qué desea cambiar.');
      c.plan_estado_prev = c.plan_estado; c.plan_estado = 'cambio_solicitado'; c.cambio_motivo = t(v.motivo); c.cambio_en = ahora(); c.cambio_por = s.nombre;
      var u = ultimo(c.id); nota(c.id, u ? u.version : null, 'Cambio solicitado por el cliente', c.cambio_motivo, 1, s.nombre + ' (' + c.cliente + ')', null, 'Cliente'); regC('Solicitó un cambio en la planificación de la sala', c.cambio_motivo); return {};
    }
    if (a === 'salir') { delete SES[c.id]; return {}; }
    E('Acción desconocida.');
  }

  // ---------------------------------------------------------------- archivos y enlace del cliente
  window.CLEMI_DEMO.subirCT = function (fd, prog) {
    return new Promise(function (ok, mal) {
      var f = fd.get('archivo'), c = CT.find(function (k) { return k.id === +fd.get('contrato_id'); }), YO = X.yo();
      if (!f || !c) return mal({ error: 'No se pudo adjuntar.' });
      var cat = String(fd.get('categoria') || 'Otro');
      if (YO.rol === 'audiovisual' && CATS_AV.indexOf(cat) < 0) return mal({ error: 'Audiovisuales puede adjuntar arte para marcación y programas académicos.' });
      if (prog) prog(1);
      ARC.push({ id: ++sq.arc, contrato_id: c.id, categoria: cat, nombre: f.name, mime: f.type || 'application/octet-stream', tamano: f.size, descripcion: String(fd.get('descripcion') || ''), creado_por: YO.id, creado_en: ahora(), _url: URL.createObjectURL(f) });
      X.reg(YO.id, CATS_AV.indexOf(cat) >= 0 ? 'av' : 'contrato', c.id, null, 'Adjuntó ' + cat.toLowerCase() + ' a ' + c.codigo, f.name);
      setTimeout(function () { ok({ ok: true }); }, 200);
    });
  };
  progSemilla();
  window.CLEMI_DEMO.archivoCT = function (a) { var x = ARC.find(function (k) { return k.id === +a.id; }); return x ? x._url : '#'; };
  // Para la vista previa del portal de clientes, la firma y la preparación (demo-portal.js).
  window.CLEMI_DEMO.CTI = { AVI: AVI, AVCAT: AVCAT, CT: CT, PPL: PPL, PPE: PPE, PPV: PPV, PPI: PPI, PERM: PERM, AREAS: AREAS, nuevoCT: nuevoCT, ppLinea: ppLinea, ppEmitir: ppEmitir, ppCompleto: ppCompleto, ppTot: ppTot,
    docDatos: docDatos, docFaltan: docFaltan, CLEMI_D: CLEMI_D, vista: vista, ct: ct, hace: hace, SES: SES, manejarCliente: manejarCliente, plan: plan, progAdd: progAdd, progDe: progDe, progSemilla: progSemilla, L: L, nota: nota, salaN: salaN, ultimo: ultimo, acceso: acceso, PPEST: PPEST, E: E, t: t, resumen: resumen };
  window.CLEMI_DEMO.enlaceCliente = function (tok) { return location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, '') + 'cliente.html?t=' + tok; };
})();
