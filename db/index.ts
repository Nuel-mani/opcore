
import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

import { schema } from './schema'
import Transaction from './models/Transaction'
import Tenant from './models/Tenant'

const adapter = new LokiJSAdapter({
    schema,
    useWebWorker: false, // Keeping it simple for now, can enable later for perf
    useIncrementalIndexedDB: true, // Recommended for persistence
    onQuotaExceededError: (error) => {
        console.error('Browser Database Quota Exceeded:', error)
    },
})

export const database = new Database({
    adapter,
    modelClasses: [
        Transaction,
        Tenant,
    ],
})
