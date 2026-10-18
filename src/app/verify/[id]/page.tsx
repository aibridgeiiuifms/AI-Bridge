import Link from 'next/link';
import { 
  ShieldCheck, 
  ShieldAlert,
  Award, 
  Calendar, 
  User, 
  BookOpen, 
  Building2, 
  CheckCircle, 
  ArrowLeft,
  Download,
  AlertTriangle
} from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id || '').trim();

  const supabase = createAdminClient();

  // Case-insensitive query against public.certificates by serial or verification UUID
  const { data: cert, error } = await supabase
    .from('certificates')
    .select('*')
    .or(`certificate_id.ilike.${decodedId},verification_code.ilike.${decodedId}`)
    .maybeSingle();

  // 1. Not Found View
  if (!cert || error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

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
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

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

  // 3. Valid Verified Credential View
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8 animate-fade-in">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Verification Status Header */}
        <div className="bg-emerald-800 text-white p-6 sm:p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 backdrop-blur-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                Official Credential Verification
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Valid & Authentic Certificate
              </h1>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-700 border border-emerald-500/50 text-white shadow-xs">
              STATUS: VERIFIED & VALID
            </span>
          </div>
        </div>

        {/* Certificate Credential Body */}
        <div className="p-6 sm:p-10 space-y-8">
          <div className="border-b border-slate-100 pb-6 text-center space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              This official credential certifies that
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {cert.recipient_name}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {cert.student_id ? (
                <>
                  Registration / Roll No: <span className="font-mono text-slate-800 font-bold">{cert.student_id}</span> •{' '}
                </>
              ) : null}
              {cert.department || 'Faculty of Management Sciences (FMS)'}
            </p>
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
              <p className="font-bold text-slate-900">Dr. Abdul Zahid Khan & Prof. Dr. Ahmed Shuja Syed</p>
              <p className="text-[11px] text-slate-500">Chairperson TPM, FMS & Vice President (Research & Enterprise), IIUI</p>
            </div>
          </div>

          {/* Download Official PDF Button */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-emerald-900">
              <p className="font-bold">Official Document Copy</p>
              <p className="text-[11px] text-emerald-700">Generate and download an official verified PDF copy on the spot.</p>
            </div>
            <a
              href={`/api/portal/certificate?verify_id=${cert.certificate_id}`}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Official PDF</span>
            </a>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="text-slate-500">
              Certificate Serial: <span className="font-mono font-bold text-slate-900">{cert.certificate_id}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>3-Step Evaluation Verified (Pre-Survey • 12-MCQ Quiz • Post-Survey)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
