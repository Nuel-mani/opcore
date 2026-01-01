
import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { calculatePIT_NTA2025 } from '../utils/taxEngine';
import { Home, Lock, UploadCloud, AlertTriangle, ShieldCheck, Save, Edit2 } from 'lucide-react';

const RentReliefCard: React.FC = () => {
  const { tenant, updateTenant } = useTenant();
  const [isEditing, setIsEditing] = useState(false);
  const [tempRent, setTempRent] = useState(tenant.rentAmount?.toString() || '0');

  const grossIncome = tenant.annualIncome || 0;
  const pension = tenant.pensionContribution || 0;
  const rent = tenant.rentAmount || 0;
  
  // Calculate potential relief based on current input/state
  const currentCalcRent = isEditing ? (parseFloat(tempRent) || 0) : rent;
  const taxImpact = calculatePIT_NTA2025(grossIncome, pension, currentCalcRent);

  const handleSave = () => {
      updateTenant({ rentAmount: parseFloat(tempRent) || 0 });
      setIsEditing(false);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              updateTenant({ 
                  rentReceiptUploaded: true,
                  rentReceiptUrl: reader.result as string 
              });
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col relative overflow-hidden h-full">
         <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-2 text-brand">
                 <Home size={20} />
                 <h3 className="font-bold">Rent Relief Vault</h3>
             </div>
             {tenant.subscriptionTier === 'free' && <Lock size={16} className="text-gray-400" />}
         </div>

         <div className="flex-1 space-y-4">
            {/* Rent Input Section */}
            <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase flex justify-between items-center">
                    Annual Rent Declared
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="text-brand hover:underline flex items-center gap-1">
                            <Edit2 size={12} /> <span className="text-xs">Edit</span>
                        </button>
                    )}
                </label>
                {isEditing ? (
                    <div className="flex gap-2 mt-1">
                        <input 
                            type="number" 
                            value={tempRent}
                            onChange={(e) => setTempRent(e.target.value)}
                            className="w-full px-3 py-1 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-brand outline-none"
                        />
                        <button onClick={handleSave} className="bg-brand text-brand-contrast px-3 rounded hover:opacity-90">
                            <Save size={16} />
                        </button>
                    </div>
                ) : (
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        {tenant.currencySymbol}{rent.toLocaleString()}
                    </p>
                )}
            </div>

            {/* Relief Value Display */}
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
                 <div className="flex justify-between text-sm">
                     <span className="text-gray-600 dark:text-gray-300">Tax Relief Value:</span>
                     <span className="font-bold text-green-600 dark:text-green-400">
                         {tenant.currencySymbol}{taxImpact.rentReliefClaimed.toLocaleString()}
                         {taxImpact.rentReliefClaimed === 500000 && <span className="text-xs text-gray-400 font-normal ml-1">(Capped)</span>}
                     </span>
                </div>
            </div>

            {/* Warnings & Status */}
            {currentCalcRent === 0 ? (
                 <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>Warning: You are claiming ₦0 relief. Enter rent to optimize.</span>
                 </div>
            ) : !tenant.rentReceiptUploaded ? (
                <div className="bg-orange-50 text-orange-700 p-3 rounded-lg text-xs flex items-start gap-2 animate-pulse">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>Action Required: You are losing ₦{taxImpact.rentReliefClaimed.toLocaleString()} in relief. Upload receipt to claim.</span>
                 </div>
            ) : (
                 <div className="bg-green-50 text-green-700 p-3 rounded-lg text-xs flex items-start gap-2">
                    <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                    <span>Relief Locked In: Receipt validated for {new Date().getFullYear()} tax filing.</span>
                 </div>
            )}
            
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                NTA 2025 Requirement: Relief is invalid without proof of payment.
            </p>
         </div>
         
         {/* Action Button */}
         <label 
            className={`mt-4 w-full py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2 cursor-pointer border
                ${tenant.subscriptionTier === 'free' 
                    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-brand text-brand-contrast border-brand hover:opacity-90 shadow-sm'}`}
         >
             {tenant.subscriptionTier === 'free' ? (
                 <>Upgrade to Upload Proof</>
             ) : (
                 <>
                    <UploadCloud size={16} /> 
                    {tenant.rentReceiptUploaded ? 'Update Receipt' : 'Upload Receipt'}
                    <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        className="hidden" 
                        onChange={handleUpload}
                    />
                 </>
             )}
         </label>
    </div>
  );
};

export default RentReliefCard;
