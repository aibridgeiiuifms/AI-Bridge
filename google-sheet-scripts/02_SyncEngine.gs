/**
 * ==============================================================================
 * THE AI BRIDGE - GOOGLE SHEETS SYNC ENGINE (v4 - Stable Timestamp Keys)
 * ==============================================================================
 * WHAT CHANGED IN v4
 *  - Email priority is now resolved BY COLUMN NAME, in this exact order:
 *        Student : Student Email Address -> Email Address (non-iiui) -> Email address
 *        Teacher : Institutional Email Address -> Email Address (non-iiui) -> Email Address
 *  - The old bug that let an @iiu.edu.pk Google-login email hijack the official
 *    "Student Email Address" is removed.
 *  - Every row now carries its Google Form `Timestamp`, which never changes when a
 *    respondent edits their response. The backend uses it as a stable match key, so
 *    editing an email UPDATES the same Supabase row instead of creating a duplicate.
 *  - NEW: an installable `onEdit` trigger pushes the edited row to Supabase instantly.
 *  - Still pure cloud sync: the spreadsheet layout is never modified.
 * ==============================================================================
 */

// ----------------- CONFIGURATION: EMAIL COLUMN PRIORITY -----------------

/**
 * Priority lists are matched against the header text (trimmed, spaces collapsed,
 * lower-cased). The first column in the list that contains a valid email wins.
 */
const EMAIL_PRIORITY = {
  student: ["student email address", "email address (non-iiui)", "email address"],
  teacher: [
    "institutional email address",
    "email address (non-iiui)",
    "email address",
  ],
};

// The auto-collected Google-login column (uneditable by the respondent).
// Only the student sheets have one; educator sheets do not.
const LOGIN_EMAIL_HEADER = {
  student: "email address",
  teacher: "",
};

