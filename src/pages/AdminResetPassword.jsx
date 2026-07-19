import { useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/adminLogin.css";

function AdminResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updatePassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password.length < 10) {
      setMessage("Password must be at least 10 characters.");
      return;
    }

    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      setMessage(
        "Password must include uppercase, lowercase, number and special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      console.error("Admin password reset failed:", error);
      setMessage("Password could not be updated. Please request a new reset link.");
      return;
    }

    setMessage("Admin password updated successfully. Redirecting to admin login...");

    setTimeout(() => {
      window.location.href = "/admin-login";
    }, 2000);
  };

  return (
    <section className="admin-login-page">
      <form className="admin-login-box" onSubmit={updatePassword}>
        <h1>Reset Admin Password</h1>
        <p>Enter your new admin password.</p>

        {message && <div className="login-error">{message}</div>}

        <input
          type="password"
          placeholder="New Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm New Admin Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Admin Password"}
        </button>
      </form>
    </section>
  );
}

export default AdminResetPassword;
