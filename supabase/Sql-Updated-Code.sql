-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'student'::text CHECK (role = ANY (ARRAY['admin'::text, 'team-member'::text, 'student'::text, 'teacher'::text, 'guest'::text])),
  student_id text,
  department text DEFAULT 'Faculty of Management Sciences (FMS)'::text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.mcq_pool (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_option_index integer NOT NULL CHECK (correct_option_index >= 0 AND correct_option_index <= 3),
  explanation text,
  category text NOT NULL DEFAULT 'NotebookLM & AI Foundations'::text,
  difficulty text DEFAULT 'intermediate'::text CHECK (difficulty = ANY (ARRAY['easy'::text, 'intermediate'::text, 'advanced'::text])),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  last_updated_by text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT mcq_pool_pkey PRIMARY KEY (id)
);
CREATE TABLE public.surveys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  respondent_email text NOT NULL,
  survey_type text NOT NULL CHECK (survey_type = ANY (ARRAY['pre'::text, 'post'::text])),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  hours_saved_estimate numeric DEFAULT 0,
  comprehension_self_rating integer CHECK (comprehension_self_rating >= 1 AND comprehension_self_rating <= 5),
  feedback_notes text,
  sheet_row_number integer,
  submitted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  extracted_reg_no text,
  extracted_dept_code text,
  extracted_semester text,
  CONSTRAINT surveys_pkey PRIMARY KEY (id),
  CONSTRAINT surveys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT surveys_extracted_dept_code_fkey FOREIGN KEY (extracted_dept_code) REFERENCES public.department_mappings(code)
);
CREATE TABLE public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  drawn_question_ids ARRAY NOT NULL,
  user_answers jsonb NOT NULL,
  score integer NOT NULL,
  total_questions integer NOT NULL DEFAULT 30,
  passing_score integer NOT NULL DEFAULT 21,
  passed boolean NOT NULL DEFAULT false,
  started_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  completed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  certificate_id text NOT NULL UNIQUE,
  verification_code text NOT NULL UNIQUE,
  user_id uuid NOT NULL UNIQUE,
  recipient_name text NOT NULL,
  recipient_role text DEFAULT 'Trained Educator / Participant'::text,
  student_id text,
  department text,
  course_name text DEFAULT 'The AI Bridge: Source-Grounded AI & NotebookLM Mastery'::text,
  completion_date date NOT NULL DEFAULT CURRENT_DATE,
  pdf_url text,
  qr_code_url text,
  is_valid boolean NOT NULL DEFAULT true,
  issued_by text DEFAULT 'Dr. Abdul Zahid Khan (Chairperson, TPM Department, FMS IIUI)'::text,
  issued_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT certificates_pkey PRIMARY KEY (id),
  CONSTRAINT certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.system_settings (
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT system_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.campaign_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT campaign_tasks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.department_mappings (
  code text NOT NULL,
  standard_dept_name text NOT NULL,
  faculty_name text NOT NULL,
  faculty_code text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT department_mappings_pkey PRIMARY KEY (code)
);
CREATE TABLE public.student_surveys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  student_email text NOT NULL,
  full_name text,
  survey_type text NOT NULL CHECK (survey_type = ANY (ARRAY['pre'::text, 'post'::text])),
  reg_no text,
  dept_code text,
  semester text,
  hours_saved_category text,
  ai_familiarity_rating integer CHECK (ai_familiarity_rating >= 1 AND ai_familiarity_rating <= 5),
  feedback_notes text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  sheet_row_number integer,
  submitted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  login_email text,
  match_key text NOT NULL,
  CONSTRAINT student_surveys_pkey PRIMARY KEY (id),
  CONSTRAINT student_surveys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT student_surveys_dept_code_fkey FOREIGN KEY (dept_code) REFERENCES public.department_mappings(code)
);
CREATE TABLE public.teacher_surveys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  teacher_email text NOT NULL,
  full_name text,
  survey_type text NOT NULL CHECK (survey_type = ANY (ARRAY['pre'::text, 'post'::text])),
  designation text,
  dept_code text,
  department_name text,
  teaching_experience text,
  hours_saved_category text,
  ai_familiarity_rating integer CHECK (ai_familiarity_rating >= 1 AND ai_familiarity_rating <= 5),
  feedback_notes text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  sheet_row_number integer,
  submitted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  login_email text,
  match_key text NOT NULL,
  CONSTRAINT teacher_surveys_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_surveys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT teacher_surveys_dept_code_fkey FOREIGN KEY (dept_code) REFERENCES public.department_mappings(code)
);
CREATE TABLE public.mcq_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  mcq_id uuid,
  question_snippet text NOT NULL,
  action text NOT NULL CHECK (action = ANY (ARRAY['toggle_status'::text, 'edit_question'::text, 'create_question'::text, 'deactivate_question'::text])),
  performed_by text NOT NULL,
  performed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  details jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT mcq_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT mcq_audit_logs_mcq_id_fkey FOREIGN KEY (mcq_id) REFERENCES public.mcq_pool(id)
);
CREATE TABLE public.members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE,
  email text UNIQUE,
  full_name text NOT NULL DEFAULT ''::text,
  team_role text NOT NULL DEFAULT 'team-member'::text CHECK (team_role = ANY (ARRAY['admin'::text, 'team-member'::text])),
  designation text,
  bio text,
  avatar_url text,
  team_tag text DEFAULT 'General'::text,
  assigned_tasks ARRAY DEFAULT '{}'::text[],
  linkedin_url text,
  position_order integer NOT NULL DEFAULT 99,
  is_published boolean NOT NULL DEFAULT true,
  can_manage_team boolean NOT NULL DEFAULT false,
  mcq_access_level text NOT NULL DEFAULT 'none'::text CHECK (mcq_access_level = ANY (ARRAY['none'::text, 'viewer'::text, 'moderator'::text, 'manager'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  can_manage_gallery boolean NOT NULL DEFAULT false,
  can_manage_resources boolean NOT NULL DEFAULT false,
  CONSTRAINT members_pkey PRIMARY KEY (id),
  CONSTRAINT members_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.gallery_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  thumbnail_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT gallery_folders_pkey PRIMARY KEY (id),
  CONSTRAINT gallery_folders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.gallery_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  folder_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  location text NOT NULL,
  event_date date,
  is_date_visible boolean NOT NULL DEFAULT true,
  description_markdown text NOT NULL DEFAULT ''::text,
  external_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT gallery_events_pkey PRIMARY KEY (id),
  CONSTRAINT gallery_events_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.gallery_folders(id),
  CONSTRAINT gallery_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.gallery_pictures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  image_url text NOT NULL,
  storage_path text NOT NULL,
  caption text,
  display_order integer NOT NULL DEFAULT 0,
  is_cover boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT gallery_pictures_pkey PRIMARY KEY (id),
  CONSTRAINT gallery_pictures_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.gallery_events(id)
);
CREATE TABLE public.gallery_picture_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  picture_id uuid NOT NULL,
  member_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT gallery_picture_tags_pkey PRIMARY KEY (id),
  CONSTRAINT gallery_picture_tags_picture_id_fkey FOREIGN KEY (picture_id) REFERENCES public.gallery_pictures(id),
  CONSTRAINT gallery_picture_tags_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id)
);
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL,
  user_role text NOT NULL DEFAULT 'guest'::text CHECK (user_role = ANY (ARRAY['admin'::text, 'team-member'::text, 'student'::text, 'teacher'::text, 'guest'::text])),
  event_name text NOT NULL,
  page_path text NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  referrer text,
  device_type text CHECK (device_type = ANY (ARRAY['mobile'::text, 'tablet'::text, 'desktop'::text])),
  browser text,
  country text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.analytics_access_control (
  member_id uuid NOT NULL,
  can_view_analytics boolean NOT NULL DEFAULT false,
  granted_by uuid,
  granted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT analytics_access_control_pkey PRIMARY KEY (member_id),
  CONSTRAINT analytics_access_control_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id),
  CONSTRAINT analytics_access_control_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.event_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT event_likes_pkey PRIMARY KEY (id),
  CONSTRAINT event_likes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.gallery_events(id),
  CONSTRAINT event_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.training_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  module text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['pdf'::text, 'video'::text, 'link'::text, 'audio'::text])),
  url text NOT NULL,
  storage_path text,
  file_size_bytes bigint,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  thumbnail_url text,
  CONSTRAINT training_resources_pkey PRIMARY KEY (id)
);
CREATE TABLE public.student_resource_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  resource_id uuid NOT NULL,
  watched_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT student_resource_progress_pkey PRIMARY KEY (id),
  CONSTRAINT student_resource_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT student_resource_progress_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.training_resources(id)
);