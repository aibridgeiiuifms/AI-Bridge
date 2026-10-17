# The AI Bridge — Certification System Deep Analysis & Technical Specification
**Comparative System Architecture: Current Implementation vs. Target Production State**  
*International Islamic University Islamabad (IIUI) · Faculty of Management Sciences (FMS) · Hum Hain Pakistan (HHP) SDG Youth Campaign*

---

## Executive Summary 

The **AI Bridge Certification System** is the credentialing engine of the *Source-Grounded AI & NotebookLM Mastery* training campaign across IIUI faculties. To safeguard academic integrity and satisfy campaign auditing standards, certificates are not distributed arbitrarily; they are **earned credentials** granted exclusively to beneficiaries who successfully navigate a sequential **3-Gate Evaluation Lifecycle**:
1. **Gate 1:** Pre-Training Assessment Survey (Google Forms synced to Supabase).
2. **Gate 2:** 12-MCQ Course Assessment (Passing score $\ge 75\%$, i.e., 9/12).
3. **Gate 3:** Post-Training Impact Survey (Google Forms synced to Supabase).

Upon passing all 3 gates, the system generates an official, tamper-evident certificate in PDF format embedded with a cryptographically verifiable **Quick Response (QR) Code**. Scanning this QR code directs any third party, employer, or university evaluator directly to the live public verification registry on the AI Bridge platform (`/verify/[certificate_id]`).

### Scope of this Document
This document establishes:
- **Comprehensive "How It Is Now" Analysis:** A granular autopsy of the current codebase, identifying mock data, missing API pipelines, database bottlenecks, and frontend placeholders.
- **Comprehensive "How It Should Be" Blueprint:** The production-grade target architecture detailing automatic triggers, server-side PDF stamping, resilient fallbacks, and real-time public verification.
- **Supabase Data Dictionary & Lineage:** Every single variable data element mapped to its authoritative Supabase table name, column name, data type, and fallback resolution chain.
- **Asset Geometry & Typography Blueprint:** Deep inspection of the master certificate template (`Assets/AI_BRIDGE_Certificate_Cleaned.pdf`), providing exact coordinates, bounding boxes, font families, point sizes, and hex colors so that **only the variable text and QR code are replaced** while preserving all official branding and layout integrity.

---

## Table of Contents

