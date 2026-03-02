import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import { apiRequest } from '../apiClient';
import BlueLoader from '../components/BlueLoader';
import {
  ACTIVITY_KEYS,
  ChartCard,
  ClusteredBarChart,
  HeatmapMatrix,
  LineChart,
  toNumber
} from '../components/AnalyticsCharts';

const formatWhole = (value) => Math.round(toNumber(value)).toLocaleString();

const DepartmentAnalytics = () => {
  const [deptVolume, setDeptVolume] = useState([]);
  const [yearlyGrowth, setYearlyGrowth] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [barScale, setBarScale] = useState('sqrt');
  const [topDeptOpen, setTopDeptOpen] = useState(false);
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
        setDeptVolume(Array.isArray(payload?.deptVolume) ? payload.deptVolume : []);
        setYearlyGrowth(Array.isArray(payload?.yearlyGrowth) ? payload.yearlyGrowth : []);
        setHeatmapData(Array.isArray(payload?.heatmapData) ? payload.heatmapData : []);
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

  const sortedDepartments = useMemo(() => {
    return [...deptVolume].sort((a, b) => toNumber(b?.total) - toNumber(a?.total));
  }, [deptVolume]);

  const maxDeptTotal = useMemo(() => Math.max(...sortedDepartments.map((d) => toNumber(d?.total)), 0), [sortedDepartments]);
  const totalSubmissions = useMemo(() => sortedDepartments.reduce((sum, d) => sum + toNumber(d?.total), 0), [sortedDepartments]);
  const topDeptRow = sortedDepartments[0] || null;
  const topDepartment = topDeptRow?.department || '-';
  const latestYear = yearlyGrowth.at(-1)?.year;
  const latestTotal = toNumber(yearlyGrowth.at(-1)?.total);

  if (loading) return <BlueLoader />;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Departments</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{sortedDepartments.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Total Submissions</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{formatWhole(totalSubmissions)}</p>
        </div>
        <button
          type="button"
          disabled={!topDeptRow}
          onClick={() => topDeptRow && setTopDeptOpen(true)}
          className={`text-left bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-colors ${
            topDeptRow ? 'hover:bg-slate-50/60' : 'opacity-70 cursor-not-allowed'
          }`}
        >
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Top Department</p>
          <p className="mt-2 text-lg font-black text-gray-900 truncate">{topDepartment}</p>
          <p className="text-xs text-gray-500 mt-1">
            {topDeptRow ? `Total: ${formatWhole(topDeptRow.total)}` : 'No data'}
          </p>
        </button>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Latest Year</p>
          <p className="mt-2 text-lg font-black text-gray-900">{latestYear ?? '-'}</p>
          <p className="text-xs text-gray-500 mt-1">{formatWhole(latestTotal)} submissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Department Volume"
          subtitle="Submissions by department and activity type."
          right={
            <div className="flex flex-col items-end gap-2">
              <div className="text-xs text-gray-500">
                Max: <span className="font-bold text-gray-900">{formatWhole(maxDeptTotal)}</span>
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setBarScale('linear')}
                  className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                    barScale === 'linear' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Linear
                </button>
                <button
                  type="button"
                  onClick={() => setBarScale('sqrt')}
                  className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                    barScale === 'sqrt' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Zoom
                </button>
              </div>
            </div>
          }
        >
          <ClusteredBarChart rows={sortedDepartments} keys={ACTIVITY_KEYS} scale={barScale} />
          {sortedDepartments.length === 0 ? <p className="mt-4 text-sm text-gray-500">No department data available.</p> : null}
        </ChartCard>

        <ChartCard
          title="Adoption Trend"
          subtitle="Total submissions captured each year."
        >
          <LineChart rows={yearlyGrowth} />
          {yearlyGrowth.length === 0 ? <p className="mt-4 text-sm text-gray-500">No yearly data available.</p> : null}
        </ChartCard>
      </div>

      <div className="mt-6">
        <ChartCard
          title="Activity Heatmap"
          subtitle="Submission intensity by department and year (darker = more)."
        >
          <HeatmapMatrix cells={heatmapData} />
          {heatmapData.length === 0 ? <p className="mt-4 text-sm text-gray-500">No heatmap data available.</p> : null}
        </ChartCard>
      </div>

      {topDeptOpen && topDeptRow ? (
        <div className="theme-overlay fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{topDeptRow.department || 'Top Department'}</h3>
                <p className="text-sm text-gray-500 mt-1">Submission breakdown</p>
              </div>
              <button
                type="button"
                onClick={() => setTopDeptOpen(false)}
                className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Total</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatWhole(topDeptRow.total)}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Journals</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatWhole(topDeptRow.journals)}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Conferences</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatWhole(topDeptRow.conferences)}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Patents</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatWhole(topDeptRow.patents)}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Funding</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{formatWhole(topDeptRow.funding)}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DepartmentAnalytics;
