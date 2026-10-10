# The AI Bridge Web Application

**Hum Hain Pakistan (HHP) – SDG Youth Campaign Pilot Project**  
**Faculty of Management Sciences (FMS), International Islamic University Islamabad (IIUI)**

- **Principal Mentor & Project Lead:** Dr. Abdul Zahid Khan (Chairperson, Department of Technology & Project Management)
- **Team Leads:** Asad Naveed Akbar & Muhammad Sohaib Latif
- **Team:** 10 FMS SDG Ambassadors (Awareness, Workshops & Trainings, Analyzing & Reporting)

---

## Phase 1 Implementation Summary

Phase 1 establishes the complete foundation, authentication layer, and database architecture:

1. **Next.js 15 App Router & TypeScript Scaffolding**: Configured with Tailwind CSS, Lucide icons, and modern IIUI academic branding tokens.
2. **Supabase Database Architecture (`supabase/schema.sql`)**:
   - `profiles`: User accounts with roles (`admin`, `member`, `student`).
   - `member_permissions`: Granular admin toggles per ambassador.
   - `events`: Activity tracking with SDG tags and public/internal visibility.
   - `mcq_pool`: 50-question question bank for dynamic 30-MCQ course assessment.
   - `surveys`: Pre-survey and Post-survey response collection with hours-saved estimation.
   - `quiz_attempts`: Score tracking, drawn questions, passing status (70% threshold).
   - `certificates`: Official verifiable credentials with unique QR verification codes.
   - `system_settings`: Platform metadata and configuration.
   - Row Level Security (RLS) policies and automated user profile creation triggers.
3. **Database Seed (`supabase/seed.sql`)**:
   - Full 50-MCQ question pool loaded across NotebookLM foundations, Audio Overviews, prompt engineering, and AI ethics.
   - Default campaign events seeded.
4. **App Routes & UI**:
   - `/`: Homepage with 3-Step Certification journey explanation, SDG alignment, and leadership overview.
   - `/login`: Supabase Google OAuth + Email authentication.
   - `/portal`: Participant portal with interactive 3-step lifecycle progress tracker.
   - `/dashboard`: Ambassador & Admin management dashboard with QIP Section H indicators.
   - `/events`: Photographic and activity evidence gallery.
   - `/verify/[id]`: Public verification route for employers and evaluators scanning certificate QR codes.
   - `/auth/callback`: Server-side OAuth session exchange.

---

## Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase Database
1. Open your Supabase project dashboard.
2. Go to **SQL Editor**.
3. Copy and run [`supabase/schema.sql`](supabase/schema.sql).
4. Copy and run [`supabase/seed.sql`](supabase/seed.sql).

### 3. Set Up Environment Variables
Create `.env.local` based on `.env.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
