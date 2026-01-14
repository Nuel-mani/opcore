import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { ReceiptScanner as ReceiptScannerUtil, ScannedReceipt } from '../utils/ReceiptScanner';

interface QueueItem {
    id: string;
    fileUri: string; // Changed from fileName for utility
    fileName: string;
    status: 'pending' | 'processing' | 'ready' | 'error';
    progress: number;
    data?: Partial<ScannedReceipt>;
}

// Global simulation of a queue (In real app, use Context or Redux)
export const processingQueue: QueueItem[] = [];
export const listeners: (() => void)[] = [];

const notifyListeners = () => listeners.forEach(l => l());

export const addToQueue = (files: File[]) => {
    files.forEach(file => {
        const id = Math.random().toString(36).substr(2, 9);
        const fileUri = URL.createObjectURL(file); // Create blob URL for processing

        processingQueue.push({
            id,
            fileUri,
            fileName: file.name,
            status: 'pending',
            progress: 0
        });

        // Simulate Processing (Mock Worker)
        simulateWorker(id);
    });
    notifyListeners();
};

const simulateWorker = async (id: string) => {
    const item = processingQueue.find(i => i.id === id);
    if (!item) return;

    // 1. Wait for slot
    item.status = 'processing';
    notifyListeners();

    // 2. Perform Intelligent Scan (uses Demo OCR)
    const text = await ReceiptScannerUtil.performOCR(item.fileUri);
    const extracted = ReceiptScannerUtil.parseReceiptText(text);

    // 3. Store Result
    item.data = {
        ...extracted,
        date: extracted.date || new Date().toISOString().split('T')[0],
    };

    // 4. Complete
    item.progress = 100;
    item.status = 'ready';
    notifyListeners();
};

const ProcessingQueue: React.FC = () => {
    const [items, setItems] = useState<QueueItem[]>(processingQueue);
    const { tenant, addTransaction } = useTenant();

    const handleImportAll = async () => {
        const readyItems = items.filter(i => i.status === 'ready');
        if (readyItems.length === 0) return;

        let importedCount = 0;
        for (const item of readyItems) {
            if (item.data && addTransaction) {
                await addTransaction({
                    id: `tx-${Date.now()}-${Math.random()}`,
                    amount: item.data.amount || 0,
                    date: item.data.date || new Date().toISOString(),
                    type: item.data.type || 'expense',
                    categoryId: 'office_updates',
                    categoryName: 'Office Expenses',
                    description: item.data.description || `Scanned Receipt: ${item.fileName}`,
                    payee: item.data.vendorName || 'Unknown Vendor',
                    receiptUrls: [item.fileUri],
                    hasVatEvidence: item.data.hasVatEvidence,
                    // @ts-ignore
                    vatAmount: item.data.vatAmount || 0
                });
                // Remove from queue
                const idx = processingQueue.indexOf(item);
                if (idx > -1) processingQueue.splice(idx, 1);
                importedCount++;
            }
        }
        notifyListeners();
        alert(`Successfully imported ${importedCount} transactions to the Ledger!`);
    };

    useEffect(() => {
        const update = () => setItems([...processingQueue]);
        listeners.push(update);
        return () => {
            const idx = listeners.indexOf(update);
            if (idx > -1) listeners.splice(idx, 1);
        };
    }, []);

    if (items.length === 0) return null;

    const readyCount = items.filter(i => i.status === 'ready').length;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Clock size={16} className="text-brand" /> Batch Processing Queue
                </h3>
                {readyCount > 0 && (
                    <button
                        onClick={handleImportAll}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold hover:bg-green-200 transition"
                    >
                        Import {readyCount} Ready
                    </button>
                )}
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="w-5 shrink-0">
                            {item.status === 'pending' && <Clock size={16} className="text-gray-400" />}
                            {item.status === 'processing' && <Loader2 size={16} className="text-brand animate-spin" />}
                            {item.status === 'ready' && <CheckCircle size={16} className="text-green-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-gray-700 dark:text-gray-300 font-medium">{item.fileName}</p>
                            {item.status === 'processing' && (
                                <div className="h-1 bg-gray-200 dark:bg-gray-600 rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-brand transition-all duration-300" style={{ width: `${item.progress}%` }}></div>
                                </div>
                            )}
                        </div>
                        <span className="text-xs text-gray-400 capitalize">{item.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProcessingQueue;
