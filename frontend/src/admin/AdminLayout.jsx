import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/', { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

      const role = profile?.role || session.user.user_metadata?.role;
      if (role !== 'ADMIN') {
        navigate('/faculty', { replace: true });
      }

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
      // Use window.location.href for a clean state reset on logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Faculty Ranking', path: '/admin/ranking' },
    { name: 'Department Analytics', path: '/admin/analytics' },
  ];

  return (
    <div className="flex min-h-screen lg:h-screen bg-gray-50 lg:overflow-hidden">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] bg-slate-900 text-white flex flex-col h-screen shrink-0 transform transition-transform duration-200 lg:sticky lg:top-0 lg:w-64 lg:max-w-none lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold tracking-wider">FACULTY PORTAL</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase">Admin Console</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900">
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-between p-3 rounded-lg text-slate-300 hover:bg-red-900/20 hover:text-red-400 transition-colors"
          >
            <span className="font-medium">Logout</span>
            <span aria-hidden="true" className="ml-3">↪</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 min-h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex lg:hidden items-center justify-center rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Open navigation"
            >
              <span className="text-lg leading-none">=</span>
            </button>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {navItems.find(item => item.path === location.pathname)?.name || 'Admin'}
            </h3>
          </div>
          <div className="relative" ref={adminDropdownRef}>
            <button
              type="button"
              onClick={() => setShowAdminDropdown((prev) => !prev)}
              className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border-2 border-blue-500 hover:bg-blue-200 transition-colors"
              aria-label="Toggle admin details"
            >
              A
            </button>

            {showAdminDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-lg p-4 z-20">
                <p className="text-sm font-bold text-gray-900">{adminInfo.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{adminInfo.role}</p>
                {adminInfo.email && <p className="text-xs text-gray-500 mt-2 break-all">{adminInfo.email}</p>}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl bg-white border border-gray-200 shadow-xl p-5">
            <h3 className="text-lg font-bold text-gray-900">Confirm Logout</h3>
            <p className="mt-2 text-sm text-gray-600">Are you sure you want to logout?</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;


