import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/account.css";

function Account() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const saveCustomerProfile = async (user) => {
  if (!user?.id || !user?.email) return;

  const fullNameFromGoogle =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    fullName ||
    "Customer";

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: fullNameFromGoogle,
      email: user.email.toLowerCase(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.log("Profile save error:", error);
    setMessage(error.message);
  }
};
  useEffect(() => {
  const handleAuthUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await saveCustomerProfile(user);
      window.location.href = "/shop";
    }
  };

  handleAuthUser();
}, []);

  const signInWithGoogle = async () => {
  setMessage("");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/account`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    setMessage(error.message);
    return;
  }

  if (data?.url) {
    window.location.href = data.url;
  } else {
    setMessage("Google login URL was not created.");

    }

    console.log("Google OAuth:", { data, error });

    if (error) {
      setMessage(error.message);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setMessage("Enter your email first.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setMessage(error ? error.message : "Password reset link sent to your email.");
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.user) {
      await saveCustomerProfile(data.user);
    }

    setMessage("Account created. Check your email to confirm.");
    setMode("signin");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (error) {
      setMessage("Login failed. Check your email and password.");
      return;
    }

    if (data.user) {
      await saveCustomerProfile(data.user);
    }

    window.location.href = "/shop";
  };

  return (
    <>
      <Navbar />

      <section className="account-page">
        <div className="account-card">
          <h1>{mode === "signin" ? "Sign In" : "Create Account"}</h1>

          <div className="account-tabs">
            <button
              type="button"
              className={mode === "signin" ? "active" : ""}
              onClick={() => setMode("signin")}
            >
              Sign In
            </button>

            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => setMode("signup")}
            >
              Create Account
            </button>
          </div>

          <button
            type="button"
            className="google-auth-btn"
            onClick={signInWithGoogle}
          >
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          {message && <div className="account-message">{message}</div>}

          {mode === "signup" ? (
            <form onSubmit={handleSignUp}>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignIn}>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>

              <button
                type="button"
                className="forgot-password-btn"
                onClick={resetPassword}
              >
                Forgot Password?
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Account;