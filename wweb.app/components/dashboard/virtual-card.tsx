
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

function GameztarzIcon({ className }: { className?: string }) {
    return (
        <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("h-8 w-8", className)}
        >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
    )
}


export function VirtualCard() {
  const { user } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const { toast } = useToast();

  if (!user) return null;
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${text} copied to clipboard.` });
  };

  return (
    <div
      className="group w-full max-w-lg cursor-pointer [perspective:1000px]"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={cn(
          'relative h-60 w-full rounded-xl shadow-xl transition-transform duration-700 [transform-style:preserve-3d]',
          isFlipped && '[transform:rotateY(180deg)]'
        )}
      >
        {/* Card Front */}
        <div className="absolute inset-0 h-full w-full rounded-xl bg-gradient-to-br from-primary/80 via-teal-400 to-green-500 p-6 text-primary-foreground [backface-visibility:hidden]">
          <div className="flex justify-between items-start">
            <div className='flex flex-col'>
                <GameztarzIcon className="h-10 w-10" />
                <p className="text-2xl font-bold mt-1 text-white">Gameztarz</p>
            </div>
            <img src="https://img.icons8.com/plasticine/100/sim-card-chip.png" alt="Card Chip" className="w-16 h-16 -mt-2"/>
          </div>
          <div className="mt-4">
            <p className="text-xl md:text-2xl font-mono tracking-widest text-white/90">{user.card.number}</p>
          </div>
          <div className="mt-4 flex justify-between items-end">
            <div>
              <p className="text-xs">Account Holder</p>
              <p className="font-medium font-mono text-white">{user.username}</p>
               <div className='flex items-center gap-2 mt-1'>
                <p className="font-mono text-xs sm:text-sm text-white/90">{user.accountNumber}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white" onClick={(e) => { e.stopPropagation(); handleCopy(user.accountNumber);}}>
                    <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs">VALID THRU</p>
              <p className="font-medium text-white">{user.card.expiry}</p>
            </div>
          </div>
        </div>

        {/* Card Back */}
        <div className="absolute inset-0 h-full w-full rounded-xl bg-gradient-to-br from-primary/80 via-teal-400 to-green-500 p-6 [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <div className='w-full h-4'/>
            <div className="h-12 w-full bg-black mt-4"></div>
            <div className="mt-4 flex items-center gap-4">
                <div className="h-10 flex-1 rounded bg-gray-200 p-2 text-right font-mono text-black">
                    {user.card.cvv}
                </div>
                <p className="text-sm text-white">CVV</p>
            </div>
            <p className="mt-4 text-xs text-center text-white/70">
                This card is the property of Gameztarz Banking. If found, please do not use and report to our support.
            </p>
        </div>
      </div>
    </div>
  );
}
