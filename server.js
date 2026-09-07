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

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];

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
