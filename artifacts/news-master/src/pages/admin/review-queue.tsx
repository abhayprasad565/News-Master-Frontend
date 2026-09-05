import { useState } from "react";
import {
  useGetReviewQueue,
  useApproveReviewJob,
  useRejectReviewJob,
  useRequeueReviewJob,
  useRequestCorrectionReviewJob,
  getGetReviewQueueQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  ListChecks,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export default function AdminReviewQueue() {
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const currentPage = cursorHistory.length + 1;

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["adminReviewQueue", currentCursor],
    queryFn: () => apiFetch<{ items: any[]; nextCursor?: string }>(
      `/api/admin/review?limit=20${currentCursor ? `&cursor=${encodeURIComponent(currentCursor)}` : ''}`
    ),
  });

  const handleNextPage = () => {
    if (data?.nextCursor) {
      setCursorHistory((prev) => [...prev, currentCursor || ""]);
      setCurrentCursor(data.nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const prevCursor = cursorHistory[cursorHistory.length - 1];
      setCursorHistory((prev) => prev.slice(0, -1));
      setCurrentCursor(prevCursor || undefined);
    }
  };
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionType, setActionType] = useState<
    "APPROVE" | "REJECT" | "REQUEUE" | "REQUEST_CORRECTION" | null
  >(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approveMutation = useApproveReviewJob({
    mutation: { onSuccess: handleSuccess, onError: handleError },
  });
  const rejectMutation = useRejectReviewJob({
    mutation: { onSuccess: handleSuccess, onError: handleError },
  });
  const requeueMutation = useRequeueReviewJob({
    mutation: { onSuccess: handleSuccess, onError: handleError },
  });
  const requestCorrectionMutation = useRequestCorrectionReviewJob({
    mutation: { onSuccess: handleSuccess, onError: handleError },
  });

  function handleSuccess() {
    toast({ title: "Action recorded successfully" });
    queryClient.invalidateQueries({ queryKey: getGetReviewQueueQueryKey() });
    setSelectedJob(null);
    setActionType(null);
    setActionReason("");
  }

  function handleError(err: any) {
    if (err.statusCode === 409) {
      toast({
        title: "Version Conflict",
        description:
          "This item was updated by someone else. Please refresh and try again.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: getGetReviewQueueQueryKey() });
    } else {
      toast({
        title: "Action failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }

  function submitAction() {
    if (!selectedJob || !actionType) return;

    const trimmedReason = actionReason.trim();
    const defaultReason =
      actionType === "APPROVE"
        ? "Approved by administrator"
        : actionType === "REJECT"
          ? "Rejected by administrator"
          : actionType === "REQUEST_CORRECTION"
            ? "Correction requested by administrator"
            : "Requeued by administrator";

    const reason = trimmedReason.length >= 3 ? trimmedReason : defaultReason;
    const expectedVersion =
      typeof selectedJob.version === "number" && selectedJob.version > 0
        ? selectedJob.version
        : Number(selectedJob.version) || 1;

    const payload = {
      jobId: selectedJob.id,
      data: {
        version: 1 as const,
        action: actionType,
        reason,
        expectedVersion,
      },
    };

    if (actionType === "APPROVE") approveMutation.mutate(payload);
    else if (actionType === "REJECT") rejectMutation.mutate(payload);
    else if (actionType === "REQUEUE") requeueMutation.mutate(payload);
    else if (actionType === "REQUEST_CORRECTION")
      requestCorrectionMutation.mutate(payload);
  }

  const isPending =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    requeueMutation.isPending ||
    requestCorrectionMutation.isPending;

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
          Review Queue
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Review AI-generated content before publication.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Failed to load review queue.
        </div>
      ) : !data?.items?.length ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-24">
            <ListChecks className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-foreground">
              Queue is empty
            </p>
            <p className="text-sm text-muted-foreground">
              All caught up! Excellent work.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {data.items.map((job) => (
            <Card key={job.id} className="overflow-hidden border-border/50">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="default"
                        className="font-semibold text-xs"
                      >
                        {(job as any).displayType ||
                          (job as any).type ||
                          (job as any).name ||
                          "Review job"}
                      </Badge>
                      <Badge variant="outline" className="font-mono text-xs">
                        v{job.version}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(job.createdAt), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                      {(job as any).title ||
                        (job as any).displayType ||
                        (job as any).type ||
                        (job as any).name ||
                        "Review item"}
                    </h2>
                    {(job as any).summary && (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/20 p-3 rounded-md border border-border/40">
                        {(job as any).summary}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1 border-t border-border/40">
                    {(job as any).postId && (
                      <div className="flex items-center">
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        Associated Post:{" "}
                        <Link
                          href={`/admin/posts/${(job as any).postNumber || (job as any).postId}`}
                          className="ml-1 text-primary hover:underline font-mono font-semibold"
                        >
                          #
                          {(job as any).postNumber ||
                            (job as any).postId.slice(0, 8)}
                        </Link>
                      </div>
                    )}
                    {(job as any).eventTitle && (
                      <div className="flex items-center">
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        Event:{" "}
                        <span className="ml-1 text-foreground">
                          {(job as any).eventTitle}
                        </span>
                      </div>
                    )}
                    {(job as any).claimText && (
                      <div className="flex items-center">
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        Claim:{" "}
                        <span className="ml-1 text-foreground">
                          {(job as any).claimText}
                        </span>
                      </div>
                    )}
                    {(job as any).developmentSummary && (
                      <div className="flex items-center">
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        Development:{" "}
                        <span className="ml-1 text-foreground">
                          {(job as any).developmentSummary}
                        </span>
                      </div>
                    )}
                    {(job as any).eventId && !(job as any).eventTitle && (
                      <div className="flex items-center">
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        Associated Event:{" "}
                        <span className="ml-1 font-mono">
                          {(job as any).eventId}
                        </span>
                      </div>
                    )}
                    {(job as any).claimId && !(job as any).claimText && (
                      <div className="flex items-center">
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        Associated Claim:{" "}
                        <span className="ml-1 font-mono">
                          {(job as any).claimId}
                        </span>
                      </div>
                    )}
                  </div>

                  <details className="text-xs text-muted-foreground pt-1">
                    <summary className="cursor-pointer font-medium hover:text-foreground select-none">
                      Technical Payload Details
                    </summary>
                    <div className="mt-2 bg-muted/40 p-3 rounded-md font-mono text-xs whitespace-pre-wrap max-h-48 overflow-y-auto border border-border/50">
                      {JSON.stringify(job.payload, null, 2)}
                    </div>
                  </details>
                </div>

                <div className="bg-muted/20 p-4 sm:p-6 border-t md:border-t-0 md:border-l flex flex-col justify-center gap-3 md:w-64">
                  {(job as any).postId && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link
                        href={`/admin/posts/${(job as any).postNumber || (job as any).postId}/studio?tab=story`}
                      >
                        <FileText className="mr-2 h-4 w-4" /> Open Studio
                      </Link>
                    </Button>
                  )}

                  <Button
                    variant="default"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      setSelectedJob(job);
                      setActionType("APPROVE");
                      setActionReason("Approved by administrator");
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                  </Button>

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      setSelectedJob(job);
                      setActionType("REJECT");
                      setActionReason("Rejected by administrator");
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedJob(job);
                      setActionType("REQUEST_CORRECTION");
                      setActionReason("Correction requested by administrator");
                    }}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" /> Request
                    Correction
                  </Button>

                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      setSelectedJob(job);
                      setActionType("REQUEUE");
                      setActionReason("Requeued by administrator");
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" /> Requeue
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {data?.items && data.items.length > 0 && (
        <Card className="p-3">
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-3">
            <div>
              Showing {data?.items?.length || 0} review items {currentPage > 1 && `(Page ${currentPage})`}
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
      )}

      {/* Shared Action Dialog */}
      <Dialog
        open={!!actionType}
        onOpenChange={(open) => !open && setActionType(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "APPROVE" && "Approve Job"}
              {actionType === "REJECT" && "Reject Job"}
              {actionType === "REQUEUE" && "Requeue Job"}
              {actionType === "REQUEST_CORRECTION" && "Request Correction"}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for this action. This will be recorded in
              the audit log.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="Enter reason..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionType(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={submitAction}
              disabled={isPending || !actionReason.trim()}
              className={
                actionType === "APPROVE"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : actionType === "REJECT"
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    : ""
              }
            >
              {isPending ? "Processing..." : "Confirm Action"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
