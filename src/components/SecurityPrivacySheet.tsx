import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { KeyRound, Eye, EyeOff, Shield, Smartphone, Clock, AlertTriangle, Loader2, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/contexts/LocationContext';

interface PrivacySettings {
  show_phone_on_listings: boolean;
  allow_messages_from_anyone: boolean;
  show_online_status: boolean;
}
import { z } from 'zod';

const passwordSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface SecurityPrivacySheetProps {
  open: boolean;
  onClose: () => void;
}

export function SecurityPrivacySheet({ open, onClose }: SecurityPrivacySheetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updatePassword, signOut } = useAuth();
  const { toast } = useToast();
  const { locationEnabled, setLocationEnabled } = useLocation();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    show_phone_on_listings: true,
    allow_messages_from_anyone: true,
    show_online_status: false,
  });
  const [privacyLoading, setPrivacyLoading] = useState(true);

  // Fetch privacy settings on mount
  useEffect(() => {
    const fetchPrivacySettings = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('show_phone_on_listings, allow_messages_from_anyone, show_online_status')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data && !error) {
        setPrivacySettings({
          show_phone_on_listings: data.show_phone_on_listings ?? true,
          allow_messages_from_anyone: data.allow_messages_from_anyone ?? true,
          show_online_status: data.show_online_status ?? false,
        });
      }
      setPrivacyLoading(false);
    };

    if (open) {
      fetchPrivacySettings();
    }
  }, [user?.id, open]);

  const updatePrivacySetting = async (key: keyof PrivacySettings, value: boolean) => {
    if (!user?.id) return;
    
    // Optimistic update
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
    
    const { error } = await supabase
      .from('profiles')
      .update({ [key]: value })
      .eq('id', user.id);
    
    if (error) {
      // Revert on error
      setPrivacySettings(prev => ({ ...prev, [key]: !value }));
      toast({
        title: t('settings.failedUpdateSetting'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
    setErrors({});
    
    const result = passwordSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(formData.newPassword);
    setLoading(false);

    if (error) {
      toast({
        title: t('settings.failedUpdatePassword'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('settings.passwordUpdated'),
        description: t('settings.passwordChangedSuccess'),
      });
      setShowChangePassword(false);
      setFormData({ newPassword: '', confirmPassword: '' });
    }
  };

  const lastLogin = user?.last_sign_in_at 
    ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown';

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast({
        title: t('settings.confirmationRequired'),
        description: t('settings.pleaseTypeDelete'),
        variant: "destructive",
      });
      return;
    }

    setDeleteLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: t('settings.accountDeleted'),
        description: t('settings.accountDeletedDesc'),
      });

      // Sign out and redirect
      await signOut();
      navigate('/');
      
    } catch (error) {
      console.error("Delete account error:", error);
      toast({
        title: t('settings.deletionFailed'),
        description: error instanceof Error ? error.message : t('settings.failedDeleteAccount'),
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col">
        <SheetHeader className="pb-4 flex-shrink-0">
          <SheetTitle className="text-xl">{t('settings.securityPrivacy')}</SheetTitle>
          <p className="text-sm text-muted-foreground">{t('settings.securityPrivacyDesc')}</p>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto flex-1 pb-6">
          {/* Change Password */}
          <div className="bg-muted/50 rounded-xl p-4">
            <button 
              className="w-full flex items-center gap-3"
              onClick={() => setShowChangePassword(!showChangePassword)}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-foreground font-medium">{t('settings.changePassword')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.updateAccountPassword')}</p>
              </div>
            </button>

            {showChangePassword && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('settings.confirmNewPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  variant="carnetworx"
                  className="w-full"
                  onClick={handlePasswordChange}
                  disabled={loading}
                >
                  {loading ? t('auth.updating') : t('auth.updatePassword')}
                </Button>
              </div>
            )}
          </div>

          {/* Two-Factor Authentication */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium">{t('settings.twoFactorAuth')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.twoFactorAuthDesc')}</p>
              </div>
              <Switch disabled />
            </div>
            <p className="text-xs text-muted-foreground mt-2 ml-13">
              {t('settings.comingSoon')}
            </p>
          </div>

          {/* Login Activity */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium">{t('settings.lastLogin')}</p>
                <p className="text-sm text-muted-foreground">{lastLogin}</p>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium">{t('settings.privacySettings')}</p>
              </div>
            </div>

            <div className="space-y-3 pl-13">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{t('settings.showPhoneOnListings')}</p>
                </div>
                <Switch 
                  checked={privacySettings.show_phone_on_listings}
                  onCheckedChange={(checked) => updatePrivacySetting('show_phone_on_listings', checked)}
                  disabled={privacyLoading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{t('settings.allowMessagesFromAnyone')}</p>
                </div>
                <Switch 
                  checked={privacySettings.allow_messages_from_anyone}
                  onCheckedChange={(checked) => updatePrivacySetting('allow_messages_from_anyone', checked)}
                  disabled={privacyLoading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{t('settings.showOnlineStatus')}</p>
                </div>
                <Switch 
                  checked={privacySettings.show_online_status}
                  onCheckedChange={(checked) => updatePrivacySetting('show_online_status', checked)}
                  disabled={privacyLoading}
                />
              </div>
            </div>
          </div>

          {/* Location Settings */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium">{t('settings.locationSettings')}</p>
              </div>
            </div>

            <div className="space-y-3 pl-13">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{t('settings.enableLocation')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.enableLocationDesc')}</p>
                </div>
                <Switch 
                  checked={locationEnabled}
                  onCheckedChange={setLocationEnabled}
                />
              </div>
            </div>
          </div>

          {/* Delete Account */}
          <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium">{t('settings.deleteAccount')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.deleteAccountDesc')}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full mt-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteDialogOpen(true)}
            >
              {t('settings.deleteMyAccount')}
            </Button>
          </div>
        </div>
      </SheetContent>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {t('settings.deleteAccountPermanently')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t('settings.deleteAccountWarningFull')}
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{t('settings.deleteWarningProfile')}</li>
                <li>{t('settings.deleteWarningListings')}</li>
                <li>{t('settings.deleteWarningMessages')}</li>
                <li>{t('settings.deleteWarningReviews')}</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4">
            <Label htmlFor="deleteConfirm" className="text-sm text-muted-foreground">
              {t('settings.typeDeleteConfirm')}
            </Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="mt-2"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={deleteLoading}
              onClick={() => setDeleteConfirmText('')}
            >
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAccount}
              disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('settings.deleting')}
                </>
              ) : (
                t('settings.deleteAccount')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}