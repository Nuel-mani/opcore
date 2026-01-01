import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { Invoice, InvoiceItem } from '../types';
import { Plus, Download, FileSpreadsheet, Trash2 } from 'lucide-react';

const InvoiceGenerator: React.FC = () => {
  const { tenant, invoices, addInvoice } = useTenant();
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unitPrice: 0, vatRate: 0 }]);

  // Nigerian VAT Logic: 
  // 1. Micro businesses (<25m) are Exempt.
  // 2. Specific goods (Books, Medical, Basic Food) are Zero-rated.
  const getApplicableVat = (description: string): number => {
      if (tenant.turnoverBand === 'micro') return 0; // VAT Exempt
      
      const zeroRatedKeywords = ['book', 'medical', 'drug', 'pharmacy', 'education', 'vegetable', 'tuber', 'fruit', 'baby'];
      const isZeroRated = zeroRatedKeywords.some(k => description.toLowerCase().includes(k));
      
      return isZeroRated ? 0 : 7.5;
  };

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0, vatRate: tenant.turnoverBand === 'micro' ? 0 : 7.5 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    const updatedItem = { ...newItems[index], [field]: value };
    
    // Auto-recalculate VAT if description changes
    if (field === 'description') {
        updatedItem.vatRate = getApplicableVat(value as string);
    }

    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const calculateSubtotal = () => items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const calculateVatTotal = () => items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * ((item.vatRate || 0) / 100)), 0);
  const calculateGrandTotal = () => calculateSubtotal() + calculateVatTotal();

  const handleCreateInvoice = () => {
    if (!customerName) return;
    const newInvoice: Invoice = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName,
      items,
      totalAmount: calculateGrandTotal(),
      vatAmount: calculateVatTotal(),
      status: 'draft',
      date: new Date().toISOString().split('T')[0]
    };
    addInvoice(newInvoice);
    setCustomerName('');
    setItems([{ description: '', quantity: 1, unitPrice: 0, vatRate: 0 }]);
  };

  // Export to CSV (Xero/QuickBooks Standard)
  const handleExportCSV = () => {
      const headers = ["*ContactName", "*InvoiceNumber", "*InvoiceDate", "*DueDate", "*Quantity", "*UnitAmount", "*TaxType", "Description", "AccountCode"];
      const rows = invoices.flatMap(inv => 
        inv.items.map(item => [
            inv.customerName,
            inv.id,
            inv.date.split('-').reverse().join('/'), // DD/MM/YYYY
            inv.date.split('-').reverse().join('/'),
            item.quantity,
            item.unitPrice,
            item.vatRate === 0 ? "Tax Exempt (0%)" : "VAT (7.5%)",
            item.description,
            "200" // Generic Sales Code
        ])
      );

      const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `opcore_invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in pb-10">
      
      {/* Builder Form */}
      <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Invoice</h2>
            <div className="text-xs font-mono px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-500">
                Mode: {tenant.turnoverBand === 'micro' ? 'VAT Exempt' : 'VAT Active (7.5%)'}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-brand"
                    placeholder="e.g. Dangote Cement Plc"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                  />
              </div>

              <div>
                  <div className="flex justify-between items-center mb-2">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Line Items</label>
                     <span className="text-xs text-gray-500 italic">VAT auto-calculated based on item type</span>
                  </div>
                  {items.map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2 items-start">
                          <div className="flex-grow">
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg outline-none text-sm"
                                placeholder="Description (e.g. Medical Supplies)"
                                value={item.description}
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            />
                            {item.vatRate === 0 && item.description.length > 3 && tenant.turnoverBand !== 'micro' && (
                                <span className="text-[10px] text-green-600 font-bold ml-1">Zero-Rated Item</span>
                            )}
                          </div>
                          <input 
                            type="number" 
                            className="w-16 px-2 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg outline-none text-sm"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                          />
                          <input 
                            type="number" 
                            className="w-24 px-2 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg outline-none text-sm"
                            placeholder="Price"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                          <button onClick={() => removeItem(index)} className="p-2 text-gray-400 hover:text-red-500">
                              <Trash2 size={16} />
                          </button>
                      </div>
                  ))}
                  <button onClick={handleAddItem} className="text-sm text-brand font-medium hover:underline flex items-center gap-1 mt-2">
                      <Plus size={14} /> Add Line Item
                  </button>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col items-end gap-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Subtotal: {tenant.currencySymbol}{calculateSubtotal().toLocaleString()}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">VAT (7.5%): {tenant.currencySymbol}{calculateVatTotal().toLocaleString()}</span>
                  <span className="text-xl font-bold text-gray-800 dark:text-white mt-1">Total: {tenant.currencySymbol}{calculateGrandTotal().toLocaleString()}</span>
                  
                  <button 
                    onClick={handleCreateInvoice}
                    className="mt-4 w-full bg-brand text-brand-contrast px-6 py-3 rounded-lg font-semibold shadow hover:opacity-90 transition flex justify-center items-center gap-2"
                  >
                      <Download size={18} /> Generate Invoice PDF
                  </button>
              </div>
          </div>

          {/* Recent Invoices List */}
          <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Recent Invoices</h3>
                <button 
                    onClick={handleExportCSV}
                    className="text-sm flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded transition"
                >
                    <FileSpreadsheet size={14} /> Export CSV (Xero)
                </button>
              </div>
              <div className="space-y-3">
                  {invoices.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No invoices generated yet.</p>
                  ) : (
                      invoices.map(inv => (
                        <div key={inv.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <p className="font-bold dark:text-white">{inv.customerName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">#{inv.id} • {inv.date}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900 dark:text-white">{tenant.currencySymbol}{inv.totalAmount.toLocaleString()}</p>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded capitalize">{inv.status}</span>
                            </div>
                        </div>
                      ))
                  )}
              </div>
          </div>
      </div>

      {/* Invoice Preview (WYSIWYG) - Paper Simulation */}
      <div className="bg-gray-200 dark:bg-gray-900/50 p-8 rounded-xl flex items-center justify-center min-h-[600px]">
          <div className="bg-white w-full max-w-md shadow-2xl p-8 min-h-[500px] flex flex-col justify-between transition-none relative" id="invoice-preview">
                {/* Watermark for Free Tier */}
                {tenant.subscriptionTier === 'free' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 rotate-45">
                        <span className="text-6xl font-black text-gray-400 uppercase">OpCore Free</span>
                    </div>
                )}
                
                <div>
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            {tenant.logoUrl ? (
                                <img src={tenant.logoUrl} alt="Logo" className="h-12 w-auto object-contain mb-2" />
                            ) : (
                                <h1 className="text-2xl font-bold text-brand">{tenant.businessName}</h1>
                            )}
                            <p className="text-xs text-gray-500 mt-1">123 Business Way, Lagos<br/>TIN: {tenant.tinNumber || "N/A"}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-light text-gray-300">INVOICE</h2>
                            <p className="text-sm text-gray-600 mt-1">Date: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
                        <p className="text-lg font-medium text-gray-900">{customerName || "Customer Name"}</p>
                    </div>

                    <div className="border-t-2 border-brand pt-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 border-b border-gray-100">
                                    <th className="text-left pb-2 font-normal">Description</th>
                                    <th className="text-center pb-2 font-normal">Qty</th>
                                    <th className="text-right pb-2 font-normal">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {items.map((item, i) => (
                                    <tr key={i}>
                                        <td className="py-2 text-gray-800">
                                            {item.description || "Item description"}
                                            {item.vatRate === 0 && tenant.turnoverBand !== 'micro' && <span className="text-[10px] ml-1 text-gray-400">(Zero-Rated)</span>}
                                        </td>
                                        <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                                        <td className="py-2 text-right font-medium text-gray-900">
                                            { (item.quantity * item.unitPrice).toLocaleString(undefined, {minimumFractionDigits: 2}) }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-8">
                    <div className="flex justify-between mb-2 text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>{tenant.currencySymbol}{calculateSubtotal().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between mb-4 text-sm text-gray-600">
                        <span>VAT ({tenant.turnoverBand === 'micro' ? 'Exempt' : '7.5%'})</span>
                        <span>{tenant.currencySymbol}{calculateVatTotal().toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-dashed border-gray-300 pt-2">
                        <span className="font-bold text-gray-900 uppercase">Total Due</span>
                        <p className="text-3xl font-bold text-brand">{tenant.currencySymbol}{calculateGrandTotal().toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                    
                    <div className="mt-8 text-center text-[10px] text-gray-400">
                        Thank you for your business. Please make payment within 30 days.
                        <br/>Generated by OpCore
                    </div>
                </div>
          </div>
      </div>

    </div>
  );
};

export default InvoiceGenerator;