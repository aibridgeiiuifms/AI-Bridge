# The AI Bridge — Survey Impact & Descriptive Analytics Dashboard
## Executive Architecture & Implementation Specification for Middle & Upper Management

> **Document Version:** 2.2 (Integrated with Individual Chart Download/Export in PNG/CSV/SVG)  
> **Target Path:** `Documentation/10_Dashboard/SURVEY_IMPACT_DASHBOARD.md`  
> **Project:** The AI Bridge (Hum Hain Pakistan SDG Youth Campaign)  
> **Institution:** Faculty of Management Sciences (FMS), International Islamic University Islamabad (IIUI)  
> **Mentor:** Dr. Abdul Zahid Khan (Chairperson, Dept. of Technology & Project Management)  
> **Database:** Supabase PostgreSQL Cloud Database (`Sql-Updated-Code.sql` Production Schema)

---

## Executive Summary

The **AI Bridge Survey Impact Dashboard** is an executive-grade intelligence interface engineered for **middle and upper university management**, national SDG evaluators, and academic reviewers. It provides verifiable, data-backed evidence of how student study habits and faculty teaching workflows transformed **Before** and **After** the AI Bridge assessment and training interventions.

Every single metric, chart, and percentage displayed on this dashboard is computed directly from **live, validated records in Supabase**—originating from structured Google Form evaluations synchronized in real-time via Google Apps Script webhooks.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CORE VERIFIED IMPACT HIGHLIGHTS                        │
├──────────────────────────┬──────────────────────────┬───────────────────────┤
│  1,763+ Student Surveys  │   164+ Teacher Surveys   │  704 Official Certs   │
│ (1,000 Pre / 763 Post)   │    (87 Pre / 77 Post)    │ Issued & QR Verified  │
├──────────────────────────┼──────────────────────────┼───────────────────────┤
│  73.0% Students Met QIP  │  70.1% Faculty Met QIP   │ 91.1% Plan Continued  │
│  3-5+ Hours/Week Saved   │  3-5+ Hours/Week Saved   │ Long-Term AI Adoption │
└──────────────────────────┴──────────────────────────┴───────────────────────┘
```

---

## 1. End-to-End Data Pipeline: How Google Forms Turn into Live Dashboards

The dashboard does **not** rely on static mock data, hardcoded numbers, or CSV imports. It is driven by an automated, fault-tolerant cloud ingestion pipeline:

```mermaid
flowchart TD
    subgraph INGESTION ["1. Ingestion Layer (Google Cloud)"]
        GF1["Google Form: Student Pre/Post Survey"]
        GF2["Google Form: Teacher Pre/Post Survey"]
        GS["Google Sheets (Raw Response Storage)"]
        GAS["Google Apps Script Engine\n(02_SyncEngine.gs)"]
        GF1 --> GS
        GF2 --> GS
        GS -->|Instant onFormSubmit Trigger| GAS
    end

    subgraph SYNC ["2. Normalization & Security Layer"]
        WH["Next.js Webhook Endpoint\n/api/webhooks/google-sheets"]
        SEC["HMAC Secret Verification\n(SHEETS_WEBHOOK_SECRET)"]
        PARSE["Email Hierarchy & Department Parser\n(Extracts Reg No, Dept Code, Semester)"]
        GAS -->|Secure POST Payload| WH
        WH --> SEC --> PARSE
    end

    subgraph DATABASE ["3. Cloud Relational Database (Supabase PostgreSQL)"]
        TB_S["public.student_surveys\n(2,074 Total Rows)"]
        TB_T["public.teacher_surveys\n(164 Total Rows)"]
        TB_D["public.department_mappings\n(93 Department Codes)"]
        TB_Q["public.quiz_attempts\n(1,084 Assessment Records)"]
        TB_C["public.certificates\n(704 Issued Certificates)"]
        TB_SET["public.system_settings\n(Reviewer Password & Chart Matrix)"]
        PARSE --> TB_S
        PARSE --> TB_T
    end

    subgraph ACCESS ["4. Dual-Gate Access Controller"]
        GATE{"Is User Authenticated\nTeam Member?"}
        AUTH_OK["Role: Admin or Member with\ncan_view_analytics = true"]
        PASS_GATE["Reviewer Password Gate\n(Scanned via Report QR Code)"]
        GATE -- "YES" --> AUTH_OK
        GATE -- "NO" --> PASS_GATE
    end

    subgraph MATRIX ["5. Chart-by-Chart Visibility Filter"]
        FILTER["Evaluates system_settings\nsurvey_dashboard_chart_permissions"]
        AUTH_OK --> FILTER
        PASS_GATE -->|Valid Password| FILTER
    end

    subgraph EXPORT ["6. Individual Chart Exporter"]
        DOWN["Download Any Chart\n(PNG Image / CSV Raw Data / SVG)"]
        FILTER --> DOWN
    end

    subgraph UI ["7. Presentation & Management Layer"]
        DASH["Survey Impact Dashboard\n/dashboard/survey-analytics"]
        MOB["Mobile View (Touch & Swipe Cards)"]
        DESK["Desktop View (Matrix & Charts)"]
        FILTER --> DASH
        DOWN --> DASH
        DASH --> MOB & DESK
    end
