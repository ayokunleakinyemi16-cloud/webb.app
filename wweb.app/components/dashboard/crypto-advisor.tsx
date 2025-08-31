'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { getCryptoAdvice } from '@/ai/flows/crypto-advisor-flow';

export function CryptoAdvisor() {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGetAdvice = async () => {
    setLoading(true);
    setError('');
    setAdvice('');
    try {
      const result = await getCryptoAdvice();
      setAdvice(result);
    } catch (e) {
      setError('An error occurred while fetching advice. Please try again.');
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <Card className="shadow-lg shadow-primary/5">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>AI Crypto Advisor</CardTitle>
            <CardDescription>Get AI-powered analysis on the crypto market.</CardDescription>
          </div>
          <Button onClick={handleGetAdvice} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Get Advice
          </Button>
        </div>
      </CardHeader>
      {advice && (
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Disclaimer</AlertTitle>
            <AlertDescription>
                This is not financial advice. The content is for informational purposes only. Always do your own research before investing.
            </AlertDescription>
          </Alert>
          <div className="mt-4 prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
            {advice}
          </div>
        </CardContent>
      )}
      {error && (
         <CardContent>
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
         </CardContent>
      )}
    </Card>
  );
}
