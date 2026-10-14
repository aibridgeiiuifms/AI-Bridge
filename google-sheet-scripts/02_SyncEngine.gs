/**
 * ==============================================================================
 * THE AI BRIDGE - GOOGLE SHEETS SYNC ENGINE (v3.0 - Option 1: Pure Cloud Sync)
 * ==============================================================================
 * ARCHITECTURE (Option 1):
 * - Leaves Google Sheets 100% UNTOUCHED (Zero new columns, zero layout modification).
 * - All Registration Numbers, Department Codes, and Semesters are extracted
 *   in-memory and sent directly to Supabase and your Web Dashboard.
 * - Blazing fast, bug-proof, and requires zero spreadsheet maintenance.
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
      survey_type: contents.survey_type || CONFIG.DEFAULT_SURVEY_TYPE,
      email: email,
      hours_saved_estimate: contents.hours_saved_estimate || contents.hoursSaved || 0,
      comprehension_self_rating: contents.comprehension_self_rating || contents.rating || 3,
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
 * 1. TRIGGER: Fires whenever a respondent submits a Google Form
 * Pure Cloud Mode: Reads row in memory, extracts fields, sends to Supabase.
 * Does NOT modify or add any columns in the Google Sheet.
 */
function onFormSubmit(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = e.range ? e.range.getRow() : sheet.getLastRow();
    const rowValues = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

    const parsed = parseRowData(headers, rowValues);
    if (!parsed.email) {
      Logger.log("onFormSubmit: No valid email address found in row " + row);
      return;
    }

    const payload = {
      action: "INSERT",
      survey_type: detectSurveyType(sheet.getName()),
      email: parsed.email,
      sheet_row_number: row,
      performed_by: parsed.email,
      hours_saved_estimate: parsed.hoursSaved,
      comprehension_self_rating: parsed.rating,
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
    .addItem('🧹 Clean Excess Duplicate Columns (One-Click)', 'cleanDuplicateColumns')
    .addItem('⚡ Test Webhook Connection', 'testConnection')
    .addToUi();
}

/**
 * Syncs all rows in the active sheet to Supabase in one fast batch.
 * Entirely in-memory: Does NOT modify the Google Sheet layout or cells.
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

  // Load all headers and row values into memory once
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const rowsToSync = [];
  for (let i = 0; i < allData.length; i++) {
    const rowNum = i + 2;
    const parsed = parseRowData(headers, allData[i]);
    if (parsed.email) {
      rowsToSync.push({
        email: parsed.email,
        survey_type: detectSurveyType(sheet.getName()),
        sheet_row_number: rowNum,
        hours_saved_estimate: parsed.hoursSaved,
        comprehension_self_rating: parsed.rating,
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
    survey_type: detectSurveyType(sheet.getName()),
    rows: rowsToSync
  };

  const res = sendToWebhook(payload);
  if (res.success) {
    ui.alert(`✅ Sync Complete!\n\nSuccessfully synced ${res.data.synced_count || rowsToSync.length} rows to Supabase.\n\nAll Registration Numbers, Department Codes, and Semesters were extracted and saved into Supabase without modifying your spreadsheet.`);
  } else {
    ui.alert(`❌ Sync Failed: ${res.error}`);
  }
}

/**
 * ONE-CLICK CLEANUP TOOL:
 * Removes any duplicate 'Derived...' or 'Sync Status' columns created previously.
 */
function cleanDuplicateColumns() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastCol = sheet.getLastColumn();

  if (lastCol <= 1) return;

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let deletedCount = 0;

  // Scan from right to left so indices don't shift when deleting
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

// ----------------- IN-MEMORY EMAIL PARSER UTILITIES -----------------

/**
 * Pure in-memory email parser: Extracts Reg No, Dept Code, and Semester.
 * - Type 1: Modern Format [Reg][Dept][Semester] -> e.g. 025580bsirf26
 * - Type 2: Older Senior Format [Name].[Dept][Reg] -> e.g. zain.bsba126
 * - Fallback: Scans messy roll number for season+year if Type 2
 */
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
  let hoursSaved = 0;
  let rating = 3;
  let feedback = "";
  let fallbackRoll = "";
  const answers = {};

  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i]).trim().toLowerCase();
    const val = rowValues[i];

    answers[headers[i]] = val;

    // Detect Email
    if (header.includes("email") || header.includes("student id") || header.includes("respondent")) {
      if (String(val).includes("@")) {
        email = String(val).trim().toLowerCase();
      }
    }

    // Detect Fallback Roll Number
    if (header.includes("roll") || header.includes("registration") || header.includes("reg no")) {
      fallbackRoll = String(val || "");
    }

    // Detect Hours Saved
    if (header.includes("hour") || header.includes("time save") || header.includes("weekly")) {
      const parsedNum = parseFloat(String(val).replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedNum)) hoursSaved = parsedNum;
    }

    // Detect Rating
    if (header.includes("rating") || header.includes("comprehension") || header.includes("literacy") || header.includes("scale")) {
      const parsedInt = parseInt(String(val).replace(/[^0-9]/g, ''));
      if (!isNaN(parsedInt)) rating = parsedInt;
    }

    // Detect Feedback
    if (header.includes("feedback") || header.includes("note") || header.includes("comment") || header.includes("suggestion")) {
      feedback = String(val);
    }
  }

  // Parse email into 3 derived components entirely in memory
  const derived = parseStudentEmail(email, fallbackRoll);

  return {
    email: email,
    hoursSaved: hoursSaved,
    rating: rating,
    feedback: feedback,
    answers: answers,
    regNo: derived.regNo,
    deptCode: derived.deptCode,
    semester: derived.semester
  };
}

function detectSurveyType(sheetName) {
  const name = String(sheetName).toLowerCase();
  if (name.includes("post")) return "post";
  if (name.includes("pre")) return "pre";
  return CONFIG.DEFAULT_SURVEY_TYPE;
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
