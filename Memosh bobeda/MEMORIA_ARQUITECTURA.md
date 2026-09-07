# MEMORIA_ARQUITECTURA

Mapa de direcciones del proyecto **Memossh Coffee**. Se consulta ANTES de buscar archivos y se actualiza al terminar cualquier tarea que cree, modifique o elimine algo.

- Actualizado: 2026-09-07
- Raíz del repo: `C:\Users\noteb\Documents\GitHub\Memossh`
- Rama: `main`

---

## 1. Archivos del repo

| Ruta | Qué es | Tamaño |
|---|---|---|
| `Memossh Coffee - pagina completa.html` | La página web completa, empaquetada en un solo archivo (HTML + imágenes + video + JS, todo embebido) | ~26 MB / 392 líneas |
| `server.js` | Servidor mínimo de Node (sin dependencias) que publica la página. Es lo que ejecuta Railway | — |
| `package.json` | Le dice a Railway que arranque con `npm start` → `node server.js` | — |
| `Memosh bobeda/` | Bóveda de Obsidian (esta) | — |
| `Memosh bobeda/MEMORIA_ARQUITECTURA.md` | Este mapa | — |
| `Memosh bobeda/Bienvenido.md` | Nota por defecto de Obsidian, se puede borrar | — |

> Nota: la Regla #2 menciona `Wifired pagina/MEMORIA_ARQUITECTURA.md`. En este repo no existe esa carpeta; el mapa vive aquí, en la bóveda.

---

## 2. Cómo está armado el HTML (IMPORTANTE para no gastar tokens)

El archivo NO se abre entero nunca. Pesa 26 MB porque casi todo es una sola línea de datos en base64. Está dividido así:

| Líneas | Contenido | Se toca? |
|---|---|---|
| 1–376 | Cabecera, logo SVG de carga y el JS "desempaquetador" del bundle | Casi nunca |
| **378** | `__bundler/manifest`: 26 MB en una sola línea. 21 recursos en base64 (14 JPG, 2 SVG, 1 MP4, 4 JS) | Solo para agregar/quitar imágenes |
| 382 | `__bundler/ext_resources`: apunta a `heroReel` (el video) y a React/ReactDOM 18.3.1 de unpkg | Rara vez |
| 386 | `__bundler/page_order`: vacío `[]` | No |
| **390** | **La página real** (~65 KB, HTML escapado dentro de un string JSON) | **Aquí se edita todo** |

### Comandos útiles (no leer el archivo completo)

```bash
sed -n '390p' "Memossh Coffee - pagina completa.html" > tpl.txt   # extraer la página
grep -o -E '<h2[^>]*>[^<]{0,60}' tpl.txt                          # ver títulos
```

Para editar: `sed -i 's/texto viejo/texto nuevo/' ` sobre la línea 390, o el editor de archivos apuntando a esa línea. Ojo: dentro de la línea 390 las comillas van escapadas (`\"`) y los saltos de línea son `\n` literales.

---

## 3. Secciones de la página (en orden)

| # | Ancla | Título visible | Notas |
|---|---|---|---|
| 1 | — | Nav pegajoso (sticky) | Enlaces: `#cafes`, `#proceso`, `#mayorista`, `#contacto` (ver sección 8) |
| 2 | `#top` | "Sonríe, tenemos café para empezar." | Hero con video de fondo (`heroReel`). Altura fluida con `--nav-alto`, ver sección 11 |
| 3 | — | 4 tarjetas | Tostado bajo pedido / Origen en la bolsa / Envíos a todo Chile. La 3ª ("También en verde") está **oculta**, ver sección 9 |
| 4 | — | "Nicaragua" | Bloque de origen destacado |
| 5 | `#cafes` | "Tres orígenes, tres…" | Valle del Amazonas · El Salvador · Nicaragua (Matagalpa) |
| 6 | `#verde` | "¿Tuestas en casa? Te vendemos el grano verde" | Fondo oscuro. **OCULTA** desde 2026-09-07 (ver sección 9). |
| 7 | `#proceso` | "Del productor a tu taza, sin atajos" | 3 pasos: Elegimos el lote / Tostamos bajo pedido / Enviamos fresco |
| 8 | — | "Que nunca te falte café" | Suscripción |
| 9 | — | "Lo que dicen los que ya lo probaron" | **Opcional**: se oculta con `mostrarTestimonios`. Quedan 1 de 3 testimonios visibles (ver sección 9) |
| 10 | `#mayorista` | "Café para tu cafetería u oficina" | |
| 11 | — | "El mimo que no se calla el café" | Fondo oscuro |
| 12 | — | "El café, de cerca" | **Opcional**: galería, se oculta con `mostrarGaleria` |
| 13 | `#contacto` | "Sonríe, hay café." | |
| 14 | — | Footer | Columnas: Comprar / Conocer / Escríbenos |

