
import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
    version: 2,
    tables: [
        tableSchema({
            name: 'transactions',
            columns: [
                { name: 'serial_id', type: 'number', isOptional: true }, // [NEW] Public ID
                { name: 'date', type: 'string' },
                { name: 'type', type: 'string' }, // 'income' | 'expense'
                { name: 'amount', type: 'number' },
                { name: 'category_id', type: 'string' },
                { name: 'category_name', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'payee', type: 'string', isOptional: true },
                { name: 'vendor_tin', type: 'string', isOptional: true }, // [NEW] NTA 2025
                { name: 'payment_method', type: 'string', isOptional: true },
                { name: 'ref_id', type: 'string', isOptional: true },
                { name: 'receipt_urls', type: 'string', isOptional: true }, // [MODIFIED] JSON Array string
                { name: 'vat_amount', type: 'number', isOptional: true }, // [NEW] Added for NTA 2025

                // NTA 2025 Compliance Columns
                { name: 'is_deductible', type: 'boolean' },
                { name: 'we_compliant', type: 'boolean' },
                { name: 'has_vat_evidence', type: 'boolean' },
                { name: 'is_rnd_expense', type: 'boolean' },
                { name: 'wallet', type: 'string', isOptional: true },
                { name: 'deduction_tip', type: 'string', isOptional: true },
                { name: 'is_capital_asset', type: 'boolean' },
                { name: 'asset_class', type: 'string', isOptional: true },
                { name: 'invoice_id', type: 'string', isOptional: true }, // [NEW] Link to Invoice

                { name: 'sync_status', type: 'string' }, // 'synced' | 'pending'
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ]
        }),
        tableSchema({
            name: 'tenants',
            columns: [
                { name: 'serial_id', type: 'number', isOptional: true }, // [NEW] Public ID
                { name: 'business_name', type: 'string' },
                { name: 'email', type: 'string', isOptional: true }, // [NEW] Offline Email Storage
                { name: 'country_code', type: 'string' },
                { name: 'currency_symbol', type: 'string' },
                { name: 'subscription_tier', type: 'string' },
                { name: 'turnover_band', type: 'string' },
                { name: 'sector', type: 'string' },
                { name: 'account_type', type: 'string' },
                { name: 'brand_color', type: 'string' },
                { name: 'tin_number', type: 'string', isOptional: true },
                { name: 'tax_identity_number', type: 'string', isOptional: true }, // New Unified Field
                { name: 'is_tax_exempt', type: 'boolean' },

                // NTA 2025: Personal Logic
                { name: 'residence_state', type: 'string', isOptional: true },
                { name: 'pays_rent', type: 'boolean' },
                { name: 'rent_amount', type: 'number', isOptional: true }, // For Relief Calc
                { name: 'annual_income', type: 'number', isOptional: true }, // For Tax Band

                // NTA 2025: Business Logic
                { name: 'business_structure', type: 'string', isOptional: true }, // 'sole_prop' | 'limited'
                { name: 'is_professional_service', type: 'boolean' }, // [NEW] Trap
                { name: 'pension_contribution', type: 'number', isOptional: true }, // [NEW] Reliefs
                { name: 'global_income_days', type: 'number', isOptional: true }, // [NEW] 183 Rule

                // [NEW] Contact
                { name: 'business_address', type: 'string', isOptional: true },
                { name: 'phone_number', type: 'string', isOptional: true },

                { name: 'is_cit_exempt', type: 'boolean' }, // < 25M Turnover
                { name: 'is_vat_exempt', type: 'boolean' }, // < 25M Turnover
                { name: 'logo_url', type: 'string', isOptional: true },
                { name: 'stamp_url', type: 'string', isOptional: true }, // [NEW]
                { name: 'invoice_template', type: 'string', isOptional: true }, // [NEW]
                { name: 'invoice_font', type: 'string', isOptional: true }, // [NEW]
                { name: 'show_watermark', type: 'boolean' }, // [NEW]
            ]
        }),
        tableSchema({
            name: 'starting_balances',
            columns: [
                { name: 'year', type: 'number' },
                { name: 'amount', type: 'number' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ]
        }),
        tableSchema({
            name: 'balance_history',
            columns: [
                { name: 'month_year', type: 'string' }, // YYYY-MM
                { name: 'opening_balance', type: 'number' },
                { name: 'total_income', type: 'number' },
                { name: 'total_expense', type: 'number' },
                { name: 'closing_balance', type: 'number' },
                { name: 'created_at', type: 'number' },
            ]
        }),
        tableSchema({
            name: 'invoices',
            columns: [
                { name: 'serial_id', type: 'number', isOptional: true },
                { name: 'customer_name', type: 'string' },
                { name: 'amount', type: 'number' },
                { name: 'vat_amount', type: 'number' },
                { name: 'status', type: 'string' },
                { name: 'date_issued', type: 'number' }, // Date as timestamp
                { name: 'items', type: 'string' }, // JSON stringified
                { name: 'pdf_generated_at', type: 'number', isOptional: true }, // [NEW] Evidence
                { name: 'reprint_count', type: 'number', isOptional: true }, // [NEW] Evidence
                { name: 'sync_status', type: 'string', isOptional: true },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ]
        }),
        tableSchema({
            name: 'subscriptions',
            columns: [
                { name: 'plan_type', type: 'string' },
                { name: 'status', type: 'string' },
                { name: 'start_date', type: 'number' },
                { name: 'end_date', type: 'number', isOptional: true },
                { name: 'payment_ref', type: 'string', isOptional: true }, // [NEW]
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ]
        })
    ]
})
