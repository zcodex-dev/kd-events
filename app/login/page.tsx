'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageIcon, Lock, User, Eye, EyeOff } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/lib/validation/schemas';
import { LoadingSpinner } from '@/components/shared/loading';

function LoginForm() {
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
    <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-2xl shadow-2xl w-full flex flex-col items-center">
      <div className="logo-container-sweep mb-8">
        <Image
          src="/logo.png"
          alt="Kompong Dewa Logo"
          width={320}
          height={80}
          className="h-16 w-auto shrink-0 object-contain"
          unoptimized
          priority
        />
        <div className="logo-sweep-overlay" />
      </div>

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
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-neutral-800 bg-neutral-950 text-white rounded-lg focus:outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-600"
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
              className="w-full pl-10 pr-10 py-2.5 text-sm border border-neutral-800 bg-neutral-950 text-white rounded-lg focus:outline-none focus:border-neutral-700 transition-colors placeholder:text-neutral-600"
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
          className="w-full py-2.5 text-sm font-medium text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-neutral-950">
      {/* Left side 60% - Image Panel */}
      <div className="hidden md:block md:w-[60%] relative overflow-hidden h-screen bg-neutral-950">
        <Image
          src="/kd-picture.webp"
          alt="Kompong Dewa Events Background"
          fill
          sizes="60vw"
          className="object-cover object-center zoom-effect select-none pointer-events-none"
          priority
        />
        {/* Subtle premium dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950/70 via-neutral-950/20 to-transparent" />
        
        {/* Decorative branding overlay on the bottom-left */}
        <div className="absolute bottom-12 left-12 z-10 text-white max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold tracking-wide mb-2 gold-gradient-text uppercase">
              KOMPONG DEWA EVENTS
            </h2>
            <p className="text-sm text-neutral-300 font-light leading-relaxed">
              Managing digital displays, event artworks, and jackpot media registries with precision and speed.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side 40% - Login Form Panel */}
      <div className="w-full md:w-[40%] flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 bg-neutral-950 min-h-screen overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[400px] flex flex-col gap-8"
        >
          {/* Form wrapped in Suspense for useSearchParams */}
          <Suspense fallback={
            <div className="bg-neutral-900 border border-neutral-800 p-6 flex justify-center py-12 rounded-2xl shadow-xl">
              <LoadingSpinner size={24} />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}
