import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { apiRequest } from '../apiClient';
import BlueLoader from '../components/BlueLoader';

const moduleLabel = (module) => (module === 'research_funding' ? 'funding' : module);

const ApprovalQueue = () => {
  const [pendingItems, setPendingItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

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

      if (filter === 'all') {
        const results = await apiRequest('/api/admin/approvals?status=PENDING', {
          token: session.access_token
        });

        const allEntries = (results || []).flatMap((mod) =>
          (mod.entries || []).map((entry) => ({
            ...entry,
            module: mod.module
          }))
        );

        setPendingItems(allEntries);
      } else {
        const data = await apiRequest(`/api/admin/approvals?module=${filter}&status=PENDING`, {
          token: session.access_token
        });
        setPendingItems((data || []).map((entry) => ({ ...entry, module: filter })));
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
  }, [filter]);

  const handleAction = async (module, id, action) => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) return;

      await apiRequest(`/api/admin/${module}/${id}/status`, {
        method: 'PATCH',
        token: session.access_token,
        body: { action }
      });

      alert(`Successfully ${action.toLowerCase()}ed`);
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Approval Queue</h1>
        <div className="flex space-x-2">
          <select
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Modules</option>
            <option value="journals">Journals</option>
            <option value="patents">Patents</option>
            <option value="conferences">Conferences</option>
            <option value="research_funding">Funding</option>
          </select>
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
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Faculty Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Activity Title</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingItems.map((item) => (
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
                      {item.title || item.paper_title || item.project_title || 'No Title'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
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
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && !error && pendingItems.length === 0 && (
          <div className="p-12 text-center text-gray-500">No pending approvals found.</div>
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Submission Details</h2>
                <p className="text-sm text-gray-500 capitalize">{moduleLabel(selectedItem.module)} module</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-400 hover:text-gray-600 text-3xl font-light"
              >
                x
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-8 mb-8">
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
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex space-x-4">
              <button
                onClick={() => handleAction(selectedItem.module, getPK(selectedItem), 'APPROVED')}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction(selectedItem.module, getPK(selectedItem), 'REJECTED')}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalQueue;
