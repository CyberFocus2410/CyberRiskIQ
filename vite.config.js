import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { runStrixScan, getRunLogPath, readStrixResults } from './src/services/strixService.js';
import { generateStrixPdf } from './src/services/reportGenerator.js';
import fs from 'fs';
import path from 'path';

function strixApiPlugin() {
  return {
    name: 'strix-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || '';
        const parsedUrl = new URL(reqUrl, 'http://localhost');
        const pathname = parsedUrl.pathname;

        // Scan endpoint (POST /api/strix/scan)
        if (pathname === '/api/strix/scan' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => (body += chunk));
          req.on('end', async () => {
            try {
              const parsed = body ? JSON.parse(body) : {};
              const target = parsed.target || './src';
              const { runId, resultsPath } = await runStrixScan(target);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ runId, resultsPath, success: true }));
            } catch (e) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // Log retrieval (GET /api/strix/log/:runId)
        const logMatch = pathname.match(/^\/api\/strix\/log\/(.+)$/);
        if (logMatch && req.method === 'GET') {
          const runId = logMatch[1];
          const logPath = getRunLogPath(runId);
          if (fs.existsSync(logPath)) {
            try {
              const data = fs.readFileSync(logPath, 'utf8');
              res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
              res.end(data);
              return;
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          } else {
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Initializing scan container...\n');
            return;
          }
        }

        // Result retrieval (GET /api/strix/result/:runId)
        const resultMatch = pathname.match(/^\/api\/strix\/result\/(.+)$/);
        if (resultMatch && req.method === 'GET') {
          const runId = resultMatch[1];
          const resultsPath = path.resolve('strix_runs', runId, 'results.json');
          if (fs.existsSync(resultsPath)) {
            try {
              const data = fs.readFileSync(resultsPath, 'utf8');
              const json = JSON.parse(data);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, resultsPath, results: json }));
              return;
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          } else {
            // Still in progress
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, status: 'scanning' }));
            return;
          }
        }

        // PDF report generation (GET /api/strix/report/:runId)
        const pdfMatch = pathname.match(/^\/api\/strix\/report\/(.+)$/);
        if (pdfMatch && req.method === 'GET') {
          const runId = pdfMatch[1];
          const resultsPath = path.resolve('strix_runs', runId, 'results.json');
          if (fs.existsSync(resultsPath)) {
            try {
              const results = await readStrixResults(resultsPath);
              const pdfBytes = generateStrixPdf(results, runId);
              res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="strix-report-${runId}.pdf"`,
              });
              res.end(Buffer.from(pdfBytes));
              return;
            } catch (err) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
              return;
            }
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Results not yet generated for this run' }));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    strixApiPlugin(),
  ],
});

