import { Shield, Mail, Instagram, ExternalLink, Calendar, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 space-y-8">
      {/* Header Banner */}
      <div className="space-y-3 border-b pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 px-2.5 py-1 text-xs border-primary/40 text-primary">
            <Shield className="h-3.5 w-3.5" />
            Legal & Compliance
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Last Updated: August 18, 2026
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          ScrollBrief (“ScrollBrief,” “we,” “our,” or “us”) respects the privacy of its readers and users. This Privacy Policy explains what information we collect, how we use and protect it, when it may be shared, and the choices and rights available to you under applicable data-protection laws including India's Digital Personal Data Protection framework.
        </p>
      </div>

      {/* Content Sections */}
      <div className="space-y-10 text-sm sm:text-base leading-relaxed text-foreground/90 font-normal">
        {/* Section 1 */}
        <section id="section-1" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
            1. About ScrollBrief
          </h2>
          <p className="text-muted-foreground">
            ScrollBrief is a digital news and information platform that provides concise news summaries, headlines, informational content, and references or links to original and third-party sources.
          </p>
          <p className="text-muted-foreground">
            Our goal is to make important news easier to understand while enabling readers to access original reporting and additional sources when they want more information.
          </p>
        </section>

        {/* Section 2 */}
        <section id="section-2" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
            2. Information We Collect
          </h2>
          <p className="text-muted-foreground">
            The information we collect depends on how you use ScrollBrief.
          </p>

          <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-primary/20">
            <h3 className="text-lg font-semibold text-foreground">2.1 Information You Provide</h3>
            <p className="text-muted-foreground">
              When you contact ScrollBrief, create an account, participate in interactive features, or otherwise communicate with us, we may collect information such as:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
              <li>Name or display name;</li>
              <li>Email address;</li>
              <li>Information submitted through contact forms;</li>
              <li>Feedback, correction requests, or support inquiries;</li>
              <li>Comments and other user-submitted content; and</li>
              <li>Other information you voluntarily provide.</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground pt-3">2.2 Account Information</h3>
            <p className="text-muted-foreground">
              If user accounts are available, we process information necessary to create, authenticate, secure, and maintain your account, including email address, username, salted/hashed credentials, session tokens, and account preferences. Passwords are never stored in plain text.
            </p>
            <p className="text-muted-foreground">
              If you choose to sign in using a third-party authentication provider such as Google, we may receive limited account information authorized by you, such as your name, email address, profile identifier, or profile image.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-3">2.3 Reader Activity and Engagement</h3>
            <p className="text-muted-foreground">
              Where ScrollBrief provides reader-engagement features, we store information relating to your interaction with the service, including saved posts, reactions, comments, edits, and moderation records. If an account is deleted, public contributions may be attributed to a generic designation such as <strong className="text-foreground">“Deleted user”</strong> to preserve discussion integrity.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-3">2.4 Comments, Reports and Moderation</h3>
            <p className="text-muted-foreground">
              When users participate in community features, we process submitted content together with timestamps, moderation status, abuse-prevention signals, and reports to enforce community standards and maintain platform safety.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-3">2.5 Information Collected Automatically</h3>
            <p className="text-muted-foreground">
              When you access ScrollBrief, technical information may be collected automatically by our servers, including IP address, browser type and version, operating system, referring pages, approximate location derived from IP, session tokens, and security rate-limiting logs.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section id="section-3" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
            3. Cookies and Similar Technologies
          </h2>
          <p className="text-muted-foreground">
            ScrollBrief and service providers working with us may use cookies, web beacons, local storage (such as your theme preference), and similar technologies for authentication, security, fraud prevention, analytics, and maintaining website functionality.
          </p>
          <p className="text-muted-foreground">
            You can control cookies through your browser settings. Disabling essential cookies may affect website functionality.
          </p>
        </section>

        {/* Section 4 */}
        <section id="section-4" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
            4. How We Use Information
          </h2>
          <p className="text-muted-foreground">
            Information collected through ScrollBrief is used to operate and secure the platform, authenticate users, deliver news feeds and saved articles, moderate community comments, respond to inquiries, investigate disputes, maintain high availability, and comply with legal obligations.
          </p>
        </section>

        {/* Section 5 */}
        <section id="section-5" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
            5. News Content and External Sources
          </h2>
          <p className="text-muted-foreground">
            ScrollBrief publishes summaries and references to news obtained from external sources. Articles contain links to primary sources, publishers, government portals, and third-party media. When you follow an external link, you leave ScrollBrief, and that third party's privacy policies and terms apply.
          </p>
        </section>

        {/* Section 6 */}
        <section id="section-6" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
            6. Third-Party Service Providers
          </h2>
          <p className="text-muted-foreground">
            We use trusted third-party providers for hosting infrastructure, DNS and security (e.g. Cloudflare Turnstile), authentication, database hosting, email delivery (SMTP), and monitoring. Processing is limited to what is reasonably necessary for operating ScrollBrief.
          </p>
        </section>

        {/* Section 7 */}
        <section id="section-7" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
            7. Advertising and Google AdSense
          </h2>
          <p className="text-muted-foreground">
            ScrollBrief may display advertisements through partners such as Google AdSense. Third-party vendors may use cookies or similar technologies to serve advertisements based on previous visits. Users may manage personalized advertising through Google's advertising settings.
          </p>
        </section>

        {/* Section 8 */}
        <section id="section-8" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
            8. Sharing and Disclosure
          </h2>
          <p className="text-muted-foreground">
            We do not sell users' personal data for monetary consideration. Information may be shared with operational service providers, where required by court order or law enforcement, or to protect the safety and integrity of ScrollBrief and its readers.
          </p>
        </section>

        {/* Section 9 */}
        <section id="section-9" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
            9. Data Retention & Security
          </h2>
          <p className="text-muted-foreground">
            We retain personal information only for as long as necessary to provide services and fulfill legal requirements. We employ industry-standard organizational and technical safeguards, including HTTPS encryption, scrypt password hashing, session tokens, rate limiting, and database access controls.
          </p>
        </section>

        {/* Section 10 */}
        <section id="section-10" className="space-y-3 scroll-mt-20">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
            10. India — Digital Personal Data Protection
          </h2>
          <p className="text-muted-foreground">
            Where applicable, ScrollBrief processes personal data in accordance with India's data-protection framework, including the <strong className="text-foreground">Digital Personal Data Protection Act, 2023</strong>. Users in India may exercise rights regarding access, correction, erasure, consent withdrawal, and grievances.
          </p>
        </section>

        {/* Section 18 - Contact Section */}
        <section id="contact" className="space-y-4 scroll-mt-20 pt-6 border-t">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
            11. Contact & Privacy Requests
          </h2>
          <p className="text-muted-foreground">
            Questions, concerns, grievances, or requests regarding privacy and personal information can be submitted directly to our editorial and privacy desk:
          </p>

          <div className="p-4 sm:p-6 rounded-xl border bg-muted/40 dark:bg-zinc-900/60 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email Contact</p>
                <a
                  href="mailto:admin@scrollbrief.in"
                  className="text-base font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  admin@scrollbrief.in
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Instagram className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Instagram</p>
                <a
                  href="https://www.instagram.com/scrollbrief.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  @scrollbrief.in
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <p className="text-xs text-muted-foreground pt-2 border-t">
              Website: <strong className="text-foreground">scrollbrief.in</strong> • Official Telegram: <a href="https://t.me/scrollbrief_in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@scrollbrief.in</a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
