import Image from 'next/image';
import { getAppConfig } from '@/lib/uploads/metadata';
import { LoginForm } from '@/components/auth/login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const config = await getAppConfig();
  const bgImage = config.loginBgUrl || '/kd-picture.webp';

  return (
    <div className="min-h-screen flex bg-neutral-950">
      {/* Left side 60% - Image Panel */}
      <div className="hidden md:block md:w-[60%] relative overflow-hidden h-screen bg-neutral-950">
        <Image
          src={bgImage}
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
          <div>
            <h2 className="text-2xl font-bold tracking-wide mb-2 gold-gradient-text uppercase">
              KOMPONG DEWA EVENTS
            </h2>
            <p className="text-sm text-neutral-300 font-light leading-relaxed">
              Managing digital displays, event artworks, and jackpot media registries with precision and speed.
            </p>
          </div>
        </div>
      </div>

      {/* Right side 40% - Login Form Panel */}
      <div className="w-full md:w-[40%] flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 bg-neutral-950 min-h-screen overflow-y-auto relative">
        <div className="w-full max-w-[440px] flex flex-col gap-8">
          <div className="bg-neutral-900 border border-neutral-800 p-10 rounded-2xl shadow-2xl w-full flex flex-col items-center">
            <div className="logo-container-sweep mb-8">
              <Image
                src="/logo.png"
                alt="Kompong Dewa Logo"
                width={384}
                height={96}
                className="h-24 w-auto shrink-0 object-contain"
                unoptimized
                priority
              />
              <div className="logo-sweep-overlay" />
            </div>
            
            <LoginForm />
          </div>
        </div>

        {/* Developer Credit Footer */}
        <div className="absolute bottom-8 text-xs text-neutral-600">
          Developer: <a href="https://t.me/sela2k26" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white transition-colors font-medium">SeLa</a>
        </div>
      </div>
    </div>
  );
}
