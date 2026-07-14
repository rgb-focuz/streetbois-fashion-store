import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TurnstileWidget from "../components/TurnstileWidget";
import "../styles/account.css";

const MAX_LOCAL_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60;
const LOGIN_SECURITY_KEY = "streetbois-login-security";

function Account() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const handleCaptchaToken = useCallback((token) => {
    setCaptchaToken(token);
  }, []);

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const resetCaptcha = () => {
    setCaptchaToken("");
    setCaptchaResetKey((current) => current + 1);
  };

  const readLoginSecurity = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(LOGIN_SECURITY_KEY)
      );

      return {
        failures: Number(saved?.failures || 0),
        blockedUntil: Number(saved?.blockedUntil || 0),
      };
    } catch {
      return {
        failures: 0,
        blockedUntil: 0,
      };
    }
  };

  const registerFailedAttempt = () => {
    const security = readLoginSecurity();
    const failures = security.failures + 1;

    if (failures >= MAX_LOCAL_ATTEMPTS) {
      const blockedUntil =
        Date.now() + COOLDOWN_SECONDS * 1000;

      localStorage.setItem(
        LOGIN_SECURITY_KEY,
        JSON.stringify({
          failures: 0,
          blockedUntil,
        })
      );

      setCooldownRemaining(COOLDOWN_SECONDS);
      return;
    }

    localStorage.setItem(
      LOGIN_SECURITY_KEY,
      JSON.stringify({
        failures,
        blockedUntil: 0,
      })
    );
  };

  const clearFailedAttempts = () => {
    localStorage.removeItem(LOGIN_SECURITY_KEY);
    setCooldownRemaining(0);
  };

  useEffect(() => {
    const updateCooldown = () => {
      const { blockedUntil } = readLoginSecurity();

      if (!blockedUntil || blockedUntil <= Date.now()) {
        if (blockedUntil) {
          localStorage.removeItem(LOGIN_SECURITY_KEY);
        }

        setCooldownRemaining(0);
        return;
      }

      setCooldownRemaining(
        Math.ceil((blockedUntil - Date.now()) / 1000)
      );
    };

    updateCooldown();

    const interval = window.setInterval(
      updateCooldown,
      1000
    );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const saveCustomerProfile = async (user) => {
    if (!user?.id || !user?.email) return;

    const profileName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      fullName.trim() ||
      "Customer";

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: profileName,
          email: user.email.toLowerCase(),
        },
        {
          onConflict: "id",
        }
      );

    if (error) {
      console.error("Profile save failed:", error);

      showMessage(
        "You are signed in, but we could not update your profile.",
        "error"
      );
    }
  };

  useEffect(() => {
    let active = true;

    const handleAuthenticatedUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || !user) return;

      await saveCustomerProfile(user);
      window.location.replace("/shop");
    };

    handleAuthenticatedUser();

    return () => {
      active = false;
    };
  }, []);

  const signInWithGoogle = async () => {
    setMessage("");
    setMessageType("error");
    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signInWithOAuth({
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

      if (error || !data?.url) {
        console.error("Google OAuth failed:", error);

        showMessage(
          "Google sign-in is temporarily unavailable."
        );
        return;
      }

      window.location.assign(data.url);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setMessage("");
    setMessageType("error");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      showMessage("Enter your email address first.");
      return;
    }

    if (!captchaToken) {
      showMessage(
        "Complete the security verification first."
      );
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${window.location.origin}/reset-password`,
          captchaToken,
        }
      );

    if (error) {
      console.error("Password-reset request failed:", error);
    }

    /*
     * Always return the same message so visitors cannot discover
     * whether an email address exists.
     */
    showMessage(
      "If an account exists for this email, a password-reset link will be sent.",
      "success"
    );

    resetCaptcha();
    setLoading(false);
  };

  const validateSignup = () => {
    if (fullName.trim().length < 2) {
      return "Enter your full name.";
    }

    if (password.length < 10) {
      return "Your password must contain at least 10 characters.";
    }

    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      return "Use uppercase, lowercase, number and special-character combinations.";
    }

    return "";
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    setMessage("");
    setMessageType("error");

    const validationError = validateSignup();

    if (validationError) {
      showMessage(validationError);
      return;
    }

    if (!captchaToken) {
      showMessage(
        "Complete the security verification first."
      );
      return;
    }

    if (cooldownRemaining > 0) {
      showMessage(
        `Please wait ${cooldownRemaining} seconds before trying again.`
      );
      return;
    }

    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
        captchaToken,
      },
    });

    resetCaptcha();
    setLoading(false);

    if (error) {
      console.error("Account creation failed:", error);
      registerFailedAttempt();

      showMessage(
        "We could not create the account. Check your information and try again."
      );
      return;
    }

    clearFailedAttempts();

    if (data.user) {
      await saveCustomerProfile(data.user);
    }

    setPassword("");
    setMode("signin");

    showMessage(
      "If registration was successful, check your email to confirm the account.",
      "success"
    );
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setMessage("");
    setMessageType("error");

    if (cooldownRemaining > 0) {
      showMessage(
        `Too many attempts. Try again in ${cooldownRemaining} seconds.`
      );
      return;
    }

    if (!captchaToken) {
      showMessage(
        "Complete the security verification first."
      );
      return;
    }

    setLoading(true);

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
        options: {
          captchaToken,
        },
      });

    resetCaptcha();
    setLoading(false);

    if (error || !data?.user) {
      console.error("Customer sign-in failed:", error);
      registerFailedAttempt();

      showMessage("Invalid email or password.");
      return;
    }

    clearFailedAttempts();
    await saveCustomerProfile(data.user);

    window.location.replace("/shop");
  };

  const changeMode = (newMode) => {
    setMode(newMode);
    setMessage("");
    setMessageType("error");
    setPassword("");
    resetCaptcha();
  };

  return (
    <>
      <Navbar />

      <section className="account-page">
        <div className="account-card">
          <h1>
            {mode === "signin"
              ? "Sign In"
              : "Create Account"}
          </h1>

          <div className="account-tabs">
            <button
              type="button"
              className={
                mode === "signin" ? "active" : ""
              }
              onClick={() => changeMode("signin")}
              disabled={loading}
            >
              Sign In
            </button>

            <button
              type="button"
              className={
                mode === "signup" ? "active" : ""
              }
              onClick={() => changeMode("signup")}
              disabled={loading}
            >
              Create Account
            </button>
          </div>

          <button
            type="button"
            className="google-auth-btn"
            onClick={signInWithGoogle}
            disabled={loading}
          >
            Continue with Google
          </button>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          {message && (
            <div
              className={`account-message ${
                messageType === "success"
                  ? "account-message-success"
                  : "account-message-error"
              }`}
            >
              {message}
            </div>
          )}

          {cooldownRemaining > 0 && (
            <div className="login-cooldown-message">
              Security cooldown: {cooldownRemaining}s
            </div>
          )}

          {mode === "signup" ? (
            <form onSubmit={handleSignUp}>
              <input
                type="text"
                placeholder="Full Name"
                maxLength={120}
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                disabled={loading}
                required
              />

              <input
                type="email"
                placeholder="Email Address"
                maxLength={254}
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                disabled={loading}
                required
              />

              <input
                type="password"
                placeholder="Password"
                minLength={10}
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="new-password"
                disabled={loading}
                required
              />

              <p className="password-requirements">
                Use at least 10 characters including uppercase,
                lowercase, number and a special character.
              </p>

              <TurnstileWidget
                onTokenChange={handleCaptchaToken}
                resetKey={captchaResetKey}
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  cooldownRemaining > 0 ||
                  !captchaToken
                }
              >
                {loading
                  ? "Creating..."
                  : "Create Account"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignIn}>
              <input
                type="email"
                placeholder="Email Address"
                maxLength={254}
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                disabled={loading}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="current-password"
                disabled={loading}
                required
              />

              <TurnstileWidget
                onTokenChange={handleCaptchaToken}
                resetKey={captchaResetKey}
              />

              <button
                type="submit"
                disabled={
                  loading ||
                  cooldownRemaining > 0 ||
                  !captchaToken
                }
              >
                {loading
                  ? "Signing in..."
                  : "Sign In"}
              </button>

              <button
                type="button"
                className="forgot-password-btn"
                onClick={resetPassword}
                disabled={
                  loading ||
                  cooldownRemaining > 0 ||
                  !captchaToken
                }
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