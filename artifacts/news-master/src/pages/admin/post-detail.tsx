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
import { useQueryClient, useQuery } from "@tanstack/react-query";
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

  const { data: planData, isLoading: planLoading } = useQuery({
    queryKey: ["publishPlan", id],
    queryFn: () => apiFetch<any>(`/api/admin/posts/${id}/publish-plan`),
    enabled: publishOpen && !!id,
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

  const {
    data: detail,
    isLoading,
    error,
  } = useGetAdminPost(id || "", {
    query: { enabled: !!id } as any,
  });

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

  const isMutable = [
    "DRAFT",
    "MANUAL_REVIEW",
    "REJECTED",
    "VALIDATED",
  ].includes(detail.status);
  const canArchive = detail.status !== "PUBLISHED";
  const canPublish = true;
  const canCorrect = detail.status === "PUBLISHED";

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
      <div className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
        <Link href="/admin/posts" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Posts
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
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
              <h1 className="text-3xl font-bold font-serif tracking-tight">
                {displayTitle || `Post ${detail.id.slice(0, 8)}`}
              </h1>
            );
          })()}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge variant="outline">{detail.status}</Badge>
            <Badge variant="secondary">{detail.kind}</Badge>
            {detail.labels.map((l) => (
              <Badge key={l.id} variant="outline" className="text-xs">
                {l.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMutable && (
            <Button variant="outline" asChild>
              <Link href={`/admin/posts/${detail.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Link>
            </Button>
          )}

          {canPublish && (
            <Button
              onClick={() => setPublishOpen(true)}
              disabled={publishMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="mr-2 h-4 w-4" /> Publish
            </Button>
          )}

          {canCorrect && (
            <Button variant="outline" onClick={() => setCorrectionOpen(true)}>
              <AlertTriangle className="mr-2 h-4 w-4" /> Correction
            </Button>
          )}

          {canArchive && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Archive
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive this post?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will archive "
                    {detail.title || detail.text.slice(0, 80)}". Published posts
                    cannot be archived.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate({ postId: detail.id })}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Archive
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {detail.status === "REJECTED" && detail.validationReason && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Validation Rejected</h4>
            <p className="text-sm mt-1">{detail.validationReason}</p>
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none font-serif bg-muted/30 p-6 rounded-md whitespace-pre-wrap border border-dashed">
              {detail.text || (
                <span className="text-muted-foreground italic">No content</span>
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
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono">{detail.id.slice(0, 8)}...</span>
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
