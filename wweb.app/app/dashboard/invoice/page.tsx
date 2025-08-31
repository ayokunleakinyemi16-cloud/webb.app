
'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { generateInvoice } from '@/ai/flows/invoice-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Printer, Sparkles, FileImage, FileText } from 'lucide-react';
import { Transaction } from '@/lib/types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function InvoiceGenerator() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTxId, setSelectedTxId] = useState('');
  const [invoice, setInvoice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const invoicePreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const recentTransactions = [...user.transactions].reverse().slice(0, 50);
      setTransactions(recentTransactions);
      const urlTxId = searchParams.get('transactionId');
      if (urlTxId) {
        setSelectedTxId(urlTxId);
      } else if (recentTransactions.length > 0) {
        setSelectedTxId(recentTransactions[0].id)
      }
    }
  }, [user, searchParams]);

  const handleGenerateInvoice = async () => {
    if (!user || !selectedTxId) {
        setError('Please select a transaction.');
        return;
    }

    const transaction = user.transactions.find(tx => tx.id === selectedTxId);
    if (!transaction) {
        setError('Selected transaction not found.');
        return;
    }

    setLoading(true);
    setError('');
    setInvoice('');

    try {
      const result = await generateInvoice({
          transaction,
          user,
      });
      setInvoice(result);
    } catch (e) {
      console.error(e);
      setError('Failed to generate invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrint = () => {
      if (invoicePreviewRef.current) {
        const printWindow = window.open('', '', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Invoice</title>');
            printWindow.document.write('<style>body { font-family: sans-serif; } .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, .15); font-size: 16px; line-height: 24px; color: #555; } h1, h2, h3 { margin: 0; } .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; } .header .company { font-size: 24px; font-weight: bold; } .details { margin-bottom: 50px; } .details table { width: 100%; } .details td { padding: 5px; } .details .label { font-weight: bold; } .items table { width: 100%; line-height: inherit; text-align: left; border-collapse: collapse; } .items table td { padding: 5px; vertical-align: top; } .items table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; } .items table tr.item td { border-bottom: 1px solid #eee; } .total { text-align: right; margin-top: 20px; font-weight: bold; } </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(invoicePreviewRef.current.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
        }
      }
  }

  const handleDownloadPdf = () => {
    if (invoicePreviewRef.current) {
        html2canvas(invoicePreviewRef.current).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`invoice-${selectedTxId}.pdf`);
        });
    }
  };

  const handleDownloadImage = () => {
    if (invoicePreviewRef.current) {
        html2canvas(invoicePreviewRef.current).then(canvas => {
            const link = document.createElement('a');
            link.download = `invoice-${selectedTxId}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
  };


  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-lg shadow-primary/5">
        <CardHeader>
          <CardTitle>Generate Invoice</CardTitle>
          <CardDescription>Select a transaction to generate an AI-powered invoice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Transaction</label>
            <Select value={selectedTxId} onValueChange={setSelectedTxId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a recent transaction" />
              </SelectTrigger>
              <SelectContent>
                {transactions.map(tx => (
                  <SelectItem key={tx.id} value={tx.id}>
                    {new Date(tx.timestamp).toLocaleDateString()} - {tx.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerateInvoice} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Invoice
          </Button>
           {invoice && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                 <Button onClick={handlePrint} variant="outline" className="w-full">
                    <Printer className="mr-2 h-4 w-4" /> Print
                 </Button>
                 <Button onClick={handleDownloadPdf} variant="outline" className="w-full">
                    <FileText className="mr-2 h-4 w-4" /> PDF
                 </Button>
                 <Button onClick={handleDownloadImage} variant="outline" className="w-full">
                    <FileImage className="mr-2 h-4 w-4" /> Image
                 </Button>
             </div>
           )}
        </CardContent>
      </Card>
      <Card className="shadow-lg shadow-primary/5 md:col-span-1">
        <CardHeader>
          <CardTitle>Invoice Preview</CardTitle>
          <CardDescription>Your generated invoice will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading && (
                <div className='flex items-center justify-center h-96'>
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            )}
            {error && <p className="text-destructive">{error}</p>}
            {invoice && (
              <div className="border rounded-md overflow-hidden">
                <div ref={invoicePreviewRef} dangerouslySetInnerHTML={{ __html: invoice }} />
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function InvoicePage() {
    return (
        <main className="p-4 md:p-6">
            <Suspense fallback={<div>Loading...</div>}>
                <InvoiceGenerator />
            </Suspense>
        </main>
    )
}
