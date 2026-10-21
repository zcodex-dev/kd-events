'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  IconsaxCall,
  IconsaxDocumentDownload,
  IconsaxSms,
} from '@/components/icons/iconsax';
import { getStaffMember } from '@/lib/staff-data';

const socialOrder = ['WhatsApp', 'Telegram', 'Phone', 'Email', 'Instagram', 'LinkedIn', 'X.com'];

export default function StaffProfilePage() {
  const params = useParams();
  const rawId = typeof params?.id === 'string' ? params.id : 'MK-C052';
  const staff = getStaffMember(rawId);

  if (!staff) {
    return (
      <main className="grid min-h-svh place-items-center bg-[#090a0c] p-6 text-center text-[#f5f1e9]">
        <div>
          <h1 className="text-xl font-semibold" style={{ fontFamily: 'inherit' }}>Staff record not found</h1>
          <p className="mt-2 max-w-sm text-sm text-white/55">The requested profile ({rawId}) is not in the official directory.</p>
        </div>
      </main>
    );
  }

  const channels = socialOrder
    .map((platform) => staff.socials.find((channel) => channel.platform === platform))
    .filter((channel) => Boolean(channel?.url));

  return (
    <main
      className="relative min-h-svh w-full overflow-x-hidden bg-[#090a0c]"
      style={{ fontFamily: "var(--font-outfit), var(--font-roboto), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
    >
      <section className="relative isolate mx-auto min-h-[max(100svh,720px)] w-full overflow-x-hidden bg-[#090a0c] lg:max-w-[1600px]">
        <div className="absolute top-12 sm:top-14 inset-x-0 mx-auto w-full max-w-[430px] aspect-[4/5] overflow-hidden lg:inset-y-0 lg:top-0 lg:right-0 lg:left-auto lg:w-1/2 lg:max-w-none lg:aspect-auto lg:h-full">
          <div className="relative h-full w-full">
            <Image
              src="/staff/MK-C052-portrait.webp"
              alt={`Portrait of ${staff.fullName}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-top lg:object-[50%_24%]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(9,10,12,0.95)_0%,rgba(9,10,12,0.45)_10%,transparent_22%,transparent_50%,rgba(9,10,12,0.5)_68%,rgba(9,10,12,0.94)_86%,#090a0c_100%)] lg:bg-[linear-gradient(90deg,rgba(9,10,12,0.97)_0%,rgba(9,10,12,0.84)_35%,rgba(9,10,12,0.18)_70%,rgba(9,10,12,0.34)_100%)]" />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_4%,rgba(215,178,99,0.10),transparent_30%)]" />

        <header className="absolute inset-x-0 top-0 z-20 flex items-center px-5 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8 lg:px-12">
          <a
            href={staff.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Kompong Dewa Resort website"
            className="text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b263]"
          >
            <Image src="/kd-logo.png" alt="Kompong Dewa Resort" width={218} height={65} className="h-11 w-auto object-contain sm:h-12" />
          </a>
        </header>

        <div className="relative z-10 flex min-h-[max(100svh,720px)] items-end px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-28 sm:px-8 lg:items-center lg:px-12 lg:py-32">
          <div className="w-full lg:max-w-[520px]">
            <h1 className="text-[clamp(1.85rem,7.5vw,2.85rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-[#c3943a]" style={{ fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif" }}>{staff.fullName}</h1>
            <p className="mt-2 text-sm font-medium leading-5 text-white/82 sm:text-base sm:leading-6">{staff.position}</p>
            <p className="mt-0.5 text-xs leading-5 text-white/58 sm:text-sm">{staff.department}</p>

            <div className="mt-4 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-[#c3943a]/45" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c3943a]">Connect with Jetz</span>
              <span className="h-px flex-1 bg-[#c3943a]/45" />
            </div>

            <nav aria-label="Contact and social links" className="mt-3 grid grid-cols-4 gap-x-2 gap-y-3 sm:mt-4 sm:gap-x-3 sm:gap-y-4">
              {channels.map((channel) => {
                if (!channel) return null;
                const isExternal = channel.url.startsWith('http');
                const label = channel.platform === 'Phone' ? 'Call' : channel.platform === 'X.com' ? 'X' : channel.platform;
                const GenericIcon = channel.platform === 'Phone' ? IconsaxCall : channel.platform === 'Email' ? IconsaxSms : null;

                return (
                  <a
                    key={channel.platform}
                    href={channel.url}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    aria-label={`${label}: ${channel.handle}`}
                    className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl py-0.5 text-center text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b263]"
                  >
                    <span className="grid h-[52px] w-[52px] place-items-center rounded-[13px] border border-white/10 bg-[#1a1b1e] transition-colors group-hover:bg-[#242529]">
                      {GenericIcon ? (
                        <GenericIcon size={24} color="#f5f1e9" strokeWidth={1.5} />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="h-6 w-6 bg-[#f5f1e9]"
                          style={{ WebkitMask: `url(${channel.iconCdn}) center / contain no-repeat`, mask: `url(${channel.iconCdn}) center / contain no-repeat` }}
                        />
                      )}
                    </span>
                    <span className="w-full truncate text-[11px] font-medium leading-4 text-white/72">{label}</span>
                  </a>
                );
              })}

              <a
                href={`/api/staff/${staff.normalizedId}/vcard`}
                download={`${staff.firstName}_${staff.lastName}.vcf`}
                aria-label={`Save ${staff.fullName} to contacts`}
                className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl py-0.5 text-center text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d7b263]"
              >
                <span className="grid h-[52px] w-[52px] place-items-center rounded-[13px] border border-white/10 bg-[#1a1b1e] transition-colors group-hover:bg-[#242529]">
                  <IconsaxDocumentDownload size={24} color="#f5f1e9" strokeWidth={1.5} />
                </span>
                <span className="w-full truncate text-[11px] font-medium leading-4 text-white/72">Save</span>
              </a>
            </nav>

            <footer className="mt-5 border-t border-white/10 pt-4 text-center text-[11px] leading-[1.55] text-white/50 sm:text-xs">
              <address className="not-italic">
                Otres Marina Road, #833<br />
                Sangkat 4, 18000, Cambodia
              </address>
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}
