import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { apiRequest } from '../apiClient';
import BlueLoader from '../components/BlueLoader';

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeRole = (role) => (role || '').toString().trim().toUpperCase();
const isFacultyRole = (role) => normalizeRole(role) !== 'ADMIN';

const QUICK_LINKS = [
  {
    to: '/admin/ranking',
    title: 'Faculty Rankings',
    description: 'View faculty activity leaderboard',
    icon: 'ranking'
  },
  {
    to: '/admin/analytics',
    title: 'Department Analytics',
    description: 'Compare department research output over time',
    icon: 'analytics'
  }
];
const QuickLinkIcon = ({ icon }) => {
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
  const [topDepartments, setTopDepartments] = useState([]);
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

        const [analyticsPayload, profilesResponse] = await Promise.all([
          apiRequest('/analytics/stats', { token: session.access_token }),
          supabase.from('profiles').select('id, role, department')
        ]);

        const profiles = Array.isArray(profilesResponse?.data) ? profilesResponse.data : [];
        const facultyCount = profiles.filter((profile) => isFacultyRole(profile?.role)).length;

        const deptVolume = Array.isArray(analyticsPayload?.deptVolume) ? analyticsPayload.deptVolume : [];
        const yearlyGrowth = Array.isArray(analyticsPayload?.yearlyGrowth) ? analyticsPayload.yearlyGrowth : [];

        const totalSubmissions = deptVolume.reduce((sum, row) => sum + toNumber(row?.total), 0);
        const activeDepartments = deptVolume.length;
        const moduleTotals = {
          journals: 0,
          conferences: 0,
          patents: 0,
          funding: 0
        };
        deptVolume.forEach((row) => {
          moduleTotals.journals += toNumber(row?.journals);
          moduleTotals.conferences += toNumber(row?.conferences);
          moduleTotals.patents += toNumber(row?.patents);
          moduleTotals.funding += toNumber(row?.funding);
        });
        const activeModules = Object.values(moduleTotals).filter((v) => v > 0).length;

        setStats([
          { label: 'Total Faculty', value: facultyCount, icon: 'TF', color: 'bg-blue-500' },
          { label: 'Total Submissions', value: totalSubmissions, icon: 'TS', color: 'bg-green-500' },
          { label: 'Active Departments', value: activeDepartments, icon: 'AD', color: 'bg-indigo-500' },
          { label: 'Active Modules', value: activeModules, icon: 'AM', color: 'bg-slate-700' }
        ]);

        setTopDepartments(deptVolume.slice(0, 5));
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
          <h2 className="text-lg font-bold mb-4">Top Departments</h2>
          <div className="space-y-4">
            {topDepartments.map((dept, i) => (
              <div key={`${dept.department}-${i}`} className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{dept.department || 'Unassigned'}</p>
                  <p className="text-xs text-gray-400">Total submissions</p>
                </div>
                <span className="shrink-0 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700 font-bold">
                  {toNumber(dept.total)}
                </span>
              </div>
            ))}
            {topDepartments.length === 0 && <p className="text-center text-gray-500 py-4">No department data available</p>}
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



