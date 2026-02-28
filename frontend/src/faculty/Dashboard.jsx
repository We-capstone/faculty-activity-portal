import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../apiClient';
import { supabase } from '../supabase';
import { FACULTY_MODULES, getEntryId, getEntryTitle } from './modules';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    modules: 0,
    recent: 0,
    score: 0
  });
  const [activities, setActivities] = useState([]);

  const topModules = useMemo(() => FACULTY_MODULES.slice(0, 4), []);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session?.access_token) return;

        const results = await Promise.all(
          FACULTY_MODULES.map(async (module) => {
            try {
              const data = await apiRequest(`/faculty/${module.id}`, { token: session.access_token });
              return (data || []).map((item) => ({ ...item, module: module.id }));
            } catch {
              return [];
            }
          })
        );

        const allActivities = results.flat();
        const recentCount = allActivities.filter((item) => {
          if (!item.created_at) return false;
          const created = new Date(item.created_at);
          const last30Days = new Date();
          last30Days.setDate(last30Days.getDate() - 30);
          return created >= last30Days;
        }).length;
        const activeModules = new Set(allActivities.map((item) => item.module)).size;

        let dashboardData = null;
        try {
          dashboardData = await apiRequest('/dashboard/faculty', { token: session.access_token });
        } catch {
          dashboardData = null;
        }

        const score = Number(
          dashboardData?.overallScore ||
            dashboardData?.score ||
            dashboardData?.careerScore ||
            0
        );

        setStats({
          total: allActivities.length,
          modules: activeModules,
          recent: recentCount,
          score: Number.isFinite(score) ? score.toFixed(2) : '0.00'
        });

        const recent = allActivities
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 5);

        setActivities(recent);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="space-y-8">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Activities</h3>
          <p className="text-3xl font-bold mt-2">{loading ? '-' : stats.total}</p>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Active Modules</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">{loading ? '-' : stats.modules}</p>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Recent (30 days)</h3>
          <p className="text-3xl font-bold mt-2 text-yellow-600">{loading ? '-' : stats.recent}</p>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Performance Score</h3>
          <p className="text-3xl font-bold mt-2 text-indigo-600">{loading ? '-' : stats.score}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <h2 className="text-lg font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {topModules.map((module) => (
            <Link
              key={module.id}
              to={`/faculty/add-activity?type=${module.id}`}
              className="p-5 sm:p-6 border border-gray-100 rounded-xl hover:shadow-md hover:border-indigo-100 transition-all text-center group"
            >
              <div className="bg-indigo-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                +
              </div>
              <span className="text-sm font-semibold text-gray-700">Add {module.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
          <h2 className="text-lg font-bold">Recent Activities</h2>
          <Link to="/faculty/activities" className="text-indigo-600 text-sm font-medium hover:underline">
            View All
          </Link>
        </div>

        <div className="space-y-3">
          {activities.map((item) => (
            <div key={`${item.module}-${getEntryId(item)}`} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">{getEntryTitle(item)}</p>
                <p className="text-xs text-gray-500">{item.module}</p>
              </div>
            </div>
          ))}

          {!loading && activities.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-500">No activities recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
