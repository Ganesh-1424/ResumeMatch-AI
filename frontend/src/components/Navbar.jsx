import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  FileText,
  Sparkles,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  User,
  ShieldCheck,
  Wand2,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

/**
 * Responsive Navigation Header (Task 48 & Task 49)
 * 
 * - Desktop (>= md): Full horizontal navigation bar with links, theme switcher, and user actions.
 * - Mobile (< md): Clean header with brand logo on left, theme toggle and 3-line hamburger (☰) on right.
 * - Mobile Drawer (Mounted via React Portal to document.body):
 *   - True full-viewport dark overlay backdrop (`fixed inset-0 z-[998] bg-slate-950/75`).
 *   - 100% solid, opaque slide-in sidebar (`fixed top-0 right-0 z-[999] h-dvh h-screen w-80 max-w-[85vw] bg-white dark:bg-slate-900`).
 *   - Non-clipped, scrollable vertical navigation list with icons.
 *   - User profile badge card, theme switch row, and logout/login controls.
 */
export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toggleTheme, isDark } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/login');
  };

  // Close mobile drawer when route changes
  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  // Lock body scroll and listen for Escape key when mobile drawer is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  // Desktop horizontal link styling
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 font-semibold shadow-xs'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  // Mobile vertical link styling
  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-l-4 border-blue-600 dark:border-blue-400 pl-3'
        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand (Always left-aligned) */}
            <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/25 group-hover:scale-[1.02] transition">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                ResumeMatch<span className="text-blue-600 dark:text-blue-400">AI</span>
              </span>
            </Link>

            {/* Desktop Navigation Links (>= md) */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Desktop navigation">
              <NavLink to="/" className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/analyze" className={navLinkClass}>
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Analyze Resume
              </NavLink>
              <NavLink to="/ats-checker" className={navLinkClass}>
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ATS Checker
              </NavLink>
              <NavLink to="/dashboard" className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Dashboard
              </NavLink>
              <NavLink to="/builder" className={navLinkClass}>
                <Wand2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                Resume Builder
              </NavLink>
            </nav>

            {/* Desktop Controls (>= md: Theme toggle + Auth controls) */}
            <div className="hidden md:flex items-center gap-2.5">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-amber-400 animate-fade-in" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600 animate-fade-in" />
                )}
              </button>

              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/profile"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer group shadow-2xs"
                    title="View My Profile"
                  >
                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform" />
                    <span className="max-w-[140px] truncate">
                      {user?.name || user?.email?.split('@')[0]}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                  >
                    <LogIn className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    Login
                  </Link>

                  <Link
                    to="/signup"
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-600/20 transition active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Right Controls (< md: Theme Toggle + 3-line Hamburger Button) */}
            <div className="md:hidden flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-amber-400" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </button>

              {/* 3-line Hamburger button (☰) */}
              <button
                onClick={toggleMobileMenu}
                type="button"
                className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition cursor-pointer"
                aria-label={isMobileMenuOpen ? 'Close navigation drawer' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation-drawer"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* Mobile Drawer & Overlay Portal (Mounted directly to document.body)        */}
      {/* ========================================================================= */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="md:hidden">
            {/* Full-Screen Dark Overlay Backdrop */}
            <div
              className={`fixed inset-0 z-[998] bg-slate-950/75 backdrop-blur-sm transition-opacity duration-300 ${
                isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
              onClick={closeMobileMenu}
              aria-hidden="true"
            />

            {/* Fixed Full-Height Solid Slide-Over Sidebar Drawer */}
            <aside
              id="mobile-navigation-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Drawer"
              className={`fixed top-0 right-0 z-[999] h-dvh h-screen w-80 max-w-[85vw] bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              {/* Top Bar: Brand Title + Close Button (✕) */}
              <div className="flex-shrink-0 flex items-center justify-between p-4.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    ResumeMatch<span className="text-blue-600 dark:text-blue-400">AI</span>
                  </span>
                </Link>

                {/* Close Button (✕) */}
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Close navigation drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Navigation Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* User Session Profile Badge (if authenticated) */}
                {isAuthenticated && (
                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-center justify-between group transition hover:border-blue-300 dark:hover:border-blue-700 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                        {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {user?.name || 'User Profile'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  </Link>
                )}

                {/* Vertical Navigation Links */}
                <div className="space-y-1">
                  <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Menu
                  </p>

                  <NavLink to="/" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Home className="w-4 h-4" />
                      </div>
                      <span>Home</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </NavLink>

                  <NavLink to="/analyze" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span>Analyze Resume</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </NavLink>

                  <NavLink to="/ats-checker" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span>ATS Checker</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </NavLink>

                  <NavLink to="/dashboard" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <span>Dashboard</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </NavLink>

                  <NavLink to="/builder" onClick={closeMobileMenu} className={mobileNavLinkClass}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <Wand2 className="w-4 h-4" />
                      </div>
                      <span>Resume Builder</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </NavLink>
                </div>
              </div>

              {/* Solid Bottom Footer: Theme Switcher + Auth Actions */}
              <div className="flex-shrink-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                {/* Theme Toggle Row */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    {isDark ? <Moon className="w-4 h-4 text-slate-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    <span>{isDark ? 'Dark Theme' : 'Light Theme'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition cursor-pointer"
                  >
                    Switch
                  </button>
                </div>

                {/* Authentication Controls */}
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition cursor-pointer shadow-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <LogIn className="w-4 h-4 text-slate-500" />
                      <span>Log In</span>
                    </Link>
                    <Link
                      to="/signup"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Sign Up</span>
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}
