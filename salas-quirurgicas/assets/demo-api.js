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
  function sumarD(f, n) { var p = f.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]); d.setDate(d.getDate() + n); return iso(d); }
  var MC = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fc(f) { var p = f.split('-'); return +p[2] + ' ' + MC[+p[1] - 1]; }

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
    { id: 5, usuario: 'angely.suesca', nombre: 'Angely Suesca', cedula: '', rol: 'instrumentador', activo: 1, debe_cambiar: 0 },
    { id: 6, usuario: 'julian.serna', nombre: 'Julian Serna', cedula: '', rol: 'tanatologo', activo: 1, debe_cambiar: 0 },
    { id: 7, usuario: 'holman.anaya', nombre: 'Holman Anaya', cedula: '', rol: 'tanatologo', activo: 1, debe_cambiar: 0 },
    { id: 8, usuario: 'carlos.murillo', nombre: 'Carlos Murillo', cedula: '', rol: 'tanatologo', activo: 1, debe_cambiar: 0 },
    { id: 20, usuario: 'natalia.cogua', nombre: 'Natalia Cogua', cedula: '', rol: 'comercial', activo: 1, debe_cambiar: 0 },
    { id: 21, usuario: 'julieth.hernandez', nombre: 'Julieth Hernández', cedula: '', rol: 'comercial', activo: 1, debe_cambiar: 0 },
    { id: 22, usuario: 'laura.andrade', nombre: 'Laura Andrade', cedula: '', rol: 'comercial', activo: 1, debe_cambiar: 0, areas_extra: 'ps' },
    { id: 23, usuario: 'wendy.cardenas', nombre: 'Wendy Cárdenas', cedula: '', rol: 'comercial', activo: 1, debe_cambiar: 0 },
    { id: 24, usuario: 'esteban.lopez', nombre: 'Esteban López', cedula: '', rol: 'audiovisual', activo: 1, debe_cambiar: 0 },
    { id: 25, usuario: 'juan.bernal', nombre: 'Juan Bernal', cedula: '', rol: 'audiovisual', activo: 1, debe_cambiar: 0 },
    { id: 26, usuario: 'yefer.mesa', nombre: 'Yefer Mesa', cedula: '', rol: 'audiovisual', activo: 1, debe_cambiar: 0 },
    { id: 27, usuario: 'osvaldo.naar', nombre: 'Osvaldo Naar', cedula: '', rol: 'almacen', activo: 1, debe_cambiar: 0, areas_extra: '' }
  ];
  var SALAS = [{"id": 1, "nombre": "Sala 1", "ancho": 795, "largo": 833, "alto": 294, "foto": "sala1.jpg", "notas": "", "orden": 1, "base": [], "plano": [{"t": "pantalla", "x": 248, "y": 0, "w": 239, "h": 14, "label": "Pantalla proyección"}, {"t": "columna", "x": 0, "y": 319, "w": 70, "h": 70}, {"t": "columna", "x": 725, "y": 319, "w": 70, "h": 70}, {"t": "tv", "x": 54, "y": 327, "w": 14, "h": 36, "label": "Soporte TV"}, {"t": "tv", "x": 727, "y": 327, "w": 14, "h": 36, "label": "Soporte TV"}, {"t": "puerta", "x": 0, "y": 682, "w": 14, "h": 60, "label": "Puerta"}, {"t": "ventana", "x": 781, "y": 505, "w": 14, "h": 54}, {"t": "ventana", "x": 781, "y": 589, "w": 14, "h": 54}, {"t": "rejilla", "x": 378, "y": 339, "w": 40, "h": 90}, {"t": "rejilla", "x": 368, "y": 588, "w": 55, "h": 150}]}, {"id": 2, "nombre": "Sala 2", "ancho": 812, "largo": 1190, "alto": 290, "foto": "sala2.jpg", "notas": "", "orden": 2, "base": [], "plano": [{"t": "ventana", "x": 0, "y": 581, "w": 14, "h": 101}, {"t": "ventana", "x": 0, "y": 710, "w": 14, "h": 82}, {"t": "columna", "x": 184, "y": 0, "w": 60, "h": 60}, {"t": "columna", "x": 568, "y": 0, "w": 60, "h": 60}, {"t": "ventana_int", "x": 798, "y": 634, "w": 14, "h": 146, "label": "Ventana interior"}, {"t": "puerta", "x": 798, "y": 956, "w": 14, "h": 110, "label": "Acceso"}, {"t": "toma", "x": 219, "y": 869, "w": 20, "h": 20}, {"t": "toma", "x": 396, "y": 869, "w": 20, "h": 20}, {"t": "toma", "x": 588, "y": 869, "w": 20, "h": 20}, {"t": "toma", "x": 108, "y": 1052, "w": 20, "h": 20}]}, {"id": 3, "nombre": "Sala 3", "ancho": 837, "largo": 791, "alto": 294, "foto": "sala3.jpg", "notas": "", "orden": 3, "base": [], "plano": [{"t": "columna", "x": 0, "y": 239, "w": 70, "h": 70}, {"t": "columna", "x": 767, "y": 239, "w": 70, "h": 70}, {"t": "columna", "x": 0, "y": 551, "w": 70, "h": 70}, {"t": "columna", "x": 767, "y": 551, "w": 70, "h": 70}, {"t": "columna", "x": 202, "y": 0, "w": 60, "h": 60}, {"t": "ventana_int", "x": 466, "y": 0, "w": 84, "h": 14, "label": "Ventana interior"}, {"t": "puerta", "x": 622, "y": 0, "w": 77, "h": 14, "label": "Pasillo"}, {"t": "rejilla", "x": 377, "y": 496, "w": 55, "h": 150}, {"t": "toma", "x": 756, "y": 712, "w": 20, "h": 20}]}, {"id": 4, "nombre": "Sala 4", "ancho": 800, "largo": 1180, "alto": 295, "foto": "sala4.jpg", "notas": "", "orden": 4, "base": [], "plano": [{"t": "ventana", "x": 4, "y": 0, "w": 291, "h": 14}, {"t": "ventana", "x": 396, "y": 0, "w": 291, "h": 14}, {"t": "columna", "x": 0, "y": 0, "w": 60, "h": 60}, {"t": "columna", "x": 740, "y": 0, "w": 60, "h": 60}, {"t": "puerta", "x": 0, "y": 843, "w": 14, "h": 120, "label": "Puerta"}, {"t": "tv", "x": 786, "y": 433, "w": 14, "h": 150, "label": "TV"}, {"t": "rejilla", "x": 373, "y": 535, "w": 40, "h": 100}, {"t": "toma", "x": 179, "y": 636, "w": 20, "h": 20}, {"t": "toma", "x": 594, "y": 636, "w": 20, "h": 20}]}, {"id": 5, "nombre": "Sala 5", "ancho": 740, "largo": 1126, "alto": 296, "foto": "sala5.jpg", "notas": "", "orden": 5, "base": [], "plano": [{"t": "ventana", "x": 0, "y": 280, "w": 14, "h": 150}, {"t": "ventana", "x": 19, "y": 0, "w": 211, "h": 14}, {"t": "ventana", "x": 336, "y": 0, "w": 282, "h": 14}, {"t": "columna", "x": 0, "y": 0, "w": 60, "h": 60}, {"t": "columna", "x": 680, "y": 0, "w": 60, "h": 60}, {"t": "puerta", "x": 0, "y": 684, "w": 14, "h": 130, "label": "Puerta"}, {"t": "extintor", "x": 18, "y": 114, "w": 24, "h": 24, "label": "Extintor"}, {"t": "rejilla", "x": 332, "y": 637, "w": 45, "h": 110}]}, {"id": 6, "nombre": "Sala 6", "ancho": 685, "largo": 1194, "alto": 297, "foto": "sala6.jpg", "notas": "", "orden": 6, "base": [], "plano": [{"t": "tv", "x": 0, "y": 297, "w": 14, "h": 138, "label": "TV"}, {"t": "tv", "x": 263, "y": 0, "w": 91, "h": 14, "label": "TV"}, {"t": "tv", "x": 671, "y": 297, "w": 14, "h": 138, "label": "TV"}, {"t": "tv", "x": 0, "y": 512, "w": 14, "h": 55, "label": "Monitor"}, {"t": "tv", "x": 671, "y": 512, "w": 14, "h": 55, "label": "Monitor"}, {"t": "aire", "x": 56, "y": 0, "w": 110, "h": 40, "label": "Aire acondicionado"}, {"t": "ventilador", "x": 0, "y": 182, "w": 40, "h": 40}, {"t": "ventilador", "x": 645, "y": 182, "w": 40, "h": 40}, {"t": "ventilador", "x": 180, "y": 0, "w": 40, "h": 40}, {"t": "columna", "x": 0, "y": 0, "w": 60, "h": 60}, {"t": "columna", "x": 625, "y": 0, "w": 60, "h": 60}, {"t": "ventana", "x": 671, "y": 635, "w": 14, "h": 184}, {"t": "rejilla", "x": 299, "y": 438, "w": 45, "h": 70}, {"t": "rejilla", "x": 308, "y": 748, "w": 55, "h": 130}, {"t": "toma", "x": 110, "y": 1055, "w": 20, "h": 20}]}];
  var CAT = [
    ['Camilla con componente anatómico', 'camilla_cuerpo', 200, 70, '#2A5A41'], ['Camilla vacía', 'camilla', 200, 70, '#5E7D6B'], ['Mesa de instrumental', 'mesa', 120, 60, '#C6A13B'],
    ['Mesa de Mayo', 'mesa', 80, 50, '#D9B75A'], ['Torre de video', 'torre', 60, 60, '#13466B'], ['Monitor rodante', 'monitor', 60, 50, '#1F5A85'], ['Arco en C', 'arco', 200, 80, '#4B5A66'],
    ['Consola de motor', 'caja', 50, 40, '#6B4E8A'], ['Carro de insumos', 'caja', 60, 45, '#8A7A55'], ['Caneca de residuos biológicos', 'circulo', 45, 45, '#B23A3A'],
    ['Lámpara rodable', 'circulo', 60, 60, '#E8C25B'], ['Banco quirúrgico', 'circulo', 40, 40, '#7A8B80'],
    ['Doctor', 'persona', 55, 35, '#1F5AA6'], ['Instrumentador', 'persona', 55, 35, '#2A8C5A'], ['Persona de staff', 'persona', 55, 35, '#C6A13B'],
    ['Tanatólogo', 'persona', 55, 35, '#7B2E4A'], ['Mesa de auditorio', 'mesa_aud', 180, 60, '#B98B58'], ['Silla', 'silla', 50, 50, '#2A5A41']
  ].map(function (c, i) { return { id: i + 1, nombre: c[0], forma: c[1], ancho: c[2], largo: c[3], color: c[4], activo: 1, orden: i + 1 }; });
  var PLANT = [{ id: 1, nombre: 'Ejemplo · Entrenamiento con componente anatómico', actualizado_en: ahora(), items: [
    { fase: 'Antes', texto: 'Componentes anatómicos identificados y rotulados' }, { fase: 'Antes', texto: 'Mesas de instrumental completas según listado' },
    { fase: 'Antes', texto: 'Torre de video y monitores probados' }, { fase: 'Durante', texto: 'Control de uso de elementos de protección personal' },
    { fase: 'Después', texto: 'Instrumental contado y entregado a la casa comercial' }, { fase: 'Después', texto: 'Sala limpia y desinfectada' }] }];

  var EV = [], VER = [], NOV = [], ENT = [], FOT = [], BIT = [], INS = [], ASI = [];
  var CHK = ['Identidad verificada con el documento', 'Inscripción y pago confirmados', 'Firma del registro de asistencia', 'Normas de bioseguridad y consentimiento de uso de material anatómico firmados',
    'Elementos de protección personal completos (bata, gorro, tapabocas, gafas, guantes, polainas)', 'Sin joyas, relojes ni objetos personales en la sala', 'Informado: prohibido fotografiar o grabar los componentes anatómicos', 'Estación de trabajo asignada', 'Kit / instrumental entregado'];
  function codigoIns() { var abc = '23456789ABCDEFGHJKLMNPRSTUVWX', c; do { c = 'CLM'; for (var i = 0; i < 9; i++) c += abc[Math.floor(Math.random() * abc.length)]; } while (INS.some(function (x) { return x.codigo === c; })); return c; }
  function nomI(i) { return (i.nombre + ' ' + (i.apellido || '')).trim(); }
  function listaEv(e) { return e.checklist_ing || CHK; }
  function asiJ(a) { return a ? clone(a) : null; }
  var COMP = [], PAR = [], ASG = [], ADJ = [], MARC = [], DISP = [];
  function sigId(l) { return l.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1; }
  var TIPOS_ADJ = { jpg: ['imagen', 'image/jpeg'], jpeg: ['imagen', 'image/jpeg'], png: ['imagen', 'image/png'], webp: ['imagen', 'image/webp'], gif: ['imagen', 'image/gif'],
    mp4: ['video', 'video/mp4'], mov: ['video', 'video/quicktime'], webm: ['video', 'video/webm'], m4v: ['video', 'video/mp4'], avi: ['video', 'video/x-msvideo'],
    pdf: ['documento', 'application/pdf'], doc: ['documento', 'application/msword'], docx: ['documento', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    xls: ['documento', 'application/vnd.ms-excel'], xlsx: ['documento', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ppt: ['documento', 'application/vnd.ms-powerpoint'], pptx: ['documento', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    txt: ['documento', 'text/plain'], csv: ['documento', 'text/csv'], glb: ['modelo3d', 'model/gltf-binary'] };
  function kbTxt(b) { return b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  var REG = [['Cabeza y cuello', 'CC', false], ['Columna cervical', 'CCV', false], ['Columna torácica', 'CT', false], ['Columna lumbar', 'CL', false], ['Tórax', 'TX', false], ['Abdomen', 'AB', false], ['Pelvis', 'PV', false],
    ['Hombro', 'HO', true], ['Brazo', 'BR', true], ['Codo', 'CO', true], ['Antebrazo', 'AN', true], ['Muñeca y mano', 'MM', true], ['Cadera', 'CA', true], ['Muslo', 'MU', true], ['Rodilla', 'RO', true], ['Pierna', 'PI', true], ['Tobillo y pie', 'TP', true], ['Pene', 'PN', false, 'Masculino'], ['Vagina (suelo pélvico)', 'VG', false, 'Femenino']];
  var SUBCAT = {"Cabeza y cuello":["Cuero cabelludo","Cráneo","Encéfalo","Cara (piel y músculos)","Frente","Ojo derecho","Ojo izquierdo","Párpados","Nariz","Senos paranasales","Oreja derecha","Oreja izquierda","Labios","Boca y lengua","Dientes","Maxilar superior","Mandíbula","Cuello (piel y músculos)","Laringe","Tiroides","Tráquea cervical"],"Columna cervical":["C1","C2","C3","C4","C5","C6","C7"],"Columna torácica":["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"],"Columna lumbar":["L1","L2","L3","L4","L5"],"Tórax":["Pared torácica","Esternón","Costillas derechas","Costillas izquierdas","Mama derecha","Mama izquierda","Pulmón derecho","Pulmón izquierdo","Corazón","Mediastino","Diafragma"],"Abdomen":["Pared abdominal","Hígado","Vesícula biliar","Estómago","Bazo","Páncreas","Intestino delgado","Colon","Apéndice","Riñón derecho","Riñón izquierdo"],"Pelvis":["Hueso ilíaco derecho","Hueso ilíaco izquierdo","Sacro","Cóccix","Vejiga","Recto",["Próstata","Masculino"],["Útero","Femenino"],["Ovarios","Femenino"]],"Hombro":["Clavícula","Escápula","Articulación del hombro","Manguito rotador","Deltoides"],"Brazo":["Húmero","Bíceps","Tríceps","Piel del brazo"],"Codo":["Articulación del codo","Olécranon","Epicóndilo","Epitróclea"],"Antebrazo":["Radio","Cúbito","Músculos flexores","Músculos extensores"],"Muñeca y mano":["Muñeca (carpo)","Palma (metacarpo)","Dorso de la mano","Pulgar","Índice","Medio (corazón)","Anular","Meñique","Uñas"],"Cadera":["Articulación de la cadera","Cabeza femoral","Acetábulo","Glúteos"],"Muslo":["Fémur","Cuádriceps","Isquiotibiales","Aductores"],"Rodilla":["Rótula","Menisco medial","Menisco lateral","Ligamento cruzado anterior","Ligamento cruzado posterior","Ligamentos colaterales"],"Pierna":["Tibia","Peroné","Gemelos y sóleo","Tendón de Aquiles"],"Tobillo y pie":["Tobillo","Talón (calcáneo)","Dorso del pie","Planta del pie","Dedo gordo (hallux)","Segundo dedo","Tercer dedo","Cuarto dedo","Quinto dedo","Uñas"],"Pene":["Glande","Cuerpo del pene","Escroto","Testículos"],"Vagina (suelo pélvico)":["Vulva","Vagina","Periné","Músculos del suelo pélvico"]};
  function subDe(region, sexo) { return (SUBCAT[region] || []).filter(function (x) { return !Array.isArray(x) || x[1] === sexo; }).map(function (x) { return Array.isArray(x) ? x[0] : x; }); }
  var FEMR = ['Muñeca y mano', 'Cadera', 'Rodilla', 'Pierna', 'Cabeza y cuello', 'Pelvis'];
  function nombreP(p) { if (!p.lado) return p.region; var f = FEMR.indexOf(p.region) >= 0; return p.region + ' ' + (p.lado === 'Derecho' ? (f ? 'derecha' : 'derecho') : (f ? 'izquierda' : 'izquierdo')); }
  function asgFull(a) {
    var p = PAR.find(function (x) { return x.id === a.parte_id; }), c = COMP.find(function (x) { return x.id === p.componente_id; }), e = EV.find(function (x) { return x.id === a.evento_id; }) || {};
    return Object.assign({}, a, { parte_codigo: p.codigo, region: p.region, lado: p.lado, componente_id: c.id, componente_codigo: c.codigo, sexo: c.sexo, edad: c.edad, conservacion: c.conservacion,
      evento_titulo: e.titulo, fecha: e.fecha, fecha_fin: e.fecha_fin, sala_id: e.sala_id, evento_estado: e.estado });
  }
  function crearComp(cod, tipo, sexo, edad, cons, ub, uid, cuando, solo) {
    var c = { id: COMP.length + 1, codigo: cod, tipo: tipo, sexo: sexo, edad: edad, fecha_ingreso: cuando.slice(0, 10), procedencia: 'Convenio de donación (ejemplo)', conservacion: cons, estado: 'Disponible', ubicacion: ub, obs: '', creado_por: uid, creado_en: cuando, actualizado_por: uid, actualizado_en: cuando };
    COMP.push(c); var n = 0;
    REG.forEach(function (rg) { if (rg[3] && rg[3] !== sexo) return; (rg[2] ? ['Derecho', 'Izquierdo'] : ['']).forEach(function (l) {
      if (solo && solo.indexOf(rg[0] + (l ? '|' + l : '')) < 0) return;
      PAR.push({ id: PAR.length + 1, componente_id: c.id, region: rg[0], lado: l, codigo: cod + '-' + rg[1] + (l ? (l === 'Derecho' ? 'D' : 'I') : ''), estado: 'Disponible', usos: 0, ubicacion: '', obs: '' }); n++;
    }); });
    reg(uid, 'componente', c.id, null, 'Registró el componente anatómico ' + cod, tipo + ' · ' + sexo + (edad != null ? ' · ' + edad + ' años' : '') + ' · ' + cons + ' · ' + n + ' partes' + (ub ? ' · ' + ub : ''), cuando);
    return c;
  }
  function parteDe(cod) { return PAR.find(function (p) { return p.codigo === cod; }); }
  function asignarSemilla(cod, evId, est, estado, uid, cuando, obs) {
    var p = parteDe(cod); ASG.push({ id: ASG.length + 1, parte_id: p.id, evento_id: evId, estacion: est, estado: estado, obs: obs || '', creado_por: uid, creado_en: cuando, actualizado_por: uid, actualizado_en: cuando });
    p.estado = estado === 'Reservada' ? 'Reservada' : estado === 'En uso' ? 'En uso' : estado === 'Consumida' ? 'Consumida' : (obs ? 'Dañada' : 'Disponible');
    if (estado === 'Devuelta a morgue' || estado === 'Consumida') p.usos++;
  }
  var seq = { ev: 0, ver: 0, nov: 0, ent: 0, fot: 0, bit: 0 };
  function nombre(id) { var u = U.find(function (x) { return x.id === +id; }); return u ? u.nombre : '—'; }
  function reg(uid, entidad, eid, evid, accion, detalle, momento) {
    BIT.push({ id: ++seq.bit, momento: momento || ahora(), usuario_id: uid, usuario_nombre: uid ? nombre(uid) : 'Sistema', entidad: entidad, entidad_id: eid, evento_id: evid, accion: accion, detalle: detalle || '' });
  }
  function L(cat, x, y, r, label) { return { id: 'i' + Math.random().toString(36).slice(2, 9), cat: cat, x: x, y: y, r: r || 0, label: label || '' }; }

  function sembrar() {
    var hoy = dia(0), ayer = dia(-1);
    // Evento 1 · hoy, en curso
    var e1 = { id: ++seq.ev, titulo: 'Curso de artroscopia de rodilla (ejemplo)', especialidad: 'Ortopedia', empresa: 'Casa comercial de ejemplo', sala_id: 3, fecha: hoy, fecha_fin: dia(1),
      hora_ini: '07:00', hora_fin: '13:00', responsable_id: 4, tanatologo_id: 6, apoyo: [5],
      dias: [{ fecha: hoy, hora_ini: '07:00', hora_fin: '13:00', hora_fin_ext: '14:30', justificacion: '13:00 → 14:30: El instructor solicitó repetir la práctica en la estación 3 (ejemplo)', ext_por: 4, ext_en: en(hoy, '09:40:00') },
        { fecha: dia(1), hora_ini: '07:00', hora_fin: '12:00', hora_fin_ext: null, justificacion: '' }], participantes: 16, componentes: 4, descripcion: 'Evento de ejemplo para la vista previa. Cuatro estaciones con componente anatómico, rotación cada 90 minutos.',
      estado: 'en_curso', layout: [L(1, 250, 210, 0, 'Estación 1'), L(1, 590, 210, 0, 'Estación 2'), L(1, 250, 500, 0, 'Estación 3'), L(1, 590, 500, 0, 'Estación 4'),
        L(3, 250, 320), L(3, 590, 320), L(3, 250, 610), L(3, 590, 610), L(5, 105, 210), L(5, 735, 210), L(5, 105, 500), L(5, 735, 500), L(10, 420, 720), L(9, 760, 720),
        L(13, 250, 150, 0), L(14, 340, 330, 180), L(13, 590, 150, 0), L(14, 680, 330, 180), L(13, 250, 440, 0), L(15, 160, 620, 180), L(13, 590, 440, 0), L(16, 420, 380, 90)],
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
    reg(4, 'evento', e1.id, e1.id, 'Extendió el horario del ' + fc(hoy), '13:00 → 14:30\nJustificación: El instructor solicitó repetir la práctica en la estación 3 (ejemplo)', en(hoy, '09:40:00'));
    NOV.push({ id: ++seq.nov, evento_id: e1.id, tipo: 'Nota', texto: 'Componentes anatómicos de las estaciones 1 a 4 recibidos y verificados por tanatología (ejemplo).', foto: null, creado_por: 6, creado_en: en(hoy, '06:35:00') });
    reg(6, 'novedad', 3, e1.id, 'Registró nota', 'Funcionario: Julian Serna (Tanatología)\n' + NOV[NOV.length - 1].texto, en(hoy, '06:35:00'));
    NOV.push({ id: ++seq.nov, evento_id: e1.id, tipo: 'Incidente', texto: 'Se reemplazó la pinza de agarre de la estación 2 con instrumental de reserva (ejemplo).', foto: null, creado_por: 4, creado_en: en(hoy, '07:15:00') });
    reg(4, 'novedad', 1, e1.id, 'Registró incidente', NOV[0].texto, en(hoy, '07:15:00'));
    NOV.push({ id: ++seq.nov, evento_id: e1.id, tipo: 'Cambio', texto: 'La estación 4 pasa a trabajar abordaje posteromedial por solicitud del instructor (ejemplo).', foto: null, creado_por: 5, creado_en: en(hoy, '09:20:00') });
    reg(5, 'novedad', 2, e1.id, 'Registró cambio', NOV[1].texto, en(hoy, '09:20:00'));
    reg(4, 'layout', null, e1.id, 'Actualizó la distribución de la sala', 'Camilla con componente anatómico: 0 → 4\nMesa de instrumental: 0 → 4\nTorre de video: 0 → 4', en(hoy, '06:40:00'));

    // Evento 2 · hoy, programado
    var e2 = { id: ++seq.ev, titulo: 'Taller de columna — abordaje posterior (ejemplo)', especialidad: 'Columna', empresa: '', sala_id: 1, fecha: hoy, fecha_fin: hoy, hora_ini: '14:00', hora_fin: '18:00',
      responsable_id: 2, tanatologo_id: 7, apoyo: [], dias: [{ fecha: hoy, hora_ini: '14:00', hora_fin: '18:00', hora_fin_ext: null, justificacion: '' }], participantes: 10, componentes: 2, descripcion: '', estado: 'programado', layout: [L(1, 300, 330, 90, 'Estación 1'), L(1, 500, 330, 90, 'Estación 2'), L(3, 300, 560), L(3, 500, 560), L(7, 400, 720, 0)],
      creado_por: 2, creado_en: hace(60 * 20), actualizado_por: 2, actualizado_en: hace(60 * 20) };
    EV.push(e2); reg(2, 'evento', e2.id, e2.id, 'Creó el evento', e2.titulo + ' · Sala 1', e2.creado_en);

    // Evento 3 · ayer, cerrado y firmado
    var e3 = { id: ++seq.ev, titulo: 'Curso de reemplazo de cadera (ejemplo)', especialidad: 'Ortopedia', empresa: 'Casa comercial de ejemplo', sala_id: 6, fecha: ayer, fecha_fin: ayer, hora_ini: '08:00', hora_fin: '12:00',
      responsable_id: 3, tanatologo_id: 8, apoyo: [2], dias: [{ fecha: ayer, hora_ini: '08:00', hora_fin: '12:00', hora_fin_ext: null, justificacion: '' }], participantes: 12, componentes: 3, descripcion: '', estado: 'cerrado', layout: [L(1, 240, 420, 90, 'Estación 1'), L(1, 450, 420, 90, 'Estación 2'), L(1, 345, 800, 0, 'Estación 3'), L(4, 240, 620), L(4, 450, 620), L(4, 345, 920)],
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
    var e4 = { id: ++seq.ev, titulo: 'Entrenamiento de hombro (ejemplo)', especialidad: 'Ortopedia', empresa: '', sala_id: 5, fecha: dia(1), fecha_fin: dia(1), hora_ini: '07:30', hora_fin: '11:30',
      responsable_id: 5, tanatologo_id: 6, apoyo: [], dias: [{ fecha: dia(1), hora_ini: '07:30', hora_fin: '11:30', hora_fin_ext: null, justificacion: '' }], participantes: 8, componentes: 2, descripcion: 'Sesión teórica previa al entrenamiento (ejemplo).', estado: 'programado', layout: [L(17, 190, 380), L(18, 140, 435, 180), L(18, 190, 435, 180), L(18, 240, 435, 180), L(17, 550, 380), L(18, 500, 435, 180), L(18, 550, 435, 180), L(18, 600, 435, 180), L(17, 190, 530), L(18, 140, 585, 180), L(18, 190, 585, 180), L(18, 240, 585, 180), L(17, 550, 530), L(18, 500, 585, 180), L(18, 550, 585, 180), L(18, 600, 585, 180), L(17, 190, 680), L(18, 140, 735, 180), L(18, 190, 735, 180), L(18, 240, 735, 180), L(17, 550, 680), L(18, 500, 735, 180), L(18, 550, 735, 180), L(18, 600, 735, 180), L(17, 190, 830), L(18, 140, 885, 180), L(18, 190, 885, 180), L(18, 240, 885, 180), L(17, 550, 830), L(18, 500, 885, 180), L(18, 550, 885, 180), L(18, 600, 885, 180), L(13, 370, 150, 0)], creado_por: 5, creado_en: hace(90), actualizado_por: 5, actualizado_en: hace(90) };
    EV.push(e4); reg(5, 'evento', e4.id, e4.id, 'Creó el evento', e4.titulo + ' · Sala 5', e4.creado_en);

    // Entregas de instrumental
    ENT.push({ id: ++seq.ent, evento_id: 1, fecha_hora: en(hoy, '06:30:00'), empresa: 'Casa comercial de ejemplo', entrega_nombre: 'Persona de ejemplo', entrega_cedula: '0000000000',
      entrega_cargo: 'Especialista de producto', entrega_telefono: '', entrega_firma: guardarImg(firmaFalsa(7), 'firma'), recibe_id: 4, recibe_nombre: 'Laura Rodríguez', recibe_cedula: '',
      recibe_firma: guardarImg(firmaFalsa(19), 'firma'), ubicacion: 'Sala 3, mesa auxiliar junto a la ventana interior (ejemplo)',
      items: [{ desc: 'Set de artroscopia de rodilla', ref: 'LOTE-EJEMPLO', cant: 4, estado: 'Bueno' }, { desc: 'Consola de motor', ref: '', cant: 2, estado: 'Bueno' }],
      observaciones: '', estado: 'En custodia', creado_por: 4, creado_en: en(hoy, '06:30:00') });
    FOT.push({ id: ++seq.fot, entrega_id: 1, momento: 'Entrega', archivo: 'estatica:assets/estacion-ejemplo.jpg', creado_por: 4, creado_en: en(hoy, '06:31:00') });
    reg(4, 'entrega', 1, 1, 'Registró entrega de instrumental', 'Casa comercial de ejemplo → Laura Rodríguez · Ubicación: Sala 3', en(hoy, '06:30:00'));
    ENT.push({ id: ++seq.ent, evento_id: 3, fecha_hora: en(ayer, '07:20:00'), empresa: 'Casa comercial de ejemplo', entrega_nombre: 'Persona de ejemplo', entrega_cedula: '0000000000',
      entrega_cargo: '', entrega_telefono: '', entrega_firma: guardarImg(firmaFalsa(3), 'firma'), recibe_id: 3, recibe_nombre: 'Nicolás Rendón', recibe_cedula: '',
      recibe_firma: guardarImg(firmaFalsa(11), 'firma'), ubicacion: 'Sala 6 (ejemplo)', items: [{ desc: 'Set de prótesis de cadera', ref: '', cant: 3, estado: 'Bueno' }],
      observaciones: '', estado: 'Devuelto', dev_fecha_hora: en(ayer, '12:30:00'), dev_entrega_id: 3, dev_entrega_nombre: 'Nicolás Rendón', dev_entrega_cedula: '0000000000',
      dev_entrega_firma: guardarImg(firmaFalsa(23), 'firma'), dev_recibe_nombre: 'Persona de ejemplo', dev_recibe_cedula: '0000000000', dev_recibe_firma: guardarImg(firmaFalsa(29), 'firma'),
      dev_obs: 'Se devuelve completo (ejemplo).', dev_novedad: 'Sin novedades', dev_items: [{ desc: 'Set de prótesis de cadera', ref: '', cant: 3, cant_dev: 3, estado: 'Completo', nota: '' }], creado_por: 3, creado_en: en(ayer, '07:20:00') });
    reg(3, 'entrega', 2, 3, 'Registró entrega de instrumental', 'Casa comercial de ejemplo → Nicolás Rendón', en(ayer, '07:20:00'));
    reg(3, 'entrega', 2, 3, 'Registró devolución a la empresa', 'Casa comercial de ejemplo', en(ayer, '12:30:00'));
    // Morgue: componentes de ejemplo
    crearComp('CLEMI-CA-0107', 'Cuerpo completo', 'Masculino', 67, 'Fresco congelado', 'Congelador 1 · bandeja A', 6, hace(60 * 24 * 12));
    crearComp('CLEMI-CA-0112', 'Cuerpo completo', 'Femenino', 72, 'Fresco congelado', 'Congelador 2 · bandeja C', 7, hace(60 * 24 * 9));
    crearComp('CLEMI-SG-0034', 'Segmento', 'Masculino', 58, 'Fresco refrigerado', 'Nevera 1', 8, hace(60 * 24 * 5), ['Hombro|Derecho', 'Brazo|Derecho', 'Codo|Derecho', 'Hombro|Izquierdo']);
    asignarSemilla('CLEMI-CA-0107-ROD', 1, 'Estación 1', 'En uso', 6, en(hoy, '06:40:00'));
    asignarSemilla('CLEMI-CA-0107-ROI', 1, 'Estación 2', 'En uso', 6, en(hoy, '06:41:00'));
    asignarSemilla('CLEMI-CA-0112-ROD', 1, 'Estación 3', 'En uso', 6, en(hoy, '06:42:00'));
    asignarSemilla('CLEMI-CA-0112-ROI', 1, 'Estación 4', 'Reservada', 6, en(hoy, '06:43:00'));
    asignarSemilla('CLEMI-CA-0112-CAD', 3, 'Estación 1', 'Devuelta a morgue', 8, en(ayer, '12:05:00'));
    asignarSemilla('CLEMI-CA-0112-CAI', 3, 'Estación 2', 'Devuelta a morgue', 8, en(ayer, '12:06:00'), 'Fractura del cuello femoral durante la práctica (ejemplo)');
    asignarSemilla('CLEMI-CA-0107-CAD', 3, 'Estación 3', 'Consumida', 8, en(ayer, '12:07:00'), 'Tejido no apto para un nuevo uso (ejemplo)');
    asignarSemilla('CLEMI-SG-0034-HOD', 4, 'Estación 1', 'Reservada', 6, hace(40));
    asignarSemilla('CLEMI-SG-0034-HOI', 4, 'Estación 2', 'Reservada', 6, hace(40));
    reg(6, 'asignacion', null, 1, 'Reservó componentes anatómicos para el evento', 'CLEMI-CA-0107-ROD (Rodilla derecha)\nCLEMI-CA-0107-ROI (Rodilla izquierda)\nCLEMI-CA-0112-ROD (Rodilla derecha)\nCLEMI-CA-0112-ROI (Rodilla izquierda)', en(hoy, '06:43:00'));
    reg(6, 'asignacion', 1, 1, 'Entregó a sala la parte CLEMI-CA-0107-ROD', 'Rodilla derecha · Estación 1', en(hoy, '06:55:00'));
    reg(8, 'asignacion', 6, 3, 'Recibió en morgue la parte CLEMI-CA-0112-CAI', 'Cadera izquierda · Estación 2 · queda dañada\nFractura del cuello femoral durante la práctica (ejemplo)', en(ayer, '12:20:00'));
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
    if (YO.rol === 'tanatologo' && ['yo', 'logout', 'cambiar_clave', 'base', 'tick', 'eventos', 'evento', 'novedad', 'entregas', 'entrega', 'bitacora', 'morgue', 'componente', 'componente_guardar', 'parte_agregar', 'parte_guardar', 'asignar', 'asignacion_estado', 'adjunto_borrar', 'marca_guardar', 'marca_borrar', 'disposicion_guardar', 'inscritos'].indexOf(a) < 0)
      E('Su usuario de tanatología puede gestionar la Morgue y registrar novedades. Para otros cambios pida apoyo al instrumentador a cargo.', 403);
    switch (a) {
      case 'yo': return { usuario: clone(YO), csrf: 'demo' };
      case 'logout': YO = null; return {};
      case 'cambiar_clave': E('En la vista previa las contraseñas no se cambian. En la plataforma real sí.');
      case 'base': return { salas: clone(SALAS), catalogo: clone(CAT), plantillas: clone(PLANT), usuarios: clone(U), checklist_ingreso: clone(CHK), tick: tick(), ahora: ahora() };
      case 'tick': var d = +q.desde || 0;
        return { tick: tick(), nuevos: BIT.filter(function (b) { return b.id > d && b.entidad !== 'sesion'; }).slice(-20).reverse(), ahora: ahora() };
      case 'eventos':
        var ds = q.desde || dia(-30), hs = q.hasta || dia(60);
        return { eventos: EV.filter(function (x) { return x.fecha <= hs && x.fecha_fin >= ds; }).sort(function (x, y) { return (x.fecha + x.hora_ini) < (y.fecha + y.hora_ini) ? -1 : 1; }).map(function (x) {
          var vs = VER.filter(function (w) { return w.evento_id === x.id; });
          var o = clone(x); delete o.layout; o.v_total = vs.length; o.v_hechos = vs.filter(function (w) { return w.estado !== 'pendiente'; }).length;
          o.n_nov = NOV.filter(function (n) { return n.evento_id === x.id; }).length; o.n_partes = ASG.filter(function (a) { return a.evento_id === x.id; }).length; return o;
        }), actividad: BIT.filter(function (b) { return b.entidad !== 'sesion'; }).slice(-25).reverse(), tick: tick() };
      case 'evento':
        e = ev(q.id);
        var oe = clone(e); oe.n_inscritos = INS.filter(function (x) { return x.evento_id === e.id; }).length;
        return { evento: oe, verificacion: clone(VER.filter(function (x) { return x.evento_id === e.id; }).sort(function (x, y) { return x.orden - y.orden || x.id - y.id; })),
          novedades: clone(NOV.filter(function (x) { return x.evento_id === e.id; }).reverse()),
          asignaciones: clone(ASG.filter(function (x) { return x.evento_id === e.id; }).map(asgFull).sort(function (x, y) { return (x.estacion || '') < (y.estacion || '') ? -1 : 1; })),
          entregas: clone(ENT.filter(function (x) { return x.evento_id === e.id; }).reverse()), bitacora: clone(BIT.filter(function (b) { return b.evento_id === e.id; }).reverse()), tick: tick() };
      case 'integ_estado':
        if (!ADMIN) E('Solo la administradora.', 403);
        var e1x = EV[0];
        return { url: 'https://clemi.edu.co/inscripciones/clemi-operaciones/api.php', secreto: '8f3c…(oculto en la vista previa)', activa: true, receptor: 'https://clemi.edu.co/salas/integracion.php', ultima_entrada: hace(35), ultima_sinc: hace(60 * 3),
          cola: { pendientes: 0, enviados: ASI.length * 3, ultimo_error: null },
          cursos: [{ id: 'ART-RODILLA-2026', nombre: 'Curso de artroscopia de rodilla', fecha_ini: e1x.fecha, fecha_fin: e1x.fecha_fin, evento_id: e1x.id, n: INS.filter(function (x) { return x.evento_id === e1x.id; }).length, n_anuladas: 0 },
            { id: 'COL-POST-2026', nombre: 'Taller de columna — abordaje posterior', fecha_ini: EV[1].fecha, fecha_fin: EV[1].fecha_fin, evento_id: null, n: 6, n_anuladas: 1 }],
          eventos: EV.filter(function (x) { return x.estado !== 'cancelado'; }).map(function (x) { return { id: x.id, titulo: x.titulo, fecha: x.fecha, fecha_fin: x.fecha_fin, sala_id: x.sala_id }; }) };
      case 'integ_guardar': case 'integ_probar': case 'integ_reintentar': return { respuesta: { plataforma: 'CLEMI Inscripciones (vista previa)' }, enviados: 0, pendientes: 0 };
      case 'integ_sincronizar': return { resultado: { cursos: 2, inscritos: INS.length, errores: [] }, enviados: 0 };
      case 'cursos_ext': return { cursos: [{ id: 'ART-RODILLA-2026', nombre: 'Curso de artroscopia de rodilla', fecha_ini: EV[0].fecha, fecha_fin: EV[0].fecha_fin, evento_id: EV[0].id, evento_titulo: EV[0].titulo, n: 8 }, { id: 'COL-POST-2026', nombre: 'Taller de columna — abordaje posterior', fecha_ini: EV[1].fecha, fecha_fin: EV[1].fecha_fin, evento_id: null, n: 6 }] };
      case 'curso_vincular': return { inscritos: 0 };
      case 'inscritos':
        e = ev(q.evento_id);
        return { cursos_ext: e.id === EV[0].id ? [{ id: 'ART-RODILLA-2026', nombre: 'Curso de artroscopia de rodilla', n: 8 }] : [], integracion: true, inscritos: clone(INS.filter(function (x) { return x.evento_id === e.id; }).sort(function (a, b) { return (a.apellido + a.nombre).localeCompare(b.apellido + b.nombre); })),
          asistencias: clone(ASI.filter(function (x) { return x.evento_id === e.id; })), checklist: clone(listaEv(e)), propio: !!e.checklist_ing, dias: clone(e.dias), tick: tick() };
      case 'ingresos_hoy':
        var hy = dia(0), evs = EV.filter(function (x) { return (x.estado === 'programado' || x.estado === 'en_curso') && x.dias.some(function (d) { return d.fecha === hy; }); }).map(function (x) {
          var d = x.dias.find(function (dd) { return dd.fecha === hy; });
          return { id: x.id, titulo: x.titulo, sala_id: x.sala_id, fecha: x.fecha, fecha_fin: x.fecha_fin, estado: x.estado, hora_ini: d.hora_ini, hora_fin: d.hora_fin_ext || d.hora_fin,
            inscritos: INS.filter(function (i) { return i.evento_id === x.id; }).length, ingresaron: ASI.filter(function (a) { return a.evento_id === x.id && a.fecha === hy; }).length,
            completos: ASI.filter(function (a) { return a.evento_id === x.id && a.fecha === hy && a.completo; }).length };
        }).sort(function (a, b) { return a.hora_ini < b.hora_ini ? -1 : 1; });
        var ult = ASI.filter(function (a) { return a.fecha === hy; }).sort(function (a, b) { return a.ingreso_en < b.ingreso_en ? 1 : -1; }).slice(0, 40).map(function (a) {
          var i = INS.find(function (x) { return x.id === a.inscrito_id; });
          return { id: a.id, evento_id: a.evento_id, ingreso_en: a.ingreso_en, ingreso_por: a.ingreso_por, medio: a.medio, completo: a.completo, nombre: i.nombre, apellido: i.apellido, codigo: i.codigo, documento: i.documento, tipo_doc: i.tipo_doc, n_items: Object.keys(a.items).length };
        });
        return { eventos: evs, ingresos: ult, hoy: hy, tick: tick() };
      case 'inscrito_guardar':
        e = ev(v.evento_id); if (e.estado === 'cerrado' || e.estado === 'cancelado') E('El evento está cerrado o cancelado.', 409);
        var rolI = ['Participante', 'Instructor', 'Staff'].indexOf(v.rol) >= 0 ? v.rol : 'Participante';
        if (!+v.id && rolI === 'Participante') E('Con la integración activa, los participantes solo llegan desde la plataforma de inscripciones, con pago completo y proceso de inscripción completo. Instructores y staff sí se registran aquí.', 403);
        var di = { rol: rolI, nombre: t(v.nombre, 120), apellido: t(v.apellido, 120), tipo_doc: ['CC', 'CE', 'PA', 'TI', 'Otro'].indexOf(v.tipo_doc) >= 0 ? v.tipo_doc : 'CC', documento: t(v.documento, 40).replace(/\s+/g, ''),
          especialidad: t(v.especialidad, 120), institucion: t(v.institucion, 200), correo: t(v.correo, 160), telefono: t(v.telefono, 40), estacion: t(v.estacion, 40), nota: t(v.nota, 500) };
        if (!di.nombre) E('Escriba el nombre del participante.'); if (!di.documento) E('Escriba el documento de identidad.');
        if (INS.some(function (x) { return x.evento_id === e.id && x.documento === di.documento && x.id !== +v.id; })) E('Ya hay un participante con el documento ' + di.documento + ' en este curso.');
        if (+v.id) { var ie = INS.find(function (x) { return x.id === +v.id; }); Object.assign(ie, di, { actualizado_por: uid, actualizado_en: ahora() }); r(uid, 'inscrito', ie.id, e.id, 'Actualizó los datos de un participante', nomI(di) + ' · ' + di.tipo_doc + ' ' + di.documento); return { id: ie.id }; }
        var ni = Object.assign({ id: sigId(INS), evento_id: e.id, codigo: codigoIns(), origen: 'Manual', creado_por: uid, creado_en: ahora() }, di); INS.push(ni);
        r(uid, 'inscrito', ni.id, e.id, 'Inscribió un participante al curso', nomI(di) + ' · ' + di.tipo_doc + ' ' + di.documento + ' · Código QR ' + ni.codigo); return { id: ni.id };
      case 'inscritos_importar':
        e = ev(v.evento_id); var nImp = 0, nDup = 0, nMal = 0, nOm = 0;
        (v.filas || []).forEach(function (f) {
          var nm = t(f.nombre, 120), dc = t(f.documento, 40).replace(/\s+/g, ''); if (!nm || !dc) { nMal++; return; }
          var rf = String(f.rol || '').toLowerCase(), rolF = /instruct|docente|profesor|ponente|speaker|faculty|conferencista|tutor/.test(rf) ? 'Instructor' : /staff|apoyo|log[ií]st|organiza|coordina|equipo|personal/.test(rf) ? 'Staff' : 'Participante';
          if (rolF === 'Participante') { nOm++; return; }
          if (INS.some(function (x) { return x.evento_id === e.id && x.documento === dc; })) { nDup++; return; }
          var tr = t(f.tipo_doc, 60).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''), td = !tr || tr === 'cc' || /ciudadan/.test(tr) || tr === 'cedula' ? 'CC' : (tr === 'ce' || /extranj/.test(tr) ? 'CE' : (tr === 'pa' || /pasaport/.test(tr) ? 'PA' : (tr === 'ti' || /tarjeta/.test(tr) ? 'TI' : 'Otro')));
          INS.push({ id: sigId(INS), evento_id: e.id, codigo: codigoIns(), rol: rolF, dietas: [], restriccion: '', nombre: nm, apellido: t(f.apellido, 120), tipo_doc: td, documento: dc, especialidad: t(f.especialidad, 120), institucion: t(f.institucion, 200), correo: t(f.correo, 160), telefono: t(f.telefono, 40), estacion: t(f.estacion, 40), nota: t(f.nota, 500), origen: 'Importado', creado_por: uid, creado_en: ahora() }); nImp++;
        });
        if (nImp) r(uid, 'inscrito', null, e.id, 'Importó participantes al curso', nImp + ' participantes'); return { importados: nImp, duplicados: nDup, incompletos: nMal, omitidos: nOm };
      case 'inscrito_borrar':
        var ib = INS.find(function (x) { return x.id === +v.id; }); if (!ib) E('El participante no existe.');
        if (ASI.some(function (a) { return a.inscrito_id === ib.id; }) && !ADMIN) E('El participante ya tiene ingresos registrados. Solo la administradora puede retirarlo.', 403);
        ASI = ASI.filter(function (a) { return a.inscrito_id !== ib.id; }); INS.splice(INS.indexOf(ib), 1); r(uid, 'inscrito', ib.id, ib.evento_id, 'Retiró un participante del curso', nomI(ib)); return {};
      case 'escanear':
        var raw = t(v.codigo, 200).toUpperCase(), hy2 = dia(0), medio = 'QR', ic = null, mm = /CLM[0-9A-Z]{9}/.exec(raw);
        if (!raw) E('Escanee o escriba el código.');
        if (mm) { ic = INS.find(function (x) { return x.codigo === mm[0]; }); if (v.medio === 'Manual') medio = 'Manual'; }
        else { var dg = raw.replace(/[^0-9A-Z]/g, ''); medio = v.medio === 'Manual' ? 'Manual' : 'Documento';
          var cands = INS.filter(function (x) { return x.documento.toUpperCase().replace(/[.\-]/g, '') === dg; });
          ic = cands.find(function (x) { return x.evento_id === +v.evento_id; }) || cands.find(function (x) { var ee = ev(x.evento_id); return ee.dias.some(function (d) { return d.fecha === hy2; }); }) || cands[0]; }
        if (!ic) E('Código no reconocido: «' + raw.slice(0, 40) + '». Verifique que el participante esté inscrito en el curso.', 404);
        e = ev(ic.evento_id); var info = { id: ic.id, nombre: nomI(ic), documento: ic.tipo_doc + ' ' + ic.documento, evento: e.titulo, evento_id: e.id };
        if (+v.evento_id && +v.evento_id !== e.id) E(nomI(ic) + ' está inscrito en otro curso: «' + e.titulo + '».', 409, { inscrito: info });
        if (e.estado === 'cancelado') E('El curso «' + e.titulo + '» está cancelado.', 409, { inscrito: info });
        if (e.estado === 'cerrado') E('El curso «' + e.titulo + '» ya fue cerrado y firmado.', 409, { inscrito: info });
        if (!e.dias.some(function (d) { return d.fecha === hy2; })) E(nomI(ic) + ' está inscrito en «' + e.titulo + '» (' + fc(e.fecha) + (e.fecha_fin !== e.fecha ? ' al ' + fc(e.fecha_fin) : '') + '), pero hoy no hay sesión de ese curso.', 409, { inscrito: info });
        if (!e.checklist_ing) e.checklist_ing = CHK.slice();
        var as = ASI.find(function (a) { return a.inscrito_id === ic.id && a.fecha === hy2; }), nuevo = false;
        if (!as) { as = { id: sigId(ASI), inscrito_id: ic.id, evento_id: e.id, fecha: hy2, ingreso_en: ahora(), ingreso_por: uid, medio: medio, items: {}, completo: 0, obs: '' }; ASI.push(as); nuevo = true;
          r(uid, 'asistencia', as.id, e.id, 'Registró el ingreso de un participante', nomI(ic) + ' · ' + ic.tipo_doc + ' ' + ic.documento + ' · ' + (medio === 'QR' ? 'código QR' : medio === 'Manual' ? 'registro manual' : 'documento')); }
        return { nuevo: nuevo, inscrito: clone(ic), asistencia: asiJ(as), checklist: clone(listaEv(e)), evento: { id: e.id, titulo: e.titulo, sala: (SALAS.find(function (x) { return x.id === e.sala_id; }) || {}).nombre, fecha: e.fecha, fecha_fin: e.fecha_fin, estado: e.estado }, tick: tick() };
      case 'asistencia_item':
        var aa = ASI.find(function (x) { return x.id === +v.asistencia_id; }); if (!aa) E('El ingreso no existe.');
        e = ev(aa.evento_id); var ia = INS.find(function (x) { return x.id === aa.inscrito_id; }), la = listaEv(e), acc, det;
        if (v.todos) { la.forEach(function (x) { if (!aa.items[x]) aa.items[x] = { ok: 1, por: uid, en: ahora() }; }); acc = 'Marcó todo el check list de ingreso'; det = nomI(ia); }
        else if (v.item != null && v.item !== '') { if (la.indexOf(v.item) < 0) E('El ítem no está en el check list del curso.'); if (v.ok) aa.items[v.item] = { ok: 1, por: uid, en: ahora() }; else delete aa.items[v.item]; acc = (v.ok ? 'Marcó' : 'Desmarcó') + ' un ítem del check list de ingreso'; det = nomI(ia) + ' · ' + v.item; }
        else { aa.obs = t(v.obs, 1000); acc = 'Escribió una observación en el check list de ingreso'; det = nomI(ia) + ' · ' + aa.obs; }
        var antes = aa.completo; aa.completo = la.every(function (x) { return aa.items[x]; }) ? 1 : 0;
        r(uid, 'asistencia', aa.id, e.id, acc, det + (aa.completo && !antes ? ' · Check list completo' : '')); return { asistencia: asiJ(aa) };
      case 'checklist_evento':
        e = ev(v.evento_id); var le = (v.items || []).map(function (x) { return t(x, 200); }).filter(Boolean); if (!le.length) E('La lista debe tener al menos un ítem.');
        e.checklist_ing = le; r(uid, 'evento', e.id, e.id, 'Ajustó el check list de ingreso del curso', le.length + ' ítems'); return {};
      case 'checklist_global':
        if (!ADMIN) E('Solo la administradora puede hacer este cambio.', 403);
        var lg = (v.items || []).map(function (x) { return t(x, 200); }).filter(Boolean); if (!lg.length) E('La lista debe tener al menos un ítem.');
        CHK = lg; r(uid, 'plantilla', null, null, 'Actualizó el check list de ingreso de participantes', lg.length + ' ítems'); return {};
      case 'evento_guardar':
        var c = { titulo: t(v.titulo, 200), especialidad: t(v.especialidad, 120), empresa: t(v.empresa, 200), sala_id: +v.sala_id, fecha: t(v.fecha, 10), fecha_fin: t(v.fecha_fin, 10),
          responsable_id: +v.responsable_id, tanatologo_id: +v.tanatologo_id, participantes: Math.max(0, +v.participantes || 0), componentes: Math.max(0, +v.componentes || 0), descripcion: t(v.descripcion, 4000) };
        if (!c.titulo) E('Escriba el nombre del entrenamiento.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(c.fecha)) E('Seleccione la fecha de inicio.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(c.fecha_fin)) E('Seleccione la fecha final.');
        if (c.fecha_fin < c.fecha) E('La fecha final no puede ser anterior a la fecha de inicio.');
        if (!U.find(function (x) { return x.id === c.responsable_id && x.rol === 'instrumentador'; })) E('Seleccione el instrumentador a cargo.');
        if (!U.find(function (x) { return x.id === c.tanatologo_id && x.rol === 'tanatologo'; })) E('Seleccione el tanatólogo a cargo.');
        var env = {}; (v.dias || []).forEach(function (d) { env[d.fecha] = d; });
        var nd = [];
        for (var f = c.fecha; f <= c.fecha_fin; f = sumarD(f, 1)) {
          var dd = env[f]; if (!dd) E('Falta el horario del ' + fc(f) + '.');
          if (!/^\d{2}:\d{2}$/.test(dd.hora_ini) || !/^\d{2}:\d{2}$/.test(dd.hora_fin)) E('Indique hora de inicio y de fin del ' + fc(f) + '.');
          if (dd.hora_fin <= dd.hora_ini) E('El ' + fc(f) + ' la hora de fin debe ser posterior a la de inicio.');
          nd.push({ fecha: f, hora_ini: dd.hora_ini, hora_fin: dd.hora_fin, just: t(dd.justificacion, 1000) });
          if (nd.length > 31) E('Un entrenamiento puede durar máximo 31 días.');
        }
        id = +v.id || 0;
        if (!v.forzar) nd.forEach(function (d) {
          EV.forEach(function (x) {
            if (x.id === id || x.sala_id !== c.sala_id || x.estado === 'cancelado') return;
            var o = (x.dias || []).find(function (k) { return k.fecha === d.fecha; });
            if (o && o.hora_ini < d.hora_fin && (o.hora_fin_ext || o.hora_fin) > d.hora_ini) E('El ' + fc(d.fecha) + ' la sala ya tiene «' + x.titulo + '» de ' + o.hora_ini + ' a ' + (o.hora_fin_ext || o.hora_fin) + '.', 409, { cruce: true });
          });
        });
        c.hora_ini = nd[0].hora_ini; c.hora_fin = nd[0].hora_fin;
        if (id) {
          e = ev(id); editable(e);
          var cambios = [], viejos = {}; (e.dias || []).forEach(function (d) { viejos[d.fecha] = d; });
          ['titulo', 'especialidad', 'empresa', 'sala_id', 'fecha', 'fecha_fin', 'responsable_id', 'tanatologo_id', 'participantes', 'componentes', 'descripcion'].forEach(function (k) {
            if (String(e[k]) !== String(c[k])) { var fm = function (x) { return /_id$/.test(k) && k !== 'sala_id' ? nombre(x) : k === 'sala_id' ? nomSala(x) : String(x); }; cambios.push(k.replace('_id', '').replace('_', ' ') + ': «' + fm(e[k]) + '» → «' + fm(c[k]) + '»'); }
          });
          var nuevos = nd.map(function (d) {
            var o = viejos[d.fecha];
            if (!o) { cambios.push('Día agregado ' + fc(d.fecha)); return { fecha: d.fecha, hora_ini: d.hora_ini, hora_fin: d.hora_fin, hora_fin_ext: null, justificacion: '' }; }
            var fin = o.hora_fin_ext || o.hora_fin, n = clone(o); n.hora_ini = d.hora_ini;
            if (d.hora_fin > fin) {
              if (!d.just) E('El ' + fc(d.fecha) + ' la hora de finalización pasa de ' + fin + ' a ' + d.hora_fin + '. Escriba la justificación de la extensión.');
              cambios.push('Extensión ' + fc(d.fecha) + ': ' + fin + ' → ' + d.hora_fin + '. Justificación: ' + d.just);
              n.hora_fin_ext = d.hora_fin; n.justificacion = ((o.justificacion ? o.justificacion + '\n' : '') + fin + ' → ' + d.hora_fin + ': ' + d.just); n.ext_por = uid; n.ext_en = ahora();
            } else if (d.hora_fin !== fin || d.hora_ini !== o.hora_ini) {
              cambios.push('Horario ' + fc(d.fecha) + ': ' + o.hora_ini + '–' + fin + ' → ' + d.hora_ini + '–' + d.hora_fin);
              if (o.hora_fin_ext) n.hora_fin_ext = d.hora_fin; else n.hora_fin = d.hora_fin;
            }
            return n;
          });
          (e.dias || []).forEach(function (o) { if (!nd.find(function (d) { return d.fecha === o.fecha; })) cambios.push('Día quitado ' + fc(o.fecha)); });
          if (!cambios.length) return { id: id, sin_cambios: true };
          Object.assign(e, c, { apoyo: v.apoyo || [], dias: nuevos, actualizado_por: uid, actualizado_en: ahora() });
          r(uid, 'evento', id, id, 'Modificó datos del evento', cambios.join('\n'));
        } else {
          var s = SALAS.find(function (x) { return x.id === c.sala_id; });
          e = Object.assign({ id: ++seq.ev, apoyo: v.apoyo || [], layout: clone(s.base || []), estado: 'programado', creado_por: uid, creado_en: ahora(), actualizado_por: uid, actualizado_en: ahora(),
            dias: nd.map(function (d) { return { fecha: d.fecha, hora_ini: d.hora_ini, hora_fin: d.hora_fin, hora_fin_ext: null, justificacion: '' }; }) }, c);
          EV.push(e); id = e.id;
          r(uid, 'evento', id, id, 'Creó el evento', c.titulo + ' · ' + nomSala(c.sala_id) + ' · ' + (nd.length > 1 ? fc(c.fecha) + ' a ' + fc(c.fecha_fin) + ' (' + nd.length + ' días)' : fc(c.fecha) + ' ' + c.hora_ini + '–' + c.hora_fin) +
            '\nInstrumentador a cargo: ' + nombre(c.responsable_id) + ' · Tanatólogo a cargo: ' + nombre(c.tanatologo_id));
          var pl = PLANT.find(function (p) { return p.id === +v.plantilla_id; });
          if (pl) { pl.items.forEach(function (x, i) { VER.push({ id: ++seq.ver, evento_id: id, fase: x.fase, texto: x.texto, orden: i, estado: 'pendiente', obs: '', creado_por: uid, creado_en: ahora() }); }); r(uid, 'verificacion', null, id, 'Cargó lista de verificación', pl.nombre); }
        }
        return { id: id };
      case 'dia_extender':
        e = ev(v.evento_id); editable(e);
        var dx = (e.dias || []).find(function (k) { return k.fecha === v.fecha; }); if (!dx) E('Ese día no pertenece al entrenamiento.');
        var finA = dx.hora_fin_ext || dx.hora_fin;
        if (!/^\d{2}:\d{2}$/.test(v.hora_fin || '')) E('Indique la nueva hora de finalización.');
        if (v.hora_fin <= finA) E('La nueva hora debe ser posterior a la hora de finalización actual (' + finA + ').');
        if (!t(v.justificacion)) E('La justificación de la extensión es obligatoria.');
        dx.justificacion = (dx.justificacion ? dx.justificacion + '\n' : '') + finA + ' → ' + v.hora_fin + ': ' + t(v.justificacion, 1000);
        dx.hora_fin_ext = v.hora_fin; dx.ext_por = uid; dx.ext_en = ahora(); e.actualizado_por = uid; e.actualizado_en = ahora();
        r(uid, 'evento', e.id, e.id, 'Extendió el horario del ' + fc(v.fecha), finA + ' → ' + v.hora_fin + '\nJustificación: ' + t(v.justificacion)); return {};
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
        NOV.push(nv); r(uid, 'novedad', nv.id, e.id, 'Registró ' + v.tipo.toLowerCase(), 'Funcionario: ' + YO.nombre + ' (' + { admin: 'Administración', instrumentador: 'Instrumentación quirúrgica', tanatologo: 'Tanatología' }[YO.rol] + ')\n' + nv.texto + (nv.foto ? ' [con foto]' : '')); return {};
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
        var req = { empresa: 'el nombre de la empresa', entrega_nombre: 'el nombre de quien entrega', entrega_cedula: 'la cédula de quien entrega', recibe_nombre: 'el nombre de quien recibe', ubicacion: 'dónde se deja el equipo o instrumental' };
        Object.keys(req).forEach(function (k) { if (!t(v[k])) E('Falta ' + req[k] + '.'); });
        var its = (v.items || []).filter(function (i) { return t(i.desc); }).map(function (i) { return { desc: t(i.desc, 300), ref: t(i.ref, 80), cant: Math.max(1, +i.cant || 1), estado: i.estado || 'Bueno' }; });
        if (!its.length) E('Agregue al menos un equipo o instrumental a la lista.');
        if (!v.entrega_firma) E('Falta la firma de quien entrega.'); if (!v.recibe_firma) E('Falta la firma de quien recibe.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v.fecha_estimada || '')) E('Indique la fecha estimada de devolución y/o entrega.');
        var en2 = { id: ++seq.ent, evento_id: +v.evento_id || null, fecha_hora: ahora(), empresa: t(v.empresa), entrega_nombre: t(v.entrega_nombre), entrega_cedula: t(v.entrega_cedula), entrega_cargo: t(v.entrega_cargo),
          entrega_telefono: t(v.entrega_telefono), entrega_firma: guardarImg(v.entrega_firma, 'firma'), recibe_id: +v.recibe_id || null, recibe_nombre: t(v.recibe_nombre), recibe_cedula: t(v.recibe_cedula),
          recibe_firma: guardarImg(v.recibe_firma, 'firma'), ubicacion: t(v.ubicacion, 500), items: its, observaciones: t(v.observaciones, 4000), estado: 'En custodia', creado_por: uid, creado_en: ahora(), fecha_estimada: v.fecha_estimada, fecha_estimada_tipo: ['Devolución', 'Entrega', 'Devolución y entrega'].indexOf(v.fecha_estimada_tipo) >= 0 ? v.fecha_estimada_tipo : 'Devolución' };
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
        if (xd.estado !== 'En custodia') E('Esta entrega ya fue devuelta.');
        [['dev_entrega_nombre', 'el nombre de quien devuelve'], ['dev_entrega_cedula', 'la cédula de quien devuelve'], ['dev_recibe_nombre', 'el nombre de quien recibe por la empresa'], ['dev_recibe_cedula', 'la cédula de quien recibe por la empresa']].forEach(function (k) { if (!t(v[k[0]])) E('Falta ' + k[1] + '.'); });
        var env = v.dev_items || [], conNov = [];
        var di = xd.items.map(function (it, i) {
          var x = env[i] || {}, cant = Math.max(0, Math.min(+it.cant, x.cant == null ? +it.cant : +x.cant)), est = x.estado || 'Completo', nota = t(x.nota, 500);
          if (cant < +it.cant && est === 'Completo') est = cant === 0 ? 'No devuelto' : 'Faltante';
          if (est !== 'Completo' && !nota) E('Escriba la novedad de «' + it.desc + '» (' + est.toLowerCase() + ').');
          if (est !== 'Completo') conNov.push(it.desc + ': ' + est.toLowerCase() + ' (' + cant + ' de ' + it.cant + ') — ' + nota);
          return { desc: it.desc, ref: it.ref, cant: +it.cant, cant_dev: cant, estado: est, nota: nota };
        });
        if (v.dev_novedad === 'Con novedades' && !conNov.length && !t(v.dev_obs)) E('Describa las novedades de la devolución.');
        if (!v.dev_entrega_firma || !v.dev_recibe_firma) E('Faltan las firmas de la devolución.');
        var novd = conNov.length || v.dev_novedad === 'Con novedades' ? 'Con novedades' : 'Sin novedades';
        Object.assign(xd, { estado: 'Devuelto', dev_fecha_hora: ahora(), dev_entrega_id: uid, dev_entrega_nombre: t(v.dev_entrega_nombre), dev_entrega_cedula: t(v.dev_entrega_cedula),
          dev_entrega_firma: guardarImg(v.dev_entrega_firma, 'firma'), dev_recibe_nombre: t(v.dev_recibe_nombre), dev_recibe_cedula: t(v.dev_recibe_cedula), dev_recibe_firma: guardarImg(v.dev_recibe_firma, 'firma'),
          dev_obs: t(v.dev_obs), dev_items: di, dev_novedad: novd });
        (v.fotos || []).forEach(function (f) { FOT.push({ id: ++seq.fot, entrega_id: xd.id, momento: 'Devolución', archivo: guardarImg(f, 'entrega'), creado_por: uid, creado_en: ahora() }); });
        r(uid, 'entrega', xd.id, xd.evento_id, 'Registró devolución a la empresa (' + novd.toLowerCase() + ')', xd.empresa + (conNov.length ? '\n' + conNov.join('\n') : '') + (t(v.dev_obs) ? '\nNovedades: ' + t(v.dev_obs) : '')); return {};
      case 'morgue':
        return { componentes: clone(COMP.slice().sort(function (a, b) { return (a.estado === 'Disposición final') - (b.estado === 'Disposición final') || (a.codigo < b.codigo ? -1 : 1); }).map(function (c) {
            var o = clone(c), dd = DISP.find(function (x) { return x.componente_id === c.id; }); if (dd) { o.dispo_tipo = dd.tipo; o.dispo_fecha = dd.fecha_hora; o.dispo_destino = dd.destino; o.dispo_entidad = dd.entidad; o.dispo_documento = dd.documento; o.dispo_recibe = dd.recibe_nombre; } o.ingreso_img = ADJ.filter(function (a) { return a.componente_id === c.id && a.clase === 'imagen' && a.momento === 'Ingreso'; }).length; o.ingreso_normal = ADJ.some(function (a) { return a.componente_id === c.id && a.clase === 'video' && a.momento === 'Ingreso' && a.tipo_video === 'Normal'; }); o.partes = PAR.filter(function (p) { return p.componente_id === c.id; }).map(function (p) { return { id: p.id, componente_id: p.componente_id, region: p.region, lado: p.lado, codigo: p.codigo, estado: p.estado, usos: p.usos }; }); return o; })),
          asignaciones: clone(ASG.map(asgFull).filter(function (a) { return a.estado === 'Reservada' || a.estado === 'En uso' || a.fecha_fin >= dia(-7); })),
          actividad: BIT.filter(function (b) { return ['componente', 'parte', 'asignacion'].indexOf(b.entidad) >= 0; }).slice(-25).reverse(), regiones: REG, tick: tick() };
      case 'componente':
        var cm = COMP.find(function (x) { return x.id === +q.id; }); if (!cm) E('El componente no existe.', 404);
        var oc = clone(cm);
        oc.partes = clone(PAR.filter(function (p) { return p.componente_id === cm.id; }).map(function (p) { var a = ASG.find(function (x) { return x.parte_id === p.id && (x.estado === 'Reservada' || x.estado === 'En uso'); }); return Object.assign({}, p, { evento_actual: a ? a.evento_id : null }); }));
        oc.asignaciones = clone(ASG.filter(function (a) { return PAR.find(function (p) { return p.id === a.parte_id; }).componente_id === cm.id; }).map(asgFull).reverse());
        oc.bitacora = clone(BIT.filter(function (b) { return (b.entidad === 'componente' && b.entidad_id === cm.id) || (['parte', 'asignacion'].indexOf(b.entidad) >= 0 && b.detalle.indexOf(cm.codigo) >= 0); }).reverse());
        oc.adjuntos = ADJ.filter(function (x) { return x.componente_id === cm.id; }).slice().reverse().map(function (x) { var o = Object.assign({}, x); return o; });
        var ids = oc.adjuntos.map(function (a) { return a.id; });
        oc.adjuntos = oc.adjuntos.map(function (a) { var o2 = Object.assign({ momento: 'General', tipo_video: '', meta: null, fuente_id: null }, a); delete o2._url; return o2; });
        oc.marcas = clone(MARC.filter(function (m) { return ids.indexOf(m.adjunto_id) >= 0; }));
        oc.disposicion = clone(DISP.find(function (d) { return d.componente_id === cm.id; }) || null);
        var sb = {}; REG.forEach(function (rg) { sb[rg[0]] = subDe(rg[0], oc.sexo); }); return { componente: oc, regiones: REG, subpartes: sb, subparte_estados: ['Presente', 'Usada', 'Dañada', 'Ausente / retirada'], limite_adjunto: 200 * 1048576, tipos_adjunto: Object.keys(TIPOS_ADJ) };
      case 'marca_guardar':
        var ag = ADJ.find(function (x) { return x.id === +v.adjunto_id && (x.clase === 'giro' || x.clase === 'modelo3d'); }); if (!ag) E('La vista 3D no existe.');
        if (!t(v.texto, 500)) E('Escriba la descripción del hallazgo.');
        var mk = { id: sigId(MARC), adjunto_id: ag.id, frame: +v.frame || 0, x: +v.x, y: +v.y, z: v.z == null ? null : +v.z, tipo: t(v.tipo, 60), texto: t(v.texto, 500), creado_por: uid, creado_en: ahora() };
        MARC.push(mk); r(uid, 'componente', ag.componente_id, null, 'Registró un hallazgo en la vista 3D ' + (ag.momento !== 'General' ? 'de ' + ag.momento.toLowerCase() + ' ' : '') + 'de ' + COMP.find(function (x) { return x.id === ag.componente_id; }).codigo, mk.tipo + ': ' + mk.texto);
        return { id: mk.id, creado_por: uid, creado_en: mk.creado_en };
      case 'marca_borrar':
        var mb = MARC.find(function (x) { return x.id === +v.id; }); if (!mb) E('El hallazgo no existe.');
        if (YO.rol !== 'admin' && mb.creado_por !== uid) E('Solo quien registró el hallazgo o la administradora pueden eliminarlo.', 403);
        MARC.splice(MARC.indexOf(mb), 1); var amb = ADJ.find(function (x) { return x.id === mb.adjunto_id; });
        r(uid, 'componente', amb.componente_id, null, 'Eliminó un hallazgo de la vista 3D de ' + COMP.find(function (x) { return x.id === amb.componente_id; }).codigo, mb.tipo + ': ' + mb.texto); return {};
      case 'disposicion_guardar':
        var cd = COMP.find(function (x) { return x.id === +v.componente_id; }); if (!cd) E('El componente no existe.');
        if (DISP.find(function (d) { return d.componente_id === cd.id; })) E('Este componente ya tiene ficha de disposición final.');
        if (['Inhumación', 'Cremación', 'Devolución a familiares', 'Devolución a la entidad de origen', 'Exhumación', 'Otra'].indexOf(v.tipo) < 0) E('Seleccione qué sucede con el cuerpo (tipo de disposición).');
        if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(v.fecha_hora || '')) E('Indique la fecha y hora de salida.');
        [['destino', 'el destino o lugar (cementerio, crematorio, entidad)'], ['estado_corporal', 'el estado corporal a la salida'], ['entrega_nombre', 'el nombre de quien entrega'], ['recibe_nombre', 'el nombre de quien recibe'], ['recibe_cedula', 'la cédula de quien recibe']].forEach(function (k) { if (!t(v[k[0]], 4000)) E('Falta ' + k[1] + '.'); });
        var act = PAR.filter(function (pp) { return pp.componente_id === cd.id && (pp.estado === 'Reservada' || pp.estado === 'En uso'); });
        if (act.length) E('Hay partes reservadas o en sala (' + act.map(function (pp) { return pp.codigo; }).join(', ') + '). Devuélvalas a la morgue antes de la disposición final.');
        if (!ADJ.some(function (a) { return a.componente_id === cd.id && a.clase === 'imagen' && a.momento === 'Salida'; })) E('Antes de la disposición final suba las imágenes de salida del cuerpo.');
        if (!v.entrega_firma) E('Falta la firma de quien entrega.'); if (!v.recibe_firma) E('Falta la firma de quien recibe.');
        crearDisp(cd, v, uid, ahora()); return {};
      case 'adjunto_borrar':
        var ab = ADJ.find(function (x) { return x.id === +v.id; }); if (!ab) E('El adjunto no existe.');
        if (YO.rol !== 'admin' && ab.creado_por !== uid) E('Solo quien subió el archivo o la administradora pueden eliminarlo.', 403);
        ADJ.filter(function (x) { return x.id === ab.id || x.fuente_id === ab.id; }).forEach(function (x) { MARC = MARC.filter(function (m) { return m.adjunto_id !== x.id; }); ADJ.splice(ADJ.indexOf(x), 1); });
        r(uid, 'componente', ab.componente_id, null, 'Eliminó un adjunto de ' + COMP.find(function (x) { return x.id === ab.componente_id; }).codigo, ab.nombre); return {};
      case 'componente_guardar':
        var dc = { codigo: t(v.codigo, 40).toUpperCase(), tipo: v.tipo === 'Segmento' ? 'Segmento' : 'Cuerpo completo', sexo: v.sexo, edad: v.edad === '' || v.edad == null ? null : +v.edad, fecha_ingreso: t(v.fecha_ingreso, 10),
          procedencia: t(v.procedencia, 200), conservacion: v.conservacion, estado: v.estado || 'Disponible', ubicacion: t(v.ubicacion, 200), obs: t(v.obs, 3000) };
        if (!dc.codigo) E('Escriba el código del componente (letras, números y guiones).');
        if (['Masculino', 'Femenino', 'Indeterminado'].indexOf(dc.sexo) < 0) E('Seleccione el sexo.');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dc.fecha_ingreso)) E('Indique la fecha de ingreso.');
        if (+v.id && DISP.find(function (d) { return d.componente_id === +v.id; })) dc.estado = 'Disposición final';
        else if (dc.estado === 'Disposición final') E('La disposición final se registra con su ficha: use el botón «Disposición final» del componente.');
        if (COMP.find(function (x) { return x.codigo === dc.codigo && x.id !== +v.id; })) E('Ya existe un componente con el código ' + dc.codigo + '.');
        if (+v.id) {
          var ce = COMP.find(function (x) { return x.id === +v.id; }), ch = [];
          Object.keys(dc).forEach(function (k) { if (String(ce[k] == null ? '' : ce[k]) !== String(dc[k] == null ? '' : dc[k])) ch.push(k + ': «' + (ce[k] == null ? '' : ce[k]) + '» → «' + (dc[k] == null ? '' : dc[k]) + '»'); });
          var ex = {}; PAR.forEach(function (p) { if (p.componente_id === ce.id) ex[p.region + (p.lado ? '|' + p.lado : '')] = p; });
          var sel = dc.tipo === 'Cuerpo completo' ? null : (Array.isArray(v.partes) ? v.partes : Object.keys(ex)), ag = [], ret = [];
          REG.forEach(function (rg) { if (rg[3] && rg[3] !== dc.sexo) return; (rg[2] ? ['Derecho', 'Izquierdo'] : ['']).forEach(function (l) {
            var k = rg[0] + (l ? '|' + l : ''), quiere = sel === null || sel.indexOf(k) >= 0;
            if (quiere && !ex[k]) ag.push([rg, l]); if (!quiere && ex[k]) ret.push(ex[k]); }); });
          Object.keys(ex).forEach(function (k) { var rg = REG.find(function (x) { return x[0] === ex[k].region; }); if (rg && rg[3] && rg[3] !== dc.sexo && ret.indexOf(ex[k]) < 0) ret.push(ex[k]); });
          ret.forEach(function (p) { if (p.estado !== 'Disponible' || ASG.find(function (a) { return a.parte_id === p.id; })) E('No se puede retirar ' + nombreP(p) + ' (' + p.codigo + ') porque ya tiene historial en eventos o no está disponible. Márquela como «Descartada» desde la parte.'); });
          if (Object.keys(ex).length - ret.length + ag.length === 0) E('Seleccione las partes que incluye el segmento.');
          if (ag.length) ch.push('Partes agregadas: ' + ag.map(function (x) { return nombreP({ region: x[0][0], lado: x[1] }); }).join(', '));
          if (ret.length) ch.push('Partes retiradas: ' + ret.map(function (p) { return nombreP(p); }).join(', '));
          if (!ch.length) return { id: ce.id, sin_cambios: true };
          ret.forEach(function (p) { PAR.splice(PAR.indexOf(p), 1); ADJ.forEach(function (a) { if (a.parte_id === p.id) a.parte_id = null; }); });
          ag.forEach(function (x) { PAR.push({ id: PAR.reduce(function (m, p) { return Math.max(m, p.id); }, 0) + 1, componente_id: ce.id, region: x[0][0], lado: x[1], codigo: (dc.codigo) + '-' + x[0][1] + (x[1] ? (x[1] === 'Derecho' ? 'D' : 'I') : ''), estado: 'Disponible', usos: 0, ubicacion: '', obs: '' }); });
          if (ce.codigo !== dc.codigo) PAR.forEach(function (p) { if (p.componente_id === ce.id) p.codigo = dc.codigo + p.codigo.slice(ce.codigo.length); });
          Object.assign(ce, dc, { actualizado_por: uid, actualizado_en: ahora() }); r(uid, 'componente', ce.id, null, 'Modificó el componente ' + dc.codigo, ch.join('\n')); return { id: ce.id };
        }
        var nc = Object.assign({ id: COMP.length + 1, creado_por: uid, creado_en: ahora(), actualizado_por: uid, actualizado_en: ahora() }, dc), n = 0;
        REG.forEach(function (rg) { if (rg[3] && rg[3] !== dc.sexo) return; (rg[2] ? ['Derecho', 'Izquierdo'] : ['']).forEach(function (l) {
          if (dc.tipo === 'Segmento' && (v.partes || []).indexOf(rg[0] + (l ? '|' + l : '')) < 0) return;
          PAR.push({ id: PAR.reduce(function (m, p) { return Math.max(m, p.id); }, 0) + 1, componente_id: nc.id, region: rg[0], lado: l, codigo: dc.codigo + '-' + rg[1] + (l ? (l === 'Derecho' ? 'D' : 'I') : ''), estado: 'Disponible', usos: 0, ubicacion: '', obs: '' }); n++;
        }); });
        if (!n) E('Seleccione las partes que incluye el segmento.');
        COMP.push(nc); r(uid, 'componente', nc.id, null, 'Registró el componente anatómico ' + dc.codigo, dc.tipo + ' · ' + dc.sexo + (dc.edad != null ? ' · ' + dc.edad + ' años' : '') + ' · ' + dc.conservacion + ' · ' + n + ' partes');
        return { id: nc.id };
      case 'parte_agregar':
        var cpa = COMP.find(function (x) { return x.id === +v.componente_id; }), rga = REG.find(function (x) { return x[0] === v.region; });
        var la = rga[2] ? (v.lado === 'Izquierdo' ? 'Izquierdo' : 'Derecho') : '', coda = cpa.codigo + '-' + rga[1] + (la ? (la === 'Derecho' ? 'D' : 'I') : '');
        if (PAR.find(function (p) { return p.codigo === coda; })) E('Esa parte ya está registrada en el componente.');
        PAR.push({ id: PAR.reduce(function (m, p) { return Math.max(m, p.id); }, 0) + 1, componente_id: cpa.id, region: rga[0], lado: la, codigo: coda, estado: 'Disponible', usos: 0, ubicacion: '', obs: '' });
        r(uid, 'parte', PAR.length, null, 'Agregó una parte al componente', coda); return {};
      case 'parte_guardar':
        var pg = PAR.find(function (p) { return p.id === +v.id; }), obsp = t(v.obs, 1000);
        if (['Dañada', 'Descartada', 'Consumida'].indexOf(v.estado) >= 0 && v.estado !== pg.estado && !obsp) E('Escriba la observación del cambio a «' + v.estado + '».');
        if (v.estado === 'Disponible' && pg.estado !== 'Disponible' && ASG.find(function (a) { return a.parte_id === pg.id && (a.estado === 'Reservada' || a.estado === 'En uso'); })) E('La parte está asignada a un evento. Devuélvala desde la asignación.');
        var chp = []; if (v.estado !== pg.estado) chp.push('Estado: ' + pg.estado + ' → ' + v.estado); if (t(v.ubicacion) !== (pg.ubicacion || '')) chp.push('Ubicación: ' + t(v.ubicacion)); if (obsp !== (pg.obs || '')) chp.push('Observación: ' + obsp);
        if (v.subpartes && typeof v.subpartes === 'object') {
          var cmp = COMP.find(function (c) { return c.id === pg.componente_id; }), perm = subDe(pg.region, cmp.sexo), viejo = pg.subpartes || {}, nuevo = {};
          Object.keys(v.subpartes).forEach(function (n) { var x = v.subpartes[n]; if (perm.indexOf(n) < 0) return; var o = t(x.obs, 300); if (x.estado === 'Presente' && !o) return;
            var a = viejo[n]; nuevo[n] = a && a.estado === x.estado && a.obs === o ? a : { estado: x.estado, obs: o, por: YO.nombre, en: ahora() }; });
          Object.keys(Object.assign({}, viejo, nuevo)).forEach(function (n) { var a = viejo[n] ? viejo[n].estado : 'Presente', b = nuevo[n] ? nuevo[n].estado : 'Presente'; if (a !== b || (viejo[n] || {}).obs !== (nuevo[n] || {}).obs) chp.push(n + ': ' + a + ' → ' + b + (nuevo[n] && nuevo[n].obs ? ' (' + nuevo[n].obs + ')' : '')); });
          pg.subpartes = nuevo;
        }
        if (!chp.length) return {};
        Object.assign(pg, { estado: v.estado, ubicacion: t(v.ubicacion), obs: obsp }); r(uid, 'parte', pg.id, null, 'Actualizó la parte ' + pg.codigo, chp.join('\n')); return {};
      case 'asignar':
        e = ev(v.evento_id); editable(e);
        var ids = (v.partes || []).map(Number); if (!ids.length) E('Seleccione al menos una parte.');
        ids.forEach(function (pid) { var pp = PAR.find(function (p) { return p.id === pid; }); if (pp.estado !== 'Disponible') E('La parte ' + pp.codigo + ' no está disponible (' + pp.estado.toLowerCase() + ').'); });
        ids.forEach(function (pid) { var pp = PAR.find(function (p) { return p.id === pid; }), cc = COMP.find(function (c) { return c.id === pp.componente_id; }); if (['Disposición final', 'Pendiente de inhumación', 'Fuera de servicio', 'En cuarentena'].indexOf(cc.estado) >= 0) E('El componente de ' + pp.codigo + ' está en «' + cc.estado + '».'); });
        var hechas = ids.map(function (pid) { var pp = PAR.find(function (p) { return p.id === pid; }); pp.estado = 'Reservada';
          ASG.push({ id: ASG.length + 1, parte_id: pid, evento_id: e.id, estacion: t(v.estacion, 80), estado: 'Reservada', obs: '', creado_por: uid, creado_en: ahora(), actualizado_por: uid, actualizado_en: ahora() });
          return pp.codigo + ' (' + nombreP(pp) + ')'; });
        r(uid, 'asignacion', null, e.id, 'Reservó componentes anatómicos para el evento', (t(v.estacion) ? 'Estación: ' + t(v.estacion) + '\n' : '') + hechas.join('\n')); return {};
      case 'asignacion_estado':
        var ag = ASG.find(function (a) { return a.id === +v.id; }); if (!ag) E('La asignación no existe.');
        var pa = PAR.find(function (p) { return p.id === ag.parte_id; }), obsa = t(v.obs, 1000), nv2 = v.estado;
        var tr = { 'Reservada': ['En uso', 'Cancelada'], 'En uso': ['Devuelta a morgue', 'Consumida'] };
        if (!tr[ag.estado] || tr[ag.estado].indexOf(nv2) < 0) E('No se puede pasar de «' + ag.estado + '» a «' + nv2 + '».');
        var ep = { 'En uso': 'En uso', 'Cancelada': 'Disponible', 'Consumida': 'Consumida' };
        if (nv2 === 'Devuelta a morgue') { var cond = v.condicion === 'Dañada' ? 'Dañada' : 'Disponible'; if (cond === 'Dañada' && !obsa) E('Describa el daño de la parte.'); ep[nv2] = cond; pa.usos++; }
        if (nv2 === 'Consumida' && !obsa) E('Escriba la observación de la parte consumida.');
        pa.estado = ep[nv2];
        if (nv2 === 'Cancelada') ASG.splice(ASG.indexOf(ag), 1); else Object.assign(ag, { estado: nv2, obs: obsa || ag.obs, actualizado_por: uid, actualizado_en: ahora() });
        var txa = { 'En uso': 'Entregó a sala la parte', 'Cancelada': 'Liberó la reserva de la parte', 'Devuelta a morgue': 'Recibió en morgue la parte', 'Consumida': 'Registró como consumida la parte' };
        r(uid, 'asignacion', ag.id, ag.evento_id, txa[nv2] + ' ' + pa.codigo, nombreP(pa) + (ag.estacion ? ' · ' + ag.estacion : '') + (nv2 === 'Devuelta a morgue' ? ' · queda ' + pa.estado.toLowerCase() : '') + (obsa ? '\n' + obsa : '')); return {};
      case 'bitacora':
        return { bitacora: clone(BIT.slice().reverse().map(function (b) { var o = clone(b); var x = EV.find(function (k) { return k.id === b.evento_id; }); o.evento_titulo = x ? x.titulo : null; return o; })) };
      case 'usuario_guardar':
        admin(); if (!t(v.nombre) || !t(v.usuario)) E('Nombre y usuario son obligatorios.');
        if (+v.id) { var uu = U.find(function (k) { return k.id === +v.id; }); Object.assign(uu, { nombre: t(v.nombre), usuario: t(v.usuario).toLowerCase(), cedula: t(v.cedula), activo: uu.rol === 'admin' ? 1 : (v.activo ? 1 : 0), rol: uu.rol === 'admin' ? 'admin' : (['tanatologo', 'comercial', 'audiovisual', 'almacen'].indexOf(v.rol) >= 0 ? v.rol : 'instrumentador') }); uu.areas_extra = uu.rol === 'comercial' && v.presupuesto ? 'ps' : ''; r(uid, 'usuario', uu.id, null, 'Actualizó usuario', uu.nombre); }
        else { var nu = { id: U.length + 1, usuario: t(v.usuario).toLowerCase(), nombre: t(v.nombre), cedula: t(v.cedula), rol: ['tanatologo', 'comercial', 'audiovisual', 'almacen'].indexOf(v.rol) >= 0 ? v.rol : 'instrumentador', activo: 1, debe_cambiar: 0, areas_extra: v.rol === 'comercial' && v.presupuesto ? 'ps' : '' }; U.push(nu); r(uid, 'usuario', nu.id, null, 'Creó usuario', nu.nombre + ' (en la vista previa su contraseña es «demo»)'); }
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
      '<h2><span>1</span>Datos del evento</h2><div class="rp-kv">' + kv('Sala', s.nombre) + kv('Fecha de inicio', fl(e.fecha)) + kv('Fecha final', fl(e.fecha_fin || e.fecha)) +
        kv('Instrumentador a cargo', nombre(e.responsable_id)) + kv('Tanatólogo a cargo', e.tanatologo_id ? nombre(e.tanatologo_id) : '—') + kv('Apoyo', (e.apoyo || []).map(nombre).join(', ') || '—') + kv('Especialidad', e.especialidad || '—') +
        kv('Empresa / organizador', e.empresa || '—') + kv('Participantes', e.participantes || '—') + kv('Componentes anatómicos', e.componentes || '—') +
        kv('Creado', nombre(e.creado_por) + ' · ' + fm(e.creado_en)) + kv('Inicio real', e.iniciado_en ? fm(e.iniciado_en) : 'No registrado') + kv('Cierre', fm(e.cierre_en)) + '</div>' +
      '<table style="margin-top:10px"><thead><tr><th>Día</th><th>Inicio</th><th>Fin programado</th><th>Fin real</th><th>Justificación de extensión</th></tr></thead><tbody>' + (e.dias || []).map(function (d) {
        return '<tr><td>' + fl(d.fecha) + '</td><td>' + d.hora_ini + '</td><td>' + d.hora_fin + '</td><td>' + (d.hora_fin_ext ? '<b style="color:#B7791F">' + d.hora_fin_ext + '</b>' : d.hora_fin) + '</td><td class="rp-det">' + (d.justificacion ? h(d.justificacion) : '—') + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<h2><span>2</span>Verificación</h2>' + (ver.length ? '<div class="rp-res"><span>' + ver.length + ' ítems</span><span class="st-ok">' + cnt.ok + ' cumplen</span><span class="st-no">' + cnt.no + ' no cumplen</span><span>' + cnt.na + ' no aplican</span><span class="st-pendiente">' + cnt.pendiente + ' pendientes</span></div>' +
        '<table><thead><tr><th>Momento</th><th>Ítem</th><th>Resultado</th><th>Observación</th><th>Verificó</th></tr></thead><tbody>' + ver.map(function (x) {
          return '<tr><td>' + h(x.fase) + '</td><td>' + h(x.texto) + '</td><td class="st-' + x.estado + '">' + EST[x.estado] + '</td><td>' + h(x.obs) + '</td><td>' + (x.marcado_por ? h(nombre(x.marcado_por)) + '<br><small>' + x.marcado_en.slice(11, 16) + '</small>' : '—') + '</td></tr>';
        }).join('') + '</tbody></table>' : '<p>No se registraron ítems de verificación.</p>') +
      '<h2><span>3</span>Distribución final de la sala</h2><div class="rp-plano">' + window.Plano.svg({ sala: s, plano: s.plano, items: e.layout, catalogo: CAT }) + '</div>' +
      '<div class="rp-res">' + window.Plano.resumen(e.layout, CAT).map(function (x) { return '<span>' + x.n + ' × ' + h(x.nombre) + '</span>'; }).join('') + '</div>' +
      '<h2><span>4</span>Componentes anatómicos utilizados</h2>' + (function () { var as = ASG.filter(function (x) { return x.evento_id === e.id; }).map(asgFull);
        return as.length ? '<table><thead><tr><th>Estación</th><th>Parte</th><th>Componente</th><th>Estado final</th><th>Observación</th></tr></thead><tbody>' + as.map(function (a) {
          return '<tr><td>' + h(a.estacion || '—') + '</td><td><b>' + h(a.parte_codigo) + '</b><br><small>' + h(nombreP(a)) + '</small></td><td>' + h(a.componente_codigo) + '<br><small>' + h(a.sexo + ' · ' + a.edad + ' años') + '</small></td><td>' + h(a.estado) + '</td><td>' + h(a.obs) + '</td></tr>';
        }).join('') + '</tbody></table>' : '<p>No se registraron componentes anatómicos asignados a este evento.</p>'; })() +
      (function () {
        var ins = INS.filter(function (x) { return x.evento_id === e.id; }), L = listaEv(e);
        return '<h2><span>5</span>Participantes y check list de ingreso</h2>' + (ins.length ? '<table><thead><tr><th>Participante</th><th>Documento</th>' + e.dias.map(function (d) { return '<th>Ingreso ' + d.fecha.slice(8) + '/' + d.fecha.slice(5, 7) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          ins.map(function (i) { return '<tr><td><b>' + h(nomI(i)) + '</b><br><small>' + h(i.especialidad) + '</small></td><td>' + h(i.tipo_doc + ' ' + i.documento) + '</td>' + e.dias.map(function (d) { var a = ASI.find(function (x) { return x.inscrito_id === i.id && x.fecha === d.fecha; }); return '<td>' + (a ? '<b>' + a.ingreso_en.slice(11, 16) + '</b> · ' + a.medio + '<br><small>Check list ' + L.filter(function (t) { return a.items[t]; }).length + '/' + L.length + (a.completo ? ' · completo' : '') + '</small>' : '<small>No ingresó</small>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' : '<p>No se registraron participantes inscritos en este curso.</p>');
      })() +
      '<h2><span>6</span>Novedades del entrenamiento</h2>' + (nov.length ? '<table><thead><tr><th>Hora</th><th>Tipo</th><th>Descripción</th><th>Registró</th></tr></thead><tbody>' + nov.map(function (n) {
          return '<tr><td>' + n.creado_en.slice(11, 16) + '</td><td>' + h(n.tipo) + '</td><td>' + h(n.texto) + (n.foto ? '<div class="rp-fotos"><img src="' + archivo(n.foto) + '" alt=""></div>' : '') + '</td><td>' + h(nombre(n.creado_por)) + '</td></tr>';
        }).join('') + '</tbody></table>' : '<p>No se registraron novedades.</p>') +
      '<h2><span>7</span>Control de instrumental y equipos</h2>' + (ent.length ? ent.map(function (x) {
          var fs = FOT.filter(function (f) { return f.entrega_id === x.id; });
          return '<div class="rp-ent"><h3>' + h(x.empresa) + ' <small>· Entrega Nº ' + x.id + ' · ' + fm(x.fecha_hora) + ' · ' + h(x.estado) + '</small></h3><table><thead><tr><th>Descripción</th><th>Ref. / lote</th><th>Cant.</th><th>Estado</th></tr></thead><tbody>' +
            x.items.map(function (i) { return '<tr><td>' + h(i.desc) + '</td><td>' + h(i.ref || '—') + '</td><td>' + i.cant + '</td><td>' + h(i.estado) + '</td></tr>'; }).join('') + '</tbody></table>' +
            '<p><b>Ubicación:</b> ' + h(x.ubicacion) + '</p><div class="rp-firmas">' + firma(x.entrega_firma, x.entrega_nombre, 'C.C. ' + x.entrega_cedula + ' · Entrega') + firma(x.recibe_firma, x.recibe_nombre, (x.recibe_cedula ? 'C.C. ' + x.recibe_cedula + ' · ' : '') + 'Recibe (CLEMI)') + '</div>' +
            (x.estado === 'Devuelto' ? '<p><b>Devolución:</b> ' + fm(x.dev_fecha_hora) + '</p><div class="rp-firmas">' + firma(x.dev_entrega_firma, x.dev_entrega_nombre, 'Devuelve (CLEMI)') + firma(x.dev_recibe_firma, x.dev_recibe_nombre, 'Recibe (' + x.empresa + ')') + '</div>' : '') +
            (fs.length ? '<div class="rp-fotos">' + fs.map(function (f) { return '<img src="' + archivo(f.archivo) + '" alt="">'; }).join('') + '</div>' : '') + '</div>';
        }).join('') : '<p>No se registraron entregas de instrumental asociadas a este evento.</p>') +
      '<h2><span>8</span>Bitácora completa del evento</h2><table><thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Acción y detalle</th></tr></thead><tbody>' + bit.map(function (b) {
          return '<tr><td>' + b.momento + '</td><td>' + h(b.usuario_nombre) + '</td><td><b>' + h(b.accion) + '</b>' + (b.detalle ? '<div class="rp-det">' + h(b.detalle) + '</div>' : '') + '</td></tr>';
        }).join('') + '</tbody></table>' +
      '<h2><span>9</span>Cierre y firma</h2><div class="rp-cierre"><div><p>El instrumentador a cargo confirma la finalización del entrenamiento y que la información registrada es correcta.</p>' +
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
      U.filter(function (u) { return u.activo; }).map(function (u) { return '<button type="button" class="btn btn-sm" data-u="' + u.usuario + '">' + h(u.nombre) + (u.rol === 'admin' ? ' · admin' : u.rol === 'comercial' ? ' · negociación' + (/ps/.test(u.areas_extra || '') ? ' y presupuesto' : '') + (/th/.test(u.areas_extra || '') ? ', talento humano' : '') + (/lg/.test(u.areas_extra || '') ? ' y logística' : '') : u.rol === 'audiovisual' ? ' · audiovisuales' : u.rol === 'almacen' ? ' · presupuesto' : u.rol === 'firma' ? ' · firma de convenios' : u.rol === 'talento' ? ' · talento humano' : u.rol === 'administrativo' ? ' · administrativo' : u.rol === 'biomedica' ? ' · biomédica' : (/bm/.test(u.areas_extra || '') ? ' · instrumentación y biomédica' : '')) + '</button>'; }).join('') + '</div>';
    f.insertBefore(box, f.querySelector('.login-pie'));
    box.querySelectorAll('[data-u]').forEach(function (b) {
      b.onclick = function () { document.getElementById('l-usuario').value = b.getAttribute('data-u'); document.getElementById('l-clave').value = 'demo'; f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { cancelable: true })); };
    });
  });

  function subir(fd, prog) {
    return new Promise(function (ok, mal) {
      var f = fd.get('archivo'), cid = +fd.get('componente_id'), pid = +fd.get('parte_id') || null, desc = String(fd.get('descripcion') || '').slice(0, 500);
      var ext = (/\.([a-z0-9]+)$/i.exec(f.name) || [])[1]; ext = ext ? ext.toLowerCase() : '';
      if (!TIPOS_ADJ[ext]) return mal({ ok: false, error: 'Tipo de archivo no permitido.' });
      if (f.size > 200 * 1048576) return mal({ ok: false, error: 'El archivo supera el tamaño permitido (200 MB).' });
      var c = COMP.find(function (x) { return x.id === cid; }), p = pid ? PAR.find(function (x) { return x.id === pid; }) : null, uid = YO.id, k = 0;
      var t = setInterval(function () { k += 0.25; if (prog) prog(Math.min(1, k)); if (k >= 1) {
        clearInterval(t);
        var mom = ['Ingreso', 'Salida'].indexOf(fd.get('momento')) >= 0 ? fd.get('momento') : 'General', tv = TIPOS_ADJ[ext][0] === 'video' && ['360', 'Normal'].indexOf(fd.get('tipo_video')) >= 0 ? fd.get('tipo_video') : '';
        var a = { id: sigId(ADJ), componente_id: cid, parte_id: pid, nombre: f.name, clase: TIPOS_ADJ[ext][0], mime: TIPOS_ADJ[ext][1], tamano: f.size, descripcion: desc, momento: mom, tipo_video: tv, meta: null, fuente_id: null, creado_por: uid, creado_en: ahora(), _url: URL.createObjectURL(f) };
        if (fd.get('fuente_id')) {
          var src = ADJ.find(function (x) { return x.id === +fd.get('fuente_id'); });
          ADJ.filter(function (x) { return x.fuente_id === src.id; }).forEach(function (x) { ADJ.splice(ADJ.indexOf(x), 1); });
          Object.assign(a, { clase: 'giro', meta: JSON.parse(fd.get('meta')), fuente_id: src.id, momento: src.momento, tipo_video: src.tipo_video });
          ADJ.push(a); reg(uid, 'componente', cid, null, 'Generó la vista 3D ' + (a.momento !== 'General' ? 'de ' + a.momento.toLowerCase() + ' ' : '') + 'de ' + c.codigo, (a.meta.modo === '360' ? 'Giro 360°' : 'Recorrido') + ' · ' + a.meta.n + ' cuadros · a partir de ' + src.nombre);
          return ok({ ok: true, id: a.id });
        }
        ADJ.push(a);
        var etq = tv ? ' (' + (tv === '360' ? 'video 360°' : 'video normal') + (mom !== 'General' ? ' de ' + mom.toLowerCase() : '') + ')' : (mom !== 'General' ? ' (' + mom.toLowerCase() + ')' : '');
        reg(uid, 'componente', cid, null, 'Adjuntó ' + (a.clase === 'imagen' ? 'una imagen' : a.clase === 'video' ? 'un video' : a.clase === 'modelo3d' ? 'un modelo 3D' : 'un documento') + etq + ' a ' + c.codigo,
          f.name + ' · ' + kbTxt(f.size) + (p ? ' · Parte: ' + p.codigo + ' (' + nombreP(p) + ')' : '') + (desc ? '\n' + desc : ''));
        ok({ ok: true, id: a.id });
      } }, 120);
    });
  }
  function sembrarIngresos() {
    var e1 = EV[0], e2 = EV[1], e3 = EV[2], hoy = dia(0);
    var gente = [['Andrea', 'Gómez Ruiz', '52123456', 'Ortopedia y traumatología', 'Hospital San Rafael'], ['Juan Pablo', 'Martínez Ocampo', '80999888', 'Ortopedia y traumatología', 'Clínica del Country'],
      ['Lucía', 'Herrera Prada', '1020456789', 'Medicina del deporte', 'Universidad Nacional'], ['Santiago', 'Villa Rendón', '79123987', 'Ortopedia y traumatología', 'Hospital Militar'],
      ['María Camila', 'Rojas Díaz', '1015333222', 'Residente de ortopedia', 'Universidad del Rosario'], ['Felipe', 'Cárdenas Mora', '80456123', 'Ortopedia y traumatología', 'Clínica Reina Sofía'],
      ['Daniela', 'Quintero León', '1032444555', 'Residente de ortopedia', 'Universidad El Bosque'], ['Andrés', 'Ospina Castro', '79888111', 'Cirugía de rodilla', 'Fundación Santa Fe']];
    var FIJOS = ['CLM7K3P9XH2D', 'CLM4TR8NV6WE', 'CLM9FB2LM5KS', 'CLM3HX7CU8PA', 'CLM6DN4RG2VT', 'CLM8WS5JE3LB', 'CLM2PU9KT7HF', 'CLM5AV3XN8RC'];
    gente.forEach(function (g, k) { INS.push({ id: sigId(INS), evento_id: e1.id, ext_id: 'INS-' + (2041 + k) + '-1', anulado: 0, codigo: FIJOS[k], nombre: g[0], apellido: g[1] + ' (ejemplo)', tipo_doc: 'CC', documento: g[2], especialidad: g[3], institucion: g[4], correo: '', telefono: '', estacion: String(k % 4 + 1), nota: 'Pago completo · Comprobante WOMPI-ejemplo', origen: 'Inscripciones', creado_por: null, creado_en: hace(60 * 24 * 3) }); });
    gente.forEach(function (g, k) { BIT.push({ id: ++seq.bit, momento: hace(60 * 24 * 3 - k * 37), usuario_id: null, usuario_nombre: 'Plataforma de inscripciones', entidad: 'inscrito', entidad_id: null, evento_id: e1.id, accion: 'Recibió una inscripción de la plataforma de inscripciones', detalle: g[0] + ' ' + g[1] + ' · ' + FIJOS[k] + ' · creado' }); });
    e1.checklist_ing = CHK.slice();
    [[0, '06:41', 9], [1, '06:44', 9], [2, '06:48', 6], [3, '06:52', 9], [4, '06:58', 3]].forEach(function (x) {
      var i = INS[x[0]], a = { id: sigId(ASI), inscrito_id: i.id, evento_id: e1.id, fecha: hoy, ingreso_en: en(hoy, x[1]), ingreso_por: x[0] % 2 ? 5 : 4, medio: 'QR', items: {}, completo: 0, obs: '' };
      CHK.slice(0, x[2]).forEach(function (t, k) { a.items[t] = { ok: 1, por: a.ingreso_por, en: en(hoy, x[1].slice(0, 3) + ('0' + (+x[1].slice(3) + 1 + Math.floor(k / 3))).slice(-2)) }; });
      a.completo = x[2] === CHK.length ? 1 : 0; if (x[0] === 2) a.obs = 'Llegó sin gafas de protección; se le entregaron en préstamo (ejemplo).';
      ASI.push(a); reg(a.ingreso_por, 'asistencia', a.id, e1.id, 'Registró el ingreso de un participante', nomI(i) + ' · CC ' + i.documento + ' · código QR', a.ingreso_en);
    });
    [['Camilo', 'Suárez Pinto', '80111222', 'Neurocirugía'], ['Valentina', 'Mejía Ruiz', '1019888777', 'Cirugía de columna'], ['Tomás', 'Arango Gil', '79333444', 'Ortopedia'], ['Paula', 'Nieto Vargas', '1022555666', 'Residente de neurocirugía']].forEach(function (g, k) {
      INS.push({ id: sigId(INS), evento_id: e2.id, codigo: codigoIns(), nombre: g[0], apellido: g[1] + ' (ejemplo)', tipo_doc: 'CC', documento: g[2], especialidad: g[3], institucion: '', correo: '', telefono: '', estacion: String(k % 2 + 1), nota: '', origen: 'Manual', creado_por: 2, creado_en: hace(60 * 20) });
    });
    if (e3) [['Ricardo', 'Pardo Silva', '79666777'], ['Natalia', 'Castaño Vélez', '1018222333'], ['Jorge', 'Beltrán Ríos', '80777999']].forEach(function (g, k) {
      var i = { id: sigId(INS), evento_id: e3.id, codigo: codigoIns(), nombre: g[0], apellido: g[1] + ' (ejemplo)', tipo_doc: 'CC', documento: g[2], especialidad: 'Ortopedia y traumatología', institucion: '', correo: '', telefono: '', estacion: String(k + 1), nota: '', origen: 'Importado', creado_por: 3, creado_en: hace(60 * 24 * 4) };
      INS.push(i); e3.checklist_ing = CHK.slice();
      if (k < 2) { var a = { id: sigId(ASI), inscrito_id: i.id, evento_id: e3.id, fecha: e3.fecha, ingreso_en: en(e3.fecha, '07:4' + k), ingreso_por: 3, medio: 'QR', items: {}, completo: 1, obs: '' }; CHK.forEach(function (t) { a.items[t] = { ok: 1, por: 3, en: a.ingreso_en }; }); ASI.push(a); }
    });
  }
  function crearDisp(cd, v, uid, cuando) {
    var ps = PAR.filter(function (pp) { return pp.componente_id === cd.id; }), est = {};
    ps.forEach(function (pp) { est[pp.estado] = (est[pp.estado] || 0) + 1; });
    var fh = String(v.fecha_hora).replace('T', ' ') + ':00';
    var evs = {}; ASG.forEach(function (a) { var pp = PAR.find(function (x) { return x.id === a.parte_id; }); if (pp && pp.componente_id === cd.id) evs[a.evento_id] = 1; });
    var d = { id: sigId(DISP), componente_id: cd.id, tipo: v.tipo, fecha_hora: fh, destino: v.destino, entidad: v.entidad || '', documento: v.documento || '', estado_corporal: v.estado_corporal, observaciones: v.observaciones || '',
      entrega_nombre: v.entrega_nombre, entrega_cedula: v.entrega_cedula || '', entrega_firma: guardarImg(v.entrega_firma, 'firma'), recibe_nombre: v.recibe_nombre, recibe_cedula: v.recibe_cedula, recibe_cargo: v.recibe_cargo || '',
      recibe_firma: guardarImg(v.recibe_firma, 'firma'), resumen: JSON.stringify({ partes: ps.length, estados: est, usos: ps.reduce(function (m, pp) { return m + pp.usos; }, 0), eventos: Object.keys(evs).length, dias: Math.max(0, Math.floor((new Date(fh.slice(0, 10)) - new Date(cd.fecha_ingreso)) / 864e5)) }),
      creado_por: uid, creado_en: cuando };
    DISP.push(d);
    ps.forEach(function (pp) { if (pp.estado !== 'Consumida' && pp.estado !== 'Descartada') { pp.estado = 'Descartada'; pp.obs = (pp.obs ? pp.obs + ' · ' : '') + 'Disposición final: ' + v.tipo; } });
    cd.estado = 'Disposición final'; cd.actualizado_por = uid; cd.actualizado_en = cuando;
    reg(uid, 'componente', cd.id, null, 'Registró la disposición final de ' + cd.codigo, v.tipo + ' · ' + v.destino + (v.entidad ? ' · ' + v.entidad : '') + ' · Recibe: ' + v.recibe_nombre + ' (C.C. ' + v.recibe_cedula + ')' + (v.documento ? ' · Soporte: ' + v.documento : ''), cuando);
  }
  // Maniquí 3D de ejemplo (la vista previa no usa imágenes reales de cadáveres)
  function maniqui(salida) {
    return new Promise(function (ok) {
      if (!window.THREE) return ok(null);
      var W = 480, H = 360, N = 72, COLS = 9, ROWS = 8;
      var r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(W, H); r.setPixelRatio(1); r.outputEncoding = THREE.sRGBEncoding; r.setClearColor(0xe9ede9);
      var sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x8a8f8a, 0.9)); var dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(1.5, 4, 2); sc.add(dl);
      var cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 50);
      var piel = new THREE.MeshStandardMaterial({ color: salida ? 0xc9a58f : 0xdcae98, roughness: 0.75 }), lv = new THREE.MeshStandardMaterial({ color: 0x9b4a63, roughness: 0.9, transparent: true, opacity: 0.55 });
      var metal = new THREE.MeshStandardMaterial({ color: 0x5b6168, roughness: 0.35, metalness: 0.6 }), inc = new THREE.MeshStandardMaterial({ color: 0x7a1f1f, roughness: 0.6 });
      var g = new THREE.Group(); sc.add(g);
      var mesa = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.05, 2.1), metal); mesa.position.y = 0.78; g.add(mesa);
      [[-0.32, -0.95], [0.32, -0.95], [-0.32, 0.95], [0.32, 0.95]].forEach(function (p) { var pata = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.78, 10), metal); pata.position.set(p[0], 0.39, p[1]); g.add(pata); });
      var piso = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ color: 0xcfd4cf })); piso.rotation.x = -Math.PI / 2; sc.add(piso);
      function cap(r1, l, x, z, rotZ, mat) { var m = new THREE.Group(), c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r1, l, 18), mat || piel); m.add(c); [-1, 1].forEach(function (k) { var e = new THREE.Mesh(new THREE.SphereGeometry(r1, 18, 12), mat || piel); e.position.y = k * l / 2; m.add(e); }); m.rotation.x = Math.PI / 2; if (rotZ) m.rotation.z = rotZ; m.position.set(x, 0.92, z); g.add(m); return m; }
      var cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 18), piel); cabeza.scale.set(1, 0.95, 1.15); cabeza.position.set(0, 0.95, -0.82); g.add(cabeza);
      cap(0.045, 0.06, 0, -0.69); var torso = cap(0.16, 0.42, 0, -0.38); torso.scale.set(1.2, 1, 0.75); var pelvis = cap(0.15, 0.12, 0, -0.07); pelvis.scale.set(1.15, 1, 0.75);
      [-1, 1].forEach(function (k) {
        cap(0.05, 0.26, k * 0.26, -0.43); cap(0.04, 0.24, k * 0.27, -0.13); var mano = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), piel); mano.scale.set(0.7, 0.5, 1.3); mano.position.set(k * 0.27, 0.9, 0.05); g.add(mano);
        cap(0.075, 0.36, k * 0.09, 0.19); cap(0.055, 0.34, k * 0.09, 0.57); var pie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.06), piel); pie.position.set(k * 0.09, 0.97, 0.8); g.add(pie);
        if (!salida) { var l1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), lv); l1.scale.set(1, 0.3, 1.6); l1.position.set(k * 0.1, 0.99, 0.2); g.add(l1); }
        if (salida) { var i1 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 0.28), inc); i1.position.set(k * 0.09, 0.995, 0.19); g.add(i1); var i2 = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 0.22), inc); i2.position.set(k * 0.09, 0.975, 0.57); g.add(i2); }
      });
      var l2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), lv); l2.scale.set(1.4, 0.25, 1.2); l2.position.set(0.04, 1.03, -0.4); if (!salida) g.add(l2);
      if (salida) { var yx = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.01, 0.34), inc); yx.position.set(0, 1.035, -0.38); g.add(yx); }
      var sp = document.createElement('canvas'); sp.width = W * COLS; sp.height = H * ROWS; var x = sp.getContext('2d');
      for (var i = 0; i < N; i++) {
        var a = i / N * Math.PI * 2; cam.position.set(Math.sin(a) * 1.75, 1.75, Math.cos(a) * 1.75); cam.lookAt(0, 0.9, 0); r.render(sc, cam);
        x.drawImage(r.domElement, (i % COLS) * W, Math.floor(i / COLS) * H);
      }
      r.dispose();
      sp.toBlob(function (b) { ok(b ? { url: URL.createObjectURL(b), size: b.size, meta: { v: 1, modo: '360', n: N, cols: COLS, fw: W, fh: H, dur: 24, t: [] } } : null); }, 'image/jpeg', 0.85);
    });
  }
  function firmaDemo(txt) {
    var c = document.createElement('canvas'); c.width = 360; c.height = 120; var g = c.getContext('2d'); g.strokeStyle = '#10291c'; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath();
    for (var i = 0; i < 40; i++) { var px = 30 + i * 7.5, py = 70 + Math.sin(i * 0.9 + txt.length) * 22 * Math.sin(i / 12); i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); return c.toDataURL('image/png');
  }
  function semillaVisual() {
    var c1 = COMP.find(function (x) { return x.codigo === 'CLEMI-CA-0107'; });
    var c9 = crearComp('CLEMI-CA-0098', 'Cuerpo completo', 'Femenino', 81, 'Embalsamado', 'Congelador 3 · bandeja A', 7, hace(60 * 24 * 45));
    c9.procedencia = 'Convenio de donación (ejemplo)';
    PAR.filter(function (pp) { return pp.componente_id === c9.id && /Rodilla|Cadera|Hombro/.test(pp.region); }).forEach(function (pp) { pp.usos = 2; pp.estado = pp.region === 'Cadera' ? 'Consumida' : 'Disponible'; });
    function vid(cm, mom, tv, cuando, uid) { var a = { id: sigId(ADJ), componente_id: cm.id, parte_id: null, nombre: (mom === 'Ingreso' ? 'ingreso' : 'salida') + '-' + (tv === '360' ? '360' : 'recorrido') + '-' + cm.codigo.slice(-4) + '.mp4', clase: 'video', mime: 'video/mp4', tamano: tv === '360' ? 48200000 : 31500000, descripcion: 'Video de ejemplo', momento: mom, tipo_video: tv, meta: null, fuente_id: null, creado_por: uid, creado_en: cuando, _url: '' }; ADJ.push(a);
      reg(uid, 'componente', cm.id, null, 'Adjuntó un video (' + (tv === '360' ? 'video 360°' : 'video normal') + ' de ' + mom.toLowerCase() + ') a ' + cm.codigo, a.nombre + ' · ' + kbTxt(a.tamano), cuando); return a; }
    function giro(cm, fuente, m, cuando, uid) { var a = { id: sigId(ADJ), componente_id: cm.id, parte_id: null, nombre: 'vista3d-' + fuente.nombre.replace('.mp4', '.jpg'), clase: 'giro', mime: 'image/jpeg', tamano: m.size, descripcion: '', momento: fuente.momento, tipo_video: fuente.tipo_video, meta: m.meta, fuente_id: fuente.id, creado_por: uid, creado_en: cuando, _url: m.url }; ADJ.push(a);
      reg(uid, 'componente', cm.id, null, 'Generó la vista 3D de ' + fuente.momento.toLowerCase() + ' de ' + cm.codigo, 'Recorrido · 72 cuadros · a partir de ' + fuente.nombre, cuando); return a; }
    function marca(a, fr, x, y, tipo, txt, uid, cuando) { MARC.push({ id: sigId(MARC), adjunto_id: a.id, frame: fr, x: x, y: y, z: null, tipo: tipo, texto: txt, creado_por: uid, creado_en: cuando }); }
    var t1 = hace(60 * 24 * 12 - 30), t9 = hace(60 * 24 * 45 - 25), t9s = hace(60 * 26);
    function foto(cm, mom, lbl, cuando, uid) {
      var cv = document.createElement('canvas'); cv.width = 640; cv.height = 480; var g = cv.getContext('2d');
      var gr = g.createLinearGradient(0, 0, 640, 480); gr.addColorStop(0, mom === 'Ingreso' ? '#1f3d2e' : '#2b2433'); gr.addColorStop(1, '#0f1a14'); g.fillStyle = gr; g.fillRect(0, 0, 640, 480);
      g.strokeStyle = '#C6A13B'; g.lineWidth = 4; g.strokeRect(24, 24, 592, 432); g.textAlign = 'center';
      g.fillStyle = '#E8C25B'; g.font = 'bold 40px Georgia, serif'; g.fillText(lbl, 320, 220); g.fillStyle = '#fff'; g.font = '22px sans-serif'; g.fillText(cm.codigo + ' · ' + mom.toLowerCase(), 320, 270);
      g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '18px sans-serif'; g.fillText('Imagen de ejemplo · vista previa', 320, 310);
      var u = cv.toDataURL('image/jpeg', .8);
      ADJ.push({ id: sigId(ADJ), componente_id: cm.id, parte_id: null, nombre: lbl.toLowerCase() + '-' + mom.toLowerCase() + '.jpg', clase: 'imagen', mime: 'image/jpeg', tamano: Math.round(u.length * .75), descripcion: lbl, momento: mom, tipo_video: '', meta: null, fuente_id: null, creado_por: uid, creado_en: cuando, _url: u });
    }
    ['Frente', 'Espalda', 'Costado derecho', 'Costado izquierdo'].forEach(function (l) { foto(c1, 'Ingreso', l, t1, 6); foto(c9, 'Ingreso', l, t9, 7); foto(c9, 'Salida', l, t9s, 8); });
    var v1 = vid(c1, 'Ingreso', 'Normal', t1, 6);
    var v9 = vid(c9, 'Ingreso', 'Normal', t9, 7); var v9s = vid(c9, 'Salida', 'Normal', t9s, 8);
    Promise.all([maniqui(false), maniqui(true)]).then(function (m) {
      if (!m[0]) return;
      var g1 = giro(c1, v1, m[0], t1, 6), g9 = giro(c9, v9, m[0], t9, 7), g9s = giro(c9, v9s, m[1], t9s, 8);
      marca(g1, 10, 0.47, 0.5, 'Livideces', 'Livideces en cara anterior de muslos (ejemplo)', 6, t1);
      marca(g1, 64, 0.5, 0.44, 'Livideces', 'Mancha violácea en tórax anterior (ejemplo)', 6, t1);
      marca(g9s, 12, 0.48, 0.5, 'Herida / incisión', 'Incisiones de disección en muslos y piernas (ejemplo)', 8, t9s);
      // Video de ejemplo: la misma vuelta grabada desde el lienzo
      [[m[0], [v1, v9]], [m[1], [v9s]]].forEach(function (par) {
        try {
          var im = new Image(); im.onload = function () {
            var cv = document.createElement('canvas'); cv.width = 480; cv.height = 360; var gx = cv.getContext('2d'), M = par[0].meta, i = 0;
            if (!cv.captureStream || !window.MediaRecorder) return;
            var rec = new MediaRecorder(cv.captureStream(24), { mimeType: MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : '' }), trozos = [];
            rec.ondataavailable = function (e) { if (e.data.size) trozos.push(e.data); };
            rec.onstop = function () { var u = URL.createObjectURL(new Blob(trozos, { type: 'video/webm' })); par[1].forEach(function (a) { a._url = u; a.nombre = a.nombre.replace('.mp4', '.webm'); }); };
            rec.start();
            var tm = setInterval(function () { gx.drawImage(im, (i % M.cols) * M.fw, Math.floor(i / M.cols) * M.fh, M.fw, M.fh, 0, 0, 480, 360); i++; if (i >= M.n) { clearInterval(tm); setTimeout(function () { rec.stop(); }, 100); } }, 1000 / 24);
          }; im.src = par[0].url;
        } catch (e) {}
      });
    });
    crearDisp(c9, { tipo: 'Inhumación', fecha_hora: hace(60 * 25).slice(0, 16), destino: 'Cementerio Central · osario 12 (ejemplo)', entidad: 'Funeraria La Esperanza (ejemplo)', documento: 'Licencia de inhumación Nº 2026-0457 (ejemplo)',
      estado_corporal: 'Cuerpo completo embalsamado, con disecciones de miembros inferiores y abordaje de cadera izquierda. Partes consumidas: caderas. Sin hallazgos nuevos frente al ingreso, fuera de los procedimientos del entrenamiento (ejemplo).',
      observaciones: 'Se entrega en bolsa mortuoria sellada, con etiqueta de identificación (ejemplo).', entrega_nombre: 'Carlos Murillo', entrega_cedula: '', entrega_firma: firmaDemo('Carlos'), recibe_nombre: 'Andrés Pérez (ejemplo)', recibe_cedula: '80123456', recibe_cargo: 'Auxiliar funerario', recibe_firma: firmaDemo('Andres') }, 8, hace(60 * 25));
  }
  function semillaAdjuntos() {
    try { semillaVisual(); } catch (e) { console.error(e); }
    try {
      var cv = document.createElement('canvas'); cv.width = 960; cv.height = 720; var g = cv.getContext('2d');
      var gr = g.createLinearGradient(0, 0, 960, 720); gr.addColorStop(0, '#1f3d2e'); gr.addColorStop(1, '#0f231a'); g.fillStyle = gr; g.fillRect(0, 0, 960, 720);
      g.strokeStyle = '#C6A13B'; g.lineWidth = 6; g.strokeRect(40, 40, 880, 640);
      g.fillStyle = '#E8C25B'; g.font = 'bold 54px Georgia, serif'; g.textAlign = 'center'; g.fillText('CLEMI-CA-0107', 480, 300);
      g.fillStyle = '#fff'; g.font = '32px sans-serif'; g.fillText('Registro fotográfico de ingreso', 480, 370); g.font = '24px sans-serif'; g.fillStyle = 'rgba(255,255,255,.7)'; g.fillText('Imagen de ejemplo · vista previa', 480, 420);
      var c1 = COMP.find(function (x) { return x.codigo === 'CLEMI-CA-0107'; }); if (!c1) return;
      cv.toBlob(function (b) { ADJ.push({ id: sigId(ADJ), componente_id: c1.id, parte_id: null, nombre: 'foto-ingreso-CA-0107.jpg', clase: 'imagen', mime: 'image/jpeg', tamano: b.size, descripcion: 'Registro fotográfico al ingreso (ejemplo)', creado_por: 6, creado_en: dia(-12) + ' 09:40:00', _url: URL.createObjectURL(b) }); }, 'image/jpeg', .85);
      if (window.jspdf) {
        var d = new window.jspdf.jsPDF(); d.setFontSize(18); d.text('Acta de ingreso de componente anatómico', 20, 30); d.setFontSize(12);
        ['Código: CLEMI-CA-0107', 'Tipo: Cuerpo completo · Masculino · 67 años', 'Conservación: Fresco congelado', 'Documento de ejemplo para la vista previa.'].forEach(function (l, i) { d.text(l, 20, 50 + i * 10); });
        var pb = d.output('blob');
        ADJ.push({ id: sigId(ADJ), componente_id: c1.id, parte_id: null, nombre: 'acta-ingreso-CA-0107.pdf', clase: 'documento', mime: 'application/pdf', tamano: pb.size, descripcion: 'Acta de ingreso (ejemplo)', creado_por: 6, creado_en: dia(-12) + ' 09:45:00', _url: URL.createObjectURL(pb) });
      }
    } catch (e) {}
  }

  window.CLEMI_DEMO = { archivo: archivo, subir: subir, adjunto: function (a) { var x = ADJ.find(function (y) { return y.id === +a.id; }); return x ? x._url : ''; } };
  window.CLEMI_DEMO.ctx = { INS: INS, ENT: ENT, NOV: NOV, VER: VER, ASI: ASI, yo: function () { return YO; }, reg: reg, U: U, EV: EV, BIT: BIT, SALAS: SALAS, CAT: CAT, nombre: nombre, ahora: ahora, dia: dia, clone: clone, seq: seq, tick: tick };
  sembrar();
  sembrarIngresos();
  semillaAdjuntos();
  // Fichas reales de la morgue (códigos del registro 2025-2026; sin datos de identificación en la vista previa)
  (function () {
    var R = [{"c":"7229-26","l":"inh","s":"Masculino","f":"2026-06-06","u":"","us":[{"fecha":"2026-06-10","curso":"ANESTESIA BBRAUM"},{"fecha":"2026-06-15","curso":"RTC BILATERAL"},{"fecha":"19-20/06/2026","curso":"COLUMNA LESS"},{"fecha":"1-3/07/2026","curso":"BOSTON UROLOGIA"},{"fecha":"2026-07-04","curso":"IMPLANTES DENTALES"},{"fecha":"14-17/07/2026","curso":"RTH DERECHO"},{"fecha":"14-17/07/2026","curso":"RTR DERECHA"},{"fecha":"2026-08-29","curso":"RINOPLASTIA"}]},{"c":"2482-26","l":"inh","s":"Masculino","f":"2026-06-06","u":"","us":[{"fecha":"2026-07-04","curso":"TRAUMA DE MANO BILATERAL"},{"fecha":"2026-06-23","curso":"TRAUMA DE CODO BILATERAL"},{"fecha":"2026-07-04","curso":"IMPLANTES DENTALES"},{"fecha":"2026-07-04","curso":"RTR BILATERAL"},{"fecha":"2026-07-11","curso":"COLGAJOS MI RESIDENTES BILATERAL"},{"fecha":"2026-07-01","curso":"LAPAROSCOPIA"},{"fecha":"","curso":"3-4 /08/2026"},{"fecha":"","curso":"ART Y RTH BILATERAL"},{"fecha":"2026-08-29","curso":"RINOPLASTIA"}]},{"c":"2377-26","l":"inh","s":"Masculino","f":"2026-06-05","u":"","us":[{"fecha":"2026-06-10","curso":"ANESTESIA BBRAUM"},{"fecha":"25-26/07/2026","curso":"COLUMNA ABBOTT"},{"fecha":"2026-07-27","curso":"TRAUMA MI Y CADERA BILATERAL"},{"fecha":"2026-08-10","curso":"ARTR DER"},{"fecha":"2026-08-11","curso":"RTC DER"},{"fecha":"2026-08-11","curso":"RTC DER"},{"fecha":"2026-08-13","curso":"RTR DER"},{"fecha":"","curso":"46248"},{"fecha":"","curso":"RTR DER REVICION"},{"fecha":"2026-08-14","curso":"HTO"},{"fecha":"2026-08-15","curso":"LAPAROSCOPIA"},{"fecha":"2026-08-23","curso":"COLUMNA DOLOR"}]},{"c":"2123-26","l":"inh","s":"Masculino","f":"2026-05-21","u":"N1(32)","us":[{"fecha":"2026-05-22","curso":"RTC IZ"},{"fecha":"2026-05-22","curso":"RTR IZ"},{"fecha":"2-3/06/2026","curso":"PAPADAS"},{"fecha":"19-20/06/2026","curso":"COLUMNA LESS"},{"fecha":"14-17/07/2026","curso":"RTH DERECHO"},{"fecha":"2026-07-01","curso":"RTC DER"},{"fecha":"2026-08-15","curso":"LAPAROSCOPIA"}]},{"c":"2075-26","l":"inh","s":"Masculino","f":"2026-05-15","u":"N2(52)","us":[{"fecha":"2-3/06/2026","curso":"PAPADAS"},{"fecha":"1-3/07/2026","curso":"BOSTON UROLOGIA"},{"fecha":"2026-07-04","curso":"ARTH Y RTH BILATERAL"},{"fecha":"14-17/07/2026","curso":"RTR DERECHA"},{"fecha":"2026-07-27","curso":"TRAUMA MI Y CADERA BILATERAL"},{"fecha":"2026-08-10","curso":"RTC BILATERAL"},{"fecha":"2026-08-11","curso":"RTR IZ"},{"fecha":"2026-08-13","curso":"RTR DER"}]},{"c":"2076-26","l":"inh","s":"Femenino","f":"2026-05-15","u":"N1(12)","us":[{"fecha":"2026-06-04","curso":"PISO PELVICO"},{"fecha":"2026-06-03","curso":"LARINGE"},{"fecha":"2026-06-10","curso":"ANESTESIA BBRAUM"},{"fecha":"19-20/06/2026","curso":"COLUMNA LESS"},{"fecha":"14-17/07/2026","curso":"RTH DERECHO"},{"fecha":"2026-08-15","curso":"LAPAROSCOPIA"}]},{"c":"1990-26","l":"inh","s":"Masculino","f":"2026-05-12","u":"N1(41)","us":[{"fecha":"2026-05-13","curso":"ARTR RODILLA RERECHA"},{"fecha":"2026-05-14","curso":"ARTH IZQUIERDO"},{"fecha":"2026-05-16","curso":"COLGAJOS MS BILATERAL"},{"fecha":"2-3/06/2026","curso":"PAPADAS"},{"fecha":"2026-07-25","curso":"OSTEOTOMIA AL REDOR DE LA R.I."},{"fecha":"2026-07-25","curso":"OSTEOTOMIA ROD IZ"},{"fecha":"2026-07-27","curso":"TRAUMA MI Y CADERA BILATERAL"},{"fecha":"2026-07-01","curso":"COLUMNA 360 SPINEARTH"},{"fecha":"2026-08-10","curso":"ARTH DER"},{"fecha":"2026-08-11","curso":"RTH DER"},{"fecha":"2026-08-11","curso":"RTH DER"},{"fecha":"2026-08-13","curso":"RTC DER"},{"fecha":"2026-08-14","curso":"RTR DER"},{"fecha":"2026-08-14","curso":"RTR IZ"},{"fecha":"2026-08-16","curso":"ABDOMEN ABIERTO"}]},{"c":"8144-26","l":"inh","s":"Masculino","f":"2026-05-07","u":"N1(22)","us":[{"fecha":"2026-06-05","curso":"COLGAJOS MI BILATERAL"},{"fecha":"2026-06-03","curso":"LARINGE"},{"fecha":"2026-07-18","curso":"RTH DERECHO"},{"fecha":"14-17/07/2026","curso":"RTH IZQUIERDO"},{"fecha":"2026-09-26","curso":"COLUMNA LESS"}]},{"c":"1784-26","l":"inh","s":"Masculino","f":"2026-04-29","u":"N1821","us":[{"fecha":"2026-04-03","curso":"COLUMNA ABBOTT"},{"fecha":"2026-06-05","curso":"COLGAJOS MI BILATERAL"},{"fecha":"2-3/06/2026","curso":"PAPADAS"},{"fecha":"2026-08-29","curso":"RINOPLASTIA"},{"fecha":"2026-09-02","curso":"LAPAROSCOPIA"}]},{"c":"1733-26","l":"inh","s":"Masculino","f":"2026-04-23","u":"N1(21)","us":[{"fecha":"2026-04-03","curso":"COLUMNA ABBOTT"},{"fecha":"2-3/06/2026","curso":"PAPADAS"},{"fecha":"2026-07-18","curso":"RTH DERECHO"},{"fecha":"14-17/07/2026","curso":"RTH IZQUIERDO"},{"fecha":"14-17/07/2026","curso":"RTR DERECHA"},{"fecha":"2026-07-01","curso":"COLUMNA 360 SPINEARTH"}]},{"c":"1675-26","l":"inh","s":"Masculino","f":"2026-04-21","u":"N2(52)","us":[{"fecha":"2026-04-24","curso":"TORAX MEDEXPER"},{"fecha":"1-3/07/2026","curso":"BOSTON UROLOGIA"},{"fecha":"14-17/07/2026","curso":"RTR DERECHA"},{"fecha":"17-18/07/2026","curso":"COLUMNA LESS"},{"fecha":"2026-07-25","curso":"OSTEOTOMIA ALREDEDOR DE LA R.I."},{"fecha":"2026-07-12","curso":""},{"fecha":"2026-08-14","curso":"ARTH IZ"},{"fecha":"2026-08-14","curso":"RTH IZ"},{"fecha":"2026-08-15","curso":"LAPAROSCOPIA"},{"fecha":"2026-08-29","curso":"SENOS PARANASALES"}]},{"c":"1650-26","l":"inh","s":"Masculino","f":"2026-04-21","u":"N2(63)","us":[{"fecha":"2026-06-15","curso":"RTC BILATERAL"},{"fecha":"1-3/07/2026","curso":"BOSTON UROLOGIA"},{"fecha":"2026-07-11","curso":"COLGAJOS MS RESIDENTES BILATERAL"}]},{"c":"1614-26","l":"inh","s":"Femenino","f":"2026-04-21","u":"N1(23)","us":[{"fecha":"2026-06-05","curso":"COPLGAJOS MI BILATERAL"},{"fecha":"2026-06-03","curso":"LARINGE"},{"fecha":"2026-06-26","curso":"ENDOSCOPÍA DE COLUMNA"},{"fecha":"2026-08-14","curso":"RTH DER"},{"fecha":"2026-08-14","curso":"ARTH IZ"},{"fecha":"2026-08-16","curso":"ABDOMEN ABIERTO"},{"fecha":"2026-08-29","curso":"SENOS PARANASALES"}]},{"c":"1602-26","l":"inh","s":"Masculino","f":"2026-04-15","u":"N1(11)","us":[{"fecha":"2026-06-10","curso":"ARTC BILATERAL"},{"fecha":"2026-06-13","curso":"ARTR DER"},{"fecha":"2026-07-27","curso":"TRAUMA MI Y CADERA BILATERAL"},{"fecha":"2026-07-01","curso":"COLUMNA 360 SPINEARTH"},{"fecha":"2026-08-23","curso":"PROTESIS PENEANAS"},{"fecha":"2026-08-28","curso":"ARTH DER"}]},{"c":"1374-26","l":"inh","s":"Masculino","f":"2026-04-10","u":"N1(41)","us":[{"fecha":"2026-04-11","curso":"COLOMNA CERVICAL"},{"fecha":"2026-08-14","curso":"ARTR DER"},{"fecha":"2026-08-14","curso":"ARTR IZ"},{"fecha":"2026-08-16","curso":"ABDOMEN ABIERTO"},{"fecha":"2026-08-18","curso":"DISECCION MS BILATERAL"},{"fecha":"2026-08-20","curso":"DISECCIÓN PLEXO BILATERAL"},{"fecha":"2026-08-26","curso":"NEUROLOGIA"},{"fecha":"2026-08-29","curso":"RINOPLASTIA"}]},{"c":"2826-26","l":"inh","s":"Masculino","f":"2026-04-10","u":"N1(13)","us":[{"fecha":"2026-04-11","curso":"COLOMNA CERVICAL"},{"fecha":"2026-06-10","curso":"ARTC BILATERAL"},{"fecha":"2026-06-13","curso":"ARTR IZ"},{"fecha":"2026-07-11","curso":"COLGAJOS MS RESIDENTES BILATERAL"},{"fecha":"","curso":"TRAUMA MI Y CADERA BILATERAL"},{"fecha":"2026-08-10","curso":"RTR DERECHA"},{"fecha":"2026-08-11","curso":"RTR IZ"},{"fecha":"2026-08-13","curso":"RTC DER"},{"fecha":"2026-08-14","curso":"RTC DER"},{"fecha":"2026-08-15","curso":"LAPAROSCOPIA"},{"fecha":"2026-08-10","curso":"HTO RODILLA"},{"fecha":"2026-08-10","curso":"RTR DER"},{"fecha":"2026-08-11","curso":"REVICION RODILLA IZ"}]},{"c":"1532-26","l":"inh","s":"Masculino","f":"2026-04-10","u":"N1(13)","us":[{"fecha":"2026-04-11","curso":"COLOMNA CERVICAL"},{"fecha":"2026-04-14","curso":"IMPLANTES DENTASLES"},{"fecha":"2026-06-10","curso":"ARTC BILATERAL"},{"fecha":"2026-06-13","curso":"ARTR IZ"},{"fecha":"2026-08-28","curso":"ARTH IZQUIERDO"}]},{"c":"1531-26","l":"inh","s":"Masculino","f":"2026-04-10","u":"N1(41)","us":[{"fecha":"2026-04-11","curso":"COLOMNA CERVICAL"},{"fecha":"2026-04-14","curso":"IMPLANTES DENTASLES"},{"fecha":"2026-04-19","curso":"COLGAJOS MI BILATERAL"},{"fecha":"2026-04-11","curso":"PLEXO BRAQUIAL BILATERAL"},{"fecha":"2026-08-29","curso":"RINOPLASTIA"}]},{"c":"1629-26","l":"inh","s":"Masculino","f":"2026-03-30","u":"N2(71)","us":[{"fecha":"2026-04-06","curso":"RTC BILATERAL"},{"fecha":"2026-04-11","curso":"PLEXO BRAQUIAL BILATERAL"},{"fecha":"2026-04-11","curso":"COLOMNA CERVICAL"},{"fecha":"","curso":"BOSTON"},{"fecha":"2026-04-19","curso":"COLGAJOS MS BILATERAL"}]},{"c":"1121-26","l":"inh","s":"Masculino","f":"2026-03-17","u":"","us":[{"fecha":"","curso":"19/03/202"},{"fecha":"","curso":"RTR IZ"},{"fecha":"2026-03-20","curso":"RTC DER"},{"fecha":"2026-03-23","curso":"RTH DER"},{"fecha":"31/04/2026","curso":"EXTRACCION DE CORAZON"},{"fecha":"2026-04-11","curso":"ARTR DER"},{"fecha":"2026-04-29","curso":"DISECIÓN FACIAL"},{"fecha":"2026-07-11","curso":"COLGAJOS MS RESIDENTES BILATERAL"},{"fecha":"2026-08-11","curso":"RTC DER"}]},{"c":"1014-26","l":"inh","s":"Femenino","f":"2026-03-17","u":"N1(32)","us":[{"fecha":"","curso":"19/03/202"},{"fecha":"","curso":"RTR DRECHA"},{"fecha":"2026-03-20","curso":"RTC DER"},{"fecha":"2026-03-23","curso":"RTH DER"},{"fecha":"2026-03-23","curso":"ENDOSCOPIA DE COLUMNA"},{"fecha":"2026-03-28","curso":"RTR IZ"},{"fecha":"2026-03-28","curso":"RTC IZ"},{"fecha":"2026-04-14","curso":"IMPLANTES DENTASLES"},{"fecha":"2026-04-19","curso":"COLGAJOS MI BILATERAL"},{"fecha":"2026-04-29","curso":"DISECIÓN FACIAL"}]},{"c":"0820-26","l":"inh","s":"Masculino","f":"2026-03-03","u":"N2(81)","us":[{"fecha":"2026-03-06","curso":"ANESTESIA GEARD"},{"fecha":"2026-03-13","curso":"LAPAROSCOPIA PARED"},{"fecha":"2026-03-15","curso":"COLUMNA ABBOTT"},{"fecha":"2026-03-15","curso":"ANETSDTESIA ABBOTT"},{"fecha":"2026-03-15","curso":"COLUMNA ABOTT"},{"fecha":"2026-03-20","curso":"RTC DER"},{"fecha":"2026-03-23","curso":"RTH DER"},{"fecha":"2026-03-28","curso":"RTR BILATERRAL"},{"fecha":"2026-07-11","curso":"COLGAJOS MI RESIDENTES BILATERAL"}]},{"c":"5851-26","l":"inh","s":"Masculino","f":"2026-02-23","u":"N2(92)","us":[{"fecha":"2026-02-27","curso":"RTC BILATERAL"},{"fecha":"2026-02-24","curso":"RTH BILATERAL"},{"fecha":"2026-03-06","curso":"ARTH DERECHO"},{"fecha":"2026-03-18","curso":"RTR BILATERAL"},{"fecha":"2026-06-26","curso":"ENDOSCOPÍA DE COLUMNA"},{"fecha":"1-3/07/2026","curso":"BOSTON UROLOGIA"},{"fecha":"2026-07-04","curso":"TRAUMA DE MANO BILATERAL"},{"fecha":"2026-07-11","curso":"COLGAJOS MI RESIDENTES BILATERAL"}]},{"c":"9346-26","l":"inh","s":"Masculino","f":"2026-02-09","u":"N2(71)","us":[{"fecha":"2026-03-06","curso":"ARTH DERECHO"},{"fecha":"2026-03-13","curso":"LAPAROSCOPIA PARED"},{"fecha":"2026-03-15","curso":"COLUMNA ABBOTT"},{"fecha":"2026-03-17","curso":"IMPLANTES DENTASLES"},{"fecha":"2026-04-11","curso":"ARTR DER"},{"fecha":"20-23/05/2026","curso":"RTC BILATERAL"}]},{"c":"1055-26","l":"inh","s":"Femenino","f":"2026-02-03","u":"N2(03)","us":[]},{"c":"5038-26","l":"inh","s":"Femenino","f":"2026-01-29","u":"N2(03)","us":[{"fecha":"2026-02-07","curso":"SENOS PARANASALES"},{"fecha":"2026-03-06","curso":"ARTH DERECHO"},{"fecha":"2026-04-11","curso":"ARTR DER"},{"fecha":"2026-04-14","curso":"IMPLANTES DENTASLES"},{"fecha":"2026-04-19","curso":"COLGAJOS MI IZ"},{"fecha":"2026-07-11","curso":"COLGAJOS MS RESIDENTES BILATERAL"}]},{"c":"0291-26","l":"inh","s":"Masculino","f":"2026-01-28","u":"N1(43)","us":[{"fecha":"2026-01-30","curso":"COLUMNA LESS"},{"fecha":"2026-03-17","curso":"IMPLANTES DENTASLES"},{"fecha":"2026-04-29","curso":"DISECIÓN FACIAL"},{"fecha":"2026-07-04","curso":"TRAUMA DE MANO BILATERAL"}]},{"c":"4935-26","l":"inh","s":"Masculino","f":"2026-01-28","u":"N2(02)","us":[{"fecha":"2026-01-31","curso":"RITIDOPLASTIA"},{"fecha":"2026-02-07","curso":"SENOS PARANASALES"},{"fecha":"2026-02-13","curso":"ARTH DERECHO"},{"fecha":"2026-03-06","curso":"ARTH DERECHO"},{"fecha":"2026-03-19","curso":"RTR IZ"},{"fecha":"2026-03-20","curso":"RTC DER"},{"fecha":"2026-03-21","curso":"RTC DER"}]},{"c":"0091-26","l":"inh","s":"Masculino","f":"2026-01-15","u":"N2(82)","us":[{"fecha":"2026-01-17","curso":"OSTEOTOMIA AL REDEOR DE LA RODILLA"},{"fecha":"2026-01-24","curso":"ART RIDILLA IZ"},{"fecha":"2026-01-31","curso":"RITIDOPLASTIA"},{"fecha":"2026-04-06","curso":"DISECCION PLEXO DER"},{"fecha":"2026-07-01","curso":"RTC IZ"}]},{"c":"0075-25","l":"inh","s":"Masculino","f":"2026-01-08","u":"N2(83)","us":[{"fecha":"2026-03-06","curso":"LAPAR J$J"},{"fecha":"2026-03-17","curso":"IMPLANTES DENTASLES"},{"fecha":"2026-03-23","curso":"RTH DER"},{"fecha":"2026-03-28","curso":"RTC BILATERAL"},{"fecha":"2026-07-11","curso":"COLGAJOS MI RESIDENTES BILATERAL"}]},{"c":"4993","l":"inh","s":"Indeterminado","f":"","u":"","us":[]},{"c":"4924-25","l":"inh","s":"Masculino","f":"2025-12-25","u":"N1(43)","us":[{"fecha":"2026-01-30","curso":"COLUMNA LESS"},{"fecha":"2026-04-03","curso":"COLUMNA ABBOTT"},{"fecha":"2026-04-24","curso":"CLABO DE TIBIA"},{"fecha":"2026-05-12","curso":"TRAUMA MI HL DERECHO"},{"fecha":"2026-05-13","curso":"ARTR RODILLA RERECHA"},{"fecha":"2026-05-14","curso":"ARTH IZQUIERDO"},{"fecha":"2026-05-15","curso":"CARDIOLOGIA"},{"fecha":"2026-05-19","curso":"ARTM DER"},{"fecha":"2026-05-18","curso":"ARTM IZ"},{"fecha":"2026-04-29","curso":"DISECIÓN FACIAL"},{"fecha":"2026-07-01","curso":"COLUMNA 360 SPINEARTH"},{"fecha":"2026-08-10","curso":"RTR DERECHA"},{"fecha":"2026-08-11","curso":"RTH DER"},{"fecha":"2026-08-11","curso":"ARTH IZ"},{"fecha":"2026-06-13","curso":"RTH IZ"},{"fecha":"2026-08-23","curso":"PROTESIS PENEANAS"}]},{"c":"4890-25","l":"inh","s":"Femenino","f":"2025-12-12","u":"N2(93)","us":[{"fecha":"2026-01-31","curso":"RITIDOPLASTIA"},{"fecha":"2026-03-13","curso":"LAPAROSCOPIA PARED"},{"fecha":"2026-08-10","curso":"RTR DERECHA"},{"fecha":"2026-08-10","curso":"RTR DERECHA"},{"fecha":"2026-08-11","curso":"RTR IZ"},{"fecha":"2026-08-14","curso":"RTC DER"}]},{"c":"4644","l":"inh","s":"Indeterminado","f":"","u":"","us":[]},{"c":"4397-25","l":"inh","s":"Masculino","f":"2025-11-13","u":"N2(92)","us":[{"fecha":"2025-11-14","curso":"LAPAROSCOPIA"},{"fecha":"2025-11-19","curso":"IMPLASNTES DENTALES DRA ELSA"},{"fecha":"2025-11-22","curso":"COLGAJOS MI BILATERAL"},{"fecha":"2025-12-06","curso":"RINOPLASTIA"},{"fecha":"2026-01-31","curso":"RITIDOPLASTIA"},{"fecha":"2026-02-07","curso":"SENOS PARANASALES"},{"fecha":"2026-07-11","curso":"COLGAJOS MS RESIDENTES BILATERAL"}]},{"c":"4436-25","l":"inh","s":"Femenino","f":"2025-11-13","u":"N2(73)","us":[{"fecha":"2025-11-19","curso":"IMPLASNTES DENTALES DRA ELSA"},{"fecha":"2025-12-05","curso":"ANESTESIA AMOLCA"},{"fecha":"2025-12-06","curso":"RINOPLASTIA"},{"fecha":"2026-01-17","curso":"OSTEOTOMIA AL REDEOR DE LA RODILLA"},{"fecha":"2026-04-11","curso":"ARTR IZ"}]},{"c":"4421-25","l":"inh","s":"Masculino","f":"2025-11-07","u":"N2(82)","us":[{"fecha":"2025-11-19","curso":"IMPLASNTES DENTALES DRA ELSA"},{"fecha":"2025-11-22","curso":"COLGAJOS MI BILATERAL"},{"fecha":"2025-12-06","curso":"COLUMNA LESS"},{"fecha":"2025-12-06","curso":"RINOPLASTIA"},{"fecha":"2026-01-31","curso":"RITIDOPLASTIA"},{"fecha":"2026-07-11","curso":"COLGAJOS MS RESIDENTES BILATERAL"}]},{"c":"4420-25","l":"inh","s":"Masculino","f":"2025-11-07","u":"N2(62)","us":[{"fecha":"2025-11-22","curso":"COLGAJOS MI BILATERAL"},{"fecha":"2025-11-30","curso":"COLUMNA EDOSCOPICA"},{"fecha":"2025-12-06","curso":"RINOPLASTIA"},{"fecha":"2026-07-01","curso":"LAPAROSCOPIA"},{"fecha":"2026-08-08","curso":"OSTEOTOMIA DE RODILLA"},{"fecha":"2026-08-08","curso":"OSTEOTOMIA DE RODILLA"}]},{"c":"4419-25","l":"inh","s":"Masculino","f":"2025-11-07","u":"N2(82)","us":[{"fecha":"13-14/11/2025","curso":"ARTR IZ"},{"fecha":"2025-11-22","curso":"DISECCIÓN FACIAL"},{"fecha":"2025-11-29","curso":"ARTH IZ"},{"fecha":"2025-11-30","curso":"COLUMNA EDOSCOPICA"},{"fecha":"2025-11-30","curso":"ARTH IZ"},{"fecha":"2026-07-11","curso":"COLGAJOS MS RESIDENTES BILATERAL"},{"fecha":"2026-07-01","curso":"LAPAROSCOPIA"}]},{"c":"2764-25","l":"inh","s":"Masculino","f":"2025-10-29","u":"N2(84)","us":[{"fecha":"2025-11-19","curso":"IMPLASNTES DENTALES DRA ELSA"},{"fecha":"2025-11-22","curso":"DISECCIÓN FACIAL"},{"fecha":"2026-03-13","curso":"LAPAROSCOPIA PARED"},{"fecha":"2026-08-08","curso":"OSTEOTOMIA DE RODILLA"}]},{"c":"4261-25","l":"inh","s":"Masculino","f":"2025-10-30","u":"N2(93)","us":[{"fecha":"2025-11-09","curso":"ARTH LH DER"},{"fecha":"2025-11-08","curso":"ARTR SMITH BILATERAL"},{"fecha":"2025-11-19","curso":"IMPLASNTES DENTALES DRA ELSA"},{"fecha":"2025-11-20","curso":"RTR IZ"},{"fecha":"2025-12-05","curso":"ANESTESIA AMOLCA"},{"fecha":"2025-12-06","curso":"COLUMNA LESS"},{"fecha":"2026-07-11","curso":"COLGAJOS MS RESIDENTES BILATERAL"},{"fecha":"2026-07-01","curso":"LAPAROSCOPIA"},{"fecha":"2026-08-23","curso":"PROTESIS PENEANAS"}]},{"c":"4277-25","l":"inh","s":"Masculino","f":"2025-10-30","u":"N2(03)","us":[{"fecha":"2025-11-09","curso":"ARTH LH BILATERAL"},{"fecha":"2025-11-08","curso":"ARTR SMITH BILATERAL"},{"fecha":"2025-11-12","curso":"LAPAROSCOPIA"},{"fecha":"2025-11-27","curso":"RTR BILATERAL"},{"fecha":"2025-12-06","curso":"RINOPLASTIA"},{"fecha":"2026-02-27","curso":"RTC BILATERAL"},{"fecha":"2026-02-24","curso":"ILPLANTES DENTALES"}]},{"c":"4276-25","l":"inh","s":"Masculino","f":"2025-10-30","u":"N2(91)","us":[{"fecha":"2025-11-19","curso":"IMPLASNTES DENTALES DRA ELSA"},{"fecha":"2025-11-22","curso":"COLGAJOS MI BILATERAL"},{"fecha":"2025-11-30","curso":"COLUMNA EDOSCOPICA"},{"fecha":"2025-12-06","curso":"COLUMNA LESS"},{"fecha":"2025-12-06","curso":"RINOPLASTIA"},{"fecha":"2026-03-06","curso":"TRAUMA MANO BILATERAL"},{"fecha":"2026-07-01","curso":"LAPAROSCOPIA"}]},{"c":"4360","l":"inh","s":"Indeterminado","f":"","u":"","us":[]},{"c":"4267","l":"inh","s":"Indeterminado","f":"","u":"","us":[]},{"c":"4166-25","l":"inh","s":"Masculino","f":"2025-10-24","u":"N2(92)","us":[{"fecha":"2025-10-27","curso":"RTC BILATERAL"},{"fecha":"6-7/11/2025","curso":"CO0LGAJOS MI BILATERAL"},{"fecha":"2025-12-06","curso":"RINOPLASTIA"},{"fecha":"2026-01-31","curso":"RITIDOPLASTIA"},{"fecha":"2026-04-24","curso":"COLUMNA LESS"},{"fecha":"2026-07-11","curso":"COLGAJOS MS RESIDENTES BILATERAL"},{"fecha":"2026-08-08","curso":"OSTEOTOMIA DE RODILLA"}]},{"c":"3055-25","l":"inh","s":"Masculino","f":"2025-08-10","u":"N2(71)","us":[{"fecha":"2025-08-02","curso":"RINOPLASTIA"},{"fecha":"2025-08-15","curso":"RTR BILATERAL"},{"fecha":"2025-08-16","curso":"LARINGE ANDES"},{"fecha":"2025-08-22","curso":"ANESTESIA"},{"fecha":"2025-08-28","curso":"PROTESIS PENEANAS"},{"fecha":"2025-09-18","curso":"SENOS PARANASALES"},{"fecha":"4-5/10/2025","curso":"COLUMNA SPINEAR"},{"fecha":"4-5/10/2025","curso":"AUDOMEN SPINEAR"},{"fecha":"2025-10-20","curso":"ANASTESIA"},{"fecha":"2025-12-09","curso":"TIBIA J&J"}]},{"c":"2950-25","l":"inh","s":"Masculino","f":"2025-08-01","u":"N2(82)","us":[{"fecha":"2025-08-02","curso":"ANESTESIA"},{"fecha":"2025-07-02","curso":"COLUMNA LESS"},{"fecha":"2025-09-18","curso":"SENOS PARANASALES"},{"fecha":"2025-09-23","curso":"COLUMNA RP MEDICA"},{"fecha":"2025-10-05","curso":"ART TOBILLO DER"},{"fecha":"6-7/10/2025","curso":"RTH DER"},{"fecha":"2025-10-29","curso":"ARTR IZ"},{"fecha":"2025-10-30","curso":"PIE DERECHO"},{"fecha":"2026-04-24","curso":"TORAX MEDEXPER"},{"fecha":"2026-04-29","curso":"DISECIÓN FACIAL"},{"fecha":"2026-08-08","curso":"OSTEOTOMIA DE RODILLA"},{"fecha":"2026-08-10","curso":"RTH BILATERAL"},{"fecha":"2026-08-11","curso":"RTC DER"},{"fecha":"2026-08-11","curso":"RTC IZ"}]},{"c":"2558-25","l":"inh","s":"Masculino","f":"2025-07-10","u":"N2(01)","us":[{"fecha":"2025-07-11","curso":"LAPAROSCOPIA SANITAS"},{"fecha":"2025-08-02","curso":"ANESTESIA"},{"fecha":"2025-07-02","curso":"AUDOMEN ABIERTO SANITAS"},{"fecha":"2025-08-02","curso":"RINOPLASTIA"},{"fecha":"2025-08-05","curso":"RTR BILATERAL"},{"fecha":"2025-09-19","curso":"ABORDASJES EN CADERA"}]},{"c":"2596-25","l":"inh","s":"Masculino","f":"2025-07-10","u":"N2(02)","us":[{"fecha":"2025-07-11","curso":"LAPAROSCOPIA SANITAS"},{"fecha":"2025-07-02","curso":"AUDOMEN ABIERTO SANITAS"},{"fecha":"2025-08-11","curso":"RTH BILATERAL"},{"fecha":"2025-08-12","curso":"MUÑECA BILATERAL"},{"fecha":"2026-05-15","curso":"CARDIOLOGIA"},{"fecha":"2-3/06/2026","curso":"PAPADAS"}]},{"c":"1642-25","l":"inh","s":"Femenino","f":"2025-06-18","u":"N2(91)","us":[{"fecha":"2025-06-29","curso":"SENOS PARANASALES"},{"fecha":"2025-06-20","curso":"ANASTESIA"},{"fecha":"7/96/2025","curso":"MAMOPLASTIA"},{"fecha":"8-12/06/2025","curso":"TRAUMA MI SMITH"},{"fecha":"2025-08-02","curso":"ANESTESIAMS"},{"fecha":"2025-06-21","curso":"COLUMNA ENDOSCOPIA"},{"fecha":"2025-08-04","curso":"DISECCIOÓN FACIAL"},{"fecha":"2026-08-16","curso":"ABDOMEN ABIERTO"}]},{"c":"2008-25","l":"inh","s":"Masculino","f":"2025-05-27","u":"N2(01)","us":[{"fecha":"","curso":"28-29/05/20"},{"fecha":"","curso":"ANESTESIA B BRAUM"},{"fecha":"2025-06-08","curso":"TRAUMA MI"},{"fecha":"2025-06-19","curso":"LAPAROSCOPIA J&J"},{"fecha":"2025-06-29","curso":"SENOS PARANASALES"},{"fecha":"2025-07-12","curso":"TUTORES EXTERNOS MI BILATERAL"},{"fecha":"2025-07-02","curso":"ABDOMEN ABIERTO SANITAS"}]},{"c":"0953-25","l":"inh","s":"Masculino","f":"2025-05-02","u":"N2(74)","us":[{"fecha":"2025-05-03","curso":"LAPAROSCOPIA J&J"},{"fecha":"2025-05-03","curso":"AUDOMEN J&J"},{"fecha":"2025-05-09","curso":"FIJACION EXTERNA CODO DER"},{"fecha":"2025-05-09","curso":"FIJACION EXTERNA TIBIA IZ"},{"fecha":"2025-05-14","curso":"DISECCIÓN FACIALFACE AND NOSE"},{"fecha":"2025-06-20","curso":"ENDOSCOPIA DE COLUMNA"},{"fecha":"2025-06-19","curso":"LAPAROSCOPIA J&J"},{"fecha":"2025-07-02","curso":"ABDOMEN ABIERTO SANITAS"},{"fecha":"14-25/10/2025","curso":"SENOS PARANASALES"}]},{"c":"0296","l":"inh","s":"Indeterminado","f":"","u":"","us":[]},{"c":"3460-26","l":"act","s":"Masculino","f":"","u":"","us":[{"fecha":"2026-09-19","curso":"SENOS PARANASALES"},{"fecha":"2026-09-26","curso":"COLUMNA LESS"}]},{"c":"0574-26","l":"act","s":"Masculino","f":"2026-09-18","u":"","us":[{"fecha":"2026-09-19","curso":"SENOS PARANASALES"},{"fecha":"2026-09-18","curso":"ANESTESIA"},{"fecha":"2026-09-22","curso":"TIROIDES"},{"fecha":"2026-09-30","curso":"ART Y TRANF HOMBRO DER"}]},{"c":"4723-26","l":"act","s":"Masculino","f":"2026-09-17","u":"","us":[{"fecha":"2026-09-19","curso":"SENOS PARANASALES"},{"fecha":"2026-09-22","curso":"TIROIDES"},{"fecha":"2026-09-26","curso":"COLUMNA LESS"},{"fecha":"2026-09-30","curso":"ART Y TRANF HOMBRO DER"}]},{"c":"4075-26","l":"act","s":"Masculino","f":"2026-09-15","u":"","us":[{"fecha":"2026-09-15","curso":"ARTH DERECHO"},{"fecha":"17-18/09/2026","curso":"ABORDAJE4S DE CADERA BILATERAL"},{"fecha":"2026-09-19","curso":"SENOS PARANASALES"}]},{"c":"4047-26","l":"act","s":"Masculino","f":"2026-09-15","u":"","us":[{"fecha":"2026-09-19","curso":"SENOS PARANASALES"},{"fecha":"2026-09-22","curso":"TIROIDES"},{"fecha":"17-18/09/2026","curso":"ABORDAJE4S DE CADERA BILATERAL"}]},{"c":"4008-26","l":"act","s":"Masculino","f":"2026-09-15","u":"","us":[{"fecha":"2026-09-19","curso":"SENOS PARANASALES"},{"fecha":"2026-09-22","curso":"TIROIDES"},{"fecha":"2026-09-19","curso":"SENOS PARANASALES"},{"fecha":"2026-09-26","curso":"RTR. BRAUN BILATERAL"},{"fecha":"2026-09-30","curso":"ART Y TRANF HOMBRO DER"}]},{"c":"3878-26","l":"act","s":"Masculino","f":"2026-09-05","u":"","us":[{"fecha":"","curso":"COPLGAJOS MS DER"},{"fecha":"2026-09-06","curso":"ART M IZ"},{"fecha":"2026-09-08","curso":"IMPLANTES DENTALES"},{"fecha":"17-18/09/2026","curso":"ABORDAJE4S DE CADERA BILATERAL"}]},{"c":"3903-26","l":"act","s":"Femenino","f":"2026-09-03","u":"","us":[{"fecha":"2026-09-19","curso":"SENOS PARANASALES"}]},{"c":"7803-26","l":"act","s":"Femenino","f":"2026-09-03","u":"","us":[{"fecha":"2026-09-19","curso":"SENOS PARANASALES"},{"fecha":"2026-09-18","curso":"ANESTESIA"},{"fecha":"2026-09-22","curso":"TIROIDES"}]},{"c":"3758-26","l":"act","s":"Indeterminado","f":"2026-08-26","u":"","us":[{"fecha":"2026-08-29","curso":"SENOS PARANASALES"},{"fecha":"2026-09-15","curso":"ARTH DER"},{"fecha":"2026-09-16","curso":"ARTR DER"},{"fecha":"17-18/09/2026","curso":"ABORDAJE4S DE CADERA BILATERAL"},{"fecha":"2026-09-30","curso":"ART Y TRANF HOMBRO DER"}]},{"c":"3536-26","l":"act","s":"Indeterminado","f":"2026-08-28","u":"","us":[{"fecha":"2026-08-29","curso":"RINOPLASTIA"}]},{"c":"3403-26","l":"act","s":"Masculino","f":"2026-07-09","u":"","us":[{"fecha":"2026-08-11","curso":"ARTR DER"},{"fecha":"2026-08-10","curso":"RTH Y RADIO"},{"fecha":"2026-08-11","curso":"RTR IZ"},{"fecha":"2026-08-13","curso":"ARTH IZ"},{"fecha":"2026-08-14","curso":"RTC DER"},{"fecha":"2026-08-14","curso":"RTH IZ"},{"fecha":"2026-08-16","curso":"ABDOMEN ABIERTO"},{"fecha":"2026-08-26","curso":"NEUROLOGIA"},{"fecha":"2026-08-23","curso":"PROTESIS PENEANAS"},{"fecha":"2026-08-29","curso":"RINOPLASTIA"}]},{"c":"4890-26","l":"act","s":"Femenino","f":"","u":"","us":[{"fecha":"2026-07-01","curso":"REGIONAL TUNJA"},{"fecha":"2026-08-11","curso":"RTR IZ"},{"fecha":"2026-08-14","curso":"RTC DER"},{"fecha":"2026-08-10","curso":"ART RODILLA IZ"},{"fecha":"2026-08-10","curso":"HTO RODILLA"},{"fecha":"2026-08-11","curso":"RTR IZ"},{"fecha":"2026-08-11","curso":"REVICION RODILLA IZ"},{"fecha":"2026-08-13","curso":"RTC DER"},{"fecha":"2026-08-13","curso":"RTC IZ"},{"fecha":"2026-08-26","curso":"NEUROLOGIA"},{"fecha":"2026-08-23","curso":"COLUMNA DOLOR"},{"fecha":"2026-08-29","curso":"RINOPLASTIA"}]},{"c":"3826","l":"act","s":"Indeterminado","f":"","u":"","us":[]},{"c":"1018-26","l":"act","s":"Masculino","f":"2026-06-23","u":"","us":[{"fecha":"2026-07-04","curso":"COLGAJOS MI BILATERAL REGIONAL"},{"fecha":"2026-07-04","curso":"IMPLANTES DENTALES"},{"fecha":"17-18/07/2026","curso":"COLUMNA LESS"},{"fecha":"2026-07-01","curso":"COLUMNA 360 SPINEARTH"},{"fecha":"2026-08-08","curso":"OSTEOTOMIA DE RODILLA"},{"fecha":"2026-08-28","curso":"ARTH IZQUIERDO"}]},{"c":"0073-26","l":"act","s":"Femenino","f":"2026-04-27","u":"N1(33)","us":[{"fecha":"2026-06-04","curso":"PISO PELVICO"},{"fecha":"2026-06-10","curso":"ANESTESIA BBRAUM"},{"fecha":"2026-06-19","curso":"PISO PELVICO"},{"fecha":"2026-07-27","curso":"TRAUMA MI Y CADERA BILATERAL"},{"fecha":"2026-08-10","curso":"RTC BILATERAL"},{"fecha":"2026-08-11","curso":"ARTH IZQUIERDO"},{"fecha":"2026-08-11","curso":"RTH DER"},{"fecha":"2026-08-13","curso":"ARTR DER"},{"fecha":"2026-08-14","curso":"ARTH IZ"},{"fecha":"2026-08-14","curso":"RTH IZ"},{"fecha":"2026-08-29","curso":"SENOS PARANASALES"}]},{"c":"7423-26","l":"act","s":"Masculino","f":"2026-04-23","u":"N1(42)","us":[{"fecha":"2026-04-24","curso":"CLABO DE TIBIA"},{"fecha":"2026-04-24","curso":"ARTR DERECHA"},{"fecha":"2026-05-12","curso":"TRAUMA MI HL DERECHO"},{"fecha":"2026-04-29","curso":"DISECIÓN FACIAL"},{"fecha":"2026-07-25","curso":"OSTEOTOMIA AL REDOR DE LA R.D. YA TENIA ARTROSCOPIA"},{"fecha":"2026-07-01","curso":"COLUMNA 360 SPINEARTH"},{"fecha":"2026-08-10","curso":"RTC BILATERAL"},{"fecha":"2026-08-10","curso":"ARTH DER"},{"fecha":"2026-07-11","curso":"ARTR IZ"},{"fecha":"2026-06-13","curso":"RTH IZ"},{"fecha":"2026-08-14","curso":"RTH DER"},{"fecha":"2026-08-14","curso":"RTR IZ"},{"fecha":"2026-08-16","curso":"ABDOMEN ABIERTO"}]},{"c":"5176-25","l":"act","s":"Masculino","f":"2025-12-28","u":"N1(33)","us":[{"fecha":"2026-02-07","curso":"SENOS PARANASALES"},{"fecha":"2026-03-13","curso":"LAPAROSCOPIA PARED"},{"fecha":"2026-04-24","curso":"TORAX MEDEXPER"},{"fecha":"2026-04-29","curso":"DISECIÓN FACIAL"},{"fecha":"2026-07-25","curso":"OSTEOTOMIA AL REDOR DE LA R.I."},{"fecha":"2026-08-11","curso":"ARTH DER"},{"fecha":"2026-06-13","curso":"RTH IZ"},{"fecha":"2026-08-14","curso":"RTC DER"}]},{"c":"0203-25","l":"act","s":"Masculino","f":"2025-12-22","u":"N2(81)","us":[{"fecha":"2026-01-24","curso":"ART RODILLA IZ"},{"fecha":"2026-02-07","curso":"SENOS PARANASALES"},{"fecha":"2026-02-13","curso":"ARTH IZQUIERDO"},{"fecha":"19-20/02/2026","curso":"ARTT IZQUIERDA"},{"fecha":"2026-02-23","curso":"RTH BILATERAL"},{"fecha":"2026-03-06","curso":"LAPAR J$J"},{"fecha":"2026-03-23","curso":"RTH DER"},{"fecha":"2025-05-15","curso":"CARDIOLOGIA"},{"fecha":"2026-05-19","curso":"ARTM IZ"},{"fecha":"2026-05-18","curso":"ARTM DER"},{"fecha":"2026-07-11","curso":"COLGAJOS MS MSRESIDENTES BILATERAL"},{"fecha":"2026-08-11","curso":"RTR IZ"},{"fecha":"2026-08-11","curso":"RTC DER"},{"fecha":"2026-08-13","curso":"RTR DER"}]},{"c":"4836","l":"act","s":"Indeterminado","f":"","u":"","us":[]},{"c":"3388-25","l":"act","s":"Masculino","f":"2025-08-18","u":"N2(61)","us":[{"fecha":"2025-09-18","curso":"SENOS PARANASALES"},{"fecha":"2025-09-22","curso":"COLUMNA ABBOTT"},{"fecha":"2025-10-04","curso":"UROLOGIA BIOTRONITECH"},{"fecha":"4-5/10/2025","curso":"COLUMNA SPINEAR"},{"fecha":"4-5/10/2025","curso":"AUDOMEN SPINEAR"},{"fecha":"2025-10-31","curso":"TORAX MEDEXPER"},{"fecha":"2025-12-06","curso":"RINOPLASTIA"},{"fecha":"2026-03-06","curso":"ABORDAJE HOMBRO IZ"},{"fecha":"2026-03-19","curso":"RTR IZ"},{"fecha":"2026-03-20","curso":"RTC IZ"},{"fecha":"2026-04-14","curso":"IMPLANTES DENTASLES"},{"fecha":"2026-04-29","curso":"DISECIÓN FACIAL"},{"fecha":"2026-07-11","curso":"COLGAJOS MS RESIDENTES BILATERAL"},{"fecha":"2026-07-11","curso":"COLGAJOS MI RESIDENTES BILATERAL"}]}];
    R.forEach(function (x) {
      var est = x.l === 'inh' ? 'Pendiente de inhumación' : 'Disponible';
      var c = crearComp(x.c, 'Cuerpo completo', x.s, null, 'Otro', x.u, 1, (x.f || dia(0)) + ' 08:00:00');
      c.procedencia = ''; c.estado = est; c.usos_previos = JSON.stringify(x.us); c.nombre_donante = ''; c.documento = '';
      c.obs = (est === 'Pendiente de inhumación' ? 'Listo para inhumar. Registre la ficha de disposición final cuando se realice. ' : '') + 'Vista previa: el nombre, el documento y la procedencia del registro de morgue solo se cargan en la plataforma instalada.';
    });
  })();
})();
