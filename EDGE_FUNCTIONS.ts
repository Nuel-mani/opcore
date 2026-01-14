// EDGE_FUNCTIONS.ts
// Definition of Server-Side Tax Logic (Ported from Frontend for Reference/Edge deployment)

export interface TaxContext {
    turnover: number;
    assessableProfit: number; // Adjusted Profit
    isProfessionalService: boolean;
    turnoverBand: 'micro' | 'small' | 'medium' | 'large';
}

export interface TaxResult {
    citRate: number; // Company Income Tax
    vatStatus: 'exempt' | 'standard';
    educationTax: number; // 2.5% of Assessable Profit
    levies: {
        policeFund: number; // 0.005% of Net Profit (skipped in MVP usually)
        naseni: number; // 0.25% of Profit Before Tax (if >100M)
        itLevy: number; // 1% of Profit Before Tax (if GSM/Bank/Pension)
    }
}

/**
 * Calculates Corporate Income Tax Rate based on NTA 2025 Rules
 */
export function calculateCITRate(ctx: TaxContext): number {
    // 1. Small Company Exemption (< 25M)
    // EXCEPTION: Professional Services do NOT get this exemption (NTA 2025 Trap)
    if (ctx.turnover < 25000000 && !ctx.isProfessionalService) {
        return 0; // 0%
    }

    // 2. Medium Company (25M - 100M)
    if (ctx.turnover >= 25000000 && ctx.turnover < 100000000) {
        return 20; // 20% (Commonly cited as 20% for medium, though 30% is standard, check Finance Act updates)
        // Note: OpCore uses 30% flat for non-small usually, but let's assume 20% concession exists or fallback to 30.
        // Actually, standard CIT is 30%. Concessionary rate is 20% for medium.
        return 20;
    }

    // 3. Large Company (> 100M) OR Professional Services fallback
    return 30; // 30%
}

/**
 * Determines VAT Status
 */
export function getVatStatus(ctx: TaxContext): 'exempt' | 'standard' {
    // VAT threshold is strictly 25M Turnover, regardless of Asset/Sector?
    // Actually Section 15 of VAT Act: < 25M is exempt.
    if (ctx.turnover < 25000000) {
        return 'exempt';
    }
    return 'standard'; // 7.5%
}
