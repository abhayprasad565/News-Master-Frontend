import { useState, useMemo } from 'react';
import { useGetStories, useGetPublicLabels, Story } from '@workspace/api-client-react';
import { Link, useParams } from 'wouter';
import { format } from 'date-fns';
import { Search, Filter, Loader2, Calendar, LayoutGrid, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce'; // Will create this

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

        <div className="grid w-full gap-2 md:grid-cols-[1fr_150px_150px_150px] lg:max-w-3xl">
          <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search stories..." 
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          </div>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger><SelectValue placeholder="Platform" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="x">X</SelectItem>
              <SelectItem value="telegram">Telegram</SelectItem>
              <SelectItem value="webhook">Webhook</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" />
          <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" />
        </div>
      </div>

      {labelsData?.items && labelsData.items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link href="/stories">
            <Badge variant={!labelSlug ? 'default' : 'secondary'} className="cursor-pointer hover:bg-primary/90 hover:text-primary-foreground text-sm py-1 px-3">
              All Stories
            </Badge>
          </Link>
          {labelsData.items.map(label => (
            <Link key={label.id} href={`/labels/${label.slug}`}>
              <Badge 
                variant={labelSlug === label.slug ? 'default' : 'secondary'} 
                className="cursor-pointer hover:bg-primary/90 hover:text-primary-foreground text-sm py-1 px-3"
                style={labelSlug !== label.slug ? { borderLeft: `4px solid ${label.color}` } : {}}
              >
                {label.name}
              </Badge>
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

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${isCorrection ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10' : ''}`}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-3">
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
              <Calendar className="h-3 w-3" />
              {format(publishedAt, 'MMM d, yyyy • h:mm a')}
            </div>
          )}
        </div>

        <Link href={`/stories/${story.id}`}>
          <h2 className="text-2xl font-serif font-bold text-foreground hover:text-primary transition-colors cursor-pointer mb-3 leading-tight">
            {storyTitle || 'Story'}
          </h2>
        </Link>
        
        <p className="text-muted-foreground line-clamp-3 leading-relaxed">
          {story.text}
        </p>

        {sourceUrl && (
          <div className="mt-4 pt-3 border-t flex items-center text-sm font-medium text-primary">
            <span className="text-muted-foreground mr-1.5">Read full article at:</span>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary/80 inline-flex items-center gap-1 font-semibold text-primary"
            >
              {sourceName || sourceUrl}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {(story.media?.length > 0 || story.platformLinks?.length > 0) && (
          <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
            {story.media?.length > 0 && (
              <span>{story.media.length} media item{story.media.length !== 1 && 's'}</span>
            )}
            {story.platformLinks?.length > 0 && (
              <div className="flex gap-2">
                Available on: {story.platformLinks.map(p => p.platform).join(', ')}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
