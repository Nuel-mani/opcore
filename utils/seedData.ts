
import { Transaction, WalletType } from '../types';

export const generateSeedData = (): Transaction[] => {
    const transactions: Transaction[] = [];
    const today = new Date();
    const year = today.getFullYear();

    // Helpers
    const addTx = (
        date: string,
        type: 'income' | 'expense',
        amount: number,
        desc: string,
        catId: string,
        catName: string,
        extras: Partial<Transaction> = {}
    ) => {
        transactions.push({
            id: `seed-${Math.random().toString(36).substr(2, 9)}`,
            date,
            type,
            amount,
            description: desc,
            categoryId: catId,
            categoryName: catName,
            syncStatus: 'synced',
            ...extras
        });
    };

    // 1. Massive Income (To trigger NTA 2025 > 25m and > 50m thresholds)
    // Total Income: ~ 65M (Large Company Territory)
    addTx(`${year}-01-15`, 'income', 15000000, 'Q1 Retainer - Dangote Refinery Project', 'income', 'Sales');
    addTx(`${year}-02-20`, 'income', 8500000, 'Software Licensing - First Bank', 'income', 'Sales');
    addTx(`${year}-03-10`, 'income', 12000000, 'Cloud Migration Service - MTN Nigeria', 'income', 'Sales');
    addTx(`${year}-04-05`, 'income', 9500000, 'Consulting Fees - Lagos State Govt', 'income', 'Sales');
    addTx(`${year}-05-22`, 'income', 20000000, 'Enterprise ERP Rollout - GTBank', 'income', 'Sales');

    // 2. Regular Operating Expenses (Deductible)
    // Monthly Diesel (high cost in Nigeria)
    ['01', '02', '03', '04', '05'].forEach(month => {
        addTx(`${year}-${month}-02`, 'expense', 450000, 'Diesel Supply (1000 Litres)', 'rule-4', 'Power & Utilities', {
            isDeductible: true,
            weCompliant: true,
            hasVatEvidence: true,
            deductionTip: "Fully deductible operating expense."
        });
    });

    // Monthly Salaries
    ['01', '02', '03', '04', '05'].forEach(month => {
        addTx(`${year}-${month}-25`, 'expense', 2500000, 'Staff Salaries (Net)', 'rule-3', 'Staff Costs', {
            isDeductible: true,
            weCompliant: true,
            hasVatEvidence: false, // Salaries don't have VAT, but PAYE. 
            deductionTip: "Fully deductible. Ensure PAYE remittance."
        });
    });

    // 3. Capital Assets (Tier 3 - NTA 2025)
    addTx(`${year}-02-14`, 'expense', 18000000, 'New Toyota Hilux (Project Vehicle)', 'capital_asset', 'Capital Asset (Vehicle)', {
        isDeductible: false, // Capitalized, not expensed
        isCapitalAsset: true,
        assetClass: 'vehicle',
        hasVatEvidence: true,
        deductionTip: "Capitalized Asset: 25% annual allowance over 4 years."
    });

    addTx(`${year}-03-01`, 'expense', 4500000, 'MacBook Pro M3 Max (x3)', 'capital_asset', 'Capital Asset (Equipment)', {
        isDeductible: false,
        isCapitalAsset: true,
        assetClass: 'equipment',
        hasVatEvidence: true,
        deductionTip: "Capitalized Asset: 20% annual allowance over 5 years."
    });

    // 4. "Poison Pill" Violation (Section 21p)
    addTx(`${year}-04-12`, 'expense', 350000, 'Client Dinner @ Transcorp Hilton', 'rule-other', 'Entertainment', {
        isDeductible: false,
        weCompliant: false,
        hasVatEvidence: false, // Missing VAT!
        deductionTip: "POISON PILL CHECK: No VAT evidence provided. Section 21(p) disallows this."
    });

    // 5. Crypto Loss (Ring-Fenced)
    addTx(`${year}-05-01`, 'expense', 2500000, 'Bitcoin Dip Loss', 'crypto_loss', 'Crypto Asset', {
        isDeductible: false, // Can't offset against ops profit
        wallet: 'crypto',
        deductionTip: "RING-FENCED: Crypto losses cannot offset Operations profit."
    });

    // 6. Rent (Capped)
    addTx(`${year}-01-10`, 'expense', 8000000, 'Annual Office Rent (Lekki Phase 1)', 'rule-1', 'Rent (Business Premises)', {
        isDeductible: true,
        hasVatEvidence: true,
        deductionTip: "Fully deductible business rent."
    });

    // 7. CURRENT MONTH DATA (To populate Monthly Analytics)
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');

    // Income
    addTx(`${year}-${currentMonth}-15`, 'income', 212000, 'Small Client Payment', 'inc_1', 'Sales/Payment');

    // User Requested Expenses for Current Month
    addTx(`${year}-${currentMonth}-05`, 'expense', 100000, 'Social Media Ads', 'exp_01', 'Advertising');
    addTx(`${year}-${currentMonth}-08`, 'expense', 20000, 'Monthly Bank Charges', 'exp_02', 'Bank charge');
    addTx(`${year}-${currentMonth}-10`, 'expense', 50000, 'Client Lunch', 'exp_05', 'Business meals');
    addTx(`${year}-${currentMonth}-12`, 'expense', 30000, 'Stationery & Ink', 'exp_13', 'Office supplies');
    addTx(`${year}-${currentMonth}-14`, 'expense', 45000, 'POS & Transfer Feeds', 'exp_03', 'Business Transaction Expenses');
    addTx(`${year}-${currentMonth}-20`, 'expense', 150000, 'Electricity Bill', 'exp_19', 'Utilities');
    addTx(`${year}-${currentMonth}-25`, 'expense', 200000, 'Team Salaries', 'exp_08', 'Employee wages/salaries');
    addTx(`${year}-${currentMonth}-28`, 'expense', 100000, 'Vehicle Fuel & Maint', 'exp_20', 'Vehicle cost');

    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
