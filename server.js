// Servidor mínimo para Railway. Solo usa módulos que ya trae Node (sin dependencias).
// Sirve la página empaquetada de Memossh Coffee en "/".

const http = require('http');
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080; // Railway inyecta PORT; 8080 es solo el respaldo local
const PAGINA = path.join(__dirname, 'Memossh Coffee - pagina completa.html');

// Se lee y se comprime una sola vez al arrancar; queda en memoria.
const html = fs.readFileSync(PAGINA);
const htmlGzip = zlib.gzipSync(html, { level: 6 });
const etag = '"' + crypto.createHash('sha1').update(html).digest('hex') + '"';

console.log(
  `Página cargada: ${(html.length / 1048576).toFixed(1)} MB ` +
  `(${(htmlGzip.length / 1048576).toFixed(1)} MB comprimida)`
);


// ---------------------------------------------------------------
// Reseñas de Google Maps
// ---------------------------------------------------------------
// La clave vive SOLO aquí, en las variables del servidor. Nunca en la
// página: si estuviera ahí, cualquiera podría copiarla y gastar el saldo.
const LLAVE_GOOGLE = process.env.GOOGLE_API_KEY || '';
const LUGAR_GOOGLE = process.env.GOOGLE_PLACE_ID || '';

// ---- Topes para que nunca pueda llegar un cobro ----
// Las respuestas se guardan medio día, así que da igual si entran 10
// visitas o 10.000: a Google se le pregunta como mucho 2 veces al día.
const HORAS_GUARDADAS = Number(process.env.GOOGLE_HORAS_CACHE || 12);
// Tope duro por día. Aunque algo falle o alguien recargue mil veces,
// el servidor NO va a llamar a Google más de esto.
// Con el guardado de 12 h bastan 2 al día, así que 4 deja margen de sobra.
const MAX_POR_DIA = Number(process.env.GOOGLE_MAX_DIA || 4);
// Si Google contesta con error, se espera una hora antes de reintentar.
// Sin esto, un error dejaría al servidor llamando en cada visita.
const ESPERA_TRAS_ERROR = 60 * 60 * 1000;

let cacheResenas = null;
let cacheHora = 0;
let llamadasHoy = 0;
let diaContado = '';
let esperarHasta = 0;

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function respuestaGuardada(motivo) {
  if (cacheResenas) return cacheResenas;
  return { ok: false, motivo: motivo, resenas: [] };
}

async function traerResenas() {
  const ahora = Date.now();

  // 1. Si lo guardado sigue fresco, ni se consulta
  if (cacheResenas && ahora - cacheHora < HORAS_GUARDADAS * 60 * 60 * 1000) {
    return cacheResenas;
  }

  // 2. Sin configurar no se llama a nadie: cuesta cero
  if (!LLAVE_GOOGLE || !LUGAR_GOOGLE) {
    return { ok: false, motivo: 'Faltan GOOGLE_API_KEY y/o GOOGLE_PLACE_ID en las variables del servidor.', resenas: [] };
  }

  // 3. Si Google falló hace poco, se espera
  if (ahora < esperarHasta) {
    return respuestaGuardada('Google falló hace poco; se reintenta más tarde.');
  }

  // 4. Contador diario
  if (diaContado !== hoy()) { diaContado = hoy(); llamadasHoy = 0; }
  if (llamadasHoy >= MAX_POR_DIA) {
    console.log('Tope diario alcanzado (' + MAX_POR_DIA + '): no se consulta a Google.');
    return respuestaGuardada('Tope diario de consultas alcanzado.');
  }

  try {
    llamadasHoy++;
    const direccion = 'https://places.googleapis.com/v1/places/' +
      encodeURIComponent(LUGAR_GOOGLE) + '?languageCode=es';
    const r = await fetch(direccion, {
      headers: {
        'X-Goog-Api-Key': LLAVE_GOOGLE,
        'X-Goog-FieldMask': 'displayName,rating,userRatingCount,googleMapsUri,reviews'
      }
    });

    if (!r.ok) {
      const cuerpo = await r.text();
      console.error('Google respondió ' + r.status + ': ' + cuerpo.slice(0, 300));
      esperarHasta = Date.now() + ESPERA_TRAS_ERROR;
      return respuestaGuardada('Google respondió ' + r.status + '.');
    }

    const d = await r.json();
    const resenas = (d.reviews || []).map((x) => ({
      autor: (x.authorAttribution && x.authorAttribution.displayName) || 'Cliente',
      foto: (x.authorAttribution && x.authorAttribution.photoUri) || '',
      estrellas: x.rating || 0,
      cuando: x.relativePublishTimeDescription || '',
      texto: (x.text && x.text.text) || (x.originalText && x.originalText.text) || ''
    })).filter((x) => x.texto);

    cacheResenas = {
      ok: true,
      nota: d.rating || null,
      total: d.userRatingCount || null,
      enlace: d.googleMapsUri || '',
      resenas: resenas
    };
    cacheHora = Date.now();
    console.log('Reseñas actualizadas: ' + resenas.length +
      ' (consulta ' + llamadasHoy + ' de ' + MAX_POR_DIA + ' hoy)');
    return cacheResenas;
  } catch (e) {
    console.error('No se pudo consultar a Google: ' + e.message);
    esperarHasta = Date.now() + ESPERA_TRAS_ERROR;
    return respuestaGuardada('No se pudo consultar a Google.');
  }
}

const server = http.createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0];

  if (url === '/api/resenas') {
    const datos = await traerResenas();
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=1800'
    });
    return res.end(JSON.stringify(datos));
  }

  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end('ok');
  }

  if (url === '/favicon.ico') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Método no permitido');
  }

  // Si el navegador ya la tiene en caché, no se reenvían los 26 MB.
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, { ETag: etag });
    return res.end();
  }

  const aceptaGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  const cuerpo = aceptaGzip ? htmlGzip : html;

  const cabeceras = {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': cuerpo.length,
    'Cache-Control': 'public, max-age=300',
    ETag: etag,
    Vary: 'Accept-Encoding',
  };
  if (aceptaGzip) cabeceras['Content-Encoding'] = 'gzip';

  res.writeHead(200, cabeceras);
  if (req.method === 'HEAD') return res.end();
  res.end(cuerpo);
});

// Detrás del proxy de Railway las conexiones se reutilizan. Si Node las cierra
// antes que el proxy, ese proxy devuelve 502 de forma intermitente.
// Por eso se mantienen abiertas más tiempo que el proxy (que corta a ~60s).
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = 0; // sin límite: bajar 19 MB puede tardar en redes lentas

server.on('error', (err) => {
  console.error('ERROR del servidor:', err.message);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  const origen = process.env.PORT
    ? `variable PORT que entregó el entorno (${process.env.PORT})`
    : 'respaldo local 8080, porque el entorno NO entregó la variable PORT';
  console.log(`Escuchando en http://0.0.0.0:${PORT}`);
  console.log(`Puerto tomado de: ${origen}`);
});
