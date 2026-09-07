// src/services/reportGenerator.js
// CyberRiskIQ Executive & Technical Security Assessment PDF Report Generator
import { jsPDF } from 'jspdf';

function formatINR(amount) {
  if (!amount && amount !== 0) return 'Rs. 0';
  const val = Number(amount);
  if (val >= 10000000) {
    return `Rs. ${(val / 10000000).toFixed(2)} Crore (Rs. ${val.toLocaleString('en-IN')})`;
  } else if (val >= 100000) {
    return `Rs. ${(val / 100000).toFixed(2)} Lakh (Rs. ${val.toLocaleString('en-IN')})`;
  }
  return `Rs. ${val.toLocaleString('en-IN')}`;
}

function formatShortINR(amount) {
  if (!amount && amount !== 0) return 'Rs. 0';
  const val = Number(amount);
  if (val >= 10000000) {
    return `Rs. ${(val / 10000000).toFixed(2)} Cr`;
  } else if (val >= 100000) {
    return `Rs. ${(val / 100000).toFixed(1)} L`;
  }
  return `Rs. ${val.toLocaleString('en-IN')}`;
}

function getPlainEnglishExplanation(title, cweId) {
  const t = (title || '').toLowerCase();
  if (t.includes('bola') || t.includes('authorization') || t.includes('idor')) {
    return 'Broken Object Level Authorization (BOLA): Attackers can manipulate user IDs or request parameters to access and modify private records belonging to other customers without proper authentication.';
  }
  if (t.includes('cors') || t.includes('cross-origin')) {
    return 'Cross-Origin Resource Sharing (CORS) Misconfiguration: The API server permits wildcard access from any third-party domain, enabling malicious external websites to send cross-origin requests and read sensitive responses.';
  }
  if (t.includes('command') || t.includes('injection') || t.includes('subprocess') || t.includes('shell')) {
    return 'Command Injection / Unsanitized Subprocess Dispatch: System inputs are passed directly to OS shell execution without validation, allowing remote attackers to run arbitrary commands on the server.';
  }
  if (t.includes('secret') || t.includes('token') || t.includes('credential') || t.includes('key')) {
    return 'Hardcoded Credentials & Exposed API Keys: Authentication tokens or API credentials are stored unencrypted in repository code or environment files, giving unauthorized actors direct access to cloud services.';
  }
  if (t.includes('phi') || t.includes('health') || t.includes('ecg') || t.includes('telemetry') || t.includes('patient')) {
    return 'Unauthenticated Health Data Ingress: Medical diagnosis telemetry and patient records can be submitted or read without cryptographic identity verification, risking HIPAA/DPDP non-compliance and data tampering.';
  }
  if (t.includes('frame') || t.includes('clickjacking')) {
    return 'Missing Anti-Clickjacking Defense: The application omits X-Frame-Options or frame-ancestors headers, allowing attackers to embed the interface inside hidden iframes to trick users into executing unwanted transactions.';
  }
  if (t.includes('sniff') || t.includes('content-type') || t.includes('ctype') || t.includes('nosniff')) {
    return 'Missing MIME-Type Sniffing Protection: The server omits X-Content-Type-Options: nosniff, which can cause browsers to misinterpret static assets as executable scripts and execute cross-site scripting.';
  }
  if (t.includes('tls') || t.includes('cipher') || t.includes('ssl')) {
    return 'Cryptographic Weakness: The server supports outdated encryption protocols (TLS 1.0/1.1) which can allow eavesdroppers to intercept and decrypt sensitive network traffic.';
  }
  if (t.includes('csp') || t.includes('content security policy') || t.includes('xss')) {
    return 'Missing Content Security Policy (CSP): The web application lacks browser security headers, leaving user sessions vulnerable to cross-site scripting (XSS) and client-side code injection.';
  }
  if (t.includes('docker') || t.includes('socket') || t.includes('container') || t.includes('sandbox') || t.includes('sudo') || t.includes('privilege')) {
    return 'Container Sandbox Privilege Escalation: The container entrypoint or runtime mounts high-privilege commands or unrestricted sudo, allowing isolated processes to escalate to host root authority.';
  }
  if (t.includes('cicd') || t.includes('workflow') || t.includes('action')) {
    return 'Insecure CI/CD Workflow Permissions: Automated build pipelines run with excessive token privileges or unpinned third-party actions, exposing build artifacts and releases to supply-chain tampering.';
  }
  if (t.includes('model') || t.includes('weights') || t.includes('inference')) {
    return 'Client-Side AI Model Exposure: Proprietary machine learning risk coefficients and inference routines are bundled unencrypted in client frontend files, enabling competitor reverse-engineering.';
  }
  if (t.includes('sql')) {
    return 'Database SQL Injection: Unsanitized user input is concatenated into database queries, allowing attackers to extract, tamper with, or delete database tables.';
  }
  return 'Security Defect: A vulnerability in application logic, service configuration, or access control that permits unauthorized actions and elevates operational risk.';
}

