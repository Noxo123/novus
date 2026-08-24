import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const publicDir = join(__dirname, 'dist');
const port = Number(process.env.PORT || 3000);

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
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'",
};

function serve(res, file) {
  const type = mime[extname(file)] || 'application/octet-stream';
  res.writeHead(200, { ...securityHeaders, 'Content-Type': type });
  res.end(readFileSync(file));
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, securityHeaders);
    return res.end('Method Not Allowed');
  }

  const urlPath = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname;
  const requested = normalize(join(publicDir, urlPath === '/' ? 'index.html' : urlPath));

  // Never serve files outside dist/.
  if (!requested.startsWith(publicDir)) {
    res.writeHead(403, securityHeaders);
    return res.end('Forbidden');
  }

  // SPA fallback: unknown routes return index.html.
  const file = existsSync(requested) ? requested : join(publicDir, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(503, securityHeaders);
    return res.end('Build not found. Run npm run build first.');
  }

  if (req.method === 'HEAD') {
    res.writeHead(200, { ...securityHeaders, 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    return res.end();
  }

  try {
    serve(res, file);
  } catch {
    res.writeHead(500, securityHeaders);
    res.end('Internal Server Error');
  }
});

server.listen(port, () => {
  console.log(`NOVUS running on http://localhost:${port}`);
});