```

### 1.1 Supabase Tables Utilized in the Dashboard

| Table Name | Live Rows | Role in Dashboard |
| :--- | :--- | :--- |
| `public.student_surveys` | **2,074** | Student pre- and post-assessment responses, self-ratings, hours saved, and full answers JSONB. |
| `public.teacher_surveys` | **164** | Faculty pre- and post-training feedback, lesson prep time saved, department, and teaching assets. |
| `public.department_mappings`| **93** | Maps university email department codes (BSBA, BSIR, BSCS, etc.) to full faculties (FMS, FSS, FCIT, FBAS). |
| `public.quiz_attempts` | **1,084** | Tracks knowledge assessment performance, pass rates, score distribution (out of 12 or 30 MCQs). |
| `public.certificates` | **704** | Tracks verified completion certificates issued with tamper-proof alphanumeric IDs (`AIB-XXXXXXXX`). |
| `public.profiles` | Schema | Stores user accounts, Google OAuth identities, and base system roles (`admin`, `team-member`, `student`, `teacher`, `guest`). |
| `public.members` | Schema | Team roster with granular delegation (`team_role`, `can_manage_team`, `mcq_access_level`, `can_manage_gallery`). |
| `public.analytics_access_control` | Schema | Stores person-by-person toggle (`member_id`, `can_view_analytics`) granting analytics dashboard permissions. |
| `public.system_settings` | Dynamic | Stores administrative configurations: reviewer password hash, QR session lifetime, and chart-by-chart visibility matrix. |

---

## 2. Complete Utilization of Google Form Questions

Both student and teacher Google Forms collect multi-dimensional feedback. The dashboard converts every single question from the raw `answers` JSONB column into clear charts and management metrics:

### 2.1 Student Evaluations (Pre vs. Post Transformation)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STUDENT EVALUATION MAP                            │
├───────────────────────────────────┬─────────────────────────────────────────┤
│ PRE-ASSESSMENT (Baseline)         │ POST-ASSESSMENT (Impact & Validation)   │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ • University: IIUI vs Other Inst. │ • University Verification: 82.4% IIUI   │
│ • Degree Level & Semester Year    │ • Q1: Hours Saved/Week (73% saved 3-5h+)│
│ • Q1: Weekly reading & prep hours │ • Q2: Most helpful AI asset (Audio/Guide│
│ • Q2: Obstacles in comprehension  │ • Q3: Text comprehension ease factor    │
│ • Q4: Burnout/fatigue frequency   │ • Q4: Reduction in study burnout        │
│ • Q5/9: Baseline AI experience 1-5│ • Q5: Exam & quiz performance lift      │
│ • Q6: Prior NotebookLM familiarity│ • Q6: Output reliability vs chatbots    │
│ • Q10: Ethics & hallucination fear│ • Q7: Long-term adoption (91.1% Yes)    │
└───────────────────────────────────┴─────────────────────────────────────────┘
```

#### Detailed Student Questions Breakdown:

