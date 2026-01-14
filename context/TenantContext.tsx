
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Q } from '@nozbe/watermelondb';
import { Tenant, Transaction, TaxRule, Invoice, TurnoverBand, Budget } from '../types';
import { INITIAL_TENANT, INITIAL_TRANSACTIONS, MOCK_TAX_RULES, MOCK_BUDGETS, API_BASE_URL } from '../constants';
import { database } from '../db';
import TransactionModel from '../db/models/Transaction';
import StartingBalance from '../db/models/StartingBalance';
import InvoiceModel from '../db/models/Invoice';
import SubscriptionModel from '../db/models/Subscription';
import BalanceHistory from '../db/models/BalanceHistory';

interface TenantContextType {
  tenant: Tenant;
  isOnboarded: boolean;
  login: (data: Partial<Tenant> & { isOnboarded?: boolean }) => void;
  logout: () => void;
  updateTenant: (updates: Partial<Tenant>) => void;
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  taxRules: TaxRule[];
  invoices: Invoice[];
  addInvoice: (inv: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => void;
  budgets: Budget[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  isInitializing: boolean; // NEW: Global Loading State
  toggleOnlineSimulation: () => void;
  addTransactions?: (txs: Transaction[]) => Promise<void>;
  startingBalance: number;

  updateStartingBalance: (amount: number) => Promise<void>;
  balanceHistory: any[]; // Using any for MVP, ideally interface
  isFeatureLocked: (feature: 'tax_optimizer' | 'advanced_ledger') => boolean;
  performSync: () => Promise<void>;
  clearTransactions: () => Promise<void>;
  performAppReset: () => Promise<void>;

  systemSettings: { [key: string]: any }; // [NEW] Global Config
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

// TOGGLE THIS FOR DISCONNECTED TESTING
const IS_OFFLINE_TEST_MODE = false;

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // Default to true (Loading...)
  const [tenant, setTenant] = useState<Tenant>(INITIAL_TENANT);

  // Database State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<any[]>([]);

  const [startingBalance, setStartingBalance] = useState(0);
  const [systemSettings, setSystemSettings] = useState<{ [key: string]: any }>({}); // [NEW]

  // 1. Load Tenant from DB on Mount
  useEffect(() => {
    const loadTenant = async () => {
      try {
        const tenants = await database.collections.get<any>('tenants').query().fetch();
        if (tenants.length > 0) {
          const dbTenant = tenants[0];

          // SAFETY CHECK: Is this a valid server UUID?
          // WatermelonDB local IDs are usually 16 chars. Server UUIDs are 36 chars.
          if (dbTenant.id.length !== 36) {
            console.warn("WARNING: Suspicious Tenant ID Length (Local). Check consistency.", dbTenant.id);
            // DISABLED DESTRUCTION: This was causing wipes on reload if ID format varied.
            // await database.write(async () => {
            //   await dbTenant.markAsDeleted();
            //   await dbTenant.destroyPermanently();
            // });
            // setIsOnboarded(false); 
            // return;
          }

          setTenant({
            id: dbTenant.id,
            businessName: dbTenant.businessName,
            countryCode: dbTenant.countryCode,
            currencySymbol: dbTenant.currencySymbol,
            subscriptionTier: dbTenant.subscriptionTier,
            turnoverBand: dbTenant.turnoverBand,
            sector: dbTenant.sector,
            accountType: (dbTenant.accountType === 'personal' || dbTenant.paysRent ? 'personal' : (dbTenant.businessStructure || (dbTenant.sector && dbTenant.sector !== 'salary earner') || dbTenant.accountType === 'business' ? 'business' : 'personal')) as any,
            brandColor: dbTenant.brandColor,
            themeColor: dbTenant.brandColor || '#2252c9', // FIX: Map brandColor to themeColor with fallback
            tinNumber: dbTenant.tinNumber,
            taxIdentityNumber: dbTenant.taxIdentityNumber,
            isTaxExempt: dbTenant.isTaxExempt,
            logoUrl: dbTenant.logoUrl,
            businessAddress: dbTenant.businessAddress || '',
            phoneNumber: dbTenant.phoneNumber || '',

            // NTA 2025
            residenceState: dbTenant.residenceState || '',
            paysRent: dbTenant.paysRent || false, // Use fallback
            rentAmount: dbTenant.rentAmount || 0,
            annualIncome: dbTenant.annualIncome || 0,
            businessStructure: dbTenant.businessStructure || '',
            // @ts-ignore
            isCitExempt: dbTenant.isCitExempt || false,
            // @ts-ignore
            isVatExempt: dbTenant.isVatExempt || false,

            email: dbTenant.email || ''
          } as Tenant);
          setIsOnboarded(true);
        } else {
          setIsOnboarded(false);
        }
      } catch (e) {
        console.error("Failed to load tenant", e);
        setIsOnboarded(false);
      } finally {
        // Checking for "Smart Sync" (Visual Data)
        // We do NOT set isInitializing(false) here yet.
        // We wait for the Smart Sync check below.
      }
    };
    // We chain the load sequence: Load Local -> Check Stale -> (Pull) -> Done
    loadTenant().then(() => performSmartSync());
  }, []);



  // Load Starting Balance for Current Year
  useEffect(() => {
    const loadBalance = async () => {
      try {
        const currentYear = new Date().getFullYear();
        const balances = await database.collections.get<StartingBalance>('starting_balances').query().fetch();
        // Simple filter for MVP, ideal is Q.where('year', currentYear)
        const currentBalance = balances.find(b => b.year === currentYear);
        if (currentBalance) {
          setStartingBalance(currentBalance.amount);
        }
      } catch (e) {
        console.error("Failed to load starting balance", e);
      }
    };
    loadBalance();
  }, []);

  // Load Global System Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/config`);
        if (res.ok) {
          const data = await res.json();
          setSystemSettings(data);
        }
      } catch (e) {
        console.error("Failed to load system settings", e);
      }
    };
    fetchSettings();
  }, []);

  // Observe Database Changes (Transactions)
  useEffect(() => {
    const transactionsCollection = database.collections.get<TransactionModel>('transactions');
    const invoicesCollection = database.collections.get<InvoiceModel>('invoices');

    const subscriptionsCollection = database.collections.get<SubscriptionModel>('subscriptions');
    const historyCollection = database.collections.get<BalanceHistory>('balance_history');

    // Subscribe to Transactions
    const subTransactions = transactionsCollection.query()
      .observe()
      .subscribe((data) => {
        const plainTxs = data.map(t => ({
          id: t.id,
          date: (t.date ? t.date : new Date()).toISOString().split('T')[0],
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
          assetClass: t.assetClass,
          appSyncStatus: t.appSyncStatus, // WatermelonDB local status
          syncStatus: t.appSyncStatus
        } as unknown as Transaction));
        setTransactions(plainTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      });

    // Subscribe to Invoices
    const subInvoices = invoicesCollection.query()
      .observe()
      .subscribe((data) => {
        const plainInvoices = data.map(i => ({
          id: i.id,
          customerName: i.customerName,
          totalAmount: i.totalAmount, // mapped from amount
          vatAmount: i.vatAmount,
          status: i.status,
          date: (i.dateIssued ? i.dateIssued : new Date()).toISOString().split('T')[0],
          items: i.items,
          appSyncStatus: i.appSyncStatus, // Correctly Map Model -> State
          syncStatus: i.appSyncStatus
        } as unknown as Invoice));
        setInvoices(plainInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      });

    // Subscribe to Subscriptions (Sync Status Logic primarily)
    // For now, we trust the Tenant Object for active tier, but this table tracks history/validity
    // For now, we trust the Tenant Object for active tier, but this table tracks history/validity
    const subSubscriptions = subscriptionsCollection.query().observe().subscribe();

    // Subscribe to Balance History
    const subHistory = historyCollection.query().observe().subscribe((data) => {
      const plainHistory = data.map(h => ({
        id: h.id,
        monthYear: h.monthYear,
        openingBalance: h.openingBalance,
        totalIncome: h.totalIncome,
        totalExpense: h.totalExpense,
        closingBalance: h.closingBalance
      }));
      setBalanceHistory(plainHistory.sort((a, b) => b.monthYear.localeCompare(a.monthYear)));
    });

    return () => {
      subTransactions.unsubscribe();
      subInvoices.unsubscribe();
      subSubscriptions.unsubscribe();
      subHistory.unsubscribe();
    };
  }, []);


  const [taxRules] = useState<TaxRule[]>(MOCK_TAX_RULES);
  const [budgets] = useState<Budget[]>(MOCK_BUDGETS);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [isBrowserOnline, setIsBrowserOnline] = useState(navigator.onLine);

  const isOnline = isBrowserOnline && !isSimulatedOffline;
  const [isSyncing, setIsSyncing] = useState(false);

  // ... (Transaction logic remains same)

  const addTransaction = async (tx: Transaction) => {
    await database.write(async () => {
      await database.collections.get<TransactionModel>('transactions').create(newTx => {
        if (tx.id) newTx._raw.id = tx.id; // Respect provided ID
        newTx.date = new Date(tx.date)
        newTx.type = tx.type
        newTx.amount = tx.amount
        newTx.categoryId = tx.categoryId
        newTx.categoryName = tx.categoryName
        newTx.description = tx.description
        newTx.payee = tx.payee || ''
        newTx.paymentMethod = tx.paymentMethod || ''
        newTx.refId = tx.refId || ''
        newTx.receiptUrls = tx.receiptUrls || []
        newTx._isDeductible = tx.isDeductible || false
        newTx.weCompliant = tx.weCompliant || false
        newTx.hasVatEvidence = tx.hasVatEvidence !== undefined ? tx.hasVatEvidence : true // Default to true if missing
        newTx.isRndExpense = tx.isRndExpense || false
        newTx.wallet = tx.wallet || 'operations'
        newTx.deductionTip = tx.deductionTip || ''
        newTx.isCapitalAsset = tx.isCapitalAsset || false
        newTx.assetClass = tx.assetClass || 'none'
        newTx.appSyncStatus = 'pending'
      })
    })
    performSync(); // [FIX] Instant Sync
  };

  const addTransactions = async (txs: Transaction[]) => {
    await database.write(async () => {
      const transactionsCollection = database.collections.get<TransactionModel>('transactions');
      const batchOps = txs.map(tx => transactionsCollection.prepareCreate(newTx => {
        newTx.date = new Date(tx.date)
        newTx.type = tx.type
        newTx.amount = tx.amount
        newTx.categoryId = tx.categoryId
        newTx.categoryName = tx.categoryName
        newTx.description = tx.description
        newTx.payee = tx.payee || ''
        newTx.paymentMethod = tx.paymentMethod || ''
        newTx.refId = tx.refId || ''
        newTx.receiptUrls = tx.receiptUrls || []
        newTx._isDeductible = tx.isDeductible || false
        newTx.weCompliant = tx.weCompliant || false
        newTx.hasVatEvidence = tx.hasVatEvidence !== undefined ? tx.hasVatEvidence : true
        newTx.isRndExpense = tx.isRndExpense || false
        newTx.wallet = tx.wallet || 'operations'
        newTx.deductionTip = tx.deductionTip || ''
        newTx.isCapitalAsset = tx.isCapitalAsset || false
        newTx.assetClass = tx.assetClass || 'none'
        newTx.appSyncStatus = 'pending'
      }));
      await database.batch(...batchOps);
    });
    performSync(); // [FIX] Instant Sync
  };

  const clearTransactions = async () => {
    await database.write(async () => {
      const allTxs = await database.collections.get<TransactionModel>('transactions').query().fetch();
      const batchOps = allTxs.map(tx => tx.prepareMarkAsDeleted());
      const batchDestroy = allTxs.map(tx => tx.prepareDestroyPermanently());
      await database.batch(...batchDestroy);
    });
    performSync(); // [FIX] Instant Sync
  };

  const deleteTransaction = async (id: string) => {
    await database.write(async () => {
      const tx = await database.collections.get<TransactionModel>('transactions').find(id);
      await tx.markAsDeleted();
      await tx.destroyPermanently();
    });
    performSync(); // [FIX] Instant Sync
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      await database.write(async () => {
        const tx = await database.collections.get<TransactionModel>('transactions').find(id);
        await tx.update(t => {
          if (updates.amount !== undefined) t.amount = updates.amount;
          if (updates.date) t.date = new Date(updates.date);
          if (updates.type) t.type = updates.type;
          if (updates.categoryName) t.categoryName = updates.categoryName;
          if (updates.categoryId) t.categoryId = updates.categoryId;
          if (updates.description) t.description = updates.description;
          if (updates.payee) t.payee = updates.payee;
          if (updates.isDeductible !== undefined) t.isDeductible = updates.isDeductible;
          if (updates.vatAmount !== undefined) t.vatAmount = updates.vatAmount;
          t.appSyncStatus = 'pending';
        });
      });
      performSync(); // [FIX] Instant Sync
    } catch (e) {
      console.error("Context updateTransaction Failed:", e);
      throw e; // Re-throw to let UI handle it
    }
  };

  const addInvoice = async (inv: Invoice) => {
    await database.write(async () => {
      // 1. Create Invoice Record
      await database.collections.get<InvoiceModel>('invoices').create(newInv => {
        newInv._raw.id = inv.id; // [FIX] Use provided UUID
        newInv.serialId = inv.serialId || 0
        newInv.customerName = inv.customerName
        newInv.totalAmount = inv.totalAmount
        newInv.vatAmount = inv.vatAmount || 0
        newInv.status = inv.status
        newInv.dateIssued = new Date(inv.date)
        newInv.items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;
        newInv.pdfGeneratedAt = inv.pdfGeneratedAt ? new Date(inv.pdfGeneratedAt) : null;
        newInv.reprintCount = inv.reprintCount || 0;
        newInv.appSyncStatus = 'pending'
      });

      // 2. Auto-Create Ledger Transaction (Income)
      // Only recognize revenue if not a draft
      if (inv.status !== 'draft') {
        await database.collections.get<TransactionModel>('transactions').create(newTx => {
          newTx._raw.id = crypto.randomUUID();
          newTx.date = new Date(inv.date);
          newTx.type = 'income';
          newTx.amount = inv.totalAmount;
          newTx.categoryId = 'sales';
          newTx.categoryName = 'Sales & Revenue';
          newTx.description = `Invoice to ${inv.customerName}`;
          // @ts-ignore - refId key depends on model definition
          newTx.refId = inv.id;
          newTx.invoiceId = inv.id; // [NEW] Link for Evidence Logic
          newTx.hasVatEvidence = !!inv.pdfGeneratedAt; // [NEW] If PDF exists, we have evidence
          newTx.appSyncStatus = 'pending';
        });
      }
    });

    // 3. Force Sync
    performSync();

  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
      await database.write(async () => {
        const inv = await database.collections.get<InvoiceModel>('invoices').find(id);
        await inv.update(i => {
          // [FIX] Update ALL fields, not just status
          if (updates.customerName) i.customerName = updates.customerName;
          if (updates.items) i.items = JSON.stringify(updates.items); // Model expects JSON string usually? Or the decorator handles it?
          // Model definition: @json('items', sanitizeItems) items!: any[]
          // If using the decorator, we assign the array directly.
          if (updates.items) i.items = updates.items;

          if (updates.totalAmount !== undefined) i.totalAmount = updates.totalAmount;
          if (updates.vatAmount !== undefined) i.vatAmount = updates.vatAmount;
          if (updates.date) i.dateIssued = new Date(updates.date);

          if (updates.status) i.status = updates.status;
          if (updates.pdfGeneratedAt) i.pdfGeneratedAt = new Date(updates.pdfGeneratedAt);
          if (updates.reprintCount !== undefined) i.reprintCount = updates.reprintCount;
          i.appSyncStatus = 'pending';
        });

        // 2. Cascade Evidence to Linked Transaction
        // 2. Cascade Updates to Linked Transaction (Income Record)
        const linkedTx = await database.collections.get<TransactionModel>('transactions').query().fetch();
        const tx = linkedTx.find(t => t.refId === id || (t as any).invoiceId === id);

        if (tx) {
          await tx.update(t => {
            // [FIX] Ensure Ledger matches Invoice Amount/Date
            if (updates.totalAmount !== undefined) t.amount = updates.totalAmount;
            if (updates.date) t.date = new Date(updates.date);
            if (updates.customerName) t.description = `Invoice to ${updates.customerName}`;

            // Evidence Logic
            if (updates.pdfGeneratedAt) {
              t.hasVatEvidence = true;
            }

            t.appSyncStatus = 'pending';
          });
        }
      });
      // Update Local State (Optimistic)
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
      // 3. Force Sync
      performSync();
    } catch (e) {
      console.error("Failed to update invoice", e);
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await database.write(async () => {
        // 1. Delete Invoice
        const invoice = await database.collections.get<InvoiceModel>('invoices').find(id);
        await invoice.markAsDeleted();
        await invoice.destroyPermanently();

        // 2. Cascade Delete to Ledger (Remove Income)
        const linkedTx = await database.collections.get<TransactionModel>('transactions').query().fetch();
        const tx = linkedTx.find(t => t.refId === id || (t as any).invoiceId === id);
        if (tx) {
          await tx.markAsDeleted();
          await tx.destroyPermanently();
        }
      });
      setInvoices(prev => prev.filter(i => i.id !== id));

      // 2.5 API DELETE (Immediate Sync)
      if (tenant?.id) {
        // [FIX] Use Query Param for DELETE (Standard & Safer than Body)
        fetch(`${API_BASE_URL}/api/sync/invoices/${id}?tenantId=${tenant.id}`, {
          method: 'DELETE',
        }).catch(err => console.error("Remote Delete Failed", err));
      }

      // 3. Force Sync (Updates balances etc)
      performSync();
    } catch (e) {
      console.error("Failed to delete invoice", e);
    }
  };

  // SMART SYNC LOGIC
  const performSmartSync = async () => {
    // 1. Check if we have a user (Local Load must have finished first)
    // Note: We access the 'tenant' state, but inside useEffect wrapper usually.
    // Since this is called after local load, we check the DB directly to be safe or rely on state if updated.

    console.log("[SmartSync] Checking Data Freshness...");
    const LAST_SYNC_KEY = 'opcore_last_sync_ts';
    const STALE_THRESHOLD_MS = 3 * 60 * 1000; // 3 Minutes

    const lastSyncStr = localStorage.getItem(LAST_SYNC_KEY);
    const now = Date.now();
    const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
    const isStale = (now - lastSync) > STALE_THRESHOLD_MS;

    // Check if we actually have data (Visual Check)
    const hasLocalTenant = (await database.collections.get('tenants').query().fetchCount()) > 0;

    if (!hasLocalTenant) {
      // Case A: No User Found Locally.
      // If we are supposed to be logged in, this is bad. But usually means just Onboarding.
      // We stop loading.
      console.log("[SmartSync] No local user found. Ready to Onboard.");
      setIsInitializing(false);
      return;
    }

    if (isStale) {
      console.log(`[SmartSync] Data is STALE (Last Sync: ${new Date(lastSync).toLocaleTimeString()}). Forcing Pull...`);
      // Force Pull
      try {
        // We need the tenant ID. Since state might lag, grab from DB.
        const localTenants = await database.collections.get<any>('tenants').query().fetch();
        if (localTenants.length > 0) {
          const tId = localTenants[0].id;
          await performFullPull(tId);
          localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
        }
      } catch (e) {
        console.error("[SmartSync] Failed to Pull", e);
      }
    } else {
      console.log("[SmartSync] Data is FRESH. Skipping Cloud Pull.");
    }

    // DONE
    setTimeout(() => setIsInitializing(false), 800); // Small delay for animation smoothness
  };

  // Dedicated "Pull-Only" Sync for Initialization
  const performFullPull = async (tenantId: string) => {
    if (!tenantId) return;

    // 1. Tenant Details
    try {
      // We assume existing sync endpoints or just rely onto specific collections
      // For MVP, we reuse the massive 'performSync' but strictly force the Pull parts?
      // Actually, let's just call 'performSync' but we need to ensure it PULLS.
      // The existing performSync does both push/pull. That is fine.
      // Ideally we refactor 'performSync' to accept { direction: 'pull' | 'push' | 'both' }
      // For now, we manually fetch the criticals: Tenant, Txs, Balance.

      // A. Transactions
      const txRes = await fetch(`${API_BASE_URL}/api/sync/transactions?tenantId=${tenantId}`);
      if (txRes.ok) { /* Process logic similar to performSync... reused logic implied or copied for robustness?
                              For Cleanliness, let's actually just call the main performSync() if we can context switch.
                              However, performSync uses 'tenant' state which might be stale during mount.
                              So we pass tenantId explicitly? No, performSync uses 'tenant' from closure.
                              Refactor performSync to accept an optional ID override.
                           */
      }
    } catch (e) { }

    // REFACTOR COMPROMISE: We will simulate the pull by calling the API endpoints directly here to be safe and explicit.
    // Or better: We utilize the fact that we just loaded the tenant from DB in step 1.
    // So 'tenant' state might be set? 'setTenant' is async.
    // Safe bet: Pass ID to helper.

    await performSyncInternal(tenantId);
  };

  // Refactored Internal Sync that accepts ID
  const performSyncInternal = async (activeTenantId: string) => {
    console.log("[SmartSync] Internal Pull for", activeTenantId);

    try {
      // 1. Transactions Pull
      const tRes = await fetch(`${API_BASE_URL}/api/sync/transactions?tenantId=${activeTenantId}`);
      if (tRes.ok) {
        const { transactions: remoteTxs } = await tRes.json();
        if (remoteTxs?.length > 0) {
          const col = database.collections.get<TransactionModel>('transactions');
          const batch = [];
          for (const r of remoteTxs) {
            try {
              const local = await col.find(r.id);
              batch.push(local.prepareUpdate(t => {
                t.amount = Number(r.amount);
                t.description = r.description;
                t.categoryName = r.category_name;
                t.categoryId = r.category_id;
                t.date = new Date(r.date);
                t.appSyncStatus = 'synced';
              }));
            } catch (e) {
              batch.push(col.prepareCreate(t => {
                t._raw.id = r.id;
                t.amount = Number(r.amount);
                t.description = r.description;
                t.categoryName = r.category_name;
                t.categoryId = r.category_id;
                t.date = new Date(r.date);
                t.type = r.type;
                t.wallet = r.wallet || 'operations';
                t.appSyncStatus = 'synced';
              }));
            }
          }
          if (batch.length > 0) {
            await database.write(async () => {
              await database.batch(batch);
            });
          }
        }
      }

      // 2. Refresh Tenant Details (Critical for Account Type fix)
      /* ... This logic usually happens on Login, but good to refresh ... */

    } catch (e) { console.error("SmartSync Internal Failed", e); }
  }


  // ==========================
  // MAIN SYNC FUNCTION (Push + Pull)
  // ==========================
  const performSync = async () => {
    if (IS_OFFLINE_TEST_MODE) {
      console.warn("[Sync] SKIPPED (Offline Test Mode)");
      setIsSyncing(false);
      return;
    }
    if (!isBrowserOnline || !tenant.id) return;
    setIsSyncing(true);
    const API_BASE = API_BASE_URL;

    // DEBUG: Dump all statuses to verify Property Name and Values
    // const allInvoices = await database.collections.get<InvoiceModel>('invoices').query().fetch();
    // console.log("[Sync Debug] TOTAL LOCAL INVOICES:", allInvoices.length);

    try {
      console.log(`[Sync] Starting Sync against ${API_BASE} for Tenant: ${tenant.id}`);

      // 1. PUSH Invoices (Parent Records) - DIRECT DB QUERY
      // [FIX] Checking for 'null' too, in case migration failed to backfill or column is missing
      const pendingInvoices = await database.collections.get<InvoiceModel>('invoices')
        .query(Q.or(
          Q.where('sync_status', 'pending'),
          Q.where('sync_status', null)
        ))
        .fetch();

      console.log(`[Sync] Found ${pendingInvoices.length} Pending Invoices for Tenant ${tenant.id}`);

      if (pendingInvoices.length > 0) {
        // Prepare Payload (Map from Model to Plain Object)
        const payload = pendingInvoices.map(i => ({
          id: i.id,
          customerName: i.customerName || 'Unknown Customer', // Fallback
          totalAmount: i.totalAmount || 0, // [FIX] Prevent Null Violation
          vatAmount: i.vatAmount || 0,
          status: i.status || 'draft',
          date: i.dateIssued ? i.dateIssued.toISOString() : new Date().toISOString(),
          // invoices: i.items - wait, items is JSON string in DB?
          items: typeof i.items === 'string' ? JSON.parse(i.items) : (i.items || []),
          pdfGeneratedAt: i.pdfGeneratedAt ? i.pdfGeneratedAt.toISOString() : null,
          reprintCount: i.reprintCount || 0
        }));

        console.log("[Sync] Pushing Invoices Payload:", JSON.stringify(payload.map(i => ({ id: i.id, customers: i.customerName }))));

        const invRes = await fetch(`${API_BASE}/api/sync/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId: tenant.id, invoices: payload })
        });

        if (invRes.ok) {
          // Batch Update Status
          await database.write(async () => {
            const batchUpdates = pendingInvoices.map(inv =>
              inv.prepareUpdate(r => { r.appSyncStatus = 'synced' })
            );
            await database.batch(batchUpdates);
          });
        }
      }

      // 2. PUSH Transactions (Child Records) - DIRECT DB QUERY
      // DEBUG: Analyze Local Transactions
      const allTx = await database.collections.get<TransactionModel>('transactions').query().fetch();
      console.log(`[Diff Debug] Total Local Txs: ${allTx.length}`);
      console.log(`[Diff Debug] Pending Txs (Manual Check):`, allTx.filter(t => t.appSyncStatus === 'pending' || !t.appSyncStatus).length);

      const pendingTxs = await database.collections.get<TransactionModel>('transactions')
        .query(Q.or(
          Q.where('sync_status', 'pending'),
          Q.where('sync_status', null)
        ))
        .fetch();

      console.log(`[Sync] Found ${pendingTxs.length} Pending Transactions`);

      if (pendingTxs.length > 0) {
        // Map to plain object
        const txPayload = pendingTxs.map(t => ({
          id: t.id,
          date: t.date ? t.date.toISOString() : new Date().toISOString(),
          type: t.type,
          amount: t.amount || 0, // [FIX] Prevent Null Violation
          categoryId: t.categoryId,
          categoryName: t.categoryName,
          description: t.description,
          payee: t.payee,
          paymentMethod: t.paymentMethod,
          refId: t.refId, // CRITICAL: This links to Invoice ID
          invoiceId: (t as any).invoiceId,
          receiptUrls: t.receiptUrls,
          isDeductible: t.isDeductible,
          weCompliant: t.weCompliant,
          hasVatEvidence: t.hasVatEvidence,
          isRndExpense: t.isRndExpense,
          wallet: t.wallet,
          deductionTip: t.deductionTip,
          isCapitalAsset: t.isCapitalAsset,
          assetClass: t.assetClass,
          vendorTin: (t as any).vendorTin
        }));

        const txRes = await fetch(`${API_BASE}/api/sync/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId: tenant.id, transactions: txPayload })
        });

        if (txRes.ok) {
          await database.write(async () => {
            const batchUpdates = pendingTxs.map(tx =>
              tx.prepareUpdate(record => { record.appSyncStatus = 'synced'; })
            );
            await database.batch(batchUpdates);
          });
        } else {
          console.error("Tx Sync Failed", await txRes.text());
        }
      }

      // 3. PULL Updates (Using Internal Logic)
      await performSyncInternal(tenant.id);

      // 4. PULL Invoices
      const invPullRes = await fetch(`${API_BASE}/api/sync/invoices?tenantId=${tenant.id}`);
      if (invPullRes.ok) {
        const { invoices: remoteInvoices } = await invPullRes.json();
        if (remoteInvoices && remoteInvoices.length > 0) {
          const invCollection = database.collections.get<InvoiceModel>('invoices');
          const batchOps: any[] = [];
          for (const remote of remoteInvoices) {
            try {
              const local = await invCollection.find(remote.id);
              // Optional: Update local if needed
              batchOps.push(local.prepareUpdate(i => {
                i.appSyncStatus = 'synced';
              }));
            } catch (e) {
              batchOps.push(invCollection.prepareCreate(i => {
                i._raw.id = remote.id;
                i.customerName = remote.customer_name;
                i.totalAmount = Number(remote.amount);
                i.vatAmount = Number(remote.vat_amount);
                i.status = remote.status;
                i.dateIssued = new Date(remote.date_issued);
                i.items = remote.items;
                i.appSyncStatus = 'synced';
                i.serialId = remote.serial_id;
              }));
            }
          }
          if (batchOps.length > 0) {
            await database.write(async () => {
              await database.batch(batchOps);
            });
          }
        }
      }

      // ==========================
      // 5. SUBSCRIPTIONS
      // ==========================
      const subRes = await fetch(`${API_BASE}/api/sync/subscriptions?tenantId=${tenant.id}`);
      if (subRes.ok) {
        const data = await subRes.json();
        const remoteSubs = data.subscriptions || [];

        if (remoteSubs.length > 0) {
          const subCollection = database.collections.get<SubscriptionModel>('subscriptions');
          const batchOps = [];
          for (const remote of remoteSubs) {
            try {
              const local = await subCollection.find(remote.id);
              // Update locally if needed
            } catch (e) {
              batchOps.push(subCollection.prepareCreate(s => {
                s._raw.id = remote.id;
                s.planType = remote.plan_type;
                s.status = remote.status;
                s.startDate = new Date(remote.start_date);
                s.endDate = remote.end_date ? new Date(remote.end_date) : new Date();
              }));
            }
          }
          if (batchOps.length > 0) {
            await database.write(async () => {
              await database.batch(batchOps);
            });
          }
        }
      }

      // ==========================
      // 6. STARTING BALANCES (Sync)
      // ==========================
      console.log("[Sync] Pulling Starting Balances...");
      const balanceRes = await fetch(`${API_BASE}/api/sync/balances/starting?tenantId=${tenant.id}`);
      if (balanceRes.ok) {
        const json = await balanceRes.json();
        // Server returns { status: 'success', data: [...] }
        if (json.data && Array.isArray(json.data)) {
          const currentYear = new Date().getFullYear();
          const remoteBalance = json.data.find((b: any) => b.year === currentYear);

          if (remoteBalance) {
            console.log("[Sync] Remote Starting Balance Found:", remoteBalance.amount);
            const collection = database.collections.get<StartingBalance>('starting_balances');
            // Efficiently find existing record
            const balances = await collection.query().fetch();
            const existing = balances.find(b => b.year === currentYear);
            const batchOps = [];

            if (existing) {
              if (Number(remoteBalance.amount) !== existing.amount) {
                batchOps.push(existing.prepareUpdate(b => {
                  b.amount = Number(remoteBalance.amount);
                }));
                setStartingBalance(Number(remoteBalance.amount));
              }
            } else {
              batchOps.push(collection.prepareCreate(b => {
                b.year = currentYear;
                b.amount = Number(remoteBalance.amount);
              }));
              setStartingBalance(Number(remoteBalance.amount));
            }

            if (batchOps.length > 0) {
              await database.write(async () => {
                await database.batch(batchOps);
              });
            }
          } else {
            console.log("[Sync] No Remote Balance found for this year.");
          }
        }
      } else {
        console.warn("[Sync] Balance Fetch Failed:", balanceRes.status, balanceRes.statusText);
      }

      // ==========================
      // 7. BALANCE HISTORY (Pull Only)
      // ==========================
      const historyRes = await fetch(`${API_BASE}/api/sync/balances/history?tenantId=${tenant.id}`);
      if (historyRes.ok) {
        const { history } = await historyRes.json();
        if (history && history.length > 0) {
          const historyCollection = database.collections.get<BalanceHistory>('balance_history');
          const batchOps = [];
          const localHistory = await historyCollection.query().fetch();

          for (const remote of history) {
            try {
              const validLocal = localHistory.find(l => l.monthYear === remote.month_year);

              if (validLocal) {
                batchOps.push(validLocal.prepareUpdate(h => {
                  h.openingBalance = Number(remote.opening_balance);
                  h.totalIncome = Number(remote.total_income);
                  h.totalExpense = Number(remote.total_expense);
                  h.closingBalance = Number(remote.closing_balance);
                }));
              } else {
                batchOps.push(historyCollection.prepareCreate(h => {
                  h.monthYear = remote.month_year;
                  h.openingBalance = Number(remote.opening_balance);
                  h.totalIncome = Number(remote.total_income);
                  h.totalExpense = Number(remote.total_expense);
                  h.closingBalance = Number(remote.closing_balance);
                }));
              }
            } catch (e) { }
          }
          if (batchOps.length > 0) {
            await database.write(async () => {
              await database.batch(batchOps);
            });
          }
        }
      }

      console.log("Sync Complete");
    } catch (error) {
      console.error("Sync Failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // DEBUG: Expose sync to window
  useEffect(() => {
    (window as any).performSync = performSync;
    (window as any).db = database;
  }, [tenant.id, isBrowserOnline]);

  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // AUTO-SYNC TRIGGER
  useEffect(() => {
    if (isBrowserOnline && isOnboarded && tenant.id) {
      console.log("Auto-Sync Triggered");
      performSync();
    }
  }, [isBrowserOnline, isOnboarded, tenant.id]);

  const toggleOnlineSimulation = () => setIsSimulatedOffline(prev => !prev);
  useEffect(() => { isDarkMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark') }, [isDarkMode]);
  useEffect(() => { document.documentElement.style.setProperty('--brand-color', tenant.brandColor || '#2563eb'); }, [tenant.brandColor]);
  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const updateTenant = async (updates: Partial<Tenant>) => {
    // 1. Optimistic UI Update
    setTenant(prev => ({ ...prev, ...updates }));

    // 2. Persist to WatermelonDB (Offline First)
    try {
      if (tenant.id) {
        await database.write(async () => {
          const tenantsCollection = database.collections.get<any>('tenants');
          const localTenant = await tenantsCollection.find(tenant.id);
          await localTenant.update(t => {
            if (updates.businessName !== undefined) t.businessName = updates.businessName;
            if (updates.businessAddress !== undefined) t.businessAddress = updates.businessAddress;
            if (updates.phoneNumber !== undefined) t.phoneNumber = updates.phoneNumber;
            if (updates.brandColor !== undefined) t.brandColor = updates.brandColor;
            if (updates.logoUrl !== undefined) t.logoUrl = updates.logoUrl;
            if (updates.tinNumber !== undefined) t.tinNumber = updates.tinNumber;
            if (updates.taxIdentityNumber !== undefined) t.taxIdentityNumber = updates.taxIdentityNumber;
            // Add other fields as needed
          });
        });
      }
    } catch (e) {
      console.error("[UpdateTenant] DB Save Error", e);
    }

    // 3. Sync to Backend (Fire & Forget)
    if (isBrowserOnline && tenant.id && !IS_OFFLINE_TEST_MODE) {
      const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/api'; // Use dynamic base
      try {
        await fetch('http://localhost:3001/api/brand/update', { // Hardcoded to 3001 for dev
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: tenant.id,
            updates: updates
          })
        });
      } catch (e) {
        console.error("[UpdateTenant] API Sync Error", e);
      }
    }
  };

  // PERSISTED LOGIN
  const login = async (data: Partial<Tenant> & { isOnboarded?: boolean }) => {
    // 1. Update UI State (Safeguard Theme)
    const secureData = {
      ...data,
      themeColor: data.themeColor || data.brandColor || '#2252c9'
    };
    setTenant(prev => ({ ...prev, ...secureData }));
    setIsOnboarded(true);

    // 2. Persist to DB
    try {
      await database.write(async () => {
        const tenantsCollection = database.collections.get<any>('tenants');
        const tenants = await tenantsCollection.query().fetch();

        if (tenants.length > 0) {
          const currentTenant = tenants[0];

          // CRITICAL: Check for ID Mismatch (Local Generated vs Server UUID)
          if (data.id && currentTenant.id !== data.id) {
            console.warn("ID Mismatch or New User Detected. Resetting Database...", currentTenant.id, "->", data.id);

            // Hard Reset: Manual Deletion to avoid locking issues
            try {
              // Fetch all records from all collections
              const allTenants = await database.collections.get<any>('tenants').query().fetch();
              const allTxs = await database.collections.get<any>('transactions').query().fetch();
              const allInvoices = await database.collections.get<any>('invoices').query().fetch();
              const allSubs = await database.collections.get<any>('subscriptions').query().fetch();
              const allBalances = await database.collections.get<any>('starting_balances').query().fetch();
              const allHistory = await database.collections.get<any>('balance_history').query().fetch();

              // Batch Delete
              const deletions = [
                ...allTenants.map(r => r.prepareDestroyPermanently()),
                ...allTxs.map(r => r.prepareDestroyPermanently()),
                ...allInvoices.map(r => r.prepareDestroyPermanently()),
                ...allSubs.map(r => r.prepareDestroyPermanently()),
                ...allBalances.map(r => r.prepareDestroyPermanently()),
                ...allHistory.map(r => r.prepareDestroyPermanently())
              ];

              if (deletions.length > 0) {
                await database.batch(deletions);
              }
              console.log("Database successfully wiped manually.");
            } catch (e) {
              console.error("Manual wipe failed, fallback to previous state", e);
            }

            // Re-fetch Collection after Reset (it's empty now)
            const freshTenants = database.collections.get<any>('tenants');

            // Create New Tenant Record
            await freshTenants.create(t => {
              t._raw.id = data.id; // FORCE SERVER ID
              t.businessName = data.businessName || 'My Business';
              t.email = data.email || '';
              t.accountType = (data.accountType || 'personal').toLowerCase();
              t.subscriptionTier = data.subscriptionTier || 'free';
              t.countryCode = 'NG';
              t.currencySymbol = '₦';
              t.taxIdentityNumber = data.taxIdentityNumber || '';
              t.businessAddress = data.businessAddress || '';
              t.phoneNumber = data.phoneNumber || '';
              t.turnoverBand = data.turnoverBand || 'micro';
              t.sector = data.sector || 'general';
              t.brandColor = data.brandColor || '#2563eb';
              t.logoUrl = data.logoUrl || '';

              // NTA Logic
              t.residenceState = data.residenceState || '';
              t.paysRent = data.paysRent ?? false;
              t.rentAmount = data.rentAmount || 0;
              t.annualIncome = data.annualIncome || 0;
              t.businessStructure = data.businessStructure || '';
            });
          } else {
            // IDs Match, just update details
            await currentTenant.update(t => {
              t.businessName = data.businessName || t.businessName;
              t.email = data.email || t.email;
              t.accountType = (data.accountType || t.accountType || 'personal').toLowerCase();
              t.subscriptionTier = data.subscriptionTier || 'free';
              t.taxIdentityNumber = data.taxIdentityNumber || '';

              t.businessAddress = data.businessAddress || t.businessAddress;
              t.phoneNumber = data.phoneNumber || t.phoneNumber;
              t.turnoverBand = data.turnoverBand || 'micro';
              t.sector = data.sector || 'general';
              t.brandColor = data.brandColor || '#2563eb';
              t.logoUrl = data.logoUrl || '';

              // NTA Logic
              t.residenceState = data.residenceState || '';
              t.paysRent = data.paysRent ?? false;
              t.rentAmount = data.rentAmount || 0;
              t.annualIncome = data.annualIncome || 0;
              t.businessStructure = data.businessStructure || '';
            });
          }
        } else {
          // No Record, Create New
          await tenantsCollection.create(t => {
            if (data.id) t._raw.id = data.id; // FORCE SERVER ID if provided
            t.businessName = data.businessName || 'My Business';
            t.email = data.email || '';
            t.accountType = data.accountType || 'personal';
            t.subscriptionTier = data.subscriptionTier || 'free';
            t.countryCode = 'NG';
            t.currencySymbol = '₦';
            t.taxIdentityNumber = data.taxIdentityNumber || '';
            t.businessAddress = data.businessAddress || '';
            t.phoneNumber = data.phoneNumber || '';
            t.turnoverBand = data.turnoverBand || 'micro';
            t.sector = data.sector || 'general';
            t.brandColor = data.brandColor || '#2563eb';
            t.logoUrl = data.logoUrl || '';

            // NTA Logic
            t.residenceState = data.residenceState || '';
            t.paysRent = data.paysRent ?? false;
            t.rentAmount = data.rentAmount || 0;
            t.annualIncome = data.annualIncome || 0;
            t.businessStructure = data.businessStructure || '';
          });
        }
      });
    } catch (err) {
      console.error("Failed to persist tenant login", err);
    }
  };



  const updateStartingBalance = async (amount: number) => {
    setStartingBalance(amount);


    // 1. Update Local (Offline First)
    await database.write(async () => {
      const currentYear = new Date().getFullYear();
      const collection = database.collections.get<StartingBalance>('starting_balances');
      const balances = await collection.query().fetch();
      const existing = balances.find(b => b.year === currentYear);

      if (existing) {
        await existing.update(b => {
          b.amount = amount;
        });
      } else {
        await collection.create(b => {
          b.year = currentYear;
          b.amount = amount;
        });
      }
    });

    // 2. Sync to Server (Fire & Forget for MVP)
    if (isBrowserOnline && tenant.id && !IS_OFFLINE_TEST_MODE) {
      console.log(`[UpdateBalance] Pushing ${amount} to Server for Tenant ${tenant.id}...`);
      // DEBUG: Hardcoded to localhost
      const API_BASE = 'http://localhost:3001';

      fetch(`${API_BASE}/api/sync/balances/starting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          year: new Date().getFullYear(),
          amount
        })
      })
        .then(async (res) => {
          if (res.ok) console.log("[UpdateBalance] Push Success");
          else console.warn("[UpdateBalance] Push Failed:", res.status, await res.text());
        })
        .catch(err => console.error("[UpdateBalance] Push Error:", err));
    }
  };

  // Feature Locking Logic
  const isFeatureLocked = (feature: 'tax_optimizer' | 'advanced_ledger') => {
    // DEV OVERRIDE: Unlock everything for testing
    return false; // Force Unlock

    /*
    // 1. GLOBAL OVERRIDE: If Pro, unlock everything.
    if (tenant.subscriptionTier === 'pro') {
      return false;
    }
   
    // 2. Default Locks for Free Tier
    if (feature === 'tax_optimizer' || feature === 'advanced_ledger') {
      return true;
    }
   
    return false;
    */
  };

  const logout = () => { setIsOnboarded(false); setTenant(INITIAL_TENANT); }

  // MANUAL RESET UTILITY (Lazy Load to avoid circular deps)
  const performAppReset = async () => {
    // Legacy support wrapper
    await import('../utils/nuclearReset').then(m => m.nuclearReset());
  };

  return (
    <TenantContext.Provider value={{
      tenant, isOnboarded, login, logout, updateTenant,
      transactions, addTransaction, deleteTransaction, updateTransaction,
      taxRules, invoices, addInvoice, deleteInvoice, budgets,
      isDarkMode, toggleDarkMode, isOnline, isSyncing, toggleOnlineSimulation,
      addTransactions,
      clearTransactions,
      performSync,

      startingBalance,
      updateStartingBalance,
      balanceHistory,
      isInitializing, // Export logic
      isFeatureLocked,
      performAppReset,
      updateInvoice,
      systemSettings, // [NEW] Exposed
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
