'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Upload, FileImage, ChevronRight, CheckCircle2, CalendarX } from 'lucide-react';
import CheckedIcon from '@/components/icons/checked-icon';
import type { AnimatedIconHandle } from '@/components/icons/types';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';

const defaultEvents = [
  {
    id: 1,
    title: 'Kompong Dewa Integrated Resort',
    date: '',
    location: 'Sihanoukville, Cambodia',
    image: 'https://i.imgur.com/ykQuk5a.jpeg',
    tag: 'Resort & Casino',
  }
];

export default function EventRegistrationPage() {
  const [isEmbed, setIsEmbed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('embed') === 'true') {
        setIsEmbed(true);
      }
    }
  }, []);

  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLockedEvent, setIsLockedEvent] = useState(false);

  // The placeholder events above aren't real records, so they have no detail page.
  const currentEvent = events[currentEventIndex] || defaultEvents[0];
  const detailHref = typeof currentEvent?.id === 'string' ? `/event/${currentEvent.id}` : null;

  // Non-member fields
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [memberStatus, setMemberStatus] = useState<'member' | 'non-member' | null>(null);
  const [memberIdInput, setMemberIdInput] = useState('');
  const [wantsMembership, setWantsMembership] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasActiveEvents, setHasActiveEvents] = useState(true);
  // Set by the non-member flow
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

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
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
              status: ev.status,
            }));
          });

          setEvents(slides);

          const params = new URLSearchParams(window.location.search);
          const urlEventId = params.get('event');
          if (urlEventId) {
            const index = slides.findIndex((e: any) => e.id === urlEventId);
            if (index !== -1) {
              setCurrentEventIndex(index);
              setIsLockedEvent(true);
            }
          }
        } else {
          setHasActiveEvents(false);
        }
      })
      .catch(error => {
        console.error('Error fetching events:', error);
        setHasActiveEvents(false);
      })
      .finally(() => {
        setIsLoadingEvents(false);
      });
  }, []);

  useEffect(() => {
    if (events.length <= 1 || isLockedEvent) return;
    const interval = setInterval(() => {
      setCurrentEventIndex(prev => (prev + 1) % events.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [events.length, isLockedEvent]);

  const handleDragEnd = (event: any, info: any) => {
    if (events.length <= 1 || isLockedEvent) return;
    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => {
      return Math.abs(offset) * velocity;
    };
    const swipe = swipePower(info.offset.x, info.velocity.x);

    if (swipe < -swipeConfidenceThreshold) {
      setCurrentEventIndex((prev) => (prev + 1) % events.length);
    } else if (swipe > swipeConfidenceThreshold) {
      setCurrentEventIndex((prev) => (prev - 1 + events.length) % events.length);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.error('Please enter your full name');
    if (!phoneNumber.trim()) return toast.error('Please enter your phone number or email');
    if (memberStatus === 'member' && !memberIdInput.trim()) return toast.error('Please enter your Member ID');


    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('isNonMemberTab', memberStatus === 'member' ? 'false' : 'true');
      if (memberStatus === 'member') {
        formData.append('memberId', memberIdInput);
      } else {
        formData.append('wantsMembership', wantsMembership ? 'true' : 'false');
      }
      formData.append('name', name);
      formData.append('phoneNumber', phoneNumber);

      appendCurrentEvent(formData);

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

  const appendCurrentEvent = (formData: FormData) => {
    if (typeof currentEvent?.id === 'string') {
      formData.append('eventId', currentEvent.id);
      formData.append('eventTitle', currentEvent.title ?? '');
    }
  };

  const handleReset = () => {
    setResult(null);
    setName('');
    setPhoneNumber('');
    setMemberStatus(null);
    setMemberIdInput('');
    setWantsMembership(false);
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
      <div className={`min-h-[100dvh] overflow-y-auto flex flex-col items-center relative ${isEmbed ? "bg-transparent pt-4 pb-4" : "bg-[#F4F4F5] pt-16 md:pt-24 pb-12"}`}>

        {/* Top Banner: Event Previews Carousel */}
        {!isEmbed && (
          <div className="w-full max-w-[728px] aspect-[728/210] relative bg-black shrink-0 md:rounded-2xl shadow-xl overflow-hidden z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={`poster-${currentEventIndex}`}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.05}
                onDragEnd={handleDragEnd}
              >
                {isLoadingEvents ? (
                  <div className="w-full h-full relative flex items-center justify-center bg-black">
                    <Image
                      src={defaultEvents[0].image}
                      alt="Loading"
                      fill
                      className="object-cover opacity-40"
                      unoptimized
                    />
                    <Loader2 className="w-8 h-8 text-neutral-300 animate-spin z-10" />
                  </div>
                ) : (
                  <Image
                    src={events[currentEventIndex]?.image || defaultEvents[0].image}
                    alt={events[currentEventIndex]?.title || 'Event'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(to_top,rgba(0,0,0,0.5)_0%,rgba(0,0,0,0)_40%)]" />
            
            <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-3 flex items-center justify-between gap-3">
              {!isLoadingEvents && !isLockedEvent && (
                <div className="flex gap-2">
                  {events.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentEventIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentEventIndex ? 'w-6 bg-[#c3943a]' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentEventIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="px-2 py-0.5 md:py-1 bg-black/40 backdrop-blur-md rounded text-[10px] md:text-xs font-medium text-[#e5ac53] border border-white/20 whitespace-nowrap"
                  >
                    {events[currentEventIndex]?.tag || 'Event'}
                  </motion.div>
                </AnimatePresence>
                {hasActiveEvents && (
                  <span className={`px-2 md:px-3 py-0.5 md:py-1 text-white text-[10px] md:text-xs font-bold uppercase tracking-wider rounded-full shadow-lg whitespace-nowrap ${currentEvent?.status === 'UPCOMING' ? 'bg-amber-600' : 'bg-[#c3943a]'}`}>
                    {currentEvent?.status === 'UPCOMING' ? 'Coming Soon' : 'Live Event'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`w-full px-4 md:px-0 flex flex-col items-start ${isEmbed ? "mt-0 max-w-md mx-auto" : "max-w-[728px] md:flex-row gap-6 md:gap-8 mt-6 md:mt-8"}`}>
          
          {/* Left Side: Event Details */}
          {!isEmbed && (
            <div className="flex-1 flex flex-col w-full">
              <div className="min-h-[120px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentEventIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4"
                  >
                    {detailHref ? (
                      <Link href={detailHref} className="group inline-block">
                        <h1 className="text-2xl md:text-3xl font-black text-black leading-tight drop-shadow-sm group-hover:text-[#c3943a] transition-colors">
                          {currentEvent?.title || 'Upcoming Event'}
                        </h1>
                        <span className="inline-flex items-center gap-1 mt-1 text-[11px] md:text-sm font-semibold text-[#c3943a]">
                          Read details
                          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </Link>
                    ) : (
                      <h1 className="text-2xl md:text-3xl font-black text-black leading-tight drop-shadow-sm">
                        {currentEvent?.title || 'Upcoming Event'}
                      </h1>
                    )}
                    
                    <div className="flex flex-col gap-2 text-xs md:text-sm text-neutral-600 font-medium">
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
                    
                    {!detailHref && !isLoadingEvents && (
                      <p className="text-sm text-neutral-600 leading-relaxed font-normal pt-4 border-t border-neutral-200">
                        A seamless ecosystem of luxury, leisure, and entertainment.
                        Experience Sihanoukville’s new standard of a life well-lived. Kompong Dewa is an integrated luxury destination redefining Sihanoukville’s landscape. A bold fusion of high-octane excitement and serene tranquility, we stand as the new pulse of Cambodia’s rising coastal city.
                      </p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Right Side: Form Area */}
          <div className={`w-full shrink-0 relative z-30 flex flex-col justify-start bg-white rounded-2xl shadow-xl border border-neutral-200 px-5 pt-6 pb-8 ${isEmbed ? "w-full shadow-none border-none" : "md:w-[340px]"}`}>
            <div className="w-full relative z-10">

            {!hasActiveEvents && !isLoadingEvents ? (
              <div className="text-center py-10 px-4 flex flex-col items-center justify-center min-h-[250px]">
                <div className="w-20 h-20 bg-neutral-200/60 rounded-full flex items-center justify-center mb-6">
                  <CalendarX className="w-10 h-10 text-neutral-400" />
                </div>
                <h3 className="text-2xl font-black text-neutral-800 mb-3 tracking-tight">No Active Events</h3>
                <p className="text-sm text-neutral-500 max-w-[280px] mx-auto leading-relaxed">
                  There are currently no events open for registration. Please check back later!
                </p>
              </div>
            ) : !result ? (
              <>
                <h2 className="text-xl font-black text-neutral-800 tracking-tight mb-4">Registration Event</h2>

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

                    <div className="pt-2">
                      <label className="text-[11px] md:text-xs font-semibold text-neutral-600 block mb-2">Membership Status</label>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="memberStatus" 
                            value="member" 
                            checked={memberStatus === 'member'} 
                            onChange={() => setMemberStatus('member')} 
                            className="w-4 h-4 text-[#c3943a] border-neutral-300 focus:ring-[#c3943a]"
                            required
                          />
                          <span className="text-sm font-medium text-neutral-800">Member</span>
                        </label>
                        
                        <AnimatePresence>
                          {memberStatus === 'member' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: 'auto' }} 
                              exit={{ opacity: 0, height: 0 }}
                              className="pl-6 overflow-hidden"
                            >
                              <input
                                type="text"
                                value={memberIdInput}
                                onChange={(e) => setMemberIdInput(e.target.value)}
                                placeholder="Member ID (e.g. KDB-0000001...)"
                                className="w-full bg-white border border-neutral-200 focus:border-[#c3943a] focus:ring-2 focus:ring-[#c3943a]/20 rounded-lg px-3.5 py-2.5 mt-1 text-sm text-black placeholder:text-neutral-400 outline-none transition-all"
                                required={memberStatus === 'member'}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <label className="flex items-center gap-2 cursor-pointer mt-1">
                          <input 
                            type="radio" 
                            name="memberStatus" 
                            value="non-member" 
                            checked={memberStatus === 'non-member'} 
                            onChange={() => setMemberStatus('non-member')} 
                            className="w-4 h-4 text-[#c3943a] border-neutral-300 focus:ring-[#c3943a]"
                            required
                          />
                          <span className="text-sm font-medium text-neutral-800">Non-Member</span>
                        </label>

                        <AnimatePresence>
                          {memberStatus === 'non-member' && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: 'auto' }} 
                              exit={{ opacity: 0, height: 0 }}
                              className="pl-6 overflow-hidden"
                            >
                              <label className="flex items-start gap-2 cursor-pointer mt-1">
                                <input 
                                  type="checkbox" 
                                  checked={wantsMembership} 
                                  onChange={(e) => setWantsMembership(e.target.checked)} 
                                  className="w-4 h-4 mt-0.5 rounded text-[#c3943a] border-neutral-300 focus:ring-[#c3943a]"
                                />
                                <span className="text-[13px] leading-snug font-medium text-neutral-600">Want us to create a Member account for you?</span>
                              </label>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>

                  <button
                    type="submit"
                    disabled={isSubmitting || isLoadingEvents || !hasActiveEvents}
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
                    <div className="flex justify-between gap-4">
                      <dt className="text-neutral-500">Event:</dt>
                      <dd className="font-semibold text-black text-right line-clamp-2">{currentEvent?.title}</dd>
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
