
import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { User, Briefcase, ChevronRight, ShieldCheck, AlertTriangle, Zap } from 'lucide-react';
import { Tenant, AccountType, BusinessStructure, Sector, TurnoverBand } from '../types';

const LoginScreen: React.FC = () => {
    const { login } = useTenant();
    const [step, setStep] = useState<'role' | 'form'>('role');
    const [selectedRole, setSelectedRole] = useState<AccountType | null>(null);

    // Form States
    const [name, setName] = useState('');
    const [taxId, setTaxId] = useState(''); // Unified ID State
    const [startPro, setStartPro] = useState(true); // Default to true for testing

    // Personal
    const [state, setState] = useState('Lagos');
    const [paysRent, setPaysRent] = useState<string>('yes'); // 'yes' | 'no'
    const [rentAmount, setRentAmount] = useState('');
    const [pension, setPension] = useState('');
    const [income, setIncome] = useState('');

    // Business
    const [structure, setStructure] = useState<BusinessStructure>('sole_prop');
    const [sector, setSector] = useState<Sector>('general');
    const [turnover, setTurnover] = useState<TurnoverBand>('micro');

    const handleRoleSelect = (role: AccountType) => {
        setSelectedRole(role);
        setStep('form');
    };

    const handleComplete = () => {
        if (!selectedRole) return;

        const baseProfile: Partial<Tenant> = {
            businessName: name,
            taxIdentityNumber: taxId, // Save Tax ID
            accountType: selectedRole,
            countryCode: 'NG',
            currencySymbol: '₦',
            subscriptionTier: startPro ? 'pro' : 'free',
            brandColor: '#2563eb', // Default blue
        };

        if (selectedRole === 'personal') {
            const numIncome = parseFloat(income) || 0;
            login({
                ...baseProfile,
                residenceState: state,
                paysRent: paysRent === 'yes',
                rentAmount: paysRent === 'yes' ? (parseFloat(rentAmount) || 0) : 0,
                pensionContribution: parseFloat(pension) || 0,
                annualIncome: numIncome,
                isTaxExempt: numIncome <= 800000,
                turnoverBand: 'micro', // Irrelevant for personal but needed for type safety
                sector: 'general'
            });
        } else {
            // Business Logic Logic
            let finalTurnover = turnover;
            let isTrapped = false;

            // The "Professional Services" Trap
            if (structure === 'limited' && sector === 'professional_services') {
                isTrapped = true;
                // Even if turnover is low, NTA 2025 often disqualifies them from small company exemptions
                // For simulation, we force them to Medium (Taxable) if they selected micro/small
                if (turnover !== 'medium') {
                    finalTurnover = 'medium';
                }
            }

            login({
                ...baseProfile,
                businessStructure: structure,
                sector: sector,
                turnoverBand: finalTurnover,
                brandColor: '#ea580c', // Default Orange for Business
            });

            if (isTrapped) {
                alert("Compliance Alert: Professional Services Companies (Legal, Medical, Accounting) are excluded from Small Company Exemptions under NTA 2025. Your account has been set to Taxable Status.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col">

                {/* Header */}
                <div className="bg-brand p-8 text-brand-contrast text-center">
                    <h1 className="text-3xl font-bold mb-2">Welcome to OpCore</h1>
                    <p className="opacity-90">Bookkeeping & Tax Compliance for Nigeria</p>
                </div>

                <div className="flex-1 p-8 flex flex-col justify-center">
                    {step === 'role' && (
                        <div className="animate-fade-in">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
                                How will you use OpCore?
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Personal Card */}
                                <button
                                    onClick={() => handleRoleSelect('personal')}
                                    className="flex flex-col items-center p-8 border-2 border-gray-100 dark:border-gray-700 rounded-xl hover:border-brand hover:bg-blue-50 dark:hover:bg-gray-700 transition group text-center"
                                >
                                    <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                                        <User size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">I earn a Salary</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                                        Optimize PAYE tax, claim Rent Relief, and track personal expenses.
                                    </p>
                                </button>

                                {/* Business Card */}
                                <button
                                    onClick={() => handleRoleSelect('business')}
                                    className="flex flex-col items-center p-8 border-2 border-gray-100 dark:border-gray-700 rounded-xl hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-gray-700 transition group text-center"
                                >
                                    <div className="h-16 w-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                                        <Briefcase size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">I run a Business</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                                        Send invoices, track business expenses, and manage Company Tax (CIT/VAT).
                                    </p>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'form' && selectedRole === 'personal' && (
                        <div className="max-w-md mx-auto w-full animate-fade-in space-y-4">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Profile</h2>
                                <p className="text-sm text-gray-500">We need a few details to set up your Tax Wallet.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="e.g. Adewale Johnson"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">National ID Number (NIN)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                                    placeholder="e.g. 12345678901"
                                    value={taxId}
                                    onChange={e => setTaxId(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State of Residence</label>
                                <select
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={state}
                                    onChange={e => setState(e.target.value)}
                                >
                                    <option value="Lagos">Lagos (LIRS)</option>
                                    <option value="Abuja">Abuja (FCT-IRS)</option>
                                    <option value="Rivers">Rivers (RIRS)</option>
                                    <option value="Ogun">Ogun (OGIRS)</option>
                                    <option value="Other">Other</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Personal Income Tax is payable to your State of Residence.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Do you pay Rent?</label>
                                <div className="flex gap-4 mb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="rent" value="yes" checked={paysRent === 'yes'} onChange={() => setPaysRent('yes')} />
                                        <span className="dark:text-white">Yes</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="rent" value="no" checked={paysRent === 'no'} onChange={() => setPaysRent('no')} />
                                        <span className="dark:text-white">No</span>
                                    </label>
                                </div>
                                {paysRent === 'yes' && (
                                    <div className="animate-fade-in">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Annual Rent Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-500">₦</span>
                                            <input
                                                type="number"
                                                className="w-full pl-8 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="e.g. 1200000"
                                                value={rentAmount}
                                                onChange={e => setRentAmount(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-xs text-green-600 mt-1">Needed for NTA 2025 Rent Relief Calculation.</p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Annual Pension Contribution</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₦</span>
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="e.g. 250000"
                                        value={pension}
                                        onChange={e => setPension(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Annual Income</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">₦</span>
                                    <input
                                        type="number"
                                        className="w-full pl-8 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="e.g. 1500000"
                                        value={income}
                                        onChange={e => setIncome(e.target.value)}
                                    />
                                </div>
                                {parseFloat(income) <= 800000 && parseFloat(income) > 0 && (
                                    <p className="text-xs text-green-600 mt-1 font-bold flex items-center gap-1">
                                        <ShieldCheck size={12} /> Tax Exempt Status (Income {'<'} ₦800k)
                                    </p>
                                )}
                            </div>

                            {/* Pro Toggle */}
                            <div className="bg-brand/10 dark:bg-brand/20 p-3 rounded-lg border border-brand/20">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={startPro}
                                        onChange={e => setStartPro(e.target.checked)}
                                        className="h-5 w-5 text-brand rounded focus:ring-brand"
                                    />
                                    <div className="text-sm">
                                        <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            Test "Paid" Version <Zap size={14} className="text-yellow-500" />
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Start with 'Pro' tier unlocked</p>
                                    </div>
                                </label>
                            </div>

                            <button
                                onClick={handleComplete}
                                disabled={!name || !income}
                                className="w-full bg-brand text-brand-contrast py-3 rounded-lg font-bold mt-4 hover:opacity-90 disabled:opacity-50"
                            >
                                Create Personal Account
                            </button>
                        </div>
                    )}

                    {step === 'form' && selectedRole === 'business' && (
                        <div className="max-w-md mx-auto w-full animate-fade-in space-y-4">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Business Profile</h2>
                                <p className="text-sm text-gray-500">Configure your CIT and VAT status.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="e.g. Lagos Ventures Ltd"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unified Tax ID (RC/BN/TIN)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
                                    placeholder="e.g. RC-12345678"
                                    value={taxId}
                                    onChange={e => setTaxId(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Structure</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                        value={structure}
                                        onChange={e => setStructure(e.target.value as BusinessStructure)}
                                    >
                                        <option value="sole_prop">Sole Proprietorship</option>
                                        <option value="limited">Limited Company (LTD)</option>
                                        <option value="freelancer">Freelancer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sector</label>
                                    <select
                                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                        value={sector}
                                        onChange={e => setSector(e.target.value as Sector)}
                                    >
                                        <option value="general">General Trade</option>
                                        <option value="services">Services</option>
                                        <option value="manufacturing">Manufacturing</option>
                                        <option value="agriculture">Agriculture</option>
                                        <option value="professional_services">Professional Services</option>
                                    </select>
                                </div>
                            </div>
                            {sector === 'professional_services' && structure === 'limited' && (
                                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs flex items-start gap-2">
                                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                    <span>Note: Professional Services Companies are excluded from Small Company Exemptions.</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Annual Turnover</label>
                                <select
                                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={turnover}
                                    onChange={e => setTurnover(e.target.value as TurnoverBand)}
                                >
                                    <option value="micro">Under ₦25 Million (VAT Exempt)</option>
                                    <option value="small">₦25M - ₦50M (VAT Only)</option>
                                    <option value="medium">Over ₦50 Million (Fully Taxable)</option>
                                </select>
                            </div>

                            {/* Pro Toggle */}
                            <div className="bg-brand/10 dark:bg-brand/20 p-3 rounded-lg border border-brand/20">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={startPro}
                                        onChange={e => setStartPro(e.target.checked)}
                                        className="h-5 w-5 text-brand rounded focus:ring-brand"
                                    />
                                    <div className="text-sm">
                                        <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            Test "Paid" Version <Zap size={14} className="text-yellow-500" />
                                        </span>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Start with 'Pro' tier unlocked</p>
                                    </div>
                                </label>
                            </div>

                            <button
                                onClick={handleComplete}
                                disabled={!name}
                                className="w-full bg-brand text-brand-contrast py-3 rounded-lg font-bold mt-4 hover:opacity-90 disabled:opacity-50"
                            >
                                Create Business Account
                            </button>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-900 p-4 text-center text-xs text-gray-400 border-t dark:border-gray-700">
                    {step === 'form' && (
                        <button onClick={() => setStep('role')} className="text-brand hover:underline mb-2">Back to Role Selection</button>
                    )}
                    <p>OpCore complies with Finance Act 2024 and Personal Income Tax Act (PITA) 2011.</p>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
