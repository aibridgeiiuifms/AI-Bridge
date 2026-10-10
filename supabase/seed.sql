-- ==============================================================================
-- THE AI BRIDGE WEB APPLICATION | IIUI FMS
-- Database Seed File: 50-MCQ Question Pool, Team Structure & Initial Data
-- ==============================================================================

-- 1. Insert 50 MCQs into mcq_pool
INSERT INTO public.mcq_pool (question_text, options, correct_option_index, explanation, category, difficulty) VALUES
-- NotebookLM Basics & Source Grounding
('What distinguishes NotebookLM from conventional generic AI chatbots?', 
 '["It relies only on public web search without uploading files", "It is source-grounded strictly in the user-uploaded documents with citations", "It requires writing Python code to process texts", "It only accepts numerical spreadsheet data"]'::jsonb, 
 1, 'NotebookLM is source-grounded: its responses are strictly backed by the sources you upload, complete with inline citations.', 'NotebookLM Foundations', 'easy'),

('Which file formats are supported as source documents in NotebookLM?', 
 '["Google Docs, PDFs, Text files, Google Slides, and pasted text", "Only executable binary files (.exe)", "Only raw audio files (.wav, .mp3)", "Only Photoshop design files (.psd)"]'::jsonb, 
 0, 'NotebookLM supports Google Docs, PDFs, Markdown/text files, Google Slides, copied text, and web URLs.', 'NotebookLM Foundations', 'easy'),

('How does NotebookLM provide transparency and accountability for its answers?', 
 '["By generating random external links", "Through clickable inline citations referencing exact source page numbers and text excerpts", "By locking the interface until answers are verified", "It does not provide any verification mechanism"]'::jsonb, 
 1, 'NotebookLM includes clickable inline citations linking directly to exact passages in uploaded sources.', 'NotebookLM Foundations', 'easy'),

('What is the maximum number of sources you can upload to a single notebook in NotebookLM?', 
 '["Up to 5 sources", "Up to 50 sources", "Unlimited with no limits", "Only 1 single document"]'::jsonb, 
 1, 'A single NotebookLM notebook allows up to 50 sources, each containing up to 500,000 words.', 'NotebookLM Foundations', 'intermediate'),

('Why is NotebookLM particularly valuable for non-IT disciplines such as Sharia & Law or Usuluddin?', 
 '["It automatically translates code into Java", "It allows educators to synthesize dense classical texts without coding knowledge", "It requires mathematical proofs to operate", "It replaces the instructor entirely"]'::jsonb, 
 1, 'NotebookLM empowers non-technical humanities educators to summarize, search, and synthesize dense texts with zero code.', 'Educational Applications', 'easy'),

('What happens when you ask NotebookLM a question that is NOT present in any of your uploaded sources?', 
 '["It invents a convincing fictitious answer", "It clearly informs you that the information is not found within the selected sources", "It searches Google to guess the answer", "It deletes the notebook automatically"]'::jsonb, 
 1, 'Due to source-grounding, NotebookLM explicitly states when requested information is absent from selected sources.', 'NotebookLM Foundations', 'intermediate'),

-- Audio Overviews & Multimodal Features
('What is the primary function of NotebookLM''s "Audio Overview" feature?', 
 '["Dictating text into speech using a robotic monotone voice", "Generating an interactive, conversational two-host podcast deep-dive based on your sources", "Editing video files for YouTube", "Translating audio into musical notes"]'::jsonb, 
 1, 'The Audio Overview feature synthesizes your source materials into an engaging, conversational podcast between two AI co-hosts.', 'Audio Overviews', 'easy'),

('Can you customize the focus of an Audio Overview in NotebookLM?', 
 '["No, it is strictly automated with no user input", "Yes, by providing specific guiding instructions on target audience, topics, or difficulty", "Only if you pay a premium enterprise subscription", "Only by deleting all other sources"]'::jsonb, 
 1, 'NotebookLM allows users to customize Audio Overviews by giving specific prompts before generation.', 'Audio Overviews', 'intermediate'),