---

## 4. Lógica (componente `x-dc`)

Al final de la línea 390 hay un `<script type="text/x-dc">` con una clase `Component extends DCLogic`:

**Propiedades editables** (panel del editor):

| Prop | Tipo | Para qué |
|---|---|---|
| `whatsapp` | texto | Número de WhatsApp. Se le quitan los símbolos y arma `https://wa.me/<número>` |
| `mostrarTestimonios` | sí/no | Muestra u oculta la sección 9 |
| `mostrarGaleria` | sí/no | Muestra u oculta la sección 12 |

**Variables que usa la plantilla**: `{{ waLink }}`, `{{ vidA }}`, `{{ mostrarTestimonios }}`, `{{ mostrarGaleria }}`.

**Detalles a recordar**
- Si `whatsapp` está vacío, el botón cae a Instagram: `https://ig.me/m/memossh_coffee`.
- El video del hero se carga en diferido: espera al `load` de la página + 400 ms, y **no carga nada** si el celular está en ahorro de datos o red 2G. Va sin sonido y en bucle.
- Si el recurso `heroReel` faltara, el código intenta `media/reel-queen.mp4` (ruta relativa que no existe en este bundle).

---

## 5. Estilos

- Fuentes: **Poppins** (títulos), **Figtree** (texto), **Caprasimo** (decorativa). Van embebidas como `@font-face` con `woff2` en base64; también hay `preconnect` a Google Fonts.
- Variables: `--color-*` y `--font-heading` / `--font-body`.

**Ojo — hay dos bloques `:root` seguidos y manda el segundo.** La paleta activa es:

| Token | Valor |
|---|---|
| `--color-bg` | `#fefcf2` (crema) |
| `--color-surface` | `#f4f0e2` |
| `--color-text` | `#29333f` |
| `--color-accent` | `#8a1001` (rojo café) |
| `--color-accent-2` | `#29333f` (gris azulado) |
| `--color-accent-2-900` | `#161c24` (fondos oscuros) |

La paleta verde oliva (`--color-accent: #7a8a5e`, `--color-accent-2-900: #272e1b`) es la del **primer** bloque y está anulada. Si un cambio de color "no se ve", es por esto: hay que editar el segundo bloque.

---

## 6. Dependencias externas

- React 18.3.1 y ReactDOM 18.3.1 (vienen embebidos, no se descargan).
- Google Fonts (solo `preconnect`).
- Instagram: `https://www.instagram.com/memossh_coffee`.

---

## 7. Despliegue (Railway)

- Repo conectado: `github.com/benjaminanrose-svg/Memossh`, rama `main`. Railway redespliega solo con cada `git push`.
- Arranque: `npm start` → `node server.js`. No hay `npm install` que hacer, porque no usa librerías externas.
- El servidor lee el HTML una vez al arrancar, lo comprime en memoria (25 MB → 19 MB) y lo entrega en `/`. También responde `/health` con "ok" y usa ETag para que el navegador no vuelva a bajar los 26 MB en cada visita.
- Puerto: `const PORT = process.env.PORT || 8080;` y `server.listen(PORT, "0.0.0.0", ...)`. Railway inyecta `PORT` y el servidor lo obedece; el 8080 es solo el respaldo para cuando se corre en el computador. **No fijar un puerto a mano ni sobreescribir `PORT`.**
- No existe ningún `railway.json`, `nixpacks.toml`, `Procfile`, `Dockerfile` ni `.env` en el repo: nada más puede pisar el puerto.
- La URL pública se genera en Railway: **Settings → Networking → Generate Domain**.

---

## 8. Menú de navegación responsivo

Corte: **768 px**.

- **Escritorio (>= 768px)**: igual que siempre. `.nav-links { display: contents; }` hace que el contenedor sea "invisible" para el diseño, así los 4 enlaces siguen siendo hijos directos del flex del `nav` y no cambia nada visualmente.
- **Móvil (< 768px)**: los enlaces se ocultan y `.nav-links` se convierte en un panel fijo bajo la barra (fondo crema, ancho completo, enlaces en columna de ~59 px de alto). En la barra quedan solo el logo, el botón de WhatsApp compacto (el texto "Pedir por " se oculta con `.solo-escritorio`) y el botón hamburguesa de 44x44.

