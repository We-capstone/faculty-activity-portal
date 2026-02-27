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
const BACKEND_URL = "http://localhost:5000/api";


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

  const role = data.session.user.user_metadata?.role;
  if (role !== "FACULTY") {
    alert("Access denied");
    window.location.href = "../index.html";
    return;
  }

  // ✅ NOW LOAD REPORT AFTER AUTH PASSES
  loadReport();
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
async function loadReport() {
  const res = await fetch(`${BACKEND_URL}/analytics/faculty/stats`, {
    headers: await headers()
  });

  const data = await res.json();

  if (!data || !data.annual) return;

  renderCareer(data.career);
  renderCharts(data.annual, data.currentYear);
}

function renderCareer(career) {
  const box = document.getElementById("careerBox");

  box.innerHTML = `
    <p><strong>Total Career Score:</strong> ${career.career_score}</p>
    <p><strong>Active Years:</strong> ${career.active_years}</p>
    <p><strong>Average Score / Year:</strong> ${career.avg_score_per_year}</p>
  `;
}

function renderCharts(annual, currentYear) {

  const years = annual.map(a => a.year);
  const totals = annual.map(a => a.total_score);

  // Line Chart
  new Chart(document.getElementById("annualChart"), {
    type: "line",
    data: {
      labels: years,
      datasets: [{
        label: "Total Score",
        data: totals,
        borderWidth: 2,
        tension: 0.4
      }]
    }
  });

  // Doughnut Chart
  new Chart(document.getElementById("mixChart"), {
    type: "doughnut",
    data: {
      labels: ["Journals", "Conferences"],
      datasets: [{
        data: [
          currentYear.journal_score,
          currentYear.conference_score
        ]
      }]
    }
  });
}

// Expose
window.logout = logout;
window.headers = headers;
