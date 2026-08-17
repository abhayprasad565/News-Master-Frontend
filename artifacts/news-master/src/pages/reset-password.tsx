import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, setCsrfToken } from "@/lib/api";

export default function ResetPassword() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [complete, setComplete] = useState(false);
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const mutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/auth/reset-password", {
        method: "POST",
        csrf: false,
        body: JSON.stringify({ token, password }),
      }),
    onSuccess: () => {
      setCsrfToken(null);
      window.history.replaceState({}, "", "/reset-password");
      setPassword("");
      setConfirmation("");
      setComplete(true);
    },
    onError: (error: any) =>
      toast({
        title: "Password could not be reset",
        description:
          error.status === 401
            ? "This reset link is invalid, expired, or has already been used."
            : error.message,
        variant: "destructive",
      }),
  });
  const invalid = password.length < 10 || password !== confirmation;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            {complete ? "Password updated" : "Choose a new password"}
          </CardTitle>
          <CardDescription>
            {complete
              ? "All existing sessions have been revoked."
              : "Use at least 10 characters."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {complete ? (
            <Button asChild className="w-full">
              <Link href="/login">Sign in</Link>
            </Button>
          ) : !token ? (
            <div className="space-y-4 text-sm">
              <p>This reset link is incomplete. Request a new one.</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/forgot-password">Request reset link</Link>
              </Button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!invalid) mutation.mutate();
              }}
            >
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium">
                  New password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={mutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="confirm-new-password"
                  className="text-sm font-medium"
                >
                  Confirm password
                </label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  disabled={mutation.isPending}
                />
                {confirmation && password !== confirmation && (
                  <p className="text-sm text-destructive">
                    Passwords do not match.
                  </p>
                )}
              </div>
              <Button
                className="w-full"
                disabled={mutation.isPending || invalid}
              >
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
