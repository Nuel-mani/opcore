
import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { CorporateTaxCalculator } from '../utils/taxEngine';
import { Building, TrendingUp, AlertTriangle, Briefcase, Zap, CheckCircle, Info, RefreshCw } from 'lucide-react';

const CorporateTaxEngine: React.FC = () => {
    const { tenant, transactions } = useTenant();

    // Aggregate Financials
    let totalIncome = transactions.filter(t => t.type === 'income' && t.wallet !== 'crypto').reduce((acc, t) => acc + t.amount, 0);
    let totalExpenses = transactions.filter(t => t.type === 'expense' && t.wallet !== 'crypto' && t.isDeductible).reduce((acc, t) => acc + t.amount, 0);

    const assessableProfit = Math.max(0, totalIncome - totalExpenses);

    // Capital Allowances Simulation (In a real app, this would come from a dedicated Asset Register module)
    // We simulate "Potential CA" based on assets tagged in TaxOptimizer
    const potentialCA = transactions
        .filter(t => t.isCapitalAsset)
        .reduce((acc, t) => acc + t.amount, 0) * 0.25; // Assuming average 25% write-down for demo

    // EDTI Simulation
    const qualifyingCapex = transactions
        .filter(t => t.isCapitalAsset && (tenant.sector === 'green_energy' || tenant.sector === 'ict'))
        .reduce((acc, t) => acc + t.amount, 0);

    // Initialize Engine
    const calculator = new CorporateTaxCalculator(
        totalIncome,
        assessableProfit,
        tenant.sector,
        tenant.totalAssets || 0
    );

    const levy = calculator.developmentLevy;
    const { cit, utilizableCA, restrictionApplied, totalProfit } = calculator.calculateCIT(potentialCA);
    const edtiCredit = calculator.calculateEDTICredit(qualifyingCapex);

    const totalLiability = Math.max(0, (levy + cit) - edtiCredit);

    if (!calculator.isLargeCompany && totalIncome < 50000000) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full mb-6">
                    <Building size={64} className="text-gray-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Fiscal Engine Standby</h2>
                <p className="max-w-md text-gray-600 dark:text-gray-400 mb-8">
                    This engine activates for companies with turnover {'>'}₦50M or Special Sectors.
                    You are currently in the <strong>Small Company (Exempt)</strong> or <strong>Medium</strong> bracket.
                </p>
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
                    Keep logging revenue—this module will unlock automatically when you cross the ₦50M threshold.
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="text-brand">Fiscal Liability</span> Engine
                    </h1>
                    <p className="text-gray-500 mt-1">NTA 2025 "30 + 4" Rule Implementation for Large Companies.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Engine Active</span>
                    </div>
                </div>
            </div>

            {/* Main Liability Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-brand text-brand-contrast rounded-2xl shadow-xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
                        <Building size={200} />
                    </div>

                    <p className="text-brand-contrast/80 font-medium mb-1">Total Estimated Liability (FY 2025)</p>
                    <h2 className="text-5xl font-bold mb-6">
                        {tenant.currencySymbol}{totalLiability.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </h2>

                    <div className="grid grid-cols-2 gap-6 mt-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-xs opacity-70 uppercase tracking-wider mb-1">Dev. Levy (4%)</p>
                            <p className="text-xl font-bold">{tenant.currencySymbol}{levy.toLocaleString()}</p>
                            <p className="text-[10px] opacity-60 mt-1">On Assessable Profit</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <p className="text-xs opacity-70 uppercase tracking-wider mb-1">CIT (30%)</p>
                            <p className="text-xl font-bold">{tenant.currencySymbol}{cit.toLocaleString()}</p>
                            <p className="text-[10px] opacity-60 mt-1">On Total Profit</p>
                        </div>
                    </div>

                    {edtiCredit > 0 && (
                        <div className="mt-4 bg-green-500/20 border border-green-500/30 p-3 rounded-lg flex items-center gap-3">
                            <Zap size={18} className="text-green-300" />
                            <div>
                                <p className="text-sm font-bold">EDTI Credit Applied: -{tenant.currencySymbol}{edtiCredit.toLocaleString()}</p>
                                <p className="text-xs opacity-80">Economic Development Tax Incentive ({tenant.sector})</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Logic & Restrictions Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <Briefcase size={18} className="text-brand" /> Engine Logic
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Assessable Profit</span>
                                <span className="font-mono text-gray-900 dark:text-white">{tenant.currencySymbol}{assessableProfit.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm relative">
                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    Less: Capital Allowances
                                    {restrictionApplied && <AlertTriangle size={12} className="text-orange-500" />}
                                </span>
                                <span className="font-mono text-red-500">({tenant.currencySymbol}{utilizableCA.toLocaleString()})</span>
                            </div>

                            {restrictionApplied && (
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-xs text-orange-700 dark:text-orange-300">
                                    <strong>Restriction Active:</strong> CA capped at 2/3rds of profit because sector is '{tenant.sector}'.
                                </div>
                            )}

                            <div className="border-t border-dashed border-gray-300 dark:border-gray-600 my-2"></div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-gray-700 dark:text-gray-300">Total Profit (Tax Base)</span>
                                <span className="font-mono font-bold text-gray-900 dark:text-white">{tenant.currencySymbol}{totalProfit.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex gap-2">
                        <Info size={16} className="shrink-0 mt-0.5" />
                        <p>
                            <strong>New Asset Classes:</strong> Software purchases {'>'}₦1m are now capitalized (4 years). Vehicles (4 years).
                        </p>
                    </div>
                </div>
            </div>

            {/* R&D and Asset Waterfall */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-6">Optimization Waterfall</h3>

                <div className="space-y-6">
                    {/* R&D */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300">R&D Optimization (Cap: 5% Turnover)</span>
                            <span className="text-gray-500">
                                {tenant.currencySymbol}{transactions.filter(t => t.isRndExpense).reduce((a, b) => a + b.amount, 0).toLocaleString()} / {tenant.currencySymbol}{(totalIncome * 0.05).toLocaleString()}
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-purple-500 h-full rounded-full"
                                style={{ width: `${Math.min(100, (transactions.filter(t => t.isRndExpense).reduce((a, b) => a + b.amount, 0) / (totalIncome * 0.05)) * 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Capital Allowances */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Capital Allowance Utilization</span>
                            <span className="text-gray-500">
                                {restrictionApplied ? "Restricted (66.6%)" : "Full Offset (100%)"}
                            </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full ${restrictionApplied ? 'bg-orange-500' : 'bg-green-500'}`}
                                style={{ width: restrictionApplied ? '66.6%' : '100%' }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CorporateTaxEngine;
