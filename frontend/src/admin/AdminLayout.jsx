import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/', { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const role = profile?.role || session.user.user_metadata?.role;
      if (role !== 'ADMIN') {
        navigate('/faculty', { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
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
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'Approval Queue', path: '/admin/approvals', icon: '⏳' },
    { name: 'Faculty Ranking', path: '/admin/ranking', icon: '🏆' },
    { name: 'Dept Analytics', path: '/admin/analytics', icon: '📈' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col sticky top-0 h-screen shrink-0">
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
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 rounded-lg text-slate-300 hover:bg-red-900/20 hover:text-red-400 transition-colors"
          >
            <span>🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8">
          <div className="flex items-center space-x-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              {navItems.find(item => item.path === location.pathname)?.name || 'Admin'}
            </h3>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border-2 border-blue-500">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
