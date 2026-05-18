import { 
  ArrowLeft, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Banknote, 
  History,
  TrendingDown,
  CheckCircle2,
  Clock,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState, useMemo } from 'react';
import { useFirebase } from '../lib/FirebaseContext';
import { Borrower, LoanCategory } from '../types';

export const BorrowerDetail = ({ borrowerId, onBack }: { borrowerId: string, onBack: () => void }) => {
  const { borrowers, loans, addPayment, deleteBorrower, deleteLoan } = useFirebase();
  const [isPaying, setIsPaying] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loanToDeleteId, setLoanToDeleteId] = useState<string | null>(null);

  const borrower = useMemo(() => borrowers.find(b => b.id === borrowerId), [borrowers, borrowerId]);
  const borrowerLoans = useMemo(() => loans.filter(l => l.borrowerId === borrowerId), [loans, borrowerId]);
  
  const totalLent = borrowerLoans.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
  const totalDue = borrowerLoans.reduce((acc, l) => acc + (Number(l.remainingAmount) || 0), 0);
  const totalPaid = totalLent - totalDue;

  const handleDeleteBorrower = async () => {
    await deleteBorrower(borrowerId);
    onBack();
  };

  const handleDeleteLoan = async () => {
    if (loanToDeleteId) {
      await deleteLoan(loanToDeleteId);
      setLoanToDeleteId(null);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const loanToPay = borrowerLoans.find(l => l.remainingAmount > 0);
    if (loanToPay && Number(paymentAmount) > 0) {
      await addPayment(loanToPay.id, Number(paymentAmount), new Date(), paymentNote);
      setIsPaying(false);
      setPaymentAmount('');
      setPaymentNote('');
    }
  };

  if (!borrower) return null;

  return (
    <div className="pb-32 pt-8 px-5 flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 glass rounded-xl text-gray-400">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold font-bengali">গ্রাহক রিপোর্ট</h1>
        </div>
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="p-3 bg-red-500/10 text-red-500 rounded-2xl active:scale-95 transition-all"
        >
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
                <p className="text-gray-400 font-bengali text-sm">এই গ্রাহকের সকল লোন এবং পরিশোধের ইতিহাস চিরতরে মুছে যাবে।</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 glass rounded-2xl font-bold font-bengali transition-all active:scale-95"
                >
                  না, থাক
                </button>
                <button 
                  onClick={handleDeleteBorrower}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold font-bengali transition-all active:scale-95 shadow-lg shadow-red-500/20"
                >
                  হ্যাঁ, ডিলিট
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {loanToDeleteId && (
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
                <h3 className="text-xl font-bold font-bengali mb-2">লোন মুছে ফেলুন?</h3>
                <p className="text-gray-400 font-bengali text-sm">এই লোনের সকল রেকর্ড এবং পরিশোধের ইতিহাস চিরতরে মুছে যাবে।</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setLoanToDeleteId(null)}
                  className="flex-1 py-4 glass rounded-2xl font-bold font-bengali transition-all active:scale-95"
                >
                  না, থাক
                </button>
                <button 
                  onClick={handleDeleteLoan}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold font-bengali transition-all active:scale-95 shadow-lg shadow-red-500/20"
                >
                  হ্যাঁ, ডিলিট
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Card */}
      <div className="glass-premium p-6 rounded-3xl flex flex-col gap-5 items-center text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl">
          {borrower.name[0]}
        </div>
        <div>
          <h2 className="text-2xl font-bold font-bengali">{borrower.name}</h2>
          <p className="text-gray-400 text-sm">{borrower.phone || 'মোবাইল নেই'}</p>
        </div>
        <div className="flex gap-4">
          <a href={`tel:${borrower.phone}`} className="p-3 glass rounded-2xl text-green-400 hover:scale-110 transition-transform">
            <Phone size={24} />
          </a>
          <a href={`https://wa.me/${borrower.phone}`} className="p-3 glass rounded-2xl text-indigo-400 hover:scale-110 transition-transform">
            <MessageSquare size={24} />
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-4 rounded-2xl border-l-4 border-indigo-400">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest font-bengali mb-1">মোট ঋণ</p>
          <p className="text-xl font-bold">৳{totalLent.toLocaleString()}</p>
        </div>
        <div className="glass p-4 rounded-2xl border-l-4 border-orange-400">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest font-bengali mb-1">মোট বাকি</p>
          <p className="text-xl font-bold text-orange-400">৳{totalDue.toLocaleString()}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <button 
        onClick={() => setIsPaying(true)}
        className="w-full accent-gradient p-4 rounded-2xl font-bold font-bengali flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
      >
        <TrendingDown size={20} />
        টাকা আদায় যুক্ত করুন
      </button>

      {/* Loan History */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold font-bengali flex items-center gap-2">
          <History size={20} className="text-indigo-400" />
          ঋণের ইতিহাস
        </h3>
        <div className="flex flex-col gap-3">
          {borrowerLoans.map(loan => (
            <div key={loan.id} className="glass p-4 rounded-2xl">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase">{loan.category}</span>
                  <p className="text-xs text-gray-500 mt-1 font-bengali italic">{loan.reason || 'কোনো নোট নেই'}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2 text-right">
                  <div className="flex flex-col items-end">
                    <p className="font-bold">৳{loan.amount.toLocaleString()}</p>
                    <p className={`text-[10px] font-bold ${loan.status === 'Paid' ? 'text-green-400' : 'text-orange-400'}`}>{loan.status}</p>
                  </div>
                  <button onClick={() => setLoanToDeleteId(loan.id)} className="p-1.5 text-gray-500 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-end border-t border-white/5 pt-3">
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <Calendar size={12} />
                  {new Date(loan.giveDate).toLocaleDateString('bn-BD')}
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">বাকি: ৳{loan.remainingAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* Payments Timeline */}
              {loan.payments && loan.payments.length > 0 && (
                <div className="mt-4 border-l border-white/10 pl-4 flex flex-col gap-3">
                  {loan.payments.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <span className="text-xs font-bengali">পরিশোধিত</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">+৳{p.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-indigo-300 font-medium mt-0.5">{new Date(p.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaying && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-premium w-full max-w-sm p-8 rounded-3xl"
            >
              <h2 className="text-xl font-bold font-bengali mb-6">টাকা আদায় এন্ট্রি</h2>
              <form onSubmit={handlePayment} className="flex flex-col gap-5">
                <div className="relative">
                  <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="number" 
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="পরিমাণ (৳)" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-indigo-400 outline-none"
                  />
                </div>
                <input 
                  type="text" 
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="নোট (ঐচ্ছিক)" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm font-bengali focus:border-indigo-400 outline-none"
                />
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsPaying(false)}
                    className="flex-1 p-4 glass rounded-2xl font-bold font-bengali text-gray-400"
                  >
                    বাতিল
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 accent-gradient p-4 rounded-2xl font-bold font-bengali shadow-lg shadow-indigo-500/20"
                  >
                    নিশ্চিত করুন
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
