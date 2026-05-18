/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Plus, Calendar, CreditCard, Save,
  ChevronRight, Trash2, Info, ChevronDown, Sprout, Archive, Edit3, Image as ImageIcon, BarChart2, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis,
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { CropProfile, CategoryType, CATEGORY_LABELS, Expense } from '../types';
import { calculateAge, formatCurrency } from '../lib/storage';
import { numberToBanglaWords } from '../lib/numberToWords';

interface ProfileDetailProps {
  profile: CropProfile;
  onBack: () => void;
  onEditProfile: () => void;
  onHarvest: () => void;
  onAddExpense: (categoryId: CategoryType) => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onArchive: () => void;
  onDelete: () => void;
}

export default function ProfileDetail({ 
  profile, onBack, onEditProfile, onHarvest, onAddExpense, onEditExpense, onDeleteExpense, onArchive, onDelete 
}: ProfileDetailProps) {
  const COLORS = ['#fbbf24', '#34d399', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];
  const [expandedCategory, setExpandedCategory] = useState<CategoryType | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);

  const profileTotal = profile.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const profileDueTotal = profile.expenses.reduce((sum, e) => sum + (e.due || 0), 0);
  const age = calculateAge(profile.startDate, profile.archivedDate);
  
  const normalSales = (profile.sales || []).reduce((sum, s) => sum + s.totalAmount, 0);
  const stockSales = (profile.stockSales || []).reduce((sum, s) => sum + s.totalAmount, 0);
  const totalActualSale = normalSales + stockSales;
  const totalSale = totalActualSale || profile.expectedSale || 0;
  const profit = totalSale - profileTotal;
  const profitPercentage = profileTotal > 0 ? (profit / profileTotal) * 100 : 0;

  const getExpensesByCategory = (cat: string) => {
    return profile.expenses.filter(e => e.category === cat);
  };

  const getCategoryTotal = (cat: string) => {
    return profile.expenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
  };

  const getCategoryDue = (cat: string) => {
    return profile.expenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + (e.due || 0), 0);
  };

  const allExpenseCategories = Array.from(new Set([
    ...Object.keys(CATEGORY_LABELS),
    ...profile.expenses.map(e => e.category)
  ]));

  const allExpenseCategoriesWithTotal = allExpenseCategories
    .map(cat => ({ id: cat, total: getCategoryTotal(cat), label: CATEGORY_LABELS[cat] || cat }))
    .filter(cat => cat.total > 0 || Object.keys(CATEGORY_LABELS).includes(cat.id));

  return (
    <div className="space-y-6 pb-24 relative">
      {/* Photo Viewer Modal */}
      <AnimatePresence>
        {viewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setViewImage(null)}
            className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="relative max-w-full max-h-full"
            >
              <img src={viewImage} alt="Memo" className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl" />
              <button 
                onClick={() => setViewImage(null)}
                className="absolute -top-12 right-0 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <Plus className="w-8 h-8 rotate-45" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="p-2.5 bg-white rounded-2xl shadow-premium border border-border-subtle hover:bg-bg-page transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-text-main leading-tight truncate">{profile.name}</h1>
            <p className="text-xs font-bold text-primary opacity-60 uppercase tracking-widest">{age} দিন অতিবাহিত</p>
          </div>
        </div>
        <div className="flex gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onEditProfile}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white rounded-2xl border border-border-subtle text-primary hover:bg-stone-50 transition-all font-black text-xs uppercase tracking-widest"
          >
            <Edit3 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">সম্পাদন</span>
          </button>
          <button
            onClick={onArchive}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl border transition-all ${profile.status === 'archived' ? 'bg-secondary text-white border-transparent' : 'bg-white text-text-main/60 border-border-subtle hover:text-secondary'}`}
          >
            <Archive className="w-4 h-4 shrink-0" />
            <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">
              {profile.status === 'live' ? 'আর্কাইভ' : 'লাইভ করুন'}
            </span>
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-2xl border border-red-100 text-red-500 hover:text-white hover:bg-red-500 transition-all z-[100] cursor-pointer shadow-lg"
            title="ডিলিট করুন"
          >
            <Trash2 className="w-4 h-4 pointer-events-none" />
          </button>
        </div>
      </div>

      {/* Summary Card - Premium Gradient */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="agri-gradient p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] text-white shadow-active relative overflow-hidden"
      >
        <div className="relative z-10 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="opacity-70 text-xs uppercase tracking-[0.2em] font-bold mb-1">মোট খরচ (Invested)</div>
              <div className="text-4xl font-bold font-sans drop-shadow-sm">{formatCurrency(profileTotal)}</div>
              <p className="text-[8px] font-bold text-white/40 mt-1 italic leading-none">{numberToBanglaWords(profileTotal)}</p>
            </div>
            <div className="text-right">
              <div className="opacity-70 text-xs uppercase tracking-[0.2em] font-bold mb-1">
                {totalActualSale > 0 ? 'বিক্রয়লব্ধ অর্থ (Actual Sale)' : 'সম্ভাব্য বিক্রি (Expected)'}
              </div>
              <div className="text-3xl font-bold font-sans drop-shadow-sm">
                {formatCurrency(totalSale)}
              </div>
              <p className="text-[8px] font-bold text-white/40 mt-1 italic leading-none">{numberToBanglaWords(totalSale)}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/5">
             <div className="text-xs font-black uppercase tracking-widest opacity-60">লভ্যাংশ বিশ্লেষণ (Status):</div>
             <div className="flex items-center gap-2">
                <span className="text-xs font-bold opacity-60">{formatCurrency(totalSale)} - {formatCurrency(profileTotal)} =</span>
                <span className={`text-lg font-black ${profit >= 0 ? 'text-secondary-light' : 'text-red-200'}`}>
                   {profit >= 0 ? 'মুনাফা' : 'লোকসান'} {formatCurrency(Math.abs(profit))}
                </span>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/20">
            <div>
              <div className="opacity-50 text-xs uppercase tracking-widest font-bold mb-1">বাকি টাকা (Total Due)</div>
              <div className="font-bold text-lg text-red-100">{formatCurrency(profileDueTotal)}</div>
            </div>
            <div>
              <div className="opacity-50 text-xs uppercase tracking-widest font-bold mb-1">জমির পরিমাণ</div>
              <div className="font-bold text-sm bg-white/10 w-fit px-3 py-1 rounded-lg">{profile.landSize || 'উল্লেখ নেই'}</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest opacity-60">রিপোর্ট কার্ড (Report Card)</p>
                <h3 className="text-xl font-bold mt-1">{profit >= 0 ? 'নীট লাভ (Net Profit)' : 'নীট ক্ষতি (Net Loss)'}</h3>
              </div>
              <div className={`text-3xl font-black ${profit >= 0 ? 'text-secondary-light' : 'text-red-200'}`}>
                {profitPercentage.toFixed(1)}%
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl flex flex-col items-center justify-center border ${profit >= 0 ? 'bg-emerald-500/20 border-emerald-500/20' : 'bg-red-500/20 border-red-500/20'}`}>
                   <span className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">{profit >= 0 ? 'লাভে আছেন' : 'লোকসানে আছেন'}</span>
                   <span className="text-xl font-black">{formatCurrency(Math.abs(profit))}</span>
                </div>
                <div className="p-4 rounded-2xl flex flex-col items-center justify-center border bg-white/5 border-white/10">
                   <span className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">প্রজেক্ট বয়স</span>
                   <span className="text-xl font-black">{age} দিন</span>
                </div>
            </div>
          </div>

          {totalActualSale > 0 && (
             <div className="pt-8 mt-8 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">বিক্রয় ও উৎপাদন (Sales & Production)</p>
                   <span className="text-xs font-black bg-white/10 px-3 py-1 rounded-full">{(profile.sales?.length || 0) + (profile.stockSales?.length || 0)}টি বিক্রয় সম্পন্ন</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-[8px] font-black opacity-40 uppercase tracking-widest mb-1">মোট উৎপাদন (বিক্রিত)</p>
                      <p className="text-sm font-black">
                         {[...(profile.sales || []), ...(profile.stockSales || [])].reduce((acc, sale) => {
                            const existing = acc.find(a => a.unit === sale.unit);
                            if (existing) existing.qty += sale.quantity;
                            else acc.push({ unit: sale.unit, qty: sale.quantity });
                            return acc;
                         }, [] as {unit: string, qty: number}[]).map(s => `${s.qty} ${s.unit}`).join(', ')}
                      </p>
                   </div>
                   <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-[8px] font-black opacity-40 uppercase tracking-widest mb-1">গড় বিক্রয়মূল্য</p>
                      <p className="text-sm font-black">
                         {formatCurrency(totalActualSale / ((profile.sales?.length || 0) + (profile.stockSales?.length || 0)))}
                      </p>
                   </div>
                   <div className="bg-secondary/10 p-4 rounded-2xl border border-secondary/20 col-span-2">
                      <p className="text-[8px] font-black text-secondary/40 uppercase tracking-widest mb-1">সর্বমোট বিক্রয়লব্ধ অর্থ</p>
                      <p className="text-lg font-black text-secondary leading-none">{formatCurrency(totalActualSale)}</p>
                   </div>
                </div>
             </div>
          )}
        </div>
        <Sprout className="w-40 h-40 absolute -right-10 -bottom-10 opacity-10 rotate-12" />
      </motion.div>

      {/* Expense Categories */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Info className="w-5 h-5 text-secondary" /> বিস্তারিত খরচসমূহ (Details)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {allExpenseCategories.map((catId, idx) => {
            const catTotal = getCategoryTotal(catId);
            const isDefault = Object.keys(CATEGORY_LABELS).includes(catId);
            // Hide custom categories with 0 total, keep default categories even if 0
            if (catTotal === 0 && !isDefault) return null;

            const catDue = getCategoryDue(catId);
            const isExpanded = expandedCategory === catId;
            const expenses = getExpensesByCategory(catId);

            return (
              <motion.div 
                key={catId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`group relative bg-white rounded-[2rem] border transition-all duration-500 overflow-hidden ${isExpanded ? 'col-span-1 sm:col-span-2 border-primary shadow-2xl ring-4 ring-primary/5' : 'border-border-subtle hover:border-primary/40 hover:shadow-xl'}`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${catTotal > 0 ? 'bg-primary text-white' : 'bg-bg-page text-stone-700'}`}>
                         <CreditCard className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-black text-text-main text-lg leading-none mb-2">{CATEGORY_LABELS[catId] || catId}</h3>
                        <div className="flex items-center gap-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-stone-700 uppercase tracking-widest leading-none mb-1">মোট (Total)</span>
                            <span className="font-black text-primary text-xl leading-none">{formatCurrency(catTotal)}</span>
                          </div>
                          {catDue > 0 && (
                            <>
                              <div className="w-px h-8 bg-border-subtle" />
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-red-500/40 uppercase tracking-widest leading-none mb-1">বাকি (Due)</span>
                                <span className="font-black text-red-500 text-xl leading-none">{formatCurrency(catDue)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCategory(isExpanded ? null : catId as CategoryType);
                        }}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isExpanded ? 'bg-primary text-white' : 'bg-bg-page text-stone-700 hover:text-primary hover:bg-primary/10'}`}
                      >
                        <ChevronDown className={`w-6 h-6 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-8 pt-6 border-t border-border-subtle/50">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddExpense(catId as CategoryType);
                      }}
                      className="flex items-center justify-center gap-2 py-4 bg-emerald-50 text-emerald-600 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> নতুন এন্ট্রি
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedCategory(isExpanded ? null : catId as CategoryType);
                      }}
                      className={`flex items-center justify-center gap-2 py-4 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${expenses.length > 0 ? (isExpanded ? 'bg-primary text-white' : 'bg-bg-page text-primary hover:bg-stone-50') : 'bg-bg-page text-stone-700 cursor-not-allowed'}`}
                    >
                      <Edit3 className="w-4 h-4" /> বিস্তারিত / সম্পাদন
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-bg-page/20 border-t border-border-subtle overflow-hidden"
                    >
                      <div className="p-6 space-y-4">
                        {expenses.length === 0 ? (
                          <div className="text-center py-10">
                            <Info className="w-10 h-10 text-text-main/10 mx-auto mb-3" />
                            <p className="text-xs font-bold text-stone-700 uppercase tracking-widest">এখনো কোন তথ্য নেই</p>
                          </div>
                        ) : (
                          expenses.map((expense) => (
                            <div key={expense.id} className="bg-white p-5 rounded-[1.5rem] border border-border-subtle shadow-sm group/item">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="w-2 h-2 rounded-full bg-primary" />
                                    <p className="text-xs font-black text-stone-700 uppercase tracking-widest">
                                      {new Date(expense.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                  </div>
                                  <p className="text-sm font-bold text-text-main leading-relaxed pr-8">{expense.note || 'কোন বর্ণনা নেই'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-black text-primary leading-none mb-1">{formatCurrency(expense.amount)}</p>
                                  <p className="text-xs font-bold text-stone-700 uppercase tracking-widest">মোট পরিশোধযোগ্য</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between pt-4 border-t border-bg-page">
                                <div className="flex gap-6">
                                  <div>
                                    <p className="text-[8px] font-black text-stone-700 uppercase tracking-widest mb-1">পেইড হয়েছে</p>
                                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(expense.advance)}</p>
                                  </div>
                                  {expense.due > 0 && (
                                    <div>
                                      <p className="text-[8px] font-black text-red-500/40 uppercase tracking-widest mb-1">বাকি আছে</p>
                                      <p className="text-sm font-bold text-red-500">{formatCurrency(expense.due)}</p>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {expense.image && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewImage(expense.image!);
                                      }}
                                      className="w-10 h-10 flex items-center justify-center bg-stone-50 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                    >
                                      <ImageIcon className="w-5 h-5" />
                                    </button>
                                  )}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditExpense(expense);
                                    }}
                                    className={`flex items-center gap-2 px-4 h-10 rounded-xl transition-all text-xs font-black uppercase tracking-widest shadow-sm ${expense.due > 0 ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-stone-50 text-primary hover:bg-primary/10'}`}
                                  >
                                    <Edit3 className="w-4 h-4" /> {expense.due > 0 ? 'বাকি প্রদান' : 'সম্পাদন'}
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      onDeleteExpense(expense.id);
                                    }}
                                    className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm z-[100] cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Expense Summary Section (Full Analysis) - Redesigned for Premium Look */}
        <div className="bg-gradient-to-br from-emerald-50 via-white to-amber-50 rounded-2xl sm:rounded-[3rem] p-4 sm:p-8 lg:p-12 border border-emerald-100/50 shadow-2xl mt-8 sm:mt-12 relative overflow-hidden">
           <div className="relative z-10">
             {/* Header Section */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-12 gap-4 sm:gap-6">
                <div className="text-left">
                   <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <BarChart2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-primary leading-none">সার্বিক খরচ বিশ্লেষণ</h2>
                        <p className="text-xs uppercase font-black tracking-widest text-stone-700 mt-1">Advanced Project Investment Analytics</p>
                      </div>
                   </div>
                </div>
                <div className="bg-white/60 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-white shadow-xl flex items-center gap-4 sm:gap-8 sm:px-10">
                   <div className="text-right border-r border-stone-200 pr-8">
                      <p className="text-xs font-black text-stone-700 uppercase tracking-widest mb-1">সর্বমোট খরচ</p>
                      <p className="text-3xl font-black text-primary">{formatCurrency(profileTotal)}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-red-500/40 uppercase tracking-widest mb-1">মোট বাকি</p>
                      <p className="text-3xl font-black text-red-500">{formatCurrency(profileDueTotal)}</p>
                   </div>
                </div>
             </div>

             {/* Quick Analysis Grid (Compact) */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
               {['tillage', 'seeds', 'irrigation', 'sowing', 'fertilizer', 'pesticide', 'labor', 'weeding', 'harvesting', 'transport'].map((catId) => {
                 const total = getCategoryTotal(catId);
                 const label = CATEGORY_LABELS[catId] || catId;
                 return (
                   <div key={catId} className="bg-white/80 backdrop-blur-sm p-4 rounded-[1.5rem] border border-white shadow-sm hover:shadow-md transition-shadow group">
                     <p className="text-xs font-black text-stone-700 uppercase tracking-widest mb-1.5 truncate group-hover:text-stone-700 transition-colors">{label}</p>
                     <p className="text-lg font-black text-primary truncate leading-none">{formatCurrency(total)}</p>
                     <div className="mt-2.5 h-1 w-full bg-stone-50 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${profileTotal > 0 ? (total / profileTotal * 100) : 0}%` }}
                          className="h-full bg-primary rounded-full"
                        />
                     </div>
                   </div>
                 );
               })}
             </div>

             {/* Charts Section (Side-by-Side) */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Comparison Bar Chart */}
                <div className="bg-white/60 backdrop-blur-md p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-white shadow-xl">
                   <div className="flex justify-between items-center mb-6 sm:mb-10">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <BarChart2 className="w-4 h-4" /> খরচের খাতসমূহের তুলনা
                      </h3>
                      <span className="text-xs font-black bg-stone-50 text-primary px-3 py-1 rounded-full uppercase">Top Categories</span>
                   </div>
                   <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={allExpenseCategoriesWithTotal.filter(c => c.total > 0).sort((a,b) => b.total - a.total).slice(0, 6)}>
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="label" 
                            type="category" 
                            width={80} 
                            fontSize={10} 
                            fontFamily="Inter" 
                            fontWeight="900"
                            stroke="rgba(0,0,0,0.3)"
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                            contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '16px', fontSize: '10px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                          />
                          <Bar 
                            dataKey="total" 
                            fill="#059669" 
                            radius={[0, 8, 8, 0]} 
                            barSize={16}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Distribution Pie Chart */}
                <div className="bg-white/60 backdrop-blur-md p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-white shadow-xl flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                   <div className="flex-1 w-full text-center sm:text-left">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center justify-center sm:justify-start gap-2 mb-6">
                        <PieChartIcon className="w-4 h-4" /> মূলধন বন্টন (Allocation)
                      </h3>
                      <div className="space-y-4 max-h-[180px] overflow-y-auto pr-2 scrollbar-hide">
                         {allExpenseCategoriesWithTotal.filter(c => c.total > 0).sort((a,b) => b.total - a.total).map((cat, idx) => (
                           <div key={cat.id} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                <span className="text-[11px] font-black text-stone-700 group-hover:text-primary transition-colors">{cat.label}</span>
                              </div>
                              <span className="text-xs font-black text-stone-700">{Math.round((cat.total / profileTotal) * 100)}%</span>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="h-[220px] w-full sm:w-[220px] shrink-0 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={allExpenseCategoriesWithTotal.filter(c => c.total > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={8}
                            dataKey="total"
                          >
                            {allExpenseCategoriesWithTotal.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-xs font-black text-stone-700 uppercase tracking-widest leading-none mb-1">বন্টন হার</span>
                         <span className="text-xl font-black text-primary">100%</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Action Bar */}
             <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-8 bg-white/40 rounded-2xl sm:rounded-[2.5rem] border border-white gap-4 sm:gap-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-stone-50 rounded-full flex items-center justify-center">
                      <Info className="w-6 h-6 text-stone-700" />
                   </div>
                   <p className="text-[11px] font-black text-primary opacity-40 uppercase tracking-widest leading-relaxed max-w-[200px]">
                      আপনার সকল খরচ সম্বলিত একটি পূর্ণাঙ্গ রিপোর্ট
                   </p>
                </div>
                <button 
                  onClick={() => onAddExpense('others' as CategoryType)}
                  className="agri-gradient text-white px-10 py-5 rounded-3xl shadow-xl active:scale-95 transition-all flex items-center gap-4 group/btn"
                >
                   <div className="bg-white/20 p-2 rounded-full group-hover/btn:rotate-90 transition-transform">
                      <Plus className="w-6 h-6" />
                   </div>
                   <span className="text-sm font-black uppercase tracking-widest pr-2">নতুন তথ্য যোগ করুন</span>
                </button>
             </div>
           </div>
           <Sprout className="absolute -left-10 -bottom-10 w-80 h-80 opacity-[0.05] rotate-12 text-primary pointer-events-none" />
           <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
