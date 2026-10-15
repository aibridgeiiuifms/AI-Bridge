/**
 * ==============================================================================
 * THE AI BRIDGE - GOOGLE SHEETS SYNC CONFIGURATION
 * ==============================================================================
 * Copy and paste this code into File 1 (Config.gs) in Google Apps Script.
 * ==============================================================================
 */

const CONFIG = {
  // Live Vercel Webhook Endpoint
  WEBHOOK_URL: "https://ai-bridge-iiui.vercel.app/api/webhooks/google-sheets",

  // Security Secret Token (Matches SHEETS_WEBHOOK_SECRET in .env.local / Vercel env)
  WEBHOOK_SECRET: "Hum_Hai_Pakistan-AI_Bridge_iiui_fms",

  // Set survey phase: 'pre' or 'post'
  DEFAULT_SURVEY_TYPE: "pre",

  // Set participant audience: 'student' or 'teacher'
  PARTICIPANT_TYPE: "student"
};
