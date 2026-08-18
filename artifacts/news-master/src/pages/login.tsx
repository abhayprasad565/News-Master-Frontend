import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Link, useLocation, Redirect } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, setCsrfToken } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { RecoveryCodes } from "@/components/auth/RecoveryCodes";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type User = {
  id: string;
  username: string;
  email: string | null;
  role: "owner" | "admin" | "moderator" | "reader";
};

export default function Login() {
  const administratorLogin = window.location.pathname.startsWith("/admin/");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me, isLoading: meLoading } = useGetMe();
  const [challengeCsrf, setChallengeCsrf] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [showRecovery, setShowRecovery] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [recoveryCodes, setRecoveryCodes] = useState<readonly string[]>([]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) =>
      administratorLogin
        ? apiFetch<{ csrfToken: string }>("/api/admin/auth/login", {
            method: "POST",
            body: JSON.stringify({ ...values, turnstileToken }),
            csrf: false,
          })
        : apiFetch<{ user: User; csrfToken: string }>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ ...values, turnstileToken }),
            csrf: false,
          }),
    onSuccess: (data) => {
      if (administratorLogin && !("user" in data)) {
        resetTurnstile();
        setChallengeCsrf(data.csrfToken);
        form.reset({ identifier: "", password: "" });
        return;
      }
      if ("user" in data)
        finishLogin((data as { user: User }).user, data.csrfToken);
    },
    onError: (error) => {
      resetTurnstile();
      showError(error);
    },
  });

  const otpMutation = useMutation({
    mutationFn: () =>
      apiFetch<{
        user?: User;
        csrfToken: string;
        recoveryCodes?: string[];
      }>(showRecovery ? "/api/admin/auth/recovery" : "/api/admin/auth/otp", {
        method: "POST",
        body: JSON.stringify({ code: otp }),
        csrf: challengeCsrf || false,
      }),
    onSuccess: (data) => {
      establishSession(data.user, data.csrfToken);
      if (data.recoveryCodes?.length) {
        setRecoveryCodes(data.recoveryCodes);
        return;
      }
      navigateAfterLogin(data.user);
    },
    onError: (error) => showError(error, showRecovery ? "Recovery failed" : "Wrong OTP"),
  });

  const resendMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ message: string }>("/api/admin/auth/otp/resend", {
        method: "POST",
        csrf: challengeCsrf || false,
      }),
    onSuccess: (data) => {
      setOtp("");
      toast({ title: "New code sent", description: data.message });
    },
    onError: showError,
  });

  function finishLogin(user: User | undefined, csrfToken: string) {
    establishSession(user, csrfToken);
    navigateAfterLogin(user);
  }

  function establishSession(user: User | undefined, csrfToken: string) {
    setCsrfToken(csrfToken);
    if (user) queryClient.setQueryData(getGetMeQueryKey(), { user });
    else queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    toast({ title: "Welcome back" });
  }

  function navigateAfterLogin(user: User | undefined) {
    setLocation(user?.role === "reader" ? "/stories" : "/admin");
  }

  function resetTurnstile() {
    setTurnstileToken(null);
    setTurnstileResetKey((key) => key + 1);
  }

  function showError(error: any, title = "Login failed") {
    toast({
      title,
      description:
        error.message || "Please check your credentials and try again",
      variant: "destructive",
    });
  }

  if (meLoading) return <Loading />;
  if (recoveryCodes.length > 0)
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-muted/40">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Save your recovery codes</CardTitle>
            <CardDescription>
              These codes can restore access if your security email is
              unavailable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecoveryCodes
              codes={recoveryCodes}
              onContinue={() =>
                navigateAfterLogin(me?.user as User | undefined)
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  if (me?.user)
    return (
      <Redirect
        to={(me.user as any).role === "reader" ? "/stories" : "/admin"}
      />
    );

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-muted/40">
      <Link href="/stories" className="mb-8">
        <Logo className="h-10 w-auto" />
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">
            {administratorLogin ? "Administrator login" : "Reader login"}
          </CardTitle>
          <CardDescription>
            {challengeCsrf
              ? "Enter the one-time code sent to your security email."
              : "Use your verified username or email and password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {challengeCsrf ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                otpMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label htmlFor="security-code" className="text-sm font-medium">
                  {showRecovery ? "Recovery code" : "Six-digit security code"}
                </label>
                <Input
                  id="security-code"
                  inputMode={showRecovery ? "text" : "numeric"}
                  autoComplete={showRecovery ? "off" : "one-time-code"}
                  maxLength={showRecovery ? 200 : 6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  disabled={otpMutation.isPending || resendMutation.isPending}
                />
              </div>
              <Button
                className="w-full"
                disabled={otpMutation.isPending || !otp.trim()}
              >
                {otpMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Verify and sign in
              </Button>
              {!showRecovery && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => resendMutation.mutate(undefined)}
                  disabled={resendMutation.isPending}
                >
                  Resend code
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowRecovery(!showRecovery);
                  setOtp("");
                }}
              >
                {showRecovery ? "Use emailed code" : "Use a recovery code"}
              </Button>
            </form>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) =>
                  loginMutation.mutate(values),
                )}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username or email</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={loginMutation.isPending} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          {...field}
                          disabled={loginMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <TurnstileWidget
                  action={administratorLogin ? "admin_login" : "reader_login"}
                  onToken={setTurnstileToken}
                  resetKey={turnstileResetKey}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending || !turnstileToken}
                >
                  {loginMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Continue
                </Button>
                {!administratorLogin && (
                  <>
                    <div className="relative my-2">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground font-medium">
                          Or
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full font-medium tracking-tight text-sm gap-2.5 h-10 border-border/80 hover:bg-accent/60 transition-all shadow-sm"
                      onClick={() =>
                        apiFetch<{ authorizationUrl: string }>(
                          "/api/auth/google/start",
                        )
                          .then((data) => {
                            window.location.assign(data.authorizationUrl);
                          })
                          .catch(showError)
                      }
                    >
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Sign in with Google</span>
                    </Button>
                  </>
                )}
                {!administratorLogin && (
                  <p className="text-center text-sm text-muted-foreground">
                    <Link
                      href="/forgot-password"
                      className="text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </p>
                )}
                {!administratorLogin && (
                  <p className="text-center text-sm text-muted-foreground">
                    Need an account?{" "}
                    <Link
                      href="/register"
                      className="text-primary hover:underline"
                    >
                      Register
                    </Link>
                  </p>
                )}
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
        <span>•</span>
        <Link href="/contact" className="hover:text-foreground transition-colors">
          Contact Us
        </Link>
        <span>•</span>
        <Link href="/stories" className="hover:text-foreground transition-colors">
          Stories
        </Link>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/40">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
