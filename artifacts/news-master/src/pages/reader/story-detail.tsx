import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useGetStory, useGetMe } from "@workspace/api-client-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  AlertTriangle,
  Heart,
  Bookmark,
  MessageCircle,
  Eye,
  Loader2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { setMetaTag, setCanonical, removeCanonical, setJsonLd, removeJsonLd } from "@/lib/seo";

export default function StoryDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: me } = useGetMe();
  const [commentBody, setCommentBody] = useState("");
  const {
    data: story,
    isLoading,
    error,
    refetch,
  } = useGetStory(id || "", {
    query: { enabled: !!id } as any,
  });
  const comments = useQuery({
    queryKey: ["story-comments", id],
    queryFn: () =>
      apiFetch<{ items: Comment[] }>(`/api/stories/${id}/comments`),
    enabled: Boolean(id),
  });
  const engagement = story as typeof story & {
    likedByMe?: boolean;
    savedByMe?: boolean;
    likeCount?: number;
    commentCount?: number;
  };
  const canUseEngagement = Boolean(me?.user);

  // Inject per-story SEO meta tags for social sharing and crawlers
  useEffect(() => {
    if (!story) return;
    const s = story as typeof story & { slug?: string | null; media?: Array<{ url: string; type: string }> };
    const rawTitle = (s as any).title ?? "";
    const rawText = (s as any).text ?? "";
    const headline = rawTitle || rawText.slice(0, 70);
    const desc = rawText.slice(0, 160);
    const slug = s.slug ?? id;
    const canonical = `https://scrollbrief.in/stories/${slug}`;
    const imageUrl = s.media?.find((m) => m.type === "GRAPHIC")?.url ?? "https://scrollbrief.in/logo.png";
    const publishedAt = (s as any).publishedAt ? new Date((s as any).publishedAt).toISOString() : undefined;

    document.title = `${headline} — ScrollBrief`;
    setCanonical(canonical);
    setMetaTag("description", desc);
    setMetaTag("og:title", headline);
    setMetaTag("og:description", desc);
    setMetaTag("og:url", canonical);
    setMetaTag("og:image", imageUrl);
    setMetaTag("og:type", "article");
    if (publishedAt) setMetaTag("article:published_time", publishedAt);
    setMetaTag("twitter:title", headline);
    setMetaTag("twitter:description", desc);
    setMetaTag("twitter:image", imageUrl);
    setMetaTag("twitter:card", "summary_large_image");

    setJsonLd("story", {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline,
      description: desc,
      url: canonical,
      mainEntityOfPage: canonical,
      ...(publishedAt ? { datePublished: publishedAt, dateModified: publishedAt } : {}),
      image: [imageUrl],
      publisher: {
        "@type": "Organization",
        name: "ScrollBrief",
        logo: { "@type": "ImageObject", url: "https://scrollbrief.in/logo.png" },
      },
      author: { "@type": "Organization", name: "ScrollBrief" },
    });

    return () => {
      document.title = "ScrollBrief — News, Briefly";
      removeCanonical();
      removeJsonLd("story");
    };
  }, [story, id]);

  const canModerateComments =
    me?.user?.role === "owner" || me?.user?.role === "admin";
  const action = useMutation({
    mutationFn: ({
      kind,
      active,
    }: {
      kind: "like" | "saved";
      active: boolean;
    }) =>
      apiFetch(`/api/stories/${id}/${kind}`, {
        method: active ? "DELETE" : "PUT",
      }),
    onSuccess: () => void refetch(),
  });
  const createComment = useMutation({
    mutationFn: () =>
      apiFetch(`/api/stories/${id}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentBody }),
      }),
    onSuccess: () => {
      setCommentBody("");
      void comments.refetch();
      void refetch();
      toast({ title: "Comment published" });
    },
  });
  const deleteComment = useMutation({
    mutationFn: (commentId: string) =>
      apiFetch(`/api/comments/${commentId}`, { method: "DELETE" }),
    onSuccess: () => {
      void comments.refetch();
      void refetch();
      toast({ title: "Comment deleted" });
    },
  });

  function requireAccount(operation: () => void) {
    if (!me?.user) {
      setLocation("/login");
      return;
    }
    operation();
  }

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
        <p className="text-muted-foreground mb-6">
          The story you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/stories">
          <Button>Return to stories</Button>
        </Link>
      </div>
    );
  }

  const publishedAt = story.publishedAt ? new Date(story.publishedAt) : null;
  const isCorrection = story.kind === "CORRECTION";
  const postNum = (story as any).postNumber;

  return (
    <article className="w-full max-w-3xl mx-auto py-3 sm:py-8">
      <Link
        href="/stories"
        className="inline-flex items-center text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground mb-4 sm:mb-8 transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
        Back to stories
      </Link>

      <header className="mb-6 sm:mb-10 space-y-3 sm:space-y-6">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
          <span className="font-mono text-xs sm:text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md">
            #{postNum || story.id.slice(0, 6)}
          </span>
          {isCorrection && (
            <Badge
              variant="outline"
              className="bg-amber-100 text-amber-800 border-amber-200 text-xs sm:text-sm py-0.5 sm:py-1 px-2 sm:px-3"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Correction
            </Badge>
          )}
          {story.labels?.map((l) => (
            <Link key={l.id} href={`/labels/${l.slug}`}>
              <Badge
                variant="secondary"
                className="hover:bg-secondary/80 cursor-pointer text-xs sm:text-sm py-0.5 sm:py-1 px-2 sm:px-3"
                style={{ borderLeftColor: l.color, borderLeftWidth: "3px" }}
              >
                {l.name}
              </Badge>
            </Link>
          ))}
        </div>

        {(() => {
          const isGenericOrUuid = (str?: string | null) =>
            !str ||
            !str.trim() ||
            [
              "untitled",
              "untitled story",
              "untitled post",
              "unpublished post",
            ].includes(str.trim().toLowerCase()) ||
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              str.trim(),
            );

          let storyTitle = story.title;
          if (isGenericOrUuid(storyTitle) && story.text && story.text.trim()) {
            const cleanedText = (
              story.text.split(/source:\s*/i)[0] ?? story.text
            ).trim();
            const firstSentence = (
              cleanedText.split(/(?<=[.!?])\s+|\n+/)[0] ?? ""
            ).trim();
            const headline = firstSentence.replace(/^[#*\s]+/, "").trim();
            if (headline) {
              storyTitle =
                headline.length > 90 ? `${headline.slice(0, 87)}...` : headline;
            }
          }

          return (
            <h1 className="text-xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground leading-snug sm:leading-tight tracking-tight">
              {storyTitle || `Story #${postNum || story.id.slice(0, 8)}`}
            </h1>
          );
        })()}

        {publishedAt && (
          <div className="flex items-center text-xs sm:text-sm text-muted-foreground border-b pb-3 sm:pb-6">
            <Calendar className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <time dateTime={publishedAt.toISOString()}>
              Published {format(publishedAt, "MMMM d, yyyy • h:mm a")}
            </time>
          </div>
        )}
      </header>

      <div className="mb-6 sm:mb-8 flex flex-wrap items-center gap-2 border-y py-3 sm:py-4">
        <Button
          variant={engagement.likedByMe ? "default" : "outline"}
          size="sm"
          className="h-8 sm:h-9 text-xs sm:text-sm"
          onClick={() =>
            requireAccount(() =>
              action.mutate({
                kind: "like",
                active: Boolean(engagement.likedByMe),
              }),
            )
          }
          disabled={action.isPending}
        >
          <Heart className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {engagement.likeCount ?? 0}
        </Button>
        <Button
          variant={engagement.savedByMe ? "default" : "outline"}
          size="sm"
          className="h-8 sm:h-9 text-xs sm:text-sm"
          onClick={() =>
            requireAccount(() =>
              action.mutate({
                kind: "saved",
                active: Boolean(engagement.savedByMe),
              }),
            )
          }
          disabled={action.isPending}
        >
          <Bookmark className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {engagement.savedByMe ? "Saved" : "Save"}
        </Button>
        <div className="ml-auto inline-flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <span className="inline-flex items-center">
            <Eye className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {((story as any)?.viewCount ?? 0).toLocaleString()} views
          </span>
          <span className="inline-flex items-center">
            <MessageCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {engagement.commentCount ?? 0} comments
          </span>
        </div>
      </div>

      {isCorrection && story.correctionOfPostId && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-3 sm:p-4 rounded-lg mb-6 sm:mb-8">
          <p className="text-amber-800 dark:text-amber-200 text-xs sm:text-sm font-medium flex items-start">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 shrink-0" />
            This article serves as a correction to a previously published story.
          </p>
        </div>
      )}

      <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none mb-8 sm:mb-12 prose-p:leading-relaxed prose-p:mb-4 sm:prose-p:mb-6 text-foreground/90 font-serif">
        {story.text
          .split("\n")
          .map((paragraph, i) =>
            paragraph.trim() ? <p key={i}>{paragraph}</p> : <br key={i} />,
          )}
      </div>

      {(() => {
        const sourceUrl =
          (story as any).sourceUrl || story.text?.match(/https?:\/\/\S+/i)?.[0];
        const sourceName =
          (story as any).sourceName ||
          story.text?.match(/Source:\s*([^|\n]+)/i)?.[1]?.trim();
        if (!sourceUrl) return null;
        return (
          <div className="mb-8 sm:mb-12 p-3 sm:p-4 rounded-lg bg-muted/40 border flex items-center justify-between flex-wrap gap-2 text-xs sm:text-sm font-medium">
            <span className="text-muted-foreground font-sans">
              Read full article at:
            </span>
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center font-semibold text-xs sm:text-base font-sans"
            >
              {sourceName || sourceUrl}
              <ExternalLink className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </a>
          </div>
        );
      })()}

      {story.media && story.media.length > 0 && (
        <div className="mb-8 sm:mb-12 space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg font-bold font-sans">Media</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {story.media.map((media, idx) => (
              <div
                key={idx}
                className="rounded-lg overflow-hidden border bg-muted aspect-video relative w-full"
              >
                {media.type === "REEL" ? (
                  <video
                    src={media.url}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={media.url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {story.platformLinks && story.platformLinks.length > 0 && (
        <div className="border-t pt-8">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 font-sans">
            Read on other platforms
          </h3>
          <div className="flex flex-wrap gap-3">
            {story.platformLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.destination || "#"}
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

      <section className="mt-12 border-t pt-8">
        <h2 className="mb-5 text-2xl font-bold">Comments</h2>
        {canUseEngagement ? (
          <form
            className="mb-8 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              createComment.mutate();
            }}
          >
            <Textarea
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              maxLength={2000}
              placeholder="Add a plain-text comment"
              disabled={createComment.isPending}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{commentBody.length}/2000</span>
              <Button disabled={!commentBody.trim() || createComment.isPending}>
                {createComment.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Post comment
              </Button>
            </div>
          </form>
        ) : (
          <p className="mb-8 text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>{" "}
            with a verified account to comment.
          </p>
        )}
        <div className="space-y-4">
          {comments.data?.items.map((comment) => (
            <div
              key={comment.id}
              className={`${comment.parentId ? "ml-8" : ""} rounded-lg border p-4`}
            >
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <strong>{comment.author.username}</strong>
                <div className="flex items-center gap-2">
                  {canModerateComments && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-muted-foreground hover:text-destructive"
                      disabled={deleteComment.isPending}
                      onClick={() => deleteComment.mutate(comment.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Delete comment</span>
                    </Button>
                  )}
                  <time className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleString()}
                  </time>
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                {comment.body}
              </p>
            </div>
          ))}
          {!comments.isLoading && comments.data?.items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No comments visible yet.
            </p>
          )}
        </div>
      </section>
    </article>
  );
}

type Comment = {
  id: string;
  parentId: string | null;
  body: string;
  status: "PUBLISHED" | "HIDDEN" | "REJECTED" | "DELETED";
  createdAt: string;
  author: { id: string; username: string };
};
