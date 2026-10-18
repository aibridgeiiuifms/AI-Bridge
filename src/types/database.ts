export type UserRole = 'admin' | 'member' | 'student';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  student_id: string | null;
  department: string | null;
  phone: string | null;
  avatar_url: string | null;
  assigned_tasks?: string[];
  created_at: string;
  updated_at: string;
}

export type MCQAccessLevel = 'none' | 'viewer' | 'moderator' | 'manager';

export interface MemberPermissions {
  member_id: string;
  can_manage_events: boolean;
  can_view_surveys: boolean;
  can_verify_attendance: boolean;
  can_manage_mcqs: boolean;
  can_export_reports: boolean;
  can_manage_team?: boolean;
  mcq_access_level?: MCQAccessLevel;
  updated_at: string;
}

export interface CampaignTask {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface RoleWhitelistEntry {
  email: string;
  target_role: UserRole;
  team_tag?: 'awareness' | 'workshops' | 'analyzing' | 'general';
  assigned_tasks?: string[];
  full_name?: string | null;
  notes?: string | null;
  can_manage_team?: boolean;
  mcq_access_level?: MCQAccessLevel;
  created_at?: string;
  updated_at?: string;
}

export interface EventItem {
  id: string;
  title: string;
  event_date: string;
  location: string;
  description: string;
  cover_image_url: string | null;
  gallery_urls: string[];
  sdg_tags: string[];
  team_tag: 'awareness' | 'workshops' | 'analyzing' | 'general';
  visibility: 'public' | 'internal';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MCQQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_option_index?: number; // Only exposed to admin or on submission evaluation
  explanation?: string;
  category: string;
  difficulty: 'easy' | 'intermediate' | 'advanced';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  last_updated_by?: string;
}

export interface MCQAuditLogEntry {
  id: string;
  mcq_id: string;
  question_snippet: string;
  action: 'toggle_status' | 'edit_question' | 'create_question' | 'deactivate_question';
  performed_by: string;
  performed_at: string;
  details?: Record<string, any>;
}

export interface SurveyResponse {
  id: string;
  user_id: string | null;
  respondent_email: string;
  survey_type: 'pre' | 'post';
  answers: Record<string, any>;
  hours_saved_estimate: number;
  comprehension_self_rating: number;
  feedback_notes: string | null;
  sheet_row_number?: number | null;
  submitted_at: string;
  updated_at: string;
}

export interface SurveyAuditLog {
  id: string;
  survey_id: string | null;
  user_id: string | null;
  user_email: string;
  survey_type: 'pre' | 'post' | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  source: 'google_sheets' | 'web_portal' | 'api' | 'database' | 'admin_override';
  sheet_row_number: number | null;
  performed_by: string | null;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  changed_fields: string[];
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  drawn_question_ids: string[];
  user_answers: Record<string, number>;
  score: number;
  total_questions: number;
  passing_score: number;
  passed: boolean;
  started_at: string;
  completed_at: string;
}

export interface Certificate {
  id: string;
  certificate_id: string; // e.g. AIB-K7M2P9QR (8-char non-guessable alphanumeric)
  verification_code: string;
  user_id: string;
  recipient_name: string;
  student_id: string | null;
  department: string | null;
  completion_date: string;
  is_valid: boolean;
  created_at?: string;
  legacy_certificate_id?: string | null;
  // Legacy optional fields
  recipient_role?: string;
  course_name?: string;
  pdf_url?: string | null;
  qr_code_url?: string | null;
  issued_by?: string;
  issued_at?: string;
}

export interface UserProgressStatus {
  hasPreSurvey: boolean;
  hasPassedQuiz: boolean;
  quizScore: number | null;
  hasPostSurvey: boolean;
  certificate: Certificate | null;
  canDownloadCertificate: boolean;
}
