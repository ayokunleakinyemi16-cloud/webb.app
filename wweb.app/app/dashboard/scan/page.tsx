'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import jsQR from 'jsqr';

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };

    getCameraPermission();

    return () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast]);

  useEffect(() => {
    if (!hasCameraPermission) return;

    let animationFrameId: number;

    const scanQrCode = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        
        if (context) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code) {
            try {
              const data = JSON.parse(code.data);
              if (data.accountNumber && data.amount !== undefined && data.currency) {
                  const query = new URLSearchParams(data).toString();
                  router.replace(`/dashboard/transfer?${query}`);
                  return; // Stop scanning
              }
            } catch (e) {
                // Not a valid JSON QR code, ignore
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(scanQrCode);
    };

    animationFrameId = requestAnimationFrame(scanQrCode);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hasCameraPermission, router]);

  return (
    <main>
      <div className="p-4 md:p-6">
        <Card className="max-w-md mx-auto shadow-lg shadow-primary/5">
          <CardHeader>
            <CardTitle>Scan QR Code</CardTitle>
            <CardDescription>Point your camera at a Gameztarz QR code to send funds.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-square w-full rounded-md border-4 border-primary overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                {hasCameraPermission === false && (
                    <div className="absolute inset-0 bg-background flex items-center justify-center">
                        <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access to use this feature.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
