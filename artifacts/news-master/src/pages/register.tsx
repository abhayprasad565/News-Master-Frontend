import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetMe } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, Redirect, useLocation } from "wouter";
import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be 50 characters or fewer")
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        "Use letters, numbers, dot, underscore, or dash",
      ),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(10, "Password must be at least 10 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      apiFetch<{ ok: true; message: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: values.username,
          email: values.email,
          password: values.password,
          turnstileToken,
        }),
        csrf: false,
      }),
    onSuccess: () => {
      setTurnstileToken(null);
      toast({
        title: "Check your email",
        description: "Use the verification link before signing in.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      setTurnstileToken(null);
      setTurnstileResetKey((key) => key + 1);
      toast({
        title: "Registration failed",
        description:
          error.status === 409
            ? "Registration could not be completed."
            : error.requestId
              ? `${error.message} (${error.requestId})`
              : error.message,
        variant: "destructive",
      });
    },
  });

  if (meLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (me?.user) {
    return <Redirect to={me.user.role === "reader" ? "/stories" : "/admin"} />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-muted/40 p-4">
      <Link href="/stories" className="mb-8 flex items-center gap-3">
        <Logo className="h-10 w-auto" />
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Create Reader Account</CardTitle>
          <CardDescription>
            Published stories remain public; accounts are for reader features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) =>
                registerMutation.mutate(values),
              )}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="reader_name"
                        {...field}
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="reader@example.com"
                        {...field}
                        disabled={registerMutation.isPending}
                      />
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
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <TurnstileWidget
                action="register"
                onToken={setTurnstileToken}
                resetKey={turnstileResetKey}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending || !turnstileToken}
              >
                {registerMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Register
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href="/stories">Continue without account</Link>
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          </Form>
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
