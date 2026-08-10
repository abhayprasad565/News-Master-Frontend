import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import { Link, useLocation, Redirect } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { useMutation } from '@tanstack/react-query';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: me, isLoading: meLoading } = useGetMe();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginFormValues) =>
      apiFetch<{ user: { id?: string; username?: string; email?: string | null; role: 'admin' | 'reader' } }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(getGetMeQueryKey(), { user: data.user });
      toast({ title: 'Welcome back' });
      setLocation(data.user.role === 'admin' ? '/admin' : '/stories');
    },
    onError: (error: any) => {
      toast({
        title: 'Login failed',
        description: error.message || 'Please check your credentials and try again',
        variant: 'destructive',
      });
    },
  });

  if (meLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (me?.user) {
    return <Redirect to={me.user.role === 'admin' ? '/admin' : '/stories'} />;
  }

  function onSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-muted/40">
      <div className="mb-8 flex items-center gap-2 text-primary">
        <Newspaper className="h-8 w-8" />
        <span className="font-serif font-bold text-2xl tracking-tight text-foreground">News Master</span>
      </div>
      
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Use your username, email, or master admin credential.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username or email</FormLabel>
                    <FormControl>
                      <Input placeholder="reader-name-or-email@example.com" {...field} disabled={loginMutation.isPending} />
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
                      <Input type="password" {...field} disabled={loginMutation.isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Need a reader account? <Link href="/register" className="text-primary hover:underline">Register</Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
