import React from 'react';
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
    onReset?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Synchronizing your workspace...", onReset }) => {
    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[9999] flex flex-col items-center justify-center animate-fade-in">

            {/* Animated Logo Container */}
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
                <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex items-center justify-center relative z-10 border border-gray-100 dark:border-gray-700">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-lg animate-spin-slow"></div>
                </div>

                {/* Orbiting Sync Icon */}
                <div className="absolute -right-2 -bottom-2 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-gray-100 dark:border-gray-700 animate-bounce">
                    <RefreshCw size={20} className="text-blue-600 animate-spin" />
                </div>
            </div>

            {/* Text Content */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">OpCore</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse font-medium">{message}</p>

            {/* Progress Bar (Fake but satisfying) */}
            <div className="w-64 h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-8 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-progress-indeterminate"></div>
            </div>

            <div className="flex items-center gap-2 mt-8 text-[10px] text-gray-400 uppercase tracking-widest font-bold opacity-60">
                <ShieldCheck size={12} />
                <span>Securely Decrypting Data</span>
            </div>

            {/* Emergency Reset */}
            {onReset && (
                <button
                    onClick={onReset}
                    className="absolute bottom-8 text-xs text-red-400 hover:text-red-500 underline opacity-50 hover:opacity-100 transition-opacity"
                >
                    Emergency App Reset
                </button>
            )}
        </div>
    );
};

export default LoadingScreen;
