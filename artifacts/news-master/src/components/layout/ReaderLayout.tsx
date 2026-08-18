import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useGetMe } from '@workspace/api-client-react';
import { Newspaper, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';
import { Footer } from '@/components/layout/Footer';

export function ReaderLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: me } = useGetMe();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background w-full overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6 max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href={me?.user?.role === 'admin' ? '/admin' : '/stories'} className="flex items-center gap-2">
              <Logo className="h-7 sm:h-8 w-auto" />
            </Link>
            
            <nav className="flex items-center gap-3 text-xs sm:text-sm font-medium">
              <Link href="/stories" className={`transition-colors hover:text-foreground/80 ${location.startsWith('/stories') || location.startsWith('/labels') ? 'text-foreground font-semibold' : 'text-foreground/60'}`}>
                Stories
              </Link>
              <Link href="/privacy" className={`transition-colors hover:text-foreground/80 ${location === '/privacy' ? 'text-foreground font-semibold' : 'text-foreground/60'}`}>
                Privacy
              </Link>
              <Link href="/contact" className={`transition-colors hover:text-foreground/80 ${location === '/contact' ? 'text-foreground font-semibold' : 'text-foreground/60'}`}>
                Contact
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
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
      </header>

      <main className="flex-1 w-full min-w-0 max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}
