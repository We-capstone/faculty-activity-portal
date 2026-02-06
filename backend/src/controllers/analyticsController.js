
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
// --- FACULTY ANALYTICS ---
export const getFacultyStats = async (req, res) => {
    try {
        const profileId = req.user.id;

        // 1. Career Totals (for Metric Cards)
        const { data: career } = await supabase
            .from('faculty_career_score')
            .select('*')
            .eq('profile_id', profileId)
            .single();

        // 2. Yearly Breakdown (for Trend & Mix Charts)
        const { data: annual } = await supabase
            .from('faculty_annual_score')
            .select('*')
            .eq('profile_id', profileId)
            .order('year', { ascending: true });

        // 3. Current Year Detail (for Cap Progress Bars)
        const currentYear = new Date().getFullYear();
        const { data: currentYearData } = await supabase
            .from('faculty_annual_score')
            .select('journal_score, conference_score')
            .eq('profile_id', profileId)
            .eq('year', currentYear)
            .single();

        res.json({ career, annual, currentYear: currentYearData || { journal_score: 0, conference_score: 0 } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- ADMIN ANALYTICS ---
// --- ADMIN ANALYTICS ---
export const getAdminStats = async (req, res) => {
    try {
        // 1. Fetch scores from the view
        const { data: scores, error: scoreErr } = await supabase
            .from('faculty_career_score')
            .select('*')
            .order('career_score', { ascending: false });

        // 2. Fetch all profiles
        const { data: profiles, error: profErr } = await supabase
            .from('profiles')
            .select('id, full_name, department');

        if (scoreErr || profErr) throw scoreErr || profErr;

        // 3. Merge data in Node.js
        const rawData = scores.map(score => {
            const profile = profiles.find(p => p.id === score.profile_id);
            return {
                ...score,
                profiles: profile || { full_name: 'Unknown', department: 'Unassigned' }
            };
        });

        // 4. Group by Department (Same as before)
        const departmentMap = rawData.reduce((acc, curr) => {
            const deptName = curr.profiles.department || "Unassigned";
            acc[deptName] = (acc[deptName] || 0) + parseFloat(curr.career_score);
            return acc;
        }, {});

        const departmentLeaderboard = Object.keys(departmentMap).map(dept => ({
            department: dept,
            total_score: parseFloat(departmentMap[dept].toFixed(2))
        }));

        // 5. Global Status Funnel (Keep your existing logic)
        const tables = ['journal_publications', 'conference_publications', 'patents', 'research_funding'];
        const statusCounts = { APPROVED: 0, PENDING: 0, REJECTED: 0 };
        for (const table of tables) {
            const { data } = await supabase.from(table).select('status');
            data?.forEach(row => { if (statusCounts[row.status] !== undefined) statusCounts[row.status]++; });
        }

        res.json({ departmentLeaderboard, individualLeaderboard: rawData, statusCounts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};