('How can non-IT educators best utilize Audio Overviews to save lesson planning time?', 
 '["By having students listen to summaries before class to flip the classroom", "By replacing all human lectures completely", "By using it as background music", "By downloading it for administrative attendance"]'::jsonb, 
 0, 'Audio Overviews enable flipped learning, allowing students to absorb pre-lecture concepts via conversational audio.', 'Educational Applications', 'intermediate'),

('What format can Audio Overviews be exported or shared in?', 
 '["Only printed on physical paper", "Streamed live and downloaded as standard .wav / .m4a audio files", "Encrypted proprietary database files only", "Only viewable inside a VR headset"]'::jsonb, 
 1, 'Audio Overviews can be played directly in-browser and downloaded as standard audio files.', 'Audio Overviews', 'easy'),

-- Study Guides, Quizzes & Structured Outputs
('Which structured study asset can be generated in one click from the Notebook guide?', 
 '["Briefing document, Study Guide, FAQ, Timeline, and Table of Contents", "C++ Source Code", "Photoshop Graphic Template", "SQL Database Migration"]'::jsonb, 
 0, 'The Notebook guide provides instant generation of Study Guides, FAQs, Timelines, Briefing docs, and Mind Map overviews.', 'Structured Outputs', 'easy'),

('How does the "Study Guide" feature assist teachers in preparing assessment quizzes?', 
 '["It automatically copies questions from other websites", "It extracts key themes, builds a glossary, and generates practice questions with answer keys", "It grades students'' physical exam papers", "It writes code for online test proctoring"]'::jsonb, 
 1, 'NotebookLM study guides include key concept summaries, glossaries, and practice short-answer/quiz questions.', 'Structured Outputs', 'easy'),

('What is a "Source Note" inside a NotebookLM workspace?', 
 '["A note you write yourself or save from AI conversation directly within the notebook", "An error message from Google Cloud", "A bill for cloud usage", "A student ID record"]'::jsonb, 
 0, 'Written notes or saved responses can be stored as notes within your notebook and used as additional sources.', 'NotebookLM Foundations', 'intermediate'),

('Can you select a specific subset of sources when querying a notebook in NotebookLM?', 
 '["No, all sources are always queried together", "Yes, you can check or uncheck specific sources in the source panel", "Only if you have fewer than 3 sources", "Only on mobile devices"]'::jsonb, 
 1, 'You can toggle checkboxes next to individual sources to focus the AI''s responses on specific chapters or books.', 'NotebookLM Foundations', 'intermediate'),

('How does NotebookLM handle multilingual source documents (e.g., Urdu or Arabic text alongside English)?', 
 '["It deletes non-English text automatically", "It processes and cross-references multilingual text, responding in your chosen query language", "It only supports Latin alphabets", "It produces scrambled characters"]'::jsonb, 
 1, 'Powered by Gemini models, NotebookLM handles multilingual corpora (Urdu, Arabic, Persian, English) seamlessly.', 'Educational Applications', 'intermediate'),

-- AI Ethics & Academic Integrity
('What is the primary ethical consideration when educators use AI to create curriculum materials?', 
 '["Ensuring all materials are kept secret", "Verifying AI-generated outputs against authentic scholarly sources for factual accuracy", "Never telling students that AI was used", "Ensuring only expensive software is used"]'::jsonb, 
 1, 'Human-in-the-loop verification remains essential to verify cultural, doctrinal, and academic accuracy.', 'AI Ethics & Integrity', 'easy'),

('Does uploading confidential student exam records into public free AI tools comply with ethical data governance?', 
 '["Yes, all data on the internet is public anyway", "No, personally identifiable student information must be protected and anonymized", "Yes, if the student gives oral consent", "Only during university examinations"]'::jsonb, 
 1, 'Student PII (Personally Identifiable Information) must always be sanitized and protected to uphold privacy standards.', 'AI Ethics & Integrity', 'intermediate'),

('Under the SDG Youth Campaign, which Sustainable Development Goal directly corresponds to quality AI-enhanced education?', 
 '["SDG 1: No Poverty", "SDG 4: Quality Education", "SDG 14: Life Below Water", "SDG 7: Affordable Energy"]'::jsonb, 
 1, 'SDG 4 focuses on ensuring inclusive and equitable quality education and promoting lifelong learning opportunities.', 'SDG Literacy', 'easy'),

