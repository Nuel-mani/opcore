import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import ReceiptScanner from './ReceiptScanner';
import ProcessingQueue from './ProcessingQueue';
import { Camera, Plus, ArrowUpCircle, ArrowDownCircle, ShieldCheck, AlertTriangle, Building, TrendingDown, Info, Zap, X, Save, Sparkles, Loader2 } from 'lucide-react';
import { analyzeExpenseWithGemini } from '../services/geminiService';
import { calculatePIT_NTA2025, calculatePIT_Old, checkSMEStatus } from '../utils/taxEngine';
import { generateSeedData } from '../utils/seedData';
import RentReliefCard from './RentReliefCard';

const Dashboard: React.FC = () => {
    const { tenant, transactions, addTransaction, addTransactions, clearTransactions, taxRules, isOnline } = useTenant() as any;

    // Manual Entry / Snap & Log State
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [draftImage, setDraftImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        categoryId: 'other',
        deductionTip: ''
    });

    // 1. Capture Image (Works Offline)
    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            setDraftImage(reader.result as string);
            setIsEntryModalOpen(true);
            // Reset form but keep date
            setFormData(prev => ({ ...prev, description: '', amount: '', categoryId: 'other', deductionTip: '' }));
        };
        reader.readAsDataURL(file);
    };

    // 2. Optional: AI Assist for Description/Category (Only if Online)
    const handleAiAssist = async () => {
        if (!formData.description) return;
        setIsAnalyzing(true);
        try {
            const analysis = await analyzeExpenseWithGemini(formData.description, tenant.countryCode, taxRules);
            setFormData(prev => ({
                ...prev,
                categoryId: analysis.categoryId,
                deductionTip: analysis.advice
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // 3. Save Transaction
    const handleSaveEntry = () => {
        if (!formData.amount || !formData.description) return;

        const categoryName = taxRules.find(r => r.id === formData.categoryId)?.categoryName || 'Uncategorized';

        addTransaction({
            id: `tx-${Date.now()}`,
            date: formData.date,
            type: 'expense',
            amount: parseFloat(formData.amount),
            categoryId: formData.categoryId,
            categoryName: categoryName,
            description: formData.description,
            receiptImageUrl: draftImage || undefined,
            isDeductible: true, // Defaulting to true for manual, user can edit in Optimizer
            deductionTip: formData.deductionTip || 'Manual Entry',
            wallet: 'operations'
        });

        setIsEntryModalOpen(false);
        setDraftImage(null);
    };

    const openManualEntry = () => {
        setDraftImage(null);
        setIsEntryModalOpen(true);
        setFormData({
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            categoryId: 'other',
            deductionTip: ''
        });
    };

    // ------------------------------------------
    // RENDER: PERSONAL DASHBOARD (Salary Earner)
    // ------------------------------------------
    if (tenant.accountType === 'personal') {
        const grossIncome = tenant.annualIncome || 0;
        const pension = tenant.pensionContribution || 0;
        const rent = tenant.rentAmount || 0;

        const taxNew = calculatePIT_NTA2025(grossIncome, pension, rent);
        const taxOld = calculatePIT_Old(grossIncome, pension);
        const savings = taxOld - taxNew.taxPayable;
        const isSaving = savings > 0;

        return (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">NTA 2025 Tax Impact</h2>
                        <p className="text-gray-500 dark:text-gray-400">Jurisdiction: {tenant.residenceState} State IRS</p>
                    </div>
                    {tenant.isTaxExempt && (
                        <div className="px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full flex items-center gap-2 text-sm font-bold">
                            <ShieldCheck size={16} /> Tax Exempt (Income {'<'} ₦800k)
                        </div>
                    )}
                </div>

                {/* Impact Calculator Card & Rent Vault */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Calculator */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                Tax Simulator
                            </h3>
                            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500">Finance Act 2024</span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <span className="text-sm text-gray-500 dark:text-gray-400">Old Tax Law (PITA 2011)</span>
                                <span className="font-bold text-gray-900 dark:text-white">{tenant.currencySymbol}{taxOld.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-brand/10 dark:bg-brand/20 rounded-lg border border-brand/20">
                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">New NTA 2025 Law</span>
                                <span className="font-bold text-brand">{tenant.currencySymbol}{taxNew.taxPayable.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>

                            <div className={`flex items-center gap-3 p-4 rounded-lg mt-2 ${isSaving ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {isSaving ? <TrendingDown size={24} /> : <ArrowUpCircle size={24} />}
                                <div>
                                    <p className="font-bold text-lg">
                                        {isSaving ? 'You Save ' : 'You Pay '}
                                        {tenant.currencySymbol}{Math.abs(savings).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs opacity-80">{isSaving ? 'New 0% band on first ₦800k helps!' : 'Higher income brackets affected.'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rent Relief Vault (Extracted Component) */}
                    <RentReliefCard />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                    <Info size={20} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-blue-800 dark:text-blue-300 text-sm">Why did my tax change?</h4>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                            The Consolidated Relief Allowance (CRA) has been replaced. You now get a specific Rent Relief (capped at 500k) and a 0% tax rate on your first ₦800,000 of income.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ------------------------------------------
    // RENDER: BUSINESS DASHBOARD (Existing)
    // ------------------------------------------

    // Aggregations
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const expense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0);

    const netProfit = income - expense;

    // New SME Logic
    const smeStatus = checkSMEStatus(income, tenant.sector);
    const TARGET_THRESHOLD = 50000000;
    const progressPercent = Math.min((income / TARGET_THRESHOLD) * 100, 100);

    const [isScannerOpen, setIsScannerOpen] = useState(false);

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8 animate-fade-in relative z-10 font-sans">
            {/* Scanner Modal */}
            <ReceiptScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onSave={async (tx) => {
                    if (addTransaction) {
                        // @ts-ignore
                        await addTransaction(tx);
                        alert("Transaction Saved Successfully!");
                    }
                }}
            />

            {/* Processing Queue Widget */}
            <ProcessingQueue />

            {/* Offline Entry Modal */}
            {isEntryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Camera size={20} className="text-brand" /> Log Expense
                            </h3>
                            <button onClick={() => setIsEntryModalOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-4">
                            {draftImage && (
                                <div className="w-full h-40 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center mb-4 border border-gray-200 dark:border-gray-700">
                                    <img src={draftImage} alt="Receipt" className="h-full w-auto object-contain" />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-400">{tenant.currencySymbol}</span>
                                        <input
                                            type="number"
                                            className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand outline-none dark:text-white"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand outline-none dark:text-white"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Vendor / Description</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand outline-none dark:text-white"
                                        placeholder="e.g. Total Petrol Station"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                    {/* Optional AI Button */}
                                    {isOnline && (
                                        <button
                                            onClick={handleAiAssist}
                                            disabled={!formData.description || isAnalyzing}
                                            className="px-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition flex items-center justify-center"
                                            title="Auto-Categorize (Online Only)"
                                        >
                                            {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category</label>
                                <select
                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand outline-none dark:text-white"
                                    value={formData.categoryId}
                                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                >
                                    <option value="other">Uncategorized / Other</option>
                                    {taxRules.map(rule => (
                                        <option key={rule.id} value={rule.id}>{rule.categoryName}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.deductionTip && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                                    <Info size={14} className="shrink-0 mt-0.5" />
                                    {formData.deductionTip}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex gap-3">
                            <button
                                onClick={() => setIsEntryModalOpen(false)}
                                className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEntry}
                                disabled={!formData.amount || !formData.description}
                                className="flex-1 py-3 bg-brand text-brand-contrast font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
                            >
                                <Save size={18} /> Save Entry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Business Dashboard</h2>
                    <p className="text-gray-500 dark:text-gray-400">Overview for {tenant.businessName}</p>
                    {tenant.taxIdentityNumber && (
                        <div className="mt-2 inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-md text-xs font-mono font-bold border border-emerald-200 dark:border-emerald-800">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            ID: {tenant.taxIdentityNumber}
                        </div>
                    )}
                </div>
                <div className={`text-sm px-3 py-1 rounded-full font-mono border flex items-center gap-2 self-start
            ${smeStatus.code === 'exempt' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800' : ''}
            ${smeStatus.code === 'warning' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-800' : ''}
            ${smeStatus.code === 'taxable' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-800' : ''}
        `}>
                    {smeStatus.code === 'exempt' && <ShieldCheck size={14} />}
                    {smeStatus.code === 'warning' && <AlertTriangle size={14} />}
                    {smeStatus.code === 'taxable' && <Building size={14} />}
                    {smeStatus.status}
                </div>
            </div>


            {/* DEMO DATA LOADER */}
            <div className="flex justify-end">
                <button
                    disabled={isAnalyzing} // Reuse analyzing state or add new one if preferred, will add local state
                    onClick={async () => {
                        if (!confirm('This will add ~20 dummy transactions. Continue?')) return;

                        try {
                            const data = generateSeedData();
                            console.log(`Generating ${data.length} transactions...`);

                            if (addTransactions) {
                                await addTransactions(data);
                            } else {
                                alert("Batch insert unavailable, using slow loop...");
                                for (const tx of data) {
                                    addTransaction(tx);
                                }
                            }
                            alert(`Success! Loaded ${data.length} transactions. Check the Analytics tab.`);
                        } catch (e: any) {
                            console.error(e);
                            alert(`Error loading data: ${e.message}`);
                        }
                    }}
                    className="text-xs font-bold text-brand bg-brand/10 hover:bg-brand/20 px-3 py-1 rounded-full transition flex items-center gap-1 disabled:opacity-50"
                >
                    <Sparkles size={12} /> Load Real-Life Test Data (65M Turnover)
                </button>
            </div>


            {/* Turnover Tracker Card */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-end mb-2">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-200">Turnover Watch (The ₦50m Trap)</h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Target: ₦50M</span>
                </div>

                <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 flex">
                        <div className="w-[90%] bg-green-500/10 border-r border-white/20" title="Green Zone (0-45m)"></div>
                        <div className="w-[10%] bg-orange-500/10" title="Warning Zone (45-50m)"></div>
                    </div>
                    <div
                        className={`h-full transition-all duration-1000 ease-out relative z-10 
                    ${smeStatus.code === 'exempt' ? 'bg-green-500' : ''}
                    ${smeStatus.code === 'warning' ? 'bg-orange-500' : ''}
                    ${smeStatus.code === 'taxable' ? 'bg-red-500' : ''}
                `}
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>

                <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                    <span>₦0</span>
                    <span className="text-center ml-24">Warning (45m)</span>
                    <span>Threshold (50m)</span>
                </div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    Current Turnover: <span className="font-bold text-gray-900 dark:text-white">{tenant.currencySymbol}{income.toLocaleString()}</span>.
                    <br />
                    <span className={`font-semibold ${smeStatus.code === 'exempt' ? 'text-green-600' :
                        smeStatus.code === 'warning' ? 'text-orange-600' : 'text-red-600'
                        }`}>
                        {smeStatus.message}
                    </span>
                </p>
            </div>

            {/* Main Stats Card */}
            <div className="bg-brand text-brand-contrast rounded-2xl shadow-xl p-6 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                    <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
                </div>

                <p className="text-brand-contrast/80 font-medium mb-1">Net Profit (This Month)</p>
                <h3 className="text-4xl md:text-5xl font-bold mb-6">
                    {tenant.currencySymbol}{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3">
                        <div className="bg-green-400/20 p-2 rounded-full text-green-100">
                            <ArrowUpCircle size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-brand-contrast/70">Income</p>
                            <p className="font-semibold">{tenant.currencySymbol}{income.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3">
                        <div className="bg-red-400/20 p-2 rounded-full text-red-100">
                            <ArrowDownCircle size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-brand-contrast/70">Expenses</p>
                            <p className="font-semibold">{tenant.currencySymbol}{expense.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Snap & Log Card (Replacing the old AI scan card) */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-xl shadow-sm flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md relative overflow-hidden">
                    <Camera className="text-gray-400 dark:text-gray-500" size={32} />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Snap & Log Expense</span>
                    <p className="text-xs text-gray-500 text-center">Works Offline • Capture Now, Categorize Later</p>
                    <div className="flex gap-2 w-full mt-2">
                        <button
                            onClick={() => setIsScannerOpen(true)}
                            className="flex-1 bg-brand text-brand-contrast py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 hover:brightness-110 transition"
                        >
                            Camera / Upload
                        </button>
                        <button
                            onClick={openManualEntry}
                            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center gap-1"
                        >
                            <Zap size={12} className="text-yellow-500" /> Manual
                        </button>
                    </div>
                </div>

                {/* Add Manual Transaction */}
                <button
                    onClick={() => openManualEntry()}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand dark:hover:border-brand p-6 rounded-xl shadow-sm flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md group"
                >
                    <Plus className="text-gray-400 dark:text-gray-500 group-hover:text-brand" size={32} />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Quick Entry</span>
                    <p className="text-xs text-gray-500 text-center">No Receipt? Log cash expenses fast.</p>
                </button>
            </div>
        </div >
    );
};

export default Dashboard;
