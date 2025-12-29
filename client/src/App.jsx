import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import './i18n';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import DashboardPage from './pages/DashboardPage';
import AgendaPage from './pages/AgendaPage';
import SettingsPage from './pages/SettingsPage';
import ConsultationTypesPage from './pages/ConsultationTypesPage';
import TimeplanPage from './pages/TimeplanPage';
import MessagingPage from './pages/MessagingPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import PTOPage from './pages/PTOPage';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import PricingSection from './components/PricingSection';
import Footer from './components/Footer';
import { AgendaProvider } from './contexts/AgendaContext';

// Landing page component
const LandingPage = () => (
  <>
    <HeroSection />
    <FeaturesSection />
    <PricingSection />
    <Footer />
  </>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <AgendaProvider>
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path='/' element={<LandingPage />} />
              <Route path='/login' element={<LoginPage />} />
              <Route path='/register' element={<RegisterPage />} />
              <Route path='/verify-email' element={<EmailVerificationPage />} />

              {/* Protected routes */}
              <Route
                path='/dashboard'
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/agenda'
                element={
                  <ProtectedRoute>
                    <AgendaPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/settings'
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/settings/profile'
                element={
                  <ProtectedRoute>
                    <ProfileSettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/settings/consultation-types'
                element={
                  <ProtectedRoute>
                    <ConsultationTypesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/settings/timeplan'
                element={
                  <ProtectedRoute>
                    <TimeplanPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/settings/pto'
                element={
                  <ProtectedRoute>
                    <PTOPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/messagery'
                element={
                  <ProtectedRoute>
                    <MessagingPage />
                  </ProtectedRoute>
                }
              />

              {/* Redirect unknown routes to home */}
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </Layout>
          <Toaster
            position='top-right'
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--background)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--primary)',
                  secondary: 'var(--primary-foreground)',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--destructive)',
                  secondary: 'var(--destructive-foreground)',
                },
              },
            }}
          />
        </AgendaProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
