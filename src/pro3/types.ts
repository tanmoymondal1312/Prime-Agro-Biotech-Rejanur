export type Gender = "Bull" | "Cow" | "Heifer" | "Calf" | "Buck" | "Doe" | "Kid" | string;
export type ProfitType = "Half (50-50)" | "One Third (2:1)" | "One Fifth (3:2)" | string;

export interface Profile {
  id: string;
  name: string;
  ownerUid: string;
  createdAt: string;
  photoUrl?: string;
  isArchived?: boolean;
  archivedAt?: string;
}

export interface Transaction {
  id: string;
  type: "loan" | "treatment";
  amount: number;
  date: string;
  note: string;
}

export type Category = "Cow" | "Goat";

export interface Cow {
  id: string;
  tag?: string;
  category: Category;
  profileId: string;
  entryDate: string;
  purchasePrice: number;
  gender: Gender;
  profitType: ProfitType;
  address: string;
  additionalExpenses: number;
  loanAmount: number;
  treatmentCost: number;
  history?: Transaction[];
  notes: string;
  cowImageUrl?: string;
  receiptImageUrl?: string;
  salePrice?: number;
  isSold: boolean;
  saleDate?: string;
  ownerUid: string;
  createdAt?: string;
}

export interface ProfitBreakdown {
  totalProfit: number;
  farmerShare: number;
  ownerShare: number;
  loanDeduction: number;
  treatmentAdjustment: number;
  farmerFinal: number;
  ownerFinal: number;
}
