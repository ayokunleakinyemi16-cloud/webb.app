
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { addDays } from 'date-fns';
import { getGlobalTime, updateGlobalTime } from '@/lib/storage';

const START_DATE = new Date('1900-01-01T00:00:00Z');
const TIME_UPDATE_INTERVAL = 30000; // 30 seconds
const DAYS_PER_INTERVAL = 1; // 1 day

interface TimeContextType {
  currentDate: Date;
}

const TimeContext = createContext<TimeContextType>({
  currentDate: START_DATE,
});

export function TimeProvider({ children }: { children: ReactNode }) {
  const [currentDate, setCurrentDate] = useState<Date>(START_DATE);

  useEffect(() => {
    // This effect runs only once on the client to initialize and manage the global clock.
    // It designates one client as the "timekeeper" to prevent multiple clients from updating the time simultaneously.
    
    let isTimekeeper = false;
    const timekeeperId = `timekeeper_${Math.random()}`;

    const initializeClock = async () => {
        const initialTime = await getGlobalTime();
        setCurrentDate(initialTime || START_DATE);

        // Simple leader election: the first client tab to acquire the lock becomes the timekeeper.
        if (sessionStorage.getItem('timekeeper_lock') === null) {
            sessionStorage.setItem('timekeeper_lock', timekeeperId);
            isTimekeeper = true;
        }

        if (isTimekeeper) {
            const interval = setInterval(async () => {
                // Ensure this tab is still the timekeeper before updating
                if (sessionStorage.getItem('timekeeper_lock') === timekeeperId) {
                     setCurrentDate(prevDate => {
                        const newDate = addDays(prevDate, DAYS_PER_INTERVAL);
                        // Update the global time in Firestore
                        updateGlobalTime(newDate);
                        return newDate;
                    });
                } else {
                    // Another tab has taken over, stop this interval
                    clearInterval(interval);
                }
            }, TIME_UPDATE_INTERVAL);

             // Listen for when the tab is closed to release the lock
            window.addEventListener('beforeunload', () => {
                if (sessionStorage.getItem('timekeeper_lock') === timekeeperId) {
                    sessionStorage.removeItem('timekeeper_lock');
                }
            });

            return () => clearInterval(interval);
        } else {
            // If not the timekeeper, just listen for updates from other tabs via localStorage sync
             window.addEventListener('storage', (event) => {
                if (event.key === 'global_time_sync' && event.newValue) {
                    setCurrentDate(new Date(event.newValue));
                }
            });
        }
    };
    
    initializeClock();
    
  }, []);

  useEffect(() => {
      // This effect is for non-timekeeper tabs to get the latest time when it changes
      const syncTime = async () => {
          const time = await getGlobalTime();
          setCurrentDate(time);
          // Use localStorage to notify other tabs from the same browser
          localStorage.setItem('global_time_sync', time.toISOString());
      };
      syncTime();
  },[]);


  return (
    <TimeContext.Provider value={{ currentDate }}>
      {children}
    </TimeContext.Provider>
  );
}

export function useTime() {
  const context = useContext(TimeContext);
  if (!context) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
}
