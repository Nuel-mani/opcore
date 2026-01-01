
import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { Upload, Save, CheckCircle } from 'lucide-react';

const BrandConfigurator: React.FC = () => {
    const { tenant, updateTenant } = useTenant();
    const [localName, setLocalName] = useState(tenant.businessName);
    const [localTaxId, setLocalTaxId] = useState(tenant.taxIdentityNumber || '');
    const [localColor, setLocalColor] = useState(tenant.brandColor);
    const [isSaved, setIsSaved] = useState(false);

    const handleSave = () => {
        updateTenant({
            businessName: localName,
            taxIdentityNumber: localTaxId,
            brandColor: localColor,
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateTenant({ logoUrl: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Brand Studio</h2>
                    <p className="text-gray-500 dark:text-gray-400">Customize the look and feel of your white-label dashboard and invoices. Changes apply globally.</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">

                    {/* Business Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name</label>
                        <input
                            type="text"
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition"
                        />
                    </div>

                    {/* Unified Tax ID */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Unified Tax ID <span className="text-xs text-gray-400 font-normal">(NIN / RC / BN)</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={localTaxId}
                                onChange={(e) => setLocalTaxId(e.target.value)}
                                placeholder="e.g. RC-123456789" // Placeholder example
                                className="w-full px-4 py-2 pl-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition font-mono"
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Required for NTA 2025 Compliance.</p>
                    </div>

                    {/* Brand Color */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Brand Color</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={localColor}
                                onChange={(e) => setLocalColor(e.target.value)}
                                className="h-12 w-20 p-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                            />
                            <div className="flex-1">
                                <span className="text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">{localColor}</span>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This color will be used for buttons, highlights, and headers.</p>
                            </div>
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-brand transition-colors group">
                            <div className="space-y-1 text-center">
                                {tenant.logoUrl ? (
                                    <img src={tenant.logoUrl} alt="Preview" className="mx-auto h-24 object-contain mb-4" />
                                ) : (
                                    <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 group-hover:text-brand" />
                                )}
                                <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                    <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-brand hover:text-blue-500 focus-within:outline-none">
                                        <span>Upload a file</span>
                                        <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG up to 2MB</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full flex items-center justify-center gap-2 bg-brand text-brand-contrast py-3 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-all transform active:scale-95"
                    >
                        {isSaved ? <CheckCircle size={20} /> : <Save size={20} />}
                        {isSaved ? "Saved Successfully" : "Save Changes"}
                    </button>
                </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Live Preview</h3>
                    <span className="text-xs text-gray-400 uppercase tracking-widest">Client View</span>
                </div>

                {/* Mock Dashboard Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                    <div className="h-2 bg-brand w-full"></div>
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            {tenant.logoUrl ? (
                                <img src={tenant.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                            ) : (
                                <span className="text-xl font-bold text-brand">{localName || tenant.businessName}</span>
                            )}
                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Net Profit</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">$12,450</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Expenses</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">$3,200</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 bg-brand text-brand-contrast py-2 rounded-lg text-sm font-medium">Add Invoice</button>
                            <button className="flex-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg text-sm font-medium">Reports</button>
                        </div>
                    </div>
                </div>

                {/* Mock Invoice Preview */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 relative">
                    <div className="absolute top-0 right-0 m-4 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">PAID</div>
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            {tenant.logoUrl ? (
                                <img src={tenant.logoUrl} alt="Logo" className="h-10 w-auto object-contain mb-2" />
                            ) : (
                                <h2 className="text-2xl font-bold text-brand mb-2">{localName || tenant.businessName}</h2>
                            )}
                            <p className="text-xs text-gray-500">123 Business Rd, Tech City</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-light text-gray-400">INVOICE</p>
                            <p className="font-mono text-sm">#INV-001</p>
                        </div>
                    </div>

                    <div className="border-t-2 border-brand pt-4 mb-4">
                        <div className="flex justify-between text-sm mb-2 text-gray-900">
                            <span>Web Development Services</span>
                            <span className="font-bold">$2,500.00</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Hosting Setup</span>
                            <span>$150.00</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-brand">$2,650.00</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BrandConfigurator;