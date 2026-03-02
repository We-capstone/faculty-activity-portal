import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import FloatingChatbot from '../Chatbot';
import { supabase } from '../supabase';

const iconMap = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12h7V4H4v8Zm0 8h7v-6H4v6Zm9 0h7v-10h-7v10Zm0-12h7V4h-7v4Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  activities: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 5h12M6 12h12M6 19h12" strokeLinecap="round" />
      <circle cx="4" cy="5" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="19" r="1" fill="currentColor" />
    </svg>
  ),
  add: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V5m0 14h16M8 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
      <path d="m16 17 5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

const navItems = [
  { key: 'dashboard', name: 'Dashboard', path: '/faculty/dashboard' },
  { key: 'activities', name: 'My Activities', path: '/faculty/activities' },
  { key: 'add', name: 'Add Activity', path: '/faculty/add-activity' },
  { key: 'analytics', name: 'Faculty Analytics', path: '/faculty/analytics' }
];

const FacultyLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        navigate('/', { replace: true });
        return;
      }

      setUser(session.user);
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="app-shell-bg flex min-h-screen lg:h-screen lg:overflow-hidden">
      {mobileMenuOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="theme-overlay fixed inset-0 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <aside
        className={`app-sidebar fixed inset-y-0 left-0 z-40 flex h-screen w-72 max-w-[85vw] flex-col shadow-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:w-64 lg:max-w-none lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="sidebar-divider border-b px-6 py-6">
          <h2 className="text-xl font-bold tracking-wide">FACULTY PORTAL</h2>
          <p className="mt-1 text-xs uppercase tracking-wider opacity-80">Faculty Workspace</p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-link flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
                  isActive ? 'is-active' : ''
                }`}
              >
                <span className="text-current">{iconMap[item.key]}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-divider border-t p-4">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="sidebar-logout flex w-full items-center justify-between rounded-lg px-3 py-3 transition-colors"
          >
            <span className="flex items-center gap-3">
              {iconMap.logout}
              <span className="font-medium">Logout</span>
            </span>
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="theme-header px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-h-10 items-center justify-between">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="theme-icon-btn mr-3 inline-flex items-center justify-center rounded-lg p-2 lg:hidden"
                aria-label="Open navigation"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              </button>
              <h1 className="theme-text-primary text-lg font-semibold">{navItems.find((item) => item.path === location.pathname)?.name || 'Faculty Portal'}</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="hidden text-right sm:block">
                <p className="theme-text-primary text-sm font-medium">{user?.email}</p>
                <p className="theme-text-secondary text-xs">Faculty Member</p>
              </div>
              <div className="theme-avatar flex h-10 w-10 items-center justify-center rounded-full font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="theme-content flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {showLogoutConfirm ? (
        <div className="theme-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="panel-card w-full max-w-sm p-5">
            <h3 className="theme-text-primary text-lg font-bold">Confirm Logout</h3>
            <p className="theme-text-secondary mt-2 text-sm">Are you sure you want to logout?</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="theme-btn-secondary flex-1 rounded-lg px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="theme-btn-danger flex-1 rounded-lg px-4 py-2 text-sm font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <FloatingChatbot />
    </div>
  );
};

export default FacultyLayout;
