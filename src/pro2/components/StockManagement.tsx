import { 
  Plus, 
  Minus, 
  Trash2, 
  Package, 
  ChevronLeft,
  Calendar,
  Box,
  StickyNote,
  PlusCircle,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import { useFirebase } from '../lib/FirebaseContext';
import { StockCategory, StockItem } from '../types';

export const StockManagement = ({ category, onBack }: { category: StockCategory, onBack: () => void }) => {
  const { stocks, updateStock, addStockItem, deleteStockItem } = useFirebase();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState<string>('');
  
  // Navigation for sub-categories in 'Other'
  const [selectedSubCat, setSelectedSubCat] = useState<string | null>(null);
  
  // For adding new dynamic items
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemNote, setNewItemNote] = useState('');

  const handleDelete = async () => {
    if (deleteId) {
      await deleteStockItem(deleteId);
      setDeleteId(null);
    }
  };

  const filteredStocks = stocks.filter(s => {
    if (category === 'Fertilizer') return s.category === 'Fertilizer';
    if (selectedSubCat) return s.category === 'Other' && s.subCategory === selectedSubCat;
    return false;
  });

  const totalQuantity = (category === 'Fertilizer' ? filteredStocks : stocks.filter(s => s.category === 'Other' && s.subCategory === selectedSubCat))
    .reduce((acc, s) => acc + s.quantity, 0);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [addingSaving, setAddingSaving] = useState(false);

  const handleUpdate = async (id: string, current: number, delta: number) => {
    if (updatingId === id) return;
    const newValue = Math.max(0, current + delta);
    setUpdatingId(id);
    try {
      await updateStock(id, newValue);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleManualEntry = async (id: string) => {
    const val = parseInt(tempValue);
    if (!isNaN(val) && val >= 0) {
      setUpdatingId(id);
      try {
        await updateStock(id, val);
        setEditingId(null);
        setTempValue('');
      } finally {
        setUpdatingId(null);
      }
    }
  };

  const handleNoteSave = async (id: string) => {
    const item = stocks.find(s => s.id === id);
    if (item) {
      setUpdatingId(id);
      try {
        await updateStock(id, item.quantity, tempNote);
        setEditingNoteId(null);
        setTempNote('');
      } finally {
        setUpdatingId(null);
      }
    }
  };

  const handleAddItem = async () => {
    if (!newItemName || !newItemQty) return;
    setAddingSaving(true);
    try {
      await addStockItem({
        name: newItemName,
        quantity: parseInt(newItemQty),
        category: 'Other',
        subCategory: selectedSubCat || 'other',
        note: newItemNote,
        date: new Date()
      });
      setNewItemName('');
      setNewItemQty('');
      setNewItemNote('');
      setShowAddForm(false);
    } finally {
      setAddingSaving(false);
    }
  };

  // Sub-category Menu for 'Other'
  if (category === 'Other' && !selectedSubCat) {
    return (
      <div className="pb-32 pt-8 px-5 flex flex-col gap-8 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 glass-premium rounded-xl text-gray-400">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-bengali">অন্যান্য স্টক</h1>
            <p className="text-gray-400 text-sm font-bengali">ক্যাটাগরি নির্বাচন করুন</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <SubCatCard 
            title="কীটনাশক" 
            icon={<Tag className="text-emerald-400" />} 
            count={stocks.filter(s => s.subCategory === 'pesticide').length}
            onClick={() => setSelectedSubCat('pesticide')} 
          />
          <SubCatCard 
            title="খালি বস্তা" 
            icon={<Package className="text-amber-400" />} 
            count={stocks.filter(s => s.subCategory === 'bag').reduce((acc, s) => acc + s.quantity, 0)}
            unit="বস্তা"
            onClick={() => setSelectedSubCat('bag')} 
          />
          <SubCatCard 
            title="অন্যান্য" 
            icon={<Box className="text-indigo-400" />} 
            count={stocks.filter(s => s.subCategory === 'other').length}
            onClick={() => setSelectedSubCat('other')} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-8 px-5 flex flex-col gap-8 max-w-2xl mx-auto h-full">
      <div className="flex items-center gap-4">
        <button 
          onClick={category === 'Other' ? () => setSelectedSubCat(null) : onBack}
          className="p-2.5 glass-premium rounded-xl text-gray-400 hover:text-white transition-all active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-bengali">
            {category === 'Fertilizer' ? 'সার স্টক ম্যানেজমেন্ট' : (
              selectedSubCat === 'pesticide' ? 'কীটনাশক স্টক' : 
              selectedSubCat === 'bag' ? 'খালি বস্তা' : 'অন্যান্য পণ্য'
            )}
          </h1>
          <p className="text-gray-400 text-sm font-bengali">পণ্যের পরিমাণ যোগ বা বিয়োগ করুন</p>
        </div>
      </div>

      {/* Add New Item Button (for dynamic categories) */}
      {(selectedSubCat === 'pesticide' || selectedSubCat === 'other') && (
        <button 
          onClick={() => setShowAddForm(true)}
          className="glass-premium p-4 rounded-2xl flex items-center justify-center gap-2 text-indigo-400 border border-indigo-400/20 active:scale-95 transition-all"
        >
          <PlusCircle size={20} />
          <span className="font-bold font-bengali">নতুন এন্ট্রি যোগ করুন</span>
        </button>
      )}

      {/* Add Item Form Overlay */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-premium w-full max-w-md p-6 rounded-3xl flex flex-col gap-4 border border-white/10"
            >
              <h2 className="text-xl font-bold font-bengali">নতুন {selectedSubCat === 'pesticide' ? 'কীটনাশক' : 'পণ্য'} যোগ</h2>
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold px-1 font-bengali">নাম</label>
                  <input 
                    value={newItemName} onChange={e => setNewItemName(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-indigo-400 font-bengali"
                    placeholder="যেমন: এসিমিক্স বা সিনজেনটা"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold px-1 font-bengali">পরিমাণ</label>
                  <input 
                    type="number" value={newItemQty} onChange={e => setNewItemQty(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-indigo-400"
                    placeholder="যেমন: ১০"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-500 uppercase font-bold px-1 font-bengali">নোট (ঐচ্ছিক)</label>
                  <input 
                    value={newItemNote} onChange={e => setNewItemNote(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-indigo-400 font-bengali"
                    placeholder="অতিরিক্ত তথ্য..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-4 glass rounded-2xl font-bold font-bengali text-gray-400"
                >বাতিল</button>
                <button
                  onClick={handleAddItem}
                  disabled={addingSaving}
                  className="flex-1 py-4 bg-indigo-500 rounded-2xl font-bold font-bengali text-white disabled:opacity-60"
                >{addingSaving ? 'সংরক্ষণ...' : 'নিশ্চিত করুন'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        {filteredStocks.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-premium p-5 rounded-3xl flex flex-col gap-4 border border-white/5"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-2xl ${category === 'Fertilizer' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {category === 'Fertilizer' ? <Package size={22} /> : <Box size={22} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg font-bengali">{item.name}</h3>
                  <p className="text-[10px] text-gray-500 flex items-center gap-1 uppercase tracking-widest font-bold">
                    <Calendar size={10} /> {new Date(item.date || item.lastUpdated).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className="text-2xl font-bold text-white leading-tight">
                  {item.quantity} <span className="text-sm font-normal text-gray-500 font-bengali">
                    {category === 'Fertilizer' || item.subCategory === 'bag' ? 'বস্তা' : 'একক'}
                  </span>
                </p>
                {(selectedSubCat === 'pesticide' || selectedSubCat === 'other') && (
                  <button onClick={() => setDeleteId(item.id)} className="p-1.5 text-red-500/50 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Note Section */}
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
              {editingNoteId === item.id ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempNote}
                    onChange={(e) => setTempNote(e.target.value)}
                    placeholder="নোট লিখুন..."
                    autoFocus
                    className="flex-1 bg-transparent border-none text-xs text-indigo-300 focus:outline-none font-bengali"
                  />
                  <button 
                    onClick={() => handleNoteSave(item.id)}
                    className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-lg font-bold font-bengali"
                  >
                    সেভ
                  </button>
                </div>
              ) : (
                <div 
                  onClick={() => {
                    setEditingNoteId(item.id);
                    setTempNote(item.note || '');
                  }}
                  className="flex items-start gap-2 cursor-pointer group"
                >
                  <StickyNote size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-indigo-300/80 font-bengali italic">
                    {item.note || 'কোনো নোট নেই (ক্লিক করে যোগ করুন)'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleUpdate(item.id, item.quantity, -1)}
                disabled={updatingId === item.id}
                className="flex-1 py-3 glass rounded-2xl flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-all active:scale-95 disabled:opacity-40"
              >
                <Minus size={20} />
              </button>
              
              {editingId === item.id ? (
                <div className="flex-[2] flex gap-2">
                  <input
                    type="number"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    placeholder="পরিমাণ"
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 text-center focus:outline-none focus:border-indigo-400"
                  />
                  <button 
                    onClick={() => handleManualEntry(item.id)}
                    className="px-4 bg-indigo-500 rounded-2xl font-bold font-bengali text-sm"
                  >
                    সেভ
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    setEditingId(item.id);
                    setTempValue(item.quantity.toString());
                  }}
                  className="flex-[2] py-3 glass rounded-2xl font-bold font-bengali text-sm hover:bg-white/5 transition-all"
                >
                  পরিমাণ পরিবর্তন
                </button>
              )}

              <button
                onClick={() => handleUpdate(item.id, item.quantity, 1)}
                disabled={updatingId === item.id}
                className="flex-1 py-3 glass rounded-2xl flex items-center justify-center text-green-400 hover:bg-green-500/10 transition-all active:scale-95 disabled:opacity-40"
              >
                <Plus size={20} />
              </button>
            </div>
          </motion.div>
        ))}
        
        {filteredStocks.length === 0 && (
          <div className="text-center py-10 glass rounded-3xl border-dashed border-white/10">
            <p className="text-gray-500 font-bengali">কোনো আইটেম নেই</p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {(category === 'Fertilizer' || (category === 'Other' && selectedSubCat)) && (
        <div className="mt-4 glass-premium p-6 rounded-3xl border-t-4 border-indigo-500 shadow-2xl">
          <h3 className="text-lg font-bold font-bengali mb-4 flex items-center gap-2">
            <TrendingSummary size={20} className="text-indigo-400" />
            একনজরে স্টক সামারি
          </h3>
          <div className="flex flex-col gap-3">
            {filteredStocks.map(s => (
              <div key={s.id} className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-bengali truncate mr-2">{s.name}</span>
                <span className="font-bold shrink-0">{s.quantity} {category === 'Fertilizer' || s.subCategory === 'bag' ? 'বস্তা' : 'একক'}</span>
              </div>
            ))}
            <div className="h-px bg-white/10 my-1" />
            <div className="flex justify-between items-center text-base">
              <span className="font-bold font-bengali text-indigo-400">সর্বমোট স্টক</span>
              <span className="text-xl font-bold text-indigo-400">{totalQuantity} {category === 'Fertilizer' || selectedSubCat === 'bag' ? 'বস্তা' : 'একক'}</span>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {deleteId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="glass-premium w-full max-w-sm p-8 rounded-3xl flex flex-col gap-6 border border-white/10 text-center"
            >
              <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold font-bengali mb-2">আপনি কি নিশ্চিত?</h3>
                <p className="text-gray-400 font-bengali text-sm">এই পন্যটির সকল রেকর্ড চিরতরে মুছে যাবে।</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-4 glass rounded-2xl font-bold font-bengali transition-all active:scale-95"
                >
                  না, থাক
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-bold font-bengali transition-all active:scale-95 shadow-lg shadow-red-500/20"
                >
                  হ্যাঁ, ডিলিট
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SubCatCard = ({ title, icon, count, unit = 'আইটেম', onClick }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="glass-premium p-6 rounded-3xl flex justify-between items-center cursor-pointer border border-white/5 active:bg-white/10"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-xl">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-lg font-bengali">{title}</h3>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">ম্যানেজ করতে ট্যাপ করুন</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-xl font-bold text-indigo-400">{count} <span className="text-xs font-normal text-gray-500 font-bengali">{unit}</span></p>
    </div>
  </motion.div>
);

const TrendingSummary = ({ size, className }: { size: number, className: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const AlertCircle = ({ size, className }: { size: number, className: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
