import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ReaderLayout } from "@/components/layout/ReaderLayout";
import { ThemeProvider } from "@/components/theme-provider";
import { Route, Switch, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Register from "@/pages/register";
import VerifyEmail from "@/pages/verify-email";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import AdminInvitationAccept from "@/pages/admin-invitation-accept";
import Account from "@/pages/account";
import StoriesList from "@/pages/reader/stories";
import StoryDetail from "@/pages/reader/story-detail";
import PrivacyPolicy from "@/pages/privacy";
import ContactUs from "@/pages/contact";
import MarriageInvitation from "@/pages/marriage-invitation";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminReviewQueue from "@/pages/admin/review-queue";
import AdminPostList from "@/pages/admin/post-list";
import AdminPostDetail from "@/pages/admin/post-detail";
import AdminCreatePost from "@/pages/admin/post-create";
import AdminEditPost from "@/pages/admin/post-edit";
import AdminPublicationList from "@/pages/admin/publication-list";
import AdminPublicationDetail from "@/pages/admin/publication-detail";
import AdminDeliveryList from "@/pages/admin/delivery-list";
import AdminDeliveryDetail from "@/pages/admin/delivery-detail";
import AdminLabelList from "@/pages/admin/label-list";
import AdminInstagram from "@/pages/admin/instagram";
import AdminX from "@/pages/admin/x";
import AdminPlatformPostDetail from "@/pages/admin/platform-post-detail";
import AdminSettings from "@/pages/admin/settings";
import AdminAuditTimeline from "@/pages/admin/audit-timeline";
import AdminRanking from "@/pages/admin/ranking";
import AdminRankingDetail from "@/pages/admin/ranking-detail";
import AdminTopicRules from "@/pages/admin/topic-rules";
import AdminUrgent from "@/pages/admin/urgent";
import AdminAutopilot from "@/pages/admin/autopilot";
import AdminAudioLibrary from "@/pages/admin/audio-library";
import AdminPostVideo from "@/pages/admin/post-video";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function RootRedirect() {
  return <Redirect to="/stories" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Switch>
              <Route path="/marriage-invitation" component={MarriageInvitation} />
              <Route path="/login" component={Login} />
              <Route path="/admin/login" component={Login} />
              <Route path="/register" component={Register} />
              <Route path="/verify-email" component={VerifyEmail} />
              <Route path="/forgot-password" component={ForgotPassword} />
              <Route path="/reset-password" component={ResetPassword} />
              <Route
                path="/admin/invitations/accept"
                component={AdminInvitationAccept}
              />

              {/* Reader Routes */}
              <Route path="/stories/:id">
                <ReaderLayout>
                  <StoryDetail />
                </ReaderLayout>
              </Route>
              <Route path="/stories">
                <ReaderLayout>
                  <StoriesList />
                </ReaderLayout>
              </Route>

              <Route path="/labels/:slug">
                <ReaderLayout>
                  <StoriesList />
                </ReaderLayout>
              </Route>

              <Route path="/privacy">
                <ReaderLayout>
                  <PrivacyPolicy />
                </ReaderLayout>
              </Route>

              <Route path="/contact">
                <ReaderLayout>
                  <ContactUs />
                </ReaderLayout>
              </Route>

              <Route path="/account">
                <ProtectedRoute>
                  <ReaderLayout>
                    <Account />
                  </ReaderLayout>
                </ProtectedRoute>
              </Route>

              <Route path="/" component={RootRedirect} />

              {/* Admin Routes */}
              <Route path="/admin/ranking/:id">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminRankingDetail />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/ranking">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminRanking />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/topic-rules">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminTopicRules />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/urgent">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminUrgent />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/autopilot">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminAutopilot />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/audio">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminAudioLibrary />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/review">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminReviewQueue />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/posts/new">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminCreatePost />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/posts/:id/edit">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminEditPost />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/posts/:id/video">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminPostVideo />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/posts/:id">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminPostDetail />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/posts">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminPostList />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/publications/:id">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminPublicationDetail />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/publications">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminPublicationList />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/deliveries/:id">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminDeliveryDetail />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/deliveries">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminDeliveryList />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/labels">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminLabelList />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/platforms/instagram">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminInstagram />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/platforms/x">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminX />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/platform-posts/:id">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminPlatformPostDetail />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/audit/:type/:id">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminAuditTimeline />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin/settings">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminSettings />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>
              <Route path="/admin">
                <ProtectedRoute requireRole="admin">
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              </Route>

              <Route component={NotFound} />
            </Switch>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
