# MEMORIA_ARQUITECTURA

Mapa de direcciones del proyecto **Memossh Coffee**. Se consulta ANTES de buscar archivos y se actualiza al terminar cualquier tarea que cree, modifique o elimine algo.

- Actualizado: 2026-09-09
- Raíz del repo: `C:\Users\noteb\Documents\GitHub\Memossh`
- Rama: `main`

---

## 0. REGLA CERO: ahorrar tokens. Lee esto antes que nada.

Esta bóveda **es la memoria del proyecto**, no un adorno. Se lee antes de tocar nada y se escribe en ella todo lo que se averigüe. Volver a investigar el proyecto cuesta carísimo; anotarlo aquí no cuesta nada.

**Lo que nunca hay que hacer**

- Abrir el HTML completo. Pesa **26 MB** y casi todo es base64. La página real es **solo la línea 390**.
- Volver a averiguar algo que ya está escrito en este archivo. Si está aquí, se da por sabido.
- Reescribir un archivo entero para cambiar una parte.

**Lo que sí**

| En vez de | Hacer |
|---|---|
| Leer el HTML | `sed -n '390p'` y buscar dentro de esa línea |
| Imprimir contenido para revisar | Medir y devolver un JSON corto |
| Escribir un script nuevo | Reusar los del scratchpad y los de aquí |
| Llamadas sueltas | Agrupar las que no dependen entre sí |

**Y lo más importante**: cuando algo cueste varias pruebas descubrirlo (un límite, una trampa, por qué algo no funcionó), **se anota aquí en el momento**. Eso es justamente lo que evita repetir el gasto la próxima vez.

### Direcciones rápidas (leer esto y NO buscar)

Para leer esta bóveda sin gastar: `Grep "^## "` da el índice con números de línea; después `Read` con `offset`/`limit` **solo** de la sección que haga falta. Nunca el archivo entero.

| Qué | Dónde |
|---|---|
| Página real (HTML, CSS y lógica) | Línea **390** del HTML, en texto JSON. Todo lo demás es base64 |
| Interruptores (`whatsapp`, `mostrarTestimonios`, `mostrarGaleria`) | `data-props` del `<script type="text/x-dc">`. **Ojo**: el valor real sale del `default` de ahí; cambiar solo el `?? true` del código no alcanza (§19) |
| Métodos de la lógica | `menuResponsivo` (§8) · `carritoCompras` (§10) · `microInteracciones` (§12) · `carruselCafes` (§13) · `ventanaInstagram` (§14) · `estampas` (§15) · `pasosProceso` (§16) · `resenasGoogle` (§18) · `barraFlotante` y `carritoEnMenu` (§20) |
| Cabecera y carrito | Sin barra: logo sobre la foto y botón de menú fijo; el carrito se abre desde el menú (§20) |
| Imágenes | Formato del manifest y cómo cambiar una foto (§2). Fotos pegadas en el chat: ver "Herramientas" |
| Filtro "lavado" del manual | `.washed{filter:saturate(0.6) contrast(0.85) brightness(1.1) opacity(0.94)}` en el sistema de diseño. En las tarjetas de café va más suave, y la tarjeta mirada se revela a color (§13) |
| Ocultar sin borrar | Clase `.oculto-temporal` (§9 y §19) |
| Servidor | `server.js`: `PORT`, `/health`, `/api/resenas` y `traerResenas()` (§7 y §18) |
| Vista previa | `preview_start` con nombre `start`, puerto 3000. **El servidor guarda la página en memoria al arrancar**: tras cada cambio hay que pararlo y arrancarlo de nuevo, si no se ve la versión vieja |
| Panel del navegador oculto | Congela animaciones y transiciones: medir con JS, no fiarse de capturas |

### Herramientas (el scratchpad se borra entre sesiones; aquí quedan)

**Buscar en la página** sin abrirla: dice cuántas veces aparece cada texto y muestra un trocito alrededor.

```js
// node buscar.js "texto1" "texto2"   (LARGO=200 para ver más contexto)
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('C:/Users/noteb/Documents/GitHub/Memossh/Memossh Coffee - pagina completa.html', 'utf8').split('\n')[389]);
const L = Number(process.env.LARGO || 50);
for (const a of process.argv.slice(2)) {
  let i = -1, n = 0; const m = [];
  while ((i = p.indexOf(a, i + 1)) !== -1) { n++; if (m.length < 12) m.push(i + ': ' + p.slice(Math.max(0, i - L), i + a.length + L).replace(/\s+/g, ' ')); }
  console.log('== "' + a + '" x' + n); m.forEach((x) => console.log('  ' + x));
}
```

**Editar la línea 390** sin romperla: se trabaja sobre el texto crudo, escapando igual que el original.

```js
const BS = String.fromCharCode(92);
const tpl = (h) => h.split('"').join(BS + '"').split('</').join('<' + BS + 'u002F').split('\n').join(BS + 'n');
function unico(de, a) {            // aborta si no hay exactamente 1 coincidencia
  if (t.split(de).length - 1 !== 1) throw new Error('no unico');
  t = t.replace(de, () => a);      // SIEMPRE con función: un texto con $' rompe todo
}
```

Antes de guardar: misma cantidad de líneas, `JSON.parse` de la línea 390 sin error, comentarios CSS balanceados y ninguna clave (`AIza`) en la línea 390. Siempre un respaldo antes.

**Trampa**: `extraer-clase.js` (la revisión de sintaxis) deja un `clase.js` en la carpeta desde donde se corre. Correrlo SIEMPRE desde el scratchpad. El 2026-09-11 se coló uno en el repo (commit `810fd08`); desde entonces `clase.js` está en `.gitignore`.

**Imágenes que el usuario pega en el chat**: NO quedan como archivo. Están en base64 dentro del registro de la sesión: el `.jsonl` más reciente en `C:\Users\noteb\.claude\projects\C--Users-noteb-Documents-GitHub-Memossh\`. Se saca la última así (probado 2026-09-11 con la foto de El Salvador):

```js
// node sacar-imagen-chat.js salida   -> guarda salida.jpg / salida.png
const fs = require('fs'), path = require('path');
const dir = 'C:/Users/noteb/.claude/projects/C--Users-noteb-Documents-GitHub-Memossh';
const reg = fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')).map((f) => path.join(dir, f))
  .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
const imgs = [];
const walk = (o) => { if (!o || typeof o !== 'object') return; if (o.type === 'image' && o.source && o.source.data) { imgs.push(o.source); return; } for (const k in o) walk(o[k]); };
fs.readFileSync(reg, 'utf8').split('\n').forEach((l) => { if (l.includes('"image"') && l.includes('base64')) { try { walk(JSON.parse(l)); } catch (e) {} } });
const u = imgs[imgs.length - 1];
fs.writeFileSync((process.argv[2] || 'imagen-chat') + '.' + u.media_type.split('/')[1].replace('jpeg', 'jpg'), Buffer.from(u.data, 'base64'));
```

Ojo: las capturas con anotaciones de la vista previa también son imágenes: si el usuario manda una foto y después una captura, la "última" es la captura. Revisar el tamaño antes de usarla.

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
| **378** | `__bundler/manifest`: 26 MB en una sola línea. Recursos en base64: **41** al 2026-09-11 (JPG, SVG, el MP4 y JS) | Solo para agregar/quitar imágenes |
| 382 | `__bundler/ext_resources`: apunta a `heroReel` (el video) y a React/ReactDOM 18.3.1 de unpkg | Rara vez |
| 386 | `__bundler/page_order`: vacío `[]` | No |
| **390** | **La página real** (~65 KB, HTML escapado dentro de un string JSON) | **Aquí se edita todo** |

### Comandos útiles (no leer el archivo completo)

```bash
sed -n '390p' "Memossh Coffee - pagina completa.html" > tpl.txt   # extraer la página
grep -o -E '<h2[^>]*>[^<]{0,60}' tpl.txt                          # ver títulos
```

Para editar: `sed -i 's/texto viejo/texto nuevo/' ` sobre la línea 390, o el editor de archivos apuntando a esa línea. Ojo: dentro de la línea 390 las comillas van escapadas (`\"`) y los saltos de línea son `\n` literales.