**Dónde está cada cosa** (todo en la línea 390):

| Pieza | Selector / nombre |
|---|---|
| Contenedor de los 4 enlaces | `.nav-links` (id `menu-movil`) |
| Botón hamburguesa | `.nav-burger`, con `.icono-menu` y `.icono-cerrar` |
| Fondo oscuro para cerrar | `.nav-fondo` (hermano del `nav`) |
| Estilos | bloque `@media (max-width: 767px)` al final del `<style>` del `<helmet>` |
| Lógica | método `menuResponsivo()` en `class Component extends DCLogic`, llamado desde `componentDidMount()` |

**Cómo funciona el estado**: abierto/cerrado se guarda como la clase `menu-abierto` en el elemento `<html>`, no en un nodo del componente. Se hizo así a propósito: React nunca toca `<html>`, entonces un re-render no puede borrar el estado. La altura real de la barra se mide en JavaScript y se guarda en la variable CSS `--nav-alto`, que el panel usa para colocarse justo debajo sin solaparse.

**Se cierra de 4 formas**: al tocar un enlace, al tocar el fondo oscuro, al tocar cualquier parte fuera del menú, y con la tecla Escape. Además se cierra solo si la ventana pasa a 768 px o más.

---

## 9. Oferta reducida a café en grano de 250 gr

Desde el 2026-09-07 la página ofrece **solo café en grano de 250 gr**. Se quitaron las menciones a café molido y café verde.

### Textos cambiados

| Dónde | Antes | Ahora |
|---|---|---|
| Catálogo | "Todo en 250 gr, en grano o molido a tu método…" | "Todo en formato de 250 gr en grano. La selección rota según cosecha." |
| Ficha del producto | Formato: "250 gr" | Formato: "250 gr en grano" |
| Contacto | "…en grano, molido, verde, suscripción o volumen…" | "…café en grano de 250 gr, suscripción o volumen para tu local." |
| Suscripción | "Eliges origen, molienda y cada cuánto…" | "Eliges origen y cada cuánto lo quieres." |
| Alt del hero | "Bolsa de café verde Memossh" | "Bolsa de café Memossh" |
| Alt de galería | "Café verde en bolsa resellable" | "Café Memossh en bolsa resellable" |

### Enlaces eliminados

- "Café verde" de la barra superior (y con eso también del menú hamburguesa, porque comparten los mismos enlaces).
- "Café verde" del pie de página.
- "Guía de molienda" del pie de página.

Menú actual: **Cafés · Proceso · Cafeterías** + botón de WhatsApp.

### Vistas ocultas, NO borradas

Se les puso la clase `oculto-temporal` (regla `display: none !important` en el `<style>` del `<helmet>`). El contenido sigue completo en el archivo.

| Elemento | Cómo encontrarlo |
|---|---|
| Sección entera de café verde | `<section id="verde" class="oculto-temporal">` |
| Tarjeta "También en verde" | 3ª tarjeta de la fila bajo el hero |
| Testimonio de la molienda | tarjeta con "Me armaron la molienda para mi moka…" |
| Testimonio del café verde | tarjeta con "Compro el verde por kilo…" |

**Para volver a mostrar cualquiera**: quitar `oculto-temporal` de ese elemento. Para reactivar todo de golpe: borrar la regla `.oculto-temporal` del CSS.

También se agregó `.card.elev-sm { max-width: 620px; }` porque al ocultar dos de los tres testimonios, el que quedaba se estiraba a los 1128 px del contenedor. Si se vuelven a mostrar los tres, esa regla no cambia nada.

### Lo que NO existe en esta página

Al revisar no hay `<input>`, `<select>`, `<option>`, `<form>` ni `<dialog>`: **no hay selectores de molienda, badges, radio buttons, modales, carrito ni filtros de categoría**. Todo el pedido se hace por WhatsApp y el enlace es solo `https://wa.me/<número>`, sin mensaje ni datos precargados. Por eso no hubo "payload" que ajustar.

---

## 10. Carrito de compras

Carrito completo con persistencia, drawer lateral y pedido consolidado por WhatsApp. Todo vive en la línea 390.

### Productos y precios

Los precios **no están en una base de datos ni en una variable**: viven en los atributos `data-` de cada botón "Agregar al carrito". Para cambiar un precio se edita ahí y listo.

