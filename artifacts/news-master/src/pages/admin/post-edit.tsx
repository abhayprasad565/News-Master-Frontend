import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetAdminPost,
  useUpdatePost,
  useGetAdminLabels,
  getGetAdminPostsQueryKey,
  getGetAdminPostQueryKey,
} from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, Music2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";

type AudioEnergyLevel = "CALM" | "NEUTRAL" | "UPBEAT";
type AudioTrack = {
  id: string;
  storageKey: string;
  theme: string;
  durationSeconds: number;
  energyLevel: AudioEnergyLevel;
  sensitiveSafe: boolean;
  tagSlugs: string[];
};
type PostAudioExtension = {
  reelFadeInSeconds?: number | null;
  reelFadeOutSeconds?: number | null;
};

const mediaUrl = (storageKey: string) =>
  `/media/${storageKey.split("/").map(encodeURIComponent).join("/")}`;

const formSchema = z.object({
  title: z.string().optional(),
  text: z.string().min(1, "Post content is required"),
  eventId: z.string().optional(),
  labelIds: z.array(z.string()).default([]),
  imageBase64: z.string().optional(),
  audioTrackId: z.string().optional(),
  audioSelectionMode: z.enum(["AUTO", "MANUAL"]).default("AUTO"),
  audioStartSeconds: z.number().min(0).default(0),
  audioVolume: z.number().min(0).max(1).default(1),
  reelDurationSeconds: z.number().min(3).max(90).default(10),
  reelFadeInSeconds: z.number().min(0).max(10).default(0.25),
  reelFadeOutSeconds: z.number().min(0).max(10).default(0.5),
});