### Cambiar o agregar una imagen (probado 2026-09-11)

- La línea 378 es un objeto JSON: `{"<uuid>":{"mime":"image/jpeg","compressed":false,"data":"<base64>"}, ...}`. Algunos SVG van con `"compressed":true` (gzip).
- En la página (línea 390) cada imagen es `<img src="<uuid>">`. Al cargar, el desempaquetador cambia cada uuid por una dirección `blob:`.
- Para poner una foto nueva: **agregar** una entrada con un uuid nuevo al principio del objeto (`'{"' + id + '":{...},' + resto`) y cambiar el `src` solo donde corresponda. No se pisa la vieja: la misma foto puede usarse en otro lado.
- Ejemplo real: la foto de El Salvador (`0f5179c5-…`) también es un cuadro de la portada ("Dos formatos de bolsa"). Por eso la tarjeta recibió una entrada nueva (`2e03c585-e605-4448-92f3-f8ac62d9320c`) y la portada quedó igual. Script: `foto-salvador.js`.
- Antes de guardar: `JSON.parse` de la línea 378 y comprobar que la entrada nueva y la vieja existen.
- Si la entrada la agregamos nosotros y solo la usa un lugar, basta con cambiar su `data`. Así se pasó El Salvador a la foto del atardecer (`foto-salvador-2.js`), ajustando además `object-position` en la tarjeta según dónde está la bolsa en la foto.
- **Script general para cambiar la foto de una tarjeta** (2026-09-11): `cambiar-foto-tarjeta.js <data-id> <foto> "<alt>" <y%>`. Busca la tarjeta por su `data-id` (`valle`, `salvador`, `matagalpa`), agrega la foto al manifest con un id nuevo, cambia `src`, `alt` y encuadre, y verifica todo. Si el scratchpad ya no existe, se rehace con los pasos de arriba. Encuadre: las tarjetas son 5:4 y las fotos del celular son verticales (720×1280), así que se ven ~576 px de alto. `y%` = (centro de la etiqueta − 288) / 704.

---

## 3. Secciones de la página (en orden)

| # | Ancla | Título visible | Notas |
|---|---|---|---|
| 1 | — | Nav pegajoso (sticky) | Enlaces: `#cafes`, `#proceso`, `#mayorista` (**oculto**, sección 19), `#contacto` (ver sección 8) |
| 2 | `#top` | "Sonríe, tenemos café para empezar." | Hero con video de fondo (`heroReel`). Altura fluida con `--nav-alto`, ver sección 11. Botones "Pedir por WhatsApp" y "Ver los cafés" **ocultos** desde 2026-09-11 (sección 19) |
| 3 | — | 4 tarjetas | Tostado bajo pedido / Origen en la bolsa / Envíos a todo Chile. La 3ª ("También en verde") está **oculta**, ver sección 9 |
| 4 | — | "El Salvador / Bourbon lavado" | Bloque de origen destacado ("El más pedido", botón "Pedir esta bolsa"). Hasta el 2026-09-11 era "Nicaragua / Valle de Matagalpa"; como ese café ya no se vende, el usuario pidió poner uno de los que están a la venta. Se eligió El Salvador (versátil, para no expertos). Foto: la bolsa con la cordillera (`d65b2ade-3ead-47db-9503-f005c2828242`); la vieja `7c6bee08` sigue en la portada. Ficha: Bourbon · 1.600 msnm · Medio · 250 gr. Script `destacado-salvador.js`. Tiene la estampa de esta sección: se ubica con `porTitulo('Bourbon lavado')` |
| 5 | `#cafes` | "Tres orígenes, tres…" | Valle del Amazonas (foto nueva 2026-09-11: bolsa negra sobre madera, `49067eaf-3795-43d4-9d8d-24a11b5e3cf5`, copia en `Memosh bobeda/valle-amazonas.jpg`; la vieja `fe73abbd` sigue en la portada) · El Salvador · **Brasil** (Robusta, $10.000, desde 2026-09-11; antes Nicaragua, Matagalpa). Brasil: etiqueta "Lavado · Cuerpo alto", línea "Para espresso y vending", foto nueva `5f7bec30-ac4d-41ba-afec-f0f6de48bae7` (copia en `Memosh bobeda/brasil-robusta.jpg`); la foto vieja `91a990a9` sigue en la portada. Se quitó la etiqueta "El más pedido" de esa tarjeta porque era del Nicaragua. Foto de El Salvador desde 2026-09-11: bolsa sobre una roca al atardecer, en la entrada `2e03c585` del manifest (copia en `Memosh bobeda/salvador-atardecer.jpg`). La que hubo antes ese mismo día (bolsa en la mano con la cordillera) quedó en `salvador-montana.jpg` |
| 6 | `#verde` | "¿Tuestas en casa? Te vendemos el grano verde" | Fondo oscuro. **OCULTA** desde 2026-09-07 (ver sección 9). |
| 7 | `#proceso` | "Del productor a tu taza, sin atajos" | 3 pasos: Elegimos el lote / Tostamos bajo pedido / Enviamos fresco |
| 8 | — | "Que nunca te falte café" | Suscripción. **OCULTA** desde 2026-09-11 (ver sección 19) |
| 9 | — | "Lo que dicen los que ya lo probaron" | Etiqueta "Clientes". **OCULTA** desde 2026-09-11: `mostrarTestimonios` con `default` false (ver sección 19). Tiene 1 de 3 testimonios activos (ver sección 9) |
| 10 | `#mayorista` | "Café para tu cafetería u oficina" | **OCULTA** desde 2026-09-11 (ver sección 19) |
| 11 | — | "¿Cómo nació el proyecto?" | Etiqueta "Nosotros". Fondo oscuro. Desde 2026-09-11 lleva el texto del usuario en 3 párrafos (antes: "El mimo que no se calla el café", 2 párrafos; el texto viejo está en el commit `810fd08`). Botón "Ver el Instagram" **oculto** (sección 19) |
| 12 | — | "El café, de cerca" | **APAGADA** desde 2026-09-07: `mostrarGaleria` en false, ver sección 14 |
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
- **Dominio propio (revisado 2026-09-09)**: `memossh.com` **no está registrado por nadie** (`nslookup` → "Non-existent domain"). Por eso Railway muestra "Waiting for DNS update" para siempre: primero hay que comprarlo. Opciones: seguir con la dirección gratis `*.up.railway.app`, o comprar `memossh.cl` (NIC Chile) o `memossh.com` y apuntarlo con el registro CNAME que da Railway en "Show DNS records". No hace falta tocar código. No usar dominios "gratis" .tk/.ml/.ga: se marcan como sospechosos.

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

