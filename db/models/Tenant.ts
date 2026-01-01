
import { Model } from '@nozbe/watermelondb'
import { field, text } from '@nozbe/watermelondb/decorators'
import { Sector, TurnoverBand, AccountType, SubscriptionTier } from '../../types'

export default class Tenant extends Model {
    static table = 'tenants'

    @text('business_name') businessName!: string
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
}
