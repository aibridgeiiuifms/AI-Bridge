/**
 * ==============================================================================
 * THE AI BRIDGE - GOOGLE SHEETS SYNC ENGINE (v3.1 - 2-Table Architecture)
 * ==============================================================================
 * - Option 1: Pure Cloud Sync (Google Sheet stays 100% untouched).
 * - Extracts full_name into its own clean dedicated field.
 * - Stores hours_saved_category as original clean text ('3 - 5 hours', etc.).
 * - Supports both Student Surveys and Teacher Surveys.
 * ==============================================================================
 */

// ----------------- WEB APP ENDPOINTS (Optional Deployment) -----------------

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "The AI Bridge Google Apps Script Web App is active.",
    target_webhook: CONFIG.WEBHOOK_URL
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    let contents = {};
    if (e && e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      contents = e.parameter;
    }

    const email = contents.email || contents['Email Address'] || '';
    const parsedEmailData = parseStudentEmail(email, contents.roll_no || contents.roll || '');

    const payload = {
      action: contents.action || "INSERT",
      participant_type: contents.participant_type || CONFIG.PARTICIPANT_TYPE || "student",
      survey_type: contents.survey_type || CONFIG.DEFAULT_SURVEY_TYPE,
      email: email,
      full_name: contents.full_name || contents.name || '',
      hours_saved_category: contents.hours_saved_category || contents.hoursSavedCategory || '',
      feedback_notes: contents.feedback_notes || contents.feedback || '',
      answers: contents.answers || contents,
      extracted_reg_no: parsedEmailData.regNo,
      extracted_dept_code: parsedEmailData.deptCode,
      extracted_semester: parsedEmailData.semester
    };

    const res = sendToWebhook(payload);
    return ContentService.createTextOutput(JSON.stringify({
      success: res.success,
      message: res.success ? "Payload forwarded to Vercel and recorded in Supabase." : res.error
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ----------------- AUTOMATIC EVENT TRIGGERS -----------------

/**
 * TRIGGER: Fires whenever a respondent submits a Google Form
 */
function onFormSubmit(e) {
  try {
    const sheet = (e && e.range) ? e.range.getSheet() : SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastCol = sheet.getLastColumn();
    if (lastCol < 1) return;

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const row = (e && e.range) ? e.range.getRow() : sheet.getLastRow();
    const rowValues = sheet.getRange(row, 1, 1, lastCol).getValues()[0];

    const parsed = parseRowData(headers, rowValues);
    if (!parsed.email) {
      Logger.log("onFormSubmit: No valid email address found in row " + row);
      return;
    }

    const payload = {
      action: "INSERT",
      participant_type: detectParticipantType(sheet.getName()),
      survey_type: detectSurveyType(sheet.getName()),
      email: parsed.email,
      full_name: parsed.fullName,
      sheet_row_number: row,
      performed_by: parsed.email,
      hours_saved_category: parsed.hoursSavedCategory,
      ai_familiarity_rating: parsed.ai_familiarity_rating,
      feedback_notes: parsed.feedback,
      answers: parsed.answers,
      extracted_reg_no: parsed.regNo,
      extracted_dept_code: parsed.deptCode,
      extracted_semester: parsed.semester
    };

    sendToWebhook(payload);
  } catch (err) {
    Logger.log("Error in onFormSubmit: " + err.message);
  }
}

// ----------------- CUSTOM MENU & BULK ACTIONS -----------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🤖 The AI Bridge')
    .addItem('🔄 Sync Entire Sheet to Supabase (Option 1 Pure Sync)', 'syncAllRows')
    .addItem('⚡ Setup Automatic Sync Trigger (One-Click)', 'setupAutomaticTrigger')
    .addItem('🧹 Clean Excess Duplicate Columns (One-Click)', 'cleanDuplicateColumns')
    .addItem('🔌 Test Webhook Connection', 'testConnection')
    .addToUi();
}

/**
 * ONE-CLICK TRIGGER SETUP:
 * Registers an Installable onFormSubmit trigger with full network permissions (UrlFetchApp).
 */
function setupAutomaticTrigger() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet();

  // Remove any conflicting old triggers
  const existingTriggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;
  for (let i = 0; i < existingTriggers.length; i++) {
    if (existingTriggers[i].getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(existingTriggers[i]);
      deletedCount++;
    }
  }

  // Create official installable trigger
  ScriptApp.newTrigger('onFormSubmit')
    .forSpreadsheet(sheet)
    .onFormSubmit()
    .create();

  ui.alert("⚡ Automatic Sync Active!\n\nEvery new Google Form response will now automatically sync to Supabase in real-time.\n(Replaced " + deletedCount + " older triggers)");
}

/**
 * Syncs all rows in active sheet to Supabase in one fast batch.
 * Pure in-memory: Does NOT modify the Google Sheet cells or layout.
 */
function syncAllRows() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow <= 1) {
    ui.alert("The sheet does not contain any data rows to sync.");
    return;
  }

  // Load headers and row values into memory once
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const participantType = detectParticipantType(sheet.getName());
  const surveyType = detectSurveyType(sheet.getName());

  const rowsToSync = [];
  for (let i = 0; i < allData.length; i++) {
    const rowNum = i + 2;
    const parsed = parseRowData(headers, allData[i]);
    if (parsed.email) {
      rowsToSync.push({
        email: parsed.email,
        full_name: parsed.fullName,
        participant_type: participantType,
        survey_type: surveyType,
        sheet_row_number: rowNum,
        hours_saved_category: parsed.hoursSavedCategory,
        ai_familiarity_rating: parsed.ai_familiarity_rating,
        feedback_notes: parsed.feedback,
        answers: parsed.answers,
        extracted_reg_no: parsed.regNo,
        extracted_dept_code: parsed.deptCode,
        extracted_semester: parsed.semester
      });
    }
  }

  const payload = {
    action: "SYNC_ALL",
    participant_type: participantType,
    survey_type: surveyType,
    rows: rowsToSync
  };

  const res = sendToWebhook(payload);
  if (res.success) {
    ui.alert(`✅ Sync Complete!\n\nSuccessfully synced ${res.data.synced_count || rowsToSync.length} rows to Supabase.\n\nTarget Table: ${participantType === 'teacher' ? 'teacher_surveys' : 'student_surveys'}\nNames and clean raw data preserved without modifying your spreadsheet.`);
  } else {
    ui.alert(`❌ Sync Failed: ${res.error}`);
  }
}

