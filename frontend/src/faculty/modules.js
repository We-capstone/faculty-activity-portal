export const FACULTY_MODULES = [
  { id: 'journals', label: 'Journals' },
  { id: 'conferences', label: 'Conferences' },
  { id: 'books', label: 'Books' },
  { id: 'book-chapters', label: 'Book Chapters' },
  { id: 'patents', label: 'Patents' },
  { id: 'research-funding', label: 'Research Funding' },
  { id: 'consultancy', label: 'Consultancy' },
  { id: 'academic-service', label: 'Academic Service' }
];

export function getEntryId(entry) {
  return (
    entry.id ||
    entry.journal_id ||
    entry.conference_id ||
    entry.book_id ||
    entry.patent_id ||
    entry.funding_id ||
    entry.consultancy_id ||
    entry.service_id
  );
}

export function getEntryTitle(entry) {
  return (
    entry.title ||
    entry.name ||
    entry.journal_name ||
    entry.conference_name ||
    entry.book_title ||
    entry.patent_title ||
    entry.project_title ||
    'Untitled'
  );
}

export function getEntryYear(entry) {
  if (entry.year) return entry.year;
  const dateValue = entry.publication_date || entry.date || entry.created_at || entry.updated_at;
  if (!dateValue) return '-';
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.getFullYear();
}
