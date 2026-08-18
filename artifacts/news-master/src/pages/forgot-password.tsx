import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [sent, setSent] = useState(false);
  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>("/api/auth/forgot-password", {
        method: "POST",
        csrf: false,
        body: JSON.stringify({ identifier, turnstileToken }),
      }),
    onSuccess: () => setSent(true),
    onError: () => {
      setTurnstileToken(null);
      setResetKey((key) => key + 1);
    },
  });

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset reader password</CardTitle>
          <CardDescription>
            {sent
              ? "If the account can be used, a reset link has been sent."
              : "Enter your verified username or email."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <Button asChild className="w-full">
              <Link href="/login">Return to login</Link>
            </Button>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate();
              }}
            >
              <div className="space-y-2">
                <label
                  htmlFor="recovery-identifier"
                  className="text-sm font-medium"
                >
                  Username or email
                </label>
                <Input
                  id="recovery-identifier"
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  disabled={mutation.isPending}
                  required
                />
              </div>
              <TurnstileWidget
                action="password_recovery"
                onToken={setTurnstileToken}
                resetKey={resetKey}
              />
              <Button
                className="w-full"
                disabled={
                  mutation.isPending || !identifier.trim() || !turnstileToken
                }
              >
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send reset link
              </Button>
              <Button
                asChild
                type="button"
                variant="outline"
                className="w-full"
              >
                <Link href="/login">Cancel</Link>
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
