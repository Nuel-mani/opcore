
import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { Check, Shield, Zap, CreditCard } from 'lucide-react';

const SubscriptionScreen: React.FC = () => {
  const { tenant, updateTenant } = useTenant();
  const [loading, setLoading] = useState(false);

  const handlePaystackMock = (plan: 'monthly' | 'yearly') => {
      setLoading(true);
      // Simulate Paystack Popup Delay
      setTimeout(() => {
          const success = window.confirm(`Paystack Mock: Confirm payment for ${plan} plan?`);
          if (success) {
              updateTenant({ subscriptionTier: 'pro' });
              alert("Payment Successful! Welcome to Pro.");
          }
          setLoading(false);
      }, 500); // Reduced time for better testing
  };

  const handleDowngrade = () => {
      if (window.confirm("Downgrade to Free plan? You will lose access to Pro features.")) {
          updateTenant({ subscriptionTier: 'free' });
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-8">
      <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Upgrade to Pro</h2>
          <p className="text-gray-500 dark:text-gray-400">Unlock advanced tax reporting, white-labeling, and automated bank feeds.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-8">
          {/* Free Tier */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 relative">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Freemium</h3>
              <p className="text-3xl font-bold mt-4 mb-6 text-gray-900 dark:text-white">₦0 <span className="text-sm font-normal text-gray-500">/ forever</span></p>
              
              <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300"><Check size={20} className="text-green-500" /> Basic Invoicing</li>
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300"><Check size={20} className="text-green-500" /> Turnover Tracking (CIT Proof)</li>
                  <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300"><Check size={20} className="text-green-500" /> Manual Expense Entry</li>
              </ul>

              <button 
                  onClick={tenant.subscriptionTier === 'pro' ? handleDowngrade : undefined}
                  disabled={tenant.subscriptionTier === 'free'}
                  className={`w-full py-3 rounded-lg font-semibold ${tenant.subscriptionTier === 'free' ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 transition'}`}
              >
                  {tenant.subscriptionTier === 'free' ? "Current Plan" : "Downgrade to Free"}
              </button>
          </div>

          {/* Pro Tier */}
          <div className="bg-brand text-brand-contrast p-8 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
              <h3 className="text-xl font-bold">Pro Business</h3>
              <div className="flex items-end gap-2 mt-4 mb-6">
                  <p className="text-4xl font-bold">₦2,500</p>
                  <span className="text-sm opacity-80 mb-1">/ month</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3"><Zap size={20} /> White-Label Branding (Logo/Colors)</li>
                  <li className="flex items-center gap-3"><Shield size={20} /> AI Tax Loophole Scanner</li>
                  <li className="flex items-center gap-3"><CreditCard size={20} /> Automated Bank Feeds (Mono/Okra)</li>
                  <li className="flex items-center gap-3"><Check size={20} /> Cloud Backup & Sync</li>
              </ul>

              <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => handlePaystackMock('monthly')}
                    disabled={loading || tenant.subscriptionTier === 'pro'}
                    className="w-full py-3 rounded-lg font-semibold bg-white text-brand hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  >
                      {loading ? "Processing..." : (tenant.subscriptionTier === 'pro' ? "Active" : "Subscribe Monthly")}
                  </button>
                  <button 
                     onClick={() => handlePaystackMock('yearly')}
                     disabled={loading || tenant.subscriptionTier === 'pro'}
                     className="text-sm opacity-80 hover:opacity-100 underline"
                  >
                      Or save 17% yearly (₦25,000/yr)
                  </button>
              </div>
          </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Secured by Paystack. Cancel anytime. Prices inclusive of 7.5% VAT.</p>
      </div>
    </div>
  );
};

export default SubscriptionScreen;
