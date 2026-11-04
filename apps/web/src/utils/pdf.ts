export interface ReportPdfData {
  overallScore: number;
  overallConfidence: number;
  primaryConcerns: string[];
  date: string;
  concerns: Array<{
    id: string;
    label: string;
    score: number;
    severity: string;
  }>;
  qualityMetrics: {
    lightingEvenness: number;
    blurScore: number;
  };
}

/**
 * Escapes characters for PDF literal text strings: ( ) \
 */
function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Generates a valid, self-contained PDF 1.4 document as a Uint8Array.
 * Entirely client-side with zero external dependencies.
 */
export function generateReportPdfBytes(data: ReportPdfData): Uint8Array {
  const lines: string[] = [];
  const textStream: string[] = [];

  // Stream content commands
  textStream.push("BT");
  textStream.push("/F1 22 Tf");
  textStream.push(`50 740 Td (${escapePdfText("DermaLens Skin Analysis Report")}) Tj`);

  textStream.push("/F1 10 Tf");
  textStream.push(`0 -24 Td (${escapePdfText(`Generated: ${data.date} | 100% On-Device Processing`)}) Tj`);

  textStream.push("/F1 14 Tf");
  textStream.push(`0 -36 Td (${escapePdfText(`Composite Skin Index: ${data.overallScore} / 100`)}) Tj`);
  textStream.push(`0 -22 Td (${escapePdfText(`Capture Quality Confidence: ${data.overallConfidence}%`)}) Tj`);
  textStream.push(`0 -22 Td (${escapePdfText(`Top Focus Areas: ${data.primaryConcerns.join(", ")}`)}) Tj`);

  textStream.push("/F1 12 Tf");
  textStream.push(`0 -32 Td (${escapePdfText("--- COSMETIC CONCERN BREAKDOWN ---")}) Tj`);

  textStream.push("/F1 11 Tf");
  for (const c of data.concerns) {
    const row = `${c.label}: Score ${c.score}/100  [${c.severity}]`;
    textStream.push(`0 -20 Td (${escapePdfText(row)}) Tj`);
  }

  textStream.push("/F1 10 Tf");
  textStream.push(`0 -32 Td (${escapePdfText("Environmental Quality Verification:")}) Tj`);
  textStream.push(`0 -16 Td (${escapePdfText(`Lighting Evenness: ${(data.qualityMetrics.lightingEvenness * 100).toFixed(0)}% | Sharpness Index: ${data.qualityMetrics.blurScore.toFixed(0)}`)}) Tj`);

  textStream.push("/F1 8 Tf");
  textStream.push(`0 -40 Td (${escapePdfText("DISCLAIMER: DermaLens provides cosmetic measurement indices only. It is not a medical device")}) Tj`);
  textStream.push(`0 -12 Td (${escapePdfText("and does not diagnose, treat, or cure any skin disease. For clinical concerns, consult a dermatologist.")}) Tj`);
  textStream.push("ET");

  const streamContent = textStream.join("\n");
  const streamLength = streamContent.length;

  // Build PDF 1.4 body
  lines.push("%PDF-1.4");
  lines.push("%\xE2\xE3\xCF\xD3"); // Binary marker

  const offsets: number[] = [0];
  let currentOffset = lines.join("\n").length + 1;

  // Object 1: Catalog
  offsets.push(currentOffset);
  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj";
  lines.push(obj1);
  currentOffset += obj1.length + 1;

  // Object 2: Pages
  offsets.push(currentOffset);
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj";
  lines.push(obj2);
  currentOffset += obj2.length + 1;

  // Object 3: Page
  offsets.push(currentOffset);
  const obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj";
  lines.push(obj3);
  currentOffset += obj3.length + 1;

  // Object 4: Stream
  offsets.push(currentOffset);
  const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`;
  lines.push(obj4);
  currentOffset += obj4.length + 1;

  // Object 5: Font Helvetica
  offsets.push(currentOffset);
  const obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj";
  lines.push(obj5);
  currentOffset += obj5.length + 1;

  // Xref table
  const startXref = currentOffset;
  lines.push("xref");
  lines.push("0 6");
  lines.push("0000000000 65535 f ");
  for (let i = 1; i <= 5; i++) {
    const offset = offsets[i] ?? 0;
    lines.push(`${String(offset).padStart(10, "0")} 00000 n `);
  }

  // Trailer
  lines.push("trailer");
  lines.push("<< /Size 6 /Root 1 0 R >>");
  lines.push("startxref");
  lines.push(String(startXref));
  lines.push("%%EOF");

  const fullPdfString = lines.join("\n");
  const bytes = new Uint8Array(fullPdfString.length);
  for (let i = 0; i < fullPdfString.length; i++) {
    bytes[i] = fullPdfString.charCodeAt(i) & 0xff;
  }

  return bytes;
}

/**
 * Triggers a browser download of the generated PDF report.
 */
export function downloadReportPdf(data: ReportPdfData, filename = "dermalens-report.pdf"): void {
  if (typeof window === "undefined") return;

  const bytes = generateReportPdfBytes(data);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Triggers native browser print / save-as-PDF dialog.
 */
export function printReport(): void {
  if (typeof window !== "undefined") {
    window.print();
  }
}
