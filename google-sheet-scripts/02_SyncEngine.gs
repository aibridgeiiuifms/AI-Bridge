/**
 * ==============================================================================
 * THE AI BRIDGE - GOOGLE SHEETS SYNC ENGINE (v2.0 with Auto Email Parsing)
 * ==============================================================================
 * INSTRUCTIONS:
 * 1. Create a 2nd file in Google Apps Script named "SyncEngine" (or SyncEngine.gs).
 * 2. Copy and paste this entire file.
 * 3. Save and refresh your Google Sheet.
 * ==============================================================================
 */

// ----------------- WEB APP ENDPOINTS (for Google Web App deployment) -----------------

/**
 * Web App GET handler
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "The AI Bridge Google Apps Script Web App is active.",
    target_webhook: CONFIG.WEBHOOK_URL
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Web App POST handler (forwards any direct incoming HTTP POST to Vercel/Supabase)
 */
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

    // Populate derived columns in sheet for admin visibility
    populateDerivedColumns(sheet, row, headers, parsed);

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

    const res = sendToWebhook(payload);
    markSyncStatus(sheet, row, headers, res.success ? "✅ Insert Synced" : "❌ Error: " + res.error);
  } catch (err) {
    Logger.log("Error in onFormSubmit: " + err.message);
  }
}

/**
 * 2. TRIGGER: Fires whenever ANY cell in the Google Sheet is edited manually
 */
function onEdit(e) {
  try {
    const range = e.range;
    const sheet = range.getSheet();
    const row = range.getRow();

    // Ignore edits to the header row (row 1)
    if (row <= 1) return;

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowValues = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

    const parsed = parseRowData(headers, rowValues);
    if (!parsed.email) {
      Logger.log("onEdit: Skipped row " + row + " - no email specified.");
      return;
    }

    // Keep derived columns up to date
    populateDerivedColumns(sheet, row, headers, parsed);

    const editorEmail = Session.getActiveUser().getEmail() || "Google Sheet Editor";

    const payload = {
      action: "UPDATE",
      survey_type: detectSurveyType(sheet.getName()),
      email: parsed.email,
      sheet_row_number: row,
      performed_by: editorEmail,
      hours_saved_estimate: parsed.hoursSaved,
      comprehension_self_rating: parsed.rating,
      feedback_notes: parsed.feedback,
      answers: parsed.answers,
      extracted_reg_no: parsed.regNo,
      extracted_dept_code: parsed.deptCode,
      extracted_semester: parsed.semester
    };

    const res = sendToWebhook(payload);
    markSyncStatus(sheet, row, headers, res.success ? "✅ Edit Synced (" + formatTime(new Date()) + ")" : "❌ Update Failed");
  } catch (err) {
    Logger.log("Error in onEdit: " + err.message);
  }
}

// ----------------- CUSTOM MENU & MANUAL ACTIONS -----------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🤖 The AI Bridge')
    .addItem('🔄 Sync Entire Sheet to Supabase', 'syncAllRows')
    .addItem('🏷️ Extract & Fill Reg/Dept/Semester Columns', 'extractAndFillAllRows')
    .addItem('🗑️ Delete Selected Row in Supabase', 'deleteSelectedRow')
    .addItem('⚡ Test Webhook Connection', 'testConnection')
    .addToUi();
}

/**
 * Syncs all rows in the active sheet to Supabase in one batch
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

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  const rowsToSync = [];
  for (let i = 0; i < allData.length; i++) {
    const rowNum = i + 2;
    const parsed = parseRowData(headers, allData[i]);
    if (parsed.email) {
      populateDerivedColumns(sheet, rowNum, headers, parsed);
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
    ui.alert(`Sync Success: ${res.data.synced_count || rowsToSync.length} rows synced to Supabase with auto-extracted Reg No, Dept, and Semester!`);
  } else {
    ui.alert(`Sync Failed: ${res.error}`);
  }
}

/**
 * Fills the 3 derived columns across all rows without firing Supabase sync
 */
