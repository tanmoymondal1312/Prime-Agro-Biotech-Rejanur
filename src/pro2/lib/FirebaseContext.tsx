import React, { createContext, useContext, useEffect, useState } from 'react';
import { Borrower, Loan, StockItem, MyDebt, MyDebtPayment } from '../types';

interface AppContextType {
  user: { uid: string; name: string } | null;
  loading: boolean;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  borrowers: Borrower[];
  loans: Loan[];
  stocks: StockItem[];
  myDebts: MyDebt[];
  addBorrower: (borrower: Omit<Borrower, 'id' | 'riskLevel'>) => Promise<string>;
  addLoan: (loan: Omit<Loan, 'id' | 'status' | 'remainingAmount' | 'payments'>) => Promise<void>;
  addPayment: (loanId: string, amount: number, date: Date, note?: string) => Promise<void>;
  deleteBorrower: (id: string) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  updateStock: (id: string, quantity: number, note?: string) => Promise<void>;
  addStockItem: (item: Omit<StockItem, 'id' | 'lastUpdated'>) => Promise<void>;
  deleteStockItem: (id: string) => Promise<void>;
  addMyDebt: (debt: Omit<MyDebt, 'id' | 'remainingAmount' | 'payments'>) => Promise<void>;
  updateMyDebt: (id: string, debt: Partial<MyDebt>) => Promise<void>;
  deleteMyDebt: (id: string) => Promise<void>;
  addMyDebtPayment: (debtId: string, amount: number, date: Date, note?: string) => Promise<void>;
  deleteMyDebtPayment: (debtId: string, paymentId: string) => Promise<void>;
  login: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_STOCKS: StockItem[] = [
  { id: 'tsp',       name: 'টিএসপি',    quantity: 0, category: 'Fertilizer', lastUpdated: new Date(), note: '' },
  { id: 'potash',    name: 'পটাশ',       quantity: 0, category: 'Fertilizer', lastUpdated: new Date(), note: '' },
  { id: 'dap',       name: 'ড্যাপ',      quantity: 0, category: 'Fertilizer', lastUpdated: new Date(), note: '' },
  { id: 'urea',      name: 'ইউরিয়া',    quantity: 0, category: 'Fertilizer', lastUpdated: new Date(), note: '' },
  { id: 'organic',   name: 'জৈব',        quantity: 0, category: 'Fertilizer', lastUpdated: new Date(), note: '' },
  { id: 'empty-bag', name: 'খালি বস্তা', quantity: 0, category: 'Other', subCategory: 'bag', lastUpdated: new Date(), note: '' },
];

const API = {
  borrowers: '/api/takatrack_borrowers.php',
  loans:     '/api/takatrack_loans.php',
  stocks:    '/api/takatrack_stocks.php',
  myDebts:   '/api/takatrack_my_debts.php',
};

function uid() { return Math.random().toString(36).substr(2, 9); }

function toStr(d: Date | string | undefined): string | undefined {
  if (!d) return undefined;
  return d instanceof Date ? d.toISOString() : d;
}

async function apiPost(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
}

async function apiPut(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${url} failed: ${res.status}`);
}

async function apiDelete(url: string): Promise<void> {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${url} failed: ${res.status}`);
}

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user]      = useState<{ uid: string; name: string }>({ uid: 'local-user-123', name: 'Local User' });
  const [loading, setLoading]   = useState(true);
  const [theme, setThemeState]  = useState<'dark' | 'light'>('dark');
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [loans,     setLoans]     = useState<Loan[]>([]);
  const [stocks,    setStocks]    = useState<StockItem[]>([]);
  const [myDebts,   setMyDebts]   = useState<MyDebt[]>([]);

  const setTheme = (t: 'dark' | 'light') => {
    setThemeState(t);
    localStorage.setItem('takatrack_theme', t);
  };

  useEffect(() => {
    (async () => {
      const savedTheme = localStorage.getItem('takatrack_theme') as 'dark' | 'light' | null;
      if (savedTheme) setThemeState(savedTheme);

      try {
        const [bRes, lRes, sRes, dRes] = await Promise.all([
          fetch(API.borrowers),
          fetch(API.loans),
          fetch(API.stocks),
          fetch(API.myDebts),
        ]);

        setBorrowers(bRes.ok ? await bRes.json() : []);

        const loansRaw = lRes.ok ? await lRes.json() : [];
        setLoans(loansRaw.map((l: any) => ({
          ...l,
          giveDate: new Date(l.giveDate),
          dueDate:  new Date(l.dueDate),
          payments: (l.payments || []).map((p: any) => ({ ...p, date: new Date(p.date) })),
        })));

        const stocksData: StockItem[] = sRes.ok ? await sRes.json() : [];
        if (stocksData.length > 0) {
          setStocks(stocksData.map(s => ({ ...s, lastUpdated: new Date(s.lastUpdated) })));
        } else {
          setStocks(INITIAL_STOCKS);
          await Promise.all(
            INITIAL_STOCKS.map(s =>
              apiPost(API.stocks, { ...s, lastUpdated: s.lastUpdated.toISOString() }).catch(() => {})
            )
          );
        }

        const debtsRaw = dRes.ok ? await dRes.json() : [];
        setMyDebts(debtsRaw.map((d: any) => ({
          ...d,
          date:     new Date(d.date),
          dueDate:  d.dueDate ? new Date(d.dueDate) : undefined,
          payments: (d.payments || []).map((p: any) => ({ ...p, date: new Date(p.date) })),
        })));
      } catch (e) {
        console.error('Failed to load data from API', e);
      }

      setLoading(false);
    })();
  }, []);

  const login = () => {};

  // ── Borrowers ─────────────────────────────────────────────────────────────
  const addBorrower = async (data: Omit<Borrower, 'id' | 'riskLevel'>): Promise<string> => {
    const nb: Borrower = { ...data, id: uid(), riskLevel: 'Low' };
    await apiPost(API.borrowers, nb);
    setBorrowers(prev => [nb, ...prev]);
    return nb.id;
  };

  const deleteBorrower = async (id: string): Promise<void> => {
    await apiDelete(`${API.borrowers}?id=${id}`);
    setBorrowers(prev => prev.filter(b => b.id !== id));
    setLoans(prev => prev.filter(l => l.borrowerId !== id));
  };

  // ── Loans ─────────────────────────────────────────────────────────────────
  const addLoan = async (data: Omit<Loan, 'id' | 'status' | 'remainingAmount' | 'payments'>): Promise<void> => {
    const amount = Number(data.amount) || 0;
    const nl: Loan = { ...data, amount, id: uid(), remainingAmount: amount, status: 'Active' as any, payments: [] };
    await apiPost(API.loans, {
      ...nl,
      giveDate: toStr(nl.giveDate),
      dueDate:  toStr(nl.dueDate),
    });
    setLoans(prev => [nl, ...prev]);
  };

  const addPayment = async (loanId: string, amount: number, date: Date, note?: string): Promise<void> => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    const newRemaining = Math.max(0, (loan.remainingAmount || loan.amount) - amount);
    const updated: Loan = {
      ...loan,
      remainingAmount: newRemaining,
      status: newRemaining === 0 ? 'Paid' : 'Partial Paid' as any,
      payments: [...(loan.payments || []), { id: uid(), amount, date, note }],
    };
    await apiPut(`${API.loans}?id=${loanId}`, {
      remainingAmount: updated.remainingAmount,
      status: updated.status,
      payments: updated.payments.map(p => ({ ...p, date: toStr(p.date) })),
    });
    setLoans(prev => prev.map(l => l.id === loanId ? updated : l));
  };

  const deleteLoan = async (id: string): Promise<void> => {
    await apiDelete(`${API.loans}?id=${id}`);
    setLoans(prev => prev.filter(l => l.id !== id));
  };

  // ── Stocks ────────────────────────────────────────────────────────────────
  const updateStock = async (id: string, quantity: number, note?: string): Promise<void> => {
    await apiPut(`${API.stocks}?id=${id}`, { quantity, note });
    setStocks(prev => prev.map(s => s.id === id ? { ...s, quantity, note: note ?? s.note, lastUpdated: new Date() } : s));
  };

  const addStockItem = async (item: Omit<StockItem, 'id' | 'lastUpdated'>): Promise<void> => {
    const ns: StockItem = { ...item, id: uid(), lastUpdated: new Date() };
    await apiPost(API.stocks, { ...ns, lastUpdated: ns.lastUpdated.toISOString() });
    setStocks(prev => [...prev, ns]);
  };

  const deleteStockItem = async (id: string): Promise<void> => {
    await apiDelete(`${API.stocks}?id=${id}`);
    setStocks(prev => prev.filter(s => s.id !== id));
  };

  // ── My Debts ──────────────────────────────────────────────────────────────
  const addMyDebt = async (debt: Omit<MyDebt, 'id' | 'remainingAmount' | 'payments'>): Promise<void> => {
    const total = Number(debt.totalAmount) || 0;
    const nd: MyDebt = { ...debt, totalAmount: total, id: uid(), remainingAmount: total, payments: [] };
    await apiPost(API.myDebts, {
      ...nd,
      date:    toStr(nd.date),
      dueDate: toStr(nd.dueDate),
    });
    setMyDebts(prev => [...prev, nd]);
  };

  const updateMyDebt = async (id: string, updates: Partial<MyDebt>): Promise<void> => {
    const current = myDebts.find(d => d.id === id);
    if (!current) return;
    const updated = { ...current, ...updates };
    await apiPut(`${API.myDebts}?id=${id}`, {
      remainingAmount: updated.remainingAmount,
      note:    updated.note,
      dueDate: toStr(updated.dueDate),
      payments: (updated.payments || []).map(p => ({ ...p, date: toStr(p.date) })),
    });
    setMyDebts(prev => prev.map(d => d.id === id ? updated : d));
  };

  const deleteMyDebt = async (id: string): Promise<void> => {
    await apiDelete(`${API.myDebts}?id=${id}`);
    setMyDebts(prev => prev.filter(d => d.id !== id));
  };

  const addMyDebtPayment = async (debtId: string, amount: number, date: Date, note?: string): Promise<void> => {
    const debt = myDebts.find(d => d.id === debtId);
    if (!debt) return;
    const newPayment: MyDebtPayment = { id: uid(), amount, date, note };
    const payments = [...debt.payments, newPayment];
    const remainingAmount = Math.max(0, debt.totalAmount - payments.reduce((s, p) => s + p.amount, 0));
    const updated = { ...debt, payments, remainingAmount };
    await apiPut(`${API.myDebts}?id=${debtId}`, {
      remainingAmount: updated.remainingAmount,
      note:    updated.note,
      dueDate: toStr(updated.dueDate),
      payments: updated.payments.map(p => ({ ...p, date: toStr(p.date) })),
    });
    setMyDebts(prev => prev.map(d => d.id === debtId ? updated : d));
  };

  const deleteMyDebtPayment = async (debtId: string, paymentId: string): Promise<void> => {
    const debt = myDebts.find(d => d.id === debtId);
    if (!debt) return;
    const payments = debt.payments.filter(p => p.id !== paymentId);
    const remainingAmount = Math.max(0, debt.totalAmount - payments.reduce((s, p) => s + p.amount, 0));
    const updated = { ...debt, payments, remainingAmount };
    await apiPut(`${API.myDebts}?id=${debtId}`, {
      remainingAmount: updated.remainingAmount,
      note:    updated.note,
      dueDate: toStr(updated.dueDate),
      payments: updated.payments.map(p => ({ ...p, date: toStr(p.date) })),
    });
    setMyDebts(prev => prev.map(d => d.id === debtId ? updated : d));
  };

  return (
    <AppContext.Provider value={{
      user, loading, theme, setTheme,
      borrowers, loans, stocks, myDebts,
      addBorrower, addLoan, addPayment, deleteBorrower, deleteLoan,
      updateStock, addStockItem, deleteStockItem,
      addMyDebt, updateMyDebt, deleteMyDebt,
      addMyDebtPayment, deleteMyDebtPayment,
      login,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useFirebase = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useFirebase must be used within FirebaseProvider');
  return ctx;
};
