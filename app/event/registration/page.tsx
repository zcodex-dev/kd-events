'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, UserCheck, UserX, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function EventRegistrationPage() {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ isMember: boolean; memberId: string | null } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, contact }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          isMember: data.isMember,
          memberId: data.memberId,
        });
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setName('');
    setContact('');
  };

  return (
    <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-700/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl"
        >
          {/* Logo / Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Event Registration</h1>
            <p className="text-sm text-neutral-400 mt-2">
              Enter your details to register for the event.
            </p>
          </div>

          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lokas.K"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-3.5 text-white placeholder:text-neutral-600 transition-all outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex justify-between">
                  <span>Contact Number</span>
                  <span className="text-neutral-500 text-[10px] normal-case">(Optional if Member)</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Telegram / WhatsApp Number"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 rounded-xl px-4 py-3.5 text-white placeholder:text-neutral-600 transition-all outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking details...
                  </>
                ) : (
                  <>
                    <span>Register Now</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              {result.isMember ? (
                <div className="py-6 space-y-4">
                  <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto">
                    <UserCheck className="w-10 h-10 text-green-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Welcome Back!</h2>
                    <p className="text-neutral-400 text-sm">
                      Your registration has been confirmed.
                    </p>
                  </div>
                  <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 inline-block">
                    <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">Member ID</p>
                    <p className="text-2xl font-black text-amber-500">{result.memberId}</p>
                  </div>
                </div>
              ) : (
                <div className="py-6 space-y-4">
                  <div className="w-20 h-20 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto">
                    <UserX className="w-10 h-10 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Registration Received</h2>
                    <p className="text-neutral-400 text-sm">
                      You are currently not listed as a registered member.
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-neutral-800">
                    <p className="text-sm font-medium text-neutral-300 mb-4">
                      Please contact our marketing team via Telegram to verify your status or sign up.
                    </p>
                    <a
                      href="https://t.me/KompongDewaMarketing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-[#2AABEE]/20 transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Contact via Telegram
                    </a>
                  </div>
                </div>
              )}

              <button
                onClick={handleReset}
                className="text-xs font-bold text-neutral-500 hover:text-white transition-colors"
              >
                Register another person
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
