import { useParams, Link } from 'wouter';
import { useGetPlatformPost } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { ArrowLeft, Globe, Link as LinkIcon, FileText, Send, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function AdminPlatformPostDetail() {
  const { id } = useParams();
  const { data: detail, isLoading, error } = useGetPlatformPost(id || '', {
    query: { enabled: !!id } as any
  });

  if (isLoading) {
    return <div className="space-y-4 max-w-4xl mx-auto"><Skeleton className="h-8 w-1/3"/><Skeleton className="h-48 w-full"/><Skeleton className="h-48 w-full"/></div>;
  }

  if (error || !detail) {
    return <div className="p-8 text-center text-destructive">Failed to load platform post</div>;
  }

  const { platformPost: pp, post, publication, delivery } = detail;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
        <Link href={`/admin/platforms/${pp.platform}`} className="flex items-center capitalize">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to {pp.platform}
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight flex items-center">
            <Globe className="mr-3 h-8 w-8 text-muted-foreground" />
            Platform Post Details
          </h1>
          <div className="flex items-center gap-2 mt-2 font-mono text-sm text-muted-foreground">
            <Badge variant="outline" className="capitalize">{pp.platform}</Badge>
            <span>{format(new Date(pp.createdAt), 'MMM d, yyyy HH:mm')}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Content</CardTitle>
          </CardHeader>
          <CardContent>
            {pp.content ? (
              <div className="bg-muted/30 p-4 rounded-md font-sans text-sm whitespace-pre-wrap border border-dashed">
                {pp.content}
              </div>
            ) : (
              <span className="text-muted-foreground italic">No text content</span>
            )}
            
            {pp.mediaUrl && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <ImageIcon className="h-4 w-4 mr-2" /> Attached Media
                </h4>
                <div className="border rounded-md overflow-hidden bg-muted inline-block max-w-sm">
                  <img src={pp.mediaUrl} alt="Platform Media" className="w-full object-cover" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-col border-b pb-2">
              <span className="text-muted-foreground text-xs mb-1">Remote ID</span>
              <span className="font-mono">{pp.remoteId || 'N/A'}</span>
            </div>
            <div className="flex flex-col border-b pb-2">
              <span className="text-muted-foreground text-xs mb-1">Destination Link</span>
              {pp.destination ? (
                <a href={pp.destination} target="_blank" rel="noreferrer" className="flex items-center text-primary hover:underline">
                  <LinkIcon className="h-3 w-3 mr-1" /> View on {pp.platform}
                </a>
              ) : (
                <span className="font-mono">N/A</span>
              )}
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground text-xs">Published At</span>
              <span className="font-medium">{pp.publishedAt ? format(new Date(pp.publishedAt), 'MMM d, HH:mm:ss') : 'N/A'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related Entities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {post && (
              <div className="flex flex-col border-b pb-2">
                <span className="text-muted-foreground text-xs mb-1 flex items-center"><FileText className="h-3 w-3 mr-1"/> Source Post</span>
                <Link href={`/admin/posts/${post.id}`} className="text-primary hover:underline font-medium line-clamp-1">
                  {post.title || post.id}
                </Link>
              </div>
            )}
            {publication && (
              <div className="flex flex-col border-b pb-2">
                <span className="text-muted-foreground text-xs mb-1 flex items-center"><Globe className="h-3 w-3 mr-1"/> Publication</span>
                <Link href={`/admin/publications/${publication.id}`} className="text-primary hover:underline font-mono">
                  {publication.id} (v{publication.revision})
                </Link>
              </div>
            )}
            {delivery && (
              <div className="flex flex-col border-b pb-2">
                <span className="text-muted-foreground text-xs mb-1 flex items-center"><Send className="h-3 w-3 mr-1"/> Delivery</span>
                <Link href={`/admin/deliveries/${delivery.id}`} className="text-primary hover:underline font-mono flex items-center justify-between">
                  <span>{delivery.id}</span>
                  <Badge variant="outline" className="text-[10px] py-0">{delivery.status}</Badge>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {(pp.requestPayload || pp.responsePayload) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Payloads</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pp.requestPayload && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Request</h4>
                  <div className="bg-muted/30 p-3 rounded-md font-mono text-xs overflow-auto max-h-60 border">
                    {JSON.stringify(pp.requestPayload, null, 2)}
                  </div>
                </div>
              )}
              {pp.responsePayload && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Response</h4>
                  <div className="bg-muted/30 p-3 rounded-md font-mono text-xs overflow-auto max-h-60 border">
                    {JSON.stringify(pp.responsePayload, null, 2)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
