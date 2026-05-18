import React, { useState, useMemo } from 'react';
import { 
  Archive, 
  Plus, 
  History, 
  ArrowRight, 
  LayoutDashboard,
  Calendar,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Warehouse,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Sprout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CropProfile, StockEntry, StockSaleEntry } from '../types';
import { formatCurrency } from '../lib/storage';
import { numberToBanglaWords } from '../lib/numberToWords';

interface StockManagerProps {
  profiles: CropProfile[];
  onAddStock: (profileId: string, stock: StockEntry) => void;
  onAddStockSale: (profileId: string, sale: StockSaleEntry) => void;
  onDeleteStock: (profileId: string, stockId: string) => void;
  onDeleteStockSale: (profileId: string, saleId: string) => void;
  onDeleteProfile: (id: string) => void;
  onOpenSidebar: () => void;
  onAddProfile?: () => void;
}

const LOCATION_LABELS: Record<string, string> = {
  cold_store: 'কোল্ড স্টোর (Cold Store)',
  home: 'বাসার গোডাউন (Home)',
  others: 'অন্যান্য (Others)'
};

export default function StockManager({ 
  profiles, 
  onAddStock, 
  onAddStockSale, 
  onDeleteStock, 
  onDeleteStockSale, 
  onDeleteProfile,
  onOpenSidebar,
  onAddProfile
}: StockManagerProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'view' | 'add_stock' | 'sell_stock'>('view');
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);

  // Stock Form State
  const [location, setLocation] = useState<'cold_store' | 'home' | 'others'>('cold_store');
  const [bags, setBags] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('কেজি');
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [source, setSource] = useState<'internal' | 'external'>('internal');
  const [purchasePrice, setPurchasePrice] = useState('');

  // Sale Form State
  const [saleBags, setSaleBags] = useState('');
  const [saleQuantity, setSaleQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [saleNote, setSaleNote] = useState('');

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);
  const selectedStock = selectedProfile?.stocks?.find(s => s.id === selectedStockId);

  // Profiles that can receive new stock (must be live)
  const activeProfiles = profiles.filter(p => (p.status || 'live') === 'live');
  
  // Profiles that currently have stock to view/sell (live or archived with stocks)
  const profilesWithStock = profiles.filter(p => (p.stocks || []).length > 0 || (p.status || 'live') === 'live');

  // Helper to calculate remaining stock
  const getRemainingStock = (stock: StockEntry, profile: CropProfile) => {
    const sales = (profile.stockSales || []).filter(s => s.stockEntryId === stock.id);
    const soldBags = sales.reduce((sum, s) => sum + s.bags, 0);
    const soldQty = sales.reduce((sum, s) => sum + s.quantity, 0);
    return {
      bags: stock.bags - soldBags,
      quantity: stock.quantity - soldQty
    };
  };

  // Helper to calculate days held
  const calculateDaysHeld = (date: string) => {
    const start = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  };

  const totalExpenses = useMemo(() => {
    if (!selectedProfile) return 0;
    return (selectedProfile.expenses || []).reduce((sum, e) => sum + e.amount, 0);
  }, [selectedProfile]);

  const calculatedInternalPrice = useMemo(() => {
    if (source === 'external') return purchasePrice;
    return totalExpenses.toString();
  }, [source, purchasePrice, totalExpenses]);

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId || (!bags && !quantity)) return;

    const newStock: StockEntry = {
      id: Math.random().toString(36).substr(2, 9),
      location,
      bags: parseFloat(bags) || 0,
      quantity: parseFloat(quantity) || 0,
      unit,
      date: new Date(stockDate).toISOString(),
      note: note || undefined,
      source,
      purchasePrice: source === 'external' ? (parseFloat(purchasePrice) || 0) : parseFloat(calculatedInternalPrice)
    };

    onAddStock(selectedProfileId, newStock);
    resetStockForm();
    setActiveTab('view');
  };

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId || !selectedStockId || (!saleQuantity && !saleBags) || !totalPrice) return;

    const remaining = getRemainingStock(selectedStock!, selectedProfile!);
    const q = parseFloat(saleQuantity) || 0;
    const b = parseFloat(saleBags) || 0;

    if (q > remaining.quantity || b > remaining.bags) {
      alert('স্টকে পর্যাপ্ত মাল নেই!');
      return;
    }

    const newSale: StockSaleEntry = {
      id: Math.random().toString(36).substr(2, 9),
      stockEntryId: selectedStockId,
      bags: b,
      quantity: q,
      unit: selectedStock!.unit,
      unitPrice: parseFloat(unitPrice) || 0,
      totalAmount: parseFloat(totalPrice),
      date: new Date(saleDate).toISOString(),
      note: saleNote || undefined
    };

    onAddStockSale(selectedProfileId, newSale);
    resetSaleForm();
    setActiveTab('view');
    setSelectedStockId(null);
  };

  const resetStockForm = () => {
    setBags('');
    setQuantity('');
    setNote('');
    setStockDate(new Date().toISOString().split('T')[0]);
    setSource('internal');
    setPurchasePrice('');
  };

  const totalSalesStats = useMemo(() => {
    if (!selectedProfile) return { totalAmount: 0, totalBags: 0, totalQty: 0 };
    return (selectedProfile.stockSales || []).reduce((acc, sale) => ({
      totalAmount: acc.totalAmount + (sale.totalAmount || 0),
      totalBags: acc.totalBags + (sale.bags || 0),
      totalQty: acc.totalQty + (sale.quantity || 0)
    }), { totalAmount: 0, totalBags: 0, totalQty: 0 });
  }, [selectedProfile]);

  const resetSaleForm = () => {
    setSaleBags('');
    setSaleQuantity('');
    setUnitPrice('');
    setTotalPrice('');
    setSaleNote('');
    setSaleDate(new Date().toISOString().split('T')[0]);
  };

  const handleDeleteProfileLocal = (id: string) => {
    onDeleteProfile(id);
    if (selectedProfileId === id) {
      setSelectedProfileId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-bg-page">
            <main className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 lg:space-y-10 pb-24 max-w-7xl mx-auto w-full">
        {!selectedProfileId && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {Object.entries(LOCATION_LABELS).map(([locKey, locLabel]) => {
              const locStocks = profilesWithStock.flatMap(p => 
                (p.stocks || [])
                  .filter(s => s.location === locKey)
                  .map(s => ({ ...s, profileName: p.name, remaining: getRemainingStock(s, p) }))
              ).filter(s => s.remaining.bags > 0 || s.remaining.quantity > 0);

              const totalLocBags = locStocks.reduce((sum, s) => sum + s.remaining.bags, 0);

              return (
                <div key={locKey} className={`p-6 rounded-[2.5rem] border shadow-sm transition-all hover:scale-[1.02] ${
                  locKey === 'cold_store' ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20' : 
                  locKey === 'home' ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20' : 
                  'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20'
                }`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      locKey === 'cold_store' ? 'bg-blue-500 text-white' : 
                      locKey === 'home' ? 'bg-amber-500 text-white' : 
                      'bg-emerald-500 text-white'
                    }`}>
                      <Warehouse className="w-5 h-5" />
                    </div>
                    <h3 style={{ color:"#111827" }} className="font-black text-sm uppercase tracking-wider">{locLabel.split(' (')[0]}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {locStocks.length > 0 ? (
                      locStocks.map(s => (
                        <div key={s.id} className="p-4 bg-white/60 dark:bg-black/40 rounded-2xl border border-white/20 dark:border-white/5 flex justify-between items-center shadow-sm">
                          <div>
                            <p style={{ color:"#111827" }} className="text-xs font-black truncate max-w-[120px]">{s.profileName}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Calendar className="w-3 h-3 opacity-30" />
                              <p className="text-xs font-bold text-stone-700 dark:text-white/30 uppercase">{calculateDaysHeld(s.date)} দিন ধরে আছে</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-black ${
                               locKey === 'cold_store' ? 'text-blue-600 dark:text-blue-400' : 
                               locKey === 'home' ? 'text-amber-600 dark:text-amber-400' : 
                               'text-emerald-600 dark:text-emerald-400'
                            }`}>{s.remaining.bags} বস্তা</p>
                            <p className="text-xs font-bold text-gray-500 uppercase">{s.remaining.quantity} {s.unit}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center flex flex-col items-center gap-2 text-gray-500">
                        <Package className="w-8 h-8" />
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">কোন স্টক নেই</p>
                      </div>
                    )}
                  </div>

                  {totalLocBags > 0 && (
                    <div className="mt-6 pt-4 border-t border-black/5 dark:border-white/5 flex justify-between items-end">
                      <p className="text-xs font-black text-gray-500 uppercase">মোট বস্তা সংখ্যা</p>
                      <p style={{ color:"#111827" }} className="text-3xl font-black tracking-tighter">{totalLocBags}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {!selectedProfileId ? (
          <div className="space-y-12">
            {/* Active Profiles that can receive new stock */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-xl font-black text-[#1e211f]">সচল প্রজেক্ট (নতুন স্টক যোগ করতে সিলেক্ট করুন)</h2>
                <button 
                  onClick={() => onAddProfile?.()}
                  className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> নতুন প্রোডাক্ট/প্রজেক্ট
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeProfiles.map(profile => (
                  <motion.div
                    key={profile.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative group"
                    >
                      <div
                        onClick={() => setSelectedProfileId(profile.id)}
                        className="w-full bg-white dark:bg-card-bg p-8 rounded-[3.5rem] shadow-premium border border-border-subtle text-left hover:border-primary transition-all cursor-pointer relative overflow-hidden h-full"
                      >
                        <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-stone-50 text-[#1e211f] rounded-2xl flex items-center justify-center">
                          <Warehouse className="w-6 h-6" />
                        </div>
                        <span className="bg-stone-50 text-stone-700 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                          {profile.type === 'stock' ? 'Inventory' : 'Cultivation'}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-[#111827] truncate">{profile.name}</h3>
                      <p className="text-xs font-bold text-stone-700 uppercase mt-1">{profile.landSize || 'Stock Unit'}</p>
                      
                      {/* Show stock summary if it's a stock type profile */}
                      {profile.type === 'stock' && (profile.stocks || []).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-black/5 flex flex-col gap-2">
                          <div className="flex justify-between items-end">
                            <div>
                               <p className="text-[8px] font-black text-stone-700 uppercase tracking-widest mb-0.5">মোট স্টক</p>
                               <p className="text-sm font-black text-[#1e211f]">{(profile.stocks || []).reduce((sum, s) => sum + (getRemainingStock(s, profile).bags), 0)} বস্তা</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[8px] font-black text-stone-700 uppercase tracking-widest mb-0.5">গড় ক্রয়মূল্য</p>
                               <p className="text-sm font-black text-indigo-600">
                                 {formatCurrency((profile.stocks || []).reduce((sum, s) => sum + (s.purchasePrice || 0), 0) / ((profile.stocks || []).length || 1))}
                               </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                      <button 
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProfileLocal(profile.id);
                        }}
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white shadow-xl z-[200] cursor-pointer border border-red-100"
                        title="প্রজেক্ট মুছুন"
                      >
                        <Trash2 className="w-4 h-4 pointer-events-none" />
                      </button>
                    </motion.div>
                ))}
              </div>
            </div>

            {/* Total Stock View */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-[#1e211f] px-4">সব পণ্য স্টক (All Available Stocks)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {profilesWithStock.map(profile => {
                  const isLive = (profile.status || 'live') === 'live';
                  const allStocksWithMeta = (profile.stocks || []).map(s => ({
                    ...s,
                    remaining: getRemainingStock(s, profile),
                    profileName: profile.name
                  })).filter(s => s.remaining.quantity > 0 || s.remaining.bags > 0);

                  if (allStocksWithMeta.length === 0 && !isLive) return null;

                  return (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <div
                        onClick={() => setSelectedProfileId(profile.id)}
                        className="w-full bg-white dark:bg-card-bg p-8 rounded-[3.5rem] shadow-premium border border-border-subtle text-left group-hover:border-indigo-500 transition-all overflow-hidden cursor-pointer"
                      >
                        <h3 className="text-xl font-black text-[#111827] mb-4 truncate">{profile.name}</h3>
                        <div className="space-y-3">
                          {isLive && allStocksWithMeta.length === 0 && (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 flex flex-col items-center gap-2">
                               <Sprout className="w-6 h-6 text-emerald-500" />
                               <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">লাইভ প্রজেক্ট (চলমান)</p>
                            </div>
                          )}
                          {allStocksWithMeta.slice(0, 3).map(s => (
                            <div key={s.id} className="p-3 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl flex justify-between items-center border border-indigo-100 dark:border-indigo-900/20">
                              <p className="text-xs font-black text-indigo-700 dark:text-indigo-400">{s.remaining.bags} বস্তা ({LOCATION_LABELS[s.location].split(' ')[0]})</p>
                              <ArrowRight className="w-3 h-3 text-indigo-400" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <button 
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProfileLocal(profile.id);
                        }}
                        className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl transition-all hover:bg-red-500 hover:text-white shadow-xl z-[200] cursor-pointer border border-red-100"
                        title="প্রজেক্ট মুছুন"
                      >
                        <Trash2 className="w-5 h-5 pointer-events-none" />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <button 
                onClick={() => {
                  setSelectedProfileId(null);
                  setActiveTab('view');
                }}
                className="flex items-center gap-3 text-stone-700 hover:text-[#1e211f] transition-colors group"
              >
                <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-black uppercase tracking-widest">প্রজেক্ট তালিকায় ফিরুন</span>
              </button>

              <div className="flex bg-white dark:bg-card-bg p-1.5 rounded-[1.5rem] border border-border-subtle shadow-sm">
                <button 
                  onClick={() => setActiveTab('view')}
                  className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'view' ? 'bg-primary text-white shadow-lg' : 'text-stone-700 hover:bg-bg-page'}`}
                >
                  স্টক লিস্ট
                </button>
                <button 
                  onClick={() => setActiveTab('add_stock')}
                  className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'add_stock' ? 'bg-primary text-white shadow-lg' : 'text-stone-700 hover:bg-bg-page'}`}
                >
                  নতুন স্টক
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'view' && (
                <motion.div 
                  key="view"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-10"
                >
                  <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {(selectedProfile?.stocks || []).length > 0 ? (
                        selectedProfile?.stocks?.map(stock => {
                          const remaining = getRemainingStock(stock, selectedProfile);
                          return (
                            <div key={stock.id} className="bg-white dark:bg-card-bg rounded-[2.5rem] border border-border-subtle p-8 shadow-premium relative group">
                              <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-stone-50 text-[#1e211f] rounded-xl">
                                  <Package className="w-6 h-6" />
                                </div>
                                {stock.source === 'external' && stock.purchasePrice && (
                                   <div className="text-right">
                                      <p className="text-[8px] font-black text-indigo-500/60 uppercase tracking-widest">ক্রয়মূল্য</p>
                                      <p className="text-sm font-black text-indigo-600">{formatCurrency(stock.purchasePrice)}</p>
                                   </div>
                                )}
                                <div className="flex items-center gap-2">
                                   <div className="text-right mr-2">
                                      <p className="text-[8px] font-black text-stone-700 uppercase tracking-widest">সময়কাল</p>
                                      <p className="text-xs font-bold text-stone-700">{calculateDaysHeld(stock.date)} দিন</p>
                                   </div>
                                   <button 
                                     type="button"
                                     onPointerDown={(e) => e.stopPropagation()}
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       if (selectedProfile) {
                                         onDeleteStock(selectedProfile.id, stock.id);
                                       }
                                     }}
                                     className="w-10 h-10 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm flex items-center justify-center z-[100] cursor-pointer border border-red-100 dark:border-red-900/20"
                                     title="ডিলিট করুন"
                                   >
                                     <Trash2 className="w-5 h-5 pointer-events-none" />
                                   </button>
                                </div>
                              </div>
                              
                              <div className="mb-6">
                                <p className="text-xs font-black text-stone-700 uppercase tracking-widest mb-1">{LOCATION_LABELS[stock.location]}</p>
                                <h4 className="text-xl font-black text-[#111827]">
                                  {remaining.bags} / {stock.bags} <span className="text-sm font-bold text-gray-500">বস্তা অবশিষ্ট</span>
                                </h4>
                              </div>

                              <div className="space-y-4">
                                <div className="h-2 w-full bg-stone-50 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(remaining.bags / stock.bags) * 100}%` }}
                                    className="h-full bg-primary rounded-full"
                                  />
                                </div>
                                <div className="flex justify-between text-xs font-black text-stone-700 uppercase tracking-widest">
                                  <span>{remaining.quantity} {stock.unit}</span>
                                  <span>{new Date(stock.date).toLocaleDateString('bn-BD')}</span>
                                </div>
                              </div>

                              <button 
                                onClick={() => {
                                  setSelectedStockId(stock.id);
                                  setActiveTab('sell_stock');
                                }}
                                disabled={remaining.quantity <= 0 && remaining.bags <= 0}
                                className="w-full mt-8 py-4 bg-secondary text-[#1e211f] font-black rounded-2xl text-xs uppercase tracking-widest shadow-sm hover:shadow-lg active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                              >
                                <ShoppingCart className="w-4 h-4" />
                                এই স্টক থেকে বিক্রি করুন
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full py-20 text-center bg-white/50 dark:bg-black/10 rounded-[3rem] border border-dashed border-border-subtle">
                           <p className="text-xs font-bold text-stone-700 uppercase tracking-widest">No active stock entries</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-1 space-y-8">
                     <div className="bg-primary text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                           <h2 className="text-2xl font-black mb-6">সেলস রেকর্ড (Stock Sales)</h2>
                           <div className="space-y-6">
                              {(selectedProfile?.stockSales || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(sale => (
                                 <div key={sale.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex justify-between items-center group">
                                    <div>
                                       <p className="text-sm font-black">
                                          {sale.bags > 0 ? `${sale.bags} বস্তা` : `${sale.quantity} ${sale.unit}`} বিক্রি
                                       </p>
                                       <p className="text-xs font-bold text-white/30 uppercase">{new Date(sale.date).toLocaleDateString('bn-BD')}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                       <p className="text-sm font-black text-emerald-600">{formatCurrency(sale.totalAmount)}</p>
                                       <button 
                                          type="button"
                                          onClick={(e) => {
                                             e.preventDefault();
                                             e.stopPropagation();
                                             if (selectedProfile) {
                                               onDeleteStockSale(selectedProfile.id, sale.id);
                                             }
                                          }}
                                          className="p-3 hover:bg-red-500/20 text-red-500 rounded-xl transition-all z-[100] cursor-pointer"
                                       >
                                          <Trash2 className="w-5 h-5 pointer-events-none" />
                                       </button>
                                    </div>
                                 </div>
                              ))}
                              {(selectedProfile?.stockSales || []).length === 0 && (
                                 <p className="text-xs font-bold text-white/20 uppercase text-center py-10">No stock sales yet</p>
                              )}
                           </div>

                           {/* Total Sales Summary Footer */}
                           {(selectedProfile?.stockSales || []).length > 0 && (
                              <div className="mt-8 p-6 bg-primary dark:bg-white/5 rounded-[2.5rem] border border-border-subtle shadow-xl">
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0">
                                       <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">মোট টাকা (Total Sales)</p>
                                       <p className="text-2xl font-black text-white">{formatCurrency(totalSalesStats.totalAmount)}</p>
                                    </div>
                                    <div className="border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0">
                                       <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">মোট বস্তা (Total Bags)</p>
                                       <p className="text-2xl font-black text-white">{totalSalesStats.totalBags} বস্তা</p>
                                    </div>
                                    <div>
                                       <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-1">মোট পরিমাণ (Total Qty)</p>
                                       <p className="text-2xl font-black text-white">
                                          {totalSalesStats.totalQty} {selectedProfile.stockSales?.[0]?.unit || selectedProfile.stocks?.[0]?.unit || 'কেজি'}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'add_stock' && (
                <motion.div 
                  key="add"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-2xl mx-auto w-full"
                >
                  <form onSubmit={handleAddStock} className="bg-white dark:bg-card-bg p-12 rounded-[4rem] border border-border-subtle shadow-premium space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-2xl flex items-center justify-center">
                             <Warehouse className="w-6 h-6" />
                          </div>
                          <h3 className="text-2xl font-black text-[#111827]">নতুন স্টক এন্ট্রি</h3>
                       </div>
                       <button 
                          type="button"
                          onClick={() => onAddProfile?.()}
                          className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> নতুন প্রোডাক্ট/প্রজেক্ট খুলুন
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="text-xs font-black text-stone-700 dark:text-white/40 uppercase tracking-widest pl-2">মালের উৎস (Source)</label>
                        <div className="grid grid-cols-2 gap-4">
                           <button 
                              type="button"
                              onClick={() => setSource('internal')}
                              className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${source === 'internal' ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white dark:bg-black/20 text-stone-700 border-border-subtle'}`}
                           >
                              নিজস্ব ফসল
                           </button>
                           <button 
                              type="button"
                              onClick={() => setSource('external')}
                              className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${source === 'external' ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg' : 'bg-white dark:bg-black/20 text-stone-700 border-border-subtle'}`}
                           >
                              বাইরে থেকে কেনা
                           </button>
                        </div>
                      </div>

                      {source === 'external' ? (
                         <div className="space-y-4">
                            <label className="text-xs font-black text-stone-700 dark:text-white/40 uppercase tracking-widest pl-2">ক্রয়মূল্য (ঐচ্ছিক)</label>
                            <input 
                               type="number"
                               value={purchasePrice || ''}
                               onChange={(e) => setPurchasePrice(e.target.value)}
                               placeholder="০.০০"
                               className="w-full bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-2xl px-6 py-4 font-black transition-all focus:border-indigo-500 outline-none text-2xl dark:text-white"
                            />
                            {purchasePrice && parseFloat(purchasePrice) > 0 && (
                              <p className="mt-2 text-xs font-bold text-indigo-500/60 px-2 italic">
                                কথায়: {numberToBanglaWords(purchasePrice)}
                              </p>
                            )}
                         </div>
                      ) : (
                        <div className="space-y-4">
                           <label className="text-xs font-black text-stone-700 dark:text-white/40 uppercase tracking-widest pl-2">উৎপাদন খরচ (ক্রয়মূল্য হিসেবে)</label>
                           <input 
                              type="number"
                              readOnly
                              value={calculatedInternalPrice}
                              placeholder="Calculated Cost"
                              className="w-full bg-secondary/10 border border-secondary/20 rounded-2xl px-6 py-4 font-black outline-none text-2xl text-[#1e211f]"
                           />
                           <p className="text-xs font-bold text-emerald-600/70 px-2 italic mt-1">প্রজেক্টের মোট খরচ থেকে হিসাব করা হয়েছে</p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="text-xs font-black text-stone-700 dark:text-white/40 uppercase tracking-widest pl-2">স্টক লোকেশন</label>
                        <select 
                          value={location}
                          onChange={(e) => setLocation(e.target.value as any)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-black transition-all focus:border-emerald-500 outline-none text-[#111827]"
                        >
                          <option value="cold_store">কোল্ড স্টোর</option>
                          <option value="home">বাসার গোডাউন</option>
                          <option value="others">অন্যান্য</option>
                        </select>
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-black text-stone-700 dark:text-white/40 uppercase tracking-widest pl-2">স্টকের তারিখ</label>
                        <input 
                          type="date"
                          required
                          value={stockDate}
                          onChange={(e) => setStockDate(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-black transition-all focus:border-emerald-500 outline-none text-[#111827]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="text-xs font-black text-stone-700 dark:text-white/40 uppercase tracking-widest pl-2">বস্তার সংখ্যা</label>
                        <input 
                          type="number"
                          value={bags || ''}
                          onChange={(e) => setBags(e.target.value)}
                          placeholder="০"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-black transition-all focus:border-emerald-500 outline-none text-2xl text-[#111827]"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="text-xs font-black text-stone-700 dark:text-white/40 uppercase tracking-widest pl-2">মোট পরিমাণ ({unit})</label>
                        <div className="flex gap-3">
                          <input 
                            type="number"
                            value={quantity || ''}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="০.০০"
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-black transition-all focus:border-emerald-500 outline-none text-2xl text-[#111827]"
                          />
                          <select 
                            value={unit}
                            onChange={(e) => setUnit(e.target.value)}
                            className="w-24 bg-gray-50 border border-gray-200 rounded-2xl px-2 font-black text-xs uppercase"
                          >
                            <option value="কেজি">কেজি</option>
                            <option value="মন">মন</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-xs font-black text-stone-700 dark:text-white/40 uppercase tracking-widest pl-2">টীকা (ঐচ্ছিক)</label>
                      <textarea 
                        value={note || ''}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="অতিরিক্ত তথ্য..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-3xl px-6 py-4 font-bold text-sm transition-all focus:border-primary outline-none min-h-[120px] resize-none dark:text-white"
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-primary text-white font-black uppercase tracking-widest py-6 rounded-3xl shadow-xl hover:bg-black transition-all active:scale-95"
                    >
                      স্টক নিশ্চিত করুন
                    </button>
                  </form>
                </motion.div>
              )}

              {activeTab === 'sell_stock' && selectedStock && (
                <motion.div 
                  key="sell"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="max-w-2xl mx-auto w-full"
                >
                  <form onSubmit={handleAddSale} className="bg-white dark:bg-card-bg p-12 rounded-[4rem] border border-border-subtle shadow-premium space-y-8">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-secondary/10 text-emerald-600 rounded-2xl flex items-center justify-center">
                              <ShoppingCart className="w-6 h-6" />
                           </div>
                           <div>
                              <h3 className="text-2xl font-black text-[#111827]">স্টক থেকে বিক্রয়</h3>
                              <p className="text-xs font-black text-stone-700 uppercase tracking-widest">{LOCATION_LABELS[selectedStock.location]}</p>
                           </div>
                        </div>
                        <button type="button" onClick={() => setActiveTab('view')} className="p-2 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                           <History className="w-6 h-6" />
                        </button>
                     </div>

                     <div className="p-6 bg-secondary/10 rounded-3xl border-2 border-secondary/20 flex justify-between items-center">
                        <div>
                           <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Available for Sale</p>
                           <p className="text-2xl font-black text-[#111827]">
                              {getRemainingStock(selectedStock, selectedProfile!).bags} বস্তা / {getRemainingStock(selectedStock, selectedProfile!).quantity} {selectedStock.unit}
                           </p>
                        </div>
                        {selectedStock.purchasePrice && (
                           <div className="text-right">
                              <p className="text-xs font-black text-stone-700 uppercase tracking-widest mb-1">Purchase Price</p>
                              <p className="text-lg font-black text-stone-700 dark:text-white/60">
                                 {formatCurrency(selectedStock.purchasePrice)}
                              </p>
                           </div>
                        )}
                     </div>

                     {/* Profit/Loss Estimation */}
                     {selectedStock.purchasePrice && totalPrice && (
                        <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border-2 border-emerald-100 dark:border-emerald-900/20 flex justify-between items-center">
                           <div>
                              <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Estimated Profit</p>
                              <p className="text-2xl font-black text-emerald-600">
                                 {formatCurrency(parseFloat(totalPrice) - (selectedStock.purchasePrice * (parseFloat(saleQuantity) || parseFloat(saleBags) || 0) / (selectedStock.quantity || selectedStock.bags || 1)))}
                              </p>
                           </div>
                           <ArrowUpRight className="w-8 h-8 text-emerald-500" />
                        </div>
                     )}

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <label className="text-xs font-black text-stone-700 dark:text-white/40 uppercase tracking-widest pl-2">কয় বস্তা বিক্রি?</label>
                           <input 
                              type="number"
                              value={saleBags || ''}
                              onChange={(e) => {
                                 setSaleBags(e.target.value);
                                 if (unitPrice && (!saleQuantity || parseFloat(saleQuantity) === 0)) {
                                    setTotalPrice((parseFloat(unitPrice) * parseFloat(e.target.value || '0')).toString());
                                 }
                              }}
                              placeholder="০"
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-black transition-all focus:border-secondary outline-none text-xl dark:text-white"
                           />
                        </div>
                        <div className="space-y-4">
                           <label className="text-xs font-black text-stone-700 dark:text-white/40 uppercase tracking-widest pl-2">বিক্রয় পরিমাণ ({selectedStock.unit})</label>
                           <input 
                              type="number"
                              value={saleQuantity || ''}
                              onChange={(e) => {
                                 setSaleQuantity(e.target.value);
                                 if (unitPrice) {
                                    setTotalPrice((parseFloat(unitPrice) * parseFloat(e.target.value || '0')).toString());
                                 }
                              }}
                              placeholder="০.০০"
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-black transition-all focus:border-secondary outline-none text-xl dark:text-white"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <label className="text-xs font-black text-stone-700 dark:text-white/40 uppercase tracking-widest pl-2">একক দাম (Unit Price)</label>
                           <input 
                              type="number"
                              required
                              value={unitPrice || ''}
                              onChange={(e) => {
                                 setUnitPrice(e.target.value);
                                 const q = parseFloat(saleQuantity) || 0;
                                 const b = parseFloat(saleBags) || 0;
                                 const factor = q > 0 ? q : b;
                                 if (factor > 0) {
                                    setTotalPrice((parseFloat(e.target.value) * factor).toString());
                                 }
                              }}
                              placeholder="০.০০"
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-black transition-all focus:border-secondary outline-none text-xl dark:text-white"
                           />
                        </div>
                        <div className="space-y-4">
                           <label className="text-xs font-black text-stone-700 dark:text-white/40 uppercase tracking-widest pl-2">মোট বিক্রয়মূল্য (Total Price)</label>
                           <input 
                              type="number"
                              required
                              value={totalPrice || ''}
                              onChange={(e) => {
                                 setTotalPrice(e.target.value);
                                 const q = parseFloat(saleQuantity) || 0;
                                 const b = parseFloat(saleBags) || 0;
                                 const factor = q > 0 ? q : b;
                                 if (factor > 0) {
                                    setUnitPrice((parseFloat(e.target.value) / factor).toFixed(2));
                                 }
                              }}
                              placeholder="০.০০"
                              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-black transition-all focus:border-secondary outline-none text-xl border-secondary/20 dark:text-white"
                           />
                        </div>
                        {totalPrice && parseFloat(totalPrice) > 0 && (
                          <p className="mt-2 text-xs font-bold text-emerald-600/70 px-2 italic">
                            কথায়: {numberToBanglaWords(totalPrice)}
                          </p>
                        )}
                     </div>

                     <div className="space-y-4">
                        <label className="text-xs font-black text-stone-700 dark:text-white/40 uppercase tracking-widest pl-2">বিক্রয়ের তারিখ</label>
                        <input 
                           type="date"
                           required
                           value={saleDate}
                           onChange={(e) => setSaleDate(e.target.value)}
                           className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4 font-black transition-all focus:border-secondary outline-none dark:text-white"
                        />
                     </div>

                     <button 
                        type="submit"
                        className="w-full bg-secondary text-[#1e211f] font-black uppercase tracking-widest py-6 rounded-3xl shadow-xl hover:opacity-90 transition-all active:scale-95"
                     >
                        স্টক থেকে বিক্রি নিশ্চিত করুন
                     </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
