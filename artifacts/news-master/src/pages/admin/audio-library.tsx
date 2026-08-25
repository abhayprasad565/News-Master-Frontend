import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Music2, Plus, Upload } from "lucide-react";
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

export default function AdminAudioLibrary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      setSourceDuration(0);
      setTrimStart(0);
      setTrimEnd(0);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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
      form.append("trimStartSeconds", String(trimStart));
      form.append("trimEndSeconds", String(trimEnd));
      return apiFetch<AudioTrack>("/api/admin/audio-tracks", {
        method: "POST",
        body: form,
      });
    },
    onSuccess: () => {
      setFile(null);
      setSelectedTags([]);
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
              {previewUrl && (
                <div className="space-y-3 sm:col-span-2 rounded-md border p-3">
                  <Label>Trim uploaded song</Label>
                  <audio
                    src={previewUrl}
                    controls
                    className="w-full"
                    onLoadedMetadata={(event) => {
                      const duration = event.currentTarget.duration;
                      if (!Number.isFinite(duration)) return;
                      const rounded = Math.floor(duration * 100) / 100;
                      setSourceDuration(rounded);
                      setTrimEnd(rounded);
                    }}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Start seconds</Label>
                      <Input
                        type="number"
                        min={0}
                        max={Math.max(0, trimEnd - 0.1)}
                        step={0.1}
                        value={trimStart}
                        onChange={(event) =>
                          setTrimStart(Number(event.currentTarget.value))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End seconds</Label>
                      <Input
                        type="number"
                        min={trimStart + 0.1}
                        max={sourceDuration}
                        step={0.1}
                        value={trimEnd}
                        onChange={(event) =>
                          setTrimEnd(Number(event.currentTarget.value))
                        }
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The saved library track will be{" "}
                    {Math.max(0, trimEnd - trimStart).toFixed(1)} seconds long.
                  </p>
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
                    sourceDuration <= 0 ||
                    trimEnd <= trimStart
                  }
                >
                  {uploadMutation.isPending
                    ? "Uploading..."
                    : "Upload & Normalize"}
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
                  <div className="w-full lg:w-72 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0">
                    <audio
                      controls
                      preload="metadata"
                      src={mediaUrl(track.storageKey)}
                      className="h-9 w-full rounded-md"
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
