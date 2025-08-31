

import type { User, Transaction, AllCoins, FiatCoin, Budget, BudgetCategory, Notification, GlobalTime, Payee } from './types';
import { format, addMonths, addYears, differenceInDays } from 'date-fns';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc, writeBatch, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { allJobs } from '@/app/dashboard/jobs/page';
import { allCourses } from '@/app/dashboard/education/page';
import { allProperties } from '@/app/dashboard/housing/page';


const usersCollection = collection(db, 'users');
const notificationsCollection = collection(db, 'notifications');
const simulationCollection = collection(db, 'simulation');

// --- Global Time Functions ---

const timeDocRef = doc(simulationCollection, 'time');

export async function getGlobalTime(): Promise<Date> {
    try {
        const docSnap = await getDoc(timeDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data() as GlobalTime;
            return new Date(data.currentDate);
        } else {
            // If time doc doesn't exist, create it with the start date
            const startDate = new Date('1900-01-01T00:00:00Z');
            await setDoc(timeDocRef, { currentDate: startDate.toISOString() });
            return startDate;
        }
    } catch (error) {
        console.error("Error getting global time:", error);
        return new Date('1900-01-01T00:00:00Z'); // Fallback
    }
}

export async function updateGlobalTime(newDate: Date) {
    try {
        await setDoc(timeDocRef, { currentDate: newDate.toISOString() });
    } catch (error) {
        console.error("Error updating global time:", error);
    }
}


export async function initializeAdminUser() {
    const adminDocRef = doc(db, 'users', 'admin-user-id');
    const adminDoc = await getDoc(adminDocRef);

    if (!adminDoc.exists()) {
        const adminUser: User = {
            id: 'admin-user-id',
            username: 'testadmin',
            email: 'admin@bank.com',
            accountNumber: '0000000000',
            password: 'password123',
            balances: { USD: 1e12, NGN: 1e12, EUR: 1e12 },
            card: {
              number: '4242 4242 4242 4242',
              expiry: '12/28',
              cvv: '123',
            },
            crypto: {
              BTC: 1e6,
              LTC: 1e6,
              XRP: 1e9,
              DOGE: 1e12,
              ETH: 1e6,
              GMZ: 1e12,
            },
            stakes: [],
            transactions: [],
            payees: [],
            budgets: [],
            goals: [],
            recurringExpenses: [],
            properties: [],
            loans: [],
            jobId: null,
            education: [],
            lastLogin: new Date().toISOString(),
            lastSalaryDate: new Date().toISOString(),
            lastMiscellaneousFeeDate: new Date().toISOString(),
            feesCollected: 0,
        };
        await setDoc(adminDocRef, adminUser);
    }
}

// Ensure admin is initialized
initializeAdminUser();


export async function getAllUsers(): Promise<User[]> {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => doc.data() as User);
}

export async function getUser(username: string): Promise<User | undefined> {
  const q = query(usersCollection, where("username", "==", username));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
      return undefined;
  }
  return snapshot.docs[0].data() as User;
}

export async function getUserByAccountNumber(accountNumber: string): Promise<User | undefined> {
    const q = query(usersCollection, where("accountNumber", "==", accountNumber));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return undefined;
    }
    return snapshot.docs[0].data() as User;
}


export async function updateUser(updatedUser: User): Promise<boolean> {
  if (!updatedUser.id) return false;
  const userDocRef = doc(db, 'users', updatedUser.id);
  try {
    // Deep copy to avoid Firestore issues with undefined values
    const userToSave = JSON.parse(JSON.stringify(updatedUser));
    await setDoc(userDocRef, userToSave, { merge: true });
    return true;
  } catch (error) {
      console.error("Error updating user:", error);
      return false;
  }
}

/**
 * Adds a transaction to a user object. This function now MUTATES the user object directly.
 * It is the caller's responsibility to save the updated user object to Firestore.
 * Returns the newly created transaction object.
 */
export function addTransaction(user: User, transaction: Omit<Transaction, 'id' | 'timestamp'>, transactionDate?: Date): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      timestamp: (transactionDate || new Date()).toISOString(),
    };
    
    if (!user.transactions) user.transactions = [];
    user.transactions.push(newTransaction);
    if (user.transactions.length > 200) {
      user.transactions.shift();
    }

    const outgoingTypes: Transaction['type'][] = ['withdrawal', 'crypto_sell', 'staking_lock', 'fee', 'expense', 'loan_repayment'];
    const isOutgoing = outgoingTypes.includes(transaction.type) || (transaction.type === 'transfer' && transaction.description.startsWith('Transfer to'));

    if (transaction.category && isOutgoing) {
        const monthStr = format(transactionDate || new Date(), 'yyyy-MM');
        if (!user.budgets) user.budgets = [];
        let budget = user.budgets.find(b => b.month === monthStr && b.category === transaction.category);
        if (!budget) {
            budget = { id: crypto.randomUUID(), category: transaction.category, month: monthStr, amount: 0, spent: 0 };
            user.budgets.push(budget);
        }
        budget.spent += transaction.amount;
    }

    return newTransaction;
}


