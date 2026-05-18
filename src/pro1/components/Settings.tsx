import React, { useState, useEffect, useRef } from 'react';
import {
  Palette, Type, Check, ShieldCheck, Moon, Sun,
  Image as ImageIcon, RotateCcw, AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsProps {
  onOpenSidebar: () => void;
  onResetData: () => void;
}

const COLORS = [
  { name: 'Emerald', value: '#34d399', bg: '#34d399' },
  { name: 'Sky',     value: '#0ea5e9', bg: '#0ea5e9' },
  { name: 'Amber',   value: '#f59e0b', bg: '#f59e0b' },
  { name: 'Rose',    value: '#f43f5e', bg: '#f43f5e' },
  { name: 'Indigo',  value: '#6366f1', bg: '#6366f1' },
  { name: 'Lime',    value: '#d9f35c', bg: '#d9f35c' },
];

const FONT_SIZES = [
  { name: 'Small',   value: '90%',  label: 'ছোট ফন্ট' },
  { name: 'Default', value: '100%', label: 'সাধারণ' },
  { name: 'Large',   value: '115%', label: 'বড়' },
  { name: 'X-Large', value: '140%', label: 'সবচেয়ে বড়' },
];

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm">
      {children}
    </div>
  );
}

function SectionHeader({
  icon, title, subtitle, iconBg = '#f0fdf4', iconColor = '#059669',
}: {
  icon: React.ReactNode; title: string; subtitle?: string;
  iconBg?: string; iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p style={{ color: '#111827' }} className="font-black text-base leading-tight">{title}</p>
        {subtitle && (
          <p style={{ color: '#6b7280' }} className="text-xs font-bold mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default function Settings({ onOpenSidebar, onResetData }: SettingsProps) {
  const [activeColor, setActiveColor] = useState(localStorage.getItem('app-theme-color') || '#d9f35c');
  const [fontSize,    setFontSize]    = useState(localStorage.getItem('app-font-size')    || '1rem');
  const [darkMode,    setDarkMode]    = useState(localStorage.getItem('app-dark-mode') === 'true');

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-theme', activeColor);
    document.documentElement.style.fontSize = fontSize;
    if (darkMode) document.documentElement.classList.add('dark');
    else          document.documentElement.classList.remove('dark');
    localStorage.setItem('app-theme-color', activeColor);
    localStorage.setItem('app-font-size',   fontSize);
    localStorage.setItem('app-dark-mode',   darkMode.toString());
  }, [activeColor, fontSize, darkMode]);

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <main className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 pb-24 max-w-2xl mx-auto w-full">

        {/* ── Logo ── */}
        <SectionCard>
          <SectionHeader
            icon={<ImageIcon className="w-5 h-5" />}
            title="অফিশিয়াল লোগো"
            subtitle="Prime Agro Biotech Limited"
            iconBg="#fffbeb" iconColor="#d97706"
          />
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-gray-200 shrink-0">
              <img src="/portal-logo.png" alt="Prime Agro Biotech" className="w-full h-full object-cover" />
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex-1 min-w-0">
              <p style={{ color: '#111827' }} className="text-sm font-black leading-tight">Prime Agro Biotech Limited</p>
              <p style={{ color: '#6b7280' }} className="text-xs font-bold mt-1">লাঙল চষি, দু'মুঠো প্রেমের আশায়...</p>
            </div>
          </div>
        </SectionCard>

        {/* ── Theme Color ── */}
        <SectionCard>
          <SectionHeader
            icon={<Palette className="w-5 h-5" />}
            title="থিম কালার"
            subtitle="Accent color preference"
            iconBg="#f0fdf4" iconColor="#059669"
          />
          <div className="grid grid-cols-6 gap-3">
            {COLORS.map((color) => (
              <button
                key={color.name}
                onClick={() => setActiveColor(color.value)}
                className="relative aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
                style={{ backgroundColor: color.bg }}
              >
                {activeColor === color.value && (
                  <Check className="w-4 h-4 text-white drop-shadow" />
                )}
                <span style={{ color: '#374151' }} className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase whitespace-nowrap hidden sm:block">
                  {color.name}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-8 sm:mt-6 flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-8 h-8 rounded-lg border-2 border-gray-200 shrink-0"
              style={{ backgroundColor: activeColor }} />
            <div>
              <p style={{ color: '#111827' }} className="text-xs font-black">সক্রিয় থিম রঙ</p>
              <p style={{ color: '#6b7280' }} className="text-xs font-bold">{activeColor}</p>
            </div>
          </div>
        </SectionCard>

        {/* ── Font Size ── */}
        <SectionCard>
          <SectionHeader
            icon={<Type className="w-5 h-5" />}
            title="ফন্ট সাইজ"
            subtitle="Text scale for readability"
            iconBg="#eff6ff" iconColor="#3b82f6"
          />
          <div className="grid grid-cols-2 gap-3">
            {FONT_SIZES.map((font) => {
              const isActive = fontSize === font.value;
              return (
                <button
                  key={font.name}
                  onClick={() => setFontSize(font.value)}
                  className="flex items-center justify-between p-4 rounded-xl border-2 transition-all active:scale-95"
                  style={{
                    backgroundColor: isActive ? '#111827' : '#f9fafb',
                    borderColor:     isActive ? '#111827' : '#e5e7eb',
                  }}
                >
                  <div className="text-left min-w-0">
                    <p className="font-black text-sm leading-tight"
                      style={{ color: isActive ? '#ffffff' : '#111827' }}>
                      {font.name}
                    </p>
                    <p className="text-xs font-bold mt-0.5"
                      style={{ color: isActive ? '#d1d5db' : '#6b7280' }}>
                      {font.label}
                    </p>
                  </div>
                  {isActive && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* ── System Toggles ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Dark Mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#eef2ff', color: '#6366f1' }}>
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </div>
              <div className="text-left">
                <p style={{ color: '#111827' }} className="font-black text-sm">ডার্ক মোড</p>
                <p style={{ color: '#6b7280' }} className="text-xs font-bold">{darkMode ? 'চালু' : 'বন্ধ'}</p>
              </div>
            </div>
            <div className="w-11 h-6 rounded-full p-0.5 transition-colors shrink-0"
              style={{ backgroundColor: darkMode ? '#111827' : '#e5e7eb' }}>
              <motion.div
                animate={{ x: darkMode ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-5 h-5 bg-white rounded-full shadow-sm"
              />
            </div>
          </button>

          {/* Auto Backup */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#f0fdf4', color: '#059669' }}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p style={{ color: '#111827' }} className="font-black text-sm">অটো ব্যাকআপ</p>
                <p style={{ color: '#059669' }} className="text-xs font-bold">সক্রিয়</p>
              </div>
            </div>
            <div className="w-11 h-6 rounded-full p-0.5 bg-emerald-500 shrink-0">
              <div className="w-5 h-5 bg-white rounded-full shadow-sm translate-x-5" />
            </div>
          </div>
        </div>

        {/* ── Danger Zone ── */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p style={{ color: '#dc2626' }} className="font-black text-base">ডেটা রিসেট</p>
              <p style={{ color: '#ef4444' }} className="text-xs font-bold">সব ডেটা স্থায়ীভাবে মুছে যাবে</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('আপনি কি নিশ্চিত যে আপনি সকল ডেটা মুছে ফেলতে চান? এটি আর ফিরে পাওয়া যাবে না।')) {
                onResetData();
              }
            }}
            className="w-full flex items-center justify-center gap-3 p-4 bg-red-600 text-white rounded-xl font-black text-sm uppercase tracking-wide hover:bg-red-700 active:scale-[0.98] transition-all shadow-md"
          >
            <RotateCcw className="w-5 h-5" />
            সকল তথ্য রিসেট করুন
          </button>
        </div>

      </main>
    </div>
  );
}
