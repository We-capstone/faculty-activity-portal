import { syncUserByOrcid } from "../services/syncService.js";

router.post("/", async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("orcid_id")
      .eq("id", userId)
      .single();

    const result = await syncUserByOrcid(profile.orcid_id);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
