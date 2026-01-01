
import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { analyzeExpenseWithGemini } from '../services/geminiService';
import { Sparkles, AlertCircle, Search, Plus, Trash2, Building, ShieldCheck, FileText, AlertTriangle, Wallet } from 'lucide-react';
import { WalletType } from '../types';

const TaxOptimizer: React.FC = () => {
  const { transactions, taxRules, tenant, addTransaction, deleteTransaction } = useTenant();
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [hasVatEvidence, setHasVatEvidence] = useState(true); // Section 21p Default
  const [wallet, setWallet] = useState<WalletType>('operations');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAmount) return;

    setIsAnalyzing(true);
    
    // AI Loophole Scan
    const analysis = await analyzeExpenseWithGemini(newDesc, tenant.countryCode, taxRules);
    
    let isDeductible = analysis.confidence > 0.6;
    let deductionTip = analysis.advice;
    let finalCategory = analysis.categoryName;
    let finalCatId = analysis.categoryId;
    let isRnd = false;

    const numericAmount = parseFloat(newAmount);

    // --- NTA 2025 RULES ---

    // 1. VAT Compliance Poison Pill (Section 21p)
    if (!hasVatEvidence) {
        isDeductible = false;
        deductionTip = "POISON PILL CHECK: No VAT evidence provided. Section 21(p) automatically disallows this expense. You lost the 30% tax shield.";
    }

    // 2. Crypto Ring-Fencing
    if (wallet === 'crypto') {
        deductionTip = "RING-FENCED: Crypto losses cannot offset Operations profit. This is tracked in a separate digital wallet.";
        // It's deductible, but only against crypto gains. For general ledger, we might flag it differently.
        finalCategory = `Crypto Asset (${finalCategory})`;
    }

    // 3. R&D Capping Logic
    if (finalCategory.toLowerCase().includes('research') || newDesc.toLowerCase().includes('r&d')) {
        isRnd = true;
        const rdCap = (transactions.filter(t => t.type === 'income').reduce((a,b)=>a+b.amount,0)) * 0.05;
        // Simple logic for checking cap (in reality needs cumulative check)
        if (numericAmount > rdCap && rdCap > 0) {
            deductionTip = `R&D OPTIMIZATION: Amount exceeds 5% turnover cap. Excess moved to Capital Allowance schedule (4yr amortization).`;
            isDeductible = true; // Still deductible, just differently
        }
    }

    // 4. Aggressive Expense Validator (Wholly & Exclusively)
    if (numericAmount > 500000 && hasVatEvidence) {
        // High value check
        if (!analysis.confidence) {
             deductionTip += " | High Value Item: Ensure this is 'Wholly & Exclusively' for business to survive audit.";
        }
    }

    // Tier 3: Capital Allowance Logic
    if (analysis.isCapitalAsset || (numericAmount > 1000000 && newDesc.toLowerCase().includes('software'))) {
        isDeductible = false; // Not immediately deductible
        deductionTip = "Asset Capitalized: Moved to Capital Allowance schedule. Software/IP writes off at 25% per year.";
        finalCategory = "Capital Asset (Software/IP)";
    }

    addTransaction({
        id: `tx-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'expense',
        amount: numericAmount,
        categoryId: finalCatId,
        categoryName: finalCategory,
        description: newDesc,
        isDeductible: isDeductible,
        weCompliant: analysis.confidence > 0.7,
        isCapitalAsset: analysis.isCapitalAsset,
        deductionTip: deductionTip,
        hasVatEvidence: hasVatEvidence,
        wallet: wallet,
        isRndExpense: isRnd
    });

    setNewDesc('');
    setNewAmount('');
    setIsAnalyzing(false);
  };

  const handleExportLedger = () => {
      const headers = ["Date", "Description", "Amount", "Type", "Category", "Deductible", "VAT Evidence", "Wallet"];
      const rows = transactions.map(tx => [
          tx.date,
          tx.description,
          tx.amount,
          tx.type,
          tx.categoryName,
          tx.isDeductible ? "Yes" : "No",
          tx.hasVatEvidence ? "Yes" : "NO (Poison Pill)",
          tx.wallet || 'operations'
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
          + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `opcore_ledger_NTA2025.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const expenses = transactions.filter(t => t.type === 'expense');

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
               Tax Optimizer <Sparkles className="text-yellow-500" />
           </h2>
           <p className="text-gray-500 dark:text-gray-400">Section 21(p) Validator & "Wholly & Exclusively" Engine.</p>
        </div>
        <button 
            onClick={handleExportLedger}
            className="flex items-center gap-2 text-sm font-medium text-brand bg-brand/10 hover:bg-brand/20 px-4 py-2 rounded-lg transition"
        >
            <FileText size={16} /> Export Ledger (CSV)
        </button>
      </div>

      {/* Add Expense Bar */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Description</label>
                    <input 
                        type="text" 
                        placeholder="e.g., Facebook Ads, New Server, Client Dinner" 
                        className="w-full mt-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand outline-none"
                        value={newDesc}
                        onChange={e => setNewDesc(e.target.value)}
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Amount</label>
                    <div className="relative mt-1">
                        <span className="absolute left-3 top-2 text-gray-500 dark:text-gray-400">{tenant.currencySymbol}</span>
                        <input 
                            type="number" 
                            placeholder="0.00" 
                            className="w-full pl-8 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-brand outline-none"
                            value={newAmount}
                            onChange={e => setNewAmount(e.target.value)}
                        />
                    </div>
                </div>
              </div>

              {/* NTA 2025 Controls */}
              <div className="flex flex-col md:flex-row gap-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                  
                  {/* VAT Compliance Check */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${hasVatEvidence ? 'bg-green-500 border-green-500' : 'bg-white border-gray-400'}`}>
                          {hasVatEvidence && <ShieldCheck size={14} className="text-white" />}
                      </div>
                      <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={hasVatEvidence} 
                          onChange={e => setHasVatEvidence(e.target.checked)} 
                      />
                      <div>
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">VAT Paid? (Sec 21p)</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Required for deduction. No VAT = No Tax Shield.</p>
                      </div>
                  </label>

                  {/* Wallet Toggle */}
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600">
                          <Wallet size={16} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-700 dark:text-gray-200 block mb-1">Ledger Wallet</label>
                          <select 
                            value={wallet}
                            onChange={(e) => setWallet(e.target.value as WalletType)}
                            className="text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 outline-none"
                          >
                              <option value="operations">Operations (Standard)</option>
                              <option value="crypto">Crypto/Digital Asset (Ring-Fenced)</option>
                          </select>
                      </div>
                  </div>
              </div>

              <button 
                type="submit" 
                disabled={isAnalyzing}
                className="w-full bg-brand text-brand-contrast px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-70 shadow hover:opacity-90 transition"
              >
                  {isAnalyzing ? <span className="animate-pulse">Running NTA 2025 Checks...</span> : <> <Plus size={18} /> Validate & Add Expense </>}
              </button>
          </form>
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
              <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Description</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Category</th>
                          <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                          <th className="text-center py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                          <th className="py-4 px-6"></th>
                      </tr>
                  </thead>
                  <tbody>
                      {expenses.map((tx) => (
                          <React.Fragment key={tx.id}>
                            <tr 
                                onClick={() => setSelectedTxId(selectedTxId === tx.id ? null : tx.id)}
                                className={`group border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer ${
                                    tx.wallet === 'crypto' ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                                }`}
                            >
                                <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">{tx.date}</td>
                                <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">
                                    {tx.description}
                                    {tx.wallet === 'crypto' && <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1 rounded">CRYPTO</span>}
                                </td>
                                <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">{tx.categoryName}</span>
                                </td>
                                <td className="py-4 px-6 text-right font-medium text-gray-900 dark:text-white">
                                    {tenant.currencySymbol}{tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                </td>
                                <td className="py-4 px-6 text-center">
                                    {tx.isDeductible ? (
                                        <div className="inline-flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                                            <ShieldCheck size={12} /> Valid
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1 text-xs font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                                            <AlertTriangle size={12} /> Disallowed
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id); }}
                                        className="text-gray-400 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                            {/* "Loophole" Tooltip / Detail Row */}
                            {selectedTxId === tx.id && (
                                <tr className="bg-gray-50 dark:bg-gray-700/50 animate-fade-in">
                                    <td colSpan={6} className="p-0">
                                        <div className="p-6 border-l-4 border-brand">
                                            <div className="flex items-start gap-4">
                                                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-lg text-yellow-700 mt-1">
                                                    <AlertCircle size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 dark:text-white">NTA 2025 Analysis</h4>
                                                    <p className="text-gray-700 dark:text-gray-300 mt-1">{tx.deductionTip}</p>
                                                    {!tx.hasVatEvidence && (
                                                        <p className="text-red-600 text-xs font-bold mt-2">Reason: No VAT Evidence (Sec 21p).</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                          </React.Fragment>
                      ))}
                  </tbody>
              </table>
              {expenses.length === 0 && (
                  <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                      <Search className="mx-auto h-12 w-12 mb-4 text-gray-300 dark:text-gray-600" />
                      <p>No expenses logged yet. Add one above to see the Tax Engine work.</p>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default TaxOptimizer;
