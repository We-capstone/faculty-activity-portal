import supabase from "../config/supabase.js";

export async function chatbotAuth(req, res, next) {
  try {

    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError) throw userError;

    const userId = userData.user.id;

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("id, role, department")
        .eq("id", userId)
        .single();

    if (profileError) throw profileError;

    req.user = profile;

    next();

  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
}