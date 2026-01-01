
import { Sector } from '../types';

interface TaxResult {
    taxPayable: number;
    effectiveTaxRate: number;
    rentReliefClaimed: number;
    chargeableIncome: number;
    totalRelief: number;
}

/**
 * Calculates Personal Income Tax based on Nigeria Tax Act 2025 Draft (Taiwo Oyedele Reforms).
 */
export const calculatePIT_NTA2025 = (grossIncome: number, pension: number, rentPaid: number): TaxResult => {
    // Step 1: Calculate Reliefs
    const rentRelief = Math.min(rentPaid * 0.20, 500000);
    const totalRelief = pension + rentRelief;

    // Step 2: Chargeable Income
    let chargeable = Math.max(0, grossIncome - totalRelief);
    const originalChargeable = chargeable;

    let tax = 0;

    // Band 1: First 800k @ 0%
    const band1 = 800000;
    if (chargeable > band1) {
        chargeable -= band1;
    } else {
        return { taxPayable: 0, effectiveTaxRate: 0, rentReliefClaimed: rentRelief, chargeableIncome: originalChargeable, totalRelief };
    }

    // Band 2: Next 2.2m @ 15%
    const band2 = 2200000;
    if (chargeable > band2) {
        tax += band2 * 0.15;
        chargeable -= band2;
    } else {
        tax += chargeable * 0.15;
        return { taxPayable: tax, effectiveTaxRate: (tax / grossIncome) * 100, rentReliefClaimed: rentRelief, chargeableIncome: originalChargeable, totalRelief };
    }

    // Band 3: Next 9.0m @ 18%
    const band3 = 9000000;
    if (chargeable > band3) {
        tax += band3 * 0.18;
        chargeable -= band3;
    } else {
        tax += chargeable * 0.18;
        return { taxPayable: tax, effectiveTaxRate: (tax / grossIncome) * 100, rentReliefClaimed: rentRelief, chargeableIncome: originalChargeable, totalRelief };
    }

    // Band 4: Next 13.0m @ 21%
    const band4 = 13000000;
    if (chargeable > band4) {
        tax += band4 * 0.21;
        chargeable -= band4;
    } else {
        tax += chargeable * 0.21;
        return { taxPayable: tax, effectiveTaxRate: (tax / grossIncome) * 100, rentReliefClaimed: rentRelief, chargeableIncome: originalChargeable, totalRelief };
    }

     // Band 5: Next 25.0m @ 23%
     const band5 = 25000000;
     if (chargeable > band5) {
         tax += band5 * 0.23;
         chargeable -= band5;
     } else {
         tax += chargeable * 0.23;
         return { taxPayable: tax, effectiveTaxRate: (tax / grossIncome) * 100, rentReliefClaimed: rentRelief, chargeableIncome: originalChargeable, totalRelief };
     }

     // Band 6: Above @ 25%
     tax += chargeable * 0.25;

     return { 
         taxPayable: tax, 
         effectiveTaxRate: (tax / grossIncome) * 100, 
         rentReliefClaimed: rentRelief,
         chargeableIncome: originalChargeable,
         totalRelief
     };
};

/**
 * Calculates Old PIT (PITA 2011) for comparison.
 */
export const calculatePIT_Old = (grossIncome: number, pension: number): number => {
    const cra = 200000 + (grossIncome * 0.20);
    const totalRelief = cra + pension;
    let chargeable = Math.max(0, grossIncome - totalRelief);
    let tax = 0;

    if (chargeable > 300000) { tax += 300000 * 0.07; chargeable -= 300000; } else { return tax + (chargeable * 0.07); }
    if (chargeable > 300000) { tax += 300000 * 0.11; chargeable -= 300000; } else { return tax + (chargeable * 0.11); }
    if (chargeable > 500000) { tax += 500000 * 0.15; chargeable -= 500000; } else { return tax + (chargeable * 0.15); }
    if (chargeable > 500000) { tax += 500000 * 0.19; chargeable -= 500000; } else { return tax + (chargeable * 0.19); }
    if (chargeable > 1600000) { tax += 1600000 * 0.21; chargeable -= 1600000; } else { return tax + (chargeable * 0.21); }
    tax += chargeable * 0.24;

    return tax;
};


