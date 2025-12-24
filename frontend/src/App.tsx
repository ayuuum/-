import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './store/AuthContext';
import { AuthPage } from './components/AuthPage';
import { DashboardLayout } from './components/DashboardLayout';
import { Generator } from './components/Generator';
import { Gallery } from './components/Gallery';
import { PricingPage } from './components/PricingPage';
import { Collections } from './components/Collections';
import { ProfileSettings } from './components/ProfileSettings';
import { ToastContainer } from './components/Toast';
import { useToast } from './hooks/useToast';

const queryClient = new QueryClient();

type Page = 'home' | 'pricing' | 'collections' | 'profile';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    // Handle browser navigation
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/pricing') {
        setCurrentPage('pricing');
      } else if (path === '/collections') {
        setCurrentPage('collections');
      } else if (path === '/profile') {
        setCurrentPage('profile');
      } else {
        setCurrentPage('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState();

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (page: Page) => {
    setCurrentPage(page);
    const path = page === 'pricing' ? '/pricing' 
      : page === 'collections' ? '/collections'
      : page === 'profile' ? '/profile'
      : '/';
    window.history.pushState({}, '', path);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (currentPage === 'pricing') {
    return (
      <DashboardLayout onNavigate={navigate}>
        <PricingPage />
      </DashboardLayout>
    );
  }

  if (currentPage === 'collections') {
    return (
      <DashboardLayout onNavigate={navigate}>
        <div className="space-y-10">
          <Collections />
        </div>
      </DashboardLayout>
    );
  }

  if (currentPage === 'profile') {
    return (
      <DashboardLayout onNavigate={navigate}>
        <div className="space-y-10">
          <ProfileSettings />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <DashboardLayout onNavigate={navigate}>
        <div className="space-y-10">
          <header className="space-y-2">
            <h1 className="text-3xl font-outfit font-semibold text-slate-900">AI Visual Operations</h1>
            <p className="text-slate-600 text-sm">Transform your property photos into high-converting visual assets.</p>
          </header>

          <Generator />
          <Gallery />
        </div>
      </DashboardLayout>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
