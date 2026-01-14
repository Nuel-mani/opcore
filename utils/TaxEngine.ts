export const NTA_2025_RULES = {
    PERSONAL: {
        EXEMPT_THRESHOLD: 800000,
        CLIFF_WARNING_THRESHOLD: 700000, // Warn when close
        PAYE_BANDS: [
            { limit: 800000, rate: 0.00 },
            { limit: 2200000, rate: 0.15 }, // Next 2.2m @ 15%
            { limit: 3800000, rate: 0.18 }, // Next 3.8m @ 18% (Example/Inferred - verified 18% thereafter)
            { limit: Infinity, rate: 0.25 } // Top band fallback
        ],
        RELIEFS: {
            RENT_RATE: 0.20,
            RENT_CAP: 500000
        }
    },
    BUSINESS: {
        SMALL_CAP: 100000000,
        ASSET_CAP: 250000000, // Assets <= 250M (Net Book Value)
        CLIFF_WARNING_THRESHOLD: 90000000,
        CIT_RATE: 0.30,
        DEV_LEVY_RATE: 0.04,
        R_AND_D_RATE: 0.05,
        CAPITAL_ALLOWANCE: {
            BUILDING: 0.10, // 10 Years
            PLANT: 0.20,    // 5 Years
            MOTOR: 0.25,    // 4 Years
            SOFTWARE: 0.25  // 4 Years (NTA 2025 modernization)
        }
    }
};

export class TaxEngine {
    // ... [Personal Tax Method Unchanged] ...

    static calculateBusinessLiability(turnover: number, totalAssets: number = 0, sector: string = 'general') {
        const rules = NTA_2025_RULES.BUSINESS;
        const isProfessionalService = ['legal', 'accounting', 'consultancy', 'medical', 'architecture', 'engineering'].some(s => sector.toLowerCase().includes(s));

        // NTA 2025 Triple Constraint Exemption:
        // 1. Turnover <= 100M
        // 2. Assets <= 250M
        // 3. Not Professional Services
        const isExempt = turnover <= rules.SMALL_CAP &&
            totalAssets <= rules.ASSET_CAP &&
            !isProfessionalService;

        if (isExempt) {
            return { cit: 0, levy: 0, total: 0, status: 'Exempt (Small Company)' };
        }

        // Assessable Profit Estimation (Standard 20% Net Margin for simulation)
        const assessableProfit = turnover * 0.20;

        // Capital Allowances (Logic Injection: Assume mix of assets for simulation)
        // In real flow, sum (assetValue * rate) from Asset Register
        const simulatedAllowanceRate = 0.20; // Blended rate (Plant/Software)
        const capitalAllowances = (totalAssets > 0 ? totalAssets : assessableProfit) * simulatedAllowanceRate * 0.25; // 25% of asset base depreciated? Simplified for projection.
        // Better: Use assessableProfit * 0.10 as safe harbor if no assets logged.
        const effectiveAllowance = totalAssets > 0 ? (totalAssets * 0.20) : (assessableProfit * 0.10);

        const totalProfit = Math.max(0, assessableProfit - effectiveAllowance);

        // CIT (30% on Total Profit)
        const citLiability = totalProfit * rules.CIT_RATE;

        // Development Levy (4% on Assessable Profit - Before Allowances)
        const devLevyLiability = assessableProfit * rules.DEV_LEVY_RATE;

        let status = 'Liable (Large Company)';
        if (isProfessionalService) status = 'Liable (Professional Service)';
        if (totalAssets > rules.ASSET_CAP) status = 'Liable (Asset-Rich Entity)';

        return {
            cit: citLiability,
            levy: devLevyLiability,
            total: citLiability + devLevyLiability,
            status
        };
    }

