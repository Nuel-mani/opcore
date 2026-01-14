
import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
    migrations: [
        {
            toVersion: 2,
            steps: [
                addColumns({
                    table: 'invoices',
                    columns: [
                        { name: 'sync_status', type: 'string', isOptional: true },
                    ],
                }),
                addColumns({
                    table: 'transactions',
                    columns: [
                        { name: 'sync_status', type: 'string', isOptional: true },
                    ],
                }),
            ],
        },
    ],
})
