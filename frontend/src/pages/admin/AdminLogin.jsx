import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
  e.preventDefault();

  if (!email && !password) {
    alert("Email and Password are required");
    return;
  }
  if (!email) {
    alert("Email is required");
    return;
  }
  if (!password) {
    alert("Password is required");
    return;
  }


  localStorage.setItem("token", "dummy-admin-token");
  navigate("/admin/dashboard");
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form className="bg-white p-8 rounded shadow w-96">
        <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">
          Admin Login
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 mb-4 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border p-2 mb-6 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;
