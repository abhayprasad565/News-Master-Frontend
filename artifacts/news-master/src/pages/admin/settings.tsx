import { useGetMe, useGetMetrics, useHealthCheck } from '@workspace/api-client-react';
import { Activity, CheckCircle2, Server, ShieldAlert, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function StatusBadge({ ready }: { ready: boolean }) {
  return (
    <Badge variant={ready ? 'default' : 'destructive'} className="gap-1">
      {ready ? <CheckCircle2 className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
      {ready ? 'Ready' : 'Not ready'}
    </Badge>
  );
}

export default function AdminSettings() {
  const { data: me } = useGetMe();
  const { data: health, isLoading: healthLoading, error: healthError } = useHealthCheck();
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useGetMetrics();
  const isReady = health?.status === 'ready';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Session, backend readiness, and operational diagnostics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              Active Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="truncate text-sm font-medium">{me?.user?.email || 'Unknown'}</p>
            <Badge variant="secondary" className="capitalize">{me?.user?.role || 'unknown'}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Server className="h-4 w-4 text-muted-foreground" />
              API Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {healthLoading ? <Skeleton className="h-6 w-24" /> : healthError ? <Badge variant="destructive">Unavailable</Badge> : <StatusBadge ready={isReady} />}
            <p className="text-xs text-muted-foreground">Role: {health?.role || 'unknown'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {healthLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <Badge variant={health?.dependencies?.database ? 'default' : 'destructive'}>
                {health?.dependencies?.database ? 'Connected' : 'Unavailable'}
              </Badge>
            )}
            <p className="text-xs text-muted-foreground">Reported by `/health`.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metrics</CardTitle>
          <CardDescription>Prometheus output from the backend.</CardDescription>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          ) : metricsError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">Failed to load metrics.</p>
              <p className="mt-1 text-sm text-muted-foreground">{metricsError.message}</p>
            </div>
          ) : (
            <pre className="max-h-[520px] overflow-auto rounded-md bg-muted p-4 text-xs leading-relaxed">
              {metrics?.prometheus || 'No metrics returned.'}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
