export enum LoanCategory {
  PERSONAL = 'ব্যক্তিগত',
  BUSINESS = 'ব্যবসা',
  AGRICULTURE = 'কৃষি',
  EMERGENCY = 'জরুরি',
  OTHERS = 'অন্যান্য'
}

export enum PaymentStatus {
  PAID = 'Paid',
  PARTIAL = 'Partial Paid',
  OVERDUE = 'Overdue',
  PENDING = 'Pending'
}

export interface Payment {
  id: string;
  amount: number;
  date: Date;
  note?: string;
}

export interface Borrower {
  id: string;
  name: string;
  phone: string;
  address?: string;
  photoUrl?: string;
  nid?: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface Loan {
  id: string;
  borrowerId: string;
  amount: number;
  remainingAmount: number;
  category: LoanCategory;
  reason?: string;
  giveDate: Date;
  dueDate: Date;
  status: PaymentStatus;
  payments: Payment[];
  notes?: string;
  attachments?: string[]; // URLs
}

export interface AppStats {
  totalLent: number;
  totalCollected: number;
  totalDue: number;
  todayTarget: number;
  thisMonthCollection: number;
}

export type StockCategory = 'Fertilizer' | 'Other';

export interface StockItem {
  id: string;
  name: string;
  quantity: number; // in bags/units
  category: StockCategory;
  subCategory?: string;
  date?: Date;
  lastUpdated: Date;
  note?: string;
}

export interface MyDebtPayment {
  id: string;
  amount: number;
  date: Date;
  note?: string;
}

export interface MyDebt {
  id: string;
  lenderName: string;
  totalAmount: number;
  remainingAmount: number;
  date: Date;
  dueDate?: Date;
  note?: string;
  payments: MyDebtPayment[];
}
