/* =====================================================================
   CLEMI · Salas de Entrenamiento Quirúrgico — aplicación
   ===================================================================== */
(function () {
  'use strict';

  // ------------------------------------------------------------ utilidades
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var DIAS_C = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MESES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function hoy() { return iso(new Date()); }
  function dISO(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function sumar(s, n) { var d = dISO(s); d.setDate(d.getDate() + n); return iso(d); }
  function fCorta(s) { var d = dISO(s); return DIAS_C[d.getDay()] + ' ' + d.getDate() + ' ' + MESES_C[d.getMonth()]; }
  function fLarga(s) { var d = dISO(s); return DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear(); }
  function momento(m) {
    if (!m) return '';
    var f = m.slice(0, 10), h = m.slice(11, 16);
    if (f === hoy()) return 'Hoy · ' + h;
    if (f === sumar(hoy(), -1)) return 'Ayer · ' + h;
    var d = dISO(f); return d.getDate() + ' ' + MESES_C[d.getMonth()] + ' · ' + h;
  }
  function iniciales(n) { return String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase(); }
  var ESTADOS = { programado: 'Programado', en_curso: 'En curso', cerrado: 'Cerrado y firmado', cancelado: 'Cancelado' };
  function chipEstado(e) { return '<span class="chip st-' + e + '">' + ESTADOS[e] + '</span>'; }

  // ------------------------------------------------------------ estado
  var S = { yo: null, csrf: '', base: null, tick: 0, vista: null, dirty: false, pendiente: false, semana: null, poll: null };
  function usuario(id) { return (S.base.usuarios || []).find(function (u) { return +u.id === +id; }) || { nombre: '—' }; }
  function sala(id) { return (S.base.salas || []).find(function (s) { return +s.id === +id; }) || { nombre: '—', ancho: 1000, largo: 1000, plano: [] }; }
  function esAdmin() { return S.yo && S.yo.rol === 'admin'; }
  function esTana() { return S.yo && S.yo.rol === 'tanatologo'; }
  var CARGOS = { admin: 'Administración', instrumentador: 'Instrumentación quirúrgica', tanatologo: 'Tanatología', comercial: 'Negociación del evento', audiovisual: 'Audiovisuales', almacen: 'Almacén · Presupuesto', firma: 'Representante legal · Firma de convenios', talento: 'Talento Humano', administrativo: 'Administrativo', biomedica: 'Biomédica' };
  function cargo(id) { var u = usuario(id); return CARGOS[u.rol] || ''; }
  function cargoNombre(n) { var u = (S.base.usuarios || []).find(function (x) { return x.nombre === n; }); return u ? CARGOS[u.rol] : ''; }

  // ------------------------------------------------------------ API
  function api(a, data) {
    var init = { credentials: 'same-origin', headers: {} };
    if (data !== undefined) {
      init.method = 'POST';
      init.headers['Content-Type'] = 'application/json';
      init.headers['X-CSRF'] = S.csrf;
      init.body = JSON.stringify(data);
    }
    return fetch('api.php?a=' + a, init).then(function (r) {
      return r.json().catch(function () { return { ok: false, error: 'Respuesta inesperada del servidor (' + r.status + ').' }; }).then(function (j) {
        j.status = r.status;
        if (r.status === 401 && a !== 'login') { mostrarLogin(); }
        if (!j.ok) throw j;
        return j;
      });
    }, function () { throw { ok: false, error: 'No hay conexión con el servidor. Revise la conexión a internet.' }; });
  }

  // ------------------------------------------------------------ avisos
  function toast(html, tipo) {
    var t = document.createElement('div');
    t.className = 'toast' + (tipo === 'error' ? ' error' : '');
    t.innerHTML = html;
    $('#toasts').appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, tipo === 'error' ? 6000 : 4200);
    setTimeout(function () { t.remove(); }, tipo === 'error' ? 6500 : 4700);
  }
  function falla(e) { toast(esc((e && e.error) || 'Ocurrió un error.'), 'error'); }

  function modal(titulo, cuerpo, pie, opts) {
    opts = opts || {};
    var f = document.createElement('div');
    f.className = 'modal-fondo';
    f.innerHTML = '<div class="modal' + (opts.ancho ? ' ancho' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(titulo) + '">' +
      '<div class="modal-cab"><h2>' + esc(titulo) + '</h2>' + (opts.fijo ? '' : '<button type="button" class="modal-x" aria-label="Cerrar">×</button>') + '</div>' +
      '<div class="modal-cuerpo">' + cuerpo + '</div>' + (pie ? '<div class="modal-pie">' + pie + '</div>' : '') + '</div>';
    $('#modal-raiz').appendChild(f);
    var cerrar = function () { f.remove(); if (opts.alCerrar) opts.alCerrar(); };
    if (!opts.fijo) {
      $('.modal-x', f).addEventListener('click', cerrar);
      f.addEventListener('mousedown', function (e) { if (e.target === f) cerrar(); });
    }
    $$('[data-cerrar]', f).forEach(function (b) { b.addEventListener('click', cerrar); });
    var primero = $('input:not([type=hidden]),select,textarea', f);
    if (primero && !opts.sinFoco) setTimeout(function () { primero.focus(); }, 30);
    return { el: f, cerrar: cerrar };
  }
  function errorEn(m, msg) {
    var p = $('.form-error', m.el);
    if (!p) { p = document.createElement('p'); p.className = 'form-error'; p.setAttribute('role', 'alert'); $('.modal-cuerpo', m.el).prepend(p); }
    p.textContent = msg; p.hidden = false; p.scrollIntoView({ block: 'nearest' });
  }
  function visor(src) {
    var v = document.createElement('div'); v.className = 'visor';
    v.innerHTML = '<img src="' + esc(src) + '" alt="">';
    v.addEventListener('click', function () { v.remove(); });
    document.body.appendChild(v);
  }
  document.addEventListener('click', function (e) {
    var z = e.target.closest('[data-zoom]');
    if (z) visor(z.getAttribute('data-zoom') || z.src);
  });
  function archivo(f) { if (window.CLEMI_DEMO) return window.CLEMI_DEMO.archivo(f); return f ? 'api.php?a=archivo&f=' + encodeURIComponent(f) : ''; }

  // ------------------------------------------------------------ firmas y fotos
  function Firma(host) {
    host.innerHTML = '<div class="firma-caja"><canvas></canvas><div class="linea"></div><span class="hint">Firme aquí con el dedo, lápiz o mouse</span>' +
      '<button type="button" class="btn btn-sm limpiar">Borrar</button></div>';
    var c = $('canvas', host), ctx = c.getContext('2d'), self = this, dib = false, ult = null;
    this.vacia = true;
    function ajustar() {
      var r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      if (!r.width) return;
      c.width = r.width * dpr; c.height = r.height * dpr;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#10291c'; ctx.lineWidth = 2.4 * dpr;
    }
    setTimeout(ajustar, 0);
    function p(e) { var r = c.getBoundingClientRect(), dpr = c.width / r.width; return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr }; }
    c.addEventListener('pointerdown', function (e) {
      if (!c.width || c.width < 10) ajustar();
      dib = true; ult = p(e); c.setPointerCapture(e.pointerId);
      ctx.beginPath(); ctx.arc(ult.x, ult.y, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fillStyle = '#10291c'; ctx.fill();
      self.vacia = false; host.querySelector('.hint').hidden = true;
    });
    c.addEventListener('pointermove', function (e) {
      if (!dib) return;
      var q = p(e), mx = (ult.x + q.x) / 2, my = (ult.y + q.y) / 2;
      ctx.beginPath(); ctx.moveTo(ult.x, ult.y); ctx.quadraticCurveTo(ult.x, ult.y, mx, my); ctx.lineTo(q.x, q.y); ctx.stroke();
      ult = q;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { c.addEventListener(ev, function () { dib = false; }); });
    $('.limpiar', host).addEventListener('click', function () { ctx.clearRect(0, 0, c.width, c.height); self.vacia = true; host.querySelector('.hint').hidden = false; });
    this.valor = function () {
      if (self.vacia) return null;
      // recortar al trazo para que la firma ocupe su espacio en el informe
      var d = ctx.getImageData(0, 0, c.width, c.height).data, x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
      for (var y = 0; y < c.height; y += 2) for (var x = 0; x < c.width; x += 2) {
        if (d[(y * c.width + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 <= x0) return null;
      var m = 12, o = document.createElement('canvas');
      o.width = x1 - x0 + m * 2; o.height = y1 - y0 + m * 2;
      o.getContext('2d').drawImage(c, x0 - m, y0 - m, o.width, o.height, 0, 0, o.width, o.height);
      return o.toDataURL('image/png');
    };
  }
  function reducir(file, max, q) {
    max = max || 1600; q = q || 0.82;
    return new Promise(function (ok, mal) {
      if (!/^image\//.test(file.type)) return mal({ error: 'El archivo «' + file.name + '» no es una imagen.' });
      var rd = new FileReader();
      rd.onerror = function () { mal({ error: 'No se pudo leer la imagen.' }); };
      rd.onload = function () {
        var img = new Image();
        img.onerror = function () { mal({ error: 'Formato de imagen no compatible (use JPG o PNG).' }); };
        img.onload = function () {
          var k = Math.min(1, max / Math.max(img.width, img.height)), cv = document.createElement('canvas');
          cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
          var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
          cx.drawImage(img, 0, 0, cv.width, cv.height);
          ok(cv.toDataURL('image/jpeg', q));
        };
        img.src = rd.result;
      };
      rd.readAsDataURL(file);
    });
  }
  function selectorFotos(host, lista, max) {
    function pintar() {
      host.innerHTML = '<div class="fotos">' + lista.map(function (f, i) {
        return '<figure><img src="' + f + '" alt="Foto ' + (i + 1) + '" data-zoom><button type="button" class="quitar" data-q="' + i + '" aria-label="Quitar foto">×</button></figure>';
      }).join('') + '</div>' +
        (lista.length < max ? '<label class="subir" style="margin-top:10px"><input type="file" accept="image/*" multiple capture="environment">📷 Tomar o adjuntar fotos (' + lista.length + '/' + max + ')</label>' : '');
      $$('[data-q]', host).forEach(function (b) { b.addEventListener('click', function () { lista.splice(+b.getAttribute('data-q'), 1); pintar(); }); });
      var inp = $('input[type=file]', host);
      if (inp) inp.addEventListener('change', function () {
        var fs = Array.prototype.slice.call(inp.files, 0, max - lista.length);
        Promise.all(fs.map(function (f) { return reducir(f); })).then(function (rs) { rs.forEach(function (r) { lista.push(r); }); S.dirty = true; pintar(); }, falla);
      });
    }
    pintar();
  }

  // ------------------------------------------------------------ sesión
  function mostrarLogin() {
    clearInterval(S.poll); S.yo = null;
    $('#app').hidden = true; $('#login').hidden = false;
    $$('.modal-fondo').forEach(function (m) { m.remove(); });
    setTimeout(function () { $('#l-usuario').focus(); }, 50);
  }
  $('#form-login').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('#l-error'); err.hidden = true;
    var btn = $('button[type=submit]', this); btn.disabled = true;
    api('login', { usuario: $('#l-usuario').value, clave: $('#l-clave').value }).then(function (j) {
      S.csrf = j.csrf; $('#l-clave').value = ''; iniciar();
    }, function (j) { err.textContent = j.error; err.hidden = false; }).then(function () { btn.disabled = false; });
  });

  function iniciar() {
    return api('yo').then(function (j) {
      S.yo = j.usuario; S.csrf = j.csrf; pintarEnsayo(j.ensayo);
      return cargarBase();
    }).then(function () {
      $('#login').hidden = true; $('#app').hidden = false;
      $('#u-nombre').textContent = S.yo.nombre;
      $('#u-avatar').textContent = iniciales(S.yo.nombre);
      $('#u-rol').textContent = esAdmin() ? 'Administradora' : CARGOS[S.yo.rol];
      $('#nav-admin').hidden = !esAdmin();
      $$('[data-area-btn]').forEach(function (b) { b.hidden = areasYo().indexOf(b.getAttribute('data-area-btn')) < 0; });
      $$('.proc-etapa').forEach(function (e) { e.hidden = !$$('[data-area-btn]', e).some(function (b) { return !b.hidden; }); });
      $('.area-switch').hidden = areasYo().length < 2;
      $('#btn-area').hidden = areasYo().length < 2;
      clearInterval(S.poll); S.poll = setInterval(sondeo, 4000);
      clearInterval(S.evPoll); evCampana(); S.evPoll = setInterval(evCampana, 60000);
      if (!S.escuchando && window.Ingreso && areasYo().indexOf('op') >= 0 && !esTana()) { S.escuchando = true; window.Ingreso.escuchar(lecturaEscaner); }
      if (+S.yo.debe_cambiar) modalClave(true);
      try { S.area = localStorage.getItem('clemi_area') || ''; } catch (e) {}
      clearInterval(S.alPoll); if (puedeAD()) { admAlertas(); S.alPoll = setInterval(admAlertas, 60000); }
      // La agenda general es la portada de todos los funcionarios.
      if (!location.hash || location.hash === '#' || location.hash === '#/') location.hash = '#/agenda'; else ruta();
    }, function (e) { if (e && e.status !== 401) falla(e); mostrarLogin(); });
  }
  // Modo ensayo: aviso para todos mientras el equipo prueba el proceso en tiempo real.
  function pintarEnsayo(e) {
    var b = $('#ensayo-banda'); if (!b) return;
    var antes = !!S.ensayo; S.ensayo = e || null;
    b.hidden = !e;
    if (e) b.innerHTML = '<i></i><b>MODO ENSAYO</b><span>«' + esc(e.nombre) + '» · desde ' + esc(String(e.desde).slice(11, 16)) + ' · inició ' + esc(e.por) + '. Todo el equipo trabaja en tiempo real; lo que se cree en el ensayo se puede borrar al terminar.</span>' + (esAdmin() ? '<a class="btn btn-sm" href="#/admin/ensayo">Terminar ensayo</a>' : '');
    if (antes !== !!e && S.yo) toast(e ? '<b>Inició el modo ensayo.</b> Lo que haga ahora es de prueba.' : '<b>Terminó el modo ensayo.</b>');
  }
  function cargarBase() { return api('base').then(function (j) { S.base = j; if (!S.tick) S.tick = j.tick; }); }

  $('#btn-ev').addEventListener('click', function () { evAbrir(); });
  $('#usuario-btn').addEventListener('click', function (e) {
    e.stopPropagation(); var p = $('#usuario-pop'); p.hidden = !p.hidden; this.setAttribute('aria-expanded', String(!p.hidden));
  });
  document.addEventListener('click', function () { $('#usuario-pop').hidden = true; });
  $('#btn-salir').addEventListener('click', function () { api('logout', {}).then(mostrarLogin, mostrarLogin); });
  $('#btn-clave').addEventListener('click', function () { modalClave(false); });
  $('#btn-nuevo-evento').addEventListener('click', function () { if (S.area === 'ct') formContrato(null, function (id) { location.hash = '#/ct/contrato/' + id; }); else formEvento(null, {}); });

  function modalClave(forzado) {
    var m = modal(forzado ? 'Cree su contraseña personal' : 'Cambiar contraseña',
      (forzado ? '<p style="margin:0">Hola <b>' + esc(S.yo.nombre) + '</b>. Por seguridad, reemplace la contraseña inicial por una que solo usted conozca. Cada registro que haga quedará firmado con su nombre.</p>' : '') +
      '<label class="campo"><span>Contraseña actual</span><input type="password" id="c-actual" autocomplete="current-password"></label>' +
      '<label class="campo"><span>Nueva contraseña</span><input type="password" id="c-nueva" autocomplete="new-password"><small>Mínimo 8 caracteres.</small></label>' +
      '<label class="campo"><span>Repita la nueva contraseña</span><input type="password" id="c-nueva2" autocomplete="new-password"></label>',
      (forzado ? '<button class="btn" type="button" id="c-salir">Salir</button>' : '<button class="btn" type="button" data-cerrar>Cancelar</button>') +
      '<button class="btn btn-verde" type="button" id="c-ok">Guardar contraseña</button>', { fijo: forzado });
    if (forzado) $('#c-salir', m.el).addEventListener('click', function () { api('logout', {}).then(mostrarLogin, mostrarLogin); });
    $('#c-ok', m.el).addEventListener('click', function () {
      var n = $('#c-nueva', m.el).value;
      if (n !== $('#c-nueva2', m.el).value) return errorEn(m, 'Las dos contraseñas nuevas no coinciden.');
      api('cambiar_clave', { actual: $('#c-actual', m.el).value, nueva: n }).then(function () {
        S.yo.debe_cambiar = 0; m.cerrar(); toast('Contraseña actualizada.');
      }, function (e) { errorEn(m, e.error); });
    });
  }

  // ------------------------------------------------------------ reloj y tiempo real
  function reloj() {
    var d = new Date();
    $('#reloj').innerHTML = '<b>' + d.getDate() + ' ' + MESES_C[d.getMonth()] + '</b><span class="reloj-dia">' + DIAS[d.getDay()] + ' · </span>' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
  setInterval(reloj, 1000); reloj();

  function editando() {
    var a = document.activeElement;
    return S.dirty || !!$('.modal-fondo') || (a && $('#main').contains(a) && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && a.value);
  }
  function sondeo() {
    if (!S.yo || document.hidden) return;
    api('tick&desde=' + S.tick).then(function (j) {
      pintarEnsayo(j.ensayo);
      $('#en-vivo').classList.remove('is-off'); $('#en-vivo span').textContent = 'En línea';
      if (j.tick <= S.tick) return;
      S.tick = j.tick;
      var ajenos = (j.nuevos || []).filter(function (n) { return n.usuario_nombre !== S.yo.nombre; });
      ajenos.slice(0, 3).reverse().forEach(function (n) { toast('<b>' + esc(n.usuario_nombre) + '</b> ' + esc(n.accion.charAt(0).toLowerCase() + n.accion.slice(1))); });
      var baseCambio = (j.nuevos || []).some(function (n) { return /^(sala|catalogo|plantilla|usuario)$/.test(n.entidad); });
      (baseCambio ? cargarBase() : Promise.resolve()).then(function () {
        if (!ajenos.length && !baseCambio) return;
        if (editando()) { S.pendiente = true; $('#aviso-cambios').hidden = false; }
        else refrescar();
      });
    }, function (e) {
      if (e && e.status === 401) return;
      $('#en-vivo').classList.add('is-off'); $('#en-vivo span').textContent = 'Sin conexión';
    });
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) sondeo(); });
  $('#btn-aplicar-cambios').addEventListener('click', function () {
    if (S.dirty) {
      var m = modal('Hay cambios sin guardar', '<p style="margin:0">Si carga los cambios de los demás, perderá lo que no ha guardado en esta pantalla.</p>',
        '<button class="btn" data-cerrar type="button">Seguir editando</button><button class="btn btn-peligro" id="x-ok" type="button">Descartar y actualizar</button>');
      $('#x-ok', m.el).addEventListener('click', function () { m.cerrar(); S.dirty = false; refrescar(); });
    } else refrescar();
  });
  function refrescar() {
    S.pendiente = false; $('#aviso-cambios').hidden = true;
    if (S.vista && S.vista.refrescar) S.vista.refrescar(); else ruta();
  }
  window.addEventListener('beforeunload', function (e) { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

  // ------------------------------------------------------------ rutas
  var ultimaRuta = '';
  window.addEventListener('hashchange', function () {
    if (S.dirty && location.hash !== ultimaRuta) {
      var destino = location.hash;
      history.replaceState(null, '', ultimaRuta);
      var m = modal('Cambios sin guardar', '<p style="margin:0">Tiene cambios sin guardar en esta pantalla. ¿Qué desea hacer?</p>',
        '<button class="btn" data-cerrar type="button">Quedarme</button><button class="btn btn-peligro" id="x-salir" type="button">Salir sin guardar</button>');
      $('#x-salir', m.el).addEventListener('click', function () { S.dirty = false; m.cerrar(); location.hash = destino; });
      return;
    }
    ruta();
  });
  function ruta() {
    if (!S.yo) return;
    ultimaRuta = location.hash;
    S.dirty = false; S.pendiente = false; $('#aviso-cambios').hidden = true;
    var p = location.hash.replace(/^#\/?/, '').split('/'), v = p[0] || 'tablero';
    var AV_ = { morgue: 'mo', ct: 'ct', av: 'av', ps: 'ps', firmas: 'fi', th: 'th', adm: 'ad', lg: 'lg', bm: 'bm' }, neutra = ['bitacora', 'admin', 'areas', 'planes', 'plan', 'prep', 'agenda'].indexOf(v) >= 0;
    var areaV = AV_[v] || (neutra ? null : 'op');
    if (v === 'ps' && p[1] === 'catalogo' && areasYo().indexOf('ps') < 0 && areasYo().indexOf('ct') >= 0) areaV = 'ct';
    if (areaV && areasYo().indexOf(areaV) < 0) { location.replace('#/agenda'); return; }
    if (v === 'areas' && areasYo().length < 2) { location.replace(AREA_INICIO[areasYo()[0]]); return; }
    if (areaV) S.area = areaV;
    if (!S.area || areasYo().indexOf(S.area) < 0) S.area = areasYo()[0];
    var nb = $('#btn-nuevo-evento');
    nb.hidden = !((S.area === 'op' && (esAdmin() || S.yo.rol === 'instrumentador')) || (S.area === 'ct' && puedeCT()));
    nb.innerHTML = S.area === 'ct' ? '+ Nueva<span class="solo-ancho"> solicitud</span>' : '+ Nuevo<span class="solo-ancho"> entrenamiento</span>';
    try { localStorage.setItem('clemi_area', S.area); } catch (e) {}
    document.body.setAttribute('data-area', v === 'areas' ? 'areas' : S.area);
    $('#marca-sub').textContent = AREA_NOMBRE[S.area] || 'Salas quirúrgicas';
    $$('[data-area-btn]').forEach(function (b) { b.classList.toggle('is-on', v !== 'areas' && b.getAttribute('data-area-btn') === S.area); });
    $$('#menu a').forEach(function (a) {
      var ar = a.getAttribute('data-area'); a.hidden = (ar && ar.split(' ').indexOf(S.area) < 0) || (a.id === 'nav-admin' && !esAdmin()) || (a.id === 'nav-ingreso' && esTana());
      var n = a.getAttribute('data-nav'), sub = (v === 'morgue' || v === 'av' || v === 'ps' || v === 'ct' || v === 'th' || v === 'adm' || v === 'lg') && p[1] && p[1] !== 'contrato' && p[1] !== 'persona' && p[1] !== 'ev' ? v + '-' + p[1] : v;
      if (v === 'plan') sub = 'planes';
      a.classList.toggle('is-on', n === sub || (n === 'agenda' && v === 'evento') || (n === 'salas' && v === 'sala') || (n === 'instrumental' && v === 'entrega') ||
        (n === 'morgue-inventario' && sub === 'morgue-componente') || (n === 'morgue-eventos' && sub === 'morgue-evento'));
    });
    S.vista = null;
    var main = $('#main');
    main.innerHTML = '<div class="vacio">Cargando…</div>';
    var vistas = { tablero: vTablero, agenda: vAgenda, evento: vEvento, salas: vSalas, sala: vSala, instrumental: vInstrumental, entrega: vEntrega, bitacora: vBitacora, admin: vAdmin, morgue: vMorgue, areas: vAreas, ingreso: vIngreso,
      ct: vCT, planes: vPlanes, plan: vPlan, av: vAV, ps: vPS, firmas: vFirmas, prep: vPrep, th: vTH, adm: vAD, lg: vLG, bm: vBM };
    (vistas[v] || vTablero)(p.slice(1));
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  function montar(html) { $('#main').innerHTML = html; }

  // ================================================================== TABLERO
  function vTablero() {
    var h = hoy();
    function cargar() {
      return Promise.all([api('eventos&desde=' + h + '&hasta=' + sumar(h, 7)), api('entregas')]).then(function (r) {
        var ev = r[0].eventos, act = r[0].actividad, ent = r[1].entregas;
        ev.forEach(function (e) { var d = diaDe(e, h) || e.dias[0] || { hora_ini: e.hora_ini, hora_fin: e.hora_fin }; e.hora_ini = d.hora_ini; e.hora_fin = finDia(d); });
        var deHoy = ev.filter(function (e) { return diaDe(e, h) && e.estado !== 'cancelado'; });
        var enCurso = ev.filter(function (e) { return e.estado === 'en_curso'; });
        var custodia = ent.filter(function (e) { return e.estado === 'En custodia'; });
        var proximos = ev.filter(function (e) { return e.fecha > h && e.estado !== 'cancelado'; }).map(function (e) { var d = e.dias[0]; e.hora_ini = d.hora_ini; e.hora_fin = finDia(d); return e; }).slice(0, 8);
        var tarjetas = S.base.salas.map(function (s) {
          var suyos = deHoy.filter(function (e) { return +e.sala_id === +s.id; });
          var actual = suyos.find(function (e) { return e.estado === 'en_curso'; }) || suyos.find(function (e) { return e.estado === 'programado'; }) || suyos[suyos.length - 1];
          var cuerpo;
          if (actual) {
            var pct = actual.v_total ? Math.round(actual.v_hechos / actual.v_total * 100) : 0;
            cuerpo = '<div class="t">' + esc(actual.titulo) + '</div>' +
              '<div class="meta"><b class="num">' + actual.hora_ini + '–' + actual.hora_fin + '</b> · ' + esc(usuario(actual.responsable_id).nombre) + '</div>' +
              (actual.v_total ? '<div class="barra" title="Verificación ' + pct + '%"><i style="width:' + pct + '%"></i></div><div class="meta">Verificación ' + actual.v_hechos + ' de ' + actual.v_total + (actual.n_nov ? ' · ' + actual.n_nov + ' novedades' : '') + '</div>' : '<div class="meta">Sin ítems de verificación aún</div>') +
              (suyos.length > 1 ? '<div class="meta">+' + (suyos.length - 1) + ' evento(s) más hoy</div>' : '');
          } else cuerpo = '<div class="sala-libre">Sin entrenamientos hoy</div>';
          return '<a class="sala-card" href="' + (actual ? '#/evento/' + actual.id : '#/sala/' + s.id) + '">' +
            '<div class="sala-card-top"><h3>' + esc(s.nombre) + '</h3>' + (actual ? chipEstado(actual.estado) : '<span class="chip" style="background:rgba(255,255,255,.12);color:#cfe0d4">Libre</span>') + '</div>' +
            '<div class="sala-card-cuerpo">' + cuerpo + '</div></a>';
        }).join('');
        montar(
          '<div class="vista-cab"><div><div class="eyebrow">Tablero en vivo</div><h1>' + esc(fLarga(h).replace(/^./, function (c) { return c.toUpperCase(); })) + '</h1>' +
          '<p>Hola, ' + esc(S.yo.nombre.split(' ')[0]) + '. Esto es lo que pasa hoy en las salas de entrenamiento.</p></div></div>' +
          '<div class="kpis">' +
            '<div class="kpi oro"><b>' + deHoy.length + '</b><span>Entrenamientos hoy</span></div>' +
            '<div class="kpi"><b>' + enCurso.length + '</b><span>En curso ahora</span></div>' +
            '<div class="kpi"><b>' + deHoy.reduce(function (a, e) { return a + (+e.componentes || 0); }, 0) + '</b><span>Componentes anatómicos hoy</span></div>' +
            '<a class="kpi" href="#/instrumental" style="text-decoration:none;color:inherit"><b>' + custodia.length + '</b><span>Entregas de instrumental en custodia</span></a>' +
          '</div>' +
          '<div class="tablero"><div>' +
            '<div class="salas-grid">' + tarjetas + '</div>' +
            '<h2 class="seccion-t">Hoy</h2><div class="panel">' + listaEventos(deHoy, 'No hay entrenamientos programados para hoy.') + '</div>' +
            '<h2 class="seccion-t">Próximos 7 días</h2><div class="panel">' + listaEventos(proximos, 'No hay entrenamientos en los próximos días.', true) + '</div>' +
          '</div>' +
          '<aside class="panel"><div class="panel-cab"><h2>Actividad reciente</h2><a href="#/bitacora" class="btn-link">Ver bitácora</a></div>' +
            '<div class="feed">' + feed(act) + '</div></aside></div>');
      }, falla);
    }
    S.vista = { refrescar: cargar };
    cargar();
  }
  function listaEventos(ev, vacio, conFecha) {
    if (!ev.length) return '<div class="vacio">' + esc(vacio) + '</div>';
    return '<div class="lista-ev">' + ev.map(function (e) {
      var varios = e.fecha_fin && e.fecha_fin !== e.fecha;
      return '<a class="ev-fila" href="#/evento/' + e.id + '"><div class="ev-hora">' + (conFecha ? '<small>' + fCorta(e.fecha) + '</small>' : '') + e.hora_ini + '<small>a ' + e.hora_fin + '</small></div>' +
        '<div style="min-width:0"><div class="ev-t">' + esc(e.titulo) + '</div><div class="meta">' + (varios ? '<b>' + esc(rangoFechas(e)) + ' · ' + (e.dias || []).length + ' días</b> · ' : '') + esc(sala(e.sala_id).nombre) + ' · ' + esc(usuario(e.responsable_id).nombre) +
        (e.tanatologo_id ? ' · Tanat. ' + esc(usuario(e.tanatologo_id).nombre) : '') +
        (e.empresa ? ' · ' + esc(e.empresa) : '') + '</div></div>' + chipEstado(e.estado) + '</a>';
    }).join('') + '</div>';
  }
  function feed(act) {
    if (!act.length) return '<div class="vacio"><strong>Sin actividad todavía</strong>Aquí aparecerá cada registro con el nombre de quien lo hizo y la hora.</div>';
    return act.map(function (a) {
      return '<div class="feed-item"><span class="avatar sm">' + esc(iniciales(a.usuario_nombre)) + '</span><div style="min-width:0">' +
        '<p><b>' + esc(a.usuario_nombre) + '</b>' + (cargoNombre(a.usuario_nombre) ? ' <span class="meta">(' + esc(cargoNombre(a.usuario_nombre)) + ')</span>' : '') + ' ' + esc(a.accion.charAt(0).toLowerCase() + a.accion.slice(1)) + '</p>' +
        (a.detalle ? '<p class="d">' + esc(a.detalle.length > 160 ? a.detalle.slice(0, 160) + '…' : a.detalle) + '</p>' : '') +
        '<time>' + momento(a.momento) + '</time>' + (a.evento_id ? ' · <a href="#/evento/' + a.evento_id + '" class="meta">ver evento</a>' : '') + '</div></div>';
    }).join('');
  }

  // ================================================================== AGENDA
  function lunes(s) { var d = dISO(s), k = (d.getDay() + 6) % 7; d.setDate(d.getDate() - k); return iso(d); }
  // ================================================================== AGENDA GENERAL (portada de todos)
  var FASE_N = { negociacion: 'Negociación', cotizacion: 'Cotización', administrativo: 'Administrativo', operacion: 'La operación' };
  function resLbl(r) { return r.fase === 'operacion' ? 'Contratado · por programar' : 'Reservado · ' + esc(FASE_N[r.fase] || r.fase); }
  function puedeOpAg() { return areasYo().indexOf('op') >= 0 || areasYo().indexOf('mo') >= 0; }
  function puedeProgramar() { return esAdmin() || (S.yo.rol === 'instrumentador' && areasYo().indexOf('op') >= 0); }
  function vAgenda(p) {
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p[0] || '')) S.semana = lunes(p[0]);
    if (!S.semana) S.semana = lunes(hoy());
    function cargar() {
      var ini = S.semana, fin = sumar(ini, 6);
      return api('agenda&desde=' + ini + '&hasta=' + fin).then(function (j) {
        var dias = []; for (var i = 0; i < 7; i++) dias.push(sumar(ini, i));
        var d0 = dISO(ini), d6 = dISO(fin), H = hoy();
        var rango = d0.getDate() + ' ' + MESES_C[d0.getMonth()] + ' – ' + d6.getDate() + ' ' + MESES_C[d6.getMonth()] + ' ' + d6.getFullYear();
        var resDe = function (r, d) { return r.fecha_inicio <= d && r.fecha_fin >= d; };
        var filas = S.base.salas.map(function (s) {
          return '<tr><th scope="row">' + esc(s.nombre) + '</th>' + dias.map(function (d) {
            var evs = j.eventos.filter(function (e) { return +e.sala_id === +s.id && diaDe(e, d) && e.estado !== 'cancelado'; });
            var rs = j.reservas.filter(function (r) { return (r.salas || [+r.sala_id]).indexOf(+s.id) >= 0 && resDe(r, d); });
            return '<td class="' + (d === H ? 'hoy' : '') + ((j.ocupacion[d] || 0) >= j.cupo ? ' ag-lleno' : '') + '" data-sala="' + s.id + '" data-fecha="' + d + '">' + evs.map(function (e) {
              var dd = diaDe(e, d), k = e.dias.indexOf(dd) + 1;
              return '<a class="ag-ev chip st-' + e.estado + '" href="#/evento/' + e.id + '" data-ev="' + e.id + '"><b>' + dd.hora_ini + '–' + finDia(dd) + '</b>' + (e.dias.length > 1 ? '<span style="font-weight:500">Día ' + k + ' de ' + e.dias.length + ' · </span>' : '') + esc(e.titulo) +
                (e.empresa ? '<br><span style="font-weight:500">' + esc(e.empresa) + '</span>' : '') + '</a>';
            }).join('') + rs.map(function (r) {
              return '<a class="ag-ev ag-res" href="#" data-res="' + r.id + '"><b>' + resLbl(r) + '</b>' + esc(r.curso) + '<br><span style="font-weight:500">' + esc(r.cliente) + '</span></a>';
            }).join('') + '</td>';
          }).join('') + '</tr>';
        }).join('');
        var cab = dias.map(function (d) {
          var x = dISO(d), n = j.ocupacion[d] || 0, fe = j.festivos.indexOf(d) >= 0;
          return '<th class="' + (d === H ? 'hoy' : '') + '">' + DIAS[x.getDay()] + '<small>' + x.getDate() + '</small>' + (fe ? '<em class="ag-fest">Festivo</em>' : '') +
            '<span class="ag-cupo ' + (n >= j.cupo ? 'lleno' : n ? 'medio' : 'libre') + '" title="Eventos que se cruzan ese día">' + n + ' / ' + j.cupo + '</span></th>';
        }).join('');
        var todos = j.eventos.filter(function (e) { return e.estado !== 'cancelado'; }).map(function (e) { return { t: 'ev', f: e.fecha, x: e }; })
          .concat(j.reservas.map(function (r) { return { t: 'res', f: r.fecha_inicio, x: r }; })).sort(function (a, b) { return a.f < b.f ? -1 : a.f > b.f ? 1 : 0; });
        var lista = todos.length ? '<div class="lista-ev">' + todos.map(function (o) {
          var e = o.x;
          if (o.t === 'ev') return '<a class="ev-fila" href="#/evento/' + e.id + '" data-ev="' + e.id + '"><div class="ev-hora"><small>' + fCorta(e.fecha) + '</small>' + e.hora_ini + '<small>a ' + e.hora_fin + '</small></div>' +
            '<div style="min-width:0"><div class="ev-t">' + esc(e.titulo) + '</div><div class="meta">' + (e.fecha_fin !== e.fecha ? '<b>' + esc(rangoFechas(e)) + '</b> · ' : '') + esc(sala(e.sala_id).nombre) + (e.empresa ? ' · ' + esc(e.empresa) : '') + (e.convenio ? ' · ' + esc(e.convenio) : '') + (+e.personas ? ' · ' + e.personas + ' en el listado' : '') + '</div></div>' + chipEstado(e.estado) + '</a>';
          return '<a class="ev-fila ev-res" href="#" data-res="' + e.id + '"><div class="ev-hora"><small>' + fCorta(e.fecha_inicio) + '</small>' + e.hora_ini + '<small>a ' + e.hora_fin + '</small></div>' +
            '<div style="min-width:0"><div class="ev-t">' + esc(e.curso) + '</div><div class="meta">' + (e.fecha_fin !== e.fecha_inicio ? '<b>' + esc(fCorta(e.fecha_inicio) + ' – ' + fCorta(e.fecha_fin)) + '</b> · ' : '') + esc(sala(e.sala_id).nombre) + ' · ' + esc(e.cliente) + ' · ' + esc(e.codigo) + '</div></div><span class="chip ag-res-chip">' + resLbl(e) + '</span></a>';
        }).join('') + '</div>' : '<div class="vacio">No hay eventos ni reservas esta semana.</div>';
        montar('<div class="vista-cab"><div><div class="eyebrow">Portada · todos los funcionarios</div><h1>Agenda general</h1><p>Entrenamientos programados y fechas reservadas por solicitudes en curso. Por fecha se pueden cruzar máximo <b>' + j.cupo + ' eventos</b>: la plataforma no deja registrar uno más.' +
          (puedeProgramar() ? ' Toque una casilla vacía para programar un entrenamiento.' : '') + '</p></div>' +
          '<div class="agenda-nav"><button class="btn btn-sm" id="ag-prev" type="button">← Semana anterior</button><strong class="num">' + rango + '</strong><button class="btn btn-sm" id="ag-next" type="button">Semana siguiente →</button><button class="btn btn-sm btn-verde" id="ag-hoy" type="button">Hoy</button><a class="btn btn-sm btn-rt" href="' + (window.CLEMI_DEMO ? 'tiempo-real.html' : 'tiempo-real.php') + '" target="_blank" rel="noopener"><i></i>Real Time</a></div></div>' +
          '<div class="ag-ley"><span><i class="chip st-programado">&nbsp;</i> Entrenamiento en la agenda</span><span><i class="ag-res">&nbsp;</i> Fecha reservada (solicitud en negociación, cotización o administrativo)</span><span><i class="ag-cupo libre">0 / ' + j.cupo + '</i> Cupo del día</span><span><i class="ag-cupo lleno">' + j.cupo + ' / ' + j.cupo + '</i> Día lleno</span></div>' +
          '<div class="panel agenda-scroll"><table class="agenda"><thead><tr><th>Sala</th>' + cab + '</tr></thead><tbody>' + filas + '</tbody></table></div>' +
          '<h2 class="seccion-t">Eventos y reservas de la semana</h2><div class="panel">' + lista + '</div>');
        $('#ag-prev').onclick = function () { S.semana = sumar(S.semana, -7); cargar(); };
        $('#ag-next').onclick = function () { S.semana = sumar(S.semana, 7); cargar(); };
        $('#ag-hoy').onclick = function () { S.semana = lunes(hoy()); cargar(); };
        $$('[data-ev]').forEach(function (a) {
          a.addEventListener('click', function (ev) {
            if (puedeOpAg()) return;
            ev.preventDefault();
            var e = j.eventos.find(function (x) { return +x.id === +a.getAttribute('data-ev'); });
            modal(e.titulo, '<dl class="ag-det"><dt>Organiza</dt><dd>' + esc(e.empresa || '—') + '</dd><dt>Sala</dt><dd>' + esc(sala(e.sala_id).nombre) + '</dd><dt>Fechas</dt><dd>' + e.dias.map(function (d) { return esc(fCorta(d.fecha)) + ' · ' + d.hora_ini + ' a ' + finDia(d); }).join('<br>') + '</dd>' +
              '<dt>Estado</dt><dd>' + chipEstado(e.estado) + '</dd>' + (e.convenio ? '<dt>Convenio</dt><dd>' + esc(e.convenio) + '</dd>' : '') + '<dt>Personas</dt><dd>' + (+e.personas || 0) + ' en el listado</dd></dl>',
              '<button class="btn" data-cerrar type="button">Cerrar</button>');
          });
        });
        $$('[data-res]').forEach(function (a) {
          a.addEventListener('click', function (ev) {
            ev.preventDefault();
            var r = j.reservas.find(function (x) { return +x.id === +a.getAttribute('data-res'); });
            var ir = puedeCT() ? '#/ct/contrato/' + r.id : puedeAD() ? '#/adm/convenio/' + r.id : '';
            var m = modal('Fecha reservada · ' + r.codigo, '<dl class="ag-det"><dt>Cliente</dt><dd>' + esc(r.cliente) + '</dd><dt>Curso</dt><dd>' + esc(r.curso) + '</dd><dt>Sala</dt><dd>' + esc(sala(r.sala_id).nombre) + '</dd>' +
              '<dt>Fechas</dt><dd>' + esc(fCorta(r.fecha_inicio)) + (r.fecha_fin !== r.fecha_inicio ? ' al ' + esc(fCorta(r.fecha_fin)) : '') + ' · ' + r.hora_ini + ' a ' + r.hora_fin + '</dd><dt>Fase</dt><dd>' + esc(FASE_N[r.fase] || r.fase) + '</dd><dt>Participantes</dt><dd>' + (+r.participantes || '—') + '</dd></dl>' +
              '<p class="meta" style="margin:0">La fecha queda bloqueada desde que se registró la solicitud. Cuando el convenio pase a la agenda de instrumentación, aparece como entrenamiento.</p>',
              '<button class="btn" data-cerrar type="button">Cerrar</button>' + (ir ? '<a class="btn btn-oro" href="' + ir + '" id="x-ir">Abrir el convenio</a>' : ''));
            var b = $('#x-ir', m.el); if (b) b.onclick = function () { m.cerrar(); };
          });
        });
        $$('.agenda td').forEach(function (td) {
          td.addEventListener('click', function (e) {
            if (e.target.closest('a') || !puedeProgramar()) return;
            if ((j.ocupacion[td.getAttribute('data-fecha')] || 0) >= j.cupo) return toast('Ese día ya tiene ' + j.cupo + ' eventos: no se puede programar otro.', 'error');
            formEvento(null, { sala_id: td.getAttribute('data-sala'), fecha: td.getAttribute('data-fecha') });
          });
        });
      }, falla);
    }
    S.vista = { refrescar: cargar };
    cargar();
  }

  // ------------------------------------------------------------ formulario de evento
  function finDia(d) { return d.hora_fin_ext || d.hora_fin; }
  function diaDe(e, f) { return (e.dias || []).find(function (d) { return d.fecha === f; }); }
  function rangoFechas(e) { return !e.fecha_fin || e.fecha_fin === e.fecha ? fCorta(e.fecha) : fCorta(e.fecha) + ' – ' + fCorta(e.fecha_fin); }
  function formEvento(ev, pre) {
    var e = ev || { titulo: '', especialidad: '', empresa: '', sala_id: pre.sala_id || (S.base.salas[0] || {}).id, fecha: pre.fecha || hoy(), fecha_fin: pre.fecha || hoy(),
      responsable_id: S.yo.rol === 'instrumentador' ? S.yo.id : '', tanatologo_id: '', apoyo: [], participantes: '', componentes: '', descripcion: '', dias: [] };
    var activos = S.base.usuarios.filter(function (u) { return +u.activo; });
    var instr = activos.filter(function (u) { return u.rol === 'instrumentador'; });
    var tana = activos.filter(function (u) { return u.rol === 'tanatologo'; });
    // horario por día: valores del formulario y fin vigente guardado (para detectar extensiones)
    var val = {}, guardado = {};
    (e.dias || []).forEach(function (d) { val[d.fecha] = { hora_ini: d.hora_ini, hora_fin: finDia(d), justificacion: '' }; guardado[d.fecha] = finDia(d); });
    var m = modal(ev ? 'Editar entrenamiento' : 'Nuevo entrenamiento',
      '<div class="form-grid">' +
      '<label class="campo ancho"><span class="req">Nombre del entrenamiento</span><input id="f-titulo" maxlength="200" value="' + esc(e.titulo) + '" placeholder="Ej. Curso de artroscopia de rodilla — nivel II"></label>' +
      '<label class="campo"><span>Especialidad</span><input id="f-esp" maxlength="120" value="' + esc(e.especialidad) + '" placeholder="Ej. Ortopedia"></label>' +
      '<label class="campo"><span>Empresa / organizador</span><input id="f-emp" maxlength="200" value="' + esc(e.empresa) + '"></label>' +
      '<label class="campo"><span class="req">Sala</span><select id="f-sala">' + S.base.salas.map(function (s) { return '<option value="' + s.id + '"' + (+s.id === +e.sala_id ? ' selected' : '') + '>' + esc(s.nombre) + '</option>'; }).join('') + '</select></label>' +
      '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:14px"><label class="campo"><span class="req">Fecha de inicio</span><input type="date" id="f-fecha" value="' + esc(e.fecha) + '"></label>' +
      '<label class="campo"><span class="req">Fecha final</span><input type="date" id="f-fechafin" value="' + esc(e.fecha_fin || e.fecha) + '"></label></div>' +
      '<div class="campo ancho"><span class="req">Horario de cada día</span><div class="dias-tabla" id="f-dias"></div>' +
      '<small>Si alarga la hora de finalización de un día ya programado, escriba la justificación: es obligatoria y queda en la bitácora.</small></div>' +
      '<label class="campo"><span class="req">Instrumentador a cargo</span><select id="f-resp"><option value="">Seleccione…</option>' + instr.map(function (u) { return '<option value="' + u.id + '"' + (+u.id === +e.responsable_id ? ' selected' : '') + '>' + esc(u.nombre) + '</option>'; }).join('') + '</select><small>Es quien firma el cierre del evento.</small></label>' +
      '<label class="campo"><span class="req">Tanatólogo a cargo</span><select id="f-tana"><option value="">Seleccione…</option>' + tana.map(function (u) { return '<option value="' + u.id + '"' + (+u.id === +e.tanatologo_id ? ' selected' : '') + '>' + esc(u.nombre) + '</option>'; }).join('') + '</select></label>' +
      '<div class="campo ancho"><span>Apoyo en instrumentación</span><div style="display:flex;flex-wrap:wrap;gap:6px 14px">' + instr.map(function (u) {
        return '<label class="check"><input type="checkbox" class="f-apoyo" value="' + u.id + '"' + ((e.apoyo || []).map(Number).indexOf(+u.id) >= 0 ? ' checked' : '') + '>' + esc(u.nombre) + '</label>';
      }).join('') + '</div></div>' +
      '<label class="campo"><span>Participantes</span><input type="number" min="0" id="f-part" value="' + esc(e.participantes) + '"></label>' +
      '<label class="campo"><span>Componentes anatómicos</span><input type="number" min="0" id="f-comp" value="' + esc(e.componentes) + '"></label>' +
      (!ev && S.base.plantillas.length ? '<label class="campo ancho"><span>Lista de verificación</span><select id="f-plant"><option value="">Sin lista (se agregan ítems después)</option>' +
        S.base.plantillas.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nombre) + ' (' + p.items.length + ' ítems)</option>'; }).join('') + '</select></label>' : '') +
      '<label class="campo ancho"><span>Descripción / observaciones</span><textarea id="f-desc" maxlength="4000">' + esc(e.descripcion) + '</textarea></label>' +
      '</div>',
      '<button class="btn" type="button" data-cerrar>Cancelar</button><button class="btn btn-oro" type="button" id="f-ok">' + (ev ? 'Guardar cambios' : 'Programar entrenamiento') + '</button>', { ancho: true });
    function fechas() {
      var a = $('#f-fecha', m.el).value, b = $('#f-fechafin', m.el).value, r = [];
      if (!a) return r; if (!b || b < a) b = a;
      for (var f = a; f <= b && r.length < 31; f = sumar(f, 1)) r.push(f);
      return r;
    }
    function pintarDias() {
      var fs = fechas(), prev = null;
      fs.forEach(function (f) { if (!val[f]) val[f] = prev ? { hora_ini: prev.hora_ini, hora_fin: prev.hora_fin, justificacion: '' } : { hora_ini: '07:00', hora_fin: '12:00', justificacion: '' }; prev = val[f]; });
      $('#f-dias', m.el).innerHTML = fs.map(function (f, i) {
        var v = val[f], ext = guardado[f] && v.hora_fin > guardado[f];
        return '<div class="dia-fila' + (ext ? ' extendida' : '') + '"><b>' + fCorta(f) + '</b>' +
          '<label>Inicio <input type="time" data-f="' + f + '" data-k="hora_ini" value="' + v.hora_ini + '"></label>' +
          '<label>Fin <input type="time" data-f="' + f + '" data-k="hora_fin" value="' + v.hora_fin + '"></label>' +
          (i === 0 && fs.length > 1 ? '<button type="button" class="btn btn-sm" id="f-copiar">Mismo horario todos los días</button>' : '<span></span>') +
          (ext ? '<label class="dia-just"><span class="req">Justificación de la extensión (' + guardado[f] + ' → ' + v.hora_fin + ')</span><input data-f="' + f + '" data-k="justificacion" maxlength="1000" value="' + esc(v.justificacion) + '" placeholder="Ej. El instructor solicitó repetir la práctica en la estación 3"></label>' : '') +
          '</div>';
      }).join('') || '<p class="meta">Seleccione las fechas.</p>';
      $$('#f-dias [data-k]', m.el).forEach(function (inp) {
        inp.addEventListener('change', function () { val[inp.getAttribute('data-f')][inp.getAttribute('data-k')] = inp.value; if (inp.getAttribute('data-k') === 'hora_fin') pintarDias(); });
        inp.addEventListener('input', function () { val[inp.getAttribute('data-f')][inp.getAttribute('data-k')] = inp.value; });
      });
      var cp = $('#f-copiar', m.el);
      if (cp) cp.onclick = function () { var p0 = val[fs[0]]; fs.slice(1).forEach(function (f) { val[f].hora_ini = p0.hora_ini; val[f].hora_fin = p0.hora_fin; }); pintarDias(); };
    }
    $('#f-fecha', m.el).addEventListener('change', function () { if ($('#f-fechafin', m.el).value < this.value) $('#f-fechafin', m.el).value = this.value; pintarDias(); });
    $('#f-fechafin', m.el).addEventListener('change', pintarDias);
    pintarDias();
    function enviar(forzar) {
      var d = {
        id: ev ? ev.id : 0, titulo: $('#f-titulo', m.el).value, especialidad: $('#f-esp', m.el).value, empresa: $('#f-emp', m.el).value,
        sala_id: $('#f-sala', m.el).value, fecha: $('#f-fecha', m.el).value, fecha_fin: $('#f-fechafin', m.el).value,
        dias: fechas().map(function (f) { return { fecha: f, hora_ini: val[f].hora_ini, hora_fin: val[f].hora_fin, justificacion: val[f].justificacion }; }),
        responsable_id: $('#f-resp', m.el).value, tanatologo_id: $('#f-tana', m.el).value, participantes: $('#f-part', m.el).value, componentes: $('#f-comp', m.el).value,
        descripcion: $('#f-desc', m.el).value, apoyo: $$('.f-apoyo:checked', m.el).map(function (c) { return +c.value; }).filter(function (x) { return x !== +$('#f-resp', m.el).value; }),
        plantilla_id: $('#f-plant', m.el) ? $('#f-plant', m.el).value : 0, forzar: !!forzar
      };
      $('#f-ok', m.el).disabled = true;
      api('evento_guardar', d).then(function (j) {
        m.cerrar(); toast(ev ? (j.sin_cambios ? 'No había cambios que guardar.' : 'Cambios guardados.') : 'Entrenamiento programado.');
        if (!ev) location.hash = '#/evento/' + j.id; else refrescar();
      }, function (x) {
        $('#f-ok', m.el).disabled = false;
        if (x.cruce) {
          errorEn(m, x.error + ' ¿Desea programarlo de todas formas?');
          var b = $('#f-forzar', m.el);
          if (!b) { b = document.createElement('button'); b.className = 'btn btn-peligro'; b.id = 'f-forzar'; b.type = 'button'; b.textContent = 'Guardar con cruce de horario'; $('.modal-pie', m.el).prepend(b); b.onclick = function () { enviar(true); }; }
        } else errorEn(m, x.error);
      });
    }
    $('#f-ok', m.el).addEventListener('click', function () { enviar(false); });
  }
  function modalExtender(e, f, luego) {
    var d = diaDe(e, f), fin = finDia(d);
    var m = modal('Extender horario · ' + fCorta(f),
      '<p style="margin:0">Horario de este día: <b>' + d.hora_ini + ' a ' + fin + '</b>' + (d.hora_fin_ext ? ' (programado hasta ' + d.hora_fin + ')' : '') + '.</p>' +
      '<label class="campo"><span class="req">Nueva hora de finalización</span><input type="time" id="x-h" value="' + fin + '"></label>' +
      '<label class="campo"><span class="req">Justificación de la extensión</span><textarea id="x-j" maxlength="1000" placeholder="Explique por qué se extiende la jornada"></textarea><small>Es obligatoria y queda registrada en la bitácora con su nombre.</small></label>',
      '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="x-ok" type="button">Extender horario</button>');
    function enviar(forzar) {
      api('dia_extender', { evento_id: e.id, fecha: f, hora_fin: $('#x-h', m.el).value, justificacion: $('#x-j', m.el).value, forzar: !!forzar }).then(function () {
        m.cerrar(); toast('Horario extendido. La justificación quedó en la bitácora.'); luego();
      }, function (x) {
        errorEn(m, x.error + (x.cruce ? ' ¿Extender de todas formas?' : ''));
        if (x.cruce && !$('#x-forzar', m.el)) { var b = document.createElement('button'); b.className = 'btn btn-peligro'; b.id = 'x-forzar'; b.type = 'button'; b.textContent = 'Extender con cruce'; $('.modal-pie', m.el).prepend(b); b.onclick = function () { enviar(true); }; }
      });
    }
    $('#x-ok', m.el).onclick = function () { enviar(false); };
  }

  // ================================================================== EVENTO
  function vEvento(p) {
    var id = +p[0], tab = p[1] || 'resumen', D = null, editor = null;
    function cargar() {
      return api('evento&id=' + id).then(function (j) { D = j; pintar(); }, function (e) { montar('<div class="vacio"><strong>No se pudo abrir el evento</strong>' + esc(e.error) + '</div>'); });
    }
    function pintar() {
      var e = D.evento, s = sala(e.sala_id), estadoAbierto = e.estado === 'programado' || e.estado === 'en_curso', abierto = estadoAbierto && !esTana();
      var soyResp = +e.responsable_id === +S.yo.id;
      var vt = D.verificacion.length, vh = D.verificacion.filter(function (x) { return x.estado !== 'pendiente'; }).length;
      var tabs = [['resumen', 'Resumen'], ['verificacion', 'Verificación', vt ? vh + '/' + vt : ''], ['sala', 'Distribución en sala', e.layout.length || ''],
        ['participantes', 'Participantes', e.n_inscritos || ''], ['componentes', 'Componentes anatómicos', (D.asignaciones || []).length || ''], ['novedades', 'Novedades', D.novedades.length || ''], ['instrumental', 'Instrumental', D.entregas.length || ''], ['bitacora', 'Bitácora', D.bitacora.length]];
      var acc = '';
      if (e.estado === 'programado' && abierto) acc += '<button class="btn" type="button" id="e-iniciar">▶ Iniciar entrenamiento</button>';
      if (estadoAbierto && esTana()) acc += '<a class="btn btn-oro" href="#/evento/' + e.id + '/novedades">Registrar novedad</a>';
      if (abierto) acc += '<button class="btn" type="button" id="e-editar">Editar datos</button>';
      if (abierto) acc += '<button class="btn btn-oro" type="button" id="e-cerrar">Cerrar y firmar</button>';
      if (e.estado === 'cerrado') acc += '<a class="btn btn-oro" href="reporte.php?id=' + e.id + '" target="_blank" rel="noopener">Descargar informe del evento</a>';
      if (abierto) acc += '<button class="btn" type="button" id="e-cancelar">Cancelar evento</button>';
      if (esAdmin() && (e.estado === 'cerrado' || e.estado === 'cancelado')) acc += '<button class="btn" type="button" id="e-reabrir">Reabrir (administración)</button>';
      if (esAdmin()) acc += '<button class="btn" type="button" id="e-borrar">Eliminar</button>';
      var apoyo = (e.apoyo || []).map(function (i) { return usuario(i).nombre; }).join(', ');
      montar(
        '<a class="miga" href="#/agenda">← Agenda</a>' +
        '<section class="ev-cab"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;position:relative">' + chipEstado(e.estado) +
          (e.especialidad ? '<span class="chip" style="background:rgba(255,255,255,.1);color:#e8efe9">' + esc(e.especialidad) + '</span>' : '') + '</div>' +
          '<h1 style="margin-top:8px">' + esc(e.titulo) + '</h1>' +
          '<div class="ev-datos"><span><b>' + esc(s.nombre) + '</b></span><span class="num">' + esc(rangoFechas(e)) + (e.dias.length > 1 ? ' · ' + e.dias.length + ' días' : '') +
            (diaDe(e, hoy()) ? ' · Hoy <b>' + diaDe(e, hoy()).hora_ini + '–' + finDia(diaDe(e, hoy())) + '</b>' : (e.dias.length === 1 ? ' · <b>' + e.dias[0].hora_ini + '–' + finDia(e.dias[0]) + '</b>' : '')) + '</span>' +
          '<span>Instrumentador a cargo: <b>' + esc(usuario(e.responsable_id).nombre) + '</b></span><span>Tanatólogo a cargo: <b>' + esc(e.tanatologo_id ? usuario(e.tanatologo_id).nombre : '—') + '</b></span>' + (apoyo ? '<span>Apoyo: ' + esc(apoyo) + '</span>' : '') +
          (e.empresa ? '<span>' + esc(e.empresa) + '</span>' : '') + '</div>' +
          '<div class="acciones">' + acc + '</div></section>' +
        (e.estado === 'cerrado' ? '<div class="cerrado-sello"><img src="' + archivo(e.cierre_firma) + '" alt="Firma de cierre"><div><b>Cerrado y firmado por ' + esc(usuario(e.cierre_por).nombre) + '</b><div class="meta">' + momento(e.cierre_en) + (e.cierre_obs ? ' · ' + esc(e.cierre_obs) : '') + '</div></div></div>' : '') +
        '<nav class="tabs">' + tabs.map(function (t) { return '<a href="#/evento/' + id + '/' + t[0] + '" class="' + (t[0] === tab ? 'is-on' : '') + '">' + t[1] + (t[2] ? '<span class="n">' + t[2] + '</span>' : '') + '</a>'; }).join('') + '</nav>' +
        '<div id="ev-tab"></div>');
      var btn = function (sel, fn) { var b = $(sel); if (b) b.addEventListener('click', fn); };
      btn('#e-iniciar', function () { api('evento_estado', { id: id, estado: 'en_curso' }).then(function () { toast('Entrenamiento iniciado. Hora registrada.'); cargar(); }, falla); });
      btn('#e-editar', function () { formEvento(e); });
      btn('#e-cerrar', function () { modalCierre(D, soyResp, cargar); });
      btn('#e-cancelar', function () { modalMotivo('Cancelar evento', 'Motivo de la cancelación', 'Cancelar evento', function (mot) { return api('evento_estado', { id: id, estado: 'cancelado', motivo: mot }); }, cargar); });
      btn('#e-reabrir', function () { modalMotivo('Reabrir evento', 'Motivo para reabrir (queda en la bitácora)', 'Reabrir evento', function (mot) { return api('evento_estado', { id: id, estado: 'reabrir', motivo: mot }); }, cargar); });
      btn('#e-borrar', function () {
        var m = modal('Eliminar evento', '<p style="margin:0">Se eliminará el evento con su verificación, novedades y distribución. Las entregas de instrumental se conservan. La eliminación queda registrada en la bitácora general.</p><label class="campo"><span>Escriba BORRAR para confirmar</span><input id="x-conf"></label>',
          '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-peligro" id="x-ok" type="button">Eliminar definitivamente</button>');
        $('#x-ok', m.el).onclick = function () { api('evento_borrar', { id: id, confirmar: $('#x-conf', m.el).value }).then(function () { m.cerrar(); toast('Evento eliminado.'); location.hash = '#/agenda'; }, function (x) { errorEn(m, x.error); }); };
      });
      var cont = $('#ev-tab');
      ({ resumen: tResumen, verificacion: tVerif, sala: tSala, componentes: function (cc) { panelAsignaciones(cc, D, cargar); }, participantes: function (cc) { tParticipantes(cc, e, estadoAbierto && !esTana(), cargar); }, novedades: tNov, instrumental: tInstr, bitacora: tBit }[tab] || tResumen)(cont, e, tab === 'novedades' ? estadoAbierto : abierto);
    }

    function tResumen(c, e, abierto) {
      var s = sala(e.sala_id), vt = D.verificacion.length;
      var prog = '<div class="panel" style="margin-bottom:18px"><div class="panel-cab"><h2>Programación por día</h2><span class="meta">' + e.dias.length + (e.dias.length === 1 ? ' día' : ' días') + '</span></div><div class="tabla-wrap"><table class="tabla"><thead><tr><th>Día</th><th>Inicio</th><th>Fin programado</th><th>Fin vigente</th><th>Justificación de extensión</th><th></th></tr></thead><tbody>' +
        e.dias.map(function (d) {
          return '<tr' + (d.fecha === hoy() ? ' style="background:var(--dorado-suave)"' : '') + '><td style="white-space:nowrap"><b>' + esc(fCorta(d.fecha)) + '</b>' + (d.fecha === hoy() ? ' · hoy' : '') + '</td><td class="num">' + d.hora_ini + '</td><td class="num">' + d.hora_fin + '</td>' +
            '<td class="num">' + (d.hora_fin_ext ? '<b style="color:var(--alerta)">' + d.hora_fin_ext + '</b>' : d.hora_fin) + '</td>' +
            '<td class="bit-det">' + (d.justificacion ? esc(d.justificacion) + (d.ext_por ? '<br><span class="meta">' + esc(usuario(d.ext_por).nombre) + ' · ' + momento(d.ext_en) + '</span>' : '') : '—') + '</td>' +
            '<td>' + (abierto ? '<button class="btn btn-sm" type="button" data-ext="' + d.fecha + '">Extender horario</button>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div></div>';
      setTimeout(function () { $$('[data-ext]', c).forEach(function (b) { b.onclick = function () { modalExtender(e, b.getAttribute('data-ext'), cargar); }; }); }, 0);
      var cnt = { ok: 0, no: 0, na: 0, pendiente: 0 }; D.verificacion.forEach(function (x) { cnt[x.estado]++; });
      c.innerHTML = prog + '<div class="dos-col"><div class="panel"><div class="datos-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
        dato('Sala', s.nombre) + dato('Fechas', e.fecha_fin && e.fecha_fin !== e.fecha ? fLarga(e.fecha) + ' al ' + fLarga(e.fecha_fin) : fLarga(e.fecha)) + dato('Instrumentador a cargo', usuario(e.responsable_id).nombre) + dato('Tanatólogo a cargo', e.tanatologo_id ? usuario(e.tanatologo_id).nombre : '—') +
        dato('Especialidad', e.especialidad || '—') + dato('Empresa / organizador', e.empresa || '—') + dato('Participantes', e.participantes || '—') + dato('Componentes anatómicos', e.componentes || '—') +
        dato('Creado por', usuario(e.creado_por).nombre + ' · ' + momento(e.creado_en)) + dato('Última modificación', e.actualizado_por ? usuario(e.actualizado_por).nombre + ' · ' + momento(e.actualizado_en) : '—') +
        dato('Inicio real', e.iniciado_en ? momento(e.iniciado_en) + ' · ' + usuario(e.iniciado_por).nombre : 'Sin iniciar') + dato('Cierre', e.cierre_en ? momento(e.cierre_en) + ' · ' + usuario(e.cierre_por).nombre : 'Abierto') +
        '</div>' + (e.descripcion ? '<div class="panel-cuerpo" style="white-space:pre-line">' + esc(e.descripcion) + '</div>' : '') + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:18px">' +
        '<div class="panel"><div class="panel-cab"><h2>Verificación</h2><a class="btn-link" href="#/evento/' + e.id + '/verificacion">Abrir</a></div><div class="panel-cuerpo">' +
          (vt ? '<div class="barra"><i style="width:' + Math.round((vt - cnt.pendiente) / vt * 100) + '%"></i></div><p class="meta" style="margin:8px 0 0"><b>' + cnt.ok + '</b> cumplen · <b>' + cnt.no + '</b> no cumplen · <b>' + cnt.na + '</b> no aplican · <b>' + cnt.pendiente + '</b> pendientes</p>'
              : '<p class="meta" style="margin:0">Aún no hay ítems de verificación para este evento.</p>') + '</div></div>' +
        '<a class="panel" href="#/evento/' + e.id + '/sala" style="display:block;text-decoration:none;color:inherit"><div class="panel-cab"><h2>Distribución en ' + esc(s.nombre) + '</h2><span class="btn-link">Abrir</span></div>' +
          '<div style="padding:8px;background:#ebe7dd">' + Plano.svg({ sala: s, plano: s.plano, items: e.layout, catalogo: S.base.catalogo, cotas: false }) + '</div></a>' +
        (D.cliente ? '<a class="panel" href="#/evento/' + e.id + '/sala" style="display:block;text-decoration:none;color:inherit"><div class="panel-cab"><h2>Curso contratado · ' + esc(D.cliente.cliente) + '</h2><span class="btn-link">Abrir</span></div><div class="panel-cuerpo">' +
          chipPlan(D.cliente.plan_estado) + (D.cliente.plan ? ' <span class="meta">planificación del cliente, versión ' + D.cliente.plan.version + '</span>' : '') +
          '<p class="meta" style="margin:8px 0 0">Audiovisuales y marcación: <b>' + D.cliente.av.filter(function (x) { return x.estado === 'Listo' || x.estado === 'Instalado / entregado'; }).length + '</b> de ' + D.cliente.av.length + ' listos</p></div></a>' : '') +
        '</div></div>';
    }

    function tVerif(c, e, abierto) {
      var fases = ['Antes', 'Durante', 'Después'], L = D.verificacion;
      var html = '<div class="panel">';
      if (!L.length) html += '<div class="vacio"><strong>Sin ítems de verificación</strong>' + (abierto ? 'Cargue una lista guardada o escriba los ítems abajo, uno por línea.' : '') + '</div>';
      fases.forEach(function (f) {
        var its = L.filter(function (x) { return x.fase === f; });
        if (!its.length) return;
        html += '<div class="verif-fase">' + f + ' del entrenamiento · ' + its.filter(function (x) { return x.estado !== 'pendiente'; }).length + '/' + its.length + '</div>';
        its.forEach(function (it) {
          var cls = it.estado === 'pendiente' ? '' : it.estado;
          html += '<div class="verif-item ' + cls + '" data-id="' + it.id + '"><div class="verif-texto">' + esc(it.texto) + '</div>' +
            '<div class="seg" role="group" aria-label="Estado">' +
              '<button type="button" data-st="ok" class="' + (it.estado === 'ok' ? 'on-ok' : '') + '"' + (abierto ? '' : ' disabled') + '>✓ Cumple</button>' +
              '<button type="button" data-st="no" class="' + (it.estado === 'no' ? 'on-no' : '') + '"' + (abierto ? '' : ' disabled') + '>✗ No cumple</button>' +
              '<button type="button" data-st="na" class="' + (it.estado === 'na' ? 'on-na' : '') + '"' + (abierto ? '' : ' disabled') + '>N/A</button>' +
            '</div>' +
            '<div class="verif-obs">' + (abierto ? '<input type="text" maxlength="1000" placeholder="Observación (obligatoria si no cumple)" value="' + esc(it.obs) + '" data-obs>' : (it.obs ? '<span class="meta">' + esc(it.obs) + '</span>' : '')) +
            (it.marcado_por ? '<span class="meta" style="white-space:nowrap"><b>' + esc(usuario(it.marcado_por).nombre) + '</b> · ' + momento(it.marcado_en) + '</span>' : '<span class="meta" style="white-space:nowrap">Agregado por ' + esc(usuario(it.creado_por).nombre.split(' ')[0]) + '</span>') +
            (abierto && (esAdmin() || (+it.creado_por === +S.yo.id && it.estado === 'pendiente')) ? '<button type="button" class="quitar" data-del title="Quitar ítem">×</button>' : '') +
            '</div></div>';
        });
      });
      html += '</div>';
      if (abierto) {
        html += '<div class="panel" style="margin-top:18px"><div class="panel-cab"><h2>Agregar ítems a verificar</h2></div><div class="panel-cuerpo" style="display:flex;flex-direction:column;gap:12px">' +
          (S.base.plantillas.length ? '<div style="display:flex;gap:8px;flex-wrap:wrap"><select id="v-plant" style="flex:1;min-width:200px"><option value="">Cargar una lista guardada…</option>' + S.base.plantillas.map(function (p) { return '<option value="' + p.id + '">' + esc(p.nombre) + ' (' + p.items.length + ')</option>'; }).join('') + '</select><button class="btn" id="v-cargar" type="button">Cargar lista</button></div>' : '') +
          '<div class="form-grid" style="grid-template-columns:160px minmax(0,1fr)"><label class="campo"><span>Momento</span><select id="v-fase"><option>Antes</option><option>Durante</option><option>Después</option></select></label>' +
          '<label class="campo"><span>Ítems (uno por línea)</span><textarea id="v-texto" placeholder="Ej. Componentes anatómicos identificados y rotulados&#10;Mesa de instrumental completa según listado"></textarea></label></div>' +
          '<div><button class="btn btn-verde" id="v-agregar" type="button">Agregar ítems</button></div></div></div>';
      }
      c.innerHTML = html;
      $$('.verif-item', c).forEach(function (row) {
        var iid = +row.getAttribute('data-id'), it = L.find(function (x) { return +x.id === iid; }), obs = $('[data-obs]', row);
        function marcar(st) {
          var o = obs ? obs.value : it.obs;
          if (st === 'no' && !o.trim()) { if (obs) { obs.focus(); obs.style.borderColor = 'var(--mal)'; } return toast('Escriba en la observación por qué no cumple.', 'error'); }
          api('verif_marcar', { id: iid, estado: st, obs: o }).then(cargar, falla);
        }
        $$('[data-st]', row).forEach(function (b) {
          b.addEventListener('click', function () { var st = b.getAttribute('data-st'); marcar(it.estado === st ? 'pendiente' : st); });
        });
        if (obs) {
          obs.addEventListener('keydown', function (e) { if (e.key === 'Enter') obs.blur(); });
          obs.addEventListener('change', function () { if (it.estado !== 'pendiente' && obs.value !== it.obs) marcar(it.estado); });
        }
        var del = $('[data-del]', row);
        if (del) del.addEventListener('click', function () { api('verif_borrar', { id: iid }).then(cargar, falla); });
      });
      var ag = $('#v-agregar', c);
      if (ag) ag.addEventListener('click', function () {
        api('verif_agregar', { evento_id: id, fase: $('#v-fase').value, texto: $('#v-texto').value }).then(function () { toast('Ítems agregados.'); cargar(); }, falla);
      });
      var cg = $('#v-cargar', c);
      if (cg) cg.addEventListener('click', function () {
        if (!$('#v-plant').value) return toast('Seleccione una lista.', 'error');
        api('verif_plantilla', { evento_id: id, plantilla_id: $('#v-plant').value }).then(function () { toast('Lista cargada.'); cargar(); }, falla);
      });
    }

    function tSala(c, e, abierto) {
      var s = sala(e.sala_id), planV = 0;
      c.innerHTML = (D.cliente ? '<div id="ev-cli" style="margin-bottom:18px"></div>' : '') + '<div class="sala-ref"><div class="panel"><div class="panel-cab"><h2>Distribución de ' + esc(s.nombre) + '</h2>' +
        (abierto ? '<div class="acciones"><button class="btn btn-sm" id="l-base" type="button">Usar distribución base de la sala</button><button class="btn btn-sm" id="l-copiar" type="button">Copiar de otro evento</button></div>' : '') +
        '</div><div class="panel-cuerpo"><div id="l-editor"></div>' +
        (abierto ? '<div class="editor-pie"><span class="meta" id="l-estado">Arrastre para mover · Seleccione un elemento para girarlo, nombrarlo o quitarlo · Flechas del teclado para ajuste fino</span><div class="acciones"><button class="btn" id="l-descartar" type="button" disabled>Descartar cambios</button><button class="btn btn-oro" id="l-guardar" type="button" disabled>Guardar distribución</button></div></div>' : '') +
        '</div></div>' +
        '<div style="display:flex;flex-direction:column;gap:14px"><figure class="foto-ref" style="margin:0"><img src="assets/salas/' + esc(s.foto) + '" alt="Fotografía de ' + esc(s.nombre) + '" data-zoom><figcaption>' + esc(s.nombre) + ' · fotografía de referencia. En el plano, el borde inferior es la puerta desde donde se tomó la foto y desde donde se mide el largo.</figcaption></figure>' +
        '<figure class="foto-ref" style="margin:0"><img src="assets/estacion-ejemplo.jpg" alt="Ejemplo de estación de entrenamiento" data-zoom><figcaption>Ejemplo de estación: camilla con componente anatómico, mesas de instrumental, torre y monitor.</figcaption></figure></div></div>';
      function crear(items) {
        editor = new Plano.Editor($('#l-editor', c), { sala: s, plano: s.plano, items: items, catalogo: S.base.catalogo, modo: 'items', editable: abierto,
          onChange: function () { S.dirty = true; $('#l-guardar').disabled = false; $('#l-descartar').disabled = false; $('#l-estado').innerHTML = '<span class="sin-guardar">Cambios sin guardar</span>'; } });
      }
      crear(e.layout);
      if (D.cliente) panelClienteEvento($('#ev-cli', c), D, abierto, function (pl) {
        crear(pl.items.map(function (x) { return Object.assign({}, x); })); planV = pl.version; editor.cambio();
        toast('Planificación del cliente (versión ' + pl.version + ') cargada en el editor. Revise y guarde.');
      });
      if (!abierto) return;
      $('#l-guardar').addEventListener('click', function () {
        this.disabled = true;
        api('layout_guardar', { evento_id: id, layout: editor.valor(), plan_version: planV }).then(function () { S.dirty = false; toast('Distribución guardada.'); cargar(); }, function (x) { $('#l-guardar').disabled = false; falla(x); });
      });
      $('#l-descartar').addEventListener('click', function () { S.dirty = false; pintar(); });
      $('#l-base').addEventListener('click', function () {
        if (!s.base.length) return toast('La sala aún no tiene distribución base. La administradora la define en Salas.', 'error');
        crear(s.base.map(function (x) { return Object.assign({}, x, { id: 'i' + Math.random().toString(36).slice(2, 9) }); })); editor.cambio();
      });
      $('#l-copiar').addEventListener('click', function () {
        api('eventos&desde=' + sumar(hoy(), -120) + '&hasta=' + sumar(hoy(), 60)).then(function (j) {
          var otros = j.eventos.filter(function (x) { return +x.sala_id === +e.sala_id && +x.id !== id; }).reverse();
          var m = modal('Copiar distribución', otros.length ? '<label class="campo"><span>Evento de ' + esc(s.nombre) + '</span><select id="x-ev">' + otros.map(function (x) { return '<option value="' + x.id + '">' + fCorta(x.fecha) + ' · ' + esc(x.titulo) + '</option>'; }).join('') + '</select></label>' : '<p>No hay otros eventos en esta sala.</p>',
            '<button class="btn" data-cerrar type="button">Cancelar</button>' + (otros.length ? '<button class="btn btn-verde" id="x-ok" type="button">Copiar</button>' : ''));
          var ok = $('#x-ok', m.el);
          if (ok) ok.onclick = function () {
            api('evento&id=' + $('#x-ev', m.el).value).then(function (k) { m.cerrar(); crear(k.evento.layout.map(function (x) { return Object.assign({}, x, { id: 'i' + Math.random().toString(36).slice(2, 9) }); })); editor.cambio(); toast('Distribución copiada. Revise y guarde.'); }, falla);
          };
        }, falla);
      });
    }

    function tNov(c, e, abierto) {
      var foto = [];
      c.innerHTML = (abierto ? '<div class="panel" style="margin-bottom:18px"><div class="panel-cab"><h2>Registrar novedad</h2><div class="seg" id="n-tipo">' +
        ['Novedad', 'Cambio', 'Incidente', 'Nota'].map(function (t, i) { return '<button type="button" data-t="' + t + '" class="' + (i === 0 ? 'on' : '') + '">' + t + '</button>'; }).join('') + '</div></div>' +
        '<div class="panel-cuerpo" style="display:flex;flex-direction:column;gap:12px"><textarea id="n-texto" maxlength="4000" placeholder="Describa lo ocurrido: qué pasó, en qué estación, qué se hizo."></textarea><div id="n-foto"></div>' +
        '<div class="editor-pie" style="margin:0"><span class="meta">Registra: <b>' + esc(S.yo.nombre) + '</b> · ' + esc(CARGOS[S.yo.rol]) + '. Queda en la bitácora con su nombre y la hora exacta.</span><button class="btn btn-verde" id="n-ok" type="button">Registrar novedad</button></div></div></div>' : '') +
        '<div class="panel">' + (D.novedades.length ? '<ul class="timeline">' + D.novedades.map(function (n) {
          return '<li><div class="tl-hora">' + n.creado_en.slice(11, 16) + '<small>' + fCorta(n.creado_en.slice(0, 10)) + '</small></div><div class="tl-cuerpo"><span class="chip tipo-' + esc(n.tipo) + '">' + esc(n.tipo) + '</span> <span class="meta">Registró <b>' + esc(usuario(n.creado_por).nombre) + '</b> · ' + esc(cargo(n.creado_por)) + '</span>' +
            '<p>' + esc(n.texto) + '</p>' + (n.foto ? '<img class="tl-foto" src="' + archivo(n.foto) + '" alt="Foto de la novedad" data-zoom>' : '') + '</div></li>';
        }).join('') + '</ul>' : '<div class="vacio"><strong>Sin novedades</strong>Aquí aparecen los cambios, incidentes y notas del entrenamiento en orden de hora.</div>') + '</div>';
      if (!abierto) return;
      var tipo = 'Novedad';
      $$('#n-tipo button').forEach(function (b) { b.addEventListener('click', function () { tipo = b.getAttribute('data-t'); $$('#n-tipo button').forEach(function (x) { x.classList.toggle('on', x === b); }); }); });
      selectorFotos($('#n-foto'), foto, 1);
      $('#n-texto').addEventListener('input', function () { S.dirty = !!this.value.trim(); });
      $('#n-ok').addEventListener('click', function () {
        var b = this; b.disabled = true;
        api('novedad', { evento_id: id, tipo: tipo, texto: $('#n-texto').value, foto: foto[0] || null }).then(function () { S.dirty = false; toast('Registro guardado: ' + tipo.toLowerCase() + '.'); cargar(); }, function (x) { b.disabled = false; falla(x); });
      });
    }

    function tInstr(c, e) {
      c.innerHTML = '<div class="panel"><div class="panel-cab"><h2>Instrumental entregado para este evento</h2>' + (esTana() ? '' : '<a class="btn btn-verde btn-sm" href="#/instrumental/nueva/' + e.id + '">+ Registrar entrega</a>') + '</div>' +
        (D.entregas.length ? tablaEntregas(D.entregas) : '<div class="vacio"><strong>Sin entregas registradas</strong>Registre aquí el instrumental o equipo que las casas comerciales entregan para este entrenamiento.</div>') + '</div>';
      enlazarTabla(c);
    }

    function tBit(c) {
      c.innerHTML = '<div class="panel"><ul class="timeline">' + D.bitacora.map(function (b) {
        return '<li><div class="tl-hora">' + b.momento.slice(11, 19) + '<small>' + fCorta(b.momento.slice(0, 10)) + '</small></div><div class="tl-cuerpo"><b>' + esc(b.usuario_nombre) + '</b> · ' + esc(b.accion) + (b.detalle ? '<div class="bit-det">' + esc(b.detalle) + '</div>' : '') + '</div></li>';
      }).join('') + '</ul></div>';
    }

    S.vista = { refrescar: cargar };
    cargar();
  }
  function dato(k, v) { return '<div class="dato"><span>' + esc(k) + '</span><b>' + esc(v) + '</b></div>'; }

  function modalMotivo(titulo, etiqueta, boton, accion, luego) {
    var m = modal(titulo, '<label class="campo"><span class="req">' + esc(etiqueta) + '</span><textarea id="x-mot" maxlength="500"></textarea></label>',
      '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-peligro" id="x-ok" type="button">' + esc(boton) + '</button>');
    $('#x-ok', m.el).onclick = function () { accion($('#x-mot', m.el).value).then(function () { m.cerrar(); toast('Listo. Quedó registrado en la bitácora.'); luego(); }, function (x) { errorEn(m, x.error); }); };
  }

  function modalCierre(D, soyResp, luego) {
    var e = D.evento, resp = usuario(e.responsable_id).nombre;
    if (!soyResp) {
      modal('Cerrar y firmar', '<p style="margin:0">El cierre de este evento lo firma <b>' + esc(resp) + '</b>, instrumentador a cargo. Pídale que ingrese con su usuario para firmar.' +
        (esAdmin() ? '<br><br>Si otra persona debe firmar, cambie primero el instrumentador a cargo con «Editar datos».' : '') + '</p>', '<button class="btn" data-cerrar type="button">Entendido</button>');
      return;
    }
    var pend = D.verificacion.filter(function (x) { return x.estado === 'pendiente'; }).length, no = D.verificacion.filter(function (x) { return x.estado === 'no'; }).length;
    var custodia = D.entregas.filter(function (x) { return x.estado === 'En custodia'; }).length;
    var partesAct = (D.asignaciones || []).filter(function (x) { return x.estado === 'Reservada' || x.estado === 'En uso'; }).length;
    var m = modal('Cerrar y firmar el evento',
      '<div class="panel" style="box-shadow:none"><div class="datos-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
        dato('Ítems verificados', (D.verificacion.length - pend) + ' de ' + D.verificacion.length) + dato('No cumplen', no) +
        dato('Novedades registradas', D.novedades.length) + dato('Instrumental aún en custodia', custodia) + dato('Componentes asignados', (D.asignaciones || []).length) + dato('Partes sin devolver a morgue', partesAct) + '</div></div>' +
      (partesAct ? '<p class="form-error" style="background:var(--alerta-suave);color:var(--alerta)">Hay ' + partesAct + ' partes anatómicas reservadas o en sala. Recuerde registrar su devolución a morgue (se puede hacer también después del cierre).</p>' : '') +
      (pend ? '<label class="check" style="background:var(--alerta-suave);padding:10px 12px;border-radius:8px"><input type="checkbox" id="x-pend"><span>Hay <b>' + pend + '</b> ítems de verificación pendientes. Cerrar de todas formas (quedará indicado en el informe).</span></label>' : '') +
      '<label class="campo"><span>Observaciones de cierre</span><textarea id="x-obs" maxlength="4000" placeholder="Resumen final, estado en que queda la sala, pendientes para el siguiente turno…"></textarea></label>' +
      '<div class="campo"><span class="req">Firma de ' + esc(resp) + '</span><div id="x-firma"></div></div>' +
      '<label class="campo"><span class="req">Su contraseña</span><input type="password" id="x-clave" autocomplete="current-password"><small>Confirma que es usted quien firma.</small></label>' +
      '<label class="check"><input type="checkbox" id="x-conf"><span>Confirmo que el entrenamiento finalizó y que la información registrada es correcta. Después del cierre no se pueden hacer cambios.</span></label>',
      '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-oro" id="x-ok" type="button">Firmar y cerrar evento</button>', { ancho: true, sinFoco: true });
    var firma = new Firma($('#x-firma', m.el));
    $('#x-ok', m.el).onclick = function () {
      if (!$('#x-conf', m.el).checked) return errorEn(m, 'Marque la confirmación de finalización.');
      var f = firma.valor(); if (!f) return errorEn(m, 'Falta la firma.');
      if (pend && !$('#x-pend', m.el).checked) return errorEn(m, 'Confirme que desea cerrar con ítems pendientes.');
      var b = this; b.disabled = true;
      api('evento_cerrar', { id: e.id, firma: f, obs: $('#x-obs', m.el).value, clave: $('#x-clave', m.el).value, aceptar_pendientes: !!pend }).then(function () {
        m.cerrar(); toast('<b>Evento cerrado y firmado.</b> Ya puede descargar el informe.'); luego();
      }, function (x) { b.disabled = false; errorEn(m, x.error); });
    };
  }

  // ================================================================== SALAS
  function vSalas() {
    montar('<div class="vista-cab"><div><div class="eyebrow">Espacios</div><h1>Salas de entrenamiento</h1><p>' + S.base.salas.length + ' salas con su plano y distribución base. ' + (esAdmin() ? 'Abra una sala para ajustar medidas, plano o distribución base.' : '') + '</p></div></div>' +
      '<div class="salas-grid">' + S.base.salas.map(function (s) {
        return '<a class="sala-card" href="#/sala/' + s.id + '"><div class="sala-card-top"><h3>' + esc(s.nombre) + '</h3><span class="num" style="font-size:.85rem;color:#cfe0d4">' + (s.ancho / 100).toFixed(2).replace('.', ',') + ' × ' + (s.largo / 100).toFixed(2).replace('.', ',') + ' × ' + ((s.alto || 280) / 100).toFixed(2).replace('.', ',') + ' m</span></div>' +
          '<img src="assets/salas/' + esc(s.foto) + '" alt="" style="aspect-ratio:16/9;object-fit:cover;width:100%;display:block">' +
          '<div class="sala-card-plano">' + Plano.svg({ sala: s, plano: s.plano, items: s.base, catalogo: S.base.catalogo, cotas: false, etiquetas: false }) + '</div></a>';
      }).join('') + '</div>');
    S.vista = { refrescar: vSalas };
  }
  function vSala(p) {
    var id = +p[0], modo = p[1] || 'base', ed = null;
    function pintar() {
      var s = sala(id), adm = esAdmin();
      api('eventos&desde=' + hoy() + '&hasta=' + sumar(hoy(), 30)).then(function (j) {
        var prox = j.eventos.filter(function (e) { return +e.sala_id === id && e.estado !== 'cancelado'; });
        montar('<a class="miga" href="#/salas">← Salas</a><div class="vista-cab"><div><div class="eyebrow">Sala</div><h1>' + esc(s.nombre) + '</h1><p class="num">' + (s.ancho / 100).toFixed(2).replace('.', ',') + ' m de ancho × ' + (s.largo / 100).toFixed(2).replace('.', ',') + ' m de largo × ' + ((s.alto || 280) / 100).toFixed(2).replace('.', ',') + ' m de alto' + (s.notas ? ' · ' + esc(s.notas) : '') + '</p></div>' +
          (adm ? '<div class="acciones"><button class="btn" id="s-datos" type="button">Nombre y medidas</button></div>' : '') + '</div>' +
          (adm ? '<nav class="tabs"><a href="#/sala/' + id + '/base" class="' + (modo === 'base' ? 'is-on' : '') + '">Distribución base</a><a href="#/sala/' + id + '/plano" class="' + (modo === 'plano' ? 'is-on' : '') + '">Plano arquitectónico</a></nav>' : '') +
          '<div class="sala-ref"><div class="panel"><div class="panel-cuerpo"><p class="meta" style="margin:0 0 10px">' +
          (modo === 'plano' ? 'Ubique puertas, ventanas, columnas, televisores, rejillas y tomas tal como están en la sala real. Estos elementos no se mueven en los eventos.' : 'La distribución base es el punto de partida que se carga en cada entrenamiento nuevo de esta sala.') + '</p>' +
          '<div id="s-editor"></div>' + (adm ? '<div class="editor-pie"><span class="meta" id="s-estado">Sin cambios</span><button class="btn btn-oro" id="s-guardar" type="button" disabled>Guardar</button></div>' : '') + '</div></div>' +
          '<div style="display:flex;flex-direction:column;gap:14px"><figure class="foto-ref" style="margin:0"><img src="assets/salas/' + esc(s.foto) + '" alt="Fotografía de ' + esc(s.nombre) + '" data-zoom><figcaption>Fotografía de referencia de ' + esc(s.nombre) + '.</figcaption></figure>' +
          '<div class="panel"><div class="panel-cab"><h2>Próximos 30 días</h2></div>' + listaEventos(prox, 'Sin entrenamientos programados.', true) + '</div></div></div>');
        ed = new Plano.Editor($('#s-editor'), { sala: s, plano: s.plano, items: s.base, catalogo: S.base.catalogo, modo: modo === 'plano' ? 'plano' : 'items', editable: adm,
          onChange: function () { S.dirty = true; $('#s-guardar').disabled = false; $('#s-estado').innerHTML = '<span class="sin-guardar">Cambios sin guardar</span>'; } });
        if (!adm) return;
        $('#s-guardar').onclick = function () {
          var d = { id: s.id, nombre: s.nombre, ancho: s.ancho, largo: s.largo, alto: s.alto, notas: s.notas };
          if (modo === 'plano') d.plano = ed.valor(); else d.base = ed.valor();
          api('sala_guardar', d).then(function () { S.dirty = false; toast('Sala guardada.'); return cargarBase(); }).then(pintar, falla);
        };
        $('#s-datos').onclick = function () {
          var m = modal('Datos de ' + s.nombre, '<div class="form-grid"><label class="campo ancho"><span>Nombre</span><input id="x-n" maxlength="80" value="' + esc(s.nombre) + '"></label>' +
            '<label class="campo"><span>Ancho (cm)</span><input type="number" id="x-a" value="' + s.ancho + '"><small>Pared izquierda a derecha, vista desde la puerta de la foto.</small></label>' +
            '<label class="campo"><span>Largo (cm)</span><input type="number" id="x-l" value="' + s.largo + '"><small>Desde la puerta de la foto hasta la pared del fondo.</small></label>' +
            '<label class="campo"><span>Altura (cm)</span><input type="number" id="x-h" value="' + (s.alto || 280) + '"><small>Del piso al techo.</small></label>' +
            '<label class="campo ancho"><span>Notas</span><textarea id="x-t" maxlength="2000">' + esc(s.notas || '') + '</textarea></label></div>',
            '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar</button>');
          $('#x-ok', m.el).onclick = function () {
            api('sala_guardar', { id: s.id, nombre: $('#x-n', m.el).value, ancho: $('#x-a', m.el).value, largo: $('#x-l', m.el).value, alto: $('#x-h', m.el).value, notas: $('#x-t', m.el).value })
              .then(function () { m.cerrar(); toast('Sala actualizada.'); return cargarBase(); }, function (x) { errorEn(m, x.error); throw x; }).then(pintar, function () {});
          };
        };
      }, falla);
    }
    S.vista = { refrescar: function () { cargarBase().then(pintar); } };
    pintar();
  }

  // ================================================================== INSTRUMENTAL
  function tablaEntregas(rows) {
    return '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Fecha</th><th>Empresa</th><th>Entrega</th><th>Recibe</th><th>Equipos / instrumental</th><th>Ubicación</th><th>Fecha estimada</th><th>Estado</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var its = (r.items || []).map(function (i) { return i.cant + ' × ' + i.desc; });
        return '<tr class="clic" data-ent="' + r.id + '"><td class="num" style="white-space:nowrap">' + momento(r.fecha_hora) + '</td><td><b>' + esc(r.empresa) + '</b>' + (r.evento_titulo ? '<div class="meta">' + esc(r.evento_titulo) + '</div>' : '') + '</td>' +
          '<td>' + esc(r.entrega_nombre) + '</td><td>' + esc(r.recibe_nombre) + '</td><td>' + esc(its.slice(0, 3).join(' · ')) + (its.length > 3 ? ' <span class="meta">+' + (its.length - 3) + ' más</span>' : '') + '</td>' +
          '<td>' + esc(r.ubicacion) + '</td><td>' + fechaEstRem(r) + '</td><td><span class="chip ' + (r.estado === 'Devuelto' ? 'st-devuelto' : 'st-custodia') + '">' + esc(r.estado) + '</span></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  // Fecha estimada de devolución y/o entrega de la remisión (vencida en rojo, próxima en ámbar).
  function fechaEstRem(r) {
    if (!r.fecha_estimada) return '<span class="meta">Sin fecha</span>';
    var n = diasPara(r.fecha_estimada), dev = r.estado === 'Devuelto';
    var cls = dev ? '' : n < 0 ? 'rem-venc' : n <= 2 ? 'rem-prox' : '';
    return '<span class="meta">' + esc(r.fecha_estimada_tipo || 'Devolución') + '</span><br>' + (cls ? '<span class="chip ' + cls + '">' : '<b>') + esc(fCorta(r.fecha_estimada)) + (dev ? '' : ' · ' + faltan(r.fecha_estimada)) + (cls ? '</span>' : '</b>');
  }
  function enlazarTabla(c) { $$('[data-ent]', c).forEach(function (tr) { tr.addEventListener('click', function () { location.hash = '#/entrega/' + tr.getAttribute('data-ent'); }); }); }

  function vInstrumental(p) {
    if (p[0] === 'nueva') return vEntregaNueva(+p[1] || 0);
    var q = '', filtro = 'todas';
    function cargar() {
      return api('entregas&q=' + encodeURIComponent(q)).then(function (j) {
        var rows = j.entregas.filter(function (r) { return filtro === 'todas' || (filtro === 'custodia' ? r.estado === 'En custodia' : r.estado === 'Devuelto'); });
        var nC = j.entregas.filter(function (r) { return r.estado === 'En custodia'; }).length;
        $('#i-lista').innerHTML = rows.length ? tablaEntregas(rows) : '<div class="vacio"><strong>' + (q ? 'Sin resultados' : 'Aún no hay remisiones registradas') + '</strong>' + (q ? 'Pruebe con otra palabra.' : 'Registre la primera remisión de instrumental con «Nueva remisión».') + '</div>';
        $('#i-n').textContent = nC;
        enlazarTabla($('#i-lista'));
      }, falla);
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">Control y entrega</div><h1>Remisiones</h1><p>Instrumental y equipos que dejan las casas comerciales, con firmas, fotos, ubicación y fecha estimada de devolución y/o entrega. <b id="i-n">0</b> en custodia de CLEMI ahora.</p></div>' +
      (esTana() ? '' : '<a class="btn btn-oro" href="#/instrumental/nueva">+ Nueva remisión</a>') + '</div>' +
      '<div class="panel"><div class="panel-cab"><div class="seg" id="i-f"><button type="button" data-f="todas" class="on">Todas</button><button type="button" data-f="custodia">En custodia</button><button type="button" data-f="devuelto">Devueltas</button></div>' +
      '<input type="search" id="i-q" placeholder="Buscar empresa, persona, instrumento, ubicación…" style="max-width:360px"></div><div id="i-lista"><div class="vacio">Cargando…</div></div></div>');
    var t; $('#i-q').addEventListener('input', function () { clearTimeout(t); var v = this.value; t = setTimeout(function () { q = v; cargar(); }, 300); });
    $$('#i-f button').forEach(function (b) { b.addEventListener('click', function () { filtro = b.getAttribute('data-f'); $$('#i-f button').forEach(function (x) { x.classList.toggle('on', x === b); }); cargar(); }); });
    S.vista = { refrescar: cargar };
    cargar();
  }

  function vEntregaNueva(eventoId) {
    var items = [{ desc: '', ref: '', cant: 1, estado: 'Bueno' }], fotos = [];
    api('eventos&desde=' + sumar(hoy(), -7) + '&hasta=' + sumar(hoy(), 30)).then(function (j) {
      var evs = j.eventos.filter(function (e) { return e.estado !== 'cancelado' && e.estado !== 'cerrado'; });
      var yo = S.base.usuarios.find(function (u) { return +u.id === +S.yo.id; }) || S.yo;
      montar('<a class="miga" href="#/instrumental">← Remisiones</a><div class="vista-cab"><div><div class="eyebrow">Nuevo registro</div><h1>Remisión de instrumental</h1><p>La fecha y hora se registran automáticamente al guardar, con su nombre.</p></div></div>' +
        '<form class="panel" id="ent-form" novalidate>' +
        '<div class="paso"><div class="paso-n">1</div><div><h3>Datos generales</h3><div class="form-grid">' +
          '<label class="campo"><span class="req">Nombre de la empresa</span><input id="d-empresa" maxlength="200" placeholder="Casa comercial que entrega"></label>' +
          '<label class="campo"><span class="req">Fecha estimada de devolución y/o entrega</span><input id="d-fest" type="date" value="' + sumar(hoy(), 3) + '"></label>' +
          '<label class="campo"><span>Se espera</span><select id="d-ftipo"><option>Devolución</option><option>Entrega</option><option>Devolución y entrega</option></select></label>' +
          '<label class="campo"><span>Evento / entrenamiento</span><select id="d-evento"><option value="">Sin evento asociado</option>' + evs.map(function (e) { return '<option value="' + e.id + '"' + (+e.id === eventoId ? ' selected' : '') + '>' + fCorta(e.fecha) + ' · ' + esc(sala(e.sala_id).nombre) + ' · ' + esc(e.titulo) + '</option>'; }).join('') + '</select></label>' +
        '</div></div></div>' +
        '<div class="paso"><div class="paso-n">2</div><div><h3>Quién entrega</h3><div class="form-grid">' +
          '<label class="campo"><span class="req">Nombre completo</span><input id="d-en" maxlength="150"></label>' +
          '<label class="campo"><span class="req">Cédula</span><input id="d-ec" maxlength="30" inputmode="numeric"></label>' +
          '<label class="campo"><span>Cargo</span><input id="d-ecargo" maxlength="120" placeholder="Ej. Especialista de producto"></label>' +
          '<label class="campo"><span>Teléfono</span><input id="d-etel" maxlength="40" inputmode="tel"></label>' +
          '<div class="campo ancho"><span class="req">Firma de quien entrega</span><div id="d-ef"></div></div>' +
        '</div></div></div>' +
        '<div class="paso"><div class="paso-n">3</div><div><h3>Equipos e instrumental entregado</h3><div class="tabla-wrap"><table class="items-tabla"><thead><tr><th>Descripción</th><th>Referencia / lote</th><th class="cant">Cantidad</th><th class="est">Estado</th><th></th></tr></thead><tbody id="d-items"></tbody></table></div>' +
          '<button type="button" class="btn btn-sm" id="d-mas" style="margin-top:8px">+ Agregar otro</button></div></div>' +
        '<div class="paso"><div class="paso-n">4</div><div><h3>Dónde se deja</h3><label class="campo"><span class="req">Ubicación del equipo / instrumental</span><textarea id="d-ubic" maxlength="500" placeholder="Ej. Sala 3, mesa auxiliar junto a la ventana interior, en contenedor morado sellado"></textarea></label>' +
          '<div class="ubic-rapida">' + S.base.salas.map(function (s) { return '<button type="button" class="pl-chip" data-ub="' + esc(s.nombre) + '">' + esc(s.nombre) + '</button>'; }).join('') + '</div></div></div>' +
        '<div class="paso"><div class="paso-n">5</div><div><h3>Quién recibe</h3><div class="form-grid">' +
          '<label class="campo"><span class="req">Recibe</span><select id="d-rid">' + S.base.usuarios.filter(function (u) { return +u.activo; }).map(function (u) { return '<option value="' + u.id + '"' + (+u.id === +S.yo.id ? ' selected' : '') + '>' + esc(u.nombre) + '</option>'; }).join('') + '<option value="0">Otra persona</option></select></label>' +
          '<label class="campo"><span class="req">Nombre</span><input id="d-rn" maxlength="150" value="' + esc(yo.nombre) + '"></label>' +
          '<div class="campo ancho"><span class="req">Firma de quien recibe</span><div id="d-rf"></div></div>' +
        '</div></div></div>' +
        '<div class="paso"><div class="paso-n">6</div><div><h3>Fotos de la entrega y observaciones</h3><div id="d-fotos"></div>' +
          '<label class="campo" style="margin-top:14px"><span>Observaciones</span><textarea id="d-obs" maxlength="4000" placeholder="Estado de los contenedores, faltantes, condiciones acordadas…"></textarea></label></div></div>' +
        '<div class="paso" style="grid-template-columns:1fr"><p class="form-error" id="d-err" hidden></p><div class="acciones" style="justify-content:flex-end"><a class="btn" href="#/instrumental">Cancelar</a><button class="btn btn-oro" type="submit" id="d-ok">Guardar entrega con firmas</button></div></div>' +
        '</form>');
      var fE = new Firma($('#d-ef')), fR = new Firma($('#d-rf'));
      function pintarItems() {
        $('#d-items').innerHTML = items.map(function (it, i) {
          return '<tr><td><input data-i="' + i + '" data-k="desc" maxlength="300" value="' + esc(it.desc) + '" placeholder="Ej. Set de artroscopia de rodilla"></td>' +
            '<td><input data-i="' + i + '" data-k="ref" maxlength="80" value="' + esc(it.ref) + '"></td>' +
            '<td class="cant"><input type="number" min="1" data-i="' + i + '" data-k="cant" value="' + it.cant + '"></td>' +
            '<td class="est"><select data-i="' + i + '" data-k="estado">' + ['Bueno', 'Regular', 'Con daño', 'Incompleto'].map(function (o) { return '<option' + (o === it.estado ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></td>' +
            '<td>' + (items.length > 1 ? '<button type="button" class="quitar" data-q="' + i + '" aria-label="Quitar">×</button>' : '') + '</td></tr>';
        }).join('');
        $$('#d-items [data-k]').forEach(function (el) { el.addEventListener('input', function () { items[+el.getAttribute('data-i')][el.getAttribute('data-k')] = el.value; }); });
        $$('#d-items [data-q]').forEach(function (b) { b.addEventListener('click', function () { items.splice(+b.getAttribute('data-q'), 1); pintarItems(); }); });
      }
      pintarItems();
      $('#d-mas').onclick = function () { items.push({ desc: '', ref: '', cant: 1, estado: 'Bueno' }); pintarItems(); $$('#d-items input[data-k=desc]').pop().focus(); };
      $$('[data-ub]').forEach(function (b) { b.addEventListener('click', function () { var t = $('#d-ubic'); t.value = (t.value ? t.value.replace(/\s+$/, '') + ' · ' : '') + b.getAttribute('data-ub'); t.focus(); }); });
      $('#d-rid').addEventListener('change', function () {
        var u = S.base.usuarios.find(function (x) { return +x.id === +this.value; }, this);
        $('#d-rn').value = u ? u.nombre : '';
      });
      selectorFotos($('#d-fotos'), fotos, 12);
      $('#ent-form').addEventListener('input', function () { S.dirty = true; });
      $('#ent-form').addEventListener('submit', function (ev) {
        ev.preventDefault();
        var err = $('#d-err'); err.hidden = true;
        var d = {
          evento_id: $('#d-evento').value, empresa: $('#d-empresa').value, entrega_nombre: $('#d-en').value, entrega_cedula: $('#d-ec').value, fecha_estimada: $('#d-fest').value, fecha_estimada_tipo: $('#d-ftipo').value,
          entrega_cargo: $('#d-ecargo').value, entrega_telefono: $('#d-etel').value, entrega_firma: fE.valor(),
          recibe_id: $('#d-rid').value, recibe_nombre: $('#d-rn').value, recibe_firma: fR.valor(),
          ubicacion: $('#d-ubic').value, items: items, observaciones: $('#d-obs').value, fotos: fotos
        };
        var btn = $('#d-ok'); btn.disabled = true; btn.textContent = 'Guardando…';
        api('entrega_guardar', d).then(function (j) { S.dirty = false; toast('<b>Remisión registrada</b> con firmas y ' + fotos.length + ' fotos.'); S.actaAuto = j.id; location.hash = '#/entrega/' + j.id; },
          function (x) { btn.disabled = false; btn.textContent = 'Guardar entrega con firmas'; err.textContent = x.error; err.hidden = false; err.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
      });
    }, falla);
    S.vista = { refrescar: function () {} };
  }

  function vEntrega(p) {
    var id = +p[0];
    function cargar() {
      return api('entrega&id=' + id).then(function (j) {
        var r = j.entrega, dev = r.estado === 'Devuelto';
        var fotosPor = function (mom) { return r.fotos.filter(function (f) { return f.momento === mom; }); };
        var galeria = function (fs) {
          return fs.length ? '<div class="fotos">' + fs.map(function (f) { return '<figure><img src="' + archivo(f.archivo) + '" alt="Foto" data-zoom loading="lazy"><figcaption>' + esc(usuario(f.creado_por).nombre.split(' ')[0]) + ' · ' + momento(f.creado_en) + '</figcaption></figure>'; }).join('') + '</div>' : '<p class="meta" style="margin:0">Sin fotos.</p>';
        };
        montar('<a class="miga" href="#/instrumental">← Remisiones</a><div class="vista-cab"><div><div class="eyebrow">Remisión Nº ' + r.id + ' · ' + momento(r.fecha_hora) + '</div><h1>' + esc(r.empresa) + '</h1>' +
          '<p><span class="chip ' + (dev ? 'st-devuelto' : 'st-custodia') + '">' + esc(r.estado) + '</span>' + (r.evento_titulo ? ' · Evento: <a href="#/evento/' + r.evento_id + '">' + esc(r.evento_titulo) + '</a>' : '') + '</p></div>' +
          '<div class="acciones"><button class="btn btn-oro" id="r-acta" type="button">Acta de entrega</button>' + (dev ? '<button class="btn btn-oro" id="r-acta-dev" type="button">Acta de devolución</button>' : '') + (!dev && !esTana() ? '<button class="btn" id="r-ubic" type="button">Cambiar ubicación</button><button class="btn" id="r-foto" type="button">Agregar foto</button><button class="btn btn-verde" id="r-dev" type="button">Registrar devolución</button>' : '') + '</div></div>' +
          '<div class="dos-col"><div style="display:flex;flex-direction:column;gap:18px">' +
            '<div class="panel"><div class="panel-cab"><h2>Equipos e instrumental</h2></div><div class="tabla-wrap"><table class="tabla"><thead><tr><th>Descripción</th><th>Ref. / lote</th><th>Cant.</th><th>Estado</th></tr></thead><tbody>' +
              r.items.map(function (i) { return '<tr><td>' + esc(i.desc) + '</td><td>' + esc(i.ref || '—') + '</td><td class="num">' + i.cant + '</td><td>' + esc(i.estado) + '</td></tr>'; }).join('') + '</tbody></table></div></div>' +
            '<div class="panel"><div class="panel-cab"><h2>Fecha estimada de ' + esc((r.fecha_estimada_tipo || 'Devolución').toLowerCase()) + '</h2>' + (!dev && !esTana() ? '<button class="btn btn-sm" id="r-fest" type="button">Cambiar</button>' : '') + '</div><div class="panel-cuerpo">' + (r.fecha_estimada ? '<b>' + esc(fLarga(r.fecha_estimada)) + '</b> ' + fechaEstRem(r).replace(/^.*<br>/, '') : '<span class="meta">Sin fecha estimada registrada.</span>') + '</div></div>' +
            '<div class="panel"><div class="panel-cab"><h2>Ubicación</h2></div><div class="panel-cuerpo" style="white-space:pre-line;font-weight:600">' + esc(r.ubicacion) + '</div></div>' +
            (r.observaciones ? '<div class="panel"><div class="panel-cab"><h2>Observaciones</h2></div><div class="panel-cuerpo" style="white-space:pre-line">' + esc(r.observaciones) + '</div></div>' : '') +
            '<div class="panel"><div class="panel-cab"><h2>Fotos de la entrega</h2></div><div class="panel-cuerpo">' + galeria(fotosPor('Entrega').concat(fotosPor('Seguimiento'))) + '</div></div>' +
          '</div><div style="display:flex;flex-direction:column;gap:18px">' +
            '<div class="panel"><div class="panel-cab"><h2>Firmas de entrega</h2></div><div class="panel-cuerpo firmas-par">' +
              bloqueFirma('Entrega (empresa)', r.entrega_nombre, r.entrega_cedula, r.entrega_firma, [r.entrega_cargo, r.entrega_telefono].filter(Boolean).join(' · ')) +
              bloqueFirma('Recibe (CLEMI)', r.recibe_nombre, r.recibe_cedula, r.recibe_firma) + '</div></div>' +
            (dev ? '<div class="panel"><div class="panel-cab"><h2>Devolución · ' + momento(r.dev_fecha_hora) + '</h2><span class="chip ' + (r.dev_novedad === 'Con novedades' ? 'st-custodia' : 'st-devuelto') + '">' + esc(r.dev_novedad || 'Sin novedades') + '</span></div>' +
              ((r.dev_items || []).length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Elemento</th><th>Entregado</th><th>Devuelto</th><th>Estado</th><th>Novedad</th></tr></thead><tbody>' + r.dev_items.map(function (i) {
                return '<tr' + (i.estado !== 'Completo' ? ' style="background:var(--alerta-suave)"' : '') + '><td>' + esc(i.desc) + '</td><td class="num">' + i.cant + '</td><td class="num"><b>' + i.cant_dev + '</b></td><td>' + esc(i.estado) + '</td><td>' + esc(i.nota || '—') + '</td></tr>';
              }).join('') + '</tbody></table></div>' : '') +
              '<div class="panel-cuerpo" style="display:flex;flex-direction:column;gap:14px"><div class="firmas-par">' +
              bloqueFirma('Devuelve (CLEMI)', r.dev_entrega_nombre, r.dev_entrega_cedula, r.dev_entrega_firma) + bloqueFirma('Recibe (empresa)', r.dev_recibe_nombre, r.dev_recibe_cedula, r.dev_recibe_firma) + '</div>' +
              (r.dev_obs ? '<p style="margin:0;white-space:pre-line">' + esc(r.dev_obs) + '</p>' : '') + galeria(fotosPor('Devolución')) + '</div></div>' : '') +
            '<div class="panel"><div class="panel-cab"><h2>Seguimiento</h2></div><ul class="timeline">' + r.bitacora.map(function (b) {
              return '<li><div class="tl-hora">' + b.momento.slice(11, 16) + '<small>' + fCorta(b.momento.slice(0, 10)) + '</small></div><div class="tl-cuerpo"><b>' + esc(b.usuario_nombre) + '</b> · ' + esc(b.accion) + (b.detalle ? '<div class="bit-det">' + esc(b.detalle) + '</div>' : '') + '</div></li>';
            }).join('') + '</ul></div>' +
          '</div></div>');
        $('#r-acta').onclick = function () { modalActa(r); };
        if ($('#r-acta-dev')) $('#r-acta-dev').onclick = function () { modalActa(r, false, 'devolucion'); };
        if (S.actaAuto === r.id) { S.actaAuto = null; modalActa(r, true); }
        if (S.actaDevAuto === r.id && dev) { S.actaDevAuto = null; modalActa(r, true, 'devolucion'); }
        if (dev || esTana()) return;
        if ($('#r-fest')) $('#r-fest').onclick = function () {
          var m = modal('Fecha estimada', '<div class="form-grid"><label class="campo"><span class="req">Fecha estimada</span><input id="x-f" type="date" value="' + esc(r.fecha_estimada || sumar(hoy(), 1)) + '"></label><label class="campo"><span>Se espera</span><select id="x-t">' + ['Devolución', 'Entrega', 'Devolución y entrega'].map(function (t) { return '<option' + (t === r.fecha_estimada_tipo ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label></div>',
            '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar</button>');
          $('#x-ok', m.el).onclick = function () { api('entrega_fecha', { id: id, fecha_estimada: $('#x-f', m.el).value, fecha_estimada_tipo: $('#x-t', m.el).value }).then(function () { m.cerrar(); toast('Fecha estimada actualizada.'); cargar(); }, function (x) { errorEn(m, x.error); }); };
        };
        $('#r-ubic').onclick = function () {
          var m = modal('Cambiar ubicación', '<p class="meta" style="margin:0">Ubicación actual: <b>' + esc(r.ubicacion) + '</b></p><label class="campo"><span class="req">Nueva ubicación</span><textarea id="x-u" maxlength="500"></textarea></label>',
            '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar</button>');
          $('#x-ok', m.el).onclick = function () { api('entrega_ubicacion', { id: id, ubicacion: $('#x-u', m.el).value }).then(function () { m.cerrar(); toast('Ubicación actualizada.'); cargar(); }, function (x) { errorEn(m, x.error); }); };
        };
        $('#r-foto').onclick = function () {
          var fs = [], m = modal('Agregar foto', '<div id="x-f"></div>', '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Subir</button>');
          selectorFotos($('#x-f', m.el), fs, 6);
          $('#x-ok', m.el).onclick = function () {
            if (!fs.length) return errorEn(m, 'Seleccione al menos una foto.');
            var b = this; b.disabled = true;
            fs.reduce(function (pr, f) { return pr.then(function () { return api('entrega_foto', { id: id, momento: 'Seguimiento', foto: f }); }); }, Promise.resolve())
              .then(function () { S.dirty = false; m.cerrar(); toast('Fotos agregadas.'); cargar(); }, function (x) { b.disabled = false; errorEn(m, x.error); });
          };
        };
        $('#r-dev').onclick = function () { modalDevolucion(r, cargar); };
      }, function (e) { montar('<div class="vacio"><strong>No se pudo abrir la entrega</strong>' + esc(e.error) + '</div>'); });
    }
    S.vista = { refrescar: cargar };
    cargar();
  }
  // ------------------------------------------------------------ acta de entrega en PDF
  function guardarArchivo(blob, nombre) {
    if (window.CLEMI_DEMO && window.claude && window.claude.use) {
      return window.claude.use('downloads').then(function (dl) {
        if (!dl) throw { error: 'La descarga no está disponible en esta vista.' };
        return dl.save({ filename: nombre, data: blob }).then(function () { toast('Archivo descargado.'); }, function (e) {
          if (e && e.code === 'declined') return; throw { error: 'No se pudo descargar el acta.' };
        });
      });
    }
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    return Promise.resolve();
  }
  function modalActa(r, recien, tipo) {
    var esDev = tipo === 'devolucion';
    var m = modal((esDev ? 'Acta de devolución Nº ' : 'Acta de entrega Nº ') + r.id,
      (recien ? '<p class="form-error" style="background:var(--ok-suave);color:var(--ok)">' + (esDev ? 'Devolución registrada' : 'Entrega registrada') + '. Esta es el acta en PDF para imprimir o enviar.</p>' : '') +
      '<div id="acta-vista" class="acta-vista"><div class="vacio">Generando el acta…</div></div>',
      '<button class="btn" data-cerrar type="button">Cerrar</button>' +
      (window.CLEMI_DEMO ? '' : '<button class="btn" id="acta-imp" type="button" disabled>Abrir para imprimir</button>') +
      '<button class="btn" id="acta-comp" type="button" hidden>Compartir / enviar</button>' +
      '<button class="btn btn-oro" id="acta-desc" type="button" disabled>Descargar PDF</button>', { ancho: true, sinFoco: true });
    var datos = Object.assign({}, r, { evento_titulo: r.evento_titulo });
    window.ActaPDF.crear(datos, { tipo: tipo, archivo: archivo, nombre: function (id) { return usuario(id).nombre; }, generadoPor: S.yo.nombre, ahora: ahoraTxt() }).then(function (res) {
      var blob = res.doc.output('blob'), url = URL.createObjectURL(blob), vista = $('#acta-vista', m.el);
      if (window.pdfjsLib) {
        vista.innerHTML = '';
        window.pdfjsLib.getDocument({ data: new Uint8Array(res.doc.output('arraybuffer')) }).promise.then(function (pdf) {
          var cadena = Promise.resolve();
          for (var i = 1; i <= pdf.numPages; i++) (function (n) {
            cadena = cadena.then(function () { return pdf.getPage(n); }).then(function (pg) {
              var vp = pg.getViewport({ scale: 1.6 }), c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
              vista.appendChild(c); return pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
            });
          })(i);
        }).catch(function () { vista.innerHTML = '<iframe title="Vista previa del acta" src="' + url + '#view=FitH"></iframe>'; });
      } else {
        vista.innerHTML = '<iframe title="Vista previa del acta" src="' + url + '#view=FitH"></iframe>';
      }
      var d = $('#acta-desc', m.el); d.disabled = false; d.onclick = function () { guardarArchivo(blob, res.nombre).catch(falla); };
      var ip = $('#acta-imp', m.el); if (ip) { ip.disabled = false; ip.onclick = function () { window.open(url, '_blank'); }; }
      try {
        var file = new File([blob], res.nombre, { type: 'application/pdf' });
        if (!window.CLEMI_DEMO && navigator.canShare && navigator.canShare({ files: [file] })) {
          var cp = $('#acta-comp', m.el); cp.hidden = false;
          cp.onclick = function () { navigator.share({ files: [file], title: (esDev ? 'Acta de devolución Nº ' : 'Acta de entrega Nº ') + r.id, text: (esDev ? 'Acta de devolución de instrumental · ' : 'Acta de entrega de instrumental · ') + r.empresa }).catch(function () {}); };
        }
      } catch (e) {}
    }, function (e) { $('#acta-vista', m.el).innerHTML = '<p class="form-error">' + esc((e && e.error) || 'No se pudo generar el acta.') + '</p>'; });
  }
  function ahoraTxt() { var d = new Date(); return iso(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  function bloqueFirma(t, nombre, cedula, firma, extra) {
    return '<div class="firma-bloque"><h4>' + esc(t) + '</h4><img class="firma-img" src="' + archivo(firma) + '" alt="Firma de ' + esc(nombre) + '"><div style="margin-top:8px;font-weight:700">' + esc(nombre) + '</div><div class="meta">' + [cedula ? 'C.C. ' + esc(cedula) : '', extra ? esc(extra) : ''].filter(Boolean).join(' · ') + '</div></div>';
  }
  function modalDevolucion(r, luego) {
    var yo = S.base.usuarios.find(function (u) { return +u.id === +S.yo.id; }) || S.yo, fs = [], nov = 'Sin novedades';
    var its = (r.items || []).map(function (it) { return { desc: it.desc, ref: it.ref, cant: +it.cant, dev: +it.cant, estado: 'Completo', nota: '' }; });
    var EST = ['Completo', 'Faltante', 'Con daño', 'Incompleto', 'No devuelto'];
    var m = modal('Devolución a ' + r.empresa,
      '<p class="meta" style="margin:0">Revise cada elemento con la persona de la empresa. Si algo no se devuelve completo o en buen estado, marque el estado y escriba la novedad. Al registrar se genera el <b>acta de devolución</b> en PDF.</p>' +
      '<div class="campo"><span class="req">Revisión del instrumental y equipos</span><div class="tabla-wrap"><table class="items-tabla dev-tabla"><thead><tr><th>Elemento</th><th class="cant">Entregado</th><th class="cant">Devuelto</th><th class="est">Estado</th></tr></thead><tbody id="x-its"></tbody></table></div></div>' +
      '<div class="campo"><span class="req">Novedades de la devolución</span><div class="seg" id="x-nov"><button type="button" data-n="Sin novedades" class="on">Sin novedades</button><button type="button" data-n="Con novedades">Con novedades</button></div></div>' +
      '<label class="campo" id="x-obs-c"><span>Observaciones generales de la devolución</span><textarea id="x-o" maxlength="4000" placeholder="Ej. Se devuelve completo, contenedores sellados."></textarea></label>' +
      '<div class="firmas-par"><div class="firma-bloque"><h4>Devuelve (CLEMI)</h4><div class="form-grid" style="grid-template-columns:1fr">' +
        '<label class="campo"><span class="req">Nombre</span><input id="x-en" value="' + esc(yo.nombre) + '"></label><label class="campo"><span class="req">Cédula</span><input id="x-ec" value="' + esc(yo.cedula || '') + '"></label><div id="x-ef"></div></div></div>' +
      '<div class="firma-bloque"><h4>Recibe (empresa)</h4><div class="form-grid" style="grid-template-columns:1fr">' +
        '<label class="campo"><span class="req">Nombre</span><input id="x-rn" value="' + esc(r.entrega_nombre) + '"></label><label class="campo"><span class="req">Cédula</span><input id="x-rc" value="' + esc(r.entrega_cedula) + '"></label><div id="x-rf"></div></div></div></div>' +
      '<div class="campo"><span>Fotos de la devolución</span><div id="x-f"></div></div>',
      '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="x-ok" type="button">Registrar devolución y generar acta</button>', { ancho: true, sinFoco: true });
    function pintar() {
      $('#x-its', m.el).innerHTML = its.map(function (it, i) {
        var mal = it.estado !== 'Completo';
        return '<tr class="' + (mal ? 'dev-mal' : '') + '"><td><b>' + esc(it.desc) + '</b>' + (it.ref ? '<div class="meta">' + esc(it.ref) + '</div>' : '') + '</td><td class="cant num">' + it.cant + '</td>' +
          '<td class="cant"><input type="number" min="0" max="' + it.cant + '" data-i="' + i + '" data-k="dev" value="' + it.dev + '"></td>' +
          '<td class="est"><select data-i="' + i + '" data-k="estado">' + EST.map(function (e) { return '<option' + (e === it.estado ? ' selected' : '') + '>' + e + '</option>'; }).join('') + '</select></td></tr>' +
          (mal ? '<tr class="dev-mal"><td colspan="4"><input data-i="' + i + '" data-k="nota" maxlength="500" value="' + esc(it.nota) + '" placeholder="Novedad de este elemento (obligatoria): qué falta, qué daño tiene…"></td></tr>' : '');
      }).join('');
      $$('#x-its [data-k]', m.el).forEach(function (el) {
        el.addEventListener('change', function () {
          var it = its[+el.getAttribute('data-i')], k = el.getAttribute('data-k');
          if (k === 'dev') { it.dev = Math.max(0, Math.min(it.cant, +el.value || 0)); if (it.dev < it.cant && it.estado === 'Completo') it.estado = it.dev === 0 ? 'No devuelto' : 'Faltante'; if (it.dev === it.cant && /Faltante|No devuelto/.test(it.estado)) it.estado = 'Completo'; }
          else if (k === 'estado') { it.estado = el.value; if (el.value === 'No devuelto') it.dev = 0; if (el.value === 'Completo') it.dev = it.cant; }
          else it.nota = el.value;
          if (k !== 'nota') { if (its.some(function (x) { return x.estado !== 'Completo'; })) marcarNov('Con novedades'); pintar(); }
        });
        if (el.getAttribute('data-k') === 'nota') el.addEventListener('input', function () { its[+el.getAttribute('data-i')].nota = el.value; });
      });
    }
    function marcarNov(n) {
      nov = n; $$('#x-nov button', m.el).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-n') === n); });
      $('#x-obs-c span', m.el).textContent = n === 'Con novedades' ? 'Describa las novedades de la devolución' : 'Observaciones generales de la devolución';
      $('#x-obs-c span', m.el).classList.toggle('req', n === 'Con novedades' && !its.some(function (x) { return x.estado !== 'Completo'; }));
    }
    $$('#x-nov button', m.el).forEach(function (b) { b.onclick = function () {
      if (b.getAttribute('data-n') === 'Sin novedades' && its.some(function (x) { return x.estado !== 'Completo'; })) return toast('Hay elementos con novedad en la revisión. Corríjalos o deje «Con novedades».', 'error');
      marcarNov(b.getAttribute('data-n'));
    }; });
    pintar();
    var f1 = new Firma($('#x-ef', m.el)), f2 = new Firma($('#x-rf', m.el));
    selectorFotos($('#x-f', m.el), fs, 8);
    $('#x-ok', m.el).onclick = function () {
      var falta = its.find(function (x) { return x.estado !== 'Completo' && !x.nota.trim(); });
      if (falta) return errorEn(m, 'Escriba la novedad de «' + falta.desc + '».');
      if (nov === 'Con novedades' && !its.some(function (x) { return x.estado !== 'Completo'; }) && !$('#x-o', m.el).value.trim()) return errorEn(m, 'Describa las novedades de la devolución.');
      var b = this; b.disabled = true;
      api('entrega_devolver', { id: r.id, dev_entrega_nombre: $('#x-en', m.el).value, dev_entrega_cedula: $('#x-ec', m.el).value, dev_entrega_firma: f1.valor(),
        dev_recibe_nombre: $('#x-rn', m.el).value, dev_recibe_cedula: $('#x-rc', m.el).value, dev_recibe_firma: f2.valor(), dev_obs: $('#x-o', m.el).value, fotos: fs,
        dev_novedad: nov, dev_items: its.map(function (x) { return { cant: x.dev, estado: x.estado, nota: x.nota }; }) })
        .then(function () { S.dirty = false; m.cerrar(); toast('Devolución registrada.'); S.actaDevAuto = r.id; luego(); }, function (x) { b.disabled = false; errorEn(m, x.error); });
    };
  }

  // ================================================================== INGRESO DE PARTICIPANTES (QR)
  function nomIns(i) { return (i.nombre + ' ' + (i.apellido || '')).trim(); }
  function lecturaEscaner(codigo) {
    if (!S.yo || esTana()) return;
    if (document.querySelector('.modal-fondo input:focus, .modal-fondo textarea:focus')) return;
    if (S.vista && S.vista.escaneo) return S.vista.escaneo(codigo);
    escanear(codigo).then(function (r) { window.Ingreso.sonar(r.nuevo ? 'ok' : 'repetido'); modalIngreso(r); }, function (x) { window.Ingreso.sonar('error'); toast(x.error || 'Código no reconocido.', 'error'); });
  }
  function escanear(codigo, eventoId, medio) { return api('escanear', { codigo: codigo, evento_id: eventoId || 0, medio: medio || '' }); }
  function tarjetaIngreso(host, r, luego) {
    var a = r.asistencia, i = r.inscrito, L = r.checklist, abierto = r.evento.estado !== 'cerrado' && !esTana();
    function pintar() {
      var its = a.items || {}, n = L.filter(function (t) { return its[t]; }).length, comp = n === L.length;
      host.innerHTML = '<div class="ing-card ' + (r.nuevo ? 'es-nuevo' : 'es-rep') + (comp ? ' es-comp' : '') + '">' +
        '<div class="ing-est"><span class="ing-ico">' + (r.nuevo ? '✓' : '↺') + '</span><div><b>' + (r.nuevo ? 'Ingreso registrado' : 'Ya había ingresado hoy') + ' · ' + a.ingreso_en.slice(11, 16) + '</b><small>' +
          (a.medio === 'QR' ? 'Código QR' : a.medio === 'Manual' ? 'Registro manual' : 'Documento') + ' · registró ' + esc(usuario(a.ingreso_por).nombre) + '</small></div>' +
          '<span class="ing-cnt"><b>' + n + '</b>/' + L.length + '</span></div>' +
        '<div class="ing-per"><span class="avatar ing-av">' + esc(iniciales(nomIns(i))) + '</span><div style="min-width:0"><h2>' + esc(nomIns(i)) + '</h2>' +
          '<p>' + esc((i.tipo_doc || 'CC') + ' ' + i.documento) + (i.especialidad ? ' · ' + esc(i.especialidad) : '') + (i.institucion ? ' · ' + esc(i.institucion) : '') + '</p>' +
          '<p class="ing-curso"><b>' + esc(r.evento.titulo) + '</b> · ' + esc(r.evento.sala) + (i.estacion ? ' · <span class="chip st-custodia">Estación ' + esc(i.estacion) + '</span>' : '') + '</p></div></div>' +
        '<div class="barra ing-barra"><i style="width:' + Math.round(n / Math.max(1, L.length) * 100) + '%"></i></div>' +
        '<ul class="ing-lista">' + L.map(function (t, k) {
          var x = its[t];
          return '<li><button type="button" class="ing-it' + (x ? ' on' : '') + '" data-k="' + k + '"' + (abierto ? '' : ' disabled') + '><span class="ck" aria-hidden="true"></span><span class="tx">' + esc(t) + '</span>' +
            '<small>' + (x ? esc(usuario(x.por).nombre) + ' · ' + x.en.slice(11, 16) : 'Pendiente') + '</small></button></li>';
        }).join('') + '</ul>' +
        '<label class="campo"><span>Observaciones del ingreso</span><textarea id="ing-obs" maxlength="1000"' + (abierto ? '' : ' disabled') + ' placeholder="Ej. Llegó sin gafas, se le entregaron en préstamo.">' + esc(a.obs || '') + '</textarea></label>' +
        '<div class="ing-acc">' + (abierto && !comp ? '<button class="btn btn-verde" type="button" id="ing-todo">Marcar todo</button>' : '') + '<button class="btn" type="button" id="ing-pdf">Check list en PDF</button>' +
          (comp ? '<span class="chip st-devuelto">Check list completo</span>' : '') + '</div></div>';
      $$('.ing-it', host).forEach(function (b) { b.onclick = function () {
        var t = L[+b.getAttribute('data-k')], ok = !(a.items || {})[t]; b.disabled = true;
        api('asistencia_item', { asistencia_id: a.id, item: t, ok: ok ? 1 : 0 }).then(function (j) { a = r.asistencia = j.asistencia; pintar(); if (luego) luego(); }, function (x) { b.disabled = false; falla(x); });
      }; });
      var bt = $('#ing-todo', host); if (bt) bt.onclick = function () { bt.disabled = true; api('asistencia_item', { asistencia_id: a.id, todos: 1 }).then(function (j) { a = r.asistencia = j.asistencia; pintar(); if (luego) luego(); }, falla); };
      var ob = $('#ing-obs', host); if (ob) ob.onchange = function () { api('asistencia_item', { asistencia_id: a.id, obs: ob.value }).then(function (j) { a = r.asistencia = j.asistencia; toast('Observación guardada.'); }, falla); };
      $('#ing-pdf', host).onclick = function () { pdfChecklist([{ inscrito: i, asistencia: a }], r.evento, L); };
    }
    pintar();
  }
  function modalIngreso(r, luego) {
    var m = modal('Check list de ingreso', '<div id="ing-m"></div>', '<button class="btn" data-cerrar type="button">Cerrar</button>', { ancho: true, sinFoco: true, alCerrar: luego });
    tarjetaIngreso($('#ing-m', m.el), r);
    return m;
  }
  function pdfChecklist(filas, ev, L) {
    modalPdf('Check list de ingreso · ' + (filas.length === 1 ? nomIns(filas[0].inscrito) : ev.titulo), function () {
      return window.Ingreso.checklist(filas, ev, L, { nombre: function (id) { return usuario(id).nombre; }, generadoPor: S.yo.nombre, ahora: ahoraTxt() });
    });
  }

  function vIngreso() {
    if (esTana()) { location.hash = '#/tablero'; return; }
    var filtro = 0, H = null, ultimo = null;
    montar('<div class="vista-cab"><div><div class="eyebrow">Instrumentación quirúrgica</div><h1>Ingreso de participantes</h1><p>Escanee el código QR del participante con el lector. Se registra su ingreso y aparece su check list al instante.</p></div></div>' +
      '<div class="ing-grid"><div class="ing-main">' +
        '<div class="panel ing-lector"><div class="ing-lector-est" id="ing-est"><span class="pulso"></span><div><b>Lector listo</b><small>Apunte el lector al código QR del participante</small></div></div>' +
        '<div class="ing-lector-f"><select id="ing-ev" aria-label="Curso"><option value="0">Todos los cursos de hoy</option></select>' +
        '<input id="ing-cod" data-escaner autocomplete="off" placeholder="Código QR o número de documento" aria-label="Código QR o documento"><button class="btn btn-oro" type="button" id="ing-ok">Registrar</button></div></div>' +
        '<div id="ing-res"><div class="ing-espera"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 20V8h12M44 8h12v12M56 44v12H44M20 56H8V44"/><path d="M18 18h10v10H18zM36 18h10v10H36zM18 36h10v10H18zM36 36h4v4h-4zM42 42h4v4h-4z"/></svg><b>Esperando lectura…</b><span>El lector funciona aunque este campo no tenga el cursor: basta con escanear.</span></div></div>' +
      '</div><aside class="ing-lado"><div class="panel"><div class="panel-cab"><h2>Cursos de hoy</h2></div><div id="ing-cursos"><div class="vacio">Cargando…</div></div></div>' +
        '<div class="panel"><div class="panel-cab"><h2>Últimos ingresos</h2></div><ul class="ing-ult" id="ing-ult"></ul></div></aside></div>');
    function lado() {
      return api('ingresos_hoy').then(function (j) {
        H = j;
        var sel = $('#ing-ev'); if (!sel) return;
        sel.innerHTML = '<option value="0">Todos los cursos de hoy</option>' + j.eventos.map(function (e) { return '<option value="' + e.id + '"' + (+filtro === +e.id ? ' selected' : '') + '>' + esc(e.titulo) + ' · ' + esc(sala(e.sala_id).nombre) + '</option>'; }).join('');
        $('#ing-cursos').innerHTML = j.eventos.length ? j.eventos.map(function (e) {
          return '<a class="ing-curso-f" href="#/evento/' + e.id + '/participantes"><div><b>' + esc(e.titulo) + '</b><small>' + esc(sala(e.sala_id).nombre) + ' · ' + e.hora_ini + '–' + e.hora_fin + '</small></div>' +
            '<div class="ing-nums"><span><b>' + e.ingresaron + '</b> / ' + e.inscritos + '<small>ingresaron</small></span><span><b>' + e.completos + '</b><small>check list completo</small></span></div>' +
            '<div class="barra"><i style="width:' + (e.inscritos ? Math.round(e.ingresaron / e.inscritos * 100) : 0) + '%"></i></div></a>';
        }).join('') : '<div class="vacio">No hay cursos programados para hoy.</div>';
        $('#ing-ult').innerHTML = j.ingresos.length ? j.ingresos.slice(0, 15).map(function (x) {
          var ev = j.eventos.find(function (e) { return +e.id === +x.evento_id; });
          return '<li data-cod="' + esc(x.codigo) + '"><span class="num">' + x.ingreso_en.slice(11, 16) + '</span><div><b>' + esc(nomIns(x)) + '</b><small>' + esc(ev ? ev.titulo : '') + '</small></div>' +
            '<span class="chip ' + (+x.completo ? 'st-devuelto' : 'st-custodia') + '">' + (+x.completo ? 'Completo' : 'Pendiente') + '</span></li>';
        }).join('') : '<li class="vacio">Aún no hay ingresos hoy.</li>';
        $$('#ing-ult [data-cod]').forEach(function (li) { li.onclick = function () { procesar(li.getAttribute('data-cod'), 'reabrir'); }; });
      }, falla);
    }
    function estado(t, clase, sub) { var e = $('#ing-est'); if (!e) return; e.className = 'ing-lector-est ' + (clase || ''); e.innerHTML = '<span class="pulso"></span><div><b>' + esc(t) + '</b><small>' + esc(sub || '') + '</small></div>'; }
    function procesar(cod, medio) {
      cod = String(cod || '').trim(); if (!cod) return;
      estado('Leyendo…', 'leyendo', cod);
      escanear(cod, filtro, medio === 'Manual' ? 'Manual' : '').then(function (r) {
        ultimo = r; if (medio !== 'reabrir') window.Ingreso.sonar(r.nuevo ? 'ok' : 'repetido');
        estado(r.nuevo ? 'Ingreso registrado' : 'Ya había ingresado', 'ok', nomIns(r.inscrito) + ' · listo para el siguiente');
        tarjetaIngreso($('#ing-res'), r, lado); lado();
      }, function (x) {
        window.Ingreso.sonar('error'); estado('No se pudo registrar', 'mal', x.error);
        $('#ing-res').innerHTML = '<div class="ing-card es-mal"><div class="ing-est"><span class="ing-ico">!</span><div><b>' + esc(x.inscrito ? x.inscrito.nombre : 'Código no reconocido') + '</b><small>' + esc(x.error || '') + '</small></div></div>' +
          (x.inscrito ? '<div class="ing-acc" style="padding:0 18px 18px"><a class="btn" href="#/evento/' + x.inscrito.evento_id + '/participantes">Ver curso del participante</a></div>' : '') + '</div>';
      });
    }
    $('#ing-ev').onchange = function () { filtro = +this.value; };
    var inp = $('#ing-cod');
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); procesar(inp.value, 'Manual'); inp.value = ''; } });
    $('#ing-ok').onclick = function () { procesar(inp.value, 'Manual'); inp.value = ''; inp.focus(); };
    S.vista = { refrescar: lado, escaneo: function (c) { procesar(c); } };
    lado(); setTimeout(function () { inp.focus(); }, 50);
  }

  // ------------------------------------------------------------ participantes del curso (pestaña del evento)
  function tParticipantes(c, e, abierto, recargarEv) {
    var dia = diaDe(e, hoy()) ? hoy() : (e.dias[0] || {}).fecha, J = null;
    function cargar() { return api('inscritos&evento_id=' + e.id).then(function (j) { J = j; pintar(); }, falla); }
    function asis(i) { return J.asistencias.find(function (a) { return +a.inscrito_id === +i.id && a.fecha === dia; }); }
    function pintar() {
      var L = J.checklist, ins = J.inscritos, hoyEs = dia === hoy();
      var ing = ins.filter(asis).length, comp = ins.filter(function (i) { var a = asis(i); return a && +a.completo; }).length;
      c.innerHTML = '<div class="panel"><div class="panel-cab part-cab"><div><h2>Listado del curso</h2><span class="meta">' + ins.length + ' personas · ' + ing + ' ingresaron · ' + comp + ' con check list completo</span>' + leyendaRoles(cuentaRoles(ins)) + '</div>' +
        '<div class="part-acc">' + (e.dias.length > 1 ? '<select id="p-dia" aria-label="Día">' + e.dias.map(function (d) { return '<option value="' + d.fecha + '"' + (d.fecha === dia ? ' selected' : '') + '>' + esc(fCorta(d.fecha)) + (d.fecha === hoy() ? ' · hoy' : '') + '</option>'; }).join('') + '</select>' : '') +
          (abierto ? (!J.integracion ? '<button class="btn btn-oro btn-sm" id="p-nuevo" type="button">+ Agregar al listado</button>' : '<button class="btn btn-oro btn-sm" id="p-is" type="button">+ Instructor o staff</button>') + '<button class="btn btn-sm" id="p-imp" type="button">Importar Excel / CSV</button>' + (J.listado_cliente && J.listado_cliente.n ? '<button class="btn btn-sm btn-verde" id="p-lc" type="button">Traer listado del cliente (' + J.listado_cliente.n + ')</button>' : '') : '') +
          (ins.length ? '<button class="btn btn-sm" id="p-carnes" type="button">Carnés con QR (PDF)</button><button class="btn btn-sm" id="p-cl" type="button">Check lists (PDF)</button><button class="btn btn-sm" id="p-csv" type="button">Asistencia (Excel)</button>' : '') +
          (abierto ? '<button class="btn btn-sm" id="p-lista" type="button">Check list del curso (' + L.length + ')</button>' : '') + '</div></div>' +
        '<div class="part-ext">' + ((J.cursos_ext || []).length ? '<span class="meta">Inscripciones vinculadas:</span>' + J.cursos_ext.map(function (x) { return '<span class="chip st-devuelto">' + esc(x.nombre) + ' · ' + x.n + '</span>'; }).join('') : '<span class="meta">' + (J.integracion ? 'Este entrenamiento aún no está vinculado a un curso de la plataforma de inscripciones.' : 'La conexión con la plataforma de inscripciones no está configurada.') + '</span>') +
          (J.integracion ? '<span class="meta part-regla">Solo llegan inscritos con pago completo y proceso de inscripción completo.</span>' : '') +
          (abierto && J.integracion ? '<button class="btn btn-sm" id="p-vinc" type="button">' + ((J.cursos_ext || []).length ? 'Cambiar vínculo' : 'Vincular curso de inscripciones') + '</button><button class="btn btn-sm" id="p-sinc" type="button">Sincronizar</button>' : '') + '</div>' +
        (hoyEs && ins.length && abierto ? '<div class="part-aviso">Hoy hay sesión: los participantes ingresan escaneando su QR en <a href="#/ingreso">Ingreso QR</a> o en cualquier pantalla de la plataforma.</div>' : '') +
        (ins.length ? '<div class="tabla-wrap"><table class="tabla part-tabla"><thead><tr><th>Persona</th><th>Código QR</th><th>Estación</th><th>Ingreso ' + esc(fCorta(dia)) + '</th><th>Check list</th><th></th></tr></thead><tbody>' +
          ins.map(function (i) {
            var a = asis(i), n = a ? L.filter(function (t) { return (a.items || {})[t]; }).length : 0;
            return '<tr class="fila-' + (ROL_CLS[i.rol] || 'rol-par') + (+i.anulado ? ' anulado' : '') + '"><td>' + chipRol(i.rol) + ' <b>' + esc(nomIns(i)) + '</b>' + (i.ext_id ? ' <span class="chip chip-ins" title="Inscrito y pagado en la plataforma de inscripciones">Inscripciones</span>' : '') + (+i.anulado ? ' <span class="chip st-cancelado">Anulada</span>' : '') + '<div class="meta">' + esc([(i.tipo_doc || 'CC') + ' ' + i.documento, i.especialidad, i.institucion].filter(Boolean).join(' · ')) + '</div></td>' +
              '<td><button class="qr-mini" type="button" data-qr="' + i.id + '" title="Ver QR">' + window.Ingreso.qrSvg(i.codigo) + '<span class="num">' + esc(i.codigo) + '</span></button></td><td>' + esc(i.estacion || '—') + '</td>' +
              '<td>' + (a ? '<b class="num">' + a.ingreso_en.slice(11, 16) + '</b><div class="meta">' + (a.medio === 'QR' ? 'QR' : a.medio) + ' · ' + esc(usuario(a.ingreso_por).nombre) + '</div>' : '<span class="meta">Sin ingreso</span>') + '</td>' +
              '<td>' + (a ? '<button class="chip ' + (+a.completo ? 'st-devuelto' : 'st-custodia') + ' chip-btn" type="button" data-cl="' + i.id + '">' + n + '/' + L.length + (+a.completo ? ' · completo' : '') + '</button>' : '—') + '</td>' +
              '<td style="white-space:nowrap">' + (!a && hoyEs && abierto ? '<button class="btn btn-sm btn-verde" type="button" data-man="' + i.id + '" title="Registrar ingreso sin escanear">Ingreso manual</button> ' : '') + (abierto ? '<button class="btn btn-sm" type="button" data-ed="' + i.id + '">Editar</button>' : '') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
          : '<div class="vacio"><strong>Aún no hay participantes inscritos</strong>' + (J.integracion ? 'Los participantes llegan desde la plataforma de inscripciones cuando completan el pago y todo el proceso de inscripción.' : 'Inscríbalos uno a uno o importe el Excel de inscripciones. Cada participante recibe un código QR para su ingreso.') + '</div>') + '</div>';
      var ins_ = function (id) { return ins.find(function (x) { return +x.id === +id; }); };
      var evInfo = { id: e.id, titulo: e.titulo, sala: sala(e.sala_id).nombre, fecha: e.fecha, fecha_fin: e.fecha_fin, estado: e.estado };
      var b = function (sel, fn) { var x = $(sel, c); if (x) x.onclick = fn; };
      b('#p-nuevo', function () { modalInscrito(e, null, refrescar); });
      b('#p-is', function () { S.rolNuevo = 'soloIS'; modalInscrito(e, null, refrescar); });
      b('#p-imp', function () { modalImportar(e, refrescar); });
      b('#p-lc', function () { api('listado_traer', { evento_id: e.id }).then(function (j) { toast(j.importados ? '<b>' + j.importados + ' personas</b> del listado del cliente quedaron con su QR.' : 'Todas las personas del listado del cliente ya estaban.'); refrescar(); }, falla); });
      b('#p-lista', function () { modalListaCurso(e, L, cargar); });
      b('#p-carnes', function () { modalPdf('Carnés con código QR · ' + e.titulo, function () { return window.Ingreso.carnes(ins, evInfo, {}); }); });
      b('#p-cl', function () { pdfChecklist(ins.map(function (i) { return { inscrito: i, asistencia: asis(i) }; }), Object.assign({}, evInfo), L); });
      b('#p-csv', function () { csvAsistencia(e, J); });
      b('#p-vinc', function () { modalVincular(e, J.cursos_ext || [], refrescar); });
      b('#p-sinc', function () { var x = $('#p-sinc', c); x.disabled = true; x.textContent = 'Sincronizando…'; api('integ_sincronizar', {}).then(function (j) { toast('Sincronizado: ' + j.resultado.inscritos + ' inscripciones revisadas' + (j.enviados ? ' · ' + j.enviados + ' registros de trazabilidad enviados' : '') + '.'); refrescar(); }, function (x2) { falla(x2); x.disabled = false; x.textContent = 'Sincronizar'; }); });
      var sd = $('#p-dia', c); if (sd) sd.onchange = function () { dia = sd.value; pintar(); };
      $$('[data-qr]', c).forEach(function (x) { x.onclick = function () { modalQR(ins_(x.getAttribute('data-qr')), evInfo); }; });
      $$('[data-ed]', c).forEach(function (x) { x.onclick = function () { modalInscrito(e, ins_(x.getAttribute('data-ed')), refrescar); }; });
      $$('[data-cl]', c).forEach(function (x) { x.onclick = function () { var i = ins_(x.getAttribute('data-cl')); modalIngreso({ inscrito: i, asistencia: asis(i), checklist: L, evento: evInfo, nuevo: false }, cargar); }; });
      $$('[data-man]', c).forEach(function (x) { x.onclick = function () { var i = ins_(x.getAttribute('data-man')); escanear(i.codigo, e.id, 'Manual').then(function (r) { cargar(); modalIngreso(r, cargar); }, falla); }; });
    }
    function refrescar() { cargar(); recargarEv(); }
    c.innerHTML = '<div class="vacio">Cargando participantes…</div>';
    cargar();
  }
  function modalInscrito(e, i, luego) {
    var ext = i && i.ext_id;
    var nuevo = !i; i = i || { rol: S.rolNuevo || 'Participante', nombre: '', apellido: '', tipo_doc: 'CC', documento: '', especialidad: '', institucion: '', correo: '', telefono: '', estacion: '', nota: '' };
    var soloIS = nuevo && S.rolNuevo === 'soloIS'; if (soloIS) i.rol = 'Instructor';
    var m = modal(nuevo ? (soloIS ? 'Registrar instructor o staff' : 'Inscribir al listado') : 'Editar · ' + (i.rol || 'Participante'), '<div class="form-grid">' +
      '<div class="campo ancho"><span>Rol en el entrenamiento</span><div class="seg" id="i-rol">' + (soloIS ? ['Instructor', 'Staff'] : ['Participante', 'Instructor', 'Staff']).map(function (r) { return '<button type="button" data-r="' + r + '" class="' + ((i.rol || 'Participante') === r ? 'on' : '') + '">' + chipRol(r) + '</button>'; }).join('') + '</div></div>' +
      '<label class="campo"><span class="req">Nombres</span><input id="i-n" maxlength="120" value="' + esc(i.nombre) + '"></label><label class="campo"><span>Apellidos</span><input id="i-a" maxlength="120" value="' + esc(i.apellido) + '"></label>' +
      '<label class="campo"><span>Tipo de documento</span><select id="i-t">' + [['CC', 'Cédula de ciudadanía'], ['CE', 'Cédula de extranjería'], ['PA', 'Pasaporte'], ['TI', 'Tarjeta de identidad'], ['Otro', 'Otro']].map(function (x) { return '<option value="' + x[0] + '"' + (i.tipo_doc === x[0] ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></label>' +
      '<label class="campo"><span class="req">Número de documento</span><input id="i-d" maxlength="40" value="' + esc(i.documento) + '"></label>' +
      '<label class="campo"><span>Especialidad</span><input id="i-e" maxlength="120" value="' + esc(i.especialidad) + '" placeholder="Ej. Ortopedia y traumatología"></label><label class="campo"><span>Institución / empresa</span><input id="i-inst" maxlength="200" value="' + esc(i.institucion) + '"></label>' +
      '<label class="campo"><span>Correo</span><input id="i-c" type="email" maxlength="160" value="' + esc(i.correo) + '"></label><label class="campo"><span>Teléfono</span><input id="i-tel" maxlength="40" value="' + esc(i.telefono) + '"></label>' +
      '<label class="campo"><span>Estación asignada</span><input id="i-est" maxlength="40" value="' + esc(i.estacion) + '" placeholder="Ej. 3"></label><label class="campo"><span>Nota</span><input id="i-nota" maxlength="500" value="' + esc(i.nota) + '" placeholder="Ej. Pago con abono"></label></div>' +
      (nuevo ? '<p class="meta" style="margin:0">Al inscribirlo se genera su código QR personal para el ingreso. Lo normal es que los participantes lleguen solos desde la plataforma de inscripciones.</p>' : '') +
      (ext ? '<p class="part-aviso" style="margin:0">Este participante viene de la plataforma de inscripciones: sus datos personales y su código QR se administran allá. Aquí solo se ajustan la estación y la nota.</p>' : ''),
      (!nuevo ? '<button class="btn btn-peligro" id="i-del" type="button" style="margin-right:auto">Retirar del curso</button>' : '') + '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="i-ok" type="button">' + (nuevo ? 'Inscribir y generar QR' : 'Guardar') + '</button>', { ancho: true });
    S.rolNuevo = null;
    $$('#i-rol button', m.el).forEach(function (b) { b.onclick = function () { if (ext) return; $$('#i-rol button', m.el).forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
    if (ext) { ['#i-n', '#i-a', '#i-t', '#i-d', '#i-e', '#i-inst', '#i-c', '#i-tel'].forEach(function (k) { $(k, m.el).disabled = true; }); var bdx = $('#i-del', m.el); if (bdx && !esAdmin()) bdx.remove(); }
    $('#i-ok', m.el).onclick = function () {
      var b = this; b.disabled = true;
      var rb = $('#i-rol button.on', m.el);
      api('inscrito_guardar', { evento_id: e.id, id: nuevo ? 0 : i.id, rol: rb ? rb.getAttribute('data-r') : 'Participante', nombre: $('#i-n', m.el).value, apellido: $('#i-a', m.el).value, tipo_doc: $('#i-t', m.el).value, documento: $('#i-d', m.el).value,
        especialidad: $('#i-e', m.el).value, institucion: $('#i-inst', m.el).value, correo: $('#i-c', m.el).value, telefono: $('#i-tel', m.el).value, estacion: $('#i-est', m.el).value, nota: $('#i-nota', m.el).value })
        .then(function () { m.cerrar(); toast(nuevo ? 'Participante inscrito con su código QR.' : 'Datos guardados.'); luego(); }, function (x) { b.disabled = false; errorEn(m, x.error); });
    };
    var bd = $('#i-del', m.el); if (bd) { var seguro = false; bd.onclick = function () { if (!seguro) { seguro = true; bd.textContent = '¿Retirar definitivamente?'; return; } api('inscrito_borrar', { id: i.id }).then(function () { m.cerrar(); toast('Participante retirado.'); luego(); }, function (x) { errorEn(m, x.error); }); }; }
  }
  function modalQR(i, ev) {
    var m = modal('Código QR · ' + nomIns(i), '<div class="qr-grande">' + window.Ingreso.qrSvg(i.codigo) + '<b class="num">' + esc(i.codigo) + '</b><span>' + esc((i.tipo_doc || 'CC') + ' ' + i.documento) + ' · ' + esc(ev.titulo) + '</span></div>' +
      '<p class="meta" style="margin:0;text-align:center">Envíe esta imagen al participante (WhatsApp o correo) o imprima su carné. El día del curso se escanea con el lector en el ingreso.</p>',
      '<button class="btn" data-cerrar type="button">Cerrar</button><button class="btn btn-oro" id="q-png" type="button">Descargar imagen (PNG)</button>', { sinFoco: true });
    $('#q-png', m.el).onclick = function () { window.Ingreso.tarjetaPNG(i, ev, 'assets/letras.png').then(function (b) { return guardarArchivo(b, 'QR-' + nomIns(i).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-') + '.png'); }).catch(falla); };
  }
  var CAMPOS_IMP = [['rol', 'Rol (participante, instructor o staff)', /^(rol|tipo|tipo de (asistente|participante)|cargo en el curso|categor[ií]a|perfil)$/], ['nombre', 'Nombres', /^(nombres?|primer nombre|name)$/], ['apellido', 'Apellidos', /^(apellidos?|last ?name)$/], ['tipo_doc', 'Tipo de documento', /tipo.*(doc|ident)/],
    ['documento', 'Documento', /^(documento|n[uú]mero( de)? (documento|identificaci[oó]n)|identificaci[oó]n|c[eé]dula|cc|doc|id)$/], ['especialidad', 'Especialidad', /especialidad|profesi[oó]n/],
    ['institucion', 'Institución', /instituci[oó]n|empresa|hospital|entidad/], ['correo', 'Correo', /correo|e-?mail/], ['telefono', 'Teléfono', /tel[eé]fono|celular|m[oó]vil/], ['estacion', 'Estación', /estaci[oó]n/], ['nota', 'Nota', /pago|abono|nota|observ/]];
  function modalImportar(e, luego, o) {
    var filas = [], mapa = {}, nomArch = ''; o = o || {}; var CAMPOS = o.campos || CAMPOS_IMP, REQ = o.req || ['nombre', 'documento'];
    var m = modal(o.titulo || 'Importar participantes', (o.intro || '') + '<p class="meta" style="margin:0">Suba el Excel de inscripciones (.xlsx) o un archivo CSV. La primera fila debe tener los títulos de las columnas (Rol, Nombres, Apellidos, Documento, Correo, Teléfono, Especialidad…). La columna <b>Rol</b> indica si es participante, instructor o staff (si falta, se toma como participante). Cada persona recibe su código QR.</p>' +
      '<label class="campo"><span class="req">Archivo</span><input type="file" id="im-f" accept=".xlsx,.xls,.csv"></label><div id="im-map"></div><div id="im-prev"></div>',
      '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="im-ok" type="button" disabled>Importar</button>', { ancho: true });
    function norm(h) { return String(h || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.:]/g, ''); }
    function vista() {
      var cab = filas[0] || [], datos = filas.slice(1).filter(function (r) { return r.some(function (x) { return String(x).trim(); }); });
      $('#im-map', m.el).innerHTML = '<div class="im-grid">' + CAMPOS.map(function (k) {
        return '<label class="campo"><span' + (REQ.indexOf(k[0]) >= 0 ? ' class="req"' : '') + '>' + k[1] + '</span><select data-k="' + k[0] + '"><option value="">— No importar —</option>' + cab.map(function (h, ix) { return '<option value="' + ix + '"' + (mapa[k[0]] === ix ? ' selected' : '') + '>' + esc(h || 'Columna ' + (ix + 1)) + '</option>'; }).join('') + '</select></label>';
      }).join('') + '</div>';
      $$('#im-map select', m.el).forEach(function (s) { s.onchange = function () { mapa[s.getAttribute('data-k')] = s.value === '' ? undefined : +s.value; vista(); }; });
      var ok = REQ.every(function (k) { return mapa[k] != null; }), VIS = CAMPOS.filter(function (k) { return mapa[k[0]] != null; }).slice(0, 5);
      $('#im-prev', m.el).innerHTML = '<p class="meta" style="margin:0 0 6px"><b>' + datos.length + '</b> filas encontradas. Vista previa:</p><div class="tabla-wrap"><table class="tabla"><thead><tr>' + VIS.map(function (k) { return '<th>' + esc(k[1]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        datos.slice(0, 6).map(function (r) { return '<tr>' + VIS.map(function (k) { return '<td>' + esc(r[mapa[k[0]]]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
      $('#im-ok', m.el).disabled = !ok || !datos.length;
      $('#im-ok', m.el).onclick = function () {
        var b = this; b.disabled = true;
        var out = datos.map(function (r) { var x = {}; CAMPOS.forEach(function (k) { if (mapa[k[0]] != null) x[k[0]] = String(r[mapa[k[0]]] == null ? '' : r[mapa[k[0]]]).trim(); }); return x; });
        if (o.enviar) return o.enviar(out, nomArch).then(function (msg) { m.cerrar(); toast(msg); luego(); }, function (x) { b.disabled = false; errorEn(m, x.error); });
        api('inscritos_importar', { evento_id: e.id, filas: out }).then(function (j) {
          m.cerrar(); toast(j.importados + ' personas importadas' + (j.duplicados ? ' · ' + j.duplicados + ' ya estaban en el listado' : '') + (j.incompletos ? ' · ' + j.incompletos + ' filas sin nombre o documento' : '') + (j.omitidos ? ' · ' + j.omitidos + ' participantes omitidos (llegan desde la plataforma de inscripciones)' : '') + '.'); luego();
        }, function (x) { b.disabled = false; errorEn(m, x.error); });
      };
    }
    $('#im-f', m.el).onchange = function () {
      var f = this.files[0]; if (!f) return; nomArch = f.name;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          if (!window.XLSX) throw { message: 'No se pudo cargar el lector de Excel.' };
          var wb = /\.csv$/i.test(f.name) ? window.XLSX.read(new TextDecoder('utf-8').decode(new Uint8Array(rd.result)), { type: 'string' }) : window.XLSX.read(new Uint8Array(rd.result), { type: 'array' });
          var hoja = wb.Sheets[wb.SheetNames[0]];
          filas = window.XLSX.utils.sheet_to_json(hoja, { header: 1, raw: false, defval: '' });
          // Busca la fila de títulos (la primera que tenga "nombre" o "documento")
          var ix = filas.findIndex(function (r) { return r.some(function (h) { return (o.cabecera || /nombre|documento|c[eé]dula/).test(norm(h)); }); });
          if (ix > 0) filas = filas.slice(ix);
          mapa = {}; (filas[0] || []).forEach(function (h, k) { var n = norm(h); CAMPOS.forEach(function (c) { if (mapa[c[0]] == null && c[2].test(n)) mapa[c[0]] = k; }); });
          if (mapa.nombre == null) (filas[0] || []).forEach(function (h, k) { if (mapa.nombre == null && /nombre/.test(norm(h))) mapa.nombre = k; });
          vista();
        } catch (x) { errorEn(m, 'No se pudo leer el archivo: ' + (x.message || x)); }
      };
      rd.readAsArrayBuffer(f);
    };
  }
  function modalVincular(e, actuales, luego) {
    api('cursos_ext').then(function (j) {
      var cerca = function (x) { if (!x.fecha_ini) return 9999; return Math.abs((new Date(x.fecha_ini) - new Date(e.fecha)) / 864e5); };
      var lista = j.cursos.slice().sort(function (a, b) { return cerca(a) - cerca(b); });
      var m = modal('Vincular curso de la plataforma de inscripciones', '<p class="meta" style="margin:0">Elija el curso de la plataforma de inscripciones que corresponde a este entrenamiento. Sus inscritos (con el código QR que recibieron al inscribirse) aparecen aquí de inmediato y los nuevos llegan solos.</p>' +
        (lista.length ? '<div class="vinc-lista">' + lista.map(function (x) {
          var mio = +x.evento_id === +e.id, otro = x.evento_id && !mio;
          return '<label class="vinc-op' + (mio ? ' on' : '') + '"><input type="radio" name="vc" value="' + esc(x.id) + '"' + (mio ? ' checked' : '') + '><div><b>' + esc(x.nombre) + '</b><small>' + (x.fecha_ini ? esc(fCorta(x.fecha_ini)) + (x.fecha_fin && x.fecha_fin !== x.fecha_ini ? ' al ' + esc(fCorta(x.fecha_fin)) : '') : 'Sin fecha') + ' · ' + x.n + ' inscritos' +
            (otro ? ' · <span style="color:var(--alerta)">vinculado a «' + esc(x.evento_titulo) + '»</span>' : '') + (cerca(x) < 3 ? ' · <b style="color:var(--ok)">misma fecha</b>' : '') + '</small></div></label>';
        }).join('') + '</div>' : '<div class="vacio">Aún no han llegado cursos desde la plataforma de inscripciones. Pulse «Sincronizar» o revise la conexión en Administración.</div>'),
        (actuales.length ? '<button class="btn" id="vc-quitar" type="button" style="margin-right:auto">Desvincular</button>' : '') + '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="vc-ok" type="button"' + (lista.length ? '' : ' disabled') + '>Vincular</button>', { ancho: true });
      $('#vc-ok', m.el).onclick = function () {
        var r = $('input[name=vc]:checked', m.el); if (!r) return errorEn(m, 'Elija un curso.');
        api('curso_vincular', { curso_id: r.value, evento_id: e.id }).then(function (x) { m.cerrar(); toast('Curso vinculado: ' + x.inscritos + ' inscritos.'); luego(); }, function (x) { errorEn(m, x.error); });
      };
      var bq = $('#vc-quitar', m.el); if (bq) bq.onclick = function () { Promise.all(actuales.map(function (x) { return api('curso_vincular', { curso_id: x.id, evento_id: 0 }); })).then(function () { m.cerrar(); toast('Curso desvinculado.'); luego(); }, function (x) { errorEn(m, x.error); }); };
    }, falla);
  }
  function aIntegracion(c) {
    c.innerHTML = '<div class="vacio">Cargando…</div>';
    api('integ_estado').then(function (j) {
      var pend = j.cola.pendientes, ue = j.cola.ultimo_error;
      c.innerHTML = '<div class="integ-grid"><div class="panel"><div class="panel-cab"><h2>Conexión con la plataforma de inscripciones</h2><span class="chip ' + (j.activa ? 'st-devuelto' : 'st-custodia') + '">' + (j.activa ? 'Configurada' : 'Sin configurar') + '</span></div><div class="panel-cuerpo">' +
        '<p class="meta" style="margin:0 0 12px"><b>Regla:</b> solo pasan a operaciones los inscritos con <b>pago completo</b> y <b>proceso de inscripción completo</b>, sin excepciones. Con la integración activa no se inscriben participantes a mano ni por Excel.</p><p class="meta" style="margin:0 0 12px">La plataforma de inscripciones hace la inscripción, el pago y genera el QR de cada médico. Aquí llegan los inscritos con su QR, se registra el ingreso con el lector y el check list, y esa trazabilidad se devuelve a la plataforma de inscripciones.</p>' +
        '<label class="campo"><span>Dirección del conector en la plataforma de inscripciones</span><input id="ig-url" value="' + esc(j.url) + '" placeholder="https://clemi.edu.co/inscripciones/clemi-operaciones/api.php"></label>' +
        '<label class="campo"><span>Secreto compartido</span><div style="display:flex;gap:6px"><input id="ig-sec" value="' + esc(j.secreto) + '" style="flex:1;font-family:ui-monospace,monospace" autocomplete="off"><button class="btn btn-sm" type="button" id="ig-gen">Generar</button><button class="btn btn-sm" type="button" id="ig-cop">Copiar</button></div><small>El mismo secreto va en el archivo config.php del conector. No lo comparta por correo.</small></label>' +
        '<label class="campo"><span>Dirección de esta plataforma (para el conector)</span><div style="display:flex;gap:6px"><input readonly value="' + esc(j.receptor) + '" style="flex:1"><button class="btn btn-sm" type="button" id="ig-cop2">Copiar</button></div></label>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end"><button class="btn" type="button" id="ig-probar"' + (j.activa ? '' : ' disabled') + '>Probar conexión</button><button class="btn" type="button" id="ig-sinc"' + (j.activa ? '' : ' disabled') + '>Sincronizar ahora</button><button class="btn btn-oro" type="button" id="ig-ok">Guardar</button></div></div></div>' +
        '<div class="panel"><div class="panel-cab"><h2>Estado</h2></div><div class="panel-cuerpo integ-estado">' +
          '<div><small>Último mensaje recibido</small><b>' + (j.ultima_entrada ? momento(j.ultima_entrada) : 'Ninguno') + '</b></div><div><small>Última sincronización completa</small><b>' + (j.ultima_sinc ? momento(j.ultima_sinc) : 'Nunca') + '</b></div>' +
          '<div><small>Trazabilidad enviada</small><b>' + j.cola.enviados + ' registros</b></div><div><small>Pendientes de enviar</small><b' + (pend ? ' style="color:var(--alerta)"' : '') + '>' + pend + '</b>' + (ue ? '<span class="meta">' + esc(ue.error) + ' · ' + ue.intentos + ' intentos</span>' : '') + (pend ? '<button class="btn btn-sm" type="button" id="ig-reint">Reintentar ahora</button>' : '') + '</div></div></div></div>' +
        '<div class="panel" style="margin-top:18px"><div class="panel-cab"><h2>Cursos recibidos de la plataforma de inscripciones</h2><span class="meta">' + j.cursos.length + '</span></div>' +
        (j.cursos.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Curso</th><th>Fechas</th><th>Inscritos</th><th>Entrenamiento vinculado</th></tr></thead><tbody>' + j.cursos.map(function (x) {
          return '<tr><td><b>' + esc(x.nombre) + '</b><div class="meta">ID ' + esc(x.id) + '</div></td><td>' + (x.fecha_ini ? esc(fCorta(x.fecha_ini)) + (x.fecha_fin && x.fecha_fin !== x.fecha_ini ? ' al ' + esc(fCorta(x.fecha_fin)) : '') : '—') + '</td><td>' + x.n + (+x.n_anuladas ? ' <span class="meta">(' + x.n_anuladas + ' anuladas)</span>' : '') + '</td>' +
            '<td><select data-vc="' + esc(x.id) + '"><option value="0">— Sin vincular —</option>' + j.eventos.map(function (ev) { return '<option value="' + ev.id + '"' + (+x.evento_id === +ev.id ? ' selected' : '') + '>' + esc(fCorta(ev.fecha)) + ' · ' + esc(ev.titulo) + ' · ' + esc(sala(ev.sala_id).nombre) + '</option>'; }).join('') + '</select></td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="vacio">Aún no ha llegado ningún curso. Cuando la plataforma de inscripciones apruebe la primera inscripción, el curso aparece aquí para vincularlo a su entrenamiento.</div>') + '</div>';
      var g = function (k) { return $(k, c); };
      g('#ig-gen').onclick = function () { var a = new Uint8Array(24); crypto.getRandomValues(a); g('#ig-sec').value = Array.prototype.map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); };
      var copiar = function (v) { (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () { toast('Copiado.'); }, function () { toast('Seleccione el texto y cópielo.', 'error'); }); };
      g('#ig-cop').onclick = function () { copiar(g('#ig-sec').value); };
      g('#ig-cop2').onclick = function () { copiar(j.receptor); };
      g('#ig-ok').onclick = function () { api('integ_guardar', { url: g('#ig-url').value, secreto: g('#ig-sec').value }).then(function () { toast('Conexión guardada.'); aIntegracion(c); }, falla); };
      g('#ig-probar').onclick = function () { var b = this; b.disabled = true; api('integ_probar', {}).then(function (r) { toast('Conexión correcta con ' + ((r.respuesta && r.respuesta.plataforma) || 'la plataforma de inscripciones') + '.'); b.disabled = false; }, function (x) { b.disabled = false; falla(x); }); };
      g('#ig-sinc').onclick = function () { var b = this; b.disabled = true; b.textContent = 'Sincronizando…'; api('integ_sincronizar', {}).then(function (r) { toast(r.resultado.cursos + ' cursos y ' + r.resultado.inscritos + ' inscripciones sincronizadas' + (r.resultado.errores.length ? ' · ' + r.resultado.errores.length + ' con error' : '') + '.'); aIntegracion(c); }, function (x) { falla(x); b.disabled = false; b.textContent = 'Sincronizar ahora'; }); };
      var br = g('#ig-reint'); if (br) br.onclick = function () { api('integ_reintentar', {}).then(function (r) { toast(r.enviados + ' enviados · ' + r.pendientes + ' pendientes.'); aIntegracion(c); }, falla); };
      $$('[data-vc]', c).forEach(function (sl) { sl.onchange = function () { api('curso_vincular', { curso_id: sl.getAttribute('data-vc'), evento_id: +sl.value }).then(function (r) { toast(+sl.value ? 'Vinculado: ' + r.inscritos + ' inscritos.' : 'Desvinculado.'); aIntegracion(c); }, function (x) { falla(x); aIntegracion(c); }); }; });
    }, falla);
  }
  function editorLista(items) {
    return '<label class="campo"><span>Ítems del check list (uno por línea)</span><textarea id="cl-t" rows="12" style="min-height:260px">' + esc(items.join('\n')) + '</textarea></label>';
  }
  function modalListaCurso(e, L, luego) {
    var m = modal('Check list de ingreso de este curso', '<p class="meta" style="margin:0">Estos son los ítems que se revisan a cada participante cuando ingresa. Los cambios aplican solo a este curso; la lista general se edita en Administración.</p>' + editorLista(L),
      '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="cl-ok" type="button">Guardar</button>', { ancho: true });
    $('#cl-ok', m.el).onclick = function () { api('checklist_evento', { evento_id: e.id, items: $('#cl-t', m.el).value.split('\n') }).then(function () { m.cerrar(); toast('Check list del curso guardado.'); luego(); }, function (x) { errorEn(m, x.error); }); };
  }
  function aChecklist(c) {
    c.innerHTML = '<div class="panel"><div class="panel-cab"><h2>Check list de ingreso de participantes</h2><span class="meta">Lista general para todos los cursos nuevos</span></div><div class="panel-cuerpo">' +
      '<p class="meta" style="margin:0 0 10px">Cuando un médico escanea su QR al ingresar, el instrumentador revisa estos ítems. Cada curso puede ajustar su propia lista en la pestaña «Participantes». La lista que viene es de ejemplo: reemplácela con la de CLEMI.</p>' +
      editorLista(S.base.checklist_ingreso || []) + '<div style="display:flex;justify-content:flex-end"><button class="btn btn-oro" id="cl-ok" type="button">Guardar check list</button></div></div></div>';
    $('#cl-ok', c).onclick = function () { api('checklist_global', { items: $('#cl-t', c).value.split('\n') }).then(function () { toast('Check list de ingreso guardado.'); return cargarBase(); }).then(function () { aChecklist(c); }, falla); };
  }
  function csvAsistencia(e, J) {
    var L = J.checklist, cab = ['Curso', 'Día', 'Nombres', 'Apellidos', 'Tipo doc.', 'Documento', 'Especialidad', 'Institución', 'Correo', 'Teléfono', 'Estación', 'Código QR', 'Hora de ingreso', 'Medio', 'Registró', 'Ítems cumplidos', 'Check list completo', 'Observaciones'].concat(L);
    var filas = [];
    J.inscritos.forEach(function (i) {
      e.dias.forEach(function (d) {
        var a = J.asistencias.find(function (x) { return +x.inscrito_id === +i.id && x.fecha === d.fecha; }), its = a ? a.items || {} : {};
        filas.push([e.titulo, d.fecha, i.nombre, i.apellido, i.tipo_doc, i.documento, i.especialidad, i.institucion, i.correo, i.telefono, i.estacion, i.codigo, a ? a.ingreso_en.slice(11, 16) : 'No ingresó', a ? a.medio : '', a ? usuario(a.ingreso_por).nombre : '',
          a ? L.filter(function (t) { return its[t]; }).length + '/' + L.length : '', a ? (+a.completo ? 'Sí' : 'No') : '', a ? a.obs || '' : ''].concat(L.map(function (t) { return its[t] ? 'Sí · ' + usuario(its[t].por).nombre + ' ' + its[t].en.slice(11, 16) : (a ? 'No' : ''); })));
      });
    });
    var csv = '﻿' + [cab].concat(filas).map(function (r) { return r.map(function (x) { x = String(x == null ? '' : x); return /[";\n]/.test(x) ? '"' + x.replace(/"/g, '""') + '"' : x; }).join(';'); }).join('\r\n');
    guardarArchivo(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'Asistencia-' + e.titulo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '-').slice(0, 40) + '.csv').catch(falla);
  }

  // ================================================================== ÁREAS
  function vAreas() {
    var h = hoy(), A = areasYo();
    var pide = [];
    pide.push(A.indexOf('op') >= 0 ? api('eventos&desde=' + h + '&hasta=' + h) : Promise.resolve(null));
    pide.push(A.indexOf('mo') >= 0 ? api('morgue') : Promise.resolve(null));
    pide.push(A.indexOf('ct') >= 0 ? api('contratos') : Promise.resolve(null));
    pide.push(A.indexOf('av') >= 0 ? api('av_pedidos') : Promise.resolve(null));
    pide.push(A.indexOf('ps') >= 0 ? api('ppto_bandeja') : Promise.resolve(null));
    Promise.all(pide).then(function (r) {
      var cards = '', CA = {};
      if (r[0]) {
        var ev = r[0].eventos.filter(function (e) { return e.estado !== 'cancelado' && (e.dias || []).some(function (d) { return d.fecha === h; }); });
        CA.op = '<a class="area-card" href="#/tablero"><div class="area-ico"><svg viewBox="0 0 48 48"><rect x="6" y="18" width="36" height="10" rx="3"/><path d="M10 28v10M38 28v10M16 18l4-8h8l4 8"/></svg></div>' +
          '<h2>Instrumentación</h2><p class="area-sub">Salas e instrumentación quirúrgica</p><p>Agenda de las 6 salas, verificación, distribución en 3D, ingreso con QR, novedades, instrumental y cierre de eventos.</p>' +
          '<div class="area-dato"><b>' + ev.length + '</b> entrenamientos hoy</div></a>';
      }
      if (r[1]) {
        var partes = [].concat.apply([], r[1].componentes.filter(cuentaPartes).map(function (c) { return c.partes; }));
        var cuenta = function (est) { return partes.filter(function (p) { return p.estado === est; }).length; };
        CA.mo = '<a class="area-card mo" href="#/morgue"><div class="area-ico"><svg viewBox="0 0 48 48"><circle cx="24" cy="9" r="5"/><path d="M16 17h16l-2 14h-3l-1 12h-4l-1-12h-3z"/><path d="M8 44h32"/></svg></div>' +
          '<h2>Morgue</h2><p class="area-sub">Componentes anatómicos</p><p>Inventario de cadáveres y segmentos por código, estado de cada parte del cuerpo y su asignación a los eventos.</p>' +
          '<div class="area-dato"><b>' + cuenta('Disponible') + '</b> partes disponibles · <b>' + cuenta('En uso') + '</b> en sala</div></a>';
      }
      if (r[2]) {
        var C = r[2].contratos.filter(function (c) { return c.estado !== 'Cancelado' && c.estado !== 'Finalizado' && c.fecha_fin >= h; });
        CA.ct = '<a class="area-card ct" href="#/ct"><div class="area-ico"><svg viewBox="0 0 48 48"><path d="M12 6h18l8 8v28H12z"/><path d="M30 6v8h8M18 22h14M18 29h14M18 36h8"/></svg></div>' +
          '<h2>Negociación del evento</h2><p class="area-sub">Nueva solicitud y contratación</p><p>Solicitudes y convenios de cada curso, acceso del cliente para armar su sala, aprobación de cambios y paso a la agenda de instrumentación.</p>' +
          '<div class="area-dato"><b>' + C.length + '</b> cursos por realizar · <b>' + C.filter(function (c) { return ['enviado', 'cambio_solicitado'].indexOf(c.plan_estado) >= 0; }).length + '</b> planificaciones por revisar</div></a>';
      }
      if (r[3]) {
        var pend = 0; r[3].pedidos.forEach(function (c) { c.av.forEach(function (x) { if (x.estado === 'Solicitado' || x.estado === 'En preparación') pend++; }); });
        CA.av = '<a class="area-card av" href="#/av"><div class="area-ico"><svg viewBox="0 0 48 48"><rect x="5" y="10" width="38" height="24" rx="3"/><path d="M18 42h12M24 34v8M20 18l9 4-9 4z"/></svg></div>' +
          '<h2>Audiovisuales</h2><p class="area-sub">Equipos, certificaciones y marcación</p><p>Inventario para contratación y lo que requiere cada curso: equipos, certificados, marca de salas, lockers, estaciones, batas y material impreso.</p>' +
          '<div class="area-dato"><b>' + r[3].pedidos.length + '</b> cursos próximos · <b>' + pend + '</b> elementos por preparar</div></a>';
      }
      if (r[4]) {
        var B = r[4].presupuestos, porV = B.filter(function (c) { return c.ppto_estado === 'solicitado'; }).length, espP = B.reduce(function (s, c) { return s + c.especiales_pend; }, 0);
        CA.ps = '<a class="area-card ps" href="#/ps"><div class="area-ico"><svg viewBox="0 0 48 48"><rect x="8" y="6" width="32" height="36" rx="3"/><path d="M15 15h18M15 22h18M15 29h10M30 33l3 3 6-7"/></svg></div>' +
          '<h2>Cotización</h2><p class="area-sub">Presupuesto y almacén</p><p>Catálogo de instrumental, equipos, insumos y servicios; valoración de cada solicitud de contratación y respuesta a las solicitudes especiales.</p>' +
          '<div class="area-dato"><b>' + porV + '</b> por valorar · <b>' + espP + '</b> solicitudes especiales</div></a>';
      }
      if (A.indexOf('th') >= 0) {
        CA.th = '<a class="area-card th" href="#/th"><div class="area-ico"><svg viewBox="0 0 48 48"><circle cx="17" cy="15" r="6"/><circle cx="33" cy="17" r="5"/><path d="M5 40c1-8 6-12 12-12s11 4 12 12M27 30c2-2 4-3 6-3 5 0 9 4 10 11"/></svg></div>' +
          '<h2>Talento Humano</h2><p class="area-sub">Personal y dotación</p><p>Listado y control del personal con sus datos personales y de contratación, tallas, dotación por perfil, calendario de entregas y actas firmadas.</p>' +
          '<div class="area-dato">Personal de CLEMI</div></a>';
      }
      if (A.indexOf('fi') >= 0) {
        CA.fi = '<a class="area-card fi" href="#/firmas"><div class="area-ico"><svg viewBox="0 0 48 48"><path d="M10 6h20l8 8v28H10z"/><path d="M30 6v8h8M16 34c4-6 6 2 9-3s4 3 8 0"/></svg></div>' +
          '<h2>Firma de convenios</h2><p class="area-sub">Representante legal</p><p>Lectura de los convenios firmados por los clientes y firma electrónica de CLEMI. Al firmar, el convenio se archiva y pasa a preparación.</p>' +
          '<div class="area-dato">Convenios que esperan la firma de CLEMI</div></a>';
      }
      if (A.indexOf('ad') >= 0) CA.ad = '<a class="area-card ad" href="#/adm"><div class="area-ico"><svg viewBox="0 0 48 48"><path d="M8 10h6M8 24h6M8 38h6M20 10h20M20 24h20M20 38h20"/><circle cx="11" cy="10" r="3"/><circle cx="11" cy="24" r="3"/><circle cx="11" cy="38" r="3"/></svg></div>' +
        '<h2>Administrativo</h2><p class="area-sub">Seguimiento de convenios</p><p>Seguimiento de cada convenio desde la negociación hasta la llegada a la operación, novedades de los entrenamientos y equipo de Servicios generales y Mantenimiento.</p><div class="area-dato">Negociación → cotización → firma → operación</div></a>';
      if (A.indexOf('lg') >= 0) CA.lg = '<a class="area-card lg" href="#/lg"><div class="area-ico"><svg viewBox="0 0 48 48"><path d="M6 34h4l2-10h24l2 10h4M12 34v4M36 34v4M14 24l3-8h14l3 8M15 30h2M31 30h2"/></svg></div>' +
        '<h2>Logística</h2><p class="area-sub">Comedor, traslados, vuelos y hospedaje</p><p>Listados de participantes, instructores y staff; control de alimentación y restricciones; traslados Hotel · CLEMI · Aeropuerto; vuelos y hoteles aliados.</p><div class="area-dato">Hotel IBIS · Sabana Park · Hotel B3 · Hotel PopArt</div></a>';
      if (A.indexOf('bm') >= 0) CA.bm = '<a class="area-card bm" href="#/bm"><div class="area-ico"><svg viewBox="0 0 48 48"><path d="M4 24h8l4-10 8 20 4-10h16"/></svg></div>' +
        '<h2>Biomédica</h2><p class="area-sub">Inventario de equipos</p><p>Inventario biomédico con unidades disponibles, en mantenimiento y dadas de baja; lo disponible alimenta el catálogo que ve el cliente.</p><div class="area-dato">Equipos biomédicos</div></a>';
      var et = '';
      AREA_ORDEN.forEach(function (a) { if (!CA[a]) return; if (AREA_ETAPA[a] !== et) { et = AREA_ETAPA[a]; cards += '<div class="areas-etapa">' + esc(et) + '</div>'; } cards += CA[a]; });
      montar('<div class="areas"><div class="vista-cab" style="justify-content:center;text-align:center"><div><div class="eyebrow">Bienvenido(a), ' + esc(S.yo.nombre.split(' ')[0]) + '</div><h1>¿A qué área desea entrar?</h1><p>Puede cambiar de área en cualquier momento desde el menú lateral.</p></div></div>' +
        '<div class="areas-grid">' + cards + '</div></div>');
    }, falla);
    S.vista = { refrescar: vAreas };
  }

  // ================================================================== MORGUE · utilidades
  var PCOL = { 'Disponible': '#2E7D4F', 'Reservada': '#C6A13B', 'En uso': '#1F5AA6', 'Dañada': '#A93A32', 'Consumida': '#7a7f7b', 'Descartada': '#3b3f3c' };
  var CEST = ['Disponible', 'Descongelando', 'En uso', 'En cuarentena', 'Fuera de servicio', 'Pendiente de inhumación', 'Disposición final'];
  function cuentaPartes(c) { return c.estado !== 'Disposición final' && c.estado !== 'Pendiente de inhumación'; }
  var CONS = ['Fresco congelado', 'Fresco refrigerado', 'Embalsamado', 'Thiel', 'Otro'];
  var GEO = [
    ['Tórax', '', '<path d="M82 96 Q120 86 158 96 L154 184 L86 184 Z"/>'],
    ['Abdomen', '', '<rect x="86" y="186" width="68" height="56" rx="8"/>'],
    ['Pelvis', '', '<path d="M86 244 L154 244 L160 282 Q120 298 80 282 Z"/>'],
    ['Cabeza y cuello', '', '<circle cx="120" cy="40" r="27"/><rect x="108" y="62" width="24" height="26" rx="6"/>'],
    ['Brazo', 'Derecho', '<rect x="50" y="122" width="24" height="68" rx="10"/>'], ['Brazo', 'Izquierdo', '<rect x="166" y="122" width="24" height="68" rx="10"/>'],
    ['Antebrazo', 'Derecho', '<rect x="47" y="210" width="22" height="62" rx="9"/>'], ['Antebrazo', 'Izquierdo', '<rect x="171" y="210" width="22" height="62" rx="9"/>'],
    ['Muñeca y mano', 'Derecho', '<ellipse cx="57" cy="292" rx="13" ry="20"/>'], ['Muñeca y mano', 'Izquierdo', '<ellipse cx="183" cy="292" rx="13" ry="20"/>'],
    ['Muslo', 'Derecho', '<rect x="84" y="306" width="30" height="96" rx="12"/>'], ['Muslo', 'Izquierdo', '<rect x="126" y="306" width="30" height="96" rx="12"/>'],
    ['Pierna', 'Derecho', '<rect x="88" y="428" width="22" height="66" rx="9"/>'], ['Pierna', 'Izquierdo', '<rect x="130" y="428" width="22" height="66" rx="9"/>'],
    ['Tobillo y pie', 'Derecho', '<ellipse cx="97" cy="506" rx="15" ry="11"/>'], ['Tobillo y pie', 'Izquierdo', '<ellipse cx="143" cy="506" rx="15" ry="11"/>'],
    ['Hombro', 'Derecho', '<circle cx="70" cy="106" r="16"/>'], ['Hombro', 'Izquierdo', '<circle cx="170" cy="106" r="16"/>'],
    ['Codo', 'Derecho', '<circle cx="61" cy="199" r="11"/>'], ['Codo', 'Izquierdo', '<circle cx="179" cy="199" r="11"/>'],
    ['Cadera', 'Derecho', '<circle cx="98" cy="292" r="15"/>'], ['Cadera', 'Izquierdo', '<circle cx="142" cy="292" r="15"/>'],
    ['Rodilla', 'Derecho', '<circle cx="99" cy="414" r="14"/>'], ['Rodilla', 'Izquierdo', '<circle cx="141" cy="414" r="14"/>'],
    ['Columna cervical', '', '<rect x="116" y="66" width="8" height="20" rx="3"/>'],
    ['Columna torácica', '', '<rect x="116" y="100" width="8" height="82" rx="3"/>'],
    ['Columna lumbar', '', '<rect x="116" y="190" width="8" height="50" rx="3"/>'],
    ['Pene', '', '<rect x="114" y="286" width="12" height="26" rx="6"/>'],
    ['Vagina (suelo pélvico)', '', '<ellipse cx="120" cy="299" rx="6.5" ry="11"/>']
  ];
  var GENITAL = { 'Pene': 'Masculino', 'Vagina (suelo pélvico)': 'Femenino' };
  var FEM = ['Muñeca y mano', 'Cadera', 'Rodilla', 'Pierna', 'Cabeza y cuello', 'Pelvis'];
  function ladoTxt(region, lado) { if (!lado) return ''; var f = FEM.indexOf(region) >= 0; return lado === 'Derecho' ? (f ? 'derecha' : 'derecho') : (f ? 'izquierda' : 'izquierdo'); }
  function nombreParte(p) { return p.region + (p.lado ? ' ' + ladoTxt(p.region, p.lado) : ''); }
  function puedeMorgue() { return S.yo && (S.yo.rol === 'admin' || S.yo.rol === 'tanatologo' || S.yo.rol === 'instrumentador'); }
  /* Diagrama del cuerpo. o = { sel: {partId:true}, elegibles: fn(p)->bool, mini } */
  function cuerpo(partes, o) {
    o = o || {};
    var idx = {}; (partes || []).forEach(function (p) { idx[p.region + '|' + p.lado] = p; });
    var out = '<svg class="cuerpo' + (o.mini ? ' mini' : '') + '" viewBox="0 0 240 525" role="img" aria-label="Diagrama del cuerpo">';
    if (!o.mini) out += '<text x="20" y="18" class="cp-lado">D</text><text x="212" y="18" class="cp-lado">I</text>';
    GEO.forEach(function (g) {
      var p = idx[g[0] + '|' + g[1]], col = p ? PCOL[p.estado] || '#999' : '#ece7da';
      if (GENITAL[g[0]] && !p && (!o.sexo || o.sexo !== GENITAL[g[0]])) return;
      var sel = p && o.sel && o.sel[p.id], eleg = p && o.elegibles ? o.elegibles(p) : !!p;
      var col2 = p && o.elegibles && !eleg ? '#d8d4ca' : col;
      out += '<g class="cp-r' + (p ? ' tiene' : ' falta') + (sel ? ' sel' : '') + (p && eleg ? ' eleg' : '') + '"' + (p ? ' data-parte="' + p.id + '"' : '') + ' fill="' + col2 + '"' +
        (p ? '' : ' stroke="#cfc6b3" stroke-dasharray="3 3"') + '><title>' + esc(g[0] + (g[1] ? ' ' + ladoTxt(g[0], g[1]) : '') + (p ? ' · ' + p.codigo + ' · ' + p.estado : ' · no incluida')) + '</title>' + g[2] + '</g>';
    });
    return out + '</svg>';
  }
  function leyendaCuerpo() {
    return '<div class="cp-ley">' + Object.keys(PCOL).map(function (k) { return '<span><i style="background:' + PCOL[k] + '"></i>' + k + '</span>'; }).join('') + '<span><i style="background:#ece7da;border:1px dashed #cfc6b3"></i>No incluida</span></div>';
  }
  function chipParte(est) { return '<span class="chip" style="background:' + (PCOL[est] || '#777') + '22;color:' + (PCOL[est] || '#555') + '">' + esc(est) + '</span>'; }
  var ACOL = { 'Reservada': '#C6A13B', 'En uso': '#1F5AA6', 'Devuelta a morgue': '#2E7D4F', 'Consumida': '#7a7f7b' };
  function chipAsig(est) { return '<span class="chip" style="background:' + (ACOL[est] || '#777') + '22;color:' + (ACOL[est] || '#555') + '">' + esc(est) + '</span>'; }
  function datosComp(c) { return esc(c.sexo) + (c.edad != null && c.edad !== '' ? ' · ' + c.edad + ' años' : '') + ' · ' + esc(c.conservacion); }

  // ================================================================== MORGUE · rutas
  function vMorgue(p) {
    if (p[0] === 'inventario') return vInventario();
    if (p[0] === 'componente') return vComponente(+p[1]);
    if (p[0] === 'eventos') return vMorgueEventos();
    if (p[0] === 'evento') return vMorgueEvento(+p[1]);
    var h = hoy();
    function cargar() {
      return Promise.all([api('morgue'), api('eventos&desde=' + h + '&hasta=' + sumar(h, 7))]).then(function (r) {
        var M = r[0], evs = r[1].eventos.filter(function (e) { return e.estado !== 'cancelado'; });
        var partes = [].concat.apply([], M.componentes.filter(cuentaPartes).map(function (c) { return c.partes; }));
        var n = function (e) { return partes.filter(function (x) { return x.estado === e; }).length; };
        var activos = M.componentes.filter(cuentaPartes);
        var porInhumar = M.componentes.filter(function (c) { return c.estado === 'Pendiente de inhumación'; }).length;
        var asg = M.asignaciones.filter(function (a) { return a.estado === 'Reservada' || a.estado === 'En uso'; });
        var deHoy = evs.filter(function (e) { return (e.dias || []).some(function (d) { return d.fecha === h; }); });
        montar('<div class="vista-cab"><div><div class="eyebrow">Morgue · componentes anatómicos</div><h1>Tablero de morgue</h1><p>' + esc(fLarga(h).replace(/^./, function (c) { return c.toUpperCase(); })) + '. Estado en tiempo real de cadáveres, segmentos y partes en uso.</p></div>' +
          (puedeMorgue() ? '<button class="btn btn-oro" id="m-nuevo" type="button">+ Registrar componente</button>' : '') + '</div>' +
          '<div class="kpis"><div class="kpi oro"><b>' + activos.length + '</b><span>Componentes activos' + (porInhumar ? ' · ' + porInhumar + ' pendientes de inhumación' : '') + '</span></div>' +
          '<div class="kpi"><b style="color:' + PCOL['Disponible'] + '">' + n('Disponible') + '</b><span>Partes disponibles</span></div>' +
          '<div class="kpi"><b style="color:' + PCOL['En uso'] + '">' + n('En uso') + '</b><span>Partes en sala ahora</span></div>' +
          '<div class="kpi"><b style="color:' + PCOL['Reservada'] + '">' + n('Reservada') + '</b><span>Reservadas para eventos</span></div></div>' +
          '<div class="tablero"><div>' +
          '<h2 class="seccion-t" style="margin-top:0">Entrenamientos de hoy</h2><div class="panel">' + (deHoy.length ? '<div class="lista-ev">' + deHoy.map(function (e) {
              var d = (e.dias || []).find(function (x) { return x.fecha === h; }) || {};
              return '<a class="ev-fila" href="#/morgue/evento/' + e.id + '"><div class="ev-hora">' + (d.hora_ini || '') + '<small>a ' + (d.hora_fin_ext || d.hora_fin || '') + '</small></div><div style="min-width:0"><div class="ev-t">' + esc(e.titulo) + '</div>' +
                '<div class="meta">' + esc(sala(e.sala_id).nombre) + ' · Tanatólogo: ' + esc(e.tanatologo_id ? usuario(e.tanatologo_id).nombre : '—') + ' · <b>' + (e.componentes || 0) + '</b> componentes solicitados · <b>' + (e.n_partes || 0) + '</b> partes asignadas</div></div>' +
                (+e.n_partes < +e.componentes ? '<span class="chip st-custodia">Faltan partes</span>' : chipEstado(e.estado)) + '</a>';
            }).join('') + '</div>' : '<div class="vacio">No hay entrenamientos hoy.</div>') + '</div>' +
          '<h2 class="seccion-t">Partes reservadas y en sala</h2><div class="panel">' + tablaAsig(asg, true) + '</div>' +
          '<h2 class="seccion-t">Componentes</h2>' + tarjetasComp(activos) +
          '</div><aside class="panel"><div class="panel-cab"><h2>Movimientos de morgue</h2><a href="#/bitacora" class="btn-link">Bitácora</a></div><div class="feed">' + feed(M.actividad) + '</div></aside></div>');
        enlazarAsig($('#main'), cargar);
        var b = $('#m-nuevo'); if (b) b.onclick = function () { formComponente(null, M.regiones); };
      }, falla);
    }
    S.vista = { refrescar: cargar };
    cargar();
  }
  function avisoIngreso(c) {
    if (c.estado === 'Disposición final' || c.estado === 'Pendiente de inhumación' || (+c.ingreso_img && c.ingreso_normal)) return '';
    var f = [!+c.ingreso_img ? 'imágenes' : '', !c.ingreso_normal ? 'video normal' : ''].filter(Boolean).join(' y ');
    return '<div class="aviso-ing" title="Registro visual de ingreso incompleto">Falta ' + f + ' de ingreso</div>';
  }
  function tarjetasComp(lista) {
    if (!lista.length) return '<div class="panel"><div class="vacio"><strong>Aún no hay componentes registrados</strong>Registre el primer cadáver o segmento con su código para empezar a controlar sus partes.</div></div>';
    return '<div class="comp-grid">' + lista.map(function (c) {
      var t = c.partes.length, d = c.partes.filter(function (p) { return p.estado === 'Disponible'; }).length;
      return '<a class="comp-card" href="#/morgue/componente/' + c.id + '"><div class="comp-fig">' + cuerpo(c.partes, { mini: true, sexo: c.sexo }) + '</div><div class="comp-info"><div class="comp-cod">' + esc(c.codigo) + '</div>' +
        '<div class="meta">' + esc(c.tipo) + ' · ' + datosComp(c) + '</div><div class="meta">' + esc(c.ubicacion || 'Sin ubicación') + '</div>' +
        '<div class="barra" style="margin-top:6px"><i style="width:' + (t ? Math.round(d / t * 100) : 0) + '%"></i></div><div class="meta"><b>' + d + '</b> de ' + t + ' partes disponibles</div>' + avisoIngreso(c) +
        '<span class="chip ' + (c.estado === 'Disponible' ? 'st-devuelto' : c.estado === 'Disposición final' ? 'st-final' : 'st-custodia') + '">' + esc(c.estado) + '</span></div></a>';
    }).join('') + '</div>';
  }
  function tablaAsig(asg, conEvento) {
    if (!asg.length) return '<div class="vacio">No hay partes reservadas ni en sala.</div>';
    return '<div class="tabla-wrap"><table class="tabla"><thead><tr>' + (conEvento ? '<th>Evento</th>' : '') + '<th>Estación</th><th>Parte</th><th>Componente</th><th>Estado</th><th>Último movimiento</th><th></th></tr></thead><tbody>' + asg.map(function (a) {
      var acc = '';
      if (puedeMorgue()) {
        if (a.estado === 'Reservada') acc = '<button class="btn btn-sm btn-verde" data-asg="' + a.id + '" data-est="En uso" type="button">Entregar a sala</button> <button class="btn btn-sm" data-asg="' + a.id + '" data-est="Cancelada" type="button">Liberar</button>';
        if (a.estado === 'En uso') acc = '<button class="btn btn-sm btn-oro" data-asg="' + a.id + '" data-est="Devuelta a morgue" type="button">Recibir en morgue</button> <button class="btn btn-sm" data-asg="' + a.id + '" data-est="Consumida" type="button">Consumida</button>';
      }
      return '<tr>' + (conEvento ? '<td><a href="#/morgue/evento/' + a.evento_id + '">' + esc(a.evento_titulo) + '</a><div class="meta">' + esc(sala(a.sala_id).nombre) + ' · ' + esc(fCorta(a.fecha)) + '</div></td>' : '') +
        '<td><b>' + esc(a.estacion || '—') + '</b></td><td><b class="num">' + esc(a.parte_codigo) + '</b><div class="meta">' + esc(nombreParte(a)) + '</div></td>' +
        '<td><a href="#/morgue/componente/' + a.componente_id + '">' + esc(a.componente_codigo) + '</a>' + (a.sexo ? '<div class="meta">' + esc(a.sexo) + (a.edad ? ' · ' + a.edad + ' años' : '') + '</div>' : '') + '</td>' +
        '<td>' + chipAsig(a.estado) + (a.obs ? '<div class="meta">' + esc(a.obs) + '</div>' : '') + '</td><td class="meta">' + esc(usuario(a.actualizado_por).nombre) + '<br>' + momento(a.actualizado_en) + '</td><td style="white-space:nowrap">' + acc + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function enlazarAsig(c, luego) {
    $$('[data-asg]', c).forEach(function (b) {
      b.onclick = function () { cambiarAsig(+b.getAttribute('data-asg'), b.getAttribute('data-est'), b.closest('tr').querySelector('.num').textContent, luego); };
    });
  }
  function cambiarAsig(id, est, codigo, luego) {
    var cuerpoM = '', titulo = { 'En uso': 'Entregar a sala', 'Cancelada': 'Liberar reserva', 'Devuelta a morgue': 'Recibir en morgue', 'Consumida': 'Registrar parte consumida' }[est];
    if (est === 'Devuelta a morgue') cuerpoM = '<div class="campo"><span class="req">¿En qué condición regresa?</span><div class="seg" id="x-cond"><button type="button" class="on" data-c="Disponible">Disponible para otro uso</button><button type="button" data-c="Dañada">Dañada</button></div></div>' +
      '<label class="campo"><span id="x-obs-l">Observación</span><textarea id="x-obs" maxlength="1000" placeholder="Estado en que regresa, conservación, ubicación en morgue…"></textarea></label>';
    else if (est === 'Consumida') cuerpoM = '<label class="campo"><span class="req">Observación</span><textarea id="x-obs" maxlength="1000" placeholder="Por qué la parte ya no se puede volver a usar"></textarea></label>';
    else cuerpoM = '<label class="campo"><span>Observación (opcional)</span><textarea id="x-obs" maxlength="1000"></textarea></label>';
    var m = modal(titulo + ' · ' + codigo, '<p style="margin:0" class="meta">Queda registrado en la bitácora con su nombre y la hora.</p>' + cuerpoM,
      '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-oro" id="x-ok" type="button">' + esc(titulo) + '</button>');
    var cond = 'Disponible';
    $$('#x-cond button', m.el).forEach(function (b) { b.onclick = function () { cond = b.getAttribute('data-c'); $$('#x-cond button', m.el).forEach(function (x) { x.classList.toggle('on', x === b); }); $('#x-obs-l', m.el).className = cond === 'Dañada' ? 'req' : ''; }; });
    $('#x-ok', m.el).onclick = function () {
      api('asignacion_estado', { id: id, estado: est, condicion: cond, obs: $('#x-obs', m.el) ? $('#x-obs', m.el).value : '' }).then(function () { m.cerrar(); toast(titulo + ': ' + esc(codigo) + '.'); luego(); }, function (x) { errorEn(m, x.error); });
    };
  }

  // ------------------------------------------------------------ exportación para Odoo
  // Excel con dos hojas (Componentes y Partes). La columna «id» es el ID externo de Odoo:
  // si se vuelve a importar el mismo archivo, Odoo actualiza los registros en vez de duplicarlos.
  function idOdoo(pre, cod) { return 'clemi_' + pre + '_' + String(cod).toLowerCase().replace(/[^a-z0-9]+/g, '_'); }
  function filasOdoo(comps) {
    var C = [], P = [];
    comps.forEach(function (c) {
      var cnt = {}; (c.partes || []).forEach(function (p) { cnt[p.estado] = (cnt[p.estado] || 0) + 1; });
      var ad = c.adjuntos || [], d = c.disposicion || (c.dispo_tipo ? { tipo: c.dispo_tipo, fecha_hora: c.dispo_fecha, destino: c.dispo_destino, entidad: c.dispo_entidad, documento: c.dispo_documento, recibe_nombre: c.dispo_recibe } : null);
      var imgs = c.ingreso_img != null ? +c.ingreso_img : ad.filter(function (a) { return a.clase === 'imagen' && a.momento === 'Ingreso'; }).length;
      var vid = c.ingreso_normal != null ? !!c.ingreso_normal : ad.some(function (a) { return a.clase === 'video' && a.momento === 'Ingreso'; });
      var U = []; try { U = JSON.parse(c.usos_previos || '[]') || []; } catch (e) {}
      C.push({ 'id': idOdoo('componente', c.codigo), 'Referencia': c.tipo + ' ' + c.codigo, 'Código': String(c.codigo), 'Tipo': c.tipo, 'Sexo': c.sexo, 'Edad': c.edad != null && c.edad !== '' ? +c.edad : '',
        'Fecha de ingreso': c.fecha_ingreso, 'Conservación': c.conservacion, 'Procedencia': c.procedencia || '', 'Ubicación': c.ubicacion || '', 'Estado': c.estado,
        'Responsable': c.responsable || '', 'Unidades en Odoo': c.odoo_unidades != null ? +c.odoo_unidades : '', 'Nombre': c.nombre_donante || '', 'Documento de identidad': c.documento || '', 'Nº de registro / certificado': c.registro_num || '', 'Destino previsto': c.destino_previsto || '',
        'Partes registradas': (c.partes || []).length, 'Partes disponibles': cnt['Disponible'] || 0, 'Partes reservadas o en uso': (cnt['Reservada'] || 0) + (cnt['En uso'] || 0),
        'Partes dañadas': cnt['Dañada'] || 0, 'Partes consumidas o descartadas': (cnt['Consumida'] || 0) + (cnt['Descartada'] || 0),
        'Imágenes de ingreso': imgs, 'Video de ingreso': vid ? 'Sí' : 'No',
        'Disposición final': d ? d.tipo : '', 'Fecha de disposición': d && d.fecha_hora ? String(d.fecha_hora).slice(0, 10) : '', 'Destino': d ? d.destino || '' : '', 'Entidad que recibe': d ? d.entidad || '' : '',
        'Documento soporte': d ? d.documento || '' : '', 'Recibió': d ? d.recibe_nombre || '' : '',
        'Cursos en que se usó (registro de morgue)': U.map(function (u) { return (u.fecha ? u.fecha + ' ' : '') + u.curso; }).join(' | '), 'Observaciones': c.obs || '', 'Registrado el': String(c.creado_en || '').slice(0, 10) });
      (c.partes || []).forEach(function (p) {
        P.push({ 'id': idOdoo('parte', p.codigo), 'Componente (ID externo)': idOdoo('componente', c.codigo), 'Componente': String(c.codigo), 'Código de la parte': p.codigo, 'Parte': nombreParte(p),
          'Región': p.region, 'Lado': p.lado || '', 'Estado': p.estado, 'Usos': +p.usos || 0,
          'Estructuras con novedad': (function () { var x = subDe(p); return Object.keys(x).map(function (n) { return n + ': ' + x[n].estado + (x[n].obs ? ' (' + x[n].obs + ')' : ''); }).join(' | '); })() });
      });
    });
    return { C: C, P: P };
  }
  // Mismo formato de la plantilla de productos de Odoo que usa morgue (product.template).
  function productosOdoo(comps) {
    return comps.map(function (c) {
      var disp = (c.partes || []).filter(function (p) { return p.estado === 'Disponible'; }).length;
      return { 'Favorito': 'Normal', 'Nombre': c.codigo + ' COMPONENTE', 'Referencia Interna': String(c.codigo), 'Responsable': String(c.responsable || '').toUpperCase(),
        'Precio de venta': 0, 'Costo': 0, 'Cantidad a Mano': c.estado === 'Disposición final' ? 0 : disp, 'Cantidad Proyectada': c.estado === 'Disposición final' ? 0 : disp, 'Unidad de Medida': 'Unidades' };
    });
  }
  function exportarOdoo(comps, nombre, formato) {
    if (!window.XLSX) return toast('No se pudo cargar el generador de Excel.', 'error');
    if (formato === 'producto') {
      var wbp = XLSX.utils.book_new(), hp = XLSX.utils.json_to_sheet(productosOdoo(comps));
      hp['!cols'] = [{ wch: 10 }, { wch: 24 }, { wch: 16 }, { wch: 30 }, { wch: 14 }, { wch: 8 }, { wch: 15 }, { wch: 18 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wbp, hp, 'Sheet1');
      return guardarArchivo(new Blob([XLSX.write(wbp, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombre + '-productos.xlsx').catch(falla);
    }
    var F = filasOdoo(comps);
    if (formato === 'csv') {
      var aCsv = function (rows) { return '\ufeff' + XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(rows), { FS: ',' }); };
      return guardarArchivo(new Blob([aCsv(F.C)], { type: 'text/csv;charset=utf-8' }), nombre + '-componentes.csv').then(function () {
        return guardarArchivo(new Blob([aCsv(F.P)], { type: 'text/csv;charset=utf-8' }), nombre + '-partes.csv');
      }).catch(falla);
    }
    var wb = XLSX.utils.book_new();
    var h1 = XLSX.utils.json_to_sheet(F.C), h2 = XLSX.utils.json_to_sheet(F.P);
    h1['!cols'] = Object.keys(F.C[0] || {}).map(function (k) { return { wch: Math.max(10, Math.min(40, k.length + 4)) }; });
    h2['!cols'] = Object.keys(F.P[0] || {}).map(function (k) { return { wch: Math.max(10, Math.min(36, k.length + 4)) }; });
    XLSX.utils.book_append_sheet(wb, h1, 'Componentes'); XLSX.utils.book_append_sheet(wb, h2, 'Partes');
    var bin = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return guardarArchivo(new Blob([bin], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombre + '.xlsx').catch(falla);
  }
  function modalOdoo(visibles, todos) {
    var m = modal('Exportar fichas para Odoo',
      '<label class="campo"><span>¿Qué fichas?</span><select id="o-alc"><option value="v">Las que se ven en la lista (' + visibles.length + ')</option><option value="t">Todas las fichas (' + todos.length + ')</option></select></label>' +
      '<label class="campo"><span>Formato</span><select id="o-fmt"><option value="xlsx">Excel (.xlsx) · hojas «Componentes» y «Partes»</option><option value="csv">Dos archivos CSV (componentes y partes)</option><option value="producto">Productos de Odoo (mismo formato de la plantilla de morgue)</option></select></label>' +
      '<p class="meta" style="margin:0">En Odoo: abra el modelo donde lleva la morgue → Favoritos → <b>Importar registros</b> → cargue el archivo (en Excel elija la hoja) y relacione cada columna con su campo. La columna <b>id</b> es el ID externo: si vuelve a importar el archivo, Odoo actualiza las fichas en vez de duplicarlas. En la hoja «Partes», «Componente (ID externo)» enlaza cada parte con su cuerpo.</p>',
      '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="o-ok" type="button">Descargar</button>');
    $('#o-ok', m.el).onclick = function () {
      var l = $('#o-alc', m.el).value === 't' ? todos : visibles;
      if (!l.length) return errorEn(m, 'No hay fichas para exportar.');
      m.cerrar(); exportarOdoo(l, 'Morgue-CLEMI-Odoo-' + hoy(), $('#o-fmt', m.el).value);
    };
  }

  // ------------------------------------------------------------ inventario
  function vInventario() {
    var q = '', f = 'activos', M = null;
    function pintar() {
      var lista = M.componentes.filter(function (c) {
        var okF = f === 'todos' || (f === 'activos' ? c.estado !== 'Disposición final' : c.estado === f);
        return okF && (!q || (c.codigo + ' ' + c.sexo + ' ' + c.conservacion + ' ' + c.ubicacion + ' ' + c.procedencia + ' ' + (c.nombre_donante || '') + ' ' + (c.documento || '')).toLowerCase().indexOf(q.toLowerCase()) >= 0);
      });
      $('#inv-lista').innerHTML = lista.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Código</th><th>Tipo</th><th>Sexo</th><th>Edad</th><th>Conservación</th><th>Ubicación</th><th>Partes</th><th>Estado</th></tr></thead><tbody>' + lista.map(function (c) {
        var cnt = {}; c.partes.forEach(function (p) { cnt[p.estado] = (cnt[p.estado] || 0) + 1; });
        return '<tr class="clic" data-comp="' + c.id + '"><td><b class="num">' + esc(c.codigo) + '</b><div class="meta">Ingreso ' + esc(fCorta(c.fecha_ingreso)) + ' ' + esc(String(c.fecha_ingreso).slice(0, 4)) + (c.nombre_donante ? ' · ' + esc(c.nombre_donante) : '') + '</div>' + avisoIngreso(c) + '</td><td>' + esc(c.tipo) + '</td><td>' + esc(c.sexo) + '</td><td class="num">' + (c.edad != null && c.edad !== '' ? c.edad : '—') + '</td><td>' + esc(c.conservacion) + '</td><td>' + esc(c.ubicacion || '—') + '</td>' +
          '<td><div class="mini-barra">' + Object.keys(PCOL).map(function (k) { return cnt[k] ? '<i style="flex:' + cnt[k] + ';background:' + PCOL[k] + '" title="' + cnt[k] + ' ' + k + '"></i>' : ''; }).join('') + '</div><div class="meta">' + (cnt['Disponible'] || 0) + ' disp. de ' + c.partes.length + '</div></td>' +
          '<td><span class="chip ' + (c.estado === 'Disponible' ? 'st-devuelto' : c.estado === 'Disposición final' ? 'st-final' : 'st-custodia') + '">' + esc(c.estado) + '</span></td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="vacio"><strong>' + (M.componentes.length ? 'Sin resultados' : 'Aún no hay componentes') + '</strong>' + (M.componentes.length ? 'Pruebe otro filtro.' : 'Registre el primer componente anatómico con su código.') + '</div>';
      $$('[data-comp]').forEach(function (tr) { tr.onclick = function () { location.hash = '#/morgue/componente/' + tr.getAttribute('data-comp'); }; });
    }
    function cargar() { return api('morgue').then(function (j) { M = j; pintar(); }, falla); }
    montar('<div class="vista-cab"><div><div class="eyebrow">Morgue</div><h1>Inventario de componentes anatómicos</h1><p>Cadáveres y segmentos por código, con el estado de cada parte del cuerpo.</p></div>' +
      '<div class="acciones"><button class="btn" id="inv-odoo" type="button">Exportar para Odoo</button>' + (puedeMorgue() ? '<button class="btn btn-oro" id="inv-nuevo" type="button">+ Registrar componente</button>' : '') + '</div></div>' +
      '<div class="panel"><div class="panel-cab"><div class="seg" id="inv-f"><button type="button" data-f="activos" class="on">Activos</button>' + CEST.map(function (e) { return '<button type="button" data-f="' + e + '">' + e + '</button>'; }).join('') + '<button type="button" data-f="todos">Todos</button></div>' +
      '<input type="search" id="inv-q" placeholder="Buscar código, nombre, documento, ubicación…" style="max-width:320px"></div><div id="inv-lista"><div class="vacio">Cargando…</div></div></div>');
    $('#inv-q').oninput = function () { q = this.value; if (M) pintar(); };
    $$('#inv-f button').forEach(function (b) { b.onclick = function () { f = b.getAttribute('data-f'); $$('#inv-f button').forEach(function (x) { x.classList.toggle('on', x === b); }); if (M) pintar(); }; });
    var nb = $('#inv-nuevo'); if (nb) nb.onclick = function () { formComponente(null, M ? M.regiones : null); };
    $('#inv-odoo').onclick = function () {
      if (!M) return;
      var vis = M.componentes.filter(function (c) { var okF = f === 'todos' || (f === 'activos' ? c.estado !== 'Disposición final' : c.estado === f); return okF && (!q || (c.codigo + ' ' + c.sexo + ' ' + c.conservacion + ' ' + c.ubicacion + ' ' + c.procedencia + ' ' + (c.nombre_donante || '') + ' ' + (c.documento || '')).toLowerCase().indexOf(q.toLowerCase()) >= 0); });
      modalOdoo(vis, M.componentes);
    };
    S.vista = { refrescar: cargar };
    cargar();
  }

  function formComponente(c, regiones) {
    var nuevo = !c; c = c || { codigo: '', tipo: 'Cuerpo completo', sexo: '', edad: '', fecha_ingreso: hoy(), procedencia: '', conservacion: 'Fresco congelado', estado: 'Disponible', ubicacion: '', obs: '' };
    var regs = regiones || [], tiene = {}, usadas = {};
    (c.partes || []).forEach(function (p) { tiene[p.region + (p.lado ? '|' + p.lado : '')] = p; });
    (c.asignaciones || []).forEach(function (a) { usadas[a.parte_id] = 1; });
    var m = modal(nuevo ? 'Registrar componente anatómico' : 'Editar ' + c.codigo, '<div class="form-grid">' +
      '<label class="campo"><span class="req">Código</span><input id="c-cod" maxlength="40" value="' + esc(c.codigo) + '" placeholder="Ej. CLEMI-CA-0107" style="text-transform:uppercase"><small>Cada parte recibe este código más su abreviatura (ej. -ROD rodilla derecha).</small></label>' +
      '<label class="campo"><span class="req">Tipo</span><select id="c-tipo"><option' + (c.tipo === 'Cuerpo completo' ? ' selected' : '') + '>Cuerpo completo</option><option' + (c.tipo === 'Segmento' ? ' selected' : '') + '>Segmento</option></select></label>' +
      '<label class="campo"><span class="req">Sexo</span><select id="c-sexo"><option value="">Seleccione…</option>' + ['Masculino', 'Femenino', 'Indeterminado'].map(function (x) { return '<option' + (c.sexo === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>' +
      '<label class="campo"><span>Edad (años)</span><input type="number" min="0" max="120" id="c-edad" value="' + esc(c.edad == null ? '' : c.edad) + '"></label>' +
      '<label class="campo"><span class="req">Fecha de ingreso</span><input type="date" id="c-fecha" value="' + esc(c.fecha_ingreso) + '"></label>' +
      '<label class="campo"><span class="req">Conservación</span><select id="c-cons">' + CONS.map(function (x) { return '<option' + (c.conservacion === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>' +
      '<label class="campo"><span>Estado general</span><select id="c-est"' + (c.estado === 'Disposición final' ? ' disabled' : '') + '>' + CEST.filter(function (x) { return x !== 'Disposición final' || c.estado === x; }).map(function (x) { return '<option' + (c.estado === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>' +
      '<label class="campo"><span>Ubicación en morgue</span><input id="c-ub" maxlength="200" value="' + esc(c.ubicacion) + '" placeholder="Ej. Congelador 2 · bandeja B"></label>' +
      '<label class="campo ancho"><span>Procedencia / convenio</span><input id="c-proc" maxlength="200" value="' + esc(c.procedencia) + '" placeholder="Ej. Hospital Santa Clara"></label>' +
      '<div class="ct-sec ancho">Identificación (registro de morgue · confidencial)</div>' +
      '<label class="campo"><span>Nombre</span><input id="c-nom" maxlength="160" value="' + esc(c.nombre_donante || '') + '"></label>' +
      '<label class="campo"><span>Responsable del componente</span><input id="c-resp" maxlength="120" list="c-resp-l" value="' + esc(c.responsable || '') + '"><datalist id="c-resp-l">' + (S.base.usuarios || []).filter(function (u) { return u.rol === 'tanatologo' && +u.activo; }).map(function (u) { return '<option value="' + esc(u.nombre) + '">'; }).join('') + '</datalist></label>' +
      '<label class="campo"><span>Documento de identidad</span><input id="c-doc" maxlength="40" value="' + esc(c.documento || '') + '"></label>' +
      '<label class="campo"><span>Nº de registro / certificado</span><input id="c-reg" maxlength="60" value="' + esc(c.registro_num || '') + '"></label>' +
      '<label class="campo"><span>Destino previsto</span><select id="c-dest"><option value="">Sin definir</option>' + ['Inhumación', 'Cremación', 'Devolución a familiares', 'Devolución a la entidad de origen', 'Otra'].map(function (x) { return '<option' + (c.destino_previsto === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>' +
      '<div class="campo ancho" id="c-seg"' + (c.tipo === 'Segmento' ? '' : ' hidden') + '><span class="req">Partes que incluye el segmento</span>' +
        (nuevo ? '' : '<small>Las partes con historial en eventos o que no están disponibles no se pueden retirar; márquelas como «Descartada» desde la parte.</small>') +
        '<div class="seg-partes">' + regs.map(function (r) {
          return (r[2] ? ['Derecho', 'Izquierdo'] : ['']).map(function (l) {
            var k = r[0] + (l ? '|' + l : ''), ex = tiene[k], fija = ex && (ex.estado !== 'Disponible' || usadas[ex.id]);
            return '<label class="check"' + (r[3] ? ' data-sexo="' + r[3] + '"' + (r[3] !== c.sexo ? ' hidden' : '') : '') + (fija ? ' title="Tiene historial o no está disponible"' : '') + '><input type="checkbox" class="c-parte" value="' + esc(k) + '"' + (ex ? ' checked' : '') + (fija ? ' disabled' : '') + '>' + esc(r[0] + (l ? ' ' + ladoTxt(r[0], l) : '')) + '</label>';
          }).join('');
        }).join('') + '</div></div>' +
      (nuevo ? '' : '<p class="meta ancho" id="c-aviso-tipo" hidden style="margin:0"></p>') +
      '<label class="campo ancho"><span>Observaciones</span><textarea id="c-obs" maxlength="3000">' + esc(c.obs) + '</textarea></label></div>',
      '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="c-ok" type="button">' + (nuevo ? 'Registrar componente' : 'Guardar cambios') + '</button>', { ancho: true });
    $('#c-tipo', m.el).onchange = function () {
      $('#c-seg', m.el).hidden = this.value !== 'Segmento';
      var av = $('#c-aviso-tipo', m.el); if (!av) return;
      var sx = $('#c-sexo', m.el).value;
      var faltan = regs.filter(function (r) { return !r[3] || r[3] === sx; }).reduce(function (n, r) { return n + (r[2] ? ['Derecho', 'Izquierdo'] : ['']).filter(function (l) { return !tiene[r[0] + (l ? '|' + l : '')]; }).length; }, 0);
      av.hidden = this.value === c.tipo;
      av.textContent = this.value === 'Cuerpo completo' ? (faltan ? 'Al guardar se agregarán las ' + faltan + ' partes que faltan para completar el cuerpo.' : 'El componente ya tiene todas las partes.') : 'Marque solo las partes que conserva el segmento.';
    };
    $('#c-sexo', m.el).onchange = function () {
      var sx = this.value;
      $$('[data-sexo]', m.el).forEach(function (l) { var on = l.getAttribute('data-sexo') === sx; l.hidden = !on; var cb = $('input', l); if (!on) cb.checked = false; });
    };
    var confirmar = false;
    $$('.c-parte', m.el).forEach(function (x) { x.onchange = function () { confirmar = false; }; });
    $('#c-ok', m.el).onclick = function () {
      var d = { id: nuevo ? 0 : c.id, codigo: $('#c-cod', m.el).value, tipo: $('#c-tipo', m.el).value, sexo: $('#c-sexo', m.el).value, edad: $('#c-edad', m.el).value, fecha_ingreso: $('#c-fecha', m.el).value,
        conservacion: $('#c-cons', m.el).value, estado: $('#c-est', m.el).value, ubicacion: $('#c-ub', m.el).value, procedencia: $('#c-proc', m.el).value, obs: $('#c-obs', m.el).value,
        nombre_donante: $('#c-nom', m.el).value, responsable: $('#c-resp', m.el).value, documento: $('#c-doc', m.el).value, registro_num: $('#c-reg', m.el).value, destino_previsto: $('#c-dest', m.el).value,
        partes: $$('.c-parte:checked', m.el).filter(function (x) { return !x.closest('label').hidden; }).map(function (x) { return x.value; }) };
      if (!nuevo && d.tipo === 'Segmento') {
        var quita = Object.keys(tiene).filter(function (k) { return d.partes.indexOf(k) < 0; });
        if (quita.length && !confirmar) { confirmar = true; errorEn(m, 'Se retirarán ' + quita.length + ' parte(s) del componente: ' + quita.map(function (k) { return nombreParte(tiene[k]); }).join(', ') + '. Pulse «Guardar cambios» otra vez para confirmar.'); return; }
      }
      api('componente_guardar', d).then(function (j) { m.cerrar(); toast(nuevo ? 'Componente registrado con sus partes.' : 'Cambios guardados.'); if (nuevo) { S.pedirIngreso = j.id; location.hash = '#/morgue/componente/' + j.id; } else if (S.vista && S.vista.refrescar) S.vista.refrescar(); else refrescar(); }, function (x) { errorEn(m, x.error); });
    };
  }

  // ------------------------------------------------------------ adjuntos de la morgue
  var ADJ_ICO = { modelo3d: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 22V12M3 7l9 5 9-5"/>', imagen: '<path d="M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4"/><circle cx="15.5" cy="9" r="1.5"/>', video: '<path d="M3 6h13v12H3zM16 10l5-3v10l-5-3"/>', documento: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7"/>' };
  function adjUrl(a, descargar) {
    if (window.CLEMI_DEMO && window.CLEMI_DEMO.adjunto) return window.CLEMI_DEMO.adjunto(a);
    return 'api.php?a=adjunto_ver&id=' + a.id + (descargar ? '&descargar=1' : '');
  }
  function pesoTxt(b) { b = +b || 0; return b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function extDe(n) { var m = /\.([a-z0-9]+)$/i.exec(n || ''); return m ? m[1].toLowerCase() : ''; }
  function panelAdjuntos(c, j, puede) {
    var adj = (c.adjuntos || []).filter(function (a) { return a.clase !== 'giro'; }), n = { imagen: 0, video: 0, documento: 0, modelo3d: 0 };
    adj.forEach(function (a) { n[a.clase] = (n[a.clase] || 0) + 1; });
    var parteDe = function (id) { return c.partes.find(function (p) { return +p.id === +id; }); };
    return '<h2 class="seccion-t">Archivos adjuntos</h2><div class="panel adj-panel"><div class="panel-cab"><div class="adj-filtros" role="group" aria-label="Filtrar adjuntos">' +
      [['', 'Todos', adj.length], ['imagen', 'Imágenes', n.imagen], ['documento', 'Documentos', n.documento], ['video', 'Videos', n.video]].concat(n.modelo3d ? [['modelo3d', 'Modelos 3D', n.modelo3d]] : []).map(function (f, i) {
        return '<button type="button" class="' + (i ? '' : 'on') + '" data-adjf="' + f[0] + '">' + f[1] + ' <small>' + f[2] + '</small></button>';
      }).join('') + '</div>' + (puede ? '<button class="btn btn-oro btn-sm" id="adj-subir" type="button">+ Adjuntar archivos</button>' : '') + '</div>' +
      (adj.length ? '<div class="adj-grid">' + adj.map(function (a) {
        var p = a.parte_id ? parteDe(a.parte_id) : null;
        var vista = a.clase === 'imagen' ? '<img src="' + esc(adjUrl(a)) + '" alt="" loading="lazy">' :
          '<span class="adj-ico adj-' + a.clase + '"><svg viewBox="0 0 24 24">' + ADJ_ICO[a.clase] + '</svg><b>' + esc(extDe(a.nombre).toUpperCase()) + '</b></span>';
        return '<figure class="adj-card" data-adj="' + a.id + '" data-clase="' + a.clase + '"><button type="button" class="adj-vista" data-ver="' + a.id + '" aria-label="Ver ' + esc(a.nombre) + '">' + vista + (a.clase === 'video' ? '<span class="adj-play"></span>' : '') + '</button>' +
          '<figcaption><b title="' + esc(a.nombre) + '">' + esc(a.nombre) + '</b>' + (a.descripcion ? '<span>' + esc(a.descripcion) + '</span>' : '') +
          '<small>' + (a.momento && a.momento !== 'General' ? '<i class="adj-mom">' + esc(a.momento) + (a.tipo_video ? ' · ' + (a.tipo_video === '360' ? '360°' : 'normal') : '') + '</i> · ' : '') + (p ? '<i class="adj-parte">' + esc(nombreParte(p)) + '</i> · ' : '') + pesoTxt(a.tamano) + ' · ' + esc(usuario(a.creado_por).nombre) + ' · ' + momento(a.creado_en) + '</small></figcaption></figure>';
      }).join('') + '</div>' : '<div class="vacio">Sin archivos adjuntos. Aquí puede guardar fotos del componente y de cada parte, documentos (actas de ingreso, consentimientos, protocolos) y videos.</div>') + '</div>';
  }
  function enlazarAdjuntos(c, j, puede, recargar) {
    $$('[data-adjf]').forEach(function (b) { b.onclick = function () {
      $$('[data-adjf]').forEach(function (x) { x.classList.toggle('on', x === b); });
      var f = b.getAttribute('data-adjf');
      $$('.adj-card').forEach(function (k) { k.hidden = f && k.getAttribute('data-clase') !== f; });
    }; });
    $$('[data-ver]').forEach(function (b) { b.onclick = function () { var a0 = c.adjuntos.find(function (a) { return +a.id === +b.getAttribute('data-ver'); }); if (a0 && a0.clase === 'modelo3d') return abrirVista(c, a0, puede, recargar); verAdjunto(c.adjuntos.find(function (a) { return +a.id === +b.getAttribute('data-ver'); }), c, puede, recargar); }; });
    var bs = $('#adj-subir'); if (bs) bs.onclick = function () { modalAdjuntar(c, j, recargar); };
  }
  function verAdjunto(a, c, puede, recargar) {
    var url = adjUrl(a), cuerpo;
    if (a.clase === 'imagen') cuerpo = '<img class="adj-full" src="' + esc(url) + '" alt="' + esc(a.nombre) + '">';
    else if (a.clase === 'video') cuerpo = /^(mp4|m4v|webm|mov)$/.test(extDe(a.nombre)) ? '<video class="adj-full" src="' + esc(url) + '" controls playsinline preload="metadata"></video><p class="meta">Si el video no se reproduce en este navegador, descárguelo.</p>' : '<div class="vacio">Este formato de video no se puede reproducir en el navegador. Descárguelo para verlo.</div>';
    else if (extDe(a.nombre) === 'pdf' && !window.CLEMI_DEMO) cuerpo = '<iframe class="adj-pdf" src="' + esc(url) + '" title="' + esc(a.nombre) + '"></iframe>';
    else cuerpo = '<div class="vacio"><strong>' + esc(a.nombre) + '</strong>' + pesoTxt(a.tamano) + ' · descárguelo para abrirlo.</div>';
    var p = a.parte_id ? c.partes.find(function (x) { return +x.id === +a.parte_id; }) : null;
    var borra = puede && (S.yo.rol === 'admin' || +a.creado_por === +S.yo.id);
    var m = modal(a.nombre, cuerpo + '<p class="meta" style="margin:10px 0 0">' + (p ? 'Parte: <b>' + esc(p.codigo) + '</b> · ' + esc(nombreParte(p)) + '<br>' : 'Componente completo · ') + 'Subido por ' + esc(usuario(a.creado_por).nombre) + ' · ' + momento(a.creado_en) + ' · ' + pesoTxt(a.tamano) + (a.descripcion ? '<br>' + esc(a.descripcion) : '') + '</p>',
      (borra ? '<button class="btn btn-peligro" id="adj-del" type="button" style="margin-right:auto">Eliminar</button>' : '') + '<button class="btn" data-cerrar type="button">Cerrar</button><a class="btn btn-verde" id="adj-dl" href="' + esc(adjUrl(a, true)) + '" download="' + esc(a.nombre) + '">Descargar</a>', { ancho: true, sinFoco: true });
    var dl = $('#adj-dl', m.el);
    if (window.CLEMI_DEMO) dl.onclick = function (e) { e.preventDefault(); fetch(url).then(function (r) { return r.blob(); }).then(function (b) { guardarArchivo(b, a.nombre); }); };
    var bd = $('#adj-del', m.el); if (bd) {
      var seguro = false;
      bd.onclick = function () {
        if (!seguro) { seguro = true; bd.textContent = '¿Eliminar definitivamente?'; return; }
        api('adjunto_borrar', { id: a.id }).then(function () { m.cerrar(); toast('Adjunto eliminado.'); recargar(); }, function (x) { errorEn(m, x.error); });
      };
    }
  }
  function subirArchivo(fd, progreso) {
    if (window.CLEMI_DEMO && window.CLEMI_DEMO.subir) return window.CLEMI_DEMO.subir(fd, progreso);
    return new Promise(function (ok, mal) {
      var x = new XMLHttpRequest();
      x.open('POST', 'api.php?a=adjunto_subir'); x.setRequestHeader('X-CSRF', S.csrf); x.withCredentials = true;
      x.upload.onprogress = function (e) { if (e.lengthComputable && progreso) progreso(e.loaded / e.total); };
      x.onload = function () { var j; try { j = JSON.parse(x.responseText); } catch (e) { j = { ok: false, error: x.status === 413 ? 'El archivo supera el tamaño que permite el servidor.' : 'Respuesta inesperada del servidor (' + x.status + ').' }; } if (x.status === 401) mostrarLogin(); j.ok ? ok(j) : mal(j); };
      x.onerror = function () { mal({ ok: false, error: 'No hay conexión con el servidor. Revise la conexión a internet.' }); };
      x.send(fd);
    });
  }
  function modalAdjuntar(c, j, recargar, parteFija, opc) {
    opc = opc || {};
    var lim = +j.limite_adjunto || 0, tipos = j.tipos_adjunto || [];
    var m = modal((opc.titulo || 'Adjuntar archivos a ' + c.codigo),
      '<label class="campo adj-drop" id="adj-drop"><span class="req">Archivos</span><input type="file" id="adj-f" multiple accept="' + (opc.accept || tipos.map(function (t) { return '.' + t; }).join(',') + ',image/*,video/*') + '"><small>Imágenes, documentos (PDF, Word, Excel, PowerPoint) y videos. Máximo ' + pesoTxt(lim) + ' por archivo. Puede elegir varios a la vez.</small></label>' +
      '<ul class="adj-cola" id="adj-cola"></ul>' +
      '<label class="campo"><span>¿De qué parte es?</span><select id="adj-p"><option value="">Todo el componente</option>' + c.partes.map(function (p) { return '<option value="' + p.id + '"' + (+parteFija === +p.id ? ' selected' : '') + '>' + esc(nombreParte(p)) + ' · ' + esc(p.codigo) + '</option>'; }).join('') + '</select></label>' +
      '<label class="campo"><span>Descripción</span><input id="adj-d" maxlength="500" placeholder="Ej. Estado de la rodilla al ingreso, acta de donación, video de la disección…"></label>',
      '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="adj-ok" type="button">Subir</button>', { ancho: true });
    var inp = $('#adj-f', m.el), cola = $('#adj-cola', m.el), enviando = false;
    function revisar() {
      var fs = Array.prototype.slice.call(inp.files || []);
      cola.innerHTML = fs.map(function (f, i) {
        var e = extDe(f.name), mal = tipos.length && tipos.indexOf(e) < 0 ? 'Tipo no permitido' : (lim && f.size > lim ? 'Supera ' + pesoTxt(lim) : '');
        return '<li data-i="' + i + '"' + (mal ? ' class="mal"' : '') + '><span>' + esc(f.name) + '</span><small>' + (mal || pesoTxt(f.size)) + '</small><i class="adj-barra"><em></em></i></li>';
      }).join('');
    }
    inp.onchange = revisar;
    $('#adj-ok', m.el).onclick = function () {
      if (enviando) return;
      var fs = Array.prototype.slice.call(inp.files || []);
      if (!fs.length) return errorEn(m, 'Elija uno o varios archivos.');
      var malos = $$('li.mal', cola); if (malos.length) return errorEn(m, 'Quite los archivos marcados en rojo (tipo no permitido o demasiado grandes).');
      enviando = true; var bt = $('#adj-ok', m.el); bt.disabled = true; bt.textContent = 'Subiendo…';
      var i = 0, subidos = 0;
      (function siguiente() {
        if (i >= fs.length) { m.cerrar(); toast(subidos + (subidos === 1 ? ' archivo adjuntado.' : ' archivos adjuntados.')); recargar(); return; }
        var li = $('li[data-i="' + i + '"]', cola), barra = $('em', li);
        var fd = new FormData(); fd.append('archivo', fs[i]); fd.append('componente_id', c.id); fd.append('parte_id', $('#adj-p', m.el).value); fd.append('descripcion', $('#adj-d', m.el).value); if (opc.momento) fd.append('momento', opc.momento);
        li.classList.add('subiendo');
        subirArchivo(fd, function (p) { barra.style.width = Math.round(p * 100) + '%'; }).then(function () {
          barra.style.width = '100%'; li.classList.remove('subiendo'); li.classList.add('ok'); subidos++; i++; siguiente();
        }, function (x) {
          li.classList.add('mal'); $('small', li).textContent = x.error || 'Error';
          errorEn(m, fs[i].name + ': ' + (x.error || 'no se pudo subir.')); enviando = false; bt.disabled = false; bt.textContent = 'Reintentar';
          if (subidos) recargar();
          // quitar los ya subidos para reintentar solo el resto
          var dt = new DataTransfer(); fs.slice(i).forEach(function (f) { dt.items.add(f); }); try { inp.files = dt.files; revisar(); } catch (e) {}
        });
      })();
    };
  }

  // ------------------------------------------------------------ registro visual (ingreso / salida) y vista 3D
  function vistasDe(c, momento) {
    var ad = c.adjuntos || [];
    var vids = ad.filter(function (a) { return a.clase === 'video' && a.momento === momento; });
    return {
      imgs: ad.filter(function (a) { return a.clase === 'imagen' && a.momento === momento; }),
      v360: vids.filter(function (a) { return a.tipo_video === '360'; }), vnorm: vids.filter(function (a) { return a.tipo_video === 'Normal'; }), otros: vids.filter(function (a) { return !a.tipo_video; }),
      giros: ad.filter(function (a) { return a.clase === 'giro' && a.momento === momento && a.meta; }),
      modelos: ad.filter(function (a) { return a.clase === 'modelo3d' && a.momento === momento; })
    };
  }
  function miniGiro(c, g, et) {
    var M = g.meta, filas = Math.ceil(M.n / M.cols), nm = (c.marcas || []).filter(function (m) { return +m.adjunto_id === +g.id; }).length;
    return '<button type="button" class="rv-vista" data-v3d="' + g.id + '"><span class="rv-mini" style="aspect-ratio:' + M.fw + '/' + M.fh + ';background-image:url(\'' + esc(adjUrl(g)) + '\');background-size:' + (M.cols * 100) + '% ' + (filas * 100) + '%"></span>' +
      '<span class="rv-giro">3D</span><span class="rv-vt"><b>' + esc(et || (M.modo === '360' ? 'Vista 3D · giro 360°' : 'Vista 3D · recorrido')) + '</b><small>' + M.n + ' vistas' + (nm ? ' · ' + nm + ' hallazgo' + (nm === 1 ? '' : 's') : '') + '</small></span></button>';
  }
  function miniModelo(c, a) {
    var nm = (c.marcas || []).filter(function (m) { return +m.adjunto_id === +a.id; }).length;
    return '<button type="button" class="rv-vista" data-v3d="' + a.id + '"><span class="rv-mini rv-mod"><svg viewBox="0 0 24 24">' + ADJ_ICO.modelo3d + '</svg></span><span class="rv-giro">3D</span><span class="rv-vt"><b>Modelo 3D</b><small>' + esc(a.nombre) + (nm ? ' · ' + nm + ' hallazgo' + (nm === 1 ? '' : 's') : '') + '</small></span></button>';
  }
  function registroVisual(c, puede) {
    var fin = !!c.disposicion;
    function col(momento) {
      var V = vistasDe(c, momento), okI = V.imgs.length > 0, okN = V.vnorm.length > 0, completo = momento === 'Salida' ? okI : okI && okN;
      var fila = function (lbl, lista, tipo, oblig) {
        var hay = lista.length > 0, a = lista[0];
        return '<div class="rv-fila ' + (hay ? 'ok' : (oblig ? 'falta' : '')) + '"><span class="rv-ico">' + (hay ? '✓' : '!') + '</span><div><b>' + lbl + '</b><small>' + (hay ? esc(a.nombre) + ' · ' + esc(usuario(a.creado_por).nombre) + ' · ' + momento_(a.creado_en) : (oblig ? 'Obligatorio' : 'Pendiente')) + '</small></div>' +
          '<div class="rv-acc">' + (hay ? '<button class="btn btn-sm" type="button" data-verv="' + a.id + '">Ver video</button>' + (!V.giros.some(function (g) { return +g.fuente_id === +a.id; }) && puede ? '<button class="btn btn-sm" type="button" data-gen="' + a.id + '">Generar vista 3D</button>' : '') : '') +
          (puede && (!fin || !hay) ? '<button class="btn btn-sm' + (hay ? '' : ' btn-oro') + '" type="button" data-subv="' + momento + '|' + tipo + '">' + (hay ? 'Otro' : 'Subir') + '</button>' : '') + '</div></div>';
      };
      var oblImg = momento === 'Ingreso' || fin;
      var filaImg = '<div class="rv-fila ' + (okI ? 'ok' : (oblImg ? 'falta' : '')) + '"><span class="rv-ico">' + (okI ? '✓' : '!') + '</span><div><b>Imágenes del cuerpo</b><small>' +
          (okI ? V.imgs.length + (V.imgs.length === 1 ? ' imagen' : ' imágenes') + ' · ' + esc(usuario(V.imgs[V.imgs.length - 1].creado_por).nombre) + ' · ' + momento_(V.imgs[V.imgs.length - 1].creado_en) : (oblImg ? 'Obligatorio' : 'Pendiente')) + '</small></div>' +
          '<div class="rv-acc">' + (puede && !fin ? '<button class="btn btn-sm' + (okI ? '' : ' btn-oro') + '" type="button" data-subi="' + momento + '">' + (okI ? 'Agregar' : 'Subir imágenes') + '</button>' : '') + '</div></div>' +
        (okI ? '<div class="rv-fotos">' + V.imgs.map(function (a) { return '<button type="button" class="rv-foto" data-veri="' + a.id + '" title="' + esc(a.descripcion || a.nombre) + '"><img src="' + esc(adjUrl(a)) + '" alt="' + esc(a.descripcion || a.nombre) + '" loading="lazy"></button>'; }).join('') + '</div>' : '');
      var vistas = V.giros.map(function (g) { var src = c.adjuntos.find(function (a) { return +a.id === +g.fuente_id; }); return miniGiro(c, g, src && src.tipo_video === '360' ? 'Vista 3D · giro 360°' : 'Vista 3D · recorrido'); }).join('') + V.modelos.map(function (a) { return miniModelo(c, a); }).join('');
      return '<div class="rv-col"><div class="rv-cab"><div><div class="eyebrow">' + (momento === 'Ingreso' ? 'Al llegar a CLEMI' : 'Inhumación / disposición final') + '</div><h3>' + momento + '</h3></div>' +
        (momento === 'Ingreso' || V.imgs.length + V.vnorm.length ? '<span class="chip ' + (completo ? 'st-devuelto' : 'st-custodia') + '">' + (completo ? 'Registro completo' : 'Registro incompleto') + '</span>' : '<span class="chip">Al salir</span>') + '</div>' +
        filaImg + fila('Video normal (recorrido)', V.vnorm, 'Normal', momento === 'Ingreso') +
        (V.v360.length ? fila('Video 360° (registro anterior)', V.v360, '360', false) : '') +
        (vistas ? '<div class="rv-vistas">' + vistas + '</div>' : '<div class="rv-nota">' + (momento === 'Ingreso' ? 'Tome imágenes de frente, espalda, ambos costados, cabeza y pies, y de cada lesión o hallazgo. Con el video normal se puede generar la vista 3D para recorrer el cuerpo.' : 'Se toman cuando el cuerpo sale para inhumación, cremación o devolución a familiares, con los mismos ángulos del ingreso, para comparar su estado.') + '</div>') +
        (puede ? '<button class="btn btn-sm rv-glb" type="button" data-glb="' + momento + '">+ Modelo 3D (.glb)</button>' : '') + '</div>';
    }
    var Ii = vistasDe(c, 'Ingreso'), Ss = vistasDe(c, 'Salida');
    var comp = (Ii.giros.length && Ss.giros.length) || (Ii.imgs.length && Ss.imgs.length);
    return '<div class="seccion-t-fila"><h2 class="seccion-t">Registro visual del cuerpo</h2>' + (comp ? '<button class="btn btn-verde btn-sm" id="rv-comp" type="button">Comparar ingreso y salida</button>' : '') + '</div>' +
      '<div class="rv-grid">' + col('Ingreso') + col('Salida') + '</div>';
  }
  function momento_(m) { return momento(m); }
  function enlazarRegistro(c, j, puede, cargar) {
    $$('[data-subv]').forEach(function (b) { b.onclick = function () { var p = b.getAttribute('data-subv').split('|'); modalVideoCuerpo(c, j, p[0], p[1], cargar); }; });
    $$('[data-v3d]').forEach(function (b) { b.onclick = function () { abrirVista(c, c.adjuntos.find(function (a) { return +a.id === +b.getAttribute('data-v3d'); }), puede, cargar); }; });
    $$('[data-verv]').forEach(function (b) { b.onclick = function () { verAdjunto(c.adjuntos.find(function (a) { return +a.id === +b.getAttribute('data-verv'); }), c, puede, cargar); }; });
    $$('[data-gen]').forEach(function (b) { b.onclick = function () { generarDesdeVideo(c, c.adjuntos.find(function (a) { return +a.id === +b.getAttribute('data-gen'); }), cargar); }; });
    $$('[data-glb]').forEach(function (b) { b.onclick = function () { modalAdjuntar(c, j, cargar, null, { momento: b.getAttribute('data-glb'), accept: '.glb', titulo: 'Modelo 3D de ' + b.getAttribute('data-glb').toLowerCase() + ' · ' + c.codigo }); }; });
    $$('[data-subi]').forEach(function (b) { b.onclick = function () { var mo = b.getAttribute('data-subi'); modalAdjuntar(c, j, cargar, null, { momento: mo, accept: 'image/*', titulo: 'Imágenes de ' + mo.toLowerCase() + ' · ' + c.codigo }); }; });
    $$('[data-veri]').forEach(function (b) { b.onclick = function () { verAdjunto(c.adjuntos.find(function (a) { return +a.id === +b.getAttribute('data-veri'); }), c, puede, cargar); }; });
    var bc = $('#rv-comp'); if (bc) bc.onclick = function () { var I = vistasDe(c, 'Ingreso'), Sx = vistasDe(c, 'Salida'); if (I.imgs.length && Sx.imgs.length) compararImagenes(c, I.imgs, Sx.imgs); else abrirComparar(c); };
  }
  function pedirIngreso(c, j, cargar) {
    var m = modal('Registro de ingreso de ' + c.codigo, '<p style="margin:0">El componente quedó registrado. Ahora suba el <b>registro visual de ingreso</b>:</p>' +
      '<ul class="rv-guia"><li><b>Imágenes:</b> frente, espalda, ambos costados, cabeza y pies, con buena luz y sin contraluz. Agregue una imagen de cerca de cada lesión, cicatriz o hallazgo.</li><li><b>Video normal:</b> recorra el cuerpo de la cabeza a los pies, cerca, mostrando el estado de la piel y las lesiones.</li></ul>' +
      '<p class="meta" style="margin:0">Al salir el cuerpo se toman las mismas imágenes para comparar su estado.</p>',
      '<button class="btn" data-cerrar type="button">Más tarde</button><button class="btn" id="pi-n" type="button">Subir video normal</button><button class="btn btn-oro" id="pi-img" type="button">Subir imágenes</button>');
    $('#pi-img', m.el).onclick = function () { m.cerrar(); modalAdjuntar(c, j, cargar, null, { momento: 'Ingreso', accept: 'image/*', titulo: 'Imágenes de ingreso · ' + c.codigo }); };
    $('#pi-n', m.el).onclick = function () { m.cerrar(); modalVideoCuerpo(c, j, 'Ingreso', 'Normal', cargar); };
  }
  function compararImagenes(c, A, B) {
    var col = function (t, l) { return '<div class="cmp-col"><h3>' + t + ' <span class="meta">· ' + l.length + (l.length === 1 ? ' imagen' : ' imágenes') + '</span></h3><div class="cmp-fotos">' + l.map(function (a) { return '<figure><img src="' + esc(adjUrl(a)) + '" alt="" data-zoom="' + esc(adjUrl(a)) + '"><figcaption>' + esc(a.descripcion || a.nombre) + '<br><span class="meta">' + momento(a.creado_en) + '</span></figcaption></figure>'; }).join('') + '</div></div>'; };
    var m = modal('Comparar ingreso y salida · ' + c.codigo, '<div class="cmp-par">' + col('Ingreso', A) + col('Salida', B) + '</div><p class="meta" style="margin:0">Toque una imagen para verla en grande.</p>', null, { ancho: true, sinFoco: true });
    $('.modal', m.el).classList.add('modal-v3d');
  }
  function imgsPdf(lista) {
    return Promise.all(lista.slice(0, 4).map(function (a) {
      return new Promise(function (ok) {
        var im = new Image(); im.crossOrigin = 'anonymous';
        im.onload = function () { try { var k = Math.min(1, 900 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); ok(cv.toDataURL('image/jpeg', .82)); } catch (e) { ok(null); } };
        im.onerror = function () { ok(null); }; im.src = adjUrl(a);
      });
    }));
  }
  function subirVista(c, fuenteId, res, nombre, prog) {
    var fd = new FormData();
    fd.append('archivo', new File([res.blob], 'vista3d-' + String(nombre || 'video').replace(/\.[^.]+$/, '').slice(0, 60) + '.jpg', { type: 'image/jpeg' }));
    fd.append('componente_id', c.id); fd.append('fuente_id', fuenteId); fd.append('meta', JSON.stringify(res.meta));
    return subirArchivo(fd, prog);
  }
  function modalVideoCuerpo(c, j, momento, tipo, cargar) {
    var es360 = tipo === '360', lim = +j.limite_adjunto || 0;
    var m = modal((es360 ? 'Video 360° de ' : 'Video normal de ') + momento.toLowerCase() + ' · ' + c.codigo,
      '<div class="rv-guia-c">' + (es360 ? '<b>Cómo grabar el video 360°</b><ul class="rv-guia"><li>Camine despacio alrededor de la camilla en <b>una vuelta completa</b>, sin detenerse.</li><li>Mantenga la misma distancia (1 a 1,5 m) y el celular a la altura del pecho, apuntando al centro del cuerpo.</li><li>Buena luz, sin contraluz. Duración ideal: 20 a 40 segundos.</li></ul>'
        : '<b>Cómo grabar el video normal</b><ul class="rv-guia"><li>Recorra el cuerpo de la cabeza a los pies (o por regiones), cerca y despacio.</li><li>Deténgase en lesiones, livideces, heridas, marcas e identificación.</li></ul>') + '</div>' +
      '<label class="campo"><span class="req">Video</span><input type="file" id="vc-f" accept="video/*,.mp4,.mov,.webm,.m4v"><small>MP4 o MOV del celular. Máximo ' + pesoTxt(lim) + '.</small></label>' +
      '<label class="campo"><span>Descripción</span><input id="vc-d" maxlength="500" placeholder="Ej. Ingreso del cuerpo, cara posterior; etiqueta 7803"></label>' +
      '<ol class="rv-pasos" id="vc-pasos" hidden><li data-p="g"><span>Preparar la vista 3D en este equipo</span><i class="adj-barra"><em></em></i></li><li data-p="v"><span>Subir el video</span><i class="adj-barra"><em></em></i></li><li data-p="s"><span>Guardar la vista 3D</span><i class="adj-barra"><em></em></i></li></ol>',
      '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="vc-ok" type="button">Subir y generar vista 3D</button>', { ancho: true });
    var enviando = false;
    function barraP(k, v) { var li = $('[data-p=' + k + ']', m.el); $('em', li).style.width = Math.round(v * 100) + '%'; if (v >= 1) li.classList.add('ok'); }
    $('#vc-ok', m.el).onclick = function () {
      if (enviando) return;
      var f = ($('#vc-f', m.el).files || [])[0];
      if (!f) return errorEn(m, 'Elija el video.');
      if (!/^(mp4|mov|webm|m4v|avi)$/.test(extDe(f.name))) return errorEn(m, 'El archivo debe ser un video (MP4, MOV, WEBM).');
      if (lim && f.size > lim) return errorEn(m, 'El video pesa ' + pesoTxt(f.size) + ' y el máximo es ' + pesoTxt(lim) + '. Recórtelo o pida ampliar el límite del hosting.');
      enviando = true; var bt = this; bt.disabled = true; bt.textContent = 'Procesando…'; $('#vc-pasos', m.el).hidden = false;
      var aviso = '', gen = null;
      window.Visor3D.generar(f, { modo: es360 ? '360' : 'recorrido' }, function (p) { barraP('g', p); }).then(function (r) { gen = r; barraP('g', 1); }, function (e) { aviso = e.error; $('[data-p=g]', m.el).classList.add('mal'); $('[data-p=g] span', m.el).textContent = 'Vista 3D: ' + e.error; })
        .then(function () {
          var fd = new FormData(); fd.append('archivo', f); fd.append('componente_id', c.id); fd.append('momento', momento); fd.append('tipo_video', tipo); fd.append('descripcion', $('#vc-d', m.el).value);
          return subirArchivo(fd, function (p) { barraP('v', p); });
        })
        .then(function (r) {
          barraP('v', 1);
          if (!gen) return r;
          return subirVista(c, r.id, gen, f.name, function (p) { barraP('s', p); }).then(function () { barraP('s', 1); S.v3dAuto = r.id; return r; });
        })
        .then(function () { m.cerrar(); toast(aviso ? 'Video subido. ' + aviso : 'Video subido y vista 3D generada.', aviso ? 'error' : undefined); cargar(); },
          function (x) { enviando = false; bt.disabled = false; bt.textContent = 'Reintentar'; errorEn(m, (x && x.error) || 'No se pudo subir el video.'); cargar(); });
    };
  }
  function generarDesdeVideo(c, v, cargar) {
    var m = modal('Generar vista 3D', '<p style="margin:0">Se prepara la vista 3D a partir de <b>' + esc(v.nombre) + '</b> en este equipo y se guarda en la ficha.</p><ol class="rv-pasos"><li data-p="g"><span>Preparar la vista 3D</span><i class="adj-barra"><em></em></i></li><li data-p="s"><span>Guardar la vista 3D</span><i class="adj-barra"><em></em></i></li></ol>', '<button class="btn" data-cerrar type="button">Cerrar</button>', { sinFoco: true });
    function barraP(k, p) { var li = $('[data-p=' + k + ']', m.el); $('em', li).style.width = Math.round(p * 100) + '%'; if (p >= 1) li.classList.add('ok'); }
    window.Visor3D.generar(adjUrl(v), { modo: v.tipo_video === '360' ? '360' : 'recorrido' }, function (p) { barraP('g', p); })
      .then(function (r) { barraP('g', 1); return subirVista(c, v.id, r, v.nombre, function (p) { barraP('s', p); }); })
      .then(function () { m.cerrar(); toast('Vista 3D generada.'); S.v3dAuto = v.id; cargar(); }, function (e) { errorEn(m, (e && e.error) || 'No se pudo generar la vista 3D.'); });
  }
  // ------------------------------------------------------------ marcación corporal sobre el modelo anatómico 3D
  // Modelos anatómicos del cuerpo humano (masculino y femenino).
  var MODELOS_CUERPO = { masculino: 'assets/modelos/cuerpo-masculino.glb', femenino: 'assets/modelos/cuerpo-femenino.glb' };
  // Según el sexo de la ficha; si no está especificado, se puede abrir cualquiera de los dos.
  function modeloCuerpo(c) { return c.sexo === 'Femenino' ? 'femenino' : c.sexo === 'Masculino' ? 'masculino' : null; }
  function marcasCuerpo(c, mo) {
    return (c.marcas_cuerpo || []).filter(function (m) { return m.modelo === mo; }).map(function (m) {
      return { id: m.id, frame: 0, x: +m.x, y: +m.y, z: +m.z, tipo: m.tipo, texto: m.texto, creado_por: m.creado_por, autor: usuario(m.creado_por).nombre, cuando: momento(m.creado_en) };
    });
  }
  function panelCuerpo3D(c) {
    var mo = modeloCuerpo(c), L = c.marcas_cuerpo || [];
    var cuenta = function (m) { var n = L.filter(function (x) { return x.modelo === m; }).length; return n ? ' (' + n + ' hallazgo' + (n === 1 ? '' : 's') + ')' : ''; };
    var botones = mo ? '<button class="btn btn-oro" data-c3d="' + mo + '" type="button">Abrir modelo ' + mo + cuenta(mo) + '</button>'
      : '<button class="btn btn-oro" data-c3d="masculino" type="button">Abrir modelo masculino' + cuenta('masculino') + '</button><button class="btn btn-oro" data-c3d="femenino" type="button">Abrir modelo femenino' + cuenta('femenino') + '</button>';
    return '<div class="panel c3d-panel" style="margin-bottom:18px"><div class="panel-cab"><h2>Marcación corporal en 3D</h2><span class="meta">' + (mo ? 'Modelo anatómico ' + mo : 'Sexo no especificado · puede abrir el modelo masculino o el femenino') + ' · ' + L.length + ' hallazgo' + (L.length === 1 ? '' : 's') + '</span></div>' +
      '<div id="c3d-host" class="c3d-host"><div class="c3d-portada"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="8" r="5"/><path d="M16 16h16l-2 14h-3l-1 14h-4l-1-14h-3z"/></svg>' +
      '<p>Gire el cuerpo en todas las direcciones (frente, espalda, lados, cabeza y pies, o rotándolo en cualquier eje) y marque sobre él cada hallazgo: lesiones, incisiones, deterioro de tejido, marcas de identificación.</p>' +
      '<div class="c3d-botones">' + botones + '</div></div></div></div>';
  }
  function enlazarCuerpo3D(c, puede, cargar) {
    var host = $('#c3d-host'); if (!host) return;
    var v = null, libre = !modeloCuerpo(c);
    function abrir(mo) {
      if (!window.Visor3D) return;
      if (v) { v.destruir(); v = null; }
      host.classList.add('abierto'); host.innerHTML = '';
      if (libre) {
        var sw = document.createElement('div'); sw.className = 'c3d-cambio';
        sw.innerHTML = '<span>Sexo no especificado:</span><button type="button" class="btn btn-sm' + (mo === 'masculino' ? ' btn-oro' : '') + '" data-m="masculino">Masculino</button><button type="button" class="btn btn-sm' + (mo === 'femenino' ? ' btn-oro' : '') + '" data-m="femenino">Femenino</button>';
        host.parentNode.insertBefore(sw, host); var viejo = host.parentNode.querySelectorAll('.c3d-cambio'); if (viejo.length > 1) viejo[0].remove();
        $$('[data-m]', sw).forEach(function (b) { b.onclick = function () { if (b.getAttribute('data-m') !== mo) abrir(b.getAttribute('data-m')); }; });
      }
      var caja = document.createElement('div'); caja.style.height = '100%'; host.appendChild(caja);
      Promise.resolve(window.CLEMI_DEMO && window.CLEMI_DEMO.modeloCuerpo ? window.CLEMI_DEMO.modeloCuerpo(mo) : MODELOS_CUERPO[mo]).then(function (src) { if (!document.body.contains(caja)) return; v = window.Visor3D.modelo(caja, {
        src: src, alternas: ['modelo.php?m=' + mo], cuerpo: true, titulo: 'Modelo ' + mo + ' · ' + c.codigo,
        marcas: marcasCuerpo(c, mo), puedeMarcar: puede,
        puedeBorrar: function (mk) { return puede && (S.yo.rol === 'admin' || +mk.creado_por === +S.yo.id); },
        onMarca: function (mk) { return api('marca_cuerpo_guardar', { componente_id: c.id, modelo: mo, x: mk.x, y: mk.y, z: mk.z, tipo: mk.tipo, texto: mk.texto }).then(function (r) { (c.marcas_cuerpo = c.marcas_cuerpo || []).push({ id: r.id, modelo: mo, x: mk.x, y: mk.y, z: mk.z, tipo: mk.tipo, texto: mk.texto, creado_por: S.yo.id, creado_en: r.creado_en }); return { id: r.id, creado_por: S.yo.id, autor: S.yo.nombre, cuando: 'Ahora' }; }); },
        onBorrar: function (mk) { return api('marca_cuerpo_borrar', { id: mk.id }).then(function () { c.marcas_cuerpo = (c.marcas_cuerpo || []).filter(function (x) { return +x.id !== +mk.id; }); }); },
        onCaptura: function (blob) { guardarArchivo(blob, c.codigo + '-marcacion-3D-' + mo + '.jpg').catch(function () {}); }
      }); });
    }
    $$('[data-c3d]', host).forEach(function (b) { b.onclick = function () { abrir(b.getAttribute('data-c3d')); }; });
    // Si el usuario se va de la ficha, liberar el visor (WebGL).
    var obs = setInterval(function () { if (!document.body.contains(host)) { clearInterval(obs); if (v) v.destruir(); } }, 1500);
  }
  function marcasVisor(c, adjId) {
    return (c.marcas || []).filter(function (m) { return +m.adjunto_id === +adjId; }).map(function (m) {
      return { id: m.id, frame: +m.frame, x: +m.x, y: +m.y, z: m.z == null ? null : +m.z, tipo: m.tipo, texto: m.texto, creado_por: m.creado_por, autor: usuario(m.creado_por).nombre, cuando: momento(m.creado_en) };
    });
  }
  function opcVisor(c, a, puede, cargar) {
    var cambio = false;
    return {
      o: {
        titulo: a.clase === 'modelo3d' ? 'Modelo 3D · ' + a.momento : (a.meta.modo === '360' ? 'Giro 360°' : 'Recorrido') + (a.momento !== 'General' ? ' · ' + a.momento : ''),
        marcas: marcasVisor(c, a.id), puedeMarcar: puede,
        puedeBorrar: function (mk) { return puede && (S.yo.rol === 'admin' || +mk.creado_por === +S.yo.id); },
        onMarca: function (mk) { return api('marca_guardar', { adjunto_id: a.id, frame: mk.frame, x: mk.x, y: mk.y, z: mk.z, tipo: mk.tipo, texto: mk.texto }).then(function (r) { cambio = true; return { id: r.id, creado_por: S.yo.id, autor: S.yo.nombre, cuando: 'Ahora' }; }); },
        onBorrar: function (mk) { return api('marca_borrar', { id: mk.id }).then(function () { cambio = true; }); },
        onCaptura: function (blob) { guardarArchivo(blob, c.codigo + '-' + (a.momento || 'vista') + '-captura.jpg').catch(function () {}); }
      },
      cerrar: function () { if (cambio) cargar(); }
    };
  }
  function abrirVista(c, a, puede, cargar) {
    if (!a || !window.Visor3D) return;
    var fuente = a.fuente_id ? c.adjuntos.find(function (x) { return +x.id === +a.fuente_id; }) : null;
    var ov = opcVisor(c, a, puede, cargar), v = null;
    var m = modal((a.clase === 'modelo3d' ? 'Modelo 3D' : 'Vista 3D') + ' · ' + c.codigo + (a.momento && a.momento !== 'General' ? ' · ' + a.momento : ''),
      '<div class="v3d-host"></div><p class="meta" style="margin:8px 0 0">' + (a.clase === 'modelo3d' ? 'Modelo 3D subido por ' + esc(usuario(a.creado_por).nombre) + ' · ' + momento(a.creado_en) :
        'Generada a partir de ' + esc(fuente ? fuente.nombre : 'un video') + ' · ' + (a.meta.modo === '360' ? 'arrastre para girar el cuerpo' : 'arrastre para recorrer el cuerpo') + '. Al detenerse se muestra la imagen del video en alta calidad.') + '</p>',
      null, { ancho: true, sinFoco: true, alCerrar: function () { if (v) v.destruir(); ov.cerrar(); } });
    $('.modal', m.el).classList.add('modal-v3d');
    var host = $('.v3d-host', m.el);
    v = a.clase === 'modelo3d' ? window.Visor3D.modelo(host, Object.assign({ src: adjUrl(a) }, ov.o))
      : window.Visor3D.secuencia(host, Object.assign({ sprite: adjUrl(a), meta: a.meta, video: fuente && /^(mp4|m4v|webm|mov)$/.test(extDe(fuente.nombre)) ? adjUrl(fuente) : null }, ov.o));
  }
  function abrirComparar(c) {
    var I = vistasDe(c, 'Ingreso').giros, Sg = vistasDe(c, 'Salida').giros;
    var pref = function (l) { return l.find(function (g) { return g.meta.modo === '360'; }) || l[0]; };
    var a = pref(I), b = pref(Sg), fa = c.adjuntos.find(function (x) { return +x.id === +a.fuente_id; }), fb = c.adjuntos.find(function (x) { return +x.id === +b.fuente_id; });
    var v = null;
    var m = modal('Comparar ingreso y salida · ' + c.codigo, '<div class="v3d-host v3d-host-par"></div><p class="meta" style="margin:8px 0 0">Las dos vistas giran juntas: arrastre cualquiera para comparar el estado corporal desde el mismo ángulo.</p>', null,
      { ancho: true, sinFoco: true, alCerrar: function () { if (v) v.destruir(); } });
    $('.modal', m.el).classList.add('modal-v3d');
    var vid = function (f) { return f && /^(mp4|m4v|webm|mov)$/.test(extDe(f.nombre)) ? adjUrl(f) : null; };
    v = window.Visor3D.comparar($('.v3d-host', m.el), { rotulo: 'Ingreso · ' + fCorta(a.creado_en.slice(0, 10)), sprite: adjUrl(a), meta: a.meta, video: vid(fa), marcas: marcasVisor(c, a.id), titulo: 'Ingreso' },
      { rotulo: 'Salida · ' + fCorta(b.creado_en.slice(0, 10)), sprite: adjUrl(b), meta: b.meta, video: vid(fb), marcas: marcasVisor(c, b.id), titulo: 'Salida' });
  }

  // ------------------------------------------------------------ disposición final
  var TIPOS_DISPO = ['Inhumación', 'Cremación', 'Devolución a familiares', 'Devolución a la entidad de origen', 'Otra'];
  function panelDisposicion(c) {
    var d = c.disposicion;
    return '<div class="panel dispo-panel"><div class="panel-cab"><h2>Ficha de disposición final</h2><span class="chip st-final">' + esc(d.tipo) + '</span></div><div class="panel-cuerpo"><div class="dispo-grid">' +
      [['Fecha y hora de salida', fLarga(d.fecha_hora.slice(0, 10)) + ' · ' + d.fecha_hora.slice(11, 16)], ['Destino / lugar', d.destino], ['Entidad que recibe', d.entidad || '—'], ['Documento soporte', d.documento || '—'],
       ['Entrega (CLEMI)', d.entrega_nombre + (d.entrega_cedula ? ' · C.C. ' + d.entrega_cedula : '')], ['Recibe', d.recibe_nombre + ' · C.C. ' + d.recibe_cedula + (d.recibe_cargo ? ' · ' + d.recibe_cargo : '')]].map(function (x) {
        return '<div><small>' + x[0] + '</small><b>' + esc(x[1]) + '</b></div>';
      }).join('') + '</div><div class="dispo-txt"><small>Estado corporal a la salida</small><p>' + esc(d.estado_corporal) + '</p></div>' + (d.observaciones ? '<div class="dispo-txt"><small>Observaciones</small><p>' + esc(d.observaciones) + '</p></div>' : '') +
      '<div class="meta">Registró ' + esc(usuario(d.creado_por).nombre) + ' · ' + momento(d.creado_en) + '</div></div></div>';
  }
  function modalDisposicion(c, j, cargar) {
    var yo = S.base.usuarios.find(function (u) { return +u.id === +S.yo.id; }) || S.yo;
    var Sv = vistasDe(c, 'Salida'), activas = (c.asignaciones || []).filter(function (a) { return a.estado === 'Reservada' || a.estado === 'En uso'; });
    var req = [[Sv.imgs.length > 0, 'Imágenes de salida del cuerpo', 'Súbalas en «Registro visual del cuerpo → Salida».'], [Sv.vnorm.length > 0, 'Video normal de salida', 'Recomendado.', true], [!activas.length, 'Ninguna parte reservada o en sala', activas.length + ' parte(s) asignadas a eventos: devuélvalas a la morgue.']];
    var bloqueo = req.some(function (r) { return !r[0] && !r[3]; });
    var d = new Date(), ahoraL = iso(d) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    var m = modal('Disposición final de ' + c.codigo,
      '<ul class="dispo-req">' + req.map(function (r) { return '<li class="' + (r[0] ? 'ok' : (r[3] ? 'opc' : 'mal')) + '"><span>' + (r[0] ? '✓' : '!') + '</span><div><b>' + r[1] + '</b>' + (r[0] ? '' : '<small>' + r[2] + '</small>') + '</div></li>'; }).join('') + '</ul>' +
      (bloqueo ? '<p class="form-error">Complete los requisitos marcados antes de registrar la disposición final.</p>' : '') +
      '<div class="form-grid"><label class="campo"><span class="req">¿Qué sucede con el cuerpo?</span><select id="d-tipo"><option value="">Seleccione…</option>' + TIPOS_DISPO.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select></label>' +
      '<label class="campo"><span class="req">Fecha y hora de salida</span><input type="datetime-local" id="d-fh" value="' + ahoraL + '"></label>' +
      '<label class="campo"><span class="req">Destino / lugar</span><input id="d-dest" maxlength="300" placeholder="Ej. Cementerio Central, bóveda 12 · Crematorio …"></label>' +
      '<label class="campo"><span>Entidad que recibe</span><input id="d-ent" maxlength="200" placeholder="Ej. Funeraria, universidad, Medicina Legal"></label>' +
      '<label class="campo ancho"><span>Documento soporte</span><input id="d-doc" maxlength="200" placeholder="Ej. Licencia de inhumación Nº …, orden de cremación, acta de entrega a familiares"></label>' +
      '<label class="campo ancho"><span class="req">Estado corporal a la salida</span><textarea id="d-est" maxlength="4000" placeholder="Describa cómo sale el cuerpo: integridad, partes consumidas o retiradas, conservación, hallazgos frente al ingreso."></textarea></label>' +
      '<label class="campo ancho"><span>Observaciones</span><textarea id="d-obs" maxlength="4000"></textarea></label></div>' +
      '<div class="firmas-par"><div class="firma-bloque"><h4>Entrega (CLEMI)</h4><div class="form-grid" style="grid-template-columns:1fr"><label class="campo"><span class="req">Nombre</span><input id="d-en" value="' + esc(yo.nombre) + '"></label><label class="campo"><span>Cédula</span><input id="d-ec" value="' + esc(yo.cedula || '') + '"></label><div id="d-ef"></div></div></div>' +
      '<div class="firma-bloque"><h4>Recibe</h4><div class="form-grid" style="grid-template-columns:1fr"><label class="campo"><span class="req">Nombre</span><input id="d-rn"></label><label class="campo"><span class="req">Cédula</span><input id="d-rc"></label><label class="campo"><span>Cargo / entidad</span><input id="d-rg"></label><div id="d-rf"></div></div></div></div>',
      '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="d-ok" type="button"' + (bloqueo ? ' disabled' : '') + '>Registrar disposición final</button>', { ancho: true, sinFoco: true });
    var f1 = new Firma($('#d-ef', m.el)), f2 = new Firma($('#d-rf', m.el));
    $('#d-ok', m.el).onclick = function () {
      var b = this; b.disabled = true;
      api('disposicion_guardar', { componente_id: c.id, tipo: $('#d-tipo', m.el).value, fecha_hora: $('#d-fh', m.el).value, destino: $('#d-dest', m.el).value, entidad: $('#d-ent', m.el).value, documento: $('#d-doc', m.el).value,
        estado_corporal: $('#d-est', m.el).value, observaciones: $('#d-obs', m.el).value, entrega_nombre: $('#d-en', m.el).value, entrega_cedula: $('#d-ec', m.el).value, entrega_firma: f1.valor(),
        recibe_nombre: $('#d-rn', m.el).value, recibe_cedula: $('#d-rc', m.el).value, recibe_cargo: $('#d-rg', m.el).value, recibe_firma: f2.valor() })
        .then(function () { m.cerrar(); toast('Disposición final registrada.'); S.dispoAuto = c.id; cargar().then(function () { }); }, function (x) { b.disabled = false; errorEn(m, x.error); });
    };
  }
  function pdfDisposicion(c) {
    modalPdf('Ficha de disposición final · ' + c.codigo, function () {
      var I = vistasDe(c, 'Ingreso'), Sg = vistasDe(c, 'Salida');
      var pref = function (l) { return l.find(function (g) { return g.meta.modo === '360'; }) || l[0]; };
      var a = pref(I.giros), b = pref(Sg.giros), fr = [0, 0.25, 0.5, 0.75];
      var cuadros = function (g) { return g ? Promise.all(fr.map(function (f) { return window.Visor3D.cuadro(adjUrl(g), g.meta, f, 360); })) : Promise.resolve([]); };
      var fuente = function (V, g) { return V.imgs.length ? imgsPdf(V.imgs) : cuadros(g); };
      return Promise.all([fuente(I, a), fuente(Sg, b)]).then(function (res) {
        return window.FichaPDF.disposicion(c, { archivo: archivo, textoVisual: I.imgs.length || Sg.imgs.length ? 'Imágenes del cuerpo tomadas al ingreso y a la salida (hasta 4 por momento).' : 'Cuadros tomados de la vista 3D generada a partir de los videos.', nombre: function (id) { return usuario(id).nombre; }, generadoPor: S.yo.nombre, ahora: ahoraTxt(), ingreso: res[0], salida: res[1],
          hallazgos: (c.marcas || []).map(function (mk) { var ad = c.adjuntos.find(function (x) { return +x.id === +mk.adjunto_id; }) || {}; return { momento: ad.momento || 'General', tipo: mk.tipo, texto: mk.texto, autor: usuario(mk.creado_por).nombre, fecha: mk.creado_en }; }),
          nombreParte: nombreParte });
      });
    });
  }
  function modalPdf(titulo, crear) {
    var m = modal(titulo, '<div class="acta-vista"><div class="vacio">Generando el documento…</div></div>',
      '<button class="btn" data-cerrar type="button">Cerrar</button>' + (window.CLEMI_DEMO ? '' : '<button class="btn" id="pdf-imp" type="button" disabled>Abrir para imprimir</button>') + '<button class="btn btn-oro" id="pdf-desc" type="button" disabled>Descargar PDF</button>', { ancho: true, sinFoco: true });
    crear().then(function (res) {
      var blob = res.doc.output('blob'), url = URL.createObjectURL(blob), vista = $('.acta-vista', m.el);
      if (window.pdfjsLib) {
        vista.innerHTML = '';
        window.pdfjsLib.getDocument({ data: new Uint8Array(res.doc.output('arraybuffer')) }).promise.then(function (pdf) {
          var cadena = Promise.resolve();
          for (var i = 1; i <= pdf.numPages; i++) (function (n) {
            cadena = cadena.then(function () { return pdf.getPage(n); }).then(function (pg) { var vp = pg.getViewport({ scale: 1.6 }), cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height; vista.appendChild(cv); return pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise; });
          })(i);
        }).catch(function () { vista.innerHTML = '<iframe title="Vista previa" src="' + url + '#view=FitH"></iframe>'; });
      } else vista.innerHTML = '<iframe title="Vista previa" src="' + url + '#view=FitH"></iframe>';
      var d = $('#pdf-desc', m.el); d.disabled = false; d.onclick = function () { guardarArchivo(blob, res.nombre).catch(falla); };
      var ip = $('#pdf-imp', m.el); if (ip) { ip.disabled = false; ip.onclick = function () { window.open(url, '_blank'); }; }
    }, function (e) { $('.acta-vista', m.el).innerHTML = '<p class="form-error">' + esc((e && (e.error || e.message)) || 'No se pudo generar el documento.') + '</p>'; });
  }

  // ------------------------------------------------------------ detalle de componente
  // ------------------------------------------------------------ estructuras dentro de cada parte (ojos, nariz, dedos…)
  var SUB_EST = ['Presente', 'Usada', 'Dañada', 'Ausente / retirada'];
  var SUB_COL = { 'Presente': '#2E7D4F', 'Usada': '#1F5AA6', 'Dañada': '#A93A32', 'Ausente / retirada': '#7a7f7b' };
  function subDe(p) { var x = p.subpartes; if (typeof x === 'string') { try { x = JSON.parse(x || '{}'); } catch (e) { x = {}; } } return x || {}; }
  function resumenSub(p) {
    var x = subDe(p), k = Object.keys(x); if (!k.length) return '';
    return '<div class="sub-res">' + k.map(function (n) { var c = SUB_COL[x[n].estado] || '#777'; return '<span class="chip" style="background:' + c + '1c;color:' + c + '" title="' + esc(x[n].obs || '') + '">' + esc(n) + ' · ' + esc(String(x[n].estado).split(' /')[0].toLowerCase()) + '</span>'; }).join('') + '</div>';
  }
  function subpartesHTML(p, lista, estados) {
    if (!lista.length) return '';
    var x = subDe(p), lado = p.lado ? ' (' + ladoTxt(p.region, p.lado) + ')' : '';
    return '<div class="sub-caja"><div class="sub-cab"><b>Estructuras de ' + esc(p.region.toLowerCase()) + esc(lado) + '</b><span class="meta">Marque solo lo que tenga novedad; lo demás queda «Presente».</span>' +
      '<button type="button" class="btn btn-sm" data-sub-todo>Todas presentes</button></div><div class="sub-grid">' +
      lista.map(function (n) {
        var e = x[n] ? x[n].estado : 'Presente', o = x[n] ? x[n].obs || '' : '';
        return '<div class="sub-it" data-sub="' + esc(n) + '" style="--sc:' + (SUB_COL[e] || '#777') + '"><span class="sub-n">' + esc(n) + '</span><select data-sub-e>' + estados.map(function (s) { return '<option' + (s === e ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' +
          '<input data-sub-o maxlength="300" placeholder="Detalle (curso, hallazgo…)" value="' + esc(o) + '"' + (e === 'Presente' && !o ? ' hidden' : '') + '>' + (x[n] && x[n].por ? '<small class="meta">' + esc(x[n].por) + ' · ' + momento(x[n].en) + '</small>' : '') + '</div>';
      }).join('') + '</div></div>';
  }
  function enlazarSubpartes(el) {
    $$('[data-sub]', el).forEach(function (it) {
      var sel = $('[data-sub-e]', it), inp = $('[data-sub-o]', it);
      sel.onchange = function () { it.style.setProperty('--sc', SUB_COL[sel.value] || '#777'); inp.hidden = sel.value === 'Presente' && !inp.value; if (!inp.hidden && sel.value !== 'Presente') inp.focus(); };
    });
    var t = $('[data-sub-todo]', el); if (t) t.onclick = function () { $$('[data-sub]', el).forEach(function (it) { $('[data-sub-e]', it).value = 'Presente'; $('[data-sub-o]', it).value = ''; $('[data-sub-o]', it).hidden = true; it.style.setProperty('--sc', SUB_COL['Presente']); }); };
  }
  function leerSubpartes(el) {
    var r = {}; $$('[data-sub]', el).forEach(function (it) { r[it.getAttribute('data-sub')] = { estado: $('[data-sub-e]', it).value, obs: $('[data-sub-o]', it).value }; });
    return r;
  }

  function vComponente(id) {
    function cargar() {
      return api('componente&id=' + id).then(function (j) {
        var c = j.componente, puede = puedeMorgue();
        montar('<a class="miga" href="#/morgue/inventario">← Inventario</a>' +
          '<section class="ev-cab mo-cab"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;position:relative"><span class="chip" style="background:rgba(255,255,255,.14);color:#fff">' + esc(c.tipo) + '</span><span class="chip ' + (c.estado === 'Disponible' ? 'st-devuelto' : c.estado === 'Disposición final' ? 'st-final' : 'st-custodia') + '">' + esc(c.estado) + '</span></div>' +
          '<h1 style="margin-top:8px" class="num">' + esc(c.codigo) + '</h1><div class="ev-datos"><span><b>' + esc(c.sexo) + '</b></span><span>' + (c.edad != null && c.edad !== '' ? '<b>' + c.edad + '</b> años' : 'Edad no registrada') + '</span><span>' + esc(c.conservacion) + '</span><span>Ingreso: <b>' + esc(fLarga(c.fecha_ingreso)) + '</b></span><span>Ubicación: <b>' + esc(c.ubicacion || '—') + '</b></span>' + (c.procedencia ? '<span>' + esc(c.procedencia) + '</span>' : '') + '</div>' +
          (puede ? '<div class="acciones"><button class="btn" id="c-edit" type="button">Editar datos y estado</button>' + (c.tipo === 'Segmento' && !c.disposicion ? '<button class="btn" id="c-add" type="button">Agregar parte</button>' : '') + (c.disposicion ? '<button class="btn btn-oro" id="c-dpdf" type="button">Ficha de disposición final (PDF)</button>' : '<button class="btn" id="c-dispo" type="button">Disposición final</button>') + '<button class="btn" id="c-odoo" type="button">Exportar ficha para Odoo</button></div>' : '<div class="acciones">' + (c.disposicion ? '<button class="btn btn-oro" id="c-dpdf" type="button">Ficha de disposición final (PDF)</button>' : '') + '<button class="btn" id="c-odoo" type="button">Exportar ficha para Odoo</button></div>') + '</section>' +
          (c.disposicion ? panelDisposicion(c) : '') + registroVisual(c, puede) +
          '<div class="panel" style="margin-bottom:18px"><div class="panel-cab"><h2>Identificación y procedencia</h2><span class="meta">Registro de morgue · confidencial</span></div><div class="datos-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">' +
            dato('Nombre', c.nombre_donante || '—') + dato('Documento de identidad', c.documento || '—') + dato('Procedencia', c.procedencia || '—') +
            dato('Nº de registro / certificado', c.registro_num || '—') + dato('Destino previsto', c.destino_previsto || 'Sin definir') + dato('Ubicación en morgue', c.ubicacion || '—') +
            dato('Responsable', c.responsable || '—') + dato('Unidades en Odoo', c.odoo_unidades != null ? c.odoo_unidades + ' a mano (dato de Odoo)' : '—') + dato('Partes disponibles en la plataforma', c.partes.filter(function (x) { return x.estado === 'Disponible'; }).length + ' de ' + c.partes.length) + '</div>' +
            (c.obs ? '<div class="panel-cuerpo" style="white-space:pre-line;border-top:1px solid var(--linea)">' + esc(c.obs) + '</div>' : '') + '</div>' +
          panelCuerpo3D(c) +
          '<div class="comp-det"><div class="panel"><div class="panel-cab"><h2>Mapa del cuerpo</h2><span class="meta">Toque una parte</span></div><div class="panel-cuerpo" style="text-align:center">' + cuerpo(c.partes, { sexo: c.sexo }) + leyendaCuerpo() + '</div></div>' +
          '<div class="panel"><div class="panel-cab"><h2>Partes (' + c.partes.length + ')</h2></div><div class="tabla-wrap"><table class="tabla"><thead><tr><th>Código</th><th>Parte</th><th>Estado</th><th>Usos</th><th>Ubicación</th><th>Evento actual</th><th></th></tr></thead><tbody>' +
            c.partes.map(function (p) {
              return '<tr id="parte-' + p.id + '"><td><b class="num">' + esc(p.codigo) + '</b></td><td>' + esc(nombreParte(p)) + resumenSub(p) + '</td><td>' + chipParte(p.estado) + (p.obs ? '<div class="meta">' + esc(p.obs) + '</div>' : '') + '</td><td class="num">' + p.usos + '</td><td>' + esc(p.ubicacion || '—') + '</td>' +
                '<td>' + (p.evento_actual ? '<a href="#/morgue/evento/' + p.evento_actual + '">Ver evento</a>' : '—') + '</td><td>' + (puede ? '<button class="btn btn-sm" data-pe="' + p.id + '" type="button">Actualizar</button>' : '') + '</td></tr>';
            }).join('') + '</tbody></table></div></div></div>' +
          panelAdjuntos(c, j, puede) +
          (function () { var U = []; try { U = JSON.parse(c.usos_previos || '[]') || []; } catch (e) {} if (!U.length) return '';
            return '<h2 class="seccion-t">Cursos en que se usó (registro de morgue) · ' + U.length + '</h2><div class="panel"><div class="tabla-wrap"><table class="tabla"><thead><tr><th style="width:170px">Fecha</th><th>Curso / procedimiento</th></tr></thead><tbody>' +
              U.map(function (u) { return '<tr><td class="num">' + esc(/^\d{4}-\d{2}-\d{2}$/.test(u.fecha) ? fCorta(u.fecha) + ' ' + u.fecha.slice(0, 4) : (u.fecha || '—')) + '</td><td>' + esc(u.curso || '—') + '</td></tr>'; }).join('') + '</tbody></table></div><p class="meta" style="margin:0;padding:10px 18px">Usos anotados en el registro de morgue antes de la plataforma. Los nuevos se registran con «Asignación a eventos».</p></div>'; })() +
          '<h2 class="seccion-t">Historial de uso en eventos</h2><div class="panel">' + (c.asignaciones.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Evento</th><th>Parte</th><th>Estación</th><th>Estado</th><th>Registró</th></tr></thead><tbody>' + c.asignaciones.map(function (a) {
              return '<tr><td><a href="#/morgue/evento/' + a.evento_id + '">' + esc(a.evento_titulo) + '</a><div class="meta">' + esc(sala(a.sala_id).nombre) + ' · ' + esc(fCorta(a.fecha)) + '</div></td><td><b class="num">' + esc(a.parte_codigo) + '</b><div class="meta">' + esc(nombreParte(a)) + '</div></td><td>' + esc(a.estacion || '—') + '</td><td>' + chipAsig(a.estado) + (a.obs ? '<div class="meta">' + esc(a.obs) + '</div>' : '') + '</td><td class="meta">' + esc(usuario(a.actualizado_por).nombre) + '<br>' + momento(a.actualizado_en) + '</td></tr>';
            }).join('') + '</tbody></table></div>' : '<div class="vacio">Este componente aún no se ha usado en eventos.</div>') + '</div>' +
          '<h2 class="seccion-t">Bitácora del componente</h2><div class="panel"><ul class="timeline">' + (c.bitacora.length ? c.bitacora.map(function (b) {
              return '<li><div class="tl-hora">' + b.momento.slice(11, 16) + '<small>' + fCorta(b.momento.slice(0, 10)) + '</small></div><div class="tl-cuerpo"><b>' + esc(b.usuario_nombre) + '</b> · ' + esc(b.accion) + (b.detalle ? '<div class="bit-det">' + esc(b.detalle) + '</div>' : '') + '</div></li>';
            }).join('') : '<li><div></div><div class="meta">Sin movimientos.</div></li>') + '</ul></div>');
        function editarParte(pid) {
          var p = c.partes.find(function (x) { return +x.id === +pid; });
          var ests = ['Disponible', 'Dañada', 'Consumida', 'Descartada'].concat(p.estado === 'Reservada' || p.estado === 'En uso' ? [p.estado] : []);
          var m = modal(p.codigo + ' · ' + nombreParte(p), (p.estado === 'Reservada' || p.estado === 'En uso' ? '<p class="meta" style="margin:0">Esta parte está asignada a un evento. Para devolverla use «Recibir en morgue» en la asignación.</p>' : '') +
            '<label class="campo"><span>Estado</span><select id="p-est">' + ests.map(function (e) { return '<option' + (e === p.estado ? ' selected' : '') + '>' + e + '</option>'; }).join('') + '</select></label>' +
            '<label class="campo"><span>Ubicación</span><input id="p-ub" maxlength="200" value="' + esc(p.ubicacion || '') + '" placeholder="Si es distinta a la del componente"></label>' +
            '<label class="campo"><span>Observación</span><textarea id="p-obs" maxlength="1000">' + esc(p.obs || '') + '</textarea><small>Obligatoria si la parte queda dañada, consumida o descartada.</small></label>' +
            subpartesHTML(p, (j.subpartes || {})[p.region] || [], j.subparte_estados || SUB_EST) +
            (function () { var n = (c.adjuntos || []).filter(function (a) { return +a.parte_id === +p.id; }).length;
              return '<div class="adj-parte-linea"><span>' + (n ? '<b>' + n + '</b> archivo' + (n === 1 ? '' : 's') + ' adjunto' + (n === 1 ? '' : 's') + ' a esta parte' : 'Sin archivos adjuntos para esta parte') + '</span><button class="btn btn-sm" id="p-adj" type="button">+ Adjuntar a esta parte</button></div>'; })(),
            '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="p-ok" type="button">Guardar</button>', { ancho: true });
          enlazarSubpartes(m.el);
          $('#p-adj', m.el).onclick = function () { m.cerrar(); modalAdjuntar(c, j, cargar, p.id); };
          $('#p-ok', m.el).onclick = function () {
            api('parte_guardar', { id: p.id, estado: $('#p-est', m.el).value, ubicacion: $('#p-ub', m.el).value, obs: $('#p-obs', m.el).value, subpartes: leerSubpartes(m.el) }).then(function () { m.cerrar(); toast('Parte actualizada.'); cargar(); }, function (x) { errorEn(m, x.error); });
          };
        }
        $$('[data-pe]').forEach(function (b) { b.onclick = function () { editarParte(b.getAttribute('data-pe')); }; });
        $$('.cuerpo [data-parte]').forEach(function (g) { g.addEventListener('click', function () {
          var tr = $('#parte-' + g.getAttribute('data-parte')); if (tr) { tr.scrollIntoView({ block: 'center', behavior: 'smooth' }); tr.classList.add('resalta'); setTimeout(function () { tr.classList.remove('resalta'); }, 1600); }
          if (puede) editarParte(g.getAttribute('data-parte'));
        }); });
        enlazarCuerpo3D(c, puede, cargar);
        var be = $('#c-edit'); if (be) be.onclick = function () { formComponente(c, j.regiones); };
        enlazarAdjuntos(c, j, puede, cargar);
        enlazarRegistro(c, j, puede, cargar);
        var bdi = $('#c-dispo'); if (bdi) bdi.onclick = function () { modalDisposicion(c, j, cargar); };
        var bod = $('#c-odoo'); if (bod) bod.onclick = function () { exportarOdoo([c], 'Ficha-' + String(c.codigo).replace(/[^A-Za-z0-9-]+/g, '') + '-Odoo'); };
        var bdp = $('#c-dpdf'); if (bdp) bdp.onclick = function () { pdfDisposicion(c); };
        if (S.v3dAuto) { var g = c.adjuntos.find(function (a) { return a.clase === 'giro' && +a.fuente_id === +S.v3dAuto; }); S.v3dAuto = null; if (g) abrirVista(c, g, puede, cargar); }
        if (S.pedirIngreso === c.id) { S.pedirIngreso = null; pedirIngreso(c, j, cargar); }
        if (S.dispoAuto === c.id && c.disposicion) { S.dispoAuto = null; pdfDisposicion(c); }
        var ba = $('#c-add'); if (ba) ba.onclick = function () {
          var m = modal('Agregar parte a ' + c.codigo, '<label class="campo"><span>Región</span><select id="a-reg">' + j.regiones.filter(function (r) { return !r[3] || r[3] === c.sexo; }).map(function (r) { return '<option data-l="' + (r[2] ? 1 : 0) + '">' + esc(r[0]) + '</option>'; }).join('') + '</select></label>' +
            '<label class="campo" id="a-lado-c"><span>Lado</span><select id="a-lado"><option>Derecho</option><option>Izquierdo</option></select></label>', '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="a-ok" type="button">Agregar</button>');
          var up = function () { $('#a-lado-c', m.el).hidden = $('#a-reg', m.el).selectedOptions[0].getAttribute('data-l') !== '1'; }; $('#a-reg', m.el).onchange = up; up();
          $('#a-ok', m.el).onclick = function () { api('parte_agregar', { componente_id: c.id, region: $('#a-reg', m.el).value, lado: $('#a-lado', m.el).value }).then(function () { m.cerrar(); toast('Parte agregada.'); cargar(); }, function (x) { errorEn(m, x.error); }); };
        };
      }, function (e) { montar('<div class="vacio"><strong>No se pudo abrir el componente</strong>' + esc(e.error) + '</div>'); });
    }
    S.vista = { refrescar: cargar };
    cargar();
  }

  // ------------------------------------------------------------ asignación a eventos
  function vMorgueEventos() {
    var h = hoy();
    function cargar() {
      return api('eventos&desde=' + sumar(h, -3) + '&hasta=' + sumar(h, 30)).then(function (j) {
        var evs = j.eventos.filter(function (e) { return e.estado !== 'cancelado'; });
        montar('<div class="vista-cab"><div><div class="eyebrow">Morgue</div><h1>Asignación a eventos</h1><p>Qué partes de qué componente se usan en cada entrenamiento, por estación.</p></div></div>' +
          '<div class="panel">' + (evs.length ? '<div class="lista-ev">' + evs.map(function (e) {
            var falta = +e.n_partes < +e.componentes;
            return '<a class="ev-fila" href="#/morgue/evento/' + e.id + '"><div class="ev-hora"><small>' + esc(rangoFechas(e)) + '</small>' + ((e.dias || [])[0] || {}).hora_ini + '</div><div style="min-width:0"><div class="ev-t">' + esc(e.titulo) + '</div>' +
              '<div class="meta">' + esc(sala(e.sala_id).nombre) + ' · Instrumentador: ' + esc(usuario(e.responsable_id).nombre) + ' · Tanatólogo: ' + esc(e.tanatologo_id ? usuario(e.tanatologo_id).nombre : '—') + '</div>' +
              '<div class="meta"><b>' + (e.componentes || 0) + '</b> componentes solicitados · <b>' + (e.n_partes || 0) + '</b> partes asignadas</div></div>' +
              (falta ? '<span class="chip st-custodia">Faltan partes</span>' : chipEstado(e.estado)) + '</a>';
          }).join('') + '</div>' : '<div class="vacio">No hay entrenamientos programados.</div>') + '</div>');
      }, falla);
    }
    S.vista = { refrescar: cargar };
    cargar();
  }
  function vMorgueEvento(id) {
    function cargar() {
      return api('evento&id=' + id).then(function (D) {
        var e = D.evento;
        montar('<a class="miga" href="#/morgue/eventos">← Asignación a eventos</a>' +
          '<section class="ev-cab mo-cab"><div style="position:relative">' + chipEstado(e.estado) + '</div><h1 style="margin-top:8px">' + esc(e.titulo) + '</h1>' +
          '<div class="ev-datos"><span><b>' + esc(sala(e.sala_id).nombre) + '</b></span><span>' + esc(rangoFechas(e)) + '</span><span>Instrumentador: <b>' + esc(usuario(e.responsable_id).nombre) + '</b></span><span>Tanatólogo: <b>' + esc(e.tanatologo_id ? usuario(e.tanatologo_id).nombre : '—') + '</b></span><span><b>' + (e.componentes || 0) + '</b> componentes solicitados</span></div>' +
          '<div class="acciones"><a class="btn" href="#/evento/' + e.id + '">Abrir en Operaciones</a></div></section><div id="asg-panel"></div>');
        panelAsignaciones($('#asg-panel'), D, cargar);
      }, function (x) { montar('<div class="vacio"><strong>No se pudo abrir el evento</strong>' + esc(x.error) + '</div>'); });
    }
    S.vista = { refrescar: cargar };
    cargar();
  }
  /* Panel compartido (Morgue y pestaña del evento en Operaciones) */
  function panelAsignaciones(c, D, luego) {
    var e = D.evento, A = D.asignaciones || [], abierto = e.estado === 'programado' || e.estado === 'en_curso';
    var estaciones = {}; A.forEach(function (a) { var k = a.estacion || 'Sin estación'; (estaciones[k] = estaciones[k] || []).push(a); });
    var activas = A.filter(function (a) { return a.estado === 'Reservada' || a.estado === 'En uso'; }).length;
    c.innerHTML = '<div class="panel"><div class="panel-cab"><h2>Componentes anatómicos asignados</h2>' +
      (abierto && puedeMorgue() ? '<button class="btn btn-oro btn-sm" id="asg-nueva" type="button">+ Asignar partes</button>' : '') + '</div>' +
      (A.length ? '<div class="panel-cuerpo"><p class="meta" style="margin:0"><b>' + A.length + '</b> partes · <b>' + activas + '</b> reservadas o en sala · ' + Object.keys(estaciones).length + ' estaciones</p></div>' +
        tablaAsig(A.map(function (a) { return Object.assign({}, a, { sala_id: e.sala_id, fecha: e.fecha, evento_titulo: e.titulo }); }), false)
        : '<div class="vacio"><strong>Sin componentes asignados</strong>' + (abierto ? 'Use «Asignar partes» para reservar las partes de los cadáveres que se usarán en cada estación.' : '') + '</div>') + '</div>';
    enlazarAsig(c, luego);
    var b = $('#asg-nueva', c); if (b) b.onclick = function () { modalAsignar(D, luego); };
  }
  function modalAsignar(D, luego) {
    var e = D.evento, sel = {}, compId = null, M = null;
    var labels = (e.layout || []).filter(function (x) { return x.label; }).map(function (x) { return x.label; });
    var m = modal('Asignar partes · ' + e.titulo, '<div id="as-cont"><div class="vacio">Cargando inventario…</div></div>', '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="as-ok" type="button" disabled>Reservar partes</button>', { ancho: true, sinFoco: true });
    api('morgue').then(function (j) {
      M = j;
      var comps = M.componentes.filter(function (x) { return ['Disposición final', 'Pendiente de inhumación', 'Fuera de servicio', 'En cuarentena'].indexOf(x.estado) < 0 && x.partes.some(function (p) { return p.estado === 'Disponible'; }); });
      if (!comps.length) { $('#as-cont', m.el).innerHTML = '<div class="vacio"><strong>No hay partes disponibles</strong>Registre componentes en el inventario de la morgue.</div>'; return; }
      compId = comps[0].id;
      $('#as-cont', m.el).innerHTML = '<div class="form-grid"><label class="campo"><span class="req">Componente</span><select id="as-comp">' + comps.map(function (x) {
          return '<option value="' + x.id + '">' + esc(x.codigo) + ' · ' + esc(x.sexo) + (x.edad ? ' · ' + x.edad + ' años' : '') + ' · ' + x.partes.filter(function (p) { return p.estado === 'Disponible'; }).length + ' disp.</option>';
        }).join('') + '</select></label>' +
        '<label class="campo"><span>Estación</span><input id="as-est" list="as-est-l" maxlength="80" placeholder="Ej. Estación 1"><datalist id="as-est-l">' + labels.map(function (l) { return '<option value="' + esc(l) + '">'; }).join('') + '</datalist></label></div>' +
        '<div class="as-cuerpo"><div id="as-fig"></div><div><p class="meta" style="margin-top:0">Toque en el cuerpo las partes <b>disponibles</b> (verdes) que se usarán. Las demás están reservadas, en uso o no se pueden usar.</p><div id="as-sel"></div></div></div>';
      function pintar() {
        var comp = M.componentes.find(function (x) { return +x.id === +compId; });
        $('#as-fig', m.el).innerHTML = cuerpo(comp.partes, { sel: sel, elegibles: function (p) { return p.estado === 'Disponible'; } }) + leyendaCuerpo();
        $$('#as-fig [data-parte]', m.el).forEach(function (g) {
          g.addEventListener('click', function () {
            var p = comp.partes.find(function (x) { return +x.id === +g.getAttribute('data-parte'); });
            if (p.estado !== 'Disponible') return toast(esc(p.codigo) + ' está ' + esc(p.estado.toLowerCase()) + '.', 'error');
            if (sel[p.id]) delete sel[p.id]; else sel[p.id] = p;
            pintar();
          });
        });
        var ks = Object.keys(sel);
        $('#as-sel', m.el).innerHTML = ks.length ? '<b>' + ks.length + ' partes seleccionadas</b><ul class="as-lista">' + ks.map(function (k) { return '<li><span class="num">' + esc(sel[k].codigo) + '</span> · ' + esc(nombreParte(sel[k])) + '</li>'; }).join('') + '</ul>' : '<p class="meta">Ninguna parte seleccionada.</p>';
        $('#as-ok', m.el).disabled = !ks.length;
      }
      $('#as-comp', m.el).onchange = function () { compId = +this.value; sel = {}; pintar(); };
      pintar();
    }, function (x) { $('#as-cont', m.el).innerHTML = '<p class="form-error">' + esc(x.error) + '</p>'; });
    $('#as-ok', m.el).onclick = function () {
      api('asignar', { evento_id: e.id, partes: Object.keys(sel).map(Number), estacion: $('#as-est', m.el).value }).then(function () { m.cerrar(); toast('Partes reservadas para el evento.'); luego(); }, function (x) { errorEn(m, x.error); });
    };
  }

  // ================================================================== BITÁCORA
  function vBitacora() {
    var datos = [], q = '', quien = '';
    function filtrar() {
      var qq = q.toLowerCase();
      return datos.filter(function (b) {
        return (!quien || b.usuario_nombre === quien) && (!qq || (b.accion + ' ' + b.detalle + ' ' + (b.evento_titulo || '')).toLowerCase().indexOf(qq) >= 0);
      });
    }
    function pintar() {
      var rows = filtrar();
      $('#b-lista').innerHTML = rows.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Acción</th><th>Evento</th><th>Detalle</th></tr></thead><tbody>' + rows.map(function (b) {
        return '<tr><td class="num" style="white-space:nowrap">' + esc(b.momento) + '</td><td style="white-space:nowrap"><b>' + esc(b.usuario_nombre) + '</b>' + (cargoNombre(b.usuario_nombre) ? '<br><span class="meta">' + esc(cargoNombre(b.usuario_nombre)) + '</span>' : '') + '</td><td>' + esc(b.accion) + '</td><td>' + (b.evento_id ? '<a href="#/evento/' + b.evento_id + '">' + esc(b.evento_titulo || 'Evento ' + b.evento_id) + '</a>' : '—') + '</td><td class="bit-det">' + esc(b.detalle) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="vacio">Sin registros con ese filtro.</div>';
    }
    function cargar() {
      return api('bitacora&n=1000').then(function (j) {
        datos = j.bitacora;
        var nombres = []; datos.forEach(function (b) { if (nombres.indexOf(b.usuario_nombre) < 0) nombres.push(b.usuario_nombre); });
        var sel = $('#b-u'); var act = sel.value;
        sel.innerHTML = '<option value="">Todos los usuarios</option>' + nombres.sort().map(function (n) { return '<option' + (n === act ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('');
        pintar();
      }, falla);
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">Trazabilidad</div><h1>Bitácora</h1><p>Cada registro, cambio o novedad con el nombre de quien lo hizo y la hora exacta. No se puede editar.</p></div>' +
      '<button class="btn" id="b-csv" type="button">Descargar CSV (Excel)</button></div>' +
      '<div class="panel"><div class="panel-cab"><select id="b-u" style="max-width:240px"></select><input type="search" id="b-q" placeholder="Buscar en acciones y detalles…" style="max-width:360px"></div><div id="b-lista"><div class="vacio">Cargando…</div></div></div>');
    $('#b-u').onchange = function () { quien = this.value; pintar(); };
    $('#b-q').oninput = function () { q = this.value; pintar(); };
    $('#b-csv').onclick = function () {
      var rows = [['Fecha y hora', 'Usuario', 'Cargo', 'Acción', 'Evento', 'Detalle']].concat(filtrar().map(function (b) { return [b.momento, b.usuario_nombre, cargoNombre(b.usuario_nombre) || '', b.accion, b.evento_titulo || '', b.detalle || '']; }));
      var csv = '﻿' + rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      a.download = 'bitacora-clemi-salas-' + hoy() + '.csv'; document.body.appendChild(a); a.click(); a.remove();
    };
    S.vista = { refrescar: cargar };
    cargar();
  }

  // ================================================================== ADMINISTRACIÓN
  function vAdmin(p) {
    if (!esAdmin()) { location.hash = '#/tablero'; return; }
    var tab = p[0] || 'usuarios';
    function pintar() {
      montar('<div class="vista-cab"><div><div class="eyebrow">Solo administración</div><h1>Administración</h1><p>Usuarios y contraseñas, listas de verificación y catálogo de camillas y equipos.</p></div></div>' +
        '<nav class="tabs admin-tabs">' + [['usuarios', 'Usuarios'], ['listas', 'Listas de verificación'], ['checklist', 'Check list de ingreso'], ['integracion', 'Integración inscripciones'], ['catalogo', 'Camillas y equipos'], ['salas', 'Salas'], ['ensayo', 'Modo ensayo']].map(function (t) {
          return '<a href="#/admin/' + t[0] + '" class="' + (t[0] === tab ? 'is-on' : '') + '">' + t[1] + '</a>';
        }).join('') + '</nav><div id="adm"></div>');
      ({ usuarios: aUsuarios, listas: aListas, checklist: aChecklist, integracion: aIntegracion, catalogo: aCatalogo, ensayo: aEnsayo, salas: function () { location.hash = '#/salas'; } }[tab] || aUsuarios)($('#adm'));
    }
    S.vista = { refrescar: function () { cargarBase().then(pintar); } };
    pintar();
  }
  function aEnsayo(c) {
    c.innerHTML = '<div class="vacio">Cargando…</div>';
    var pinta = function (e, R) {
      if (!e) {
        c.innerHTML = '<div class="panel"><div class="panel-cab"><h2>Modo ensayo</h2></div><div class="panel-cuerpo"><p style="margin:0 0 10px">Para probar el proceso completo con todo el equipo al mismo tiempo: negociación, cotización con el enlace del cliente, firmas, preparación de salas, agenda y Real Time. Mientras dure, todos ven un aviso de <b>MODO ENSAYO</b> y cada pantalla se actualiza sola con lo que hacen los demás.</p>' +
          '<p class="meta" style="margin:0 0 12px">Al terminar puede <b>borrar lo creado durante el ensayo</b> (solicitudes, convenios, entrenamientos, personas inscritas y clientes del portal nuevos) o conservarlo. Durante el ensayo no registre trabajo real.</p>' +
          '<label class="campo"><span>Nombre del ensayo</span><input id="en-n" maxlength="120" placeholder="Ej. Ensayo curso de hombro con todo el equipo"></label><button class="btn btn-oro" id="en-ok" type="button">Iniciar modo ensayo</button></div></div>';
        $('#en-ok', c).onclick = function () { api('ensayo_iniciar', { nombre: $('#en-n', c).value }).then(function (j) { pintarEnsayo(j.ensayo); cargar(); }, falla); };
        return;
      }
      c.innerHTML = '<div class="panel"><div class="panel-cab"><h2>Ensayo en curso · ' + esc(e.nombre) + '</h2><span class="meta">desde ' + momento(e.desde) + ' · ' + esc(e.por) + '</span></div><div class="panel-cuerpo">' +
        '<p style="margin:0 0 8px"><b>Creado durante el ensayo:</b> ' + R.contratos.length + ' solicitudes / convenios · ' + R.eventos.length + ' entrenamientos · ' + R.inscritos + ' personas inscritas' + (R.clientes.length ? ' · ' + R.clientes.length + ' clientes del portal' : '') + '.</p>' +
        (R.contratos.length ? '<ul class="adf-esp">' + R.contratos.map(function (x) { return '<li>' + esc(x.codigo) + ' · ' + esc(x.cliente) + ' · ' + esc(x.curso) + ' · ' + esc(x.estado) + '</li>'; }).join('') + '</ul>' : '') +
        (R.eventos.length ? '<ul class="adf-esp">' + R.eventos.map(function (x) { return '<li>Entrenamiento: ' + esc(x.titulo) + ' · ' + esc(fCorta(x.fecha)) + '</li>'; }).join('') + '</ul>' : '') +
        '<div class="acciones" style="margin-top:14px"><button class="btn" id="en-con" type="button">Terminar y conservar lo creado</button><button class="btn btn-peligro" id="en-bor" type="button">Terminar y borrar lo creado</button></div></div></div>';
      $('#en-con', c).onclick = function () { api('ensayo_terminar', { borrar: 0 }).then(function () { pintarEnsayo(null); cargar(); }, falla); };
      $('#en-bor', c).onclick = function () {
        var m = modal('Terminar y borrar el ensayo', '<p style="margin:0 0 8px">Se borrarán ' + R.contratos.length + ' solicitudes / convenios, ' + R.eventos.length + ' entrenamientos y ' + R.inscritos + ' personas creadas durante el ensayo, con sus documentos, firmas y check lists. La bitácora conserva el registro.</p><label class="campo"><span class="req">Escriba BORRAR ENSAYO para confirmar</span><input id="x-c" autocomplete="off"></label>',
          '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-peligro" id="x-ok" type="button">Borrar</button>');
        $('#x-ok', m.el).onclick = function () { api('ensayo_terminar', { borrar: 1, confirmar: $('#x-c', m.el).value }).then(function (j) { m.cerrar(); pintarEnsayo(null); toast('Ensayo terminado: se borraron ' + j.borrado.contratos + ' convenios y ' + j.borrado.eventos + ' entrenamientos.'); cargar(); }, function (e2) { errorEn(m, e2.error); }); };
      };
    };
    function cargar() { api('ensayo_resumen').then(function (j) { pinta(j.ensayo, j.resumen); }, function () { pinta(null); }); }
    cargar();
  }
  function aUsuarios(c) {
    c.innerHTML = '<div class="panel"><div class="panel-cab"><h2>Usuarios de la plataforma</h2><button class="btn btn-verde btn-sm" id="u-nuevo" type="button">+ Nuevo usuario</button></div><div class="tabla-wrap"><table class="tabla"><thead><tr><th>Nombre</th><th>Usuario</th><th>Cédula</th><th>Rol</th><th>Estado</th><th></th></tr></thead><tbody>' +
      S.base.usuarios.map(function (u) {
        return '<tr><td><b>' + esc(u.nombre) + '</b></td><td class="num">' + esc(u.usuario) + '</td><td class="num">' + esc(u.cedula || '—') + '</td><td>' + (u.rol === 'admin' ? 'Administradora' : u.rol === 'tanatologo' ? 'Tanatólogo · solo novedades' : u.rol === 'comercial' ? 'Operaciones · Contratación' + (/ps/.test(u.areas_extra || '') ? ' + Presupuesto' : '') + (/th/.test(u.areas_extra || '') ? ' + Talento Humano' : '') : u.rol === 'audiovisual' ? 'Audiovisuales' : u.rol === 'almacen' ? 'Almacén · Presupuesto' : u.rol === 'firma' ? 'Representante legal · firma' : u.rol === 'talento' ? 'Talento Humano' : u.rol === 'administrativo' ? 'Administrativo' : u.rol === 'biomedica' ? 'Biomédica' : 'Instrumentador(a)') + ((u.areas_extra || '').split(',').filter(function (x) { return ['lg', 'bm', 'ad'].indexOf(x) >= 0; }).map(function (x) { return ' + ' + AREA_NOMBRE[x]; }).join('')) + '</td>' +
          '<td>' + (+u.activo ? (+u.debe_cambiar ? '<span class="chip st-custodia">Contraseña inicial</span>' : '<span class="chip st-devuelto">Activo</span>') : '<span class="chip st-cancelado">Inactivo</span>') + '</td>' +
          '<td style="white-space:nowrap"><button class="btn btn-sm" data-ed="' + u.id + '" type="button">Editar</button> <button class="btn btn-sm" data-cl="' + u.id + '" type="button">Asignar contraseña</button></td></tr>';
      }).join('') + '</tbody></table></div></div><p class="meta">La cédula de cada instrumentador se usa para llenar automáticamente la devolución de instrumental.</p>';
    function editar(u) {
      var m = modal(u ? 'Editar usuario' : 'Nuevo usuario', '<div class="form-grid">' +
        (!u || u.rol !== 'admin' ? '<label class="campo ancho"><span class="req">Rol</span><select id="x-r"><option value="instrumentador"' + (u && u.rol === 'instrumentador' ? ' selected' : '') + '>Instrumentador(a) quirúrgico(a)</option><option value="tanatologo"' + (u && u.rol === 'tanatologo' ? ' selected' : '') + '>Tanatólogo · solo registra novedades y consulta</option><option value="comercial"' + (u && u.rol === 'comercial' ? ' selected' : '') + '>Operaciones · Contratación (solo esa sección)</option><option value="audiovisual"' + (u && u.rol === 'audiovisual' ? ' selected' : '') + '>Audiovisuales (solo esa sección)</option><option value="almacen"' + (u && u.rol === 'almacen' ? ' selected' : '') + '>Almacén · Presupuesto (solo esa sección)</option><option value="firma"' + (u && u.rol === 'firma' ? ' selected' : '') + '>Representante legal · solo lee y firma convenios</option><option value="administrativo"' + (u && u.rol === 'administrativo' ? ' selected' : '') + '>Administrativo · seguimiento de convenios, novedades y equipo a cargo</option><option value="biomedica"' + (u && u.rol === 'biomedica' ? ' selected' : '') + '>Biomédica · inventario de equipos</option>' + (u && u.rol === 'talento' ? '<option value="talento" selected>Talento Humano (solo esa sección)</option>' : '') + '</select></label>' +
          '<label class="check ancho" id="x-psw"><input type="checkbox" id="x-ps"' + (u && /ps/.test(u.areas_extra || '') ? ' checked' : '') + '>También entra a Presupuesto (almacén)</label>' +
          '<label class="check ancho"><input type="checkbox" id="x-th"' + (u && /th/.test(u.areas_extra || '') ? ' checked' : '') + '>También entra a Talento Humano (personal, dotación y Eventos CLEMI)</label>' +
          [['lg', 'Logística (comedor, traslados, vuelos y hospedaje)'], ['bm', 'Biomédica (inventario de equipos)'], ['ad', 'Administrativo (seguimiento de convenios y novedades)']].map(function (x) { return '<label class="check ancho"><input type="checkbox" data-ex="' + x[0] + '"' + (u && (',' + (u.areas_extra || '') + ',').indexOf(',' + x[0] + ',') >= 0 ? ' checked' : '') + '>También entra a ' + x[1] + '</label>'; }).join('') : '') +
        '<label class="campo"><span class="req">Nombre completo</span><input id="x-n" value="' + esc(u ? u.nombre : '') + '"></label>' +
        '<label class="campo"><span class="req">Usuario de ingreso</span><input id="x-u" value="' + esc(u ? u.usuario : '') + '" autocapitalize="none"><small>Minúsculas, sin espacios. Ej. nombre.apellido</small></label>' +
        '<label class="campo"><span>Cédula</span><input id="x-c" value="' + esc(u ? u.cedula : '') + '"></label>' +
        (u ? (u.rol !== 'admin' ? '<label class="check" style="align-self:end"><input type="checkbox" id="x-a"' + (+u.activo ? ' checked' : '') + '>Usuario activo (puede ingresar)</label>' : '') :
          '<label class="campo"><span class="req">Contraseña inicial</span><input id="x-p" value="Clemi-' + Math.random().toString(36).slice(2, 8) + '"><small>Deberá cambiarla en su primer ingreso.</small></label>') + '</div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar</button>');
      var rs = $('#x-r', m.el); if (rs) { var tg = function () { $('#x-psw', m.el).hidden = rs.value !== 'comercial'; }; rs.addEventListener('change', tg); tg(); }
      $('#x-ok', m.el).onclick = function () {
        api('usuario_guardar', { id: u ? u.id : 0, nombre: $('#x-n', m.el).value, usuario: $('#x-u', m.el).value, cedula: $('#x-c', m.el).value,
          activo: $('#x-a', m.el) ? $('#x-a', m.el).checked : 1, rol: $('#x-r', m.el) ? $('#x-r', m.el).value : '', clave: $('#x-p', m.el) ? $('#x-p', m.el).value : '', presupuesto: $('#x-ps', m.el) && $('#x-ps', m.el).checked ? 1 : 0, talento_humano: $('#x-th', m.el) && $('#x-th', m.el).checked ? 1 : 0, extras: $$('[data-ex]', m.el).filter(function (x) { return x.checked; }).map(function (x) { return x.getAttribute('data-ex'); }) })
          .then(function () { m.cerrar(); toast('Usuario guardado.'); return cargarBase(); }, function (x) { errorEn(m, x.error); throw x; }).then(function () { aUsuarios(c); }, function () {});
      };
    }
    $('#u-nuevo', c).onclick = function () { editar(null); };
    $$('[data-ed]', c).forEach(function (b) { b.onclick = function () { editar(usuario(b.getAttribute('data-ed'))); }; });
    $$('[data-cl]', c).forEach(function (b) {
      b.onclick = function () {
        var u = usuario(b.getAttribute('data-cl'));
        var m = modal('Contraseña de ' + u.nombre, '<label class="campo"><span>Nueva contraseña</span><input id="x-p" value="Clemi-' + Math.random().toString(36).slice(2, 8) + '"><small>Entréguela personalmente. ' + (+u.id === +S.yo.id ? '' : 'Se le pedirá cambiarla al ingresar.') + '</small></label>',
          '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Asignar</button>');
        $('#x-ok', m.el).onclick = function () { api('usuario_clave', { id: u.id, clave: $('#x-p', m.el).value }).then(function () { m.cerrar(); toast('Contraseña asignada a ' + esc(u.nombre) + '.'); cargarBase().then(function () { aUsuarios(c); }); }, function (x) { errorEn(m, x.error); }); };
      };
    });
  }
  function aListas(c) {
    c.innerHTML = '<div class="panel"><div class="panel-cab"><h2>Listas de verificación</h2><button class="btn btn-verde btn-sm" id="p-nueva" type="button">+ Nueva lista</button></div>' +
      (S.base.plantillas.length ? '<div class="lista-ev">' + S.base.plantillas.map(function (p) {
        return '<div class="ev-fila" style="grid-template-columns:minmax(0,1fr) auto"><div><div class="ev-t">' + esc(p.nombre) + '</div><div class="meta">' + p.items.length + ' ítems · Antes ' + p.items.filter(function (i) { return i.fase === 'Antes'; }).length + ' · Durante ' + p.items.filter(function (i) { return i.fase === 'Durante'; }).length + ' · Después ' + p.items.filter(function (i) { return i.fase === 'Después'; }).length + '</div></div>' +
          '<div class="acciones"><button class="btn btn-sm" data-pe="' + p.id + '" type="button">Editar</button><button class="btn btn-sm btn-peligro" data-pb="' + p.id + '" type="button">Eliminar</button></div></div>';
      }).join('') + '</div>' : '<div class="vacio"><strong>Aún no hay listas</strong>Cree las listas de ítems a verificar por tipo de entrenamiento. Luego se cargan con un clic en cada evento.</div>') + '</div>';
    function editar(p) {
      var its = p ? JSON.parse(JSON.stringify(p.items)) : [{ fase: 'Antes', texto: '' }];
      var m = modal(p ? 'Editar lista' : 'Nueva lista de verificación', '<label class="campo"><span class="req">Nombre de la lista</span><input id="x-n" value="' + esc(p ? p.nombre : '') + '" placeholder="Ej. Entrenamiento con componente anatómico — estándar"></label><div id="x-its"></div>' +
        '<div class="acciones"><button class="btn btn-sm" id="x-mas" type="button">+ Agregar ítem</button><button class="btn btn-sm" id="x-pegar" type="button">Pegar varios ítems</button></div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar lista</button>', { ancho: true });
      function pintar() {
        $('#x-its', m.el).innerHTML = its.map(function (it, i) {
          return '<div class="plant-item"><select data-i="' + i + '" data-k="fase">' + ['Antes', 'Durante', 'Después'].map(function (f) { return '<option' + (f === it.fase ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select>' +
            '<input data-i="' + i + '" data-k="texto" value="' + esc(it.texto) + '" placeholder="Ítem a verificar"><button type="button" class="quitar" data-q="' + i + '" aria-label="Quitar">×</button></div>';
        }).join('');
        $$('[data-k]', m.el).forEach(function (el) { el.oninput = el.onchange = function () { its[+el.getAttribute('data-i')][el.getAttribute('data-k')] = el.value; }; });
        $$('[data-q]', m.el).forEach(function (b) { b.onclick = function () { its.splice(+b.getAttribute('data-q'), 1); pintar(); }; });
      }
      pintar();
      $('#x-mas', m.el).onclick = function () { its.push({ fase: its.length ? its[its.length - 1].fase : 'Antes', texto: '' }); pintar(); $$('[data-k=texto]', m.el).pop().focus(); };
      $('#x-pegar', m.el).onclick = function () {
        var box = document.createElement('div');
        box.innerHTML = '<label class="campo"><span>Pegue un ítem por línea</span><textarea id="x-bulk" style="min-height:140px"></textarea></label><div class="acciones" style="margin-top:8px"><select id="x-bf" style="width:auto"><option>Antes</option><option>Durante</option><option>Después</option></select><button type="button" class="btn btn-sm btn-verde" id="x-bok">Agregar a la lista</button></div>';
        $('#x-its', m.el).after(box);
        $('#x-bok', box).onclick = function () {
          var f = $('#x-bf', box).value;
          $('#x-bulk', box).value.split(/\r?\n/).map(function (s) { return s.replace(/^[\s\-•*\d.)]+/, '').trim(); }).filter(Boolean).forEach(function (t) { its.push({ fase: f, texto: t }); });
          its = its.filter(function (x) { return x.texto.trim(); }); box.remove(); pintar();
        };
      };
      $('#x-ok', m.el).onclick = function () {
        api('plantilla_guardar', { id: p ? p.id : 0, nombre: $('#x-n', m.el).value, items: its }).then(function () { m.cerrar(); toast('Lista guardada.'); return cargarBase(); }, function (x) { errorEn(m, x.error); throw x; }).then(function () { aListas(c); }, function () {});
      };
    }
    $('#p-nueva', c).onclick = function () { editar(null); };
    $$('[data-pe]', c).forEach(function (b) { b.onclick = function () { editar(S.base.plantillas.find(function (p) { return +p.id === +b.getAttribute('data-pe'); })); }; });
    $$('[data-pb]', c).forEach(function (b) {
      b.onclick = function () {
        var p = S.base.plantillas.find(function (x) { return +x.id === +b.getAttribute('data-pb'); });
        var m = modal('Eliminar lista', '<p style="margin:0">¿Eliminar «' + esc(p.nombre) + '»? Los eventos que ya la usaron conservan sus ítems.</p>', '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-peligro" id="x-ok" type="button">Eliminar</button>');
        $('#x-ok', m.el).onclick = function () { api('plantilla_borrar', { id: p.id }).then(function () { m.cerrar(); return cargarBase(); }).then(function () { aListas(c); }, falla); };
      };
    });
  }
  function aCatalogo(c) {
    var formas = Plano.FORMAS;
    function fila(x) {
      return '<div class="cat-fila" data-id="' + (x.id || 0) + '"><input type="color" data-k="color" value="' + esc(x.color) + '" aria-label="Color">' +
        '<input data-k="nombre" value="' + esc(x.nombre) + '" placeholder="Nombre del elemento">' +
        '<select data-k="forma">' + Object.keys(formas).map(function (k) { return '<option value="' + k + '"' + (k === x.forma ? ' selected' : '') + '>' + formas[k] + '</option>'; }).join('') + '</select>' +
        '<input type="number" data-k="ancho" value="' + x.ancho + '" title="Largo en cm" aria-label="Largo (cm)"><input type="number" data-k="largo" value="' + x.largo + '" title="Ancho en cm" aria-label="Ancho (cm)">' +
        '<label class="check" title="Disponible en el editor"><input type="checkbox" data-k="activo"' + (+x.activo ? ' checked' : '') + '>Activo</label>' +
        '<div style="background:#ebe7dd;border-radius:6px;padding:2px;height:44px">' + miniatura(x) + '</div>' +
        '<button class="btn btn-sm btn-verde" data-g type="button">Guardar</button></div>';
    }
    function miniatura(x) {
      var s = { nombre: '', ancho: Math.max(+x.ancho, +x.largo) + 40, largo: Math.min(+x.ancho, +x.largo) + 40, plano: [] };
      var it = [{ id: 'm', cat: 1, x: s.ancho / 2, y: s.largo / 2, r: +x.ancho >= +x.largo ? 0 : 90 }];
      return Plano.svg({ sala: s, plano: [], items: it, catalogo: [Object.assign({}, x, { id: 1 })], cotas: false, etiquetas: false }).replace('class="pl-svg"', 'class="pl-svg" style="height:40px;width:100%"');
    }
    c.innerHTML = '<div class="panel"><div class="panel-cab"><h2>Camillas y equipos para ubicar en las salas</h2><button class="btn btn-verde btn-sm" id="k-nuevo" type="button">+ Nuevo elemento</button></div>' +
      '<div class="cat-fila" style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--gris);font-weight:700"><span></span><span>Nombre</span><span>Dibujo</span><span>Largo cm</span><span>Ancho cm</span><span></span><span>Vista</span><span></span></div>' +
      '<div id="k-filas">' + S.base.catalogo.map(fila).join('') + '</div></div><p class="meta">Los elementos inactivos no aparecen para agregar, pero se siguen viendo en los eventos donde ya se usaron.</p>';
    function enlazar() {
      $$('.cat-fila[data-id]', c).forEach(function (row) {
        var b = $('[data-g]', row); if (!b) return;
        b.onclick = function () {
          var d = { id: +row.getAttribute('data-id') };
          $$('[data-k]', row).forEach(function (el) { d[el.getAttribute('data-k')] = el.type === 'checkbox' ? (el.checked ? 1 : 0) : el.value; });
          api('catalogo_guardar', d).then(function () { toast('Elemento guardado.'); return cargarBase(); }).then(function () { aCatalogo(c); }, falla);
        };
      });
    }
    enlazar();
    $('#k-nuevo', c).onclick = function () {
      $('#k-filas', c).insertAdjacentHTML('beforeend', fila({ nombre: '', forma: 'caja', ancho: 60, largo: 60, color: '#2A5A41', activo: 1 }));
      enlazar(); $$('#k-filas [data-k=nombre]', c).pop().focus();
    };
  }

  // ================================================================== OPERACIONES (contratación) · PLANIFICACIÓN CON EL CLIENTE · AUDIOVISUALES
  var PLAN_EST = { sin_plan: ['Sin planificación', 'pe-sin'], abierto: ['Abierta para el cliente', 'pe-abierto'], enviado: ['Enviada · por revisar', 'pe-enviado'], cambio_solicitado: ['Cambio solicitado', 'pe-cambio'], aprobado: ['Aprobada', 'pe-aprobado'] };
  function chipPlan(e) { var x = PLAN_EST[e] || [e, '']; return '<span class="chip ' + x[1] + '">' + esc(x[0]) + '</span>'; }
  var CT_EST = { 'Solicitud': 'ct-sol', 'Cotización': 'ct-cot', 'Contratado': 'ct-ok', 'Finalizado': 'ct-fin', 'Cancelado': 'ct-can' };
  function chipCT(e) { return '<span class="chip ' + (CT_EST[e] || '') + '">' + esc(e) + '</span>'; }
  var AV_COL = { 'Solicitado': '#8E6C1C', 'En preparación': '#13466B', 'Listo': '#2E7D4F', 'Instalado / entregado': '#1B3F2C', 'No disponible': '#A93A32' };
  var AV_ESTADOS = ['Solicitado', 'En preparación', 'Listo', 'Instalado / entregado', 'No disponible'];
  function chipAV(e) { var c = AV_COL[e] || '#555'; return '<span class="chip" style="background:' + c + '1c;color:' + c + '">' + esc(e) + '</span>'; }
  function puedeCT() { return !!S.yo && (S.yo.rol === 'admin' || S.yo.rol === 'comercial'); }
  function puedeAV() { return !!S.yo && (S.yo.rol === 'admin' || S.yo.rol === 'audiovisual'); }
  function areasYo() { return (S.yo && S.yo.areas && S.yo.areas.length) ? S.yo.areas.slice().sort(function (a, b) { return AREA_ORDEN.indexOf(a) - AREA_ORDEN.indexOf(b); }) : ['op']; }
  var AREA_INICIO = { op: '#/tablero', mo: '#/morgue', ct: '#/ct', ps: '#/ps', av: '#/av', fi: '#/firmas', th: '#/th', ad: '#/adm', lg: '#/lg', bm: '#/bm' };
  var AREA_NOMBRE = { op: 'Instrumentación', mo: 'Morgue', ct: 'Negociación del evento', ps: 'Cotización', av: 'Audiovisuales', fi: 'Firma de convenios', th: 'Talento Humano', ad: 'Administrativo', lg: 'Logística', bm: 'Biomédica' };
  // Orden del proceso del evento: 1 negociación, 2 cotización, 3 administrativo, 4 operación.
  var AREA_ORDEN = ['ct', 'ps', 'ad', 'fi', 'th', 'op', 'mo', 'av', 'lg', 'bm'];
  var AREA_ETAPA = { ct: '1 · Negociación del evento', ps: '2 · Cotización', ad: '3 · Administrativo', fi: '3 · Administrativo', th: '3 · Administrativo', op: '4 · La operación', mo: '4 · La operación', av: '4 · La operación', lg: '4 · La operación', bm: '4 · La operación' };
  function pesos(v) { return '$' + Math.round(+v || 0).toLocaleString('es-CO'); }
  function rangoCT(c) { return c.fecha_inicio === c.fecha_fin ? fCorta(c.fecha_inicio) : fCorta(c.fecha_inicio) + ' – ' + fCorta(c.fecha_fin); }
  function diasPara(f) { return Math.round((dISO(f) - dISO(hoy())) / 86400000); }
  function faltan(f) { var n = diasPara(f); return n < 0 ? 'hace ' + (-n) + (n === -1 ? ' día' : ' días') : n === 0 ? 'hoy' : n === 1 ? 'mañana' : 'en ' + n + ' días'; }
  function enlaceCliente(token) { if (window.CLEMI_DEMO && window.CLEMI_DEMO.enlaceCliente) return window.CLEMI_DEMO.enlaceCliente(token); return location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, '') + 'cliente.html?t=' + token; }
  function copiarTxt(v, msg) {
    var fin = function () { toast(msg || 'Copiado.'); };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(v).then(fin, function () { respaldo(); });
    respaldo();
    function respaldo() { var t = document.createElement('textarea'); t.value = v; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); fin(); } catch (e) { toast('Seleccione el texto y cópielo.', 'error'); } t.remove(); }
  }
  function accesoChip(c) {
    var a = c.acceso;
    if (a.vigente) return '<span class="chip pe-aprobado">Vigente hasta ' + esc(fCorta(a.hasta)) + '</span>';
    return '<span class="meta">' + ({ sin_acceso: 'Sin acceso', anulado: 'Cerrado', vencido: 'Vencido', cerrado: 'Cerrado', no_iniciado: 'Desde ' + fCorta(a.desde) }[a.motivo] || '—') + '</span>';
  }
  function subirCT(fd, progreso) {
    if (window.CLEMI_DEMO && window.CLEMI_DEMO.subirCT) return window.CLEMI_DEMO.subirCT(fd, progreso);
    return new Promise(function (ok, mal) {
      var x = new XMLHttpRequest();
      x.open('POST', 'api.php?a=contrato_archivo_subir'); x.setRequestHeader('X-CSRF', S.csrf); x.withCredentials = true;
      x.upload.onprogress = function (e) { if (e.lengthComputable && progreso) progreso(e.loaded / e.total); };
      x.onload = function () { var j; try { j = JSON.parse(x.responseText); } catch (e) { j = { ok: false, error: x.status === 413 ? 'El archivo supera el tamaño que permite el servidor.' : 'Respuesta inesperada del servidor (' + x.status + ').' }; } if (x.status === 401) mostrarLogin(); j.ok ? ok(j) : mal(j); };
      x.onerror = function () { mal({ ok: false, error: 'No hay conexión con el servidor.' }); };
      x.send(fd);
    });
  }
  function urlArchivoCT(a, descargar) { if (window.CLEMI_DEMO && window.CLEMI_DEMO.archivoCT) return window.CLEMI_DEMO.archivoCT(a); return 'api.php?a=contrato_archivo_ver&id=' + a.id + (descargar ? '&descargar=1' : ''); }

  // ------------------------------------------------------------ lista de contratos
  function vCT(p) {
    if (!puedeCT()) { location.hash = AREA_INICIO[areasYo()[0]]; return; }
    if (p[0] === 'contrato') return vContrato(+p[1], p[2] || 'datos');
    if (p[0] === 'clientes') return vClientes();
    if (p[0] === 'archivo') return vArchivo();
    var datos = null, filtro = 'activos', q = '';
    function pintar() {
      var h = hoy();
      var cerrado = function (c) { return c.estado === 'Cancelado' || c.estado === 'Finalizado' || c.fecha_fin < h; };
      var L = datos.filter(function (c) {
        if (filtro === 'activos' && cerrado(c)) return false;
        if (filtro === 'revisar' && (cerrado(c) || ['enviado', 'cambio_solicitado'].indexOf(c.plan_estado) < 0)) return false;
        if (filtro === 'cotizacion' && c.estado !== 'Cotización') return false;
        if (filtro === 'solicitudes' && c.estado !== 'Solicitud') return false;
        if (filtro === 'cerrados' && !cerrado(c)) return false;
        return !q || (c.codigo + ' ' + c.cliente + ' ' + c.curso + ' ' + c.sala_nombre + ' ' + (c.contacto_nombre || '')).toLowerCase().indexOf(q) >= 0;
      });
      L.sort(function (a, b) { return filtro === 'cerrados' ? (a.fecha_inicio < b.fecha_inicio ? 1 : -1) : (a.fecha_inicio > b.fecha_inicio ? 1 : -1); });
      var act = datos.filter(function (c) { return !cerrado(c); });
      var k = function (n, t, f) { return '<button type="button" class="kpi' + (filtro === f ? ' is-on' : '') + '" data-f="' + f + '"><b>' + n + '</b><span>' + t + '</span></button>'; };
      $('#ct-kpis').innerHTML = k(act.filter(function (c) { return c.estado === 'Contratado'; }).length, 'cursos contratados por realizar', 'activos') +
        k(act.filter(function (c) { return ['enviado', 'cambio_solicitado'].indexOf(c.plan_estado) >= 0; }).length, 'planificaciones por revisar', 'revisar') +
        k(datos.filter(function (c) { return c.estado === 'Solicitud'; }).length, 'solicitudes de contratación', 'solicitudes') +
        k(datos.filter(function (c) { return c.estado === 'Cotización'; }).length, 'cotizaciones', 'cotizacion') +
        k(act.filter(function (c) { return c.acceso.vigente; }).length, 'accesos de clientes vigentes', 'activos');
      $$('#ct-kpis [data-f]').forEach(function (b) { b.onclick = function () { filtro = b.getAttribute('data-f'); $('#ct-f').value = filtro; pintar(); }; });
      $('#ct-lista').innerHTML = L.length ? '<div class="tabla-wrap"><table class="tabla tabla-click"><thead><tr><th>Convenio</th><th>Cliente y curso</th><th>Sala y fechas</th><th>Estado</th><th>Presupuesto</th><th>Planificación</th><th>Acceso del cliente</th><th class="num">Valor</th></tr></thead><tbody>' +
        L.map(function (c) {
          var n = diasPara(c.fecha_inicio);
          return '<tr data-id="' + c.id + '"><td><b class="num">' + esc(c.codigo) + '</b>' + (c.convenio ? '<br><span class="meta ct-conv-l">' + esc(c.convenio) + '</span>' : '') + '</td><td><b>' + esc(c.cliente) + '</b><br><span class="meta">' + esc(c.curso) + '</span></td>' +
            '<td style="white-space:nowrap">' + esc(c.sala_nombre) + '<br><span class="meta">' + esc(rangoCT(c)) + (n >= 0 && c.estado !== 'Cancelado' ? ' · ' + faltan(c.fecha_inicio) : '') + '</span></td>' +
            '<td>' + chipCT(c.estado) + '</td><td>' + chipPpto(c.ppto_estado) + '</td><td>' + chipPlan(c.plan_estado) + (c.plan_version ? '<br><span class="meta">v' + c.plan_version + ' · ' + esc(c.plan_autor_tipo === 'clemi' ? 'CLEMI' : 'cliente') + '</span>' : '') + '</td>' +
            '<td>' + accesoChip(c) + '</td><td class="num">' + pesos(c.valor) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="vacio"><strong>' + (datos.length ? 'Sin convenios con ese filtro' : 'Aún no hay convenios') + '</strong>' + (datos.length ? '' : 'Registre el primer curso contratado con «+ Nuevo convenio».') + '</div>';
      $$('#ct-lista tr[data-id]').forEach(function (tr) { tr.onclick = function () { location.hash = '#/ct/contrato/' + tr.getAttribute('data-id'); }; });
    }
    function cargar() { return api('contratos').then(function (j) { datos = j.contratos; if ($('#ct-kpis')) pintar(); }, falla); }
    montar('<div class="vista-cab"><div><div class="eyebrow">1 · Negociación del evento</div><h1>Solicitudes y convenios</h1><p>Solicitudes de contratación, presupuesto con el área de almacén, convenio en Word, acceso del cliente para elegir y planificar su sala, audiovisuales y paso a la agenda de instrumentación.</p></div>' +
      '<button class="btn btn-oro" id="ct-nuevo" type="button">+ Nueva solicitud</button></div>' +
      '<div class="kpis" id="ct-kpis"></div>' +
      '<div class="panel"><div class="panel-cab"><select id="ct-f" style="max-width:260px"><option value="activos">Por realizar</option><option value="revisar">Planificaciones por revisar</option><option value="solicitudes">Solicitudes de contratación</option><option value="cotizacion">Cotizaciones</option><option value="cerrados">Realizados, finalizados y cancelados</option><option value="todos">Todos</option></select>' +
      '<input type="search" id="ct-q" placeholder="Buscar cliente, curso, código…" style="max-width:320px"></div><div id="ct-lista"><div class="vacio">Cargando…</div></div></div>');
    $('#ct-f').onchange = function () { filtro = this.value; pintar(); };
    $('#ct-q').oninput = function () { q = this.value.toLowerCase(); pintar(); };
    $('#ct-nuevo').onclick = function () { formContrato(null, function (id) { location.hash = '#/ct/contrato/' + id; }); };
    S.vista = { refrescar: cargar };
    cargar();
  }

  function formContrato(c, luego) {
    var n = !c; c = c || { estado: 'Solicitud', fecha_contratacion: hoy(), hora_ini: '07:00', hora_fin: '17:00', estado_pago: 'Pendiente', sala_id: '', responsable_id: S.yo.rol === 'comercial' ? S.yo.id : '' };
    var com = (S.base.usuarios || []).filter(function (u) { return (u.rol === 'comercial' || u.rol === 'admin') && +u.activo; });
    var inp = function (id, lbl, val, extra, req) { return '<label class="campo"><span' + (req ? ' class="req"' : '') + '>' + lbl + '</span><input id="' + id + '" value="' + esc(val == null ? '' : val) + '"' + (extra || '') + '></label>'; };
    var m = modal(n ? 'Nueva solicitud · negociación del evento' : 'Editar ' + c.codigo,
      '<div class="ct-sec">Convenio</div><div class="form-grid">' + '<label class="campo ancho"><span class="req">Nombre del convenio</span><input id="k-conv" maxlength="200" value="' + esc(c.nombre_convenio || '') + '" placeholder="Se propone con el cliente y el curso; puede cambiarlo"><small>Así se identifica el convenio en la plataforma, en el documento y en la firma electrónica.</small></label></div>' +
      '<div class="ct-sec">Cliente</div><div class="form-grid">' +
        inp('k-cli', 'Cliente (empresa o persona)', c.cliente, ' maxlength="200"', 1) + inp('k-nit', 'NIT / documento', c.nit, ' maxlength="40"') +
        inp('k-con', 'Persona de contacto', c.contacto_nombre, ' maxlength="120"') + inp('k-car', 'Cargo', c.contacto_cargo, ' maxlength="120"') +
        inp('k-cor', 'Correo', c.contacto_correo, ' type="email" maxlength="160"') + inp('k-tel', 'Teléfono / WhatsApp', c.contacto_telefono, ' type="tel" maxlength="40"') + '</div>' +
      '<div class="ct-sec">Curso y sala</div><div class="form-grid">' +
        inp('k-cur', 'Nombre del curso', c.curso, ' maxlength="200"', 1) + inp('k-esp', 'Especialidad', c.especialidad, ' maxlength="120"') +
        '<label class="campo"><span class="req">Cantidad de salas</span><input id="k-nsal" type="number" min="1" max="' + S.base.salas.length + '" value="' + (c.salas_n || (c.salas || []).length || 1) + '"><small>Si no elige cuáles, la plataforma asigna las que estén libres en esas fechas y horas.</small></label>' +
        '<div class="campo"><span>¿Cuáles salas? (opcional)</span><div class="k-salas">' + S.base.salas.map(function (s) { return '<label class="check"><input type="checkbox" class="k-sal" value="' + s.id + '"' + ((c.salas || (c.sala_id ? [+c.sala_id] : [])).indexOf(+s.id) >= 0 && !n ? ' checked' : '') + '>' + esc(s.nombre) + ' <span class="meta">' + (s.ancho / 100).toFixed(1).replace('.', ',') + '×' + (s.largo / 100).toFixed(1).replace('.', ',') + ' m</span></label>'; }).join('') + '</div></div>' +
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:10px">' + inp('k-fi', 'Fecha de inicio', c.fecha_inicio, ' type="date"', 1) + inp('k-ff', 'Fecha final', c.fecha_fin, ' type="date"', 1) + '</div>' +
        '<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:10px">' + inp('k-hi', 'Hora de inicio', c.hora_ini, ' type="time"', 1) + inp('k-hf', 'Hora final', c.hora_fin, ' type="time"', 1) + '</div>' +
        '<div class="form-grid" style="grid-template-columns:1fr 1fr 1fr;gap:10px">' + inp('k-par', 'Participantes', c.participantes || '', ' type="number" min="0"') + inp('k-ins', 'Instructores', c.instructores_n || '', ' type="number" min="0"') + inp('k-stf', 'Staff', c.staff_n || '', ' type="number" min="0"') + '</div>' +
        inp('k-est', 'Estaciones', c.estaciones || '', ' type="number" min="0"') +
        inp('k-comp', 'Componentes anatómicos', c.componentes || '', ' type="number" min="0"') + inp('k-tc', 'Tipo de componente', c.tipo_componente, ' maxlength="120" placeholder="Ej. Cuerpo completo fresco congelado, segmento rodilla…"') + '</div>' +
      '<div class="ct-sec">Observaciones</div><div class="form-grid">' +
        '<label class="campo ancho"><span>Observaciones</span><textarea id="k-obs" maxlength="4000">' + esc(c.observaciones || '') + '</textarea></label></div>' +
      (n ? '<div class="ct-reg-info"><b>Al registrar:</b> se cierra la fase de Negociación, la fecha queda reservada en la agenda (máximo 2 eventos por fecha), se genera el enlace del cliente (vigente hasta la fecha de finalización del evento) y el convenio pasa a <b>Cotización</b>. El cliente tiene <b>3 días hábiles</b> para elegir lo que necesita y finalizar su pedido, con el programa / agenda y el listado de personas. La contratación (valor, pago y firma) la completa Administrativo.</div>'
        : '<p class="meta" style="margin:0">Valor, pago y firma del convenio los completa Administrativo en la fase de firmas.</p>'),
      '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="k-ok" type="button">' + (n ? 'Registrar' : 'Guardar cambios') + '</button>', { ancho: true });
    $('#k-fi', m.el).onchange = function () { if (!$('#k-ff', m.el).value || $('#k-ff', m.el).value < this.value) $('#k-ff', m.el).value = this.value; };
    var sugiere = function () { var cv = $('#k-conv', m.el); if (cv.dataset.tocado) return; var cl = $('#k-cli', m.el).value.trim(), cu = $('#k-cur', m.el).value.trim(); cv.value = cl || cu ? 'Convenio ' + [cl, cu].filter(Boolean).join(' · ') : ''; };
    $('#k-conv', m.el).oninput = function () { this.dataset.tocado = 1; };
    if (c.nombre_convenio) $('#k-conv', m.el).dataset.tocado = 1;
    $('#k-cli', m.el).addEventListener('input', sugiere); $('#k-cur', m.el).addEventListener('input', sugiere);
    function enviar(forzar) {
      var d = { id: n ? 0 : c.id, nombre_convenio: $('#k-conv', m.el).value, cliente: $('#k-cli', m.el).value, nit: $('#k-nit', m.el).value, contacto_nombre: $('#k-con', m.el).value, contacto_cargo: $('#k-car', m.el).value,
        contacto_correo: $('#k-cor', m.el).value, contacto_telefono: $('#k-tel', m.el).value, curso: $('#k-cur', m.el).value, especialidad: $('#k-esp', m.el).value, salas_n: $('#k-nsal', m.el).value, salas: $$('.k-sal:checked', m.el).map(function (x) { return +x.value; }),
        instructores_n: $('#k-ins', m.el).value, staff_n: $('#k-stf', m.el).value,
        fecha_inicio: $('#k-fi', m.el).value, fecha_fin: $('#k-ff', m.el).value, hora_ini: $('#k-hi', m.el).value, hora_fin: $('#k-hf', m.el).value, participantes: $('#k-par', m.el).value,
        estaciones: $('#k-est', m.el).value, componentes: $('#k-comp', m.el).value, tipo_componente: $('#k-tc', m.el).value, observaciones: $('#k-obs', m.el).value, forzar: forzar ? 1 : 0 };
      var b = $('#k-ok', m.el); b.disabled = true;
      api('contrato_guardar', d).then(function (j) { m.cerrar(); if (j.nuevo) { luego(j.id); modalRegistro(j, d); return; } toast(j.sin_cambios ? 'Sin cambios.' : 'Datos actualizados.'); luego(j.id); }, function (x) {
        b.disabled = false;
        if (x.cruce) {
          errorEn(m, x.error);
          var p = $('.form-error', m.el);
          p.insertAdjacentHTML('beforeend', ' <button type="button" class="btn btn-sm" id="k-forzar" style="margin-left:6px">Guardar de todas formas</button>');
          $('#k-forzar', m.el).onclick = function () { enviar(true); };
        } else errorEn(m, x.error);
      });
    }
    $('#k-ok', m.el).onclick = function () { enviar(false); };
  }

  function faseBarra(f) {
    var o = ['negociacion', 'cotizacion', 'administrativo', 'operacion'], k = o.indexOf(f);
    return '<ol class="fase-barra">' + o.map(function (x, i) { return '<li class="' + (i < k ? 'hecha' : i === k ? 'actual' : '') + '"><i>' + (i < k ? '✓' : i + 1) + '</i><span>' + FASE_N[x] + '</span></li>'; }).join('') + '</ol>';
  }
  function cerrarCotizacion(c, luego) {
    var m = modal('Aprobar y cerrar la cotización', '<p style="margin:0">El cliente aceptó la cotización de <b>' + esc(c.cliente) + '</b> · ' + esc(c.curso) + '. Al cerrar, el convenio pasa a <b>Administrativo</b>, que revisa lo solicitado y cotizado, recoge las firmas y cierra la negociación.</p>',
      '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-oro" id="x-ok" type="button">Aprobar y cerrar</button>');
    $('#x-ok', m.el).onclick = function () { api('cotiz_cerrar', { contrato_id: c.id }).then(function () { m.cerrar(); toast('<b>Cotización cerrada.</b> Pasa a Administrativo.'); luego(); }, function (x) { errorEn(m, x.error); }); };
  }
  function cargarListadoCT(c, luego) {
    modalImportar(null, luego, { titulo: 'Listado de personas · ' + c.codigo, intro: '<p style="margin:0 0 8px">Cargue el listado que entregó el cliente (participantes, instructores y staff). Es obligatorio: sin listado no se genera el QR y nadie ingresa.' + (c.evento_id ? ' Como el convenio ya está en la agenda, las personas nuevas pasan de una vez al listado del entrenamiento.' : ' Cuando el convenio pase a la agenda, las personas se cargan solas al entrenamiento.') + '</p>',
      enviar: function (filas, arch) { return api('contrato_listado', { contrato_id: c.id, filas: filas, archivo: arch }).then(function (j) { return 'Listado cargado: ' + j.n + ' personas' + (j.importados ? ' · ' + j.importados + ' pasaron al entrenamiento' : '') + '.'; }); } });
  }

  // Negociación cerrada: enlace y PIN para compartir con el cliente.
  function modalRegistro(j, d) {
    var link = enlaceCliente(j.token);
    var m = modal('Negociación cerrada · pasa a Cotización',
      '<p style="margin:0 0 10px">La solicitud quedó registrada, la fecha está <b>reservada en la agenda</b> y se generó el acceso del cliente.</p>' +
      '<label class="campo"><span>Enlace del cliente</span><div class="ct-link"><input readonly id="r-link" value="' + esc(link) + '"><button class="btn btn-sm" id="r-cl" type="button">Copiar</button></div></label>' +
      '<div class="ct-pin"><span>Código de acceso (PIN)</span><b class="num">' + esc(j.pin) + '</b><button class="btn btn-sm" id="r-cp" type="button">Copiar PIN</button></div>' +
      '<div class="ct-vig"><div><span>Vigente desde</span><b>' + esc(fCorta(j.acceso.desde)) + '</b></div><div><span>Pedido de cotización hasta</span><b>' + esc(fCorta(j.cotiz_limite)) + '</b></div><div><span>Enlace vence</span><b>' + esc(fCorta(j.acceso.hasta)) + '</b></div></div>' +
      '<p class="meta" style="margin:10px 0 0">Envíe el enlace y el PIN por medios distintos. El cliente tiene <b>3 días hábiles</b> (hasta el ' + esc(fLarga(j.cotiz_limite)) + ') para elegir lo que necesita, adjuntar el programa / agenda y el listado de personas, y pulsar «Finalizar pedido».</p>',
      '<button class="btn btn-oro" data-cerrar type="button">Listo</button>', { ancho: true });
    $('#r-cl', m.el).onclick = function () { copiarTxt(link, 'Enlace copiado.'); };
    $('#r-cp', m.el).onclick = function () { copiarTxt(j.pin, 'PIN copiado.'); };
  }

  // ------------------------------------------------------------ detalle del contrato
  function vContrato(id, tab) {
    var D = null;
    function cargar() { return api('contrato&id=' + id).then(function (j) { D = j; pintar(); }, function (e) { montar('<a class="miga" href="#/ct">← Solicitudes y convenios</a><div class="vacio"><strong>No se pudo abrir el convenio</strong>' + esc(e.error) + '</div>'); }); }
    function pintar() {
      var c = D.contrato, cerr = c.estado === 'Cancelado' || c.estado === 'Finalizado';
      var porRevisar = ['enviado', 'cambio_solicitado'].indexOf(c.plan_estado) >= 0;
      var tabs = [['datos', 'Convenio'], ['presupuesto', 'Presupuesto', c.ppto_estado === 'ajustes' || (c.ppto_estado === 'emitido') ? '!' : ''], ['documento', 'Convenio en Word'], ['firma', 'Firma', { por_firmar_cliente: 'cliente', por_firmar_clemi: 'CLEMI', firmado: '✓' }[c.firma_estado] || ''], ['planificacion', 'Planificación del cliente', porRevisar ? '!' : (c.plan_version ? 'v' + c.plan_version : '')], ['audiovisuales', 'Audiovisuales y marcación', D.av.length || ''], ['documentos', 'Documentos', D.archivos.length || ''], ['bitacora', 'Bitácora', D.bitacora.length]];
      var acc = '';
      if (!cerr) acc += '<button class="btn" type="button" id="c-editar">Editar datos</button>';
      acc += '<button class="btn" type="button" id="c-estado">Cambiar estado</button>';
      if (D.evento) acc += '<a class="btn" href="#/evento/' + D.evento.id + '"' + (S.yo.rol === 'comercial' ? ' hidden' : '') + '>Ver en la agenda</a>';
      if (esAdmin()) acc += '<button class="btn" type="button" id="c-borrar">Eliminar</button>';
      montar('<a class="miga" href="#/ct">← Solicitudes y convenios</a>' +
        '<section class="ev-cab ct-cab"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;position:relative">' + chipCT(c.estado) + chipPpto(c.ppto_estado) + chipPlan(c.plan_estado) + '<span class="chip" style="background:rgba(255,255,255,.1);color:#e8efe9">' + esc(c.codigo) + '</span></div>' +
          '<div class="ct-conv">' + esc(c.convenio || '') + '</div><h1 style="margin-top:2px">' + esc(c.curso) + '</h1>' +
          '<div class="ev-datos"><span><b>' + esc(c.cliente) + '</b></span><span>' + esc(c.salas_nombres || c.sala_nombre) + '</span><span class="num">' + esc(rangoCT(c)) + ' · ' + esc(c.hora_ini) + '–' + esc(c.hora_fin) + (diasPara(c.fecha_inicio) >= 0 ? ' · inicia ' + faltan(c.fecha_inicio) : '') + '</span>' +
          (c.participantes ? '<span>' + c.participantes + ' participantes</span>' : '') + (c.instructores_n ? '<span>' + c.instructores_n + ' instructores</span>' : '') + (c.staff_n ? '<span>' + c.staff_n + ' staff</span>' : '') + (c.estaciones ? '<span>' + c.estaciones + ' estaciones</span>' : '') + '</div>' +
          '<div class="acciones">' + acc + '</div></section>' +
        '<nav class="tabs">' + tabs.map(function (t) { return '<a href="#/ct/contrato/' + id + '/' + t[0] + '" class="' + (t[0] === tab ? 'is-on' : '') + '">' + t[1] + (t[2] ? '<span class="n' + (t[2] === '!' ? ' alerta' : '') + '">' + t[2] + '</span>' : '') + '</a>'; }).join('') + '</nav><div id="ct-tab"></div>');
      var b;
      if ((b = $('#c-editar'))) b.onclick = function () { formContrato(c, cargar); };
      $('#c-estado').onclick = function () {
        var m = modal('Estado del convenio', '<label class="campo"><span>Estado</span><select id="x-e">' + ['Solicitud', 'Cotización', 'Contratado', 'Finalizado', 'Cancelado'].map(function (x) { return '<option' + (x === c.estado ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>' +
          '<label class="campo"><span>Motivo u observación</span><textarea id="x-m" maxlength="1000" placeholder="Obligatorio si se cancela"></textarea></label><p class="meta" style="margin:0">Al cancelar o finalizar, el acceso del cliente se cierra automáticamente.</p>',
          '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-verde" id="x-ok" type="button">Guardar</button>');
        $('#x-ok', m.el).onclick = function () { api('contrato_estado', { contrato_id: id, estado: $('#x-e', m.el).value, motivo: $('#x-m', m.el).value }).then(function () { m.cerrar(); toast('Estado actualizado.'); cargar(); }, function (x) { errorEn(m, x.error); }); };
      };
      if ((b = $('#c-borrar'))) b.onclick = function () {
        var m = modal('Eliminar convenio', '<p style="margin:0">Se eliminará el convenio con su planificación, audiovisuales y documentos. El entrenamiento de la agenda (si existe) se conserva.</p><label class="campo"><span>Escriba BORRAR para confirmar</span><input id="x-c"></label>',
          '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-peligro" id="x-ok" type="button">Eliminar</button>');
        $('#x-ok', m.el).onclick = function () { api('contrato_borrar', { contrato_id: id, confirmar: $('#x-c', m.el).value }).then(function () { m.cerrar(); location.hash = '#/ct'; }, function (x) { errorEn(m, x.error); }); };
      };
      var cont = $('#ct-tab');
      ({ datos: tDatosCT, presupuesto: function (cc) { panelPresupuesto(cc, id, { recargar: cargar, irDocumento: function () { location.hash = '#/ct/contrato/' + id + '/documento'; } }); }, documento: function (cc) { panelDocumento(cc, id); }, firma: function (cc) { panelFirma(cc, id, cargar); }, planificacion: function (cc) { panelPlanificacion(cc, D, { ct: true, recargar: cargar }); }, audiovisuales: function (cc) { panelAV(cc, c, D.av, { sel: !cerr, estado: puedeAV(), recargar: cargar }); },
         documentos: function (cc) { panelDocsCT(cc, c, D.archivos, null, cargar); }, bitacora: tBitCT }[tab] || tDatosCT)(cont);
    }
    function tDatosCT(cont) {
      var c = D.contrato, e = D.evento;
      var difiere = e && (e.fecha !== c.fecha_inicio || e.fecha_fin !== c.fecha_fin || +e.sala_id !== +c.sala_id);
      var prog = (D.archivos || []).filter(function (a) { return a.categoria === 'Programa académico'; });
      var L = c.listado || { n: 0, roles: {} }, cz = c.cotiz || {};
      var faseHtml = c.estado !== 'Cancelado' ? faseBarra(c.fase) +
        (c.fase === 'cotizacion' ? '<div class="ct-cotiz' + (cz.vencido ? ' vencido' : '') + '">' + (cz.enviado ? '<b>El cliente finalizó su pedido.</b> ' + ({ solicitado: 'Presupuesto está preparando la cotización.', emitido: 'Cotización emitida: esperando la aceptación del cliente.', aceptado: 'El cliente aceptó: Cotizaciones debe aprobar y cerrar para pasar a Administrativo.', ajustes: 'El cliente pidió ajustes.' }[c.ppto_estado] || '')
            : cz.limite ? (cz.vencido ? '<b>Venció el plazo del cliente</b> para armar su pedido (' + esc(fLarga(cz.limite)) + ').' : '<b>Plazo del cliente para su pedido:</b> hasta el ' + esc(fLarga(cz.limite)) + ' · ' + (cz.habiles_restantes ? 'quedan ' + cz.habiles_restantes + ' día(s) hábil(es) después de hoy.' : 'hoy es el último día.')) : '<b>Cotización en curso.</b>') +
          '<span class="acciones">' + (!cz.enviado && cz.limite ? '<button class="btn btn-sm" id="g-plazo" type="button">Ampliar plazo</button>' : '') + (c.ppto_estado === 'aceptado' ? '<button class="btn btn-oro btn-sm" id="g-cerrar-cot" type="button">Aprobar y cerrar cotización</button>' : '') + '</span></div>' : '') +
        '<div class="ct-prog ' + (L.n ? 'ok' : 'falta') + '">' + (L.n ? '<b>Listado de personas:</b> ' + L.n + ' (' + (L.roles.Participante || 0) + ' participantes · ' + (L.roles.Instructor || 0) + ' instructores · ' + (L.roles.Staff || 0) + ' staff) · ' + esc(L.nombre || '') + ' <span class="meta">' + esc(L.por || '') + (L.en ? ' · ' + momento(L.en) : '') + '</span>'
          : '<b>Falta el listado de personas (obligatorio).</b> Sin listado no se genera el QR y nadie puede ingresar. El cliente lo carga en su enlace; también puede cargarlo aquí.') +
          (c.fase !== 'operacion' || !c.evento_id ? ' <button class="btn btn-sm" id="g-listado" type="button">' + (L.n ? 'Reemplazar listado' : 'Cargar listado') + '</button>' : '') + '</div>' : '';
      cont.innerHTML = faseHtml + (c.estado !== 'Cancelado' ? '<div class="ct-prog ' + (prog.length ? 'ok' : 'falta') + '">' + (prog.length ? '<b>Programa / agenda del entrenamiento:</b> ' + prog.map(function (a) { return '<a href="' + urlArchivoCT(a) + '" target="_blank" rel="noopener">' + esc(a.nombre) + '</a>'; }).join(' · ') + (prog.some(function (a) { return !+a.creado_por; }) ? ' <span class="meta">(adjuntado por el cliente)</span>' : '')
        : '<b>Falta el programa / agenda del entrenamiento (obligatorio).</b> El cliente lo adjunta en su enlace antes de enviar la solicitud; también puede adjuntarlo en «Documentos». Sin él no se puede pedir el presupuesto.') + '</div>' : '') +
        '<div class="dos-col"><div class="panel"><div class="panel-cab"><h2>Datos del convenio</h2></div><div class="datos-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
        dato('Cliente', c.cliente) + dato('NIT / documento', c.nit || '—') + dato('Contacto', (c.contacto_nombre || '—') + (c.contacto_cargo ? ' · ' + c.contacto_cargo : '')) + dato('Correo y teléfono', [c.contacto_correo, c.contacto_telefono].filter(Boolean).join(' · ') || '—') +
        dato('Curso', c.curso) + dato('Especialidad', c.especialidad || '—') + dato((c.salas || []).length > 1 ? 'Salas (' + c.salas.length + ')' : 'Sala', c.salas_nombres || c.sala_nombre) + dato('Fechas', c.fecha_inicio === c.fecha_fin ? fLarga(c.fecha_inicio) : fLarga(c.fecha_inicio) + ' al ' + fLarga(c.fecha_fin)) +
        dato('Horario', c.hora_ini + '–' + c.hora_fin) + dato('Participantes · instructores · staff', (c.participantes || 0) + ' · ' + (c.instructores_n || 0) + ' · ' + (c.staff_n || 0)) + dato('Estaciones', c.estaciones || 0) +
        dato('Componentes anatómicos', (c.componentes || 0) + (c.tipo_componente ? ' · ' + c.tipo_componente : '')) + dato('Fecha de contratación', fLarga(c.fecha_contratacion)) +
        dato('Valor', pesos(c.valor)) + dato('Pago', c.estado_pago + (c.forma_pago ? ' · ' + c.forma_pago : '')) +
        dato('Responsable', c.responsable_id ? usuario(c.responsable_id).nombre : '—') + dato('Registrado por', usuario(c.creado_por).nombre + ' · ' + momento(c.creado_en)) +
        '</div>' + (c.observaciones ? '<div class="panel-cuerpo" style="white-space:pre-line;border-top:1px solid var(--linea)">' + esc(c.observaciones) + '</div>' : '') + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:18px">' +
        '<div class="panel"><div class="panel-cab"><h2>Agenda de instrumentación</h2></div><div class="panel-cuerpo">' +
          (e ? '<p style="margin:0 0 6px"><b>' + esc(e.titulo) + '</b> · ' + chipEstado(e.estado) + '</p><p class="meta" style="margin:0">' + esc(rangoFechas(e)) + ' · Instrumentador: <b>' + esc(usuario(e.responsable_id).nombre) + '</b> · Tanatólogo: <b>' + esc(e.tanatologo_id ? usuario(e.tanatologo_id).nombre : '—') + '</b></p>' +
              (difiere ? '<p class="form-error" style="margin-top:10px;background:var(--alerta-suave);color:var(--alerta)">Las fechas o la sala del entrenamiento no coinciden con el contrato. Avise a instrumentación para ajustarlas.</p>' : '') +
              '<div class="acciones" style="margin-top:10px"><button class="btn btn-sm" id="g-desv" type="button">Desvincular</button></div>'
            : '<p class="meta" style="margin:0 0 10px">Al pasar el curso a la agenda, instrumentación lo ve en sus salas con la planificación del cliente y los audiovisuales.</p>' +
              (c.estado === 'Contratado' ? '<div class="acciones"><button class="btn btn-oro btn-sm" id="g-prog" type="button">Programar en la agenda</button><button class="btn btn-sm" id="g-vinc" type="button">Vincular a un entrenamiento existente</button></div>' : '<p class="meta" style="margin:0">Disponible cuando el convenio esté en estado «Contratado».</p>')) +
        '</div></div>' +
        '<div class="panel"><div class="panel-cab"><h2>Planificación del cliente</h2><a class="btn-link" href="#/ct/contrato/' + id + '/planificacion">Abrir</a></div><div class="panel-cuerpo">' + chipPlan(c.plan_estado) + ' ' + accesoChip(c) +
          (c.plan_version ? '<p class="meta" style="margin:8px 0 0">Versión ' + c.plan_version + ' · ' + esc(c.plan_autor) + ' · ' + momento(c.plan_en) + '<br>' + esc(c.plan_resumen) + '</p>' : '<p class="meta" style="margin:8px 0 0">El cliente aún no ha enviado su planificación.</p>') + '</div></div>' +
        '<div class="panel"><div class="panel-cab"><h2>Audiovisuales</h2><a class="btn-link" href="#/ct/contrato/' + id + '/audiovisuales">Abrir</a></div><div class="panel-cuerpo">' +
          (D.av.length ? '<p class="meta" style="margin:0"><b>' + D.av.filter(function (x) { return x.estado === 'Listo' || x.estado === 'Instalado / entregado'; }).length + '</b> de ' + D.av.length + ' elementos listos</p>' : '<p class="meta" style="margin:0">Sin audiovisuales ni marcación seleccionados.</p>') + '</div></div>' +
        '</div></div>';
      var b;
      if ((b = $('#g-prog', cont))) b.onclick = function () {
        var act = S.base.usuarios.filter(function (u) { return +u.activo; });
        var m = modal('Programar en la agenda de instrumentación',
          '<p style="margin:0">Se creará el entrenamiento <b>' + esc(c.curso) + '</b> en ' + esc(c.sala_nombre) + ', ' + esc(rangoCT(c)) + ', ' + esc(c.hora_ini) + '–' + esc(c.hora_fin) + '. ' +
          (c.plan_version ? 'La distribución inicial será la planificación del cliente (versión ' + c.plan_version + ').' : 'Como el cliente aún no ha planificado, se usa la distribución base de la sala.') + '</p>' +
          '<label class="campo"><span class="req">Instrumentador a cargo</span><select id="x-r"><option value="">Seleccione…</option>' + act.filter(function (u) { return u.rol === 'instrumentador'; }).map(function (u) { return '<option value="' + u.id + '">' + esc(u.nombre) + '</option>'; }).join('') + '</select></label>' +
          '<label class="campo"><span class="req">Tanatólogo a cargo</span><select id="x-t"><option value="">Seleccione…</option>' + act.filter(function (u) { return u.rol === 'tanatologo'; }).map(function (u) { return '<option value="' + u.id + '">' + esc(u.nombre) + '</option>'; }).join('') + '</select></label>',
          '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="x-ok" type="button">Programar</button>');
        $('#x-ok', m.el).onclick = function () { api('contrato_programar', { contrato_id: id, responsable_id: $('#x-r', m.el).value, tanatologo_id: $('#x-t', m.el).value }).then(function () { m.cerrar(); toast('<b>Programado.</b> Instrumentación ya lo ve en la agenda.'); cargar(); }, function (x) { errorEn(m, x.error); }); };
      };
      if ((b = $('#g-vinc', cont))) b.onclick = function () {
        api('eventos&desde=' + sumar(c.fecha_inicio, -15) + '&hasta=' + sumar(c.fecha_fin, 15)).then(function (j) {
          var L = j.eventos.filter(function (x) { return x.estado !== 'cancelado'; }).sort(function (a, b) { return (+b.sala_id === +c.sala_id) - (+a.sala_id === +c.sala_id); });
          var m = modal('Vincular a un entrenamiento', L.length ? '<label class="campo"><span>Entrenamiento de la agenda</span><select id="x-ev">' + L.map(function (x) { return '<option value="' + x.id + '">' + esc(fCorta(x.fecha)) + ' · ' + esc(sala(x.sala_id).nombre) + ' · ' + esc(x.titulo) + '</option>'; }).join('') + '</select></label>' : '<p>No hay entrenamientos en la agenda cerca de esas fechas.</p>',
            '<button class="btn" data-cerrar type="button">Cancelar</button>' + (L.length ? '<button class="btn btn-verde" id="x-ok" type="button">Vincular</button>' : ''));
          var ok = $('#x-ok', m.el); if (ok) ok.onclick = function () { api('contrato_vincular', { contrato_id: id, evento_id: $('#x-ev', m.el).value }).then(function () { m.cerrar(); toast('Vinculado.'); cargar(); }, function (x) { errorEn(m, x.error); }); };
        }, falla);
      };
      if ((b = $('#g-desv', cont))) b.onclick = function () { api('contrato_vincular', { contrato_id: id, evento_id: 0 }).then(function () { toast('Desvinculado de la agenda.'); cargar(); }, falla); };
      if ((b = $('#g-plazo', cont))) b.onclick = function () {
        var m = modal('Ampliar el plazo del cliente', '<p class="meta" style="margin:0 0 8px">Plazo actual: ' + esc(fLarga(c.cotiz.limite)) + '. El cliente podrá seguir eligiendo y finalizar su pedido hasta la nueva fecha.</p><label class="campo"><span class="req">Nueva fecha límite</span><input type="date" id="x-l" min="' + hoy() + '" max="' + esc(c.fecha_fin) + '"></label><label class="campo"><span>Motivo</span><input id="x-m" maxlength="300"></label>',
          '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="x-ok" type="button">Ampliar</button>');
        $('#x-ok', m.el).onclick = function () { api('cotiz_plazo', { contrato_id: id, limite: $('#x-l', m.el).value, motivo: $('#x-m', m.el).value }).then(function () { m.cerrar(); toast('Plazo ampliado.'); cargar(); }, function (x) { errorEn(m, x.error); }); };
      };
      if ((b = $('#g-cerrar-cot', cont))) b.onclick = function () { cerrarCotizacion(c, cargar); };
      if ((b = $('#g-listado', cont))) b.onclick = function () { cargarListadoCT(c, cargar); };
    }
    function tBitCT(cont) {
      cont.innerHTML = '<div class="panel">' + (D.bitacora.length ? '<ul class="timeline">' + D.bitacora.map(function (b) {
        return '<li><div class="tl-hora">' + b.momento.slice(11, 16) + '<small>' + fCorta(b.momento.slice(0, 10)) + '</small></div><div class="tl-cuerpo"><b>' + esc(b.usuario_nombre) + '</b> · ' + esc(b.accion) + (b.detalle ? '<div class="bit-det">' + esc(b.detalle) + '</div>' : '') + '</div></li>';
      }).join('') + '</ul>' : '<div class="vacio">Sin registros.</div>') + '</div>';
    }
    S.vista = { refrescar: cargar };
    cargar();
  }

  // ------------------------------------------------------------ planificación (contratación y consulta)
  // o: { ct: equipo de Operaciones, recargar }
  function panelPlanificacion(cont, D, o) {
    var c = D.contrato, a = c.acceso, cerr = c.estado === 'Cancelado' || c.estado === 'Finalizado';
    var vers = D.versiones || [], sel = vers.length ? 'v' + vers[0].version : (c.borrador ? 'b' : ''), editor = null, ajustando = false;
    var s = sala(c.sala_id);
    function itemsDe(k) { if (k === 'b') return c.borrador || []; var v = vers.find(function (x) { return 'v' + x.version === k; }); return v ? v.items : []; }
    var bloques = '';
    if (o.ct) {
      var link = c.acceso_token ? enlaceCliente(c.acceso_token) : '';
      bloques += '<div class="panel"><div class="panel-cab"><h2>Acceso del cliente</h2>' + accesoChip(c) + '</div><div class="panel-cuerpo ct-acceso">' +
        (a.vigente ? '<label class="campo"><span>Enlace único del cliente</span><div class="ct-link"><input readonly id="pa-link" value="' + esc(link) + '"><button class="btn btn-sm" id="pa-cl" type="button">Copiar</button></div></label>' +
            '<div class="ct-pin"><span>Código de acceso (PIN)</span><b class="num" id="pa-pin">' + esc(c.acceso_pin) + '</b><button class="btn btn-sm" id="pa-cp" type="button">Copiar PIN</button></div>' +
            '<div class="ct-vig"><div><span>Vigente desde</span><b>' + esc(fCorta(a.desde)) + '</b></div><div><span>Cambios a la sala hasta</span><b>' + esc(fCorta(a.cambios_hasta)) + '</b></div><div><span>Vence (fin del evento)</span><b>' + esc(fCorta(a.hasta)) + '</b></div></div>' +
            '<p class="meta" style="margin:0">' + (c.acceso_ultimo ? 'Último ingreso del cliente: <b>' + momento(c.acceso_ultimo) + '</b>' : 'El cliente aún no ha ingresado.') + ' Envíe el enlace y el PIN por canales distintos (por ejemplo, el enlace por correo y el PIN por WhatsApp).</p>' +
            '<div class="acciones"><a class="btn btn-sm" id="pa-mail" href="#">Redactar correo con el enlace</a><a class="btn btn-sm" id="pa-wa" href="#" target="_blank" rel="noopener">Enviar PIN por WhatsApp</a><button class="btn btn-sm btn-peligro" id="pa-anular" type="button">Cerrar acceso</button><button class="btn btn-sm" id="pa-regen" type="button">Generar enlace nuevo</button></div>'
          : '<p style="margin:0 0 10px">' + ({ sin_acceso: 'Cree el enlace único para que el cliente organice la sala a su gusto. Queda vigente hasta la fecha de finalización del evento; los cambios a la sala se permiten hasta 3 días antes del inicio, con aprobación.', anulado: 'El acceso está cerrado. ' + esc(c.acceso_anulado_motivo || ''), vencido: 'El acceso venció.', cerrado: 'El convenio no está activo.', no_iniciado: 'El acceso estará vigente desde la fecha de contratación.' }[a.motivo] || '') + '</p>' +
            (!cerr && hoy() < c.fecha_inicio ? '<button class="btn btn-oro" id="pa-crear" type="button">' + (c.acceso_creado_en ? 'Generar enlace nuevo' : 'Crear acceso para el cliente') + '</button>' : '')) +
        '</div></div>';
    }
    // estado y decisiones
    var dec = '';
    if (o.ct && !cerr) {
      if (c.plan_estado === 'enviado') dec = '<button class="btn btn-verde btn-sm" data-dec="aprobar" type="button">Aprobar planificación</button><button class="btn btn-sm" data-dec="devolver" type="button">Devolver al cliente para ajuste</button>';
      else if (c.plan_estado === 'cambio_solicitado') dec = '<button class="btn btn-verde btn-sm" data-dec="autorizar" type="button">Autorizar el cambio</button><button class="btn btn-sm btn-peligro" data-dec="rechazar" type="button">No autorizar</button>';
      else if (c.plan_estado === 'aprobado') dec = '<button class="btn btn-sm" data-dec="devolver" type="button">Reabrir para el cliente</button>';
      else if (c.plan_estado === 'abierto' && c.plan_version) dec = '<button class="btn btn-verde btn-sm" data-dec="aprobar" type="button">Aprobar la versión ' + c.plan_version + '</button>';
    }
    var rev = c.revision_ins_resultado ? '<div class="ct-rev ' + (c.revision_ins_resultado === 'Sin ajustes' ? 'ok' : 'aj') + '"><b>Instrumentación · ' + esc(c.revision_ins_resultado) + '</b> (versión ' + c.revision_ins_version + ')<span class="meta">' + esc(usuario(c.revision_ins_por).nombre) + ' · ' + momento(c.revision_ins_en) + '</span>' + (c.revision_ins ? '<p>' + esc(c.revision_ins) + '</p>' : '') + (c.revision_ins_version < c.plan_version ? '<span class="meta">Hay una versión más reciente sin revisar.</span>' : '') + '</div>' : (c.plan_version ? '<p class="meta" style="margin:0">Instrumentación aún no ha revisado la planificación.</p>' : '');
    var solicitud = c.plan_estado === 'cambio_solicitado' ? '<div class="ct-rev aj"><b>El cliente solicitó un cambio</b><span class="meta">' + esc(c.cambio_por || '') + ' · ' + momento(c.cambio_en) + '</span><p>' + esc(c.cambio_motivo || '') + '</p></div>' : '';
    bloques += '<div class="panel"><div class="panel-cab"><h2>Estado de la planificación</h2>' + chipPlan(c.plan_estado) + '</div><div class="panel-cuerpo" style="display:flex;flex-direction:column;gap:12px">' +
      (c.plan_version ? '<p style="margin:0">Versión vigente: <b>' + c.plan_version + '</b> · ' + esc(c.plan_autor) + ' · ' + momento(c.plan_en) + '<br><span class="meta">' + esc(c.plan_resumen) + '</span></p>' : '<p class="meta" style="margin:0">Aún no hay planificación enviada.</p>') +
      solicitud + rev + (dec ? '<div class="acciones">' + dec + '</div>' : '') +
      (D.evento ? '<p class="meta" style="margin:0">Vinculada al entrenamiento <b>' + esc(D.evento.titulo) + '</b> (' + esc(rangoFechas(D.evento)) + ').</p>' : '') + '</div></div>';
    var opts = vers.map(function (v) { return '<option value="v' + v.version + '">Versión ' + v.version + ' · ' + esc(v.autor_tipo === 'clemi' ? 'Ajuste CLEMI' : 'Cliente') + ' · ' + momento(v.creado_en) + '</option>'; }).join('') + (o.ct && c.borrador ? '<option value="b">Borrador del cliente sin enviar' + (c.plan_borrador_en ? ' · ' + momento(c.plan_borrador_en) : '') + '</option>' : '');
    cont.innerHTML = '<div class="dos-col">' + bloques + '</div>' +
      '<div class="panel" style="margin-top:18px"><div class="panel-cab"><h2>Sala planificada · ' + esc(s.nombre) + '</h2><div class="acciones">' + (opts ? '<select id="pl-ver" style="max-width:360px">' + opts + '</select>' : '') +
        (o.ct && !cerr ? '<button class="btn btn-sm" id="pl-aj" type="button">Ajustar planificación (CLEMI)</button>' : '') + '</div></div>' +
        '<div class="panel-cuerpo"><div id="pl-autor" class="meta" style="margin-bottom:8px"></div><div id="pl-ed"></div><div class="editor-pie" id="pl-pie" hidden><span class="meta">El ajuste queda como una versión nueva a nombre de CLEMI y el cliente lo ve en su enlace.</span><div class="acciones"><button class="btn" id="pl-cancel" type="button">Cancelar</button><button class="btn btn-oro" id="pl-save" type="button">Guardar como versión nueva</button></div></div></div></div>' +
      '<div class="panel" style="margin-top:18px"><div class="panel-cab"><h2>Revisión y mensajes</h2></div>' +
        (S.yo.rol !== 'tanatologo' ? '<div class="panel-cuerpo ct-nota"><textarea id="pn-t" maxlength="2000" placeholder="' + (o.ct ? 'Observación interna o mensaje para el cliente…' : 'Observación para Operaciones e instrumentación…') + '"></textarea><div class="acciones">' + (o.ct ? '<label class="check"><input type="checkbox" id="pn-v">Mostrar al cliente en su enlace</label>' : '') + '<button class="btn btn-verde btn-sm" id="pn-ok" type="button">Registrar</button></div></div>' : '') +
        (D.notas.length ? '<ul class="timeline">' + D.notas.map(function (n) {
          return '<li><div class="tl-hora">' + n.creado_en.slice(11, 16) + '<small>' + fCorta(n.creado_en.slice(0, 10)) + '</small></div><div class="tl-cuerpo"><b>' + esc(n.tipo) + '</b>' + (n.version ? ' <span class="meta">· versión ' + n.version + '</span>' : '') + (+n.visible_cliente ? ' <span class="chip chip-cli">visible al cliente</span>' : '') +
            '<div class="meta">' + esc(n.autor_nombre) + (n.area ? ' · ' + esc(n.area) : '') + '</div>' + (n.texto ? '<p>' + esc(n.texto) + '</p>' : '') + '</div></li>';
        }).join('') + '</ul>' : '<div class="vacio">Sin observaciones todavía.</div>') + '</div>';
    function verVersion() {
      var k = $('#pl-ver', cont) ? $('#pl-ver', cont).value : '';
      var v = vers.find(function (x) { return 'v' + x.version === k; });
      $('#pl-autor', cont).innerHTML = k === 'b' ? 'Borrador que el cliente está armando (aún no lo envía) · ' + esc(c.plan_borrador_por || '') : v ? (v.autor_tipo === 'clemi' ? 'Ajuste de ' : 'Planificada por ') + '<b>' + esc(v.autor_nombre) + '</b> · ' + momento(v.creado_en) + (v.notas ? ' · «' + esc(v.notas) + '»' : '') : 'Sin planificación. ' + (o.ct ? 'Puede armar una propuesta con «Ajustar planificación».' : '');
      editor = new Plano.Editor($('#pl-ed', cont), { sala: s, plano: s.plano, items: itemsDe(k), catalogo: S.base.catalogo, modo: 'items', editable: false });
    }
    verVersion();
    var x;
    if ((x = $('#pl-ver', cont))) x.onchange = verVersion;
    if ((x = $('#pl-aj', cont))) x.onclick = function () {
      ajustando = true; this.hidden = true; if ($('#pl-ver', cont)) $('#pl-ver', cont).disabled = true;
      var base = itemsDe($('#pl-ver', cont) ? $('#pl-ver', cont).value : '');
      if (!base.length && s.base.length) base = s.base.map(function (it) { return Object.assign({}, it, { id: 'i' + Math.random().toString(36).slice(2, 9) }); });
      editor = new Plano.Editor($('#pl-ed', cont), { sala: s, plano: s.plano, items: base, catalogo: S.base.catalogo, modo: 'items', editable: true, onChange: function () { S.dirty = true; } });
      $('#pl-pie', cont).hidden = false; $('#pl-autor', cont).innerHTML = '<b>Ajustando</b> a partir de la versión seleccionada.';
    };
    if ((x = $('#pl-cancel', cont))) x.onclick = function () { S.dirty = false; o.recargar(); };
    if ((x = $('#pl-save', cont))) x.onclick = function () {
      var it = editor.valor();
      var m = modal('Guardar ajuste de CLEMI', '<p style="margin:0">Se guardará la versión ' + ((vers[0] ? +vers[0].version : 0) + 1) + ' con ' + it.length + ' elementos, a nombre de <b>' + esc(S.yo.nombre) + ' · CLEMI</b>. El cliente la verá en su enlace.</p><label class="campo"><span>Nota para el cliente</span><textarea id="x-n" maxlength="2000" placeholder="Ej. Movimos la torre de video para dejar paso libre hacia la puerta"></textarea></label>',
        '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-oro" id="x-ok" type="button">Guardar versión</button>');
      $('#x-ok', m.el).onclick = function () { api('plan_guardar', { contrato_id: c.id, items: it, notas: $('#x-n', m.el).value }).then(function (j) { S.dirty = false; m.cerrar(); toast('Versión ' + j.version + ' guardada.'); o.recargar(); }, function (e) { errorEn(m, e.error); }); };
    };
    $$('[data-dec]', cont).forEach(function (b) {
      b.onclick = function () {
        var d = b.getAttribute('data-dec');
        var T = { aprobar: ['Aprobar planificación', 'Mensaje para el cliente (opcional)', 'Aprobar', false], devolver: ['Devolver al cliente para ajuste', '¿Qué debe ajustar el cliente?', 'Devolver al cliente', true], autorizar: ['Autorizar el cambio', 'Mensaje para el cliente (opcional)', 'Autorizar', false], rechazar: ['No autorizar el cambio', 'Motivo (lo verá el cliente)', 'No autorizar', true] }[d];
        var m = modal(T[0], '<label class="campo"><span' + (T[3] ? ' class="req"' : '') + '>' + T[1] + '</span><textarea id="x-t" maxlength="2000"></textarea></label>' +
          (d === 'devolver' || d === 'autorizar' ? '<p class="meta" style="margin:0">El cliente podrá modificar la sala en su enlace hasta el ' + esc(fLarga(a.cambios_hasta)) + ' y deberá enviarla de nuevo.</p>' : ''),
          '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-verde" id="x-ok" type="button">' + T[2] + '</button>');
        $('#x-ok', m.el).onclick = function () { api('plan_decidir', { contrato_id: c.id, decision: d, texto: $('#x-t', m.el).value }).then(function () { m.cerrar(); toast('Registrado. El cliente lo verá en su enlace.'); o.recargar(); }, function (e) { errorEn(m, e.error); }); };
      };
    });
    if ((x = $('#pn-ok', cont))) x.onclick = function () {
      api('plan_nota', { contrato_id: c.id, texto: $('#pn-t', cont).value, visible_cliente: $('#pn-v', cont) && $('#pn-v', cont).checked ? 1 : 0 }).then(function () { toast('Registrado.'); o.recargar(); }, falla);
    };
    if (!o.ct) return;
    var crear = function () { api('acceso_generar', { contrato_id: c.id }).then(function (j) { toast('<b>Acceso creado.</b> Copie el enlace y el PIN para enviarlos al cliente.'); o.recargar(); }, falla); };
    if ((x = $('#pa-crear', cont))) x.onclick = crear;
    if ((x = $('#pa-regen', cont))) x.onclick = function () {
      var m = modal('Generar enlace nuevo', '<p style="margin:0">El enlace y el PIN actuales dejarán de funcionar y se generarán unos nuevos. Úselo si el enlace se compartió con quien no debía.</p>', '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="x-ok" type="button">Generar</button>');
      $('#x-ok', m.el).onclick = function () { m.cerrar(); crear(); };
    };
    if ((x = $('#pa-cl', cont))) x.onclick = function () { copiarTxt($('#pa-link', cont).value, 'Enlace copiado.'); };
    if ((x = $('#pa-cp', cont))) x.onclick = function () { copiarTxt(c.acceso_pin, 'PIN copiado.'); };
    if ((x = $('#pa-mail', cont))) {
      var cuerpo = 'Hola ' + (c.contacto_nombre || '') + ',\n\nPara el curso «' + c.curso + '» (' + rangoCT(c) + ', ' + s.nombre + ') puede organizar la sala a su gusto en este enlace:\n\n' + link +
        '\n\nEl código de acceso se lo enviamos por otro medio. Puede armar la sala y enviarla hasta el ' + fLarga(a.cambios_hasta) + '. Después de enviarla, cualquier cambio se solicita en el mismo enlace y lo aprobamos desde CLEMI. El enlace estará disponible hasta el ' + fLarga(a.hasta) + '.\n\nCordialmente,\n' + S.yo.nombre + '\nCLEMI';
      x.href = 'mailto:' + encodeURIComponent(c.contacto_correo || '') + '?subject=' + encodeURIComponent('Planificación de su sala · ' + c.curso) + '&body=' + encodeURIComponent(cuerpo);
    }
    if ((x = $('#pa-wa', cont))) {
      var tel = String(c.contacto_telefono || '').replace(/\D/g, ''); if (tel.length === 10) tel = '57' + tel;
      x.href = 'https://wa.me/' + tel + '?text=' + encodeURIComponent('CLEMI · Su código de acceso para planificar la sala del curso «' + c.curso + '» es: ' + c.acceso_pin);
    }
    if ((x = $('#pa-anular', cont))) x.onclick = function () {
      var m = modal('Cerrar el acceso del cliente', '<label class="campo"><span class="req">Motivo</span><textarea id="x-m" maxlength="500"></textarea></label><p class="meta" style="margin:0">El enlace deja de funcionar de inmediato. Puede generar uno nuevo mientras falte más de un día para el inicio.</p>',
        '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-peligro" id="x-ok" type="button">Cerrar acceso</button>');
      $('#x-ok', m.el).onclick = function () { api('acceso_anular', { contrato_id: c.id, motivo: $('#x-m', m.el).value }).then(function () { m.cerrar(); toast('Acceso cerrado.'); o.recargar(); }, function (e) { errorEn(m, e.error); }); };
    };
  }

  // ------------------------------------------------------------ audiovisuales de un curso
  // o: { sel: puede agregar/quitar, estado: puede cambiar el estado, recargar, compacto }
  // ---- Flyer y reel: datos obligatorios que pide el cliente (o CLEMI) en la cotización
  var BRIEF_ETQ = { titulo: 'Nombre del evento o curso', fechas: 'Fechas', horario: 'Horario', lugar: 'Lugar', instructores: 'Instructores', agenda: 'Temas o agenda', dirigido: 'Dirigido a', inscripciones: 'Inscripciones', organiza: 'Organiza / aliados', valor: 'Valor o cupos',
    observaciones: 'Indicaciones adicionales', duracion: 'Duración del reel', enfoque: 'Mensaje o enfoque', publicacion: 'Fecha de publicación', formato: 'Formatos', entrega: 'Fecha de entrega del flyer' };
  function briefDe(x) { if (!x) return null; if (typeof x === 'string') { try { return JSON.parse(x); } catch (e) { return null; } } return x; }
  function briefBtn(x, attr) { var d = briefDe(x); return d ? '<button type="button" class="btn-link brief-ver" ' + attr + '>📝 Datos del ' + (d._tipo === 'reel' ? 'reel' : 'flyer') + '</button>' : ''; }
  function verBrief(x, titulo) {
    var d = briefDe(x); if (!d) return;
    var m = modal((d._tipo === 'reel' ? 'Datos del reel' : 'Datos del flyer') + (titulo ? ' · ' + titulo : ''), '<dl class="ag-det brief-dl">' + Object.keys(BRIEF_ETQ).filter(function (k) { return d[k]; }).map(function (k) { return '<dt>' + esc(BRIEF_ETQ[k]) + '</dt><dd style="white-space:pre-line">' + esc(d[k]) + '</dd>'; }).join('') + '</dl>',
      '<button class="btn" type="button" id="x-cp">Copiar texto</button><button class="btn btn-oro" data-cerrar type="button">Cerrar</button>');
    var b = $('#x-cp', m.el); if (b) b.onclick = function () { copiarTxt(Object.keys(BRIEF_ETQ).filter(function (k) { return d[k]; }).map(function (k) { return BRIEF_ETQ[k] + ': ' + d[k]; }).join('\n'), 'Datos copiados.'); };
  }
  function briefModalApp(tipo, campos, pre) {
    return new Promise(function (ok, mal) {
      var listo = false, largo = ['instructores', 'agenda', 'observaciones', 'enfoque'], v = pre || {};
      var m = modal('Datos para el ' + (tipo === 'reel' ? 'reel promocional' : 'flyer') + ' del evento', '<p class="meta" style="margin:0 0 10px">Datos obligatorios para que Audiovisuales cree el ' + (tipo === 'reel' ? 'reel' : 'flyer') + '.</p><div class="form-grid">' +
        (campos || []).map(function (c) { var val = esc(v[c[0]] || ''); return '<label class="campo' + (largo.indexOf(c[0]) >= 0 ? ' ancho' : '') + '"><span' + (c[2] ? ' class="req"' : '') + '>' + esc(c[1]) + '</span>' + (largo.indexOf(c[0]) >= 0 ? '<textarea data-bf="' + c[0] + '" rows="3">' + val + '</textarea>' : '<input data-bf="' + c[0] + '" value="' + val + '">') + (c[3] ? '<small>' + esc(c[3]) + '</small>' : '') + '</label>'; }).join('') + '</div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="x-ok" type="button">Guardar datos</button>', { ancho: true, alCerrar: function () { if (!listo) mal({ error: 'Para agregarlo, diligencie los datos del ' + (tipo === 'reel' ? 'reel' : 'flyer') + '.' }); } });
      $('#x-ok', m.el).onclick = function () {
        var d = {}, falta = []; $$('[data-bf]', m.el).forEach(function (x) { d[x.getAttribute('data-bf')] = x.value.trim(); });
        (campos || []).forEach(function (c) { if (c[2] && !d[c[0]]) falta.push(c[1]); });
        if (falta.length) return errorEn(m, 'Faltan datos obligatorios: ' + falta.join(', ') + '.');
        listo = true; m.cerrar(); ok(d);
      };
    });
  }
  function panelAV(host, c, lista, o) {
    var grupos = [], idx = {};
    lista.forEach(function (x) { if (!idx[x.categoria]) { idx[x.categoria] = []; grupos.push(x.categoria); } idx[x.categoria].push(x); });
    var listos = lista.filter(function (x) { return x.estado === 'Listo' || x.estado === 'Instalado / entregado'; }).length;
    host.innerHTML = '<div class="panel"><div class="panel-cab"><h2>' + esc(o.titulo || 'Audiovisuales, certificaciones y marcación') + '</h2><div class="acciones">' + (lista.length ? '<span class="meta"><b>' + listos + '</b> de ' + lista.length + ' listos</span>' : '') +
      (o.sel ? '<button class="btn btn-verde btn-sm" data-av-add type="button">+ Agregar</button>' : '') + '</div></div>' +
      (lista.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Elemento</th><th class="num">Cant.</th><th>Opción y detalle</th><th>Estado</th>' + (o.sel ? '<th></th>' : '') + '</tr></thead><tbody>' +
        grupos.map(function (g) {
          return '<tr class="av-grupo"><td colspan="' + (o.sel ? 5 : 4) + '">' + esc(g) + '</td></tr>' + idx[g].map(function (x) {
            return '<tr><td><b>' + esc(x.item_nombre) + '</b></td><td class="num">' + x.cantidad + '</td><td>' + (x.opcion ? '<span class="chip chip-op">' + esc(x.opcion) + '</span> ' : '') + briefBtn(x.datos, 'data-av-br="' + x.id + '"') + (x.detalle ? '<span class="meta">' + esc(x.detalle) + '</span>' : (x.opcion || x.datos ? '' : '<span class="meta">—</span>')) + '</td>' +
              '<td>' + (o.estado ? '<select data-av-est="' + x.id + '" class="av-est">' + AV_ESTADOS.map(function (e) { return '<option' + (e === x.estado ? ' selected' : '') + '>' + e + '</option>'; }).join('') + '</select>' : chipAV(x.estado)) +
              (x.estado_en ? '<div class="meta">' + esc(usuario(x.estado_por).nombre.split(' ')[0]) + ' · ' + momento(x.estado_en) + '</div>' : '') + '</td>' +
              (o.sel ? '<td style="white-space:nowrap"><button class="btn btn-sm" data-av-ed="' + x.id + '" type="button">Editar</button> <button class="btn btn-sm btn-peligro" data-av-q="' + x.id + '" type="button" aria-label="Quitar">×</button></td>' : '') + '</tr>';
          }).join('');
        }).join('') + '</tbody></table></div>' : '<div class="vacio"><strong>Sin audiovisuales</strong>' + (o.sel ? 'Agregue equipos, certificaciones, marcación y material impreso del inventario de Audiovisuales.' : 'Este curso no tiene audiovisuales ni marcación seleccionados.') + '</div>') + '</div>';
    var b = $('[data-av-add]', host); if (b) b.onclick = function () { modalAVItem(c, null, o.recargar); };
    $$('[data-av-br]', host).forEach(function (x) { x.onclick = function () { var y = lista.find(function (z) { return +z.id === +x.getAttribute('data-av-br'); }); verBrief(y.datos, c.curso); }; });
    $$('[data-av-ed]', host).forEach(function (b) { b.onclick = function () { modalAVItem(c, lista.find(function (x) { return +x.id === +b.getAttribute('data-av-ed'); }), o.recargar); }; });
    $$('[data-av-q]', host).forEach(function (b) { b.onclick = function () { var x = lista.find(function (y) { return +y.id === +b.getAttribute('data-av-q'); }); if (!confirm('¿Quitar «' + x.item_nombre + '» de este curso?')) return; api('contrato_av_quitar', { id: x.id }).then(function () { toast('Quitado.'); o.recargar(); }, falla); }; });
    $$('[data-av-est]', host).forEach(function (s) { s.onchange = function () { api('av_estado', { id: s.getAttribute('data-av-est'), estado: s.value }).then(function () { toast('Estado actualizado.'); o.recargar(); }, function (e) { falla(e); o.recargar(); }); }; });
  }
  function modalAVItem(c, linea, luego) {
    api('av_catalogo&desde=' + c.fecha_inicio + '&hasta=' + c.fecha_fin).then(function (k) {
      var items = k.items.filter(function (i) { return +i.activo || (linea && +linea.item_id === +i.id); });
      var disp = function (i) { if (i.stock == null) return null; return (i.disponible || 0) + (linea && +linea.item_id === +i.id ? +linea.cantidad : 0); };
      var m = modal(linea ? 'Editar elemento' : 'Agregar audiovisuales al curso',
        '<label class="campo"><span class="req">Elemento</span><select id="x-i"><option value="">Seleccione…</option>' + k.categorias.map(function (g) {
          var its = items.filter(function (i) { return i.categoria === g; }); if (!its.length) return '';
          return '<optgroup label="' + esc(g) + '">' + its.map(function (i) { var d = disp(i); return '<option value="' + i.id + '"' + (linea && +linea.item_id === +i.id ? ' selected' : '') + '>' + esc(i.nombre) + (d == null ? '' : ' · ' + d + ' disponibles en esas fechas') + '</option>'; }).join('') + '</optgroup>';
        }).join('') + '</select><small id="x-desc"></small></label>' +
        '<div class="form-grid"><label class="campo"><span class="req">Cantidad</span><input id="x-c" type="number" min="1" value="' + (linea ? linea.cantidad : (c.participantes || 1)) + '"></label><label class="campo" id="x-ow"><span class="req">Opción</span><select id="x-o"></select></label></div>' +
        '<label class="campo"><span>Detalle</span><input id="x-d" maxlength="1000" value="' + esc(linea ? linea.detalle : '') + '" placeholder="Ej. Logo del cliente en las 6 estaciones, a color"></label>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar</button>');
      function opciones() {
        var it = items.find(function (i) { return +i.id === +$('#x-i', m.el).value; });
        var ops = it ? it.opciones : [];
        $('#x-ow', m.el).hidden = !ops.length;
        $('#x-o', m.el).innerHTML = ops.map(function (o) { return '<option' + (linea && linea.opcion === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
        var d = it ? disp(it) : null;
        $('#x-desc', m.el).textContent = it ? [it.descripcion, it.stock == null ? 'Por pedido' : it.stock + ' en inventario · ' + d + ' disponibles del ' + fCorta(c.fecha_inicio) + ' al ' + fCorta(c.fecha_fin), 'Unidad: ' + it.unidad].filter(Boolean).join(' · ') : '';
      }
      $('#x-i', m.el).onchange = opciones; opciones();
      function enviar(forzar) {
        api('contrato_av_guardar', { contrato_id: c.id, id: linea ? linea.id : 0, item_id: $('#x-i', m.el).value, cantidad: $('#x-c', m.el).value, opcion: $('#x-o', m.el).value, detalle: $('#x-d', m.el).value, forzar: forzar ? 1 : 0 }).then(function () { m.cerrar(); toast('Guardado.'); luego(); }, function (e) {
          errorEn(m, e.error);
          if (e.sin_stock) { $('.form-error', m.el).insertAdjacentHTML('beforeend', ' <button type="button" class="btn btn-sm" id="x-fz" style="margin-left:6px">Agregar de todas formas</button>'); $('#x-fz', m.el).onclick = function () { enviar(true); }; }
        });
      }
      $('#x-ok', m.el).onclick = function () { enviar(false); };
    }, falla);
  }

  // ------------------------------------------------------------ documentos del contrato
  function panelDocsCT(host, c, archivos, cats, recargar) {
    var CATS = cats || ['Contrato', 'Orden de compra', 'Soporte de pago', 'Arte para marcación', 'Programa académico', 'Otro'];
    var cerr = c.estado === 'Cancelado';
    host.innerHTML = '<div class="panel"><div class="panel-cab"><h2>' + (cats ? 'Arte y programas' : 'Documentos del convenio') + '</h2></div>' +
      (!cerr ? '<div class="panel-cuerpo ct-subir"><select id="d-cat">' + CATS.map(function (x) { return '<option value="' + x + '">' + (x === 'Programa académico' ? 'Programa / agenda del entrenamiento' : x) + '</option>'; }).join('') + '</select><input id="d-desc" maxlength="500" placeholder="Descripción (opcional)"><label class="subir"><input type="file" id="d-f" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.gif,.ai,.eps,.svg,.psd,.zip,.txt,.csv">Adjuntar archivo</label><span class="meta" id="d-prog"></span></div>' : '') +
      (archivos.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Archivo</th><th>Tipo</th><th>Subido por</th><th></th></tr></thead><tbody>' + archivos.map(function (a) {
        return '<tr><td><a href="' + urlArchivoCT(a) + '" target="_blank" rel="noopener"><b>' + esc(a.nombre) + '</b></a><br><span class="meta">' + pesoTxt(a.tamano) + (a.descripcion ? ' · ' + esc(a.descripcion) : '') + '</span></td><td>' + esc(a.categoria === 'Programa académico' ? 'Programa / agenda del entrenamiento' : a.categoria) + '</td><td>' + (+a.creado_por ? esc(usuario(a.creado_por).nombre) : 'El cliente') + '<br><span class="meta">' + momento(a.creado_en) + '</span></td>' +
          '<td style="white-space:nowrap"><a class="btn btn-sm" href="' + urlArchivoCT(a, true) + '">Descargar</a>' + (esAdmin() || +a.creado_por === +S.yo.id ? ' <button class="btn btn-sm btn-peligro" data-del="' + a.id + '" type="button" aria-label="Eliminar">×</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="vacio">' + (cats ? 'Sin arte ni programas adjuntos.' : 'Sin documentos. Adjunte el convenio firmado, la orden de compra, el arte para la marcación o el programa.') + '</div>') + '</div>';
    var f = $('#d-f', host);
    if (f) f.onchange = function () {
      if (!f.files[0]) return;
      var fd = new FormData(); fd.append('contrato_id', c.id); fd.append('categoria', $('#d-cat', host).value); fd.append('descripcion', $('#d-desc', host).value); fd.append('archivo', f.files[0]);
      subirCT(fd, function (p) { $('#d-prog', host).textContent = 'Subiendo ' + Math.round(p * 100) + '%'; }).then(function () { toast('Archivo adjuntado.'); recargar(); }, function (e) { $('#d-prog', host).textContent = ''; falla(e); });
    };
    $$('[data-del]', host).forEach(function (b) { b.onclick = function () { if (!confirm('¿Eliminar este archivo?')) return; api('contrato_archivo_borrar', { id: b.getAttribute('data-del') }).then(function () { toast('Archivo eliminado.'); recargar(); }, falla); }; });
  }

  // ------------------------------------------------------------ planes de clientes (instrumentación, morgue, audiovisuales)
  function vPlanes() {
    var datos = null, todos = false;
    function cargar() { return api('planes' + (todos ? '&todos=1' : '')).then(function (j) { datos = j.planes; pintar(); }, falla); }
    function pintar() {
      var L = datos.slice().sort(function (a, b) { return a.fecha_inicio > b.fecha_inicio ? 1 : -1; });
      $('#pp-lista').innerHTML = L.length ? '<div class="tabla-wrap"><table class="tabla tabla-click"><thead><tr><th>Cliente y curso</th><th>Sala y fechas</th><th>Planificación</th><th>Revisión de instrumentación</th><th>Audiovisuales</th><th>Agenda</th></tr></thead><tbody>' +
        L.map(function (c) {
          return '<tr data-id="' + c.id + '"><td><b>' + esc(c.cliente) + '</b><br><span class="meta">' + esc(c.curso) + '</span></td><td style="white-space:nowrap">' + esc(c.sala_nombre) + '<br><span class="meta">' + esc(rangoCT(c)) + ' · ' + faltan(c.fecha_inicio) + '</span></td>' +
            '<td>' + chipPlan(c.plan_estado) + (c.plan_version ? '<br><span class="meta">v' + c.plan_version + ' · ' + esc(c.plan_autor) + '</span>' : '') + '</td>' +
            '<td>' + (c.revision_ins_resultado ? '<span class="chip ' + (c.revision_ins_resultado === 'Sin ajustes' ? 'pe-aprobado' : 'pe-cambio') + '">' + esc(c.revision_ins_resultado) + '</span>' + (+c.revision_ins_version < +c.plan_version ? '<br><span class="meta">hay versión nueva</span>' : '') : (c.plan_version ? '<span class="chip pe-enviado">Por revisar</span>' : '<span class="meta">—</span>')) + '</td>' +
            '<td>' + (c.av_n ? '<b>' + c.av_listos + '</b>/' + c.av_n + ' listos' : '<span class="meta">—</span>') + '</td><td>' + (c.evento_id ? '<span class="chip st-programado">En la agenda</span>' : '<span class="meta">Sin programar</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="vacio"><strong>No hay planificaciones</strong>Aquí aparecen los cursos contratados con la sala que arma cada cliente.</div>';
      $$('#pp-lista tr[data-id]').forEach(function (tr) { tr.onclick = function () { location.hash = '#/plan/' + tr.getAttribute('data-id'); }; });
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">1 · Negociación del evento</div><h1>Planificación del cliente</h1><p>Cómo organizó cada cliente su sala. La planificación se crea y se habilita en la negociación del evento: en cada solicitud, el panel «Acceso del cliente» genera el enlace y el código para que el cliente arme su sala. ' + (S.yo.rol === 'instrumentador' || esAdmin() ? 'Instrumentación la revisa y registra si requiere ajustes; Negociación los acuerda con el cliente.' : (puedeCT() ? '' : 'Solo consulta.')) + '</p></div>' +
      '<label class="check"><input type="checkbox" id="pp-todos">Incluir cursos pasados</label></div><div class="panel"><div id="pp-lista"><div class="vacio">Cargando…</div></div></div>');
    $('#pp-todos').onchange = function () { todos = this.checked; cargar(); };
    S.vista = { refrescar: cargar };
    cargar();
  }
  function vPlan(p) {
    var id = +p[0], D = null;
    function cargar() { return api('plan&id=' + id).then(function (j) { D = j; pintar(); }, function (e) { montar('<a class="miga" href="#/planes">← Planificaciones</a><div class="vacio"><strong>No se pudo abrir</strong>' + esc(e.error) + '</div>'); }); }
    function pintar() {
      var c = D.contrato, e = D.evento, puedeRev = (S.yo.rol === 'instrumentador' || esAdmin()) && c.plan_version;
      var evAbierto = e && (e.estado === 'programado' || e.estado === 'en_curso') && (S.yo.rol === 'instrumentador' || esAdmin());
      montar('<a class="miga" href="#/planes">← Planificaciones</a>' +
        '<section class="ev-cab"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;position:relative">' + chipPlan(c.plan_estado) + (c.plan_version ? '<span class="chip" style="background:rgba(255,255,255,.1);color:#e8efe9">Versión ' + c.plan_version + '</span>' : '') + '</div>' +
          '<h1 style="margin-top:8px">' + esc(c.curso) + '</h1><div class="ev-datos"><span><b>' + esc(c.cliente) + '</b></span><span>' + esc(c.sala_nombre) + '</span><span class="num">' + esc(rangoCT(c)) + ' · ' + esc(c.hora_ini) + '–' + esc(c.hora_fin) + '</span>' +
          (c.participantes ? '<span>' + c.participantes + ' participantes</span>' : '') + (c.estaciones ? '<span>' + c.estaciones + ' estaciones</span>' : '') + (c.contacto_nombre ? '<span>Contacto: ' + esc(c.contacto_nombre) + '</span>' : '') + '</div>' +
          '<div class="acciones">' + (puedeCT() ? '<a class="btn" href="#/ct/contrato/' + c.id + '/planificacion">Abrir en Operaciones</a>' : '') + (e && S.yo.rol !== 'audiovisual' && S.yo.rol !== 'comercial' ? '<a class="btn" href="#/evento/' + e.id + '/sala">Ver entrenamiento</a>' : '') +
          (evAbierto && c.plan_version ? '<button class="btn btn-oro" id="pv-usar" type="button">Usar en la distribución del entrenamiento</button>' : '') + '</div></section>' +
        (puedeRev ? '<div class="panel" style="margin-bottom:18px"><div class="panel-cab"><h2>Revisión de instrumentación · versión ' + c.plan_version + '</h2>' + (c.revision_ins_resultado ? '<span class="meta">Última: <b>' + esc(c.revision_ins_resultado) + '</b> (v' + c.revision_ins_version + ') · ' + esc(usuario(c.revision_ins_por).nombre) + ' · ' + momento(c.revision_ins_en) + '</span>' : '') + '</div>' +
          '<div class="panel-cuerpo ct-nota"><div class="seg" id="pv-res"><button type="button" data-r="Sin ajustes" class="on">✓ Sin ajustes</button><button type="button" data-r="Requiere ajustes">Requiere ajustes</button></div>' +
          '<textarea id="pv-t" maxlength="2000" placeholder="Observaciones de instrumentación (obligatorias si requiere ajustes): distancias entre camillas, tomas eléctricas, paso hacia la puerta…"></textarea><div class="acciones"><button class="btn btn-verde btn-sm" id="pv-ok" type="button">Registrar revisión</button></div></div></div>' : '') +
        '<div id="pv-plan"></div><div id="pv-av" style="margin-top:18px"></div>');
      panelPlanificacion($('#pv-plan'), { contrato: c, versiones: D.versiones, notas: D.notas, evento: e }, { ct: false, recargar: cargar });
      panelAV($('#pv-av'), c, D.av, { sel: false, estado: false, recargar: cargar });
      var res = 'Sin ajustes';
      $$('#pv-res button').forEach(function (b) { b.onclick = function () { res = b.getAttribute('data-r'); $$('#pv-res button').forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
      var x;
      if ((x = $('#pv-ok'))) x.onclick = function () { api('plan_revision_ins', { contrato_id: id, resultado: res, texto: $('#pv-t').value }).then(function () { toast('Revisión registrada. Operaciones la ve en el contrato.'); cargar(); }, falla); };
      if ((x = $('#pv-usar'))) x.onclick = function () {
        var v = D.versiones[0];
        var m = modal('Usar la planificación del cliente', '<p style="margin:0">La distribución del entrenamiento <b>' + esc(e.titulo) + '</b> se reemplazará por la versión ' + v.version + ' de ' + esc(c.cliente) + ' (' + v.items.length + ' elementos). Después puede ajustarla en la pestaña «Distribución en sala» del entrenamiento.</p>',
          '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="x-ok" type="button">Usar esta versión</button>');
        $('#x-ok', m.el).onclick = function () { api('layout_guardar', { evento_id: e.id, layout: v.items, plan_version: v.version }).then(function () { m.cerrar(); toast('Distribución actualizada.'); location.hash = '#/evento/' + e.id + '/sala'; }, function (z) { errorEn(m, z.error); }); };
      };
    }
    S.vista = { refrescar: cargar };
    cargar();
  }

  // ------------------------------------------------------------ AUDIOVISUALES
  function vAV(p) {
    if (!puedeAV()) { location.hash = AREA_INICIO[areasYo()[0]]; return; }
    if (p[0] === 'catalogo') return vAVCatalogo();
    if (p[0] === 'equipos') return vAVEquipos();
    var datos = null, todos = false, q = '';
    function cargar() { return api('av_pedidos' + (todos ? '&todos=1' : '')).then(function (j) { datos = j.pedidos; pintar(); }, falla); }
    function pintar() {
      var L = datos.filter(function (c) { return !q || (c.cliente + ' ' + c.curso + ' ' + c.sala_nombre).toLowerCase().indexOf(q) >= 0; });
      var tot = 0, pend = 0, listos = 0; datos.forEach(function (c) { c.av.forEach(function (x) { tot++; if (x.estado === 'Solicitado' || x.estado === 'En preparación') pend++; if (x.estado === 'Listo' || x.estado === 'Instalado / entregado') listos++; }); });
      $('#av-kpis').innerHTML = '<div class="kpi"><b>' + datos.length + '</b><span>cursos próximos</span></div><div class="kpi"><b>' + pend + '</b><span>elementos por preparar</span></div><div class="kpi"><b>' + listos + '</b><span>listos o instalados</span></div><div class="kpi"><b>' + datos.filter(function (c) { return !c.av.length; }).length + '</b><span>cursos sin audiovisuales definidos</span></div>';
      var cont = $('#av-lista'); cont.innerHTML = L.length ? '' : '<div class="panel"><div class="vacio"><strong>Sin cursos próximos</strong>Cuando Operaciones registre un curso contratado aparecerá aquí con lo que requiere.</div></div>';
      L.forEach(function (c) {
        var box = document.createElement('section'); box.className = 'av-curso';
        var n = diasPara(c.fecha_inicio);
        box.innerHTML = '<div class="av-cab"><div><div class="eyebrow">' + esc(c.cliente) + (c.estado === 'Cotización' ? ' · cotización' : '') + '</div><h2>' + esc(c.curso) + '</h2><div class="meta"><b>' + esc(c.sala_nombre) + '</b> · ' + esc(rangoCT(c)) + ' · ' + esc(c.hora_ini) + '–' + esc(c.hora_fin) + (c.participantes ? ' · ' + c.participantes + ' participantes' : '') + (c.estaciones ? ' · ' + c.estaciones + ' estaciones' : '') + '</div></div>' +
          '<div class="acciones"><span class="chip ' + (n <= 3 ? 'pe-cambio' : 'pe-enviado') + '">Inicia ' + faltan(c.fecha_inicio) + '</span><a class="btn btn-sm" href="#/plan/' + c.id + '">Ver sala planificada</a></div></div><div class="av-items"></div><div class="av-docs"></div>';
        cont.appendChild(box);
        panelAV($('.av-items', box), c, c.av, { sel: c.estado !== 'Cancelado', estado: true, recargar: cargar, titulo: 'Lo que requiere el curso' });
        panelDocsCT($('.av-docs', box), c, c.archivos, ['Arte para marcación', 'Programa académico'], cargar);
      });
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">Audiovisuales</div><h1>Requerimientos por curso</h1><p>Equipos, certificaciones, marcación y material impreso de cada curso contratado. Lo que se marca como listo o instalado lo ve instrumentación en la sala.</p></div>' +
      '<div class="acciones"><input type="search" id="av-q" placeholder="Buscar curso o cliente…" style="max-width:260px"><label class="check"><input type="checkbox" id="av-todos">Incluir pasados</label></div></div><div class="kpis" id="av-kpis"></div><div id="av-lista"><div class="vacio">Cargando…</div></div>');
    $('#av-q').oninput = function () { q = this.value.toLowerCase(); pintar(); };
    $('#av-todos').onchange = function () { todos = this.checked; cargar(); };
    S.vista = { refrescar: cargar };
    cargar();
  }
  function vAVCatalogo() {
    var K = null;
    function cargar() { return api('av_catalogo&desde=' + hoy() + '&hasta=' + hoy()).then(function (j) { K = j; pintar(); }, falla); }
    function pintar() {
      $('#avc').innerHTML = K.categorias.map(function (g) {
        var its = K.items.filter(function (i) { return i.categoria === g; }); if (!its.length) return '';
        return '<div class="panel" style="margin-bottom:16px"><div class="panel-cab"><h2>' + esc(g) + '</h2><span class="meta">' + its.length + ' elementos</span></div><div class="tabla-wrap"><table class="tabla"><thead><tr><th>Elemento</th><th>Unidad</th><th class="num">Existencias</th><th class="num">En uso hoy</th><th>Opciones</th><th>Estado</th><th></th></tr></thead><tbody>' +
          its.map(function (i) {
            return '<tr' + (+i.activo ? '' : ' style="opacity:.55"') + '><td><b>' + esc(i.nombre) + '</b>' + (i.descripcion ? '<br><span class="meta">' + esc(i.descripcion) + '</span>' : '') + '</td><td>' + esc(i.unidad) + '</td>' +
              '<td class="num">' + (i.stock == null ? '<span class="meta">Por pedido</span>' : i.stock + (+i.equipos ? '<br><a class="meta" href="#/av/equipos">del inventario · ' + i.equipos + ' equipo' + (+i.equipos > 1 ? 's' : '') + (+i.equipos_revisar ? ', ' + i.equipos_revisar + ' por revisar' : '') + '</a>' : '')) + '</td><td class="num">' + (i.stock == null ? '—' : i.stock - (i.disponible || 0)) + '</td>' +
              '<td>' + (i.opciones.length ? i.opciones.map(function (o) { return '<span class="chip chip-op">' + esc(o) + '</span>'; }).join(' ') : '<span class="meta">—</span>') + '</td><td>' + (+i.activo ? 'Disponible para contratar' : 'Inactivo') + '</td>' +
              '<td><button class="btn btn-sm" data-ed="' + i.id + '" type="button">Editar</button></td></tr>';
          }).join('') + '</tbody></table></div></div>';
      }).join('');
      $$('#avc [data-ed]').forEach(function (b) { b.onclick = function () { editar(K.items.find(function (i) { return +i.id === +b.getAttribute('data-ed'); })); }; });
    }
    function editar(i) {
      var n = !i; i = i || { categoria: K.categorias[0], nombre: '', descripcion: '', unidad: 'unidad', stock: null, opciones: [], activo: 1 };
      var m = modal(n ? 'Nuevo elemento audiovisual' : 'Editar ' + i.nombre, '<div class="form-grid">' +
        '<label class="campo"><span class="req">Categoría</span><select id="x-g">' + K.categorias.map(function (g) { return '<option' + (g === i.categoria ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') + '</select></label>' +
        '<label class="campo"><span class="req">Nombre</span><input id="x-n" maxlength="120" value="' + esc(i.nombre) + '"></label>' +
        '<label class="campo ancho"><span>Descripción</span><input id="x-d" maxlength="300" value="' + esc(i.descripcion) + '"></label>' +
        '<label class="campo"><span>Unidad</span><input id="x-u" maxlength="30" value="' + esc(i.unidad) + '" placeholder="unidad, kit, servicio, pieza…"></label>' +
        (+i.equipos ? '<div class="campo"><span>Existencias</span><b>' + i.stock + '</b><small>Se calculan con los ' + i.equipos + ' equipos enlazados en «Equipos de la sala» (en alta y funcionales).</small></div>' :
        '<label class="campo"><span>Existencias</span><input id="x-s" type="number" min="0" value="' + (i.stock == null ? '' : i.stock) + '" placeholder="Vacío = por pedido"><small>Para equipos propios. Déjelo vacío para lo que se produce por pedido (marcación, impresos). Si enlaza equipos del inventario, se calculan solas.</small></label>') +
        '<label class="campo ancho"><span>Opciones (una por línea)</span><textarea id="x-o" placeholder="Ej. Impresos&#10;Solo PDF generado">' + esc(i.opciones.join('\n')) + '</textarea><small>Si tiene opciones, quien lo contrata debe elegir una.</small></label>' +
        '<label class="check"><input type="checkbox" id="x-a"' + (+i.activo ? ' checked' : '') + '>Disponible para contratar</label></div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar</button>');
      $('#x-ok', m.el).onclick = function () {
        api('av_item_guardar', { id: n ? 0 : i.id, categoria: $('#x-g', m.el).value, nombre: $('#x-n', m.el).value, descripcion: $('#x-d', m.el).value, unidad: $('#x-u', m.el).value, stock: $('#x-s', m.el) ? $('#x-s', m.el).value : i.stock, opciones: $('#x-o', m.el).value, activo: $('#x-a', m.el).checked ? 1 : 0 })
          .then(function () { m.cerrar(); toast('Inventario actualizado.'); cargar(); }, function (e) { errorEn(m, e.error); });
      };
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">Audiovisuales</div><h1>Catálogo para contratación</h1><p>Lo que Operaciones puede ofrecer y seleccionar en cada curso: equipos audiovisuales, certificaciones (impresas o solo PDF), marcación de salas, lockers, estaciones y batas, habladores, libretas, lapiceros e impresión de programas.</p></div>' +
      '<button class="btn btn-oro" id="avc-n" type="button">+ Nuevo elemento</button></div><div id="avc"><div class="vacio">Cargando…</div></div>');
    $('#avc-n').onclick = function () { editar(null); };
    S.vista = { refrescar: cargar };
    cargar();
  }

  function chipEq(e) {
    var c = { 'Funcional': 'aveq-ok', 'Parcialmente funcional': 'aveq-par', 'Enciende · por probar': 'aveq-rev', 'Pendiente de revisión': 'aveq-rev', 'Disfuncional': 'aveq-mal' }[e] || '';
    return '<span class="chip ' + c + '">' + esc(e) + '</span>';
  }
  function vAVEquipos() {
    var K = null, f = 'alta', q = '', it = '';
    function cargar() { return api('av_equipos').then(function (j) { K = j; pintar(); }, falla); }
    function pintar() {
      var E = K.equipos, alta = E.filter(function (e) { return e.situacion === 'Alta'; });
      var uni = 0, fun = 0; alta.forEach(function (e) { uni += +e.cantidad; if (e.estado === 'Funcional') fun += +e.cantidad; });
      var rev = E.filter(function (e) { return e.situacion !== 'Dado de baja' && e.estado !== 'Funcional'; }).length;
      var pdef = E.filter(function (e) { return e.situacion === 'Por definir'; }).length;
      $('#eq-kpis').innerHTML = '<div class="kpi"><b>' + alta.length + '</b><span>equipos dados de alta</span></div><div class="kpi"><b>' + uni + '</b><span>unidades en alta</span></div><div class="kpi oro"><b>' + fun + '</b><span>unidades funcionales</span></div>' +
        '<div class="kpi"><b>' + rev + '</b><span>por revisar o con fallas</span></div><div class="kpi"><b>' + pdef + '</b><span>sin marcar alta o baja</span></div><div class="kpi"><b>' + E.filter(function (e) { return e.situacion === 'Dado de baja'; }).length + '</b><span>dados de baja</span></div>';
      var L = E.filter(function (e) {
        if (f === 'alta' && e.situacion !== 'Alta') return false;
        if (f === 'revisar' && (e.situacion === 'Dado de baja' || e.estado === 'Funcional')) return false;
        if (f === 'definir' && e.situacion !== 'Por definir') return false;
        if (f === 'baja' && e.situacion !== 'Dado de baja') return false;
        if (it === 'si' && !e.item_id) return false;
        if (it && it !== 'si' && +e.item_id !== +it) return false;
        return !q || [e.codigo, e.equipo, e.marca, e.referencia, e.serial, e.observacion, e.accesorios, e.asignado, e.item_nombre].join(' ').toLowerCase().indexOf(q) >= 0;
      });
      $('#eq-n').textContent = L.length + ' de ' + E.length;
      $('#eq-lista').innerHTML = L.length ? '<div class="tabla-wrap"><table class="tabla aveq-tabla"><thead><tr><th>Código</th><th>Equipo</th><th>Marca · referencia</th><th>Serial</th><th>Estado</th><th>Situación</th><th class="num">Cant.</th><th>Se ofrece como</th><th>Observaciones</th><th></th></tr></thead><tbody>' +
        L.map(function (e) {
          return '<tr' + (e.situacion === 'Dado de baja' ? ' class="aveq-baja"' : '') + '><td class="comp-cod">' + esc(e.codigo) + '</td><td><b>' + esc(e.equipo) + '</b>' + (e.asignado ? '<br><span class="meta">Asignado a ' + esc(e.asignado) + '</span>' : '') + '</td>' +
            '<td>' + esc([e.marca, e.referencia].filter(Boolean).join(' · ') || '—') + '</td><td class="meta">' + esc(e.serial || '—') + '</td><td>' + chipEq(e.estado) + '</td>' +
            '<td>' + (e.situacion === 'Dado de baja' ? 'Baja' + (e.fecha_baja ? ' · ' + fCorta(e.fecha_baja) : '') : e.situacion === 'Por definir' ? '<span class="aveq-def">Por definir</span>' : 'Alta') + '</td><td class="num">' + e.cantidad + '</td>' +
            '<td>' + (e.item_nombre ? '<span class="chip chip-op">' + esc(e.item_nombre) + '</span>' : '<span class="meta">Uso interno</span>') + '</td>' +
            '<td class="aveq-obs">' + esc(e.observacion || '') + (e.accesorios ? '<br><span class="meta">Incluye: ' + esc(e.accesorios) + '</span>' : '') + '</td>' +
            '<td><button class="btn btn-sm" data-ed="' + e.id + '" type="button">Editar</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="vacio"><strong>Sin equipos con ese filtro</strong>Cambie el filtro o la búsqueda.</div>';
      $$('#eq-lista [data-ed]').forEach(function (b) { b.onclick = function () { editar(K.equipos.find(function (e) { return +e.id === +b.getAttribute('data-ed'); })); }; });
    }
    function editar(e) {
      var n = !e; e = e || { codigo: '', equipo: '', marca: '', referencia: '', serial: '', estado: 'Funcional', situacion: 'Alta', fecha_baja: '', observacion: '', accesorios: '', cantidad: 1, asignado: '', item_id: '' };
      var op = function (L, v) { return L.map(function (x) { return '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join(''); };
      var m = modal(n ? 'Nuevo equipo' : 'Equipo ' + e.codigo, '<div class="form-grid">' +
        '<label class="campo"><span>Código</span><input id="x-c" maxlength="20" value="' + esc(e.codigo) + '" placeholder="Automático (AV-…)"></label>' +
        '<label class="campo"><span class="req">Equipo</span><input id="x-e" maxlength="120" value="' + esc(e.equipo) + '"></label>' +
        '<label class="campo"><span>Marca</span><input id="x-m" maxlength="80" value="' + esc(e.marca) + '"></label>' +
        '<label class="campo"><span>Referencia</span><input id="x-r" maxlength="80" value="' + esc(e.referencia) + '"></label>' +
        '<label class="campo"><span>Serial</span><input id="x-s" maxlength="80" value="' + esc(e.serial) + '"></label>' +
        '<label class="campo"><span>Cantidad</span><input id="x-q" type="number" min="1" max="999" value="' + e.cantidad + '"></label>' +
        '<label class="campo"><span>Estado</span><select id="x-est">' + op(K.estados, e.estado) + '</select></label>' +
        '<label class="campo"><span>Situación</span><select id="x-sit">' + op(K.situaciones, e.situacion) + '</select></label>' +
        '<label class="campo" id="x-fb-c"' + (e.situacion === 'Dado de baja' ? '' : ' hidden') + '><span>Fecha de baja</span><input id="x-fb" type="date" value="' + esc(e.fecha_baja || hoy()) + '"></label>' +
        '<label class="campo"><span>Se ofrece como</span><select id="x-it"><option value="">No se ofrece (uso interno)</option>' + K.items.map(function (i) { return '<option value="' + i.id + '"' + (+i.id === +e.item_id ? ' selected' : '') + '>' + esc(i.nombre) + '</option>'; }).join('') + '</select><small>Si se enlaza, cuenta en las existencias que Operaciones puede contratar (solo si está en alta y funcional).</small></label>' +
        '<label class="campo"><span>Asignado a</span><input id="x-as" maxlength="80" value="' + esc(e.asignado) + '"></label>' +
        '<label class="campo ancho"><span>Accesorios</span><input id="x-ac" maxlength="300" value="' + esc(e.accesorios) + '" placeholder="Cargador, estuche, cables…"></label>' +
        '<label class="campo ancho"><span>Observaciones</span><textarea id="x-o" maxlength="500">' + esc(e.observacion) + '</textarea></label></div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar</button>');
      $('#x-sit', m.el).onchange = function () { $('#x-fb-c', m.el).hidden = this.value !== 'Dado de baja'; };
      $('#x-ok', m.el).onclick = function () {
        var sit = $('#x-sit', m.el).value;
        if (sit === 'Dado de baja' && e.situacion !== 'Dado de baja' && !$('#x-o', m.el).value.trim()) return errorEn(m, 'Escriba en observaciones el motivo de la baja.');
        api('av_equipo_guardar', { id: n ? 0 : e.id, codigo: $('#x-c', m.el).value, equipo: $('#x-e', m.el).value, marca: $('#x-m', m.el).value, referencia: $('#x-r', m.el).value, serial: $('#x-s', m.el).value, cantidad: $('#x-q', m.el).value,
          estado: $('#x-est', m.el).value, situacion: sit, fecha_baja: $('#x-fb', m.el).value, item_id: $('#x-it', m.el).value, asignado: $('#x-as', m.el).value, accesorios: $('#x-ac', m.el).value, observacion: $('#x-o', m.el).value })
          .then(function (j) { m.cerrar(); toast('Equipo ' + j.codigo + ' guardado.'); cargar(); }, function (z) { errorEn(m, z.error); });
      };
    }
    function exportar() {
      if (!window.XLSX) return toast('No se pudo cargar el generador de Excel.', 'error');
      var rows = K.equipos.map(function (e) { return { 'Código': e.codigo, 'Equipo': e.equipo, 'Marca': e.marca, 'Referencia': e.referencia, 'Serial': e.serial, 'Estado': e.estado, 'Situación': e.situacion, 'Fecha de baja': e.fecha_baja, 'Cantidad': +e.cantidad, 'Se ofrece como': e.item_nombre || '', 'Asignado a': e.asignado, 'Accesorios': e.accesorios, 'Observaciones': e.observacion, 'Origen': e.origen }; });
      var wb = XLSX.utils.book_new(), h = XLSX.utils.json_to_sheet(rows);
      h['!cols'] = [10, 30, 16, 18, 22, 20, 12, 12, 9, 30, 18, 30, 40, 22].map(function (w) { return { wch: w }; });
      XLSX.utils.book_append_sheet(wb, h, 'Equipos');
      guardarArchivo(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Inventario-audiovisuales-' + hoy() + '.xlsx').catch(falla);
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">Audiovisuales</div><h1>Equipos de la sala</h1><p>Inventario físico con código, serial y estado. Los equipos enlazados a un elemento del catálogo alimentan las existencias que Operaciones puede contratar: solo cuentan los que están en alta y funcionales.</p></div>' +
      '<div class="acciones"><button class="btn" id="eq-x" type="button">Exportar a Excel</button><button class="btn btn-oro" id="eq-new" type="button">+ Nuevo equipo</button></div></div><div class="kpis" id="eq-kpis"></div>' +
      '<div class="panel"><div class="panel-cab"><div class="seg" id="eq-f"><button type="button" data-f="alta" class="on">En alta</button><button type="button" data-f="revisar">Por revisar</button><button type="button" data-f="definir">Por definir</button><button type="button" data-f="baja">Dados de baja</button><button type="button" data-f="todos">Todos</button></div>' +
      '<div class="acciones"><select id="eq-it" style="max-width:240px"><option value="">Todos los usos</option><option value="si">Se ofrecen para contratar</option></select><input type="search" id="eq-q" placeholder="Buscar código, equipo, serial…" style="max-width:260px"><span class="meta" id="eq-n"></span></div></div><div id="eq-lista"><div class="vacio">Cargando…</div></div></div>');
    $$('#eq-f button').forEach(function (b) { b.onclick = function () { f = b.getAttribute('data-f'); $$('#eq-f button').forEach(function (x) { x.classList.toggle('on', x === b); }); pintar(); }; });
    $('#eq-q').oninput = function () { q = this.value.toLowerCase(); if (K) pintar(); };
    $('#eq-it').onchange = function () { it = this.value; if (K) pintar(); };
    $('#eq-new').onclick = function () { editar(null); };
    $('#eq-x').onclick = exportar;
    S.vista = { refrescar: cargar };
    cargar().then(function () { if (K) $('#eq-it').innerHTML += K.items.filter(function (i) { return K.equipos.some(function (e) { return +e.item_id === +i.id; }); }).map(function (i) { return '<option value="' + i.id + '">' + esc(i.nombre) + '</option>'; }).join(''); });
  }

  // ------------------------------------------------------------ en el entrenamiento (instrumentación)
  function panelClienteEvento(host, D, abierto, alUsar) {
    var cl = D.cliente; if (!cl) { host.innerHTML = ''; return; }
    var pl = cl.plan;
    host.innerHTML = '<div class="panel ev-cliente"><div class="panel-cab"><h2>Planificación del cliente · ' + esc(cl.cliente) + '</h2><div class="acciones">' + chipPlan(cl.plan_estado) + '<a class="btn btn-sm" href="#/plan/' + cl.id + '">Ver planificación</a>' +
      (abierto && pl ? '<button class="btn btn-sm btn-oro" id="evc-usar" type="button">Cargar versión ' + pl.version + ' en el editor</button>' : '') + '</div></div>' +
      '<div class="panel-cuerpo"><p class="meta" style="margin:0">' + (pl ? 'Versión vigente <b>' + pl.version + '</b> · ' + esc(pl.autor_nombre) + ' · ' + momento(pl.creado_en) + ' · ' + pl.items.length + ' elementos' : 'El cliente aún no ha enviado su planificación.') +
        (cl.revision_ins_resultado ? ' · Revisión de instrumentación: <b>' + esc(cl.revision_ins_resultado) + '</b> (v' + cl.revision_ins_version + ')' : '') + '</p></div></div>' +
      '<div id="evc-av" style="margin-top:14px"></div>';
    panelAV($('#evc-av', host), cl, cl.av, { sel: false, estado: false, recargar: function () {}, titulo: 'Audiovisuales y marcación de la sala' });
    var b = $('#evc-usar', host); if (b) b.onclick = function () { alUsar(pl); };
  }

  // ================================================================== PRESUPUESTO (almacén) · SOLICITUDES ESPECIALES · DOCUMENTO DEL CONTRATO
  var PPTO_EST = { sin_presupuesto: ['Sin presupuesto', 'pe-sin'], seleccion: ['En selección', 'pe-abierto'], solicitado: ['En Presupuesto · por valorar', 'pe-enviado'],
    emitido: ['Emitido · esperando al cliente', 'pp-emitido'], ajustes: ['El cliente pidió ajustes', 'pe-cambio'], aceptado: ['Aceptado por el cliente', 'pe-aprobado'] };
  function chipPpto(e) { var x = PPTO_EST[e] || [e, '']; return '<span class="chip ' + x[1] + '">' + esc(x[0]) + '</span>'; }
  var ESP_COL = { 'Pendiente': 'pe-enviado', 'En consulta': 'pe-cambio', 'Aprobada': 'pe-aprobado', 'No es posible': 'ct-can' };
  function chipEsp(e) { return '<span class="chip ' + (ESP_COL[e] || '') + '">' + esc(e) + '</span>'; }
  function puedePS() { return !!S.yo && (S.yo.rol === 'admin' || areasYo().indexOf('ps') >= 0); }
  function numTxt(n) { n = +n; return n === Math.round(n) ? String(n) : String(n).replace('.', ','); }
  function soloDig(v) { return String(v == null ? '' : v).replace(/[^\d]/g, ''); }
  function lineaCant(l) { return numTxt(l.cantidad) + ' ' + esc(l.unidad) + (+l.dias > 1 ? ' × ' + l.dias + ' días' : ''); }
  function ORIGEN(o) { return { cliente: '<span class="chip pp-cli">Cliente</span>', especial: '<span class="chip pp-esp">Especial</span>', clemi: '' }[o] || ''; }

  // Selector de elementos del catálogo (Operaciones, Presupuesto). alAgregar(item, cantidad, dias, nota) → Promise
  function modalCatalogoPP(K, conPrecio, alAgregar, alCerrar) {
    var cat = '', q = '';
    var m = modal('Agregar del catálogo', '<div class="pp-filtros"><input type="search" id="x-q" placeholder="Buscar en el catálogo…"><select id="x-c"><option value="">Todas las categorías</option>' + K.categorias.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></div><div id="x-l" class="pp-cat-lista"></div>',
      '<button class="btn" data-cerrar type="button">Listo</button>', { ancho: true, alCerrar: alCerrar });
    function pintar() {
      var L = K.items.filter(function (i) { return +i.activo && (!cat || i.categoria === cat) && (!q || (i.nombre + ' ' + i.descripcion + ' ' + i.codigo + ' ' + i.categoria).toLowerCase().indexOf(q) >= 0); });
      $('#x-l', m.el).innerHTML = L.length ? L.slice(0, 200).map(function (i) {
        return '<div class="pp-cat-fila" data-i="' + i.id + '"><div><b>' + esc(i.nombre) + '</b><span class="meta">' + esc(i.categoria) + ' · ' + esc(i.unidad) + (conPrecio ? ' · ' + (i.precio == null ? 'por cotizar' : pesos(i.precio)) : '') + (+i.inv_bio ? ' · <b>' + (+i.stock > 0 ? i.stock + ' disponible' + (+i.stock === 1 ? '' : 's') + ' en inventario' : 'Agotado') + '</b>' : '') + '</span>' + (i.descripcion ? '<small>' + esc(i.descripcion) + '</small>' : '') + '</div>' +
          '<div class="pp-cat-in"><label>Cant.<input type="number" min="0" step="any" value="1" data-k="c"></label><label>Días<input type="number" min="1" max="60" value="1" data-k="d"></label><input placeholder="Nota (opcional)" data-k="n" maxlength="500"><button class="btn btn-sm btn-verde" type="button" data-add>Agregar</button></div></div>';
      }).join('') + (L.length > 200 ? '<p class="meta">Mostrando 200 de ' + L.length + '. Use la búsqueda.</p>' : '') : '<div class="vacio">No hay elementos con ese filtro. Si no está en el catálogo, regístrelo como solicitud especial.</div>';
      $$('[data-add]', m.el).forEach(function (b) {
        b.onclick = function () {
          var f = b.closest('[data-i]'), it = K.items.find(function (x) { return +x.id === +f.getAttribute('data-i'); });
          b.disabled = true;
          alAgregar(it, $('[data-k=c]', f).value, $('[data-k=d]', f).value, $('[data-k=n]', f).value).then(function () { b.disabled = false; b.textContent = 'Agregado ✓'; setTimeout(function () { b.textContent = 'Agregar'; }, 1500); }, function (e) { b.disabled = false; errorEn(m, e.error); });
        };
      });
    }
    $('#x-q', m.el).oninput = function () { q = this.value.toLowerCase(); pintar(); };
    $('#x-c', m.el).onchange = function () { cat = this.value; pintar(); };
    pintar();
    return m;
  }

  // Presupuesto de un contrato. o: { recargar } (se usa en Operaciones y en Presupuesto)
  function panelPresupuesto(cont, id, o) {
    o = o || {};
    var D = null, K = null;
    function cargar() { return api('ppto&id=' + id).then(function (j) { D = j; pintar(); }, function (e) { cont.innerHTML = '<div class="vacio">' + esc(e.error) + '</div>'; }); }
    function catalogo() { return K ? Promise.resolve(K) : api('pp_catalogo').then(function (j) { K = j; return K; }); }
    function pintar() {
      var c = D.contrato, P = D.ppto, T = P.totales, est = P.estado, cerr = c.estado === 'Cancelado' || c.estado === 'Finalizado';
      var ed = !cerr && ['emitido', 'aceptado'].indexOf(est) < 0, ps = D.es_ps, ct = D.es_ct;
      var guia = {
        sin_presupuesto: 'Aún no hay elementos. El cliente puede elegir desde su enlace (pestaña «Presupuesto») o Operaciones puede agregarlos aquí. Lo que no esté en el catálogo va como <b>solicitud especial</b>.',
        seleccion: 'Se está armando la selección. Cuando esté completa, envíela al área de Presupuesto para que la valore.',
        solicitado: ps ? 'Asigne el valor unitario a cada línea, responda las solicitudes especiales (si se puede o no conseguir) y ajuste las condiciones. Luego emita el presupuesto: el cliente lo verá con valores en su enlace.' : 'El área de Presupuesto está valorando la selección y las solicitudes especiales.',
        emitido: 'Presupuesto emitido (versión ' + (P.versiones[0] ? P.versiones[0].version : '') + '). El cliente puede aceptarlo o pedir ajustes desde su enlace; si responde por otro medio, regístrelo aquí.',
        ajustes: 'El cliente pidió ajustes: <b>' + esc(P.ajustes || '') + '</b>. Modifique la selección y vuelva a enviarla a Presupuesto.',
        aceptado: c.fase === 'cotizacion' ? 'El cliente aceptó el presupuesto. <b>Apruebe y cierre la cotización</b> para que pase a Administrativo (firmas y cierre de la negociación).' : 'El cliente aceptó el presupuesto. La cotización está cerrada: el convenio sigue en ' + esc(FASE_N[c.fase] || '') + '.'
      }[est] || '';
      if (c.cotiz && c.cotiz.limite && !c.cotiz.enviado) guia = (c.cotiz.vencido ? '<b>Venció el plazo del cliente</b> (' + esc(fLarga(c.cotiz.limite)) + '). Negociación puede ampliarlo. ' : '<b>El cliente tiene hasta el ' + esc(fLarga(c.cotiz.limite)) + '</b> (' + (c.cotiz.habiles_restantes ? c.cotiz.habiles_restantes + ' día(s) hábil(es) después de hoy' : 'hoy es el último día') + ') para finalizar su pedido. ') + guia;
      var acc = '';
      if (ed && (ct || ps)) acc += '<button class="btn btn-sm" id="pp-cat" type="button">+ Del catálogo</button><button class="btn btn-sm" id="pp-esp" type="button">+ Solicitud especial</button>';
      if (ed && ps) acc += '<button class="btn btn-sm" id="pp-man" type="button">+ Línea manual</button><button class="btn btn-sm" id="pp-cond" type="button">Condiciones</button>';
      if (ed && ['sin_presupuesto', 'seleccion', 'ajustes'].indexOf(est) >= 0) acc += '<button class="btn btn-sm btn-oro" id="pp-sol" type="button">Enviar a Presupuesto</button>';
      if (ed && ps && est === 'solicitado') acc += '<button class="btn btn-sm btn-oro" id="pp-emi" type="button">Emitir presupuesto</button>';
      if (est === 'emitido' && ct) acc += '<button class="btn btn-sm btn-oro" id="pp-resp" type="button">Registrar respuesta del cliente</button>';
      if (['emitido', 'aceptado'].indexOf(est) >= 0 && !cerr && ['cotizacion', ''].indexOf(c.fase || '') >= 0) acc += '<button class="btn btn-sm" id="pp-reab" type="button">Reabrir presupuesto</button>';
      if (est === 'aceptado' && c.fase === 'cotizacion' && (ct || ps) && !cerr) acc += '<button class="btn btn-sm btn-oro" id="pp-cerrar" type="button">Aprobar y cerrar cotización</button>';
      if (P.lineas.length) acc += '<button class="btn btn-sm" id="pp-xls" type="button">Descargar Excel</button>';
      if (est === 'aceptado' && ct && o.irDocumento && c.fase !== 'cotizacion') acc += '<button class="btn btn-sm btn-verde" id="pp-doc" type="button">Documento del convenio →</button>';
      var grupos = {}; P.lineas.forEach(function (l) { (grupos[l.categoria] = grupos[l.categoria] || []).push(l); });
      var filas = Object.keys(grupos).map(function (g) {
        return '<tr class="pp-grupo"><td colspan="6">' + esc(g) + '</td></tr>' + grupos[g].map(function (l) {
          return '<tr><td><b>' + esc(l.descripcion) + '</b> ' + ORIGEN(l.origen) + (l.datos ? '<br>' + briefBtn(l.datos, 'data-pp-br="' + l.id + '"') : '') + (l.nota && l.origen !== 'especial' ? '<br><span class="meta">' + esc(l.nota) + '</span>' : '') + (l.bodega != null ? '<br><span class="meta' + (l.bodega < l.cantidad * Math.max(1, l.dias) ? ' pp-sin' : '') + '">En bodega: ' + numTxt(l.bodega) + '</span>' : '') + '</td><td class="num">' + numTxt(l.cantidad) + '</td><td class="num">' + l.dias + '</td><td>' + esc(l.unidad) + '</td>' +
            '<td class="num">' + (l.precio == null ? '<span class="pp-sin">Sin precio</span>' : pesos(l.precio)) + '</td><td class="num"><b>' + (l.total == null ? '—' : pesos(l.total)) + '</b>' +
            (ed && (ct || ps) ? '<div class="pp-acc"><button class="btn-link" data-ed="' + l.id + '" type="button">Editar</button>' + (l.especial_id ? '' : ' · <button class="btn-link" data-qu="' + l.id + '" type="button">Quitar</button>') + '</div>' : '') + '</td></tr>';
        }).join('');
      }).join('');
      var tot = '<div class="pp-tot">' + Object.keys(T.grupos).map(function (g) { return '<div><span>' + esc(g) + '</span><b>' + pesos(T.grupos[g]) + '</b></div>'; }).join('') +
        (T.admin_pct ? '<div><span>Administración CLEMI (' + numTxt(T.admin_pct) + '%)</span><b>' + pesos(T.admin) + '</b></div>' : '') +
        '<div class="sub"><span>Subtotal</span><b>' + pesos(T.subtotal) + '</b></div><div><span>IVA (' + numTxt(T.iva_pct) + '%)</span><b>' + pesos(T.iva) + '</b></div>' +
        '<div class="total"><span>Total IVA incluido</span><b>' + pesos(T.total) + '</b></div>' +
        (T.anticipo_pct < 100 ? '<div class="meta-f"><span>Primer pago ' + numTxt(T.anticipo_pct) + '%</span><b>' + pesos(T.pago1) + '</b></div><div class="meta-f"><span>Saldo ' + numTxt(100 - T.anticipo_pct) + '%</span><b>' + pesos(T.pago2) + '</b></div>' : '') +
        (T.por_estacion ? '<div class="meta-f"><span>Por estación (' + c.estaciones + ')</span><b>' + pesos(T.por_estacion) + '</b></div>' : '') + (T.por_participante ? '<div class="meta-f"><span>Por participante (' + c.participantes + ')</span><b>' + pesos(T.por_participante) + '</b></div>' : '') +
        (T.sin_precio ? '<p class="pp-aviso">' + T.sin_precio + ' línea(s) sin precio: el total aún no está completo.</p>' : '') + (P.nota ? '<p class="meta" style="margin:8px 0 0">Nota para el cliente: ' + esc(P.nota) + '</p>' : '') + '</div>';
      var esp = P.especiales.length ? '<ul class="pp-esp-lista">' + P.especiales.map(function (e) {
        return '<li><div class="pp-esp-cab">' + chipEsp(e.estado) + '<span class="meta">' + (e.origen === 'cliente' ? 'Cliente · ' : 'CLEMI · ') + esc(e.autor_nombre) + ' · ' + momento(e.creado_en) + '</span></div><p><b>' + esc(e.texto) + '</b>' + (e.cantidad ? ' · cantidad: ' + esc(e.cantidad) : '') + '</p>' +
          (e.respuesta ? '<p class="pp-resp">' + esc(e.respuesta) + '<span class="meta"> — ' + esc(e.respondido_por || '') + (e.respondido_en ? ' · ' + momento(e.respondido_en) : '') + '</span></p>' : '') +
          '<div class="pp-acc">' + (ed && ps ? '<button class="btn btn-sm" data-re="' + e.id + '" type="button">' + (e.estado === 'Pendiente' ? 'Responder' : 'Cambiar respuesta') + '</button>' : '') + (ed && e.estado === 'Pendiente' && (ct || ps) ? ' <button class="btn-link" data-eq="' + e.id + '" type="button">Quitar</button>' : '') + '</div></li>';
      }).join('') + '</ul>' : '<p class="meta" style="margin:0;padding:14px 18px">Sin solicitudes especiales. Aquí llega lo que el cliente pida o pregunte y no esté en el catálogo (un equipo, insumo o servicio para que CLEMI lo consiga); Presupuesto confirma si se puede o no.</p>';
      var vers = P.versiones.length ? '<ul class="cl-ver">' + P.versiones.map(function (v) {
        return '<li><b>Versión ' + v.version + '</b> · ' + pesos(v.total) + '<span class="meta">Emitida por ' + esc(v.emitido_por) + ' · ' + momento(v.emitido_en) + '</span>' +
          (v.respuesta ? '<p>' + (v.respuesta === 'aceptado' ? '<b>Aceptada</b>' : '<b>Ajustes pedidos</b>') + ' por ' + esc(v.respuesta_por) + ' · ' + momento(v.respuesta_en) + (v.respuesta_texto ? '<br>' + esc(v.respuesta_texto) : '') + '</p>' : '') + '</li>';
      }).join('') + '</ul>' : '';
      cont.innerHTML = '<div class="panel pp-estado"><div class="panel-cab"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + chipPpto(est) + chipCT(c.estado) + '</div><div class="acciones">' + acc + '</div></div><div class="panel-cuerpo"><p style="margin:0">' + guia + '</p></div></div>' +
        '<div class="pp-grid"><div class="panel"><div class="panel-cab"><h2>Elementos del presupuesto</h2><span class="meta">' + P.lineas.length + ' líneas</span></div>' +
          (P.lineas.length ? '<div class="tabla-wrap"><table class="tabla pp-tabla"><thead><tr><th>Elemento</th><th class="num">Cant.</th><th class="num">Días</th><th>Unidad</th><th class="num">V. unitario</th><th class="num">Total</th></tr></thead><tbody>' + filas + '</tbody></table></div>' : '<div class="vacio">Sin elementos todavía.</div>') + '</div>' +
          '<div class="pp-lado"><div class="panel"><div class="panel-cab"><h2>Valor</h2></div>' + tot + '</div>' + (vers ? '<div class="panel"><div class="panel-cab"><h2>Versiones emitidas</h2></div>' + vers + '</div>' : '') + '</div></div>' +
        '<div class="panel" style="margin-top:18px"><div class="panel-cab"><h2>Solicitudes especiales</h2><span class="meta">' + P.especiales.filter(function (e) { return e.estado === 'Pendiente' || e.estado === 'En consulta'; }).length + ' por responder</span></div>' + esp + '</div>' +
        (D.bitacora.length ? '<div class="panel" style="margin-top:18px"><div class="panel-cab"><h2>Historial del presupuesto</h2></div><ul class="timeline">' + D.bitacora.slice(0, 40).map(function (b) {
          return '<li><div class="tl-hora">' + b.momento.slice(11, 16) + '<small>' + fCorta(b.momento.slice(0, 10)) + '</small></div><div class="tl-cuerpo"><b>' + esc(b.usuario_nombre) + '</b> · ' + esc(b.accion) + (b.detalle ? '<div class="bit-det">' + esc(b.detalle) + '</div>' : '') + '</div></li>';
        }).join('') + '</ul></div>' : '');
      enlazar();
    }
    function enlazar() {
      var c = D.contrato, P = D.ppto, b;
      if ((b = $('#pp-cat', cont))) b.onclick = function () {
        catalogo().then(function (K) {
          modalCatalogoPP(K, true, function (it, cant, dias, nota) {
            var cc = D.contrato, envia = function (datos) { return api('ppto_linea_guardar', { contrato_id: id, item_id: it.id, cantidad: cant, dias: dias, nota: nota, datos: datos }); };
            if (!it.formulario) return envia();
            return briefModalApp(it.formulario, (K.brief || {})[it.formulario], { titulo: cc.curso, fechas: cc.fecha_inicio === cc.fecha_fin ? fLarga(cc.fecha_inicio) : fLarga(cc.fecha_inicio) + ' al ' + fLarga(cc.fecha_fin), horario: cc.hora_ini + ' a ' + cc.hora_fin, lugar: 'CLEMI · ' + (cc.sala_nombre || ''), dirigido: cc.especialidad || '' }).then(envia);
          }, cargar);
        }, falla);
      };
      if ((b = $('#pp-esp', cont))) b.onclick = function () {
        var m = modal('Solicitud especial', '<p class="meta" style="margin:0">Equipo, insumo o servicio que no está en el catálogo, para que CLEMI lo consiga. Presupuesto confirma si se puede o no.</p>' +
          '<label class="campo"><span class="req">¿Qué se necesita?</span><textarea id="x-t" maxlength="1500" placeholder="Ej. Motor de alta velocidad para endoscopia de columna, marca Stryker"></textarea></label><label class="campo"><span>Cantidad</span><input id="x-c" maxlength="60" placeholder="Ej. 2 unidades por 2 días"></label>',
          '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Registrar</button>');
        $('#x-ok', m.el).onclick = function () { api('ppto_especial_guardar', { contrato_id: id, texto: $('#x-t', m.el).value, cantidad: $('#x-c', m.el).value }).then(function () { m.cerrar(); toast('Solicitud especial registrada.'); cargar(); }, function (e) { errorEn(m, e.error); }); };
      };
      if ((b = $('#pp-man', cont))) b.onclick = function () { editarLinea(null); };
      if ((b = $('#pp-cond', cont))) b.onclick = function () {
        var T = P.totales;
        var m = modal('Condiciones del presupuesto', '<div class="form-grid">' +
          '<label class="campo"><span>Administración CLEMI (%)</span><input id="x-a" type="number" min="0" max="100" step="0.1" value="' + T.admin_pct + '"><small>Componentes anatómicos, logística y administración. Se calcula sobre bienes, servicios y alimentación.</small></label>' +
          '<label class="campo"><span>IVA (%)</span><input id="x-i" type="number" min="0" max="100" step="0.1" value="' + T.iva_pct + '"></label>' +
          '<label class="campo"><span>Primer pago (%)</span><input id="x-p" type="number" min="0" max="100" step="1" value="' + T.anticipo_pct + '"><small>El saldo se paga después de la actividad. 100 = pago único.</small></label>' +
          '<label class="campo ancho"><span>Nota para el cliente</span><textarea id="x-n" maxlength="2000" placeholder="Ej. Valores válidos por 30 días.">' + esc(P.nota || '') + '</textarea></label></div>',
          '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar</button>');
        $('#x-ok', m.el).onclick = function () { api('ppto_condiciones', { contrato_id: id, admin_pct: $('#x-a', m.el).value, iva: $('#x-i', m.el).value, anticipo: $('#x-p', m.el).value, nota: $('#x-n', m.el).value }).then(function () { m.cerrar(); cargar(); }, function (e) { errorEn(m, e.error); }); };
      };
      if ((b = $('#pp-sol', cont))) b.onclick = function () {
        var m = modal('Enviar a Presupuesto', '<p style="margin:0">El área de Presupuesto (almacén) valorará los ' + P.lineas.length + ' elementos y responderá las ' + P.especiales.length + ' solicitudes especiales. Mientras tanto, el cliente no podrá cambiar su selección.</p><label class="campo"><span>Nota para Presupuesto (opcional)</span><textarea id="x-n" maxlength="1000"></textarea></label>',
          '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="x-ok" type="button">Enviar</button>');
        $('#x-ok', m.el).onclick = function () { api('ppto_solicitar', { contrato_id: id, nota: $('#x-n', m.el).value }).then(function () { m.cerrar(); toast('Enviado al área de Presupuesto.'); cargar(); if (o.recargar) o.recargar(); }, function (e) { errorEn(m, e.error); }); };
      };
      if ((b = $('#pp-emi', cont))) b.onclick = function () {
        var T = P.totales;
        var m = modal('Emitir presupuesto', '<p style="margin:0">Se emitirá la versión ' + (P.versiones.length + 1) + ' por <b>' + pesos(T.total) + '</b> IVA incluido. El cliente la verá con valores en su enlace y podrá aceptarla o pedir ajustes. ' + (c.estado === 'Solicitud' ? 'La solicitud pasa a <b>Cotización</b>.' : '') + '</p>',
          '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="x-ok" type="button">Emitir</button>');
        $('#x-ok', m.el).onclick = function () { api('ppto_emitir', { contrato_id: id }).then(function (j) { m.cerrar(); toast('Presupuesto emitido (versión ' + j.version + ').'); cargar(); if (o.recargar) o.recargar(); }, function (e) { errorEn(m, e.error); }); };
      };
      if ((b = $('#pp-resp', cont))) b.onclick = function () {
        var m = modal('Respuesta del cliente', '<div class="seg" id="x-r"><button type="button" data-r="aceptado" class="on">Aceptó el presupuesto</button><button type="button" data-r="ajustes">Pidió ajustes</button></div><label class="campo"><span>Detalle</span><textarea id="x-t" maxlength="1500" placeholder="Ej. Aceptado por correo de Anais Rabell el 2 de octubre"></textarea></label>',
          '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Registrar</button>');
        var r = 'aceptado';
        $$('#x-r button', m.el).forEach(function (x) { x.onclick = function () { r = x.getAttribute('data-r'); $$('#x-r button', m.el).forEach(function (y) { y.classList.toggle('on', y === x); }); }; });
        $('#x-ok', m.el).onclick = function () { api('ppto_respuesta', { contrato_id: id, respuesta: r, texto: $('#x-t', m.el).value }).then(function () { m.cerrar(); cargar(); if (o.recargar) o.recargar(); }, function (e) { errorEn(m, e.error); }); };
      };
      if ((b = $('#pp-reab', cont))) b.onclick = function () {
        var m = modal('Reabrir presupuesto', '<p style="margin:0">El presupuesto vuelve a Presupuesto para modificarlo y emitir una nueva versión. La versión emitida queda en el historial.</p><label class="campo"><span class="req">Motivo</span><textarea id="x-t" maxlength="1000"></textarea></label>',
          '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Reabrir</button>');
        $('#x-ok', m.el).onclick = function () { api('ppto_reabrir', { contrato_id: id, motivo: $('#x-t', m.el).value }).then(function () { m.cerrar(); cargar(); if (o.recargar) o.recargar(); }, function (e) { errorEn(m, e.error); }); };
      };
      if ((b = $('#pp-xls', cont))) b.onclick = function () { exportarPpto(D); };
      if ((b = $('#pp-doc', cont))) b.onclick = o.irDocumento;
      $$('[data-pp-br]', cont).forEach(function (x) { x.onclick = function () { var l = P.lineas.find(function (z) { return +z.id === +x.getAttribute('data-pp-br'); }); verBrief(l.datos, D.contrato.curso); }; });
      if ((b = $('#pp-cerrar', cont))) b.onclick = function () { cerrarCotizacion(c, o.recargar || cargar); };
      $$('[data-ed]', cont).forEach(function (x) { x.onclick = function () { editarLinea(P.lineas.find(function (l) { return +l.id === +x.getAttribute('data-ed'); })); }; });
      $$('[data-qu]', cont).forEach(function (x) { x.onclick = function () { api('ppto_linea_quitar', { id: x.getAttribute('data-qu') }).then(cargar, falla); }; });
      $$('[data-eq]', cont).forEach(function (x) { x.onclick = function () { api('ppto_especial_quitar', { id: x.getAttribute('data-eq') }).then(cargar, falla); }; });
      $$('[data-re]', cont).forEach(function (x) { x.onclick = function () { responder(P.especiales.find(function (e) { return +e.id === +x.getAttribute('data-re'); })); }; });
    }
    function editarLinea(l) {
      var n = !l, ps = D.es_ps; l = l || { descripcion: '', categoria: 'Otros', unidad: 'unidad', cantidad: 1, dias: 1, precio: null, grupo: 'Bienes y servicios', nota: '' };
      var m = modal(n ? 'Línea manual' : l.descripcion, '<div class="form-grid">' +
        (n ? '<label class="campo ancho"><span class="req">Descripción</span><input id="x-d" maxlength="200"></label><label class="campo"><span>Categoría</span><select id="x-cat">' + D.categorias.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('') + '</select></label>' : '') +
        '<label class="campo"><span>Unidad</span><input id="x-u" maxlength="40" value="' + esc(l.unidad) + '"' + (!n && l.item_id ? ' disabled' : '') + '></label>' +
        '<label class="campo"><span class="req">Cantidad</span><input id="x-c" type="number" min="0" step="any" value="' + l.cantidad + '"></label>' +
        '<label class="campo"><span>Días</span><input id="x-di" type="number" min="1" max="60" value="' + l.dias + '"></label>' +
        (ps ? '<label class="campo"><span>Valor unitario (COP)</span><input id="x-p" inputmode="numeric" value="' + (l.precio == null ? '' : Math.round(l.precio)) + '" placeholder="Sin precio"></label>' +
          '<label class="campo"><span>Grupo en el convenio</span><select id="x-g">' + D.grupos.map(function (g) { return '<option' + (g === l.grupo ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') + '</select></label>' : '') +
        '<label class="campo ancho"><span>Nota</span><input id="x-n" maxlength="500" value="' + esc(l.nota || '') + '"></label></div>' + (!ps ? '<p class="meta" style="margin:0">Los valores los asigna el área de Presupuesto.</p>' : ''),
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar</button>');
      $('#x-ok', m.el).onclick = function () {
        var d = { contrato_id: id, id: n ? 0 : l.id, cantidad: $('#x-c', m.el).value, dias: $('#x-di', m.el).value, nota: $('#x-n', m.el).value, unidad: $('#x-u', m.el).value };
        if (n) { d.descripcion = $('#x-d', m.el).value; d.categoria = $('#x-cat', m.el).value; }
        if (ps) { d.precio = soloDig($('#x-p', m.el).value); d.grupo = $('#x-g', m.el).value; }
        api('ppto_linea_guardar', d).then(function () { m.cerrar(); cargar(); }, function (e) { errorEn(m, e.error); });
      };
    }
    function responder(e) {
      var l = D.ppto.lineas.find(function (x) { return +x.especial_id === +e.id; }) || { descripcion: e.texto.slice(0, 200), categoria: 'Otros', unidad: 'unidad', cantidad: parseFloat(e.cantidad) || 1, dias: 1, precio: null, grupo: 'Bienes y servicios' };
      var m = modal('Solicitud especial', '<p style="margin:0"><b>' + esc(e.texto) + '</b>' + (e.cantidad ? ' · cantidad: ' + esc(e.cantidad) : '') + '</p>' +
        '<label class="campo"><span>Respuesta</span><select id="x-e">' + D.especial_estados.map(function (s) { return '<option' + (s === e.estado ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select></label>' +
        '<div id="x-apr" class="form-grid"><label class="campo ancho"><span>Se agrega al presupuesto como</span><input id="x-d" maxlength="200" value="' + esc(l.descripcion) + '"></label>' +
          '<label class="campo"><span>Categoría</span><select id="x-cat">' + D.categorias.map(function (c) { return '<option' + (c === l.categoria ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
          '<label class="campo"><span>Unidad</span><input id="x-u" maxlength="40" value="' + esc(l.unidad) + '"></label><label class="campo"><span>Cantidad</span><input id="x-c" type="number" min="0" step="any" value="' + l.cantidad + '"></label>' +
          '<label class="campo"><span>Días</span><input id="x-di" type="number" min="1" max="60" value="' + l.dias + '"></label><label class="campo"><span>Valor unitario (COP)</span><input id="x-p" inputmode="numeric" value="' + (l.precio == null ? '' : Math.round(l.precio)) + '"></label>' +
          '<label class="campo"><span>Grupo en el convenio</span><select id="x-g">' + D.grupos.map(function (g) { return '<option' + (g === l.grupo ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') + '</select></label>' +
          '<label class="campo"><span>Área que lo prepara</span><select id="x-ar"><option value="">Según la categoría</option>' + (D.areas || []).map(function (a) { return '<option' + (a === l.area ? ' selected' : '') + '>' + esc(a) + '</option>'; }).join('') + '</select></label></div>' +
        '<label class="campo"><span id="x-rl">Mensaje para el cliente</span><textarea id="x-r" maxlength="1500" placeholder="Ej. Lo conseguimos con un proveedor aliado; se entrega instalado el día anterior.">' + esc(e.respuesta || '') + '</textarea></label>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar respuesta</button>', { ancho: true });
      function ver() { var s = $('#x-e', m.el).value; $('#x-apr', m.el).hidden = s !== 'Aprobada'; $('#x-rl', m.el).className = s === 'No es posible' || s === 'En consulta' ? 'req' : ''; }
      $('#x-e', m.el).onchange = ver; ver();
      $('#x-ok', m.el).onclick = function () {
        api('ppto_especial_responder', { id: e.id, estado: $('#x-e', m.el).value, respuesta: $('#x-r', m.el).value, descripcion: $('#x-d', m.el).value, categoria: $('#x-cat', m.el).value, unidad: $('#x-u', m.el).value,
          cantidad: $('#x-c', m.el).value, dias: $('#x-di', m.el).value, precio: soloDig($('#x-p', m.el).value), grupo: $('#x-g', m.el).value, area: $('#x-ar', m.el).value }).then(function () { m.cerrar(); cargar(); }, function (x) { errorEn(m, x.error); });
      };
    }
    cargar();
    return { recargar: cargar };
  }

  function exportarPpto(D) {
    if (!window.XLSX) return toast('No se pudo cargar el generador de Excel.', 'error');
    var c = D.contrato, P = D.ppto, T = P.totales;
    var aoa = [['CLEMI · Presupuesto ' + c.codigo], [c.cliente + ' · ' + c.curso], [rangoCT(c) + ' · ' + c.sala_nombre + (c.participantes ? ' · ' + c.participantes + ' participantes' : '') + (c.estaciones ? ' · ' + c.estaciones + ' estaciones' : '')], [],
      ['Categoría', 'Elemento', 'Unidad', 'Cantidad', 'Días', 'Valor unitario', 'Total', 'Nota']];
    P.lineas.forEach(function (l) { aoa.push([l.categoria, l.descripcion, l.unidad, +l.cantidad, +l.dias, l.precio == null ? '' : Math.round(l.precio), l.total == null ? '' : l.total, l.nota || '']); });
    aoa.push([]);
    Object.keys(T.grupos).forEach(function (g) { aoa.push(['', g, '', '', '', '', T.grupos[g]]); });
    if (T.admin_pct) aoa.push(['', 'Administración CLEMI (' + T.admin_pct + '%)', '', '', '', '', T.admin]);
    aoa.push(['', 'Subtotal', '', '', '', '', T.subtotal], ['', 'IVA (' + T.iva_pct + '%)', '', '', '', '', T.iva], ['', 'Total IVA incluido', '', '', '', '', T.total]);
    if (P.especiales.length) { aoa.push([], ['Solicitudes especiales'], ['Solicitud', 'Cantidad', 'Respuesta', 'Detalle']); P.especiales.forEach(function (e) { aoa.push([e.texto, e.cantidad, e.estado, e.respuesta || '']); }); }
    if (P.nota) aoa.push([], ['Nota', P.nota]);
    var wb = XLSX.utils.book_new(), h = XLSX.utils.aoa_to_sheet(aoa);
    h['!cols'] = [22, 44, 16, 10, 7, 15, 16, 30].map(function (w) { return { wch: w }; });
    XLSX.utils.book_append_sheet(wb, h, 'Presupuesto');
    guardarArchivo(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Presupuesto-' + c.codigo + '.xlsx').catch(falla);
  }

  // Documento del contrato (Word) — pestaña de Operaciones
  function panelDocumento(cont, id) {
    var D = null;
    function cargar() { return api('ppto&id=' + id).then(function (j) { D = j; pintar(); }, function (e) { cont.innerHTML = '<div class="vacio">' + esc(e.error) + '</div>'; }); }
    function pintar() {
      var c = D.contrato, d = D.doc.datos, P = D.ppto, T = P.totales, cl = D.doc.clemi;
      var listo = P.estado === 'aceptado';
      cont.innerHTML = '<div class="dos-col"><div class="panel"><div class="panel-cab"><h2>Convenio en Word</h2></div><div class="panel-cuerpo">' +
        '<p style="margin:0 0 10px">Se genera con el formato del convenio vigente de CLEMI: partes, objeto, alcance (desde el presupuesto), valor y forma de pago, responsabilidades, número de participantes, <b>Cláusula Séptima de confidencialidad y uso de imagen</b>, fuerza mayor, cancelación, controversias y vigencia, más la Política de Uso de Imagen como Anexo 1.</p>' +
        (listo ? '<p class="cl-aviso ok" style="margin:0 0 10px">Presupuesto aceptado por el cliente · ' + pesos(T.total) + ' IVA incluido.</p>' : '<p class="cl-aviso" style="margin:0 0 10px">' + (P.versiones.length ? 'El presupuesto aún no está aceptado por el cliente (' + esc((PPTO_EST[P.estado] || [P.estado])[0]) + ').' : 'Todavía no hay presupuesto emitido.') + ' Puede generar un borrador, pero los valores pueden cambiar.</p>') +
        (D.doc.faltan.length ? '<p class="pp-aviso" style="margin:0 0 10px">Falta para que el convenio salga completo: ' + D.doc.faltan.map(esc).join(' · ') + '. Esos espacios quedan en blanco (______).</p>' : '') +
        (!D.doc.zip ? '<p class="form-error" style="margin:0 0 10px">El servidor no tiene la extensión ZIP de PHP: pida al hosting activarla para generar archivos de Word.</p>' : '') +
        '<label class="check"><input type="checkbox" id="dc-g" checked>Guardar una copia en Documentos del convenio</label>' +
        '<div class="acciones" style="margin-top:12px"><button class="btn" id="dc-ed" type="button">Datos del convenio</button><button class="btn btn-oro" id="dc-gen" type="button">Descargar convenio (Word)</button>' + (esAdmin() ? '<button class="btn" id="dc-cl" type="button">Datos de CLEMI</button>' : '') + '</div></div></div>' +
        '<div class="panel"><div class="panel-cab"><h2>Datos que van en el documento</h2></div><div class="datos-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
          dato('Contratante', c.cliente + (d.sigla ? ' (' + d.sigla + ')' : '')) + dato('NIT', c.nit || '—') + dato('Representante legal', d.rep_legal || '—') + dato('Documento', d.rep_doc ? d.rep_tipo_doc + ' ' + d.rep_doc : '—') +
          dato('Domicilio y dirección', d.domicilio + (d.direccion ? ' · ' + d.direccion : '')) + dato('Facturación', d.razon_factura + (d.correo_factura ? ' · ' + d.correo_factura : '')) +
          dato('Tipo de actividad', d.tipo_actividad) + dato('Enlace(s)', d.enlaces || '—') + dato('Representante de CLEMI', cl.rep_legal + (cl.rep_doc ? ' · C.C. ' + cl.rep_doc : ' · cédula sin registrar')) + dato('Valor', pesos(T.total)) + '</div></div></div>';
      $('#dc-ed', cont).onclick = editar;
      $('#dc-gen', cont).onclick = function () { descargarContrato(c, $('#dc-g', cont).checked); };
      var b = $('#dc-cl', cont); if (b) b.onclick = function () { datosCLEMI(cl, cargar); };
    }
    function editar() {
      var d = D.doc.datos;
      var inp = function (k, l, ph, extra) { return '<label class="campo' + (extra || '') + '"><span>' + l + '</span><input id="d-' + k + '" value="' + esc(d[k] == null ? '' : d[k]) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + ' maxlength="1500"></label>'; };
      var ta = function (k, l, ph) { return '<label class="campo ancho"><span>' + l + '</span><textarea id="d-' + k + '" maxlength="1500"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>' + esc(d[k] || '') + '</textarea></label>'; };
      var m = modal('Datos del convenio', '<div class="ct-sec">Parte contratante</div><div class="form-grid">' +
          inp('sigla', 'Sigla', 'Ej. AOLAT') + inp('tipo_entidad', 'Tipo de entidad') + inp('domicilio', 'Domicilio') + inp('direccion', 'Dirección principal', 'Calle, número, oficina') +
          inp('rep_legal', 'Representante legal') + '<label class="campo"><span>Tipo de documento</span><select id="d-rep_tipo_doc">' + ['cédula de ciudadanía', 'cédula de extranjería', 'pasaporte'].map(function (x) { return '<option' + (x === d.rep_tipo_doc ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>' +
          inp('rep_doc', 'Número de documento') + '</div>' +
        '<div class="ct-sec">Actividad</div><div class="form-grid">' +
          '<label class="campo"><span>Tipo de actividad</span><select id="d-tipo_actividad">' + ['Cerrada', 'Abierta'].map(function (x) { return '<option' + (x === d.tipo_actividad ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>' +
          inp('salas', 'Salas', 'Ej. 1 sala de entrenamiento') + ta('objetivo', 'Lo que requiere el contratante (considerando)', 'Ej. servicios de capacitación especializada con modelos anatómicos para el entrenamiento en cirugía endoscópica de columna posterior') +
          inp('dirigido_a', 'Dirigido a', '', ' ancho') + ta('asistentes', 'Total de asistentes', 'Ej. 44 (24 participantes, 3 directores, 4 instructores, …)') + ta('directores', 'Directores de la actividad') + ta('instructores', 'Instructores') + ta('enlaces', 'Enlace(s) del contratante', 'Nombre y correo') + '</div>' +
        '<div class="ct-sec">Alcance</div><div class="form-grid">' + ta('exclusiones', 'No se incluye', 'Ej. hospedaje, equipos especializados para columna, lentes ni motores') + ta('aportes_contratante', 'Lo que aporta el contratante o la industria', 'Ej. los arcos en C adicionales, los lentes y los motores requeridos') + '</div>' +
        '<div class="ct-sec">Facturación y plazos</div><div class="form-grid">' + inp('razon_factura', 'Factura a nombre de') + inp('nit_factura', 'NIT de facturación') + inp('correo_factura', 'Correo de facturación') +
          inp('pago1_dias', 'Días para el primer pago') + inp('pago2_dias', 'Días para el saldo (después del curso)') + inp('dias_participantes', 'Días antes para la lista de participantes') + inp('dias_cambios', 'Días antes para avisar cambios') + '</div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar</button>', { ancho: true });
      $('#x-ok', m.el).onclick = function () {
        var o = { contrato_id: id };
        $$('[id^="d-"]', m.el).forEach(function (x) { o[x.id.slice(2)] = x.value; });
        api('contrato_doc_datos', o).then(function () { m.cerrar(); toast('Datos guardados.'); cargar(); }, function (e) { errorEn(m, e.error); });
      };
    }
    cargar();
  }
  function datosCLEMI(cl, luego) {
    var f = function (k, l) { return '<label class="campo' + (k === 'razon' ? ' ancho' : '') + '"><span>' + l + '</span><input id="c-' + k + '" value="' + esc(cl[k] || '') + '"></label>'; };
    var m = modal('Datos de CLEMI en los convenios', '<div class="form-grid">' + f('razon', 'Razón social') + f('nit', 'NIT') + f('domicilio', 'Domicilio') + f('rep_legal', 'Representante legal') + f('rep_doc', 'Cédula de la representante legal') + f('ciudad_firma', 'Ciudad de firma') + '</div>' +
      '<p class="meta" style="margin:0">El convenio vigente usaba el NIT como número de cédula de la representante legal; escriba aquí la cédula correcta. La plataforma no incluye firmas escaneadas.</p>',
      '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar</button>');
    $('#x-ok', m.el).onclick = function () { var o = {}; $$('[id^="c-"]', m.el).forEach(function (x) { o[x.id.slice(2)] = x.value; }); api('clemi_datos_guardar', o).then(function () { m.cerrar(); toast('Datos de CLEMI guardados.'); luego(); }, function (e) { errorEn(m, e.error); }); };
  }
  function descargarContrato(c, guardar) {
    if (window.CLEMI_DEMO && window.CLEMI_DEMO.contratoDocx) return window.CLEMI_DEMO.contratoDocx(c, guardar);
    toast('Generando el convenio…');
    fetch('api.php?a=contrato_docx&id=' + c.id + (guardar ? '&guardar=1' : ''), { credentials: 'same-origin' }).then(function (r) {
      var ct = r.headers.get('Content-Type') || '';
      if (ct.indexOf('json') >= 0) return r.json().then(function (j) { throw j; });
      if (!r.ok) throw { error: 'No se pudo generar el convenio (' + r.status + ').' };
      var cd = r.headers.get('Content-Disposition') || '', mm = cd.match(/filename="([^"]+)"/);
      return r.blob().then(function (b) { return guardarArchivo(b, mm ? mm[1] : 'Contrato-' + c.codigo + '.docx'); });
    }).then(function () { if (guardar && S.vista && S.vista.refrescar) S.vista.refrescar(); }, falla);
  }

  // ------------------------------------------------------------ área Presupuesto
  // ================================================================== FIRMA ELECTRÓNICA DEL CONTRATO
  var FIRMA_TXT = { 'Por firmar el cliente': ['Esperando la firma del cliente', 'pe-pend'], 'Por firmar CLEMI': ['Firmado por el cliente · falta CLEMI', 'pe-sol'], 'Firmado': ['Firmado por las dos partes', 'pe-ok'], 'Anulado': ['Anulado', 'pe-sin'] };
  function chipFirma(e) { var t = FIRMA_TXT[e] || [e, '']; return '<span class="chip ' + t[1] + '">' + esc(t[0]) + '</span>'; }
  function claveCopiable(titulo, j, quien) {
    var txt = 'Portal de clientes CLEMI\n' + j.url + '\nUsuario: ' + j.usuario + '\nContraseña inicial: ' + j.clave + '\n(La plataforma le pedirá cambiarla en el primer ingreso.)';
    var m = modal(titulo, '<p style="margin:0">Entregue estos datos <b>personalmente</b> a ' + esc(quien) + ' (o por un canal privado). La contraseña <b>no se vuelve a mostrar</b> y no se envía por correo.</p>' +
      '<pre class="pt-cred">' + esc(txt) + '</pre>', '<button class="btn" id="x-cp" type="button">Copiar</button><button class="btn btn-verde" data-cerrar type="button">Listo</button>');
    $('#x-cp', m.el).onclick = function () { copiarTxt(txt, 'Datos de acceso copiados.'); };
  }
  function panelFirma(cont, id, recargarCT) {
    cont.innerHTML = '<div class="vacio">Cargando…</div>';
    api('firma_info&id=' + id).then(function (J) {
      if (!cont.isConnected) return;
      var f = J.firma, emp = J.clientes.find(function (x) { return +x.id === +J.cliente_id; });
      var listo = J.ppto_estado === 'aceptado' && !J.faltantes.length && J.cliente_id && J.usuarios_portal.some(function (u) { return +u.activo; });
      var pasos = '<ol class="fi-pasos">' +
        '<li class="' + (J.cliente_id ? 'ok' : '') + '"><b>Empresa en el portal</b><span>' + (emp ? esc(emp.razon) + ' · ' + J.usuarios_portal.filter(function (u) { return +u.activo; }).length + ' usuario(s) activo(s)' : 'Vincule el convenio a la empresa del cliente') + '</span>' +
          '<div class="fi-vinc"><select id="fi-cli"><option value="">— Sin vincular —</option>' + J.clientes.map(function (x) { return '<option value="' + x.id + '"' + (+x.id === +J.cliente_id ? ' selected' : '') + '>' + esc(x.razon) + (x.nit ? ' · ' + esc(x.nit) : '') + '</option>'; }).join('') + '</select><a class="btn-link" href="#/ct/clientes">Clientes</a></div></li>' +
        '<li class="' + (J.ppto_estado === 'aceptado' ? 'ok' : '') + '"><b>Presupuesto aceptado</b><span>' + chipPpto(J.ppto_estado) + '</span></li>' +
        '<li class="' + (J.faltantes.length ? '' : 'ok') + '"><b>Datos del documento</b><span>' + (J.faltantes.length ? 'Falta: ' + esc(J.faltantes.join(', ')) + ' · <a href="#/ct/contrato/' + id + '/documento">completar</a>' : 'Completos') + '</span></li>' +
        '<li class="' + (f && f.estado !== 'Anulado' ? 'ok' : '') + '"><b>Enviado a firma</b><span>' + (f ? 'Versión ' + f.version + ' · ' + esc(f.enviado_por) + ' · ' + momento(f.enviado_en) : 'Aún no') + '</span></li>' +
        '<li class="' + (f && f.cliente_firma ? 'ok' : '') + '"><b>Firma del cliente</b><span>' + (f && f.cliente_firma ? esc(f.cliente_firma.nombre + ' · ' + f.cliente_firma.cargo) + ' · ' + momento(f.cliente_firmado_en) : 'Pendiente') + '</span></li>' +
        '<li class="' + (f && f.clemi_firma ? 'ok' : '') + '"><b>Firma de CLEMI</b><span>' + (f && f.clemi_firma ? esc(f.clemi_firma.nombre) + ' · ' + momento(f.clemi_firmado_en) : 'Representante legal (Dra. Claudia Reyes)') + '</span></li></ol>';
      var acc = '';
      if (!f || f.estado !== 'Firmado') acc += '<button class="btn btn-oro" id="fi-env" type="button"' + (listo ? '' : ' disabled') + '>' + (f ? 'Enviar nueva versión a firma' : 'Enviar convenio a firma del cliente') + '</button>';
      if (f && f.estado !== 'Firmado') acc += '<button class="btn" id="fi-anu" type="button">Anular envío</button>';
      if (f && f.estado === 'Firmado') acc += '<a class="btn btn-verde" href="api.php?a=archivo_docx&id=' + f.id + '">Descargar convenio firmado (Word)</a><a class="btn" href="#/ct/archivo">Archivo de convenios</a>';
      cont.innerHTML = '<div class="dos-col fi-col"><div class="panel"><div class="panel-cab"><h2>Firma electrónica</h2>' + (f ? chipFirma(f.estado) : '') + '</div><div class="panel-cuerpo">' + pasos +
        '<div class="acciones" style="margin-top:12px">' + acc + '</div>' +
        '<p class="meta" style="margin:12px 0 0">El convenio que se envía queda congelado (con su huella SHA-256): lo que lee el cliente, lo que firman las dos partes y lo que se archiva es idéntico. Si cambia el presupuesto o los datos, envíe una nueva versión.</p></div>' +
        (J.historial.length ? '<div class="panel-cab" style="border-top:1px solid var(--linea)"><h2>Versiones</h2></div><ul class="lista-simple">' + J.historial.map(function (h) { return '<li><b>v' + h.version + '</b> ' + chipFirma(h.estado) + ' <span class="meta">' + momento(h.enviado_en) + (h.anulado_motivo ? ' · ' + esc(h.anulado_motivo) : '') + '</span></li>'; }).join('') + '</ul>' : '') + '</div>' +
        '<div class="panel"><div class="panel-cab"><h2>Convenio enviado</h2>' + (f ? '<span class="meta">huella ' + esc(f.hash.slice(0, 16)) + '…</span>' : '') + '</div><div class="panel-cuerpo">' + (f ? f.html : '<p class="meta" style="margin:0">Cuando lo envíe, aquí verá exactamente lo que el cliente lee y firma.</p>') + '</div></div></div>';
      $('#fi-cli').onchange = function () { api('contrato_cliente', { contrato_id: id, cliente_id: this.value }).then(function () { toast('Convenio vinculado.'); panelFirma(cont, id, recargarCT); }, falla); };
      var b;
      if ((b = $('#fi-env'))) b.onclick = function () {
        var m = modal('Enviar a firma', '<p style="margin:0">Se congela el convenio con el presupuesto aceptado y los datos actuales, y se avisa por correo a los usuarios del portal de <b>' + esc(emp ? emp.razon : '') + '</b> para que lo lean y firmen.' + (f ? ' La versión ' + f.version + ' queda anulada.' : '') + '</p>',
          '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="x-ok" type="button">Enviar</button>');
        $('#x-ok', m.el).onclick = function () { this.disabled = true; api('firma_enviar', { contrato_id: id }).then(function (j) { m.cerrar(); toast('<b>Convenio enviado a firma</b> (versión ' + j.version + ').' + (j.correos ? ' Aviso enviado a ' + j.correos + ' correo(s).' : ' No se pudo enviar el correo: avise al cliente.')); recargarCT(); }, function (x) { errorEn(m, x.error); $('#x-ok', m.el).disabled = false; }); };
      };
      if ((b = $('#fi-anu'))) b.onclick = function () {
        var m = modal('Anular envío a firma', '<label class="campo"><span class="req">Motivo</span><textarea id="x-m" maxlength="500"></textarea></label>', '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-peligro" id="x-ok" type="button">Anular</button>');
        $('#x-ok', m.el).onclick = function () { api('firma_anular', { id: f.id, motivo: $('#x-m', m.el).value }).then(function () { m.cerrar(); recargarCT(); }, function (x) { errorEn(m, x.error); }); };
      };
    }, function (e) { cont.innerHTML = '<div class="vacio">' + esc(e.error) + '</div>'; });
  }

  // Bandeja de la representante legal.
  function vFirmas(p) {
    if (p[0]) return vFirmaVer(+p[0]);
    api('firmas').then(function (J) {
      var fila = function (r, link) {
        return '<tr data-id="' + r.id + '"><td class="num"><b>' + esc(r.codigo) + '</b><br><span class="meta">v' + r.version + '</span></td><td><b>' + esc(r.cliente) + '</b><br><span class="meta">' + esc(r.curso) + '</span></td>' +
          '<td>' + esc(fCorta(r.fecha_inicio)) + '</td><td>' + esc(r.firmante || '—') + (r.cliente_firmado_en ? '<br><span class="meta">' + momento(r.cliente_firmado_en) + '</span>' : '') + '</td><td class="num">' + pesos(r.total) + '</td><td>' + (r.clemi_firmado_en ? momento(r.clemi_firmado_en) : link) + '</td></tr>';
      };
      var tabla = function (L, link, vacio) { return L.length ? '<div class="tabla-wrap"><table class="tabla tabla-click"><thead><tr><th>Convenio</th><th>Cliente y curso</th><th>Inicio</th><th>Firmó el cliente</th><th class="num">Valor</th><th></th></tr></thead><tbody>' + L.map(function (r) { return fila(r, link); }).join('') + '</tbody></table></div>' : '<div class="vacio">' + vacio + '</div>'; };
      montar('<div class="vista-cab"><div><div class="eyebrow">Representante legal</div><h1>Firma de convenios</h1><p>Convenios ya firmados por el cliente que esperan la firma de CLEMI. Léalos completos antes de firmar: al firmar, el convenio queda archivado y pasa a preparación.</p></div></div>' +
        '<div class="kpis"><div class="kpi is-on"><b>' + J.pendientes.length + '</b><span>por firmar</span></div><div class="kpi"><b>' + J.esperando_cliente.length + '</b><span>esperando al cliente</span></div><div class="kpi"><b>' + J.firmados.length + '</b><span>firmados recientes</span></div></div>' +
        (!J.clemi.rep_doc && J.puede_firmar ? '<div class="aviso-cambios" style="position:static">Falta su número de cédula en los datos de CLEMI del contrato. Pídale a la administradora que lo registre.</div>' : '') +
        '<div class="panel"><div class="panel-cab"><h2>Por firmar</h2></div>' + tabla(J.pendientes, '<span class="btn btn-sm btn-oro">' + (J.puede_firmar ? 'Leer y firmar' : 'Leer') + '</span>', 'No hay convenios esperando su firma.') + '</div>' +
        '<div class="panel"><div class="panel-cab"><h2>Firmados recientemente</h2></div>' + tabla(J.firmados, '', 'Aún no hay convenios firmados.') + '</div>' +
        '<div class="panel"><div class="panel-cab"><h2>Esperando la firma del cliente</h2></div>' + tabla(J.esperando_cliente, '<span class="meta">—</span>', 'Ninguno.') + '</div>');
      $$('#main tr[data-id]').forEach(function (tr) { tr.onclick = function () { location.hash = '#/firmas/' + tr.getAttribute('data-id'); }; });
    }, falla);
    S.vista = { refrescar: function () { vFirmas(p); } };
  }
  function vFirmaVer(fid) {
    api('firma_ver&id=' + fid).then(function (J) {
      var f = J.firma;
      montar('<a class="miga" href="#/firmas">← Firma de convenios</a><div class="vista-cab"><div><div class="eyebrow">' + esc(J.contrato.codigo) + ' · versión ' + f.version + '</div><h1>' + esc(J.contrato.cliente) + '</h1><p>' + esc(J.contrato.curso) + '</p></div>' + chipFirma(f.estado) + '</div>' +
        (J.hash_ok ? '' : '<div class="form-error">La huella del contenido no coincide con la registrada. No firme y avise a Operaciones.</div>') +
        '<div class="panel"><div class="panel-cuerpo">' + J.html + '</div></div><p class="meta">Huella del contenido (SHA-256): <code>' + esc(f.hash) + '</code></p>' +
        (J.puede_firmar ? '<div class="panel"><div class="panel-cab"><h2>Firmar por CLEMI</h2></div><div class="panel-cuerpo" style="display:flex;flex-direction:column;gap:12px;max-width:620px">' +
          '<p class="meta" style="margin:0">Firma <b>' + esc(S.yo.nombre) + '</b> como representante legal de la Fundación CLEMI.</p>' +
          '<div class="campo"><span class="req">Firma</span><div id="x-firma"></div></div>' +
          '<label class="check"><input type="checkbox" id="x-l">Leí el convenio completo, con sus cláusulas y anexos, y lo firmo en nombre de CLEMI.</label>' +
          '<label class="campo" style="max-width:320px"><span class="req">Su contraseña</span><input type="password" id="x-k" autocomplete="current-password"><small>Confirma que es usted quien firma.</small></label>' +
          '<p class="form-error" id="x-err" hidden></p><button class="btn btn-oro btn-grande" id="x-ok" type="button">Firmar convenio</button></div></div>' : ''));
      if (!J.puede_firmar) return;
      var fm = new Firma($('#x-firma'));
      $('#x-ok').onclick = function () {
        var er = $('#x-err'), mal = function (t) { er.textContent = t; er.hidden = false; }; er.hidden = true;
        var img = fm.valor(); if (!img) return mal('Dibuje su firma.');
        if (!$('#x-l').checked) return mal('Confirme que leyó el contrato.');
        var b = this; b.disabled = true; b.textContent = 'Firmando y archivando…';
        api('firma_clemi', { id: fid, firma: img, leido: 1, clave: $('#x-k').value }).then(function () { toast('<b>Convenio firmado.</b> Quedó archivado y pasa a preparación.'); location.hash = '#/firmas'; }, function (e) { b.disabled = false; b.textContent = 'Firmar convenio'; mal(e.error); });
      };
    }, function (e) { montar('<a class="miga" href="#/firmas">← Firma de convenios</a><div class="vacio">' + esc(e.error) + '</div>'); });
  }

  // ================================================================== ARCHIVO DE CONTRATOS
  function vArchivo() {
    if (!puedeCT()) { location.hash = AREA_INICIO[areasYo()[0]]; return; }
    var D = null, q = '';
    function pintar() {
      if (!$('#ar-l')) return;
      var L = D.contratos.filter(function (r) { return !q || (r.codigo + ' ' + r.cliente + ' ' + r.nit + ' ' + r.curso).toLowerCase().indexOf(q) >= 0; });
      $('#ar-l').innerHTML = L.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Convenio</th><th>Cliente y curso</th><th>Fechas</th><th>Firmas</th><th class="num">Valor</th><th>Huella</th><th></th></tr></thead><tbody>' + L.map(function (r) {
        return '<tr><td class="num"><a href="#/ct/contrato/' + r.contrato_id + '/firma"><b>' + esc(r.codigo) + '</b></a><br><span class="meta">v' + r.version + '</span></td><td><b>' + esc(r.cliente) + '</b>' + (r.nit ? ' <span class="meta">NIT ' + esc(r.nit) + '</span>' : '') + '<br><span class="meta">' + esc(r.curso) + '</span></td>' +
          '<td style="white-space:nowrap">' + esc(rangoCT(r)) + '</td><td><span class="meta">Cliente:</span> ' + esc(r.cliente_firma ? r.cliente_firma.nombre : '—') + ' · ' + momento(r.cliente_firmado_en) + '<br><span class="meta">CLEMI:</span> ' + esc(r.clemi_firma ? r.clemi_firma.nombre : '—') + ' · ' + momento(r.clemi_firmado_en) + '</td>' +
          '<td class="num">' + pesos(r.total) + '</td><td><code class="meta" title="' + esc(r.hash) + '">' + esc(r.hash.slice(0, 12)) + '…</code></td><td><a class="btn btn-sm" href="api.php?a=archivo_docx&id=' + r.id + '">Word</a></td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="vacio">' + (D.contratos.length ? 'Sin resultados.' : 'Aún no hay convenios firmados por las dos partes.') + '</div>';
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">1 · Negociación del evento</div><h1>Archivo de convenios</h1><p>Convenios firmados electrónicamente por las dos partes, con su documento en Word, la constancia de firma y la huella SHA-256. Solo lo ven la administradora y Operaciones (Natalia Cogua, Laura Andrade y Julieth Hernández).</p></div></div>' +
      '<div class="panel"><div class="panel-cab"><input type="search" id="ar-q" placeholder="Buscar cliente, NIT, curso, código…" style="max-width:340px"><span class="meta" id="ar-n"></span></div><div id="ar-l"><div class="vacio">Cargando…</div></div></div>');
    $('#ar-q').oninput = function () { q = this.value.toLowerCase().trim(); pintar(); };
    api('archivo_lista').then(function (j) { D = j; if (!$('#ar-n')) return; $('#ar-n').textContent = j.contratos.length + ' convenio(s)' + (j.anulados ? ' · ' + j.anulados + ' versión(es) anulada(s) en el historial' : ''); pintar(); }, falla);
  }

  // ================================================================== CLIENTES DEL PORTAL
  function vClientes() {
    if (!puedeCT()) { location.hash = AREA_INICIO[areasYo()[0]]; return; }
    var D = null, q = '';
    function cargar() { return api('clientes').then(function (j) { D = j; pintar(); }, falla); }
    function pintar() {
      if (!$('#cli-l')) return;
      var L = D.clientes.filter(function (c) { return !q || (c.razon + ' ' + c.nit + ' ' + c.usuarios.map(function (u) { return u.nombre + ' ' + u.usuario; }).join(' ')).toLowerCase().indexOf(q) >= 0; });
      $('#cli-l').innerHTML = L.length ? L.map(function (c) {
        return '<div class="panel cli-emp' + (+c.activo ? '' : ' inactivo') + '"><div class="panel-cab"><div><h2>' + esc(c.razon) + (+c.activo ? '' : ' <span class="chip pe-sin">inactiva</span>') + '</h2><span class="meta">' + (c.nit ? 'NIT ' + esc(c.nit) : 'Sin NIT') + (c.rep_legal ? ' · Rep. legal ' + esc(c.rep_legal) : '') + '</span></div>' +
          '<div class="acciones"><button class="btn btn-sm" data-emp="' + c.id + '" type="button">Editar empresa</button><button class="btn btn-sm btn-oro" data-nu="' + c.id + '" type="button">+ Usuario</button></div></div>' +
          (c.usuarios.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Usuario del portal</th><th>Nombre y cargo</th><th>Correo</th><th>Último ingreso</th><th></th></tr></thead><tbody>' + c.usuarios.map(function (u) {
            return '<tr' + (+u.activo ? '' : ' class="inactivo"') + '><td class="num"><b>' + esc(u.usuario) + '</b>' + (+u.activo ? '' : ' <span class="chip pe-sin">inactivo</span>') + (+u.debe_cambiar ? '<br><span class="meta">Aún con la contraseña inicial</span>' : '') + '</td><td>' + esc(u.nombre) + (u.cargo ? '<br><span class="meta">' + esc(u.cargo) + '</span>' : '') + '</td>' +
              '<td>' + esc(u.correo || '—') + '</td><td>' + (u.ultimo_ingreso ? momento(u.ultimo_ingreso) : '<span class="meta">Nunca</span>') + '</td><td style="white-space:nowrap"><button class="btn btn-sm" data-us="' + u.id + '" type="button">Editar</button> <button class="btn btn-sm" data-cl="' + u.id + '" type="button">Nueva contraseña</button></td></tr>';
          }).join('') + '</tbody></table></div>' : '<div class="panel-cuerpo meta">Sin usuarios. Cree el primero con «+ Usuario».</div>') +
          (c.solicitudes.length ? '<div class="panel-cuerpo cli-sol">' + c.solicitudes.map(function (s) { return '<a class="chip" href="#/ct/contrato/' + s.id + '">' + esc(s.codigo) + ' · ' + esc(s.curso) + ' · ' + esc(s.estado) + '</a>'; }).join(' ') + '</div>' : '') + '</div>';
      }).join('') : '<div class="vacio">' + (D.clientes.length ? 'Sin resultados.' : 'Aún no hay empresas. Cree la primera con «+ Nueva empresa».') + '</div>';
      $$('#cli-l [data-emp]').forEach(function (b) { b.onclick = function () { empresa(D.clientes.find(function (c) { return +c.id === +b.getAttribute('data-emp'); })); }; });
      $$('#cli-l [data-nu]').forEach(function (b) { b.onclick = function () { usuario(null, +b.getAttribute('data-nu')); }; });
      $$('#cli-l [data-us]').forEach(function (b) { b.onclick = function () { var u = null; D.clientes.forEach(function (c) { c.usuarios.forEach(function (x) { if (+x.id === +b.getAttribute('data-us')) u = x; }); }); usuario(u); }; });
      $$('#cli-l [data-cl]').forEach(function (b) { b.onclick = function () {
        var u = null; D.clientes.forEach(function (c) { c.usuarios.forEach(function (x) { if (+x.id === +b.getAttribute('data-cl')) u = x; }); });
        var m = modal('Nueva contraseña', '<p style="margin:0">Se genera una contraseña nueva para <b>' + esc(u.nombre) + '</b> (' + esc(u.usuario) + '). La anterior deja de funcionar y deberá cambiarla en su próximo ingreso.</p>', '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="x-ok" type="button">Generar</button>');
        $('#x-ok', m.el).onclick = function () { api('cliente_usuario_clave', { id: u.id }).then(function (j) { m.cerrar(); claveCopiable('Nueva contraseña', j, u.nombre); cargar(); }, function (x) { errorEn(m, x.error); }); };
      }; });
      $('#cli-sin').innerHTML = D.sin_cliente.length ? '<div class="panel"><div class="panel-cab"><h2>Solicitudes y convenios sin empresa del portal</h2><span class="meta">Vincúlelos para que el cliente los vea y firme en el portal</span></div><div class="tabla-wrap"><table class="tabla"><tbody>' +
        D.sin_cliente.map(function (c) { return '<tr><td class="num"><a href="#/ct/contrato/' + c.id + '/firma"><b>' + esc(c.codigo) + '</b></a></td><td><b>' + esc(c.cliente) + '</b><br><span class="meta">' + esc(c.curso) + '</span></td><td>' + chipCT(c.estado) + '</td><td><select data-vc="' + c.id + '"><option value="">Vincular a…</option>' +
          D.clientes.filter(function (x) { return +x.activo; }).map(function (x) { return '<option value="' + x.id + '">' + esc(x.razon) + (x.nit && x.nit === c.nit ? ' (mismo NIT)' : '') + '</option>'; }).join('') + '</select></td></tr>'; }).join('') + '</tbody></table></div></div>' : '';
      $$('#cli-sin [data-vc]').forEach(function (s) { s.onchange = function () { if (!s.value) return; api('contrato_cliente', { contrato_id: s.getAttribute('data-vc'), cliente_id: s.value }).then(function () { toast('Vinculado.'); cargar(); }, falla); }; });
    }
    function empresa(c) {
      var n = !c; c = c || { activo: 1, rep_tipo_doc: 'cédula de ciudadanía', tipo_entidad: 'entidad de derecho privado' };
      var cp = function (k, l, max, req) { return '<label class="campo"><span' + (req ? ' class="req"' : '') + '>' + l + '</span><input id="e-' + k + '" maxlength="' + max + '" value="' + esc(c[k] || '') + '"></label>'; };
      var m = modal(n ? 'Nueva empresa cliente' : c.razon, '<div class="form-grid">' + cp('razon', 'Razón social', 200, 1) + cp('nit', 'NIT', 40) + cp('sigla', 'Sigla', 40) + cp('tipo_entidad', 'Tipo de entidad', 120) + cp('domicilio', 'Domicilio (ciudad)', 160) + cp('direccion', 'Dirección', 200) +
        cp('rep_legal', 'Representante legal', 160) + '<label class="campo"><span>Tipo de documento</span><select id="e-rep_tipo_doc">' + ['cédula de ciudadanía', 'cédula de extranjería', 'pasaporte'].map(function (t) { return '<option' + (t === c.rep_tipo_doc ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label>' +
        cp('rep_doc', 'Documento del representante', 40) + cp('correo_factura', 'Correo de facturación', 160) + cp('telefono', 'Teléfono', 40) +
        '<label class="campo ancho"><span>Notas internas</span><textarea id="e-notas" maxlength="2000">' + esc(c.notas || '') + '</textarea></label>' +
        '<label class="check"><input type="checkbox" id="e-activo"' + (+c.activo ? ' checked' : '') + '>Empresa activa (sus usuarios pueden entrar al portal)</label></div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar</button>', { ancho: true });
      $('#x-ok', m.el).onclick = function () {
        var d = { id: n ? 0 : c.id, activo: $('#e-activo', m.el).checked ? 1 : 0, notas: $('#e-notas', m.el).value };
        ['razon', 'nit', 'sigla', 'tipo_entidad', 'domicilio', 'direccion', 'rep_legal', 'rep_tipo_doc', 'rep_doc', 'correo_factura', 'telefono'].forEach(function (k) { d[k] = $('#e-' + k, m.el).value; });
        api('cliente_guardar', d).then(function (j) { m.cerrar(); toast('Empresa guardada.'); cargar().then(function () { if (n) usuario(null, j.id); }); }, function (x) { errorEn(m, x.error); });
      };
    }
    function usuario(u, cid) {
      var n = !u; u = u || { activo: 1 };
      var m = modal(n ? 'Nuevo usuario del portal' : u.nombre, '<div class="form-grid">' +
        '<label class="campo"><span class="req">Nombre completo</span><input id="u-n" maxlength="120" value="' + esc(u.nombre || '') + '"></label>' +
        '<label class="campo"><span>Cargo</span><input id="u-c" maxlength="120" value="' + esc(u.cargo || '') + '"></label>' +
        '<label class="campo"><span>Correo</span><input id="u-m" type="email" maxlength="160" value="' + esc(u.correo || '') + '"><small>Recibe los avisos de presupuesto y contrato.</small></label>' +
        '<label class="campo"><span>Teléfono</span><input id="u-t" maxlength="40" value="' + esc(u.telefono || '') + '"></label>' +
        '<label class="campo"><span class="req">Usuario para ingresar</span><input id="u-u" maxlength="120" autocapitalize="none" value="' + esc(u.usuario || '') + '" placeholder="nombre.apellido"></label>' +
        '<label class="check"><input type="checkbox" id="u-a"' + (+u.activo ? ' checked' : '') + '>Activo</label></div>' +
        (n ? '<p class="meta" style="margin:0">Al guardar se genera una contraseña inicial que verá una sola vez para entregarla personalmente.</p>' : ''),
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">' + (n ? 'Crear usuario' : 'Guardar') + '</button>');
      $('#u-n', m.el).oninput = function () { if (n && !$('#u-u', m.el).dataset.toc) $('#u-u', m.el).value = this.value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.').replace(/[^a-z0-9.]/g, ''); };
      $('#u-u', m.el).oninput = function () { this.dataset.toc = 1; };
      $('#x-ok', m.el).onclick = function () {
        api('cliente_usuario_guardar', { id: n ? 0 : u.id, cliente_id: cid, nombre: $('#u-n', m.el).value, cargo: $('#u-c', m.el).value, correo: $('#u-m', m.el).value, telefono: $('#u-t', m.el).value, usuario: $('#u-u', m.el).value, activo: $('#u-a', m.el).checked ? 1 : 0 })
          .then(function (j) { m.cerrar(); if (n) claveCopiable('Usuario creado', j, $('#u-n', m.el).value); else toast('Usuario guardado.'); cargar(); }, function (x) { errorEn(m, x.error); });
      };
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">1 · Negociación del evento</div><h1>Clientes del portal</h1><p>Una cuenta por empresa, con los usuarios que entran al portal de clientes a solicitar presupuestos, armar su sala y firmar sus contratos.</p></div>' +
      '<button class="btn btn-oro" id="cli-nueva" type="button">+ Nueva empresa</button></div>' +
      '<div class="panel"><div class="panel-cab"><input type="search" id="cli-q" placeholder="Buscar empresa, NIT o usuario…" style="max-width:340px"><span class="meta">Dirección del portal: <code id="cli-url"></code> <button class="btn-link" id="cli-cp" type="button">Copiar</button></span></div></div>' +
      '<div id="cli-l"><div class="vacio">Cargando…</div></div><div id="cli-sin"></div>');
    $('#cli-nueva').onclick = function () { empresa(null); };
    $('#cli-q').oninput = function () { q = this.value.toLowerCase().trim(); pintar(); };
    $('#cli-cp').onclick = function () { copiarTxt(D ? D.url_portal : '', 'Dirección copiada.'); };
    cargar().then(function () { if (D && $('#cli-url')) $('#cli-url').textContent = D.url_portal; });
  }

  // ================================================================== PREPARACIÓN (contratos firmados)
  var PREP_AREA = { op: 'Instrumentación', mo: 'Morgue', av: 'Audiovisuales', lg: 'Logística', bm: 'Biomédica (equipos)', ps: 'Almacén (insumos)' };
  var PREP_COL = { 'Pendiente': '#8E6C1C', 'En preparación': '#13466B', 'Listo': '#2E7D4F', 'No disponible': '#A93A32' };
  var OP_EST = { por_aceptar: ['Por aceptar', 'pe-cambio'], en_preparacion: ['En preparación', 'pe-enviado'], listo: ['Salas listas', 'pe-aprobado'] };
  function chipOp(e) { var x = OP_EST[e] || [e, '']; return '<span class="chip ' + x[1] + '">' + esc(x[0]) + '</span>'; }
  function barraOp(p) { return '<div class="op-prog"><div class="pct-barra ' + (p.pct >= 100 ? 'ok' : 'act') + '"><i style="width:' + p.pct + '%"></i></div><span><b>' + p.pct + ' %</b> · ' + p.listos + ' de ' + p.total + ' listos</span></div>'; }
  function vPrep(p) {
    if (p && p[0]) return vPrepDetalle(+p[0]);
    var D = null, filtro = S.prepFiltro || '', est = S.prepEst || '';
    function cargar() { return api('prep_lista').then(function (j) { D = j; if (filtro && D.areas.indexOf(filtro) < 0) filtro = ''; pintar(); }, falla); }
    function pintar() {
      if (!$('#pr-f')) return;
      var C0 = D.contratos;
      var k = function (n, t, x, cls) { return '<button type="button" class="kpi' + (cls ? ' ' + cls : '') + (est === x ? ' is-on' : '') + '" data-e="' + x + '"><b>' + n + '</b><span>' + t + '</span></button>'; };
      $('#pr-k').innerHTML = k(C0.length, 'convenios en la operación', '') + k(C0.filter(function (c) { return c.op_estado === 'por_aceptar'; }).length, 'por aceptar', 'por_aceptar', 'kpi-alerta') +
        k(C0.filter(function (c) { return c.op_estado === 'en_preparacion'; }).length, 'en preparación', 'en_preparacion') + k(C0.filter(function (c) { return c.op_estado === 'listo'; }).length, 'salas listas', 'listo');
      $$('#pr-k [data-e]').forEach(function (b) { b.onclick = function () { est = S.prepEst = b.getAttribute('data-e'); pintar(); }; });
      $('#pr-f').innerHTML = (D.areas.length > 1 ? ['<button type="button" data-a=""' + (!filtro ? ' class="on"' : '') + '>Todas las áreas</button>'] : []).concat(D.areas.map(function (a) { return '<button type="button" data-a="' + a + '"' + (filtro === a || D.areas.length === 1 ? ' class="on"' : '') + '>' + esc(PREP_AREA[a]) + '</button>'; })).join('');
      $$('#pr-f [data-a]').forEach(function (b) { b.onclick = function () { filtro = S.prepFiltro = b.getAttribute('data-a'); pintar(); }; });
      var C = C0.filter(function (c) { return !est || c.op_estado === est; }).map(function (c) {
        var L = c.lineas.filter(function (l) { return !filtro || l.prep === filtro; }), K = (c.checks || []).filter(function (x) { return !filtro || x.area === filtro; });
        return { c: c, L: L, K: K };
      }).filter(function (x) { return !filtro || x.L.length || x.K.length; });
      $('#pr-l').innerHTML = C.length ? C.map(function (x) {
        var c = x.c, n = diasPara(c.fecha_inicio), porA = c.op_estado === 'por_aceptar';
        var mio = x.L.filter(function (l) { return l.prep_estado === 'Listo'; }).length + x.K.filter(function (k2) { return k2.estado === 'Listo'; }).length, tot = x.L.length + x.K.length;
        var areasC = {}; c.lineas.forEach(function (l) { areasC[l.prep] = areasC[l.prep] || [0, 0]; areasC[l.prep][1]++; if (l.prep_estado === 'Listo') areasC[l.prep][0]++; }); (c.checks || []).forEach(function (k2) { areasC[k2.area] = areasC[k2.area] || [0, 0]; areasC[k2.area][1]++; if (k2.estado === 'Listo') areasC[k2.area][0]++; });
        return '<a class="panel prep-c op-card' + (porA ? ' por-aceptar' : '') + '" href="#/prep/' + c.id + '"><div class="panel-cab"><div><div class="eyebrow">' + esc(c.codigo) + ' · ' + esc(c.sala) + ' · ' + esc(rangoCT(c)) + ' · ' + esc(c.hora_ini) + '–' + esc(c.hora_fin) + (n >= 0 ? ' · inicia ' + faltan(c.fecha_inicio) : ' · en curso') + '</div><h2>' + esc(c.cliente) + ' · ' + esc(c.curso) + '</h2>' +
          '<span class="meta">' + [c.participantes ? c.participantes + ' participantes' : '', c.estaciones ? c.estaciones + ' estaciones' : '', c.componentes ? c.componentes + ' componentes' + (c.tipo_componente ? ' (' + c.tipo_componente + ')' : '') : ''].filter(Boolean).join(' · ') + '</span></div>' +
          '<div class="acciones">' + chipOp(c.op_estado) + '<span class="btn btn-sm' + (porA && D.puede_aceptar ? ' btn-oro' : '') + '">' + (porA ? (D.puede_aceptar ? 'Revisar y aceptar →' : 'Ver lo que llega →') : 'Abrir check list →') + '</span></div></div>' +
          '<div class="panel-cuerpo">' + (porA ? '<p class="op-aviso">Llegó de Administrativo con la negociación cerrada. ' + (D.puede_aceptar ? 'Revise el listado, la distribución de la sala, los componentes y lo solicitado, y pulse <b>Aceptar</b> para empezar a preparar.' : 'Instrumentación lo acepta para empezar a preparar.') + '</p>'
            : barraOp(c.progreso) + (filtro ? '<p class="meta" style="margin:6px 0 0">' + esc(PREP_AREA[filtro]) + ': <b>' + mio + ' de ' + tot + '</b> listos</p>' : '') +
              '<div class="op-areas">' + Object.keys(areasC).map(function (a) { var v = areasC[a]; return '<span class="chip ' + (v[0] === v[1] ? 'pe-aprobado' : 'pe-pend') + '">' + esc(PREP_AREA[a] || a) + ' ' + v[0] + '/' + v[1] + '</span>'; }).join(' ') + '</div>' +
              (c.op_aceptado_por ? '<p class="meta" style="margin:6px 0 0">Aceptado por ' + esc(c.op_aceptado_por) + ' · ' + momento(c.op_aceptado_en) + '</p>' : '')) + '</div></a>';
      }).join('') : '<div class="vacio"><strong>No hay convenios en este estado</strong>Cuando Administrativo cierre la negociación, el convenio llega aquí con todo lo que se cotizó para que Operaciones lo acepte y empiece a preparar las salas.</div>';
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">4 · La operación</div><h1>Preparación de salas</h1><p>Cada convenio llega con la negociación cerrada: listado de personas con su QR, distribución de la sala del cliente, componentes o segmentos y todo lo solicitado en la cotización. Operaciones lo <b>acepta</b> y pasa a <b>En preparación</b>; el avance sube a medida que cada área marca <b>Listo</b> en el check list, hasta <b>Salas listas</b>.</p></div></div>' +
      '<div class="kpis" id="pr-k"></div><div class="prep-f" id="pr-f"></div><div id="pr-l"><div class="vacio">Cargando…</div></div>');
    cargar();
    S.vista = { refrescar: cargar };
  }
  function vPrepDetalle(id) {
    var D = null, editor = null;
    function cargar() { return api('op_detalle&id=' + id).then(function (j) { D = j; pintar(); }, function (e) { montar('<a class="miga" href="#/prep">← Preparación de salas</a><div class="vacio"><strong>No se pudo abrir</strong>' + esc(e.error) + '</div>'); }); }
    function puedeA(a) { return esAdmin() || D.mis_areas.indexOf(a) >= 0; }
    function pintar() {
      var c = D.contrato, porA = c.op_estado === 'por_aceptar', sl = sala(c.sala_id);
      var personas = D.inscritos.length ? D.inscritos : D.listado.map(function (x) { return Object.assign({ codigo: '' }, x); });
      var R = cuentaRoles(personas);
      var grupos = {}; D.lineas.forEach(function (l) { (grupos[l.prep] = grupos[l.prep] || []).push(l); });
      var linea = function (l) {
        var col = PREP_COL[l.prep_estado] || '#555', ed = !porA && puedeA(l.prep);
        return '<tr><td><b>' + esc(l.descripcion) + '</b>' + (l.opcion ? ' · ' + esc(l.opcion) : '') + (l.especial ? ' <span class="chip pe-sol">especial</span>' : '') + '<br><span class="meta">' + esc(l.area) + ' · ' + esc(l.categoria) + (l.codigo ? ' · ' + esc(l.codigo) : '') + (l.nota ? ' · ' + esc(l.nota) : '') + '</span>' + (l.datos ? '<br>' + briefBtn(l.datos, 'data-op-br="' + l.id + '"') : '') + '</td>' +
          '<td class="num" style="white-space:nowrap"><b>' + numTxt(l.cantidad) + '</b> ' + esc(l.unidad) + (l.dias > 1 ? ' × ' + l.dias + ' días' : '') + '</td>' +
          '<td style="min-width:200px">' + (ed ? '<select data-pe="' + l.id + '" style="color:' + col + ';font-weight:700">' + ['Pendiente', 'En preparación', 'Listo', 'No disponible'].map(function (e) { return '<option' + (e === l.prep_estado ? ' selected' : '') + '>' + e + '</option>'; }).join('') + '</select>' : '<span class="chip" style="background:' + col + '1c;color:' + col + '">' + esc(l.prep_estado) + '</span>') +
          (l.prep_por ? '<br><span class="meta">' + esc(l.prep_por) + ' · ' + momento(l.prep_en) + (l.prep_nota ? ' · ' + esc(l.prep_nota) : '') + '</span>' : '') + '</td></tr>';
      };
      var check = function (k) {
        var ok = k.estado === 'Listo', ed = !porA && puedeA(k.area);
        return '<li class="op-ck' + (ok ? ' ok' : '') + '"><button type="button" class="op-ck-b"' + (ed ? ' data-ck="' + k.id + '" data-est="' + (ok ? 'Pendiente' : 'Listo') + '"' : ' disabled') + ' aria-label="' + (ok ? 'Marcar pendiente' : 'Marcar listo') + '">' + (ok ? '✓' : '') + '</button><div><b>' + esc(k.texto) + '</b><span class="meta">' + esc(PREP_AREA[k.area] || k.area) + (k.por ? ' · ' + (ok ? 'listo · ' : '') + esc(k.por) + ' · ' + momento(k.en) : '') + '</span></div></li>';
      };
      montar('<a class="miga" href="#/prep">← Preparación de salas</a>' +
        '<section class="ev-cab ct-cab"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="chip" style="background:rgba(255,255,255,.1);color:#e8efe9">' + esc(c.codigo) + '</span>' + chipOp(c.op_estado) + '</div>' +
          '<div class="ct-conv">' + esc(c.convenio) + '</div><h1 style="margin-top:2px">' + esc(c.curso) + '</h1>' +
          '<div class="ev-datos"><span><b>' + esc(c.cliente) + '</b></span><span>' + esc(c.salas_nombres || c.sala) + (c.salas_n > 1 ? ' (' + c.salas_n + ' salas)' : '') + '</span><span class="num">' + esc(rangoCT(c)) + ' · ' + esc(c.hora_ini) + '–' + esc(c.hora_fin) + '</span>' + (c.participantes ? '<span>' + c.participantes + ' participantes</span>' : '') + (c.instructores_n ? '<span>' + c.instructores_n + ' instructores</span>' : '') + (c.staff_n ? '<span>' + c.staff_n + ' staff</span>' : '') + (c.estaciones ? '<span>' + c.estaciones + ' estaciones</span>' : '') + '</div>' +
          '<div class="acciones">' + (D.evento && puedeOpAg() ? '<a class="btn" href="#/evento/' + D.evento.id + '">Ver en la agenda</a>' : '') + '</div></section>' +
        (porA ? '<div class="op-aceptar"><div><b>Llegó a Operaciones con la negociación cerrada.</b><span>Revise abajo el listado de personas, la distribución de la sala del cliente, los componentes y todo lo solicitado. Al aceptar, el entrenamiento queda en la agenda, cada persona recibe su código QR y el convenio pasa a <b>En preparación</b>.</span></div>' +
            (D.puede_aceptar ? '<button class="btn btn-oro btn-grande" id="op-acep" type="button">Aceptar y empezar a preparar</button>' : '<span class="meta">Lo acepta Instrumentación.</span>') + '</div>'
          : '<div class="op-estado">' + barraOp(D.progreso) + '<span class="meta">' + (c.op_aceptado_por ? 'Aceptado por ' + esc(c.op_aceptado_por) + ' · ' + momento(c.op_aceptado_en) : '') + (c.op_estado === 'listo' && c.op_listo_en ? ' · Salas listas desde ' + momento(c.op_listo_en) : '') + '</span></div>') +
        '<div class="op-grid">' +
        // Check list
        '<div class="panel op-sec"><div class="panel-cab"><h2>Check list de preparación</h2>' + (porA ? '<span class="meta">Se habilita al aceptar</span>' : '<span class="meta">Cada área marca lo suyo</span>') + '</div>' +
          (D.checks.length ? '<ul class="op-cks">' + D.checks.map(check).join('') + '</ul>' : '<div class="panel-cuerpo meta">' + (porA ? 'Al aceptar se agregan: sala montada según la distribución del cliente, listado con QR revisado, programa revisado y componentes preparados.' : '') + '</div>') +
          Object.keys(grupos).map(function (g) { return '<div class="prep-g">' + esc(PREP_AREA[g] || g) + '</div><div class="tabla-wrap"><table class="tabla"><tbody>' + grupos[g].map(linea).join('') + '</tbody></table></div>'; }).join('') +
          (D.especiales.length ? '<div class="panel-cuerpo"><b>Solicitudes especiales aprobadas:</b><ul class="adf-esp">' + D.especiales.map(function (e) { return '<li>' + esc(e.texto) + (e.cantidad ? ' · ' + esc(e.cantidad) : '') + (e.respuesta ? ' — ' + esc(e.respuesta) : '') + '</li>'; }).join('') + '</ul></div>' : '') + '</div>' +
        // Componentes
        '<div class="panel op-sec"><div class="panel-cab"><h2>Componentes anatómicos / segmentos</h2></div><div class="panel-cuerpo"><div class="op-num"><b>' + c.componentes + '</b><span>' + esc(c.tipo_componente || 'componentes') + '</span></div>' +
          (D.componentes.length ? '<ul class="adf-esp">' + D.componentes.map(function (l) { return '<li><b>' + numTxt(l.cantidad) + '</b> ' + esc(l.unidad) + ' · ' + esc(l.descripcion) + (l.opcion ? ' · ' + esc(l.opcion) : '') + (l.dias > 1 ? ' × ' + l.dias + ' días' : '') + (l.nota ? ' · ' + esc(l.nota) : '') + '</li>'; }).join('') + '</ul>' : '') + '</div></div>' +
        // Distribución
        '<div class="panel op-sec op-ancho"><div class="panel-cab"><h2>Distribución de la sala del cliente</h2><span class="meta">' + (D.plan ? 'Versión ' + D.plan.version + ' · ' + esc(D.plan.autor) + ' · ' + momento(D.plan.en) : 'El cliente no envió distribución: se usa la base de la sala') + '</span></div>' +
          '<div id="op-plano" class="op-plano"></div>' + (D.plan ? '<p class="meta" style="margin:8px 14px 12px">' + esc(D.plan.resumen) + '</p>' : '') + '</div>' +
        // Listado con QR
        '<div class="panel op-sec op-ancho"><div class="panel-cab"><h2>Listado de personas' + (D.inscritos.length ? ' con código QR' : '') + '</h2><div class="acciones">' + leyendaRoles(R) + (D.inscritos.length ? '<button class="btn btn-sm" id="op-carnes" type="button">Carnés con QR (PDF)</button>' : '') + '</div></div>' +
          (personas.length ? '<div class="tabla-wrap op-lis"><table class="tabla"><thead><tr><th>Rol</th><th>Persona</th><th>Documento</th><th>Especialidad / institución</th><th>QR</th></tr></thead><tbody>' + personas.map(function (i) {
            return '<tr><td>' + chipRol(i.rol) + '</td><td><b>' + esc(i.nombre + ' ' + (i.apellido || '')) + '</b></td><td class="num">' + esc((i.tipo_doc || '') + ' ' + i.documento) + '</td><td class="meta">' + esc([i.especialidad, i.institucion].filter(Boolean).join(' · ') || '—') + '</td>' +
              '<td>' + (i.codigo && window.Ingreso ? '<span class="qr-mini">' + window.Ingreso.qrSvg(i.codigo) + '<span class="num">' + esc(i.codigo) + '</span></span>' : '<span class="meta">Se genera al aceptar</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>' : '<div class="panel-cuerpo pp-sin">El cliente no entregó el listado.</div>') + '</div>' +
        // Programa, audiovisuales y observaciones
        '<div class="panel op-sec"><div class="panel-cab"><h2>Programa / agenda</h2></div><div class="panel-cuerpo">' + (D.programa.length ? D.programa.map(function (a) { return '<a href="' + urlArchivoCT(a) + '" target="_blank" rel="noopener">📄 ' + esc(a.nombre) + '</a>'; }).join('<br>') : '<span class="pp-sin">Sin programa</span>') +
          (c.observaciones ? '<p style="white-space:pre-line;margin:10px 0 0"><b>Observaciones:</b> ' + esc(c.observaciones) + '</p>' : '') + (c.contacto ? '<p class="meta" style="margin:8px 0 0">Contacto del cliente: ' + esc(c.contacto) + (c.contacto_telefono ? ' · ' + esc(c.contacto_telefono) : '') + '</p>' : '') + '</div></div>' +
        '<div class="panel op-sec"><div class="panel-cab"><h2>Audiovisuales y marcación</h2></div><div class="panel-cuerpo">' + (D.av.length ? '<ul class="adf-esp">' + D.av.map(function (x) { return '<li><b>' + x.cantidad + '</b> · ' + esc(x.item_nombre) + (x.opcion ? ' · ' + esc(x.opcion) : '') + ' · <i>' + esc(x.estado) + '</i></li>'; }).join('') + '</ul>' : '<span class="meta">Sin audiovisuales.</span>') + '</div></div>' +
        '</div>' +
        '<h2 class="seccion-t">Bitácora de la preparación</h2><div class="panel">' + (D.bitacora.length ? '<ul class="timeline">' + D.bitacora.map(function (b) { return '<li><div class="tl-hora">' + b.momento.slice(11, 16) + '<small>' + fCorta(b.momento.slice(0, 10)) + '</small></div><div class="tl-cuerpo"><b>' + esc(b.usuario_nombre) + '</b> · ' + esc(b.accion) + '</div></li>'; }).join('') + '</ul>' : '<div class="vacio">Aún no hay registros de preparación.</div>') + '</div>');
      try { editor = new Plano.Editor($('#op-plano'), { sala: sl, plano: sl.plano, items: D.plan ? D.plan.items : (sl.base || []), catalogo: S.base.catalogo, modo: 'items', editable: false }); } catch (e) { $('#op-plano').innerHTML = '<div class="vacio">No se pudo dibujar la sala.</div>'; }
      var b;
      if ((b = $('#op-carnes'))) b.onclick = function () { var ev = D.evento; modalPdf('Carnés con código QR · ' + c.curso, function () { return window.Ingreso.carnes(D.inscritos, { id: ev.id, titulo: ev.titulo, sala: c.sala, fecha: ev.fecha, fecha_fin: ev.fecha_fin, estado: ev.estado }, {}); }); };
      if ((b = $('#op-acep'))) b.onclick = function () {
        var act = S.base.usuarios.filter(function (u) { return +u.activo; });
        var m = modal('Aceptar el convenio', '<p style="margin:0 0 8px">' + esc(c.cliente) + ' · ' + esc(c.curso) + ' · ' + esc(c.sala) + ', ' + esc(rangoCT(c)) + '. ' + (D.evento ? 'Ya está en la agenda.' : 'Se crea el entrenamiento en la agenda con la distribución del cliente y el listado con QR.') + '</p>' +
          (D.evento ? '' : '<label class="campo"><span class="req">Instrumentador a cargo</span><select id="x-r"><option value="">Seleccione…</option>' + act.filter(function (u) { return u.rol === 'instrumentador'; }).map(function (u) { return '<option value="' + u.id + '"' + (u.id === S.yo.id ? ' selected' : '') + '>' + esc(u.nombre) + '</option>'; }).join('') + '</select></label>' +
            '<label class="campo"><span' + (c.componentes ? ' class="req"' : '') + '>Tanatólogo a cargo</span><select id="x-t"><option value="">' + (c.componentes ? 'Seleccione…' : 'Sin tanatólogo') + '</option>' + act.filter(function (u) { return u.rol === 'tanatologo'; }).map(function (u) { return '<option value="' + u.id + '">' + esc(u.nombre) + '</option>'; }).join('') + '</select></label>'),
          '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-oro" id="x-ok" type="button">Aceptar</button>');
        $('#x-ok', m.el).onclick = function () {
          var bt = this, t = $('#x-t', m.el); if (t && c.componentes && !t.value) return errorEn(m, 'Seleccione el tanatólogo a cargo (el convenio tiene componentes anatómicos).');
          bt.disabled = true;
          api('op_aceptar', { contrato_id: id, responsable_id: $('#x-r', m.el) ? $('#x-r', m.el).value : 0, tanatologo_id: t ? t.value : 0 }).then(function (j) { m.cerrar(); toast('<b>Aceptado.</b> En preparación · ' + j.personas + ' personas con su QR.'); cargar(); }, function (e) { bt.disabled = false; errorEn(m, e.error); });
        };
      };
      $$('[data-op-br]').forEach(function (x) { x.onclick = function () { var l = D.lineas.find(function (z) { return z.id === +x.getAttribute('data-op-br'); }); verBrief(l.datos, c.curso); }; });
      $$('[data-ck]').forEach(function (x) { x.onclick = function () { x.disabled = true; api('op_check', { id: +x.getAttribute('data-ck'), estado: x.getAttribute('data-est') }).then(function (j) { if (j.progreso.pct >= 100) toast('<b>¡Salas listas!</b> El check list quedó completo.'); cargar(); }, function (e) { falla(e); cargar(); }); }; });
      $$('[data-pe]').forEach(function (s) {
        s.onchange = function () {
          var est = s.value, lid = +s.getAttribute('data-pe');
          var envia = function (nota, m) { return api('prep_estado', { id: lid, estado: est, nota: nota || '' }).then(function (j) { if (m) m.cerrar(); if (j.progreso && j.progreso.pct >= 100) toast('<b>¡Salas listas!</b> El check list quedó completo.'); else toast('Actualizado.'); cargar(); }, function (e) { if (m) errorEn(m, e.error); else { falla(e); cargar(); } }); };
          if (est !== 'No disponible') return envia('');
          var m = modal('No disponible', '<label class="campo"><span class="req">¿Por qué? ¿Qué alternativa hay?</span><textarea id="x-n" maxlength="500"></textarea></label>', '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-peligro" id="x-ok" type="button">Guardar</button>', { alCerrar: cargar });
          $('#x-ok', m.el).onclick = function () { envia($('#x-n', m.el).value, m); };
        };
      });
    }
    S.vista = { refrescar: cargar };
    cargar();
  }

  // ================================================================== TALENTO HUMANO
  var TH_EST = { 'Activo': 'pe-aprobado', 'Vacaciones': 'pe-enviado', 'Incapacidad': 'pe-cambio', 'Licencia': 'pe-cambio', 'Retirado': 'pe-sin' };
  function chipTH(e) { return '<span class="chip ' + (TH_EST[e] || '') + '">' + esc(e) + '</span>'; }
  function thNombre(p) { return (p.nombres + ' ' + (p.apellidos || '')).trim(); }
  function thCal(cal, conBoton) {
    return '<div class="th-cal">' + (cal || []).map(function (f) {
      var t = (f.n + '/' + f.de) + ' · ' + fCorta(f.fecha) + (f.entregada ? ' ✓' : '');
      return '<span class="' + f.estado + '" title="' + esc(f.estado + (f.entregada ? ' el ' + fLarga(f.entregada) : ' · fecha límite ' + fLarga(f.fecha))) + '"' + (conBoton && !f.entregada ? ' data-per="' + f.periodo + '" style="cursor:pointer"' : '') + '>' + esc(t) + '</span>';
    }).join('') + '</div>';
  }
  function puedeTH() { return !!S.yo && (S.yo.rol === 'admin' || S.yo.rol === 'talento' || areasYo().indexOf('th') >= 0); }

  function vTH(p) {
    if (!puedeTH()) { location.hash = AREA_INICIO[areasYo()[0]]; return; }
    if (p[0] === 'persona') return vTHPersona(+p[1]);
    if (p[0] === 'dotacion') return vTHDotacion();
    if (p[0] === 'eventos') return vTHEventos();
    var D = null, fArea = S.thArea || '', fEst = 'activos', q = '';
    function pintar() {
      if (!$('#th-lista')) return;
      var act = D.personal.filter(function (x) { return x.estado !== 'Retirado'; });
      var k = function (n, t, f) { return '<button type="button" class="kpi' + (fArea === f ? ' is-on' : '') + '" data-a="' + esc(f) + '"><b>' + n + '</b><span>' + esc(t) + '</span></button>'; };
      var cal = [].concat.apply([], act.map(function (x) { return x.calendario; }));
      $('#th-kpis').innerHTML = k(act.length, 'funcionarios activos', '') + Object.keys(D.areas).map(function (a) { return k(act.filter(function (x) { return x.area === a; }).length, a, a); }).join('') +
        '<div class="kpi"><b>' + cal.filter(function (c) { return c.estado === 'Vencida'; }).length + '</b><span>entregas de dotación vencidas ' + D.anio + '</span></div>';
      $$('#th-kpis [data-a]').forEach(function (b) { b.onclick = function () { fArea = S.thArea = b.getAttribute('data-a'); $('#th-area').value = fArea; pintar(); }; });
      var L = D.personal.filter(function (x) {
        if (fArea && x.area !== fArea) return false;
        if (fEst === 'activos' && x.estado === 'Retirado') return false;
        if (fEst !== 'activos' && fEst !== 'todos' && x.estado !== fEst) return false;
        return !q || (thNombre(x) + ' ' + x.documento + ' ' + x.cargo + ' ' + x.subarea + ' ' + (x.correo || '') + ' ' + (x.correo_personal || '')).toLowerCase().indexOf(q) >= 0;
      });
      $('#th-lista').innerHTML = L.length ? '<div class="tabla-wrap"><table class="tabla tabla-click"><thead><tr><th>Funcionario</th><th>Correos</th><th>Área</th><th>Cargo</th><th>Convenio</th><th>Estado</th><th>Dotación ' + D.anio + '</th></tr></thead><tbody>' + L.map(function (x) {
        return '<tr data-id="' + x.id + '"><td><b>' + esc(thNombre(x)) + '</b><br><span class="meta">' + esc(x.documento || 'Sin documento') + '</span></td><td class="th-correos">' + (x.correo ? esc(x.correo).replace('@', '<wbr>@') : '<span class="meta">Sin institucional</span>') + '<br><span class="meta">' + (x.correo_personal ? esc(x.correo_personal).replace('@', '<wbr>@') : 'Sin correo personal') + '</span></td><td>' + esc(x.area) + (x.subarea && x.subarea !== x.area ? '<br><span class="meta">' + esc(x.subarea) + '</span>' : '') + '</td>' +
          '<td>' + esc(x.cargo || '—') + '</td><td>' + esc(x.tipo_contrato || '—') + (x.fecha_ingreso ? '<br><span class="meta">Desde ' + esc(fCorta(x.fecha_ingreso)) + ' ' + x.fecha_ingreso.slice(0, 4) + '</span>' : '') + '</td>' +
          '<td>' + chipTH(x.estado) + '</td><td>' + (x.estado === 'Retirado' ? '<span class="meta">—</span>' : thCal(x.calendario) + '<span class="meta">' + x.n_dotacion + ' elementos asignados</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="vacio"><strong>' + (D.personal.length ? 'Sin funcionarios con ese filtro' : 'Aún no hay funcionarios registrados') + '</strong>' + (D.personal.length ? '' : 'Registre el primero con «+ Nuevo funcionario».') + '</div>';
      $$('#th-lista tr[data-id]').forEach(function (tr) { tr.onclick = function () { location.hash = '#/th/persona/' + tr.getAttribute('data-id'); }; });
    }
    function cargar() { return api('th_personal').then(function (j) { D = j; pintar(); }, falla); }
    montar('<div class="vista-cab"><div><div class="eyebrow">Talento Humano</div><h1>Personal</h1><p>Listado y control del personal de CLEMI con sus datos personales y de contratación, tallas, dotación asignada y entregas.</p></div>' +
      '<div class="acciones"><button class="btn" id="th-xls" type="button">Exportar a Excel</button><button class="btn btn-oro" id="th-nuevo" type="button">+ Nuevo funcionario</button></div></div>' +
      '<div class="kpis" id="th-kpis"></div><div class="panel"><div class="panel-cab th-filtros"><select id="th-area"><option value="">Todas las áreas</option>' + ['Administrativa', 'Operaciones', 'Servicios generales', 'Mantenimiento', 'Almacén'].map(function (a) { return '<option' + (a === fArea ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select>' +
      '<select id="th-est"><option value="activos">Activos (sin retirados)</option><option value="todos">Todos</option>' + ['Activo', 'Vacaciones', 'Incapacidad', 'Licencia', 'Retirado'].map(function (a) { return '<option>' + a + '</option>'; }).join('') + '</select>' +
      '<input type="search" id="th-q" placeholder="Buscar nombre, documento, cargo, correo…"></div><div id="th-lista"><div class="vacio">Cargando…</div></div></div>');
    $('#th-area').onchange = function () { fArea = S.thArea = this.value; pintar(); };
    $('#th-est').onchange = function () { fEst = this.value; pintar(); };
    $('#th-q').oninput = function () { q = this.value.toLowerCase().trim(); pintar(); };
    $('#th-nuevo').onclick = function () { formTH(null, D, function (id) { location.hash = '#/th/persona/' + id; }); };
    $('#th-xls').onclick = function () {
      if (!D || !window.XLSX) return;
      var filas = D.personal.map(function (x) { return { 'Nombres': x.nombres, 'Apellidos': x.apellidos, 'Tipo de documento': x.tipo_doc, 'Documento': x.documento, 'Fecha de nacimiento': x.fecha_nacimiento || '', 'Sexo': x.sexo, 'RH': x.rh, 'Teléfono': x.telefono, 'Correo institucional': x.correo, 'Correo personal': x.correo_personal || '',
        'Dirección': x.direccion, 'Ciudad': x.ciudad, 'Contacto de emergencia': x.contacto_emergencia, 'Tel. emergencia': x.tel_emergencia, 'Área': x.area, 'Subárea': x.subarea, 'Cargo': x.cargo, 'Tipo de convenio': x.tipo_contrato,
        'Fecha de ingreso': x.fecha_ingreso || '', 'Fin de convenio': x.fecha_fin_contrato || '', 'Salario': x.salario == null ? '' : +x.salario, 'Jornada': x.jornada, 'EPS': x.eps, 'AFP': x.afp, 'ARL': x.arl, 'Caja de compensación': x.caja, 'Cesantías': x.cesantias,
        'Estado': x.estado, 'Fecha de retiro': x.fecha_retiro || '', 'Talla uniforme': (x.tallas || {}).uniforme || '', 'Talla pantalón': (x.tallas || {}).pantalon || '', 'Talla calzado': (x.tallas || {}).calzado || '', 'Talla guantes': (x.tallas || {}).guantes || '', 'Talla overol': (x.tallas || {}).overol || '',
        'Entregas de dotación del año': (x.calendario || []).map(function (c) { return c.n + '/' + c.de + ' ' + c.fecha + ': ' + c.estado; }).join(' | ') }; });
      var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas), 'Personal');
      var bin = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      guardarArchivo(new Blob([bin], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Personal-CLEMI-' + hoy() + '.xlsx').catch(falla);
    };
    cargar();
    S.vista = { refrescar: cargar };
  }

  function formTH(p, D, alGuardar) {
    var n = !p; p = p || { area: 'Administrativa', subarea: 'Contabilidad', estado: 'Activo', tipo_doc: 'Cédula de ciudadanía' };
    var A = D.areas;
    var t = function (k, l, o) { o = o || {}; return '<label class="campo' + (o.ancho ? ' ancho' : '') + '"><span' + (o.req ? ' class="req"' : '') + '>' + l + '</span><input id="h-' + k + '" ' + (o.tipo ? 'type="' + o.tipo + '" ' : '') + 'maxlength="' + (o.max || 160) + '" value="' + esc(p[k] == null ? '' : p[k]) + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + '></label>'; };
    var s = function (k, l, ops, o) { o = o || {}; return '<label class="campo"><span' + (o.req ? ' class="req"' : '') + '>' + l + '</span><select id="h-' + k + '">' + (o.vacio ? '<option value=""></option>' : '') + ops.map(function (x) { return '<option' + (x === p[k] ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></label>'; };
    var m = modal(n ? 'Nuevo funcionario' : 'Editar · ' + thNombre(p),
      '<h3 class="th-sub">Datos personales</h3><div class="form-grid">' + t('nombres', 'Nombres', { req: 1, max: 120 }) + t('apellidos', 'Apellidos', { req: 1, max: 120 }) +
      s('tipo_doc', 'Tipo de documento', ['Cédula de ciudadanía', 'Cédula de extranjería', 'Pasaporte', 'PPT', 'Tarjeta de identidad']) + t('documento', 'Número de documento', { max: 30 }) +
      t('fecha_nacimiento', 'Fecha de nacimiento', { tipo: 'date' }) + s('sexo', 'Sexo', ['Femenino', 'Masculino', 'Otro'], { vacio: 1 }) + s('rh', 'RH', ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'], { vacio: 1 }) +
      t('telefono', 'Teléfono', { max: 40 }) + t('correo', 'Correo institucional', { tipo: 'email', ph: 'nombre@clemi.edu.co' }) + t('correo_personal', 'Correo personal', { tipo: 'email' }) + t('direccion', 'Dirección', { max: 200 }) + t('ciudad', 'Ciudad', { max: 80 }) +
      t('contacto_emergencia', 'Contacto de emergencia', { ph: 'Nombre y parentesco' }) + t('tel_emergencia', 'Teléfono de emergencia', { max: 40 }) + '</div>' +
      '<h3 class="th-sub">Contratación</h3><div class="form-grid">' + s('area', 'Área', Object.keys(A), { req: 1 }) + '<label class="campo"><span class="req">Subárea</span><select id="h-subarea"></select></label>' +
      t('cargo', 'Cargo', { max: 120 }) + s('tipo_contrato', 'Tipo de convenio', D.contratos, { vacio: 1 }) + t('fecha_ingreso', 'Fecha de ingreso', { tipo: 'date' }) + t('fecha_fin_contrato', 'Fin del convenio', { tipo: 'date' }) +
      '<label class="campo"><span>Salario mensual (COP)</span><input id="h-salario" inputmode="numeric" value="' + (p.salario == null ? '' : Math.round(p.salario)) + '"></label>' + t('jornada', 'Jornada / horario', { max: 60 }) +
      '<label class="campo"><span>Usuario de la plataforma</span><select id="h-usuario_id"><option value="">Sin usuario</option>' + (D.usuarios || []).map(function (x) { return '<option value="' + x.id + '"' + (+x.id === +p.usuario_id ? ' selected' : '') + '>' + esc(x.nombre) + '</option>'; }).join('') + '</select><small>Para que reciba los Eventos CLEMI de su área.</small></label>' +
      s('estado', 'Estado', D.estados) + t('fecha_retiro', 'Fecha de retiro', { tipo: 'date' }) + t('motivo_retiro', 'Motivo de retiro', { ancho: 1, max: 500 }) + '</div>' +
      '<h3 class="th-sub">Seguridad social y pago</h3><div class="form-grid">' + t('eps', 'EPS', { max: 80 }) + t('afp', 'Fondo de pensiones', { max: 80 }) + t('arl', 'ARL', { max: 80 }) + t('caja', 'Caja de compensación', { max: 80 }) +
      t('cesantias', 'Fondo de cesantías', { max: 80 }) + t('banco', 'Banco', { max: 80 }) + t('cuenta', 'Cuenta de nómina', { max: 40 }) + '</div>' +
      '<label class="campo"><span>Observaciones</span><textarea id="h-observaciones" maxlength="2000">' + esc(p.observaciones || '') + '</textarea></label>' +
      (n ? '<p class="meta" style="margin:0">Al guardar se le asigna la dotación de su perfil; luego puede agregar o quitar elementos en su ficha.</p>' : ''),
      '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="h-ok" type="button">' + (n ? 'Registrar funcionario' : 'Guardar') + '</button>', { ancho: true });
    function subs() { var a = $('#h-area', m.el).value, sel = $('#h-subarea', m.el); sel.innerHTML = A[a].map(function (x) { return '<option' + (x === p.subarea ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join(''); }
    $('#h-area', m.el).onchange = subs; subs();
    $('#h-ok', m.el).onclick = function () {
      var d = { id: n ? 0 : p.id };
      ['nombres', 'apellidos', 'tipo_doc', 'documento', 'fecha_nacimiento', 'sexo', 'rh', 'telefono', 'correo', 'correo_personal', 'direccion', 'ciudad', 'contacto_emergencia', 'tel_emergencia', 'area', 'subarea', 'cargo', 'tipo_contrato', 'fecha_ingreso', 'fecha_fin_contrato', 'salario', 'jornada',
        'estado', 'fecha_retiro', 'motivo_retiro', 'eps', 'afp', 'arl', 'caja', 'cesantias', 'banco', 'cuenta', 'observaciones', 'usuario_id'].forEach(function (k) { d[k] = $('#h-' + k, m.el).value; });
      api('th_persona_guardar', d).then(function (j) { m.cerrar(); toast(n ? 'Funcionario registrado.' : 'Datos guardados.'); alGuardar(j.id); }, function (x) { errorEn(m, x.error); });
    };
  }

  function vTHPersona(id) {
    var D = null;
    function cargar() { return api('th_persona&id=' + id).then(function (j) { D = j; pintar(); }, function (e) { montar('<a class="miga" href="#/th">← Personal</a><div class="vacio"><strong>No se pudo abrir</strong>' + esc(e.error) + '</div>'); }); }
    function pintar() {
      var p = D.persona, T = p.tallas || {}, anio = new Date().getFullYear();
      var perfilN = D.perfiles[p.perfil];
      var opts = Object.keys(D.perfiles).map(function (pf) { var its = D.items.filter(function (i) { return i.perfil === pf; }); return its.length ? '<optgroup label="' + esc(D.perfiles[pf]) + '">' + its.map(function (i) { return '<option value="' + i.id + '">' + esc(i.nombre) + (i.zona ? ' · ' + esc(i.zona) : '') + '</option>'; }).join('') + '</optgroup>' : ''; }).join('');
      montar('<a class="miga" href="#/th">← Personal</a>' +
        '<section class="ev-cab th-cab"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' + chipTH(p.estado) + '<span class="chip" style="background:rgba(255,255,255,.14);color:#fff">' + esc(p.area + (p.subarea !== p.area ? ' · ' + p.subarea : '')) + '</span></div>' +
          '<h1 style="margin-top:8px">' + esc(thNombre(p)) + '</h1><div class="ev-datos"><span><b>' + esc(p.cargo || 'Sin cargo') + '</b></span><span>' + esc((p.tipo_doc || '') + ' ' + (p.documento || '')) + '</span>' + (p.fecha_ingreso ? '<span>Ingreso: <b>' + esc(fLarga(p.fecha_ingreso)) + '</b></span>' : '') + '<span>Dotación: ' + p.frecuencia + ' entregas al año</span></div>' +
          '<div class="acciones"><button class="btn" id="tp-ed" type="button">Editar datos</button>' + (p.estado !== 'Retirado' ? '<button class="btn btn-oro" id="tp-ent" type="button">Registrar entrega de dotación</button>' : '') + '</div></section>' +
        '<div class="dos-col"><div class="panel"><div class="panel-cab"><h2>Datos personales</h2></div><div class="datos-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
          dato('Fecha de nacimiento', p.fecha_nacimiento ? fLarga(p.fecha_nacimiento) : '—') + dato('Sexo · RH', [p.sexo, p.rh].filter(Boolean).join(' · ') || '—') + dato('Teléfono', p.telefono || '—') + dato('Correo institucional', p.correo || '—') + dato('Correo personal', p.correo_personal || '—') +
          dato('Dirección', [p.direccion, p.ciudad].filter(Boolean).join(', ') || '—') + dato('Contacto de emergencia', [p.contacto_emergencia, p.tel_emergencia].filter(Boolean).join(' · ') || '—') + '</div></div>' +
        '<div class="panel"><div class="panel-cab"><h2>Contratación y seguridad social</h2></div><div class="datos-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
          dato('Tipo de convenio', p.tipo_contrato || '—') + dato('Vigencia', (p.fecha_ingreso ? fCorta(p.fecha_ingreso) + ' ' + p.fecha_ingreso.slice(0, 4) : '—') + (p.fecha_fin_contrato ? ' a ' + fCorta(p.fecha_fin_contrato) + ' ' + p.fecha_fin_contrato.slice(0, 4) : '')) +
          dato('Salario', p.salario == null ? '—' : pesos(p.salario)) + dato('Jornada', p.jornada || '—') + dato('EPS · ARL', [p.eps, p.arl].filter(Boolean).join(' · ') || '—') + dato('Pensión · Cesantías', [p.afp, p.cesantias].filter(Boolean).join(' · ') || '—') +
          dato('Caja de compensación', p.caja || '—') + dato('Banco · cuenta', [p.banco, p.cuenta].filter(Boolean).join(' · ') || '—') + (p.estado === 'Retirado' ? dato('Retiro', (p.fecha_retiro ? fLarga(p.fecha_retiro) : '') + (p.motivo_retiro ? ' · ' + p.motivo_retiro : '')) : '') + '</div>' +
          (p.observaciones ? '<div class="panel-cuerpo" style="white-space:pre-line;border-top:1px solid var(--linea)">' + esc(p.observaciones) + '</div>' : '') + '</div></div>' +
        '<div class="panel"><div class="panel-cab"><h2>Tallas</h2><button class="btn btn-sm btn-verde" id="tp-tallas" type="button">Guardar tallas</button></div><div class="panel-cuerpo th-tallas">' +
          Object.keys(D.tallas_tipos).map(function (k) { return '<label class="campo"><span>' + esc(D.tallas_tipos[k]) + '</span><input data-talla="' + k + '" maxlength="12" value="' + esc(T[k] || '') + '" placeholder="' + ({ calzado: 'Ej. 38', guantes: 'S, M, L…', uniforme: 'XS…XXL' }[k] || '') + '"></label>'; }).join('') + '</div></div>' +
        '<div class="panel"><div class="panel-cab"><h2>Dotación asignada</h2><span class="meta">Perfil: ' + esc(perfilN) + '</span></div>' +
          (D.dotacion.length ? '<div class="tabla-wrap"><table class="tabla th-dot"><thead><tr><th>Elemento</th><th style="width:90px">Cantidad</th><th style="width:110px">Talla</th><th>Nota</th><th></th></tr></thead><tbody>' + D.dotacion.map(function (d) {
            return '<tr data-d="' + d.id + '"><td>' + (d.zona ? '<div class="zona">' + esc(d.zona) + '</div>' : '') + '<b>' + esc(d.nombre) + '</b>' + (d.perfil !== p.perfil ? ' <span class="chip pe-sin">' + esc(D.perfiles[d.perfil].split(' (')[0]) + '</span>' : '') + (d.detalle ? '<br><span class="meta">' + esc(d.detalle) + '</span>' : '') + '</td>' +
              '<td><input type="number" min="1" max="20" data-k="cantidad" value="' + d.cantidad + '"></td><td><input data-k="talla" maxlength="12" value="' + esc(d.talla || '') + '" placeholder="' + (d.talla_tipo ? esc(D.tallas_tipos[d.talla_tipo]) : 'Única') + '"></td>' +
              '<td><input data-k="nota" maxlength="300" value="' + esc(d.nota || '') + '" placeholder="Ej. color, referencia, tipo de guante"></td><td><button class="btn btn-sm" data-q="' + d.id + '" type="button" title="Quitar de la dotación">Quitar</button></td></tr>';
          }).join('') + '</tbody></table></div>' : '<div class="vacio">Sin dotación asignada.</div>') +
          '<div class="panel-cuerpo" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;border-top:1px solid var(--linea)"><select id="tp-item" style="max-width:420px"><option value="">Agregar elemento de dotación…</option>' + opts + '</select><button class="btn btn-sm btn-verde" id="tp-add" type="button">Agregar</button>' +
          '<button class="btn btn-sm" id="tp-perfil" type="button">Completar con la dotación de su perfil</button></div></div>' +
        '<div class="dos-col"><div class="panel"><div class="panel-cab"><h2>Calendario de entregas</h2><span class="meta">' + p.frecuencia + ' al año</span></div><div class="panel-cuerpo">' +
          Object.keys(D.calendario).map(function (a) { return '<p class="meta" style="margin:0 0 4px"><b>' + a + '</b></p>' + thCal(D.calendario[a], p.estado !== 'Retirado'); }).join('<div style="height:10px"></div>') +
          '<p class="meta" style="margin:10px 0 0">' + (p.frecuencia === 3 ? 'Fechas máximas del Código Sustantivo del Trabajo: 30 de abril, 31 de agosto y 20 de diciembre.' : 'Dos entregas al año.') + ' Toque una entrega pendiente para registrarla.</p></div></div>' +
        '<div class="panel"><div class="panel-cab"><h2>Entregas realizadas (' + D.entregas.length + ')</h2></div>' + (D.entregas.length ? '<ul class="lista-simple">' + D.entregas.map(function (e) {
            return '<li><b>' + esc(fLarga(e.fecha_entrega)) + '</b> <span class="meta">' + (e.periodo ? 'entrega ' + e.periodo.slice(5) + ' de ' + e.periodo.slice(0, 4) : 'adicional') + ' · ' + e.items.length + ' elementos · entregó ' + esc(e.entrega_nombre) + '</span>' +
              '<span style="margin-left:auto;display:flex;gap:6px"><button class="btn btn-sm" data-acta="' + e.id + '" type="button">Acta PDF</button>' + (esAdmin() ? '<button class="btn btn-sm" data-anula="' + e.id + '" type="button">Anular</button>' : '') + '</span></li>';
          }).join('') + '</ul>' : '<div class="vacio">Aún no hay entregas registradas.</div>') + '</div></div>' +
        '<h2 class="seccion-t">Bitácora</h2><div class="panel"><ul class="timeline">' + (D.bitacora.length ? D.bitacora.map(function (b) {
          return '<li><div class="tl-hora">' + b.momento.slice(11, 16) + '<small>' + fCorta(b.momento.slice(0, 10)) + '</small></div><div class="tl-cuerpo"><b>' + esc(b.usuario_nombre) + '</b> · ' + esc(b.accion) + (b.detalle ? '<div class="bit-det">' + esc(b.detalle) + '</div>' : '') + '</div></li>';
        }).join('') : '<li><div></div><div class="meta">Sin movimientos.</div></li>') + '</ul></div>');
      $('#tp-ed').onclick = function () { formTH(p, D, function () { cargar(); }); };
      var be = $('#tp-ent'); if (be) be.onclick = function () { modalEntregaTH(D, null, cargar); };
      $$('.th-cal [data-per]').forEach(function (s) { s.onclick = function () { modalEntregaTH(D, s.getAttribute('data-per'), cargar); }; });
      $('#tp-tallas').onclick = function () { var t = {}; $$('[data-talla]').forEach(function (i) { t[i.getAttribute('data-talla')] = i.value; }); api('th_tallas_guardar', { id: p.id, tallas: t }).then(function () { toast('Tallas guardadas.'); cargar(); }, falla); };
      $$('.th-dot tr[data-d] input').forEach(function (inp) { inp.onchange = function () {
        var tr = inp.closest('tr'); api('th_dot_editar', { id: +tr.getAttribute('data-d'), cantidad: $('[data-k=cantidad]', tr).value, talla: $('[data-k=talla]', tr).value, nota: $('[data-k=nota]', tr).value }).then(function () { toast('Dotación actualizada.'); }, falla);
      }; });
      $$('[data-q]').forEach(function (b) { b.onclick = function () { api('th_dot_quitar', { id: +b.getAttribute('data-q') }).then(function () { toast('Elemento quitado de la dotación.'); cargar(); }, falla); }; });
      $('#tp-add').onclick = function () { var v = $('#tp-item').value; if (!v) return toast('Elija el elemento.', 'error'); api('th_dot_agregar', { persona_id: p.id, item_id: +v }).then(function () { toast('Elemento agregado.'); cargar(); }, falla); };
      $('#tp-perfil').onclick = function () { api('th_dot_perfil', { persona_id: p.id }).then(function (j) { toast(j.agregados ? j.agregados + ' elementos agregados.' : 'Ya tiene toda la dotación de su perfil.'); cargar(); }, falla); };
      $$('[data-acta]').forEach(function (b) { b.onclick = function () { actaTH(p, D.entregas.find(function (e) { return +e.id === +b.getAttribute('data-acta'); })); }; });
      $$('[data-anula]').forEach(function (b) { b.onclick = function () {
        var m = modal('Anular entrega', '<p style="margin:0">Se elimina el registro de esta entrega y su acta.</p><label class="campo"><span class="req">Motivo</span><textarea id="x-m" maxlength="300"></textarea></label>', '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-peligro" id="x-ok" type="button">Anular</button>');
        $('#x-ok', m.el).onclick = function () { api('th_entrega_borrar', { id: +b.getAttribute('data-anula'), motivo: $('#x-m', m.el).value }).then(function () { m.cerrar(); cargar(); }, function (x) { errorEn(m, x.error); }); };
      }; });
      if (S.thEntregaAuto && +S.thEntregaAuto.id === +p.id) { var per = S.thEntregaAuto.periodo; S.thEntregaAuto = null; modalEntregaTH(D, per, cargar); }
    }
    cargar();
    S.vista = { refrescar: function () { if (!$('.modal-fondo')) cargar(); } };
  }

  function modalEntregaTH(D, periodo, cargar) {
    var p = D.persona;
    if (!D.dotacion.length) return toast('Primero asigne la dotación del funcionario.', 'error');
    var pend = [].concat.apply([], Object.keys(D.calendario).map(function (a) { return D.calendario[a]; })).filter(function (f) { return !f.entregada; });
    if (!periodo && pend.length) periodo = pend[0].periodo;
    var m = modal('Entrega de dotación · ' + thNombre(p),
      '<div class="form-grid"><label class="campo"><span>Entrega</span><select id="e-per">' + pend.map(function (f) { return '<option value="' + f.periodo + '"' + (f.periodo === periodo ? ' selected' : '') + '>Entrega ' + f.n + ' de ' + f.de + ' · ' + f.fecha.slice(0, 4) + ' (límite ' + fCorta(f.fecha) + ')' + (f.estado === 'Vencida' ? ' · vencida' : '') + '</option>'; }).join('') + '<option value="">Entrega adicional (fuera del calendario)</option></select></label>' +
      '<label class="campo"><span>Fecha de entrega</span><input id="e-fecha" type="date" value="' + hoy() + '"></label></div>' +
      '<p class="meta" style="margin:0">Marque lo que se le entrega, con la cantidad y la talla.</p>' +
      '<div class="th-ent-lista">' + D.dotacion.map(function (d, i) {
        return '<label class="th-ent-fila"><input type="checkbox" data-i="' + i + '" checked><span class="t"><b>' + esc(d.nombre) + '</b>' + (d.zona ? ' <span class="meta">· ' + esc(d.zona) + '</span>' : '') + (d.nota ? '<br><span class="meta">' + esc(d.nota) + '</span>' : '') + '</span>' +
          '<input type="number" min="1" max="50" data-c="' + i + '" value="' + d.cantidad + '" title="Cantidad"><input type="text" data-tl="' + i + '" maxlength="12" value="' + esc(d.talla || '') + '" placeholder="Talla"></label>';
      }).join('') + '</div>' +
      '<label class="campo"><span>Observaciones</span><textarea id="e-obs" maxlength="2000" placeholder="Ej. queda pendiente la talla 40 de botas"></textarea></label>' +
      '<div class="form-grid"><label class="campo"><span class="req">Entrega (nombre)</span><input id="e-en" maxlength="120" value="' + esc(S.yo.nombre) + '"></label><label class="campo"><span>Cargo de quien entrega</span><input id="e-ec" maxlength="120" value="Talento Humano"></label></div>' +
      '<div class="th-firmas"><div class="campo"><span class="req">Firma de quien entrega</span><div id="e-f1"></div></div><div class="campo"><span class="req">Firma de ' + esc(thNombre(p)) + '</span><div id="e-f2"></div></div></div>',
      '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="e-ok" type="button">Guardar entrega y generar acta</button>', { ancho: true, sinFoco: true });
    var f1 = new Firma($('#e-f1', m.el)), f2 = new Firma($('#e-f2', m.el));
    $('#e-ok', m.el).onclick = function () {
      var items = []; $$('[data-i]', m.el).forEach(function (c) { if (!c.checked) return; var i = +c.getAttribute('data-i'), d = D.dotacion[i];
        items.push({ item_id: d.item_id, nombre: d.nombre, zona: d.zona, cantidad: +$('[data-c="' + i + '"]', m.el).value || 0, talla: $('[data-tl="' + i + '"]', m.el).value }); });
      var a = f1.valor(), b = f2.valor();
      if (!items.length) return errorEn(m, 'Marque al menos un elemento entregado.');
      if (!a || !b) return errorEn(m, 'Faltan las firmas de quien entrega y de quien recibe.');
      var bt = this; bt.disabled = true;
      var datos = { persona_id: p.id, periodo: $('#e-per', m.el).value, fecha_entrega: $('#e-fecha', m.el).value, items: items, observaciones: $('#e-obs', m.el).value, entrega_nombre: $('#e-en', m.el).value, entrega_cargo: $('#e-ec', m.el).value, entrega_firma: a, recibe_firma: b };
      api('th_entrega_guardar', datos).then(function (j) {
        m.cerrar(); toast('<b>Entrega registrada.</b> Se generó el acta.');
        var e = Object.assign({}, datos, { id: j.id, creado_por: S.yo.id, creado_en: ahoraTxt(), fecha_programada: null });
        delete e.entrega_firma; delete e.recibe_firma; e._f1 = a; e._f2 = b;
        cargar(); actaTH(p, e);
      }, function (x) { bt.disabled = false; errorEn(m, x.error); });
    };
  }
  function actaTH(p, e) {
    modalPdf('Acta de entrega de dotación · ' + thNombre(p), function () {
      var ee = Object.assign({}, e); if (e._f1) { ee.entrega_firma = e._f1; ee.recibe_firma = e._f2; }
      return window.DotacionPDF.acta(p, ee, { archivo: function (f) { return /^data:/.test(f || '') ? f : archivo(f); }, nombre: function (id) { return usuario(id).nombre; }, generadoPor: S.yo.nombre, ahora: ahoraTxt() });
    });
  }

  function vTHDotacion() {
    if (!puedeTH()) { location.hash = AREA_INICIO[areasYo()[0]]; return; }
    var D = null, I = null, anio = new Date().getFullYear(), fArea = '', soloPend = false;
    function cargar() { return Promise.all([api('th_personal&anio=' + anio), api('th_items')]).then(function (r) { D = r[0]; I = r[1]; pintar(); }, falla); }
    function pintar() {
      if (!$('#td-l')) return;
      var act = D.personal.filter(function (x) { return x.estado !== 'Retirado' && (!fArea || x.area === fArea); });
      var cal = [].concat.apply([], act.map(function (x) { return x.calendario; }));
      var c = function (e) { return cal.filter(function (f) { return f.estado === e; }).length; };
      $('#td-kpis').innerHTML = '<div class="kpi"><b>' + c('Entregada') + '</b><span>entregas hechas ' + anio + '</span></div><div class="kpi"><b>' + c('Pendiente') + '</b><span>pendientes</span></div><div class="kpi"><b>' + c('Vencida') + '</b><span>vencidas</span></div>';
      var L = act.filter(function (x) { return !soloPend || x.calendario.some(function (f) { return !f.entregada; }); });
      var porArea = {}; L.forEach(function (x) { (porArea[x.area] = porArea[x.area] || []).push(x); });
      $('#td-l').innerHTML = Object.keys(porArea).length ? Object.keys(porArea).map(function (a) {
        return '<div class="prep-g">' + esc(a) + '</div><div class="tabla-wrap"><table class="tabla"><tbody>' + porArea[a].map(function (x) {
          return '<tr><td><a href="#/th/persona/' + x.id + '"><b>' + esc(thNombre(x)) + '</b></a><br><span class="meta">' + esc(x.subarea + (x.cargo ? ' · ' + x.cargo : '')) + '</span></td><td>' + thCal(x.calendario, true).replace(/data-per="/g, 'data-pid="' + x.id + '" data-per="') + '</td><td class="meta">' + x.n_dotacion + ' elementos</td></tr>';
        }).join('') + '</tbody></table></div>';
      }).join('') : '<div class="vacio">Sin funcionarios con ese filtro.</div>';
      $$('#td-l [data-per]').forEach(function (s) { s.onclick = function () { S.thEntregaAuto = { id: +s.getAttribute('data-pid'), periodo: s.getAttribute('data-per') }; location.hash = '#/th/persona/' + s.getAttribute('data-pid'); }; });
      var tt = I.tallas_tipos;
      $('#td-cat').innerHTML = Object.keys(I.perfiles).map(function (pf) {
        return '<div class="prep-g">' + esc(I.perfiles[pf]) + '</div><div class="tabla-wrap"><table class="tabla"><tbody>' + I.items.filter(function (i) { return i.perfil === pf; }).map(function (i) {
          return '<tr' + (+i.activo ? '' : ' class="inactivo"') + '><td>' + (i.zona ? '<span class="meta">' + esc(i.zona) + ' · </span>' : '') + '<b>' + esc(i.nombre) + '</b>' + (i.detalle ? '<br><span class="meta">' + esc(i.detalle) + '</span>' : '') + '</td><td class="meta">' + i.cantidad + ' u. · ' + esc(i.talla_tipo ? 'talla de ' + tt[i.talla_tipo].toLowerCase() : 'talla única') + '</td><td><button class="btn btn-sm" data-it="' + i.id + '" type="button">Editar</button></td></tr>';
        }).join('') + '</tbody></table></div>';
      }).join('');
      $$('#td-cat [data-it]').forEach(function (b) { b.onclick = function () { formItemTH(I.items.find(function (i) { return +i.id === +b.getAttribute('data-it'); })); }; });
    }
    function formItemTH(it) {
      var n = !it; it = it || { perfil: 'general', cantidad: 1, talla_tipo: '', activo: 1 };
      var m = modal(n ? 'Nuevo elemento de dotación' : it.nombre, '<div class="form-grid"><label class="campo ancho"><span class="req">Nombre</span><input id="i-n" maxlength="160" value="' + esc(it.nombre || '') + '"></label>' +
        '<label class="campo"><span>Perfil</span><select id="i-p">' + Object.keys(I.perfiles).map(function (k) { return '<option value="' + k + '"' + (k === it.perfil ? ' selected' : '') + '>' + esc(I.perfiles[k]) + '</option>'; }).join('') + '</select></label>' +
        '<label class="campo"><span>Zona del cuerpo / uso</span><input id="i-z" maxlength="80" value="' + esc(it.zona || '') + '"></label>' +
        '<label class="campo"><span>Talla según</span><select id="i-t"><option value="">Talla única</option>' + Object.keys(I.tallas_tipos).map(function (k) { return '<option value="' + k + '"' + (k === it.talla_tipo ? ' selected' : '') + '>' + esc(I.tallas_tipos[k]) + '</option>'; }).join('') + '</select></label>' +
        '<label class="campo"><span>Cantidad por entrega</span><input id="i-c" type="number" min="1" max="20" value="' + it.cantidad + '"></label>' +
        '<label class="campo ancho"><span>Detalle</span><input id="i-d" maxlength="300" value="' + esc(it.detalle || '') + '"></label><label class="check"><input type="checkbox" id="i-a"' + (+it.activo ? ' checked' : '') + '>Activo en el catálogo</label></div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="i-ok" type="button">Guardar</button>');
      $('#i-ok', m.el).onclick = function () { api('th_item_guardar', { id: n ? 0 : it.id, nombre: $('#i-n', m.el).value, perfil: $('#i-p', m.el).value, zona: $('#i-z', m.el).value, talla_tipo: $('#i-t', m.el).value, cantidad: $('#i-c', m.el).value, detalle: $('#i-d', m.el).value, activo: $('#i-a', m.el).checked ? 1 : 0 }).then(function () { m.cerrar(); cargar(); }, function (x) { errorEn(m, x.error); }); };
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">Talento Humano</div><h1>Dotación y entregas</h1><p>Control de las entregas de dotación del año por funcionario y catálogo de dotación por perfil. Todo el personal recibe 3 entregas al año, como lo establece la ley en Colombia (Código Sustantivo del Trabajo, art. 230): <b>30 de abril, 31 de agosto y 20 de diciembre</b>.</p></div></div>' +
      '<div class="kpis" id="td-kpis"></div><div class="panel"><div class="panel-cab th-filtros"><select id="td-anio">' + [anio - 1, anio, anio + 1].map(function (a) { return '<option' + (a === anio ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select>' +
      '<select id="td-area"><option value="">Todas las áreas</option>' + ['Administrativa', 'Operaciones', 'Servicios generales', 'Mantenimiento', 'Almacén'].map(function (a) { return '<option>' + a + '</option>'; }).join('') + '</select><label class="check"><input type="checkbox" id="td-pend">Solo con entregas pendientes</label></div>' +
      '<div id="td-l"><div class="vacio">Cargando…</div></div></div>' +
      '<h2 class="seccion-t">Catálogo de dotación</h2><div class="panel"><div class="panel-cab"><span class="meta">Lo que se puede asignar a cada funcionario, por perfil</span><button class="btn btn-sm btn-oro" id="td-nuevo" type="button">+ Nuevo elemento</button></div><div id="td-cat"></div></div>');
    $('#td-anio').onchange = function () { anio = +this.value; cargar(); };
    $('#td-area').onchange = function () { fArea = this.value; pintar(); };
    $('#td-pend').onchange = function () { soloPend = this.checked; pintar(); };
    $('#td-nuevo').onclick = function () { formItemTH(null); };
    cargar();
    S.vista = { refrescar: cargar };
  }

  // ------------------------------------------------------------ Eventos CLEMI (Talento Humano)
  var EV_EST = { 'Borrador': 'pe-sin', 'Publicado': 'pe-aprobado', 'Cancelado': 'ct-can' };
  function evMedia(e, zoom) {
    if (e.tema && window.EvArte) return window.EvArte.html(e.tema);
    if (e.imagen) return '<img src="' + esc(archivo(e.imagen)) + '" alt=""' + (zoom ? ' data-zoom' : '') + '>';
    return '<div class="ev-sinimg"><b>' + esc(e.fecha.slice(8, 10)) + '</b><span>' + esc(MESES[+e.fecha.slice(5, 7) - 1].slice(0, 3)) + '</span></div>';
  }
  function evCuando(e) { return fLarga(e.fecha) + (e.fecha_fin ? ' al ' + fLarga(e.fecha_fin) : '') + (e.hora_ini ? ' · ' + e.hora_ini + (e.hora_fin ? '–' + e.hora_fin : '') : ''); }
  function evAlcance(dest, D) {
    var para = function (a, s) { return dest.some(function (d) { return d === 'Todos' || d === a || (s && d === a + '/' + s); }); };
    return { usuarios: D.usuarios_area.filter(function (x) { return para(x[0], x[1]); }).length, correos: D.personal_area.filter(function (x) { return (x.correo || x.correo_personal) && para(x.area, x.subarea); }).length };
  }
  function vTHEventos() {
    var D = null, ver = 'proximos';
    function cargar() { return api('th_eventos').then(function (j) { D = j; pintar(); }, falla); }
    function pintar() {
      if (!$('#ev-l')) return;
      var h = D.hoy, L = D.eventos.filter(function (e) { var fin = e.fecha_fin || e.fecha; return ver === 'proximos' ? fin >= h : fin < h; });
      if (ver === 'proximos') L.sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
      $$('#ev-tabs button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === ver); });
      $('#ev-l').innerHTML = L.length ? L.map(function (e) {
        return '<article class="panel ev-card' + (e.estado === 'Cancelado' ? ' cancelado' : '') + '">' + evMedia(e) +
          '<div class="ev-cuerpo"><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="chip ' + (EV_EST[e.estado] || '') + '">' + esc(e.estado) + '</span><span class="chip pe-sin">' + esc(e.tipo) + '</span></div>' +
          '<h3>' + esc(e.titulo) + '</h3><p class="meta" style="margin:0">' + esc(evCuando(e)) + (e.lugar ? ' · ' + esc(e.lugar) : '') + '</p>' +
          (e.descripcion ? '<p class="ev-desc">' + esc(e.descripcion) + '</p>' : '') +
          '<p class="meta" style="margin:0">Para: <b>' + esc(e.para) + '</b>' + (e.estado === 'Publicado' ? ' · publicado ' + momento(e.publicado_en) + ' · visto por ' + e.vistos + ' usuario(s) · ' + e.correos + ' correo(s)' : '') + (e.estado === 'Cancelado' ? ' · motivo: ' + esc(e.cancelado_motivo) : '') + '</p>' +
          '<div class="acciones" style="margin-top:6px">' + (e.estado !== 'Cancelado' ? '<button class="btn btn-sm" data-ed="' + e.id + '" type="button">Editar</button>' : '') +
            (e.estado === 'Borrador' ? '<button class="btn btn-sm btn-oro" data-pub="' + e.id + '" type="button">Publicar</button><button class="btn btn-sm" data-del="' + e.id + '" type="button">Eliminar</button>' : '') +
            (e.estado === 'Publicado' ? '<button class="btn btn-sm" data-can="' + e.id + '" type="button">Cancelar evento</button>' : '') + '</div></div></article>';
      }).join('') : '<div class="vacio"><strong>' + (ver === 'proximos' ? 'No hay eventos próximos' : 'No hay eventos pasados') + '</strong>' + (ver === 'proximos' ? 'Cree uno con «+ Nuevo evento».' : '') + '</div>';
      if (window.EvArte) window.EvArte.activar($('#ev-l'));
      var bus = function (id) { return D.eventos.find(function (e) { return +e.id === +id; }); };
      $$('#ev-l [data-ed]').forEach(function (b) { b.onclick = function () { formEvTH(bus(b.getAttribute('data-ed'))); }; });
      $$('#ev-l [data-pub]').forEach(function (b) { b.onclick = function () { publicar(bus(b.getAttribute('data-pub'))); }; });
      $$('#ev-l [data-del]').forEach(function (b) { b.onclick = function () { var e = bus(b.getAttribute('data-del')); if (confirm('¿Eliminar el borrador «' + e.titulo + '»?')) api('th_evento_borrar', { id: e.id }).then(cargar, falla); }; });
      $$('#ev-l [data-can]').forEach(function (b) { b.onclick = function () {
        var e = bus(b.getAttribute('data-can'));
        var m = modal('Cancelar evento', '<p style="margin:0">Las áreas reciben el aviso de que <b>' + esc(e.titulo) + '</b> se canceló.</p><label class="campo"><span class="req">Motivo</span><textarea id="x-m" maxlength="500"></textarea></label>', '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-peligro" id="x-ok" type="button">Cancelar evento</button>');
        $('#x-ok', m.el).onclick = function () { api('th_evento_cancelar', { id: e.id, motivo: $('#x-m', m.el).value }).then(function () { m.cerrar(); toast('Evento cancelado y avisado.'); cargar(); }, function (x) { errorEn(m, x.error); }); };
      }; });
    }
    function publicar(e) {
      var al = evAlcance(e.destinatarios, D);
      var m = modal('Publicar evento', '<p style="margin:0"><b>' + esc(e.titulo) + '</b> · ' + esc(evCuando(e)) + '</p><p style="margin:0">Dirigido a <b>' + esc(e.para) + '</b>. Les llega la notificación en la plataforma (' + al.usuarios + ' usuario(s)) y por correo institucional y personal al personal de esas áreas (' + al.correos + ').</p>',
        '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-oro" id="x-ok" type="button">Publicar y notificar</button>');
      $('#x-ok', m.el).onclick = function () { this.disabled = true; api('th_evento_publicar', { id: e.id }).then(function (j) { m.cerrar(); toast('<b>Evento publicado.</b> Notificado en la plataforma' + (j.correos ? ' y por correo a ' + j.correos + ' persona(s)' : '') + '.'); cargar(); }, function (x) { errorEn(m, x.error); }); };
    }
    function formEvTH(e) {
      var n = !e; e = e || { tipo: 'Celebración', fecha: hoy(), destinatarios: ['Todos'] };
      var dest = e.destinatarios || ['Todos'], img = null;
      var arbol = '<label class="check"><input type="checkbox" data-d="Todos"' + (dest.indexOf('Todos') >= 0 ? ' checked' : '') + '><b>Todo el personal</b></label>' + Object.keys(D.areas).map(function (a) {
        var subs = D.areas[a].length > 1 ? D.areas[a] : [];
        return '<div class="ev-area"><label class="check"><input type="checkbox" data-d="' + esc(a) + '"' + (dest.indexOf(a) >= 0 ? ' checked' : '') + '><b>' + esc(a) + '</b></label>' + (subs.length ? '<div class="ev-subs">' + subs.map(function (s) { var k = a + '/' + s; return '<label class="check"><input type="checkbox" data-d="' + esc(k) + '"' + (dest.indexOf(k) >= 0 ? ' checked' : '') + '>' + esc(s) + '</label>'; }).join('') + '</div>' : '') + '</div>';
      }).join('');
      var m = modal(n ? 'Nuevo evento CLEMI' : 'Editar · ' + e.titulo,
        '<div class="form-grid"><label class="campo ancho"><span class="req">Nombre del evento</span><input id="v-t" maxlength="160" value="' + esc(e.titulo || '') + '"></label>' +
        '<label class="campo"><span>Tipo</span><select id="v-tp">' + D.tipos.map(function (t) { return '<option' + (t === e.tipo ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label>' +
        '<label class="campo"><span>Lugar</span><input id="v-l" maxlength="200" value="' + esc(e.lugar || '') + '" placeholder="Ej. Aula Prima, cafetería, virtual"></label>' +
        '<label class="campo"><span class="req">Fecha</span><input id="v-f" type="date" value="' + esc(e.fecha || '') + '"></label><label class="campo"><span>Hasta (si dura varios días)</span><input id="v-ff" type="date" value="' + esc(e.fecha_fin || '') + '"></label>' +
        '<label class="campo"><span>Hora de inicio</span><input id="v-hi" type="time" value="' + esc(e.hora_ini || '') + '"></label><label class="campo"><span>Hora final</span><input id="v-hf" type="time" value="' + esc(e.hora_fin || '') + '"></label>' +
        '<label class="campo ancho"><span>Descripción</span><textarea id="v-d" maxlength="4000" rows="4">' + esc(e.descripcion || '') + '</textarea></label>' +
        '<label class="campo"><span>Ilustración interactiva</span><select id="v-tema"><option value="">Sin ilustración</option>' + (window.EvArte ? Object.keys(window.EvArte.temas()).map(function (k) { return '<option value="' + k + '"' + (k === e.tema ? ' selected' : '') + '>' + esc(window.EvArte.temas()[k]) + '</option>'; }).join('') : '') + '</select></label>' +
        '<div class="campo"><span>Vista previa</span><div class="ev-prev" id="v-prev"></div></div>' +
        '<label class="campo ancho"><span>Imagen o pieza gráfica (opcional, si no usa ilustración)</span><input id="v-img" type="file" accept="image/*">' + (e.imagen ? '<small>Ya tiene imagen. <label class="check" style="display:inline-flex"><input type="checkbox" id="v-qi">Quitarla</label></small>' : '') + '</label></div>' +
        '<div class="campo"><span class="req">Dirigido a</span><div class="ev-dest">' + arbol + '</div><small id="v-alc"></small></div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn" id="v-ok" type="button">Guardar borrador</button>' + (e.estado !== 'Publicado' ? '<button class="btn btn-oro" id="v-pub" type="button">Guardar y publicar</button>' : ''), { ancho: true });
      function leerDest() { return $$('[data-d]', m.el).filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute('data-d'); }); }
      function alc() { var d = leerDest(), a = evAlcance(d, D); $('#v-alc', m.el).textContent = d.length ? 'Llega a ' + a.usuarios + ' usuario(s) de la plataforma y por correo (institucional y personal) a ' + a.correos + ' persona(s).' : 'Elija a quién va dirigido.'; }
      $$('[data-d]', m.el).forEach(function (c) { c.onchange = function () {
        var k = c.getAttribute('data-d');
        if (k === 'Todos' && c.checked) $$('[data-d]', m.el).forEach(function (x) { if (x !== c) x.checked = false; });
        else if (c.checked) { $('[data-d="Todos"]', m.el).checked = false; if (k.indexOf('/') < 0) $$('[data-d^="' + k + '/"]', m.el).forEach(function (x) { x.checked = false; }); else { var pa = $('[data-d="' + k.split('/')[0] + '"]', m.el); if (pa) pa.checked = false; } }
        alc();
      }; });
      alc();
      function prev() { var t = $('#v-tema', m.el).value; $('#v-prev', m.el).innerHTML = t && window.EvArte ? window.EvArte.html(t) : '<div class="meta" style="padding:10px">Sin ilustración</div>'; if (window.EvArte) window.EvArte.activar($('#v-prev', m.el)); }
      $('#v-tema', m.el).onchange = prev; prev();
      $('#v-img', m.el).onchange = function () { var f = this.files[0]; if (!f) { img = null; return; } reducir(f, 1400, 0.82).then(function (d) { img = d; }, function (x) { errorEn(m, x.error); }); };
      function guardar(pub) {
        var datos = { id: n ? 0 : e.id, titulo: $('#v-t', m.el).value, tipo: $('#v-tp', m.el).value, lugar: $('#v-l', m.el).value, fecha: $('#v-f', m.el).value, fecha_fin: $('#v-ff', m.el).value, hora_ini: $('#v-hi', m.el).value, hora_fin: $('#v-hf', m.el).value,
          descripcion: $('#v-d', m.el).value, tema: $('#v-tema', m.el).value, destinatarios: leerDest(), imagen: img, quitar_imagen: $('#v-qi', m.el) && $('#v-qi', m.el).checked ? 1 : 0 };
        api('th_evento_guardar', datos).then(function (j) {
          if (!pub) { m.cerrar(); toast(e.estado === 'Publicado' ? 'Evento actualizado: se volvió a notificar a las áreas.' : 'Borrador guardado.'); return cargar(); }
          return api('th_evento_publicar', { id: j.id }).then(function (r) { m.cerrar(); toast('<b>Evento publicado.</b> Notificado en la plataforma' + (r.correos ? ' y por correo a ' + r.correos + ' persona(s)' : '') + '.'); cargar(); });
        }).catch(function (x) { errorEn(m, x.error); });
      }
      $('#v-ok', m.el).onclick = function () { guardar(false); };
      var bp = $('#v-pub', m.el); if (bp) bp.onclick = function () { guardar(true); };
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">Talento Humano</div><h1>Eventos CLEMI</h1><p>Celebraciones, capacitaciones, reuniones y fechas especiales. Al publicar, a las áreas les llega la notificación en la plataforma (campana de arriba) y por correo institucional y personal a cada funcionario.</p></div>' +
      '<button class="btn btn-oro" id="ev-nuevo" type="button">+ Nuevo evento</button></div>' +
      '<div class="prep-f" id="ev-tabs"><button type="button" data-v="proximos">Próximos</button><button type="button" data-v="pasados">Pasados</button></div><div id="ev-l" class="ev-lista"><div class="vacio">Cargando…</div></div>');
    $$('#ev-tabs button').forEach(function (b) { b.onclick = function () { ver = b.getAttribute('data-v'); pintar(); }; });
    $('#ev-nuevo').onclick = function () { if (D) formEvTH(null); };
    cargar();
    S.vista = { refrescar: function () { if (!$('.modal-fondo')) cargar(); } };
  }

  // Campana de eventos (todas las áreas)
  function evCampana() {
    var b = $('#btn-ev'); if (!b || !S.yo) return;
    api('ev_mios').then(function (j) {
      S.evMios = j.eventos;
      var nuevos = j.eventos.filter(function (e) { return e.nuevo; });
      b.hidden = !j.eventos.length; $('#ev-n').textContent = nuevos.length || ''; $('#ev-n').hidden = !nuevos.length;
      var ya = S.evAvisados || (S.evAvisados = {});
      nuevos.forEach(function (e) { if (ya[e.id]) return; ya[e.id] = 1; toast('<b>' + (e.estado === 'Cancelado' ? 'Evento cancelado' : 'Evento CLEMI') + ':</b> ' + esc(e.titulo) + ' · ' + esc(fCorta(e.fecha)) + ' <button class="btn-link" type="button" onclick="document.getElementById(\'btn-ev\').click()">Ver</button>'); });
    }, function () {});
  }
  function evAbrir() {
    var L = S.evMios || [];
    var m = modal('Eventos CLEMI', L.length ? '<div class="ev-lista mini">' + L.map(function (e) {
      return '<article class="ev-card' + (e.estado === 'Cancelado' ? ' cancelado' : '') + (e.nuevo ? ' nuevo' : '') + '">' + evMedia(e, true) +
        '<div class="ev-cuerpo">' + (e.nuevo ? '<span class="chip pe-cambio">Nuevo</span> ' : '') + (e.estado === 'Cancelado' ? '<span class="chip ct-can">Cancelado</span> ' : '') + '<span class="chip pe-sin">' + esc(e.tipo) + '</span><h3>' + esc(e.titulo) + '</h3>' +
        '<p class="meta" style="margin:0">' + esc(evCuando(e)) + (e.lugar ? ' · ' + esc(e.lugar) : '') + '</p>' + (e.descripcion ? '<p class="ev-desc">' + esc(e.descripcion) + '</p>' : '') + (e.estado === 'Cancelado' && e.cancelado_motivo ? '<p class="meta" style="margin:0">Motivo: ' + esc(e.cancelado_motivo) + '</p>' : '') + '</div></article>';
    }).join('') + '</div>' : '<div class="vacio">No hay eventos próximos.</div>', '<button class="btn btn-verde" data-cerrar type="button">Cerrar</button>', { ancho: true });
    if (window.EvArte) window.EvArte.activar(m.el);
    var ids = L.filter(function (e) { return e.nuevo; }).map(function (e) { return e.id; });
    if (ids.length) api('ev_visto', { ids: ids }).then(function () { L.forEach(function (e) { e.nuevo = false; }); $('#ev-n').hidden = true; $('#ev-n').textContent = ''; }, function () {});
  }

  function vPS(p) {
    if (p[0] === 'catalogo' && (puedePS() || puedeCT())) return vPSCatalogo();
    if (p[0] === 'biomedica') { location.replace('#/bm'); return; }
    if (!puedePS()) { location.hash = AREA_INICIO[areasYo()[0]]; return; }
    if (p[0] === 'contrato') return vPSContrato(+p[1]);
    if (p[0] === 'bodega') return vPSBodega();
    var datos = null, f = 'pendientes', q = '';
    function cargar() { return api('ppto_bandeja').then(function (j) { datos = j.presupuestos; pintar(); }, falla); }
    function pintar() {
      var cuenta = function (fn) { return datos.filter(fn).length; };
      var FIL = { pendientes: function (c) { return c.ppto_estado === 'solicitado'; }, especiales: function (c) { return c.especiales_pend > 0; }, emitidos: function (c) { return c.ppto_estado === 'emitido' || c.ppto_estado === 'ajustes'; },
        aceptados: function (c) { return c.ppto_estado === 'aceptado'; }, seleccion: function (c) { return ['sin_presupuesto', 'seleccion'].indexOf(c.ppto_estado) >= 0; }, todos: function () { return true; } };
      var k = function (n, t, x) { return '<button type="button" class="kpi' + (f === x ? ' is-on' : '') + '" data-f="' + x + '"><b>' + n + '</b><span>' + t + '</span></button>'; };
      $('#ps-kpis').innerHTML = k(cuenta(FIL.pendientes), 'por valorar', 'pendientes') + k(datos.reduce(function (s, c) { return s + c.especiales_pend; }, 0), 'solicitudes especiales por responder', 'especiales') +
        k(cuenta(FIL.emitidos), 'emitidos o con ajustes', 'emitidos') + k(cuenta(FIL.aceptados), 'aceptados', 'aceptados') + k(cuenta(FIL.seleccion), 'en selección del cliente', 'seleccion');
      $$('#ps-kpis [data-f]').forEach(function (b) { b.onclick = function () { f = b.getAttribute('data-f'); $('#ps-f').value = f; pintar(); }; });
      var L = datos.filter(FIL[f] || FIL.todos).filter(function (c) { return !q || (c.codigo + ' ' + c.cliente + ' ' + c.curso).toLowerCase().indexOf(q) >= 0; });
      $('#ps-lista').innerHTML = L.length ? '<div class="tabla-wrap"><table class="tabla tabla-click"><thead><tr><th>Código</th><th>Cliente y curso</th><th>Fechas</th><th>Presupuesto</th><th class="num">Líneas</th><th class="num">Especiales</th><th class="num">Total</th></tr></thead><tbody>' +
        L.map(function (c) {
          return '<tr data-id="' + c.id + '"><td class="num"><b>' + esc(c.codigo) + '</b><br>' + chipCT(c.estado) + '</td><td><b>' + esc(c.cliente) + '</b><br><span class="meta">' + esc(c.curso) + (c.participantes ? ' · ' + c.participantes + ' participantes' : '') + '</span></td>' +
            '<td style="white-space:nowrap">' + esc(rangoCT(c)) + '<br><span class="meta">' + esc(c.sala_nombre) + ' · ' + faltan(c.fecha_inicio) + '</span></td><td>' + chipPpto(c.ppto_estado) + '</td>' +
            '<td class="num">' + c.lineas + (c.sin_precio ? '<br><span class="pp-sin">' + c.sin_precio + ' sin precio</span>' : '') + '</td><td class="num">' + c.especiales + (c.especiales_pend ? '<br><span class="pp-sin">' + c.especiales_pend + ' por responder</span>' : '') + '</td><td class="num">' + (c.total ? pesos(c.total) : '—') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="vacio"><strong>Nada en esta bandeja</strong>Cuando Operaciones o el cliente envíen una selección, aparecerá aquí para valorarla.</div>';
      $$('#ps-lista tr[data-id]').forEach(function (tr) { tr.onclick = function () { location.hash = '#/ps/contrato/' + tr.getAttribute('data-id'); }; });
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">2 · Cotización</div><h1>Cotizaciones</h1><p>Cada solicitud de contratación con lo que el cliente eligió del catálogo y sus solicitudes especiales. Asigne valores, confirme si lo especial se puede conseguir y emita el presupuesto.</p></div>' +
      '<div class="acciones"><a class="btn" href="#/ps/bodega">Bodega</a><a class="btn" href="#/ps/catalogo">Catálogo de presupuesto</a></div></div><div class="kpis" id="ps-kpis"></div>' +
      '<div class="panel"><div class="panel-cab"><select id="ps-f" style="max-width:260px"><option value="pendientes">Por valorar</option><option value="especiales">Con solicitudes especiales por responder</option><option value="emitidos">Emitidos o con ajustes</option><option value="aceptados">Aceptados</option><option value="seleccion">En selección del cliente</option><option value="todos">Todos</option></select>' +
      '<input type="search" id="ps-q" placeholder="Buscar cliente, curso, código…" style="max-width:320px"></div><div id="ps-lista"><div class="vacio">Cargando…</div></div></div>');
    $('#ps-f').onchange = function () { f = this.value; pintar(); };
    $('#ps-q').oninput = function () { q = this.value.toLowerCase(); pintar(); };
    S.vista = { refrescar: cargar };
    cargar();
  }
  function vPSContrato(id) {
    montar('<a class="miga" href="#/ps">← Cotizaciones</a><section class="ev-cab ct-cab" id="psc-cab"><h1>Cargando…</h1></section><div id="psc"></div>');
    function cab() {
      return api('ppto&id=' + id).then(function (j) {
        var c = j.contrato;
        $('#psc-cab').innerHTML = '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' + chipCT(c.estado) + chipPpto(c.ppto_estado) + '<span class="chip" style="background:rgba(255,255,255,.1);color:#e8efe9">' + esc(c.codigo) + '</span></div>' +
          '<h1 style="margin-top:8px">' + esc(c.curso) + '</h1><div class="ev-datos"><span><b>' + esc(c.cliente) + '</b></span><span>' + esc(c.sala_nombre) + '</span><span class="num">' + esc(rangoCT(c)) + ' · ' + esc(c.hora_ini) + '–' + esc(c.hora_fin) + ' · inicia ' + faltan(c.fecha_inicio) + '</span>' +
          (c.participantes ? '<span>' + c.participantes + ' participantes</span>' : '') + (c.estaciones ? '<span>' + c.estaciones + ' estaciones</span>' : '') + (c.componentes ? '<span>' + c.componentes + ' componentes anatómicos' + (c.tipo_componente ? ' · ' + esc(c.tipo_componente) : '') + '</span>' : '') + '</div>';
      }, function (e) { $('#psc-cab').innerHTML = '<h1>' + esc(e.error) + '</h1>'; });
    }
    cab();
    var P = panelPresupuesto($('#psc'), id, { recargar: cab });
    S.vista = { refrescar: function () { cab(); P.recargar(); } };
  }

  // Catálogo de presupuesto: consulta (Operaciones) y edición / carga desde Excel (Presupuesto)
  function vPSCatalogo() {
    var K = null, q = '', cat = '', ver = 'activos';
    function cargar() { return api('pp_catalogo').then(function (j) { K = j; pintar(); }, falla); }
    function pintar() {
      var L = K.items.filter(function (i) { return (ver === 'todos' || (ver === 'activos' ? +i.activo : !+i.activo)) && (!cat || i.categoria === cat) && (!q || (i.codigo + ' ' + i.nombre + ' ' + i.descripcion).toLowerCase().indexOf(q) >= 0); });
      var sinP = K.items.filter(function (i) { return +i.activo && i.precio == null; }).length;
      $('#ppc-n').textContent = L.length + ' elementos' + (sinP ? ' · ' + sinP + ' por cotizar' : '');
      var g = {}; L.forEach(function (i) { (g[i.categoria] = g[i.categoria] || []).push(i); });
      $('#ppc').innerHTML = L.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Código</th><th>Elemento</th><th>Unidad</th><th class="num">Valor unitario</th><th>Grupo</th>' + (K.puede_editar ? '<th class="num">Existencia</th><th></th>' : '<th>Origen</th>') + '</tr></thead><tbody>' +
        K.categorias.concat(Object.keys(g).filter(function (k) { return K.categorias.indexOf(k) < 0; })).filter(function (k) { return g[k]; }).map(function (k) {
          return '<tr class="pp-grupo"><td colspan="' + (K.puede_editar ? 7 : 6) + '">' + esc(k) + ' · ' + g[k].length + '</td></tr>' + g[k].map(function (i) {
            return '<tr' + (+i.activo ? '' : ' style="opacity:.55"') + '><td class="num">' + esc(i.codigo || '—') + '</td><td><b>' + esc(i.nombre) + '</b>' + (i.descripcion ? '<br><span class="meta">' + esc(i.descripcion) + '</span>' : '') + '</td><td>' + esc(i.unidad) + '</td>' +
              '<td class="num">' + (i.precio == null ? '<span class="pp-sin">Por cotizar</span>' : pesos(i.precio)) + '</td><td class="meta">' + esc(i.grupo) + (+i.visible_cliente ? '' : '<br><span class="chip pe-sin">Solo uso interno</span>') + '</td>' +
              (K.puede_editar ? '<td class="num">' + (i.stock == null ? '<span class="meta">—</span>' : '<b' + (i.stock <= 0 ? ' class="pp-sin"' : '') + '>' + numTxt(i.stock) + '</b>' + (+i.inv_bio ? '<br><span class="meta">inventario biomédico</span>' : '')) + '</td><td><button class="btn btn-sm" data-ed="' + i.id + '" type="button">Editar</button></td>' : '<td class="meta">' + esc(i.origen || '') + '</td>') + '</tr>';
          }).join('');
        }).join('') + '</tbody></table></div>' : '<div class="vacio">Sin elementos con ese filtro.</div>';
      $$('#ppc [data-ed]').forEach(function (b) { b.onclick = function () { editar(K.items.find(function (i) { return +i.id === +b.getAttribute('data-ed'); })); }; });
    }
    function editar(i) {
      var n = !i; i = i || { codigo: '', categoria: K.categorias[0], nombre: '', descripcion: '', unidad: 'unidad', precio: null, grupo: 'Bienes y servicios', activo: 1 };
      var m = modal(n ? 'Nuevo elemento' : i.nombre, '<div class="form-grid">' +
        '<label class="campo"><span>Código</span><input id="x-co" maxlength="30" value="' + esc(i.codigo || '') + '" placeholder="Automático"></label>' +
        '<label class="campo"><span class="req">Categoría</span><select id="x-ca">' + K.categorias.map(function (c) { return '<option' + (c === i.categoria ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
        '<label class="campo ancho"><span class="req">Nombre</span><input id="x-n" maxlength="160" value="' + esc(i.nombre) + '"></label>' +
        '<label class="campo ancho"><span>Descripción</span><input id="x-d" maxlength="400" value="' + esc(i.descripcion || '') + '"></label>' +
        '<label class="campo"><span>Unidad</span><input id="x-u" maxlength="40" value="' + esc(i.unidad) + '" placeholder="unidad, día, kit por estación…"></label>' +
        '<label class="campo"><span>Valor unitario (COP)</span><input id="x-p" inputmode="numeric" value="' + (i.precio == null ? '' : Math.round(i.precio)) + '" placeholder="Vacío = por cotizar"><small>Antes de IVA.</small></label>' +
        '<label class="campo"><span>Grupo en el convenio</span><select id="x-g">' + K.grupos.map(function (g) { return '<option' + (g === i.grupo ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') + '</select></label>' +
        '<label class="campo"><span>Área (carrito del cliente)</span><select id="x-ar"><option value="">Según la categoría</option>' + (K.areas || []).map(function (a) { return '<option' + (a === i.area ? ' selected' : '') + '>' + esc(a) + '</option>'; }).join('') + '</select></label>' +
        '<label class="check"><input type="checkbox" id="x-a"' + (+i.activo ? ' checked' : '') + '>Disponible en el catálogo</label><label class="check"><input type="checkbox" id="x-vc"' + (i.visible_cliente == null || +i.visible_cliente ? ' checked' : '') + '>El cliente lo ve en su enlace</label></div>' + (i.stock != null ? '<p class="meta" style="margin:0">En bodega: <b>' + numTxt(i.stock) + '</b> ' + esc(i.unidad) + '.</p>' : ''),
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="x-ok" type="button">Guardar</button>');
      $('#x-ok', m.el).onclick = function () {
        api('pp_item_guardar', { id: n ? 0 : i.id, codigo: $('#x-co', m.el).value, categoria: $('#x-ca', m.el).value, nombre: $('#x-n', m.el).value, descripcion: $('#x-d', m.el).value, unidad: $('#x-u', m.el).value, precio: soloDig($('#x-p', m.el).value), grupo: $('#x-g', m.el).value, area: $('#x-ar', m.el).value, activo: $('#x-a', m.el).checked ? 1 : 0, visible_cliente: $('#x-vc', m.el).checked ? 1 : 0 })
          .then(function () { m.cerrar(); toast('Catálogo actualizado.'); cargar(); }, function (e) { errorEn(m, e.error); });
      };
    }
    function importar() {
      var filas = null, cab = [], nombre = '';
      var CAMPOS = [['codigo', 'Código', /c[oó]d|^ref|referencia|sku/], ['nombre', 'Nombre o descripción', /nombre|producto|art[ií]culo|elemento|concepto|descrip|^item|insumo|equipo/], ['categoria', 'Categoría', /categor|tipo|grupo|familia|l[ií]nea|clase/],
        ['unidad', 'Unidad', /unidad|^und|u\/m|medida|presentaci/], ['precio', 'Valor unitario', /precio|valor|costo|tarifa|vr|unitario/], ['descripcion', 'Detalle (opcional)', /detalle|observ|especific|nota/]];
      var m = modal('Cargar el catálogo desde Excel', '<p class="meta" style="margin:0">Suba el Excel de presupuesto de almacén. La primera fila con títulos se detecta sola; revise qué columna corresponde a cada dato. Los elementos se actualizan por código (o por nombre y categoría si no hay código).</p>' +
        '<label class="campo"><span class="req">Archivo</span><input type="file" id="im-f" accept=".xlsx,.xls,.csv"></label><div id="im-hoja"></div><div id="im-map"></div><div id="im-prev"></div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="im-ok" type="button" disabled>Importar</button>', { ancho: true });
      var wb = null;
      function usarHoja(nom) {
        var raw = XLSX.utils.sheet_to_json(wb.Sheets[nom], { header: 1, raw: true, defval: '' });
        var hi = 0; for (var r = 0; r < Math.min(raw.length, 15); r++) { var t = raw[r].join(' ').toLowerCase(); if (/nombre|producto|descrip|art[ií]culo|elemento|concepto/.test(t)) { hi = r; break; } }
        cab = raw[hi].map(function (x) { return String(x).trim(); }); filas = raw.slice(hi + 1).filter(function (f) { return f.some(function (x) { return String(x).trim() !== ''; }); });
        $('#im-map', m.el).innerHTML = '<div class="form-grid">' + CAMPOS.map(function (c) {
          var idx = cab.findIndex(function (h) { return c[2].test(h.toLowerCase()); });
          if (c[0] === 'descripcion' && idx >= 0 && cab[idx] && CAMPOS[1][2].test(cab[idx].toLowerCase())) idx = -1;
          return '<label class="campo"><span>' + c[1] + '</span><select data-c="' + c[0] + '"><option value="-1">— No usar —</option>' + cab.map(function (h, i) { return '<option value="' + i + '"' + (i === idx ? ' selected' : '') + '>' + esc(h || 'Columna ' + (i + 1)) + '</option>'; }).join('') + '</select></label>';
        }).join('') + '</div><label class="check"><input type="checkbox" id="im-des">Desactivar los elementos del catálogo que no estén en este archivo</label>';
        $$('#im-map select', m.el).forEach(function (s) { s.onchange = prev; }); prev();
      }
      function mapa() { var o = {}; $$('#im-map select', m.el).forEach(function (s) { o[s.getAttribute('data-c')] = +s.value; }); return o; }
      function convertir() { var mp = mapa(); return filas.map(function (f) { var o = {}; Object.keys(mp).forEach(function (k) { if (mp[k] >= 0) o[k] = f[mp[k]]; }); return o; }).filter(function (o) { return String(o.nombre || '').trim(); }); }
      function prev() {
        var L = convertir();
        $('#im-ok', m.el).disabled = !L.length || mapa().nombre < 0;
        $('#im-prev', m.el).innerHTML = '<p class="meta" style="margin:8px 0 4px"><b>' + L.length + '</b> elementos con nombre. Vista previa:</p><div class="tabla-wrap"><table class="tabla"><thead><tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Unidad</th><th class="num">Valor</th></tr></thead><tbody>' +
          L.slice(0, 8).map(function (o) { return '<tr><td>' + esc(o.codigo || '') + '</td><td>' + esc(o.nombre) + '</td><td>' + esc(o.categoria || '') + '</td><td>' + esc(o.unidad || '') + '</td><td class="num">' + esc(o.precio == null ? '' : o.precio) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      }
      $('#im-f', m.el).onchange = function () {
        var f = this.files[0]; if (!f) return; nombre = f.name;
        var rd = new FileReader();
        rd.onload = function () {
          try {
            if (!window.XLSX) throw { message: 'No se pudo cargar el lector de Excel.' };
            wb = /\.csv$/i.test(f.name) ? XLSX.read(new TextDecoder('utf-8').decode(new Uint8Array(rd.result)), { type: 'string' }) : XLSX.read(new Uint8Array(rd.result), { type: 'array' });
            $('#im-hoja', m.el).innerHTML = wb.SheetNames.length > 1 ? '<label class="campo"><span>Hoja</span><select id="im-h">' + wb.SheetNames.map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select></label>' : '';
            if ($('#im-h', m.el)) $('#im-h', m.el).onchange = function () { usarHoja(this.value); };
            usarHoja(wb.SheetNames[0]);
          } catch (e) { errorEn(m, 'No se pudo leer el archivo: ' + (e.message || e)); }
        };
        rd.readAsArrayBuffer(f);
      };
      $('#im-ok', m.el).onclick = function () {
        var b = this; b.disabled = true;
        api('pp_importar', { filas: convertir(), desactivar_resto: $('#im-des', m.el).checked ? 1 : 0, archivo: nombre }).then(function (j) {
          m.cerrar(); toast('<b>Catálogo cargado:</b> ' + j.nuevos + ' nuevos, ' + j.actualizados + ' actualizados' + (j.desactivados ? ', ' + j.desactivados + ' desactivados' : '') + '.'); cargar();
        }, function (e) { b.disabled = false; errorEn(m, e.error); });
      };
    }
    function exportar() {
      if (!window.XLSX) return toast('No se pudo cargar el generador de Excel.', 'error');
      var rows = K.items.map(function (i) { return { 'Código': i.codigo, 'Categoría': i.categoria, 'Nombre': i.nombre, 'Descripción': i.descripcion, 'Unidad': i.unidad, 'Valor unitario': i.precio == null ? '' : Math.round(i.precio), 'Grupo': i.grupo, 'Activo': +i.activo ? 'Sí' : 'No' }; });
      var wb = XLSX.utils.book_new(), h = XLSX.utils.json_to_sheet(rows); h['!cols'] = [10, 22, 44, 40, 18, 14, 18, 8].map(function (w) { return { wch: w }; });
      XLSX.utils.book_append_sheet(wb, h, 'Catálogo'); guardarArchivo(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Catalogo-presupuesto-CLEMI.xlsx').catch(falla);
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">2 · Cotización</div><h1>Catálogo de presupuesto</h1><p>Instrumental, equipos, insumos, servicios y demás elementos que CLEMI dispone. De aquí elige el cliente en su enlace; los valores solo los ve cuando Presupuesto emite.</p></div>' +
      '<div class="acciones"><button class="btn" id="ppc-x" type="button">Exportar a Excel</button>' + (puedePS() ? '<button class="btn" id="ppc-im" type="button">Cargar desde Excel</button><button class="btn btn-oro" id="ppc-new" type="button">+ Nuevo elemento</button>' : '') + '</div></div>' +
      '<div class="panel"><div class="panel-cab"><div class="acciones"><select id="ppc-c" style="max-width:240px"><option value="">Todas las categorías</option></select><select id="ppc-v" style="max-width:160px"><option value="activos">Disponibles</option><option value="inactivos">Inactivos</option><option value="todos">Todos</option></select>' +
      '<input type="search" id="ppc-q" placeholder="Buscar…" style="max-width:260px"></div><span class="meta" id="ppc-n"></span></div><div id="ppc"><div class="vacio">Cargando…</div></div></div>');
    $('#ppc-q').oninput = function () { q = this.value.toLowerCase(); if (K) pintar(); };
    $('#ppc-c').onchange = function () { cat = this.value; if (K) pintar(); };
    $('#ppc-v').onchange = function () { ver = this.value; if (K) pintar(); };
    $('#ppc-x').onclick = function () { if (K) exportar(); };
    var b; if ((b = $('#ppc-new'))) b.onclick = function () { editar(null); };
    if ((b = $('#ppc-im'))) b.onclick = importar;
    S.vista = { refrescar: cargar };
    cargar().then(function () { if (K) $('#ppc-c').innerHTML += K.categorias.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join(''); });
  }

  // ================================================================== LISTADOS: PARTICIPANTES, INSTRUCTORES Y STAFF
  var ROL_CLS = { Participante: 'rol-par', Instructor: 'rol-ins', Staff: 'rol-staff' };
  function chipRol(r) { r = r || 'Participante'; return '<span class="chip ' + (ROL_CLS[r] || 'rol-par') + '">' + esc(r) + '</span>'; }
  function leyendaRoles(n) {
    return '<div class="rol-ley">' + ['Participante', 'Instructor', 'Staff'].map(function (r) { return '<span class="chip ' + ROL_CLS[r] + '">' + r + (n ? ' · ' + (n[r] || 0) : '') + '</span>'; }).join('') + '</div>';
  }
  function cuentaRoles(L) { var n = { Participante: 0, Instructor: 0, Staff: 0 }; L.forEach(function (p) { n[p.rol || 'Participante'] = (n[p.rol || 'Participante'] || 0) + 1; }); return n; }

  // ================================================================== LOGÍSTICA
  function puedeLG() { return !!S.yo && (esAdmin() || areasYo().indexOf('lg') >= 0); }
  // Distintivo de cada hotel aliado: el logo oficial si se cargó; si no, su nombre con los colores del hotel.
  function hotelLogo(k, H, logos, chico) {
    var h = (H || {})[k] || { nombre: k, color: '#444', fondo: '#fff' };
    if (logos && logos[k]) return '<span class="hotel-logo' + (chico ? ' chico' : '') + '"><img src="' + esc(logos[k]) + '" alt="' + esc(h.nombre) + '"></span>';
    var t = { ibis: '<b style="font-family:Arial Black,Arial,sans-serif;letter-spacing:-.02em;text-transform:lowercase">ibis</b>', sabana: '<b>SABANA</b><small>PARK HOTEL</small>', b3: '<b style="font-size:1.35em">B3</b><small>HOTEL</small>', popart: '<b>Pop</b><b style="font-style:italic">Art</b><small>HOTEL</small>', otros: '<b>OTROS</b><small>otro lugar</small>' }[k] || '<b>' + esc(h.nombre) + '</b>';
    return '<span class="hotel-logo txt hl-' + k + (chico ? ' chico' : '') + '" style="color:' + h.color + ';background:' + h.fondo + '" title="' + esc(h.nombre) + '">' + t + '</span>';
  }
  var VUELO_COL = { 'Programado': 'pe-sin', 'Confirmado': 'pe-enviado', 'En vuelo': 'st-programado', 'Aterrizó': 'pe-aprobado', 'Retrasado': 'pe-cambio', 'Cancelado': 'ct-can' };
  function fh(x) { return x ? fCorta(x.slice(0, 10)) + ' · ' + x.slice(11, 16) : '—'; }

  function vLG(p) {
    if (!puedeLG()) { location.hash = AREA_INICIO[areasYo()[0]]; return; }
    if (p[0] === 'ev') return vLGEvento(+p[1], p[2]);
    if (p[0] === 'hoteles') return vLGHoteles();
    var D = null;
    function cargar() { return api('lg_resumen').then(function (j) { D = j; pintar(); }, falla); }
    function pintar() {
      if (!$('#lg-l')) return;
      var E = D.eventos, per = E.reduce(function (s, e) { return s + e.personas; }, 0), res = E.reduce(function (s, e) { return s + e.con_restriccion; }, 0);
      var huesp = D.hosp_hotel.reduce(function (s, h) { return s + +h.n; }, 0);
      $('#lg-k').innerHTML = '<div class="kpi"><b>' + E.length + '</b><span>entrenamientos en curso y próximos</span></div><div class="kpi"><b>' + per + '</b><span>personas en los listados</span></div>' +
        '<div class="kpi oro"><b>' + res + '</b><span>con restricción alimentaria</span></div><div class="kpi"><b>' + D.vuelos_hoy.length + '</b><span>vuelos hoy y mañana</span></div><div class="kpi"><b>' + huesp + '</b><span>huéspedes en hoteles aliados</span></div>';
      $('#lg-h').innerHTML = Object.keys(D.hoteles).map(function (k) { var n = D.hosp_hotel.find(function (x) { return x.hotel === k; }); return '<a class="lg-hotel" href="#/lg/hoteles">' + hotelLogo(k, D.hoteles, D.logos) + '<span><b>' + (n ? n.n : 0) + '</b> huésped(es)</span></a>'; }).join('');
      $('#lg-v').innerHTML = D.vuelos_hoy.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Hora</th><th>Persona</th><th>Vuelo</th><th>Entrenamiento</th><th>Estado</th></tr></thead><tbody>' + D.vuelos_hoy.map(function (v) {
        return '<tr><td style="white-space:nowrap"><b>' + esc(fh(v.fecha_hora)) + '</b><br><span class="meta">' + esc(v.sentido) + '</span></td><td>' + chipRol(v.rol) + ' <b>' + esc((v.nombre || '') + ' ' + (v.apellido || '')) + '</b></td><td>' + esc(v.aerolinea + ' ' + v.numero) + (v.ciudad ? '<br><span class="meta">' + (v.sentido === 'Llegada' ? 'desde ' : 'hacia ') + esc(v.ciudad) + '</span>' : '') + '</td><td><a href="#/lg/ev/' + v.evento_id + '/vuelos">' + esc(v.titulo) + '</a></td><td><span class="chip ' + (VUELO_COL[v.estado] || '') + '">' + esc(v.estado) + '</span></td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="panel-cuerpo meta">No hay vuelos registrados para hoy ni mañana.</div>';
      $('#lg-l').innerHTML = E.length ? '<div class="tabla-wrap"><table class="tabla tabla-click"><thead><tr><th>Entrenamiento</th><th>Fechas y sala</th><th>Listado</th><th>Comedor</th><th>Vuelos</th><th>Hospedaje</th><th>Traslados</th></tr></thead><tbody>' + E.map(function (e) {
        return '<tr data-id="' + e.id + '"><td><b>' + esc(e.titulo) + '</b><br><span class="meta">' + esc(e.convenio || e.empresa || '') + (e.convenio_codigo ? ' · ' + esc(e.convenio_codigo) : '') + '</span></td>' +
          '<td style="white-space:nowrap">' + esc(e.fecha === e.fecha_fin ? fCorta(e.fecha) : fCorta(e.fecha) + ' – ' + fCorta(e.fecha_fin)) + '<br><span class="meta">' + esc(e.sala_nombre || '') + ' · ' + faltan(e.fecha) + '</span></td>' +
          '<td><span class="chip rol-par">' + e.participantes + '</span> <span class="chip rol-ins">' + e.instructores + '</span> <span class="chip rol-staff">' + e.staff + '</span></td>' +
          '<td>' + (e.con_restriccion ? '<b>' + e.con_restriccion + '</b> con restricción' : '<span class="meta">Sin restricciones</span>') + '</td><td>' + (e.vuelos || '—') + '</td><td>' + (e.hospedajes || '—') + '</td><td>' + (e.transportes || '—') + '</td></tr>';
      }).join('') + '</tbody></table></div>' + leyendaRoles() : '<div class="vacio"><strong>No hay entrenamientos próximos</strong>Cuando un convenio pase a la agenda, aquí aparece con su listado de participantes, instructores y staff.</div>';
      $$('#lg-l tr[data-id]').forEach(function (tr) { tr.onclick = function () { location.hash = '#/lg/ev/' + tr.getAttribute('data-id'); }; });
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">4 · La operación</div><h1>Logística</h1><p>Comedor (alimentación y restricciones de cada persona), traslados Hotel · CLEMI · Aeropuerto, seguimiento de vuelos y hospedaje en los hoteles aliados.</p></div><div class="acciones"><a class="btn" href="#/lg/hoteles">Hoteles aliados</a></div></div>' +
      '<div class="kpis" id="lg-k"></div><div class="lg-hoteles" id="lg-h"></div>' +
      '<div class="panel"><div class="panel-cab"><h2>Entrenamientos</h2></div><div id="lg-l"><div class="vacio">Cargando…</div></div></div>' +
      '<div class="panel"><div class="panel-cab"><h2>Vuelos de hoy y mañana</h2></div><div id="lg-v"></div></div>');
    cargar(); S.vista = { refrescar: cargar };
  }

  function vLGEvento(id, tab) {
    var D = null; tab = tab || S.lgTab || 'comedor';
    var dia = null;
    function cargar() { return api('lg_evento&id=' + id).then(function (j) { D = j; if (!dia || !D.dias.some(function (d) { return d.fecha === dia; })) { dia = (D.dias.find(function (d) { return d.fecha === hoy(); }) || D.dias[0] || { fecha: D.evento.fecha }).fecha; } pintar(); }, falla); }
    function per(pid) { return D.personas.find(function (p) { return +p.id === +pid; }) || { nombre: '—', apellido: '', rol: '' }; }
    function nom(p) { return (p.nombre + ' ' + (p.apellido || '')).trim(); }
    function opcPersonas(sel) { return D.personas.filter(function (p) { return !+p.anulado; }).map(function (p) { return '<option value="' + p.id + '"' + (+p.id === +sel ? ' selected' : '') + '>' + esc(nom(p)) + ' · ' + esc(p.rol) + '</option>'; }).join(''); }
    function pintar() {
      if (!$('#lge-c')) return;
      var e = D.evento;
      $('#lge-cab').innerHTML = '<div class="eyebrow">Logística' + (e.convenio ? ' · ' + esc(e.convenio.codigo) : '') + '</div><h1>' + esc(e.titulo) + '</h1><p class="meta" style="margin:0">' + esc(e.convenio ? e.convenio.nombre : e.empresa || '') + ' · ' + esc(e.sala || '') + ' · ' + esc(e.fecha === e.fecha_fin ? fLarga(e.fecha) : fCorta(e.fecha) + ' – ' + fCorta(e.fecha_fin)) + '</p>' + leyendaRoles(cuentaRoles(D.personas));
      $$('#lge-t button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-t') === tab); });
      ({ comedor: tComedor, vuelos: tVuelos, hospedaje: tHosp, transportes: tTransp, listado: tListado }[tab] || tComedor)($('#lge-c'));
    }
    function tListado(c) {
      var L = D.personas;
      c.innerHTML = '<div class="panel"><div class="panel-cab"><h2>Listado del entrenamiento</h2><span class="meta">' + L.length + ' personas · el rol y los datos se registran en Participantes del entrenamiento</span></div>' +
        (L.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Rol</th><th>Nombre</th><th>Documento</th><th>Institución / especialidad</th><th>Contacto</th><th>Alimentación</th></tr></thead><tbody>' + L.map(function (p) {
          return '<tr class="fila-' + (ROL_CLS[p.rol] || 'rol-par') + '"><td>' + chipRol(p.rol) + '</td><td><b>' + esc(nom(p)) + '</b></td><td class="num">' + esc(p.documento || '') + '</td><td>' + esc([p.institucion, p.especialidad].filter(Boolean).join(' · ') || '—') + '</td><td class="meta">' + esc([p.telefono, p.correo].filter(Boolean).join(' · ') || '—') + '</td><td>' + dietasTxt(p) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="vacio"><strong>Sin listado</strong>Cargue el listado en el entrenamiento (Agenda → entrenamiento → Participantes), con su rol: participante, instructor o staff.</div>') + '</div>';
    }
    function dietasTxt(p) { return (p.dietas || []).map(function (d) { return '<span class="chip dieta">' + esc(d) + '</span>'; }).join(' ') + (p.restriccion ? ' <span class="meta">' + esc(p.restriccion) + '</span>' : '') || '<span class="meta">—</span>'; }
    function tComedor(c) {
      var C = D.comidas, L = D.personas.filter(function (p) { return !+p.anulado; });
      var reg = {}; D.comidas_reg.forEach(function (r) { reg[r.inscrito_id + '|' + r.fecha + '|' + r.comida] = r; });
      var cnt = {}; L.forEach(function (p) { (p.dietas || []).forEach(function (d) { cnt[d] = (cnt[d] || 0) + 1; }); });
      var conRes = L.filter(function (p) { return (p.dietas || []).length || p.restriccion; });
      c.innerHTML = '<div class="panel"><div class="panel-cab lg-com-cab"><div><h2>Comedor</h2><span class="meta">Marque cada servicio entregado. Toque una persona para registrar sus restricciones.</span></div><div class="acciones">' +
        (D.dias.length > 1 ? '<select id="cm-d">' + D.dias.map(function (d) { return '<option value="' + d.fecha + '"' + (d.fecha === dia ? ' selected' : '') + '>' + esc(fCorta(d.fecha)) + (d.fecha === hoy() ? ' · hoy' : '') + '</option>'; }).join('') + '</select>' : '<b>' + esc(fCorta(dia)) + '</b>') +
        '<button class="btn btn-sm" id="cm-x" type="button">Excel para cocina</button></div></div>' +
        '<div class="lg-com-res">' + Object.keys(C).map(function (k) { var n = L.filter(function (p) { return reg[p.id + '|' + dia + '|' + k]; }).length; return '<div class="lg-com-k"><b>' + n + ' / ' + L.length + '</b><span>' + esc(C[k]) + '</span><button class="btn-link" type="button" data-todos="' + k + '" data-m="' + (n < L.length ? 1 : 0) + '">' + (n < L.length ? 'Marcar todos' : 'Desmarcar todos') + '</button></div>'; }).join('') + '</div>' +
        '<div class="lg-cocina"><b>Para cocina:</b> ' + (Object.keys(cnt).length ? Object.keys(cnt).map(function (d) { return '<span class="chip dieta">' + esc(d) + ' · ' + cnt[d] + '</span>'; }).join(' ') : '<span class="meta">sin dietas especiales registradas</span>') +
        (conRes.filter(function (p) { return p.restriccion; }).length ? '<ul>' + conRes.filter(function (p) { return p.restriccion; }).map(function (p) { return '<li>' + chipRol(p.rol) + ' <b>' + esc(nom(p)) + ':</b> ' + esc(p.restriccion) + '</li>'; }).join('') + '</ul>' : '') + '</div>' +
        (L.length ? '<div class="tabla-wrap"><table class="tabla lg-com"><thead><tr><th>Persona</th><th>Dieta / restricción</th>' + Object.keys(C).map(function (k) { return '<th class="c">' + esc(C[k]) + '</th>'; }).join('') + '</tr></thead><tbody>' + L.map(function (p) {
          return '<tr class="fila-' + (ROL_CLS[p.rol] || 'rol-par') + '"><td><button type="button" class="btn-link lg-p" data-ed="' + p.id + '">' + chipRol(p.rol) + ' <b>' + esc(nom(p)) + '</b></button></td><td>' + dietasTxt(p) + '</td>' +
            Object.keys(C).map(function (k) { var r = reg[p.id + '|' + dia + '|' + k]; return '<td class="c"><input type="checkbox" class="lg-chk" data-p="' + p.id + '" data-c="' + k + '"' + (r ? ' checked title="' + esc(r.entregado_por + ' · ' + momento(r.entregado_en)) + '"' : '') + ' aria-label="' + esc(C[k] + ' ' + nom(p)) + '"></td>'; }).join('') + '</tr>';
        }).join('') + '</tbody></table></div>' : '<div class="vacio"><strong>Sin listado</strong>Cuando se cargue el listado del entrenamiento, aquí se controla la alimentación de cada persona.</div>') + '</div>';
      var x;
      if ((x = $('#cm-d', c))) x.onchange = function () { dia = this.value; pintar(); };
      $('#cm-x', c).onclick = function () {
        if (!window.XLSX) return toast('No se pudo cargar el generador de Excel.', 'error');
        var rows = L.map(function (p) { var o = { 'Rol': p.rol, 'Nombre': nom(p), 'Dietas': (p.dietas || []).join(', '), 'Restricción / alergia': p.restriccion || '' }; Object.keys(C).forEach(function (k) { o[C[k]] = reg[p.id + '|' + dia + '|' + k] ? 'Sí' : ''; }); return o; });
        var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Comedor ' + dia);
        guardarArchivo(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Comedor-' + dia + '.xlsx').catch(falla);
      };
      $$('.lg-chk', c).forEach(function (b) { b.onchange = function () { api('lg_comida', { evento_id: id, inscrito_id: +b.getAttribute('data-p'), fecha: dia, comida: b.getAttribute('data-c'), entregado: b.checked ? 1 : 0 }).then(function () { if (b.checked) D.comidas_reg.push({ inscrito_id: +b.getAttribute('data-p'), fecha: dia, comida: b.getAttribute('data-c'), entregado_por: S.yo.nombre, entregado_en: '' }); else D.comidas_reg = D.comidas_reg.filter(function (r) { return !(+r.inscrito_id === +b.getAttribute('data-p') && r.fecha === dia && r.comida === b.getAttribute('data-c')); }); pintar(); }, function (e) { b.checked = !b.checked; falla(e); }); }; });
      $$('[data-todos]', c).forEach(function (b) { b.onclick = function () { api('lg_comida', { evento_id: id, inscrito_id: 0, fecha: dia, comida: b.getAttribute('data-todos'), entregado: +b.getAttribute('data-m') }).then(cargar, falla); }; });
      $$('[data-ed]', c).forEach(function (b) { b.onclick = function () { editarPersona(per(b.getAttribute('data-ed'))); }; });
    }
    function editarPersona(p) {
      var m = modal(nom(p), '<div class="form-grid"><label class="campo"><span>Rol</span><select id="lp-r">' + D.roles.map(function (r) { return '<option' + (r === p.rol ? ' selected' : '') + '>' + r + '</option>'; }).join('') + '</select></label><div></div>' +
        '<div class="campo ancho"><span>Dieta</span><div class="lg-dietas">' + D.dietas.map(function (d) { return '<label class="check"><input type="checkbox" value="' + esc(d) + '"' + ((p.dietas || []).indexOf(d) >= 0 ? ' checked' : '') + '>' + esc(d) + '</label>'; }).join('') + '</div></div>' +
        '<label class="campo ancho"><span>Restricción o alergia alimentaria</span><textarea id="lp-x" maxlength="500" placeholder="Ej. Alergia al maní; intolerancia a la lactosa">' + esc(p.restriccion || '') + '</textarea></label></div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="lp-ok" type="button">Guardar</button>');
      $('#lp-ok', m.el).onclick = function () {
        api('lg_persona_guardar', { evento_id: id, id: p.id, rol: $('#lp-r', m.el).value, dietas: $$('.lg-dietas input:checked', m.el).map(function (x) { return x.value; }), restriccion: $('#lp-x', m.el).value })
          .then(function () { m.cerrar(); toast('Guardado.'); cargar(); }, function (x) { errorEn(m, x.error); });
      };
    }
    function tVuelos(c) {
      var V = D.vuelos;
      c.innerHTML = '<div class="panel"><div class="panel-cab"><div><h2>Seguimiento de vuelos</h2><span class="meta">Llegadas y salidas de participantes, instructores y staff</span></div><button class="btn btn-oro btn-sm" id="vu-n" type="button">+ Registrar vuelo</button></div>' +
        (V.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Fecha y hora</th><th>Persona</th><th>Vuelo</th><th>Estado</th><th></th></tr></thead><tbody>' + V.map(function (v) {
          var p = per(v.inscrito_id);
          return '<tr><td style="white-space:nowrap"><b>' + esc(fh(v.fecha_hora)) + '</b><br><span class="chip ' + (v.sentido === 'Llegada' ? 'pe-aprobado' : 'pe-enviado') + '">' + esc(v.sentido) + '</span></td><td>' + chipRol(p.rol) + ' <b>' + esc(nom(p)) + '</b></td>' +
            '<td><b>' + esc(v.aerolinea + ' ' + v.numero) + '</b>' + (v.ciudad ? '<br><span class="meta">' + (v.sentido === 'Llegada' ? 'Desde ' : 'Hacia ') + esc(v.ciudad) + '</span>' : '') + (v.numero ? '<br><a class="meta" href="https://www.google.com/search?q=' + encodeURIComponent('vuelo ' + v.aerolinea + ' ' + v.numero) + '" target="_blank" rel="noopener">Ver estado en línea ↗</a>' : '') + (v.obs ? '<br><span class="meta">' + esc(v.obs) + '</span>' : '') + '</td>' +
            '<td><select data-ve="' + v.id + '">' + D.vuelo_estados.map(function (e) { return '<option' + (e === v.estado ? ' selected' : '') + '>' + e + '</option>'; }).join('') + '</select>' + (v.actualizado_por ? '<br><span class="meta">' + esc(v.actualizado_por) + ' · ' + momento(v.actualizado_en) + '</span>' : '') + '</td>' +
            '<td style="white-space:nowrap"><button class="btn btn-sm" data-ved="' + v.id + '" type="button">Editar</button> <button class="btn btn-sm btn-peligro" data-vx="' + v.id + '" type="button" aria-label="Eliminar">×</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<div class="vacio"><strong>Sin vuelos registrados</strong>Registre la llegada y la salida de cada persona que viaja.</div>') + '</div>';
      $('#vu-n', c).onclick = function () { formVuelo(null); };
      $$('[data-ved]', c).forEach(function (b) { b.onclick = function () { formVuelo(V.find(function (v) { return +v.id === +b.getAttribute('data-ved'); })); }; });
      $$('[data-ve]', c).forEach(function (s) { s.onchange = function () { var v = V.find(function (x) { return +x.id === +s.getAttribute('data-ve'); }); api('lg_vuelo_guardar', Object.assign({}, v, { evento_id: id, estado: s.value })).then(function () { toast('Estado del vuelo: ' + s.value); cargar(); }, falla); }; });
      $$('[data-vx]', c).forEach(function (b) { b.onclick = function () { if (confirm('¿Eliminar este vuelo?')) api('lg_borrar', { tipo: 'vuelo', id: +b.getAttribute('data-vx') }).then(cargar, falla); }; });
    }
    function formVuelo(v) {
      var n = !v; v = v || { sentido: 'Llegada', estado: 'Programado', fecha_hora: dia + ' 08:00' };
      var m = modal(n ? 'Registrar vuelo' : 'Editar vuelo', '<div class="form-grid"><label class="campo ancho"><span class="req">Persona</span><select id="fv-p"><option value="">Seleccione…</option>' + opcPersonas(v.inscrito_id) + '</select></label>' +
        '<label class="campo"><span>Sentido</span><select id="fv-s"><option' + (v.sentido === 'Llegada' ? ' selected' : '') + '>Llegada</option><option' + (v.sentido === 'Salida' ? ' selected' : '') + '>Salida</option></select></label>' +
        '<label class="campo"><span class="req">Fecha y hora</span><input id="fv-f" type="datetime-local" value="' + esc((v.fecha_hora || '').replace(' ', 'T')) + '"></label>' +
        '<label class="campo"><span>Aerolínea</span><input id="fv-a" maxlength="60" value="' + esc(v.aerolinea || '') + '" placeholder="Avianca, LATAM…"></label><label class="campo"><span>Número de vuelo</span><input id="fv-n" maxlength="12" value="' + esc(v.numero || '') + '" placeholder="AV9445"></label>' +
        '<label class="campo"><span>Ciudad de origen / destino</span><input id="fv-c" maxlength="80" value="' + esc(v.ciudad || '') + '"></label><label class="campo"><span>Estado</span><select id="fv-e">' + D.vuelo_estados.map(function (e) { return '<option' + (e === v.estado ? ' selected' : '') + '>' + e + '</option>'; }).join('') + '</select></label>' +
        '<label class="campo ancho"><span>Observación</span><input id="fv-o" maxlength="500" value="' + esc(v.obs || '') + '" placeholder="Ej. Lo recoge el traslado de las 10:00"></label></div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="fv-ok" type="button">Guardar</button>');
      $('#fv-ok', m.el).onclick = function () {
        api('lg_vuelo_guardar', { evento_id: id, id: n ? 0 : v.id, inscrito_id: $('#fv-p', m.el).value, sentido: $('#fv-s', m.el).value, fecha_hora: $('#fv-f', m.el).value, aerolinea: $('#fv-a', m.el).value, numero: $('#fv-n', m.el).value, ciudad: $('#fv-c', m.el).value, estado: $('#fv-e', m.el).value, obs: $('#fv-o', m.el).value })
          .then(function () { m.cerrar(); toast('Vuelo guardado.'); cargar(); }, function (x) { errorEn(m, x.error); });
      };
    }
    function tHosp(c) {
      var Hh = D.hospedajes, g = {};
      Hh.forEach(function (h) { (g[h.hotel] = g[h.hotel] || []).push(h); });
      c.innerHTML = '<div class="panel"><div class="panel-cab"><div><h2>Hospedaje</h2><span class="meta">Hoteles aliados: Hotel IBIS, Sabana Park, Hotel B3 y Hotel PopArt · «Otros» cuando la persona se queda en otro lugar</span></div><div class="acciones"><button class="btn btn-sm" id="ho-imp" type="button">Cargar listado (Excel / CSV)</button><button class="btn btn-oro btn-sm" id="ho-n" type="button">+ Registrar hospedaje</button></div></div>' +
        '<div class="lg-hoteles enpanel">' + Object.keys(D.hoteles).map(function (k) { return '<div class="lg-hotel">' + hotelLogo(k, D.hoteles, D.logos) + '<span><b>' + (g[k] || []).length + '</b> huésped(es)</span></div>'; }).join('') + '</div>' +
        (Hh.length ? Object.keys(D.hoteles).filter(function (k) { return g[k]; }).map(function (k) {
          return '<div class="prep-g lg-hg">' + hotelLogo(k, D.hoteles, D.logos, true) + ' ' + esc(D.hoteles[k].nombre) + '</div><div class="tabla-wrap"><table class="tabla"><tbody>' + g[k].map(function (h) {
            var p = per(h.inscrito_id);
            return '<tr><td>' + chipRol(p.rol) + ' <b>' + esc(nom(p)) + '</b></td><td style="white-space:nowrap">' + esc(fCorta(h.check_in)) + ' → ' + esc(fCorta(h.check_out)) + '<br><span class="meta">' + Math.max(0, Math.round((dISO(h.check_out) - dISO(h.check_in)) / 86400000)) + ' noche(s)</span></td><td>' + (h.habitacion ? 'Hab. ' + esc(h.habitacion) : '<span class="meta">Sin habitación</span>') + (h.reserva ? '<br><span class="meta">Reserva ' + esc(h.reserva) + '</span>' : '') + (h.lugar ? '<br><b>' + esc(h.lugar) + '</b>' : '') + (h.obs ? '<br><span class="meta">' + esc(h.obs) + '</span>' : '') + '</td>' +
              '<td style="white-space:nowrap"><button class="btn btn-sm" data-hed="' + h.id + '" type="button">Editar</button> <button class="btn btn-sm btn-peligro" data-hx="' + h.id + '" type="button" aria-label="Eliminar">×</button></td></tr>';
          }).join('') + '</tbody></table></div>';
        }).join('') : '<div class="vacio"><strong>Sin hospedajes</strong>Registre en qué hotel aliado se aloja cada persona que viaja.</div>') + '</div>';
      $('#ho-n', c).onclick = function () { formHosp(null); };
      $('#ho-imp', c).onclick = function () {
        modalImportar(null, cargar, { titulo: 'Cargar listado de hospedaje', req: ['hotel'], cabecera: /hotel|hospedaje|alojamiento|documento|nombre/,
          intro: '<p style="margin:0 0 8px">Columnas: <b>Documento</b> y/o <b>Nombre</b> de la persona (debe estar en el listado del evento), <b>Hotel</b> (IBIS, Sabana Park, B3, PopArt; cualquier otro queda en «Otros» con ese nombre), <b>Lugar</b> (para «Otros»), <b>Check-in</b>, <b>Check-out</b>, <b>Habitación</b> y <b>Reserva</b>. Si una persona ya tiene hospedaje, se actualiza.</p>',
          campos: [['documento', 'Documento', /^(documento|c[eé]dula|cc|identificaci[oó]n|n[uú]mero de documento|doc)$/], ['nombre', 'Nombre completo', /^(nombre|nombres|nombre completo|persona|hu[eé]sped|participante)$/], ['hotel', 'Hotel', /hotel|hospedaje|alojamiento/],
            ['lugar', 'Lugar (otros)', /lugar|direcci[oó]n|otro/], ['check_in', 'Check-in', /check.?in|ingreso|llegada|entrada/], ['check_out', 'Check-out', /check.?out|salida/], ['habitacion', 'Habitación', /habitaci[oó]n|cuarto|room/], ['reserva', 'Reserva', /reserva|confirmaci[oó]n|booking/], ['obs', 'Observación', /observ|nota/]],
          enviar: function (filas) { return api('lg_hosp_importar', { evento_id: id, filas: filas }).then(function (j) { return j.nuevos + ' hospedajes nuevos · ' + j.actualizados + ' actualizados' + (j.n_sin ? ' · ' + j.n_sin + ' personas no están en el listado del evento (' + j.sin_persona.slice(0, 5).join(', ') + (j.n_sin > 5 ? '…' : '') + ')' : '') + (j.incompletas ? ' · ' + j.incompletas + ' filas incompletas' : '') + '.'; }); } });
      };
      $$('[data-hed]', c).forEach(function (b) { b.onclick = function () { formHosp(Hh.find(function (h) { return +h.id === +b.getAttribute('data-hed'); })); }; });
      $$('[data-hx]', c).forEach(function (b) { b.onclick = function () { if (confirm('¿Eliminar este hospedaje?')) api('lg_borrar', { tipo: 'hosp', id: +b.getAttribute('data-hx') }).then(cargar, falla); }; });
    }
    function formHosp(h) {
      var n = !h; h = h || { hotel: '', check_in: sumar(D.evento.fecha, -1), check_out: sumar(D.evento.fecha_fin, 1) };
      var m = modal(n ? 'Registrar hospedaje' : 'Editar hospedaje', '<div class="lg-hsel">' + Object.keys(D.hoteles).map(function (k) { return '<label class="lg-hopt"><input type="radio" name="fh-h" value="' + k + '"' + (h.hotel === k ? ' checked' : '') + '>' + hotelLogo(k, D.hoteles, D.logos) + '</label>'; }).join('') + '</div>' +
        '<label class="campo" id="fh-lw"' + (h.hotel === 'otros' ? '' : ' hidden') + '><span class="req">¿Dónde se hospeda?</span><input id="fh-l" maxlength="160" value="' + esc(h.lugar || '') + '" placeholder="Ej. Hotel Estelar Calle 100 · Cra 7 # 100-30 / casa de familiar en Chía"></label>' +
        '<div class="form-grid"><label class="campo ancho"><span class="req">Persona</span><select id="fh-p"><option value="">Seleccione…</option>' + opcPersonas(h.inscrito_id) + '</select></label>' +
        '<label class="campo"><span class="req">Ingreso (check-in)</span><input id="fh-i" type="date" value="' + esc(h.check_in || '') + '"></label><label class="campo"><span class="req">Salida (check-out)</span><input id="fh-o" type="date" value="' + esc(h.check_out || '') + '"></label>' +
        '<label class="campo"><span>Habitación</span><input id="fh-r" maxlength="40" value="' + esc(h.habitacion || '') + '"></label><label class="campo"><span>Número de reserva</span><input id="fh-n" maxlength="60" value="' + esc(h.reserva || '') + '"></label>' +
        '<label class="campo ancho"><span>Observación</span><input id="fh-x" maxlength="500" value="' + esc(h.obs || '') + '"></label></div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="fh-ok" type="button">Guardar</button>', { ancho: true });
      $$('input[name=fh-h]', m.el).forEach(function (r) { r.onchange = function () { $('#fh-lw', m.el).hidden = r.value !== 'otros'; if (r.value === 'otros') $('#fh-l', m.el).focus(); }; });
      $('#fh-ok', m.el).onclick = function () {
        var ho = $('input[name=fh-h]:checked', m.el);
        api('lg_hosp_guardar', { evento_id: id, id: n ? 0 : h.id, hotel: ho ? ho.value : '', lugar: $('#fh-l', m.el).value, inscrito_id: $('#fh-p', m.el).value, check_in: $('#fh-i', m.el).value, check_out: $('#fh-o', m.el).value, habitacion: $('#fh-r', m.el).value, reserva: $('#fh-n', m.el).value, obs: $('#fh-x', m.el).value })
          .then(function () { m.cerrar(); toast('Hospedaje guardado.'); cargar(); }, function (x) { errorEn(m, x.error); });
      };
    }
    function tTransp(c) {
      var T = D.transportes;
      c.innerHTML = '<div class="panel"><div class="panel-cab"><div><h2>Traslados</h2><span class="meta">Hotel · CLEMI · Aeropuerto</span></div><button class="btn btn-oro btn-sm" id="tr-n" type="button">+ Programar traslado</button></div>' +
        (T.length ? '<div class="lg-tr">' + T.map(function (t) {
          return '<div class="lg-tr-c' + (t.estado === 'Cancelado' ? ' cancelado' : '') + '"><div class="lg-tr-h"><b>' + esc(fh(t.fecha_hora)) + '</b><span class="chip ' + ({ 'Programado': 'pe-sin', 'En ruta': 'st-programado', 'Completado': 'pe-aprobado', 'Cancelado': 'ct-can' }[t.estado] || '') + '">' + esc(t.estado) + '</span></div>' +
            '<div class="lg-ruta"><span>' + esc(t.origen) + '</span><i>→</i><span>' + esc(t.destino) + '</span></div>' +
            '<div class="meta">' + esc([t.vehiculo, t.conductor, t.telefono].filter(Boolean).join(' · ') || 'Sin vehículo asignado') + ' · ' + t.pasajeros.length + (t.capacidad ? ' / ' + t.capacidad : '') + ' pasajero(s)</div>' +
            '<div class="lg-pax">' + t.pasajeros.map(function (pid) { var p = per(pid); return '<span class="chip ' + (ROL_CLS[p.rol] || 'rol-par') + '">' + esc(nom(p)) + '</span>'; }).join('') + '</div>' + (t.obs ? '<div class="meta">' + esc(t.obs) + '</div>' : '') +
            '<div class="acciones"><button class="btn btn-sm" data-ted="' + t.id + '" type="button">Editar</button><button class="btn btn-sm btn-peligro" data-tx="' + t.id + '" type="button">Eliminar</button></div></div>';
        }).join('') + '</div>' : '<div class="vacio"><strong>Sin traslados programados</strong>Programe los traslados entre el hotel, CLEMI y el aeropuerto, con el vehículo y los pasajeros.</div>') + '</div>';
      $('#tr-n', c).onclick = function () { formTransp(null); };
      $$('[data-ted]', c).forEach(function (b) { b.onclick = function () { formTransp(T.find(function (t) { return +t.id === +b.getAttribute('data-ted'); })); }; });
      $$('[data-tx]', c).forEach(function (b) { b.onclick = function () { if (confirm('¿Eliminar este traslado?')) api('lg_borrar', { tipo: 'transp', id: +b.getAttribute('data-tx') }).then(cargar, falla); }; });
    }
    function formTransp(t) {
      var n = !t; t = t || { fecha_hora: dia + ' 06:30', origen: 'Hotel IBIS', destino: 'CLEMI', estado: 'Programado', pasajeros: [], capacidad: 0 };
      var lug = function (idx, v) { return '<select id="ft-' + idx + '">' + D.lugares.map(function (l) { return '<option' + (l === v ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select>'; };
      var sug = {}; D.hospedajes.forEach(function (h) { (sug[D.hoteles[h.hotel].nombre] = sug[D.hoteles[h.hotel].nombre] || []).push(+h.inscrito_id); });
      var m = modal(n ? 'Programar traslado' : 'Editar traslado', '<div class="form-grid"><label class="campo"><span class="req">Fecha y hora</span><input id="ft-f" type="datetime-local" value="' + esc(t.fecha_hora.replace(' ', 'T')) + '"></label>' +
        '<label class="campo"><span>Estado</span><select id="ft-e">' + ['Programado', 'En ruta', 'Completado', 'Cancelado'].map(function (e) { return '<option' + (e === t.estado ? ' selected' : '') + '>' + e + '</option>'; }).join('') + '</select></label>' +
        '<label class="campo"><span class="req">Origen</span>' + lug('o', t.origen) + '</label><label class="campo"><span class="req">Destino</span>' + lug('d', t.destino) + '</label>' +
        '<label class="campo"><span>Vehículo / placa</span><input id="ft-v" maxlength="80" value="' + esc(t.vehiculo || '') + '" placeholder="Van · ABC123"></label><label class="campo"><span>Capacidad</span><input id="ft-c" type="number" min="0" max="80" value="' + (+t.capacidad || '') + '"></label>' +
        '<label class="campo"><span>Conductor</span><input id="ft-n" maxlength="120" value="' + esc(t.conductor || '') + '"></label><label class="campo"><span>Teléfono del conductor</span><input id="ft-t" maxlength="40" value="' + esc(t.telefono || '') + '"></label>' +
        '<div class="campo ancho"><span>Pasajeros <button type="button" class="btn-link" id="ft-sug">· sugerir según hotel de origen o destino</button></span><div class="lg-pax-sel">' + D.personas.filter(function (p) { return !+p.anulado; }).map(function (p) { return '<label class="check"><input type="checkbox" value="' + p.id + '"' + (t.pasajeros.indexOf(+p.id) >= 0 ? ' checked' : '') + '>' + chipRol(p.rol) + ' ' + esc(nom(p)) + '</label>'; }).join('') + '</div></div>' +
        '<label class="campo ancho"><span>Observación</span><input id="ft-x" maxlength="500" value="' + esc(t.obs || '') + '"></label></div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="ft-ok" type="button">Guardar</button>', { ancho: true });
      $('#ft-sug', m.el).onclick = function () { var ids = (sug[$('#ft-o', m.el).value] || []).concat(sug[$('#ft-d', m.el).value] || []); $$('.lg-pax-sel input', m.el).forEach(function (x) { if (ids.indexOf(+x.value) >= 0) x.checked = true; }); if (!ids.length) toast('Nadie tiene hospedaje registrado en ese hotel.'); };
      $('#ft-ok', m.el).onclick = function () {
        api('lg_transp_guardar', { evento_id: id, id: n ? 0 : t.id, fecha_hora: $('#ft-f', m.el).value, origen: $('#ft-o', m.el).value, destino: $('#ft-d', m.el).value, estado: $('#ft-e', m.el).value, vehiculo: $('#ft-v', m.el).value, capacidad: $('#ft-c', m.el).value, conductor: $('#ft-n', m.el).value, telefono: $('#ft-t', m.el).value,
          pasajeros: $$('.lg-pax-sel input:checked', m.el).map(function (x) { return +x.value; }), obs: $('#ft-x', m.el).value }).then(function () { m.cerrar(); toast('Traslado guardado.'); cargar(); }, function (x) { errorEn(m, x.error); });
      };
    }
    montar('<a class="miga" href="#/lg">← Logística</a><section class="ev-cab lg-cab" id="lge-cab"><h1>Cargando…</h1></section>' +
      '<nav class="tabs" id="lge-t">' + [['comedor', 'Comedor'], ['vuelos', 'Vuelos'], ['hospedaje', 'Hospedaje'], ['transportes', 'Traslados'], ['listado', 'Listado']].map(function (t) { return '<button type="button" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</nav><div id="lge-c"></div>');
    $$('#lge-t button').forEach(function (b) { b.onclick = function () { tab = S.lgTab = b.getAttribute('data-t'); history.replaceState(null, '', '#/lg/ev/' + id + '/' + tab); pintar(); }; });
    cargar(); S.vista = { refrescar: cargar };
  }

  function vLGHoteles() {
    var D = null;
    function cargar() { return api('lg_resumen').then(function (j) { D = j; pintar(); }, falla); }
    function pintar() {
      if (!$('#lgh')) return;
      $('#lgh').innerHTML = Object.keys(D.hoteles).filter(function (k) { return !D.hoteles[k].otro; }).map(function (k) {
        var n = D.hosp_hotel.find(function (x) { return x.hotel === k; });
        return '<div class="panel lg-hcard"><div class="lg-hcard-logo">' + hotelLogo(k, D.hoteles, D.logos) + '</div><h2>' + esc(D.hoteles[k].nombre) + '</h2><p class="meta">Hotel con alianza CLEMI · <b>' + (n ? n.n : 0) + '</b> huésped(es) con estadía vigente</p>' +
          '<label class="btn btn-sm"><input type="file" accept=".png,.jpg,.jpeg,.webp" data-logo="' + k + '" hidden>' + (D.logos[k] ? 'Cambiar logo' : 'Subir logo oficial') + '</label></div>';
      }).join('');
      $$('[data-logo]').forEach(function (f) {
        f.onchange = function () {
          if (!f.files[0]) return;
          var fd = new FormData(); fd.append('hotel', f.getAttribute('data-logo')); fd.append('archivo', f.files[0]);
          var sube = window.CLEMI_DEMO && window.CLEMI_DEMO.subirLogo ? window.CLEMI_DEMO.subirLogo(fd) : fetch('api.php?a=lg_hotel_logo', { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF': S.csrf }, body: fd }).then(function (r) { return r.json(); });
          sube.then(function (j) { if (!j.ok) return falla(j); toast('Logo actualizado.'); cargar(); }, falla);
        };
      });
    }
    montar('<a class="miga" href="#/lg">← Logística</a><div class="vista-cab"><div><div class="eyebrow">Logística</div><h1>Hoteles aliados</h1><p>Hospedaje con alianza para participantes, instructores y staff. Mientras no se suba el logo oficial de cada hotel, se muestra su nombre con sus colores.</p></div></div><div class="lg-hgrid" id="lgh"><div class="vacio">Cargando…</div></div>');
    cargar(); S.vista = { refrescar: cargar };
  }

  // ================================================================== ADMINISTRATIVO
  function puedeAD() { return !!S.yo && (esAdmin() || areasYo().indexOf('ad') >= 0); }
  var ETAPAS = [['', 'Cancelado'], ['1', 'Negociación'], ['2', 'Cotización'], ['3', 'Administrativo'], ['4', 'Operación'], ['5', 'Realizado']];
  var PREP_NOM = { av: 'Audiovisuales', op: 'Instrumentación', mo: 'Morgue', lg: 'Logística', bm: 'Biomédica', ps: 'Almacén' };
  var FASES_K = ['negociacion', 'cotizacion', 'administrativo', 'operacion'];
  function barraPct(pct, cls) { return '<div class="pct-barra ' + (cls || '') + '"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%"></i></div>'; }
  function bloquesFases(c, conPasos) {
    return '<div class="ad-bloques">' + FASES_K.map(function (k, i) {
      var b = c.fases[k], act = c.fase === k, hecho = FASES_K.indexOf(c.fase) > i;
      return '<div class="ad-bloque' + (act ? ' actual' : '') + (hecho ? ' hecho' : '') + (act && c.alerta && c.alerta.fase === k ? ' alerta' : '') + '"><div class="ad-b-cab"><span>' + (i + 1) + ' · ' + FASE_N[k] + '</span><b>' + b.pct + ' %</b></div>' + barraPct(b.pct, hecho || b.pct >= 100 ? 'ok' : act ? 'act' : '') +
        (conPasos || act ? '<ul class="ad-b-pasos">' + b.pasos.map(function (p) { return '<li class="' + (p.ok ? 'ok' : '') + '">' + (p.ok ? '✓' : '○') + ' ' + esc(p.t) + (p.det ? ' · <b>' + esc(p.det) + '</b>' : '') + '</li>'; }).join('') + '</ul>' : '') + '</div>';
    }).join('') + '</div>';
  }
  // Alertas para Administrativo: insignia en el menú y aviso cuando aparece una nueva.
  function admAlertas() {
    if (!S.yo || !puedeAD() || document.hidden) return;
    api('adm_alertas').then(function (j) {
      var n = j.alertas.length, b = $('#nav-alertas');
      if (b) { b.hidden = !n; b.textContent = n; }
      S.alVistas = S.alVistas || {};
      var nuevas = j.alertas.filter(function (a) { return !S.alVistas[a.clave]; });
      nuevas.slice(0, 3).forEach(function (a) { toast('<b>⚠ ' + esc(a.codigo) + ' · ' + esc(a.cliente) + '</b><br>' + esc(a.texto), 'error'); });
      j.alertas.forEach(function (a) { S.alVistas[a.clave] = 1; });
    }, function () {});
  }
  function vAD(p) {
    if (!puedeAD()) { location.hash = '#/agenda'; return; }
    if (p[0] === 'novedades') return vADNovedades();
    if (p[0] === 'equipo') return vADEquipo();
    if (p[0] === 'convenio') return vADConvenio(p[1]);
    var D = null, f = S.adFiltro || '', todos = false;
    function cargar() { return api('adm_seguimiento' + (todos ? '&todos=1' : '')).then(function (j) { D = j; pintar(); admAlertas(); }, falla); }
    function pintar() {
      if (!$('#ad-l')) return;
      var C = D.convenios;
      var k = function (n, t, x, cls) { return '<button type="button" class="kpi' + (cls ? ' ' + cls : '') + (f === x ? ' is-on' : '') + '" data-f="' + x + '"><b>' + n + '</b><span>' + t + '</span></button>'; };
      $('#ad-k').innerHTML = k(C.length, 'convenios en seguimiento', '') + k(C.filter(function (c) { return c.alerta; }).length, '⚠ con alerta (más de 2 días hábiles)', 'alerta', 'kpi-alerta') +
        FASES_K.map(function (x, i) { return k(C.filter(function (c) { return c.fase === x && c.estado !== 'Cancelado'; }).length, (i + 1) + ' · ' + FASE_N[x], x); }).join('');
      $$('#ad-k [data-f]').forEach(function (b) { b.onclick = function () { f = S.adFiltro = b.getAttribute('data-f'); pintar(); }; });
      var L = C.filter(function (c) { return !f || (f === 'alerta' ? c.alerta : c.fase === f); });
      $('#ad-l').innerHTML = L.length ? L.map(function (c) {
        var prep = Object.keys(PREP_NOM).filter(function (a) { return c.prep[a]; }).map(function (a) { var x = c.prep[a]; return '<span class="chip ' + (x.no ? 'ct-can' : x.listos === x.total ? 'pe-aprobado' : 'pe-pend') + '">' + PREP_NOM[a] + ' ' + x.listos + '/' + x.total + '</span>'; }).join(' ');
        return '<div class="panel ad-c' + (c.alerta ? ' con-alerta' : '') + '"><div class="ad-c-cab"><div><div class="eyebrow">' + esc(c.codigo) + ' · ' + esc(c.sala || '') + ' · ' + esc(rangoCT(c)) + ' · ' + faltan(c.fecha_inicio) + '</div><h3>' + esc(c.nombre) + '</h3><span class="meta">' + esc(c.cliente) + ' · ' + esc(c.curso) + (c.responsable ? ' · contacto: ' + esc(c.responsable) : '') + '</span></div>' +
          '<div class="acciones">' + (c.estado === 'Cancelado' ? '<span class="chip ct-can">Cancelado</span>' : '<span class="chip ad-fase">' + esc(FASE_N[c.fase]) + '</span>') + '<a class="btn btn-sm' + (c.fase === 'administrativo' ? ' btn-oro' : '') + '" href="#/adm/convenio/' + c.id + '">' + (c.fase === 'administrativo' ? 'Firmas y cierre →' : 'Abrir →') + '</a></div></div>' +
          (c.alerta ? '<div class="ad-alerta">⚠ ' + esc(c.alerta.texto) + '</div>' : '') +
          (c.estado !== 'Cancelado' ? bloquesFases(c) : '') +
          '<div class="ad-c-det"><span class="meta">Pendiente: <b>' + esc(c.pendiente) + '</b></span>' + (c.fase === 'cotizacion' && c.cotiz && c.cotiz.limite && !c.cotiz.enviado ? '<span class="chip ' + (c.cotiz.vencido ? 'ct-can' : 'pe-pend') + '">Pedido del cliente ' + (c.cotiz.vencido ? 'venció el ' : 'hasta el ') + esc(fCorta(c.cotiz.limite)) + '</span>' : '') +
          (c.evento ? '<span class="chip st-programado">En agenda · ' + c.evento.personas + ' en el listado</span>' : '') + '</div>' +
          (c.fase === 'operacion' && prep ? '<div class="ad-c-prep"><b>Preparación:</b> ' + prep + '</div>' : '') +
          (c.ultimo ? '<div class="meta ad-c-ult">Último movimiento: ' + esc(c.ultimo.accion) + ' · ' + esc(c.ultimo.usuario_nombre || '') + ' · ' + momento(c.ultimo.momento) + '</div>' : '') + '</div>';
      }).join('') : '<div class="vacio"><strong>Sin convenios con ese filtro</strong></div>';
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">3 · Administrativo</div><h1>Seguimiento de convenios</h1><p>Cada convenio por fases, con el porcentaje de cada bloque en tiempo real: 1 Negociación, 2 Cotización, 3 Administrativo (firmas y «CERRAR NEGOCIACIÓN») y 4 La operación (preparación por áreas). Si una fase pasa de <b>2 días hábiles</b> sin respuesta o sin cerrarse, aparece una alerta.</p></div>' +
      '<label class="check"><input type="checkbox" id="ad-t">Incluir cerrados y cancelados</label></div><div class="kpis" id="ad-k"></div><div id="ad-l"><div class="vacio">Cargando…</div></div>');
    $('#ad-t').onchange = function () { todos = this.checked; cargar(); };
    cargar(); S.vista = { refrescar: cargar };
  }
  // ---- Fase de firmas: lo que el cliente solicitó y cotizó, firmas y CERRAR NEGOCIACIÓN
  function vADConvenio(id) {
    var D = null;
    function cargar() { return api('adm_convenio&id=' + id).then(function (j) { D = j; pintar(); }, function (e) { montar('<a class="miga" href="#/adm">← Seguimiento de convenios</a><div class="vacio"><strong>No se pudo abrir el convenio</strong>' + esc(e.error) + '</div>'); }); }
    function cajaFirma(lado) {
      var F = D.firma, x = F ? F[lado + '_firma'] : null, tit = lado === 'clemi' ? 'LA PRESTADORA · Fundación CLEMI' : 'LA CONTRATANTE · ' + D.contrato.cliente;
      var url = F ? 'api.php?a=adm_firma_archivo&id=' + F.id + '&lado=' + lado : '';
      if (window.CLEMI_DEMO && x && x.imagen) url = x.imagen;
      if (x) return '<div class="adf-caja ok" data-lado="' + lado + '"><span class="adf-t">' + esc(tit) + '</span>' +
        (x.modo === 'anexo' ? '<a class="adf-anexo" href="' + url + '&anexo=1" target="_blank" rel="noopener">📎 ' + esc(x.anexo_nombre || 'Documento firmado') + '</a>' : '<img src="' + url + '" alt="Firma">') +
        '<b>' + esc(x.nombre) + '</b><span>' + esc(x.cargo) + ' · ' + esc(x.tipo_doc || '') + ' ' + esc(x.documento || '') + '</span><small>' + (x.modo === 'anexo' ? 'Firma digital anexa' : x.registrada_por ? 'Firmada en la plataforma' : 'Firmada electrónicamente') + ' · ' + momento(x.fecha) + (x.registrada_por ? ' · registró ' + esc(x.registrada_por) : '') + '</small>' +
        (D.fase === 'administrativo' && F.estado !== 'Firmado' ? '<button class="btn-link" type="button" data-quitar="' + lado + '">Quitar firma</button>' : '') + '</div>';
      return '<button type="button" class="adf-caja" data-firmar="' + lado + '"' + (!F || D.fase !== 'administrativo' ? ' disabled' : '') + '><span class="adf-t">' + esc(tit) + '</span><span class="adf-vacia">✍ Pendiente · clic para firmar o anexar la firma digital</span></button>';
    }
    function pintar() {
      var c = D.contrato, P = D.ppto, T = P.totales, F = D.firma;
      var lineas = P.lineas.map(function (l) { return '<tr><td>' + esc(l.descripcion) + (l.nota ? '<br><span class="meta">' + esc(l.nota) + '</span>' : '') + '</td><td>' + esc(l.categoria) + '</td><td class="num">' + numTxt(l.cantidad) + (l.dias > 1 ? ' × ' + l.dias + ' d' : '') + '</td><td class="num">' + (l.precio == null ? '—' : pesos(l.precio)) + '</td><td class="num"><b>' + (l.total == null ? '—' : pesos(l.total)) + '</b></td></tr>'; }).join('');
      var R = { Participante: 0, Instructor: 0, Staff: 0 }; D.listado.forEach(function (p) { R[p.rol] = (R[p.rol] || 0) + 1; });
      montar('<a class="miga" href="#/adm">← Seguimiento de convenios</a>' +
        '<section class="ev-cab ct-cab"><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="chip" style="background:rgba(255,255,255,.1);color:#e8efe9">' + esc(c.codigo) + '</span><span class="chip ad-fase">' + esc(FASE_N[D.fase]) + '</span></div>' +
          '<div class="ct-conv">' + esc(c.convenio || '') + '</div><h1 style="margin-top:2px">' + esc(c.curso) + '</h1>' +
          '<div class="ev-datos"><span><b>' + esc(c.cliente) + '</b>' + (c.nit ? ' · NIT ' + esc(c.nit) : '') + '</span><span>' + esc(c.sala_nombre) + '</span><span class="num">' + esc(rangoCT(c)) + ' · ' + esc(c.hora_ini) + '–' + esc(c.hora_fin) + '</span>' + (c.participantes ? '<span>' + c.participantes + ' participantes</span>' : '') + '</div></section>' +
        faseBarra(D.fase) + (D.alerta ? '<div class="ad-alerta">⚠ ' + esc(D.alerta.texto) + '</div>' : '') +
        '<p class="meta" style="margin:6px 0 12px">Pendiente: <b>' + esc(D.pendiente) + '</b></p>' + bloquesFases({ fases: D.fases, fase: D.fase, alerta: D.alerta }, true) +
        '<h2 class="seccion-t">Lo que el cliente solicitó y cotizó</h2>' +
        '<div class="panel"><div class="panel-cab"><h2>Cotización ' + (P.version ? 'versión ' + P.version.version + ' · emitida ' + momento(P.version.emitido_en) : '') + '</h2>' + chipPpto(P.estado) + '</div>' +
          (P.lineas.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Elemento</th><th>Categoría</th><th class="num">Cantidad</th><th class="num">Valor unitario</th><th class="num">Total</th></tr></thead><tbody>' + lineas + '</tbody></table></div>' +
            '<div class="pp-tot">' + Object.keys(T.grupos).map(function (g) { return '<div><span>' + esc(g) + '</span><b>' + pesos(T.grupos[g]) + '</b></div>'; }).join('') + (T.admin ? '<div><span>Administración ' + T.admin_pct + ' %</span><b>' + pesos(T.admin) + '</b></div>' : '') + '<div><span>IVA ' + T.iva_pct + ' %</span><b>' + pesos(T.iva) + '</b></div><div class="t"><span>Total</span><b>' + pesos(T.total) + '</b></div><div><span>Primer pago ' + T.anticipo_pct + ' %</span><b>' + pesos(T.pago1) + '</b></div></div>' : '<div class="vacio">Sin elementos cotizados.</div>') +
          (P.especiales.length ? '<div class="panel-cuerpo"><b>Solicitudes especiales:</b><ul class="adf-esp">' + P.especiales.map(function (e) { return '<li>' + esc(e.texto) + ' · <i>' + esc(e.estado) + '</i>' + (e.respuesta ? ' — ' + esc(e.respuesta) : '') + '</li>'; }).join('') + '</ul></div>' : '') + '</div>' +
        '<div class="dos-col" style="margin-top:14px"><div class="panel"><div class="panel-cab"><h2>Programa / agenda</h2></div><div class="panel-cuerpo">' + (D.programa.length ? D.programa.map(function (a) { return '<a href="' + urlArchivoCT(a) + '" target="_blank" rel="noopener">📄 ' + esc(a.nombre) + '</a>'; }).join('<br>') : '<span class="pp-sin">Falta el programa</span>') + '</div></div>' +
          '<div class="panel"><div class="panel-cab"><h2>Listado de personas</h2><span class="meta">' + D.listado.length + '</span></div><div class="panel-cuerpo">' + (D.listado.length ? leyendaRoles(R) + '<details><summary>Ver listado</summary><div class="tabla-wrap"><table class="tabla"><tbody>' + D.listado.slice(0, 300).map(function (p) { return '<tr><td>' + chipRol(p.rol) + '</td><td>' + esc(p.nombre + ' ' + p.apellido) + '</td><td>' + esc(p.documento) + '</td></tr>'; }).join('') + '</tbody></table></div></details>' : '<span class="pp-sin">Falta el listado (sin listado no hay QR)</span>') + '</div></div></div>' +
        (D.plan ? '<p class="meta">Sala planificada por el cliente: versión ' + D.plan.version + ' · ' + esc(D.plan.resumen) + '</p>' : '') +
        '<h2 class="seccion-t">Firmas del convenio</h2><div class="panel"><div class="panel-cuerpo">' +
          (!F ? (D.fase === 'administrativo' ? '<p style="margin:0 0 10px">Revise lo solicitado y cotizado. Luego prepare el convenio para firma: se congela con estos valores y su huella, y queda listo para recoger las dos firmas.</p>' +
              (D.faltantes.length ? '<p class="form-error" style="margin:0 0 10px">Faltan datos del convenio (los completa Negociación en «Documento del convenio»): ' + esc(D.faltantes.join(', ')) + '.</p>' : '') +
              '<button class="btn btn-oro" id="af-prep" type="button"' + (D.faltantes.length ? ' disabled' : '') + '>Preparar convenio para firma</button>' : '<p class="meta" style="margin:0">' + (D.fase === 'operacion' ? 'Negociación cerrada.' : 'El convenio llega aquí cuando Cotizaciones apruebe y cierre la cotización.') + '</p>')
            : '<p class="meta" style="margin:0 0 10px">Convenio versión ' + F.version + ' · ' + esc(F.estado) + ' · total ' + pesos(F.total) + ' · huella <span class="num">' + esc(F.hash.slice(0, 16)) + '…</span> <button class="btn-link" id="af-ver" type="button">Leer el convenio completo</button>' + (F.estado !== 'Firmado' && D.fase === 'administrativo' ? ' · <button class="btn-link" id="af-reprep" type="button">Preparar de nuevo</button>' : '') + '</p>' +
              '<div class="adf-firmas">' + cajaFirma('cliente') + cajaFirma('clemi') + '</div>') +
          '<div class="adf-cerrar"><button class="btn btn-cerrar-neg" id="af-cerrar" type="button"' + (D.puede_cerrar ? '' : ' disabled') + '>CERRAR NEGOCIACIÓN</button><span class="meta">' + (D.fase === 'operacion' ? 'Negociación cerrada: el convenio está en La operación.' : D.puede_cerrar ? 'Las dos firmas están: al cerrar, el convenio queda archivado, pasa a «Contratado» y se distribuyen las tareas a la operación.' : 'Se habilita cuando estén la firma del cliente y la de CLEMI.') + '</span></div></div></div>' +
        '<h2 class="seccion-t">Bitácora del convenio</h2><div class="panel">' + (D.bitacora.length ? '<ul class="timeline">' + D.bitacora.map(function (b) { return '<li><div class="tl-hora">' + b.momento.slice(11, 16) + '<small>' + fCorta(b.momento.slice(0, 10)) + '</small></div><div class="tl-cuerpo"><b>' + esc(b.usuario_nombre) + '</b> · ' + esc(b.accion) + (b.detalle ? '<div class="bit-det">' + esc(b.detalle) + '</div>' : '') + '</div></li>'; }).join('') + '</ul>' : '<div class="vacio">Sin registros.</div>') + '</div>');
      var b;
      if ((b = $('#af-prep')) || (b = $('#af-reprep'))) b.onclick = function () {
        api('adm_firma_preparar', { contrato_id: id }).then(function (j) { toast('<b>Convenio listo para firmar.</b>' + (j.correos ? ' Se avisó al cliente para firmar en el portal.' : '')); cargar(); }, falla);
      };
      if ((b = $('#af-ver'))) b.onclick = function () { modal('Convenio ' + c.codigo + ' · versión ' + F.version, '<div class="ctr-doc">' + F.html + '</div>', '<button class="btn" data-cerrar type="button">Cerrar</button>', { ancho: true }); };
      $$('[data-firmar]').forEach(function (x) { x.onclick = function () { modalFirmaAD(x.getAttribute('data-firmar')); }; });
      $$('[data-quitar]').forEach(function (x) {
        x.onclick = function () {
          var l = x.getAttribute('data-quitar'), m = modal('Quitar la firma ' + (l === 'clemi' ? 'de CLEMI' : 'del cliente'), '<label class="campo"><span class="req">Motivo</span><input id="x-m" maxlength="500"></label>', '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-peligro" id="x-ok" type="button">Quitar</button>');
          $('#x-ok', m.el).onclick = function () { api('adm_firma_quitar', { contrato_id: id, lado: l, motivo: $('#x-m', m.el).value }).then(function () { m.cerrar(); toast('Firma quitada.'); cargar(); }, function (e) { errorEn(m, e.error); }); };
        };
      });
      if ((b = $('#af-cerrar'))) b.onclick = function () {
        var m = modal('CERRAR NEGOCIACIÓN', '<p style="margin:0 0 8px">Se archiva el convenio <b>' + esc(c.codigo) + '</b> con las dos firmas, queda «Contratado» y pasa a <b>La operación</b>: cada área recibe las tareas contratadas en Preparación.</p><label class="campo"><span class="req">Escriba CERRAR NEGOCIACIÓN para confirmar</span><input id="x-c" autocomplete="off"></label>',
          '<button class="btn" data-cerrar type="button">Volver</button><button class="btn btn-cerrar-neg" id="x-ok" type="button">CERRAR NEGOCIACIÓN</button>');
        $('#x-ok', m.el).onclick = function () { var bb = this; bb.disabled = true; api('adm_cerrar', { contrato_id: id, confirmar: $('#x-c', m.el).value.trim().toUpperCase() }).then(function () { m.cerrar(); toast('<b>Negociación cerrada.</b> El convenio pasó a La operación.'); cargar(); }, function (e) { bb.disabled = false; errorEn(m, e.error); }); };
      };
    }
    function modalFirmaAD(lado) {
      var cl = D.clemi || {}, esC = lado === 'clemi', modo = 'pad', fir = null;
      var m = modal(esC ? 'Firma de CLEMI' : 'Firma del cliente · ' + D.contrato.cliente,
        '<div class="seg" id="x-modo"><button type="button" data-m="pad" class="on">Firmar aquí</button><button type="button" data-m="anexo">Anexar firma digital</button></div>' +
        '<div class="form-grid" style="margin-top:12px"><label class="campo"><span class="req">Nombre de quien firma</span><input id="x-n" maxlength="160" value="' + esc(esC ? cl.rep_legal || '' : D.contrato.contacto_nombre || '') + '"></label>' +
        '<label class="campo"><span class="req">Cargo</span><input id="x-c" maxlength="120" value="' + esc(esC ? 'Representante legal' : D.contrato.contacto_cargo || '') + '"></label>' +
        '<label class="campo"><span>Tipo de documento</span><select id="x-t"><option>cédula de ciudadanía</option><option>cédula de extranjería</option><option>pasaporte</option></select></label>' +
        '<label class="campo"><span class="req">Número de documento</span><input id="x-d" maxlength="40" value="' + esc(esC ? cl.rep_doc || '' : '') + '"></label></div>' +
        '<div id="x-pad"><p class="meta" style="margin:0 0 6px">' + (esC ? 'La representante legal firma en el recuadro.' : 'La persona del cliente firma en el recuadro (presencial).') + '</p><div id="x-lienzo"></div>' +
          '<label class="campo"><span class="req">Su contraseña (' + esc(S.yo.nombre) + ')</span><input type="password" id="x-k" autocomplete="current-password"><small>Confirma quién registra la firma; queda en la bitácora.</small></label></div>' +
        '<div id="x-anx" hidden><label class="campo"><span class="req">Convenio firmado digitalmente</span><input type="file" id="x-f" accept=".pdf,.png,.jpg,.jpeg,.p7m,.p7z,.docx"><small>PDF firmado digitalmente, P7M, Word o imagen del convenio firmado (máximo 20 MB). Queda en los documentos del convenio.</small></label></div>' +
        '<p class="meta" style="margin:8px 0 0">Firma sobre el convenio versión ' + D.firma.version + ' (huella ' + esc(D.firma.hash.slice(0, 12)) + '…).</p>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-oro" id="x-ok" type="button">Registrar firma</button>', { ancho: true });
      fir = new Firma($('#x-lienzo', m.el));
      $$('#x-modo button', m.el).forEach(function (bt) { bt.onclick = function () { modo = bt.getAttribute('data-m'); $$('#x-modo button', m.el).forEach(function (o) { o.classList.toggle('on', o === bt); }); $('#x-pad', m.el).hidden = modo !== 'pad'; $('#x-anx', m.el).hidden = modo !== 'anexo'; }; });
      $('#x-ok', m.el).onclick = function () {
        var bt = this, d = { contrato_id: id, lado: lado, nombre: $('#x-n', m.el).value, cargo: $('#x-c', m.el).value, tipo_doc: $('#x-t', m.el).value, documento: $('#x-d', m.el).value };
        var listo = function () { m.cerrar(); toast('Firma registrada.'); cargar(); }, mal = function (e) { bt.disabled = false; errorEn(m, e.error); };
        bt.disabled = true;
        if (modo === 'pad') {
          var png = fir.valor(); if (!png) { bt.disabled = false; return errorEn(m, 'Dibuje la firma en el recuadro.'); }
          d.firma = png; d.clave = $('#x-k', m.el).value;
          return api('adm_firma', d).then(listo, mal);
        }
        var f = $('#x-f', m.el).files[0]; if (!f) { bt.disabled = false; return errorEn(m, 'Adjunte el convenio firmado digitalmente.'); }
        var fd = new FormData(); Object.keys(d).forEach(function (k) { fd.append(k, d[k]); }); fd.append('archivo', f);
        var sube = window.CLEMI_DEMO && window.CLEMI_DEMO.subirForm ? window.CLEMI_DEMO.subirForm('adm_firma_anexo', fd) : fetch('api.php?a=adm_firma_anexo', { method: 'POST', credentials: 'same-origin', headers: { 'X-CSRF': S.csrf }, body: fd }).then(function (r) { return r.json(); });
        sube.then(function (j) { if (!j.ok) return mal(j); listo(); }, mal);
      };
    }
    S.vista = { refrescar: cargar };
    cargar();
  }
  function vADNovedades() {
    var D = null, tipo = '', dias = 60;
    function cargar() { return api('adm_novedades&dias=' + dias).then(function (j) { D = j; pintar(); }, falla); }
    function pintar() {
      if (!$('#an-l')) return;
      var N = D.novedades.filter(function (n) { return !tipo || n.tipo === tipo; });
      $('#an-f').innerHTML = ['', 'Novedad', 'Cambio', 'Incidente', 'Nota'].map(function (t) { var n = t ? D.novedades.filter(function (x) { return x.tipo === t; }).length : D.novedades.length; return '<button type="button" data-t="' + t + '"' + (t === tipo ? ' class="on"' : '') + '>' + (t || 'Todas') + ' · ' + n + '</button>'; }).join('');
      $$('#an-f button').forEach(function (b) { b.onclick = function () { tipo = b.getAttribute('data-t'); pintar(); }; });
      $('#an-l').innerHTML = N.length ? '<ul class="timeline">' + N.map(function (n) {
        return '<li><div class="tl-cab"><span class="chip tipo-' + esc(n.tipo) + '">' + esc(n.tipo) + '</span> <b>' + esc(n.titulo) + '</b> <span class="meta">' + esc(n.sala_nombre || '') + (n.convenio ? ' · ' + esc(n.convenio) : '') + '</span></div>' +
          '<div class="meta">' + momento(n.creado_en) + ' · ' + esc(n.autor || '—') + (n.autor_rol ? ' · ' + esc(CARGOS[n.autor_rol] || '') : '') + '</div><p>' + esc(n.texto) + '</p>' + (n.foto ? '<img class="tl-foto" src="' + archivo(n.foto) + '" alt="Foto de la novedad" data-zoom>' : '') + '</li>';
      }).join('') + '</ul>' : '<div class="vacio"><strong>Sin novedades</strong>Aquí aparecen los cambios, incidentes y notas que registran instrumentación y tanatología en cada entrenamiento.</div>';
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">3 · Administrativo</div><h1>Novedades</h1><p>Seguimiento administrativo de las novedades, cambios e incidentes registrados en los entrenamientos.</p></div><select id="an-d">' + [30, 60, 90, 180, 365].map(function (d) { return '<option value="' + d + '"' + (d === dias ? ' selected' : '') + '>Últimos ' + d + ' días</option>'; }).join('') + '</select></div>' +
      '<div class="prep-f" id="an-f"></div><div class="panel" id="an-l"><div class="vacio">Cargando…</div></div>');
    $('#an-d').onchange = function () { dias = +this.value; cargar(); };
    cargar(); S.vista = { refrescar: cargar };
  }
  function vADEquipo() {
    var D = null;
    function cargar() { return api('adm_equipo').then(function (j) { D = j; pintar(); }, falla); }
    function pintar() {
      if (!$('#ae-l')) return;
      var g = {}; D.equipo.forEach(function (p) { (g[p.area] = g[p.area] || []).push(p); });
      var venc = D.equipo.reduce(function (s, p) { return s + p.calendario.filter(function (c) { return c.estado === 'Vencida'; }).length; }, 0);
      $('#ae-k').innerHTML = D.areas.map(function (a) { return '<div class="kpi"><b>' + (g[a] || []).length + '</b><span>' + esc(a) + '</span></div>'; }).join('') + '<div class="kpi oro"><b>' + venc + '</b><span>entregas de dotación vencidas ' + D.anio + '</span></div>';
      $('#ae-l').innerHTML = D.areas.filter(function (a) { return g[a]; }).map(function (a) {
        return '<div class="prep-g">' + esc(a) + '</div><div class="tabla-wrap"><table class="tabla"><thead><tr><th>Funcionario</th><th>Cargo</th><th>Contacto</th><th>Estado</th><th>Dotación ' + D.anio + '</th></tr></thead><tbody>' + g[a].map(function (p) {
          return '<tr><td><b>' + esc(p.nombre) + '</b><br><span class="meta">' + esc(p.subarea || '') + '</span></td><td>' + esc(p.cargo || '—') + '</td><td class="meta">' + esc([p.telefono, p.correo].filter(Boolean).join(' · ') || '—') + '</td><td>' + chipTH(p.estado) + '</td><td>' + thCal(p.calendario) + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      }).join('') || '<div class="vacio">Sin personal registrado en estas áreas.</div>';
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">3 · Administrativo</div><h1>Equipo a cargo</h1><p>Servicios generales y Mantenimiento (jardín y locaciones), a cargo de Sebastián Hernández. Los datos personales y de contratación los administra Talento Humano.</p></div></div>' +
      '<div class="kpis" id="ae-k"></div><div class="panel" id="ae-l"><div class="vacio">Cargando…</div></div>');
    cargar(); S.vista = { refrescar: cargar };
  }

  // ------------------------------------------------------------ equipos biomédicos (inventario de Biomédica)
  var BIO_CHIP = { 'Disponible': 'pe-aprobado', 'Bajo stock': 'pe-cambio', 'Agotado': 'ct-can' };
  function bioChip(e) { return '<span class="chip ' + (BIO_CHIP[e] || '') + '">' + esc(e) + '</span>'; }
  function puedeBM() { return !!S.yo && (esAdmin() || areasYo().indexOf('bm') >= 0); }
  function vBM() { if (!puedeBM()) { location.hash = AREA_INICIO[areasYo()[0]]; return; } return vPSBiomedica(); }
  function vPSBiomedica() {
    var K = null, f = '', q = '';
    function cargar() { return api('bio_inventario').then(function (j) { K = j; K.equipos.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); }); pintar(); }, falla); }
    function suma(k) { return K.equipos.reduce(function (s, e) { return s + (+e[k] || 0); }, 0); }
    function pintar() {
      if (!$('#bio-lista')) return;
      var tot = suma('inv_total'), dis = suma('inv_disp');
      var k = function (n, t, x, cls) { return '<button type="button" class="kpi' + (cls ? ' ' + cls : '') + (f === x ? ' is-on' : '') + '" data-f="' + x + '"><b>' + n + '</b><span>' + t + '</span></button>'; };
      $('#bio-kpis').innerHTML = k(tot, 'equipos registrados', '') + k(dis, 'disponibles' + (tot ? ' · ' + (Math.round(dis / tot * 1000) / 10).toString().replace('.', ',') + ' %' : ''), 'Disponible') +
        '<div class="kpi oro"><b>' + suma('inv_mant') + '</b><span>en mantenimiento</span></div><div class="kpi"><b>' + suma('inv_baja') + '</b><span>dados de baja</span></div>' +
        k(K.equipos.filter(function (e) { return e.inv_estado === 'Bajo stock'; }).length, 'con bajo stock', 'Bajo stock') + k(K.equipos.filter(function (e) { return e.inv_estado === 'Agotado'; }).length, 'agotados', 'Agotado');
      $$('#bio-kpis [data-f]').forEach(function (b) { b.onclick = function () { f = b.getAttribute('data-f'); pintar(); }; });
      var L = K.equipos.filter(function (e) { return (!f || e.inv_estado === f) && (!q || (e.nombre + ' ' + e.codigo).toLowerCase().indexOf(q) >= 0); });
      $('#bio-n').textContent = L.length + ' equipos' + (K.corte ? ' · corte ' + K.corte : '');
      $('#bio-lista').innerHTML = L.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Equipo</th><th class="num">Total</th><th class="num">Disponibles</th><th class="num">Mantenimiento</th><th class="num">Bajas</th><th>Estado</th><th>En cursos próximos</th>' + (K.puede_editar ? '<th></th>' : '') + '</tr></thead><tbody>' +
        L.map(function (e) {
          var cur = e.cursos || [];
          return '<tr' + (+e.activo ? '' : ' style="opacity:.55"') + '><td><b>' + esc(e.nombre) + '</b><br><span class="meta">' + esc(e.codigo || '') + (e.inv_obs ? ' · ' + esc(e.inv_obs) : '') + '</span></td>' +
            '<td class="num">' + (+e.inv_total || 0) + '</td><td class="num"><b class="bio-disp' + (+e.inv_disp > 0 ? '' : ' pp-sin') + '">' + (+e.inv_disp || 0) + '</b></td><td class="num">' + (+e.inv_mant || 0) + '</td><td class="num">' + (+e.inv_baja || 0) + '</td>' +
            '<td>' + bioChip(e.inv_estado) + '</td><td class="meta">' + (cur.length ? cur.slice(0, 3).map(function (c) { return '<a href="#/ct/contrato/' + c.id + '">' + esc(c.codigo) + '</a> ' + esc(fCorta(c.fecha_inicio)) + (c.fecha_fin !== c.fecha_inicio ? '–' + esc(fCorta(c.fecha_fin)) : '') + ' × ' + numTxt(c.cantidad); }).join('<br>') + (cur.length > 3 ? '<br>y ' + (cur.length - 3) + ' más' : '') : '—') + '</td>' +
            (K.puede_editar ? '<td><button class="btn btn-sm" data-ed="' + e.id + '" type="button">Actualizar</button></td>' : '') + '</tr>';
        }).join('') + '</tbody></table></div>' : '<div class="vacio">Sin equipos con ese filtro.</div>';
      $$('#bio-lista [data-ed]').forEach(function (b) { b.onclick = function () { editar(K.equipos.find(function (e) { return +e.id === +b.getAttribute('data-ed'); })); }; });
      $('#bio-bit').innerHTML = (K.bitacora || []).length ? K.bitacora.slice(0, 12).map(function (r) { return '<li><b>' + esc(r.accion) + '</b>' + (r.detalle ? '<br><span class="meta">' + esc(r.detalle) + '</span>' : '') + '<br><span class="meta">' + esc(r.usuario_nombre || '') + ' · ' + momento(r.momento) + '</span></li>'; }).join('') : '<li class="meta">Sin cambios registrados.</li>';
    }
    function editar(e) {
      var n = !e; e = e || { nombre: '', inv_total: 0, inv_disp: 0, inv_mant: 0, inv_baja: 0, inv_obs: '' };
      var c = function (id, l, v, ayuda) { return '<label class="campo"><span>' + l + '</span><input id="' + id + '" type="number" min="0" step="1" value="' + (+v || 0) + '">' + (ayuda ? '<small>' + ayuda + '</small>' : '') + '</label>'; };
      var m = modal(n ? 'Nuevo equipo biomédico' : e.nombre, '<div class="form-grid">' + (n ? '<label class="campo ancho"><span class="req">Equipo</span><input id="b-n" maxlength="160" placeholder="Ej. Shaver ARTHREX"></label>' : '') +
        c('b-t', 'Total', e.inv_total) + c('b-d', 'Disponibles', e.inv_disp, 'Lo que se puede ofrecer a los cursos.') + c('b-m', 'En mantenimiento', e.inv_mant) + c('b-b', 'Dados de baja', e.inv_baja) +
        '<label class="campo"><span>Corte del inventario</span><input id="b-c" maxlength="60" value="' + esc(K.corte || '') + '" placeholder="Ej. Octubre 2026"></label>' +
        '<label class="campo ancho"><span>Observación</span><input id="b-o" maxlength="500" value="' + esc(e.inv_obs || '') + '" placeholder="Ej. 2 en revisión con el proveedor"></label></div>' +
        (n ? '<p class="meta" style="margin:0">Queda en el catálogo de presupuesto (Equipos · Biomédica) y el cliente lo puede elegir en su enlace.</p>' : ''),
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="b-ok" type="button">Guardar</button>');
      $('#b-ok', m.el).onclick = function () {
        api('bio_guardar', { id: n ? 0 : e.id, nombre: n ? $('#b-n', m.el).value : '', total: $('#b-t', m.el).value, disponibles: $('#b-d', m.el).value, mantenimiento: $('#b-m', m.el).value, bajas: $('#b-b', m.el).value, obs: $('#b-o', m.el).value, corte: $('#b-c', m.el).value })
          .then(function () { m.cerrar(); toast('Inventario biomédico actualizado.'); cargar(); }, function (x) { errorEn(m, x.error); });
      };
    }
    function exportar() {
      if (!window.XLSX) return toast('No se pudo cargar el generador de Excel.', 'error');
      var rows = K.equipos.map(function (e, i) { return { '#': i + 1, 'Equipo biomédico': e.nombre, 'Código': e.codigo, 'Total': +e.inv_total || 0, 'Disponibles': +e.inv_disp || 0, 'Mantenimiento': +e.inv_mant || 0, 'Bajas': +e.inv_baja || 0, 'Estado': e.inv_estado, 'Observación': e.inv_obs || '' }; });
      var wb = XLSX.utils.book_new(), h = XLSX.utils.json_to_sheet(rows); h['!cols'] = [4, 36, 10, 8, 12, 14, 8, 12, 36].map(function (w) { return { wch: w }; });
      XLSX.utils.book_append_sheet(wb, h, 'Equipos biomédicos');
      guardarArchivo(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Equipos-biomedicos-CLEMI.xlsx').catch(falla);
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">4 · La operación · Biomédica</div><h1>Inventario biomédico</h1><p>Equipos disponibles para los cursos según el inventario de Biomédica. En el enlace del cliente y al agregar del catálogo, cada equipo se limita a las unidades disponibles en las fechas del curso (descontando lo comprometido en otros cursos en cotización o contratados).</p></div>' +
      '<div class="acciones"><button class="btn" id="bio-x" type="button">Exportar a Excel</button>' + (puedeBM() ? '<button class="btn btn-oro" id="bio-new" type="button">+ Nuevo equipo</button>' : '') + '</div></div>' +
      '<div class="kpis" id="bio-kpis"></div><div class="panel"><div class="panel-cab"><input type="search" id="bio-q" placeholder="Buscar equipo…" style="max-width:280px"><span class="meta" id="bio-n"></span></div><div id="bio-lista"><div class="vacio">Cargando…</div></div></div>' +
      '<div class="panel"><div class="panel-cab"><h2>Últimos cambios</h2></div><ul class="bio-bit" id="bio-bit"></ul></div>');
    $('#bio-q').oninput = function () { q = this.value.toLowerCase(); if (K) pintar(); };
    $('#bio-x').onclick = function () { if (K) exportar(); };
    var b; if ((b = $('#bio-new'))) b.onclick = function () { editar(null); };
    S.vista = { refrescar: cargar };
    cargar();
  }

  // ------------------------------------------------------------ bodega de almacén (existencias, entradas y salidas)
  function vPSBodega() {
    var K = null, vista = 'existencias', q = '', cat = '', f = 'todos', mt = '', mu = '';
    function cargar() { return api('bod_inventario').then(function (j) { K = j; pintar(); }, falla); }
    function un(p) { return String(p.unidad || '').toLowerCase(); }
    function pintar() {
      var P = K.productos.filter(function (p) { return +p.activo; }), mes = K.hoy.slice(0, 7);
      var ent = K.movimientos.filter(function (m) { return m.tipo === 'Entrada' && m.fecha.slice(0, 7) === mes; }).length, sal = K.movimientos.filter(function (m) { return m.tipo === 'Salida' && m.fecha.slice(0, 7) === mes; }).length;
      var k = function (n, t, x, cls) { return '<button type="button" class="kpi' + (cls ? ' ' + cls : '') + (f === x && vista === 'existencias' ? ' is-on' : '') + '" data-f="' + x + '"><b>' + n + '</b><span>' + t + '</span></button>'; };
      $('#bd-kpis').innerHTML = k(P.length, 'productos en bodega', 'todos') + k(P.filter(function (p) { return +p.bajo; }).length, 'en o por debajo del mínimo', 'bajo', 'oro') +
        k(P.filter(function (p) { return p.stock <= 0; }).length, 'agotados', 'agotados') + '<div class="kpi"><b>' + ent + ' / ' + sal + '</b><span>entradas / salidas este mes</span></div>';
      $$('#bd-kpis [data-f]').forEach(function (b) { b.onclick = function () { f = b.getAttribute('data-f'); vista = 'existencias'; $$('#bd-v button').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-v') === 'existencias'); }); pintar(); }; });
      $('#bd-filtros').innerHTML = vista === 'existencias'
        ? '<select id="bd-c" style="max-width:220px"><option value="">Todas las categorías</option>' + K.categorias.map(function (c) { return '<option' + (c === cat ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>'
        : '<select id="bd-t" style="max-width:160px"><option value="">Entradas y salidas</option><option' + (mt === 'Entrada' ? ' selected' : '') + '>Entrada</option><option' + (mt === 'Salida' ? ' selected' : '') + '>Salida</option></select><select id="bd-u" style="max-width:200px"><option value="">Todas las ubicaciones</option>' + K.ubicaciones.map(function (u) { return '<option' + (u === mu ? ' selected' : '') + '>' + esc(u) + '</option>'; }).join('') + '</select>';
      var x;
      if ((x = $('#bd-c'))) x.onchange = function () { cat = this.value; pintar(); };
      if ((x = $('#bd-t'))) x.onchange = function () { mt = this.value; pintar(); };
      if ((x = $('#bd-u'))) x.onchange = function () { mu = this.value; pintar(); };
      if (vista === 'existencias') {
        var L = P.filter(function (p) { return (!cat || p.categoria === cat) && (f !== 'bajo' || +p.bajo) && (f !== 'agotados' || p.stock <= 0) && (!q || (p.codigo + ' ' + p.nombre).toLowerCase().indexOf(q) >= 0); });
        $('#bd-n').textContent = L.length + ' productos';
        $('#bd-lista').innerHTML = L.length ? '<div class="tabla-wrap"><table class="tabla tabla-click"><thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th class="num">Entradas</th><th class="num">Salidas</th><th class="num">Existencia</th><th class="num">Mínimo</th><th>Estado</th></tr></thead><tbody>' +
          L.map(function (p) {
            return '<tr data-p="' + p.id + '"><td class="comp-cod">' + esc(p.codigo) + '</td><td><b>' + esc(p.nombre) + '</b></td><td class="meta">' + esc(p.categoria) + '</td><td class="num">' + numTxt(p.entradas) + '</td><td class="num">' + numTxt(p.salidas) + '</td>' +
              '<td class="num"><b>' + numTxt(p.stock) + '</b> <span class="meta">' + esc(un(p)) + '</span></td><td class="num">' + numTxt(p.stock_min) + '</td><td>' + (p.stock <= 0 ? '<span class="chip ct-can">Agotado</span>' : +p.bajo ? '<span class="chip pe-cambio">Reabastecer</span>' : '<span class="chip pe-aprobado">OK</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>' : '<div class="vacio">Sin productos con ese filtro.</div>';
        $$('#bd-lista tr[data-p]').forEach(function (tr) { tr.onclick = function () { kardex(K.productos.find(function (p) { return +p.id === +tr.getAttribute('data-p'); })); }; });
      } else {
        var M = K.movimientos.filter(function (m) { return (!mt || m.tipo === mt) && (!mu || m.ubicacion === mu) && (!q || (m.codigo + ' ' + m.producto + ' ' + m.responsable + ' ' + m.obs + ' ' + (m.contrato_codigo || '')).toLowerCase().indexOf(q) >= 0); });
        $('#bd-n').textContent = M.length + ' movimientos';
        $('#bd-lista').innerHTML = M.length ? '<div class="tabla-wrap"><table class="tabla"><thead><tr><th>Fecha</th><th>Tipo</th><th>Producto</th><th class="num">Cantidad</th><th>Ubicación</th><th>Responsable</th><th>Curso / soporte</th></tr></thead><tbody>' +
          M.slice(0, 400).map(function (m) {
            return '<tr><td style="white-space:nowrap">' + esc(fCorta(m.fecha)) + '</td><td>' + (m.tipo === 'Entrada' ? '<span class="chip pe-aprobado">Entrada</span>' : '<span class="chip pe-enviado">Salida</span>') + '</td><td><span class="comp-cod">' + esc(m.codigo) + '</span> ' + esc(m.producto) + '</td>' +
              '<td class="num"><b>' + numTxt(m.cantidad) + '</b></td><td>' + esc(m.ubicacion || '—') + '</td><td>' + esc(m.responsable || '—') + '</td><td class="meta bd-obs">' + esc([m.contrato_codigo, m.documento, m.obs].filter(Boolean).join(' · ') || '—') + '</td></tr>';
          }).join('') + '</tbody></table></div>' + (M.length > 400 ? '<p class="meta" style="padding:0 18px">Mostrando 400 de ' + M.length + '. Use los filtros o exporte a Excel.</p>' : '') : '<div class="vacio">Sin movimientos con ese filtro.</div>';
      }
    }
    function kardex(p) {
      var M = K.movimientos.filter(function (m) { return +m.producto_id === +p.id; }), saldo = 0;
      var filas = M.slice().reverse().map(function (m) { saldo += m.tipo === 'Entrada' ? +m.cantidad : -m.cantidad; return { m: m, s: saldo }; }).reverse();
      var md = modal(p.codigo + ' · ' + p.nombre, '<div class="kpis" style="margin:0"><div class="kpi"><b>' + numTxt(p.stock) + '</b><span>' + esc(un(p)) + ' en bodega</span></div><div class="kpi"><b>' + numTxt(p.stock_min) + '</b><span>stock mínimo</span></div><div class="kpi"><b>' + numTxt(p.salidas) + '</b><span>salidas registradas</span></div></div>' +
        '<div class="tabla-wrap" style="max-height:48vh;overflow:auto;margin-top:12px"><table class="tabla"><thead><tr><th>Fecha</th><th>Tipo</th><th class="num">Cantidad</th><th class="num">Saldo</th><th>Ubicación · responsable</th><th></th></tr></thead><tbody>' +
        (filas.length ? filas.map(function (r) { var m = r.m; return '<tr><td>' + esc(fCorta(m.fecha)) + '</td><td>' + esc(m.tipo) + '</td><td class="num">' + (m.tipo === 'Entrada' ? '+' : '−') + numTxt(m.cantidad) + '</td><td class="num"><b>' + numTxt(r.s) + '</b></td><td>' + esc([m.ubicacion, m.responsable].filter(Boolean).join(' · ')) + (m.obs ? '<br><span class="meta">' + esc(m.obs) + '</span>' : '') + '</td><td>' + (m.origen === 'Plataforma' ? '<button class="btn-link" type="button" data-an="' + m.id + '">Anular</button>' : '') + '</td></tr>'; }).join('') : '<tr><td colspan="6" class="meta">Sin movimientos.</td></tr>') + '</tbody></table></div>',
        '<button class="btn" type="button" id="kx-ed">Editar producto</button><button class="btn" type="button" id="kx-s">Registrar salida</button><button class="btn btn-verde" type="button" id="kx-e">Registrar entrada</button>', { ancho: true });
      $('#kx-ed', md.el).onclick = function () { md.cerrar(); editar(p); };
      $('#kx-s', md.el).onclick = function () { md.cerrar(); movimiento('Salida', p); };
      $('#kx-e', md.el).onclick = function () { md.cerrar(); movimiento('Entrada', p); };
      $$('[data-an]', md.el).forEach(function (b) { b.onclick = function () { var mot = prompt('Motivo para anular este movimiento:'); if (!mot) return; api('bod_movimiento_borrar', { id: b.getAttribute('data-an'), motivo: mot }).then(function () { md.cerrar(); toast('Movimiento anulado.'); cargar(); }, falla); }; });
    }
    function movimiento(tipo, p) {
      var m = modal(tipo === 'Entrada' ? 'Entrada a bodega' : 'Salida de bodega', '<div class="seg" id="mv-t"><button type="button" data-t="Entrada"' + (tipo === 'Entrada' ? ' class="on"' : '') + '>Entrada</button><button type="button" data-t="Salida"' + (tipo === 'Salida' ? ' class="on"' : '') + '>Salida</button></div><div class="form-grid">' +
        '<label class="campo ancho"><span class="req">Producto</span><input id="mv-p" list="mv-pl" placeholder="Escriba el código o el nombre" value="' + (p ? esc(p.codigo + ' · ' + p.nombre) : '') + '"><datalist id="mv-pl">' + K.productos.filter(function (x) { return +x.activo; }).map(function (x) { return '<option value="' + esc(x.codigo + ' · ' + x.nombre) + '">'; }).join('') + '</datalist><small id="mv-st"></small></label>' +
        '<label class="campo"><span class="req">Cantidad</span><input id="mv-c" type="number" min="0" step="any"></label><label class="campo"><span>Fecha</span><input id="mv-f" type="date" value="' + K.hoy + '" max="' + K.hoy + '"></label>' +
        '<label class="campo"><span id="mv-ul">Ubicación / destino</span><input id="mv-u" list="mv-ul2" maxlength="80"><datalist id="mv-ul2">' + K.ubicaciones.map(function (u) { return '<option value="' + esc(u) + '">'; }).join('') + '</datalist></label>' +
        '<label class="campo"><span id="mv-rl">Responsable</span><input id="mv-r" list="mv-rl2" maxlength="120"><datalist id="mv-rl2">' + K.responsables.map(function (u) { return '<option value="' + esc(u) + '">'; }).join('') + '</datalist></label>' +
        '<label class="campo"><span>Curso (convenio)</span><select id="mv-k"><option value="">— Ninguno —</option>' + K.contratos.map(function (c) { return '<option value="' + c.id + '">' + esc(c.codigo + ' · ' + c.cliente + ' · ' + c.curso + ' · ' + fCorta(c.fecha_inicio)) + '</option>'; }).join('') + '</select></label>' +
        '<label class="campo"><span>Documento soporte</span><input id="mv-d" maxlength="120" placeholder="Factura, remisión…"></label>' +
        '<label class="campo ancho"><span>Observaciones</span><input id="mv-o" maxlength="500"></label></div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="mv-ok" type="button">Registrar</button>', { ancho: true });
      var t = tipo;
      function prod() { var v = $('#mv-p', m.el).value.split(' · ')[0].trim().toUpperCase(); return K.productos.find(function (x) { return x.codigo.toUpperCase() === v; }); }
      function ver() { var x = prod(); $('#mv-st', m.el).textContent = x ? 'En bodega: ' + numTxt(x.stock) + ' ' + un(x) + (+x.stock_min ? ' · mínimo ' + numTxt(x.stock_min) : '') : ''; $('#mv-ul', m.el).className = t === 'Salida' ? 'req' : ''; $('#mv-rl', m.el).className = t === 'Salida' ? 'req' : ''; if (t === 'Entrada' && !$('#mv-u', m.el).value) $('#mv-u', m.el).value = 'Bodega'; if (t === 'Salida' && $('#mv-u', m.el).value === 'Bodega') $('#mv-u', m.el).value = ''; }
      $$('#mv-t button', m.el).forEach(function (b) { b.onclick = function () { t = b.getAttribute('data-t'); $$('#mv-t button', m.el).forEach(function (y) { y.classList.toggle('on', y === b); }); ver(); }; });
      $('#mv-p', m.el).oninput = ver; ver();
      function enviar(forzar) {
        var x = prod(); if (!x) return errorEn(m, 'Elija un producto de la lista.');
        api('bod_movimiento_guardar', { tipo: t, producto_id: x.id, cantidad: $('#mv-c', m.el).value, fecha: $('#mv-f', m.el).value, ubicacion: $('#mv-u', m.el).value, responsable: $('#mv-r', m.el).value,
          contrato_id: $('#mv-k', m.el).value, documento: $('#mv-d', m.el).value, obs: $('#mv-o', m.el).value, forzar: forzar ? 1 : 0 })
          .then(function () { m.cerrar(); toast((t === 'Entrada' ? 'Entrada' : 'Salida') + ' registrada.'); cargar(); }, function (e) {
            errorEn(m, e.error);
            if (e.sin_stock) { $('.form-error', m.el).insertAdjacentHTML('beforeend', ' <button type="button" class="btn btn-sm" id="mv-fz">Registrar de todas formas</button>'); $('#mv-fz', m.el).onclick = function () { enviar(true); }; }
          });
      }
      $('#mv-ok', m.el).onclick = function () { enviar(false); };
    }
    function editar(p) {
      var n = !p; p = p || { codigo: '', nombre: '', categoria: K.categorias[0], unidad: 'Unidad', stock_min: 0, obs: '', activo: 1 };
      var m = modal(n ? 'Nuevo producto de bodega' : p.codigo + ' · ' + p.nombre, '<div class="form-grid">' +
        '<label class="campo"><span>Código</span><input id="bp-c" maxlength="30" value="' + esc(p.codigo) + '" placeholder="Automático (BCL-…)"></label><label class="campo"><span class="req">Producto</span><input id="bp-n" maxlength="200" value="' + esc(p.nombre) + '"></label>' +
        '<label class="campo"><span>Categoría</span><select id="bp-g">' + K.categorias.map(function (c) { return '<option' + (c === p.categoria ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
        '<label class="campo"><span>Unidad</span><input id="bp-u" maxlength="30" value="' + esc(p.unidad) + '"></label><label class="campo"><span>Stock mínimo</span><input id="bp-m" type="number" min="0" step="any" value="' + numTxt(p.stock_min) + '"></label>' +
        '<label class="campo ancho"><span>Observaciones</span><input id="bp-o" maxlength="500" value="' + esc(p.obs || '') + '"></label>' +
        (n ? '<label class="check ancho"><input type="checkbox" id="bp-cat" checked>Ofrecerlo también en el catálogo de presupuesto (como insumo, por cotizar)</label>' : '<label class="check"><input type="checkbox" id="bp-a"' + (+p.activo ? ' checked' : '') + '>Producto activo</label>') + '</div>',
        '<button class="btn" data-cerrar type="button">Cancelar</button><button class="btn btn-verde" id="bp-ok" type="button">Guardar</button>');
      $('#bp-ok', m.el).onclick = function () {
        api('bod_producto_guardar', { id: n ? 0 : p.id, codigo: $('#bp-c', m.el).value, nombre: $('#bp-n', m.el).value, categoria: $('#bp-g', m.el).value, unidad: $('#bp-u', m.el).value, stock_min: $('#bp-m', m.el).value, obs: $('#bp-o', m.el).value,
          activo: $('#bp-a', m.el) ? ($('#bp-a', m.el).checked ? 1 : 0) : 1, al_catalogo: $('#bp-cat', m.el) && $('#bp-cat', m.el).checked ? 1 : 0 }).then(function (j) { m.cerrar(); toast('Producto ' + j.codigo + ' guardado.'); cargar(); }, function (e) { errorEn(m, e.error); });
      };
    }
    function exportar() {
      if (!window.XLSX) return toast('No se pudo cargar el generador de Excel.', 'error');
      var wb = XLSX.utils.book_new();
      var h1 = XLSX.utils.json_to_sheet(K.productos.map(function (p) { return { 'Código': p.codigo, 'Producto': p.nombre, 'Categoría': p.categoria, 'Unidad': p.unidad, 'Stock Mínimo': +p.stock_min, 'Observaciones': p.obs || '' }; }));
      var h2 = XLSX.utils.json_to_sheet(K.movimientos.slice().reverse().map(function (m, i) { return { 'N°': i + 1, 'Fecha': m.fecha, 'Tipo': m.tipo, 'Código': m.codigo, 'Producto': m.producto, 'Cantidad': +m.cantidad, 'Bodega/Ubicación': m.ubicacion, 'Responsable': m.responsable, 'Documento soporte': m.documento, 'Observaciones': [m.contrato_codigo, m.obs].filter(Boolean).join(' · ') }; }));
      var h3 = XLSX.utils.json_to_sheet(K.productos.map(function (p) { return { 'Código': p.codigo, 'Producto': p.nombre, 'Categoría': p.categoria, 'Unidad': p.unidad, 'Total Entradas': +p.entradas, 'Total Salidas': +p.salidas, 'Stock Actual': +p.stock, 'Stock Mínimo': +p.stock_min, 'Estado': p.stock <= 0 ? 'Agotado' : +p.bajo ? 'Bajo stock' : 'OK' }; }));
      [[h1, [10, 44, 20, 10, 12, 30]], [h2, [6, 11, 9, 10, 40, 9, 20, 22, 18, 50]], [h3, [10, 44, 20, 10, 12, 12, 12, 12, 12]]].forEach(function (x) { x[0]['!cols'] = x[1].map(function (w) { return { wch: w }; }); });
      XLSX.utils.book_append_sheet(wb, h1, 'Productos'); XLSX.utils.book_append_sheet(wb, h2, 'Movimientos'); XLSX.utils.book_append_sheet(wb, h3, 'Resumen Inventario');
      guardarArchivo(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'Control-Inventario-Bodega-' + K.hoy + '.xlsx').catch(falla);
    }
    montar('<div class="vista-cab"><div><div class="eyebrow">2 · Cotización</div><h1>Bodega</h1><p>Existencias de la bodega con cada entrada y salida: a qué sala o curso sale, quién lo recibe y con qué soporte. Reemplaza el Excel de control de inventario; los insumos médicos se ofrecen en el catálogo de presupuesto.</p></div>' +
      '<div class="acciones"><button class="btn" id="bd-x" type="button">Exportar a Excel</button><button class="btn" id="bd-np" type="button">+ Producto</button><button class="btn" id="bd-s" type="button">Registrar salida</button><button class="btn btn-oro" id="bd-e" type="button">Registrar entrada</button></div></div>' +
      '<div class="kpis" id="bd-kpis"></div><div class="panel"><div class="panel-cab"><div class="acciones"><div class="seg" id="bd-v"><button type="button" data-v="existencias" class="on">Existencias</button><button type="button" data-v="movimientos">Movimientos</button></div><span id="bd-filtros" class="acciones"></span>' +
      '<input type="search" id="bd-q" placeholder="Buscar código, producto, responsable…" style="max-width:280px"></div><span class="meta" id="bd-n"></span></div><div id="bd-lista"><div class="vacio">Cargando…</div></div></div>');
    $$('#bd-v button').forEach(function (b) { b.onclick = function () { vista = b.getAttribute('data-v'); $$('#bd-v button').forEach(function (x) { x.classList.toggle('on', x === b); }); if (K) pintar(); }; });
    $('#bd-q').oninput = function () { q = this.value.toLowerCase(); if (K) pintar(); };
    $('#bd-x').onclick = function () { if (K) exportar(); };
    $('#bd-np').onclick = function () { if (K) editar(null); };
    $('#bd-s').onclick = function () { if (K) movimiento('Salida'); };
    $('#bd-e').onclick = function () { if (K) movimiento('Entrada'); };
    S.vista = { refrescar: cargar };
    cargar();
  }

  // ------------------------------------------------------------ arranque
  api('yo').then(function (j) { S.csrf = j.csrf; iniciar(); }, function () { mostrarLogin(); });
})();
