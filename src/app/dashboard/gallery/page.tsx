'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { hasAmbassadorPortalRole } from '@/lib/access';
import { 
  ArrowLeft, 
  Sparkles, 
  Folder, 
  ShieldCheck, 
  Lock 
} from 'lucide-react';
import GalleryManager from '@/components/dashboard/GalleryManager';
import SdgLoading from '@/components/SdgLoading';

export default function GalleryDashboardPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const supabase = createClient();
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) {
          setAuthorized(false);
          return;
        }

        const emailLower = user.email.toLowerCase();
        setUserEmail(emailLower);

        const { data: prof } = await supabase
          .from('profiles')
          .select('role, members(can_manage_team, can_manage_gallery)')
          .eq('id', user.id)
          .maybeSingle();

        const isSuperAdmin = emailLower === 'ai.bridge.iiui.fms@gmail.com' || prof?.role === 'admin';
        const rawMember = Array.isArray(prof?.members) ? prof?.members[0] : prof?.members;
        const canManage = isSuperAdmin || Boolean(rawMember?.can_manage_gallery) || Boolean(rawMember?.can_manage_team);

        setAuthorized(canManage);
      } catch (err) {
        console.error('Error verifying gallery access:', err);
        setAuthorized(false);
      }
    }
    checkAuth();
  }, []);

  if (authorized === null) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <SdgLoading size={36} label="Checking credentials" />
        <p className="text-xs font-semibold text-slate-500">Checking credentials...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-red-100 text-red-700 flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-black text-slate-900">Access Restricted</h1>
        <p className="text-xs text-slate-500 leading-relaxed">
          You must be an administrator or have designated gallery management permissions to access this control panel.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Return Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Main Dashboard</span>
        </Link>

        <span className="text-[11px] font-semibold text-slate-400">
          Signed in as <span className="text-slate-600 font-bold">{userEmail}</span>
        </span>
      </div>

      {/* Render Main Gallery Manager */}
      <GalleryManager />
    </div>
  );
}
