export type SurveyChartPermission = {
  title: string;
  team_member_visible: boolean;
  external_reviewer_visible: boolean;
  allow_download: boolean;
};

export const DEFAULT_SURVEY_CHART_PERMISSIONS: Record<string, SurveyChartPermission> = {
  kpi_overview_cards: {
    title: 'KPI Overview Summary Cards',
    team_member_visible: true,
    external_reviewer_visible: true,
    allow_download: true,
  },
  hours_saved_target_chart: {
    title: 'Hours Saved QIP Target Distribution',
    team_member_visible: true,
    external_reviewer_visible: true,
    allow_download: true,
  },
  before_after_familiarity_meter: {
    title: 'Before vs After AI Familiarity',
    team_member_visible: true,
    external_reviewer_visible: true,
    allow_download: true,
  },
  top_ai_assets_deployed: {
    title: 'Most Effective AI Study Assets',
    team_member_visible: true,
    external_reviewer_visible: true,
    allow_download: true,
  },
  department_matrix_table: {
    title: 'Department Participation & Impact',
    team_member_visible: true,
    external_reviewer_visible: true,
    allow_download: true,
  },
  faculty_cards_grid: {
    title: 'Faculty Groupings',
    team_member_visible: true,
    external_reviewer_visible: true,
    allow_download: true,
  },
  iiui_vs_non_iiui_distribution: {
    title: 'Institutional Outreach',
    team_member_visible: true,
    external_reviewer_visible: true,
    allow_download: true,
  },
  teacher_designation_analysis: {
    title: 'Teacher Designation & Experience',
    team_member_visible: true,
    external_reviewer_visible: true,
    allow_download: true,
  },
  quiz_score_distribution: {
    title: 'Quiz Assessment Score Distribution',
    team_member_visible: true,
    external_reviewer_visible: true,
    allow_download: true,
  },
  certificate_issuance_registry: {
    title: 'Recent Certificate Registry',
    team_member_visible: true,
    external_reviewer_visible: true,
    allow_download: true,
  },
  survey_question_distributions: {
    title: 'Survey Question Response Charts',
    team_member_visible: true,
    external_reviewer_visible: true,
    allow_download: true,
  },
};

export function mergeSurveyChartPermissions(storedPermissions: Record<string, unknown> | null | undefined) {
  return {
    ...DEFAULT_SURVEY_CHART_PERMISSIONS,
    ...(storedPermissions || {}),
  };
}
