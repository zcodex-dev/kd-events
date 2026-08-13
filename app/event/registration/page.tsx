'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, UserCheck, UserX, Loader2, Upload, FileImage, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

const defaultEvents = [
  {
    id: 1,
    title: 'Summer Tech Conference 2026',
    date: 'Aug 20 - 22, 2026',
    location: 'Kompong Dewa Resort',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop',
    tag: 'Conference',
  },
  {
    id: 2,
    title: 'Founders Networking Night',
    date: 'Sep 05, 2026',
    location: 'Sky Lounge, KD',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop',
    tag: 'Networking',
  },
  {
    id: 3,
    title: 'Web3 & AI Summit',
    date: 'Oct 12, 2026',
    location: 'Main Auditorium',
    image: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?q=80&w=2070&auto=format&fit=crop',
    tag: 'Summit',
  }
];

export default function EventRegistrationPage() {
  const [activeTab, setActiveTab] = useState<'member' | 'non-member'>('member');
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [memberIdInput, setMemberIdInput] = useState('');
  const [events, setEvents] = useState<any[]>(defaultEvents);

  // The placeholder events above aren't real records, so they have no detail page.
  const currentEvent = events[currentEventIndex];
  const detailHref = typeof currentEvent?.id === 'string' ? `/event/${currentEvent.id}` : null;

  // Non-member fields
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [passportFile, setPassportFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ isMember: boolean; memberId: string | null; memberData?: any } | null>(null);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          // Each image is its own slide, so an event with 3 images shows 3 times
          // with the same title/date/tag. Rows saved before the images array
          // only carry imageUrl.
          const slides = data.data.flatMap((ev: any) => {
            const images: string[] = ev.images?.length
              ? ev.images
              : ev.imageUrl
                ? [ev.imageUrl]
                : [defaultEvents[0].image];

            return images.map((image, i) => ({
              id: ev.id,
              slideKey: `${ev.id}-${i}`,
              title: ev.title,
              date: ev.date,
              location: ev.location,
              image,
              tag: ev.tag,
            }));
          });

          if (slides.length > 0) setEvents(slides);
        }
      })
      .catch(err => console.error('Failed to load events:', err));
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    const interval = setInterval(() => {
      setCurrentEventIndex((prev) => (prev + 1) % events.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [events]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'non-member') {
      if (!name.trim()) return toast.error('Please enter your full name');
      if (!phoneNumber.trim()) return toast.error('Please enter your phone number or email');
      if (!passportFile) return toast.error('Please upload your passport image');
    } else {
      if (!memberIdInput.trim()) return toast.error('Please enter your Member ID');
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('isNonMemberTab', activeTab === 'non-member' ? 'true' : 'false');

      if (activeTab === 'non-member') {
        formData.append('name', name);
        formData.append('phoneNumber', phoneNumber);
        if (passportFile) {
          formData.append('passportImage', passportFile);
        }
      } else {
        formData.append('memberId', memberIdInput);
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          isMember: data.isMember,
          memberId: data.memberId,
          memberData: data.memberData,
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
    setPhoneNumber('');
    setPassportFile(null);
    setMemberIdInput('');
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
      <header className="fixed top-0 left-0 w-full bg-[#000000]/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <div className="py-1">
            <Image
              src="/logo-v2.png"
              alt="Kompong Dewa Logo"
              width={200}
              height={48}
              className="h-10 w-auto shrink-0 object-contain filter brightness-0 invert"
              unoptimized
              priority
            />
          </div>
        </div>
      </header>

      {/* Mobile scrolls: the hero is a true 4:5 frame so a portrait poster fills it
          edge to edge, and the form follows underneath. Desktop keeps the
          locked split-screen. */}
      <div className="md:h-[100dvh] md:overflow-hidden bg-[#F4F4F5] flex flex-col md:flex-row relative pt-16 md:pt-0">
        
        {/* Left / Top Side: Event Previews Carousel */}
        {/* A 4:5 frame on mobile, so a 1200x1500 poster fills it exactly — no
            letterbox, no blurred filler, no seam to read as a cutoff. */}
        <div className="w-full aspect-[4/5] md:aspect-auto md:w-1/2 md:h-[100dvh] relative bg-black overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`poster-${currentEventIndex}`}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={events[currentEventIndex]?.image || defaultEvents[0].image}
                alt={events[currentEventIndex]?.title || 'Event'}
                fill
                className="object-cover"
                unoptimized
              />
            </motion.div>
          </AnimatePresence>

          {/* Single soft scrim, fully clear by 70% up — the text sits on the poster
              rather than in a band beneath it, so there is no hard edge anywhere. */}
          <div className="absolute inset-0 z-10 bg-[linear-gradient(to_top,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.78)_20%,rgba(0,0,0,0.38)_45%,rgba(0,0,0,0.12)_60%,rgba(0,0,0,0)_75%)]" />

          {/* Whole panel links to the detail page; sits under the content layers
              so the dots and badges stay independently clickable. */}
          {detailHref && (
            <Link
              href={detailHref}
              aria-label={`Read more about ${currentEvent?.title || 'this event'}`}
              className="absolute inset-0 z-10"
            />
          )}

          {/* Title and details float over the poster. pb clears the form card that
              overlaps this panel on mobile. */}
          <div className="absolute inset-x-0 bottom-0 z-20 px-6 pb-14 md:px-16 md:pb-16">
            <div className="min-h-[88px] md:min-h-[150px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentEventIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-y-3"
                >
                  {detailHref ? (
                    <Link href={detailHref} className="group inline-block">
                      <h1 className="text-xl md:text-5xl font-black text-white leading-tight drop-shadow-lg group-hover:text-[#e5ac53] transition-colors">
                        {currentEvent?.title || 'Upcoming Event'}
                      </h1>
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] md:text-sm font-semibold text-[#e5ac53]">
                        Read details
                        <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  ) : (
                    <h1 className="text-xl md:text-5xl font-black text-white leading-tight drop-shadow-lg">
                      {currentEvent?.title || 'Upcoming Event'}
                    </h1>
                  )}
                  <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-6 text-xs md:text-sm text-neutral-300 font-medium">
                    {events[currentEventIndex]?.date && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c3943a]" />
                        {events[currentEventIndex].date}
                      </div>
                    )}
                    {events[currentEventIndex]?.location && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#c3943a]" />
                        {events[currentEventIndex].location}
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Bottom row: carousel indicators left, event labels bottom-right */}
            <div className="flex items-center justify-between gap-3 mt-8">
              <div className="flex gap-2">
                {events.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentEventIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentEventIndex ? 'w-8 bg-[#c3943a]' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentEventIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="px-2 py-0.5 md:py-1 bg-white/10 backdrop-blur-md rounded text-[10px] md:text-xs font-medium text-[#e5ac53] border border-white/10 whitespace-nowrap"
                  >
                    {events[currentEventIndex]?.tag || 'Event'}
                  </motion.div>
                </AnimatePresence>
                <span className="px-2.5 py-0.5 md:px-3 md:py-1 bg-[#c3943a] text-white text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-full shadow-lg whitespace-nowrap">
                  Upcoming Events
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right / Bottom Side: Form Area */}
        <div className="relative z-30 -mt-8 md:mt-0 w-full md:w-1/2 md:h-[100dvh] flex flex-col justify-start md:justify-center items-center px-5 pt-6 pb-10 md:p-12 bg-[#F4F4F5] rounded-t-3xl md:rounded-none shadow-[0_-10px_30px_rgba(0,0,0,0.25)] md:shadow-none md:overflow-y-auto">
          {/* Grab handle — mobile only, signals the sheet */}
          <div className="w-10 h-1 rounded-full bg-neutral-300 mb-5 shrink-0 md:hidden" />
          <div className="w-full max-w-md relative z-10">


          {!result ? (
            <>
              {/* Tabs */}
              <div className="flex bg-neutral-200/50 p-1 rounded-lg mb-4 md:mb-6">
                <button
                  type="button"
                  onClick={() => { setActiveTab('member'); handleReset(); }}
                  className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-md transition-all ${activeTab === 'member'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-500 hover:text-black'
                    }`}
                >
                  Member
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('non-member'); handleReset(); }}
                  className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-md transition-all ${activeTab === 'non-member'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-neutral-500 hover:text-black'
                    }`}
                >
                  Non-Member
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'non-member' ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                    <div>
                      <label className="text-[11px] md:text-xs font-semibold text-neutral-600 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Lokas.K"
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
                      <label className="text-[11px] md:text-xs font-semibold text-neutral-600 block mb-1">Passport Image</label>
                      <label className="w-full flex flex-col items-center justify-center h-20 md:h-24 border-2 border-dashed border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 cursor-pointer transition-colors relative overflow-hidden">
                        {passportFile ? (
                          <div className="flex flex-col items-center text-orange-500">
                            <FileImage className="w-6 h-6 mb-1" />
                            <span className="text-[11px] md:text-xs font-medium truncate max-w-[200px] px-4">{passportFile.name}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-neutral-400">
                            <Upload className="w-5 h-5 mb-1" />
                            <span className="text-[11px] md:text-xs font-medium">Click to upload passport</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      </label>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <label className="text-[11px] md:text-xs font-semibold text-neutral-600 block mb-1">Member ID</label>
                    <input
                      type="text"
                      value={memberIdInput}
                      onChange={(e) => setMemberIdInput(e.target.value)}
                      placeholder="e.g. KD-0001"
                      className="w-full bg-white border border-neutral-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-lg px-3.5 md:px-4 py-2.5 md:py-3 text-sm md:text-base text-black placeholder:text-neutral-400 transition-all outline-none"
                      required
                    />
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#c3943a] hover:bg-[#e5ac53] text-white text-sm md:text-base font-bold py-3 md:py-3.5 px-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 mt-5 md:mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>{activeTab === 'member' ? 'Login' : 'Register Events'}</span>
                  )}
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center w-full"
            >
              {result.isMember ? (
                <div className="w-full pb-6 pt-4">
                  <div className="flex justify-center mb-6">
                    {result.memberData?.avatarUrl || result.memberData?.memberId || result.memberId ? (
                      <img src={result.memberData?.avatarUrl || `https://i.pravatar.cc/150?u=${result.memberData?.memberId || result.memberId}`} alt={result.memberData?.name} className="w-24 h-24 rounded-full border-4 border-[#F4F4F5] shadow-lg object-cover" />
                    ) : (
                      <div className="w-24 h-24 bg-[#c3943a]/10 rounded-full flex items-center justify-center shadow-sm">
                        <UserCheck className="w-10 h-10 text-[#c3943a]" />
                      </div>
                    )}
                  </div>
                  
                  <div className="px-6">
                    <h2 className="text-xl md:text-2xl font-black text-black">{result.memberData?.name || 'Member Name'}</h2>
                    <p className="text-xs md:text-sm text-neutral-500 mt-1 font-medium">ID: {result.memberData?.memberId || result.memberId}</p>
                    
                    {result.memberData?.memberType && (
                      <div className="mt-4">
                        <span className="inline-block px-4 py-1.5 bg-black text-white font-bold rounded-full text-xs md:text-sm shadow-sm border border-neutral-800">
                          {result.memberData.memberType} Tier
                        </span>
                      </div>
                    )}
                    
                    <button onClick={handleReset} className="mt-6 md:mt-8 w-full bg-[#c3943a] hover:bg-[#e5ac53] text-white text-sm md:text-base font-bold py-3 md:py-3.5 rounded-lg transition-all shadow-md">
                      Enjoy the Event
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 px-6">
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserX className="w-10 h-10 text-blue-600" />
                    </div>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-black mb-2">Registration Received</h2>
                  <p className="text-neutral-500 text-xs md:text-sm mb-6 md:mb-8">
                    Please contact our marketing team via Telegram to verify your status.
                  </p>
                  
                  <a
                    href="https://t.me/KompongDewaMarketing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-[#229ED9] hover:bg-[#1CA0DE] text-white text-sm md:text-base py-3 md:py-3.5 rounded-lg font-medium transition-colors shadow-md"
                  >
                    Contact via Telegram
                  </a>
                  
                  <button
                    onClick={handleReset}
                    className="w-full text-neutral-500 text-xs md:text-sm font-medium mt-4 py-2 hover:text-black transition-colors"
                  >
                    Back to registration
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
    </>
  );
}
