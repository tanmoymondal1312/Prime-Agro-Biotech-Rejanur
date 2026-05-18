import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Palette, 
  Type, 
  LayoutDashboard,
  Check,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Moon,
  Sun,
  Image as ImageIcon,
  Upload,
  Trash2,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsProps {
  onOpenSidebar: () => void;
  onResetData: () => void;
}

const COLORS = [
  { name: 'Emerald', value: '#34d399', class: 'bg-emerald-400' },
  { name: 'Sky', value: '#0ea5e9', class: 'bg-sky-400' },
  { name: 'Amber', value: '#f59e0b', class: 'bg-amber-400' },
  { name: 'Rose', value: '#f43f5e', class: 'bg-rose-400' },
  { name: 'Indigo', value: '#6366f1', class: 'bg-indigo-400' },
  { name: 'Lime', value: '#d9f35c', class: 'bg-secondary' },
];

const FONT_SIZES = [
  { name: 'Small', value: '90%', label: 'কখনো কখনো ছোট ফন্ট ভালো' },
  { name: 'Default', value: '100%', label: 'সাধারণ ফন্ট সাইজ' },
  { name: 'Large', value: '115%', label: 'বড় ফন্ট পড়তে সুবিধা' },
  { name: 'X-Large', value: '140%', label: 'সবথেকে বড় ফন্ট - প্রিমিয়াম ভিউ' },
];

