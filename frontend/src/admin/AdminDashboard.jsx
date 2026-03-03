import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { apiRequest } from '../apiClient';
import BlueLoader from '../components/BlueLoader';

const EMPTY_FACULTY_DATA = {
  journals: [],
  conferences: [],
  patents: [],
  funding: []
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatDate = (dateValue) => (dateValue ? new Date(dateValue).toLocaleDateString() : 'N/A');
const formatCurrency = (amount) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return 'N/A';
  return numericAmount.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

const QUICK_LINKS = [
  {
    to: '/admin/analytics',
    title: 'Department Analytics',
    description: 'Compare department research output over time',
    icon: 'analytics'
  }
];

const QuickLinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 3v18h18" strokeLinecap="round" />
    <path d="m7 14 3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
  </svg>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState([]);
  const [topDepartments, setTopDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyData, setFacultyData] = useState(EMPTY_FACULTY_DATA);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchErrorCode, setSearchErrorCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const moduleCounts = useMemo(
    () => ({
      journals: facultyData.journals.length,
      conferences: facultyData.conferences.length,
      patents: facultyData.patents.length,
      funding: facultyData.funding.length,
      total: facultyData.journals.length + facultyData.conferences.length + facultyData.patents.length + facultyData.funding.length
    }),
    [facultyData]
  );

  const loadFacultyAchievementsByName = async (facultyName) => {
    const normalizedName = facultyName.trim();
    if (!normalizedName) {
      setSearchError('Please enter a faculty name.');
      setSearchErrorCode('NAME_REQUIRED');
      setSelectedFaculty(null);
      setFacultyData(EMPTY_FACULTY_DATA);
      return;
    }

    setDetailsLoading(true);
    setSearchError('');
    setSearchErrorCode('');

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No session found');
      }

      const payload = await apiRequest('/admin/faculty-achievements', {
        token: session.access_token,
        query: { name: normalizedName }
      });

      console.log('[AdminDashboard] Faculty search result:', payload?.profile);

      setSelectedFaculty(payload?.profile || null);
      setFacultyData({
        journals: payload?.achievements?.journals || [],
        conferences: payload?.achievements?.conferences || [],
        patents: payload?.achievements?.patents || [],
        funding: payload?.achievements?.funding || []
      });
    } catch (loadError) {
      console.error('[AdminDashboard] Faculty search load failed:', loadError);
      setSearchError(loadError?.message || 'Unable to load faculty achievements');
      setSearchErrorCode(loadError?.code || '');
      setSelectedFaculty(null);
      setFacultyData(EMPTY_FACULTY_DATA);
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session) {
          setError('No session found');
          return;
        }

        const analyticsPayload = await apiRequest('/analytics/stats', { token: session.access_token });
        const facultyCount = toNumber(analyticsPayload?.totalFaculty);

        const deptVolume = Array.isArray(analyticsPayload?.deptVolume) ? analyticsPayload.deptVolume : [];
        const totalSubmissions = deptVolume.reduce((sum, row) => sum + toNumber(row?.total), 0);
        const activeDepartments = deptVolume.length;
        const moduleTotals = { journals: 0, conferences: 0, patents: 0, funding: 0 };
        deptVolume.forEach((row) => {
          moduleTotals.journals += toNumber(row?.journals);
          moduleTotals.conferences += toNumber(row?.conferences);
          moduleTotals.patents += toNumber(row?.patents);
          moduleTotals.funding += toNumber(row?.funding);
        });
        const activeModules = Object.values(moduleTotals).filter((value) => value > 0).length;

        setStats([
          { label: 'Total Faculty', value: facultyCount, icon: 'TF', color: 'bg-blue-500' },
          { label: 'Total Submissions', value: totalSubmissions, icon: 'TS', color: 'bg-green-500' },
          { label: 'Active Departments', value: activeDepartments, icon: 'AD', color: 'bg-indigo-500' },
          { label: 'Active Modules', value: activeModules, icon: 'AM', color: 'bg-slate-700' }
        ]);

        setTopDepartments(deptVolume.slice(0, 5));
        setError(null);
      } catch (statsError) {
        console.error('[AdminDashboard] API failure:', statsError);
        setError(statsError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    await loadFacultyAchievementsByName(searchTerm);
  };

  const clearSelection = () => {
    setSelectedFaculty(null);
    setSearchTerm('');
    setSearchError('');
    setSearchErrorCode('');
    setFacultyData(EMPTY_FACULTY_DATA);
  };

  const isExpectedSearchError = searchErrorCode === 'FACULTY_NOT_FOUND' || searchErrorCode === 'NO_ACHIEVEMENTS';

  if (loading) return <BlueLoader />;

  if (error) {
    return (
      <div className="p-4 sm:p-6 text-red-500">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Admin Dashboard</h1>
        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
          <p className="font-bold">Error loading dashboard data:</p>
          <p>{error}</p>
          <p className="text-sm mt-2 text-red-400">Please check backend server and authentication token.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`${stat.color} text-white p-3 rounded-lg text-sm font-bold`}>{stat.icon}</div>
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="faculty-search-shell p-5 sm:p-6 rounded-xl mb-8">
        <h2 className="text-lg font-bold mb-4">Faculty Search</h2>

        <form onSubmit={handleSearchSubmit}>
          <div className="faculty-search-field">
            <span className="faculty-search-icon">
            <SearchIcon />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setSelectedFaculty(null);
                setSearchError('');
                setSearchErrorCode('');
                setFacultyData(EMPTY_FACULTY_DATA);
              }}
              placeholder="Search by faculty name (e.g., John Doe)"
              className="faculty-search-input text-sm"
            />
            <button
              type="submit"
              className="faculty-search-btn"
            >
              Search
            </button>
          </div>
        </form>

        {detailsLoading ? <p className="mt-3 text-sm text-slate-500">Loading achievements...</p> : null}
        {searchError ? (
          <div
            className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
              isExpectedSearchError ? 'border-slate-200 bg-white text-slate-600' : 'border-red-200 bg-red-50 text-red-600'
            }`}
          >
            {searchError}
          </div>
        ) : null}

        {selectedFaculty && !detailsLoading && !searchError ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-slate-900">{selectedFaculty.full_name}</p>
                <p className="text-sm text-slate-600">{selectedFaculty.department}</p>
                {selectedFaculty.email ? <p className="text-xs text-slate-500 mt-1">{selectedFaculty.email}</p> : null}
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
              >
                Clear
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase text-slate-500 font-semibold">Total</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{moduleCounts.total}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase text-slate-500 font-semibold">Journals</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{moduleCounts.journals}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase text-slate-500 font-semibold">Conferences</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{moduleCounts.conferences}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase text-slate-500 font-semibold">Patents</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{moduleCounts.patents}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase text-slate-500 font-semibold">Funding</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{moduleCounts.funding}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Journals</h3>
                {facultyData.journals.length ? (
                  <div className="activity-list-scroll">
                    <ul className="activity-list-separated">
                      {facultyData.journals.map((entry) => (
                        <li key={entry.journal_id} className="activity-list-item text-sm">
                          <p className="font-semibold text-slate-800">{entry.title || 'Untitled'}</p>
                          <p className="text-xs text-slate-500">
                            {entry.journal_name || 'Unknown Journal'} - {formatDate(entry.publication_date)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No journal records.</p>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Conferences</h3>
                {facultyData.conferences.length ? (
                  <div className="activity-list-scroll">
                    <ul className="activity-list-separated">
                      {facultyData.conferences.map((entry) => (
                        <li key={entry.conference_id} className="activity-list-item text-sm">
                          <p className="font-semibold text-slate-800">{entry.title || 'Untitled'}</p>
                          <p className="text-xs text-slate-500">
                            {entry.conference_name || 'Unknown Conference'} - {formatDate(entry.conference_date)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No conference records.</p>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Patents</h3>
                {facultyData.patents.length ? (
                  <div className="activity-list-scroll">
                    <ul className="space-y-2">
                      {facultyData.patents.map((entry) => (
                        <li key={entry.patent_id} className="text-sm">
                          <p className="font-semibold text-slate-800">{entry.patent_title || 'Untitled Patent'}</p>
                          <p className="text-xs text-slate-500">
                            {entry.application_no || 'No Application No'} - {entry.patent_status || 'N/A'} - {formatDate(entry.filed_date)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No patent records.</p>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Research Funding</h3>
                {facultyData.funding.length ? (
                  <div className="activity-list-scroll">
                    <ul className="space-y-2">
                      {facultyData.funding.map((entry) => (
                        <li key={entry.funding_id} className="text-sm">
                          <p className="font-semibold text-slate-800">{entry.project_title || 'Untitled Project'}</p>
                          <p className="text-xs text-slate-500">
                            {entry.funding_agency || 'Unknown Agency'} - {formatCurrency(entry.amount)} - {formatDate(entry.start_date)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No funding records.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Top Departments</h2>
          <div className="space-y-4">
            {topDepartments.map((dept, i) => (
              <div key={`${dept.department}-${i}`} className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{dept.department || 'Unassigned'}</p>
                  <p className="text-xs text-gray-400">Total submissions</p>
                </div>
                <span className="shrink-0 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700 font-bold">
                  {toNumber(dept.total)}
                </span>
              </div>
            ))}
            {topDepartments.length === 0 ? <p className="text-center text-gray-500 py-4">No department data available</p> : null}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="quick-link-card group rounded-2xl p-5 transition-all"
              >
                <div className="quick-link-icon mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl">
                  <QuickLinkIcon />
                </div>
                <p className="quick-link-title text-base font-semibold">{link.title}</p>
                <p className="quick-link-description mt-1 text-xs">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
