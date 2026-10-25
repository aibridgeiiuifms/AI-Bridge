# Training Material Feature — Full Plan

---

## In One Line

Add a **Learning Resources** section at the **top of the student portal** where students can browse, preview, download, and share study material — and admins can manage everything from inside the app.

---

## What the Student Sees

### Top of `/portal` page — Learning Resources section

```
┌─────────────────────────────────────────────────────┐
│  📚 Learning Resources                              │
│                                                     │
│  🔍 Search...     [All] [PDF] [Video] [Link] [Audio]│
│                                                     │
│  ── Intro to AI ──────────────────────────────────  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ 🎬 Video │  │ 📄 PDF   │  │ 🔗 Link  │          │
│  │ Title    │  │ Title    │  │ NotebookLM│          │
│  │ Short    │  │ Short    │  │ Short    │          │
│  │ desc...  │  │ desc...  │  │ desc...  │          │
│  │          │  │          │  │          │          │
│  │[Preview] │  │[Preview] │  │[Open →]  │          │
│  │[Download]│  │[Download]│  │[Copy Link]│          │
│  │ ☐ Watched│  │ ☑ Watched│  │ ☐ Watched│          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│  ── Source Grounding ──────────────────────────── │
│  ┌──────────┐  ┌──────────┐                         │
│  │ 🎙 Audio │  │ 📄 PDF   │                         │
│  │  ...     │  │  ...     │                         │
│  └──────────┘  └──────────┘                         │
│                                                     │
│  ── AI Podcasts ────────────────────────────────── │
│  ...                                               │
└─────────────────────────────────────────────────────┘
```

**When student clicks Preview →** a popup (modal) opens:
- **PDF** → PDF viewer inside the popup
- **YouTube link** → embedded YouTube video player
- **Audio** → audio player bar
- **Link** → opens in new browser tab (no preview)

**Each card has 3 actions:**
1. **Preview** — view inside the app
2. **Download** — download the file
3. **Copy Link** — copy shareable URL

**Mark as Watched** — student can tick ✅ any resource. Optional, has no effect on certification.

**Modules** — all shown on screen at once, separated by headings. Admin can create/rename modules freely.

---

## What the Admin Sees

### Inside `/dashboard` — New "Resources" tab

```
┌─────────────────────────────────────────────────────┐
│  Resources                    [+ Add New Resource]  │
│                                                     │
│  Title          Module         Type    Active Actions│
│  ─────────────────────────────────────────────────  │
│  Intro to AI    Intro          Video   ✅   ✏️ 🗑️  │
│  NLM Guide      Source Ground  PDF     ✅   ✏️ 🗑️  │
│  NotebookLM     Links          Link    ✅   ✏️ 🗑️  │
│  Podcast Ep1    AI Podcasts    Audio   ✅   ✏️ 🗑️  │
└─────────────────────────────────────────────────────┘
```

**When admin clicks + Add New Resource →** a form opens with:
- Title
- Short description
- Module name (free text — admin decides the name)
- Type → PDF / Video / Link / Audio
- URL → paste link OR upload file to Supabase Storage
- Sort order (which card appears first)
- Active toggle (show/hide without deleting)

**Who can manage resources:**
- **Admin** — full access always
- **Members** — admin can grant/revoke resource management access per member

---

## File Storage

| Situation | How it works |
|---|---|
| PDFs, audio files | Upload directly to **Supabase Storage** from admin panel |
| YouTube, Google Drive, websites | Paste the **external URL** — no upload needed |

Both options available in the same "Add Resource" form.

---

## Database — 2 Tables

### `training_resources` — stores all material

| Column | What it stores |
|---|---|
| `id` | Unique ID |
| `title` | Resource name |
| `description` | Short description |
| `module` | Module/topic name (e.g. "Intro to AI") |
| `type` | pdf / video / link / audio |
| `url` | Link to the file or external URL |
| `sort_order` | Controls display order |
| `is_active` | Show or hide without deleting |
| `created_at` | Date added |

### `student_resource_progress` — tracks watched status

| Column | What it stores |
|---|---|
| `student_id` | Which student |
| `resource_id` | Which resource they marked |
| `watched_at` | When they marked it |

---

## Files to Create

| File | What it does |
|---|---|
| `supabase/migrations/020_training_resources.sql` | Creates the 2 DB tables |
| `app/api/portal/resources/route.ts` | API — GET for students, POST/PUT/DELETE for admin/members |
| `components/ResourceCard.tsx` | Single resource card (preview + download + share + watched) |
| `components/ResourcePreviewModal.tsx` | Popup with PDF viewer / YouTube embed / audio player |
| `components/ResourcesHub.tsx` | Full section: search bar, filters, module headings, all cards |
| `components/AdminResourcesPanel.tsx` | Admin table + add/edit/delete + file upload form |

---

## Changes to Existing Files

| File | Change |
|---|---|
| `src/app/portal/page.tsx` | Add `<ResourcesHub />` at the **top** of the portal content |
| `src/app/dashboard/page.tsx` | Add **"Resources" tab** with `<AdminResourcesPanel />` |

---

## Build Order (Step by Step)

1. **DB migration** → create `training_resources` + `student_resource_progress` tables
2. **API route** → `/api/portal/resources` with admin/member auth guard
3. **`ResourceCard`** → card UI with all 3 actions + watched toggle
4. **`ResourcePreviewModal`** → PDF / YouTube / audio popup
5. **`ResourcesHub`** → full student-facing section with search + filter + modules
6. **`AdminResourcesPanel`** → admin CRUD panel with file upload
7. **Embed in portal + dashboard** → wire everything together
8. **Build ✅ → test → commit**

---

## Commits Plan

| # | Commit |
|---|---|
| 1 | `feat: add training_resources DB migration and API route` |
| 2 | `feat: add ResourceCard, ResourcePreviewModal, ResourcesHub components` |
| 3 | `feat: add AdminResourcesPanel with file upload and member access control` |
| 4 | `feat: embed ResourcesHub in portal and AdminResourcesPanel in dashboard` |

---

## Rules (Non-negotiable)

- All enrolled students see **all resources** — no gating, no unlocking
- Marking as watched is **optional** — zero impact on certification
- **NotebookLM** is just a link card → opens `notebooklm.google.com` in new tab
- **Module names are not hardcoded** — admin creates and names them freely
- Admins can **grant resource management access** to specific members
