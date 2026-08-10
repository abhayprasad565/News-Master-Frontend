import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation } from 'wouter';
import { 
  useCreatePost, 
  useGetAdminLabels, 
  getGetAdminPostsQueryKey 
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  title: z.string().optional(),
  text: z.string().min(1, 'Post content is required'),
  eventId: z.string().optional(),
  labelIds: z.array(z.string()).default([]),
  imageBase64: z.string().optional(),
});

export default function AdminCreatePost() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: labelsData } = useGetAdminLabels();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: '', text: '', eventId: '', labelIds: [] },
  });

  const createMutation = useCreatePost({
    mutation: {
      onSuccess: (data) => {
        toast({ title: 'Post created successfully' });
        queryClient.invalidateQueries({ queryKey: getGetAdminPostsQueryKey() });
        setLocation(`/admin/posts/${data.id}`);
      },
      onError: (err: any) => {
        toast({ 
          title: 'Failed to create post', 
          description: err.message,
          variant: 'destructive' 
        });
      }
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createMutation.mutate({ data: {
      ...values,
      eventId: values.eventId || undefined,
      title: values.title || undefined,
    } });
  }

  const toggleLabel = (labelId: string) => {
    const current = form.getValues('labelIds');
    if (current.includes(labelId)) {
      form.setValue('labelIds', current.filter(id => id !== labelId), { shouldDirty: true });
    } else {
      form.setValue('labelIds', [...current, labelId], { shouldDirty: true });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
        <Link href="/admin/posts" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Posts
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Create Custom Post</h1>
          <p className="text-muted-foreground mt-1">Write a new editorial post that will bypass auto-generation.</p>
        </div>
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
                      <Input placeholder="Breaking News: ..." className="font-serif text-lg" {...field} />
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
                        className="min-h-[200px] font-serif leading-relaxed" 
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
                        <Input placeholder="e.g. evt_12345" className="font-mono text-sm" {...field} />
                      </FormControl>
                      <FormDescription>Link this custom post to a known fact event.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageBase64"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Background Image (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const result = event.target?.result as string;
                                // result is data:image/jpeg;base64,...
                                const base64 = result.split(',')[1];
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
                      <FormDescription>Upload a custom background image. Minimum 600x400.</FormDescription>
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
                        {labelsData?.items.map(label => {
                          const isSelected = form.watch('labelIds').includes(label.id);
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

              <div className="flex justify-end pt-6 border-t gap-4">
                <Button variant="outline" asChild>
                  <Link href="/admin/posts">Cancel</Link>
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save as Draft
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
