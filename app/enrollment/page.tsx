'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Upload, FileImage, ChevronRight, CheckCircle2, CalendarX } from 'lucide-react';
import CheckedIcon from '@/components/icons/checked-icon';
import type { AnimatedIconHandle } from '@/components/icons/types';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';



export default function EnrollmentPage() {
  const [isEmbed, setIsEmbed] = useState(false);
  const [bgImage, setBgImage] = useState('https://i.imgur.com/ETXgnCg.jpeg');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('embed') === 'true') {
        setIsEmbed(true);
      }
    }

    // Fetch config for dynamic background
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.enrollmentBgUrl) {
          setBgImage(data.data.enrollmentBgUrl);
        }
      })
      .catch(err => console.error('Failed to load config:', err));
  }, []);



  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportFile, setPassportFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ isMember: boolean; memberId: string | null; memberData?: any; registration?: any } | null>(null);

  const iconRef = useRef<AnimatedIconHandle>(null);

  useEffect(() => {
    if (result && iconRef.current) {
      const timer = setTimeout(() => {
        iconRef.current?.startAnimation();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [result]);

  const formatDate = (value?: string | null) =>
    value
      ? new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.error('Please enter your full name');
    if (!phoneNumber.trim()) return toast.error('Please enter your phone number or email');
    if (!passportFile) return toast.error('Please upload your ID/Passport image');

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('isNonMemberTab', 'true');
      formData.append('wantsMembership', 'true'); // Implicit for enrollment
      formData.append('name', name);
      formData.append('phoneNumber', phoneNumber);
      formData.append('passportId', nationality); // Map nationality to passportId for API
      formData.append('passportImage', passportFile);

      const response = await fetch('/api/register', { method: 'POST', body: formData });
      const data = await response.json();

      if (data.success) {
        setResult({ isMember: data.isMember, memberId: data.memberId, memberData: data.memberData, registration: data.registration });
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
    setPhoneNumber('');
    setNationality('');
    setPassportFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPassportFile(file);
    }
  };


  return (
    <>
      {/* Navigation / Header */}
      <header className="fixed top-0 left-0 w-full bg-black backdrop-blur-md border-b border-white/10 z-50">
        <div className="w-full px-4 md:px-8 h-16 md:h-20 flex items-center">
          <div className="py-1 md:py-2">
            <Image
              src="/logo-v2.png"
              alt="Kompong Dewa Logo"
              width={300}
              height={64}
              className="h-12 md:h-16 w-auto shrink-0 object-contain"
              unoptimized
              priority
            />
          </div>
        </div>
      </header>

      {/* Centered layout for strict 728x210 banner */}
      <div className={`min-h-[100dvh] overflow-y-auto flex flex-col items-center relative ${isEmbed ? "bg-transparent pt-4 pb-4" : "bg-[#F4F4F5] pt-16 md:pt-24 pb-12"}`}>        {/* Left Side: Static Background Image (Hidden on Embed) */}
        {!isEmbed && (
          <div className="relative w-full max-w-[728px] aspect-[4/3] md:aspect-[16/9] overflow-hidden shrink-0">
            <Image
              src={bgImage}
              alt="Kompong Dewa Integrated Resort"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.5)_50%,rgba(0,0,0,0)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-6 md:px-8 md:pb-8 flex flex-col items-start justify-end gap-2 text-left">
              <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
                Kompong Dewa Integrated Resort
              </h1>
              
              <div className="flex items-center gap-2 text-xs md:text-sm text-neutral-300 font-medium mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c3943a]" />
                Sihanoukville, Cambodia
              </div>
              
              <p className="text-sm text-neutral-300 leading-relaxed font-normal max-w-[600px] mt-1 hidden md:block">
                A seamless ecosystem of luxury, leisure, and entertainment.
                Experience Sihanoukville’s new standard of a life well-lived. Kompong Dewa is an integrated luxury destination redefining Sihanoukville’s landscape.
              </p>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`w-full px-4 md:px-0 flex flex-col items-center ${isEmbed ? "mt-0 max-w-md mx-auto" : "max-w-[728px] mt-6 md:mt-8"}`}>
          
          {/* Form Area */}
          <div className={`w-full relative z-30 flex flex-col justify-start bg-white rounded-2xl shadow-xl border border-neutral-200 px-5 pt-6 pb-8 ${isEmbed ? "w-full shadow-none border-none" : "max-w-[480px]"}`}>
            <div className="w-full relative z-10">

            {!result ? (
              <>
                <h2 className="text-xl font-black text-neutral-800 tracking-tight mb-4">Membership Enrollment</h2>

                <form onSubmit={handleSubmit} className="space-y-4 flex flex-col min-h-[340px] md:min-h-[380px]">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 flex-1">
                    <div>
                      <label className="text-[11px] md:text-xs font-semibold text-neutral-600 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full bg-white border border-neutral-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg px-3.5 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-black placeholder:text-neutral-400 transition-all outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] md:text-xs font-semibold text-neutral-600 block mb-1">Phone Number / Email</label>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+62 812... or name@email.com"
                        className="w-full bg-white border border-neutral-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg px-3.5 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-black placeholder:text-neutral-400 transition-all outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] md:text-xs font-semibold text-neutral-600 block mb-1">Nationality</label>
                      <input
                        type="text"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        placeholder="Enter your nationality"
                        className="w-full bg-white border border-neutral-200 focus:border-[#c3943a] focus:ring-2 focus:ring-[#c3943a]/20 rounded-lg px-3.5 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-black placeholder:text-neutral-400 transition-all outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] md:text-xs font-semibold text-neutral-600 block mb-1">Upload ID/Passport <span className="text-red-500">*</span></label>
                      <label className="w-full flex flex-row items-center justify-center gap-2 h-[44px] md:h-[50px] border-2 border-dashed border-neutral-300 rounded-lg transition-colors relative overflow-hidden bg-white hover:bg-neutral-50 cursor-pointer">
                        {passportFile ? (
                          <>
                            <FileImage className="w-4 h-4 text-[#c3943a] shrink-0" />
                            <span className="text-[10px] md:text-xs font-medium truncate max-w-[200px] text-[#c3943a]">{passportFile.name}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-neutral-400 shrink-0" />
                            <span className="text-[10px] md:text-xs font-medium text-neutral-400">Click to upload (Required)</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" required />
                      </label>
                    </div>
                  </motion.div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 md:mt-6 bg-[#c3943a] hover:bg-[#a67c2c] text-white py-3 md:py-3.5 rounded-lg font-bold text-sm md:text-base flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-[#c3943a]/20 shrink-0 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2 relative z-10">
                        Submit Registration
                        <Send className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 md:py-8 flex flex-col items-center min-h-[340px] md:min-h-[380px] justify-center"
              >
                <div className="mb-4 relative">
                  <CheckedIcon ref={iconRef} className="w-16 h-16 md:w-20 md:h-20" />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-black mb-2 px-2">Registration Successful</h3>
                {result.isMember && result.memberId ? (
                  <p className="text-sm text-neutral-600 mb-6 font-medium">
                    Welcome back! We matched your details to Member <span className="font-bold text-[#c3943a] block mt-1">{result.memberId}</span>
                  </p>
                ) : (
                  <p className="text-sm text-neutral-600 mb-6">
                    Thank you! Your registration has been received and is being processed.
                  </p>
                )}
                
                <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 w-full mb-6 text-left">
                  <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3 border-b border-neutral-200 pb-2">Registration Details</h4>
                  <dl className="space-y-2 text-xs md:text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-neutral-500">Name:</dt>
                      <dd className="font-semibold text-black truncate">{name}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-neutral-500">Contact:</dt>
                      <dd className="font-semibold text-black truncate">{phoneNumber}</dd>
                    </div>

                  </dl>
                </div>
                
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-lg transition-colors"
                >
                  Register Another Person
                </button>
              </motion.div>
            )}

            </div>
          </div>
        </div>

      </div>

    </>
  );
}
