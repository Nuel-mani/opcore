import { Model } from '@nozbe/watermelondb'
import { field, date, text, json, readonly } from '@nozbe/watermelondb/decorators'

const sanitizeItems = (rawItems: any) => {
    return Array.isArray(rawItems) ? rawItems : [];
}

export default class Invoice extends Model {
    static table = 'invoices'

    @field('serial_id') serialId!: number
    @text('customer_name') customerName!: string
    @field('amount') totalAmount!: number
    @field('vat_amount') vatAmount!: number
    @text('status') status!: 'draft' | 'paid' | 'pending' | 'sent'
    @date('date_issued') dateIssued!: Date
    @date('pdf_generated_at') pdfGeneratedAt!: Date | null
    @field('reprint_count') reprintCount!: number
    @text('sync_status') appSyncStatus!: 'synced' | 'pending'

    // JSON Field for Line Items
    @json('items', sanitizeItems) items!: any[]

    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date
}
