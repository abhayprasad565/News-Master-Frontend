import { useState } from 'react';
import { 
  useGetAdminLabels, 
  useCreateLabel, 
  useUpdateLabel, 
  useDeleteLabel,
  LabelVisibility,
  getGetAdminLabelsQueryKey
} from '@workspace/api-client-react';
import { Plus, Edit, Trash2, Shield, Globe, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const labelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  color: z.string().min(1, 'Color is required'),
  visibility: z.enum(['PUBLIC', 'ADMIN_ONLY']).default('PUBLIC'),
});

type LabelFormValues = z.infer<typeof labelSchema>;

export default function AdminLabelList() {
  const { data, isLoading, error } = useGetAdminLabels();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<LabelFormValues>({
    resolver: zodResolver(labelSchema),
    defaultValues: { name: '', slug: '', description: '', color: '#D92D20', visibility: 'PUBLIC' }
  });

  const createMutation = useCreateLabel({
    mutation: {
      onSuccess: () => {
        toast({ title: 'Label created' });
        queryClient.invalidateQueries({ queryKey: getGetAdminLabelsQueryKey() });
        setDialogOpen(false);
      },
      onError: (err: any) => toast({ title: 'Failed to create label', description: err.message, variant: 'destructive' })
    }
  });

  const updateMutation = useUpdateLabel({
    mutation: {
      onSuccess: () => {
        toast({ title: 'Label updated' });
        queryClient.invalidateQueries({ queryKey: getGetAdminLabelsQueryKey() });
        setDialogOpen(false);
      },
      onError: (err: any) => toast({ title: 'Failed to update label', description: err.message, variant: 'destructive' })
    }
  });

  const deleteMutation = useDeleteLabel({
    mutation: {
      onSuccess: () => {
        toast({ title: 'Label archived' });
        queryClient.invalidateQueries({ queryKey: getGetAdminLabelsQueryKey() });
      },
      onError: (err: any) => toast({ title: 'Failed to archive label', description: err.message, variant: 'destructive' })
    }
  });

  const openCreate = () => {
    setEditingId(null);
    form.reset({ name: '', slug: '', description: '', color: '#D92D20', visibility: 'PUBLIC' });
    setDialogOpen(true);
  };

  const openEdit = (label: any) => {
    setEditingId(label.id);
    form.reset({
      name: label.name,
      slug: label.slug,
      description: label.description || '',
      color: label.color,
      visibility: label.visibility,
    });
    setDialogOpen(true);
  };

  const onSubmit = (values: LabelFormValues) => {
    if (editingId) {
      updateMutation.mutate({ labelId: editingId, data: { ...values, slug: values.slug || undefined, description: values.description || undefined } });
    } else {
      createMutation.mutate({ data: { ...values, slug: values.slug || undefined, description: values.description || undefined } });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Labels</h1>
          <p className="text-muted-foreground mt-1">Manage taxonomy and categorization for stories.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Label
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Label' : 'Create Label'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="e.g. Breaking News" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (Optional)</FormLabel>
                  <FormControl><Input placeholder="e.g. breaking-news" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl><Input placeholder="Brief description" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="color" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input type="color" className="w-12 h-10 p-1" {...field} />
                        <Input placeholder="#000000" className="flex-1" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="visibility" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select visibility" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="ADMIN_ONLY">Admin Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Label'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <div className="w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium w-48">Label</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium w-32">Visibility</th>
                <th className="px-4 py-3 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><Skeleton className="h-6 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-8 w-16" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-destructive">Failed to load labels.</td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <Tag className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">No labels found</p>
                  </td>
                </tr>
              ) : (
                data.items.map((label) => (
                  <tr key={label.id} className={`hover:bg-muted/30 transition-colors ${label.archivedAt ? 'opacity-50 grayscale' : ''}`}>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="px-2 py-1 text-sm bg-transparent" style={{ borderLeft: `4px solid ${label.color}` }}>
                        {label.name}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">{label.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{label.description || '-'}</td>
                    <td className="px-4 py-3">
                      {label.visibility === 'PUBLIC' ? (
                        <div className="flex items-center text-emerald-600"><Globe className="h-3 w-3 mr-1" /> Public</div>
                      ) : (
                        <div className="flex items-center text-muted-foreground"><Shield className="h-3 w-3 mr-1" /> Admin Only</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!label.archivedAt && (
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(label)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Archive Label</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to archive "{label.name}"? Stories will no longer show this label if it's archived.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMutation.mutate({ labelId: label.id })} className="bg-destructive hover:bg-destructive/90">Archive</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                      {label.archivedAt && <span className="text-xs text-muted-foreground font-medium uppercase">Archived</span>}
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