// ----------------- WEB APP ENDPOINTS (Optional Deployment) -----------------

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "online",
      message: "The AI Bridge Google Apps Script Web App is active.",
      target_webhook: CONFIG.WEBHOOK_URL,
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    let contents = {};
    if (e && e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      contents = e.parameter;
    }

    const email = contents.email || contents["Email Address"] || "";
    const parsedEmailData = parseStudentEmail(
      email,
      contents.roll_no || contents.roll || "",
    );

    const payload = {
      action: contents.action || "INSERT",
      participant_type:
        contents.participant_type || CONFIG.PARTICIPANT_TYPE || "student",
      survey_type: contents.survey_type || CONFIG.DEFAULT_SURVEY_TYPE,
      email: email,
      full_name: contents.full_name || contents.name || "",
      hours_saved_category:
        contents.hours_saved_category || contents.hoursSavedCategory || "",
      feedback_notes: contents.feedback_notes || contents.feedback || "",
      answers: contents.answers || contents,
      extracted_reg_no: parsedEmailData.regNo,
      extracted_dept_code: parsedEmailData.deptCode,
      extracted_semester: parsedEmailData.semester,
    };

    const res = sendToWebhook(payload);
    return ContentService.createTextOutput(
      JSON.stringify({
        success: res.success,
        message: res.success
          ? "Payload forwarded to Vercel and recorded in Supabase."
          : res.error,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: err.message,
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ----------------- AUTOMATIC EVENT TRIGGERS -----------------

/**
 * TRIGGER (onFormSubmit): Fires whenever a respondent submits a NEW Google Form response.
 */
function onFormSubmit(e) {
  try {
    const sheet =
      e && e.range
        ? e.range.getSheet()
        : SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const lastCol = sheet.getLastColumn();
    if (lastCol < 1) return;

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const row = e && e.range ? e.range.getRow() : sheet.getLastRow();
    const rowValues = sheet.getRange(row, 1, 1, lastCol).getValues()[0];

    const participantType = detectParticipantType(sheet.getName());
    const parsed = parseRowData(headers, rowValues, participantType);
    if (!parsed.email) {
      Logger.log("onFormSubmit: No valid email address found in row " + row);
      return;
    }

    sendToWebhook(
      buildPayload("INSERT", participantType, sheet.getName(), row, parsed),
    );
  } catch (err) {
    Logger.log("Error in onFormSubmit: " + err.message);
  }
}

/**
 * TRIGGER (onEdit - installable): Fires on ANY cell edit inside the response sheet.
 * It re-reads the whole edited row and pushes it to Supabase, so an edit to an email,
 * a name or any answer updates the SAME Supabase row (matched by the Form Timestamp).
 *
 * Installed by `setupAutomaticTrigger()` under the name `syncEditedRow` so the
 * restricted simple-trigger `onEdit` never runs and UrlFetchApp always has network
 * permission.
 */
function syncEditedRow(e) {
  try {
    if (!e || !e.range) return;

    const sheet = e.range.getSheet();
    const lastCol = sheet.getLastColumn();
    if (lastCol < 1) return;

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const participantType = detectParticipantType(sheet.getName());

    const startRow = e.range.getRow();
    const numRows = e.range.getNumRows();

    for (let row = startRow; row < startRow + numRows; row++) {
      if (row <= 1) continue; // never sync the header row

      const rowValues = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
      const parsed = parseRowData(headers, rowValues, participantType);
      if (!parsed.email) continue;

      sendToWebhook(
        buildPayload("UPDATE", participantType, sheet.getName(), row, parsed),
      );
    }
  } catch (err) {
    Logger.log("Error in syncEditedRow: " + err.message);
  }
}

/**
 * Builds the JSON payload sent to the Vercel webhook.
 */
function buildPayload(action, participantType, sheetName, row, parsed) {
  return {
    action: action,
    participant_type: participantType,
    sheet_name: sheetName,
    survey_type: detectSurveyType(sheetName),
    email: parsed.email,
    student_email: parsed.student_email,
    personal_email: parsed.personal_email,
    login_email: parsed.loginEmail,
    sheet_timestamp: parsed.sheetTimestamp,
    full_name: parsed.fullName,
    sheet_row_number: row,
    performed_by: parsed.email,
    hours_saved_category: parsed.hoursSavedCategory,
    ai_familiarity_rating: parsed.ai_familiarity_rating,
    feedback_notes: parsed.feedback,
    answers: parsed.answers,
    extracted_reg_no: parsed.regNo,
    extracted_dept_code: parsed.deptCode,
    extracted_semester: parsed.semester,
  };
}

// ----------------- CUSTOM MENU & BULK ACTIONS -----------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🤖 The AI Bridge")
    .addItem(
      "⚡ Setup Automatic Sync Triggers (One-Click)",
      "setupAutomaticTrigger",
    )
    .addItem(
      "🔄 Sync Entire Sheet to Supabase",
      "syncAllRows",
    )
    .addItem(
      "🧹 Clean Excess Duplicate Columns (One-Click)",
      "cleanDuplicateColumns",
    )
    .addItem("🔌 Test Webhook Connection", "testConnection")
    .addToUi();
}

/**
 * ONE-CLICK TRIGGER SETUP:
 * Registers two installable triggers with full network permissions (UrlFetchApp):
 *   1. onFormSubmit  -> new form responses
 *   2. syncEditedRow -> any edit made to an existing row (onEdit)
 */
function setupAutomaticTrigger() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet();

  // Remove any conflicting old triggers for our handlers
  const handlers = ["onFormSubmit", "syncEditedRow", "onEdit"];
  const existingTriggers = ScriptApp.getProjectTriggers();
  let deletedCount = 0;
  for (let i = 0; i < existingTriggers.length; i++) {
    if (handlers.indexOf(existingTriggers[i].getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(existingTriggers[i]);
      deletedCount++;
    }
  }

  // 1. New form responses
  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(sheet)
    .onFormSubmit()
    .create();

  // 2. Any edit to an existing row
  ScriptApp.newTrigger("syncEditedRow")
    .forSpreadsheet(sheet)
    .onEdit()
    .create();

  ui.alert(
    "⚡ Automatic Sync Active!\n\n" +
      "• New form responses sync automatically.\n" +
      "• Any edit to an existing row now updates Supabase instantly " +
      "(matched by the Form Timestamp, so no duplicate rows).\n\n" +
      "(Replaced " +
      deletedCount +
      " older triggers)",
  );
}

/**
 * Syncs all rows in the active sheet to Supabase in one fast batch.
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
    const parsed = parseRowData(headers, allData[i], participantType);
    if (parsed.email) {
      rowsToSync.push({
        email: parsed.email,
        student_email: parsed.student_email,
        personal_email: parsed.personal_email,
        login_email: parsed.loginEmail,
        sheet_timestamp: parsed.sheetTimestamp,
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
        extracted_semester: parsed.semester,
      });
    }
  }

  const payload = {
    action: "SYNC_ALL",
    participant_type: participantType,
    survey_type: surveyType,
    rows: rowsToSync,
  };

  const res = sendToWebhook(payload);
  if (res.success) {
    ui.alert(
      `✅ Sync Complete!\n\nSuccessfully synced ${res.data.synced_count || rowsToSync.length} rows to Supabase.\n\nTarget Table: ${participantType === "teacher" ? "teacher_surveys" : "student_surveys"}\nRows are matched by their Form Timestamp, so re-syncing never creates duplicates.`,
    );
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
    const colName = String(headers[c] || "")
      .trim()
      .toLowerCase();
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

  ui.alert(
    `🧹 Cleaned up ${deletedCount} extra columns!\nYour sheet is now back to its clean, original form.`,
  );
}

/**
 * Health check test
 */
function testConnection() {
  const ui = SpreadsheetApp.getUi();
  try {
    const res = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, {
      method: "get",
      muteHttpExceptions: true,
    });
    ui.alert(
      "Webhook Connection Status: " +
        res.getResponseCode() +
        "\nResponse: " +
        res.getContentText(),
    );
  } catch (err) {
    ui.alert("Connection Failed: " + err.message);
  }
}

// ----------------- IN-MEMORY PARSER UTILITIES -----------------

function normalizeHeader(rawHeader) {
  return String(rawHeader || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function cleanEmailValue(val) {
  const clean = String(val == null ? "" : val)
    .replace(/\s+/g, "")
    .toLowerCase();
  return clean.indexOf("@") !== -1 ? clean : "";
}

/**
 * Google Sheets returns a real Date object for the Timestamp cell.
 * JSON.stringify() serialises a Date to its ISO string, so we mirror that here to
 * keep the stable match key identical between old and new rows.
 */
function normalizeTimestamp(val) {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString();
  return String(val).trim();
}

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
      semester: matchStd[3].toUpperCase(),
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
      semester: semester || "UNKNOWN",
    };
  }

  // General Fallback search
  const matchSearch = clean.match(/(\d{4,6})[/\-_]?([a-z]+?)([fs]\d{2})/);
  if (matchSearch) {
    return {
      regNo: matchSearch[1],
      deptCode: matchSearch[2].toUpperCase(),
      semester: matchSearch[3].toUpperCase(),
    };
  }

  return { regNo: "", deptCode: "", semester: "" };
}

