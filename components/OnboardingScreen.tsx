import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, Briefcase, Lock, Mail, ShieldCheck, CheckCircle, Smartphone, Globe, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Tenant, AccountType, BusinessStructure, Sector, TurnoverBand } from '../types';
import { useNavigate } from 'react-router-dom';

const OnboardingScreen: React.FC = () => {
    const { register, loading } = useAuth();
    const navigate = useNavigate();

    // State
    const [accountType, setAccountType] = useState<AccountType>('personal');
    const [showPassword, setShowPassword] = useState(false);

    // Core Auth
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);

    // Contact Data 
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');

    // Tax Data (NTA 2025)
    const [taxId, setTaxId] = useState('');

    // Personal Specific
    const [state, setState] = useState('Lagos');
    const [paysRent, setPaysRent] = useState<string>('yes');
    const [rentAmount, setRentAmount] = useState('');
    const [pension, setPension] = useState('');
    const [income, setIncome] = useState('');

    // Business Specific
    const [structure, setStructure] = useState<BusinessStructure>('sole_prop');
    const [sector, setSector] = useState<string>('general');
    const [turnover, setTurnover] = useState<TurnoverBand>('micro');
    const [availableSectors, setAvailableSectors] = useState<{ name: string }[]>([
        { name: 'general' }, { name: 'agriculture' }, { name: 'manufacturing' },
        { name: 'tech' }, { name: 'retail' }, { name: 'finance' },
        { name: 'education' }, { name: 'health' }
    ]);

    React.useEffect(() => {
        const fetchSectors = async () => {
            try {
                // Use relative path if proxied, or fully qualified if needed. 
                // Assuming Vite proxy is set or we use full URL. 
                // Since this component uses useAuth which might have a base URL, let's use a standard fetch for now or reuse base.
                const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/api';
                const res = await fetch(`${API_BASE}/api/sectors`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setAvailableSectors(data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch sectors", error);
            }
        };
        fetchSectors();
    }, []);

    const handleComplete = () => {
        if (!agreeToTerms) return;
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        const baseProfile: Partial<Tenant> = {
            businessName: name,
            taxIdentityNumber: taxId || 'PENDING', // Allow pending if user skips in UI (though we should encourage it)
            accountType: accountType,
            countryCode: 'NG',
            currencySymbol: '₦',
            subscriptionTier: 'free',
            brandColor: '#2252c9', // Strict Blue Theme
            themeColor: '#2252c9',
            businessAddress: address,
            phoneNumber: phone
        };

        if (accountType === 'personal') {
            const numIncome = parseFloat(income) || 0;
            register({
                ...baseProfile,
                email,
                password,
                residenceState: state,
                paysRent: paysRent === 'yes',
                rentAmount: paysRent === 'yes' ? (parseFloat(rentAmount) || 0) : 0,
                annualIncome: numIncome,
                isTaxExempt: numIncome <= 800000,
                turnoverBand: 'micro',
                sector: 'salary earner'
            });
        } else {
            // Business Logic
            let finalTurnover = turnover;
            register({
                ...baseProfile,
                email,
                password,
                businessStructure: structure,
                sector: sector,
                turnoverBand: finalTurnover,
            });
        }
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden min-h-[700px] flex flex-col md:flex-row">

                {/* Left Panel: Brand & Specs */}
                <div className="w-full md:w-5/12 bg-gradient-to-br from-blue-600 to-blue-800 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <ShieldCheck className="text-white" size={24} />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">OpCore</span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-6">
                            Simplify your Tax & <br /> Bookkeeping today.
                        </h1>
                        <p className="text-blue-100 text-lg opacity-90 leading-relaxed mb-8">
                            Automated compliance with Finance Act 2024. Whether you earn a salary or run a business, we've got you covered.
                        </p>

                        <div className="space-y-6 hidden md:block">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-500/50 p-2 rounded-lg mt-1">
                                    <CheckCircle size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Offline-First</h3>
                                    <p className="text-blue-100 text-sm">Access your data anytime, anywhere without internet.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-500/50 p-2 rounded-lg mt-1">
                                    <ShieldCheck size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Fully Compliant</h3>
                                    <p className="text-blue-100 text-sm">Updated for NTA 2025 regulations.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 text-xs text-blue-200 mt-12 hidden md:block">
                        &copy; 2025 OpCore Systems Nigeria Ltd.
                    </div>
                </div>

                {/* Right Panel: Form */}
                <div className="w-full md:w-7/12 p-8 md:p-12 overflow-y-auto max-h-[90vh]">
                    <div className="max-w-md mx-auto">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create your account</h2>
                        <p className="text-gray-500 mb-8">Join thousands of Nigerians simplifying their taxes.</p>

                        {/* Tabs */}
                        <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl flex mb-8">
                            <button
                                onClick={() => setAccountType('personal')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${accountType === 'personal' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <User size={18} /> Personal
                            </button>
                            <button
                                onClick={() => setAccountType('business')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${accountType === 'business' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Briefcase size={18} /> Business
                            </button>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Briefcase className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={accountType === 'personal' ? "e.g. Adebayo Johnson" : "e.g. Lagos Ventures Ltd"}
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="•••••••••••••••••"
                                            className="w-full pl-11 pr-10 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <RefreshCw className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            placeholder="•••••••••••••••••"
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                    <input
                                        type="text"
                                        placeholder="123 Street Name"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        placeholder="+234..."
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* NTA 2025 Data Collection Section */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">
                                    {accountType === 'personal' ? 'Tax Profile (NTA 2025)' : 'Company Details'}
                                </p>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Tax ID / NIN</label>
                                            <input type="text" value={taxId} onChange={e => setTaxId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm" placeholder="Optional" />
                                        </div>
                                        {accountType === 'personal' ? (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Annual Income</label>
                                                <input type="number" value={income} onChange={e => setIncome(e.target.value)} className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm" placeholder="Est. Annual" />
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Turnover Band</label>
                                                    <select value={turnover} onChange={e => setTurnover(e.target.value as any)} className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                                        <option value="micro">Micro (&lt;25M)</option>
                                                        <option value="small">Small (&lt;100M)</option>
                                                        <option value="medium">Medium (&lt;500M)</option>
                                                        <option value="large">Large (&gt;500M)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Structure</label>
                                                    <select value={structure} onChange={e => setStructure(e.target.value as any)} className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                                        <option value="sole_prop">Sole Proprietorship</option>
                                                        <option value="llc">Limited Liability Co (LLC)</option>
                                                        <option value="plc">Public Limited Co (PLC)</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">Business Sector</label>
                                                    <select value={sector} onChange={e => setSector(e.target.value as any)} className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm capitalize">
                                                        {availableSectors.map((s) => (
                                                            <option key={s.name} value={s.name}>
                                                                {s.name.replace('_', ' ')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {accountType === 'personal' && (
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                                <input type="checkbox" checked={paysRent === 'yes'} onChange={e => setPaysRent(e.target.checked ? 'yes' : 'no')} className="rounded text-blue-600" />
                                                I pay Rent (eligible for Relief)
                                            </label>
                                            {paysRent === 'yes' && (
                                                <input type="number" value={rentAmount} onChange={e => setRentAmount(e.target.value)} placeholder="Rent Amount" className="w-32 px-3 py-1 bg-gray-50 rounded-lg border border-gray-200 text-sm" />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>


                            <div className="flex items-center gap-2 mt-6">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={agreeToTerms}
                                    onChange={e => setAgreeToTerms(e.target.checked)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                />
                                <label htmlFor="terms" className="text-sm text-gray-500">
                                    I agree to the <a href="#" className="text-blue-600 hover:underline">Terms</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
                                </label>
                            </div>

                            <button
                                onClick={handleComplete}
                                disabled={loading || !agreeToTerms || !name || !email || !password}
                                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all transform active:scale-[0.98] mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>

                            <div className="mt-6 text-center text-sm text-gray-500">
                                Already have an account? <button onClick={() => navigate('/login')} className="text-blue-600 font-bold hover:underline">Sign in</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingScreen;