export const checkSMEStatus = (turnover: number, sector: Sector): { status: string; code: 'exempt' | 'warning' | 'taxable'; message: string } => {
    if (sector === 'professional_services') {
        return {
            status: 'Professional Service - Taxable',
            code: 'taxable',
            message: 'Professional Services are excluded from Small Company exemptions regardless of turnover.'
        };
    }

    if (turnover < 45000000) {
        return {
            status: 'Small Company - Exempt',
            code: 'exempt',
            message: 'You are in the Green Zone. No CIT liability.'
        };
    } else if (turnover < 50000000) {
        return {
            status: 'Approaching Threshold',
            code: 'warning',
            message: 'Warning: You are approaching the ₦50m taxable threshold.'
        };
    } else {
        return {
            status: 'Medium Company - Taxable',
            code: 'taxable',
            message: 'Turnover exceeds ₦50m. CIT @ 25% applies.'
        };
    }
};

/**
 * NTA 2025 Corporate Tax Engine
 * Handles "30 + 4" Rule, Capital Allowance Restrictions, and Minimum Tax.
 */
export class CorporateTaxCalculator {
    private turnover: number;
    private assessableProfit: number;
    private sector: Sector;
    private totalAssets: number;

    constructor(turnover: number, assessableProfit: number, sector: Sector, totalAssets: number = 0) {
        this.turnover = turnover;
        this.assessableProfit = assessableProfit;
        this.sector = sector;
        this.totalAssets = totalAssets;
    }

    // Step A: Classification
    get isLargeCompany(): boolean {
        return this.turnover > 50000000 || this.totalAssets > 250000000 || this.sector === 'professional_services';
    }

    // Step B: Levy Calculation (4% on Assessable Profit)
    // Applies even if Capital Allowances wipe out profit for CIT
    get developmentLevy(): number {
        if (!this.isLargeCompany) return 0;
        return this.assessableProfit * 0.04;
    }

    // Step C: CIT Calculation with 2/3rds Restriction
    calculateCIT(availableCapitalAllowances: number): { 
        cit: number; 
        utilizableCA: number; 
        restrictionApplied: boolean;
        totalProfit: number;
    } {
        if (!this.isLargeCompany) return { cit: 0, utilizableCA: 0, restrictionApplied: false, totalProfit: 0 };

        let maxAllowance = availableCapitalAllowances;
        let restrictionApplied = false;

        // The Exemption List for Restriction
        const exemptSectors = ['manufacturing', 'agriculture'];
        
        if (!exemptSectors.includes(this.sector)) {
            // The Trap: Services/Tech/etc limited to 66.6% offset
            const restrictionLimit = this.assessableProfit * (2 / 3);
            if (availableCapitalAllowances > restrictionLimit) {
                maxAllowance = restrictionLimit;
                restrictionApplied = true;
            }
        }

        const utilizableCA = Math.min(availableCapitalAllowances, maxAllowance);
        const totalProfit = Math.max(0, this.assessableProfit - utilizableCA);
        
        // Large Company CIT Rate is 30% (Draft NTA 2025 Standard)
        const cit = totalProfit * 0.30;

        return { cit, utilizableCA, restrictionApplied, totalProfit };
    }

    // Step D: Minimum Tax Floor (For MNEs/Giants > 50B)
    checkMinimumTax(totalTaxPaid: number, netIncome: number): boolean {
        // Only applicable if turnover is massive, simplified here for "MNE" flag
        if (this.turnover > 50000000000) { 
             const etr = totalTaxPaid / netIncome;
             return etr < 0.15; // Trigger TopUp if ETR < 15%
        }
        return false;
    }

    // EDTI Calculation (Green Energy / ICT Credit)
    calculateEDTICredit(qualifyingCapex: number): number {
        if (this.sector === 'green_energy' || this.sector === 'ict') {
            // 25% credit on investment
            return qualifyingCapex * 0.25;
        }
        return 0;
    }
}
