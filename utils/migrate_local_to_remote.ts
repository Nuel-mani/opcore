// migrate_local_to_remote.ts
// USAGE: Can be dropped into a utility folder in the frontend project

import { database } from '../db';
import TransactionModel from '../db/models/Transaction';
import { API_BASE_URL } from '../constants';

export async function migrateLocalToRemote() {
    console.log("Starting Migration...");

    // 1. Fetch all local unsynced transactions
    const txCollection = database.collections.get<TransactionModel>('transactions');
    const localTxs = await txCollection.query().fetch();

    const unsynced = localTxs.filter(tx => tx.appSyncStatus !== 'synced');

    if (unsynced.length === 0) {
        console.log("No data to migrate.");
        return;
    }

    console.log(`Found ${unsynced.length} records to push.`);

    // 2. Format payload
    const payload = unsynced.map(t => ({
        id: t.id,
        date: t.date.toISOString().split('T')[0],
        type: t.type,
        amount: t.amount,
        categoryId: t.categoryId,
        categoryName: t.categoryName,
        description: t.description,
        payee: t.payee,
        paymentMethod: t.paymentMethod,
        refId: t.refId,
        receiptUrls: t.receiptUrls,
        isDeductible: t.isDeductible,
        weCompliant: t.weCompliant,
        hasVatEvidence: t.hasVatEvidence,
        isRndExpense: t.isRndExpense,
        wallet: t.wallet,
        deductionTip: t.deductionTip,
        isCapitalAsset: t.isCapitalAsset,
        assetClass: t.assetClass
    }));

    // 3. Push to Server
    // Note: Replace "localhost" with window.location.hostname logic in real app
    const API_URL = `${API_BASE_URL}/api/sync/transactions`;

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tenantId: '11111111-1111-1111-1111-111111111111', // God Mode ID
                transactions: payload
            })
        });

        if (res.ok) {
            console.log("Migration Successful! Marking local as synced...");
            await database.write(async () => {
                const batchUpdates = unsynced.map(tx => tx.prepareUpdate(rec => {
                    rec.appSyncStatus = 'synced';
                }));
                await database.batch(...batchUpdates);
            });
            console.log("Complete.");
        } else {
            console.error("Server rejected migration", await res.text());
        }
    } catch (e) {
        console.error("Network Error during migration", e);
    }
}
