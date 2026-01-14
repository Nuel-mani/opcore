
import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { ShieldAlert, TrendingUp, Info } from 'lucide-react';

const TaxCliffMonitor: React.FC = () => {
    const { tenant, transactions } = useTenant();
    const [showSimulation, setShowSimulation] = useState(false);

    // Business Logic
    if (tenant.accountType !== 'personal') {
        const income = transactions
            .filter((t: any) => t.type === 'income')
            .reduce((acc: number, curr: any) => acc + curr.amount, 0);

        const THRESHOLD = 50000000; // 50M
        const WARNING = 45000000;   // 45M
        const distance = THRESHOLD - income;
        const isNear = distance > 0 && distance < (THRESHOLD - WARNING);
        const isOver = distance <= 0;

        const taxCost = isOver ? (income * 0.34) : 0; // 30% CIT + 4% Dev Levy approximately
        const taxCostNext = ((THRESHOLD + 1) * 0.34);

        if (!isNear && !isOver) return null; // No need to alarm if far away

        return (
            <div className={`p-6 rounded-xl border ${isOver ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'} animate-fade-in`}>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className={`text-lg font-bold flex items-center gap-2 ${isOver ? 'text-red-800' : 'text-yellow-800'}`}>
                            <ShieldAlert size={20} />
                            {isOver ? "Tax Cliff Bridged (Red Zone)" : "Approaching Tax Cliff"}
                        </h3>
                        <p className={`text-sm mt-1 ${isOver ? 'text-red-700' : 'text-yellow-700'}`}>
                            {isOver
                                ? `You have crossed the ₦50M Small Company Exemption Threshold.`
                                : `You are ${tenant.currencySymbol}${distance.toLocaleString()} away from the ₦50M CIT Cliff.`
                            }
                        </p>
                    </div>
                </div>

                <div className="mt-4 bg-white/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium opacity-80">Current Turnover</span>
                        <span className="font-bold text-lg">{tenant.currencySymbol}{income.toLocaleString()}</span>
                    </div>

                    {/* Simulation Toggle */}
                    <div className="flex items-center gap-2 my-3">
                        <label className="text-xs font-bold uppercase text-gray-500">What-If Simulation</label>
                        <button
                            onClick={() => setShowSimulation(!showSimulation)}
                            className="text-xs bg-white border border-gray-300 px-2 py-1 rounded shadow-sm hover:bg-gray-50 transition"
                        >
                            {showSimulation ? "Hide Analysis" : "Show Tax Cost"}
                        </button>
                    </div>

                    {showSimulation && (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center text-red-600">
                                <span>Tax Burden (If &gt; ₦50M):</span>
                                <span className="font-bold">~{tenant.currencySymbol}{taxCostNext.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Crossing ₦50,000,000 triggers full Companies Income Tax (CIT) at 30% on total profits, plus Education Tax. Staying under keeps you tax-exempt (0%).
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Personal Logic
    const grossIncome = tenant.annualIncome || 0;
    const THRESHOLD = 800000;
    const WARNING = 700000;

    if (grossIncome > WARNING && grossIncome < 2000000) { // Show for low-mid earners
        const isOver = grossIncome > THRESHOLD;
        return (
            <div className={`p-4 rounded-xl border mb-6 ${isOver ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-3">
                    <TrendingUp size={24} className={isOver ? "text-orange-600" : "text-green-600"} />
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-100">
                            {isOver ? "Exempt Band Exceeded" : "Tax Exempt Band"}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {isOver
                                ? `Income above ₦800k is taxed at 15%. optimize using Rent Relief.`
                                : `You are in the 0% tax band. Keep income under ₦800k to stay tax-free.`
                            }
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default TaxCliffMonitor;
