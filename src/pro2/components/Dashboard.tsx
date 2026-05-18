import { 
  Plus, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle,
  Clock,
  Package,
  Box,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';
import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Tooltip
} from 'recharts';
import { useFirebase } from '../lib/FirebaseContext';

const StatsCard = ({ title, amount, icon: Icon, colorClass, delay = 0, trend, onClick }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    onClick={onClick}
    className={`p-5 rounded-3xl ${colorClass} text-white flex flex-col gap-3 shadow-xl ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-95 transition-all' : ''}`}
  >
    <div className="flex justify-between items-center">
      <div className="p-2 bg-white/20 rounded-xl">
        <Icon size={20} />
      </div>
      {trend && (
        <span className="text-[10px] font-semibold bg-white/20 px-2 py-1 rounded-full uppercase tracking-tighter">{trend}</span>
      )}
    </div>
    <div>
      <p className="text-xs font-medium opacity-80 font-bengali">{title}</p>
      <h3 className="text-2xl font-bold tracking-tight">৳{amount.toLocaleString()}</h3>
    </div>
  </motion.div>
);

export const Dashboard = ({ onSelectBorrower, onSelectStock, onShowMyDebts, onSwitchTab }: { onSelectBorrower: (id: string) => void, onSelectStock: (category: any) => void, onShowMyDebts: (mode: 'debts' | 'payments') => void, onSwitchTab: (tab: string) => void, key?: string }) => {
  const { loans, borrowers, stocks, myDebts } = useFirebase();
  const [time, setTime] = React.useState(new Date());

  const stats = useMemo(() => {
    const totalLent = loans.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
    const totalDue = loans.reduce((acc, l) => acc + (Number(l.remainingAmount) || 0), 0);
    const totalCollected = Math.max(0, totalLent - totalDue);
    
    const fertilizerStock = stocks.filter(s => s.category === 'Fertilizer').reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);
    const otherStock = stocks.filter(s => s.category === 'Other').reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);

    // My debts (money I owe others)
    const myTotalRemaining = myDebts.reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);
    const myTotalBorrowed = myDebts.reduce((sum, d) => sum + (Number(d.totalAmount) || 0), 0);
    const myTotalPaid = myDebts.reduce((sum, d) => {
      return sum + (d.payments?.reduce((pSum, p) => pSum + (Number(p.amount) || 0), 0) || 0);
    }, 0);

    // Calculate monthly collection for the last 6 months
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
        const monthIndex = last6Months.findIndex(m => m.month === pDate.getMonth() && m.year === pDate.getFullYear());
        if (monthIndex !== -1) {
          last6Months[monthIndex].total += Number(p.amount) || 0;
        }
      });
    });

    const chartData = last6Months.map(({ name, total }) => ({ name, total }));

    return { totalLent, totalDue, totalCollected, chartData, fertilizerStock, otherStock, myTotalRemaining, myTotalBorrowed, myTotalPaid };
  }, [loans, stocks, myDebts]);

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="pb-32 pt-8 px-5 flex flex-col gap-8 max-w-2xl mx-auto">
      {/* Header & Clock */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-bengali tracking-tight">স্বাগতম!</h1>
          <p className="text-gray-400 text-sm font-bengali">আপনার আজকের হিসাব একনজরে</p>
        </div>
        <div className="text-right">
          <p className="text-premium-cyan font-bold text-lg leading-none mb-1">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
          <p className="text-gray-500 text-[10px] font-medium tracking-wider">{time.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatsCard 
          title="মোট বাকি" 
          amount={stats.totalDue} 
          icon={AlertCircle} 
          colorClass="card-gradient-1"
          delay={0.05}
          trend={stats.totalDue > 0 ? "বাকি আছে" : "পরিশোধিত"}
          onClick={() => onSwitchTab('borrowers')}
        />
        <StatsCard 
          title="মোট আদায়" 
          amount={stats.totalCollected} 
          icon={TrendingUp} 
          colorClass="card-gradient-4"
          delay={0.1}
          trend={stats.totalCollected > 0 ? "আদায়কৃত" : "শুরু করুন"}
          onClick={() => onSwitchTab('borrowers')}
        />

        {/* My Personal Debt Stats - Prominent */}
        <div className="col-span-2 cursor-pointer" onClick={() => onShowMyDebts('debts')}>
          <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-600 to-indigo-600 text-white flex flex-col gap-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet size={80} />
            </div>
            <div className="flex justify-between items-center">
              <div className="p-2 bg-white/20 rounded-xl">
                <ArrowDownRight size={24} />
              </div>
              <span className="text-[10px] font-semibold bg-white/20 px-2 py-1 rounded-full uppercase tracking-tighter">ব্যক্তিগত ঋণ</span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-medium opacity-80 font-bengali">বর্তমানে মোট বাকি</p>
                <h3 className="text-3xl font-bold tracking-tight">৳{stats.myTotalRemaining.toLocaleString()}</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] opacity-70 font-bengali">মোট গৃহীত ঋণ</p>
                <p className="font-bold">৳{stats.myTotalBorrowed.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Stats */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.25 }}
           onClick={() => onSelectStock('Fertilizer')}
           className={`p-5 rounded-3xl card-gradient-2 text-white flex flex-col gap-3 shadow-xl cursor-pointer hover:scale-[1.02] transition-all`}
        >
          <div className="flex justify-between items-center">
            <div className="p-2 bg-white/20 rounded-xl">
              <Package size={20} />
            </div>
            <span className="text-[10px] font-semibold bg-white/20 px-2 py-1 rounded-full uppercase tracking-widest font-bold">সার</span>
          </div>
          <div>
            <p className="text-xs font-medium opacity-80 font-bengali">মোট স্টক সার</p>
            <h3 className="text-2xl font-bold tracking-tight">{stats.fertilizerStock} <span className="text-sm font-normal font-bengali">বস্তা</span></h3>
          </div>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           onClick={() => onSelectStock('Other')}
           className={`p-5 rounded-3xl card-gradient-3 text-white flex flex-col gap-3 shadow-xl cursor-pointer hover:scale-[1.02] transition-all`}
        >
          <div className="flex justify-between items-center">
            <div className="p-2 bg-white/20 rounded-xl">
              <Box size={20} />
            </div>
            <span className="text-[10px] font-semibold bg-white/20 px-2 py-1 rounded-full uppercase tracking-widest font-bold font-bengali">অন্যান্য</span>
          </div>
          <div>
            <p className="text-xs font-medium opacity-80 font-bengali">অন্যান্য স্টক</p>
            <h3 className="text-2xl font-bold tracking-tight">{stats.otherStock} <span className="text-sm font-normal font-bengali">একক</span></h3>
          </div>
        </motion.div>
      </div>

      {/* Top 3 Borrowers */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-premium p-6 rounded-3xl"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold font-bengali">শীর্ষ ৩ জন ঋণ গ্রহীতা</h3>
          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-bold">HIGH DEBT</span>
        </div>
        <div className="flex flex-col gap-3">
          {loans.length > 0 ? (
            loans
              .filter(l => Number(l.remainingAmount) > 0)
              .sort((a, b) => Number(b.remainingAmount) - Number(a.remainingAmount))
              .slice(0, 3)
              .map((loan) => {
                const borrower = borrowers.find(b => b.id === loan.borrowerId);
                return (
                  <div 
                    key={loan.id} 
                    onClick={() => onSelectBorrower(loan.borrowerId)}
                    className="flex justify-between items-center p-3 glass rounded-xl border-l-4 border-indigo-400 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <p className="font-bold font-bengali text-sm">{borrower?.name || 'অজানা'}</p>
                      <p className="text-[10px] text-gray-500 font-bengali">ঋণের বয়স: {Math.floor((new Date().getTime() - new Date(loan.giveDate).getTime()) / (1000 * 3600 * 24))} দিন</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-premium-blue">৳{Number(loan.remainingAmount).toLocaleString()}</p>
                      <p className="text-[8px] text-gray-400 uppercase">বাকি টাকা</p>
                    </div>
                  </div>
                );
              })
          ) : (
            <p className="text-center text-gray-500 text-sm font-bengali py-4">কোনো সক্রিয় ঋণ নেই</p>
          )}
        </div>
      </motion.div>

      {/* Analytics Chart */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="glass-premium p-6 rounded-3xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <TrendingUp size={80} />
        </div>
        <h3 className="text-lg font-bold font-bengali mb-6">আদায়ের ট্রেন্ড</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60EFFF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#60EFFF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                itemStyle={{ color: '#60EFFF' }}
              />
              <Area type="monotone" dataKey="total" stroke="#60EFFF" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Quick Access / Alerts */}
      <h3 className="text-lg font-bold font-bengali -mb-2">তাত্ক্ষণিক সতর্কবার্তা</h3>
      <div className="flex flex-col gap-3">
        <div className="red-alert p-5 rounded-2xl flex items-center gap-4 group transition-all cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
            <Clock size={24} />
          </div>
          <div>
            <h4 className="font-bold font-bengali">ওভারডিউ অ্যালার্ট</h4>
            <p className="text-xs text-gray-400 font-bengali">পেমেন্ট ডেট পার হয়ে গেছে এমন গ্রাহক দেখুন।</p>
          </div>
          <button className="ml-auto p-2 bg-white/5 rounded-lg">
            <TrendingUp size={16} className="text-gray-400 rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
};
