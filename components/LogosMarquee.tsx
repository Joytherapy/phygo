const names = [
  "Vela Clinic",
  "Northbridge Physio",
  "Solace Osteopathy",
  "Meridian Wellness",
  "Arbor Rehab",
  "Haven Bodywork",
  "Pulse Physiotherapy",
  "Anchor Clinic",
];

export default function LogosMarquee() {
  const loop = [...names, ...names];
  return (
    <section id="logos" className="relative py-14 border-y border-ink/5 dark:border-white/5">
      <p className="text-center eyebrow text-ink/35 dark:text-white/35 mb-7">
        Trusted by practitioners worldwide
      </p>
      <div className="relative overflow-hidden mask-fade">
        <div className="flex w-max gap-14 animate-marquee">
          {loop.map((name, i) => (
            <span
              key={name + i}
              className="font-display text-xl sm:text-2xl font-medium text-ink/25 dark:text-white/25 whitespace-nowrap select-none"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <style>{`
        .mask-fade {
          -webkit-mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
          mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
        }
      `}</style>
    </section>
  );
}
