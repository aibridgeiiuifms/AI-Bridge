'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Sparkles, 
  LayoutDashboard, 
  GraduationCap, 
  Calendar, 
  Menu, 
  X, 
  LogOut, 
  LogIn, 
  User as UserIcon,
  Users
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [loading, setLoading] = useState(true);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
      }
    }
    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [profileDropdownOpen]);

  useEffect(() => {
    const supabase = createClient();
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user?.email) {
          // Check if user has admin or team-management access and retrieve profile info
          const { data: prof } = await supabase
            .from('profiles')
            .select('role, can_manage_team, full_name, avatar_url')
            .eq('email', user.email)
            .maybeSingle();

          if (prof) {
            setProfile(prof);
            const hasAccess =
              prof.role === 'admin' ||
              prof.role === 'super_admin' ||
              prof.can_manage_team === true;
            setIsPrivileged(hasAccess);
          }
        }
      } catch (err) {
        // Suppress placeholder supabase url errors during development
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsPrivileged(false);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const displayName = profile?.full_name 
    || user?.user_metadata?.full_name 
    || user?.user_metadata?.name 
    || (user?.email ? user.email.split('@')[0] : 'Participant');

  const getInitials = (name: string, email?: string) => {
    if (name && name !== email?.split('@')[0]) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'U';
  };

  // Base public links — no Verify Certificate (removed until real certs are ready)
  const publicLinks = [
    { name: 'Home', href: '/', icon: Sparkles },
    { name: 'Team & Leadership', href: '/team', icon: Users },
    { name: 'Events & Gallery', href: '/events', icon: Calendar },
    { name: 'Student Portal', href: '/portal', icon: GraduationCap },
  ];

  // Dashboard is only shown to admins / team managers
  const navLinks = isPrivileged
    ? [...publicLinks, { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }]
    : publicLinks;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-[68px]">
          {/* Brand Logo with Official AI Bridge Logo */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center group-hover:shadow-md group-hover:scale-105 transition-all p-0.5">
              <img
                src="/logo.jpg"
                alt="The AI Bridge Logo"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight group-hover:text-emerald-800 transition-colors">
                  The AI Bridge
                </span>
                <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  HHP SDG
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                <img src="/iiui-logo.jpg" alt="IIUI" className="w-3 h-3 object-contain rounded-full inline-block" />
                <span>Dept. of Tech & PM • FMS IIUI</span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Auth Actions: Desktop Profile Circle Avatar & Popdown */}
          <div className="hidden lg:flex items-center gap-2.5 flex-shrink-0 relative" ref={profileDropdownRef}>
            {!loading && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-sm shadow-sm ring-2 ring-emerald-500/20 hover:ring-emerald-500 hover:shadow-md transition-all cursor-pointer focus:outline-none overflow-hidden"
                  aria-label="User Profile"
                  aria-expanded={profileDropdownOpen}
                  title={`${displayName} (${user.email})`}
                >
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={displayName} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span>{getInitials(displayName, user.email)}</span>
                  )}
                </button>

                {/* Popdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 px-3 z-50 animate-fade-in divide-y divide-slate-100">
                    {/* User Info Header with Name and Email */}
                    <div className="pb-3 px-1">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs overflow-hidden">
                          {profile?.avatar_url ? (
                            <img 
                              src={profile.avatar_url} 
                              alt={displayName} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span>{getInitials(displayName, user.email)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-slate-500 truncate" title={user.email}>
                            {user.email}
                          </p>
                          <span className="inline-block mt-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                            {profile?.role ? profile.role.toUpperCase() : 'PARTICIPANT'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Links inside Popdown */}
                    <div className="py-2 space-y-1">
                      <Link
                        href="/portal"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                      >
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                        <span>Student Portal</span>
                      </Link>
                      {isPrivileged && (
                        <Link
                          href="/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                          <span>Leadership Dashboard</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout Option */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm shadow-emerald-800/20 transition-all hover:shadow cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-200" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Right Bar: Profile Avatar & Drawer Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {!loading && user && (
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-xs ring-1 ring-emerald-500/30 overflow-hidden cursor-pointer"
                aria-label="User Profile"
              >
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={displayName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span>{getInitials(displayName, user.email)}</span>
                )}
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setProfileDropdownOpen(false);
              }}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Profile Popdown (Positioned when tapped on mobile) */}
        {!loading && user && profileDropdownOpen && (
          <div className="lg:hidden absolute right-3 top-16 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-3 px-3 z-50 animate-fade-in divide-y divide-slate-100">
            <div className="pb-3 px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs overflow-hidden">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={displayName} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span>{getInitials(displayName, user.email)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate" title={user.email}>{user.email}</p>
                  <span className="inline-block mt-0.5 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                    {profile?.role ? profile.role.toUpperCase() : 'PARTICIPANT'}
                  </span>
                </div>
              </div>
            </div>

            <div className="py-2 space-y-1">
              <Link
                href="/portal"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
              >
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>Student Portal</span>
              </Link>
              {isPrivileged && (
                <Link
                  href="/dashboard"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                  <span>Leadership Dashboard</span>
                </Link>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 animate-fade-in shadow-lg">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {Icon && <Icon className="w-5 h-5 text-slate-400" />}
                {link.name}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-slate-100">
            {user ? (
              <div className="space-y-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{getInitials(displayName, user.email)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-700 text-white"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Register</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
