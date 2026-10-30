import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { MCQQuestion } from '@/types/database';

export interface GenerateMcqPdfOptions {
  title?: string;
  subtitle?: string;
  totalExamQuestions?: number;
  passingScore?: number;
  generatedBy?: string;
}

/**
 * Normalizes unicode strings to standard ASCII characters supported by WinAnsi / standard PDF fonts.
 * Converts smart quotes, special dashes, and decomposed unicode to prevent pdf-lib encoding errors.
 */
function normalizePdfText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2026]/g, '...')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mathematically wraps text to fit within a given maximum point width.
 */
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const clean = normalizePdfText(text);
  if (!clean) return [];
  const words = clean.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Generates an executive, publication-grade PDF document containing the MCQ Question Bank.
 * Designed specifically as an official attachment to weekly management progress reports
 * for Deans, HODs, and the Academic Steering Committee.
 */
export async function generateMcqPoolPdf(
  questions: MCQQuestion[],
  options: GenerateMcqPdfOptions = {}
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const PAGE_WIDTH = 595.28; // Standard A4
  const PAGE_HEIGHT = 841.89;
  const MARGIN_X = 45;
  const MARGIN_TOP = 45;
  const MARGIN_BOTTOM = 45;
  const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN_X * 2);

  // Executive Color Palette
  const cEmeraldDark = rgb(0.024, 0.306, 0.231);  // #064e3b
  const cEmeraldMed = rgb(0.02, 0.588, 0.412);   // #059669
  const cEmeraldLight = rgb(0.925, 0.992, 0.961); // #ecfdf5
  const cTextDark = rgb(0.059, 0.09, 0.165);     // #0f172a
  const cTextMed = rgb(0.278, 0.333, 0.412);     // #475569
  const cTextLight = rgb(0.58, 0.639, 0.722);    // #94a3b8
  const cBgLight = rgb(0.973, 0.98, 0.988);      // #f8fafc
  const cBorder = rgb(0.886, 0.91, 0.941);       // #e2e8f0

  const totalExamQuestions = options.totalExamQuestions || 12;
  const passingScore = options.passingScore || 9;
  const passPercentage = Math.round((passingScore / totalExamQuestions) * 100);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT;

  function newPage() {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN_TOP;

    // Running Header on pages 2+
    page.drawText('THE AI BRIDGE -- OFFICIAL ASSESSMENT QUESTION BANK', {
      x: MARGIN_X,
      y: y + 15,
      size: 7.5,
      font: fontBold,
      color: cEmeraldMed,
    });
    page.drawText('WEEKLY EXECUTIVE MANAGEMENT REPORT ATTACHMENT', {
      x: PAGE_WIDTH - MARGIN_X - 180,
      y: y + 15,
      size: 7,
      font: fontRegular,
      color: cTextLight,
    });
    page.drawLine({
      start: { x: MARGIN_X, y: y + 8 },
      end: { x: PAGE_WIDTH - MARGIN_X, y: y + 8 },
      thickness: 0.5,
      color: cBorder,
    });
  }

  function ensureSpace(neededHeight: number) {
    if (y - neededHeight < MARGIN_BOTTOM + 20) {
      newPage();
      return true;
    }
    return false;
  }

  // ==========================================
  // PAGE 1: TOP INSTITUTIONAL STRIP & HEADER
  // ==========================================
  page.drawRectangle({
    x: 0,
    y: y - 48,
    width: PAGE_WIDTH,
    height: 48,
    color: cEmeraldDark,
  });
  page.drawText('INTERNATIONAL ISLAMIC UNIVERSITY ISLAMABAD (IIUI)', {
    x: MARGIN_X,
    y: y - 22,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText('FACULTY OF MANAGEMENT SCIENCES (FMS)  --  PROJECT GOVERNANCE UNIT', {
    x: MARGIN_X,
    y: y - 36,
    size: 7.5,
    font: fontRegular,
    color: rgb(0.655, 0.898, 0.784),
  });
  y -= 64;

  // Initiative Sub-badge
  page.drawText('THE AI BRIDGE: ACADEMIC EMPOWERMENT & DIGITAL PRODUCTIVITY', {
    x: MARGIN_X,
    y,
    size: 8,
    font: fontBold,
    color: cEmeraldMed,
  });
  y -= 16;

  // Main Document Title
  const docTitle = options.title || 'Course Assessment Question Bank & Specification Roster';
  page.drawText(docTitle, {
    x: MARGIN_X,
    y,
    size: 16,
    font: fontBold,
    color: cTextDark,
  });
  y -= 14;

  const docSubtitle = options.subtitle || 'Formal Evaluation Item Bank -- Official Attachment for Weekly Management Report';
  page.drawText(docSubtitle, {
    x: MARGIN_X,
    y,
    size: 9,
    font: fontRegular,
    color: cTextMed,
  });
  y -= 20;

  // Metadata Panel
  const metaBoxHeight = 72;
  page.drawRectangle({
    x: MARGIN_X,
    y: y - metaBoxHeight,
    width: CONTENT_WIDTH,
    height: metaBoxHeight,
    color: cBgLight,
    borderColor: cBorder,
    borderWidth: 1,
  });
  // Left Accent Bar
  page.drawRectangle({
    x: MARGIN_X,
    y: y - metaBoxHeight,
    width: 4,
    height: metaBoxHeight,
    color: cEmeraldMed,
  });

  const col1X = MARGIN_X + 16;
  const col2X = MARGIN_X + (CONTENT_WIDTH / 2) + 10;
  const metaY1 = y - 18;
  const metaY2 = y - 34;
  const metaY3 = y - 50;

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate unique categories
  const catCounts: Record<string, number> = {};
  questions.forEach((q) => {
    const cat = q.category || 'General';
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });
  const catEntries = Object.entries(catCounts);

  page.drawText(`Date of Generation: ${dateStr}`, { x: col1X, y: metaY1, size: 8, font: fontRegular, color: cTextDark });
  page.drawText(`Active Question Bank: ${questions.length} Validated Items`, { x: col1X, y: metaY2, size: 8, font: fontBold, color: cEmeraldDark });
  page.drawText(`Curricular Domains: ${catEntries.length} Academic Categories`, { x: col1X, y: metaY3, size: 8, font: fontRegular, color: cTextMed });

  page.drawText(`Exam Draw Session: ${totalExamQuestions} Questions (Balanced Sampling)`, { x: col2X, y: metaY1, size: 8, font: fontBold, color: cTextDark });
  page.drawText(`Passing Threshold: ${passingScore} / ${totalExamQuestions} (${passPercentage}% Required)`, { x: col2X, y: metaY2, size: 8, font: fontBold, color: cEmeraldMed });
  page.drawText('Integrity Protocol: Dynamic Option Shuffling + Server-Side Grading', { x: col2X, y: metaY3, size: 8, font: fontRegular, color: cTextMed });

  y -= (metaBoxHeight + 18);

  // Category Breakdown Summary Grid
  if (catEntries.length > 0) {
    page.drawText('CURRICULAR DOMAIN BREAKDOWN', { x: MARGIN_X, y, size: 8.5, font: fontBold, color: cTextDark });
    y -= 12;

    const catGridHeight = Math.ceil(catEntries.length / 3) * 14 + 10;
    page.drawRectangle({
      x: MARGIN_X,
      y: y - catGridHeight,
      width: CONTENT_WIDTH,
      height: catGridHeight,
      color: rgb(1, 1, 1),
      borderColor: cBorder,
      borderWidth: 0.5,
    });

    const cellW = CONTENT_WIDTH / 3;
    catEntries.forEach(([catName, count], idx) => {
      const row = Math.floor(idx / 3);
      const col = idx % 3;
      const cX = MARGIN_X + 8 + (col * cellW);
      const cY = y - 12 - (row * 14);
      page.drawText(`* ${catName}: ${count}`, {
        x: cX,
        y: cY,
        size: 7.5,
        font: fontRegular,
        color: cTextMed,
      });
    });

    y -= (catGridHeight + 20);
  }

  // ==========================================
  // QUESTION ITEMS ROSTER (GROUPED BY CATEGORY)
  // ==========================================
  let currentCategory = '';
  let itemIndex = 0;

  for (const q of questions) {
    itemIndex++;
    const categoryName = q.category || 'General';

    // Section Category Banner
    if (categoryName !== currentCategory) {
      currentCategory = categoryName;
      ensureSpace(45);
      y -= 6;
      page.drawRectangle({
        x: MARGIN_X,
        y: y - 20,
        width: CONTENT_WIDTH,
        height: 20,
        color: cEmeraldLight,
        borderColor: cEmeraldMed,
        borderWidth: 0.5,
      });
      page.drawRectangle({
        x: MARGIN_X,
        y: y - 20,
        width: 3.5,
        height: 20,
        color: cEmeraldMed,
      });
      page.drawText(`SECTION: ${currentCategory.toUpperCase()} (${catCounts[currentCategory]} Items)`, {
        x: MARGIN_X + 10,
        y: y - 14,
        size: 9,
        font: fontBold,
        color: cEmeraldDark,
      });
      y -= 28;
    }

    // Wrap Question Lines
    const qLines = wrapText(`Q${itemIndex}. ${q.question_text}`, fontBold, 9.5, CONTENT_WIDTH);
    const optionsList = Array.isArray(q.options) ? q.options : [];
    const wrappedOptions = optionsList.map((opt, i) => {
      const isCorrect = i === q.correct_option_index;
      const prefix = `${String.fromCharCode(65 + i)}. `;
      const lines = wrapText(`${prefix}${opt}`, isCorrect ? fontBold : fontRegular, 8.5, CONTENT_WIDTH - 24);
      return { isCorrect, lines };
    });

    const expLines = q.explanation
      ? wrapText(`Pedagogical Rationale: ${q.explanation}`, fontItalic, 8, CONTENT_WIDTH - 20)
      : [];

    const totalHeight =
      qLines.length * 13 +
      wrappedOptions.reduce((acc, o) => acc + o.lines.length * 13 + (o.isCorrect ? 6 : 2), 0) +
      (expLines.length > 0 ? expLines.length * 11 + 14 : 0) +
      28;

    ensureSpace(totalHeight);

    // Item Number & Metadata
    page.drawText(`ITEM #${itemIndex}`, { x: MARGIN_X, y, size: 8, font: fontBold, color: cEmeraldDark });
    page.drawText(`Difficulty: ${(q.difficulty || 'intermediate').toUpperCase()}`, {
      x: MARGIN_X + 45,
      y,
      size: 7.5,
      font: fontRegular,
      color: cTextLight,
    });
    y -= 12;

    // Question Text
    for (const line of qLines) {
      page.drawText(line, { x: MARGIN_X, y, size: 9.5, font: fontBold, color: cTextDark });
      y -= 13;
    }
    y -= 4;

    // Options
    for (const opt of wrappedOptions) {
      if (opt.isCorrect) {
        const boxH = opt.lines.length * 13 + 6;
        page.drawRectangle({
          x: MARGIN_X + 6,
          y: y - boxH + 9,
          width: CONTENT_WIDTH - 12,
          height: boxH,
          color: cEmeraldLight,
          borderColor: cEmeraldMed,
          borderWidth: 0.5,
        });
        for (let li = 0; li < opt.lines.length; li++) {
          page.drawText(`${opt.lines[li]}${li === 0 ? '  [CORRECT ANSWER]' : ''}`, {
            x: MARGIN_X + 12,
            y: y - 2,
            size: 8.5,
            font: fontBold,
            color: cEmeraldDark,
          });
          y -= 13;
        }
        y -= 3;
      } else {
        for (const line of opt.lines) {
          page.drawText(line, {
            x: MARGIN_X + 12,
            y,
            size: 8.5,
            font: fontRegular,
            color: cTextDark,
          });
          y -= 13;
        }
        y -= 2;
      }
    }

    // Explanation Box
    if (expLines.length > 0) {
      y -= 3;
      const expBoxH = expLines.length * 11 + 8;
      page.drawRectangle({
        x: MARGIN_X + 6,
        y: y - expBoxH + 8,
        width: CONTENT_WIDTH - 12,
        height: expBoxH,
        color: cBgLight,
        borderColor: cBorder,
        borderWidth: 0.5,
      });
      for (const line of expLines) {
        page.drawText(line, {
          x: MARGIN_X + 12,
          y,
          size: 8,
          font: fontItalic,
          color: cTextMed,
        });
        y -= 11;
      }
      y -= 4;
    }

    // Divider Rule
    y -= 8;
    page.drawLine({
      start: { x: MARGIN_X, y },
      end: { x: PAGE_WIDTH - MARGIN_X, y },
      thickness: 0.5,
      color: cBorder,
    });
    y -= 12;
  }

  // ==========================================
  // PASS 2: DYNAMIC PAGE NUMBERING & FOOTERS
  // ==========================================
  const allPages = doc.getPages();
  const totalPages = allPages.length;

  for (let i = 0; i < totalPages; i++) {
    const p = allPages[i];
    p.drawLine({
      start: { x: MARGIN_X, y: MARGIN_BOTTOM },
      end: { x: PAGE_WIDTH - MARGIN_X, y: MARGIN_BOTTOM },
      thickness: 0.5,
      color: cBorder,
    });
    p.drawText('Confidential -- The AI Bridge -- Faculty of Management Sciences (FMS), IIUI', {
      x: MARGIN_X,
      y: MARGIN_BOTTOM - 14,
      size: 7,
      font: fontRegular,
      color: cTextLight,
    });
    const pageStr = `Page ${i + 1} of ${totalPages}`;
    const strWidth = fontBold.widthOfTextAtSize(pageStr, 7.5);
    p.drawText(pageStr, {
      x: PAGE_WIDTH - MARGIN_X - strWidth,
      y: MARGIN_BOTTOM - 14,
      size: 7.5,
      font: fontBold,
      color: cTextMed,
    });
  }

  return await doc.save();
}