| Producto | `data-id` | Precio |
|---|---|---|
| Valle del Amazonas | `valle` | $12.000 |
| El Salvador | `salvador` | $12.000 |
| Nicaragua, Matagalpa | `matagalpa` | $8.000 |

El precio también se muestra en la tarjeta (`.cc-precio`), así que **si cambias el `data-precio` hay que cambiar el texto visible del mismo bloque.**

### Piezas

| Pieza | Selector |
|---|---|
| Precio en la tarjeta | `.cc-precio` |
| Cantidad + botón agregar | `.cc-tarjeta`, con `.cc-stepper`, `.cc-menos`, `.cc-cant`, `.cc-mas`, `.cc-agregar` |
| Botón del carrito en la barra | `.cc-abrir`, con el contador `.cc-badge` |
| Fondo oscuro | `.cc-fondo` |
| Panel lateral | `.cc-drawer` (título `.cc-titulo`, cerrar `.cc-cerrar`) |
| Lista de ítems | `.cc-items`, cada fila `.cc-item` (`.cc-mini`, `.cc-nombre`, `.cc-formato`, `.cc-sub`, `.cc-borrar`) |
| Estado vacío | `.cc-vacio` con el botón `.cc-explorar` |
| Pie con total | `.cc-pie`, `.cc-total`, `.cc-enviar` |
| Lógica | método `carritoCompras()` en `class Component extends DCLogic`, llamado desde `componentDidMount()` |

### Cómo funciona el estado

- Se guarda en `localStorage`, llave **`memossh-carrito-v1`**, y solo se guarda `[{id, cant}]`.
- **El nombre, el precio y la foto NO se guardan**: se leen de las tarjetas de la página cada vez. Así un cambio de precio manda siempre, y la miniatura funciona tras recargar (las direcciones de las imágenes del bundle cambian en cada carga, guardarlas la rompería).
- Al abrir la página se descartan los ítems cuyo `id` ya no existe en el catálogo.
- Todas las lecturas y escrituras van dentro de `try/catch`: si el navegador bloquea el almacenamiento, el carrito igual funciona (solo no recuerda).
- Si la cantidad baja de 1, el ítem se elimina.
- Al enviar el pedido, el carrito se vacía y el panel se cierra.

### Mensaje de WhatsApp

Número configurado: **+56 9 3005 3008** (el 930053008 con el código de Chile). Está en tres lugares: la lógica del carrito, el `waLink` que usan los botones "Pedir por WhatsApp" y el valor por defecto del panel del editor.

Formato generado (verificado en el navegador):

```
¡Hola MEMOSSH! ☕ Quisiera realizar el siguiente pedido:

• Valle del Amazonas (250g grano) x 2 — $24.000
• Nicaragua, Matagalpa (250g grano) x 1 — $8.000

----------------------------------
Total del Pedido: $32.000

¿Tienen disponibilidad y cuáles son los pasos para concretar la compra?
```

Se codifica con `encodeURIComponent` y se abre `https://wa.me/56930053008?text=…`.

### Trampas encontradas (para no repetirlas)

1. **`String.replace` con texto se come los `$`.** `$'` y `$&` son comodines. Al insertar código con `$` hay que pasar una **función** como reemplazo: `t.replace(buscar, () => nuevo)`. Esto rompió la clase entera la primera vez.
2. **El atributo `hidden` no basta.** Cualquier regla CSS con clase que ponga `display` le gana al `display:none` que el navegador aplica a `[hidden]`. Por eso existe la regla `[hidden] { display: none !important; }`.
3. **En móvil no caben cuatro cosas en la barra.** Logo + WhatsApp + carrito + menú daban 396 px en 375. Se ocultó el botón de WhatsApp de la barra solo en móvil (`.nav .btn-primary { display: none; }` dentro del `@media`).

---

## 11. Altura del hero y favicon

### La franja blanca del hero

El hero tenía `min-height: calc(100dvh - 108px)`. Ese 108 era la suma de la barra de anuncios (37 px) más el menú (71 px). Al borrar la marquesina el 2026-09-07, el menú pasó a medir 71 px, así que el hero quedaba **37 px corto** y por debajo asomaba el fondo crema del sitio: esa era la franja blanca.

Ahora es:

```css
min-height: calc(100dvh - var(--nav-alto, 71px))
```

`--nav-alto` es la variable que el método `menuResponsivo()` ya calculaba midiendo el menú de verdad (ver sección 8), y se recalcula al cambiar el tamaño de la ventana. Si el JavaScript no llegara a correr, el respaldo de 71 px deja el hero igual de bien. **No hay número mágico que actualizar si algún día cambia la altura del menú.**

