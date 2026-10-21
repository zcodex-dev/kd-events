'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  CreditCard, 
  FileImage,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { getStaffMember } from '@/lib/staff-data';

export default function StaffProfilePage() {
  const params = useParams();
  const rawId = typeof params?.id === 'string' ? params.id : 'MK-C052';
  const staff = getStaffMember(rawId);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Sync theme with system or previous choice
  useEffect(() => {
    const saved = localStorage.getItem('kd_staff_theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('kd_staff_theme', next);
  };

  if (!staff) {
    return (
      <div className="min-h-screen bg-[#0e1015] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold mb-2">Staff Record Not Found</h1>
        <p className="text-white/60 text-sm max-w-sm mb-6">
          The requested management credential ({rawId}) does not exist in the official directory.
        </p>
        <a
          href="https://kompongdewa.win"
          className="px-5 py-2 rounded-lg bg-[#c59b27] text-black font-semibold text-xs"
        >
          Return to Homepage
        </a>
      </div>
    );
  }

  // Export Badge Image as PNG or JPEG
  const handleDownloadImage = (format: 'png' | 'jpeg') => {
    setIsExporting(true);
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = staff.badgeUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 639;
        canvas.height = img.naturalHeight || 1017;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsExporting(false);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const extension = format === 'png' ? 'png' : 'jpg';
        const dataUrl = canvas.toDataURL(mimeType, 0.95);

        const link = document.createElement('a');
        link.download = `${staff.firstName}_${staff.lastName}_ID_Card.${extension}`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExporting(false);
      };
      img.onerror = () => {
        setIsExporting(false);
        const link = document.createElement('a');
        link.href = staff.badgeUrl;
        link.download = `${staff.firstName}_${staff.lastName}_ID_Card.png`;
        link.click();
      };
    } catch {
      setIsExporting(false);
    }
  };

  const isDark = theme === 'dark';

  // Animation variants for smooth reveal
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
      },
    },
  };

  return (
    <main
      className={`min-h-screen w-full flex flex-col items-center justify-start pt-6 pb-16 px-5 transition-colors duration-300 ${
        isDark ? 'bg-[#0c0d11] text-[#f4f4f6]' : 'bg-[#f4f5f8] text-[#0f172a]'
      }`}
    >
      <div className="w-full max-w-[460px] flex flex-col items-center relative">
        {/* Top Floating Theme Switcher */}
        <div className="w-full flex justify-end mb-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className={`p-2 rounded-xl transition-all duration-200 border ${
              isDark
                ? 'bg-[#16181f] border-[#262933] text-amber-300 hover:bg-[#1e212b]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full flex flex-col items-center text-center"
        >
          {/* Portrait Headshot */}
          <motion.div variants={itemVariants} className="relative cursor-pointer" onClick={() => setShowBadgeModal(true)}>
            <div
              className={`w-32 h-32 rounded-full p-1 border-2 transition-transform duration-200 hover:scale-[1.03] ${
                isDark ? 'border-[#c59b27] bg-[#16181f]' : 'border-[#c59b27] bg-white shadow-md'
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden relative">
                <Image
                  src={staff.avatarUrl}
                  alt={staff.fullName}
                  fill
                  className="object-cover"
                  style={{ objectPosition: '50% 43%', transform: 'scale(1.85)' }}
                  unoptimized
                  priority
                />
              </div>
            </div>

            {/* Badge pill */}
            <div
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 shadow-sm whitespace-nowrap ${
                isDark
                  ? 'bg-[#16181f] border-[#c59b27] text-[#f5d77f]'
                  : 'bg-white border-[#c59b27] text-[#92400e]'
              }`}
            >
              <CreditCard className="w-3 h-3 text-[#c59b27]" />
              <span>Physical Badge</span>
            </div>
          </motion.div>

          {/* Name & Title */}
          <motion.div variants={itemVariants} className="mt-5">
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center justify-center gap-1.5">
              <span className="text-[#c59b27]">{staff.firstName}</span>
              <span className={isDark ? 'text-white' : 'text-slate-900'}>{staff.lastName}</span>
              <CheckCircle2 className="w-5 h-5 text-[#c59b27]" />
            </h1>
            <p className={`text-base font-semibold mt-1 ${isDark ? 'text-white/90' : 'text-slate-800'}`}>
              {staff.position}
            </p>
            <p className="text-xs font-bold tracking-wider uppercase text-[#c59b27] mt-0.5">
              {staff.department}
            </p>
          </motion.div>

          {/* Personnel ID */}
          <motion.div variants={itemVariants} className="mt-3">
            <span
              className={`px-3 py-1 rounded-lg font-mono text-xs font-bold tracking-wider border ${
                isDark
                  ? 'bg-[#16181f] border-[#262933] text-white/90'
                  : 'bg-white border-slate-200 text-slate-800 shadow-sm'
              }`}
            >
              ID: {staff.personnelId}
            </span>
          </motion.div>

          {/* Primary Solid Action Buttons */}
          <motion.div variants={itemVariants} className="w-full grid grid-cols-2 gap-3 mt-6">
            <a
              href={`/api/staff/${staff.normalizedId}/vcard`}
              download={`${staff.firstName}_${staff.lastName}.vcf`}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#c59b27] hover:bg-[#d4af37] text-black font-bold text-xs uppercase tracking-wider transition-all duration-150 active:scale-[0.98] shadow-sm"
            >
              <Download className="w-4 h-4 text-black" />
              <span>Save Contact</span>
            </a>

            <button
              onClick={() => setShowBadgeModal(true)}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all duration-150 active:scale-[0.98] ${
                isDark
                  ? 'bg-[#16181f] hover:bg-[#1e212b] border-[#262933] text-white'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-sm'
              }`}
            >
              <FileImage className="w-4 h-4 text-[#c59b27]" />
              <span>Save ID Card</span>
            </button>
          </motion.div>

          {/* Solid Linktree Social and Contact Cards */}
          <motion.section variants={itemVariants} className="w-full mt-6 flex flex-col gap-2.5">
            {staff.socials.map((link) => (
              <motion.a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                variants={itemVariants}
                className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-150 active:scale-[0.99] ${
                  isDark
                    ? 'bg-[#14161c] hover:bg-[#1b1e27] border-[#232630] hover:border-[#c59b27]/80'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-[#c59b27]/80 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Official CDN Icon with vibrant brand color */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center p-2 border shrink-0 transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${link.brandColor}22`,
                      borderColor: `${link.brandColor}44`,
                    }}
                  >
                    {link.platform === 'Resort' ? (
                      <div className="w-6 h-6 relative flex items-center justify-center">
                        <Image
                          src="/kd-logo.png"
                          alt="Kompong Dewa"
                          width={24}
                          height={24}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div
                        className="w-5 h-5 transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor:
                            link.platform === 'X.com'
                              ? isDark
                                ? '#ffffff'
                                : '#000000'
                              : link.brandColor,
                          WebkitMaskImage: `url(${link.iconCdn})`,
                          maskImage: `url(${link.iconCdn})`,
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                        }}
                      />
                    )}
                  </div>

                  <div className="text-left">
                    <p
                      className={`text-sm font-bold transition-colors group-hover:text-[#c59b27] ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {link.label}
                    </p>
                    <p className={`text-xs font-mono mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                      {link.handle}
                    </p>
                  </div>
                </div>

                <div className={`pr-1 ${isDark ? 'text-white/30 group-hover:text-white/80' : 'text-slate-400 group-hover:text-slate-800'}`}>
                  <ExternalLink className="w-4 h-4" />
                </div>
              </motion.a>
            ))}
          </motion.section>
        </motion.div>
      </div>

      {/* Modal: Physical Badge Preview & PNG / JPEG Save */}
      <AnimatePresence>
        {showBadgeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowBadgeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-2xl p-5 max-w-sm w-full relative flex flex-col items-center text-center border shadow-2xl ${
                isDark ? 'bg-[#14161d] border-[#262933] text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowBadgeModal(false)}
                className={`absolute top-3.5 right-3.5 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 text-xs font-bold text-[#c59b27] mb-3">
                <CreditCard className="w-4 h-4" />
                <span>Physical ID Badge Replica</span>
              </div>

              {/* Physical Badge Image */}
              <div className="w-full relative aspect-[639/1017] rounded-xl overflow-hidden border border-[#c59b27]/70 shadow-lg my-1">
                <Image
                  src={staff.badgeUrl}
                  alt={`${staff.fullName} ID Card`}
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                />
              </div>

              <p className={`text-xs mt-3 mb-3 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                Save card directly to your device:
              </p>

              {/* PNG / JPEG Buttons */}
              <div className="grid grid-cols-2 gap-2.5 w-full">
                <button
                  disabled={isExporting}
                  onClick={() => handleDownloadImage('png')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#c59b27] hover:bg-[#d4af37] text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-black" />
                  <span>Save as PNG</span>
                </button>

                <button
                  disabled={isExporting}
                  onClick={() => handleDownloadImage('jpeg')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg font-bold text-xs uppercase tracking-wider border transition-all disabled:opacity-50 ${
                    isDark
                      ? 'bg-[#1e212b] hover:bg-[#252936] border-[#2e3342] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-900'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save as JPEG</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
