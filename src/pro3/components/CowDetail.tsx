import React, { useState, useEffect, useCallback } from 'react';
import { Cow, Transaction, Gender, ProfitType, Profile } from '../types';
import { storageService } from '../services/storageService';
import { calculateProfit } from '../lib/calculations';
import {
  ChevronLeft, Calendar, Tag, MapPin, FileText,
  DollarSign, Calculator, CheckCircle, AlertCircle,
  Clock, Plus, Pencil, Save, Trash2, TrendingUp, X, Printer, Download, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ConfirmModal } from './ConfirmModal';

function SaveDialog({ open, phase, message }: {
  open: boolean; phase: 'saving' | 'success'; message: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-[260px] text-center shadow-2xl">
        {phase === 'saving' ? (
          <>
            <div className="w-14 h-14 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <div className="w-7 h-7 border-[3px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="font-bold text-stone-700 text-sm">সংরক্ষণ হচ্ছে...</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-bold text-stone-800 text-sm leading-snug">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

interface CowDetailProps {
  cow: Cow;
  profiles: Profile[];
  onBack: () => void;
  onRefresh?: () => void;
  onAddCowToProfile?: (name: string) => void;
  onSuccess?: (msg: string) => void;
  onOpenFullscreen?: (src: string) => void;
  t: any;
}

export function CowDetail({ cow: initialCow, profiles, onBack, onRefresh, onAddCowToProfile, onSuccess, onOpenFullscreen, t }: CowDetailProps) {
  const [cow, setCow] = useState<Cow>(initialCow);
  const [salePrice, setSalePrice] = useState<string>(cow.salePrice?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [saveDialog, setSaveDialog] = useState<{ open: boolean; phase: 'saving' | 'success'; message: string }>
    ({ open: false, phase: 'saving', message: '' });

  const showSaveDialog = useCallback((msg: string) => {
    setSaveDialog({ open: true, phase: 'saving', message: '' });
    return () => {
      setSaveDialog({ open: true, phase: 'success', message: msg });
      setTimeout(() => setSaveDialog(d => ({ ...d, open: false })), 2000);
    };
  }, []);
  const [isEditingSale, setIsEditingSale] = useState(!cow.isSold);
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const animalLabel = cow.category === 'Cow' ? 'গরু' : 'ছাগল';
  const animalIcon = cow.category === 'Cow' ? 'https://img.icons8.com/color/96/cow.png' : 'https://img.icons8.com/color/96/goat.png';

  const farmer = profiles.find(p => p.id === cow.profileId);

  // Sync with prop changes if any (though usuallyDetail is unmounted/remounted)
  useEffect(() => {
    setCow(initialCow);
    setSalePrice(initialCow.salePrice?.toString() || '');
    setIsEditingSale(!initialCow.isSold);
    setEditData({
      entryDate: initialCow.entryDate,
      profitType: initialCow.profitType,
      gender: initialCow.gender,
      address: initialCow.address
    });
  }, [initialCow]);
  
  // Transaction Modal State
  const [showTransactionModal, setShowTransactionModal] = useState<"loan" | "treatment" | null>(null);
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNote, setTxNote] = useState('');

  // Basic Info Edit State
  const [editData, setEditData] = useState({
    entryDate: cow.entryDate,
    profitType: cow.profitType,
    gender: cow.gender,
    address: cow.address
  });

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    let end = endDate ? new Date(endDate) : new Date();
    
    if (!endDate && farmer?.isArchived && farmer?.archivedAt) {
      end = new Date(farmer.archivedAt);
    }
    
    // Exact days calculation
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    // Months and days for display
    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    let days = end.getDate() - start.getDate();
    
    if (days < 0) {
      months -= 1;
      const lastMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    return { months, days, totalDays };
  };

  const duration = calculateDuration(cow.entryDate, cow.saleDate);

  const breakdown = cow.isSold || (salePrice && Number(salePrice) > 0) 
    ? calculateProfit(cow, Number(salePrice)) 
    : null;

  const handleSaveSale = async () => {
    if (!salePrice || Number(salePrice) <= 0) return;
    setLoading(true);
    const done = showSaveDialog('বিক্রয় সফলভাবে সম্পন্ন হয়েছে!');
    try {
      const updates = {
        salePrice: Number(salePrice),
        isSold: true,
        saleDate: new Date().toISOString().split('T')[0],
      };
      await storageService.updateCow(cow.id, { ...cow, ...updates });
      setCow(prev => ({ ...prev, ...updates }));
      setIsEditingSale(false);
      onRefresh?.();
      done();
      onSuccess?.('বিক্রয় সফলভাবে সম্পন্ন হয়েছে!');
    } catch (error) {
      console.error('Error updating sale', error);
      setSaveDialog(d => ({ ...d, open: false }));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBasicInfo = async () => {
    const done = showSaveDialog('তথ্য সফলভাবে আপডেট হয়েছে!');
    await storageService.updateCow(cow.id, { ...cow, ...editData });
    setCow(prev => ({ ...prev, ...editData }));
    setIsEditingBasic(false);
    done();
    onSuccess?.('তথ্য আপডেট হয়েছে!');
  };

  const handleAddTransaction = async () => {
    if (!txAmount || !showTransactionModal) return;

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: showTransactionModal,
      amount: Number(txAmount),
      date: txDate,
      note: txNote,
    };

    const history       = [...(cow.history || []), newTx];
    const loanAmount    = history.filter(h => h.type === 'loan').reduce((s, h) => s + h.amount, 0);
    const treatmentCost = history.filter(h => h.type === 'treatment').reduce((s, h) => s + h.amount, 0);
    const updates       = { history, loanAmount, treatmentCost };

    const label = showTransactionModal === 'loan' ? 'ঋণ' : 'চিকিৎসা খরচ';
    const done  = showSaveDialog(`${label} সফলভাবে যোগ হয়েছে!`);
    setShowTransactionModal(null); setTxAmount(''); setTxNote('');

    // Pass full cow so cow.php UPDATE has all required fields
    await storageService.updateCow(cow.id, { ...cow, ...updates });
    setCow(prev => ({ ...prev, ...updates }));
    done();
    onSuccess?.(`${label} সফলভাবে যোগ হয়েছে!`);
  };

  const deleteTransaction = async (id: string) => {
    const history       = (cow.history || []).filter(h => h.id !== id);
    const loanAmount    = history.filter(h => h.type === 'loan').reduce((s, h) => s + h.amount, 0);
    const treatmentCost = history.filter(h => h.type === 'treatment').reduce((s, h) => s + h.amount, 0);
    const updates       = { history, loanAmount, treatmentCost };
    await storageService.updateCow(cow.id, { ...cow, ...updates });
    setCow(prev => ({ ...prev, ...updates }));
  };

  const handleDownloadPDF = () => {
    const win = window.open('', '_blank');
    if (!win) { alert('পপআপ ব্লক হয়েছে। ব্রাউজার পপআপ অনুমতি দিন।'); return; }

    const origin   = window.location.origin;
    const dur      = calculateDuration(cow.entryDate, cow.saleDate);
    const totalInv = cow.purchasePrice + (cow.additionalExpenses || 0);
    const profit   = (cow.salePrice || 0) - totalInv;
    const fmt      = (n: number) => `৳${Math.round(n).toLocaleString('en-IN')}`;
    const fmtDate  = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const today    = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const durStr   = dur.months > 0 ? `${dur.months} মাস ${dur.days} দিন` : `${dur.days} দিন`;
    const tag      = cow.tag || cow.id.slice(0, 6);
    const fileName = `রশিদ_${tag}_${cow.saleDate || today}`;

    const profitBn: Record<string, string> = {
      'Half (50-50)': 'আধি (৫০-৫০)',
      'One Third (2:1)': 'দুই-তৃতীয়াংশ (২:১)',
      'One Fifth (3:2)': 'তিন-পঞ্চমাংশ (৩:২)',
    };
    const genderBn: Record<string, string> = {
      Bull: 'ষাঁড়', Cow: 'গাই', Heifer: 'বকনা', Calf: 'বাছুর',
      Buck: 'পাঠা', Doe: 'মাদী', Kid: 'বাচ্চা',
    };

    const bd = breakdown;

    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<title>রশিদ — ${cow.tag || 'পশু'}</title>
<style>
@font-face { font-family:'NotoSansBn'; src:url('${origin}/NotoSansBengali-Regular.ttf') format('truetype'); font-weight:400; }
@font-face { font-family:'NotoSansBn'; src:url('${origin}/NotoSansBengali-Bold.ttf')    format('truetype'); font-weight:700; }
*  { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'NotoSansBn','Segoe UI',sans-serif; background:#f8fafc; }
#loading-overlay {
  position:fixed; inset:0; background:#fff;
  display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;
  z-index:999; font-family:'NotoSansBn',sans-serif;
}
.spinner { width:40px; height:40px; border:3px solid #E2E8F0; border-top-color:#059669; border-radius:50%; animation:spin .7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.ov-title { font-size:16px; font-weight:700; color:#0F172A; }
.ov-sub   { font-size:13px; color:#64748B; }
.ov-btn   { margin-top:8px; background:#059669; color:#fff; border:none; padding:10px 28px; border-radius:10px; font-size:14px; font-family:'NotoSansBn',sans-serif; cursor:pointer; display:none; }
#receipt-page {
  width:210mm; min-height:297mm; background:#fff;
  padding:14mm 14mm 10mm; margin:0 auto;
}
.header {
  background:linear-gradient(135deg,#059669,#0d9488);
  color:#fff; padding:14px 18px; border-radius:10px; margin-bottom:14px;
}
.header-top { display:flex; align-items:center; gap:12px; margin-bottom:6px; }
.logo-circle { width:44px; height:44px; border-radius:50%; overflow:hidden; border:2px solid rgba(255,255,255,.4); flex-shrink:0; }
.logo-circle img { width:100%; height:100%; object-fit:cover; }
.header h1 { font-size:15px; font-weight:700; }
.header p  { font-size:11px; opacity:.8; margin-top:2px; }
.two-col { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; }
.section { border:1px solid #e2e8f0; border-radius:8px; padding:10px 14px; }
.section-title { font-size:10px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#94a3b8; margin-bottom:8px; }
.row { display:flex; justify-content:space-between; align-items:baseline; padding:3px 0; border-bottom:1px solid #f8fafc; }
.row:last-child { border-bottom:none; }
.row .lbl { color:#64748b; font-size:11px; }
.row .val { font-weight:700; font-size:11px; color:#0f172a; }
.row .val.green { color:#059669; }
.row .val.red   { color:#dc2626; }
.row.total-row  { border-top:1px solid #e2e8f0; padding-top:5px; margin-top:3px; }
.row.total-row .lbl { font-weight:700; color:#0f172a; }
.profit-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; }
.profit-box { border-radius:8px; padding:10px; text-align:center; }
.profit-box .box-lbl { font-size:10px; color:#64748b; margin-bottom:3px; }
.profit-box .box-val { font-size:16px; font-weight:700; }
.farmer-box { background:#f0fdf4; } .farmer-box .box-val { color:#059669; }
.owner-box  { background:#eff6ff; } .owner-box  .box-val { color:#2563eb; }
.badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:10px; font-weight:700; background:#dcfce7; color:#15803d; }
.footer { margin-top:12px; padding-top:10px; border-top:2px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; }
.footer .brand   { font-size:13px; font-weight:700; color:#475569; }
.footer .tagline { font-size:10px; color:#94a3b8; margin-top:2px; }
</style>
</head>
<body>
<div id="loading-overlay">
  <div class="spinner"></div>
  <p class="ov-title">PDF তৈরি হচ্ছে...</p>
  <p class="ov-sub">অনুগ্রহ করে একটু অপেক্ষা করুন</p>
  <button class="ov-btn" id="retry-btn" onclick="generatePDF()">আবার চেষ্টা করুন</button>
</div>

<div id="receipt-page">
  <div class="header">
    <div class="header-top">
      <div class="logo-circle"><img src="${origin}/logo.png" alt="Logo"></div>
      <div>
        <h1>Prime Agro Biotech Limited</h1>
        <p>রেজার খামার — ${cow.category === 'Cow' ? 'গরু' : 'ছাগল'} বিক্রয় রশিদ</p>
      </div>
    </div>
    <p style="font-size:12px;opacity:.8">
      তারিখ: ${cow.saleDate ? fmtDate(cow.saleDate) : today}
      &nbsp;|&nbsp;
      ট্যাগ: ${cow.tag || 'ট্যাগ নেই'}
    </p>
  </div>

  <div class="two-col">
    <div class="section">
      <div class="section-title">পশুর তথ্য</div>
      <div class="row"><span class="lbl">ধরন</span><span class="val">${cow.category === 'Cow' ? 'গরু' : 'ছাগল'}</span></div>
      ${cow.tag ? `<div class="row"><span class="lbl">ট্যাগ</span><span class="val">${cow.tag}</span></div>` : ''}
      <div class="row"><span class="lbl">লিঙ্গ</span><span class="val">${genderBn[cow.gender] || cow.gender}</span></div>
      <div class="row"><span class="lbl">লাভের ধরণ</span><span class="val">${profitBn[cow.profitType] || cow.profitType}</span></div>
      ${farmer ? `<div class="row"><span class="lbl">খামারি</span><span class="val">${farmer.name}</span></div>` : ''}
      ${cow.address ? `<div class="row"><span class="lbl">ঠিকানা</span><span class="val">${cow.address}</span></div>` : ''}
      <div class="row"><span class="lbl">অবস্থা</span><span class="val"><span class="badge">বিক্রিত ✓</span></span></div>
    </div>

    <div class="section">
      <div class="section-title">আর্থিক বিবরণ</div>
      <div class="row"><span class="lbl">এন্ট্রি তারিখ</span><span class="val">${fmtDate(cow.entryDate)}</span></div>
      <div class="row"><span class="lbl">সময়কাল</span><span class="val">${durStr}</span></div>
      <div class="row"><span class="lbl">ক্রয়মূল্য</span><span class="val">${fmt(cow.purchasePrice)}</span></div>
      ${(cow.additionalExpenses || 0) > 0 ? `<div class="row"><span class="lbl">অতিরিক্ত খরচ</span><span class="val">${fmt(cow.additionalExpenses || 0)}</span></div>` : ''}
      <div class="row total-row"><span class="lbl">মোট বিনিয়োগ</span><span class="val">${fmt(totalInv)}</span></div>
      ${(cow.loanAmount || 0) > 0 ? `<div class="row"><span class="lbl">ঋণ</span><span class="val red">${fmt(cow.loanAmount || 0)}</span></div>` : ''}
      ${(cow.treatmentCost || 0) > 0 ? `<div class="row"><span class="lbl">চিকিৎসা</span><span class="val" style="color:#f97316">${fmt(cow.treatmentCost || 0)}</span></div>` : ''}
      <div class="row total-row"><span class="lbl">বিক্রয়মূল্য</span><span class="val green" style="font-size:13px">${fmt(cow.salePrice || 0)}</span></div>
      <div class="row"><span class="lbl">মোট লাভ/ক্ষতি</span><span class="val ${profit >= 0 ? 'green' : 'red'}">${profit >= 0 ? '+' : ''}${fmt(profit)}</span></div>
    </div>
  </div>

  ${bd ? `
  <div class="section" style="margin-bottom:12px">
    <div class="section-title">লাভের বিভাজন</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">
      <div class="row"><span class="lbl">খামারির অংশ</span><span class="val">${fmt(bd.farmerShare)}</span></div>
      <div class="row"><span class="lbl">মালিকের অংশ</span><span class="val">${fmt(bd.ownerShare)}</span></div>
      ${bd.loanDeduction > 0 ? `<div class="row"><span class="lbl">ঋণ কর্তন</span><span class="val red">-${fmt(bd.loanDeduction)}</span></div>` : ''}
      ${bd.treatmentAdjustment > 0 ? `<div class="row"><span class="lbl">চিকিৎসা সমন্বয়</span><span class="val" style="color:#f97316">-${fmt(bd.treatmentAdjustment)}</span></div>` : ''}
    </div>
    <div class="profit-grid">
      <div class="profit-box farmer-box">
        <div class="box-lbl">খামারির চূড়ান্ত প্রাপ্তি</div>
        <div class="box-val">${fmt(bd.farmerFinal)}</div>
      </div>
      <div class="profit-box owner-box">
        <div class="box-lbl">মালিকের চূড়ান্ত প্রাপ্তি</div>
        <div class="box-val">${fmt(bd.ownerFinal)}</div>
      </div>
    </div>
  </div>` : ''}

  <div class="footer">
    <div>
      <div class="brand">রেজার খামার পোর্টাল</div>
      <div class="tagline">Prime Agro Biotech Limited · ${today}</div>
    </div>
    <div style="text-align:right;font-size:10px;color:#94a3b8">
      লাঙল চষি, দু'মুঠো প্রেমের আশায়...
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js"></script>
<script>
async function generatePDF() {
  const overlay    = document.getElementById('loading-overlay');
  const retryBtn   = document.getElementById('retry-btn');
  const statusText = overlay.querySelector('.ov-title');
  const subText    = overlay.querySelector('.ov-sub');
  statusText.textContent = 'PDF তৈরি হচ্ছে...';
  subText.textContent    = 'অনুগ্রহ করে একটু অপেক্ষা করুন';
  retryBtn.style.display = 'none';
  overlay.style.display  = 'flex';
  try {
    await document.fonts.ready;
    await new Promise(r => setTimeout(r, 600));
    const el     = document.getElementById('receipt-page');
    const canvas = await html2canvas(el, { scale:2.5, useCORS:true, allowTaint:false, backgroundColor:'#ffffff', logging:false, windowWidth:el.scrollWidth, windowHeight:el.scrollHeight });
    const { jsPDF } = window.jspdf;
    const pdf    = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const pageW  = 210; const pageH = 297;
    const ratio  = canvas.height / canvas.width;
    const imgH   = pageW * ratio;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', 0, 0, pageW, Math.min(imgH, pageH));
    pdf.save('${fileName}.pdf');
    statusText.textContent = 'PDF ডাউনলোড সম্পন্ন! ✅';
    subText.textContent    = 'এই ট্যাবটি বন্ধ করতে পারেন';
    overlay.querySelector('.spinner').style.display = 'none';
    setTimeout(() => window.close(), 1500);
  } catch(err) {
    console.error(err);
    statusText.textContent = 'PDF তৈরিতে সমস্যা হয়েছে';
    subText.textContent    = 'আবার চেষ্টা করুন';
    retryBtn.style.display = 'inline-block';
    overlay.querySelector('.spinner').style.display = 'none';
  }
}
window.addEventListener('load', generatePDF);
</script>
</body>
</html>`;

    win.document.write(html);
    win.document.close();
  };

  const handleDeleteCow = () => {
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    await storageService.deleteCow(cow.id);
    onRefresh?.();
    onBack();
  };

  const getProfitLabel = (type: ProfitType) => {
    if (type === "Half (50-50)") return t.half;
    if (type === "One Third (2:1)") return t.oneThird;
    if (type === "One Fifth (3:2)") return t.oneFifth;
    return type;
  };

  return (
    <div className="space-y-6 pb-12">
      <SaveDialog open={saveDialog.open} phase={saveDialog.phase} message={saveDialog.message} />
      <ConfirmModal 
        isOpen={showConfirmDelete}
        title={`${animalLabel}র তথ্য মুছুন`}
        message={`আপনি কি নিশ্চিত যে আপনি এই ${animalLabel}র তথ্যটি মুছে ফেলতে চান?`}
        onConfirm={confirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button onClick={onBack} className="p-2 hover:bg-stone-100 rounded-full transition-colors shrink-0">
            <ChevronLeft className="w-6 h-6 text-stone-600" />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-stone-900 truncate">{t.details}</h2>
            {cow.tag ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-sm font-bold text-emerald-600 truncate">{cow.tag}</p>
                <span className="text-[10px] text-stone-300 font-bold shrink-0">•</span>
                <p className="text-sm font-medium text-stone-400 truncate">{farmer?.name}</p>
              </div>
            ) : (
              <p className="text-sm font-bold text-emerald-600 truncate">{farmer?.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {!cow.isSold && onAddCowToProfile && (
            <button
              onClick={() => onAddCowToProfile(farmer?.name || '')}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all font-bold text-sm"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">আরও যোগ করুন</span>
            </button>
          )}
          {cow.isSold && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-stone-900 text-white rounded-2xl font-bold text-xs sm:text-sm hover:bg-stone-800 transition-all whitespace-nowrap"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">PDF ডাউনলোড</span>
              <span className="sm:hidden">PDF</span>
            </button>
          )}
          <button
            onClick={handleDeleteCow}
            className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="মুছে ফেলুন"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-52 sm:h-64 bg-gradient-to-br from-stone-100 to-stone-50 rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-inner">
        {cow.cowImageUrl ? (
          <>
            <img
              src={cow.cowImageUrl}
              alt={animalLabel}
              className="w-full h-full object-cover cursor-zoom-in"
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="async"
              onClick={() => cow.cowImageUrl && onOpenFullscreen?.(cow.cowImageUrl)}
            />
            <div className="absolute bottom-2 right-3 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
              👆 বড় দেখুন
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-24 h-24 rounded-3xl bg-white/60 flex items-center justify-center shadow-sm">
              <img src={animalIcon} alt={animalLabel} className="w-16 h-16 opacity-60" />
            </div>
            <p className="text-stone-400 text-xs font-bold">কোনো ছবি নেই</p>
          </div>
        )}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
          <div className="flex gap-2 flex-wrap justify-end">
            <span className={`px-3 py-1.5 rounded-full font-bold text-xs shadow-lg ${cow.isSold ? 'bg-stone-800 text-white' : 'bg-emerald-500 text-white'}`}>
              {cow.isSold ? t.sold : t.active}
            </span>
            <span className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 shadow-lg text-xs font-bold text-stone-800">
              {getProfitLabel(cow.profitType)}
            </span>
          </div>
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/20 shadow-lg flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-stone-800">
              {duration.months} মাস {duration.days} দিন
            </span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-stone-400" />
            সাধারণ তথ্য
          </h3>
          <button 
            onClick={() => setIsEditingBasic(!isEditingBasic)}
            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
          >
            {isEditingBasic ? <X className="w-5 h-5" /> : <Pencil className="w-5 h-5" />}
          </button>
        </div>

        {isEditingBasic ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-400 ml-1">এন্ট্রি তারিখ</label>
                <input 
                  type="date" 
                  value={editData.entryDate}
                  onChange={(e) => setEditData({...editData, entryDate: e.target.value})}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-400 ml-1">লিঙ্গ</label>
                <select 
                  value={editData.gender}
                  onChange={(e) => setEditData({...editData, gender: e.target.value as Gender})}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Bull">{cow.category === 'Cow' ? t.bull : t.buck}</option>
                  <option value="Cow">{cow.category === 'Cow' ? t.cow : t.doe}</option>
                  <option value="Heifer">{cow.category === 'Cow' ? t.heifer : t.doe}</option>
                  <option value="Calf">{cow.category === 'Cow' ? t.calf : t.kid}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-400 ml-1">লাভের ধরন</label>
                <select 
                  value={editData.profitType}
                  onChange={(e) => setEditData({...editData, profitType: e.target.value as ProfitType})}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Half (50-50)">{t.half}</option>
                  <option value="One Third (2:1)">{t.oneThird}</option>
                  <option value="One Fifth (3:2)">{t.oneFifth}</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-stone-400 ml-1">ঠিকানা</label>
                <input 
                  type="text" 
                  value={editData.address}
                  onChange={(e) => setEditData({...editData, address: e.target.value})}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
            <button 
              onClick={handleUpdateBasicInfo}
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              পরিবর্তন সংরক্ষণ করুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <InfoCard icon={<Tag className="w-4 h-4 text-emerald-600" />} label={t.purchasePrice} value={`৳ ${cow.purchasePrice.toLocaleString()}`} />
            <InfoCard icon={<UserCheck className="w-4 h-4 text-amber-600" />} label="লিঙ্গ" value={t[cow.gender.toLowerCase() as keyof typeof t] || cow.gender} />
            <InfoCard icon={<TrendingUp className="w-4 h-4 text-blue-600" />} label="লাভের ধরন" value={getProfitLabel(cow.profitType)} />
            <InfoCard icon={<Calendar className="w-4 h-4 text-blue-600" />} label={t.entryDate} value={cow.entryDate} />
            <InfoCard
              icon={<Clock className="w-4 h-4 text-purple-600" />}
              label={cow.isSold ? "মোট পালনের সময়" : "বর্তমান পালনের সময়"}
              value={`${duration.totalDays} দিন`}
            />
          </div>
        )}
      </div>

      {/* Expenses & History Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-2xl font-black text-stone-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            অন্যান্য খরচ ও লেনদেন
          </h3>
        </div>

        {/* Highlighted Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-rose-50 to-white p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border-2 border-rose-100 shadow-sm transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-100">
                <WalletIcon className="w-6 h-6 text-white" />
              </div>
              <button 
                onClick={() => setShowTransactionModal('loan')}
                className="p-2 bg-white text-rose-600 rounded-xl border border-rose-200 hover:bg-rose-50 transition-colors shadow-sm"
                title="ঋন যোগ করুন"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs uppercase font-black text-rose-400 tracking-wider mb-1">ঋণের পরিমাণ</p>
            <p className="text-3xl font-black text-rose-600">৳ {cow.loanAmount.toLocaleString()}</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-amber-50 to-white p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border-2 border-amber-100 shadow-sm transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100">
                <ShieldPlusIcon className="w-6 h-6 text-white" />
              </div>
              <button 
                onClick={() => setShowTransactionModal('treatment')}
                className="p-2 bg-white text-amber-600 rounded-xl border border-amber-200 hover:bg-amber-50 transition-colors shadow-sm"
                title="চিকিৎসা খরচ যোগ করুন"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs uppercase font-black text-amber-500 tracking-wider mb-1">চিকিৎসা খরচ</p>
            <p className="text-3xl font-black text-amber-600">৳ {cow.treatmentCost.toLocaleString()}</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border-2 border-blue-100 shadow-sm transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                <Calculator className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-xs uppercase font-black text-blue-500 tracking-wider mb-1">অতিরিক্ত খরচ</p>
            <p className="text-3xl font-black text-stone-900 font-mono">৳ {cow.additionalExpenses.toLocaleString()}</p>
          </motion.div>
        </div>

        {/* Transaction History Sub-Section */}
        <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-stone-200 shadow-sm">
          <h4 className="text-lg font-black text-stone-900 mb-8 flex items-center gap-3">
            <Clock className="w-5 h-5 text-stone-400" />
            লেনদেনের ইতিহাস
          </h4>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Loan History List */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                <h5 className="font-black text-stone-700 text-sm">{t.loanAmount} এর তালিকা</h5>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {(!cow.history || cow.history.filter(h => h.type === 'loan').length === 0) ? (
                  <EmptyState text="কোনো ঋন এর রেকর্ড নেই" />
                ) : (
                  cow.history.filter(h => h.type === 'loan').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                    <TransactionItem key={tx.id} tx={tx} accentColor="text-rose-600" onDelete={() => deleteTransaction(tx.id)} />
                  ))
                )}
              </div>
            </div>

            {/* Treatment History List */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                <h5 className="font-black text-stone-700 text-sm">{t.treatmentCost} এর তালিকা</h5>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {(!cow.history || cow.history.filter(h => h.type === 'treatment').length === 0) ? (
                  <EmptyState text="কোনো চিকিৎসা খরচের রেকর্ড নেই" />
                ) : (
                  cow.history.filter(h => h.type === 'treatment').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                    <TransactionItem key={tx.id} tx={tx} accentColor="text-amber-600" onDelete={() => deleteTransaction(tx.id)} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Modal Overlay */}
      <AnimatePresence>
        {showTransactionModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTransactionModal(null)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                {showTransactionModal === 'loan' ? <Plus className="text-red-500" /> : <Plus className="text-amber-500" />}
                {showTransactionModal === 'loan' ? 'নতুন ঋন যোগ করুন' : 'নতুন চিকিৎসা খরচ যোগ করুন'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-stone-500">টাকার পরিমাণ (৳)</label>
                  <input 
                    type="number" 
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-xl font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500">তারিখ</label>
                  <input 
                    type="date" 
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500">নোট (চ্ছিক)</label>
                  <textarea 
                    value={txNote}
                    onChange={(e) => setTxNote(e.target.value)}
                    placeholder="বিস্তারিত লিখুন..."
                    rows={2}
                    className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowTransactionModal(null)}
                    className="flex-1 py-4 text-stone-500 font-bold hover:bg-stone-50 rounded-2xl"
                  >
                    বাতিল
                  </button>
                  <button 
                    onClick={handleAddTransaction}
                    className="flex-1 py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all"
                  >
                    সেভ করুন
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sale Section */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-4">
        <h3 className="font-bold text-stone-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          বিক্রয় তথ্য
        </h3>
        
        {isEditingSale ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 p-3 bg-stone-50 rounded-2xl border border-stone-100 italic text-stone-500 text-sm">
                লাভের ধরন: <span className="font-bold text-stone-700">{getProfitLabel(cow.profitType)}</span>
              </div>
              <div className="flex-1 p-3 bg-stone-50 rounded-2xl border border-stone-100 italic text-stone-500 text-sm">
                ক্রয়মূল্য: <span className="font-bold text-stone-700">৳ {cow.purchasePrice.toLocaleString()}</span>
              </div>
            </div>
            <div className="relative">
              <input 
                type="number" 
                placeholder={t.salePrice}
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xl font-bold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">৳</span>
            </div>
            <button 
              onClick={handleSaveSale}
              disabled={loading || !salePrice}
              className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all disabled:bg-stone-200 flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              বিক্রয় সম্পন্ন করুন
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div>
              <p className="text-xs text-emerald-600 font-bold uppercase">{t.salePrice}</p>
              <p className="text-2xl font-black text-emerald-700">৳ {Number(salePrice).toLocaleString()}</p>
            </div>
            <button onClick={() => setIsEditingSale(true)} className="text-emerald-600 font-bold text-sm underline">
              {t.edit}
            </button>
          </div>
        )}
      </div>

      {/* Profit Breakdown */}
      {breakdown && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-3xl border-2 border-emerald-100 shadow-xl shadow-emerald-50 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h3 className="font-bold text-stone-900 text-lg">{t.profitBreakdown}</h3>
            <div className="text-right">
              <p className="text-[10px] text-stone-500 uppercase font-bold">{t.totalProfit}</p>
              <p className={`text-xl font-black ${breakdown.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ৳ {breakdown.totalProfit.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <BreakdownRow label={t.purchasePrice} value={cow.purchasePrice} />
            <BreakdownRow label={t.farmerShare} value={breakdown.farmerShare} />
            <BreakdownRow label={t.ownerShare} value={breakdown.ownerShare} />
            <div className="h-px bg-stone-100 my-2" />
            <BreakdownRow label={t.loanDeduction} value={breakdown.loanDeduction} isDeduction />
            <BreakdownRow label={t.treatmentAdjustment} value={breakdown.treatmentAdjustment} isAdjustment />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <p className="text-[10px] text-stone-500 uppercase font-bold mb-1">খামারির চূড়ান্ত পাওনা</p>
              <p className="text-lg font-black text-stone-900">৳ {breakdown.farmerFinal.toLocaleString()}</p>
            </div>
            <div className="bg-emerald-600 p-4 rounded-2xl shadow-lg shadow-emerald-100">
              <p className="text-[10px] text-emerald-100 uppercase font-bold mb-1">মালিকের চূড়ান্ত পাওনা</p>
              <p className="text-lg font-black text-white">৳ {breakdown.ownerFinal.toLocaleString()}</p>
            </div>
          </div>

          {/* New Periodic Performance Section for Cow Detail */}
          <div className="pt-6 border-t border-stone-100 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-stone-400" />
              <h4 className="text-xs font-black text-stone-500 uppercase tracking-widest">{t.performanceReport}</h4>
            </div>
            
            {(() => {
              const entry = new Date(cow.entryDate).getTime();
              let sale = cow.saleDate ? new Date(cow.saleDate).getTime() : Date.now();
              
              if (!cow.saleDate && farmer?.isArchived && farmer?.archivedAt) {
                sale = new Date(farmer.archivedAt).getTime();
              }
              
              const diffMs = Math.max(0, sale - entry);
              const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
              const diffDays = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
              const diffMonths = Math.max(1, diffDays / 30);

              const simplifiedProfit = (cow.salePrice || Number(salePrice) || 0) - cow.purchasePrice;
              let ownerPercentage = 0.5;
              if (cow.profitType === "One Third (2:1)") ownerPercentage = 1/3;
              if (cow.profitType === "One Fifth (3:2)") ownerPercentage = 2/5;

              const ownerSimplifiedProfit = simplifiedProfit * ownerPercentage;
              const farmerSimplifiedProfit = simplifiedProfit * (1 - ownerPercentage);

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Owner Periodic Stats */}
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 space-y-3">
                    <p className="text-[10px] font-black text-emerald-600 uppercase">{t.ownerProfitRate}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-500">{t.hourly}</span>
                      <span className="font-bold text-emerald-700">৳ {(ownerSimplifiedProfit / diffHours).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-500">{t.daily}</span>
                      <span className="font-bold text-emerald-700">৳ {(ownerSimplifiedProfit / diffDays).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-emerald-100 pt-2">
                      <span className="font-black text-stone-600">{t.monthly}</span>
                      <span className="font-black text-emerald-700">৳ {(ownerSimplifiedProfit / diffMonths).toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Farmer Periodic Stats */}
                  <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 space-y-3">
                    <p className="text-[10px] font-black text-amber-600 uppercase">{t.farmerProfitRate}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-500">{t.hourly}</span>
                      <span className="font-bold text-amber-700">৳ {(farmerSimplifiedProfit / diffHours).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-500">{t.daily}</span>
                      <span className="font-bold text-amber-700">৳ {(farmerSimplifiedProfit / diffDays).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-amber-100 pt-2">
                      <span className="font-black text-stone-600">{t.monthly}</span>
                      <span className="font-black text-amber-700">৳ {(farmerSimplifiedProfit / diffMonths).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}

      {/* Receipt Image */}
      {cow.receiptImageUrl && (
        <div className="space-y-2">
          <h3 className="font-bold text-stone-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-stone-400" />
            ক্রয় রশিদ
          </h3>
          <div
            className="rounded-3xl overflow-hidden border border-stone-200 cursor-zoom-in"
            onClick={() => cow.receiptImageUrl && onOpenFullscreen?.(cow.receiptImageUrl)}
          >
            <img src={cow.receiptImageUrl} alt="Receipt" className="w-full h-auto" referrerPolicy="no-referrer" />
          </div>
        </div>
      )}

      {/* PDF receipt removed — PDF is now generated programmatically via jsPDF */}
      <div style={{ display: 'none' }}><div>
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-stone-900 pb-8 mb-8">
            <div>
              <h1 className="text-4xl font-black mb-2">বিক্রয় রশিদ</h1>
              {cow.tag && <p className="text-emerald-600 font-black text-xl mb-1">{cow.tag}</p>}
              <p className="text-stone-500 font-bold uppercase tracking-widest text-sm">Cattle Management System</p>
            </div>
            {cow.cowImageUrl && (
              <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-stone-100 shadow-md">
                <img 
                  src={cow.cowImageUrl || animalIcon} 
                  alt={animalLabel} 
                  className={`w-full h-full object-cover ${!cow.cowImageUrl ? 'opacity-30 p-4 grayscale' : ''}`}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">খামারী তথ্য</h3>
              <p className="text-2xl font-bold">{farmer?.name || 'অজ্ঞাত খামারী'}</p>
              <p className="text-stone-500">{cow.address || 'ঠিকানা পাওয়া যায়নি'}</p>
              <div className="mt-4 flex gap-4">
                <div className="bg-stone-50 px-3 py-1 rounded-full border border-stone-100 text-[10px] font-bold uppercase">
                  {t[cow.gender.toLowerCase() as keyof typeof t] || cow.gender}
                </div>
                <div className="bg-stone-50 px-3 py-1 rounded-full border border-stone-100 text-[10px] font-bold uppercase">
                  {getProfitLabel(cow.profitType)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">তারিখ ও সময়</h3>
              <div className="space-y-1">
                <p className="font-bold">এন্ট্রি তারিখ: <span className="text-stone-600">{cow.entryDate}</span></p>
                <p className="font-bold">বিক্রয় তারিখ: <span className="text-stone-600">{cow.saleDate || 'N/A'}</span></p>
                <p className="font-bold text-emerald-600">পালন কাল: <span className="font-black">{duration.months} মাস {duration.days} দিন</span></p>
              </div>
            </div>
          </div>

          {/* Financials Table */}
          <div className="mb-12">
            <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">হিসাবের বিবরণ</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-4 text-stone-500 uppercase text-xs">বিবরণ</th>
                  <th className="text-right py-4 text-stone-500 uppercase text-xs">পরিমাণ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                <tr className="font-bold">
                  <td className="py-4">ক্রয় মূল্য</td>
                  <td className="py-4 text-right underline">৳ {cow.purchasePrice.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-4">বিক্রয় মূল্য</td>
                  <td className="py-4 text-right font-black text-emerald-600">৳ {cow.salePrice?.toLocaleString()}</td>
                </tr>
                {breakdown && (
                  <>
                    <tr className="text-stone-600 italic">
                      <td className="py-2 pl-4">খামারির লাভের অংশ</td>
                      <td className="py-2 text-right">৳ {breakdown.farmerShare.toLocaleString()}</td>
                    </tr>
                    <tr className="text-stone-600 italic">
                      <td className="py-2 pl-4">মালিকের লাভের অংশ</td>
                      <td className="py-2 text-right">৳ {breakdown.ownerShare.toLocaleString()}</td>
                    </tr>
                    <tr className="text-red-500 italic">
                      <td className="py-2 pl-4">ঋন সমন্বয় (-)</td>
                      <td className="py-2 text-right">- ৳ {breakdown.loanDeduction.toLocaleString()}</td>
                    </tr>
                    <tr className="text-amber-600 italic">
                      <td className="py-2 pl-4">চিকিৎসা খরচ সমন্বয় (±)</td>
                      <td className="py-2 text-right">± ৳ {breakdown.treatmentAdjustment.toLocaleString()}</td>
                    </tr>
                  </>
                )}
              </tbody>
              {breakdown && (
                <tfoot className="border-t-2 border-stone-900 border-double">
                  <tr>
                    <td className="py-6 font-black text-xl">খামারির চূড়ান্ত পাওনা</td>
                    <td className="py-6 text-right font-black text-2xl">৳ {breakdown.farmerFinal.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-bold text-stone-500">মালিকের চূড়ান্ত পাওনা</td>
                    <td className="py-2 text-right font-black text-xl text-stone-500 italic">৳ {breakdown.ownerFinal.toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Transaction Summary if any */}
          {cow.history && cow.history.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">লেনদেনের সংক্ষিপ্ত ইতিহাস</h3>
              <div className="grid grid-cols-2 gap-4">
                {cow.history.map((tx, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs">
                    <div>
                      <span className="font-bold uppercase opacity-50 block text-[8px]">{tx.type === 'loan' ? 'ঋন' : 'চিকিৎসা'}</span>
                      <span className="font-bold">{tx.date}</span>
                      {tx.note && <span className="block text-stone-500 mt-0.5">{tx.note}</span>}
                    </div>
                    <span className={`font-black ${tx.type === 'loan' ? 'text-red-500' : 'text-amber-600'}`}>৳ {tx.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-20 flex justify-between items-end border-t border-dashed border-stone-300 pt-12">
            <div className="text-center w-48">
              <div className="border-t border-stone-900 mb-2"></div>
              <p className="text-xs font-bold font-serif italic">মালিকের স্বাক্ষর</p>
            </div>
            <div className="text-center w-48">
              <div className="border-t border-stone-900 mb-2"></div>
              <p className="text-xs font-bold font-serif italic">খামারির স্বাক্ষর</p>
            </div>
          </div>
          
          <div className="mt-12 text-center text-[10px] text-stone-300 font-bold uppercase tracking-[0.2em]">
            Generated by Cattle Management System • {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="bg-white p-3 rounded-2xl border border-stone-200 flex items-center gap-3 min-w-0">
      <div className="p-1.5 bg-stone-50 rounded-xl shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] text-stone-500 uppercase font-bold truncate">{label}</p>
        <p className="font-bold text-stone-900 text-sm leading-tight break-words">{value}</p>
      </div>
    </div>
  );
}

function WalletIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
  )
}

function ShieldPlusIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="M8 11h8"/><path d="M12 7v8"/></svg>
  )
}

function BreakdownRow({ label, value, isDeduction, isAdjustment }: { label: string, value: number, isDeduction?: boolean, isAdjustment?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-stone-600">{label}</span>
      <span className={`font-bold ${isDeduction ? 'text-red-500' : isAdjustment ? 'text-amber-600' : 'text-stone-900'}`}>
        {isDeduction ? '-' : isAdjustment ? '±' : ''} ৳ {value.toLocaleString()}
      </span>
    </div>
  );
}

function TrendingUpIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><path d="M17 6h6v6"/></svg>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-10 bg-stone-50/50 rounded-[2rem] border-2 border-dashed border-stone-100 flex flex-col items-center">
      <AlertCircle className="w-8 h-8 text-stone-200 mb-2" />
      <p className="text-stone-400 text-xs italic">{text}</p>
    </div>
  );
}

function TransactionItem({ tx, accentColor, onDelete }: { tx: Transaction, accentColor: string, onDelete: () => void, key?: any }) {
  return (
    <div className="p-4 bg-white rounded-2xl border border-stone-100 group transition-all hover:border-emerald-200 hover:shadow-lg shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xl font-black ${accentColor}`}>
              ৳ {tx.amount.toLocaleString()}
            </span>
            <span className="text-[10px] text-stone-400 flex items-center gap-1.5 font-bold bg-stone-50 px-2 py-1 rounded-full">
              <Calendar className="w-3 h-3" /> {tx.date}
            </span>
          </div>
          {tx.note && (
            <div className="text-xs text-stone-600 bg-stone-50/50 p-3 rounded-xl border border-stone-50 leading-relaxed italic">
              {tx.note}
            </div>
          )}
        </div>
        <button 
          onClick={onDelete}
          className="p-2 text-stone-300 hover:text-red-500 hover:bg-rose-50 rounded-xl transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
