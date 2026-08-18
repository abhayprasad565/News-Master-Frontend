import { Link } from "wouter";
import { Logo } from "@/components/logo";
import { Mail, Instagram, Send, Shield, ExternalLink, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-muted/30 dark:bg-zinc-950/60 transition-colors mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3 sm:col-span-2">
            <Link href="/stories" className="inline-block">
              <Logo className="h-7 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              News, briefly. Verified factual headlines and concise summaries with original source attribution.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="mailto:admin@scrollbrief.in"
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                title="Email us: admin@scrollbrief.in"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/scrollbrief.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                title="Instagram: @scrollbrief.in"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://t.me/scrollbrief_in"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors"
                title="Telegram: @scrollbrief.in"
                aria-label="Telegram"
              >
                <Send className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/stories" className="hover:text-foreground transition-colors">
                  Latest Stories
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Reader Sign in
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Legal & Support
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors inline-flex items-center gap-1.5 font-medium">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors inline-flex items-center gap-1.5 font-medium">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  Contact Us
                </Link>
              </li>
              <li>
                <a
                  href="mailto:admin@scrollbrief.in"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1 text-xs"
                >
                  admin@scrollbrief.in
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & attribution */}
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {currentYear} ScrollBrief (scrollbrief.in). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:underline">
              Contact
            </Link>
            <span>•</span>
            <a
              href="https://www.instagram.com/scrollbrief.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