> **Cambió el 2026-09-11**: el menú desplegable ahora rige en **todos los anchos** (su bloque pasó a `@media all`), no hay barra y el carrito se abre desde el menú. Ver sección 20. El cierre al pasar de 768 px sigue en el código, pero solo actúa si se cambia el tamaño de la ventana con el menú abierto.

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
| Fila "Molemos para" (V60, Espresso, Moka…) | al final de la sección de cafés. **Detectada el 2026-09-07**: no decía "molido" ni "molienda", por eso no salió en la búsqueda original |

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
| Brasil (Robusta) — antes "Nicaragua, Matagalpa" a $8.000 | `matagalpa` (se dejó el id viejo para que los carritos guardados sigan funcionando) | $10.000 desde 2026-09-11 |

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

> **Cambió el 2026-09-11**: el botón del carrito de la barra (`.cc-abrir`) quedó **oculto**, pero sigue siendo el que abre el carrito. El cliente entra por la línea "Carrito" del menú, que le hace clic por dentro. Ver sección 20.

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

> **Cambió el 2026-09-11**: con la barra flotante (sección 20) la portada va detrás de la cápsula, así que ahora es `min-height: 100dvh` más un `padding-top` que deja el texto siempre por debajo de la cápsula.

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

## 12. Movimiento y micro-interacciones

**Reescrito el 2026-09-07** tras la revisión visual: la primera versión usaba `steps()` buscando un efecto stop-motion y se veía a tirones, y no había nada de movimiento bajo la portada.

Todo el movimiento usa **una sola curva**, `--ritmo: cubic-bezier(0.22, 1, 0.36, 1)`: acelera rápido y frena largo. Es lo que hace que se sienta suave en vez de mecánico. Solo se animan `transform` y `opacity`.

### Qué se mueve, de arriba a abajo

| Dónde | Qué hace |
|---|---|
| Isotipo del hero | Flota 11 px, ciclo de 6,5 s, **continuo** (antes `steps(9)`, de ahí el efecto de 5 fps) |
| Mosaico y contenido del hero | Parallax con el cursor y con el scroll, en sentidos opuestos |
| Barra superior | Gana una sombra suave apenas se baja (clase `bajando` en el `<html>`) |
| Enlaces del menú (escritorio) | Subrayado que crece de izquierda a derecha |
| **Cada bloque de cada sección** | Aparece subiendo 18 px y fundiéndose, escalonado de a 70 ms |
| Tarjetas de producto | Suben 7 px con sombra; la foto hace un zoom de 900 ms a 1,055 |
| Cualquier `figure.washed` | Zoom sereno a 1,04 al pasar el cursor |
| Botones | Suben 2 px con sombra; al hacer clic se apoyan (`scale(0.985)`, 90 ms) |
| Carrito, menú, cerrar | Se hunden al tocarlos |
| Anclas del menú | `scroll-behavior: smooth` con `scroll-padding-top`, así el destino no queda tapado por la barra |
| Teclado | `:focus-visible` con contorno propio |

### La aparición al scroll: cómo funciona y por qué NO usa IntersectionObserver

El JS recorre cada `section` y `footer`, baja un nivel si la sección es un solo envoltorio, y marca a sus hijos con la clase `rv` (o `rv-fade` si el elemento ya tiene una animación propia, para no pisarle el `transform`). **Lo que ya se ve al cargar no se marca**, así no hay parpadeo inicial.

La primera versión usaba `IntersectionObserver` y **se saltaba bloques cuando el scroll iba rápido**: quedaban invisibles para siempre. Se comprobó en la práctica: 6 bloques quedaron en blanco. Ahora la revisión corre **en cada cuadro de scroll** recorriendo la lista de pendientes, que se va vaciando sola. Es determinista: si un bloque entra en pantalla, se revela, sin importar la velocidad.

Además hay una **red de seguridad a los 8 segundos** que revela cualquier pendiente. Y las clases las pone el JS, no el HTML: **si el JavaScript fallara, nada queda invisible.**

Verificado con un barrido de un cuadro por paso en 1024 px y en 375 px: 25 de 25 bloques revelados, 0 invisibles.

### Movimiento reducido

El bloque `@media (prefers-reduced-motion: reduce)` apaga transiciones, parallax, zooms y el scroll suave, y **fuerza `opacity: 1`** en los bloques marcados para que el contenido se vea igual.

---

## 13. Carrusel de cafés (celular y tablet)

Las tres tarjetas apiladas alargaban demasiado la página en pantallas chicas. Bajo **900 px** el mismo contenedor se convierte en un carrusel que se desliza con el dedo.

**Sobre 900 px no cambia nada**: sigue siendo la grilla de tres columnas de siempre.

### Medido antes y después, en 375 px

| | Antes | Ahora |
|---|---|---|
| Alto de la sección de cafés | 2158 px | **969 px** (−55 %) |
| Alto total de la página | 12231 px | **11043 px** |

### Cómo funciona

- El contenedor pasa a `grid-auto-flow: column` con tarjetas de `min(78%, 340px)` y `scroll-snap-type: x mandatory`, así cada deslizada engancha en una tarjeta.
- Se sale del margen de la sección con `margin-inline` negativo para que **la tarjeta siguiente asome**: eso es lo que le dice al usuario que puede deslizar, sin poner un cartel.
- La barra de scroll se oculta (`scrollbar-width: none` y el equivalente de WebKit).
- **La tarjeta centrada se ve entera; las de al lado se achican a 0,93 y bajan a 0,55 de opacidad.** El JS escribe `--esc` y `--op` en cada cuadro de scroll según lo lejos que esté cada tarjeta del centro, y el CSS las aplica. Al no haber `transition`, el efecto sigue al dedo en tiempo real en vez de ir atrasado.
- Debajo hay **puntos de posición**: el activo se estira a 28 px y se pinta del rojo de la marca. Se puede tocar cualquiera para ir a esa tarjeta.

### Dónde está

| Pieza | Selector |
|---|---|
| Contenedor | `.carrusel` (la clase se la pone el JS al contenedor que ya existía) |
| Puntos | `.carrusel-puntos` y `.carrusel-punto.activo` |
| Lógica | método `carruselCafes()`, llamado desde `componentDidMount()` |

**No se tocó el HTML**: el método toma el padre de la primera `.producto`, le agrega la clase y crea los puntos. Si el JS fallara, las tarjetas se ven apiladas como antes, nunca rotas.

Con movimiento reducido se apagan el achicado, el apagado y el scroll suave; el carrusel sigue funcionando al deslizar.

### Verificado

375 px y 820 px: el carrusel desliza, los puntos marcan la tarjeta correcta al deslizar y al tocarlos, y la tarjeta centrada se destaca. 1024 px: las tres tarjetas siguen en una fila, los puntos ocultos y sin achicado ni transparencia. Sin scroll horizontal en la página, 26 de 26 bloques con aparición al scroll y 0 imágenes rotas.

### Fotos que lucen, con el lavado del manual (2026-09-11)

El usuario sintió las fotos de las tarjetas apagadas. La causa es el filtro "lavado" del sistema de diseño (`.washed`: saturación 0.6, contraste 0.85, brillo 1.1, opacidad 0.94). Sin tocar esa regla general:

- En las tarjetas (`.producto figure.washed`) el lavado en reposo es **suave**: `saturate(0.85) contrast(0.96) brightness(1.03)`.
- **La tarjeta que se está mirando se revela a color completo** (`filter: none`, 700 ms): con el mouse encima en computador, o la del centro del carrusel en celular.
- El carrusel marca la del centro con la clase `al-centro` (una línea nueva en su `pintar()`, junto a los puntitos).

