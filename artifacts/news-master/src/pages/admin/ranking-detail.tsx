import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RefreshCcw, Rocket, ShieldMinus } from 'lucide-react';
import { apiFetch, FrontendApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type Assessment = Record<string, any>;

const scoreComponents = [
  ['consequence', 'Consequence', 30],
  ['novelty', 'Novelty', 25],
  ['sourceAuthority', 'Source authority', 15],
  ['recency', 'Recency', 15],
  ['crossSourceVelocity', 'Cross-source velocity', 10],
  ['indiaRelevance', 'India relevance', 5],
] as const;

type RankingAction = 'reassess' | 'promote' | 'suppress';

export default function AdminRankingDetail() {
  const { id } = useParams();
  const [action, setAction] = useState<RankingAction | null>(null);
  const [reason, setReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-ranking-detail', id],
    queryFn: () => apiFetch<Assessment>(`/api/admin/ranking/${id}`),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: ({ action: nextAction, reason: nextReason }: { action: RankingAction; reason: string }) =>
      apiFetch(`/api/admin/ranking/${id}/${nextAction}`, {
        method: 'POST',
        body: JSON.stringify({ reason: nextReason }),
      }),
    onSuccess: (_result, variables) => {
      toast({ title: variables.action === 'reassess' ? 'Reassessment queued' : 'Ranking action recorded' });
      queryClient.invalidateQueries({ queryKey: ['admin-ranking-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-ranking'] });
      setAction(null);
      setReason('');
    },
    onError: (err) => {
      const apiError = err as FrontendApiError;
      toast({
        title: 'Action failed',
        description: apiError.requestId ? `${apiError.message} (${apiError.requestId})` : apiError.message,
        variant: 'destructive',
      });
    },
  });

  const assessment = data?.assessment || data;
  const components = assessment?.scoreComponents || assessment?.components || {};
  const finalScore = assessment?.finalScore ?? assessment?.importanceScore ?? assessment?.score;

  return (
    <div className="space-y-6">
      <Link href="/admin/ranking" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to ranking
      </Link>

      {isLoading ? (
        <div className="space-y-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-[420px] w-full" /></div>
      ) : error || !assessment ? (
        <Card><CardContent className="py-12 text-center text-destructive">Failed to load assessment.</CardContent></Card>
      ) : (
        <>
          {(() => {
            const isUuid = (str?: string) => !str || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
            const topicsText = (assessment?.secondaryTopics || []).filter(Boolean).join(' • ');
            const displayTitle = !isUuid(assessment?.title)
              ? assessment?.title!
              : !isUuid(assessment?.summary)
                ? assessment?.summary!
                : !isUuid(assessment?.developmentSummary)
                  ? assessment?.developmentSummary!
                  : topicsText || assessment?.primaryCategory || assessment?.category || `Assessment ${id?.slice(0, 8)}`;

            return (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{displayTitle}</h1>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{assessment.primaryCategory || assessment.category || 'uncategorized'}</Badge>
                    <Badge variant={assessment.tier === 'URGENT' ? 'destructive' : 'secondary'}>{assessment.tier || 'STANDARD'}</Badge>
                    <Badge variant="outline">{assessment.developmentType || assessment.novelty || 'UNKNOWN'}</Badge>
                    {assessment.policyVersion && <Badge variant="outline">Policy {assessment.policyVersion}</Badge>}
                    {assessment.modelVersion && <Badge variant="outline">Model {assessment.modelVersion}</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setAction('reassess')}><RefreshCcw className="mr-2 h-4 w-4" />Reassess</Button>
                  <Button onClick={() => setAction('promote')}><Rocket className="mr-2 h-4 w-4" />Promote</Button>
                  <Button variant="destructive" onClick={() => setAction('suppress')}><ShieldMinus className="mr-2 h-4 w-4" />Suppress</Button>
                </div>
              </div>
            );
          })()}

          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <Card>
              <CardHeader><CardTitle>Score Explanation</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-muted p-4">
                  <div className="text-sm text-muted-foreground">Final score</div>
                  <div className="text-4xl font-bold">{finalScore ?? '-'}</div>
                  {assessment.topicBoost !== undefined && <div className="mt-1 text-sm text-muted-foreground">Topic boost: {assessment.topicBoost}</div>}
                </div>
                {scoreComponents.map(([key, label, max]) => {
                  const value = Number(components[key] ?? assessment[key] ?? 0);
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-sm"><span>{label}</span><span className="font-mono">{value}/{max}</span></div>
                      <Progress value={Math.min(100, (value / max) * 100)} />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Urgent Gates</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Urgent eligible" value={assessment.urgentEligible || assessment.urgent ? 'Yes' : 'No'} />
                <Row label="Source count" value={assessment.sourceCount ?? '-'} />
                <Row label="Development fingerprint" value={assessment.developmentFingerprint || '-'} mono />
                <Row label="Sensitive flags" value={(assessment.sensitiveFlags || []).join(', ') || 'None'} />
                {(assessment.urgentBlockers || []).length > 0 && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                    {(assessment.urgentBlockers || []).join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Evidence</CardTitle></CardHeader>
              <CardContent>
                <pre className="max-h-[360px] overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(assessment.evidence || assessment.supportingArticle || {}, null, 2)}</pre>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Matched Rules</CardTitle></CardHeader>
              <CardContent>
                <pre className="max-h-[360px] overflow-auto rounded-md bg-muted p-4 text-xs">{JSON.stringify(assessment.matchedRules || [], null, 2)}</pre>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Dialog open={!!action} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action ? `${action[0].toUpperCase()}${action.slice(1)} assessment` : 'Ranking action'}</DialogTitle>
            <DialogDescription>A reason is required and will be included in the audit trail.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain the editorial decision..." className="min-h-28" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button disabled={!reason.trim() || mutation.isPending || !action} onClick={() => action && mutation.mutate({ action, reason })}>
              {mutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: unknown; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs' : 'font-medium'}>{String(value)}</span>
    </div>
  );
}
