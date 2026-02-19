import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { apiRequest } from '../apiClient';
import BlueLoader from '../components/BlueLoader';

const PAGE_SIZE = 5;

const getProfileId = (entry) => entry.profile_id || entry.profiles?.id;
const normalizeRole = (role) => (role || '').toString().trim().toUpperCase();
const isFacultyRole = (role) => normalizeRole(role) !== 'ADMIN';
const formatScore = (value) => {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return '0';
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const FacultyRanking = () => {
  const [rankings, setRankings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session) return;

        const [analyticsPayload, approvedPayload, profilesResponse] = await Promise.all([
          apiRequest('/analytics/admin/stats', {
            token: session.access_token
          }),
          apiRequest('/admin/approvals?status=APPROVED', {
            token: session.access_token
          }),
          supabase.from('profiles').select('id, full_name, department, role')
        ]);

        const profiles = (profilesResponse?.data || []).filter((profile) => isFacultyRole(profile?.role));
        const leaderboardRows = analyticsPayload?.individualLeaderboard || [];
        const scoreByProfileId = new Map();
        leaderboardRows.forEach((row) => {
          scoreByProfileId.set(row.profile_id, Number(row.career_score || 0));
        });

        const facultyMap = new Map();

        profiles.forEach((profile) => {
          if (!profile?.id) return;
          facultyMap.set(profile.id, {
            profileId: profile.id,
            name: profile.full_name || 'Unknown',
            department: profile.department || 'Unassigned',
            publications: 0,
            grants: 0,
            score: scoreByProfileId.get(profile.id) || 0
          });
        });

        leaderboardRows.forEach((row) => {
          const profileId = row.profile_id;
          if (!profileId) return;
          const existing = facultyMap.get(profileId);
          facultyMap.set(profileId, {
            profileId,
            name: existing?.name || row?.profiles?.full_name || 'Unknown',
            department: existing?.department || row?.profiles?.department || 'Unassigned',
            publications: existing?.publications || 0,
            grants: existing?.grants || 0,
            score: Number(row.career_score || 0)
          });
        });

        (approvedPayload || []).forEach((bucket) => {
          const module = bucket.module;
          (bucket.entries || []).forEach((entry) => {
            const profileId = getProfileId(entry);
            if (!profileId) return;

            if (!facultyMap.has(profileId)) {
              facultyMap.set(profileId, {
                profileId,
                name: entry?.profiles?.full_name || 'Unknown',
                department: entry?.profiles?.department || 'Unassigned',
                publications: 0,
                grants: 0,
                score: scoreByProfileId.get(profileId) || 0
              });
            }

            const current = facultyMap.get(profileId);
            if (module === 'journals' || module === 'conferences') {
              current.publications += 1;
            }
            if (module === 'research_funding') {
              current.grants += 1;
            }
            facultyMap.set(profileId, current);
          });
        });

        const formattedRankings = [...facultyMap.values()]
          .sort((a, b) => b.score - a.score)
          .map((row, index) => ({
            rank: index + 1,
            name: row.name,
            department: row.department,
            publications: row.publications,
            grants: row.grants,
            score: formatScore(row.score)
          }));

        setRankings(formattedRankings);
        setCurrentPage(1);
      } catch (err) {
        console.error('[FacultyRanking] API failure:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
    const interval = setInterval(fetchRankings, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalPages = Math.max(1, Math.ceil(rankings.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedRankings = rankings.slice(pageStart, pageStart + PAGE_SIZE);
  const totalFaculty = rankings.length;
  const averageScore = totalFaculty
    ? rankings.reduce((sum, row) => sum + Number(row.score || 0), 0) / totalFaculty
    : 0;
  const topFaculty = rankings[0];

  const downloadReport = () => {
    const headers = ['Rank', 'Name', 'Department', 'Publications', 'Grants', 'Total Score'];
    const csvData = rankings.map((r) => [r.rank, `"${r.name}"`, `"${r.department}"`, r.publications, r.grants, r.score].join(','));
    const csvContent = [headers.join(','), ...csvData].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `faculty_ranking_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <BlueLoader />;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty Ranking</h1>
          <p className="text-sm text-gray-500 mt-1">Live leaderboard based on approved activities and career score.</p>
        </div>
        <div className="flex w-full sm:w-auto space-x-3">
          <button
            onClick={downloadReport}
            className="bg-blue-600 text-white w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Faculty</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalFaculty}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Average Score</p>
          <p className="text-2xl font-bold text-blue-700 mt-2">{formatScore(averageScore)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Top Faculty</p>
          <p className="text-lg font-bold text-gray-900 mt-2 truncate">{topFaculty?.name || 'N/A'}</p>
          <p className="text-sm text-gray-500">{topFaculty ? `${topFaculty.score} score` : 'No data yet'}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Rank</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Faculty Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Publications</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Grants</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRankings.map((faculty) => (
                <tr key={faculty.rank} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        faculty.rank === 1
                          ? 'bg-yellow-100 text-yellow-700'
                          : faculty.rank === 2
                          ? 'bg-gray-200 text-gray-700'
                          : faculty.rank === 3
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {faculty.rank}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{faculty.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{faculty.department}</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-gray-800">{faculty.publications}</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-gray-800">{faculty.grants}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700 font-bold tracking-wide">
                      {faculty.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rankings.length === 0 && <div className="p-12 text-center text-gray-500">No faculty data found in backend.</div>}

        {rankings.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {pageStart + 1} to {Math.min(pageStart + PAGE_SIZE, rankings.length)} of {rankings.length} records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-gray-700">
                Page {safeCurrentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyRanking;
