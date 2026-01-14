
import { Model } from '@nozbe/watermelondb'
import { field, text } from '@nozbe/watermelondb/decorators'
import { Sector, TurnoverBand, AccountType, SubscriptionTier } from '../../types'

export default class Tenant extends Model {
    static table = 'tenants'

    @text('business_name') businessName!: string
    @text('email') email!: string
    @text('country_code') countryCode!: string
    @text('currency_symbol') currencySymbol!: string
    @text('subscription_tier') subscriptionTier!: SubscriptionTier
    @text('turnover_band') turnoverBand!: TurnoverBand
    @text('sector') sector!: Sector
    @text('account_type') accountType!: AccountType
    @text('brand_color') brandColor!: string
    @text('tin_number') tinNumber!: string
    @text('tax_identity_number') taxIdentityNumber!: string
    @field('is_tax_exempt') isTaxExempt!: boolean

    // NTA 2025 Compliance
    @text('residence_state') residenceState!: string
    @field('pays_rent') paysRent!: boolean
    @field('rent_amount') rentAmount!: number
    @field('annual_income') annualIncome!: number

    @text('business_structure') businessStructure!: string
    @field('is_cit_exempt') isCitExempt!: boolean
    @field('is_vat_exempt') isVatExempt!: boolean
    @text('logo_url') logoUrl!: string

    // NTA 2025 Extensions
    @field('is_professional_service') isProfessionalService!: boolean
    @field('pension_contribution') pensionContribution!: number
    @field('global_income_days') globalIncomeDays!: number
    @field('sector_id') sectorId!: number

    // Contact
    @text('business_address') businessAddress!: string
    @text('phone_number') phoneNumber!: string
}
