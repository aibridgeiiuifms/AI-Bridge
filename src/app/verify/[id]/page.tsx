import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { 
  ShieldCheck, 
  ShieldAlert,
  Award, 
  Calendar, 
  BookOpen, 
  Building2, 
  CheckCircle, 
  Download,
  AlertTriangle
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id || '').trim();
  const cleanSuffix = decodedId.replace(/^AIB-/i, '').trim();

  // Public verification uses standard anon client (certificates has public SELECT policy)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ijwucoxajmlzpkcqvrpw.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_MTFDKPww9S28kVqsLbVKvA_gWGPn25H';
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Query by full certificate_id, AIB- prefixed suffix, wildcard suffix, or verification_code UUID
  const { data: cert } = await supabase
    .from('certificates')
    .select('*')
    .or(`certificate_id.ilike.${decodedId},certificate_id.ilike.AIB-${cleanSuffix},certificate_id.ilike.%${cleanSuffix}%,verification_code.ilike.${decodedId}`)
    .maybeSingle();

  // 1. Not Found View
  if (!cert) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <BackButton label="Back" fallback="/portal" />

        <div className="bg-white rounded-3xl border border-rose-200 shadow-xl overflow-hidden">
          <div className="bg-rose-700 text-white p-6 sm:p-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-rose-200 backdrop-blur-md">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-200">
                  Verification Registry
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Certificate Not Found
                </h1>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-800 text-white border border-rose-600">
              STATUS: UNREGISTERED
            </span>
          </div>

          <div className="p-6 sm:p-10 space-y-6 text-center">
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              The credential reference <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">{decodedId}</span> could not be found in the official IIUI FMS certification database.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-md mx-auto text-xs text-slate-500 text-left space-y-2">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Troubleshooting Checklist:
              </div>
              <ul className="list-disc pl-5 space-y-1">
                <li>Ensure the serial ID matches the format: <span className="font-mono text-slate-700">AIB-XXXXXXXX</span> (e.g. AIB-K7M2P9QR).</li>
                <li>Verify you scanned the authentic QR code on an issued certificate.</li>
                <li>If you completed all 3 evaluation steps recently, log into the Student Portal to generate your credential.</li>
              </ul>
            </div>

            <div>
              <Link
                href="/portal"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
              >
                Go to Student Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Revoked View
  if (!cert.is_valid) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <BackButton label="Back" fallback="/portal" />

        <div className="bg-white rounded-3xl border border-rose-300 shadow-xl overflow-hidden">
          <div className="bg-rose-900 text-white p-6 sm:p-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-rose-300 backdrop-blur-md">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-200">
                  Revocation Notice
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Certificate Revoked
                </h1>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-800 text-rose-100 border border-rose-700">
              STATUS: REVOKED
            </span>
          </div>

          <div className="p-6 sm:p-10 space-y-4 text-center">
            <p className="text-sm text-slate-700 max-w-lg mx-auto leading-relaxed">
              Certificate <span className="font-mono font-bold text-slate-900">{cert.certificate_id}</span> issued to <strong>{cert.recipient_name}</strong> was marked <strong>REVOKED</strong> by the Faculty of Management Sciences administration.
            </p>
            <p className="text-xs text-rose-600 font-medium">
              This credential is no longer valid or authentic.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Format date nicely (e.g. October 17, 2026)
  let formattedDate = cert.completion_date;
  try {
    const d = new Date(cert.completion_date);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  } catch (e) {
    // fallback to raw completion_date
  }

  // ── Department Resolution (Fixes the "FMS Everywhere" fallback bug) ──────────
  // Priority: student_id dept code → cert.department if not generic → graceful fallback
  const adminClient = createAdminClient();
  let deptDisplay = '';
  let facultyDisplay = '';

  if (cert.student_id) {
    // student_id format: "000627/BSBA/S24" — dept code is at index [1]
    const deptCode = cert.student_id.split('/')[1]?.toUpperCase();
    if (deptCode) {
      const { data: deptMap } = await adminClient
        .from('department_mappings')
        .select('standard_dept_name, faculty_name')
        .eq('code', deptCode)
        .maybeSingle();
      if (deptMap && deptMap.faculty_name !== 'Pending Assignment') {
        deptDisplay = deptMap.standard_dept_name;
        facultyDisplay = deptMap.faculty_name;
      } else {
        // Known code but no mapping yet — show raw code with IIUI as parent
        deptDisplay = deptCode;
        facultyDisplay = 'International Islamic University Islamabad (IIUI)';
      }
    }
  }

  // Fallbacks if dept code extraction failed
  if (!deptDisplay) {
    if (cert.department && cert.department !== 'Faculty of Management Sciences (FMS)') {
      deptDisplay = cert.department;
    } else if (!cert.student_id) {
      // External / non-IIUI participant with no roll number: leave completely blank
      deptDisplay = '';
      facultyDisplay = '';
    } else {
      // IIUI student whose dept could not be resolved from mappings
      deptDisplay = 'International Islamic University Islamabad (IIUI)';
    }
  }

  // ── Quiz Score (Best passing attempt for this user) ───────────────────────
  let quizScore: number | null = null;
  let quizTotal: number | null = null;
  if (cert.user_id) {
    const { data: attempt } = await adminClient
      .from('quiz_attempts')
      .select('score, total_questions')
      .eq('user_id', cert.user_id)
      .eq('passed', true)
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (attempt) {
      quizScore = attempt.score;
      quizTotal = attempt.total_questions ?? 12;
    }
  }

  // 3. Valid Verified Credential View
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8 animate-fade-in">
      <BackButton label="Back" fallback="/portal" />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Verification Status Header */}
        <div className="bg-emerald-800 text-white p-6 sm:p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 backdrop-blur-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                AUTHENTICATION STATUS
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Certificate Verified
              </h1>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-700 border border-emerald-500/50 text-white shadow-xs">
              STATUS: VERIFIED
            </span>
          </div>
        </div>

        {/* Certificate Credential Body */}
        <div className="p-6 sm:p-10 space-y-8">
          <div className="border-b border-slate-100 pb-6 text-center space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              This Digital Credential belongs to
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {cert.recipient_name}
            </h2>
            {cert.student_id ? (
              <p className="text-xs text-slate-500 font-medium">
                Registration / Roll No:{' '}
                <span className="font-mono text-slate-800 font-bold">{cert.student_id}</span>
                {deptDisplay ? (
                  <>
                    {' • '}
                    <span className="text-slate-700 font-semibold">{deptDisplay}</span>
                    {facultyDisplay ? (
                      <span className="text-slate-400"> · {facultyDisplay}</span>
                    ) : null}
                  </>
                ) : null}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                Course / Program
              </span>
              <p className="font-bold text-slate-900 text-sm">
                The AI Bridge: Source-Grounded AI & NotebookLM Mastery
              </p>
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Date of Award
              </span>
              <p className="font-bold text-slate-900 text-sm">{formattedDate}</p>
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Institution & Campaign
              </span>
              <p className="font-bold text-slate-900">International Islamic University Islamabad (IIUI)</p>
              <p className="text-[11px] text-slate-500">Hum Hain Pakistan (HHP) SDG Youth Campaign</p>
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Authorized Signatories
              </span>
              <p className="font-bold text-slate-900">Dr. Abdul Zahid Khan & Dr. Syed Zulfiqar Ali Shah</p>
              <p className="text-[11px] text-slate-500">Chairman TPM, FMS, IIUI & Dean FMS, IIUI</p>
            </div>
          </div>

          {/* Exam Score Badge — above download button */}
          {quizScore !== null && (
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-semibold text-emerald-800">
                  12-MCQ Exam
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-900 tabular-nums">
                {quizScore}/{quizTotal ?? 12} · {Math.round((quizScore / (quizTotal ?? 12)) * 100)}%
              </span>
            </div>
          )}

          {/* Download Official PDF Button */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
            <div className="text-xs text-emerald-900 text-center sm:text-left">
              <p className="font-bold">Official Document Copy</p>
              <p className="text-[11px] text-emerald-700 hidden sm:block">Generate and download an official verified PDF copy on the spot.</p>
            </div>
            <a
              href={`/api/portal/certificate?verify_id=${cert.certificate_id}`}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Official PDF</span>
            </a>
          </div>

          {/* Footer: Serial & Audit Summary */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-1.5 text-[11px] text-slate-400">
            <span>
              Serial:{' '}
              <span className="font-mono font-bold text-slate-700">{cert.certificate_id}</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle className="w-3 h-3" />
              Pre-Survey · Exam · Post-Survey Verified
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
