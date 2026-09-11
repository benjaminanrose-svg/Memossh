class Component extends DCLogic {
  vidA = React.createRef();

  componentDidMount() {
    this.menuResponsivo();
    this.carritoCompras();
    this.carruselCafes();
    this.ventanaInstagram();
    this.estampas();
    this.pasosProceso();
    this.resenasGoogle();
    this.microInteracciones();
    const v = this.vidA.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.volume = 0;
    const conn = navigator.connection || {};
    if (conn.saveData || /^(slow-)?2g$/.test(conn.effectiveType || '')) return;
    const show = () => {
      if (v.readyState < 2) return;
      v.style.opacity = '1';
      v.play().catch(() => {});
    };
    const start = () => {
      v.src = (window.__resources && window.__resources.heroReel) || 'media/reel-queen.mp4';
      v.addEventListener('canplay', show);
      v.addEventListener('loadeddata', show);
      v.load();
      const iv = setInterval(() => { if (v.paused) show(); else clearInterval(iv); }, 1200);
      setTimeout(() => clearInterval(iv), 15000);
      const kick = () => { if (v.paused) show(); };
      ['pointerdown', 'keydown', 'scroll'].forEach(e =>
        window.addEventListener(e, kick, { once: true, passive: true }));
    };
    if (document.readyState === 'complete') setTimeout(start, 400);
    else window.addEventListener('load', () => setTimeout(start, 400), { once: true });
  }

  // Menu hamburguesa en movil. El estado abierto/cerrado vive en la clase
  // menu-abierto del elemento html, asi React nunca lo pisa al re-renderizar.
  menuResponsivo() {
    const nav = document.querySelector('nav.nav');
    if (!nav) return;
    const boton = nav.querySelector('.nav-burger');
    const panel = nav.querySelector('.nav-links');
    const fondo = document.querySelector('.nav-fondo');
    if (!boton || !panel) return;

    const raiz = document.documentElement;
    const medir = () => raiz.style.setProperty('--nav-alto', nav.offsetHeight + 'px');
    const abierto = () => raiz.classList.contains('menu-abierto');
    const poner = (si) => {
      raiz.classList.toggle('menu-abierto', si);
      boton.setAttribute('aria-expanded', si ? 'true' : 'false');
      boton.setAttribute('aria-label', si ? 'Cerrar menu' : 'Abrir menu');
    };

    medir();
    boton.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); medir(); poner(!abierto()); });
    panel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => poner(false)));
    if (fondo) fondo.addEventListener('click', () => poner(false));
    document.addEventListener('click', (e) => {
      if (abierto() && !panel.contains(e.target) && !boton.contains(e.target)) poner(false);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && abierto()) poner(false); });
    window.addEventListener('resize', () => { medir(); if (window.innerWidth >= 768) poner(false); });
  }

  // Carrito de compras. El estado vive en localStorage y se dibuja a mano en el
  // DOM (no en React), igual que el menu, para que un re-render no lo borre.
  carritoCompras() {
    const LLAVE = 'memossh-carrito-v1';
    const raiz = document.documentElement;
    const drawer = document.querySelector('.cc-drawer');
    const lista = document.querySelector('.cc-items');
    const vacio = document.querySelector('.cc-vacio');
    const pie = document.querySelector('.cc-pie');
    const totalEl = document.querySelector('.cc-total');
    const badge = document.querySelector('.cc-badge');
    const fondo = document.querySelector('.cc-fondo');
    if (!drawer || !lista) return;

    // Catalogo leido de las propias tarjetas: el precio y la foto siempre
    // salen de la pagina, nunca de lo guardado. Asi un cambio de precio manda.
    const catalogo = {};
    document.querySelectorAll('.cc-agregar').forEach((b) => {
      const art = b.closest('article');
      const im = art ? art.querySelector('img') : null;
      catalogo[b.dataset.id] = {
        nombre: b.dataset.nombre,
        precio: parseInt(b.dataset.precio, 10) || 0,
        img: im ? im.src : ''
      };
    });

    let carro = [];
    try {
      const crudo = localStorage.getItem(LLAVE);
      const datos = crudo ? JSON.parse(crudo) : [];
      if (Array.isArray(datos)) {
        carro = datos
          .filter((p) => p && catalogo[p.id] && p.cant > 0)
          .map((p) => ({ id: p.id, cant: Math.min(99, Math.floor(p.cant)) }));
      }
    } catch (e) { carro = []; }

    const guardar = () => {
      try { localStorage.setItem(LLAVE, JSON.stringify(carro)); } catch (e) {}
    };
    const plata = (n) => '$' + Math.round(n).toLocaleString('es-CL');
    const totalItems = () => carro.reduce((s, p) => s + p.cant, 0);
    const totalPlata = () => carro.reduce((s, p) => s + p.cant * catalogo[p.id].precio, 0);

    const cambiar = (id, delta) => {
      const p = carro.find((x) => x.id === id);
      if (!p) return;
      p.cant = p.cant + delta;
      if (p.cant < 1) carro = carro.filter((x) => x.id !== id);
      guardar(); pintar();
    };
    const quitar = (id) => { carro = carro.filter((x) => x.id !== id); guardar(); pintar(); };

    function pintar() {
      lista.textContent = '';
      const hay = carro.length > 0;
      lista.hidden = !hay;
      vacio.hidden = hay;
      if (pie) pie.hidden = !hay;

      carro.forEach((p) => {
        const d = catalogo[p.id];
        const fila = document.createElement('div');
        fila.className = 'cc-item';

        const img = document.createElement('img');
        img.className = 'cc-mini';
        img.src = d.img; img.alt = ''; img.loading = 'lazy';
        fila.appendChild(img);

        const info = document.createElement('div');
        info.className = 'cc-info';
        const nom = document.createElement('p');
        nom.className = 'cc-nombre'; nom.textContent = d.nombre;
        const fmt = document.createElement('p');
        fmt.className = 'cc-formato'; fmt.textContent = '250g en grano';
        const sub = document.createElement('p');
        sub.className = 'cc-sub'; sub.textContent = plata(p.cant * d.precio);
        info.appendChild(nom); info.appendChild(fmt); info.appendChild(sub);
        fila.appendChild(info);

        const ctrl = document.createElement('div');
        ctrl.className = 'cc-ctrl';
        const step = document.createElement('div');
        step.className = 'cc-stepper';
        const menos = document.createElement('button');
        menos.type = 'button'; menos.textContent = '−';
        menos.setAttribute('aria-label', 'Quitar uno de ' + d.nombre);
        menos.addEventListener('click', () => cambiar(p.id, -1));
        const cant = document.createElement('span');
        cant.className = 'cc-cant'; cant.textContent = String(p.cant);
        const mas = document.createElement('button');
        mas.type = 'button'; mas.textContent = '+';
        mas.setAttribute('aria-label', 'Agregar uno de ' + d.nombre);
        mas.addEventListener('click', () => cambiar(p.id, 1));
        step.appendChild(menos); step.appendChild(cant); step.appendChild(mas);

        const borrar = document.createElement('button');
        borrar.type = 'button'; borrar.className = 'cc-borrar'; borrar.textContent = 'Eliminar';
        borrar.setAttribute('aria-label', 'Eliminar ' + d.nombre + ' del carrito');
        borrar.addEventListener('click', () => quitar(p.id));

        ctrl.appendChild(step); ctrl.appendChild(borrar);
        fila.appendChild(ctrl);
        lista.appendChild(fila);
      });

      if (totalEl) totalEl.textContent = plata(totalPlata());
      if (badge) {
        const n = totalItems();
        badge.textContent = String(n);
        badge.hidden = n === 0;
      }
    }

    const abrir = (si) => {
      raiz.classList.toggle('carrito-abierto', si);
      drawer.setAttribute('aria-hidden', si ? 'false' : 'true');
    };
    const estaAbierto = () => raiz.classList.contains('carrito-abierto');

    // Controles de cada tarjeta de producto
    document.querySelectorAll('.cc-tarjeta').forEach((caja) => {
      const menos = caja.querySelector('.cc-menos');
      const mas = caja.querySelector('.cc-mas');
      const cantEl = caja.querySelector('.cc-cant');
      const boton = caja.querySelector('.cc-agregar');
      if (!menos || !mas || !cantEl || !boton) return;
      let n = 1;
      const refrescar = () => { cantEl.textContent = String(n); };
      menos.addEventListener('click', () => { n = Math.max(1, n - 1); refrescar(); });
      mas.addEventListener('click', () => { n = Math.min(99, n + 1); refrescar(); });
      boton.addEventListener('click', () => {
        const id = boton.dataset.id;
        if (!catalogo[id]) return;
        const ya = carro.find((x) => x.id === id);
        if (ya) ya.cant = Math.min(99, ya.cant + n);
        else carro.push({ id: id, cant: n });
        guardar(); pintar();
        const textoOriginal = boton.textContent;
        boton.textContent = '¡Agregado!';
        boton.classList.add('cc-ok');
        clearTimeout(boton._ccTimer);
        boton._ccTimer = setTimeout(() => {
          boton.textContent = textoOriginal;
          boton.classList.remove('cc-ok');
        }, 1200);
        n = 1; refrescar();
      });
    });

    // Abrir / cerrar
    const btnAbrir = document.querySelector('.cc-abrir');
    if (btnAbrir) btnAbrir.addEventListener('click', () => abrir(true));
    const btnCerrar = document.querySelector('.cc-cerrar');
    if (btnCerrar) btnCerrar.addEventListener('click', () => abrir(false));
    if (fondo) fondo.addEventListener('click', () => abrir(false));
    const explorar = document.querySelector('.cc-explorar');
    if (explorar) explorar.addEventListener('click', () => abrir(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && estaAbierto()) abrir(false);
    });

    // Mensaje consolidado de WhatsApp
    const mensaje = () => {
      const filas = carro.map((p) => {
        const d = catalogo[p.id];
        return '\u2022 ' + d.nombre + ' (250g grano) x ' + p.cant + ' \u2014 ' + plata(p.cant * d.precio);
      });
      return [
        '¡Hola MEMOSSH! ☕ Quisiera realizar el siguiente pedido:',
        '',
        filas.join('\n'),
        '',
        '----------------------------------',
        'Total del Pedido: ' + plata(totalPlata()),
        '',
        '¿Tienen disponibilidad y cuáles son los pasos para concretar la compra?'
      ].join('\n');
    };

    const enviar = document.querySelector('.cc-enviar');
    if (enviar) {
      enviar.addEventListener('click', () => {
        if (!carro.length) return;
        const num = String(this.props.whatsapp || '56930053008').replace(/\D/g, '');
        const url = num
          ? 'https://wa.me/' + num + '?text=' + encodeURIComponent(mensaje())
          : 'https://ig.me/m/memossh_coffee';
        window.open(url, '_blank', 'noopener');
        carro = [];
        guardar(); pintar(); abrir(false);
      });
    }

    pintar();
  }

  // Movimiento del sitio: parallax del hero, sombra de la barra al bajar,
  // y aparicion suave de cada bloque al entrar en pantalla.
  microInteracciones() {
    const hero = document.querySelector('#top');
    const raiz = document.documentElement;
    const menos = window.matchMedia('(prefers-reduced-motion: reduce)');

    // ---- Parallax del hero ----
    let mx = 0, my = 0, sy = 0, pendiente = false;
    let revisarAlRodar = null;
    const aplicar = () => {
      pendiente = false;
      if (!hero) return;
      hero.style.setProperty('--mx', mx.toFixed(3));
      hero.style.setProperty('--my', my.toFixed(3));
      hero.style.setProperty('--sy', String(Math.round(sy)));
    };
    const pedir = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(aplicar);
    };
    if (hero) {
      const alMover = (e) => {
        if (menos.matches) return;
        const r = hero.getBoundingClientRect();
        if (!r.width || !r.height) return;
        mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        my = ((e.clientY - r.top) / r.height - 0.5) * 2;
        pedir();
      };
      hero.addEventListener('pointermove', alMover, { passive: true });
      hero.addEventListener('pointerleave', () => { mx = 0; my = 0; pedir(); }, { passive: true });
    }

    // ---- Sombra de la barra + scroll del parallax ----
    const alRodar = () => {
      const y = window.scrollY || 0;
      raiz.classList.toggle('bajando', y > 12);
      if (revisarAlRodar) revisarAlRodar();
      if (menos.matches) return;
      sy = Math.min(y, 900);
      pedir();
    };
    window.addEventListener('scroll', alRodar, { passive: true });
    alRodar();

    // ---- Aparicion al entrar en pantalla ----
    if (menos.matches) return;

    const pendientes = [];
    document.querySelectorAll('section, footer').forEach((caja) => {
      if (caja.closest('.cc-drawer')) return;
      let hijos = Array.prototype.slice.call(caja.children);
      // Si la seccion es un solo envoltorio, se baja un nivel para animar por partes
      let vueltas = 0;
      while (hijos.length === 1 && hijos[0].children.length > 1 && vueltas < 2) {
        hijos = Array.prototype.slice.call(hijos[0].children);
        vueltas++;
      }
      let orden = 0;
      hijos.forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.position === 'absolute' || cs.position === 'fixed') return;
        const r = el.getBoundingClientRect();
        if (!r.height) return;
        // Lo que ya se ve al cargar no se toca: nada de parpadeos
        if (r.top < window.innerHeight * 0.92) return;
        el.classList.add(cs.animationName !== 'none' ? 'rv-fade' : 'rv');
        el.style.setProperty('--rv-espera', Math.min(orden * 70, 210) + 'ms');
        orden++;
        pendientes.push(el);
      });
    });

    // Se revisa en cada cuadro de scroll. A diferencia de IntersectionObserver,
    // esto no se puede "saltar" un bloque aunque el scroll vaya muy rapido.
    const revisar = () => {
      const alto = window.innerHeight;
      for (let k = pendientes.length - 1; k >= 0; k--) {
        const el = pendientes[k];
        const r = el.getBoundingClientRect();
        if (r.top < alto * 0.94 && r.bottom > 0) {
          el.classList.add('rv-ok');
          pendientes.splice(k, 1);
        }
      }
    };
    revisarAlRodar = revisar;
    revisar();
    window.addEventListener('resize', revisar, { passive: true });

    // Red de seguridad: si algo quedara pendiente por cualquier motivo,
    // a los 8 segundos se muestra igual. Nunca contenido invisible.
    setTimeout(() => {
      pendientes.forEach((el) => el.classList.add('rv-ok'));
      pendientes.length = 0;
    }, 8000);
  }

  // Carrusel de los tres cafes en celular y tablet. No cambia el HTML:
  // toma el contenedor que ya existe y le agrega la clase y los puntos.
  carruselCafes() {
    const primera = document.querySelector('.producto');
    if (!primera) return;
    const pista = primera.parentElement;
    const tarjetas = Array.prototype.slice.call(pista.querySelectorAll('.producto'));
    if (tarjetas.length < 2) return;

    const menos = window.matchMedia('(prefers-reduced-motion: reduce)');
    pista.classList.add('carrusel');
    pista.setAttribute('role', 'group');
    pista.setAttribute('aria-label', 'Nuestros cafes: desliza para ver los tres');

    // Puntos de posicion
    const puntos = document.createElement('div');
    puntos.className = 'carrusel-puntos';
    const botones = tarjetas.map((tarjeta, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'carrusel-punto';
      const h = tarjeta.querySelector('h3');
      b.setAttribute('aria-label', 'Ver ' + (h ? h.textContent.trim() : 'cafe ' + (i + 1)));
      b.addEventListener('click', () => {
        const destino = tarjeta.offsetLeft - (pista.clientWidth - tarjeta.offsetWidth) / 2;
        pista.scrollTo({ left: destino, behavior: menos.matches ? 'auto' : 'smooth' });
      });
      puntos.appendChild(b);
      return b;
    });
    pista.parentElement.insertBefore(puntos, pista.nextSibling);

    // La tarjeta centrada se ve entera; las de al lado se achican y se apagan
    let pedido = false;
    const pintar = () => {
      pedido = false;
      const enCarrusel = window.innerWidth < 900;
      const centro = pista.scrollLeft + pista.clientWidth / 2;
      let mejor = 0, mejorDist = Infinity;
      tarjetas.forEach((tarjeta, i) => {
        const c = tarjeta.offsetLeft + tarjeta.offsetWidth / 2;
        const dist = Math.abs(c - centro);
        if (dist < mejorDist) { mejorDist = dist; mejor = i; }
        if (!enCarrusel || menos.matches) {
          tarjeta.style.removeProperty('--esc');
          tarjeta.style.removeProperty('--op');
          return;
        }
        const cerca = Math.max(0, 1 - dist / (tarjeta.offsetWidth || 1));
        tarjeta.style.setProperty('--esc', (0.93 + cerca * 0.07).toFixed(3));
        tarjeta.style.setProperty('--op', (0.55 + cerca * 0.45).toFixed(3));
      });
      botones.forEach((b, i) => b.classList.toggle('activo', i === mejor));
    };
    const pedir = () => {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(pintar);
    };

    pista.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir, { passive: true });
    pintar();
  }

  // La ventana de Instagram aparece recien cuando el contenido cargo,
  // para que no se vea un recuadro en blanco ni un salto.
  ventanaInstagram() {
    const caja = document.querySelector('.ig-ventana');
    if (!caja) return;
    const marco = caja.querySelector('.ig-feed');
    if (!marco) return;
    const listo = () => caja.classList.add('listo');
    marco.addEventListener('load', listo, { once: true });
    // Por si el iframe ya habia cargado antes de llegar aca, o si tarda:
    setTimeout(listo, 4000);
  }

  // Estampas de la marca en la esquina de abajo de algunas secciones.
  // Se ponen desde aca y no en el HTML para no tocar la estructura:
  // si esto fallara, la pagina queda igual que siempre.
  estampas() {
    const porTitulo = (texto) => {
      const h = Array.prototype.slice.call(document.querySelectorAll('section h2, section h3'))
        .find((x) => x.textContent.indexOf(texto) !== -1);
      return h ? h.closest('section') : null;
    };

    const puestos = [
      { caja: porTitulo('Valle de Matagalpa'), lado: 'der' },
      { caja: document.querySelector('#cafes'), lado: 'izq' },
      { caja: document.querySelector('#proceso'), lado: 'der' },
      { caja: porTitulo('Que nunca te falte café'), lado: 'izq' },
      { caja: porTitulo('Lo que dicen los que ya'), lado: 'der' },
      { caja: document.querySelector('#mayorista'), lado: 'izq' }
    ];

    puestos.forEach((p, n) => {
      if (!p.caja) return;
      if (p.caja.querySelector(':scope > .estampa')) return;
      const cs = getComputedStyle(p.caja);
      if (cs.position === 'static') p.caja.style.position = 'relative';
      const e = document.createElement('span');
      e.className = 'estampa estampa-' + n + ' estampa-' + p.lado;
      e.setAttribute('aria-hidden', 'true');
      p.caja.appendChild(e);
    });
  }

  // Los tres pasos del proceso. Cinco granos sobre la linea (uno por paso y
  // uno entre medio) que se van tostando de verde a oscuro.
  // En computador el avance lo manda el mouse; en celular, el scroll.
  pasosProceso() {
    const seccion = document.querySelector('#proceso');
    if (!seccion) return;
    const titulos = Array.prototype.slice.call(seccion.querySelectorAll('h3'));
    if (titulos.length !== 3) return;
    const cajas = titulos.map((h) => h.parentElement);
    const reja = cajas[0].parentElement;
    if (!reja) return;

    // Los cinco tuestes, del grano verde al muy tostado
    const TUESTES = ['#9fb894', '#d8c07a', '#b5793f', '#7a4a2a', '#3b2a20'];
    const NS = String.fromCharCode(104,116,116,112,58,47,47,119,119,119,46,119,51,46,111,114,103,47,50,48,48,48,47,115,118,103);
    const crear = (nombre, atributos) => {
      const e = document.createElementNS(NS, nombre);
      for (const k in atributos) e.setAttribute(k, atributos[k]);
      return e;
    };

    // Cada numero en su propia fila, para poder medirlo
    const numeros = [];
    cajas.forEach((caja) => {
      caja.classList.add('paso');
      const n = caja.querySelector('span');
      if (!n) return;
      if (!n.parentElement.classList.contains('paso-cabecera')) {
        const fila = document.createElement('div');
        fila.className = 'paso-cabecera';
        caja.insertBefore(fila, n);
        fila.appendChild(n);
      }
      numeros.push(n);
    });
    if (numeros.length !== 3) return;

    if (getComputedStyle(reja).position === 'static') reja.style.position = 'relative';

    // La linea
    let pista = reja.querySelector(':scope > .pista');
    if (!pista) {
      pista = document.createElement('div');
      pista.className = 'pista';
      pista.setAttribute('aria-hidden', 'true');
      const riel = document.createElement('div');
      riel.className = 'pista-riel';
      const av = document.createElement('div');
      av.className = 'pista-avance';
      pista.appendChild(riel);
      pista.appendChild(av);
      reja.insertBefore(pista, reja.firstChild);
    }
    const avance = pista.querySelector('.pista-avance');

    // Los cinco granos
    let granos = Array.prototype.slice.call(reja.querySelectorAll(':scope > .grano-linea'));
    if (granos.length !== 5) {
      granos.forEach((g) => g.remove());
      granos = [];
      for (let k = 0; k < 5; k++) {
        const g = document.createElement('div');
        g.className = 'grano-linea';
        g.setAttribute('aria-hidden', 'true');
        g.style.setProperty('--tueste', TUESTES[k]);
        const svg = crear('svg', { viewBox: '0 0 40 40', fill: 'none' });
        const gr = crear('g', { transform: 'rotate(-24 20 20)' });
        gr.appendChild(crear('ellipse', {
          cx: 20, cy: 20, rx: 11, ry: 14, class: 'grano-cuerpo',
          stroke: 'var(--color-accent-2-900)', 'stroke-width': 1.7
        }));
        gr.appendChild(crear('path', {
          d: 'M20 6.5 q 4.5 6.5 0 13.5 q -4.5 7 0 13.5',
          fill: 'none', stroke: 'var(--color-accent-2-900)',
          'stroke-width': 1.7, 'stroke-linecap': 'round'
        }));
        svg.appendChild(gr);
        g.appendChild(svg);
        reja.appendChild(g);
        granos.push(g);
      }
    }

    let avanceP = 0;   // 0 a 1
    let horizontal = true;
    let X1 = 0, Y1 = 0, X2 = 0, Y2 = 0;
    const menos = window.matchMedia('(prefers-reduced-motion: reduce)');
    const SEPARA = 54;

    const medir = () => {
      const base = reja.getBoundingClientRect();
      const a = numeros[0].getBoundingClientRect();
      const c = numeros[2].getBoundingClientRect();
      horizontal = Math.abs(a.top - c.top) < 12;
      X1 = a.left + a.width / 2 - base.left; Y1 = a.top + a.height / 2 - base.top;
      X2 = c.left + c.width / 2 - base.left; Y2 = c.top + c.height / 2 - base.top;
      if (horizontal) {
        pista.style.left = X1 + 'px'; pista.style.top = (Y1 - 2) + 'px';
        pista.style.width = Math.max(0, X2 - X1) + 'px'; pista.style.height = '4px';
      } else {
        pista.style.left = (X1 - 2) + 'px'; pista.style.top = Y1 + 'px';
        pista.style.width = '4px'; pista.style.height = Math.max(0, Y2 - Y1) + 'px';
      }
      granos.forEach((g, k) => {
        const p = k / 4;
        let gx, gy;
        if (horizontal) { gx = X1 + (X2 - X1) * p; gy = Y1 - SEPARA; }
        else { gx = X1 + SEPARA; gy = Y1 + (Y2 - Y1) * p; }
        g.style.transform = 'translate3d(' + gx + 'px, ' + gy + 'px, 0)';
        // En celular los granos de en medio caerian sobre el texto
        g.style.display = (!horizontal && (k === 1 || k === 3)) ? 'none' : 'block';
      });
    };

    const pintar = () => {
      const indice = Math.max(0, Math.min(2, Math.round(avanceP * 2)));
      cajas.forEach((c, i) => {
        const encendido = menos.matches ? true : i === indice;
        c.classList.toggle('activo', encendido);
        c.style.opacity = encendido ? '1' : '0.45';
        c.style.transform = encendido ? 'translate3d(0, -3px, 0)' : 'none';
      });
      if (horizontal) {
        avance.style.width = (avanceP * 100) + '%'; avance.style.height = '100%';
      } else {
        avance.style.width = '100%'; avance.style.height = (avanceP * 100) + '%';
      }
      granos.forEach((g, k) => {
        const listo = menos.matches ? true : avanceP >= (k / 4) - 0.06;
        g.classList.toggle('tostado', listo);
      });
    };

    // ---- Computador: el avance lo manda el mouse ----
    seccion.addEventListener('pointermove', (e) => {
      if (!horizontal || menos.matches) return;
      const base = reja.getBoundingClientRect();
      const x = e.clientX - base.left;
      const largo = X2 - X1;
      if (largo <= 0) return;
      avanceP = Math.max(0, Math.min(1, (x - X1) / largo));
      pintar();
    }, { passive: true });

    // ---- Celular: el avance lo manda el scroll ----
    const porScroll = () => {
      const linea = window.innerHeight * 0.45;
      let mejor = Infinity, cual = 0;
      cajas.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = Math.abs((r.top + r.bottom) / 2 - linea);
        if (d < mejor) { mejor = d; cual = i; }
      });
      avanceP = cual / 2;
    };

    const revisar = () => {
      medir();
      if (!horizontal && !menos.matches) porScroll();
      if (menos.matches) avanceP = 1;
      pintar();
    };

    let pedido = false;
    const pedir = () => { if (!pedido) { pedido = true; requestAnimationFrame(revisar); } };
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir, { passive: true });
    // Sin depender del dibujado del navegador
    setInterval(revisar, 400);
    revisar();
  }

  // Reseñas reales de Google Maps. El servidor las pide a Google (la clave
  // vive alla, nunca aca) y esta funcion las dibuja con el diseño del sitio.
  // Si no hay reseñas o falla, la pagina queda tal cual estaba.
  resenasGoogle() {
    const primera = document.querySelector('.card.elev-sm');
    if (!primera) return;
    const reja = primera.parentElement;
    if (!reja || !reja.parentElement) return;

    fetch('/api/resenas')
      .then((r) => r.json())
      .then((d) => {
        if (!d || !d.ok || !d.resenas || !d.resenas.length) return;

        // Linea con la nota y el enlace a Google
        let aviso = reja.parentElement.querySelector('.resenas-nota');
        if (!aviso) {
          aviso = document.createElement('p');
          aviso.className = 'resenas-nota';
          reja.parentElement.insertBefore(aviso, reja);
        }
        aviso.textContent = '';
        const estrella = document.createElement('span');
        estrella.className = 'resenas-estrella';
        estrella.textContent = '\u2605';
        aviso.appendChild(estrella);
        const resumen = document.createElement('span');
        const nota = d.nota ? String(d.nota).replace('.', ',') : '';
        resumen.textContent = nota + (d.total ? '  \u00b7  ' + d.total + ' reseñas en Google' : '  \u00b7  Reseñas de Google');
        aviso.appendChild(resumen);
        if (d.enlace) {
          const a = document.createElement('a');
          a.href = d.enlace;
          a.target = '_blank';
          a.rel = 'noopener';
          a.className = 'resenas-enlace';
          a.textContent = 'Ver todas en Google';
          aviso.appendChild(a);
        }

        // Una tarjeta por reseña, con las clases del sitio
        reja.textContent = '';
        d.resenas.forEach((x) => {
          const tarjeta = document.createElement('div');
          tarjeta.className = 'card elev-sm';

          const cuantas = Math.max(1, Math.min(5, Math.round(x.estrellas || 5)));
          const estrellas = document.createElement('p');
          estrellas.className = 'resenas-estrellas';
          estrellas.textContent = new Array(cuantas + 1).join('\u2605');
          estrellas.setAttribute('aria-label', cuantas + ' de 5 estrellas');
          tarjeta.appendChild(estrellas);

          const cita = document.createElement('p');
          cita.className = 'resenas-cita';
          cita.textContent = String.fromCharCode(34) + x.texto.trim() + String.fromCharCode(34);
          tarjeta.appendChild(cita);

          const pie = document.createElement('p');
          pie.className = 'card-meta resenas-pie';
          pie.textContent = '\u2014 ' + x.autor + (x.cuando ? '  \u00b7  ' + x.cuando : '');
          tarjeta.appendChild(pie);

          reja.appendChild(tarjeta);
        });
      })
      .catch(() => {});
  }

  renderVals() {
    const num = String(this.props.whatsapp || '56930053008').replace(/\D/g, '');
    return {
      vidA: this.vidA,
      waLink: num ? 'https://wa.me/' + num : 'https://ig.me/m/memossh_coffee',
      mostrarTestimonios: this.props.mostrarTestimonios ?? false,
      mostrarGaleria: this.props.mostrarGaleria ?? false
    };
  }
}
