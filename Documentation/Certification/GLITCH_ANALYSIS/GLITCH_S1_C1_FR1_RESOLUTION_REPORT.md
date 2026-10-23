# Glitch Resolution Report — S-1, C-1, FR-1

**Date:** 2026-10-24  
**Commit:** `bb10924`  
**Build Result:** ✅ Exit code 0 — 21 routes, zero TypeScript errors

---

## S-1 · System — PDF Template Not Bundled by Vercel Serverless

**File:** `next.config.ts`

### Problem
Vercel Serverless functions only bundle files explicitly declared. The certificate template `Assets/AI_BRIDGE_Certificate_Cleaned.pdf` was committed to Git but not declared in Next.js config, so it was silently excluded from the Vercel deployment bundle — causing `ENOENT` at runtime when the certificate generator tried to read the file.

### Fix
Added `outputFileTracingIncludes` to `nextConfig`:

```ts
outputFileTracingIncludes: {
  '/api/portal/certificate': ['./Assets/**/*'],
},
```

### Result
Vercel now guarantees the entire `Assets/` folder is included in the `/api/portal/certificate` serverless function bundle. Certificate generation will not fail due to missing template.

---

## C-1 · Code — Quiz Gate Always Ran Under User RLS (Never Admin)

**File:** `src/app/api/portal/quiz/route.ts` · Line 145

### Problem
```ts
// BEFORE (BUG)
const dbClient = supabase || adminSupabase;
```
The `supabase` client is always a **truthy instantiated object** — even if the user session is invalid or expired. JavaScript's `||` operator returns the first truthy value, so `adminSupabase` was **never** selected. The pre-survey existence check ran under user-level RLS, which could silently return no rows if session timing was off — incorrectly locking a student out of the quiz.

### Fix
```ts
// AFTER (CORRECT)
const dbClient = adminSupabase;
```
Always use the service-role admin client to bypass RLS for the gate check. This is safe: the gate only checks survey existence (read-only), not sensitive data.

### Result
Students who have completed the Pre-Survey will never be incorrectly blocked from the quiz due to session latency or RLS timing issues.

---

## FR-1 · Frontend — "Verify Status" Triggered Download When Cert Not in DB

**File:** `src/app/portal/page.tsx` · Lines 638–671

### Problem
When a student was eligible (`certificateReady = true`) but the certificate hadn't been generated yet (`certificate?.certificate_id = null`), the "Verify Status" button was rendered with `href="#"` and an `onClick` that called `handleDownloadCertificate()`. This was confusing — clicking what looked like a verification link silently triggered a PDF download.

### Fix
Two behavioural changes:

1. **"Verify Status" link** — only rendered when `certificate?.certificate_id` is a real value. When null, the element is hidden entirely (`null`).
2. **Download button label** — switches between:
   - `"Download PDF Certificate"` — when cert already exists in DB
   - `"Generate & Download Certificate"` — when cert not yet generated (first time)

### Result
| State | UI |
|---|---|
| Eligible, cert not yet generated | Single amber button: **Generate & Download Certificate** |
| Eligible, cert exists in DB | White **Verify Status** link + amber **Download PDF Certificate** button |

No broken `href="#"` links. No accidental downloads when clicking verification.

---

## Build Verification

```
✓ Compiled successfully in 19.5s
✓ Linting and checking validity of types
✓ Generating static pages (21/21)
Exit code: 0
```

All 3 glitches — **RESOLVED** ✅
