// // Ensure these match your actual Supabase settings
const SUPABASE_URL = "https://jfnbgnqmdxyfykrklphq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbmJnbnFtZHh5ZnlrcmtscGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQwMTAsImV4cCI6MjA4NTM0MDAxMH0.D4f5fiMkSKRGKiP1bYvZiOtuJp9yivxSj5sUT2A66fw";
const BACKEND_URL = "http://localhost:5000/api"; // Points to base API

// Initialize Supabase with persistence enabled (default)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("✅ Supabase initialized");

// --- SESSION MANAGEMENT ---

// Check session on load to keep user logged in
window.addEventListener('load', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        console.log("Session restored for:", session.user.email);
        renderUI(session.user);
        fetchJournals();
    }
});

// Listen for Auth changes
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        renderUI(session.user);
        fetchJournals();
    }
    if (event === 'SIGNED_OUT') {
        location.reload(); 
    }
});

// Unified UI Handler
function renderUI(user) {
    const role = user.user_metadata.role;
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('journal-section').classList.remove('hidden');
    document.getElementById('user-display').innerText = `${user.email} (${role})`;

    // Show Admin Section ONLY if role is ADMIN
    const adminSection = document.getElementById('admin-section');
    if (adminSection) {
        if (role === 'ADMIN') adminSection.classList.remove('hidden');
        else adminSection.classList.add('hidden');
    }
}

// --- AUTH ACTIONS ---

async function handleSignUp() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const full_name = document.getElementById('full_name').value;
    const department = document.getElementById('department').value;
    const role = document.getElementById('role').value;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name, department, role } }
    });

    if (error) alert("Signup Failed: " + error.message);
    else console.log("🔑 Signup JWT Token:", data.session.access_token);
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return alert("Login Error: " + error.message);
    
    console.log("🔑 Signup JWT Token:", data.session.access_token);
    console.log("✅ Login Success");
}

async function handleLogout() {
    await supabase.auth.signOut();
}

// --- JOURNAL ACTIONS ---

async function getHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`
    };
}

async function createJournal() {
    const journalData = {
        title: document.getElementById('title').value,
        journal_name: document.getElementById('journal_name').value,
        indexing_details: document.getElementById('indexing_details').value
    };

    const response = await fetch(`${BACKEND_URL}/journals`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(journalData)
    });

    if (response.ok) {
        alert("Journal Submitted!");
        fetchJournals();
    } else {
        const err = await response.json();
        alert("Error: " + err.error);
    }
}

async function fetchJournals() {
    const response = await fetch(`${BACKEND_URL}/journals`, {
        headers: await getHeaders()
    });
    
    const data = await response.json();
    const listDiv = document.getElementById('journal-list');

    if (!Array.isArray(data)) {
        listDiv.innerHTML = `<p style="color:red">No records found or error occurred.</p>`;
        return;
    }

    listDiv.innerHTML = data.map(j => `
        <div class="journal-card">
            <div>
                <strong>${j.title}</strong><br>
                <small>${j.journal_name} | ID: ${j.journal_id}</small>
            </div>
            <div>
                <span class="status" style="color: ${j.status === 'APPROVED' ? 'green' : 'orange'}">${j.status}</span>
                <button onclick="deleteJournal('${j.journal_id}')" style="background:#6b7280; padding: 2px 5px; margin-left:10px;">Delete</button>
            </div>
        </div>
    `).join('');
}

// --- ADMIN ACTION ---

async function updateStatus() {
    const id = document.getElementById('target-id').value.trim();
    const action = document.getElementById('admin-action').value;
    const remarks = document.getElementById('admin-remarks').value;

    const response = await fetch(`${BACKEND_URL}/admin/journals/${id}/status`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify({ action, remarks })
    });

    if (response.ok) {
        alert("Status Updated Successfully!");
        fetchJournals();
    } else {
        const err = await response.json();
        alert("Error: " + err.error);
    }
}

// --- EXPOSE TO WINDOW ---
window.handleSignUp = handleSignUp;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.createJournal = createJournal;
window.fetchJournals = fetchJournals;
window.updateStatus = updateStatus;