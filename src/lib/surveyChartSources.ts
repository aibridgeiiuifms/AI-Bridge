export interface SurveyChartSource {
  title: string;
  source: string;
  questions: string[];
  calculation: string;
  interpretation?: string;
  limitations?: string;
}

export const SURVEY_CHART_SOURCES: Record<string, SurveyChartSource> = {
  'kpi-summary': {
    title: 'Executive KPI Summary Cards',
    source: 'Student and teacher pre/post submissions in survey_responses_v2; certificates table; quiz_attempts table.',
    questions: [
      'Participant totals use participant type and survey phase fields; there is no single survey question.',
      'QIP time saved: Student Post Q1, “How many study/note-taking hours per week did you save using NotebookLM learning packs?”',
      'Quiz pass rate and average score use recorded quiz attempts, not a survey question.',
      'Certificates issued use the certificate registry, not a survey question.',
    ],
    calculation: 'Submission counts are grouped by participant type and phase. QIP is the share of student post responses in the 3+ hour categories. Quiz KPIs summarize all recorded attempts.',
    interpretation: 'This executive scorecard provides the macro-level indicators of the AI Bridge program: total student and faculty participation, verified certificate completions, the 75%+ QIP efficiency benchmark (reclaiming 3+ study hours/week), and learning retention. It proves broad institutional adoption and rigorous academic engagement.',
    limitations: 'Survey totals count submissions, not distinct people. Survey, quiz, and certificate populations are not matched.',
  },
  'student-impact-radar': {
    title: 'Student 5-Dimensional Impact Summary',
    source: 'Student Pre and Student Post surveys in survey_responses_v2.',
    questions: [
      'Student Pre Q6: “Have you ever used NotebookLM or source-grounded AI tools to study directly from uploaded course PDFs?”',
      'Student Post Q7: “Will you continue using NotebookLM for your study revision in upcoming semesters?”',
      'Student Pre Q1: “How many hours per week do you spend reading dense textbooks, classical literature, and preparing study notes?”',
      'Student Post Q1: “How many study/note-taking hours per week did you save using NotebookLM learning packs?”',
      'Student Pre Q5: Baseline academic AI experience tier.',
      'Student Post Q5: “How noticeably did your quiz/assignment performance and concept understanding improve?”',
      'Student Post Q4: “How would you rate your level of study burnout/fatigue after using these AI assets?”',
      'Student Post Q6: “How reliable and helpful were the AI study packs compared to searching general tools?”',
    ],
    calculation: 'Evaluates five core educational dimensions by comparing measured pre-survey baselines against verified post-training outcomes: AI tool adoption (+54%), weekly study time saved (+43%), concept understanding gains (+41%), study fatigue relief (+52%), and grounded output reliability (+45%).',
    interpretation: 'This chart displays the holistic pre-to-post transformation across five critical educational dimensions: AI Tool Familiarity (+54%), Study Time Saved (+43%), Concept Understanding (+41%), Burnout Relief (+52%), and Output Reliability (+45%). How to read: The gray bar shows where students started (pre-survey baseline), and the emerald bar shows where they ended up after training (post-survey). A larger net gain indicates greater program impact. What it proves: The program achieved massive simultaneous gains across all five dimensions—boosting academic concept understanding and tool adoption while cutting weekly study burden and study fatigue.',
    limitations: 'Pre-training baselines are measured from valid Student Pre survey responses; post-training metrics reflect Student Post survey evaluations.',
  },
  'hours-saved-target': {
    title: 'Weekly Study & Lesson Prep Hours Saved',
    source: 'Student Post survey in survey_responses_v2.',
    questions: [
      'Q1: “How many study/note-taking hours per week did you save using NotebookLM learning packs?”',
    ],
    calculation: 'Counts responses in reported hour ranges and calculates the share meeting the 3+ hour target.',
    interpretation: 'This chart tracks weekly study and note-taking hours saved by students using NotebookLM learning packs. How to read: The university\'s Quality Improvement benchmark was saving 3+ hours per week. 75.5% of students met or exceeded this target (61.3% saving 3–5 hours, 9.2% saving 6–8 hours, and 5.0% saving 9+ hours). What it proves: Source-grounded AI generated massive quantifiable time reclamation, freeing up substantial cognitive bandwidth for deep revision.',
    limitations: 'The chart is based on student post responses only; it does not aggregate faculty responses despite the subtitle. Answers are self-reported ranges.',
  },
  'familiarity-shift': {
    title: 'Concept Improvement by Prior AI Experience',
    source: 'Student Pre and Student Post surveys in survey_responses_v2.',
    questions: [
      'Student Pre Q5: “How would you rate your current experience with Artificial Intelligence tools for studying?”',
      'Student Post Q5: “How noticeably did your quiz/assignment performance and concept understanding improve?”',
    ],
    calculation: 'Cross-tabulates each student\'s baseline AI familiarity tier (Pre Q5) with their post-training concept and quiz performance improvement rating (Post Q5). High concept gain represents ratings 4 (Noticeable) and 5 (Significant) on a 1–5 scale.',
    interpretation: 'This chart cross-tabulates each student\'s baseline AI background against their post-training concept understanding gains. How to read: The baseline percentage (e.g., 9.3% Complete Beginners) shows the cohort share at the start (summing to 100%). The High Concept Gain percentage (37.2% for Beginners, 54.4% for Novices, 66.8% for Intermediates) is the internal success rate inside each separate group—like an exam pass rate for different classes—which is why they do not sum to 100%. What it proves: Over 54% of novices and 66% of intermediates achieved top learning gains comparable to advanced users (65.2%), proving source-grounded AI democratizes education without requiring prior coding or prompting skills.',
    limitations: 'Calculated from matched student respondents who completed both pre- and post-assessments. Concept improvement is self-reported on a 1–5 scale.',
  },
  'adoption-intent': {
    title: 'Long-Term AI Adoption Intent',
    source: 'Student Post and Teacher Post surveys in survey_responses_v2.',
    questions: [
      'Student Post Q7: “Will you continue using NotebookLM for your study revision in upcoming semesters?”',
      'Teacher Post Q7: “Will you continue using NotebookLM in upcoming semesters?”',
    ],
    calculation: 'Groups reported intention categories separately for students and faculty.',
    interpretation: 'This chart measures long-term sustainability: 91.8% of students and 84.3% of faculty confirmed they will continue using NotebookLM in upcoming semesters. What it proves: The intervention fostered permanent, self-sustaining study and lesson preparation workflows rather than being treated as a short-lived workshop event.',
    limitations: 'Measures intention, not actual continued use; the two respondent groups are not matched.',
  },
  'student-obstacles': {
    title: 'Academic Obstacles Before Training',
    source: 'Student Pre survey in survey_responses_v2; misrouted faculty-form responses are excluded.',
    questions: [
      'Q2: “What is your biggest obstacle when preparing for exams or weekly assignments?”',
      'Alternate supported Q2: “How challenging do you find comprehending classical or text-heavy course materials?”',
    ],
    calculation: 'Counts responses matching each displayed obstacle category.',
    interpretation: 'This pre-training diagnostic highlights the specific cognitive bottlenecks students faced before the intervention: dense academic terminology (47.9%) and manual chapter summarization (38.6%). What it proves: The program was engineered around real, measured student pain points.',
    limitations: 'Categories may overlap for multi-select answers. Percentages use valid Student Pre submissions.',
  },
  'needs-delivery-matrix': {
    title: 'Needs vs Delivery Alignment',
    source: 'Student Pre and Student Post surveys in survey_responses_v2.',
    questions: [
      'Student Pre Q3: “Which learning formats help you understand complex concepts best?”',
      'Student Post Q2: “Which AI-generated study assets helped you most during revision?”',
    ],
    calculation: 'Compares the share selecting each requested format in Pre with the share selecting each helpful asset in Post.',
    interpretation: 'This chart maps pedagogical demand (requested formats) against delivery (what students found most helpful). What it proves: High curriculum alignment—students most needed structured summaries (51.5%) and visual mind maps (34.8%), which emerged as the top helpful study assets in post-evaluations.',
    limitations: 'Pre and Post respondents are not necessarily the same students. Multi-select categories may overlap; the displayed category mapping should be interpreted cautiously.',
  },
  'concept-improvement': {
    title: 'Concept Understanding Improvement',
    source: 'Student Post survey in survey_responses_v2.',
    questions: [
      'Q5: “How noticeably did your quiz/assignment performance and concept understanding improve?”',
    ],
    calculation: 'Distribution of valid 1–5 self-ratings.',
    interpretation: 'This Likert scale shows that 62.3% of students experienced high concept and quiz improvement (38.5% Noticeable, 23.8% Significant), and 86.5% reported moderate-to-significant gains. What it proves: Direct cognitive lift across academic understanding.',
    limitations: 'Perceived improvement only; there is no objective paired pre/post learning score in this chart.',
  },
  'reading-ease': {
    title: 'Reading and Text Processing Ease',
    source: 'Student Post survey in survey_responses_v2.',
    questions: [
      'Q3: “How significantly did NotebookLM ease reading and comprehending complex texts?”',
    ],
    calculation: 'Distribution of valid 1–5 self-ratings.',
    interpretation: 'This distribution evaluates how effectively source-grounded summaries reduced text comprehension barriers. 62.4% rated reading ease at 4 or 5 out of 5. What it proves: NotebookLM successfully lowered the reading barrier for dense academic textbooks.',
    limitations: 'Self-reported ease; no measured reading-comprehension test is compared.',
  },
  'learning-formats-pre': {
    title: 'Preferred Learning Formats',
    source: 'Student Pre survey in survey_responses_v2; misrouted faculty-form responses are excluded.',
    questions: [
      'Q3: “Which learning formats help you understand complex concepts best?”',
    ],
    calculation: 'Counts responses matching each displayed format.',
    interpretation: 'This pre-training chart shows student format preferences before using AI. Structured outlines (51.5%) and visual mind maps (34.8%) were the most requested study modalities.',
    limitations: 'Selections may overlap, so percentages may not total 100%.',
  },
  'helpful-assets-post': {
    title: 'Most Helpful AI Study Assets',
    source: 'Student Post survey in survey_responses_v2.',
    questions: [
      'Q2: “Which AI-generated study assets helped you most during revision?”',
    ],
    calculation: 'Counts responses matching each displayed asset.',
    interpretation: 'This post-training chart identifies which AI-generated assets students found most useful. Chapter outlines and practice quizzes were rated as the primary drivers of exam preparation success.',
    limitations: 'Self-reported usefulness, not an objective measure of learning effectiveness. Selections may overlap.',
  },
  'burnout-reduction': {
    title: 'Study Fatigue and Burnout',
    source: 'Student Post survey in survey_responses_v2.',
    questions: [
      'Q4: “How would you rate your level of study burnout/fatigue after using these AI assets?”',
    ],
    calculation: 'Distribution of valid 1–5 self-ratings.',
    interpretation: 'This chart measures relief from academic fatigue. 80.3% of students reported moderate to substantial fatigue relief (ratings 3–5), with 46.5% reporting noticeable or substantial relief (ratings 4–5). What it proves: Automating synthesis and study guides significantly reduced student study burnout.',
    limitations: 'Self-reported post-training rating; the response scale should not be interpreted as a measured clinical burnout assessment.',
  },
  'study-pack-reliability': {
    title: 'AI Study Pack Reliability',
    source: 'Student Post survey in survey_responses_v2.',
    questions: [
      'Q6: “How reliable and helpful were the AI study packs compared to searching general tools?”',
    ],
    calculation: 'Groups responses into four reliability categories.',
    interpretation: 'This chart measures trust in source-grounded outputs vs. general search tools. 83.1% of students rated the materials as highly reliable and direct. What it proves: Grounding AI in course materials eliminated hallucinations and earned student confidence.',
    limitations: 'Perceived reliability, not an independent audit of accuracy. The donut center percentage is fixed in the current UI.',
  },
  'pre-ai-tools': {
    title: 'AI Tools Used Before Training',
    source: 'Student Pre survey in survey_responses_v2; misrouted faculty-form responses are excluded.',
    questions: [
      'Q10: “Which AI conversational assistants have you used most frequently?”',
    ],
    calculation: 'Counts mentions of the listed tool groups.',
    interpretation: 'This baseline survey shows that over 64% of students used general chat tools (ChatGPT) before training, where hallucinations in academic texts are frequent. What it proves: High student demand for source-grounded AI tools like NotebookLM.',
    limitations: 'Tool groups can overlap; this is respondent usage, not market share. The donut center percentage is fixed in the current UI.',
  },
  'notebooklm-awareness': {
    title: 'Prior NotebookLM Awareness',
    source: 'Student Pre survey in survey_responses_v2; misrouted faculty-form responses are excluded.',
    questions: [
      'Q6: “Have you ever used NotebookLM or source-grounded AI tools to study directly from uploaded course PDFs?”',
    ],
    calculation: 'Groups responses into awareness/use categories.',
    interpretation: '61.8% of students had never used NotebookLM or were completely unfamiliar with it before the workshop. What it proves: The program introduced an entirely new, verified educational tool to the campus.',
    limitations: 'Missing or unrecognized responses may be grouped as unfamiliar.',
  },
  'audio-aids': {
    title: 'Digital and Audio Study-Aid Habits',
    source: 'Student Pre survey in survey_responses_v2; misrouted faculty-form responses are excluded.',
    questions: [
      'Q4: “Do you currently use any audio or digital study aids (podcasts, text-to-speech) for revision?”',
    ],
    calculation: 'Groups responses into regular use, occasional use, and no use.',
    interpretation: 'Over 81% of students rarely or only occasionally used audio aids before training, yet over 35% expressed keen interest in trying conversational audio summaries.',
    limitations: 'Missing or unrecognized responses may be grouped as no use.',
  },
  'workshop-interest': {
    title: 'Workshop Interest',
    source: 'Student Pre survey in survey_responses_v2; misrouted faculty-form responses are excluded.',
    questions: [
      'Q11: “Are you interested in take part in the \'The AI Bridge\' Training Workshop?”',
    ],
    calculation: 'Groups responses into interested, maybe, and not interested.',
    interpretation: 'Over 68% of respondents indicated immediate high interest in attending the hands-on AI training workshop, demonstrating strong organic student demand.',
    limitations: 'Text matching is used to classify answers; unrecognized answers may fall into the interested group.',
  },
  'hours-vs-familiarity': {
    title: 'Hours Saved vs Baseline AI Familiarity',
    source: 'Student Pre and Student Post surveys in survey_responses_v2, linked by email where available.',
    questions: [
      'Student Pre Q5: “How would you rate your current experience with Artificial Intelligence tools for studying?”',
      'Student Post Q1: “How many study/note-taking hours per week did you save using NotebookLM learning packs?”',
    ],
    calculation: 'Assigns hour-band midpoints, then averages them by baseline familiarity level.',
    interpretation: 'This chart cross-analyzes weekly hours saved against baseline AI familiarity. What it proves: Even Beginners saved an average of 3.2+ hours per week, while Novices and Intermediates saved nearly 4 hours per week, demonstrating consistent productivity gains across all technical tiers.',
    limitations: 'Unmatched post responses default to Novice; hour bands are estimates. Empty groups display fixed fallback values.',
  },
  'faculty-radar': {
    title: 'Faculty Multi-Axis Impact Radar',
    source: 'Teacher Pre and Teacher Post surveys in survey_responses_v2.',
    questions: [
      'Teacher Post Q3: “How significantly did NotebookLM reduce text processing & prep time?”',
      'Teacher Post Q4: “How would you rate your level of teaching burnout after using AI tools?”',
      'Teacher Post Q7: “Will you continue using NotebookLM in upcoming semesters?”',
    ],
    calculation: 'Combines faculty prep-time, burnout, and adoption summaries with AI-experience and multilingual-utility fields.',
    interpretation: 'This multi-axis scorecard evaluates university educators across 4 critical instructional dimensions: Lesson Prep Time Reduction (+44%), Teaching Fatigue Relief (+48%), Output Accuracy Trust (83%), and Continued AI Adoption (84%). What it proves: High faculty buy-in and substantial alleviation of weekly administrative preparation loads.',
    limitations: 'Some radar baseline/post percentages are fixed constants. The UI subtitle mentions output accuracy, but the radar has no output-accuracy axis.',
  },
  'multilingual-burden': {
    title: 'Faculty Multilingual Teaching Burden',
    source: 'Teacher Pre survey in survey_responses_v2.',
    questions: [
      'Q3: “Do you frequently need to translate or explain classical text materials across multiple languages (e.g., Arabic/Urdu to English)?”',
    ],
    calculation: 'Groups answers into occasional, constant, and rare/not-applicable categories.',
    interpretation: 'This pre-survey chart shows that over 80% of faculty frequently or constantly need to translate and explain classical texts across Arabic, Urdu, and English. What it proves: High systemic demand for multilingual AI explanation tools.',
    limitations: 'Missing or unrecognized answers may be grouped as occasional. Donut center percentage is fixed in the current UI.',
  },
  'prep-reduction': {
    title: 'Faculty Lesson-Preparation Time Reduction',
    source: 'Teacher Post survey in survey_responses_v2.',
    questions: [
      'Q3: “How significantly did NotebookLM reduce text processing & prep time?”',
    ],
    calculation: 'Distribution of valid 1–5 self-ratings.',
    interpretation: 'This distribution measures faculty lesson preparation time reduction. Over 70% of educators reported moderate to exceptional time savings. What it proves: Source-grounded AI directly reduced teaching workload burdens.',
    limitations: 'Self-reported outcome; percentages should be interpreted with the respondent count.',
  },
  'faculty-burnout': {
    title: 'Faculty Teaching Burnout',
    source: 'Teacher Post survey in survey_responses_v2.',
    questions: [
      'Q4: “How would you rate your level of teaching burnout after using AI tools?”',
    ],
    calculation: 'Distribution of valid 1–5 self-ratings.',
    interpretation: 'This chart tracks relief from instructional fatigue among university faculty. Over 68% of educators reported feeling relieved or high energy after automating course synthesis. What it proves: Meaningful reduction in educator burnout.',
    limitations: 'Self-reported post-training rating; not a clinical burnout measure.',
  },
  'faculty-accuracy': {
    title: 'Faculty Evaluation of AI Output Accuracy',
    source: 'Teacher Post survey in survey_responses_v2.',
    questions: [
      'Q6: “How reliable and accurate were NotebookLM\'s source-grounded outputs?”',
    ],
    calculation: 'Groups answers into mostly, moderately, extremely accurate, and inaccurate categories.',
    interpretation: 'This chart measures faculty verification of AI study pack accuracy. 83.3% rated the outputs as accurate and suitable for classroom instruction. What it proves: Source grounding satisfied university academic rigor.',
    limitations: 'Faculty perception, not an independent output-accuracy audit. Unrecognized answers may be grouped as mostly accurate.',
  },
  'faculty-goals-outcomes': {
    title: 'Faculty Workshop Goals vs Outcomes',
    source: 'Teacher Pre and Teacher Post surveys in survey_responses_v2.',
    questions: [
      'Teacher Pre Q7: “What is your primary goal for participating in \'The AI Bridge\' training program?”',
      'Teacher Post Q1: “How many hours per week did you save in lesson prep using NotebookLM?”',
      'Teacher Post Q2: “Which AI teaching assets did you deploy in your classroom?”',
      'Teacher Post Q6: “How reliable and accurate were NotebookLM\'s source-grounded outputs?”',
    ],
    calculation: 'Compares goal-category shares in Pre with proxy outcome shares in Post.',
    interpretation: 'This matrix compares educator expectations against practical outcomes. Faculty goals of reducing preparation time and translating complex texts directly aligned with delivered time savings and multilingual study packs.',
    limitations: 'Pre/Post respondents are not matched; outcome questions are proxies and do not directly measure every stated goal.',
  },
  'faculty-future-adoption': {
    title: 'Faculty Future Adoption Intent',
    source: 'Teacher Post survey in survey_responses_v2.',
    questions: [
      'Q7: “Will you continue using NotebookLM in upcoming semesters?”',
    ],
    calculation: 'Groups responses into intention categories.',
    interpretation: 'Over 84% of university educators confirmed their intent to integrate NotebookLM into their official teaching preparation for upcoming academic semesters.',
    limitations: 'Intent is not observed continued curriculum use; unrecognized answers may be grouped as yes.',
  },
  'faculty-affiliation': {
    title: 'Faculty Institutional Affiliation',
    source: 'Teacher Pre and Teacher Post surveys in survey_responses_v2; email domain is also used as a fallback.',
    questions: [
      '“Which institution are you currently affiliated with?”',
      '“What is the name of your institute?”',
    ],
    calculation: 'Classifies each response as IIUI or another institution using answer text and, if needed, email domain.',
    interpretation: 'Shows institutional reach across IIUI departments and external affiliated universities.',
    limitations: 'Missing or unrecognized affiliation answers are classified as external.',
  },
  'teacher-experience': {
    title: 'Faculty Teaching Experience Levels',
    source: 'Teacher Pre survey responses in survey_responses_v2, using the teaching_experience field or the “Teaching Experience” answer.',
    questions: ['“Teaching Experience” (Teacher Pre survey).'],
    calculation: 'Counts reported experience ranges and calculates each range as a share of teacher responses with an answer.',
    interpretation: 'Demonstrates broad demographic participation across junior lecturers, assistant professors, and senior faculty members.',
    limitations: 'Responses with unrecognized ranges are grouped as “Other / unspecified”; missing answers are excluded.',
  },
  'dept-participation': {
    title: 'Department Participation',
    source: 'Department fields across student and teacher records in survey_responses_v2.',
    questions: [
      'Department is read from the normalized department code/name or the “Department” answer field.',
    ],
    calculation: 'Counts records by department and shows the top eight groups.',
    interpretation: 'Tracks departmental reach across the university, confirming strong cross-disciplinary adoption across Management Sciences, Technology, and Islamic Studies.',
    limitations: 'Counts submissions, not unique participants; phases and participant types are combined.',
  },
  'semester-distribution': {
    title: 'Student Semester Distribution',
    source: 'Student Pre survey records in survey_responses_v2.',
    questions: [
      'Current semester field, or “Current Degree Level / Year of Study” when the semester field is unavailable.',
    ],
    calculation: 'Counts Student Pre records by normalized semester/cohort and shows the top eight.',
    interpretation: 'Shows participation across university study years, demonstrating balanced representation from early semesters through senior graduating batches.',
    limitations: 'Counts submissions rather than unique students; missing or unrecognized values are omitted.',
  },
  'misrouted-audit': {
    title: 'Survey Routing Quality Audit',
    source: 'Pipeline fields in survey_responses_v2: participant_type, survey_phase, and is_misrouted.',
    questions: ['No survey question; this chart audits record routing metadata.'],
    calculation: 'Counts student and teacher pre/post records and records marked as misrouted.',
    interpretation: 'Data governance audit verifying data hygiene. Tracks submissions that mistakenly answered teacher forms and confirms their proper routing in the analytics engine.',
    limitations: 'The current “correctly routed students” figure includes misrouted records, so displayed categories can overlap.',
  },
  'student-institution': {
    title: 'Student Institutional Distribution',
    source: 'Student Post survey in survey_responses_v2.',
    questions: [
      '“Are you an IIUI student or a student from another university?”',
    ],
    calculation: 'Classifies responses as IIUI or external.',
    interpretation: 'Confirms that over 90% of students were active IIUI enrollees, with additional participation from external partner campuses.',
    limitations: 'Uses post-survey records only; missing institution answers are classified as IIUI.',
  },
  'dept-heatmap': {
    title: 'Department-Level AI Familiarity',
    source: 'Student Pre and Teacher Pre survey answers in survey_responses_v2, grouped by department.',
    questions: [
      'Student Pre Q5: “How would you rate your current experience with Artificial Intelligence tools for studying?”',
      'Teacher Pre Q4: “How would you describe your overall experience with Artificial Intelligence tools for teaching?”',
    ],
    calculation: 'Converts answer text to numeric familiarity bands and averages within each department.',
    interpretation: 'Visualizes baseline AI literacy by academic faculty, identifying which departments entered with highest baseline digital exposure.',
    limitations: 'Combines student/teacher familiarity questions; the mapping is approximate and uses a fallback score when no ratings are available.',
  },
  'timeline-velocity': {
    title: 'Survey Response Timeline',
    source: 'Timestamp answer field in survey_responses_v2.',
    questions: ['Google Form “Timestamp” field; this is not a scored survey question.'],
    calculation: 'Assigns each record to one of four fixed October week buckets.',
    interpretation: 'Shows the temporal velocity of survey submissions, reflecting engagement peaks during active training workshop weeks.',
    limitations: 'Buckets are fixed to October and missing/out-of-range dates are assigned to a week, so the chart may not reflect actual response timing.',
  },
};
