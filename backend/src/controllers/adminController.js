import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TABLE_MAP = {
  journals: 'journal_publications',
  conferences: 'conference_publications',
  patents: 'patents',
  research_funding: 'research_funding'
};

export const getApprovals = async (req, res) => {
  try {
    const { module, status = 'PENDING' } = req.query;

    // Force relationship to use 'profile_id' to avoid the "more than one relationship" error
    const selectQuery = `*, profiles!profile_id(full_name, department)`;

    // 1. If a specific module (e.g., journals) is requested
    if (module) {
      const tableName = TABLE_MAP[module];
      if (!tableName) return res.status(400).json({ error: 'Invalid module name' });

      const { data, error } = await supabase
        .from(tableName)
        .select(selectQuery)
        .eq('status', status) // Filter by status (defaults to PENDING)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    }

    // 2. If no module is specified, fetch items across all tables
    const modules = Object.keys(TABLE_MAP);
    const results = await Promise.all(
      modules.map(async (key) => {
        const { data, error } = await supabase
          .from(TABLE_MAP[key])
          .select(selectQuery)
          .eq('status', status);
          
        if (error) console.error(`Error fetching ${key}:`, error.message);
        
        return { 
          module: key, 
          count: data?.length || 0, 
          entries: data || [] 
        };
      })
    );

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const handleStatusUpdate = async (req, res) => {
    try {
        const { module, id } = req.params; 
        const { action, remarks } = req.body; 
        console.log("Current User Role in Code:", req.user.role);
        const tableName = TABLE_MAP[module];
        if (!tableName) {
            console.error("❌ Invalid Module Name Mapping");
            return res.status(400).json({ error: "Invalid module name" });
        }

        const pkMapping = {
            journals: 'journal_id',
            conferences: 'conference_id',
            patents: 'patent_id',
            research_funding: 'funding_id'
        };

        const pkName = pkMapping[module];
        console.log(`Executing: UPDATE ${tableName} SET status = ${action} WHERE ${pkName} = ${id}`);

        const { data, error } = await supabase
              .from(tableName)
              .update({
                  status: action,
                  remarks: remarks || null,
                  approved_by: req.user.id,
                  approved_at: new Date().toISOString()
              })
              .eq(pkName, id.trim()) // Clean the ID
              .select();

        if (error) {
              // If this triggers, it's likely a Foreign Key error (Admin not in profiles table)
              console.error("❌ DATABASE REJECTED UPDATE:", error.message);
              return res.status(400).json({ error: error.message });
        }

        if (!data || data.length === 0) {
            console.warn("⚠️ Query returned empty. Possible reasons: Wrong ID, or RLS Policy blocking the Admin.");
            return res.status(404).json({ error: "Record not found" });
        }

        console.log("✅ Update Successful:", data[0]);
        res.status(200).json({
            message: `Entry has been ${action.toLowerCase()} successfully`,
            data: data[0]
        });

    } catch (err) {
        console.error("🔥 Server Catch Error:", err.message);
        res.status(500).json({ error: err.message });
    }
};