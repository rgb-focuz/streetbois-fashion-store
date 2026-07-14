import { useEffect, useRef, useState } from "react";

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";
const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function TurnstileWidget({ onTokenChange, resetKey = 0 }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [ready, setReady] = useState(false);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      console.error("VITE_TURNSTILE_SITE_KEY is not configured.");
      return;
    }

    const renderWidget = () => {
      if (
        !window.turnstile ||
        !containerRef.current ||
        widgetIdRef.current !== null
      ) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(
        containerRef.current,
        {
          sitekey: siteKey,
          theme: "dark",
          callback: (token) => {
            onTokenChange(token);
          },
          "expired-callback": () => {
            onTokenChange("");
          },
          "error-callback": () => {
            onTokenChange("");
          },
        }
      );

      setReady(true);
    };

    const existingScript = document.getElementById(
      TURNSTILE_SCRIPT_ID
    );

    if (window.turnstile) {
      renderWidget();
      return;
    }

    if (existingScript) {
      existingScript.addEventListener("load", renderWidget);

      return () => {
        existingScript.removeEventListener("load", renderWidget);
      };
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", renderWidget);

    document.head.appendChild(script);

    return () => {
      script.removeEventListener("load", renderWidget);
    };
  }, [onTokenChange, siteKey]);

  useEffect(() => {
    if (
      window.turnstile &&
      widgetIdRef.current !== null
    ) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenChange("");
    }
  }, [resetKey, onTokenChange]);

  useEffect(() => {
    return () => {
      if (
        window.turnstile &&
        widgetIdRef.current !== null
      ) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!siteKey) {
    return (
      <div className="captcha-configuration-error">
        Security verification is not configured.
      </div>
    );
  }

  return (
    <div className="turnstile-wrapper">
      <div ref={containerRef}></div>

      {!ready && (
        <p className="captcha-loading">
          Loading security verification...
        </p>
      )}
    </div>
  );
}

export default TurnstileWidget;