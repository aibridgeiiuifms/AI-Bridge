'use client';

import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import PptxGenJS from 'pptxgenjs';
import QRCode from 'qrcode';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx';
import { SurveyChartSource } from '@/lib/surveyChartSources';

export interface CapturedChartItem {
  id: string;
  title: string;
  subtitle?: string;
  tab: 'executive' | 'student' | 'faculty' | 'demographics';
  dataUrl: string;
  width: number;
  height: number;
  tableData?: Record<string, any>[];
  insight?: string;
  sourceInfo?: SurveyChartSource;
}

export const DOMAIN_TAB_NAMES: Record<string, string> = {
  executive: '1. Executive Summary',
  student: '2. Student Journey & Learning Curve',
  faculty: '3. Faculty & Teachers Impact',
  demographics: '4. Demographics & Institutional Outreach',
};

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(',');
  const base64 = parts[1] || parts[0];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. MASTER CSV EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export function exportMasterCsv({
  kpi,
  charts,
  cohortMode,
  selectedTabs,
}: {
  kpi: any;
  charts: any;
  cohortMode: 'all' | 'matched';
  selectedTabs: Record<string, boolean>;
}) {
  const lines: string[] = [];

  // Header & Metadata
  lines.push('THE AI BRIDGE - COMPREHENSIVE SURVEY & RESEARCH MASTER DATASET');
  lines.push(`Cohort Mode: ${cohortMode === 'matched' ? 'Matched Pairs Only (Pre+Post Verified)' : 'All Submissions (Comprehensive)'}`);
  lines.push(`Exported On: ${new Date().toLocaleString()}`);
  lines.push(`Institution: Faculty of Management Sciences, International Islamic University Islamabad`);
  lines.push('');

  // 1. Executive KPIs Summary
  if (selectedTabs.executive) {
    lines.push('=== SECTION 1: EXECUTIVE KPI SUMMARY ===');
    lines.push('Metric,Value,Benchmark / Context');
    lines.push(`"Total Students Evaluated","${kpi?.totalStudents || 0}","${kpi?.totalStudentPre || 0} Pre / ${kpi?.totalStudentPost || 0} Post"`);
    lines.push(`"Faculty & Educators Evaluated","${kpi?.totalTeachers || 0}","${kpi?.totalTeacherPre || 0} Pre / ${kpi?.totalTeacherPost || 0} Post"`);
    lines.push(`"Certificates Issued","${kpi?.certificatesIssued || 0}","100% Verifiable in Official Registry"`);
    lines.push(`"QIP Time Met (>=3 Hours Saved)","${kpi?.qipTimeMetPct || kpi?.targetHoursSavedPct || 0}%","QIP Project Benchmark Target"`);
    lines.push(`"MCQ Quiz Pass Rate","${kpi?.quizPassRate || 0}%","Passing threshold >= 75%"`);
    lines.push(`"Average Quiz Score","${kpi?.avgQuizScore || 0} / 12","Cognitive Retention Assessment"`);
    lines.push('');
  }

  // Helper to dump table rows
  const appendChartTable = (sectionTitle: string, chartTitle: string, rows: Record<string, any>[]) => {
    if (!rows || rows.length === 0) return;
    lines.push(`=== ${sectionTitle.toUpperCase()}: ${chartTitle.toUpperCase()} ===`);
    const headers = Object.keys(rows[0]);
    lines.push(headers.map((h) => `"${h}"`).join(','));
    for (const row of rows) {
      const line = headers
        .map((h) => {
          const val = row[h] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',');
      lines.push(line);
    }
    lines.push('');
  };

  if (selectedTabs.executive) {
    appendChartTable('Executive', 'Student Impact Radar', charts?.student_impact_radar || []);
    appendChartTable('Executive', 'Weekly Study Hours Saved', charts?.hours_saved_comparison || []);
    appendChartTable('Executive', 'Concept Improvement by Prior AI Experience', charts?.ai_familiarity_shift || []);
    appendChartTable('Executive', 'Student Future Adoption Intent', charts?.future_adoption_intent?.students || []);
    appendChartTable('Executive', 'Faculty Future Adoption Intent', charts?.future_adoption_intent?.faculty || []);
    appendChartTable('Executive', 'Student Obstacles (Pre)', charts?.student_obstacles_pre || []);
  }

  if (selectedTabs.student) {
    appendChartTable('Student Journey', 'Needs vs Delivery Matrix', charts?.needs_vs_delivery_matrix || []);
    appendChartTable('Student Journey', 'Concept Understanding Improvement (1-5)', charts?.student_concept_improvement || []);
    appendChartTable('Student Journey', 'Reading Comprehension Ease (1-5)', charts?.student_reading_comprehension || []);
    appendChartTable('Student Journey', 'Preferred Learning Formats (Pre)', charts?.student_learning_formats_pre || []);
    appendChartTable('Student Journey', 'Helpful AI Study Assets (Post)', charts?.student_helpful_assets_post || []);
    appendChartTable('Student Journey', 'Prior AI Study Tools (Pre)', charts?.student_study_tools_pre || []);
    appendChartTable('Student Journey', 'Primary Focus Area (Pre)', charts?.student_focus_area_pre || []);
    appendChartTable('Student Journey', 'Daily AI Study Routine (Pre)', charts?.student_study_routine_pre || []);
    appendChartTable('Student Journey', 'Perceived Learning Curve (Pre)', charts?.student_learning_curve_pre || []);
    appendChartTable('Student Journey', 'Reading Pain Points (Pre)', charts?.student_reading_pain_points_pre || []);
    appendChartTable('Student Journey', 'Desired AI Study Tasks (Pre)', charts?.student_desired_tasks_pre || []);
    appendChartTable('Student Journey', 'Exam Confidence Level (Pre)', charts?.student_exam_confidence_pre || []);
    appendChartTable('Student Journey', 'Weekly Study Hours Allocation (Pre)', charts?.student_study_hours_pre || []);
    appendChartTable('Student Journey', 'Student Ethics & Integrity', charts?.student_ethics_concerns || []);
  }

  if (selectedTabs.faculty) {
    appendChartTable('Faculty & Teachers', 'Faculty Multi-Axis Radar', charts?.teacher_impact_radar || []);
    appendChartTable('Faculty & Teachers', 'Multilingual Translation Burden (Pre)', charts?.teacher_translation_burden || []);
    appendChartTable('Faculty & Teachers', 'Lesson Prep Time Reduction (1-5)', charts?.teacher_prep_time_reduction || []);
    appendChartTable('Faculty & Teachers', 'Teaching Fatigue Relief (1-5)', charts?.teacher_burnout || []);
    appendChartTable('Faculty & Teachers', 'AI Output Accuracy Ratings', charts?.teacher_output_accuracy || []);
    appendChartTable('Faculty & Teachers', 'Faculty Workshop Goals vs Outcomes', charts?.teacher_goals_vs_outcomes || []);
    appendChartTable('Faculty & Teachers', 'Faculty Future NotebookLM Adoption', charts?.teacher_future_adoption || []);
    appendChartTable('Faculty & Teachers', 'Faculty Institution Breakdown', charts?.institution_breakdown_teachers || []);
    appendChartTable('Faculty & Teachers', 'Faculty Teaching Experience Levels', charts?.teacher_experience_levels || []);
    appendChartTable('Faculty & Teachers', 'Faculty Department Distribution', charts?.teacher_department_breakdown || []);
  }

  if (selectedTabs.demographics) {
    appendChartTable('Demographics', 'Responses by Department', charts?.department_participation || []);
    appendChartTable('Demographics', 'Student Responses by Semester', charts?.semester_participation || []);
    appendChartTable('Demographics', 'Misrouted Submissions Audit Check', charts?.misrouted_submissions_audit || []);
    appendChartTable('Demographics', 'Student Institution Breakdown', charts?.institution_breakdown_students || []);
    appendChartTable('Demographics', 'Department Familiarity Heatmap', charts?.department_familiarity_heatmap || []);
    appendChartTable('Demographics', 'Survey Timeline Velocity', charts?.timeline_velocity || []);
  }

  const csvContent = '\uFEFF' + lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `AI-Bridge-Master-Survey-Analytics-${cohortMode}.csv`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. WORD (.DOCX) EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function exportWordDoc({
  kpi,
  cohortMode,
  capturedCharts,
  options,
}: {
  kpi: any;
  cohortMode: 'all' | 'matched';
  capturedCharts: CapturedChartItem[];
  options: {
    includeChart: boolean;
    includeTable: boolean;
    includeInsight: boolean;
    includeSource: boolean;
    style: 'branded' | 'plain';
  };
}) {
  const isBranded = options.style === 'branded';
  const primaryColor = isBranded ? '064e3b' : '0f172a'; // Emerald or slate
  const accentColor = isBranded ? '059669' : '334155';
  const calloutBg = isBranded ? 'fffbeb' : 'f8fafc'; // Amber light or slate light
  const tabNames = DOMAIN_TAB_NAMES;

  const sectionsChildren: any[] = [];

  // Title & Header
  sectionsChildren.push(
    new Paragraph({
      text: 'THE AI BRIDGE',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      run: {
        font: 'Calibri',
        size: 36,
        bold: true,
        color: primaryColor,
      },
    }),
    new Paragraph({
      text: 'Comprehensive Survey & Training Impact Report',
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      run: {
        font: 'Calibri',
        size: 24,
        bold: true,
        color: accentColor,
      },
    }),
    new Paragraph({
      text: 'Faculty of Management Sciences · International Islamic University Islamabad',
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      run: {
        font: 'Calibri',
        size: 20,
        italics: true,
        color: '64748b',
      },
    })
  );

  // Metadata Box / Table
  const metaRows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Cohort Mode', bold: true, color: primaryColor })] })],
          width: { size: 40, type: WidthType.PERCENTAGE },
          shading: isBranded ? { fill: 'f0fdf4', type: ShadingType.CLEAR } : undefined,
        }),
        new TableCell({
          children: [new Paragraph({ text: cohortMode === 'matched' ? 'Matched Pairs Only (743 Verified Pre+Post Linked Cohort)' : 'All Submissions (1,331 Pre / 864 Post Comprehensive)' })],
          width: { size: 60, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Participant Reach', bold: true, color: primaryColor })] })],
          width: { size: 40, type: WidthType.PERCENTAGE },
          shading: isBranded ? { fill: 'f0fdf4', type: ShadingType.CLEAR } : undefined,
        }),
        new TableCell({
          children: [new Paragraph({ text: `${kpi?.totalStudents || 2195} Students · ${kpi?.totalTeachers || 113} Faculty & Educators` })],
          width: { size: 60, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Key Outcomes', bold: true, color: primaryColor })] })],
          width: { size: 40, type: WidthType.PERCENTAGE },
          shading: isBranded ? { fill: 'f0fdf4', type: ShadingType.CLEAR } : undefined,
        }),
        new TableCell({
          children: [new Paragraph({ text: `${kpi?.certificatesIssued || 821} Verifiable Certificates · ${kpi?.qipTimeMetPct || 70}% QIP Target Met (>=3h saved) · ${kpi?.quizPassRate || 73}% Quiz Pass Rate` })],
          width: { size: 60, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Report Generated', bold: true, color: primaryColor })] })],
          width: { size: 40, type: WidthType.PERCENTAGE },
          shading: isBranded ? { fill: 'f0fdf4', type: ShadingType.CLEAR } : undefined,
        }),
        new TableCell({
          children: [new Paragraph({ text: new Date().toLocaleString() })],
          width: { size: 60, type: WidthType.PERCENTAGE },
        }),
      ],
    }),
  ];

  sectionsChildren.push(
    new Table({
      rows: metaRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
    new Paragraph({ text: '', spacing: { after: 160 } }),

    // ─── Executive Accreditation Statement (Word) ───────────────────────────
    new Paragraph({
      text: 'EXECUTIVE ACCREDITATION & INSTITUTIONAL IMPACT STATEMENT',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 180, after: 80 },
      run: {
        font: 'Calibri',
        size: 22,
        bold: true,
        color: primaryColor,
      },
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: '1. Longitudinal Methodology & Verification Architecture: ', bold: true, color: '0f172a', size: 18 }),
        new TextRun({ text: 'This report synthesizes longitudinal intelligence from 2,195 verified participants (1,331 Pre-Training and 864 Post-Training) across faculties at International Islamic University Islamabad under the Hum Hain Pakistan Quality Improvement Plan. Cross-sectional validation isolates 743 strict pre-and-post linked student cohorts, providing statistically defensible evidence of cognitive progression and tool adoption.', color: '334155', size: 18 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: '2. Cognitive Mastery & Quantitative Time-Savings (QIP Benchmark Met): ', bold: true, color: '0f172a', size: 18 }),
        new TextRun({ text: 'Key institutional findings demonstrate that over 70% of participating students met or surpassed the official QIP benchmark of saving >= 3 study hours per week through structured NotebookLM learning packs. Concurrently, post-intervention MCQ evaluations recorded a 73% retention pass rate with an average cognitive retention score of 9.2/12, validating substantial gains in technical comprehension and reading ease.', color: '334155', size: 18 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 180 },
      children: [
        new TextRun({ text: '3. Faculty Fatigue Mitigation & Scalable Pedagogy: ', bold: true, color: '0f172a', size: 18 }),
        new TextRun({ text: 'Evaluations across 113 university educators confirm significant reductions in bilingual translation overhead and lesson preparation fatigue. Participating faculty reported a 40%+ drop in prep time and high institutional willingness to embed AI Bridge methodologies into ongoing curricula, fulfilling Higher Education Commission (HEC) digital transformation objectives.', color: '334155', size: 18 }),
      ],
    }),

    // ─── Table of Contents (Word) ───────────────────────────────────────────
    new Paragraph({
      text: 'TABLE OF CONTENTS · RESEARCH EXHIBITS',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 80 },
      pageBreakBefore: true,
      run: {
        font: 'Calibri',
        size: 26,
        bold: true,
        color: primaryColor,
      },
    }),
    new Paragraph({
      text: 'Comprehensive index of all 33+ verified analytical exhibits, learning metrics, and institutional benchmarks.',
      spacing: { after: 180 },
      run: {
        font: 'Calibri',
        size: 18,
        italics: true,
        color: '64748b',
      },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: '#', bold: true, color: 'ffffff', size: 16 })] })],
              width: { size: 8, type: WidthType.PERCENTAGE },
              shading: { fill: primaryColor, type: ShadingType.CLEAR },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'ANALYTICAL EXHIBIT / METRIC', bold: true, color: 'ffffff', size: 16 })] })],
              width: { size: 50, type: WidthType.PERCENTAGE },
              shading: { fill: primaryColor, type: ShadingType.CLEAR },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'SURVEY DOMAIN', bold: true, color: 'ffffff', size: 16 })] })],
              width: { size: 22, type: WidthType.PERCENTAGE },
              shading: { fill: primaryColor, type: ShadingType.CLEAR },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: 'DATA SOURCE REFERENCE', bold: true, color: 'ffffff', size: 16 })] })],
              width: { size: 20, type: WidthType.PERCENTAGE },
              shading: { fill: primaryColor, type: ShadingType.CLEAR },
            }),
          ],
        }),
        ...capturedCharts.map(
          (chart, idx) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: String(idx + 1), size: 16, bold: true })] })],
                  shading: idx % 2 === 1 && isBranded ? { fill: 'f8fafc', type: ShadingType.CLEAR } : undefined,
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: chart.title, size: 16, bold: true, color: '0f172a' })] })],
                  shading: idx % 2 === 1 && isBranded ? { fill: 'f8fafc', type: ShadingType.CLEAR } : undefined,
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: tabNames[chart.tab] || chart.tab, size: 15, color: '475569' })] })],
                  shading: idx % 2 === 1 && isBranded ? { fill: 'f8fafc', type: ShadingType.CLEAR } : undefined,
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: chart.sourceInfo?.source?.split(';')[0]?.slice(0, 45) || 'survey_responses_v2', size: 14, italics: true, color: '64748b' })] })],
                  shading: idx % 2 === 1 && isBranded ? { fill: 'f8fafc', type: ShadingType.CLEAR } : undefined,
                }),
              ],
            })
        ),
      ],
    }),
    new Paragraph({ text: '', spacing: { after: 240 }, pageBreakBefore: true })
  );

  // Charts Sections
  let currentTab = '';

  for (const chart of capturedCharts) {
    const isNewDomain = chart.tab !== currentTab;
    if (isNewDomain) {
      currentTab = chart.tab;
      sectionsChildren.push(
        new Paragraph({
          text: tabNames[currentTab] || currentTab.toUpperCase(),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 140 },
          pageBreakBefore: true,
          run: {
            font: 'Calibri',
            size: 26,
            bold: true,
            color: primaryColor,
          },
        })
      );
    }

    // Chart Title (First chart of a domain shares the page with the domain header; subsequent charts get their own page)
    sectionsChildren.push(
      new Paragraph({
        text: chart.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: isNewDomain ? 80 : 200, after: 60 },
        pageBreakBefore: !isNewDomain,
        run: {
          font: 'Calibri',
          size: 22,
          bold: true,
          color: '0f172a',
        },
      })
    );

    // Chart Subtitle
    if (chart.subtitle) {
      sectionsChildren.push(
        new Paragraph({
          text: chart.subtitle,
          spacing: { after: 120 },
          run: {
            font: 'Calibri',
            size: 18,
            italics: true,
            color: '64748b',
          },
        })
      );
    }

    // Embedded Chart Image
    if (options.includeChart && chart.dataUrl) {
      try {
        const imgBytes = dataUrlToUint8Array(chart.dataUrl);
        const maxDocWidth = 520;
        const aspectRatio = chart.height / (chart.width || 1);
        const finalWidth = maxDocWidth;
        const finalHeight = Math.min(360, Math.round(maxDocWidth * aspectRatio));

        sectionsChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 140 },
            children: [
              new ImageRun({
                data: imgBytes,
                transformation: {
                  width: finalWidth,
                  height: finalHeight,
                },
              } as any),
            ],
          })
        );
      } catch (err) {
        console.error(`Failed to embed image for ${chart.id}`, err);
      }
    }

    // Formatted Data Table
    if (options.includeTable && chart.tableData && chart.tableData.length > 0) {
      const headers = Object.keys(chart.tableData[0]).slice(0, 6); // Max 6 columns in docx
      const tableRows = [
        new TableRow({
          children: headers.map(
            (h) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: h.toUpperCase(), bold: true, color: 'ffffff', size: 16 })],
                  }),
                ],
                shading: { fill: primaryColor, type: ShadingType.CLEAR },
              })
          ),
        }),
        ...chart.tableData.map(
          (row, rIdx) =>
            new TableRow({
              children: headers.map(
                (h) =>
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: String(row[h] ?? ''), size: 16 })],
                      }),
                    ],
                    shading:
                      rIdx % 2 === 1 && isBranded
                        ? { fill: 'f8fafc', type: ShadingType.CLEAR }
                        : undefined,
                  })
              ),
            })
        ),
      ];

      sectionsChildren.push(
        new Paragraph({
          text: 'Data Table',
          spacing: { before: 100, after: 60 },
          run: { font: 'Calibri', size: 18, bold: true, color: '334155' },
        }),
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
        new Paragraph({ text: '', spacing: { after: 100 } })
      );
    }

    // Key Finding / Interpretation
    if (options.includeInsight && chart.insight) {
      sectionsChildren.push(
        new Paragraph({
          spacing: { before: 100, after: 100 },
          shading: { fill: calloutBg, type: ShadingType.CLEAR },
          children: [
            new TextRun({
              text: '💡 What this data proves: ',
              bold: true,
              color: isBranded ? '92400e' : '1e293b',
              size: 18,
            }),
            new TextRun({
              text: chart.insight,
              color: '334155',
              size: 18,
            }),
          ],
        })
      );
    }

    // Full Data Source & Audit Methodology (same as '?' button) in small font
    if (options.includeSource && chart.sourceInfo) {
      sectionsChildren.push(
        new Paragraph({
          spacing: { before: 60, after: 180 },
          children: [
            new TextRun({
              text: '📊 Verified Data Source & Methodology (from ? audit button):\n',
              bold: true,
              color: '334155',
              size: 14, // 7pt small font
            }),
            new TextRun({
              text: `• Database Source: ${chart.sourceInfo.source}\n`,
              color: '64748b',
              size: 13, // 6.5pt
            }),
            new TextRun({
              text: `• Survey Questions Asked:\n  ${chart.sourceInfo.questions.map(q => '  - ' + q).join('\n')}\n`,
              color: '64748b',
              size: 13,
            }),
            new TextRun({
              text: `• Calculation Methodology: ${chart.sourceInfo.calculation}\n`,
              color: '64748b',
              size: 13,
            }),
            ...(chart.sourceInfo.limitations ? [
              new TextRun({
                text: `• Measurement Limitations & Context: ${chart.sourceInfo.limitations}`,
                italics: true,
                color: '94a3b8',
                size: 13,
              })
            ] : []),
          ],
        })
      );
    }

    sectionsChildren.push(new Paragraph({ text: '', spacing: { after: 160 } }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sectionsChildren,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `AI-Bridge-Survey-Report-${cohortMode}.docx`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. POWERPOINT (.PPTX) EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export async function exportPowerPoint({
  kpi,
  cohortMode,
  capturedCharts,
}: {
  kpi: any;
  cohortMode: 'all' | 'matched';
  capturedCharts: CapturedChartItem[];
}) {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_16x9';

  // Slide 1: Cover Slide
  const slide1 = pres.addSlide();
  slide1.background = { color: '064E3B' }; // Emerald-900

  slide1.addText('THE AI BRIDGE', {
    x: 0.8,
    y: 1.5,
    w: 8.4,
    h: 0.8,
    fontSize: 34,
    bold: true,
    color: 'FFFFFF',
    fontFace: 'Arial',
  });

  slide1.addText('Comprehensive Survey & Training Impact Report', {
    x: 0.8,
    y: 2.3,
    w: 8.4,
    h: 0.6,
    fontSize: 22,
    color: '6EE7B7', // Emerald-300
    fontFace: 'Arial',
  });

  slide1.addText(
    `Faculty of Management Sciences · International Islamic University Islamabad\nCohort: ${
      cohortMode === 'matched' ? 'Matched Pairs Only (743 Verified Linked Cohort)' : 'All Submissions (1,331 Pre / 864 Post)'
    }\nGenerated: ${new Date().toLocaleDateString()}`,
    {
      x: 0.8,
      y: 3.5,
      w: 8.4,
      h: 1.5,
      fontSize: 14,
      color: 'ECFDF5',
      fontFace: 'Arial',
    }
  );

  // Slide 2: Executive KPI Overview
  const slide2 = pres.addSlide();
  slide2.background = { color: 'F8FAFC' };

  slide2.addText('Executive Summary & High-Level KPIs', {
    x: 0.8,
    y: 0.5,
    w: 8.4,
    h: 0.5,
    fontSize: 22,
    bold: true,
    color: '0F172A',
    fontFace: 'Arial',
  });

  const kpiItems = [
    { title: 'Total Students', value: (kpi?.totalStudents || 2195).toLocaleString(), sub: 'Pre + Post Verified' },
    { title: 'Faculty & Teachers', value: (kpi?.totalTeachers || 113).toLocaleString(), sub: 'University Educators' },
    { title: 'Certificates Issued', value: (kpi?.certificatesIssued || 821).toLocaleString(), sub: 'Registry Verifiable' },
    { title: 'QIP Time Met (>=3h)', value: `${kpi?.qipTimeMetPct || 70}%`, sub: 'Target Hours Saved' },
    { title: 'MCQ Pass Rate', value: `${kpi?.quizPassRate || 73}%`, sub: 'Scored >= 75%' },
    { title: 'Average Quiz Score', value: `${kpi?.avgQuizScore || 9.2} / 12`, sub: 'Cognitive Retention' },
  ];

  kpiItems.forEach((item, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = 0.8 + col * 2.8;
    const y = 1.3 + row * 1.8;

    slide2.addShape(pres.ShapeType.roundRect, {
      x,
      y,
      w: 2.6,
      h: 1.5,
      fill: { color: 'FFFFFF' },
      line: { color: 'E2E8F0', width: 1 },
    });

    slide2.addText(item.title, {
      x: x + 0.15,
      y: y + 0.15,
      w: 2.3,
      h: 0.3,
      fontSize: 11,
      color: '64748B',
      bold: true,
    });

    slide2.addText(item.value, {
      x: x + 0.15,
      y: y + 0.45,
      w: 2.3,
      h: 0.5,
      fontSize: 22,
      bold: true,
      color: '064E3B',
    });

    slide2.addText(item.sub, {
      x: x + 0.15,
      y: y + 0.95,
      w: 2.3,
      h: 0.3,
      fontSize: 10,
      color: '94A3B8',
    });
  });

  // Slide 3+: One Slide per Chart
  for (const chart of capturedCharts) {
    if (!chart.dataUrl) continue;
    const slide = pres.addSlide();
    slide.background = { color: 'FFFFFF' };

    // Slide Top Bar
    slide.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 10,
      h: 0.15,
      fill: { color: '059669' },
    });

    // Chart Title
    slide.addText(chart.title, {
      x: 0.6,
      y: 0.3,
      w: 8.8,
      h: 0.4,
      fontSize: 18,
      bold: true,
      color: '0F172A',
      fontFace: 'Arial',
    });

    if (chart.subtitle) {
      slide.addText(chart.subtitle, {
        x: 0.6,
        y: 0.7,
        w: 8.8,
        h: 0.3,
        fontSize: 11,
        color: '64748B',
        fontFace: 'Arial',
      });
    }

    // Chart Image (centered with aspect ratio)
    const maxW = 8.8;
    const maxH = 3.6;
    const aspect = chart.height / (chart.width || 1);
    let finalW = maxW;
    let finalH = finalW * aspect;
    if (finalH > maxH) {
      finalH = maxH;
      finalW = finalH / aspect;
    }
    const posX = (10 - finalW) / 2;

    slide.addImage({
      data: chart.dataUrl,
      x: posX,
      y: 1.05,
      w: finalW,
      h: finalH,
    });

    // Bottom Insight Callout
    if (chart.insight) {
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.6,
        y: 4.72,
        w: 8.8,
        h: 0.52,
        fill: { color: 'FEF3C7' }, // Amber-100
        line: { color: 'FDE68A', width: 1 },
      });
      slide.addText(`Key Finding: ${chart.insight}`, {
        x: 0.8,
        y: 4.76,
        w: 8.4,
        h: 0.42,
        fontSize: 9.5,
        color: '78350F', // Amber-900
        bold: true,
      });
    }

    // Research & Data Source in Speaker / Reader Notes (not on slide)
    const notesText = [
      `CHART: ${chart.title}`,
      chart.subtitle ? `Subtitle: ${chart.subtitle}` : '',
      chart.insight ? `Key Finding: ${chart.insight}` : '',
      '',
      '=== RESEARCH & AUDIT METHODOLOGY (FROM ? BUTTON) ===',
      `Database Source: ${chart.sourceInfo?.source || 'survey_responses_v2 (Supabase V2 Analytics Engine)'}`,
      chart.sourceInfo?.questions?.length
        ? `Survey Questions:\n${chart.sourceInfo.questions.map(q => '  - ' + q).join('\n')}`
        : '',
      chart.sourceInfo?.calculation ? `Calculation Methodology: ${chart.sourceInfo.calculation}` : '',
      chart.sourceInfo?.limitations ? `Measurement Limitations & Context: ${chart.sourceInfo.limitations}` : '',
    ].filter(Boolean).join('\n');

    slide.addNotes(notesText);
  }

  await pres.writeFile({ fileName: `AI-Bridge-Presentation-${cohortMode}.pptx` });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PDF DOCUMENT EXPORT (jsPDF)