Medido en 375 px: El Salvador al centro → `filter: none`; Valle y Brasil a los lados → lavado suave. Script: `fotos-lucen.js`.

---

## 14. Ventana de Instagram

La galería de fotos se apagó y en su lugar el panel rojo de contacto muestra el **Instagram real** de la marca.

### Qué se hizo

| Antes | Ahora |
|---|---|
| Sección "Galería — El café, de cerca" con 5 fotos | Apagada (sus fotos ya están en Instagram) |
| Monito decorativo en el panel rojo | Ventana con el feed real de `@memossh_coffee` |

La galería **no se borró**: se apagó con el interruptor `mostrarGaleria` que ya existía. Para traerla de vuelta se cambia `?? false` por `?? true` en `renderVals()`, o se activa la opción en el panel del editor.

### Cómo funciona la ventana

Usa `https://www.instagram.com/memossh_coffee/embed` dentro de un `<iframe>`. **Se comprobó en el navegador que Instagram sí permite incrustar esa dirección desde otro sitio** (la web normal de Instagram no lo permite; el `/embed` sí). Muestra el nombre, la foto, los seguidores y las últimas publicaciones reales, y se actualiza solo.

### Por qué no se ve "pegado encima"

- Va dentro de un marco con el mismo `border-radius`, la misma sombra y la misma tipografía del sitio.
- Arriba tiene una barra propia con el ícono, `@memossh_coffee` y un enlace "Ver perfil", escrita con las fuentes y colores de la marca.
- **Mientras carga se ve un bloque tranquilo con un brillo que lo cruza**, y cuando el contenido llega, el feed entra subiendo 12 px con un fundido de 620 ms. Así no aparece un rectángulo blanco de golpe.
- Verificado en el navegador: a los 250 ms el esqueleto está visible y el feed en opacidad 0; después queda al revés.

### La sección: invitación a seguir en Instagram

Desde el 2026-09-07 el panel rojo dejó de ser un bloque de contacto genérico y pasa a ser la invitación a seguir la cuenta:

- Rótulo **Novedades**, título **Síguenos en Instagram** y un texto sobre los lotes nuevos y cuándo tuestan.
- Botón principal **Seguir en Instagram** (relleno crema); **Pedir por WhatsApp** queda de secundario.
- **Sobre 960 px: dos columnas.** El mensaje a la izquierda (alineado a la izquierda) y el feed a la derecha, en 540 px fijos. Así el panel queda lleno y equilibrado.
- **Bajo 960 px: una columna centrada**, con el feed debajo.
- El feed va **montado sobre el crema** con 10 px de margen y esquinas redondeadas, no pegado al borde de la tarjeta.

  Primero se probó en una sola columna centrada también en escritorio y **no funcionó**: quedaba una tarjeta blanca chica flotando en medio de un campo rojo enorme, con mucho vacío alrededor. Se veía pegada encima, no diseñada. Las dos columnas resuelven eso.
- Se conservan el horario y el botón de WhatsApp: siguen siendo el punto de contacto del sitio.

### El ancho del feed: 540 px es el máximo real

**Probado en el navegador**: el `/embed` de Instagram crece hasta **540 px** y ahí muestra 3 columnas de fotos grandes. Más ancho que eso **no se estira**: deja un vacío blanco al lado. Por eso la ventana tiene `max-width: 540px` y no más.

El feed muestra siempre **6 publicaciones** (2 filas de 3), así que el alto se calcula solo:

    height: calc(148px + min(540px, 100vw - 108px) * 0.667);

148 px de cabecera del feed, más dos tercios del ancho (las dos filas de fotos). El `100vw - 108px` es el ancho disponible en celular: la pantalla menos los márgenes de la sección y del panel. Así no sobra blanco ni se corta la última fila en ningún tamaño de pantalla.

### Los videos NO se reproducen solos

El feed va dentro de un `iframe` de instagram.com. Por seguridad, **el navegador no deja que esta página toque nada de lo que hay adentro**: no se puede pedir que los videos partan, ni silenciarlos, ni cambiarles el tamaño. Instagram muestra la miniatura con el ícono de play y el video parte al tocarlo. Es una limitación de Instagram, no del sitio.

Si algún día se quisiera video reproduciéndose solo en esa sección, habría que subir los archivos a la página (como el video del hero) y dejarían de ser el Instagram real: serían copias que hay que actualizar a mano.

### Dónde está

| Pieza | Selector |
|---|---|
| Marco completo | `.ig-ventana` (recibe la clase `listo` al cargar) |
| Barra superior | `.ig-barra`, `.ig-usuario`, `.ig-ver` |
| El iframe | `.ig-feed` |
| Bloque de carga | `.ig-esqueleto` con la animación `ig-brillo` |
| Lógica | método `ventanaInstagram()`, llamado desde `componentDidMount()` |

Alto: 430 px en escritorio, 390 px bajo 560 px de ancho.

### Cosas a tener presentes

- **La ventana carga contenido de Instagram (Meta)**: eso trae sus cookies y su seguimiento a la página. Es lo normal en cualquier sitio que muestre su feed, pero conviene saberlo.
- Si Instagram cambiara o bloqueara el `/embed`, la ventana quedaría vacía. En ese caso se apaga borrando el bloque y volviendo a encender la galería.
- Se conservaron el título "Sonríe, hay café.", el texto, los botones de WhatsApp e Instagram y el horario: son el principal punto de contacto del sitio.

---

## 15. Estampas de la marca

Los 6 stickers de MEMOSSH aparecen pequeños en el cierre de algunas secciones.

### De dónde salieron

El original era **una lámina JPEG con los 6 stickers en una grilla de 2x3**, tinta negra sobre papel blanco. Node no sabe leer JPEG, así que el recorte se hizo **en el navegador**: un servidor de un solo uso (`scratchpad/servidor-stickers.js`) sirve la lámina y una página que la procesa con canvas y devuelve cada sticker ya listo.

El proceso, por si hay que repetirlo:

1. Se marca como tinta todo lo que tenga luminancia menor a 200.
2. Con proyecciones por fila y por columna se detectan las bandas: 3 filas x 2 columnas = 6 cajas. **No se corta por división fija**, se detecta.
3. Cada caja se cuadra (el sticker es un círculo) y se recorta.
4. **El papel se quita usando la luminancia como transparencia**: `alfa = 255 - luminancia`. Así queda solo la tinta, con los bordes suaves en vez de dentados, y nada de fondo blanco. Todo el dibujo se pinta de negro plano.
5. Se achica a 260x260 y se guarda como PNG.

Resultado: 6 PNG de ~38 KB, 227 KB en total, incrustados en el CSS como `data:`. Comprobado: esquinas transparentes, 100 % de lo opaco es negro, 0 % blanco.

### Dónde están

Una por sección, alternando lado, en las 6 secciones **claras que tienen espacio libre abajo**:

| Sección | Lado |
|---|---|
| Bloque destacado (hoy "El Salvador / Bourbon lavado"; antes Nicaragua) — se busca con `porTitulo('Bourbon lavado')`: si cambia el título, cambiar también esa búsqueda o la estampa desaparece | derecha |
| Los tres orígenes (`#cafes`) | izquierda |
| Del productor a tu taza (`#proceso`) | derecha |
| Que nunca te falte café (suscripción) | izquierda |
| Lo que dicen los que ya lo probaron | derecha |
| Café para tu cafetería (`#mayorista`) | izquierda |

