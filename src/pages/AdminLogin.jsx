import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/adminLogin.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("role,is_active")
      .eq("email", data.user.email)
      .single();

    if (adminError || !adminData || adminData.is_active === false) {
      await supabase.auth.signOut();
      setError("Access denied. This account is not an active admin.");
      return;
    }

    navigate("/admin");
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