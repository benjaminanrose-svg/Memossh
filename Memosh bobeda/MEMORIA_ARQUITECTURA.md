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
| 1 | — | Nav pegajoso (sticky) | Enlaces: `#cafes`, `#verde`, `#proceso`, `#mayorista`, `#contacto` |
| 2 | `#top` | "Sonríe, tenemos café para empezar." | Hero con video de fondo (`heroReel`) |
| 3 | — | 4 tarjetas | Tostado bajo pedido / Origen en la bolsa / También en verde / Envíos a todo Chile |
| 4 | — | "Nicaragua" | Bloque de origen destacado |
| 5 | `#cafes` | "Tres orígenes, tres…" | Valle del Amazonas · El Salvador · Nicaragua (Matagalpa) |
| 6 | `#verde` | "¿Tuestas en casa? Te vendemos el grano verde" | Fondo oscuro |
| 7 | `#proceso` | "Del productor a tu taza, sin atajos" | 3 pasos: Elegimos el lote / Tostamos bajo pedido / Enviamos fresco |
| 8 | — | "Que nunca te falte café" | Suscripción |
| 9 | — | "Lo que dicen los que ya lo probaron" | **Opcional**: se oculta con `mostrarTestimonios` |
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

## Historial

- 2026-09-07 — Creado el mapa. No se modificó la página; solo se analizó.
- 2026-09-07 — Agregados `server.js` y `package.json` para publicar en Railway. Probado en local: responde 200 y la página se ve bien.
- 2026-09-07 — `server.js`: el respaldo de puerto pasó de 3000 a 8080 y el log ahora dice `Escuchando en http://0.0.0.0:${PORT}`. Probado con y sin la variable PORT; ambos casos responden 200.
