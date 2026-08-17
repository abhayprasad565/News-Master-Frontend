import { useState } from 'react';
import { useGetAdminPosts, AdminPostStatus, AdminPostKind } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { 
  Plus, Search, FileText, CheckCircle2, XCircle, Clock, Edit, CheckSquare, Film
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPostList() {
  const [status, setStatus] = useState<string>('all');
  const [kind, setKind] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useGetAdminPosts({
    status: status !== 'all' ? status : undefined,
    kind: kind !== 'all' ? kind : undefined,
    limit: 50,
  });

  const getStatusBadge = (s: string) => {
    switch(s) {
      case 'PUBLISHED': return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="w-3 h-3 mr-1"/> Published</Badge>;
      case 'DRAFT': return <Badge variant="secondary"><Edit className="w-3 h-3 mr-1"/> Draft</Badge>;
      case 'MANUAL_REVIEW': return <Badge variant="outline" className="border-amber-500 text-amber-600"><Clock className="w-3 h-3 mr-1"/> Review</Badge>;
      case 'REJECTED': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>;
      case 'VALIDATED': return <Badge variant="outline" className="border-blue-500 text-blue-600"><CheckSquare className="w-3 h-3 mr-1"/> Validated</Badge>;
      case 'VALIDATING': return <Badge variant="outline" className="border-purple-500 text-purple-600">Validating...</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  const getKindBadge = (k: string) => {
    switch(k) {
      case 'ORIGINAL': return <Badge variant="outline" className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">Original</Badge>;
      case 'CORRECTION': return <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">Correction</Badge>;
      case 'CUSTOM': return <Badge variant="outline" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">Custom</Badge>;
      default: return <Badge variant="outline">{k}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Posts</h1>
          <p className="text-muted-foreground mt-1">Manage editorial posts and their status.</p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by title..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(AdminPostStatus).map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Kind" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Kinds</SelectItem>
            {Object.values(AdminPostKind).map(k => (
              <SelectItem key={k} value={k}>{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium w-32">Status</th>
                <th className="px-4 py-3 font-medium w-32">Kind</th>
                <th className="px-4 py-3 font-medium w-48">Labels</th>
                <th className="px-4 py-3 font-medium w-48">Created At</th>
                <th className="px-4 py-3 font-medium w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-full max-w-md" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-16" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-destructive">
                    Failed to load posts.
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium">No posts found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
                  </td>
                </tr>
              ) : (
                data.items.filter(p => !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.text.toLowerCase().includes(search.toLowerCase())).map((post) => (
                  <tr key={post.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/posts/${post.id}`} className="font-medium hover:underline text-foreground block max-w-lg truncate">
                        {(() => {
                          const isGenericOrUuid = (str?: string | null) =>
                            !str ||
                            !str.trim() ||
                            ['untitled', 'untitled post', 'unpublished post'].includes(str.trim().toLowerCase()) ||
                            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

                          if (!isGenericOrUuid(post.title)) return post.title!;
                          if (post.text && post.text.trim()) {
                            const cleanedText = (post.text.split(/source:\s*/i)[0] ?? post.text).trim();
                            const firstSentence = (cleanedText.split(/(?<=[.!?])\s+|\n+/)[0] ?? '').trim();
                            const headline = firstSentence.replace(/^[#*\s]+/, '').trim();
                            if (headline) return headline.length > 90 ? `${headline.slice(0, 87)}...` : headline;
                          }
                          return `Post ${post.id.slice(0, 8)}`;
                        })()}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(post.status)}</td>
                    <td className="px-4 py-3">{getKindBadge(post.kind)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {post.labels.slice(0, 2).map(l => (
                          <span key={l.id} className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-secondary text-secondary-foreground border">
                            {l.name}
                          </span>
                        ))}
                        {post.labels.length > 2 && (
                          <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-secondary text-secondary-foreground border">
                            +{post.labels.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(post.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" asChild title="Create Video">
                        <Link href={`/admin/posts/${post.id}/video`}><Film className="h-4 w-4" /></Link>
                      </Button>
                      {['DRAFT', 'MANUAL_REVIEW', 'REJECTED', 'VALIDATED'].includes(post.status) ? (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/posts/${post.id}/edit`}>Edit</Link>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/posts/${post.id}`}>View</Link>
                        </Button>
                      )}
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
