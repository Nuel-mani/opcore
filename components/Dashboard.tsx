import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComplianceTip } from './ComplianceTips';
import { useTenant } from '../context/TenantContext';
import ReceiptScanner from './ReceiptScanner';
import ProcessingQueue from './ProcessingQueue';
import { Camera, Plus, ArrowUpCircle, ArrowDownCircle, ShieldCheck, AlertTriangle, Building, Zap, X, Save, Sparkles, Loader2, Upload, Info, FileText, Users, BarChart3, CheckSquare, Bell, FileWarning } from 'lucide-react';
import { analyzeExpenseWithGemini } from '../services/geminiService';
import { TaxEngine } from '../utils/TaxEngine';
import { Skeleton } from './ui/Skeleton';

const Dashboard: React.FC = () => {
    const { tenant, transactions, invoices, addTransaction, addTransactions, taxRules, isOnline, isInitializing } = useTenant() as any;
    const navigate = useNavigate();

    // Loading State
    if (isInitializing) {
        return (
            <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center mb-8">
                    <div className="space-y-2">
                        <Skeleton width={200} height={32} />
                        <Skeleton width={150} height={16} />
                    </div>
                    <Skeleton width={100} height={32} className="rounded-full" />
                </div>

                {/* Tax Cliff Skeleton */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 h-48">
                    <div className="flex justify-between mb-6">
                        <Skeleton width={200} height={24} />
                        <Skeleton width={300} height={16} />
                    </div>
                    <Skeleton width="100%" height={16} className="mb-4 rounded-full" />
                </div>

                {/* Concierge Skeleton */}
                <Skeleton height={100} className="rounded-2xl" />

                {/* Net Profit Skeleton */}
                <div className="rounded-2xl h-64 bg-gray-100 dark:bg-gray-800 animate-pulse"></div>

                {/* Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton height={140} className="rounded-2xl" />
                        <Skeleton height={140} className="rounded-2xl" />
                        <Skeleton height={140} className="rounded-2xl" />
                        <Skeleton height={140} className="rounded-2xl" />
                    </div>
                    <Skeleton height="100%" className="rounded-2xl min-h-[300px]" />
                </div>
            </div>
        );
    }
    const actionItems = React.useMemo(() => {
        const items = [];

        // 1. Check Receipt Evidence
        const riskyCount = (transactions || []).filter((t: any) => t.amount > 50000 && !t.receiptImageUrl && !t.hasVatEvidence).length;
        if (riskyCount > 0) {
            items.push({
                icon: <FileWarning size={14} className="text-orange-500" />,
                text: <span>Verify <strong>{riskyCount} high-value expenses</strong> missing receipts.</span>,
                action: () => navigate('/tax-optimizer')
            });
        }

        // 2. Check Overdue Invoices
        const overdueCount = (invoices || []).filter((inv: any) => inv.status === 'overdue' || (inv.status === 'pending' && new Date(inv.dueDate) < new Date())).length;
        if (overdueCount > 0) {
            items.push({
                icon: <AlertTriangle size={14} className="text-red-500" />,
                text: <span>You have <strong>{overdueCount} overdue invoices</strong> to follow up.</span>,
                action: () => navigate('/invoices')
            });
        }

        // 3. VAT Status (Generic or Calculated)
        const currentMonth = new Date().getMonth();
        const vatDue = (transactions || [])
            .filter((t: any) => new Date(t.date).getMonth() === currentMonth)
            .reduce((acc: number, t: any) => acc + (t.vatAmount || 0), 0) -
            (transactions || []).filter((t: any) => t.isDeductible).reduce((acc: number, t: any) => acc + (t.amount * 0.075), 0);

        if (vatDue > 0) {
            items.push({
                icon: <CheckSquare size={14} className="text-blue-500" />,
                text: <span>VAT Remittance for this month is approx <strong>{tenant.currencySymbol}{Math.max(0, vatDue).toLocaleString()}</strong>.</span>,
                action: () => navigate('/fiscal-engine')
            });
        } else {
            items.push({
                icon: <CheckSquare size={14} className="text-green-500" />,
                text: <span>VAT Position is <strong>Healthy</strong> (No payment due yet).</span>,
                action: () => { }
            });
        }

        return items.slice(0, 3);
    }, [transactions, invoices, tenant.currencySymbol, navigate]);

    // Manual Entry / Snap & Log State
    const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
    const [draftImage, setDraftImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

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

    // 2. Optional: AI Assist
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

        const categoryName = taxRules.find((r: any) => r.id === formData.categoryId)?.categoryName || 'Uncategorized';

        addTransaction({
            id: `tx - ${Date.now()} `,
            date: formData.date,
            type: 'expense',
            amount: parseFloat(formData.amount),
            categoryId: formData.categoryId,
            categoryName: categoryName,
            description: formData.description,
            receiptImageUrl: draftImage || undefined,
            isDeductible: true,
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

    // Aggregations
    const safeTransactions = transactions || [];
    const income = safeTransactions
        .filter((t: any) => t.type === 'income')
        .reduce((acc: number, curr: any) => acc + curr.amount, 0);

    const expense = safeTransactions
        .filter((t: any) => t.type === 'expense')
        .reduce((acc: number, curr: any) => acc + curr.amount, 0);

    const netProfit = income - expense;

    // New SME Logic (Safeguard Tenant)
    // New SME Logic (Safeguard Tenant)
    const smeStatus = (() => {
        if (!tenant?.sector) return { code: 'exempt', status: 'Unknown', message: 'Sector not defined' };
        const cliff = TaxEngine.checkTaxCliff(income, 'business');
        // Map Cliff Status to SME Status format
        if (cliff.status === 'crossed') return { code: 'taxable', status: 'Taxable', message: cliff.message };
        if (cliff.status === 'warning') return { code: 'warning', status: 'Warning', message: cliff.message };
        return { code: 'exempt', status: 'Small Company - Exempt', message: cliff.message };
    })();
    const TARGET_THRESHOLD = 50000000;
    const progressPercent = Math.min((income / TARGET_THRESHOLD) * 100, 100);

    const isPersonal = tenant?.accountType === 'personal';

    return (
        <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 animate-fade-in pb-20">
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

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {(() => {
                            const hr = new Date().getHours();
                            if (hr < 12) return 'Good Morning,';
                            if (hr < 18) return 'Good Afternoon,';
                            return 'Good Evening,';
                        })()} {tenant.businessName}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        System Operational • All Systems Go
                    </p>
                </div>
                {!isPersonal && (
                    <div className={`text - xs px - 3 py - 1.5 rounded - full font - bold border flex items - center gap - 2 self - start
                ${smeStatus.code === 'exempt' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' : ''}
                ${smeStatus.code === 'warning' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' : ''}
                ${smeStatus.code === 'taxable' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' : ''}
`}>
                        {smeStatus.code === 'exempt' && <ShieldCheck size={14} />}
                        {smeStatus.code === 'warning' && <AlertTriangle size={14} />}
                        {smeStatus.code === 'taxable' && <Building size={14} />}
                        {smeStatus.status}
                    </div>
                )}
            </div>

            {/* Tax Cliff Monitor (NTA 2025 Compliance) */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                            {isPersonal ? 'Tax Free Limit Watch' : 'Turnover Watch (The ₦100m Trap)'}
                        </h3>
                        {!isPersonal && <ComplianceTip type="general" trigger={<Info size={14} className="text-gray-400 hover:text-blue-500 cursor-help" />} />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[50%] text-right">
                        {isPersonal
                            ? 'Monitor your proximity to the Personal Income Tax threshold (₦800k).'
                            : 'Monitor your proximity to the NTA 2025 Small Company Exemption (₦100M).'}
                    </p>
                </div>

                {/* Status Badge based on Cliff Analysis */}
                <div className="mb-4">
                    {(() => {
                        const analysis = TaxEngine.checkTaxCliff(income, isPersonal ? 'personal' : 'business');
                        return (
                            <div className={`text-xs px-3 py-1.5 rounded-full font-bold border inline-flex items-center gap-2
                                ${analysis.color === 'green-500' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                ${analysis.color === 'yellow-500' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                                ${analysis.color === 'red-500' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                            `}>
                                {analysis.message}
                            </div>
                        );
                    })()}
                </div>

                {/* Progress Bar */}
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    <span>₦0</span>
                    <span className="text-right">Target: {isPersonal ? '₦800k' : '₦100M'}</span>
                </div>

                <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative mb-2">
                    <div
                        className={`h-full transition-all duration-1000 ease-out relative z-10 
                            ${TaxEngine.checkTaxCliff(income, isPersonal ? 'personal' : 'business').color.includes('red') ? 'bg-red-500' : (TaxEngine.checkTaxCliff(income, isPersonal ? 'personal' : 'business').color.includes('yellow') ? 'bg-yellow-400' : 'bg-green-400')}
                        `}
                        style={{
                            width: `${Math.min(100, Math.max(2, (income / (isPersonal ? 800000 : 100000000)) * 100))}%`
                        }}
                    ></div>
                </div>

                {/* Markers */}
                <div className="flex justify-end gap-8 text-[10px] text-gray-400 font-mono mb-6">
                    <span>Warning ({isPersonal ? '700k' : '90m'})</span>
                    <span>Limit ({isPersonal ? '800k' : '100m'})</span>
                </div>

                {/* Cost of Crossing Calculator (Business Only - NTA 2025 Feature) */}
                {!isPersonal && income >= 90000000 && (
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 mt-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="text-red-900 font-bold text-sm mb-1">Cost of Crossing Monitor</h4>
                                <p className="text-red-700/80 text-xs mb-3">
                                    Crossing ₦100m removes your 0% Tax Status.
                                    <br />Current Potential Liability: <span className="font-bold">₦0</span>
                                </p>
                                <div className="p-3 bg-white rounded border border-red-200 shadow-sm">
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Impact of One More Transaction</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-600">If you hit ₦100,000,001:</span>
                                        <span className="text-sm font-bold text-red-600">You pay ~₦3.4M Tax</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 italic">30% CIT + 4% Dev Levy applies instantly.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Smart Concierge (New Feature) */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
                <div className="flex items-start gap-4 w-full">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm text-indigo-600 shrink-0">
                        <Bell size={24} />
                    </div>
                    <div className="w-full">
                        <h3 className="font-bold text-gray-900 dark:text-white">OpCore Concierge</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">I've found {actionItems.length} actionable items for you today:</p>
                        <ul className="space-y-2">
                            {actionItems.map((item, i) => (
                                <li key={i} onClick={item.action} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-white/50 dark:hover:bg-gray-800/50 p-1.5 rounded-lg transition-colors">
                                    {item.icon}
                                    {item.text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                {actionItems.length > 0 && (
                    <button
                        onClick={actionItems[0].action}
                        className="px-6 py-2 bg-white dark:bg-gray-800 text-indigo-600 font-bold text-sm rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-50 transition-colors whitespace-nowrap self-end md:self-center"
                    >
                        View Action Plan
                    </button>
                )}
            </div>

            {/* Net Profit Card */}
            <div className="text-white rounded-2xl shadow-xl p-8 mb-8 relative overflow-hidden" style={{ backgroundColor: tenant.themeColor || tenant.brandColor || '#2252c9' }}>
                {/* Decorative Circles */}
                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-20px] left-[20%] w-40 h-40 bg-black opacity-5 rounded-full blur-xl"></div>

                <p className="text-white/80 font-medium mb-2 text-sm">
                    {isPersonal ? 'Net Savings (This Month)' : 'Net Profit (This Month)'}
                </p>
                <h3 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight">
                    {tenant.currencySymbol}{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h3>

                <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="bg-green-400/20 p-1 rounded-full text-green-100"><ArrowUpCircle size={16} /></div>
                            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Income</span>
                        </div>
                        <p className="text-xl font-bold">{tenant.currencySymbol}{income.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="bg-red-400/20 p-1 rounded-full text-red-100"><ArrowDownCircle size={16} /></div>
                            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Expenses</span>
                        </div>
                        <p className="text-xl font-bold">{tenant.currencySymbol}{expense.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Command Center (Quick Actions) */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setIsScannerOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-2xl shadow-lg shadow-blue-500/20 flex flex-col items-center justify-center gap-3 transition-transform active:scale-95 group"
                    >
                        <div className="p-3 bg-white/20 rounded-xl group-hover:rotate-12 transition-transform">
                            <Camera size={24} />
                        </div>
                        <span className="font-bold text-sm">Snap Receipt</span>
                    </button>

                    <button
                        onClick={() => navigate('/invoices')}
                        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 transition-colors group"
                    >
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition-transform">
                            <FileText size={24} />
                        </div>
                        <span className="font-bold text-sm text-gray-700 dark:text-gray-200">New Invoice</span>
                    </button>

                    <button
                        onClick={() => navigate('/analytics')}
                        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 transition-colors group"
                    >
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                            <BarChart3 size={24} />
                        </div>
                        <span className="font-bold text-sm text-gray-700 dark:text-gray-200">Insights</span>
                    </button>

                    <button
                        onClick={openManualEntry}
                        className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 transition-colors group"
                    >
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                            <Zap size={24} />
                        </div>
                        <span className="font-bold text-sm text-gray-700 dark:text-gray-200">Quick Log</span>
                    </button>
                </div>

                {/* Recent Activity Feed */}
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-2xl shadow-sm h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Recent Activity</h3>
                        <button className="text-xs text-blue-500 font-bold hover:underline">View All</button>
                    </div>

                    {safeTransactions.length === 0 ? (
                        <div className="flex-1 flex flex-col justify-center items-center text-center opacity-50 space-y-2">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <Sparkles size={16} className="text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-400">No transactions yet.<br />Snap a receipt to start!</p>
                        </div>
                    ) : (
                        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar max-h-[200px]">
                            {safeTransactions.slice(0, 5).map((tx: any) => (
                                <div key={tx.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tx.type === 'income'
                                            ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {tx.type === 'income' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[120px]" title={tx.description}>
                                                {tx.description}
                                            </p>
                                            <p className="text-[10px] text-gray-500">{tx.date}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xs font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900 dark:text-white'
                                            }`}>
                                            {tx.type === 'income' ? '+' : '-'}{tenant.currencySymbol}{(tx.amount || 0).toLocaleString()}
                                        </p>
                                        {tx.hasVatEvidence && (
                                            <span className="text-[9px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                                                VAT
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Offline Entry Modal */}
            {
                isEntryModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            {/* Modal Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Camera size={20} style={{ color: tenant.themeColor }} /> Log Expense
                                </h3>
                                <button onClick={() => setIsEntryModalOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto space-y-4">
                                {draftImage && (
                                    <div className="w-full h-40 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center mb-4 border border-gray-200 dark:border-gray-700 relative group">
                                        <img src={draftImage} alt="Receipt" className="h-full w-auto object-contain" />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-400 font-bold">{tenant.currencySymbol}</span>
                                            <input
                                                type="number"
                                                className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white font-bold"
                                                placeholder="0.00"
                                                value={formData.amount}
                                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date</label>
                                        <input
                                            type="date"
                                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#d9a47a] outline-none dark:text-white"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Vendor / Description</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#d9a47a] outline-none dark:text-white"
                                            placeholder="e.g. Total Petrol Station"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                        {/* Optional AI Button */}
                                        {isOnline && (
                                            <button
                                                onClick={handleAiAssist}
                                                disabled={!formData.description || isAnalyzing}
                                                className="px-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition flex items-center justify-center border border-purple-100"
                                                title="Auto-Categorize (Online Only)"
                                            >
                                                {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category</label>
                                    <select
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#d9a47a] outline-none dark:text-white"
                                        value={formData.categoryId}
                                        onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                    >
                                        <option value="other">Uncategorized / Other</option>
                                        {taxRules.map((rule: any) => (
                                            <option key={rule.id} value={rule.id}>{rule.categoryName}</option>
                                        ))}
                                    </select>
                                </div>

                                {formData.deductionTip && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                                        <div className="shrink-0 mt-0.5"><Zap size={14} className="fill-blue-500 text-blue-500" /></div>
                                        {formData.deductionTip}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex gap-3">
                                <button
                                    onClick={() => setIsEntryModalOpen(false)}
                                    className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEntry}
                                    disabled={!formData.amount || !formData.description}
                                    className="flex-1 py-3 text-white font-bold text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-sm"
                                    style={{ backgroundColor: tenant.themeColor }}
                                >
                                    <Save size={18} /> Save Entry
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Processing Queue Widget */}
            <ProcessingQueue />

        </div >
    );
};

export default Dashboard;
