import { Shield, Trophy, Crown, Sparkles } from 'lucide-react';

export function ResortExperience() {
  const pillars = [
    {
      icon: Crown,
      title: 'High-Limit VIP Salons',
      description: 'Exclusive private gaming salons offering bespoke limits, dedicated hosts, and international hospitality standards.',
    },
    {
      icon: Trophy,
      title: 'Championship Series',
      description: 'Regularly scheduled multi-day baccarat tournaments and progressive poker jackpot leagues with guaranteed prize pools.',
    },
    {
      icon: Shield,
      title: 'Integrity & Fair Play',
      description: 'Strict adherence to international casino gaming regulations with transparent rules and certified tournament administration.',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="text-xs uppercase tracking-widest text-[#c3943a] font-bold mb-1">
          Kompong Dewa Standards
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          A World-Class Resort & Gaming Experience
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-xl bg-neutral-900/50 border border-white/10 hover:border-[#c3943a]/40 transition-colors space-y-3"
            >
              <div className="w-10 h-10 rounded-lg bg-[#c3943a]/15 text-[#e5ac53] flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{item.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
