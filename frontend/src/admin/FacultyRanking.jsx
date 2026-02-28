import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase';
import BlueLoader from '../components/BlueLoader';

const PAGE_SIZE = 8;

const normalizeRole = (role) => (role || '').toString().trim().toUpperCase();
const isFacultyRole = (role) => normalizeRole(role) !== 'ADMIN';

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const FacultyRanking = () => {
  const [rows, setRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

        const [profilesResponse, journalsResponse, conferencesResponse, patentsResponse, fundingResponse] =
          await Promise.all([
            supabase.from('profiles').select('id, full_name, department, role'),
            supabase.from('journal_publications').select('profile_id'),
            supabase.from('conference_publications').select('profile_id'),
            supabase.from('patents').select('profile_id'),
            supabase.from('research_funding').select('profile_id')
          ]);

        const profiles = (profilesResponse?.data || []).filter((profile) => profile?.id && isFacultyRole(profile?.role));

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

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginated = useMemo(() => rows.slice(pageStart, pageStart + PAGE_SIZE), [rows, pageStart]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.publications += row.publications;
        acc.patents += row.patents;
        acc.grants += row.grants;
        acc.total += row.total;
        return acc;
      },
      { publications: 0, patents: 0, grants: 0, total: 0 }
    );
  }, [rows]);

  if (loading) return <BlueLoader />;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty Ranking</h1>
          <p className="text-sm text-gray-500 mt-1">Ranked by total activity submissions.</p>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Faculty</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{rows.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Submissions</p>
          <p className="text-2xl font-bold text-blue-700 mt-2">{totals.total}</p>
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
              {paginated.map((faculty) => (
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

        {rows.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No faculty data available. Ensure the admin account has access to profiles and activity tables in Supabase.
          </div>
        )}

        {rows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">
              Page <span className="font-semibold text-gray-700">{safeCurrentPage}</span> of{' '}
              <span className="font-semibold text-gray-700">{totalPages}</span>
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