('Which SDG relates directly to reducing inequalities by empowering non-technical disciplines with modern AI tools?', 
 '["SDG 10: Reduced Inequalities", "SDG 15: Life on Land", "SDG 6: Clean Water", "SDG 2: Zero Hunger"]'::jsonb, 
 0, 'SDG 10 targets reducing inequalities between technical disciplines and non-IT humanities faculties.', 'SDG Literacy', 'easy'),

('How does "The AI Bridge" project target SDG 8 (Decent Work and Economic Growth)?', 
 '["By replacing teachers with automated robots", "By saving 3 to 5 hours of administrative burden per week, reducing educator burnout and increasing productivity", "By selling AI software licenses to students", "By running commercial advertisements"]'::jsonb, 
 1, 'By eliminating repetitive preparation tasks, teachers save 3-5 hours weekly, directly combating professional burnout.', 'SDG Literacy', 'easy'),

-- Prompt Crafting for Educators
('What is "Few-Shot Prompting" when interacting with an AI assistant?', 
 '["Asking a question only two times", "Providing one or more concrete examples of desired input and output before asking the AI to perform the task", "Shutting down the model after three queries", "Using random words in prompt engineering"]'::jsonb, 
 1, 'Few-shot prompting provides concrete exemplary pairs that guide the AI to match the intended tone and format.', 'Prompt Crafting', 'intermediate'),

('Which prompt structure is most effective for generating a university-level quiz from a reading package?', 
 '["Make a quiz now", "Specify role (Professor of Law), source boundaries, question type (MCQ with rationale), and target Bloom taxonomy level", "Write 100 questions as fast as possible", "Copy and paste without any instructions"]'::jsonb, 
 1, 'Clear role specification, explicit source scoping, desired formatting, and cognitive level yield superior results.', 'Prompt Crafting', 'intermediate'),

('What is "Hallucination" in the context of Large Language Models?', 
 '["When an AI model generates factually incorrect or fabricated claims with high confidence", "When an AI computer screen turns off", "When an AI speaks with an accent", "When an AI takes longer than 5 seconds to reply"]'::jsonb, 
 0, 'Hallucination occurs when an LLM produces unsubstantiated or fictional information presented as fact.', 'AI Foundations', 'easy'),

('Why does source grounding in NotebookLM dramatically reduce hallucinations compared to ChatGPT or Gemini Web?', 
 '["Because NotebookLM restricts its knowledge retrieval strictly to uploaded text passages rather than open web speculation", "Because NotebookLM has no neural network", "Because NotebookLM only operates offline without internet", "Because it uses a spell-checker"]'::jsonb, 
 0, 'By constraining generation exclusively to the uploaded reference documents, hallucination is minimized.', 'AI Foundations', 'intermediate'),

('What is the "Context Window" of an AI language model?', 
 '["The physical size of the laptop monitor", "The amount of text (measured in tokens) the model can analyze and remember simultaneously in a single prompt", "The time of day when AI servers are fastest", "The browser window opened by the user"]'::jsonb, 
 1, 'The context window defines the maximum capacity of text tokens a model can hold in memory during processing.', 'AI Foundations', 'intermediate'),

-- Practical Workflow & Class Integration
('When preparing lecture handouts for Islamic Jurisprudence (Fiqh), how can a teacher best structure NotebookLM sources?', 
 '["Upload only random blog posts", "Upload authoritative primary texts, syllabus outlines, and verified scholarly translations in separate files", "Upload files without titles or dates", "Keep all texts in an encrypted zip file"]'::jsonb, 
 1, 'Uploading well-organized primary sources with clear naming allows precise citation and thematic cross-referencing.', 'Educational Applications', 'intermediate'),

('How can students use NotebookLM responsibly without violating academic integrity guidelines?', 
 '["By letting the AI write their final term papers entirely without attribution", "As an interactive research reading partner, study guide creator, and concept clarification tool while citing sources", "By submitting AI outputs as original handwritten work", "By bypassing all reading assignments"]'::jsonb, 
 1, 'Responsible AI usage involves using tools for comprehension, cross-examination, and synthesis with full attribution.', 'AI Ethics & Integrity', 'easy'),

