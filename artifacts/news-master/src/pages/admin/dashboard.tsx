import { 
  useGetReviewQueue, 
  useGetAdminPosts, 
  useGetDeliveries, 
  useGetPublications,
  useGetPlatformPosts
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { FileText, ListChecks, Send, ScrollText, AlertCircle, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export default function AdminDashboard() {
  const { data: queueData, isLoading: queueLoading } = useGetReviewQueue({ limit: 10 });
  const { data: postsData, isLoading: postsLoading } = useGetAdminPosts({ limit: 5 });
  const { data: deliveriesData, isLoading: deliveriesLoading } = useGetDeliveries({ status: 'FAILED', limit: 5 });
  const { data: publicationsData, isLoading: publicationsLoading } = useGetPublications({ limit: 5 });
  const { data: platformsData, isLoading: platformsLoading } = useGetPlatformPosts({ limit: 5 });
  const { data: rankingData, isLoading: rankingLoading } = useQuery({
    queryKey: ['admin-ranking-dashboard'],
    queryFn: () => apiFetch<{ items: Array<{ tier?: string; urgent?: boolean; urgentEligible?: boolean; developmentType?: string }> }>('/api/admin/ranking?limit=5'),
  });
  const { data: urgentData, isLoading: urgentLoading } = useQuery({
    queryKey: ['admin-urgent-dashboard'],
    queryFn: () => apiFetch<{ items: Array<{ decision?: string }> }>('/api/admin/urgent'),
  });

  const queueCount = queueData?.items.length || 0;
  const failedDeliveriesCount = deliveriesData?.items.length || 0;
  const urgentCount = urgentData?.items.length || 0;
  const suppressedCount = rankingData?.items.filter((item) => item.tier === 'SUPPRESSED' || item.developmentType === 'DUPLICATE' || item.developmentType === 'MINOR_UPDATE').length || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of editorial operations and status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={urgentCount > 0 ? "border-red-200 bg-red-50/30" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Candidates</CardTitle>
            <AlertCircle className={`h-4 w-4 ${urgentCount > 0 ? "text-red-600" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            {urgentLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{urgentCount}</div>}
            <p className="text-xs text-muted-foreground mt-1">Shadow or gated candidates</p>
            <Button variant="link" className="px-0 mt-2 h-auto text-xs" asChild>
              <Link href="/admin/urgent">Review urgent <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className={queueCount > 0 ? "border-amber-200 bg-amber-50/30" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Backlog</CardTitle>
            <ListChecks className={`h-4 w-4 ${queueCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            {queueLoading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold">{queueCount} {queueData?.nextCursor && '+'}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Jobs pending review</p>
            <Button variant="link" className="px-0 mt-2 h-auto text-xs" asChild>
              <Link href="/admin/review">View queue <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className={failedDeliveriesCount > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Deliveries</CardTitle>
            <AlertCircle className={`h-4 w-4 ${failedDeliveriesCount > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            {deliveriesLoading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold text-destructive">{failedDeliveriesCount} {deliveriesData?.nextCursor && '+'}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
            <Button variant="link" className="px-0 mt-2 h-auto text-xs text-destructive" asChild>
              <Link href="/admin/deliveries?status=FAILED">View failures <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranked Feed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {rankingLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{rankingData?.items.length || 0}</div>}
            <p className="text-xs text-muted-foreground mt-1">{suppressedCount} duplicate/minor/suppressed</p>
            <Button variant="link" className="px-0 mt-2 h-auto text-xs" asChild>
              <Link href="/admin/ranking">Open ranking <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Publications</CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {publicationsLoading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold">{publicationsData?.items.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Latest content pushed</p>
            <Button variant="link" className="px-0 mt-2 h-auto text-xs" asChild>
              <Link href="/admin/publications">View log <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Latest editorial posts created in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : postsData?.items && postsData.items.length > 0 ? (
              <div className="space-y-4">
                {postsData.items.map(post => (
                  <div key={post.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                    <div>
                      <div className="font-medium hover:underline cursor-pointer">
                        <Link href={`/admin/posts/${post.id}`}>{post.title || 'Untitled Post'}</Link>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center">
                        <Badge variant="outline" className="text-[10px] py-0">{post.status}</Badge>
                        <span>{format(new Date(post.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent posts found.</p>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Platform Posts</CardTitle>
            <CardDescription>Latest successful social media posts</CardDescription>
          </CardHeader>
          <CardContent>
            {platformsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : platformsData?.items && platformsData.items.length > 0 ? (
              <div className="space-y-4">
                {platformsData.items.map(pp => (
                  <div key={pp.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                    <div className="truncate pr-4">
                      <div className="font-medium truncate text-sm">
                        <Link href={`/admin/platform-posts/${pp.id}`} className="hover:underline">
                          {pp.content ? pp.content : 'Media Post'}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex gap-2 items-center">
                        <Badge variant="secondary" className="text-[10px] py-0 capitalize">{pp.platform}</Badge>
                        <span>{format(new Date(pp.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    {pp.platform === 'instagram' || pp.platform === 'x' ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                        <a href={pp.destination || '#'} target="_blank" rel="noreferrer">
                          <Send className="h-3 w-3" />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No platform posts found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
