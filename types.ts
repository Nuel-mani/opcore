
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export type AccountType = 'personal' | 'business';
export type BusinessStructure = 'sole_prop' | 'limited' | 'freelancer';
export type TurnoverBand = 'micro' | 'small' | 'medium'; // <25m, <50m, >50m
export type Sector = 'agriculture' | 'services' | 'manufacturing' | 'general' | 'professional_services' | 'green_energy' | 'ict';

export interface Tenant {
  id: string;
  // Common Fields
  businessName: string; // Used as "User Name" for personal accounts
  email?: string;
  countryCode: string;
  currencySymbol: string;
  subscriptionTier: SubscriptionTier;
  accountType: AccountType;

  // Business Specific
  tinNumber?: string;
  brandColor: string;
  logoUrl: string | null;
  turnoverBand: TurnoverBand;
  sector: Sector;
  businessStructure?: BusinessStructure;
  taxIdentityNumber?: string; // New Unified Tax ID (NIN/CAC linked)
  totalAssets?: number; // For Large Company Classification (>250m)

  // Personal Specific
  residenceState?: string; // e.g., 'Lagos'
  paysRent?: boolean;
  rentAmount?: number; // Actual rent paid
  rentReceiptUploaded?: boolean; // Track if proof exists
  rentReceiptUrl?: string | null; // Document Vault: Store the receipt image
  pensionContribution?: number; // Voluntary + Statutory
  annualIncome?: number;
  isTaxExempt?: boolean; // For <800k income
}

export interface TaxRule {
  id: string;
  countryCode: string;
  categoryName: string;
  deductionPercentage: number;
  legalCitation: string;
  adviceTooltip: string;
  isCapped?: boolean;
  capLimit?: number;
}

export type TransactionType = 'income' | 'expense';
export type AssetClass = 'none' | 'software' | 'vehicle' | 'equipment' | 'building';
export type WalletType = 'operations' | 'crypto'; // Ring-fencing

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  categoryId: string; // Links to TaxRule
  categoryName: string; // Denormalized for display
  description: string;
  payee?: string; // Customer or Vendor Name
  paymentMethod?: string; // Bank Transfer, Cash, Card
  refId?: string; // Authorization ID or Invoice #
  receiptImageUrl?: string;

  // NTA 2025 Compliance Flags
  isDeductible?: boolean;
  weCompliant?: boolean; // Wholly & Exclusively
  hasVatEvidence?: boolean; // Section 21(p) Poison Pill
  isRndExpense?: boolean; // R&D Optimization
  wallet?: WalletType; // Crypto vs Operations Ring-fencing

  deductionTip?: string;
  isCapitalAsset?: boolean; // Tier 3 check
  assetClass?: AssetClass;
  syncStatus?: 'synced' | 'pending';
}

export interface Budget {
  categoryId: string;
  categoryName: string;
  plannedAmount: number;
  type: 'income' | 'expense';
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number; // 0 or 7.5
}

export interface Invoice {
  id: string;
  customerName: string;
  items: InvoiceItem[];
  totalAmount: number;
  vatAmount: number;
  status: InvoiceStatus;
  date: string;
}
