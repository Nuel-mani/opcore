
import { TaxRule } from "../types";

// Analyze an expense description to suggest a category and tax advice LOCALLY
export const analyzeExpenseWithGemini = async (
  description: string,
  countryCode: string,
  availableRules: TaxRule[]
): Promise<{ categoryId: string; categoryName: string; advice: string; confidence: number; isCapitalAsset: boolean; isDeductible: boolean }> => {

  const lowerDesc = description.toLowerCase();

  // Default Response
  let result = {
    categoryId: 'other',
    categoryName: 'General Expense',
    advice: 'Standard business expense deduction applies.',
    confidence: 0.8,
    isCapitalAsset: false,
    isDeductible: true
  };

  // 1. Check for specific categories based on keywords
  // In a real app, this would be a more robust lookup or use a lightweight local model

  if (lowerDesc.includes('rent') || lowerDesc.includes('lease')) {
    const rentRule = availableRules.find(r => r.categoryName.toLowerCase().includes('rent'));
    result = {
      categoryId: rentRule ? rentRule.id : 'rent_rule',
      categoryName: rentRule ? rentRule.categoryName : 'Rent & Rates',
      advice: 'Rent is deductible (max 50% for mixed use). Ensure tenancy agreement is filed.',
      confidence: 0.9,
      isCapitalAsset: false,
      isDeductible: true
    };
  } else if (lowerDesc.includes('fuel') || lowerDesc.includes('diesel') || lowerDesc.includes('gas') || lowerDesc.includes('power')) {
    const fuelRule = availableRules.find(r => r.categoryName.toLowerCase().includes('fuel') || r.categoryName.toLowerCase().includes('utilities'));
    result = {
      categoryId: fuelRule ? fuelRule.id : 'fuel_rule',
      categoryName: fuelRule ? fuelRule.categoryName : 'Fuel & Utilities',
      advice: 'Fully deductible operating expense if used for business power.',
      confidence: 0.95,
      isCapitalAsset: false,
      isDeductible: true
    };
  } else if (lowerDesc.includes('internet') || lowerDesc.includes('data') || lowerDesc.includes('wifi')) {
    result = {
      categoryId: 'internet-rule-id',
      categoryName: 'Internet & Communication',
      advice: 'Deductible. Keep invoices.',
      confidence: 0.9,
      isCapitalAsset: false,
      isDeductible: true
    };
  } else if (lowerDesc.includes('uber') || lowerDesc.includes('transport') || lowerDesc.includes('taxi') || lowerDesc.includes('flight')) {
    result = {
      categoryId: 'transport-rule-id',
      categoryName: 'Transport & Travel',
      advice: 'Ensure detailed logs are kept for all business travel.',
      confidence: 0.85,
      isCapitalAsset: false,
      isDeductible: true
    };
  }

  // 2. Check for Capital Assets (NTA 2025 Tier 3)
  if (lowerDesc.includes('laptop') || lowerDesc.includes('macbook') || lowerDesc.includes('generator') || lowerDesc.includes('vehicle') || lowerDesc.includes('car') || lowerDesc.includes('truck')) {
    result = {
      categoryId: 'capital_asset',
      categoryName: 'Capital Asset',
      advice: 'This appears to be a Capital Asset. Must be depreciated over 4 years (25% per annum) or 5 years (20%).',
      confidence: 0.95,
      isCapitalAsset: true,
      isDeductible: true
    };
  }

  // 3. Check for Software (Intangible Asset) - often treated as Capital
  if (lowerDesc.includes('software') || lowerDesc.includes('license')) {
    result = {
      categoryId: 'software_rule',
      categoryName: 'Software Subscription',
      advice: 'Software licenses are generally deductible. Large ERPs may need capitalization.',
      confidence: 0.85,
      isCapitalAsset: true, // Marked true to trigger the check in TaxOptimizer
      isDeductible: true
    };
  }

  // Simulate network delay for "Agentic" feel
  await new Promise(resolve => setTimeout(resolve, 800));

  return result;
};

// Mock Receipt Scan
export const scanReceiptWithGemini = async (imageBase64: string): Promise<{ total: number; date: string; vendor: string; description: string }> => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    vendor: "Test Vendor Ltd (Offline)",
    date: new Date().toISOString().split('T')[0],
    total: 15000,
    description: "Office Supplies (Scanned)"
  };
};