**No se pusieron** en la fila de 4 tarjetas (solo tenía **45 px libres abajo**, la estampa pisaba el texto de "Envíos a todo Chile"), ni en el hero, ni en los bloques oscuros, ni en el pie. Existe la clase `.estampa-clara` (con `invert(1)`) por si algún día se quiere poner una sobre fondo oscuro.

### Cómo se comportan

- **Escritorio y tablet**: en posición absoluta, en la esquina inferior, dentro del margen que ya tenía la sección. Tamaño `clamp(54px, 6vw, 88px)`, opacidad 0.85, con una inclinación leve (-6° a la derecha, +5° a la izquierda). Al pasar el cursor por la sección se enderezan un poco y suben a opacidad 1.
- **Bajo 700 px**: pasan a `position: static`, **centradas al final de la sección**, de 46 px. En pantalla chica no queda ninguna esquina libre, así que ponerlas en el flujo es la única forma de garantizar que no pisen nada. Además funciona bien: quedan como un cierre de sección.

Verificado midiendo cruces de rectángulos contra todo el texto e imágenes de cada sección: **0 choques en 1280 px y 0 en 375 px**.

### Dónde está

| Pieza | Selector |
|---|---|
| Estilo base | `.estampa`, más `.estampa-der` / `.estampa-izq` |
| Las 6 imágenes | `.estampa-0` a `.estampa-5` (data URI en el CSS) |
| Versión para fondo oscuro | `.estampa-clara` |
| Colocación | método `estampas()`, llamado desde `componentDidMount()` |

Las estampas **se agregan desde JavaScript**, no están en el HTML. Si eso fallara, la página queda exactamente como antes.

---

## 16. Los tres pasos del proceso: la pista de tueste

**Rehecho dos veces.** Primero era un dibujo animado por paso con los pasos inactivos desenfocados: el usuario dijo que **el desenfoque daba sensación de suciedad**. Después fue un solo grano viajero automático. Ahora son **cinco granos** y **el avance lo manda el mouse**.

### Qué se ve

- Una **línea une los tres números** y detrás del avance se pinta de rojo.
- **Cinco granos sobre la línea**: uno en cada paso y uno entre medio. Van de verde a muy tostado: `#9fb894`, `#d8c07a`, `#b5793f`, `#7a4a2a`, `#3b2a20` (los colores de la lámina que mandó el usuario).
- Los granos ya alcanzados quedan **llenos y con sombra**; los que faltan quedan al 28 % de opacidad. Se ve el tueste avanzar grano a grano.
- El paso activo se enciende; los otros **solo se apagan a 0.45**. Nunca hay desenfoque.

### Qué manda el avance

| Dónde | Qué lo controla |
|---|---|
| Computador (línea horizontal) | **La posición del mouse** dentro de la sección. Nada automático. |
| Celular (línea vertical) | El scroll, **de forma continua** (desde 2026-09-11): la punta de la línea roja sigue a la línea de lectura, al 58 % de la pantalla. |

El modo se detecta comparando la altura del primer y el tercer número, no con un ancho fijo.

### Detalles que costaron encontrar

- **El círculo del número mide 52 px**, no 34. Los granos van a **54 px** de la línea: radio del círculo (26) + medio grano (19) + aire.
- **Los granos cuelgan de la reja, no de la línea.** La línea tiene `z-index: 0` para quedar debajo de los números; un hijo suyo quedaría debajo también. Van sueltos con `z-index: 3`.
- ~~En celular los dos granos de en medio se ocultan~~ (así fue hasta el 2026-09-11). Ahora hay aire entre los pasos y esos granos van **en el medio de ese aire**, calculado como "fin del texto del paso" hasta "número siguiente". Si el aire mide menos de 90 px (por ejemplo, con movimiento reducido), se vuelven a ocultar.

### Celular: recorrido largo (2026-09-11)

El usuario dijo que en celular la progresión era **muy corta para disfrutarla**: se encendía el paso más cercano, así que saltaba 1 → 2 → 3 en unos 500 px. Ahora:

- **Aire entre pasos**: `.pista-vertical > .paso:not(.paso-ultimo) { padding-bottom: clamp(140px, 40svh, 360px) }`. La clase `pista-vertical` la pone `medir()` solo cuando los números están apilados; `paso-ultimo` marca el tercero.
- **Avance continuo**: `avanceP = (lectura − centro del número 1) / (número 3 − número 1)`. Medido en 375 × 812: la sección pasó de ~560 a **1.565 px**, el recorrido de 0 a 100 % dura **~1.080 px** y sube parejo, **14 % cada 150 px**.
- **Paso encendido** = el último número que ya cruzó la línea de lectura (en computador sigue siendo el más cercano al mouse).
- **Granos tostados** según su posición real en la línea (arreglo `fraccion`), no a cuartos fijos.
- **El texto va a la derecha de la línea**: `padding-left: 64px` en el título y el texto de cada paso. Antes la línea vertical cruzaba el texto; con el rojo se notaba más. Ojo: tiene que ser `padding`, porque el `margin` del título y el texto viene fijado en línea y le gana al CSS.
- Trampa al medir: la sección se corre mientras cargan las fotos de arriba. Hay que calcular su posición **en cada paso de la prueba**, no una sola vez al principio; si no, parece que el avance salta y retrocede.

Script: `proceso-celular.js`. Computador sin cambios (sigue el mouse).

> Este modo quedó como **respaldo**: rige solo si la pantalla mide menos de 560 px de alto o si está activado el movimiento reducido. Lo normal en celular ahora es la escena fija de abajo.

### Celular: escena fija (2026-09-11, versión vigente)

El recorrido largo con aire entre pasos dejó **huecos vacíos** y el usuario pidió algo "agradable y profesional". Se hizo una escena fija, al estilo de las páginas de producto:

- La reja queda **quieta en pantalla** (`position: sticky`, arriba a `max(84px, 50vh − 250px)`) mientras se baja por un espacio `.proceso-recorrido` de **170svh**. Al terminar, se suelta y la página sigue.
- **Arriba**, un grano grande (104 px) dentro de un **anillo de avance** rojo (SVG, `stroke-dashoffset`). El color del grano **se mezcla de forma continua** entre los 5 tuestes (`mezclar()`), gira de −18° a +18° y tiene un halo del mismo color. Al cambiar de paso hace un "latido" (`escena-pulso`).
- **En medio**, la escala de 5 granos con su línea: son los mismos `.grano-linea` y `.pista`, puestos en fila bajo el anillo.
- **Abajo**, **un paso a la vez**: los tres ocupan la misma celda. El activo se ve y los otros quedan en opacidad 0, corridos 16 px (el anterior hacia arriba y el siguiente hacia abajo). Paso activo por tercios del avance.
- Se activa si el ancho es menor a 768 px, el alto al menos 560 px y no hay movimiento reducido (`medir()` pone la clase `proceso-fijo`).

**Trampa de la estampa** (reportada por el usuario): la reja, el recorrido y la estampa son hijos directos de `#proceso`. Un `sticky` se queda quieto **hasta el final del contenido de su padre**, así que lo último que haya en el flujo de la sección (la estampa) pasaba por debajo del paso 3. Arreglo: con la escena activa, `medir()` pone `con-escena` en la sección y la estampa va `position: absolute` en un `padding-bottom` de 112 px, centrada a 32 px del borde. Medido: nunca se pisan; al soltarse la escena quedan **34 px de aire** y luego bajan juntas. **Regla general: nada en el flujo después de la escena dentro de `#proceso`.**

