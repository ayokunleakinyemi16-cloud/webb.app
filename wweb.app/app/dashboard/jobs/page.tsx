
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/storage';
import { Briefcase, CheckCircle, Lock } from 'lucide-react';
import type { Job } from '@/lib/types';
import { allCourses } from '../education/page';


export const allJobs: Job[] = [
  { id: 'job1', title: 'Software Engineer', salary: 120000, description: 'Build and maintain cutting-edge software applications for a leading tech company.', requiredEducation: 'edu3' },
  { id: 'job2', title: 'Graphic Designer', salary: 75000, description: 'Create stunning visuals for marketing campaigns, websites, and brand identities.', requiredEducation: 'edu5' },
  { id: 'job3', title: 'Doctor', salary: 250000, description: 'Provide medical care to patients in a busy hospital environment. Requires extensive education.', requiredEducation: 'edu4' },
  { id: 'job4', title: 'Teacher', salary: 60000, description: 'Educate and inspire the next generation of leaders in a public school system.', requiredEducation: 'edu1' },
  { id: 'job5', title: 'Marketing Manager', salary: 95000, description: 'Develop and execute marketing strategies to drive brand growth and customer acquisition.', requiredEducation: 'edu2' },
  { id: 'job6', title: 'Chef', salary: 80000, description: 'Lead a kitchen team to create exceptional culinary experiences in a high-end restaurant.', requiredEducation: 'edu1' },
  { id: 'job7', title: 'Accountant', salary: 85000, description: 'Manage financial records, prepare tax returns, and provide financial advice to clients.', requiredEducation: 'edu6' },
  { id: 'job8', title: 'Data Scientist', salary: 150000, description: 'Analyze complex data sets to uncover insights and drive business decisions.', requiredEducation: 'edu3' },
];

export default function JobsPage() {
  const { user, updateUserContext } = useAuth();
  const { toast } = useToast();

  if (!user) return null;

  const handleSelectJob = async (job: Job) => {
    const userEducationIds = (user.education || []).filter(e => e.status === 'completed').map(e => e.courseId);
    if (job.requiredEducation && !userEducationIds.includes(job.requiredEducation)) {
        toast({
            variant: 'destructive',
            title: 'Qualification Required',
            description: `You need a ${allCourses.find(c => c.id === job.requiredEducation)?.title} to apply for this job.`,
        });
        return;
    }

    const updatedUser = { ...user, jobId: job.id };
    await updateUserContext(updatedUser);
    toast({
      title: 'Congratulations!',
      description: `You've started your new job as a ${job.title}. Your first salary will be paid next month.`,
    });
  };
  
  const currentJob = allJobs.find(j => j.id === user.jobId);
  const userCompletedEducationIds = (user.education || []).filter(e => e.status === 'completed').map(e => e.courseId);

  return (
    <main className="p-4 md:p-6 space-y-6">
      {currentJob && (
        <Card className="shadow-lg shadow-primary/5 bg-gradient-to-r from-primary/10 to-background">
           <CardHeader>
            <CardTitle className='flex items-center gap-3'><CheckCircle className="text-green-400 h-8 w-8" /> Your Current Role</CardTitle>
            <CardDescription>This is your source of monthly income.</CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="text-2xl font-bold text-primary">{currentJob.title}</h3>
            <p className="text-lg font-semibold">{formatCurrency(currentJob.salary / 12, 'USD')} / month</p>
            <p className="text-muted-foreground mt-2">{currentJob.description}</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">To change jobs, simply select a new one from the list below.</p>
          </CardFooter>
        </Card>
      )}

      <Card className="shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Job Marketplace</CardTitle>
          <CardDescription>Select a job to start earning a monthly salary. Some jobs require specific educational qualifications.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allJobs.map(job => {
            const hasRequiredEducation = job.requiredEducation ? userCompletedEducationIds.includes(job.requiredEducation) : true;
            const requirement = allCourses.find(c => c.id === job.requiredEducation);

            return (
                <Card key={job.id} className="flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-primary" />
                        {job.title}
                    </CardTitle>
                    <CardDescription>{formatCurrency(job.salary, 'USD')} / year</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{job.description}</p>
                    {requirement && (
                        <p className={`text-xs mt-3 font-medium ${hasRequiredEducation ? 'text-green-400' : 'text-amber-400'}`}>
                           Requires: {requirement.title}
                        </p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button 
                        className="w-full" 
                        onClick={() => handleSelectJob(job)}
                        disabled={user.jobId === job.id || !hasRequiredEducation}
                    >
                    {user.jobId === job.id 
                        ? 'Currently Employed' 
                        : !hasRequiredEducation 
                            ? <><Lock className="mr-2 h-4 w-4" />Locked</>
                            : 'Apply Now'
                    }
                    </Button>
                </CardFooter>
                </Card>
            )
          })}
        </CardContent>
      </Card>
    </main>
  );
}