('What is an "Anchor Note" in NotebookLM used for?', 
 '["Permanently saving a high-value summary or custom prompt output to refer back to or include as future context", "Locking the screen during an examination", "Connecting the computer to an Ethernet cable", "Restarting the Google account"]'::jsonb, 
 0, 'Pinned notes allow users to capture pivotal synthesized insights and integrate them into subsequent queries.', 'NotebookLM Foundations', 'intermediate'),

('Which Google AI model powers NotebookLM''s reasoning and document comprehension engine?', 
 '["BERT v1", "Gemini 1.5 Pro multimodal architecture", "TensorFlow 1.0", "AlphaGo 2016"]'::jsonb, 
 1, 'NotebookLM utilizes Google''s advanced Gemini 1.5 model family featuring extensive multi-million token context capabilities.', 'AI Foundations', 'intermediate'),

('In "The AI Bridge" 3-step certification lifecycle, what unlocks the 30-MCQ Course Assessment?', 
 '["Paying an online fee", "Completing the baseline Pre-Survey", "Sending an email to the university administration", "Waiting for 7 business days"]'::jsonb, 
 1, 'Under the updated system workflow, completing Step 1 (Pre-Survey) automatically unlocks Step 2 (30-MCQ Assessment).', 'The AI Bridge Platform', 'easy'),

-- Advanced Concepts & Project Architecture
('What passing score is required on the 30-MCQ Course Assessment on "The AI Bridge" student portal?', 
 '["10 out of 30 (33%)", "21 out of 30 (70%)", "30 out of 30 (100%)", "No passing score is required"]'::jsonb, 
 1, 'A 70% benchmark (21 out of 30 correct answers) demonstrates verified comprehension before certificate unlocking.', 'The AI Bridge Platform', 'easy'),

('How does a participant obtain their official verified certificate once all 3 steps are complete?', 
 '["By waiting for an unverified attachment in their spam email folder", "Through direct, instant one-click download in their personalized Student Portal dashboard", "By physically traveling to the administration office", "By mailing a handwritten letter"]'::jsonb, 
 1, 'Certificates are unlocked and downloaded directly inside the secure authenticated Student Portal dashboard.', 'The AI Bridge Platform', 'easy'),

('What happens when an employer or university scans the QR code printed on an "AI Bridge" certificate?', 
 '["It opens an error 404 page", "It opens the official public verification page displaying student name, workshop details, and verified status", "It downloads a virus to their phone", "It opens Google search"]'::jsonb, 
 1, 'Scanning the QR code navigates to the public verification endpoint confirming the authenticity of the award.', 'The AI Bridge Platform', 'easy'),

('What role does the "SDG Ambassador Member" have in "The AI Bridge" management portal?', 
 '["No access at all", "Monitoring student attendance, reviewing pre/post surveys, and managing workshop event logistics", "Full database root access to delete system servers", "Changing university academic regulations"]'::jsonb, 
 1, 'Ambassador members manage events, verify workshop attendance, and assist educators and learners through the platform.', 'The AI Bridge Platform', 'intermediate'),

('Who serves as the Principal Mentor and Project Lead for "The AI Bridge" initiative at IIUI?', 
 '["An anonymous online moderator", "Dr. Abdul Zahid Khan (Chairperson, Department of Technology & Project Management, FMS IIUI)", "A visiting international delegation", "The campus security supervisor"]'::jsonb, 
 1, 'Dr. Abdul Zahid Khan provides institutional oversight, academic guidance, and project leadership.', 'Project Governance', 'easy'),

('How many FMS SDG Ambassadors compose the core operational team of "The AI Bridge"?', 
 '["3 ambassadors", "10 ambassadors organized into three functional teams", "50 ambassadors", "100 volunteers"]'::jsonb, 
 1, 'The core team consists of 10 FMS SDG Ambassadors organized into Awareness, Workshops, and Analyzing teams.', 'Project Governance', 'easy'),