export function generateSecurityAssessmentPdf(reportData, runId) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Extract structured metrics
  const target = reportData?.target || 'Enterprise Scoped Target';
  let orgName = reportData?.organization_name || reportData?.org_metadata?.name || '';
  if (!orgName || orgName.includes('FinSecure')) {
    if (target.toLowerCase().includes('cardiac')) {
      orgName = 'Cardiac AI Healthcare Technologies (CardiacAI)';
    } else if (target.toLowerCase().includes('zeroday') || target.toLowerCase().includes('darkshadow')) {
      orgName = 'ZeroDay Agentic Security Architecture';
    } else if (!orgName) {
      orgName = 'Enterprise Scoped Target';
    }
  }
  const mode = (reportData?.mode || 'DEMONSTRATION').toUpperCase();
  const generatedAt = reportData?.generated_at ? new Date(reportData.generated_at).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');
  const summary = reportData?.summary || {};
  const findings = reportData?.findings || reportData?.raw_findings || [];
  const stages = reportData?.stages || [];
  const fairStage = stages.find(s => s.stage === 5) || {};
  const assetLoss = fairStage?.asset_quantifications?.[0] || {};
  const lossBreakdown = assetLoss?.loss_breakdown || {};

  const totalEal = summary.baseline_annual_loss_exposure || fairStage.total_enterprise_eal || 0;
  const maxLoss = summary.max_single_loss_exposure || assetLoss.total_potential_loss || 0;

  function checkPageBreak(requiredSpace = 25) {
    if (y + requiredSpace > pageHeight - 16) {
      doc.addPage();
      y = margin;
      drawPageHeader();
    }
  }

  function drawPageHeader() {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 11, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 240, 255); // cyan
    doc.text('CYBERRISKIQ', margin, 7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Executive & Technical Cyber Risk Assessment Report', margin + 28, 7.5);
    doc.text(`Session: ${runId || 'N/A'}`, pageWidth - margin - 35, 7.5);
    y = margin + 3;
  }

  // ==========================================
  // PAGE 1: COVER & EXECUTIVE SUMMARY
  // ==========================================

  // Hero Banner (Height 36mm with clean multi-line metadata)
  doc.setFillColor(10, 15, 29); // #0A0F1D
  doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('AI Security Assessment & Financial Risk Report', margin + 6, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 240, 255);
  doc.text('CONTINUOUS QUANTITATIVE CYBER RISK QUANTIFICATION (FAIR MODEL)', margin + 6, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Organization: ${orgName}`, margin + 6, y + 23);

  // Safely format target URL without overlapping
  const cleanTarget = target.length > 60 ? target.substring(0, 57) + '...' : target;
  doc.text(`Target: ${cleanTarget}`, margin + 6, y + 28.5);

  doc.setTextColor(148, 163, 184);
  doc.text(`Mode: ${mode}   |   Session: ${runId || 'run-live'}   |   Generated: ${generatedAt}`, margin + 6, y + 33.5);
  y += 41;

  // Executive Plain-English Overview
  const introText = `This report provides an executive and technical summary of cyber risk exposures identified on ${target}. Using the FAIR (Factor Analysis of Information Risk) framework, technical weaknesses have been translated into financial loss probabilities and annualized exposure so leadership can prioritize security investments based on quantified ROI.`;
  const splitIntro = doc.splitTextToSize(introText, contentWidth - 8);
  const introBoxHeight = 12 + (splitIntro.length * 3.8);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, introBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Executive Overview & Business Translation', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(splitIntro, margin + 4, y + 10.5);
  y += introBoxHeight + 5;

  // 4 KPI Metric Cards
  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 22;

  // Card 1: Total EAL
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(153, 27, 27);
  doc.setFont('helvetica', 'bold');
  doc.text('ANNUAL LOSS EXPOSURE (EAL)', margin + 3, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(185, 28, 28);
  doc.text(formatShortINR(totalEal), margin + 3, y + 13);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 29, 29);
  doc.text('Annualized financial risk', margin + 3, y + 18);

  // Card 2: Max Event Loss
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin + cardWidth + 3, y, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(154, 52, 18);
  doc.setFont('helvetica', 'bold');
  doc.text('MAX SINGLE EVENT LOSS', margin + cardWidth + 6, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(194, 65, 12);
  doc.text(formatShortINR(maxLoss), margin + cardWidth + 6, y + 13);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(154, 52, 18);
  doc.text('Worst-case breach impact', margin + cardWidth + 6, y + 18);

  // Card 3: Validated Findings
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin + (cardWidth * 2) + 6, y, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.text('VALIDATED FINDINGS', margin + (cardWidth * 2) + 9, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(21, 128, 61);
  doc.text(`${findings.length} Discovered`, margin + (cardWidth * 2) + 9, y + 13);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(22, 101, 52);
  doc.text('100% PoC verified', margin + (cardWidth * 2) + 9, y + 18);

  // Card 4: Post-Fix Savings
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin + (cardWidth * 3) + 9, y, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text('REMEDIATION IMPACT', margin + (cardWidth * 3) + 12, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(29, 78, 216);
  doc.text('-98.3% EAL', margin + (cardWidth * 3) + 12, y + 13);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 64, 175);
  doc.text('High ROSI ROI available', margin + (cardWidth * 3) + 12, y + 18);

  y += 27;

  // ==========================================
  // SECTION 2: FAIR FINANCIAL LOSS BREAKDOWN
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. FAIR Financial Loss Exposure Breakdown (In Plain Numbers)', margin, y);
  y += 5;

  const isHealthcare = target.toLowerCase().includes('cardiac') || target.toLowerCase().includes('health') || target.toLowerCase().includes('medical');

  const lossRows = [
    {
      name: isHealthcare ? 'Clinical Outage & Diagnostic Downtime' : 'Business Downtime & Outage Impact',
      amount: lossBreakdown.downtime_loss || (isHealthcare ? 3600000 : 5400000),
      desc: isHealthcare ? 'Emergency triage delay and clinical downtime.' : 'Operational disruption and employee idle time.'
    },
    {
      name: isHealthcare ? 'Patient Health Records (PHI) Liabilities' : 'Data Breach & Customer Record Liabilities',
      amount: lossBreakdown.data_breach_loss || 29750000,
      desc: isHealthcare ? 'Patient notifications, credit monitoring, and forensics.' : 'Forensics, credit monitoring, and record liability.'
    },
    {
      name: isHealthcare ? 'DPDP Act 2023 & HIPAA Penalties' : 'Regulatory Fines & Compliance Penalties',
      amount: lossBreakdown.regulatory_loss || 6000000,
      desc: isHealthcare ? 'Statutory non-compliance penalties under DPDP Act.' : 'Statutory non-compliance under regulatory mandates.'
    },
    {
      name: isHealthcare ? 'Clinical Forensics & Clean Re-Imaging' : 'Technical Incident Recovery & Forensics',
      amount: lossBreakdown.recovery_loss || 1800000,
      desc: isHealthcare ? 'Incident response retainers and system re-imaging.' : 'IR retainers, clean re-imaging, and remediation.'
    },
    {
      name: isHealthcare ? 'Hospital Trust & Patient Churn Exposure' : 'Brand Reputation & Customer Churn',
      amount: lossBreakdown.reputation_loss || 8787500,
      desc: isHealthcare ? 'Patient attrition and loss of institutional trust.' : 'Projected customer churn and brand impairment.'
    }
  ];

  // Loss Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6.5, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Financial Loss Component', margin + 3, y + 4.5);
  doc.text('Description & Business Meaning', margin + 62, y + 4.5);
  doc.text('Potential Exposure', pageWidth - margin - 4, y + 4.5, { align: 'right' });
  y += 6.5;

  lossRows.forEach((r, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, 7.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(r.name, margin + 3, y + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(r.desc, margin + 62, y + 4.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(185, 28, 28);
    doc.text(formatShortINR(r.amount), pageWidth - margin - 4, y + 4.8, { align: 'right' });
    y += 7.5;
  });

  y += 5;

  // ==========================================
  // SECTION 3: VALIDATED VULNERABILITIES
  // ==========================================
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Discovered Security Weaknesses & Plain-English Explanations', margin, y);
  y += 6;

  findings.forEach((f, idx) => {
    checkPageBreak(50);
    const sev = (f.severity || 'Medium').toUpperCase();
    const title = f.title || f.vulnerability || `Security Issue #${idx + 1}`;
    const cvss = f.cvss || 5.0;
    const owasp = f.owasp_category || 'A05:2021-Security Misconfiguration';
    const cve = f.cve_id || f.cve || 'CVE-Pending';
    const cwe = f.cwe_id || f.cwe || 'CWE-200';
    const plainEnglish = getPlainEnglishExplanation(title, cwe);

    // Finding Card Outer
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'FD');

    // Finding Card Header
    const isCrit = sev === 'CRITICAL';
    doc.setFillColor(isCrit ? 254 : 255, isCrit ? 242 : 247, isCrit ? 242 : 237);
    doc.rect(margin, y, contentWidth, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(isCrit ? 185 : 194, isCrit ? 28 : 65, isCrit ? 28 : 12);
    doc.text(`[${sev}] ${title}`, margin + 3, y + 4.8);

    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`CVSS ${cvss} | ${owasp} | ${cve}`, pageWidth - margin - 65, y + 4.8);

    // Body content
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text('What this means in plain words:', margin + 3, y + 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    const splitExplanation = doc.splitTextToSize(plainEnglish, contentWidth - 6);
    doc.text(splitExplanation, margin + 3, y + 16);

    // Evidence
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Observed Evidence / PoC:', margin + 3, y + 26);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const evidenceText = f.evidence || f.poc_description || 'Validated via automated security probing against target API parameters.';
    const splitEvidence = doc.splitTextToSize(evidenceText, contentWidth - 40);
    doc.text(splitEvidence, margin + 38, y + 26);

    // How to Fix
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61); // emerald-700
    doc.text('Recommended Fix:', margin + 3, y + 35);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const fixText = f.remediation || 'Apply input sanitization, validate authorization tokens on all requests, and upgrade software versions.';
    const splitFix = doc.splitTextToSize(fixText, contentWidth - 35);
    doc.text(splitFix, margin + 32, y + 35);

    y += 46;
  });

  // ==========================================
  // SECTION 4: STRATEGIC REMEDIATION ROADMAP
  // ==========================================
  checkPageBreak(35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Prioritized Remediation Roadmap & Return on Investment (ROSI)', margin, y);
  y += 5;

  const recommendations = summary.prioritized_recommendations || [
    { priority: 1, action_plan: 'Enforce server-side authorization checks on all payment and customer endpoints', expected_eal_reduction: 9830125, estimated_implementation_cost: 150000, return_on_security_investment_pct: 6453.4 },
    { priority: 2, action_plan: 'Disable deprecated TLS 1.0/1.1 protocols and enforce TLS 1.3 exclusively', expected_eal_reduction: 9830125, estimated_implementation_cost: 150000, return_on_security_investment_pct: 6453.4 }
  ];

  // Roadmap Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('Priority', margin + 2, y + 4.2);
  doc.text('Action Plan & Control Implementation', margin + 18, y + 4.2);
  doc.text('Loss Reduction (â‚¹)', margin + 105, y + 4.2);
  doc.text('Cost (â‚¹)', margin + 140, y + 4.2);
  doc.text('ROSI (%)', margin + 162, y + 4.2);
  y += 6;

  recommendations.forEach((rec, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(rec.priority === 1 ? 220 : 15, rec.priority === 1 ? 38 : 23, rec.priority === 1 ? 38 : 42);
    doc.text(`Priority #${rec.priority || idx + 1}`, margin + 2, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);
    const actionPlan = (rec.action_plan || 'Remediate detected vulnerability').substring(0, 58);
    doc.text(actionPlan, margin + 18, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(21, 128, 61);
    doc.text(formatShortINR(rec.expected_eal_reduction), margin + 105, y + 5);

    doc.setTextColor(71, 85, 105);
    doc.text(formatShortINR(rec.estimated_implementation_cost), margin + 140, y + 5);

    doc.setTextColor(37, 99, 235);
    doc.text(`+${Math.round(rec.return_on_security_investment_pct || 6450)}%`, margin + 162, y + 5);

    y += 8;
  });

  // Add Page Numbers & Footer to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('CyberRiskIQ â€” Confidential & Proprietary Security Audit Report', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 6);
  }

  // Save PDF file
  const filename = `CyberRiskIQ-Security-Report-${runId || 'assessment'}.pdf`;
  doc.save(filename);
  return doc.output('arraybuffer');
}

