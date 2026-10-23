'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { hasAmbassadorPortalRole } from '@/lib/access';
import {
  Home,
  LayoutDashboard,
  GraduationCap,
  Calendar,
  Menu,
  X,
  LogOut,
  LogIn,
  Users,
  Award,
  Globe2,
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
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Scroll listener to toggle transparent vs solid white navbar
  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track active section on the single-page landing route via IntersectionObserver
  useEffect(() => {
    if (pathname !== '/') return;

    const sectionIds = ['hero', 'certification', 'sdg-alignment', 'events', 'team'];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0.05, 0.2, 0.5],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

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
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        if (user?.email) {
          const { data: prof } = await supabase
            .from('profiles')
            .select('role, full_name, avatar_url')
            .eq('email', user.email)
            .maybeSingle();

          if (prof) {
            setProfile(prof);
            setIsPrivileged(hasAmbassadorPortalRole(prof.role));
          }
        }
      } catch {
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

  const displayName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    (user?.email ? user.email.split('@')[0] : 'Participant');

  const getInitials = (name: string, email?: string) => {
    if (name && name !== email?.split('@')[0]) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'U';
  };

  // Nav links: "Home" with Home (house) icon
  const publicLinks = [
    { name: 'Home', href: '/#hero', sectionId: 'hero', icon: Home },
    { name: 'Certification', href: '/#certification', sectionId: 'certification', icon: Award },
    { name: 'SDG Mandate', href: '/#sdg-alignment', sectionId: 'sdg-alignment', icon: Globe2 },
    { name: 'Events & Gallery', href: '/#events', sectionId: 'events', icon: Calendar },
    { name: 'Leadership & Team', href: '/#team', sectionId: 'team', icon: Users },
    { name: 'Student Portal', href: '/portal', sectionId: null, icon: GraduationCap },
  ];

  const navLinks = isPrivileged
    ? [...publicLinks, { name: 'Dashboard', href: '/dashboard', sectionId: null, icon: LayoutDashboard }]
    : publicLinks;

  const isLinkActive = (link: (typeof navLinks)[number]) => {
    if (link.sectionId) {
      return pathname === '/' && activeSection === link.sectionId;
    }
    return pathname === link.href || pathname.startsWith(link.href + '/');
  };

  const isHomePage = pathname === '/';
  // Transparent only at the top of the Home page when mobile drawer is closed
  const isTransparent = isHomePage && (!mounted || !isScrolled) && !mobileMenuOpen;

  return (
    <>
      <header
        suppressHydrationWarning
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          isTransparent
            ? 'bg-transparent border-b border-transparent shadow-none'
            : 'bg-white/95 backdrop-blur-md border-b border-[#E2DFD7] shadow-2xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between gap-2 sm:h-[68px]">
            {/* Brand Logo */}
            <Link href="/#hero" className="group flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:flex-none">
              <div
                className={`relative h-9 w-9 shrink-0 rounded-xl overflow-hidden shadow-2xs flex items-center justify-center transition-all p-0.5 sm:h-11 sm:w-11 ${
                  isTransparent
                    ? 'bg-white/10 border border-white/25 backdrop-blur-md'
                    : 'bg-white border border-[#E2DFD7] group-hover:border-[#C3DCD2]'
                }`}
              >
                <Image
                  src="/logo.webp"
                  alt="The AI Bridge Logo"
                  width={44}
                  height={44}
                  priority
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`truncate font-extrabold text-sm sm:text-lg tracking-tight transition-colors ${
                      isTransparent
                        ? 'text-white group-hover:text-[#EAD1A7]'
                        : 'text-[#0F172A] group-hover:text-[#0F4C3A]'
                    }`}
                  >
                    The AI Bridge
                  </span>
                  {/* <span
                    className={`hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
                      isTransparent
                        ? 'bg-white/15 text-white border-white/25'
                        : 'bg-[#E6F0EC] text-[#0F4C3A] border-[#C3DCD2]'
                    }`}
                  >
                    HHP SDG
                  </span> */}
                </div>
                <div
                  className={`hidden items-center gap-1.5 text-[10px] sm:flex sm:text-[11px] font-medium leading-none mt-0.5 transition-colors ${
                    isTransparent ? 'text-slate-300' : 'text-[#64748B]'
                  }`}
                >
                  <Image
                    src="/iiui-logo.webp"
                    alt="IIUI"
                    width={12}
                    height={12}
                    className="w-3 h-3 object-contain rounded-full inline-block bg-white"
                  />
                  <span>Dept. of Tech &amp; PM • FMS IIUI</span>
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isLinkActive(link);
                const Icon = link.icon;

                let pillClass = '';
                if (isTransparent) {
                  pillClass = active
                    ? 'bg-white/25 text-white border border-white/40 shadow-sm backdrop-blur-md'
                    : 'text-white/85 hover:text-white hover:bg-white/15 hover:border-white/25 border border-transparent hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:-translate-y-0.5';
                } else {
                  pillClass = active
                    ? 'bg-[#E6F0EC] text-[#0F4C3A] border border-[#C3DCD2] shadow-xs'
                    : 'text-[#334155] hover:text-[#0F4C3A] hover:bg-[#E6F0EC]/80 hover:border-[#C3DCD2] border border-transparent hover:shadow-xs hover:-translate-y-0.5';
                }

                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`group relative flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-[13px] font-semibold transition-all duration-200 cursor-pointer ${pillClass}`}
                  >
                    {Icon && (
                      <Icon
                        className={`w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:scale-110 ${
                          isTransparent
                            ? active
                              ? 'text-white'
                              : 'text-white/70 group-hover:text-white'
                            : active
                            ? 'text-[#0F4C3A]'
                            : 'text-[#64748B] group-hover:text-[#0F4C3A]'
                        }`}
                      />
                    )}
                    <span>{link.name}</span>

                    {/* Animated Accent Line Indicator */}
                    <span
                      className={`absolute bottom-0 inset-x-2 h-[2px] rounded-full transition-transform duration-200 ease-out origin-center ${
                        active
                          ? 'scale-x-100 ' + (isTransparent ? 'bg-[#C88A2B]' : 'bg-[#0F4C3A]')
                          : 'scale-x-0 group-hover:scale-x-100 ' + (isTransparent ? 'bg-[#C88A2B]' : 'bg-[#0F4C3A]')
                      }`}
                    />
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
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0F4C3A] text-white font-bold text-sm shadow-sm ring-2 ring-[#C3DCD2] hover:bg-[#093528] transition-all cursor-pointer focus:outline-none overflow-hidden"
                    aria-label="User Profile"
                    aria-expanded={profileDropdownOpen}
                    title={`${displayName} (${user.email})`}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(displayName, user.email)}</span>
                    )}
                  </button>

                  {/* Popdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#E2DFD7] py-3 px-3 z-50 animate-fade-in divide-y divide-[#F1EFEA]">
                      <div className="pb-3 px-1">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-[#0F4C3A] text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs overflow-hidden">
                            {profile?.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt={displayName}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{getInitials(displayName, user.email)}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-[#0F172A] truncate">{displayName}</p>
                            <p className="text-xs text-[#64748B] truncate" title={user.email}>
                              {user.email}
                            </p>
                            <span className="inline-block mt-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E6F0EC] text-[#0F4C3A] border border-[#C3DCD2]">
                              {profile?.role ? profile.role.toUpperCase() : 'PARTICIPANT'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="py-2 space-y-1">
                        <Link
                          href="/portal"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#334155] hover:bg-[#E6F0EC] hover:text-[#0F4C3A] transition-colors"
                        >
                          <GraduationCap className="w-4 h-4 text-[#0F4C3A]" />
                          <span>Student Portal</span>
                        </Link>
                        {isPrivileged && (
                          <Link
                            href="/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#334155] hover:bg-[#E6F0EC] hover:text-[#0F4C3A] transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-[#0F4C3A]" />
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
                  className={`group flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 ${
                    isTransparent
                      ? 'bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-md shadow-xs hover:shadow-md hover:border-white/40'
                      : 'bg-[#0F4C3A] text-white hover:bg-[#093528] shadow-sm hover:shadow-md'
                  }`}
                >
                  <LogIn className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 ${isTransparent ? 'text-white' : 'text-[#E6F0EC]'}`} />
                  <span>Sign In</span>
                </Link>
              )}
            </div>

            {/* Mobile Right Bar: Quick Team Anchor, Profile Avatar & Drawer Menu Button */}
            <div className="flex shrink-0 items-center gap-1 lg:hidden sm:gap-2">
              <Link
                href="/#team"
                aria-label="Leadership & Team"
                className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
                  isTransparent
                    ? 'text-white/90 hover:bg-white/10'
                    : 'text-[#334155] hover:bg-[#F1EFEA] hover:text-[#0F172A]'
                }`}
              >
                <Users className={`h-3.5 w-3.5 shrink-0 ${isTransparent ? 'text-white' : 'text-[#0F4C3A]'}`} />
                <span>Team</span>
              </Link>

              {!loading && user && (
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0F4C3A] text-xs font-bold text-white shadow-xs ring-1 ring-[#C3DCD2] cursor-pointer"
                  aria-label="User Profile"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      loading="lazy"
                      decoding="async"
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
                className={`shrink-0 rounded-xl p-1.5 focus:outline-none cursor-pointer sm:p-2 transition-colors ${
                  isTransparent
                    ? 'text-white hover:bg-white/10'
                    : 'text-[#334155] hover:text-[#0F172A] hover:bg-[#F1EFEA]'
                }`}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Profile Popdown */}
          {!loading && user && profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] max-w-sm lg:hidden rounded-2xl border border-[#E2DFD7] bg-white px-3 py-3 shadow-2xl z-50 animate-fade-in divide-y divide-[#F1EFEA]">
              <div className="pb-3 px-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-[#0F4C3A] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs overflow-hidden">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(displayName, user.email)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#0F172A] truncate">{displayName}</p>
                    <p className="text-[11px] text-[#64748B] truncate" title={user.email}>
                      {user.email}
                    </p>
                    <span className="inline-block mt-0.5 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-[#E6F0EC] text-[#0F4C3A] border border-[#C3DCD2]">
                      {profile?.role ? profile.role.toUpperCase() : 'PARTICIPANT'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="py-2 space-y-1">
                <Link
                  href="/portal"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#334155] hover:bg-[#E6F0EC] hover:text-[#0F4C3A] transition-colors"
                >
                  <GraduationCap className="w-4 h-4 text-[#0F4C3A]" />
                  <span>Student Portal</span>
                </Link>
                {isPrivileged && (
                  <Link
                    href="/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#334155] hover:bg-[#E6F0EC] hover:text-[#0F4C3A] transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#0F4C3A]" />
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
          <div className="lg:hidden border-t border-[#E2DFD7] bg-white px-3 pt-3 pb-6 shadow-lg animate-fade-in sm:px-4">
            <nav aria-label="Mobile menu" className="mx-auto grid w-full max-w-7xl gap-1.5">
              {navLinks.map((link) => {
                const active = isLinkActive(link);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                      active
                        ? 'bg-[#E6F0EC] text-[#0F4C3A] border border-[#C3DCD2]'
                        : 'text-[#334155] hover:bg-[#F8F7F4]'
                    }`}
                  >
                    {Icon && <Icon className={`w-4 h-4 ${active ? 'text-[#0F4C3A]' : 'text-[#64748B]'}`} />}
                    {link.name}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 mt-3 border-t border-[#F1EFEA]">
              {user ? (
                <div className="space-y-3 p-3 rounded-2xl bg-[#F8F7F4] border border-[#E2DFD7]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#0F4C3A] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={displayName}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{getInitials(displayName, user.email)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#0F172A] truncate">{displayName}</p>
                      <p className="text-[11px] text-[#64748B] truncate">{user.email}</p>
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#0F4C3A] text-white hover:bg-[#093528] transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In / Register</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Spacer for non-home pages so content starts cleanly below the fixed navbar */}
      {!isHomePage && <div className="h-16 sm:h-[68px]" aria-hidden="true" />}
    </>
  );
}
