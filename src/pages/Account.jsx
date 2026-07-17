import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import Footer from "../components/Footer";
import TurnstileWidget from "../components/TurnstileWidget";
import "../styles/account.css";

const MAX_LOCAL_ATTEMPTS = 5;
const COOLDOWN_SECONDS = 60;
const RESEND_SECONDS = 60;
const LOGIN_SECURITY_KEY = "streetbois-login-security";

function Account() {
  const [step, setStep] = useState("identify");
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState(Array(6).fill(""));
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [resendRemaining, setResendRemaining] = useState(0);
  const codeInputRefs = useRef([]);

  const cleanEmail = identifier.trim().toLowerCase();

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
      const saved = JSON.parse(localStorage.getItem(LOGIN_SECURITY_KEY));

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
      const blockedUntil = Date.now() + COOLDOWN_SECONDS * 1000;

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

      setCooldownRemaining(Math.ceil((blockedUntil - Date.now()) / 1000));
    };

    updateCooldown();

    const interval = window.setInterval(updateCooldown, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (resendRemaining <= 0) return undefined;

    const timeout = window.setTimeout(() => {
      setResendRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [resendRemaining]);

  useEffect(() => {
    let active = true;

    const handleAuthenticatedUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active || !user || step !== "identify") return;

      await saveCustomerProfile(user);
      window.location.replace("/shop");
    };

    handleAuthenticatedUser();

    return () => {
      active = false;
    };
  }, [step]);

  const saveCustomerProfile = async (user) => {
    if (!user?.id || !user?.email) return;

    const profileName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      fullName.trim() ||
      "Customer";

    const { error } = await supabase.from("profiles").upsert(
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
      showMessage("You are signed in, but we could not update your profile.");
    }
  };

  const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const sendVerificationCode = async ({ isResend = false } = {}) => {
    setMessage("");
    setMessageType("error");

    if (cooldownRemaining > 0) {
      showMessage(`Please wait ${cooldownRemaining} seconds before trying again.`);
      return;
    }

    if (!isEmail(cleanEmail)) {
      showMessage("Enter a valid email address. Phone sign-in requires SMS setup.");
      return;
    }

    if (!captchaToken) {
      showMessage("Complete the security verification first.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: true,
        captchaToken,
      },
    });

    resetCaptcha();
    setLoading(false);

    if (error) {
      console.error("Verification code request failed:", error);
      registerFailedAttempt();
      showMessage("We could not send the verification code. Please try again.");
      return;
    }

    clearFailedAttempts();
    setVerificationCode(Array(6).fill(""));
    setStep("verify");
    setResendRemaining(RESEND_SECONDS);

    showMessage(
      isResend
        ? "A new verification code has been sent."
        : "Verification code sent. Check your email.",
      "success"
    );

    window.setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setMessage("");
    setMessageType("error");

    const token = verificationCode.join("");

    if (token.length !== 6) {
      showMessage("Enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token,
      type: "email",
    });

    setLoading(false);

    if (error || !data?.user) {
      console.error("Verification failed:", error);
      registerFailedAttempt();
      showMessage("Invalid verification code.");
      return;
    }

    clearFailedAttempts();
    await saveCustomerProfile(data.user);
    setStep("password");
    showMessage("Email verified. Create your account password.", "success");
  };

  const validatePassword = () => {
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

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  const completePasswordSetup = async (event) => {
    event.preventDefault();
    setMessage("");
    setMessageType("error");

    const validationError = validatePassword();

    if (validationError) {
      showMessage(validationError);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.updateUser({
      password,
      data: {
        full_name: fullName.trim() || undefined,
      },
    });

    setLoading(false);

    if (error) {
      console.error("Password setup failed:", error);
      showMessage("We could not save your password. Please try again.");
      return;
    }

    await saveCustomerProfile(data.user);
    window.location.replace("/shop");
  };

  const signInWithProvider = async (provider) => {
    setMessage("");
    setMessageType("error");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/account`,
          queryParams: provider === "google" ? { prompt: "select_account" } : {},
          skipBrowserRedirect: true,
        },
      });

      if (error || !data?.url) {
        console.error(`${provider} OAuth failed:`, error);
        showMessage(`${provider} sign-in is temporarily unavailable.`);
        return;
      }

      window.location.assign(data.url);
    } finally {
      setLoading(false);
    }
  };

  const editIdentifier = () => {
    setStep("identify");
    setMessage("");
    setMessageType("error");
    setVerificationCode(Array(6).fill(""));
    setPassword("");
    setConfirmPassword("");
    resetCaptcha();
  };

  const handleCodeChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextCode = [...verificationCode];
    nextCode[index] = digit;
    setVerificationCode(nextCode);

    if (digit && index < verificationCode.length - 1) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index, event) => {
    if (event.key === "Backspace" && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <>
      <section className="account-page jumia-auth-page">
        <div className="jumia-auth-shell">
          <div className="jumia-auth-mark">★</div>

          {step === "identify" && (
            <>
              <h1>Welcome to StreetBois Fashion</h1>
              <p className="jumia-auth-subtitle">
                Use your email to log in or sign up.
              </p>

              <form
                className="jumia-auth-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendVerificationCode();
                }}
              >
                <label className="jumia-field-label">
                  <span>Email or Mobile Number*</span>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    autoComplete="email"
                    disabled={loading}
                    required
                  />
                </label>

                <TurnstileWidget
                  onTokenChange={handleCaptchaToken}
                  resetKey={captchaResetKey}
                />

                <button type="submit" disabled={loading || !captchaToken}>
                  {loading ? "Sending..." : "Continue"}
                </button>
              </form>

              <div className="auth-divider jumia-divider">
                <span>Or log in with</span>
              </div>

              <div className="social-auth-row">
                <button
                  type="button"
                  className="facebook-auth-circle"
                  onClick={() => signInWithProvider("facebook")}
                  disabled={loading}
                  aria-label="Continue with Facebook"
                >
                  f
                </button>
                <button
                  type="button"
                  className="google-auth-circle"
                  onClick={() => signInWithProvider("google")}
                  disabled={loading}
                  aria-label="Continue with Google"
                >
                  G
                </button>
              </div>
            </>
          )}

          {step === "verify" && (
            <>
              <h1>Verify your email address</h1>
              <p className="jumia-auth-subtitle">
                We have sent a verification code to
                <br />
                {cleanEmail}
              </p>

              <form className="jumia-auth-form" onSubmit={verifyCode}>
                <div className="verification-code-row">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        codeInputRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleCodeChange(index, event.target.value)}
                      onKeyDown={(event) => handleCodeKeyDown(index, event)}
                      disabled={loading}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Submit"}
                </button>
              </form>

              <p className="resend-code-text">
                Didn't receive the verification code?{" "}
                {resendRemaining > 0 ? (
                  <span>Request a new code in {resendRemaining} seconds</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => sendVerificationCode({ isResend: true })}
                    disabled={loading || !captchaToken}
                  >
                    Request a new code
                  </button>
                )}
              </p>

              {resendRemaining === 0 && (
                <TurnstileWidget
                  onTokenChange={handleCaptchaToken}
                  resetKey={captchaResetKey}
                />
              )}
            </>
          )}

          {step === "password" && (
            <>
              <h1>Create your account</h1>
              <p className="jumia-auth-subtitle">
                Create a strong password for faster access next time.
              </p>

              <div className="verified-email-box">
                <span>{cleanEmail}</span>
                <button type="button" onClick={editIdentifier}>
                  Edit
                </button>
              </div>

              <form className="jumia-auth-form" onSubmit={completePasswordSetup}>
                <label className="jumia-field-label">
                  <span>Full Name</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    maxLength={120}
                    disabled={loading}
                  />
                </label>

                <label className="jumia-field-label">
                  <span>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />
                </label>

                <div className="password-strength-line">
                  <span className={password.length >= 4 ? "active" : ""}></span>
                  <span className={password.length >= 8 ? "active" : ""}></span>
                  <span className={password.length >= 10 ? "active" : ""}></span>
                  <small>{password.length >= 10 ? "Strong" : "Use 10+ characters"}</small>
                </div>

                <label className="jumia-field-label">
                  <span>Confirm Password</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    disabled={loading}
                    required
                  />
                </label>

                <button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Continue"}
                </button>
              </form>
            </>
          )}

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

          <p className="auth-terms">
            By continuing you agree to StreetBois Fashion's
            <br />
            <a href="/faq">Terms and Conditions</a>
          </p>

          <p className="auth-help">
            Need help? Visit our Help Center or contact us on 0202430406
          </p>

          <div className="auth-footer-brand">STREETBOIS FASHION</div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Account;