Medido: franja de 0 px y hueco de 0 px entre el hero y la sección siguiente, tanto en 1280x800 como en 375x812.

### Favicon y título de la pestaña

Antes la pestaña salía **sin título y sin icono**. Se agregaron dentro del `<helmet>` de la plantilla:

| Etiqueta | Valor |
|---|---|
| `<title>` | MEMOSSH · Café de especialidad |
| `<link rel="icon" type="image/svg+xml">` | el isotipo, incrustado como `data:` |
| `<meta name="description">` | resumen para buscadores y para cuando se comparte el enlace |

**De dónde sale el icono**: es el mismo SVG del logo del menú (`ecce8c91-24a0-4264-855b-d7e0af2b6488`). Estaba comprimido con gzip dentro del manifest y traía 8 KB de metadata de procedencia (C2PA) que no sirve para un icono. Se descomprimió, se le quitó solo ese bloque `<metadata>` y quedó el dibujo intacto: 93 formas, `viewBox 0 0 2000 2000`, 53 KB en base64.

Se incrustó como `data:` en vez de apuntar al recurso del bundle porque las direcciones de los recursos empaquetados se generan de nuevo en cada carga (`blob:`), y un favicon apuntando ahí no es confiable.

Para regenerarlo si cambia el logo: `scratchpad/limpiar-svg.js` hace la descompresión y limpieza.

---

## 12. Micro-interacciones y animaciones

Todas usan **solo `transform` y `opacity`**, las dos propiedades que el navegador resuelve en la tarjeta gráfica sin recalcular el diseño de la página. No se anima ancho, alto, posición ni color de fondo.

### Qué se mueve

| Dónde | Qué hace | Cómo |
|---|---|---|
| Isotipo del hero (`.hero-logo`) | Flota subiendo y bajando 12 px con una leve inclinación, **a saltos** como stop-motion | `@keyframes mem-flota` con `steps(9, end)` |
| Mosaico de fotos del hero (`.hero-fondo`) | Parallax: se desplaza con el cursor y con el scroll | `transform` calculado con las variables `--mx`, `--my`, `--sy` |
| Contenido del hero (`.hero-contenido`) | Parallax suave en sentido contrario | igual, con factores más chicos |
| Tarjetas de producto (`.producto`) | Se elevan 9 px con sombra más profunda al pasar el cursor **o al enfocar con el teclado** | `transition` + `:hover, :focus-within` |
| Foto de la bolsa (`.producto-foto`) | Crece 7 % y se inclina 1,8° **a saltos** | `transition: transform 320ms steps(4, end)` |
| Botones (`.btn`) | Rebote al pasar el cursor; los primarios además laten | `mem-pulso` + curva elástica |
| Botones (`.btn:active`) | Se hunden al hacer clic | `transform: scale(0.95)` |
| `+` y `−` del carrito | Se hunden al tocarlos | `transform: scale(0.88)` |

### El parallax

El JavaScript **no mueve nada**: el método `microInteracciones()` solo escribe tres números en variables CSS del hero (`--mx`, `--my`, `--sy`) y el CSS hace todo el movimiento con `transform`. Detalles que importan:

- Las escrituras se agrupan con `requestAnimationFrame`, así se escribe una vez por cuadro como máximo, no una por cada movimiento del ratón.
- Los eventos van con `{ passive: true }`, para no frenar el scroll.
- El desplazamiento por scroll se corta a los 900 px: más abajo el hero ya no se ve.
- Si la persona pidió menos movimiento, el JS ni siquiera calcula.

### Movimiento reducido

Ya existía `@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }`, que apaga las animaciones pero **no las transiciones ni los desplazamientos**. Se agregaron 5 reglas más en ese mismo bloque que apagan `transition` y ponen `transform: none` en el hero, las tarjetas, las fotos y los botones. Total: 6 reglas dentro de ese `@media`.

### Cómo se verificó

- Las 10 reglas nuevas fueron **aceptadas por el navegador** (una regla con error de sintaxis se descarta sola, así que si están, son válidas).
- La elevación de tarjeta se comprobó con `:focus-within`, que dispara exactamente las mismas declaraciones que `:hover`: la tarjeta sube a `-9px`, la sombra cambia y la foto pasa a `scale(1.069) rotate(-1.8deg)`; al quitar el foco vuelve al reposo y las otras tarjetas no se mueven.
- El parallax se comprobó moviendo el puntero y haciendo scroll: `--mx`, `--my` y `--sy` cambian y el `transform` del mosaico se actualiza.

