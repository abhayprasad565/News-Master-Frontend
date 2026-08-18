import { useQuery } from '@tanstack/react-query';
import { Bot, CheckCircle2, Clock3, ShieldAlert, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

type AutopilotDecision = {
  id: string;
  postId: string;
  developmentId: string | null;
  mode: 'SHADOW' | 'ENABLED' | 'DISABLED' | string;
  decision: 'WOULD_APPROVE' | 'APPROVED' | 'BLOCKED' | 'SKIPPED_QUOTA' | 'FAILED' | string;
  reasonCodes: string[];
  scoreSnapshot: {
    priorityTier?: string;
    importanceScore?: number;
    primaryCategory?: string;
    modelConfidence?: number;
  };
  destinationSnapshot: Array<{ platform: string; destination: string }>;
  visualAssetType: string | null;
  createdPublicationId: string | null;
  decidedAt: string;
};

type AutopilotResponse = {
  enabled: boolean;
  mode: 'shadow' | 'enabled' | 'disabled' | string;
  maxPostsPerDay: number;
  usedToday: number;
  remainingToday: number;
  minPriorityTier: string;
  allowStandard: boolean;
  globalSpacingMinutes: number;
  perTopicMaxPerDay: number;
  urgentReservedPerDay: number;
  decisions: AutopilotDecision[];
};

export default function AdminAutopilot() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-autopilot'],
    queryFn: () => apiFetch<AutopilotResponse>('/api/admin/autopilot'),
  });

  const mode = data?.mode ?? 'shadow';
  const active = data?.enabled && mode === 'enabled';
  const used = data?.usedToday ?? 0;
  const cap = data?.maxPostsPerDay ?? 12;
  const percent = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Autopilot</h1>
          <p className="mt-1 text-muted-foreground text-sm sm:text-base">
            Auto-approval decisions for verified posts that can publish without manual approval.
          </p>
        </div>
        <Badge variant={active ? 'default' : 'secondary'} className="text-sm self-start sm:self-auto">
          {active ? 'Publishing' : mode === 'shadow' ? 'Shadow mode' : 'Disabled'}
        </Badge>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <StatusCard title="Daily quota" value={`${used}/${cap}`} icon={<Bot className="h-4 w-4" />} />
        <StatusCard title="Remaining" value={String(data?.remainingToday ?? cap)} icon={<Clock3 className="h-4 w-4" />} />
        <StatusCard title="Minimum tier" value={data?.minPriorityTier ?? 'HIGH'} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatusCard title="Topic cap" value={String(data?.perTopicMaxPerDay ?? 4)} icon={<ShieldAlert className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Progress value={percent} className="h-2" />
            <span className="w-12 text-right text-sm text-muted-foreground">{percent}%</span>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            Standard stories are {data?.allowStandard ? 'eligible when quota allows' : 'not eligible'}.
            Global spacing is {data?.globalSpacingMinutes ?? 0} minutes.
            Urgent reserve is {data?.urgentReservedPerDay ?? 0} slots.
          </div>
        </CardContent>
      </Card>

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
            <div className="p-8 text-center text-destructive">Failed to load autopilot decisions.</div>
          ) : !data?.decisions?.length ? (
            <div className="p-12 text-center text-muted-foreground">No autopilot decisions yet.</div>
          ) : (
            data.decisions.map((item) => (
              <div key={item.id} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {item.decision === 'APPROVED' || item.decision === 'WOULD_APPROVE' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <Badge variant={variantFor(item.decision)}>{item.decision}</Badge>
                  </div>
                  <span className="font-mono font-bold text-sm">Score: {item.scoreSnapshot.importanceScore ?? '-'}</span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span>Post ID: {item.postId.slice(0, 10)}...</span>
                  <span>{item.scoreSnapshot.priorityTier ?? '-'} / {item.scoreSnapshot.primaryCategory ?? '-'}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {item.destinationSnapshot.map((destination) => (
                    <Badge key={`${destination.platform}:${destination.destination}`} variant="outline" className="text-[11px]">
                      {destination.platform}
                    </Badge>
                  ))}
                  {item.visualAssetType && (
                    <Badge variant="secondary" className="text-[11px]">{item.visualAssetType}</Badge>
                  )}
                </div>

                {item.reasonCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.reasonCodes.map((reason) => (
                      <Badge key={reason} variant="outline" className="text-[10px] text-muted-foreground">{reason}</Badge>
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-1 border-t">
                  {format(new Date(item.decidedAt), 'MMM d, yyyy HH:mm:ss')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left text-sm table-auto">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Decision</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Destinations</th>
                <th className="px-4 py-3 font-medium">Blockers</th>
                <th className="px-4 py-3 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td colSpan={5} className="px-4 py-4"><Skeleton className="h-8 w-full" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-destructive">
                    Failed to load autopilot decisions.
                  </td>
                </tr>
              ) : !data?.decisions?.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                    No autopilot decisions yet.
                  </td>
                </tr>
              ) : (
                data.decisions.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.decision === 'APPROVED' || item.decision === 'WOULD_APPROVE' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                        <Badge variant={variantFor(item.decision)}>{item.decision}</Badge>
                      </div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">{item.postId.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-lg font-semibold">{item.scoreSnapshot.importanceScore ?? '-'}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.scoreSnapshot.priorityTier ?? '-'} / {item.scoreSnapshot.primaryCategory ?? '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.destinationSnapshot.map((destination) => (
                          <Badge key={`${destination.platform}:${destination.destination}`} variant="outline">
                            {destination.platform}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.visualAssetType ?? 'no asset'}</div>
                    </td>
                    <td className="px-4 py-3">
                      {item.reasonCodes.length ? (
                        <div className="flex flex-wrap gap-1">
                          {item.reasonCodes.map((reason) => <Badge key={reason} variant="secondary">{reason}</Badge>)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {format(new Date(item.decidedAt), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                  </tr>
                ))
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

function variantFor(decision: string) {
  if (decision === 'APPROVED') return 'default';
  if (decision === 'WOULD_APPROVE') return 'secondary';
  if (decision === 'SKIPPED_QUOTA') return 'outline';
  return 'destructive';
}
