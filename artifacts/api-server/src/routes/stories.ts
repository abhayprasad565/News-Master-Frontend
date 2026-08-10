import { Router, type IRouter } from "express";
import { requireSession } from "../middlewares/auth";

const router: IRouter = Router();

interface StoryLabel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  visibility: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PlatformLink {
  platform: string;
  destination: string | null;
  remoteId: string | null;
}

interface Story {
  id: string;
  eventId: string | null;
  kind: string;
  title: string | null;
  text: string;
  labels: StoryLabel[];
  publishedAt: string | null;
  media: Array<{ url: string; type: string | null }>;
  platformLinks: PlatformLink[];
  correctionOfPostId: string | null;
}

const SAMPLE_LABELS: StoryLabel[] = [
  { id: "label-1", name: "Breaking News", slug: "breaking-news", description: "Urgent developing stories", color: "#dc2626", visibility: "PUBLIC", archivedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "label-2", name: "Politics", slug: "politics", description: "Government and policy", color: "#2563eb", visibility: "PUBLIC", archivedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "label-3", name: "Technology", slug: "technology", description: "Tech and science news", color: "#7c3aed", visibility: "PUBLIC", archivedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "label-4", name: "Business", slug: "business", description: "Economy and markets", color: "#059669", visibility: "PUBLIC", archivedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const SAMPLE_STORIES: Story[] = [
  {
    id: "story-1", eventId: "event-1", kind: "ORIGINAL", title: "Global Markets Rally After Fed Decision",
    text: "Stock markets around the world surged on Wednesday after the Federal Reserve signaled a pause in interest rate hikes, with the S&P 500 gaining 2.3% in afternoon trading. The decision came after months of rising inflation pressures and concerns about a potential recession.",
    labels: [SAMPLE_LABELS[1], SAMPLE_LABELS[3]], publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    media: [], platformLinks: [{ platform: "x", destination: "main-account", remoteId: "tweet-123" }], correctionOfPostId: null,
  },
  {
    id: "story-2", eventId: "event-2", kind: "ORIGINAL", title: "New Climate Agreement Reached at UN Summit",
    text: "Representatives from 140 nations signed a landmark climate agreement late Tuesday, committing to a 45% reduction in carbon emissions by 2035. The deal, which was years in the making, includes binding targets and a $500 billion fund to assist developing nations with the transition to clean energy.",
    labels: [SAMPLE_LABELS[0]], publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    media: [], platformLinks: [{ platform: "instagram", destination: "main-account", remoteId: "ig-456" }, { platform: "x", destination: "main-account", remoteId: "tweet-456" }], correctionOfPostId: null,
  },
  {
    id: "story-3", eventId: "event-3", kind: "CUSTOM", title: "Tech Giant Reports Record Earnings",
    text: "In a surprise earnings call, the technology company reported quarterly revenue of $98 billion, beating analyst estimates by 12%. The results were driven by strong performance in cloud services and artificial intelligence products.",
    labels: [SAMPLE_LABELS[2], SAMPLE_LABELS[3]], publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    media: [], platformLinks: [], correctionOfPostId: null,
  },
  {
    id: "story-4", eventId: null, kind: "CORRECTION", title: null,
    text: "Correction: An earlier version of this story misstated the number of nations that signed the climate agreement. The correct figure is 140 nations, not 120 as previously reported.",
    labels: [SAMPLE_LABELS[0]], publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    media: [], platformLinks: [], correctionOfPostId: "story-2",
  },
];

router.get("/stories", requireSession, async (req, res): Promise<void> => {
  const { q, label, platform } = req.query as Record<string, string | undefined>;
  let items = [...SAMPLE_STORIES];

  if (q) {
    const lq = q.toLowerCase();
    items = items.filter(s => s.title?.toLowerCase().includes(lq) || s.text.toLowerCase().includes(lq));
  }
  if (label) {
    items = items.filter(s => s.labels.some(l => l.slug === label));
  }
  if (platform) {
    items = items.filter(s => s.platformLinks.some(pl => pl.platform === platform));
  }

  res.json({ items, nextCursor: null });
});

router.get("/stories/:storyId", requireSession, async (req, res): Promise<void> => {
  const { storyId } = req.params as { storyId: string };
  const story = SAMPLE_STORIES.find(s => s.id === storyId);
  if (!story) {
    res.status(404).json({ error: "not_found", message: "Story not found", requestId: req.id });
    return;
  }
  res.json(story);
});

router.get("/labels", requireSession, async (_req, res): Promise<void> => {
  res.json({ items: SAMPLE_LABELS });
});

export default router;