export default function AdminEditPost() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: post,
    isLoading: postLoading,
    error,
  } = useGetAdminPost(id || "", {
    query: { enabled: !!id } as any,
  });
  const { data: labelsData } = useGetAdminLabels();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      text: "",
      eventId: "",
      labelIds: [],
      audioTrackId: "",
      audioSelectionMode: "AUTO",
      audioStartSeconds: 0,
      audioVolume: 1,
      reelDurationSeconds: 10,
      reelFadeInSeconds: 0.25,
      reelFadeOutSeconds: 0.5,
    },
  });

  const { data: audioData } = useQuery({
    queryKey: ["audioTracks"],
    queryFn: () => apiFetch<{ items: AudioTrack[] }>("/api/admin/audio-tracks"),
  });
  const audioTracks = audioData?.items ?? [];

  // Init form
  useEffect(() => {
    if (post) {
      const audioPost = post as typeof post & PostAudioExtension;
      form.reset({
        title: post.title || "",
        text: post.text,
        eventId: post.eventId || "",
        labelIds: post.labels.map((l) => l.id),
        audioTrackId: post.audioTrackId || "",
        audioSelectionMode: post.audioSelectionMode || "AUTO",
        audioStartSeconds: post.audioStartSeconds ?? 0,
        audioVolume: post.audioVolume ?? 1,
        reelDurationSeconds: post.reelDurationSeconds ?? 10,
        reelFadeInSeconds: audioPost.reelFadeInSeconds ?? 0.25,
        reelFadeOutSeconds: audioPost.reelFadeOutSeconds ?? 0.5,
      });
    }
  }, [post, form]);

  const updateMutation = useUpdatePost({
    mutation: {
      onSuccess: () => {
        toast({ title: "Post updated successfully" });
        queryClient.invalidateQueries({
          queryKey: getGetAdminPostQueryKey(id!),
        });
        queryClient.invalidateQueries({ queryKey: getGetAdminPostsQueryKey() });
        setLocation(`/admin/posts/${id}`);
      },
      onError: (err: any) => {
        toast({
          title: "Failed to update post",
          description: err.message,
          variant: "destructive",
        });
      },
    },
  });

  if (postLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load post for editing.
      </div>
    );
  }

  const isMutable = [
    "DRAFT",
    "MANUAL_REVIEW",
    "REJECTED",
    "VALIDATED",
  ].includes(post.status);
  if (!isMutable) {
    return (
      <div className="p-12 text-center max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-2">Post cannot be edited</h2>
        <p className="text-muted-foreground mb-6">
          This post is currently {post.status} and cannot be modified.
        </p>
        <Button asChild>
          <Link href={`/admin/posts/${post.id}`}>Return to Post</Link>
        </Button>
      </div>
    );
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateMutation.mutate({
      postId: post!.id,
      data: {
        ...values,
        eventId: values.eventId || undefined,
        title: values.title || undefined,
        audioTrackId:
          values.audioSelectionMode === "MANUAL"
            ? values.audioTrackId || undefined
            : null,
      },
    });
  }

  const toggleLabel = (labelId: string) => {
    const current = form.getValues("labelIds");
    if (current.includes(labelId)) {
      form.setValue(
        "labelIds",
        current.filter((id) => id !== labelId),
        { shouldDirty: true },
      );
    } else {
      form.setValue("labelIds", [...current, labelId], { shouldDirty: true });
    }
  };
  const selectedTrack = audioTracks.find(
    (track) => track.id === form.watch("audioTrackId"),
  );
  const segmentStart = form.watch("audioStartSeconds");
  const segmentDuration = form.watch("reelDurationSeconds");
  const segmentEnd = segmentStart + segmentDuration;
  const maxStart = selectedTrack
    ? Math.max(0, Math.floor(selectedTrack.durationSeconds - segmentDuration))
    : 120;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
        <Link href={`/admin/posts/${post.id}`} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Post
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">
            Edit Post
          </h1>
          <p className="text-muted-foreground mt-1">
            Make changes to this {post.kind.toLowerCase()} post.
          </p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {post.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Breaking News: ..."
                        className="font-serif text-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write the full story here..."
                        className="min-h-[300px] font-serif leading-relaxed"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageBase64"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem className="space-y-2 border p-4 rounded-lg bg-muted/20">
                    <FormLabel className="font-semibold">
                      Cover Image (Optional)
                    </FormLabel>
                    <FormDescription>
                      Upload a custom graphic or photo for social media
                      broadcast. If omitted, the system automatically renders a
                      typography card image.
                    </FormDescription>
                    <FormControl>
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="cursor-pointer bg-background"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            toast({
                              title: "Image attached",
                              description: `${file.name} (${(file.size / 1024).toFixed(0)} KB)`,
                            });
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const result = event.target?.result as string;
                              const base64 = result.split(",")[1];
                              onChange(base64);
                            };
                            reader.readAsDataURL(file);
                          } else {
                            onChange(undefined);
                          }
                        }}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="eventId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Associated Event ID (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. evt_12345"
                          className="font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Link this custom post to a known fact event.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="labelIds"
                  render={() => (
                    <FormItem>
                      <FormLabel>Labels</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {labelsData?.items.map((label) => {
                          const isSelected = form
                            .watch("labelIds")
                            .includes(label.id);
                          return (
                            <Badge
                              key={label.id}
                              variant={isSelected ? "default" : "outline"}
                              className="cursor-pointer transition-colors"
                              onClick={() => toggleLabel(label.id)}
                            >
                              {label.name}
                            </Badge>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-5 rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label className="flex items-center gap-2 font-semibold">
                      <Music2 className="h-4 w-4" />
                      Reel Audio
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Saved with the post and used when Instagram Reel
                      publishing is requested.
                    </p>
                  </div>
                  <Badge variant="outline">
                    {form.watch("audioSelectionMode")}
                  </Badge>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="audioSelectionMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Selection mode</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AUTO">
                              Automatic rotation
                            </SelectItem>
                            <SelectItem value="MANUAL">Manual track</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="audioTrackId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manual audio track</FormLabel>
                        <Select
                          value={field.value || "none"}
                          disabled={
                            form.watch("audioSelectionMode") !== "MANUAL"
                          }
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? "" : value)
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a licensed track" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">
                              No manual track
                            </SelectItem>
                            {audioTracks.map((track) => (
                              <SelectItem key={track.id} value={track.id}>
                                {track.theme} · {track.energyLevel} ·{" "}
                                {Math.round(track.durationSeconds)}s
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          <Link
                            href="/admin/audio"
                            className="inline-flex items-center gap-1 text-primary"
                          >
                            Manage songs <ExternalLink className="h-3 w-3" />
                          </Link>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("audioSelectionMode") === "MANUAL" &&
                  selectedTrack && (
                    <div className="rounded-md border bg-background p-3">
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="outline">{selectedTrack.theme}</Badge>
                        <Badge variant="secondary">
                          {selectedTrack.energyLevel}
                        </Badge>
                        {selectedTrack.sensitiveSafe && (
                          <Badge variant="outline">Sensitive-safe</Badge>
                        )}
                        <span className="text-muted-foreground">
                          {segmentStart}s → {segmentEnd}s
                        </span>
                      </div>
                      <audio
                        controls
                        src={`${mediaUrl(selectedTrack.storageKey)}#t=${segmentStart},${segmentEnd}`}
                        className="h-9 w-full"
                      />
                    </div>
                  )}

                <div className="grid gap-5 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="audioStartSeconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start offset: {field.value}s</FormLabel>
                        <FormControl>
                          <Slider
                            min={0}
                            max={maxStart}
                            step={1}
                            value={[field.value]}
                            onValueChange={([value]) =>
                              field.onChange(value ?? 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="audioVolume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Volume: {Math.round(field.value * 100)}%
                        </FormLabel>
                        <FormControl>
                          <Slider
                            min={0}
                            max={1}
                            step={0.05}
                            value={[field.value]}
                            onValueChange={([value]) =>
                              field.onChange(value ?? 1)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reelDurationSeconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reel duration: {field.value}s</FormLabel>
                        <FormControl>
                          <Slider
                            min={3}
                            max={90}
                            step={1}
                            value={[field.value]}
                            onValueChange={([value]) =>
                              field.onChange(value ?? 10)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="reelFadeInSeconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fade in: {field.value}s</FormLabel>
                        <FormControl>
                          <Slider
                            min={0}
                            max={10}
                            step={0.25}
                            value={[field.value]}
                            onValueChange={([value]) =>
                              field.onChange(value ?? 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reelFadeOutSeconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fade out: {field.value}s</FormLabel>
                        <FormControl>
                          <Slider
                            min={0}
                            max={10}
                            step={0.25}
                            value={[field.value]}
                            onValueChange={([value]) =>
                              field.onChange(value ?? 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t gap-4">
                <Button variant="outline" asChild>
                  <Link href={`/admin/posts/${post.id}`}>Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending || !form.formState.isDirty}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
