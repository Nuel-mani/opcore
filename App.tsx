import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { TenantProvider, useTenant } from './context/TenantContext'; // Keep Context
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import LoginScreen from './components/LoginScreen';
import OnboardingScreen from './components/OnboardingScreen';
import AdminLayout from './components/admin/AdminLayout';
import { AdminProvider } from './context/AdminContext';
import LoadingScreen from './components/LoadingScreen';
import { nuclearReset } from './utils/nuclearReset';
import ErrorBoundary from './components/ErrorBoundary';
import { BrandConfigurator } from './components/BrandConfigurator';
import { InvoiceGenerator } from './components/InvoiceGenerator';
import { CorporateTaxEngine } from './components/CorporateTaxEngine';
import { ProAnalytics } from './components/ProAnalytics';
import { AdvancedLedger } from './components/AdvancedLedger';
import { TaxOptimizer } from './components/TaxOptimizer';
import { SubscriptionScreen } from './components/SubscriptionScreen';
import LandingPage from './components/LandingPage';

// Placeholder for Rebuilding Pages


function RequireAuth({ children }: { children: JSX.Element }) {
    const { isOnboarded } = useTenant();
    const location = useLocation();

    if (!isOnboarded) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}

function MainAppShell() {
    return (
        <Layout>
            <Routes>
                {/* Dashboard is now explicitly /dashboard */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} /> {/* Redirect sub-root to dashboard loops if not careful? No, this is inside MainAppShell */}

                {/* Rebuilding Routes */}
                <Route path="/analytics" element={<ProAnalytics />} />
                <Route path="/ledger" element={<AdvancedLedger />} />
                <Route path="/fiscal_engine" element={<CorporateTaxEngine />} />
                <Route path="/optimizer" element={<TaxOptimizer />} />
                <Route path="/transactions" element={<TaxOptimizer />} />
                <Route path="/invoices" element={<InvoiceGenerator />} />
                <Route path="/subscription" element={<SubscriptionScreen />} />
                <Route path="/brand" element={<BrandConfigurator />} />

                <Route path="*" element={<Dashboard />} />
            </Routes>
        </Layout>
    );
}

function AppContent() {
    const { isInitializing, performAppReset, isOnboarded } = useTenant();

    if (isInitializing) {
        return <LoadingScreen onReset={performAppReset} />;
    }

    return (
        <Routes>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<OnboardingScreen />} />
            <Route path="/" element={isOnboarded ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
            <Route path="/admin/*" element={
                <AdminProvider>
                    <AdminLayout />
                </AdminProvider>
            } />
            <Route
                path="/*"
                element={
                    <RequireAuth>
                        <MainAppShell />
                    </RequireAuth>
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <TenantProvider>
                <ErrorBoundary>
                    <AppContent />
                </ErrorBoundary>
            </TenantProvider>
        </Router>
    );
}

export default App;
