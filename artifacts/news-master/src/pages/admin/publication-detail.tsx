import { useParams, Link } from 'wouter';
import { useGetPublication } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { ArrowLeft, ScrollText, Send, AlertCircle, CheckCircle2, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';

export default function AdminPublicationDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: detail, isLoading, error } = useGetPublication(id || '', {
    query: { enabled: !!id } as any
  });

  if (isLoading) {
    return <div className="space-y-4 max-w-4xl mx-auto"><Skeleton className="h-8 w-1/3"/><Skeleton className="h-48 w-full"/><Skeleton className="h-48 w-full"/></div>;
  }

  if (error || !detail) {
    return <div className="p-8 text-center text-destructive">Failed to load publication</div>;
  }

  const { publication, post, deliveries } = detail;

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT': return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1"/> Sent</Badge>;
      case 'FAILED': return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1"/> Failed</Badge>;
      case 'DEAD': return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1"/> Dead</Badge>;
      case 'PENDING': return <Badge variant="secondary">Pending</Badge>;
      case 'WAITING_FOR_ASSET': return <Badge variant="outline" className="border-slate-500 text-slate-600">Waiting for asset</Badge>;
      case 'RENDERING': return <Badge variant="outline" className="border-indigo-500 text-indigo-600">Rendering</Badge>;
      case 'READY': return <Badge variant="outline" className="border-cyan-500 text-cyan-600">Ready</Badge>;
      case 'SENDING': return <Badge variant="outline" className="border-blue-500 text-blue-600">Sending...</Badge>;
      case 'RETRY': return <Badge variant="outline" className="border-amber-500 text-amber-600">Retry</Badge>;
      case 'UNKNOWN': return <Badge variant="outline" className="border-purple-500 text-purple-600">Unknown</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      <div className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
        <Link href="/admin/publications" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Publications
        </Link>
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight flex items-center">
          <ScrollText className="mr-3 h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          Publication Record
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 font-mono text-xs sm:text-sm text-muted-foreground">
          <span>ID: {publication.id.slice(0, 12)}...</span>
          <span>Rev. v{publication.revision}</span>
          <span>{format(new Date(publication.createdAt), 'MMM d, yyyy HH:mm:ss')}</span>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Associated Post</CardTitle>
          </CardHeader>
          <CardContent>
            {post ? (
              <div className="space-y-2">
                <div className="font-medium text-lg flex items-center gap-2">
                  <span className="font-mono text-primary font-bold">#{(post as any).postNumber || post.id.slice(0, 8)}</span>
                  <span>{post.title || 'Untitled'}</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{post.status}</Badge>
                  <Badge variant="secondary">{post.kind}</Badge>
                </div>
                <div className="mt-4 pt-4 border-t text-sm font-mono text-muted-foreground flex items-center justify-between">
                  <span>Post #{(post as any).postNumber || post.id.slice(0, 8)}</span>
                  <Link href={`/admin/posts/${post.id}`} className="text-primary hover:underline font-mono text-xs">View Full Post →</Link>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">Post data unavailable.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Delivery Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{deliveries?.length || 0}</div>
            <div className="text-sm text-muted-foreground mt-1 mb-4">Total Destinations</div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Successful</span>
                <span className="font-medium text-emerald-600">
                  {deliveries?.filter(d => d.status === 'SENT').length || 0}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Failed</span>
                <span className="font-medium text-destructive">
                  {deliveries?.filter(d => d.status === 'FAILED' || d.status === 'DEAD').length || 0}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Rendering / waiting</span>
                <span className="font-medium text-indigo-600">
                  {deliveries?.filter(d => ['WAITING_FOR_ASSET', 'RENDERING', 'READY', 'PENDING'].includes(d.status)).length || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Deliveries</CardTitle>
        </CardHeader>
        <div className="w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b border-t">
              <tr>
                <th className="px-4 py-3 font-medium w-32">Platform</th>
                <th className="px-4 py-3 font-medium w-24">Format</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium w-32">Status</th>
                <th className="px-4 py-3 font-medium w-24">Attempts</th>
                <th className="px-4 py-3 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {!deliveries?.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No deliveries recorded for this publication.
                  </td>
                </tr>
              ) : (
                deliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium capitalize">{del.platform}</td>
                    <td className="px-4 py-3">
                      <Badge variant={del.format === 'REEL' ? 'default' : 'outline'} className="text-[10px]">
                        {del.format ?? 'IMAGE'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{del.destination || '-'}</td>
                    <td className="px-4 py-3">{getDeliveryStatusBadge(del.status)}</td>
                    <td className="px-4 py-3 text-center">{del.attemptCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <Link href={`/admin/deliveries/${del.id}`} className="text-primary hover:underline text-xs flex items-center">
                          Details
                        </Link>
                        {(del.status === 'FAILED' || del.status === 'DEAD' || del.status === 'UNKNOWN' || del.status === 'RETRY') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                              try {
                                await apiFetch(`/api/admin/deliveries/${del.id}/retry`, {
                                  method: 'POST',
                                  body: JSON.stringify({ reason: 'Manual admin retry' }),
                                });
                                toast({ title: `Retrying delivery for ${del.platform}` });
                                queryClient.invalidateQueries({ queryKey: ['getPublication', id] });
                              } catch {
                                toast({ title: 'Failed to enqueue retry', variant: 'destructive' });
                              }
                            }}
                          >
                            <RotateCw className="w-3 h-3 mr-1" />
                            Republish
                          </Button>
                        )}
                      </div>
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
