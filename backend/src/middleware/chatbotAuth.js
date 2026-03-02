import supabase from "../config/supabase.js";

export async function chatbotAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token)
      return res.status(401).json({ error: "No token provided" });

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user)
      return res.status(401).json({ error: "Invalid token" });

    const authUser = data.user;

    // Load profile context so chatbot access rules have reliable role/department values.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, department, full_name")
      .eq("id", authUser.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      return res.status(500).json({ error: "Failed to load profile context" });
    }

    req.user = {
      id: authUser.id,
      email: authUser.email,
      role: String(profile?.role || authUser.user_metadata?.role || "FACULTY").toUpperCase(),
      department: profile?.department || authUser.user_metadata?.department || null,
      full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email || "User"
    };
    next();

  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
