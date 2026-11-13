/* =====================================================================
   CLEMI · Planificación de sala para el cliente (acceso semipúblico)
   ===================================================================== */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function dISO(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fLarga(s) { var d = dISO(s); return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; }
  function fCorta(s) { var d = dISO(s); return d.getDate() + ' de ' + MESES[d.getMonth()]; }
  function momento(m) { if (!m) return ''; var d = dISO(m.slice(0, 10)); return d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3) + ' · ' + m.slice(11, 16); }
  function diasEntre(a, b) { return Math.round((dISO(b) - dISO(a)) / 86400000); }

  var T = new URLSearchParams(location.search).get('t') || '';
  var CID = new URLSearchParams(location.search).get('c') || '';
  var S = { csrf: '', D: null, editor: null, guardando: null, cambios: false, version: null };

  function api(a, data) {
    var init = { credentials: 'same-origin', headers: {} };
    if (data !== undefined) { init.method = 'POST'; init.headers['Content-Type'] = 'application/json'; init.headers['X-CSRF'] = S.csrf; init.body = JSON.stringify(data); }
    return fetch('cliente-api.php?a=' + a + (CID ? '&c=' + encodeURIComponent(CID) : '&t=' + encodeURIComponent(T)), init).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: 'Respuesta inesperada del servidor.' }; }).then(function (j) { j.status = r.status; if (!j.ok) throw j; return j; });
    }, function () { throw { ok: false, error: 'No hay conexión. Revise su internet e intente de nuevo.' }; });
  }
  function toast(html, tipo) {
    var t = document.createElement('div'); t.className = 'toast' + (tipo === 'error' ? ' error' : ''); t.innerHTML = html;
    $('#toasts').appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 4500);
    setTimeout(function () { t.remove(); }, 5000);
  }
  function falla(e) { toast(esc((e && e.error) || 'Ocurrió un error.'), 'error'); }
  function modal(titulo, cuerpo, pie) {
    var f = document.createElement('div'); f.className = 'modal-fondo';
    f.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(titulo) + '"><div class="modal-cab"><h2>' + esc(titulo) + '</h2><button type="button" class="modal-x" aria-label="Cerrar">×</button></div>' +
      '<div class="modal-cuerpo">' + cuerpo + '</div>' + (pie ? '<div class="modal-pie">' + pie + '</div>' : '') + '</div>';
    $('#modal-raiz').appendChild(f);
    var cerrar = function () { f.remove(); };
    $('.modal-x', f).onclick = cerrar;
    f.addEventListener('mousedown', function (e) { if (e.target === f) cerrar(); });
    $$('[data-cerrar]', f).forEach(function (b) { b.onclick = cerrar; });
    var p = $('input,textarea', f); if (p) setTimeout(function () { p.focus(); }, 30);
    return { el: f, cerrar: cerrar };
  }
  function errorEn(m, msg) {
    var p = $('.form-error', m.el);
    if (!p) { p = document.createElement('p'); p.className = 'form-error'; p.setAttribute('role', 'alert'); $('.modal-cuerpo', m.el).prepend(p); }
    p.textContent = msg;
  }

  // ------------------------------------------------------------ entrada
  function inicio() {
    api('estado').then(function (j) {
      if (!j.valido) { if (j.login) { location.href = 'portal.html'; return; } return cerrado(j.mensaje); }
      if (j.portal) { var sb = $('#cl-salir'); sb.textContent = '← Mis solicitudes'; sb.hidden = false; }
      $('#cl-cliente').textContent = j.cliente;
      if (j.dentro) { S.csrf = j.csrf; cargar(); } else entrada(j);
    }, function (e) { cerrado(e.error); });
  }
  function cerrado(msg) {
    $('#cl-main').innerHTML = '<div class="cl-cerrado panel"><img src="assets/simbolo.png" alt=""><h1>Acceso no disponible</h1><p>' + esc(msg) + '</p><p class="meta">CLEMI · Centro Latinoamericano de Entrenamiento Médico e Investigación</p></div>';
  }
  function entrada(j) {
    $('#cl-main').innerHTML = '<form class="cl-entrada panel" id="cl-form" autocomplete="off" novalidate>' +
      '<img src="assets/logo.png" alt="CLEMI" class="cl-entrada-logo"><div class="eyebrow">Su curso en CLEMI</div><h1>' + esc(j.curso) + '</h1>' +
      '<p>Aquí puede elegir lo que necesita para su curso y recibir el presupuesto, y organizar la sala a su gusto: camillas, mesas, torres, pantallas y personas. Todo queda registrado a nombre de <b>' + esc(j.cliente) + '</b> y lo revisa el equipo de CLEMI.</p>' +
      '<label class="campo"><span>Su nombre completo</span><input id="cl-nombre" required maxlength="120" autocomplete="name"></label>' +
      '<label class="campo"><span>Código de acceso (6 dígitos)</span><input id="cl-pin" inputmode="numeric" pattern="[0-9]*" maxlength="6" required autocomplete="one-time-code"><small>Se lo envió su asesor de CLEMI junto con este enlace.</small></label>' +
      '<p class="form-error" id="cl-err" hidden></p><button class="btn btn-oro btn-grande" type="submit">Entrar</button></form>';
    $('#cl-form').onsubmit = function (e) {
      e.preventDefault(); var b = $('button', this); b.disabled = true; $('#cl-err').hidden = true;
      api('entrar', { nombre: $('#cl-nombre').value, pin: $('#cl-pin').value }).then(function (k) { S.csrf = k.csrf; cargar(); }, function (x) { $('#cl-err').textContent = x.error; $('#cl-err').hidden = false; b.disabled = false; });
    };
  }
  $('#cl-salir').onclick = function () { if (CID) { if (S.cambios) guardar(true); location.href = 'portal.html'; return; } if (S.cambios && !confirm('Tiene cambios sin guardar. ¿Salir de todas formas?')) return; api('salir', {}).then(function () { location.reload(); }, function () { location.reload(); }); };

  // ------------------------------------------------------------ planificación
  var EST = {
    sin_plan: ['Por armar', 'abierto'], abierto: ['Abierta para cambios', 'abierto'], enviado: ['Enviada · en revisión por CLEMI', 'enviado'],
    cambio_solicitado: ['Cambio solicitado · esperando aprobación', 'cambio'], aprobado: ['Aprobada por CLEMI', 'aprobado']
  };
  function cargar() {
    return api('datos').then(function (j) { S.D = j; S.version = null; pintar(); }, function (e) { if (e.pin) location.reload(); else falla(e); });
  }
  function itemsIniciales() {
    var D = S.D;
    if (S.version != null) { var v = D.versiones.find(function (x) { return +x.version === +S.version; }); return v ? v.items : []; }
    if (D.acceso.editable && D.borrador) return D.borrador;
    return D.versiones.length ? D.versiones[0].items : [];
  }
  function pintar() {
    var D = S.D, c = D.curso, a = D.acceso, e = EST[D.estado] || [D.estado, ''];
    $('#cl-salir').hidden = false;
    var editable = a.editable && S.version == null;
    var quedan = diasEntre(D.hoy, a.cambios_hasta);
    var aviso = '';
    if (D.estado === 'cambio_solicitado') aviso = '<div class="cl-aviso">Solicitó un cambio el ' + esc(momento(D.mensajes.find(function (m) { return /Cambio solicitado/.test(m.tipo); }) ? D.mensajes.find(function (m) { return /Cambio solicitado/.test(m.tipo); }).creado_en : '')) + '. Cuando CLEMI lo apruebe, podrá modificar la sala aquí mismo.</div>';
    else if (!a.en_plazo) aviso = '<div class="cl-aviso">El plazo para hacer cambios terminó el <b>' + esc(fLarga(a.cambios_hasta)) + '</b> (3 días antes del inicio). Puede consultar su planificación hasta el <b>' + esc(fLarga(a.hasta)) + '</b>.</div>';
    else if (D.estado === 'enviado') aviso = '<div class="cl-aviso ok">Recibimos su planificación. El equipo de CLEMI la está revisando. Si necesita cambiar algo, use «Solicitar un cambio».</div>';
    else if (D.estado === 'aprobado') aviso = '<div class="cl-aviso ok">Su planificación está aprobada. Si necesita un cambio, puede solicitarlo hasta el <b>' + esc(fLarga(a.cambios_hasta)) + '</b>; se aplica con la aprobación de CLEMI.</div>';
    else if (D.estado === 'abierto' && D.nota) aviso = '<div class="cl-aviso">CLEMI le pide un ajuste: <b>' + esc(D.nota) + '</b></div>';
    var men = D.mensajes.filter(function (m) { return m.texto; }).slice(0, 6);
    if (S.tab == null && D.contrato && D.contrato.puede_firmar) S.tab = 'contrato';
    if (S.tab == null) S.tab = D.ppto && (['Solicitud', 'Cotización'].indexOf(D.contrato_estado) >= 0 || ['aceptado', 'sin_presupuesto'].indexOf(D.ppto.estado) < 0) ? 'ppto' : 'sala';
    var esPp = S.tab === 'ppto' || S.tab === 'contrato', pe = D.ppto ? (PEST[D.ppto.estado] || [D.ppto.estado, '']) : ['', ''];
    var cab =
      '<section class="cl-curso"><div><div class="eyebrow">' + esc(c.cliente) + (c.codigo ? ' · ' + esc(c.codigo) : '') + '</div>' + (c.convenio ? '<div class="cl-conv">' + esc(c.convenio) + '</div>' : '') + '<h1>' + esc(c.curso) + '</h1>' +
        '<div class="cl-datos"><span><b>' + esc(D.sala.nombre) + '</b> · ' + (D.sala.ancho / 100).toFixed(1).replace('.', ',') + ' × ' + (D.sala.largo / 100).toFixed(1).replace('.', ',') + ' m</span>' +
        '<span>' + esc(c.fecha_inicio === c.fecha_fin ? fLarga(c.fecha_inicio) : fLarga(c.fecha_inicio) + ' al ' + fLarga(c.fecha_fin)) + ' · ' + esc(c.hora_ini) + '–' + esc(c.hora_fin) + '</span>' +
        (c.participantes ? '<span><b>' + c.participantes + '</b> participantes</span>' : '') + (c.estaciones ? '<span><b>' + c.estaciones + '</b> estaciones</span>' : '') +
        (c.componentes ? '<span><b>' + c.componentes + '</b> componentes anatómicos' + (c.tipo_componente ? ' · ' + esc(c.tipo_componente) : '') + '</span>' : '') + '</div></div>' +
        (esPp ? '<div class="cl-estado"><span class="cl-chip ' + pe[1] + '">' + esc(pe[0]) + '</span><div class="cl-plazos"><div><span>Acceso hasta</span><b>' + esc(fCorta(a.hasta)) + '</b><small>fecha de finalización del evento</small></div></div></div></section>' : '') +
        (esPp ? '' : '<div class="cl-estado"><span class="cl-chip ' + e[1] + '">' + esc(e[0]) + '</span>' +
        '<div class="cl-plazos"><div><span>Cambios hasta</span><b>' + esc(fCorta(a.cambios_hasta)) + '</b>' + (a.en_plazo ? '<small>' + (quedan === 0 ? 'hoy es el último día' : 'quedan ' + quedan + (quedan === 1 ? ' día' : ' días')) + '</small>' : '<small>plazo cerrado</small>') + '</div>' +
        '<div><span>Acceso hasta</span><b>' + esc(fCorta(a.hasta)) + '</b><small>fecha de finalización del evento</small></div></div></div></section>');
    var tb = function (k, l, n) { return '<button type="button" role="tab" data-tab="' + k + '" class="' + (S.tab === k ? 'on' : '') + '">' + l + (n ? ' <span class="cl-tab-n">' + n + '</span>' : '') + '</button>'; };
    var tabs = D.ppto ? '<nav class="cl-tabs" role="tablist">' + tb('ppto', D.portal ? '1 · Lo que necesita' : 'Presupuesto') + tb('sala', D.portal ? '2 · Arme su sala' : 'Planificación de la sala') +
      (D.contrato ? tb('contrato', D.portal ? '3 · Convenio' : 'Convenio', D.contrato.puede_firmar ? '!' : '') : '') + '</nav>' : '';
    if (esPp) {
      $('#cl-main').innerHTML = cab + tabs + '<div id="cl-ppto"></div>';
      enlazarTabs(); if (S.tab === 'contrato') pintarContrato(); else pintarPpto(); return;
    }
    $('#cl-main').innerHTML = cab + tabs +
      aviso +
      '<div class="cl-grid"><div class="panel"><div class="panel-cab"><h2>' + (S.version != null ? 'Versión ' + S.version + ' (solo consulta)' : editable ? 'Organice su sala' : 'Su sala') + '</h2>' +
        '<div class="acciones">' + (S.version != null ? '<button class="btn btn-sm" id="cl-volver" type="button">← Volver a la planificación actual</button>' : '') +
        (editable && D.sala.base.length ? '<button class="btn btn-sm" id="cl-base" type="button">Empezar con la distribución sugerida</button>' : '') +
        (editable ? '<button class="btn btn-sm" id="cl-vaciar" type="button">Vaciar sala</button>' : '') + '</div></div>' +
        '<div class="panel-cuerpo">' + (editable ? '<p class="meta" style="margin:0 0 10px">Toque un elemento de la lista para ponerlo en la sala y arrástrelo a su lugar. Selecciónelo para girarlo, nombrarlo (por ejemplo «Estación 1») o quitarlo. El borde inferior del plano es la puerta de la fotografía.</p>' : '') +
        '<div id="cl-editor"></div>' +
        (editable ? '<div class="editor-pie"><span class="meta" id="cl-guardado">' + (D.borrador ? 'Borrador guardado ' + esc(momento(D.borrador_en)) + (D.borrador_por ? ' por ' + esc(D.borrador_por) : '') : 'Los cambios se guardan como borrador automáticamente.') + '</span>' +
          '<div class="acciones"><button class="btn" id="cl-guardar" type="button">Guardar borrador</button><button class="btn btn-oro" id="cl-enviar" type="button">Enviar a CLEMI</button></div></div>' : '') +
        (!editable && S.version == null && a.puede_solicitar ? '<div class="editor-pie"><span class="meta">Para cambiar la sala, solicite el cambio. CLEMI lo revisa y le habilita la edición.</span><button class="btn btn-oro" id="cl-solicitar" type="button">Solicitar un cambio</button></div>' : '') +
        '</div></div>' +
      '<aside class="cl-lado">' +
        '<figure class="foto-ref" style="margin:0"><img src="assets/salas/' + esc(D.sala.foto) + '" alt="Fotografía de ' + esc(D.sala.nombre) + '" id="cl-foto"><figcaption>' + esc(D.sala.nombre) + ' · fotografía tomada desde la puerta.</figcaption></figure>' +
        (men.length ? '<div class="panel"><div class="panel-cab"><h2>Mensajes</h2></div><ul class="cl-men">' + men.map(function (m) {
          return '<li><b>' + esc(m.tipo) + '</b><span class="meta">' + esc(m.autor_nombre) + ' · ' + esc(momento(m.creado_en)) + (m.version ? ' · versión ' + m.version : '') + '</span><p>' + esc(m.texto) + '</p></li>';
        }).join('') + '</ul></div>' : '') +
        (D.versiones.length ? '<div class="panel"><div class="panel-cab"><h2>Historial</h2><span class="meta">' + D.versiones.length + (D.versiones.length === 1 ? ' versión' : ' versiones') + '</span></div><ul class="cl-ver">' + D.versiones.map(function (v, i) {
          return '<li><button type="button" class="btn-link" data-ver="' + v.version + '">Versión ' + v.version + '</button>' + (i === 0 ? ' <span class="cl-chip mini">vigente</span>' : '') +
            '<span class="meta">' + (v.autor_tipo === 'clemi' ? 'Ajuste de CLEMI · ' : '') + esc(v.autor_nombre) + ' · ' + esc(momento(v.creado_en)) + '</span>' + (v.notas ? '<p>' + esc(v.notas) + '</p>' : '') + '</li>';
        }).join('') + '</ul></div>' : '') +
        (D.av.length ? '<div class="panel"><div class="panel-cab"><h2>Incluido en su curso</h2></div><ul class="cl-av">' + D.av.map(function (x) {
          return '<li><span>' + esc(x.nombre) + (x.opcion ? ' <span class="meta">· ' + esc(x.opcion) + '</span>' : '') + (x.detalle ? '<br><span class="meta">' + esc(x.detalle) + '</span>' : '') + '</span><b>' + x.cantidad + '</b></li>';
        }).join('') + '</ul><p class="meta" style="padding:0 18px 14px;margin:0">Audiovisuales, certificados y marcación acordados con CLEMI.</p></div>' : '') +
      '</aside></div>';
    enlazarTabs();
    S.cambios = false;
    S.editor = new Plano.Editor($('#cl-editor'), { sala: D.sala, plano: D.sala.plano, items: itemsIniciales(), catalogo: D.catalogo, modo: 'items', editable: editable,
      onChange: function () { S.cambios = true; $('#cl-guardado').innerHTML = '<span class="sin-guardar">Cambios sin guardar</span>'; clearTimeout(S.guardando); S.guardando = setTimeout(function () { guardar(true); }, 2500); } });
    $('#cl-foto').onclick = function () { var v = document.createElement('div'); v.className = 'visor'; v.innerHTML = '<img src="' + this.src + '" alt="">'; v.onclick = function () { v.remove(); }; document.body.appendChild(v); };
    $$('[data-ver]').forEach(function (b) { b.onclick = function () { if (S.cambios) guardar(true); S.version = +b.getAttribute('data-ver'); pintar(); window.scrollTo(0, 0); }; });
    var x;
    if ((x = $('#cl-volver'))) x.onclick = function () { S.version = null; pintar(); };
    if ((x = $('#cl-base'))) x.onclick = function () {
      if (S.editor.valor().length && !confirm('Se reemplazará lo que tiene en la sala por la distribución sugerida. ¿Continuar?')) return;
      S.editor = new Plano.Editor($('#cl-editor'), Object.assign({}, S.editor.o, { items: D.sala.base.map(function (it) { return Object.assign({}, it, { id: 'i' + Math.random().toString(36).slice(2, 9) }); }) })); S.editor.cambio();
    };
    if ((x = $('#cl-vaciar'))) x.onclick = function () {
      if (!S.editor.valor().length || !confirm('¿Quitar todos los elementos de la sala?')) return;
      S.editor = new Plano.Editor($('#cl-editor'), Object.assign({}, S.editor.o, { items: [] })); S.editor.cambio();
    };
    if ((x = $('#cl-guardar'))) x.onclick = function () { guardar(false); };
    if ((x = $('#cl-enviar'))) x.onclick = enviar;
    if ((x = $('#cl-solicitar'))) x.onclick = solicitar;
  }

  // ------------------------------------------------------------ presupuesto (catálogo, solicitudes especiales, aceptación)
  var PEST = { sin_presupuesto: ['Elija lo que necesita', 'abierto'], seleccion: ['En selección', 'abierto'], solicitado: ['Enviado · CLEMI prepara su presupuesto', 'enviado'],
    emitido: ['Presupuesto listo para su revisión', 'cambio'], ajustes: ['Ajustes solicitados · puede modificar', 'abierto'], aceptado: ['Presupuesto aceptado', 'aprobado'] };
  var ESP = { 'Pendiente': 'enviado', 'En consulta': 'cambio', 'Aprobada': 'aprobado', 'No es posible': 'no' };
  function pesos(v) { return '$' + Math.round(+v || 0).toLocaleString('es-CO'); }
  function numTxt(n) { n = +n; return n === Math.round(n) ? String(n) : String(n).replace('.', ','); }
  function enlazarTabs() {
    $$('[data-tab]').forEach(function (b) { b.onclick = function () { if (S.cambios) guardar(true); S.tab = b.getAttribute('data-tab'); pintar(); }; });
  }
  function pintarPpto() {
    var P = S.D.ppto, ed = P.editable, est = P.estado, V = P.versiones[0];
    var guia = {
      sin_presupuesto: 'Arme su pedido como en un carrito de compras: elija del catálogo todo lo que necesita para su evento o entrenamiento (instrumental, equipos, insumos, servicios, alimentación…). Si necesita algo que no está, use <b>Solicitudes especiales</b>. Adjunte el <b>programa / agenda</b> y el <b>listado de personas</b>, y pulse <b>Finalizar pedido</b>: pasa a aprobación y recibirá la cotización con valores.',
      seleccion: 'Su pedido se guarda a medida que agrega. Cuando termine, con el programa / agenda y el listado de personas adjuntos, pulse <b>Finalizar pedido</b>: pasa a aprobación.',
      solicitado: 'Recibimos su pedido: está en aprobación. El área de Cotizaciones de CLEMI está preparando los valores y respondiendo sus solicitudes especiales. Le avisaremos cuando esté listo.',
      emitido: 'Su presupuesto está listo. Revíselo y acéptelo, o pida los ajustes que necesite.',
      ajustes: 'Pidió ajustes: <b>' + esc(P.ajustes || '') + '</b>. Modifique su selección y vuelva a enviarla.',
      aceptado: 'Aceptó el presupuesto' + (V && V.respuesta_en ? ' el ' + esc(momento(V.respuesta_en)) : '') + '. CLEMI le enviará el convenio para firma.'
    }[est] || '';
    var cz = P.cotiz || {};
    var h = faseCliente(P.fase) + (cz.limite && !cz.enviado ? '<div class="cl-plazo' + (cz.vencido ? ' vencido' : '') + '">' + (cz.vencido ? '<b>Venció el plazo para su pedido</b> (' + esc(fLarga(cz.limite)) + '). Comuníquese con su asesor de CLEMI para ampliarlo.'
        : '⏱ <b>Tiene hasta el ' + esc(fLarga(cz.limite)) + '</b> para elegir lo que necesita y finalizar su pedido · ' + (cz.habiles_restantes ? 'quedan <b>' + cz.habiles_restantes + ' día(s) hábil(es)</b> después de hoy.' : '<b>hoy es el último día</b>.')) + '</div>' : '') +
      '<div class="cl-aviso' + (est === 'aceptado' ? ' ok' : '') + '">' + guia + '</div>';
    if (V && (est === 'emitido' || est === 'aceptado' || (est === 'ajustes' && !ed))) h += presupuestoHTML(V);
    if (ed) {
      h += '<div class="cl-grid"><div class="panel"><div class="panel-cab"><h2>Catálogo de CLEMI</h2><span class="meta">' + P.catalogo.length + ' elementos</span></div><div class="panel-cuerpo">' +
        '<div class="cl-pp-filtros"><div class="cl-pp-areas" id="pp-areas">' + (P.areas || []).filter(function (a) { return P.catalogo.some(function (i) { return i.area === a; }); }).map(function (a) { var n = P.lineas.filter(function (l) { return l.area === a; }).length; return '<button type="button" data-a="' + esc(a) + '" class="' + (a === ppArea ? 'on' : '') + '"><b>' + esc(a) + '</b><small>' + esc(AREA_TXT[a] || '') + '</small>' + (n ? '<i>' + n + '</i>' : '') + '</button>'; }).join('') + '</div>' +
        '<input type="search" id="pp-q" placeholder="Buscar en todo el catálogo…"><div class="cl-pp-cats" id="pp-cats"></div></div>' +
        '<div id="pp-lista" class="cl-pp-lista"></div></div></div>' +
        '<aside class="cl-lado">' + programaHTML() + listadoHTML() + seleccionHTML(true) + especialesHTML(true) +
        '<div class="panel cl-fin"><div class="panel-cuerpo">' + faltaFin() + '<button class="btn btn-oro btn-grande" id="pp-env" type="button" style="width:100%"' + (puedeFin() ? '' : ' disabled') + '>🛒 Finalizar pedido</button><p class="meta" style="margin:8px 0 0">Al finalizar, su pedido pasa a aprobación de CLEMI; no podrá cambiarlo hasta recibir la cotización.</p></div></div></aside></div>';
    } else if (!V || est === 'solicitado') h += '<div class="cl-grid"><div>' + seleccionHTML(false) + '</div><aside class="cl-lado">' + programaHTML() + listadoHTML() + especialesHTML(false) + '</aside></div>';
    else h += programaHTML() + listadoHTML() + especialesHTML(false);
    if (P.versiones.length > 1) h += '<div class="panel" style="margin-top:18px"><div class="panel-cab"><h2>Versiones anteriores</h2></div><ul class="cl-ver">' + P.versiones.slice(1).map(function (v) {
      return '<li><b>Versión ' + v.version + '</b> · ' + pesos(v.total) + '<span class="meta">' + esc(momento(v.emitido_en)) + (v.respuesta ? ' · ' + (v.respuesta === 'aceptado' ? 'aceptada' : 'ajustes: ' + esc(v.respuesta_texto || '')) : '') + '</span></li>';
    }).join('') + '</ul></div>';
    $('#cl-ppto').innerHTML = h;
    if (ed) { listaCat(''); enlazarPpto(); }
    enlazarPrograma(); enlazarListado(); enlazarBrief(P.editable);
    var x;
    if ((x = $('#pp-ok'))) x.onclick = function () { responder('aceptado'); };
    if ((x = $('#pp-aj'))) x.onclick = function () { responder('ajustes'); };
  }
  function presupuestoHTML(V) {
    var d = V.datos, T = d.totales, g = {};
    d.lineas.forEach(function (l) { (g[l.categoria] = g[l.categoria] || []).push(l); });
    return '<div class="panel cl-pp-doc"><div class="panel-cab"><h2>Presupuesto · versión ' + V.version + '</h2><span class="meta">Emitido ' + esc(momento(V.emitido_en)) + '</span></div>' +
      '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Elemento</th><th class="num">Cantidad</th><th class="num">Valor unitario</th><th class="num">Total</th></tr></thead><tbody>' +
      Object.keys(g).map(function (k) {
        return '<tr class="cl-pp-g"><td colspan="4">' + esc(k) + '</td></tr>' + g[k].map(function (l) {
          return '<tr><td>' + esc(l.descripcion) + (l.nota && l.origen !== 'especial' ? '<br><span class="meta">' + esc(l.nota) + '</span>' : '') + (l.origen === 'especial' ? ' <span class="cl-chip mini">solicitud especial</span>' : '') + '</td><td class="num">' + numTxt(l.cantidad) + ' ' + esc(l.unidad) + (l.dias > 1 ? ' × ' + l.dias + ' días' : '') + '</td><td class="num">' + pesos(l.precio) + '</td><td class="num"><b>' + pesos(l.total) + '</b></td></tr>';
        }).join('');
      }).join('') + '</tbody></table></div>' +
      '<div class="cl-pp-tot">' + Object.keys(T.grupos).filter(function (k) { return T.grupos[k]; }).map(function (k) { return '<div><span>' + esc(k) + '</span><b>' + pesos(T.grupos[k]) + '</b></div>'; }).join('') +
      (T.admin ? '<div><span>Administración CLEMI (componentes anatómicos, logística y administración)</span><b>' + pesos(T.admin) + '</b></div>' : '') +
      '<div><span>Subtotal</span><b>' + pesos(T.subtotal) + '</b></div><div><span>IVA (' + numTxt(T.iva_pct) + '%)</span><b>' + pesos(T.iva) + '</b></div><div class="total"><span>Total IVA incluido</span><b>' + pesos(T.total) + '</b></div>' +
      (T.anticipo_pct < 100 ? '<p class="meta">Forma de pago: ' + numTxt(T.anticipo_pct) + '% (' + pesos(T.pago1) + ') a la firma del convenio y ' + numTxt(100 - T.anticipo_pct) + '% (' + pesos(T.pago2) + ') después de la actividad.</p>' : '') +
      (d.nota ? '<p class="meta">' + esc(d.nota) + '</p>' : '') + '</div>' +
      (S.D.ppto.puede_responder ? '<div class="editor-pie"><span class="meta">¿Está de acuerdo con este presupuesto?</span><div class="acciones"><button class="btn" id="pp-aj" type="button">Pedir ajustes</button><button class="btn btn-oro" id="pp-ok" type="button">Aceptar presupuesto</button></div></div>' : '') + '</div>';
  }
  function seleccionHTML(ed) {
    var L = S.D.ppto.lineas.filter(function (l) { return l.origen !== 'especial'; });
    return '<div class="panel"><div class="panel-cab"><h2>Su selección</h2><span class="meta">' + L.length + '</span></div>' + (L.length ? '<ul class="cl-pp-sel">' + L.map(function (l) {
      return '<li><div><b>' + esc(l.descripcion) + '</b><span class="meta">' + esc(l.categoria) + (l.nota ? ' · ' + esc(l.nota) : '') + (l.origen === 'clemi' ? ' · agregado por CLEMI' : '') + '</span>' + (l.datos ? '<button type="button" class="btn-link cl-brief-ver" data-br="' + l.id + '">📝 ' + (ed ? 'Ver o editar' : 'Ver') + ' los datos del ' + (l.datos._tipo === 'reel' ? 'reel' : 'flyer') + '</button>' : '') + '</div>' +
        (ed ? '<div class="cl-pp-q"><label>' + esc(l.unidad) + '<input type="number" min="0" step="any" value="' + l.cantidad + '" data-lq="' + l.id + '"></label><label>Días<input type="number" min="1" max="60" value="' + l.dias + '" data-ld="' + l.id + '"></label><button type="button" class="btn-link" data-lx="' + l.id + '">Quitar</button></div>'
          : '<span class="cl-pp-n">' + numTxt(l.cantidad) + ' ' + esc(l.unidad) + (l.dias > 1 ? ' × ' + l.dias + ' días' : '') + '</span>') + '</li>';
    }).join('') + '</ul>' : '<p class="meta" style="padding:0 18px 14px;margin:0">Aún no ha elegido elementos.</p>') + '</div>';
  }
  // Programa / agenda del entrenamiento: obligatorio para enviar la solicitud.
  function urlCli(a, extra) { return 'cliente-api.php?a=' + a + (CID ? '&c=' + encodeURIComponent(CID) : '&t=' + encodeURIComponent(T)) + (extra || ''); }
  function programaHTML() {
    var P = S.D.ppto, L = P.programa || [], ed = P.programa_editable, quitar = ed && P.editable;
    return '<div class="panel cl-prog' + (L.length ? '' : ' falta') + '" id="cl-prog"><div class="panel-cab"><h2>Programa del entrenamiento</h2><span class="cl-chip mini ' + (L.length ? 'ok' : 'obl') + '">' + (L.length ? 'Adjunto' : 'Obligatorio') + '</span></div><div class="panel-cuerpo">' +
      '<p class="meta" style="margin:0 0 10px">Adjunte el programa o la agenda de su entrenamiento (temas, horarios, procedimientos y docentes). Es obligatorio para finalizar su pedido: con él CLEMI prepara salas, instrumental, componentes anatómicos y audiovisuales.</p>' +
      (L.length ? '<ul class="cl-prog-l">' + L.map(function (a) {
        return '<li><a href="' + (a.url || urlCli('programa_ver', '&id=' + a.id)) + '"' + (a.url ? ' target="_blank" rel="noopener"' : '') + '><b>' + esc(a.nombre) + '</b></a><span class="meta">' + pesoTxt(a.tamano) + ' · ' + esc(momento(a.creado_en)) + (a.del_cliente ? '' : ' · adjuntado por CLEMI') + '</span>' + (quitar && a.del_cliente ? '<button type="button" class="btn-link" data-pq="' + a.id + '">Quitar</button>' : '') + '</li>';
      }).join('') + '</ul>' : '') +
      (ed ? '<label class="btn' + (L.length ? '' : ' btn-oro') + ' cl-prog-sub"><input type="file" id="prog-f" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png" hidden>' + (L.length ? 'Adjuntar otro archivo' : 'Adjuntar programa / agenda') + '</label><span class="meta" id="prog-st"> PDF, Word, Excel, PowerPoint o imagen · máx. 20 MB</span>' : '') + '</div></div>';
  }
  // ---- Proceso, listado de personas y finalizar pedido
  var FASES_CL = [['negociacion', 'Solicitud'], ['cotizacion', 'Cotización'], ['administrativo', 'Convenio y firmas'], ['operacion', 'Preparación del evento']];
  function faseCliente(f) {
    var k = FASES_CL.map(function (x) { return x[0]; }).indexOf(f || 'cotizacion');
    return '<ol class="cl-fases">' + FASES_CL.map(function (x, i) { return '<li class="' + (i < k ? 'hecha' : i === k ? 'actual' : '') + '"><i>' + (i < k ? '✓' : i + 1) + '</i>' + x[1] + '</li>'; }).join('') + '</ol>';
  }
  function puedeFin() { var P = S.D.ppto; return (P.lineas.length || P.especiales.length) && (P.programa || []).length && P.listado && P.listado.n; }
  function faltaFin() {
    var P = S.D.ppto, f = [];
    if (!(P.lineas.length || P.especiales.length)) f.push('elija al menos un elemento o haga una solicitud especial');
    if (!(P.programa || []).length) f.push('adjunte el programa / agenda');
    if (!(P.listado && P.listado.n)) f.push('cargue el listado de personas');
    return f.length ? '<p class="cl-falta">Para finalizar: ' + esc(f.join(' · ')) + '.</p>' : '<p class="cl-listo">✓ Todo listo para finalizar su pedido.</p>';
  }
  function listadoHTML() {
    var P = S.D.ppto, L = P.listado || { n: 0, roles: {} }, ed = P.listado_editable;
    return '<div class="panel cl-prog' + (L.n ? '' : ' falta') + '" id="cl-lis"><div class="panel-cab"><h2>Listado de personas</h2><span class="cl-chip mini ' + (L.n ? 'ok' : 'obl') + '">' + (L.n ? L.n + ' personas' : 'Obligatorio') + '</span></div><div class="panel-cuerpo">' +
      '<p class="meta" style="margin:0 0 10px">Participantes, instructores y staff de su evento. <b>Es obligatorio:</b> con él cada persona recibe su código QR; <b>sin QR no puede ingresar</b> a CLEMI.</p>' +
      (L.n ? '<p style="margin:0 0 8px"><span class="cl-rol par">Participantes · ' + (L.roles.Participante || 0) + '</span> <span class="cl-rol ins">Instructores · ' + (L.roles.Instructor || 0) + '</span> <span class="cl-rol staff">Staff · ' + (L.roles.Staff || 0) + '</span></p><p class="meta" style="margin:0 0 10px">' + esc(L.nombre || '') + (L.en ? ' · ' + esc(momento(L.en)) : '') + '</p>' : '') +
      (ed ? '<label class="btn' + (L.n ? '' : ' btn-oro') + ' cl-prog-sub"><input type="file" id="lis-f" accept=".xlsx,.xls,.csv" hidden>' + (L.n ? 'Reemplazar listado' : 'Cargar listado (Excel o CSV)') + '</label> <button type="button" class="btn-link" id="lis-pl">Descargar plantilla</button>' : '') + '</div></div>';
  }
  var CAMPOS_L = [['rol', /^(rol|tipo|tipo de (asistente|participante)|categor[ií]a|perfil)$/], ['nombre', /^(nombres?|primer nombre|name|nombre completo)$/], ['apellido', /^(apellidos?|last ?name)$/], ['tipo_doc', /tipo.*(doc|ident)/],
    ['documento', /^(documento|n[uú]mero( de)? (documento|identificaci[oó]n)|identificaci[oó]n|c[eé]dula|cc|doc|id)$/], ['especialidad', /especialidad|profesi[oó]n/], ['institucion', /instituci[oó]n|empresa|hospital|entidad/], ['correo', /correo|e-?mail/], ['telefono', /tel[eé]fono|celular|m[oó]vil/]];
  function enlazarListado() {
    var pl = $('#lis-pl');
    if (pl) pl.onclick = function () {
      var csv = '\ufeffRol;Nombres;Apellidos;Tipo de documento;Documento;Correo;Teléfono;Especialidad;Institución\nParticipante;Ana;Pérez;CC;10203040;ana@correo.com;3001234567;Ortopedia;Hospital X\nInstructor;Carlos;Ruiz;CC;80900100;carlos@correo.com;3109876543;Ortopedia;\nStaff;Laura;Gómez;CC;52000111;laura@correo.com;3201112233;;Empresa Y\n';
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'Plantilla listado de personas CLEMI.csv'; document.body.appendChild(a); a.click(); a.remove();
    };
    var f = $('#lis-f'); if (!f) return;
    f.onchange = function () {
      var x = f.files[0]; if (!x) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          if (!window.XLSX) throw { message: 'No se pudo cargar el lector de Excel.' };
          var wb = /\.csv$/i.test(x.name) ? window.XLSX.read(new TextDecoder('utf-8').decode(new Uint8Array(rd.result)), { type: 'string' }) : window.XLSX.read(new Uint8Array(rd.result), { type: 'array' });
          var F = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' });
          var norm = function (h) { return String(h || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.:]/g, ''); };
          var ix = F.findIndex(function (r) { return r.some(function (h) { return /nombre|documento|c[eé]dula/.test(norm(h)); }); });
          if (ix < 0) throw { message: 'No se encontraron los títulos de las columnas (Nombres, Documento…). Use la plantilla.' };
          F = F.slice(ix); var mapa = {};
          F[0].forEach(function (h, k) { var n = norm(h); CAMPOS_L.forEach(function (c) { if (mapa[c[0]] == null && c[1].test(n)) mapa[c[0]] = k; }); });
          if (mapa.nombre == null) F[0].forEach(function (h, k) { if (mapa.nombre == null && /nombre/.test(norm(h))) mapa.nombre = k; });
          if (mapa.nombre == null || mapa.documento == null) throw { message: 'El archivo debe tener las columnas Nombres y Documento. Use la plantilla.' };
          var filas = F.slice(1).filter(function (r) { return r.some(function (v) { return String(v).trim(); }); }).map(function (r) { var o = {}; Object.keys(mapa).forEach(function (k) { o[k] = String(r[mapa[k]] == null ? '' : r[mapa[k]]).trim(); }); return o; });
          var R = { Participante: 0, Instructor: 0, Staff: 0 };
          filas.forEach(function (p) { var t = (p.rol || '').toLowerCase(); R[/instruct|docente|profesor|ponente|speaker|conferencista|tutor/.test(t) ? 'Instructor' : /staff|apoyo|log[ií]st|organiza|coordina|equipo|personal/.test(t) ? 'Staff' : 'Participante']++; });
          var m = modal('Cargar listado de personas', '<p style="margin:0 0 8px"><b>' + filas.length + '</b> personas en «' + esc(x.name) + '»: ' + R.Participante + ' participantes · ' + R.Instructor + ' instructores · ' + R.Staff + ' staff.</p>' +
            '<div class="cl-tabla"><table><tbody>' + filas.slice(0, 6).map(function (p) { return '<tr><td>' + esc(p.rol || 'Participante') + '</td><td>' + esc((p.nombre || '') + ' ' + (p.apellido || '')) + '</td><td>' + esc(p.documento || '') + '</td></tr>'; }).join('') + '</tbody></table></div>' +
            '<p class="meta" style="margin:8px 0 0">La columna <b>Rol</b> indica si es participante, instructor o staff (si falta, se toma como participante).' + (S.D.ppto.listado && S.D.ppto.listado.n ? ' Este listado reemplaza el anterior.' : '') + '</p>',
            '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="x-ok" type="button">Cargar listado</button>');
          $('#x-ok', m.el).onclick = function () { var b = this; b.disabled = true; api('listado_guardar', { filas: filas, archivo: x.name }).then(function (j) { m.cerrar(); toast('<b>Listado cargado:</b> ' + j.n + ' personas.'); recargarPpto(); }, function (e) { b.disabled = false; errorEn(m, e.error); }); };
        } catch (e) { toast(esc(e.message || 'No se pudo leer el archivo.'), 'error'); }
        f.value = '';
      };
      rd.readAsArrayBuffer(x);
    };
  }
  // ---- Flyer y reel: datos obligatorios para crearlos
  function briefPre() {
    var c = S.D.curso, P = S.D.ppto, ins = (P.listado_filas || []).filter(function (p) { return p.rol === 'Instructor'; });
    var fl = function (a, b) { return (a === b ? fLarga(a) : fLarga(a) + ' al ' + fLarga(b)) + ' de ' + b.slice(0, 4); };
    return { titulo: c.curso, fechas: fl(c.fecha_inicio, c.fecha_fin), horario: c.hora_ini + ' a ' + c.hora_fin, lugar: 'CLEMI' + (S.D.sala ? ' · ' + S.D.sala.nombre : ''), instructores: ins.map(function (p) { return (p.nombre + ' ' + (p.apellido || '')).trim() + (p.especialidad ? ' · ' + p.especialidad : ''); }).join('\n'), dirigido: c.especialidad || '' };
  }
  function briefCliente(tipo, actual, guardar, soloVer) {
    var campos = (S.D.ppto.brief || {})[tipo] || [], v = actual || briefPre(), largo = ['instructores', 'agenda', 'observaciones', 'enfoque'];
    var m = modal('Datos para el ' + (tipo === 'reel' ? 'reel promocional' : 'flyer') + ' del evento', '<p class="meta" style="margin:0 0 10px">Con estos datos el equipo de Audiovisuales de CLEMI crea el ' + (tipo === 'reel' ? 'reel' : 'flyer') + '. Los marcados son obligatorios. Revise los que se llenaron con los datos del curso.</p><div class="form-grid">' +
      campos.map(function (c) { var val = esc(v[c[0]] || ''); return '<label class="campo' + (largo.indexOf(c[0]) >= 0 ? ' ancho' : '') + '"><span' + (c[2] ? ' class="req"' : '') + '>' + esc(c[1]) + '</span>' + (largo.indexOf(c[0]) >= 0 ? '<textarea data-bf="' + c[0] + '" rows="3"' + (soloVer ? ' readonly' : '') + '>' + val + '</textarea>' : '<input data-bf="' + c[0] + '" value="' + val + '"' + (soloVer ? ' readonly' : '') + '>') + (c[3] ? '<small>' + esc(c[3]) + '</small>' : '') + '</label>'; }).join('') + '</div>',
      '<button class="btn" data-cerrar type="button">' + (soloVer ? 'Cerrar' : 'Cancelar') + '</button>' + (soloVer ? '' : '<button class="btn btn-oro" id="x-ok" type="button">Guardar datos</button>'));
    var ok = $('#x-ok', m.el);
    if (ok) ok.onclick = function () {
      var d = {}, falta = []; $$('[data-bf]', m.el).forEach(function (x) { d[x.getAttribute('data-bf')] = x.value.trim(); });
      campos.forEach(function (c) { if (c[2] && !d[c[0]]) falta.push(c[1]); });
      if (falta.length) return errorEn(m, 'Faltan datos obligatorios: ' + falta.join(', ') + '.');
      ok.disabled = true; guardar(d).then(function () { m.cerrar(); }, function (e) { ok.disabled = false; errorEn(m, e.error); });
    };
  }
  function enlazarBrief(ed) {
    $$('[data-br]').forEach(function (b) {
      b.onclick = function () {
        var l = S.D.ppto.lineas.find(function (x) { return x.id === +b.getAttribute('data-br'); }); if (!l) return;
        briefCliente(l.datos._tipo, l.datos, function (d) { return api('ppto_linea', { id: l.id, cantidad: l.cantidad, dias: l.dias, nota: l.nota || '', datos: d }).then(function () { toast('Datos actualizados.'); recargarPpto(); }); }, !(ed && S.D.ppto.editable));
      };
    });
  }
  function pesoTxt(b) { b = +b || 0; return b >= 1048576 ? (Math.round(b / 104857.6) / 10).toString().replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function enlazarPrograma() {
    var f = $('#prog-f');
    if (f) f.onchange = function () {
      var x = f.files[0]; if (!x) return;
      if (x.size > 20 * 1048576) { toast('El archivo supera 20 MB.', 'error'); f.value = ''; return; }
      var fd = new FormData(); fd.append('archivo', x); $('#prog-st').textContent = ' Subiendo…';
      fetch(urlCli('programa_subir'), { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF': S.csrf }, body: fd }).then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Respuesta inesperada del servidor.' }; }); }, function () { return { ok: false, error: 'No hay conexión. Revise su internet e intente de nuevo.' }; })
        .then(function (j) { if (!j.ok) { $('#prog-st').textContent = ''; f.value = ''; return falla(j); } toast('<b>Programa adjuntado.</b>'); recargarPpto(); });
    };
    $$('[data-pq]').forEach(function (b) { b.onclick = function () { api('programa_quitar', { id: +b.getAttribute('data-pq') }).then(recargarPpto, falla); }; });
  }
  function especialesHTML(ed) {
    var E = S.D.ppto.especiales;
    return '<div class="panel"><div class="panel-cab"><h2>Solicitudes especiales</h2></div><div class="panel-cuerpo">' +
      '<p class="meta" style="margin:0 0 10px">¿Necesita un equipo, insumo o servicio que no está en el catálogo? Pídalo o pregunte aquí: CLEMI revisa si lo puede conseguir y le confirma.</p>' +
      (E.length ? '<ul class="cl-pp-esp">' + E.map(function (e) {
        return '<li><span class="cl-chip mini ' + (ESP[e.estado] || '') + '">' + esc(e.estado) + '</span><p><b>' + esc(e.texto) + '</b>' + (e.cantidad ? ' · ' + esc(e.cantidad) : '') + '</p>' + (e.respuesta ? '<p class="cl-pp-resp">CLEMI: ' + esc(e.respuesta) + '</p>' : '') +
          (ed && e.estado === 'Pendiente' ? '<button type="button" class="btn-link" data-ex="' + e.id + '">Quitar</button>' : '') + '</li>';
      }).join('') + '</ul>' : '') +
      (ed ? '<label class="campo"><span>¿Qué necesita?</span><textarea id="pp-et" maxlength="1500" placeholder="Ej. Motor de alta velocidad para endoscopia de columna"></textarea></label><label class="campo"><span>Cantidad (opcional)</span><input id="pp-ec" maxlength="60" placeholder="Ej. 2 por 2 días"></label><button class="btn" id="pp-ea" type="button">Agregar solicitud especial</button>' : '') + '</div></div>';
  }
  var ppCat = '', ppQ = '', ppArea = 'Audiovisual';
  var AREA_TXT = { 'Audiovisual': 'Equipos, transmisión, certificados, marcación y fotografía', 'Morgue': 'Componentes anatómicos', 'Instrumentación': 'Instrumental y apoyo quirúrgico', 'Biomédica': 'Equipos médicos e insumos', 'Logística y servicios': 'Salas, alimentación, transporte y otros' };
  function listaCat() {
    var cats = []; S.D.ppto.catalogo.forEach(function (i) { if ((ppQ || i.area === ppArea) && cats.indexOf(i.categoria) < 0) cats.push(i.categoria); });
    if (ppCat && cats.indexOf(ppCat) < 0) ppCat = '';
    $('#pp-cats').innerHTML = cats.length > 1 ? '<button type="button" data-c=""' + (ppCat ? '' : ' class="on"') + '>Todo</button>' + cats.map(function (c) { return '<button type="button" data-c="' + esc(c) + '"' + (c === ppCat ? ' class="on"' : '') + '>' + esc(c) + '</button>'; }).join('') : '';
    $$('#pp-cats button').forEach(function (b) { b.onclick = function () { ppCat = b.getAttribute('data-c'); listaCat(); }; });
    var L = S.D.ppto.catalogo.filter(function (i) { return (ppQ || i.area === ppArea) && (!ppCat || i.categoria === ppCat) && (!ppQ || (i.nombre + ' ' + i.descripcion + ' ' + i.categoria + ' ' + i.area).toLowerCase().indexOf(ppQ) >= 0); });
    var ya = {}; S.D.ppto.lineas.forEach(function (l) { if (l.item_id) ya[l.item_id] = 1; });
    $('#pp-lista').innerHTML = L.length ? L.map(function (i) {
      return '<div class="cl-pp-it" data-i="' + i.id + '"><div><b>' + esc(i.nombre) + '</b>' + (i.formulario ? '<span class="cl-brief-tag">📝 Al agregarlo, diligencie los datos obligatorios del ' + (i.formulario === 'reel' ? 'reel' : 'flyer') + '</span>' : '') + '<span class="meta">' + esc(i.categoria) + ' · por ' + esc(i.unidad) + '</span>' + (i.disponible == null ? '' : '<span class="cl-disp' + (i.disponible > 0 ? '' : ' no') + '">' + (i.disponible > 0 ? i.disponible + ' disponible' + (i.disponible === 1 ? '' : 's') + ' para sus fechas' : 'Agotado para sus fechas · puede pedirlo como solicitud especial') + '</span>') + (i.descripcion ? '<small>' + esc(i.descripcion) + '</small>' : '') + '</div>' +
        '<div class="cl-pp-q">' + ((i.opciones || []).length ? '<label>Opción<select data-k="o">' + i.opciones.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select></label>' : '') + '<label>Cantidad<input type="number" min="0" step="any" value="1" data-k="c"' + (i.disponible == null ? '' : ' max="' + i.disponible + '"') + '></label><label>Días<input type="number" min="1" max="60" value="1" data-k="d"></label><button class="btn btn-sm ' + (ya[i.id] ? '' : 'btn-verde') + '" type="button" data-add' + (i.disponible === 0 ? ' disabled' : '') + '>' + (ya[i.id] ? 'Agregar otra vez' : 'Agregar') + '</button></div></div>';
    }).join('') : '<p class="meta">No hay elementos con ese filtro. Si no encuentra lo que necesita, hágalo como solicitud especial.</p>';
    $$('#pp-lista [data-add]').forEach(function (b) {
      b.onclick = function () {
        var f = b.closest('[data-i]'); b.disabled = true;
        var item = S.D.ppto.catalogo.find(function (i) { return i.id === +f.getAttribute('data-i'); }) || {};
        var envia = function (datos) { return api('ppto_linea', { item_id: item.id, cantidad: $('[data-k=c]', f).value, dias: $('[data-k=d]', f).value, nota: nota || '', opcion: $('[data-k=o]', f) ? $('[data-k=o]', f).value : '', datos: datos || undefined }); };
        if (item.formulario) { b.disabled = false; return briefCliente(item.formulario, null, function (datos) { return envia(datos).then(function () { toast('<b>' + esc(item.nombre) + '</b> agregado con sus datos.'); recargarPpto(); }); }); }
        var nota = ya[f.getAttribute('data-i')] ? prompt('Ya tiene este elemento. Escriba una nota para diferenciarlo (por ejemplo, para qué día o sala):') : '';
        if (nota === null) { b.disabled = false; return; }
        envia().then(function () { toast('Agregado a su selección.'); recargarPpto(); }, function (e) { b.disabled = false; falla(e); });
      };
    });
  }
  function recargarPpto() { var y = window.scrollY; return api('datos').then(function (j) { S.D = j; pintar(); window.scrollTo(0, y); }, falla); }
  function enlazarPpto() {
    $('#pp-q').oninput = function () { ppQ = this.value.toLowerCase(); listaCat(); };
    $$('#pp-areas button').forEach(function (b) { b.onclick = function () { ppArea = b.getAttribute('data-a'); ppCat = ''; ppQ = ''; $('#pp-q').value = ''; $$('#pp-areas button').forEach(function (x) { x.classList.toggle('on', x === b); }); listaCat(); }; });
    var t;
    var cambiar = function (id) { clearTimeout(t); t = setTimeout(function () { api('ppto_linea', { id: id, cantidad: $('[data-lq="' + id + '"]').value, dias: $('[data-ld="' + id + '"]').value, nota: (S.D.ppto.lineas.find(function (l) { return +l.id === +id; }) || {}).nota || '' }).then(function () { toast('Cantidad actualizada.'); }, falla); }, 700); };
    $$('[data-lq],[data-ld]').forEach(function (x) { x.oninput = function () { cambiar(x.getAttribute('data-lq') || x.getAttribute('data-ld')); }; });
    $$('[data-lx]').forEach(function (x) { x.onclick = function () { api('ppto_quitar', { id: +x.getAttribute('data-lx') }).then(recargarPpto, falla); }; });
    enlazarBrief(true);
    $$('[data-ex]').forEach(function (x) { x.onclick = function () { api('ppto_especial_quitar', { id: +x.getAttribute('data-ex') }).then(recargarPpto, falla); }; });
    $('#pp-ea').onclick = function () { var b = this; b.disabled = true; api('ppto_especial', { texto: $('#pp-et').value, cantidad: $('#pp-ec').value }).then(function () { toast('Solicitud especial agregada.'); recargarPpto(); }, function (e) { b.disabled = false; falla(e); }); };
    $('#pp-env').onclick = function () {
      var P = S.D.ppto;
      var m = modal('Finalizar pedido', '<p style="margin:0">Su pedido tiene <b>' + P.lineas.length + '</b> elementos' + (P.especiales.length ? ' y <b>' + P.especiales.length + '</b> solicitudes especiales' : '') + ', el programa / agenda y el listado de <b>' + (P.listado ? P.listado.n : 0) + '</b> personas' + (S.D.portal ? ', junto con la sala que armó,' : '') + ', a nombre de <b>' + esc(S.D.curso.cliente) + '</b>. Pasa a aprobación: el área de Cotizaciones de CLEMI preparará los valores y le responderá.</p>' +
        '<label class="campo"><span>Comentarios (opcional)</span><textarea id="x-n" maxlength="1500"></textarea></label>',
        '<button class="btn" data-cerrar type="button">Seguir eligiendo</button><button class="btn btn-oro" id="x-ok" type="button">Finalizar pedido</button>');
      $('#x-ok', m.el).onclick = function () { var b = this; b.disabled = true; api('ppto_enviar', { notas: $('#x-n', m.el).value }).then(function () { m.cerrar(); toast('<b>Pedido finalizado.</b> Pasó a aprobación; CLEMI le responderá aquí con la cotización.'); recargarPpto(); }, function (e) {
        b.disabled = false; if (e.falta_listado) { m.cerrar(); toast(esc(e.error), 'error'); var ls = $('#cl-lis'); if (ls) ls.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; } if (e.falta_programa) { m.cerrar(); toast(esc(e.error), 'error'); var pg = $('#cl-prog'); if (pg) pg.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; } if (e.falta_sala) { m.cerrar(); toast(esc(e.error), 'error'); S.tab = 'sala'; pintar(); window.scrollTo(0, 0); return; } errorEn(m, e.error); }); };
    };
  }
  function responder(r) {
    var ok = r === 'aceptado';
    var m = modal(ok ? 'Aceptar presupuesto' : 'Pedir ajustes', ok ? '<p style="margin:0">Acepta el presupuesto por <b>' + pesos(S.D.ppto.versiones[0].total) + '</b> IVA incluido, a nombre de <b>' + esc(S.D.curso.cliente) + '</b>. CLEMI preparará el convenio para firma.</p>'
      : '<label class="campo"><span>¿Qué necesita ajustar?</span><textarea id="x-t" maxlength="1500" placeholder="Ej. Necesitamos 2 auditorios y quitar el arco en C"></textarea></label><p class="meta" style="margin:0">Podrá modificar su selección y volver a enviarla.</p>',
      '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-oro" id="x-ok" type="button">' + (ok ? 'Aceptar' : 'Enviar') + '</button>');
    $('#x-ok', m.el).onclick = function () { var b = this; b.disabled = true; api('ppto_responder', { respuesta: r, texto: $('#x-t', m.el) ? $('#x-t', m.el).value : '' }).then(function () { m.cerrar(); toast(ok ? '<b>Presupuesto aceptado.</b> Gracias.' : 'Ajustes enviados.'); recargarPpto(); }, function (e) { b.disabled = false; errorEn(m, e.error); }); };
  }

  // ------------------------------------------------------------ contrato: lectura y firma electrónica
  function pintarContrato() {
    var K = S.D.contrato;
    if (!K) { $('#cl-ppto').innerHTML = '<div class="cl-aviso">CLEMI aún no le ha enviado el contrato.</div>'; return; }
    var est = { 'Por firmar el cliente': 'Lea el convenio completo, incluidos los anexos, y fírmelo al final.', 'Por firmar CLEMI': 'Usted firmó el contrato. Falta la firma de la representante legal de CLEMI; le avisaremos cuando quede firmado.', 'Firmado': 'El convenio está firmado por las dos partes. Puede descargarlo cuando quiera.' }[K.estado] || '';
    if (K.estado === 'Por firmar el cliente' && !K.puede_firmar) est = 'El convenio está listo para firmar. La firma se hace en el <a href="portal.html">portal de clientes</a>, con el usuario y la contraseña de su empresa.';
    var h = '<div class="cl-aviso' + (K.estado === 'Firmado' ? ' ok' : '') + '">' + est + (K.descargable ? ' <a class="btn btn-sm" href="cliente-api.php?a=contrato_docx&c=' + encodeURIComponent(CID) + '">Descargar convenio firmado (Word)</a>' : '') + '</div>' +
      '<div class="panel cl-ctr"><div class="panel-cuerpo">' + K.html + '</div></div>' +
      '<p class="meta">Versión ' + K.version + ' · enviada ' + esc(momento(K.enviado_en)) + ' · huella del contenido (SHA-256): <code>' + esc(K.hash) + '</code></p>';
    if (K.puede_firmar) h += '<div class="panel cl-firmar" id="cl-firmar"><div class="panel-cab"><h2>Firmar el convenio</h2></div><div class="panel-cuerpo"><div class="form-grid">' +
      '<label class="campo"><span>Nombre completo de quien firma</span><input id="f-n" maxlength="160" autocomplete="name"></label>' +
      '<label class="campo"><span>Cargo</span><input id="f-c" maxlength="120" placeholder="Ej. Representante legal"></label>' +
      '<label class="campo"><span>Tipo de documento</span><select id="f-t"><option>cédula de ciudadanía</option><option>cédula de extranjería</option><option>pasaporte</option></select></label>' +
      '<label class="campo"><span>Número de documento</span><input id="f-d" maxlength="40"></label></div>' +
      '<div class="campo"><span>Firma (dibújela con el mouse o con el dedo)</span><canvas id="f-lienzo" class="cl-lienzo" width="600" height="200"></canvas><button type="button" class="btn-link" id="f-borrar">Borrar firma</button></div>' +
      '<label class="check"><input type="checkbox" id="f-l">Leí el convenio completo, sus cláusulas y el Anexo 1 (Política de Uso de Imagen), y los acepto en nombre de ' + esc(S.D.curso.cliente) + '.</label>' +
      '<label class="campo" style="max-width:320px"><span>Su contraseña del portal</span><input id="f-k" type="password" autocomplete="current-password"><small>Confirma que es usted quien firma.</small></label>' +
      '<p class="form-error" id="f-err" hidden></p><button class="btn btn-oro btn-grande" id="f-ok" type="button">Firmar convenio</button></div></div>';
    $('#cl-ppto').innerHTML = h;
    if (K.puede_firmar) lienzoFirma();
  }
  function lienzoFirma() {
    var cv = $('#f-lienzo'), cx = cv.getContext('2d'), dib = false, hay = false, ult = null;
    cx.lineWidth = 2.4; cx.lineCap = 'round'; cx.strokeStyle = '#13213C';
    function pos(e) { var r = cv.getBoundingClientRect(), p = e.touches ? e.touches[0] : e; return { x: (p.clientX - r.left) * cv.width / r.width, y: (p.clientY - r.top) * cv.height / r.height }; }
    function ini(e) { e.preventDefault(); dib = true; ult = pos(e); }
    function mov(e) { if (!dib) return; e.preventDefault(); var p = pos(e); cx.beginPath(); cx.moveTo(ult.x, ult.y); cx.lineTo(p.x, p.y); cx.stroke(); ult = p; hay = true; }
    function fin() { dib = false; }
    cv.addEventListener('mousedown', ini); cv.addEventListener('mousemove', mov); window.addEventListener('mouseup', fin);
    cv.addEventListener('touchstart', ini, { passive: false }); cv.addEventListener('touchmove', mov, { passive: false }); cv.addEventListener('touchend', fin);
    $('#f-borrar').onclick = function () { cx.clearRect(0, 0, cv.width, cv.height); hay = false; };
    $('#f-ok').onclick = function () {
      var er = $('#f-err'); er.hidden = true;
      var falla2 = function (m) { er.textContent = m; er.hidden = false; };
      if (!hay) return falla2('Dibuje su firma en el recuadro.');
      if (!$('#f-l').checked) return falla2('Confirme que leyó y acepta el contrato.');
      var b = this; b.disabled = true;
      api('firmar', { firma_id: S.D.contrato.id, nombre: $('#f-n').value, cargo: $('#f-c').value, tipo_doc: $('#f-t').value, documento: $('#f-d').value, leido: 1, clave: $('#f-k').value, firma: cv.toDataURL('image/png') })
        .then(function () { toast('<b>Convenio firmado.</b> Le avisaremos cuando CLEMI lo firme.'); recargarPpto(); }, function (e) { b.disabled = false; falla2(e.error); });
    };
  }
  function guardar(auto) {
    clearTimeout(S.guardando);
    if (!S.editor || !S.D.acceso.editable || S.version != null) return Promise.resolve();
    return api('borrador', { items: S.editor.valor() }).then(function (j) {
      S.cambios = false; S.D.borrador = S.editor.valor(); S.D.borrador_en = j.en;
      var g = $('#cl-guardado'); if (g) g.textContent = 'Borrador guardado ' + momento(j.en) + (auto ? ' (automático)' : '') + '. Aún no se ha enviado a CLEMI.';
      if (!auto) toast('Borrador guardado. Cuando esté lista, use <b>Enviar a CLEMI</b>.');
    }, function (e) { if (!auto) falla(e); });
  }
  function enviar() {
    var it = S.editor.valor();
    if (!it.length) return toast('La sala está vacía. Ubique al menos un elemento.', 'error');
    var r = Plano.resumen(it, S.D.catalogo);
    var m = modal('Enviar la planificación a CLEMI',
      '<p style="margin:0">Se enviará esta distribución a nombre de <b>' + esc(S.D.curso.cliente) + '</b>, registrada por <b>' + esc(S.D.nombre) + '</b>:</p>' +
      '<div class="pl-resumen">' + r.map(function (x) { return '<span class="pl-tag"><i style="background:' + esc(x.color || '#999') + '"></i>' + x.n + ' × ' + esc(x.nombre) + '</span>'; }).join('') + '</div>' +
      '<label class="campo"><span>Comentarios para CLEMI (opcional)</span><textarea id="x-notas" maxlength="2000" placeholder="Ej. Necesitamos la estación 1 cerca de la pantalla principal"></textarea></label>' +
      '<p class="meta" style="margin:0">Después de enviarla, cualquier cambio se solicita y lo aprueba CLEMI. Los cambios se pueden pedir hasta el ' + esc(fLarga(S.D.acceso.cambios_hasta)) + '.</p>',
      '<button class="btn" data-cerrar type="button">Seguir editando</button><button class="btn btn-oro" id="x-ok" type="button">Enviar planificación</button>');
    $('#x-ok', m.el).onclick = function () {
      var b = this; b.disabled = true; clearTimeout(S.guardando);
      api('enviar', { items: it, notas: $('#x-notas', m.el).value }).then(function (j) { m.cerrar(); S.cambios = false; toast('<b>Planificación enviada</b> (versión ' + j.version + '). Gracias, el equipo de CLEMI la revisará.'); cargar(); }, function (x) { b.disabled = false; errorEn(m, x.error); });
    };
  }
  function solicitar() {
    var m = modal('Solicitar un cambio',
      '<p style="margin:0">Cuéntenos qué desea cambiar. Cuando CLEMI lo apruebe podrá modificar la sala aquí mismo hasta el <b>' + esc(fLarga(S.D.acceso.cambios_hasta)) + '</b>.</p>' +
      '<label class="campo"><span>¿Qué desea cambiar?</span><textarea id="x-mot" maxlength="1000" placeholder="Ej. Agregar dos estaciones más y mover la mesa de instructores al fondo"></textarea></label>',
      '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="x-ok" type="button">Enviar solicitud</button>');
    $('#x-ok', m.el).onclick = function () {
      var b = this; b.disabled = true;
      api('solicitar', { motivo: $('#x-mot', m.el).value }).then(function () { m.cerrar(); toast('Solicitud enviada. Le avisaremos cuando pueda hacer el cambio.'); cargar(); }, function (x) { b.disabled = false; errorEn(m, x.error); });
    };
  }
  window.addEventListener('beforeunload', function (e) { if (S.cambios) { guardar(true); e.preventDefault(); e.returnValue = ''; } });
  // Si el plazo vence con la página abierta, recargar los datos (el servidor decide).
  setInterval(function () { var f = document.activeElement; if (S.D && !document.hidden && !S.cambios && S.version == null && !$('.modal-fondo') && !(f && /INPUT|TEXTAREA|SELECT/.test(f.tagName))) cargar(); }, 120000);
  inicio();
})();
