import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TABLE_MAP = {
  journals: 'journal_publications',
  conferences: 'conference_publications',
  patents: 'patents',
  research_funding: 'research_funding'
};

const ACHIEVEMENT_MODULES = [
  {
    key: 'journals',
    table: 'journal_publications',
    select: 'journal_id, title, journal_name, publication_date, status'
  },
  {
    key: 'conferences',
    table: 'conference_publications',
    select: 'conference_id, title, conference_name, conference_date, status'
  },
  {
    key: 'patents',
    table: 'patents',
    select: 'patent_id, patent_title, application_no, patent_status, filed_date, status'
  },
  {
    key: 'funding',
    table: 'research_funding',
    select: 'funding_id, project_title, funding_agency, amount, start_date, end_date, status'
  }
];

const normalizeName = (value) => (value || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();

const pickBestFacultyMatch = (profiles, inputName) => {
  if (!Array.isArray(profiles) || profiles.length === 0) return null;
  const normalizedInput = normalizeName(inputName);

  const exactMatch = profiles.find((profile) => normalizeName(profile?.full_name) === normalizedInput);
  if (exactMatch) return exactMatch;

  return profiles[0];
};

export const searchFacultyAchievements = async (req, res) => {
  try {
    const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
    if (!name) {
      return res.status(400).json({ error: 'Faculty name is required', code: 'NAME_REQUIRED' });
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, department, role')
      .ilike('full_name', `%${name}%`);

    if (profileError) throw profileError;

    const facultyProfiles = (profiles || []).filter((profile) => (profile?.role || '').toString().trim().toUpperCase() !== 'ADMIN');
    const selectedProfile = pickBestFacultyMatch(facultyProfiles, name);

    if (!selectedProfile) {
      return res.status(404).json({
        error: `No faculty found for "${name}".`,
        code: 'FACULTY_NOT_FOUND'
      });
    }

    console.log('[searchFacultyAchievements] matched faculty:', {
      id: selectedProfile.id,
      full_name: selectedProfile.full_name,
      department: selectedProfile.department
    });

    const moduleEntries = await Promise.all(
      ACHIEVEMENT_MODULES.map(async (moduleConfig) => {
        const { data, error } = await supabase
          .from(moduleConfig.table)
          .select(moduleConfig.select)
          .eq('profile_id', selectedProfile.id)
          .order('created_at', { ascending: false });

        if (error) throw new Error(error.message || `Failed to fetch ${moduleConfig.key}`);
        return [moduleConfig.key, data || []];
      })
    );

    const achievements = Object.fromEntries(moduleEntries);
    const counts = {
      journals: achievements.journals.length,
      conferences: achievements.conferences.length,
      patents: achievements.patents.length,
      funding: achievements.funding.length
    };
    const total = counts.journals + counts.conferences + counts.patents + counts.funding;

    if (total === 0) {
      return res.status(404).json({
        error: `No achievements found for "${selectedProfile.full_name || name}".`,
        code: 'NO_ACHIEVEMENTS'
      });
    }

    return res.status(200).json({
      profile: {
        id: selectedProfile.id,
        full_name: selectedProfile.full_name || 'Unknown',
        department: selectedProfile.department || 'Unassigned'
      },
      achievements,
      counts,
      total
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unable to fetch faculty achievements' });
  }
};

export const getApprovals = async (req, res) => {
  try {
    const { module, status = 'PENDING', search } = req.query;

    // Force relationship to use 'profile_id' to avoid the "more than one relationship" error
    const selectQuery = `*, profiles!profile_id(full_name, department)`;

    // Build filter conditions
    const filters = {};
    if (status) filters.status = status;
    
    // 1. If a specific module (e.g., journals) is requested
    if (module) {
      const tableName = TABLE_MAP[module];
      if (!tableName) return res.status(400).json({ error: 'Invalid module name' });

      let query = supabase
        .from(tableName)
        .select(selectQuery)
        .eq('status', status)
        .order('created_at', { ascending: false });

      // Add search filter for faculty name
      if (search) {
        // Use ilike for case-insensitive search on profile's full_name
        query = query.ilike('profiles.full_name', `%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return res.status(200).json(data);
    }

    // 2. If no module is specified, fetch items across all tables
    const modules = Object.keys(TABLE_MAP);
    const results = await Promise.all(
      modules.map(async (key) => {
        let query = supabase
          .from(TABLE_MAP[key])
          .select(selectQuery)
          .eq('status', status);

        // Add search filter for faculty name
        if (search) {
          query = query.ilike('profiles.full_name', `%${search}%`);
        }

        const { data, error } = await query;
        
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
