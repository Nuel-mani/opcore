import React from 'react';
import { Info, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';

type TipType = 'transaction_integrity' | 'smart_deductibility' | 'gift_vs_income' | 'general';

interface ComplianceTipProps {
    type: TipType;
    trigger?: React.ReactNode;
}

const TIPS = {
    transaction_integrity: {
        title: "Transaction Integrity Check",
        citation: "NTAA 2025 Section 29",
        content: "Paying a vendor? Verify their TIN matches their Business Name exactly. Doing business with an unregistered entity carries a ₦5 Million Penalty.",
        icon: <ShieldCheck className="text-blue-600" size={18} />
    },
    smart_deductibility: {
        title: "Smart Deductibility Rule",
        citation: "NTA 2025 Section 21(p)",
        content: "No VAT Receipt = No Deduction. The 'Handshake Rule' is dead. You need a valid VAT proof to claim this expense, otherwise your tax liability increases.",
        icon: <FileText className="text-orange-600" size={18} />
    },
    gift_vs_income: {
        title: "Gift vs. Income Clarifier",
        citation: "NTA 2025 (Chargeable Income)",
        content: "Corporate transfers are rarely 'gifts'. A significant inflow from a company account will be treated as taxable income unless proven otherwise.",
        icon: <AlertTriangle className="text-red-600" size={18} />
    }
};

export const ComplianceTip: React.FC<ComplianceTipProps> = ({ type, trigger }) => {
    const tip = TIPS[type] || TIPS['transaction_integrity'];

    return (
        <div className="group relative inline-block">
            {trigger || <Info size={14} className="text-gray-400 hover:text-blue-500 cursor-help" />}

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-xl border border-blue-100 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                <div className="flex items-start gap-3 mb-2">
                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg shrink-0">
                        {tip.icon}
                    </div>
                    <div>
                        <h4 className="font-bold text-xs text-gray-900 dark:text-white leading-tight">{tip.title}</h4>
                        <span className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                            {tip.citation}
                        </span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {tip.content}
                </p>
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-r border-b border-blue-100 dark:border-gray-700 transform rotate-45"></div>
            </div>
        </div>
    );
};
