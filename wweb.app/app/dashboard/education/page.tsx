
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addTransaction, formatCurrency, updateUser, getUserByAccountNumber } from '@/lib/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle } from 'lucide-react';
import type { EducationCourse } from '@/lib/types';
import { useTime } from '@/hooks/use-time';
import { differenceInDays, formatDistanceToNowStrict } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, runTransaction } from 'firebase/firestore';

export const allCourses: EducationCourse[] = [
  { id: 'edu1', title: 'High School Diploma', cost: 5000, durationDays: 365 * 4, description: 'The foundational education required for many entry-level jobs.' },
  { id: 'edu2', title: 'Bachelor\'s in Business', cost: 40000, durationDays: 365 * 4, description: 'Learn the fundamentals of business administration, finance, and marketing.' },
  { id: 'edu3', title: 'Bachelor\'s in CS', cost: 55000, durationDays: 365 * 4, description: 'Dive deep into software development, algorithms, and data structures.' },
  { id: 'edu4', title: 'Medical Doctorate', cost: 300000, durationDays: 365 * 8, description: 'An intensive program to become a licensed medical doctor.' },
  { id: 'edu5', title: 'Graphic Design Certificate', cost: 10000, durationDays: 365, description: 'Master visual design principles and software for a creative career.' },
  { id: 'edu6', title: 'Accounting Certification (CPA)', cost: 15000, durationDays: 365 * 2, description: 'Prepare for the Certified Public Accountant exam.' },
];

async function addFeeToAdmin(feeAmount: number, description: string) {
    const adminRef = doc(db, "users", 'admin-user-id');
    try {
        await runTransaction(db, async (transaction) => {
            const adminDoc = await transaction.get(adminRef);
            if (!adminDoc.exists()) {
                throw "Admin user does not exist!";
            }
            const adminData = adminDoc.data() as User;
            const newFeesCollected = (adminData.feesCollected || 0) + feeAmount;
            transaction.update(adminRef, { feesCollected: newFeesCollected });
        });
    } catch (e) {
        console.error("Admin fee transaction failed: ", e);
    }
}


export default function EducationPage() {
  const { user, updateUserContext } = useAuth();
  const { toast } = useToast();
  const { currentDate } = useTime();

  if (!user) return null;

  const handleEnroll = async (course: EducationCourse) => {
    const tuitionFee = course.cost;

    if (user.balances.USD < tuitionFee) {
        toast({ title: 'Error', description: 'Insufficient funds for tuition.', variant: 'destructive'});
        return;
    }
    if ((user.education || []).some(e => e.courseId === course.id)) {
        toast({ title: 'Error', description: 'You are already enrolled in or have completed this course.', variant: 'destructive'});
        return;
    }

    const updatedUser = { ...user };
    updatedUser.balances.USD -= tuitionFee;
    
    if (!updatedUser.education) updatedUser.education = [];

    updatedUser.education.push({
        courseId: course.id,
        enrollmentDate: currentDate.toISOString(),
        status: 'in-progress',
    });

    addTransaction(updatedUser, {
        type: 'expense',
        amount: tuitionFee,
        currency: 'USD',
        description: `Tuition fee for ${course.title}`,
        category: 'Other',
    });
    
    await addFeeToAdmin(tuitionFee, `Tuition fee from ${user.username} for ${course.title}`);

    await updateUserContext(updatedUser);

    toast({ title: 'Enrolled!', description: `You have successfully enrolled in ${course.title}.` });
  };
  
  const userEducation = user.education || [];

  return (
    <main className="p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Education & Career Development</CardTitle>
          <CardDescription>Invest in your future by enrolling in courses to unlock better job opportunities.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCourses.map(course => {
            const enrollment = userEducation.find(e => e.courseId === course.id);
            const isCompleted = enrollment?.status === 'completed';
            
            let progress = 0;
            let remainingTime = '';
            if (enrollment && enrollment.status === 'in-progress') {
                const enrollmentDate = new Date(enrollment.enrollmentDate);
                const daysPassed = differenceInDays(currentDate, enrollmentDate);
                progress = Math.min(100, (daysPassed / course.durationDays) * 100);

                if(progress < 100) {
                    const endDate = new Date(enrollmentDate.getTime());
                    endDate.setDate(endDate.getDate() + course.durationDays);
                    remainingTime = formatDistanceToNowStrict(endDate, { unit: 'day' });
                }
            }


            const isEnrolled = !!enrollment;

            return (
                <Card key={course.id} className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        {course.title}
                    </CardTitle>
                    <CardDescription>{formatCurrency(course.cost, 'USD')}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{course.description}</p>
                    <p className="text-sm font-semibold mt-2">Duration: {Math.round(course.durationDays / 365)} years</p>
                </CardContent>
                <CardFooter>
                    {isCompleted ? (
                         <Button className="w-full" disabled variant="outline">
                            <CheckCircle className="mr-2 h-4 w-4" /> Completed
                        </Button>
                    ) : isEnrolled ? (
                        <div className="w-full">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>In Progress</span>
                                <span>{remainingTime} left</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    ) : (
                        <Button className="w-full" onClick={() => handleEnroll(course)}>
                            Enroll Now
                        </Button>
                    )}
                </CardFooter>
                </Card>
            )
          })}
        </CardContent>
      </Card>
    </main>
  );
}
