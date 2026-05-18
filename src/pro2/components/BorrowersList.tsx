import { Search, Filter, Phone, MessageSquare, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import { useFirebase } from '../lib/FirebaseContext';

const StatusBadge = ({ status }: { status: string }) => {
  const colors: any = {
    'Overdue': 'bg-red-500/10 text-red-500 border-red-500/20',
    'Pending': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'Paid': 'bg-green-500/10 text-green-500 border-green-500/20',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${colors[status] || 'bg-gray-500/10 text-gray-400 border-white/10'}`}>
      {status}
    </span>
  );
};

export const BorrowersList = ({ onSelectBorrower }: { onSelectBorrower: (id: string) => void, key?: string }) => {
  const { borrowers, loans, deleteBorrower } = useFirebase();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredBorrowers = borrowers.filter(b => 
    (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.phone && b.phone.includes(searchTerm))
  );

  const handleDelete = async () => {
    if (deleteId) {
      try {
        await deleteBorrower(deleteId);
        setDeleteId(null);
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="pb-32 pt-8 px-5 flex flex-col gap-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-bengali">গ্রাহক তালিকা</h1>
        <div className="p-2 glass rounded-xl">
          <Filter size={20} className="text-gray-400" />
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..." 
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bengali focus:outline-none focus:border-indigo-400 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {filteredBorrowers.map((borrower, i) => {
            const borrowerLoans = loans.filter(l => l.borrowerId === borrower.id);
            const totalDue = borrowerLoans.reduce((acc, l) => acc + (Number(l.remainingAmount) || 0), 0);
            
            // Calculate debt age (days since oldest active loan)
            const activeLoans = borrowerLoans.filter(l => l.remainingAmount > 0);
            const oldestLoan = activeLoans.length > 0 
              ? activeLoans.reduce((oldest, current) => 
                  new Date(current.giveDate).getTime() < new Date(oldest.giveDate).getTime() ? current : oldest
                ) 
              : null;
            
            const debtAge = oldestLoan 
              ? Math.floor((new Date().getTime() - new Date(oldestLoan.giveDate).getTime()) / (1000 * 3600 * 24))
              : 0;

            return (
              <motion.div
                key={borrower.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onSelectBorrower(borrower.id)}
                className="glass-premium p-4 rounded-2xl flex items-center gap-4 hover:border-indigo-400/30 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-lg font-bold text-indigo-400 shadow-inner">
                  {borrower.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold font-bengali text-lg">{borrower.name}</h3>
                    <div className="flex gap-2 items-center">
                      <StatusBadge status={totalDue > 0 ? 'Pending' : 'Paid'} />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteId(borrower.id); }}
                        className="p-2 text-gray-500 hover:text-red-500 transition-all active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-gray-400 font-bengali">{borrower.phone || 'মোবাইল নেই'}</p>
                    {debtAge > 0 && (
                      <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                        <Clock size={10} /> {debtAge} দিন
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <div>
                      <p className="text-[10px] text-gray-500 font-bengali uppercase tracking-wider">মোট বাকি টাকা</p>
                      <p className="font-bold text-indigo-400 text-lg">৳{totalDue.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${borrower.phone}`} onClick={e => e.stopPropagation()} className="p-2.5 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500/20 transition-all"><Phone size={18} /></a>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filteredBorrowers.length === 0 && (
          <div className="py-20 text-center opacity-40">
            <Search size={40} className="mx-auto mb-4" />
            <p className="font-bengali">কোনো গ্রাহক পাওয়া যায়নি</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {deleteId && (
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
                <p className="text-gray-400 font-bengali text-sm">এই গ্রাহকের সকল তথ্য চিরতরে মুছে যাবে।</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-4 glass rounded-2xl font-bold font-bengali transition-all active:scale-95"
                >
                  না, থাক
                </button>
                <button 
                  onClick={handleDelete}
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
