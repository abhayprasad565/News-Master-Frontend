import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { BarChart3, Eye, RefreshCcw, Rocket, Search, ShieldMinus } from 'lucide-react';
import { apiFetch, toQuery } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

type RankingItem = {
  id: string;
  assessmentId?: string;
  title?: string;
  summary?: string;
  category?: string;
  primaryCategory?: string;
  secondaryTopics?: string[];
  developmentType?: string;
  importanceScore?: number;
  score?: number;
  tier?: string;
  novelty?: string;
  status?: string;
  sourceCount?: number;
  firstSeenAt?: string;
  urgent?: boolean;
  urgentEligible?: boolean;
  matchedRules?: Array<{ displayName?: string; stableKey?: string; mode?: string }>;
  reasons?: string[];
};

type RankingResponse = {
  items: RankingItem[];
  nextCursor?: string | null;
};

export default function AdminRanking() {
  const [category, setCategory] = useState('all');
  const [tier, setTier] = useState('all');
  const [novelty, setNovelty] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const query = useMemo(
    () =>
      toQuery({
        category: category === 'all' ? undefined : category,
        tier: tier === 'all' ? undefined : tier,
        novelty: novelty === 'all' ? undefined : novelty,
        status: status === 'all' ? undefined : status,
        limit: 50,
      }),
    [category, tier, novelty, status],
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-ranking', query],
    queryFn: () => apiFetch<RankingResponse>(`/api/admin/ranking${query}`),
  });

  const items = (data?.items || []).filter((item) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${item.title || ''} ${item.summary || ''} ${item.category || item.primaryCategory || ''}`
      .toLowerCase()
      .includes(needle);
  });

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Five-Minute Ranking</h1>
          <p className="mt-1 text-muted-foreground text-sm sm:text-base">Ranked feed, urgent eligibility, and score explanations.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="self-start sm:self-auto">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_160px_160px_180px_160px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search ranking feed" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="politics">Politics</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="sports">Sports</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tiers</SelectItem>
            {['URGENT', 'HIGH', 'STANDARD', 'LOW', 'SUPPRESSED'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={novelty} onValueChange={setNovelty}>
          <SelectTrigger><SelectValue placeholder="Novelty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All novelty</SelectItem>
            {['NEW_EVENT', 'MATERIAL_UPDATE', 'MINOR_UPDATE', 'DUPLICATE'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {['UNPUBLISHED', 'PUBLISHED', 'QUEUED', 'SUPPRESSED'].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

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
            <div className="p-8 text-center text-destructive">Failed to load ranking feed.</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No ranked items match the current filters.</div>
          ) : (
            items.map((item) => {
              const id = item.assessmentId || item.id;
              const tierValue = item.tier || 'STANDARD';
              const isUuid = (str?: string) => !str || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
              const topicsText = (item.secondaryTopics || []).filter(Boolean).join(' • ');
              const displayTitle = !isUuid(item.title)
                ? item.title!
                : !isUuid(item.summary)
                  ? item.summary!
                  : topicsText || item.primaryCategory || item.category || `Signal ${id.slice(0, 8)}`;
              return (
                <div key={id} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={tierValue === 'URGENT' ? 'destructive' : 'secondary'}>{tierValue}</Badge>
                      <Badge variant="outline">{item.developmentType || item.novelty || 'UNKNOWN'}</Badge>
                      {(item.urgent || item.urgentEligible) && <Badge className="bg-red-600"><Rocket className="mr-1 h-3 w-3" />Urgent</Badge>}
                    </div>
                    <span className="font-mono font-bold text-sm">Score: {item.importanceScore ?? item.score ?? '-'}</span>
                  </div>

                  <Link href={`/admin/ranking/${id}`} className="font-semibold text-base block hover:underline text-foreground leading-snug">
                    {displayTitle}
                  </Link>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[11px]">{item.primaryCategory || item.category || 'uncategorized'}</Badge>
                    {(item.secondaryTopics || []).slice(0, 3).map((topic) => <Badge key={topic} variant="secondary" className="text-[11px]">{topic}</Badge>)}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t text-xs text-muted-foreground">
                    <span>{item.sourceCount ?? 0} sources {item.firstSeenAt && `• ${formatDistanceToNow(new Date(item.firstSeenAt), { addSuffix: true })}`}</span>
                    <Button variant="outline" size="sm" asChild className="h-8 px-3 text-xs">
                      <Link href={`/admin/ranking/${id}`}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> View Signal
                      </Link>
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
                <th className="px-4 py-3 font-medium">Story Signal</th>
                <th className="px-4 py-3 font-medium">Novelty</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Sources</th>
                <th className="px-4 py-3 font-medium">Rules</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}><td colSpan={7} className="px-4 py-4"><Skeleton className="h-8 w-full" /></td></tr>
                ))
              ) : error ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-destructive">Failed to load ranking feed.</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">No ranked items match the current filters.</td></tr>
              ) : (
                items.map((item) => {
                  const id = item.assessmentId || item.id;
                  const tierValue = item.tier || 'STANDARD';
                  const deEmphasized = item.developmentType === 'DUPLICATE' || item.developmentType === 'MINOR_UPDATE' || tierValue === 'SUPPRESSED';
                  const isUuid = (str?: string) => !str || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
                  const topicsText = (item.secondaryTopics || []).filter(Boolean).join(' • ');
                  const displayTitle = !isUuid(item.title)
                    ? item.title!
                    : !isUuid(item.summary)
                      ? item.summary!
                      : topicsText || item.primaryCategory || item.category || `Signal ${id.slice(0, 8)}`;
                  return (
                    <tr key={id} className={deEmphasized ? 'bg-muted/20 text-muted-foreground' : 'hover:bg-muted/30'}>
                      <td className="px-4 py-3">
                        <div className="max-w-md">
                          <Link href={`/admin/ranking/${id}`} className="font-medium text-foreground hover:underline">
                            {displayTitle}
                          </Link>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Badge variant="outline">{item.primaryCategory || item.category || 'uncategorized'}</Badge>
                            {(item.secondaryTopics || []).slice(0, 3).map((topic) => <Badge key={topic} variant="secondary">{topic}</Badge>)}
                            {(item.urgent || item.urgentEligible) && <Badge className="bg-red-600"><Rocket className="mr-1 h-3 w-3" />Urgent</Badge>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline">{item.developmentType || item.novelty || 'UNKNOWN'}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-base font-semibold">{item.importanceScore ?? item.score ?? '-'}</div>
                        <Badge variant={tierValue === 'URGENT' ? 'destructive' : 'secondary'}>{tierValue}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div>{item.sourceCount ?? '-'}</div>
                        {item.firstSeenAt && <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.firstSeenAt), { addSuffix: true })}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex max-w-[180px] flex-wrap gap-1">
                          {(item.matchedRules || []).slice(0, 2).map((rule, index) => (
                            <Badge key={`${rule.stableKey || rule.displayName}-${index}`} variant="outline">{rule.displayName || rule.stableKey || rule.mode}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3"><Badge variant="secondary">{item.status || 'ACTIVE'}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" asChild><Link href={`/admin/ranking/${id}`}><Eye className="h-4 w-4" /></Link></Button>
                          <Button size="icon" variant="ghost" asChild><Link href={`/admin/ranking/${id}?action=reassess`}><BarChart3 className="h-4 w-4" /></Link></Button>
                          <Button size="icon" variant="ghost" asChild><Link href={`/admin/ranking/${id}?action=promote`}><Rocket className="h-4 w-4" /></Link></Button>
                          <Button size="icon" variant="ghost" asChild><Link href={`/admin/ranking/${id}?action=suppress`}><ShieldMinus className="h-4 w-4" /></Link></Button>
                        </div>
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
