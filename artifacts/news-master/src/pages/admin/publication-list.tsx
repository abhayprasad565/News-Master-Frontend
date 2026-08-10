import { useGetPublications } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { ScrollText, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function AdminPublicationList() {
  const { data, isLoading, error } = useGetPublications({ limit: 50 });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Publications</h1>
        <p className="text-muted-foreground mt-1">Log of all content published to readers and platforms.</p>
      </div>

      <Card>
        <div className="w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Post ID</th>
                <th className="px-4 py-3 font-medium w-32">Revision</th>
                <th className="px-4 py-3 font-medium w-48">Published At</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-12" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-32" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-destructive">
                    Failed to load publications.
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <ScrollText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">No publications found</p>
                  </td>
                </tr>
              ) : (
                data.items.map((pub) => (
                  <tr key={pub.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/publications/${pub.id}`} className="font-mono font-medium hover:underline text-primary">
                        {pub.id.slice(0, 12)}...
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/posts/${pub.postId}`} className="font-mono text-muted-foreground hover:underline flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        {pub.postId.slice(0, 12)}...
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-mono">v{pub.revision}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(pub.createdAt), 'MMM d, yyyy HH:mm:ss')}
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