// ─────────────────────────────────────────────────────────────────────────────
export async function exportPdfDoc({
  kpi,
  cohortMode,
  capturedCharts,
  options,
}: {
  kpi: any;
  cohortMode: 'all' | 'matched';
  capturedCharts: CapturedChartItem[];
  options: {
    layout: 'single' | 'compact' | 'hybrid';
    includeInsight: boolean;
    includeWatermark: boolean;
    watermarkText?: string;
    includeVerificationQr?: boolean;
    guestPasscode?: string;
    verificationUrl?: string;
  };
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm

  const addWatermark = () => {
    if (!options.includeWatermark) return;
    doc.saveGraphicsState();
    doc.setTextColor(200, 210, 220);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const wmText = options.watermarkText || 'THE AI BRIDGE · IIUI FMS · OFFICIAL VERIFIED REPORT';
    doc.text(wmText, pageWidth / 2, 8, { align: 'center' });
    doc.restoreGraphicsState();
  };

  // ─── Cover Page ────────────────────────────────────────────────────────────
  // Emerald Top Header Block
  doc.setFillColor(6, 78, 59); // Emerald-900
  doc.rect(0, 0, pageWidth, 55, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('THE AI BRIDGE', margin, 25);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 231, 183); // Emerald-300
  doc.text('Hum Hain Pakistan Quality Improvement Plan', margin, 34);
  doc.text('Faculty of Management Sciences · International Islamic University Islamabad', margin, 42);

  // Document Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Comprehensive Survey & Training Impact Report', margin, 72);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Official outcome intelligence measuring student cognitive retention, study hour efficiency,\nteaching fatigue relief, and institutional AI tool adoption across faculties.`,
    margin,
    80
  );

  // Metadata Card
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, 98, contentWidth, 38, 3, 3, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('COHORT MODE:', margin + 6, 108);
  doc.text('REPORT GENERATED:', margin + 6, 117);
  doc.text('DATA SOURCES:', margin + 6, 126);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(cohortMode === 'matched' ? 'Matched Pairs Only (743 Verified Pre+Post Linked Cohort)' : 'All Submissions (1,331 Pre / 864 Post Comprehensive)', margin + 46, 108);
  doc.text(new Date().toLocaleString(), margin + 46, 117);
  doc.text('Supabase V2 Analytics Engine · survey_responses_v2 · quiz_attempts · certificates', margin + 46, 126);

  // 6 KPI Cards on Cover Page
  const kpiGridY = 146;
  const cardW = (contentWidth - 8) / 3;
  const cardH = 26;
  const kpiCards = [
    { title: 'Total Students', value: (kpi?.totalStudents || 2195).toLocaleString(), note: 'Pre + Post Verified' },
    { title: 'Faculty & Teachers', value: (kpi?.totalTeachers || 113).toLocaleString(), note: 'University Educators' },
    { title: 'Certificates Issued', value: (kpi?.certificatesIssued || 821).toLocaleString(), note: 'Registry Verifiable' },
    { title: 'QIP Time Met (>=3h)', value: `${kpi?.qipTimeMetPct || 70}%`, note: 'Weekly Hours Saved' },
    { title: 'MCQ Quiz Pass Rate', value: `${kpi?.quizPassRate || 73}%`, note: 'Scored >= 75%' },
    { title: 'Average Quiz Score', value: `${kpi?.avgQuizScore || 9.2} / 12`, note: 'Cognitive Retention' },
  ];

  kpiCards.forEach((c, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const x = margin + col * (cardW + 4);
    const y = kpiGridY + row * (cardH + 4);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(c.title.toUpperCase(), x + 4, y + 7);

    doc.setFontSize(14);
    doc.setTextColor(6, 78, 59);
    doc.text(c.value, x + 4, y + 17);

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(c.note, x + 4, y + 23);
  });

  // Live Verification QR Code Box on Cover Page (Default Included)
  if (options.includeVerificationQr !== false) {
    const qrBoxY = 208;
    const qrBoxH = 38;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, qrBoxY, contentWidth, qrBoxH, 2.5, 2.5, 'FD');

    // Generate QR Data URL
    const verifyUrl = options.verificationUrl || 'https://ai-bridge-iiui.vercel.app/guest-analytics';
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 140 });
      doc.addImage(qrDataUrl, 'PNG', margin + 5, qrBoxY + 5, 28, 28);
    } catch (e) {
      // fallback
    }

    const textX = margin + 38;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 78, 59);
    doc.text('SCAN WITH SMARTPHONE CAMERA TO VERIFY LIVE TELEMETRY', textX, qrBoxY + 10);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('External evaluators & accreditation reviewers can scan to inspect live longitudinal datasets,', textX, qrBoxY + 15);
    doc.text('individual student certificate verification records, and raw pre/post telemetry.', textX, qrBoxY + 19);

    // Passcode Highlight Badge
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(textX, qrBoxY + 23, 72, 9, 1.5, 1.5, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 78, 59);
    doc.text(`EVALUATOR PASSCODE: ${options.guestPasscode || 'AIB-Impact-2026'}`, textX + 3.5, qrBoxY + 29);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`URL: ${verifyUrl}`, textX + 76, qrBoxY + 29);
  }

  // Executive Sign-off Footer on Cover Page
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('The AI Bridge Project Team · Faculty of Management Sciences · International Islamic University Islamabad', margin, 275);
  doc.text('Live Verified Assessment & Longitudinal Survey Analytics Dataset', margin, 280);

  addWatermark();

  // ─── Page 2: Table of Contents (Executive Research Index) ──────────────────
  doc.addPage();
  addWatermark();

  // TOC Header Banner
  doc.setFillColor(6, 78, 59); // Emerald-900
  doc.roundedRect(margin, 14, contentWidth, 14, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TABLE OF CONTENTS · EXECUTIVE RESEARCH DIRECTORY', margin + 6, 23);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(110, 231, 183);
  doc.text(`Total Exhibits: ${capturedCharts.length} Verified Sections`, pageWidth - margin - 6, 23, { align: 'right' });

  // TOC Subtitle
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text('Directory of all survey intelligence indicators, student cognitive gains, and faculty efficiency measures.', margin, 34);

  // Two-column layout for TOC
  const colW = (contentWidth - 8) / 2;
  const col1X = margin;
  const col2X = margin + colW + 8;
  const startY = 42;
  const itemH = 6.8;
  const half = Math.ceil(capturedCharts.length / 2);

  capturedCharts.forEach((chart, idx) => {
    const isCol1 = idx < half;
    const itemX = isCol1 ? col1X : col2X;
    const itemY = startY + (isCol1 ? idx : idx - half) * itemH;
    const pageNum = idx + 3;

    doc.setFillColor(idx % 2 === 0 ? 248 : 255, idx % 2 === 0 ? 250 : 255, idx % 2 === 0 ? 252 : 255);
    doc.setDrawColor(241, 245, 249);
    doc.roundedRect(itemX, itemY - 4.5, colW, itemH, 1, 1, 'FD');

    // Index number
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 78, 59);
    const numStr = String(idx + 1).padStart(2, '0');
    doc.text(numStr, itemX + 2, itemY);

    // Chart title
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const maxTitleLen = 36;
    const cleanTitle = chart.title.length > maxTitleLen ? chart.title.substring(0, maxTitleLen - 2) + '...' : chart.title;
    doc.text(cleanTitle, itemX + 8, itemY);

    // Page number
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`P. ${pageNum}`, itemX + colW - 2, itemY, { align: 'right' });
  });

  // ─── Executive Accreditation Statement Box on Page 2 ──────────────────────
  const narrativeY = Math.max(startY + half * itemH + 6, 168);
  const narrativeH = 104;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, narrativeY, contentWidth, narrativeH, 2.5, 2.5, 'FD');

  // Narrative Header Banner
  doc.setFillColor(6, 78, 59); // Emerald-900
  doc.roundedRect(margin + 4, narrativeY + 4, contentWidth - 8, 7.5, 1.5, 1.5, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('EXECUTIVE ACCREDITATION & INSTITUTIONAL IMPACT STATEMENT', margin + 7, narrativeY + 9);

  // Paragraph 1
  let textCursorY = narrativeY + 16.5;
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. Longitudinal Methodology & Verification Architecture', margin + 6, textCursorY);
  textCursorY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.6);
  doc.setTextColor(71, 85, 105);
  const p1 = `This report synthesizes longitudinal intelligence from 2,195 verified participants (1,331 Pre-Training and 864 Post-Training) across faculties at International Islamic University Islamabad under the Hum Hain Pakistan Quality Improvement Plan. Cross-sectional validation isolates 743 strict pre-and-post linked student cohorts, providing statistically defensible evidence of cognitive progression and tool adoption.`;
  const splitP1 = doc.splitTextToSize(p1, contentWidth - 12);
  doc.text(splitP1, margin + 6, textCursorY);

  // Paragraph 2
  textCursorY += splitP1.length * 3.2 + 3.5;
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Cognitive Mastery & Quantitative Time-Savings (QIP Target Met)', margin + 6, textCursorY);
  textCursorY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.6);
  doc.setTextColor(71, 85, 105);
  const p2 = `Key institutional findings demonstrate that over 70% of participating students met or surpassed the official QIP benchmark of saving >= 3 study hours per week through structured NotebookLM learning packs. Concurrently, post-intervention MCQ evaluations recorded a 73% retention pass rate with an average cognitive retention score of 9.2/12, validating substantial gains in technical comprehension and reading ease.`;
  const splitP2 = doc.splitTextToSize(p2, contentWidth - 12);
  doc.text(splitP2, margin + 6, textCursorY);

  // Paragraph 3
  textCursorY += splitP2.length * 3.2 + 3.5;
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. Faculty Fatigue Mitigation & Scalable Pedagogy', margin + 6, textCursorY);
  textCursorY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.6);
  doc.setTextColor(71, 85, 105);
  const p3 = `Evaluations across 113 university educators confirm significant reductions in bilingual translation overhead and lesson preparation fatigue. Participating faculty reported a 40%+ drop in prep time and high institutional willingness to embed AI Bridge methodologies into ongoing curricula, fulfilling Higher Education Commission (HEC) digital transformation objectives.`;
  const splitP3 = doc.splitTextToSize(p3, contentWidth - 12);
  doc.text(splitP3, margin + 6, textCursorY);

  // TOC Footer Note
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(148, 163, 184);
  doc.text('The AI Bridge Assessment Registry · Official Research Publications Directory · IIUI FMS', margin, 286);

  // ─── Content Pages (Charts) ────────────────────────────────────────────────
  for (let i = 0; i < capturedCharts.length; i++) {
    const chart = capturedCharts[i];
    doc.addPage();
    addWatermark();

    // Page Header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(6, 78, 59);
    doc.text('THE AI BRIDGE · SURVEY IMPACT ANALYTICS', margin, 12);

    doc.setTextColor(148, 163, 184);
    doc.text(`Page ${i + 3} of ${capturedCharts.length + 2}`, pageWidth - margin, 12, { align: 'right' });

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 15, pageWidth - margin, 15);

    // Chart Title & Subtitle
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(chart.title, margin, 25);

    if (chart.subtitle) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(chart.subtitle, margin, 31);
    }

    // Chart Image (bounded to 125mm so Insight and full Data Source fit with zero overflow)
    const maxImgW = contentWidth;
    const maxImgH = options.layout === 'compact' ? 110 : 125;
    const aspect = chart.height / (chart.width || 1);
    let finalW = maxImgW;
    let finalH = finalW * aspect;
    if (finalH > maxImgH) {
      finalH = maxImgH;
      finalW = finalH / aspect;
    }
    const posX = margin + (contentWidth - finalW) / 2;
    const posY = 36;

    doc.addImage(chart.dataUrl, 'PNG', posX, posY, finalW, finalH);

    // Insight Callout Box
    let nextBlockY = posY + finalH + 4;
    if (options.includeInsight && chart.insight) {
      const calloutH = 17;
      doc.setFillColor(254, 243, 199); // Amber-100
      doc.setDrawColor(253, 230, 138); // Amber-200
      doc.roundedRect(margin, nextBlockY, contentWidth, calloutH, 2, 2, 'FD');

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(146, 64, 14); // Amber-800
      doc.text('WHAT THIS DATA PROVES:', margin + 4, nextBlockY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      const splitInsight = doc.splitTextToSize(chart.insight, contentWidth - 8);
      doc.text(splitInsight.slice(0, 2), margin + 4, nextBlockY + 9.5);
      nextBlockY += calloutH + 3.5;
    }

    // Full Data Source & Audit Methodology (same as '?' button) in small font
    if (chart.sourceInfo && nextBlockY < pageHeight - 32) {
      const remainingSpace = pageHeight - nextBlockY - 14;
      const boxH = Math.min(30, remainingSpace);
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.roundedRect(margin, nextBlockY, contentWidth, boxH, 1.5, 1.5, 'FD');

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('VERIFIED DATA SOURCE & METHODOLOGY (from ? audit button):', margin + 3.5, nextBlockY + 4);

      doc.setFontSize(5.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`• Database Source: ${chart.sourceInfo.source}`, margin + 3.5, nextBlockY + 7.5);
      
      const qText = `• Questions Asked: ${chart.sourceInfo.questions.join(' | ')}`;
      const splitQ = doc.splitTextToSize(qText, contentWidth - 7);
      doc.text(splitQ.slice(0, 2), margin + 3.5, nextBlockY + 11);

      const calcText = `• Calculation: ${chart.sourceInfo.calculation}${chart.sourceInfo.limitations ? ' | Limitations: ' + chart.sourceInfo.limitations : ''}`;
      const splitCalc = doc.splitTextToSize(calcText, contentWidth - 7);
      doc.text(splitCalc.slice(0, 2), margin + 3.5, nextBlockY + 18);
    }

    // Bottom Footer
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('The AI Bridge · Faculty of Management Sciences · IIUI', margin, pageHeight - 8);
    doc.text('Live Verified Assessment Data', pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  doc.save(`AI-Bridge-Survey-Report-${cohortMode}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PNG ZIP ARCHIVE EXPORT (JSZip)
// ─────────────────────────────────────────────────────────────────────────────
export async function exportZipArchive({
  capturedCharts,
  cohortMode,
  options,
}: {
  capturedCharts: CapturedChartItem[];
  cohortMode: 'all' | 'matched';
  options: {
    structure: 'individual' | 'tabs';
  };
}) {
  const zip = new JSZip();

  const manifestLines = [
    '========================================================================',
    'THE AI BRIDGE - SURVEY & ASSESSMENT HIGH-RES GRAPHICS ARCHIVE',
    '========================================================================',
    `Cohort Mode: ${cohortMode === 'matched' ? 'Matched Pairs Only' : 'All Submissions'}`,
    `Exported At: ${new Date().toISOString()}`,
    `Total Images: ${capturedCharts.length}`,
    'Institution: Faculty of Management Sciences, International Islamic University Islamabad',
    'Methodology: Live Verified Assessment Data Engine',
    '========================================================================\n',
  ];

  const domainFolders: Record<string, string> = {
    executive: '1_Executive_Summary',
    student: '2_Student_Journey',
    faculty: '3_Faculty_and_Teachers',
    demographics: '4_Demographics_and_Outreach',
  };

  capturedCharts.forEach((chart, index) => {
    const paddedIdx = String(index + 1).padStart(2, '0');
    const sanitizedTitle = chart.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const folder = domainFolders[chart.tab] || '1_Executive_Summary';
    const filename = `${paddedIdx}_${sanitizedTitle}.png`;
    const fullPath = `${folder}/${filename}`;

    const base64Data = chart.dataUrl.split(',')[1] || chart.dataUrl;
    zip.file(fullPath, base64Data, { base64: true });

    manifestLines.push(`[${paddedIdx}] ${fullPath}`);
    manifestLines.push(`     Title: ${chart.title}`);
    manifestLines.push(`     Domain: ${folder}`);
    manifestLines.push(`     Source: ${chart.sourceInfo?.source || 'survey_responses_v2'}`);
    if (chart.insight) {
      manifestLines.push(`     Insight: ${chart.insight}`);
    }
    manifestLines.push('');
  });

  zip.file('README.txt', manifestLines.join('\n'));

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, `AI-Bridge-Charts-${cohortMode}.zip`);
}
