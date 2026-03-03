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

const eyeIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const eyeOffIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const FacultyLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFacultyDropdown, setShowFacultyDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [facultyInfo, setFacultyInfo] = useState({
    name: 'Faculty Member',
    role: 'Faculty',
    email: ''
  });
  const facultyDropdownRef = React.useRef(null);

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
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', session.user.id)
        .single();

      if (!mounted) return;

      setFacultyInfo({
        name: profile?.full_name || session.user.user_metadata?.full_name || 'Faculty Member',
        role: profile?.role || session.user.user_metadata?.role || 'Faculty',
        email: session.user.email || ''
      });
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowFacultyDropdown(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (facultyDropdownRef.current && !facultyDropdownRef.current.contains(event.target)) {
        setShowFacultyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  const openPasswordModal = () => {
    setShowFacultyDropdown(false);
    setPasswordError('');
    setPasswordMessage('');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordVisibility({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false
    });
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    if (passwordLoading) return;
    setShowPasswordModal(false);
    setPasswordError('');
    setPasswordMessage('');
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordVisibility({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false
    });
  };

  const handlePasswordInput = (field) => (event) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const togglePasswordVisibility = (field) => () => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordUpdate = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Please fill all password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setPasswordLoading(true);

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const email = session?.user?.email || facultyInfo.email;
      if (!email) throw new Error('Unable to identify account email.');

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword
      });
      if (verifyError) {
        setPasswordError('Current password is incorrect.');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) throw updateError;

      setPasswordMessage('Password updated successfully.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordVisibility({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
      });
    } catch (error) {
      setPasswordError(error.message || 'Unable to update password.');
    } finally {
      setPasswordLoading(false);
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
                <p className="theme-text-primary text-sm font-medium">{facultyInfo.email || user?.email}</p>
                <p className="theme-text-secondary text-xs">{facultyInfo.role || 'Faculty Member'}</p>
              </div>
              <div className="relative" ref={facultyDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowFacultyDropdown((prev) => !prev)}
                  className="theme-avatar flex h-10 w-10 items-center justify-center rounded-full font-bold transition-colors"
                  aria-label="Toggle faculty details"
                >
                  {(facultyInfo.name || user?.email || 'F').charAt(0).toUpperCase()}
                </button>
                {showFacultyDropdown ? (
                  <div className="panel-card absolute right-0 z-20 mt-2 w-64 p-4">
                    <p className="theme-text-primary text-sm font-bold">{facultyInfo.name}</p>
                    <p className="theme-text-secondary mt-0.5 text-xs">{facultyInfo.role || 'Faculty Member'}</p>
                    {facultyInfo.email ? <p className="theme-text-secondary mt-2 break-all text-xs">{facultyInfo.email}</p> : null}
                    <button
                      type="button"
                      onClick={openPasswordModal}
                      className="theme-btn-secondary mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold"
                    >
                      Update Password
                    </button>
                  </div>
                ) : null}
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

      {showPasswordModal ? (
        <div className="theme-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="panel-card w-full max-w-md p-5">
            <h3 className="theme-text-primary text-lg font-bold">Update Password</h3>
            <p className="theme-text-secondary mt-2 text-sm">
              Enter current password and set a new password.
            </p>

            {passwordError ? (
              <div className="theme-alert-error mt-4 rounded-lg px-3 py-2 text-sm">{passwordError}</div>
            ) : null}
            {passwordMessage ? (
              <div className="theme-alert-success mt-4 rounded-lg px-3 py-2 text-sm">{passwordMessage}</div>
            ) : null}

            <form onSubmit={handlePasswordUpdate} className="mt-4 space-y-4">
              <div>
                <label className="theme-text-secondary block text-xs font-semibold uppercase tracking-wider">Current Password</label>
                <div className="relative mt-2">
                  <input
                    type={passwordVisibility.currentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInput('currentPassword')}
                    className="theme-input block w-full rounded-lg px-3 py-2.5 pr-11 outline-none transition"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility('currentPassword')}
                    className="theme-text-secondary absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80 focus:outline-none"
                    aria-label={passwordVisibility.currentPassword ? 'Hide current password' : 'Show current password'}
                  >
                    {passwordVisibility.currentPassword ? eyeOffIcon : eyeIcon}
                  </button>
                </div>
              </div>

              <div>
                <label className="theme-text-secondary block text-xs font-semibold uppercase tracking-wider">New Password</label>
                <div className="relative mt-2">
                  <input
                    type={passwordVisibility.newPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInput('newPassword')}
                    className="theme-input block w-full rounded-lg px-3 py-2.5 pr-11 outline-none transition"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility('newPassword')}
                    className="theme-text-secondary absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80 focus:outline-none"
                    aria-label={passwordVisibility.newPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {passwordVisibility.newPassword ? eyeOffIcon : eyeIcon}
                  </button>
                </div>
              </div>

              <div>
                <label className="theme-text-secondary block text-xs font-semibold uppercase tracking-wider">Confirm New Password</label>
                <div className="relative mt-2">
                  <input
                    type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInput('confirmPassword')}
                    className="theme-input block w-full rounded-lg px-3 py-2.5 pr-11 outline-none transition"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility('confirmPassword')}
                    className="theme-text-secondary absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80 focus:outline-none"
                    aria-label={passwordVisibility.confirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {passwordVisibility.confirmPassword ? eyeOffIcon : eyeIcon}
                  </button>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="theme-btn-secondary flex-1 rounded-lg px-4 py-2 text-sm font-semibold"
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="theme-btn-primary flex-1 rounded-lg px-4 py-2 text-sm font-semibold"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <FloatingChatbot title="Faculty Assistant" />
    </div>
  );
};

export default FacultyLayout;
