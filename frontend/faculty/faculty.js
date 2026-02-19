// ================================
// SUPABASE CONFIG (SAME AS app.js)
// ================================
const SUPABASE_URL =
  "https://jfnbgnqmdxyfykrklphq.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbmJnbnFtZHh5ZnlrcmtscGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQwMTAsImV4cCI6MjA4NTM0MDAxMH0.D4f5fiMkSKRGKiP1bYvZiOtuJp9yivxSj5sUT2A66fw";

// Create Supabase client AGAIN (important)
const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ================================
// AUTH GUARD (CORRECT WAY)
// ================================
window.addEventListener("load", async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    alert("Please login first");
    window.location.href = "../index.html";
    return;
  }

  // Optional safety check: role must be FACULTY
  const role = data.session.user.user_metadata?.role;
  if (role !== "FACULTY") {
    alert("Access denied");
    window.location.href = "../index.html";
  }
});

// ================================
// LOGOUT (SYNCED)
// ================================
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "../index.html";
}

// ================================
// AUTH HEADERS FOR API CALLS
// ================================
async function headers() {
  const { data } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.session.access_token}`
  };
}

// Expose
window.logout = logout;
window.headers = headers;
