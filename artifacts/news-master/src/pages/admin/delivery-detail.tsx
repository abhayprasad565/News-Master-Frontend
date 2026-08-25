import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetDelivery,
  useRetryDelivery,
  useReconcileDelivery,
  ReconcileInputOutcome,
  getGetDeliveryQueryKey,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  Code,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminDeliveryDetail() {
  const { id } = useParams();
  const {
    data: detail,
    isLoading,
    error,
  } = useGetDelivery(id || "", {
    query: { enabled: !!id } as any,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [retryReason, setRetryReason] = useState("");
  const [retryOpen, setRetryOpen] = useState(false);

  const [reconcileReason, setReconcileReason] = useState("");
  const [reconcileOutcome, setReconcileOutcome] = useState<
    ReconcileInputOutcome | ""
  >("");
  const [reconcileOpen, setReconcileOpen] = useState(false);

  const retryMutation = useRetryDelivery({
    mutation: {
      onSuccess: () => {
        toast({ title: "Retry triggered successfully" });
        queryClient.invalidateQueries({
          queryKey: getGetDeliveryQueryKey(id!),
        });
        setRetryOpen(false);
        setRetryReason("");
      },
      onError: (err: any) =>
        toast({
          title: "Retry failed",
          description: err.message,
          variant: "destructive",
        }),
    },
  });

  const reconcileMutation = useReconcileDelivery({
    mutation: {
      onSuccess: () => {
        toast({ title: "Delivery reconciled successfully" });
        queryClient.invalidateQueries({
          queryKey: getGetDeliveryQueryKey(id!),
        });
        setReconcileOpen(false);
        setReconcileReason("");
        setReconcileOutcome("");
      },
      onError: (err: any) =>
        toast({
          title: "Reconcile failed",
          description: err.message,
          variant: "destructive",
        }),
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load delivery details
      </div>
    );
  }

  const { delivery, attempts, post, publication } = detail;
  const youtube = (
    detail as typeof detail & {
      youtube?: {
        uploadStatus: string;
        processingStatus: string;
        bytesUploaded: number;
        fileSize: number;
        videoId: string | null;
        remoteUrl: string | null;
        lastError: string | null;
      } | null;
    }
  ).youtube;

  const getDeliveryStatusBadge = (s: string) => {
    switch (s) {
      case "SENT":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Sent
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" /> Failed
          </Badge>
        );
      case "DEAD":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" /> Dead
          </Badge>
        );
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "WAITING_FOR_ASSET":
        return (
          <Badge variant="outline" className="border-slate-500 text-slate-600">
            Waiting for asset
          </Badge>
        );
      case "RENDERING":
        return (
          <Badge
            variant="outline"
            className="border-indigo-500 text-indigo-600"
          >
            Rendering
          </Badge>
        );
      case "READY":
        return (
          <Badge variant="outline" className="border-cyan-500 text-cyan-600">
            Ready
          </Badge>
        );
      case "SENDING":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600">
            Sending...
          </Badge>
        );
      case "RETRY":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            Retry
          </Badge>
        );
      case "UNKNOWN":
        return (
          <Badge
            variant="outline"
            className="border-purple-500 text-purple-600"
          >
            Unknown
          </Badge>
        );
      default:
        return <Badge variant="outline">{s}</Badge>;
    }
  };

  const showRetry =
    delivery.status === "FAILED" ||
    delivery.status === "RETRY" ||
    delivery.status === "DEAD";
  const showReconcile = delivery.status === "UNKNOWN";

  const handleRetry = () => {
    retryMutation.mutate({
      deliveryId: delivery.id,
      data: { reason: retryReason || "Manual retry" },
    });
  };

  const handleReconcile = () => {
    if (!reconcileOutcome) return;
    reconcileMutation.mutate({
      deliveryId: delivery.id,
      data: {
        outcome: reconcileOutcome as ReconcileInputOutcome,
        reason: reconcileReason || "Manual reconciliation",
      },
    });
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      <div className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
        <Link href="/admin/deliveries" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Deliveries
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight flex items-center">
            <Send className="mr-3 h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            Delivery Details
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {delivery.platform === "youtube" && youtube
              ? getDeliveryStatusBadge(
                  youtube.uploadStatus === "SUCCEEDED"
                    ? "SENT"
                    : youtube.uploadStatus === "PROCESSING"
                      ? "SENDING"
                      : youtube.uploadStatus === "AUTH_REQUIRED"
                        ? "Reconnect required"
                        : youtube.uploadStatus === "REMOTE_MISSING"
                          ? "Remote missing"
                          : youtube.uploadStatus === "UPLOADING"
                            ? "Uploading"
                            : youtube.uploadStatus,
                )
              : getDeliveryStatusBadge(delivery.status)}
            <Badge variant="outline" className="capitalize">
              {delivery.platform}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showRetry && (
            <Dialog open={retryOpen} onOpenChange={setRetryOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <RotateCcw className="mr-2 h-4 w-4" />{" "}
                  {delivery.platform === "youtube"
                    ? youtube?.videoId
                      ? "Recheck processing"
                      : "Resume upload"
                    : "Retry"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {delivery.platform === "youtube"
                      ? youtube?.videoId
                        ? "Recheck YouTube processing"
                        : "Resume YouTube upload"
                      : "Retry Delivery"}
                  </DialogTitle>
                  <DialogDescription>
                    {delivery.platform === "youtube"
                      ? "Continue only the original durable upload or reconcile its known video. No replacement video will be created."
                      : "Trigger another attempt to send this payload."}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="Reason for retry (optional)..."
                    value={retryReason}
                    onChange={(e) => setRetryReason(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRetryOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRetry}
                    disabled={retryMutation.isPending}
                  >
                    Confirm Retry
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {showReconcile && (
            <Dialog open={reconcileOpen} onOpenChange={setReconcileOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  <ShieldAlert className="mr-2 h-4 w-4" /> Reconcile
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reconcile Unknown State</DialogTitle>
                  <DialogDescription>
                    Manually resolve this delivery if the remote system status
                    is unknown.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <Select
                    value={reconcileOutcome}
                    onValueChange={(val: any) => setReconcileOutcome(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SENT">Sent (Success)</SelectItem>
                      <SelectItem value="NOT_SENT">Not Sent</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Reason or notes..."
                    value={reconcileReason}
                    onChange={(e) => setReconcileReason(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setReconcileOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReconcile}
                    disabled={reconcileMutation.isPending || !reconcileOutcome}
                  >
                    Reconcile
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Delivery Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-col border-b pb-2">
              <span className="text-muted-foreground text-xs mb-1">ID</span>
              <span className="font-mono">{delivery.id}</span>
            </div>
            <div className="flex flex-col border-b pb-2">
              <span className="text-muted-foreground text-xs mb-1">
                Destination
              </span>
              <span className="font-mono">
                {delivery.destination || "Default"}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Format</span>
              <Badge
                variant={delivery.format === "REEL" ? "default" : "outline"}
              >
                {delivery.format ?? "IMAGE"}
              </Badge>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Attempts</span>
              <span className="font-medium">{delivery.attemptCount}</span>
            </div>
            {delivery.sentAt && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Sent At</span>
                <span className="font-medium text-emerald-600">
                  {format(new Date(delivery.sentAt), "MMM d, HH:mm:ss")}
                </span>
              </div>
            )}
            {delivery.lastError && (
              <div className="flex flex-col bg-destructive/10 text-destructive p-3 rounded mt-2">
                <span className="text-xs font-semibold mb-1">Last Error</span>
                <span className="font-mono text-xs">{delivery.lastError}</span>
              </div>
            )}
            {youtube && (
              <div className="rounded border p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">YouTube state</span>
                  <span>{youtube.uploadStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Progress</span>
                  <span>
                    {youtube.bytesUploaded} / {youtube.fileSize} bytes
                  </span>
                </div>
                {youtube.remoteUrl && (
                  <a
                    className="text-primary hover:underline"
                    href={youtube.remoteUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open YouTube Short
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Related Entities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {publication && (
              <div className="flex flex-col border-b pb-2">
                <span className="text-muted-foreground text-xs mb-1">
                  Publication
                </span>
                <Link
                  href={`/admin/publications/${publication.id}`}
                  className="text-primary hover:underline font-mono"
                >
                  {publication.id} (v{publication.revision})
                </Link>
              </div>
            )}
            {post && (
              <div className="flex flex-col border-b pb-2">
                <span className="text-muted-foreground text-xs mb-1">Post</span>
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="text-primary hover:underline font-medium line-clamp-1 flex items-center gap-1.5"
                >
                  <span className="font-mono font-bold">
                    #{(post as any).postNumber || post.id.slice(0, 8)}:
                  </span>
                  <span>
                    {post.title ||
                      `Post #${(post as any).postNumber || post.id.slice(0, 8)}`}
                  </span>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attempt History</CardTitle>
        </CardHeader>
        <div className="w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b border-t">
              <tr>
                <th className="px-4 py-3 font-medium w-16">#</th>
                <th className="px-4 py-3 font-medium w-48">Time</th>
                <th className="px-4 py-3 font-medium w-32">Outcome</th>
                <th className="px-4 py-3 font-medium w-24">Status Code</th>
                <th className="px-4 py-3 font-medium">Error Message</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {!attempts?.length ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No attempts recorded.
                  </td>
                </tr>
              ) : (
                attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-center font-medium">
                      {attempt.attemptNumber}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(attempt.createdAt), "MMM d, HH:mm:ss")}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {attempt.outcome || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {attempt.statusCode || "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs truncate max-w-xs text-destructive">
                      {attempt.errorMessage || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
