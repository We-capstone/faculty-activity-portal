import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../apiClient';
import { supabase } from '../supabase';
import { FACULTY_MODULES, getEntryId } from './modules';

const DEFAULT_MODULE = FACULTY_MODULES[0].id;

const AddEditActivity = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type');

  const moduleIds = useMemo(() => FACULTY_MODULES.map((item) => item.id), []);

  const [formData, setFormData] = useState({
    type: moduleIds.includes(initialType) ? initialType : DEFAULT_MODULE,
    title: '',
    sourceName: '',
    year: String(new Date().getFullYear()),
    details: '',
    proofFile: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const buildPayload = () => {
    const y = Number(formData.year);
    const safeYear = Number.isFinite(y) ? y : new Date().getFullYear();
    const dateFromYear = `${safeYear}-01-01`;

    const payloadByModule = {
      journals: {
        title: formData.title,
        journal_name: formData.sourceName,
        publication_date: dateFromYear,
        indexing_details: formData.details
      },
      conferences: {
        title: formData.title,
        conference_name: formData.sourceName,
        date: dateFromYear,
        location: formData.details
      },
      books: {
        title: formData.title,
        publisher: formData.sourceName,
        year: safeYear,
        isbn: formData.details
      },
      'book-chapters': {
        title: formData.title,
        book_title: formData.sourceName,
        year: safeYear,
        description: formData.details
      },
      patents: {
        title: formData.title,
        patent_number: formData.sourceName,
        year: safeYear,
        description: formData.details
      },
      'research-funding': {
        title: formData.title,
        funding_agency: formData.sourceName,
        year: safeYear,
        description: formData.details
      },
      consultancy: {
        title: formData.title,
        client_name: formData.sourceName,
        year: safeYear,
        description: formData.details
      },
      'academic-service': {
        title: formData.title,
        service_role: formData.sourceName,
        year: safeYear,
        description: formData.details
      }
    };

    return payloadByModule[formData.type] || { title: formData.title, year: safeYear };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Session expired. Please login again.');
      }

      const created = await apiRequest(`/faculty/${formData.type}`, {
        method: 'POST',
        token: session.access_token,
        body: buildPayload()
      });

      if (formData.proofFile) {
  const createdId = getEntryId(created);

  if (createdId) {
    const fileBody = new FormData();
    fileBody.append('file', formData.proofFile);

    await apiRequest(`/faculty/${formData.type}/${createdId}/proof`, {
      method: 'POST',
      token: session.access_token,
      body: fileBody,
      rawBody: true
    });
  }
}


      setSuccess('Activity submitted successfully with status PENDING.');
      setTimeout(() => navigate('/faculty/activities'), 600);
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Add New Activity</h2>
          <p className="text-sm text-gray-500 mt-1">Submit activity details. New entries are created with PENDING status.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-6">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Activity Type</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {FACULTY_MODULES.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Year</label>
              <input
                type="number"
                min="2000"
                max="2100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Title / Project Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Enter title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Journal / Conference / Source Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Enter source name"
              value={formData.sourceName}
              onChange={(e) => setFormData({ ...formData, sourceName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Details</label>
            <textarea
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Additional details"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Proof Document (optional)</label>
            <input
              type="file"
              className="block w-full text-sm text-gray-700"
              onChange={(e) => setFormData({ ...formData, proofFile: e.target.files?.[0] || null })}
            />
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/faculty/activities')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 w-full sm:w-auto"
            >
              {submitting ? 'Submitting...' : 'Submit Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditActivity;
