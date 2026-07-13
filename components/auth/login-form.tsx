'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/lib/validation/schemas';
import { LoadingSpinner } from '@/components/shared/loading';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        router.push(redirect);
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <div className="mb-4">
        <label
          htmlFor="username"
          className="block text-xs font-medium text-neutral-400 mb-1.5"
        >
          Username
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <User className="w-4 h-4 text-neutral-500" />
          </div>
          <input
            id="username"
            type="text"
            {...register('username')}
            className="w-full pl-10 pr-3 py-3 text-sm border border-neutral-800 bg-neutral-950 text-white rounded-lg focus:outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-600"
            placeholder="Enter username"
          />
        </div>
        {errors.username && (
          <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>
        )}
      </div>

      <div className="mb-6">
        <label
          htmlFor="password"
          className="block text-xs font-medium text-neutral-400 mb-1.5"
        >
          Password
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Lock className="w-4 h-4 text-neutral-500" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            className="w-full pl-10 pr-10 py-3 text-sm border border-neutral-800 bg-neutral-950 text-white rounded-lg focus:outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-600"
            placeholder="Enter password"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-neutral-300 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-950/50 border border-red-900/50 rounded-lg">
          <p className="text-xs text-red-400 text-center">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 text-sm font-medium text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <LoadingSpinner size={16} />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={
      <div className="bg-neutral-900 border border-neutral-800 p-10 flex justify-center py-12 rounded-2xl shadow-xl w-full">
        <LoadingSpinner size={24} />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
