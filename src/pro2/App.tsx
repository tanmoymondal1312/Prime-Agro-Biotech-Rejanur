/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dashboard } from './components/Dashboard';
import { BorrowersList } from './components/BorrowersList';
import { AddLoanForm } from './components/AddLoanForm';
import { BottomNav } from './components/Navigation';
import { BorrowerDetail } from './components/BorrowerDetail';
import { Reports } from './components/Reports';
import { StockManagement } from './components/StockManagement';
import { MyDebtsView } from './components/MyDebtsView';
import { useFirebase } from './lib/FirebaseContext';
import { signInWithGoogle } from './lib/firebase';
import { LogIn } from 'lucide-react';
import { StockCategory } from './types';

const LoginScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <div className="mesh-bg"></div>
    
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="z-10 text-center"
    >
      <div className="w-24 h-24 glass-premium rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
        <div className="w-12 h-12 accent-gradient rounded-xl flex items-center justify-center scale-110">
          <span className="text-2xl font-bold text-white">৳</span>
        </div>
      </div>
      <h1 className="text-4xl font-bold mb-4 tracking-tight">TakaTrack <span className="text-indigo-400">Pro</span></h1>
      <p className="text-gray-400 mb-12 max-w-xs mx-auto font-bengali">আপনার ধারের হিসাব রাখুন স্মার্টলি। সহজ, নিরাপদ এবং আধুনিক ফিন্যান্স ট্র্যাকার।</p>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={signInWithGoogle}
        className="glass-premium px-8 py-4 rounded-2xl flex items-center gap-4 text-lg font-medium border-white/20 transition-all hover:bg-white/10"
      >
        <LogIn size={24} className="text-indigo-400" />
        <span className="font-bengali">গুগল দিয়ে শুরু করুন</span>
      </motion.button>
    </motion.div>
  </div>
);

export default function App() {
  const { user, loading, login, theme, setTheme } = useFirebase();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<string | null>(null);
  const [selectedStockCategory, setSelectedStockCategory] = useState<StockCategory | null>(null);
  const [myDebtMode, setMyDebtMode] = useState<'debts' | 'payments' | null>(null);

  React.useEffect(() => {
    document.documentElement.className = theme;
    // Cleanup: remove html class when this app unmounts so it doesn't bleed into other routes
    return () => { document.documentElement.className = ''; };
  }, [theme]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="mesh-bg"></div>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="mesh-bg"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 text-center"
        >
          <div className="w-24 h-24 glass-premium rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <div className="w-12 h-12 accent-gradient rounded-xl flex items-center justify-center scale-110">
              <span className="text-2xl font-bold text-white">৳</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">TakaTrack <span className="text-indigo-400">Pro</span></h1>
          <p className="text-gray-400 mb-12 max-w-xs mx-auto font-bengali">আপনার ধারের হিসাব রাখুন স্মার্টলি। সহজ, নিরাপদ এবং আধুনিক ফিন্যান্স ট্র্যাকার।</p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={login}
            className="glass-premium px-8 py-4 rounded-2xl flex items-center gap-4 text-lg font-medium border-white/20 transition-all hover:bg-white/10"
          >
            <LogIn size={24} className="text-indigo-400" />
            <span className="font-bengali">শুরু করুন (Local Mode)</span>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const handleTabChange = (tab: string) => {
    setSelectedBorrowerId(null);
    setSelectedStockCategory(null);
    setMyDebtMode(null);
    setActiveTab(tab);
  };

  const renderContent = () => {
    if (selectedBorrowerId) {
      return (
        <BorrowerDetail 
          borrowerId={selectedBorrowerId} 
          onBack={() => setSelectedBorrowerId(null)} 
        />
      );
    }

    if (selectedStockCategory) {
      return (
        <StockManagement 
          category={selectedStockCategory} 
          onBack={() => setSelectedStockCategory(null)} 
        />
      );
    }

    if (myDebtMode) {
      return (
        <MyDebtsView 
          initialMode={myDebtMode}
          onBack={() => setMyDebtMode(null)} 
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <Dashboard 
            key="dashboard" 
            onSelectBorrower={(id) => setSelectedBorrowerId(id)} 
            onSelectStock={(cat) => setSelectedStockCategory(cat)}
            onShowMyDebts={(mode) => setMyDebtMode(mode)}
            onSwitchTab={handleTabChange}
          />
        );
      case 'borrowers':
        return <BorrowersList key="borrowers" onSelectBorrower={(id) => setSelectedBorrowerId(id)} />;
      case 'add':
        return <AddLoanForm key="add" onBack={() => handleTabChange('home')} />;
      case 'reports':
        return <Reports key="reports" onSelectBorrower={(id) => setSelectedBorrowerId(id)} />;
      case 'settings':
        return (
          <div className="pt-10 px-6 max-w-2xl mx-auto flex flex-col gap-6">
            <h1 className="text-2xl font-bold font-bengali">সেটিংস</h1>
            <div className="flex flex-col gap-3">
              <div className="glass p-4 rounded-2xl flex justify-between items-center">
                <span className="font-bengali text-sm font-medium">অ্যাপ থিম</span>
                <div className="flex bg-black/20 p-1 rounded-xl">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold font-bengali transition-all ${theme === 'light' ? 'bg-white text-black shadow-md' : 'text-gray-500'}`}
                  >
                    সাদা
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold font-bengali transition-all ${theme === 'dark' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-500'}`}
                  >
                    ডার্ক
                  </button>
                </div>
              </div>

              {['প্রোফাইল সম্পাদন', 'ব্যাকআপ ও রিস্টোর', 'পিন লক সিকিউরিটি', 'ভাষা (বাংলা/English)', 'আমাদের সম্পর্কে'].map((item) => (
                <button key={item} className="w-full glass p-4 rounded-2xl text-left font-bengali hover:border-premium-cyan/30 transition-all flex justify-between items-center text-sm">
                  {item}
                  <span className="text-gray-500 opacity-50">›</span>
                </button>
              ))}
            </div>
            <div className="glass p-5 rounded-2xl mt-4 border-red-500/20">
              <p className="text-xs text-red-500 font-bold mb-1 uppercase">Danger Zone</p>
              <button className="w-full text-left text-red-400 font-bengali text-sm">ডেটা মুছে ফেলুন</button>
            </div>
            <button
              onClick={() => { window.location.href = '/home'; }}
              className="glass p-4 rounded-2xl text-left font-bengali text-sm hover:border-premium-cyan/30 transition-all flex items-center gap-2"
            >
              ← পোর্টালে ফিরুন
            </button>
          </div>
        );
      default:
        return (
          <Dashboard 
            onSelectBorrower={(id) => setSelectedBorrowerId(id)} 
            onSelectStock={(cat) => setSelectedStockCategory(cat)}
            onShowMyDebts={(mode) => setMyDebtMode(mode)}
            onSwitchTab={handleTabChange}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen relative selection:bg-premium-cyan selection:text-black transition-colors duration-500 ${theme === 'dark' ? 'dark text-white' : 'light text-gray-900 bg-gray-50'}`}>
      <div className="mesh-bg"></div>

      <AnimatePresence mode="wait">
        <motion.main
          key={selectedBorrowerId ? `borrower-${selectedBorrowerId}` : activeTab}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {renderContent()}
        </motion.main>
      </AnimatePresence>

      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
    </div>
  );
}
