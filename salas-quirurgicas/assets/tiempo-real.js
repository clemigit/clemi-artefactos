/* CLEMI · Real Time: agenda de salas en pantalla completa, cinta de eventos y bitácora del día. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var API = window.CLEMI_RT_API || 'tiempo-real-api.php';
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'], DC = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  var MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var EST = { programado: 'Programado', en_curso: 'En curso', cerrado: 'Cerrado', cancelado: 'Cancelado' };
  var TIPO = { evento: 'Evento', verificacion: 'Verificación', asistencia: 'Ingreso', novedad: 'Novedad', entrega: 'Instrumental', layout: 'Sala' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dISO(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function sumar(s, n) { var d = dISO(s); d.setDate(d.getDate() + n); return iso(d); }
  function lunes(s) { var d = dISO(s), k = (d.getDay() + 6) % 7; d.setDate(d.getDate() - k); return iso(d); }
  function cap(x) { return x.charAt(0).toUpperCase() + x.slice(1); }
  function fC(s) { var d = dISO(s); return cap(DC[d.getDay()]) + ' ' + d.getDate() + ' ' + MES[d.getMonth()].slice(0, 3); }
  function get(q) { return fetch(API + '?' + q, { cache: 'no-store', credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) { if (!j.ok) throw j; return j; }); }

  var S = { semana: lunes(iso(new Date())), ultimo: 0, hoy: iso(new Date()), cinta: '' };

  function reloj() {
    var d = new Date();
    $('#rt-reloj').innerHTML = '<b>' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + '<small>:' + pad(d.getSeconds()) + '</small></b><span>' + cap(DIAS[d.getDay()]) + ' ' + d.getDate() + ' de ' + MES[d.getMonth()] + '</span>';
    if (iso(d) !== S.hoy) { S.hoy = iso(d); S.semana = lunes(S.hoy); S.ultimo = 0; $('#rt-bit').innerHTML = ''; agenda(); }
  }

  function agenda() {
    return get('a=todo&desde=' + S.semana).then(function (j) {
      var dias = []; for (var i = 0; i < 7; i++) dias.push(sumar(j.desde, i));
      var d0 = dISO(j.desde), d6 = dISO(j.hasta);
      $('#rt-rango').textContent = d0.getDate() + ' ' + MES[d0.getMonth()].slice(0, 3) + ' – ' + d6.getDate() + ' ' + MES[d6.getMonth()].slice(0, 3) + ' ' + d6.getFullYear();
      var diaDe = function (e, f) { return (e.dias || []).find(function (x) { return x.fecha === f; }); };
      var cab = '<div class="rt-c rt-c-sala rt-h">Sala</div>' + dias.map(function (f) {
        var d = dISO(f), n = j.ocupacion[f] || 0, fe = j.festivos.indexOf(f) >= 0;
        return '<div class="rt-c rt-h' + (f === j.hoy ? ' hoy' : '') + '"><span>' + DIAS[d.getDay()] + '</span><b>' + d.getDate() + '</b>' + (fe ? '<em>Festivo</em>' : '') + '<i class="cupo ' + (n >= j.cupo ? 'lleno' : n ? 'medio' : 'libre') + '">' + n + '/' + j.cupo + '</i></div>';
      }).join('');
      var filas = j.salas.map(function (s) {
        return '<div class="rt-c rt-c-sala">' + esc(s.nombre) + '</div>' + dias.map(function (f) {
          var evs = j.eventos.filter(function (e) { return e.sala_id === +s.id && diaDe(e, f); });
          var rs = j.reservas.filter(function (r) { return (r.salas || [r.sala_id]).indexOf(+s.id) >= 0 && r.fecha_inicio <= f && r.fecha_fin >= f; });
          return '<div class="rt-c' + (f === j.hoy ? ' hoy' : '') + '">' + evs.map(function (e) {
            var dd = diaDe(e, f), k = e.dias.indexOf(dd) + 1;
            return '<div class="rt-ev st-' + e.estado + '"><b>' + dd.hora_ini + '–' + dd.hora_fin + '</b><span class="t">' + esc(e.titulo) + '</span>' + (e.empresa ? '<span class="e">' + esc(e.empresa) + '</span>' : '') + (e.dias.length > 1 ? '<span class="d">Día ' + k + ' de ' + e.dias.length + '</span>' : '') + (e.estado === 'en_curso' ? '<span class="ya">● En curso</span>' : '') + '</div>';
          }).join('') + rs.map(function (r) { return '<div class="rt-ev rt-res"><b>Reservado</b><span class="t">' + esc(r.curso) + '</span></div>'; }).join('') + '</div>';
        }).join('');
      }).join('');
      $('#rt-agenda').innerHTML = '<div class="rt-grid" style="grid-template-rows:auto repeat(' + j.salas.length + ',minmax(0,1fr))">' + cab + filas + '</div>';
      // Cinta: eventos y reservas de la semana
      var L = j.eventos.map(function (e) { return { f: e.fecha, h: '<span class="rt-ti"><i class="pt st-' + e.estado + '"></i><b>' + esc(fC(e.fecha)) + (e.fecha_fin !== e.fecha ? ' – ' + esc(fC(e.fecha_fin)) : '') + '</b> ' + esc(e.titulo) + (e.empresa ? ' · ' + esc(e.empresa) : '') + ' · ' + esc(sala(j, e.sala_id)) + ' <em>' + (EST[e.estado] || '') + '</em></span>' }; })
        .concat(j.reservas.map(function (r) { return { f: r.fecha_inicio, h: '<span class="rt-ti"><i class="pt res"></i><b>' + esc(fC(r.fecha_inicio)) + (r.fecha_fin !== r.fecha_inicio ? ' – ' + esc(fC(r.fecha_fin)) : '') + '</b> ' + esc(r.curso) + ' · ' + esc(sala(j, r.sala_id)) + ' <em>Reservado</em></span>' }; }))
        .sort(function (a, b) { return a.f < b.f ? -1 : a.f > b.f ? 1 : 0; }).map(function (x) { return x.h; });
      var html = L.length ? L.join('<span class="rt-sep">✦</span>') : '<span class="rt-ti">No hay eventos ni reservas esta semana</span>';
      if (html !== S.cinta) {
        S.cinta = html;
        var c = $('#rt-cinta'), via = $('.rt-ticker-via'), tramo = html + '<span class="rt-sep">✦</span>', rep = tramo;
        c.innerHTML = '<div class="rt-tramo">' + rep + '</div>';
        // Repite la lista hasta llenar el ancho de la cinta para que rote sin huecos.
        for (var k = 0; k < 12 && c.firstChild.scrollWidth < via.clientWidth; k++) { rep += tramo; c.firstChild.innerHTML = rep; }
        c.innerHTML = '<div class="rt-tramo">' + rep + '</div><div class="rt-tramo" aria-hidden="true">' + rep + '</div>';
        var w = c.firstChild.scrollWidth; c.style.animationDuration = Math.max(25, Math.round(w / 60)) + 's';
      }
      hoyEventos(j);
      bitacora(j.bitacora);
      ensayo(j.ensayo);
      estado(true);
    }, function () { estado(false); });
  }
  function sala(j, id) { var s = j.salas.find(function (x) { return +x.id === +id; }); return s ? s.nombre : ''; }

  function hoyEventos(j) {
    var d = dISO(j.hoy); $('#rt-hoy-f').textContent = cap(DIAS[d.getDay()]) + ' ' + d.getDate() + ' de ' + MES[d.getMonth()];
    $('#rt-hoy-ev').innerHTML = j.eventos_hoy.length ? j.eventos_hoy.map(function (e) {
      var pi = e.personas ? Math.round(e.ingresos * 100 / e.personas) : 0, pv = e.verif_total ? Math.round(e.verif_hechos * 100 / e.verif_total) : 0;
      return '<div class="rt-he st-' + e.estado + '"><div class="rt-he-c"><b>' + esc(e.titulo) + '</b><span>' + esc(e.sala || '') + ' · ' + e.hora_ini + '–' + e.hora_fin + (e.empresa ? ' · ' + esc(e.empresa) : '') + '</span><i class="est">' + (EST[e.estado] || '') + '</i></div>' +
        '<div class="rt-he-n"><div><small>Ingresos</small><b>' + e.ingresos + '<em>/' + e.personas + '</em></b><span class="bar"><i style="width:' + pi + '%"></i></span></div>' +
        '<div><small>Verificación</small><b>' + e.verif_hechos + '<em>/' + e.verif_total + '</em></b><span class="bar"><i style="width:' + pv + '%"></i></span></div>' +
        '<div><small>Novedades hoy</small><b>' + e.novedades + '</b></div></div></div>';
    }).join('') : '<div class="rt-vacio">Hoy no hay entrenamientos en la agenda.</div>';
  }

  function bitacora(L) {
    var ol = $('#rt-bit');
    var nuevos = (L || []).filter(function (b) { return b.id > S.ultimo; }).sort(function (a, b) { return a.hora < b.hora ? -1 : a.hora > b.hora ? 1 : a.id - b.id; });
    if (!nuevos.length) { if (!ol.children.length) ol.innerHTML = '<li class="rt-vacio">Aquí aparece, en vivo, cada registro de los eventos de hoy: inicio, verificación, ingresos, novedades e instrumental.</li>'; return; }
    var primero = !S.ultimo; if (ol.querySelector('.rt-vacio')) ol.innerHTML = '';
    nuevos.forEach(function (b) {
      var li = document.createElement('li'); li.className = 'tipo-' + b.tipo + (primero ? '' : ' nuevo');
      li.innerHTML = '<time>' + b.hora + '</time><span class="tg">' + esc(TIPO[b.tipo] || b.tipo) + '</span><p><b>' + esc(b.quien) + '</b> ' + esc(b.accion.charAt(0).toLowerCase() + b.accion.slice(1)) + '<small>' + esc(b.evento) + (b.sala ? ' · ' + esc(b.sala) : '') + '</small></p>';
      ol.insertBefore(li, ol.firstChild);
    });
    S.ultimo = Math.max.apply(null, [S.ultimo].concat(nuevos.map(function (b) { return b.id; })));
    while (ol.children.length > 60) ol.removeChild(ol.lastChild);
  }
  function sondeo() {
    get('a=bitacora&tras=' + S.ultimo).then(function (j) { hoyEventos(j); bitacora(j.bitacora); ensayo(j.ensayo); estado(true); }, function () { estado(false); });
  }
  function ensayo(n) { var b = document.getElementById('rt-ensayo'); if (!b) { b = document.createElement('span'); b.id = 'rt-ensayo'; b.className = 'rt-ensayo'; document.querySelector('.rt-tit').appendChild(b); } b.hidden = !n; b.textContent = n ? 'MODO ENSAYO · ' + n : ''; }
  function estado(ok) { var e = $('#rt-estado'); e.textContent = ok ? '● En vivo · actualizado ' + new Date().toTimeString().slice(0, 8) : '● Sin conexión · reintentando'; e.className = 'rt-estado' + (ok ? '' : ' mal'); }

  $('#rt-prev').onclick = function () { S.semana = sumar(S.semana, -7); agenda(); };
  $('#rt-next').onclick = function () { S.semana = sumar(S.semana, 7); agenda(); };
  $('#rt-hoy').onclick = function () { S.semana = lunes(iso(new Date())); agenda(); };
  $('#rt-full').onclick = function () {
    var el = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
  };
  document.addEventListener('fullscreenchange', function () { $('#rt-full').textContent = document.fullscreenElement ? '✕ Salir de pantalla completa' : '⛶ Pantalla completa'; document.body.classList.toggle('lleno', !!document.fullscreenElement); });
  if (/[?&]salir=0/.test(location.search)) $('.rt-salir').hidden = true;

  reloj(); setInterval(reloj, 1000);
  agenda(); setInterval(agenda, 60000); setInterval(sondeo, 8000);
})();
