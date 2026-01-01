
import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { Lock, Search, Filter, Download, Plus, CheckCircle, Clock } from 'lucide-react';

const AdvancedLedger: React.FC = () => {
  const { tenant, transactions } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');

  if (tenant.subscriptionTier === 'free') {
      return (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full mb-6">
                  <Lock size={64} className="text-gray-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Advanced Ledger Locked</h2>
              <p className="max-w-md text-gray-600 dark:text-gray-400 mb-8">
                  The Advanced Ledger provides a spreadsheet-like view for bulk editing, complex filtering, and detailed audit trails.
              </p>
          </div>
      );
  }

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.payee?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col animate-fade-in">
        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Business Transactions</h2>
            
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-grow md:flex-grow-0">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search ledger..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-brand outline-none w-full md:w-64"
                    />
                </div>
                <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50">
                    <Filter size={16} /> <span className="hidden sm:inline">Filter</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50">
                    <Download size={16} /> <span className="hidden sm:inline">Export</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-contrast rounded-lg text-sm font-medium hover:opacity-90">
                    <Plus size={16} /> New
                </button>
            </div>
        </div>

        {/* Spreadsheet Table */}
        <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
            <table className="w-full border-collapse text-sm">
                <thead className="bg-[#fff8dc] dark:bg-gray-800 text-gray-900 dark:text-gray-200 font-semibold sticky top-0 z-0">
                    <tr>
                        <th className="border border-gray-300 dark:border-gray-700 px-2 py-2 w-10 text-center">#</th>
                        <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left min-w-[100px]">Date</th>
                        <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left min-w-[150px]">Transaction Name</th>
                        <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left min-w-[150px]">Payee / Customer</th>
                        <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left min-w-[100px]">Type</th>
                        <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-right min-w-[120px]">Amount</th>
                        <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left min-w-[200px]">Description</th>
                        <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left min-w-[120px]">Method</th>
                        <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center w-20">Material?</th>
                        <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left min-w-[100px]">Auth ID</th>
                        <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center w-24">Sync</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredTransactions.map((tx, idx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 group">
                            <td className="border-r border-gray-200 dark:border-gray-700 px-2 py-2 text-center text-gray-400 text-xs">{idx + 1}</td>
                            <td className="border-r border-gray-200 dark:border-gray-700 px-4 py-2 whitespace-nowrap">{tx.date}</td>
                            <td className="border-r border-gray-200 dark:border-gray-700 px-4 py-2 text-gray-900 dark:text-white font-medium">{tx.categoryName}</td>
                            <td className="border-r border-gray-200 dark:border-gray-700 px-4 py-2">{tx.payee || '-'}</td>
                            <td className="border-r border-gray-200 dark:border-gray-700 px-4 py-2">
                                <span className={`px-2 py-0.5 rounded text-xs border ${
                                    tx.type === 'income' 
                                    ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300' 
                                    : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-300'
                                }`}>
                                    {tx.type.toUpperCase()}
                                </span>
                            </td>
                            <td className="border-r border-gray-200 dark:border-gray-700 px-4 py-2 text-right font-mono">
                                {tenant.currencySymbol}{tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </td>
                            <td className="border-r border-gray-200 dark:border-gray-700 px-4 py-2 text-gray-600 dark:text-gray-400 truncate max-w-xs">{tx.description}</td>
                            <td className="border-r border-gray-200 dark:border-gray-700 px-4 py-2">{tx.paymentMethod || 'Cash'}</td>
                            <td className="border-r border-gray-200 dark:border-gray-700 px-4 py-2 text-center">
                                {tx.isCapitalAsset ? (
                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded">YES</span>
                                ) : '-'}
                            </td>
                            <td className="border-r border-gray-200 dark:border-gray-700 px-4 py-2 text-xs font-mono text-gray-500">{tx.refId || tx.id.slice(0,8)}</td>
                            <td className="px-4 py-2 text-center">
                                {tx.syncStatus === 'synced' ? (
                                    <CheckCircle size={14} className="mx-auto text-green-500" />
                                ) : (
                                    <Clock size={14} className="mx-auto text-orange-400" />
                                )}
                            </td>
                        </tr>
                    ))}
                    {/* Empty Rows Filler */}
                    {[...Array(15)].map((_, i) => (
                        <tr key={`empty-${i}`} className="h-8">
                            <td className="border-r border-gray-200 dark:border-gray-700"></td>
                            <td className="border-r border-gray-200 dark:border-gray-700"></td>
                            <td className="border-r border-gray-200 dark:border-gray-700"></td>
                            <td className="border-r border-gray-200 dark:border-gray-700"></td>
                            <td className="border-r border-gray-200 dark:border-gray-700"></td>
                            <td className="border-r border-gray-200 dark:border-gray-700"></td>
                            <td className="border-r border-gray-200 dark:border-gray-700"></td>
                            <td className="border-r border-gray-200 dark:border-gray-700"></td>
                            <td className="border-r border-gray-200 dark:border-gray-700"></td>
                            <td className="border-r border-gray-200 dark:border-gray-700"></td>
                            <td></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        {/* Footer Status Bar */}
        <div className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 text-xs flex justify-between items-center text-gray-500">
            <div className="flex gap-4">
                <span>{filteredTransactions.length} records found</span>
                <span>Sum: {tenant.currencySymbol}{filteredTransactions.reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</span>
            </div>
            <div className="flex gap-2">
                <button className="text-brand hover:underline">Add 1000 rows</button>
            </div>
        </div>
    </div>
  );
};

export default AdvancedLedger;
