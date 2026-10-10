import Link from 'next/link';
import { 
  ShieldCheck, 
  Award, 
  Calendar, 
  User, 
  BookOpen, 
  Building2, 
  CheckCircle, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8">
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
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-700 border border-emerald-500/50 text-white">
              STATUS: {certificateData.status}
            </span>
          </div>
        </div>

        {/* Certificate Credential Body */}
        <div className="p-6 sm:p-10 space-y-8">
          <div className="border-b border-slate-100 pb-6 text-center space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              This credential certifies that
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {certificateData.recipientName}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              ID / Reg No: <span className="font-mono text-slate-700">{certificateData.studentId}</span> • {certificateData.department}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                Course / Program
              </span>
              <p className="font-bold text-slate-900 text-sm">{certificateData.courseName}</p>
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Date of Award
              </span>
              <p className="font-bold text-slate-900 text-sm">{certificateData.completionDate}</p>
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Institution & Campaign
              </span>
              <p className="font-bold text-slate-900">{certificateData.institution}</p>
              <p className="text-[11px] text-slate-500">{certificateData.campaign}</p>
            </div>

            <div className="space-y-1 bg-slate-50 p-4 rounded-2xl">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Authorized Signatory
              </span>
              <p className="font-bold text-slate-900">{certificateData.signatory}</p>
              <p className="text-[11px] text-slate-500">{certificateData.signatoryTitle}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <div className="text-slate-500">
              Certificate Serial: <span className="font-mono font-bold text-slate-900">{certificateData.certificateId}</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold">
              <CheckCircle className="w-4 h-4" />
              <span>3-Step Evaluation Verified (Pre-Survey • 30-MCQ Quiz • Post-Survey)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
