import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useGetMe } from '@workspace/api-client-react';
import { ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';
import { Footer } from '@/components/layout/Footer';
import { canAccessAdmin, destinationForRole, type WebRole } from '@/lib/role-policy';

export function ReaderLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: me } = useGetMe();
  const role = me?.user?.role as WebRole | undefined;
  const showAdminPanel = role ? canAccessAdmin(role) : false;

  const isStoriesActive = location.startsWith('/stories') || location.startsWith('/labels');
  const isPrivacyActive = location === '/privacy';
  const isContactActive = location === '/contact';

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background w-full overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Main Header Bar: Logo on left, Theme & Auth on right */}
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href={role ? destinationForRole(role) : '/stories'} className="flex items-center gap-2">
              <Logo className="h-7 sm:h-8 w-auto" />
            </Link>
            
            {/* Desktop Navigation Links */}
            <nav className="hidden sm:flex items-center gap-4 text-sm font-medium">
              <Link
                href="/stories"
                className={`transition-colors hover:text-foreground ${
                  isStoriesActive ? 'text-foreground font-semibold' : 'text-foreground/70'
                }`}
              >
                Stories
              </Link>
              <Link
                href="/privacy"
                className={`transition-colors hover:text-foreground ${
                  isPrivacyActive ? 'text-foreground font-semibold' : 'text-foreground/70'
                }`}
              >
                Privacy
              </Link>
              <Link
                href="/contact"
                className={`transition-colors hover:text-foreground ${
                  isContactActive ? 'text-foreground font-semibold' : 'text-foreground/70'
                }`}
              >
                Contact
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            {showAdminPanel && (
              <Button variant="outline" size="sm" asChild className="h-9 px-2 sm:px-3">
                <Link href="/admin" aria-label="Admin Panel">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin Panel</span>
                </Link>
              </Button>
            )}
            <ThemeToggle />

            {me?.user ? (
              <Link href="/account">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="sr-only">Account</span>
                </Button>
              </Link>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="h-8 px-2.5 sm:px-3 text-xs sm:text-sm">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild className="h-8 px-2.5 sm:px-3 text-xs sm:text-sm">
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Dedicated Mobile Navigation Sub-Bar */}
        <div className="sm:hidden border-t bg-muted/20 px-3 py-1.5 flex items-center justify-around gap-2 text-xs font-medium">
          <Link
            href="/stories"
            className={`px-3 py-1 rounded-full transition-colors ${
              isStoriesActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Stories
          </Link>
          <Link
            href="/privacy"
            className={`px-3 py-1 rounded-full transition-colors ${
              isPrivacyActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Privacy
          </Link>
          <Link
            href="/contact"
            className={`px-3 py-1 rounded-full transition-colors ${
              isContactActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-foreground/70 hover:text-foreground hover:bg-muted/40'
            }`}
          >
            Contact
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full min-w-0 max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}
