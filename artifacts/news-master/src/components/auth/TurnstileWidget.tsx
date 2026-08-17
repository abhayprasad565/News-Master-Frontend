import { useEffect, useRef, useState } from "react";

type TurnstileAction =
  "register" | "reader_login" | "password_recovery" | "admin_login";

type TurnstileApi = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      action: TurnstileAction;
      callback(token: string): void;
      "error-callback"(): void;
      "expired-callback"(): void;
      "timeout-callback"(): void;
    },
  ): string;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const DEVELOPMENT_TEST_SITE_KEY = "1x00000000000000000000AA";
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  const loading = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT}"]`,
    );
    const script = existing ?? document.createElement("script");
    const onLoad = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile did not initialize"));
    };
    const onError = () => reject(new Error("Turnstile could not be loaded"));

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    if (!existing) {
      script.src = TURNSTILE_SCRIPT;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    scriptPromise = null;
    throw error;
  });
  scriptPromise = loading;
  return loading;
}

export function TurnstileWidget({
  action,
  onToken,
  resetKey,
}: {
  action: TurnstileAction;
  onToken(token: string | null): void;
  resetKey?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onToken);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  callbackRef.current = onToken;

  const configuredSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();
  const siteKey =
    configuredSiteKey || (import.meta.env.DEV ? DEVELOPMENT_TEST_SITE_KEY : "");

  useEffect(() => {
    callbackRef.current(null);
    if (!siteKey) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    let widgetId: string | null = null;
    setStatus("loading");
    void loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          callback: (token) => {
            callbackRef.current(token);
            setStatus("ready");
          },
          "error-callback": () => {
            callbackRef.current(null);
            setStatus("error");
          },
          "expired-callback": () => callbackRef.current(null),
          "timeout-callback": () => callbackRef.current(null),
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      callbackRef.current(null);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [action, resetKey, siteKey]);

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="min-h-[65px]" />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {status === "loading" && "Loading security check…"}
        {status === "error" &&
          (siteKey
            ? "Security check could not load. Refresh and try again."
            : "Security check is not configured.")}
      </p>
    </div>
  );
}
