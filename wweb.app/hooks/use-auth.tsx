

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, updateUser, generateAccountNumber, initializeAdminUser, processRecurringPayments } from '@/lib/storage';
import type { User } from '@/lib/types';
import { useTime } from './use-time';
import { useToast } from './use-toast';
import { FirebaseError } from 'firebase/app';

const CURRENT_USER_KEY = 'gameztarz_currentUser';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string) => Promise<boolean>;
  updateUserContext: (updatedUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { currentDate } = useTime();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
        try {
          await initializeAdminUser(); // Ensure admin user exists
          const savedUsername = localStorage.getItem(CURRENT_USER_KEY);
          if (savedUsername) {
            const foundUser = await getUser(savedUsername);
            setUser(foundUser || null);
          }
        } catch (error) {
          console.error("Failed to initialize auth state:", error);
        }
        setLoading(false);
    }
    checkUser();
  }, []);

  // Effect for recurring payments
  useEffect(() => {
      const runRecurringPayments = async () => {
          if(user && !loading) {
            const { updatedUser, userWasModified } = await processRecurringPayments(user, currentDate);
            if (userWasModified) {
              setUser(updatedUser);
            }
          }
      }
      runRecurringPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, user?.id, loading]);


  const login = async (username: string, password_provided: string): Promise<boolean> => {
    try {
      const foundUser = await getUser(username);
      if (foundUser && foundUser.password === password_provided) {
        localStorage.setItem(CURRENT_USER_KEY, username);
        const { updatedUser } = await processRecurringPayments(foundUser, currentDate);
        setUser(updatedUser || foundUser);
        return true;
      }
      return false;
    } catch (error) {
        console.error("Login Error:", error);
        if (error instanceof FirebaseError && error.code.includes('offline')) {
            toast({
                title: 'Firestore Not Enabled or Rules Issue',
                description: 'Please go to the Firebase Console, create a Firestore database in Production mode, and set security rules to allow reads/writes.',
                variant: 'destructive',
                duration: 10000,
            });
        } else {
            toast({
                title: 'Login Error',
                description: 'An unexpected error occurred. Please check the console.',
                variant: 'destructive',
            });
        }
        return false;
    }
  };

  const register = async (username: string, password_provided: string): Promise<boolean> => {
    try {
        const existingUser = await getUser(username);
        if (existingUser) {
            toast({ title: 'Registration Failed', description: 'Username already exists.', variant: 'destructive'});
            return false;
        }
        
        const newAccountNumber = await generateAccountNumber();

        const newUser: User = {
          id: crypto.randomUUID(),
          username,
          email: `${username}@gameztarz.com`,
          password: password_provided,
          accountNumber: newAccountNumber,
          balances: { USD: 1000, NGN: 0, EUR: 0 },
          card: {
            number: Array(4).fill(0).map(() => Math.floor(1000 + Math.random() * 9000)).join(' '),
            expiry: `${String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')}/${new Date().getFullYear() % 100 + 5}`,
            cvv: Math.floor(100 + Math.random() * 900).toString(),
          },
          crypto: { BTC: 0, ETH: 0, GMZ: 0, DOGE: 0, LTC: 0, XRP: 0 },
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
          lastLogin: currentDate.toISOString(),
          lastSalaryDate: currentDate.toISOString(),
          lastMiscellaneousFeeDate: currentDate.toISOString(),
        };
        
        const success = await updateUser(newUser);

        if (success) {
            localStorage.setItem(CURRENT_USER_KEY, username);
            setUser(newUser);
            return true;
        }
        return false;
    } catch (error) {
        console.error("Registration Error:", error);
        if (error instanceof FirebaseError && error.code.includes('offline')) {
             toast({
                title: 'Firestore Not Enabled or Rules Issue',
                description: 'Please go to the Firebase Console, create a Firestore database in Production mode, and set security rules to allow reads/writes.',
                variant: 'destructive',
                duration: 10000,
            });
        } else {
            toast({
                title: 'Registration Error',
                description: 'An unexpected error occurred. Please check the console.',
                variant: 'destructive',
            });
        }
        return false;
    }
  };

  const logout = async () => {
    // Save any pending changes on logout
    if (user) {
        const { updatedUser } = await processRecurringPayments(user, currentDate);
        await updateUser(updatedUser || user);
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
    router.push('/');
  };

  const updateUserContext = async (updatedUserData: User) => {
    setUser(updatedUserData);
    await updateUser(updatedUserData);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
