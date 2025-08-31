
'use server';
/**
 * @fileOverview An AI flow for generating HTML invoices from transaction data.
 *
 * - generateInvoice - A function that creates an invoice.
 * - GenerateInvoiceInput - The input type for the generateInvoice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Transaction, User } from '@/lib/types';
import { formatCurrency } from '@/lib/storage';

const TransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['deposit', 'withdrawal', 'transfer', 'crypto_buy', 'crypto_sell', 'staking_reward', 'staking_lock', 'fee', 'expense', 'loan_repayment', 'loan_disbursement', 'salary']),
  amount: z.number(),
  currency: z.string(),
  timestamp: z.string(),
  description: z.string(),
  category: z.string().optional(),
});

const UserSchema = z.object({
  username: z.string(),
  email: z.string(),
  accountNumber: z.string(),
});

export const GenerateInvoiceInputSchema = z.object({
  transaction: TransactionSchema,
  user: UserSchema,
});
export type GenerateInvoiceInput = z.infer<typeof GenerateInvoiceInputSchema>;

export async function generateInvoice(input: GenerateInvoiceInput): Promise<string> {
  return invoiceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'invoicePrompt',
  input: { schema: GenerateInvoiceInputSchema },
  output: { schema: z.string().describe('A complete HTML document for the invoice.') },
  template: {
      format: 'handlebars',
      helpers: {
          formatDate: (timestamp: string) => new Date(timestamp).toLocaleDateString(),
          formatAmount: (amount: number, currency: any) => formatCurrency(amount, currency),
      }
  },
  prompt: `
    You are an expert invoice generator. Your task is to create a professional HTML invoice based on the provided transaction and user data.

    **Invoice Details:**
    - **From:** Gameztarz Banking, 123 Finance St, Money City, USA
    - **To:** {{{user.username}}}, {{{user.email}}}, Account: {{{user.accountNumber}}}
    - **Invoice ID:** TX-{{{transaction.id}}}
    - **Date:** {{formatDate transaction.timestamp}}

    **Transaction Item:**
    - **Description:** {{{transaction.description}}}
    - **Category:** {{{transaction.category}}}
    - **Type:** {{{transaction.type}}}
    - **Amount:** {{formatAmount transaction.amount transaction.currency}}

    Generate a complete, self-contained HTML document for the invoice. Use the following template. Do not add any extra commentary.

    <div class="invoice-box">
        <div class="header">
            <div>
                <div class="company">Gameztarz Banking</div>
                <p>123 Finance St<br>Money City, USA</p>
            </div>
            <div>
                <h2>Invoice</h2>
                <p>
                    <strong>Invoice #:</strong> TX-{{{transaction.id}}}<br>
                    <strong>Date:</strong> {{formatDate transaction.timestamp}}
                </p>
            </div>
        </div>

        <div class="details">
            <table>
                <tr>
                    <td class="label">Bill To:</td>
                    <td>
                        {{{user.username}}}<br>
                        {{{user.email}}}<br>
                        Account: {{{user.accountNumber}}}
                    </td>
                </tr>
            </table>
        </div>

        <div class="items">
            <table>
                <tr class="heading">
                    <td>Description</td>
                    <td>Amount</td>
                </tr>
                <tr class="item">
                    <td>{{{transaction.description}}}</td>
                    <td>{{formatAmount transaction.amount transaction.currency}}</td>
                </tr>
                 <tr class="item">
                    <td>Transaction Type: {{{transaction.type}}}</td>
                    <td></td>
                </tr>
                {{#if transaction.category}}
                <tr class="item">
                    <td>Category: {{{transaction.category}}}</td>
                    <td></td>
                </tr>
                {{/if}}
                <tr class="heading">
                    <td>Total</td>
                    <td>{{formatAmount transaction.amount transaction.currency}}</td>
                </tr>
            </table>
        </div>
        <div class="total">
            Thank you for your business!
        </div>
    </div>
  `,
});

const invoiceFlow = ai.defineFlow(
  {
    name: 'invoiceFlow',
    inputSchema: GenerateInvoiceInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
