import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Download, Film, Music2, RefreshCw, Send, Upload } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AudioTrack = {
  id: string;
  storageKey: string;
  theme: string;
  durationSeconds: number;
  energyLevel: "CALM" | "NEUTRAL" | "UPBEAT";
  sensitiveSafe: boolean;
  trendingUntil: string | null;
  tagSlugs: string[];
};

type VideoWorkspace = {
  post: {
    id: string;
    title: string | null;
    text: string;
    status: string;
  };
  graphic: { url: string; mimeType: string } | null;
  reel: {
    previewUrl: string;
    downloadUrl: string;
    downloadFilename: string;
  } | null;
  render: {
    state: "none" | "queued" | "rendering" | "ready" | "failed";
    job: { lastFailureReason: string | null } | null;
  };
  audioSettings: {
    audioSelectionMode: "AUTO" | "MANUAL";
    audioTrackId: string | null;
    audioStartSeconds: number;
    audioVolume: number;
    reelDurationSeconds: number;
    reelFadeInSeconds: number;
    reelFadeOutSeconds: number;
  };
  selectedAudioTrack: AudioTrack | null;
  audioTracks: AudioTrack[];
  audioTags: { id: string; slug: string; displayName: string }[];
  heldDelivery: { id: string; status: string; audioHoldResolution: string | null } | null;
};

