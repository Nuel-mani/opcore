import React from 'react';
import { useTenant } from '../context/TenantContext'; // Adjust path if needed
import { Check, ShieldCheck, Zap, Cloud, Smartphone, CheckCircle } from 'lucide-react';

export const SubscriptionScreen: React.FC = () => {
    const { tenant, updateTenant, systemSettings } = useTenant();
    const isPro = tenant.subscriptionTier === 'pro';
    const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'yearly'>('monthly');
    const [invoiceVolume, setInvoiceVolume] = React.useState(10); // Weekly invoices

    // Pricing Config
    const MONTHLY_PRICE = systemSettings?.pro_monthly_price || 2500;
    const YEARLY_PRICE = systemSettings?.pro_yearly_price || 25000;
    const SAVINGS_PCT = Math.round(((MONTHLY_PRICE * 12 - YEARLY_PRICE) / (MONTHLY_PRICE * 12)) * 100);

    // ROI Logic
    const hoursSavedPerMonth = React.useMemo(() => {
        // Assume 20 mins per manual invoice (creation + chasing + recording)
        return Math.round((invoiceVolume * 4 * 20) / 60);
    }, [invoiceVolume]);

    // Assume value of time = N2,000/hr (Low ball estimate for business owner)
    const moneySaved = hoursSavedPerMonth * 2000;

    const handleUpgrade = async () => {
        // In a real app, this triggers Paystack/Stripe
        // For MVP, we hit our backend endpoint directly
        try {
            const API_BASE = `http://${window.location.hostname}:3001`;
            const res = await fetch(`${API_BASE}/api/subscription/upgrade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId: tenant.id, plan: 'pro', cycle: billingCycle })
            });
            const data = await res.json();
            if (data.status === 'success') {
                updateTenant({ subscriptionTier: 'pro' });
                alert("Upgrade Successful! Welcome to Pro.");
            } else {
                alert("Upgrade Failed: " + data.error);
            }
        } catch (e) {
            console.warn("Network Error - Falling back to LOCAL SIMULATION for testing");
            // FALLBACK FOR TESTING ONLY
            if (window.confirm("Network unreachable. Simulate 'Pro' upgrade for testing?")) {
                updateTenant({ subscriptionTier: 'pro' });
                alert("Simulated Upgrade Successful!");
            }
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] animate-fade-in p-4 pb-20">

            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Upgrade to Pro</h1>
                <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">Unlock advanced tax reporting, white-labeling, and automated bank feeds. Join 500+ smart businesses.</p>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center mt-8 gap-4">
                    <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>Monthly</span>
                    <button
                        onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                        className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full p-1 relative transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform transform ${billingCycle === 'yearly' ? 'translate-x-8 bg-blue-600' : ''}`}></div>
                    </button>
                    <span className={`text-sm font-bold flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                        Yearly
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Save {SAVINGS_PCT}%</span>
                    </span>
                </div>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl mb-24">

                {/* Freemium Card */}
                <div className={`rounded-3xl p-8 shadow-lg border flex flex-col justify-between h-[550px] relative overflow-hidden transition-all ${!isPro ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 opacity-60'}`} style={!isPro ? { borderColor: tenant.themeColor } : {}}>
                    <div>
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Freemium</h3>
                            {!isPro && <span className="text-xs font-bold uppercase tracking-widest bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Current Plan</span>}
                        </div>

                        <div className="mb-8">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-gray-900 dark:text-white">₦0</span>
                                <span className="text-gray-500">/ forever</span>
                            </div>
                        </div>

                        <ul className="space-y-4">
                            {[
                                'Basic Invoicing',
                                'Turnover Tracking (CIT Proof)',
                                'Manual Expense Entry',
                                'Standard Support'
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <div className="text-green-500"><Check size={18} strokeWidth={3} /></div>
                                    <span className="font-medium text-sm">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button disabled={!isPro} className={`w-full py-3 font-bold rounded-xl mt-8 transition-colors text-sm ${!isPro ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                        {!isPro ? 'Active Plan' : 'Downgrade'}
                    </button>
                </div>

                {/* Pro Business Card */}
                <div className={`rounded-3xl p-8 shadow-2xl relative flex flex-col justify-between h-[600px] transform transition-all duration-300 overflow-hidden md:-mt-6 ${isPro ? 'bg-[#10b981] text-white scale-[1.02] ring-4 ring-green-200 dark:ring-green-900/30' : 'bg-[#2252c9] text-white md:hover:-translate-y-2'}`}>

                    {/* Popular Badge */}
                    <div className="absolute top-0 right-10 bg-[#facc15] text-[#854d0e] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-b-lg shadow-sm z-10">
                        Most Popular
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-6 text-white/90">Pro Business</h3>

                        <div className="mb-8 h-16">
                            {billingCycle === 'monthly' ? (
                                <div className="animate-fade-in">
                                    <span className="text-5xl font-bold">₦{MONTHLY_PRICE.toLocaleString()}</span>
                                    <span className="text-white/70">/ mo</span>
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-bold">₦{YEARLY_PRICE.toLocaleString()}</span>
                                        <span className="text-white/70">/ yr</span>
                                    </div>
                                    <p className="text-xs text-white/80 mt-1 font-medium bg-white/20 inline-block px-2 py-1 rounded">2 MONTHS FREE</p>
                                </div>
                            )}
                        </div>

                        <ul className="space-y-4">
                            <li className="flex items-center gap-3">
                                <Zap className="text-white shrink-0" size={18} fill="currentColor" />
                                <span className="font-medium text-sm">White-Label Branding</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <ShieldCheck className="text-white shrink-0" size={18} />
                                <span className="font-medium text-sm">AI Tax Loophole Scanner</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="bg-white/20 p-0.5 rounded"><span className="text-[9px] font-bold px-1">AUTO</span></div>
                                <span className="font-medium text-sm">Automated Bank Feeds</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Cloud className="text-white shrink-0" size={18} />
                                <span className="font-medium text-sm">Cloud Backup & Priority Support</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Smartphone className="text-white shrink-0" size={18} />
                                <span className="font-medium text-sm">Mobile App Access (Beta)</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        {isPro ? (
                            <button className="w-full py-4 bg-white/20 text-white font-bold rounded-xl cursor-default uppercase tracking-wide text-sm flex items-center justify-center gap-2 mb-3">
                                <CheckCircle size={18} /> Plan Active
                            </button>
                        ) : (
                            <button onClick={handleUpgrade} className="w-full py-4 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all uppercase tracking-wide text-sm flex items-center justify-center gap-2 mb-3">
                                Upgrade Now
                            </button>
                        )}
                        <p className="text-center text-[10px] text-white/60 font-medium">Secured by Paystack. Cancel anytime.</p>
                    </div>

                    {/* Background decoration */}
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                </div>

                {/* Enterprise Card */}
                <div className="rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-[550px] bg-white dark:bg-gray-800">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Enterprise</h3>
                        <div className="mb-8">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">Custom</span>
                        </div>

                        <ul className="space-y-4">
                            {[
                                'Multi-User Access (Teams)',
                                'Dedicated Account Manager',
                                'Custom API Integration',
                                'On-Premise Deployment'
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                                    <div className="text-blue-500"><Check size={18} strokeWidth={3} /></div>
                                    <span className="font-medium text-sm">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button className="w-full py-3 border-2 border-gray-900 dark:border-gray-600 text-gray-900 dark:text-white font-bold rounded-xl mt-8 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                        Contact Sales
                    </button>
                </div>

            </div>

            {/* ROI Calculator Section */}
            <div className="w-full max-w-5xl bg-gradient-to-br from-blue-900 to-indigo-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl mb-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Zap size={300} />
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h3 className="text-2xl font-bold mb-4">Is Pro Worth It?</h3>
                        <p className="text-indigo-200 mb-8">See how much time OpCore saves you by automating invoices, receipts, and tax calculations.</p>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span>Weekly Invoices</span>
                                    <span className="bg-white/20 px-2 py-0.5 rounded">{invoiceVolume}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={invoiceVolume}
                                    onChange={(e) => setInvoiceVolume(parseInt(e.target.value))}
                                    className="w-full h-2 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-blue-400"
                                />
                                <div className="flex justify-between text-[10px] text-indigo-300 mt-1">
                                    <span>1</span>
                                    <span>50</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-4">MONTHLY IMPACT</p>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <div className="text-3xl font-bold">{hoursSavedPerMonth}h</div>
                                <div className="text-xs text-indigo-200">Time Saved</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold">₦{(moneySaved / 1000).toFixed(0)}k</div>
                                <div className="text-xs text-indigo-200">Value Created</div>
                            </div>
                        </div>

                        <div className="p-3 bg-green-500/20 rounded-lg border border-green-500/30">
                            <p className="text-sm font-medium text-green-300">
                                OpCore pays for itself in <span className="font-bold text-white underline">{Math.max(1, (MONTHLY_PRICE / (moneySaved || 1))).toFixed(1)} days</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="w-full max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">Frequently Asked Questions</h3>
                <div className="space-y-4">
                    {[
                        { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. Your access will continue until the end of the billing period." },
                        { q: "Is my data safe?", a: "Absolutely. We use bank-grade 256-bit encryption and back up your data daily to secure cloud servers." },
                        { q: "Do I need a credit card?", a: "No, you can start on the Free plan without a card. You only need one when you upgrade to Pro." },
                        { q: "What happens if I cross N100M?", a: "OpCore will automatically alert you and suggest switching to the Enterprise plan for dedicated CIT filing support." }
                    ].map((item, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2">{item.q}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{item.a}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div >
    );
};

// export default SubscriptionScreen;
