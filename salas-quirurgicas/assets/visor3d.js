/* =====================================================================
   CLEMI · Visor 3D de componentes anatómicos
   - Convierte un video (giro 360° alrededor del cuerpo o recorrido normal)
     en una secuencia interactiva que se gira/recorre arrastrando.
   - Muestra modelos 3D reales (.glb) creados con fotogrametría.
   - Zoom, desplazamiento, filtros de imagen, hallazgos marcados y
     comparación lado a lado (ingreso / salida).
   Todo corre en el navegador; el servidor solo guarda los archivos.
   ===================================================================== */
(function () {
  'use strict';

  var CSS = '' +
    '.v3d{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:0;height:100%;min-height:420px;background:#0d1a13;color:#f3efe4;border-radius:12px;overflow:hidden;font:14px/1.4 "Source Sans 3",system-ui,sans-serif}' +
    '.v3d.sin-lado{grid-template-columns:minmax(0,1fr)}' +
    '.v3d-esc{position:relative;overflow:hidden;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;min-height:0}' +
    '.v3d-esc.arrastra{cursor:grabbing}.v3d-esc.marcando{cursor:crosshair}.v3d-esc.moviendo{cursor:move}' +
    '.v3d-esc canvas{position:absolute;inset:0;width:100%;height:100%;display:block}' +
    '.v3d-bar{position:absolute;left:10px;right:10px;top:10px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;z-index:3;pointer-events:none}' +
    '.v3d-bar>*{pointer-events:auto}' +
    '.v3d-b{font:600 13px/1 inherit;font-family:inherit;border:1px solid rgba(232,194,91,.35);background:rgba(13,26,19,.78);color:#f3efe4;border-radius:8px;padding:7px 10px;cursor:pointer;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);display:inline-flex;align-items:center;gap:6px;min-height:34px}' +
    '.v3d-b:hover{border-color:#E8C25B}.v3d-b.on{background:#C6A13B;color:#10231a;border-color:#E8C25B}' +
    '.v3d-b svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '.v3d-tag{margin-left:auto;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#E8C25B;background:rgba(13,26,19,.78);padding:6px 10px;border-radius:999px;border:1px solid rgba(232,194,91,.3)}' +
    '.v3d-pie{position:absolute;left:12px;right:12px;bottom:10px;z-index:3;display:flex;align-items:center;gap:10px;background:rgba(13,26,19,.78);border:1px solid rgba(232,194,91,.25);border-radius:10px;padding:8px 12px;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}' +
    '.v3d-pista{position:relative;flex:1;height:28px}' +
    '.v3d-pista input{position:absolute;inset:0;width:100%;margin:0;accent-color:#C6A13B;background:transparent}' +
    '.v3d-punto{position:absolute;top:1px;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:#E8C25B;box-shadow:0 0 0 2px #0d1a13;pointer-events:none}' +
    '.v3d-ang{min-width:64px;text-align:right;font-variant-numeric:tabular-nums;font-weight:700;color:#E8C25B}' +
    '.v3d-ayuda{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:2;background:rgba(13,26,19,.82);border:1px solid rgba(232,194,91,.35);padding:12px 16px;border-radius:12px;text-align:center;pointer-events:none;transition:opacity .5s;font-size:14px;max-width:80%}' +
    '.v3d-ayuda b{color:#E8C25B}' +
    '.v3d-carga{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:4;background:#0d1a13;color:#E8C25B;font-weight:600}' +
    '.v3d-marca{position:absolute;z-index:2;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:#C6A13B;color:#10231a;font:800 12px/26px inherit;font-family:inherit;text-align:center;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5);cursor:pointer;transition:opacity .15s}' +
    '.v3d-marca.lejos{opacity:.35;transform:scale(.8)}' +
    '.v3d-marca:hover::after,.v3d-marca.activa::after{content:attr(data-t);position:absolute;left:30px;top:-2px;white-space:nowrap;max-width:260px;overflow:hidden;text-overflow:ellipsis;background:#10231a;color:#f3efe4;border:1px solid #C6A13B;padding:4px 8px;border-radius:6px;font-weight:600;font-size:12px;line-height:1.3}' +
    '.v3d-form{position:absolute;z-index:5;width:250px;background:#10231a;border:1px solid #C6A13B;border-radius:10px;padding:10px;box-shadow:0 10px 30px rgba(0,0,0,.5);display:grid;gap:8px}' +
    '.v3d-form select,.v3d-form textarea{font:inherit;font-size:13px;width:100%;border-radius:6px;border:1px solid rgba(232,194,91,.4);background:#0d1a13;color:#f3efe4;padding:6px 8px;box-sizing:border-box}' +
    '.v3d-form textarea{min-height:60px;resize:vertical}.v3d-form div{display:flex;gap:6px;justify-content:flex-end}' +
    '.v3d-filtros{position:absolute;right:10px;top:54px;z-index:4;width:220px;background:rgba(13,26,19,.92);border:1px solid rgba(232,194,91,.35);border-radius:10px;padding:10px 12px;display:grid;gap:6px;font-size:12px}' +
    '.v3d-vistas{position:absolute;left:10px;top:54px;z-index:4;width:236px;background:rgba(13,26,19,.94);border:1px solid rgba(232,194,91,.35);border-radius:10px;padding:10px;display:grid;gap:6px;font-size:12px}' +
    '.v3d-vistas h6{margin:4px 0 0;font:700 11px/1.2 inherit;font-family:inherit;letter-spacing:.1em;text-transform:uppercase;color:#E8C25B}' +
    '.v3d-vistas div{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}.v3d-vistas .v3d-b{justify-content:center;padding:6px 4px;font-size:12px;min-height:30px}' +
    '.v3d,.v3d *{box-sizing:border-box}.v3d-filtros label{display:grid;grid-template-columns:72px minmax(0,1fr);align-items:center;gap:8px}.v3d-filtros input{accent-color:#C6A13B;width:100%;min-width:0;margin:0}' +
    '.v3d-lado{border-left:1px solid rgba(232,194,91,.2);display:flex;flex-direction:column;min-height:0;background:#10231a}' +
    '.v3d-lado h4{margin:0;padding:14px 14px 8px;font:700 13px/1.2 inherit;font-family:inherit;letter-spacing:.08em;text-transform:uppercase;color:#E8C25B}' +
    '.v3d-lado p{margin:0 14px 10px;font-size:12px;color:rgba(243,239,228,.7)}' +
    '.v3d-lista{list-style:none;margin:0;padding:0 8px 12px;overflow:auto;flex:1;min-height:0}' +
    '.v3d-lista li{display:grid;grid-template-columns:24px 1fr auto;gap:8px;padding:8px 6px;border-radius:8px;cursor:pointer;align-items:start}' +
    '.v3d-lista li:hover{background:rgba(232,194,91,.08)}' +
    '.v3d-lista li i{font-style:normal;width:22px;height:22px;border-radius:50%;background:#C6A13B;color:#10231a;font-weight:800;font-size:11px;display:flex;align-items:center;justify-content:center}' +
    '.v3d-lista li b{display:block;font-size:13px}.v3d-lista li small{display:block;color:rgba(243,239,228,.6);font-size:11px}' +
    '.v3d-lista li button{border:0;background:none;color:rgba(243,239,228,.5);cursor:pointer;font-size:16px;line-height:1;padding:2px 4px}.v3d-lista li button:hover{color:#ff8a7a}' +
    '.v3d-vacio{padding:6px 14px;font-size:12px;color:rgba(243,239,228,.55)}' +
    '.v3d-par{display:grid;grid-template-columns:1fr 1fr;gap:8px;height:100%;min-height:420px}' +
    '.v3d-par>div{min-width:0;display:flex;flex-direction:column;gap:6px}.v3d-par>div>h5{margin:0;font:700 12px/1 inherit;font-family:inherit;letter-spacing:.1em;text-transform:uppercase;color:#8a6d1f}' +
    '.v3d-par .v3d{flex:1}' +
    '@media (max-width:760px){.v3d{grid-template-columns:1fr;grid-template-rows:minmax(320px,1fr) auto}.v3d-lado{border-left:0;border-top:1px solid rgba(232,194,91,.2);max-height:200px}.v3d-par{grid-template-columns:1fr}.v3d-tag{display:none}}';
  (function () { if (document.getElementById('v3d-css')) return; var s = document.createElement('style'); s.id = 'v3d-css'; s.textContent = CSS; document.head.appendChild(s); })();

  var ICO = {
    play: '<path d="M7 5l12 7-12 7z"/>', pausa: '<path d="M7 5v14M17 5v14"/>', mas: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M11 8v6M8 11h6"/>',
    menos: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6"/>', centro: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    mano: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
    marca: '<path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    ejes: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
    filtro: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 3a9 9 0 0 1 0 18"/>', foto: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'
  };
  function ico(n) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICO[n] + '</svg>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var TIPOS = ['Lesión', 'Livideces', 'Herida / incisión', 'Deterioro de tejido', 'Deformidad', 'Marca / identificación', 'Otro'];

  // ------------------------------------------------------------------
  // Generar secuencia desde un video (File, Blob o URL)
  // o = { modo: '360' | 'recorrido', n, lado }
  // ------------------------------------------------------------------
  function generar(fuente, o, prog) {
    o = o || {};
    return new Promise(function (ok, mal) {
      var url = typeof fuente === 'string' ? fuente : URL.createObjectURL(fuente), propia = typeof fuente !== 'string';
      var v = document.createElement('video'); v.muted = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto'; v.crossOrigin = 'anonymous';
      v.style.cssText = 'position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0';
      document.body.appendChild(v);
      var fin = function () { try { v.remove(); } catch (e) {} if (propia) URL.revokeObjectURL(url); };
      var espera = setTimeout(function () { fin(); mal({ error: 'Este navegador no pudo leer el video. Súbalo en MP4 (H.264) o use Chrome / Edge.' }); }, 30000);
      v.onerror = function () { clearTimeout(espera); fin(); mal({ error: 'Este navegador no pudo leer el video. Súbalo en MP4 (H.264) o use Chrome / Edge.' }); };
      v.onloadedmetadata = function () {
        clearTimeout(espera);
        var dur = v.duration, vw = v.videoWidth, vh = v.videoHeight;
        if (!isFinite(dur) || !dur || !vw) { fin(); return mal({ error: 'El video no tiene una duración válida.' }); }
        var modo = o.modo === '360' ? '360' : 'recorrido';
        var n = o.n || (modo === '360' ? 72 : Math.max(24, Math.min(96, Math.round(dur * 3))));
        var lado = o.lado || 640, k = lado / Math.max(vw, vh), fw = Math.round(vw * k), fh = Math.round(vh * k);
        var cols = Math.ceil(Math.sqrt(n * fh / fw)); if (cols > n) cols = n;
        while (cols * fw > 8000) cols--;
        var filas = Math.ceil(n / cols);
        while (filas * fh > 8000) { lado -= 40; k = lado / Math.max(vw, vh); fw = Math.round(vw * k); fh = Math.round(vh * k); cols = Math.ceil(Math.sqrt(n * fh / fw)); filas = Math.ceil(n / cols); }
        var c = document.createElement('canvas'); c.width = cols * fw; c.height = filas * fh;
        var x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
        var t = [], i = 0;
        function paso() {
          if (i >= n) {
            c.toBlob(function (b) {
              fin();
              if (!b) return mal({ error: 'No se pudo crear la vista 3D.' });
              ok({ blob: b, meta: { v: 1, modo: modo, n: n, cols: cols, fw: fw, fh: fh, dur: Math.round(dur * 100) / 100, t: t, ancho: vw, alto: vh } });
            }, 'image/jpeg', 0.82);
            return;
          }
          var ti = Math.min(dur - 0.05, (i + 0.5) * dur / n); t.push(Math.round(ti * 1000) / 1000);
          var hecho = false, seguro = setTimeout(function () { if (!hecho) { hecho = true; dibujar(); } }, 4000);
          v.onseeked = function () { if (hecho) return; hecho = true; clearTimeout(seguro); dibujar(); };
          v.currentTime = ti;
          function dibujar() {
            try { x.drawImage(v, (i % cols) * fw, Math.floor(i / cols) * fh, fw, fh); } catch (e) { fin(); return mal({ error: 'El navegador bloqueó la lectura del video.' }); }
            i++; if (prog) prog(i / n); setTimeout(paso, 0);
          }
        }
        var pp = v.play(); if (pp && pp.then) pp.then(function () { v.pause(); paso(); }, function () { paso(); }); else paso();
      };
      v.src = url;
    });
  }

  // ------------------------------------------------------------------
  // Utilidades comunes de marcas y barra
  // ------------------------------------------------------------------
  function barra(host, botones, etiqueta) {
    var b = document.createElement('div'); b.className = 'v3d-bar';
    b.innerHTML = botones.map(function (x) { return '<button type="button" class="v3d-b" data-a="' + x[0] + '" title="' + esc(x[2]) + '" aria-label="' + esc(x[2]) + '">' + ico(x[1]) + (x[3] ? '<span>' + esc(x[3]) + '</span>' : '') + '</button>'; }).join('') +
      (etiqueta ? '<span class="v3d-tag">' + esc(etiqueta) + '</span>' : '');
    host.appendChild(b); return b;
  }
  function panelFiltros(esc, alCambiar) {
    var f = document.createElement('div'); f.className = 'v3d-filtros'; f.hidden = true;
    f.innerHTML = '<label>Brillo<input type="range" min="50" max="180" value="100" data-f="brightness"></label><label>Contraste<input type="range" min="50" max="200" value="100" data-f="contrast"></label>' +
      '<label>Saturación<input type="range" min="0" max="200" value="100" data-f="saturate"></label><button type="button" class="v3d-b" data-f="reset" style="justify-self:end">Restablecer</button>';
    esc.appendChild(f);
    function aplicar() { alCambiar(['brightness', 'contrast', 'saturate'].map(function (k) { return k + '(' + f.querySelector('[data-f=' + k + ']').value + '%)'; }).join(' ')); }
    f.addEventListener('input', aplicar);
    f.querySelector('[data-f=reset]').onclick = function () { f.querySelectorAll('input').forEach(function (i) { i.value = 100; }); aplicar(); };
    return f;
  }
  function formMarca(esc, px, py, guardar) {
    var viejo = esc.querySelector('.v3d-form'); if (viejo) viejo.remove();
    var f = document.createElement('div'); f.className = 'v3d-form';
    var W = esc.clientWidth, H = esc.clientHeight;
    f.style.left = Math.max(8, Math.min(W - 258, px + 14)) + 'px'; f.style.top = Math.max(50, Math.min(H - 190, py - 20)) + 'px';
    f.innerHTML = '<select>' + TIPOS.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select><textarea maxlength="500" placeholder="Describa el hallazgo (ej. lesión de 3 cm en cara anterior de la pierna)"></textarea><div><button type="button" class="v3d-b" data-x>Cancelar</button><button type="button" class="v3d-b on" data-ok>Guardar hallazgo</button></div>';
    esc.appendChild(f);
    ['pointerdown', 'wheel', 'mousedown', 'touchstart'].forEach(function (ev) { f.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    setTimeout(function () { f.querySelector('textarea').focus(); }, 20);
    f.querySelector('[data-x]').onclick = function () { f.remove(); };
    f.querySelector('[data-ok]').onclick = function () {
      var tx = f.querySelector('textarea').value.trim(); if (!tx) { f.querySelector('textarea').focus(); return; }
      var b = this; b.disabled = true; b.textContent = 'Guardando…';
      Promise.resolve(guardar(f.querySelector('select').value, tx)).then(function () { f.remove(); }, function (e) { b.disabled = false; b.textContent = 'Guardar hallazgo'; alert((e && e.error) || 'No se pudo guardar.'); });
    };
  }
  function lado(host, o, marcas, ir, borrar) {
    var a = document.createElement('aside'); a.className = 'v3d-lado';
    host.appendChild(a);
    function pintar() {
      a.innerHTML = '<h4>Hallazgos (' + marcas.length + ')</h4><p>' + (o.puedeMarcar ? 'Use «Marcar» y toque el cuerpo para registrar un hallazgo en ese punto.' : 'Hallazgos registrados sobre esta vista.') + '</p>' +
        (marcas.length ? '<ul class="v3d-lista">' + marcas.map(function (m, i) {
          return '<li data-i="' + i + '"><i>' + (i + 1) + '</i><div><b>' + esc(m.tipo) + '</b>' + esc(m.texto) + '<small>' + esc(m.autor || '') + (m.cuando ? ' · ' + esc(m.cuando) : '') + (m.pos ? ' · ' + esc(m.pos) : '') + '</small></div>' +
            (o.puedeBorrar && o.puedeBorrar(m) ? '<button type="button" data-b="' + i + '" title="Eliminar hallazgo">×</button>' : '<span></span>') + '</li>';
        }).join('') + '</ul>' : '<div class="v3d-vacio">Sin hallazgos registrados.</div>');
      a.querySelectorAll('li').forEach(function (li) { li.onclick = function (e) { if (e.target.closest('[data-b]')) return; ir(marcas[+li.getAttribute('data-i')]); }; });
      a.querySelectorAll('[data-b]').forEach(function (b) { b.onclick = function () {
        var m = marcas[+b.getAttribute('data-b')];
        if (b.dataset.seguro !== '1') { b.dataset.seguro = '1'; b.textContent = '¿Borrar?'; b.style.fontSize = '11px'; return; }
        Promise.resolve(borrar(m)).then(function () { marcas.splice(marcas.indexOf(m), 1); pintar(); o._repintar && o._repintar(); });
      }; });
    }
    pintar();
    return pintar;
  }

  // ------------------------------------------------------------------
  // Visor de secuencia (giro 360° o recorrido)
  // o = { sprite, meta, video, titulo, marcas, puedeMarcar, onMarca(m)->Promise(m con id), onBorrar(m)->Promise,
  //       puedeBorrar(m)->bool, sinLado, onCambio(frac), onCaptura(blob) }
  // ------------------------------------------------------------------
  function secuencia(host, o) {
    var M = o.meta || {}, N = M.n || 1, es360 = M.modo === '360';
    host.innerHTML = '';
    var raiz = document.createElement('div'); raiz.className = 'v3d' + (o.sinLado ? ' sin-lado' : '');
    var esc = document.createElement('div'); esc.className = 'v3d-esc'; raiz.appendChild(esc); host.appendChild(raiz);
    var cv = document.createElement('canvas'); esc.appendChild(cv);
    var ctx = cv.getContext('2d');
    var carga = document.createElement('div'); carga.className = 'v3d-carga'; carga.textContent = 'Cargando vista 3D…'; esc.appendChild(carga);
    var marcas = (o.marcas || []).slice();
    var bar = barra(esc, [['auto', 'play', 'Girar automáticamente', ''], ['mas', 'mas', 'Acercar'], ['menos', 'menos', 'Alejar'], ['centro', 'centro', 'Ver completo'],
      ['mover', 'mano', 'Mover la imagen (en lugar de girar)', 'Mover'], ['filtro', 'filtro', 'Brillo y contraste', 'Imagen']]
      .concat(o.puedeMarcar ? [['marcar', 'marca', 'Marcar un hallazgo', 'Marcar']] : []).concat(o.onCaptura ? [['foto', 'foto', 'Guardar captura de esta vista']] : []),
      o.titulo || (es360 ? 'Giro 360°' : 'Recorrido del cuerpo'));
    var pie = document.createElement('div'); pie.className = 'v3d-pie';
    pie.innerHTML = '<div class="v3d-pista"><input type="range" min="0" max="' + (N - 1) + '" step="1" value="0" aria-label="' + (es360 ? 'Ángulo de giro' : 'Posición en el recorrido') + '"></div><span class="v3d-ang"></span>';
    esc.appendChild(pie);
    var rango = pie.querySelector('input'), ang = pie.querySelector('.v3d-ang'), pista = pie.querySelector('.v3d-pista');
    var ayuda = document.createElement('div'); ayuda.className = 'v3d-ayuda';
    ayuda.innerHTML = es360 ? 'Arrastre a los lados para <b>girar el cuerpo</b><br>Rueda o pellizco para acercar' : 'Arrastre a los lados para <b>recorrer el cuerpo</b><br>Rueda o pellizco para acercar';
    esc.appendChild(ayuda);
    var filtros = panelFiltros(esc, function (f) { cv.style.filter = f; });
    var pintarLado = o.sinLado ? function () {} : lado(raiz, o, marcas, function (m) { irA(m.frame); zoom = Math.max(zoom, 1.8); cx = m.x; cy = m.y; limitar(); marcaActiva = m; dibujar(); }, o.onBorrar);

    var img = new Image(), listo = false, frame = 0, fReal = 0, zoom = 1, cx = 0.5, cy = 0.5, marcando = false, mover = false, auto = null, vel = 0, marcaActiva = null;
    var hd = null, hdFrame = -1, hdTimer = null, capaMarcas = [];
    if (o.video) { hd = document.createElement('video'); hd.muted = true; hd.playsInline = true; hd.preload = 'auto'; hd.src = o.video; hd.onseeked = function () { hdFrame = frame; dibujar(true); }; }
    img.onload = function () { listo = true; carga.remove(); ajustar(); pintarPista(); dibujar(); if (o.inicial != null) irFrac(o.inicial); };
    img.onerror = function () { carga.textContent = 'No se pudo cargar la vista 3D.'; };
    img.src = o.sprite;

    function ajustar() { var r = esc.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = Math.max(1, Math.round(r.width * d)); cv.height = Math.max(1, Math.round(r.height * d)); dibujar(); }
    var ro = window.ResizeObserver ? new ResizeObserver(ajustar) : null; if (ro) ro.observe(esc); else window.addEventListener('resize', ajustar);

    // Rectángulo donde se dibuja el cuadro (object-fit: contain + zoom alrededor de cx, cy)
    function caja() {
      var W = cv.width, H = cv.height, k = Math.min(W / M.fw, H / M.fh) * zoom, w = M.fw * k, h = M.fh * k;
      return { x: W / 2 - cx * w, y: H / 2 - cy * h, w: w, h: h };
    }
    function limitar() { if (zoom <= 1) { cx = 0.5; cy = 0.5; return; } var m = 0.5 / zoom; cx = Math.max(m, Math.min(1 - m, cx)); cy = Math.max(m, Math.min(1 - m, cy)); }
    function dibujar(conHd) {
      if (!listo) return;
      var W = cv.width, H = cv.height, b = caja();
      ctx.fillStyle = '#0d1a13'; ctx.fillRect(0, 0, W, H);
      ctx.imageSmoothingQuality = 'high';
      if (conHd && hd && hdFrame === frame && hd.readyState >= 2) ctx.drawImage(hd, b.x, b.y, b.w, b.h);
      else ctx.drawImage(img, (frame % M.cols) * M.fw, Math.floor(frame / M.cols) * M.fh, M.fw, M.fh, b.x, b.y, b.w, b.h);
      rango.value = frame;
      ang.textContent = es360 ? Math.round(frame / N * 360) + '°' : Math.round(frame / Math.max(1, N - 1) * 100) + '%';
      ponerMarcas(b);
      if (!conHd) pedirHd();
    }
    function pedirHd() {
      if (!hd) return; clearTimeout(hdTimer);
      hdTimer = setTimeout(function () { if (auto) return; var t = (M.t && M.t[frame] != null) ? M.t[frame] : (frame + 0.5) * M.dur / N; if (hd.readyState >= 1) { hdFrame = -1; hd.currentTime = t; } }, 260);
    }
    function distancia(a, b) { var d = Math.abs(a - b); return es360 ? Math.min(d, N - d) : d; }
    function ponerMarcas(b) {
      capaMarcas.forEach(function (e) { e.remove(); }); capaMarcas = [];
      var d = window.devicePixelRatio || 1, tol = Math.max(1, Math.round(N / (es360 ? 36 : 30)));
      marcas.forEach(function (m, i) {
        var dd = distancia(m.frame, frame); if (dd > tol * 2) return;
        var e = document.createElement('button'); e.type = 'button'; e.className = 'v3d-marca' + (dd > tol ? ' lejos' : '') + (m === marcaActiva ? ' activa' : '');
        e.textContent = i + 1; e.setAttribute('data-t', m.tipo + ': ' + m.texto); e.title = m.tipo + ': ' + m.texto;
        e.style.left = (b.x + m.x * b.w) / d + 'px'; e.style.top = (b.y + m.y * b.h) / d + 'px';
        e.onclick = function (ev) { ev.stopPropagation(); marcaActiva = m; irA(m.frame); };
        e.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); });
        esc.appendChild(e); capaMarcas.push(e);
      });
    }
    function pintarPista() {
      pista.querySelectorAll('.v3d-punto').forEach(function (p) { p.remove(); });
      marcas.forEach(function (m) { var p = document.createElement('span'); p.className = 'v3d-punto'; p.style.left = (m.frame / Math.max(1, N - 1) * 100) + '%'; pista.appendChild(p); });
    }
    o._repintar = function () { pintarPista(); dibujar(); };
    function irA(f, silencio) {
      f = Math.round(f); f = es360 ? ((f % N) + N) % N : Math.max(0, Math.min(N - 1, f));
      if (f === frame && fReal === f) return;
      frame = f; fReal = f; dibujar(); if (!silencio && o.onCambio) o.onCambio(frame / Math.max(1, N - 1));
    }
    function irFrac(fr) { irA(fr * (N - 1), true); }

    // Arrastre, inercia, zoom
    var punteros = {}, ini = null, pinch = null, ultimo = null;
    function quitarAyuda() { if (ayuda.parentNode) { ayuda.style.opacity = 0; setTimeout(function () { ayuda.remove(); }, 500); } }
    esc.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.v3d-bar,.v3d-pie,.v3d-filtros,.v3d-form')) return;
      quitarAyuda(); pararAuto();
      if (marcando) {
        var r = esc.getBoundingClientRect(), d = window.devicePixelRatio || 1, b = caja();
        var px = (e.clientX - r.left) * d, py = (e.clientY - r.top) * d, nx = (px - b.x) / b.w, ny = (py - b.y) / b.h;
        if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;
        var fm = frame;
        formMarca(esc, e.clientX - r.left, e.clientY - r.top, function (tipo, texto) {
          var m = { frame: fm, x: Math.round(nx * 10000) / 10000, y: Math.round(ny * 10000) / 10000, tipo: tipo, texto: texto };
          return Promise.resolve(o.onMarca ? o.onMarca(m) : m).then(function (g) { marcas.push(Object.assign(m, g || {})); pintarLado(); pintarPista(); dibujar(); });
        });
        return;
      }
      esc.setPointerCapture(e.pointerId); punteros[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(punteros);
      if (ids.length === 2) { var a = punteros[ids[0]], bb = punteros[ids[1]]; pinch = { d: Math.hypot(a.x - bb.x, a.y - bb.y), z: zoom }; ini = null; }
      else { ini = { x: e.clientX, y: e.clientY, f: fReal, cx: cx, cy: cy, pan: mover || e.button === 2 || e.shiftKey }; ultimo = { x: e.clientX, t: performance.now() }; vel = 0; esc.classList.add('arrastra'); }
    });
    esc.addEventListener('pointermove', function (e) {
      if (!punteros[e.pointerId]) return;
      punteros[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(punteros);
      if (pinch && ids.length === 2) { var a = punteros[ids[0]], bb = punteros[ids[1]]; zoom = Math.max(1, Math.min(6, pinch.z * Math.hypot(a.x - bb.x, a.y - bb.y) / pinch.d)); limitar(); dibujar(); return; }
      if (!ini) return;
      var r = esc.getBoundingClientRect(), dx = e.clientX - ini.x, dy = e.clientY - ini.y;
      if (ini.pan && zoom > 1) { var b = caja(), d = window.devicePixelRatio || 1; cx = ini.cx - dx * d / b.w; cy = ini.cy - dy * d / b.h; limitar(); dibujar(); return; }
      var paso = N / (r.width * (es360 ? 1 : 0.9));
      fReal = ini.f - dx * paso; irA(fReal);
      var t = performance.now(); if (t - ultimo.t > 0) { vel = (e.clientX - ultimo.x) / (t - ultimo.t); ultimo = { x: e.clientX, t: t }; }
    });
    function soltar(e) {
      delete punteros[e.pointerId]; esc.classList.remove('arrastra');
      if (Object.keys(punteros).length < 2) pinch = null;
      if (ini && !ini.pan && Math.abs(vel) > 0.25) inercia(-vel * N / (esc.clientWidth || 600));
      ini = null;
    }
    esc.addEventListener('pointerup', soltar); esc.addEventListener('pointercancel', soltar);
    esc.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    function inercia(v) {
      var ult = performance.now();
      (function paso() {
        if (Math.abs(v) < 0.002 || ini) return;
        var t = performance.now(), dt = t - ult; ult = t;
        fReal += v * dt; v *= Math.pow(0.992, dt);
        if (!es360 && (fReal <= 0 || fReal >= N - 1)) { irA(fReal); return; }
        irA(fReal); requestAnimationFrame(paso);
      })();
    }
    esc.addEventListener('wheel', function (e) {
      e.preventDefault(); quitarAyuda();
      var r = esc.getBoundingClientRect(), d = window.devicePixelRatio || 1, b = caja();
      var px = (e.clientX - r.left) * d, py = (e.clientY - r.top) * d, nx = (px - b.x) / b.w, ny = (py - b.y) / b.h;
      var z0 = zoom; zoom = Math.max(1, Math.min(6, zoom * Math.exp(-e.deltaY * 0.0015)));
      if (zoom !== z0 && nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) { cx = nx + (cx - nx) * z0 / zoom; cy = ny + (cy - ny) * z0 / zoom; }
      limitar(); dibujar();
    }, { passive: false });
    esc.addEventListener('dblclick', function (e) {
      if (marcando) return;
      var r = esc.getBoundingClientRect(), d = window.devicePixelRatio || 1, b = caja();
      var nx = ((e.clientX - r.left) * d - b.x) / b.w, ny = ((e.clientY - r.top) * d - b.y) / b.h;
      if (zoom > 1.5) { zoom = 1; } else { zoom = 2.5; cx = nx; cy = ny; } limitar(); dibujar();
    });
    rango.addEventListener('input', function () { pararAuto(); quitarAyuda(); fReal = +rango.value; irA(fReal); });
    raiz.tabIndex = 0;
    raiz.addEventListener('keydown', function (e) {
      if (e.target.closest('textarea,select,input')) return;
      if (e.key === 'ArrowLeft') { irA(frame - 1); e.preventDefault(); } else if (e.key === 'ArrowRight') { irA(frame + 1); e.preventDefault(); }
      else if (e.key === '+' || e.key === '=') { zoom = Math.min(6, zoom * 1.25); limitar(); dibujar(); } else if (e.key === '-') { zoom = Math.max(1, zoom / 1.25); limitar(); dibujar(); }
    });

    function pararAuto() { if (auto) { cancelAnimationFrame(auto); auto = null; var b = bar.querySelector('[data-a=auto]'); b.classList.remove('on'); b.innerHTML = ico('play'); } }
    function iniciarAuto() {
      var b = bar.querySelector('[data-a=auto]'); b.classList.add('on'); b.innerHTML = ico('pausa');
      var ult = performance.now(), dir = 1;
      (function paso() {
        var t = performance.now(), dt = t - ult; ult = t;
        fReal += dir * dt * N / (es360 ? 9000 : 7000);
        if (!es360) { if (fReal >= N - 1) { fReal = N - 1; dir = -1; } if (fReal <= 0) { fReal = 0; dir = 1; } }
        irA(fReal); auto = requestAnimationFrame(paso);
      })();
    }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return; var a = b.getAttribute('data-a'); quitarAyuda();
      if (a === 'auto') { if (auto) pararAuto(); else iniciarAuto(); }
      else if (a === 'mas') { zoom = Math.min(6, zoom * 1.35); limitar(); dibujar(); }
      else if (a === 'menos') { zoom = Math.max(1, zoom / 1.35); limitar(); dibujar(); }
      else if (a === 'centro') { zoom = 1; limitar(); dibujar(); }
      else if (a === 'mover') { mover = !mover; b.classList.toggle('on', mover); esc.classList.toggle('moviendo', mover); if (mover && zoom === 1) { zoom = 1.8; limitar(); dibujar(); } }
      else if (a === 'filtro') { filtros.hidden = !filtros.hidden; b.classList.toggle('on', !filtros.hidden); }
      else if (a === 'marcar') { marcando = !marcando; b.classList.toggle('on', marcando); esc.classList.toggle('marcando', marcando); pararAuto(); }
      else if (a === 'foto') {
        var c2 = document.createElement('canvas'), bx = caja(); c2.width = cv.width; c2.height = cv.height; var x2 = c2.getContext('2d');
        x2.filter = cv.style.filter || 'none'; x2.drawImage(cv, 0, 0);
        c2.toBlob(function (bl) { o.onCaptura(bl, frame); }, 'image/jpeg', 0.92);
      }
    });

    return {
      irFrac: irFrac, frame: function () { return frame; },
      destruir: function () { pararAuto(); if (ro) ro.disconnect(); if (hd) { hd.removeAttribute('src'); hd.load(); } host.innerHTML = ''; }
    };
  }

  // ------------------------------------------------------------------
  // Visor de modelo 3D (.glb) con Three.js
  // ------------------------------------------------------------------
  function modelo(host, o) {
    host.innerHTML = '';
    var raiz = document.createElement('div'); raiz.className = 'v3d' + (o.sinLado ? ' sin-lado' : '');
    var esc = document.createElement('div'); esc.className = 'v3d-esc'; raiz.appendChild(esc); host.appendChild(raiz);
    var carga = document.createElement('div'); carga.className = 'v3d-carga'; carga.textContent = 'Cargando modelo 3D…'; esc.appendChild(carga);
    if (!window.THREE || !THREE.GLTFLoader) { carga.textContent = 'El visor de modelos 3D no está disponible.'; return { destruir: function () { host.innerHTML = ''; } }; }
    var marcas = (o.marcas || []).slice(), marcando = false, capa = [], marcaActiva = null;
    var bar = barra(esc, [['auto', 'play', 'Girar automáticamente'], ['centro', 'centro', 'Vista inicial']].concat(o.cuerpo ? [['vistas', 'ejes', 'Vistas y rotación en todos los ejes', 'Vistas']] : []).concat([['filtro', 'filtro', 'Brillo y contraste', 'Imagen']])
      .concat(o.puedeMarcar ? [['marcar', 'marca', 'Marcar un hallazgo', 'Marcar']] : []).concat(o.onCaptura ? [['foto', 'foto', 'Guardar captura de esta vista']] : []), o.titulo || 'Modelo 3D');
    var ayuda = document.createElement('div'); ayuda.className = 'v3d-ayuda'; ayuda.innerHTML = 'Arrastre para <b>girar en 3D</b> · clic derecho para mover<br>Rueda o pellizco para acercar' + (o.cuerpo ? '<br>«Vistas» para frente, espalda, lados, cabeza y pies, o rotar el cuerpo en cualquier eje' : ''); esc.appendChild(ayuda);
    var vistas = null;
    if (o.cuerpo) {
      vistas = document.createElement('div'); vistas.className = 'v3d-vistas'; vistas.hidden = true;
      vistas.innerHTML = '<h6>Ver desde</h6><div><button type="button" class="v3d-b" data-v="frente">Frente</button><button type="button" class="v3d-b" data-v="espalda">Espalda</button><button type="button" class="v3d-b" data-v="arriba">Cabeza</button>' +
        '<button type="button" class="v3d-b" data-v="der">Lado der.</button><button type="button" class="v3d-b" data-v="izq">Lado izq.</button><button type="button" class="v3d-b" data-v="abajo">Pies</button></div>' +
        '<h6>Rotar el cuerpo 90°</h6><div><button type="button" class="v3d-b" data-r="x" title="Inclinar hacia adelante (eje transversal)">↻ X</button><button type="button" class="v3d-b" data-r="y" title="Girar sobre su eje vertical">↻ Y</button><button type="button" class="v3d-b" data-r="z" title="Rodar de lado (eje frontal)">↻ Z</button></div>' +
        '<div><button type="button" class="v3d-b" data-r="prono" style="grid-column:span 2">Boca abajo / arriba</button><button type="button" class="v3d-b" data-r="0">Restablecer</button></div>';
      esc.appendChild(vistas);
      ['pointerdown', 'wheel'].forEach(function (ev) { vistas.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    }
    var r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    r.outputEncoding = THREE.sRGBEncoding; r.setClearColor(0x0d1a13); esc.insertBefore(r.domElement, esc.firstChild);
    var filtros = panelFiltros(esc, function (f) { r.domElement.style.filter = f; });
    var sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    sc.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.1)); var dl = new THREE.DirectionalLight(0xffffff, 0.9); dl.position.set(2, 4, 3); sc.add(dl);
    var dl2 = new THREE.DirectionalLight(0xffffff, 0.4); dl2.position.set(-3, 2, -2); sc.add(dl2);
    var ctl = new THREE.OrbitControls(cam, r.domElement); ctl.enableDamping = true; ctl.dampingFactor = 0.08;
    var raiz3 = new THREE.Group(), inicial = null; sc.add(raiz3);
    var pintarLado = o.sinLado ? function () {} : lado(raiz, o, marcas, function (m) { marcaActiva = m; var p = raiz3.localToWorld(new THREE.Vector3(m.x, m.y, m.z)); ctl.target.copy(p); cam.position.copy(p.clone().add(new THREE.Vector3(0, 0.3, 0.9))); }, o.onBorrar);
    o._repintar = function () {};
    function ajustar() { var b = esc.getBoundingClientRect(); r.setSize(b.width, b.height, false); r.domElement.style.width = '100%'; r.domElement.style.height = '100%'; cam.aspect = b.width / Math.max(1, b.height); cam.updateProjectionMatrix(); }
    var ro = window.ResizeObserver ? new ResizeObserver(ajustar) : null; if (ro) ro.observe(esc);
    ajustar();
    // Carga el modelo: datos ya descargados (ArrayBuffer) o una dirección, con direcciones alternas si la primera falla.
    function cargarModelo(ok, mal) {
      var L = new THREE.GLTFLoader();
      if (o.src && typeof o.src !== 'string') { try { L.parse(o.src, '', ok, mal); } catch (e) { mal(e); } return; }
      var lista = [o.src].concat(o.alternas || []);
      (function intento(i) { L.load(lista[i], ok, undefined, function (e) { if (i + 1 < lista.length) intento(i + 1); else mal(e); }); })(0);
    }
    cargarModelo(function (g) {
      var obj = g.scene; var box = new THREE.Box3().setFromObject(obj), s = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
      var k = 2 / Math.max(s.x, s.y, s.z); obj.scale.setScalar(k); obj.position.copy(c.multiplyScalar(-k)); raiz3.add(obj);
      if (o.cuerpo) cam.position.set(0, 0.15, 3.4); else cam.position.set(0, 0.6, 2.8); ctl.target.set(0, 0, 0); ctl.update(); inicial = cam.position.clone();
      carga.remove();
    }, function () { carga.textContent = 'No se pudo abrir el modelo 3D (.glb).'; });
    var vivo = true, auto = false, anim = null;
    // Transición suave de cámara y orientación del cuerpo.
    function animar(pos, rot) {
      var p0 = cam.position.clone(), t0 = ctl.target.clone(), q0 = raiz3.quaternion.clone(), q1 = rot || q0, ini = performance.now();
      anim = function (t) {
        var k = Math.min(1, (t - ini) / 450), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        if (pos) { cam.position.lerpVectors(p0, pos, e); ctl.target.lerpVectors(t0, new THREE.Vector3(0, 0, 0), e); }
        raiz3.quaternion.copy(q0).slerp(q1, e);
        if (k >= 1) anim = null;
      };
    }
    function verDesde(v) {
      var D = cam.position.distanceTo(ctl.target) || 3.4, P = { frente: [0, 0, D], espalda: [0, 0, -D], der: [-D, 0, 0], izq: [D, 0, 0], arriba: [0, D, 0.002], abajo: [0, -D, 0.002] }[v];
      if (P) animar(new THREE.Vector3(P[0], P[1], P[2]));
    }
    function rotar(eje) {
      if (eje === '0') { animar(inicial ? inicial.clone() : null, new THREE.Quaternion()); return; }
      var ax = eje === 'prono' ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(eje === 'x' ? 1 : 0, eje === 'y' ? 1 : 0, eje === 'z' ? 1 : 0);
      var q = new THREE.Quaternion().setFromAxisAngle(ax, eje === 'prono' ? Math.PI : Math.PI / 2).multiply(raiz3.quaternion);
      animar(null, q);
    }
    if (vistas) vistas.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return; if (ayuda.parentNode) ayuda.remove();
      if (b.dataset.v) verDesde(b.dataset.v); else if (b.dataset.r) rotar(b.dataset.r);
    });
    (function bucle() {
      if (!vivo) return; requestAnimationFrame(bucle);
      if (anim) anim(performance.now());
      if (auto) raiz3.rotation.y += 0.006;
      ctl.update(); r.render(sc, cam);
      capa.forEach(function (e) { e.remove(); }); capa = [];
      var w = r.domElement.clientWidth, h = r.domElement.clientHeight;
      marcas.forEach(function (m, i) {
        var p = new THREE.Vector3(m.x, m.y, m.z); raiz3.localToWorld(p); var dist = p.distanceTo(cam.position); p.project(cam);
        if (p.z > 1) return;
        var e = document.createElement('button'); e.type = 'button'; e.className = 'v3d-marca' + (m === marcaActiva ? ' activa' : ''); e.textContent = i + 1; e.setAttribute('data-t', m.tipo + ': ' + m.texto);
        e.style.left = (p.x * 0.5 + 0.5) * w + 'px'; e.style.top = (-p.y * 0.5 + 0.5) * h + 'px'; e.style.opacity = o.cuerpo ? (dist <= cam.position.distanceTo(ctl.target) + 0.05 ? 1 : 0.4) : Math.max(0.35, Math.min(1, 3.2 - dist));
        e.onclick = function () { marcaActiva = m; };
        esc.appendChild(e); capa.push(e);
      });
    })();
    r.domElement.addEventListener('pointerdown', function (e) {
      if (ayuda.parentNode) ayuda.remove();
      if (!marcando) return;
      var b = r.domElement.getBoundingClientRect(), v = new THREE.Vector2((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1);
      var rc = new THREE.Raycaster(); rc.setFromCamera(v, cam); var hit = rc.intersectObject(raiz3, true)[0]; if (!hit) return;
      var lp = raiz3.worldToLocal(hit.point.clone());
      formMarca(esc, e.clientX - b.left, e.clientY - b.top, function (tipo, texto) {
        var m = { frame: 0, x: +lp.x.toFixed(4), y: +lp.y.toFixed(4), z: +lp.z.toFixed(4), tipo: tipo, texto: texto };
        return Promise.resolve(o.onMarca ? o.onMarca(m) : m).then(function (gg) { marcas.push(Object.assign(m, gg || {})); pintarLado(); });
      });
    });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return; var a = b.getAttribute('data-a');
      if (a === 'auto') { auto = !auto; b.classList.toggle('on', auto); b.innerHTML = ico(auto ? 'pausa' : 'play'); }
      else if (a === 'centro') { if (o.cuerpo) rotar('0'); else { raiz3.rotation.set(0, 0, 0); if (inicial) cam.position.copy(inicial); ctl.target.set(0, 0, 0); } }
      else if (a === 'vistas') { vistas.hidden = !vistas.hidden; b.classList.toggle('on', !vistas.hidden); }
      else if (a === 'filtro') { filtros.hidden = !filtros.hidden; b.classList.toggle('on', !filtros.hidden); }
      else if (a === 'marcar') { marcando = !marcando; ctl.enabled = !marcando; b.classList.toggle('on', marcando); esc.classList.toggle('marcando', marcando); }
      else if (a === 'foto') { r.domElement.toBlob(function (bl) { o.onCaptura(bl, 0); }, 'image/jpeg', 0.92); }
    });
    return { destruir: function () { vivo = false; if (ro) ro.disconnect(); r.dispose(); host.innerHTML = ''; } };
  }

  // ------------------------------------------------------------------
  // Comparación lado a lado (ej. ingreso vs. salida) sincronizada
  // ------------------------------------------------------------------
  function comparar(host, a, b) {
    host.innerHTML = '<div class="v3d-par"><div><h5>' + esc(a.rotulo) + '</h5><div class="v3d-a" style="flex:1;min-height:0"></div></div><div><h5>' + esc(b.rotulo) + '</h5><div class="v3d-b2" style="flex:1;min-height:0"></div></div></div>';
    var va, vb, bloqueo = false;
    va = secuencia(host.querySelector('.v3d-a'), Object.assign({}, a, { sinLado: true, onCambio: function (f) { if (bloqueo || !vb) return; bloqueo = true; vb.irFrac(f); bloqueo = false; } }));
    vb = secuencia(host.querySelector('.v3d-b2'), Object.assign({}, b, { sinLado: true, onCambio: function (f) { if (bloqueo || !va) return; bloqueo = true; va.irFrac(f); bloqueo = false; } }));
    return { destruir: function () { va.destruir(); vb.destruir(); host.innerHTML = ''; } };
  }

  // Extrae un cuadro de la secuencia como imagen (para informes / PDF)
  function cuadro(spriteUrl, meta, frac, ancho) {
    return new Promise(function (ok) {
      var i = new Image(); i.crossOrigin = 'anonymous';
      i.onload = function () {
        var f = Math.round(frac * (meta.n - 1)), w = ancho || meta.fw, h = Math.round(w * meta.fh / meta.fw), c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(i, (f % meta.cols) * meta.fw, Math.floor(f / meta.cols) * meta.fh, meta.fw, meta.fh, 0, 0, w, h);
        ok(c.toDataURL('image/jpeg', 0.86));
      };
      i.onerror = function () { ok(null); }; i.src = spriteUrl;
    });
  }

  window.Visor3D = { generar: generar, secuencia: secuencia, modelo: modelo, comparar: comparar, cuadro: cuadro, TIPOS: TIPOS };
})();
