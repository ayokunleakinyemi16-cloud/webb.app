
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { allJobs } from '../jobs/page';
import { allCourses } from '../education/page';
import { formatCurrency, calculateNetWorth } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Briefcase, GraduationCap, Wallet } from 'lucide-react';

const EXCEPTION_KEY = 'Gameztarz#2024';

export default function ProfilePage() {
    const { user, updateUserContext } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [netWorth, setNetWorth] = useState(0);
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            setNetWorth(calculateNetWorth(user));
        }
    }, [user]);

    if (!user) return null;

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword) {
            toast({ title: 'Error', description: 'Please fill both password fields.', variant: 'destructive'});
            return;
        }
        
        if (oldPassword !== user.password && oldPassword !== EXCEPTION_KEY) {
            toast({ title: 'Error', description: 'Old password is incorrect.', variant: 'destructive'});
            return;
        }

        const updatedUser = { ...user, password: newPassword };
        await updateUserContext(updatedUser);

        toast({ title: 'Success', description: 'Password updated successfully!'});
        setOldPassword('');
        setNewPassword('');
    };

    const currentJob = allJobs.find(j => j.id === user.jobId);
    const completedCourses = (user.education || []).filter(e => e.status === 'completed').map(e => allCourses.find(c => c.id === e.courseId)).filter(Boolean);

    return (
        <main>
            <div className="p-4 md:p-6">
                <Card className="mx-auto max-w-4xl">
                    <CardHeader>
                        <CardTitle>Your Profile</CardTitle>
                        <CardDescription>Your personal and financial snapshot.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                        {/* Left Column: Details */}
                        <div className='space-y-6'>
                            <div className='space-y-2'>
                                <Label>Username</Label>
                                <Input value={user.username} readOnly disabled/>
                            </div>
                             <div className='space-y-2'>
                                <Label>Email</Label>
                                <Input value={user.email} readOnly disabled/>
                            </div>
                             <div className='space-y-2'>
                                <Label>Account Number</Label>
                                <Input value={user.accountNumber} readOnly disabled/>
                            </div>
                            <div className="border-t pt-6 space-y-4">
                                <h3 className="text-lg font-semibold">Change Password</h3>
                                <div className='space-y-2'>
                                    <Label htmlFor="old-password">Old Password</Label>
                                    <Input id="old-password" type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Enter old password or override key" />
                                </div>
                                <div className='space-y-2'>
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
                                </div>
                                <Button onClick={handleChangePassword} className="w-full">Change Password</Button>
                            </div>
                        </div>

                        {/* Right Column: Financial & Career Summary */}
                        <div className='space-y-6'>
                             <Card className="bg-background/50">
                                <CardHeader>
                                     <CardTitle className='flex items-center gap-2 text-primary'><Wallet className="h-6 w-6" /> Net Worth</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-3xl font-bold">{formatCurrency(netWorth, 'USD')}</p>
                                    <p className="text-xs text-muted-foreground">This is an estimate of your total assets minus liabilities.</p>
                                </CardContent>
                            </Card>
                             <Card className="bg-background/50">
                                <CardHeader>
                                    <CardTitle className='flex items-center gap-2'><Briefcase className="h-6 w-6" /> Current Job</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {currentJob ? (
                                        <div>
                                            <p className="font-semibold text-lg">{currentJob.title}</p>
                                            <p className="text-muted-foreground">{formatCurrency(currentJob.salary, 'USD')} / year</p>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">Unemployed. Visit the Job Marketplace to find a job.</p>
                                    )}
                                </CardContent>
                            </Card>
                              <Card className="bg-background/50">
                                <CardHeader>
                                    <CardTitle className='flex items-center gap-2'><GraduationCap className="h-6 w-6" /> Qualifications</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {completedCourses.length > 0 ? (
                                        <div className='flex flex-wrap gap-2'>
                                            {completedCourses.map(course => (
                                                <Badge key={course!.id} variant="secondary">{course!.title}</Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">No qualifications yet. Visit the Education center to enroll in a course.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
