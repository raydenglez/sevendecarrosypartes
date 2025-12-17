import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import Home from "./pages/Home";
import ListingDetail from "./pages/ListingDetail";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Messages from "./pages/Messages";
import Auth from "./pages/Auth";
import SellerProfile from "./pages/SellerProfile";
import Featured from "./pages/Featured";
import Chat from "./pages/Chat";
import MyListings from "./pages/MyListings";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy load heavy pages
const MapView = lazy(() => import("./pages/MapView"));
const PublishListing = lazy(() => import("./pages/PublishListing"));
const EditListing = lazy(() => import("./pages/EditListing"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FavoritesProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/profile" element={<Profile />} />
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </TooltipProvider>
      </FavoritesProvider>
    </AuthProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
