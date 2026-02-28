// controllers/journalController.js
import { createClient } from '@supabase/supabase-js';

// Use Service Role Key here to allow Admin overrides
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const journalController = {
  // CREATE
  create: async (req, res) => {
    try {
      const { title, journal_name, author_position, volume, publication_date, paper_link, indexing_details } = req.body;
      
      const { data, error } = await supabase
        .from('journal_publications')
        .insert([{
          profile_id: req.user.id,
          title,
          journal_name,
          author_position,
          volume,
          publication_date,
          paper_link,
          indexing_details
        }])
        .select();

      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // READ (All for Admin, Own for Faculty)
  getAll: async (req, res) => {
    try {
      // We explicitly tell Supabase to use 'profile_id' for the join
      let query = supabase
        .from('journal_publications')
        .select('*, profiles!profile_id(full_name)');

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

  // UPDATE
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // 1. Check if user is Admin or Owner
      const { data: existing } = await supabase
        .from('journal_publications')
        .select('profile_id')
        .eq('journal_id', id)
        .single();

      if (!existing) return res.status(404).json({ error: 'Not found' });

      const isOwner = existing.profile_id === req.user.id;
      const isAdmin = req.user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // 2. Restrict Faculty: Cannot escalate moderation fields
      if (!isAdmin) {
        delete updates.status; // Prevent role escalation
        delete updates.remarks;
      }

      const { data, error } = await supabase
        .from('journal_publications')
        .update(updates)
        .eq('journal_id', id)
        .select();

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
      const isAdmin = req.user.role === 'ADMIN';

      let query = supabase.from('journal_publications').delete().eq('journal_id', id);

      if (!isAdmin) {
        query = query.eq('profile_id', req.user.id);
      }

      const { error } = await query;
      if (error) throw error;
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};
