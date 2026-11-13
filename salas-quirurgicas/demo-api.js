/* =====================================================================
   CLEMI · Salas — VISTA PREVIA. Simula el servidor (api.php) en memoria
   con datos de ejemplo. Nada se guarda: al recargar vuelve al inicio.
   ===================================================================== */
(function () {
  'use strict';
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function ahora() { var d = new Date(); return iso(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  function dia(n) { var d = new Date(); d.setDate(d.getDate() + n); return iso(d); }
  function hace(min, n) { var d = new Date(Date.now() - min * 60000); if (n) d.setDate(d.getDate() + n); return iso(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  function en(fecha, hm) { return fecha + ' ' + hm + ':00'; }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ---------------------------------------------------------------- archivos (fotos y firmas)
  var ARCH = {}, nArch = 0;
  function guardarImg(d, pre) {
    if (typeof d !== 'string' || !/^data:image\//.test(d)) throw 'Imagen no válida.';
    var k = pre + '_' + (++nArch); ARCH[k] = d; return k;
  }
  function firmaFalsa(semilla) {
    var c = document.createElement('canvas'); c.width = 320; c.height = 90;
    var x = c.getContext('2d'); x.strokeStyle = '#10291c'; x.lineWidth = 2.6; x.lineCap = 'round'; x.lineJoin = 'round';
    var s = semilla; function r() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    x.beginPath(); x.moveTo(14, 58);
    for (var i = 0; i < 9; i++) x.bezierCurveTo(20 + i * 32, 10 + r() * 30, 34 + i * 32, 70 + r() * 16, 44 + i * 32, 30 + r() * 30);
    x.stroke(); x.beginPath(); x.moveTo(40, 76); x.lineTo(260 + r() * 40, 70); x.stroke();
    return c.toDataURL('image/png');
  }

  // ---------------------------------------------------------------- datos de ejemplo
  var U = [
    { id: 1, usuario: 'silvia', nombre: 'Silvia', cedula: '', rol: 'admin', activo: 1, debe_cambiar: 0 },
    { id: 2, usuario: 'sergio.saavedra', nombre: 'Sergio Saavedra', cedula: '', rol: 'instrumentador', activo: 1, debe_cambiar: 0 },
    { id: 3, usuario: 'nicolas.rendon', nombre: 'Nicolás Rendón', cedula: '', rol: 'instrumentador', activo: 1, debe_cambiar: 0 },
    { id: 4, usuario: 'laura.rodriguez', nombre: 'Laura Rodríguez', cedula: '', rol: 'instrumentador', activo: 1, debe_cambiar: 0 },
    { id: 5, usuario: 'angely.suesca', nombre: 'Angely Suesca', cedula: '', rol: 'instrumentador', activo: 1, debe_cambiar: 0 }
  ];
  var SALAS = [
    { id: 1, nombre: 'Sala 1', ancho: 1000, largo: 1400, foto: 'sala1.jpg', notas: '', orden: 1, base: [], plano: [
      { t: 'pantalla', x: 350, y: 0, w: 300, h: 14, label: 'Pantalla proyección' }, { t: 'columna', x: 0, y: 560, w: 70, h: 70 }, { t: 'columna', x: 930, y: 560, w: 70, h: 70 },
      { t: 'tv', x: 70, y: 570, w: 14, h: 60, label: 'Soporte TV' }, { t: 'tv', x: 916, y: 570, w: 14, h: 60, label: 'Soporte TV' }, { t: 'puerta', x: 0, y: 1180, w: 14, h: 100, label: 'Puerta' },
      { t: 'ventana', x: 986, y: 880, w: 14, h: 90 }, { t: 'ventana', x: 986, y: 1020, w: 14, h: 90 }, { t: 'rejilla', x: 480, y: 600, w: 40, h: 90 }, { t: 'rejilla', x: 470, y: 1040, w: 55, h: 150 }] },
    { id: 2, nombre: 'Sala 2', ancho: 1100, largo: 1300, foto: 'sala2.jpg', notas: '', orden: 2, base: [], plano: [
      { t: 'ventana', x: 0, y: 640, w: 14, h: 110 }, { t: 'ventana', x: 0, y: 780, w: 14, h: 90 }, { t: 'columna', x: 260, y: 0, w: 60, h: 60 }, { t: 'columna', x: 780, y: 0, w: 60, h: 60 },
      { t: 'ventana_int', x: 1086, y: 700, w: 14, h: 160, label: 'Ventana interior' }, { t: 'puerta', x: 1086, y: 1050, w: 14, h: 120, label: 'Acceso' },
      { t: 'toma', x: 300, y: 950, w: 20, h: 20 }, { t: 'toma', x: 540, y: 950, w: 20, h: 20 }, { t: 'toma', x: 800, y: 950, w: 20, h: 20 }, { t: 'toma', x: 150, y: 1150, w: 20, h: 20 }] },
    { id: 3, nombre: 'Sala 3', ancho: 1300, largo: 1600, foto: 'sala3.jpg', notas: '', orden: 3, base: [], plano: [
      { t: 'columna', x: 0, y: 520, w: 70, h: 70 }, { t: 'columna', x: 1230, y: 520, w: 70, h: 70 }, { t: 'columna', x: 0, y: 1150, w: 70, h: 70 }, { t: 'columna', x: 1230, y: 1150, w: 70, h: 70 },
      { t: 'columna', x: 330, y: 0, w: 60, h: 60 }, { t: 'ventana_int', x: 760, y: 0, w: 130, h: 14, label: 'Ventana interior' }, { t: 'puerta', x: 1000, y: 0, w: 120, h: 14, label: 'Pasillo' },
      { t: 'rejilla', x: 600, y: 1080, w: 55, h: 150 }, { t: 'toma', x: 1180, y: 1450, w: 20, h: 20 }] },
    { id: 4, nombre: 'Sala 4', ancho: 1100, largo: 1150, foto: 'sala4.jpg', notas: '', orden: 4, base: [], plano: [
      { t: 'ventana', x: 80, y: 0, w: 400, h: 14 }, { t: 'ventana', x: 620, y: 0, w: 400, h: 14 }, { t: 'columna', x: 0, y: 0, w: 60, h: 60 }, { t: 'columna', x: 1040, y: 0, w: 60, h: 60 },
      { t: 'puerta', x: 0, y: 820, w: 14, h: 120, label: 'Puerta' }, { t: 'tv', x: 1086, y: 420, w: 14, h: 150, label: 'TV' }, { t: 'rejilla', x: 520, y: 520, w: 40, h: 100 },
      { t: 'toma', x: 250, y: 620, w: 20, h: 20 }, { t: 'toma', x: 820, y: 620, w: 20, h: 20 }] },
    { id: 5, nombre: 'Sala 5', ancho: 1050, largo: 1000, foto: 'sala5.jpg', notas: '', orden: 5, base: [], plano: [
      { t: 'ventana', x: 0, y: 240, w: 14, h: 150 }, { t: 'ventana', x: 90, y: 0, w: 300, h: 14 }, { t: 'ventana', x: 560, y: 0, w: 400, h: 14 }, { t: 'columna', x: 0, y: 0, w: 60, h: 60 },
      { t: 'columna', x: 990, y: 0, w: 60, h: 60 }, { t: 'puerta', x: 0, y: 600, w: 14, h: 130, label: 'Puerta' }, { t: 'extintor', x: 30, y: 100, w: 24, h: 24, label: 'Extintor' }, { t: 'rejilla', x: 480, y: 560, w: 45, h: 110 }] },
    { id: 6, nombre: 'Sala 6', ancho: 1200, largo: 1300, foto: 'sala6.jpg', notas: '', orden: 6, base: [], plano: [
      { t: 'tv', x: 0, y: 330, w: 14, h: 150, label: 'TV' }, { t: 'tv', x: 520, y: 0, w: 160, h: 14, label: 'TV' }, { t: 'tv', x: 1186, y: 330, w: 14, h: 150, label: 'TV' },
      { t: 'tv', x: 0, y: 560, w: 14, h: 60, label: 'Monitor' }, { t: 'tv', x: 1186, y: 560, w: 14, h: 60, label: 'Monitor' }, { t: 'aire', x: 140, y: 0, w: 110, h: 40, label: 'Aire acondicionado' },
      { t: 'ventilador', x: 20, y: 200, w: 40, h: 40 }, { t: 'ventilador', x: 1140, y: 200, w: 40, h: 40 }, { t: 'ventilador', x: 330, y: 20, w: 40, h: 40 }, { t: 'columna', x: 0, y: 0, w: 60, h: 60 },
      { t: 'columna', x: 1140, y: 0, w: 60, h: 60 }, { t: 'ventana', x: 1186, y: 700, w: 14, h: 200 }, { t: 'rejilla', x: 540, y: 480, w: 45, h: 70 }, { t: 'rejilla', x: 560, y: 820, w: 55, h: 130 }, { t: 'toma', x: 200, y: 1150, w: 20, h: 20 }] }
  ];
  var CAT = [
    ['Camilla con componente anatómico', 'camilla_cuerpo', 200, 70, '#2A5A41'], ['Camilla vacía', 'camilla', 200, 70, '#5E7D6B'], ['Mesa de instrumental', 'mesa', 120, 60, '#C6A13B'],
    ['Mesa de Mayo', 'mesa', 80, 50, '#D9B75A'], ['Torre de video', 'torre', 60, 60, '#13466B'], ['Monitor rodante', 'monitor', 60, 50, '#1F5A85'], ['Arco en C', 'arco', 200, 80, '#4B5A66'],
    ['Consola de motor', 'caja', 50, 40, '#6B4E8A'], ['Carro de insumos', 'caja', 60, 45, '#8A7A55'], ['Caneca de residuos biológicos', 'circulo', 45, 45, '#B23A3A'],
    ['Lámpara rodable', 'circulo', 60, 60, '#E8C25B'], ['Banco quirúrgico', 'circulo', 40, 40, '#7A8B80']
  ].map(function (c, i) { return { id: i + 1, nombre: c[0], forma: c[1], ancho: c[2], largo: c[3], color: c[4], activo: 1, orden: i + 1 }; });
  var PLANT = [{ id: 1, nombre: 'Ejemplo · Entrenamiento con componente anatómico', actualizado_en: ahora(), items: [
    { fase: 'Antes', texto: 'Componentes anatómicos identificados y rotulados' }, { fase: 'Antes', texto: 'Mesas de instrumental completas según listado' },
    { fase: 'Antes', texto: 'Torre de video y monitores probados' }, { fase: 'Durante', texto: 'Control de uso de elementos de protección personal' },
    { fase: 'Después', texto: 'Instrumental contado y entregado a la casa comercial' }, { fase: 'Después', texto: 'Sala limpia y desinfectada' }] }];

  var EV = [], VER = [], NOV = [], ENT = [], FOT = [], BIT = [];
  var seq = { ev: 0, ver: 0, nov: 0, ent: 0, fot: 0, bit: 0 };
  function nombre(id) { var u = U.find(function (x) { return x.id === +id; }); return u ? u.nombre : '—'; }
  function reg(uid, entidad, eid, evid, accion, detalle, momento) {
    BIT.push({ id: ++seq.bit, momento: momento || ahora(), usuario_id: uid, usuario_nombre: uid ? nombre(uid) : 'Sistema', entidad: entidad, entidad_id: eid, evento_id: evid, accion: accion, detalle: detalle || '' });
  }
  function L(cat, x, y, r, label) { return { id: 'i' + Math.random().toString(36).slice(2, 9), cat: cat, x: x, y: y, r: r || 0, label: label || '' }; }

  function sembrar() {
    var hoy = dia(0), ayer = dia(-1);
    // Evento 1 · hoy, en curso
    var e1 = { id: ++seq.ev, titulo: 'Curso de artroscopia de rodilla (ejemplo)', especialidad: 'Ortopedia', empresa: 'Casa comercial de ejemplo', sala_id: 3, fecha: hoy,
      hora_ini: '07:00', hora_fin: '13:00', responsable_id: 4, apoyo: [5], participantes: 16, componentes: 4, descripcion: 'Evento de ejemplo para la vista previa. Cuatro estaciones con componente anatómico, rotación cada 90 minutos.',
      estado: 'en_curso', layout: [L(1, 350, 350, 0, 'Estación 1'), L(1, 950, 350, 0, 'Estación 2'), L(1, 350, 900, 0, 'Estación 3'), L(1, 950, 900, 0, 'Estación 4'),
        L(3, 350, 500), L(3, 950, 500), L(3, 350, 1050), L(3, 950, 1050), L(5, 180, 350), L(5, 1120, 350), L(5, 180, 900), L(5, 1120, 900), L(10, 640, 1450), L(9, 1150, 1450)],
      iniciado_en: en(hoy, '07:04'), iniciado_por: 4, creado_por: 4, creado_en: hace(60 * 26), actualizado_por: 4, actualizado_en: en(hoy, '09:20') };
    EV.push(e1);
    reg(4, 'evento', e1.id, e1.id, 'Creó el evento', e1.titulo + ' · Sala 3', e1.creado_en);
    PLANT[0].items.forEach(function (it, i) {
      var v = { id: ++seq.ver, evento_id: e1.id, fase: it.fase, texto: it.texto, orden: i, estado: 'pendiente', obs: '', marcado_por: null, marcado_en: null, creado_por: 4, creado_en: e1.creado_en };
      if (i === 0 || i === 2) { v.estado = 'ok'; v.marcado_por = i ? 5 : 4; v.marcado_en = en(hoy, i ? '06:52' : '06:45'); }
      if (i === 1) { v.estado = 'no'; v.obs = 'Falta pinza de agarre en estación 2 (ejemplo)'; v.marcado_por = 4; v.marcado_en = en(hoy, '06:50'); }
      VER.push(v);
    });
    reg(4, 'verificacion', null, e1.id, 'Cargó lista de verificación', PLANT[0].nombre, e1.creado_en);
    reg(4, 'verificacion', 1, e1.id, 'Verificó ítem: Cumple', 'Componentes anatómicos identificados y rotulados', en(hoy, '06:45:10'));
    reg(4, 'verificacion', 2, e1.id, 'Verificó ítem: No cumple', 'Mesas de instrumental completas según listado — Falta pinza de agarre en estación 2 (ejemplo)', en(hoy, '06:50:02'));
    reg(5, 'verificacion', 3, e1.id, 'Verificó ítem: Cumple', 'Torre de video y monitores probados', en(hoy, '06:52:40'));
    reg(4, 'evento', e1.id, e1.id, 'Inició el entrenamiento', '', en(hoy, '07:04:00'));
    NOV.push({ id: ++seq.nov, evento_id: e1.id, tipo: 'Incidente', texto: 'Se reemplazó la pinza de agarre de la estación 2 con instrumental de reserva (ejemplo).', foto: null, creado_por: 4, creado_en: en(hoy, '07:15:00') });
    reg(4, 'novedad', 1, e1.id, 'Registró incidente', NOV[0].texto, en(hoy, '07:15:00'));
    NOV.push({ id: ++seq.nov, evento_id: e1.id, tipo: 'Cambio', texto: 'La estación 4 pasa a trabajar abordaje posteromedial por solicitud del instructor (ejemplo).', foto: null, creado_por: 5, creado_en: en(hoy, '09:20:00') });
    reg(5, 'novedad', 2, e1.id, 'Registró cambio', NOV[1].texto, en(hoy, '09:20:00'));
    reg(4, 'layout', null, e1.id, 'Actualizó la distribución de la sala', 'Camilla con componente anatómico: 0 → 4\nMesa de instrumental: 0 → 4\nTorre de video: 0 → 4', en(hoy, '06:40:00'));

    // Evento 2 · hoy, programado
    var e2 = { id: ++seq.ev, titulo: 'Taller de columna — abordaje posterior (ejemplo)', especialidad: 'Columna', empresa: '', sala_id: 1, fecha: hoy, hora_ini: '14:00', hora_fin: '18:00',
      responsable_id: 2, apoyo: [], participantes: 10, componentes: 2, descripcion: '', estado: 'programado', layout: [L(1, 500, 500, 90, 'Estación 1'), L(1, 500, 950, 90, 'Estación 2'), L(3, 330, 500, 90), L(3, 330, 950, 90), L(7, 700, 720, 90)],
      creado_por: 2, creado_en: hace(60 * 20), actualizado_por: 2, actualizado_en: hace(60 * 20) };
    EV.push(e2); reg(2, 'evento', e2.id, e2.id, 'Creó el evento', e2.titulo + ' · Sala 1', e2.creado_en);

    // Evento 3 · ayer, cerrado y firmado
    var e3 = { id: ++seq.ev, titulo: 'Curso de reemplazo de cadera (ejemplo)', especialidad: 'Ortopedia', empresa: 'Casa comercial de ejemplo', sala_id: 6, fecha: ayer, hora_ini: '08:00', hora_fin: '12:00',
      responsable_id: 3, apoyo: [2], participantes: 12, componentes: 3, descripcion: '', estado: 'cerrado', layout: [L(1, 300, 700, 0, 'Estación 1'), L(1, 600, 700, 0, 'Estación 2'), L(1, 900, 700, 0, 'Estación 3'), L(4, 300, 850), L(4, 600, 850), L(4, 900, 850)],
      iniciado_en: en(ayer, '08:02'), iniciado_por: 3, cierre_firma: guardarImg(firmaFalsa(31), 'cierre'), cierre_por: 3, cierre_en: en(ayer, '12:18:00'), cierre_obs: 'Entrenamiento finalizado sin eventos adversos (ejemplo).',
      creado_por: 3, creado_en: hace(60 * 50), actualizado_por: 3, actualizado_en: en(ayer, '12:18:00') };
    EV.push(e3);
    reg(3, 'evento', e3.id, e3.id, 'Creó el evento', e3.titulo + ' · Sala 6', e3.creado_en);
    ['Componentes anatómicos identificados y rotulados', 'Sala limpia y desinfectada'].forEach(function (t, i) {
      VER.push({ id: ++seq.ver, evento_id: e3.id, fase: i ? 'Después' : 'Antes', texto: t, orden: i, estado: 'ok', obs: '', marcado_por: 3, marcado_en: en(ayer, i ? '12:10' : '07:50'), creado_por: 3, creado_en: e3.creado_en });
    });
    reg(3, 'evento', e3.id, e3.id, 'Inició el entrenamiento', '', en(ayer, '08:02:00'));
    reg(3, 'evento', e3.id, e3.id, 'Cerró y firmó el evento', e3.cierre_obs, e3.cierre_en);

    // Evento 4 · mañana
    var e4 = { id: ++seq.ev, titulo: 'Entrenamiento de hombro (ejemplo)', especialidad: 'Ortopedia', empresa: '', sala_id: 5, fecha: dia(1), hora_ini: '07:30', hora_fin: '11:30',
      responsable_id: 5, apoyo: [], participantes: 8, componentes: 2, descripcion: '', estado: 'programado', layout: [], creado_por: 5, creado_en: hace(90), actualizado_por: 5, actualizado_en: hace(90) };
    EV.push(e4); reg(5, 'evento', e4.id, e4.id, 'Creó el evento', e4.titulo + ' · Sala 5', e4.creado_en);

    // Entregas de instrumental
    ENT.push({ id: ++seq.ent, evento_id: 1, fecha_hora: en(hoy, '06:30:00'), empresa: 'Casa comercial de ejemplo', entrega_nombre: 'Persona de ejemplo', entrega_cedula: '0000000000',
      entrega_cargo: 'Especialista de producto', entrega_telefono: '', entrega_firma: guardarImg(firmaFalsa(7), 'firma'), recibe_id: 4, recibe_nombre: 'Laura Rodríguez', recibe_cedula: '0000000000',
      recibe_firma: guardarImg(firmaFalsa(19), 'firma'), ubicacion: 'Sala 3, mesa auxiliar junto a la ventana interior (ejemplo)',
      items: [{ desc: 'Set de artroscopia de rodilla', ref: 'LOTE-EJEMPLO', cant: 4, estado: 'Bueno' }, { desc: 'Consola de motor', ref: '', cant: 2, estado: 'Bueno' }],
      observaciones: '', estado: 'En custodia', creado_por: 4, creado_en: en(hoy, '06:30:00') });
    FOT.push({ id: ++seq.fot, entrega_id: 1, momento: 'Entrega', archivo: 'estatica:assets/estacion-ejemplo.jpg', creado_por: 4, creado_en: en(hoy, '06:31:00') });
    reg(4, 'entrega', 1, 1, 'Registró entrega de instrumental', 'Casa comercial de ejemplo → Laura Rodríguez · Ubicación: Sala 3', en(hoy, '06:30:00'));
    ENT.push({ id: ++seq.ent, evento_id: 3, fecha_hora: en(ayer, '07:20:00'), empresa: 'Casa comercial de ejemplo', entrega_nombre: 'Persona de ejemplo', entrega_cedula: '0000000000',
      entrega_cargo: '', entrega_telefono: '', entrega_firma: guardarImg(firmaFalsa(3), 'firma'), recibe_id: 3, recibe_nombre: 'Nicolás Rendón', recibe_cedula: '0000000000',
      recibe_firma: guardarImg(firmaFalsa(11), 'firma'), ubicacion: 'Sala 6 (ejemplo)', items: [{ desc: 'Set de prótesis de cadera', ref: '', cant: 3, estado: 'Bueno' }],
      observaciones: '', estado: 'Devuelto', dev_fecha_hora: en(ayer, '12:30:00'), dev_entrega_id: 3, dev_entrega_nombre: 'Nicolás Rendón', dev_entrega_cedula: '0000000000',
      dev_entrega_firma: guardarImg(firmaFalsa(23), 'firma'), dev_recibe_nombre: 'Persona de ejemplo', dev_recibe_cedula: '0000000000', dev_recibe_firma: guardarImg(firmaFalsa(29), 'firma'),
      dev_obs: 'Se devuelve completo (ejemplo).', creado_por: 3, creado_en: en(ayer, '07:20:00') });
    reg(3, 'entrega', 2, 3, 'Registró entrega de instrumental', 'Casa comercial de ejemplo → Nicolás Rendón', en(ayer, '07:20:00'));
    reg(3, 'entrega', 2, 3, 'Registró devolución a la empresa', 'Casa comercial de ejemplo', en(ayer, '12:30:00'));
    BIT.sort(function (a, b) { return a.momento < b.momento ? -1 : 1; }); BIT.forEach(function (b, i) { b.id = i + 1; });
  }

  // ---------------------------------------------------------------- API simulada
  var YO = null;
  function E(msg, st, extra) { var o = { ok: false, error: msg }; if (extra) for (var k in extra) o[k] = extra[k]; throw { st: st || 400, body: o }; }
  function ev(id) { var e = EV.find(function (x) { return x.id === +id; }); if (!e) E('El evento no existe.', 404); return e; }
  function editable(e) { if (e.estado === 'cerrado') E('El evento está cerrado y firmado. Solo la administradora puede reabrirlo.', 409); if (e.estado === 'cancelado') E('El evento está cancelado.', 409); }
  function admin() { if (YO.rol !== 'admin') E('Solo la administradora puede hacer este cambio.', 403); }
  function tick() { return BIT.length ? BIT[BIT.length - 1].id : 0; }
  function t(s, max) { return String(s == null ? '' : s).trim().slice(0, max || 2000); }
  function r(uid, a, b, c, d, f) { reg(uid, a, b, c, d, f); }
  function nomSala(id) { return (SALAS.find(function (s) { return s.id === +id; }) || {}).nombre || id; }

  function manejar(a, q, v) {
    if (a === 'login') {
      var u = U.find(function (x) { return x.usuario === t(v.usuario).toLowerCase() && x.activo; });
      if (!u || v.clave !== 'demo') E('Usuario o contraseña incorrectos. En esta vista previa la contraseña es «demo».', 401);
      YO = u; return { csrf: 'demo' };
    }
    if (!YO) E('Sesión no iniciada.', 401);
    var uid = YO.id, ADMIN = YO.rol === 'admin', e, it, id;
    switch (a) {
      case 'yo': return { usuario: clone(YO), csrf: 'demo' };
      case 'logout': YO = null; return {};
      case 'cambiar_clave': E('En la vista previa las contraseñas no se cambian. En la plataforma real sí.');
      case 'base': return { salas: clone(SALAS), catalogo: clone(CAT), plantillas: clone(PLANT), usuarios: clone(U), tick: tick(), ahora: ahora() };
      case 'tick': var d = +q.desde || 0;
        return { tick: tick(), nuevos: BIT.filter(function (b) { return b.id > d && b.entidad !== 'sesion'; }).slice(-20).reverse(), ahora: ahora() };
      case 'eventos':
        var ds = q.desde || dia(-30), hs = q.hasta || dia(60);
        return { eventos: EV.filter(function (x) { return x.fecha >= ds && x.fecha <= hs; }).sort(function (x, y) { return (x.fecha + x.hora_ini) < (y.fecha + y.hora_ini) ? -1 : 1; }).map(function (x) {
          var vs = VER.filter(function (w) { return w.evento_id === x.id; });
          var o = clone(x); delete o.layout; o.v_total = vs.length; o.v_hechos = vs.filter(function (w) { return w.estado !== 'pendiente'; }).length;
          o.n_nov = NOV.filter(function (n) { return n.evento_id === x.id; }).length; return o;
        }), actividad: BIT.filter(function (b) { return b.entidad !== 'sesion'; }).slice(-25).reverse(), tick: tick() };
      case 'evento':
        e = ev(q.id);
        return { evento: clone(e), verificacion: clone(VER.filter(function (x) { return x.evento_id === e.id; }).sort(function (x, y) { return x.orden - y.orden || x.id - y.id; })),
          novedades: clone(NOV.filter(function (x) { return x.evento_id === e.id; }).reverse()),
          entregas: clone(ENT.filter(function (x) { return x.evento_id === e.id; }).reverse()), bitacora: clone(BIT.filter(function (b) { return b.evento_id === e.id; }).reverse()), tick: tick() };
      case 'evento_guardar':
        var c = { titulo: t(v.titulo, 200), especialidad: t(v.especialidad, 120), empresa: t(v.empresa, 200), sala_id: +v.sala_id, fecha: t(v.fecha, 10), hora_ini: t(v.hora_ini, 5), hora_fin: t(v.hora_fin, 5),
          responsable_id: +v.responsable_id, participantes: Math.max(0, +v.participantes || 0), componentes: Math.max(0, +v.componentes || 0), descripcion: t(v.descripcion, 4000) };
        if (!c.titulo) E('Escriba el nombre del entrenamiento.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(c.fecha)) E('Seleccione la fecha.');
        if (!/^\d{2}:\d{2}$/.test(c.hora_ini) || !/^\d{2}:\d{2}$/.test(c.hora_fin)) E('Indique hora de inicio y de fin.');
        if (c.hora_fin <= c.hora_ini) E('La hora de fin debe ser posterior a la de inicio.');
        if (!U.find(function (x) { return x.id === c.responsable_id; })) E('Seleccione el instrumentador a cargo.');
        id = +v.id || 0;
        var cr = EV.find(function (x) { return x.sala_id === c.sala_id && x.fecha === c.fecha && x.estado !== 'cancelado' && x.id !== id && x.hora_ini < c.hora_fin && x.hora_fin > c.hora_ini; });
        if (cr && !v.forzar) E('La sala ya tiene «' + cr.titulo + '» de ' + cr.hora_ini + ' a ' + cr.hora_fin + '.', 409, { cruce: true });
        if (id) {
          e = ev(id); editable(e);
          var cambios = [];
          Object.keys(c).forEach(function (k) {
            if (String(e[k]) !== String(c[k])) {
              var f = function (x) { return k === 'responsable_id' ? nombre(x) : k === 'sala_id' ? nomSala(x) : String(x); };
              cambios.push(k.replace('_id', '').replace('_', ' ') + ': «' + f(e[k]) + '» → «' + f(c[k]) + '»');
            }
          });
          if (!cambios.length) return { id: id, sin_cambios: true };
          Object.assign(e, c, { apoyo: v.apoyo || [], actualizado_por: uid, actualizado_en: ahora() });
          r(uid, 'evento', id, id, 'Modificó datos del evento', cambios.join('\n'));
        } else {
          var s = SALAS.find(function (x) { return x.id === c.sala_id; });
          e = Object.assign({ id: ++seq.ev, apoyo: v.apoyo || [], layout: clone(s.base || []), estado: 'programado', creado_por: uid, creado_en: ahora(), actualizado_por: uid, actualizado_en: ahora() }, c);
          EV.push(e); id = e.id;
          r(uid, 'evento', id, id, 'Creó el evento', c.titulo + ' · ' + nomSala(c.sala_id) + ' · ' + c.fecha + ' ' + c.hora_ini + '–' + c.hora_fin);
          var pl = PLANT.find(function (p) { return p.id === +v.plantilla_id; });
          if (pl) { pl.items.forEach(function (x, i) { VER.push({ id: ++seq.ver, evento_id: id, fase: x.fase, texto: x.texto, orden: i, estado: 'pendiente', obs: '', creado_por: uid, creado_en: ahora() }); }); r(uid, 'verificacion', null, id, 'Cargó lista de verificación', pl.nombre); }
        }
        return { id: id };
      case 'evento_estado':
        e = ev(v.id);
        if (v.estado === 'en_curso') { editable(e); e.estado = 'en_curso'; e.iniciado_en = ahora(); e.iniciado_por = uid; r(uid, 'evento', e.id, e.id, 'Inició el entrenamiento'); }
        else if (v.estado === 'cancelado') { editable(e); if (!t(v.motivo)) E('Escriba el motivo de la cancelación.'); e.estado = 'cancelado'; r(uid, 'evento', e.id, e.id, 'Canceló el evento', t(v.motivo)); }
        else if (v.estado === 'reabrir') { admin(); if (!t(v.motivo)) E('Escriba el motivo para reabrir el evento.'); var prev = e.estado; e.estado = 'en_curso'; e.cierre_firma = e.cierre_por = e.cierre_en = null; r(uid, 'evento', e.id, e.id, 'Reabrió el evento (estaba ' + prev + ')', t(v.motivo)); }
        return {};
      case 'evento_cerrar':
        e = ev(v.id); editable(e);
        if (e.responsable_id !== uid) E('Solo el instrumentador a cargo puede firmar el cierre de este evento.', 403);
        if (v.clave !== 'demo') E('La contraseña no coincide. En la vista previa es «demo».');
        var pend = VER.filter(function (x) { return x.evento_id === e.id && x.estado === 'pendiente'; }).length;
        if (pend && !v.aceptar_pendientes) E('Hay ' + pend + ' ítems de verificación pendientes.', 409);
        Object.assign(e, { estado: 'cerrado', cierre_firma: guardarImg(v.firma, 'cierre'), cierre_por: uid, cierre_en: ahora(), cierre_obs: t(v.obs, 4000), actualizado_por: uid, actualizado_en: ahora() });
        r(uid, 'evento', e.id, e.id, 'Cerró y firmó el evento', (pend ? 'Cerrado con ' + pend + ' ítems pendientes. ' : '') + e.cierre_obs);
        return {};
      case 'evento_borrar':
        admin(); e = ev(v.id); if (t(v.confirmar) !== 'BORRAR') E('Escriba BORRAR para confirmar.');
        EV.splice(EV.indexOf(e), 1); r(uid, 'evento', e.id, null, 'Eliminó el evento', e.titulo); return {};
      case 'verif_agregar':
        e = ev(v.evento_id); editable(e);
        var lin = String(v.texto || '').split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
        if (!lin.length) E('Escriba al menos un ítem.');
        lin.forEach(function (x) { VER.push({ id: ++seq.ver, evento_id: e.id, fase: v.fase, texto: x, orden: 999 + seq.ver, estado: 'pendiente', obs: '', creado_por: uid, creado_en: ahora() }); });
        r(uid, 'verificacion', null, e.id, 'Agregó ítems de verificación (' + v.fase + ')', lin.join('\n')); return {};
      case 'verif_plantilla':
        e = ev(v.evento_id); editable(e); var p2 = PLANT.find(function (p) { return p.id === +v.plantilla_id; }); if (!p2) E('La plantilla no existe.');
        p2.items.forEach(function (x) { VER.push({ id: ++seq.ver, evento_id: e.id, fase: x.fase, texto: x.texto, orden: 999 + seq.ver, estado: 'pendiente', obs: '', creado_por: uid, creado_en: ahora() }); });
        r(uid, 'verificacion', null, e.id, 'Cargó lista de verificación', p2.nombre); return {};
      case 'verif_marcar':
        it = VER.find(function (x) { return x.id === +v.id; }); if (!it) E('El ítem no existe.');
        e = ev(it.evento_id); editable(e);
        var obs = t(v.obs, 1000); if (v.estado === 'no' && !obs) E('Explique en la observación por qué el ítem no cumple.');
        Object.assign(it, { estado: v.estado, obs: obs, marcado_por: uid, marcado_en: ahora() });
        r(uid, 'verificacion', it.id, e.id, 'Verificó ítem: ' + { pendiente: 'Pendiente', ok: 'Cumple', no: 'No cumple', na: 'No aplica' }[v.estado], it.texto + (obs ? ' — ' + obs : '')); return {};
      case 'verif_borrar':
        it = VER.find(function (x) { return x.id === +v.id; }); if (!it) E('El ítem no existe.');
        e = ev(it.evento_id); editable(e);
        if (!ADMIN && (it.creado_por !== uid || it.estado !== 'pendiente')) E('Solo puede quitar ítems pendientes que usted agregó. Marque «No aplica» en su lugar.', 403);
        VER.splice(VER.indexOf(it), 1); r(uid, 'verificacion', it.id, e.id, 'Quitó ítem de verificación', it.texto); return {};
      case 'novedad':
        e = ev(v.evento_id); editable(e); if (!t(v.texto)) E('Escriba la novedad.');
        var nv = { id: ++seq.nov, evento_id: e.id, tipo: v.tipo, texto: t(v.texto, 4000), foto: v.foto ? guardarImg(v.foto, 'novedad') : null, creado_por: uid, creado_en: ahora() };
        NOV.push(nv); r(uid, 'novedad', nv.id, e.id, 'Registró ' + v.tipo.toLowerCase(), nv.texto + (nv.foto ? ' [con foto]' : '')); return {};
      case 'layout_guardar':
        e = ev(v.evento_id); editable(e);
        var cnt = function (l) { var o = {}; l.forEach(function (x) { var n = (CAT.find(function (k) { return k.id === +x.cat; }) || {}).nombre || 'Elemento'; o[n] = (o[n] || 0) + 1; }); return o; };
        var A = cnt(e.layout), B = cnt(v.layout || []), det = [];
        Object.keys(Object.assign({}, A, B)).sort().forEach(function (k) { if ((A[k] || 0) !== (B[k] || 0)) det.push(k + ': ' + (A[k] || 0) + ' → ' + (B[k] || 0)); });
        e.layout = clone(v.layout || []); e.actualizado_por = uid; e.actualizado_en = ahora();
        r(uid, 'layout', null, e.id, 'Actualizó la distribución de la sala', det.join('\n') || 'Elementos reubicados'); return {};
      case 'entregas':
        var qq = String(q.q || '').toLowerCase();
        return { entregas: clone(ENT.filter(function (x) { return !qq || JSON.stringify(x).toLowerCase().indexOf(qq) >= 0; }).slice().reverse().map(function (x) {
          var o = clone(x); var evv = EV.find(function (k) { return k.id === x.evento_id; }); o.evento_titulo = evv ? evv.titulo : null; return o;
        })), tick: tick() };
      case 'entrega':
        var x = ENT.find(function (k) { return k.id === +q.id; }); if (!x) E('La entrega no existe.', 404);
        var o = clone(x), evx = EV.find(function (k) { return k.id === x.evento_id; });
        o.evento_titulo = evx ? evx.titulo : null; o.fotos = clone(FOT.filter(function (f) { return f.entrega_id === x.id; }));
        o.bitacora = clone(BIT.filter(function (b) { return b.entidad === 'entrega' && b.entidad_id === x.id; })); return { entrega: o };
      case 'entrega_guardar':
        var req = { empresa: 'el nombre de la empresa', entrega_nombre: 'el nombre de quien entrega', entrega_cedula: 'la cédula de quien entrega', recibe_nombre: 'el nombre de quien recibe', recibe_cedula: 'la cédula de quien recibe', ubicacion: 'dónde se deja el equipo o instrumental' };
        Object.keys(req).forEach(function (k) { if (!t(v[k])) E('Falta ' + req[k] + '.'); });
        var its = (v.items || []).filter(function (i) { return t(i.desc); }).map(function (i) { return { desc: t(i.desc, 300), ref: t(i.ref, 80), cant: Math.max(1, +i.cant || 1), estado: i.estado || 'Bueno' }; });
        if (!its.length) E('Agregue al menos un equipo o instrumental a la lista.');
        if (!v.entrega_firma) E('Falta la firma de quien entrega.'); if (!v.recibe_firma) E('Falta la firma de quien recibe.');
        var en2 = { id: ++seq.ent, evento_id: +v.evento_id || null, fecha_hora: ahora(), empresa: t(v.empresa), entrega_nombre: t(v.entrega_nombre), entrega_cedula: t(v.entrega_cedula), entrega_cargo: t(v.entrega_cargo),
          entrega_telefono: t(v.entrega_telefono), entrega_firma: guardarImg(v.entrega_firma, 'firma'), recibe_id: +v.recibe_id || null, recibe_nombre: t(v.recibe_nombre), recibe_cedula: t(v.recibe_cedula),
          recibe_firma: guardarImg(v.recibe_firma, 'firma'), ubicacion: t(v.ubicacion, 500), items: its, observaciones: t(v.observaciones, 4000), estado: 'En custodia', creado_por: uid, creado_en: ahora() };
        ENT.push(en2);
        (v.fotos || []).forEach(function (f) { FOT.push({ id: ++seq.fot, entrega_id: en2.id, momento: 'Entrega', archivo: guardarImg(f, 'entrega'), creado_por: uid, creado_en: ahora() }); });
        r(uid, 'entrega', en2.id, en2.evento_id, 'Registró entrega de instrumental', en2.empresa + ' → ' + en2.recibe_nombre + ' · Ubicación: ' + en2.ubicacion + '\n' + its.map(function (i) { return i.cant + ' × ' + i.desc; }).join('; '));
        return { id: en2.id };
      case 'entrega_foto':
        var xf = ENT.find(function (k) { return k.id === +v.id; }); if (!xf) E('La entrega no existe.');
        FOT.push({ id: ++seq.fot, entrega_id: xf.id, momento: v.momento || 'Seguimiento', archivo: guardarImg(v.foto, 'entrega'), creado_por: uid, creado_en: ahora() });
        r(uid, 'entrega', xf.id, xf.evento_id, 'Agregó foto (' + (v.momento || 'Seguimiento') + ')', xf.empresa); return {};
      case 'entrega_ubicacion':
        var xu = ENT.find(function (k) { return k.id === +v.id; }); if (!xu) E('La entrega no existe.');
        if (!t(v.ubicacion) || t(v.ubicacion) === xu.ubicacion) E('Escriba la nueva ubicación.');
        r(uid, 'entrega', xu.id, xu.evento_id, 'Cambió la ubicación del instrumental', '«' + xu.ubicacion + '» → «' + t(v.ubicacion) + '»'); xu.ubicacion = t(v.ubicacion, 500); return {};
      case 'entrega_devolver':
        var xd = ENT.find(function (k) { return k.id === +v.id; }); if (!xd) E('La entrega no existe.');
        ['dev_entrega_nombre', 'dev_entrega_cedula', 'dev_recibe_nombre', 'dev_recibe_cedula'].forEach(function (k) { if (!t(v[k])) E('Faltan nombres y cédulas de la devolución.'); });
        if (!v.dev_entrega_firma || !v.dev_recibe_firma) E('Faltan las firmas de la devolución.');
        Object.assign(xd, { estado: 'Devuelto', dev_fecha_hora: ahora(), dev_entrega_id: uid, dev_entrega_nombre: t(v.dev_entrega_nombre), dev_entrega_cedula: t(v.dev_entrega_cedula),
          dev_entrega_firma: guardarImg(v.dev_entrega_firma, 'firma'), dev_recibe_nombre: t(v.dev_recibe_nombre), dev_recibe_cedula: t(v.dev_recibe_cedula), dev_recibe_firma: guardarImg(v.dev_recibe_firma, 'firma'), dev_obs: t(v.dev_obs) });
        (v.fotos || []).forEach(function (f) { FOT.push({ id: ++seq.fot, entrega_id: xd.id, momento: 'Devolución', archivo: guardarImg(f, 'entrega'), creado_por: uid, creado_en: ahora() }); });
        r(uid, 'entrega', xd.id, xd.evento_id, 'Registró devolución a la empresa', xd.empresa); return {};
      case 'bitacora':
        return { bitacora: clone(BIT.slice().reverse().map(function (b) { var o = clone(b); var x = EV.find(function (k) { return k.id === b.evento_id; }); o.evento_titulo = x ? x.titulo : null; return o; })) };
      case 'usuario_guardar':
        admin(); if (!t(v.nombre) || !t(v.usuario)) E('Nombre y usuario son obligatorios.');
        if (+v.id) { var uu = U.find(function (k) { return k.id === +v.id; }); Object.assign(uu, { nombre: t(v.nombre), usuario: t(v.usuario).toLowerCase(), cedula: t(v.cedula), activo: uu.rol === 'admin' ? 1 : (v.activo ? 1 : 0) }); r(uid, 'usuario', uu.id, null, 'Actualizó usuario', uu.nombre); }
        else { var nu = { id: U.length + 1, usuario: t(v.usuario).toLowerCase(), nombre: t(v.nombre), cedula: t(v.cedula), rol: 'instrumentador', activo: 1, debe_cambiar: 0 }; U.push(nu); r(uid, 'usuario', nu.id, null, 'Creó usuario', nu.nombre + ' (en la vista previa su contraseña es «demo»)'); }
        return {};
      case 'usuario_clave': admin(); r(uid, 'usuario', +v.id, null, 'Asignó nueva contraseña', nombre(v.id) + ' (simulado en la vista previa)'); return {};
      case 'sala_guardar':
        admin(); var sa = SALAS.find(function (k) { return k.id === +v.id; });
        if (!t(v.nombre) || +v.ancho < 300 || +v.largo < 300 || +v.ancho > 5000 || +v.largo > 5000) E('Revise nombre y medidas (entre 3 y 50 metros).');
        Object.assign(sa, { nombre: t(v.nombre, 80), ancho: +v.ancho, largo: +v.largo, notas: t(v.notas) });
        if (v.plano) sa.plano = clone(v.plano); if (v.base) sa.base = clone(v.base);
        r(uid, 'sala', sa.id, null, 'Modificó la sala ' + sa.nombre, v.plano ? 'Plano arquitectónico actualizado' : v.base ? 'Distribución base actualizada' : 'Nombre y medidas'); return {};
      case 'catalogo_guardar':
        admin(); if (!t(v.nombre)) E('Escriba el nombre del elemento.');
        var d2 = { nombre: t(v.nombre), forma: v.forma, ancho: Math.max(20, Math.min(600, +v.ancho)), largo: Math.max(20, Math.min(600, +v.largo)), color: v.color, activo: v.activo ? 1 : 0 };
        if (+v.id) Object.assign(CAT.find(function (k) { return k.id === +v.id; }), d2); else CAT.push(Object.assign({ id: CAT.length + 1, orden: 99 }, d2));
        r(uid, 'catalogo', +v.id || CAT.length, null, +v.id ? 'Actualizó elemento del catálogo' : 'Agregó elemento al catálogo', d2.nombre); return {};
      case 'plantilla_guardar':
        admin(); if (!t(v.nombre)) E('Escriba el nombre de la lista.');
        var itp = (v.items || []).filter(function (i) { return t(i.texto); }); if (!itp.length) E('La lista necesita al menos un ítem.');
        if (+v.id) Object.assign(PLANT.find(function (k) { return k.id === +v.id; }), { nombre: t(v.nombre), items: clone(itp) });
        else PLANT.push({ id: PLANT.length ? PLANT[PLANT.length - 1].id + 1 : 1, nombre: t(v.nombre), items: clone(itp) });
        r(uid, 'plantilla', +v.id || null, null, +v.id ? 'Actualizó lista de verificación' : 'Creó lista de verificación', t(v.nombre)); return {};
      case 'plantilla_borrar':
        admin(); var pb = PLANT.find(function (k) { return k.id === +v.id; }); PLANT.splice(PLANT.indexOf(pb), 1); r(uid, 'plantilla', pb.id, null, 'Eliminó lista de verificación', pb.nombre); return {};
    }
    E('Acción no reconocida.', 404);
  }

  var fetchReal = window.fetch;
  window.fetch = function (url, init) {
    if (typeof url !== 'string' || url.indexOf('api.php') !== 0) return fetchReal.apply(this, arguments);
    var qs = url.split('?')[1] || '', q = {};
    qs.split('&').forEach(function (p) { var kv = p.split('='); q[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); });
    var body = {}; try { body = init && init.body ? JSON.parse(init.body) : {}; } catch (e) {}
    var st = 200, out;
    try { out = manejar(q.a, q, body); out.ok = true; }
    catch (e) { if (e && e.body) { st = e.st; out = e.body; } else { st = 500; out = { ok: false, error: typeof e === 'string' ? e : 'Error en la vista previa: ' + (e && e.message) }; } }
    return new Promise(function (ok) { setTimeout(function () { ok(new Response(JSON.stringify(out), { status: st, headers: { 'Content-Type': 'application/json' } })); }, 60); });
  };

  // ---------------------------------------------------------------- informe (versión en pantalla)
  function h(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function archivo(f) { if (!f) return ''; if (f.indexOf('estatica:') === 0) return f.slice(9); return ARCH[f] || ''; }
  var MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function fl(f) { var p = f.split('-'); return +p[2] + ' de ' + MES[+p[1] - 1] + ' de ' + p[0]; }
  function fm(m) { return m ? fl(m.slice(0, 10)) + ' · ' + m.slice(11, 16) : '—'; }
  function informe(id) {
    var e = EV.find(function (x) { return x.id === +id; }); if (!e || e.estado !== 'cerrado') return;
    var s = SALAS.find(function (x) { return x.id === e.sala_id; });
    var ver = VER.filter(function (x) { return x.evento_id === e.id; }), nov = NOV.filter(function (x) { return x.evento_id === e.id; }), ent = ENT.filter(function (x) { return x.evento_id === e.id; });
    var bit = BIT.filter(function (b) { return b.evento_id === e.id; });
    var cnt = { ok: 0, no: 0, na: 0, pendiente: 0 }; ver.forEach(function (x) { cnt[x.estado]++; });
    var EST = { ok: 'Cumple', no: 'No cumple', na: 'No aplica', pendiente: 'Pendiente' };
    var num = 'EQ-' + e.fecha.slice(0, 4) + '-' + ('000' + e.id).slice(-4);
    var kv = function (k, v) { return '<div><span>' + h(k) + '</span><b>' + h(v) + '</b></div>'; };
    var firma = function (f, n, sub) { return '<div class="rp-firma"><img src="' + archivo(f) + '" alt=""><b>' + h(n) + '</b><small>' + h(sub) + '</small></div>'; };
    var html = '<div class="rp-barra"><span><b>Informe ' + num + '</b> · En el hosting este informe se descarga como PDF.</span><button type="button" id="rp-x">Cerrar informe</button></div>' +
      '<article class="rp-hoja"><header class="rp-enc"><img src="assets/logo.png" alt="CLEMI"><div><h1>Informe de entrenamiento quirúrgico</h1><div class="rp-sub">Salas de Entrenamiento Quirúrgico · Instrumentación quirúrgica</div></div>' +
      '<div class="rp-n"><b>' + num + '</b>Generado ' + fm(ahora()) + '<br>por ' + h(YO.nombre) + '</div></header>' +
      '<div class="rp-t">' + h(e.titulo) + '</div><div class="rp-g">' + h(s.nombre) + ' · ' + fl(e.fecha) + ' · ' + e.hora_ini + ' a ' + e.hora_fin + '</div>' +
      '<h2><span>1</span>Datos del evento</h2><div class="rp-kv">' + kv('Sala', s.nombre) + kv('Fecha', fl(e.fecha)) + kv('Horario programado', e.hora_ini + ' – ' + e.hora_fin) +
        kv('Instrumentador a cargo', nombre(e.responsable_id)) + kv('Apoyo', (e.apoyo || []).map(nombre).join(', ') || '—') + kv('Especialidad', e.especialidad || '—') +
        kv('Empresa / organizador', e.empresa || '—') + kv('Participantes', e.participantes || '—') + kv('Componentes anatómicos', e.componentes || '—') +
        kv('Creado', nombre(e.creado_por) + ' · ' + fm(e.creado_en)) + kv('Inicio real', e.iniciado_en ? fm(e.iniciado_en) : 'No registrado') + kv('Cierre', fm(e.cierre_en)) + '</div>' +
      '<h2><span>2</span>Verificación</h2>' + (ver.length ? '<div class="rp-res"><span>' + ver.length + ' ítems</span><span class="st-ok">' + cnt.ok + ' cumplen</span><span class="st-no">' + cnt.no + ' no cumplen</span><span>' + cnt.na + ' no aplican</span><span class="st-pendiente">' + cnt.pendiente + ' pendientes</span></div>' +
        '<table><thead><tr><th>Momento</th><th>Ítem</th><th>Resultado</th><th>Observación</th><th>Verificó</th></tr></thead><tbody>' + ver.map(function (x) {
          return '<tr><td>' + h(x.fase) + '</td><td>' + h(x.texto) + '</td><td class="st-' + x.estado + '">' + EST[x.estado] + '</td><td>' + h(x.obs) + '</td><td>' + (x.marcado_por ? h(nombre(x.marcado_por)) + '<br><small>' + x.marcado_en.slice(11, 16) + '</small>' : '—') + '</td></tr>';
        }).join('') + '</tbody></table>' : '<p>No se registraron ítems de verificación.</p>') +
      '<h2><span>3</span>Distribución final de la sala</h2><div class="rp-plano">' + window.Plano.svg({ sala: s, plano: s.plano, items: e.layout, catalogo: CAT }) + '</div>' +
      '<div class="rp-res">' + window.Plano.resumen(e.layout, CAT).map(function (x) { return '<span>' + x.n + ' × ' + h(x.nombre) + '</span>'; }).join('') + '</div>' +
      '<h2><span>4</span>Novedades del entrenamiento</h2>' + (nov.length ? '<table><thead><tr><th>Hora</th><th>Tipo</th><th>Descripción</th><th>Registró</th></tr></thead><tbody>' + nov.map(function (n) {
          return '<tr><td>' + n.creado_en.slice(11, 16) + '</td><td>' + h(n.tipo) + '</td><td>' + h(n.texto) + (n.foto ? '<div class="rp-fotos"><img src="' + archivo(n.foto) + '" alt=""></div>' : '') + '</td><td>' + h(nombre(n.creado_por)) + '</td></tr>';
        }).join('') + '</tbody></table>' : '<p>No se registraron novedades.</p>') +
      '<h2><span>5</span>Control de instrumental y equipos</h2>' + (ent.length ? ent.map(function (x) {
          var fs = FOT.filter(function (f) { return f.entrega_id === x.id; });
          return '<div class="rp-ent"><h3>' + h(x.empresa) + ' <small>· Entrega Nº ' + x.id + ' · ' + fm(x.fecha_hora) + ' · ' + h(x.estado) + '</small></h3><table><thead><tr><th>Descripción</th><th>Ref. / lote</th><th>Cant.</th><th>Estado</th></tr></thead><tbody>' +
            x.items.map(function (i) { return '<tr><td>' + h(i.desc) + '</td><td>' + h(i.ref || '—') + '</td><td>' + i.cant + '</td><td>' + h(i.estado) + '</td></tr>'; }).join('') + '</tbody></table>' +
            '<p><b>Ubicación:</b> ' + h(x.ubicacion) + '</p><div class="rp-firmas">' + firma(x.entrega_firma, x.entrega_nombre, 'C.C. ' + x.entrega_cedula + ' · Entrega') + firma(x.recibe_firma, x.recibe_nombre, 'C.C. ' + x.recibe_cedula + ' · Recibe (CLEMI)') + '</div>' +
            (x.estado === 'Devuelto' ? '<p><b>Devolución:</b> ' + fm(x.dev_fecha_hora) + '</p><div class="rp-firmas">' + firma(x.dev_entrega_firma, x.dev_entrega_nombre, 'Devuelve (CLEMI)') + firma(x.dev_recibe_firma, x.dev_recibe_nombre, 'Recibe (' + x.empresa + ')') + '</div>' : '') +
            (fs.length ? '<div class="rp-fotos">' + fs.map(function (f) { return '<img src="' + archivo(f.archivo) + '" alt="">'; }).join('') + '</div>' : '') + '</div>';
        }).join('') : '<p>No se registraron entregas de instrumental asociadas a este evento.</p>') +
      '<h2><span>6</span>Bitácora completa del evento</h2><table><thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Acción y detalle</th></tr></thead><tbody>' + bit.map(function (b) {
          return '<tr><td>' + b.momento + '</td><td>' + h(b.usuario_nombre) + '</td><td><b>' + h(b.accion) + '</b>' + (b.detalle ? '<div class="rp-det">' + h(b.detalle) + '</div>' : '') + '</td></tr>';
        }).join('') + '</tbody></table>' +
      '<h2><span>7</span>Cierre y firma</h2><div class="rp-cierre"><div><p>El instrumentador a cargo confirma la finalización del entrenamiento y que la información registrada es correcta.</p>' +
        (e.cierre_obs ? '<p><b>Observaciones de cierre:</b> ' + h(e.cierre_obs) + '</p>' : '') + '<p class="rp-g">Cerrado el ' + fm(e.cierre_en) + '</p></div>' + firma(e.cierre_firma, nombre(e.cierre_por), 'Instrumentador(a) a cargo') + '</div>' +
      '</article>';
    var ov = document.createElement('div'); ov.className = 'rp-fondo'; ov.innerHTML = html; document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    ov.querySelector('#rp-x').onclick = function () { ov.remove(); document.body.style.overflow = ''; };
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="reporte.php"]');
    if (!a) return; ev.preventDefault(); informe(a.getAttribute('href').split('id=')[1]);
  }, true);

  // ---------------------------------------------------------------- ayudas de la vista previa en el ingreso
  document.addEventListener('DOMContentLoaded', function () {
    var f = document.getElementById('form-login'); if (!f) return;
    var box = document.createElement('div'); box.className = 'demo-ingreso';
    box.innerHTML = '<b>Vista previa con datos de ejemplo</b><span>Entre con un clic. Nada se guarda: al recargar la página todo vuelve al inicio.</span><div>' +
      U.map(function (u) { return '<button type="button" class="btn btn-sm" data-u="' + u.usuario + '">' + h(u.nombre) + (u.rol === 'admin' ? ' · admin' : '') + '</button>'; }).join('') + '</div>';
    f.insertBefore(box, f.querySelector('.login-pie'));
    box.querySelectorAll('[data-u]').forEach(function (b) {
      b.onclick = function () { document.getElementById('l-usuario').value = b.getAttribute('data-u'); document.getElementById('l-clave').value = 'demo'; f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { cancelable: true })); };
    });
  });

  window.CLEMI_DEMO = { archivo: archivo };
  sembrar();
})();
