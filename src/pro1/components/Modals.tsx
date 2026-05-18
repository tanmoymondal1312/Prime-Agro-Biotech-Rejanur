/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Save, Camera, Image as ImageIcon } from 'lucide-react';
import { CategoryType, CATEGORY_LABELS, Expense, CropProfile, HarvestInfo } from '../types';

interface AddProfileModalProps {
  onClose: () => void;
  onSave: (name: string, date: string, landSize: string, expectedSale: number, type: 'cultivation' | 'stock') => void;
  editData?: CropProfile;
  defaultType?: 'cultivation' | 'stock';
}

export function AddProfileModal({ onClose, onSave, editData, defaultType }: AddProfileModalProps) {
  const [name, setName] = useState(editData?.name || '');
  const [date, setDate] = useState(editData?.startDate || new Date().toISOString().split('T')[0]);
  const [landSize, setLandSize] = useState(editData?.landSize || '');
  const [expectedSale, setExpectedSale] = useState(editData?.expectedSale?.toString() || '');
  const [type, setType] = useState<'cultivation' | 'stock'>(editData?.type || defaultType || 'cultivation');

  return (
    <div className="fixed inset-0 bg-primary/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-text-main">
              {editData ? 'প্রোফাইল সম্পাদন করুন' : 'নতুন ফসল প্রোফাইল'}
            </h2>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1">
              {editData ? 'Edit Profile' : 'Create New Profile'}
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-bg-page rounded-2xl transition-colors text-text-main/40 hover:text-primary">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">প্রোফাইলের ধরণ (Profile Type)</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setType('cultivation')}
                className={`py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${type === 'cultivation' ? 'bg-primary text-white border-primary shadow-lg' : 'bg-bg-page text-primary/40 border-transparent'}`}
              >
                নিজস্ব আবাদ
              </button>
              <button 
                onClick={() => setType('stock')}
                className={`py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${type === 'stock' ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg' : 'bg-bg-page text-primary/40 border-transparent'}`}
              >
                বাইরে থেকে কেনা
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">ফসলের নাম (Crop Name)</label>
            <input 
              type="text" 
              value={name || ''}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-page border-2 border-transparent rounded-[1.5rem] p-4 text-text-main font-bold placeholder:text-text-main/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
              placeholder="যেমন: ধান, আলু, ভুট্টা..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">শুরুর তারিখ (Start Date)</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg-page border-2 border-transparent rounded-[1.5rem] p-4 text-text-main font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">জমির পরিমাণ</label>
              <input 
                type="text" 
                value={landSize || ''}
                onChange={(e) => setLandSize(e.target.value)}
                className="w-full bg-bg-page border-2 border-transparent rounded-[1.5rem] p-4 text-text-main font-bold placeholder:text-text-main/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                placeholder="২ বিঘা"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">সম্ভাব্য বিক্রয় (Expected)</label>
              <input 
                type="number" 
                value={expectedSale || ''}
                onChange={(e) => setExpectedSale(e.target.value)}
                className="w-full bg-bg-page border-2 border-transparent rounded-[1.5rem] p-4 text-text-main font-bold placeholder:text-text-main/20 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                placeholder="৳ ২০,০০০"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={() => onSave(name, date, landSize, Number(expectedSale) || 0, type)}
          disabled={!name}
          className="w-full py-4 agri-gradient text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-30"
        >
          <Save className="w-5 h-5" /> {editData ? 'আপডেট করুন (Update)' : 'প্রোফাইল খুলুন (Open Profile)'}
        </button>
      </motion.div>
    </div>
  );
}

interface HarvestModalProps {
  onClose: () => void;
  onSave: (harvest: HarvestInfo) => void;
  initialData?: HarvestInfo;
}

