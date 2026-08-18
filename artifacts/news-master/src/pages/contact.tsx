import { useState } from "react";
import { Mail, Instagram, Send, Copy, Check, ExternalLink, ShieldCheck, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function ContactUs() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("admin@scrollbrief.in");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-8">
      {/* Header Banner */}
      <div className="space-y-3 border-b pb-6">
        <Badge variant="outline" className="gap-1 px-2.5 py-1 text-xs border-primary/40 text-primary">
          <MessageSquare className="h-3.5 w-3.5" />
          Get In Touch
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
          Contact ScrollBrief
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-2xl">
          Have a news tip, correction request, feedback, or business inquiry? Reach out to our editorial team directly through email or our official social channels.
        </p>
      </div>

      {/* Primary Contact Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Email Card */}
        <Card className="border shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Mail className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-serif">Email Us</CardTitle>
            <CardDescription>
              For general inquiries, news corrections, privacy requests, and partnerships.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/60 dark:bg-zinc-900 rounded-lg flex items-center justify-between gap-2 border">
              <span className="font-mono text-sm font-semibold text-foreground select-all">
                admin@scrollbrief.in
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyEmail}
                className="h-8 px-2.5 text-xs gap-1"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Button asChild className="w-full gap-2">
              <a href="mailto:admin@scrollbrief.in">
                <Mail className="h-4 w-4" />
                Open Email Client
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Instagram Card */}
        <Card className="border shadow-xs hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-2">
              <Instagram className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-serif">Instagram</CardTitle>
            <CardDescription>
              Follow our daily news graphics, reels, and send us direct messages.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/60 dark:bg-zinc-900 rounded-lg flex items-center justify-between gap-2 border">
              <span className="font-mono text-sm font-semibold text-foreground">
                @scrollbrief.in
              </span>
              <span className="text-xs text-muted-foreground">Official Page</span>
            </div>
            <Button variant="outline" asChild className="w-full gap-2 border-pink-500/30 hover:bg-pink-50 dark:hover:bg-pink-950/20">
              <a
                href="https://www.instagram.com/scrollbrief.in/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                Visit @scrollbrief.in
                <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-70" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Channels & Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Telegram Card */}
        <div className="p-4 rounded-xl border bg-muted/30 dark:bg-zinc-900/40 space-y-2">
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <Send className="h-4 w-4" />
            Telegram Channel
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Get instant breaking news alerts and real-time summaries directly on Telegram.
          </p>
          <a
            href="https://t.me/scrollbrief_in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 pt-1"
          >
            @scrollbrief.in
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Correction Policy */}
        <div className="p-4 rounded-xl border bg-muted/30 dark:bg-zinc-900/40 space-y-2">
          <div className="flex items-center gap-2 text-foreground font-medium text-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Fact Corrections
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If you identify a factual error, please include the story ID/URL and primary source reference when emailing us.
          </p>
        </div>

        {/* Privacy & Legal */}
        <div className="p-4 rounded-xl border bg-muted/30 dark:bg-zinc-900/40 space-y-2">
          <div className="flex items-center gap-2 text-foreground font-medium text-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Privacy Inquiries
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            To submit data-protection or account requests, review our guidelines.
          </p>
          <Link
            href="/privacy"
            className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 pt-1"
          >
            Read Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
