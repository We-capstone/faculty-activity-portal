import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { apiRequest } from '../apiClient';
import BlueLoader from '../components/BlueLoader';

const PIE_BASE_COLORS = {
  APPROVED: '#2f6fce',
  PENDING: '#d89a12',
  REJECTED: '#cf4f8b'
};

const PIE_GRADIENT_IDS = {
  APPROVED: 'pieApprovedGradient',
  PENDING: 'piePendingGradient',
  REJECTED: 'pieRejectedGradient'
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatWhole = (value) => Math.round(toNumber(value)).toLocaleString();

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
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = 55;
    const labelX = cx + labelRadius * Math.cos(midAngle - Math.PI / 2);
    const labelY = cy + labelRadius * Math.sin(midAngle - Math.PI / 2);

    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    return { ...entry, d, pct, labelX, labelY };
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

        const payload = await apiRequest('/analytics/admin/stats', { token: session.access_token });
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
            career_score: toNumber(row?.career_score)
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
  const totalDepartmentScore = departmentLeaderboard.reduce((sum, dept) => sum + toNumber(dept.total_score), 0);
  const topDepartment = departmentLeaderboard[0]?.department || '-';

  if (loading) return <BlueLoader />;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Department Analytics</h1>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
          <p className="text-xs uppercase tracking-wider font-bold text-blue-600">Departments</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{departmentLeaderboard.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5">
          <p className="text-xs uppercase tracking-wider font-bold text-emerald-600">Top Department</p>
          <p className="mt-2 text-xl font-black text-gray-900 truncate">{topDepartment}</p>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5">
          <p className="text-xs uppercase tracking-wider font-bold text-indigo-600">Total Department Score</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{formatWhole(totalDepartmentScore)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Departmental Performance Leaderboard</h2>
          <div className="space-y-4">
            {departmentLeaderboard.map((dept) => (
              <div key={dept.department}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{dept.department}</span>
                  <span className="text-base font-bold text-gray-900">{formatWhole(dept.total_score)}</span>
                </div>
                <div className="w-full h-3 rounded bg-gray-100 overflow-hidden">
                  <div
                    className="h-3 rounded bg-gradient-to-r from-blue-500 to-indigo-600"
                    style={{ width: `${maxDeptScore ? (dept.total_score / maxDeptScore) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {departmentLeaderboard.length === 0 && <p className="text-sm text-gray-500">No department data available.</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <h2 className="text-lg font-bold mb-4">Administrative Approval Funnel</h2>
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <div className="relative shrink-0">
              <svg viewBox="0 0 220 220" className="w-56 h-56 sm:w-64 sm:h-64">
                <defs>
                  <radialGradient id="pieApprovedGradient" cx="35%" cy="25%" r="85%">
                    <stop offset="0%" stopColor="#8fc0f5" />
                    <stop offset="50%" stopColor="#4f8fe0" />
                    <stop offset="100%" stopColor="#2f6fce" />
                  </radialGradient>
                  <radialGradient id="piePendingGradient" cx="35%" cy="25%" r="85%">
                    <stop offset="0%" stopColor="#f8dc9a" />
                    <stop offset="50%" stopColor="#e7b84d" />
                    <stop offset="100%" stopColor="#d89a12" />
                  </radialGradient>
                  <radialGradient id="pieRejectedGradient" cx="35%" cy="25%" r="85%">
                    <stop offset="0%" stopColor="#efb2cf" />
                    <stop offset="50%" stopColor="#da72a5" />
                    <stop offset="100%" stopColor="#cf4f8b" />
                  </radialGradient>
                  <filter id="pieGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#6c8fbe" floodOpacity="0.22" />
                  </filter>
                </defs>
                <g transform="translate(10,10)" filter="url(#pieGlow)">
                  {pieSegments.length === 0 ? (
                    <circle cx="100" cy="100" r="85" fill="#e5e7eb" />
                  ) : (
                    pieSegments.map((segment) => (
                      <path
                        key={segment.key}
                        d={segment.d}
                        fill={`url(#${PIE_GRADIENT_IDS[segment.key]})`}
                        stroke="#ffffff"
                        strokeOpacity="0.8"
                        strokeWidth="3"
                      />
                    ))
                  )}
                  {pieSegments.map((segment) => (
                    <text
                      key={`${segment.key}-pct`}
                      x={segment.labelX}
                      y={segment.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#ffffff"
                      stroke="#0f2f55"
                      strokeOpacity="0.25"
                      strokeWidth="1"
                      fontWeight="900"
                      fontSize="18"
                    >
                      {`${Math.round(segment.pct * 100)}%`}
                    </text>
                  ))}
                </g>
              </svg>
            </div>
            <div className="space-y-3 sm:space-y-4 w-full">
              {['APPROVED', 'PENDING', 'REJECTED'].map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-base font-black shadow-sm"
                      style={{ backgroundColor: PIE_BASE_COLORS[key] }}
                    >
                      &#10003;
                    </span>
                    <span className="text-lg sm:text-xl font-semibold tracking-wide text-[#1f3f68]">{key}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 shrink-0">
                    {statusCounts[key]} ({totalStatuses ? ((statusCounts[key] / totalStatuses) * 100).toFixed(1) : '0.0'}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
          <h2 className="text-lg font-bold">Top 5 Research Leaders</h2>
          <p className="text-sm text-gray-500 mt-1">Ranked by career score</p>
        </div>
        <div className="p-4 md:p-6 space-y-3">
          {topFaculty.map((row, idx) => {
            const badgeStyle =
              idx === 0
                ? 'bg-yellow-100 text-yellow-700'
                : idx === 1
                  ? 'bg-gray-200 text-gray-700'
                  : idx === 2
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-50 text-blue-700';

            return (
              <div
                key={`${row.full_name}-${idx}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm ${badgeStyle}`}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{row.full_name}</p>
                    <p className="text-sm text-gray-500 truncate">{row.department}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0 sm:ml-4">
                  <p className="text-xs uppercase tracking-wider text-gray-400 font-bold">Career Score</p>
                  <p className="text-xl font-black text-blue-600">{formatWhole(row.career_score)}</p>
                </div>
              </div>
            );
          })}
        </div>
        {topFaculty.length === 0 && <div className="p-12 text-center text-gray-500">No faculty leaderboard data available.</div>}
      </div>
    </div>
  );
};

export default DepartmentAnalytics;

