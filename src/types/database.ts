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
  created_at: string;
  updated_at: string;
}

export interface MemberPermissions {
  member_id: string;
  can_manage_events: boolean;
  can_view_surveys: boolean;
  can_verify_attendance: boolean;
  can_manage_mcqs: boolean;
  can_export_reports: boolean;
  updated_at: string;
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
}

export interface SurveyResponse {
  id: string;
  user_id: string;
  survey_type: 'pre' | 'post';
  answers: Record<string, any>;
  hours_saved_estimate: number;
  comprehension_self_rating: number;
  feedback_notes: string | null;
  submitted_at: string;
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
  certificate_id: string; // e.g. AIB-2025-0001
  verification_code: string;
  user_id: string;
  recipient_name: string;
  recipient_role: string;
  student_id: string | null;
  department: string | null;
  course_name: string;
  completion_date: string;
  pdf_url: string | null;
  qr_code_url: string | null;
  is_valid: boolean;
  issued_by: string;
  issued_at: string;
}

export interface UserProgressStatus {
  hasPreSurvey: boolean;
  hasPassedQuiz: boolean;
  quizScore: number | null;
  hasPostSurvey: boolean;
  certificate: Certificate | null;
  canDownloadCertificate: boolean;
}
