
import React from 'react';
import { useTenant } from '../context/TenantContext';
import { TrendingUp, AlertCircle, Lock } from 'lucide-react';

const ProAnalytics: React.FC = () => {
    const { tenant, transactions, budgets } = useTenant();

    if (tenant.subscriptionTier === 'free') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full mb-6">
                    <Lock size={64} className="text-gray-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Pro Analytics Locked</h2>
                <p className="max-w-md text-gray-600 dark:text-gray-400 mb-8">
                    Upgrade to the Pro Plan to access advanced budgeting, financial forecasting, and planned vs. actual reports.
                </p>
            </div>
        );
    }

    // Calculate Aggregates
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const startBalance = 1000000; // Mock starting balance
    const endBalance = startBalance + totalIncome - totalExpenses;

    // Budget Calculations
    const expenseBudgets = budgets.filter(b => b.type === 'expense');
    const incomeBudgets = budgets.filter(b => b.type === 'income');

    const getActualForCategory = (catName: string, type: 'income' | 'expense') => {
        return transactions
            .filter(t => t.type === type && (t.categoryName.includes(catName) || t.description.includes(catName)))
            .reduce((sum, t) => sum + t.amount, 0);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-10">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="text-brand">Financial</span> Monthly Budget
                    </h1>
                    <p className="text-gray-500 font-medium mt-1">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Starting balance</p>
                    <p className="text-xl font-bold text-gray-700 dark:text-gray-200">{tenant.currencySymbol}{startBalance.toLocaleString()}</p>
                </div>
            </div>

            {/* Top Cards: Balance & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Balance Chart (Start vs End) */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-center items-end gap-16 h-[200px] w-full mt-4">
                        {/* Start Balance */}
                        <div className="flex flex-col items-center gap-3 w-32 group">
                            <div className="w-full bg-[#2d3748] dark:bg-slate-600 rounded-t-sm relative transition-all duration-700 ease-out hover:opacity-90" style={{ height: '140px' }}>
                                {/* Tooltip */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                                    {tenant.currencySymbol}{startBalance.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">START BALANCE</p>
                                <p className="text-[10px] text-gray-500">{tenant.currencySymbol}{startBalance.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* End Balance */}
                        <div className="flex flex-col items-center gap-3 w-32 group">
                            <div
                                className="w-full bg-[#f97316] rounded-t-sm relative transition-all duration-700 ease-out hover:opacity-90"
                                style={{ height: `${Math.min(180, Math.max(20, (endBalance / startBalance) * 140))}px` }}
                            >
                                {/* Tooltip */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10">
                                    {tenant.currencySymbol}{endBalance.toLocaleString()}
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-bold text-[#f97316] uppercase tracking-wide">END BALANCE</p>
                                <p className="text-[10px] text-[#f97316]">{tenant.currencySymbol}{endBalance.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Card: Savings */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-8 rounded-xl flex flex-col justify-center items-center text-center border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                    {/* Decorative background visual */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-20"></div>

                    <h3 className="text-6xl font-light text-gray-400 mb-2 font-mono tracking-tighter">
                        {totalIncome > totalExpenses ? '+' : ''}{totalExpenses > 0 ? Math.round(((totalIncome - totalExpenses) / totalExpenses) * 100) : 0}%
                    </h3>
                    <p className="text-sm text-gray-500 italic mb-8">Increase in total savings</p>

                    <div className="w-4/5 border-t border-dashed border-gray-300 dark:border-gray-600 mb-8"></div>

                    <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {tenant.currencySymbol}{(totalIncome - totalExpenses).toLocaleString()}
                    </h2>
                    <p className="text-sm text-gray-500 uppercase tracking-widest text-[10px]">Saved this month</p>
                </div>
            </div>

            {/* Horizontal Bars: Income & Expenses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Expenses Bar */}
                <div>
                    <h3 className="text-lg font-bold text-[#f97316] mb-6">Expenses</h3>
                    <div className="space-y-4">
                        {/* Planned Row */}
                        <div className="grid grid-cols-[60px_1fr] gap-4 items-center">
                            <span className="text-xs font-medium text-gray-500">Planned</span>
                            <div className="flex items-center gap-3 w-full">
                                <span className="text-xs font-mono w-20 text-right">{tenant.currencySymbol}{(expenseBudgets.reduce((sum, b) => sum + b.plannedAmount, 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                <div className="h-4 bg-[#3b0a1e] rounded-sm w-full shadow-sm"></div>
                            </div>
                        </div>
                        {/* Actual Row */}
                        <div className="grid grid-cols-[60px_1fr] gap-4 items-center">
                            <span className="text-xs font-medium text-gray-500">Actual</span>
                            <div className="flex items-center gap-3 w-full">
                                <span className="text-xs font-mono w-20 text-right">{tenant.currencySymbol}{totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                <div
                                    className="h-4 bg-gray-400 rounded-sm shadow-sm transition-all duration-1000"
                                    style={{ width: `${Math.min(100, (totalExpenses / (expenseBudgets.reduce((sum, b) => sum + b.plannedAmount, 1) || 1)) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Income Bar */}
                <div>
                    <h3 className="text-lg font-bold text-[#f97316] mb-6">Income</h3>
                    <div className="space-y-4">
                        {/* Planned Row */}
                        <div className="grid grid-cols-[60px_1fr] gap-4 items-center">
                            <span className="text-xs font-medium text-gray-500">Planned</span>
                            <div className="flex items-center gap-3 w-full">
                                <span className="text-xs font-mono w-20 text-right">{tenant.currencySymbol}{(incomeBudgets.reduce((sum, b) => sum + b.plannedAmount, 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                <div className="h-4 bg-[#3b0a1e] rounded-sm w-full shadow-sm"></div>
                            </div>
                        </div>
                        {/* Actual Row */}
                        <div className="grid grid-cols-[60px_1fr] gap-4 items-center">
                            <span className="text-xs font-medium text-gray-500">Actual</span>
                            <div className="flex items-center gap-3 w-full">
                                <span className="text-xs font-mono w-20 text-right">{tenant.currencySymbol}{totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                <div
                                    className="h-4 bg-green-500 rounded-sm shadow-sm transition-all duration-1000"
                                    style={{ width: `${Math.min(100, (totalIncome / (incomeBudgets.reduce((sum, b) => sum + b.plannedAmount, 1) || 1)) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Annual Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

                {/* Annual Expenses Table */}
                <div className="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-orange-50/10">
                        <h3 className="text-brand font-bold text-lg">Annual Expenses</h3>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-[#fffbf7] dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-b-2 border-orange-200">
                            <tr>
                                <th className="text-left py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Totals</th>
                                <th className="text-right py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Planned</th>
                                <th className="text-right py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Actual</th>
                                <th className="text-right py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Diff.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {expenseBudgets.map((budget, idx) => {
                                const actual = getActualForCategory(budget.categoryName, 'expense');
                                const diff = budget.plannedAmount - actual;
                                return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="py-2 px-5 text-gray-800 dark:text-gray-200 font-medium bg-orange-50/20 dark:bg-transparent">
                                            {budget.categoryName}
                                        </td>
                                        <td className="py-2 px-5 text-right text-gray-500 font-mono text-xs">
                                            {tenant.currencySymbol}{budget.plannedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-5 text-right text-gray-900 dark:text-gray-100 font-mono font-bold text-xs">
                                            {tenant.currencySymbol}{actual.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`py-2 px-5 text-right font-mono text-xs font-bold ${diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                            {tenant.currencySymbol}{diff.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Annual Income Table */}
                <div className="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-orange-50/10 flex justify-between items-center">
                        <h3 className="text-brand font-bold text-lg">Annual Income</h3>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date().toLocaleString()}</span>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-[#fffbf7] dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-b-2 border-orange-200">
                            <tr>
                                <th className="text-left py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Totals</th>
                                <th className="text-right py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Planned</th>
                                <th className="text-right py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Actual</th>
                                <th className="text-right py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Diff.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {incomeBudgets.map((budget, idx) => {
                                const actual = getActualForCategory(budget.categoryName, 'income');
                                const diff = actual - budget.plannedAmount;
                                return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="py-2 px-5 text-gray-800 dark:text-gray-200 font-medium bg-orange-50/20 dark:bg-transparent">
                                            {budget.categoryName}
                                        </td>
                                        <td className="py-2 px-5 text-right text-gray-500 font-mono text-xs">
                                            {tenant.currencySymbol}{budget.plannedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-2 px-5 text-right text-gray-900 dark:text-gray-100 font-mono font-bold text-xs">
                                            {tenant.currencySymbol}{actual.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className={`py-2 px-5 text-right font-mono text-xs font-bold ${diff < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {tenant.currencySymbol}{diff.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detailed Monthly Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">

                {/* Monthly Income Table */}
                <div className="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-orange-50/10 flex justify-between items-center">
                        <h3 className="text-brand font-bold text-lg">Monthly Income</h3>
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date().toLocaleString()}</span>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-[#fffbf7] dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-b-2 border-orange-200">
                            <tr>
                                <th className="text-left py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Totals</th>
                                <th className="text-right py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Planned</th>
                                <th className="text-right py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Actual</th>
                                <th className="text-right py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Diff.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {incomeBudgets.map((budget, idx) => {
                                const actual = getActualForCategory(budget.categoryName, 'income'); // In this demo, Assuming Seed Data = This Month
                                const planned = budget.plannedAmount / 12; // Simple monthly division
                                const diff = actual - planned;
                                return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="py-2 px-5 text-gray-800 dark:text-gray-200 font-medium bg-orange-50/20 dark:bg-transparent">
                                            {budget.categoryName}
                                        </td>
                                        <td className="py-2 px-5 text-right text-gray-500 font-mono text-xs">
                                            {tenant.currencySymbol}{planned.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                                        </td>
                                        <td className="py-2 px-5 text-right text-gray-900 dark:text-gray-100 font-mono font-bold text-xs">
                                            {tenant.currencySymbol}{actual.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                                        </td>
                                        <td className={`py-2 px-5 text-right font-mono text-xs font-bold ${diff < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {tenant.currencySymbol}{diff.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Monthly Expenses Table */}
                <div className="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-orange-50/10">
                        <h3 className="text-brand font-bold text-lg">Monthly Expenses</h3>
                    </div>
                    <table className="w-full text-sm">
                        <thead className="bg-[#fffbf7] dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-b-2 border-orange-200">
                            <tr>
                                <th className="text-left py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Totals</th>
                                <th className="text-right py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Planned</th>
                                <th className="text-right py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Actual</th>
                                <th className="text-right py-3 px-5 font-bold text-gray-700 dark:text-gray-200">Diff.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {expenseBudgets.map((budget, idx) => {
                                const actual = getActualForCategory(budget.categoryName, 'expense'); // In this demo, Assuming Seed Data = This Month
                                const planned = budget.plannedAmount / 12; // Simple monthly division
                                const diff = planned - actual;
                                return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="py-2 px-5 text-gray-800 dark:text-gray-200 font-medium bg-orange-50/20 dark:bg-transparent">
                                            {budget.categoryName}
                                        </td>
                                        <td className="py-2 px-5 text-right text-gray-500 font-mono text-xs">
                                            {tenant.currencySymbol}{planned.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                                        </td>
                                        <td className="py-2 px-5 text-right text-gray-900 dark:text-gray-100 font-mono font-bold text-xs">
                                            {tenant.currencySymbol}{actual.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                                        </td>
                                        <td className={`py-2 px-5 text-right font-mono text-xs font-bold ${diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                            {tenant.currencySymbol}{diff.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProAnalytics;
