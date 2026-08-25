import { useState } from 'react';
import { useGetPlatformPosts, useGetDeliveries } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Instagram, AlertCircle, ExternalLink, ChevronLeft, ChevronRight, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminInstagram() {
  // Published Posts pagination
  const [postCursorHistory, setPostCursorHistory] = useState<string[]>([]);
  const [postCursor, setPostCursor] = useState<string | undefined>(undefined);
  const postCurrentPage = postCursorHistory.length + 1;

  // Failed Deliveries pagination
  const [failCursorHistory, setFailCursorHistory] = useState<string[]>([]);
  const [failCursor, setFailCursor] = useState<string | undefined>(undefined);
  const failCurrentPage = failCursorHistory.length + 1;

  const { data: posts, isLoading: postsLoading, isFetching: postsFetching } = useGetPlatformPosts({ 
    platform: 'instagram', 
    cursor: postCursor,
    limit: 15 
  });

  const { data: failures, isLoading: failuresLoading, isFetching: failuresFetching } = useGetDeliveries({ 
    platform: 'instagram', 
    status: 'FAILED', 
    cursor: failCursor,
    limit: 15 
  });

  const handlePostNext = () => {
    if (posts?.nextCursor) {
      setPostCursorHistory((prev) => [...prev, postCursor || '']);
      setPostCursor(posts.nextCursor);
    }
  };

  const handlePostPrev = () => {
    if (postCursorHistory.length > 0) {
      const prev = postCursorHistory[postCursorHistory.length - 1];
      setPostCursorHistory((prevList) => prevList.slice(0, -1));
      setPostCursor(prev || undefined);
    }
  };

  const handleFailNext = () => {
    if (failures?.nextCursor) {
      setFailCursorHistory((prev) => [...prev, failCursor || '']);
      setFailCursor(failures.nextCursor);
    }
  };

  const handleFailPrev = () => {
    if (failCursorHistory.length > 0) {
      const prev = failCursorHistory[failCursorHistory.length - 1];
      setFailCursorHistory((prevList) => prevList.slice(0, -1));
      setFailCursor(prev || undefined);
    }
  };

  return (
    <div className="space-y-8 w-full">
      <div className="flex items-center gap-3">
        <Instagram className="h-7 w-7 sm:h-8 sm:w-8 text-pink-600 shrink-0" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">Instagram Operations</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Monitor delivery failures, retry errors, and view published Instagram posts.</p>
        </div>
      </div>

      {/* TOP TABLE / CARDS: Failed Instagram Deliveries */}
      <Card className="overflow-hidden border-destructive/40 shadow-sm">
        <CardHeader className="bg-destructive/5 border-b pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <CardTitle className="text-base sm:text-lg">Failed Instagram Publications</CardTitle>
            </div>
            <Badge variant="destructive" className="text-xs shrink-0">
              {failures?.items?.length || 0} Failures
            </Badge>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Posts and reels that encountered container creation, upload, or media errors during publishing
          </CardDescription>
        </CardHeader>

        {/* Mobile View: Card List */}
        <div className="block md:hidden divide-y">
          {failuresLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))
          ) : !failures?.items?.length ? (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="font-medium text-foreground text-sm">No delivery failures</p>
              <p className="text-xs text-muted-foreground">All recent Instagram publications dispatched successfully.</p>
            </div>
          ) : (
            failures.items.map((fail: any) => {
              const postUrl = fail.postId ? `/admin/posts/${fail.postNumber || fail.postId}` : null;
              const failedDate = fail.sentAt || fail.createdAt;
              return (
                <div key={fail.id} className="p-4 space-y-2.5 hover:bg-destructive/5 transition-colors">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {fail.postTopic && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium">
                          {fail.postTopic}
                        </Badge>
                      )}
                      {fail.postNumber && (
                        <span className="font-mono text-xs font-semibold text-muted-foreground">
                          #{fail.postNumber}
                        </span>
                      )}
                    </div>
                    <Badge 
                      variant={fail.format === 'REEL' ? 'default' : 'secondary'} 
                      className={`text-[10px] ${fail.format === 'REEL' ? 'bg-pink-600' : ''}`}
                    >
                      {fail.format || 'IMAGE'}
                    </Badge>
                  </div>

                  {postUrl ? (
                    <Link href={postUrl} className="font-semibold text-sm hover:underline text-foreground block leading-snug">
                      {fail.postTitle || `Delivery ${fail.id.slice(0, 8)}`}
                    </Link>
                  ) : (
                    <span className="font-semibold text-sm text-foreground block leading-snug">
                      {fail.postTitle || `Delivery ${fail.id.slice(0, 8)}`}
                    </span>
                  )}

                  <div className="bg-destructive/10 p-2 rounded border border-destructive/20 text-xs font-mono text-destructive">
                    {fail.lastError || 'Unknown error occurred'}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono py-0">
                        {fail.attemptCount} {fail.attemptCount === 1 ? 'attempt' : 'attempts'}
                      </Badge>
                      <span className="text-[11px]">{failedDate ? format(new Date(failedDate), 'MMM d, HH:mm') : 'Not sent'}</span>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" asChild>
                      <Link href={`/admin/deliveries/${fail.id}`}>Review</Link>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b text-xs uppercase font-medium">
              <tr>
                <th className="px-4 py-3 min-w-[220px]">Post Title & Topic</th>
                <th className="px-4 py-3 w-28">Format</th>
                <th className="px-4 py-3 w-36">Failed At</th>
                <th className="px-4 py-3 text-center w-24">Retries</th>
                <th className="px-4 py-3 min-w-[260px]">Error Message</th>
                <th className="px-4 py-3 text-right w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {failuresLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4"><Skeleton className="h-6 w-full"/></td>
                  </tr>
                ))
              ) : !failures?.items?.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                    <p className="font-medium text-foreground">No delivery failures</p>
                    <p className="text-xs text-muted-foreground">All recent Instagram publications dispatched successfully.</p>
                  </td>
                </tr>
              ) : (
                failures.items.map((fail: any) => {
                  const postUrl = fail.postId ? `/admin/posts/${fail.postNumber || fail.postId}` : null;
                  const failedDate = fail.sentAt || fail.createdAt;
                  return (
                    <tr key={fail.id} className="hover:bg-destructive/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {fail.postTopic && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium">
                              {fail.postTopic}
                            </Badge>
                          )}
                          {fail.postNumber && (
                            <span className="font-mono text-xs font-semibold text-muted-foreground">
                              #{fail.postNumber}
                            </span>
                          )}
                        </div>
                        {postUrl ? (
                          <Link href={postUrl} className="font-medium text-sm hover:underline text-foreground block mt-1 line-clamp-1">
                            {fail.postTitle || `Delivery ${fail.id.slice(0, 8)}`}
                          </Link>
                        ) : (
                          <span className="font-medium text-sm text-foreground block mt-1 line-clamp-1">
                            {fail.postTitle || `Delivery ${fail.id.slice(0, 8)}`}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-muted-foreground">ID: {fail.id.slice(0, 8)}</span>
                      </td>

                      <td className="px-4 py-3">
                        <Badge 
                          variant={fail.format === 'REEL' ? 'default' : 'secondary'} 
                          className={`text-[10px] ${fail.format === 'REEL' ? 'bg-pink-600 hover:bg-pink-700' : ''}`}
                        >
                          {fail.format || 'IMAGE'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {failedDate ? format(new Date(failedDate), 'MMM d, HH:mm:ss') : 'Not sent'}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="font-mono text-xs">
                          {fail.attemptCount}
                        </Badge>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-xs font-mono text-destructive bg-destructive/10 p-1.5 rounded border border-destructive/20 line-clamp-2" title={fail.lastError || 'Unknown error'}>
                          {fail.lastError || 'Unknown error occurred'}
                        </p>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <Link href={`/admin/deliveries/${fail.id}`}>Review</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground gap-3">
          <div>
            Showing {failures?.items?.length || 0} failed deliveries {failCurrentPage > 1 && `(Page ${failCurrentPage})`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFailPrev}
              disabled={failCurrentPage <= 1 || failuresLoading || failuresFetching}
              className="h-8 px-3"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <span className="font-medium px-1">Page {failCurrentPage}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFailNext}
              disabled={!failures?.nextCursor || failuresLoading || failuresFetching}
              className="h-8 px-3"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* BOTTOM TABLE / CARDS: Published Instagram Posts */}
      <Card className="overflow-hidden shadow-sm">
        <CardHeader className="border-b pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Instagram className="h-5 w-5 text-pink-600 shrink-0" />
              <CardTitle className="text-base sm:text-lg">Published Instagram Posts</CardTitle>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {posts?.items?.length || 0} Recent
            </Badge>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Successfully delivered feed posts and reels visible live on Instagram
          </CardDescription>
        </CardHeader>

        {/* Mobile View: Card List */}
        <div className="block md:hidden divide-y">
          {postsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : !posts?.items?.length ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="font-medium text-foreground text-sm">No recent posts found</p>
              <p className="text-xs text-muted-foreground">Published Instagram posts will appear here.</p>
            </div>
          ) : (
            posts.items.map(post => (
              <div key={post.id} className="p-4 space-y-2.5 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-[10px] py-0 px-2">
                    {post.format || (post.mediaUrl ? 'MEDIA' : 'POST')}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {format(new Date(post.createdAt), 'MMM d, HH:mm')}
                  </span>
                </div>

                <Link 
                  href={`/admin/platform-posts/${post.id}`} 
                  className="font-medium text-sm hover:underline text-foreground block line-clamp-2 leading-snug"
                >
                  {post.content || 'Media Post'}
                </Link>

                <div className="flex items-center justify-between pt-1 border-t text-xs text-muted-foreground">
                  <span className="font-mono text-[10px]">ID: {post.id.slice(0, 8)}</span>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary" asChild>
                    <a href={post.destination || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                      <span>View on IG</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b text-xs uppercase font-medium">
              <tr>
                <th className="px-4 py-3 min-w-[280px]">Content & Story</th>
                <th className="px-4 py-3 w-32">Format</th>
                <th className="px-4 py-3 w-40">Published At</th>
                <th className="px-4 py-3 text-right w-24">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {postsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-4"><Skeleton className="h-6 w-full"/></td>
                  </tr>
                ))
              ) : !posts?.items?.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    <p className="font-medium text-foreground">No recent posts found</p>
                    <p className="text-xs text-muted-foreground">Published Instagram posts will appear here.</p>
                  </td>
                </tr>
              ) : (
                posts.items.map(post => (
                  <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link 
                        href={`/admin/platform-posts/${post.id}`} 
                        className="font-medium text-sm hover:underline text-foreground block max-w-lg truncate"
                      >
                        {post.content || 'Media Post'}
                      </Link>
                      <span className="font-mono text-[10px] text-muted-foreground">ID: {post.id.slice(0, 8)}</span>
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-[10px] py-0 px-2">
                        {post.format || (post.mediaUrl ? 'MEDIA' : 'POST')}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(post.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="h-8 px-2.5 text-xs text-primary" asChild>
                        <a href={post.destination || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                          <span>View</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground gap-3">
          <div>
            Showing {posts?.items?.length || 0} published posts {postCurrentPage > 1 && `(Page ${postCurrentPage})`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePostPrev}
              disabled={postCurrentPage <= 1 || postsLoading || postsFetching}
              className="h-8 px-3"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <span className="font-medium px-1">Page {postCurrentPage}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePostNext}
              disabled={!posts?.nextCursor || postsLoading || postsFetching}
              className="h-8 px-3"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
