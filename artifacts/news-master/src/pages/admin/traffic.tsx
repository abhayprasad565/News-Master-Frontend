import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Eye,
  BookOpen,
  Compass,
  Smartphone,
  Laptop,
  Tablet,
  Globe,
  TrendingUp,
  ExternalLink,
  Info,
  Calendar,
  Layers,
} from "lucide-react";
import { Link } from "wouter";

interface TrafficSummary {
  pageviews: number;
  uniqueVisitorDays: number;
  storyViews: number;
  topStory: { id: string; title: string; views: number; slug?: string | null } | null;
  topReferrer: string;
  timeSeries: Array<{
    date: string;
    pageviews: number;
    uniqueVisitorDays: number;
    storyViews: number;
  }>;
  topPages: Array<{
    path: string;
    pageviews: number;
    uniqueVisitors: number;
    title?: string | null;
  }>;
  referrers: Array<{
    source: string;
    visits: number;
    percentage: number;
  }>;
  devices: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  countries: Array<{
    country: string;
    visits: number;
    percentage: number;
  }>;
}

export default function AdminTraffic() {
  const [range, setRange] = useState<"today" | "7d" | "30d">("7d");

  const { data, isLoading, error } = useQuery<TrafficSummary>({
    queryKey: ["admin-traffic", range],
    queryFn: () => apiFetch<TrafficSummary>(`/api/admin/analytics/traffic?range=${range}`),
    refetchInterval: 30000, // Refresh every 30s
  });

  const maxPageviews = data?.timeSeries.length
    ? Math.max(...data.timeSeries.map((d) => d.pageviews), 1)
    : 1;

  const deviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "mobile":
        return <Smartphone className="h-4 w-4 text-emerald-500" />;
      case "tablet":
        return <Tablet className="h-4 w-4 text-amber-500" />;
      default:
        return <Laptop className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight">Traffic Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Privacy-preserving audience measurement & qualified story performance.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg border border-border/60 self-start sm:self-auto">
          <Button
            size="sm"
            variant={range === "today" ? "default" : "ghost"}
            className="text-xs h-8 px-3"
            onClick={() => setRange("today")}
          >
            Today
          </Button>
          <Button
            size="sm"
            variant={range === "7d" ? "default" : "ghost"}
            className="text-xs h-8 px-3"
            onClick={() => setRange("7d")}
          >
            Last 7 Days
          </Button>
          <Button
            size="sm"
            variant={range === "30d" ? "default" : "ghost"}
            className="text-xs h-8 px-3"
            onClick={() => setRange("30d")}
          >
            Last 30 Days
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pageviews</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold font-mono">
                {data?.pageviews?.toLocaleString() ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Reader page views across site</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              Unique Visitor-Days
              <span title="Sum of daily unique pseudonymous visitors">
                <Info className="h-3.5 w-3.5 text-muted-foreground/70" />
              </span>
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold font-mono">
                {data?.uniqueVisitorDays?.toLocaleString() ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Daily unique readers (deduped)</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Qualified Story Views</CardTitle>
            <BookOpen className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl sm:text-3xl font-bold font-mono">
                {data?.storyViews?.toLocaleString() ?? 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Active reads (visible &gt; 3s)</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Traffic Source</CardTitle>
            <Compass className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold truncate">
                {data?.topReferrer || "Direct"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Leading acquisition channel</p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Traffic & Readership Trend
              </CardTitle>
              <CardDescription>Daily pageviews and unique visitor-days over selected window</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-primary inline-block" /> Pageviews
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" /> Unique Visitors
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : !data?.timeSeries?.length ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              No traffic recorded in this range.
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="h-48 flex items-end gap-2 sm:gap-3 w-full border-b border-border/50 pb-2">
                {data.timeSeries.map((item, idx) => {
                  const pvHeight = Math.max(6, Math.round((item.pageviews / maxPageviews) * 100));
                  const uvHeight = Math.max(4, Math.round((item.uniqueVisitorDays / maxPageviews) * 100));
                  const formattedDate = new Date(item.date).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <div
                      key={item.date || idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-popover text-popover-foreground text-[11px] p-1.5 rounded shadow-md border border-border pointer-events-none whitespace-nowrap">
                        <span className="font-semibold">{item.date}</span>
                        <span>{item.pageviews} views • {item.uniqueVisitorDays} uniques</span>
                      </div>

                      <div className="w-full flex items-end justify-center gap-1 h-full">
                        <div
                          style={{ height: `${pvHeight}%` }}
                          className="w-full max-w-[14px] bg-primary/90 hover:bg-primary rounded-t transition-all"
                        />
                        <div
                          style={{ height: `${uvHeight}%` }}
                          className="w-full max-w-[14px] bg-emerald-500/80 hover:bg-emerald-500 rounded-t transition-all"
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-2 truncate w-full text-center hidden sm:block">
                        {formattedDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breakdown Grids */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Top Pages / Stories */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Top Visited Stories & Pages
            </CardTitle>
            <CardDescription>Most popular reader content in this period</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !data?.topPages?.length ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No visits recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border/50 text-muted-foreground text-xs">
                      <th className="pb-2 font-medium">Page / Story</th>
                      <th className="pb-2 font-medium text-right">Views</th>
                      <th className="pb-2 font-medium text-right">Uniques</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {data.topPages.map((page, idx) => (
                      <tr key={page.path || idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 pr-2 max-w-[280px] sm:max-w-md truncate">
                          <Link
                            href={page.path}
                            className="font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5"
                          >
                            <span className="truncate">{page.title || page.path}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                          </Link>
                          {page.title && (
                            <span className="block text-[11px] text-muted-foreground font-mono truncate">
                              {page.path}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold">
                          {page.pageviews.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-mono text-muted-foreground">
                          {page.uniqueVisitors.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Traffic Sources / Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Compass className="h-5 w-5 text-purple-500" /> Referrer Sources
            </CardTitle>
            <CardDescription>Where your readers arrive from</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : !data?.referrers?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No referrer data yet.</p>
            ) : (
              <div className="space-y-3">
                {data.referrers.map((ref, idx) => (
                  <div key={ref.source || idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{ref.source}</span>
                      <span className="text-muted-foreground font-mono">
                        {ref.visits.toLocaleString()} ({ref.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${ref.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device & Country Breakdown */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-emerald-500" /> Device Breakdown
            </CardTitle>
            <CardDescription>Reader devices and platforms</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !data?.devices?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No device data.</p>
            ) : (
              <div className="space-y-3">
                {data.devices.map((d, idx) => (
                  <div key={d.device || idx} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                    <span className="flex items-center gap-2 capitalize">
                      {deviceIcon(d.device)} {d.device}
                    </span>
                    <span className="font-mono font-medium">
                      {d.count.toLocaleString()} ({d.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Country Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" /> Geographic Audience
            </CardTitle>
            <CardDescription>Top visitor countries (Cloudflare header)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : !data?.countries?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No geographic data.</p>
            ) : (
              <div className="space-y-2.5">
                {data.countries.map((c, idx) => (
                  <div key={c.country || idx} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs uppercase px-1.5 py-0.5">
                        {c.country}
                      </Badge>
                    </span>
                    <span className="font-mono font-medium">
                      {c.visits.toLocaleString()} ({c.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
