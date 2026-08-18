import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Edit, Plus, ShieldCheck } from 'lucide-react';
import { apiFetch, FrontendApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

type TopicRule = {
  id: string;
  stableKey: string;
  displayName: string;
  aliases?: string[];
  category?: string | null;
  mode: 'BOOST' | 'PIN' | 'SUPPRESS';
  boost?: number | null;
  source?: 'ENV' | 'ADMIN' | string;
  urgentEligible?: boolean;
  activeFrom?: string | null;
  activeUntil?: string | null;
  archivedAt?: string | null;
};

type TopicRuleForm = {
  stableKey: string;
  displayName: string;
  aliases: string;
  category: string;
  mode: 'BOOST' | 'PIN' | 'SUPPRESS';
  boost: string;
  urgentEligible: boolean;
  activeFrom: string;
  activeUntil: string;
  reason: string;
};

const emptyForm: TopicRuleForm = {
  stableKey: '',
  displayName: '',
  aliases: '',
  category: '',
  mode: 'BOOST',
  boost: '10',
  urgentEligible: false,
  activeFrom: '',
  activeUntil: '',
  reason: '',
};

export default function AdminTopicRules() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-topic-rules'],
    queryFn: () => apiFetch<{ items: TopicRule[] }>('/api/admin/topic-rules'),
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TopicRule | null>(null);
  const [form, setForm] = useState<TopicRuleForm>(emptyForm);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = serializeForm(form);
      return editing
        ? apiFetch(`/api/admin/topic-rules/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        : apiFetch('/api/admin/topic-rules', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      toast({ title: editing ? 'Topic rule updated' : 'Topic rule created' });
      queryClient.invalidateQueries({ queryKey: ['admin-topic-rules'] });
      setDialogOpen(false);
    },
    onError: (err) => showErrorToast(toast, err),
  });

  const archiveMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch(`/api/admin/topic-rules/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) }),
    onSuccess: () => {
      toast({ title: 'Topic rule archived' });
      queryClient.invalidateQueries({ queryKey: ['admin-topic-rules'] });
    },
    onError: (err) => showErrorToast(toast, err),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(rule: TopicRule) {
    setEditing(rule);
    setForm({
      stableKey: rule.stableKey,
      displayName: rule.displayName,
      aliases: (rule.aliases || []).join(', '),
      category: rule.category || '',
      mode: rule.mode,
      boost: String(rule.boost ?? 10),
      urgentEligible: Boolean(rule.urgentEligible),
      activeFrom: rule.activeFrom || '',
      activeUntil: rule.activeUntil || '',
      reason: '',
    });
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Topic Rules</h1>
          <p className="mt-1 text-muted-foreground text-sm sm:text-base">Important and trending topic controls. Environment rules are read-only.</p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto"><Plus className="mr-2 h-4 w-4" />New rule</Button>
      </div>

      <Card className="overflow-hidden w-full">
        {/* Mobile View */}
        <div className="block md:hidden divide-y">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading topic rules...</div>
          ) : error ? (
            <div className="p-8 text-center text-destructive">Failed to load topic rules.</div>
          ) : !data?.items?.length ? (
            <div className="p-12 text-center text-muted-foreground">No topic rules configured.</div>
          ) : (
            data.items.map((rule) => {
              const readOnly = rule.source === 'ENV';
              return (
                <div key={rule.id} className={`p-4 space-y-3 ${rule.archivedAt ? 'opacity-50' : 'hover:bg-muted/20'} transition-colors`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold text-base text-foreground">{rule.displayName}</span>
                    <Badge variant={rule.mode === 'SUPPRESS' ? 'destructive' : 'secondary'}>
                      {rule.mode}{rule.mode === 'BOOST' && rule.boost ? ` +${rule.boost}` : ''}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                    <span className="font-mono">{rule.stableKey}</span>
                    {rule.category && <span>• Category: {rule.category}</span>}
                    {rule.urgentEligible && <Badge className="bg-red-600 text-[10px]">Urgent</Badge>}
                    {readOnly && <Badge variant="outline" className="text-[10px]"><ShieldCheck className="mr-1 h-3 w-3" />ENV</Badge>}
                    {rule.archivedAt && <Badge variant="secondary" className="text-[10px]">Archived</Badge>}
                  </div>

                  {(rule.activeFrom || rule.activeUntil) && (
                    <div className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                      Window: {rule.activeFrom || 'Start'} to {rule.activeUntil || 'Forever'}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={readOnly || !!rule.archivedAt}
                      onClick={() => openEdit(rule)}
                      className="h-8 text-xs"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={readOnly || !!rule.archivedAt}
                      onClick={() => {
                        const reason = window.prompt(`Reason for archiving ${rule.displayName}`);
                        if (reason?.trim()) archiveMutation.mutate({ id: rule.id, reason });
                      }}
                      className="h-8 text-xs text-destructive hover:text-destructive"
                    >
                      <Archive className="h-3.5 w-3.5 mr-1" /> Archive
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left text-sm table-auto">
            <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Rule</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Urgent</th>
                <th className="px-4 py-3 font-medium">Active Window</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading topic rules...</td></tr>
              ) : error ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-destructive">Failed to load topic rules.</td></tr>
              ) : !data?.items?.length ? (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">No topic rules configured.</td></tr>
              ) : (
                data.items.map((rule) => {
                  const readOnly = rule.source === 'ENV';
                  return (
                    <tr key={rule.id} className={rule.archivedAt ? 'opacity-50' : 'hover:bg-muted/30'}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{rule.displayName}</div>
                        <div className="font-mono text-xs text-muted-foreground">{rule.stableKey}</div>
                        <div className="mt-1 flex gap-1">
                          {readOnly && <Badge variant="outline"><ShieldCheck className="mr-1 h-3 w-3" />ENV</Badge>}
                          {rule.archivedAt && <Badge variant="secondary">Archived</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={rule.mode === 'SUPPRESS' ? 'destructive' : 'secondary'}>{rule.mode}{rule.mode === 'BOOST' && rule.boost ? ` +${rule.boost}` : ''}</Badge>
                      </td>
                      <td className="px-4 py-3">{rule.category || '-'}</td>
                      <td className="px-4 py-3">{rule.urgentEligible ? 'Eligible' : 'No'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{rule.activeFrom || '-'}<br />{rule.activeUntil || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" disabled={readOnly || !!rule.archivedAt} onClick={() => openEdit(rule)}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" disabled={readOnly || !!rule.archivedAt} onClick={() => {
                            const reason = window.prompt(`Reason for archiving ${rule.displayName}`);
                            if (reason?.trim()) archiveMutation.mutate({ id: rule.id, reason });
                          }}><Archive className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit topic rule' : 'Create topic rule'}</DialogTitle>
            <DialogDescription>Boosts do not stack; one active rule controls a stable key.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Stable key"><Input value={form.stableKey} onChange={(event) => setForm({ ...form, stableKey: event.target.value })} disabled={!!editing} /></Field>
            <Field label="Display name"><Input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></Field>
            <Field label="Aliases"><Input value={form.aliases} onChange={(event) => setForm({ ...form, aliases: event.target.value })} placeholder="comma,separated,aliases" /></Field>
            <Field label="Category"><Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></Field>
            <Field label="Mode">
              <Select value={form.mode} onValueChange={(value: TopicRuleForm['mode']) => setForm({ ...form, mode: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOOST">BOOST</SelectItem>
                  <SelectItem value="PIN">PIN</SelectItem>
                  <SelectItem value="SUPPRESS">SUPPRESS</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Boost">
              <Input type="number" min="1" max="20" value={form.boost} disabled={form.mode !== 'BOOST'} onChange={(event) => setForm({ ...form, boost: event.target.value })} />
            </Field>
            <Field label="Active from"><Input value={form.activeFrom} onChange={(event) => setForm({ ...form, activeFrom: event.target.value })} placeholder="ISO datetime optional" /></Field>
            <Field label="Active until"><Input value={form.activeUntil} onChange={(event) => setForm({ ...form, activeUntil: event.target.value })} placeholder="ISO datetime optional" /></Field>
            <div className="flex items-center gap-3 rounded-md border p-3">
              <Switch checked={form.urgentEligible} onCheckedChange={(checked) => setForm({ ...form, urgentEligible: checked })} />
              <div>
                <Label>Urgent eligible</Label>
                <p className="text-xs text-muted-foreground">Backend gates still decide final urgent status.</p>
              </div>
            </div>
            <Field label="Reason"><Textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={!form.stableKey || !form.displayName || !form.reason.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? 'Saving...' : 'Save rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function serializeForm(form: TopicRuleForm) {
  return {
    stableKey: form.stableKey,
    displayName: form.displayName,
    aliases: form.aliases.split(',').map((alias) => alias.trim()).filter(Boolean),
    category: form.category || null,
    mode: form.mode,
    boost: form.mode === 'BOOST' ? Number(form.boost) : null,
    urgentEligible: form.urgentEligible,
    activeFrom: form.activeFrom || null,
    activeUntil: form.activeUntil || null,
    reason: form.reason,
  };
}

function showErrorToast(toast: ReturnType<typeof useToast>['toast'], err: unknown) {
  const apiError = err as FrontendApiError;
  toast({
    title: 'Topic rule action failed',
    description: apiError.requestId ? `${apiError.message} (${apiError.requestId})` : apiError.message,
    variant: 'destructive',
  });
}