**No se pudo verificar**: el `:hover` con ratón de verdad y el bloque de movimiento reducido, porque el panel del navegador de la sesión no entrega estados de hover ni permite cambiar la preferencia del sistema.

---

## Historial

- 2026-09-07 — Creado el mapa. No se modificó la página; solo se analizó.
- 2026-09-07 — Agregados `server.js` y `package.json` para publicar en Railway. Probado en local: responde 200 y la página se ve bien.
- 2026-09-07 — `server.js`: el respaldo de puerto pasó de 3000 a 8080 y el log ahora dice `Escuchando en http://0.0.0.0:${PORT}`. Probado con y sin la variable PORT; ambos casos responden 200.
- 2026-09-07 — Error 502 en Railway con el servidor arrancado OK. Endurecido `server.js`: `keepAliveTimeout` 65s y `headersTimeout` 66s (evita 502 intermitentes del proxy), `requestTimeout` 0 (la descarga de 19 MB no se corta), manejador de `server.on('error')`, y un log nuevo que dice si el puerto vino de la variable `PORT` o del respaldo 8080. Causa más probable del 502: el puerto destino del dominio en Railway no coincide con 8080.
- 2026-09-07 — Eliminada la barra de anuncios superior (marquesina marrón con "Melipilla, Chile — Tostado bajo pedido — …"). Se borró el `<div>` con `background: var(--color-accent-700)` que iba justo antes del `<nav>`, más su regla `@keyframes mem-marquee` (ya no la usaba nadie). El `<nav class="nav">` quedó como primer hijo del contenedor y arranca en el borde superior (`top: 0`, sin margen ni relleno residual). Verificado en el navegador: 11 secciones, 6 anclas y 27 imágenes intactas; sticky sigue funcionando. Respaldo del archivo previo en el scratchpad de la sesión.
- 2026-09-07 — Menú responsivo: hamburguesa en móvil (< 768 px) y barra horizontal en escritorio. Se agregaron `.nav-links`, `.nav-burger`, `.nav-fondo`, `.solo-escritorio`, el bloque `@media (max-width: 767px)` y el método `menuResponsivo()`. Ver sección 8. Probado en 375 px y 1280 px: sin desbordamiento horizontal, 4 formas de cierre funcionando, escritorio idéntico al anterior, 11 secciones y 27 imágenes intactas.
- 2026-09-07 — Oferta reducida a café en grano de 250 gr: textos actualizados, enlaces "Café verde" y "Guía de molienda" eliminados de barra, menú móvil y pie, y 4 vistas ocultas con `oculto-temporal` (sección de café verde, tarjeta "También en verde" y 2 testimonios). No había selectores, modales, carrito ni filtros que ajustar. Ver sección 9. Verificado en 1280 px y 375 px: 0 palabras prohibidas visibles, sin desbordamiento, 27 imágenes intactas.
- 2026-09-07 — Carrito de compras completo: controles en las 3 tarjetas, botón con contador en la barra, drawer lateral con estado vacío, persistencia en `localStorage` y mensaje consolidado de WhatsApp. Se configuró el número +56930053008. Ver sección 10. Probado en 1280 px y 375 px: agregar, sumar, restar, eliminar, vaciar bajo 1, persistir tras recargar, mensaje con el formato exacto y limpieza tras enviar.
- 2026-09-07 — Hero: `min-height` pasó de `calc(100dvh - 108px)` a `calc(100dvh - var(--nav-alto, 71px))`, lo que elimina la franja blanca de 37 px que quedó al borrar la marquesina. Favicon: el isotipo SVG incrustado como `data:` más `<title>` y `<meta description>` en el `<helmet>`. Ver sección 11. Verificado en 1280x800 y 375x812: franja de 0 px, favicon carga como imagen válida y la pestaña muestra "MEMOSSH · Café de especialidad".
- 2026-09-07 — Micro-interacciones: flotación stop-motion del isotipo, parallax del hero con cursor y scroll, elevación de tarjetas con la foto saltando, y rebote/pulso/hundido en los botones. Todo con `transform` y `opacity`. Se ampliaron las reglas de `prefers-reduced-motion` para apagar también transiciones y desplazamientos. Ver sección 12. Verificado: 10 reglas aceptadas por el navegador, elevación medida vía `:focus-within`, parallax midiendo las variables CSS, y sin errores nuevos en consola.