export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    await addDoc(notificationsCollection, {
        ...notification,
        createdAt: serverTimestamp(),
        read: false,
    });
}

export function formatCurrency(amount: number, currency: AllCoins = 'USD') {
    if (typeof amount !== 'number') {
        amount = 0;
    }
    if (['BTC', 'ETH', 'LTC'].includes(currency)) {
        return `${amount.toFixed(6)} ${currency}`;
    }
    if (['XRP', 'DOGE', 'GMZ'].includes(currency)) {
        return `${amount.toFixed(2)} ${currency}`;
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency as FiatCoin,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

export async function generateAccountNumber(): Promise<string> {
    let newAccountNumber;
    let existingUser;
    do {
        newAccountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        existingUser = await getUserByAccountNumber(newAccountNumber);
    } while (existingUser);
    return newAccountNumber;
}

export function getCurrentMonthBudgets(user: User): Budget[] {
    const currentMonth = format(new Date(), 'yyyy-MM');
    const allCategories: BudgetCategory[] = ['Food', 'Transport', 'Shopping', 'Entertainment', 'Housing', 'Utilities', 'Loans', 'Other'];
    const userBudgets = (user.budgets || []).filter(b => b.month === currentMonth);
    
    for (const category of allCategories) {
        if (!userBudgets.some(b => b.category === category)) {
            userBudgets.push({
                id: crypto.randomUUID(),
                category,
                amount: 0,
                spent: 0,
                month: currentMonth,
            });
        }
    }
    return userBudgets;
}

async function addFeeToAdmin(feeAmount: number, description: string, transactionDate: Date) {
    const adminRef = doc(db, "users", 'admin-user-id');
    try {
        await runTransaction(db, async (transaction) => {
            const adminDoc = await transaction.get(adminRef);
            if (!adminDoc.exists()) {
                throw "Admin user does not exist!";
            }
            const adminData = adminDoc.data() as User;
            const newFeesCollected = (adminData.feesCollected || 0) + feeAmount;

            // We don't add to the main balance here, just to the feesCollected pot.
            transaction.update(adminRef, { feesCollected: newFeesCollected });
            
            // Still log the transaction for record-keeping if needed, but it's an internal admin log.
            // This could be stored in a separate collection in a real app.
        });
    } catch (e) {
        console.error("Admin fee transaction failed: ", e);
    }
}


export async function processRecurringPayments(user: User, now: Date): Promise<{ updatedUser: User; userWasModified: boolean }> {
    let userModified = false;
    const updatedUser = JSON.parse(JSON.stringify(user)); // Deep copy to avoid mutation issues
    updatedUser.lastLogin = now.toISOString();
    
    if(!updatedUser.education) updatedUser.education = [];

    // --- Process Education ---
    const inProgressEducation = updatedUser.education.filter(e => e.status === 'in-progress');
    inProgressEducation.forEach(edu => {
        const course = allCourses.find(c => c.id === edu.courseId);
        if (course) {
            const enrollmentDate = new Date(edu.enrollmentDate);
            const daysPassed = differenceInDays(now, enrollmentDate);
            if(daysPassed >= course.durationDays) {
                edu.status = 'completed';
                userModified = true;
            }
        }
    });


    // --- Process Recurring Expenses & Loan Repayments ---
    const allRecurring = [
        ...(updatedUser.recurringExpenses || []), 
        ...(updatedUser.loans || []).map(loan => ({
            id: `loan-${loan.id}`,
            name: `${loan.name} Repayment`,
            amount: loan.monthlyPayment,
            currency: 'USD' as FiatCoin,
            category: 'Loans' as BudgetCategory,
            nextDueDate: loan.nextPaymentDate,
            interval: 'monthly' as 'monthly' | 'annually'
        }))
    ];

    allRecurring.forEach(expense => {
        let dueDate = new Date(expense.nextDueDate);
        while (new Date(now) >= dueDate) {
            const amount = expense.amount;
            if (updatedUser.balances.USD >= amount) {
                updatedUser.balances.USD -= amount;
                
                if ('interestRate' in expense) { 
                    const loan = updatedUser.loans.find(l => `loan-${l.id}` === expense.id);
                    if (loan) {
                        loan.remainingBalance -= amount;
                        loan.nextPaymentDate = addMonths(new Date(loan.nextPaymentDate), 1).toISOString();
                    }
                } else {
                    const recurringExpense = updatedUser.recurringExpenses.find(e => e.id === expense.id);
                    if(recurringExpense) {
                        const nextDate = recurringExpense.interval === 'monthly' 
                            ? addMonths(new Date(recurringExpense.nextDueDate), 1) 
                            : addYears(new Date(recurringExpense.nextDueDate), 1);
                        recurringExpense.nextDueDate = nextDate.toISOString();
                    }
                }
                userModified = true;
                dueDate = 'interestRate' in expense 
                    ? addMonths(dueDate, 1) 
                    : (expense.interval === 'monthly' ? addMonths(dueDate, 1) : addYears(dueDate, 1));
            } else {
                break;
            }
        }
    });

    // --- Process Salary ---
    const job = allJobs.find(j => j.id === updatedUser.jobId);
    if(job) {
        let lastSalaryDate = new Date(updatedUser.lastSalaryDate);
        let nextSalaryDate = new Date(lastSalaryDate.getFullYear(), lastSalaryDate.getMonth() + 1, 1);

        while(new Date(now) >= nextSalaryDate) {
            const monthlySalary = job.salary / 12;
            const salaryVAT = monthlySalary * 0.02;
            const netSalary = monthlySalary - salaryVAT;

            updatedUser.balances.USD += netSalary;
            addTransaction(updatedUser, {
                type: 'salary',
                amount: netSalary,
                currency: 'USD',
                description: `Monthly Salary: ${job.title}`,
            }, nextSalaryDate);

            addTransaction(updatedUser, {
                type: 'fee',
                amount: salaryVAT,
                currency: 'USD',
                description: '2% VAT on Salary',
            }, nextSalaryDate);

            await addFeeToAdmin(salaryVAT, `2% salary VAT from ${updatedUser.username}`, nextSalaryDate);

            userModified = true;

            updatedUser.lastSalaryDate = nextSalaryDate.toISOString();
            lastSalaryDate = nextSalaryDate;
            nextSalaryDate = new Date(lastSalaryDate.getFullYear(), lastSalaryDate.getMonth() + 1, 1);
        }
    }
    
    // --- Process Miscellaneous Yearly Fee ---
    if (!updatedUser.lastMiscellaneousFeeDate) {
        updatedUser.lastMiscellaneousFeeDate = updatedUser.lastLogin;
    }
    let lastFeeDate = new Date(updatedUser.lastMiscellaneousFeeDate);
    let nextFeeDate = addYears(lastFeeDate, 10); // Changed to 10 years
    
    while(new Date(now) >= nextFeeDate) {
        const feeAmount = 10;
        
        // This fee is mandatory and will be deducted even if it results in a negative balance.
        updatedUser.balances.USD -= feeAmount;
        
        addTransaction(updatedUser, {
            type: 'fee',
            amount: feeAmount,
            currency: 'USD',
            description: 'Miscellaneous Fee',
        }, nextFeeDate);

        await addFeeToAdmin(feeAmount, `Miscellaneous Fee from ${updatedUser.username}`, nextFeeDate);
        userModified = true;

        updatedUser.lastMiscellaneousFeeDate = nextFeeDate.toISOString();
        lastFeeDate = nextFeeDate;
        nextFeeDate = addYears(lastFeeDate, 10); // Check for the next 10-year interval
    }


    if (userModified) {
        // We only save the user document here. Admin is updated in its own transaction.
        await updateUser(updatedUser);
        return { updatedUser, userWasModified: true };
    }
    return { updatedUser, userWasModified: false };
}

export const calculateNetWorth = (user: User) => {
    let totalNetWorth = 0;

    // Simplified price list for net worth calculation. In a real app, this would be live data.
    const prices: Record<string, number> = {
        USD: 1, NGN: 1 / 1500, EUR: 1.08,
        BTC: 65000, ETH: 3500, LTC: 80, XRP: 0.5, DOGE: 0.15, GMZ: 0.015,
    };

    // Fiat
    for (const [currency, balance] of Object.entries(user.balances)) {
        totalNetWorth += balance * (prices[currency] || 0);
    }
    // Crypto
    for (const [currency, balance] of Object.entries(user.crypto)) {
        totalNetWorth += balance * (prices[currency] || 0);
    }
    // Properties (Owned only)
    (user.properties || [])
        .filter(p => p.ownershipType === 'buy')
        .forEach(p => {
            const propertyDetails = allProperties.find(prop => prop.id === p.propertyId);
            if (propertyDetails) {
                totalNetWorth += propertyDetails.buyPrice; // Using buy price as current market value for simplicity
            }
        });

    // Liabilities (Loans)
    (user.loans || []).forEach(loan => {
        totalNetWorth -= loan.remainingBalance;
    });
    
    return totalNetWorth;
}
