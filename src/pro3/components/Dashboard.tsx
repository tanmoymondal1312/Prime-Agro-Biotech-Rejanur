import React from 'react';
import { Cow, ProfitBreakdown, Category } from '../types';
import { translations } from '../translations';
import { calculateProfit } from '../lib/calculations';
import { 
  TrendingUp, TrendingDown, Wallet, Beef, UserCheck, Baby, 
  Clock, Calendar, Zap, BarChart3, PieChart, Activity,
  Percent, ArrowUpRight, ArrowDownRight, Users, X, Info, AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePie, Pie } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  cows: Cow[];
  profiles: Profile[];
  category: Category;
  onAddCow: () => void;
  onFilterCows?: (gender: string | null) => void;
  t: any;
}

interface Profile {
  id: string;
  name: string;
  isArchived?: boolean;
  archivedAt?: string;
}

export function Dashboard({ cows, profiles, category, onAddCow, onFilterCows, t }: DashboardProps) {
  const [selectedMetric, setSelectedMetric] = React.useState<'hourly' | 'daily' | 'weekly' | 'monthly' | null>(null);
  const [showLoanModal, setShowLoanModal] = React.useState(false);
  const [showMedicalModal, setShowMedicalModal] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const soldCows = cows.filter(c => c.isSold && c.salePrice);
  const liveCows = cows.filter(c => !c.isSold);
  
  // Calculate Live Cow Total Value
  const totalLiveValue = liveCows.reduce((acc, c) => acc + c.purchasePrice, 0);
  
  // Calculate Live Cow Total Loans and Medical Expenses
  const totalLiveLoans = liveCows.reduce((acc, c) => acc + (c.loanAmount || 0), 0);
  const totalLiveMedical = liveCows.reduce((acc, c) => acc + (c.treatmentCost || 0), 0);

  // Calculate historical performance
  let totalOwnerProfit = 0;
  let totalFarmerProfit = 0;
  let totalLiveDays = 0;
  let totalOwnerInvestmentSold = 0;
  let totalDashboardOwnerProfit = 0;

  const cowBreakdowns = soldCows.map(cow => {
    const breakdown = calculateProfit(cow, cow.salePrice || 0);
    const profile = profiles.find(p => p.id === cow.profileId);
    
    // Simplified profit for dashboard metrics (salePrice - purchasePrice) * ownerShare
    const simplifiedProfit = (cow.salePrice || 0) - cow.purchasePrice;
    let ownerPercentage = 0.5;
    if (cow.profitType === "One Third (2:1)") ownerPercentage = 1/3;
    if (cow.profitType === "One Fifth (3:2)") ownerPercentage = 2/5;
    const dashboardOwnerProfit = simplifiedProfit * ownerPercentage;

    // Calculate duration
    const entry = new Date(cow.entryDate).getTime();
    let sale = cow.saleDate ? new Date(cow.saleDate).getTime() : Date.now();
    
    if (!cow.saleDate && profile?.isArchived && profile?.archivedAt) {
      sale = new Date(profile.archivedAt).getTime();
    }
    
    const durationDays = Math.max(1, Math.ceil((sale - entry) / (1000 * 60 * 60 * 24)));
    
    return {
      cow,
      breakdown,
      dashboardOwnerProfit,
      durationDays,
      investorName: profile?.name || 'অজ্ঞাত'
    };
  });

  cowBreakdowns.forEach(item => {
    totalOwnerProfit += item.breakdown.ownerShare;
    totalFarmerProfit += item.breakdown.farmerFinal;
    totalOwnerInvestmentSold += (item.cow.purchasePrice + (item.cow.additionalExpenses || 0));
    totalLiveDays += item.durationDays;
    totalDashboardOwnerProfit += item.dashboardOwnerProfit;
  });

  // Calculate periodic metrics based on owner's simplified profit / active days
  const avgDailyProfit = totalLiveDays > 0 ? totalDashboardOwnerProfit / totalLiveDays : 0;
  
  const metrics = {
    hourly: avgDailyProfit / 24,
    daily: avgDailyProfit,
    weekly: avgDailyProfit * 7,
    monthly: avgDailyProfit * 30
  };

  const investment = cows.reduce((acc, c) => acc + c.purchasePrice + (c.additionalExpenses || 0), 0);
  const profitRate = totalOwnerInvestmentSold > 0 ? (totalOwnerProfit / totalOwnerInvestmentSold) * 100 : 0;

  const stats = {
    total: cows.filter(c => !c.isSold).length,
    bulls: cows.filter(c => !c.isSold && c.gender === 'Bull').length,
    cows: cows.filter(c => !c.isSold && c.gender === 'Cow').length,
    heifers: cows.filter(c => !c.isSold && c.gender === 'Heifer').length,
    calves: cows.filter(c => !c.isSold && c.gender === 'Calf').length,
    investment,
    ownerProfit: totalOwnerProfit,
    farmerProfit: totalFarmerProfit,
    liveValue: totalLiveValue,
    priceRanges: {
      over100: liveCows.filter(c => c.purchasePrice > 100000).length,
      range90_100: liveCows.filter(c => c.purchasePrice > 90000 && c.purchasePrice <= 100000).length,
      range80_90: liveCows.filter(c => c.purchasePrice > 80000 && c.purchasePrice <= 90000).length,
      range70_80: liveCows.filter(c => c.purchasePrice > 70000 && c.purchasePrice <= 80000).length,
      range60_70: liveCows.filter(c => c.purchasePrice > 60000 && c.purchasePrice <= 70000).length,
      range50_60: liveCows.filter(c => c.purchasePrice > 50000 && c.purchasePrice <= 60000).length,
      range40_50: liveCows.filter(c => c.purchasePrice > 40000 && c.purchasePrice <= 50000).length,
      range30_40: liveCows.filter(c => c.purchasePrice > 30000 && c.purchasePrice <= 40000).length,
    }
  };

  const chartData = category === 'Cow' 
    ? [
        { name: t.bull, value: stats.bulls, color: '#10b981' },
        { name: t.cow, value: stats.cows, color: '#ef4444' },
        { name: t.heifer, value: stats.heifers, color: '#f59e0b' },
        { name: t.calf, value: stats.calves, color: '#3b82f6' }
      ]
    : [
        { name: t.buck, value: stats.bulls, color: '#10b981' },
        { name: t.doe, value: stats.cows, color: '#ef4444' },
        { name: t.kid, value: stats.calves, color: '#3b82f6' }
      ];

  return (
    <div className="space-y-8 pb-10">
      {/* Metrics Breakdown Modal */}
      <AnimatePresence>
        {selectedMetric && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div>
                  <h3 className="text-2xl font-black text-stone-900">
                    {selectedMetric === 'hourly' && t.hourly + ' ' + t.totalProfit + 'র হিসাব'}
                    {selectedMetric === 'daily' && t.daily + ' ' + t.totalProfit + 'র হিসাব'}
                    {selectedMetric === 'weekly' && t.weekly + ' ' + t.totalProfit + 'র হিসাব'}
                    {selectedMetric === 'monthly' && t.monthly + ' ' + t.totalProfit + 'র হিসাব'}
                  </h3>
                  <p className="text-sm text-stone-500 font-bold mt-1">বিক্রিত পশুর একচুয়াল ডাটা থেকে প্রাপ্ত</p>
                </div>
                <button 
                  onClick={() => setSelectedMetric(null)}
                  className="p-3 hover:bg-white rounded-2xl transition-colors shadow-sm"
                >
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {cowBreakdowns.length === 0 ? (
                  <div className="text-center py-12 text-stone-400">
                    <Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>বিক্রিত পশুর কোনো তথ্য পাওয়া যায়নি</p>
                  </div>
                ) : (
                  cowBreakdowns.map((item, idx) => {
                    const cowProfitPerDay = item.breakdown.ownerShare / item.durationDays;
                    let periodProfit = 0;
                    let periodLabel = '';

                    switch(selectedMetric) {
                      case 'hourly': periodProfit = cowProfitPerDay / 24; periodLabel = 'ঘণ্টা'; break;
                      case 'daily': periodProfit = cowProfitPerDay; periodLabel = 'দিন'; break;
                      case 'weekly': periodProfit = cowProfitPerDay * 7; periodLabel = 'সপ্তাহ'; break;
                      case 'monthly': periodProfit = cowProfitPerDay * 30; periodLabel = 'মাস'; break;
                    }

                    return (
                      <div key={item.cow.id} className="bg-stone-50 p-6 rounded-3xl border border-stone-100 flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-stone-200/50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-[1rem] flex items-center justify-center font-black text-emerald-600 shadow-sm">
                            #{idx + 1}
                          </div>
                          <div>
                            <h4 className="font-black text-stone-900">{item.investorName}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                              <span>{t.ticket}: {item.cow.id.slice(-6)}</span>
                              <span>•</span>
                              <span>{t.duration}: {item.durationDays} দিন</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-stone-900 tracking-tighter">৳ {Math.round(periodProfit).toLocaleString()}</p>
                          <p className="text-[10px] text-emerald-600 font-black uppercase">প্রতি {periodLabel}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-8 border-t border-stone-100 bg-emerald-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">{t.totalAverageProfit}</p>
                  <p className="text-2xl font-black text-emerald-700 tracking-tighter">৳ {Math.round(metrics[selectedMetric]).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-600/60 font-bold">{t.actualLiveDays}: {totalLiveDays} দিন</p>
                  <p className="text-xs text-emerald-600/60 font-bold text-right">{t.totalAnimals}: {soldCows.length}টি</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Loans Breakdown Modal */}
      <AnimatePresence>
        {showLoanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div>
                  <h3 className="text-2xl font-black text-stone-900 flex items-center gap-3">
                    <Wallet className="text-rose-500" />
                    {t.loanDetails}
                  </h3>
                  <p className="text-sm text-stone-500 font-bold mt-1">বর্তমানে খামারে থাকা পশুর ঋণের হিসাব</p>
                </div>
                <button 
                  onClick={() => setShowLoanModal(false)}
                  className="p-3 hover:bg-white rounded-2xl transition-colors shadow-sm"
                >
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {liveCows.filter(c => (c.loanAmount || 0) > 0).length === 0 ? (
                  <div className="text-center py-12 text-stone-400">
                    <Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>বর্তমানে কোনো ঋণের তথ্য পাওয়া যায়নি</p>
                  </div>
                ) : (
                  liveCows.filter(c => (c.loanAmount || 0) > 0).map((cow, idx) => (
                    <div key={cow.id} className="bg-stone-50 p-6 rounded-3xl border border-stone-100 space-y-4 group hover:bg-white hover:shadow-xl hover:shadow-stone-200/50 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-rose-600 shadow-sm">
                            #{idx + 1}
                          </div>
                          <div>
                            <h4 className="font-black text-stone-900">{profiles.find(p => p.id === cow.profileId)?.name || 'অজ্ঞাত'}</h4>
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">টিকিট: {cow.id.slice(-6)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-rose-600 tracking-tighter">৳ {cow.loanAmount.toLocaleString()}</p>
                          <p className="text-[10px] text-stone-400 font-bold uppercase">{t.loanAmount}</p>
                        </div>
                      </div>
                      
                      {cow.history?.filter(h => h.type === 'loan').length ? (
                        <div className="pt-4 border-t border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {cow.history.filter(h => h.type === 'loan').map(tx => (
                            <div key={tx.id} className="bg-white p-3 rounded-xl border border-stone-100 flex justify-between items-center text-[11px]">
                              <div>
                                <p className="font-bold text-stone-700">{tx.date}</p>
                                <p className="text-stone-400 truncate max-w-[120px]">{tx.note || 'নোট নেই'}</p>
                              </div>
                              <span className="font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">৳ {tx.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              <div className="p-8 border-t border-stone-100 bg-rose-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest mb-1">{t.liveTotalLoans}</p>
                  <p className="text-2xl font-black text-rose-700 tracking-tighter">৳ {totalLiveLoans.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-rose-600/60 font-bold uppercase">{t.itemCount}: {liveCows.filter(c => (c.loanAmount || 0) > 0).length}টি</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Medical Breakdown Modal */}
      <AnimatePresence>
        {showMedicalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div>
                  <h3 className="text-2xl font-black text-stone-900 flex items-center gap-3">
                    <Activity className="text-amber-500" />
                    {t.medicalDetails}
                  </h3>
                  <p className="text-sm text-stone-500 font-bold mt-1">বর্তমানে খামারে থাকা পশুর চিকিৎসা ব্যয়ের হিসাব</p>
                </div>
                <button 
                  onClick={() => setShowMedicalModal(false)}
                  className="p-3 hover:bg-white rounded-2xl transition-colors shadow-sm"
                >
                  <X className="w-6 h-6 text-stone-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-4">
                {liveCows.filter(c => (c.treatmentCost || 0) > 0).length === 0 ? (
                  <div className="text-center py-12 text-stone-400">
                    <Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>বর্তমানে কোনো চিকিৎসা খরচের তথ্য পাওয়া যায়নি</p>
                  </div>
                ) : (
                  liveCows.filter(c => (c.treatmentCost || 0) > 0).map((cow, idx) => (
                    <div key={cow.id} className="bg-stone-50 p-6 rounded-3xl border border-stone-100 space-y-4 group hover:bg-white hover:shadow-xl hover:shadow-stone-200/50 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-amber-600 shadow-sm">
                            #{idx + 1}
                          </div>
                          <div>
                            <h4 className="font-black text-stone-900">{profiles.find(p => p.id === cow.profileId)?.name || 'অজ্ঞাত'}</h4>
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">টিকিট: {cow.id.slice(-6)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-amber-600 tracking-tighter">৳ {cow.treatmentCost.toLocaleString()}</p>
                          <p className="text-[10px] text-stone-400 font-bold uppercase">মোট চিকিৎসা ব্যয়</p>
                        </div>
                      </div>
                      
                      {cow.history?.filter(h => h.type === 'treatment').length ? (
                        <div className="pt-4 border-t border-stone-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {cow.history.filter(h => h.type === 'treatment').map(tx => (
                            <div key={tx.id} className="bg-white p-3 rounded-xl border border-stone-100 flex justify-between items-center text-[11px]">
                              <div>
                                <p className="font-bold text-stone-700">{tx.date}</p>
                                <p className="text-stone-400 truncate max-w-[120px]">{tx.note || 'নোট নেই'}</p>
                              </div>
                              <span className="font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">৳ {tx.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>

              <div className="p-8 border-t border-stone-100 bg-amber-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mb-1">{t.liveTotalMedical}</p>
                  <p className="text-2xl font-black text-amber-700 tracking-tighter">৳ {totalLiveMedical.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-amber-600/60 font-bold uppercase">{t.itemCount}: {liveCows.filter(c => (c.treatmentCost || 0) > 0).length}টি</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Profile Header */}
      <div className="relative overflow-hidden bg-stone-900 p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] text-white shadow-2xl">
        <div className="relative z-10">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-6 sm:mb-8">
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <p className="text-emerald-400 font-extrabold uppercase tracking-[0.2em] text-[10px] mb-1.5">Portfolio Overview</p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <h2 className="text-2xl sm:text-4xl font-black">{t.dashboard}</h2>
                  <div className="hidden sm:block h-10 w-px bg-white/20"></div>
                  <div className="flex flex-col">
                    <span className="text-lg sm:text-2xl font-black font-mono tracking-tighter text-emerald-400">
                      {currentTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest hidden sm:block">Live Clock</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10">
                <p className="text-[10px] text-stone-400 font-bold uppercase mb-1 text-right">মালিকের লাভের হার</p>
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-emerald-400" />
                  <p className="text-xl font-black text-emerald-400">{profitRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Live Stock Value - Large & Colorful */}
            <div className="col-span-1 md:col-span-3 bg-gradient-to-r from-emerald-600 to-teal-700 p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-emerald-100 text-xs font-bold uppercase mb-2">
                  লাইভ {category === 'Goat' ? 'ছাগলের' : 'গরুর'} মোট ক্রয়মূল্য (খামারে আছে)
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-emerald-200 text-2xl font-black">৳</span>
                  <p className="text-3xl sm:text-5xl font-black tracking-tight font-mono text-white break-all">
                    {stats.liveValue.toLocaleString()}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-2 text-emerald-100/80 text-sm">
                  <Beef className="w-4 h-4" />
                  <span>বর্তমানে {liveCows.length}টি {category === 'Goat' ? 'ছাগল' : 'গবাদি পশু'} খামারে লাইভ আছে</span>
                </div>
              </div>
              <Activity className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/5 group-hover:scale-110 transition-transform duration-700" />
            </div>

            {/* Sold Profits */}
            <div className="p-4 sm:p-6 bg-emerald-500/10 rounded-2xl sm:rounded-3xl border border-emerald-500/20 backdrop-blur-sm">
              <p className="text-emerald-400 text-xs font-bold uppercase mb-2">মালিকের মোট নিট লাভ (বিক্রিত)</p>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-black tracking-tight font-mono ${stats.ownerProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ৳ {stats.ownerProfit.toLocaleString()}
                </p>
                {stats.ownerProfit >= 0 ? <ArrowUpRight className="w-6 h-6 text-emerald-400" /> : <ArrowDownRight className="w-6 h-6 text-red-400" />}
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-amber-500/10 rounded-2xl sm:rounded-3xl border border-amber-500/20 backdrop-blur-sm">
              <p className="text-amber-400 text-xs font-bold uppercase mb-2">খামারির মোট নিট লাভ (বিক্রিত)</p>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-black tracking-tight font-mono ${stats.farmerProfit >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                  ৳ {stats.farmerProfit.toLocaleString()}
                </p>
                <Users className="w-6 h-6 text-amber-400" />
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5">
              <p className="text-stone-400 text-xs font-bold uppercase mb-2">মোট বিনিয়োগ (সব মিলিয়ে)</p>
              <p className="text-3xl font-black tracking-tight font-mono text-stone-200">৳ {stats.investment.toLocaleString()}</p>
            </div>
          </div>
        </div>
        
        {/* Background Decorative Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]"></div>
      </div>

      {/* Real-time Profit Performance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black text-stone-900 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            মালিকের লাভের গড় হার (লাইভ পিরিয়ড অনুযায়ী)
          </h3>
          <span className="text-[10px] font-bold uppercase text-stone-400 tracking-widest bg-stone-100 px-4 py-2 rounded-full border border-stone-200">
            Click to view breakdown
          </span>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <PremiumRateCard 
            label="প্রতি ঘন্টায়" 
            value={metrics.hourly} 
            icon={<Clock className="w-4 h-4" />} 
            color="emerald" 
            onClick={() => setSelectedMetric('hourly')}
          />
          <PremiumRateCard 
            label="প্রতি দিন" 
            value={metrics.daily} 
            icon={<Zap className="w-4 h-4" />} 
            color="amber" 
            onClick={() => setSelectedMetric('daily')}
          />
          <PremiumRateCard 
            label="প্রতি সপ্তাহে" 
            value={metrics.weekly} 
            icon={<Calendar className="w-4 h-4" />} 
            color="blue" 
            onClick={() => setSelectedMetric('weekly')}
          />
          <PremiumRateCard 
            label="প্রতি মাসে" 
            value={metrics.monthly} 
            icon={<BarChart3 className="w-4 h-4" />} 
            color="purple" 
            onClick={() => setSelectedMetric('monthly')}
          />
        </div>
      </div>

      {/* Price Range Statistics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black text-stone-900 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>
            ক্রয়মূল্য ভিত্তিক পরিসংখ্যান (লাইভ পশু)
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <PriceStatCard label="১ লক্ষ +" value={stats.priceRanges.over100} isBold />
          <PriceStatCard label="৯০ - ১ লক্ষ" value={stats.priceRanges.range90_100} isBold />
          <PriceStatCard label="৮০ - ৯০ হাজার" value={stats.priceRanges.range80_90} isBold />
          <PriceStatCard label="৭০ - ৮০ হাজার" value={stats.priceRanges.range70_80} isBold />
          <PriceStatCard label="৬০ - ৭০ হাজার" value={stats.priceRanges.range60_70} />
          <PriceStatCard label="৫০ - ৬০ হাজার" value={stats.priceRanges.range50_60} />
          <PriceStatCard label="৪০ - ৫০ হাজার" value={stats.priceRanges.range40_50} />
          <PriceStatCard label="৩০ - ৪০ হাজার" value={stats.priceRanges.range30_40} />
        </div>
      </div>

      {/* Advice / Alert Section */}
      {(() => {
        const oldBulls = liveCows.filter(c => {
          if (c.gender !== 'Bull') return false;
          const entry = new Date(c.entryDate).getTime();
          const current = Date.now();
          const diffDays = Math.floor((current - entry) / (1000 * 60 * 60 * 24));
          return diffDays >= 240; // Approx 8 months
        });

        if (oldBulls.length > 0) {
          return (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-2 border-red-200 p-6 rounded-[2.5rem] flex items-center gap-6 shadow-lg shadow-red-100"
            >
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 animate-pulse">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-black text-red-900 mb-1">জরুরী পরামর্শ (সতর্কতা)</h3>
                <div className="space-y-1">
                  {Array.from(new Set(oldBulls.map(b => profiles.find(p => p.id === b.profileId)?.name))).map(name => (
                    <p key={name} className="text-red-700 font-bold text-sm">
                      • <span className="underline">{name}</span> প্রোফাইলে থাকা ষাঁড় গরুর বয়স ৮ মাস পার হয়ে গেছে। এটি দ্রুত বিক্রির ব্যবস্থা করুন।
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        }
        return null;
      })()}

      {/* Stock Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        <StatCard 
          label={category === 'Cow' ? 'মোট লাইভ গরু' : 'মোট লাইভ ছাগল'} 
          value={stats.total} 
          icon={<Beef className="w-6 h-6 text-white" />} 
          color="bg-gradient-to-br from-emerald-500 to-emerald-700" 
          onClick={() => onFilterCows?.(null)}
        />
        <StatCard 
          label={category === 'Cow' ? 'লাইভ ষাঁড়' : 'লাইভ পাঠা'} 
          value={stats.bulls} 
          icon={<Beef className="w-6 h-6 text-white" />} 
          color="bg-gradient-to-br from-blue-500 to-blue-700" 
          onClick={() => onFilterCows?.('Bull')}
        />
        <StatCard 
          label={category === 'Cow' ? 'লাইভ গাই/বকনা' : 'লাইভ মাদী'} 
          value={category === 'Cow' ? (stats.cows + stats.heifers) : stats.cows} 
          icon={<UserCheck className="w-6 h-6 text-white" />} 
          color="bg-gradient-to-br from-amber-500 to-amber-700" 
          onClick={() => onFilterCows?.('Cow')}
        />
        <StatCard 
          label={category === 'Cow' ? 'লাইভ বাছুর' : 'লাইভ বাচ্চা'} 
          value={stats.calves} 
          icon={<Baby className="w-6 h-6 text-white" />} 
          color="bg-gradient-to-br from-purple-500 to-purple-700" 
          onClick={() => onFilterCows?.('Calf')}
        />
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Loans Card */}
        <div 
          onClick={() => setShowLoanModal(true)}
          className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-stone-200 shadow-xl shadow-stone-100/50 cursor-pointer hover:shadow-2xl hover:shadow-rose-100/50 transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest">{t.liveTotalLoans}</p>
              <p className="text-2xl font-black text-stone-900 tracking-tighter">৳ {totalLiveLoans.toLocaleString()}</p>
            </div>
          </div>
          <div className="h-1.5 w-full bg-rose-50 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full w-[60%]" />
          </div>
        </div>

        {/* Total medical Card */}
        <div 
          onClick={() => setShowMedicalModal(true)}
          className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-stone-200 shadow-xl shadow-stone-100/50 cursor-pointer hover:shadow-2xl hover:shadow-amber-100/50 transition-all group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-amber-400 font-black uppercase tracking-widest">{t.liveTotalMedical}</p>
              <p className="text-2xl font-black text-stone-900 tracking-tighter">৳ {totalLiveMedical.toLocaleString()}</p>
            </div>
          </div>
          <div className="h-1.5 w-full bg-amber-50 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full w-[45%]" />
          </div>
        </div>

        {/* Success message / small placeholder */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] text-white flex flex-col justify-center shadow-xl shadow-emerald-200 relative overflow-hidden lg:col-span-2">
          <p className="relative z-10 text-emerald-50 text-sm leading-relaxed font-bold">
            {t.successMessage}
          </p>
          <Zap className="absolute right-[-20px] bottom-[-20px] w-24 h-24 text-white/10" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-stone-200 shadow-xl shadow-stone-100/50">
          <h3 className="text-lg font-black text-stone-900 mb-8 flex items-center justify-between">
            গবাদি পশুর পরিসংখ্যান (লিঙ্গ অনুযায়ী)
            <PieChart className="w-5 h-5 text-stone-400" />
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePie>
                <Pie
                  data={chartData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: '900' }}
                />
              </RePie>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {chartData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-xs font-bold text-stone-600">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-5 sm:p-8 rounded-2xl sm:rounded-[3rem] text-white flex flex-col justify-between shadow-xl shadow-emerald-200 relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-3 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Zap className="w-6 h-6 fill-emerald-100 text-emerald-100" />
              </div>
              সফলতা বার্তা
            </h3>
            <p className="text-emerald-50 text-sm leading-relaxed mb-8 opacity-90">
              আপনার খামারের মোট লাভের হার দিন দিন বৃদ্ধি পাচ্ছে। এই ধারা বজায় রাখলে আগামী বছরে বিনিয়োগের {profitRate.toFixed(1)}% লাভ হওয়ার সম্ভাবনা রয়েছে।
            </p>
          </div>
          <button
            onClick={onAddCow}
            className="relative z-10 w-full py-5 bg-white text-emerald-700 font-black rounded-2xl transition-all hover:bg-emerald-50 active:scale-95 flex items-center justify-center gap-3 shadow-2xl group-hover:shadow-white/20"
          >
            <PlusCircleIcon className="w-6 h-6" />
            {category === 'Goat' ? t.addGoat : t.addCow}
          </button>
          
          {/* Animated decorative element */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
        </div>
      </div>
    </div>
  );
}

function PriceStatCard({ label, value, isBold = false }: { label: string, value: number, isBold?: boolean }) {
  return (
    <div className={`p-4 rounded-3xl border border-stone-100 bg-white shadow-sm flex flex-col items-center justify-center text-center transition-all hover:shadow-md ${isBold ? 'ring-2 ring-emerald-100 border-emerald-200' : ''}`}>
      <p className={`uppercase tracking-widest text-stone-400 mb-1 ${isBold ? 'text-[10px] font-black' : 'text-[9px] font-bold'}`}>{label}</p>
      <p className={`${isBold ? 'text-2xl font-black text-emerald-600' : 'text-xl font-bold text-stone-700'} tabular-nums`}>
        {value} <span className="text-xs font-bold text-stone-400">টি</span>
      </p>
    </div>
  );
}

function StatCard({ label, value, icon, color, onClick }: { label: string, value: number, icon: React.ReactNode, color: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`relative group p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] bg-white border border-stone-100 shadow-xl shadow-stone-200/40 hover:shadow-2xl hover:shadow-stone-200 transition-all hover:-translate-y-2 ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
    >
      <div className={`w-10 h-10 sm:w-14 sm:h-14 ${color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-6 shadow-lg shadow-current/20 group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] sm:text-[10px] text-stone-400 font-black uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl sm:text-4xl font-black text-stone-900 font-mono tracking-tighter tabular-nums">{value}</p>
      </div>
      
      {/* Decorative inner glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-current to-transparent opacity-[0.03] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
    </div>
  );
}

function PremiumRateCard({ label, value, icon, color, onClick }: { label: string, value: number, icon: React.ReactNode, color: string, onClick?: () => void }) {
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500 to-emerald-700 text-white shadow-emerald-200/50',
    amber: 'from-amber-500 to-amber-700 text-white shadow-amber-200/50',
    blue: 'from-blue-500 to-blue-700 text-white shadow-blue-200/50',
    purple: 'from-purple-500 to-purple-700 text-white shadow-purple-200/50',
    rose: 'from-rose-500 to-rose-700 text-white shadow-rose-200/50',
  };

  const style = colorMap[color];

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-br ${style} transition-all hover:scale-105 shadow-xl flex flex-col items-center text-center group cursor-pointer active:scale-95`}
    >
      <div className="mb-4 p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-tight mb-2 opacity-80">{label}</p>
      <p className="text-xl font-black tracking-tighter leading-none font-mono">
        ৳ {Math.round(value).toLocaleString()}
      </p>
      
      {/* Glossy reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
    </div>
  );
}

function PlusCircleIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
  )
}
