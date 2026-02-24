import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Keep only expected keys and ignore undefined/empty values
function filterAllowedFields(payload = {}, allowedFields = []) {
  const safe = {};
  for (const key of allowedFields) {
    const value = payload[key];
    if (value === undefined || value === null || value === '') continue;
    safe[key] = value;
  }
  return safe;
}

// Map module -> table name + primary key
const MODULE_TABLES = {
  journals: {
    table: 'journal_publications',
    pk: 'journal_id',
    allowedFields: [
      'title',
      'journal_name',
      'author_position',
      'volume',
      'publication_date',
      'paper_link',
      'indexing_details',
      'journal_quartile'
    ]
  },
  conferences: {
    table: 'conference_publications',
    pk: 'conference_id',
    allowedFields: ['title', 'conference_name', 'proceedings_details', 'conference_date']
  },
  patents: {
    table: 'patents',
    pk: 'patent_id',
    allowedFields: ['title', 'patent_number', 'year', 'description']
  },
  'research-funding': {
    table: 'research_funding',
    pk: 'funding_id',
    allowedFields: ['title', 'funding_agency', 'year', 'description']
  },
 };

// Helper to resolve module config
function getModule(req) {
  return MODULE_TABLES[req.params.module];
}

export const facultyController = {
  // CREATE
  create: async (req, res) => {
    try {
      const config = getModule(req);
      if (!config) return res.status(400).json({ error: 'Invalid module' });

      const safeBody = filterAllowedFields(req.body, config.allowedFields);

      const { data, error } = await supabase
        .from(config.table)
        .insert([
          {
            ...safeBody,
            profile_id: req.user.id,
            status: 'PENDING'
          }
        ])
        .select();

      if (error) throw error;

      res.status(201).json(data[0]);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // LIST (Admin = all, Faculty = own)
  getAll: async (req, res) => {
    try {
      const config = getModule(req);
      if (!config) return res.status(400).json({ error: 'Invalid module' });

      let query = supabase.from(config.table).select('*');

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

  // GET SINGLE
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

  // UPDATE
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const config = getModule(req);
      if (!config) return res.status(400).json({ error: 'Invalid module' });

      // Check ownership
      const { data: existing } = await supabase.from(config.table).select().eq(config.pk, id).single();

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

      const { data, error } = await supabase.from(config.table).update(updates).eq(config.pk, id).select();

      if (error) throw error;

      res.json(data[0]);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // DELETE
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const config = getModule(req);
      if (!config) return res.status(400).json({ error: 'Invalid module' });

      let query = supabase.from(config.table).delete().eq(config.pk, id);

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

  // UPLOAD PROOF (stub for now)
  uploadProof: async (req, res) => {
  try {
    const { module, id } = req.params;
    const config = MODULE_TABLES[module];

    if (!config) return res.status(400).json({ error: 'Invalid module' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Verify record exists + ownership
    const { data: existing, error: fetchError } = await supabase
      .from(config.table)
      .select('*')
      .eq(config.pk, id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Record not found' });
    }

    if (existing.profile_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Generate unique file path
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${req.user.id}/${module}/${id}-${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('proofs')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Save path in DB
    const { data, error: updateError } = await supabase
      .from(config.table)
      .update({ proof_path: fileName })
      .eq(config.pk, id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create signed URL (secure)
    const { data: urlData } = await supabase.storage
      .from('proofs')
      .createSignedUrl(fileName, 60 * 60); // 1 hour

    res.json({
      message: 'Proof uploaded',
      proof_url: urlData?.signedUrl,
      record: data
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
},

// GET PROOF
getProof: async (req, res) => {
  try {
    const { id } = req.params;
    const config = getModule(req);
    if (!config) return res.status(400).json({ error: 'Invalid module' });

    // Fetch record
    const { data, error } = await supabase
      .from(config.table)
      .select('proof_path, profile_id')
      .eq(config.pk, id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Access control
    const isOwner = data.profile_id === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!data.proof_path) {
      return res.status(404).json({ error: 'No proof uploaded' });
    }

    // Generate signed URL
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('proofs') // ← your bucket name
      .createSignedUrl(data.proof_path, 60 * 5); // 5 minutes

    if (urlError) throw urlError;

    res.json({ url: signedUrlData.signedUrl });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
},



  // DUPLICATE VALIDATION (stub logic)
  validateDuplicate: async (req, res) => {
    return res.json({
      duplicate: false,
      message: 'No duplicates found'
    });
  }
};
