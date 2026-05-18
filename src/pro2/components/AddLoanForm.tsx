import { 
  User, 
  Phone, 
  MapPin, 
  Banknote, 
  Calendar, 
  Tag, 
  FileText,
  Camera,
  Mic,
  ArrowLeft,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import { LoanCategory } from '../types';
import { useFirebase } from '../lib/FirebaseContext';

// Helper to convert number to Bengali words (Simple implementation)
const numberToBengaliWords = (num: number): string => {
  if (!num || num <= 0) return '';
  const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
  const tens = ['', 'দশ', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];
  
  if (num === 1000) return 'এক হাজার টাকা';
  if (num === 10000) return 'দশ হাজার টাকা';
  
  // Very basic approximation for demo
  if (num >= 1000) {
    const k = Math.floor(num / 1000);
    const r = num % 1000;
    return `${units[k] || k} হাজার ${r > 0 ? r : ''} টাকা মাত্র`.trim();
  }
  
  return `${num} টাকা মাত্র`;
};

export const AddLoanForm = ({ onBack }: { onBack: () => void, key?: string }) => {
  const { addBorrower, addLoan, borrowers } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    borrowerId: '',
    name: '',
    phone: '',
    address: '',
    amount: '',
    giveDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    category: LoanCategory.PERSONAL,
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let bId = formData.borrowerId;
      
      if (!bId) {
        const existing = borrowers.find(b => b.phone === formData.phone && formData.phone !== '');
        if (existing) {
          bId = existing.id;
        } else {
          bId = await addBorrower({
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
          });
        }
      }

      await addLoan({
        borrowerId: bId,
        amount: Number(formData.amount),
        category: formData.category,
        reason: formData.reason,
        giveDate: new Date(formData.giveDate),
        dueDate: new Date(formData.dueDate || formData.giveDate),
        notes: formData.reason
      });

      setSuccess(true);
      setTimeout(() => onBack(), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6"
        >
          <Check size={40} className="text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold font-bengali">সফলভাবে সংরক্ষিত হয়েছে!</h2>
        <p className="text-gray-400 font-bengali mt-2">আপনার ধারের হিসাবটি সফলভাবে টিউন করা হয়েছে।</p>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-8 px-5 flex flex-col gap-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 glass rounded-xl text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold font-bengali">নতুন ধার যুক্ত করুন</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-bengali">ব্যক্তির তথ্য</p>
          
          {borrowers.length > 0 && (
            <select 
              value={formData.borrowerId}
              onChange={(e) => {
                const b = borrowers.find(x => x.id === e.target.value);
                setFormData(prev => ({ 
                  ...prev, 
                  borrowerId: e.target.value,
                  name: b?.name || '',
                  phone: b?.phone || ''
                }));
              }}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm font-bengali focus:border-indigo-400 outline-none appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#1a1a1a]">নতুন গ্রাহক যুক্ত করুন</option>
              {borrowers.map(b => (
                <option key={b.id} value={b.id} className="bg-[#1a1a1a]">{b.name} {b.phone ? `(${b.phone})` : ''}</option>
              ))}
            </select>
          )}

          <AnimatePresence>
            {!formData.borrowerId && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-4 overflow-hidden"
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="text" 
                    required={!formData.borrowerId}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="ব্যক্তির নাম" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bengali focus:border-indigo-400 outline-none" 
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="মোবাইল নম্বর (ঐচ্ছিক)" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bengali focus:border-indigo-400 outline-none" 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-bengali">ধারের বিস্তারিত</p>
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="number" 
                required
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="টাকার পরিমাণ (৳)" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bengali focus:border-indigo-400 outline-none" 
              />
            </div>
            {formData.amount && (
              <p className="text-xs text-indigo-300 font-bengali ml-4 italic">
                কথায়: {numberToBengaliWords(Number(formData.amount))}
              </p>
            )}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="date" 
                  required
                  value={formData.giveDate}
                  onChange={(e) => setFormData({...formData, giveDate: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bengali focus:border-indigo-400 outline-none text-gray-300" 
                />
              </div>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value as LoanCategory})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bengali focus:border-indigo-400 outline-none appearance-none cursor-pointer"
                >
                  {Object.values(LoanCategory).map(cat => (
                    <option key={cat} value={cat} className="bg-[#1a1a1a]">{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="relative mt-2">
              <FileText className="absolute left-4 top-4 text-gray-500" size={18} />
              <textarea 
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="ধার দেওয়ার কারণ বা নোট..." 
                rows={3} 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bengali focus:border-indigo-400 outline-none resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="button" className="flex-1 glass p-4 rounded-2xl flex flex-col items-center gap-2 border-dashed border-white/20 hover:border-indigo-400/50 transition-colors">
            <Camera size={24} className="text-indigo-400" />
            <span className="text-[10px] font-bengali uppercase tracking-wider">ছবি যুক্ত করুন</span>
          </button>
          <button type="button" className="flex-1 glass p-4 rounded-2xl flex flex-col items-center gap-2 border-dashed border-white/20 hover:border-indigo-400/50 transition-colors">
            <Mic size={24} className="text-indigo-400" />
            <span className="text-[10px] font-bengali uppercase tracking-wider">ভয়েস নোট</span>
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full accent-gradient text-white font-bold py-5 rounded-2xl font-bengali shadow-lg shadow-indigo-500/20 disabled:opacity-50"
        >
          {loading ? 'সংরক্ষণ করা হচ্ছে...' : 'ধারের হিসাব সংরক্ষণ করুন'}
        </motion.button>
      </form>
    </div>
  );
};
