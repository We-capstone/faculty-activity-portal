import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { apiRequest } from '../apiClient';
import BlueLoader from '../components/BlueLoader';

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

<<<<<<< Updated upstream
const formatWhole = (value) => Math.round(toNumber(value)).toLocaleString();

const DepartmentAnalytics = () => {
  const [deptVolume, setDeptVolume] = useState([]);
  const [yearlyGrowth, setYearlyGrowth] = useState([]);
=======
const DepartmentAnalytics = () => {
  const [departmentRows, setDepartmentRows] = useState([]);
  const [yearlyRows, setYearlyRows] = useState([]);
>>>>>>> Stashed changes
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

        if (!session?.access_token) {
          setError('No active session');
          return;
        }

        const payload = await apiRequest('/analytics/stats', { token: session.access_token });
<<<<<<< Updated upstream
        setDeptVolume(Array.isArray(payload?.deptVolume) ? payload.deptVolume : []);
        setYearlyGrowth(Array.isArray(payload?.yearlyGrowth) ? payload.yearlyGrowth : []);
=======

        setDepartmentRows(
          (payload?.deptVolume || []).sort((a, b) => toNumber(b.total) - toNumber(a.total))
        );
        setYearlyRows((payload?.yearlyGrowth || []).sort((a, b) => toNumber(a.year) - toNumber(b.year)));
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  const sortedDepartments = useMemo(() => {
    return [...deptVolume].sort((a, b) => toNumber(b?.total) - toNumber(a?.total));
  }, [deptVolume]);

  const maxDeptTotal = useMemo(() => Math.max(...sortedDepartments.map((d) => toNumber(d?.total)), 0), [sortedDepartments]);
  const totalSubmissions = useMemo(() => sortedDepartments.reduce((sum, d) => sum + toNumber(d?.total), 0), [sortedDepartments]);
  const topDepartment = sortedDepartments[0]?.department || '-';
  const latestYear = yearlyGrowth.at(-1)?.year;
  const latestTotal = toNumber(yearlyGrowth.at(-1)?.total);
=======
  const topDepartment = departmentRows[0]?.department || '-';
  const totalActivities = useMemo(
    () => departmentRows.reduce((sum, row) => sum + toNumber(row.total), 0),
    [departmentRows]
  );
  const maxYearTotal = Math.max(1, ...yearlyRows.map((row) => toNumber(row.total)));
>>>>>>> Stashed changes

  if (loading) return <BlueLoader />;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Department Analytics</h1>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg">{error}</div>}

<<<<<<< Updated upstream
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Departments</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{sortedDepartments.length}</p>
=======
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
          <p className="text-xs uppercase tracking-wider font-bold text-blue-600">Departments</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{departmentRows.length}</p>
>>>>>>> Stashed changes
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Total Submissions</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{formatWhole(totalSubmissions)}</p>
        </div>
<<<<<<< Updated upstream
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Top Department</p>
          <p className="mt-2 text-lg font-black text-gray-900 truncate">{topDepartment}</p>
          <p className="text-xs text-gray-500 mt-1">Highest total volume</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Latest Year</p>
          <p className="mt-2 text-lg font-black text-gray-900">{latestYear ?? '-'}</p>
          <p className="text-xs text-gray-500 mt-1">{formatWhole(latestTotal)} submissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-lg font-bold">Department Output</h2>
            <p className="text-sm text-gray-500 mt-1">Total submissions per department</p>
          </div>
          <div className="p-4 md:p-6 space-y-4">
            {sortedDepartments.map((dept) => (
              <div key={dept.department} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-800 truncate">{dept.department || 'Unassigned'}</p>
                  <p className="text-sm font-bold text-gray-900 shrink-0">{formatWhole(dept.total)}</p>
                </div>
                <div className="h-3 rounded bg-slate-100 overflow-hidden">
                  <div
                    className="h-3 rounded bg-gradient-to-r from-blue-500 to-indigo-600"
                    style={{ width: `${maxDeptTotal ? (toNumber(dept.total) / maxDeptTotal) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
            {sortedDepartments.length === 0 && <p className="text-sm text-gray-500">No department data available.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="text-lg font-bold">Yearly Trend</h2>
            <p className="text-sm text-gray-500 mt-1">All submissions grouped by year</p>
          </div>
          <div className="p-4 md:p-6">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] text-left">
                <thead className="bg-slate-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Journals</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Conferences</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {yearlyGrowth.map((row) => (
                    <tr key={row.year} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{row.year}</td>
                      <td className="px-4 py-3 text-sm font-bold text-right text-blue-700">{formatWhole(row.total)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{formatWhole(row.journals)}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{formatWhole(row.conferences)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {yearlyGrowth.length === 0 && <p className="text-sm text-gray-500 mt-4">No yearly data available.</p>}
=======
        <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5">
          <p className="text-xs uppercase tracking-wider font-bold text-indigo-600">Total Activities</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{totalActivities}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Department Activity Volume</h2>
          <div className="space-y-4">
            {departmentRows.map((dept) => {
              const max = Math.max(...departmentRows.map((d) => toNumber(d.total)), 1);
              const width = (toNumber(dept.total) / max) * 100;
              return (
                <div key={dept.department}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{dept.department}</span>
                    <span className="text-base font-bold text-gray-900">{toNumber(dept.total)}</span>
                  </div>
                  <div className="w-full h-3 rounded bg-gray-100 overflow-hidden">
                    <div
                      className="h-3 rounded bg-gradient-to-r from-blue-500 to-indigo-600"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {departmentRows.length === 0 && <p className="text-sm text-gray-500">No department data available.</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Yearly Activity Trend</h2>
          <div className="h-72 bg-gray-50 rounded-xl flex items-end justify-between px-4 pb-6 gap-3 overflow-x-auto">
            {yearlyRows.map((row) => {
              const total = toNumber(row.total);
              const height = Math.max(12, Math.round((total / maxYearTotal) * 220));
              return (
                <div key={row.year} className="flex-1 min-w-[48px] flex flex-col items-center gap-2">
                  <div className="w-full max-w-12 bg-indigo-600 rounded-t-md" style={{ height }} />
                  <span className="text-xs text-gray-700">{row.year}</span>
                </div>
              );
            })}
            {yearlyRows.length === 0 && <p className="w-full text-center text-sm text-gray-500">No yearly data available.</p>}
>>>>>>> Stashed changes
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentAnalytics;
