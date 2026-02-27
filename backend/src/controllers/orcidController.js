import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const fetchOrcidData = async (req, res) => {
  const { orcidId } = req.params;

  try {
    const response = await fetch(
      `https://pub.orcid.org/v3.0/${orcidId}/works`,
      { headers: { Accept: "application/json" } }
    );

    const data = await response.json();
    const works = data.group || [];
    const publicationsCount = works.length;

    // Update profile
    await supabase
      .from("profiles")
      .update({
        publications_count: publicationsCount,
        last_orcid_sync: new Date(),
      })
      .eq("orcid_id", orcidId);

    res.json({ publicationsCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ORCID data" });
  }
};
