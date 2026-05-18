import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieChartIcon, 
  BarChart2, 
  Zap,
  LayoutDashboard,
  Calendar,
  Clock,
  ArrowUpRight,
  Calculator,
  Briefcase
} from 'lucide-react';
import { motion } from 'motion/react';
import { CropProfile, CATEGORY_LABELS } from '../types';
import { formatCurrency, calculateAge } from '../lib/storage';
import { numberToBanglaWords } from '../lib/numberToWords';

interface AnalyticsProps {
  profiles: CropProfile[];
  onOpenSidebar: () => void;
}

const COLORS = ['#d9f35c', '#34d399', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#fbbf24', '#059669', '#1e211f', '#475569', '#6366f1'];

export default function Analytics({ profiles, onOpenSidebar }: AnalyticsProps) {
  // 1. Core Totals
  const totalActiveSales = profiles.filter(p => (p.status || 'live') === 'live' && p.type !== 'stock').reduce((acc, p) => {
    const normalSales = (p.sales || []).reduce((sum, s) => sum + s.totalAmount, 0);
    const stockSales = (p.stockSales || []).reduce((sum, s) => sum + s.totalAmount, 0);
    return acc + normalSales + stockSales;
  }, 0);
  const totalActiveExpenses = profiles.filter(p => (p.status || 'live') === 'live' && p.type !== 'stock').reduce((acc, p) => 
    acc + p.expenses.reduce((eAcc, e) => eAcc + e.amount, 0), 0
  );
  const totalActiveProfit = totalActiveSales - totalActiveExpenses;

  // Filter for non-stock profiles for cultivation averages
  const cultivationProfiles = profiles.filter(p => p.type !== 'stock');

  const totalIncome = cultivationProfiles.reduce((acc, p) => {
    const normalSales = (p.sales || []).reduce((sum, s) => sum + s.totalAmount, 0);
    const stockSales = (p.stockSales || []).reduce((sum, s) => sum + s.totalAmount, 0);
    return acc + normalSales + stockSales;
  }, 0);

  const totalExternalStockCost = cultivationProfiles.reduce((acc, p) => 
    acc + (p.stocks || []).filter(s => s.source === 'external').reduce((stAcc, st) => stAcc + (st.purchasePrice || 0), 0)
  , 0);

  const totalExpenses = cultivationProfiles.reduce((acc, p) => 
    acc + p.expenses.reduce((eAcc, e) => eAcc + e.amount, 0), 0
  ) + totalExternalStockCost;

  const totalProfit = totalIncome - totalExpenses;
  const isProfitable = totalProfit >= 0;

  // 1.1 Detailed Stock Analytics for Dashboard/Analytics integration
  const stockStats = React.useMemo(() => {
    let cultivatedBags = 0;
    let externalBags = 0;
    let externalCost = 0;
    
    profiles.forEach(p => {
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
      totalBags: cultivatedBags + externalBags,
    };
  }, [profiles]);

  // Specifically track stock profit for charts
  const stockProfitsByMonth = Array.from({ length: 6 }).map((_, i) => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - (5 - i));
    const monthIndex = targetDate.getMonth();
    
    return profiles.reduce((acc, p) => {
      const monthStockSales = (p.stockSales || []).filter(s => new Date(s.date).getMonth() === monthIndex);
      return acc + monthStockSales.reduce((sAcc, s) => {
        const stockEntry = (p.stocks || []).find(st => st.id === s.stockEntryId);
        const isExternal = p.type === 'stock' || stockEntry?.source === 'external';
        
        if (isExternal) {
          if (stockEntry?.purchasePrice) {
            const totalBags = stockEntry.bags || 1;
            const totalQty = stockEntry.quantity || 1;
            const proportion = stockEntry.quantity > 0 ? (s.quantity / totalQty) : (s.bags / totalBags);
            const costBasis = stockEntry.purchasePrice * proportion;
            return sAcc + (s.totalAmount - costBasis);
          }
          return sAcc + s.totalAmount;
        }
        return sAcc + s.totalAmount; // For internal, full amount is profit relative to stock
      }, 0);
    }, 0);
  });


  // 2. Aggregate Stats Calculations
  const getStatsForDuration = (profit: number, days: number) => {
    const validDays = days || 1;
    const perDay = profit / validDays;
    const perHour = perDay / 24;
    
    // Calculate days in current month
    const now = new Date();
    const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    // User requested: Total Profit / Total days of month (e.g. 10000 / 31)
    const perMonth = profit / daysInCurrentMonth;
    const perYear = profit / 365;
    return { perHour, perDay, perMonth, perYear };
  };

  // Calculate aggregate days (sum of project durations)
  const totalSystemDays = cultivationProfiles.reduce((acc, p) => acc + calculateAge(p.startDate, p.archivedDate), 0) || 1;
  const globalRates = getStatsForDuration(totalProfit, totalSystemDays);

  // 3. Project Performance Mapping
  const allPerformance = profiles.map(p => {
    const expenses = p.expenses.reduce((acc, e) => acc + e.amount, 0);
    const normalSales = (p.sales || []).reduce((sum, s) => sum + s.totalAmount, 0);
    const stockSales = (p.stockSales || []).reduce((sum, s) => sum + s.totalAmount, 0);
    const income = normalSales + stockSales;
    const profit = income - expenses;
    const days = calculateAge(p.startDate, p.archivedDate) || 1;
    const rates = getStatsForDuration(profit, days);
    
    return {
      id: p.id,
      name: p.name,
      expenses,
      income,
      profit,
      days,
      rates,
      status: p.status || 'live'
    };
  }).filter(p => p.expenses > 0 || p.income > 0);

  const liveProjects = allPerformance.filter(p => p.status === 'live');
  const archivedProjects = allPerformance.filter(p => p.status === 'archived');

  // 4. Category Breakdown
  const categoryData: Record<string, number> = {};
  cultivationProfiles.forEach(p => {
    p.expenses.forEach(e => {
      const label = CATEGORY_LABELS[e.category] || e.category;
      categoryData[label] = (categoryData[label] || 0) + e.amount;
    });
  });

  const pieData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 5. Monthly Performance (Detailed breakdown including sales)
  const monthlyPerf = Array.from({ length: 8 }, (_, i) => {
    const monthIndex = i;
    const monthNames = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট'];
    
    // Expenses in this month
    const mExpenses = cultivationProfiles.reduce((acc, p) => {
      const monthExpenses = p.expenses.filter(e => new Date(e.date).getMonth() === monthIndex);
      return acc + monthExpenses.reduce((eAcc, e) => eAcc + e.amount, 0);
    }, 0);

    // Sales in this month
    const mIncome = cultivationProfiles.reduce((acc, p) => {
      const monthSales = (p.sales || []).filter(s => new Date(s.date).getMonth() === monthIndex);
      const monthStockSales = (p.stockSales || []).filter(s => new Date(s.date).getMonth() === monthIndex);
      const totalSales = monthSales.reduce((sAcc, s) => sAcc + s.totalAmount, 0) + monthStockSales.reduce((sAcc, s) => sAcc + s.totalAmount, 0);
      return acc + totalSales;
    }, 0);

    return {
      name: monthNames[i],
      expense: mExpenses,
      income: mIncome,
      profit: mIncome - mExpenses
    };
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FDFEFA]">
      <header className="sticky top-0 z-30 bg-[#FDFEFA]/80 backdrop-blur-md border-b border-border-subtle p-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={onOpenSidebar}
            className="lg:hidden p-3 bg-white rounded-2xl shadow-sm border border-border-subtle transition-all hover:bg-emerald-50"
          >
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </button>
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-white rounded-2xl p-1.5 shadow-sm border border-border-subtle">
               <img src="/portal-logo.png" alt="Prime Agro Biotech Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-primary font-display tracking-tight leading-none">সার্বিক বিশ্লেষণ (Analytics)</h1>
              <p className="text-sm font-bold text-emerald-600 uppercase tracking-[0.2em] mt-2 pl-1">Profit/Loss Dynamics & Global Performance</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8 lg:p-12 space-y-12 pb-24 max-w-7xl mx-auto w-full">
        {/* Top Stats - High Impact Bento Style */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-border-subtle group transition-all">
            <p className="text-[10px] font-black text-primary/30 uppercase tracking-[0.25em] mb-4">মোট বিনিয়োগ (সচল)</p>
            <h3 className="text-3xl font-black text-primary tracking-tighter tabular-nums leading-none">{formatCurrency(totalActiveExpenses)}</h3>
            <p className="text-[10px] font-bold text-primary/20 mt-1 italic">{numberToBanglaWords(totalActiveExpenses)}</p>
            <div className="flex items-center gap-1 mt-4">
               <Briefcase className="w-3 h-3 text-primary/20" />
               <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">{profiles.filter(p => (p.status || 'live') === 'live').length} টি সচল প্রজেক্ট</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-border-subtle group transition-all">
            <p className="text-[10px] font-black text-primary/30 uppercase tracking-[0.25em] mb-4">মোট বিক্রয় (সচল)</p>
            <h3 className="text-3xl font-black text-emerald-600 tracking-tighter tabular-nums leading-none">{formatCurrency(totalActiveSales)}</h3>
            <p className="text-[10px] font-bold text-emerald-600/30 mt-1 italic">{numberToBanglaWords(totalActiveSales)}</p>
            <div className="flex items-center gap-1 mt-4">
               <TrendingUp className="w-3 h-3 text-emerald-500/40" />
               <span className="text-[10px] font-black text-emerald-500/40 uppercase tracking-widest">Active Sales</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-border-subtle group transition-all">
            <p className="text-[10px] font-black text-primary/30 uppercase tracking-[0.25em] mb-4">মোট লাভ/ক্ষতি (সচল)</p>
            <h3 className={`text-3xl font-black tracking-tighter tabular-nums leading-none ${totalActiveProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
               {formatCurrency(Math.abs(totalActiveProfit))}
            </h3>
            <p className={`text-[10px] font-bold mt-1 italic ${totalActiveProfit >= 0 ? 'text-emerald-600/30' : 'text-red-500/30'}`}>
              {numberToBanglaWords(Math.abs(totalActiveProfit))}
            </p>
            <p className={`text-[10px] font-black mt-4 uppercase tracking-[0.2em] ${totalActiveProfit >= 0 ? 'text-emerald-500/40' : 'text-red-500/40'}`}>
               {totalActiveProfit >= 0 ? 'নীট মুনাফা অর্জিত' : 'নীট লোকসান হয়েছে'}
            </p>
          </div>

          <div className="bg-primary p-8 rounded-[2.5rem] shadow-premium group transition-all text-white relative overflow-hidden">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] mb-4">সব সময়ের লাভ/ক্ষতি (Global)</p>
            <h3 className={`text-3xl font-black tracking-tighter leading-none ${totalProfit >= 0 ? 'text-secondary' : 'text-red-400'}`}>
               {formatCurrency(Math.abs(totalProfit))}
            </h3>
            <p className={`text-[10px] font-bold mt-1 italic ${totalProfit >= 0 ? 'text-secondary/40' : 'text-red-400/40'}`}>
              {numberToBanglaWords(Math.abs(totalProfit))}
            </p>
            <div className="mt-4 flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${totalProfit >= 0 ? 'bg-secondary' : 'bg-red-400'} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
               <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{totalProfit >= 0 ? 'Total System Growth' : 'Total System Deficit'}</p>
            </div>
            <BarChart2 className="absolute -right-4 -bottom-4 w-24 h-24 opacity-[0.05] -rotate-12" />
          </div>
        </div>

        {/* Detailed Stock Report - New Section */}
        <div className="bg-white rounded-[3.5rem] p-12 shadow-premium border border-border-subtle grid grid-cols-1 md:grid-cols-4 gap-12 items-center">
           <div className="md:col-span-1 border-r border-border-subtle pr-8 flex flex-col gap-3">
              <h3 className="text-2xl font-black text-primary leading-none tracking-tight">স্টক বিশ্লেষণ</h3>
              <p className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em]">Detailed Inventory Analysis</p>
              <div className="mt-4 p-4 bg-bg-page rounded-2xl flex items-center gap-3">
                 <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Clock className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-primary/40 uppercase tracking-widest leading-none mb-1">Aging Warning</p>
                    <p className="text-xs font-bold text-primary leading-none">৯০ দিনের বেশি স্টক চেক করুন</p>
                 </div>
              </div>
           </div>
           <div className="md:col-span-1 space-y-4">
              <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest">নিজস্ব আবাদ স্টক</p>
              <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black text-primary">{(stockStats.cultivatedBags).toLocaleString('bn-BD')}</span>
                 <span className="text-xs font-bold text-primary/40">বস্তা</span>
              </div>
              <div className="h-1.5 w-full bg-bg-page rounded-full overflow-hidden">
                 <div className="h-full bg-primary rounded-full" style={{ width: `${(stockStats.cultivatedBags / (stockStats.totalBags || 1)) * 100}%` }} />
              </div>
           </div>
           <div className="md:col-span-1 space-y-4">
              <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest text-indigo-500">বাইরে থেকে কেনা স্টক</p>
              <div className="flex items-baseline gap-2">
                 <span className="text-4xl font-black text-indigo-500">{(stockStats.externalBags).toLocaleString('bn-BD')}</span>
                 <span className="text-xs font-bold text-primary/40">বস্তা</span>
              </div>
              <p className="text-[10px] font-bold text-indigo-400 mt-1">ক্রয় বিনিয়োগ: {formatCurrency(stockStats.externalCost)}</p>
              <div className="h-1.5 w-full bg-bg-page rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(stockStats.externalBags / (stockStats.totalBags || 1)) * 100}%` }} />
              </div>
           </div>
           <div className="md:col-span-1 text-right flex flex-col items-end">
              <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest">মোট স্টক (বস্তা)</p>
              <div className="flex items-baseline justify-end gap-2 my-2">
                 <span className="text-6xl font-black text-secondary-dark tracking-tighter">{(stockStats.totalBags).toLocaleString('bn-BD')}</span>
                 <span className="text-lg font-bold text-primary/40">টি</span>
              </div>
              <p className="text-[9px] font-black text-secondary-dark/40 uppercase tracking-widest">Total Inventory Bags</p>
           </div>
        </div>

        {/* Global Overview Card */}
        <div className="bg-white rounded-[3.5rem] p-12 relative overflow-hidden shadow-premium border border-border-subtle">
           <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                 <div>
                    <h2 className="text-4xl font-black mb-4 leading-tight tracking-tighter text-primary">সার্বিক সময় ভিত্তিক <br /><span className="text-emerald-500">মুনাফার গড় চিত্র</span></h2>
                    <p className="text-primary/40 text-sm leading-relaxed max-w-md font-bold">
                       সকল প্রজেক্টের লাইভ দিনসমূহের গড় হিসাবে ঘণ্টা, দিন এবং মাস অনুযায়ী সিস্টেমের আর্থিক সক্ষমতা।
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-bg-page/50 rounded-[2rem] border border-border-subtle">
                       <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest mb-2">প্রতি ঘণ্টা মুনাফা</p>
                       <p className={`text-2xl font-black ${globalRates.perHour >= 0 ? 'text-primary' : 'text-red-500'}`}>
                          {formatCurrency(globalRates.perHour)}
                       </p>
                    </div>
                    <div className="p-6 bg-bg-page/50 rounded-[2rem] border border-border-subtle text-center flex flex-col justify-center">
                       <p className="text-[10px] font-black text-primary/30 uppercase tracking-widest mb-1">প্রতি দিন মুনাফা</p>
                       <p className={`text-2xl font-black ${globalRates.perDay >= 0 ? 'text-primary' : 'text-red-500'}`}>
                          {formatCurrency(globalRates.perDay)}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="bg-primary p-10 rounded-[3rem] space-y-8 shadow-2xl text-white">
                 <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                    <Clock className="w-8 h-8 text-secondary" />
                    <h3 className="text-xl font-black uppercase tracking-tight text-white">সময় ভিত্তিক রিটার্ন (Detailed Analysis)</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 text-white">
                    <div>
                       <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">মাসিক গড় লাভ (৩০ দিন)</p>
                       <p className={`text-2xl font-black ${globalRates.perMonth >= 0 ? 'text-secondary' : 'text-red-400'}`}>
                          {formatCurrency(globalRates.perMonth)}
                       </p>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">বার্ষিক প্রাক্কলন (৩৬৫ দিন)</p>
                       <p className={`text-2xl font-black ${globalRates.perYear >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatCurrency(globalRates.perYear)}
                       </p>
                    </div>
                 </div>
              </div>
           </div>
           <Calculator className="absolute -left-10 -bottom-10 w-96 h-96 opacity-[0.02] -rotate-12 pointer-events-none" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
           {/* Monthly Trend Area Chart */}
           <div className="bg-white p-12 rounded-[3.5rem] shadow-premium border border-border-subtle">
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h3 className="text-2xl font-black text-primary leading-none tracking-tight">মাসিক মুনাফার গ্রাফ</h3>
                    <p className="text-xs font-bold text-primary/20 uppercase tracking-widest mt-2">Monthly Profit/Loss Overlap</p>
                 </div>
                 <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary-dark">
                    <TrendingUp className="w-6 h-6" />
                 </div>
              </div>

              <div className="h-[350px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyPerf}>
                       <defs>
                          <linearGradient id="profitColor" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="900" tick={{ fill: 'rgba(30, 33, 31, 0.4)' }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} fontSize={10} tickFormatter={(v) => `৳${v/1000}k`} dx={-10} />
                       <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} />
                       <Area type="monotone" dataKey="profit" stroke="#34d399" strokeWidth={4} fillOpacity={1} fill="url(#profitColor)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* Expense Allocation Pie Chart */}
           <div className="bg-white p-12 rounded-[3.5rem] shadow-premium border border-border-subtle">
              <div className="flex items-center justify-between mb-12">
                 <div>
                    <h3 className="text-2xl font-black text-primary leading-none tracking-tight">ব্যয় বন্টন (Allocation)</h3>
                    <p className="text-xs font-bold text-primary/20 uppercase tracking-widest mt-2">Resources consumption breakdown</p>
                 </div>
                 <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                    <PieChartIcon className="w-6 h-6" />
                 </div>
              </div>

              <div className="h-[350px] w-full flex items-center justify-center relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={pieData} cx="50%" cy="50%" innerRadius={85} outerRadius={125} paddingAngle={8} dataKey="value">
                          {pieData.map((_, index) => (
                             <Cell key={index} fill={COLORS[index % COLORS.length]} cornerRadius={12} stroke="none" />
                          ))}
                       </Pie>
                       <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Live Projects - High Impact & Colorful */}
        <section className="space-y-10">
           <div className="flex items-end justify-between px-4">
              <div>
                 <p className="text-sm font-black text-secondary-dark bg-secondary/20 px-4 py-1 rounded-full w-fit mb-4 uppercase tracking-widest">লাইভ প্রজেক্টসমূহ (Live Now)</p>
                 <h2 className="text-4xl font-black text-primary tracking-tighter">ব্যক্তিগত মুনাফার বিস্তারিত চিত্র</h2>
              </div>
              <div className="hidden lg:flex items-center gap-4 bg-white px-8 py-4 rounded-3xl border border-border-subtle shadow-sm">
                 <Zap className="w-5 h-5 text-secondary-dark" />
                 <span className="text-xs font-black uppercase tracking-widest text-primary/40">{liveProjects.length}টি সচল প্রজেক্ট</span>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-10">
              {liveProjects.length > 0 ? (
                liveProjects.map((p) => {
                  const isPProfit = p.profit >= 0;
                  return (
                    <motion.div 
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className={`rounded-[3.5rem] border-2 overflow-hidden group transition-all shadow-premium hover:shadow-2xl ${isPProfit ? 'bg-emerald-50/30 border-emerald-100 ring-4 ring-emerald-50/20' : 'bg-red-50/30 border-red-100 ring-4 ring-red-50/20'}`}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-12">
                          <div className={`lg:col-span-4 p-12 flex flex-col justify-between ${isPProfit ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                             <div>
                                <div className="flex items-center gap-3 mb-4">
                                   <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-ping" />
                                   <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">সক্রিয় প্রজেক্ট</span>
                                </div>
                                <h3 className="text-4xl font-black text-primary mb-3 leading-tight uppercase tracking-tighter">{p.name}</h3>
                                <div className="flex items-center gap-3 text-primary/50 font-black text-xs uppercase tracking-[0.1em]">
                                   <Clock className="w-4 h-4" />
                                   বয়স: {p.days} দিন
                                </div>
                             </div>

                              <div className="mt-12 space-y-4">
                                 <div className="p-6 rounded-[2rem] bg-white shadow-sm border border-border-subtle">
                                    <p className="text-[9px] font-black text-primary/30 uppercase tracking-[0.2em] mb-1">মোট বিনিয়োগ</p>
                                    <p className="text-2xl font-black text-primary">{formatCurrency(p.expenses)}</p>
                                    <p className="text-[8px] font-bold text-primary/30 mt-1 italic leading-none">{numberToBanglaWords(p.expenses)}</p>
                                 </div>
                                 <div className="p-6 rounded-[2rem] bg-white shadow-sm border border-border-subtle relative overflow-hidden">
                                    <p className="text-[9px] font-black text-primary/30 uppercase tracking-[0.2em] mb-1">প্রত্যাশিত/প্রকৃত বিক্রয়</p>
                                    <p className="text-2xl font-black text-emerald-600">{formatCurrency(p.income)}</p>
                                    <p className="text-[8px] font-bold text-emerald-600/30 mt-1 italic leading-none">{numberToBanglaWords(p.income)}</p>
                                    
                                    <div className="mt-4 pt-4 border-t border-dashed border-emerald-100 flex items-center justify-between">
                                       <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600/50">প্রকৃত লাভ/ক্ষতি</p>
                                       <p className={`text-base font-black ${isPProfit ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(p.profit)}</p>
                                    </div>
                                 </div>
                              </div>
                          </div>

                          <div className="lg:col-span-5 p-12 bg-white">
                             <div className="flex items-center gap-3 mb-10">
                                <TrendingUp className="w-5 h-5 text-secondary-dark" />
                                <h4 className="text-[11px] font-black text-primary/40 uppercase tracking-[0.3em]">রিয়েল-টাইম রিটার্ন বিশ্লেষণ</h4>
                             </div>

                             <div className="grid grid-cols-2 gap-x-12 gap-y-12">
                                <div>
                                   <p className="text-[10px] font-black text-primary/20 uppercase tracking-widest mb-3">ঘণ্টায় লাভ</p>
                                   <p className={`text-2xl font-black ${isPProfit ? 'text-primary' : 'text-red-500'}`}>{formatCurrency(p.rates.perHour)}</p>
                                </div>
                                <div>
                                   <p className="text-[10px] font-black text-primary/20 uppercase tracking-widest mb-3">দৈনিক লাভ</p>
                                   <p className={`text-2xl font-black ${isPProfit ? 'text-primary' : 'text-red-500'}`}>{formatCurrency(p.rates.perDay)}</p>
                                </div>
                                <div>
                                   <p className="text-[10px] font-black text-primary/20 uppercase tracking-widest mb-3">মাসিক লাভ</p>
                                   <p className={`text-2xl font-black ${isPProfit ? 'text-primary' : 'text-red-500'}`}>{formatCurrency(p.rates.perMonth)}</p>
                                </div>
                                <div>
                                   <p className="text-[10px] font-black text-primary/20 uppercase tracking-widest mb-3">বার্ষিক লাভ</p>
                                   <p className={`text-2xl font-black ${isPProfit ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(p.rates.perYear)}</p>
                                </div>
                             </div>
                          </div>

                          <div className={`lg:col-span-3 p-12 flex flex-col items-center justify-center relative ${isPProfit ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                             <div className="w-32 h-32 rounded-full flex items-center justify-center border-[10px] mb-8 shadow-2xl bg-white/10 border-white/20">
                                <div className="text-center">
                                   <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">রিটার্ন (%)</p>
                                   <p className="text-2xl font-black leading-none">{((p.profit / Math.max(p.expenses, 1)) * 100).toFixed(0)}%</p>
                                </div>
                             </div>
                             <p className="text-3xl font-black leading-none mb-3 tracking-tighter">
                                {isPProfit ? '+' : '-'}{formatCurrency(Math.abs(p.profit))}
                             </p>
                             <p className="text-[11px] font-black text-white/50 uppercase tracking-[0.3em]">নীট লাইভ মুনাফা</p>
                             <ArrowUpRight className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 -rotate-12" />
                          </div>
                        </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-border-subtle">
                   <p className="text-primary/30 font-black uppercase tracking-widest">বর্তমানে কোনো লাইভ প্রজেক্ট নেই</p>
                </div>
              )}
           </div>
        </section>

        {/* Archived Projects - Minimal List at bottom */}
        {archivedProjects.length > 0 && (
          <section className="space-y-8 pt-12 border-t border-border-subtle">
            <div className="flex items-center gap-3 px-4">
               <Clock className="w-5 h-5 text-primary/30" />
               <h2 className="text-2xl font-black text-primary/40 uppercase tracking-widest">আর্কাইভ রিপোর্টস (Past Performance)</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {archivedProjects.map((p) => {
                  const isPProfit = p.profit >= 0;
                  return (
                    <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border border-border-subtle hover:border-primary/20 transition-all flex items-center justify-between group">
                       <div className="space-y-2">
                          <h4 className="text-xl font-black text-primary group-hover:text-emerald-600 transition-colors">{p.name}</h4>
                          <p className="text-[10px] font-bold text-primary/30 uppercase tracking-widest">সময়কাল: {p.days} দিন | শেষ হয়েছে</p>
                       </div>
                       <div className="text-right">
                          <p className={`text-xl font-black ${isPProfit ? 'text-emerald-600' : 'text-red-500'}`}>
                             {formatCurrency(p.profit)}
                          </p>
                          <p className="text-[10px] font-black text-primary/20 uppercase tracking-widest">চুড়ান্ত মুনাফা</p>
                       </div>
                    </div>
                  );
               })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
