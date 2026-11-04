# Survey Impact Dashboard — Concise Analysis

**Reviewed:** 2026-11-03  
**Scope:** Four dashboard tabs, chart registry, UI, and V2 analytics API. This is a source-code review; live database values and the running dashboard were not independently verified.

## Executive summary

The dashboard offers useful views of participation, self-reported outcomes, faculty experience, and outreach. However, several visuals currently imply stronger or more precise evidence than the survey data supports. The most important issues are incorrect/misaligned comparisons, hardcoded or fallback values, ambiguous denominators, and fixed-date timeline logic.

The chart registry defines **34** entries. The UI renders **33**: Executive 5, Student 13, Faculty 9, and Demographics 6. The faculty-rank chart is defined and returned by the API but has no rendered chart. Tab badges also claim 14/10/7 visuals for Student/Faculty/Demographics, which do not match the visible charts.

## Tab and chart review

### 1. Executive Summary — 5 visuals

| Visual | What it communicates | Main caveat |
|---|---|---|
| KPI cards (participants, faculty, certificates, time saved, quiz pass rate, average score) | Overall reach and program outcomes | Survey totals count submissions, not distinct people. Certificates and quiz attempts are separate populations; the cards do not establish that they belong to the surveyed cohort. |
| Student impact radar | Summary of student change across five dimensions | Some pre-training baselines are fixed constants. The post “AI familiarity” value is derived from a question about concept/quiz improvement, not AI familiarity. |
| Weekly study/lesson-prep hours saved | Post-survey student time-saving categories | Self-reported ranges, not measured time. The parser checks for “1” before “9/10+”, so a value such as “10 hours” can be classified as under two hours. |
| Future adoption intent (students vs faculty) | Intention to continue using AI | Intent is not actual adoption; student and faculty populations are not matched. |
| AI competency distribution shift | Pre/post student competency distribution | The post-survey measure is concept-improvement rating, so the “competency shift” label is misleading. |

### 2. Student Journey — 13 visuals

| Visual | What it communicates | Main caveat |
|---|---|---|
| Pre-survey academic obstacles | Common study difficulties | Multi-select counts can overlap; report the number of valid responses and clarify the denominator. |
| Pre-survey preferred learning formats | Requested study formats | Multi-select categories may exceed 100% in total. |
| Post-survey helpful assets | Assets students found useful | Self-reported usefulness, not measured learning effectiveness. |
| Needs vs delivery alignment | Requested formats compared with helpful assets | The array positions used for three comparisons do not align: mind maps, quizzes, and audio are compared with the wrong assets. The table also labels every row “Direct Match” regardless of the values. |
| Concept understanding improvement | Post-survey 1–5 self-rating | Perceived improvement, not an objective pre/post learning gain. |
| Reading/text processing ease | Post-survey 1–5 self-rating | No objective reading measure or matched baseline. |
| Burnout/fatigue | Post-survey fatigue/relief ratings | Self-reported; labels and interpretation should state clearly which end of the scale means more relief. |
| Study-pack reliability | Student view of AI output reliability | The donut center and explanatory text use fixed percentages rather than deriving the displayed figure from current data. |
| AI tools used before training | Baseline tool use | Multi-select categories overlap; “market share” is not a suitable label for respondents’ tool use. The donut center’s 64.2% figure is fixed. |
| NotebookLM awareness | Prior awareness/use | Missing or unrecognized responses can be counted as unfamiliar. |
| Audio/digital study-aid habits | Pre-training usage habits | Unrecognized or missing responses can be assigned to a substantive category. |
| Workshop interest | Interest in future workshops | Depends on text matching and default categorization; expose unknown/missing responses. |
| Hours saved vs AI familiarity | Average saved hours by baseline familiarity | Uses estimated midpoints for hour bands; unmatched post responses default to “Novice”; empty groups use fixed fallback values. |

### 3. Faculty & Teachers — 9 visible visuals

| Visual | What it communicates | Main caveat |
|---|---|---|
| Faculty impact radar | Summary of experience, time, fatigue, multilingual utility, and adoption | Several baseline or post values are fixed (for example AI experience and multilingual utility), not computed from survey responses. |
| Pre-survey multilingual burden | Translation frequency | Donut center and explanatory text use fixed percentages; may conflict with current response data. |
| Lesson-prep time reduction | Post-survey 1–5 ratings | Self-reported outcome; percentages alone do not show respondent count or uncertainty. |
| Teaching burnout/fatigue | Post-survey 1–5 ratings | Self-reported and subject to interpretation of the scale. |
| Output accuracy | Faculty view of AI accuracy | Perception is not an independent accuracy audit. |
| Workshop goals vs outcomes | Goals compared with post-training responses | Pre and post denominators differ and are not matched; outcome proxies do not necessarily measure the stated goal. |
| Long-term adoption intent | Faculty willingness to integrate AI | Intention, not observed curriculum integration. |
| Faculty institution distribution | IIUI vs other institutions | Derived from answers/email rules; missing affiliation is treated as external, which can skew the split. |
| Teaching experience levels | Faculty experience distribution | Derived from teacher pre-survey answers; missing answers are excluded and unrecognized ranges are grouped as “Other / unspecified.” |

