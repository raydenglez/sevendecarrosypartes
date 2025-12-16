import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, MailCheck, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CarNexoLogo from '@/components/CarNexoLogo';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading: authLoading, signUp, signIn, signInWithOAuth, resendConfirmationEmail, resetPassword } = useAuth();
  const { toast } = useToast();
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const loginSchema = z.object({
    email: z.string().trim().email({ message: t('auth.validation.invalidEmail') }),
    password: z.string().min(6, { message: t('auth.validation.passwordMin') }),
  });

  const signupSchema = z.object({
    fullName: z.string().trim().min(2, { message: t('auth.validation.nameMin') }).max(100),
    email: z.string().trim().email({ message: t('auth.validation.invalidEmail') }),
    password: z.string().min(6, { message: t('auth.validation.passwordMin') }),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.validation.passwordsMatch'),
    path: ["confirmPassword"],
  });
  
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Loading skeleton while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-full max-w-md px-6">
          <div className="flex flex-col items-center mb-8">
            <Skeleton className="h-20 w-20 rounded-2xl mb-6" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl mt-4" />
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    const { error } = await resendConfirmationEmail(pendingEmail);
    setResendLoading(false);
    
    if (error) {
      toast({
        title: t('auth.toast.failedResend'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t('auth.toast.emailSent'),
        description: t('auth.toast.confirmationResent'),
      });
    }
  };

  const handleBackToSignup = () => {
    setConfirmationPending(false);
    setResetEmailSent(false);
    setShowForgotPassword(false);
    setPendingEmail('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const emailValidation = z.string().trim().email({ message: t('auth.validation.invalidEmail') }).safeParse(formData.email);
    if (!emailValidation.success) {
      setErrors({ email: emailValidation.error.errors[0].message });
      return;
    }
    
    setLoading(true);
    const { error } = await resetPassword(formData.email);
    setLoading(false);
    
    if (error) {
      toast({
        title: t('auth.toast.failedResetEmail'),
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPendingEmail(formData.email);
      setResetEmailSent(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        const result = loginSchema.safeParse(formData);
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

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: t('auth.toast.loginFailed'),
              description: t('auth.toast.invalidCredentials'),
              variant: "destructive",
            });
          } else if (error.message.includes('Email not confirmed')) {
            setPendingEmail(formData.email);
            setConfirmationPending(true);
          } else {
            toast({
              title: t('auth.toast.loginFailed'),
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: t('auth.toast.welcomeBack'),
            description: t('auth.toast.loggedIn'),
          });
          navigate('/');
        }
      } else {
        const result = signupSchema.safeParse(formData);
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

        const { error, confirmationPending: isPending } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: t('auth.toast.accountExists'),
              description: t('auth.toast.emailRegistered'),
              variant: "destructive",
            });
          } else {
            toast({
              title: t('auth.toast.signUpFailed'),
              description: error.message,
              variant: "destructive",
            });
          }
        } else if (isPending) {
          setPendingEmail(formData.email);
          setConfirmationPending(true);
        } else {
          toast({
            title: t('auth.toast.accountCreated'),
            description: t('auth.toast.welcomeToCarNexo'),
          });
          navigate('/');
        }
      }
    } catch (err) {
      toast({
        title: t('toast.error'),
        description: t('auth.toast.somethingWrong'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Background component with gradient
  const AuthBackground = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-secondary/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[40%] right-[20%] w-[200px] h-[200px] rounded-full bg-primary/10 blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );

  // Email Confirmation Pending Screen
  if (confirmationPending) {
    return (
      <AuthBackground>
        <header className="px-4 pt-4 safe-top">
          <button 
            onClick={handleBackToSignup}
            className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-card/50 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center mb-8 shadow-blue">
            <MailCheck className="w-12 h-12 text-secondary" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground text-center mb-3">
            {t('auth.checkInbox')}
          </h1>
          
          <p className="text-muted-foreground text-center mb-2 text-lg">
            {t('auth.confirmationSent')}
          </p>
          
          <p className="text-primary font-semibold text-center mb-8 text-lg">
            {pendingEmail}
          </p>
          
          <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-5 mb-8 w-full max-w-sm border border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              {t('auth.checkSpamFolder')}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleResendEmail}
            disabled={resendLoading}
            className="w-full max-w-sm mb-4 h-12 rounded-xl border-border/50 bg-card/30 hover:bg-card/50"
          >
            {resendLoading ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                {t('auth.resending')}
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                {t('auth.resendEmail')}
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleBackToSignup}
            className="text-muted-foreground hover:text-foreground"
          >
            {t('auth.useDifferentEmail')}
          </Button>
        </div>
      </AuthBackground>
    );
  }

  // Password Reset Email Sent Screen
  if (resetEmailSent) {
    return (
      <AuthBackground>
        <header className="px-4 pt-4 safe-top">
          <button 
            onClick={handleBackToSignup}
            className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-card/50 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center mb-8 shadow-blue">
            <MailCheck className="w-12 h-12 text-secondary" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground text-center mb-3">
            {t('auth.checkInbox')}
          </h1>
          
          <p className="text-muted-foreground text-center mb-2 text-lg">
            {t('auth.resetSent')}
          </p>
          
          <p className="text-primary font-semibold text-center mb-8 text-lg">
            {pendingEmail}
          </p>
          
          <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-5 mb-8 w-full max-w-sm border border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              {t('auth.checkSpamFolderReset')}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleBackToSignup}
            className="w-full max-w-sm h-12 rounded-xl border-border/50 bg-card/30 hover:bg-card/50"
          >
            {t('auth.backToSignIn')}
          </Button>
        </div>
      </AuthBackground>
    );
  }

  // Forgot Password Form
  if (showForgotPassword) {
    return (
      <AuthBackground>
        <header className="px-4 pt-4 safe-top">
          <button 
            onClick={() => setShowForgotPassword(false)}
            className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-card/50 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="flex flex-col items-center mb-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/30 to-secondary/10 flex items-center justify-center mb-6 shadow-blue">
                <Mail className="w-10 h-10 text-secondary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground text-center">
                {t('auth.forgotPasswordTitle')}
              </h1>
              <p className="text-muted-foreground text-center mt-2">
                {t('auth.forgotPasswordDesc')}
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t('auth.email')}</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-12 h-12 rounded-xl bg-card/50 border-border/50 focus:border-primary focus:bg-card/80 transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                variant="carnexo"
                size="lg"
                className="w-full h-12 rounded-xl shadow-orange"
                disabled={loading}
              >
                {loading ? t('auth.sending') : t('auth.sendResetLink')}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t('auth.backToSignIn')}
              </button>
            </div>
          </div>
        </div>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      {/* Header */}
      <header className="px-4 pt-4 safe-top">
        <button 
          onClick={() => navigate('/')}
          className="w-10 h-10 flex items-center justify-center text-foreground hover:bg-card/50 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm">
          {/* Logo & Title */}
          <div className="flex flex-col items-center mb-10">
            <div className="mb-6">
              <CarNexoLogo size="lg" animate={true} />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isLogin ? t('auth.signInToContinue') : t('auth.joinCarNexo')}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card/40 backdrop-blur-xl rounded-3xl p-6 border border-border/50 shadow-elevated">
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">{t('auth.fullName')}</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder={t('auth.fullNamePlaceholder')}
                      value={formData.fullName}
                      onChange={handleChange}
                      className="pl-12 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary focus:bg-background/80 transition-all"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t('auth.email')}</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-12 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary focus:bg-background/80 transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">{t('auth.password')}</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-12 pr-12 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary focus:bg-background/80 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors mt-1"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">{t('auth.confirmPassword')}</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="pl-12 h-12 rounded-xl bg-background/50 border-border/50 focus:border-primary focus:bg-background/80 transition-all"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                variant="carnexo"
                size="lg"
                className="w-full h-12 rounded-xl shadow-orange mt-2"
                disabled={loading || oauthLoading !== null}
              >
                {loading ? t('auth.pleaseWait') : isLogin ? t('auth.signIn') : t('auth.createAccount')}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border/50" />
              <span className="text-muted-foreground text-xs uppercase tracking-wider">{t('auth.orContinueWith')}</span>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            {/* Social Login Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1 h-12 rounded-xl border-border/50 bg-background/30 hover:bg-background/50 transition-all"
                disabled={loading || oauthLoading !== null}
                onClick={async () => {
                  setOauthLoading('google');
                  const { error } = await signInWithOAuth('google');
                  if (error) {
                    toast({
                      title: t('auth.toast.loginFailed'),
                      description: error.message,
                      variant: "destructive",
                    });
                    setOauthLoading(null);
                  }
                }}
              >
                {oauthLoading === 'google' ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                <span className="ml-2 font-medium">Google</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="flex-1 h-12 rounded-xl border-border/50 bg-background/30 hover:bg-background/50 transition-all"
                disabled={loading || oauthLoading !== null}
                onClick={async () => {
                  setOauthLoading('apple');
                  const { error } = await signInWithOAuth('apple');
                  if (error) {
                    toast({
                      title: t('auth.toast.loginFailed'),
                      description: error.message,
                      variant: "destructive",
                    });
                    setOauthLoading(null);
                  }
                }}
              >
                {oauthLoading === 'apple' ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                )}
                <span className="ml-2 font-medium">Apple</span>
              </Button>
            </div>
          </div>

          {/* Toggle */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              {isLogin ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                  setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
                }}
                className="text-primary font-semibold ml-1.5 hover:text-primary/80 transition-colors"
              >
                {isLogin ? t('auth.signUp') : t('auth.signIn')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