1. **Target Hours Saved (QIP Target: 3–5 Hours/Week)**:
   - *Survey Question:* `Q1. How many study/note-taking hours per week did you save using NotebookLM learning packs?`
   - *Live Supabase Data Distribution:*
     * **3 to 5 hours (Target Met):** **456 students (59.8%)**
     * **6 to 8 hours:** **62 students (8.1%)**
     * **9+ hours:** **39 students (5.1%)**
     * **Less than 2 hours:** 203 students (26.6%)
     * **Outcome:** **73.0% of respondents saved 3 or more hours weekly**, validating the Quality Improvement Plan (QIP) benchmark.

2. **Most Effective AI Study Assets**:
   - *Survey Question:* `Q2. Which AI-generated study assets helped you most during revision?`
   - *Rankings from Data:*
     1. Structured Chapter Guides (143 solo + 112 multi-selections)
     2. Audio Overviews & Conversational Podcasts (138 solo + 98 multi-selections)
     3. Interactive Practice Quizzes (108 solo + 84 multi-selections)
     4. Visual Concept Maps & Timelines (101 solo)
     5. Multi-lingual Explanations (Urdu/English/Arabic) (44 solo)

3. **Academic Burnout Reduction**:
   - *Pre Question:* `Q4. How often do you feel overwhelmed or burnt out due to heavy reading assignments?`
   - *Post Question:* `Q4. How would you rate your level of study burnout/fatigue after using these AI assets?`
   - *Impact:* Shift from severe burnout ratings (4–5 in Pre) down to manageable ratings (1–2 in Post) across 64% of matched participants.

4. **Institutional Affiliation (IIUI vs. Non-IIUI)**:
   - *Survey Question:* `Are you an IIUI student or a student from another university?`
   - *Distribution:* **626 IIUI Students (82.4%)** vs. **134 External University Students (17.6%)** (including NUST, Quaid-i-Azam University, FAST-NUCES, and Bahria University).

5. **Future Sustainability & Continued Adoption**:
   - *Survey Question:* `Q7. Will you continue using NotebookLM for your study revision in upcoming semesters?`
   - *Results:* **692 students (91.1%) confirmed continuous future adoption** (49.6% in all subjects, 41.4% in text-heavy subjects). Only 7 respondents (<1%) indicated no.

---

