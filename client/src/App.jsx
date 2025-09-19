import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import './i18n';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AgendaPage from './pages/AgendaPage';
import SettingsPage from './pages/SettingsPage';
import MessagingPage from './pages/MessagingPage';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import PricingSection from './components/PricingSection';
import Footer from './components/Footer';

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
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path='/' element={<LandingPage />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/register' element={<RegisterPage />} />

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
      </Router>
    </AuthProvider>
  );
}

export default App;