('Which of the following is NOT one of the three sub-teams in "The AI Bridge" campaign structure?', 
 '["Awareness Campaign Team", "Workshops & Trainings Team", "Analyzing & Reporting Team", "Cryptocurrency Trading Team"]'::jsonb, 
 3, 'The three official teams are Awareness Campaign, Workshops & Trainings, and Analyzing & Reporting.', 'Project Governance', 'easy'),

('What is the target weekly time-saving goal for participating non-IT faculty members using NotebookLM?', 
 '["3 to 5 hours saved per week per educator", "10 minutes saved per month", "Over 40 hours saved per day", "Zero time saved"]'::jsonb, 
 0, 'The quantifiable project metric targets saving 3-5 hours weekly in lesson planning, summarization, and study aid drafting.', 'Project Metrics', 'easy'),

('What is the target number of non-IT academic courses to be augmented with AI-generated learning assets?', 
 '["At least 3 distinct courses across non-IT faculties", "Only 1 course in computer science", "Every course in the country simultaneously", "None"]'::jsonb, 
 0, 'The QIP targets deploying verified AI-assisted assets across at least 3 distinct non-IT courses (e.g. Fiqh, Usuluddin, Arabic).', 'Project Metrics', 'intermediate'),

('What makes "The AI Bridge" zero-cost scaling model significant for public universities?', 
 '["It relies 100% on high-performance free-tier browser tools without expensive enterprise software licenses", "It charges high tuition fees to all attendees", "It requires purchasing expensive graphics cards for every classroom", "It relies entirely on commercial venture capital"]'::jsonb, 
 0, 'By leveraging zero-cost free-tier tools (NotebookLM, Gemini), the framework scales across public institutions with zero budget.', 'Project Metrics', 'intermediate'),

('Can NotebookLM synthesize information across multiple uploaded documents simultaneously?', 
 '["No, it can only view one document at a time", "Yes, it cross-references, compares viewpoints, and synthesizes findings across all selected documents", "Only if documents are in plain text format", "Only on Sundays"]'::jsonb, 
 1, 'NotebookLM performs multi-document synthesis, cross-comparing arguments and finding common threads across sources.', 'NotebookLM Foundations', 'intermediate'),

('When using NotebookLM, are your uploaded private personal documents used to train Google''s public AI models?', 
 '["Yes, all uploaded data is immediately published online", "No, Google states that your personal notebook source data is not used to train public models without consent", "Only if the file is greater than 1 MB", "Only on mobile browsers"]'::jsonb, 
 1, 'Google enterprise privacy guidelines specify that personal source texts are private and not used to train global public models.', 'AI Ethics & Integrity', 'intermediate'),

('What is the recommended prompt technique to get NotebookLM to focus on a particular section of a large uploaded book?', 
 '["Using quotes and referencing specific chapter headers or keywords found in the source", "Deleting the browser cookies", "Writing the prompt in capital letters only", "Reloading the page 10 times"]'::jsonb, 
 0, 'Referencing specific chapter titles, author names, or key terms directs the retrieval engine to the relevant source sections.', 'Prompt Crafting', 'intermediate'),

('How does the Post-Survey in "The AI Bridge" contribute to the project''s final evaluation?', 
 '["It collects credit card information", "It quantifies perceived efficiency gains, hours saved, and comprehension shifts to score the project out of 100", "It is discarded after reading", "It only asks for student email passwords"]'::jsonb, 
 1, 'The post-survey data provides quantitative validation of efficiency gains and learning outcomes for the QIP final report.', 'Project Metrics', 'intermediate'),

('What is a "Digital Mind Map" or concept structure generated from NotebookLM used for?', 
 '["Visualizing conceptual hierarchies and interrelations between classical textbook doctrines", "Replacing web browser navigation", "Creating mathematical matrices", "Testing internet download speed"]'::jsonb, 
 0, 'Concept structures clarify complex taxonomies and hierarchical relationships in classical literature for students.', 'Educational Applications', 'easy'),

('Which of the following describes the "Flipped Classroom" model enabled by NotebookLM Audio Overviews?', 
 '["Students listen to source-grounded audio overviews prior to class, reserving lecture time for interactive debate and case analysis", "Teachers turn their desks upside down", "Students teach the teachers computer science", "Classrooms are held outdoors without teachers"]'::jsonb, 
 0, 'Flipped classrooms shift introductory content consumption to pre-class audio listening, maximizing collaborative discussion time.', 'Educational Applications', 'intermediate'),

