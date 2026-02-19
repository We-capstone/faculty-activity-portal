import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { apiRequest } from '../apiClient';
import BlueLoader from '../components/BlueLoader';

const PAGE_SIZE = 5;

const getProfileId = (entry) => entry.profile_id || entry.profiles?.id;

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
          apiRequest('/api/analytics/admin/stats', {
            token: session.access_token
          }),
          apiRequest('/api/admin/approvals?status=APPROVED', {
            token: session.access_token
          }),
          supabase.from('profiles').select('id, full_name, department, role')
        ]);

        const profiles = profilesResponse?.data || [];
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
            score: row.score.toFixed(2)
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Faculty Ranking</h1>
        <div className="flex space-x-3">
          <button
            onClick={downloadReport}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Download Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Rank</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Faculty Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Publications</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Grants</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedRankings.map((faculty) => (
              <tr key={faculty.rank} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      faculty.rank === 1
                        ? 'bg-yellow-100 text-yellow-700'
                        : faculty.rank === 2
                        ? 'bg-gray-200 text-gray-700'
                        : faculty.rank === 3
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {faculty.rank}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{faculty.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{faculty.department}</td>
                <td className="px-6 py-4 text-center text-sm font-semibold">{faculty.publications}</td>
                <td className="px-6 py-4 text-center text-sm font-semibold">{faculty.grants}</td>
                <td className="px-6 py-4 text-right">
                  <span className="text-blue-600 font-bold">{faculty.score}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rankings.length === 0 && <div className="p-12 text-center text-gray-500">No faculty data found in backend.</div>}

        {rankings.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {pageStart + 1} to {Math.min(pageStart + PAGE_SIZE, rankings.length)} of {rankings.length} records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {safeCurrentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
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
