import supabase from '../config/supabase.js';

export const getResearchStats = async (req, res) => {
    try {
        const { role, id } = req.user;
        // FIXED: Changed 'patent' to 'patents' to match your DB table name
        const tables = ['journal_publications', 'conference_publications', 'patents', 'research_funding'];
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('department')
            .eq('id', id)
            .single();

        const targetDept = role === 'ADMIN' ? null : profile?.department;

        const statsPromises = tables.map(async (table) => {
            // Mapping specific IDs based on your schema
            const idCol = table === 'research_funding' ? 'funding_id' : 
                          table === 'journal_publications' ? 'journal_id' :
                          table === 'conference_publications' ? 'conference_id' : 
                          'patent_id';

            let query = supabase
                .from(table)
                .select(`${idCol}, created_at, profiles:profile_id!inner(department)`);
            
            if (targetDept) {
                query = query.eq('profiles.department', targetDept);
            }

            const { data, error } = await query;
            if (error) console.error(`Error in ${table}:`, error.message);
            
            return { table, data: data || [] };
        });

        const results = await Promise.all(statsPromises);
        const processedData = processResearchData(results);

        res.json({
            ...processedData,
            userContext: { role, scope: targetDept || 'Institutional (All Departments)' }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const processResearchData = (results) => {
    const yearlyGrowth = {}; 
    const deptVolume = {};   
    const heatmapData = [];
    results.forEach(({ table, data }) => {
        data.forEach(item => {
            const year = item.created_at ? new Date(item.created_at).getFullYear() : 2026;
            const dept = item.profiles?.department || 'Unassigned';

            // Category Mapping: Simplified to match your specific frontend keys
            let key;
            if (table === 'journal_publications') key = 'journals';
            else if (table === 'conference_publications') key = 'conferences';
            else if (table === 'patents') key = 'patents';
            else if (table === 'research_funding') key = 'funding';

            if (!yearlyGrowth[year]) {
                yearlyGrowth[year] = { year, journals: 0, conferences: 0, patents: 0, funding: 0, total: 0 };
            }
            if (key) {
                yearlyGrowth[year][key]++;
                yearlyGrowth[year].total++;
            }

            if (!deptVolume[dept]) {
                deptVolume[dept] = { department: dept, journals: 0, conferences: 0, patents: 0, funding: 0, total: 0 };
            }
            if (key) {
                deptVolume[dept][key]++;
                deptVolume[dept].total++;
            }

            let cell = heatmapData.find(d => d.dept === dept && d.year === year);
            if (!cell) {
                cell = { dept, year, count: 0 };
                heatmapData.push(cell);
            }
            cell.count++;
        });

        
        
    });

    return {
        yearlyGrowth: Object.values(yearlyGrowth).sort((a, b) => a.year - b.year),
        deptVolume: Object.values(deptVolume).sort((a, b) => b.total - a.total),
        heatmapData
    };
};