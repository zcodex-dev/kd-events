'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Upload, FileImage, ChevronRight, CheckCircle2, CalendarX } from 'lucide-react';
import CheckedIcon from '@/components/icons/checked-icon';
import type { AnimatedIconHandle } from '@/components/icons/types';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import Tesseract from 'tesseract.js';



export default function EnrollmentPage() {
  const [embedMode, setEmbedMode] = useState<'full' | 'form' | null>(null);
  const [bgImage, setBgImage] = useState('https://i.imgur.com/ETXgnCg.jpeg');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const embedParam = params.get('embed');
      if (embedParam === 'form' || embedParam === 'minimal') {
        setEmbedMode('form');
      } else if (embedParam === 'true' || embedParam === 'full' || embedParam === 'all') {
        setEmbedMode('full');
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

  const isEmbed = embedMode !== null;
  const showBanner = embedMode !== 'form';
  const showTitle = embedMode !== 'form';

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nationality, setNationality] = useState('');
  const [passportFile, setPassportFile] = useState<File | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');

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

  const passportLine1Regex = /^P[A-Z<][A-Z<0-9]{42}$/;
  const passportLine2Regex = /^[A-Z0-9<]{44}$/;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError('');
    setScanSuccess('');
    setPassportFile(null); // Clear previous valid file while scanning

    try {
      const result = await Tesseract.recognize(file, 'eng');
      const text = result.data.text;
      
      const lines = text.split('\n').map(line => line.trim().replace(/\s+/g, '')); // MRZ lines usually don't have spaces, but OCR might add them
      
      let isValid = false;
      for (const line of lines) {
        if (passportLine1Regex.test(line) || passportLine2Regex.test(line)) {
          isValid = true;
          break;
        }
      }

      // Fallback check
      if (!isValid && text.toLowerCase().includes('passport')) {
        isValid = true;
      }

      if (isValid) {
        setPassportFile(file);
        setScanSuccess('Passport verified successfully!');
        toast.success('Passport verified successfully!');
      } else {
        setScanError('Please upload a valid passport image. Selfies or random images are not allowed.');
        toast.error('Invalid passport image. Please try again.');
        e.target.value = ''; // Reset input
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setScanError('Failed to scan image. Please try again.');
      toast.error('Failed to scan image. Please try again.');
      e.target.value = ''; // Reset input
    } finally {
      setIsScanning(false);
    }
  };

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
      formData.append('nationality', nationality);
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
    setScanSuccess('');
    setScanError('');
  };

  return (
    <>
      {/* Navigation / Header (Hidden on Embed) */}
      {!isEmbed && (
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
      )}

      {/* Centered layout */}
      <div className={`flex flex-col items-center relative ${isEmbed ? "w-full min-h-0 bg-transparent p-0" : "min-h-[100dvh] overflow-y-auto bg-white md:bg-[#F4F4F5] pt-16 md:pt-24 md:pb-12"}`}>
        {/* Left Side: Static Background Image (Included on full embed & normal view) */}
        {showBanner && (
          <div className={`relative w-full max-w-[728px] aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] min-h-[260px] sm:min-h-[300px] overflow-hidden shrink-0 ${isEmbed ? "rounded-t-2xl border-t border-x border-neutral-200" : "md:rounded-t-2xl"}`}>
            <Image
              src={bgImage}
              alt="Kompong Dewa Integrated Resort"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.6)_55%,rgba(0,0,0,0)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-5 sm:px-8 sm:pb-7 flex flex-col items-start justify-end gap-1.5 sm:gap-2 text-left">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
                Kompong Dewa Integrated Resort
              </h1>
              
              <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-300 font-medium mb-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c3943a]" />
                Sihanoukville, Cambodia
              </div>
              
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-normal max-w-[620px] line-clamp-3 sm:line-clamp-none block">
                A seamless ecosystem of luxury, leisure, and entertainment.
                Experience Sihanoukville’s new standard of a life well-lived. Kompong Dewa is an integrated luxury destination redefining Sihanoukville’s landscape.
              </p>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`w-full flex flex-col items-center ${embedMode === 'form' ? "w-full max-w-xl mx-auto p-0" : "max-w-[728px] mt-0"}`}>
          
          {/* Form Area */}
          <div className={`w-full relative z-30 flex flex-col justify-start bg-white ${
            embedMode === 'form' 
              ? "p-4 sm:p-6 rounded-2xl border border-neutral-200/80 shadow-xs" 
              : isEmbed
                ? "px-5 md:px-8 pt-6 md:pt-8 pb-8 md:pb-10 rounded-b-2xl border-x border-b border-neutral-200 shadow-sm"
                : "px-5 md:px-8 pt-6 md:pt-8 pb-8 md:pb-10 shadow-none md:shadow-xl md:rounded-b-2xl md:border-x md:border-b border-neutral-200"
          }`}>
            <div className="w-full relative z-10 max-w-[480px] mx-auto">

            {!result ? (
              <>
                {showTitle && (
                  <h2 className="text-xl font-black text-neutral-800 tracking-tight mb-4">Membership Enrollment</h2>
                )}

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
                      <label className={`w-full flex flex-row items-center justify-center gap-2 h-[44px] md:h-[50px] border-2 ${scanError ? 'border-red-400 bg-red-50' : 'border-dashed border-neutral-300 bg-white hover:bg-neutral-50'} rounded-lg transition-colors relative overflow-hidden cursor-pointer`}>
                        {isScanning ? (
                          <>
                            <Loader2 className="w-4 h-4 text-[#c3943a] animate-spin shrink-0" />
                            <span className="text-[10px] md:text-xs font-medium text-[#c3943a]">Scanning ID...</span>
                          </>
                        ) : passportFile ? (
                          <>
                            <FileImage className="w-4 h-4 text-[#c3943a] shrink-0" />
                            <span className="text-[10px] md:text-xs font-medium truncate max-w-[200px] text-[#c3943a]">{passportFile.name}</span>
                          </>
                        ) : (
                          <>
                            <Upload className={`w-4 h-4 ${scanError ? 'text-red-500' : 'text-neutral-400'} shrink-0`} />
                            <span className={`text-[10px] md:text-xs font-medium ${scanError ? 'text-red-500' : 'text-neutral-400'}`}>Click to upload (Required)</span>
                          </>
                        )}
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" required disabled={isScanning} />
                      </label>
                      {scanError && (
                        <p className="text-[10px] md:text-xs text-red-500 mt-1 font-medium">{scanError}</p>
                      )}
                      {scanSuccess && (
                        <p className="text-[10px] md:text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {scanSuccess}
                        </p>
                      )}
                    </div>
                  </motion.div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isScanning}
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
