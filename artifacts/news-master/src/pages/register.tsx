import { useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { getGetMeQueryKey, useGetMe } from '@workspace/api-client-react';
import { Loader2, Newspaper } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, Redirect, useLocation } from 'wouter';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be 50 characters or fewer')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Use letters, numbers, dot, underscore, or dash'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(10, 'Password must be at least 10 characters'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((values) => values.password === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type AuthUser = {
  id?: string;
  username?: string;
  email?: string | null;
  role: 'admin' | 'reader';
};

export default function Register() {
  const { data: me, isLoading: meLoading } = useGetMe();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  });

  const registerMutation = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      apiFetch<{ user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: values.username,
          email: values.email,
          password: values.password,
        }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(getGetMeQueryKey(), { user: data.user });
      toast({ title: 'Account created' });
      setLocation('/stories');
    },
    onError: (error: any) => {
      toast({
        title: 'Registration failed',
        description: error.status === 409
          ? 'That username or email is already registered.'
          : error.requestId ? `${error.message} (${error.requestId})` : error.message,
        variant: 'destructive',
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
    return <Redirect to={me.user.role === 'admin' ? '/admin' : '/stories'} />;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-muted/40 p-4">
      <Link href="/stories" className="mb-8 flex items-center gap-2 text-primary">
        <Newspaper className="h-8 w-8" />
        <span className="font-serif text-2xl font-bold tracking-tight text-foreground">News Master</span>
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Create Reader Account</CardTitle>
          <CardDescription>Published stories remain public; accounts are for reader features.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => registerMutation.mutate(values))} className="space-y-4">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl><Input placeholder="reader_name" {...field} disabled={registerMutation.isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="reader@example.com" {...field} disabled={registerMutation.isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" {...field} disabled={registerMutation.isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl><Input type="password" {...field} disabled={registerMutation.isPending} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Register
              </Button>
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/stories">Continue without account</Link>
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
