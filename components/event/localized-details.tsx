'use client';

import { useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type LocalizedEventDetailsProps = {
  event: {
    title: string;
    description: string | null;
    titleZh: string | null;
    descriptionZh: string | null;
    titleId: string | null;
    descriptionId: string | null;
    date: string | null;
    location: string | null;
    tag: string | null;
  };
  cover: string;
  gallery: string[];
};

function wrapTables(html: string) {
  return html
    .replace(/<table/gi, '<div class="event-table-wrap"><table')
    .replace(/<\/table>/gi, '</table></div>');
}

export function LocalizedEventDetails({ event, cover, gallery }: LocalizedEventDetailsProps) {
  const [lang, setLang] = useState<'en' | 'id' | 'zh'>('en');

  const currentTitle = lang === 'en' ? event.title : lang === 'id' ? (event.titleId || event.title) : (event.titleZh || event.title);
  
  const descSource = lang === 'en' ? event.description : lang === 'id' ? (event.descriptionId || event.description) : (event.descriptionZh || event.description);
  
  const hasId = !!(event.descriptionId || event.titleId);
  const hasZh = !!(event.descriptionZh || event.titleZh);
  const hasMultipleLangs = hasId || hasZh;

  return (
    <>
      <div className="relative w-full bg-black flex justify-center">
        <img
          src={cover}
          alt=""
          className="w-full h-auto max-h-[60vh] md:max-h-[75vh] object-contain opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/40 to-transparent pointer-events-none" />

        <div className="absolute inset-x-0 bottom-0 max-w-4xl mx-auto px-6 md:px-8 pb-6 md:pb-10 z-10 pointer-events-none">
          {event.tag && (
            <div className="inline-block px-2 py-0.5 md:py-1 mb-3 bg-white/10 backdrop-blur-md rounded text-[10px] md:text-xs font-medium text-[#e5ac53] border border-white/10 pointer-events-auto">
              {event.tag}
            </div>
          )}
          <h1 className="text-2xl md:text-4xl font-black text-white leading-tight drop-shadow-lg pointer-events-auto transition-all duration-300">
            {currentTitle}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-8">
        {(event.date || event.location) && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-5 border-b border-white/10 text-xs md:text-sm text-neutral-300 font-medium">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-1">
              {event.date && (
                <div className="flex items-start sm:items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#c3943a] shrink-0 mt-0.5 sm:mt-0" />
                  <span>{event.date}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-start sm:items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#c3943a] shrink-0 mt-0.5 sm:mt-0" />
                  <span className="max-w-xl">{event.location}</span>
                </div>
              )}
            </div>
            
            <div className="flex bg-white/5 backdrop-blur border border-white/10 p-1 rounded-lg w-full sm:w-auto overflow-hidden shrink-0">
              <button type="button" onClick={() => setLang('en')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${lang === 'en' ? 'bg-[#c3943a] shadow-sm text-white' : 'text-neutral-400 hover:text-white'}`}>
                <img src="https://flagcdn.com/w20/gb.png" alt="English" className="w-4 h-auto rounded-sm opacity-90" /> EN
              </button>
              {hasId && (
                <button type="button" onClick={() => setLang('id')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${lang === 'id' ? 'bg-[#c3943a] shadow-sm text-white' : 'text-neutral-400 hover:text-white'}`}>
                  <img src="https://flagcdn.com/w20/id.png" alt="Bahasa" className="w-4 h-auto rounded-sm opacity-90" /> ID
                </button>
              )}
              {hasZh && (
                <button type="button" onClick={() => setLang('zh')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${lang === 'zh' ? 'bg-[#c3943a] shadow-sm text-white' : 'text-neutral-400 hover:text-white'}`}>
                  <img src="https://flagcdn.com/w20/cn.png" alt="Chinese" className="w-4 h-auto rounded-sm opacity-90" /> 中文
                </button>
              )}
            </div>
          </div>
        )}

        {/* If there are no dates/locations but we have a language switcher to show */}
        {!(event.date || event.location) && (
          <div className="py-5 border-b border-white/10">
            <div className="flex bg-white/5 backdrop-blur border border-white/10 p-1 rounded-lg w-full max-w-[300px]">
                <button type="button" onClick={() => setLang('en')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${lang === 'en' ? 'bg-[#c3943a] shadow-sm text-white' : 'text-neutral-400 hover:text-white'}`}>
                  <img src="https://flagcdn.com/w20/gb.png" alt="English" className="w-4 h-auto rounded-sm opacity-90" /> EN
                </button>
                {hasId && (
                  <button type="button" onClick={() => setLang('id')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${lang === 'id' ? 'bg-[#c3943a] shadow-sm text-white' : 'text-neutral-400 hover:text-white'}`}>
                    <img src="https://flagcdn.com/w20/id.png" alt="Bahasa" className="w-4 h-auto rounded-sm opacity-90" /> ID
                  </button>
                )}
                {hasZh && (
                  <button type="button" onClick={() => setLang('zh')} className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${lang === 'zh' ? 'bg-[#c3943a] shadow-sm text-white' : 'text-neutral-400 hover:text-white'}`}>
                    <img src="https://flagcdn.com/w20/cn.png" alt="Chinese" className="w-4 h-auto rounded-sm opacity-90" /> 中文
                  </button>
                )}
            </div>
          </div>
        )}

        <article className="py-6 text-sm md:text-base text-neutral-300 leading-relaxed transition-opacity duration-300">
          {!descSource ? (
            <p className="text-neutral-500">No further details have been published for this event yet.</p>
          ) : /<\/?[a-z][\s\S]*>/i.test(descSource) ? (
            <div
              key={lang}
              className="event-prose prose prose-sm prose-invert prose-p:text-sm prose-li:text-sm prose-li:marker:text-[#c3943a] max-w-none break-words overflow-hidden"
              dangerouslySetInnerHTML={{ __html: wrapTables(descSource) }}
            />
          ) : (
            <p className="whitespace-pre-line" key={lang}>{descSource}</p>
          )}
        </article>

        {gallery.length > 0 && (
          <div className="pb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black/40 border border-white/10"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pb-8">
          <Link
            href={`/event/registration?eventId=${(event as any).id}`}
            className="inline-flex items-center justify-center w-full md:w-auto md:px-10 bg-[#c3943a] hover:bg-[#e5ac53] text-white text-sm md:text-base font-bold py-3 md:py-3.5 px-4 rounded-lg shadow-md transition-colors"
          >
            Register for this event
          </Link>
        </div>
      </div>
    </>
  );
}
