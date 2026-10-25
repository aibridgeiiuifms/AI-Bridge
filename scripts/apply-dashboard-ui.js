const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to LF for consistent matching, then restore CRLF
const hasCRLF = code.includes('\r\n');
if (hasCRLF) {
  code = code.replace(/\r\n/g, '\n');
}

console.log('Original code length:', code.length);

// 1. Check and replace Imports & State
const target1 = `  ArrowUpDown,
  Sliders,
  ChevronUp,
  ChevronDown,
  EyeOff,
  BookOpen,
  QrCode
} from 'lucide-react';
import { compressImageToMaxKB, uploadTeamAvatar } from '@/lib/imageCompression';
import GalleryManager from '@/components/dashboard/GalleryManager';
import AdminResourcesPanel from '@/components/dashboard/AdminResourcesPanel';
import ReportQRManager from '@/components/dashboard/ReportQRManager';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'team' | 'team_profiles' | 'departments' | 'mcqs' | 'gallery' | 'resources' | 'reviewer_access'>('team');`;

const replace1 = `  ArrowUpDown,
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
  Compass
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
  };`;

if (!code.includes(target1)) {
  console.error('ERROR: target1 not found!');
  process.exit(1);
}
code = code.replace(target1, replace1);
console.log('Step 1 (Imports & Types) replaced successfully.');

// 2. URL parameters check
const target2 = `      const tabParam = params.get('tab');
      if (tabParam && ['metrics', 'participants', 'mcqs', 'team', 'audit', 'gallery', 'resources'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }`;

const replace2 = `      const tabParam = params.get('tab');
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
      }`;

if (!code.includes(target2)) {
  console.error('ERROR: target2 not found!');
  process.exit(1);
}
code = code.replace(target2, replace2);
console.log('Step 2 (URL Params) replaced successfully.');

// 3. Container max-width
const target3 = `<div className="dashboard-page mx-auto w-full min-w-0 max-w-7xl space-y-5 px-3 py-5 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">`;
const replace3 = `<div className="dashboard-page mx-auto w-full min-w-0 max-w-[1600px] space-y-5 px-3 py-5 sm:space-y-6 sm:px-6 sm:py-8 lg:px-8">`;

if (!code.includes(target3)) {
  console.error('ERROR: target3 not found!');
  process.exit(1);
}
code = code.replace(target3, replace3);
console.log('Step 3 (Max Width) replaced successfully.');

// 4. Mobile tabs navigation & Layout split
// Find the tabs section from line 1230 down to where team tab content starts
const targetTabsStart = `      {/* Tabs - two functional tabs only */}`;
const targetTeamContentStart = `      {/* Tab Content: Dynamic Tasks & Delegated Team Management */}
      {activeTab === 'team' && (`;

const tabsStartIndex = code.indexOf(targetTabsStart);
const teamContentIndex = code.indexOf(targetTeamContentStart);

if (tabsStartIndex === -1 || teamContentIndex === -1) {
  console.error('ERROR: targetTabsStart or targetTeamContentStart not found!', { tabsStartIndex, teamContentIndex });
  process.exit(1);
}

const oldTabsAndBannerSection = code.substring(tabsStartIndex, teamContentIndex);

const newTabsAndSplitSection = `      {/* Mobile / Tablet Horizontal Navigation (< lg only) */}
      <div className="lg:hidden flex max-w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain border-b border-slate-200 pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('survey_impact')}
          className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap \${
            activeTab === 'survey_impact'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
          }\`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Survey Impact</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Target Met
          </span>
        </button>

        <button
          onClick={() => setActiveTab('live_analytics')}
          className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap \${
            activeTab === 'live_analytics'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
          }\`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Live Analytics</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap \${
            activeTab === 'team'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
          }\`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Roster</span>
          <span className={\`px-1.5 py-0.5 rounded-full text-[10px] font-bold \${
            activeTab === 'team' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }\`}>
            {teamMembers.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('departments');
            fetchDepartmentMappings();
          }}
          className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap \${
            activeTab === 'departments'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
          }\`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Departments</span>
          <span className={\`px-1.5 py-0.5 rounded-full text-[10px] font-bold \${
            activeTab === 'departments' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
          }\`}>
            {departmentMappings.length}
          </span>
        </button>

        {(isSuperAdmin || currentUserMcqAccess !== 'none') && (
          <button
            onClick={() => {
              setActiveTab('mcqs');
              fetchMCQs();
            }}
            className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap \${
              activeTab === 'mcqs'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
            }\`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>MCQ Pool</span>
            <span className={\`px-1.5 py-0.5 rounded-full text-[10px] font-bold \${
              activeTab === 'mcqs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }\`}>
              {mcqsList.length}
            </span>
          </button>
        )}

        {(isSuperAdmin || canManageResources) && (
          <button
            onClick={() => setActiveTab('resources')}
            className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap \${
              activeTab === 'resources'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
            }\`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Resources</span>
          </button>
        )}

        {(isSuperAdmin || canManageGallery) && (
          <button
            onClick={() => setActiveTab('gallery')}
            className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap \${
              activeTab === 'gallery'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
            }\`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Gallery</span>
          </button>
        )}

        {isHydrated && isSuperAdmin && (
          <button
            onClick={() => setActiveTab('reviewer_access')}
            className={\`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap \${
              activeTab === 'reviewer_access'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
            }\`}
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
      {/* UNIFIED WORKSPACE LAYOUT: MAIN VIEW (LEFT) + LAPTOP NAVIGATOR (RIGHT) */}
      {/* ============================================================== */}
      <div className="flex flex-col lg:flex-row items-start gap-6 w-full min-w-0">
        {/* Main Content View */}
        <main className="flex-1 min-w-0 w-full space-y-6">
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

    `;

