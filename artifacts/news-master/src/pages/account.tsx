import { useGetMe, useLogout, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, LogOut, Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function Account() {
  const { data: me, isLoading } = useGetMe();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), { user: null });
        toast({ title: 'Logged out successfully' });
        setLocation('/login');
      },
      onError: () => {
        toast({ title: 'Failed to logout', variant: 'destructive' });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!me?.user) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-bold">Sign in required</h1>
        <p className="mt-2 text-muted-foreground">Create or open a reader account to view account settings.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="outline" onClick={() => setLocation('/login')}>Sign in</Button>
          <Button onClick={() => setLocation('/register')}>Register</Button>
        </div>
      </div>
    );
  }

  const user = me.user as typeof me.user & { username?: string | null };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences and session.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>Your personal information and role.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Username</span>
            <span className="text-lg">{user.username || 'Unknown'}</span>
          </div>

          <div className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-muted-foreground">Email Address</span>
            <span className="text-lg">{user.email || 'Not set'}</span>
          </div>
          
          <div className="flex flex-col space-y-2 items-start">
            <span className="text-sm font-medium text-muted-foreground">Account Role</span>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="flex items-center gap-1">
              {user.role === 'admin' && <ShieldCheck className="h-3 w-3" />}
              {user.role === 'admin' ? 'Administrator' : 'Reader'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          variant="destructive" 
          onClick={() => logoutMutation.mutate()} 
          disabled={logoutMutation.isPending}
          className="w-full sm:w-auto"
        >
          {logoutMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
          Sign Out
        </Button>
      </div>
    </div>
  );
}