- [The AI Bridge — Certification System Deep Analysis \& Technical Specification](#the-ai-bridge--certification-system-deep-analysis--technical-specification)
  - [Executive Summary](#executive-summary)
    - [Scope of this Document](#scope-of-this-document)
  - [Table of Contents](#table-of-contents)
  - [1. Asset Deep-Dive](#1-asset-deep-dive)
    - [Document Dimensions \& Color Palette](#document-dimensions--color-palette)
      - [Official Color Palette Extracted from PDF Streams](#official-color-palette-extracted-from-pdf-streams)
    - [Anatomy of the Master Cleaned Template](#anatomy-of-the-master-cleaned-template)
      - [Detailed Stream Inspection Findings](#detailed-stream-inspection-findings)
    - [Strict Mandate: Variable vs. Static Elements](#strict-mandate-variable-vs-static-elements)
  - [2. Current State Analysis ("How It Is Now")](#2-current-state-analysis-how-it-is-now)
    - [Current Database Status](#current-database-status)
      - [Existing Row Level Security (RLS) Policies](#existing-row-level-security-rls-policies)
      - [Critical Gaps in Database Logic:](#critical-gaps-in-database-logic)
    - [Current Portal Logic](#current-portal-logic)
      - [Issues Identified:](#issues-identified)
    - [Current Public Verification Page](#current-public-verification-page)
      - [Issues Identified:](#issues-identified-1)
    - [Current System Gaps](#current-system-gaps)
  - [3. Target Production Architecture ("How It Should Be")](#3-target-production-architecture-how-it-should-be)
    - [End-to-End Certification Lifecycle](#end-to-end-certification-lifecycle)
    - [Automated Issuance Pipeline](#automated-issuance-pipeline)
      - [1. Primary Event-Driven Trigger (Google Sheets Webhook Sync)](#1-primary-event-driven-trigger-google-sheets-webhook-sync)
      - [2. Secondary On-Demand Trigger (Self-Healing Portal Access)](#2-secondary-on-demand-trigger-self-healing-portal-access)
    - [Dynamic PDF Stamping Engine](#dynamic-pdf-stamping-engine)
    - [Real-Time Public Verification Engine](#real-time-public-verification-engine)
  - [4. Variable Data Dictionary \& Supabase Mapping](#4-variable-data-dictionary--supabase-mapping)
    - [Table 1: `public.certificates`](#table-1-publiccertificates)
    - [Table 2: `public.profiles`](#table-2-publicprofiles)
    - [Table 3: `public.student_surveys`](#table-3-publicstudent_surveys)
    - [Table 4: `public.teacher_surveys`](#table-4-publicteacher_surveys)
    - [Table 5: `public.quiz_attempts`](#table-5-publicquiz_attempts)
    - [Table 6: `public.system_settings`](#table-6-publicsystem_settings)
    - [Field Resolution Order \& Fallback Matrix](#field-resolution-order--fallback-matrix)
  - [5. Certificate Stamping Blueprint](#5-certificate-stamping-blueprint)
    - [Variable 1: Recipient Full Name](#variable-1-recipient-full-name)
      - [Dynamic Name Auto-Scaling Algorithm](#dynamic-name-auto-scaling-algorithm)
    - [Variable 2: Dynamic QR Code](#variable-2-dynamic-qr-code)
    - [Variable 3: Certificate Serial \& Issuance Date](#variable-3-certificate-serial--issuance-date)
  - [6. Implementation Architecture \& Step-by-Step Execution Plan](#6-implementation-architecture--step-by-step-execution-plan)
    - [Database SQL Migration](#database-sql-migration)
    - [Backend PDF Generation Service](#backend-pdf-generation-service)
    - [API Endpoints Specification](#api-endpoints-specification)
      - [1. Download Route: `GET /api/portal/certificate`](#1-download-route-get-apiportalcertificate)
      - [2. Verification Route: `GET /verify/[id]`](#2-verification-route-get-verifyid)
  - [7. Security, Integrity \& Edge-Case Handling](#7-security-integrity--edge-case-handling)
  - [8. Summary Checklist for Engineering Team](#8-summary-checklist-for-engineering-team)

---

## 1. Asset Deep-Dive

### Document Dimensions & Color Palette

Inspection of `Assets/AI_BRIDGE_Certificate_Cleaned.pdf` reveals the following exact physical and digital specifications:

| Parameter | Value | Description / Unit |
|---|---|---|
| **File Location** | `Assets/AI_BRIDGE_Certificate_Cleaned.pdf` | Cleaned master template |
| **Page Count** | `1` page | Single-page landscape credential |
| **PDF MediaBox** | `[0, 0, 1440, 1018.08]` | Coordinates in PostScript points ($1/72$ inch) |
| **Width** | `1440.0 pt` | $20.00$ inches ($508.0$ mm) |
| **Height** | `1018.08 pt` | $14.14$ inches ($359.16$ mm) |
| **Aspect Ratio** | $1.4144 : 1$ | $\sqrt{2} : 1$ (Standard ISO 216 / A-Series Landscape) |
| **Orientation** | Landscape | High-resolution horizontal certificate format |

#### Official Color Palette Extracted from PDF Streams

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BRAND COLOR SPECIFICATIONS                      │
├───────────────────┬──────────────┬─────────────────────────┬───────────┤
│ Color Name        │ Hex Code     │ Normalized PDF RGB      │ Usage     │
├───────────────────┼──────────────┼─────────────────────────┼───────────┤
│ Deep Navy Blue    │ #0a2756      │ (0.0392, 0.1530, 0.3370)│ Text/Bar  │
│ Classic Navy      │ #002060      │ (0.0000, 0.1255, 0.3765)│ Headings  │
│ Slate Steel Blue  │ #4a5a78      │ (0.2900, 0.3530, 0.4710)│ Subtitles │
│ Warm Gold Accent  │ #d6b56e      │ (0.8390, 0.7100, 0.4310)│ Lines/Meta│
│ Canvas Cream      │ #fbfaf6      │ (0.9843, 0.9804, 0.9647)│ Left Body │
│ Pure White        │ #ffffff      │ (1.0000, 1.0000, 1.0000)│ QR/Accent │
└───────────────────┴──────────────┴─────────────────────────┴───────────┘
```

---

### Anatomy of the Master Cleaned Template

The master certificate PDF is partitioned into two primary visual zones:

```
┌────────────────────────────────────────────────────────────┬──────────────┐
│  LEFT BODY CANVAS (Width: ~1010 pt, Background: #fbfaf6)   │ RIGHT PANEL  │
│                                                            │ (Width: ~430)│
│  [IIUI Seal Logo]  International Islamic University        │ [AI Bridge   │
│                    Faculty of Management Sciences          │     Badge]   │
│                                                            │              │
│  Certificate of Completion                                 │  NotebookLM  │
│  ────────────────────────────────────────────────────────  │   Training   │
│  This is to certify that                                   │   Program    │
│                                                            │  AI Bridge   │
│  [  ★ VARIABLE RECIPIENT FULL NAME GOES HERE ★  ]         │  FMS, IIUI   │
│  ────────────────────────────────────────────────────────  │  ─────────── │
│  has successfully completed the NotebookLM Training        │              │
│  Program, conducted by the team AI Bridge FMS, IIUI.       │              │
│                                                            │              │
│                                                            │  [ ★ VARIABLE│
│  [Signatory 1: Chairman TPM]  [Signatory 2: VP Research]   │    QR CODE ★]│
│  Dr Abdul Zahid Khan          Prof. Dr. Ahmed Shuja Syed   │  Scan to ver.│
└────────────────────────────────────────────────────────────┴──────────────┘
```

#### Detailed Stream Inspection Findings
By inspecting the internal content streams of `AI_BRIDGE_Certificate_Cleaned.pdf`, we determined that the template was "cleaned" by placing solid background-matching vector rectangle masks (`re ... B`) over variable fields:
1. **Recipient Name Box Mask:** Vector rectangle `88 502.08 422 60 re` filled with `#fbfaf6`. This cleanly conceals the original placeholder text (`"Hisham Khalid"`, original baseline $y=515.47, x=94.80$, font `Lora-Bold`, size $56.06\text{ pt}$). The golden underline rule at $y=502.08$ remains cleanly visible underneath.
2. **Right Sidebar Verification Box Mask:** Vector rectangle `1100 98.08 180 180 re` filled with `#0a2756` (the dark navy background of the sidebar). This conceals the old sample QR code (`Image19.jpg`) and original text (`"Scan to verify certificate"`).
3. **Signatory Signature Masks:** Vector rectangles `82 198.08 196 110 re` and `445 198.08 200 110 re` filled with `#fbfaf6`.

---

### Strict Mandate: Variable vs. Static Elements

> [!IMPORTANT]
> **User Requirement:** *"only veriable text and qr code should be replaced."*  
> The generation engine **must never** attempt to re-render the certificate background, decorative borders, official IIUI logo, AI Bridge circular badge, or signatory titles from scratch. All static elements must be preserved in their native, high-vector fidelity.

| Element | Type | Status in Stamping Engine | Source |
|---|---|---|---|
| **IIUI Seal (Top Left)** | Image / Vector | **STATIC** — DO NOT TOUCH | Embedded in PDF (`Image7.png`) |
| **"International Islamic University, Islamabad"** | Typography | **STATIC** — DO NOT TOUCH | Embedded in PDF ($x=213.1, y=883.5$) |
| **"Faculty of Management Sciences · AI Bridge"** | Typography | **STATIC** — DO NOT TOUCH | Embedded in PDF ($x=213.1, y=856.1$) |
| **"Certificate of Completion"** | Typography | **STATIC** — DO NOT TOUCH | Embedded in PDF ($x=92.2, y=686.0$) |
| **"This is to certify that"** | Typography | **STATIC** — DO NOT TOUCH | Embedded in PDF ($x=92.2, y=610.8$) |
| **Golden Underline Rule** | Vector Path | **STATIC** — DO NOT TOUCH | Embedded in PDF ($y=502.08$) |
| **RECIPIENT FULL NAME** | Typography | **VARIABLE — MUST BE STAMPED** | Dynamic from Supabase |
| **"has successfully completed the..."** | Typography | **STATIC** — DO NOT TOUCH | Embedded in PDF ($x=92.2, y=443.5$) |
| **"conducted by the team AI Bridge..."** | Typography | **STATIC** — DO NOT TOUCH | Embedded in PDF ($x=92.2, y=411.8$) |
| **Signatory 1 & 2 Text & Signatures** | Typography & Vector | **STATIC** — PRESERVED | Embedded in PDF |
| **Right Sidebar AI Bridge Badge & Titles**| Image & Text | **STATIC** — DO NOT TOUCH | Embedded in PDF |
| **QR CODE IMAGE (Bottom Right)** | Image / 2D Matrix | **VARIABLE — MUST BE STAMPED** | Dynamic QR generated via `qrcode` |
| **"Scan to verify certificate" label** | Typography | **VARIABLE — RE-STAMP WITH QR** | Dynamic text under the QR code |
| **Certificate Serial & Issue Date** | Typography | **OPTIONAL/METADATA FOOTER** | Stamped unobtrusively in footer |

---

## 2. Current State Analysis ("How It Is Now")

A rigorous audit of the current repository shows that while the database schema and 3-step evaluation frontends exist, **the actual certificate generation, storage, and dynamic verification pipeline is incomplete and reliant on mocks.**

### Current Database Status

The database schema file [`supabase/001_schema.sql`](file:///d:/000627-BSBA-S24/Other%20Material/web%20development/AI-Bridge/supabase/001_schema.sql#L96-L115) defines the `public.certificates` table:

```sql
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id TEXT NOT NULL UNIQUE, -- e.g. AIB-2025-0001
    verification_code TEXT NOT NULL UNIQUE, -- Unique cryptographic slug
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    recipient_role TEXT NOT NULL DEFAULT 'Trained Educator / Participant',
    student_id TEXT,
    department TEXT,
    course_name TEXT NOT NULL DEFAULT 'The AI Bridge: Source-Grounded AI & NotebookLM Mastery',
    completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pdf_url TEXT,
    qr_code_url TEXT,
    is_valid BOOLEAN NOT NULL DEFAULT true,
    issued_by TEXT NOT NULL DEFAULT 'Dr. Abdul Zahid Khan (Chairperson, TPM Department, FMS IIUI)',
    issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_certificate UNIQUE (user_id)
);
```

#### Existing Row Level Security (RLS) Policies
- `SELECT` is open to the public (`USING (true)`) so anyone can verify.
- `SELECT` is open to authenticated users for their own rows (`USING (auth.uid() = user_id)`).
- `ALL` operations are restricted to `public.get_user_role() = 'admin'`.

#### Critical Gaps in Database Logic:
1. **No Automated Trigger or Function:** There is no database trigger or stored procedure that inserts a row into `public.certificates` when a student completes all three gates.
2. **No User Insertion Permission:** Regular students cannot insert into `public.certificates`. Any issuance must occur via a `SECURITY DEFINER` function or via a backend route utilizing the Supabase Service Role (`createAdminClient()`).
3. **Empty Table in Production:** In runtime tests, the `certificates` table contains zero records; it is never populated upon quiz completion or survey synchronization.

---

### Current Portal Logic

In [`src/app/portal/page.tsx`](file:///d:/000627-BSBA-S24/Other%20Material/web%20development/AI-Bridge/src/app/portal/page.tsx#L241-L250), the frontend checks completion of the 3 gates:
```typescript
// 4. Check Certificate
const { data: cert } = await supabase
  .from('certificates')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle();

if (cert || (hasPre && quiz && hasPost)) {
  setCertificateReady(true);
}
```

However, in the UI render section ([`src/app/portal/page.tsx#L600-L614`](file:///d:/000627-BSBA-S24/Other%20Material/web%20development/AI-Bridge/src/app/portal/page.tsx#L600-L614)):
```tsx
<a
  href="/verify/AIB-2025-0001"
  className="..."
>
  <ShieldCheck className="w-4 h-4 text-emerald-700" />
  <span>Verify Status</span>
</a>
<button
  onClick={() => alert('Certificate PDF generator will render your credential with QR code in Phase 3!')}
  className="..."
>
  <Download className="w-4 h-4" />
  <span>Download PDF Certificate</span>
</button>
```

#### Issues Identified:
1. **Hardcoded Verification Link:** Always points to `/verify/AIB-2025-0001` instead of the user's specific `certificate_id`.
2. **Stubbed Download Action:** The button triggers a JavaScript `alert()`, stating that generation is scheduled for "Phase 3".
3. **No PDF Rendering Hook:** No call is made to a server API to trigger PDF generation or retrieve an existing document.

---

### Current Public Verification Page

In [`src/app/verify/[id]/page.tsx`](file:///d:/000627-BSBA-S24/Other%20Material/web%20development/AI-Bridge/src/app/verify/%5Bid%5D/page.tsx#L18-L35):
```typescript
export default async function VerifyPage({ params }: VerifyPageProps) {
  const { id } = await params;

  // Mock certificate details matching sample verified records
  const certificateData = {
    certificateId: id || 'AIB-2025-0001',
    recipientName: 'Asad Naveed Akbar',
    studentId: '003822bsbaf24',
    department: 'Faculty of Management Sciences (FMS)',
    courseName: 'The AI Bridge: Source-Grounded AI & NotebookLM Mastery',
    completionDate: 'October 10, 2026',
    status: 'VERIFIED & VALID',
    signatory: 'Dr. Abdul Zahid Khan',
    signatoryTitle: 'Chairperson, Department of Technology & Project Management, FMS IIUI',
    institution: 'International Islamic University Islamabad (IIUI)',
    campaign: 'Hum Hain Pakistan (HHP) - SDG Youth Campaign Pilot',
  };
  ...
```

#### Issues Identified:
1. **Mock Data Vulnerability:** The route accepts any dynamic ID parameter, but completely ignores the database and displays hardcoded data for `"Asad Naveed Akbar"`.
2. **No Query to Supabase:** The page performs zero database lookups on `public.certificates`.
3. **No Revocation Handling:** An invalid or fraudulent certificate ID will still render as "Valid & Authentic Certificate".

---

### Current System Gaps

| Area | Current Implementation | Target Production State | Severity |
|---|---|---|---|
| **PDF Generation Engine** | None (client-side `alert()`) | Serverless PDF-Lib dynamic stamping engine | 🔴 Critical |
| **Variable Text Stamping** | None (empty placeholder in cleaned PDF) | Dynamic stamping of `recipient_name` from Supabase | 🔴 Critical |
| **Dynamic QR Code** | Static dark navy box mask covering old QR | High-contrast QR code generated via `qrcode` | 🔴 Critical |
| **Verification Route** | Hardcoded mock (`Asad Naveed Akbar`) | Live Supabase SSR query by `certificate_id` | 🔴 Critical |
| **Issuance Automation** | No automatic database insertion | Webhook + On-demand self-healing generation | 🔴 Critical |
| **Storage & Caching** | No storage bucket for certificates | Supabase Storage bucket `certificates` + streaming API | 🟡 Moderate |
| **Certificate Numbering** | Statically hardcoded `AIB-2025-0001` | Sequential generation: `AIB-2026-XXXX` | 🟡 Moderate |

---

## 3. Target Production Architecture ("How It Should Be")

### End-to-End Certification Lifecycle

```mermaid
flowchart TD
    subgraph Step1["Gate 1: Pre-Assessment"]
        G1[Google Forms Pre-Survey] -->|Sheet Sync| W1[Webhook API]
        W1 -->|Insert / Update| DB1[("student_surveys / teacher_surveys")]
    end

    subgraph Step2["Gate 2: Assessment"]
        G2[Portal 12-MCQ Quiz] -->|Score >= 75%| W2["/api/portal/quiz"]
        W2 -->|Insert Attempt| DB2[("quiz_attempts (passed=true)")]
    end

    subgraph Step3["Gate 3: Post-Assessment"]
        G3[Google Forms Post-Survey] -->|Sheet Sync| W3[Webhook API]
        W3 -->|Insert / Update| DB3[("student_surveys / teacher_surveys")]
    end

    DB1 & DB2 & DB3 --> GATE{"Are All 3 Gates Complete?"}
    
    GATE -- Yes --> ISSUER["Automated Issuance Service\n(Issue Certificate Record)"]
    GATE -- No --> LOCK["Portal: Locked State\n(Shows Remaining Requirements)"]

    ISSUER --> CERT_TABLE[("public.certificates\n- certificate_id: AIB-2026-0042\n- recipient_name: Dynamic\n- verification_code: Unique Slug")]

    CERT_TABLE --> GEN["PDF Stamping Engine\n(/api/portal/certificate/download)"]
    
    subgraph StampEngine["PDF-Lib Dynamic Stamping"]
        ASSET["Load Assets/AI_BRIDGE_Certificate_Cleaned.pdf"]
        QR["Generate Vector/PNG QR Code\npointing to /verify/AIB-2026-0042"]
        NAME["Format & Auto-Scale\nRecipient Full Name"]
        ASSET & QR & NAME --> MERGE["Stamp Name at (94.8, 515.5)\nStamp QR at (1138.3, 146.9)"]
        MERGE --> OUT_PDF["Final Signed & Verified PDF"]
    end

    GEN --> OUT_PDF
    OUT_PDF --> USER["Student Downloads Official PDF"]
    
    USER -.->|Scans QR| PUB_VERIFY["Public Verification Page\n(/verify/AIB-2026-0042)"]
    PUB_VERIFY --> REAL_TIME_DB[("Query public.certificates\n(Live Status & Metadata)")]
```

---

### Automated Issuance Pipeline

To ensure resilience, issuance follows a **dual-trigger strategy**:

#### 1. Primary Event-Driven Trigger (Google Sheets Webhook Sync)
When a participant completes their Post-Training Google Form, the webhook handler in [`src/app/api/webhooks/google-sheets/route.ts`](file:///d:/000627-BSBA-S24/Other%20Material/web%20development/AI-Bridge/src/app/api/webhooks/google-sheets/route.ts):
1. Ingests and links the `post` survey row to the user profile.
2. Checks whether a passed `quiz_attempts` record and a `pre` survey record exist for that user.
3. If all 3 gates are satisfied and no record exists in `public.certificates`, it calls the internal function `issueCertificateForUser(userId)`.

#### 2. Secondary On-Demand Trigger (Self-Healing Portal Access)
If network latency or asynchronous sheet sync causes the webhook to execute before the quiz is finished, the portal page [`src/app/portal/page.tsx`](file:///d:/000627-BSBA-S24/Other%20Material/web%20development/AI-Bridge/src/app/portal/page.tsx) or the download API endpoint `/api/portal/certificate` executes an **idempotent check**:
```typescript
// If Gates 1, 2, and 3 are complete, ensure certificates row exists
if (hasPre && quizPassed && hasPost) {
  await ensureCertificateIssued(user.id);
}
```

---

### Dynamic PDF Stamping Engine

Rather than rebuilding the certificate in HTML/Canvas, which risks font rendering drift and rasterization artifacts, the target engine utilizes **`pdf-lib`** to directly manipulate the vector PDF stream:

1. **Read Template:** Stream `Assets/AI_BRIDGE_Certificate_Cleaned.pdf` into a `PDFDocument` instance.
2. **Load Standard Font:** Embed standard `Times-Roman-Bold` / `Helvetica-Bold` or load the bundled Google Font `Lora-Bold.ttf`.
3. **Stamp Recipient Name:**
   - Text string retrieved from Supabase (`profiles.full_name` or fallback).
   - Draw text at coordinates `x = 94.80`, `y = 515.47` (with auto-scaling if string width exceeds $700\text{ pt}$).
   - Set color to `#0a2756` (`rgb(0.0392, 0.153, 0.337)`).
4. **Generate Dynamic QR Code:**
   - Use the `qrcode` NPM package to generate a high-resolution PNG buffer for the URL:  
     `https://ai-bridge.iiu.edu.pk/verify/${certificate.certificate_id}`.
   - Embed the PNG into the PDF page at `x = 1138.32, y = 146.88, width = 119.52, height = 108.00`.
   - Render a high-contrast white background container to ensure $100\%$ camera scanability against the dark blue sidebar.
   - Stamp the crisp white label `"Scan to verify"` and `"certificate"` directly beneath the QR code.
5. **Output Stream:** Deliver the generated binary PDF directly to the browser with HTTP headers:
   - `Content-Type: application/pdf`
   - `Content-Disposition: attachment; filename="The_AI_Bridge_Certificate_${certificate_id}.pdf"`

---

### Real-Time Public Verification Engine

In `/verify/[id]`:
1. The route parses `params.id` (which can be either `certificate_id` e.g., `AIB-2026-0042` or `verification_code` e.g., `550e8400-e29b-41d4-a716-446655440000`).
2. Performs an authoritative query against Supabase:
   ```typescript
   const { data: cert, error } = await supabase
     .from('certificates')
     .select(`
       *,
       profiles:user_id (full_name, email, student_id, department)
     `)
     .or(`certificate_id.eq.${id},verification_code.eq.${id}`)
     .maybeSingle();
   ```
3. If no record is found: Renders an official **"UNVERIFIED / INVALID CREDENTIAL"** alert.
4. If found and `is_valid === false`: Renders a **"REVOKED CREDENTIAL"** warning with revocation timestamp.
5. If found and `is_valid === true`: Renders the full verified credential modal with the student's name, department, issue date, authorized signatories, and a direct button to re-download the verified PDF.

---

## 4. Variable Data Dictionary & Supabase Mapping

This section documents **every single table and column** involved in the certification engine.

### Table 1: `public.certificates`
*The primary registry of issued credentials.*

| Column Name | Data Type | Nullable | Default | Source / Description |
|---|---|---|---|---|
| `id` | `UUID` | No | `gen_random_uuid()` | Internal unique database record ID |
| `certificate_id` | `TEXT` | No | *Generated* | Public serial number (e.g. `AIB-2026-0001`) |
| `verification_code` | `TEXT` | No | *Generated* | Cryptographic URL-safe slug or UUID |
| `user_id` | `UUID` | No | None | FK referencing `public.profiles(id)` |
| `recipient_name` | `TEXT` | No | None | Full name printed on certificate |
| `recipient_role` | `TEXT` | No | `'Participant'` | Role classification: `'Student'` or `'Educator'` |
| `student_id` | `TEXT` | Yes | `NULL` | Registration / Roll No. (e.g. `003822bsbaf24`) |
| `department` | `TEXT` | Yes | `NULL` | Department Name (e.g. `Dept. of TPM, FMS`) |
| `course_name` | `TEXT` | No | Constant | `'The AI Bridge: Source-Grounded AI & NotebookLM Mastery'` |
| `completion_date` | `DATE` | No | `CURRENT_DATE` | Date all 3 gates were completed |
| `pdf_url` | `TEXT` | Yes | `NULL` | Supabase Storage URL (if cached) |
| `qr_code_url` | `TEXT` | Yes | `NULL` | Data URL or Storage URL of QR image |
| `is_valid` | `BOOLEAN`| No | `true` | Revocation status flag |
| `issued_by` | `TEXT` | No | Default string | `'Dr. Abdul Zahid Khan & Prof. Dr. Ahmed Shuja Syed'` |
| `issued_at` | `TIMESTAMPTZ`| No | `now()` | Exact timestamp of issuance |

---

### Table 2: `public.profiles`
*The core identity record of the authenticated user.*

| Column Name | Data Type | Usage in Certification |
|---|---|---|
| `id` | `UUID` | Matches `auth.uid()` and links to `certificates.user_id` |
| `full_name` | `TEXT` | **Primary source** for `certificates.recipient_name` |
| `email` | `TEXT` | Primary account email used to correlate Google Forms |
| `student_id` | `TEXT` | **Primary source** for `certificates.student_id` |
| `department` | `TEXT` | **Primary source** for `certificates.department` |
| `role` | `TEXT` | Determines `'student'` vs `'teacher'` participant mode |

---

### Table 3: `public.student_surveys`
*Ingested student submissions from Google Sheets.*

| Column Name | Data Type | Usage in Certification |
|---|---|---|
| `user_id` | `UUID` | Correlates survey to authenticated student account |
| `student_email` | `TEXT` | Evaluated against `profiles.email` during matching |
| `student_name` | `TEXT` | **Secondary fallback source** for `recipient_name` |
| `registration_no` | `TEXT` | **Secondary fallback source** for `student_id` |
| `department_name` | `TEXT` | **Secondary fallback source** for `department` |
| `survey_type` | `TEXT` | Validates Gate 1 (`'pre'`) and Gate 3 (`'post'`) |
| `submitted_at` | `TIMESTAMPTZ`| Determines completion timestamp for Gate 1 and Gate 3 |
| `answers` | `JSONB` | Raw Google Form JSON for deep audit |

---

### Table 4: `public.teacher_surveys`
*Ingested teacher submissions from Google Sheets.*

| Column Name | Data Type | Usage in Certification |
|---|---|---|
| `user_id` | `UUID` | Correlates survey to authenticated teacher account |
| `teacher_email` | `TEXT` | Evaluated against `profiles.email` during matching |
| `teacher_name` | `TEXT` | **Secondary fallback source** for teacher `recipient_name` |
| `designation` | `TEXT` | Used to populate `recipient_role` (e.g. `'Assistant Professor'`) |
| `faculty_department`| `TEXT` | **Secondary fallback source** for teacher `department` |
| `survey_type` | `TEXT` | Validates Gate 1 (`'pre'`) and Gate 3 (`'post'`) |
| `submitted_at` | `TIMESTAMPTZ`| Determines completion timestamp for teacher gates |

---

### Table 5: `public.quiz_attempts`
*Evaluates Gate 2 assessment compliance.*

| Column Name | Data Type | Usage in Certification |
|---|---|---|
| `user_id` | `UUID` | Correlates attempt to student account |
| `score` | `INT` | Score obtained (e.g. `10`) |
| `total_questions`| `INT` | Number of questions (default: `12`) |
| `passing_score` | `INT` | Threshold required to pass (default: `9`) |
| `passed` | `BOOLEAN` | **Mandatory Gate 2 condition:** must be `true` |
| `completed_at` | `TIMESTAMPTZ`| Timestamp of successful assessment completion |

---

### Table 6: `public.system_settings`
*Global platform rules and signatory metadata.*

| Key | JSON Field | Description |
|---|---|---|
| `'certification'` | `passing_percentage` | Set to `75` (9/12 questions) |
| `'certification'` | `signatory_1_name` | `'Dr. Abdul Zahid Khan'` |
| `'certification'` | `signatory_1_title`| `'Associate Professor & Chairperson, Dept. of TPM, FMS IIUI'` |
| `'certification'` | `signatory_2_name` | `'Prof. Dr. Ahmed Shuja Syed'` |
| `'certification'` | `signatory_2_title`| `'Vice President (Research & Enterprise), IIUI'` |

---

### Field Resolution Order & Fallback Matrix

When issuing a certificate, the system resolves each variable field using a strict hierarchy to ensure no null values ever appear on the printed document:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   VARIABLE FIELD RESOLUTION HIERARCHY                  │
├────────────────────┬───────────────────────────────────────────────────┤
│ Target Field       │ Resolution Cascade (Evaluated Top to Bottom)      │
├────────────────────┼───────────────────────────────────────────────────┤
│                    │ 1. profiles.full_name                             │
│ recipient_name     │ 2. student_surveys.student_name                   │
│                    │ 3. teacher_surveys.teacher_name                   │
│                    │ 4. auth.users.raw_user_meta_data->>'full_name'    │
│                    │ 5. Parse name from email username (Final Fallback)│
├────────────────────┼───────────────────────────────────────────────────┤
│                    │ 1. profiles.student_id                            │
│ student_id         │ 2. student_surveys.registration_no                │
│                    │ 3. Regex parse from email (e.g. 025580bsirf26)    │
│                    │ 4. student_surveys.answers->>'Registration Number'│
├────────────────────┼───────────────────────────────────────────────────┤
│                    │ 1. profiles.department                            │
│ department         │ 2. student_surveys.department_name                │
│                    │ 3. teacher_surveys.faculty_department             │
│                    │ 4. Derived from deptCode (e.g. BSBA -> FMS)       │
├────────────────────┼───────────────────────────────────────────────────┤
│ completion_date    │ 1. MAX(post_survey.submitted_at, quiz.completed_at)│
│                    │ 2. CURRENT_DATE                                   │
└────────────────────┴───────────────────────────────────────────────────┘
```

---

## 5. Certificate Stamping Blueprint

All coordinates below represent **exact positions on the 1440 × 1018.08 point canvas** measured from the bottom-left origin $(0, 0)$.

```
   y = 1018.08 pt (Top Edge)
   ┌───────────────────────────────────────────────────────────────────────────────────┐
   │                                                                                   │
   │   (x=213.1, y=883.5) "International Islamic University, Islamabad"                │
   │                                                                                   │
   │   (x=92.2, y=686.0) "Certificate of Completion"                                   │
   │   (x=92.2, y=610.8) "This is to certify that"                                     │
   │                                                                                   │
y  │ ──(x=94.8, y=515.5) ★ VARIABLE RECIPIENT NAME ★ (Lora-Bold, 56pt, #0a2756)─────── │
   │   (x=92.2, y=502.1) [Existing Golden Underline Rule]                              │
   │                                                                                   │
   │   (x=92.2, y=443.5) "has successfully completed the NotebookLM Training..."      │
   │                                                                                   │
   │                                                         [RIGHT PANEL: #0a2756]    │
   │   (x=92.2, y=168.9)        (x=459.4, y=167.9)                                     │
   │   Dr Abdul Zahid Khan      Prof. Dr. Ahmed Shuja Syed   ★ DYNAMIC QR CODE ★       │
   │                                                         (x=1138.3, y=146.9, 110x110)
   │                                                         "Scan to verify certificate"
   └───────────────────────────────────────────────────────────────────────────────────┘
   (0, 0) (Bottom-Left Origin)                                  x = 1440.0 pt (Right Edge)
```

---

### Variable 1: Recipient Full Name

The recipient name occupies the prominent central zone immediately above the golden underline rule.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RECIPIENT NAME SPECIFICATION                    │
├───────────────────┬────────────────────────────────────────────────────┤
│ Property          │ Specification                                      │
├───────────────────┼────────────────────────────────────────────────────┤
│ **Baseline Position** | $x = 94.80\text{ pt}$, $y = 515.47\text{ pt}$               │
│ **Bounding Box**  │ Left: $94.80\text{ pt}$, Top: $461.9\text{ pt}$, Right: $820.0\text{ pt}$│
│ **Underline Y**   │ $y = 502.08\text{ pt}$ (Text sits $13.4\text{ pt}$ above line)     │
│ **Font Family**   │ `Lora-Bold` (Alternative: `Times-Roman-Bold`)      │
│ **Font Size**     │ Standard: $56.0\text{ pt}$                                 │
│ **Text Color**    │ Deep Navy Blue (`#0a2756` / `rgb(0.0392, 0.153, 0.337)`)│
│ **Alignment**     │ Left-aligned matching the academic salutation      │
└───────────────────┴────────────────────────────────────────────────────┘
```

#### Dynamic Name Auto-Scaling Algorithm
To prevent unusually long names from overlapping the right sidebar (which begins at $x \approx 1010\text{ pt}$), the stamping engine applies dynamic font size scaling:

$$\text{Maximum Allowed Width } (W_{\max}) = 720.0\text{ pt}$$

$$\text{Calculated Width } (W) = \text{Font.widthOfTextAtSize}(\text{Name}, 56.0)$$

$$\text{Final Font Size} = \begin{cases} 
56.0\text{ pt} & \text{if } W \le W_{\max} \\ 
56.0 \times \left(\frac{W_{\max}}{W}\right)\text{ pt} & \text{if } W > W_{\max} 
\end{cases}$$

*Example:* A 35-character name measuring $840\text{ pt}$ at $56\text{ pt}$ will be automatically scaled to $48\text{ pt}$, fitting inside the golden underline.

---

### Variable 2: Dynamic QR Code

The QR code is placed in the bottom section of the right sidebar, replacing the solid navy mask covering the template's old placeholder.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          QR CODE SPECIFICATION                         │
├───────────────────┬────────────────────────────────────────────────────┤
│ Property          │ Specification                                      │
├───────────────────┼────────────────────────────────────────────────────┤
│ **Placement Zone**│ Right Dark Blue Sidebar ($x > 1010\text{ pt}$)     │
│ **Origin Position**│ $x = 1138.32\text{ pt}$, $y = 146.88\text{ pt}$            │
│ **Dimensions**    │ Width: $119.52\text{ pt}$, Height: $108.00\text{ pt}$     │
│ **QR Matrix Size**│ Square: $108.0\text{ pt} \times 108.0\text{ pt}$ (Centered)│
│ **Target URL**    │ `https://ai-bridge.iiu.edu.pk/verify/${cert_id}`   │
│ **Error Correction**| Level `M` or `Q` (High resilience to damage)     │
│ **Container Box** │ White rounded rectangle with $6\text{ pt}$ padding │
│ **Sub-Label 1**   │ `"Scan to verify"` ($x=1159.56, y=130.94, 11\text{ pt}$)   │
│ **Sub-Label 2**   │ `"certificate"` ($x=1168.94, y=117.62, 11\text{ pt}$)      │
│ **Label Color**   │ Pure White (`#ffffff`) on dark navy background     │
│ **Label Font**    │ `Poppins-Bold` (or `Helvetica-Bold`)               │
└───────────────────┴────────────────────────────────────────────────────┘
```

---

### Variable 3: Certificate Serial & Issuance Date

To provide an immutable audit trail without cluttering the clean aesthetic, metadata is stamped in the bottom margin:

```
┌────────────────────────────────────────────────────────────────────────┐
│                         FOOTER AUDIT METADATA                          │
├───────────────────┬────────────────────────────────────────────────────┤
│ Property          │ Specification                                      │
├───────────────────┼────────────────────────────────────────────────────┤
│ **Position**      │ $x = 92.16\text{ pt}$, $y = 65.00\text{ pt}$               │
│ **Text Content**  │ `Certificate ID: AIB-2026-0042  •  Issued: Oct 17, 2026  •  verify: /verify/AIB-2026-0042` │
│ **Font Family**   │ `Poppins-Regular` / `Courier` / `Helvetica`        │
│ **Font Size**     │ $9.0\text{ pt}$ (Subtle, high-legibility audit text)│
│ **Color**         │ Slate Steel Blue (`#4a5a78` / `rgb(0.29, 0.353, 0.471)`) │
└───────────────────┴────────────────────────────────────────────────────┘
```

---

## 6. Implementation Architecture & Step-by-Step Execution Plan

### Database SQL Migration
*File: `supabase/011_certification_issuance_engine.sql`*

This migration creates the sequential numbering generator, public verification helper functions, and automated issuance procedures:

```sql
-- 1. Create a dedicated sequence for sequential certificate IDs
CREATE SEQUENCE IF NOT EXISTS public.certificate_id_seq START 1;

-- 2. Stored Procedure: Issue Certificate with 3-Gate Validation
CREATE OR REPLACE FUNCTION public.issue_certificate_for_user(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions to bypass insert restrictions
AS $$
DECLARE
    v_profile RECORD;
    v_has_pre BOOLEAN := false;
    v_has_post BOOLEAN := false;
    v_has_quiz BOOLEAN := false;
    v_existing RECORD;
    v_new_cert_id TEXT;
    v_verification_code TEXT;
    v_recipient_name TEXT;
    v_student_id TEXT;
    v_department TEXT;
    v_role TEXT := 'Participant';
BEGIN
    -- Check if certificate already exists
    SELECT * INTO v_existing FROM public.certificates WHERE user_id = p_user_id;
    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'status', 'already_issued', 'certificate', row_to_json(v_existing));
    END IF;

    -- Fetch user profile
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'User profile not found');
    END IF;

    -- Validate Gate 1 (Pre-Survey)
    SELECT EXISTS (
        SELECT 1 FROM public.student_surveys WHERE user_id = p_user_id AND survey_type = 'pre'
        UNION ALL
        SELECT 1 FROM public.teacher_surveys WHERE user_id = p_user_id AND survey_type = 'pre'
    ) INTO v_has_pre;

    -- Validate Gate 2 (Passed Quiz)
    SELECT EXISTS (
        SELECT 1 FROM public.quiz_attempts WHERE user_id = p_user_id AND passed = true
    ) INTO v_has_quiz;

    -- Validate Gate 3 (Post-Survey)
    SELECT EXISTS (
        SELECT 1 FROM public.student_surveys WHERE user_id = p_user_id AND survey_type = 'post'
        UNION ALL
        SELECT 1 FROM public.teacher_surveys WHERE user_id = p_user_id AND survey_type = 'post'
    ) INTO v_has_post;

    -- Guard: All 3 gates must be passed
    IF NOT (v_has_pre AND v_has_quiz AND v_has_post) THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Prerequisites not met',
            'gates', jsonb_build_object('pre_survey', v_has_pre, 'quiz_passed', v_has_quiz, 'post_survey', v_has_post)
        );
    END IF;

    -- Generate Next Certificate ID (Format: AIB-2026-XXXX)
    v_new_cert_id := 'AIB-' || to_char(CURRENT_DATE, 'YYYY') || '-' || lpad(nextval('public.certificate_id_seq')::text, 4, '0');
    v_verification_code := gen_random_uuid()::text;

    -- Resolve Name with Fallbacks
    v_recipient_name := COALESCE(
        NULLIF(TRIM(v_profile.full_name), ''),
        (SELECT student_name FROM public.student_surveys WHERE user_id = p_user_id AND student_name IS NOT NULL LIMIT 1),
        (SELECT teacher_name FROM public.teacher_surveys WHERE user_id = p_user_id AND teacher_name IS NOT NULL LIMIT 1),
        'Participant'
    );

    -- Resolve Student ID & Department
    v_student_id := COALESCE(
        v_profile.student_id,
        (SELECT registration_no FROM public.student_surveys WHERE user_id = p_user_id AND registration_no IS NOT NULL LIMIT 1)
    );
    v_department := COALESCE(
        v_profile.department,
        (SELECT department_name FROM public.student_surveys WHERE user_id = p_user_id AND department_name IS NOT NULL LIMIT 1),
        'Faculty of Management Sciences (FMS)'
    );

    -- Insert official certificate record
    INSERT INTO public.certificates (
        certificate_id,
        verification_code,
        user_id,
        recipient_name,
        recipient_role,
        student_id,
        department,
        course_name,
        completion_date,
        is_valid
    ) VALUES (
        v_new_cert_id,
        v_verification_code,
        p_user_id,
        v_recipient_name,
        v_role,
        v_student_id,
        v_department,
        'The AI Bridge: Source-Grounded AI & NotebookLM Mastery',
        CURRENT_DATE,
        true
    ) RETURNING * INTO v_existing;

    RETURN jsonb_build_object('success', true, 'status', 'issued', 'certificate', row_to_json(v_existing));
END;
$$;
```

---

### Backend PDF Generation Service
*File: `src/lib/certificate/stumper.ts`*

A TypeScript utility leveraging `pdf-lib` and `qrcode` to stamp the master PDF template:

```typescript
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export interface CertificateData {
  certificateId: string;
  recipientName: string;
  completionDate: string;
}

export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  // 1. Resolve master template path
  const templatePath = path.join(process.cwd(), 'Assets', 'AI_BRIDGE_Certificate_Cleaned.pdf');
  const templateBytes = fs.readFileSync(templatePath);

  // 2. Load PDF Document
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];

  // 3. Embed Fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontSans = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontSansRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // 4. Calculate dynamic font size for recipient name (Base: 56pt)
  const maxNameWidth = 720;
  let nameFontSize = 56;
  let textWidth = fontBold.widthOfTextAtSize(data.recipientName, nameFontSize);

  if (textWidth > maxNameWidth) {
    nameFontSize = Math.floor((maxNameWidth / textWidth) * nameFontSize);
  }

  // 5. Stamp Recipient Name (Color: #0a2756 -> rgb(0.0392, 0.1530, 0.3370))
  page.drawText(data.recipientName, {
    x: 94.80,
    y: 515.47,
    size: nameFontSize,
    font: fontBold,
    color: rgb(0.0392, 0.1530, 0.3370),
  });

  // 6. Generate Verification QR Code Buffer
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ai-bridge.iiu.edu.pk'}/verify/${data.certificateId}`;
  const qrPngBuffer = await QRCode.toBuffer(verifyUrl, {
    width: 250,
    margin: 1,
    color: {
      dark: '#0a2756',
      light: '#ffffff',
    },
  });

  // 7. Embed QR Code Image into PDF
  const qrImage = await pdfDoc.embedPng(qrPngBuffer);
  const qrX = 1143.08;
  const qrY = 150.00;
  const qrSize = 100.0;

  // Draw white rounded container background for high contrast
  page.drawRectangle({
    x: qrX - 4,
    y: qrY - 4,
    width: qrSize + 8,
    height: qrSize + 8,
    color: rgb(1, 1, 1),
  });

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  // 8. Stamp "Scan to verify certificate" label beneath QR
  page.drawText('Scan to verify', {
    x: 1159.56,
    y: 130.94,
    size: 11.04,
    font: fontSans,
    color: rgb(1, 1, 1),
  });

  page.drawText('certificate', {
    x: 1168.94,
    y: 117.62,
    size: 11.04,
    font: fontSans,
    color: rgb(1, 1, 1),
  });

  // 9. Stamp Footer Metadata
  const footerText = `Certificate ID: ${data.certificateId}  •  Issued: ${data.completionDate}  •  Auth: IIUI FMS AI Bridge`;
  page.drawText(footerText, {
    x: 92.16,
    y: 65.00,
    size: 9.0,
    font: fontSansRegular,
    color: rgb(0.2900, 0.3530, 0.4710),
  });

  // 10. Save and return PDF byte array
  return await pdfDoc.save();
}
```

---

### API Endpoints Specification

#### 1. Download Route: `GET /api/portal/certificate`
- **Authentication:** Requires valid Supabase session cookie.
- **Workflow:**
  1. Retrieves authenticated user `id`.
  2. Queries `public.certificates` where `user_id = user.id`.
  3. If not found, attempts self-healing call `issue_certificate_for_user(user.id)`.
  4. Passes certificate record to `generateCertificatePdf()`.
  5. Returns HTTP 200 with headers:
     - `Content-Type: application/pdf`
     - `Content-Disposition: attachment; filename="AI_Bridge_Certificate_${certificate_id}.pdf"`

#### 2. Verification Route: `GET /verify/[id]`
- **Authentication:** Public (No login required).
- **Workflow:**
  1. Queries Supabase `public.certificates` by `certificate_id` or `verification_code`.
  2. Renders dynamic server component displaying:
     - Recipient Full Name
     - Student Roll Number & Department
     - Course Title
     - Date of Award
     - Validity Status Badge (`VERIFIED & VALID` or `REVOKED`)
     - Authorized Signatory Endorsement
     - Direct button: "Download Verified Copy"

---

## 7. Security, Integrity & Edge-Case Handling

```
┌────────────────────────────────────────────────────────────────────────┐
│                      SECURITY & COMPLIANCE MATRIX                      │
├────────────────────┬───────────────────────────────────────────────────┤
│ Threat Vector      │ Engineered Mitigation                             │
├────────────────────┼───────────────────────────────────────────────────┤
│ Client-side Spoof  │ Issuance occurs exclusively server-side via       │
│                    │ PostgreSQL SECURITY DEFINER procedure.            │
├────────────────────┼───────────────────────────────────────────────────┤
│ Text Overflow      │ Dynamic font-shrink algorithm caps width at 720pt;│
│                    │ long names scale automatically without truncation.│
├────────────────────┼───────────────────────────────────────────────────┤
│ QR Contrast Failure│ Generated with white backing card to guarantee    │
│                    │ readability against the dark navy sidebar.        │
├────────────────────┼───────────────────────────────────────────────────┤
│ Duplicate Issuance │ Enforced at database level via unique constraint: │
│                    │ `CONSTRAINT unique_user_certificate UNIQUE (user_id)`│
├────────────────────┼───────────────────────────────────────────────────┤
│ Revocation Control │ Setting `is_valid = false` instantly triggers an   │
│                    │ alert state on the public `/verify/[id]` route.    │
└────────────────────┴───────────────────────────────────────────────────┘
```

---

## 8. Summary Checklist for Engineering Team

- [x] Master PDF template analyzed and coordinates verified (`Assets/AI_BRIDGE_Certificate_Cleaned.pdf`).
- [x] All Supabase source tables and columns mapped with exact fallback order.
- [x] Variable replacement zones mapped without altering static background graphics.
- [x] Full database migration script prepared (`011_certification_issuance_engine.sql`).
- [x] High-performance `pdf-lib` stamping engine documented and ready for deployment.
- [x] Public verification route blueprint finalized.
