import React, { useState } from 'react';
import { Cow, Profile, Category } from '../types';
import { Images, Search } from 'lucide-react';

interface CowGalleryProps {
  cows: Cow[];
  profiles: Profile[];
  category: Category | null;
  onSelectCow: (c: Cow) => void;
  onOpenFullscreen: (src: string) => void;
}

export function CowGallery({ cows, profiles, category, onSelectCow, onOpenFullscreen }: CowGalleryProps) {
  const [filter, setFilter] = useState<'all' | 'live' | 'sold'>('all');
  const [search, setSearch] = useState('');

  const animalLabel = category === 'Cow' ? 'গরু' : 'ছাগল';

  // Only cows that have an image
  const withImages = cows.filter(c => {
    if (!c.cowImageUrl) return false;
    const profileName = profiles.find(p => p.id === c.profileId)?.name || '';
    const matchSearch = !search ||
      (c.tag || '').toLowerCase().includes(search.toLowerCase()) ||
      profileName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'live' ? !c.isSold : c.isSold);
    return matchSearch && matchFilter;
  });

  const withoutImages = cows.filter(c => !c.cowImageUrl).length;

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">{animalLabel}র ছবি</h2>
          <p className="text-sm text-stone-400">
            {withImages.length} টি ছবি আছে
            {withoutImages > 0 && ` · ${withoutImages} টির ছবি নেই`}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'live', 'sold'] as const).map((f) => {
          const labels = { all: 'সব', live: 'লাইভ', sold: 'বিক্রিত' };
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === f
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
                  : 'bg-white text-stone-500 border border-stone-200 hover:border-emerald-300'
              }`}>
              {labels[f]}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input type="text" placeholder="ট্যাগ বা খামারি নাম দিয়ে খুঁজুন..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm" />
      </div>

      {/* Gallery grid */}
      {withImages.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-200">
          <Images className="w-12 h-12 text-stone-200 mx-auto mb-3" />
          <p className="text-stone-400 font-medium">
            {cows.filter(c => c.cowImageUrl).length === 0
              ? `কোনো ${animalLabel}র ছবি নেই`
              : 'এই ফিল্টারে কোনো ছবি নেই'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {withImages.map((cow) => {
            const farmer = profiles.find(p => p.id === cow.profileId);
            return (
              <div key={cow.id}
                className="group relative bg-white rounded-2xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                onClick={() => onSelectCow(cow)}
              >
                {/* Image */}
                <div className="aspect-square overflow-hidden bg-stone-50 relative">
                  <img
                    src={cow.cowImageUrl!}
                    alt={cow.tag || animalLabel}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFullscreen(cow.cowImageUrl!);
                    }}
                  />
                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      cow.isSold ? 'bg-stone-800 text-white' : 'bg-emerald-500 text-white'
                    }`}>
                      {cow.isSold ? 'বিক্রিত' : 'লাইভ'}
                    </span>
                  </div>
                </div>

                {/* Info footer */}
                <div className="p-2.5">
                  <p className="font-bold text-stone-800 text-sm truncate">
                    {cow.tag || `${animalLabel} #${cow.id.slice(0, 5)}`}
                  </p>
                  {farmer && (
                    <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block mt-0.5 truncate max-w-full">
                      {farmer.name}
                    </p>
                  )}
                  <p className="text-[10px] text-stone-400 mt-0.5 font-medium">
                    ৳ {cow.purchasePrice.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