const numberOr = (value: FormDataEntryValue | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function AdminPostVideo() {
  const [, params] = useRoute("/admin/posts/:id/video");
  const postId = params?.id ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [theme, setTheme] = useState("all");
  const [energy, setEnergy] = useState("all");
  const [tag, setTag] = useState("all");
  const [settings, setSettings] = useState<VideoWorkspace["audioSettings"] | null>(null);

  const query = useQuery({
    queryKey: ["postVideo", postId],
    queryFn: () => apiFetch<VideoWorkspace>(`/api/admin/posts/${postId}/video`),
    enabled: Boolean(postId),
  });

  const data = query.data;
  const current = settings ?? data?.audioSettings;

  const tracks = useMemo(() => {
    const source = data?.audioTracks ?? [];
    return source.filter((track) => {
      if (theme !== "all" && track.theme !== theme) return false;
      if (energy !== "all" && track.energyLevel !== energy) return false;
      if (tag !== "all" && !track.tagSlugs.includes(tag)) return false;
      return true;
    });
  }, [data?.audioTracks, energy, tag, theme]);

  const renderMutation = useMutation({
    mutationFn: () =>
      apiFetch<VideoWorkspace>(`/api/admin/posts/${postId}/video/render`, {
        method: "POST",
        body: JSON.stringify(current),
      }),
    onSuccess: (next) => {
      setSettings(next.audioSettings);
      queryClient.setQueryData(["postVideo", postId], next);
      toast({ title: "MP4 render queued" });
    },
    onError: (error) => toast({ title: "Render failed", description: String(error), variant: "destructive" }),
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/admin/posts/${postId}/video/publish-instagram`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["postVideo", postId] });
      toast({ title: "Instagram Reel delivery queued" });
    },
    onError: (error) => toast({ title: "Publish failed", description: String(error), variant: "destructive" }),
  });

  const uploadMutation = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const source = new FormData(form);
      const payload = new FormData();
      const file = source.get("file");
      if (file instanceof File) payload.set("file", file);
      payload.set("theme", String(source.get("theme") || "general"));
      payload.set("energyLevel", String(source.get("energyLevel") || "NEUTRAL"));
      payload.set("sensitiveSafe", source.get("sensitiveSafe") === "on" ? "true" : "false");
      payload.set("tagSlugs", String(source.get("tagSlugs") || ""));
      if (source.get("trendingUntil")) payload.set("trendingUntil", String(source.get("trendingUntil")));
      return apiFetch<AudioTrack>("/api/admin/audio-tracks", { method: "POST", body: payload });
    },
    onSuccess: (track) => {
      queryClient.invalidateQueries({ queryKey: ["postVideo", postId] });
      setSettings((prev) => prev ? { ...prev, audioSelectionMode: "MANUAL", audioTrackId: track.id } : prev);
      toast({ title: "Song uploaded" });
    },
    onError: (error) => toast({ title: "Upload failed", description: String(error), variant: "destructive" }),
  });

  if (query.isLoading || !data || !current) return <div className="text-sm text-muted-foreground">Loading video workspace...</div>;

  const themes = Array.from(new Set(data.audioTracks.map((track) => track.theme))).sort();
  const selectedTrack = data.audioTracks.find((track) => track.id === current.audioTrackId) ?? data.selectedAudioTrack;

  const update = (patch: Partial<VideoWorkspace["audioSettings"]>) =>
    setSettings({ ...current, ...patch });

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="link" className="px-0" asChild><Link href={`/admin/posts/${postId}`}>Back to post</Link></Button>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight flex items-center gap-2 flex-wrap">
            Manual Video <span className="text-primary font-mono font-normal text-xl sm:text-2xl">#{(data.post as any).postNumber || data.post.id.slice(0, 8)}</span>
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{data.post.title || data.post.text.slice(0, 140)}</p>
          <div className="mt-2 flex flex-wrap gap-2"><Badge variant="outline">{data.post.status}</Badge><Badge>{data.render.state}</Badge>{data.heldDelivery && <Badge variant="secondary">Held Reel</Badge>}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => query.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button onClick={() => renderMutation.mutate()} disabled={renderMutation.isPending || !current}><Film className="mr-2 h-4 w-4" />Create MP4</Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Cover</CardTitle></CardHeader>
            <CardContent>
              {data.graphic ? <img src={data.graphic.url} className="aspect-[9/16] w-full rounded-md border object-contain bg-black" /> : <div className="aspect-[9/16] rounded-md border bg-muted grid place-items-center text-sm text-muted-foreground">No graphic yet</div>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Ready MP4</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.reel ? <video src={data.reel.previewUrl} controls className="aspect-[9/16] w-full rounded-md border bg-black" /> : <div className="aspect-[9/16] rounded-md border bg-muted grid place-items-center text-sm text-muted-foreground">{data.render.state}</div>}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex-1" disabled={!data.reel} asChild={Boolean(data.reel)}>
                  {data.reel ? <a href={data.reel.downloadUrl} download={data.reel.downloadFilename}><Download className="mr-2 h-4 w-4" />Download MP4</a> : <span><Download className="mr-2 h-4 w-4" />Download MP4</span>}
                </Button>
                <Button className="flex-1" disabled={!data.reel || publishMutation.isPending} onClick={() => publishMutation.mutate()}><Send className="mr-2 h-4 w-4" />Publish Reel</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Audio</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <Tabs value={current.audioSelectionMode} onValueChange={(value) => update({ audioSelectionMode: value as "AUTO" | "MANUAL" })}>
                <TabsList><TabsTrigger value="AUTO">AUTO</TabsTrigger><TabsTrigger value="MANUAL">MANUAL</TabsTrigger></TabsList>
              </Tabs>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                <Select value={theme} onValueChange={setTheme}><SelectTrigger><SelectValue placeholder="Theme" /></SelectTrigger><SelectContent><SelectItem value="all">All themes</SelectItem>{themes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
                <Select value={energy} onValueChange={setEnergy}><SelectTrigger><SelectValue placeholder="Energy" /></SelectTrigger><SelectContent><SelectItem value="all">All energy</SelectItem><SelectItem value="CALM">CALM</SelectItem><SelectItem value="NEUTRAL">NEUTRAL</SelectItem><SelectItem value="UPBEAT">UPBEAT</SelectItem></SelectContent></Select>
                <Select value={tag} onValueChange={setTag}><SelectTrigger><SelectValue placeholder="Tag" /></SelectTrigger><SelectContent><SelectItem value="all">All tags</SelectItem>{data.audioTags.map((item) => <SelectItem key={item.id} value={item.slug}>{item.displayName}</SelectItem>)}</SelectContent></Select>
              </div>
              <Select value={current.audioTrackId ?? ""} onValueChange={(value) => update({ audioSelectionMode: "MANUAL", audioTrackId: value })}>
                <SelectTrigger><SelectValue placeholder="Select manual track" /></SelectTrigger>
                <SelectContent>{tracks.map((track) => <SelectItem key={track.id} value={track.id}>{track.theme} / {track.energyLevel} / {Math.round(track.durationSeconds)}s{track.trendingUntil ? " / trending" : ""}</SelectItem>)}</SelectContent>
              </Select>
              {selectedTrack && <audio src={`/media/${selectedTrack.storageKey.split("/").map(encodeURIComponent).join("/")}`} controls className="w-full" />}
              <div className="grid gap-4 md:grid-cols-2">
                <NumberField label="Start seconds" value={current.audioStartSeconds} onChange={(v) => update({ audioStartSeconds: v })} />
                <NumberField label="Duration seconds" value={current.reelDurationSeconds} onChange={(v) => update({ reelDurationSeconds: v })} />
                <NumberField label="Fade in seconds" value={current.reelFadeInSeconds} onChange={(v) => update({ reelFadeInSeconds: v })} />
                <NumberField label="Fade out seconds" value={current.reelFadeOutSeconds} onChange={(v) => update({ reelFadeOutSeconds: v })} />
              </div>
              <div className="space-y-2">
                <Label>Volume {Math.round(current.audioVolume * 100)}%</Label>
                <Slider value={[current.audioVolume]} min={0} max={1} step={0.01} onValueChange={([value]) => update({ audioVolume: value ?? 1 })} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Upload Song</CardTitle></CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); uploadMutation.mutate(event.currentTarget); }}>
                <Input name="file" type="file" accept="audio/*" className="md:col-span-2" required />
                <Input name="theme" placeholder="theme" defaultValue="general" />
                <Select name="energyLevel" defaultValue="NEUTRAL"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CALM">CALM</SelectItem><SelectItem value="NEUTRAL">NEUTRAL</SelectItem><SelectItem value="UPBEAT">UPBEAT</SelectItem></SelectContent></Select>
                <Input name="tagSlugs" placeholder="tags, comma separated" />
                <Input name="trendingUntil" type="datetime-local" />
                <label className="flex items-center gap-2 text-sm"><Switch name="sensitiveSafe" defaultChecked /> Sensitive safe</label>
                <Button type="submit" disabled={uploadMutation.isPending}><Upload className="mr-2 h-4 w-4" />Upload</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" value={value} min={0} step={0.05} onChange={(event) => onChange(numberOr(event.currentTarget.value, value))} />
    </div>
  );
}
