
import React from 'react';
import { useTenant } from '../context/TenantContext';
import { RefreshCw, CheckCircle } from 'lucide-react';

export const SyncIndicator: React.FC = () => {
    const { isSyncing } = useTenant();
    const [showSuccess, setShowSuccess] = React.useState(false);

    React.useEffect(() => {
        if (!isSyncing) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isSyncing]);

    if (!isSyncing && !showSuccess) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium rounded-full shadow-lg border border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom-2 fade-in duration-300">
            {isSyncing ? (
                <>
                    <RefreshCw size={14} className="text-blue-600 animate-spin" />
                    <span className="text-gray-600 dark:text-gray-300">Syncing...</span>
                </>
            ) : (
                <>
                    <CheckCircle size={14} className="text-green-500" />
                    <span className="text-gray-600 dark:text-gray-300">Saved</span>
                </>
            )}
        </div>
    );
};
