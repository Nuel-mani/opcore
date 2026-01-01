
import { TaxRule, Tenant, Transaction, Budget } from './types';

export const INITIAL_TENANT: Tenant = {
  id: 'tenant-ng-001',
  businessName: 'Lagos Ventures Ltd',
  countryCode: 'NG',
  currencySymbol: '₦',
  brandColor: '#ea580c', // Orange from screenshot
  logoUrl: null,
  subscriptionTier: 'pro',
  turnoverBand: 'micro',
  tinNumber: '234-567-890',
  taxIdentityNumber: 'RC-1234567890123', // Placeholder for Unified Tax ID
  sector: 'services',
  accountType: 'business', // Added to satisfy Tenant interface
  businessStructure: 'limited', // Default mock structure
  rentReceiptUploaded: false,
  rentReceiptUrl: null
};

export const MOCK_TAX_RULES: TaxRule[] = [
  {
    id: 'rule-1',
    countryCode: 'NG',
    categoryName: 'Rent (Business Premises)',
    deductionPercentage: 100,
    legalCitation: 'CITA Cap C21',
    adviceTooltip: 'Fully deductible if used exclusively for business.',
  },
  {
    id: 'rule-2',
    countryCode: 'NG',
    categoryName: 'Rent (Sole Prop/Personal)',
    deductionPercentage: 100, // Logic handles the cap
    isCapped: true,
    capLimit: 500000,
    legalCitation: 'Finance Act 2024 (CRA)',
    adviceTooltip: 'Tier 2 Restricted: Deduction capped at lower of 20% or ₦500k.',
  },
  {
    id: 'rule-3',
    countryCode: 'NG',
    categoryName: 'Staff Costs (Salaries)',
    deductionPercentage: 100,
    legalCitation: 'PITA 2011',
    adviceTooltip: 'Fully deductible. Ensure PAYE is remitted.',
  },
  {
    id: 'rule-4',
    countryCode: 'NG',
    categoryName: 'Power & Utilities (Diesel/Solar)',
    deductionPercentage: 100,
    legalCitation: 'WREN Test',
    adviceTooltip: 'Wholly and exclusively for business operations.',
  },
  {
    id: 'rule-5',
    countryCode: 'NG',
    categoryName: 'Internet & Data',
    deductionPercentage: 100,
    legalCitation: 'WREN Test',
    adviceTooltip: 'Fully deductible operating expense.',
  },
  {
    id: 'rule-6',
    countryCode: 'NG',
    categoryName: 'Asset Purchase (>₦100k)',
    deductionPercentage: 0, // Capital Allowance instead
    legalCitation: 'Capital Allowances Act',
    adviceTooltip: 'Tier 3: Move to Capital Allowance schedule (Depreciation substitute).',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const MOCK_BUDGETS: Budget[] = [
  // Income
  { categoryId: 'inc_1', categoryName: 'Sales/Payment', plannedAmount: 0, type: 'income' },
  { categoryId: 'inc_2', categoryName: 'Savings', plannedAmount: 0, type: 'income' },
  { categoryId: 'inc_3', categoryName: 'Business/personal incoming Gifts', plannedAmount: 0, type: 'income' },
  { categoryId: 'inc_4', categoryName: 'Bonus', plannedAmount: 0, type: 'income' },
  { categoryId: 'inc_5', categoryName: 'Interest', plannedAmount: 0, type: 'income' },
  { categoryId: 'inc_6', categoryName: 'Other', plannedAmount: 0, type: 'income' },

  // Expenses (User Specified List)
  { categoryId: 'exp_01', categoryName: 'Advertising', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_02', categoryName: 'Bank charge', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_03', categoryName: 'Business Transaction Expenses', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_04', categoryName: 'Business insurance', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_05', categoryName: 'Business meals', plannedAmount: 0, type: 'expense' }, // "Food"
  { categoryId: 'exp_06', categoryName: 'Education', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_07', categoryName: 'Employee benefits', plannedAmount: 0, type: 'expense' }, // Health/medical
  { categoryId: 'exp_08', categoryName: 'Employee wages/salaries', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_09', categoryName: 'Entertainment', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_10', categoryName: 'Insurance', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_11', categoryName: 'Interest', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_12', categoryName: 'Licenses and regulatory fees', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_13', categoryName: 'Office supplies', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_14', categoryName: 'Organization dues', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_15', categoryName: 'Professional fees', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_16', categoryName: 'Rent', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_17', categoryName: 'Taxes', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_18', categoryName: 'Travel expenses', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_19', categoryName: 'Utilities', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_20', categoryName: 'Vehicle cost', plannedAmount: 0, type: 'expense' },
  { categoryId: 'exp_21', categoryName: 'Website expenses', plannedAmount: 0, type: 'expense' },
];
