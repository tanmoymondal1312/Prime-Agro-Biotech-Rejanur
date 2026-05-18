import { 
  TrendingUp, 
  PieChart, 
  Calendar, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react';
import { motion } from 'motion/react';
import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { useFirebase } from '../lib/FirebaseContext';

export const Reports = ({ onSelectBorrower, key }: { onSelectBorrower: (id: string) => void, key?: string }) => {
  const { loans, borrowers, myDebts } = useFirebase();

  const analytics = useMemo(() => {
    const totalLent = loans.reduce((acc, l) => acc + Number(l.amount), 0);
    const totalDue = loans.reduce((acc, l) => acc + Number(l.remainingAmount), 0);
    const totalPaid = totalLent - totalDue;
    const efficiency = totalLent > 0 ? (totalPaid / totalLent) * 100 : 0;

    // My Debts Analytics
    const myTotalBorrowed = myDebts.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
    const myTotalRemaining = myDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const myTotalPaid = myTotalBorrowed - myTotalRemaining;
    const myDebtRepaymentRate = myTotalBorrowed > 0 ? (myTotalPaid / myTotalBorrowed) * 100 : 0;

    // Monthly Trend
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month: d.getMonth(),
        year: d.getFullYear(),
        name: d.toLocaleString('bn-BD', { month: 'short' }),
        total: 0
      };
    });

    loans.forEach(loan => {
      loan.payments?.forEach(p => {
        const pDate = new Date(p.date);
        const mIdx = last6Months.findIndex(m => m.month === pDate.getMonth() && m.year === pDate.getFullYear());
        if (mIdx !== -1) last6Months[mIdx].total += Number(p.amount) || 0;
      });
    });

    return { 
      totalLent, totalDue, totalPaid, efficiency, 
      myTotalBorrowed, myTotalRemaining, myTotalPaid, myDebtRepaymentRate, 
      netBalance: totalDue - myTotalRemaining,
      chartData: last6Months.map(m => ({ name: m.name, total: m.total }))
    };
  }, [loans, myDebts]);

  // Grouped personal debts for report
  const personalDebtSummary = useMemo(() => {
    return myDebts
      .map(d => {
        const age = Math.floor((new Date().getTime() - new Date(d.date).getTime()) / (1000 * 3600 * 24));
        const paidAmount = d.totalAmount - d.remainingAmount;
        const repaymentProgress = (paidAmount / d.totalAmount) * 100;
        return { ...d, age, paidAmount, repaymentProgress };
      })
      .sort((a, b) => b.age - a.age);
  }, [myDebts]);

  const activePersonalDebts = personalDebtSummary.filter(d => d.remainingAmount > 0);
  const paidPersonalDebts = personalDebtSummary.filter(d => d.remainingAmount <= 0);

  // Grouped borrowers by "Highest Risk" (Oldest debt age)
  const pendingBorrowers = useMemo(() => {
    return borrowers
      .map(b => {
        const bLoans = loans.filter(l => l.borrowerId === b.id && Number(l.remainingAmount) > 0);
        const totalDue = bLoans.reduce((acc, l) => acc + Number(l.remainingAmount), 0);
        const oldestLoanDate = bLoans.length > 0 
          ? new Date(Math.min(...bLoans.map(l => new Date(l.giveDate).getTime())))
          : null;
        const age = oldestLoanDate ? Math.floor((new Date().getTime() - oldestLoanDate.getTime()) / (1000 * 3600 * 24)) : 0;
        
        return { ...b, totalDue, age };
      })
      .filter(b => b.totalDue > 0)
      .sort((a, b) => b.age - a.age); // Sort by age descending
  }, [borrowers, loans]);

  return (
    <div className="pb-32 pt-8 px-5 flex flex-col gap-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold font-bengali">ফিন্যান্সিয়াল রিপোর্ট</h1>
          <p className="text-gray-400 text-sm font-bengali">আপনার লেনদেনের বিস্তারিত সারাংশ</p>
        </div>
        <div className={`p-3 rounded-2xl ${analytics.netBalance >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} text-right`}>
           <p className="text-[10px] font-bold uppercase font-bengali">নেট ব্যালেন্স</p>
           <p className="text-xl font-bold tracking-tight">৳{analytics.netBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Net Worth / Position Card */}
      <div className="glass-premium p-6 rounded-3xl grid grid-cols-2 gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
        <div className="flex flex-col gap-1">
          <p className="text-[10px] text-gray-500 font-bold uppercase font-bengali">মোট প্রাপ্য (Receivables)</p>
          <p className="text-2xl font-bold text-indigo-400">৳{analytics.totalDue.toLocaleString()}</p>
          <p className="text-[8px] text-gray-500 font-bengali uppercase">অন্যদের কাছে পাবেন</p>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <p className="text-[10px] text-gray-500 font-bold uppercase font-bengali">মোট দেয় (Payables)</p>
          <p className="text-2xl font-bold text-rose-400">৳{analytics.myTotalRemaining.toLocaleString()}</p>
          <p className="text-[8px] text-gray-500 font-bengali uppercase">অন্যদের দিতে হবে</p>
        </div>
      </div>

      {/* Monthly Collection Trend Chart in Reports */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold font-bengali flex items-center gap-2">
          <BarChart3 size={20} className="text-indigo-400" />
          মাসিক আদায়ের ট্রেন্ড
        </h3>
        <div className="glass-premium p-6 rounded-3xl h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.chartData}>
              <defs>
                <linearGradient id="colorTotalReport" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '10px', color: '#fff', fontFamily: 'bn-BD' }}
              />
              <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotalReport)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-5 rounded-3xl flex flex-col gap-2">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
            <ArrowUpRight size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase font-bengali mb-1">মোট আদায়</p>
            <p className="text-lg font-bold">৳{analytics.totalPaid.toLocaleString()}</p>
          </div>
        </div>
        <div className="glass p-5 rounded-3xl flex flex-col gap-2 border-orange-500/20">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400">
            <ArrowDownRight size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase font-bengali mb-1">বর্তমানে বাকি</p>
            <p className="text-lg font-bold text-orange-400">৳{analytics.totalDue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Critical Pending List */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold font-bengali flex items-center gap-2">
            <Calendar size={20} className="text-red-400" />
            সেরা বকেয়া তালিকা
          </h3>
          <span className="text-[10px] text-gray-500 uppercase">Age of Debt</span>
        </div>
        
        <div className="flex flex-col gap-3">
          {pendingBorrowers.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => onSelectBorrower(b.id)}
              className="p-4 glass rounded-2xl flex justify-between items-center group cursor-pointer hover:border-indigo-400/30 transition-all border-l-4 border-l-red-500/50"
            >
              <div className="flex flex-col gap-1">
                <span className="font-bold font-bengali">{b.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] p-1 px-2 rounded-full font-bold ${b.age > 30 ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    {b.age} দিন অতিবাহিত
                  </span>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-bold text-orange-400 text-sm">৳{b.totalDue.toLocaleString()}</p>
                  <p className="text-[8px] text-gray-500 uppercase">Total Due</p>
                </div>
                <ChevronRight size={18} className="text-gray-600 group-hover:text-indigo-400 transition-colors" />
              </div>
            </motion.div>
          ))}
          
          {pendingBorrowers.length === 0 && (
            <div className="text-center py-10 glass rounded-3xl border-dashed border-white/10 opacity-50">
              <p className="text-gray-500 font-bengali">কোনো বকেয়া ঋণ নেই</p>
            </div>
          )}
        </div>
      </div>

      {/* Personal Debt Report Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold font-bengali flex items-center gap-2">
          <TrendingUp size={20} className="text-rose-400" />
          আমার ঋণের বিস্তারিত রিপোর্ট
        </h3>

        <div className="glass-premium p-6 rounded-3xl flex flex-col gap-5 border border-rose-500/10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase font-bengali">মোট গৃহিত ঋণ</p>
              <p className="text-xl font-bold">৳{analytics.myTotalBorrowed.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 font-bold uppercase font-bengali">মোট পরিশোধ</p>
              <p className="text-xl font-bold text-emerald-400">৳{analytics.myTotalPaid.toLocaleString()}</p>
            </div>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${analytics.myDebtRepaymentRate}%` }}
               className="h-full bg-rose-500"
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold font-bengali text-gray-400 uppercase">
             <span>বর্তমানে বাকি ঋণ</span>
             <span className="text-rose-400 text-sm">৳{analytics.myTotalRemaining.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {activePersonalDebts.map((d, i) => (
            <div key={d.id} className="p-5 glass rounded-3xl flex flex-col gap-4 border-l-4 border-l-rose-500/50">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-lg font-bengali">{d.lenderName}</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">গৃহিত: {new Date(d.date).toLocaleDateString('bn-BD')}</p>
                </div>
                <div className="text-right">
                   <p className="text-lg font-bold text-rose-400">৳{d.remainingAmount.toLocaleString()}</p>
                   <p className="text-[8px] text-gray-500 uppercase font-bold">বাকি আছে</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="glass p-2 px-3 rounded-xl">
                   <p className="text-[8px] text-gray-500 font-bengali uppercase">ঋণের বয়স</p>
                   <p className="text-xs font-bold">{d.age} দিন</p>
                </div>
                <div className="glass p-2 px-3 rounded-xl col-span-2">
                   <p className="text-[8px] text-gray-500 font-bengali uppercase">শোধ করার টার্গেট</p>
                   <p className="text-xs font-bold font-bengali text-indigo-400">
                     {d.dueDate ? new Date(d.dueDate).toLocaleDateString('bn-BD') : 'নির্ধারিত নেই'}
                   </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-[8px] uppercase font-bold text-gray-500">
                  <span>পরিশোধের অগ্রগতি</span>
                  <span>{d.repaymentProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${d.repaymentProgress}%` }} />
                </div>
              </div>
            </div>
          ))}

          {activePersonalDebts.length === 0 && (
             <div className="text-center py-6 glass rounded-3xl border-dashed border-white/10 opacity-50">
               <p className="text-gray-500 font-bengali text-xs">আপনার কোনো ঋণ বর্তমানে বাকি নেই</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