**Trampas**: la reja tenía `position: relative` en línea (lo pone el mismo `pasosProceso()` al iniciar), por eso el `sticky` va con `!important`; lo mismo el `grid-template-columns`. En pantallas táctiles también hay `pointermove`: se ignora en la escena fija para que el dedo no mueva el avance.

Medido en 375 × 812: la escena se queda a 156 px del borde durante 1.380 px de scroll y el anillo, el color y los pasos avanzan con él. Visto con capturas al 18 % (paso 1), 55 % (paso 2, grano caramelo) y 93 % (paso 3, grano oscuro). Script: `proceso-escena.js`.

### Sobre el PNG de granos del usuario

El usuario mandó una lámina con 6 granos pintados. **Ese archivo nunca se guardó en el computador**: solo estaba en el chat, y para incrustarlo hace falta el archivo en disco. (Desde 2026-09-11 se sabe que las imágenes del chat quedan en el registro `.jsonl` de la sesión: ver "Herramientas" en la sección 0. Esa lámina se podría recuperar de ahí, buscándola por tamaño, porque no es la última imagen.) Mientras tanto los granos son **SVG dibujados en el estilo de trazo del sitio**, con los colores tomados de esa lámina.

### Dónde está

| Pieza | Selector |
|---|---|
| Cada paso | `.paso` (y `.activo` en el encendido) |
| La línea | `.pista`, con `.pista-riel` y `.pista-avance` |
| Los granos | `.grano-linea` (y `.tostado` cuando ya pasó), relleno `.grano-cuerpo` con `var(--tueste)` |
| Lógica | método `pasosProceso()`, llamado desde `componentDidMount()` |

---

## 17. Dos arreglos de acabado

### La costura entre la sección oscura y el panel rojo

El `#contacto` tenía `padding-top: 0`, así que el panel rojo **arrancaba pegado** al bloque oscuro de arriba: se veía una línea dura y las esquinas redondeadas chocaban con el borde. Ahora tiene `padding-top: clamp(52px, 7vw, 90px)` y el panel flota sobre el crema. Medido: pasó de **0 px a 90 px** de separación.

### El corte de las dos columnas de Instagram

Estaba en 960 px y a 1000 px de ancho la columna de texto quedaba en **190 px**: un hilo. El corte subió a **1180 px**, que es donde el texto tiene al menos 310 px. Medido: a 1000 px queda en una columna (texto de 512 px) y a 1280 px en dos columnas (372 + 540).

---

## 18. Reseñas reales de Google Maps

La sección "Lo que dicen los que ya lo probaron" puede mostrar **las reseñas de verdad de Google**, actualizadas solas. Está armado y probado; **falta solo configurar la clave y el lugar** en Railway.

### Cómo funciona

1. El servidor (`server.js`) expone **`/api/resenas`**. Le pregunta a Google por el negocio y devuelve las reseñas en JSON.
2. La página pide esa dirección al cargar y **dibuja las tarjetas con el diseño del sitio**: estrellas, la frase, el nombre y cuándo la escribieron, más una línea arriba con la nota y un enlace a Google.
3. Si no hay reseñas, si falta la configuración o si Google falla, **la página queda exactamente como estaba**. Nunca se rompe ni muestra un error al cliente.

### La clave NUNCA va en la página

`GOOGLE_API_KEY` y `GOOGLE_PLACE_ID` se leen con `process.env` **solo en el servidor**. La página únicamente pide `/api/resenas`, que no lleva ninguna clave. Si la clave estuviera en la página, cualquiera podría copiarla del código y gastar el saldo.

Hay una comprobación automática en los scripts que **aborta si detecta una clave escrita en la página**. Ojo con un falso positivo: el texto `AIza` aparece por casualidad una vez dentro de los 26 MB de datos codificados de la línea 378. Por eso la comprobación mira **solo la línea 390**.

### Los topes: por qué no puede llegar un cobro

Hay tres frenos en el servidor, todos probados:

| Freno | Qué hace | Se cambia con |
|---|---|---|
| **Guardado de 12 horas** | Da igual si entran 10 visitas o 10.000: a Google se le pregunta como mucho 2 veces al día | `GOOGLE_HORAS_CACHE` |
| **Tope duro diario** | Aunque algo falle o alguien recargue mil veces, el servidor **no llama a Google más de 4 veces al día** | `GOOGLE_MAX_DIA` |
| **Espera de 1 hora tras un error** | Si Google contesta con error, no se reintenta en cada visita | fijo en el código |

**Probado, no supuesto:**

- Con el tope en 3 y 10 visitas seguidas: se llamó a Google **3 veces**, y **las 10 visitas vieron las reseñas igual** (se sirven de la copia guardada).
- Con Google fallando y 10 visitas: se llamó **1 sola vez**; las otras 9 recibieron "se reintenta más tarde" sin tocar a Google.

**Sin configurar, no llama ni una vez**: cuesta cero mientras no se pongan las variables.

> **Importante**: estos topes son del servidor. El freno definitivo lo pone Google: en Google Cloud hay que **limitar la cuota diaria de la clave** y **restringir la clave a la Places API**. Si la clave se filtrara, el contador del servidor no protegería nada; la cuota de Google sí.

### El gasto

- **Sin configurar, no llama a Google ni una vez**: cuesta cero.
- Ya configurado, las respuestas **se guardan 12 horas**. O sea **2 consultas al día** en uso normal, y como mucho 4 por el tope, sin importar cuánta gente entre al sitio. Google da un crédito gratis mensual que cubre de sobra ese volumen.
- Aun así conviene ponerle en Google Cloud un **tope diario de consultas** y una alerta de presupuesto, para que no pueda sorprender nunca.

### Lo que hace falta para encenderlo

1. Que Memossh tenga **ficha en Google Business** (si ya le dejan reseñas en Maps, la tiene).
2. El **Place ID** del negocio (se saca del buscador de Place ID de Google).
3. Una **clave de la Places API** creada en Google Cloud, restringida a esa API.
4. En Railway → Variables: `GOOGLE_API_KEY` y `GOOGLE_PLACE_ID`.

### Límite de Google que no se puede saltar

**Google entrega como máximo 5 reseñas** y las elige él ("las más relevantes"). No se pueden traer todas ni escoger cuáles. Cualquier servicio que prometa más lo hace raspando la web de Google, contra sus condiciones, y se rompe seguido.

### Dónde está

| Pieza | Dónde |
|---|---|
| Consulta a Google y caché | función `traerResenas()` en `server.js` |
| La dirección | `/api/resenas` en `server.js` |
| Dibujo de las tarjetas | método `resenasGoogle()` en la página |
| Estilos | `.resenas-nota`, `.resenas-estrella`, `.resenas-enlace`, `.resenas-estrellas`, `.resenas-cita`, `.resenas-pie` |

Probado de punta a punta con datos de ejemplo: se dibujaron 3 tarjetas con estrellas, frase, autor y fecha, más la línea "★ 4,9 · 37 reseñas en Google · Ver todas en Google". Sin configuración, la página queda intacta.

---

## 19. Secciones en desarrollo (ocultas)

Pedido del 2026-09-11: ocultar **Suscripción, Clientes y Mayorista** mientras se terminan. **Nada se borró**: todo sigue en la página, solo no se ve.

