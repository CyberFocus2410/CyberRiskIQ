// src/services/reportGenerator.js
// Generates a PDF report from Strix findings using jsPDF
import { jsPDF } from 'jspdf';

/**
 * Create a PDF document from Strix results JSON.
 * @param {object} results - Parsed JSON from Strix (output of readStrixResults).
 * @param {string} runId - Identifier for the scan run, used in title/header.
 * @returns {Uint8Array} PDF file bytes.
 */
export function generateStrixPdf(results, runId) {
  const doc = new jsPDF();
  const margin = 10;
  let y = margin;

  doc.setFontSize(18);
  doc.text(`Strix Vulnerability Report`, margin, y);
  y += 8;
  doc.setFontSize(12);
  doc.text(`Run ID: ${runId}`, margin, y);
  y += 8;
  doc.text(`Generated: ${new Date().toISOString()}`, margin, y);
  y += 12;

  if (!results || !Array.isArray(results.findings) || results.findings.length === 0) {
    doc.text('No findings detected.', margin, y);
    return doc.output('arraybuffer');
  }

  // Table header
  doc.setFont(undefined, 'bold');
  doc.text('ID', margin, y);
  doc.text('Severity', margin + 30, y);
  doc.text('Title', margin + 70, y);
  doc.text('Description', margin + 130, y);
  doc.text('Remediation', margin + 180, y);
  doc.setFont(undefined, 'normal');
  y += 8;

  results.findings.forEach((f, idx) => {
    const lineHeight = 6;
    const maxY = doc.internal.pageSize.getHeight() - margin;
    if (y + lineHeight > maxY) {
      doc.addPage();
      y = margin;
    }
    doc.text(String(idx + 1), margin, y);
    doc.text(f.severity || '', margin + 30, y);
    doc.text(f.title || '', margin + 70, y);
    const desc = (f.description || '').substring(0, 30) + (f.description && f.description.length > 30 ? '...' : '');
    doc.text(desc, margin + 130, y);
    const rem = (f.remediation || '').substring(0, 30) + (f.remediation && f.remediation.length > 30 ? '...' : '');
    doc.text(rem, margin + 180, y);
    y += lineHeight;
  });

  return doc.output('arraybuffer');
}
