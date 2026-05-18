/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CategoryType = 
  | 'tillage'      // হাল খরচ
  | 'seeds'        // বীজ খরচ
  | 'irrigation'   // সেচ খরচ
  | 'sowing'       // বপন খরচ
  | 'fertilizer'   // সার খরচ
  | 'pesticide'    // কীটনাশক/স্প্রে
  | 'labor'        // শ্রমিক খরচ
  | 'weeding'      // নিড়ানী
  | 'harvesting'   // কাটাই খরচ
  | 'transport'    // পরিবহন
  | 'others'       // অন্যান্য
  | string;

export interface Expense {
  id: string;
  category: CategoryType;
  amount: number; // Total Payable
  advance: number;
  due: number;
  date: string;
  note?: string;
  image?: string; // Memo photo (base64)
}

export interface HarvestInfo {
  quantity: number;
  unit: string; // কেজি, বস্তা, মন
  pricePerUnit: number;
  date: string;
}

export interface SaleEntry {
  id: string;
  quantity: number;
  unit: string; // কেজি, বস্তা, মন
  unitPrice: number;
  totalAmount: number;
  date: string;
  note?: string;
}

export interface StockEntry {
  id: string;
  location: 'cold_store' | 'home' | 'others';
  bags: number;
  quantity: number; // in units (kg/mon)
  unit: string;
  date: string;
  note?: string;
  purchasePrice?: number; // Price paid for external stock
  source: 'internal' | 'external';
}

export interface StockSaleEntry {
  id: string;
  stockEntryId: string; // Link to the stock entry
  bags: number;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  date: string;
  note?: string;
}

export interface WeatherLog {
  id: string;
  date: string;
  comment: string;
}

export interface FarmPlan {
  id: string;
  date: string;
  endDate?: string;
  activity: string;
  color?: string;
  status: 'pending' | 'completed';
}

export interface CropProfile {
  id: string;
  name: string;
  startDate: string;
  landSize?: string;
  expenses: Expense[];
  active: boolean; // Keep for legacy, but use 'status' preferred
  status: 'live' | 'archived';
  type?: 'cultivation' | 'stock';
  archivedDate?: string;
  expectedSale?: number;
  actualSale?: number; // Sum of all sales
  sales?: SaleEntry[];
  stocks?: StockEntry[];
  stockSales?: StockSaleEntry[];
  harvest?: HarvestInfo; // Legacy
}

export const CATEGORY_LABELS: Record<string, string> = {
  tillage: 'হাল খরচ',
  seeds: 'বীজ খরচ',
  irrigation: 'সেচ খরচ',
  sowing: 'বপন খরচ',
  fertilizer: 'সার খরচ',
  pesticide: 'কীটনাশক/স্প্রে',
  labor: 'শ্রমিক খরচ',
  weeding: 'নিড়ানী',
  harvesting: 'কাটাই খরচ',
  transport: 'পরিবহন',
  others: 'অন্যান্য'
};
