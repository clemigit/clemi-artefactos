/* =====================================================================
   CLEMI · VISTA PREVIA — Talento Humano (personal, dotación y entregas).
   Datos de ejemplo en memoria; nada se guarda.
   ===================================================================== */
(function () {
  'use strict';
  var D = window.CLEMI_DEMO, X = D && D.ctx, I = D && D.CTI;
  if (!X || !I) return;
  var clone = X.clone, ahora = X.ahora, dia = X.dia;
  function E(m, st) { throw { st: st || 400, body: { ok: false, error: m } }; }
  function t(s, max) { return String(s == null ? '' : s).trim().slice(0, max || 2000); }

  // Talento Humano lo manejan la administradora y Julieth Hernández.
  var jh = X.U.find(function (u) { return u.usuario === 'julieth.hernandez'; }); if (jh && !/th/.test(jh.areas_extra || '')) jh.areas_extra = (jh.areas_extra ? jh.areas_extra + ',' : '') + 'th';
  function esTH(u) { var x = X.U.find(function (k) { return k.id === u.id; }) || u; return u.rol === 'admin' || u.rol === 'talento' || /(^|,)th(,|$)/.test(x.areas_extra || ''); }
  I.AREAS.talento = ['th']; if (I.AREAS.admin.indexOf('th') < 0) I.AREAS.admin.push('th');

  var AREAS = { 'Administrativa': ['Contabilidad', 'Comunicaciones', 'Subdirección'], 'Operaciones': ['Biomédica', 'Tanatología', 'Instrumentación', 'Audiovisuales'], 'Servicios generales': ['Servicios generales'], 'Mantenimiento': ['Jardín', 'Locaciones'], 'Almacén': ['Almacén'] };
  var ESTADOS = ['Activo', 'Vacaciones', 'Incapacidad', 'Licencia', 'Retirado'];
  var CONTRATOS = ['Término indefinido', 'Término fijo', 'Obra o labor', 'Prestación de servicios', 'Aprendizaje', 'Temporal'];
  var PERFILES = { general: 'Uniformes antifluidos (administrativo, operaciones y almacén)', servicios: 'Servicios generales', locaciones: 'Mantenimiento · locaciones (EPP)', jardin: 'Mantenimiento · jardín (EPP)' };
  var TT = { uniforme: 'Uniforme / camisa', pantalon: 'Pantalón', calzado: 'Calzado', guantes: 'Guantes', overol: 'Overol / ropa de trabajo', chaleco: 'Chaleco', casco: 'Casco / gorro', arnes: 'Arnés' };
  var FECHAS2 = ['06-30', '12-20'];
  var ITEMS = [
    ['general', 'Uniforme antifluido verde oscuro', 'Uniforme quirúrgico antifluido', '', 'uniforme', 1], ['general', 'Uniforme antifluido azul / gris oscuro', 'Uniforme quirúrgico antifluido', '', 'uniforme', 1],
    ['general', 'Uniforme antifluido verde oliva', 'Uniforme quirúrgico antifluido', '', 'uniforme', 1], ['general', 'Gorro antifluido', '', '', 'casco', 1], ['general', 'Tenis', '', '', 'calzado', 1], ['general', 'Placa de identificación', 'Carné / placa con nombre y cargo', '', '', 1],
    ['servicios', 'Uniforme antifluido negro', 'Juego de 3 unidades', '', 'uniforme', 3], ['servicios', 'Gorro antifluido', '', '', 'casco', 1],
    ['locaciones', 'Casco de seguridad', 'Prevenir golpes o caída de objetos', 'Cabeza', 'casco', 1], ['locaciones', 'Gafas de seguridad o careta protectora', 'Contra salpicaduras químicas, partículas o chispas', 'Ojos y cara', '', 1],
    ['locaciones', 'Tapones u orejeras', 'Zonas con niveles de ruido altos', 'Oídos', '', 1], ['locaciones', 'Mascarilla o respirador con filtros', 'Para polvo, gases o vapores orgánicos', 'Vías respiratorias', '', 1],
    ['locaciones', 'Guantes de trabajo', 'Dieléctricos, anticorte, de nitrilo o de cuero según la labor', 'Manos y brazos', 'guantes', 1], ['locaciones', 'Botas de seguridad', 'Puntera de acero y suela antideslizante o dieléctrica', 'Pies', 'calzado', 1],
    ['locaciones', 'Ropa de trabajo / overol', 'Ropa resistente de trabajo', 'Cuerpo', 'overol', 1], ['locaciones', 'Chaleco reflectivo', 'Mayor visibilidad', 'Cuerpo', 'chaleco', 1], ['locaciones', 'Arnés de seguridad con línea de vida', 'Para trabajos en alturas', 'Alturas', 'arnes', 1],
    ['jardin', 'Gafas de seguridad con protección lateral', 'Contra esquirlas, ramas, piedras pequeñas o polvo', 'Cabeza y cara', '', 1], ['jardin', 'Casco de seguridad', 'Obligatorio en poda en altura bajo árboles grandes', 'Cabeza y cara', 'casco', 1],
    ['jardin', 'Orejeras o tapones auditivos', 'Al operar cortacésped, desbrozadora o cortasetos', 'Protección auditiva', '', 1], ['jardin', 'Mascarilla antipolvo o respirador', 'Polen, polvo, esporas o residuos de poda; con filtro químico si se aplican plaguicidas', 'Protección respiratoria', '', 1],
    ['jardin', 'Guantes de trabajo', 'De cuero o alta resistencia; impermeables si se manipulan químicos o humedad', 'Manos y cuerpo', 'guantes', 1], ['jardin', 'Ropa de manga larga y pantalón largo', 'Tela densa contra sol, insectos, rasguños y savia irritante', 'Manos y cuerpo', 'overol', 1],
    ['jardin', 'Overol impermeable para fumigación', '', 'Manos y cuerpo', 'overol', 1], ['jardin', 'Botas de seguridad', 'Puntera reforzada y suela antideslizante', 'Pies', 'calzado', 1]
  ].map(function (x, i) { return { id: i + 1, perfil: x[0], nombre: x[1], detalle: x[2], zona: x[3], talla_tipo: x[4], cantidad: x[5], orden: i + 1, activo: 1 }; });
  var P = [], DOT = [], ENT = [], BIT = [], sq = { d: 0, e: 0 };
  function perfil(a, s) { return a === 'Mantenimiento' ? (s === 'Jardín' ? 'jardin' : 'locaciones') : a === 'Servicios generales' ? 'servicios' : 'general'; }
  function frec(a, s) { return 3; } // 30 abr, 31 ago y 20 dic para todo el personal (CST art. 230)
  function fechas(n, anio) { var f = n === 3 ? ['04-30', '08-31', '12-20'] : FECHAS2; return f.map(function (md, i) { return { periodo: anio + '-' + (i + 1), fecha: anio + '-' + md, n: i + 1, de: f.length }; }); }
  function nombre(p) { return (p.nombres + ' ' + p.apellidos).trim(); }
  function talla(p, tipo) { return tipo && p.tallas[tipo] ? p.tallas[tipo] : ''; }
  function asignar(p) { ITEMS.filter(function (i) { return i.perfil === perfil(p.area, p.subarea) && i.activo; }).forEach(function (i) { DOT.push({ id: ++sq.d, persona_id: p.id, item_id: i.id, cantidad: i.cantidad, talla: talla(p, i.talla_tipo), nota: '' }); }); }
  function reg(uid, pid, acc, det) { var u = X.U.find(function (k) { return k.id === uid; }); BIT.push({ id: BIT.length + 1, momento: ahora(), usuario_id: uid, usuario_nombre: u ? u.nombre : 'Sistema', entidad: 'talento', entidad_id: pid, accion: acc, detalle: det || '' }); }
  function cal(p, anio) {
    return fechas(frec(p.area, p.subarea), anio).filter(function (f) { return !p.fecha_ingreso || f.fecha >= p.fecha_ingreso; }).map(function (f) {
      var e = ENT.find(function (x) { return x.persona_id === p.id && x.periodo === f.periodo; });
      return Object.assign(f, { entrega_id: e ? e.id : null, entregada: e ? e.fecha_entrega : null, estado: e ? 'Entregada' : (f.fecha < dia(0) ? 'Vencida' : 'Pendiente') });
    });
  }
  function vista(p) { var o = clone(p); o.perfil = perfil(p.area, p.subarea); o.frecuencia = frec(p.area, p.subarea); return o; }
  // Personal de CLEMI (agenda de funcionarios)
  var AGENDA = [["Natalia", "Cogua", "direccionoperativa@clemi.edu.co", "3173005768", "Administrativa", "Subdirección", "Directora General"], ["Julieth", "Hernandez", "logistica@clemi.edu.co", "3188482044", "Administrativa", "Subdirección", "Asistente Logistica"], ["Liceth", "Sosa", "inscripciones@clemi.edu.co", "3106063286", "Administrativa", "Subdirección", "Auxiliar Administrativa"], ["Milena", "Chaves", "talentohumano@clemi.edu.co", "3125876610", "Administrativa", "Subdirección", "Recursos Humanos"], ["Yohana", "Mosucha", "analistacontable@clemi.edu.co", "3104353317", "Administrativa", "Contabilidad", "Analista Contable"], ["Catherine", "Diaz", "contabilidad@clemi.edu.co", "3046768401", "Administrativa", "Contabilidad", "Contadora"], ["Nicolas", "Camero", "comprasa@clemi.edu.co", "3012573664", "Administrativa", "Contabilidad", "Analista Compras"], ["Silvia", "Rodriguez", "direccioncomunicaciones@clemi.edu.co", "3246896990", "Administrativa", "Comunicaciones", "Direccion Comunicaciones"], ["Yefer", "Mesa", "asistentediseno@clemi.edu.co", "3113004331", "Administrativa", "Comunicaciones", "Asistente Diseño"], ["Esteban", "Lopez", "asistentesistemas@clemi.edu.co", "3157913876", "Administrativa", "Comunicaciones", "Asistente Sistemas"], ["Juan David", "Bernal", "sistemas@clemi.edu.co", "3224695593", "Administrativa", "Comunicaciones", "Ingeniero Sistemas"], ["Angely", "Suesca", "equipoinstrumentacion@clemi.edu.co", "3115748086", "Operaciones", "Instrumentación", "Instrumentador"], ["Nicolas", "Rendon", "equipoinstrumentacion@clemi.edu.co", "3108778970", "Operaciones", "Instrumentación", "Instrumentador"], ["Sergio", "Saavedra", "equipoinstrumentacion@clemi.edu.co", "3133758277", "Operaciones", "Instrumentación", "Instrumentador"], ["Laura", "Rodriguez", "equipoinstrumentacion@clemi.edu.co", "3108074506", "Operaciones", "Instrumentación", "Instrumentador"], ["Carlos", "Murillo", "coordinacionanatomia@clemi.edu.co", "3232804162", "Operaciones", "Tanatología", "Lider Tanatologia"], ["Moises", "Alcala", "equipotanatologia@clemi.edu.co", "3204285290", "Operaciones", "Tanatología", "Tanatologo"], ["Julian", "Serna", "equipotanatologia@clemi.edu.co", "3003974480", "Operaciones", "Tanatología", "Tanatologo"], ["Holman", "Anaya", "equipotanatologia@clemi.edu.co", "3133709624", "Operaciones", "Tanatología", "Tanatologo"], ["Wendy", "Cardenas", "equipotanatologia@clemi.edu.co", "3203446199", "Operaciones", "Tanatología", "Tanatologo"], ["Laura", "Andrade", "almacen@clemi.edu.co", "3196377353", "Almacén", "Almacén", "Lider Almacen IQ"], ["Osvaldo", "Naar", "auxiliaralmacen@clemi.edu.co", "3203201390", "Almacén", "Almacén", "Auxiliar Almacen"], ["Luisa", "Gomez", "biomedica@clemi.edu.co", "3015158882", "Operaciones", "Biomédica", "Ingeniera Biomedica"], ["Katherine", "Salazar", "", "3173078464", "Servicios generales", "Servicios generales", "Servicios Generales"], ["Leidys", "Tapia", "", "3116564327", "Servicios generales", "Servicios generales", "Servicios Generales"], ["Johan", "Arias", "", "3004382268", "Mantenimiento", "Jardín", "Jardinero"], ["Nelson", "Torres", "", "3022995672", "Mantenimiento", "Locaciones", "Mantenimiento"], ["Claudia", "Reyes", "directoracientifica@clemi.edu.co", "3128224334", "Administrativa", "Subdirección", "Directora Cientifica"]];
  function nrm(x) { return String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  AGENDA.forEach(function (x, i) {
    var pn = nrm(x[0]).split(' '), an = nrm(x[1]).split(' ');
    var u = X.U.find(function (k) { var un = nrm(k.nombre).split(' '); return un[0] === pn[0] && (un.length === 1 ? k.usuario === pn[0] : un[un.length - 1] === an[an.length - 1]); });
    var p = { id: i + 1, nombres: x[0], apellidos: x[1], tipo_doc: 'Cédula de ciudadanía', documento: '', fecha_nacimiento: null, sexo: '', rh: '', telefono: x[3], correo: x[2], correo_personal: '', direccion: '', ciudad: '',
      contacto_emergencia: '', tel_emergencia: '', area: x[4], subarea: x[5], cargo: x[6], tipo_contrato: '', fecha_ingreso: null, fecha_fin_contrato: null, salario: null, jornada: '',
      eps: '', afp: '', arl: '', caja: '', cesantias: '', banco: '', cuenta: '', estado: 'Activo', fecha_retiro: null, motivo_retiro: '', tallas: {}, usuario_id: u ? u.id : null,
      observaciones: 'Cargado de la agenda de funcionarios (AGENDA_CLEMI.xlsx). Completar documento, datos personales, contratación y tallas.' };
    P.push(p); asignar(p);
  });
  // ---- Eventos CLEMI
  var EV_TIPOS = ['Celebración', 'Capacitación', 'Reunión', 'Pausa activa', 'Bienestar', 'Cumpleaños', 'Fecha especial', 'Comunicado', 'Otro'], VIS = [];
  var EV = [{ id: 1, titulo: 'Plan Estratégico Integración', tipo: 'Reunión', descripcion: 'Integración de todo el equipo CLEMI alrededor del plan estratégico del año.', fecha: '2026-03-08', fecha_fin: null, hora_ini: '', hora_fin: '', lugar: '', tema: 'plan', destinatarios: ['Todos'], imagen: null, estado: 'Publicado', publicado_en: ahora(), publicado_por: 1, correos: 0, creado_por: 1, creado_en: ahora() },
    { id: 2, titulo: 'Residentes', tipo: 'Capacitación', descripcion: 'Encuentro con los residentes.', fecha: '2026-07-19', fecha_fin: null, hora_ini: '', hora_fin: '', lugar: '', tema: 'residentes', destinatarios: ['Todos'], imagen: null, estado: 'Publicado', publicado_en: ahora(), publicado_por: 1, correos: 0, creado_por: 1, creado_en: ahora() },
    { id: 3, titulo: 'Viaje CLEMI', tipo: 'Bienestar', descripcion: 'Viaje de integración del equipo CLEMI.', fecha: '2026-07-26', fecha_fin: null, hora_ini: '', hora_fin: '', lugar: '', tema: 'viaje', destinatarios: ['Todos'], imagen: null, estado: 'Publicado', publicado_en: ahora(), publicado_por: 1, correos: 0, creado_por: 1, creado_en: ahora() },
    { id: 4, titulo: 'Amor y Amistad', tipo: 'Celebración', descripcion: 'Celebración de amor y amistad.', fecha: '2026-09-20', fecha_fin: null, hora_ini: '', hora_fin: '', lugar: '', tema: 'amistad', destinatarios: ['Todos'], imagen: null, estado: 'Publicado', publicado_en: ahora(), publicado_por: 1, correos: 0, creado_por: 1, creado_en: ahora() },
    { id: 5, titulo: 'Brujitas', tipo: 'Celebración', descripcion: 'Celebración de brujitas.', fecha: '2026-11-01', fecha_fin: null, hora_ini: '', hora_fin: '', lugar: '', tema: 'brujitas', destinatarios: ['Todos'], imagen: null, estado: 'Publicado', publicado_en: ahora(), publicado_por: 1, correos: 0, creado_por: 1, creado_en: ahora() },
    { id: 6, titulo: 'Despedida CLEMI', tipo: 'Celebración', descripcion: 'Despedida de fin de año del equipo CLEMI.', fecha: '2026-12-18', fecha_fin: null, hora_ini: '', hora_fin: '', lugar: '', tema: 'despedida', destinatarios: ['Todos'], imagen: null, estado: 'Publicado', publicado_en: ahora(), publicado_por: 1, correos: 0, creado_por: 1, creado_en: ahora() }];
  function para(dest, a, s) { return dest.some(function (d) { return d === 'Todos' || d === a || (s && d === a + '/' + s); }); }
  function destTxt(dest) { return dest.indexOf('Todos') >= 0 ? 'Todo el personal' : dest.map(function (d) { return d.replace('/', ' · '); }).join(', '); }
  function areaUsuario(u) { var pp = P.find(function (k) { return k.usuario_id === u.id && k.estado !== 'Retirado'; }); if (pp) return [pp.area, pp.subarea];
    return { instrumentador: ['Operaciones', 'Instrumentación'], tanatologo: ['Operaciones', 'Tanatología'], audiovisual: ['Operaciones', 'Audiovisuales'], almacen: ['Almacén', 'Almacén'] }[u.rol] || ['Administrativa', '']; }
  function evMios(YO) {
    var au = areaUsuario(YO);
    return clone(EV.filter(function (e) { return (e.estado === 'Publicado' || e.estado === 'Cancelado') && (e.fecha_fin || e.fecha) >= dia(-1) && (para(e.destinatarios, au[0], au[1]) || esTH(YO)); }))
      .sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; }).map(function (e) { e.para = destTxt(e.destinatarios); e.nuevo = !VIS.some(function (z) { return z[0] === e.id && z[1] === YO.id; }); return e; });
  }
  function pid(id) { var p = P.find(function (k) { return k.id === +id; }); if (!p) E('El funcionario no existe.', 404); return p; }
  function manejar(a, q, v, YO) {
    if (!esTH(YO)) E('Solo Talento Humano y la administradora entran a esta sección.', 403);
    var p, x, anio = +dia(0).slice(0, 4);
    switch (a) {
      case 'th_personal':
        var an = +(q.anio || anio);
        return { personal: P.slice().sort(function (p1, p2) { return (p1.estado === 'Retirado') - (p2.estado === 'Retirado') || (p1.area < p2.area ? -1 : p1.area > p2.area ? 1 : 0) || (p1.apellidos < p2.apellidos ? -1 : 1); }).map(function (k) { var o = vista(k); o.n_dotacion = DOT.filter(function (d) { return d.persona_id === k.id; }).length; o.calendario = k.estado === 'Retirado' ? [] : cal(k, an); return o; }),
          areas: AREAS, estados: ESTADOS, contratos: CONTRATOS, usuarios: X.U.filter(function (u) { return u.activo; }).map(function (u) { return { id: u.id, nombre: u.nombre, rol: u.rol }; }), anio: an, hoy: dia(0), fechas_2: FECHAS2.slice() };
      case 'th_persona':
        p = pid(q.id); var pf = perfil(p.area, p.subarea), C = {}; C[anio] = cal(p, anio); C[anio + 1] = cal(p, anio + 1);
        return { persona: vista(p), dotacion: DOT.filter(function (d) { return d.persona_id === p.id; }).map(function (d) { var it = ITEMS.find(function (k) { return k.id === d.item_id; }); return Object.assign({}, d, { nombre: it.nombre, detalle: it.detalle, zona: it.zona, talla_tipo: it.talla_tipo, perfil: it.perfil }); })
            .sort(function (d1, d2) { return ((d1.perfil !== pf) - (d2.perfil !== pf)) || d1.item_id - d2.item_id; }),
          entregas: clone(ENT.filter(function (e) { return e.persona_id === p.id; })).reverse(), items: clone(ITEMS.filter(function (i) { return i.activo; })), perfiles: PERFILES, tallas_tipos: TT, calendario: C,
          areas: AREAS, estados: ESTADOS, contratos: CONTRATOS, usuarios: X.U.filter(function (u) { return u.activo; }).map(function (u) { return { id: u.id, nombre: u.nombre, rol: u.rol }; }), bitacora: clone(BIT.filter(function (b) { return b.entidad_id === p.id; })).reverse() };
      case 'th_persona_guardar':
        if (!t(v.nombres) || !t(v.apellidos)) E('Escriba nombres y apellidos.'); if (!AREAS[v.area]) E('Elija el área.');
        var d = {}; ['nombres', 'apellidos', 'tipo_doc', 'documento', 'fecha_nacimiento', 'sexo', 'rh', 'telefono', 'correo', 'correo_personal', 'direccion', 'ciudad', 'contacto_emergencia', 'tel_emergencia', 'area', 'subarea', 'cargo', 'tipo_contrato', 'fecha_ingreso', 'fecha_fin_contrato', 'jornada',
          'estado', 'fecha_retiro', 'motivo_retiro', 'eps', 'afp', 'arl', 'caja', 'cesantias', 'banco', 'cuenta', 'observaciones'].forEach(function (k) { d[k] = t(v[k], 500) || (/^fecha/.test(k) ? null : ''); }); d.usuario_id = +v.usuario_id || null;
        if (AREAS[d.area].indexOf(d.subarea) < 0) d.subarea = AREAS[d.area][0]; if (ESTADOS.indexOf(d.estado) < 0) d.estado = 'Activo';
        var s = String(v.salario || '').replace(/\D/g, ''); d.salario = s ? +s : null;
        if (+v.id) { Object.assign(pid(v.id), d); reg(YO.id, +v.id, 'Actualizó los datos de ' + nombre(d)); return { id: +v.id }; }
        d.id = P.length ? P[P.length - 1].id + 1 : 1; d.tallas = {}; P.push(d); asignar(d); reg(YO.id, d.id, 'Registró al funcionario ' + nombre(d), d.area + ' · ' + d.subarea + '\nSe le asignó la dotación de su perfil.'); return { id: d.id };
      case 'th_tallas_guardar':
        p = pid(v.id); p.tallas = {}; Object.keys(TT).forEach(function (k) { var x2 = t((v.tallas || {})[k], 12); if (x2) p.tallas[k] = x2; });
        DOT.filter(function (d2) { return d2.persona_id === p.id && !d2.talla; }).forEach(function (d2) { var it = ITEMS.find(function (k) { return k.id === d2.item_id; }); d2.talla = talla(p, it.talla_tipo); });
        reg(YO.id, p.id, 'Actualizó las tallas de ' + nombre(p)); return {};
      case 'th_dot_agregar':
        p = pid(v.persona_id); var it = ITEMS.find(function (k) { return k.id === +v.item_id; }); if (!it) E('Elija el elemento de dotación.');
        DOT.push({ id: ++sq.d, persona_id: p.id, item_id: it.id, cantidad: it.cantidad, talla: talla(p, it.talla_tipo), nota: '' }); reg(YO.id, p.id, 'Agregó a la dotación de ' + nombre(p), it.nombre); return {};
      case 'th_dot_editar':
        x = DOT.find(function (k) { return k.id === +v.id; }); if (!x) E('No existe.'); x.cantidad = Math.max(1, +v.cantidad || 1); x.talla = t(v.talla, 12); x.nota = t(v.nota, 300); return {};
      case 'th_dot_quitar':
        x = DOT.find(function (k) { return k.id === +v.id; }); if (!x) E('No existe.'); DOT.splice(DOT.indexOf(x), 1); return {};
      case 'th_dot_perfil':
        p = pid(v.persona_id); var n = 0; ITEMS.filter(function (i) { return i.perfil === perfil(p.area, p.subarea) && i.activo; }).forEach(function (i) { if (DOT.some(function (k) { return k.persona_id === p.id && k.item_id === i.id; })) return; DOT.push({ id: ++sq.d, persona_id: p.id, item_id: i.id, cantidad: i.cantidad, talla: talla(p, i.talla_tipo), nota: '' }); n++; });
        return { agregados: n };
      case 'th_items': return { items: clone(ITEMS), perfiles: PERFILES, tallas_tipos: TT };
      case 'th_item_guardar':
        if (!t(v.nombre)) E('Escriba el nombre del elemento.');
        var di = { perfil: PERFILES[v.perfil] ? v.perfil : 'general', nombre: t(v.nombre, 160), detalle: t(v.detalle, 300), zona: t(v.zona, 80), talla_tipo: TT[v.talla_tipo] ? v.talla_tipo : '', cantidad: Math.max(1, +v.cantidad || 1), activo: v.activo ? 1 : 0 };
        if (+v.id) Object.assign(ITEMS.find(function (k) { return k.id === +v.id; }), di); else { di.id = ITEMS.length + 1; di.orden = di.id; ITEMS.push(di); } return {};
      case 'th_entrega_guardar':
        p = pid(v.persona_id); if (v.periodo && ENT.some(function (k) { return k.persona_id === p.id && k.periodo === v.periodo; })) E('Ya hay una entrega registrada para ese periodo.');
        var its = (v.items || []).filter(function (k) { return +k.cantidad > 0; }); if (!its.length) E('Marque al menos un elemento entregado.');
        if (!t(v.entrega_nombre)) E('Escriba el nombre de quien entrega.'); if (!v.entrega_firma || !v.recibe_firma) E('Faltan las firmas de quien entrega y de quien recibe.');
        var fp = null; if (v.periodo) fechas(frec(p.area, p.subarea), +v.periodo.slice(0, 4)).forEach(function (f) { if (f.periodo === v.periodo) fp = f.fecha; });
        var e = { id: ++sq.e, persona_id: p.id, periodo: v.periodo || '', fecha_programada: fp, fecha_entrega: v.fecha_entrega || dia(0), items: clone(its), observaciones: t(v.observaciones), entrega_nombre: t(v.entrega_nombre, 120), entrega_cargo: t(v.entrega_cargo, 120), entrega_firma: v.entrega_firma, recibe_firma: v.recibe_firma, creado_por: YO.id, creado_en: ahora() };
        ENT.push(e); reg(YO.id, p.id, 'Entregó dotación a ' + nombre(p), its.map(function (k) { return k.cantidad + ' × ' + k.nombre; }).join('\n')); return { id: e.id };
      case 'th_entrega_borrar':
        if (YO.rol !== 'admin') E('Solo la administradora puede anular una entrega.', 403); if (!t(v.motivo)) E('Escriba el motivo.');
        x = ENT.find(function (k) { return k.id === +v.id; }); if (x) ENT.splice(ENT.indexOf(x), 1); return {};
      case 'th_eventos':
        return { eventos: clone(EV).reverse().map(function (e) { e.para = destTxt(e.destinatarios); e.vistos = VIS.filter(function (x) { return x[0] === e.id; }).length; return e; }), tipos: EV_TIPOS, areas: AREAS, hoy: dia(0),
          usuarios_area: X.U.filter(function (u) { return u.activo; }).map(areaUsuario), personal_area: P.filter(function (k) { return k.estado !== 'Retirado'; }).map(function (k) { return { area: k.area, subarea: k.subarea, correo: k.correo, correo_personal: k.correo_personal }; }) };
      case 'th_evento_guardar':
        if (!t(v.titulo)) E('Escriba el nombre del evento.'); if (!v.fecha) E('Indique la fecha del evento.');
        var dest = (v.destinatarios || []).slice(); if (!dest.length) E('Elija a quién va dirigido.'); if (dest.indexOf('Todos') >= 0) dest = ['Todos'];
        var de = { titulo: t(v.titulo, 160), tipo: EV_TIPOS.indexOf(v.tipo) >= 0 ? v.tipo : 'Otro', descripcion: t(v.descripcion, 4000), fecha: v.fecha, fecha_fin: v.fecha_fin && v.fecha_fin !== v.fecha ? v.fecha_fin : null, hora_ini: v.hora_ini || '', hora_fin: v.hora_fin || '', lugar: t(v.lugar, 200), tema: (window.EvArte && window.EvArte.temas()[v.tema]) ? v.tema : '', destinatarios: dest };
        if (v.imagen) de.imagen = v.imagen; else if (v.quitar_imagen) de.imagen = null;
        if (+v.id) { x = EV.find(function (k) { return k.id === +v.id; }); Object.assign(x, de); if (x.estado === 'Publicado') VIS = VIS.filter(function (z) { return z[0] !== x.id; }); return { id: x.id }; }
        de.id = EV.length ? EV[EV.length - 1].id + 1 : 1; de.estado = 'Borrador'; de.creado_por = YO.id; de.creado_en = ahora(); de.correos = 0; EV.push(de); return { id: de.id };
      case 'th_evento_publicar':
        x = EV.find(function (k) { return k.id === +v.id; }); if (!x) E('El evento no existe.'); x.estado = 'Publicado'; x.publicado_en = ahora(); x.publicado_por = YO.id;
        x.correos = P.filter(function (k) { return (k.correo || k.correo_personal) && k.estado !== 'Retirado' && para(x.destinatarios, k.area, k.subarea); }).length; VIS = VIS.filter(function (z) { return z[0] !== x.id; }); return { correos: x.correos };
      case 'th_evento_cancelar':
        x = EV.find(function (k) { return k.id === +v.id; }); if (!t(v.motivo)) E('Escriba el motivo de la cancelación.'); x.estado = 'Cancelado'; x.cancelado_motivo = t(v.motivo, 500); x.cancelado_en = ahora(); VIS = VIS.filter(function (z) { return z[0] !== x.id; }); return {};
      case 'th_evento_borrar':
        x = EV.find(function (k) { return k.id === +v.id; }); if (x.estado === 'Publicado') E('Un evento publicado no se elimina: cancélelo.', 409); EV.splice(EV.indexOf(x), 1); return {};
      case 'th_fechas_guardar':
        var f2 = v.fechas || []; if (f2.length !== 2 || !/^\d{2}-\d{2}$/.test(f2[0]) || !/^\d{2}-\d{2}$/.test(f2[1]) || f2[0] >= f2[1]) E('Indique las dos fechas en orden (MM-DD).'); FECHAS2 = f2; return {};
    }
    E('Acción desconocida.');
  }
  function resp(st, out) { return new Promise(function (ok) { setTimeout(function () { ok(new Response(JSON.stringify(out), { status: st, headers: { 'Content-Type': 'application/json' } })); }, 50); }); }
  window.CLEMI_DEMO.TH = { P: P, cal: cal, asignar: asignar };
  var previo = window.fetch;
  window.fetch = function (url, init) {
    if (typeof url === 'string' && /^api\.php\?a=ev_(mios|visto)/.test(url)) {
      var YE = X.yo(); if (!YE) return resp(401, { ok: false, error: 'Inicie sesión.' });
      if (url.indexOf('ev_visto') > 0) { var vv = {}; try { vv = JSON.parse(init.body); } catch (e) {} (vv.ids || []).forEach(function (id) { VIS.push([+id, YE.id]); }); return resp(200, { ok: true }); }
      return resp(200, { ok: true, eventos: evMios(YE) });
    }
    if (typeof url === 'string' && url.indexOf('api.php?a=th_') === 0) {
      var q = {}; (url.split('?')[1] || '').split('&').forEach(function (s) { var kv = s.split('='); q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ''); });
      var v = {}; try { v = init && init.body ? JSON.parse(init.body) : {}; } catch (e) {}
      var YO = X.yo(); if (!YO) return resp(401, { ok: false, error: 'Inicie sesión.' });
      try { return resp(200, Object.assign(manejar(q.a, q, v, YO) || {}, { ok: true })); } catch (e) { return resp(e.st || 500, e.body || { ok: false, error: String(e) }); }
    }
    var YO2 = X.yo();
    if (YO2 && YO2.rol === 'talento' && typeof url === 'string' && url.indexOf('api.php') === 0 && !/[?&]a=(yo|logout|cambiar_clave|base|tick|bitacora|archivo)(&|$)/.test(url)) return resp(403, { ok: false, error: 'Su usuario de Talento Humano no tiene acceso a esta sección.' });
    return previo.apply(this, arguments);
  };
})();
