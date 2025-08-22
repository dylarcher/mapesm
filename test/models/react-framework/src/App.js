// Main React Application Component
import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Footer } from './components/Footer.js';
import { LoadingSpinner } from './components/LoadingSpinner.js';
import { Navbar } from './components/Navbar.js';
import { Sidebar } from './components/Sidebar.js';
import { useAuth } from './hooks/useAuth.js';
import { useTheme } from './hooks/useTheme.js';

// Lazy load pages for code splitting
const HomePage = React.lazy(() => import('./pages/HomePage.js'));
const AboutPage = React.lazy(() => import('./pages/AboutPage.js'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage.js'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage.js'));
const LoginPage = React.lazy(() => import('./pages/LoginPage.js'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage.js'));

export const App = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { theme, isDarkMode } = useTheme();

  // Show loading spinner while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className={`app ${theme} ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="min-h-screen flex flex-col">
        {/* Navigation */}
        <Navbar />

        <div className="flex flex-1">
          {/* Sidebar - only show for authenticated users */}
          {isAuthenticated && (
            <aside className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              <Sidebar />
            </aside>
          )}

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-8">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/login" element={<LoginPage />} />

                  {/* Protected routes */}
                  {isAuthenticated ? (
                    <>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                    </>
                  ) : (
                    <Route path="/dashboard" element={<LoginRedirect />} />
                  )}

                  {/* 404 handler */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </div>
          </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

// Component to redirect to login for protected routes
const LoginRedirect = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  return <LoadingSpinner />;
};
