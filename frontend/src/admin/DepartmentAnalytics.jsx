import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { apiRequest } from '../apiClient';
import BlueLoader from '../components/BlueLoader';

const COLORS = {
  APPROVED: '#16a34a',
  PENDING: '#eab308',
  REJECTED: '#dc2626'
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const buildPieSegments = (statusCounts) => {
  const total = toNumber(statusCounts.APPROVED) + toNumber(statusCounts.PENDING) + toNumber(statusCounts.REJECTED);
  if (!total) return [];

  const entries = [
    { key: 'APPROVED', value: toNumber(statusCounts.APPROVED) },
    { key: 'PENDING', value: toNumber(statusCounts.PENDING) },
    { key: 'REJECTED', value: toNumber(statusCounts.REJECTED) }
  ];

  let cumulative = 0;
  return entries.map((entry) => {
    const pct = entry.value / total;
    const startAngle = cumulative * Math.PI * 2;
    cumulative += pct;
    const endAngle = cumulative * Math.PI * 2;

    const r = 85;
    const cx = 100;
    const cy = 100;
    const x1 = cx + r * Math.cos(startAngle - Math.PI / 2);
    const y1 = cy + r * Math.sin(startAngle - Math.PI / 2);
    const x2 = cx + r * Math.cos(endAngle - Math.PI / 2);
    const y2 = cy + r * Math.sin(endAngle - Math.PI / 2);
    const largeArcFlag = pct > 0.5 ? 1 : 0;

    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    return { ...entry, d, pct };
  });
};

const DepartmentAnalytics = () => {
  const [departmentLeaderboard, setDepartmentLeaderboard] = useState([]);
  const [topFaculty, setTopFaculty] = useState([]);
  const [statusCounts, setStatusCounts] = useState({ APPROVED: 0, PENDING: 0, REJECTED: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session) {
          setError('No active session');
          return;
        }

        const payload = await apiRequest('/api/analytics/admin/stats', { token: session.access_token });
        const deptRows = (payload?.departmentLeaderboard || [])
          .map((row) => ({
            department: row.department || 'Unassigned',
            total_score: toNumber(row.total_score)
          }))
          .sort((a, b) => b.total_score - a.total_score);

        const leaders = [...(payload?.individualLeaderboard || [])]
          .sort((a, b) => toNumber(b.career_score) - toNumber(a.career_score))
          .slice(0, 5)
          .map((row) => ({
            full_name: row?.profiles?.full_name || 'Unknown',
            department: row?.profiles?.department || 'Unassigned',
            career_score: toNumber(row?.career_score).toFixed(2)
          }));

        setDepartmentLeaderboard(deptRows);
        setTopFaculty(leaders);
        setStatusCounts({
          APPROVED: toNumber(payload?.statusCounts?.APPROVED),
          PENDING: toNumber(payload?.statusCounts?.PENDING),
          REJECTED: toNumber(payload?.statusCounts?.REJECTED)
        });
      } catch (err) {
        console.error('[DepartmentAnalytics] API failure:', err);
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const maxDeptScore = useMemo(
    () => Math.max(...departmentLeaderboard.map((d) => d.total_score), 0),
    [departmentLeaderboard]
  );
  const pieSegments = useMemo(() => buildPieSegments(statusCounts), [statusCounts]);
  const totalStatuses = statusCounts.APPROVED + statusCounts.PENDING + statusCounts.REJECTED;

  if (loading) return <BlueLoader />;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Department Analytics</h1>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Departmental Performance Leaderboard</h2>
          <div className="space-y-4">
            {departmentLeaderboard.map((dept) => (
              <div key={dept.department}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{dept.department}</span>
                  <span className="text-sm font-bold text-gray-900">{dept.total_score.toFixed(2)}</span>
                </div>
                <div className="w-full h-3 rounded bg-gray-100 overflow-hidden">
                  <div
                    className="h-3 rounded bg-blue-600"
                    style={{ width: `${maxDeptScore ? (dept.total_score / maxDeptScore) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {departmentLeaderboard.length === 0 && <p className="text-sm text-gray-500">No department data available.</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Administrative Approval Funnel</h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <svg viewBox="0 0 200 200" className="w-52 h-52 shrink-0">
              {pieSegments.length === 0 ? (
                <circle cx="100" cy="100" r="85" fill="#e5e7eb" />
              ) : (
                pieSegments.map((segment) => <path key={segment.key} d={segment.d} fill={COLORS[segment.key]} />)
              )}
            </svg>
            <div className="space-y-3 w-full">
              {['APPROVED', 'PENDING', 'REJECTED'].map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[key] }}></span>
                    <span className="text-sm font-medium text-gray-700">{key}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {statusCounts[key]} ({totalStatuses ? ((statusCounts[key] / totalStatuses) * 100).toFixed(1) : '0.0'}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold">Top 5 Research Leaders</h2>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Rank</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Faculty</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Career Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {topFaculty.map((row, idx) => (
              <tr key={`${row.full_name}-${idx}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-800">{idx + 1}</td>
                <td className="px-6 py-4 text-gray-900 font-medium">{row.full_name}</td>
                <td className="px-6 py-4 text-gray-600">{row.department}</td>
                <td className="px-6 py-4 text-right text-blue-600 font-bold">{row.career_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {topFaculty.length === 0 && <div className="p-12 text-center text-gray-500">No faculty leaderboard data available.</div>}
      </div>
    </div>
  );
};

export default DepartmentAnalytics;
