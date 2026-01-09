import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Instagram, Globe, Phone, Edit2, Check, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface SocialLinksSheetProps {
  open: boolean;
  onClose: () => void;
  socialData: {
    instagram_url: string | null;
    whatsapp_number: string | null;
    website_url: string | null;
  };
  onUpdate: (data: { instagram_url: string | null; whatsapp_number: string | null; website_url: string | null }) => void;
}

export function SocialLinksSheet({ open, onClose, socialData, onUpdate }: SocialLinksSheetProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    instagram_url: socialData.instagram_url || '',
    whatsapp_number: socialData.whatsapp_number || '',
    website_url: socialData.website_url || '',
  });

  const handleSave = async (field: string) => {
    if (!user) return;
    setLoading(true);

    try {
      const updateData: Record<string, string | null> = {};
      
      if (field === 'instagram') {
        updateData.instagram_url = formData.instagram_url || null;
      }
      if (field === 'whatsapp') {
        updateData.whatsapp_number = formData.whatsapp_number || null;
      }
      if (field === 'website') {
        updateData.website_url = formData.website_url || null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      onUpdate({
        instagram_url: formData.instagram_url || null,
        whatsapp_number: formData.whatsapp_number || null,
        website_url: formData.website_url || null,
      });
      setEditing(null);
      toast({
        title: t('toast.success'),
        description: t('toast.profileUpdated'),
      });
    } catch (error) {
      toast({
        title: t('toast.error'),
        description: "Failed to update. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      instagram_url: socialData.instagram_url || '',
      whatsapp_number: socialData.whatsapp_number || '',
      website_url: socialData.website_url || '',
    });
    setEditing(null);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl">{t('profile.socialLinks')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto">
          {/* Instagram */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Instagram</Label>
                {editing === 'instagram' ? (
                  <Input
                    value={formData.instagram_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                    placeholder="@yourusername or URL"
                    className="mt-1 h-9"
                  />
                ) : (
                  <p className="text-foreground font-medium">
                    {socialData.instagram_url || t('common.notSet')}
                  </p>
                )}
              </div>
              {editing === 'instagram' ? (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-success"
                    onClick={() => handleSave('instagram')}
                    disabled={loading}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={handleCancel}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setEditing('instagram')}
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>

          {/* WhatsApp */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">WhatsApp Business</Label>
                {editing === 'whatsapp' ? (
                  <Input
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    placeholder="+1234567890"
                    className="mt-1 h-9"
                  />
                ) : (
                  <p className="text-foreground font-medium">
                    {socialData.whatsapp_number || t('common.notSet')}
                  </p>
                )}
              </div>
              {editing === 'whatsapp' ? (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-success"
                    onClick={() => handleSave('whatsapp')}
                    disabled={loading}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={handleCancel}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setEditing('whatsapp')}
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="bg-muted/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">{t('profile.website')}</Label>
                {editing === 'website' ? (
                  <Input
                    value={formData.website_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                    className="mt-1 h-9"
                  />
                ) : (
                  <p className="text-foreground font-medium truncate">
                    {socialData.website_url || t('common.notSet')}
                  </p>
                )}
              </div>
              {editing === 'website' ? (
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-success"
                    onClick={() => handleSave('website')}
                    disabled={loading}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={handleCancel}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setEditing('website')}
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-secondary/10 rounded-xl p-4 border border-secondary/20">
            <p className="text-sm text-muted-foreground">
              {t('profile.socialLinksDesc')}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}