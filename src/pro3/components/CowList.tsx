import { Cow, Profile } from '../types';
import { translations } from '../translations';
import { Beef, Plus, Search, Filter, Calendar, Tag, Trash2, ChevronRight, Clock, ChevronLeft, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { ConfirmModal } from './ConfirmModal';

interface CowListProps {
  profile: Profile | null;
  profiles?: Profile[];
  cows: Cow[];
  category: 'Cow' | 'Goat';
  onSelectCow: (c: Cow) => void;
  onAddCow: () => void;
  onRefresh?: () => void;
  onBack?: () => void;
  t: any;
  title?: string;
}

export function CowList({ profile, profiles = [], cows, category, onSelectCow, onAddCow, onRefresh, onBack, t, title }: CowListProps) {
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const animalLabel = category === 'Cow' ? 'গরু' : 'ছাগল';

  // Profile-level loan & treatment totals (all live cows in this profile)
  const totalLoan      = cows.reduce((s, c) => s + (c.loanAmount      || 0), 0);
  const totalTreatment = cows.reduce((s, c) => s + (c.treatmentCost   || 0), 0);
  const animalIcon = category === 'Cow' ? 'https://img.icons8.com/color/96/cow.png' : 'https://img.icons8.com/color/96/goat.png';

  const filteredCows = cows.filter(c => {
    const pName = profiles.find(p => p.id === c.profileId)?.name || '';
    return (c.tag || '').toLowerCase().includes(search.toLowerCase()) ||
           (c.notes || '').toLowerCase().includes(search.toLowerCase()) ||
           (c.address || '').toLowerCase().includes(search.toLowerCase()) ||
           c.gender.toLowerCase().includes(search.toLowerCase()) ||
           pName.toLowerCase().includes(search.toLowerCase());
  });

  const handleDeleteCow = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (confirmDeleteId) {
      await storageService.deleteCow(confirmDeleteId);
      onRefresh?.();
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmModal 
        isOpen={!!confirmDeleteId}
        title={`${animalLabel}র তথ্য মুছুন`}
        message={`আপনি কি নিশ্চিত যে আপনি এই ${animalLabel}র তথ্যটি মুছে ফেলতে চান?`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-full transition-colors mr-1">
              <ChevronLeft className="w-6 h-6 text-stone-600" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-stone-900">{title || profile?.name}</h2>
            <p className="text-sm text-stone-500">মোট {animalLabel}: {cows.length}টি</p>
          </div>
        </div>
        <button 
          onClick={onAddCow}
          data-add-animal-btn="true"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-emerald-100 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">পশু যোগ করুন</span>
        </button>
      </div>

      {/* Profile loan/treatment summary — shown only when inside a specific profile */}
      {profile && (totalLoan > 0 || totalTreatment > 0) && (
        <div className="flex gap-3">
          {totalLoan > 0 && (
            <div className="flex-1 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-0.5">মোট ঋণ</p>
              <p className="text-lg font-black text-rose-600">৳ {totalLoan.toLocaleString()}</p>
            </div>
          )}
          {totalTreatment > 0 && (
            <div className="flex-1 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-0.5">চিকিৎসা ব্যয়</p>
              <p className="text-lg font-black text-amber-600">৳ {totalTreatment.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
        <input 
          type="text" 
          placeholder={t.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
        />
      </div>

      {/* Cow Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredCows.length === 0 ? (
          <div className="col-span-full">
            {profile ? (
              <div 
                onClick={onAddCow}
                className="bg-emerald-50 rounded-[2.5rem] border-2 border-dashed border-emerald-200 p-12 flex flex-col items-center justify-center text-center gap-4 cursor-pointer hover:bg-emerald-100 hover:border-emerald-300 transition-all group active:scale-95"
              >
                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-emerald-600 shadow-lg group-hover:rotate-12 transition-transform">
                  <Plus className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-emerald-900 mb-1">{profile.name} এর জন্য প্রথম পশু যোগ করুন</h4>
                  <p className="text-sm font-bold text-emerald-600/70">নতুন পশু এড করতে এখানে ক্লিক করুন</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-[2.5rem] border border-dashed border-stone-300">
                <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <img src={animalIcon} alt="Animal" className="w-12 h-12 grayscale opacity-30" />
                </div>
                <p className="text-stone-500">{t.noData}</p>
              </div>
            )}
          </div>
        ) : (
          <>
            {filteredCows.map((cow, idx) => {
              const entry = new Date(cow.entryDate).getTime();
              const current = Date.now();
              const diffDays = Math.floor((current - entry) / (1000 * 60 * 60 * 24));
              const isOldBull = cow.gender === 'Bull' && !cow.isSold && diffDays >= 240;

              const colors = [
                { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', icon: 'bg-emerald-100', hover: 'hover:border-emerald-400' },
                { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', icon: 'bg-blue-100', hover: 'hover:border-blue-400' },
                { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: 'bg-amber-100', hover: 'hover:border-amber-400' },
                { bg: 'bg-purple-50', border: 'border-purple-100', text: 'text-purple-700', icon: 'bg-purple-100', hover: 'hover:border-purple-400' },
                { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', icon: 'bg-rose-100', hover: 'hover:border-rose-400' },
                { bg: 'bg-indigo-50', border: 'border-indigo-100', text: 'text-indigo-700', icon: 'bg-indigo-100', hover: 'hover:border-indigo-400' },
              ];

              const color = isOldBull
                ? { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'bg-red-100', hover: 'hover:border-red-400' }
                : colors[idx % colors.length];

              return (
                <div
                  key={cow.id}
                  onClick={() => onSelectCow(cow)}
                  className={`flex flex-col p-5 rounded-[2.5rem] border-2 transition-all text-left group relative cursor-pointer active:scale-95 shadow-sm hover:shadow-md ${color.bg} ${color.border} ${color.hover} animate-in fade-in zoom-in-95 duration-300 ${isOldBull ? 'ring-2 ring-red-100' : ''}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {isOldBull && (
                    <div className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-xl shadow-lg z-30 animate-bounce">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  )}
                  {/* Delete Button */}
                  <button 
                    onClick={(e) => handleDeleteCow(e, cow.id)}
                    className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-500 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm z-20"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Compact Circular Image Container */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white shadow-sm transition-transform group-hover:scale-110 duration-500`}>
                      {cow.cowImageUrl ? (
                        <img src={cow.cowImageUrl} alt="Cow" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2 opacity-40 grayscale bg-white/50">
                          <img src={animalIcon} alt="Animal" className="w-full" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-white/80 ${color.text} shadow-sm inline-block mb-1`}>
                        {cow.isSold ? t.sold : t.active}
                      </span>
                      <h4 className="font-black text-stone-900 leading-tight truncate">
                        {cow.tag ? cow.tag : (profiles.find(p => p.id === cow.profileId)?.name || 'অজ্ঞাত')}
                      </h4>
                      {cow.tag && (
                        <p className="text-[9px] text-stone-400 font-bold uppercase truncate">
                          {profiles.find(p => p.id === cow.profileId)?.name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Info Badges */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${color.text} bg-white/60 px-2.5 py-1 rounded-xl`}>
                        {t[cow.gender.toLowerCase() as keyof typeof t] || cow.gender}
                      </span>
                      <span className="text-[10px] text-stone-400 font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {cow.entryDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black ${color.text} flex items-center gap-1 opacity-80`}>
                        <Clock className="w-3 h-3" />
                        {(() => {
                          const profile = profiles.find(p => p.id === cow.profileId);
                          const start = new Date(cow.entryDate).getTime();
                          let end = Date.now();
                          
                          if (cow.isSold && cow.saleDate) {
                            end = new Date(cow.saleDate).getTime();
                          } else if (profile?.isArchived && profile?.archivedAt) {
                            end = new Date(profile.archivedAt).getTime();
                          }
                          
                          const diffDays = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
                          const months = Math.floor(diffDays / 30);
                          const days = diffDays % 30;
                          return months > 0 ? `${months} মাস ${days} দিন` : `${days} দিন`;
                        })()}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 font-medium truncate italic h-4">
                      {cow.address || 'ঠিকানা নেই'}
                    </p>
                  </div>

                  {/* Price Sticker */}
                  <div className="mt-auto pt-3 border-t border-white/30 flex items-center justify-between">
                    <p className="text-lg font-black text-stone-900 tracking-tighter">৳ {cow.purchasePrice.toLocaleString()}</p>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center bg-white/50 group-hover:bg-white transition-colors`}>
                      <ChevronRight className={`w-4 h-4 text-stone-400`} />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Direct Add Card in List */}
            {profile && (
              <div 
                onClick={onAddCow}
                className="bg-white rounded-[2.5rem] border-2 border-dashed border-stone-200 p-6 flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all group active:scale-95"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 transition-transform group-hover:rotate-12">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-stone-900">{profile.name} এর জন্য</h4>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">নতুন পশু এড করুন</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
