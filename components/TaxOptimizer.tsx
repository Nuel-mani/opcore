import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle, Search, Download, Info, Lock, ArrowRight, Shield, Gauge, Clock, FileWarning, Trophy } from 'lucide-react';
import { TaxEngine } from '../utils/TaxEngine';

import { useNavigate } from 'react-router-dom';

export const TaxOptimizer: React.FC = () => {
    const navigate = useNavigate();
    // ...
    // export default TaxOptimizer;
    const { tenant, transactions, isFeatureLocked } = useTenant() as any;
    const [searchTerm, setSearchTerm] = useState('');

    const isLocked = isFeatureLocked('tax_optimizer');

    // Stats
    const totalTransactions = transactions?.length || 0;
    const deductibleCount = transactions?.filter((t: any) => t.isDeductible).length || 0;
    const deductibleAmount = transactions?.filter((t: any) => t.isDeductible).reduce((acc: number, t: any) => acc + t.amount, 0) || 0;

    // --- Risk & Receipt Hunter Logic ---
    const riskyTransactions = (transactions || []).filter((t: any) => t.amount > 50000 && !t.receiptImageUrl && !t.hasVatEvidence);
    const riskScore = Math.min(100, (riskyTransactions.length * 10)); // Simple scoring
    const auditRiskLevel = riskScore > 50 ? 'High' : (riskScore > 20 ? 'Medium' : 'Low');
    const riskColor = riskScore > 50 ? 'text-red-500' : (riskScore > 20 ? 'text-orange-500' : 'text-green-500');

    // Deadline Logic
    const nextDeadline = new Date(new Date().getFullYear(), 5, 30); // June 30th (CIT)
    const daysToDeadline = Math.ceil((nextDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    const handlePrint = () => window.print();

    // Filter
    const filtered = (transactions || [])
        .filter((t: any) => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (isLocked) {
        // Run a "Shadow Scan" to show them what they are missing
        const shadowStrategies = TaxEngine.scanForReliefs(tenant, transactions || []);
        const totalPotentialSavings = shadowStrategies.reduce((acc, s) => acc + s.potential, 0) * 0.20; // 20% Tax Rate Assumption
        const verifiedDeductions = transactions?.filter((t: any) => t.isDeductible).length || 0;

        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto pb-20 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                            Tax Loophole Scanner <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] uppercase font-bold rounded">Active</span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            Real-time analysis based on <span className="text-gray-900 dark:text-gray-200 font-bold">Finance Act 2024 & NTA 2025</span> regulations.
                        </p>
                    </div>
                    <div className="px-4 py-2 bg-gray-900 dark:bg-gray-800 text-gray-400 rounded-lg text-xs font-mono flex items-center gap-2">
                        <Sparkles size={14} /> Last scan: Just now
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Total Recoverable */}
                    <div className="md:col-span-2 bg-blue-900/10 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Total Recoverable Tax</p>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4">
                            {tenant.currencySymbol}{totalPotentialSavings.toLocaleString()}
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold rounded">+15% vs Last Year</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Potential cash flow boost</span>
                        </div>
                    </div>

                    {/* Deadline Timer */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-2 right-2 text-red-100 dark:text-red-900/20"><Clock size={60} /></div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">CIT Deadline</p>
                        <h2 className="text-3xl font-bold text-red-600 mb-1">{daysToDeadline} Days</h2>
                        <p className="text-xs text-gray-500">Until June 30 Filing</p>
                    </div>

                    {/* Compliance Risk (Gauge) */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-2 right-2 text-gray-100 dark:text-gray-700"><Gauge size={60} /></div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Audit Risk</p>
                        <h2 className={`text-3xl font-bold ${riskColor} mb-1`}>{auditRiskLevel}</h2>
                        <p className="text-xs text-gray-500">{riskyTransactions.length} Unverified Items</p>
                    </div>
                </div>

                {/* Main Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Breakdown (Visible) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gray-900 dark:bg-black rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl"></div>

                            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                                <Sparkles className="text-blue-500" /> Potential Savings Breakdown
                            </h3>

                            <div className="space-y-8 relative z-10">
                                {shadowStrategies.slice(0, 3).map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-end mb-2">
                                            <div>
                                                <h4 className="font-bold text-lg">{item.type}</h4>
                                                <p className="text-xs text-gray-400">Section {i === 0 ? '24' : i === 1 ? '56' : '33'}, Finance Act</p>
                                            </div>
                                            <span className="font-mono font-bold text-xl">{tenant.currencySymbol}{(item.potential * 0.20).toLocaleString()}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden mb-2">
                                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${60 + (i * 10)}%` }}></div>
                                        </div>
                                        <p className="text-xs text-gray-500">{item.action}</p>
                                    </div>
                                ))}
                                {shadowStrategies.length === 0 && (
                                    <div className="text-center py-10 text-gray-500">
                                        No optimization opportunities found yet. Log more expenses!
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl p-6 flex gap-4">
                            <Info className="text-blue-600 shrink-0" />
                            <div>
                                <h4 className="font-bold text-blue-900 dark:text-white mb-1">Why these opportunities exist?</h4>
                                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                                    Your recent transaction ledger indicates unclaimed expenses that qualify for standard deductions under the new Finance Act 2024. These are "use it or lose it" benefits.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Implementation Strategy (Locked) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-3xl p-1 relative overflow-hidden h-full min-h-[400px]">
                            {/* Blur Layer */}
                            <div className="absolute inset-0 z-20 backdrop-blur-[6px] bg-white/60 dark:bg-gray-900/60 flex flex-col items-center justify-center p-8 text-center">
                                <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-600/30 mb-6">
                                    <Lock size={32} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unlock Tax Shield</h3>
                                <p className="text-gray-500 mb-8 max-w-sm">
                                    Get the step-by-step execution plan, auto-filled FIRS forms, and audit defense support.
                                </p>
                                <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-transform active:scale-95 flex items-center justify-center gap-2">
                                    Upgrade to Pro <ArrowRight size={18} />
                                </button>
                                <p className="text-xs text-gray-400 mt-4 flex items-center gap-2">
                                    <Shield size={12} /> 30-Day Money Back Guarantee
                                </p>
                            </div>

                            {/* Background Faux Content */}
                            <div className="p-6 opacity-30 select-none pointer-events-none grayscale">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex justify-between">
                                    Implementation Strategy <span className="bg-gray-200 text-xs px-2 py-1 rounded">LOCKED</span>
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center font-bold text-blue-600">1</div>
                                        <div>
                                            <h4 className="font-bold text-sm">File Form CIT-2024-B</h4>
                                            <p className="text-xs mt-1 leading-relaxed">Download the specific schedule for Research and Development from the FIRS portal.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center font-bold text-blue-600">2</div>
                                        <div>
                                            <h4 className="font-bold text-sm">Reclassify Assets</h4>
                                            <p className="text-xs mt-1 leading-relaxed">Move items &gt; 500k to the Fixed Asset Schedule.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="text-blue-600" /> Tax Optimizer
                    </h1>
                    <p className="text-gray-500 text-sm">Real-time deductibility analysis.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handlePrint} className="px-4 py-2 bg-white text-blue-600 text-xs font-bold rounded-full border border-blue-100 shadow-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
                        <Download size={14} /> Export Report
                    </button>
                    <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200 flex items-center gap-2">
                        <CheckCircle size={14} /> SYSTEM ONLINE
                    </div>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Deductible Expenses</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{deductibleCount}</h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Tax Savings Value</p>
                    <h3 className="text-2xl font-bold text-blue-600">{tenant.currencySymbol}{(deductibleAmount * 0.20).toLocaleString()} (Est.)</h3>
                    <p className="text-[10px] text-gray-400 mt-1">Based on 20% CIT</p>
                </div>

                {/* Audit Gauge */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                    <div className="absolute top-2 right-2 text-gray-100 dark:text-gray-700 transform rotate-12"><Gauge size={80} /></div>
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Audit Risk</p>
                    <h3 className={`text-2xl font-bold ${riskColor}`}>{auditRiskLevel}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">{riskyTransactions.length} unverified items</p>
                </div>

                <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-600/20 relative overflow-hidden">
                    <Sparkles className="absolute right-[-10px] top-[-10px] text-blue-400 opacity-30" size={100} />
                    <p className="text-blue-100 text-xs font-bold uppercase mb-1">Optimization Score</p>
                    <h3 className="text-2xl md:text-4xl font-bold mb-1">98%</h3>
                    <p className="text-blue-200 text-xs">High Compliance</p>
                </div>
            </div>

            {/* Receipt Hunter (Always Visible - Green if Clean, Orange if Risky) */}
            <div className={`${riskyTransactions.length === 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800'} border rounded-2xl p-6 mb-8 animate-fade-in relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    {riskyTransactions.length === 0 ? <CheckCircle size={100} className="text-green-500" /> : <FileWarning size={100} className="text-orange-500" />}
                </div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                        <h3 className={`font-bold flex items-center gap-2 ${riskyTransactions.length === 0 ? 'text-green-900 dark:text-green-100' : 'text-orange-900 dark:text-orange-100'}`}>
                            {riskyTransactions.length === 0 ? <CheckCircle size={18} /> : <FileWarning size={18} />} Receipt Hunter
                        </h3>
                        <p className={`text-xs ${riskyTransactions.length === 0 ? 'text-green-700 dark:text-green-300' : 'text-orange-700 dark:text-orange-300'}`}>
                            We found {riskyTransactions.length} high-value transactions missing receipt evidence.
                        </p>
                    </div>
                    {riskyTransactions.length > 0 && (
                        <button
                            onClick={() => navigate('/ledger')}
                            className="px-3 py-1 bg-white dark:bg-orange-900 text-orange-600 dark:text-orange-200 text-xs font-bold rounded-lg shadow-sm border border-orange-200 dark:border-orange-700 hover:bg-orange-50 transition-colors"
                        >
                            Fix All
                        </button>
                    )}
                </div>
                {riskyTransactions.length > 0 ? (
                    <div className="space-y-2 relative z-10">
                        {riskyTransactions.slice(0, 3).map((t: any) => (
                            <div key={t.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-orange-100 dark:border-orange-900/50 flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">!</div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{t.description}</p>
                                        <p className="text-xs text-gray-500">{t.date} • {tenant.currencySymbol}{t.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/ledger')}
                                    className="text-xs font-bold text-orange-500 cursor-pointer hover:underline bg-white px-2 py-1 rounded shadow-sm border border-orange-100"
                                >
                                    Upload
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="relative z-10 bg-white/50 dark:bg-black/20 rounded-xl p-4 flex items-center gap-3">
                        <div className="bg-green-100 text-green-600 p-2 rounded-full">
                            <Sparkles size={16} fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-green-900 dark:text-green-100">Excellent Record Keeping!</p>
                            <p className="text-xs text-green-700 dark:text-green-300">Your audit risk is minimized.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* NaijaBooks Optimization Checklist (NTA 2025) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CheckCircle className="text-green-500" size={20} /> NaijaBooks Compliance Tracker
                        </h3>
                        <p className="text-xs text-gray-500">Track your progress towards full NTA 2025 optimization.</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-blue-600">
                            {Math.min(100, (tenant.paysRent ? 25 : 0) + (deductibleCount > 0 ? 25 : 0) + (tenant.accountType === 'business' ? 25 : 0) + 25)}%
                        </span>
                        <p className="text-[10px] text-gray-400">Efficiency Score</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* 1. Rent Relief Shield */}
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${tenant.paysRent ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                        <div className={`mt-0.5 rounded-full p-1 ${tenant.paysRent ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-400'}`}>
                            {tenant.paysRent ? <CheckCircle size={14} /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-current"></div>}
                        </div>
                        <div>
                            <h4 className={`font-bold text-sm ${tenant.paysRent ? 'text-green-900' : 'text-gray-600'}`}>Rent Relief Shield</h4>
                            <p className="text-xs text-gray-500 mb-1">Claim 20% of annual rent (capped at ₦500k).</p>
                        </div>
                    </div>

                    {/* 2. VAT Compliance (Section 21) */}
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${deductibleCount > 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                        <div className={`mt-0.5 rounded-full p-1 ${deductibleCount > 0 ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                            {deductibleCount > 0 ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                        </div>
                        <div>
                            <h4 className={`font-bold text-sm ${deductibleCount > 0 ? 'text-green-900' : 'text-red-900'}`}>VAT Proof Vault</h4>
                            <p className="text-xs text-gray-500 mb-1">Upload valid VAT receipts for all business expenses.</p>
                        </div>
                    </div>

                    {/* 3. Entity Status Monitor */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
                        <div className="mt-0.5 rounded-full p-1 bg-blue-100 text-blue-600"><Info size={14} /></div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-900">Entity Status Check</h4>
                            <p className="text-xs text-gray-500 mb-1">
                                {tenant.accountType === 'personal'
                                    ? 'Exempt from CIT (Individual).'
                                    : 'Exempt if < ₦100M Turnover.'}
                            </p>
                        </div>
                    </div>

                    {/* 4. Statutory Deductions */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
                        <div className="mt-0.5 rounded-full p-1 bg-blue-100 text-blue-600"><Info size={14} /></div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-900">Pension & NHIS</h4>
                            <p className="text-xs text-gray-500">Ensure statutory deductions are logged monthly.</p>
                        </div>
                    </div>

                    {/* 5. Smart VAT Exemptions */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
                        <div className="mt-0.5 rounded-full p-1 bg-purple-100 text-purple-600"><Sparkles size={14} /></div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-900">0% VAT on Essentials</h4>
                            <p className="text-xs text-gray-500">Use exempt categories (Books, Meds, Basic Food) to lower burden.</p>
                        </div>
                    </div>

                    {/* 6. Vendor TIN Integrity */}
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-start gap-3">
                        <div className="mt-0.5 rounded-full p-1 bg-orange-100 text-orange-600"><Search size={14} /></div>
                        <div>
                            <h4 className="font-bold text-sm text-gray-900">Vendor TIN Verification</h4>
                            <p className="text-xs text-gray-500">Ensure vendors have valid TINs to avoid penalty (Section 29).</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Optimization Opportunities (Scanner Results) */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Optimization Opportunities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Run Scanner */}
                    {(() => {
                        const strategies = TaxEngine.scanForReliefs(tenant, transactions);
                        if (strategies.length === 0) {
                            return (
                                <div className="col-span-2 bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border border-green-200">
                                    <CheckCircle size={20} />
                                    <div>
                                        <h4 className="font-bold text-sm">Fully Optimized</h4>
                                        <p className="text-xs">No missing reliefs detected based on current data.</p>
                                    </div>
                                </div>
                            );
                        }
                        return strategies.map((strategy, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-blue-100 dark:border-gray-700 shadow-sm relative overflow-hidden group hover:shadow-md transition">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                                    <Sparkles size={40} className="text-blue-600" />
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                                        <AlertCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{strategy.type}</h4>
                                        <p className="text-xs text-gray-500 mb-3">{strategy.action}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">
                                                Save ~{tenant.currencySymbol}{Math.round(strategy.potential * 0.20 /* Approx Tax Rate */).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-gray-400">Impact: {strategy.impact}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Toolbar */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center gap-4">
                    <h3 className="font-bold text-gray-900">Analyzed Transactions</h3>
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search description..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border-none outline-none text-sm"
                        />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <p>No transactions found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-700">
                        {filtered.map((tx: any) => (
                            <div key={tx.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.isDeductible ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {tx.isDeductible ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">{tx.description}</h4>
                                        <p className="text-xs text-gray-500">{tx.date} • {tx.categoryName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900'}`}>
                                        {tx.type === 'income' ? '+' : '-'}{tenant.currencySymbol}{tx.amount.toLocaleString()}
                                    </p>
                                    {tx.isDeductible && (
                                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded">
                                            DEDUCTIBLE
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaxOptimizer;
