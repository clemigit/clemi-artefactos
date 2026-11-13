/* =====================================================================
   CLEMI · Vista 3D de la sala (Three.js)
   Unidades en metros. Plano: x → X, y → Z. El borde inferior del plano
   (punto de vista de la foto) queda hacia la cámara inicial.
   ===================================================================== */
(function () {
  'use strict';
  var ALTO_PARED = 2.8, GROSOR = 0.14;

  function textura(dib, w, h, rx, ry) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; dib(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rx) t.repeat.set(rx, ry);
    t.anisotropy = 4; return t;
  }
  function terrazo(ctx, w, h) {
    ctx.fillStyle = '#e4dfd4'; ctx.fillRect(0, 0, w, h);
    var s = 11; function r() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    var cols = ['#a39b8d', '#7f796f', '#c7bba6', '#6f6d69', '#b59f78', '#8e8a83', '#f4f1ea'];
    for (var i = 0; i < 2200; i++) { ctx.fillStyle = cols[Math.floor(r() * cols.length)]; ctx.beginPath(); ctx.arc(r() * w, r() * h, 0.6 + r() * 2.4, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(140,146,138,.7)'; ctx.lineWidth = 3; ctx.strokeRect(0, 0, w, h);
  }
  function rejilla(ctx, w, h) {
    ctx.fillStyle = '#5c645d'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#2f3530';
    for (var y = 4; y < h; y += 10) ctx.fillRect(3, y, w - 6, 5);
  }
  function etiqueta(texto) {
    var c = document.createElement('canvas'), x = c.getContext('2d'); c.width = 512; c.height = 128;
    x.font = 'bold 54px "Source Sans 3", Segoe UI, sans-serif'; var tw = Math.min(480, x.measureText(texto).width + 48);
    x.fillStyle = 'rgba(17,42,29,.88)'; var r = 26, x0 = (512 - tw) / 2;
    x.beginPath(); x.moveTo(x0 + r, 24); x.arcTo(x0 + tw, 24, x0 + tw, 104, r); x.arcTo(x0 + tw, 104, x0, 104, r); x.arcTo(x0, 104, x0, 24, r); x.arcTo(x0, 24, x0 + tw, 24, r); x.fill();
    x.fillStyle = '#E8C25B'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(texto, 256, 66, 460);
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false, transparent: true }));
    sp.scale.set(1.5, 0.375, 1); sp.renderOrder = 10; return sp;
  }

  // Materiales reutilizables
  function mats() {
    var M = function (c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6, metalness: 0.05 }, o || {})); };
    return {
      acero: M(0xc9ced0, { metalness: 0.75, roughness: 0.28 }), aceroOsc: M(0x7d858a, { metalness: 0.6, roughness: 0.35 }),
      caucho: M(0x2a2e2c, { roughness: 0.9 }), piel: M(0xd9c2a0, { roughness: 0.75 }), blanco: M(0xf4f4f1, { roughness: 0.7 }),
      pantalla: M(0x0e1a22, { roughness: 0.2, metalness: 0.3, emissive: 0x0b2a45, emissiveIntensity: 0.6 }),
      pared: M(0xf2f0ea, { roughness: 0.92, transparent: true }), vidrio: M(0xbfe0ee, { roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.55 }),
      marco: M(0xd8dcda, { metalness: 0.4, roughness: 0.4 }), oro: M(0xc6a13b, { metalness: 0.7, roughness: 0.3 }),
      negro: M(0x1b1f1d, { roughness: 0.4 }), rojo: M(0xb23a3a, { roughness: 0.5 })
    };
  }
  function caja(w, h, d, m) { var o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.castShadow = true; o.receiveShadow = true; return o; }
  function cil(rt, rb, h, m, seg) { var o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), m); o.castShadow = true; o.receiveShadow = true; return o; }
  function colorMat(hex, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: new THREE.Color(hex), roughness: 0.55, metalness: 0.08 }, o || {})); }

  // --------------------------------------------------------------- modelos
  function modelo(c, M, nombre) {
    var g = new THREE.Group(), L = c.ancho / 100, A = c.largo / 100, col = c.color || '#7A8B80', n = (nombre || c.nombre || '').toLowerCase();
    switch (c.forma) {
      case 'camilla': case 'camilla_cuerpo': {
        var alto = 0.86;
        var marco = caja(L, 0.07, A, M.acero); marco.position.y = alto; g.add(marco);
        var colch = caja(L - 0.06, 0.08, A - 0.06, colorMat(col, { roughness: 0.8 })); colch.position.y = alto + 0.075; g.add(colch);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) {
          var pata = cil(0.025, 0.025, alto - 0.08, M.acero); pata.position.set(p[0] * (L / 2 - 0.08), (alto - 0.08) / 2 + 0.08, p[1] * (A / 2 - 0.06)); g.add(pata);
          var rueda = cil(0.05, 0.05, 0.04, M.caucho); rueda.rotation.x = Math.PI / 2; rueda.position.set(p[0] * (L / 2 - 0.08), 0.05, p[1] * (A / 2 - 0.06)); g.add(rueda);
        });
        var barra = caja(L - 0.3, 0.03, 0.03, M.acero); barra.position.y = 0.3; g.add(barra);
        if (c.forma === 'camilla_cuerpo') {
          var top = alto + 0.12, x0 = -L / 2 + 0.2;
          var cab = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 16), M.piel); cab.scale.set(1.1, 0.9, 0.95); cab.position.set(x0, top + 0.09, 0); cab.castShadow = true; g.add(cab);
          var tLen = L - 0.62, torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, tLen, 24), M.piel);
          torso.rotation.z = Math.PI / 2; torso.scale.set(1, 1, 0.6); torso.position.set(x0 + 0.17 + tLen / 2, top + 0.09, 0); torso.castShadow = true; g.add(torso);
          // sábana quirúrgica sobre la mitad inferior
          var sab = caja(L * 0.52, 0.05, A - 0.02, colorMat(col, { roughness: 0.9 })); sab.position.set(L * 0.18, top + 0.2, 0); g.add(sab);
          var caida = caja(L * 0.52, 0.28, 0.02, colorMat(col, { roughness: 0.9 })); caida.position.set(L * 0.18, top + 0.06, A / 2 - 0.005); g.add(caida);
          var caida2 = caida.clone(); caida2.position.z = -A / 2 + 0.005; g.add(caida2);
        }
        break;
      }
      case 'mesa': {
        var h = 0.9, tapa = caja(L, 0.04, A, M.acero); tapa.position.y = h; g.add(tapa);
        var campo = caja(L - 0.02, 0.012, A - 0.02, colorMat(n.indexOf('mayo') >= 0 ? '#3a5fb0' : '#3b61b5', { roughness: 0.95 })); campo.position.y = h + 0.027; g.add(campo);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { var pata = cil(0.018, 0.018, h, M.acero); pata.position.set(p[0] * (L / 2 - 0.05), h / 2, p[1] * (A / 2 - 0.05)); g.add(pata); });
        for (var k = 0; k < Math.max(3, Math.round(L * 7)); k++) {
          var ins = cil(0.006, 0.006, Math.min(A * 0.6, 0.24), M.acero, 8); ins.rotation.x = Math.PI / 2; ins.rotation.z = (k % 3 - 1) * 0.15;
          ins.position.set(-L / 2 + 0.08 + k * (L - 0.16) / Math.max(2, Math.round(L * 7) - 1), h + 0.04, (k % 2 ? -1 : 1) * A * 0.12); g.add(ins);
        }
        if (n.indexOf('mayo') >= 0) { var poste = cil(0.03, 0.03, h, M.acero); poste.position.set(-L / 2 + 0.06, h / 2, 0); g.add(poste); }
        break;
      }
      case 'torre': {
        var cuerpo = caja(L, 1.45, A, colorMat(col, { metalness: 0.3, roughness: 0.4 })); cuerpo.position.y = 0.1 + 0.725; g.add(cuerpo);
        for (var e = 0; e < 4; e++) { var eq = caja(L - 0.06, 0.16, 0.02, M.negro); eq.position.set(0, 0.35 + e * 0.28, A / 2 + 0.005); g.add(eq);
          var led = caja(0.03, 0.03, 0.01, colorMat('#7fe0a0', { emissive: 0x3fbf70, emissiveIntensity: 0.9 })); led.position.set(L / 2 - 0.08, 0.35 + e * 0.28, A / 2 + 0.018); g.add(led); }
        var pie = cil(0.02, 0.02, 0.28, M.aceroOsc); pie.position.y = 1.69; g.add(pie);
        var mon = caja(0.62, 0.4, 0.05, M.negro); mon.position.y = 1.98; g.add(mon);
        var scr = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.34), M.pantalla); scr.position.set(0, 1.98, 0.027); g.add(scr);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { var r = cil(0.04, 0.04, 0.04, M.caucho); r.rotation.x = Math.PI / 2; r.position.set(p[0] * (L / 2 - 0.05), 0.04, p[1] * (A / 2 - 0.05)); g.add(r); });
        break;
      }
      case 'monitor': {
        var base = caja(L * 0.8, 0.06, A * 0.8, M.aceroOsc); base.position.y = 0.08; g.add(base);
        var palo = cil(0.025, 0.025, 1.3, M.acero); palo.position.y = 0.75; g.add(palo);
        var m2 = caja(0.7, 0.45, 0.05, colorMat(col, { metalness: 0.3 })); m2.position.y = 1.5; g.add(m2);
        var s2 = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.39), M.pantalla); s2.position.set(0, 1.5, 0.027); g.add(s2);
        break;
      }
      case 'arco': {
        var bw = L * 0.3, b = caja(bw, 1.0, A, colorMat(col, { metalness: 0.3 })); b.position.set(L / 2 - bw / 2, 0.55, 0); g.add(b);
        var rad = Math.min(0.75, L * 0.35), arc = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.07, 14, 40, Math.PI), colorMat('#d9dcd8', { metalness: 0.4, roughness: 0.35 }));
        arc.rotation.z = Math.PI / 2; arc.position.set(L / 2 - bw - rad * 0.2, 1.05, 0); arc.castShadow = true; g.add(arc);
        var brazo = caja(rad * 1.4, 0.1, 0.12, M.acero); brazo.position.set(L / 2 - bw - rad * 0.55, 1.05, 0); g.add(brazo);
        var emisor = cil(0.14, 0.14, 0.14, M.aceroOsc); emisor.position.set(L / 2 - bw - rad * 0.2, 1.05 - rad, 0); g.add(emisor);
        var det = cil(0.18, 0.18, 0.08, M.aceroOsc); det.position.set(L / 2 - bw - rad * 0.2, 1.05 + rad, 0); g.add(det);
        break;
      }
      case 'persona': {
        var ini = window.Plano && window.Plano.inicialPersona ? window.Plano.inicialPersona(c.nombre) : 'P', esDoc = ini === 'D';
        var ropa = colorMat(col, { roughness: 0.85 }), bata = colorMat('#f4f4f1', { roughness: 0.8 }), piel = M.piel;
        var s0 = Math.min(L, A) / 0.55; // escala según el tamaño del catálogo
        var pers = new THREE.Group();
        [-1, 1].forEach(function (k) {
          var pierna = cil(0.075, 0.065, 0.82, ropa); pierna.position.set(k * 0.1, 0.41, 0); pers.add(pierna);
          var zap = caja(0.11, 0.07, 0.22, colorMat('#e9ecea')); zap.position.set(k * 0.1, 0.035, 0.04); pers.add(zap);
          var brazo = cil(0.055, 0.05, 0.62, esDoc ? bata : ropa); brazo.position.set(k * 0.26, 1.12, 0.03); brazo.rotation.z = k * 0.12; brazo.rotation.x = -0.25; pers.add(brazo);
          var mano = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), piel); mano.position.set(k * 0.3, 0.83, 0.1); pers.add(mano);
        });
        var torso = cil(0.2, 0.17, 0.62, esDoc ? bata : ropa); torso.position.y = 1.13; torso.scale.z = 0.7; pers.add(torso);
        if (esDoc) { var pijama = caja(0.16, 0.5, 0.02, ropa); pijama.position.set(0, 1.15, 0.13); pers.add(pijama); }
        var cuello = cil(0.05, 0.05, 0.08, piel); cuello.position.y = 1.48; pers.add(cuello);
        var cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 16), piel); cabeza.position.y = 1.61; cabeza.castShadow = true; pers.add(cabeza);
        var gorro = new THREE.Mesh(new THREE.SphereGeometry(0.122, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), ropa); gorro.position.y = 1.62; pers.add(gorro);
        if (ini !== 'S') { var tapab = caja(0.17, 0.09, 0.03, colorMat('#dfe9ee')); tapab.position.set(0, 1.57, 0.1); pers.add(tapab); }
        // insignia con la inicial sobre el pecho
        var cv = document.createElement('canvas'); cv.width = cv.height = 128; var cx = cv.getContext('2d');
        cx.fillStyle = col; cx.beginPath(); cx.arc(64, 64, 60, 0, 7); cx.fill(); cx.lineWidth = 8; cx.strokeStyle = '#fff'; cx.stroke();
        cx.fillStyle = '#fff'; cx.font = 'bold 76px Segoe UI, sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(ini, 64, 70);
        var ins = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true }));
        ins.position.set(0.08, 1.28, 0.145); pers.add(ins);
        pers.scale.setScalar(Math.max(0.85, Math.min(1.15, s0)));
        g.add(pers);
        // marca en el piso del color del personaje
        var aro = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.31, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(col), transparent: true, opacity: 0.8 }));
        aro.rotation.x = -Math.PI / 2; aro.position.y = 0.006; g.add(aro);
        break;
      }
      case 'mesa_aud': {
        var madera = colorMat('#b98b58', { roughness: 0.55 }), hm = 0.75;
        var tab = caja(L, 0.035, A, madera); tab.position.y = hm; g.add(tab);
        var fald = caja(L - 0.1, 0.18, 0.02, madera); fald.position.set(0, hm - 0.11, -A / 2 + 0.03); g.add(fald);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { var pt = caja(0.04, hm, 0.04, M.aceroOsc); pt.position.set(p[0] * (L / 2 - 0.06), hm / 2, p[1] * (A / 2 - 0.05)); g.add(pt); });
        break;
      }
      case 'silla': {
        var tela = colorMat(col, { roughness: 0.8 }), hs = 0.46;
        var asi = caja(L * 0.9, 0.05, A * 0.85, tela); asi.position.y = hs; g.add(asi);
        var resp = caja(L * 0.9, 0.42, 0.04, tela); resp.position.set(0, hs + 0.24, -A / 2 + 0.05); resp.rotation.x = -0.08; g.add(resp);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { var pt = cil(0.012, 0.012, hs, M.aceroOsc, 8); pt.position.set(p[0] * (L / 2 - 0.05), hs / 2, p[1] * (A / 2 - 0.05)); g.add(pt); });
        break;
      }
      case 'circulo': {
        var r0 = Math.min(L, A) / 2;
        if (n.indexOf('lámpara') >= 0 || n.indexOf('lampara') >= 0) {
          var pb = cil(r0, r0, 0.05, M.aceroOsc); pb.position.y = 0.06; g.add(pb);
          var pp = cil(0.02, 0.02, 1.7, M.acero); pp.position.y = 0.9; g.add(pp);
          var dome = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), colorMat(col, { metalness: 0.4, side: THREE.DoubleSide }));
          dome.rotation.x = Math.PI; dome.position.y = 1.85; dome.castShadow = true; g.add(dome);
          var luz = new THREE.Mesh(new THREE.CircleGeometry(0.26, 24), new THREE.MeshBasicMaterial({ color: 0xfff6d8 })); luz.rotation.x = Math.PI / 2; luz.position.y = 1.84; g.add(luz);
        } else if (n.indexOf('caneca') >= 0 || n.indexOf('residuo') >= 0) {
          var cn = cil(r0 * 0.95, r0 * 0.85, 0.62, colorMat(col)); cn.position.y = 0.31; g.add(cn);
          var tp = cil(r0, r0, 0.04, colorMat(col)); tp.position.y = 0.64; g.add(tp);
        } else {
          var asiento = cil(r0, r0, 0.08, colorMat(col)); asiento.position.y = 0.58; g.add(asiento);
          var pt = cil(0.03, 0.03, 0.5, M.acero); pt.position.y = 0.3; g.add(pt);
          var bs = cil(r0 * 0.9, r0 * 0.9, 0.04, M.aceroOsc); bs.position.y = 0.04; g.add(bs);
        }
        break;
      }
      default: {
        var cj = caja(L, 0.85, A, colorMat(col, { metalness: 0.15 })); cj.position.y = 0.12 + 0.425; g.add(cj);
        for (var d = 0; d < 3; d++) { var ca = caja(L - 0.06, 0.012, 0.01, M.acero); ca.position.set(0, 0.35 + d * 0.25, A / 2 + 0.005); g.add(ca); }
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (p) { var r = cil(0.04, 0.04, 0.035, M.caucho); r.rotation.x = Math.PI / 2; r.position.set(p[0] * (L / 2 - 0.05), 0.04, p[1] * (A / 2 - 0.05)); g.add(r); });
      }
    }
    return g;
  }

  // --------------------------------------------------------------- arquitectura
  function pared(f, s) { if (f.x <= 20) return 'izq'; if (f.x + f.w >= s.ancho - 20) return 'der'; if (f.y <= 20) return 'arr'; return 'aba'; }
  function arquitectura(esc, s, plano, M) {
    var W = s.ancho / 100, D = s.largo / 100;
    (plano || []).forEach(function (f) {
      var x = f.x / 100, z = f.y / 100, w = f.w / 100, d = f.h / 100, cx = x + w / 2, cz = z + d / 2, p = pared(f, s), o;
      var enPared = function (obj, alto, y, grosor) {
        // coloca un panel pegado a la pared correspondiente, ocupando su largo
        var largo = (p === 'izq' || p === 'der') ? d : w;
        var m = caja(p === 'izq' || p === 'der' ? grosor : largo, alto, p === 'izq' || p === 'der' ? largo : grosor, obj);
        var px = p === 'izq' ? grosor / 2 : p === 'der' ? W - grosor / 2 : cx, pz = p === 'arr' ? grosor / 2 : p === 'aba' ? D - grosor / 2 : cz;
        m.position.set(px, y, pz); esc.add(m); return m;
      };
      switch (f.t) {
        case 'columna': o = caja(w, ALTO_PARED, d, M.pared); o.position.set(cx, ALTO_PARED / 2, cz); esc.add(o); break;
        case 'ventana': enPared(M.vidrio, 1.1, 1.55, 0.05); enPared(M.marco, 0.06, 0.97, 0.08); enPared(M.marco, 0.06, 2.13, 0.08); break;
        case 'ventana_int': enPared(M.vidrio, 0.8, 1.5, 0.05); enPared(M.negro, 0.04, 1.08, 0.07); enPared(M.negro, 0.04, 1.92, 0.07); break;
        case 'puerta': enPared(M.blanco, 2.1, 1.05, 0.06); enPared(M.oro, 0.05, 2.12, 0.08); break;
        case 'tv': enPared(M.negro, 0.62, 1.7, 0.07); enPared(M.pantalla, 0.56, 1.7, 0.08); break;
        case 'pantalla': o = enPared(new THREE.MeshStandardMaterial({ color: 0x4d63d8, emissive: 0x3346b8, emissiveIntensity: 0.55 }), 1.5, 1.55, 0.02); break;
        case 'rejilla': o = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: textura(rejilla, 64, 128) }));
          o.rotation.x = -Math.PI / 2; o.position.set(cx, 0.004, cz); o.receiveShadow = true; esc.add(o); break;
        case 'toma': o = cil(w / 2, w / 2, 0.02, M.negro); o.position.set(cx, 0.01, cz); esc.add(o); break;
        case 'aire': o = caja(w, 1.75, d, M.blanco); o.position.set(cx, 0.875, cz); esc.add(o);
          for (var k = 0; k < 5; k++) { var l = caja(w - 0.08, 0.015, 0.01, M.aceroOsc); l.position.set(cx, 1.2 + k * 0.08, cz + d / 2 + 0.005); esc.add(l); } break;
        case 'ventilador': o = cil(w / 2, w / 2, 0.08, M.negro); o.rotation.x = Math.PI / 2; o.position.set(cx, 2.25, cz); esc.add(o); break;
        case 'extintor': o = cil(0.08, 0.08, 0.5, M.rojo); o.position.set(cx, 0.45, cz); esc.add(o); break;
        case 'lavamanos': o = caja(w, 0.85, d, M.blanco); o.position.set(cx, 0.425, cz); esc.add(o); break;
      }
    });
  }

  // --------------------------------------------------------------- escena
  var actual = null;
  function montar(host, o) {
    if (actual) { try { actual.destruir(); } catch (e) {} actual = null; }
    if (!window.THREE) { host.innerHTML = '<div class="vacio">No se pudo cargar la vista 3D en este navegador.</div>'; return { destruir: function () {} }; }
    var s = o.sala, W = s.ancho / 100, D = s.largo / 100, M = mats();
    ALTO_PARED = (+s.alto || 280) / 100;
    host.innerHTML = '<div class="p3-wrap"><canvas class="p3-canvas"></canvas><div class="p3-ayuda">Arrastre para girar · rueda del mouse o dos dedos para acercar · clic derecho para desplazar</div>' +
      '<div class="p3-medidas">' + s.nombre + ' · ' + W.toFixed(2).replace('.', ',') + ' × ' + D.toFixed(2).replace('.', ',') + ' × ' + ALTO_PARED.toFixed(2).replace('.', ',') + ' m</div><div class="p3-botones"><button type="button" data-v="persp">Vista 3D</button><button type="button" data-v="entrada">Desde la entrada</button><button type="button" data-v="arriba">Desde arriba</button></div></div>';
    var canvas = host.querySelector('canvas'), wrap = host.querySelector('.p3-wrap');
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.82;
    var esc = new THREE.Scene(); esc.background = new THREE.Color(0xe9e5da);
    var cam = new THREE.PerspectiveCamera(45, 1, 0.05, 200);

    // luces
    esc.add(new THREE.HemisphereLight(0xfffdf6, 0xb9b09c, 0.62));
    var sol = new THREE.DirectionalLight(0xfff4e0, 0.9); sol.position.set(W * 0.3, 7, D * 0.8); sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048); var sc = sol.shadow.camera; sc.left = -W; sc.right = W; sc.top = D; sc.bottom = -D; sc.near = 0.5; sc.far = 30;
    sol.target.position.set(W / 2, 0, D / 2); esc.add(sol); esc.add(sol.target);
    // paneles de luz del techo (solo brillo visual)
    for (var lx = 1; lx < W; lx += 3) for (var lz = 1.5; lz < D; lz += 3.5) {
      var pl = new THREE.PointLight(0xfff8ec, 0.18, 7); pl.position.set(lx, ALTO_PARED - 0.2, lz); esc.add(pl);
    }

    // piso
    var piso = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: textura(terrazo, 256, 256, W / 0.6, D / 0.6), roughness: 0.55, metalness: 0.02 }));
    piso.rotation.x = -Math.PI / 2; piso.position.set(W / 2, 0, D / 2); piso.receiveShadow = true; esc.add(piso);
    var zocalo = colorMat('#d6d2c7');
    // paredes (4) — se vuelven transparentes cuando tapan la vista
    var paredes = [
      { m: caja(W + GROSOR * 2, ALTO_PARED, GROSOR, M.pared.clone()), p: [W / 2, ALTO_PARED / 2, -GROSOR / 2], n: [0, 0, -1], c: [W / 2, 0, 0] },
      { m: caja(W + GROSOR * 2, ALTO_PARED, GROSOR, M.pared.clone()), p: [W / 2, ALTO_PARED / 2, D + GROSOR / 2], n: [0, 0, 1], c: [W / 2, 0, D] },
      { m: caja(GROSOR, ALTO_PARED, D, M.pared.clone()), p: [-GROSOR / 2, ALTO_PARED / 2, D / 2], n: [-1, 0, 0], c: [0, 0, D / 2] },
      { m: caja(GROSOR, ALTO_PARED, D, M.pared.clone()), p: [W + GROSOR / 2, ALTO_PARED / 2, D / 2], n: [1, 0, 0], c: [W, 0, D / 2] }
    ];
    paredes.forEach(function (w) { w.m.position.set(w.p[0], w.p[1], w.p[2]); w.m.castShadow = false; esc.add(w.m);
      var z = caja(w.n[0] ? 0.02 : W, 0.1, w.n[0] ? D : 0.02, zocalo); z.position.set(w.c[0] - w.n[0] * 0.01, 0.05, w.c[2] - w.n[2] * 0.01); esc.add(z); w.z = z; });
    arquitectura(esc, s, o.plano, M);

    // elementos
    var cats = {}; (o.catalogo || []).forEach(function (c) { cats[c.id] = c; });
    (o.items || []).forEach(function (it) {
      var c = cats[it.cat]; if (!c) return;
      var g = modelo(c, M); g.position.set(it.x / 100, 0, it.y / 100); g.rotation.y = -(it.r || 0) * Math.PI / 180; esc.add(g);
      if (it.label) { var e = etiqueta(it.label); e.position.set(it.x / 100, c.forma.indexOf('camilla') === 0 ? 1.55 : c.forma === 'persona' ? 2.05 : c.forma === 'silla' || c.forma === 'mesa_aud' ? 1.2 : 2.2, it.y / 100); esc.add(e); }
    });

    var ctr = new THREE.OrbitControls(cam, canvas);
    ctr.target.set(W / 2, 0.6, D / 2); ctr.maxPolarAngle = Math.PI / 2 - 0.03; ctr.minDistance = 1.5; ctr.maxDistance = Math.max(W, D) * 2.4;
    ctr.enableDamping = true; ctr.dampingFactor = 0.12;
    function vista(v) {
      var R = Math.max(W, D);
      if (v === 'arriba') cam.position.set(W / 2, R * 1.35, D / 2 + 0.01);
      else if (v === 'entrada') cam.position.set(W / 2, 1.65, D + 0.15);
      else cam.position.set(W / 2 + R * 0.42, R * 0.58, D + R * 0.42);
      ctr.target.set(W / 2, v === 'entrada' ? 1.1 : 0.4, D / 2); ctr.update(); pedir();
      host.querySelectorAll('[data-v]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-v') === v); });
    }
    host.querySelectorAll('[data-v]').forEach(function (b) { b.addEventListener('click', function () { vista(b.getAttribute('data-v')); }); });

    var tmp = new THREE.Vector3();
    function paredesVisibles() {
      paredes.forEach(function (w) {
        tmp.set(cam.position.x - w.c[0], 0, cam.position.z - w.c[2]);
        var delante = tmp.x * w.n[0] + tmp.z * w.n[2] > 0; // la cámara está del lado exterior de esa pared
        w.m.material.opacity = delante ? 0.12 : 1; w.m.material.depthWrite = !delante; w.z.visible = !delante;
      });
    }
    var vivo = true, pendiente = false, moviendo = 0;
    function render() { pendiente = false; ctr.update(); paredesVisibles(); renderer.render(esc, cam); if (moviendo > 0) { moviendo--; pedir(); } }
    function pedir() { if (!pendiente && vivo) { pendiente = true; requestAnimationFrame(render); } }
    ctr.addEventListener('change', function () { moviendo = 12; pedir(); });
    function ajustar() {
      var w = wrap.clientWidth || 600, h = Math.max(320, Math.min(window.innerHeight * 0.68, w * 0.72));
      renderer.setSize(w, h, false); canvas.style.width = w + 'px'; canvas.style.height = h + 'px'; cam.aspect = w / h; cam.updateProjectionMatrix(); pedir();
    }
    var ro = window.ResizeObserver ? new ResizeObserver(ajustar) : null; if (ro) ro.observe(wrap); else window.addEventListener('resize', ajustar);
    ajustar(); vista('persp');
    return actual = {
      destruir: function () {
        vivo = false; if (ro) ro.disconnect(); else window.removeEventListener('resize', ajustar); ctr.dispose();
        esc.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) { (Array.isArray(x.material) ? x.material : [x.material]).forEach(function (m) { if (m.map) m.map.dispose(); m.dispose(); }); } });
        renderer.dispose(); host.innerHTML = ''; if (actual && actual.host === host) actual = null;
      },
      host: host
    };
  }

  window.Plano3D = { montar: montar };
})();
