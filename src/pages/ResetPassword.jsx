import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/account.css";

function ResetPassword() {
  const [user, setUser] = useState(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const detectPasswordFlow = async () => {
      /*
       * Supabase may include the recovery type in either the query
       * parameters or URL hash, depending on the authentication flow.
       */
      const queryParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );

      const recoveryFromUrl =
        queryParams.get("type") === "recovery" ||
        hashParams.get("type") === "recovery";

      if (recoveryFromUrl && mounted) {
        setRecoveryMode(true);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setUser(session?.user || null);
        setCheckingSession(false);
      }
    };

    detectPasswordFlow();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setUser(session?.user || null);
        setCheckingSession(false);
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(session?.user || null);
        setCheckingSession(false);
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const validatePassword = () => {
    if (newPassword.length < 10) {
      return "Your new password must contain at least 10 characters.";
    }

    if (!/[A-Z]/.test(newPassword)) {
      return "Your new password must include an uppercase letter.";
    }

    if (!/[a-z]/.test(newPassword)) {
      return "Your new password must include a lowercase letter.";
    }

    if (!/[0-9]/.test(newPassword)) {
      return "Your new password must include a number.";
    }

    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      return "Your new password must include a special character.";
    }

    if (newPassword !== confirmPassword) {
      return "The new passwords do not match.";
    }

    if (!recoveryMode && currentPassword === newPassword) {
      return "Your new password must be different from your current password.";
    }

    return "";
  };

  const verifyCurrentPassword = async () => {
    if (!user?.email) {
      throw new Error("SESSION_REQUIRED");
    }

    if (!currentPassword) {
      throw new Error("CURRENT_PASSWORD_REQUIRED");
    }

    /*
     * This creates a fresh authenticated session and proves that the
     * person changing the password knows the current password.
     */
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (error) {
      throw new Error("CURRENT_PASSWORD_INVALID");
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();

    setMessage("");
    setMessageType("");

    const validationError = validatePassword();

    if (validationError) {
      showMessage(validationError);
      return;
    }

    setLoading(true);

    try {
      if (!recoveryMode) {
        await verifyCurrentPassword();
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error("Password update failed:", updateError);

        throw new Error("PASSWORD_UPDATE_FAILED");
      }

      /*
       * Revoke all sessions after a password change.
       * The user must sign in again using the new password.
       */
      const { error: signOutError } = await supabase.auth.signOut({
        scope: "global",
      });

      if (signOutError) {
        console.error(
          "Password changed, but session revocation failed:",
          signOutError
        );
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      showMessage(
        "Password updated successfully. Please sign in again.",
        "success"
      );

      window.setTimeout(() => {
        window.location.replace("/account");
      }, 1800);
    } catch (error) {
      console.error("Secure password change failed:", error);

      switch (error.message) {
        case "SESSION_REQUIRED":
          showMessage(
            "Your session has expired. Please sign in again before changing your password."
          );
          break;

        case "CURRENT_PASSWORD_REQUIRED":
          showMessage("Enter your current password.");
          break;

        case "CURRENT_PASSWORD_INVALID":
          showMessage("The current password is incorrect.");
          break;

        default:
          showMessage(
            "We could not update your password. Please try again or request a new password-reset email."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <>
        <Navbar />

        <section className="account-page">
          <div className="account-card">
            <h1>Checking Security Session...</h1>
          </div>
        </section>

        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />

        <section className="account-page">
          <div className="account-card">
            <h1>Session Expired</h1>

            <div className="account-message">
              This password-change link is invalid or has expired. Return to
              the sign-in page and request another reset link.
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = "/account";
              }}
            >
              Return to Sign In
            </button>
          </div>
        </section>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <section className="account-page">
        <div className="account-card">
          <h1>
            {recoveryMode ? "Create New Password" : "Change Password"}
          </h1>

          <p className="password-security-note">
            {recoveryMode
              ? "Your recovery link has verified your identity. Create a strong new password."
              : "For your security, confirm your current password before creating a new one."}
          </p>

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

          <form onSubmit={updatePassword}>
            {!recoveryMode && (
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
                autoComplete="current-password"
                disabled={loading}
                required
              />
            )}

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              autoComplete="new-password"
              minLength={10}
              disabled={loading}
              required
            />

            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              autoComplete="new-password"
              minLength={10}
              disabled={loading}
              required
            />

            <div className="password-requirements">
              Use at least 10 characters with uppercase, lowercase, number
              and special-character combinations.
            </div>

            <button type="submit" disabled={loading}>
              {loading
                ? "Securing Account..."
                : recoveryMode
                  ? "Set New Password"
                  : "Change Password"}
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default ResetPassword;