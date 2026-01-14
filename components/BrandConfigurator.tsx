import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { Save, Upload, Layout, CheckCircle, RefreshCw, X } from 'lucide-react';

export const BrandConfigurator: React.FC = () => {
    const { tenant, updateTenant, isSyncing } = useTenant();

    // Local State for Form (Wait for Save)
    const [businessName, setBusinessName] = useState(tenant.businessName);
    const [taxId, setTaxId] = useState(tenant.taxIdentityNumber || '');
    const [color, setColor] = useState(tenant.brandColor || '#2252c9');
    const [logo, setLogo] = useState<string | null>(tenant.logoUrl);
    const [stamp, setStamp] = useState<string | null>(tenant.stampUrl);
    const [template, setTemplate] = useState(tenant.invoiceTemplate || 'modern');
    const [font, setFont] = useState(tenant.invoiceFont || 'inter');
    const [showWatermark, setShowWatermark] = useState(tenant.showWatermark || false);
    const [businessAddress, setBusinessAddress] = useState(tenant.businessAddress || '');
    const [phoneNumber, setPhoneNumber] = useState(tenant.phoneNumber || '');

    const logoInputRef = React.useRef<HTMLInputElement>(null);
    const stampInputRef = React.useRef<HTMLInputElement>(null);


    // Mock Preview Data
    const PREVIEW_INVOICE_TOTAL = "₦2,650.00";

    const handleSave = async () => {
        await updateTenant({
            businessName,
            taxIdentityNumber: taxId,
            brandColor: color,
            themeColor: color, // Sync Theme
            logoUrl: logo,
            stampUrl: stamp,
            invoiceTemplate: template,
            invoiceFont: font,
            showWatermark,
            businessAddress,
            phoneNumber
        });
        // Feedback toast or animation could go here
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'stamp') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('logo', file); // API expects 'logo' key for now

        try {
            const API_BASE = `http://${window.location.hostname}:3001`;
            const res = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.status === 'success') {
                if (type === 'logo') {
                    setLogo(data.url);
                    // Trigger Smart Palette
                    extractDominantColor(data.url);
                }
                if (type === 'stamp') setStamp(data.url);
            } else {
                alert('Upload failed: ' + data.error);
            }
        } catch (err) {
            console.error("Upload Error", err);
            alert("Upload failed. Ensure backend is running.");
        }
    };

    // Helper: Extract Dominant Color from Image (Client-side Canvas)
    const extractDominantColor = (imageSrc: string) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Sample center pixel (simplified for speed)
            const p = ctx.getImageData(img.width / 2, img.height / 2, 1, 1).data;
            const hex = "#" + ("000000" + ((p[0] << 16) | (p[1] << 8) | p[2]).toString(16)).slice(-6);

            setColor(hex);
        };
    };

    // Helper: Smart Palette Extraction (Simple Canvas Logic)
    // For MVP, we'll skip complex extraction and rely on manual picker, 
    // but the hook is here for future expansion.

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

                    {/* Logo & Stamp Handlers */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Logo</label>
                            <div
                                onClick={() => logoInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group h-40 relative overflow-hidden"
                            >
                                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                                {logo ? (
                                    <div className="relative w-full h-full group/image">
                                        <img src={logo.startsWith('/') ? `http://${window.location.hostname}:3001${logo}` : logo} alt="Logo" className="h-full w-full object-contain" />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setLogo(null); }}
                                            className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-red-200"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                            <Upload size={20} />
                                        </div>
                                        <span className="font-semibold text-blue-600 text-sm">Upload Logo</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Digital Stamp Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Digital Stamp / Seal</label>
                            <div
                                onClick={() => stampInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group h-40 relative overflow-hidden"
                            >
                                <input type="file" ref={stampInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'stamp')} />
                                {stamp ? (
                                    <div className="relative w-full h-full group/image">
                                        <img src={stamp.startsWith('/') ? `http://${window.location.hostname}:3001${stamp}` : stamp} alt="Stamp" className="h-full w-full object-contain opacity-80" />
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setStamp(null); }}
                                            className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-red-200"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-3 bg-purple-50 text-purple-600 rounded-full mb-2 group-hover:scale-110 transition-transform">
                                            <CheckCircle size={20} />
                                        </div>
                                        <span className="font-semibold text-purple-600 text-sm">Upload Seal</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Advanced Controls */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Template</label>
                            <select
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="modern">Modern</option>
                                <option value="classic">Classic</option>
                                <option value="minimal">Minimal</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Typography</label>
                            <select
                                value={font}
                                onChange={(e) => setFont(e.target.value)}
                                className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="inter">Inter (Clean)</option>
                                <option value="serif">Playfair (Elegant)</option>
                                <option value="mono">Roboto Mono (Tech)</option>
                            </select>
                        </div>
                    </div>

                    {/* Watermark Toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
                        <div>
                            <span className="block text-sm font-semibold text-gray-900 dark:text-white">Watermark Mode</span>
                            <span className="text-xs text-gray-500">Overlay "DRAFT" on Invoices</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={showWatermark} onChange={(e) => setShowWatermark(e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
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
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            {/* Watermark Overlay */}
                            {showWatermark && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                                    <span className="text-6xl font-black -rotate-45 text-gray-400 uppercase tracking-[1rem]">DRAFT</span>
                                </div>
                            )}

                            <div>
                                {logo ? (
                                    <img src={logo.startsWith('/') ? `http://${window.location.hostname}:3001${logo}` : logo} alt="Logo" className="h-12 w-auto mb-4 object-contain" />
                                ) : (
                                    <h4 className={`font-bold text-xl text-brand ${font === 'serif' ? 'font-serif' : font === 'mono' ? 'font-mono' : 'font-sans'}`} style={{ color: color }}>
                                        {businessName || 'Your Business'}
                                    </h4>
                                )}
                                <p className="text-xs text-gray-400 mt-1">{businessAddress || '123 Business Rd, Tech City'}</p>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase ${tenant.subscriptionTier === 'free' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600'}`}>
                                    {tenant.subscriptionTier === 'free' ? 'Free Plan' : 'Pro Plan'}
                                </span>
                                <h1 className={`text-3xl font-light text-gray-200 mt-2 tracking-widest ${font === 'serif' ? 'font-serif' : ''}`}>INVOICE</h1>
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

                        <div className="flex justify-between items-end relative z-10">
                            <div className="flex items-end gap-4">
                                <div className="text-left">
                                    <span className="font-bold text-gray-900 block">Total</span>
                                    {stamp && (
                                        <div className="mt-2 relative">
                                            <img src={stamp.startsWith('/') ? `http://${window.location.hostname}:3001${stamp}` : stamp} alt="Seal" className="w-24 h-24 object-contain opacity-80 mix-blend-multiply" />
                                            <span className="text-[10px] text-gray-400 absolute bottom-0 left-0 w-full text-center font-mono">AUTHORIZED SIGNATURE</span>
                                        </div>
                                    )}
                                </div>
                            </div>
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