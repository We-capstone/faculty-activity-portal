import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

const QUICK_LINKS = [
  {
    to: '/admin/approvals',
    title: 'Pending Approvals',
    description: 'Review and moderate faculty submissions',
    icon: 'approvals'
  },
  {
    to: '/admin/ranking',
    title: 'Faculty Rankings',
    description: 'Track department-wise research performance',
    icon: 'ranking'
  }
];
const QuickLinkIcon = ({ icon }) => {
  if (icon === 'approvals') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="3" width="14" height="18" rx="2.5" />
        <path d="M9 3.5h6" strokeLinecap="round" />
        <path d="M8.5 10h7M8.5 14h4" strokeLinecap="round" />
        <path d="m13.3 16.3 1.6 1.6 3-3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 20h16" strokeLinecap="round" />
      <rect x="6" y="11" width="3" height="6" rx="0.8" />
      <rect x="11" y="8" width="3" height="9" rx="0.8" />
      <rect x="16" y="5" width="3" height="12" rx="0.8" />
    </svg>
  );
};
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
          apiRequest('/analytics/admin/stats', { token: session.access_token }),
          apiRequest('/admin/approvals?status=PENDING', { token: session.access_token }),
          apiRequest('/admin/approvals?status=APPROVED', { token: session.access_token }),
          apiRequest('/admin/approvals?status=REJECTED', { token: session.access_token }),
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
        const activeModules = new Set(allActivities.map((item) => item.module).filter(Boolean)).size;

        const sortedActivities = allActivities
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
          .slice(0, 5);

        setStats([
          { label: 'Total Faculty', value: facultyCount, icon: 'TF', color: 'bg-blue-500' },
          { label: 'Pending Approvals', value: pendingCount, icon: 'PA', color: 'bg-yellow-500' },
          { label: 'Total Submissions', value: totalSubmissions, icon: 'TS', color: 'bg-green-500' },
          { label: 'Modules Active', value: activeModules, icon: 'MA', color: 'bg-indigo-500' }
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
      <div className="p-4 sm:p-6 text-red-500">
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
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
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
              <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 hover:border-indigo-200 hover:shadow-md transition-all"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <QuickLinkIcon icon={link.icon} />
                </div>
                <p className="text-base font-semibold text-slate-900">{link.title}</p>
                <p className="mt-1 text-xs text-slate-500">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;



