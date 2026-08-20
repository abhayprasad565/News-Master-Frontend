import { useParams, Link, useLocation } from "wouter";
import {
  useGetAdminPost,
  usePublishPost,
  useDeletePost,
  useCreateCorrection,
  type Destination,
  getGetAdminPostQueryKey,
  getGetAdminPostsQueryKey,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  AlertTriangle,
  AlertCircle,
  Film,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiFetch } from "../../lib/api";

type PublishFormat = "IMAGE" | "REEL";
type PublishPlanDestination = {
  destinationId?: string;
  platform: string;
  destination: string;
  label?: string;
  requiresImage?: boolean;
  isCompatible?: boolean;
  supportedFormats?: PublishFormat[];
  defaultFormat?: PublishFormat;
  alreadyPublished?: boolean;
  successfulFormats?: PublishFormat[];
};

const destinationKey = (destination: PublishPlanDestination) =>
  destination.destinationId ??
  `${destination.platform}:${destination.destination}`;

const supportedFormatsFor = (
  destination: PublishPlanDestination,
): PublishFormat[] =>
  destination.supportedFormats?.length
    ? destination.supportedFormats
    : destination.platform === "instagram"
      ? ["IMAGE", "REEL"]
      : ["IMAGE"];

const isFormatComplete = (
  destination: PublishPlanDestination,
  format: PublishFormat,
) =>
  destination.successfulFormats?.includes(format) ||
  (destination.alreadyPublished === true &&
    format === (destination.defaultFormat ?? "IMAGE"));

