import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { apiRequest } from '../apiClient';
import BlueLoader from '../components/BlueLoader';

const moduleLabel = (module) => (module === 'research_funding' ? 'funding' : module);
const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED'];
const statusLabel = (status) => {
  if (status === 'APPROVED') return 'Accepted';
  if (status === 'REJECTED') return 'Rejected';
  return 'Pending';
};
const buildStatusUpdateRequest = (module, id, action, remarks) => ({
  path: `/admin/${module}/${id}/status`,
  method: 'PATCH',
  body: {
    action,
    remarks: remarks?.trim() || null
  }
});

const ApprovalQueue = () => {
  const [approvalItems, setApprovalItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [timeline, setTimeline] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [remarks, setRemarks] = useState('');

  const filteredPendingItems = useMemo(() => {
    return approvalItems.filter((item) => {
      if (!item.created_at) return false;
      const submittedAt = new Date(item.created_at);
      if (Number.isNaN(submittedAt.getTime())) return false;

      if (timeline === '6m') {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - 6);
        return submittedAt >= cutoff;
      }

      if (timeline === '1y') {
        const cutoff = new Date();
        cutoff.setFullYear(cutoff.getFullYear() - 1);
        return submittedAt >= cutoff;
      }

      if (fromDate) {
        const start = new Date(fromDate);
        if (Number.isNaN(start.getTime()) || submittedAt < start) return false;
      }

      if (toDate) {
        const end = new Date(toDate);
        if (Number.isNaN(end.getTime())) return false;
        end.setHours(23, 59, 59, 999);
        if (submittedAt > end) return false;
      }

      return true;
    });
  }, [approvalItems, timeline, fromDate, toDate]);

  const fetchApprovals = async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        setError('No active session found. Please login again.');
        return;
      }

      const mapResults = (payload, status) => {
        if (filter === 'all') {
          return (payload || []).flatMap((mod) =>
            (mod.entries || []).map((entry) => ({
              ...entry,
              status,
              module: mod.module
            }))
          );
        }

        return (payload || []).map((entry) => ({
          ...entry,
          status,
          module: filter
        }));
      };

      if (statusFilter === 'all') {
        const requests = STATUS_OPTIONS.map((status) =>
          apiRequest(
            filter === 'all'
              ? `/admin/approvals?status=${status}`
              : `/admin/approvals?module=${filter}&status=${status}`,
            { token: session.access_token }
          )
        );

        const [pendingData, approvedData, rejectedData] = await Promise.all(requests);
        setApprovalItems([
          ...mapResults(pendingData, 'PENDING'),
          ...mapResults(approvedData, 'APPROVED'),
          ...mapResults(rejectedData, 'REJECTED')
        ]);
      } else {
        const data = await apiRequest(
          filter === 'all'
            ? `/admin/approvals?status=${statusFilter}`
            : `/admin/approvals?module=${filter}&status=${statusFilter}`,
          { token: session.access_token }
        );

        setApprovalItems(mapResults(data, statusFilter));
      }
    } catch (err) {
      console.error('Error fetching approvals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    const interval = setInterval(fetchApprovals, 30000);
    return () => clearInterval(interval);
  }, [filter, statusFilter]);

  const handleAction = async (module, id, action, itemRemarks = '') => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return;

      const request = buildStatusUpdateRequest(module, id, action, itemRemarks);
      await apiRequest(request.path, {
        method: request.method,
        token: session.access_token,
        body: request.body
      });

      alert(`Successfully ${action.toLowerCase()}ed`);
      setRemarks('');
      setSelectedItem(null);
      fetchApprovals();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const getPK = (item) => {
    if (item.journal_id) return item.journal_id;
    if (item.conference_id) return item.conference_id;
    if (item.patent_id) return item.patent_id;
    if (item.funding_id) return item.funding_id;
    return item.id;
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Approval Queue</h1>
        <div className="flex flex-wrap gap-2">
          <select
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[140px]"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Modules</option>
            <option value="journals">Journals</option>
            <option value="patents">Patents</option>
            <option value="conferences">Conferences</option>
            <option value="research_funding">Funding</option>
          </select>
          <select
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[140px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="all">All Status</option>
          </select>
          <select
            className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[140px]"
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last 1 Year</option>
          </select>
          {timeline === 'all' && (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                aria-label="From date"
                title="From date"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm"
                aria-label="To date"
                title="To date"
              />
            </>
          )}
          <button
            onClick={fetchApprovals}
            className="p-2 text-gray-500 hover:text-blue-600 transition-colors bg-white border border-gray-300 rounded-lg"
            title="Refresh"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <BlueLoader className="py-12" />
        ) : error ? (
          <div className="p-12 text-center text-red-500">
            <p className="font-bold">Error loading approvals:</p>
            <p>{error}</p>
            <button onClick={fetchApprovals} className="mt-4 text-blue-600 hover:underline font-medium">
              Try Again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Faculty Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Activity Title</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPendingItems.map((item) => (
                  <tr key={`${item.module}-${getPK(item)}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{item.profiles?.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 capitalize">
                        {moduleLabel(item.module)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {item.title || item.patent_title || item.paper_title || item.project_title || 'No Title'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {item.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleAction(item.module, getPK(item), 'APPROVED')}
                            className="text-sm font-medium text-green-600 hover:text-green-800"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(item.module, getPK(item), 'REJECTED')}
                            className="text-sm font-medium text-red-600 hover:text-red-800"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {item.status !== 'PENDING' && (
                        <span className="text-sm font-medium text-gray-500">{statusLabel(item.status)}</span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setRemarks(item.remarks || '');
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filteredPendingItems.length === 0 && (
          <div className="p-12 text-center text-gray-500">No approvals found for selected filters.</div>
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Submission Details</h2>
                <p className="text-sm text-gray-500 capitalize">{moduleLabel(selectedItem.module)} module</p>
              </div>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setRemarks('');
                }}
                className="text-gray-400 hover:text-gray-600 text-3xl font-light"
              >
                x
              </button>
            </div>

            <div className="p-4 sm:p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-xs text-blue-600 uppercase font-black tracking-wider mb-1">Faculty</p>
                  <p className="text-lg font-bold text-blue-900">{selectedItem.profiles?.full_name || 'N/A'}</p>
                  <p className="text-sm text-blue-700">{selectedItem.profiles?.department || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-black tracking-wider mb-1">Submitted Date</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(selectedItem.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">{new Date(selectedItem.created_at).toLocaleTimeString()}</p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
                  Entry Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(selectedItem).map(([key, value]) => {
                    if (
                      ['profiles', 'profile_id', 'status', 'approved_by', 'approved_at', 'remarks', 'created_at', 'module'].includes(
                        key
                      )
                    ) {
                      return null;
                    }
                    if (typeof value === 'object' && value !== null) return null;
                    if (value === null || value === undefined) return null;

                    const label = key.replace(/_/g, ' ').toUpperCase();
                    const isLink =
                      typeof value === 'string' && (value.startsWith('http') || value.startsWith('https'));

                    return (
                      <div key={key} className="flex flex-col">
                        <p className="text-xs text-gray-400 font-bold mb-1">{label}</p>
                        {isLink ? (
                          <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 font-medium hover:underline break-all"
                          >
                            View Document
                          </a>
                        ) : (
                          <p className="text-base text-gray-800 font-medium">{value.toString()}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8">
                <label htmlFor="approval-remarks" className="block text-sm font-semibold text-gray-700 mb-2">
                  Admin Remarks
                </label>
                <textarea
                  id="approval-remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  placeholder="Add remarks for this submission..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {selectedItem.status === 'PENDING' ? (
              <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => handleAction(selectedItem.module, getPK(selectedItem), 'APPROVED', remarks)}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(selectedItem.module, getPK(selectedItem), 'REJECTED', remarks)}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                >
                  Reject
                </button>
              </div>
            ) : (
              <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setRemarks('');
                  }}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;