| Qué | Cómo se ocultó | Para volver a mostrarlo |
|---|---|---|
| Sección Suscripción ("Que nunca te falte café") | clase `oculto-temporal` en su `<section>` | quitar esa clase |
| Sección Clientes ("Lo que dicen los que ya lo probaron") | interruptor `mostrarTestimonios`: `default` en **false** dentro de `data-props` | poner `default` en true |
| Sección Mayorista (`#mayorista`) | clase `oculto-temporal` en su `<section>` | quitar esa clase |
| Enlace "Cafeterías" del menú (`#mayorista`) | clase `oculto-temporal` en el `<a>` | quitar esa clase |
| Pie de página: "Suscripción" y "Mayorista" | clase `oculto-temporal` en sus `<li>` | quitar esa clase |
| Portada: botones "Pedir por WhatsApp" y "Ver los cafés" | clase `oculto-temporal` en la fila (`<div>` flex) que los contiene | quitar esa clase |
| Nosotros: botón "Ver el Instagram" | clase `oculto-temporal` en el `<a>` | quitar esa clase |

Los dos últimos, pedidos el mismo día marcando la captura. El WhatsApp de contacto sigue visible, y el carrito también abre WhatsApp. Script: `ocultar-botones.js` (su función `ocultar(tipo, ancla, nombre, desde)` sirve para cualquier otra cosa que haya que esconder).

**Error corregido el mismo día**: la primera versión de `ocultar()` (en `ocultar-secciones.js`) fallaba cuando la ancla terminaba **dentro** de la etiqueta (ej. `id="mayorista"`): el resto de la etiqueta quedaba duplicado como texto. Pasó en `<section id="mayorista">` y en el enlace `#mayorista` del menú. No se veía porque ambos están ocultos. Se reparó con `arreglar-etiquetas.js`, comparando con el respaldo, y la función de `ocultar-botones.js` ya trae la corrección (`Math.max(cierre, fin de la ancla)`). **Usar siempre esa versión.**

**Efectos que hay que saber**

- Las estampas de esas tres secciones quedan escondidas con ellas: se ven 3 de 6 (Valle de Matagalpa, cafés y proceso).
- Con Clientes apagado, las reseñas de Google (sección 18) no tienen dónde dibujarse y no hacen nada. Al volver a mostrar Clientes, vuelven solas.
- "Proceso" queda ahora junto a la sección oscura "El mimo que no se calla el café". Medido: 124 px de aire bajo los pasos, sin hueco raro.

**Trampa descubierta**: cambiar `this.props.mostrarTestimonios ?? true` a `?? false` **no hace nada**, porque el valor por defecto viene del `data-props` (`"default": true`). El interruptor se cambia ahí. Se probó y se deshizo.

Probado con mediciones en la vista previa (ancho de celular): las tres secciones y sus enlaces ya no se ven, el menú queda en Cafés y Proceso, los 5 granos del proceso siguen y la lógica pasa la revisión de sintaxis. **No mirado con captura**: el panel del navegador estaba oculto. Respaldo previo: `respaldo-antes-ocultar.html` en el scratchpad de la sesión.

---

## 20. Cabecera sin barra, con el carrito dentro del menú (2026-09-11)

Pedido: quitar la barra de arriba para que luzcan las fotos de la portada, dejar el menú hamburguesa en su esquina y meter el carrito **dentro** del menú. La referencia fue la web de Wifired: solo el logo y el botón de menú sobre la foto.

> Historia del mismo día: primero se hizo una **cápsula de vidrio flotante** (oscura sobre la portada, clara sobre el crema). El usuario prefirió la referencia sin barra, y la cápsula se reemplazó. Si algún día se quiere de vuelta: `respaldo-antes-cabecera.html` del scratchpad de la sesión y el script `barra-flotante.js`.

**Cómo quedó** (igual en celular y computador)

- **Sin barra**: el logo (invertido a blanco) y "MEMOSSH" en crema sobre la foto, arriba a la izquierda. Se va con la portada al bajar.
- **Un solo botón de menú** de 50 × 50 px arriba a la derecha, **fijo**. Sobre la portada es transparente con borde crema, como la referencia. Fuera de ella se rellena de azul noche con desenfoque para leerse sobre el crema.
- **El menú** es la tarjeta crema desplegable de siempre, colgada bajo el botón (máx. 340 px de ancho): Cafés, Proceso y **Carrito** con su número.
- **Numerito rojo** sobre el botón del menú cuando hay productos en el carrito.
- La WhatsApp de la barra ya no está arriba en ningún ancho (queda el de más abajo en la página y el del carrito).

**Dónde está**

| Pieza | Dónde |
|---|---|
| Estilos | bloque `/* --- Cabecera sin barra --- */` al final del `<style>`, justo después del bloque del menú |
| Menú en todos los anchos | el bloque del menú móvil pasó de `@media (max-width: 767px)` a `@media all` |
| Botón de carrito original | `.cc-abrir` con `oculto-temporal`: **sigue existiendo** y el carrito lo usa; su contador `.cc-badge` es el original |
| Línea "Carrito" del menú | `<button class="menu-carrito">` con `.menu-carrito-cuenta`, dentro de `.nav-links` |
| Numerito del botón | `<span class="burger-cuenta">` dentro de `.nav-burger` |
| Lógica | `carritoEnMenu()`: la línea "Carrito" cierra el menú y hace clic en el `.cc-abrir` oculto; un `MutationObserver` copia el número de `.cc-badge` a los dos contadores |
| Relleno del botón | `barraFlotante()`: clase `sobre-portada` en `<html>` mientras el botón está sobre la portada (`#top`) |
| Portada | `<header id="top">`: `min-height: 100dvh` + `padding-top` para que el texto no quede bajo el logo |

**Trampas**

- El logo y los enlaces tenían `color: var(--color-text)` en línea, lo que impedía cambiarles el color con CSS; se quitó. Y `.nav a { color: inherit }` le gana a `.nav-brand`: el crema del texto del logo se pone en `.nav`, no en `.nav-brand`.
- Las líneas del menú van **arriba** de cada elemento (menos el primero). Con la línea abajo quedaba doble al final, porque el último enlace (Cafeterías) está oculto.
- `.click()` en un botón con `display: none` igual dispara su evento: por eso el carrito original puede seguir oculto.
- Las capturas justo después de abrir el menú salen a mitad de animación: esperar ~1 s antes de sacarlas.

**Para volver atrás**: el estilo en línea anterior de la barra era `position: sticky; top: 0; z-index: 40; padding-inline: clamp(16px, 4vw, 48px); gap: clamp(10px, 2vw, 26px); background: color-mix(in srgb, var(--color-bg) 93%, transparent); backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-divider);` y la portada tenía `min-height: calc(100dvh - var(--nav-alto, 71px))`. También está en el commit `810fd08`.

