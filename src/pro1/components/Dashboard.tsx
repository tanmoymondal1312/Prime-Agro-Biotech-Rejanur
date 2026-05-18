import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  PieChart as PieIcon,
  Sprout,
  Plus,
  BarChart3,
  ChevronRight,
  ArrowUpRight,
  X as XIcon,
  AlertCircle,
  Zap,
  CloudSun,
  Sparkles,
  Banknote,
  Package,
  Layers,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CropProfile, CategoryType, CATEGORY_LABELS, WeatherLog, FarmPlan } from '../types';
import { formatCurrency, calculateAge } from '../lib/storage';
import { numberToBanglaWords } from '../lib/numberToWords';

interface DashboardProps {
  view: string;
  profiles: CropProfile[];
  allProfiles: CropProfile[];
  weatherLogs?: WeatherLog[];
  farmPlans?: FarmPlan[];
  onAddProfile: () => void;
  onSelectProfile: (id: string) => void;
  onOpenSidebar: () => void;
  onViewWeather?: () => void;
  onViewPlans?: () => void;
}

const getBengaliAge = (startDate: string, archivedDate?: string) => {
  const start = new Date(startDate);
  const now = archivedDate ? new Date(archivedDate) : new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffDays / 30);
  const remainingDays = diffDays % 30;
  
  const toBn = (n: number) => (n < 0 ? 0 : n).toLocaleString('bn-BD');
  
  if (months > 0) {
    return `${toBn(diffDays)} দিন (${toBn(months)} মাস ${toBn(remainingDays)} দিন)`;
  }
  return `${toBn(diffDays)} দিন`;
};

const ADVICE_LIST = [
  "আপনার স্টকের দিকে নজর দিন, কোনো স্টক ৯০ দিনের বেশি হলে দ্রুত বিক্রির পরিকল্পনা করুন।",
  "প্রজেক্টের ইনভেষ্টমেন্ট এবং রিটার্ন নিয়মিত পর্যবেক্ষণ করুন লাভ বৃদ্ধির জন্য।",
  "খামারের সার্বিক লাভ/ক্ষতি বিশ্লেষণ করে আগামী দিনের আবাদ পরিকল্পনা করুন।",
  "বেশি বয়সী প্রজেক্টগুলো দ্রুত সফলভাবে সম্পন্ন করার চেষ্টা করুন।",
  "স্টক প্রডাক্টের বাজার দর যাচাই করে সঠিক সময়ে বিক্রয়ের সিদ্ধান্ত নিন।"
];

