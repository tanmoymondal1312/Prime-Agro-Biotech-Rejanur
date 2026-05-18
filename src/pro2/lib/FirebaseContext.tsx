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

function rand() { return Math.random().toString(36).substr(2, 9); }
function post(url: string, body: unknown) {
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(console.error);
}
function put(url: string, body: unknown) {
  return fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(console.error);
}
function del(url: string) {
  return fetch(url, { method: 'DELETE' }).catch(console.error);
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

  // ── Load all data from API on mount ──────────────────────────────────────
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

        const borrowersData: Borrower[] = bRes.ok ? await bRes.json() : [];
        setBorrowers(borrowersData);

        const loansRaw = lRes.ok ? await lRes.json() : [];
        // Dates come as strings from API — parse them back to Date objects
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
          // First run: seed initial stocks into DB
          setStocks(INITIAL_STOCKS);
          for (const s of INITIAL_STOCKS) {
            post(API.stocks, { ...s, lastUpdated: s.lastUpdated.toISOString() });
          }
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

  const login = () => { /* auto-logged in by portal */ };

  // ── Borrowers ─────────────────────────────────────────────────────────────
  const addBorrower = async (data: Omit<Borrower, 'id' | 'riskLevel'>) => {
    const nb: Borrower = { ...data, id: rand(), riskLevel: 'Low' };
    setBorrowers(prev => [nb, ...prev]);
    post(API.borrowers, nb);
    return nb.id;
  };

  const deleteBorrower = async (id: string) => {
    setBorrowers(prev => prev.filter(b => b.id !== id));
    setLoans(prev => prev.filter(l => l.borrowerId !== id));
    del(`${API.borrowers}?id=${id}`);
  };

  // ── Loans ─────────────────────────────────────────────────────────────────
  const addLoan = async (data: Omit<Loan, 'id' | 'status' | 'remainingAmount' | 'payments'>) => {
    const amount = Number(data.amount) || 0;
    const nl: Loan = { ...data, amount, id: rand(), remainingAmount: amount, status: 'Active' as any, payments: [] };
    setLoans(prev => [nl, ...prev]);
    post(API.loans, {
      ...nl,
      giveDate: nl.giveDate instanceof Date ? nl.giveDate.toISOString() : nl.giveDate,
      dueDate:  nl.dueDate  instanceof Date ? nl.dueDate.toISOString()  : nl.dueDate,
    });
  };

  const addPayment = async (loanId: string, amount: number, date: Date, note?: string) => {
    let updatedLoan: Loan | undefined;
    setLoans(prev => prev.map(loan => {
      if (loan.id !== loanId) return loan;
      const newRemaining = Math.max(0, (loan.remainingAmount || loan.amount) - amount);
      const newPayment = { id: rand(), amount, date, note };
      updatedLoan = {
        ...loan,
        remainingAmount: newRemaining,
        status: newRemaining === 0 ? 'Paid' : 'Partial Paid' as any,
        payments: [...(loan.payments || []), newPayment],
      };
      return updatedLoan;
    }));
    if (updatedLoan) {
      put(`${API.loans}?id=${loanId}`, {
        remainingAmount: updatedLoan.remainingAmount,
        status: updatedLoan.status,
        payments: updatedLoan.payments.map(p => ({ ...p, date: p.date instanceof Date ? p.date.toISOString() : p.date })),
      });
    }
  };

  const deleteLoan = async (id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
    del(`${API.loans}?id=${id}`);
  };

  // ── Stocks ────────────────────────────────────────────────────────────────
  const updateStock = async (id: string, quantity: number, note?: string) => {
    setStocks(prev => prev.map(s => s.id === id ? { ...s, quantity, note: note ?? s.note, lastUpdated: new Date() } : s));
    put(`${API.stocks}?id=${id}`, { quantity, note });
  };

  const addStockItem = async (item: Omit<StockItem, 'id' | 'lastUpdated'>) => {
    const ns: StockItem = { ...item, id: rand(), lastUpdated: new Date() };
    setStocks(prev => [...prev, ns]);
    post(API.stocks, { ...ns, lastUpdated: ns.lastUpdated.toISOString() });
  };

  const deleteStockItem = async (id: string) => {
    setStocks(prev => prev.filter(s => s.id !== id));
    del(`${API.stocks}?id=${id}`);
  };

  // ── My Debts ──────────────────────────────────────────────────────────────
  const addMyDebt = async (debt: Omit<MyDebt, 'id' | 'remainingAmount' | 'payments'>) => {
    const total = Number(debt.totalAmount) || 0;
    const nd: MyDebt = { ...debt, totalAmount: total, id: rand(), remainingAmount: total, payments: [] };
    setMyDebts(prev => [...prev, nd]);
    post(API.myDebts, {
      ...nd,
      date:    nd.date    instanceof Date ? nd.date.toISOString()    : nd.date,
      dueDate: nd.dueDate instanceof Date ? nd.dueDate.toISOString() : nd.dueDate,
    });
  };

  const updateMyDebt = async (id: string, updates: Partial<MyDebt>) => {
    let updated: MyDebt | undefined;
    setMyDebts(prev => prev.map(d => {
      if (d.id !== id) return d;
      updated = { ...d, ...updates };
      return updated;
    }));
    if (updated) {
      put(`${API.myDebts}?id=${id}`, {
        remainingAmount: updated.remainingAmount,
        note: updated.note,
        dueDate: updated.dueDate instanceof Date ? updated.dueDate.toISOString() : updated.dueDate,
        payments: (updated.payments || []).map(p => ({ ...p, date: p.date instanceof Date ? p.date.toISOString() : p.date })),
      });
    }
  };

  const deleteMyDebt = async (id: string) => {
    setMyDebts(prev => prev.filter(d => d.id !== id));
    del(`${API.myDebts}?id=${id}`);
  };

  const addMyDebtPayment = async (debtId: string, amount: number, date: Date, note?: string) => {
    const newPayment: MyDebtPayment = { id: rand(), amount, date, note };
    let updated: MyDebt | undefined;
    setMyDebts(prev => prev.map(debt => {
      if (debt.id !== debtId) return debt;
      const payments = [...debt.payments, newPayment];
      const remaining = debt.totalAmount - payments.reduce((s, p) => s + p.amount, 0);
      updated = { ...debt, payments, remainingAmount: remaining };
      return updated;
    }));
    if (updated) {
      put(`${API.myDebts}?id=${debtId}`, {
        remainingAmount: updated.remainingAmount,
        note: updated.note,
        dueDate: updated.dueDate instanceof Date ? updated.dueDate.toISOString() : updated.dueDate,
        payments: updated.payments.map(p => ({ ...p, date: p.date instanceof Date ? p.date.toISOString() : p.date })),
      });
    }
  };

  const deleteMyDebtPayment = async (debtId: string, paymentId: string) => {
    let updated: MyDebt | undefined;
    setMyDebts(prev => prev.map(debt => {
      if (debt.id !== debtId) return debt;
      const payments = debt.payments.filter(p => p.id !== paymentId);
      const remaining = debt.totalAmount - payments.reduce((s, p) => s + p.amount, 0);
      updated = { ...debt, payments, remainingAmount: remaining };
      return updated;
    }));
    if (updated) {
      put(`${API.myDebts}?id=${debtId}`, {
        remainingAmount: updated.remainingAmount,
        note: updated.note,
        dueDate: updated.dueDate instanceof Date ? updated.dueDate.toISOString() : updated.dueDate,
        payments: updated.payments.map(p => ({ ...p, date: p.date instanceof Date ? p.date.toISOString() : p.date })),
      });
    }
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
