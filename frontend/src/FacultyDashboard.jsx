import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from './apiClient';
import { supabase } from './supabase';
import BlueLoader from './components/BlueLoader';

const MODULES = [
  { key: 'journals', label: 'Journals' },
  { key: 'conferences', label: 'Conferences' },
  { key: 'books', label: 'Books' }
];

const getEntryId = (entry) => entry.journal_id || entry.conference_id || entry.book_id || entry.id;

const getEntryTitle = (entry) =>
  entry.title || entry.journal_name || entry.conference_name || entry.book_title || 'Untitled';

const FacultyDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalActivities: 0,
    approvedScore: 0,
    activeModules: 0
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const groupedCounts = useMemo(() => {
    const counts = { journals: 0, conferences: 0, books: 0 };
    activities.forEach((item) => {
      if (counts[item.module] !== undefined) counts[item.module] += 1;
    });
    return counts;
  }, [activities]);

  useEffect(() => {
    const fetchFacultyData = async () => {
      setLoading(true);
      setError('');
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session) {
          navigate('/', { replace: true });
          return;
        }

        setUser(session.user);

        const [facultyStats, journals, conferences, books] = await Promise.all([
          apiRequest('/analytics/stats', { token: session.access_token }),
          apiRequest('/api/faculty/journals', { token: session.access_token }),
          apiRequest('/api/faculty/conferences', { token: session.access_token }),
          apiRequest('/api/faculty/books', { token: session.access_token })
        ]);

        const allEntries = [...(journals || []), ...(conferences || []), ...(books || [])];
        const activeModules = new Set(
          allEntries.map((entry) => (entry.journal_id ? 'journals' : entry.conference_id ? 'conferences' : 'books'))
        ).size;

        const merged = [
          ...(journals || []).map((entry) => ({ ...entry, module: 'journals' })),
          ...(conferences || []).map((entry) => ({ ...entry, module: 'conferences' })),
          ...(books || []).map((entry) => ({ ...entry, module: 'books' }))
        ]
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 8);

        setStats({
          totalActivities: allEntries.length,
          approvedScore: Number(facultyStats?.career?.career_score || 0).toFixed(2),
          activeModules
        });
        setActivities(merged);
      } catch (err) {
        setError(err.message || 'Failed to load faculty dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyData();
    const interval = setInterval(fetchFacultyData, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  if (loading) return <BlueLoader />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Faculty Portal</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600 font-medium">{user.email}</span>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600">
            Logout
          </button>
        </div>
      </nav>

      <main className="p-8 max-w-6xl mx-auto">
        {error && <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-100">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">My Total Activities</h3>
            <p className="text-3xl font-bold mt-2">{stats.totalActivities}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Approved Score</h3>
            <p className="text-3xl font-bold mt-2 text-green-600">{stats.approvedScore}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">Active Modules</h3>
            <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.activeModules}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold mb-4">Module Snapshot</h2>
            <div className="space-y-3">
              {MODULES.map((module) => (
                <div key={module.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-medium text-gray-700">{module.label}</span>
                  <span className="text-sm font-bold text-gray-900">{groupedCounts[module.key] || 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold mb-4">Recent Submissions</h2>
            <div className="space-y-3">
              {activities.map((item) => (
                <div key={`${item.module}-${getEntryId(item)}`} className="py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-xs">{getEntryTitle(item)}</p>
                    <p className="text-xs text-gray-500 capitalize">{item.module}</p>
                  </div>
                </div>
              ))}
              {activities.length === 0 && <p className="text-sm text-gray-500">No activities found.</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FacultyDashboard;
