/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Calendar, Plus, Trash2, ChevronLeft, ChevronRight, CheckCircle2, Circle, ListTodo, Sparkles } from 'lucide-react';
import { FarmPlan } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PlanManagerProps {
  plans: FarmPlan[];
  onAddPlan: (plan: FarmPlan) => void;
  onDeletePlan: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onOpenSidebar: () => void;
}

export default function PlanManager({ plans, onAddPlan, onDeletePlan, onToggleStatus, onOpenSidebar }: PlanManagerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [activity, setActivity] = useState('');
  const [selectedColor, setSelectedColor] = useState('#d9f35c');
  const [activeMonth, setActiveMonth] = useState(new Date());

  const COLORS = [
    { name: 'আড়া/হলুদ', value: '#d9f35c' },
    { name: 'সবুজ', value: '#10b981' },
    { name: 'নীল', value: '#3b82f6' },
    { name: 'বেগুনি', value: '#8b5cf6' },
    { name: 'লাল', value: '#ef4444' },
    { name: 'কমলা', value: '#f97316' },
  ];

  const handleAdd = () => {
    if (!activity.trim()) return;
    const newPlan: FarmPlan = {
      id: Date.now().toString(),
      date: selectedDate,
      endDate: endDate || undefined,
      activity: activity.trim(),
      color: selectedColor,
      status: 'pending'
    };
    onAddPlan(newPlan);
    setActivity('');
    setEndDate('');
  };

  const filteredPlans = useMemo(() => {
    const month = activeMonth.getMonth();
    const year = activeMonth.getFullYear();
    return plans.filter(p => {
      const d = new Date(p.date);
      return d.getMonth() === month && d.getFullYear() === year;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [plans, activeMonth]);

  const monthName = activeMonth.toLocaleString('bn-BD', { month: 'long' });
  const yearName = activeMonth.toLocaleString('bn-BD', { year: 'numeric' });

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenSidebar}
            className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-premium lg:hidden"
          >
            <Plus className="w-5 h-5 rotate-45" />
          </button>
          <div>
            <h1 style={{ color:"#111827" }} className="text-3xl font-black flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-emerald-600" />
              চাষাবাদ পরিকল্পনা
            </h1>
            <p className="text-[#374151] font-bold mt-1">ভবিষ্যৎ ফসলের সময়সূচী এবং কার্যক্রম নির্ধারণ করুন</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Entry Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1e211f]" />
              নতুন পরিকল্পনা যোগ করুন
            </h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-[#374151] tracking-[0.2em] ml-4">শুরুর তারিখ</label>
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-2xl px-6 py-4 font-black outline-none focus:border-emerald-500 transition-colors" style={{ color:"#111827" }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-[#374151] tracking-[0.2em] ml-4">শেষের তারিখ (ঐচ্ছিক)</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-2xl px-6 py-4 font-black outline-none focus:border-emerald-500 transition-colors" style={{ color:"#111827" }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-[#374151] tracking-[0.2em] ml-4">কি করতে চান? (কার্যক্রম)</label>
                <input 
                  type="text"
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  placeholder="যেমন: ধান রোপণ, ভুট্টা মাড়াই ইত্যাদি..."
                  className="w-full bg-white border border-gray-300 rounded-2xl px-6 py-4 font-bold outline-none focus:border-emerald-500 transition-colors" style={{ color:"#111827" }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-[#374151] tracking-[0.2em] ml-4">চিহ্নিত করার রঙ</label>
                <div className="flex flex-wrap gap-3 px-2">
                  {COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setSelectedColor(c.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === c.value ? 'border-primary scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <button 
                onClick={handleAdd}
                disabled={!activity.trim()}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
              >
                <Plus className="w-6 h-6" />
                পরিকল্পনায় যুক্ত করুন
              </button>
            </div>
          </div>

          <div className="p-8 bg-stone-50 rounded-[2.5rem] border border-stone-200">
            <h3 className="font-black text-[#1e211f] flex items-center gap-2 mb-4 text-sm">
              <ListTodo className="w-4 h-4" />
              কেন পরিকল্পনা করবেন?
            </h3>
            <p className="text-xs font-bold text-[#374151] leading-relaxed">
              সঠিক সময়ে চাষাবাদ সম্পন্ন করতে এবং আগাম প্রস্তুতির জন্য আপনার পরিকল্পনাগুলো এখানে তালিকাভুক্ত করুন। এটি আপনার খামারের উৎপাদনশীলতা বাড়াতে সাহায্য করবে।
            </p>
          </div>
        </div>

        {/* Display Panel */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 style={{ color:"#111827" }} className="text-xl font-black">{monthName} {yearName}</h2>
                <p style={{ color:"#374151" }} className="text-xs font-bold uppercase tracking-widest leading-none mt-1">পরিকল্পনার তালিকা</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const d = new Date(activeMonth);
                    d.setMonth(d.getMonth() - 1);
                    setActiveMonth(d);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-[#111827]" />
                </button>
                <button 
                  onClick={() => {
                    const d = new Date(activeMonth);
                    d.setMonth(d.getMonth() + 1);
                    setActiveMonth(d);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-[#111827]" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredPlans.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ color:"#374151" }} className="py-16 text-center flex flex-col items-center justify-center gap-4"
                  >
                    <div className="p-6 bg-gray-100 rounded-full">
                      <Sparkles className="w-12 h-12" />
                    </div>
                    <p style={{ color:"#111827" }} className="font-black">এই মাসে আপনার কোন পরিকল্পনা নেই</p>
                  </motion.div>
                ) : (
                  filteredPlans.map((plan) => (
                    <motion.div 
                      key={plan.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`group p-6 rounded-3xl border transition-all flex items-center justify-between gap-4 ${
                        plan.status === 'completed' 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-gray-50 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <button 
                          onClick={() => onToggleStatus(plan.id)}
                          className={`p-1 rounded-full transition-transform hover:scale-110 active:scale-95 ${
                            plan.status === 'completed' ? 'text-emerald-500' : 'text-[#374151] group-hover:text-[#111827]'
                          }`}
                        >
                          {plan.status === 'completed' ? <CheckCircle2 className="w-7 h-7" /> : <Circle className="w-7 h-7" />}
                        </button>

                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="px-3 py-1 bg-white dark:bg-white/5 rounded-lg text-xs font-black text-[#1e211f] shadow-sm border border-border-subtle">
                              {new Date(plan.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })}
                              {plan.endDate && ` - ${new Date(plan.endDate).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })}`}
                            </span>
                            {plan.color && (
                               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                            )}
                          </div>
                          <p className={`font-black text-lg transition-all ${
                            plan.status === 'completed' ? 'line-through' : ''
                          }`}>
                            {plan.activity}
                          </p>
                        </div>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeletePlan(plan.id);
                        }}
                        className="p-3 text-red-500/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all z-[100] cursor-pointer"
                      >
                        <Trash2 className="w-5 h-5 pointer-events-none" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      {/* Yearly Overview Toggle/Section */}
      <div className="mt-12 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-4">
          <div>
            <h2 className="text-2xl font-black text-[#1e211f] flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              বার্ষিক সময়সূচী ({activeMonth.getFullYear().toLocaleString('bn-BD', { useGrouping: false })})
            </h2>
            <p className="text-xs font-bold text-[#374151] uppercase tracking-widest leading-none mt-1">পুরো বছরের পরিকল্পনা এক নজরে</p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-white/5 p-1.5 rounded-2xl shadow-sm border border-border-subtle">
            <button 
              onClick={() => {
                const d = new Date(activeMonth);
                d.setFullYear(d.getFullYear() - 1);
                setActiveMonth(d);
              }}
              className="px-4 py-2 hover:bg-bg-page dark:hover:bg-black/20 rounded-xl transition-colors text-xs font-black uppercase tracking-widest text-[#374151] hover:text-[#1e211f]"
            >
              আগের বছর
            </button>
            <div className="px-4 py-2 bg-primary text-white rounded-xl font-black text-xs">
              {activeMonth.getFullYear().toLocaleString('bn-BD', { useGrouping: false })}
            </div>
            <button 
              onClick={() => {
                const d = new Date(activeMonth);
                d.setFullYear(d.getFullYear() + 1);
                setActiveMonth(d);
              }}
              className="px-4 py-2 hover:bg-bg-page dark:hover:bg-black/20 rounded-xl transition-colors text-xs font-black uppercase tracking-widest text-[#374151] hover:text-[#1e211f]"
            >
              পরের বছর
            </button>
          </div>
        </div>

        <div className="p-8 bg-white dark:bg-white/5 rounded-[3rem] shadow-premium border border-border-subtle">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 12 }).map((_, monthIndex) => {
              const currentYear = activeMonth.getFullYear();
              const firstDayOfMonth = new Date(currentYear, monthIndex, 1).getDay();
              const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
              const monthName = new Date(currentYear, monthIndex).toLocaleString('bn-BD', { month: 'long' });
              
              const monthPlans = plans.filter(p => {
                const start = new Date(p.date);
                const end = p.endDate ? new Date(p.endDate) : start;
                const monthStart = new Date(currentYear, monthIndex, 1);
                const monthEnd = new Date(currentYear, monthIndex + 1, 0);
                
                // Return plants that overlap with this month
                return (start <= monthEnd && end >= monthStart);
              });

              return (
                <div key={monthIndex} className="space-y-4 p-4 rounded-3xl bg-bg-page dark:bg-black/20 border border-border-subtle group hover:border-primary transition-colors">
                  <div className="flex items-center justify-between px-2">
                    <span className="font-black text-[#1e211f]">{monthName}</span>
                    {monthPlans.filter(p => new Date(p.date).getMonth() === monthIndex).length > 0 && (
                      <span className="w-5 h-5 bg-primary text-white text-xs font-black rounded-full flex items-center justify-center">
                        {monthPlans.filter(p => new Date(p.date).getMonth() === monthIndex).length.toLocaleString('bn-BD')}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {['র', 'সো', 'ম', 'বু', 'বৃ', 'শু', 'শ'].map(d => (
                      <div key={d} className="text-[8px] font-black text-[#374151] text-center">{d}</div>
                    ))}
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const currentDate = new Date(currentYear, monthIndex, day);
                      
                      const activePlanInRange = plans.find(p => {
                        const start = new Date(p.date);
                        const end = p.endDate ? new Date(p.endDate) : start;
                        return currentDate >= start && currentDate <= end;
                      });

                      return (
                        <div 
                          key={day} 
                          className={`aspect-square flex items-center justify-center text-xs font-bold rounded-lg transition-all ${
                            activePlanInRange 
                              ? 'text-white shadow-sm scale-110 z-10' 
                              : 'text-[#374151] group-hover:text-[#1a1a1a]/60'
                          }`}
                          style={activePlanInRange ? { backgroundColor: activePlanInRange.color || '#d9f35c' } : {}}
                        >
                          {day.toLocaleString('bn-BD')}
                        </div>
                      );
                    })}
                  </div>

                  {monthPlans.length > 0 && (
                    <div className="pt-2 border-t border-border-subtle space-y-1">
                      {monthPlans.slice(0, 2).map(p => (
                        <div key={p.id} className="flex items-center gap-2 text-xs font-bold text-[#374151] truncate">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#d9f35c' }} />
                          <span className="truncate">{p.activity}</span>
                        </div>
                      ))}
                      {monthPlans.length > 2 && <p className="text-[8px] font-black text-[#374151]">+ আরও {monthPlans.length - 2}টি</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
