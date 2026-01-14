import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { Save, Upload, Layout, CheckCircle, RefreshCw } from 'lucide-react';

export const BrandConfigurator: React.FC = () => {
    const { tenant, updateTenant, isSyncing } = useTenant();

    // Local State for Form (Wait for Save)
    const [businessName, setBusinessName] = useState(tenant.businessName);
    const [taxId, setTaxId] = useState(tenant.taxIdentityNumber || '');
    const [color, setColor] = useState(tenant.brandColor || '#2252c9');
    const [logo, setLogo] = useState<string | null>(tenant.logoUrl);
    const [businessAddress, setBusinessAddress] = useState(tenant.businessAddress || '');
    const [phoneNumber, setPhoneNumber] = useState(tenant.phoneNumber || '');


    // Mock Preview Data
    const PREVIEW_INVOICE_TOTAL = "₦2,650.00";

    const handleSave = async () => {
        await updateTenant({
            businessName,
            taxIdentityNumber: taxId,
            brandColor: color,
            themeColor: color, // Sync Theme
            logoUrl: logo,
            businessAddress,
            phoneNumber

        });
        // Feedback toast or animation could go here
    };

    return (
        <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* LEFT: Configuration Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <Layout className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Brand Studio</h2>
                        <p className="text-gray-500 text-sm">Customize your white-label identity.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Business Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Business Name</label>
                        <input
                            type="text"
                            value={businessName}
                            onChange={e => setBusinessName(e.target.value)}
                            placeholder="OpCore LLC"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Business Address */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Business Address</label>
                        <input
                            type="text"
                            value={businessAddress}
                            onChange={(e) => setBusinessAddress(e.target.value)}
                            placeholder="123 Innovation Dr, Lagos"
                            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition text-gray-900 dark:text-white"
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number</label>
                        <input
                            type="text"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="+234 800 000 0000"
                            className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition text-gray-900 dark:text-white"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">This will appear on your invoices.</p>
                    </div>

                    {/* Tax ID */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Unified Tax ID (NIN / RC)</label>
                        <input
                            type="text"
                            value={taxId}
                            onChange={e => setTaxId(e.target.value)}
                            placeholder="e.g. RC-12345678"
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <p className="text-xs text-gray-400 mt-2">Required for NTA 2025 Compliance.</p>
                    </div>

                    {/* Brand Color */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Primary Brand Color</label>
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ backgroundColor: color }}>
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <input
                                type="text"
                                value={color}
                                onChange={e => setColor(e.target.value)} // Add Hex validation later
                                className="uppercase font-mono p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 w-32 text-center"
                            />
                            <p className="text-xs text-gray-500 max-w-[150px]">Used for buttons, highlights, and headers.</p>
                        </div>
                    </div>

                    {/* Logo Mockup */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Logo</label>
                        <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
                            <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                <Upload size={24} />
                            </div>
                            <span className="font-semibold text-blue-600">Click to upload</span>
                            <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 2MB</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSyncing}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        style={{ backgroundColor: color }} // Dynamic Brand Color Preview
                    >
                        {isSyncing ? <RefreshCw className="animate-spin" /> : <Save size={20} />}
                        Save Changes
                    </button>
                </div>
            </div>

            {/* RIGHT: Live Preview */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-500 uppercase tracking-wider">Live Preview</h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-500">CLIENT VIEW</span>
                </div>

                <div className="bg-gray-100 dark:bg-gray-900/50 p-8 rounded-3xl border border-gray-200/50 dark:border-gray-800">

                    {/* Mock Invoice Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h4 className="font-bold text-xl text-brand" style={{ color: color }}>{businessName || 'Your Business'}</h4>
                                <p className="text-xs text-gray-400 mt-1">123 Business Rd, Tech City</p>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${tenant.subscriptionTier === 'free' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600'}`}>
                                    {tenant.subscriptionTier === 'free' ? 'Free Plan' : 'Pro Plan'}
                                </span>
                                <h1 className="text-3xl font-light text-gray-200 mt-2 tracking-widest">INVOICE</h1>
                                <p className="text-xs font-mono text-gray-400">#INV-001</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                                <span className="text-gray-600">Web Development Services</span>
                                <span className="font-medium">₦2,500.00</span>
                            </div>
                            <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                                <span className="text-gray-600">Hosting Setup</span>
                                <span className="font-medium">₦150.00</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="text-2xl font-bold" style={{ color: color }}>{PREVIEW_INVOICE_TOTAL}</span>
                        </div>
                    </div>

                    {/* Mock Dashboard Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Net Profit</p>
                            <p className="text-2xl font-bold text-gray-900">₦12,450</p>
                        </div>
                        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: color }}>
                            Add Invoice
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

// export default BrandConfigurator;