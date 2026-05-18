import React, { useMemo } from 'react';
import { Cow, Profile } from '../types';
import { 
  FileBarChart, TrendingUp, TrendingDown, Clock, Calendar, 
  BarChart3, PieChart as PieIcon, Activity, Star, 
  Award, Heart, ShieldCheck, ChevronRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend, Line, ComposedChart, Area
} from 'recharts';
import { motion } from 'motion/react';

interface ReportProps {
  cows: Cow[];
  profiles: Profile[];
  t: any;
}

// Compact Bengali number formatter: 1,200,000 → "১২ লক্ষ"
function fmtTk(n: number): string {
  const abs  = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10_000_000) return `${sign}${(abs / 10_000_000).toFixed(1)} কোটি`;
  if (abs >= 100_000)    return `${sign}${(abs / 100_000).toFixed(1)} লক্ষ`;
  if (abs >= 1_000)      return `${sign}${(abs / 1_000).toFixed(0)} হাজার`;
  return `${sign}${Math.round(abs).toLocaleString('en-IN')}`;
}

export function Report({ cows, profiles, t }: ReportProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const months: Record<string, any> = {};
    const aging = {
      over3Months: 0,
      over6Months: 0,
      over9Months: 0,
      over1Year: 0
    };

    // Calculate Aging
    cows.filter(c => !c.isSold).forEach(cow => {
      const entry = new Date(cow.entryDate).getTime();
      const diffDays = Math.floor((now.getTime() - entry) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 365) aging.over1Year++;
      else if (diffDays >= 270) aging.over9Months++;
      else if (diffDays >= 180) aging.over6Months++;
      else if (diffDays >= 90) aging.over3Months++;
    });

    const bengaliMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];

    // Calculate Monthly Data
    cows.forEach(cow => {
      // Entry month for purchase/costs
      const entryDate = new Date(cow.entryDate);
      const year = entryDate.getFullYear();
      const monthIdx = entryDate.getMonth();
      const buyKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      
      if (!months[buyKey]) {
        months[buyKey] = { 
          monthKey: buyKey, 
          month: `${bengaliMonths[monthIdx]} ${year}`, 
          purchase: 0, sale: 0, profit: 0, costs: 0 
        };
      }
      months[buyKey].purchase += cow.purchasePrice;
      const historyCosts = (cow.history || []).reduce((sum, t) => sum + t.amount, 0);
      const totalCosts = (cow.loanAmount || 0) + (cow.treatmentCost || 0) + (cow.additionalExpenses || 0) + historyCosts;
      months[buyKey].costs += totalCosts;

      if (cow.isSold && cow.saleDate) {
        const saleDate = new Date(cow.saleDate);
        const sYear = saleDate.getFullYear();
        const sMonthIdx = saleDate.getMonth();
        const sellKey = `${sYear}-${String(sMonthIdx + 1).padStart(2, '0')}`;
        
        if (!months[sellKey]) {
          months[sellKey] = { 
            monthKey: sellKey, 
            month: `${bengaliMonths[sMonthIdx]} ${sYear}`, 
            purchase: 0, sale: 0, profit: 0, costs: 0 
          };
        }
        months[sellKey].sale += cow.salePrice || 0;
        
        const totalInvestment = cow.purchasePrice + totalCosts;
        months[sellKey].profit += (cow.salePrice || 0) - totalInvestment;
      }
    });

    const monthlyData = Object.values(months)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-6);

    const soldCowsAnalysis = cows.filter(c => c.isSold).map(cow => {
      const entry = new Date(cow.entryDate).getTime();
      const sale = new Date(cow.saleDate!).getTime();
      const diffMs = sale - entry;
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const monthsCount = Math.floor(days / 30);
      const remainingDays = days % 30;
      
      const historyCosts = (cow.history || []).reduce((sum, t) => sum + t.amount, 0);
      const totalCost = cow.purchasePrice + (cow.loanAmount || 0) + (cow.treatmentCost || 0) + (cow.additionalExpenses || 0) + historyCosts;
      const profit = (cow.salePrice || 0) - totalCost;
      
      const totalDays = diffMs / (1000 * 60 * 60 * 24) || 0.0001;
      const profitPerDay = profit / totalDays;
      const profitPerHour = profitPerDay / 24;
      const profitPerMonth = (profit * 30) / totalDays;
      const profitPerYear = (profit * 365) / totalDays;

      return { 
        tag: cow.tag || profiles.find(p => p.id === cow.profileId)?.name,
        duration: `${monthsCount > 0 ? `${monthsCount} মাস ` : ''}${remainingDays} দিন ${hours} ঘণ্টা`,
        profit,
        isProfitable: profit > 0,
        metrics: {
          daily: profitPerDay,
          hourly: profitPerHour,
          monthly: profitPerMonth,
          yearly: profitPerYear
        }
      };
    }).sort((a, b) => b.profit - a.profit);

    const totalSoldProfit = soldCowsAnalysis.reduce((acc, curr) => acc + (curr.profit > 0 ? curr.profit : 0), 0);
    const totalSoldLoss = Math.abs(soldCowsAnalysis.reduce((acc, curr) => acc + (curr.profit < 0 ? curr.profit : 0), 0));

    return { monthlyData, aging, soldCowsAnalysis, totalSoldProfit, totalSoldLoss };
  }, [cows, profiles]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
  const agingData = [
    { name: '৩ মাসের বেশি', value: stats.aging.over3Months },
    { name: '৬ মাসের বেশি', value: stats.aging.over6Months },
    { name: '৯ মাসের বেশি', value: stats.aging.over9Months },
    { name: '১ বছরের বেশি', value: stats.aging.over1Year },
  ].filter(d => d.value > 0);

  const profitLossData = [
    { name: 'মোট লাভ', value: stats.totalSoldProfit, fill: '#10b981' },
    { name: 'মোট ক্ষতি', value: stats.totalSoldLoss, fill: '#ef4444' }
  ].filter(d => d.value > 0);

  const bestPerformer = stats.soldCowsAnalysis[0];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-3xl font-black text-stone-900 flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-2xl">
              <FileBarChart className="w-6 h-6 text-indigo-600" />
            </div>
            হিসাব-নিকাশ ও রিপোর্ট
          </h2>
          <p className="text-stone-500 font-bold mt-1">আপনার খামারের পূর্ণাঙ্গ ব্যবসায়িক পরিসংখ্যান</p>
        </div>
      </div>

      {bestPerformer && bestPerformer.profit > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-6 h-6 text-amber-300" />
              <h3 className="text-xl font-black italic tracking-tight">সফলতা বার্তা!</h3>
            </div>
            <p className="text-lg leading-relaxed font-bold max-w-2xl">
              অভিনন্দন! আপনার খামারে <span className="text-amber-300 font-black">"{bestPerformer.tag}"</span> সবচেয়ে বেশি লাভ দিয়েছে। 
              এটি <span className="font-black text-emerald-100">{bestPerformer.duration}</span> পালনের পর
              <span className="text-amber-300 font-black"> ৳ {fmtTk(bestPerformer.profit)}</span> টাকা লাভ নিশ্চিত করেছে। 
              আপনার সঠিক পরিচর্যা ও পরিশ্রম খামারকে সফলতার দিকে নিয়ে যাচ্ছে!
            </p>
          </div>
          <div className="absolute top-1/2 -right-12 -translate-y-1/2 opacity-10 rotate-12 scale-150">
            <TrendingUp className="w-64 h-64" />
          </div>
        </motion.div>
      )}

      <div className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-xl shadow-stone-200/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h3 className="text-xl font-black text-stone-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            শেষ ৬ মাসের লেনদেন ও লাভ
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">বিক্রি</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">লাভ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-stone-300" />
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">খরচ</span>
            </div>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                tickFormatter={(v) => fmtTk(v)}
                width={55}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }} 
                contentStyle={{ 
                  borderRadius: '1.5rem', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', 
                  padding: '1.25rem',
                  backgroundColor: '#ffffff'
                }}
                formatter={(value: any, name: string) => {
                  const labels: Record<string, string> = {
                    sale: 'বিক্রি', profit: 'লাভ', costs: 'খরচ', purchase: 'কেনা'
                  };
                  return [`৳ ${fmtTk(Number(value))}`, labels[name] || name];
                }}
              />
              <Bar dataKey="sale" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} name="sale" />
              <Bar dataKey="costs" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={32} name="costs" />
              <Area type="monotone" dataKey="profit" fill="#3b82f6" fillOpacity={0.1} stroke="#3b82f6" strokeWidth={0} name="profit_area" hide />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#3b82f6" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 8, strokeWidth: 0 }}
                name="profit"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col items-center">
          <h3 className="text-xl font-black text-stone-900 mb-6 flex items-center gap-2 self-start">
            <PieIcon className="w-5 h-5 text-blue-500" />
            মোট লাভ বনাম ক্ষতি (বিক্রিত)
          </h3>
          <div className="h-[300px] w-full">
            {profitLossData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={profitLossData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {profitLossData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `৳ ${Number(value).toLocaleString()}`} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-400 font-bold italic">কোন পশু এখনো বিক্রি হয়নি</div>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex flex-col items-center">
          <h3 className="text-xl font-black text-stone-900 mb-6 flex items-center gap-2 self-start">
            <Clock className="w-5 h-5 text-amber-500" />
            পশুদের বর্তমান বয়স (লাইভ)
          </h3>
          <div className="h-[300px] w-full">
            {agingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={agingData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {agingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-400 font-bold italic">বর্তমানে কোন লাইভ পশু নেই</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-stone-900 p-8 rounded-[2.5rem] text-white">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-400" />
          মুনাফা অর্জনকারী পশুদের তালিকা
        </h3>
        <div className="space-y-4">
          {stats.soldCowsAnalysis.length > 0 ? (
            stats.soldCowsAnalysis.slice(0, 10).map((item, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] flex flex-col gap-6 group hover:bg-white/10 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center text-amber-400 font-black text-xl shadow-inner">
                      #{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-white group-hover:text-amber-300 transition-colors">{item.tag}</h4>
                      <p className="text-[11px] text-white/50 uppercase tracking-[0.2em] font-black">সময়কাল: {item.duration}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-lg font-black ${item.isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.isProfitable ? '+' : '-'}৳{fmtTk(Math.abs(item.profit))}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {([
                    { label: 'দৈনিক গড়',   val: item.metrics.daily   },
                    { label: 'ঘণ্টা প্রতি', val: item.metrics.hourly  },
                    { label: 'মাসিক হার',   val: item.metrics.monthly },
                    { label: 'বার্ষিক হার', val: item.metrics.yearly  },
                  ] as const).map(({ label, val }) => (
                    <div key={label} className="bg-black/20 p-3 rounded-xl border border-white/5 min-w-0">
                      <p className="text-[9px] text-white/30 uppercase font-black mb-1">{label}</p>
                      <p className="text-xs font-bold text-white/90 truncate">৳ {fmtTk(Math.round(val))}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-white/20 font-black italic">এখনো কোন পশু বিক্রি করা হয়নি</div>
          )}
        </div>
        
        {stats.soldCowsAnalysis.length > 0 && stats.totalSoldProfit > stats.totalSoldLoss && (
          <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4 animate-pulse">
            <Star className="w-8 h-8 text-emerald-400" />
            <p className="text-sm font-bold text-emerald-100 italic">চমৎকার! আপনার খামার দারুণ মুনাফা করছে। এগিয়ে যান!</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={<Calendar />} label="আগত ৩ মাস" value={stats.aging.over3Months} color="bg-emerald-50 text-emerald-600" />
        <MetricCard icon={<Activity />} label="আগত ৬ মাস" value={stats.aging.over6Months} color="bg-blue-50 text-blue-600" />
        <MetricCard icon={<Heart />} label="আগত ৯ মাস" value={stats.aging.over9Months} color="bg-amber-50 text-amber-600" />
        <MetricCard icon={<ShieldCheck />} label="১ বছর+" value={stats.aging.over1Year} color="bg-rose-50 text-rose-600" />
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  return (
    <div className={`p-6 rounded-[2rem] border border-stone-100 bg-white shadow-sm flex flex-col items-center justify-center text-center transition-all hover:scale-105`}>
      <div className={`p-3 rounded-2xl mb-3 ${color} bg-opacity-10`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      </div>
      <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-stone-800 tabular-nums">{value} <span className="text-xs">টি</span></p>
    </div>
  );
}
