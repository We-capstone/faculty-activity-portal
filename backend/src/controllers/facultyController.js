import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);

// Map module → table name + primary key
const MODULE_TABLES = {
  journals: {
    table: 'journal_publications',
    pk: 'journal_id',
    allowedFields: [
      'title', 'journal_name', 'author_position',
      'volume', 'publication_date', 'paper_link',
      'indexing_details', 'journal_quartile'
    ]
  },

  conferences: {
    table: 'conference_publications',
    pk: 'conference_id',
    allowedFields: ['title', 'conference_name', 'location', 'date']
  },

  books: {
    table: 'books',
    pk: 'book_id',
    allowedFields: ['title', 'publisher', 'isbn', 'year']
  }
};


// Helper to resolve module config
function getModule(req) {
  const module = req.params.module;
  return MODULE_TABLES[module];
}

export const facultyController = {

  // ➕ CREATE
  create: async (req, res) => {
  try {
    const config = getModule(req);
    if (!config) return res.status(400).json({ error: 'Invalid module' });

    const safeBody = filterAllowedFields(req.body, config.allowedFields);

    const { data, error } = await supabase
      .from(config.table)
      .insert([{
        ...safeBody,
        profile_id: req.user.id,
        status: 'PENDING'
      }])
      .select();

    if (error) throw error;

    res.status(201).json(data[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
},


  // 📄 LIST (Admin = all, Faculty = own)
  getAll: async (req, res) => {
    try {
      const config = getModule(req);
      if (!config) return res.status(400).json({ error: 'Invalid module' });

      let query = supabase
        .from(config.table)
        .select('*');

      if (req.user.role !== 'ADMIN') {
        query = query.eq('profile_id', req.user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      res.json(data || []);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // 🔍 GET SINGLE
  getOne: async (req, res) => {
    try {
      const { id } = req.params;
      const config = getModule(req);
      if (!config) return res.status(400).json({ error: 'Invalid module' });

      const { data, error } = await supabase
        .from(config.table)
        .select('*')
        .eq(config.pk, id)
        .single();

      if (!data) return res.status(404).json({ error: 'Not found' });
      if (error) throw error;

      res.json(data);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // ✏️ UPDATE
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const config = getModule(req);
      if (!config) return res.status(400).json({ error: 'Invalid module' });

      // Check ownership
      const { data: existing } = await supabase
        .from(config.table)
        .select()
        .eq(config.pk, id)
        .single();

      if (!existing) return res.status(404).json({ error: 'Not found' });

      const isOwner = existing.profile_id === req.user.id;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Faculty restrictions
      if (!isAdmin) {
        if (existing.status !== 'PENDING') {
          return res.status(403).json({ error: 'Cannot edit approved record' });
        }
        delete updates.status;
        delete updates.remarks;
      }

      const { data, error } = await supabase
        .from(config.table)
        .update(updates)
        .eq(config.pk, id)
        .select();

      if (error) throw error;

      res.json(data[0]);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // ❌ DELETE
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const config = getModule(req);
      if (!config) return res.status(400).json({ error: 'Invalid module' });

      let query = supabase
        .from(config.table)
        .delete()
        .eq(config.pk, id);

      if (req.user.role !== 'ADMIN') {
        query = query.eq('profile_id', req.user.id);
      }

      const { error } = await query;
      if (error) throw error;

      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // 📎 UPLOAD PROOF (stub for now)
  uploadProof: async (req, res) => {
    return res.json({ message: 'Proof upload endpoint working' });
  },

  // 🧠 DUPLICATE VALIDATION (stub logic)
  validateDuplicate: async (req, res) => {
    return res.json({
      duplicate: false,
      message: 'No duplicates found'
    });
  }
};
