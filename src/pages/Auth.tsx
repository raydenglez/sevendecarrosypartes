import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, MailCheck, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/logo.png';

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100),
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signUp, signIn, signInWithOAuth, resendConfirmationEmail, resetPassword } = useAuth();
  const { toast } = useToast();
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  
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
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-4 pt-4 safe-top">
          <Skeleton className="w-10 h-10 rounded-full" />
        </header>

        <div className="flex-1 px-6 py-8 flex flex-col">
          <div className="flex flex-col items-center mb-8">
            <Skeleton className="h-16 w-16 rounded-2xl mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg mt-6" />
          </div>

          <div className="flex items-center gap-4 my-6">
            <Skeleton className="flex-1 h-px" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="flex-1 h-px" />
          </div>

          <div className="flex gap-3">
            <Skeleton className="flex-1 h-12 rounded-lg" />
            <Skeleton className="flex-1 h-12 rounded-lg" />
          </div>

          <div className="mt-6 flex justify-center">
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
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
        title: "Failed to resend",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email sent!",
        description: "A new confirmation email has been sent to your inbox.",
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
    
    const emailValidation = z.string().trim().email({ message: "Invalid email address" }).safeParse(formData.email);
    if (!emailValidation.success) {
      setErrors({ email: emailValidation.error.errors[0].message });
      return;
    }
    
    setLoading(true);
    const { error } = await resetPassword(formData.email);
    setLoading(false);
    
    if (error) {
      toast({
        title: "Failed to send reset email",
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
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else if (error.message.includes('Email not confirmed')) {
            // User exists but hasn't confirmed email
            setPendingEmail(formData.email);
            setConfirmationPending(true);
          } else {
            toast({
              title: "Login failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
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
              title: "Account exists",
              description: "This email is already registered. Try logging in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else if (isPending) {
          // Email confirmation required
          setPendingEmail(formData.email);
          setConfirmationPending(true);
        } else {
          // Auto-confirm is enabled, user is logged in
          toast({
            title: "Account created!",
            description: "Welcome to CarNexo! You can now browse and create listings.",
          });
          navigate('/');
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Email Confirmation Pending Screen
  if (confirmationPending) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-4 pt-4 safe-top">
          <button 
            onClick={handleBackToSignup}
            className="w-10 h-10 flex items-center justify-center text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-secondary/15 flex items-center justify-center mb-6">
            <MailCheck className="w-10 h-10 text-secondary" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            Check your inbox
          </h1>
          
          <p className="text-muted-foreground text-center mb-2">
            We've sent a confirmation link to:
          </p>
          
          <p className="text-foreground font-medium text-center mb-6">
            {pendingEmail}
          </p>
          
          <div className="bg-muted/50 rounded-xl p-4 mb-6 w-full max-w-sm">
            <p className="text-sm text-muted-foreground text-center">
              Click the link in the email to verify your account. If you don't see it, check your spam folder.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleResendEmail}
            disabled={resendLoading}
            className="w-full max-w-sm mb-3"
          >
            {resendLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend confirmation email
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleBackToSignup}
            className="text-muted-foreground"
          >
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  // Password Reset Email Sent Screen
  if (resetEmailSent) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-4 pt-4 safe-top">
          <button 
            onClick={handleBackToSignup}
            className="w-10 h-10 flex items-center justify-center text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-secondary/15 flex items-center justify-center mb-6">
            <MailCheck className="w-10 h-10 text-secondary" />
          </div>
          
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            Check your inbox
          </h1>
          
          <p className="text-muted-foreground text-center mb-2">
            We've sent a password reset link to:
          </p>
          
          <p className="text-foreground font-medium text-center mb-6">
            {pendingEmail}
          </p>
          
          <div className="bg-muted/50 rounded-xl p-4 mb-6 w-full max-w-sm">
            <p className="text-sm text-muted-foreground text-center">
              Click the link in the email to reset your password. If you don't see it, check your spam folder.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleBackToSignup}
            className="w-full max-w-sm"
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Forgot Password Form
  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="px-4 pt-4 safe-top">
          <button 
            onClick={() => setShowForgotPassword(false)}
            className="w-10 h-10 flex items-center justify-center text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-1 px-6 py-8 flex flex-col">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-secondary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Forgot password?
            </h1>
            <p className="text-muted-foreground text-sm mt-1 text-center">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
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
              className="w-full mt-6"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="text-muted-foreground text-sm"
            >
              Back to <span className="text-primary font-semibold">Sign in</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-4 pt-4 safe-top">
        <button 
          onClick={() => navigate('/')}
          className="w-10 h-10 flex items-center justify-center text-foreground"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-8 flex flex-col">
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="CarNexo" className="h-16 w-16 rounded-2xl mb-4" />
          <h1 className="text-2xl font-bold text-foreground">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLogin ? 'Sign in to continue' : 'Join CarNexo today'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="pl-10"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
            {isLogin && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline mt-1"
              >
                Forgot password?
              </button>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
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
          )}

          <Button
            type="submit"
            variant="carnexo"
            size="lg"
            className="w-full mt-6"
            disabled={loading || oauthLoading !== null}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-muted-foreground text-sm">or continue with</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Social Login Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={loading || oauthLoading !== null}
            onClick={async () => {
              setOauthLoading('google');
              const { error } = await signInWithOAuth('google');
              if (error) {
                toast({
                  title: "Login failed",
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
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span className="ml-2">Google</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            disabled={loading || oauthLoading !== null}
            onClick={async () => {
              setOauthLoading('apple');
              const { error } = await signInWithOAuth('apple');
              if (error) {
                toast({
                  title: "Login failed",
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
            <span className="ml-2">Apple</span>
          </Button>
        </div>

        {/* Toggle */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
              }}
              className="text-primary font-semibold ml-1"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
