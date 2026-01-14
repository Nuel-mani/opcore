import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import {
    Building,
    ShieldCheck,
    WifiOff,
    CheckCircle,
    ArrowRight,
    Menu,
    X,
    Moon,
    Sun,
    LayoutDashboard,
    FileText,
    PieChart,
    Users
} from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isDarkMode, toggleDarkMode } = useTenant();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const FeatureCard = ({ icon: Icon, title, desc, link }: any) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-700 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <Icon size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 leading-relaxed">{desc}</p>
            <button className="text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
                Learn more <ArrowRight size={14} />
            </button>
        </div>
    );

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
            <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">

                {/* Navbar */}
                <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
                    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {/* Logo Placeholder */}
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">O</div>
                            <span className="font-bold text-xl tracking-tight">OpCore</span>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
                            <a href="#features" className="hover:text-blue-600 dark:hover:text-white transition">Features</a>
                            <a href="#pricing" className="hover:text-blue-600 dark:hover:text-white transition">Pricing</a>
                            <a href="#resources" className="hover:text-blue-600 dark:hover:text-white transition">Resources</a>
                            <button onClick={toggleDarkMode} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            <div className="flex items-center gap-3 ml-4">
                                <button onClick={() => navigate('/login')} className="font-bold hover:text-blue-600 transition">Log In</button>
                                <button onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-bold transition shadow-sm hover:shadow-md hover:-translate-y-0.5 transform">
                                    Get Started
                                </button>
                            </div>
                        </div>

                        {/* Mobile Menu Toggle */}
                        <div className="flex items-center gap-4 md:hidden">
                            <button onClick={toggleDarkMode}>
                                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-4 flex flex-col gap-4 shadow-lg animate-fade-in">
                            <a href="#features" className="py-2 text-gray-600 dark:text-gray-300 font-medium">Features</a>
                            <a href="#pricing" className="py-2 text-gray-600 dark:text-gray-300 font-medium">Pricing</a>
                            <hr className="border-gray-100 dark:border-gray-800" />
                            <button onClick={() => navigate('/login')} className="w-full py-3 font-bold text-center border border-gray-200 dark:border-gray-700 rounded-lg">Log In</button>
                            <button onClick={() => navigate('/register')} className="w-full py-3 font-bold text-center bg-blue-600 text-white rounded-lg">Get Started</button>
                        </div>
                    )}
                </nav>

                {/* Hero Section */}
                <header className="relative pt-20 pb-32 overflow-hidden">
                    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 items-center">
                        <div className="z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold mb-6">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Updated for Finance Act 2024
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
                                Tax Compliance on <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-500">Autopilot.</span> <br />
                                Anywhere.
                            </h1>
                            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-lg leading-relaxed">
                                The offline-first bookkeeping platform built for Nigerian MSMEs and professionals. Master the Finance Act 2024 and NTA 2025 effortlessly.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-10">
                                <button onClick={() => navigate('/register')} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/30 transition transform hover:-translate-y-1">
                                    Start Free Trial
                                </button>
                                <button onClick={() => window.scrollTo({ top: 1000, behavior: 'smooth' })} className="px-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-bold text-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center gap-2 justify-center">
                                    <PieChart size={20} /> View Demo
                                </button>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                            User
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm font-medium text-gray-500">Trusted by 2,000+ Nigerian businesses</p>
                            </div>
                        </div>

                        {/* Hero Image / Dashboard Mockup */}
                        <div className="relative z-10">
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-20 dark:opacity-40 animate-pulse"></div>
                            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                {/* Pseudo Window Controls */}
                                <div className="h-8 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 flex items-center px-4 gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                {/* Mock Dashboard Content */}
                                <div className="p-6">
                                    <div className="flex justify-between items-end mb-8">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tax Liability Calculated</p>
                                            <h3 className="text-3xl font-bold font-mono">₦ 450,230.00</h3>
                                        </div>
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">+ 14% Saved</span>
                                    </div>
                                    {/* Charts Mock */}
                                    <div className="flex items-end gap-2 h-32 mb-6">
                                        {[40, 60, 45, 70, 50, 80, 65].map((h, i) => (
                                            <div key={i} className="flex-1 bg-blue-100 dark:bg-blue-900/30 rounded-t-sm relative group">
                                                <div className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all duration-1000" style={{ height: `${h}%` }}></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-4 w-1/3 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Logos */}
                <div className="border-y border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 py-8">
                    <div className="w-full max-w-7xl mx-auto px-4 text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Compliant With</p>
                        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            {[
                                { name: 'NRS', url: 'https://nrs.gov.ng', title: 'Nigeria Revenue Service' },
                                { name: 'CAC', url: 'https://cac.gov.ng', title: 'Corporate Affairs Commission' },
                                { name: 'LIRS', url: 'https://lirs.gov.ng', title: 'Lagos State Internal Revenue Service' },
                                { name: 'NTA', url: 'https://nta.ng', title: 'Nigerian Television Authority' },
                                { name: 'CITN', url: 'https://citn.org', title: 'Chartered Institute of Taxation of Nigeria' }
                            ].map(agency => (
                                <a
                                    key={agency.name}
                                    href={agency.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={agency.title}
                                    className="text-xl font-black text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    {agency.name}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Features */}
                <section id="features" className="py-24">
                    <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
                        <div className="flex justify-between items-end mb-12">
                            <div className="max-w-xl">
                                <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Strategic Tax Shield</h2>
                                <p className="text-gray-500 dark:text-gray-400">Stay ahead of regulatory changes. OpCore automatically updates to reflect the latest fiscal policies so you never miss a beat.</p>
                            </div>
                            <div className="hidden md:flex gap-2">
                                <button className="p-3 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowRight className="rotate-180" size={20} /></button>
                                <button className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700"><ArrowRight size={20} /></button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={LayoutDashboard}
                                title="Finance Act 2024"
                                desc="Auto-adjusts to new 2024 tax brackets instantly. No manual calculations required."
                            />
                            <FeatureCard
                                icon={ShieldCheck}
                                title="NTA 2025 Automation"
                                desc="Future-proof your business with planned filing integrations ready for NTA 2025."
                            />
                            <FeatureCard
                                icon={FileText}
                                title="Audit-Ready Reports"
                                desc="Generate compliant financial statements on the fly. Be ready for any inspection."
                            />
                        </div>
                    </div>
                </section>

                {/* Offline Feature */}
                <section className="py-24 bg-gray-900 text-white overflow-hidden relative">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 relative z-10">
                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            {/* Graphic */}
                            <div className="relative">
                                <div className="aspect-square rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-gray-700 flex items-center justify-center p-8">
                                    <WifiOff size={64} className="text-gray-500 mb-4" />
                                    {/* Network Nodes Animation Mock */}
                                    <div className="absolute inset-0 opacity-30">
                                        {/* Abstract dots */}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div>
                                <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-bold rounded mb-4">OFFLINE-FIRST TECHNOLOGY</span>
                                <h2 className="text-3xl md:text-4xl font-bold mb-6">No Signal? No Problem.</h2>
                                <p className="text-gray-400 mb-8 text-lg">
                                    Work completely offline. OpCore locally caches your data and syncs safely when connectivity is restored, ensuring you never lose progress despite internet fluctuations common in Lagos or remote areas.
                                </p>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                                            <CheckCircle size={16} />
                                        </div>
                                        <h4 className="font-bold mb-1">Auto-Sync</h4>
                                        <p className="text-xs text-gray-500">When online</p>
                                    </div>
                                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                        <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center mb-2">
                                            <CheckCircle size={16} />
                                        </div>
                                        <h4 className="font-bold mb-1">Local DB</h4>
                                        <p className="text-xs text-gray-500">Device storage</p>
                                    </div>
                                </div>

                                <button onClick={() => navigate('/register')} className="mt-10 flex items-center gap-2 text-white font-bold hover:gap-4 transition-all">
                                    See how offline mode works <ArrowRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Segments */}
                <section className="py-24 bg-gray-50 dark:bg-gray-900/50">
                    <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-3xl font-bold mb-4">Tailored for Your Needs</h2>
                            <p className="text-gray-500">Whether you are an individual navigating salary deductions or a business managing complex ledgers.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {/* Personal */}
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users size={120} />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">For Personal Users</h3>
                                <p className="text-sm text-gray-500 mb-8">Salary Earners & Freelancers</p>

                                <ul className="space-y-4 mb-8">
                                    {['Maximize take-home pay with smart deductions', 'Personal Income Tax (PIT) automation', 'Pension & Insurance contribution tracking'].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm">
                                            <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => navigate('/register?type=personal')} className="w-full py-3 rounded-xl border border-blue-600 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition">Start as Individual</button>
                            </div>

                            {/* Business */}
                            <div className="bg-gray-900 text-white rounded-3xl p-8 border border-gray-700 relative overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Building size={120} />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>

                                <div className="relative z-10">
                                    <h3 className="text-2xl font-bold mb-2">For Business Users</h3>
                                    <p className="text-sm text-gray-400 mb-8">MSMEs & Startups</p>

                                    <ul className="space-y-4 mb-8">
                                        {['Keep books audit-ready and avoid penalties', 'VAT & WHT automated calculations', 'Multi-user access control'].map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm">
                                                <CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
                                                <span className="text-gray-200">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={() => navigate('/register?type=business')} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg border-2 border-transparent">Start for Business</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 bg-blue-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                    {/* Abstract shapes */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-30">
                        <div className="absolute -top-[50%] -left-[20%] w-[800px] h-[800px] rounded-full border-[100px] border-white/10"></div>
                    </div>

                    <div className="w-full max-w-4xl mx-auto px-4 text-center relative z-10 text-white">
                        <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Automate Your Compliance?</h2>
                        <p className="text-xl text-blue-100 mb-10">Join thousands of Nigerian businesses and professionals using OpCore to stay compliant and stress-free.</p>

                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button onClick={() => navigate('/register')} className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-xl hover:bg-gray-50 transition">
                                Get Started for Free
                            </button>
                            <button onClick={() => navigate('/pricing')} className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white/10 transition">
                                Schedule a Demo
                            </button>
                        </div>
                        <p className="mt-6 text-sm text-blue-200">No credit card required • 14-day free trial</p>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-gray-400 py-16 border-t border-gray-800">
                    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-4 gap-12 text-sm">

                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-xs">O</div>
                                <span className="font-bold text-lg text-white tracking-tight">OpCore</span>
                            </div>
                            <p className="mb-6">The offline-first bookkeeping platform for Nigeria. Simplify Finance Act 2024 compliance today.</p>
                            <div className="flex gap-4">
                                {/* Socials */}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-4">Product</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white transition">Features</a></li>
                                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                                <li><a href="#" className="hover:text-white transition">Offline Mode</a></li>
                                <li><a href="#" className="hover:text-white transition">Security</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-4">Resources</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white transition">Tax Guide</a></li>
                                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition">Webinars</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-4">Legal</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
                                <li><a href="#" className="hover:text-white transition">Compliance</a></li>
                            </ul>
                        </div>

                    </div>
                    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-16 pt-8 border-t border-gray-800 text-xs flex justify-between items-center">
                        <p>&copy; 2025 OpCore Financial Technologies. All rights reserved.</p>
                        <p>Made in Lagos</p>
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default LandingPage;
