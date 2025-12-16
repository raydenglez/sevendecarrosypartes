import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Loader2, AlertCircle, Keyboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VehicleDetails {
  make: string;
  model: string;
  year: number;
  fuelType?: string;
  transmission?: string;
  vin: string;
}

interface VinScannerProps {
  open: boolean;
  onClose: () => void;
  onVehicleDetected: (details: VehicleDetails) => void;
}

interface NHTSAResult {
  Variable: string;
  Value: string | null;
}

export function VinScanner({ open, onClose, onVehicleDetected }: VinScannerProps) {
  const { t } = useTranslation();
  const [isScanning, setIsScanning] = useState(false);
  const [isDecoding, setIsDecoding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualVin, setManualVin] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && !showManualInput) {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [open, showManualInput]);

  const startScanner = async () => {
    setError(null);
    setIsScanning(true);

    try {
      const scanner = new Html5Qrcode('vin-scanner-container');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 100 },
          aspectRatio: 3,
        },
        async (decodedText) => {
          // VIN is 17 characters, alphanumeric (no I, O, Q)
          const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
          if (vinRegex.test(decodedText)) {
            await stopScanner();
            await decodeVin(decodedText.toUpperCase());
          }
        },
        () => {} // Ignore scan failures
      );
    } catch (err: any) {
      console.error('Scanner error:', err);
      setError(t('vinScanner.cameraError'));
      setIsScanning(false);
      setShowManualInput(true);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        // Scanner may already be stopped
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const decodeVin = async (vin: string) => {
    setIsDecoding(true);
    setError(null);

    try {
      const response = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`
      );
      
      if (!response.ok) {
        throw new Error(t('vinScanner.decodeError'));
      }

      const data = await response.json();
      const results: NHTSAResult[] = data.Results;

      const getValue = (variable: string): string | null => {
        const result = results.find(r => r.Variable === variable);
        return result?.Value || null;
      };

      const make = getValue('Make');
      const model = getValue('Model');
      const year = getValue('Model Year');
      const fuelType = getValue('Fuel Type - Primary');
      const transmission = getValue('Transmission Style');

      if (!make || !model || !year) {
        throw new Error(t('vinScanner.vehicleError'));
      }

      const vehicleDetails: VehicleDetails = {
        vin,
        make,
        model,
        year: parseInt(year),
        fuelType: mapFuelType(fuelType),
        transmission: mapTransmission(transmission),
      };

      toast.success(t('vinScanner.vehicleDetected'));
      onVehicleDetected(vehicleDetails);
      onClose();
    } catch (err: any) {
      console.error('VIN decode error:', err);
      setError(err.message || t('vinScanner.decodeError'));
      setIsDecoding(false);
      // Restart scanner for another attempt
      if (!showManualInput) {
        startScanner();
      }
    }
  };

  const mapFuelType = (nhtsa: string | null): string | undefined => {
    if (!nhtsa) return undefined;
    const lower = nhtsa.toLowerCase();
    if (lower.includes('gasoline')) return 'gasoline';
    if (lower.includes('diesel')) return 'diesel';
    if (lower.includes('electric')) return 'electric';
    if (lower.includes('hybrid')) return 'hybrid';
    return 'other';
  };

  const mapTransmission = (nhtsa: string | null): string | undefined => {
    if (!nhtsa) return undefined;
    const lower = nhtsa.toLowerCase();
    if (lower.includes('automatic')) return 'automatic';
    if (lower.includes('manual')) return 'manual';
    if (lower.includes('cvt')) return 'cvt';
    return undefined;
  };

  const handleManualSubmit = () => {
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
    if (!vinRegex.test(manualVin)) {
      setError(t('vinScanner.invalidVin'));
      return;
    }
    decodeVin(manualVin.toUpperCase());
  };

  const handleClose = async () => {
    await stopScanner();
    setShowManualInput(false);
    setManualVin('');
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border safe-top">
        <div className="flex items-center justify-between px-4 h-14">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">{t('vinScanner.title')}</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (showManualInput) {
                setShowManualInput(false);
                startScanner();
              } else {
                stopScanner();
                setShowManualInput(true);
              }
            }}
          >
            {showManualInput ? <Camera className="w-5 h-5" /> : <Keyboard className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <div className="flex flex-col items-center px-4 pt-8">
        {showManualInput ? (
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">{t('vinScanner.enterManually')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('vinScanner.manualDescription')}
              </p>
            </div>

            <div className="space-y-3">
              <Input
                value={manualVin}
                onChange={(e) => {
                  setManualVin(e.target.value.toUpperCase().slice(0, 17));
                  setError(null);
                }}
                placeholder="XXXXXXXXXXXXXXXXX"
                className="text-center text-lg tracking-widest font-mono"
                maxLength={17}
              />
              <p className="text-xs text-muted-foreground text-center">
                {manualVin.length}/17 {t('vinScanner.characters')}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              variant="carnexo"
              size="lg"
              className="w-full"
              onClick={handleManualSubmit}
              disabled={manualVin.length !== 17 || isDecoding}
            >
              {isDecoding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('vinScanner.decodingVin')}
                </>
              ) : (
                t('vinScanner.decodeVin')
              )}
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold text-foreground">{t('vinScanner.pointAtBarcode')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('vinScanner.alignBarcode')}
              </p>
            </div>

            {/* Scanner container */}
            <div 
              ref={containerRef}
              className="relative rounded-2xl overflow-hidden bg-muted aspect-[4/3]"
            >
              <div id="vin-scanner-container" className="w-full h-full" />
              
              {/* Scanning overlay */}
              {isScanning && !isDecoding && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-20 border-2 border-primary rounded-lg">
                    <div className="absolute inset-0 bg-primary/10" />
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-scan" />
                  </div>
                </div>
              )}

              {/* Decoding overlay */}
              {isDecoding && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                    <p className="text-sm text-foreground font-medium">{t('vinScanner.decodingVin')}</p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {t('vinScanner.vinLocation')}
            </p>
          </div>
        )}
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(76px); }
          100% { transform: translateY(0); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}