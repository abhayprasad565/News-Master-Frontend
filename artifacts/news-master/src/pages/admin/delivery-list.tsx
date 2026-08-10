import { useState } from 'react';
import { useGetDeliveries, DeliveryStatus } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Send, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDeliveryList() {
  const [status, setStatus] = useState<string>('all');
  const [platform, setPlatform] = useState<string>('all');

  const { data, isLoading, error } = useGetDeliveries({
    status: status !== 'all' ? status : undefined,
    platform: platform !== 'all' ? platform : undefined,
    limit: 50,
  });

  const getDeliveryStatusBadge = (s: string) => {
    switch (s) {
      case 'SENT': return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1"/> Sent</Badge>;
      case 'FAILED': return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1"/> Failed</Badge>;
      case 'PENDING': return <Badge variant="secondary">Pending</Badge>;
      case 'SENDING': return <Badge variant="outline" className="border-blue-500 text-blue-600">Sending...</Badge>;
      case 'RETRY': return <Badge variant="outline" className="border-amber-500 text-amber-600">Retry</Badge>;
      case 'UNKNOWN': return <Badge variant="outline" className="border-purple-500 text-purple-600">Unknown</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Deliveries</h1>
        <p className="text-muted-foreground mt-1">Monitor the status of content pushed to external platforms.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(DeliveryStatus).map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="x">X (Twitter)</SelectItem>
            <SelectItem value="telegram">Telegram</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b">
              <tr>
                <th className="px-4 py-3 font-medium">Platform</th>
                <th className="px-4 py-3 font-medium">Destination</th>
                <th className="px-4 py-3 font-medium w-32">Status</th>
                <th className="px-4 py-3 font-medium w-24">Attempts</th>
                <th className="px-4 py-3 font-medium w-48">Sent At</th>
                <th className="px-4 py-3 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-8" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-12" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-destructive">
                    Failed to load deliveries.
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Send className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">No deliveries found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
                  </td>
                </tr>
              ) : (
                data.items.map((del) => (
                  <tr key={del.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium capitalize">{del.platform}</td>
                    <td className="px-4 py-3 font-mono text-xs">{del.destination || '-'}</td>
                    <td className="px-4 py-3">{getDeliveryStatusBadge(del.status)}</td>
                    <td className="px-4 py-3 text-center">{del.attemptCount}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {del.sentAt ? format(new Date(del.sentAt), 'MMM d, HH:mm:ss') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/deliveries/${del.id}`} className="text-primary hover:underline font-medium">
                        View
                      </Link>
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
