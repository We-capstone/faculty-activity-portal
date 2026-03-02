import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import FloatingChatbot from '../Chatbot';
import { supabase } from '../supabase';

const navItems = [
  { name: 'Dashboard', path: '/admin' },
  { name: 'Department Analytics', path: '/admin/analytics' }
];

const logoutIcon = (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
    <path d="m16 17 5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = React.useState(false);
  const [adminInfo, setAdminInfo] = React.useState({
    name: 'Admin User',
    role: 'Super Admin',
    email: ''
  });
  const adminDropdownRef = React.useRef(null);

  React.useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }

      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', session.user.id).single();
      const role = profile?.role || session.user.user_metadata?.role;
      if (role !== 'ADMIN') navigate('/faculty', { replace: true });

      setAdminInfo({
        name: profile?.full_name || session.user.user_metadata?.full_name || 'Admin User',
        role: 'Super Admin',
        email: session.user.email || ''
      });
    };

    checkSession();
  }, [navigate]);

  React.useEffect(() => {
    setMobileMenuOpen(false);
    setShowAdminDropdown(false);
  }, [location.pathname]);

  React.useEffect(() => {
    const handleOutsideClick = (event) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
        setShowAdminDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const confirmLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
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
        className={`app-sidebar fixed inset-y-0 left-0 z-40 flex h-screen w-72 max-w-[85vw] shrink-0 flex-col transition-transform duration-200 lg:sticky lg:top-0 lg:w-64 lg:max-w-none lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="sidebar-divider border-b p-6">
          <h2 className="text-xl font-bold tracking-wider">FACULTY PORTAL</h2>
          <p className="mt-1 text-xs uppercase tracking-wider opacity-80">Admin Console</p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-nav-link flex items-center rounded-lg px-3 py-3 transition-colors ${
                  isActive ? 'is-active' : ''
                }`}
              >
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
              {logoutIcon}
              <span className="font-medium">Logout</span>
            </span>
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="theme-header px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-h-10 items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="theme-icon-btn inline-flex items-center justify-center rounded-lg p-2 lg:hidden"
                aria-label="Open navigation"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              </button>
              <h3 className="theme-text-secondary text-sm font-semibold uppercase tracking-wider">
                {navItems.find((item) => item.path === location.pathname)?.name || 'Admin'}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <div className="relative" ref={adminDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowAdminDropdown((prev) => !prev)}
                  className="theme-avatar flex h-10 w-10 items-center justify-center rounded-full font-bold transition-colors"
                  aria-label="Toggle admin details"
                >
                  A
                </button>

                {showAdminDropdown ? (
                  <div className="panel-card absolute right-0 z-20 mt-2 w-64 p-4">
                    <p className="theme-text-primary text-sm font-bold">{adminInfo.name}</p>
                    <p className="theme-text-secondary mt-0.5 text-xs">{adminInfo.role}</p>
                    {adminInfo.email ? <p className="theme-text-secondary mt-2 break-all text-xs">{adminInfo.email}</p> : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="theme-content flex-1 overflow-y-auto">
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

export default AdminLayout;
