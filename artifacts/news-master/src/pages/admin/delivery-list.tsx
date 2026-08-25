import { useState } from "react";
import { useGetDeliveries, DeliveryStatus } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Send, AlertCircle, CheckCircle2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDeliveryList() {
  const [status, setStatus] = useState<string>("all");
  const [platform, setPlatform] = useState<string>("all");
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const currentPage = cursorHistory.length + 1;

  const handleStatusChange = (val: string) => {
    setStatus(val);
    setCursorHistory([]);
    setCurrentCursor(undefined);
  };

  const handlePlatformChange = (val: string) => {
    setPlatform(val);
    setCursorHistory([]);
    setCurrentCursor(undefined);
  };

  const { data, isLoading, error, isFetching } = useGetDeliveries({
    status: status !== "all" ? status : undefined,
    platform: platform !== "all" ? platform : undefined,
    cursor: currentCursor,
    limit: 25,
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

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
          Deliveries
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Monitor the status of content pushed to external platforms.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(DeliveryStatus).map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={platform} onValueChange={handlePlatformChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="x">X (Twitter)</SelectItem>
            <SelectItem value="telegram">Telegram</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {/* Mobile View: Card List */}
        <div className="block md:hidden divide-y">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : error ? (
            <div className="p-6 text-center text-destructive text-sm">Failed to load deliveries.</div>
          ) : !data?.items?.length ? (
            <div className="p-8 text-center">
              <Send className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium text-sm">No deliveries found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your filters.</p>
            </div>
          ) : (
            data.items.map((del: any) => (
              <div key={del.id} className="p-4 space-y-2 hover:bg-muted/20 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm capitalize">{del.platform}</span>
                    <Badge variant={del.format === "REEL" ? "default" : "outline"} className="text-[10px] py-0">
                      {del.format ?? "IMAGE"}
                    </Badge>
                  </div>
                  {getDeliveryStatusBadge(del.status)}
                </div>

                {del.postTitle ? (
                  <Link href={`/admin/posts/${del.postNumber || del.postId}`} className="font-medium text-sm hover:underline text-foreground block line-clamp-1 leading-snug">
                    {del.postTitle}
                  </Link>
                ) : (
                  <div className="font-mono text-xs text-muted-foreground truncate">
                    {del.destination || `ID: ${del.id.slice(0, 8)}`}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t text-xs text-muted-foreground">
                  <span>{del.sentAt ? format(new Date(del.sentAt), "MMM d, HH:mm:ss") : "Not sent"}</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" asChild>
                    <Link href={`/admin/deliveries/${del.id}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">Format</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">Attempts</th>
                <th className="px-4 py-3 font-medium">Sent At</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-4">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-destructive"
                  >
                    Failed to load deliveries.
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Send className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">No deliveries found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your filters.
                    </p>
                  </td>
                </tr>
              ) : (
                data.items.map((del) => (
                  <tr
                    key={del.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium capitalize">
                      {del.platform}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={del.format === "REEL" ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {del.format ?? "IMAGE"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {del.destination || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {getDeliveryStatusBadge(del.status)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {del.attemptCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {del.sentAt
                        ? format(new Date(del.sentAt), "MMM d, HH:mm:ss")
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/deliveries/${del.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground gap-3">
          <div>
            Showing {data?.items?.length || 0} deliveries {currentPage > 1 && `(Page ${currentPage})`}
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
