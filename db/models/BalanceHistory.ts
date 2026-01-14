import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class BalanceHistory extends Model {
    static table = 'balance_history'

    @field('month_year') monthYear!: string
    @field('opening_balance') openingBalance!: number
    @field('total_income') totalIncome!: number
    @field('total_expense') totalExpense!: number
    @field('closing_balance') closingBalance!: number
    @readonly @date('created_at') createdAt!: Date
}
