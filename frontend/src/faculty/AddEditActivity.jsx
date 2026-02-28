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
    proofFile: null,
    journalName: '',
    authorPosition: '',
    volume: '',
    publicationDate: '',
    paperLink: '',
    indexingDetails: '',
    journalQuartile: '',
    orcidPutCode: '',
    conferenceName: '',
    conferenceAuthorPosition: '',
    conferenceDate: '',
    proceedingsDetails: '',
    conferenceLink: '',
    conferenceIndexingDetails: '',
    conferenceOrcidPutCode: '',
    patentTitle: '',
    applicationNo: '',
    patentStatus: '',
    filedDate: '',
    publishedDate: '',
    grantedDate: '',
    publishProofPath: '',
    grantProofPath: '',
    fundingAgency: '',
    projectTitle: '',
    amount: '',
    startDate: '',
    endDate: '',
    fundingOrcidPutCode: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const buildPayload = () => {
    const y = Number(formData.year);
    const safeYear = Number.isFinite(y) ? y : new Date().getFullYear();
    const dateFromYear = `${safeYear}-01-01`;
    const safeAuthorPosition =
      formData.authorPosition === '' ? undefined : Number(formData.authorPosition);
    const safeOrcidPutCode = formData.orcidPutCode === '' ? undefined : Number(formData.orcidPutCode);
    const safeConferenceAuthorPosition =
      formData.conferenceAuthorPosition === '' ? undefined : Number(formData.conferenceAuthorPosition);
    const safeConferenceOrcidPutCode =
      formData.conferenceOrcidPutCode === '' ? undefined : Number(formData.conferenceOrcidPutCode);
    const safeFundingAmount = formData.amount === '' ? undefined : Number(formData.amount);
    const safeFundingOrcidPutCode =
      formData.fundingOrcidPutCode === '' ? undefined : Number(formData.fundingOrcidPutCode);

    const payloadByModule = {
      journals: {
        title: formData.title,
        journal_name: formData.journalName || formData.sourceName,
        author_position: Number.isFinite(safeAuthorPosition) ? safeAuthorPosition : undefined,
        volume: formData.volume || undefined,
        publication_date: formData.publicationDate || dateFromYear,
        paper_link: formData.paperLink || undefined,
        indexing_details: formData.indexingDetails || formData.details || undefined,
        journal_quartile: formData.journalQuartile || undefined,
        orcid_put_code: Number.isFinite(safeOrcidPutCode) ? safeOrcidPutCode : undefined
      },
      conferences: {
        title: formData.title,
        conference_name: formData.conferenceName || formData.sourceName,
        author_position: Number.isFinite(safeConferenceAuthorPosition) ? safeConferenceAuthorPosition : undefined,
        conference_date: formData.conferenceDate || dateFromYear,
        proceedings_details: formData.proceedingsDetails || undefined,
        conference_link: formData.conferenceLink || undefined,
        indexing_details: formData.conferenceIndexingDetails || formData.details || undefined,
        orcid_put_code: Number.isFinite(safeConferenceOrcidPutCode) ? safeConferenceOrcidPutCode : undefined
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
        patent_title: formData.patentTitle || formData.title,
        application_no: formData.applicationNo || formData.sourceName,
        patent_status: formData.patentStatus || undefined,
        filed_date: formData.filedDate || dateFromYear,
        published_date: formData.publishedDate || undefined,
        granted_date: formData.grantedDate || undefined,
        publish_proof_path: formData.publishProofPath || undefined,
        grant_proof_path: formData.grantProofPath || undefined
      },
      'research-funding': {
        funding_agency: formData.fundingAgency || formData.sourceName,
        project_title: formData.projectTitle || formData.title,
        amount: Number.isFinite(safeFundingAmount) ? safeFundingAmount : undefined,
        start_date: formData.startDate || dateFromYear,
        end_date: formData.endDate || undefined,
        orcid_put_code: Number.isFinite(safeFundingOrcidPutCode) ? safeFundingOrcidPutCode : undefined
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


      setSuccess('Activity submitted successfully.');
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
          <p className="text-sm text-gray-500 mt-1">Submit activity details for your records.</p>
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

            {formData.type !== 'journals' &&
            formData.type !== 'conferences' &&
            formData.type !== 'patents' &&
            formData.type !== 'research-funding' ? (
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
            ) : formData.type === 'research-funding' ? (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Start Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
            ) : formData.type === 'patents' ? (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Filed Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={formData.filedDate}
                  onChange={(e) => setFormData({ ...formData, filedDate: e.target.value })}
                  required
                />
              </div>
            ) : formData.type === 'conferences' ? (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Conference Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={formData.conferenceDate}
                  onChange={(e) => setFormData({ ...formData, conferenceDate: e.target.value })}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Publication Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={formData.publicationDate}
                  onChange={(e) => setFormData({ ...formData, publicationDate: e.target.value })}
                  required
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {formData.type === 'patents'
                ? 'Patent Title'
                : formData.type === 'research-funding'
                ? 'Project Title'
                : 'Title / Project Name'}
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder={
                formData.type === 'patents'
                  ? 'Enter patent title'
                  : formData.type === 'research-funding'
                  ? 'Enter project title'
                  : 'Enter title'
              }
              value={
                formData.type === 'patents'
                  ? formData.patentTitle
                  : formData.type === 'research-funding'
                  ? formData.projectTitle
                  : formData.title
              }
              onChange={(e) =>
                setFormData(
                  formData.type === 'patents'
                    ? { ...formData, patentTitle: e.target.value }
                    : formData.type === 'research-funding'
                    ? { ...formData, projectTitle: e.target.value }
                    : { ...formData, title: e.target.value }
                )
              }
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {formData.type === 'journals'
                ? 'Journal Name'
                : formData.type === 'conferences'
                ? 'Conference Name'
                : formData.type === 'patents'
                ? 'Application Number'
                : formData.type === 'research-funding'
                ? 'Funding Agency'
                : 'Journal / Conference / Source Name'}
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder={
                formData.type === 'journals'
                  ? 'Enter journal name'
                  : formData.type === 'conferences'
                  ? 'Enter conference name'
                  : formData.type === 'patents'
                  ? 'Enter application number'
                  : formData.type === 'research-funding'
                  ? 'Enter funding agency'
                  : 'Enter source name'
              }
              value={
                formData.type === 'journals'
                  ? formData.journalName
                  : formData.type === 'conferences'
                  ? formData.conferenceName
                  : formData.type === 'patents'
                  ? formData.applicationNo
                  : formData.type === 'research-funding'
                  ? formData.fundingAgency
                  : formData.sourceName
              }
              onChange={(e) =>
                setFormData(
                  formData.type === 'journals'
                    ? { ...formData, journalName: e.target.value }
                    : formData.type === 'conferences'
                    ? { ...formData, conferenceName: e.target.value }
                    : formData.type === 'patents'
                    ? { ...formData, applicationNo: e.target.value }
                    : formData.type === 'research-funding'
                    ? { ...formData, fundingAgency: e.target.value }
                    : { ...formData, sourceName: e.target.value }
                )
              }
              required={
                formData.type === 'journals' ||
                formData.type === 'conferences' ||
                formData.type === 'patents' ||
                formData.type === 'research-funding'
              }
            />
          </div>

          {formData.type === 'journals' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Author Position</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. 1"
                    value={formData.authorPosition}
                    onChange={(e) => setFormData({ ...formData, authorPosition: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Volume</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. 12(3)"
                    value={formData.volume}
                    onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Paper Link</label>
                <input
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="https://..."
                  value={formData.paperLink}
                  onChange={(e) => setFormData({ ...formData, paperLink: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Indexing Details</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Scopus / WoS / etc."
                    value={formData.indexingDetails}
                    onChange={(e) => setFormData({ ...formData, indexingDetails: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Journal Quartile</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Q1 / Q2 / Q3 / Q4"
                    value={formData.journalQuartile}
                    onChange={(e) => setFormData({ ...formData, journalQuartile: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">ORCID Put Code</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="ORCID work put-code"
                  value={formData.orcidPutCode}
                  onChange={(e) => setFormData({ ...formData, orcidPutCode: e.target.value })}
                />
              </div>
            </>
          )}

          {formData.type === 'conferences' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Author Position</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="e.g. 1"
                    value={formData.conferenceAuthorPosition}
                    onChange={(e) => setFormData({ ...formData, conferenceAuthorPosition: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Proceedings Details</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Proceedings details"
                    value={formData.proceedingsDetails}
                    onChange={(e) => setFormData({ ...formData, proceedingsDetails: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Conference Link</label>
                <input
                  type="url"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="https://..."
                  value={formData.conferenceLink}
                  onChange={(e) => setFormData({ ...formData, conferenceLink: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Indexing Details</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Scopus / WoS / etc."
                    value={formData.conferenceIndexingDetails}
                    onChange={(e) => setFormData({ ...formData, conferenceIndexingDetails: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">ORCID Put Code</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="ORCID work put-code"
                    value={formData.conferenceOrcidPutCode}
                    onChange={(e) => setFormData({ ...formData, conferenceOrcidPutCode: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {formData.type === 'patents' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Patent Status</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="FILED / PUBLISHED / GRANTED"
                  value={formData.patentStatus}
                  onChange={(e) => setFormData({ ...formData, patentStatus: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Published Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={formData.publishedDate}
                    onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Granted Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={formData.grantedDate}
                    onChange={(e) => setFormData({ ...formData, grantedDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Publish Proof Path</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Storage path or URL"
                    value={formData.publishProofPath}
                    onChange={(e) => setFormData({ ...formData, publishProofPath: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Grant Proof Path</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Storage path or URL"
                    value={formData.grantProofPath}
                    onChange={(e) => setFormData({ ...formData, grantProofPath: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {formData.type === 'research-funding' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">End Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">ORCID Put Code</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="ORCID work put-code"
                  value={formData.fundingOrcidPutCode}
                  onChange={(e) => setFormData({ ...formData, fundingOrcidPutCode: e.target.value })}
                />
              </div>
            </>
          )}

          {formData.type !== 'journals' &&
            formData.type !== 'conferences' &&
            formData.type !== 'patents' &&
            formData.type !== 'research-funding' && (
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
          )}

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
