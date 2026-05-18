import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  History, 
  ArrowRight, 
  LayoutDashboard,
  Calendar,
  CheckCircle2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CropProfile, SaleEntry } from '../types';
import { formatCurrency } from '../lib/storage';
import { numberToBanglaWords } from '../lib/numberToWords';

interface SalesManagerProps {
  profiles: CropProfile[];
  onAddSale: (profileId: string, sale: SaleEntry) => void;
  onDeleteSale: (profileId: string, saleId: string) => void;
  onOpenSidebar: () => void;
}

export default function SalesManager({ profiles, onAddSale, onDeleteSale, onOpenSidebar }: SalesManagerProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  
  // Sale Form State
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('বস্তা');
  const [unitPrice, setUnitPrice] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const liveProfiles = profiles.filter(p => (p.status || 'live') === 'live');
  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    if (val && unitPrice) {
      setTotalPrice((parseFloat(val) * parseFloat(unitPrice)).toString());
    } else if (val && totalPrice) {
      setUnitPrice((parseFloat(totalPrice) / parseFloat(val)).toFixed(2));
    }
  };

  const handleUnitPriceChange = (val: string) => {
    setUnitPrice(val);
    if (val && quantity) {
      setTotalPrice((parseFloat(val) * parseFloat(quantity)).toString());
    }
  };

  const handleTotalPriceChange = (val: string) => {
    setTotalPrice(val);
    if (val && quantity) {
      setUnitPrice((parseFloat(val) / parseFloat(quantity)).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId || !quantity || !totalPrice) return;

    const q = parseFloat(quantity);
    const tot = parseFloat(totalPrice);
    
    // Mix selected date with current time to avoid 00:00 UTC (which becomes 06:00 AM in BD)
    const now = new Date();
    const d = new Date(saleDate);
    d.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
    
    const newSale: SaleEntry = {
      id: Math.random().toString(36).substr(2, 9),
      quantity: q,
      unit,
      unitPrice: tot / q,
      totalAmount: tot,
      date: d.toISOString(),
      note: note || undefined
    };

    onAddSale(selectedProfileId, newSale);
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setQuantity('');
    setUnitPrice('');
    setTotalPrice('');
    setSaleDate(new Date().toISOString().split('T')[0]);
    setNote('');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FDFEFA]">
      <header className="sticky top-0 z-30 bg-[#FDFEFA]/80 backdrop-blur-md border-b border-border-subtle px-4 py-3 sm:px-6 sm:py-4 lg:p-8 flex items-center gap-3">
        <div className="flex items-center gap-6">
          <button 
            onClick={onOpenSidebar}
            className="lg:hidden p-3 bg-white rounded-2xl shadow-sm border border-border-subtle transition-all hover:bg-emerald-50"
          >
            <LayoutDashboard className="w-6 h-6 text-[#1e211f]" />
          </button>
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-white rounded-2xl p-1.5 shadow-sm border border-border-subtle">
               <img src="/portal-logo.png" alt="Prime Agro Biotech Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#1e211f] font-display tracking-tight leading-none">পণ্য বিক্রি (Product Sales)</h1>
              <p className="text-sm font-bold text-lime-500 uppercase tracking-[0.2em] opacity-50 mt-2 pl-1">Record and manage project harvests</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8 lg:p-12 space-y-12 pb-24 max-w-7xl mx-auto w-full">
        {!selectedProfileId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {liveProfiles.length > 0 ? (
              liveProfiles.map(profile => {
                const totalIncome = (profile.sales || []).reduce((sum, s) => sum + s.totalAmount, 0);
                const totalExpenses = profile.expenses.reduce((sum, e) => sum + e.amount, 0);
                
                return (
                  <motion.button
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedProfileId(profile.id)}
                    className="bg-white p-8 rounded-[3rem] shadow-premium border border-border-subtle text-left group hover:border-primary transition-all relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-10">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingCart className="w-7 h-7" />
                      </div>
                      <div className="bg-secondary/20 text-lime-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                        Live Now
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-[#1e211f] mb-2 truncate">{profile.name}</h3>
                    <p className="text-xs font-black text-stone-700 uppercase tracking-[0.2em] mb-6">বীজ বপন: {new Date(profile.startDate).toLocaleDateString('bn-BD')}</p>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <p className="text-xs font-black text-stone-700 uppercase tracking-widest">মোট বিক্রয়</p>
                        <p className="text-lg font-black text-emerald-600">{formatCurrency(totalIncome)}</p>
                      </div>
                      <div className="h-1.5 w-full bg-stone-50 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (totalIncome / (totalExpenses || 1)) * 100)}%` }} />
                      </div>
                      <p className="text-xs font-bold text-center text-stone-700 italic">Click to manage sales</p>
                    </div>
                  </motion.button>
                );
              })
            ) : (
              <div className="col-span-full py-32 text-center">
                 <div className="w-20 h-20 bg-stone-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-stone-700" />
                 </div>
                 <h2 className="text-xl font-black text-stone-700 mb-2">কোন সচল প্রজেক্ট নেই</h2>
                 <p className="text-xs font-bold text-stone-700 uppercase tracking-widest">পণ্য বিক্রির জন্য প্রথমে একটি প্রজেক্ট শুরু করুন</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Form and Profile Summary */}
            <div className="lg:col-span-1 space-y-8">
              <button 
                onClick={() => {
                  setSelectedProfileId(null);
                  setIsAdding(false);
                }}
                className="flex items-center gap-3 text-stone-700 hover:text-[#1e211f] transition-colors mb-4 group"
              >
                <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-black uppercase tracking-widest">ফিরে যান</span>
              </button>

              <div className="bg-primary text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-2xl font-black mb-2">{selectedProfile?.name}</h2>
                  <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-8">আর্থিক স্থিতি বিশ্লেষণ</p>
                  
                  <div className="space-y-6">
                    <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                      <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-2">মোট লগ্নী</p>
                      <p className="text-2xl font-black text-white">
                        {formatCurrency(selectedProfile?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0)}
                      </p>
                    </div>
                    <div className="p-6 bg-secondary/10 backdrop-blur-md rounded-2xl border border-secondary/20">
                      <p className="text-xs font-black text-lime-400 uppercase tracking-widest mb-2">বর্তমান বিক্রয়</p>
                      <p className="text-2xl font-black text-lime-400">
                        {formatCurrency(selectedProfile?.sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0)}
                      </p>
                    </div>

                    <div className={`p-6 rounded-2xl border backdrop-blur-md ${((selectedProfile?.sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0) - (selectedProfile?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0)) >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                      <p className={`text-xs font-black uppercase tracking-widest mb-2 ${((selectedProfile?.sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0) - (selectedProfile?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0)) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>লাভ/ক্ষতি</p>
                      <p className={`text-2xl font-black ${((selectedProfile?.sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0) - (selectedProfile?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0)) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {formatCurrency((selectedProfile?.sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0) - (selectedProfile?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0))}
                      </p>
                    </div>
                  </div>
                </div>
                <ShoppingCart className="absolute -right-10 -bottom-10 w-48 h-48 opacity-[0.03] -rotate-12" />
              </div>

              {!isAdding ? (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="w-full bg-white p-8 rounded-[2.5rem] border-2 border-dashed border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-500 transition-all group flex flex-col items-center gap-4"
                >
                  <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-black uppercase tracking-widest">নতুন বিক্রয় যুক্ত করুন</span>
                </button>
              ) : (
                <motion.form 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onSubmit={handleSubmit}
                  className="bg-white p-10 rounded-[3rem] shadow-premium border border-emerald-200"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-black text-[#1e211f]">নতুন বিক্রয়</h3>
                    <button type="button" onClick={() => setIsAdding(false)} className="text-red-400 hover:text-red-500">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-xs font-black text-stone-700 uppercase tracking-widest mb-3 block">পরিমাণ (Quantity)</label>
                      <div className="flex gap-3">
                        <input 
                          type="number"
                          required
                          value={quantity || ''}
                          onChange={(e) => handleQuantityChange(e.target.value)}
                          placeholder="0.00"
                          className="flex-1 bg-bg-page border border-border-subtle rounded-2xl px-6 py-4 font-black transition-all focus:border-emerald-500 outline-none text-lg"
                        />
                        <select 
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          className="w-24 bg-bg-page border border-border-subtle rounded-2xl px-3 font-black text-xs uppercase"
                        >
                          <option value="বস্তা">বস্তা</option>
                          <option value="মন">মন</option>
                          <option value="কেজি">কেজি</option>
                          <option value="টি">টি</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-black text-stone-700 uppercase tracking-widest mb-3 block">একক দাম (Unit Price)</label>
                        <div className="relative">
                          <input 
                            type="number"
                            step="0.01"
                            value={unitPrice || ''}
                            onChange={(e) => handleUnitPriceChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-bg-page border border-border-subtle rounded-2xl px-6 py-4 font-black transition-all focus:border-emerald-500 outline-none text-lg pl-12"
                          />
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-700 font-black text-lg">৳</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-black text-stone-700 uppercase tracking-widest mb-3 block">সর্বমোট দাম (Total Price)</label>
                        <div className="relative">
                          <input 
                            type="number"
                            step="0.01"
                            value={totalPrice || ''}
                            onChange={(e) => handleTotalPriceChange(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-bg-page border border-border-subtle rounded-2xl px-6 py-4 font-black transition-all focus:border-emerald-500 outline-none text-lg pl-12 border-emerald-100"
                          />
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-700 font-black text-lg text-emerald-600">৳</span>
                        </div>
                        {totalPrice && parseFloat(totalPrice) > 0 && (
                          <p className="mt-2 text-xs font-bold text-emerald-600/60 px-2 italic">
                            কথায়: {numberToBanglaWords(totalPrice)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-black text-stone-700 uppercase tracking-widest mb-3 block">বিক্রয়ের তারিখ (Sale Date)</label>
                      <input 
                        type="date"
                        required
                        value={saleDate}
                        onChange={(e) => setSaleDate(e.target.value)}
                        className="w-full bg-bg-page border border-border-subtle rounded-2xl px-6 py-4 font-black transition-all focus:border-emerald-500 outline-none"
                      />
                    </div>

                    {quantity && unitPrice && (
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex justify-between items-center">
                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">সর্বমোট</span>
                        <span className="text-xl font-black text-emerald-600">{formatCurrency(parseFloat(quantity) * parseFloat(unitPrice))}</span>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-black text-stone-700 uppercase tracking-widest mb-3 block">টীকা (ঐচ্ছিক)</label>
                      <textarea 
                        value={note || ''}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="অতিরিক্ত তথ্য..."
                        className="w-full bg-bg-page border border-border-subtle rounded-2xl px-6 py-4 font-bold text-sm transition-all focus:border-emerald-500 outline-none min-h-[100px] resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-emerald-500 text-white font-black uppercase tracking-widest py-5 rounded-2xl shadow-xl hover:bg-emerald-600 active:scale-95 transition-all text-sm"
                    >
                      বিক্রি নিশ্চিত করুন
                    </button>
                  </div>
                </motion.form>
              )}
            </div>

            {/* Right Column: Sales History */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-12 rounded-[3.5rem] shadow-premium border border-border-subtle min-h-[600px] flex flex-col group">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-[#1e211f]">
                      <History className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black text-[#1e211f] leading-none tracking-tight">বিক্রয় ইতিহাস (Sales Log)</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-stone-700" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-stone-700">{new Date().toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  {selectedProfile?.sales && selectedProfile.sales.length > 0 ? (
                    selectedProfile.sales.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(sale => (
                      <div key={sale.id} className="bg-bg-page/50 border border-border-subtle/50 p-6 rounded-[2rem] hover:bg-white hover:shadow-lg transition-all flex items-center justify-between group/item">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover/item:rotate-12 transition-transform">
                              <CheckCircle2 className="w-6 h-6" />
                           </div>
                           <div>
                              <div className="flex items-center gap-3 mb-1">
                                <p className="text-lg font-black text-[#1e211f] leading-none">{sale.quantity} {sale.unit}</p>
                                <span className="bg-stone-50 text-stone-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">{formatCurrency(sale.unitPrice)} / {sale.unit}</span>
                              </div>
                              <p className="text-xs font-bold text-stone-700 uppercase tracking-widest">{new Date(sale.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                              {sale.note && <p className="text-xs text-stone-3000 mt-2 font-medium italic">"{sale.note}"</p>}
                           </div>
                        </div>
                        <div className="flex items-center gap-8">
                           <div className="text-right">
                              <p className="text-xs font-black text-stone-700 uppercase tracking-widest leading-none mb-1">Total</p>
                              <p className="text-xl font-black text-emerald-600 leading-none">{formatCurrency(sale.totalAmount)}</p>
                           </div>
                           <button 
                             type="button"
                             onClick={(e) => {
                               e.preventDefault();
                               e.stopPropagation();
                               onDeleteSale(selectedProfile.id, sale.id);
                             }}
                             className="p-3 hover:bg-red-50 text-red-300 hover:text-red-500 rounded-xl transition-all z-[100] cursor-pointer"
                           >
                             <Trash2 className="w-5 h-5 pointer-events-none" />
                           </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-20 opacity-20">
                       <ShoppingCart className="w-20 h-20 mb-6" />
                       <p className="text-sm font-black uppercase tracking-[0.4em]">No sales logged yet</p>
                    </div>
                  )}
                </div>

                {selectedProfile?.sales && selectedProfile.sales.length > 0 && (
                  <div className="mt-12 pt-10 border-t border-stone-200 flex justify-between items-end">
                    <div>
                      <p className="text-xs font-black text-stone-700 uppercase tracking-[0.2em] mb-2 leading-none">মোট উৎপাদিত পণ্য</p>
                      <h4 className="text-xl font-black text-[#1e211f] leading-none">
                        {Array.from(new Set(selectedProfile.sales.map(s => s.unit))).map(unit => {
                          const qty = selectedProfile.sales?.filter(s => s.unit === unit).reduce((sum, s) => sum + s.quantity, 0);
                          return `${qty} ${unit}`;
                        }).join(', ')}
                      </h4>
                    </div>
                    <div className="text-right">
                       <div className="bg-emerald-500 text-white px-8 py-5 rounded-2xl shadow-xl">
                          <p className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-1 leading-none">সর্বমোট বিক্রয়লব্ধ অর্থ</p>
                          <p className="text-3xl font-black">{formatCurrency(selectedProfile.sales.reduce((sum, s) => sum + s.totalAmount, 0))}</p>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
