import { jsPDF } from "jspdf";
import type { OrganisationSettings, PlainLanguageReport } from "@/types";

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return [30, 58, 138];
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

export function exportReportToPdf(
  report: PlainLanguageReport,
  org: OrganisationSettings
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxWidth = pageWidth - margin * 2;
  const [r, g, b] = hexToRgb(org.accentColor || "#1E3A8A");

  // Top brand header bar
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(org.name, margin, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `CONFIDENTIAL CASE PORTFOLIO  |  ${org.type}  |  UK GDPR Protected`,
    margin,
    19
  );

  let y = 36;

  // Report Title
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(report.title, maxWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 7 + 3;

  // Metadata strip
  const audienceLabels = {
    parent: "Parent / Carer Plain-Language Summary",
    teacher: "Teacher / SENCO Classroom Action Plan",
    supervision: "Clinical Supervision Case Portfolio",
  };

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, maxWidth, 16, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Pupil Alias: ${report.pupilAlias}   |   Year Group: ${report.yearGroup}   |   Format: ${audienceLabels[report.audience]}`,
    margin + 4,
    y + 6.5
  );
  doc.text(
    `Prepared by: ${report.createdByName}   |   Date: ${new Date(
      report.updatedAt
    ).toLocaleDateString("en-GB")}`,
    margin + 4,
    y + 12.5
  );
  y += 24;

  const ensureSpace = (needed: number) => {
    if (y + needed > 272) {
      doc.addPage();
      y = 20;
    }
  };

  // Plain-Language Overview
  doc.setTextColor(r, g, b);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Overview", margin, y);
  y += 6;

  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const overviewLines = doc.splitTextToSize(report.plainSummary, maxWidth);
  doc.text(overviewLines, margin, y);
  y += overviewLines.length * 5.2 + 8;

  // Key Takeaways
  if (report.keyTakeaways.length > 0) {
    ensureSpace(25);
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Key Points", margin, y);
    y += 6;

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const point of report.keyTakeaways) {
      const lines = doc.splitTextToSize(`•  ${point}`, maxWidth - 3);
      ensureSpace(lines.length * 5 + 3);
      doc.text(lines, margin + 2, y);
      y += lines.length * 5 + 2;
    }
    y += 5;
  }

  // Detailed Sections
  for (const sec of report.sections) {
    ensureSpace(24);
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.text(sec.heading, margin, y);
    y += 6;

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const bodyLines = doc.splitTextToSize(sec.body, maxWidth);
    ensureSpace(bodyLines.length * 5 + 6);
    doc.text(bodyLines, margin, y);
    y += bodyLines.length * 5 + 7;
  }

  // Next Steps
  if (report.nextSteps.length > 0) {
    ensureSpace(25);
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Agreed Next Steps", margin, y);
    y += 6;

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    report.nextSteps.forEach((step, idx) => {
      const lines = doc.splitTextToSize(`${idx + 1}.  ${step}`, maxWidth - 3);
      ensureSpace(lines.length * 5 + 3);
      doc.text(lines, margin + 2, y);
      y += lines.length * 5 + 2.5;
    });
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 280, pageWidth - margin, 280);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const footerLines = doc.splitTextToSize(org.reportFooter, maxWidth - 20);
    doc.text(footerLines, margin, 285);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 18, 285);
  }

  const safeAlias = report.pupilAlias.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  doc.save(`superviz-${safeAlias}-${report.audience}-report.pdf`);
}
