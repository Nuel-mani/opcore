
import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { Sparkles, ArrowRight, Zap, CheckCircle } from 'lucide-react';

const OptimizationScanner: React.FC = () => {
    const { tenant, transactions } = useTenant();
    const [isScanning, setIsScanning] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);

    const runScan = () => {
        setIsScanning(true);
        const newSuggestions = [];

        // 1. Personal: Missing Rent Relief
        if (tenant.accountType === 'personal') {
            if (!tenant.paysRent) {
                newSuggestions.push({
                    title: "Missing Rent Relief",
                    desc: "You haven't claimed Rent Relief. You strictly need a specialized Rent Receipt to claim up to ₦500k deduction.",
                    action: "Update Profile",
                    impact: "High"
                });
            } else if (tenant.rentAmount && tenant.rentAmount < 100000) {
                newSuggestions.push({
                    title: "Low Rent Claim",
                    desc: "Your claimed rent seems low. Ensure you are claiming the full gross rent paid to landlord.",
                    impact: "Medium"
                });
            }
        }

        // 2. Business: R&D Check
        if (tenant.accountType !== 'personal') {
            const turnover = transactions
                .filter((t: any) => t.type === 'income')
                .reduce((acc: number, curr: any) => acc + curr.amount, 0);

            const hasRnD = transactions.some((t: any) => t.isRndExpense);

            if (!hasRnD && turnover > 1000000) {
                newSuggestions.push({
                    title: "R&D Deduction Missing",
                    desc: "Tech and Manufacturing companies can claim up to 5% of turnover as deductible R&D expense.",
                    action: "Review Expenses",
                    impact: "High"
                });
            }
        }

        setTimeout(() => {
            setSuggestions(newSuggestions);
            setIsScanning(false);
        }, 1500); // Fake Loading for "Scanning" feel
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Zap className="text-yellow-500 fill-yellow-500" size={18} />
                    Tax Optimization Scanner
                </h3>
            </div>

            {suggestions.length === 0 && !isScanning && (
                <div className="text-center py-6">
                    <p className="text-sm text-gray-500 mb-4">Run a diagnostic scan to find missed tax savings.</p>
                    <button
                        onClick={runScan}
                        className="bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg hover:scale-105 transition transform"
                    >
                        Run Smart Scan
                    </button>
                </div>
            )}

            {isScanning && (
                <div className="py-8 text-center animate-pulse">
                    <Sparkles className="mx-auto text-brand mb-2 animate-spin-slow" size={24} />
                    <p className="text-sm text-gray-500">Analyzing Transaction Patterns...</p>
                </div>
            )}

            {suggestions.length > 0 && !isScanning && (
                <div className="space-y-3 animate-fade-in">
                    {suggestions.map((s, idx) => (
                        <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex items-start gap-3 border border-blue-100 dark:border-blue-800">
                            <div className="mt-1 bg-white dark:bg-gray-800 p-1 rounded-full text-blue-600">
                                <ArrowRight size={14} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{s.title}</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                    <button onClick={() => setSuggestions([])} className="w-full text-xs text-gray-400 mt-2 hover:text-gray-600">Clear Results</button>
                </div>
            )}
        </div>
    );
};

export default OptimizationScanner;
