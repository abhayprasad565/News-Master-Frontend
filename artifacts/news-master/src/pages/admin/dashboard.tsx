import { 
  useGetReviewQueue, 
  useGetDeliveries, 
  useGetPublications,
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  ListChecks, 
  Send, 
  ScrollText, 
  AlertCircle, 
  ArrowRight, 
  Activity, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Flame,
  Radio,
  Server,
  Bot,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Progress } from '@/components/ui/progress';

interface PipelineMetrics {
  queue: {
    READY: number;
    RUNNING: number;
    RETRY: number;
    DEAD: number;
    MANUAL_REVIEW: number;
    SUCCEEDED: number;
    oldestAgeSeconds: number;
  };
  activeJobTypes: Array<{
    job_type: string;
    status: string;
    count: number;
  }>;
  deliveries24h: Array<{
    platform: string;
    format: string;
    status: string;
    count: number;
  }>;
  errorsLastHour: number;
  autopilot?: {
    enabled: boolean;
    mode: string;
    usedToday: number;
    maxPostsPerDay: number;
    minPriorityTier: string;
    decisions24h: Array<{ decision: string; count: number }>;
  };
}

export default function AdminDashboard() {
  const { data: queueData, isLoading: queueLoading } = useGetReviewQueue({ limit: 10 });
  const { data: deliveriesData, isLoading: deliveriesLoading } = useGetDeliveries({ status: 'FAILED', limit: 5 });
  const { data: publicationsData, isLoading: publicationsLoading } = useGetPublications({ limit: 5 });
  
  const { data: rankingData, isLoading: rankingLoading } = useQuery({
    queryKey: ['admin-ranking-dashboard'],
    queryFn: () => apiFetch<{ items: Array<{ tier?: string; urgent?: boolean; urgentEligible?: boolean; developmentType?: string }> }>('/api/admin/ranking?limit=5'),
  });

  const { 
    data: pipelineMetrics, 
    isLoading: metricsLoading,
    refetch: refetchMetrics,
    isFetching: metricsFetching 
  } = useQuery({
    queryKey: ['admin-pipeline-metrics'],
    queryFn: () => apiFetch<PipelineMetrics>('/api/admin/pipeline/metrics'),
    refetchInterval: 10000,
  });

  const queueCount = queueData?.items.length || 0;
  const failedDeliveriesCount = deliveriesData?.items.length || 0;
  const suppressedCount = rankingData?.items.filter((item) => item.tier === 'SUPPRESSED' || item.developmentType === 'DUPLICATE' || item.developmentType === 'MINOR_UPDATE').length || 0;

  const queue = pipelineMetrics?.queue || {
    READY: 0,
    RUNNING: 0,
    RETRY: 0,
    DEAD: 0,
    MANUAL_REVIEW: 0,
    SUCCEEDED: 0,
    oldestAgeSeconds: 0,
  };

  const totalActiveQueue = queue.READY + queue.RUNNING + queue.RETRY;
  const totalDeliveries24h = pipelineMetrics?.deliveries24h.reduce((acc, d) => acc + d.count, 0) || 0;
  const successfulDeliveries24h = pipelineMetrics?.deliveries24h
    .filter(d => d.status === 'SENT')
    .reduce((acc, d) => acc + d.count, 0) || 0;
  const successRate24h = totalDeliveries24h > 0 
    ? Math.round((successfulDeliveries24h / totalDeliveries24h) * 100) 
    : 100;

  const formatAge = (seconds: number) => {
    if (seconds <= 0) return '0s';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Real-time overview of editorial operations, worker queue, and publication performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchMetrics()} 
            disabled={metricsFetching}
            className="text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${metricsFetching ? 'animate-spin' : ''}`} />
            Live Sync
          </Button>
        </div>
      </div>

      {/* Top Level Summary Cards (4-Column Layout) */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={queueCount > 0 ? "border-amber-200 bg-amber-50/30" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Backlog</CardTitle>
            <ListChecks className={`h-4 w-4 ${queueCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            {queueLoading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold">{queueCount} {queueData?.nextCursor && '+'}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Posts pending review</p>
            <Button variant="link" className="px-0 mt-2 h-auto text-xs" asChild>
              <Link href="/admin/review">View queue <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className={failedDeliveriesCount > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Deliveries</CardTitle>
            <AlertCircle className={`h-4 w-4 ${failedDeliveriesCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            {deliveriesLoading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold text-destructive">{failedDeliveriesCount} {deliveriesData?.nextCursor && '+'}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
            <Button variant="link" className="px-0 mt-2 h-auto text-xs text-destructive" asChild>
              <Link href="/admin/deliveries?status=FAILED">View failures <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranked Feed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {rankingLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{rankingData?.items.length || 0}</div>}
            <p className="text-xs text-muted-foreground mt-1">{suppressedCount} duplicate/minor</p>
            <Button variant="link" className="px-0 mt-2 h-auto text-xs" asChild>
              <Link href="/admin/ranking">Open ranking <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Published</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold flex items-center gap-1.5">
                {successfulDeliveries24h}
                <span className="text-xs font-normal text-muted-foreground">({successRate24h}%)</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Success rate: {successRate24h}%</p>
            <Button variant="link" className="px-0 mt-2 h-auto text-xs" asChild>
              <Link href="/admin/publications">View log <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Operational Metrics Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        
        {/* Pipeline Queue Health */}
        <Card className="col-span-1 border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Pipeline Queue & Worker</CardTitle>
              </div>
              <Badge variant={queue.RUNNING > 0 ? "default" : "outline"} className="gap-1 text-xs">
                <Radio className={`h-2.5 w-2.5 ${queue.RUNNING > 0 ? 'text-emerald-400 animate-pulse' : 'text-muted-foreground'}`} />
                {queue.RUNNING > 0 ? `${queue.RUNNING} Running` : 'Idle'}
              </Badge>
            </div>
            <CardDescription>Live job state across collector, LLM, rendering, and publishing workers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {metricsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <>
                {/* Visual Queue Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="p-2.5 rounded-lg border bg-muted/30">
                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3 text-sky-500" />
                      Ready / Backlog
                    </div>
                    <div className="text-xl font-bold mt-1 text-foreground">
                      {queue.READY.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border bg-muted/30">
                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 text-amber-500" />
                      Retry Queue
                    </div>
                    <div className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400">
                      {queue.RETRY.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border bg-muted/30">
                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                      Dead Jobs
                    </div>
                    <div className="text-xl font-bold mt-1 text-destructive">
                      {queue.DEAD.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border bg-muted/30">
                    <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Succeeded
                    </div>
                    <div className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                      {queue.SUCCEEDED.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Active Jobs by Stage */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Active Job Breakdown
                  </div>
                  {pipelineMetrics?.activeJobTypes && pipelineMetrics.activeJobTypes.length > 0 ? (
                    <div className="divide-y rounded-md border text-xs">
                      {pipelineMetrics.activeJobTypes.map((job, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 hover:bg-muted/40">
                          <span className="font-mono font-medium">{job.job_type}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={job.status === 'RUNNING' ? 'default' : 'secondary'} className="text-[10px] py-0">
                              {job.status}
                            </Badge>
                            <span className="font-bold">{job.count.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground py-2 text-center border rounded-md">Queue is currently clear.</p>
                  )}
                </div>

                {/* Queue Health Footer */}
                <div className="flex items-center justify-between pt-1 border-t text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Oldest waiting job: <strong className="text-foreground">{formatAge(queue.oldestAgeSeconds)}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Errors last hr: <strong className={pipelineMetrics?.errorsLastHour && pipelineMetrics.errorsLastHour > 0 ? 'text-destructive font-bold' : 'text-foreground'}>{pipelineMetrics?.errorsLastHour ?? 0}</strong></span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 24-Hour Publishing Distribution */}
        <Card className="col-span-1 border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Publishing & Deliveries (24h)</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                {totalDeliveries24h} total events
              </Badge>
            </div>
            <CardDescription>Publication throughput across Telegram, Instagram, and social channels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {metricsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <>
                {/* Success Rate Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Delivery Success Rate</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{successRate24h}%</span>
                  </div>
                  <Progress value={successRate24h} className="h-2" />
                </div>

                {/* Platform Breakdown Cards */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Platform Status Breakdown
                  </div>
                  {pipelineMetrics?.deliveries24h && pipelineMetrics.deliveries24h.length > 0 ? (
                    <div className="divide-y rounded-md border text-xs">
                      {pipelineMetrics.deliveries24h.map((d, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 hover:bg-muted/40">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold capitalize">{d.platform}</span>
                            <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground">{d.format}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={d.status === 'SENT' ? 'secondary' : d.status === 'FAILED' ? 'destructive' : 'default'} 
                              className={`text-[10px] py-0 ${d.status === 'SENT' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' : ''}`}
                            >
                              {d.status}
                            </Badge>
                            <span className="font-bold text-sm">{d.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground py-4 text-center border rounded-md">No deliveries in the last 24 hours.</p>
                  )}
                </div>

                {/* Distribution Links */}
                <div className="flex items-center justify-between pt-1 border-t">
                  <Button variant="link" className="px-0 h-auto text-xs" asChild>
                    <Link href="/admin/deliveries">All Deliveries <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                  <Button variant="link" className="px-0 h-auto text-xs" asChild>
                    <Link href="/admin/publications">Publications Log <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Autopilot Operations Card */}
        {pipelineMetrics?.autopilot && (
          <Card className="col-span-1 lg:col-span-2 border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Autopilot & Auto-Approval Engine</CardTitle>
                </div>
                <Badge variant={pipelineMetrics.autopilot.mode === 'enabled' ? 'default' : 'secondary'} className="text-xs capitalize">
                  {pipelineMetrics.autopilot.mode === 'enabled' ? 'Publishing Live' : pipelineMetrics.autopilot.mode === 'shadow' ? 'Shadow Mode (Evaluating)' : 'Disabled'}
                </Badge>
              </div>
              <CardDescription>Automated verification and candidate evaluations across sources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg border bg-muted/20">
                  <div className="text-xs text-muted-foreground font-medium">Daily Auto-Publish Quota</div>
                  <div className="text-xl font-bold mt-1">
                    {pipelineMetrics.autopilot.usedToday} / {pipelineMetrics.autopilot.maxPostsPerDay}
                  </div>
                  <Progress 
                    value={pipelineMetrics.autopilot.maxPostsPerDay > 0 ? (pipelineMetrics.autopilot.usedToday / pipelineMetrics.autopilot.maxPostsPerDay) * 100 : 0} 
                    className="h-1.5 mt-2" 
                  />
                </div>

                <div className="p-3 rounded-lg border bg-muted/20">
                  <div className="text-xs text-muted-foreground font-medium">Auto-Approval Gate</div>
                  <div className="text-xl font-bold mt-1">
                    Tier: {pipelineMetrics.autopilot.minPriorityTier}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pipelineMetrics.autopilot.enabled ? 'Evaluates verified candidates' : 'Feature currently paused'}
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/20 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">24h Decisions</div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {pipelineMetrics.autopilot.decisions24h && pipelineMetrics.autopilot.decisions24h.length > 0 ? (
                        pipelineMetrics.autopilot.decisions24h.map((d, i) => (
                          <Badge key={i} variant={d.decision === 'APPROVED' || d.decision === 'WOULD_APPROVE' ? 'secondary' : 'outline'} className="text-[10px] py-0">
                            {d.decision}: {d.count}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">0 evaluated</span>
                      )}
                    </div>
                  </div>
                  <Button variant="link" className="px-0 h-auto text-xs self-start mt-2" asChild>
                    <Link href="/admin/autopilot">View All Decisions <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