export default function Dashboard({ view, profiles, allProfiles, weatherLogs = [], farmPlans = [], onAddProfile, onSelectProfile, onOpenSidebar, onViewWeather, onViewPlans }: DashboardProps) {
  const [adviceIndex, setAdviceIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

  const dynamicAdvice = useMemo(() => {
    const alerts: string[] = [];
    
    // 1. Profit/Loss Analysis
    const totalInvested = allProfiles.reduce((sum, p) => {
      const expenseTotal = p.expenses.reduce((s, e) => s + (e.amount || 0), 0);
      const stockCost = (p.stocks || []).filter(s => s.source === 'external').reduce((acc, s) => acc + (s.purchasePrice || 0), 0);
      return sum + expenseTotal + stockCost;
    }, 0);
    const totalRev = allProfiles.reduce((sum, p) => {
      const normalSales = (p.sales || []).reduce((s, sale) => s + sale.totalAmount, 0);
      const stockSales = (p.stockSales || []).reduce((s, sale) => s + sale.totalAmount, 0);
      return sum + normalSales + stockSales;
    }, 0);
    const net = totalRev - totalInvested;

    if (net > 0) {
      alerts.push(`ব্যবসায়িক অবস্থা: খামারের বর্তমানে মোট লাভ ${formatCurrency(net)}। এটি একটি ইতিবাচক লক্ষণ।`);
    } else if (net < 0) {
      alerts.push(`সতর্কতা: খামারে বর্তমানে ${formatCurrency(Math.abs(net))} ঘাটতি রয়েছে। বিনিয়োগ ও বিক্রয় পরিকল্পনা পুনর্মূল্যায়ন করুন।`);
    }

    // 2. Stock aging (>90 days)
    const agingStocks: string[] = [];
    allProfiles.forEach(p => {
      (p.stocks || []).forEach(s => {
        const soldQty = (p.stockSales || []).filter(ss => ss.stockEntryId === s.id).reduce((sum, ss) => sum + ss.quantity, 0);
        const remainingQty = s.quantity - soldQty;
        
        if (remainingQty > 0) {
          const diff = Math.floor((new Date().getTime() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24));
          if (diff > 90) {
            agingStocks.push(p.name);
          }
        }
      });
    });

    if (agingStocks.length > 0) {
      alerts.push(`সতর্কতা: ${[...new Set(agingStocks)].join(', ')} এর স্টক ৯০ দিনের বেশি হয়ে গেছে। দ্রুত বিক্রির ব্যবস্থা নিন।`);
    }

    // 3. Project aging (>120 days for live projects)
    const agingProjects = allProfiles
      .filter(p => p.status === 'live' && p.type !== 'stock')
      .map(p => ({ 
        name: p.name, 
        days: calculateAge(p.startDate, p.archivedDate)
      }))
      .filter(p => p.days > 90); // Reduced to 90 as per user's "90 days" mention

    if (agingProjects.length > 0) {
      alerts.push(`সতর্কতা: ${agingProjects[0].name} প্রজেক্টের বয়স ${agingProjects[0].days} দিন পার হয়েছে। জমি প্রস্তুতির পরিকল্পনা করুন।`);
    }

    // 4. Critical Stock Level (Optional but good)
    const totalInventory = allProfiles.filter(p => p.type === 'stock').length;
    if (totalInventory > 0) {
      alerts.push(`স্টক আপডেট: আপনার বর্তমানে ${totalInventory}টি ভিন্ন ধরণের পণ্য স্টকে রয়েছে।`);
    }

    // Default to business-focused advice if no data-driven alerts
    return alerts.length > 0 ? alerts : ADVICE_LIST;
  }, [allProfiles]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const adviceTimer = setInterval(() => {
      setAdviceIndex((prev) => (prev + 1) % dynamicAdvice.length);
    }, 8000);
    return () => {
      clearInterval(timer);
      clearInterval(adviceTimer);
    };
  }, [dynamicAdvice.length]);

  const liveProfiles = allProfiles.filter(p => (p.status || 'live') === 'live' && p.type !== 'stock');
  
  const getMonthlyExpenses = (monthIdx: number) => {
    const expenses: { profileName: string; expense: any }[] = [];
    allProfiles.forEach(p => {
      // Regular expenses
      p.expenses.forEach(e => {
        const date = new Date(e.date);
        if (date.getMonth() === monthIdx) {
          expenses.push({ profileName: p.name, expense: e });
        }
      });
      // External stock purchases
      (p.stocks || []).forEach(s => {
        if (s.source === 'external') {
           const date = new Date(s.date);
           if (date.getMonth() === monthIdx) {
              expenses.push({ 
                profileName: p.name, 
                expense: {
                  date: s.date,
                  description: `স্টক ক্রয়: ${p.name}`,
                  amount: s.purchasePrice || 0,
                  category: 'stock',
                  due: 0
                }
              });
           }
        }
      });
    });
    return expenses.sort((a, b) => new Date(b.expense.date).getTime() - new Date(a.expense.date).getTime());
  };
  const totalInvestment = liveProfiles.reduce((sum, p) => {
    const expenseTotal = p.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const stockCost = (p.stocks || []).filter(s => s.source === 'external').reduce((acc, s) => acc + (s.purchasePrice || 0), 0);
    return sum + expenseTotal + stockCost;
  }, 0);
  const totalLiveIncome = liveProfiles.reduce((sum, p) => {
    const normalSales = (p.sales || []).reduce((s, sale) => s + sale.totalAmount, 0);
    const stockSales = (p.stockSales || []).reduce((s, sale) => s + sale.totalAmount, 0);
    return sum + normalSales + stockSales;
  }, 0);
  
  // Specifically separate stock profit
  const totalStockProfit = allProfiles.reduce((sum, p) => {
    const pStockProfit = (p.stockSales || []).reduce((sAcc, s) => {
      const stockEntry = (p.stocks || []).find(st => st.id === s.stockEntryId);
      const isExternal = p.type === 'stock' || stockEntry?.source === 'external';
      
      if (isExternal && stockEntry?.purchasePrice) {
        const totalBags = stockEntry.bags || 1;
        const totalQty = stockEntry.quantity || 1;
        const proportion = stockEntry.quantity > 0 ? (s.quantity / totalQty) : (s.bags / totalBags);
        const costBasis = stockEntry.purchasePrice * proportion;
        return sAcc + (s.totalAmount - costBasis);
      }
      
      // If no purchase price or internal, count full sale amount as revenue gain for this metric
      return sAcc + s.totalAmount;
    }, 0);
    return sum + pStockProfit;
  }, 0);

  const totalLiveProfit = totalLiveIncome - totalInvestment;
  
  // Calculate global stats (including archived) for a consistent "System ROI"
  // User explicitly requested to EXCLUDE stock types from system averages
  const systemAveragesProfiles = allProfiles.filter(p => p.type !== 'stock');
  
  const globalProfit = systemAveragesProfiles.reduce((sum, p) => {
    const normalSales = (p.sales || []).reduce((s, sale) => s + sale.totalAmount, 0);
    const stockSales = (p.stockSales || []).reduce((s, sale) => s + sale.totalAmount, 0);
    const totalSales = normalSales + stockSales;
    
    // For external stock, we subtract purchase price from revenue in Profit
    const stockCost = (p.stocks || []).filter(s => s.source === 'external').reduce((acc, s) => acc + (s.purchasePrice || 0), 0);
    
    return sum + (totalSales - (p.expenses.reduce((s, e) => s + (e.amount || 0), 0) + stockCost));
  }, 0);
  const totalSystemDays = systemAveragesProfiles.reduce((sum, p) => sum + calculateAge(p.startDate, p.archivedDate), 0) || 1;

  const getStats = (profit: number, days: number) => {
    const d = days || 1;
    const perDay = profit / d;
    
    // Calculate days in current month
    const now = new Date();
    const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    return {
      perHour: perDay / 24,
      perDay: perDay,
      perMonth: profit / daysInCurrentMonth,
      perYear: profit / 365
    };
  };

  const aggregateStats = getStats(globalProfit, totalSystemDays);

  const lastYearSameMonthLogs = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const lastYear = now.getFullYear() - 1;
    return weatherLogs.filter(log => {
      const d = new Date(log.date);
      return d.getMonth() === month && d.getFullYear() === lastYear;
    });
  }, [weatherLogs]);

  const twoYearsAgoSameMonthLogs = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const twoYearsAgo = now.getFullYear() - 2;
    return weatherLogs.filter(log => {
      const d = new Date(log.date);
      return d.getMonth() === month && d.getFullYear() === twoYearsAgo;
    });
  }, [weatherLogs]);

  const upcomingPlans = useMemo(() => {
    const now = new Date();
    return farmPlans
      .filter(p => p.status === 'pending' && new Date(p.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [farmPlans]);

  // Stock Analytics
  const stockStats = useMemo(() => {
    let cultivatedBags = 0;
    let externalBags = 0;
    let externalCost = 0;
    
    allProfiles.forEach(p => {
      const isExternalProfile = p.type === 'stock';
      (p.stocks || []).forEach(s => {
        const soldBags = (p.stockSales || []).filter(ss => ss.stockEntryId === s.id).reduce((sum, ss) => sum + ss.bags, 0);
        const soldQty = (p.stockSales || []).filter(ss => ss.stockEntryId === s.id).reduce((sum, ss) => sum + ss.quantity, 0);
        
        const remainingBags = Math.max(0, s.bags - soldBags);
        const remainingQty = Math.max(0, s.quantity - soldQty);
        
        if (remainingBags > 0 || remainingQty > 0) {
          if (isExternalProfile || s.source === 'external') {
            externalBags += remainingBags;
            if (s.purchasePrice && s.quantity > 0) {
              externalCost += (s.purchasePrice / s.quantity) * remainingQty;
            } else if (s.purchasePrice && s.bags > 0) {
              externalCost += (s.purchasePrice / s.bags) * remainingBags;
            }
          } else {
            cultivatedBags += remainingBags;
          }
        }
      });
    });

    return {
      cultivatedBags,
      externalBags,
      externalCost,
      totalBags: cultivatedBags + externalBags
    };
  }, [allProfiles]);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const getMonthlyTotal = (monthIdx: number) => {
    return allProfiles.reduce((sum, p) => {
      const expenseTotal = p.expenses
        .filter(e => new Date(e.date).getMonth() === monthIdx)
        .reduce((s, e) => s + (e.amount || 0), 0);
      
      const stockTotal = (p.stocks || [])
        .filter(s => s.source === 'external' && new Date(s.date).getMonth() === monthIdx)
        .reduce((s, st) => s + (st.purchasePrice || 0), 0);
        
      return sum + expenseTotal + stockTotal;
    }, 0);
  };

  const getTopExpensesOverall = () => {
    const categoryTotals: Record<string, number> = {};
    let totalAll = 0;

    liveProfiles.forEach(profile => {
      profile.expenses.forEach(expense => {
        const category = expense.category;
        categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
        totalAll += expense.amount;
      });
    });

    if (totalAll === 0) return [];

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        label: CATEGORY_LABELS[category] || category,
        amount,
        percentage: Math.round((amount / totalAll) * 100)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  };

  const getProjectExpenseBreakdown = (profile: CropProfile) => {
    const categoryTotals: Record<string, number> = {};
    let total = 0;

    profile.expenses.forEach(expense => {
      const category = expense.category;
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
      total += expense.amount;
    });

    if (total === 0) return [];

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: CATEGORY_LABELS[category] || category,
        value: amount,
        percentage: Math.round((amount / total) * 100)
      }))
      .sort((a, b) => b.value - a.value);
  };

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#ec4899', '#0ea5e9', '#d946ef', '#f472b6', '#a855f7'];

  const getTitle = () => {
    if (view === 'live') return 'চলমান প্রজেক্ট সমূহ';
    if (view === 'archived') return 'আর্কাইভকৃত প্রজেক্ট সমূহ';
    return 'রেজার খামার';
  };

  const getSubTitle = () => {
    if (view === 'live') return 'সংক্ষিপ্ত তালিকা';
    if (view === 'archived') return 'পুরাতন প্রজেক্ট আর্কাইভ';
    return 'Prime Agro Biotech';
  };

  return (
    <div className="flex flex-col bg-gray-50 p-3 sm:p-4 lg:p-8 space-y-5 sm:space-y-8 overflow-x-hidden">
      <main className="space-y-12">
        {/* প্রধান রিপোর্ট সেকশন - Only Dashboard */}
        {view === 'dashboard' && (
          <section className="bg-white rounded-2xl sm:rounded-[3rem] p-4 sm:p-8 lg:p-12 shadow-sm border border-gray-200 relative overflow-hidden group transition-all">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity dark:text-white group-hover:scale-110 transition-transform duration-700">
              <BarChart3 className="w-64 h-64" />
            </div>
            
            <div className="flex items-center gap-4 mb-10">
               <div className="w-1 h-8 bg-emerald-500 rounded-full" />
               <h2 style={{ color: "#111827" }} className="text-lg sm:text-2xl font-black tracking-tight uppercase">ব্যবসার সার্বিক চিত্র (Overview)</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12 items-center">
              <div className="flex flex-col md:flex-row items-center gap-10 bg-stone-50 dark:bg-white/5 p-6 rounded-[2rem] border border-stone-200 relative overflow-hidden group/live">
                <div className="absolute top-0 left-0 w-24 h-24 bg-secondary/10 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10 space-y-3 text-center md:text-left">
                  <p className="text-xs sm:text-xs font-black text-stone-700 dark:text-lime-400 uppercase tracking-[0.2em] leading-none mb-1">সচল প্রজেক্ট ভলিউম</p>
                  <p style={{ color: "#111827" }} className="text-4xl font-black tracking-tighter tabular-nums leading-none">
                    {liveProfiles.length.toString().padStart(2, '০')} 
                    <span className="text-lg text-stone-700 ml-2">টা</span>
                  </p>
                </div>
                {liveProfiles.length > 0 && (
                  <div className="h-32 w-32 shrink-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={liveProfiles.map((p, idx) => {
                            const expenseTotal = p.expenses.reduce((s, e) => s + (e.amount || 0), 0);
                            const stockCost = (p.stocks || []).filter(s => s.source === 'external').reduce((acc, s) => acc + (s.purchasePrice || 0), 0);
                            return {
                              name: p.name,
                              value: (expenseTotal + stockCost) || 1
                            };
                          })}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={6}
                          dataKey="value"
                        >
                          {liveProfiles.map((_, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                              stroke="transparent"
                              className="hover:scale-105 transition-transform duration-300"
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              
              <div className="md:pl-4 space-y-3">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-indigo-500/10 text-indigo-600 rounded-lg flex items-center justify-center">
                      <Banknote className="w-5 h-5" />
                   </div>
                   <p className="text-xs font-black text-stone-700 uppercase tracking-[0.2em] leading-none">চলমান সর্বমোট ইনভেষ্ট</p>
                </div>
                <div className="space-y-1">
                  <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter tabular-nums leading-none">
                     {(totalInvestment).toLocaleString('bn-BD')} 
                     <span className="text-sm text-stone-500 ml-2">টাকা</span>
                  </p>
                  <p className="text-xs font-bold text-indigo-700 mt-2 italic bg-indigo-50 dark:bg-indigo-900/10 px-3 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-900/20 w-fit">কথায়: {numberToBanglaWords(totalInvestment)}</p>
                </div>
              </div>
            </div>

            {/* System ROI Grid - Premium Enhanced */}
            <div className="mt-6 sm:mt-12 pt-8 sm:pt-10 border-t border-gray-200 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 overflow-visible">
               <div className="relative group/stat p-5 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] rounded-[2rem] border border-emerald-500/10 hover:border-emerald-500/30 transition-all flex flex-col items-center text-center">
                  <div className="absolute -top-4 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-emerald-100 group-hover/stat:rotate-12 transition-transform">
                     <Clock className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.1em] mb-2 leading-none mt-4">গড় মুনাফা (ঘণ্টা)</p>
                  <p className={`text-xl font-black ${aggregateStats.perHour >= 0 ? 'text-emerald-600' : 'text-red-500'} tracking-tight`}>{formatCurrency(aggregateStats.perHour)}</p>
               </div>
               
               <div className="relative group/stat p-5 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] rounded-[2rem] border border-emerald-500/10 hover:border-emerald-500/30 transition-all flex flex-col items-center text-center">
                  <div className="absolute -top-4 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-emerald-100 group-hover/stat:rotate-12 transition-transform">
                     <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.1em] mb-2 leading-none mt-4">গড় মুনাফা (দিন)</p>
                  <p className={`text-xl font-black ${aggregateStats.perDay >= 0 ? 'text-emerald-600' : 'text-red-500'} tracking-tight`}>{formatCurrency(aggregateStats.perDay)}</p>
               </div>
               
               <div className="relative group/stat p-5 bg-amber-500/[0.03] dark:bg-amber-500/[0.05] rounded-[2rem] border border-amber-500/10 hover:border-amber-500/30 transition-all flex flex-col items-center text-center">
                  <div className="absolute -top-4 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-amber-100 group-hover/stat:rotate-12 transition-transform">
                     <PieIcon className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="text-xs font-black text-amber-600 uppercase tracking-[0.1em] mb-2 leading-none mt-4">প্রাক্কলিত মুনাফা (মাস)</p>
                  <p className={`text-xl font-black ${aggregateStats.perMonth >= 0 ? 'text-amber-600' : 'text-red-500'} tracking-tight`}>{formatCurrency(aggregateStats.perMonth)}</p>
               </div>
               
               <div className="relative group/stat p-5 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05] rounded-[2rem] border border-indigo-500/10 hover:border-indigo-500/30 transition-all flex flex-col items-center text-center">
                  <div className="absolute -top-4 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg group-hover/stat:scale-110 transition-transform">
                     <Zap className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-black text-indigo-600 uppercase tracking-[0.1em] mb-2 leading-none mt-4">কেনা পণ্য স্টক লাভ</p>
                  <p className={`text-2xl font-black ${totalStockProfit >= 0 ? 'text-indigo-600' : 'text-red-500'} tracking-tight`}>{formatCurrency(totalStockProfit)}</p>
               </div>
            </div>

            {/* Detailed Stock Summary */}
            <div className="mt-6 sm:mt-12 group/stock relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 blur-xl opacity-0 group-hover/stock:opacity-100 transition-opacity rounded-[3rem]" />
              
              <div className="relative p-4 sm:p-8 lg:p-10 bg-white rounded-2xl sm:rounded-[3rem] border border-gray-200 shadow-sm overflow-hidden">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 sm:mb-10 gap-4 sm:gap-6">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-emerald-600/10 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                        <BarChart3 className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase tracking-tight leading-none">স্টক ইনভেন্টরি মাস্টার রিপোর্ট</h3>
                        <p className="text-xs sm:text-xs font-bold text-stone-700 uppercase tracking-[0.2em] mt-1.5">Real-time Stock Valuation & Storage Tracking</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-4 p-4 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                      <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-xs font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">মোট স্টক মূল্য (Investment)</p>
                         <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(stockStats.externalCost)}</p>
                      </div>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-10">
                    <div className="p-5 sm:p-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl sm:rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group/card transition-all hover:scale-[1.02] min-h-0">
                       <Sprout className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 group-hover/card:rotate-12 transition-transform" />
                       <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-2">নিজস্ব আবাদ</p>
                       <div className="flex items-baseline gap-3">
                         <span className="text-3xl sm:text-5xl font-black">{(stockStats.cultivatedBags).toLocaleString('bn-BD')}</span>
                         <span className="text-lg font-bold opacity-60">বস্তা</span>
                       </div>
                       <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2">
                          <Zap className="w-3 h-3 text-lime-400" />
                          <p className="text-xs font-black uppercase tracking-widest text-emerald-100">ইনভেন্টরি রেডিনেস হাই</p>
                       </div>
                    </div>

                    <div className="p-5 sm:p-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl sm:rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group/card transition-all hover:scale-[1.02] min-h-0">
                       <Plus className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 group-hover/card:rotate-12 transition-transform" />
                       <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-2">কেনা পণ্য স্টক</p>
                       <div className="flex items-baseline gap-3">
                         <span className="text-3xl sm:text-5xl font-black">{(stockStats.externalBags).toLocaleString('bn-BD')}</span>
                         <span className="text-lg font-bold opacity-60">বস্তা</span>
                       </div>
                       <div className="mt-6 pt-4 border-t border-white/10">
                          <p className="text-xs font-black uppercase tracking-widest text-indigo-100">অ্যাভারেজ কস্ট মডেলিং সক্রিয়</p>
                       </div>
                    </div>

                    <div className="p-5 sm:p-8 bg-white rounded-2xl sm:rounded-[2.5rem] border-2 border-stone-200 dark:border-white/5 shadow-premium flex flex-col justify-center relative overflow-hidden group/card transition-all hover:scale-[1.02] min-h-0">
                       <div className="absolute top-0 right-0 p-6 opacity-5 group-hover/card:opacity-10 transition-opacity">
                         <PieIcon className="w-24 h-24" />
                       </div>
                       <p className="text-xs sm:text-xs font-black text-stone-700 uppercase tracking-[0.3em] mb-2">সর্বমোট মজুদ (Total)</p>
                       <div className="flex items-baseline gap-3">
                         <span className="text-4xl sm:text-6xl font-black text-stone-900 dark:text-white">{(stockStats.totalBags).toLocaleString('bn-BD')}</span>
                         <span className="text-xl font-bold text-stone-700">বস্তা/টি</span>
                       </div>
                    </div>
                 </div>

                 {/* Product break-down in stock */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-3 px-4">
                       <h4 className="text-xs sm:text-xs font-black text-stone-700 uppercase tracking-[0.4em]">পণ্য ভিত্তিক মজুদের তালিকা (Breakdown)</h4>
                       <div className="flex-1 h-px bg-stone-50" />
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                       {allProfiles.map(p => {
                         const profileRemainingBags = (p.stocks || []).reduce((sum, s) => {
                           const soldBags = (p.stockSales || []).filter(ss => ss.stockEntryId === s.id).reduce((acc, ss) => acc + ss.bags, 0);
                           return sum + Math.max(0, s.bags - soldBags);
                         }, 0);

                         if (profileRemainingBags <= 0) return null;

                         return (
                           <div key={p.id} className="p-5 bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-active hover:-translate-y-1 transition-all group overflow-hidden relative">
                             <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-stone-50 rounded-full scale-0 group-hover:scale-100 transition-transform" />
                             
                             <div className="flex justify-between items-start mb-3">
                                <div className="w-8 h-8 bg-stone-50 rounded-xl flex items-center justify-center text-stone-700 group-hover:text-[#1e211f] transition-colors">
                                   <Zap className="w-4 h-4" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-stone-700 group-hover:text-[#1e211f] transition-colors hover:rotate-45" />
                             </div>
                             
                             <p className="text-xs font-black text-stone-700 uppercase tracking-widest group-hover:text-stone-700 transition-colors">{p.name}</p>
                             <div className="flex items-baseline gap-1.5 mt-1">
                                <p className="text-xl font-black text-stone-900 dark:text-white leading-none">
                                   {profileRemainingBags.toLocaleString('bn-BD')}
                                </p>
                                <span className="text-xs sm:text-xs font-bold text-stone-700">বস্তা</span>
                             </div>
                             
                             <div className="mt-4 h-1.5 w-full bg-stone-50 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: '70%' }}
                                  className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full" 
                                />
                             </div>
                           </div>
                         );
                       })}
                    </div>
                 </div>
              </div>
            </div>
          </section>
        )}

        {/* Weather & Plans Briefing */}
        {view === 'dashboard' && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            <div
              onClick={onViewWeather}
              className="p-5 sm:p-8 bg-gradient-to-r from-primary to-primary/80 rounded-2xl sm:rounded-[3rem] shadow-premium border border-primary/20 relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform">
                <CloudSun className="w-32 h-32 text-white" />
              </div>
              <div className="relative z-10 flex flex-col justify-between h-full gap-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <CloudSun className="w-6 h-6 text-lime-400" />
                    আবহাওয়া লগার
                  </h2>
                  <p className="text-white/60 font-bold">
                    গত ২ বছরের পূর্বজ্ঞান এবং আজকের মন্তব্য লিখুন।
                  </p>
                </div>
                
                {(lastYearSameMonthLogs.length > 0 || twoYearsAgoSameMonthLogs.length > 0) ? (
                  <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/20">
                    <p className="text-xs font-black text-lime-400 uppercase tracking-[0.2em] mb-2 leading-none">ইতিহাস থেকে:</p>
                    <div className="space-y-1">
                      {lastYearSameMonthLogs.length > 0 && (
                        <p className="text-xs text-white font-bold truncate">
                          ১ বছর আগে: {lastYearSameMonthLogs[0].comment}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">কোন রেকর্ড নেই</div>
                )}
              </div>
            </div>

            <div
              onClick={onViewPlans}
              className="p-5 sm:p-8 bg-white dark:bg-white/5 rounded-2xl sm:rounded-[3rem] shadow-premium border border-gray-200 relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-32 h-32 text-[#1e211f]" />
              </div>
              <div className="relative z-10 flex flex-col justify-between h-full gap-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-stone-900 dark:text-white flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-emerald-600 dark:text-lime-300" />
                    চাষাবাদ পরিকল্পনা
                  </h2>
                  <p className="text-stone-700 font-bold">
                    আপনার ভবিষ্যৎ চাষাবাদ ও কার্যক্রমের তালিকা করুন।
                  </p>
                </div>
                
                {upcomingPlans.length > 0 ? (
                  <div className="bg-gray-50 dark:bg-black/20 rounded-3xl p-4 border border-gray-200">
                    <p className="text-xs font-black text-[#1e211f] uppercase tracking-[0.2em] mb-2 leading-none">সামনের পরিকল্পনা:</p>
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-1 bg-primary text-white text-xs font-black rounded-lg">
                        {new Date(upcomingPlans[0].date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                      </div>
                      <p className="text-xs font-black truncate dark:text-white">{upcomingPlans[0].activity}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs font-black text-stone-700 uppercase tracking-[0.2em]">নতুন পরিকল্পনা যুক্ত করুন</div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ক্রপ কার্ডস (ভুট্টা, আলু, ধান) */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-[#1e211f] flex items-center gap-3">
               {view === 'archived' ? 'আর্কাইভকৃত প্রজেক্ট:' : 'চলমান প্রজেক্ট:'}
            </h2>
            {view !== 'archived' && (
              <button 
                onClick={onAddProfile} 
                className="bg-secondary text-[#1e211f] px-5 py-3 rounded-2xl shadow-lg hover:shadow-secondary/50 font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> নিউ প্রজেক্ট
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {profiles.map((p, i) => {
              const spent = p.expenses.reduce((s, e) => s + (e.amount || 0), 0);
              const normalSales = (p.sales || []).reduce((sum, s) => sum + s.totalAmount, 0);
              const stockSales = (p.stockSales || []).reduce((sum, s) => sum + s.totalAmount, 0);
              const income = normalSales + stockSales;
              const profit = income - spent;
              const days = calculateAge(p.startDate, p.archivedDate) || 1;
              const stats = getStats(profit, days);
              
              // Handle Bengali digits and decimals
              const bengaliToEnglish = (str: string) => str.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d).toString());
              const sizeRaw = p.landSize ? bengaliToEnglish(p.landSize) : '1';
              const sizeMatch = sizeRaw.match(/(\d+(\.\d+)?)/);
              const bigha = sizeMatch ? parseFloat(sizeMatch[0]) : 1;
              const perBigha = Math.round(spent / bigha);

              return (
                <motion.div 
                  key={p.id}
                  whileHover={{ y: -12 }}
                  onClick={() => onSelectProfile(p.id)}
                  className={`rounded-2xl sm:rounded-[3rem] p-5 sm:p-8 lg:p-10 text-white shadow-2xl relative overflow-hidden cursor-pointer group ${
                    i % 3 === 0 ? 'bg-gradient-to-br from-[#2D5A27] to-[#1B3022]' :
                    i % 3 === 1 ? 'bg-gradient-to-br from-[#C4841D] to-[#634413]' :
                    'bg-gradient-to-br from-[#1E4D92] to-[#0F2646]'
                  }`}
                >
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <Sprout className="w-20 h-20" />
                  </div>
                  <div className="relative z-10 space-y-5 sm:space-y-10">
                    <h3 className="text-xl sm:text-3xl font-black tracking-tight">{p.name}</h3>
                    <div className="space-y-4 sm:space-y-6">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-50 mb-1">মোট ইনভেষ্ট</p>
                        <p className="text-2xl sm:text-3xl font-black">{formatCurrency(spent)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-50 mb-1">বয়স</p>
                        <p className="text-lg font-bold">{getBengaliAge(p.startDate, p.archivedDate)}</p>
                      </div>
                      <div className="pt-6 border-t border-white/10">
                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-50 mb-1">বিঘা প্রতি খরচ</p>
                        <p className="text-xl font-black">{formatCurrency(perBigha)} <span className="text-xs font-medium opacity-50">/ বিঘা</span></p>
                      </div>
                      <div className="pt-4 grid grid-cols-2 gap-4">
                         <div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-500">দৈনিক লাভ/ক্ষতি</p>
                            <p className="text-sm font-black">{formatCurrency(stats.perDay)}</p>
                         </div>
                         <div>
                            <p className="text-xs sm:text-[8px] font-black uppercase tracking-widest text-gray-500">মাসিক গড়</p>
                            <p className="text-sm font-black">{formatCurrency(stats.perMonth)}</p>
                         </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {profiles.length === 0 && view !== 'archived' && (
              <div 
                onClick={onAddProfile} 
                className="md:col-span-3 h-64 border-4 border-dashed border-gray-200 rounded-[3rem] flex flex-col items-center justify-center text-stone-700 hover:border-secondary hover:text-[#1e211f] transition-all cursor-pointer group"
              >
                <Plus className="w-12 h-12 mb-4 group-hover:scale-125 transition-transform" />
                <p className="text-sm font-black uppercase tracking-[0.3em]">নতুন প্রজেক্ট যোগ করুন</p>
              </div>
            )}
            {profiles.length === 0 && view === 'archived' && (
              <div className="md:col-span-3 h-64 border-4 border-dashed border-gray-200 rounded-[3rem] flex flex-col items-center justify-center text-stone-700">
                <p className="text-sm font-black uppercase tracking-[0.3em]">কোনো আর্কাইভ প্রজেক্ট নেই</p>
              </div>
            )}
          </div>
        </section>

        {/* মাস ভিত্তিক রিপোর্ট & অন্যান্য সেকশন - Only Dashboard */}
        {view === 'dashboard' && (
          <>
            <section className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
                <h2 className="text-2xl font-black text-stone-900 dark:text-white">মাস ভিত্তিক রিপোর্ট:</h2>
                {/* Advice Section */}
                <div className="flex-1 max-w-2xl w-full">
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-0.5">কৃষি পরামর্শ (Advice)</p>
                      <AnimatePresence mode="wait">
                        <motion.p 
                          key={adviceIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-xs font-bold text-stone-900 dark:text-white/80 leading-relaxed truncate"
                        >
                          {dynamicAdvice[adviceIndex]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 sm:pb-6 no-scrollbar -mx-2 px-2">
                {months.map((m, i) => {
                  const total = getMonthlyTotal(i);
                  const hasInvestment = total > 0;
                  const BAR_COLORS = ['#d9f35c', '#34d399', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#fbbf24', '#059669'];
                  const isSelected = selectedMonthIndex === i;
                  return (
                    <button
                      key={m}
                      onClick={() => setSelectedMonthIndex(isSelected ? null : i)}
                      className={`min-w-[120px] sm:min-w-[160px] bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 border hover:border-primary transition-all flex flex-col items-center gap-4 sm:gap-6 ${isSelected ? 'border-primary ring-4 ring-primary/5 shadow-active' : 'border-gray-200 shadow-premium'} ${!hasInvestment && 'opacity-50'}`}
                    >
                      <p className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-widest">{m}</p>
                      <div className="h-32 w-10 bg-gray-50/50 dark:bg-black/20 rounded-full flex items-end overflow-hidden p-1">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.min(100, (total / 20000) * 100)}%` }}
                          className="w-full rounded-full"
                          style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-black text-stone-700 dark:text-white/30 uppercase tracking-[0.2em] mb-1">Total invest</p>
                        <p className="text-xl font-black text-[#1e211f] dark:text-lime-300">{formatCurrency(total)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Monthly Details Modal */}
              <AnimatePresence>
                {selectedMonthIndex !== null && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedMonthIndex(null)}
                      className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="bg-white rounded-2xl sm:rounded-[3.5rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden"
                    >
                      <div className="p-5 sm:p-10 border-b border-gray-200 flex items-center justify-between bg-gray-50/20">
                        <div>
                          <h3 className="text-3xl font-black text-[#1e211f] leading-none">{months[selectedMonthIndex]} মাসের খরচ রিপোর্ট</h3>
                          <p className="text-xs font-bold text-stone-700 uppercase tracking-[0.2em] mt-3">Itemized Expense History</p>
                        </div>
                        <button 
                           onClick={() => setSelectedMonthIndex(null)}
                           className="w-14 h-14 bg-white hover:bg-red-50 text-red-400 rounded-2xl shadow-sm border border-gray-200 transition-all flex items-center justify-center"
                        >
                           <XIcon className="w-8 h-8" />
                        </button>
                      </div>

                      <div className="p-4 sm:p-10 overflow-y-auto max-h-[60vh] space-y-3 sm:space-y-4 no-scrollbar">
                        {getMonthlyExpenses(selectedMonthIndex).length > 0 ? (
                          getMonthlyExpenses(selectedMonthIndex).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-3xl hover:border-primary transition-all group">
                              <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-[#1e211f] group-hover:scale-110 transition-transform">
                                   <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-3">
                                    <p className="font-black text-[#1e211f] text-lg">{item.expense.description}</p>
                                    <span className="text-xs font-black text-white bg-primary/30 px-2.5 py-1 rounded-full uppercase tracking-widest">{item.profileName}</span>
                                  </div>
                                  <p className="text-xs sm:text-xs font-bold text-stone-700 uppercase tracking-[0.2em] mt-1">
                                     {new Date(item.expense.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-2xl font-black text-[#1e211f] leading-none">{formatCurrency(item.expense.amount)}</p>
                                 {item.expense.due > 0 && (
                                   <p className="text-xs sm:text-xs font-black text-red-500 uppercase tracking-widest mt-2">বকেয়া: {formatCurrency(item.expense.due)}</p>
                                 )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-24 text-center text-gray-400">
                            <AlertCircle className="w-20 h-20 mx-auto mb-6" />
                            <p className="text-lg font-black uppercase tracking-[0.4em]">No data records</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-5 sm:p-10 bg-primary text-white flex justify-between items-center">
                         <span className="text-xs font-black uppercase tracking-widest text-gray-600">মাসিক মোট ইনভেষ্টমেন্ট</span>
                         <span className="text-3xl font-black">{formatCurrency(getMonthlyTotal(selectedMonthIndex))}</span>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12">
              <section className="space-y-8">
                <h2 className="text-2xl font-black text-[#1e211f] px-2">কোন খাতে সর্বোচ্চ ব্যয়:</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(() => {
                    const topExpenses = getTopExpensesOverall();
                    if (topExpenses.length === 0) {
                      return (
                        <div className="col-span-full bg-white rounded-3xl p-8 border border-dashed border-gray-200 text-center text-stone-700">
                          <p className="text-xs sm:text-xs font-black uppercase tracking-widest">ব্যয় সংক্রান্ত কোনো তথ্য নেই</p>
                        </div>
                      );
                    }
                    return topExpenses.slice(0, 4).map((expense, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-primary transition-all group">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs sm:text-xs font-black text-stone-700 uppercase tracking-widest">{expense.label}</p>
                          <span className="text-xs sm:text-xs font-black text-[#1e211f]">{expense.percentage}%</span>
                        </div>
                        <p className="text-lg font-black text-[#1e211f] leading-none">{formatCurrency(expense.amount)}</p>
                        <div className="mt-3 w-full h-1 bg-stone-50 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${expense.percentage}%` }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </section>

              <section className="space-y-8">
                <h2 className="text-2xl font-black text-[#1e211f] px-2">লাভ ও ক্ষতি (Net Earnings):</h2>
                
                {/* Overall Summary Card */}
                {(() => {
                  const totalInvested = profiles.reduce((sum, p) => sum + p.expenses.reduce((s, e) => s + (e.amount || 0), 0), 0);
                  const totalRevenue = profiles.reduce((sum, p) => {
                    const normalSales = (p.sales || []).reduce((s, sale) => s + sale.totalAmount, 0);
                    const stockSales = (p.stockSales || []).filter(s => {
                       const stockEntry = (p.stocks || []).find(st => st.id === s.stockEntryId);
                       return p.type === 'stock' || stockEntry?.source === 'external';
                    }).reduce((s, sale) => s + sale.totalAmount, 0);
                    return sum + normalSales + stockSales;
                  }, 0);
                  const overallProfit = totalRevenue - totalInvested;
                  const overallProfitPercentage = totalInvested > 0 ? (overallProfit / totalInvested) * 100 : 0;
                  const isOverallProfit = overallProfit >= 0;

                  return (
                    <div className={`rounded-[2.5rem] p-8 lg:p-10 shadow-premium border relative overflow-hidden group transition-all hover:scale-[1.01] ${isOverallProfit ? 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50 border-emerald-100' : 'bg-gradient-to-br from-red-50 via-white to-red-50 border-red-100'}`}>
                       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                          {isOverallProfit ? <TrendingUp className="w-40 h-40 text-emerald-500" /> : <TrendingDown className="w-40 h-40 text-red-500" />}
                       </div>
                       
                       <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                          <div className="flex-1 space-y-4 text-center lg:text-left">
                             <div>
                               <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${isOverallProfit ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                     {isOverallProfit ? <Sparkles className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                  </div>
                                  <p className={`text-xs sm:text-xs font-black uppercase tracking-[0.3em] ${isOverallProfit ? 'text-emerald-600' : 'text-red-600'}`}>সর্বমোট নিট লাভ/ক্ষতি</p>
                               </div>
                               <h3 className={`text-4xl lg:text-5xl font-black tracking-tight leading-none mb-4 ${isOverallProfit ? 'text-emerald-700' : 'text-red-700'}`}>
                                  {formatCurrency(overallProfit)}
                               </h3>
                             </div>
                             
                             <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                                <div className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg ${isOverallProfit ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'}`}>
                                   {overallProfitPercentage.toFixed(1)}% {isOverallProfit ? 'PROFIT' : 'LOSS'}
                                </div>
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-auto">
                             <div className="bg-white/90 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-premium flex flex-col items-center justify-center min-w-[160px] group/item hover:-translate-y-1 transition-all">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-700 mb-2">মোট বিনিয়োগ</p>
                                <p className="text-xl font-black text-[#1e211f] leading-none">{formatCurrency(totalInvested)}</p>
                                <div className="mt-3 w-full h-1 bg-stone-50 rounded-full" />
                             </div>
                             <div className="bg-white/90 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-premium flex flex-col items-center justify-center min-w-[160px] group/item hover:-translate-y-1 transition-all">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600/30 mb-2">মোট বিক্রয়</p>
                                <p className="text-xl font-black text-emerald-600 leading-none">{formatCurrency(totalRevenue)}</p>
                                <div className="mt-3 w-full h-1 bg-emerald-100 rounded-full" />
                             </div>
                          </div>
                       </div>
                    </div>
                  );
                })()}

                <div className="space-y-4">
                  {profiles.slice(0, 3).map((p) => {
                    const invest = p.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
                    const normalSales = (p.sales || []).reduce((sum, sale) => sum + sale.totalAmount, 0);
                    const stockSales = (p.stockSales || []).reduce((sum, sale) => sum + sale.totalAmount, 0);
                    const saleTotal = normalSales + stockSales;
                    const profit = saleTotal - invest;
                    const isProfit = profit >= 0;

                    return (
                      <div key={p.id} className="bg-white rounded-[2rem] p-6 shadow-premium border border-gray-200 flex flex-col gap-4 relative overflow-hidden group">
                         <div className="flex justify-between items-center relative z-10">
                            <div>
                               <h3 className="text-xl font-black text-[#1e211f]">{p.name}</h3>
                               <p className="text-xs font-bold text-stone-700 uppercase tracking-widest mt-1">Status: {p.type}</p>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-widest ${isProfit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                               {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                               {isProfit ? 'Profit' : 'Loss'}
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-6 relative z-10">
                            <div>
                               <p className="text-xs font-black text-stone-700 uppercase tracking-widest mb-1">Invest</p>
                               <p className="text-lg font-bold text-[#1e211f] leading-none">{formatCurrency(invest)}</p>
                            </div>
                            <div>
                               <p className="text-xs font-black text-stone-700 uppercase tracking-widest mb-1">Sales</p>
                               <p className="text-lg font-bold text-emerald-600 leading-none">{formatCurrency(saleTotal)}</p>
                            </div>
                         </div>

                         <div className={`p-4 rounded-2xl flex justify-between items-center relative z-10 ${isProfit ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                            <span className="font-black text-xs uppercase tracking-widest opacity-80">Net Earnings:</span>
                            <div className="text-right">
                               <span className="text-lg font-black tracking-tight block">{formatCurrency(profit)}</span>
                            </div>
                         </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="pt-20 pb-10 flex flex-col md:flex-row items-center justify-center gap-6 border-t border-gray-200 opacity-40 dark:text-white/40">
        <p className="text-xs sm:text-xs font-black uppercase tracking-widest">© 2026 Prime Agro Biotech • Professional Agriculture Management</p>
      </footer>
    </div>
  );
}
