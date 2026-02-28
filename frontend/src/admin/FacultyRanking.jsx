import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import BlueLoader from '../components/BlueLoader';

<<<<<<< Updated upstream
const PAGE_SIZE = 8;
=======
const PAGE_SIZE = 5;
const MODULES = ['journals', 'conferences', 'patents', 'research-funding'];
>>>>>>> Stashed changes

const normalizeRole = (role) => (role || '').toString().trim().toUpperCase();
const isFacultyRole = (role) => normalizeRole(role) !== 'ADMIN';
<<<<<<< Updated upstream

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
=======
const formatNumber = (value) => {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return '0';
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
>>>>>>> Stashed changes
};

const FacultyRanking = () => {
  const [rows, setRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      setError('');
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session) {
          setRows([]);
          return;
        }

<<<<<<< Updated upstream
        const [profilesResponse, journalsResponse, conferencesResponse, patentsResponse, fundingResponse] =
          await Promise.all([
            supabase.from('profiles').select('id, full_name, department, role'),
            supabase.from('journal_publications').select('profile_id'),
            supabase.from('conference_publications').select('profile_id'),
            supabase.from('patents').select('profile_id'),
            supabase.from('research_funding').select('profile_id')
          ]);

        const profiles = (profilesResponse?.data || []).filter((profile) => profile?.id && isFacultyRole(profile?.role));
=======
        const [profilesResponse, ...modulePayloads] = await Promise.all([
          supabase.from('profiles').select('id, full_name, department, role'),
          ...MODULES.map((module) =>
            apiRequest(`/faculty/${module}`, {
              token: session.access_token
            })
          )
        ]);

        const profiles = (profilesResponse?.data || []).filter((profile) => isFacultyRole(profile?.role));
>>>>>>> Stashed changes

        const counts = new Map();
        const bump = (profileId, field) => {
          if (!profileId) return;
          const current = counts.get(profileId) || { publications: 0, patents: 0, grants: 0, total: 0 };
          current[field] += 1;
          current.total += 1;
          counts.set(profileId, current);
        };

        (journalsResponse?.data || []).forEach((r) => bump(r.profile_id, 'publications'));
        (conferencesResponse?.data || []).forEach((r) => bump(r.profile_id, 'publications'));
        (patentsResponse?.data || []).forEach((r) => bump(r.profile_id, 'patents'));
        (fundingResponse?.data || []).forEach((r) => bump(r.profile_id, 'grants'));

        const merged = profiles.map((profile) => {
          const profileCounts = counts.get(profile.id) || { publications: 0, patents: 0, grants: 0, total: 0 };
          return {
            profileId: profile.id,
            name: profile.full_name || 'Unknown',
            department: profile.department || 'Unassigned',
<<<<<<< Updated upstream
            publications: toNumber(profileCounts.publications),
            patents: toNumber(profileCounts.patents),
            grants: toNumber(profileCounts.grants),
            total: toNumber(profileCounts.total)
          };
        });

        merged.sort((a, b) => {
          if (b.total !== a.total) return b.total - a.total;
          return a.name.localeCompare(b.name);
        });

        setRows(merged.map((row, index) => ({ ...row, rank: index + 1 })));
=======
            publications: 0,
            grants: 0,
            score: 0
          });
        });

        MODULES.forEach((module, index) => {
          (modulePayloads[index] || []).forEach((entry) => {
            const profileId = getProfileId(entry);
            if (!profileId) return;

            if (!facultyMap.has(profileId)) {
              facultyMap.set(profileId, {
                profileId,
                name: entry?.profiles?.full_name || 'Unknown',
                department: entry?.profiles?.department || 'Unassigned',
                publications: 0,
                grants: 0,
                score: 0
              });
            }

            const current = facultyMap.get(profileId);
            if (module === 'journals' || module === 'conferences') {
              current.publications += 1;
            }
            if (module === 'research-funding') {
              current.grants += 1;
            }
            current.score = current.publications + current.grants;
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
            score: formatNumber(row.score)
          }));

        setRankings(formattedRankings);
>>>>>>> Stashed changes
        setCurrentPage(1);
      } catch (err) {
        console.error('[FacultyRanking] Load failure:', err);
        setError(err.message || 'Failed to load ranking data');
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
    const interval = setInterval(fetchRankings, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter rankings based on search query
  const filteredRankings = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    const query = searchQuery.toLowerCase().trim();
    return rows.filter(faculty => 
      faculty.name.toLowerCase().includes(query) ||
      faculty.department.toLowerCase().includes(query)
    );
  }, [rows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRankings.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedRankings = filteredRankings.slice(pageStart, pageStart + PAGE_SIZE);

  const totals = useMemo(() => {
    return filteredRankings.reduce(
      (acc, row) => {
        acc.publications += row.publications;
        acc.patents += row.patents;
        acc.grants += row.grants;
        acc.total += row.total;
        return acc;
      },
      { publications: 0, patents: 0, grants: 0, total: 0 }
    );
  }, [filteredRankings]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const downloadReport = () => {
    const headers = ['Rank', 'Name', 'Department', 'Publications', 'Patents', 'Grants', 'Total'];
    const csvData = filteredRankings.map((r) => [r.rank, `"${r.name}"`, `"${r.department}"`, r.publications, r.patents, r.grants, r.total].join(','));
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
<<<<<<< Updated upstream
          <p className="text-sm text-gray-500 mt-1">Ranked by total activity submissions.</p>
=======
          <p className="text-sm text-gray-500 mt-1">Live leaderboard based on total activities.</p>
>>>>>>> Stashed changes
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

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Faculty</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{filteredRankings.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
<<<<<<< Updated upstream
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Submissions</p>
          <p className="text-2xl font-bold text-blue-700 mt-2">{totals.total}</p>
=======
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Average Score</p>
          <p className="text-2xl font-bold text-blue-700 mt-2">{formatNumber(averageScore)}</p>
>>>>>>> Stashed changes
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Publications</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totals.publications}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Grants</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totals.grants}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by faculty name or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2">
            Showing {filteredRankings.length} result{filteredRankings.length !== 1 ? 's' : ''} for "{searchQuery}"
          </p>
        )}
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
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Patents</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Grants</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRankings.map((faculty) => (
                <tr key={faculty.profileId} className="hover:bg-slate-50/70 transition-colors">
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
                  <td className="px-6 py-4 text-center text-sm font-semibold text-gray-800">{faculty.patents}</td>
                  <td className="px-6 py-4 text-center text-sm font-semibold text-gray-800">{faculty.grants}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700 font-bold tracking-wide">
                      {faculty.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRankings.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            {searchQuery ? `No faculty found matching "${searchQuery}"` : 'No faculty data available. Ensure the admin account has access to profiles and activity tables in Supabase.'}
          </div>
        )}

        {filteredRankings.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {pageStart + 1} to {Math.min(pageStart + PAGE_SIZE, filteredRankings.length)} of {filteredRankings.length} records
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
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
