import { ArrowDown, GraduationCap, Stethoscope } from "lucide-react";
import type { LandingDict } from "@/lib/i18n/landingStrings";
import type { Shot } from "@/lib/landing/screenshots";
import { CONTAINER, PrimaryCta, Screenshot } from "./ui";

// Hero for both audiences: what PHYGO is, one primary CTA, a real product
// image (session draft + 3D body map), then the two equal audience paths.
export default function Hero({
  hero,
  signup,
  draft,
  bodymap,
}: {
  hero: LandingDict["hero"];
  signup: string;
  draft: Shot;
  bodymap: Shot;
}) {
  const paths = [
    { id: "students", icon: GraduationCap, ...hero.paths.students },
    { id: "physiotherapists", icon: Stethoscope, ...hero.paths.physiotherapists },
  ];
  return (
    <section aria-labelledby="hero-title" className="pb-16 pt-28 sm:pb-20 sm:pt-36">
      <div className={`${CONTAINER} grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14`}>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold tracking-wide text-electric-dark dark:text-electric-light">{hero.eyebrow}</p>
          <h1
            id="hero-title"
            className="mt-4 text-balance font-display text-[2rem] font-semibold leading-[1.12] tracking-[-0.025em] text-ink dark:text-white sm:text-[2.6rem] lg:text-[2.75rem]"
          >
            {hero.title}
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-[17px] leading-relaxed text-ink/70 dark:text-white/70">{hero.sub}</p>
          <PrimaryCta href={signup} className="mt-8">
            {hero.cta}
          </PrimaryCta>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/60 dark:text-white/60">{hero.note}</p>
        </div>

        <figure className="min-w-0">
          <div className="relative pb-10 pl-10 sm:pb-14 sm:pl-16">
            <Screenshot shot={draft} alt={hero.imageAlt} sizes="(min-width: 1152px) 540px, (min-width: 1024px) 48vw, 92vw" priority />
            <Screenshot
              shot={bodymap}
              alt={hero.secondImageAlt}
              sizes="(min-width: 640px) 170px, 120px"
              className="absolute bottom-0 left-0 w-[30%] max-w-[180px] ring-4 ring-[#f7f8fa] dark:ring-[#0a0e17]"
            />
          </div>
          <figcaption className="mt-3 text-[13px] leading-snug text-ink/60 dark:text-white/60">{hero.caption}</figcaption>
        </figure>
      </div>

      <nav aria-label={hero.choose} className={`${CONTAINER} mt-14 sm:mt-16`}>
        <p className="text-[13px] font-semibold text-ink/60 dark:text-white/60">{hero.choose}</p>
        <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {paths.map(({ id, icon: Icon, title, text, link }) => (
            <li key={id} className="min-w-0">
              <a
                href={`#${id}`}
                className="group flex h-full min-w-0 items-start gap-4 rounded-2xl border border-black/[0.09] bg-white p-5 transition-colors hover:border-electric/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric motion-reduce:transition-none dark:border-white/[0.1] dark:bg-white/[0.03] dark:hover:border-electric-light/50 sm:p-6"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-electric/10 text-electric-dark dark:bg-electric/15 dark:text-electric-light">
                  <Icon size={20} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-semibold text-ink dark:text-white">{title}</span>
                  <span className="mt-1 block text-[15px] leading-relaxed text-ink/70 dark:text-white/70">{text}</span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-electric-dark dark:text-electric-light">
                    {link}
                    <ArrowDown size={15} aria-hidden className="transition-transform group-hover:translate-y-0.5 motion-reduce:transition-none" />
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
