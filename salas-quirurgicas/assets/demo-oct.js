/* =====================================================================
   CLEMI · Vista previa: Administrativo (seguimiento, novedades y equipo),
   Logística (comedor, vuelos, hospedaje y traslados), Biomédica, roles del
   listado y remisiones con fecha estimada. Datos de ejemplo; nada se guarda.
   ===================================================================== */
(function () {
  'use strict';
  var D = window.CLEMI_DEMO, X = D.ctx, I = D.CTI, TH = D.TH;
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function E(msg, st) { throw { st: st || 400, body: { ok: false, error: msg } }; }
  function t(x, n) { return String(x == null ? '' : x).trim().slice(0, n || 4000); }
  function dia(n) { return X.dia(n); }
  function ahora() { return X.ahora(); }

  // ---------------------------------------------------------------- accesos nuevos
  I.AREAS.administrativo = ['ad']; I.AREAS.biomedica = ['bm'];
  ['ad', 'lg', 'bm'].forEach(function (a) { if (I.AREAS.admin.indexOf(a) < 0) I.AREAS.admin.push(a); });
  function addU(o) { var x = X.U.find(function (u) { return u.usuario === o.usuario; }); if (x) return x.id; o.id = X.U.reduce(function (m, u) { return Math.max(m, u.id); }, 0) + 1; X.U.push(Object.assign({ cedula: '', activo: 1, debe_cambiar: 0, areas_extra: '' }, o)); return o.id; }
  var idSeb = addU({ usuario: 'sebastian.hernandez', nombre: 'Sebastián Hernández', rol: 'administrativo' });
  var idTer = addU({ usuario: 'teresa.cuellar', nombre: 'Teresa Cuéllar', rol: 'instrumentador', areas_extra: 'bm' });
  var idLui = addU({ usuario: 'luisa.gomez', nombre: 'Luisa Gómez', rol: 'biomedica' });
  var jh = X.U.find(function (u) { return u.usuario === 'julieth.hernandez'; });
  if (jh && !/(^|,)lg(,|$)/.test(jh.areas_extra || '')) jh.areas_extra = (jh.areas_extra ? jh.areas_extra + ',' : '') + 'lg';
  var BAS = ['yo', 'logout', 'cambiar_clave', 'base', 'tick', 'bitacora'];
  I.PERM.administrativo = BAS.concat(['adm_seguimiento', 'adm_novedades', 'adm_equipo', 'prep_lista', 'planes', 'plan', 'eventos', 'evento', 'contrato_archivo_ver']);
  I.PERM.biomedica = BAS.concat(['bio_inventario', 'bio_guardar', 'prep_lista', 'prep_estado', 'planes', 'plan']);
  function areasDe(u) { var a = (I.AREAS[u.rol] || ['op']).slice(); String(u.areas_extra || '').split(',').forEach(function (x) { if (x && a.indexOf(x) < 0) a.push(x); }); return a; }
  function tiene(YO, a) { var u = X.U.find(function (k) { return k.id === YO.id; }) || YO; return YO.rol === 'admin' || areasDe(u).indexOf(a) >= 0; }

  // Talento Humano: personas nuevas y vínculos
  if (TH) {
    var luisa = TH.P.find(function (p) { return p.nombres === 'Luisa'; }); if (luisa) luisa.usuario_id = idLui;
    var base = TH.P[0], nid = TH.P.reduce(function (m, p) { return Math.max(m, p.id); }, 0);
    [['Teresa', 'Cuéllar', 'Operaciones', 'Instrumentación', 'Líder de instrumentadores', idTer], ['Sebastián', 'Hernández', 'Administrativa', 'Subdirección', 'Seguimiento administrativo · a cargo de Servicios generales y Mantenimiento', idSeb]].forEach(function (x) {
      if (TH.P.some(function (p) { return p.nombres === x[0] && p.apellidos === x[1]; })) return;
      var p = Object.assign(clone(base), { id: ++nid, nombres: x[0], apellidos: x[1], area: x[2], subarea: x[3], cargo: x[4], telefono: '', correo: '', correo_personal: '', usuario_id: x[5], tallas: {}, observaciones: 'Registrado al crear su acceso.' });
      TH.P.push(p); TH.asignar(p);
    });
  }

  // ---------------------------------------------------------------- listados: roles, dietas y restricciones de ejemplo
  var futuros = X.EV.filter(function (e) { return e.estado !== 'cancelado' && (e.fecha_fin || e.fecha) >= dia(-1); }).sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
  X.INS.forEach(function (i) { if (!i.rol) i.rol = 'Participante'; if (!i.dietas) i.dietas = []; if (i.restriccion == null) i.restriccion = ''; });
  var evL = futuros.find(function (e) { return X.INS.some(function (i) { return i.evento_id === e.id; }); }) || futuros[0];
  var maxIns = function () { return X.INS.reduce(function (m, i) { return Math.max(m, i.id); }, 0); };
  if (evL) {
    [['Instructor', 'Andrés', 'Valencia (ejemplo)', 'Hospital San Ignacio', ['Sin gluten'], ''], ['Instructor', 'Mariana', 'Pérez (ejemplo)', 'Clínica del Country', [], ''], ['Staff', 'Camilo', 'Rojas (ejemplo)', 'Casa comercial', ['Vegetariano'], '']].forEach(function (x, k) {
      X.INS.push({ id: maxIns() + 1, evento_id: evL.id, codigo: 'D' + (9100 + k), rol: x[0], nombre: x[1], apellido: x[2], tipo_doc: 'CC', documento: String(79000000 + k), especialidad: x[0] === 'Instructor' ? 'Ortopedia' : 'Coordinación', institucion: x[3], correo: '', telefono: '300000000' + k, estacion: '', nota: '', origen: 'Manual', dietas: x[4], restriccion: x[5], creado_en: ahora() });
    });
    var ps = X.INS.filter(function (i) { return i.evento_id === evL.id && i.rol === 'Participante'; });
    if (ps[0]) ps[0].restriccion = 'Alergia al maní'; if (ps[1]) ps[1].dietas = ['Sin lactosa'];
  }
  var CO = [], VU = [], HO = [], TR = [], sq = { v: 0, h: 0, t: 0 }, LOGOS = {};
  var HOT = { ibis: { nombre: 'Hotel IBIS', color: '#C8102E', fondo: '#ffffff' }, sabana: { nombre: 'Sabana Park', color: '#2E6B3F', fondo: '#ffffff' }, b3: { nombre: 'Hotel B3', color: '#111111', fondo: '#F2C230' }, popart: { nombre: 'Hotel PopArt', color: '#E4007C', fondo: '#ffffff' }, otros: { nombre: 'Otros', color: '#4A5568', fondo: '#EEF1F5', otro: true } };
  var COM = { desayuno: 'Desayuno', refrigerio_am: 'Refrigerio AM', almuerzo: 'Almuerzo', refrigerio_pm: 'Refrigerio PM', cena: 'Cena' };
  var DIETAS = ['Vegetariano', 'Vegano', 'Sin gluten', 'Sin lactosa', 'Sin cerdo', 'Sin mariscos', 'Diabético', 'Kosher', 'Halal'];
  var LUG = ['CLEMI', 'Aeropuerto El Dorado', 'Hotel IBIS', 'Sabana Park', 'Hotel B3', 'Hotel PopArt', 'Otro'], VEST = ['Programado', 'Confirmado', 'En vuelo', 'Aterrizó', 'Retrasado', 'Cancelado'];
  if (evL) {
    var ins = X.INS.filter(function (i) { return i.evento_id === evL.id && i.rol !== 'Participante'; });
    if (ins[0]) { VU.push({ id: ++sq.v, evento_id: evL.id, inscrito_id: ins[0].id, sentido: 'Llegada', aerolinea: 'Avianca', numero: 'AV9445', ciudad: 'Medellín', fecha_hora: (evL.fecha < dia(0) ? dia(0) : X.dia(0)) + ' 18:30', estado: 'Confirmado', obs: '', actualizado_por: 'Julieth Hernández', actualizado_en: ahora() });
      HO.push({ id: ++sq.h, evento_id: evL.id, inscrito_id: ins[0].id, hotel: 'ibis', check_in: addD(evL.fecha, -1), check_out: addD(evL.fecha_fin || evL.fecha, 1), habitacion: '504', reserva: 'IB-778', obs: '' }); }
    if (ins[1]) HO.push({ id: ++sq.h, evento_id: evL.id, inscrito_id: ins[1].id, hotel: 'sabana', check_in: addD(evL.fecha, -1), check_out: addD(evL.fecha_fin || evL.fecha, 1), habitacion: '210', reserva: 'SP-3321', obs: '' });
    if (ins[0]) TR.push({ id: ++sq.t, evento_id: evL.id, fecha_hora: evL.fecha + ' 06:30', origen: 'Hotel IBIS', destino: 'CLEMI', vehiculo: 'Van · ABC123', conductor: 'Conductor de ejemplo', telefono: '3100000000', capacidad: 12, pasajeros: ins.map(function (i) { return i.id; }), estado: 'Programado', obs: '' });
  }
  function addD(f, n) { var d = new Date(f + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  // Remisiones: fecha estimada de ejemplo
  X.ENT.forEach(function (r, k) { if (!r.fecha_estimada) { r.fecha_estimada = addD((r.fecha_hora || ahora()).slice(0, 10), 3 + k); r.fecha_estimada_tipo = 'Devolución'; } });

  function per(id) { return X.INS.find(function (i) { return i.id === +id; }); }
  function ev(id) { var e = X.EV.find(function (x) { return x.id === +id; }); if (!e) E('El entrenamiento no existe.', 404); return e; }
  function convDe(e) { return I.CT.find(function (c) { return c.evento_id === e.id; }); }
  function convNom(c) { return c.nombre_convenio || ('Convenio ' + c.cliente + ' · ' + c.curso); }
  function reg(acc, det, evId) { var YO = X.yo(); X.BIT.push({ id: X.BIT.length ? X.BIT[X.BIT.length - 1].id + 1 : 1, momento: ahora(), usuario_id: YO.id, usuario_nombre: YO.nombre, entidad: 'logistica', entidad_id: null, evento_id: evId || null, accion: acc, detalle: det || '' }); }

  function manejar(a, q, v, YO) {
    if (/^lg_/.test(a) && !tiene(YO, 'lg')) E('Logística: sin acceso a esta sección.', 403);
    if (/^adm_/.test(a) && !tiene(YO, 'ad')) E('Administrativo: sin acceso a esta sección.', 403);
    var e, x, d;
    switch (a) {
      case 'lg_resumen':
        var hoy = dia(0);
        return { eventos: futuros.map(function (e2) {
          var L = X.INS.filter(function (i) { return i.evento_id === e2.id && !i.anulado; }), c = convDe(e2);
          return { id: e2.id, titulo: e2.titulo, empresa: e2.empresa, sala_id: e2.sala_id, fecha: e2.fecha, fecha_fin: e2.fecha_fin || e2.fecha, sala_nombre: (X.SALAS.find(function (s) { return s.id === e2.sala_id; }) || {}).nombre, estado: e2.estado,
            personas: L.length, participantes: L.filter(function (i) { return i.rol === 'Participante'; }).length, instructores: L.filter(function (i) { return i.rol === 'Instructor'; }).length, staff: L.filter(function (i) { return i.rol === 'Staff'; }).length,
            con_restriccion: L.filter(function (i) { return (i.dietas || []).length || i.restriccion; }).length, vuelos: VU.filter(function (z) { return z.evento_id === e2.id; }).length, hospedajes: HO.filter(function (z) { return z.evento_id === e2.id; }).length,
            transportes: TR.filter(function (z) { return z.evento_id === e2.id; }).length, convenio_codigo: c ? c.codigo : null, convenio: c ? convNom(c) : null };
        }), hoy: hoy, hoteles: HOT, logos: LOGOS, comidas: COM, dietas: DIETAS, lugares: LUG, vuelo_estados: VEST, roles: ['Participante', 'Instructor', 'Staff'],
          vuelos_hoy: VU.filter(function (z) { return z.fecha_hora.slice(0, 10) >= hoy && z.fecha_hora.slice(0, 10) <= dia(1); }).map(function (z) { var p = per(z.inscrito_id) || {}; return Object.assign(clone(z), { nombre: p.nombre, apellido: p.apellido, rol: p.rol, titulo: ev(z.evento_id).titulo }); }),
          hosp_hotel: Object.keys(HOT).map(function (k) { return { hotel: k, n: HO.filter(function (h) { return h.hotel === k && h.check_out >= hoy; }).length }; }).filter(function (h) { return h.n; }) };
      case 'lg_evento':
        e = ev(q.id); var cv = convDe(e);
        return { evento: { id: e.id, titulo: e.titulo, empresa: e.empresa, sala: (X.SALAS.find(function (s) { return s.id === e.sala_id; }) || {}).nombre, fecha: e.fecha, fecha_fin: e.fecha_fin || e.fecha, estado: e.estado, convenio: cv ? { id: cv.id, codigo: cv.codigo, nombre: convNom(cv) } : null },
          dias: clone(e.dias || [{ fecha: e.fecha }]), personas: clone(X.INS.filter(function (i) { return i.evento_id === e.id; }).sort(function (p1, p2) { var o = { Instructor: 1, Staff: 2, Participante: 3 }; return (o[p1.rol] || 3) - (o[p2.rol] || 3); })),
          comidas_reg: clone(CO.filter(function (z) { return z.evento_id === e.id; })), vuelos: clone(VU.filter(function (z) { return z.evento_id === e.id; })), hospedajes: clone(HO.filter(function (z) { return z.evento_id === e.id; })),
          transportes: clone(TR.filter(function (z) { return z.evento_id === e.id; })), hoteles: HOT, logos: LOGOS, comidas: COM, dietas: DIETAS, lugares: LUG, vuelo_estados: VEST, roles: ['Participante', 'Instructor', 'Staff'] };
      case 'lg_persona_guardar':
        x = per(v.id); if (!x) E('La persona no está en este listado.');
        x.rol = ['Participante', 'Instructor', 'Staff'].indexOf(v.rol) >= 0 ? v.rol : x.rol; x.dietas = (v.dietas || []).filter(function (k) { return DIETAS.indexOf(k) >= 0; }); x.restriccion = t(v.restriccion, 500);
        reg('Actualizó alimentación de ' + x.nombre + ' ' + x.apellido, x.dietas.join(', '), x.evento_id); return {};
      case 'lg_comida':
        e = ev(v.evento_id); var ids = +v.inscrito_id ? [+v.inscrito_id] : X.INS.filter(function (i) { return i.evento_id === e.id && !i.anulado; }).map(function (i) { return i.id; });
        ids.forEach(function (i) { CO = CO.filter(function (z) { return !(z.inscrito_id === i && z.fecha === v.fecha && z.comida === v.comida); }); if (+v.entregado) CO.push({ inscrito_id: i, evento_id: e.id, fecha: v.fecha, comida: v.comida, entregado_por: X.yo().nombre, entregado_en: ahora() }); });
        return {};
      case 'lg_vuelo_guardar':
        e = ev(v.evento_id); if (!per(v.inscrito_id)) E('Elija la persona.'); if (!v.fecha_hora) E('Indique la fecha y hora del vuelo.');
        d = { evento_id: e.id, inscrito_id: +v.inscrito_id, sentido: v.sentido === 'Salida' ? 'Salida' : 'Llegada', aerolinea: t(v.aerolinea, 60), numero: t(v.numero, 12).replace(/\s+/g, '').toUpperCase(), ciudad: t(v.ciudad, 80), fecha_hora: String(v.fecha_hora).replace('T', ' ').slice(0, 16), estado: VEST.indexOf(v.estado) >= 0 ? v.estado : 'Programado', obs: t(v.obs, 500), actualizado_por: X.yo().nombre, actualizado_en: ahora() };
        if (+v.id) Object.assign(VU.find(function (z) { return z.id === +v.id; }), d); else { d.id = ++sq.v; VU.push(d); } return {};
      case 'lg_hosp_guardar':
        e = ev(v.evento_id); if (!per(v.inscrito_id)) E('Elija la persona.'); if (!HOT[v.hotel]) E('Elija el hotel.'); if (!v.check_in || !v.check_out || v.check_out < v.check_in) E('Revise las fechas de ingreso y salida del hotel.');
        if (v.hotel === 'otros' && t(v.lugar).length < 3) E('Escriba dónde se hospeda la persona (nombre del lugar y dirección).');
        d = { evento_id: e.id, inscrito_id: +v.inscrito_id, hotel: v.hotel, lugar: v.hotel === 'otros' ? t(v.lugar, 160) : '', check_in: v.check_in, check_out: v.check_out, habitacion: t(v.habitacion, 40), reserva: t(v.reserva, 60), obs: t(v.obs, 500) };
        if (+v.id) Object.assign(HO.find(function (z) { return z.id === +v.id; }), d); else { d.id = ++sq.h; HO.push(d); } return {};
      case 'lg_hosp_importar':
        e = ev(v.evento_id); var nn = 0, act = 0, sin = [], mal = 0;
        var fecha = function (x) { x = t(x); var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(x); if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2); m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/.exec(x); if (m) { var a2 = +m[3]; if (a2 < 100) a2 += 2000; return a2 + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2); } return ''; };
        (v.filas || []).forEach(function (f, i) {
          var doc = t(f.documento).replace(/\D/g, ''), nom = t(f.nombre).toLowerCase();
          var pp = X.INS.find(function (k) { return k.evento_id === e.id && ((doc && String(k.documento).replace(/\D/g, '') === doc) || (nom && (k.nombre + ' ' + k.apellido).toLowerCase().trim() === nom)); });
          if (!pp) { sin.push(t(f.nombre) || t(f.documento) || 'Fila ' + (i + 2)); return; }
          var hx = t(f.hotel).toLowerCase(), ho = /ibis/.test(hx) ? 'ibis' : /sabana/.test(hx) ? 'sabana' : /b3/.test(hx) ? 'b3' : /pop/.test(hx) ? 'popart' : hx ? 'otros' : (t(f.lugar) ? 'otros' : ''), lu = ho === 'otros' ? (t(f.lugar) || t(f.hotel)) : '';
          var ci = fecha(f.check_in) || e.fecha, co = fecha(f.check_out) || e.fecha_fin || e.fecha; if (!ho || co < ci) { mal++; return; }
          var dd = { evento_id: e.id, inscrito_id: pp.id, hotel: ho, lugar: lu, check_in: ci, check_out: co, habitacion: t(f.habitacion, 40), reserva: t(f.reserva, 60), obs: t(f.obs, 500) };
          var ex = HO.find(function (z) { return z.evento_id === e.id && z.inscrito_id === pp.id; }); if (ex) { Object.assign(ex, dd); act++; } else { dd.id = ++sq.h; HO.push(dd); nn++; }
        });
        return { nuevos: nn, actualizados: act, sin_persona: sin.slice(0, 30), n_sin: sin.length, incompletas: mal };
      case 'lg_transp_guardar':
        e = ev(v.evento_id); if (!v.fecha_hora) E('Indique la fecha y hora del traslado.'); if (!v.origen || !v.destino || v.origen === v.destino) E('Elija el origen y el destino (deben ser distintos).');
        var pax = (v.pasajeros || []).map(Number), cap = +v.capacidad || 0; if (cap && pax.length > cap) E('Hay ' + pax.length + ' pasajeros y el vehículo tiene capacidad para ' + cap + '.');
        d = { evento_id: e.id, fecha_hora: String(v.fecha_hora).replace('T', ' ').slice(0, 16), origen: v.origen, destino: v.destino, vehiculo: t(v.vehiculo, 80), conductor: t(v.conductor, 120), telefono: t(v.telefono, 40), capacidad: cap, pasajeros: pax, estado: v.estado || 'Programado', obs: t(v.obs, 500) };
        if (+v.id) Object.assign(TR.find(function (z) { return z.id === +v.id; }), d); else { d.id = ++sq.t; TR.push(d); } return {};
      case 'lg_borrar':
        var arr = { vuelo: VU, hosp: HO, transp: TR }[v.tipo]; if (!arr) E('Tipo no válido.'); x = arr.find(function (z) { return z.id === +v.id; }); if (x) arr.splice(arr.indexOf(x), 1); return {};
      case 'adm_seguimiento':
        var hoy2 = dia(0), todos = !!q.todos;
        return { hoy: hoy2, convenios: I.CT.filter(function (c) { return todos || (c.estado !== 'Cancelado' && c.estado !== 'Finalizado' && c.fecha_fin >= dia(-1)); }).sort(function (c1, c2) { return c1.fecha_inicio < c2.fecha_inicio ? -1 : 1; }).map(function (c) {
          var et = c.estado === 'Cancelado' ? 0 : c.estado === 'Finalizado' ? 5 : (c.firma_estado === 'firmado' || c.estado === 'Contratado') ? 4 : (c.ppto_estado === 'aceptado' || /por_firmar/.test(c.firma_estado || '')) ? 3 : (c.ppto_estado === 'solicitado' || c.ppto_estado === 'emitido') ? 2 : 1;
          var prep = {};
          I.PPL.filter(function (l) { return l.contrato_id === c.id; }).forEach(function (l) {
            var it = l.item_id ? I.PPI.find(function (k) { return k.id === l.item_id; }) : null, ar = l.area || (it && it.area) || ({ 'Audiovisuales': 'Audiovisual', 'Fotografía y diseño': 'Audiovisual', 'Componentes anatómicos': 'Morgue', 'Instrumental': 'Instrumentación', 'Equipos': 'Biomédica', 'Insumos': 'Biomédica' })[l.categoria] || 'Logística y servicios';
            var pa = ar === 'Biomédica' ? (l.categoria === 'Equipos' ? 'bm' : 'ps') : ({ 'Audiovisual': 'av', 'Morgue': 'mo', 'Instrumentación': 'op', 'Logística y servicios': 'lg' })[ar] || 'ps';
            prep[pa] = prep[pa] || { total: 0, listos: 0, no: 0 }; prep[pa].total++; if (l.prep_estado === 'Listo') prep[pa].listos++; if (l.prep_estado === 'No disponible') prep[pa].no++;
          });
          var e3 = c.evento_id ? X.EV.find(function (z) { return z.id === c.evento_id; }) : null, L = e3 ? X.INS.filter(function (i) { return i.evento_id === e3.id; }) : [];
          var ult = X.BIT.filter(function (b) { return ['contrato', 'ppto', 'plan'].indexOf(b.entidad) >= 0 && b.entidad_id === c.id; }).slice(-1)[0];
          return { id: c.id, codigo: c.codigo, nombre: convNom(c), cliente: c.cliente, curso: c.curso, sala: I.salaN(c.sala_id), fecha_inicio: c.fecha_inicio, fecha_fin: c.fecha_fin, estado: c.estado, ppto_estado: c.ppto_estado, firma_estado: c.firma_estado || '',
            plan_estado: c.plan_estado, etapa: et, responsable: c.contacto_nombre, programa: !!(I.progDe && I.progDe(c.id).length), acceso: !!c.acceso_token,
            evento: e3 ? { id: e3.id, estado: e3.estado, personas: L.length, instructores: L.filter(function (i) { return i.rol === 'Instructor'; }).length, staff: L.filter(function (i) { return i.rol === 'Staff'; }).length } : null,
            prep: prep, ultimo: ult ? { momento: ult.momento, usuario_nombre: ult.usuario_nombre, accion: ult.accion } : null };
        }) };
      case 'adm_novedades':
        var desde = dia(-(+q.dias || 60));
        return { dias: +q.dias || 60, novedades: X.NOV.filter(function (n) { return n.creado_en.slice(0, 10) >= desde; }).slice().reverse().map(function (n) {
          var e4 = X.EV.find(function (z) { return z.id === n.evento_id; }) || {}, u = X.U.find(function (k) { return k.id === n.creado_por; }) || {}, c = I.CT.find(function (k) { return k.evento_id === e4.id; });
          return { id: n.id, evento_id: n.evento_id, tipo: n.tipo, texto: n.texto, foto: n.foto, creado_por: n.creado_por, creado_en: n.creado_en, titulo: e4.titulo, empresa: e4.empresa, fecha: e4.fecha, sala_nombre: (X.SALAS.find(function (s) { return s.id === e4.sala_id; }) || {}).nombre, autor: u.nombre, autor_rol: u.rol, convenio: c ? c.codigo : null };
        }) };
      case 'adm_equipo':
        var A = ['Servicios generales', 'Mantenimiento'], anio = +dia(0).slice(0, 4);
        return { areas: A, anio: anio, equipo: (TH ? TH.P : []).filter(function (p) { return A.indexOf(p.area) >= 0 && p.estado !== 'Retirado'; }).map(function (p) {
          return { id: p.id, nombre: (p.nombres + ' ' + p.apellidos).trim(), area: p.area, subarea: p.subarea, cargo: p.cargo, telefono: p.telefono, correo: p.correo, estado: p.estado, calendario: TH.cal(p, anio) };
        }) };
      case 'entrega_fecha':
        x = X.ENT.find(function (r) { return r.id === +v.id; }); if (!x) E('La remisión no existe.'); if (x.estado !== 'En custodia') E('La remisión ya fue devuelta.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v.fecha_estimada || '')) E('Indique la fecha estimada.');
        x.fecha_estimada = v.fecha_estimada; x.fecha_estimada_tipo = v.fecha_estimada_tipo || x.fecha_estimada_tipo; return {};
    }
    return null;
  }
  D.subirLogo = function (fd) { var f = fd.get('archivo'), k = fd.get('hotel'); if (f && HOT[k]) LOGOS[k] = URL.createObjectURL(f); return Promise.resolve({ ok: true }); };

  function resp(st, out) { return new Promise(function (ok) { setTimeout(function () { ok(new Response(JSON.stringify(out), { status: st, headers: { 'Content-Type': 'application/json' } })); }, 60); }); }
  var previo = window.fetch;
  window.fetch = function (url, init) {
    if (typeof url !== 'string' || url.indexOf('api.php') !== 0) return previo.apply(this, arguments);
    var q = {}; (url.split('?')[1] || '').split('&').forEach(function (p) { var kv = p.split('='); if (kv[0]) q[decodeURIComponent(kv[0])] = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); });
    var v = {}; try { v = init && init.body ? JSON.parse(init.body) : {}; } catch (e) {}
    var YO = X.yo(), a = q.a;
    if (YO && (/^(lg_|adm_)/.test(a) || a === 'entrega_fecha')) {
      try { var r = manejar(a, q, v, YO); if (r) return resp(200, Object.assign(r, { ok: true })); } catch (e) { if (e && e.body) return resp(e.st, e.body); return resp(500, { ok: false, error: 'Error en la vista previa: ' + (e && e.message) }); }
    }
    if (YO && I.PERM[YO.rol] && I.PERM[YO.rol].indexOf(a) < 0 && ['administrativo', 'biomedica'].indexOf(YO.rol) >= 0) return resp(403, { ok: false, error: 'Su usuario no tiene acceso a esta sección.' });
    return previo.apply(this, arguments);
  };
})();
