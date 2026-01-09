import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  BadgeCheck,
  IdCard,
  User,
  ShieldCheck,
  Loader2,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VerificationRequestSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingRequest?: {
    status: string;
    rejection_reason?: string;
  } | null;
  onSuccess?: () => void;
}

export function VerificationRequestSheet({ 
  open, 
  onOpenChange, 
  existingRequest,
  onSuccess 
}: VerificationRequestSheetProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null);
  const [selfiePhoto, setSelfiePhoto] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const handleIdPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t('verification.fileTooLarge'),
          description: t('verification.maxFileSize'),
          variant: 'destructive',
        });
        return;
      }
      setIdPhoto(file);
      setIdPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSelfieSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t('verification.fileTooLarge'),
          description: t('verification.maxFileSize'),
          variant: 'destructive',
        });
        return;
      }
      setSelfiePhoto(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user || !idPhoto || !selfiePhoto) return;

    setUploading(true);
    try {
      // Upload ID photo
      const idFileName = `${user.id}/id-${Date.now()}.jpg`;
      const { error: idUploadError } = await supabase.storage
        .from('verification-documents')
        .upload(idFileName, idPhoto);

      if (idUploadError) throw idUploadError;

      // Upload selfie with ID
      const selfieFileName = `${user.id}/selfie-${Date.now()}.jpg`;
      const { error: selfieUploadError } = await supabase.storage
        .from('verification-documents')
        .upload(selfieFileName, selfiePhoto);

      if (selfieUploadError) throw selfieUploadError;

      // Create verification request
      const { error: requestError } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.id,
          id_photo_url: idFileName,
          selfie_with_id_url: selfieFileName,
          status: 'pending',
        });

      if (requestError) throw requestError;

      toast({
        title: t('verification.requestSubmitted'),
        description: t('verification.requestSubmittedDesc'),
      });

      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast({
        title: t('common.error'),
        description: t('verification.submitError'),
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setIdPhoto(null);
    setIdPhotoPreview(null);
    setSelfiePhoto(null);
    setSelfiePreview(null);
  };

  const renderExistingRequest = () => {
    if (!existingRequest) return null;

    const statusConfig = {
      pending: {
        icon: Clock,
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        title: t('verification.pendingTitle'),
        description: t('verification.pendingDesc'),
      },
      approved: {
        icon: CheckCircle,
        color: 'text-success',
        bgColor: 'bg-success/10',
        title: t('verification.approvedTitle'),
        description: t('verification.approvedDesc'),
      },
      rejected: {
        icon: AlertCircle,
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        title: t('verification.rejectedTitle'),
        description: existingRequest.rejection_reason || t('verification.rejectedDesc'),
      },
    };

    const config = statusConfig[existingRequest.status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <div className={cn('rounded-xl p-6 text-center', config.bgColor)}>
        <Icon className={cn('w-12 h-12 mx-auto mb-4', config.color)} />
        <h3 className="text-lg font-semibold text-foreground mb-2">{config.title}</h3>
        <p className="text-sm text-muted-foreground">{config.description}</p>
        {existingRequest.status === 'rejected' && (
          <Button 
            variant="carnetworx" 
            className="mt-4"
            onClick={() => setStep(1)}
          >
            {t('verification.tryAgain')}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-primary" />
            {t('verification.getVerified')}
          </SheetTitle>
          <SheetDescription>
            {t('verification.description')}
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] pb-8">
          {existingRequest && existingRequest.status !== 'rejected' ? (
            renderExistingRequest()
          ) : (
            <>
              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      step >= s 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                  </div>
                ))}
              </div>

              {/* Step 1: Instructions */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-4 border border-border">
                    <h4 className="font-semibold text-foreground mb-4">{t('verification.requirements')}</h4>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <IdCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{t('verification.step1Title')}</p>
                          <p className="text-sm text-muted-foreground">{t('verification.step1Desc')}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{t('verification.step2Title')}</p>
                          <p className="text-sm text-muted-foreground">{t('verification.step2Desc')}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{t('verification.privacyTitle')}</p>
                          <p className="text-sm text-muted-foreground">{t('verification.privacyDesc')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Example Images */}
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm font-medium text-foreground mb-3">{t('verification.exampleTitle')}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="aspect-[4/3] bg-card rounded-lg border-2 border-dashed border-primary/30 flex flex-col items-center justify-center p-4">
                          <IdCard className="w-10 h-10 text-primary/50 mb-2" />
                          <p className="text-xs text-muted-foreground">{t('verification.idExample')}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{t('verification.idTip')}</p>
                      </div>
                      <div className="text-center">
                        <div className="aspect-[4/3] bg-card rounded-lg border-2 border-dashed border-primary/30 flex flex-col items-center justify-center p-4">
                          <div className="relative">
                            <User className="w-10 h-10 text-primary/50" />
                            <IdCard className="w-5 h-5 text-primary/50 absolute -bottom-1 -right-2" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{t('verification.selfieExample')}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{t('verification.selfieTip')}</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="carnetworx" 
                    className="w-full"
                    onClick={() => setStep(2)}
                  >
                    {t('verification.startVerification')}
                  </Button>
                </div>
              )}

              {/* Step 2: Upload ID Photo */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <IdCard className="w-12 h-12 text-primary mx-auto mb-2" />
                    <h4 className="font-semibold text-foreground">{t('verification.uploadId')}</h4>
                    <p className="text-sm text-muted-foreground">{t('verification.uploadIdDesc')}</p>
                  </div>

                  <input
                    type="file"
                    ref={idInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleIdPhotoSelect}
                    className="hidden"
                  />

                  {idPhotoPreview ? (
                    <div className="relative">
                      <img 
                        src={idPhotoPreview} 
                        alt="ID Preview" 
                        className="w-full aspect-[4/3] object-cover rounded-xl"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setIdPhoto(null);
                          setIdPhotoPreview(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="aspect-[4/3] bg-muted rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => idInputRef.current?.click()}
                    >
                      <Camera className="w-12 h-12 text-primary/50 mb-3" />
                      <p className="text-sm font-medium text-foreground">{t('verification.tapToCapture')}</p>
                      <p className="text-xs text-muted-foreground">{t('verification.orUpload')}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setStep(1)}
                    >
                      {t('common.back')}
                    </Button>
                    <Button 
                      variant="carnetworx" 
                      className="flex-1"
                      disabled={!idPhoto}
                      onClick={() => setStep(3)}
                    >
                      {t('common.continue')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Upload Selfie with ID */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <div className="relative w-12 h-12 mx-auto mb-2">
                      <User className="w-12 h-12 text-primary" />
                      <IdCard className="w-6 h-6 text-primary absolute -bottom-1 -right-2" />
                    </div>
                    <h4 className="font-semibold text-foreground">{t('verification.uploadSelfie')}</h4>
                    <p className="text-sm text-muted-foreground">{t('verification.uploadSelfieDesc')}</p>
                  </div>

                  <input
                    type="file"
                    ref={selfieInputRef}
                    accept="image/*"
                    capture="user"
                    onChange={handleSelfieSelect}
                    className="hidden"
                  />

                  {selfiePreview ? (
                    <div className="relative">
                      <img 
                        src={selfiePreview} 
                        alt="Selfie Preview" 
                        className="w-full aspect-[4/3] object-cover rounded-xl"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setSelfiePhoto(null);
                          setSelfiePreview(null);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="aspect-[4/3] bg-muted rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => selfieInputRef.current?.click()}
                    >
                      <Camera className="w-12 h-12 text-primary/50 mb-3" />
                      <p className="text-sm font-medium text-foreground">{t('verification.tapToCapture')}</p>
                      <p className="text-xs text-muted-foreground">{t('verification.orUpload')}</p>
                    </div>
                  )}

                  <div className="bg-warning/10 rounded-lg p-3">
                    <p className="text-xs text-warning font-medium">{t('verification.selfieHint')}</p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setStep(2)}
                    >
                      {t('common.back')}
                    </Button>
                    <Button 
                      variant="carnetworx" 
                      className="flex-1"
                      disabled={!selfiePhoto || uploading}
                      onClick={handleSubmit}
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {t('verification.submit')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
