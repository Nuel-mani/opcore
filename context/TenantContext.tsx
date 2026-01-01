
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tenant, Transaction, TaxRule, Invoice, TurnoverBand, Budget } from '../types';
import { INITIAL_TENANT, INITIAL_TRANSACTIONS, MOCK_TAX_RULES, MOCK_BUDGETS } from '../constants';
import { database } from '../db';
import TransactionModel from '../db/models/Transaction';

interface TenantContextType {
  tenant: Tenant;
  isOnboarded: boolean;
  login: (data: Partial<Tenant>) => void;
  logout: () => void;
  updateTenant: (updates: Partial<Tenant>) => void;
  transactions: Transaction[];
  addTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  taxRules: TaxRule[];
  invoices: Invoice[];
  addInvoice: (inv: Invoice) => void;
  deleteInvoice: (id: string) => void;
  budgets: Budget[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  toggleOnlineSimulation: () => void;
  addTransactions?: (txs: Transaction[]) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [tenant, setTenant] = useState<Tenant>(INITIAL_TENANT);

  // Database State
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Observe Database Changes
  useEffect(() => {
    const transactionsCollection = database.collections.get<TransactionModel>('transactions');

    // Subscribe to all transactions (ordered by date desc)
    const subscription = transactionsCollection.query()
      .observe()
      .subscribe((data) => {
        // Map WatermelonDB Models to our Plain Transaction Interface for UI compatibility
        // In a full refactor, we'd pass Models down, but this is a bridge
        const plainTxs = data.map(t => ({
          id: t.id,
          date: t.date.toISOString().split('T')[0], // Convert Date obj back to string YYYY-MM-DD
          type: t.type,
          amount: t.amount,
          categoryId: t.categoryId,
          categoryName: t.categoryName,
          description: t.description,
          payee: t.payee,
          paymentMethod: t.paymentMethod,
          refId: t.refId,
          receiptImageUrl: t.receiptImageUrl,
          isDeductible: t.isDeductible, // Using the getter logic!
          weCompliant: t.weCompliant,
          hasVatEvidence: t.hasVatEvidence,
          isRndExpense: t.isRndExpense,
          wallet: t.wallet,
          deductionTip: t.deductionTip,
          isCapitalAsset: t.isCapitalAsset,
          assetClass: t.assetClass,
          syncStatus: t.appSyncStatus
        } as unknown as Transaction)); // Type casting for compatibility

        setTransactions(plainTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      });

    return () => subscription.unsubscribe();
  }, []);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [taxRules] = useState<TaxRule[]>(MOCK_TAX_RULES);
  const [budgets] = useState<Budget[]>(MOCK_BUDGETS);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [isBrowserOnline, setIsBrowserOnline] = useState(navigator.onLine);

  const isOnline = isBrowserOnline && !isSimulatedOffline;
  const [isSyncing, setIsSyncing] = useState(false);

  const addTransaction = async (tx: Transaction) => {
    await database.write(async () => {
      await database.collections.get<TransactionModel>('transactions').create(newTx => {
        newTx.date = new Date(tx.date)
        newTx.type = tx.type
        newTx.amount = tx.amount
        newTx.categoryId = tx.categoryId
        newTx.categoryName = tx.categoryName
        newTx.description = tx.description
        newTx.payee = tx.payee || ''
        newTx.paymentMethod = tx.paymentMethod || ''
        newTx.refId = tx.refId || ''
        newTx.receiptImageUrl = tx.receiptImageUrl || ''
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
        newTx.receiptImageUrl = tx.receiptImageUrl || ''
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
  };

  const clearTransactions = async () => {
    await database.write(async () => {
      const allTxs = await database.collections.get<TransactionModel>('transactions').query().fetch();
      const batchOps = allTxs.map(tx => tx.prepareMarkAsDeleted());
      const batchDestroy = allTxs.map(tx => tx.prepareDestroyPermanently());
      // Mark deleted first then destroy? Or just destroy.
      // WatermelonDB sync recommends markAsDeleted. for local wipe, destroyPermanently is fine.
      await database.batch(...batchDestroy);
    });
  };

  const deleteTransaction = async (id: string) => {
    await database.write(async () => {
      const tx = await database.collections.get<TransactionModel>('transactions').find(id);
      await tx.markAsDeleted(); // Sync-friendly deletion
      await tx.destroyPermanently();
    });
  };

  const addInvoice = (inv: Invoice) => setInvoices(prev => [inv, ...prev]);
  const deleteInvoice = (id: string) => setInvoices(prev => prev.filter(i => i.id !== id));

  const performSync = () => { /* Sync Logic Placeholder */ };

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

  const toggleOnlineSimulation = () => setIsSimulatedOffline(prev => !prev);
  useEffect(() => { isDarkMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark') }, [isDarkMode]);
  useEffect(() => { document.documentElement.style.setProperty('--brand-color', tenant.brandColor); }, [tenant.brandColor]);
  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const updateTenant = (updates: Partial<Tenant>) => setTenant(prev => ({ ...prev, ...updates }));
  const login = (data: Partial<Tenant>) => { setTenant(prev => ({ ...prev, ...data })); setIsOnboarded(true); };
  const logout = () => { setIsOnboarded(false); setTenant(INITIAL_TENANT); }

  return (
    <TenantContext.Provider value={{
      tenant, isOnboarded, login, logout, updateTenant,
      transactions, addTransaction, deleteTransaction,
      taxRules, invoices, addInvoice, deleteInvoice, budgets,
      isDarkMode, toggleDarkMode, isOnline, isSyncing, toggleOnlineSimulation,
      // @ts-ignore
      addTransactions,
      // @ts-ignore
      clearTransactions
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
