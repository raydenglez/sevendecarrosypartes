import { useState, useEffect } from 'react';
import { Loader2, AtSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BusinessCategorySelect } from '@/components/BusinessCategorySelect';

const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  username: z.string().trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional()
    .or(z.literal('')),
  phone: z.string().trim().max(20, 'Phone must be less than 20 characters').optional().or(z.literal('')),
  locationCity: z.string().trim().max(100, 'City must be less than 100 characters').optional().or(z.literal('')),
  locationState: z.string().trim().max(100, 'State must be less than 100 characters').optional().or(z.literal('')),
  bio: z.string().trim().max(150, 'Bio must be less than 150 characters').optional().or(z.literal('')),
  businessCategory: z.string().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  initialData: {
    fullName: string;
    username: string;
    phone: string;
    locationCity: string;
    locationState: string;
    bio?: string;
    businessCategory?: string;
  };
  onProfileUpdated: (data: ProfileFormValues) => void;
}

export function EditProfileModal({
  open,
  onClose,
  userId,
  initialData,
  onProfileUpdated,
}: EditProfileModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: initialData.fullName,
      username: initialData.username,
      phone: initialData.phone,
      locationCity: initialData.locationCity,
      locationState: initialData.locationState,
      bio: initialData.bio || '',
      businessCategory: initialData.businessCategory || '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fullName: initialData.fullName,
        username: initialData.username,
        phone: initialData.phone,
        locationCity: initialData.locationCity,
        locationState: initialData.locationState,
        bio: initialData.bio || '',
        businessCategory: initialData.businessCategory || '',
      });
      setUsernameError(null);
    }
  }, [open, initialData, form]);

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (!username) return true;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .neq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking username:', error);
      return false;
    }
    
    return !data;
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setSaving(true);
    setUsernameError(null);

    try {
      // Check username availability if changed
      if (values.username && values.username !== initialData.username) {
        const isAvailable = await checkUsernameAvailability(values.username);
        if (!isAvailable) {
          setUsernameError(t('profile.usernameTaken'));
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.fullName,
          username: values.username ? values.username.toLowerCase() : null,
          phone: values.phone || null,
          location_city: values.locationCity || null,
          location_state: values.locationState || null,
          bio: values.bio || null,
          business_category: values.businessCategory || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        if (error.code === '23505') {
          setUsernameError(t('profile.usernameTaken'));
          setSaving(false);
          return;
        }
        throw error;
      }

      toast({
        title: t('toast.success'),
        description: t('toast.profileUpdated'),
      });

      onProfileUpdated(values);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: t('toast.error'),
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('profile.editProfile')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.fullName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('auth.fullNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('profile.username')}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder={t('profile.usernamePlaceholder')} 
                        className="pl-9"
                        {...field} 
                        onChange={(e) => {
                          setUsernameError(null);
                          field.onChange(e);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>{t('profile.usernameDesc')}</FormDescription>
                  {usernameError && (
                    <p className="text-sm font-medium text-destructive">{usernameError}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('profile.bio')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('profile.bioPlaceholder')} 
                      className="resize-none h-20"
                      maxLength={150}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>{t('profile.bioDesc')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="businessCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.businessCategory')}</FormLabel>
                  <FormControl>
                    <BusinessCategorySelect
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('settings.phone')}</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="locationCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.city')}</FormLabel>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="locationState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.state')}</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="carnetworx" className="flex-1" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