code = code.replace(oldTabsAndBannerSection, newTabsAndSplitSection);
console.log('Step 4 (Mobile Bar & Split Layout Start) replaced successfully.');

// 5. Add section IDs for scrolling in team & mcqs
// Team roster
const targetTeamCard = `<div className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:space-y-6 sm:p-6 lg:p-8">`;
code = code.replace(targetTeamCard, `<div id="team-roster-section" className="min-w-0 space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:space-y-6 sm:p-6 lg:p-8">`);

// Team tasks
const targetTasksCard = `{/* Master Campaign Task Pool Card (Collapsible & Clean) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8 space-y-4">`;
code = code.replace(targetTasksCard, `{/* Master Campaign Task Pool Card (Collapsible & Clean) */}
          <div id="team-tasks-section" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8 space-y-4">`);

// MCQ pool
const targetMcqCard = `{/* Header Card */}
          <div className="flex min-w-0 flex-col items-start justify-between gap-4 rounded-3xl border border-emerald-800 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 p-4 text-white shadow-xl sm:flex-row sm:items-center sm:p-6 lg:p-8">`;
code = code.replace(targetMcqCard, `{/* Header Card */}
          <div id="mcq-pool-section" className="flex min-w-0 flex-col items-start justify-between gap-4 rounded-3xl border border-emerald-800 bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-900 p-4 text-white shadow-xl sm:flex-row sm:items-center sm:p-6 lg:p-8">`);

// Quiz config card
const targetQuizConfig = `{/* Collapsible Card */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">`;
code = code.replace(targetQuizConfig, `{/* Collapsible Card */}
          <div id="quiz-config-section" className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">`);

console.log('Step 5 (Section IDs) added successfully.');

// 6. Close <main> and insert the Right-Hand Sidebar Navigation Tree before the modals start
const targetBeforeModals = `      {/* Tab Content: Learning Resources */}
      {activeTab === 'resources' && (
        <div className="space-y-6 animate-fade-in">
          <AdminResourcesPanel isSuperAdmin={isSuperAdmin} currentUserEmail={currentUserEmail} />
        </div>
      )}

      {/* Tab Content: Participants */}

      {/* Tab Content: Audit & Sync Trail */}

      {/* ============================================================== */}
      {/* ADD / EDIT TEAM MEMBER MODAL WITH AUTO-COMPRESSION & LIVE PREVIEW */}
      {/* ============================================================== */}`;

const rightSidebarCode = `      {/* Tab Content: Learning Resources */}
      {activeTab === 'resources' && (
        <div className="space-y-6 animate-fade-in">
          <AdminResourcesPanel isSuperAdmin={isSuperAdmin} currentUserEmail={currentUserEmail} />
        </div>
      )}
        </main>

        {/* ============================================================== */}
        {/* RIGHT-HAND SIDEBAR NAVIGATION PANEL (LAPTOP / DESKTOP TREE) */}
        {/* ============================================================== */}
        <aside className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto space-y-3 scrollbar-thin">
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
                  badge: \`\${teamMembers.length}\`,
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
                  badge: \`\${mcqsList.length}\`,
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
                  badge: \`\${departmentMappings.length}\`,
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
                      className={\`w-full flex items-center justify-between p-2 rounded-2xl transition-all cursor-pointer select-none group \${
                        isMainActive
                          ? 'bg-emerald-50/90 border border-emerald-300/80 text-emerald-950 font-bold shadow-2xs'
                          : 'hover:bg-slate-50 border border-transparent text-slate-700 font-semibold'
                      }\`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={\`p-1.5 rounded-xl shrink-0 transition-colors \${
                          isMainActive
                            ? 'bg-emerald-700 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }\`}>
                          <ItemIcon className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0 text-left">
                          <p className="text-xs font-extrabold truncate leading-tight">
                            {item.title}
                          </p>
                          <p className={\`text-[10px] truncate \${
                            isMainActive ? 'text-emerald-800' : 'text-slate-400'
                          }\`}>
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span className={\`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold border \${
                            item.badgeClass || 'bg-slate-100 text-slate-700 border-slate-200'
                          }\`}>
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
                              className={\`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-all cursor-pointer \${
                                isSubActive
                                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                              }\`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {SubIcon ? (
                                  <SubIcon className={\`w-3.5 h-3.5 shrink-0 \${
                                    isSubActive ? 'text-emerald-100' : 'text-slate-400'
                                  }\`} />
                                ) : (
                                  <span className={\`w-1.5 h-1.5 rounded-full shrink-0 \${
                                    isSubActive ? 'bg-white' : 'bg-slate-300'
                                  }\`} />
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
      {/* ============================================================== */}`;

if (!code.includes(targetBeforeModals)) {
  console.error('ERROR: targetBeforeModals not found!');
  process.exit(1);
}
code = code.replace(targetBeforeModals, rightSidebarCode);
console.log('Step 6 (Right Sidebar & Close Main) replaced successfully.');

if (hasCRLF) {
  code = code.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('ALL UPDATES APPLIED SUCCESSFULLY! New file size:', code.length);
