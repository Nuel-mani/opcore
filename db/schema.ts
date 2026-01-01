
import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
    version: 1,
    tables: [
        tableSchema({
            name: 'transactions',
            columns: [
                { name: 'date', type: 'string' },
                { name: 'type', type: 'string' }, // 'income' | 'expense'
                { name: 'amount', type: 'number' },
                { name: 'category_id', type: 'string' },
                { name: 'category_name', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'payee', type: 'string', isOptional: true },
                { name: 'payment_method', type: 'string', isOptional: true },
                { name: 'ref_id', type: 'string', isOptional: true },
                { name: 'receipt_image_url', type: 'string', isOptional: true },

                // NTA 2025 Compliance Columns
                { name: 'is_deductible', type: 'boolean' },
                { name: 'we_compliant', type: 'boolean' },
                { name: 'has_vat_evidence', type: 'boolean' },
                { name: 'is_rnd_expense', type: 'boolean' },
                { name: 'wallet', type: 'string', isOptional: true },
                { name: 'deduction_tip', type: 'string', isOptional: true },
                { name: 'is_capital_asset', type: 'boolean' },
                { name: 'asset_class', type: 'string', isOptional: true },

                { name: 'sync_status', type: 'string' }, // 'synced' | 'pending'
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ]
        }),
        tableSchema({
            name: 'tenants',
            columns: [
                { name: 'business_name', type: 'string' },
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
            ]
        })
    ]
})
