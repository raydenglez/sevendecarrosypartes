import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Eye, EyeOff, Lock, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { updatePassword, session } = useAuth();
  const { toast } = useToast();

  const passwordSchema = z.object({
    password: z.string().min(6, { message: t('auth.validation.passwordMin') }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.validation.passwordsMatch'),
    path: ["confirmPassword"],
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  // Check if user has a valid recovery session
  useEffect(() => {
    // If no session exists after a few seconds, redirect to auth
    const timeout = setTimeout(() => {
      if (!session) {
        toast({
          title: t('auth.invalidExpiredLink'),
          description: t('auth.requestNewLink'),
          variant: "destructive",
        });
        navigate('/auth');
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [session, navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const result = passwordSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    const { error } = await updatePassword(formData.password);
    setLoading(false);

    if (error) {
      toast({
        title: t('auth.toast.failedUpdatePassword'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSuccess(true);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-4 pt-4 safe-top">
          <div className="w-10 h-10" />
        </header>

        <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            {t('auth.passwordUpdated')}
          </h1>
          
          <p className="text-muted-foreground text-center mb-6">
            {t('auth.passwordUpdatedDesc')}
          </p>

          <Button
            variant="carnexo"
            onClick={() => navigate('/')}
            className="w-full max-w-sm"
          >
            {t('auth.continueToApp')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-4 pt-4 safe-top">
        <button 
          onClick={() => navigate('/auth')}
          className="w-10 h-10 flex items-center justify-center text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 px-6 py-8 flex flex-col">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {t('auth.setNewPassword')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            {t('auth.setNewPasswordDesc')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.newPassword')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="pl-10"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="carnexo"
            size="lg"
            className="w-full mt-6"
            disabled={loading}
          >
            {loading ? t('auth.updating') : t('auth.updatePassword')}
          </Button>
        </form>
      </div>
    </div>
  );
}
