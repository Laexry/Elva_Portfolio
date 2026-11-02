// scripts/dev.mjs
// Local development server: serves static files + /api/* routes.
// Usage: node --env-file=.env.local scripts/dev.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = 3000;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = url.pathname;

  // Route /api/* to api handlers
  if (pathname.startsWith('/api/')) {
    const handlerName = pathname.replace(/^\/api\//, '').replace(/\/$/, '') || 'index';
    const handlerPath = path.join(ROOT, 'api', `${handlerName}.js`);

    try {
      // Dynamic import with cache-bust so edits are picked up on restart
      const mod = await import(pathToFileURL(handlerPath).href + `?t=${Date.now()}`);
      const handler = mod.default;
      if (typeof handler !== 'function') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Handler is not a function' }));
      }

      // Build a minimal req/res shim compatible with the Vercel-style handlers
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', async () => {
        req.body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : undefined;

        const fakeRes = {
          _status: 200,
          _headers: {},
          _body: null,
          status(code) { this._status = code; return this; },
          setHeader(k, v) { this._headers[k] = v; return this; },
          end(body) {
            res.writeHead(this._status, this._headers);
            res.end(body ?? this._body ?? '');
          },
          json(obj) {
            this._headers['Content-Type'] = 'application/json';
            this.end(JSON.stringify(obj));
          },
        };

        try {
          await handler(req, fakeRes);
        } catch (e) {
          console.error('Handler error:', e);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    } catch (e) {
      console.error('Import error:', e);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `API handler not found: ${handlerName}` }));
    }
    return;
  }

  // Serve static files
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.join(ROOT, pathname);

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      const idx = path.join(filePath, 'index.html');
      if (fs.existsSync(idx)) {
        serveFile(idx, res);
      } else {
        res.writeHead(403); res.end('Forbidden');
      }
    } else {
      serveFile(filePath, res);
    }
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

server.listen(PORT, () => {
  console.log(`\n🚀  Dev server running at http://localhost:${PORT}\n`);
});
