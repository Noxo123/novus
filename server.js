import http from 'node:http';
import { existsSync, statSync, createReadStream } from 'node:fs';
import { extname, join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(__dirname, 'dist');
const port = Number(process.env.SERVER_PORT || process.env.PORT || 3000);
const host = process.env.SERVER_IP || process.env.HOST || '0.0.0.0';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { ...securityHeaders, 'Content-Type': type });
  res.end(body);
}

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const candidate = normalize(join(publicDir, decoded === '/' ? 'index.html' : decoded));
  const rel = relative(publicDir, candidate);
  return rel === '' || (!rel.startsWith('..' + sep) && rel !== '..') ? candidate : null;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method Not Allowed');
  }

  let urlPath;
  try {
    urlPath = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname;
  } catch {
    return send(res, 400, 'Bad Request');
  }

  let requested;
  try {
    requested = safePath(urlPath);
  } catch {
    return send(res, 400, 'Bad Request');
  }

  if (!requested) return send(res, 403, 'Forbidden');

  // SPA fallback for client-side routes.
  const file = existsSync(requested) && statSync(requested).isFile()
    ? requested
    : join(publicDir, 'index.html');

  if (!existsSync(file)) {
    return send(res, 503, 'Build not found. Run npm run build first.');
  }

  const type = mime[extname(file)] || 'application/octet-stream';
  const size = statSync(file).size;
  res.writeHead(200, { ...securityHeaders, 'Content-Type': type, 'Content-Length': size, 'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600' });

  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
});

server.on('error', (error) => {
  console.error('NOVUS server error:', error);
  process.exitCode = 1;
});

server.listen(port, host, () => {
  console.log(`NOVUS listening on ${host}:${port}`);
});
