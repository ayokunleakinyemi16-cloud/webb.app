
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

type AuthFormProps = {
  mode: 'login' | 'register';
};

function GameztarzIcon() {
    return (
        <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-12 w-12 text-primary"
        >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
    )
}

export function AuthForm({ mode }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, register } = useAuth();
  const { toast } = useToast();

  const currentSchema = mode === 'login' ? loginSchema : registerSchema;

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      username: '',
      password: '',
      ...(mode === 'register' && {}),
    },
  });

  async function onSubmit(values: z.infer<typeof currentSchema>) {
    setIsLoading(true);
    try {
      if (mode === 'login') {
        const success = await login(values.username, values.password);
        if (success) {
          router.push('/dashboard');
        } else {
          toast({
            title: 'Login Failed',
            description: 'Invalid username or password.',
            variant: 'destructive',
          });
        }
      } else {
        const {username, password} = values as z.infer<typeof registerSchema>;
        const success = await register(username, password);
        if (success) {
          toast({
            title: 'Registration Successful',
            description: 'Welcome to Gameztarz Banking!',
          });
          router.push('/dashboard');
        } else {
          toast({
            title: 'Registration Failed',
            description: 'Username already exists.',
            variant: 'destructive',
          });
        }
      }
    } finally {
        setIsLoading(false);
    }
  }

  return (
      <>
        <div className="mb-6 flex flex-col items-center text-center">
            <GameztarzIcon />
            <h1 className="mt-4 text-3xl font-bold text-primary">Gameztarz Banking</h1>
        </div>
        <Card className="w-full max-w-sm border-primary/20 bg-card/60 shadow-lg shadow-primary/10 backdrop-blur-lg">
            <CardHeader>
                <CardTitle>{mode === 'login' ? 'Welcome Back' : 'Create an Account'}</CardTitle>
                <CardDescription>
                    {mode === 'login'
                    ? 'Enter your credentials to access your account.'
                    : 'Fill in the details to join Gameztarz.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                <Input placeholder="your_username" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'login' ? 'Login' : 'Sign Up'}
                        </Button>
                    </form>
                </Form>
                <div className="mt-4 text-center text-sm">
                    {mode === 'login' ? (
                    <>
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="font-semibold text-primary hover:underline">
                        Sign up
                        </Link>
                    </>
                    ) : (
                    <>
                        Already have an account?{' '}
                        <Link href="/" className="font-semibold text-primary hover:underline">
                        Log in
                        </Link>
                    </>
                    )}
                </div>
            </CardContent>
        </Card>
      </>
  );
}
