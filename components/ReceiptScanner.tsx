import React, { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { Camera, Upload, X, Check, Loader2, AlertCircle, FileText } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { parseReceiptText } from '../utils/receiptParser';
import { Transaction } from '../types';

interface ReceiptScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (transaction: Partial<Transaction>) => void;
}

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ isOpen, onClose, onSave }) => {
    const { tenant } = useTenant();
    const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        amount: '',
        date: '',
        time: '',
        description: '',
        refId: '',
        sender: '',
        receiver: '',
        category: 'general_admin',
        isDeductible: true,
        type: 'debit' as 'debit' | 'credit',
    });

    const processImage = async (file: File) => {
        setStep('processing');
        setStatusText('Initializing OCR Engine...');
        setProgress(10);

        try {
            const worker = await createWorker();

            setStatusText('Recognizing Text...');
            setProgress(40);

            const { data: { text } } = await worker.recognize(file);
            /* // logger not supported in v6 createWorker? verify docs if needed. 
               // For now assume simple recognize works. 
            */

            setProgress(90);
            setStatusText('Parsing Data...');

            const extracted = parseReceiptText(text);

            setFormData({
                amount: extracted.amount ? extracted.amount.toString() : '',
                date: extracted.date || new Date().toISOString().split('T')[0],
                time: extracted.time || '',
                description: extracted.narration,
                refId: extracted.refId || '',
                sender: extracted.sender || '',
                receiver: extracted.receiver || '',
                category: 'general_admin', // Default
                isDeductible: true,
                type: extracted.type || 'debit',
            });

            await worker.terminate();
            setStep('review');
        } catch (err) {
            console.error(err);
            alert('Failed to process image. Please try again.');
            setStep('upload');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Explicitly cast FileList to File[]
            const files = Array.from(e.target.files) as File[];

            // Batch Mode Check
            if (files.length > 1) {
                if (tenant.subscriptionTier !== 'pro') {
                    alert("Batch Scanning is a Pro feature. Please upgrade to scan multiple receipts at once.");
                    return;
                }

                // Dynamic Import
                import('./ProcessingQueue').then(({ addToQueue }) => {
                    addToQueue(files);
                    onClose();
                    alert(`Added ${files.length} receipts to the Processing Queue.`);
                });
                return;
            }

            // Single File
            const file = files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            processImage(file);
        }
    };

    const handleSave = () => {
        if (!formData.amount) return;

        // Combine Date and Time if possible
        let finalDate = new Date();
        try {
            if (formData.date && formData.time) {
                finalDate = new Date(`${formData.date}T${formData.time}`);
            } else if (formData.date) {
                finalDate = new Date(formData.date);
            }
        } catch (e) {
            console.warn("Date parsing failed, using now", e);
        }

        onSave({
            amount: parseFloat(formData.amount),
            date: finalDate,
            description: formData.description,
            // @ts-ignore - simplified category mapping for now
            categoryName: formData.category,
            categoryId: formData.category,
            isDeductible: formData.isDeductible,
            type: formData.type,
            refId: formData.refId,
            payee: formData.receiver || formData.sender, // Map to payee
            receiptImageUrl: imagePreview, // In real app, upload this to storage returns URL
        });
        onClose();
        // Reset
        setStep('upload');
        setImageFile(null);
        setImagePreview('');
        setFormData({ amount: '', date: '', time: '', description: '', refId: '', sender: '', receiver: '', category: 'general_admin', isDeductible: true, type: 'debit' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 md:rounded-2xl shadow-2xl w-full max-w-5xl min-h-screen md:min-h-0 md:h-[90vh] flex flex-col md:flex-row overflow-hidden">

                {/* Left: Image Preview (Top on Mobile) */}
                <div className="md:w-1/2 bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-6 relative min-h-[300px] md:h-full">
                    {step === 'upload' ? (
                        <div className="text-center space-y-4">
                            <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                                <Camera className="text-gray-400" size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Scan Receipt</h3>
                                <p className="text-sm text-gray-500">Upload an image to auto-extract details</p>
                            </div>
                            <label className="inline-flex items-center gap-2 bg-brand text-white px-6 py-2 rounded-full cursor-pointer hover:opacity-90 transition">
                                <Upload size={18} /> Select Image(s)
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                    ) : (
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                            <img src={imagePreview} alt="Receipt" className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
                            {step === 'processing' && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm rounded-lg">
                                    <Loader2 className="animate-spin mb-4" size={48} />
                                    <p className="text-lg font-bold">{statusText}</p>
                                    <div className="w-64 h-2 bg-gray-700 rounded-full mt-4 overflow-hidden">
                                        <div className="h-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Close Button Mobile */}
                    <button onClick={onClose} className="absolute top-4 left-4 md:hidden bg-white/20 hover:bg-white/40 p-2 rounded-full text-white z-10">
                        <X size={20} />
                    </button>
                </div>

                {/* Right: Form / Review (Bottom on Mobile) */}
                <div className="md:w-1/2 p-4 md:p-8 flex flex-col h-full bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {step === 'review' ? <><FileText className="text-brand" /> Review Details</> : 'New Transaction'}
                        </h2>
                        <button onClick={onClose} className="hidden md:block text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
                            <X size={24} />
                        </button>
                    </div>

                    {step === 'review' ? (
                        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-20 md:pb-0">

                            {/* Core Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Date</label>
                                    <input
                                        type="text" // Text to allow flexible OCR formats initially
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                        placeholder="YYYY-MM-DD"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Time</label>
                                    <input
                                        type="text"
                                        value={formData.time}
                                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                        placeholder="HH:MM"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Amount ({tenant.currencySymbol})</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono font-bold text-2xl"
                                />
                            </div>

                            {/* Reference & Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Reference ID</label>
                                    <input
                                        type="text"
                                        value={formData.refId}
                                        onChange={e => setFormData({ ...formData, refId: e.target.value })}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as 'debit' | 'credit' })}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                    >
                                        <option value="debit">Debit (Expense)</option>
                                        <option value="credit">Credit (Income)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Sender / Receiver */}
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Sender Name</label>
                                    <input
                                        type="text"
                                        value={formData.sender}
                                        onChange={e => setFormData({ ...formData, sender: e.target.value })}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Beneficiary Name</label>
                                    <input
                                        type="text"
                                        value={formData.receiver}
                                        onChange={e => setFormData({ ...formData, receiver: e.target.value })}
                                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Narration / Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white h-16 resize-none text-sm"
                                />
                            </div>

                            {/* Tax Cat (Only for Debits usually, but kept generally available) */}
                            <div className="p-4 bg-orange-50 dark:bg-gray-700/50 rounded-lg border border-orange-100 dark:border-gray-600">
                                <h4 className="font-bold text-gray-800 dark:text-white mb-3 text-sm flex items-center gap-2">
                                    <AlertCircle size={14} className="text-orange-500" /> Tax Categorization
                                </h4>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full p-2 border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white text-sm"
                                        >
                                            <option value="general_admin">General & Admin</option>
                                            <option value="travel_transport">Travel & Transport</option>
                                            <option value="office_rent">Office Rent</option>
                                            <option value="utilities">Utilities</option>
                                            <option value="inventory">Inventory / COGS</option>
                                            <option value="entertainment">Entertainment (Non-Deductible)</option>
                                        </select>
                                    </div>

                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.isDeductible ? 'bg-green-500' : 'bg-gray-300'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${formData.isDeductible ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={formData.isDeductible}
                                            onChange={e => setFormData({ ...formData, isDeductible: e.target.checked })}
                                            className="hidden"
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Mark as Deductible
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 mt-auto">
                                <button
                                    onClick={handleSave}
                                    className="w-full bg-brand text-brand-contrast py-3 rounded-xl font-bold hover:brightness-110 transition flex items-center justify-center gap-2"
                                >
                                    <Check size={20} /> Save Transaction
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-center items-center text-center p-8 opacity-50">
                            <FileText size={48} className="mb-4 text-gray-300" />
                            <p className="text-gray-400">Upload a receipt to start mapping details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReceiptScanner;
