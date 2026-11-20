import { jsPDF } from "jspdf";
import type { OrganisationSettings, PlainLanguageReport } from "@/types";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return [31, 77, 58];
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

const INK: [number, number, number] = [26, 25, 21];
const INK_2: [number, number, number] = [70, 67, 60];
const INK_3: [number, number, number] = [138, 132, 120];
const RULE: [number, number, number] = [226, 220, 207];

const AUDIENCE_LABEL = {
  parent: "Summary for parents and carers",
  teacher: "Classroom plan for teacher and SENCO",
  supervision: "Supervision record",
} as const;

/**
 * Exports a report as a quiet, letter-style A4 document:
 * thin accent rule, serif headings, generous margins.
 */
export function exportReportToPdf(report: PlainLanguageReport, org: OrganisationSettings) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 22;
  const maxWidth = pageWidth - margin * 2;
  const accent = hexToRgb(org.accentColor || "#1F4D3A");
  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > 270) {
      doc.addPage();
      y = 24;
    }
  };

  const heading = (text: string, size = 13) => {
    ensureSpace(18);
    doc.setFont("times", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...INK);
    doc.text(text, margin, y);
    y += 6.5;
  };

  const paragraph = (text: string, size = 10.5, color = INK_2, indent = 0) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, maxWidth - indent);
    const lh = size * 0.5;
    for (const line of lines) {
      ensureSpace(lh + 1);
      doc.text(line, margin + indent, y);
      y += lh;
    }
  };

  // Letterhead
  doc.setFillColor(...accent);
  doc.rect(0, 0, pageWidth, 2.5, "F");

  doc.setFont("times", "normal");
  doc.setFontSize(15);
  doc.setTextColor(...INK);
  doc.text(org.name, margin, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK_3);
  doc.text(org.type, margin, 23.5);
  doc.text("CONFIDENTIAL", pageWidth - margin, 18, { align: "right" });
  doc.text(new Date(report.updatedAt).toLocaleDateString("en-GB"), pageWidth - margin, 23.5, { align: "right" });

  doc.setDrawColor(...RULE);
  doc.line(margin, 29, pageWidth - margin, 29);

  // Title block
  y = 44;
  doc.setFont("times", "normal");
  doc.setFontSize(21);
  doc.setTextColor(...INK);
  const titleLines = doc.splitTextToSize(report.title, maxWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 1;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK_3);
  doc.text(
    `${report.pupilAlias}  ·  ${report.yearGroup}  ·  ${AUDIENCE_LABEL[report.audience]}  ·  Prepared by ${report.createdByName}`,
    margin,
    y
  );
  y += 12;

  // Overview
  paragraph(report.plainSummary, 11.5, INK);
  y += 7;

  // In brief
  if (report.keyTakeaways.length > 0) {
    heading("In brief");
    for (const point of report.keyTakeaways) {
      ensureSpace(6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...INK_3);
      doc.text("—", margin, y);
      paragraph(point, 10.5, INK_2, 6);
      y += 1.5;
    }
    y += 5;
  }

  // Sections
  for (const sec of report.sections) {
    heading(sec.heading);
    paragraph(sec.body);
    y += 7;
  }

  // Next steps
  if (report.nextSteps.length > 0) {
    ensureSpace(20);
    doc.setDrawColor(...RULE);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    y += 6;
    heading("Agreed next steps");
    report.nextSteps.forEach((step, idx) => {
      ensureSpace(6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...INK_3);
      doc.text(`${idx + 1}.`, margin, y);
      paragraph(step, 10.5, INK_2, 7);
      y += 2;
    });
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RULE);
    doc.line(margin, 279, pageWidth - margin, 279);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK_3);
    const footerLines = doc.splitTextToSize(org.reportFooter, maxWidth - 24);
    doc.text(footerLines, margin, 284);
    doc.text(`${i} / ${pageCount}`, pageWidth - margin, 284, { align: "right" });
  }

  const safeAlias = report.pupilAlias.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  doc.save(`${safeAlias}-${report.audience}-report.pdf`);
}
