export interface SurveyChartSource {
  title: string;
  source: string;
  questions: string[];
  calculation: string;
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
    limitations: 'Survey totals count submissions, not distinct people. Survey, quiz, and certificate populations are not matched.',
  },
  'student-impact-radar': {
    title: 'Student 5-Dimensional Impact Radar',
    source: 'Student Pre and Student Post surveys in survey_responses_v2.',
    questions: [
      'Student Pre Q5: “How would you rate your current experience with Artificial Intelligence tools for studying?”',
      'Student Post Q5: “How noticeably did your quiz/assignment performance and concept understanding improve?”',
      'Student Post Q1: “How many study/note-taking hours per week did you save using NotebookLM learning packs?”',
      'Student Post Q4: “How would you rate your level of study burnout/fatigue after using these AI assets?”',
      'Student Post Q6: “How reliable and helpful were the AI study packs compared to searching general tools?”',
    ],
    calculation: 'Combines AI familiarity, hours saved, concept improvement, burnout, and reliability summaries.',
    limitations: 'Some pre-training baseline percentages are fixed constants. The post-training AI familiarity value uses a concept-improvement question, not a familiarity question.',
  },
  'hours-saved-target': {
    title: 'Weekly Study & Lesson Prep Hours Saved',
    source: 'Student Post survey in survey_responses_v2.',
    questions: [
      'Q1: “How many study/note-taking hours per week did you save using NotebookLM learning packs?”',
    ],
    calculation: 'Counts responses in reported hour ranges and calculates the share meeting the 3+ hour target.',
    limitations: 'The chart is based on student post responses only; it does not aggregate faculty responses despite the subtitle. Answers are self-reported ranges.',
  },
  'familiarity-shift': {
    title: 'AI Competency Distribution Shift',
    source: 'Student Pre and Student Post surveys in survey_responses_v2.',
    questions: [
      'Student Pre Q5: “How would you rate your current experience with Artificial Intelligence tools for studying?”',
      'Student Post Q5: “How noticeably did your quiz/assignment performance and concept understanding improve?”',
    ],
    calculation: 'Groups the selected answer text into four displayed levels.',
    limitations: 'The post question measures perceived concept/quiz improvement, not AI competency. The pre/post measures are not equivalent.',
  },
  'adoption-intent': {
    title: 'Long-Term AI Adoption Intent',
    source: 'Student Post and Teacher Post surveys in survey_responses_v2.',
    questions: [
      'Student Post Q7: “Will you continue using NotebookLM for your study revision in upcoming semesters?”',
      'Teacher Post Q7: “Will you continue using NotebookLM in upcoming semesters?”',
    ],
    calculation: 'Groups reported intention categories separately for students and faculty.',
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
    limitations: 'Pre and Post respondents are not necessarily the same students. Multi-select categories may overlap; the displayed category mapping should be interpreted cautiously.',
  },
  'concept-improvement': {
    title: 'Concept Understanding Improvement',
    source: 'Student Post survey in survey_responses_v2.',
    questions: [
      'Q5: “How noticeably did your quiz/assignment performance and concept understanding improve?”',
    ],
    calculation: 'Distribution of valid 1–5 self-ratings.',
    limitations: 'Perceived improvement only; there is no objective paired pre/post learning score in this chart.',
  },
  'reading-ease': {
    title: 'Reading and Text Processing Ease',
    source: 'Student Post survey in survey_responses_v2.',
    questions: [
      'Q3: “How significantly did NotebookLM ease reading and comprehending complex texts?”',
    ],
    calculation: 'Distribution of valid 1–5 self-ratings.',
    limitations: 'Self-reported ease; no measured reading-comprehension test is compared.',
  },
  'learning-formats-pre': {
    title: 'Preferred Learning Formats',
    source: 'Student Pre survey in survey_responses_v2; misrouted faculty-form responses are excluded.',
    questions: [
      'Q3: “Which learning formats help you understand complex concepts best?”',
    ],
    calculation: 'Counts responses matching each displayed format.',
    limitations: 'Selections may overlap, so percentages may not total 100%.',
  },
  'helpful-assets-post': {
    title: 'Most Helpful AI Study Assets',
    source: 'Student Post survey in survey_responses_v2.',
    questions: [
      'Q2: “Which AI-generated study assets helped you most during revision?”',
    ],
    calculation: 'Counts responses matching each displayed asset.',
    limitations: 'Self-reported usefulness, not an objective measure of learning effectiveness. Selections may overlap.',
  },
  'burnout-reduction': {
    title: 'Study Fatigue and Burnout',
    source: 'Student Post survey in survey_responses_v2.',
    questions: [
      'Q4: “How would you rate your level of study burnout/fatigue after using these AI assets?”',
    ],
    calculation: 'Distribution of valid 1–5 self-ratings.',
    limitations: 'Self-reported post-training rating; the response scale should not be interpreted as a measured clinical burnout assessment.',
  },
  'study-pack-reliability': {
    title: 'AI Study Pack Reliability',
    source: 'Student Post survey in survey_responses_v2.',
    questions: [
      'Q6: “How reliable and helpful were the AI study packs compared to searching general tools?”',
    ],
    calculation: 'Groups responses into four reliability categories.',
    limitations: 'Perceived reliability, not an independent audit of accuracy. The donut center percentage is fixed in the current UI.',
  },
  'pre-ai-tools': {
    title: 'AI Tools Used Before Training',
    source: 'Student Pre survey in survey_responses_v2; misrouted faculty-form responses are excluded.',
    questions: [
      'Q10: “Which AI conversational assistants have you used most frequently?”',
    ],
    calculation: 'Counts mentions of the listed tool groups.',
    limitations: 'Tool groups can overlap; this is respondent usage, not market share. The donut center percentage is fixed in the current UI.',
  },
  'notebooklm-awareness': {
    title: 'Prior NotebookLM Awareness',
    source: 'Student Pre survey in survey_responses_v2; misrouted faculty-form responses are excluded.',
    questions: [
      'Q6: “Have you ever used NotebookLM or source-grounded AI tools to study directly from uploaded course PDFs?”',
    ],
    calculation: 'Groups responses into awareness/use categories.',
    limitations: 'Missing or unrecognized responses may be grouped as unfamiliar.',
  },
  'audio-aids': {
    title: 'Digital and Audio Study-Aid Habits',
    source: 'Student Pre survey in survey_responses_v2; misrouted faculty-form responses are excluded.',
    questions: [
      'Q4: “Do you currently use any audio or digital study aids (podcasts, text-to-speech) for revision?”',
    ],
    calculation: 'Groups responses into regular use, occasional use, and no use.',
    limitations: 'Missing or unrecognized responses may be grouped as no use.',
  },
  'workshop-interest': {
    title: 'Workshop Interest',
    source: 'Student Pre survey in survey_responses_v2; misrouted faculty-form responses are excluded.',
    questions: [
      'Q11: “Are you interested in take part in the \'The AI Bridge\' Training Workshop?”',
    ],
    calculation: 'Groups responses into interested, maybe, and not interested.',
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
    limitations: 'Some radar baseline/post percentages are fixed constants. The UI subtitle mentions output accuracy, but the radar has no output-accuracy axis.',
  },
  'multilingual-burden': {
    title: 'Faculty Multilingual Teaching Burden',
    source: 'Teacher Pre survey in survey_responses_v2.',
    questions: [
      'Q3: “Do you frequently need to translate or explain classical text materials across multiple languages (e.g., Arabic/Urdu to English)?”',
    ],
    calculation: 'Groups answers into occasional, constant, and rare/not-applicable categories.',
    limitations: 'Missing or unrecognized answers may be grouped as occasional. Donut center percentage is fixed in the current UI.',
  },
  'prep-reduction': {
    title: 'Faculty Lesson-Preparation Time Reduction',
    source: 'Teacher Post survey in survey_responses_v2.',
    questions: [
      'Q3: “How significantly did NotebookLM reduce text processing & prep time?”',
    ],
    calculation: 'Distribution of valid 1–5 self-ratings.',
    limitations: 'Self-reported outcome; percentages should be interpreted with the respondent count.',
  },
  'faculty-burnout': {
    title: 'Faculty Teaching Burnout',
    source: 'Teacher Post survey in survey_responses_v2.',
    questions: [
      'Q4: “How would you rate your level of teaching burnout after using AI tools?”',
    ],
    calculation: 'Distribution of valid 1–5 self-ratings.',
    limitations: 'Self-reported post-training rating; not a clinical burnout measure.',
  },
  'faculty-accuracy': {
    title: 'Faculty Evaluation of AI Output Accuracy',
    source: 'Teacher Post survey in survey_responses_v2.',
    questions: [
      'Q6: “How reliable and accurate were NotebookLM\'s source-grounded outputs?”',
    ],
    calculation: 'Groups answers into mostly, moderately, extremely accurate, and inaccurate categories.',
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
    limitations: 'Pre/Post respondents are not matched; outcome questions are proxies and do not directly measure every stated goal.',
  },
  'faculty-future-adoption': {
    title: 'Faculty Future Adoption Intent',
    source: 'Teacher Post survey in survey_responses_v2.',
    questions: [
      'Q7: “Will you continue using NotebookLM in upcoming semesters?”',
    ],
    calculation: 'Groups responses into intention categories.',
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
    limitations: 'Missing or unrecognized affiliation answers are classified as external.',
  },
  'teacher-experience': {
    title: 'Faculty Teaching Experience Levels',
    source: 'No survey answer is currently used; the displayed distribution is hardcoded in the analytics API.',
    questions: ['No source survey question is currently connected to this chart.'],
    calculation: 'Displays fixed 40% / 35% / 25% experience categories.',
    limitations: 'The chart is not based on collected teacher experience responses.',
  },
  'dept-participation': {
    title: 'Department Participation',
    source: 'Department fields across student and teacher records in survey_responses_v2.',
    questions: [
      'Department is read from the normalized department code/name or the “Department” answer field.',
    ],
    calculation: 'Counts records by department and shows the top eight groups.',
    limitations: 'Counts submissions, not unique participants; phases and participant types are combined.',
  },
  'semester-distribution': {
    title: 'Student Semester Distribution',
    source: 'Student Pre survey records in survey_responses_v2.',
    questions: [
      'Current semester field, or “Current Degree Level / Year of Study” when the semester field is unavailable.',
    ],
    calculation: 'Counts Student Pre records by normalized semester/cohort and shows the top eight.',
    limitations: 'Counts submissions rather than unique students; missing or unrecognized values are omitted.',
  },
  'misrouted-audit': {
    title: 'Survey Routing Quality Audit',
    source: 'Pipeline fields in survey_responses_v2: participant_type, survey_phase, and is_misrouted.',
    questions: ['No survey question; this chart audits record routing metadata.'],
    calculation: 'Counts student and teacher pre/post records and records marked as misrouted.',
    limitations: 'The current “correctly routed students” figure includes misrouted records, so displayed categories can overlap.',
  },
  'student-institution': {
    title: 'Student Institutional Distribution',
    source: 'Student Post survey in survey_responses_v2.',
    questions: [
      '“Are you an IIUI student or a student from another university?”',
    ],
    calculation: 'Classifies responses as IIUI or external.',
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
    limitations: 'Combines student/teacher familiarity questions; the mapping is approximate and uses a fallback score when no ratings are available.',
  },
  'timeline-velocity': {
    title: 'Survey Response Timeline',
    source: 'Timestamp answer field in survey_responses_v2.',
    questions: ['Google Form “Timestamp” field; this is not a scored survey question.'],
    calculation: 'Assigns each record to one of four fixed October week buckets.',
    limitations: 'Buckets are fixed to October and missing/out-of-range dates are assigned to a week, so the chart may not reflect actual response timing.',
  },
};
