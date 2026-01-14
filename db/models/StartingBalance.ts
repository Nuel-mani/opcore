import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class StartingBalance extends Model {
    static table = 'starting_balances'

    @field('year') year!: number
    @field('amount') amount!: number
    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date
}