function extractAndFillAllRows() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow <= 1) {
    ui.alert("No data rows found.");
    return;
  }

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const allData = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  for (let i = 0; i < allData.length; i++) {
    const rowNum = i + 2;
    const parsed = parseRowData(headers, allData[i]);
    if (parsed.email) {
      populateDerivedColumns(sheet, rowNum, headers, parsed);
    }
  }

  ui.alert("Successfully filled Registration Number, Department Code, and Semester columns!");
}

/**
 * Deletes the currently selected row from Supabase and logs the action
 */
function deleteSelectedRow() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const row = sheet.getActiveRange().getRow();

  if (row <= 1) {
    ui.alert("Please select a data row (not the header row).");
    return;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowValues = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  const parsed = parseRowData(headers, rowValues);

  if (!parsed.email) {
    ui.alert("Selected row does not contain a valid email address.");
    return;
  }

  const response = ui.alert(
    'Confirm Survey Deletion',
    `Are you sure you want to remove the survey for:\n${parsed.email}\nThis will reset their certification progression in the web portal.`,
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  const editorEmail = Session.getActiveUser().getEmail() || "Sheet Editor";
  const payload = {
    action: "DELETE",
    survey_type: detectSurveyType(sheet.getName()),
    email: parsed.email,
    sheet_row_number: row,
    performed_by: editorEmail
  };

  const res = sendToWebhook(payload);
  if (res.success) {
    markSyncStatus(sheet, row, headers, "🗑️ Deleted from Supabase");
    ui.alert(`Survey for ${parsed.email} was removed from Supabase and logged in audit trail.`);
  } else {
    ui.alert(`Delete failed: ${res.error}`);
  }
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

// ----------------- HELPER UTILITIES -----------------

/**
 * Email Parser: Derives Reg No, Dept Code, and Semester
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

  // Fallback search
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

  // Parse email into 3 derived components
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

/**
 * Ensures Derived Registration No, Department Code, and Semester columns exist in sheet and are filled
 */
function populateDerivedColumns(sheet, row, headers, parsed) {
  try {
    let regCol = headers.findIndex(h => String(h).trim().toLowerCase() === "derived reg no") + 1;
    let deptCol = headers.findIndex(h => String(h).trim().toLowerCase() === "derived dept code") + 1;
    let semCol = headers.findIndex(h => String(h).trim().toLowerCase() === "derived semester") + 1;

    let curLastCol = sheet.getLastColumn();

    if (regCol === 0) {
      regCol = curLastCol + 1;
      sheet.getRange(1, regCol).setValue("Derived Reg No");
      curLastCol++;
    }
    if (deptCol === 0) {
      deptCol = curLastCol + 1;
      sheet.getRange(1, deptCol).setValue("Derived Dept Code");
      curLastCol++;
    }
    if (semCol === 0) {
      semCol = curLastCol + 1;
      sheet.getRange(1, semCol).setValue("Derived Semester");
      curLastCol++;
    }

    if (parsed.regNo) sheet.getRange(row, regCol).setValue(parsed.regNo);
    if (parsed.deptCode) sheet.getRange(row, deptCol).setValue(parsed.deptCode);
    if (parsed.semester) sheet.getRange(row, semCol).setValue(parsed.semester);
  } catch (err) {
    Logger.log("populateDerivedColumns error: " + err.message);
  }
}

function detectSurveyType(sheetName) {
  const name = String(sheetName).toLowerCase();
  if (name.includes("post")) return "post";
  if (name.includes("pre")) return "pre";
  return CONFIG.DEFAULT_SURVEY_TYPE;
}

function markSyncStatus(sheet, row, headers, statusText) {
  let statusCol = headers.findIndex(h => String(h).toLowerCase() === "sync status") + 1;
  if (statusCol === 0) {
    statusCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, statusCol).setValue("Sync Status");
  }
  sheet.getRange(row, statusCol).setValue(statusText);
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

function formatTime(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone() || "GMT+5", "HH:mm:ss");
}
