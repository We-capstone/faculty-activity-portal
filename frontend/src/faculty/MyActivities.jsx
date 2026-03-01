import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../apiClient';
import { supabase } from '../supabase';
import { FACULTY_MODULES, getEntryId, getEntryTitle, getEntryYear } from './modules';

const HIDDEN_DETAIL_KEYS = new Set(['id', 'user_id', 'status', 'patent_status']);

const toLabel = (key) =>
  String(key || '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDetailValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const MyActivities = () => {
  const [activeTab, setActiveTab] = useState(FACULTY_MODULES[0].id);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const navigate = useNavigate();

  const loadActivities = async (moduleId) => {
    setLoading(true);
    setError('');

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const data = await apiRequest(`/faculty/${moduleId}`, { token: session.access_token });
      setRows(data || []);
    } catch (err) {
      setRows([]);
      setError(err.message || 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities(activeTab);
  }, [activeTab]);

  const handleDelete = async (entryId) => {
    if (!window.confirm('Delete this activity?')) return;

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      await apiRequest(`/faculty/${activeTab}/${entryId}`, {
        method: 'DELETE',
        token: session.access_token
      });

      await loadActivities(activeTab);
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-800">My Activities</h2>
        <button
          onClick={() => navigate(`/faculty/add-activity?type=${activeTab}`)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"
        >
          Add New Activity
        </button>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        {FACULTY_MODULES.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.name || tab.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title/Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!loading && rows.map((row) => {
                const entryId = getEntryId(row);
                return (
                  <tr
                    key={entryId}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedRow(row)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{getEntryTitle(row)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{getEntryYear(row)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(entryId);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500 italic">
                    No activities recorded for this category yet.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500 italic">
                    Loading activities...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRow && (
        <div
          className="fixed inset-0 z-50 bg-black/40 p-4 flex items-center justify-center"
          onClick={() => setSelectedRow(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-xl bg-white border border-gray-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Activity Details</h3>
                <p className="text-sm text-gray-600 mt-1">{getEntryTitle(selectedRow)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close details"
              >
                X
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto max-h-[65vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(selectedRow)
                  .filter(([key, value]) => !HIDDEN_DETAIL_KEYS.has(key) && value !== null && value !== undefined && value !== '')
                  .map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">{toLabel(key)}</p>
                      <p className="mt-1 text-sm font-medium break-words text-gray-900">{formatDetailValue(value)}</p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyActivities;
