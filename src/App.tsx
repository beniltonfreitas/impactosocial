import React, { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
const News = lazy(() => import("./pages/News"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Search = lazy(() => import("./pages/Search"));
const RedePcd = lazy(() => import("./pages/RedePcd"));
const DesafioSocial = lazy(() => import("./pages/DesafioSocial"));
const DesafioSocialGrupo = lazy(() => import("./pages/DesafioSocialGrupo"));

// Rede PcD Module Pages
const PcdPlus = lazy(() => import("./pages/rede-pcd/PcdPlus"));
const PcdDireitos = lazy(() => import("./pages/rede-pcd/PcdDireitos"));
const PcdAlerta = lazy(() => import("./pages/rede-pcd/PcdAlerta"));
const PcdPlay = lazy(() => import("./pages/rede-pcd/PcdPlay"));
const PcdEsportes = lazy(() => import("./pages/rede-pcd/PcdEsportes"));
const Cddpcd = lazy(() => import("./pages/rede-pcd/Cddpcd"));
const PcdShop = lazy(() => import("./pages/rede-pcd/PcdShop"));
const PcdVitrine = lazy(() => import("./pages/rede-pcd/PcdVitrine"));
const PcdBlog = lazy(() => import("./pages/rede-pcd/PcdBlog"));
const PcdAcademy = lazy(() => import("./pages/rede-pcd/PcdAcademy"));
const PcdClube = lazy(() => import("./pages/rede-pcd/PcdClube"));
const PcdRededobem = lazy(() => import("./pages/rede-pcd/PcdRededobem"));

function Analytics() {
  const location = useLocation();

  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (measurementId) {
      initGA(measurementId);
    } else {
      console.info('[Analytics] Google Analytics not configured. Set VITE_GA_MEASUREMENT_ID to enable tracking.');
    }
  }, []);

  useEffect(() => {
    if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
      trackPageView(location.pathname + location.search);
    }
  }, [location]);

  return null;
}

const App = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Analytics />
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/noticias" element={<News />} />
              <Route path="/news/:slug" element={<Article />} />
              <Route path="/busca" element={<Search />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/contato" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacidade" element={<Privacy />} />
              <Route path="/termos" element={<Terms />} />
              <Route path="/assinaturas" element={<Pricing />} />
              <Route path="/pagamento/sucesso" element={<PaymentSuccess />} />
              <Route path="/pagamento/cancelado" element={<PaymentCancel />} />
              <Route path="/rede-pcd" element={<RedePcd />} />
              <Route path="/rede-pcd/feed" element={<PcdPlus />} />
              <Route path="/rede-pcd/direitos" element={<PcdDireitos />} />
              <Route path="/rede-pcd/alerta" element={<PcdAlerta />} />
              <Route path="/rede-pcd/play" element={<PcdPlay />} />
              <Route path="/rede-pcd/esportes" element={<PcdEsportes />} />
              <Route path="/rede-pcd/conselhos" element={<Cddpcd />} />
              <Route path="/rede-pcd/shop" element={<PcdShop />} />
              <Route path="/rede-pcd/vitrine" element={<PcdVitrine />} />
              <Route path="/rede-pcd/blog" element={<PcdBlog />} />
              <Route path="/rede-pcd/academy" element={<PcdAcademy />} />
              <Route path="/rede-pcd/clube" element={<PcdClube />} />
              <Route path="/rede-pcd/rede-do-bem" element={<PcdRededobem />} />
              <Route
                path="/desafio-social"
                element={
                  <ProtectedRoute>
                    <DesafioSocial />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/desafio-social/:grupo"
                element={
                  <ProtectedRoute>
                    <DesafioSocialGrupo />
                  </ProtectedRoute>
                }
              />
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
    </HelmetProvider>
  </QueryClientProvider>
  );
};

export default App;
