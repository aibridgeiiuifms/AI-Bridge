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
  AlertCircle,
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
  Pencil,
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
  Sliders,
  ChevronUp,
  ChevronDown,
  EyeOff
} from 'lucide-react';
import { compressImageToMaxKB, uploadTeamAvatar } from '@/lib/imageCompression';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'team' | 'team_profiles' | 'departments' | 'mcqs'>('team');
  // Inline-edit state for whitelist rows
  const [editingWhitelistEmail, setEditingWhitelistEmail] = useState<string | null>(null);
  const [editWhitelistDraft, setEditWhitelistDraft] = useState<{ full_name: string; target_role: 'admin' | 'member'; assigned_tasks: string[]; notes: string }>({ full_name: '', target_role: 'member', assigned_tasks: [], notes: '' });
  const [isSavingWhitelist, setIsSavingWhitelist] = useState(false);

  // Master MCQ Pool State
  const [mcqsList, setMcqsList] = useState<any[]>([]);
  const [loadingMcqs, setLoadingMcqs] = useState(false);
  const [mcqSearchQuery, setMcqSearchQuery] = useState('');
  const [mcqCategoryFilter, setMcqCategoryFilter] = useState('all');
  const [mcqDifficultyFilter, setMcqDifficultyFilter] = useState('all');
  const [mcqStatusFilter, setMcqStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [availableMcqCategories, setAvailableMcqCategories] = useState<string[]>([]);
  const [showMcqModal, setShowMcqModal] = useState(false);
  const [editingMcq, setEditingMcq] = useState<any | null>(null);
  const [isSavingMcq, setIsSavingMcq] = useState(false);
  const [mcqFeedbackMsg, setMcqFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [mcqForm, setMcqForm] = useState({
    id: '',
    question_text: '',
    options: ['', '', '', ''],
    correct_option_index: 0,
    explanation: '',
    category: 'NotebookLM Foundations',
    difficulty: 'intermediate',
    is_active: true,
  });

  // Department & Faculty Mappings State
  const [departmentMappings, setDepartmentMappings] = useState<any[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [deptFacultyFilter, setDeptFacultyFilter] = useState('all');
  const [editingDeptCode, setEditingDeptCode] = useState<string | null>(null);
  const [deptEditForm, setDeptEditForm] = useState({
    code: '',
    standard_dept_name: '',
    faculty_name: '',
    faculty_code: ''
  });
  const [isSavingDept, setIsSavingDept] = useState(false);
  const [deptFeedbackMsg, setDeptFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptForm, setNewDeptForm] = useState({
    code: '',
    standard_dept_name: '',
    faculty_name: '',
    faculty_code: ''
  });

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

  // Public Team Profiles Filter & Search State
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [profileTagFilter, setProfileTagFilter] = useState('all');
  const [profileStatusFilter, setProfileStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [autofillEmailSelected, setAutofillEmailSelected] = useState('');

  const [memberForm, setMemberForm] = useState({
    id: '',
    email: '',
    full_name: '',
    designation: '',
    bio: '',
    position_order: 99,
    team_tag: 'Executive Governance',
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

  const fetchDepartmentMappings = async () => {
    setLoadingDepts(true);
    try {
      const res = await fetch('/api/admin/departments');
      const data = await res.json();
      if (data.success && data.departments) {
        setDepartmentMappings(data.departments);
      }
    } catch (e) {
      console.error('Failed to fetch department mappings:', e);
    } finally {
      setLoadingDepts(false);
    }
  };

  const fetchMCQs = async () => {
    setLoadingMcqs(true);
    try {
      const res = await fetch('/api/admin/mcqs');
      const data = await res.json();
      if (data.success && data.mcqs) {
        setMcqsList(data.mcqs);
        setAvailableMcqCategories(data.categories || []);
      }
    } catch (e) {
      console.error('Failed to fetch MCQs:', e);
    } finally {
      setLoadingMcqs(false);
    }
  };

  const handleToggleMcqStatus = async (id: string, currentStatus: boolean) => {
    setMcqsList(prev => prev.map(m => m.id === id ? { ...m, is_active: !currentStatus } : m));
    try {
      const res = await fetch('/api/admin/mcqs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMcqFeedbackMsg({
        text: !currentStatus ? 'Question activated for quizzes!' : 'Question deactivated (hidden from student quizzes).',
        type: 'success'
      });
      setTimeout(() => setMcqFeedbackMsg(null), 3000);
    } catch (err: any) {
      fetchMCQs();
      setMcqFeedbackMsg({ text: `Failed to update status: ${err.message}`, type: 'error' });
    }
  };

  const handleOpenAddMcq = () => {
    setEditingMcq(null);
    setMcqForm({
      id: '',
      question_text: '',
      options: ['', '', '', ''],
      correct_option_index: 0,
      explanation: '',
      category: availableMcqCategories[0] || 'NotebookLM Foundations',
      difficulty: 'intermediate',
      is_active: true,
    });
    setShowMcqModal(true);
  };

  const handleOpenEditMcq = (mcq: any) => {
    setEditingMcq(mcq);
    const opts = Array.isArray(mcq.options) && mcq.options.length === 4
      ? mcq.options
      : ['', '', '', ''];
    setMcqForm({
      id: mcq.id,
      question_text: mcq.question_text || '',
      options: opts,
      correct_option_index: Number(mcq.correct_option_index) || 0,
      explanation: mcq.explanation || '',
      category: mcq.category || 'NotebookLM Foundations',
      difficulty: mcq.difficulty || 'intermediate',
      is_active: mcq.is_active ?? true,
    });
    setShowMcqModal(true);
  };

  const handleSaveMcq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mcqForm.question_text.trim()) {
      alert('Question text is required.');
      return;
    }
    if (mcqForm.options.some(opt => !opt.trim())) {
      alert('All 4 option choices are required.');
      return;
    }

    setIsSavingMcq(true);
    setMcqFeedbackMsg(null);

    try {
      const res = await fetch('/api/admin/mcqs', {
        method: mcqForm.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mcqForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMcqFeedbackMsg({
        text: mcqForm.id ? 'Question updated successfully!' : 'New question added to pool!',
        type: 'success'
      });
      setShowMcqModal(false);
      await fetchMCQs();
    } catch (err: any) {
      setMcqFeedbackMsg({ text: `Error: ${err.message}`, type: 'error' });
    } finally {
      setIsSavingMcq(false);
      setTimeout(() => setMcqFeedbackMsg(null), 4000);
    }
  };

  const handleDeleteMcq = async (id: string, text: string) => {
    if (!confirm(`Are you sure you want to deactivate question:\n"${text.substring(0, 80)}..."?`)) return;
    try {
      const res = await fetch(`/api/admin/mcqs?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMcqFeedbackMsg({ text: 'Question deactivated safely.', type: 'success' });
      await fetchMCQs();
      setTimeout(() => setMcqFeedbackMsg(null), 3000);
    } catch (err: any) {
      setMcqFeedbackMsg({ text: `Failed to deactivate: ${err.message}`, type: 'error' });
    }
  };

  const handleSaveDept = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingDept(true);
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptEditForm)
      });
      const data = await res.json();
      if (data.success) {
        setDeptFeedbackMsg({ text: `Updated ${deptEditForm.code} successfully!`, type: 'success' });
        setEditingDeptCode(null);
        await fetchDepartmentMappings();
      } else {
        setDeptFeedbackMsg({ text: data.error || 'Failed to update department', type: 'error' });
      }
    } catch (err: any) {
      setDeptFeedbackMsg({ text: err.message || 'Error updating department', type: 'error' });
    } finally {
      setIsSavingDept(false);
      setTimeout(() => setDeptFeedbackMsg(null), 4000);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDept(true);
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeptForm)
      });
      const data = await res.json();
      if (data.success) {
        setDeptFeedbackMsg({ text: `Program code ${newDeptForm.code.toUpperCase()} added successfully!`, type: 'success' });
        setShowAddDeptModal(false);
        setNewDeptForm({ code: '', standard_dept_name: '', faculty_name: '', faculty_code: '' });
        await fetchDepartmentMappings();
      } else {
        setDeptFeedbackMsg({ text: data.error || 'Failed to add department', type: 'error' });
      }
    } catch (err: any) {
      setDeptFeedbackMsg({ text: err.message || 'Error adding department', type: 'error' });
    } finally {
      setIsSavingDept(false);
      setTimeout(() => setDeptFeedbackMsg(null), 4000);
    }
  };

  const handleDeleteDept = async (code: string) => {
    if (!confirm(`Are you sure you want to remove mapping for ${code}?`)) return;
    try {
      const res = await fetch(`/api/admin/departments?code=${encodeURIComponent(code)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setDeptFeedbackMsg({ text: `Removed mapping for ${code}`, type: 'success' });
        await fetchDepartmentMappings();
      } else {
        setDeptFeedbackMsg({ text: data.error || 'Failed to delete', type: 'error' });
      }
    } catch (err: any) {
      setDeptFeedbackMsg({ text: err.message || 'Error deleting department', type: 'error' });
    } finally {
      setTimeout(() => setDeptFeedbackMsg(null), 4000);
    }
  };

  // Derived Public Team Hierarchy Stats & Tag Badges
  const heroMember = teamMembers.find((m) => m.position_order === 1);
  const leadsCount = teamMembers.filter((m) => m.position_order > 1 && m.position_order <= 4).length;
  const ambassadorsCount = teamMembers.filter((m) => m.position_order > 4).length;
  const publishedCount = teamMembers.filter((m) => m.is_published).length;

  const availableTeamTags = Array.from(
    new Set([
      'Executive Governance',
      'Workshops & Trainings',
      'Awareness Campaign',
      'Analyzing & Reporting',
      'Technical & App Development',
      ...teamMembers.map((m) => m.team_tag?.trim()).filter(Boolean),
      ...tasks.map((t) => t.tag?.trim()).filter(Boolean),
    ])
  );

  const getTagBadgeStyle = (tag: string) => {
    const t = (tag || 'General').toLowerCase();
    if (t.includes('workshop') || t.includes('training')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (t.includes('aware') || t.includes('campaign')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (t.includes('analyz') || t.includes('report') || t.includes('tech') || t.includes('app')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  const filteredTeamMembers = teamMembers.filter((m) => {
    if (profileStatusFilter === 'published' && !m.is_published) return false;
    if (profileStatusFilter === 'draft' && m.is_published) return false;
    if (profileTagFilter !== 'all' && (m.team_tag || '').toLowerCase() !== profileTagFilter.toLowerCase()) return false;
    if (profileSearchQuery.trim()) {
      const q = profileSearchQuery.toLowerCase();
      const matchName = m.full_name?.toLowerCase().includes(q);
      const matchEmail = m.email?.toLowerCase().includes(q);
      const matchDesig = m.designation?.toLowerCase().includes(q);
      const matchTag = m.team_tag?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchDesig && !matchTag) return false;
    }
    return true;
  }).sort((a, b) => (a.position_order || 0) - (b.position_order || 0));

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
    fetchDepartmentMappings();
    fetchMCQs();
  }, []);

  // Live Metric Cards derived from Supabase
  const stats = [
    { label: 'Total Enrolled Beneficiaries', value: String(dbStats.totalProfiles), change: 'Live from Supabase', icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pre-Surveys Completed', value: String(dbStats.preSurveysCount), change: 'Live from Supabase', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
    { label: '12-MCQ Passed (≥75%)', value: String(dbStats.passedQuizzesCount), change: 'Live from Supabase', icon: HelpCircle, color: 'text-amber-600 bg-amber-50' },
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
    setAutofillEmailSelected('');
    setMemberForm({
      id: '',
      email: '',
      full_name: '',
      designation: '',
      bio: '',
      position_order: nextPos,
      team_tag: 'Executive Governance',
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
    setAutofillEmailSelected(member.email || '');
    setMemberForm({
      id: member.id,
      email: member.email || '',
      full_name: member.full_name || '',
      designation: member.designation || '',
      bio: member.bio || '',
      position_order: member.position_order ?? 99,
      team_tag: member.team_tag || 'Executive Governance',
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

  const handleAutofillFromWhitelist = (selectedEmail: string) => {
    setAutofillEmailSelected(selectedEmail);
    if (!selectedEmail) return;
    const foundUser = whitelist.find(w => w.email.toLowerCase() === selectedEmail.toLowerCase());
    const profile = registeredProfiles.find(p => p.email?.toLowerCase() === selectedEmail.toLowerCase());

    const displayName = profile?.full_name || foundUser?.full_name || '';
    const currentTasks = foundUser?.assigned_tasks || [];

    setMemberForm(prev => ({
      ...prev,
      email: selectedEmail,
      full_name: displayName || prev.full_name,
      assigned_tasks: currentTasks.length > 0 ? currentTasks : prev.assigned_tasks,
      team_tag: foundUser?.can_manage_team ? 'Executive Governance' : prev.team_tag
    }));
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

  const handleShiftPosition = async (member: any, direction: 'up' | 'down') => {
    const sorted = [...teamMembers].sort((a, b) => (a.position_order || 0) - (b.position_order || 0));
    const currentIndex = sorted.findIndex(m => m.id === member.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const otherMember = sorted[targetIndex];
    let newMyPos = otherMember.position_order;
    let newOtherPos = member.position_order;

    if (newMyPos === newOtherPos) {
      newMyPos = direction === 'up' ? Math.max(1, newMyPos - 1) : newMyPos + 1;
    }

    // Optimistic UI update
    setTeamMembers(prev => prev.map(m => {
      if (m.id === member.id) return { ...m, position_order: newMyPos };
      if (m.id === otherMember.id) return { ...m, position_order: newOtherPos };
      return m;
    }).sort((a, b) => (a.position_order || 0) - (b.position_order || 0)));

    try {
      await Promise.all([
        fetch('/api/team', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: member.id, position_order: newMyPos })
        }),
        fetch('/api/team', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: otherMember.id, position_order: newOtherPos })
        })
      ]);
      await fetchTeamData();
      setFeedbackMsg({ text: `Swapped order: #${newMyPos} ${member.full_name}`, type: 'success' });
      setTimeout(() => setFeedbackMsg(null), 2000);
    } catch (err: any) {
      console.error(err);
      await fetchTeamData();
    }
  };

  const handleTogglePublished = async (id: string, currentVal: boolean) => {
    // Optimistic update
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, is_published: !currentVal } : m));
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_published: !currentVal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeedbackMsg({
        text: !currentVal ? 'Member profile published on /team' : 'Member profile hidden (Draft)',
        type: 'success'
      });
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err: any) {
      await fetchTeamData();
      setFeedbackMsg({ text: `Failed to update status: ${err.message}`, type: 'error' });
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

  // ── Inline-edit helpers for whitelist rows ──────────────────────────────
  const startEditWhitelist = (w: any) => {
    setEditingWhitelistEmail(w.email);
    setEditWhitelistDraft({
      full_name: w.full_name || w.name || '',
      target_role: w.target_role || w.role || 'member',
      assigned_tasks: Array.isArray(w.assigned_tasks) ? w.assigned_tasks : [],
      notes: w.notes || '',
    });
  };

  const handleSaveWhitelistEdit = async () => {
    if (!editingWhitelistEmail) return;
    setIsSavingWhitelist(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editingWhitelistEmail,
          target_role: editWhitelistDraft.target_role,
          full_name: editWhitelistDraft.full_name,
          assigned_tasks: editWhitelistDraft.assigned_tasks,
          notes: editWhitelistDraft.notes,
          isRequesterAdmin: isSuperAdmin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchRolesData();
      setEditingWhitelistEmail(null);
      setFeedbackMsg({ text: `✅ Updated ${editingWhitelistEmail} successfully.`, type: 'success' });
    } catch (err: any) {
      setFeedbackMsg({ text: `❌ Save failed: ${err.message}`, type: 'error' });
    } finally {
      setIsSavingWhitelist(false);
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
          <p className="text-xs text-slate-500">Live monitoring of participant progression, 12-MCQ pass rates, and QIP indicators.</p>
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

      {/* Tabs - two functional tabs only */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'team'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Role and Whitelist</span>
          {canManageTeam && !isSuperAdmin && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
              Manager Access
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('team_profiles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'team_profiles'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Public Team Profile</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'team_profiles' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {teamMembers.length}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab('departments');
            fetchDepartmentMappings();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'departments'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Departments & Faculties</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'departments' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {departmentMappings.length}
          </span>
        </button>
        <button
          onClick={() => {
            setActiveTab('mcqs');
            fetchMCQs();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'mcqs'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>MCQ Question Pool</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'mcqs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {mcqsList.length}
          </span>
        </button>
      </div>

      {/* Quick Access Banner for Delegated Team Managers */}
      {canManageTeam && !isSuperAdmin && activeTab !== 'team' && activeTab !== 'team_profiles' && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 text-xs">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Delegated Team Manager Access Active</p>
              <p className="text-slate-600 text-[11px]">The Lead Admin has authorized your account to manage team profiles, assign tasks, and maintain whitelist roles.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setActiveTab('team_profiles')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Public Team Profiles</span>
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Whitelist & Tasks</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab Content: Metrics */}

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
                      const isEditing = editingWhitelistEmail === email;
                      const isProtected = email === 'ai-bridge-iiui-fms@gmail.com' || email === 'ai.bridge.iiui.fms@gmail.com';

                      return isEditing ? (
                        /* ── EDIT ROW ── */
                        <tr key={idx} className="bg-emerald-50/70 border-l-4 border-emerald-600">
                          <td className="py-4 px-5" colSpan={5}>
                            <div className="space-y-3.5">
                              {/* Header info */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-800">Editing Whitelist Entry:</span>
                                  <span className="font-mono text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-semibold">{email}</span>
                                </div>
                                <span className="text-[11px] text-slate-500">Live sync to database on save</span>
                              </div>

                              {/* Row 1: name + role + notes */}
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                                <div className="sm:col-span-5">
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
                                  <input
                                    type="text"
                                    value={editWhitelistDraft.full_name}
                                    onChange={e => setEditWhitelistDraft(d => ({ ...d, full_name: e.target.value }))}
                                    placeholder="Full Name (e.g. Asad Naveed)"
                                    className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                                  />
                                </div>
                                <div className="sm:col-span-3">
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Role</label>
                                  {isSuperAdmin && !isProtected ? (
                                    <select
                                      value={editWhitelistDraft.target_role}
                                      onChange={e => setEditWhitelistDraft(d => ({ ...d, target_role: e.target.value as 'admin' | 'member' }))}
                                      className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-semibold"
                                    >
                                      <option value="member">Member</option>
                                      <option value="admin">Admin</option>
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      disabled
                                      value={isProtected ? 'Admin (Super)' : editWhitelistDraft.target_role}
                                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-100 font-semibold text-slate-600 capitalize"
                                    />
                                  )}
                                </div>
                                <div className="sm:col-span-4">
                                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Notes (Optional)</label>
                                  <input
                                    type="text"
                                    value={editWhitelistDraft.notes}
                                    onChange={e => setEditWhitelistDraft(d => ({ ...d, notes: e.target.value }))}
                                    placeholder="Notes or designation"
                                    className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                                  />
                                </div>
                              </div>

                              {/* Row 2: task assignment pills */}
                              {tasks.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Assigned Campaign Tasks (Click to toggle):</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {tasks.map((t: any) => {
                                      const sel = editWhitelistDraft.assigned_tasks.includes(t.title);
                                      return (
                                        <button
                                          key={t.id}
                                          type="button"
                                          onClick={() =>
                                            setEditWhitelistDraft(d => ({
                                              ...d,
                                              assigned_tasks: sel
                                                ? d.assigned_tasks.filter(x => x !== t.title)
                                                : [...d.assigned_tasks, t.title],
                                            }))
                                          }
                                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                                            sel
                                              ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-800'
                                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                                          }`}
                                        >
                                          <span>{sel ? '✓' : '+'}</span>
                                          <span>{t.title}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Row 3: actions */}
                              <div className="flex items-center gap-2 pt-2 border-t border-emerald-100">
                                <button
                                  onClick={handleSaveWhitelistEdit}
                                  disabled={isSavingWhitelist}
                                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-60 cursor-pointer flex items-center gap-1.5 shadow-sm"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  {isSavingWhitelist ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                  onClick={() => setEditingWhitelistEmail(null)}
                                  className="px-3.5 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" /> Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        /* ── VIEW ROW ── */
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
                            {isSuperAdmin && !isProtected ? (
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
                                isProtected || canManage
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'text-slate-400'
                              }`}>
                                {isProtected ? 'Super Admin' : canManage ? 'Yes (Delegated)' : 'No'}
                              </span>
                            )}
                          </td>

                          <td className="text-right px-4">
                            <div className="flex items-center justify-end gap-1">
                              {/* Edit button */}
                              {(isSuperAdmin || canManageTeam) && (
                                <button
                                  onClick={() => startEditWhitelist(w)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  title="Edit member"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              {/* Delete button */}
                              {(isSuperAdmin || canManageTeam) && !isProtected ? (
                                <button
                                  onClick={() => handleRemoveWhitelist(email)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Delete from Supabase"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-[11px] text-emerald-600 font-bold pr-2">Protected</span>
                              )}
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

          {/* Quick Jump to Public Team Profiles Workspace */}
          {(isSuperAdmin || canManageTeam) && (
            <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-3xl border border-emerald-700/50 text-white p-6 sm:p-7 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs uppercase tracking-wider font-bold text-emerald-300">Public Page Showcase</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  Public Team Profiles & Positioning Hierarchy ({teamMembers.length} Profiles)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Configure the visual roster on <strong className="text-white">/team</strong>. Position #1 is reserved for the Solo Hero Row (Sir Zahid Khan), followed by Team Leads (Positions 2–4) and SDG Ambassadors (Positions 5+).
                </p>
                {heroMember ? (
                  <div className="flex items-center gap-2 pt-1 text-xs text-amber-300">
                    <span>👑 Row 1 Solo Hero:</span>
                    <span className="font-bold text-white">{heroMember.full_name}</span>
                    <span className="text-slate-400">({heroMember.designation})</span>
                  </div>
                ) : (
                  <p className="text-xs text-amber-300 font-semibold pt-1">
                    ⚠️ Position 1 is unassigned. Assign Sir Zahid Khan to Position 1.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                <button
                  onClick={() => setActiveTab('team_profiles')}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  <span>Open Team Profiles Workspace</span>
                  <span>&rarr;</span>
                </button>
                <button
                  onClick={handleOpenAddMember}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4 text-emerald-300" />
                  <span>+ Add Member</span>
                </button>
                <button
                  onClick={handleSyncWhitelistToTeam}
                  disabled={isSyncingTeam}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTeam ? 'animate-spin' : ''}`} />
                  <span>Sync Whitelist</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT: PUBLIC TEAM PROFILES & POSITIONING HIERARCHY       */}
      {/* ============================================================== */}
      {activeTab === 'team_profiles' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Public Page Control
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                  Public Team Profiles & Positioning Hierarchy
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Directly configure the visual roster rendered on <strong className="text-slate-800 font-semibold">/team</strong>.
                  Position #1 is reserved for the Project Mentor (Sir Zahid Khan) in the top hero row, followed by Team Leads (Positions 2–4) and SDG Ambassadors (Positions 5+).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSyncWhitelistToTeam}
                  disabled={isSyncingTeam}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer disabled:opacity-50"
                  title="Import existing ambassadors from role_whitelist into team_members to prevent duplicate data entry"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTeam ? 'animate-spin' : ''}`} />
                  <span>{isSyncingTeam ? 'Syncing...' : '1-Click Sync from Whitelist'}</span>
                </button>

                <button
                  onClick={handleOpenAddMember}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add Team Member</span>
                </button>

                <Link
                  href="/team"
                  target="_blank"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                >
                  <span>View Public /team Page</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Hierarchy & Hero Spotlight Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1: Solo Hero Slot */}
              <div className={`p-4 rounded-2xl border transition-all ${
                heroMember 
                  ? 'bg-gradient-to-br from-amber-50/80 to-amber-100/40 border-amber-200/80 shadow-2xs' 
                  : 'bg-rose-50/70 border-rose-200'
              }`}>
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className={heroMember ? 'text-amber-800' : 'text-rose-800'}>
                    👑 Row 1 Solo Hero
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/80 border border-amber-200 text-amber-900">
                    Position #1
                  </span>
                </div>
                {heroMember ? (
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-amber-300 flex-shrink-0">
                      {heroMember.avatar_url ? (
                        <img src={heroMember.avatar_url} alt={heroMember.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                          {heroMember.full_name.slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{heroMember.full_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{heroMember.designation}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-rose-700 font-medium mt-1">
                    ⚠️ Slot Empty! Set Position 1 for Dr. Abdul Zahid Khan.
                  </p>
                )}
              </div>

              {/* Stat 2: Team Leads */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>⭐ Row 2 Team Leads</span>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Pos 2–4
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900">{leadsCount}</div>
                <p className="text-[11px] text-slate-500">Technical & Operational Leadership</p>
              </div>

              {/* Stat 3: SDG Ambassadors */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>👥 Row 3+ Ambassadors</span>
                  <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
                    Pos 5+
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900">{ambassadorsCount}</div>
                <p className="text-[11px] text-slate-500">Department Ambassadors</p>
              </div>

              {/* Stat 4: Publication Status */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>🌐 Live Publication</span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {teamMembers.length > 0 ? `${Math.round((publishedCount / teamMembers.length) * 100)}%` : '0%'}
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-800">
                  {publishedCount} <span className="text-xs font-normal text-slate-500">/ {teamMembers.length} published</span>
                </div>
                <p className="text-[11px] text-slate-500">{teamMembers.length - publishedCount} in draft state</p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, title, email, or category..."
                  value={profileSearchQuery}
                  onChange={(e) => setProfileSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                />
                {profileSearchQuery && (
                  <button
                    onClick={() => setProfileSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Tag and Status Filter Buttons */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Status Filter */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setProfileStatusFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      profileStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({teamMembers.length})
                  </button>
                  <button
                    onClick={() => setProfileStatusFilter('published')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      profileStatusFilter === 'published' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Published ({publishedCount})
                  </button>
                  <button
                    onClick={() => setProfileStatusFilter('draft')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      profileStatusFilter === 'draft' ? 'bg-white text-slate-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Drafts ({teamMembers.length - publishedCount})
                  </button>
                </div>

                {/* Category Dropdown Filter */}
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={profileTagFilter}
                    onChange={(e) => setProfileTagFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Category Tags</option>
                    {availableTeamTags.map((tag) => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Profiles Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px] pb-2">
                    <th className="py-2.5 w-36">Rank & Row</th>
                    <th>Member Profile</th>
                    <th>Designation / Title</th>
                    <th>Category & Tasks</th>
                    <th className="text-center w-28">Status</th>
                    <th className="text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingTeam ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                          <span>Loading team profiles from Supabase...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTeamMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                          <Users className="w-6 h-6" />
                        </div>
                        <p className="font-semibold text-slate-700">No matching team members found.</p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          {profileSearchQuery || profileTagFilter !== 'all' || profileStatusFilter !== 'all'
                            ? 'Try clearing the search query or tag filters above.'
                            : 'Click "1-Click Sync from Whitelist" to import registered ambassadors, or click "+ Add Team Member".'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTeamMembers.map((member, idx) => {
                      const isPosition1 = member.position_order === 1;
                      const isLead = member.position_order > 1 && member.position_order <= 4;

                      return (
                        <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Position Rank with Up/Down Buttons */}
                          <td className="py-3">
                            <div className="flex items-center gap-1.5">
                              {/* Up / Down shift buttons */}
                              <div className="flex flex-col -space-y-1">
                                <button
                                  type="button"
                                  onClick={() => handleShiftPosition(member, 'up')}
                                  disabled={idx === 0}
                                  className="p-0.5 rounded text-slate-400 hover:text-emerald-700 hover:bg-slate-200 transition-colors disabled:opacity-20 cursor-pointer"
                                  title="Shift Up in Hierarchy"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleShiftPosition(member, 'down')}
                                  disabled={idx === filteredTeamMembers.length - 1}
                                  className="p-0.5 rounded text-slate-400 hover:text-emerald-700 hover:bg-slate-200 transition-colors disabled:opacity-20 cursor-pointer"
                                  title="Shift Down in Hierarchy"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Number input */}
                              <input
                                type="number"
                                min={1}
                                max={99}
                                defaultValue={member.position_order}
                                key={`pos-${member.id}-${member.position_order}`}
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val !== member.position_order) {
                                    handleQuickUpdatePosition(member.id, val);
                                  }
                                }}
                                className="w-12 px-1.5 py-1 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs"
                                title="Edit position rank directly"
                              />

                              {/* Row Badge */}
                              {isPosition1 ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200 flex items-center gap-0.5" title="Row 1 Solo Leader">
                                  👑 Row 1
                                </span>
                              ) : isLead ? (
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold border border-blue-200 flex items-center gap-0.5" title="Row 2 Team Leads">
                                  ⭐ Row 2
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200" title="Row 3+ Ambassadors">
                                  Row 3+
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Member Avatar, Name & Monospace Email */}
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-200 shadow-2xs">
                                {member.avatar_url ? (
                                  <img
                                    src={member.avatar_url}
                                    alt={member.full_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs bg-slate-800">
                                    {member.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 truncate">
                                    {member.full_name}
                                  </span>
                                  {member.linkedin_url && (
                                    <a
                                      href={member.linkedin_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Open LinkedIn"
                                    >
                                      <Linkedin className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono truncate">
                                  {member.email || 'No email attached'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Designation */}
                          <td className="py-3 text-slate-700 font-medium max-w-xs">
                            <div className="truncate" title={member.designation}>
                              {member.designation}
                            </div>
                          </td>

                          {/* Category Tag & Tasks */}
                          <td className="py-3">
                            <div className="space-y-1">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTagBadgeStyle(member.team_tag)}`}>
                                {member.team_tag || 'General'}
                              </span>
                              {member.assigned_tasks && member.assigned_tasks.length > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                  <span className="font-semibold">{member.assigned_tasks.length} Task{member.assigned_tasks.length > 1 ? 's' : ''}:</span>
                                  <span className="truncate max-w-[140px]" title={member.assigned_tasks.join(', ')}>
                                    {member.assigned_tasks.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 1-Click Visibility Toggle */}
                          <td className="py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePublished(member.id, member.is_published)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-all border ${
                                member.is_published
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                              }`}
                              title="Click to toggle public visibility on /team"
                            >
                              {member.is_published ? (
                                <>
                                  <Eye className="w-3 h-3 text-emerald-700" />
                                  <span>Published</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 text-slate-400" />
                                  <span>Draft</span>
                                </>
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditMember(member)}
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="Edit Profile & Photo"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteTeamMember(member.id, member.full_name)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT: DEPARTMENTS & FACULTIES MAPPINGS */}
      {/* ============================================================== */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          {/* Feedback Toast */}
          {deptFeedbackMsg && (
            <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between shadow-sm animate-fade-in ${
              deptFeedbackMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{deptFeedbackMsg.text}</span>
              </div>
              <button 
                onClick={() => setDeptFeedbackMsg(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Academic Degree Directory & Mapping Engine
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                  Student Email Code Mapping & Faculty Association
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Map extracted student email program abbreviations (e.g. <strong className="text-slate-800">BSBA</strong>, <strong className="text-slate-800">BSIR</strong>, <strong className="text-slate-800">BSFTE</strong>) to official degree titles and faculties. 
                  Any change here instantly updates across all student analytics and reports via relational database JOIN.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                <button
                  onClick={() => setShowAddDeptModal(true)}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Program Code</span>
                </button>
                <button
                  onClick={fetchDepartmentMappings}
                  disabled={loadingDepts}
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Refresh Mappings"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingDepts ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Configured Programs</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{departmentMappings.length}</span>
                  <span className="text-xs font-semibold text-slate-500">Degree Codes</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60">
                <p className="text-emerald-700 text-[11px] font-bold uppercase tracking-wider">Faculties Represented</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-950">
                    {new Set(departmentMappings.map(d => d.faculty_name).filter(Boolean)).size}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">Academic Faculties</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60">
                <p className="text-blue-700 text-[11px] font-bold uppercase tracking-wider">Total Survey Entries Classified</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-blue-950">
                    {departmentMappings.reduce((sum, d) => sum + (Number(d.student_count) || 0), 0)}
                  </span>
                  <span className="text-xs font-semibold text-blue-700">Submissions Covered</span>
                </div>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by code (e.g. BSBA), department name, or faculty..."
                  value={deptSearchQuery}
                  onChange={(e) => setDeptSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <select
                  value={deptFacultyFilter}
                  onChange={(e) => setDeptFacultyFilter(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Faculties</option>
                  <option value="Faculty of Management Sciences">FMS (Management Sciences)</option>
                  <option value="Faculty of Social Sciences">FSS (Social Sciences)</option>
                  <option value="Faculty of Basic & Applied Sciences">FBAS (Basic & Applied)</option>
                  <option value="Faculty of Computing & IT">FCIT (Computing & IT)</option>
                  <option value="Faculty of Languages & Literature">FLL (Languages & Literature)</option>
                  <option value="Faculty of Shariah & Law">FSL (Shariah & Law)</option>
                </select>
              </div>
            </div>

            {/* Mappings Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  <tr>
                    <th className="py-3 px-4">Extracted Code</th>
                    <th className="py-3 px-4">Survey Entries</th>
                    <th className="py-3 px-4">Standard Department Name</th>
                    <th className="py-3 px-4">Faculty Name & Code</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingDepts ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading department mappings...</span>
                        </div>
                      </td>
                    </tr>
                  ) : departmentMappings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No department mappings found. Please apply migration 008_department_mappings.sql in Supabase.
                      </td>
                    </tr>
                  ) : (
                    departmentMappings
                      .filter((d) => {
                        const q = deptSearchQuery.toLowerCase();
                        const matchesSearch = !q ||
                          d.code.toLowerCase().includes(q) ||
                          d.standard_dept_name.toLowerCase().includes(q) ||
                          d.faculty_name.toLowerCase().includes(q) ||
                          (d.faculty_code && d.faculty_code.toLowerCase().includes(q));
                        const matchesFaculty = deptFacultyFilter === 'all' || 
                          d.faculty_name === deptFacultyFilter || 
                          d.faculty_code === deptFacultyFilter;
                        return matchesSearch && matchesFaculty;
                      })
                      .map((dept) => {
                        const isEditing = editingDeptCode === dept.code;

                        return (
                          <tr key={dept.code} className="hover:bg-slate-50/80 transition-colors">
                            {/* Extracted Code */}
                            <td className="py-3.5 px-4 font-mono">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-extrabold text-xs tracking-wider shadow-sm">
                                {dept.code}
                              </span>
                            </td>

                            {/* Live Survey Entries Count */}
                            <td className="py-3.5 px-4">
                              {Number(dept.student_count) > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  {dept.student_count} entries
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                                  0 entries
                                </span>
                              )}
                            </td>

                            {/* Standard Department Name */}
                            <td className="py-3.5 px-4">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={deptEditForm.standard_dept_name}
                                  onChange={(e) => setDeptEditForm({ ...deptEditForm, standard_dept_name: e.target.value })}
                                  className="w-full px-3 py-1.5 rounded-lg border border-emerald-500 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  placeholder="e.g. Business Analytics"
                                  autoFocus
                                />
                              ) : (
                                <span className="font-bold text-slate-900 text-xs">
                                  {dept.standard_dept_name}
                                </span>
                              )}
                            </td>

                            {/* Faculty Name & Code */}
                            <td className="py-3.5 px-4">
                              {isEditing ? (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={deptEditForm.faculty_name}
                                    onChange={(e) => setDeptEditForm({ ...deptEditForm, faculty_name: e.target.value })}
                                    className="flex-1 px-3 py-1.5 rounded-lg border border-emerald-500 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    placeholder="Faculty Name"
                                  />
                                  <input
                                    type="text"
                                    value={deptEditForm.faculty_code}
                                    onChange={(e) => setDeptEditForm({ ...deptEditForm, faculty_code: e.target.value })}
                                    className="w-20 px-2 py-1.5 rounded-lg border border-emerald-500 text-xs font-bold uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    placeholder="Code"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-700 font-medium">
                                    {dept.faculty_name}
                                  </span>
                                  {dept.faculty_code && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      {dept.faculty_code}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleSaveDept()}
                                    disabled={isSavingDept}
                                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                                    title="Save Changes"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingDeptCode(null)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingDeptCode(dept.code);
                                      setDeptEditForm({
                                        code: dept.code,
                                        standard_dept_name: dept.standard_dept_name,
                                        faculty_name: dept.faculty_name,
                                        faculty_code: dept.faculty_code || ''
                                      });
                                    }}
                                    className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                    title="Edit Mapping"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDept(dept.code)}
                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Remove Mapping"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
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
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD NEW PROGRAM CODE MODAL */}
      {/* ============================================================== */}
      {showAddDeptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Add New Program Code</h3>
                <p className="text-xs text-slate-500">Register a new student email degree abbreviation.</p>
              </div>
              <button 
                onClick={() => setShowAddDeptModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDept} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Program Abbreviation Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BSAI or BSCY"
                  value={newDeptForm.code}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Standard Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Artificial Intelligence or Business Analytics"
                  value={newDeptForm.standard_dept_name}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, standard_dept_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Faculty Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Faculty of Computing & IT"
                    value={newDeptForm.faculty_name}
                    onChange={(e) => setNewDeptForm({ ...newDeptForm, faculty_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Acronym</label>
                  <input
                    type="text"
                    placeholder="e.g. FCIT"
                    value={newDeptForm.faculty_code}
                    onChange={(e) => setNewDeptForm({ ...newDeptForm, faculty_code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDept}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {isSavingDept ? 'Saving...' : 'Add Mapping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab Content: MCQs Pool */}
      {activeTab === 'mcqs' && (
        <div className="space-y-6 animate-fade-in">
          {/* Feedback Toast */}
          {mcqFeedbackMsg && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-fade-in shadow-xs ${
              mcqFeedbackMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-center gap-2">
                {mcqFeedbackMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{mcqFeedbackMsg.text}</span>
              </div>
              <button onClick={() => setMcqFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header Card */}
          <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-600/40">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Assessment Evaluation Engine</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Master MCQ Question Pool</h2>
              <p className="text-xs text-emerald-200 mt-1 max-w-xl leading-relaxed">
                Configure evaluation items for the 12-MCQ Course Assessment. Changes apply immediately to new quiz sessions with balanced category sampling and dynamic option shuffling.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={fetchMCQs}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Refresh from database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMcqs ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={handleOpenAddMcq}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Add Question</span>
              </button>
            </div>
          </div>

          {/* Live Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Questions in Pool</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{mcqsList.length}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Across all categories</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active for Quizzes</div>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">
                {mcqsList.filter((m) => m.is_active).length}
              </div>
              <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">Eligible for live student draws</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Deactivated / Hidden</div>
              <div className="text-2xl font-black text-slate-400 mt-0.5">
                {mcqsList.filter((m) => !m.is_active).length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Safely preserved in archive</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Categories</div>
              <div className="text-2xl font-black text-purple-600 mt-0.5">{availableMcqCategories.length}</div>
              <div className="text-[10px] text-purple-700 font-semibold mt-0.5">4 Core academic clusters</div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search questions by wording, category, or answer choice..."
                value={mcqSearchQuery}
                onChange={(e) => setMcqSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={mcqCategoryFilter}
                onChange={(e) => setMcqCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="all">All Categories ({availableMcqCategories.length})</option>
                {availableMcqCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Difficulty Filter */}
              <select
                value={mcqDifficultyFilter}
                onChange={(e) => setMcqDifficultyFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              {/* Status Filter */}
              <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-50 text-xs">
                <button
                  type="button"
                  onClick={() => setMcqStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    mcqStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setMcqStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    mcqStatusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setMcqStatusFilter('inactive')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    mcqStatusFilter === 'inactive' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Inactive
                </button>
              </div>
            </div>
          </div>

          {/* Questions Roster */}
          {loadingMcqs ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Loading questions pool from Supabase...</p>
            </div>
          ) : (
            (() => {
              const filteredList = mcqsList.filter((q) => {
                const matchesSearch =
                  !mcqSearchQuery ||
                  q.question_text?.toLowerCase().includes(mcqSearchQuery.toLowerCase()) ||
                  q.category?.toLowerCase().includes(mcqSearchQuery.toLowerCase()) ||
                  (Array.isArray(q.options) && q.options.some((o: string) => o.toLowerCase().includes(mcqSearchQuery.toLowerCase())));

                const matchesCategory = mcqCategoryFilter === 'all' || q.category === mcqCategoryFilter;
                const matchesDifficulty = mcqDifficultyFilter === 'all' || q.difficulty === mcqDifficultyFilter;
                const matchesStatus =
                  mcqStatusFilter === 'all' ||
                  (mcqStatusFilter === 'active' && q.is_active) ||
                  (mcqStatusFilter === 'inactive' && !q.is_active);

                return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
                    <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">No questions found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      No questions matched your current filter criteria. Try clearing filters or search queries.
                    </p>
                    <button
                      onClick={() => {
                        setMcqSearchQuery('');
                        setMcqCategoryFilter('all');
                        setMcqDifficultyFilter('all');
                        setMcqStatusFilter('all');
                      }}
                      className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Reset all filters
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-500 flex justify-between items-center px-1">
                    <span>Showing {filteredList.length} of {mcqsList.length} questions</span>
                    <span>12 drawn per quiz</span>
                  </div>

                  {filteredList.map((q, idx) => {
                    const rawOptions: string[] = Array.isArray(q.options) ? q.options : [];
                    const correctIdx = Number(q.correct_option_index) || 0;

                    return (
                      <div
                        key={q.id}
                        className={`bg-white border rounded-3xl p-5 sm:p-6 shadow-xs transition-all space-y-4 ${
                          q.is_active
                            ? 'border-slate-200 hover:border-emerald-300'
                            : 'border-slate-200 bg-slate-50/70 opacity-75'
                        }`}
                      >
                        {/* Top Metadata Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-extrabold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                              {q.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold capitalize">
                              {q.difficulty}
                            </span>
                            {q.is_active ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" /> Live in Pool
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">
                                Deactivated
                              </span>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleMcqStatus(q.id, q.is_active)}
                              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                q.is_active
                                  ? 'bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                                  : 'bg-emerald-700 text-white hover:bg-emerald-800'
                              }`}
                            >
                              {q.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleOpenEditMcq(q)}
                              className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>

                        {/* Question Text */}
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                          {q.question_text}
                        </h3>

                        {/* 4 Choices Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {rawOptions.map((opt, optIdx) => {
                            const isCorrect = optIdx === correctIdx;

                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-600'
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span className="flex-1 leading-relaxed">{opt}</span>
                                {isCorrect && (
                                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded-md font-bold uppercase shrink-0">
                                    Correct Answer
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation Box */}
                        {q.explanation && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-start gap-2">
                            <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800">Academic Explanation:</span>
                              <p className="text-[11px] leading-relaxed text-slate-600">{q.explanation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}

          {/* Add / Edit MCQ Modal */}
          {showMcqModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 my-6 animate-fade-in max-h-[92vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                      {editingMcq ? 'Edit Course Assessment Question' : 'Add New Question to Pool'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ensure exactly 4 clear options and select the correct answer.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMcqModal(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveMcq} className="space-y-4">
                  {/* Question Statement */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Question Statement *</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. What distinguishes NotebookLM from conventional generic AI chatbots?"
                      value={mcqForm.question_text}
                      onChange={(e) => setMcqForm({ ...mcqForm, question_text: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Category & Difficulty Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Topic Category *</label>
                      <input
                        type="text"
                        list="categories-list"
                        placeholder="e.g. NotebookLM Foundations"
                        value={mcqForm.category}
                        onChange={(e) => setMcqForm({ ...mcqForm, category: e.target.value })}
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <datalist id="categories-list">
                        {availableMcqCategories.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Cognitive Difficulty *</label>
                      <select
                        value={mcqForm.difficulty}
                        onChange={(e) => setMcqForm({ ...mcqForm, difficulty: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="easy">Easy (Foundations)</option>
                        <option value="intermediate">Intermediate (Standard)</option>
                        <option value="advanced">Advanced (Critical Application)</option>
                      </select>
                    </div>
                  </div>

                  {/* 4 Choices Inputs */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Options (Click the radio to mark the Correct Answer) *
                    </label>

                    {[0, 1, 2, 3].map((optIdx) => {
                      const isCorrect = mcqForm.correct_option_index === optIdx;

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                            isCorrect ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                            <input
                              type="radio"
                              name="correct_option"
                              checked={isCorrect}
                              onChange={() => setMcqForm({ ...mcqForm, correct_option_index: optIdx })}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold flex items-center justify-center">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                          </label>

                          <input
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)} choice text...`}
                            value={mcqForm.options[optIdx] || ''}
                            onChange={(e) => {
                              const newOpts = [...mcqForm.options];
                              newOpts[optIdx] = e.target.value;
                              setMcqForm({ ...mcqForm, options: newOpts });
                            }}
                            required
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />

                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-full shrink-0">
                              Correct Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Academic Explanation */}
                  <div className="space-y-1 pt-1">
                    <label className="text-xs font-bold text-slate-700">Academic Explanation (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="Explain why this option is correct to aid student review..."
                      value={mcqForm.explanation}
                      onChange={(e) => setMcqForm({ ...mcqForm, explanation: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none leading-relaxed"
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="mcq_is_active"
                      checked={mcqForm.is_active}
                      onChange={(e) => setMcqForm({ ...mcqForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="mcq_is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Make this question active immediately for student quiz draws
                    </label>
                  </div>

                  {/* Modal Footer Controls */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowMcqModal(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingMcq}
                      className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSavingMcq ? 'Saving Question...' : editingMcq ? 'Save Changes' : 'Create Question'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Participants */}

      {/* Tab Content: Audit & Sync Trail */}

      {/* ============================================================== */}
      {/* ADD / EDIT TEAM MEMBER MODAL WITH AUTO-COMPRESSION & LIVE PREVIEW */}
      {/* ============================================================== */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 my-6 animate-fade-in max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                    {editingMember ? 'Edit Team Member Profile' : 'Add Team Member Profile'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure hierarchy positioning, institutional designation, dynamic tasks, and compressed profile photo.
                </p>
              </div>
              <button
                onClick={() => setShowMemberModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Autofill Selector from Whitelist */}
            {!editingMember && whitelist.length > 0 && (
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-950">
                  <UserCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span className="font-bold">Quick Autofill from Whitelist:</span>
                </div>
                <select
                  value={autofillEmailSelected}
                  onChange={(e) => handleAutofillFromWhitelist(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Whitelist Ambassador to auto-fill --</option>
                  {whitelist.map((w) => (
                    <option key={w.email} value={w.email}>
                      {w.full_name || w.email} ({w.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 2-Column Responsive Layout: Left = Form, Right = Live Preview */}
            <form onSubmit={handleSaveTeamMember} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Form Fields (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
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
                        Pos 1 = Solo Hero Row (Sir Zahid), Pos 2–4 = Leads, Pos 5+ = Ambassadors
                      </span>
                    </div>

                    {/* Category Tag */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Category Tag *
                      </label>
                      <input
                        type="text"
                        required
                        list="modal-dynamic-team-tag-options"
                        placeholder="e.g. Executive Governance"
                        value={memberForm.team_tag}
                        onChange={(e) => setMemberForm({ ...memberForm, team_tag: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <datalist id="modal-dynamic-team-tag-options">
                        {availableTeamTags.map((tag) => (
                          <option key={tag} value={tag} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Designation / Institutional Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chairperson, Dept. of Technology & PM / Project Lead"
                      value={memberForm.designation}
                      onChange={(e) => setMemberForm({ ...memberForm, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Biography */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Biography / Responsibilities</label>
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

                  {/* Assigned Campaign Tasks */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 block">
                      Assigned Campaign Tasks (from Master Pool)
                    </label>
                    {tasks.length === 0 ? (
                      <p className="text-[11px] text-slate-400">
                        No tasks in pool yet. Add tasks in Master Campaign Tasks.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
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

                  {/* Photo Upload with Client-Side Auto-Compression */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 block">
                      Profile Photo (Compressed &lt; 350 KB &bull; Uploads to Supabase Storage)
                    </label>

                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-300 shadow-inner">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-slate-800">
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleAvatarFileSelected}
                          className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
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
                      id="modal_is_published_chk"
                      checked={memberForm.is_published}
                      onChange={(e) => setMemberForm({ ...memberForm, is_published: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="modal_is_published_chk" className="text-xs text-slate-700 font-semibold cursor-pointer">
                      Publish immediately on public /team page
                    </label>
                  </div>
                </div>

                {/* Right Column: Live Public Card Preview (5 cols) */}
                <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        Live Public Card Preview
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        memberForm.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {memberForm.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    {/* Preview Card */}
                    <div className="mt-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                      {/* Top tier pill */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          memberForm.position_order === 1
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : memberForm.position_order <= 4
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {memberForm.position_order === 1
                            ? '👑 Row 1 Solo Hero'
                            : memberForm.position_order <= 4
                            ? `⭐ Row 2 Lead (Rank #${memberForm.position_order})`
                            : `👥 Ambassador (Rank #${memberForm.position_order})`}
                        </span>

                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTagBadgeStyle(memberForm.team_tag)}`}>
                          {memberForm.team_tag || 'General'}
                        </span>
                      </div>

                      {/* Avatar & Names */}
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 flex-shrink-0 border border-slate-200 shadow-inner">
                          {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm bg-slate-800">
                              {(memberForm.full_name || 'Team Member').split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'TM'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">
                            {memberForm.full_name || 'Member Full Name'}
                          </h4>
                          <p className="text-xs text-slate-500 truncate leading-snug">
                            {memberForm.designation || 'Institutional Designation'}
                          </p>
                          {memberForm.email && (
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              {memberForm.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bio snippet */}
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {memberForm.bio || 'Biography and project contributions will appear here once entered...'}
                      </p>

                      {/* Tasks preview */}
                      {memberForm.assigned_tasks.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Assigned Tasks ({memberForm.assigned_tasks.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {memberForm.assigned_tasks.slice(0, 3).map((task, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200/60">
                                {task}
                              </span>
                            ))}
                            {memberForm.assigned_tasks.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                +{memberForm.assigned_tasks.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    This card preview dynamically reflects live changes.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTeamMember}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
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
  );
}
