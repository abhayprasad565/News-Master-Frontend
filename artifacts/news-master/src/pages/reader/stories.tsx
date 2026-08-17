import { useState, useMemo } from 'react';
import { useGetStories, useGetPublicLabels, Story } from '@workspace/api-client-react';
import { Link, useParams } from 'wouter';
import { format, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Search, Filter, Loader2, Calendar as CalendarIcon, LayoutGrid, ExternalLink, X, Film, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useDebounce } from '@/hooks/use-debounce';

export default function StoriesList() {
  const params = useParams();
  const labelSlug = params.slug;
  const initialQuery = new URLSearchParams(window.location.search);

  const [search, setSearch] = useState(initialQuery.get('q') || '');
  const [platform, setPlatform] = useState(initialQuery.get('platform') || 'all');
  const [from, setFrom] = useState(initialQuery.get('from') || '');
  const [to, setTo] = useState(initialQuery.get('to') || '');
  const debouncedSearch = useDebounce(search, 500);

  const { data: labelsData } = useGetPublicLabels();
  
  const queryParams = useMemo(() => {
    const p: any = {};
    p.limit = 50;
    if (debouncedSearch) p.q = debouncedSearch;
    if (labelSlug) p.label = labelSlug;
    if (platform !== 'all') p.platform = platform;
    if (from) p.from = from;
    if (to) p.to = to;

    const urlParams = new URLSearchParams();
    if (debouncedSearch) urlParams.set('q', debouncedSearch);
    if (platform !== 'all') urlParams.set('platform', platform);
    if (from) urlParams.set('from', from);
    if (to) urlParams.set('to', to);
    const nextUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams}` : ''}`;
    window.history.replaceState(null, '', nextUrl);

    return p;
  }, [debouncedSearch, labelSlug, platform, from, to]);

  const dateRange: DateRange | undefined = useMemo(() => {
    if (!from && !to) return undefined;
    return {
      from: from ? new Date(from + 'T00:00:00') : undefined,
      to: to ? new Date(to + 'T23:59:59') : undefined,
    };
  }, [from, to]);

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range) {
      setFrom('');
      setTo('');
      return;
    }
    setFrom(range.from ? format(range.from, 'yyyy-MM-dd') : '');
    setTo(range.to ? format(range.to, 'yyyy-MM-dd') : '');
  };

  const formattedDateLabel = useMemo(() => {
    if (from && to) {
      if (from === to) {
        return format(new Date(from + 'T00:00:00'), 'MMM d, yyyy');
      }
      return `${format(new Date(from + 'T00:00:00'), 'MMM d')} – ${format(new Date(to + 'T00:00:00'), 'MMM d, yyyy')}`;
    }
    if (from) {
      return `From ${format(new Date(from + 'T00:00:00'), 'MMM d, yyyy')}`;
    }
    if (to) {
      return `Until ${format(new Date(to + 'T00:00:00'), 'MMM d, yyyy')}`;
    }
    return 'Filter by date';
  }, [from, to]);

  const { data: storiesData, isLoading, error } = useGetStories(queryParams);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold tracking-tight">Latest News</h1>
          {labelSlug && (
            <p className="text-muted-foreground mt-2 text-lg">
              Filtering by: <span className="font-semibold text-foreground">#{labelSlug}</span>
              <Link href="/stories" className="ml-2 text-sm text-primary hover:underline">Clear</Link>
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search stories..." 
              className="pl-9 bg-muted/40 dark:bg-zinc-900/60 border-border/80 dark:border-white/12 focus-visible:bg-background h-10 shadow-xs"
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
          
          <div className="w-full sm:w-[150px] shrink-0">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="h-10 bg-muted/40 dark:bg-zinc-900/60 border-border/80 dark:border-white/12 focus:bg-background shadow-xs active:scale-[0.98] transition-transform">
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

          <div className="shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-10 justify-start text-left font-normal gap-2 border-border/80 dark:border-white/15 bg-muted/40 dark:bg-zinc-900/60 hover:bg-muted/80 dark:hover:bg-zinc-800 ${
                    from || to ? 'text-foreground font-medium bg-muted/80 dark:bg-zinc-800 border-primary/40 ring-1 ring-primary/20' : 'text-muted-foreground'
                  }`}
                >
                  <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate max-w-[180px]">{formattedDateLabel}</span>
                  {(from || to) && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRangeSelect(undefined);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          handleRangeSelect(undefined);
                        }
                      }}
                      className="ml-1 rounded-full hover:bg-background/80 dark:hover:bg-zinc-700 p-0.5 active:scale-90 transition-transform"
                      title="Clear date filter"
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 dark:bg-zinc-900 dark:border-white/15 shadow-xl" align="end">
                <div className="p-3 border-b border-border/60 dark:border-white/10 flex flex-wrap gap-1.5 bg-muted/20 dark:bg-zinc-950/40">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-full hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
                    onClick={() => {
                      const today = new Date();
                      handleRangeSelect({ from: today, to: today });
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-full hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
                    onClick={() => {
                      handleRangeSelect({ from: subDays(new Date(), 6), to: new Date() });
                    }}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs px-2.5 rounded-full hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
                    onClick={() => {
                      handleRangeSelect({ from: subDays(new Date(), 29), to: new Date() });
                    }}
                  >
                    Last 30 days
                  </Button>
                  {(from || to) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2.5 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRangeSelect(undefined)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <CalendarComponent
                  mode="range"
                  defaultMonth={dateRange?.from || new Date()}
                  selected={dateRange}
                  onSelect={handleRangeSelect}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>
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
      <div className="p-6">
        <div className="flex flex-col-reverse md:flex-row md:items-start gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {isCorrection && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300">
                  Correction
                </Badge>
              )}
              {story.labels?.map(l => (
                <Badge key={l.id} variant="secondary" className="bg-muted text-xs" style={{ borderLeftColor: l.color, borderLeftWidth: '3px' }}>
                  {l.name}
                </Badge>
              ))}
              {publishedAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <CalendarIcon className="h-3 w-3" />
                  {format(publishedAt, 'MMM d, yyyy • h:mm a')}
                </div>
              )}
            </div>

            <Link href={`/stories/${story.id}`}>
              <h2 className="text-2xl font-serif font-bold text-foreground hover:text-primary transition-colors cursor-pointer mb-3 leading-tight">
                {storyTitle || 'Story'}
              </h2>
            </Link>
            
            <p className="text-muted-foreground line-clamp-3 leading-relaxed text-sm">
              {story.text}
            </p>

            {sourceUrl && (
              <div className="mt-4 pt-3 border-t border-border/60 dark:border-white/10 flex items-center text-xs font-medium text-primary">
                <span className="text-muted-foreground mr-1.5">Read full article at:</span>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary/80 inline-flex items-center gap-1 font-semibold text-primary"
                >
                  {sourceName || sourceUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {(story.media?.length > 0 || story.platformLinks?.length > 0) && (
              <div className="mt-3 pt-2 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
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
                  <div className="flex gap-1.5 capitalize">
                    {story.platformLinks.map(p => p.platform).join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {primaryMedia && (
            <Link href={`/stories/${story.id}`} className="shrink-0 group block">
              <div className="relative w-full md:w-48 lg:w-56 aspect-[4/3] md:aspect-[4/3] rounded-lg overflow-hidden border border-border/70 dark:border-white/12 bg-muted/40 shadow-xs">
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
        </div>
      </div>
    </Card>
  );
}
