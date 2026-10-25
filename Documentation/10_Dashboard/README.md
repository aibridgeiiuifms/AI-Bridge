# 10_Dashboard Documentation: Survey Impact & Descriptive Analytics

This directory contains the complete technical and management documentation for the **Survey Impact & Descriptive Analytics Dashboard** of The AI Bridge web application.

---

## Documents in this Directory

| Document | Purpose | Target Audience |
| :--- | :--- | :--- |
| **[`SURVEY_IMPACT_DASHBOARD.md`](./SURVEY_IMPACT_DASHBOARD.md)** | Master specification covering the live Supabase data pipeline, Google Form questions mapping, QIP metrics (hours saved), department matrix, **database permissions (`Sql-Updated-Code.sql`)**, **Report QR Code generator**, **Admin-managed Reviewer Password**, **Chart-by-Chart Visibility Matrix**, and **Individual Chart Download (PNG/CSV/SVG)**. | Middle & Upper Management, Lead Admin, External Evaluators, Deans |

---

## Verified Live Supabase Data

- **Total Student Surveys:** **1,763+** (1,000 Pre / 763 Post)
- **Total Faculty Surveys:** **164+** (87 Pre / 77 Post)
- **Total Official Certificates Issued:** **704**
- **Hours Saved Target (3-5+ Hours/Week):**
  - **73.0% of Students** saved 3 or more hours weekly (`3 to 5 hours`: 456, `6 to 8 hours`: 62, `9+ hours`: 39).
  - **70.1% of Teachers** saved 3 or more hours weekly (`3 to 5 hours`: 44, `6 to 8 hours`: 7, `9+ hours`: 3).
- **Long-Term Adoption:** **91.1% of students** confirmed they will continue using NotebookLM in future semesters.
- **Institutional Distribution:**
  - **82.4% IIUI Students** (626) vs. **17.6% Non-IIUI Students** (134) across external universities.
  - **69.7% IIUI Faculty** (53) vs. **30.3% Non-IIUI Faculty** (23).

---

## Finalized Governance & Security Architecture (v2.2)

1. **Individual Chart Download / Export (PNG, CSV, SVG)**:
   - Any person viewing a chart can download that individual chart directly.
   - **PNG Image:** High-res image branded with the official IIUI FMS / The AI Bridge watermark and date, ready to paste into presentation slides, Word reports, or dossiers.
   - **CSV Dataset:** Downloads raw numerical breakdown (categories, counts, percentages) for independent Excel verification.
   - **Mobile-Ready:** One-tap save on mobile phones saves the image directly to the gallery or downloads the dataset.
2. **Admin-Managed Reviewer Password**:
   - External reviewers scanning the QR code on the evaluation report enter a secure password to unlock live data.
   - The Admin can update or rotate this password anytime from the Admin Panel (stored securely in `public.system_settings`).
3. **Chart-by-Chart Visibility Matrix**:
   - Admin manages visibility for each chart/card independently:
     * `Team Member Visible`: Toggle whether team ambassadors can see the chart.
     * `External Reviewer Visible`: Toggle whether QR code evaluators can see the chart.
   - Admins can also change either setting directly from each chart in the Survey Impact dashboard; the Report QR & Reviewer Access matrix remains available as a central settings view.
4. **Dedicated Admin Tab ("Report QR & Reviewer Access")**:
   - Live rendered QR code preview linked to `/dashboard/survey-analytics?ref=report_qr`.
   - 1-click Download PNG and SVG for embedding directly into printable PDF / Word reports.
   - Direct password update and rotation controls.
5. **Team Member Automatic Bypass**:
   - Authenticated team members and admins access the dashboard directly without needing the reviewer password.
6. **PII Protection**:
   - External reviewers see all aggregated charts, percentages, and metrics, but student emails and phone numbers are automatically redacted.
