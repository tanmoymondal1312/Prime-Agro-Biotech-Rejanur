import React, { useState } from 'react';
import { Profile, Gender, ProfitType } from '../types';
import { storageService } from '../services/storageService';
import { Camera, Upload, X, Save, AlertCircle } from 'lucide-react';
import { numberToBengaliWords } from '../lib/numberUtils';

function UploadDialog({ phase, progress, message }: {
  phase: 'uploading' | 'success';
  progress: number;
  message: string;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-[280px] text-center shadow-2xl">
        {phase === 'uploading' ? (
          <>
            <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <div className="w-8 h-8 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="font-bold text-stone-700 mb-5 text-sm">
              {progress > 0 ? 'ছবি আপলোড হচ্ছে...' : 'সংরক্ষণ হচ্ছে...'}
            </p>
            {progress > 0 && (
              <>
                <div className="h-3 bg-stone-100 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-4xl font-black text-emerald-600">{progress}%</p>
              </>
            )}
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-bold text-stone-800 text-base leading-snug">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

interface CowFormProps {
  profiles: Profile[];
  category: 'Cow' | 'Goat';
  initialProfileName?: string;
  onCancel: () => void;
  onSuccess: () => void;
  onRefresh?: () => void;
  t: any;
}

export function CowForm({ profiles, category, initialProfileName, onCancel, onSuccess, onRefresh, t }: CowFormProps) {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [addAnother, setAddAnother] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean; phase: 'uploading' | 'success'; progress: number; message: string;
  }>({ open: false, phase: 'uploading', progress: 0, message: '' });

  const [formData, setFormData] = useState({
    farmerName:         initialProfileName || '',
    tag:                '',
    entryDate:          new Date().toISOString().split('T')[0],
    purchasePrice:      '',
    gender:             (category === 'Cow' ? 'Bull' : 'Buck') as Gender,
    profitType:         'Half (50-50)' as ProfitType,
    address:            '',
    additionalExpenses: '',
    loanAmount:         '',
    treatmentCost:      '',
    notes:              '',
  });

  const [cowFile, setCowFile]               = useState<File | null>(null);
  const [receiptFile, setReceiptFile]       = useState<File | null>(null);
  const [cowPreview, setCowPreview]         = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cow' | 'receipt') => {
    const file = e.target.files?.[0];
    if (!file) return;
    // FileReader gives a base64 data URL — works reliably on all mobile browsers
    // (URL.createObjectURL can silently fail on some Android WebViews)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (!result) return;
      if (type === 'cow') { setCowFile(file); setCowPreview(result); }
      else                { setReceiptFile(file); setReceiptPreview(result); }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.farmerName || (!initialProfileName && !formData.purchasePrice)) {
      setError('অনুগ্রহ করে সব প্রয়োজনীয় তথ্য পূরণ করুন');
      return;
    }

    setLoading(true);
    setError('');
    setDialog({ open: true, phase: 'uploading', progress: 0, message: '' });

    try {
      let profileId = '';
      const existing = profiles.find(p => p.name.toLowerCase() === formData.farmerName.toLowerCase());
      if (existing) {
        profileId = existing.id;
      } else {
        const newProf = await storageService.saveProfile(formData.farmerName);
        profileId = newProf.id;
      }

      const { farmerName, ...rest } = formData;
      const initialLoan      = Number(formData.loanAmount    || 0);
      const initialTreatment = Number(formData.treatmentCost || 0);

      const initialHistory: any[] = [];
      if (initialLoan > 0) initialHistory.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'loan', amount: initialLoan,
        date: formData.entryDate, note: 'প্রারম্ভিক ঋণ',
      });
      if (initialTreatment > 0) initialHistory.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'treatment', amount: initialTreatment,
        date: formData.entryDate, note: 'প্রারম্ভিক চিকিৎসা',
      });

      await storageService.saveCow(
        {
          ...rest,
          profileId,
          purchasePrice:      Number(formData.purchasePrice || 0),
          additionalExpenses: Number(formData.additionalExpenses || 0),
          loanAmount:         initialLoan,
          treatmentCost:      initialTreatment,
          history:            initialHistory,
          cowImageUrl:        '',
          receiptImageUrl:    '',
          isSold:             false,
        },
        category,
        cowFile     ?? undefined,
        receiptFile ?? undefined,
        (pct) => setDialog(d => ({ ...d, progress: pct }))
      );

      onRefresh?.();

      const animalLabel = category === 'Cow' ? 'গরু' : 'ছাগল';
      const hasImage = !!(cowFile || receiptFile);
      const successMsg = hasImage
        ? `${animalLabel} ও ছবি সফলভাবে সংরক্ষিত হয়েছে!`
        : `${animalLabel} সফলভাবে যোগ হয়েছে!`;

      setDialog({ open: true, phase: 'success', progress: 100, message: successMsg });

      setTimeout(() => {
        setDialog(d => ({ ...d, open: false }));
        if (addAnother) {
          setFormData({
            ...formData,
            purchasePrice: '', tag: '',
            gender: (category === 'Cow' ? 'Bull' : 'Buck') as Gender,
            notes: '', loanAmount: '', treatmentCost: '', additionalExpenses: '',
          });
          setCowFile(null); setCowPreview(null);
          setReceiptFile(null); setReceiptPreview(null);
          setError('');
        } else {
          onSuccess();
        }
      }, 2000);

    } catch (err) {
      console.error('Error saving cow', err);
      setDialog(d => ({ ...d, open: false }));
      setError('তথ্য সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {dialog.open && <UploadDialog phase={dialog.phase} progress={dialog.progress} message={dialog.message} />}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-900">{category === 'Cow' ? t.addCow : t.addGoat}</h2>
        <button type="button" onClick={onCancel} className="p-2 text-stone-400 hover:text-stone-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm border border-red-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Profile & Tag */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">{t.investor} *</label>
          <div className="relative">
            <input
              type="text"
              list="farmer-names"
              value={formData.farmerName}
              onChange={(e) => setFormData({ ...formData, farmerName: e.target.value })}
              placeholder={category === 'Cow' ? t.investorCow : t.investorGoat}
              className={`w-full p-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all ${initialProfileName ? 'ring-2 ring-emerald-100 border-emerald-300' : ''}`}
              required
            />
            {initialProfileName && (
              <p className="text-[10px] font-bold text-emerald-600 mt-1 px-1">
                {initialProfileName} এর জন্য নতুন পশু যোগ হচ্ছে
              </p>
            )}
            <datalist id="farmer-names">
              {profiles.map(p => <option key={p.id} value={p.name} />)}
            </datalist>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">
            {category === 'Cow' ? 'গরুর ট্যাগ/নাম' : 'ছাগলের ট্যাগ/নাম'}
          </label>
          <input
            type="text"
            placeholder={category === 'Cow' ? 'যেমন: লাল গরু, ১নং বাছুর' : 'যেমন: সাদা ছাগল, ১নং পাঠা'}
            value={formData.tag}
            onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
            className="w-full p-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
          <p className="text-[9px] text-stone-400 font-medium px-1">একই মালিকের একাধিক পশু থাকলে আলাদা করার জন্য ট্যাগ ব্যবহার করুন।</p>
        </div>
      </div>

      {/* Dates & Price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">{t.entryDate} *</label>
          <input
            type="date"
            value={formData.entryDate}
            onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
            className="w-full p-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">
            {t.purchasePrice} {!initialProfileName ? '*' : '(ঐচ্ছিক)'}
          </label>
          <input
            type="number"
            placeholder="৳ 0.00"
            step="any"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
            className="w-full p-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            required={!initialProfileName}
          />
          {formData.purchasePrice && Number(formData.purchasePrice) > 0 && (
            <p className="text-[10px] font-bold text-stone-400 px-1 italic">
              {numberToBengaliWords(Number(formData.purchasePrice))}
            </p>
          )}
        </div>
      </div>

      {/* Gender & Profit Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">{t.gender} *</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
            className="w-full p-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          >
            {category === 'Cow' ? (
              <>
                <option value="Bull">{t.bull}</option>
                <option value="Cow">{t.cow}</option>
                <option value="Heifer">{t.heifer}</option>
                <option value="Calf">{t.calf}</option>
              </>
            ) : (
              <>
                <option value="Buck">{t.buck}</option>
                <option value="Doe">{t.doe}</option>
                <option value="Kid">{t.kid}</option>
              </>
            )}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">{t.profitType} *</label>
          <select
            value={formData.profitType}
            onChange={(e) => setFormData({ ...formData, profitType: e.target.value as ProfitType })}
            className="w-full p-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          >
            <option value="Half (50-50)">{t.half}</option>
            <option value="One Third (2:1)">{t.oneThird}</option>
            <option value="One Fifth (3:2)">{t.oneFifth}</option>
          </select>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-stone-700">{t.address}</label>
        <input
          type="text"
          placeholder="ঠিকানা লিখুন"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full p-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        />
      </div>

      {/* Loan & Treatment */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">{t.loanAmount}</label>
          <input type="number" placeholder="৳ 0.00" step="any" value={formData.loanAmount}
            onChange={(e) => setFormData({ ...formData, loanAmount: e.target.value })}
            className="w-full p-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">{t.treatmentCost}</label>
          <input type="number" placeholder="৳ 0.00" step="any" value={formData.treatmentCost}
            onChange={(e) => setFormData({ ...formData, treatmentCost: e.target.value })}
            className="w-full p-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
        </div>
      </div>

      {/* Additional expenses & Notes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">{t.additionalExpenses}</label>
          <input type="number" placeholder="৳ 0.00" step="any" value={formData.additionalExpenses}
            onChange={(e) => setFormData({ ...formData, additionalExpenses: e.target.value })}
            className="w-full p-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-stone-700">{t.notes}</label>
          <textarea rows={1} placeholder="অতিরিক্ত তথ্য..." value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full p-4 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none" />
        </div>
      </div>

      {/* Image uploads */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <span className="text-sm font-semibold text-stone-700 block">
            {category === 'Cow' ? t.uploadCowImage : t.uploadGoatImage}
          </span>
          <label className="relative h-40 bg-stone-100 border-2 border-dashed border-stone-300 rounded-3xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-stone-200 active:bg-stone-300 transition-all block">
            {cowPreview
              ? <img src={cowPreview} alt="Preview" className="w-full h-full object-cover pointer-events-none" />
              : <><Camera className="w-8 h-8 text-stone-400 mb-2" /><span className="text-[10px] text-stone-500">ছবি নির্বাচন করুন</span></>
            }
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => handleImageChange(e, 'cow')} />
          </label>
        </div>
        <div className="space-y-2">
          <span className="text-sm font-semibold text-stone-700 block">{t.uploadReceiptImage}</span>
          <label className="relative h-40 bg-stone-100 border-2 border-dashed border-stone-300 rounded-3xl overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-stone-200 active:bg-stone-300 transition-all block">
            {receiptPreview
              ? <img src={receiptPreview} alt="Preview" className="w-full h-full object-cover pointer-events-none" />
              : <><Upload className="w-8 h-8 text-stone-400 mb-2" /><span className="text-[10px] text-stone-500">রশিদ আপলোড করুন</span></>
            }
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => handleImageChange(e, 'receipt')} />
          </label>
        </div>
      </div>

      <div className="flex gap-4 pt-4 flex-col">
        <label className="flex items-center gap-2 cursor-pointer mb-2 px-2">
          <input type="checkbox" checked={addAnother} onChange={(e) => setAddAnother(e.target.checked)}
            className="w-5 h-5 rounded-md border-stone-300 text-emerald-600 focus:ring-emerald-500" />
          <span className="text-sm font-bold text-stone-700">
            সেভ করার পর আরও {category === 'Cow' ? 'গরু' : 'ছাগল'} যোগ করুন
          </span>
        </label>
        <div className="flex gap-4">
          <button type="button" onClick={onCancel}
            className="flex-1 py-4 text-stone-600 font-bold rounded-2xl hover:bg-stone-100 transition-all">
            বাতিল
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2">
            {loading
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save className="w-5 h-5" />
            }
            {loading ? 'সংরক্ষণ হচ্ছে...' : t.save}
          </button>
        </div>
      </div>
    </form>
  );
}
