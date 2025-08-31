'use server';
/**
 * @fileOverview A crypto investment advisor AI agent.
 *
 * - getCryptoAdvice - A function that returns crypto investment advice.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const CryptoAdvisorInputSchema = z.object({});
export type CryptoAdvisorInput = z.infer<typeof CryptoAdvisorInputSchema>;

const CryptoAdvisorOutputSchema = z.string();
export type CryptoAdvisorOutput = z.infer<typeof CryptoAdvisorOutputSchema>;

export async function getCryptoAdvice(input?: CryptoAdvisorInput): Promise<CryptoAdvisorOutput> {
  return cryptoAdvisorFlow(input || {});
}

const prompt = ai.definePrompt({
  name: 'cryptoAdvisorPrompt',
  input: {schema: CryptoAdvisorInputSchema},
  output: {schema: CryptoAdvisorOutputSchema},
  prompt: `You are an expert financial analyst specializing in cryptocurrency investments. 
  
  Your task is to provide a concise, insightful, and balanced analysis of the current crypto market. You should highlight 1-2 promising cryptocurrencies and provide a brief rationale for why they might be a good investment. You must also mention 1-2 cryptocurrencies that might be considered higher-risk or more speculative.

  Structure your response as follows:
  1.  **Market Overview:** A brief, 2-3 sentence summary of the current market sentiment (e.g., bullish, bearish, consolidating).
  2.  **Promising Picks:**
      *   **Coin 1 (e.g., Bitcoin - BTC):** Briefly explain its current position, recent developments, and potential for growth.
      *   **Coin 2 (e.g., Ethereum - ETH):** Briefly explain its current position, recent developments, and potential for growth.
  3.  **Speculative Watch:**
      *   **Coin 3 (e.g., Dogecoin - DOGE):** Briefly explain why it is considered speculative or high-risk.
  4.  **Concluding Thought:** A final sentence of encouragement or a forward-looking statement.

  Do not include a disclaimer in your response. The application UI will handle that.
  Keep your entire response under 200 words.
  `,
});

const cryptoAdvisorFlow = ai.defineFlow(
  {
    name: 'cryptoAdvisorFlow',
    inputSchema: CryptoAdvisorInputSchema,
    outputSchema: CryptoAdvisorOutputSchema,
  },
  async () => {
    const {output} = await prompt({});
    return output!;
  }
);
