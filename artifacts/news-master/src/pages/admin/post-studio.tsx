import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import {
  AlertTriangle,
  Download,
  Film,
  Loader2,
  RefreshCw,
  Save,
  Upload,
} from "lucide-react";
import { apiFetch, FrontendApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

type Asset = {
  id: string;
  type: string;
  mimeType: string;
  url: string;
  contentHash: string;
};
type Track = {
  id: string;
  title: string | null;
  storageKey: string;
  source: "LIBRARY" | "UPLOAD";
  durationSeconds: number;
  theme: string;
  energyLevel: string;
  retiredAt: string | null;
};
type ReelConfig = {
  postId: string;
  version: number;
  visual: {
    mode: "ORIGINAL" | "CUSTOM" | "GENERATED" | "NONE";
    assetId: string | null;
  };
  audio: {
    mode: "AUTO" | "TRACK" | "UPLOAD" | "NONE";
    trackId: string | null;
    autoFilters: {
      theme?: string;
      energy?: "CALM" | "NEUTRAL" | "UPBEAT";
      tags: string[];
    };
    startSeconds: number;
    volume: number;
    fadeInSeconds: number;
    fadeOutSeconds: number;
  };
  rendering: { durationSeconds: number; template: "scrollbrief-card-v1" };
  disclosure: { containsSyntheticMedia: boolean | null };
  updatedAt: string;
  updatedBy: string | null;
};
type Render = {
  id: string;
  type: "PREVIEW" | "FINAL";
  status: "QUEUED" | "RENDERING" | "COMPLETED" | "FAILED";
  configHash: string;
  outputUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
};
type Studio = {
  post: {
    id: string;
    title: string | null;
    text: string;
    status: string;
    eventId: string | null;
    labels: { id: string; name: string }[];
  };
  reelConfig: ReelConfig;
  authoritativePreviewConfigHash: string | null;
  authoritativeConfigHash: string | null;
  imageAssets: Asset[];
  selectedAudio: Track | null;
  latestPreview: Render | null;
  latestFinal: Render | null;
  renders: Render[];
  capabilities: {
    canEditStory: boolean;
    canEditReel: boolean;
    canRender: boolean;
    canPublishInstagram: boolean;
    canPublishYouTube: boolean;
  };
};

const queryKey = (postId: string) => ["admin", "postStudio", postId] as const;
const labelForTrack = (track: Track) =>
  track.title?.trim() ||
  track.storageKey.split("/").at(-1) ||
  track.id.slice(0, 8);

export default function AdminPostStudio() {
  const { id: postId = "" } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const rawTab = new URLSearchParams(window.location.search).get("tab");
  const requestedTab = ["story", "visual", "audio", "reel"].includes(
    rawTab ?? "",
  )
    ? rawTab!
    : "story";
  const [tab, setTab] = useState(requestedTab);
  const [story, setStory] = useState<{ title: string; text: string } | null>(
    null,
  );
  const [reel, setReel] = useState<ReelConfig | null>(null);
  const [conflict, setConflict] = useState(false);
  const [trackSearch, setTrackSearch] = useState("");
  const [audioSection, setAudioSection] = useState<
    "AUTO" | "TRACK" | "UPLOAD" | "NONE" | null
  >(null);

  const query = useQuery({
    queryKey: queryKey(postId),
    queryFn: () => apiFetch<Studio>(`/api/admin/posts/${postId}/studio`),
    enabled: Boolean(postId),
    refetchInterval: (state) =>
      state.state.data?.renders.some((render) =>
        ["QUEUED", "RENDERING"].includes(render.status),
      )
        ? 2_000
        : false,
  });
  const data = query.data;
  useEffect(() => {
    if (!data) return;
    setStory(
      (value) =>
        value ?? { title: data.post.title ?? "", text: data.post.text },
    );
    setReel((value) => value ?? data.reelConfig);
    setAudioSection((value) => value ?? data.reelConfig.audio.mode);
  }, [data]);

  const storyDirty = Boolean(
    data &&
    story &&
    (story.title !== (data.post.title ?? "") || story.text !== data.post.text),
  );
  const reelDirty = Boolean(
    data &&
    reel &&
    JSON.stringify(stripServerConfig(reel)) !==
      JSON.stringify(stripServerConfig(data.reelConfig)),
  );
  const previewCurrent = Boolean(
    data?.latestPreview?.status === "COMPLETED" &&
    data.latestPreview.configHash === data.authoritativePreviewConfigHash,
  );
  const preview =
    data?.latestPreview?.status === "COMPLETED"
      ? data.latestPreview
      : data?.latestFinal?.status === "COMPLETED"
        ? data.latestFinal
        : null;

  const saveStory = useMutation({
    mutationFn: () =>
      apiFetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: story?.title || null,
          text: story?.text,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKey(postId) });
      toast({ title: "Story saved" });
    },
    onError: (error) =>
      toast({
        title: "Story save failed",
        description: String(error),
        variant: "destructive",
      }),
  });
  const saveReel = useMutation({
    mutationFn: () =>
      apiFetch<ReelConfig>(`/api/admin/posts/${postId}/reel-config`, {
        method: "PATCH",
        body: JSON.stringify({
          ...stripServerConfig(reel!),
          expectedVersion: data!.reelConfig.version,
        }),
      }),
    onSuccess: (config) => {
      setConflict(false);
      setReel(config);
      queryClient.setQueryData<Studio>(queryKey(postId), (current) =>
        current ? { ...current, reelConfig: config } : current,
      );
      queryClient.invalidateQueries({ queryKey: queryKey(postId) });
      toast({ title: "Reel settings saved" });
    },
    onError: (error) => {
      if (error instanceof FrontendApiError && error.status === 409)
        setConflict(true);
      toast({
        title: "Reel save failed",
        description: String(error),
        variant: "destructive",
      });
    },
  });
  const renderMutation = useMutation({
    mutationFn: () =>
      apiFetch<Render>(`/api/admin/posts/${postId}/renders`, {
        method: "POST",
        body: JSON.stringify({
          type: "PREVIEW",
          expectedConfigVersion: data!.reelConfig.version,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(postId) });
      toast({ title: "Render queued" });
    },
    onError: (error) =>
      toast({
        title: "Render could not be queued",
        description: String(error),
        variant: "destructive",
      }),
  });
  const finalizeMutation = useMutation({
    mutationFn: () =>
      apiFetch<Render>(
        `/api/admin/posts/${postId}/renders/${data!.latestPreview!.id}/finalize`,
        {
          method: "POST",
          body: JSON.stringify({
            expectedConfigVersion: data!.reelConfig.version,
          }),
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey(postId) });
      toast({ title: "Final render queued" });
    },
    onError: (error) =>
      toast({
        title: "Preview could not be marked final",
        description: String(error),
        variant: "destructive",
      }),
  });
  const refreshAuto = useMutation({
    mutationFn: () =>
      apiFetch<ReelConfig>(
        `/api/admin/posts/${postId}/reel-config/refresh-auto-audio`,
        {
          method: "POST",
          body: JSON.stringify({ expectedVersion: data!.reelConfig.version }),
        },
      ),
    onSuccess: (config) => {
      setReel(config);
      queryClient.invalidateQueries({ queryKey: queryKey(postId) });
      toast({ title: "Automatic audio refreshed" });
    },
  });
  const tracksQuery = useQuery({
    queryKey: ["admin", "audioTracks", audioSection, trackSearch],
    queryFn: () => {
      const parameters = new URLSearchParams();
      if (trackSearch) parameters.set("search", trackSearch);
      parameters.set(
        "source",
        audioSection === "UPLOAD" ? "UPLOAD" : "LIBRARY",
      );
      return apiFetch<{ items: Track[] }>(
        `/api/admin/audio-tracks?${parameters.toString()}`,
      );
    },
    enabled: tab === "audio" && audioSection !== "NONE",
  });
  const tracks = useMemo(
    () =>
      (tracksQuery.data?.items ?? []).filter(
        (track) =>
          !trackSearch ||
          labelForTrack(track)
            .toLowerCase()
            .includes(trackSearch.toLowerCase()),
      ),
    [trackSearch, tracksQuery.data],
  );
  const selectedTrack =
    tracks.find((track) => track.id === reel?.audio.trackId) ??
    (data?.selectedAudio?.id === reel?.audio.trackId
      ? (data?.selectedAudio ?? null)
      : null);

  if (query.isError)
    return (
      <div
        role="alert"
        className="space-y-3 rounded-md border border-destructive/40 p-4"
      >
        <p className="text-sm text-destructive">
          Post Studio could not be loaded.
        </p>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          Try again
        </Button>
      </div>
    );

  if (query.isLoading || !data || !story || !reel)
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading Post Studio…
      </div>
    );

  const patchReel = (patch: Partial<ReelConfig>) =>
    setReel({ ...reel, ...patch });
  const selectVisual = (
    mode: ReelConfig["visual"]["mode"],
    assetId: string | null,
  ) => patchReel({ visual: { mode, assetId } });
  return (
    <div className="space-y-4 pb-28">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/admin/posts/${postId}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to post
          </Link>
          <h1 className="mt-1 text-3xl font-serif font-bold">Post Studio</h1>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{data.post.status}</Badge>
          <Badge variant={storyDirty ? "destructive" : "secondary"}>
            Story {storyDirty ? "Unsaved" : "Saved"}
          </Badge>
          <Badge variant={reelDirty ? "destructive" : "secondary"}>
            Reel {conflict ? "Conflict" : reelDirty ? "Unsaved" : "Saved"}
          </Badge>
        </div>
      </header>
      {conflict && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-md border border-amber-500/50 bg-amber-500/10 p-3"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Another session saved this
            Reel. Your local values are preserved.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const refreshed = await query.refetch();
              if (!refreshed.isSuccess || !refreshed.data) return;
              setReel(refreshed.data.reelConfig);
              setAudioSection(refreshed.data.reelConfig.audio.mode);
              setConflict(false);
            }}
          >
            Reload server version
          </Button>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.4fr)]">
        <StudioPreview
          preview={preview ?? null}
          visual={
            data.imageAssets.find(
              (asset) => asset.id === reel.visual.assetId,
            ) ?? null
          }
          current={previewCurrent}
        />
        <Card>
          <CardContent className="pt-6">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="story">Story</TabsTrigger>
                <TabsTrigger value="visual">Visual</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
                <TabsTrigger value="reel">Reel</TabsTrigger>
              </TabsList>
              <TabsContent value="story" className="space-y-4 pt-4">
                <fieldset
                  disabled={!data.capabilities.canEditStory}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="studio-title">Title</Label>
                    <Input
                      id="studio-title"
                      value={story.title}
                      onChange={(event) =>
                        setStory({ ...story, title: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="studio-text">Story</Label>
                    <Textarea
                      id="studio-text"
                      rows={14}
                      value={story.text}
                      onChange={(event) =>
                        setStory({ ...story, text: event.target.value })
                      }
                    />
                  </div>
                </fieldset>
                {!data.capabilities.canEditStory && (
                  <p className="text-sm text-muted-foreground">
                    Published Story fields are locked. Reel settings remain
                    editable.
                  </p>
                )}
              </TabsContent>
              <TabsContent value="visual" className="space-y-4 pt-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["ORIGINAL", "CUSTOM", "NONE"] as const).map((choice) => {
                    const standardAsset =
                      data.imageAssets.find(
                        (asset) => asset.type === "GRAPHIC",
                      ) ??
                      data.imageAssets.find(
                        (asset) => asset.type === "ORIGINAL_IMAGE",
                      );
                    const selected =
                      choice === "ORIGINAL"
                        ? ["ORIGINAL", "GENERATED"].includes(reel.visual.mode)
                        : reel.visual.mode === choice;
                    return (
                      <Button
                        key={choice}
                        variant={selected ? "default" : "outline"}
                        onClick={() => {
                          if (choice === "NONE")
                            return selectVisual("NONE", null);
                          if (choice === "CUSTOM") {
                            const custom = data.imageAssets.find(
                              (asset) => asset.type === "CUSTOM_IMAGE",
                            );
                            return selectVisual("CUSTOM", custom?.id ?? null);
                          }
                          return selectVisual(
                            standardAsset?.type === "GRAPHIC"
                              ? "GENERATED"
                              : "ORIGINAL",
                            standardAsset?.id ?? null,
                          );
                        }}
                      >
                        {choice === "ORIGINAL"
                          ? "Original"
                          : choice === "CUSTOM"
                            ? "Custom"
                            : "No image"}
                      </Button>
                    );
                  })}
                </div>
                {reel.visual.mode === "CUSTOM" && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {data.imageAssets
                        .filter((asset) => asset.type === "CUSTOM_IMAGE")
                        .map((asset) => (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => selectVisual("CUSTOM", asset.id)}
                            className={`overflow-hidden rounded-md border text-left ${reel.visual.assetId === asset.id ? "ring-2 ring-primary" : ""}`}
                          >
                            <img
                              src={asset.url}
                              alt=""
                              className="aspect-[4/3] w-full object-cover"
                            />
                            <span className="block p-2 text-xs">
                              Custom image
                            </span>
                          </button>
                        ))}
                    </div>
                    <ImageUploader
                      postId={postId}
                      onUploaded={(asset) => {
                        queryClient.setQueryData<Studio>(
                          queryKey(postId),
                          (current) =>
                            current
                              ? {
                                  ...current,
                                  imageAssets: [asset, ...current.imageAssets],
                                }
                              : current,
                        );
                        selectVisual("CUSTOM", asset.id);
                      }}
                    />
                  </>
                )}
              </TabsContent>
              <TabsContent value="audio" className="space-y-4 pt-4">
                <div>
                  <Label>Audio mode</Label>
                  <Select
                    value={audioSection ?? reel.audio.mode}
                    onValueChange={(
                      section: "AUTO" | "TRACK" | "UPLOAD" | "NONE",
                    ) => {
                      setAudioSection(section);
                      const requiredSource =
                        section === "TRACK"
                          ? "LIBRARY"
                          : section === "UPLOAD"
                            ? "UPLOAD"
                            : null;
                      const canKeepTrack =
                        section === "AUTO"
                          ? reel.audio.mode === "AUTO"
                          : requiredSource !== null &&
                            selectedTrack?.source === requiredSource;
                      patchReel({
                        audio: {
                          ...reel.audio,
                          mode: section,
                          trackId:
                            section === "NONE" || !canKeepTrack
                              ? null
                              : reel.audio.trackId,
                          startSeconds:
                            section === "NONE" ? 0 : reel.audio.startSeconds,
                          fadeInSeconds:
                            section === "NONE" ? 0 : reel.audio.fadeInSeconds,
                          fadeOutSeconds:
                            section === "NONE" ? 0 : reel.audio.fadeOutSeconds,
                        },
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["AUTO", "TRACK", "UPLOAD", "NONE"].map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {mode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {audioSection === "AUTO" && (
                  <Button
                    variant="outline"
                    onClick={() => refreshAuto.mutate()}
                    disabled={reelDirty || refreshAuto.isPending}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Suggest another track
                  </Button>
                )}
                {audioSection === "UPLOAD" && (
                  <AudioUploader
                    onUploaded={(track) => {
                      queryClient.invalidateQueries({
                        queryKey: ["admin", "audioTracks"],
                      });
                      patchReel({
                        audio: {
                          ...reel.audio,
                          mode: "UPLOAD",
                          trackId: track.id,
                          startSeconds: 0,
                        },
                      });
                    }}
                  />
                )}
                {audioSection !== "NONE" && (
                  <>
                    {(audioSection === "TRACK" ||
                      audioSection === "UPLOAD") && (
                      <>
                        <Input
                          placeholder={
                            audioSection === "UPLOAD"
                              ? "Search uploaded tracks"
                              : "Search library tracks"
                          }
                          value={trackSearch}
                          onChange={(event) =>
                            setTrackSearch(event.target.value)
                          }
                        />
                        <div className="max-h-52 space-y-2 overflow-auto">
                          {tracks.map((track) => (
                            <button
                              type="button"
                              key={track.id}
                              onClick={() =>
                                patchReel({
                                  audio: {
                                    ...reel.audio,
                                    mode: audioSection,
                                    trackId: track.id,
                                  },
                                })
                              }
                              className={`flex w-full items-center justify-between rounded border p-2 text-left ${reel.audio.trackId === track.id ? "border-primary" : ""}`}
                            >
                              <span>{labelForTrack(track)}</span>
                              <span className="text-xs text-muted-foreground">
                                {track.source === "UPLOAD"
                                  ? "Uploaded"
                                  : "Library"}{" "}
                                · {track.durationSeconds.toFixed(1)}s
                              </span>
                            </button>
                          ))}
                          {!tracksQuery.isLoading && tracks.length === 0 && (
                            <p className="p-2 text-sm text-muted-foreground">
                              No matching tracks.
                            </p>
                          )}
                        </div>
                      </>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <NumberSetting
                        label="Start (seconds)"
                        value={reel.audio.startSeconds}
                        onChange={(value) =>
                          patchReel({
                            audio: { ...reel.audio, startSeconds: value },
                          })
                        }
                      />
                      <div>
                        <Label>End (start + Reel duration)</Label>
                        <Input
                          value={(
                            reel.audio.startSeconds +
                            reel.rendering.durationSeconds
                          ).toFixed(3)}
                          disabled
                        />
                      </div>
                    </div>
                    <Label>
                      Volume: {Math.round(reel.audio.volume * 100)}%
                    </Label>
                    <Slider
                      value={[reel.audio.volume]}
                      min={0}
                      max={1}
                      step={0.01}
                      onValueChange={([value]) =>
                        patchReel({
                          audio: { ...reel.audio, volume: value ?? 0 },
                        })
                      }
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <NumberSetting
                        label="Fade in"
                        value={reel.audio.fadeInSeconds}
                        onChange={(value) =>
                          patchReel({
                            audio: { ...reel.audio, fadeInSeconds: value },
                          })
                        }
                      />
                      <NumberSetting
                        label="Fade out"
                        value={reel.audio.fadeOutSeconds}
                        onChange={(value) =>
                          patchReel({
                            audio: { ...reel.audio, fadeOutSeconds: value },
                          })
                        }
                      />
                    </div>
                    {selectedTrack && (
                      <audio
                        controls
                        className="w-full"
                        src={`/api/admin/audio-tracks/${selectedTrack.id}/media`}
                      />
                    )}
                  </>
                )}
              </TabsContent>
              <TabsContent value="reel" className="space-y-4 pt-4">
                <NumberSetting
                  label="Duration (3–90 seconds)"
                  value={reel.rendering.durationSeconds}
                  min={3}
                  max={90}
                  onChange={(value) =>
                    patchReel({
                      rendering: { ...reel.rendering, durationSeconds: value },
                    })
                  }
                />
                <div>
                  <Label>Template</Label>
                  <Input value="Scrollbrief Card v1" disabled />
                </div>
                <div>
                  <Label>Synthetic-media disclosure</Label>
                  <Select
                    value={
                      reel.disclosure.containsSyntheticMedia === null
                        ? "undeclared"
                        : reel.disclosure.containsSyntheticMedia
                          ? "yes"
                          : "no"
                    }
                    onValueChange={(value) =>
                      patchReel({
                        disclosure: {
                          containsSyntheticMedia:
                            value === "undeclared" ? null : value === "yes",
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="undeclared">Choose…</SelectItem>
                      <SelectItem value="no">No synthetic media</SelectItem>
                      <SelectItem value="yes">
                        Contains synthetic media
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <RenderHistory renders={data.renders} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => saveStory.mutate()}
            disabled={
              !storyDirty ||
              !data.capabilities.canEditStory ||
              saveStory.isPending
            }
          >
            <Save className="mr-2 h-4 w-4" /> Save Story
          </Button>
          <Button
            variant="outline"
            onClick={() => saveReel.mutate()}
            disabled={
              !reelDirty || !data.capabilities.canEditReel || saveReel.isPending
            }
          >
            <Save className="mr-2 h-4 w-4" /> Save Reel
          </Button>
          <Button
            onClick={() => renderMutation.mutate()}
            disabled={
              reelDirty ||
              storyDirty ||
              renderMutation.isPending ||
              reel.disclosure.containsSyntheticMedia === null
            }
          >
            <Film className="mr-2 h-4 w-4" /> Preview
          </Button>
          <Button
            onClick={() => finalizeMutation.mutate()}
            disabled={
              reelDirty ||
              storyDirty ||
              !previewCurrent ||
              finalizeMutation.isPending ||
              reel.disclosure.containsSyntheticMedia === null
            }
          >
            <Film className="mr-2 h-4 w-4" /> Mark Preview Final
          </Button>
          {preview?.outputUrl && (
            <Button variant="outline" asChild>
              <a href={preview.outputUrl} download>
                <Download className="mr-2 h-4 w-4" /> Download
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StudioPreview({
  preview,
  visual,
  current,
}: {
  preview: Render | null;
  visual: Asset | null;
  current: boolean;
}) {
  return (
    <Card className="lg:sticky lg:top-4 lg:self-start">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Preview{" "}
          <Badge variant={current ? "secondary" : "outline"}>
            {preview ? (current ? "Current" : "Preview / outdated") : "Visual"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {preview?.outputUrl ? (
          <video
            key={preview.outputUrl}
            controls
            playsInline
            className="mx-auto aspect-[9/16] max-h-[68vh] rounded bg-black"
            src={preview.outputUrl}
          />
        ) : visual ? (
          <img
            src={visual.url}
            alt="Selected Reel visual"
            className="mx-auto aspect-[9/16] max-h-[68vh] rounded object-cover"
          />
        ) : (
          <div className="flex aspect-[9/16] max-h-[68vh] items-center justify-center rounded bg-slate-950 p-8 text-center text-white">
            Scrollbrief text-only card
          </div>
        )}
      </CardContent>
    </Card>
  );
}
function NumberSetting({
  label,
  value,
  onChange,
  min = 0,
  max = 90,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        step="0.001"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
function RenderHistory({ renders }: { renders: Render[] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-medium">Recent renders</h3>
      {renders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No renders yet.</p>
      ) : (
        renders.slice(0, 6).map((render) => (
          <div
            key={render.id}
            className="flex items-center justify-between rounded border p-2 text-sm"
          >
            <span>
              {render.type} · {new Date(render.createdAt).toLocaleString()}
            </span>
            <Badge
              variant={render.status === "FAILED" ? "destructive" : "outline"}
            >
              {render.status}
            </Badge>
          </div>
        ))
      )}
    </div>
  );
}
function AudioUploader({ onUploaded }: { onUploaded: (track: Track) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose an audio file");
      const body = new FormData();
      body.set("file", file);
      body.set("theme", "general");
      body.set("energyLevel", "NEUTRAL");
      body.set("sensitiveSafe", "true");
      body.set("youtubeEligible", "false");
      body.set("tagSlugs", "[]");
      return apiFetch<Track>("/api/admin/audio-tracks", {
        method: "POST",
        body,
      });
    },
    onSuccess: onUploaded,
  });
  return (
    <div className="space-y-2 rounded-md border p-3">
      <Label htmlFor="studio-audio-upload">Upload reusable audio</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="studio-audio-upload"
          type="file"
          accept="audio/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => mutation.mutate()}
          disabled={!file || mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload audio
        </Button>
      </div>
      {mutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {String(mutation.error)}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        The full normalized track is saved globally. Start and Reel duration
        choose the segment used by this post.
      </p>
    </div>
  );
}
function ImageUploader({
  postId,
  onUploaded,
}: {
  postId: string;
  onUploaded: (asset: Asset) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose an image");
      const body = new FormData();
      body.set("image", file);
      body.set("role", "CUSTOM");
      return apiFetch<Asset>(`/api/admin/posts/${postId}/assets/images`, {
        method: "POST",
        body,
      });
    },
    onSuccess: onUploaded,
  });
  return (
    <div className="flex items-center gap-2">
      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <Button
        variant="outline"
        onClick={() => mutation.mutate()}
        disabled={!file || mutation.isPending}
      >
        <Upload className="mr-2 h-4 w-4" /> Upload
      </Button>
    </div>
  );
}
function stripServerConfig(config: ReelConfig) {
  return {
    visual: config.visual,
    audio: config.audio,
    rendering: config.rendering,
    disclosure: config.disclosure,
  };
}