('What should an educator do if a citation in NotebookLM leads to an unexpected excerpt?', 
 '["Ignore it completely", "Click the citation to verify the context directly in the source viewer and refine the prompt if necessary", "Assume the source text was altered", "Close the computer immediately"]'::jsonb, 
 1, 'Clicking citations opens the exact source excerpt, allowing the educator to quickly verify academic context.', 'NotebookLM Foundations', 'easy'),

('What is the Hum Hain Pakistan (HHP) SDG Youth Campaign Gala target milestone date for The AI Bridge?', 
 '["November 14 (Week 4 final submission & institutional nominations)", "January 1 of next year", "There is no target deadline", "Three years later"]'::jsonb, 
 0, 'Week 4 concludes with the final institutional QIP nominations and evaluation submission by November 14.', 'Project Governance', 'easy'),

('Why is human academic oversight ("Human in the Loop") non-negotiable when deploying AI in religious or legal subjects?', 
 '["Because AI models lack contextual discernment, religious authority, and judicial judgment which require human scholarship", "Because computers cannot display Arabic letters", "Because AI is illegal in universities", "Because servers do not run at night"]'::jsonb, 
 0, 'Human scholars provide essential normative judgment, theological context, and ethical discernment beyond AI text generation.', 'AI Ethics & Integrity', 'intermediate'),

('What is the ultimate vision of "The AI Bridge" at International Islamic University Islamabad?', 
 '["To prove that modern artificial intelligence can serve classical humanities and empower non-IT educators with dignified, efficient tools", "To force all departments to switch to software engineering", "To eliminate traditional books entirely", "To build an autonomous robot for the library"]'::jsonb, 
 0, 'The AI Bridge bridges modern AI and classical humanities, providing ethical, source-grounded tools to uplift non-IT scholarship.', 'The AI Bridge Platform', 'easy')
ON CONFLICT DO NOTHING;

-- 2. Insert Default Events
INSERT INTO public.events (title, event_date, location, description, sdg_tags, team_tag, visibility) VALUES
('The AI Bridge: Launch & Campus Awareness Drive', CURRENT_DATE - INTERVAL '5 days', 'Central Library & Faculty of Management Sciences, IIUI', 
 'Official initiation of The AI Bridge under the Hum Hain Pakistan SDG Youth Campaign. Distributing awareness flyers, introducing NotebookLM capabilities, and launching the baseline pre-assessment survey.',
 ARRAY['SDG 4: Quality Education', 'SDG 10: Reduced Inequalities'], 'awareness', 'public'),

('Faculty Hands-On Workshop: NotebookLM for Non-IT Educators', CURRENT_DATE - INTERVAL '2 days', 'FMS Executive Seminar Hall, IIUI',
 'Intensive practical training session for faculty members from Sharia & Law, Usuluddin, and Social Sciences. Demonstrating source grounding, Audio Overviews, and automated study guide generation.',
 ARRAY['SDG 4: Quality Education', 'SDG 8: Decent Work', 'SDG 17: Partnerships'], 'workshops', 'public'),

('Mid-Term Pilot Review & Impact Data Collection', CURRENT_DATE + INTERVAL '3 days', 'Department of Technology & Project Management, IIUI',
 'Cross-departmental meeting to measure educator time saved (target: 3-5 hours/week), review 30-MCQ course assessment data, and prepare the QIP Week 3 documentation.',
 ARRAY['SDG 8: Decent Work', 'SDG 17: Partnerships'], 'analyzing', 'internal'),

('Institutional SDG Walk & National Gala Demonstration Stall', CURRENT_DATE + INTERVAL '10 days', 'IIUI Main Boulevard & National SDG Gala Venue',
 'Showcasing The AI Bridge digital platform, live QR verification of student certificates, and final analytical impact report to university leadership and national campaign evaluators.',
 ARRAY['SDG 4: Quality Education', 'SDG 8: Decent Work', 'SDG 10: Reduced Inequalities', 'SDG 17: Partnerships'], 'general', 'public')
ON CONFLICT DO NOTHING;
