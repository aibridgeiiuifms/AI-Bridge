-- ==============================================================================
-- Migration: 025_consolidate_mcq_categories.sql
-- Description: Consolidate 11 fragmented MCQ categories into 4 cohesive academic pillars.
-- IMPORTANT: Performs strictly in-place updates. Does NOT drop or re-insert rows,
-- preserving all existing UUIDs referenced across quiz_attempts and audit records.
-- ==============================================================================

-- 1. Pillar 1: AI & NotebookLM Foundations (NotebookLM Foundations + AI Foundations)
UPDATE public.mcq_pool 
SET category = 'AI & NotebookLM Foundations',
    updated_at = NOW()
WHERE category IN ('NotebookLM Foundations', 'AI Foundations');

-- 2. Pillar 2: Educational Workflows & Multimodal AI (Educational Applications + Audio Overviews + Structured Outputs)
UPDATE public.mcq_pool 
SET category = 'Educational Workflows & Multimodal AI',
    updated_at = NOW()
WHERE category IN ('Educational Applications', 'Audio Overviews', 'Structured Outputs');

-- 3. Pillar 3: Prompt Engineering & AI Ethics (AI Ethics & Integrity + Prompt Crafting)
UPDATE public.mcq_pool 
SET category = 'Prompt Engineering & AI Ethics',
    updated_at = NOW()
WHERE category IN ('AI Ethics & Integrity', 'Prompt Crafting');

-- 4. Pillar 4: Institutional Governance & SDG Impact (The AI Bridge Platform + Project Governance + Project Metrics + SDG Literacy)
UPDATE public.mcq_pool 
SET category = 'Institutional Governance & SDG Impact',
    updated_at = NOW()
WHERE category IN ('The AI Bridge Platform', 'Project Governance', 'Project Metrics', 'SDG Literacy');

-- 5. In-Place Update for Q48 & Q49 (Aligning legacy 30-MCQ mentions to 12-MCQ standard)
UPDATE public.mcq_pool
SET 
  question_text = 'In "The AI Bridge" 3-step certification lifecycle, what unlocks the 12-MCQ Course Assessment?',
  explanation = 'Under the updated system workflow, completing Step 1 (Pre-Survey) automatically unlocks Step 2 (12-MCQ Course Assessment).',
  updated_at = NOW()
WHERE id = '013a8232-9ada-4343-ba15-144a53bda911';

UPDATE public.mcq_pool
SET 
  question_text = 'What passing score is required on the 12-MCQ Course Assessment on "The AI Bridge" student portal?',
  options = jsonb_build_array('6 out of 12 (50%)', '9 out of 12 (75%)', '12 out of 12 (100%)', 'No passing score is required'),
  correct_option_index = 1,
  explanation = 'A 75% benchmark (9 out of 12 correct answers) demonstrates verified comprehension across all 4 curricular pillars before certificate unlocking.',
  updated_at = NOW()
WHERE id = '08716b85-805a-4d91-b029-2c8fde5daa39';

-- 6. Synchronize system_settings quiz_category_config with the 4 pillars (3 questions each = 12 total)
UPDATE public.system_settings
SET value = jsonb_build_object(
  'total_questions', 12,
  'passing_score', 9,
  'cooldown_seconds', 300,
  'categories', jsonb_build_array(
    jsonb_build_object('category', 'AI & NotebookLM Foundations', 'count', 3),
    jsonb_build_object('category', 'Educational Workflows & Multimodal AI', 'count', 3),
    jsonb_build_object('category', 'Prompt Engineering & AI Ethics', 'count', 3),
    jsonb_build_object('category', 'Institutional Governance & SDG Impact', 'count', 3)
  )
),
updated_at = NOW()
WHERE key = 'quiz_category_config';
