import PDFDocument from 'pdfkit';
import { Response } from 'express';

const COLORS = { primary: '#1a7a4a', muted: '#666666', line: '#e0e0e0' };

export function generateJobPDF(job: any, res: Response) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // ── Header ────────────────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.primary);
  doc.fillColor('white').fontSize(24).font('Helvetica-Bold').text('Job Report', 50, 28);
  doc.fillColor('black').moveDown(3);

  // ── Metadata ──────────────────────────────────────────────────────────────
  section(doc, 'Job Details');
  row(doc, 'Job ID', job.id);
  row(doc, 'Title', job.title);
  if (job.description) row(doc, 'Description', job.description);
  row(doc, 'Status', job.status.replace(/_/g, ' ').toUpperCase());
  row(doc, 'Created', fmt(job.createdAt));
  if (job.completedAt) row(doc, 'Completed', fmt(job.completedAt));
  doc.moveDown();

  // ── Stakeholders ──────────────────────────────────────────────────────────
  section(doc, 'Stakeholders');
  row(doc, 'Admin', job.admin?.name ?? 'N/A');
  row(doc, 'Manager', job.manager?.name ?? 'N/A');
  row(doc, 'QA Engineer', job.qa?.name ?? 'N/A');
  doc.moveDown();

  // ── Task Ledger ───────────────────────────────────────────────────────────
  section(doc, 'Task Ledger');

  for (const task of job.tasks as any[]) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.primary)
      .text(`Task ${task.sequenceNumber} — ${task.installer?.installerType?.name ?? 'N/A'}`);
    doc.fillColor('black').fontSize(10).font('Helvetica');
    row(doc, 'Installer', task.installer?.name ?? 'N/A');
    row(doc, 'Status', task.status.toUpperCase());
    row(doc, 'Description', task.description);
    if (task.managerComments) row(doc, 'Manager Comments', task.managerComments);
    row(doc, 'Media Files', String(task.media?.length ?? 0));
    divider(doc);
  }

  // ── QA Sign-off ───────────────────────────────────────────────────────────
  if (job.qaReviews?.length > 0) {
    section(doc, 'QA Sign-off Log');
    for (const review of job.qaReviews as any[]) {
      row(doc, 'Decision', review.decision.toUpperCase());
      row(doc, 'Timestamp', fmt(review.createdAt));
      if (review.comments) row(doc, 'Comments', review.comments);
      divider(doc);
    }
  }

  doc.end();
}

function section(doc: PDFKit.PDFDocument, title: string) {
  doc.fontSize(14).font('Helvetica-Bold').fillColor(COLORS.primary).text(title);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.line).stroke();
  doc.moveDown(0.4).fillColor('black');
}

function row(doc: PDFKit.PDFDocument, label: string, value: string) {
  doc.fontSize(10).font('Helvetica-Bold').text(`${label}: `, { continued: true });
  doc.font('Helvetica').text(value);
}

function divider(doc: PDFKit.PDFDocument) {
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(COLORS.line).lineWidth(0.5).stroke();
  doc.moveDown(0.5);
}

function fmt(date: string | Date) {
  return new Date(date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}
