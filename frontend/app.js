// Ensure these match your actual Supabase settings
const SUPABASE_URL = "https://jfnbgnqmdxyfykrklphq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmbmJnbnFtZHh5ZnlrcmtscGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NjQwMTAsImV4cCI6MjA4NTM0MDAxMH0.D4f5fiMkSKRGKiP1bYvZiOtuJp9yivxSj5sUT2A66fw";
const BACKEND_URL = "http://localhost:5000/api/journals";

console.log("✅ app.js loaded and Supabase initialized");

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function handleSignUp() {
    console.log("🚀 Signup button clicked");

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const full_name = document.getElementById('full_name').value;
    const department = document.getElementById('department').value;
    const role = document.getElementById('role').value; // Should be 'FACULTY' or 'ADMIN'

    console.log("Attempting signup for:", email);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { 
                full_name: full_name,
                department: department,
                role: role // Ensure this is UPPERCASE to match your Postgres ENUM
            }
        }
    });

    if (error) {
        console.error("Signup Error:", error.message);
        alert("Signup Failed: " + error.message);
    } else {
        console.log("Signup Success:", data);
        alert("Signup successful! Please check your email for a confirmation link.");
        // Note: If email confirmation is ON, you cannot login until you click the link.
    }
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return alert("Login Error: " + error.message);
    
    setupUI(data.user);
    fetchJournals();
}

function setupUI(user) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('journal-section').classList.remove('hidden');
    document.getElementById('user-display').innerText = `${user.email} (${user.user_metadata.role})`;
}

async function handleLogout() {
    await supabase.auth.signOut();
    location.reload();
}

// 3. Journal CRUD Logic (Calling your Node.js Backend)
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

    const response = await fetch(BACKEND_URL, {
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
    const response = await fetch(BACKEND_URL, {
        headers: await getHeaders()
    });
    
    const data = await response.json();
    console.log("Fetched Data:", data); // Check the console to see what you actually got!

    const listDiv = document.getElementById('journal-list');

    // CHECK: If data is an error object instead of an array
    if (!Array.isArray(data)) {
        listDiv.innerHTML = `<p style="color:red">Error: ${data.error || 'Failed to load journals'}</p>`;
        return;
    }

    // Now it's safe to map
    listDiv.innerHTML = data.map(j => `
        <div class="journal-card">
            <div>
                <strong>${j.title}</strong><br>
                <small>${j.journal_name} | ${j.indexing_details}</small>
            </div>
            <div>
                <span class="status">${j.status}</span>
                <button onclick="deleteJournal('${j.journal_id}')" style="background:#6b7280; padding: 2px 5px; margin-left:10px;">Delete</button>
            </div>
        </div>
    `).join('');
}

async function deleteJournal(id) {
    // if (!confirm("Delete this record?")) return;
    
    const response = await fetch(`${BACKEND_URL}/${id}`, {
        method: 'DELETE',
        headers: await getHeaders()
    });

    if (response.ok) fetchJournals();
}

// --- ATTACH TO WINDOW (Add this at the end of app.js) ---

window.handleSignUp = handleSignUp;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.createJournal = createJournal;
window.fetchJournals = fetchJournals;
window.deleteJournal = deleteJournal;