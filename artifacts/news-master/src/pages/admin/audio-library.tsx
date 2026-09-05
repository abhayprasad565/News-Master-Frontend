import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2, Music2, Pause, Play, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { apiFetch, toQuery } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

type AudioEnergyLevel = "CALM" | "NEUTRAL" | "UPBEAT";

type AudioTrack = {
  id: string;
  title: string | null;
  storageKey: string;
  theme: string;
  durationSeconds: number;
  energyLevel: AudioEnergyLevel;
  sensitiveSafe: boolean;
  youtubeEligible: boolean;
  selectionCount: number;
  publishCount: number;
  tagSlugs: string[];
};

type AudioTag = {
  id: string;
  slug: string;
  displayName: string;
};

const mediaUrl = (storageKey: string) =>
  `/media/${storageKey.split("/").map(encodeURIComponent).join("/")}`;

const trackName = (track: AudioTrack) =>
  track.title?.trim() ||
  track.storageKey.split("/").at(-1) ||
  track.id.slice(0, 8);

async function detectAudioDuration(file: File): Promise<number | null> {
  // Strategy 1: Web Audio API AudioContext (decodes audio binary directly in browser)
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioCtx) {
      const audioCtx = new AudioCtx();
      try {
        const buffer = await file.arrayBuffer();
        const decoded = await audioCtx.decodeAudioData(buffer.slice(0));
        if (
          decoded &&
          Number.isFinite(decoded.duration) &&
          decoded.duration > 0
        ) {
          return Math.floor(decoded.duration * 100) / 100;
        }
      } finally {
        await audioCtx.close().catch(() => {});
      }
    }
  } catch (err) {
    console.warn("AudioContext decode error:", err);
  }

  // Strategy 2: HTML5 Audio probe
  try {
    const url = URL.createObjectURL(file);
    try {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = url;
      const duration = await new Promise<number | null>((resolve) => {
        let done = false;
        const complete = (val: number | null) => {
          if (done) return;
          done = true;
          cleanup();
          resolve(val);
        };
        const onCheck = () => {
          const d = audio.duration;
          if (Number.isFinite(d) && d > 0) {
            complete(Math.floor(d * 100) / 100);
          } else if (d === Infinity) {
            audio.currentTime = 1e10;
            audio.ontimeupdate = () => {
              audio.ontimeupdate = null;
              audio.currentTime = 0;
              const realD = audio.duration;
              complete(
                Number.isFinite(realD) && realD > 0
                  ? Math.floor(realD * 100) / 100
                  : null,
              );
            };
          }
        };
        const cleanup = () => {
          audio.removeEventListener("loadedmetadata", onCheck);
          audio.removeEventListener("durationchange", onCheck);
          audio.removeEventListener("canplay", onCheck);
          audio.removeEventListener("error", onErr);
        };
        const onErr = () => complete(null);
        audio.addEventListener("loadedmetadata", onCheck);
        audio.addEventListener("durationchange", onCheck);
        audio.addEventListener("canplay", onCheck);
        audio.addEventListener("error", onErr);
        setTimeout(() => {
          const d = audio.duration;
          complete(
            Number.isFinite(d) && d > 0 ? Math.floor(d * 100) / 100 : null,
          );
        }, 4000);
      });
      if (duration) return duration;
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    // fallback
  }

  return null;
}

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${mins}:${secs.toString().padStart(2, "0")}.${tenths}`;
}

function TrackAudioPlayer({
  track,
  isActive,
  onPlay,
}: {
  track: AudioTrack;
  isActive: boolean;
  onPlay: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.durationSeconds || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blobSrc, setBlobSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  }, [isActive, isPlaying]);

  useEffect(() => {
    return () => {
      if (blobSrc) URL.revokeObjectURL(blobSrc);
    };
  }, [blobSrc]);

  async function loadBlobFallback(): Promise<string | null> {
    if (blobSrc) return blobSrc;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(mediaUrl(track.storageKey), {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setBlobSrc(url);
      return url;
    } catch {
      setError("Failed to load audio");
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    onPlay();
    setError(null);

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      const fallbackUrl = await loadBlobFallback();
      if (fallbackUrl && audioRef.current) {
        audioRef.current.src = fallbackUrl;
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch {
          setError("Playback error");
        }
      }
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  }

  const effectiveDuration = duration > 0 ? duration : track.durationSeconds;

  return (
    <div className="flex items-center gap-2.5 bg-muted/40 border rounded-md px-2.5 py-1.5 w-full">
      <audio
        ref={audioRef}
        src={blobSrc || mediaUrl(track.storageKey)}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (
            audioRef.current &&
            Number.isFinite(audioRef.current.duration) &&
            audioRef.current.duration > 0
          ) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={() => {
          if (!blobSrc) {
            void loadBlobFallback();
          }
        }}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
        onClick={togglePlay}
        disabled={isLoading}
        title={isPlaying ? "Pause" : "Play track"}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 fill-current ml-0.5" />
        )}
      </Button>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground leading-none">
          <span>{formatSeconds(currentTime)}</span>
          <span>{formatSeconds(effectiveDuration)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={effectiveDuration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {error && (
        <span className="text-[10px] text-destructive shrink-0" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}

export default function AdminAudioLibrary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [themeFilter, setThemeFilter] = useState("");
  const [energyFilter, setEnergyFilter] = useState<AudioEnergyLevel | "ALL">(
    "ALL",
  );
  const [tagSlug, setTagSlug] = useState("");
  const [tagName, setTagName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [theme, setTheme] = useState("general");
  const [energyLevel, setEnergyLevel] = useState<AudioEnergyLevel>("NEUTRAL");
  const [sensitiveSafe, setSensitiveSafe] = useState(true);
  const [youtubeEligible, setYoutubeEligible] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [sourceDuration, setSourceDuration] = useState(0);
  const [isDetectingDuration, setIsDetectingDuration] = useState(false);
  const [enableTrim, setEnableTrim] = useState(false);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      setSourceDuration(0);
      setTrimStart(0);
      setTrimEnd(0);
      setEnableTrim(false);
      setIsDetectingDuration(false);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsDetectingDuration(true);

    let cancelled = false;
    void detectAudioDuration(file).then((dur) => {
      if (cancelled) return;
      setIsDetectingDuration(false);
      if (dur && dur > 0) {
        setSourceDuration(dur);
        setTrimStart(0);
        setTrimEnd(dur);
      }
    });

    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  function handleAudioMetadata(event: React.SyntheticEvent<HTMLAudioElement>) {
    const audio = event.currentTarget;
    const d = audio.duration;
    if (Number.isFinite(d) && d > 0) {
      const rounded = Math.floor(d * 100) / 100;
      setSourceDuration((prev) => (prev > 0 ? prev : rounded));
      setTrimEnd((prev) => (prev > 0 ? prev : rounded));
    }
  }

  const query = toQuery({
    theme: themeFilter || undefined,
    energy: energyFilter === "ALL" ? undefined : energyFilter,
  });
  const { data: tracksData, isLoading: tracksLoading } = useQuery({
    queryKey: ["audioTracks", query],
    queryFn: () =>
      apiFetch<{ items: AudioTrack[] }>(`/api/admin/audio-tracks${query}`),
  });
  const { data: tagsData } = useQuery({
    queryKey: ["audioTags"],
    queryFn: () => apiFetch<{ items: AudioTag[] }>("/api/admin/audio-tags"),
  });
  const tags = tagsData?.items ?? [];
  const tracks = tracksData?.items ?? [];
  const themes = useMemo(
    () =>
      Array.from(
        new Set(["general", ...tracks.map((track) => track.theme)]),
      ).sort(),
    [tracks],
  );

  const createTagMutation = useMutation({
    mutationFn: () =>
      apiFetch<AudioTag>("/api/admin/audio-tags", {
        method: "POST",
        body: JSON.stringify({
          slug: tagSlug,
          displayName: tagName || tagSlug,
        }),
      }),
    onSuccess: () => {
      setTagSlug("");
      setTagName("");
      queryClient.invalidateQueries({ queryKey: ["audioTags"] });
      toast({ title: "Audio tag saved" });
    },
    onError: (error: Error) =>
      toast({
        title: "Failed to save tag",
        description: error.message,
        variant: "destructive",
      }),
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Choose an audio file first");
      const form = new FormData();
      form.append("file", file);
      form.append("theme", theme);
      form.append("energyLevel", energyLevel);
      form.append("sensitiveSafe", String(sensitiveSafe));
      form.append("youtubeEligible", String(youtubeEligible));
      form.append("tagSlugs", JSON.stringify(selectedTags));
      if (enableTrim && trimEnd > trimStart) {
        form.append("trimStartSeconds", String(trimStart));
        form.append("trimEndSeconds", String(trimEnd));
      }
      return apiFetch<AudioTrack>("/api/admin/audio-tracks", {
        method: "POST",
        body: form,
      });
    },
    onSuccess: () => {
      setFile(null);
      setSelectedTags([]);
      setEnableTrim(false);
      setSourceDuration(0);
      setTrimStart(0);
      setTrimEnd(0);
      queryClient.invalidateQueries({ queryKey: ["audioTracks"] });
      toast({ title: "Song uploaded and normalized" });
    },
    onError: (error: Error) =>
      toast({
        title: "Failed to upload song",
        description: error.message,
        variant: "destructive",
      }),
  });
  const eligibilityMutation = useMutation({
    mutationFn: (track: AudioTrack) =>
      apiFetch<AudioTrack>(
        `/api/admin/audio-tracks/${track.id}/youtube-eligibility`,
        {
          method: "PATCH",
          body: JSON.stringify({ youtubeEligible: !track.youtubeEligible }),
        },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["audioTracks"] }),
    onError: (error: Error) =>
      toast({
        title: "Eligibility update failed",
        description: error.message,
        variant: "destructive",
      }),
  });

  const deleteTrackMutation = useMutation({
    mutationFn: (trackId: string) =>
      apiFetch(`/api/admin/audio-tracks/${trackId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audioTracks"] });
      toast({ title: "Audio track deleted" });
    },
    onError: (error: Error) =>
      toast({
        title: "Failed to delete track",
        description: error.message,
        variant: "destructive",
      }),
  });

  function handleCreateTag(event: FormEvent) {
    event.preventDefault();
    createTagMutation.mutate();
  }

  function handleUpload(event: FormEvent) {
    event.preventDefault();
    uploadMutation.mutate();
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">
          Audio Library
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Upload licensed songs and tag them for automatic or manual Reel
          selection.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5" /> Upload Song
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleUpload}
              className="grid gap-5 grid-cols-1 sm:grid-cols-2"
            >
              <div className="space-y-2 sm:col-span-2">
                <Label>Audio file</Label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </div>
              {file && previewUrl && (
                <div className="space-y-4 sm:col-span-2 rounded-lg border bg-muted/20 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Music2 className="h-4 w-4 text-primary" />
                      <span
                        className="text-sm font-medium truncate max-w-xs sm:max-w-md"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {isDetectingDuration ? (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Analyzing soundtrack...
                        </span>
                      ) : sourceDuration > 0 ? (
                        <Badge variant="secondary" className="font-mono text-xs">
                          Duration: {formatSeconds(sourceDuration)} ({sourceDuration.toFixed(1)}s)
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-amber-600 dark:text-amber-400 text-xs"
                        >
                          Server will detect duration
                        </Badge>
                      )}
                    </div>
                  </div>

                  <audio
                    ref={audioRef}
                    src={previewUrl}
                    preload="auto"
                    controls
                    className="w-full h-10 rounded"
                    onLoadedMetadata={handleAudioMetadata}
                    onDurationChange={handleAudioMetadata}
                    onCanPlay={handleAudioMetadata}
                  />

                  <div className="pt-2 border-t">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="enableTrim"
                        checked={enableTrim}
                        onCheckedChange={(checked) => {
                          const active = Boolean(checked);
                          setEnableTrim(active);
                          if (active) {
                            if (sourceDuration > 0 && trimEnd <= trimStart) {
                              setTrimStart(0);
                              setTrimEnd(sourceDuration);
                            }
                          }
                        }}
                      />
                      <div className="grid gap-1 leading-none">
                        <Label
                          htmlFor="enableTrim"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Trim uploaded song before saving
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {enableTrim
                            ? "Select a specific start and end portion of the song to use in Reel library."
                            : sourceDuration > 0
                            ? `Save full track (${sourceDuration.toFixed(1)}s) into library without trimming.`
                            : "Save full track into library without trimming."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {enableTrim && (
                    <div className="space-y-3 pt-2 border-t bg-background/50 rounded-md p-3">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Start seconds</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[11px] px-1.5 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                if (audioRef.current) {
                                  const current =
                                    Math.floor(audioRef.current.currentTime * 10) / 10;
                                  setTrimStart(current);
                                }
                              }}
                            >
                              <Clock className="h-3 w-3 mr-1" /> Use current time
                            </Button>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            max={sourceDuration > 0 ? Math.max(0, trimEnd - 0.1) : 600}
                            step={0.1}
                            value={trimStart}
                            onChange={(event) =>
                              setTrimStart(Math.max(0, Number(event.currentTarget.value) || 0))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">End seconds</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[11px] px-1.5 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                if (audioRef.current) {
                                  const current =
                                    Math.floor(audioRef.current.currentTime * 10) / 10;
                                  setTrimEnd(current);
                                }
                              }}
                            >
                              <Clock className="h-3 w-3 mr-1" /> Use current time
                            </Button>
                          </div>
                          <Input
                            type="number"
                            min={trimStart + 0.1}
                            max={sourceDuration > 0 ? sourceDuration : 600}
                            step={0.1}
                            value={trimEnd}
                            onChange={(event) =>
                              setTrimEnd(Number(event.currentTarget.value) || 0)
                            }
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 text-xs">
                        <div>
                          {trimEnd > trimStart ? (
                            <span className="text-muted-foreground">
                              The saved library track will be{" "}
                              <strong className="text-foreground">
                                {(trimEnd - trimStart).toFixed(1)}s
                              </strong>{" "}
                              long ({formatSeconds(trimEnd - trimStart)}).
                            </span>
                          ) : (
                            <span className="text-destructive font-medium">
                              End seconds must be greater than start seconds.
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {sourceDuration > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => {
                                setTrimStart(0);
                                setTrimEnd(sourceDuration);
                              }}
                            >
                              <RotateCcw className="h-3 w-3 mr-1" /> Reset to full track
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              if (audioRef.current && trimEnd > trimStart) {
                                audioRef.current.currentTime = trimStart;
                                void audioRef.current.play();
                                const durationMs = (trimEnd - trimStart) * 1000;
                                setTimeout(() => {
                                  if (audioRef.current && !audioRef.current.paused) {
                                    audioRef.current.pause();
                                  }
                                }, durationMs);
                              }
                            }}
                            disabled={trimEnd <= trimStart}
                          >
                            <Play className="h-3 w-3 mr-1" /> Preview segment
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label>Theme</Label>
                <Input
                  value={theme}
                  onChange={(event) => setTheme(event.target.value)}
                  placeholder="general"
                />
              </div>
              <div className="space-y-2">
                <Label>Energy</Label>
                <Select
                  value={energyLevel}
                  onValueChange={(value) =>
                    setEnergyLevel(value as AudioEnergyLevel)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CALM">Calm</SelectItem>
                    <SelectItem value="NEUTRAL">Neutral</SelectItem>
                    <SelectItem value="UPBEAT">Upbeat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Checkbox
                  checked={sensitiveSafe}
                  onCheckedChange={(checked) =>
                    setSensitiveSafe(Boolean(checked))
                  }
                />
                <Label>Sensitive-safe</Label>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-3">
                <Checkbox
                  checked={youtubeEligible}
                  onCheckedChange={(checked) =>
                    setYoutubeEligible(Boolean(checked))
                  }
                />
                <Label>YouTube-eligible rights</Label>
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const active = selectedTags.includes(tag.slug);
                    return (
                      <Badge
                        key={tag.id}
                        variant={active ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          setSelectedTags(
                            active
                              ? selectedTags.filter((slug) => slug !== tag.slug)
                              : [...selectedTags, tag.slug],
                          )
                        }
                      >
                        {tag.displayName}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    uploadMutation.isPending ||
                    !file ||
                    isDetectingDuration ||
                    (enableTrim && (trimEnd <= trimStart || trimStart < 0))
                  }
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Uploading & Normalizing...
                    </>
                  ) : (
                    "Upload & Normalize"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-5 w-5" /> Curated Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTag} className="space-y-3">
              <Input
                value={tagSlug}
                onChange={(event) => setTagSlug(event.target.value)}
                placeholder="policy"
              />
              <Input
                value={tagName}
                onChange={(event) => setTagName(event.target.value)}
                placeholder="Policy"
              />
              <Button
                type="submit"
                disabled={createTagMutation.isPending || !tagSlug.trim()}
                className="w-full"
              >
                Save Tag
              </Button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.displayName}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Music2 className="h-5 w-5" /> Tracks
            </CardTitle>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Select
                value={themeFilter || "ALL"}
                onValueChange={(value) =>
                  setThemeFilter(value === "ALL" ? "" : value)
                }
              >
                <SelectTrigger className="w-full sm:w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All themes</SelectItem>
                  {themes.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={energyFilter}
                onValueChange={(value) =>
                  setEnergyFilter(value as AudioEnergyLevel | "ALL")
                }
              >
                <SelectTrigger className="w-full sm:w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All energy</SelectItem>
                  <SelectItem value="CALM">Calm</SelectItem>
                  <SelectItem value="NEUTRAL">Neutral</SelectItem>
                  <SelectItem value="UPBEAT">Upbeat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tracksLoading ? (
            <div className="py-8 text-sm text-muted-foreground text-center">
              Loading tracks...
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No tracks found.
            </div>
          ) : (
            <div className="space-y-3">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="flex flex-col gap-3 rounded-lg border p-3.5 bg-card/50 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div
                      className="truncate font-semibold text-sm sm:text-base text-foreground"
                      title={trackName(track)}
                    >
                      {trackName(track)}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        {track.id.slice(0, 8)}
                      </span>
                      <Badge variant="outline" className="text-[11px]">{track.theme}</Badge>
                      <Badge variant="secondary" className="text-[11px]">{track.energyLevel}</Badge>
                      {track.sensitiveSafe && (
                        <Badge variant="outline" className="text-[11px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400">Sensitive-safe</Badge>
                      )}
                      {track.youtubeEligible && (
                        <Badge variant="outline" className="text-[11px] border-sky-500/40 text-sky-600 dark:text-sky-400">YouTube eligible</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                        onClick={() => eligibilityMutation.mutate(track)}
                      >
                        {track.youtubeEligible
                          ? "Remove YouTube eligibility"
                          : "Mark YouTube eligible"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[11px] px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Delete "${trackName(track)}"?`)) {
                            deleteTrackMutation.mutate(track.id);
                          }
                        }}
                        disabled={deleteTrackMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {Math.round(track.durationSeconds)}s · selected{" "}
                      {track.selectionCount} · published {track.publishCount}
                    </div>
                    {track.tagSlugs.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {track.tagSlugs.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-[10px] py-0 px-1.5"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-full lg:w-80 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0">
                    <TrackAudioPlayer
                      track={track}
                      isActive={activeTrackId === track.id}
                      onPlay={() => setActiveTrackId(track.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