export function HarvestModal({ onClose, onSave, initialData }: HarvestModalProps) {
  const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || '');
  const [unit, setUnit] = useState(initialData?.unit || 'বস্তা');
  const [totalPrice, setTotalPrice] = useState(
    initialData ? (initialData.quantity * initialData.pricePerUnit).toString() : ''
  );
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);

  const qty = Number(quantity) || 0;
  const total = Number(totalPrice) || 0;
  const calculatedPricePerUnit = qty > 0 ? (total / qty).toFixed(2) : '0';

  return (
    <div className="fixed inset-0 bg-primary/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-text-main">ফসল বিক্রি / হার্ভেস্ট</h2>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1">Harvest & Record Sale</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-bg-page rounded-2xl transition-colors text-text-main/40 hover:text-primary">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">পরিমাণ (Quantity)</label>
              <input 
                type="number" 
                value={quantity || ''}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-bg-page border-2 border-transparent rounded-[1.5rem] p-4 text-text-main font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                placeholder=" যেমন: ১০০"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">একক (Unit)</label>
              <select 
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-bg-page border-2 border-transparent rounded-[1.5rem] p-4 text-text-main font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
              >
                <option value="বস্তা">বস্তা</option>
                <option value="কেজি">কেজি</option>
                <option value="মন">মন</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">মোট বিক্রয় মূল্য (Total Sale Price)</label>
            <input 
              type="number" 
              value={totalPrice || ''}
              onChange={(e) => setTotalPrice(e.target.value)}
              className="w-full bg-bg-page border-2 border-transparent rounded-[1.5rem] p-4 text-2xl font-black text-emerald-600 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
              placeholder="৳ ১,২০,০০০"
            />
            {qty > 0 && total > 0 && (
              <p className="text-[10px] font-bold text-emerald-600/60 px-2 mt-1">
                হিসাব অনুযায়ী: প্রতি {unit} {calculatedPricePerUnit} ৳
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">বিক্রয়ের তারিখ (Sale Date)</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-bg-page border-2 border-transparent rounded-[1.5rem] p-4 text-text-main font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        <button 
          onClick={() => onSave({
            quantity: Number(quantity) || 0,
            unit,
            pricePerUnit: Number(calculatedPricePerUnit) || 0,
            date
          })}
          disabled={!quantity || !totalPrice}
          className="w-full py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-30"
        >
          <Save className="w-5 h-5" /> রেকর্ড সেভ করুন
        </button>
      </motion.div>
    </div>
  );
}

interface AddExpenseModalProps {
  category: CategoryType;
  onClose: () => void;
  onSave: (data: { category: string, amount: number, advance: number, due: number, date: string, note: string, image: string }) => void;
  editData?: Expense;
}

export function AddExpenseModal({ category, onClose, onSave, editData }: AddExpenseModalProps) {
  const initialCategory = editData?.category || category;
  const isCustom = initialCategory && !CATEGORY_LABELS[initialCategory];

  const [selectedCategory, setSelectedCategory] = useState<string>(isCustom ? 'custom' : initialCategory);
  const [customCategory, setCustomCategory] = useState<string>(isCustom ? initialCategory : '');
  const [amount, setAmount] = useState(editData?.amount?.toString() || '');
  const [advance, setAdvance] = useState(editData?.advance?.toString() || '');
  const [due, setDue] = useState(editData?.due?.toString() || '');
  const [date, setDate] = useState(editData?.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(editData?.note || '');
  const [image, setImage] = useState(editData?.image || '');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('Image is too large. Please select an image smaller than 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateDue = (total: string, paid: string) => {
    const t = Number(total) || 0;
    const p = Number(paid) || 0;
    setDue((t - p).toString());
  };

  return (
    <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Sticky Header */}
        <div className="p-6 border-b border-border-subtle flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black text-primary">
              {editData ? 'তথ্য হালনাগাদ (Edit)' : 'নতুন খরচ যোগ (Add)'}
            </h2>
            <p className="text-[10px] text-text-main/40 font-black uppercase tracking-widest mt-1">
               {CATEGORY_LABELS[selectedCategory] || selectedCategory}
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-bg-page hover:bg-red-50 hover:text-red-500 rounded-xl transition-all shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">খরচ ক্যাটাগরি</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-bg-page border-2 border-transparent rounded-[1.25rem] p-3.5 text-text-main font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
                <option value="custom">অন্যান্য / নতুন খাত</option>
              </select>
            </div>

            {selectedCategory === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">নতুন খাতের নাম</label>
                <input 
                  type="text" 
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-bg-page border-2 border-transparent rounded-[1.25rem] p-3.5 text-text-main font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                  placeholder="খাত লিখুন..."
                  autoFocus
                />
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">খরচের তারিখ</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-bg-page border-2 border-transparent rounded-[1.25rem] p-3.5 text-text-main font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
              />
            </div>
          </div>

          <div className="bg-bg-page/50 p-6 rounded-[1.75rem] border border-border-subtle space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">মোট পরিমাণ (Total Amount)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={amount || ''}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    updateDue(e.target.value, advance);
                  }}
                  className="w-full bg-white border-2 border-transparent rounded-[1.25rem] p-4 text-3xl font-black text-primary focus:border-primary transition-all shadow-sm outline-none pr-12"
                  placeholder="0.00"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/20 text-xl font-black">৳</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">পেইড / এডভান্স</label>
                <input 
                  type="number" 
                  value={advance || ''}
                  onChange={(e) => {
                    setAdvance(e.target.value);
                    updateDue(amount, e.target.value);
                  }}
                  className="w-full bg-white border-2 border-transparent rounded-[1.25rem] p-4 text-xl font-bold text-emerald-600 focus:border-emerald-500 shadow-sm outline-none"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block text-red-500/60">বাকি (Due)</label>
                <input 
                  type="number" 
                  value={due || ''}
                  onChange={(e) => setDue(e.target.value)}
                  className="w-full bg-white border-2 border-transparent rounded-[1.25rem] p-4 text-xl font-bold text-red-500 focus:border-red-500 shadow-sm outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-text-main/40 px-1 uppercase tracking-widest block">মন্তব্য (Notes)</label>
              <textarea 
                value={note || ''}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-bg-page border-2 border-transparent rounded-[1.25rem] p-4 text-text-main font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none min-h-[100px] resize-none text-sm leading-relaxed"
                placeholder="আপনি এই খরচটি কেন করেছেন বা কোন বিশেষ তথ্য থাকলে লিখুন..."
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer group">
                <div className="w-full border-2 border-dashed border-border-subtle rounded-2xl p-5 flex flex-col items-center justify-center gap-2 group-hover:border-primary group-hover:bg-primary/5 transition-all">
                  <Camera className="w-6 h-6 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-text-main/40 group-hover:text-primary">মেমো / ছবি যোগ</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              {image && (
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/20 relative group shadow-lg shrink-0">
                  <img src={image} alt="memo" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setImage('')}
                    className="absolute inset-0 bg-red-500/90 text-white flex items-center justify-center transition-opacity"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-6 border-t border-border-subtle bg-bg-page/20 shrink-0">
          <button 
            onClick={() => onSave({
              category: selectedCategory === 'custom' ? customCategory : selectedCategory,
              amount: Number(amount) || 0,
              advance: Number(advance) || 0,
              due: Number(due) || 0,
              date,
              note,
              image
            })}
            disabled={!amount || (selectedCategory === 'custom' && !customCategory)}
            className="w-full py-4.5 agri-gradient text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-30 ripple"
          >
            <Save className="w-5 h-5" /> 
            {editData ? 'তথ্য হালনাগাদ করুন (Update Now)' : 'খরচ সেভ করুন (Save Expense)'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
