import { Cow, ProfitBreakdown, ProfitType } from "../types";

export function calculateProfit(cow: Cow, salePrice: number): ProfitBreakdown {
  const purchasePrice = cow.purchasePrice;
  const additionalExpenses = cow.additionalExpenses || 0;
  
  // Total Investment = Purchase Price + Additional Expenses
  const totalInvestment = purchasePrice + additionalExpenses;
  
  // Profit = Sale Price - Total Investment
  const profit = salePrice - totalInvestment;

  let farmerShare = 0;
  let ownerShare = 0;
  let treatmentAdjustment = 0;

  switch (cow.profitType) {
    case "Half (50-50)":
      // Farmer gets 50%, Owner gets 50%
      farmerShare = profit * 0.5;
      ownerShare = profit * 0.5;
      // Treatment cost split between farmer & owner (50/50)
      treatmentAdjustment = cow.treatmentCost * 0.5;
      break;

    case "One Third (2:1)":
      // Farmer gets 2 parts, Owner gets 1 part (Total 3 parts)
      farmerShare = (profit / 3) * 2;
      ownerShare = profit / 3;
      // Farmer pays 100% treatment cost
      treatmentAdjustment = cow.treatmentCost;
      break;

    case "One Fifth (3:2)":
      // Farmer gets 3 parts, Owner gets 2 parts (Total 5 parts)
      farmerShare = (profit / 5) * 3;
      ownerShare = (profit / 5) * 2;
      // Farmer pays 100% treatment cost
      treatmentAdjustment = cow.treatmentCost;
      break;
  }

  // Loan Adjustment: Loan will be deducted from Farmer's share
  const loanDeduction = cow.loanAmount;

  // Final Calculations
  const farmerFinal = farmerShare - loanDeduction - treatmentAdjustment;
  
  // Owner gets back their total investment (purchase + expenses) + their share of profit + loan reimbursement + treatment reimbursement
  const ownerFinal = totalInvestment + ownerShare + treatmentAdjustment + loanDeduction;

  return {
    totalProfit: profit,
    farmerShare,
    ownerShare,
    loanDeduction,
    treatmentAdjustment,
    farmerFinal,
    ownerFinal
  };
}
