import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { apiFetch, setCsrfToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyEmail() {
  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState("error");
      return;
    }
    void apiFetch<{ csrfToken: string }>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
      csrf: false,
    })
      .then((response) => {
        setCsrfToken(response.csrfToken);
        window.history.replaceState(null, "", "/verify-email");
        setState("success");
      })
      .catch(() => setState("error"));
  }, []);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Email verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {state === "loading" && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin" />
              <p>Verifying your account…</p>
            </>
          )}
          {state === "success" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
              <p>Your email is verified and you are signed in.</p>
              <Button asChild>
                <Link href="/stories">Read stories</Link>
              </Button>
            </>
          )}
          {state === "error" && (
            <>
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
              <p>
                This verification link is invalid, expired, or has already been
                used.
              </p>
              <Button asChild variant="outline">
                <Link href="/register">Register again</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
