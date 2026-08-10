import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useGetMe } from '@workspace/api-client-react';
import { Newspaper, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ReaderLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: me } = useGetMe();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="flex items-center gap-6">
            <Link href={me?.user?.role === 'admin' ? '/admin' : '/stories'} className="flex items-center gap-3">
              <img src="/logo.svg" alt="Scrollbrief" className="h-8 w-auto object-contain" />
            </Link>
            
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link href="/stories" className={`transition-colors hover:text-foreground/80 ${location.startsWith('/stories') || location.startsWith('/labels') ? 'text-foreground' : 'text-foreground/60'}`}>
                Stories
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {me?.user ? (
              <Link href="/account">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Account</span>
                </Button>
              </Link>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
        {children}
      </main>
    </div>
  );
}