export default function AdminPostDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [publishOpen, setPublishOpen] = useState(false);
  const [selectAll, setSelectAll] = useState(true);
  const [selectedDestIds, setSelectedDestIds] = useState<string[]>([]);
  const [formatByDestId, setFormatByDestId] = useState<
    Record<string, PublishFormat>
  >({});
  const [sensitivityOverride, setSensitivityOverride] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [correctionTitle, setCorrectionTitle] = useState("");
  const [correctionText, setCorrectionText] = useState("");

  const {
    data: detail,
    isLoading,
    error,
    refetch,
  } = useGetAdminPost(id || "", {
    query: {
      enabled: !!id,
      refetchInterval: (query: any) => {
        const renderState = query.state.data?.render?.state;
        return renderState === "queued" || renderState === "rendering" ? 2500 : false;
      },
    } as any,
  });

  const targetPostId = detail?.id || id;
  const { data: planData, isLoading: planLoading } = useQuery({
    queryKey: ["publishPlan", targetPostId],
    queryFn: () => apiFetch<any>(`/api/admin/posts/${targetPostId}/publish-plan`),
    enabled: publishOpen && !!targetPostId,
  });

  useEffect(() => {
    if (planData?.destinations) {
      const destinations = planData.destinations as PublishPlanDestination[];
      const nextFormats = Object.fromEntries(
        destinations.map((destination) => {
          const formats = supportedFormatsFor(destination);
          return [
            destinationKey(destination),
            destination.defaultFormat ?? formats[0] ?? "IMAGE",
          ];
        }),
      );
      setFormatByDestId(nextFormats);
      setSelectedDestIds(
        destinations
          .filter(
            (destination) =>
              !isFormatComplete(
                destination,
                nextFormats[destinationKey(destination)] ?? "IMAGE",
              ),
          )
          .map(destinationKey),
      );
      setSelectAll(true);
    }
    setSensitivityOverride(false);
  }, [planData]);

  const deleteMutation = useDeletePost({
    mutation: {
      onSuccess: () => {
        toast({ title: "Post archived successfully" });
        queryClient.invalidateQueries({ queryKey: getGetAdminPostsQueryKey() });
        setLocation("/admin/posts");
      },
      onError: () =>
        toast({ title: "Failed to archive post", variant: "destructive" }),
    },
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean; message: string; post: any }>(
        `/api/admin/posts/${targetPostId}/approve`,
        {
          method: "POST",
          body: JSON.stringify({ postId: targetPostId, timestamp: new Date().toISOString() }),
        },
      ),
    onSuccess: () => {
      toast({
        title: "Story Approved & Validated",
        description: "Status changed to REVIEWED. Media rendering queued in background.",
      });
      queryClient.invalidateQueries({
        queryKey: getGetAdminPostQueryKey(id!),
      });
      queryClient.invalidateQueries({ queryKey: getGetAdminPostsQueryKey() });
    },
    onError: (err: any) =>
      toast({
        title: "Failed to approve post",
        description: err.message,
        variant: "destructive",
      }),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason?: string) =>
      apiFetch<{ success: boolean; message: string; post: any }>(
        `/api/admin/posts/${targetPostId}/reject`,
        {
          method: "POST",
          body: JSON.stringify({
            postId: targetPostId,
            reason: reason || "Rejected by editorial review",
          }),
        },
      ),
    onSuccess: () => {
      toast({
        title: "Story Rejected",
        description: "Post marked as REJECTED and removed from review queue.",
      });
      queryClient.invalidateQueries({
        queryKey: getGetAdminPostQueryKey(id!),
      });
      queryClient.invalidateQueries({ queryKey: getGetAdminPostsQueryKey() });
    },
    onError: (err: any) =>
      toast({
        title: "Failed to reject post",
        description: err.message,
        variant: "destructive",
      }),
  });

  const publishMutation = usePublishPost({
    mutation: {
      onSuccess: () => {
        toast({ title: "Publish request queued" });
        queryClient.invalidateQueries({
          queryKey: getGetAdminPostQueryKey(id!),
        });
        queryClient.invalidateQueries({ queryKey: getGetAdminPostsQueryKey() });
        setPublishOpen(false);
      },
      onError: (err: any) =>
        toast({
          title: "Failed to publish",
          description: err.message,
          variant: "destructive",
        }),
    },
  });

  const correctionMutation = useCreateCorrection({
    mutation: {
      onSuccess: (post) => {
        toast({ title: "Correction draft created" });
        queryClient.invalidateQueries({ queryKey: getGetAdminPostsQueryKey() });
        setCorrectionOpen(false);
        setLocation(`/admin/posts/${post.id}`);
      },
      onError: (err: any) =>
        toast({
          title: "Failed to create correction",
          description: err.message,
          variant: "destructive",
        }),
    },
  });

  const renderMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean; message: string }>(
        `/api/admin/posts/${targetPostId}/render`,
        {
          method: "POST",
          body: JSON.stringify({ postId: targetPostId }),
        },
      ),
    onSuccess: () => {
      toast({
        title: "Rendering queued",
        description: "Graphic and video Reel render jobs are running in background.",
      });
      queryClient.invalidateQueries({
        queryKey: getGetAdminPostQueryKey(id!),
      });
    },
    onError: (err: any) =>
      toast({
        title: "Failed to trigger render",
        description: err.message,
        variant: "destructive",
      }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load post
      </div>
    );
  }

  const status = detail.status as string;
  const isMutable = [
    "DRAFT",
    "MANUAL_REVIEW",
    "REJECTED",
    "VALIDATED",
    "REVIEWED",
  ].includes(status);
  const canArchive = ["VALIDATED", "REVIEWED", "REJECTED"].includes(status);
  const canPublish = status === "VALIDATED" || status === "REVIEWED";
  const canCorrect = status === "PUBLISHED";

  const handlePublish = () => {
    if (planData?.requiresSensitivityOverride && !sensitivityOverride) {
      toast({
        title: "Confirm sensitivity review before publishing",
        variant: "destructive",
      });
      return;
    }

    const destinations = (planData?.destinations ??
      []) as PublishPlanDestination[];
    const chosenDestinations: Destination[] = destinations
      .filter((destination) =>
        selectedDestIds.includes(destinationKey(destination)),
      )
      .map((destination) => {
        const format =
          formatByDestId[destinationKey(destination)] ??
          destination.defaultFormat ??
          "IMAGE";
        return {
          platform: destination.platform as Destination["platform"],
          destination: destination.destination,
          format,
        };
      });

    if (!chosenDestinations.length) {
      toast({
        title: "Select at least one destination",
        variant: "destructive",
      });
      return;
    }

    publishMutation.mutate({
      postId: detail.id,
      data: {
        destinations: chosenDestinations,
      },
    });
  };

  const handleCorrection = () => {
    correctionMutation.mutate({
      postId: detail.id,
      data: {
        title:
          correctionTitle || `Correction: ${detail.title || "Untitled post"}`,
        text: correctionText,
        labelIds: detail.labels.map((label) => label.id),
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <Link
          href="/admin/posts"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors self-start"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to Posts
        </Link>

        {/* Action Button Bar: Uniform equal-width h-9 buttons */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
          {/* Review Actions for MANUAL_REVIEW / DRAFT */}
          {(detail.status === "MANUAL_REVIEW" || detail.status === "DRAFT") && (
            <>
              <Button
                size="sm"
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm h-9 min-w-[106px] sm:min-w-[112px] px-2.5 sm:px-3 text-xs sm:text-sm justify-center shrink-0"
              >
                {approveMutation.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                )}
                Approve
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 font-medium h-9 min-w-[106px] sm:min-w-[112px] px-2.5 sm:px-3 text-xs sm:text-sm justify-center shrink-0"
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject this story?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the story as REJECTED and remove it from the active review queue.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => rejectMutation.mutate(undefined)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {canPublish && (
            <Button
              size="sm"
              onClick={() => setPublishOpen(true)}
              disabled={publishMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm h-9 min-w-[106px] sm:min-w-[112px] px-2.5 sm:px-3 text-xs sm:text-sm justify-center shrink-0"
            >
              <Send className="mr-1.5 h-3.5 w-3.5" /> Publish
            </Button>
          )}

          {canCorrect && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCorrectionOpen(true)}
              className="h-9 min-w-[106px] sm:min-w-[112px] px-2.5 sm:px-3 text-xs sm:text-sm font-medium justify-center shrink-0"
            >
              <AlertTriangle className="mr-1.5 h-3.5 w-3.5 text-amber-500 shrink-0" /> Correction
            </Button>
          )}

          {isMutable && (
            <Button size="sm" variant="outline" asChild className="h-9 min-w-[106px] sm:min-w-[112px] px-2.5 sm:px-3 text-xs sm:text-sm font-medium justify-center shrink-0">
              <Link href={`/admin/posts/${detail.id}/edit`}>
                <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Link>
            </Button>
          )}

          {canArchive && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10 font-medium h-9 min-w-[106px] sm:min-w-[112px] px-2.5 sm:px-3 text-xs sm:text-sm justify-center shrink-0"
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete "{detail.title || detail.text.slice(0, 80)}". Published posts cannot be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate({ postId: detail.id })}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Story Headline & Badges Header */}
      <div className="space-y-2">
        {(() => {
          const isGenericOrUuid = (str?: string | null) =>
            !str ||
            !str.trim() ||
            ["untitled", "untitled post", "unpublished post"].includes(
              str.trim().toLowerCase(),
            ) ||
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              str.trim(),
            );

          let displayTitle = detail.title;
          if (
            isGenericOrUuid(displayTitle) &&
            detail.text &&
            detail.text.trim()
          ) {
            const cleanedText = (
              detail.text.split(/source:\s*/i)[0] ?? detail.text
            ).trim();
            const firstSentence = (
              cleanedText.split(/(?<=[.!?])\s+|\n+/)[0] ?? ""
            ).trim();
            const headline = firstSentence.replace(/^[#*\s]+/, "").trim();
            if (headline) {
              displayTitle =
                headline.length > 90
                  ? `${headline.slice(0, 87)}...`
                  : headline;
            }
          }

          return (
            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight leading-snug">
              {displayTitle || `Post #${(detail as any).postNumber || detail.id.slice(0, 8)}`}
            </h1>
          );
        })()}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="font-mono font-bold">
            #{(detail as any).postNumber || detail.id.slice(0, 8)}
          </Badge>
          <Badge
            variant={
              status === "PUBLISHED"
                ? "default"
                : status === "REVIEWED"
                  ? "secondary"
                  : status === "MANUAL_REVIEW"
                    ? "outline"
                    : status === "REJECTED"
                      ? "destructive"
                      : "outline"
            }
            className={
              status === "MANUAL_REVIEW"
                ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 font-semibold"
                : status === "REVIEWED"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold"
                  : ""
            }
          >
            {status}
          </Badge>
          <Badge variant="secondary">{detail.kind}</Badge>

          {((detail as any).render?.state === "rendering" || renderMutation.isPending) && (
            <Badge className="bg-amber-500 text-white animate-pulse">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Rendering...
            </Badge>
          )}
          {(detail as any).render?.state === "queued" && !renderMutation.isPending && (
            <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50/50 dark:bg-amber-950/30">
              <Clock className="mr-1 h-3 w-3 animate-spin" /> Render Queued
            </Badge>
          )}
          {(detail as any).render?.state === "failed" && (
            <Badge variant="destructive">
              <AlertCircle className="mr-1 h-3 w-3" /> Render Failed
            </Badge>
          )}
          {(detail as any).render?.state === "ready" && (
            <Badge className="bg-emerald-600 text-white">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Render Ready
            </Badge>
          )}

          {detail.labels.map((l) => (
            <Badge key={l.id} variant="outline" className="text-xs">
              {l.name}
            </Badge>
          ))}
        </div>
      </div>

      {detail.status === "REJECTED" && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Story Rejected</h4>
            <p className="text-sm mt-1">{detail.validationReason || "This story was rejected by editorial review."}</p>
          </div>
        </div>
      )}

      {detail.kind === "CORRECTION" && detail.correctionOfPostId && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 p-4 rounded-md">
          <p className="text-amber-800 dark:text-amber-200 text-sm flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            This is a correction for post ID:{" "}
            <Link
              href={`/admin/posts/${detail.correctionOfPostId}`}
              className="ml-1 underline font-mono"
            >
              {detail.correctionOfPostId}
            </Link>
          </p>
        </div>
      )}

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm dark:prose-invert max-w-none font-serif bg-muted/30 p-6 rounded-md whitespace-pre-wrap border border-dashed">
              {detail.text || (
                <span className="text-muted-foreground italic">No content</span>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-primary" /> Media Assets & Rendering
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                    <Link href={`/admin/posts/${detail.id}/video`}>
                      <Film className="mr-1.5 h-3.5 w-3.5" /> Video Studio
                    </Link>
                  </Button>
                  {(detail as any).media?.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => renderMutation.mutate()}
                      disabled={renderMutation.isPending || (detail as any).render?.state === "rendering"}
                      className="h-8 text-xs"
                    >
                      {renderMutation.isPending || (detail as any).render?.state === "rendering" ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Re-render
                    </Button>
                  )}
                </div>
              </div>

              {(detail as any).render?.state === "failed" && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Rendering Failed</p>
                    <p className="font-mono mt-0.5 text-[11px] break-all">
                      {(detail as any).render?.job?.lastFailureReason || "Unknown failure occurred during asset rendering."}
                    </p>
                  </div>
                </div>
              )}

              {(detail as any).render?.state === "queued" && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <Clock className="h-4 w-4 shrink-0 mt-0.5 animate-spin" />
                  <div>
                    <p className="font-semibold">Render Job Queued in Background</p>
                    <p className="mt-0.5 text-muted-foreground">
                      Rendering 4:5 graphic card and 9:16 video Reel. This page will automatically update when ready.
                    </p>
                  </div>
                </div>
              )}

              {(detail as any).render?.state === "rendering" && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <Loader2 className="h-4 w-4 shrink-0 mt-0.5 animate-spin text-amber-600" />
                  <div>
                    <p className="font-semibold">Rendering in Progress...</p>
                    <p className="mt-0.5 text-muted-foreground">
                      Generating high-resolution graphic card and video Reel. Updating automatically...
                    </p>
                  </div>
                </div>
              )}

              {(detail as any).media && (detail as any).media.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(detail as any).media.map((mediaItem: any, idx: number) => (
                    <div
                      key={mediaItem.id || idx}
                      className="rounded-lg overflow-hidden border bg-muted/30 aspect-[4/3] relative group shadow-sm"
                    >
                      {mediaItem.type === "REEL" ? (
                        <video
                          src={mediaItem.url}
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <a
                          href={mediaItem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full h-full"
                        >
                          <img
                            src={mediaItem.url}
                            alt="Rendered graphic"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </a>
                      )}
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
                        {mediaItem.type}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center bg-muted/20 space-y-3">
                  <div className="inline-flex p-3 rounded-full bg-muted/50 text-muted-foreground">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">No Rendered Assets Yet</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      {(detail as any).sourceImageKey
                        ? "Custom background image is saved. Click below to render 4:5 graphic cards and 9:16 video Reels."
                        : "Post content is ready. Click below to generate official graphics and video assets."}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => renderMutation.mutate()}
                    disabled={renderMutation.isPending || (detail as any).render?.state === "rendering"}
                    className="bg-primary text-primary-foreground"
                  >
                    {renderMutation.isPending || (detail as any).render?.state === "rendering" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Render Graphic & Video Now
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b items-center">
                <span className="text-muted-foreground">Post #</span>
                <span className="font-mono font-bold text-primary">#{(detail as any).postNumber || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">UUID</span>
                <span className="font-mono text-xs text-muted-foreground" title={detail.id}>{detail.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Created</span>
                <span>
                  {format(new Date(detail.createdAt), "MMM d, HH:mm")}
                </span>
              </div>
              {detail.publishedAt && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Published</span>
                  <span className="font-medium text-emerald-600">
                    {format(new Date(detail.publishedAt), "MMM d, HH:mm")}
                  </span>
                </div>
              )}
              {detail.eventId && (
                <div className="flex flex-col py-1 border-b space-y-1">
                  <span className="text-muted-foreground">
                    Associated Event
                  </span>
                  <span className="font-mono text-xs bg-muted p-1 rounded">
                    {detail.eventId}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {detail.publication && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Publication Record
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Rev.</span>
                  <span className="font-mono font-bold">
                    v{detail.publication.revision}
                  </span>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <Link href={`/admin/publications/${detail.publication.id}`}>
                      View Deliveries
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Publish Plan & Destinations</DialogTitle>
            <DialogDescription>
              Backend-resolved publication plan for this post. Select target
              channels to broadcast.
            </DialogDescription>
          </DialogHeader>

          {planLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !planData?.destinations?.length ? (
            <div className="py-6 text-center text-muted-foreground text-sm">
              No active channels configured in server environment.
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div
                className="flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 p-3.5 rounded-lg border cursor-pointer select-none"
                onClick={() => {
                  const next = !selectAll;
                  setSelectAll(next);
                  if (next) {
                    setSelectedDestIds(
                      (planData.destinations as PublishPlanDestination[])
                        .filter(
                          (destination) =>
                            !isFormatComplete(
                              destination,
                              formatByDestId[destinationKey(destination)] ??
                                destination.defaultFormat ??
                                "IMAGE",
                            ),
                        )
                        .map(destinationKey),
                    );
                  } else {
                    setSelectedDestIds([]);
                  }
                }}
              >
                <Checkbox
                  id="select-all"
                  checked={selectAll}
                  onCheckedChange={(checked) => {
                    const val = !!checked;
                    setSelectAll(val);
                    if (val) {
                      setSelectedDestIds(
                        (planData.destinations as PublishPlanDestination[])
                          .filter(
                            (destination) =>
                              !isFormatComplete(
                                destination,
                                formatByDestId[destinationKey(destination)] ??
                                  destination.defaultFormat ??
                                  "IMAGE",
                              ),
                          )
                          .map(destinationKey),
                      );
                    } else {
                      setSelectedDestIds([]);
                    }
                  }}
                />
                <div>
                  <Label
                    htmlFor="select-all"
                    className="font-bold text-sm cursor-pointer text-emerald-900 dark:text-emerald-200"
                  >
                    Publish to All Configured Destinations (
                    {planData.destinations.length})
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Selects all destinations that still need the chosen format
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Configured Channels
                </Label>
                <div className="space-y-2">
                  {(planData.destinations as PublishPlanDestination[]).map(
                    (dest) => {
                      const key = destinationKey(dest);
                      const formats = supportedFormatsFor(dest);
                      const selectedFormat =
                        formatByDestId[key] ??
                        dest.defaultFormat ??
                        formats[0] ??
                        "IMAGE";
                      const complete = isFormatComplete(dest, selectedFormat);
                      const allFormatsComplete = formats.every((format) =>
                        isFormatComplete(dest, format),
                      );
                      const isChecked =
                        !complete && selectedDestIds.includes(key);
                      return (
                        <div
                          key={key}
                          className={`flex flex-col gap-3 p-3 rounded-md border text-sm transition-all ${complete ? "bg-muted/40 text-muted-foreground" : isChecked ? "bg-primary/5 border-primary/50 font-medium cursor-pointer" : "bg-background text-muted-foreground cursor-pointer"}`}
                          onClick={() => {
                            if (allFormatsComplete) return;
                            if (selectAll) setSelectAll(false);
                            if (selectedDestIds.includes(key)) {
                              setSelectedDestIds(
                                selectedDestIds.filter((id) => id !== key),
                              );
                            } else {
                              const next = [...selectedDestIds, key];
                              setSelectedDestIds(next);
                              const selectableCount = (
                                planData.destinations as PublishPlanDestination[]
                              ).filter(
                                (destination) =>
                                  !isFormatComplete(
                                    destination,
                                    formatByDestId[
                                      destinationKey(destination)
                                    ] ??
                                      destination.defaultFormat ??
                                      "IMAGE",
                                  ),
                              ).length;
                              if (next.length === selectableCount)
                                setSelectAll(true);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                checked={complete || isChecked}
                                disabled={allFormatsComplete}
                              />
                              <div>
                                <div className="font-semibold text-foreground">
                                  {dest.label ?? dest.destination}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {dest.platform}: {dest.destination}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {dest.requiresImage && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  Requires Image
                                </Badge>
                              )}
                              <Badge
                                variant={
                                  complete
                                    ? "secondary"
                                    : dest.isCompatible !== false
                                      ? "secondary"
                                      : "destructive"
                                }
                                className="text-[10px]"
                              >
                                {allFormatsComplete
                                  ? "Complete"
                                  : dest.isCompatible !== false
                                    ? "Ready"
                                    : "Incompatible"}
                              </Badge>
                            </div>
                          </div>
                          <div
                            className="flex items-center gap-2 pl-7"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Label className="text-xs text-muted-foreground">
                              Post as
                            </Label>
                            <Select
                              value={selectedFormat}
                              disabled={formats.length === 1}
                              onValueChange={(value) => {
                                const nextFormat = value as PublishFormat;
                                setFormatByDestId((current) => ({
                                  ...current,
                                  [key]: nextFormat,
                                }));
                                setSelectedDestIds((current) =>
                                  isFormatComplete(dest, nextFormat)
                                    ? current.filter((id) => id !== key)
                                    : current.includes(key)
                                      ? current
                                      : [...current, key],
                                );
                              }}
                            >
                              <SelectTrigger className="h-8 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="IMAGE">
                                  <span className="inline-flex items-center gap-1">
                                    <ImageIcon className="h-3 w-3" /> Image
                                  </span>
                                </SelectItem>
                                {formats.includes("REEL") && (
                                  <SelectItem value="REEL">
                                    <span className="inline-flex items-center gap-1">
                                      <Film className="h-3 w-3" /> Reel
                                    </span>
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
              {planData.requiresSensitivityOverride && (
                <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/20">
                  <Checkbox
                    checked={sensitivityOverride}
                    onCheckedChange={(checked) =>
                      setSensitivityOverride(Boolean(checked))
                    }
                  />
                  <div>
                    <Label className="font-semibold text-amber-900 dark:text-amber-200">
                      Sensitivity reviewed
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Required for image and Reel publishing on sensitive posts.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishMutation.isPending || planLoading}
              className="bg-primary"
            >
              {publishMutation.isPending
                ? "Enqueueing..."
                : "Queue Publish Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create correction draft</DialogTitle>
            <DialogDescription>
              The original published post remains immutable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={correctionTitle}
                onChange={(event) => setCorrectionTitle(event.target.value)}
                placeholder={`Correction: ${detail.title || "Untitled post"}`}
              />
            </div>
            <div className="space-y-2">
              <Label>Correction text</Label>
              <Textarea
                value={correctionText}
                onChange={(event) => setCorrectionText(event.target.value)}
                className="min-h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCorrection}
              disabled={correctionMutation.isPending || !correctionText.trim()}
            >
              {correctionMutation.isPending ? "Creating..." : "Create draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
