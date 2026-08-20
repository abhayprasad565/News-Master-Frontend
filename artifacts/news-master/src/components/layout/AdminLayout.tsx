import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Newspaper,
  LayoutDashboard,
  ListChecks,
  FileText,
  Send,
  Settings,
  Instagram,
  Twitter,
  Tags,
  ScrollText,
  User,
  BarChart3,
  Flame,
  SlidersHorizontal,
  Bot,
  Music2,
  Menu,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const adminNav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Traffic", href: "/admin/traffic", icon: TrendingUp },
  { name: "Ranking", href: "/admin/ranking", icon: BarChart3 },
  { name: "Autopilot", href: "/admin/autopilot", icon: Bot },
  { name: "Audio", href: "/admin/audio", icon: Music2 },
  { name: "Urgent", href: "/admin/urgent", icon: Flame },
  { name: "Topic Rules", href: "/admin/topic-rules", icon: SlidersHorizontal },
  { name: "Review Queue", href: "/admin/review", icon: ListChecks },
  { name: "Posts", href: "/admin/posts", icon: FileText },
  { name: "Publications", href: "/admin/publications", icon: ScrollText },
  { name: "Deliveries", href: "/admin/deliveries", icon: Send },
  { name: "Instagram", href: "/admin/platforms/instagram", icon: Instagram },
  { name: "X", href: "/admin/platforms/x", icon: Twitter },
  { name: "Labels", href: "/admin/labels", icon: Tags },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (onNavClick?: () => void) => (
    <>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-3 sm:px-4 text-sm font-medium">
          {adminNav.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/admin" && location.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavClick}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4 flex items-center justify-between">
        <Link
          href="/account"
          onClick={onNavClick}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <User className="h-4 w-4 shrink-0" />
          <span>Account</span>
        </Link>
        <ThemeToggle />
      </div>
    </>
  );

  return (
    <div className="flex min-h-[100dvh] bg-muted/40 w-full overflow-x-hidden">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-20 w-64 flex-col border-r bg-background">
        <div className="flex h-14 items-center justify-between border-b px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <Logo className="h-7 w-auto" />
          </Link>
          <ThemeToggle />
        </div>
        {navContent()}
      </aside>

      {/* Main Content Shell */}
      <main className="flex-1 lg:pl-64 flex flex-col min-w-0 w-full">
        {/* Mobile / Tablet Sticky Header */}
        <header className="flex lg:hidden h-14 items-center justify-between border-b bg-background px-4 sticky top-0 z-30">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo className="h-6 w-auto" />
          </Link>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 flex flex-col">
                <SheetHeader className="h-14 border-b px-6 flex flex-row items-center justify-between space-y-0">
                  <SheetTitle className="text-left font-bold flex items-center gap-2">
                    <Logo className="h-6 w-auto" />
                  </SheetTitle>
                </SheetHeader>
                {navContent(() => setMobileOpen(false))}
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Desktop Top Header */}
        <div className="hidden lg:flex h-14 border-b bg-background items-center justify-between px-8">
          <h1 className="text-sm font-medium text-muted-foreground">
            Admin Portal
          </h1>
          <ThemeToggle />
        </div>

        {/* Page Content Container */}
        <div className="p-3 sm:p-5 lg:p-8 w-full min-w-0 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
