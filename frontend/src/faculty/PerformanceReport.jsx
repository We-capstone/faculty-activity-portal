import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../apiClient';
import { supabase } from '../supabase';
import BlueLoader from '../components/BlueLoader';
import {
  ACTIVITY_KEYS,
  ACTIVITY_META,
  ChartCard,
  DoughnutChart,
  StackedAreaChart,
  toNumber
} from '../components/AnalyticsCharts';

const FacultyAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [yearlyGrowth, setYearlyGrowth] = useState([]);
  const [deptVolume, setDeptVolume] = useState([]);
  const [scope, setScope] = useState('My Department');

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
        setYearlyGrowth(Array.isArray(payload?.yearlyGrowth) ? payload.yearlyGrowth : []);
        setDeptVolume(Array.isArray(payload?.deptVolume) ? payload.deptVolume : []);
        setScope(payload?.userContext?.scope || 'My Department');
      } catch (err) {
        setError(err.message || 'Failed to load faculty analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const departmentRow = useMemo(() => deptVolume[0] || null, [deptVolume]);
  const departmentName = departmentRow?.department || 'My Department';
  const departmentTotal = toNumber(departmentRow?.total);
  const latestYear = yearlyGrowth.at(-1)?.year ?? '-';
  const latestTotal = toNumber(yearlyGrowth.at(-1)?.total);

  const dominantActivity = useMemo(() => {
    if (!departmentRow) return '-';
    const ranked = [...ACTIVITY_KEYS].sort((a, b) => toNumber(departmentRow[b]) - toNumber(departmentRow[a]));
    const key = ranked[0];
    return departmentRow[key] ? ACTIVITY_META[key]?.label || key : '-';
  }, [departmentRow]);

  if (loading) return <BlueLoader />;

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-gray-900">Faculty Analytics</h2>
        <p className="text-sm text-gray-600">
          Departmental benchmarking view for <span className="font-semibold text-gray-800">{departmentName}</span>.
        </p>
        <p className="text-xs text-gray-500">Scope: {scope}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Department</p>
          <p className="mt-2 text-lg font-black text-gray-900">{departmentName}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Department Total</p>
          <p className="mt-2 text-3xl font-black text-blue-700">{departmentTotal.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Latest Year</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{latestYear}</p>
          <p className="text-xs text-gray-500 mt-1">{latestTotal.toLocaleString()} submissions</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-bold">Research Identity</p>
          <p className="mt-2 text-3xl font-black text-gray-900">{dominantActivity}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Departmental Growth Trend"
          subtitle='Stacked trend of journals, conferences, patents, and funding to visualize department "Research Velocity".'
        >
          <StackedAreaChart data={yearlyGrowth} keys={ACTIVITY_KEYS} />
          {yearlyGrowth.length === 0 ? <p className="mt-4 text-sm text-gray-500">No yearly growth data available.</p> : null}
        </ChartCard>

        <ChartCard
          title="Activity Mix (Department Profile)"
          subtitle='Doughnut split of journals, conferences, patents, and funding to highlight department "Research Identity".'
        >
          <DoughnutChart row={departmentRow} keys={ACTIVITY_KEYS} />
          {!departmentRow ? <p className="mt-4 text-sm text-gray-500">No departmental activity data available.</p> : null}
        </ChartCard>
      </div>
    </div>
  );
};

export default FacultyAnalytics;
