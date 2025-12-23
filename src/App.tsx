import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { Capacitor } from "@capacitor/core";
import { StatusBar } from "@capacitor/status-bar";
import { AuthProvider } from "@/hooks/useAuth";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import Home from "./pages/Home";
import ListingDetail from "./pages/ListingDetail";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Favorites from "./pages/Favorites";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import SellerProfile from "./pages/SellerProfile";
import Featured from "./pages/Featured";
import Chat from "./pages/Chat";
import MyListings from "./pages/MyListings";
import ResetPassword from "./pages/ResetPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import NotFound from "./pages/NotFound";
import MapView from "./pages/MapView";

// Lazy load heavy pages
const PublishListing = lazy(() => import("./pages/PublishListing"));
const EditListing = lazy(() => import("./pages/EditListing"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const ModerationQueue = lazy(() => import("./pages/admin/ModerationQueue"));
const ReportsManagement = lazy(() => import("./pages/admin/ReportsManagement"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const ModerationHistory = lazy(() => import("./pages/admin/ModerationHistory"));
const SponsoredManagement = lazy(() => import("./pages/admin/SponsoredManagement"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    // Fix for native iOS/Android where the status bar may overlay the webview,
    // causing headers to appear "cut off" even with env(safe-area-inset-top).
    if (!Capacitor.isNativePlatform()) return;

    (async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch {
        // ignore
      }
    })();
  }, []);

  return (
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LocationProvider>
              <FavoritesProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <PWAUpdatePrompt />
                  <PWAInstallPrompt />
                  <BrowserRouter>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/listing/:id" element={<ListingDetail />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/profile/:username" element={<PublicProfile />} />
                        <Route path="/publish" element={<PublishListing />} />
                        <Route path="/listing/:id/edit" element={<EditListing />} />
                        <Route path="/favorites" element={<Favorites />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/map" element={<MapView />} />
                        <Route path="/seller/:id" element={<SellerProfile />} />
                        <Route path="/featured" element={<Featured />} />
                        <Route path="/chat/:conversationId" element={<Chat />} />
                        <Route path="/my-listings" element={<MyListings />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/terms-conditions" element={<TermsConditions />} />
                        {/* Admin Routes */}
                        <Route path="/admin" element={<AdminOverview />} />
                        <Route path="/admin/moderation" element={<ModerationQueue />} />
                        <Route path="/admin/reports" element={<ReportsManagement />} />
                        <Route path="/admin/sponsored" element={<SponsoredManagement />} />
                        <Route path="/admin/notifications" element={<AdminNotifications />} />
                        <Route path="/admin/users" element={<UsersManagement />} />
                        <Route path="/admin/history" element={<ModerationHistory />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
                </TooltipProvider>
              </FavoritesProvider>
            </LocationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

