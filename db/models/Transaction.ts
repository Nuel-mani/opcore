
import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, text } from '@nozbe/watermelondb/decorators'
import { AssetClass, WalletType } from '../../types'

export default class Transaction extends Model {
    static table = 'transactions'

    @date('date') date!: Date
    @text('type') type!: 'income' | 'expense'
    @field('amount') amount!: number
    @text('category_id') categoryId!: string
    @text('category_name') categoryName!: string
    @text('description') description!: string
    @text('payee') payee!: string
    @text('payment_method') paymentMethod!: string
    @text('ref_id') refId!: string
    @text('receipt_image_url') receiptImageUrl!: string

    // Compliance
    @field('is_deductible') _isDeductible!: boolean
    @field('we_compliant') weCompliant!: boolean
    @field('has_vat_evidence') hasVatEvidence!: boolean
    @field('is_rnd_expense') isRndExpense!: boolean
    @text('wallet') wallet!: WalletType
    @text('deduction_tip') deductionTip!: string
    @field('is_capital_asset') isCapitalAsset!: boolean
    @text('asset_class') assetClass!: AssetClass

    @text('sync_status') appSyncStatus!: 'synced' | 'pending'
    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date

    // Logic Injection: Override isDeductible getter to enforce Poison Pill
    get isDeductible(): boolean {
        // NTA 2025 Section 21: No VAT Evidence = Not Deductible
        if (!this.hasVatEvidence && this.type === 'expense') {
            return false;
        }
        return this._isDeductible;
    }
}
