import { useGetPlatformPosts, useGetDeliveries } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Instagram, AlertCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminInstagram() {
  const { data: posts, isLoading: postsLoading } = useGetPlatformPosts({ platform: 'instagram', limit: 20 });
  const { data: failures, isLoading: failuresLoading } = useGetDeliveries({ platform: 'instagram', status: 'FAILED', limit: 10 });

  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      <div className="flex items-center gap-3">
        <Instagram className="h-7 w-7 sm:h-8 sm:w-8 text-pink-600 shrink-0" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">Instagram Operations</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage recent posts and delivery failures for Instagram.</p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Instagram Posts</CardTitle>
            </CardHeader>
            <div className="w-full overflow-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b border-t">
                  <tr>
                    <th className="px-4 py-3 font-medium">Content</th>
                    <th className="px-4 py-3 font-medium w-40">Published</th>
                    <th className="px-4 py-3 font-medium w-16">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {postsLoading ? (
                    <tr><td colSpan={3} className="px-4 py-8"><Skeleton className="h-8 w-full"/></td></tr>
                  ) : !posts?.items?.length ? (
                    <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No recent posts found.</td></tr>
                  ) : (
                    posts.items.map(post => (
                      <tr key={post.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link href={`/admin/platform-posts/${post.id}`} className="font-medium hover:underline text-foreground block max-w-xs truncate">
                            {post.content || 'Media Post'}
                          </Link>
                          {post.mediaUrl && <Badge variant="secondary" className="mt-1 text-[10px] py-0 px-1.5">Has Media</Badge>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {format(new Date(post.createdAt), 'MMM d, HH:mm')}
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={post.destination || '#'} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className={failures?.items && failures.items.length > 0 ? "border-destructive/50" : ""}>
            <CardHeader className="bg-destructive/5 pb-4">
              <CardTitle className="text-lg flex items-center text-destructive">
                <AlertCircle className="mr-2 h-5 w-5" />
                Delivery Failures
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {failuresLoading ? (
                <div className="p-4"><Skeleton className="h-12 w-full"/></div>
              ) : !failures?.items?.length ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No recent failures.</div>
              ) : (
                <div className="divide-y">
                  {failures.items.map(failure => (
                    <div key={failure.id} className="p-4 hover:bg-muted/30">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono text-xs font-semibold">{failure.id.slice(0, 8)}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(failure.sentAt || new Date()), 'MMM d, HH:mm')}</span>
                      </div>
                      <p className="text-xs text-destructive line-clamp-2 mb-2">{failure.lastError || 'Unknown error'}</p>
                      <Button variant="outline" size="sm" className="w-full text-xs h-7" asChild>
                        <Link href={`/admin/deliveries/${failure.id}`}>Review Delivery</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
