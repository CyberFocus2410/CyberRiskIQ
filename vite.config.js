import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { runSecurityAssessment, readAssessmentResults } from './src/services/securityAssessmentService.js';
import { generateSecurityAssessmentPdf } from './src/services/reportGenerator.js';
import fs from 'fs';
import path from 'path';

function securityAssessmentApiPlugin() {
  return {
    name: 'security-assessment-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || '';
        const parsedUrl = new URL(reqUrl, 'http://localhost');
        const pathname = parsedUrl.pathname;

        // Security Assessment Scan endpoint (POST /api/assessment/scan)
        if (pathname === '/api/assessment/scan' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => (body += chunk));
          req.on('end', async () => {
            try {
              const parsed = body ? JSON.parse(body) : {};
              const target = parsed.target || './src';
              const mode = parsed.mode || 'demo';
              const { runId, resultsPath } = await runSecurityAssessment(target, { mode });
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ runId, resultsPath, mode, success: true }));
            } catch (e) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // Log retrieval (GET /api/assessment/log/:runId)
        const logMatch = pathname.match(/^\/api\/assessment\/log\/(.+)$/);
        if (logMatch && req.method === 'GET') {
          const runId = logMatch[1];
          const logPath = path.resolve('assessment_runs', runId, 'run.log');

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
            res.end('[CYBERRISKIQ] Initializing AI security assessment session...\n');
            return;
          }
        }

        // Result retrieval (GET /api/assessment/result/:runId)
        const resultMatch = pathname.match(/^\/api\/assessment\/result\/(.+)$/);
        if (resultMatch && req.method === 'GET') {
          const runId = resultMatch[1];
          const resultsPath = path.resolve('assessment_runs', runId, 'results.json');

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
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, status: 'assessing' }));
            return;
          }
        }

        // PDF report generation (GET /api/assessment/report/:runId)
        const pdfMatch = pathname.match(/^\/api\/assessment\/report\/(.+)$/);
        if (pdfMatch && req.method === 'GET') {
          const runId = pdfMatch[1];
          const resultsPath = path.resolve('assessment_runs', runId, 'results.json');

          if (fs.existsSync(resultsPath)) {
            try {
              const results = await readAssessmentResults(resultsPath);
              const pdfBytes = generateSecurityAssessmentPdf(results, runId);
              res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="cyberriskiq-assessment-${runId}.pdf"`,
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
            res.end(JSON.stringify({ error: 'Results not yet generated for this assessment session' }));
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
    securityAssessmentApiPlugin(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
