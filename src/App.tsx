import React, { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { HelmetProvider } from "react-helmet-async";
import { initGA, trackPageView } from "@/lib/analytics";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Article from "./pages/Article";
import NotFound from "./pages/NotFound";

// Lazy load pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminArticles = lazy(() => import("./pages/AdminArticles"));
const AdminBulkImport = lazy(() => import("./pages/AdminBulkImport"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Moderation = lazy(() => import("./pages/Moderation"));

const queryClient = new QueryClient();

function Analytics() {
  const location = useLocation();

  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (measurementId) {
      initGA(measurementId);
    }
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Analytics />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/news/:slug" element={<Article />} />
                <Route path="/sobre" element={<About />} />
                <Route path="/contato" element={<Contact />} />
                <Route path="/privacidade" element={<Privacy />} />
                <Route path="/termos" element={<Terms />} />
                <Route path="/assinaturas" element={<Pricing />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/articles"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminArticles />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/bulk-import"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminBulkImport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/moderation"
                  element={
                    <ProtectedRoute requiredRole="moderator">
                      <Moderation />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
