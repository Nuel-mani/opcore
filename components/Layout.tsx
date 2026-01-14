import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext'; // Ensure this path matches your structure
import { SyncIndicator } from './SyncIndicator';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Home, FileText, Settings, Sparkles, X, Moon, Sun, CreditCard, PieChart, Table, RefreshCw, Lock, LogOut, Building } from 'lucide-react';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { tenant, isDarkMode, toggleDarkMode, isOnline, isSyncing, logout, toggleOnlineSimulation } = useTenant() as any;
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync active tab with URL
  useEffect(() => {
    if (location.pathname.includes('analytics')) setActiveTab('analytics');
    else if (location.pathname.includes('ledger')) setActiveTab('ledger');
    else if (location.pathname.includes('fiscal')) setActiveTab('fiscal_engine');
    else if (location.pathname.includes('invoices')) setActiveTab('invoices');
    else if (location.pathname.includes('brand')) setActiveTab('brand');
    else if (location.pathname.includes('subscription')) setActiveTab('subscription');
    else if (location.pathname.includes('optimizer')) setActiveTab('transactions'); // Tax Optimizer
    else setActiveTab('dashboard');
  }, [location]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, showFor: ['personal', 'business'] },
    { id: 'fiscal_engine', label: 'Fiscal Engine (>50M)', icon: Building, isPro: true, showFor: ['business'] },
    { id: 'analytics', label: 'Financial Analytics', icon: PieChart, isPro: true, showFor: ['personal', 'business'] },
    { id: 'ledger', label: 'Advanced Ledger', icon: Table, isPro: true, showFor: ['personal', 'business'] },
    { id: 'transactions', label: 'Tax Optimizer', icon: Sparkles, showFor: ['personal', 'business'] }, // ID matches router usually
    { id: 'invoices', label: 'Invoices', icon: FileText, showFor: ['business'] },
    { id: 'subscription', label: 'Subscription', icon: CreditCard, showFor: ['personal', 'business'] },
    { id: 'brand', label: 'Brand Studio', icon: Settings, showFor: ['business'] },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    if (id === 'dashboard') navigate('/');
    else if (id === 'transactions') navigate('/optimizer'); // Mapping specific routes if needed
    else navigate(`/${id}`);
  };

  // Helper: Title Case + LLC Logic
  const formatBusinessName = (name: string) => {
    if (!name) return 'OpCore';
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word === 'llc' ? 'LLC' : word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Dynamic Brand Color from Tenant (defaulting to the Lagos Orange if not set)
  // We use this inline style for the business name to ensure it overrides defaults.
  const brandColorStyle = { color: tenant.themeColor || '#2252c9' };

  // Robust Account Type Detection
  const isBusiness = tenant.accountType === 'business' || !!tenant.businessStructure || (tenant.sector && tenant.sector !== 'salary earner');
  const effectiveAccountType = isBusiness ? 'business' : 'personal';

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-200">

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 fixed h-full z-30">

        {/* Brand Header */}
        <div className="p-8 pb-4">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt="Logo" className="h-12 w-auto object-contain mb-2" />
          ) : (
            <div className="mb-2">
              {/* Applied formatting and dynamic brand color */}
              <h1 className="text-xl font-bold tracking-tight leading-tight" style={brandColorStyle}>
                {tenant.businessName || 'OpCore'}
              </h1>
              {isBusiness && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Business Account</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-0 space-y-1 overflow-y-auto py-4">
          {navItems.filter(item => item.showFor.includes(effectiveAccountType)).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-8 py-3.5 transition-all duration-200 group relative
                    ${isActive
                    ? 'text-gray-900 dark:text-white font-semibold'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                style={isActive ? { backgroundColor: `${tenant.themeColor}10` } : {}}
              >
                {/* Active Indicator Border */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r" style={{ backgroundColor: tenant.themeColor }}></div>
                )}

                <div className="flex items-center gap-4">
                  <Icon size={20} className={isActive ? "" : "opacity-70 group-hover:opacity-100"} style={isActive ? { color: tenant.themeColor } : {}} />
                  <span className="text-sm">{item.label}</span>
                </div>

                {item.isPro && tenant.subscriptionTier === 'free' && (
                  <Lock size={12} className="text-gray-300" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="p-6 space-y-6 pt-2">

          {/* System Status / Mode Toggles */}
          <div className="flex items-center justify-between">
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-2 text-xs font-semibold text-red-500/80 hover:text-red-600 transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          {/* Current Plan Card */}
          <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Current Plan</p>
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-base font-bold text-gray-900 dark:text-white capitalize leading-tight">
                  {tenant.subscriptionTier === 'free' ? 'Basic Plan' : 'Pro Plan'}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">Auto-Renewal On</span>
              </div>
              <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded font-bold uppercase tracking-wide">
                Active
              </span>
            </div>
          </div>

        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 flex flex-col h-screen overflow-hidden relative">

        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-transparent shrink-0">
          {/* Mobile Menu Trigger & Breadcrumb Placeholder */}
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-gray-600 dark:text-gray-400">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
              <Home size={14} />
              <span>/</span>
              <span className="text-gray-900 dark:text-gray-200 font-medium capitalize">{activeTab.replace('_', ' ')}</span>
            </div>
          </div>

          {/* System Status Pill */}
          <button
            onClick={toggleOnlineSimulation}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                    ${isOnline
                ? 'bg-green-50 text-green-700 border border-green-200/50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                : 'bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400'
              }`}
          >
            {isSyncing ? (
              <RefreshCw size={12} className="animate-spin" />
            ) : (
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            )}
            {isSyncing ? 'Syncing...' : (isOnline ? 'System Online' : 'Offline Mode')}
          </button>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </div>

      </main>

      <SyncIndicator />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white dark:bg-gray-900 p-6 animate-fade-in flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold" style={brandColorStyle}>{formatBusinessName(tenant.businessName)}</h2>
            <button onClick={() => setMobileMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-4 flex-1 overflow-y-auto">
            {navItems.filter(item => item.showFor.includes(effectiveAccountType)).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className="w-full flex items-center gap-4 text-left p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer Area (Mobile) */}
          <div className="mt-8 space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">

            {/* Current Plan Card */}
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">Current Plan</p>
              <div className="flex items-center justify-between">
                <div>
                  <span className="block text-base font-bold text-gray-900 dark:text-white capitalize leading-tight">
                    {tenant.subscriptionTier === 'free' ? 'Basic Plan' : 'Pro Plan'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">Auto-Renewal On</span>
                </div>
                <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded font-bold uppercase tracking-wide">
                  Active
                </span>
              </div>
            </div>

            {/* System Status / Mode Toggles */}
            <div className="flex items-center justify-between">
              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-2 text-xs font-semibold text-red-500/80 hover:text-red-600 transition"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Layout;