    static checkTaxCliff(currentValue: number, type: 'personal' | 'business') {
        if (type === 'personal') {
            const distance = NTA_2025_RULES.PERSONAL.EXEMPT_THRESHOLD - currentValue;
            if (currentValue >= NTA_2025_RULES.PERSONAL.EXEMPT_THRESHOLD) {
                return { status: 'crossed', message: 'You have crossed the tax-free threshold.', color: 'red-500' };
            }
            if (currentValue >= NTA_2025_RULES.PERSONAL.CLIFF_WARNING_THRESHOLD) {
                return {
                    status: 'warning',
                    message: `Warning: You are ₦${distance.toLocaleString()} away from the 15% Tax Cliff.`,
                    color: 'yellow-500'
                };
            }
            return { status: 'safe', message: 'You are in the tax-free zone.', color: 'green-500' };
        } else {
            // Business
            const distance = NTA_2025_RULES.BUSINESS.SMALL_CAP - currentValue;
            if (currentValue > NTA_2025_RULES.BUSINESS.SMALL_CAP) {
                return { status: 'crossed', message: 'Small Company Exemption Lost.', color: 'red-500' };
            }
            if (currentValue >= NTA_2025_RULES.BUSINESS.CLIFF_WARNING_THRESHOLD) {
                // Return detailed cost analysis
                return {
                    status: 'warning',
                    message: `RED ZONE: ₦${distance.toLocaleString()} until 34% Tax Trigger.`,
                    color: 'red-500',
                    isCliff: true
                };
            }
            return { status: 'safe', message: 'Small Company Exempt (0% Tax).', color: 'green-500' };
        }
    }

    static scanForReliefs(tenant: any, transactions: any[]) {
        const findings = [];

        if (tenant.accountType === 'personal') {
            // Check Rent
            if (!tenant.paysRent) {
                findings.push({
                    type: 'Rent Relief',
                    potential: Math.min(tenant.annualIncome * 0.20, 500000),
                    action: 'Update Profile: Check "I pay Rent"',
                    impact: 'Reduces Taxable Income',
                    isApplicable: true
                });
            }
        }

        if (tenant.accountType === 'business') {
            // Check R&D
            const hasRD = transactions.some(t => t.categoryName?.toLowerCase().includes('research') || t.description?.toLowerCase().includes('r&d'));
            if (!hasRD) {
                findings.push({
                    type: 'R&D Deduction',
                    potential: tenant.annualIncome * 0.05, // 5% of turnover
                    action: 'Log R&D Expenses',
                    impact: 'Deduct up to 5% of Turnover',
                    isApplicable: true
                });
            }
        }

        return findings;
    }

    static calculateReliefs(turnoverOrIncome: number, rentPaid: number = 0) {
        // Relief = Rent Paid, up to 500k cap.
        const rentRelief = Math.min(rentPaid, 500000);
        return {
            rentReliefClaimed: rentRelief
        };
    }

    /**
     * NTA 2025 Section 21 Validator: "Wholly & Exclusively" (WE) Test
     * Previously WREN (Wholly, Reasonably, Exclusively, Necessarily).
     * Now stricter on Evidence (Poison Pill).
     */
    static validateExpense(expense: any) {
        const issues: string[] = [];
        let isDeductible = true;

        // 1. The Poison Pill (Section 21(p))
        if (!expense.hasVatProof) {
            isDeductible = false;
            issues.push("Missing VAT Evidence (Section 21p) - Expense Disallowed");
        }

        // 2. Business Purpose (Wholly & Exclusively)
        // Heuristic: Flag vaguely named expenses
        const riskyKeywords = ['gift', 'party', 'personal', 'vacation', 'family'];
        if (riskyKeywords.some(w => expense.description?.toLowerCase().includes(w))) {
            issues.push("Potential Personal Expense detected (Section 21) - Audit Risk");
            // Note: We don't auto-disallow, but we flag.
        }

        return {
            isDeductible,
            issues,
            status: isDeductible ? 'Approved' : 'Disallowed'
        };
    }
}
