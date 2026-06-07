import { 
  Plus, 
  Trash2, 
  ChevronLeft,
  Calendar,
  Building2,
  User,
  ArrowDownRight,
  ArrowUpRight,
  StickyNote,
  PlusCircle,
  X,
  History,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import { useFirebase } from '../lib/FirebaseContext';
import { MyDebt } from '../types';

export const MyDebtsView = ({ initialMode = 'debts', onBack }: { initialMode?: 'debts' | 'payments', onBack: () => void }) => {
  const { myDebts, addMyDebt, addMyDebtPayment, deleteMyDebtPayment, deleteMyDebt } = useFirebase();
  const [activeTab, setActiveTab] = useState<'debts' | 'payments'>(initialMode);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showQuickPay, setShowQuickPay] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const selectedDebt = myDebts.find(d => d.id === selectedDebtId);

  const totalRemaining = myDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalBorrowed = myDebts.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);

  const allPayments = myDebts.flatMap(d => d.payments.map(p => ({ ...p, lenderName: d.lenderName, debtId: d.id })))
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDeleteDebt = async () => {
    if (deleteConfirmId) {
      await deleteMyDebt(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  if (selectedDebt) {
    return <DebtDetailPage debt={selectedDebt} onBack={() => setSelectedDebtId(null)} />;
  }

  return (
    <div className="pb-32 pt-8 px-5 flex flex-col gap-6 max-w-2xl mx-auto h-full">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2.5 glass-premium rounded-xl text-gray-400"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-bengali">ব্যক্তিগত হিসাব</h1>
          <p className="text-gray-400 text-sm font-bengali">আপনার লেনদেনের রেকর্ড</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex glass p-1 rounded-2xl">
        <button 
          onClick={() => setActiveTab('debts')}
          className={`flex-1 py-3 rounded-xl font-bold font-bengali transition-all ${activeTab === 'debts' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400'}`}
        >
          ঋণ তালিকা
        </button>
        <button 
          onClick={() => setActiveTab('payments')}
          className={`flex-1 py-3 rounded-xl font-bold font-bengali transition-all ${activeTab === 'payments' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400'}`}
        >
          পরিশোধ ইতিহাস
        </button>
      </div>

      {/* Summary Stats */}
      <div className="glass-premium p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-indigo-500/5 to-rose-500/5">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-400 font-bold font-bengali text-sm">হিসাব পরিচিতি</h3>
            <div className="flex gap-2">
              <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-bold">বাকি</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold">পরিশোধ</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 hidden sm:block"></div>
            
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-gray-500 font-bold uppercase font-bengali tracking-wider">মোট গৃহীত ঋণ</p>
              <p className="text-2xl font-bold text-white">৳{totalBorrowed.toLocaleString()}</p>
            </div>
            
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-gray-500 font-bold uppercase font-bengali tracking-wider">বর্তমানে মোট বাকি</p>
              <p className="text-2xl font-bold text-red-400">৳{totalRemaining.toLocaleString()}</p>
            </div>
          </div>

          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${totalBorrowed > 0 ? ((totalBorrowed - totalRemaining) / totalBorrowed) * 100 : 0}%` }}
               className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500"
             />
          </div>
          <p className="text-[10px] text-center text-gray-500 font-bengali">
            আপনি মোট ঋণের <span className="text-emerald-400">{totalBorrowed > 0 ? Math.round(((totalBorrowed - totalRemaining) / totalBorrowed) * 100) : 0}%</span> পরিশোধ করেছেন
          </p>
        </div>
      </div>

      {activeTab === 'debts' ? (
        <>
          <button 
            onClick={() => setShowAddDebt(true)}
            className="glass-premium p-4 rounded-2xl flex items-center justify-center gap-2 text-indigo-400 border border-indigo-400/20 active:scale-95 transition-all"
          >
            <PlusCircle size={20} />
            <span className="font-bold font-bengali">নতুন ঋণ যুক্ত করুন</span>
          </button>

          <div className="flex flex-col gap-4">
            {myDebts.map((debt, i) => (
              <motion.div
                key={debt.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedDebtId(debt.id)}
                className="glass-premium p-5 rounded-3xl flex justify-between items-center border border-white/5 cursor-pointer hover:border-indigo-400/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400">
                    {debt.lenderName.toLowerCase().includes('bank') ? <Building2 size={24} /> : <User size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg font-bengali">{debt.lenderName}</h3>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1 uppercase tracking-widest font-bold">
                       {new Date(debt.date).toLocaleDateString('bn-BD')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-red-400 leading-tight">
                      ৳{debt.remainingAmount.toLocaleString()}
                    </p>
                    {debt.remainingAmount === 0 ? (
                      <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full uppercase font-bold">পরিশোধিত</span>
                    ) : (
                      <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full uppercase font-bold">বাকি</span>
                    )}
                  </div>
                  {debt.remainingAmount > 0 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDebtId(debt.id);
                      }}
                      className="p-3 bg-indigo-500/20 text-indigo-400 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all shadow-lg active:scale-90"
                    >
                      <Plus size={18} />
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(debt.id);
                    }}
                    className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}

            {myDebts.length === 0 && (
              <div className="text-center py-10 glass rounded-3xl border-dashed border-white/10">
                <p className="text-gray-500 font-bengali">কোনো ঋণের তথ্য নেই</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <button 
            onClick={() => setShowQuickPay(true)}
            className="glass-premium p-4 rounded-2xl flex items-center justify-center gap-2 text-emerald-400 border border-emerald-400/20 active:scale-95 transition-all shadow-lg bg-emerald-500/5"
          >
            <History size={20} />
            <span className="font-bold font-bengali">নতুন পরিশোধ যুক্ত করুন</span>
          </button>

          <div className="flex flex-col gap-3">
            {allPayments.length > 0 ? (
              allPayments.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 glass rounded-2xl flex justify-between items-center group border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                      <ArrowUpRight size={16} />
                    </div>
                    <div>
                      <h4 className="font-bold font-bengali text-sm">{p.lenderName}</h4>
                      <p className="text-[10px] text-gray-500 font-bengali">{p.note || 'পরিশোধ'}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div className="mr-2">
                       <p className="font-bold text-emerald-400 text-sm">+৳{p.amount.toLocaleString()}</p>
                       <p className="text-[8px] text-indigo-300 font-medium uppercase">{new Date(p.date).toLocaleDateString('bn-BD')}</p>
                    </div>
                    <button onClick={() => deleteMyDebtPayment(p.debtId, p.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500/50 hover:text-red-500 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-10 glass rounded-3xl border-dashed border-white/10">
                <p className="text-gray-500 font-bengali">কোনো পরিশোধের ইতিহাস নেই</p>
              </div>
            )}
          </div>
        </>
      )}

      <AnimatePresence>
        {showAddDebt && (
          <AddDebtModal onClose={() => setShowAddDebt(false)} onAdd={addMyDebt} />
        )}
        {showQuickPay && (
          <QuickPayModal 
             onClose={() => setShowQuickPay(false)} 
             debts={myDebts.filter(d => d.remainingAmount > 0)}
             onAdd={addMyDebtPayment} 
          />
        )}
        {deleteConfirmId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-premium w-full max-w-sm p-8 rounded-3xl flex flex-col gap-6 border border-white/10 text-center"
            >
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold font-bengali mb-2">আপনি কি নিশ্চিত?</h3>
                <p className="text-gray-400 font-bengali text-sm">এই ঋণের তথ্যটি চিরতরে মুছে যাবে।</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-4 glass rounded-2xl font-bold font-bengali transition-all active:scale-95"
                >
                  না, থাক
                </button>
                <button 
                  onClick={handleDeleteDebt}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold font-bengali transition-all active:scale-95 shadow-lg shadow-red-500/20"
                >
                  হ্যাঁ, ডিলিট
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const QuickPayModal = ({ onClose, debts, onAdd }: { onClose: () => void, debts: any[], onAdd: any }) => {
  const [debtId, setDebtId] = useState(debts[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtId || !amount) return;
    setSaving(true);
    try {
      await onAdd(debtId, parseFloat(amount), new Date(date), note);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6 backdrop-blur-md"
    >
      <motion.form 
        onSubmit={handleSubmit}
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="glass-premium w-full max-w-md p-6 rounded-3xl flex flex-col gap-4 border border-white/10"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-bengali text-emerald-400">নতুন পরিশোধ যুক্ত করুন</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold px-1 font-bengali">ঋণদাতা নির্বাচন করুন</label>
            <select 
              required value={debtId} onChange={e => setDebtId(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-400 font-bengali appearance-none"
            >
              <option value="" disabled className="bg-gray-900">কাকে পরিশোধ করছেন?</option>
              {debts.map(d => (
                <option key={d.id} value={d.id} className="bg-gray-900">
                  {d.lenderName} (বাকি: ৳{d.remainingAmount})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold px-1 font-bengali">পরিশোধের পরিমাণ</label>
            <input 
              required type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-400"
              placeholder="৳০.০০"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold px-1 font-bengali">পরিশোধের তারিখ</label>
            <input 
              type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-400 text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold px-1 font-bengali">নোট</label>
            <input 
              value={note} onChange={e => setNote(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-emerald-400 font-bengali"
              placeholder="কিস্তি বা পূর্ণ পরিশোধ..."
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-emerald-500 rounded-2xl font-bold font-bengali text-white mt-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-60"
        >
          {saving ? 'সংরক্ষণ হচ্ছে...' : 'পরিশোধ নিশ্চিত করুন'}
        </button>
      </motion.form>
    </motion.div>
  );
};

const AddDebtModal = ({ onClose, onAdd }: { onClose: () => void, onAdd: any }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    setSaving(true);
    try {
      await onAdd({
        lenderName: name,
        totalAmount: parseFloat(amount),
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        note
      });
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6 backdrop-blur-sm"
    >
      <motion.form 
        onSubmit={handleSubmit}
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="glass-premium w-full max-w-md p-6 rounded-3xl flex flex-col gap-4 border border-white/10"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold font-bengali">নতুন ঋণ যুক্ত করুন</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold px-1 font-bengali">ঋণদাতার নাম</label>
            <input 
              required value={name} onChange={e => setName(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-indigo-400 font-bengali"
              placeholder="ব্যাংক বা ব্যক্তির নাম"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold px-1 font-bengali">ঋণের পরিমাণ</label>
            <input 
              required type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-indigo-400"
              placeholder="৳০.০০"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold px-1 font-bengali">ঋণের তারিখ</label>
            <input 
              type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-indigo-400 text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold px-1 font-bengali">সম্ভাব্য পরিশোধের তারিখ (ঐচ্ছিক)</label>
            <input 
              type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-indigo-400 text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold px-1 font-bengali">অতিরিক্ত তথ্য (ঐচ্ছিক)</label>
            <textarea 
              value={note} onChange={e => setNote(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-indigo-400 font-bengali text-sm min-h-[100px]"
              placeholder="বিস্তারিত লিখুন..."
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-indigo-500 rounded-2xl font-bold font-bengali text-white mt-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-60"
        >
          {saving ? 'সংরক্ষণ হচ্ছে...' : 'তথ্য জমা দিন'}
        </button>
      </motion.form>
    </motion.div>
  );
};

const DebtDetailPage = ({ debt, onBack }: { debt: MyDebt, onBack: () => void }) => {
  const { addMyDebtPayment, deleteMyDebtPayment, deleteMyDebt } = useFirebase();
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNote, setPayNote] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [deletingDebt, setDeletingDebt] = useState(false);

  const handleAddPayment = async () => {
    if (!payAmount) return;
    setSavingPayment(true);
    try {
      await addMyDebtPayment(debt.id, parseFloat(payAmount), new Date(payDate), payNote);
      setShowAddPayment(false);
      setPayAmount('');
      setPayNote('');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeleteDebt = async () => {
    setDeletingDebt(true);
    try {
      await deleteMyDebt(debt.id);
      onBack();
    } finally {
      setDeletingDebt(false);
    }
  };

  return (
    <div className="pb-32 pt-8 px-5 flex flex-col gap-8 max-w-2xl mx-auto h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 glass rounded-xl text-gray-400"><ChevronLeft size={20} /></button>
          <h2 className="text-xl font-bold font-bengali">{debt.lenderName}</h2>
        </div>
        <button onClick={() => setShowDeleteConfirm(true)} className="p-3 bg-red-500/10 text-red-500 rounded-2xl active:scale-95 transition-all">
          <Trash2 size={20} />
        </button>
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-premium w-full max-w-sm p-8 rounded-3xl flex flex-col gap-6 border border-white/10 text-center"
            >
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold font-bengali mb-2">আপনি কি নিশ্চিত?</h3>
                <p className="text-gray-400 font-bengali text-sm">এই ঋণের সকল তথ্য চিরতরে মুছে যাবে।</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 glass rounded-2xl font-bold font-bengali transition-all active:scale-95"
                >
                  না, থাক
                </button>
                <button
                  onClick={handleDeleteDebt}
                  disabled={deletingDebt}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold font-bengali transition-all active:scale-95 shadow-lg shadow-red-500/20 disabled:opacity-60"
                >
                  {deletingDebt ? 'মুছছে...' : 'হ্যাঁ, ডিলিট'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="glass-premium p-8 rounded-3xl flex flex-col items-center text-center gap-4 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <History size={100} />
        </div>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest font-bengali">বর্তমানে বাকি ঋণের পরিমাণ</p>
        <h1 className="text-5xl font-bold tracking-tight text-red-400">৳{debt.remainingAmount.toLocaleString()}</h1>
        <div className="flex gap-4 mt-2">
           <div className="text-center">
             <p className="text-[10px] text-gray-500 uppercase font-bold font-bengali">মোট ঋণ</p>
             <p className="text-sm font-bold opacity-80">৳{debt.totalAmount.toLocaleString()}</p>
           </div>
           <div className="w-px h-8 bg-white/10 self-center"></div>
           <div className="text-center">
             <p className="text-[10px] text-gray-500 uppercase font-bold font-bengali">মোট শোধ</p>
             <p className="text-sm font-bold text-emerald-400">৳{(debt.totalAmount - debt.remainingAmount).toLocaleString()}</p>
           </div>
        </div>
        
        <div className="w-full flex flex-col gap-2 mt-4 pt-4 border-t border-white/5">
          <div className="flex justify-between text-[10px] uppercase font-bold font-bengali text-gray-500">
            <span>ঋণ গ্রহণ: {new Date(debt.date).toLocaleDateString('bn-BD')}</span>
            <span>{Math.floor((new Date().getTime() - new Date(debt.date).getTime()) / (1000 * 3600 * 24))} দিন হয়েছে</span>
          </div>
          {debt.dueDate && (
            <div className={`flex justify-between text-[10px] uppercase font-bold font-bengali ${new Date(debt.dueDate) < new Date() ? 'text-rose-400' : 'text-indigo-400'}`}>
              <span>পরিশোধের লক্ষ্য: {new Date(debt.dueDate).toLocaleDateString('bn-BD')}</span>
              <span>{new Date(debt.dueDate) < new Date() ? 'সময় পার হয়েছে' : `${Math.ceil((new Date(debt.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} দিন বাকি`}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold font-bengali flex items-center gap-2">
            <History size={20} className="text-indigo-400" />
            পরিশোধ ইতিহাস
          </h3>
          <button 
            onClick={() => setShowAddPayment(true)}
            className="flex items-center gap-1.5 p-2 px-4 glass rounded-xl text-xs font-bold text-indigo-400 hover:bg-white/5 transition-all"
          >
            <Plus size={14} /> পরিশোধ যোগ করুন
          </button>
        </div>

        <AnimatePresence>
          {showAddPayment && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="glass p-5 rounded-3xl flex flex-col gap-4 overflow-hidden border-indigo-500/20"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold font-bengali">পরিশোধের পরিমাণ</label>
                  <input 
                    type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} 
                    className="bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-indigo-400" 
                    placeholder="৳০.০০" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold font-bengali">তারিখ</label>
                  <input 
                    type="date" value={payDate} onChange={e => setPayDate(e.target.value)} 
                    className="bg-white/5 border border-white/10 rounded-xl p-3 outline-none text-xs" 
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-500 uppercase font-bold font-bengali">নোট</label>
                <input 
                   value={payNote} onChange={e => setPayNote(e.target.value)} 
                   className="bg-white/5 border border-white/10 rounded-xl p-3 outline-none font-bengali text-sm" 
                   placeholder="কিস্তি বা পূর্ণ পরিশোধ..." 
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddPayment(false)} className="flex-1 py-3 glass rounded-xl font-bold font-bengali text-sm">বাতিল</button>
                <button onClick={handleAddPayment} disabled={savingPayment} className="flex-1 py-3 bg-indigo-500 rounded-xl font-bold font-bengali text-sm disabled:opacity-60">
                  {savingPayment ? 'সংরক্ষণ...' : 'যোগ করুন'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-3">
          {debt.payments.length > 0 ? (
            debt.payments.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 glass rounded-2xl flex justify-between items-center group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <ArrowUpRight size={16} />
                  </div>
                  <div>
                    <p className="font-bold font-bengali text-sm text-emerald-400">+৳{p.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 font-bengali">{p.note || 'পরিশোধিত'}</p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <p className="text-[10px] text-indigo-300 font-medium">{new Date(p.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}</p>
                  <button onClick={() => deleteMyDebtPayment(debt.id, p.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500/50 hover:text-red-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 glass rounded-2xl border-dashed border-white/5 opacity-50">
              <p className="text-xs font-bengali">এখনও কোনো পরিশোধ করা হয়নি</p>
            </div>
          )}
        </div>
      </div>

      {debt.note && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-bold font-bengali text-gray-400 flex items-center gap-2">
            <StickyNote size={14} /> ঋণের বিস্তারিত
          </h3>
          <div className="glass p-5 rounded-3xl border border-white/5">
            <p className="text-sm font-bengali text-gray-300 leading-relaxed italic">"{debt.note}"</p>
          </div>
        </div>
      )}
    </div>
  );
};
