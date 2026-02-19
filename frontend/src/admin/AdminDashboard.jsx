import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { apiRequest } from '../apiClient';
import BlueLoader from '../components/BlueLoader';

const MODULE_LABELS = {
  journals: 'Journal Publication',
  conferences: 'Conference Publication',
  patents: 'Patent',
  research_funding: 'Research Grant'
};

const flattenApprovalPayload = (payload, status) =>
  (payload || []).flatMap((mod) =>
    (mod.entries || []).map((entry) => ({
      ...entry,
      status,
      module: mod.module,
      type: MODULE_LABELS[mod.module] || mod.module
    }))
  );

const AdminDashboard = () => {
  const [stats, setStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session) {
          setError('No session found');
          return;
        }

        console.info('[AdminDashboard] Fetching analytics and approvals from backend APIs');

        const [adminStats, pendingPayload, approvedPayload, rejectedPayload, profilesResponse] = await Promise.all([
          apiRequest('/api/analytics/admin/stats', { token: session.access_token }),
          apiRequest('/api/admin/approvals?status=PENDING', { token: session.access_token }),
          apiRequest('/api/admin/approvals?status=APPROVED', { token: session.access_token }),
          apiRequest('/api/admin/approvals?status=REJECTED', { token: session.access_token }),
          supabase.from('profiles').select('id, role')
        ]);

        const statusCounts = adminStats?.statusCounts || { APPROVED: 0, PENDING: 0, REJECTED: 0 };
        const totalSubmissions = (statusCounts.APPROVED || 0) + (statusCounts.PENDING || 0) + (statusCounts.REJECTED || 0);
        const pendingCount = statusCounts.PENDING || 0;
        const profiles = Array.isArray(profilesResponse?.data) ? profilesResponse.data : [];

        const normalizeRole = (role) => (role || '').toString().trim().toUpperCase();
        const profileFacultyCount = profiles.filter((profile) => {
          const role = normalizeRole(profile?.role);
          return !role || role === 'FACULTY';
        }).length;

        const leaderboardFacultyCount = Array.isArray(adminStats?.individualLeaderboard)
          ? adminStats.individualLeaderboard.length
          : 0;

        const approvalFacultyCount = new Set(
          [...(pendingPayload || []), ...(approvedPayload || []), ...(rejectedPayload || [])].flatMap((bucket) =>
            (bucket?.entries || []).map((entry) => entry?.profile_id).filter(Boolean)
          )
        ).size;

        const facultyCount = Math.max(profileFacultyCount, leaderboardFacultyCount, approvalFacultyCount);

        const allActivities = [
          ...flattenApprovalPayload(pendingPayload, 'PENDING'),
          ...flattenApprovalPayload(approvedPayload, 'APPROVED'),
          ...flattenApprovalPayload(rejectedPayload, 'REJECTED')
        ];

        const sortedActivities = allActivities
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 5);

        setStats([
          { label: 'Total Faculty', value: facultyCount, icon: 'TF', color: 'bg-blue-500' },
          { label: 'Pending Approvals', value: pendingCount, icon: 'PA', color: 'bg-yellow-500' },
          { label: 'Total Submissions', value: totalSubmissions, icon: 'TS', color: 'bg-green-500' },
          { label: 'Modules Active', value: 4, icon: 'MA', color: 'bg-indigo-500' }
        ]);

        setRecentActivities(sortedActivities);
        setError(null);
      } catch (err) {
        console.error('[AdminDashboard] API failure:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <BlueLoader />;
  if (error) {
    return (
      <div className="p-6 text-red-500">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Admin Dashboard</h1>
        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
          <p className="font-bold">Error loading dashboard data:</p>
          <p>{error}</p>
          <p className="text-sm mt-2 text-red-400">Please check backend server and authentication token.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`${stat.color} text-white p-3 rounded-lg text-sm font-bold`}>{stat.icon}</div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                    {activity.profiles?.full_name?.split(' ').map((n) => n[0]).join('') || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {activity.profiles?.full_name || 'Someone'} submitted a {activity.type}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(activity.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    activity.status === 'APPROVED'
                      ? 'bg-green-100 text-green-700'
                      : activity.status === 'REJECTED'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {activity.status}
                </span>
              </div>
            ))}
            {recentActivities.length === 0 && <p className="text-center text-gray-500 py-4">No recent activities</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <a href="/admin/approvals" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center">
              <span className="block text-2xl mb-2">AQ</span>
              <span className="text-sm font-medium">Pending Approvals</span>
            </a>
            <a href="/admin/ranking" className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center">
              <span className="block text-2xl mb-2">FR</span>
              <span className="text-sm font-medium">Faculty Rankings</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
