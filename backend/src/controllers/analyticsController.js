import supabase from '../config/supabase.js';

export const getResearchStats = async (req, res) => {
    try {
        const { role, id } = req.user;
        
        // Get faculty profile to determine department
        const { data: profile } = await supabase
            .from('profiles')
            .select('department, full_name')
            .eq('id', id)
            .single();

        const targetDept = role === 'ADMIN' ? null : profile?.department;

        // Tables to query
        const tables = ['journal_publications', 'conference_publications', 'patents', 'research_funding'];
        
        // For faculty: get their specific data
        let facultyFilter = role !== 'ADMIN' ? id : null;

        const statsPromises = tables.map(async (table) => {
            // Mapping specific IDs based on your schema
            const idCol = table === 'research_funding' ? 'funding_id' : 
                          table === 'journal_publications' ? 'journal_id' :
                          table === 'conference_publications' ? 'conference_id' : 
                          'patent_id';

            let query = supabase
                .from(table)
                .select(`${idCol}, created_at, status, profile_id, profiles:profile_id!inner(department, full_name)`);
            
            // Filter by department for faculty
            if (targetDept) {
                query = query.eq('profiles.department', targetDept);
            }
            
            // Filter by faculty ID for non-admin users
            if (facultyFilter) {
                query = query.eq('profile_id', facultyFilter);
            }

            const { data, error } = await query;
            if (error) console.error(`Error in ${table}:`, error.message);
            
            return { table, data: data || [] };
        });

        const results = await Promise.all(statsPromises);
        
        // Get profiles for admin
        let allProfiles = [];
        if (role === 'ADMIN') {
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('id, full_name, department, role')
                .eq('role', 'FACULTY');
            allProfiles = profilesData || [];
        }

        const processedData = processResearchData(results, role, profile, allProfiles);

        res.json({
            ...processedData,
            userContext: { role, scope: targetDept || 'Institutional (All Departments)' }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const processResearchData = (results, role, profile, allProfiles) => {
    const yearlyGrowth = {}; 
    const deptVolume = {};   
    const heatmapData = [];
    const annualData = {}; // For faculty performance report
    
    let totalScore = 0;
    let approvedCount = 0;
    
    // For status counts (admin)
    const statusCounts = {
        APPROVED: 0,
        PENDING: 0,
        REJECTED: 0
    };
    
    // For individual leaderboard (admin)
    const facultyScores = {};

    results.forEach(({ table, data }) => {
        data.forEach(item => {
            const year = item.created_at ? new Date(item.created_at).getFullYear() : new Date().getFullYear();
            const dept = item.profiles?.department || 'Unassigned';
            const isApproved = item.status === 'APPROVED';
            const isPending = item.status === 'PENDING';
            const isRejected = item.status === 'REJECTED';
            const profileId = item.profile_id;

            // Category Mapping
            let key;
            let score = 0;
            if (table === 'journal_publications') { 
                key = 'journals'; 
                score = isApproved ? 10 : 2;
            }
            else if (table === 'conference_publications') { 
                key = 'conferences'; 
                score = isApproved ? 5 : 1;
            }
            else if (table === 'patents') { 
                key = 'patents'; 
                score = isApproved ? 15 : 3;
            }
            else if (table === 'research_funding') { 
                key = 'funding'; 
                score = isApproved ? 20 : 4;
            }

            // Status counts
            if (isApproved) statusCounts.APPROVED++;
            if (isPending) statusCounts.PENDING++;
            if (isRejected) statusCounts.REJECTED++;

            // Faculty leaderboard scores (approved only)
            if (isApproved && profileId) {
                if (!facultyScores[profileId]) {
                    facultyScores[profileId] = {
                        profile_id: profileId,
                        full_name: item.profiles?.full_name || 'Unknown',
                        department: dept,
                        score: 0,
                        count: 0
                    };
                }
                facultyScores[profileId].score += score;
                facultyScores[profileId].count++;
            }

            // Yearly growth (for admin analytics)
            if (!yearlyGrowth[year]) {
                yearlyGrowth[year] = { year, journals: 0, conferences: 0, patents: 0, funding: 0, total: 0 };
            }
            if (key) {
                yearlyGrowth[year][key]++;
                yearlyGrowth[year].total++;
            }

            // Annual data (for faculty performance report)
            if (!annualData[year]) {
                annualData[year] = { year: year, journal_score: 0, conference_score: 0, total_score: 0 };
            }
            if (table === 'journal_publications' && isApproved) {
                annualData[year].journal_score += 10;
                annualData[year].total_score += 10;
                totalScore += 10;
            }
            if (table === 'conference_publications' && isApproved) {
                annualData[year].conference_score += 5;
                annualData[year].total_score += 5;
                totalScore += 5;
            }
            if (isApproved) approvedCount++;

            // Department volume
            if (!deptVolume[dept]) {
                deptVolume[dept] = { department: dept, journals: 0, conferences: 0, patents: 0, funding: 0, total: 0 };
            }
            if (key) {
                deptVolume[dept][key]++;
                deptVolume[dept].total++;
            }

            // Heatmap data
            let cell = heatmapData.find(d => d.dept === dept && d.year === year);
            if (!cell) {
                cell = { dept, year, count: 0 };
                heatmapData.push(cell);
            }
            cell.count++;
        });
    });

    // Calculate career score for faculty (approved activities only)
    const career_score = role !== 'ADMIN' ? totalScore : 0;

    // Get individual leaderboard sorted by score
    const individualLeaderboard = Object.values(facultyScores)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Top 10

    return {
        yearlyGrowth: Object.values(yearlyGrowth).sort((a, b) => a.year - b.year),
        deptVolume: Object.values(deptVolume).sort((a, b) => b.total - a.total),
        heatmapData,
        statusCounts,
        individualLeaderboard,
        // New format for faculty performance report
        career: {
            career_score: career_score,
            approved_count: approvedCount,
            department: profile?.department || 'N/A',
            name: profile?.full_name || 'Faculty'
        },
        annual: Object.values(annualData).sort((a, b) => a.year - b.year)
    };
};
