
import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { Menu, Home, FileText, Settings, Sparkles, X, Moon, Sun, CreditCard, PieChart, Table, Cloud, CloudOff, RefreshCw, Lock, LogOut, Building } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { tenant, isDarkMode, toggleDarkMode, isOnline, isSyncing, logout, toggleOnlineSimulation } = useTenant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, showFor: ['personal', 'business'] },
    { id: 'fiscal_engine', label: 'Fiscal Engine (>50M)', icon: Building, isPro: true, showFor: ['business'] }, // New Module
    { id: 'analytics', label: 'Financial Analytics', icon: PieChart, isPro: true, showFor: ['personal', 'business'] },
    { id: 'ledger', label: 'Advanced Ledger', icon: Table, isPro: true, showFor: ['personal', 'business'] },
    { id: 'transactions', label: 'Tax Optimizer', icon: Sparkles, showFor: ['personal', 'business'] },
    { id: 'invoices', label: 'Invoices', icon: FileText, showFor: ['business'] }, // Business Only
    { id: 'subscription', label: 'Subscription', icon: CreditCard, showFor: ['personal', 'business'] },
    { id: 'brand', label: 'Brand Studio', icon: Settings, showFor: ['business'] }, // Business Only
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen font-sans text-gray-900 dark:text-gray-100 flex flex-col md:flex-row transition-colors duration-200 relative isolate overflow-hidden bg-gray-50 dark:bg-gray-900">

      {/* Background Ambience */}
      <div className="absolute inset-0 z-[-1] pointer-events-none">
        {/* Mesh Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-200/40 via-gray-50/20 to-transparent dark:from-orange-900/20 dark:via-gray-900/50 dark:to-transparent" />

        {/* Dot Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.4] dark:opacity-[0.2]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%239ca3af' fill-opacity='0.4'/%3E%3C/svg%3E")`,
            maskImage: 'linear-gradient(to bottom, black, transparent 90%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 90%)'
          }}
        />
      </div>


      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm fixed h-full z-30">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-center">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
          ) : (
            <h1 className="text-xl font-bold tracking-tight text-brand truncate max-w-[200px]">{tenant.businessName}</h1>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.filter(item => item.showFor.includes(tenant.accountType)).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors duration-200 group ${isActive
                    ? 'bg-brand text-brand-contrast shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                {item.isPro && tenant.subscriptionTier === 'free' && (
                  <Lock size={14} className="opacity-50" />
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <div className="flex items-center gap-2">
              {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
              <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className={`w-8 h-4 bg-gray-300 dark:bg-gray-600 rounded-full relative transition`}>
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            <LogOut size={16} /> Logout
          </button>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-1">Current Plan</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 capitalize">{tenant.subscriptionTier}</span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
          ) : (
            <h1 className="text-xl font-bold text-brand">{tenant.businessName}</h1>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleDarkMode} className="text-gray-600 dark:text-gray-400">
            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-600 dark:text-gray-400 p-2">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white dark:bg-gray-900 pt-20 px-6 animate-fade-in flex flex-col">
          <nav className="space-y-2 flex-1">
            {navItems.filter(item => item.showFor.includes(tenant.accountType)).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-lg text-lg ${isActive
                      ? 'bg-brand text-brand-contrast'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                >
                  <Icon size={24} />
                  <span className="font-medium">{item.label}</span>
                  {item.isPro && tenant.subscriptionTier === 'free' && (
                    <Lock size={16} className="ml-auto opacity-50" />
                  )}
                </button>
              );
            })}
          </nav>
          <div className="pb-8">
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 p-4 text-red-600 font-bold border border-red-200 rounded-lg">
              <LogOut /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
        {/* Header Bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-end px-8 shrink-0">
          {/* Cloud Sync Indicator */}
          <button
            onClick={toggleOnlineSimulation}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Click to toggle Network Simulation (Test Offline Mode)"
          >
            {isSyncing ? (
              <div className="flex items-center gap-2 text-brand">
                <RefreshCw size={16} className="animate-spin" />
                <span className="hidden sm:inline">Syncing...</span>
              </div>
            ) : isOnline ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Cloud size={18} />
                <span className="hidden sm:inline">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <CloudOff size={18} />
                <span className="hidden sm:inline">Offline (Simulated)</span>
              </div>
            )}
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
