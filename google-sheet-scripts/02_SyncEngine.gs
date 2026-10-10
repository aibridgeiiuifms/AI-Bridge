/**
 * ==============================================================================
 * THE AI BRIDGE - GOOGLE SHEETS SYNC ENGINE
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
    const payload = {
      action: contents.action || "INSERT",
      survey_type: contents.survey_type || CONFIG.DEFAULT_SURVEY_TYPE,
      email: email,
      hours_saved_estimate: contents.hours_saved_estimate || contents.hoursSaved || 0,
      comprehension_self_rating: contents.comprehension_self_rating || contents.rating || 3,
      feedback_notes: contents.feedback_notes || contents.feedback || '',
      answers: contents.answers || contents
    };

    const res = sendToWebhook(payload);
    return ContentService.createTextOutput(JSON.stringify({
      success: res.success,
      message: res.success ? "Payload forwarded to Vercel and recorded in Supabase audit log." : res.error
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

    const payload = {
      action: "INSERT",
      survey_type: detectSurveyType(sheet.getName()),
      email: parsed.email,
      sheet_row_number: row,
      performed_by: parsed.email,
      hours_saved_estimate: parsed.hoursSaved,
      comprehension_self_rating: parsed.rating,
      feedback_notes: parsed.feedback,
      answers: parsed.answers
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
      answers: parsed.answers
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
      rowsToSync.push({
        email: parsed.email,
        survey_type: detectSurveyType(sheet.getName()),
        sheet_row_number: rowNum,
        hours_saved_estimate: parsed.hoursSaved,
        comprehension_self_rating: parsed.rating,
        feedback_notes: parsed.feedback,
        answers: parsed.answers
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
    ui.alert(`Sync Success: ${res.data.synced_count || rowsToSync.length} rows synced to Supabase with audit history!`);
  } else {
    ui.alert(`Sync Failed: ${res.error}`);
  }
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

function parseRowData(headers, rowValues) {
  let email = "";
  let hoursSaved = 0;
  let rating = 3;
  let feedback = "";
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

  return { email, hoursSaved, rating, feedback, answers };
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
    statusCol = headers.length + 1;
    sheet.getRange(1, statusCol).setValue("Sync Status");
  }
  sheet.getRange(row, statusCol).setValue(statusText);
}

function formatTime(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone() || "GMT+5", "HH:mm:ss");
}
