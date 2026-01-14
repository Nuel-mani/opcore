import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext'; // Assuming context availability
import { Plus, Trash2, Printer, FileText, CheckCircle } from 'lucide-react';

export const InvoiceGenerator = () => {
    const { tenant, addInvoice, invoices, deleteInvoice, updateInvoice } = useTenant();

    // State
    const [customerName, setCustomerName] = useState('');
    const [lineItems, setLineItems] = useState<any[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
        }
    };

    const handleEdit = (inv: any) => {
        setCustomerName(inv.customerName);
        setDate(inv.date);
        setEditingId(inv.id);

        // Parse items if string, else use as is
        let items = [];
        try {
            items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
        } catch (e) { items = [] }
        setLineItems(items);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this invoice?')) {
            // @ts-ignore
            if (deleteInvoice) await deleteInvoice(id);
        }
    };

    // ... (rest of component) ...

    // export default InvoiceGenerator;

    // Computed
    const subtotal = lineItems.reduce((acc, item) => acc + (item.amount * item.qty), 0);

    // VAT Logic: Only if TIER is not 'free' OR turnover > 25m (But for simplicity, check 'Limited' or Pro)
    // For now, allow toggle if Business
    // VAT Logic: Apply if turnover is NOT micro (Small, Medium, Large, or Corporate) OR if this single invoice > 25M (Instant graduation)
    const isVatApplicable = (tenant.accountType === 'business' && ['small', 'medium', 'large', 'corporate'].includes(tenant.turnoverBand || 'micro')) || subtotal >= 25000000;
    const vatRate = isVatApplicable ? 0.075 : 0;
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;

    // Handlers
    const addLineItem = () => {
        setLineItems([...lineItems, { id: Date.now(), description: '', qty: 1, amount: 0 }]);
    };

    const removeLineItem = (id: number) => {
        setLineItems(lineItems.filter(i => i.id !== id));
    };

    const updateLineItem = (id: number, field: string, value: any) => {
        setLineItems(lineItems.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    // Save & Print
    const handleSaveAndPrint = async () => {
        if (!customerName || lineItems.length === 0) {
            alert("Please add a customer and at least one line item.");
            return;
        }

        const invoiceData = {
            id: editingId || crypto.randomUUID(), // Preserve ID if editing

            customerName,
            date,
            items: lineItems, // CORRECT KEYS: 'items' not 'lineItems'
            totalAmount: total,
            vatAmount: vatAmount, // Pass calculated VAT
            status: 'paid',
            pdfUrl: null,
            pdfGeneratedAt: new Date().toISOString(), // [NEW] Evidence
            reprintCount: 0
        };

        // Persist to DB
        // @ts-ignore
        if (editingId && updateInvoice) {
            await updateInvoice(editingId, invoiceData);
        } else if (addInvoice) {
            await addInvoice(invoiceData);
        }

        // Trigger Print
        setTimeout(() => {
            window.print();

            // Reset Form State AFTER print dialog closes (blocking behavior)
            setCustomerName('');
            setLineItems([{ id: Date.now(), description: '', qty: 1, amount: 0 }]);
            setEditingId(null);
        }, 500);
    };

    // Reprint Handler
    const handleReprint = async (inv: any, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row toggle

        // 1. Update Evidence Logic
        if (updateInvoice) {
            await updateInvoice(inv.id, {
                pdfGeneratedAt: new Date().toISOString(),
                reprintCount: (inv.reprintCount || 0) + 1
            });
        }

        // 2. Load into Preview (Quick & Dirty for MVP)
        setCustomerName(inv.customerName);
        setDate(inv.date);
        let items = [];
        try { items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items; } catch (e) { items = [] }
        setLineItems(items);

        // 3. Trigger Print
        setTimeout(() => window.print(), 500);
    };

    return (
        <>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #invoice-preview, #invoice-preview * { visibility: visible; }
                    #invoice-preview { 
                        position: absolute; 
                        left: 50%; 
                        top: 20px; 
                        transform: translateX(-50%);
                        width: 100%; 
                        max-width: 800px;
                        margin: 0; 
                        padding: 0;
                        box-shadow: none;
                    }
                    /* Hide everything else explicitly */
                    nav, aside, header, .no-print { display: none !important; }
                    html, body { height: 100%; overflow: hidden; background: white; }
                }
            `}</style>
            <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:p-0">

                {/* LEFT: Editor (Hidden in Print) */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 print:hidden h-fit">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <FileText className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Invoice</h2>
                            <p className="text-gray-500 text-sm">Manage business transactions compliant with NTA 2025.</p>
                        </div>
                        <div className="ml-auto">
                            {isVatApplicable ?
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
                                    <CheckCircle size={12} /> VAT LEVIED (7.5%)
                                </span> :
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
                                    VAT EXEMPT (MICRO)
                                </span>
                            }
                        </div>
                    </div>

                    {/* Customer */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Customer Name</label>
                        <input
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                        />
                    </div>

                    {/* Line Items */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Line Items</label>
                        <div className="space-y-3">
                            {lineItems.map(item => (
                                <div key={item.id} className="flex gap-2 items-start">
                                    <input
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                                        className="flex-1 p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm"
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Qty"
                                        value={item.qty}
                                        onChange={e => updateLineItem(item.id, 'qty', Number(e.target.value))}
                                        className="w-16 p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-center"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Amount"
                                        value={item.amount}
                                        onChange={e => updateLineItem(item.id, 'amount', Number(e.target.value))}
                                        className="w-32 p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-right"
                                    />
                                    <button onClick={() => removeLineItem(item.id)} className="p-3 text-red-400 hover:text-red-600">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addLineItem} className="mt-4 text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline">
                            <Plus size={16} /> Add Line Item
                        </button>
                    </div>

                    {/* Totals Summary (Editor Side) */}
                    <div className="border-t border-gray-100 pt-6 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-500">
                            <span>Subtotal</span>
                            <span>{tenant.currencySymbol}{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-gray-500">
                            <span>VAT (7.5%)</span>
                            <span>{tenant.currencySymbol}{vatAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-gray-900 mt-4">
                            <span>Total Due</span>
                            <span className="text-blue-600">{tenant.currencySymbol}{total.toLocaleString()}</span>
                        </div>
                    </div>

                    <button onClick={handleSaveAndPrint} className="w-full mt-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <Printer size={20} /> Save & Generate PDF
                    </button>
                </div>

                {/* RIGHT: Live Preview (The Paper) */}
                <div className="bg-gray-200 dark:bg-gray-900/50 p-8 rounded-3xl flex justify-center items-start print:bg-white print:p-0">
                    <div className="bg-white p-8 md:p-12 w-full max-w-lg shadow-xl shadow-gray-200/50 print:shadow-none min-h-[600px] flex flex-col justify-between" id="invoice-preview">

                        {/* Header */}
                        <div>
                            <div className="flex justify-between items-start border-b border-gray-100 pb-8 mb-8">
                                <div>
                                    <h1 className="text-2xl font-bold text-blue-600 uppercase tracking-widest mb-1">{tenant.businessName || 'Your Business'}</h1>
                                    <p className="text-xs text-gray-400 max-w-[150px]">{tenant.businessAddress || '123 Business Rd, Lagos'}</p>
                                    <p className="text-xs text-gray-400 max-w-[150px]">{tenant.phoneNumber || '+1234568952312'}</p>
                                    <p className="text-xs text-gray-400">TIN: {tenant.taxIdentityNumber || 'N/A'}</p>
                                </div>



                                <div className="text-right">
                                    <h2 className="text-4xl font-thin text-gray-100 tracking-[0.2em] mb-2">INVOICE</h2>
                                    <p className="text-xs font-mono text-gray-400">Date: {date}</p>
                                    <p className="text-xs font-mono text-gray-400">#INV-DRAFT</p>
                                </div>
                            </div>

                            {/* Bill To */}
                            <div className="mb-12 bg-gray-50 p-4 rounded-lg">
                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">BILL TO</p>
                                <h3 className="text-xl font-bold text-gray-900">{customerName}</h3>
                            </div>

                            {/* Table */}
                            <table className="w-full text-sm mb-12">
                                <thead>
                                    <tr className="border-b-2 border-blue-100">
                                        <th className="text-left py-3 text-[10px] text-blue-500 uppercase font-bold tracking-wider">Description</th>
                                        <th className="text-center py-3 text-[10px] text-blue-500 uppercase font-bold tracking-wider">Qty</th>
                                        <th className="text-right py-3 text-[10px] text-blue-500 uppercase font-bold tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {lineItems.map((item, index) => (
                                        <tr key={`${item.id}-${index}`}>
                                            <td className="py-4 text-gray-600">{item.description}</td>
                                            <td className="py-4 text-center text-gray-600">{item.qty}</td>
                                            <td className="py-4 text-right font-medium text-gray-900">{item.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Totals */}
                        <div>
                            <div className="flex justify-between py-2 text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span>{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm text-gray-500 border-b border-gray-100 pb-4">
                                <span>VAT ({vatRate * 100}%)</span>
                                <span>{vatAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-4 text-xl font-bold text-gray-900">
                                <span>TOTAL DUE</span>
                                <span className="text-blue-600">{total.toLocaleString()}</span>
                            </div>

                            <div className="mt-8 text-center border-t border-gray-50 pt-8">
                                <p className="text-[10px] text-gray-300 font-mono">GENERATED BY OPCORE • NTA 2025 COMPLIANT</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RECENT INVOICES HISTORY (Hidden in Print) */}
            <div className="mt-12 p-6 max-w-7xl mx-auto print:hidden">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Invoices</h3>

                {(!invoices || invoices.length === 0) ? (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center borderBorder-gray-100 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="text-gray-400" size={24} />
                        </div>
                        <p className="text-gray-500">No invoices generated yet.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm overflow-x-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4 text-center">Items</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {invoices.slice(0, 10).map((inv: any) => {
                                    const parsedItems = Array.isArray(inv.items) ? inv.items : JSON.parse(inv.items || '[]');
                                    const isExpanded = expandedId === inv.id;

                                    return (
                                        <React.Fragment key={inv.id}>
                                            <tr
                                                onClick={() => toggleRow(inv.id)}
                                                className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50' : ''}`}
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{inv.date}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{inv.customerName}</td>
                                                <td className="px-6 py-4 text-sm text-center text-gray-500">
                                                    {parsedItems.length}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-right font-bold text-gray-900 dark:text-white">
                                                    {tenant.currencySymbol}{(inv.totalAmount || 0).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                                            ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}
                                        `}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right flex items-center justify-end gap-3">
                                                    <button
                                                        onClick={() => handleEdit(inv)}
                                                        className="text-gray-500 hover:text-blue-600 transition-colors"
                                                        title="Edit Invoice"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(inv.id)}
                                                        className="text-gray-500 hover:text-red-600 transition-colors"
                                                        title="Delete Invoice"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleReprint(inv, e)}
                                                        className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full text-nowrap"
                                                    >
                                                        <Printer size={14} /> Reprint
                                                    </button>
                                                </td>
                                            </tr>
                                            {/* EXPANDED DETAILS ROW */}
                                            {isExpanded && (
                                                <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                                                    <td colSpan={6} className="px-6 py-6">
                                                        <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-100 dark:border-gray-600 shadow-sm">
                                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Invoice Breakdown</h4>

                                                            <table className="w-full text-sm mb-6">
                                                                <thead className="bg-gray-50 dark:bg-gray-600/50 border-b border-gray-100 dark:border-gray-600">
                                                                    <tr>
                                                                        <th className="text-left py-2 px-4 text-gray-500 font-semibold">Description</th>
                                                                        <th className="text-center py-2 px-4 text-gray-500 font-semibold">Qty</th>
                                                                        <th className="text-right py-2 px-4 text-gray-500 font-semibold">Amount</th>
                                                                        <th className="text-right py-2 px-4 text-gray-500 font-semibold">Total</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50 dark:divide-gray-600">
                                                                    {parsedItems.map((item: any, index: number) => (
                                                                        <tr key={item.id || index}>
                                                                            <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{item.description}</td>
                                                                            <td className="py-3 px-4 text-center text-gray-600 dark:text-gray-400">{item.qty}</td>
                                                                            <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{tenant.currencySymbol}{item.amount.toLocaleString()}</td>
                                                                            <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                                                                                {tenant.currencySymbol}{(item.amount * item.qty).toLocaleString()}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>

                                                            <div className="flex justify-end gap-12 text-sm border-t border-gray-100 dark:border-gray-600 pt-4">
                                                                <div className="text-right">
                                                                    <p className="text-gray-500 mb-1">Subtotal</p>
                                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                                        {tenant.currencySymbol}
                                                                        {(inv.totalAmount - (inv.vatAmount || 0)).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-gray-500 mb-1">VAT Paid</p>
                                                                    <p className="font-bold text-red-600">
                                                                        {tenant.currencySymbol}{(inv.vatAmount || 0).toLocaleString()}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
                                                                    <p className="text-blue-600 mb-1 font-bold">Total Paid</p>
                                                                    <p className="font-black text-blue-700 dark:text-blue-400 text-lg">
                                                                        {tenant.currencySymbol}{inv.totalAmount.toLocaleString()}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

export default InvoiceGenerator;