/**
 * ONE-CLICK CLEANUP TOOL:
 * Removes any duplicate 'Derived...' columns created previously.
 */
function cleanDuplicateColumns() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastCol = sheet.getLastColumn();

  if (lastCol <= 1) return;

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let deletedCount = 0;

  for (let c = headers.length - 1; c >= 0; c--) {
    const colName = String(headers[c] || "").trim().toLowerCase();
    if (
      colName.includes("derived reg") ||
      colName.includes("derived dept") ||
      colName.includes("derived semester") ||
      colName === "sync status" ||
      colName === ""
    ) {
      sheet.deleteColumn(c + 1);
      deletedCount++;
    }
  }

  ui.alert(`🧹 Cleaned up ${deletedCount} extra columns!\nYour sheet is now back to its clean, original form.`);
}

/**
 * Health check test
 */
function testConnection() {
  const ui = SpreadsheetApp.getUi();
  try {
    const res = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, { method: "get", muteHttpExceptions: true });
    ui.alert("Webhook Connection Status: " + res.getResponseCode() + "\nResponse: " + res.getContentText());
  } catch (err) {
    ui.alert("Connection Failed: " + err.message);
  }
}

// ----------------- IN-MEMORY PARSER UTILITIES -----------------

function parseStudentEmail(rawEmail, fallbackRoll) {
  if (!rawEmail) return { regNo: "", deptCode: "", semester: "" };

  const clean = String(rawEmail).replace(/\s+/g, "").toLowerCase();
  const userPart = clean.split("@")[0];

  // Type 1: Standard Modern Format [Reg][Dept][Semester] -> e.g. 025580bsirf26
  const matchStd = userPart.match(/^(\d+)[/_]?([a-z]+?)([fs]\d{2})$/);
  if (matchStd) {
    return {
      regNo: matchStd[1],
      deptCode: matchStd[2].toUpperCase(),
      semester: matchStd[3].toUpperCase()
    };
  }

  // Type 2: Older Senior Format [Name].[Dept][Reg] -> e.g. zain.bsba126
  const matchName = userPart.match(/^[a-z]+\.([a-z]+?)(\d+)$/);
  if (matchName) {
    const deptCode = matchName[1].toUpperCase();
    const regNo = matchName[2];
    let semester = "";

    // Via Fallback: check messy roll number from form for season+year
    if (fallbackRoll) {
      const matchRollSem = String(fallbackRoll).match(/([fsFS][-_\s]?\d{2})/);
      if (matchRollSem) {
        semester = matchRollSem[1].replace(/[-_\s]/g, "").toUpperCase();
      }
    }

    return {
      regNo: regNo,
      deptCode: deptCode,
      semester: semester || "UNKNOWN"
    };
  }

  // General Fallback search
  const matchSearch = clean.match(/(\d{4,6})[/\-_]?([a-z]+?)([fs]\d{2})/);
  if (matchSearch) {
    return {
      regNo: matchSearch[1],
      deptCode: matchSearch[2].toUpperCase(),
      semester: matchSearch[3].toUpperCase()
    };
  }

  return { regNo: "", deptCode: "", semester: "" };
}

