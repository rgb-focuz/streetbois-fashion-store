import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/adminLogin.css";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const loginEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      setError("Login failed. Check email and password.");
      return;
    }

    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("role,is_active")
      .ilike("email", loginEmail)
      .maybeSingle();

    if (adminError || !adminData || adminData.is_active !== true) {
      await supabase.auth.signOut();
      setError("Access denied. This account is not an active admin.");
      return;
    }

    navigate("/admin");
  };

  const handleResetPassword = async () => {
    setError("");

    const resetEmail = email.trim().toLowerCase();

    if (!resetEmail) {
      setError("Please enter your admin email first.");
      return;
    }

    setResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
      setResetLoading(false);
      return;
    }

    setError("Password reset link sent to your email.");
    setResetLoading(false);
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

        <button
          type="button"
          className="admin-reset-password-btn"
          onClick={handleResetPassword}
          disabled={resetLoading}
        >
          {resetLoading ? "Sending reset link..." : "Forgot password?"}
        </button>
      </form>
    </section>
  );
}

export default AdminLogin;