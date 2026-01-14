
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Lock, Mail, ArrowRight, ShieldCheck, WifiOff, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoginScreen: React.FC = () => {
    const { login, loading, error } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        if (!email) return;
        const success = await login(email, password);
        if (success) {
            navigate('/dashboard');
        }
    };

    const handleCreateAccount = () => {
        navigate('/register');
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col md:flex-row">

                {/* Left Panel: Brand & Marketing (Hid on very small screens, or stacked) */}
                <div className="md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                <Lock className="text-white" size={24} />
                            </div>
                            <span className="text-2xl font-bold tracking-tight">OpCore</span>
                        </div>

                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/30 backdrop-blur-sm text-xs font-medium mb-6">
                            <div className="w-2 h-2 rounded-full bg-blue-300 animate-pulse"></div>
                            Offline-First Architecture
                        </div>

                        <h1 className="text-4xl font-bold leading-tight mb-4">
                            Secure Tax & <br /> Accounting Portal
                        </h1>
                        <p className="text-blue-100 text-lg opacity-90 max-w-sm">
                            Automating compliance with Finance Act 2024 and NTA 2025 regulations for personal and business users across Nigeria.
                        </p>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-6 mt-12 md:mt-0">
                        <div>
                            <h3 className="text-3xl font-bold">100%</h3>
                            <p className="text-blue-200 text-sm uppercase tracking-wider font-medium">Compliant</p>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold">24/7</h3>
                            <p className="text-blue-200 text-sm uppercase tracking-wider font-medium">Access</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Login Form */}
                <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-gray-800">
                    <div className="max-w-sm mx-auto w-full">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h2>
                            <p className="text-gray-500 dark:text-gray-400">Please enter your details to sign in.</p>
                        </div>

                        {error && (
                            <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                                <ShieldCheck size={16} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        type="email"
                                        placeholder="name@company.com"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Password</label>
                                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">Forgot password?</button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        type="password"
                                        placeholder="•••••••••••••••••"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                                {!loading && <ArrowRight size={18} />}
                            </button>

                            <div className="relative flex py-2 items-center">
                                <span className="text-xs text-gray-400 bg-white dark:bg-gray-800 px-2 uppercase mx-auto">OR</span>
                            </div>

                            <button
                                onClick={handleCreateAccount}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white py-3.5 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center"
                            >
                                Create New Account
                            </button>
                        </div>

                        <div className="mt-8 text-center flex items-center justify-center gap-2 text-xs text-gray-400">
                            <ShieldCheck size={14} />
                            <span>Protected by Enterprise-Grade Security</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;