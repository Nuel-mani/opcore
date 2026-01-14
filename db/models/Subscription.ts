import { Model } from '@nozbe/watermelondb'
import { field, date, text, readonly } from '@nozbe/watermelondb/decorators'

export default class Subscription extends Model {
    static table = 'subscriptions'

    @text('plan_type') planType!: 'free' | 'pro' | 'enterprise'
    @text('status') status!: 'active' | 'expired' | 'cancelled'

    @date('start_date') startDate!: Date
    @date('end_date') endDate!: Date
    @text('payment_ref') paymentRef!: string // [NEW]

    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date
}
