'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const baseSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  confirmPassword: z.string()
});

const signInSchema = baseSchema;

const signUpSchema = baseSchema
  .extend({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type AuthFormFields = z.infer<typeof baseSchema>;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        fill="#EA4335"
      />
    </svg>
  );
}

const Mode = { SignIn: 'sign-in', SignUp: 'sign-up' } as const;
type Mode = (typeof Mode)[keyof typeof Mode];

interface AuthFormProps {
  defaultMode?: Mode;
}

export function AuthForm({ defaultMode = Mode.SignIn }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [serverMessage, setServerMessage] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  const isSignUp = mode === Mode.SignUp;

  function switchMode() {
    setMode(isSignUp ? Mode.SignIn : Mode.SignUp);
    setServerMessage(null);
  }

  async function handleGoogleLogin() {
    setOauthLoading(true);
    setServerMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      setServerMessage({ type: 'error', text: error.message });
      setOauthLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          {isSignUp ? 'Create your account' : 'Sign in to Remes'}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          {isSignUp
            ? 'Get started finding high-intent leads'
            : 'Start finding high-intent leads in minutes'}
        </p>
      </div>

      <Button
        variant="outline"
        size="lg"
        className="w-full gap-3"
        onClick={handleGoogleLogin}
        disabled={oauthLoading}
      >
        <GoogleIcon className="size-5" />
        {oauthLoading ? 'Redirecting...' : 'Continue with Google'}
      </Button>

      <div className="flex items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">or</span>
        <div className="bg-border h-px flex-1" />
      </div>

      {serverMessage && (
        <p
          className={`text-sm ${serverMessage.type === 'success' ? 'text-accent-tertiary' : 'text-destructive'}`}
        >
          {serverMessage.text}
        </p>
      )}

      <EmailForm
        key={mode}
        mode={mode}
        onModeSwitch={switchMode}
        onServerMessage={setServerMessage}
      />

      <p className="text-muted-foreground text-center text-sm">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline"
          onClick={switchMode}
        >
          {isSignUp ? 'Sign in' : 'Sign up'}
        </button>
      </p>
    </div>
  );
}

interface EmailFormProps {
  mode: Mode;
  onModeSwitch: () => void;
  onServerMessage: (msg: { type: 'error' | 'success'; text: string } | null) => void;
}

function EmailForm({ mode, onModeSwitch, onServerMessage }: EmailFormProps) {
  const router = useRouter();
  const isSignUp = mode === Mode.SignUp;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<AuthFormFields>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' }
  });

  async function onSubmit(data: AuthFormFields) {
    onServerMessage(null);
    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) {
        onServerMessage({ type: 'error', text: error.message });
        return;
      }
      onServerMessage({
        type: 'success',
        text: 'Check your email to confirm your account, then sign in.'
      });
      onModeSwitch();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });
    if (error) {
      onServerMessage({ type: 'error', text: error.message });
      return;
    }

    router.push('/research');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder={isSignUp ? 'Create a password' : 'Your password'}
          {...register('password')}
        />
        {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
      </div>
      {isSignUp && (
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Confirm your password"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>
          )}
        </div>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Loading...' : isSignUp ? 'Create account' : 'Sign in'}
      </Button>
    </form>
  );
}
