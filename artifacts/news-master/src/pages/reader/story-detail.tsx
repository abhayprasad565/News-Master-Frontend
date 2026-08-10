import { useParams, Link } from 'wouter';
import { useGetStory } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, ExternalLink, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function StoryDetail() {
  const { id } = useParams();
  const { data: story, isLoading, error } = useGetStory(id || '', {
    query: { enabled: !!id } as any
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pt-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-[400px] w-full mt-8" />
        <div className="space-y-4 mt-8">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="max-w-3xl mx-auto text-center py-24">
        <h2 className="text-2xl font-bold mb-2">Story not found</h2>
        <p className="text-muted-foreground mb-6">The story you're looking for doesn't exist or has been removed.</p>
        <Link href="/stories">
          <Button>Return to stories</Button>
        </Link>
      </div>
    );
  }

  const publishedAt = story.publishedAt ? new Date(story.publishedAt) : null;
  const isCorrection = story.kind === 'CORRECTION';

  return (
    <article className="max-w-3xl mx-auto py-8">
      <Link href="/stories" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to stories
      </Link>

      <header className="mb-10 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          {isCorrection && (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-sm py-1 px-3">
              <AlertTriangle className="h-3 w-3 mr-1.5" />
              Correction
            </Badge>
          )}
          {story.labels?.map(l => (
            <Link key={l.id} href={`/labels/${l.slug}`}>
              <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer text-sm py-1 px-3" style={{ borderLeftColor: l.color, borderLeftWidth: '3px' }}>
                {l.name}
              </Badge>
            </Link>
          ))}
        </div>

        {(() => {
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

          return (
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-tight tracking-tight">
              {storyTitle || `Story ${story.id.slice(0, 8)}`}
            </h1>
          );
        })()}

        {publishedAt && (
          <div className="flex items-center text-sm text-muted-foreground border-b pb-6">
            <Calendar className="mr-2 h-4 w-4" />
            <time dateTime={publishedAt.toISOString()}>
              Published {format(publishedAt, 'MMMM d, yyyy • h:mm a')}
            </time>
          </div>
        )}
      </header>

      {isCorrection && story.correctionOfPostId && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-lg mb-8">
          <p className="text-amber-800 dark:text-amber-200 text-sm font-medium flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 shrink-0" />
            This article serves as a correction to a previously published story.
          </p>
        </div>
      )}

      <div className="prose prose-lg dark:prose-invert max-w-none mb-12 prose-p:leading-relaxed prose-p:mb-6 text-foreground/90 font-serif">
        {story.text.split('\n').map((paragraph, i) => (
          paragraph.trim() ? <p key={i}>{paragraph}</p> : <br key={i} />
        ))}
      </div>

      {(() => {
        const sourceUrl = (story as any).sourceUrl || story.text?.match(/https?:\/\/\S+/i)?.[0];
        const sourceName = (story as any).sourceName || (story.text?.match(/Source:\s*([^|\n]+)/i)?.[1]?.trim());
        if (!sourceUrl) return null;
        return (
          <div className="mb-12 p-4 rounded-lg bg-muted/40 border flex items-center justify-between flex-wrap gap-2 text-sm font-medium">
            <span className="text-muted-foreground font-sans">Read full article at:</span>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center font-semibold text-base font-sans"
            >
              {sourceName || sourceUrl}
              <ExternalLink className="ml-1.5 h-4 w-4" />
            </a>
          </div>
        );
      })()}

      {story.media && story.media.length > 0 && (
        <div className="mb-12 space-y-4">
          <h3 className="text-lg font-bold font-sans">Media</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {story.media.map((media, idx) => (
              <div key={idx} className="rounded-lg overflow-hidden border bg-muted aspect-video relative">
                <img 
                  src={media.url} 
                  alt="" 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {story.platformLinks && story.platformLinks.length > 0 && (
        <div className="border-t pt-8">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 font-sans">Read on other platforms</h3>
          <div className="flex flex-wrap gap-3">
            {story.platformLinks.map((link, idx) => (
              <a 
                key={idx} 
                href={link.destination || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full text-sm font-medium transition-colors font-sans"
              >
                {link.platform}
                <ExternalLink className="ml-2 h-3 w-3" />
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
