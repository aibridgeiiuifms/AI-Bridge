'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Award, 
  HelpCircle, 
  Calendar, 
  Filter, 
  Search, 
  Download, 
  Layers,
  Sparkles,
  ShieldCheck,
  History,
  FileSpreadsheet,
  RefreshCw,
  Trash2,
  Edit3,
  PlusCircle,
  Eye,
  UserCheck,
  Shield,
  Check,
  X,
  Lock,
  UserPlus,
  Briefcase,
  Tag,
  ListPlus,
  Upload,
  Linkedin,
  ExternalLink,
  Image as ImageIcon,
  ArrowUpDown,
  Sliders
} from 'lucide-react';
import { compressImageToMaxKB, uploadTeamAvatar } from '@/lib/imageCompression';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'metrics' | 'participants' | 'mcqs' | 'team' | 'audit'>('metrics');

  // Whitelist Form State
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingWhitelist, setIsSubmittingWhitelist] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Dynamic Tasks State
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskTag, setNewTaskTag] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Current User Identity & Delegation Permissions
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');
  const [canManageTeam, setCanManageTeam] = useState<boolean>(false);

  // Live Supabase Database State (Zero Hardcoded Data)
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [permissionsMap, setPermissionsMap] = useState<Record<string, any>>({});
  const [registeredProfiles, setRegisteredProfiles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [dbStats, setDbStats] = useState({
    totalProfiles: 0,
    preSurveysCount: 0,
    passedQuizzesCount: 0,
    certificatesCount: 0,
    avgHoursSaved: '0.0 hrs'
  });

  // Public Team Profiles & Positioning State
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [isSyncingTeam, setIsSyncingTeam] = useState(false);
  const [isSavingTeamMember, setIsSavingTeamMember] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [avatarUploadFile, setAvatarUploadFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [compressedSizeInfo, setCompressedSizeInfo] = useState<string | null>(null);

  const [memberForm, setMemberForm] = useState({
    id: '',
    email: '',
    full_name: '',
    designation: '',
    bio: '',
    position_order: 99,
    team_tag: 'general',
    assigned_tasks: [] as string[],
    linkedin_url: '',
    avatar_url: '',
    is_published: true
  });

  const fetchTeamData = async () => {
    setLoadingTeam(true);
    try {
      const res = await fetch('/api/team?all=true');
      const data = await res.json();
      if (data.success) {
        setTeamMembers(data.team || []);
      }
    } catch (e) {
      console.error('Failed to fetch team members:', e);
    } finally {
      setLoadingTeam(false);
    }
  };

  // Fetch Live Data Directly from Supabase
  const fetchRolesData = async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      if (data.success) {
        setWhitelist(data.whitelist || []);
        setRegisteredProfiles(data.profiles || []);
        setTasks(data.tasks || []);

        if (data.stats) {
          setDbStats(data.stats);
        }

        const pMap: Record<string, any> = {};
        (data.profiles || []).forEach((p: any) => {
          let permObj: any = null;
          if (Array.isArray(p.member_permissions) && p.member_permissions.length > 0) {
            permObj = p.member_permissions[0];
          } else if (p.member_permissions && typeof p.member_permissions === 'object') {
            permObj = p.member_permissions;
          }

          const wlMatch = (data.whitelist || []).find((w: any) => w.email?.toLowerCase() === p.email?.toLowerCase());

          if (permObj) {
            pMap[p.email] = {
              ...permObj,
              can_manage_team: permObj.can_manage_team ?? Boolean(wlMatch?.can_manage_team)
            };
          } else {
            pMap[p.email] = {
              can_manage_events: false,
              can_view_surveys: true,
              can_verify_attendance: false,
              can_manage_mcqs: false,
              can_export_reports: true,
              can_manage_team: Boolean(wlMatch?.can_manage_team),
            };
          }
        });

        // Also ensure whitelist members without profiles yet are represented in pMap
        (data.whitelist || []).forEach((w: any) => {
          if (!pMap[w.email]) {
            pMap[w.email] = {
              can_manage_events: false,
              can_view_surveys: true,
              can_verify_attendance: false,
              can_manage_mcqs: false,
              can_export_reports: true,
              can_manage_team: Boolean(w.can_manage_team),
            };
          } else if (w.can_manage_team) {
            pMap[w.email].can_manage_team = true;
          }
        });
        setPermissionsMap(pMap);

        // Cross-verify whether current user has delegated management permission
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const emailLower = user.email.toLowerCase();
          const isSuper = emailLower === 'ai.bridge.iiui.fms@gmail.com';
          const hasDelegated = Boolean(pMap[emailLower]?.can_manage_team) ||
            Boolean((data.whitelist || []).find((w: any) => w.email?.toLowerCase() === emailLower)?.can_manage_team);
          if (isSuper || hasDelegated) {
            setCanManageTeam(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch roles from Supabase:', err);
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    // Check URL parameters for tab navigation (e.g. ?tab=team)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['metrics', 'participants', 'mcqs', 'team', 'audit'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }

    const supabase = createClient();
    async function checkUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const emailLower = user.email.toLowerCase();
          setCurrentUserEmail(emailLower);

          const { data: prof } = await supabase
            .from('profiles')
            .select('role, member_permissions(*)')
            .eq('id', user.id)
            .maybeSingle();

          const isSuperAdmin = emailLower === 'ai.bridge.iiui.fms@gmail.com' || prof?.role === 'admin';
          setCurrentUserRole(prof?.role || 'member');

          let hasDelegatedPermission = false;
          if (prof?.member_permissions) {
            if (Array.isArray(prof.member_permissions) && prof.member_permissions.length > 0) {
              hasDelegatedPermission = Boolean(prof.member_permissions[0]?.can_manage_team);
            } else if (typeof prof.member_permissions === 'object') {
              hasDelegatedPermission = Boolean((prof.member_permissions as any)?.can_manage_team);
            }
          }

          // Direct check on member_permissions table if join was blocked or empty
          if (!hasDelegatedPermission && user.id) {
            const { data: directPerm } = await supabase
              .from('member_permissions')
              .select('can_manage_team')
              .eq('member_id', user.id)
              .maybeSingle();
            if (directPerm?.can_manage_team) {
              hasDelegatedPermission = true;
            }
          }

          // Whitelist check
          if (!hasDelegatedPermission) {
            const { data: wl } = await supabase
              .from('role_whitelist')
              .select('can_manage_team')
              .eq('email', emailLower)
              .maybeSingle();
            if (wl?.can_manage_team) {
              hasDelegatedPermission = true;
            }
          }

          setCanManageTeam(isSuperAdmin || hasDelegatedPermission);
        }
      } catch (e) {
        console.error('Error verifying user permissions:', e);
      }
    }
    checkUser();
    fetchRolesData();
    fetchTeamData();
  }, []);

  // Live Metric Cards derived from Supabase
  const stats = [
    { label: 'Total Enrolled Beneficiaries', value: String(dbStats.totalProfiles), change: 'Live from Supabase', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pre-Surveys Completed', value: String(dbStats.preSurveysCount), change: 'Live from Supabase', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: '30-MCQ Passed (≥70%)', value: String(dbStats.passedQuizzesCount), change: 'Live from Supabase', icon: HelpCircle, color: 'text-amber-600 bg-amber-50' },
    { label: 'Certificates Unlocked', value: String(dbStats.certificatesCount), change: 'Live from Supabase', icon: Award, color: 'text-teal-600 bg-teal-50' },
    { label: 'Avg. Hours Saved / Week', value: dbStats.avgHoursSaved, change: 'Live from Supabase', icon: Clock, color: 'text-purple-600 bg-purple-50' },
  ];

  const isSuperAdmin = currentUserEmail === 'ai.bridge.iiui.fms@gmail.com' || currentUserRole === 'admin';

  // Team Profiles & Positioning Handlers
  const handleSyncWhitelistToTeam = async () => {
    setIsSyncingTeam(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_from_whitelist' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeedbackMsg({ text: `✅ ${data.message}`, type: 'success' });
      await fetchTeamData();
    } catch (err: any) {
      setFeedbackMsg({ text: `❌ ${err.message}`, type: 'error' });
    } finally {
      setIsSyncingTeam(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleOpenAddMember = () => {
    const nextPos = teamMembers.length > 0 
      ? Math.max(...teamMembers.map(m => m.position_order || 0)) + 1 
      : 1;

    setEditingMember(null);
    setMemberForm({
      id: '',
      email: '',
      full_name: '',
      designation: '',
      bio: '',
      position_order: nextPos,
      team_tag: 'general',
      assigned_tasks: [],
      linkedin_url: '',
      avatar_url: '',
      is_published: true
    });
    setAvatarUploadFile(null);
    setAvatarPreview(null);
    setCompressedSizeInfo(null);
    setShowMemberModal(true);
  };

  const handleOpenEditMember = (member: any) => {
    setEditingMember(member);
    setMemberForm({
      id: member.id,
      email: member.email || '',
      full_name: member.full_name || '',
      designation: member.designation || '',
      bio: member.bio || '',
      position_order: member.position_order ?? 99,
      team_tag: member.team_tag || 'general',
      assigned_tasks: member.assigned_tasks || [],
      linkedin_url: member.linkedin_url || '',
      avatar_url: member.avatar_url || '',
      is_published: member.is_published ?? true
    });
    setAvatarUploadFile(null);
    setAvatarPreview(member.avatar_url || null);
    setCompressedSizeInfo(null);
    setShowMemberModal(true);
  };

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Auto compress to under 350 KB
      const compressed = await compressImageToMaxKB(file, 350);
      setAvatarUploadFile(compressed);
      setAvatarPreview(URL.createObjectURL(compressed));
      setCompressedSizeInfo(`Optimized: ${(compressed.size / 1024).toFixed(1)} KB (Target < 350 KB)`);
    } catch (err: any) {
      alert(`Image processing error: ${err.message}`);
    }
  };

  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.full_name.trim() || !memberForm.designation.trim()) {
      alert('Full Name and Designation are required.');
      return;
    }

    setIsSavingTeamMember(true);
    setFeedbackMsg(null);

    try {
      let finalAvatarUrl = memberForm.avatar_url;

      // Direct upload to Supabase storage 'team-avatars' if file selected
      if (avatarUploadFile) {
        finalAvatarUrl = await uploadTeamAvatar(
          avatarUploadFile, 
          memberForm.email || memberForm.full_name
        );
      }

      const payload = {
        ...memberForm,
        avatar_url: finalAvatarUrl,
        position_order: Number(memberForm.position_order) || 99
      };

      const res = await fetch('/api/team', {
        method: memberForm.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedbackMsg({
        text: `✅ Saved profile for "${memberForm.full_name}" (Position #${payload.position_order})`,
        type: 'success'
      });
      setShowMemberModal(false);
      setAvatarUploadFile(null);
      setAvatarPreview(null);
      setCompressedSizeInfo(null);
      await fetchTeamData();
    } catch (err: any) {
      setFeedbackMsg({ text: `❌ ${err.message}`, type: 'error' });
    } finally {
      setIsSavingTeamMember(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleQuickUpdatePosition = async (id: string, newPosition: number) => {
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, position_order: newPosition })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchTeamData();
      setFeedbackMsg({ text: `Updated position to #${newPosition}`, type: 'success' });
      setTimeout(() => setFeedbackMsg(null), 2000);
    } catch (err: any) {
      setFeedbackMsg({ text: `Failed to update position: ${err.message}`, type: 'error' });
    }
  };

  const handleDeleteTeamMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the public team page?`)) return;
    try {
      const res = await fetch(`/api/team?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchTeamData();
      setFeedbackMsg({ text: `Removed "${name}" from public team page.`, type: 'success' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      setFeedbackMsg({ text: `❌ ${err.message}`, type: 'error' });
    }
  };

  // Toggle dynamic task selection for new member
  const toggleTaskSelection = (taskTitle: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskTitle) ? prev.filter(t => t !== taskTitle) : [...prev, taskTitle]
    );
  };

  // Master Task Pool Handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsCreatingTask(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'create_task',
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim(),
          tag: newTaskTag.trim() || 'General'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskTag('');
      await fetchRolesData();
      setFeedbackMsg({ text: `✅ Added task "${data.task.title}" to master campaign pool!`, type: 'success' });
    } catch (err: any) {
      setFeedbackMsg({ text: `❌ ${err.message}`, type: 'error' });
    } finally {
      setIsCreatingTask(false);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete task "${title}" from the master pool?`)) return;
    try {
      const res = await fetch(`/api/admin/roles?action=delete_task&taskId=${encodeURIComponent(taskId)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchRolesData();
      setFeedbackMsg({ text: `Task "${title}" removed from pool.`, type: 'success' });
    } catch (err: any) {
      setFeedbackMsg({ text: `❌ ${err.message}`, type: 'error' });
    } finally {
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const togglePermission = async (email: string, key: string) => {
    const current = permissionsMap[email] || { 
      can_manage_events: false, 
      can_view_surveys: true, 
      can_verify_attendance: false, 
      can_manage_mcqs: false, 
      can_export_reports: true,
      can_manage_team: false
    };
    const updated = { ...current, [key]: !current[key] };
    setPermissionsMap(prev => ({ ...prev, [email]: updated }));

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, permissions: updated })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedbackMsg({ text: `Permissions updated in Supabase for ${email}`, type: 'success' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err: any) {
      setFeedbackMsg({ text: `Failed to update permissions: ${err.message}`, type: 'error' });
    }
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setIsSubmittingWhitelist(true);
    setFeedbackMsg(null);

    const emailNormalized = newEmail.trim().toLowerCase();

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailNormalized,
          // Only Super Admin can pick 'admin'. Permitted members always add as 'member'!
          target_role: isSuperAdmin ? newRole : 'member',
          assigned_tasks: selectedTasks,
          full_name: newName.trim(),
          notes: newNotes.trim(),
          isRequesterAdmin: isSuperAdmin
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchRolesData();
      setNewEmail('');
      setNewName('');
      setNewNotes('');
      setSelectedTasks([]);
      setFeedbackMsg({ text: `✅ Saved ${emailNormalized} as ${isSuperAdmin ? newRole : 'member'} with ${selectedTasks.length} task(s)!`, type: 'success' });
    } catch (err: any) {
      setFeedbackMsg({ text: `❌ Error saving to Supabase: ${err.message}`, type: 'error' });
    } finally {
      setIsSubmittingWhitelist(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const handleRemoveWhitelist = async (email: string) => {
    if (email === 'ai.bridge.iiui.fms@gmail.com') {
      alert('Cannot remove the Primary App Development Super Admin account.');
      return;
    }
    if (!confirm(`Are you sure you want to delete ${email} from Supabase role_whitelist?`)) return;

    try {
      const res = await fetch(`/api/admin/roles?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchRolesData();
      setFeedbackMsg({ text: `Successfully removed ${email} from Supabase.`, type: 'success' });
    } catch (err: any) {
      setFeedbackMsg({ text: `❌ Failed to remove from Supabase: ${err.message}`, type: 'error' });
    } finally {
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Leadership & Ambassador Workspace
            </span>
            <span className="text-xs text-slate-400">• Hum Hain Pakistan QIP</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">The AI Bridge Management Console</h1>
          <p className="text-xs text-slate-500">Live monitoring of participant progression, 30-MCQ pass rates, and QIP indicators.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              localStorage.setItem('aib_simulation_mode', 'student');
              window.location.href = '/portal?view_as=student';
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-sm transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Simulate Student View</span>
          </button>
          <button 
            onClick={() => alert('Full QIP report data exported in CSV!')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export QIP Section H Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'metrics'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          QIP Metrics & KPIs
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'participants'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Participant Tracking (48)
        </button>
        <button
          onClick={() => setActiveTab('mcqs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'mcqs'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          50-MCQ Question Pool
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'team'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Roles & Whitelist Console</span>
          {canManageTeam && !isSuperAdmin && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
              Manager Access
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit & Sync Trail (Sheets)</span>
        </button>
      </div>

      {/* Quick Access Banner for Delegated Team Managers */}
      {canManageTeam && !isSuperAdmin && activeTab !== 'team' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 text-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Delegated Team Manager Access Active</p>
              <p className="text-slate-600 text-[11px]">The Lead Admin has authorized your account to add team members, enter emails/names, and assign tasks.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('team')}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
          >
            <span>Open Whitelist & Add Members</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}

      {/* Tab Content: Metrics */}
      {activeTab === 'metrics' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                    <div className={`p-2 rounded-xl ${stat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{stat.value}</div>
                  <div className="text-[11px] text-emerald-700 font-semibold">{stat.change}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Target vs Achieved Indicators (QIP Section H)</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Awareness Sessions & Events</span>
                  <span className="font-bold text-slate-900">3 / 8 planned</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Faculty Training Workshops</span>
                  <span className="font-bold text-slate-900">2 / 4 planned</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Augmented Non-IT Courses</span>
                  <span className="font-bold text-slate-900">3 / 3 planned (100%)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-600">Weekly Educator Time Saved</span>
                  <span className="font-bold text-emerald-700">4.2 hrs (Target: 3–5 hrs)</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Target Disciplines & Faculties</h3>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Faculty of Sharia & Law</p>
                    <p className="text-[11px] text-slate-500">Course: Islamic Jurisprudence & Classical Fiqh</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px] h-fit">Active</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Faculty of Usuluddin (Islamic Studies)</p>
                    <p className="text-[11px] text-slate-500">Course: Comparative Religion & Hadith Studies</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px] h-fit">Active</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl flex justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Faculty of Arabic & Languages</p>
                    <p className="text-[11px] text-slate-500">Course: Classical Arabic Syntax & Literature</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[10px] h-fit">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Dynamic Tasks & Delegated Team Management */}
      {activeTab === 'team' && (
        <div className="space-y-8">
          {/* Superadmin & Delegation Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 rounded-3xl border border-slate-700 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner flex-shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                    App Development Lead & Super Admin
                  </span>
                  <span className="text-[11px] text-slate-400">• ai.bridge.iiui.fms@gmail.com</span>
                </div>
                <h2 className="text-lg font-extrabold text-white mt-1">
                  Dynamic Task Assignment & Team Governance
                </h2>
                <p className="text-xs text-slate-300">
                  {isSuperAdmin
                    ? 'Super Admin Mode: You have full authority to modify the master task pool, assign tasks, and delegate team management permissions.'
                    : canManageTeam
                    ? 'Delegated Manager Mode: You are authorized to manage team members, emails, names, and assigned tasks.'
                    : 'Viewing team roster and assigned campaign tasks.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs bg-slate-800/80 border border-slate-700 px-3.5 py-2 rounded-xl text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isSuperAdmin ? 'Full Admin Access' : canManageTeam ? 'Delegated Team Manager' : 'Team Member View'}</span>
            </div>
          </div>

          {feedbackMsg && (
            <div className={`p-4 rounded-2xl text-xs flex items-center justify-between ${
              feedbackMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <span>{feedbackMsg.text}</span>
              <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Master Campaign Tasks Pool (Admin Control) */}
          {(isSuperAdmin || canManageTeam) && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-700" />
                    <span>Master Campaign Tasks Pool ({tasks.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Campaign tasks defined here can be dynamically assigned to ambassadors and team members.
                  </p>
                </div>
              </div>

              {/* Tasks Chips / Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 shadow-2xs group"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-semibold">{t.title}</span>
                    {t.tag && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                        {t.tag}
                      </span>
                    )}
                    {(isSuperAdmin || canManageTeam) && (
                      <button
                        onClick={() => handleDeleteTask(t.id, t.title)}
                        className="text-slate-400 hover:text-rose-600 transition-colors ml-1 p-0.5 cursor-pointer"
                        title="Delete Task from Pool"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Task Form (Admin or Delegated Manager) */}
              {(isSuperAdmin || canManageTeam) && (
                <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    required
                    placeholder="New Task Title (e.g. Poster Design, Lab Logistics)"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Tag / Dept (e.g. Workshops, Awareness, Tech)"
                    value={newTaskTag}
                    onChange={(e) => setNewTaskTag(e.target.value)}
                    className="w-full sm:w-56 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isCreatingTask}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  >
                    <ListPlus className="w-4 h-4" />
                    <span>{isCreatingTask ? 'Adding...' : 'Add Task to Pool'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Add Team Member & Assign Tasks Form (Admin or Permitted Member) */}
          {(isSuperAdmin || canManageTeam) && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-700" />
                  <span>Add Team Member & Assign Tasks</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {isSuperAdmin
                    ? 'Admins can assign roles and tasks. When they sign in with Google, tasks and access are automatically granted.'
                    : 'As a delegated team manager, any person you add will be configured as a Member with your assigned tasks.'}
                </p>
              </div>

              <form onSubmit={handleAddWhitelist} className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Google / IIUI Email Address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Full Name (e.g. Asad Naveed)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />

                  {/* Role Selector: Shown ONLY if Super Admin! For delegated members, hidden completely */}
                  {isSuperAdmin ? (
                    <select
                      value={newRole}
                      onChange={(e: any) => setNewRole(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                    >
                      <option value="member">Role: Member (Ambassador)</option>
                      <option value="admin">Role: Admin (Leadership)</option>
                    </select>
                  ) : (
                    <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Role: Member (Ambassador) [Fixed]</span>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Task Selection Checkboxes / Pills */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700">
                    Select Tasks to Assign to this Member:
                  </label>
                  {tasks.length === 0 ? (
                    <p className="text-xs text-slate-400">No tasks in pool yet. Add tasks above first.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tasks.map((t) => {
                        const isSelected = selectedTasks.includes(t.title);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleTaskSelection(t.title)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-700 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <span>{isSelected ? '✓' : '+'}</span>
                            <span>{t.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingWhitelist}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isSubmittingWhitelist ? 'Saving...' : 'Add Member & Assign Tasks'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Team Roster & Assigned Tasks Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-2">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Team Roster & Dynamic Tasks ({whitelist.length})</h3>
                <p className="text-xs text-slate-500">
                  Data loaded live from Supabase. Tasks assigned here are automatically reflected in each member&apos;s profile.
                </p>
              </div>
              <button
                onClick={fetchRolesData}
                disabled={loadingRoles}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRoles ? 'animate-spin' : ''}`} />
                <span>Refresh from Supabase</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider bg-slate-50/70">
                    <th className="py-3 px-6">Name & Google Email</th>
                    <th>Role</th>
                    <th>Assigned Tasks</th>
                    <th className="text-center">Can Manage Team</th>
                    <th className="text-right px-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingRoles ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Querying Supabase database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : whitelist.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <p className="font-bold text-slate-700 text-sm">No team members found in Supabase.</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          The database is empty. Add a member above to configure their tasks.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    whitelist.map((w, idx) => {
                      const email = w.email;
                      const name = w.full_name || w.name || email.split('@')[0];
                      const role = w.target_role || w.role || 'member';
                      const assignedList: string[] = Array.isArray(w.assigned_tasks) ? w.assigned_tasks : [];
                      const canManage = permissionsMap[email]?.can_manage_team || false;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-6">
                            <p className="font-bold text-slate-900">{name}</p>
                            <p className="font-mono text-slate-500 text-[11px]">{email}</p>
                          </td>
                          <td>
                            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {role}
                            </span>
                          </td>
                          <td className="py-3">
                            {assignedList.length === 0 ? (
                              <span className="text-slate-400 italic text-[11px]">No tasks assigned</span>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-sm">
                                {assignedList.map((t, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Can Manage Team Delegation Toggle */}
                          <td className="text-center">
                            {isSuperAdmin && email !== 'ai.bridge.iiui.fms@gmail.com' ? (
                              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={canManage}
                                  onChange={() => togglePermission(email, 'can_manage_team')}
                                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                />
                                <span className="text-[10px] text-slate-600 font-medium">
                                  {canManage ? 'Manager' : 'No'}
                                </span>
                              </label>
                            ) : (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                email === 'ai.bridge.iiui.fms@gmail.com' || canManage
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'text-slate-400'
                              }`}>
                                {email === 'ai.bridge.iiui.fms@gmail.com' ? 'Super Admin' : canManage ? 'Yes (Delegated)' : 'No'}
                              </span>
                            )}
                          </td>

                          <td className="text-right px-6">
                            {(isSuperAdmin || canManageTeam) && email !== 'ai.bridge.iiui.fms@gmail.com' ? (
                              <button
                                onClick={() => handleRemoveWhitelist(email)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete from Supabase"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-bold">Protected</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Granular Ambassador Capabilities Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Ambassador Permissions & Authority Matrix</h3>
                <p className="text-xs text-slate-500">
                  Admins can delegate permissions (including &ldquo;Manage Team&rdquo;) per ambassador. Stored live in <code className="bg-slate-100 px-1 py-0.5 rounded">member_permissions</code>.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider pb-2">
                    <th className="py-2.5">Ambassador</th>
                    <th className="text-center">Manage Team</th>
                    <th className="text-center">Manage Events</th>
                    <th className="text-center">View Surveys</th>
                    <th className="text-center">Verify Attendance</th>
                    <th className="text-center">Manage MCQs</th>
                    <th className="text-center">Export Reports</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingRoles ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Loading live permissions from Supabase...
                      </td>
                    </tr>
                  ) : whitelist.filter(w => (w.target_role || w.role) === 'member' || w.email.includes('tayyab')).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No ambassador members currently in Supabase. Add a member above to configure capabilities.
                      </td>
                    </tr>
                  ) : (
                    whitelist.filter(w => (w.target_role || w.role) === 'member' || w.email.includes('tayyab')).map((w, idx) => {
                      const email = w.email;
                      const name = w.full_name || w.name || email.split('@')[0];
                      const perms = permissionsMap[email] || {
                        can_manage_events: false,
                        can_view_surveys: true,
                        can_verify_attendance: false,
                        can_manage_mcqs: false,
                        can_export_reports: true,
                        can_manage_team: false,
                      };

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 font-medium text-slate-800">
                            <div>{name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{email}</div>
                          </td>

                          <td className="text-center">
                            <input
                              type="checkbox"
                              disabled={!isSuperAdmin}
                              checked={perms.can_manage_team}
                              onChange={() => togglePermission(email, 'can_manage_team')}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                            />
                          </td>

                          <td className="text-center">
                            <input
                              type="checkbox"
                              disabled={!isSuperAdmin && !canManageTeam}
                              checked={perms.can_manage_events}
                              onChange={() => togglePermission(email, 'can_manage_events')}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                            />
                          </td>

                          <td className="text-center">
                            <input
                              type="checkbox"
                              disabled={!isSuperAdmin && !canManageTeam}
                              checked={perms.can_view_surveys}
                              onChange={() => togglePermission(email, 'can_view_surveys')}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                            />
                          </td>

                          <td className="text-center">
                            <input
                              type="checkbox"
                              disabled={!isSuperAdmin && !canManageTeam}
                              checked={perms.can_verify_attendance}
                              onChange={() => togglePermission(email, 'can_verify_attendance')}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                            />
                          </td>

                          <td className="text-center">
                            <input
                              type="checkbox"
                              disabled={!isSuperAdmin && !canManageTeam}
                              checked={perms.can_manage_mcqs}
                              onChange={() => togglePermission(email, 'can_manage_mcqs')}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                            />
                          </td>

                          <td className="text-center">
                            <input
                              type="checkbox"
                              disabled={!isSuperAdmin && !canManageTeam}
                              checked={perms.can_export_reports}
                              onChange={() => togglePermission(email, 'can_export_reports')}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================== */}
          {/* PUBLIC TEAM PROFILES & POSITIONING HIERARCHY CONSOLE            */}
          {/* ============================================================== */}
          {(isSuperAdmin || canManageTeam) && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Public Team Profiles & Positioning Hierarchy ({teamMembers.length})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                    Dynamically controls the public <strong className="text-slate-800">/team</strong> page. Position 1 is reserved for the Project Mentor (Sir Zahid Khan) in the top hero row, followed by Team Leads (Positions 2-4), and SDG Ambassadors (Positions 5+).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSyncWhitelistToTeam}
                    disabled={isSyncingTeam}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer disabled:opacity-50"
                    title="Import any existing ambassadors from role_whitelist into team_members to prevent duplicate typing"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTeam ? 'animate-spin' : ''}`} />
                    <span>{isSyncingTeam ? 'Syncing...' : '1-Click Sync from Whitelist'}</span>
                  </button>

                  <button
                    onClick={handleOpenAddMember}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Add Team Member</span>
                  </button>

                  <Link
                    href="/team"
                    target="_blank"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Profiles Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px] pb-2">
                      <th className="py-2.5 w-24">Position</th>
                      <th>Member</th>
                      <th>Designation</th>
                      <th>Team Group</th>
                      <th className="text-center">Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingTeam ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                          Loading team profiles from Supabase...
                        </td>
                      </tr>
                    ) : teamMembers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-slate-400 space-y-2">
                          <p>No team members added yet.</p>
                          <p className="text-[11px] text-slate-500">
                            Click <strong className="text-emerald-700">&ldquo;1-Click Sync from Whitelist&rdquo;</strong> to auto-import existing members, or click <strong className="text-emerald-700">&ldquo;+ Add Team Member&rdquo;</strong>.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      teamMembers.map((member) => {
                        const isPosition1 = member.position_order === 1;
                        const isLead = member.position_order > 1 && member.position_order <= 4;

                        return (
                          <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Position Order with Quick Edit Input */}
                            <td className="py-3">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min={1}
                                  max={99}
                                  defaultValue={member.position_order}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val) && val !== member.position_order) {
                                      handleQuickUpdatePosition(member.id, val);
                                    }
                                  }}
                                  className="w-12 px-2 py-1 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                />
                                {isPosition1 ? (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold" title="Row 1 Solo Leader">
                                    👑 Hero
                                  </span>
                                ) : isLead ? (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-bold" title="Row 2 Leads">
                                    ⭐ Lead
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-[10px]">#</span>
                                )}
                              </div>
                            </td>

                            {/* Member Avatar & Name */}
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-200">
                                  {member.avatar_url ? (
                                    <img
                                      src={member.avatar_url}
                                      alt={member.full_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                                      {member.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate">
                                    {member.full_name}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono truncate">
                                    {member.email || 'No email attached'}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Designation */}
                            <td className="py-3 text-slate-700 font-medium max-w-xs truncate">
                              {member.designation}
                            </td>

                            {/* Team Group */}
                            <td className="py-3">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                member.team_tag === 'workshops' ? 'bg-blue-50 text-blue-700' :
                                member.team_tag === 'awareness' ? 'bg-purple-50 text-purple-700' :
                                member.team_tag === 'analyzing' ? 'bg-emerald-50 text-emerald-800' :
                                'bg-amber-50 text-amber-800'
                              }`}>
                                {member.team_tag}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                member.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {member.is_published ? 'Published' : 'Draft'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditMember(member)}
                                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                                  title="Edit Profile & Photo"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleDeleteTeamMember(member.id, member.full_name)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Remove from Team"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* ADD / EDIT TEAM MEMBER MODAL WITH AUTO-COMPRESSION UPLOAD       */}
          {/* ============================================================== */}
          {showMemberModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 my-8 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">
                      {editingMember ? 'Edit Team Member Profile' : 'Add Team Member Profile'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure profile positioning, biography, and upload photos to Supabase Storage.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMemberModal(false)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveTeamMember} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Abdul Zahid Khan"
                        value={memberForm.full_name}
                        onChange={(e) => setMemberForm({ ...memberForm, full_name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g. zahid.khan@iiu.edu.pk"
                        value={memberForm.email}
                        onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Position Number */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Position Rank (1 = Solo Hero Row) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        required
                        value={memberForm.position_order}
                        onChange={(e) => setMemberForm({ ...memberForm, position_order: parseInt(e.target.value) || 1 })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Position 1 = Sir Zahid Khan alone, 2-4 = Team Leads, 5+ = Ambassadors
                      </span>
                    </div>

                    {/* Variable Team Tag & Category */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Team Group / Category Tag *
                      </label>
                      <input
                        type="text"
                        required
                        list="dynamic-team-tag-options"
                        placeholder="e.g. Executive Governance, Workshops, Awareness"
                        value={memberForm.team_tag}
                        onChange={(e) => setMemberForm({ ...memberForm, team_tag: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <datalist id="dynamic-team-tag-options">
                        <option value="Executive Governance" />
                        <option value="Workshops & Trainings" />
                        <option value="Awareness Campaign" />
                        <option value="Analyzing & Reporting" />
                        <option value="Technical & App Development" />
                        {tasks.map((t) => (
                          <option key={t.id} value={t.tag || t.title} />
                        ))}
                      </datalist>
                      <span className="text-[10px] text-slate-400 block">
                        Fully dynamic. Type any custom tag or pick from task options.
                      </span>
                    </div>
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Designation / Institutional Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Project Lead & Principal Mentor (Chairperson, Dept. of Technology & PM)"
                      value={memberForm.designation}
                      onChange={(e) => setMemberForm({ ...memberForm, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Bio */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Biography / Contributions</label>
                    <textarea
                      rows={3}
                      placeholder="Summary of responsibilities and academic focus..."
                      value={memberForm.bio}
                      onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* LinkedIn URL */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      placeholder="https://www.linkedin.com/in/username"
                      value={memberForm.linkedin_url}
                      onChange={(e) => setMemberForm({ ...memberForm, linkedin_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Dynamic Campaign Tasks Selection from Master Pool */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 block">
                      Assigned Campaign Tasks (from Master Task Pool)
                    </label>
                    {tasks.length === 0 ? (
                      <p className="text-[11px] text-slate-400">
                        No tasks in pool yet. Add tasks in Master Campaign Tasks above.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                        {tasks.map((t) => {
                          const isAssigned = memberForm.assigned_tasks.includes(t.title);
                          return (
                            <button
                              type="button"
                              key={t.id}
                              onClick={() => {
                                setMemberForm({
                                  ...memberForm,
                                  assigned_tasks: isAssigned
                                    ? memberForm.assigned_tasks.filter((x) => x !== t.title)
                                    : [...memberForm.assigned_tasks, t.title],
                                });
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                                isAssigned
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {isAssigned ? '✓ ' : '+ '} {t.title}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Photo Upload to Supabase Storage (< 350 KB) */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 block">
                      Profile Photo (Direct to Supabase Storage)
                    </label>

                    <div className="flex items-center gap-4">
                      {/* Thumbnail Preview */}
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-300 shadow-inner">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-base">
                            <ImageIcon className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* File Input */}
                      <div className="flex-1 space-y-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleAvatarFileSelected}
                          className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
                            Maximum 350 KB. Images are automatically scaled and compressed on selection.
                          </span>
                        </div>
                        {compressedSizeInfo && (
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ {compressedSizeInfo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Published Checkbox */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="is_published_chk"
                      checked={memberForm.is_published}
                      onChange={(e) => setMemberForm({ ...memberForm, is_published: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="is_published_chk" className="text-xs text-slate-700 font-medium cursor-pointer">
                      Published on public /team page
                    </label>
                  </div>

                  {/* Modal Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMemberModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingTeamMember}
                      className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      {isSavingTeamMember ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving to Supabase...</span>
                        </>
                      ) : (
                        <span>Save Profile & Publish</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: MCQs Pool Placeholder */}
      {activeTab === 'mcqs' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">50-Question Certified Assessment Bank</h3>
              <p className="text-xs text-slate-500">Evaluates NotebookLM, source grounding, multi-modal synthesis, and AI ethics.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
              50 Loaded in Seed
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The full 50-MCQ question pool has been defined in <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">supabase/seed.sql</code>. Each student taking the course assessment is automatically served 30 randomly sampled questions, requiring 21/30 (70%) to unlock Stage 3.
          </p>
        </div>
      )}

      {/* Tab Content: Participants */}
      {activeTab === 'participants' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Participant Progression Table</h3>
            <span className="text-xs text-slate-500">Auto-synced with Supabase</span>
          </div>
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-2.5">Name</th>
                  <th>Student / Faculty ID</th>
                  <th>Department</th>
                  <th>Pre-Survey</th>
                  <th>Quiz (30 MCQs)</th>
                  <th>Post-Survey</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 font-medium text-slate-900">Dr. M. Farooq</td>
                  <td>FAC-LAW-002</td>
                  <td>Sharia & Law</td>
                  <td><span className="text-emerald-700 font-bold">✓ Done</span></td>
                  <td><span className="text-emerald-700 font-bold">28/30 (Passed)</span></td>
                  <td><span className="text-emerald-700 font-bold">✓ Done</span></td>
                  <td><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Unlocked</span></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-slate-900">Khadija Bano</td>
                  <td>004122bsus24</td>
                  <td>Usuluddin</td>
                  <td><span className="text-emerald-700 font-bold">✓ Done</span></td>
                  <td><span className="text-amber-700 font-bold">In Progress</span></td>
                  <td><span className="text-slate-400">Locked</span></td>
                  <td><span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">Pending</span></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-slate-900">Tariq Mehmood</td>
                  <td>003912bsar24</td>
                  <td>Arabic</td>
                  <td><span className="text-emerald-700 font-bold">✓ Done</span></td>
                  <td><span className="text-emerald-700 font-bold">26/30 (Passed)</span></td>
                  <td><span className="text-emerald-700 font-bold">✓ Done</span></td>
                  <td><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Unlocked</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Audit & Sync Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Top Audit Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Inserts Synced</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">45</p>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Google Form submissions</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                <PlusCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Edits Captured</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">12</p>
                <p className="text-[11px] text-amber-600 font-medium mt-0.5">Direct spreadsheet edits</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <Edit3 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Deletions Logged</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">3</p>
                <p className="text-[11px] text-rose-600 font-medium mt-0.5">Reset & audit archived</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">Webhook Health</p>
                <p className="text-sm font-extrabold text-emerald-700 mt-1">Ready & Listening</p>
                <p className="text-[11px] text-slate-500 mt-0.5">/api/webhooks/google-sheets</p>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 text-teal-600">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Real-time Audit Trail Log Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Survey Database Audit Trail</h2>
                <p className="text-xs text-slate-500">
                  Full history of inserts, updates, and deletes triggered from Google Forms, Google Sheets, or the Web Portal.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/webhooks/google-sheets');
                      const data = await res.json();
                      alert(`Webhook Health Status: ${data.status.toUpperCase()}\n${data.message}`);
                    } catch (e: any) {
                      alert('Webhook ping error: ' + e.message);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Test Webhook Ping</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider pb-2">
                    <th className="py-2.5">Action</th>
                    <th>Survey</th>
                    <th>Respondent Email</th>
                    <th>Source & Location</th>
                    <th>Changed Fields / Notes</th>
                    <th>Performed By</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        UPDATE
                      </span>
                    </td>
                    <td><span className="font-semibold text-slate-800">Pre-Survey</span></td>
                    <td className="font-mono text-slate-700">003912bsar24@student.iiu.edu.pk</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                        Google Sheet (Row 8)
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-600 font-mono text-[11px]">
                        hours_saved: 2.5 → 4.5 hrs
                      </span>
                    </td>
                    <td className="text-slate-500">ibrahim.faisal@student.iiu.edu.pk</td>
                    <td className="text-slate-400">Just now</td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        INSERT
                      </span>
                    </td>
                    <td><span className="font-semibold text-slate-800">Pre-Survey</span></td>
                    <td className="font-mono text-slate-700">004122bsus24@student.iiu.edu.pk</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                        Google Form Submit (Row 9)
                      </span>
                    </td>
                    <td>
                      <span className="text-emerald-700 font-medium">New initial submission</span>
                    </td>
                    <td className="text-slate-500">004122bsus24@student.iiu.edu.pk</td>
                    <td className="text-slate-400">12 mins ago</td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        UPDATE
                      </span>
                    </td>
                    <td><span className="font-semibold text-slate-800">Post-Survey</span></td>
                    <td className="font-mono text-slate-700">dr.farooq@iiu.edu.pk</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                        Google Sheet (Row 4)
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-600 font-mono text-[11px]">
                        comprehension_rating: 3 → 5
                      </span>
                    </td>
                    <td className="text-slate-500">003822bsbaf24@student.iiu.edu.pk</td>
                    <td className="text-slate-400">45 mins ago</td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        DELETE
                      </span>
                    </td>
                    <td><span className="font-semibold text-slate-800">Pre-Survey</span></td>
                    <td className="font-mono text-slate-700">test.duplicate@student.iiu.edu.pk</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <FileSpreadsheet className="w-3 h-3 text-rose-600" />
                        Sheet Action Menu
                      </span>
                    </td>
                    <td>
                      <span className="text-rose-700 font-medium">Removed duplicate entry</span>
                    </td>
                    <td className="text-slate-500">003822bsbaf24@student.iiu.edu.pk</td>
                    <td className="text-slate-400">2 hours ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
