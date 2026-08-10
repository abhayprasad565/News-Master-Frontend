import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Newspaper, LayoutDashboard, ListChecks, FileText, Send, 
  Settings, Instagram, Twitter, Tags, ScrollText, User,
  BarChart3, Flame, SlidersHorizontal,
} from 'lucide-react';

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Ranking', href: '/admin/ranking', icon: BarChart3 },
  { name: 'Urgent', href: '/admin/urgent', icon: Flame },
  { name: 'Topic Rules', href: '/admin/topic-rules', icon: SlidersHorizontal },
  { name: 'Review Queue', href: '/admin/review', icon: ListChecks },
  { name: 'Posts', href: '/admin/posts', icon: FileText },
  { name: 'Publications', href: '/admin/publications', icon: ScrollText },
  { name: 'Deliveries', href: '/admin/deliveries', icon: Send },
  { name: 'Instagram', href: '/admin/platforms/instagram', icon: Instagram },
  { name: 'X', href: '/admin/platforms/x', icon: Twitter },
  { name: 'Labels', href: '/admin/labels', icon: Tags },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-[100dvh] bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r bg-background">
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/admin" className="flex items-center gap-2 text-primary">
            <Newspaper className="h-5 w-5" />
            <span className="font-serif font-bold text-lg tracking-tight text-foreground">News Master</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-4 text-sm font-medium">
            {adminNav.map((item) => {
              const isActive = location === item.href || (item.href !== '/admin' && location.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                    isActive 
                      ? 'bg-primary/10 text-primary hover:bg-primary/15' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="border-t p-4">
          <Link href="/account" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <User className="h-4 w-4" />
            Account
          </Link>
        </div>
      </aside>

      <main className="flex-1 pl-64">
        <div className="h-14 border-b bg-background flex items-center px-8">
          <h1 className="text-sm font-medium text-muted-foreground">Admin Portal</h1>
        </div>
        <div className="p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
