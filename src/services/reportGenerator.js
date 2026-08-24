// src/services/reportGenerator.js
// Generates official PDF reports from CyberRiskIQ Security Assessment findings using jsPDF
import { jsPDF } from 'jspdf';

/**
 * Create a PDF document from CyberRiskIQ Security Assessment results JSON.
 * @param {object} results - Parsed JSON from assessment (output of readAssessmentResults).
 * @param {string} runId - Identifier for the assessment session, used in title/header.
 * @returns {Uint8Array} PDF file bytes.
 */
export function generateSecurityAssessmentPdf(results, runId) {
  const doc = new jsPDF();
  const margin = 14;
  let y = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(`CyberRiskIQ — AI Security Assessment Report`, margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Assessment Session ID: ${runId}`, margin, y);
  y += 6;
  doc.text(`Assessment Mode: ${results?.mode || 'DEMONSTRATION / SYNTHETIC'}`, margin, y);
  y += 6;
  doc.text(`Generated: ${new Date().toISOString()}`, margin, y);
  y += 12;

  if (!results || !Array.isArray(results.findings) || results.findings.length === 0) {
    doc.text('No findings detected during this assessment session.', margin, y);
    return doc.output('arraybuffer');
  }

  // Header line
  doc.setLineWidth(0.5);
  doc.line(margin, y, 196, y);
  y += 8;

  // Table header
  doc.setFont(undefined, 'bold');
  doc.setFontSize(10);
  doc.text('#', margin, y);
  doc.text('Severity', margin + 12, y);
  doc.text('Vulnerability Title', margin + 38, y);
  doc.text('Remediation Guideline', margin + 115, y);
  doc.setFont(undefined, 'normal');
  y += 6;
  doc.line(margin, y, 196, y);
  y += 8;

  results.findings.forEach((f, idx) => {
    const lineHeight = 14;
    const maxY = doc.internal.pageSize.getHeight() - margin;
    if (y + lineHeight > maxY) {
      doc.addPage();
      y = margin;
    }
    doc.text(String(idx + 1), margin, y);
    doc.text(f.severity || '', margin + 12, y);

    const title = (f.title || f.vulnerability || '').substring(0, 42);
    doc.text(title, margin + 38, y);

    const rem = (f.remediation || f.controlState || '').substring(0, 42);
    doc.text(rem, margin + 115, y);

    y += lineHeight;
  });

  return doc.output('arraybuffer');
}

// Backwards compatibility alias
export const generateStrixPdf = generateSecurityAssessmentPdf;
