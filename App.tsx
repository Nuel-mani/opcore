
import React, { useState } from 'react';
import { TenantProvider, useTenant } from './context/TenantContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaxOptimizer from './components/TaxOptimizer';
import BrandConfigurator from './components/BrandConfigurator';
import InvoiceGenerator from './components/InvoiceGenerator';
import SubscriptionScreen from './components/SubscriptionScreen';
import ProAnalytics from './components/ProAnalytics';
import AdvancedLedger from './components/AdvancedLedger';
import LoginScreen from './components/LoginScreen';
import CorporateTaxEngine from './components/CorporateTaxEngine';

function AppContent() {
  const { isOnboarded } = useTenant();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!isOnboarded) {
      return <LoginScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return <ProAnalytics />;
      case 'ledger':
        return <AdvancedLedger />;
      case 'fiscal_engine':
        return <CorporateTaxEngine />;
      case 'transactions':
        return <TaxOptimizer />; 
      case 'invoices':
        return <InvoiceGenerator />;
      case 'optimizer':
        return <TaxOptimizer />;
      case 'subscription':
        return <SubscriptionScreen />;
      case 'brand':
        return <BrandConfigurator />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <TenantProvider>
      <AppContent />
    </TenantProvider>
  );
}

export default App;
