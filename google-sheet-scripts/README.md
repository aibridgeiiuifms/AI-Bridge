# Google Sheets Sync Scripts

This folder contains the Google Apps Script files split into two easy files for deployment in Google Sheets:

### Files:
1. **[`01_Config.gs`](file:///d:/000627-BSBA-S24/Other%20Material/web%20development/AI-Bridge/google-sheet-scripts/01_Config.gs):** Contains only the configuration settings (Webhook URL, Secret Token, Survey Type). Update your links and keys here.
2. **[`02_SyncEngine.gs`](file:///d:/000627-BSBA-S24/Other%20Material/web%20development/AI-Bridge/google-sheet-scripts/02_SyncEngine.gs):** Contains all the automatic trigger handlers, custom menu, and synchronization engine.

---

### Setup Instructions (30 seconds):
1. Open your Google Sheet → **Extensions → Apps Script**.
2. Create File 1 named `Config`: paste `01_Config.gs`.
3. Create File 2 named `SyncEngine`: paste `02_SyncEngine.gs`.
4. Update `WEBHOOK_URL` in `Config.gs` with your website domain.
5. Save (Ctrl + S) and refresh your Google Sheet!
