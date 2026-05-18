import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Phone, Lock, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { isAuthenticated, loginWithCredentials } from '../auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.trim() || !password.trim()) {
      setError('মোবাইল নম্বর এবং পাসওয়ার্ড দিন');
      return;
    }
    setLoading(true);
    const result = await loginWithCredentials(phone.trim(), password);
    setLoading(false);
    if (result.success) {
      navigate('/home', { replace: true });
    } else {
      setError(result.error || 'লগইন ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-stone-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="w-28 h-28 mx-auto mb-4 rounded-full overflow-hidden shadow-lg border-2 border-emerald-100">
            <img
              src="/portal-logo.png"
              alt="Prime Agro Biotech"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">রেজা পোর্টাল</h1>
          <p className="text-stone-400 text-sm mt-1 font-medium">আপনার তথ্য দিয়ে প্রবেশ করুন</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/60 border border-stone-100 p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">মোবাইল নম্বর</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full pl-11 pr-4 py-3.5 border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-medium transition-all"
                  autoComplete="username"
                  inputMode="tel"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-widest">পাসওয়ার্ড</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3.5 border border-stone-200 rounded-2xl text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-medium transition-all"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{error}</span>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-200 mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  প্রবেশ করুন
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
