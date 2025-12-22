import { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LanguageSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];

export function LanguageSheet({ open, onOpenChange }: LanguageSheetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLanguage() {
      if (!user || !open) return;

      const { data } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.language) {
        setSelectedLanguage(data.language);
        // Sync i18n with database value
        if (data.language !== i18n.language) {
          i18n.changeLanguage(data.language);
          localStorage.setItem('carnetworx-language', data.language);
        }
      }
    }

    fetchLanguage();
  }, [user, open, i18n]);

  const handleLanguageSelect = async (languageCode: string) => {
    if (languageCode === selectedLanguage) return;

    setLoading(true);
    const previousLanguage = selectedLanguage;
    setSelectedLanguage(languageCode);

    // Change i18n language immediately
    i18n.changeLanguage(languageCode);
    localStorage.setItem('carnetworx-language', languageCode);

    // Save to database if user is logged in
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ language: languageCode })
        .eq('id', user.id);

      if (error) {
        setSelectedLanguage(previousLanguage);
        i18n.changeLanguage(previousLanguage);
        localStorage.setItem('carnetworx-language', previousLanguage);
        toast({
          title: t('toast.error'),
          description: 'Failed to update language preference.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
    }

    const langName = LANGUAGES.find(l => l.code === languageCode)?.name;
    toast({
      title: t('toast.success'),
      description: t('toast.languageUpdated', { language: langName }),
    });

    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[50vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-success" />
            {t('settings.language')}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-2 pb-6">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              disabled={loading}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                selectedLanguage === language.code
                  ? 'bg-success/20 border border-success'
                  : 'bg-card hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{language.flag}</span>
                <span className="font-medium text-foreground">{language.name}</span>
              </div>
              {selectedLanguage === language.code && (
                <Check className="w-5 h-5 text-success" />
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}