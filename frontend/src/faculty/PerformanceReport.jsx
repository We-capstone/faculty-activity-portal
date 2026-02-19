import React, { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../apiClient';
import { supabase } from '../supabase';
import { FACULTY_MODULES } from './modules';

const PerformanceReport = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scoreData, setScoreData] = useState({ score: 0, yearly: [] });
  const [approvedCount, setApprovedCount] = useState(0);

  const publicationImpact = useMemo(() => {
    if (approvedCount >= 15) return 'High';
    if (approvedCount >= 5) return 'Moderate';
    return 'Low';
  }, [approvedCount]);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError('');

      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session?.access_token) return;

        const userId = session.user.id;
        let scorePayload = null;

        try {
          scorePayload = await apiRequest(`/analytics/faculty/${userId}/score`, {
            token: session.access_token
          });
        } catch {
          scorePayload = { score: 0, yearly: [] };
        }

        const rowsByModule = await Promise.all(
          FACULTY_MODULES.map(async (module) => {
            try {
              return await apiRequest(`/faculty/${module.id}`, { token: session.access_token });
            } catch {
              return [];
            }
          })
        );

        const allRows = rowsByModule.flat();
        const approved = allRows.filter((item) => item.status === 'APPROVED').length;

        setApprovedCount(approved);
        setScoreData({
          score: Number(scorePayload?.score || 0),
          yearly: Array.isArray(scorePayload?.yearly) ? scorePayload.yearly : []
        });
      } catch (err) {
        setError(err.message || 'Failed to load performance report');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, []);

  const handleExportPdf = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const rows = scoreData.yearly.length
      ? scoreData.yearly
      : [{ year: new Date().getFullYear(), score: scoreData.score }];

    const header = ['Year', 'Score'];
    const lines = [header.join(',')];
    rows.forEach((row) => {
      lines.push([row.year || '', row.score || 0].join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'faculty-performance-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const chartValues = scoreData.yearly.length
    ? scoreData.yearly
    : [{ year: new Date().getFullYear(), score: scoreData.score }];
  const maxScore = Math.max(100, ...chartValues.map((item) => Number(item.score || 0)));

  return (
    <div className="space-y-8">
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Performance Report</h2>
          <p className="text-gray-500">Comprehensive summary based on approved activities</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button onClick={handleExportPdf} className="flex items-center justify-center space-x-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-all w-full sm:w-auto">
            <span>Export PDF</span>
          </button>
          <button onClick={handleExportExcel} className="flex items-center justify-center space-x-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-all w-full sm:w-auto">
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-200">
          <h3 className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Overall Performance Score</h3>
          <p className="text-5xl font-bold mt-4">{loading ? '-' : scoreData.score.toFixed(2)}</p>
          <div className="mt-6 flex items-center text-indigo-100 text-sm">
            <span>Approved-only score</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Publication Impact</h3>
          <p className="text-4xl font-bold mt-4 text-gray-800">{loading ? '-' : publicationImpact}</p>
          <p className="text-sm text-gray-400 mt-4">Based on approved publications and activities</p>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Approved Activities</h3>
          <p className="text-4xl font-bold mt-4 text-gray-800">{loading ? '-' : approvedCount}</p>
          <p className="text-sm text-gray-400 mt-4">Count of records with APPROVED status</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 sm:p-8 border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Yearly Performance Trend</h3>
        <div className="overflow-x-auto">
          <div className="h-64 min-w-[420px] bg-gray-50 rounded-xl flex items-end justify-between px-4 sm:px-8 pb-8 gap-4">
          {chartValues.map((item) => {
            const value = Number(item.score || 0);
            const height = Math.max(8, Math.round((value / maxScore) * 100));
            return (
              <div key={item.year} className="flex-1 flex flex-col items-center space-y-3">
                <div className="w-full max-w-16 bg-indigo-500 rounded-t-lg" style={{ height: `${height}%` }}></div>
                <span className="text-xs font-medium text-gray-500">{item.year}</span>
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceReport;
