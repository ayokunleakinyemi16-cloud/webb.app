

import { Timestamp } from 'firebase/firestore';

export type GlobalTime = {
    currentDate: string;
}

export type Transaction = {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'crypto_buy' | 'crypto_sell' | 'staking_reward' | 'staking_lock' | 'fee' | 'expense' | 'loan_repayment' | 'loan_disbursement' | 'salary' | 'revenue_claim';
  amount: number;
  currency: AllCoins;
  timestamp: string;
  description: string;
  category?: BudgetCategory;
};

export type Payee = {
  id: string;
  name: string;
  accountNumber: string;
}

export type Stake = {
  id:string;
  planId: string;
  amount: number;
  currency: AllCoins;
  startTime: string;
  endTime: string;
};

export type CryptoCoin = 'BTC' | 'LTC' | 'XRP' | 'DOGE' | 'ETH' | 'GMZ';
export type FiatCoin = 'USD' | 'NGN' | 'EUR';
export type AllCoins = CryptoCoin | FiatCoin;

export type BudgetCategory = 'Food' | 'Transport' | 'Shopping' | 'Entertainment' | 'Housing' | 'Utilities' | 'Other' | 'Loans';

export type Budget = {
  id: string;
  category: BudgetCategory;
  amount: number;
  spent: number;
  month: string; // e.g., "2024-07"
}

export type Goal = {
    id: string;
    name: string;
    targetAmount: number;
    savedAmount: number;
    currency: FiatCoin;
}

export type RecurringExpense = {
    id: string;
    name: string;
    amount: number;
    currency: FiatCoin;
    category: BudgetCategory;
    nextDueDate: string;
    interval: 'monthly' | 'annually';
    propertyId?: string; // Link to a property
}

export type Property = {
  id: string;
  name: string;
  buyPrice: number;
  rentPrice: number;
  maintenanceFee: number;
  image: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  description: string;
};

export type UserProperty = {
    propertyId: string;
    ownershipType: 'buy' | 'rent';
    purchaseDate: string;
};

export type Loan = {
    id: string;
    name: string;
    amount: number;
    interestRate: number; // e.g. 0.05 for 5%
    remainingBalance: number;
    monthlyPayment: number;
    nextPaymentDate: string;
}

export type Job = {
    id: string;
    title: string;
    salary: number; // Annual salary
    description: string;
    requiredEducation: string | null; // ID of the required EducationCourse
}

export type EducationCourse = {
    id: string;
    title: string;
    cost: number;
    durationDays: number;
    description: string;
}

export type UserEducation = {
    courseId: string;
    enrollmentDate: string;
    status: 'in-progress' | 'completed';
}

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: Timestamp;
  read: boolean;
  data?: Record<string, any>;
};

export type User = {
  id: string;
  username: string;
  email: string;
  accountNumber: string;
  password?: string;
  balances: Record<FiatCoin, number>;
  card: {
    number: string;
    expiry: string;
    cvv: string;
  };
  crypto: Record<CryptoCoin, number>;
  stakes: Stake[];
  transactions: Transaction[];
  payees: Payee[];
  budgets: Budget[];
  goals: Goal[];
  recurringExpenses: RecurringExpense[];
  properties: UserProperty[];
  loans: Loan[];
  jobId: string | null;
  education: UserEducation[];
  lastLogin: string;
  lastSalaryDate: string;
  lastMiscellaneousFeeDate?: string;
  // Admin-specific field
  feesCollected?: number;
};
