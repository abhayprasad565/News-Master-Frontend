import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ScrollText, FileText, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export default function AdminPublicationList() {
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
    queryKey: ['admin-publications', limit, currentCursor, dateFrom, dateTo],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (currentCursor) params.set('cursor', currentCursor);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);
      return apiFetch<{ items: any[]; nextCursor: string | null }>(`/api/admin/publications?${params.toString()}`);
    },
  });

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

  const currentPage = cursorStack.length;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">Publications</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Log of all content published to readers and platforms.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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

      <Card className="w-full overflow-hidden">
        {/* Mobile View: Dedicated touch-friendly cards */}
        <div className="block md:hidden divide-y">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : error ? (
            <div className="p-8 text-center text-destructive">Failed to load publications.</div>
          ) : !data?.items?.length ? (
            <div className="p-12 text-center">
              <ScrollText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No publications found</p>
            </div>
          ) : (
            data.items.map((pub) => {
              const title = (pub as any).title;
              const postNum = (pub as any).postNumber;
              const postUrlId = postNum ? String(postNum) : pub.postId;
              return (
                <div key={pub.id} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Link href={`/admin/posts/${postUrlId}`} className="font-mono font-bold text-primary text-sm hover:underline flex items-center">
                      <FileText className="h-3.5 w-3.5 mr-1 shrink-0 text-muted-foreground" />
                      #{postNum || pub.postId.slice(0, 6)}
                    </Link>
                    <Badge variant="outline" className="font-mono text-xs">v{pub.revision}</Badge>
                  </div>

                  <Link href={`/admin/posts/${postUrlId}`} className="font-semibold text-base block hover:underline text-foreground leading-snug">
                    {title || `Post #${postNum || pub.postId.slice(0, 8)}`}
                  </Link>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px]">ID: {pub.id.slice(0, 10)}...</span>
                      <span>•</span>
                      <span>{format(new Date(pub.createdAt), 'MMM d, yyyy HH:mm')}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild className="h-8 px-3 text-xs self-end sm:self-auto">
                      <Link href={`/admin/publications/${pub.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium w-32">ID</th>
                <th className="px-4 py-3 font-medium">Title / Story</th>
                <th className="px-4 py-3 font-medium w-28">Post #</th>
                <th className="px-4 py-3 font-medium w-24">Revision</th>
                <th className="px-4 py-3 font-medium w-44">Published At</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-12" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-32" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-destructive">
                    Failed to load publications.
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <ScrollText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">No publications found</p>
                  </td>
                </tr>
              ) : (
                data.items.map((pub) => {
                  const title = (pub as any).title;
                  const postNum = (pub as any).postNumber;
                  const postUrlId = postNum ? String(postNum) : pub.postId;
                  return (
                    <tr key={pub.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/publications/${pub.id}`} className="font-mono font-medium hover:underline text-primary text-xs">
                          {pub.id.slice(0, 10)}...
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/posts/${postUrlId}`} className="font-medium text-foreground hover:underline line-clamp-1">
                          {title || `Post #${postNum || pub.postId.slice(0, 8)}`}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/posts/${postUrlId}`} className="font-mono font-semibold text-primary hover:underline flex items-center">
                          <FileText className="h-3.5 w-3.5 mr-1 shrink-0 text-muted-foreground" />
                          #{postNum || pub.postId.slice(0, 6)}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono">v{pub.revision}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                        {format(new Date(pub.createdAt), 'MMM d, yyyy HH:mm:ss')}
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
            Showing {data?.items?.length || 0} publications {currentPage > 1 && `(Page ${currentPage})`}
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