**Registry/UI mismatch:** “Faculty Academic Rank Breakdown” is defined and returned but is not rendered. Its API value is a single 100% “all educators” category, not an actual rank breakdown.

### 4. Demographics & Outreach — 6 visible visuals

| Visual | What it communicates | Main caveat |
|---|---|---|
| Department participation | Top departments by response volume | Counts submissions across phases and participant types, not unique people; only the top eight are shown. |
| Semester participation | Student cohort/semester distribution | Uses pre-survey records only; extraction and missing values can omit participants. |
| Survey routing audit | Counts correctly routed and misrouted submissions | The “correctly routed students” count includes misrouted student rows, then misrouted rows are also listed separately, so categories overlap. |
| Student institution distribution | IIUI vs external student representation | Uses post-survey rows only; missing institution answers are classified as IIUI. |
| Department familiarity heatmap | AI familiarity by department | Combines student/faculty and pre/post answers; uses an approximate 1–4.5 score and a fixed fallback for departments without usable ratings. |
| Response timeline velocity | Submission volume by week | Uses fixed October 2026 buckets rather than a configurable date range. Missing timestamps are assigned to a week, and dates outside October fall into the final bucket; this can misrepresent actual timing. |

## Key limitations

1. **Descriptive, self-reported evidence:** The dashboard has no control group and cannot establish that the workshop caused reported changes. Most outcomes are perceptions or intentions, not independently measured learning, time, or adoption.
2. **Cohort and denominator ambiguity:** Pre/post samples can differ; matched mode filters student responses but not faculty or other data. Submission counts can be mistaken for unique participant counts. Several charts use different denominators without making them prominent.
3. **Data cleaning can create false certainty:** Some missing/unrecognized answers are silently assigned to real categories; other charts use hardcoded defaults when data is absent. This hides missingness and can bias results.
4. **Static copy and exports can mislead:** Chart subtitles, callouts, and donut-center percentages include fixed claims; they may not match the live chart data. Downloaded data does not fix misleading labels in the visualization.
5. **Limited analytical context:** Charts generally omit confidence intervals, missing-response rates, small-sample warnings, and clear definitions of valid responses. Multi-select totals may legitimately exceed 100%.
6. **Freshness and completeness are hard to judge:** The API caches results for 60 seconds. Survey pagination stops when a query returns an error, which can produce an incomplete dataset without an explicit partial-data warning.

## Recommended improvements (priority order)

1. **Correct misleading comparisons first:** Fix the post “AI competency” label/source; correct needs-vs-delivery category mapping; fix the hours parser for 9+/10+ values; remove or dynamically calculate fixed radar, experience-level, and chart-center values.
2. **Make missing and partial data visible:** Add an “Unknown / not answered” bucket, show valid `n` and denominator on every chart, and never substitute a plausible-looking number when data is absent. Flag incomplete API reads instead of presenting them as complete.
3. **Define cohorts consistently:** Distinguish submissions from unique participants; state exactly how matched pairs are formed; apply matched mode consistently or label metrics that remain unmatched. Show pre/post response counts and attrition.
4. **Repair timeline and routing metrics:** Use preserved original form timestamps and a dynamic date range. Make routing categories mutually exclusive, with explicit counts for valid, corrected, and unknown routing.
5. **Make presentation truthful and consistent:** Generate titles, explanatory text, and export labels from the same data/definitions as each chart. Synchronize tab badges and chart registry with rendered visuals; either implement or remove the faculty-rank entry.
6. **Add quality checks:** Test representative survey-answer variants, blank values, boundary hour ranges, missing timestamps, unmatched cohorts, and zero-response datasets. Add regression tests for chart denominators and fixed copy.

**Reviewed implementation:** [SurveyAnalyticsView.tsx](../../src/components/dashboard/SurveyAnalyticsView.tsx), [survey-analytics-v2 route](../../src/app/api/admin/survey-analytics-v2/route.ts), and [surveyAnalyticsV2Catalog.ts](../../src/lib/surveyAnalyticsV2Catalog.ts).
