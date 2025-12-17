import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ThemeSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThemeSettingsSheet({ open, onOpenChange }: ThemeSettingsSheetProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light', label: t('settings.lightTheme'), icon: Sun },
    { value: 'dark', label: t('settings.darkTheme'), icon: Moon },
    { value: 'system', label: t('settings.systemTheme'), icon: Monitor },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[50vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-foreground">{t('settings.theme')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6">
          <RadioGroup value={theme} onValueChange={setTheme} className="space-y-3">
            {themes.map(({ value, label, icon: Icon }) => (
              <div
                key={value}
                className="flex items-center space-x-3 p-3 rounded-xl bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                onClick={() => setTheme(value)}
              >
                <RadioGroupItem value={value} id={value} />
                <Icon className="w-5 h-5 text-muted-foreground" />
                <Label htmlFor={value} className="flex-1 cursor-pointer text-foreground">
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </SheetContent>
    </Sheet>
  );
}
