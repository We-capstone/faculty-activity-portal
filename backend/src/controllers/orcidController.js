import { syncUserByOrcid } from "../services/syncService.js";

export const fetchOrcidData = async (req, res) => {
  const { orcidId } = req.params;

  try {
    const result = await syncUserByOrcid(orcidId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