Probado con capturas (celular): portada sin barra, con logo y texto en crema; menú abierto con Cafés, Proceso y "Carrito 1"; "Carrito" cierra el menú y abre el carrito; al bajar, el botón queda azul noche con el numerito rojo. El carrito de prueba se dejó como estaba. En computador no se sacó captura: es el mismo diseño, porque el menú ahora rige en todos los anchos.

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
- 2026-09-07 — Movimiento rehecho tras revisar la página completa en el navegador: se quitó el `steps()` que hacía ver el logo a tirones, se unificó todo con una sola curva, y se agregó aparición suave escalonada en TODAS las secciones (antes solo se movía la portada). Se corrigió un bug propio: `IntersectionObserver` se saltaba bloques al hacer scroll rápido y quedaban invisibles; ahora la revisión corre por cuadro, con red de seguridad a los 8 s. Además se ocultó la fila "Molemos para" (V60, Espresso, Moka…) que se me había pasado en la tarea de "solo café en grano", y la nota interna "reemplázalos por comentarios reales de tu Instagram" que estaba visible al público. Ver sección 12.
- 2026-09-07 — Carrusel de cafés bajo 900 px: deslizable con enganche, tarjeta centrada destacada y puntos de posición. La sección pasó de 2158 px a 969 px de alto en 375 px. Sobre 900 px la grilla de tres columnas queda igual. Ver sección 13.
- 2026-09-07 — Ventana de Instagram: se apagó la galería (con el interruptor `mostrarGaleria` que ya existía) y el monito decorativo del panel rojo se reemplazó por el feed real de @memossh_coffee vía `instagram.com/<perfil>/embed`. Comprobado que Instagram permite incrustar esa dirección. Entra con esqueleto de carga y fundido para que no se vea pegada encima. Ver sección 14.
- 2026-09-07 — La sección de contacto pasó a ser la invitación a seguir en Instagram (rótulo, título, texto de novedades y el botón de Instagram como principal), en una sola columna centrada. La ventana creció de 380 a 540 px, que es el máximo real del feed: más ancho deja vacío. El alto se calcula solo para las 6 publicaciones. Los videos no pueden reproducirse solos: son contenido de otro sitio dentro de un iframe.
- 2026-09-07 — La sección de Instagram pasó a dos columnas sobre 960 px (mensaje a la izquierda, feed de 540 px a la derecha) porque centrada dejaba la tarjeta flotando en medio del panel rojo y se veía pegada encima. El feed además quedó montado sobre el crema con margen y esquinas redondeadas. Bajo 960 px sigue apilado y centrado.
- 2026-09-08 — Estampas de la marca: los 6 stickers se recortaron de una lámina JPEG usando el navegador (Node no lee JPEG), se les quitó el papel con la luminancia como transparencia, y se incrustaron como `data:` (227 KB). Van una por sección en 6 secciones claras, en la esquina inferior en escritorio y centradas al cierre en celular. 0 choques con el contenido en 1280 px y 375 px. Ver sección 15. Los PNG quedaron guardados en la bóveda por si hay que reusarlos.
- 2026-09-08 — Los tres pasos del proceso: cada uno con su dibujo animado (granos, tambor de tueste, bolsa en camino) y solo el paso mirado queda nítido; los otros se apagan y desenfocan. En escritorio se encienden solos cada 2,3 s mientras la sección está a la vista; en celular siguen el scroll. Ver sección 16.
- 2026-09-08 — Acabado: se separó el panel rojo del bloque oscuro (de 0 a 90 px, se veía una costura dura) y el corte de las dos columnas de Instagram subió de 960 a 1180 px, donde el texto dejaba de ser un hilo de 190 px. Ver sección 17.
- 2026-09-09 — La sección del proceso se rehízo: fuera el desenfoque (ensuciaba) y en su lugar un grano que recorre una línea del paso 1 al 3 tostándose de verde a oscuro. Horizontal en computador, vertical en celular. El PNG de granos del usuario no estaba guardado en disco, así que el grano es un SVG con los colores de esa lámina. Ver sección 16.
- 2026-09-09 — La pista de tueste pasó a cinco granos (uno por paso y uno entre medio) que se tuestan de verde a oscuro, y en computador el avance lo manda la posición del mouse en vez de ir automático. En celular sigue el scroll y los dos granos de en medio se ocultan para no caer sobre el texto. Ver sección 16.
- 2026-09-09 — Reseñas de Google: el servidor expone `/api/resenas`, consulta a Google con la clave guardada en variables de entorno (nunca en la página) y guarda la respuesta 6 horas. La página las dibuja con su propio diseño; si no está configurado, queda igual que antes. Falta solo poner GOOGLE_API_KEY y GOOGLE_PLACE_ID en Railway. Ver sección 18.
- 2026-09-09 — Se le pusieron topes duros a las reseñas para que no pueda haber cobro: guardado de 12 h, máximo 4 consultas al día y espera de 1 h si Google falla. Probado con 10 visitas seguidas: 3 consultas con el tope en 3, y 1 sola consulta cuando Google devuelve error. Falta igual limitar la cuota en Google Cloud, que es el freno definitivo.
- 2026-09-09 — Tope diario de consultas a Google bajado de 10 a 4 a pedido del usuario. Verificado: con 10 visitas seguidas se llamó 4 veces y las 10 vieron las reseñas igual.
- 2026-09-09 — Dominio: `memossh.com` no está registrado (nslookup "Non-existent domain"); hay que comprarlo antes de que Railway lo acepte. Opciones anotadas en la sección 7.
- 2026-09-11 — Se ocultaron Suscripción, Clientes y Mayorista, más sus enlaces en el menú y el pie de página (sección 19). Nada borrado. En la sección 0 se agregaron "Direcciones rápidas" y las herramientas `buscar.js` y `tpl`/`unico`, para no volver a buscar.
- 2026-09-11 — Nosotros: título "¿Cómo nació el proyecto?" y el texto del usuario en 3 párrafos (el anterior quedó en el commit `810fd08`). Foto nueva para la tarjeta de El Salvador (entrada nueva en el manifest; la portada conserva la vieja). Ocultos: botones de la portada y "Ver el Instagram" de Nosotros. Todo medido en la vista previa y visto con captura.
- 2026-09-11 — Barra superior convertida en cápsula flotante de vidrio: oscura sobre la portada y clara sobre las secciones crema, con carrito y menú en la misma esquina (sección 20). La portada pasó a pantalla completa. Se reparó un error de `ocultar()` que había duplicado texto en dos etiquetas ocultas de Mayorista (sección 19).
- 2026-09-11 — La cápsula de vidrio se reemplazó por una cabecera sin barra, como la referencia de Wifired: logo blanco sobre la foto y un solo botón de menú fijo en la esquina. El carrito se abre desde el menú (línea "Carrito" con su número y numerito rojo en el botón). El menú desplegable rige en todos los anchos. El Salvador pasó a la foto del atardecer. Todo visto con capturas en celular (sección 20).
- 2026-09-11 — Tercera variedad: "Nicaragua, Matagalpa" ($8.000) pasó a **Brasil, Robusta** ($10.000) con los datos de la etiqueta y foto nueva (script `robusta-brasil.js`). Probado: tarjeta, foto y precio en el carrito. Pendiente: decidir qué hacer con el bloque destacado "Nicaragua / Valle de Matagalpa".
- 2026-09-11 — Foto nueva para Valle del Amazonas (bolsa negra sobre madera) con el script general `cambiar-foto-tarjeta.js`. Los datos de la tarjeta ya coincidían con la etiqueta. Vista con captura.
- 2026-09-11 — Proceso en celular: recorrido largo y continuo (aire entre pasos, la línea sigue la lectura, los 5 granos visibles, texto a la derecha de la línea). Medido: de 0 a 100 % en ~1.080 px, parejo. Fotos de las tarjetas: lavado suave y la del centro o bajo el mouse a color completo (secciones 13 y 16).
- 2026-09-11 — Proceso en celular: escena fija (grano grande que se tuesta en un anillo de avance, escala de 5 granos, un paso a la vez). Reemplaza al recorrido con huecos, que queda como respaldo. Bloque destacado: El Salvador en vez del Nicaragua, con la foto de la cordillera. Ambos vistos con capturas en 375 × 812 (secciones 3 y 16).
- 2026-09-11 — La estampa de "Cómo trabajamos" quedaba debajo del paso 3 al final de la escena fija. Ahora, con la escena activa, va en el relleno inferior de la sección, centrada: 34 px de aire, sin choque. Visto con captura en 375 × 812 (sección 16).
