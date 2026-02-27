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

        // 🔥 CALL YOUR WORKING BACKEND ENDPOINT
        const analytics = await apiRequest(`/analytics/faculty/stats`, {
          token: session.access_token
        });

        // Count approved activities (existing logic)
        const rowsByModule = await Promise.all(
          FACULTY_MODULES.map(async (module) => {
            try {
              return await apiRequest(`/faculty/${module.id}`, {
                token: session.access_token
              });
            } catch {
              return [];
            }
          })
        );

        const allRows = rowsByModule.flat();
        const approved = allRows.filter(
          (item) => item.status === 'APPROVED'
        ).length;

        setApprovedCount(approved);

        // 🔥 MAP BACKEND RESPONSE STRUCTURE
        setScoreData({
          score: Number(analytics?.career?.career_score || 0),
          yearly: Array.isArray(analytics?.annual)
            ? analytics.annual.map((item) => ({
                year: item.year,
                score: (item.journal_score || 0) + (item.conference_score || 0)
              }))
            : []
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

    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8;'
    });

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

  const maxScore = Math.max(
    100,
    ...chartValues.map((item) => Number(item.score || 0))
  );

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            My Performance Report
          </h2>
          <p className="text-gray-500">
            Comprehensive summary based on approved activities
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <button
            onClick={handleExportPdf}
            className="bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
          >
            Export PDF
          </button>

          <button
            onClick={handleExportExcel}
            className="bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* SCORE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <h3 className="text-indigo-100 text-sm font-medium uppercase tracking-wider">
            Overall Performance Score
          </h3>
          <p className="text-5xl font-bold mt-4">
            {loading ? '-' : scoreData.score.toFixed(2)}
          </p>
          <p className="text-sm mt-4">Approved-only score</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
            Publication Impact
          </h3>
          <p className="text-4xl font-bold mt-4 text-gray-800">
            {loading ? '-' : publicationImpact}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">
            Approved Activities
          </h3>
          <p className="text-4xl font-bold mt-4 text-gray-800">
            {loading ? '-' : approvedCount}
          </p>
        </div>
      </div>

      {/* YEARLY PERFORMANCE CHART */}
      <div className="bg-white rounded-2xl p-6 border shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6">
          Yearly Performance Trend
        </h3>

        <div className="h-64 bg-gray-50 rounded-xl flex items-end justify-between px-8 pb-8 gap-4">
          {chartValues.map((item) => {
            const value = Number(item.score || 0);

            // Make bars taller: scale up the height and increase min height
            // Make bars extremely tall for maximum visibility
            const height = Math.max(
              120, // Very tall minimum
              Math.round((value / maxScore) * 320) // much larger scale
            );

            return (
              <div
                key={item.year}
                className="flex-1 flex flex-col items-center space-y-3"
              >
                <div
                  className="w-full max-w-16 bg-blue-600 rounded-t-lg shadow-md border border-blue-800"
                  style={{ height: `${height}%`, minHeight: '32px' }}
                />
                <span className="text-xs font-medium text-gray-800">
                  {item.year}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PerformanceReport;