function parseRowData(headers, rowValues) {
  let email = "";
  let fullName = "";
  let hoursSavedCategory = "";
  let rating = null;
  let feedback = "";
  let fallbackRoll = "";
  const answers = {};

  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i]).trim().toLowerCase();
    const val = rowValues[i];

    answers[headers[i]] = val;

    // Detect Email (strip all internal spaces and lowercase)
    if (header.includes("email") || header.includes("student id") || header.includes("respondent")) {
      if (String(val).includes("@")) {
        email = String(val).replace(/\s+/g, "").toLowerCase();
      }
    }

    // Detect Name
    if (header.includes("student name") || header.includes("teacher name") || header.includes("full name") || header === "name") {
      const nameVal = String(val || "").trim();
      if (nameVal) fullName = nameVal;
    }

    // Detect Fallback Roll Number
    if (header.includes("roll") || header.includes("registration") || header.includes("reg no")) {
      fallbackRoll = String(val || "");
    }

    // Detect Hours Saved Category (Keep original clean text, no midpoint math!)
    if (header.includes("hour") || header.includes("time save") || header.includes("weekly")) {
      hoursSavedCategory = String(val || "").trim();
    }

    // Detect Rating (1-5 scale)
    if (header.includes("familiar") || header.includes("rating") || header.includes("scale") || header.includes("comfort")) {
      const num = parseInt(String(val).replace(/[^0-9]/g, ''));
      if (!isNaN(num) && num >= 1 && num <= 5) {
        rating = num;
      }
    }

    // Detect Feedback
    if (header.includes("feedback") || header.includes("note") || header.includes("comment") || header.includes("suggestion")) {
      feedback = String(val || "").trim();
    }
  }

  const derived = parseStudentEmail(email, fallbackRoll);

  return {
    email: email,
    fullName: fullName,
    hoursSavedCategory: hoursSavedCategory,
    ai_familiarity_rating: rating,
    feedback: feedback,
    answers: answers,
    regNo: derived.regNo,
    deptCode: derived.deptCode,
    semester: derived.semester
  };
}

function detectParticipantType(sheetName) {
  let combined = String(sheetName || "").toLowerCase();
  try {
    const fileTitle = String(SpreadsheetApp.getActiveSpreadsheet().getName() || "").toLowerCase();
    combined += " " + fileTitle;
  } catch (e) {}

  if (combined.includes("teach") || combined.includes("faculty") || combined.includes("prof") || combined.includes("educator")) {
    return "teacher";
  }
  return CONFIG.PARTICIPANT_TYPE || "student";
}

function detectSurveyType(sheetName) {
  let combined = String(sheetName || "").toLowerCase();
  try {
    const fileTitle = String(SpreadsheetApp.getActiveSpreadsheet().getName() || "").toLowerCase();
    combined += " " + fileTitle;
  } catch (e) {}

  if (combined.includes("post")) return "post";
  if (combined.includes("pre")) return "pre";
  return CONFIG.DEFAULT_SURVEY_TYPE || "pre";
}

function sendToWebhook(payload) {
  try {
    const headers = {
      "Content-Type": "application/json"
    };
    if (CONFIG.WEBHOOK_SECRET) {
      headers["Authorization"] = "Bearer " + CONFIG.WEBHOOK_SECRET;
      headers["x-webhook-secret"] = CONFIG.WEBHOOK_SECRET;
    }

    const options = {
      method: "post",
      contentType: "application/json",
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, options);
    const code = response.getResponseCode();
    const text = response.getContentText();

    if (code >= 200 && code < 300) {
      return { success: true, data: JSON.parse(text) };
    } else {
      return { success: false, error: "HTTP " + code + ": " + text };
    }
  } catch (e) {
    return { success: false, error: e.message };
  }
}
