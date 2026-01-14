import React from 'react';
import { useTenant } from '../context/TenantContext';
import { Building2, Info, Sparkles, AlertTriangle, TrendingUp, ShieldAlert, Calculator, Calendar, CreditCard, PieChart } from 'lucide-react';
import { TaxEngine } from '../utils/TaxEngine';

export const CorporateTaxEngine: React.FC = () => {
    const { tenant, transactions } = useTenant();

    // NTA 2025 Fiscal Logic (Current Year)
    const currentYear = new Date().getFullYear();

    // Filter for Fiscal Year
    const fyTransactions = React.useMemo(() =>
        (transactions || []).filter((t: any) => new Date(t.date).getFullYear() === currentYear),
        [transactions, currentYear]);

    const fiscalTurnover = fyTransactions
        .filter((t: any) => t.type === 'income')
        .reduce((acc: number, t: any) => acc + (t.amount - (t.vatAmount || 0)), 0); // Net Revenue (Less VAT)

    const fiscalExpense = fyTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((acc: number, t: any) => acc + t.amount, 0);

    const fiscalProfit = Math.max(0, fiscalTurnover - fiscalExpense);

    const totalAssets = (transactions || [])
        .filter((t: any) => t.isCapitalAsset)
        .reduce((acc: number, t: any) => acc + t.amount, 0);

    const TURNOVER_CAP = 100000000; // 100M (Large Company Threshold)
    const ASSET_CAP = 250000000;    // 250M

    const turnoverProgress = Math.min((fiscalTurnover / TURNOVER_CAP) * 100, 100);
    const assetProgress = Math.min((totalAssets / ASSET_CAP) * 100, 100);

    // Determine Status & Rate
    let taxRate = 0;
    let companyStatus = 'Small (Exempt)';
    let statusColor = 'text-green-600';

    if (fiscalTurnover >= 25000000 && fiscalTurnover < 100000000) {
        taxRate = 0.20;
        companyStatus = 'Medium (20%)';
        statusColor = 'text-orange-600';
    } else if (fiscalTurnover >= 100000000) {
        taxRate = 0.30;
        companyStatus = 'Large (30%)';
        statusColor = 'text-red-600';
    }

    const estimatedCIT = fiscalProfit * taxRate;
    const isActive = fiscalTurnover >= 25000000; // Active only if liable (Medium or Large)

    // Active View (Liable Companies)
    const [activeTab, setActiveTab] = React.useState<'overview' | 'forms'>('overview');

    // Advanced Tax Calcs
    const educationTax = fiscalProfit > 0 ? fiscalProfit * 0.03 : 0; // 3% of Assessable Profit
    const totalCIT = estimatedCIT;
    const totalTaxLiability = totalCIT + educationTax;

    // --- New Features Logic ---
    const [installmentMonths, setInstallmentMonths] = React.useState(1);
    const monthlyPayment = totalTaxLiability / installmentMonths;

    const [scenarioSpend, setScenarioSpend] = React.useState(0);
    // Rough Algo: Spend * 50% (Initial + Annual Allowance) * TaxRate = Savings
    const scenarioSavings = scenarioSpend * 0.50 * taxRate;
    const projectedLiability = Math.max(0, totalTaxLiability - scenarioSavings);

    // VAT Logic
    const outputVat = fyTransactions
        .filter((t: any) => t.type === 'income')
        .reduce((acc: number, t: any) => acc + (t.vatAmount || 0), 0); // Use Actual VAT Data
    // Ideally we sum from Invoices, but Transactions is the cash truth. Let's assume standard rate.

    const inputVat = fyTransactions
        .filter((t: any) => t.type === 'expense' && t.hasVatEvidence)
        .reduce((acc: number, t: any) => acc + (t.amount - (t.amount / 1.075)), 0); // Extract VAT from Gross

    const netVatPayable = outputVat - inputVat;

    if (isActive) {
        const nextFilingDate = "June 30, " + (currentYear + 1);

        return (
            <div className="p-6 max-w-6xl mx-auto pb-20 animate-fade-in text-left">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Building2 className="text-blue-600" size={32} /> Corporate Tax Engine
                        </h1>
                        <p className="text-gray-500">Tax Band: <span className={`font-bold ${statusColor}`}>{companyStatus}</span></p>
                    </div>

                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('forms')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'forms' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            Filing Forms
                        </button>
                    </div>
                </div>

                {activeTab === 'overview' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Liability Card */}
                        <div className="bg-gray-900 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                            <div className="mb-6">
                                <p className="text-gray-400 font-bold uppercase text-xs mb-1">Fiscal Profit (YTD)</p>
                                <h3 className="text-2xl font-bold text-gray-200">{tenant.currencySymbol}{fiscalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-gray-400 font-bold uppercase text-[10px] mb-1">CIT ({(taxRate * 100).toFixed(0)}%)</p>
                                    <p className="text-xl font-mono">{tenant.currencySymbol}{totalCIT.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 font-bold uppercase text-[10px] mb-1">Edu. Tax (3%)</p>
                                    <p className="text-xl font-mono">{tenant.currencySymbol}{educationTax.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-700">
                                <p className="text-gray-400 font-bold uppercase text-xs mb-2">Total Liability</p>
                                <h2 className="text-3xl md:text-5xl font-bold mb-4">{tenant.currencySymbol}{totalTaxLiability.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h2>
                            </div>

                            <div className="flex gap-4 text-sm text-gray-300">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-yellow-400" />
                                    <span>Due: {nextFilingDate}</span>
                                </div>
                            </div>

                            {/* Payment Actions */}
                            <div className="mt-8 flex gap-3">
                                <button className="flex-1 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                                    <CreditCard size={18} /> Pay via Remita
                                </button>
                                <button className="px-4 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors border border-white/20">
                                    Download Challan
                                </button>
                            </div>
                        </div>

                        {/* Interactive Tools Column */}
                        <div className="space-y-6">

                            {/* Installment Planner */}
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Calendar size={20} className="text-blue-500" /> Payment Planner
                                    </h3>
                                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">FIRS APPROVED</span>
                                </div>

                                <div className="mb-6">
                                    <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
                                        <span>One-off</span>
                                        <span>6 Months</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="6"
                                        value={installmentMonths}
                                        onChange={(e) => setInstallmentMonths(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-gray-500">Monthly Payment ({installmentMonths}x)</p>
                                        <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{tenant.currencySymbol}{monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                    </div>
                                    {installmentMonths > 1 && (
                                        <div className="text-right">
                                            <p className="text-xs text-green-600 font-bold">Ease Cashflow</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* "What-If" Scenario Builder */}
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Sparkles size={20} className="text-purple-500" /> Tax Shield Simulator
                                    </h3>
                                </div>

                                <p className="text-xs text-gray-500 mb-4">
                                    "If I buy new equipment before Dec 31st..."
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Capital Asset Spend</label>
                                        <div className="relative mt-1">
                                            <span className="absolute left-3 top-2.5 text-gray-400">{tenant.currencySymbol}</span>
                                            <input
                                                type="number"
                                                value={scenarioSpend || ''}
                                                onChange={(e) => setScenarioSpend(parseInt(e.target.value) || 0)}
                                                placeholder="e.g. 5,000,000"
                                                className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-lg text-sm font-bold focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>

                                    {scenarioSpend > 0 && (
                                        <div className="animate-fade-in border-t border-dashed border-gray-200 dark:border-gray-600 pt-4">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Estimated Tax Savings</span>
                                                <span className="text-sm font-bold text-green-600">-{tenant.currencySymbol}{scenarioSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">New Liability</span>
                                                <span className="text-lg font-bold text-purple-600">{tenant.currencySymbol}{projectedLiability.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-2 text-right">Based on ~50% Capital Allowance (Initial + Annual)</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-fade-in-up">
                        {/* FORM CIT 001 */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 dark:text-white">CIT Form 001 (Income Tax)</h3>
                                <span className="text-xs font-mono text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">FIRS-CIT-001</span>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-700/30 text-xs uppercase text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Description</th>
                                        <th className="px-6 py-3 text-right">Amount ({tenant.currencySymbol})</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    <tr>
                                        <td className="px-6 py-4 text-gray-600">Total Turnover (Revenue)</td>
                                        <td className="px-6 py-4 text-right font-mono">{fiscalTurnover.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-gray-600">Less: Allowable Expenses</td>
                                        <td className="px-6 py-4 text-right font-mono text-red-500">({fiscalExpense.toLocaleString()})</td>
                                    </tr>
                                    <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">Assessable Profit</td>
                                        <td className="px-6 py-4 text-right font-bold font-mono text-blue-600">{fiscalProfit.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-gray-600">Companies Income Tax ({companyStatus})</td>
                                        <td className="px-6 py-4 text-right font-mono">{totalCIT.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-gray-600">Tertiary Education Tax (3% of Profit)</td>
                                        <td className="px-6 py-4 text-right font-mono">{educationTax.toLocaleString()}</td>
                                    </tr>
                                    <tr className="bg-gray-900 text-white">
                                        <td className="px-6 py-4 font-bold">Total Liability Payable</td>
                                        <td className="px-6 py-4 text-right font-bold font-mono text-lg">{totalTaxLiability.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* FORM VAT 002 */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 dark:text-white">VAT Form 002 (Monthly Return)</h3>
                                <span className="text-xs font-mono text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">FIRS-VAT-002</span>
                            </div>
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    <tr>
                                        <td className="px-6 py-4 text-gray-600 w-2/3">Total Supplies (Sales)</td>
                                        <td className="px-6 py-4 text-right font-mono">{fiscalTurnover.toLocaleString()}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-gray-600">Output VAT (7.5%)</td>
                                        <td className="px-6 py-4 text-right font-mono">{outputVat.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-gray-600">Less: Input VAT (On Purchases with Evidence)</td>
                                        <td className="px-6 py-4 text-right font-mono text-green-600">({inputVat.toLocaleString(undefined, { maximumFractionDigits: 2 })})</td>
                                    </tr>
                                    <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">Net VAT Payable / (Refundable)</td>
                                        <td className="px-6 py-4 text-right font-bold font-mono text-blue-600">{netVatPayable.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Standby View (<50M)


    return (
        <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center">

            {/* Commercial Icon */}
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-8">
                <Building2 size={40} className="text-gray-400" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Fiscal Engine Standby</h1>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8">
                <Info size={16} /> Status: Small Company (Exempt)
            </div>

            <p className="text-gray-500 max-w-lg text-lg mb-12">
                This engine activates for companies with turnover <span className="font-bold text-gray-900">&gt;₦25M</span> or in <span className="font-bold text-gray-900">Special Sectors</span>.
            </p>

            <div className="w-full max-w-2xl space-y-6">

                {/* Activation Info Card */}
                <div className="bg-white dark:bg-gray-800 border-l-4 border-blue-400 dark:border-blue-500 rounded-xl p-8 shadow-sm flex gap-5 items-start">
                    <Sparkles className="text-blue-400 dark:text-blue-500 shrink-0 mt-1" size={24} />
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">Automatic Activation</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                            You don't need to do anything. Keep logging your revenue, and this module will automatically unlock the moment you cross the <span className="font-bold text-gray-900">₦25M threshold</span> or if your sector classification changes.
                        </p>
                    </div>
                </div>

                {/* Turnover Progress */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-end mb-4">
                            <div className="flex items-center gap-2">
                                <TrendingUp size={16} className="text-blue-500" />
                                <span className="text-sm font-bold text-gray-500">Turnover Watch</span>
                            </div>
                            <span className="font-mono font-bold text-gray-900">₦{fiscalTurnover.toLocaleString()} / 100M</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${turnoverProgress > 80 ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ width: `${turnoverProgress}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-end mb-4">
                            <div className="flex items-center gap-2">
                                <ShieldAlert size={16} className="text-purple-500" />
                                <span className="text-sm font-bold text-gray-500">Asset Base Watch</span>
                            </div>
                            <span className="font-mono font-bold text-gray-900">₦{totalAssets.toLocaleString()} / 250M</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ${assetProgress > 80 ? 'bg-orange-500' : 'bg-purple-500'}`} style={{ width: `${assetProgress}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 justify-center mt-8">
                    <button className="px-6 py-3 bg-blue-50 text-blue-700 font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2">
                        <FileText size={18} /> Read Compliance Guidelines
                    </button>
                    <button className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-lg hover:border-gray-300 transition-colors">
                        Contact Support
                    </button>
                </div>

            </div>
        </div>
    );

    // Icon Helper
    function FileText({ size }: { size: number }) {
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
        );
    }
};

// export default CorporateTaxEngine;
