import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { AlertTriangle, Clock, Eye, Rocket, ShieldAlert } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

type UrgentCandidate = {
  id: string;
  assessmentId?: string;
  title?: string;
  summary?: string;
  score?: number;
  ageMinutes?: number;
  sourceSufficient?: boolean;
  confidence?: number;
  graphicReady?: boolean;
  dailyCapUsed?: number;
  dailyCap?: number;
  globalCooldownRemainingSeconds?: number;
  eventCooldownRemainingSeconds?: number;
  sensitiveBlockers?: string[];
  decision?: 'WOULD_PUBLISH' | 'PUBLISHED' | 'REVIEW_REQUIRED' | 'BLOCKED' | string;
  shadowDecision?: string;
  adminDecision?: string;
  shadowMode?: boolean;
};

type UrgentResponse = {
  mode?: 'shadow' | 'enabled' | string;
  dailyCap?: number;
  dailyCapUsed?: number;
  globalCooldownMinutes?: number;
  eventCooldownHours?: number;
  shadowPrerequisiteDays?: number;
  items: UrgentCandidate[];
};

export default function AdminUrgent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-urgent'],
    queryFn: () => apiFetch<UrgentResponse>('/api/admin/urgent'),
  });

  const mode = data?.mode || 'shadow';
  const enabled = mode === 'enabled';

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Urgent Queue</h1>
          <p className="mt-1 text-muted-foreground text-sm sm:text-base">Urgent candidates, shadow decisions, blockers, cooldowns, and automatic-posting caps.</p>
        </div>
        <Badge variant={enabled ? 'default' : 'secondary'} className="text-sm self-start sm:self-auto">
          {enabled ? 'Enabled mode' : 'Shadow mode'}
        </Badge>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <StatusCard title="Daily cap" value={`${data?.dailyCapUsed ?? 0}/${data?.dailyCap ?? 20}`} icon={<Rocket className="h-4 w-4" />} />
        <StatusCard title="Global cooldown" value={`${data?.globalCooldownMinutes ?? 15} min`} icon={<Clock className="h-4 w-4" />} />
        <StatusCard title="Event cooldown" value={`${data?.eventCooldownHours ?? 4} hr`} icon={<ShieldAlert className="h-4 w-4" />} />
        <StatusCard title="Shadow prerequisite" value={`${data?.shadowPrerequisiteDays ?? 7} days`} icon={<Eye className="h-4 w-4" />} />
      </div>

      {!enabled && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex items-start gap-3 py-4 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-medium">Shadow decisions are recommendations only.</p>
              <p className="text-sm">The UI separates AI recommendations from eventual admin decisions and never marks shadow recommendations as published.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden w-full">
        {/* Mobile View */}
        <div className="block md:hidden divide-y">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="p-4 space-y-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))
          ) : error ? (
            <div className="p-8 text-center text-destructive">Failed to load urgent queue.</div>
          ) : !data?.items?.length ? (
            <div className="p-12 text-center text-muted-foreground">No urgent candidates.</div>
          ) : (
            data.items.map((item) => {
              const id = item.assessmentId || item.id;
              const blocked = item.decision === 'BLOCKED' || Boolean(item.sensitiveBlockers?.length);
              const isUuid = (str?: string) => !str || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
              const candidateTitle = !isUuid(item.title)
                ? item.title!
                : !isUuid(item.summary)
                  ? item.summary!
                  : `Candidate ${id.slice(0, 8)}`;
              return (
                <div key={id} className={`p-4 space-y-3 ${blocked ? 'bg-destructive/5' : 'hover:bg-muted/20'} transition-colors`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Badge variant={blocked ? 'destructive' : item.decision === 'PUBLISHED' ? 'default' : 'secondary'}>
                      {item.decision || 'REVIEW_REQUIRED'}
                    </Badge>
                    <span className="font-mono font-bold text-sm">Score: {item.score ?? '-'} ({Math.round((item.confidence || 0) * 100)}%)</span>
                  </div>

                  <Link href={`/admin/ranking/${id}`} className="font-semibold text-base block hover:underline text-foreground leading-snug">
                    {candidateTitle}
                  </Link>

                  {(item.sensitiveBlockers || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.sensitiveBlockers!.map((blocker) => <Badge key={blocker} variant="destructive" className="text-[11px]">{blocker}</Badge>)}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-md">
                    <div>
                      <span className="text-muted-foreground">Age:</span> {item.ageMinutes ?? '-'} min
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cooldown:</span> {item.globalCooldownRemainingSeconds ?? 0}s
                    </div>
                    <div className="col-span-2 flex items-center gap-3 pt-1">
                      <Readiness label="Sources" ready={item.sourceSufficient} />
                      <Readiness label="Graphic" ready={item.graphicReady} />
                      <Readiness label="Cap" ready={(item.dailyCapUsed ?? 0) < (item.dailyCap ?? data.dailyCap ?? 6)} />
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <Button variant="outline" size="sm" asChild className="h-8 px-3 text-xs w-full sm:w-auto">
                      <Link href={`/admin/ranking/${id}`}>Inspect Candidate</Link>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left text-sm table-auto">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Readiness</th>
                <th className="px-4 py-3 font-medium">Cooldowns</th>
                <th className="px-4 py-3 font-medium">Decision</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => <tr key={index}><td colSpan={6} className="px-4 py-4"><Skeleton className="h-8 w-full" /></td></tr>)
              ) : error ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-destructive">Failed to load urgent queue.</td></tr>
              ) : !data?.items?.length ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">No urgent candidates.</td></tr>
              ) : (
                data.items.map((item) => {
                  const id = item.assessmentId || item.id;
                  const blocked = item.decision === 'BLOCKED' || Boolean(item.sensitiveBlockers?.length);
                  const isUuid = (str?: string) => !str || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
                  const candidateTitle = !isUuid(item.title)
                    ? item.title!
                    : !isUuid(item.summary)
                      ? item.summary!
                      : `Candidate ${id.slice(0, 8)}`;
                  return (
                    <tr key={id} className={blocked ? 'bg-destructive/5' : 'hover:bg-muted/30'}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{candidateTitle}</div>
                        <div className="mt-1 text-xs text-muted-foreground">Age: {item.ageMinutes ?? '-'} min</div>
                        {(item.sensitiveBlockers || []).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {item.sensitiveBlockers!.map((blocker) => <Badge key={blocker} variant="destructive">{blocker}</Badge>)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-lg font-semibold">{item.score ?? '-'}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <Progress value={Math.round((item.confidence || 0) * 100)} className="h-2 w-24" />
                          <span className="text-xs text-muted-foreground">{Math.round((item.confidence || 0) * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <Readiness label="Sources" ready={item.sourceSufficient} />
                          <Readiness label="Graphic" ready={item.graphicReady} />
                          <Readiness label="Cap" ready={(item.dailyCapUsed ?? 0) < (item.dailyCap ?? data.dailyCap ?? 6)} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div>Global: {item.globalCooldownRemainingSeconds ?? 0}s</div>
                        <div>Event: {item.eventCooldownRemainingSeconds ?? 0}s</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={blocked ? 'destructive' : item.decision === 'PUBLISHED' ? 'default' : 'secondary'}>{item.decision || 'REVIEW_REQUIRED'}</Badge>
                        {mode === 'shadow' && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            AI: {item.shadowDecision || 'none'}<br />
                            Admin: {item.adminDecision || 'pending'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/ranking/${id}`}>Inspect</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatusCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
}

function Readiness({ label, ready }: { label: string; ready?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant={ready ? 'default' : 'destructive'}>{ready ? 'Ready' : 'Blocked'}</Badge>
    </div>
  );
}
