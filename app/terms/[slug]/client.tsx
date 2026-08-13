'use client';

import { useEffect } from 'react';
import type { WebPage } from '@/types';
import Image from 'next/image';

export function TermsClient({ page }: { page: WebPage }) {
  // Increment view count on mount
  useEffect(() => {
    fetch(`/api/views/pages/${page.slug}`, { method: 'POST' }).catch(() => {
      // Non-critical
    });
  }, [page.slug]);

  return (
    <div 
      className="min-h-screen relative flex flex-col items-center py-10 px-4 sm:px-6"
      style={{
        backgroundColor: page.bgColor,
        color: page.textColor,
      }}
    >
      {/* Background Image Overlay */}
      {page.bgImageUrl && (
        <div 
          className="absolute inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat bg-fixed mix-blend-overlay opacity-30"
          style={{ backgroundImage: `url(${page.bgImageUrl})` }}
        />
      )}

      {/* Content Container */}
      <div 
        className="relative z-10 w-full max-w-4xl mx-auto rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm"
        style={{
           backgroundColor: 'rgba(0,0,0,0.4)',
           borderColor: 'rgba(255,255,255,0.1)',
           borderWidth: '1px'
        }}
      >
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10 pb-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {page.featureIconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={page.featureIconUrl} 
              alt="Feature Icon" 
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain mb-8 drop-shadow-lg"
            />
          ) : (
             <div className="mb-4">
                <Image
                  src="/logo-v2.png"
                  alt="Logo"
                  width={220}
                  height={48}
                  className="h-12 w-auto object-contain drop-shadow-md"
                  unoptimized
                />
             </div>
          )}
          <h1 className="text-3xl sm:text-5xl font-serif tracking-tight drop-shadow-md" style={{ color: page.textColor }}>
            {page.title}
          </h1>
        </div>

        {/* Prose Content */}
        {/* We use a custom class to ensure the rich text from quill adapts to the selected text color */}
        <div 
          className="rich-text-content prose prose-lg max-w-none prose-headings:font-serif prose-a:text-[#c6983a] hover:prose-a:text-[#d4aa55]"
          style={{ '--tw-prose-body': page.textColor, '--tw-prose-headings': page.textColor, color: page.textColor } as React.CSSProperties}
          dangerouslySetInnerHTML={{ __html: page.htmlContent }}
        />
      </div>
      
      {/* Global styles for the rich text to inherit the custom color and fonts */}
      <style dangerouslySetInnerHTML={{__html: `
        .rich-text-content {
          font-family: var(--font-roboto), sans-serif;
        }
        .rich-text-content * {
          color: inherit !important;
        }
        .rich-text-content h1, 
        .rich-text-content h2, 
        .rich-text-content h3, 
        .rich-text-content h4, 
        .rich-text-content h5, 
        .rich-text-content h6,
        .rich-text-content strong {
          font-family: var(--font-playfair), serif;
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .rich-text-content a {
          color: #c6983a !important;
          text-decoration: underline;
        }
      `}} />
    </div>
  );
}
