import { useState, useMemo } from 'react';
import { useGetStories, useGetPublicLabels, Story } from '@workspace/api-client-react';
import { Link, useParams } from 'wouter';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Search, Filter, Loader2, Calendar as CalendarIcon, LayoutGrid, ExternalLink, X, Film, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';

export default function StoriesList() {
  const params = useParams();
  const labelSlug = params.slug;
  const initialQuery = new URLSearchParams(window.location.search);

  const [search, setSearch] = useState(initialQuery.get('q') || '');
  const [platform, setPlatform] = useState(initialQuery.get('platform') || 'all');
  const [datePreset, setDatePreset] = useState(initialQuery.get('preset') || 'all');
  const [customFrom, setCustomFrom] = useState(initialQuery.get('from') || '');
  const [customTo, setCustomTo] = useState(initialQuery.get('to') || '');
  const debouncedSearch = useDebounce(search, 500);

  const { data: labelsData } = useGetPublicLabels();

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
  
  const queryParams = useMemo(() => {
    const p: any = {};
    p.limit = 50;
    if (debouncedSearch) p.q = debouncedSearch;
    if (labelSlug) p.label = labelSlug;
    if (platform !== 'all') p.platform = platform;
    if (dateFrom) p.from = dateFrom;
    if (dateTo) p.to = dateTo;

    const urlParams = new URLSearchParams();
    if (debouncedSearch) urlParams.set('q', debouncedSearch);
    if (platform !== 'all') urlParams.set('platform', platform);
    if (datePreset !== 'all') urlParams.set('preset', datePreset);
    if (customFrom) urlParams.set('from', customFrom);
    if (customTo) urlParams.set('to', customTo);
    const nextUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams}` : ''}`;
    window.history.replaceState(null, '', nextUrl);

    return p;
  }, [debouncedSearch, labelSlug, platform, dateFrom, dateTo, datePreset, customFrom, customTo]);

  const { data: storiesData, isLoading, error } = useGetStories(queryParams);

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-4xl mx-auto">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight">Latest News</h1>
          {labelSlug && (
            <p className="text-muted-foreground text-sm sm:text-base">
              Filtering by: <span className="font-semibold text-foreground">#{labelSlug}</span>
              <Link href="/stories" className="ml-2 text-xs sm:text-sm text-primary hover:underline">Clear</Link>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search stories..." 
              className="pl-9 bg-muted/40 dark:bg-zinc-900/60 border-border/80 dark:border-white/12 focus-visible:bg-background h-10 shadow-xs text-sm w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground active:scale-90 transition-transform p-0.5"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5">
            <div className="w-full sm:w-[150px]">
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="h-9 sm:h-10 bg-muted/40 dark:bg-zinc-900/60 border-border/80 dark:border-white/12 focus:bg-background shadow-xs text-xs sm:text-sm w-full">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-900 dark:border-white/15">
                  <SelectItem value="all">All platforms</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="x">X</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-[160px]">
              <Select value={datePreset} onValueChange={setDatePreset}>
                <SelectTrigger className="h-9 sm:h-10 bg-muted/40 dark:bg-zinc-900/60 border-border/80 dark:border-white/12 focus:bg-background shadow-xs text-xs sm:text-sm w-full">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-900 dark:border-white/15">
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {datePreset === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 p-2.5 bg-muted/40 rounded-lg border text-xs">
              <span className="font-medium text-muted-foreground">From:</span>
              <Input
                type="date"
                className="w-auto h-8 text-xs"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <span className="font-medium text-muted-foreground">To:</span>
              <Input
                type="date"
                className="w-auto h-8 text-xs"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {labelsData?.items && labelsData.items.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link href="/stories">
            <button
              type="button"
              className={`cursor-pointer inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 active:scale-95 select-none ${
                !labelSlug
                  ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30 ring-2 ring-primary/30'
                  : 'bg-muted/50 hover:bg-muted dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground border border-border/60 dark:border-white/10'
              }`}
            >
              All Stories
            </button>
          </Link>
          {labelsData.items.map((label) => (
            <Link key={label.id} href={`/labels/${label.slug}`}>
              <button
                type="button"
                className={`cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-150 active:scale-95 select-none ${
                  labelSlug === label.slug
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30 ring-2 ring-primary/30'
                    : 'bg-muted/50 hover:bg-muted dark:bg-zinc-900/80 dark:hover:bg-zinc-800 text-muted-foreground hover:text-foreground border border-border/60 dark:border-white/10'
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: label.color || '#e11d48' }}
                />
                {label.name}
              </button>
            </Link>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Failed to load stories. Please try again later.
        </div>
      ) : !storiesData?.items?.length ? (
        <div className="text-center py-24 bg-muted/30 rounded-xl border border-dashed">
          <LayoutGrid className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No stories found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {storiesData.items.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
          {storiesData.nextCursor && (
            <div className="flex justify-center">
              <Button variant="outline" disabled>More stories available</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StoryCard({ story }: { story: Story }) {
  const publishedAt = story.publishedAt ? new Date(story.publishedAt) : null;
  const isCorrection = story.kind === 'CORRECTION';
  const postNum = (story as any).postNumber;
  const storyTarget = postNum ? String(postNum) : story.id;

  const isGenericOrUuid = (str?: string | null) =>
    !str ||
    !str.trim() ||
    ['untitled', 'untitled story', 'untitled post', 'unpublished post'].includes(str.trim().toLowerCase()) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

  let storyTitle = story.title;
  if (isGenericOrUuid(storyTitle) && story.text && story.text.trim()) {
    const cleanedText = (story.text.split(/source:\s*/i)[0] ?? story.text).trim();
    const firstSentence = (cleanedText.split(/(?<=[.!?])\s+|\n+/)[0] ?? '').trim();
    const headline = firstSentence.replace(/^[#*\s]+/, '').trim();
    if (headline) {
      storyTitle = headline.length > 90 ? `${headline.slice(0, 87)}...` : headline;
    }
  }

  const sourceUrl = (story as any).sourceUrl || story.text?.match(/https?:\/\/\S+/i)?.[0];
  const sourceName = (story as any).sourceName || (story.text?.match(/Source:\s*([^|\n]+)/i)?.[1]?.trim());

  const graphicMedia = story.media?.find((m) => m.type === 'GRAPHIC') || story.media?.find((m) => m.mimeType?.startsWith('image/'));
  const reelMedia = story.media?.find((m) => m.type === 'REEL');
  const primaryMedia = graphicMedia || story.media?.[0];

  return (
    <Card className={`overflow-hidden transition-all duration-200 hover:shadow-lg dark:hover:shadow-[0_0_24px_rgba(0,0,0,0.6)] dark:border-white/10 ${isCorrection ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10' : ''}`}>
      <div className="p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-5">
          {primaryMedia && (
            <Link href={`/stories/${storyTarget}`} className="shrink-0 group block w-full sm:w-44 md:w-52 sm:order-2">
              <div className="relative w-full aspect-[16/9] sm:aspect-[4/3] rounded-lg overflow-hidden border border-border/70 dark:border-white/12 bg-muted/40 shadow-xs">
                {primaryMedia.type === 'REEL' ? (
                  <video
                    src={primaryMedia.url}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={primaryMedia.url}
                    alt={storyTitle || 'Story thumbnail'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                )}
                {reelMedia && (
                  <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-xs text-white p-1 rounded-md shadow-xs">
                    <Film className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </Link>
          )}

          <div className="flex-1 min-w-0 sm:order-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
              <Link href={`/stories/${storyTarget}`} className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded hover:underline">
                #{postNum || story.id.slice(0, 6)}
              </Link>
              {isCorrection && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 text-[11px] py-0.5">
                  Correction
                </Badge>
              )}
              {story.labels?.map(l => (
                <Badge key={l.id} variant="secondary" className="bg-muted text-[11px] py-0.5" style={{ borderLeftColor: l.color, borderLeftWidth: '3px' }}>
                  {l.name}
                </Badge>
              ))}
              {publishedAt && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                  <CalendarIcon className="h-3 w-3" />
                  {format(publishedAt, 'MMM d, yyyy • h:mm a')}
                </div>
              )}
            </div>

            <Link href={`/stories/${storyTarget}`}>
              <h2 className="text-base sm:text-lg md:text-xl font-serif font-bold text-foreground hover:text-primary transition-colors cursor-pointer mb-2 leading-snug">
                {storyTitle || `Story #${postNum || story.id.slice(0, 6)}`}
              </h2>
            </Link>
            
            <p className="text-muted-foreground line-clamp-3 leading-relaxed text-xs sm:text-sm">
              {story.text}
            </p>

            {sourceUrl && (
              <div className="mt-2.5 pt-2 border-t border-border/60 dark:border-white/10 flex items-center text-xs font-medium text-primary flex-wrap gap-1">
                <span className="text-muted-foreground mr-1 text-[11px]">Source:</span>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary/80 inline-flex items-center gap-1 font-semibold text-primary text-[11px] sm:text-xs"
                >
                  {sourceName || sourceUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {(story.media?.length > 0 || story.platformLinks?.length > 0) && (
              <div className="mt-2 pt-1.5 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  {reelMedia && (
                    <span className="inline-flex items-center gap-1 text-primary font-medium">
                      <Film className="h-3.5 w-3.5" /> Reel
                    </span>
                  )}
                  {graphicMedia && (
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon className="h-3.5 w-3.5" /> Graphic
                    </span>
                  )}
                </div>
                {story.platformLinks?.length > 0 && (
                  <div className="flex gap-1.5 capitalize text-[10px] sm:text-[11px]">
                    {story.platformLinks.map(p => p.platform).join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