export default function Settings({ onOpenSidebar, onResetData }: SettingsProps) {
  const [activeColor, setActiveColor] = useState(localStorage.getItem('app-theme-color') || '#d9f35c');
  const [fontSize, setFontSize] = useState(localStorage.getItem('app-font-size') || '1rem');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('app-dark-mode') === 'true');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Apply changes to document root
    document.documentElement.style.setProperty('--primary-theme', activeColor);
    document.documentElement.style.fontSize = fontSize;
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('app-theme-color', activeColor);
    localStorage.setItem('app-font-size', fontSize);
    localStorage.setItem('app-dark-mode', darkMode.toString());
  }, [activeColor, fontSize, darkMode]);


  return (
    <div className="flex-1 flex flex-col min-h-screen bg-bg-page transition-colors duration-500">
      <header className="sticky top-0 z-30 bg-bg-page/80 backdrop-blur-md border-b border-border-subtle px-4 py-3 sm:px-6 sm:py-4 lg:p-8 flex items-center gap-3">
        <div className="flex items-center gap-6">
          <button 
            onClick={onOpenSidebar}
            className="w-12 h-12 bg-white dark:bg-card-bg rounded-2xl shadow-sm border border-border-subtle flex items-center justify-center text-stone-900 dark:text-white lg:hidden"
          >
            <LayoutDashboard className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-white dark:bg-card-bg rounded-full overflow-hidden shadow-sm border border-border-subtle">
               <img src="/portal-logo.png" alt="Prime Agro Biotech" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-stone-900 dark:text-white font-display tracking-tight leading-none">সেটিংস (Settings)</h1>
              <p className="text-sm font-bold text-stone-700 dark:text-white/30 uppercase tracking-[0.2em] mt-2 pl-1">Personalize your workspace</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-8 lg:p-12 space-y-12 pb-24 max-w-4xl mx-auto w-full">
        {/* Logo — static display */}
        <section className="bg-white dark:bg-card-bg rounded-[3.5rem] border border-border-subtle shadow-premium p-12 transition-colors">
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-500">
                  <ImageIcon className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-stone-900 dark:text-white">অফিশিয়াল লোগো</h3>
                  <p className="text-xs font-bold text-stone-700 dark:text-white/20 uppercase tracking-widest mt-1">Prime Agro Biotech Limited</p>
               </div>
            </div>
            <div className="flex items-center gap-8">
               <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-secondary/20 shadow-lg flex-shrink-0">
                  <img src="/portal-logo.png" alt="Prime Agro Biotech" className="w-full h-full object-cover" />
               </div>
               <div className="p-6 bg-bg-page/50 dark:bg-black/10 rounded-2xl border border-border-subtle flex-1">
                  <p className="text-sm font-black text-stone-900 dark:text-white mb-1">Prime Agro Biotech Limited</p>
                  <p className="text-xs font-bold text-stone-700 dark:text-white/40 uppercase tracking-widest leading-relaxed">
                     লাঙল চষি, দু'মুঠো প্রেমের আশায়...
                  </p>
               </div>
            </div>
        </section>

        {/* Theme Settings */}
        <section className="bg-white dark:bg-card-bg rounded-[3.5rem] border border-border-subtle shadow-premium p-12 relative overflow-hidden group transition-colors">
           <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-secondary/10 dark:bg-secondary/20 rounded-2xl flex items-center justify-center text-lime-500">
                 <Palette className="w-6 h-6" />
              </div>
              <div>
                 <h3 className="text-xl font-black text-stone-900 dark:text-white">থিম কালার (Theme Color)</h3>
                 <p className="text-xs font-bold text-stone-700 dark:text-white/20 uppercase tracking-widest mt-1">Select your primary accent color</p>
              </div>
           </div>

           <div className="grid grid-cols-3 sm:grid-cols-6 gap-6">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setActiveColor(color.value)}
                  className={`relative w-full aspect-square rounded-[2rem] ${color.class} transition-all hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg`}
                >
                  {activeColor === color.value && (
                    <motion.div 
                      layoutId="color-check"
                      className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40"
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-black text-stone-700 uppercase tracking-widest">{color.name}</span>
                </button>
              ))}
           </div>
        </section>

        {/* Font Settings */}
        <section className="bg-white dark:bg-card-bg rounded-[3.5rem] border border-border-subtle shadow-premium p-12 transition-colors">
           <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500">
                 <Type className="w-6 h-6" />
              </div>
              <div>
                 <h3 className="text-xl font-black text-stone-900 dark:text-white">ফন্ট সাইজ (Font Size)</h3>
                 <p className="text-xs font-bold text-stone-700 dark:text-white/20 uppercase tracking-widest mt-1">Adjust text scale for better readability</p>
              </div>
           </div>

           <div className="space-y-4">
              {FONT_SIZES.map((font) => (
                 <button
                   key={font.name}
                   onClick={() => setFontSize(font.value)}
                   className={`w-full flex items-center justify-between p-6 rounded-3xl border transition-all ${fontSize === font.value ? 'bg-primary text-white border-primary shadow-xl dark:bg-secondary dark:text-[#1e211f] dark:border-secondary' : 'bg-bg-page/30 dark:bg-black/10 border-border-subtle dark:border-white/5 dark:text-white/60 hover:border-primary/30'}`}
                 >
                    <div className="flex items-center gap-6">
                       <span className={`font-black text-lg ${fontSize === font.value ? 'text-white' : 'text-stone-900 dark:text-white'}`}>{font.name}</span>
                       <span className={`text-xs font-bold opacity-40 ${fontSize === font.value ? 'text-white' : 'text-stone-900 dark:text-white'}`}>{font.label}</span>
                    </div>
                    {fontSize === font.value && <Check className="w-6 h-6 text-lime-400 dark:text-[#1e211f]" />}
                 </button>
              ))}
           </div>
        </section>

        {/* System Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div 
             onClick={() => setDarkMode(!darkMode)}
             className="bg-white dark:bg-card-bg p-10 rounded-[3rem] border border-border-subtle shadow-premium flex items-center justify-between group cursor-pointer hover:border-primary transition-all transition-colors"
           >
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:rotate-12 transition-transform">
                    {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                 </div>
                 <div>
                    <p className="text-lg font-black text-stone-900 dark:text-white">ডার্ক মোড (Dark Mode)</p>
                    <p className="text-xs font-black text-stone-700 dark:text-white/20 uppercase tracking-widest">Enhanced for night viewing</p>
                 </div>
              </div>
              <div className={`w-14 h-8 rounded-full p-1 transition-colors ${darkMode ? 'bg-secondary' : 'bg-primary/10'}`}>
                 <motion.div 
                   animate={{ x: darkMode ? 24 : 0 }}
                   className="w-6 h-6 bg-white rounded-full shadow-sm" 
                 />
              </div>
           </div>

           <div className="bg-white dark:bg-card-bg p-10 rounded-[3rem] border border-border-subtle shadow-premium flex items-center justify-between group transition-colors">
              <div className="flex items-center gap-6">
                 <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:rotate-12 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-lg font-black text-stone-900 dark:text-white">অটো ব্যাকআপ (Auto Backup)</p>
                    <p className="text-xs font-black text-stone-700 dark:text-white/20 uppercase tracking-widest">Local storage synced</p>
                 </div>
              </div>
              <div className="w-14 h-8 bg-emerald-500 rounded-full p-1 border border-emerald-600/20">
                 <div className="w-6 h-6 bg-white rounded-full shadow-sm translate-x-6" />
              </div>
           </div>
        </div>

        {/* Danger Zone */}
        <section className="bg-red-50/30 dark:bg-red-900/5 rounded-[3.5rem] border border-red-100 dark:border-red-900/20 p-12 transition-colors">
           <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600">
                 <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                 <h3 className="text-xl font-black text-red-600 dark:text-red-400">ডেটা রিসেট (Reset Data)</h3>
                 <p className="text-xs font-bold text-red-600/40 dark:text-red-400/40 uppercase tracking-widest mt-1">Permanently clear all application data</p>
              </div>
           </div>

           <button 
             onClick={() => {
               if (window.confirm('আপনি কি নিশ্চিত যে আপনি সকল ডেটা মুছে ফেলতে চান? এটি আর ফিরে পাওয়া যাবে না।')) {
                 onResetData();
               }
             }}
             className="w-full flex items-center justify-center gap-4 p-8 bg-red-600 text-white rounded-[2rem] font-black text-lg uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl active:scale-[0.98]"
           >
              <RotateCcw className="w-6 h-6" />
              সকল তথ্য রিসেট করুন (Reset All Data)
           </button>
        </section>
      </main>
    </div>
  );
}
