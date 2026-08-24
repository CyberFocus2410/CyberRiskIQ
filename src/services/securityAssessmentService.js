// src/services/securityAssessmentService.js
// CyberRiskIQ AI Security Assessment Engine Service
// Supports both LIVE automated security scans and DEMONSTRATION / SYNTHETIC assessment modes.

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Checks if Docker container runtime is available on the host system.
 */
function checkDocker() {
  return new Promise((resolve) => {
    exec('docker version --format "{{.Server.Version}}"', (err, stdout) => {
      if (err || !stdout) resolve(false);
      else resolve(stdout.trim());
    });
  });
}

/**
 * Runs an AI Security Assessment asynchronously.
 * @param {string} target - Path, domain, or API URL to assess.
 * @param {object} options - Options including mode ('live' | 'demo') and flags (e.g., { quick: true }).
 * @returns {Promise<{runId:string, resultsPath:string, mode:string}>}
 */
export async function runSecurityAssessment(target, options = {}) {
  const runId = crypto.randomBytes(6).toString('hex');
  const runDir = path.resolve('assessment_runs', runId);
  await fs.mkdir(runDir, { recursive: true });

  const logPath = path.join(runDir, 'run.log');
  const resultsPath = path.join(runDir, 'results.json');

  const mode = options.mode || 'auto'; // 'live' | 'demo' | 'auto'

  const initialLog = `[${new Date().toISOString()}] [ASSESSMENT-INIT] Initializing CyberRiskIQ AI Security Assessment Engine\n[${new Date().toISOString()}] [ASSESSMENT-TARGET] Target parameter: "${target}"\n[${new Date().toISOString()}] [ASSESSMENT-SESSION] Session ID: ${runId}\n`;
  await fs.writeFile(logPath, initialLog, 'utf8');

  // Start the assessment asynchronously in the background
  (async () => {
    const dockerVersion = await checkDocker();
    const hasLiveKeys = process.env.SECURITY_ASSESSMENT_LLM && process.env.LLM_API_KEY;
    const executeLive = mode === 'live' || (mode === 'auto' && dockerVersion && hasLiveKeys);

    if (executeLive && dockerVersion && hasLiveKeys) {
      // Execute live assessment container
      await fs.appendFile(logPath, `[${new Date().toISOString()}] [MODE-LIVE] Live Security Assessment mode active (Docker ${dockerVersion} detected).\n[${new Date().toISOString()}] [ORCHESTRATOR] Launching containerized security probing agents...\n`);

      const flags = [];
      if (options.quick) flags.push('--scan-mode', 'quick');
      flags.push('-n');
      const assessmentBin = process.env.SECURITY_ASSESSMENT_BIN || 'security-assessment-agent';
      const cmd = `${assessmentBin} ${flags.join(' ')} --target "${target}" --output json --output-dir "${runDir}"`;

      const logStream = (await fs.open(logPath, 'a')).createWriteStream();
      const child = exec(cmd, { env: process.env }, async (error, stdout, stderr) => {
        logStream.end();
        if (error) {
          await fs.appendFile(logPath, `\n[${new Date().toISOString()}] [ASSESSMENT-ERROR] ${stderr || error.message}\n`);
          return;
        }
        await fs.appendFile(logPath, `\n[${new Date().toISOString()}] [ASSESSMENT-COMPLETE] Live assessment completed successfully.\n`);
      });
      child.stdout?.pipe(logStream);
      child.stderr?.pipe(logStream);
    } else {
      // Execute Demonstration / Synthetic Assessment mode
      await fs.appendFile(logPath, `[${new Date().toISOString()}] [MODE-DEMO] Running DEMONSTRATION / SYNTHETIC ASSESSMENT MODE.\n[${new Date().toISOString()}] [TELEMETRY] Autonomous AI Security Reasoning agent initialized.\n`);

      const steps = [
        `[${new Date().toISOString()}] [RECON] Discovering attack surface and endpoint topologies on target ${target}...`,
        `[${new Date().toISOString()}] [ATTACK-SURFACE] Identified 24 HTTP routes, 6 microservice APIs, and 2 identity gateways.`,
        `[${new Date().toISOString()}] [AGENT-REASONING] LLM security model generating high-yield penetration attack vectors...`,
        `[${new Date().toISOString()}] [EXPLOIT-PROBE] Executing active probes: BOLA/IDOR, SQLi, SSRF, JWT Signature, and Secrets Leaks...`,
        `[${new Date().toISOString()}] [VULN-VALIDATED] Confirmed Critical BOLA on /api/v1/payments/charge (Tenant ID Bypass).`,
        `[${new Date().toISOString()}] [VULN-VALIDATED] Confirmed High Severity Hardcoded GitHub Access Token in CI/CD configuration.`,
        `[${new Date().toISOString()}] [VULN-VALIDATED] Confirmed High Severity Unencrypted Database Backup archive on local storage.`,
        `[${new Date().toISOString()}] [POC-SYNTHESIS] Synthesizing verified reproduction proof-of-concept (PoC) artifacts...`,
        `[${new Date().toISOString()}] [RISK-NORMALIZATION] Normalizing findings to CyberRiskIQ Canonical Schema...`,
        `[${new Date().toISOString()}] [ASSESSMENT-COMPLETE] Security Assessment session ${runId} concluded with 3 validated findings.`
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(r => setTimeout(r, 550));
        await fs.appendFile(logPath, `${steps[i]}\n`);
      }

      const sampleResults = {
        runId,
        target,
        mode: 'DEMONSTRATION',
        timestamp: new Date().toISOString(),
        assessmentEngine: 'CyberRiskIQ AI Security Assessment Engine',
        findingsCount: 3,
        evidenceCount: 3,
        confidence: 0.96,
        findings: [
          {
            id: `FND-SEC-${Date.now()}-1`,
            assetId: 'AST-001',
            title: 'Broken Object Level Authorization (BOLA) in Payment Gateway API',
            vulnerability: 'Broken Object Level Authorization (BOLA) in /api/v1/payments/charge',
            severity: 'Critical',
            cvss: 9.8,
            exploitAvailable: true,
            internetExposed: true,
            evidence: 'Autonomous agent successfully bypassed tenant authorization header on /api/v1/payments/charge?org_id=9812 to extract unauthorized billing transaction ledgers without admin token. Response code: HTTP 200 OK.',
            controlState: 'WAF active but object-level authorization header validation omitted in microservice gateway.',
            remediation: 'Implement server-side object-level permission verification and tenant scoping on all payment endpoints.',
            pocAttached: true,
            source: 'CyberRiskIQ AI Security Assessment'
          },
          {
            id: `FND-SEC-${Date.now()}-2`,
            assetId: 'AST-002',
            title: 'Hardcoded GitHub Access Token in CI/CD Workflow Files',
            vulnerability: 'Hardcoded GitHub Access Token in CI/CD Workflow Files',
            severity: 'High',
            cvss: 8.9,
            exploitAvailable: true,
            internetExposed: false,
            evidence: 'Located active token ghp_**************************** in workflow YAML file. Validated token permissions: repo, write:packages, read:org.',
            controlState: 'Git secret scanner inactive in pre-commit hooks.',
            remediation: 'Revoke and rotate the exposed GitHub PAT. Configure GitHub Secret Store or HashiCorp Vault.',
            pocAttached: true,
            source: 'CyberRiskIQ AI Security Assessment'
          },
          {
            id: `FND-SEC-${Date.now()}-3`,
            assetId: 'AST-003',
            title: 'Unencrypted Database Backup Archive Exposed on Local Mount',
            vulnerability: 'Unencrypted Database Backup Archive Exposed on Local Mount',
            severity: 'High',
            cvss: 8.1,
            exploitAvailable: false,
            internetExposed: false,
            evidence: 'Identified backup file backup_prod_dump_2026.sql without encryption on /var/backups/. File contains plaintext customer schema definitions.',
            controlState: 'Disk encryption active but export archive lacks individual AES-256/GPG encryption.',
            remediation: 'Enforce automated AES-256 / GPG encryption on all database dumps before file write.',
            pocAttached: true,
            source: 'CyberRiskIQ AI Security Assessment'
          }
        ]
      };

      await fs.writeFile(resultsPath, JSON.stringify(sampleResults, null, 2), 'utf8');
    }
  })().catch(async (err) => {
    try {
      await fs.appendFile(logPath, `\n[ASSESSMENT-FATAL] ${err.message}\n`);
    } catch (_) {}
  });

  return { runId, resultsPath, mode };
}

/**
 * Reads the assessment results JSON and returns the raw object.
 */
export async function readAssessmentResults(resultsPath) {
  const raw = await fs.readFile(resultsPath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Helper to get the log path for an assessment run.
 */
export function getAssessmentRunLogPath(runId) {
  const directPath = path.resolve('assessment_runs', runId, 'run.log');
  return directPath;
}
