/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Cloud, Calendar, Plus, Trash2, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { WeatherLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface WeatherManagerProps {
  logs: WeatherLog[];
  onAddLog: (log: WeatherLog) => void;
  onDeleteLog: (id: string) => void;
  onOpenSidebar: () => void;
}

export default function WeatherManager({ logs, onAddLog, onDeleteLog, onOpenSidebar }: WeatherManagerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [comment, setComment] = useState('');
  const [activeMonth, setActiveMonth] = useState(new Date());

  const handleAdd = () => {
    if (!comment.trim()) return;
    const newLog: WeatherLog = {
      id: Date.now().toString(),
      date: selectedDate,
      comment: comment.trim()
    };
    onAddLog(newLog);
    setComment('');
  };

  const currentMonthLogs = useMemo(() => {
    const month = activeMonth.getMonth();
    const year = activeMonth.getFullYear();
    return logs.filter(log => {
      const d = new Date(log.date);
      return d.getMonth() === month && d.getFullYear() === year;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, activeMonth]);

  const lastYearSameMonthLogs = useMemo(() => {
    const month = activeMonth.getMonth();
    const lastYear = activeMonth.getFullYear() - 1;
    return logs.filter(log => {
      const d = new Date(log.date);
      return d.getMonth() === month && d.getFullYear() === lastYear;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs, activeMonth]);

  const twoYearsAgoSameMonthLogs = useMemo(() => {
    const month = activeMonth.getMonth();
    const twoYearsAgo = activeMonth.getFullYear() - 2;
    return logs.filter(log => {
      const d = new Date(log.date);
      return d.getMonth() === month && d.getFullYear() === twoYearsAgo;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs, activeMonth]);

  const monthName = activeMonth.toLocaleString('bn-BD', { month: 'long' });
  const yearName = activeMonth.toLocaleString('bn-BD', { year: 'numeric' });

  return (
    <div className="flex-1 flex flex-col bg-bg-page overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sticky top-0 z-30 bg-bg-page/90 backdrop-blur-md border-b border-border-subtle mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenSidebar}
            className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-premium lg:hidden"
          >
            <Plus className="w-5 h-5 rotate-45" />
          </button>
          <div>
            <h1 className="text-lg sm:text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              আবহাওয়া ও কৃষি দিনলিপি
            </h1>
            <p className="text-stone-500 font-bold mt-1">আপনার খামারের আবহাওয়া ও বিশেষ মুহূর্তের আপডেট রাখুন</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 px-4 md:px-8">
        {/* Entry Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 bg-white dark:bg-white/5 rounded-[2.5rem] shadow-premium border border-border-subtle">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              নতুন মন্তব্য করুন
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-stone-500 tracking-[0.2em] ml-4">তারিখ নির্বাচন করুন</label>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-bg-page dark:bg-black/20 border border-border-subtle rounded-2xl px-6 py-4 font-black outline-none focus:border-primary transition-colors dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-stone-500 tracking-[0.2em] ml-4">আপনার মন্তব্য</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="যেমন: বৃষ্টি শুরু হলো, ধান রোপণ সম্পন্ন হলো ইত্যাদি..."
                  rows={4}
                  className="w-full bg-bg-page dark:bg-black/20 border border-border-subtle rounded-2xl px-6 py-4 font-bold outline-none focus:border-primary transition-colors dark:text-white resize-none"
                />
              </div>

              <button 
                onClick={handleAdd}
                disabled={!comment.trim()}
                className="w-full bg-primary text-white py-5 rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
              >
                <Plus className="w-6 h-6" />
                সেভ করুন
              </button>
            </div>
          </div>

          {/* Tips Card */}
          <div className="p-8 bg-secondary/10 rounded-[2.5rem] border border-secondary/20">
            <h3 className="font-black text-secondary flex items-center gap-2 mb-4">
              <Info className="w-5 h-5" />
              টিপস
            </h3>
            <p className="text-sm font-bold text-secondary/70 leading-relaxed">
              প্রতিদিনের বিশেষ আবহাওয়া বা কাজ লিখে রাখলে পরবর্তী ২ বছর পর্যন্ত একই সময়ে আপনি কি করেছিলেন তা এক নজরে দেখতে পারবেন।
            </p>
          </div>
        </div>

        {/* Display Panel */}
        <div className="lg:col-span-7 space-y-8">
          {/* Historical Reminder */}
          {(lastYearSameMonthLogs.length > 0 || twoYearsAgoSameMonthLogs.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Last Year */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] relative overflow-hidden"
              >
                <h2 className="text-lg font-black text-emerald-600 mb-4 flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  ১ বছর আগে ({(activeMonth.getFullYear() - 1).toLocaleString('bn-BD', { useGrouping: false })})
                </h2>
                <div className="space-y-3">
                  {lastYearSameMonthLogs.length > 0 ? (
                    lastYearSameMonthLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-white dark:bg-white/5 rounded-xl border border-emerald-500/10 flex items-start gap-3">
                        <div className="shrink-0 px-2 py-0.5 bg-emerald-500/20 rounded-md text-[10px] font-black text-emerald-600">
                          {new Date(log.date).getDate().toLocaleString('bn-BD')}
                        </div>
                        <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">{log.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-bold text-emerald-700 text-center py-4">কোন রেকর্ড নেই</p>
                  )}
                </div>
              </motion.div>

              {/* Two Years Ago */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-[2rem] relative overflow-hidden"
              >
                <h2 className="text-lg font-black text-indigo-600 mb-4 flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  ২ বছর আগে ({(activeMonth.getFullYear() - 2).toLocaleString('bn-BD', { useGrouping: false })})
                </h2>
                <div className="space-y-3">
                  {twoYearsAgoSameMonthLogs.length > 0 ? (
                    twoYearsAgoSameMonthLogs.map((log) => (
                      <div key={log.id} className="p-3 bg-white dark:bg-white/5 rounded-xl border border-indigo-500/10 flex items-start gap-3">
                        <div className="shrink-0 px-2 py-0.5 bg-indigo-500/20 rounded-md text-[10px] font-black text-indigo-600">
                          {new Date(log.date).getDate().toLocaleString('bn-BD')}
                        </div>
                        <p className="text-xs font-bold text-indigo-800 dark:text-indigo-200">{log.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs font-bold text-indigo-700 text-center py-4">কোন রেকর্ড নেই</p>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* Monthly Logs */}
          <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-border-subtle p-8 shadow-premium">
            <div className="flex items-center gap-3 px-4 py-3 sm:px-6 sticky top-0 z-30 bg-bg-page/90 backdrop-blur-md border-b border-border-subtle mb-6">
              <h2 className="text-xl font-black">{monthName} {yearName} - এর লগের তালিকা</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const d = new Date(activeMonth);
                    d.setMonth(d.getMonth() - 1);
                    setActiveMonth(d);
                  }}
                  className="p-2 hover:bg-bg-page dark:hover:bg-black/20 rounded-xl transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    const d = new Date(activeMonth);
                    d.setMonth(d.getMonth() + 1);
                    setActiveMonth(d);
                  }}
                  className="p-2 hover:bg-bg-page dark:hover:bg-black/20 rounded-xl transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {currentMonthLogs.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 text-center text-stone-400"
                  >
                    <Cloud className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-black">এই মাসে কোন রেকর্ড নেই</p>
                  </motion.div>
                ) : (
                  currentMonthLogs.map((log) => (
                    <motion.div 
                      key={log.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group p-6 bg-bg-page dark:bg-black/20 rounded-3xl border border-border-subtle hover:border-primary transition-all flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center px-4 py-2 bg-white dark:bg-white/5 rounded-2xl shadow-sm min-w-[70px]">
                          <span className="text-[10px] font-black text-primary uppercase">{new Date(log.date).toLocaleString('bn-BD', { month: 'short' })}</span>
                          <span className="text-xl font-black text-primary">{new Date(log.date).toLocaleString('bn-BD', { day: '2-digit' })}</span>
                        </div>
                        <div>
                          <p className="font-bold text-lg dark:text-white">{log.comment}</p>
                          <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest block mt-2">
                            {new Date(log.date).getFullYear().toLocaleString('bn-BD', { useGrouping: false })} সাল
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => onDeleteLog(log.id)}
                        className="p-2 text-red-500/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
