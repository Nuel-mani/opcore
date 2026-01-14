import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { Download, Calendar, Filter, Table as TableIcon } from 'lucide-react';

export const AdvancedLedger: React.FC = () => {
    // ...
    // export default AdvancedLedger;
    // Expense Logging State
    const { tenant, transactions, addTransaction, deleteTransaction, updateTransaction } = useTenant() as any;
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newExpense, setNewExpense] = useState({ amount: '', description: '', category: 'General', date: new Date().toISOString().split('T')[0] });

    const handleLogExpense = async () => {
        if (!newExpense.amount || !newExpense.description) return;

        // Robust Parsing: Remove commas if any (though type=number usually prevents them)
        const cleanAmount = parseFloat(newExpense.amount.toString().replace(/,/g, ''));
        if (isNaN(cleanAmount)) {
            alert("Invalid Amount");
            return;
        }

        if (editingId) {
            // UPDATE EXISTING
            try {
                await updateTransaction(editingId, {
                    date: newExpense.date,
                    amount: cleanAmount,
                    description: newExpense.description,
                    categoryName: newExpense.category,
                    categoryId: newExpense.category.toLowerCase().replace(/\s+/g, '_'),
                });
            } catch (e) {
                console.error("Update Failed:", e);
                alert("Failed to update transaction. Please try again.");
            }
        } else {
            // CREATE NEW
            await addTransaction({
                id: 'tx_' + Date.now(),
                date: newExpense.date,
                type: 'expense',
                amount: cleanAmount,
                description: newExpense.description,
                categoryName: newExpense.category,
                categoryId: newExpense.category.toLowerCase().replace(/\s+/g, '_'),
                isDeductible: true, // Default to true for ease
                status: 'completed'
            });
        }

        setIsExpenseModalOpen(false);
        setEditingId(null);
        setNewExpense({ amount: '', description: '', category: 'General', date: new Date().toISOString().split('T')[0] });
    };

    const handleEditClick = (tx: any) => {
        setEditingId(tx.id);
        setNewExpense({
            amount: Math.abs(tx.amount).toString(),
            description: tx.description,
            category: tx.categoryName || 'General',
            date: new Date(tx.date).toISOString().split('T')[0]
        });
        setIsExpenseModalOpen(true);
    };

    const handleDeleteClick = async (id: string) => {
        if (confirm('Are you sure you want to delete this record? This cannot be undone.')) {
            await deleteTransaction(id);
        }
    };

    const [filterType, setFilterType] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Derive Unique Categories
    const uniqueCategories = React.useMemo(() => {
        const cats = new Set((transactions || []).map((t: any) => t.categoryName).filter(Boolean));
        return Array.from(cats).sort();
    }, [transactions]);

    const filteredTransactions = (transactions || []).filter((t: any) => {
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesCategory = categoryFilter === 'all' || t.categoryName === categoryFilter;
        const matchesSearch = !searchQuery ||
            (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.referenceId?.toLowerCase().includes(searchQuery.toLowerCase()));

        // Date Check
        let matchesDate = true;
        const txDate = new Date(t.date);
        if (startDate) matchesDate = matchesDate && txDate >= new Date(startDate);
        if (endDate) matchesDate = matchesDate && txDate <= new Date(endDate);

        return matchesType && matchesDate && matchesCategory && matchesSearch;
    });

    const handleExport = () => {
        const headers = "Date,Reference ID,Description,Category,Type,Amount,VAT Amount\n";
        const rows = filteredTransactions.map((t: any) => {
            // Escape CSV fields
            const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
            return `${t.date},${t.referenceId || ''},${desc},${t.categoryName || 'Uncategorized'},${t.type},${t.amount},${t.vatAmount || 0}`;
        }).join("\n");

        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tenant.businessName || 'OpCore'}_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto pb-20">
            {/* Header Rules */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TableIcon className="text-blue-600" /> General Ledger
                    </h1>
                    <p className="text-gray-500 text-sm">Comprehensive record of all financial activities.</p>
                </div>

                {/* Actions Toolbar */}
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Date Filters */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-10 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-10 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Search & Categories */}
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-4 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none w-32 lg:w-48"
                    />

                    <div className="relative">
                        <select
                            value={categoryFilter}
                            onChange={e => setCategoryFilter(e.target.value)}
                            className="appearance-none pl-3 pr-8 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none max-w-[150px]"
                        >
                            <option value="all">All Cats.</option>
                            {/* @ts-ignore */}
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <Filter className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" size={14} />
                    </div>

                    {/* Action Buttons */}
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setNewExpense({ amount: '', description: '', category: 'General', date: new Date().toISOString().split('T')[0] });
                            setIsExpenseModalOpen(true);
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 font-bold rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm"
                    >
                        + Expense
                    </button>

                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* EXPENSE MODAL */}
            {isExpenseModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {editingId ? 'Edit Transaction' : 'Log New Expense'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                <input
                                    autoFocus
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-red-500"
                                    placeholder="e.g. Office Rent, Uber, AWS Bill"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount ({tenant.currencySymbol})</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-red-500 font-mono font-bold text-lg"
                                        placeholder="0.00"
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                                    <input
                                        type="date"
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-red-500"
                                        value={newExpense.date}
                                        onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                <select
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-red-500"
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                >
                                    {['General', 'Rent', 'Logistics', 'Utilities', 'Salaries', 'Marketing', 'Software', 'Tax'].map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => setIsExpenseModalOpen(false)}
                                    className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogExpense}
                                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-500/30"
                                >
                                    {editingId ? 'Save Changes' : 'Log Expense'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-4 font-bold">Date</th>
                                <th className="px-6 py-4 font-bold">Reference</th>
                                <th className="px-6 py-4 font-bold">Description</th>
                                <th className="px-6 py-4 font-bold">Category</th>
                                <th className="px-6 py-4 font-bold text-right">Amount</th>
                                <th className="px-6 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredTransactions.map((tx: any) => (
                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-gray-500 whitespace-nowrap">{tx.date}</td>
                                    <td className="px-6 py-4 font-mono text-xs text-blue-600">{tx.referenceId || '-'}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{tx.description}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                                            {tx.categoryName}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-mono font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-gray-900 dark:text-gray-100'}`}>
                                        {tx.type === 'income' ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditClick(tx)}
                                                className="p-1 hover:bg-blue-50 text-blue-600 rounded"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(tx.id)}
                                                className="p-1 hover:bg-red-50 text-red-600 rounded"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                        No financial records found for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdvancedLedger;
