import { useParams, Link } from 'wouter';
import { format } from 'date-fns';
import { ArrowLeft, Clock, Database, User } from 'lucide-react';
import { useGetAuditTimeline } from '@workspace/api-client-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function JsonBlock({ value }: { value: unknown }) {
  if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
    return <p className="text-sm text-muted-foreground">No payload recorded.</p>;
  }

  return (
    <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 text-xs leading-relaxed">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function AdminAuditTimeline() {
  const { type, id } = useParams();
  const entityType = type || '';
  const entityId = id || '';
  const { data, isLoading, error, refetch, isFetching } = useGetAuditTimeline(entityType, entityId, {
    query: { enabled: Boolean(entityType && entityId) } as any,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 px-0" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Audit Timeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entityType ? <span className="font-mono">{entityType}</span> : 'Entity'} ·{' '}
            {entityId ? <span className="font-mono">{entityId}</span> : 'Missing ID'}
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching || !entityId}>
          <Clock className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recorded Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2 border-b pb-4 last:border-0">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">Failed to load audit timeline.</p>
              <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
            </div>
          ) : !data?.items?.length ? (
            <div className="py-12 text-center">
              <Database className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No audit entries found</p>
              <p className="mt-1 text-sm text-muted-foreground">This entity has no recorded timeline entries.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {data.items.map((entry) => (
                <div key={entry.id} className="border-b pb-5 last:border-0 last:pb-0">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{entry.action}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a')}
                    </span>
                    {entry.actor && (
                      <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {entry.actor}
                      </span>
                    )}
                  </div>
                  <JsonBlock value={entry.payload} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
