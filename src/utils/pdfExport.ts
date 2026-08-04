import jsPDF from 'jspdf';

export function exportLiteratureReviewPDF(review: {
  title: string;
  topicCategory?: string;
  executiveSummary?: string;
  content?: string;
  sections?: any;
  citations?: any[];
  papersCount?: number;
  createdDate?: string;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('AUTOMATED LITERATURE REVIEW SUMMARY', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254); // Indigo-200
  const dateStr = review.createdDate ? new Date(review.createdDate).toLocaleDateString() : new Date().toLocaleDateString();
  doc.text(`Generated: ${dateStr}  |  Papers Indexed: ${review.papersCount || 'All'}`, margin, 20);

  y = 36;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Title
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const titleLines = doc.splitTextToSize(review.title || 'Literature Review', contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 6 + 4;

  // Executive Summary Box
  if (review.executiveSummary) {
    checkPageBreak(25);
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.setDrawColor(226, 232, 240);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(79, 70, 229); // Indigo-600

    const summaryLines = doc.splitTextToSize(review.executiveSummary, contentWidth - 6);
    const boxHeight = summaryLines.length * 4.8 + 10;

    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');
    doc.text('EXECUTIVE SUMMARY', margin + 3, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(summaryLines, margin + 3, y + 12);

    y += boxHeight + 8;
  }

  // Content Body
  const rawBody = review.content || (typeof review.sections === 'string' ? review.sections : '');
  if (rawBody) {
    checkPageBreak(15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);

    const paragraphs = rawBody.split('\n');
    for (const p of paragraphs) {
      const cleanP = p.trim();
      if (!cleanP) {
        y += 2.5;
        continue;
      }

      if (cleanP.startsWith('#')) {
        checkPageBreak(12);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(30, 41, 59);
        const headingText = cleanP.replace(/^#+\s*/, '');
        const headingLines = doc.splitTextToSize(headingText, contentWidth);
        doc.text(headingLines, margin, y);
        y += headingLines.length * 5.5 + 2;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
      } else {
        const pLines = doc.splitTextToSize(cleanP, contentWidth);
        for (const line of pLines) {
          checkPageBreak(5);
          doc.text(line, margin, y);
          y += 4.5;
        }
        y += 1.5;
      }
    }
  }

  // Citations
  if (review.citations && review.citations.length > 0) {
    y += 6;
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('SOURCE CITATIONS & VECTOR EXCERPTS', margin, y);
    y += 6;

    for (const cite of review.citations) {
      checkPageBreak(16);
      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`[${cite.citationId}] ${cite.paperTitle} (${cite.year}) - ${cite.sectionName}`, margin, y);
      y += 4;

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      const snippetLines = doc.splitTextToSize(`"${cite.snippet}"`, contentWidth);
      for (const sLine of snippetLines.slice(0, 3)) {
        checkPageBreak(4.5);
        doc.text(sLine, margin + 2, y);
        y += 4;
      }
      y += 2.5;
    }
  }

  const safeFilename = review.title
    ? review.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 35)
    : 'literature_review_summary';
  doc.save(`${safeFilename}.pdf`);
}

export function exportSynthesisPDF(result: {
  query: string;
  answer: string;
  papersUsedCount: number;
  citations: any[];
  executionTimeMs: number;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('RESEARCH SYNTHESIS REPORT', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(199, 210, 254);
  doc.text(`Synthesized across ${result.papersUsedCount} Papers  |  RAG Latency: ${result.executionTimeMs}ms`, margin, 20);

  y = 36;

  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Query Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(79, 70, 229);

  const queryLines = doc.splitTextToSize(`QUERY: "${result.query}"`, contentWidth - 6);
  const qBoxHeight = queryLines.length * 4.8 + 8;
  doc.roundedRect(margin, y, contentWidth, qBoxHeight, 2, 2, 'FD');
  doc.text(queryLines, margin + 3, y + 6);

  y += qBoxHeight + 8;

  // Answer Content
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  const paragraphs = result.answer.split('\n');
  for (const p of paragraphs) {
    const cleanP = p.trim();
    if (!cleanP) {
      y += 2.5;
      continue;
    }

    if (cleanP.startsWith('#')) {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(30, 41, 59);
      const headingText = cleanP.replace(/^#+\s*/, '');
      const headingLines = doc.splitTextToSize(headingText, contentWidth);
      doc.text(headingLines, margin, y);
      y += headingLines.length * 5.5 + 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
    } else {
      const pLines = doc.splitTextToSize(cleanP, contentWidth);
      for (const line of pLines) {
        checkPageBreak(5);
        doc.text(line, margin, y);
        y += 4.5;
      }
      y += 1.5;
    }
  }

  // Citations
  if (result.citations && result.citations.length > 0) {
    y += 6;
    checkPageBreak(20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('EVIDENCE & CITATION SOURCES', margin, y);
    y += 6;

    for (const cite of result.citations) {
      checkPageBreak(16);
      doc.setTextColor(79, 70, 229);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`[${cite.citationId}] ${cite.paperTitle} (${cite.year}) - ${cite.sectionName}`, margin, y);
      y += 4;

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      const snippetLines = doc.splitTextToSize(`"${cite.snippet}"`, contentWidth);
      for (const sLine of snippetLines.slice(0, 3)) {
        checkPageBreak(4.5);
        doc.text(sLine, margin + 2, y);
        y += 4;
      }
      y += 2.5;
    }
  }

  const safeFilename = result.query.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
  doc.save(`synthesis_${safeFilename || 'report'}.pdf`);
}
