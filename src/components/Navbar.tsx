'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  const [isPrivileged, setIsPrivileged] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user?.email) {
          // Check if user has admin or team-management access
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, can_manage_team')
            .eq('email', user.email)
            .maybeSingle();

          if (profile) {
            const hasAccess =
              profile.role === 'admin' ||
              profile.role === 'super_admin' ||
              profile.can_manage_team === true;
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
                <span>IIUI FMS • Dept. of Tech & PM</span>
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

          {/* Auth Actions */}
          <div className="hidden lg:flex items-center gap-2.5 flex-shrink-0">
            {!loading && user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/portal"
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 transition-all border border-slate-200/60"
                >
                  <UserIcon className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate max-w-[130px] font-medium">{user.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit</span>
                </button>
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

          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
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
              <div className="space-y-2">
                <div className="text-xs text-slate-500 px-3 truncate">{user.email}</div>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-700 text-white"
              >
                <LogIn className="w-4 h-4" />
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
