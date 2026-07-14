import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import TurnstileWidget from "../components/TurnstileWidget";
import "../styles/adminLogin.css";

const MAX_ADMIN_ATTEMPTS = 4;
const ADMIN_COOLDOWN_SECONDS = 120;
const ADMIN_SECURITY_KEY = "streetbois-admin-login-security";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const navigate = useNavigate();

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

  const readSecurityState = () => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(ADMIN_SECURITY_KEY)
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
    const security = readSecurityState();
    const failures = security.failures + 1;

    if (failures >= MAX_ADMIN_ATTEMPTS) {
      const blockedUntil =
        Date.now() + ADMIN_COOLDOWN_SECONDS * 1000;

      localStorage.setItem(
        ADMIN_SECURITY_KEY,
        JSON.stringify({
          failures: 0,
          blockedUntil,
        })
      );

      setCooldownRemaining(ADMIN_COOLDOWN_SECONDS);
      return;
    }

    localStorage.setItem(
      ADMIN_SECURITY_KEY,
      JSON.stringify({
        failures,
        blockedUntil: 0,
      })
    );
  };

  const clearFailedAttempts = () => {
    localStorage.removeItem(ADMIN_SECURITY_KEY);
    setCooldownRemaining(0);
  };

  useEffect(() => {
    const updateCooldown = () => {
      const { blockedUntil } = readSecurityState();

      if (!blockedUntil || blockedUntil <= Date.now()) {
        if (blockedUntil) {
          localStorage.removeItem(ADMIN_SECURITY_KEY);
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

  const handleLogin = async (event) => {
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

    const loginEmail = email.trim().toLowerCase();

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
          options: {
            captchaToken,
          },
        });

      if (error || !data?.user) {
        console.error("Admin authentication failed:", error);
        registerFailedAttempt();

        showMessage("Invalid email or password.");
        return;
      }

      const { data: adminData, error: adminError } =
        await supabase
          .from("admin_users")
          .select("role,is_active")
          .ilike("email", loginEmail)
          .maybeSingle();

      if (
        adminError ||
        !adminData ||
        adminData.is_active !== true
      ) {
        console.error(
          "Admin authorization failed:",
          adminError
        );

        await supabase.auth.signOut();
        registerFailedAttempt();

        /*
         * Use the same message as an incorrect password so the
         * application does not reveal valid admin accounts.
         */
        showMessage("Invalid email or password.");
        return;
      }

      clearFailedAttempts();
      navigate("/admin", { replace: true });
    } catch (error) {
      console.error("Admin login error:", error);
      registerFailedAttempt();

      showMessage("Invalid email or password.");
    } finally {
      resetCaptcha();
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setMessage("");
    setMessageType("error");

    const resetEmail = email.trim().toLowerCase();

    if (!resetEmail) {
      showMessage("Enter your email address first.");
      return;
    }

    if (!captchaToken) {
      showMessage(
        "Complete the security verification first."
      );
      return;
    }

    setResetLoading(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        resetEmail,
        {
          redirectTo: `${window.location.origin}/admin-reset-password`,
          captchaToken,
        }
      );

    if (error) {
      console.error(
        "Admin password-reset request failed:",
        error
      );
    }

    /*
     * Always return the same response regardless of whether the
     * submitted email belongs to an administrator.
     */
    showMessage(
      "If an eligible account exists, a password-reset link will be sent.",
      "success"
    );

    resetCaptcha();
    setResetLoading(false);
  };

  return (
    <section className="admin-login-page">
      <form
        className="admin-login-box"
        onSubmit={handleLogin}
      >
        <h1>Admin Login</h1>
        <p>StreetBois Fashion dashboard access</p>

        {message && (
          <div
            className={`login-error ${
              messageType === "success"
                ? "login-message-success"
                : ""
            }`}
          >
            {message}
          </div>
        )}

        {cooldownRemaining > 0 && (
          <div className="admin-login-cooldown">
            Security cooldown: {cooldownRemaining}s
          </div>
        )}

        <input
          type="email"
          placeholder="Admin Email"
          maxLength={254}
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          autoComplete="email"
          disabled={loading || resetLoading}
          required
        />

        <input
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          autoComplete="current-password"
          disabled={loading || resetLoading}
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
            resetLoading ||
            cooldownRemaining > 0 ||
            !captchaToken
          }
        >
          {loading ? "Verifying..." : "Login"}
        </button>

        <button
          type="button"
          className="admin-reset-password-btn"
          onClick={handleResetPassword}
          disabled={
            loading ||
            resetLoading ||
            cooldownRemaining > 0 ||
            !captchaToken
          }
        >
          {resetLoading
            ? "Sending request..."
            : "Forgot password?"}
        </button>
      </form>
    </section>
  );
}

export default AdminLogin;