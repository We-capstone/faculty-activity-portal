if (typeof window !== "undefined") {

  // ================================
  // SUPABASE CONFIG
  // ================================
  const SUPABASE_URL =
    "https://jfnbgnqmdxyfykrklphq.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbmJnbnFtZHh5ZnlrcmtscGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQwMTAsImV4cCI6MjA4NTM0MDAxMH0.D4f5fiMkSKRGKiP1bYvZiOtuJp9yivxSj5sUT2A66fw";

  const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  // ================================
  // SESSION RESTORE (NO REDIRECT)
  // ================================
  window.addEventListener("load", async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const user = data.session.user;
      const role = user.user_metadata?.role;

      document.getElementById("auth-section").classList.add("hidden");
      document.getElementById("journal-section").classList.remove("hidden");
      document.getElementById("user-display").innerText =
        `${user.email} (${role})`;

      if (role === "FACULTY") {
        document.getElementById("faculty-btn").classList.remove("hidden");
      }
    }
  });

  // ================================
  // UI RENDER
  // ================================
  function renderUI(user) {
    const role = user.user_metadata?.role;

    document.getElementById("auth-section").classList.add("hidden");
    document.getElementById("journal-section").classList.remove("hidden");
    document.getElementById("user-display").innerText =
      `${user.email} (${role})`;

    const facultyBtn = document.getElementById("faculty-btn");

    if (role === "FACULTY") {
      facultyBtn.classList.remove("hidden");
    } else {
      facultyBtn.classList.add("hidden");
    }
  }

  // ================================
  // LOGIN
  // ================================
  async function handleLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } =
      await supabase.auth.signInWithPassword({ email, password });

    if (error) return alert(error.message);

    renderUI(data.user);

    // ✅ REDIRECT ONLY AFTER LOGIN
    if (data.user.user_metadata.role === "FACULTY") {
      window.location.href = "./faculty/dashboard.html";
    }
  }

  // ================================
  // SIGNUP
  // ================================
  async function handleSignUp() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const full_name = document.getElementById("full_name").value;
    const department = document.getElementById("department").value;
    const role = document.getElementById("role").value;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, department, role }
      }
    });

    if (error) return alert(error.message);

    // Auto-login
    const login = await supabase.auth.signInWithPassword({
      email,
      password
    });

    renderUI(login.data.user);

    if (role === "FACULTY") {
      window.location.href = "./faculty/dashboard.html";
    }
  }

  // ================================
  // LOGOUT
  // ================================
  async function handleLogout() {
    await supabase.auth.signOut();
    location.reload();
  }

  // ================================
  // FACULTY BUTTON
  // ================================
  function goToFaculty() {
    window.location.href = "./faculty/dashboard.html";
  }

  // ================================
  // EXPOSE
  // ================================
  window.handleLogin = handleLogin;
  window.handleSignUp = handleSignUp;
  window.handleLogout = handleLogout;
  window.goToFaculty = goToFaculty;
}
