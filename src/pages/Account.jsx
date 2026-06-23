import { useState } from "react";
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    const { data: existingUser } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingUser) {
      setMessage("This email already has an account. Please sign in instead.");
      setMode("signin");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert([
      {
        full_name: fullName,
        email: cleanEmail,
      },
    ]);

   if (profileError) {
  console.log("Profile insert error:", profileError);

  if (profileError.code === "23505") {
    setMessage("User account already exists. Please sign in.");
    setMode("signin");
  } else {
    setMessage("Account creation failed. Please try again.");
  }

  return;
}

    setMessage("Account created successfully. You can now sign in.");
    setMode("signin");
    setFullName("");
    setEmail("");
    setPassword("");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setMessage("Login failed. Check your email and password.");
    } else {
      window.location.href = "/shop";
    }
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

              <button type="submit">Create Account</button>
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

              <button type="submit">Sign In</button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Account;