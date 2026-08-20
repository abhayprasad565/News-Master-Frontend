import { useState, useMemo } from 'react';
import { AdminPostStatus, AdminPostKind } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { 
  Plus, Search, FileText, CheckCircle2, XCircle, Clock, Edit, CheckSquare, Film, ChevronLeft, ChevronRight, Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export default function AdminPostList() {
  const [status, setStatus] = useState<string>('all');
  const [kind, setKind] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState<number>(50);
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined]);
  const [datePreset, setDatePreset] = useState<string>('all');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  const currentCursor = cursorStack[cursorStack.length - 1];

  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    if (datePreset === 'today') {
      return { dateFrom: startOfDay(now).toISOString(), dateTo: endOfDay(now).toISOString() };
    }
    if (datePreset === 'yesterday') {
      const y = subDays(now, 1);
      return { dateFrom: startOfDay(y).toISOString(), dateTo: endOfDay(y).toISOString() };
    }
    if (datePreset === 'last7days') {
      return { dateFrom: subDays(now, 7).toISOString(), dateTo: endOfDay(now).toISOString() };
    }
    if (datePreset === 'last30days') {
      return { dateFrom: subDays(now, 30).toISOString(), dateTo: endOfDay(now).toISOString() };
    }
    if (datePreset === 'custom') {
      return {
        dateFrom: customFrom ? startOfDay(new Date(customFrom)).toISOString() : undefined,
        dateTo: customTo ? endOfDay(new Date(customTo)).toISOString() : undefined,
      };
    }
    return { dateFrom: undefined, dateTo: undefined };
  }, [datePreset, customFrom, customTo]);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['admin-posts', status, kind, limit, currentCursor, dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (kind !== 'all') params.set('kind', kind);
      params.set('limit', String(limit));
      if (currentCursor) params.set('cursor', currentCursor);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      return apiFetch<{ items: any[]; nextCursor: string | null }>(`/api/admin/posts?${params.toString()}`);
    },
  });

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setCursorStack([undefined]);
  };

  const handleKindChange = (val: string) => {
    setKind(val);
    setCursorStack([undefined]);
  };

  const handleLimitChange = (val: string) => {
    setLimit(Number(val));
    setCursorStack([undefined]);
  };

  const handleDatePresetChange = (val: string) => {
    setDatePreset(val);
    setCursorStack([undefined]);
  };

  const handleNextPage = () => {
    if (data?.nextCursor) {
      setCursorStack((prev) => [...prev, data.nextCursor!]);
    }
  };

  const handlePrevPage = () => {
    if (cursorStack.length > 1) {
      setCursorStack((prev) => prev.slice(0, -1));
    }
  };

  const getStatusBadge = (s: string) => {
    switch(s) {
      case 'PUBLISHED': return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1"/> Published</Badge>;
      case 'REVIEWED': return <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"><CheckCircle2 className="w-3 h-3 mr-1"/> Reviewed</Badge>;
      case 'DRAFT': return <Badge variant="secondary"><Edit className="w-3 h-3 mr-1"/> Draft</Badge>;
      case 'MANUAL_REVIEW': return <Badge variant="outline" className="border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30"><Clock className="w-3 h-3 mr-1"/> Review</Badge>;
      case 'REJECTED': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>;
      case 'VALIDATED': return <Badge variant="outline" className="border-blue-500 text-blue-600"><CheckSquare className="w-3 h-3 mr-1"/> Validated</Badge>;
      case 'VALIDATING': return <Badge variant="outline" className="border-purple-500 text-purple-600">Validating...</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  const getKindBadge = (k: string) => {
    switch(k) {
      case 'ORIGINAL': return <Badge variant="outline" className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Original</Badge>;
      case 'CORRECTION': return <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">Correction</Badge>;
      case 'CUSTOM': return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">Custom</Badge>;
      default: return <Badge variant="outline">{k}</Badge>;
    }
  };

  const currentPage = cursorStack.length;

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Posts</h1>
          <p className="text-muted-foreground mt-1">Manage editorial posts and their status.</p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center flex-wrap">
          <div className="relative flex-1 min-w-[220px] w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by title or text..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.values(AdminPostStatus).map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={kind} onValueChange={handleKindChange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Kind" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Kinds</SelectItem>
              {Object.values(AdminPostKind).map(k => (
                <SelectItem key={k} value={k}>{k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={datePreset} onValueChange={handleDatePresetChange}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last7days">Last 7 Days</SelectItem>
              <SelectItem value="last30days">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(limit)} onValueChange={handleLimitChange}>
            <SelectTrigger className="w-full sm:w-[130px]">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
              <SelectItem value="200">200 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {datePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/40 rounded-lg border text-sm">
            <span className="font-medium text-muted-foreground">From:</span>
            <Input
              type="date"
              className="w-auto h-8 text-xs"
              value={customFrom}
              onChange={(e) => {
                setCustomFrom(e.target.value);
                setCursorStack([undefined]);
              }}
            />
            <span className="font-medium text-muted-foreground">To:</span>
            <Input
              type="date"
              className="w-auto h-8 text-xs"
              value={customTo}
              onChange={(e) => {
                setCustomTo(e.target.value);
                setCursorStack([undefined]);
              }}
            />
          </div>
        )}
      </div>

      <Card className="w-full overflow-hidden">
        {/* Mobile View: Dedicated touch-friendly cards */}
        <div className="block lg:hidden divide-y">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : error ? (
            <div className="p-8 text-center text-destructive">Failed to load posts.</div>
          ) : !data?.items?.length ? (
            <div className="p-12 text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No posts found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search.</p>
            </div>
          ) : (
            data.items
              .filter(p => !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.text.toLowerCase().includes(search.toLowerCase()))
              .map((post) => {
                const postNum = (post as any).postNumber;
                const targetId = postNum ? String(postNum) : post.id;

                const isGenericOrUuid = (str?: string | null) =>
                  !str ||
                  !str.trim() ||
                  ['untitled', 'untitled post', 'unpublished post'].includes(str.trim().toLowerCase()) ||
                  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

                let displayTitle = `Post #${postNum || post.id.slice(0, 6)}`;
                if (!isGenericOrUuid(post.title)) {
                  displayTitle = post.title!;
                } else if (post.text && post.text.trim()) {
                  const cleanedText = (post.text.split(/source:\s*/i)[0] ?? post.text).trim();
                  const firstSentence = (cleanedText.split(/(?<=[.!?])\s+|\n+/)[0] ?? '').trim();
                  const headline = firstSentence.replace(/^[#*\s]+/, '').trim();
                  if (headline) displayTitle = headline.length > 90 ? `${headline.slice(0, 87)}...` : headline;
                }

                return (
                  <div key={post.id} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Link href={`/admin/posts/${targetId}`} className="font-mono font-bold text-primary text-sm hover:underline">
                        #{postNum || post.id.slice(0, 6)}
                      </Link>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getStatusBadge(post.status)}
                        {getKindBadge(post.kind)}
                      </div>
                    </div>

                    <Link href={`/admin/posts/${targetId}`} className="font-semibold text-base block hover:underline text-foreground leading-snug">
                      {displayTitle}
                    </Link>

                    {post.labels && post.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.labels.slice(0, 3).map((l: any) => (
                          <span key={l.id} className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-secondary text-secondary-foreground border">
                            {l.name}
                          </span>
                        ))}
                        {post.labels.length > 3 && (
                          <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-secondary text-secondary-foreground border">
                            +{post.labels.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t text-xs text-muted-foreground">
                      <span>{format(new Date(post.createdAt), 'MMM d, yyyy HH:mm')}</span>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button variant="outline" size="sm" asChild className="h-8 px-2.5 text-xs">
                          <Link href={`/admin/posts/${targetId}/video`}>
                            <Film className="h-3.5 w-3.5 mr-1" /> Video
                          </Link>
                        </Button>
                        {['DRAFT', 'MANUAL_REVIEW', 'REJECTED', 'VALIDATED'].includes(post.status) ? (
                          <Button variant="secondary" size="sm" asChild className="h-8 px-3 text-xs">
                            <Link href={`/admin/posts/${targetId}/edit`}>Edit</Link>
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" asChild className="h-8 px-3 text-xs">
                            <Link href={`/admin/posts/${targetId}`}>View</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden lg:block w-full overflow-x-auto">
          <table className="w-full text-sm text-left table-auto">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium w-16">#</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium w-28">Status</th>
                <th className="px-4 py-3 font-medium w-24">Kind</th>
                <th className="px-4 py-3 font-medium w-36">Labels</th>
                <th className="px-4 py-3 font-medium w-36">Created At</th>
                <th className="px-4 py-3 font-medium w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-10" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-full max-w-md" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-28" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-16" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-destructive">
                    Failed to load posts.
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">No posts found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your filters or search.</p>
                  </td>
                </tr>
              ) : (
                data.items.filter(p => !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.text.toLowerCase().includes(search.toLowerCase())).map((post) => {
                  const postNum = (post as any).postNumber;
                  const targetId = postNum ? String(postNum) : post.id;
                  return (
                  <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-primary whitespace-nowrap">
                      <Link href={`/admin/posts/${targetId}`} className="hover:underline">
                        #{postNum || post.id.slice(0, 6)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/posts/${targetId}`} className="font-medium hover:underline text-foreground line-clamp-1">
                        {(() => {
                          const isGenericOrUuid = (str?: string | null) =>
                            !str ||
                            !str.trim() ||
                            ['untitled', 'untitled post', 'unpublished post'].includes(str.trim().toLowerCase()) ||
                            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

                          if (!isGenericOrUuid(post.title)) return post.title!;
                          if (post.text && post.text.trim()) {
                            const cleanedText = (post.text.split(/source:\s*/i)[0] ?? post.text).trim();
                            const firstSentence = (cleanedText.split(/(?<=[.!?])\s+|\n+/)[0] ?? '').trim();
                            const headline = firstSentence.replace(/^[#*\s]+/, '').trim();
                            if (headline) return headline.length > 90 ? `${headline.slice(0, 87)}...` : headline;
                          }
                          return `Post #${postNum || post.id.slice(0, 6)}`;
                        })()}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(post.status)}</td>
                    <td className="px-4 py-3">{getKindBadge(post.kind)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(post.labels || []).slice(0, 2).map((l: any) => (
                          <span key={l.id} className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-secondary text-secondary-foreground border">
                            {l.name}
                          </span>
                        ))}
                        {post.labels && post.labels.length > 2 && (
                          <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-secondary text-secondary-foreground border">
                            +{post.labels.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(post.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" asChild title="Create Video">
                        <Link href={`/admin/posts/${targetId}/video`}><Film className="h-4 w-4" /></Link>
                      </Button>
                      {['DRAFT', 'MANUAL_REVIEW', 'REJECTED', 'VALIDATED'].includes(post.status) ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/posts/${targetId}/edit`}>Edit</Link>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/posts/${targetId}`}>View</Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground gap-3">
          <div>
            Showing {data?.items?.length || 0} posts {currentPage > 1 && `(Page ${currentPage})`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || isLoading || isFetching}
              className="h-8 px-3"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <span className="font-medium px-2">Page {currentPage}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!data?.nextCursor || isLoading || isFetching}
              className="h-8 px-3"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