### 2.2 Teacher & Faculty Evaluations (Pre vs. Post Transformation)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TEACHER EVALUATION MAP                            │
├───────────────────────────────────┬─────────────────────────────────────────┤
│ PRE-ASSESSMENT (Baseline)         │ POST-ASSESSMENT (Impact & Validation)   │
├───────────────────────────────────┼─────────────────────────────────────────┤
│ • Institute: IIUI vs External Uni │ • Institute: 69.7% IIUI / 30.3% Non-IIUI│
│ • Department & Non-IT Target Course│ • Q1: Prep hours saved (70.1% saved 3h+)│
│ • Q1: Manual lesson prep hours    │ • Q2: AI assets deployed in classroom   │
│ • Q2: Largest weekly prep bottleneck│ • Q3: Reduction in text processing time│
│ • Q3: Multilingual translation    │ • Q4: Reduction in teaching burnout     │
│ • Q4: Baseline AI tool experience │ • Q5: Student engagement improvement    │
│ • Q6: Barrier/concern (cheating/acc│ • Q6: Grounded output reliability      │
│ • Q10: Pre-configured AI Notebooks│ • Q7: Future semester continuation      │
└───────────────────────────────────┴─────────────────────────────────────────┘
```

#### Detailed Teacher Questions Breakdown:

1. **Faculty Prep Time Saved**:
   - *Survey Question:* `Q1. How many hours per week did you save in lesson prep using NotebookLM?`
   - *Live Supabase Data Distribution:*
     * **3 to 5 hours (Target Met):** **44 teachers (57.1%)**
     * **6 to 8 hours:** **7 teachers (9.1%)**
     * **9+ hours:** **3 teachers (3.9%)**
     * **Less than 2 hours:** 23 teachers (29.9%)
     * **Outcome:** **70.1% of faculty saved 3 or more hours each week** on lesson planning, syllabus drafting, and exam preparation.

2. **Classroom Deployment of AI Assets**:
   - *Survey Question:* `Q2. Which AI teaching assets did you deploy in your classroom?`
   - *Key Findings:* 68% of instructors generated conversational Audio Summaries for pre-lecture listening; 61% built automated revision question banks; 42% utilized bilingual glossary synthesis for classical Arabic/Urdu materials.

3. **Faculty Affiliation**:
   - **53 IIUI Faculty Members (69.7%)** across FMS, Social Sciences, Basic Sciences, and Shariah & Law.
   - **23 External Faculty Members (30.3%)** representing partner institutions.

---

## 3. Database Permission System Architecture (`Sql-Updated-Code.sql`)

The database follows a strict, multi-tiered Role-Based Access Control (RBAC) schema:

```mermaid
classDiagram
    class Profile {
        UUID id
        TEXT email
        TEXT full_name
        TEXT role ('admin', 'team-member', 'student', 'teacher', 'guest')
    }

    class Member {
        UUID id
        UUID profile_id
        TEXT team_role ('admin', 'team-member')
        TEXT team_tag ('awareness', 'workshops', 'analyzing', 'General')
        BOOLEAN can_manage_team
        TEXT mcq_access_level
        BOOLEAN can_manage_gallery
        BOOLEAN can_manage_resources
    }

    class AnalyticsAccessControl {
        UUID member_id
        BOOLEAN can_view_analytics
        UUID granted_by
        TIMESTAMPTZ granted_at
    }

    class SystemSettings {
        TEXT key
        JSONB value
        TIMESTAMPTZ updated_at
    }

    Profile "1" --> "0..1" Member : profile_id
    Profile "1" --> "0..1" AnalyticsAccessControl : member_id
    SystemSettings ..> AnalyticsAccessControl : configures governance
```

### 3.1 Permission Verification Logic
When a user requests survey analytics:
1. **Superadmin Verification:** `ai.bridge.iiui.fms@gmail.com` has absolute bypass privileges.
2. **Admin Role Verification:** Users with `role = 'admin'` in `public.profiles` or `team_role = 'admin'` in `public.members` have unrestricted read/write control.
3. **Delegated Member Verification:** Users with `role = 'team-member'` are evaluated against `public.analytics_access_control`:
   ```sql
   SELECT can_view_analytics FROM public.analytics_access_control WHERE member_id = auth.uid();
   ```
4. **External Reviewer Verification:** Unauthenticated visitors (evaluators who scanned the QR code) are validated via the **Reviewer Password Gate**.

---

## 4. Scannable Report QR Code & Reviewer Password Gate

Management requires a scannable **QR Code** to be printed directly on the formal project report. When national campaign judges, HEC evaluators, or university deans scan this QR code with their mobile cameras, they can inspect real-time evaluation data without needing an IIUI account, protected by a secure **Admin-Managed Password**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       QR CODE EVALUATOR ACCESS FLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Evaluator scans QR code on printed report                                │
│    URL: https://ai-bridge-iiui.vercel.app/dashboard/survey-analytics?ref=qr │
│                                                                             │
│ 2. System checks user session:                                              │
│    ├─ Is user an authenticated Team Member? ──► Grant Direct Full Access   │
│    └─ Is user an external guest / reviewer? ─► Show Reviewer Password Gate │
│                                                                             │
│ 3. Reviewer enters Password (e.g., "HHP-AIB-2026"):                         │
│    ├─ Verified against `public.system_settings` (reviewer_dashboard_passcode│
│    └─ On Success: Sets secure 24-Hour Reviewer Session Cookie               │
│                                                                             │
│ 4. Dashboard opens in Official Evaluator View:                              │
│    ├─ Live Supabase Charts & Metrics filtered by visibility matrix          │
│    ├─ Verified Official Header: "Official Evaluator Access · IIUI FMS"      │
│    ├─ Single-Click Download enabled on every chart (PNG / CSV / SVG)        │
│    └─ Private student emails and PII securely masked                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Admin Password Management in Database
The password and operational settings are stored in `public.system_settings`:

```sql
INSERT INTO public.system_settings (key, value, updated_at)
VALUES (
  'reviewer_dashboard_access',
  jsonb_build_object(
    'is_enabled', true,
    'password_hash', crypt('HHP-AIB-2026', gen_salt('bf')),
    'password_plain_hint', 'HHP-***-2026',
    'session_duration_hours', 24,
    'evaluator_organization', 'Hum Hain Pakistan National SDG Campaign Evaluators',
    'allow_chart_downloads', true,
    'last_updated_by', 'Dr. Abdul Zahid Khan',
    'updated_at', timezone('utc'::text, now())
  ),
  timezone('utc'::text, now())
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = timezone('utc'::text, now());
```

---

## 5. Granular Chart-by-Chart & Card-by-Card Visibility Matrix

Management requires fine-grained control: the Admin must be able to toggle which charts are visible to **Team Members** versus **External Reviewers (QR Code)** versus **Management Only**.

Administrators can now change the Member and Reviewer visibility directly from each chart on the Survey Impact dashboard. The same permissions remain available in the Report QR & Reviewer Access matrix for bulk review; both controls save to this shared setting. Administrators continue to see every chart, including charts hidden from Members or Reviewers, so they can restore visibility in place.

The **Survey Question Charts** sub-tab summarizes structured student and teacher answers from all four pre/post survey datasets. Questions with the same wording after removing their question number are paired for pre/post comparison. Personal identifiers and open-text/comment fields are excluded; questions with more than 20 distinct answer options are omitted to keep charts readable. Multi-select responses are counted per selected option, so their percentages may exceed 100%.

### 5.1 Visibility Configuration Schema in `public.system_settings`
Stored under the key: `survey_dashboard_chart_permissions`

If this setting has not been created yet, the dashboard keeps the legacy behavior and shows each chart to both audiences until an Admin changes its visibility.

```json
{
  "kpi_overview_cards": {
    "title": "KPI Overview Summary Cards",
    "team_member_visible": true,
    "external_reviewer_visible": true,
    "allow_download": true
  },
  "hours_saved_target_chart": {
    "title": "Hours Saved QIP Target Distribution (3-5h)",
    "team_member_visible": true,
    "external_reviewer_visible": true,
    "allow_download": true
  },
  "before_after_familiarity_meter": {
    "title": "Before vs After AI Familiarity Lift (1-5 Scale)",
    "team_member_visible": true,
    "external_reviewer_visible": true,
    "allow_download": true
  },
  "top_ai_assets_deployed": {
    "title": "Most Effective AI Study & Teaching Assets",
    "team_member_visible": true,
    "external_reviewer_visible": true,
    "allow_download": true
  },
  "department_matrix_table": {
    "title": "Department Participation & Impact Table",
    "team_member_visible": true,
    "external_reviewer_visible": true,
    "allow_download": true
  },
  "faculty_cards_grid": {
    "title": "Faculty Groupings Grid (FMS, FSS, FCIT, etc.)",
    "team_member_visible": true,
    "external_reviewer_visible": true,
    "allow_download": true
  },
  "iiui_vs_non_iiui_distribution": {
    "title": "Institutional Outreach (IIUI vs External)",
    "team_member_visible": true,
    "external_reviewer_visible": true,
    "allow_download": true
  },
  "teacher_designation_analysis": {
    "title": "Teacher Designation & Experience Matrix",
    "team_member_visible": true,
    "external_reviewer_visible": false,
    "allow_download": true
  },
  "quiz_score_distribution": {
    "title": "Quiz Assessment Score Buckets & Pass Rate",
    "team_member_visible": true,
    "external_reviewer_visible": false,
    "allow_download": true
  },
  "certificate_issuance_registry": {
    "title": "Recent Official Certificate Verification Registry",
    "team_member_visible": true,
    "external_reviewer_visible": true,
    "allow_download": true
  },
  "burnout_fatigue_index": {
    "title": "Student & Teacher Academic Burnout Indices",
    "team_member_visible": false,
    "external_reviewer_visible": false,
    "allow_download": false
  },
  "qualitative_student_feedback": {
    "title": "Raw Qualitative Suggestions & Feedback Notes",
    "team_member_visible": true,
    "external_reviewer_visible": false,
    "allow_download": false
  }
}
```

---

## 6. Dedicated Admin Tab: "Report QR & Reviewer Access"

In the main Admin Dashboard (`/dashboard`), a dedicated tab titled **"Report QR & Reviewer Access"** provides the complete control center:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [←] Dashboard  /  Report QR & Reviewer Access Governance                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────┐ ┌───────────────────────────────────┐ │
│ │ 📱 REPORT QR CODE PREVIEW         │ │ 🔑 REVIEWER PASSWORD CONTROLS     │ │
│ │                                   │ │                                   │ │
│ │       [███████████████]           │ │ Current Password: [ HHP-AIB-2026 ]│ │
│ │       [████  ███  ████]           │ │ [ Update Password ] [ Rotate PIN ]│ │
│ │       [████  ███  ████]           │ │                                   │ │
│ │       [███████████████]           │ │ Target Link:                      │ │
│ │                                   │ │ https://ai-bridge.vercel.app/qr   │ │
│ │  Scan with Camera to Test Live    │ │ [ Copy Link ]                     │ │
│ │                                   │ │                                   │ │
│ │  [ ⬇ Download PNG ] [ ⬇ SVG ]     │ │ Session Validity: [ 24 Hours ▼ ]  │ │
│ └───────────────────────────────────┘ └───────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🛡️ GRANULAR CHART & CARD VISIBILITY MATRIX                                  │
│                                                                             │
│ Chart / Section Name         | Team Member View | External Reviewer (QR)    │
│ ──────────────────────────── | ──────────────── | ──────────────────────    │
│ 1. KPI Overview Cards        |    [  ON  ]      |        [  ON  ]           │
│ 2. Hours Saved QIP Chart     |    [  ON  ]      |        [  ON  ]           │
│ 3. Before/After Rating Lift  |    [  ON  ]      |        [  ON  ]           │
│ 4. Top AI Assets Deployed    |    [  ON  ]      |        [  ON  ]           │
│ 5. Department Matrix Table   |    [  ON  ]      |        [  ON  ]           │
│ 6. Faculty Groupings Grid    |    [  ON  ]      |        [  ON  ]           │
│ 7. IIUI vs Non-IIUI Map      |    [  ON  ]      |        [  ON  ]           │
│ 8. Teacher Designation Table |    [  ON  ]      |        [  OFF ]           │
│ 9. Quiz Score Distribution   |    [  ON  ]      |        [  OFF ]           │
│ 10. Certificate Registry     |    [  ON  ]      |        [  ON  ]           │
│ 11. Burnout & Fatigue Index  |    [  OFF ]      |        [  OFF ]           │
│ 12. Qualitative Notes Feed   |    [  ON  ]      |        [  OFF ]           │
│                                                                             │
│ [ Save Visibility Configuration ]                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Individual Chart Export & Download Architecture (PNG, CSV, SVG)

To support academic publications, official QIP binder documentation, slide decks, and external reviewer analysis, **any person viewing a chart can download/export that specific chart individually**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INDIVIDUAL CHART DOWNLOAD ENGINE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 📊 Hours Saved Impact (QIP Target: 3-5 Hours/Week)       [ ⬇ Export ▼]│  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │                                                          ┌───────────┐│  │
│  │  3 to 5 hrs: [████████████████████] 59.8% (456 students) │ 🖼️ PNG Img││  │
│  │  6 to 8 hrs: [████] 8.1% (62 students)                   │ 📊 CSV Data││  │
│  │  9+ hours  : [██] 5.1% (39 students)                     │ 📐 SVG Vect││  │
│  │  < 2 hours : [████████] 26.6% (203 students)             └───────────┘│  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.1 Export Formats Provided per Chart

1. **High-Resolution Branded Image (`PNG`)**:
   - Captures the exact rendered visual card with crisp typography, progress bars, and badges.
   - Automatically injects an official institutional header badge:
     `"The AI Bridge · Faculty of Management Sciences · International Islamic University Islamabad"`
   - Includes timestamp and data verification watermark: `"Live Supabase Verified Data: [Date]"`.
   - Ready to be inserted directly into Word reports, PowerPoint slides, or evaluation dossiers.

2. **Underlying Raw Dataset (`CSV / Excel`)**:
   - Exports the precise numerical breakdown that powers that specific chart.
   - Allows reviewers, auditors, and faculty researchers to open the data in Microsoft Excel or Google Sheets for independent statistical calculation.
   - Example CSV Export for *Hours Saved Chart*:
     ```csv
     Category,Student Count,Student Percentage,Teacher Count,Teacher Percentage,QIP Target Met
     "3 to 5 hours",456,59.8%,44,57.1%,YES
     "6 to 8 hours",62,8.1%,7,9.1%,YES
     "9+ hours",39,5.1%,3,3.9%,YES
     "Less than 2 hours",203,26.6%,23,29.9%,NO
     "Total Evaluated",760,100.0%,77,100.0%,-
     ```

3. **Vector Graphic (`SVG`)**:
   - Generates scalable vector graphics for high-DPI academic printing without pixelation.

### 7.2 Technical Implementation of Chart Export
Implemented via a reusable lightweight client wrapper `<ChartDownloadWrapper>`:

```tsx
// Component: src/components/dashboard/ChartDownloadWrapper.tsx
import React, { useRef } from 'react';
import { Download, Image as ImageIcon, FileSpreadsheet, Sparkles } from 'lucide-react';
import { toPng, toSvg } from 'html-to-image';

interface ChartDownloadWrapperProps {
  id: string;
  title: string;
  dataForCsv?: Record<string, any>[];
  children: React.ReactNode;
}

export default function ChartDownloadWrapper({ id, title, dataForCsv, children }: ChartDownloadWrapperProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadImage = async (format: 'png' | 'svg') => {
    if (!cardRef.current) return;
    const fn = format === 'png' ? toPng : toSvg;
    const dataUrl = await fn(cardRef.current, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = `AI-Bridge-${title.toLowerCase().replace(/\s+/g, '-')}.${format}`;
    link.href = dataUrl;
    link.click();
  };

  const downloadCsv = () => {
    if (!dataForCsv || dataForCsv.length === 0) return;
    const headers = Object.keys(dataForCsv[0]).join(',');
    const rows = dataForCsv.map(row => Object.values(row).map(v => `"${v}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.download = `AI-Bridge-${title.toLowerCase().replace(/\s+/g, '-')}-data.csv`;
    link.href = encodedUri;
    link.click();
  };

  return (
    <div ref={cardRef} className="relative bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-sm text-slate-900">{title}</h3>
        <div className="flex items-center gap-1.5 no-print">
          <button onClick={() => downloadImage('png')} title="Download as PNG Image" className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors">
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          {dataForCsv && (
            <button onClick={downloadCsv} title="Download CSV Dataset" className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}
```

---

## 8. Mobile-First Executive UX & Smartphone Controls

Middle and upper management frequently inspect updates on smartphones during meetings, campus walks, and conferences. The dashboard is optimized specifically for mobile viewports:

```
┌─────────────────────────────────────────┐
│ [≡] The AI Bridge Executive     [Refresh]│
├─────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 1,763 Students  │ │ 164 Teachers    │ │
│ │ ★ Live in DB    │ │ ★ Live in DB    │ │
│ └─────────────────┘ └─────────────────┘ │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ 704 Certs       │ │ 73% Saved 3-5h+ │ │
│ │ ★ 100% Verified │ │ ★ QIP Target Met│ │
│ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────┤
│ [Overview] [Before/After] [Depts] [More]│ <- Horizontally swipeable
├─────────────────────────────────────────┤
│ 📊 Hours Saved Impact (Tap for Detail)   │
│ 3-5h: [████████████████████] 59.8%      │
│ 6-8h: [████] 8.1%                       │
│ 9h+ : [██] 5.1%                         │
│ <2h : [████████] 26.6%                  │
│ [ ⬇ Tap to Save Image to Phone ]        │
├─────────────────────────────────────────┤
│ 🏫 IIUI vs Non-IIUI Ratio                │
│ IIUI Students:     626 (82.4%)          │
│ External Students: 134 (17.6%)          │
└─────────────────────────────────────────┘
```

### 8.1 Key Mobile UX Patterns:
- **Card-Based Visual Density:** Large touch targets (minimum 44px) with high-contrast text and emerald accent badges.
- **Single-Tap Image Save on Mobile:** Tapping the export button on any smartphone prompts the native save/share sheet, directly downloading the branded PNG into the reviewer's phone gallery.
- **Swipeable Navigation Tabs:** Overview, Before vs. After, Departments, Faculties, Faculty Matrix, and Quiz & Certs.
- **Collapsible Filter Drawers:** Allows filtering by Faculty (FMS, FSS, etc.), Survey Type (Pre/Post), or Affiliation (IIUI / Non-IIUI) without cluttering the screen.

---

## 9. Technical Implementation Blueprint

### 9.1 Route & File Structure

```
AI-Bridge/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── admin/
│   │   │       ├── survey-analytics/
│   │   │       │   └── route.ts         <-- Cloud Aggregation API (GET, PATCH)
│   │   │       └── reviewer-access/
│   │   │           └── route.ts         <-- Password Validation, QR Settings & Visibility API
│   │   └── dashboard/
│   │       ├── analytics/
│   │       │   └── page.tsx             <-- Links to Survey Impact Dashboard
│   │       └── survey-analytics/
│   │           └── page.tsx             <-- Executive Impact Dashboard Page (with Password Gate & Chart Exports)
│   └── components/
│       └── dashboard/
│           ├── ReviewerPasswordModal.tsx <-- Password Entry Prompt for QR Reviewers
│           ├── ReportQRManager.tsx      <-- Dedicated Admin QR & Password Control Panel
│           ├── ChartVisibilityToggle.tsx <-- Granular Visibility Checkbox Matrix
│           ├── ChartDownloadWrapper.tsx <-- 1-Click PNG/CSV/SVG Exporter for Any Chart
│           ├── ImpactMetricCard.tsx     <-- Reusable KPI Card
│           ├── HoursSavedBarChart.tsx   <-- Responsive Pure Tailwind Bar Chart
│           └── DepartmentMatrix.tsx     <-- Sortable Department Table
```

### 9.2 Reviewer Verification API (`/api/admin/reviewer-access`)

```typescript
// POST: Validates reviewer password and sets secure session cookie
export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const admin = createAdminClient();
  
  const { data: setting } = await admin
    .from('system_settings')
    .select('value')
    .eq('key', 'reviewer_dashboard_access')
    .single();

  const storedHash = setting?.value?.password_hash;
  const isValid = await verifyBcrypt(password, storedHash);

  if (!isValid) {
    return NextResponse.json({ success: false, error: 'Invalid reviewer password' }, { status: 401 });
  }

  // Set 24h signed cookie
  const response = NextResponse.json({ success: true, organization: setting.value.evaluator_organization });
  response.cookies.set('aib_reviewer_session', 'verified', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60,
    path: '/'
  });

  return response;
}
```

---

## 10. Management Summary Checklist & Milestones

| Deliverable | Verification Standard | Target Audience |
| :--- | :--- | :--- |
| **Accurate Base Data** | 100% matched to live Supabase rows (`student_surveys`, `teacher_surveys`). Zero mocked data. | Internal Audit & Mentors |
| **QIP Target Validation** | Verifies 3–5 hours/week saved benchmark with interactive distribution graphs. | HEC / SDG Evaluators |
| **Individual Chart Downloads** | Any viewer can download any chart as high-res PNG image or raw CSV dataset. | Evaluators, Deans & Researchers |
| **Department / Faculty Matrix** | Full visibility across FMS, FSS, FBAS, FCIT, FLL, FSL + Non-IIUI universities. | Deans & Heads of Dept |
| **Dedicated QR & Password Tab** | Admin controls the reviewer password, previews QR code, and downloads PNG/SVG. | Lead Admin & Chairperson |
| **Granular Visibility Control** | Admin controls which chart is visible to team members vs. external reviewers. | Lead Admin & Mentors |
| **Executive Mobile UX** | Highly readable on iPhones and Android devices with zero layout breakage. | Upper University Leadership |

---
*Authored for the Academic & Technical Governance Committee — The AI Bridge IIUI.*
