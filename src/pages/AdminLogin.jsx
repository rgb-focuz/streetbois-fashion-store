import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/adminLogin.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const adminEmail = "apodeijoshuaagudey1@gmail.com";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError("Login failed. Check email and password.");
      return;
    }

    if (data.user.email === adminEmail) {
      navigate("/admin");
    } else {
      setError("Access denied. This account is not an admin.");
    }
  };

  return (
    <section className="admin-login-page">
      <form className="admin-login-box" onSubmit={handleLogin}>
        <h1>Admin Login</h1>
        <p>StreetBois Fashion dashboard access</p>

        {error && <div className="login-error">{error}</div>}

        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>
    </section>
  );
}

export default AdminLogin;