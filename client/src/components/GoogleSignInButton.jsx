import { useEffect, useRef } from "react";
import { toast } from "sonner";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("google_script_load_failed")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("google_script_load_failed"));
    document.head.appendChild(script);
  });

function GoogleSignInButton({ onToken, text = "continue_with", disabled = false }) {
  const containerRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!containerRef.current || disabled) return;
    if (!clientId) {
      toast.error("Missing VITE_GOOGLE_CLIENT_ID");
      return;
    }

    let mounted = true;

    const initGoogle = async () => {
      try {
        await loadGoogleScript();
        if (!mounted || !containerRef.current) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) {
              onToken(response.credential);
            }
          }
        });

        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          shape: "pill",
          width: 320
        });
      } catch {
        toast.error("Google script failed to load.");
      }
    };

    initGoogle();
    return () => {
      mounted = false;
    };
  }, [clientId, disabled, onToken, text]);

  return <div ref={containerRef} className={disabled ? "opacity-60 pointer-events-none" : ""} />;
}

export default GoogleSignInButton;
