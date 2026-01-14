import React, { useMemo } from 'react';
import { useTenant } from '../context/TenantContext';
import { TrendingUp, TrendingDown, PiggyBank, ArrowRight, Brain, PieChart, Printer } from 'lucide-react';

export const ProAnalytics: React.FC = () => {
    const { tenant, transactions, isFeatureLocked, startingBalance } = useTenant() as any;
    const isLocked = isFeatureLocked('advanced_ledger');

    // --- Real-Time MoM Logic ---
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const isThisMonth = (d: Date) => d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    const isLastMonth = (d: Date) => d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;

    // --- Calculations ---
    const totalIncome = transactions
        .filter((t: any) => t.type === 'income' && isThisMonth(new Date(t.date)))
        .reduce((acc: number, t: any) => acc + t.amount, 0);

    const totalExpense = transactions
        .filter((t: any) => t.type === 'expense' && isThisMonth(new Date(t.date)))
        .reduce((acc: number, t: any) => acc + t.amount, 0);

    const lastMonthIncome = transactions
        .filter((t: any) => t.type === 'income' && isLastMonth(new Date(t.date)))
        .reduce((acc: number, t: any) => acc + t.amount, 0);

    const lastMonthExpense = transactions
        .filter((t: any) => t.type === 'expense' && isLastMonth(new Date(t.date)))
        .reduce((acc: number, t: any) => acc + t.amount, 0);

    const endBalance = startingBalance + totalIncome - totalExpense; // Should really be cumulative, but for Monthly View: this is Net Flow
    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    // --- Aggregations for Tables (vs Last Month) ---
    const incomeCategories = useMemo(() => {
        const cats: Record<string, { current: number, last: number }> = {};

        transactions.filter((t: any) => t.type === 'income').forEach((t: any) => {
            const d = new Date(t.date);
            const key = t.categoryName || 'Other';
            if (!cats[key]) cats[key] = { current: 0, last: 0 };

            if (isThisMonth(d)) cats[key].current += t.amount;
            if (isLastMonth(d)) cats[key].last += t.amount;
        });

        return Object.entries(cats)
            .filter(([_, data]) => data.current > 0 || data.last > 0) // Hide empty
            .map(([name, data]) => ({
                name,
                actual: data.current,
                planned: data.last, // Reusing 'planned' field name for 'Last Month' to minimize UI rework or rename it? Better rename.
                comparisonLabel: 'vs Last Month',
                diff: data.current - data.last
            })).sort((a, b) => b.actual - a.actual);
    }, [transactions]);

    const expenseCategories = useMemo(() => {
        const cats: Record<string, { current: number, last: number }> = {};

        transactions.filter((t: any) => t.type === 'expense').forEach((t: any) => {
            const d = new Date(t.date);
            const key = t.categoryName || 'Other';
            if (!cats[key]) cats[key] = { current: 0, last: 0 };

            if (isThisMonth(d)) cats[key].current += t.amount;
            if (isLastMonth(d)) cats[key].last += t.amount;
        });

        return Object.entries(cats)
            .filter(([_, data]) => data.current > 0 || data.last > 0)
            .map(([name, data]) => ({
                name,
                actual: data.current,
                planned: data.last,
                comparisonLabel: 'vs Last Month',
                diff: data.current - data.last
            })).sort((a, b) => b.actual - a.actual);
    }, [transactions]);

    // --- OpCore Intelligence Logic ---
    const burnRate = totalExpense > 0 ? totalExpense : (lastMonthExpense > 0 ? lastMonthExpense : 1);
    const runwayMonths = endBalance > 0 ? (endBalance / burnRate).toFixed(1) : '0.0';

    // Find biggest spender spike
    const spikeCategory = expenseCategories.find(c => c.diff > 0);
    const spikeInsight = spikeCategory
        ? `${spikeCategory.name} up ${((spikeCategory.diff / (spikeCategory.planned || 1)) * 100).toFixed(0)}%`
        : "Stable spending patterns";

    // Donut Chart Logic (CSS Conic Gradient)
    const donutGradient = useMemo(() => {
        if (totalExpense === 0) return 'conic-gradient(#f3f4f6 0% 100%)';

        let currentDeg = 0;
        const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6']; // Blue, Red, Orange, Green, Indigo, Purple

        const segments = expenseCategories.slice(0, 5).map((cat, i) => {
            const percent = (cat.actual / totalExpense) * 100;
            const deg = (percent / 100) * 360;
            const start = currentDeg;
            const end = currentDeg + deg;
            currentDeg = end;
            return `${colors[i % colors.length]} ${start}deg ${end}deg`;
        });

        return `conic-gradient(${segments.join(', ')}, #f3f4f6 ${currentDeg}deg 360deg)`;
    }, [expenseCategories, totalExpense]);

    const handlePrint = () => {
        window.print();
    };

    if (isLocked) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-[60vh] text-center">
                <div className="bg-blue-50 p-6 rounded-full mb-6 relative">
                    <PiggyBank size={48} className="text-blue-500" />
                    <div className="absolute top-0 right-0 p-1 bg-red-500 rounded-full border-2 border-white"></div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Financial Insights Locked</h2>
                <p className="text-gray-500 max-w-md mb-8">Upgrade to Business Pro to see your monthly budget performance and savings analysis.</p>
                <button className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors">
                    Upgrade to Pro
                </button>
            </div>
        );
    }

    const currentDate = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                        <span className="text-blue-600">Financial</span> Monthly Budget
                    </h1>
                    <p className="text-gray-500 font-medium text-lg mt-1">{currentDate}</p>
                </div>
                <div className="text-right hidden md:block group cursor-pointer" onClick={handlePrint}>
                    <div className="flex items-center gap-2 text-gray-400 group-hover:text-blue-600 transition-colors mb-1 justify-end">
                        <Printer size={14} />
                        <span className="text-xs font-bold uppercase tracking-widest">EXPORT REPORT</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white group-hover:scale-105 transition-transform origin-right">
                        {tenant.currencySymbol}{startingBalance.toLocaleString()}
                    </h2>
                </div>
            </div>

            {/* OpCore Intelligence Card */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-[2rem] p-8 text-white shadow-xl mb-12 relative overflow-hidden print:bg-white print:text-black print:border print:border-black">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Brain size={200} />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                            <Brain className="text-blue-300" size={24} />
                        </div>
                        <h3 className="font-bold text-lg tracking-wide uppercase text-blue-200">OpCore Intelligence</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <p className="text-blue-300 text-xs font-bold uppercase mb-1">Estimated Runway</p>
                            <div className="text-4xl font-bold mb-1">{runwayMonths} <span className="text-lg font-medium text-blue-300">Months</span></div>
                            <p className="text-blue-200/60 text-xs">Based on current burn rate of {tenant.currencySymbol}{burnRate.toLocaleString()}/mo</p>
                        </div>

                        <div>
                            <p className="text-blue-300 text-xs font-bold uppercase mb-1">Spend Alert</p>
                            <div className="text-2xl font-bold mb-1 line-clamp-1">{spikeInsight}</div>
                            <p className="text-blue-200/60 text-xs">Highest value jump vs last month</p>
                        </div>

                        <div>
                            <p className="text-blue-300 text-xs font-bold uppercase mb-1">Efficiency Score</p>
                            <div className="flex items-center gap-2">
                                <div className="text-4xl font-bold">{savingsRate > 20 ? 'A+' : (savingsRate > 0 ? 'B' : 'Needs Work')}</div>
                                <div className={`px-2 py-1 rounded text-xs font-bold ${savingsRate > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                    {savingsRate.toFixed(0)}% Savings
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Cards Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">

                {/* Balance Visualization */}
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-10 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center min-h-[300px]">
                    <div className="flex items-end gap-12 h-40">
                        {/* Start Bar */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-24 bg-slate-700 dark:bg-slate-600 rounded-t-lg shadow-xl" style={{ height: '100px' }}></div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">START BALANCE</p>
                                <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">{tenant.currencySymbol}{startingBalance.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* End Bar */}
                        <div className="flex flex-col items-center gap-3">
                            <div
                                className={`w-24 rounded-t-lg shadow-xl transition-all duration-700 ${endBalance >= startingBalance ? 'bg-blue-500' : 'bg-red-400'}`}
                                style={{ height: `${Math.max(40, Math.min(160, (endBalance / (startingBalance || 1)) * 100))}px` }}
                            ></div>
                            <div className="text-center">
                                <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${endBalance >= startingBalance ? 'text-blue-500' : 'text-red-400'}`}>END BALANCE</p>
                                <p className={`font-bold text-sm ${endBalance >= startingBalance ? 'text-blue-600' : 'text-red-500'}`}>{tenant.currencySymbol}{endBalance.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Savings Widget */}
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-10 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-6xl md:text-7xl font-light text-gray-900 dark:text-white mb-2 tracking-tighter">
                            {savingsRate.toFixed(0)}%
                        </h3>
                        <p className="text-gray-400 italic font-medium">
                            {savings > 0 ? 'Increase in total savings' : 'Decrease in savings'}
                        </p>

                        <div className="mt-8">
                            <h4 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                                {tenant.currencySymbol}{Math.abs(savings).toLocaleString()}
                            </h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SAVED THIS MONTH</p>
                        </div>
                    </div>

                    <div className="relative z-10 opacity-10 md:opacity-100">
                        <PiggyBank size={180} className="text-gray-100 dark:text-gray-700 stroke-[1.5]" />
                    </div>
                </div>
            </div>

            {/* Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
                <div>
                    <h3 className="text-orange-500 font-bold mb-4 flex items-center gap-2">Expenses</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-2">
                                <span>Last Month</span>
                                <span>{tenant.currencySymbol}{lastMonthExpense.toLocaleString()}</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-800 dark:bg-slate-500 rounded-full w-full"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-2">
                                <span>This Month</span>
                                <span>{tenant.currencySymbol}{totalExpense.toLocaleString()}</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-200 dark:bg-gray-600 rounded-full" style={{ width: `${lastMonthExpense > 0 ? Math.min((totalExpense / lastMonthExpense) * 100, 100) : 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-blue-500 font-bold mb-4 flex items-center gap-2">Income</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-2">
                                <span>Last Month</span>
                                <span>{tenant.currencySymbol}{lastMonthIncome.toLocaleString()}</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-slate-800 dark:bg-slate-500 rounded-full w-full"></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase mb-2">
                                <span>This Month</span>
                                <span>{tenant.currencySymbol}{totalIncome.toLocaleString()}</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gray-200 dark:bg-gray-600 rounded-full" style={{ width: `${lastMonthIncome > 0 ? Math.min((totalIncome / lastMonthIncome) * 100, 100) : 0}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Expenses Table with Donut */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-orange-500 font-bold flex items-center gap-2">
                            <PieChart size={18} />
                            Expense Composition
                        </h3>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Donut Chart */}
                        <div className="relative w-48 h-48 flex-shrink-0">
                            <div
                                className="w-full h-full rounded-full"
                                style={{ background: donutGradient }}
                            ></div>
                            <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-full flex flex-col items-center justify-center">
                                <span className="text-xs text-gray-400 uppercase font-bold">Total</span>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{tenant.currencySymbol}{(totalExpense / 1000).toFixed(1)}k</span>
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 w-full overflow-x-auto">
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {expenseCategories.slice(0, 5).map((cat, i) => (
                                        <tr key={i}>
                                            <td className="py-3 text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#6366f1'][i % 5] }}></div>
                                                {cat.name}
                                            </td>
                                            <td className="py-3 text-right font-bold text-gray-900 dark:text-white">{cat.actual.toLocaleString()}</td>
                                            <td className={`py-3 text-right font-mono text-xs ${cat.diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                {cat.diff > 0 ? '+' : ''}{(cat.diff / 1000).toFixed(0)}k
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {expenseCategories.length > 5 && (
                                <p className="text-xs text-center text-gray-400 mt-4 italic">+ {expenseCategories.length - 5} other categories</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Income Table */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-blue-500 font-bold mb-6">Monthly Income Breakdown</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700">
                                    <th className="text-left py-3 font-semibold text-gray-900 dark:text-white">Source</th>
                                    <th className="text-right py-3 font-medium text-gray-500">Last Month</th>
                                    <th className="text-right py-3 font-bold text-gray-900 dark:text-white">This Month</th>
                                    <th className="text-right py-3 font-medium text-green-400">Diff.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                {incomeCategories.length > 0 ? incomeCategories.map((cat, i) => (
                                    <tr key={i}>
                                        <td className="py-4 text-gray-600 dark:text-gray-300">{cat.name}</td>
                                        <td className="py-4 text-right text-gray-400">{cat.planned.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                        <td className="py-4 text-right font-bold text-gray-900 dark:text-white">{cat.actual.toLocaleString()}</td>
                                        <td className={`py-4 text-right font-mono text-xs ${cat.diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {cat.diff > 0 ? '+' : ''}{cat.diff.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-400 italic">No income data recorded yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProAnalytics;
