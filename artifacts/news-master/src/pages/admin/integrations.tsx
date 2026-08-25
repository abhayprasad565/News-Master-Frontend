import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Youtube, Link2, Unplug, RefreshCw, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type YouTubeStatus = {
  enabled: boolean;
  configured: boolean;
  publicUploadsApproved: boolean;
  connection: null | {
    id: string;
    channelId: string;
    channelName: string;
    status: string;
    connectedAt: string;
  };
};

export default function AdminIntegrations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const status = useQuery({
    queryKey: ["youtubeIntegration"],
    queryFn: () =>
      apiFetch<YouTubeStatus>("/api/admin/integrations/youtube/status"),
  });
  const connect = useMutation({
    mutationFn: () =>
      apiFetch<{ authorizationUrl: string }>(
        "/api/admin/integrations/youtube/connect",
        { method: "POST" },
      ),
    onSuccess: ({ authorizationUrl }) => {
      window.location.assign(authorizationUrl);
    },
    onError: (error) =>
      toast({
        title: "Could not start YouTube connection",
        description: String(error),
        variant: "destructive",
      }),
  });
  const disconnect = useMutation({
    mutationFn: () =>
      apiFetch("/api/admin/integrations/youtube", { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["youtubeIntegration"] });
      toast({ title: "YouTube disconnected" });
    },
    onError: (error) =>
      toast({
        title: "Disconnect failed",
        description: String(error),
        variant: "destructive",
      }),
  });
  const value = status.data;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
          Integrations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administrator-owned publishing connections and compliance gates.
        </p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <Youtube className="h-8 w-8 text-red-600" />
              <div>
                <CardTitle>YouTube Shorts</CardTitle>
                <CardDescription>
                  Manual, Reel-only delivery through one allowlisted channel.
                </CardDescription>
              </div>
            </div>
            <Badge variant={value?.connection ? "default" : "secondary"}>
              {value?.connection ? "Connected" : "Not connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {value?.connection ? (
            <div className="rounded-md border p-4 text-sm space-y-1">
              <div className="font-semibold">
                {value.connection.channelName}
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                {value.connection.channelId}
              </div>
              <div className="flex gap-2 pt-2">
                <Badge variant="outline">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  OAuth active
                </Badge>
                <Badge
                  variant={
                    value.publicUploadsApproved ? "default" : "secondary"
                  }
                >
                  {value.publicUploadsApproved
                    ? "Public uploads approved"
                    : "Private-only audit gate"}
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect the exact channel listed in YOUTUBE_EXPECTED_CHANNEL_IDS.
              Other channels are rejected.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => connect.mutate()}
              disabled={
                !value?.enabled || !value?.configured || connect.isPending
              }
            >
              {value?.connection ? (
                <RefreshCw className="mr-2 h-4 w-4" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              {value?.connection ? "Reconnect" : "Connect YouTube"}
            </Button>
            {value?.connection && (
              <Button
                variant="destructive"
                onClick={() => disconnect.mutate()}
                disabled={disconnect.isPending}
              >
                <Unplug className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            )}
          </div>
          {!value?.enabled && (
            <p className="text-xs text-muted-foreground">
              The YouTube publishing feature is disabled.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
