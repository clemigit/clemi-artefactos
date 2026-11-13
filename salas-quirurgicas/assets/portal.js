/* =====================================================================
   CLEMI · Portal de clientes: ingreso con usuario y contraseña de la
   empresa, mis solicitudes y nueva solicitud de presupuesto.
   ===================================================================== */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  function dISO(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fCorta(s) { if (!s) return ''; var d = dISO(s); return d.getDate() + ' ' + MESES[d.getMonth()].slice(0, 3) + ' ' + d.getFullYear(); }
  function pesos(n) { return '$ ' + Math.round(+n || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function sumarDias(s, n) { var d = dISO(s); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  var S = { csrf: '', D: null };
  function api(a, data) {
    var init = { credentials: 'same-origin', headers: {} };
    if (data !== undefined) { init.method = 'POST'; init.headers['Content-Type'] = 'application/json'; init.headers['X-CSRF'] = S.csrf; init.body = JSON.stringify(data); }
    return fetch('portal-api.php?a=' + a, init).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: 'Respuesta inesperada del servidor.' }; }).then(function (j) { j.status = r.status; if (!j.ok) throw j; return j; });
    }, function () { throw { ok: false, error: 'No hay conexión. Revise su internet e intente de nuevo.' }; });
  }
  function toast(html, tipo) {
    var t = document.createElement('div'); t.className = 'toast' + (tipo === 'error' ? ' error' : ''); t.innerHTML = html;
    $('#toasts').appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, 4500);
    setTimeout(function () { t.remove(); }, 5000);
  }
  function falla(e) { if (e && e.login) { location.reload(); return; } toast(esc((e && e.error) || 'Ocurrió un error.'), 'error'); }
  function modal(titulo, cuerpo, pie) {
    var f = document.createElement('div'); f.className = 'modal-fondo';
    f.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(titulo) + '"><div class="modal-cab"><h2>' + esc(titulo) + '</h2><button type="button" class="modal-x" aria-label="Cerrar">×</button></div>' +
      '<div class="modal-cuerpo">' + cuerpo + '</div>' + (pie ? '<div class="modal-pie">' + pie + '</div>' : '') + '</div>';
    $('#modal-raiz').appendChild(f);
    var cerrar = function () { f.remove(); };
    $('.modal-x', f).onclick = cerrar;
    $$('[data-cerrar]', f).forEach(function (b) { b.onclick = cerrar; });
    var p = $('input,textarea,select', f); if (p) setTimeout(function () { p.focus(); }, 30);
    return { el: f, cerrar: cerrar };
  }
  function errorEn(m, msg) {
    var p = $('.form-error', m.el);
    if (!p) { p = document.createElement('p'); p.className = 'form-error'; p.setAttribute('role', 'alert'); $('.modal-cuerpo', m.el).prepend(p); }
    p.textContent = msg;
  }

  // ------------------------------------------------------------ ingreso
  function inicio() {
    api('estado').then(function (j) {
      if (!j.dentro) return entrada();
      S.csrf = j.csrf; $('#cl-cliente').textContent = j.usuario.empresa; botonSalir();
      if (j.usuario.debe_cambiar) cambiarClave(true); else cargar();
    }, function (e) { $('#cl-main').innerHTML = '<div class="cl-cerrado panel"><h1>Portal no disponible</h1><p>' + esc(e.error) + '</p></div>'; });
  }
  function botonSalir() {
    var b = $('#cl-salir'); b.hidden = false; b.textContent = 'Salir';
    b.onclick = function () { api('salir', {}).then(function () { location.reload(); }, function () { location.reload(); }); };
  }
  function entrada() {
    $('#cl-main').innerHTML = '<form class="cl-entrada panel" id="pt-form" autocomplete="on" novalidate>' +
      '<img src="assets/logo.png" alt="CLEMI" class="cl-entrada-logo"><div class="eyebrow">Portal de clientes</div><h1>Solicite su presupuesto y contrate su curso</h1>' +
      '<p>Ingrese con el usuario y la contraseña que le entregó el área de Operaciones · Contratación de CLEMI.</p>' +
      '<label class="campo"><span>Usuario</span><input id="pt-u" required maxlength="120" autocomplete="username" autocapitalize="none"></label>' +
      '<label class="campo"><span>Contraseña</span><input id="pt-k" type="password" required maxlength="200" autocomplete="current-password"></label>' +
      '<p class="form-error" id="pt-err" hidden></p><button class="btn btn-oro btn-grande" type="submit">Entrar</button>' +
      '<p class="meta">¿Olvidó su contraseña? Escríbale a su asesor de CLEMI para que se la restablezca.</p></form>';
    $('#pt-form').onsubmit = function (e) {
      e.preventDefault(); var b = $('button', this); b.disabled = true; $('#pt-err').hidden = true;
      api('entrar', { usuario: $('#pt-u').value, clave: $('#pt-k').value }).then(function () { inicio(); }, function (x) { $('#pt-err').textContent = x.error; $('#pt-err').hidden = false; b.disabled = false; });
    };
  }
  function cambiarClave(obligatorio) {
    var html = '<form class="cl-entrada panel" id="pt-cc" novalidate><div class="eyebrow">Seguridad</div><h1>' + (obligatorio ? 'Cree su contraseña personal' : 'Cambiar contraseña') + '</h1>' +
      (obligatorio ? '<p>Es su primer ingreso. Cambie la contraseña inicial por una que solo usted conozca (mínimo 8 caracteres).</p>' : '') +
      '<label class="campo"><span>Contraseña actual</span><input id="pt-a" type="password" autocomplete="current-password" required></label>' +
      '<label class="campo"><span>Nueva contraseña</span><input id="pt-n" type="password" autocomplete="new-password" minlength="8" required></label>' +
      '<label class="campo"><span>Repita la nueva contraseña</span><input id="pt-r" type="password" autocomplete="new-password" required></label>' +
      '<p class="form-error" id="pt-err" hidden></p><button class="btn btn-oro btn-grande" type="submit">Guardar contraseña</button>' +
      (obligatorio ? '' : '<button type="button" class="btn" id="pt-vol">Volver</button>') + '</form>';
    $('#cl-main').innerHTML = html;
    if (!obligatorio) $('#pt-vol').onclick = cargar;
    $('#pt-cc').onsubmit = function (e) {
      e.preventDefault(); var err = $('#pt-err');
      if ($('#pt-n').value !== $('#pt-r').value) { err.textContent = 'Las dos contraseñas nuevas no coinciden.'; err.hidden = false; return; }
      var b = $('button[type=submit]', this); b.disabled = true;
      api('cambiar_clave', { actual: $('#pt-a').value, nueva: $('#pt-n').value }).then(function () { toast('Contraseña actualizada.'); cargar(); }, function (x) { err.textContent = x.error; err.hidden = false; b.disabled = false; });
    };
  }

  // ------------------------------------------------------------ mis solicitudes
  function cargar() {
    return api('inicio').then(function (j) { S.D = j; pintar(); }, falla);
  }
  // Los tres pasos del proceso: presupuesto → contratación → preparación.
  function pasos(s) {
    var P = { seleccion: ['Elija lo que necesita y arme la sala', 'accion'], sin_presupuesto: ['Elija lo que necesita y arme la sala', 'accion'], solicitado: ['En revisión del área de Presupuesto', 'espera'],
      emitido: ['Su presupuesto está listo: revíselo', 'accion'], ajustes: ['Ajustes enviados a Presupuesto', 'espera'], aceptado: ['Presupuesto aceptado', 'hecho'] };
    var p1 = P[s.ppto_estado] || P.seleccion, p2, p3;
    if (s.estado === 'Cancelado') return [['Solicitud cancelada', 'no'], ['—', ''], ['—', '']];
    if (s.firma === 'Firmado') p2 = ['Convenio firmado', 'hecho'];
    else if (s.firma === 'Por firmar el cliente') p2 = ['Lea y firme el convenio', 'accion'];
    else if (s.firma === 'Por firmar CLEMI') p2 = ['Firmado por usted · falta la firma de CLEMI', 'espera'];
    else p2 = s.ppto_estado === 'aceptado' ? ['CLEMI está preparando el convenio', 'espera'] : ['Después del presupuesto', ''];
    if (s.estado === 'Finalizado') p3 = ['Curso realizado', 'hecho'];
    else if (s.firma === 'Firmado' || s.estado === 'Contratado') p3 = ['CLEMI prepara su sala y lo solicitado', 'espera'];
    else p3 = ['Cuando el convenio esté firmado', ''];
    return [p1, p2, p3];
  }
  function pintar() {
    var D = S.D, E = D.empresa;
    var sols = D.solicitudes.map(function (s) {
      var ps = pasos(s), accion = ps.some(function (p) { return p[1] === 'accion'; });
      return '<article class="pt-sol panel' + (accion ? ' pt-accion' : '') + '">' +
        '<div class="pt-sol-cab"><div><div class="eyebrow">' + esc(s.codigo) + (s.sala ? ' · ' + esc(s.sala) : '') + '</div><h3>' + esc(s.curso) + '</h3>' +
        '<div class="meta">' + fCorta(s.fecha_inicio) + (s.fecha_fin !== s.fecha_inicio ? ' a ' + fCorta(s.fecha_fin) : '') + (s.participantes ? ' · ' + s.participantes + ' participantes' : '') +
        (s.total != null ? ' · Presupuesto ' + pesos(s.total) : (s.n_lineas ? ' · ' + s.n_lineas + ' ítems elegidos' : '')) +
        (s.cotiz && s.cotiz.limite && !s.cotiz.enviado ? ' · <b style="color:' + (s.cotiz.vencido ? '#A93A32' : '#13466B') + '">' + (s.cotiz.vencido ? 'Venció el plazo del pedido' : 'Pedido hasta el ' + esc(s.cotiz.limite.split('-').reverse().join('/'))) + '</b>' : '') + '</div></div>' +
        '<a class="btn ' + (accion ? 'btn-oro' : '') + '" href="cliente.html?c=' + s.id + '">' + (accion ? 'Continuar' : 'Abrir') + '</a></div>' +
        '<ol class="pt-pasos">' + ['Presupuesto', 'Contratación', 'Preparación'].map(function (n, i) {
          return '<li class="' + ps[i][1] + '"><b><span>' + (i + 1) + '</span>' + n + '</b><small>' + esc(ps[i][0]) + '</small></li>';
        }).join('') + '</ol></article>';
    }).join('');
    var faltan = !E.nit || !E.rep_legal || !E.rep_doc || !E.direccion;
    $('#cl-main').innerHTML =
      '<section class="cl-curso"><div><div class="eyebrow">Bienvenido(a), ' + esc(D.usuario.nombre) + '</div><h1>' + esc(E.razon) + '</h1>' +
      '<div class="cl-datos">' + (E.nit ? '<span>NIT <b>' + esc(E.nit) + '</b></span>' : '') + (E.rep_legal ? '<span>Rep. legal <b>' + esc(E.rep_legal) + '</b></span>' : '') + '</div></div>' +
      '<div class="cl-estado"><button class="btn btn-oro btn-grande" id="pt-nueva">+ Nueva solicitud de presupuesto</button>' +
      '<div class="pt-mini"><button class="btn btn-sm cl-salir" id="pt-emp">Datos de la empresa</button><button class="btn btn-sm cl-salir" id="pt-clave">Cambiar contraseña</button></div></div></section>' +
      (faltan ? '<div class="cl-aviso">Complete los <b>datos de la empresa</b> (NIT, representante legal, documento y dirección): con ellos CLEMI elabora el contrato. <button class="btn btn-sm" id="pt-emp2">Completar ahora</button></div>' : '') +
      '<section class="pt-como panel"><h2>Cómo funciona</h2><ol><li><b>Presupuesto.</b> Abra una solicitud, elija como en un carrito lo que necesita (audiovisuales, morgue, instrumentación, biomédica: equipos médicos e insumos) y arme la sala. Al enviarla le llega al área de Presupuesto, que le responde con los valores.</li>' +
      '<li><b>Contratación.</b> Con el presupuesto aceptado, CLEMI le envía el convenio para leer sus cláusulas y firmarlo electrónicamente aquí mismo.</li>' +
      '<li><b>Preparación.</b> Con el convenio firmado por las dos partes, almacén, instrumentación, morgue y audiovisuales preparan lo solicitado y la sala como la armó.</li></ol></section>' +
      '<h2 class="pt-tit">Mis solicitudes</h2>' + (sols || '<div class="vacio panel">Aún no tiene solicitudes. Empiece con <b>+ Nueva solicitud de presupuesto</b>.</div>');
    $('#pt-nueva').onclick = nuevaSolicitud;
    $('#pt-emp').onclick = empresa; if ($('#pt-emp2')) $('#pt-emp2').onclick = empresa;
    $('#pt-clave').onclick = function () { cambiarClave(false); };
  }

  function empresa() {
    var E = S.D.empresa, c = function (k, l, max, extra) { return '<label class="campo"><span>' + l + '</span><input id="em-' + k + '" maxlength="' + max + '" value="' + esc(E[k] || '') + '"' + (extra || '') + '></label>'; };
    var td = ['cédula de ciudadanía', 'cédula de extranjería', 'pasaporte'];
    var m = modal('Datos de la empresa', '<p class="meta">Estos datos van en el contrato. Revíselos con cuidado.</p><div class="form-grid">' +
      c('razon', 'Razón social', 200) + c('nit', 'NIT', 40) + c('sigla', 'Sigla', 40) + c('tipo_entidad', 'Tipo de entidad', 120, ' placeholder="entidad de derecho privado"') +
      c('domicilio', 'Domicilio (ciudad)', 160) + c('direccion', 'Dirección', 200) + c('rep_legal', 'Representante legal', 160) +
      '<label class="campo"><span>Tipo de documento</span><select id="em-rep_tipo_doc">' + td.map(function (t) { return '<option' + (E.rep_tipo_doc === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label>' +
      c('rep_doc', 'Número de documento', 40) + c('correo_factura', 'Correo para la factura', 160, ' type="email"') + c('telefono', 'Teléfono', 40) + '</div>',
      '<button class="btn" data-cerrar>Cancelar</button><button class="btn btn-oro" id="em-ok">Guardar</button>');
    $('#em-ok', m.el).onclick = function () {
      var d = {}; ['razon', 'nit', 'sigla', 'tipo_entidad', 'domicilio', 'direccion', 'rep_legal', 'rep_tipo_doc', 'rep_doc', 'correo_factura', 'telefono'].forEach(function (k) { d[k] = $('#em-' + k, m.el).value; });
      api('empresa_guardar', d).then(function () { m.cerrar(); toast('Datos guardados.'); $('#cl-cliente').textContent = d.razon; cargar(); }, function (e) { errorEn(m, e.error); });
    };
  }

  function nuevaSolicitud() {
    var D = S.D, min = sumarDias(D.hoy, 4);
    var m = modal('Nueva solicitud de presupuesto',
      '<p class="meta">Cuéntenos del curso. Al crearla, la fecha queda reservada en la agenda de CLEMI (máximo 2 eventos por fecha) y tiene <b>3 días hábiles</b> para elegir lo que necesita, adjuntar el programa y el listado de personas, y finalizar su pedido. Las solicitudes se reciben con al menos 4 días de anticipación.</p><div class="form-grid">' +
      '<label class="campo ancho"><span>Nombre del curso</span><input id="ns-curso" maxlength="200" required></label>' +
      '<label class="campo ancho"><span>Nombre del convenio (opcional)</span><input id="ns-conv" maxlength="200" placeholder="Si lo deja vacío: Convenio + empresa + curso"></label>' +
      '<label class="campo"><span>Especialidad</span><input id="ns-esp" maxlength="120"></label>' +
      '<label class="campo"><span>Sala</span><select id="ns-sala">' + D.salas.map(function (s) { return '<option value="' + s.id + '">' + esc(s.nombre) + (s.ancho ? ' · ' + s.ancho + ' × ' + s.largo + ' m' : '') + '</option>'; }).join('') + '</select></label>' +
      '<label class="campo"><span>Fecha de inicio</span><input id="ns-fi" type="date" min="' + min + '" value="' + min + '"></label>' +
      '<label class="campo"><span>Fecha final</span><input id="ns-ff" type="date" min="' + min + '" value="' + min + '"></label>' +
      '<label class="campo"><span>Hora de inicio</span><input id="ns-hi" type="time" value="07:00"></label>' +
      '<label class="campo"><span>Hora final</span><input id="ns-hf" type="time" value="17:00"></label>' +
      '<label class="campo"><span>Participantes</span><input id="ns-par" type="number" min="0" value="0"></label>' +
      '<label class="campo"><span>Estaciones de trabajo</span><input id="ns-est" type="number" min="0" value="0"></label>' +
      '<label class="campo"><span>Componentes anatómicos</span><input id="ns-comp" type="number" min="0" value="0"></label>' +
      '<label class="campo"><span>Tipo de componente</span><input id="ns-tcomp" maxlength="120" placeholder="Ej.: cadáver completo, columna, rodilla…"></label>' +
      '<label class="campo ancho"><span>Observaciones</span><textarea id="ns-obs" rows="3" maxlength="2000"></textarea></label>' +
      '<label class="campo ancho"><span>Programa o agenda del entrenamiento (obligatorio)</span><input id="ns-prog" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png" required><small>Temas, horarios, procedimientos y docentes. PDF, Word, Excel, PowerPoint o imagen · máx. 20 MB.</small></label></div>',
      '<button class="btn" data-cerrar>Cancelar</button><button class="btn btn-oro" id="ns-ok">Crear y elegir lo que necesito →</button>');
    $('#ns-fi', m.el).onchange = function () { var f = $('#ns-ff', m.el); if (f.value < this.value) f.value = this.value; f.min = this.value; };
    $('#ns-ok', m.el).onclick = function () {
      var b = this, pf = $('#ns-prog', m.el).files[0];
      if (!pf) return errorEn(m, 'Adjunte el programa o agenda del entrenamiento: es obligatorio.');
      if (pf.size > 20 * 1048576) return errorEn(m, 'El programa supera 20 MB.');
      b.disabled = true;
      api('solicitud_nueva', { nombre_convenio: $('#ns-conv', m.el).value, curso: $('#ns-curso', m.el).value, especialidad: $('#ns-esp', m.el).value, sala_id: $('#ns-sala', m.el).value, fecha_inicio: $('#ns-fi', m.el).value, fecha_fin: $('#ns-ff', m.el).value,
        hora_ini: $('#ns-hi', m.el).value, hora_fin: $('#ns-hf', m.el).value, participantes: $('#ns-par', m.el).value, estaciones: $('#ns-est', m.el).value, componentes: $('#ns-comp', m.el).value,
        tipo_componente: $('#ns-tcomp', m.el).value, observaciones: $('#ns-obs', m.el).value
      }).then(function (j) {
        if (j.ocupada) alert('La sala ya tiene otra reserva en esas fechas. Puede seguir: CLEMI le confirmará la sala o le propondrá otra.');
        var fd = new FormData(); fd.append('archivo', pf);
        var ir = function () { location.href = 'cliente.html?c=' + j.id; };
        fetch('cliente-api.php?a=programa_subir&c=' + j.id, { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF': S.csrf }, body: fd }).then(function (r) { return r.json(); }).then(function (k) {
          if (!k.ok) alert('La solicitud se creó, pero el programa no se pudo adjuntar (' + k.error + '). Adjúntelo en la solicitud antes de enviarla.');
          ir();
        }, function () { alert('La solicitud se creó, pero el programa no se pudo adjuntar. Adjúntelo en la solicitud antes de enviarla.'); ir(); });
      }, function (e) { errorEn(m, e.error); b.disabled = false; });
    };
  }

  inicio();
})();
