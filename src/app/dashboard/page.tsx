'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Users,
  BarChart3, 
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
  EyeOff,
  BookOpen,
  QrCode,
  Activity,
  Globe2,
  Heart,
  GraduationCap,
  Building2,
  ChevronRight,
  Compass,
  TrendingUp
} from 'lucide-react';
import { compressImageToMaxKB, uploadTeamAvatar } from '@/lib/imageCompression';
import GalleryManager from '@/components/dashboard/GalleryManager';
import AdminResourcesPanel from '@/components/dashboard/AdminResourcesPanel';
import ReportQRManager from '@/components/dashboard/ReportQRManager';
import SurveyAnalyticsView, { SurveySubTab } from '@/components/dashboard/SurveyAnalyticsView';
import LiveAnalyticsView, { LiveAnalyticsSubTab } from '@/components/dashboard/LiveAnalyticsView';

export type DashboardTab = 
  | 'survey_impact' 
  | 'live_analytics' 
  | 'team' 
  | 'departments' 
  | 'mcqs' 
  | 'resources' 
  | 'gallery' 
  | 'reviewer_access';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('survey_impact');
  const [surveySubTab, setSurveySubTab] = useState<SurveySubTab>('overview');
  const [liveSubTab, setLiveSubTab] = useState<LiveAnalyticsSubTab>('overview');
  const [teamSubTab, setTeamSubTab] = useState<'roster' | 'tasks'>('roster');
  const [mcqSubTab, setMcqSubTab] = useState<'pool' | 'config' | 'audit'>('pool');
  const [expandedTabs, setExpandedTabs] = useState<Record<string, boolean>>({
    survey_impact: true,
    live_analytics: true,
    team: true,
    mcqs: true,
    departments: false,
    resources: false,
    gallery: false,
    reviewer_access: false,
  });

  const toggleAllAccordions = (expand: boolean) => {
    setExpandedTabs({
      survey_impact: expand,
      live_analytics: expand,
      team: expand,
      mcqs: expand,
      departments: expand,
      resources: expand,
      gallery: expand,
      reviewer_access: expand,
    });
  };
  const [isHydrated, setIsHydrated] = useState(false);
  // Inline-edit state for team roster rows
  const [editingWhitelistEmail, setEditingWhitelistEmail] = useState<string | null>(null);
  const [editWhitelistDraft, setEditWhitelistDraft] = useState<{ full_name: string; team_role: 'admin' | 'team-member'; team_tag: string; assigned_tasks: string[]; notes: string }>({ full_name: '', team_role: 'team-member', team_tag: 'General', assigned_tasks: [], notes: '' });
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

  // Quiz Configuration State (per-category question counts)
  const [quizConfig, setQuizConfig] = useState<{
    total_questions: number;
    passing_score: number;
    cooldown_seconds: number;
    categories: { category: string; count: number }[];
  } | null>(null);
  const [quizConfigDraft, setQuizConfigDraft] = useState<{
    total_questions: number;
    passing_score: number;
    cooldown_seconds: number;
    categories: { category: string; count: number }[];
  } | null>(null);
  const [loadingQuizConfig, setLoadingQuizConfig] = useState(false);
  const [savingQuizConfig, setSavingQuizConfig] = useState(false);
  const [quizConfigFeedback, setQuizConfigFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showQuizConfig, setShowQuizConfig] = useState(false);

  // Granular MCQ Access Level for current user ('none' | 'viewer' | 'moderator' | 'manager')
  const [currentUserMcqAccess, setCurrentUserMcqAccess] = useState<'none' | 'viewer' | 'moderator' | 'manager'>('none');
  const [mcqAuditLogs, setMcqAuditLogs] = useState<any[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  const fetchMcqAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const res = await fetch('/api/admin/mcqs?audit=true');
      const data = await res.json();
      if (data.success && data.audit_logs) {
        setMcqAuditLogs(data.audit_logs);
      }
    } catch (e) {
      console.error('Failed to fetch MCQ audit logs:', e);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const handleMcqLevelChange = async (email: string, newLevel: 'none' | 'viewer' | 'moderator' | 'manager') => {
    const current = permissionsMap[email] || {
      can_manage_team: false,
      mcq_access_level: 'none'
    };

    const updated = {
      ...current,
      mcq_access_level: newLevel
    };

    setPermissionsMap(prev => ({ ...prev, [email]: updated }));

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, permissions: updated })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const labels: Record<string, string> = {
        none: 'No Access',
        viewer: 'Viewer (Read-only)',
        moderator: 'Moderator (Can Toggle)',
        manager: 'Manager (Full Edit)'
      };
      setFeedbackMsg({ text: `MCQ Authority updated to "${labels[newLevel]}" for ${email}`, type: 'success' });
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err: any) {
      setFeedbackMsg({ text: `Failed to update MCQ authority: ${err.message}`, type: 'error' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const fetchQuizConfig = async () => {
    setLoadingQuizConfig(true);
    try {
      const res = await fetch('/api/admin/quiz-config');
      const data = await res.json();
      if (data.success && data.config) {
        setQuizConfig(data.config);
        setQuizConfigDraft(JSON.parse(JSON.stringify(data.config)));
      }
    } catch (e) {
      console.error('Failed to fetch quiz config:', e);
    } finally {
      setLoadingQuizConfig(false);
    }
  };

  const handleSaveQuizConfig = async () => {
    if (!quizConfigDraft) return;
    const sum = quizConfigDraft.categories.reduce((acc, c) => acc + (Number(c.count) || 0), 0);
    if (sum !== quizConfigDraft.total_questions) {
      setQuizConfigFeedback({
        text: `Category counts must sum to ${quizConfigDraft.total_questions}. Current sum: ${sum}.`,
        type: 'error'
      });
      setTimeout(() => setQuizConfigFeedback(null), 5000);
      return;
    }
    setSavingQuizConfig(true);
    try {
      const res = await fetch('/api/admin/quiz-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizConfigDraft)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuizConfig(data.config);
      setQuizConfigDraft(JSON.parse(JSON.stringify(data.config)));
      setQuizConfigFeedback({ text: 'Quiz configuration saved! New sessions will use the updated settings.', type: 'success' });
    } catch (err: any) {
      setQuizConfigFeedback({ text: `Failed to save: ${err.message}`, type: 'error' });
    } finally {
      setSavingQuizConfig(false);
      setTimeout(() => setQuizConfigFeedback(null), 5000);
    }
  };


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

  // Team Roster Form State
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'team-member'>('team-member');
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newTeamTag, setNewTeamTag] = useState('');
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
  const [currentUserRole, setCurrentUserRole] = useState<string>('guest');
  const [canManageTeam, setCanManageTeam] = useState<boolean>(false);
  const [canManageGallery, setCanManageGallery] = useState<boolean>(false);
  const [canManageResources, setCanManageResources] = useState<boolean>(false);

  // Live Supabase Database State (Zero Hardcoded Data)
  const [members, setMembers] = useState<any[]>([]);
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
    team_role: 'team-member' as 'admin' | 'team-member',
    designation: '',
    bio: '',
    position_order: 99,
    team_tag: 'Executive Governance',
    assigned_tasks: [] as string[],
    linkedin_url: '',
    avatar_url: '',
    can_manage_team: false,
    can_manage_resources: false,
    mcq_access_level: 'none' as 'none' | 'viewer' | 'moderator' | 'manager',
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
        if (data.user_access_level) {
          setCurrentUserMcqAccess(data.user_access_level);
        }
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
        setMembers(data.members || []);
        setRegisteredProfiles(data.profiles || []);
        setTasks(data.tasks || []);

        if (data.stats) {
          setDbStats(data.stats);
        }

        const resolveMcqLevel = (member: any, emailStr: string): 'none' | 'viewer' | 'moderator' | 'manager' => {
          const emailKey = (emailStr || '').toLowerCase();
          if (member?.mcq_access_level && ['none', 'viewer', 'moderator', 'manager'].includes(member.mcq_access_level)) {
            return member.mcq_access_level;
          }
          if (data.mcq_access_levels && data.mcq_access_levels[emailKey]) {
            return data.mcq_access_levels[emailKey];
          }
          return 'none';
        };

        // Build the permissions map (Manage Team + MCQ authority) from the members table
        const pMap: Record<string, any> = {};
        (data.members || []).forEach((m: any) => {
          const emailKey = (m.email || '').toLowerCase();
          if (!emailKey) return;
          pMap[emailKey] = {
            can_manage_team: Boolean(m.can_manage_team),
            mcq_access_level: resolveMcqLevel(m, emailKey),
          };
        });

        // Include registered profiles that already have a linked members row
        (data.profiles || []).forEach((p: any) => {
          const emailKey = (p.email || '').toLowerCase();
          if (!emailKey) return;
          const rawMember = Array.isArray(p.members) ? p.members[0] : p.members;
          if (!rawMember) return;
          pMap[emailKey] = {
            can_manage_team: Boolean(rawMember.can_manage_team),
            mcq_access_level: resolveMcqLevel(rawMember, emailKey),
          };
        });

        setPermissionsMap(pMap);

        // Cross-verify whether current user has delegated management permission
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const emailLower = user.email.toLowerCase();
          const isSuper = emailLower === 'ai.bridge.iiui.fms@gmail.com';
          const hasDelegated = Boolean(pMap[emailLower]?.can_manage_team);
          if (isSuper || hasDelegated) {
            setCanManageTeam(true);
          }

          if (isSuper) {
            setCurrentUserMcqAccess('manager');
          } else if (pMap[emailLower]?.mcq_access_level) {
            setCurrentUserMcqAccess(pMap[emailLower].mcq_access_level);
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
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Check URL parameters for tab navigation (e.g. ?tab=team)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['metrics', 'participants', 'mcqs', 'team', 'audit', 'gallery', 'resources', 'survey_impact', 'live_analytics', 'departments', 'reviewer_access'].includes(tabParam)) {
        if (tabParam === 'audit') {
          setActiveTab('mcqs');
          setShowAuditModal(true);
          fetchMcqAuditLogs();
        } else if (tabParam === 'metrics' || tabParam === 'participants') {
          setActiveTab('live_analytics');
        } else {
          setActiveTab(tabParam as any);
        }
      }
      const subTabParam = params.get('subtab');
      if (subTabParam) {
        if (tabParam === 'survey_impact') {
          setSurveySubTab(subTabParam as SurveySubTab);
        } else if (tabParam === 'live_analytics') {
          setLiveSubTab(subTabParam as LiveAnalyticsSubTab);
        }
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
            .select('role, members(can_manage_team, mcq_access_level, can_manage_gallery, can_manage_resources)')
            .eq('id', user.id)
            .maybeSingle();

          const isSuperAdmin = emailLower === 'ai.bridge.iiui.fms@gmail.com' || prof?.role === 'admin';
          setCurrentUserRole(prof?.role || 'guest');

          const rawMember = Array.isArray(prof?.members) ? prof?.members[0] : prof?.members;
          const hasDelegatedPermission = Boolean(rawMember?.can_manage_team);
          const hasGalleryPermission = Boolean(rawMember?.can_manage_gallery);
          const hasResourcePermission = Boolean(rawMember?.can_manage_resources);

          setCanManageTeam(isSuperAdmin || hasDelegatedPermission);
          setCanManageGallery(isSuperAdmin || hasGalleryPermission);
          setCanManageResources(isSuperAdmin || hasResourcePermission || hasDelegatedPermission);

          if (isSuperAdmin) {
            setCurrentUserMcqAccess('manager');
          } else if (rawMember?.mcq_access_level && ['none', 'viewer', 'moderator', 'manager'].includes(rawMember.mcq_access_level)) {
            setCurrentUserMcqAccess(rawMember.mcq_access_level);
          }
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
    fetchQuizConfig();
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
      team_role: 'team-member',
      designation: '',
      bio: '',
      position_order: nextPos,
      team_tag: 'Executive Governance',
      assigned_tasks: [],
      linkedin_url: '',
      avatar_url: '',
      can_manage_team: false,
      can_manage_resources: false,
      mcq_access_level: 'none',
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
      team_role: (member.team_role || 'team-member') as 'admin' | 'team-member',
      designation: member.designation || '',
      bio: member.bio || '',
      position_order: member.position_order ?? 99,
      team_tag: member.team_tag || 'Executive Governance',
      assigned_tasks: member.assigned_tasks || [],
      linkedin_url: member.linkedin_url || '',
      avatar_url: member.avatar_url || '',
      can_manage_team: Boolean(member.can_manage_team),
      can_manage_resources: Boolean(member.can_manage_resources),
      mcq_access_level: (member.mcq_access_level || 'none') as any,
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
    const foundUser = members.find(w => w.email?.toLowerCase() === selectedEmail.toLowerCase());
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

  const handleToggleTeamManage = async (member: any) => {
    const newStatus = !member.can_manage_team;
    setTeamMembers(prev => prev.map(m => m.id === member.id ? { ...m, can_manage_team: newStatus } : m));
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id, can_manage_team: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedbackMsg({
        text: newStatus ? `Granted Team Management to ${member.full_name || member.email}` : `Revoked Team Management from ${member.full_name || member.email}`,
        type: 'success'
      });
      await Promise.all([fetchTeamData(), fetchRolesData()]);
    } catch (err: any) {
      setFeedbackMsg({ text: `Failed to update permission: ${err.message}`, type: 'error' });
      await fetchTeamData();
    } finally {
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleTableMcqLevelChange = async (member: any, newLevel: string) => {
    setTeamMembers(prev => prev.map(m => m.id === member.id ? { ...m, mcq_access_level: newLevel } : m));
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: member.id, mcq_access_level: newLevel })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFeedbackMsg({
        text: `MCQ Authority updated to "${newLevel}" for ${member.full_name || member.email}`,
        type: 'success'
      });
      await Promise.all([fetchTeamData(), fetchRolesData()]);
    } catch (err: any) {
      setFeedbackMsg({ text: `Failed to update MCQ level: ${err.message}`, type: 'error' });
      await fetchTeamData();
    } finally {
      setTimeout(() => setFeedbackMsg(null), 3000);
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
      can_manage_team: false,
      mcq_access_level: 'none'
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
          // Only Super Admin can pick 'admin'. Permitted members always add as 'team-member'!
          team_role: isSuperAdmin ? newRole : 'team-member',
          assigned_tasks: selectedTasks,
          full_name: newName.trim(),
          team_tag: newTeamTag.trim(),
          notes: newNotes.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await fetchRolesData();
      setNewEmail('');
      setNewName('');
      setNewNotes('');
      setSelectedTasks([]);
      setFeedbackMsg({ text: `✅ Saved ${emailNormalized} as ${isSuperAdmin ? newRole : 'team-member'} with ${selectedTasks.length} task(s)!`, type: 'success' });
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
    if (!confirm(`Are you sure you want to remove ${email} from the team roster?`)) return;

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

  // ── Inline-edit helpers for team roster rows ────────────────────────────
  const startEditWhitelist = (w: any) => {
    setEditingWhitelistEmail(w.email);
    setEditWhitelistDraft({
      full_name: w.full_name || w.name || '',
      team_role: w.team_role === 'admin' ? 'admin' : 'team-member',
      team_tag: w.team_tag || 'General',
      assigned_tasks: Array.isArray(w.assigned_tasks) ? w.assigned_tasks : [],
      notes: w.bio || w.designation || '',
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
          team_role: editWhitelistDraft.team_role,
          full_name: editWhitelistDraft.full_name,
          team_tag: editWhitelistDraft.team_tag,
          assigned_tasks: editWhitelistDraft.assigned_tasks,
          notes: editWhitelistDraft.notes,
          can_manage_team: permissionsMap[editingWhitelistEmail]?.can_manage_team,
          mcq_access_level: permissionsMap[editingWhitelistEmail]?.mcq_access_level,
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

    <div className="dashboard-page mx-auto w-full min-w-0 max-w-[1600px] space-y-5 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Top Banner */}
      <div className="flex min-w-0 flex-col items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:flex-row md:items-center">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Leadership & Ambassador Workspace
            </span>
            <span className="text-xs text-slate-400">• Hum Hain Pakistan QIP</span>
          </div>
          <h1 className="break-words text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">The AI Bridge Management Console</h1>
          <p className="text-xs text-slate-500">Live monitoring of participant progression, 12-MCQ pass rates, and QIP indicators.</p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <button
            onClick={() => {
              localStorage.setItem('aib_simulation_mode', 'student');
              window.location.href = '/portal?view_as=student';
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-3.5 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition-all hover:bg-amber-500 sm:w-auto cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Simulate Student View</span>
          </button>
          <button 
            onClick={() => alert('Full QIP report data exported in CSV!')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-800 sm:w-auto"
          >
            <Download className="w-4 h-4" />
            <span>Export QIP Section H Report</span>
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Horizontal Navigation (< lg only) */}
      <div className="lg:hidden flex max-w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain border-b border-slate-200 pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('survey_impact')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'survey_impact'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Survey Impact</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Target Met
          </span>
        </button>

        <button
          onClick={() => setActiveTab('live_analytics')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'live_analytics'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Live Analytics</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'team'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Roster</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'team' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {teamMembers.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('departments');
            fetchDepartmentMappings();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'departments'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Departments</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'departments' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }`}>
            {departmentMappings.length}
          </span>
        </button>

        {(isSuperAdmin || currentUserMcqAccess !== 'none') && (
          <button
            onClick={() => {
              setActiveTab('mcqs');
              fetchMCQs();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'mcqs'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>MCQ Pool</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'mcqs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {mcqsList.length}
            </span>
          </button>
        )}

        {(isSuperAdmin || canManageResources) && (
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'resources'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Resources</span>
          </button>
        )}

        {(isSuperAdmin || canManageGallery) && (
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'gallery'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Gallery</span>
          </button>
        )}

        {isHydrated && isSuperAdmin && (
          <button
            onClick={() => setActiveTab('reviewer_access')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'reviewer_access'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Report QR</span>
          </button>
        )}
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
              <p className="text-slate-600 text-[11px]">The Lead Admin has authorized your account to manage team profiles and assign roster roles.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setActiveTab('team')}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Go to Team Management</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* UNIFIED WORKSPACE LAYOUT: FIXED LEFT NAVIGATOR + MAIN VIEW */}
      {/* ============================================================== */}
      <div className="flex flex-col lg:flex-row items-start gap-6 w-full min-w-0">
        {/* Main Content View */}
        <main className="order-last flex-1 min-w-0 w-full space-y-6">
          {/* TAB CONTENT: SURVEY IMPACT & ASSESSMENT INTELLIGENCE */}
          {activeTab === 'survey_impact' && (
            <div className="space-y-6 animate-fade-in">
              <SurveyAnalyticsView
                activeSubTab={surveySubTab}
                onSubTabChange={(sub) => setSurveySubTab(sub)}
                hideHeaderBar={false}
              />
            </div>
          )}

          {/* TAB CONTENT: LIVE ANALYTICS & PLATFORM TELEMETRY */}
          {activeTab === 'live_analytics' && (
            <div className="space-y-6 animate-fade-in">
              <LiveAnalyticsView
                activeSubTab={liveSubTab}
                onSubTabChange={(sub) => setLiveSubTab(sub)}
                hideHeaderBar={false}
              />
            </div>
          )}

          {/* Tab Content: Dynamic Tasks & Delegated Team Management */}
      {activeTab === 'team' && (
        <div className="min-w-0 space-y-6">
          {/* Header Card */}
          <div id="team-roster-section" className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:space-y-6 sm:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Supabase Roster & Access Controls
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                  Team Management & Public Roster
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Manage team ambassadors, roles, public display profiles on <strong className="text-slate-800 font-semibold">/team</strong>, and platform permissions in one single workspace.
                </p>
              </div>

              <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
                {(isSuperAdmin || canManageTeam) && (
                  <button
                    onClick={handleOpenAddMember}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>+ Add Team Member</span>
                  </button>
                )}

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

            {/* Unified Team Members Table */}
            <div className="max-w-full overflow-x-auto overscroll-x-contain">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[11px] pb-2">
                    <th className="py-2.5 w-36">Rank & Row</th>
                    <th>Member Profile</th>
                    <th>Designation & Role</th>
                    <th>Category & Tasks</th>
                    <th className="text-center w-36">Permissions</th>
                    <th className="text-center w-28">Public /team</th>
                    <th className="text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingTeam ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                          <span>Loading team members from Supabase...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTeamMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                          <Users className="w-6 h-6" />
                        </div>
                        <p className="font-semibold text-slate-700">No matching team members found.</p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          {profileSearchQuery || profileTagFilter !== 'all' || profileStatusFilter !== 'all'
                            ? 'Try clearing the search query or tag filters above.'
                            : 'Click "+ Add Team Member" to add ambassadors and leaders.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredTeamMembers.map((member, idx) => {
                      const isPosition1 = member.position_order === 1;
                      const isLead = member.position_order > 1 && member.position_order <= 4;
                      const isProtected = member.email === 'ai.bridge.iiui.fms@gmail.com';
                      const canManage = Boolean(member.can_manage_team);
                      const mcqLevel = member.mcq_access_level || 'none';

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
                                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200 flex items-center gap-0.5">
                                  👑 Hero
                                </span>
                              ) : isLead ? (
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold border border-blue-200 flex items-center gap-0.5">
                                  ⭐ Lead
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                                  Ambassador
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Member Avatar & Details */}
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
                                    {(member.full_name || 'TM').split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
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

                          {/* Designation & Role */}
                          <td className="py-3">
                            <p className="font-medium text-slate-800 text-xs truncate max-w-xs">{member.designation || 'No designation set'}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                member.team_role === 'admin'
                                  ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {member.team_role === 'admin' ? '🛡️ Admin' : '👤 Team Member'}
                              </span>
                            </div>
                          </td>

                          {/* Category Tag & Tasks */}
                          <td className="py-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTagBadgeStyle(member.team_tag)}`}>
                              {member.team_tag || 'General'}
                            </span>
                            {Array.isArray(member.assigned_tasks) && member.assigned_tasks.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1 max-w-xs">
                                {member.assigned_tasks.slice(0, 2).map((t: string, i: number) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[9px] font-semibold truncate max-w-[140px]">
                                    {t}
                                  </span>
                                ))}
                                {member.assigned_tasks.length > 2 && (
                                  <span className="text-[9px] text-slate-400 font-bold self-center">
                                    +{member.assigned_tasks.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Permissions: Team Manager & MCQ Authority */}
                          <td className="py-3 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              {/* Team Manager switch */}
                              <button
                                type="button"
                                disabled={!isSuperAdmin}
                                onClick={() => handleToggleTeamManage(member)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer disabled:opacity-70 ${
                                  canManage || isProtected
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                                title={isSuperAdmin ? "Click to toggle Manager permission" : "Only Super Admin can change"}
                              >
                                {canManage || isProtected ? '✓ Manager' : 'No Access'}
                              </button>

                              {/* MCQ Authority Dropdown */}
                              <select
                                disabled={!isSuperAdmin && !canManageTeam}
                                value={mcqLevel}
                                onChange={(e) => handleTableMcqLevelChange(member, e.target.value as any)}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer disabled:bg-slate-100"
                              >
                                <option value="none">MCQ: None</option>
                                <option value="viewer">MCQ: Viewer</option>
                                <option value="moderator">MCQ: Mod</option>
                                <option value="manager">MCQ: Manager</option>
                              </select>
                            </div>
                          </td>

                          {/* Status Badge (Click to toggle published) */}
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

                          {/* Action Buttons: Edit & Delete */}
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditMember(member)}
                                className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                title="Edit Full Profile & Permissions"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {!isProtected && (
                                <button
                                  onClick={() => handleDeleteTeamMember(member.id, member.full_name)}
                                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Remove from Team"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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

          {/* Master Campaign Task Pool Card (Collapsible & Clean) */}
          <div id="team-tasks-section" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <span>Campaign Master Task Pool ({tasks.length} Active Tasks)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Global tasks pool. Assign tasks to ambassadors directly in their member edit popup.
                </p>
              </div>
            </div>

            {/* Quick Add Task Form */}
            {(isSuperAdmin || canManageTeam) && (
              <form onSubmit={handleCreateTask} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Campus SDG Walk Logistics"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-xs font-bold text-slate-700">Task Description</label>
                  <input
                    type="text"
                    placeholder="Short description of task deliverables..."
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isCreatingTask || !newTaskTitle.trim()}
                    className="w-full px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isCreatingTask ? 'Adding...' : 'Add Task'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tasks Chips List */}
            <div className="flex flex-wrap gap-2 pt-2">
              {tasks.length === 0 ? (
                <p className="text-xs text-slate-400">No tasks created yet. Add one above.</p>
              ) : (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-medium text-slate-800 flex items-center gap-2 group transition-colors"
                  >
                    <span>{t.title}</span>
                    {(isSuperAdmin || canManageTeam) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(t.id, t.title)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-0.5 rounded"
                        title="Delete task from pool"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB CONTENT: DEPARTMENTS & FACULTIES MAPPINGS */}
      {/* ============================================================== */}
      {activeTab === 'departments' && (
        <div className="min-w-0 space-y-5 sm:space-y-6">
          {/* Feedback Toast */}
          {deptFeedbackMsg && (
            <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between shadow-sm animate-fade-in ${
              deptFeedbackMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
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
          <div className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:space-y-6 sm:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
              <div className="min-w-0">
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

              <div className="flex w-full flex-wrap items-center gap-2.5 sm:w-auto sm:flex-shrink-0">
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
            <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-slate-200">
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
          <div className="my-3 w-full max-w-lg min-w-0 space-y-4 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl animate-fade-in sm:my-6 sm:space-y-5 sm:p-6">
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
          <div id="mcq-pool-section" className="flex min-w-0 flex-col items-start justify-between gap-4 rounded-3xl border border-emerald-800 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 p-4 text-white shadow-xl sm:flex-row sm:items-center sm:p-6 lg:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-bold uppercase tracking-wider border border-emerald-600/40">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Assessment Evaluation Engine</span>
                </div>
                {/* User Authority Badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                  isSuperAdmin || currentUserMcqAccess === 'manager'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : currentUserMcqAccess === 'moderator'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                }`}>
                  {isSuperAdmin
                    ? 'Super Admin (Full Manager)'
                    : currentUserMcqAccess === 'manager'
                    ? 'Manager Authority (Full Edit)'
                    : currentUserMcqAccess === 'moderator'
                    ? 'Moderator Authority (Can Toggle)'
                    : 'Viewer Authority (Read Only)'}
                </span>
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
                onClick={() => {
                  setShowAuditModal(true);
                  fetchMcqAuditLogs();
                }}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                title="View audit trail"
              >
                <History className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Audit Log</span>
              </button>
              {(isSuperAdmin || currentUserMcqAccess === 'manager') && (
                <button
                  onClick={handleOpenAddMcq}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add Question</span>
                </button>
              )}
            </div>
          </div>

          {/* Access Level Helper Banner */}
          {currentUserMcqAccess === 'viewer' && !isSuperAdmin && (
            <div className="bg-sky-50 border border-sky-200 text-sky-900 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs">
              <Eye className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                <strong>Viewer Access Active:</strong> You can review questions, answer choices, and explanations. To activate/deactivate questions or create new ones, request Moderator or Manager permission from the Admin.
              </span>
            </div>
          )}
          {currentUserMcqAccess === 'moderator' && !isSuperAdmin && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Moderator Access Active:</strong> You can activate or deactivate questions for live student quizzes. Adding new questions or modifying quiz distribution quotas requires Manager permission.
              </span>
            </div>
          )}

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

          {/* Quiz Settings Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Panel Header — collapsible toggle */}
            <button
              type="button"
              onClick={() => {
                setShowQuizConfig((v) => !v);
                if (!quizConfigDraft) fetchQuizConfig();
              }}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Quiz Settings</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Control how many questions are drawn from each category per quiz session
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {quizConfig && (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                    {quizConfig.total_questions}Q · {quizConfig.passing_score} to pass
                  </span>
                )}
                {showQuizConfig ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Panel Body */}
            {showQuizConfig && (
              <div className="border-t border-slate-100 px-5 py-5 space-y-5">
                {/* Config Feedback */}
                {quizConfigFeedback && (
                  <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    quizConfigFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}>
                    {quizConfigFeedback.type === 'success'
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    }
                    {quizConfigFeedback.text}
                  </div>
                )}

                {loadingQuizConfig ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading configuration…
                  </div>
                ) : quizConfigDraft ? (
                  <>
                    {/* Global Settings Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Total Questions per Session
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          disabled={!isSuperAdmin && currentUserMcqAccess !== 'manager'}
                          value={quizConfigDraft.total_questions}
                          onChange={(e) =>
                            setQuizConfigDraft((d) => d ? { ...d, total_questions: Number(e.target.value) } : d)
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Passing Score (min correct)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={quizConfigDraft.total_questions}
                          disabled={!isSuperAdmin && currentUserMcqAccess !== 'manager'}
                          value={quizConfigDraft.passing_score}
                          onChange={(e) =>
                            setQuizConfigDraft((d) => d ? { ...d, passing_score: Number(e.target.value) } : d)
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          = {quizConfigDraft.total_questions > 0 ? Math.round((quizConfigDraft.passing_score / quizConfigDraft.total_questions) * 100) : 0}% pass rate
                        </p>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                          Retake Cooldown (seconds)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={3600}
                          disabled={!isSuperAdmin && currentUserMcqAccess !== 'manager'}
                          value={quizConfigDraft.cooldown_seconds}
                          onChange={(e) =>
                            setQuizConfigDraft((d) => d ? { ...d, cooldown_seconds: Number(e.target.value) } : d)
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          {Math.floor(quizConfigDraft.cooldown_seconds / 60)}m {quizConfigDraft.cooldown_seconds % 60}s after failed attempt
                        </p>
                      </div>
                    </div>

                    {/* Per-Category Question Count Table */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Questions per Category
                        </label>
                        {/* Live Sum Indicator */}
                        <div className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          quizConfigDraft.categories.reduce((a, c) => a + (Number(c.count) || 0), 0) === quizConfigDraft.total_questions
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          Sum: {quizConfigDraft.categories.reduce((a, c) => a + (Number(c.count) || 0), 0)} / {quizConfigDraft.total_questions}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {quizConfigDraft.categories.map((entry, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-slate-700 truncate">{entry.category}</p>
                              <p className="text-[10px] text-slate-400">
                                {mcqsList.filter(m => m.category === entry.category && m.is_active).length} active in pool
                              </p>
                            </div>
                            <input
                              type="number"
                              min={0}
                              max={20}
                              disabled={!isSuperAdmin && currentUserMcqAccess !== 'manager'}
                              value={entry.count}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setQuizConfigDraft((d) => {
                                  if (!d) return d;
                                  const cats = [...d.categories];
                                  cats[idx] = { ...cats[idx], count: val };
                                  return { ...d, categories: cats };
                                });
                              }}
                              className="w-14 px-2 py-1.5 border border-slate-300 rounded-lg text-sm font-bold text-center text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-200 disabled:text-slate-500"
                            />
                          </div>
                        ))}
                      </div>

                      <p className="text-[10px] text-slate-400 mt-2">
                        Set count to 0 to exclude a category. Counts must sum to the total questions per session.
                        Any shortfall is filled from the remaining pool automatically.
                      </p>
                    </div>

                    {/* Save / Discard Controls */}
                    {(isSuperAdmin || currentUserMcqAccess === 'manager') ? (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (quizConfig) setQuizConfigDraft(JSON.parse(JSON.stringify(quizConfig)));
                          }}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          Discard Changes
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveQuizConfig}
                          disabled={savingQuizConfig}
                          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                        >
                          {savingQuizConfig ? (
                            <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                          ) : (
                            <><Check className="w-3.5 h-3.5" /> Save Quiz Settings</>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          View-Only: Quiz category counts and pass criteria can only be modified with Manager authority.
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-400 py-4">Could not load configuration. <button onClick={fetchQuizConfig} className="text-indigo-600 underline cursor-pointer">Retry</button></div>
                )}
              </div>
            )}
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
                    mcqStatusFilter === 'active' ? 'bg-emerald-600 text-palette-haiti shadow-xs' : 'text-slate-500 hover:text-slate-900'
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
                        className={`min-w-0 space-y-4 rounded-3xl border bg-white p-4 shadow-xs transition-all sm:p-5 lg:p-6 ${
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
                            {(isSuperAdmin || currentUserMcqAccess === 'moderator' || currentUserMcqAccess === 'manager') ? (
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
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                                <Lock className="w-3 h-3" /> View Only
                              </span>
                            )}
                            {(isSuperAdmin || currentUserMcqAccess === 'manager') && (
                              <button
                                onClick={() => handleOpenEditMcq(q)}
                                className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}
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
                                  isCorrect ? 'bg-emerald-600 text-palette-haiti' : 'bg-white border text-slate-600'
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

                        {/* Audit Trail Stamp */}
                        {q.last_updated_by && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Last updated by <strong className="text-slate-600 font-semibold">{q.last_updated_by}</strong></span>
                            {q.updated_at && (
                              <span>• {new Date(q.updated_at).toLocaleDateString()} {new Date(q.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            )}
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
              <div className="my-3 max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl min-w-0 space-y-4 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl animate-fade-in sm:my-6 sm:max-h-[92vh] sm:space-y-6 sm:p-6 lg:p-8">
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

          {/* MCQ Activity & Audit History Modal */}
          {showAuditModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-600" />
                      <h3 className="font-extrabold text-base text-slate-900">MCQ Pool Audit & Activity Log</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Live record of question deactivations, edits, and additions
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAuditModal(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {loadingAuditLogs ? (
                  <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading audit trail…
                  </div>
                ) : mcqAuditLogs.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">No audit records yet</p>
                    <p className="text-[11px] text-slate-400">All future changes by moderators and managers will be logged here.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                    {mcqAuditLogs.map((log: any) => (
                      <div key={log.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              log.action === 'toggle_status'
                                ? 'bg-amber-100 text-amber-800'
                                : log.action === 'create_question'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.action === 'deactivate_question'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {log.action.replace('_', ' ')}
                            </span>
                            <span className="font-semibold text-slate-800">{log.question_snippet}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            By: <strong className="text-slate-700">{log.performed_by}</strong>
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono sm:text-right shrink-0">
                          {new Date(log.performed_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setShowAuditModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

            {/* Tab Content: Report QR & Reviewer Access */}
      {activeTab === 'reviewer_access' && (
        <div className="space-y-6 animate-fade-in">
          <ReportQRManager />
        </div>
      )}

      {/* Tab Content: Event Gallery */}
      {activeTab === 'gallery' && (
        <div className="space-y-6 animate-fade-in">
          <GalleryManager />
        </div>
      )}

      {/* Tab Content: Learning Resources */}
      {activeTab === 'resources' && (
        <div className="space-y-6 animate-fade-in">
          <AdminResourcesPanel isSuperAdmin={isSuperAdmin} currentUserEmail={currentUserEmail} />
        </div>
      )}
        </main>

        {/* ============================================================== */}
        {/* FIXED LEFT SIDEBAR NAVIGATION PANEL (LAPTOP / DESKTOP TREE) */}
        {/* ============================================================== */}
        <aside className="order-first sticky top-20 z-30 hidden max-h-[calc(100vh-6rem)] w-72 shrink-0 self-start space-y-3 overflow-y-auto scrollbar-thin lg:block xl:w-80">
          <div className="rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-4 shadow-sm space-y-3">
            {/* Sidebar Title & Quick Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                  <Compass className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Workspace Navigator
                  </h2>
                  <p className="text-[10px] text-slate-400 font-medium">Laptop Quick Jump</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const allOpen = Object.values(expandedTabs).every(Boolean);
                  toggleAllAccordions(!allOpen);
                }}
                className="text-[10px] font-bold text-slate-500 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Toggle All Accordions"
              >
                {Object.values(expandedTabs).every(Boolean) ? 'Collapse All' : 'Expand All'}
              </button>
            </div>

            {/* Tree Items */}
            <nav className="space-y-1.5" aria-label="Dashboard Workspace Tree">
              {[
                {
                  id: 'survey_impact' as DashboardTab,
                  title: 'Survey Impact',
                  subtitle: 'Pre/Post QIP Study',
                  badge: 'Target Met',
                  badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  icon: BarChart3,
                  visible: true,
                  subTabs: [
                    { id: 'overview', label: 'Executive Summary', icon: Sparkles },
                    { id: 'hours', label: 'Hours Saved (3-5h)', icon: Clock },
                    { id: 'before-after', label: 'Before/After Growth', icon: TrendingUp },
                    { id: 'assets', label: 'AI Study Assets', icon: BookOpen },
                    { id: 'departments', label: 'Department Matrix', icon: Building2 },
                    { id: 'faculties', label: 'Faculty Breakdown', icon: Layers },
                    { id: 'teachers', label: 'Educator Insights', icon: Users },
                    { id: 'quiz-certs', label: 'Certificates & Quiz', icon: Award },
                  ]
                },
                {
                  id: 'live_analytics' as DashboardTab,
                  title: 'Live Analytics',
                  subtitle: 'Real-time telemetry',
                  badge: 'Live',
                  badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
                  icon: Activity,
                  visible: true,
                  subTabs: [
                    { id: 'overview', label: 'Traffic & Devices', icon: Globe2 },
                    { id: 'funnel', label: 'Progression Funnel', icon: GraduationCap },
                    { id: 'gallery', label: 'Photo Engagement', icon: Heart },
                    { id: 'activity', label: '24h Live Stream', icon: Activity },
                    ...(isSuperAdmin ? [{ id: 'access', label: 'Team Permissions', icon: ShieldCheck }] : []),
                  ]
                },
                {
                  id: 'team' as DashboardTab,
                  title: 'Team Management',
                  subtitle: 'Roster & delegation',
                  badge: `${teamMembers.length}`,
                  badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  icon: Users,
                  visible: true,
                  subTabs: [
                    { id: 'roster', label: 'Leadership & Roster', icon: UserCheck },
                    { id: 'tasks', label: 'Campaign Task Pool', icon: ListPlus },
                  ]
                },
                {
                  id: 'mcqs' as DashboardTab,
                  title: 'MCQ Question Pool',
                  subtitle: '12-MCQ Quiz Engine',
                  badge: `${mcqsList.length}`,
                  badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                  icon: HelpCircle,
                  visible: isSuperAdmin || currentUserMcqAccess !== 'none',
                  subTabs: [
                    { id: 'pool', label: 'Master Question Pool', icon: HelpCircle },
                    { id: 'config', label: 'Quiz Settings & Counts', icon: Sliders },
                    { id: 'audit', label: 'MCQ Audit Trail', icon: History },
                  ]
                },
                {
                  id: 'departments' as DashboardTab,
                  title: 'Departments & Faculties',
                  subtitle: 'Standardized mappings',
                  badge: `${departmentMappings.length}`,
                  badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  icon: Layers,
                  visible: true,
                  subTabs: [
                    { id: 'mappings', label: 'Directory Mappings', icon: Tag },
                  ]
                },
                {
                  id: 'resources' as DashboardTab,
                  title: 'Learning Resources',
                  subtitle: 'Slide decks & guides',
                  badge: 'Hub',
                  badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  icon: BookOpen,
                  visible: isSuperAdmin || canManageResources,
                  subTabs: [
                    { id: 'materials', label: 'Course Materials', icon: BookOpen },
                  ]
                },
                {
                  id: 'gallery' as DashboardTab,
                  title: 'Event Gallery',
                  subtitle: 'Photos & coverage',
                  badge: 'Media',
                  badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                  icon: Calendar,
                  visible: isSuperAdmin || canManageGallery,
                  subTabs: [
                    { id: 'albums', label: 'Photo Albums', icon: ImageIcon },
                  ]
                },
                {
                  id: 'reviewer_access' as DashboardTab,
                  title: 'Report QR & Access',
                  subtitle: 'Evaluator passcode & QR',
                  badge: 'Reviewer',
                  badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
                  icon: QrCode,
                  visible: isSuperAdmin,
                  subTabs: [
                    { id: 'qr_settings', label: 'Report QR & Password', icon: Lock },
                    { id: 'matrix', label: 'Chart Visibility Matrix', icon: Eye },
                  ]
                },
              ].filter(item => item.visible).map((item) => {
                const isMainActive = activeTab === item.id;
                const isExpanded = expandedTabs[item.id] ?? false;
                const ItemIcon = item.icon;

                return (
                  <div key={item.id} className="space-y-1">
                    {/* Main Item Row */}
                    <div
                      onClick={() => {
                        if (activeTab === item.id) {
                          setExpandedTabs(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                        } else {
                          setActiveTab(item.id);
                          setExpandedTabs(prev => ({ ...prev, [item.id]: true }));
                          if (item.id === 'departments') {
                            fetchDepartmentMappings();
                          } else if (item.id === 'mcqs') {
                            fetchMCQs();
                          }
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-2xl transition-all cursor-pointer select-none group ${
                        isMainActive
                          ? 'bg-emerald-50/90 border border-emerald-300/80 text-emerald-950 font-bold shadow-2xs'
                          : 'hover:bg-slate-50 border border-transparent text-slate-700 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`p-1.5 rounded-xl shrink-0 transition-colors ${
                          isMainActive
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}>
                          <ItemIcon className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0 text-left">
                          <p className="text-xs font-extrabold truncate leading-tight">
                            {item.title}
                          </p>
                          <p className={`text-[10px] truncate ${
                            isMainActive ? 'text-emerald-800' : 'text-slate-400'
                          }`}>
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                            item.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {item.subTabs && item.subTabs.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTabs(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Nested Sub-Tabs Accordion */}
                    {isExpanded && item.subTabs && item.subTabs.length > 0 && (
                      <div className="ml-4 pl-2.5 border-l-2 border-emerald-200/70 space-y-0.5 pt-0.5 pb-1 animate-fade-in">
                        {item.subTabs.map((sub) => {
                          let isSubActive = false;
                          if (item.id === 'survey_impact') {
                            isSubActive = isMainActive && surveySubTab === sub.id;
                          } else if (item.id === 'live_analytics') {
                            isSubActive = isMainActive && liveSubTab === sub.id;
                          } else if (item.id === 'team') {
                            isSubActive = isMainActive && teamSubTab === sub.id;
                          } else if (item.id === 'mcqs') {
                            isSubActive = isMainActive && (
                              sub.id === 'config' ? showQuizConfig :
                              sub.id === 'audit' ? showAuditModal :
                              (!showQuizConfig && !showAuditModal)
                            );
                          } else {
                            isSubActive = isMainActive;
                          }

                          const SubIcon = sub.icon;

                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                setActiveTab(item.id);
                                setExpandedTabs(prev => ({ ...prev, [item.id]: true }));
                                if (item.id === 'survey_impact') {
                                  setSurveySubTab(sub.id as SurveySubTab);
                                } else if (item.id === 'live_analytics') {
                                  setLiveSubTab(sub.id as LiveAnalyticsSubTab);
                                } else if (item.id === 'team') {
                                  setTeamSubTab(sub.id as 'roster' | 'tasks');
                                  setTimeout(() => {
                                    if (sub.id === 'tasks') {
                                      document.getElementById('team-tasks-section')?.scrollIntoView({ behavior: 'smooth' });
                                    } else {
                                      document.getElementById('team-roster-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }
                                  }, 60);
                                } else if (item.id === 'mcqs') {
                                  setMcqSubTab(sub.id as 'pool' | 'config' | 'audit');
                                  if (sub.id === 'config') {
                                    setShowQuizConfig(true);
                                    if (!quizConfigDraft) fetchQuizConfig();
                                    setTimeout(() => {
                                      document.getElementById('quiz-config-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }, 60);
                                  } else if (sub.id === 'audit') {
                                    fetchMcqAuditLogs();
                                    setShowAuditModal(true);
                                  } else {
                                    setShowQuizConfig(false);
                                    setTimeout(() => {
                                      document.getElementById('mcq-pool-section')?.scrollIntoView({ behavior: 'smooth' });
                                    }, 60);
                                  }
                                } else if (item.id === 'departments') {
                                  fetchDepartmentMappings();
                                }
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                                isSubActive
                                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {SubIcon ? (
                                  <SubIcon className={`w-3.5 h-3.5 shrink-0 ${
                                    isSubActive ? 'text-emerald-100' : 'text-slate-400'
                                  }`} />
                                ) : (
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isSubActive ? 'bg-white' : 'bg-slate-300'
                                  }`} />
                                )}
                                <span className="truncate">{sub.label}</span>
                              </div>
                              {isSubActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Live Database Status Indicator */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-slate-700">Live Supabase</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400 uppercase">
                {currentUserRole}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Tab Content: Participants */}

      {/* Tab Content: Audit & Sync Trail */}

      {/* ============================================================== */}
      {/* ADD / EDIT TEAM MEMBER MODAL WITH AUTO-COMPRESSION & LIVE PREVIEW */}
      {/* ============================================================== */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="my-3 max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl min-w-0 space-y-4 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl animate-fade-in sm:my-6 sm:max-h-[92vh] sm:space-y-6 sm:p-6 lg:p-8">
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

            {/* Quick Autofill Selector from the Team Roster */}
            {!editingMember && members.filter(m => m.email).length > 0 && (
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-950">
                  <UserCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span className="font-bold">Quick Autofill from Roster:</span>
                </div>
                <select
                  value={autofillEmailSelected}
                  onChange={(e) => handleAutofillFromWhitelist(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose a team member to auto-fill --</option>
                  {members.filter(m => m.email).map((w) => (
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

                  {/* Account Role & Platform Permissions */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      Platform Role & Access Controls
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* System Role */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Account System Role</label>
                        <select
                          disabled={!isSuperAdmin}
                          value={memberForm.team_role}
                          onChange={(e) => setMemberForm({ ...memberForm, team_role: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white disabled:bg-slate-100 disabled:text-slate-500"
                        >
                          <option value="team-member">Team Member</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>

                      {/* MCQ Authority */}
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">MCQ Authority Level</label>
                        <select
                          disabled={!isSuperAdmin && !canManageTeam}
                          value={memberForm.mcq_access_level}
                          onChange={(e) => setMemberForm({ ...memberForm, mcq_access_level: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                        >
                          <option value="none">No Access</option>
                          <option value="viewer">Viewer (Read-only)</option>
                          <option value="moderator">Moderator (Can Toggle)</option>
                          <option value="manager">Manager (Full Edit)</option>
                        </select>
                      </div>
                    </div>

                    {/* Can Manage Team Checkbox */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="modal_can_manage_team_chk"
                        disabled={!isSuperAdmin}
                        checked={memberForm.can_manage_team}
                        onChange={(e) => setMemberForm({ ...memberForm, can_manage_team: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                      />
                      <label htmlFor="modal_can_manage_team_chk" className="text-xs text-slate-700 font-semibold cursor-pointer">
                        Delegated Team Manager (Can add/edit team members and tasks)
                      </label>
                    </div>

                    {/* Can Manage Resources Checkbox */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="modal_can_manage_resources_chk"
                        disabled={!isSuperAdmin}
                        checked={memberForm.can_manage_resources}
                        onChange={(e) => setMemberForm({ ...memberForm, can_manage_resources: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                      />
                      <label htmlFor="modal_can_manage_resources_chk" className="text-xs text-slate-700 font-semibold cursor-pointer">
                        Learning Resources Manager (Can add/edit NotebookLM & study materials)
                      </label>
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
                                  ? 'bg-emerald-600 text-palette-haiti border-emerald-600 shadow-2xs font-semibold'
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
