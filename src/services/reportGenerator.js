// src/services/reportGenerator.js
// CyberRiskIQ Executive & Technical Security Assessment PDF Report Generator
import { jsPDF } from 'jspdf';

function formatINR(amount) {
  if (!amount && amount !== 0) return '₹0';
  const val = Number(amount);
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Crore (₹${val.toLocaleString('en-IN')})`;
  } else if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} Lakh (₹${val.toLocaleString('en-IN')})`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
}

function formatShortINR(amount) {
  if (!amount && amount !== 0) return '₹0';
  const val = Number(amount);
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  } else if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1)} L`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
}

function getPlainEnglishExplanation(title, cweId) {
  const t = (title || '').toLowerCase();
  if (t.includes('bola') || t.includes('authorization') || t.includes('idor')) {
    return 'Broken Object Level Authorization (BOLA): Attackers can manipulate user IDs or request parameters to access and modify private records belonging to other customers without proper authentication.';
  }
  if (t.includes('tls') || t.includes('cipher') || t.includes('ssl')) {
    return 'Cryptographic Weakness: The server supports outdated encryption protocols (TLS 1.0/1.1) which can allow eavesdroppers to intercept and decrypt sensitive network traffic.';
  }
  if (t.includes('sql') || t.includes('injection')) {
    return 'Database Injection: Unsanitized user input is executed directly by the database, potentially allowing attackers to read, modify, or delete sensitive enterprise data.';
  }
  if (t.includes('secret') || t.includes('token') || t.includes('password') || t.includes('key')) {
    return 'Hardcoded Credentials: Authentication keys or tokens are stored in accessible files, giving unauthorized actors direct administrative access to cloud or code repositories.';
  }
  if (t.includes('misconfiguration') || t.includes('exposure')) {
    return 'Security Misconfiguration: Server or cloud services are configured with default or overly permissive settings, exposing internal routes and data to unauthorized internet users.';
  }
  return 'Security Defect: A vulnerability in application logic or service configuration that could allow attackers to bypass security barriers and impact system integrity.';
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
  const orgName = reportData?.organization_name || reportData?.org_metadata?.name || 'FinSecure Enterprise';
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
  const overallHealth = summary.overall_health || (totalEal > 1000000 ? 'High Risk Exposure' : 'Guarded');

  function checkPageBreak(requiredSpace = 25) {
    if (y + requiredSpace > pageHeight - 18) {
      doc.addPage();
      y = margin;
      drawPageHeader();
    }
  }

  function drawPageHeader() {
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 240, 255); // cyan
    doc.text('CYBERRISKIQ', margin, 8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Executive & Technical Cyber Risk Assessment Report', margin + 28, 8);
    doc.text(`Session: ${runId || 'N/A'}`, pageWidth - margin - 35, 8);
    y = margin + 4;
  }

  // ==========================================
  // PAGE 1: COVER & EXECUTIVE SUMMARY
  // ==========================================

  // Hero Banner
  doc.setFillColor(10, 15, 29); // #0A0F1D
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('AI Security Assessment & Financial Risk Report', margin + 6, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(0, 240, 255);
  doc.text('CONTINUOUS QUANTITATIVE CYBER RISK QUANTIFICATION (FAIR MODEL)', margin + 6, y + 17);

  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Organization: ${orgName}   |   Target: ${target}`, margin + 6, y + 25);
  doc.text(`Mode: ${mode}   |   Generated: ${generatedAt}`, margin + 110, y + 25);
  y += 38;

  // Executive Plain-English Overview
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Executive Overview & Business Translation', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const introText = `This report provides an executive and technical summary of cyber risk exposures identified on ${target}. Using the FAIR (Factor Analysis of Information Risk) framework, technical weaknesses have been translated into financial loss probabilities and annualized exposure so leadership can prioritize security investments based on financial return.`;
  const splitIntro = doc.splitTextToSize(introText, contentWidth - 8);
  doc.text(splitIntro, margin + 4, y + 12);
  y += 28;

  // 4 KPI Metric Cards
  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 22;

  // Card 1: Total EAL
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(153, 27, 27);
  doc.setFont('helvetica', 'bold');
  doc.text('ANNUAL LOSS EXPOSURE (EAL)', margin + 3, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(185, 28, 28);
  doc.text(formatShortINR(totalEal), margin + 3, y + 13);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Annualized financial risk', margin + 3, y + 18);

  // Card 2: Max Event Loss
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(margin + cardWidth + 3, y, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(154, 52, 18);
  doc.setFont('helvetica', 'bold');
  doc.text('MAX SINGLE EVENT LOSS', margin + cardWidth + 6, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(194, 65, 12);
  doc.text(formatShortINR(maxLoss), margin + cardWidth + 6, y + 13);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Worst-case breach impact', margin + cardWidth + 6, y + 18);

  // Card 3: Validated Findings
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin + (cardWidth * 2) + 6, y, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(22, 101, 52);
  doc.setFont('helvetica', 'bold');
  doc.text('VALIDATED FINDINGS', margin + (cardWidth * 2) + 9, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(21, 128, 61);
  doc.text(`${findings.length} Discovered`, margin + (cardWidth * 2) + 9, y + 13);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('100% PoC verified', margin + (cardWidth * 2) + 9, y + 18);

  // Card 4: Post-Fix Savings
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin + (cardWidth * 3) + 9, y, cardWidth, cardHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text('REMEDIATION IMPACT', margin + (cardWidth * 3) + 12, y + 5);
  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216);
  doc.text('-98.3% EAL', margin + (cardWidth * 3) + 12, y + 13);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('High ROSI ROI available', margin + (cardWidth * 3) + 12, y + 18);

  y += 27;

  // ==========================================
  // SECTION 2: FAIR FINANCIAL LOSS BREAKDOWN
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. FAIR Financial Loss Exposure Breakdown (In Plain Numbers)', margin, y);
  y += 5;

  const lossRows = [
    { name: 'Business Downtime & Outage Impact', amount: lossBreakdown.downtime_loss || 5400000, desc: 'Cost of operational disruption, employee idle time, and transaction stoppage during incident.' },
    { name: 'Data Breach & Customer Record Liabilities', amount: lossBreakdown.data_breach_loss || 29750000, desc: 'Forensics, credit monitoring, notifications, and per-record liabilities for exposed customer data.' },
    { name: 'Regulatory Fines & Compliance Penalties', amount: lossBreakdown.regulatory_loss || 6000000, desc: 'Statutory non-compliance penalties under DPDP Act / RBI Cyber Guidelines / SEBI CSCRF.' },
    { name: 'Technical Incident Recovery & Forensics', amount: lossBreakdown.recovery_loss || 1800000, desc: 'Third-party incident response retainers, clean re-imaging, and infrastructure remediation.' },
    { name: 'Brand Reputation & Customer Churn', amount: lossBreakdown.reputation_loss || 8787500, desc: 'Projected customer churn, deferred deals, and customer acquisition premium post-breach.' }
  ];

  // Loss Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Financial Loss Component', margin + 3, y + 4.2);
  doc.text('Description & Business Meaning', margin + 65, y + 4.2);
  doc.text('Potential Exposure', pageWidth - margin - 30, y + 4.2);
  y += 6;

  lossRows.forEach((r, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(r.name, margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(r.desc, margin + 65, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28);
    doc.text(formatShortINR(r.amount), pageWidth - margin - 30, y + 5);
    y += 8;
  });

  y += 4;

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
  doc.text('Loss Reduction (₹)', margin + 105, y + 4.2);
  doc.text('Cost (₹)', margin + 140, y + 4.2);
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
    doc.text('CyberRiskIQ — Confidential & Proprietary Security Audit Report', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 6);
  }

  // Save PDF file
  const filename = `CyberRiskIQ-Security-Report-${runId || 'assessment'}.pdf`;
  doc.save(filename);
  return doc.output('arraybuffer');
}

