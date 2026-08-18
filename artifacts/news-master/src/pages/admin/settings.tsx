import { useState, useEffect } from 'react';
import { useGetMe, useGetMetrics, useHealthCheck } from '@workspace/api-client-react';
import { Activity, CheckCircle2, Server, ShieldAlert, User, Moon, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { apiFetch } from '@/lib/api';

function StatusBadge({ ready }: { ready: boolean }) {
  return (
    <Badge 
      variant={ready ? 'outline' : 'destructive'} 
      className={ready ? 'gap-1 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium' : 'gap-1'}
    >
      {ready ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <ShieldAlert className="h-3.5 w-3.5" />}
      {ready ? 'Ready' : 'Not ready'}
    </Badge>
  );
}

export default function AdminSettings() {
  const { data: me } = useGetMe();
  const { data: health, isLoading: healthLoading, error: healthError } = useHealthCheck();
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useGetMetrics();
  const isReady = health?.status === 'ready';

  const [rssActive, setRssActive] = useState(true);
  const [llmActive, setLlmActive] = useState(true);

  useEffect(() => {
    apiFetch<{ rssActive: boolean; llmActive: boolean }>('/api/admin/pipeline/status')
      .then((data) => {
        if (typeof data.rssActive === 'boolean') setRssActive(data.rssActive);
        if (typeof data.llmActive === 'boolean') setLlmActive(data.llmActive);
      })
      .catch(() => {});
  }, []);

  const handleToggleRss = (active: boolean) => {
    setRssActive(active);
    apiFetch('/api/admin/pipeline/controls', {
      method: 'POST',
      body: JSON.stringify({ rssActive: active, llmActive }),
    }).catch(() => {});
  };

  const handleToggleLlm = (active: boolean) => {
    setLlmActive(active);
    apiFetch('/api/admin/pipeline/controls', {
      method: 'POST',
      body: JSON.stringify({ rssActive, llmActive: active }),
    }).catch(() => {});
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground text-sm sm:text-base">Session, backend readiness, and operational diagnostics.</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
              <Badge 
                variant={health?.dependencies?.database === 'healthy' ? 'outline' : 'destructive'}
                className={health?.dependencies?.database === 'healthy' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium' : ''}
              >
                {health?.dependencies?.database === 'healthy' ? 'Connected' : 'Unavailable'}
              </Badge>
            )}
            <p className="text-xs text-muted-foreground">Reported by `/health`.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="h-4 w-4 text-amber-500" />
            Nightly Credit Saver & Pipeline Controls
          </CardTitle>
          <CardDescription>Toggle automated RSS ingestion and LLM processing on/off to save API credits during overnight hours.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4 transition-colors">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">RSS Feed Collectors</p>
                <Badge variant="outline" className={rssActive ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" : "bg-muted text-muted-foreground"}>
                  {rssActive ? "Active" : "Paused"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Automatically polls RSS feeds (Times of India, Hindu, ISRO, RBI).</p>
            </div>
            <Switch checked={rssActive} onCheckedChange={handleToggleRss} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4 transition-colors">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">LLM Processing & Fact Verification</p>
                <Badge variant="outline" className={llmActive ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" : "bg-muted text-muted-foreground"}>
                  {llmActive ? "Active" : "Paused"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Triggers OpenRouter/DeepSeek claim extraction, topic ranking, and post drafting.</p>
            </div>
            <Switch checked={llmActive} onCheckedChange={handleToggleLlm} />
          </div>
        </CardContent>
      </Card>

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
