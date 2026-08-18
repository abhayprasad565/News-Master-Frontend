import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
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

const schema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be 50 characters or fewer")
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        "Use letters, numbers, dot, underscore, or dash",
      ),
    password: z.string().min(10, "Password must be at least 10 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type Values = z.infer<typeof schema>;

export default function AdminInvitationAccept() {
  const { toast } = useToast();
  const [accepted, setAccepted] = useState(false);
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });
  const mutation = useMutation({
    mutationFn: (values: Values) =>
      apiFetch("/api/admin/invitations/accept", {
        method: "POST",
        csrf: false,
        body: JSON.stringify({
          token,
          username: values.username,
          password: values.password,
        }),
      }),
    onSuccess: () => {
      window.history.replaceState({}, "", "/admin/login");
      form.reset();
      setAccepted(true);
    },
    onError: (error: any) =>
      toast({
        title: "Invitation could not be accepted",
        description:
          error.status === 409 || error.status === 401
            ? "This invitation is invalid, expired, or has already been used."
            : error.message,
        variant: "destructive",
      }),
  });

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {accepted ? "Account created" : "Accept administrator invitation"}
          </CardTitle>
          <CardDescription>
            {accepted
              ? "Sign in with your new password. A one-time code will be emailed to activate the account."
              : "Choose credentials for the email address that received this invitation."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accepted ? (
            <div className="space-y-5 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <Button asChild className="w-full">
                <Link href="/admin/login">Continue to secure login</Link>
              </Button>
            </div>
          ) : !token ? (
            <div className="space-y-4 text-sm">
              <p>
                This invitation link is incomplete. Open the link from your
                invitation email.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/login">Administrator login</Link>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) =>
                  mutation.mutate(values),
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
                          autoComplete="username"
                          {...field}
                          disabled={mutation.isPending}
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
                          autoComplete="new-password"
                          {...field}
                          disabled={mutation.isPending}
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
                          autoComplete="new-password"
                          {...field}
                          disabled={mutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create account
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