/**
 * Reads one sheet row into a clean structure.
 *
 * EMAIL RESOLUTION (by column name, first match wins):
 *   student -> "Student Email Address" -> "Email Address (non-iiui)" -> "Email address"
 *   teacher -> "Institutional Email Address" -> "Email Address (non-iiui)" -> "Email Address"
 *
 * @param {Array} headers Raw header row.
 * @param {Array} rowValues Raw row values (from getValues()).
 * @param {string} participantType 'student' or 'teacher'.
 */
function parseRowData(headers, rowValues, participantType) {
  const answers = {};
  const byHeader = {}; // normalized header -> cleaned email
  let timestampHeader = "";
  let sheetTimestamp = "";

  let fullName = "";
  let hoursSavedCategory = "";
  let rating = null;
  let feedback = "";
  let fallbackRoll = "";

  for (let i = 0; i < headers.length; i++) {
    const rawHeader = headers[i];
    const header = normalizeHeader(rawHeader);
    const val = rowValues[i];

    answers[rawHeader] = val;

    // Capture the Google Form Timestamp (stable row identity)
    if (header === "timestamp" && !sheetTimestamp) {
      timestampHeader = rawHeader;
      sheetTimestamp = normalizeTimestamp(val);
    }

    const cleanVal = cleanEmailValue(val);
    if (cleanVal) byHeader[header] = cleanVal;

    // Detect Name
    if (
      header.includes("student name") ||
      header.includes("teacher name") ||
      header.includes("full name") ||
      header === "name"
    ) {
      const nameVal = String(val || "").trim();
      if (nameVal) fullName = nameVal;
    }

    // Detect Fallback Roll Number
    if (
      header.includes("roll") ||
      header.includes("registration") ||
      header.includes("reg no")
    ) {
      fallbackRoll = String(val || "");
    }

    // Detect Hours Saved Category (Keep original clean text, no midpoint math!)
    if (
      header.includes("hour") ||
      header.includes("time save") ||
      header.includes("weekly")
    ) {
      hoursSavedCategory = String(val || "").trim();
    }

    // Detect Rating (1-5 scale)
    if (
      header.includes("familiar") ||
      header.includes("rating") ||
      header.includes("scale") ||
      header.includes("comfort")
    ) {
      const num = parseInt(String(val).replace(/[^0-9]/g, ""));
      if (!isNaN(num) && num >= 1 && num <= 5) {
        rating = num;
      }
    }

    // Detect Feedback
    if (
      header.includes("feedback") ||
      header.includes("note") ||
      header.includes("comment") ||
      header.includes("suggestion")
    ) {
      feedback = String(val || "").trim();
    }
  }

  // Keep answers['Timestamp'] identical to the value used for the stable match key
  if (timestampHeader && sheetTimestamp) {
    answers[timestampHeader] = sheetTimestamp;
  }

  // Resolve the email strictly by column-name priority
  const priority =
    EMAIL_PRIORITY[participantType] || EMAIL_PRIORITY.student;
  let email = "";
  for (let p = 0; p < priority.length; p++) {
    const candidate = byHeader[priority[p]];
    if (candidate && !email) email = candidate;
  }

  const officialEmail =
    byHeader["student email address"] ||
    byHeader["institutional email address"] ||
    "";
  const personalEmail =
    byHeader["email address (non-iiui)"] || byHeader["email address"] || "";
  const loginHeader = LOGIN_EMAIL_HEADER[participantType] || "";
  const loginEmail = loginHeader ? byHeader[loginHeader] || "" : "";

  const derived = parseStudentEmail(officialEmail || email, fallbackRoll);

  return {
    email: email,
    student_email: officialEmail,
    personal_email: personalEmail,
    loginEmail: loginEmail,
    sheetTimestamp: sheetTimestamp,
    fullName: fullName,
    hoursSavedCategory: hoursSavedCategory,
    ai_familiarity_rating: rating,
    feedback: feedback,
    answers: answers,
    regNo: derived.regNo,
    deptCode: derived.deptCode,
    semester: derived.semester,
  };
}

function detectParticipantType(sheetName) {
  let combined = String(sheetName || "").toLowerCase();
  try {
    const fileTitle = String(
      SpreadsheetApp.getActiveSpreadsheet().getName() || "",
    ).toLowerCase();
    combined += " " + fileTitle;
  } catch (e) {}

  if (
    combined.includes("teach") ||
    combined.includes("faculty") ||
    combined.includes("prof") ||
    combined.includes("educator")
  ) {
    return "teacher";
  }
  return CONFIG.PARTICIPANT_TYPE || "student";
}

function detectSurveyType(sheetName) {
  let combined = String(sheetName || "").toLowerCase();
  try {
    const fileTitle = String(
      SpreadsheetApp.getActiveSpreadsheet().getName() || "",
    ).toLowerCase();
    combined += " " + fileTitle;
  } catch (e) {}

  if (combined.includes("post")) return "post";
  if (combined.includes("pre")) return "pre";
  return CONFIG.DEFAULT_SURVEY_TYPE || "pre";
}

function sendToWebhook(payload) {
  try {
    const headers = {
      "Content-Type": "application/json",
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
      muteHttpExceptions: true,
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
