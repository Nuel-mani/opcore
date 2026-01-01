import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { useTenant } from '../context/TenantContext';

interface QueueItem {
    id: string;
    fileName: string;
    status: 'pending' | 'processing' | 'ready' | 'error';
    progress: number;
}

// Global simulation of a queue (In real app, use Context or Redux)
export const processingQueue: QueueItem[] = [];
export const listeners: (() => void)[] = [];

const notifyListeners = () => listeners.forEach(l => l());

export const addToQueue = (files: File[]) => {
    files.forEach(file => {
        const id = Math.random().toString(36).substr(2, 9);
        processingQueue.push({
            id,
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

    // Wait for slot
    setTimeout(() => {
        item.status = 'processing';
        item.progress = 10;
        notifyListeners();

        // Simulate Tesseract Steps
        let p = 10;
        const interval = setInterval(() => {
            p += 15;
            item.progress = p;
            if (p >= 100) {
                clearInterval(interval);
                item.status = 'ready';
                notifyListeners();
            }
            notifyListeners();
        }, 800); // 4-5 seconds per item
    }, 1000 * Math.random() * 2);
};

const ProcessingQueue: React.FC = () => {
    const [items, setItems] = useState<QueueItem[]>(processingQueue);
    const { tenant } = useTenant();

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
                    <button className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold hover:bg-green-200 transition">
                        Review {readyCount} Ready
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
