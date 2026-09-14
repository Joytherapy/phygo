'use client';

import { useEffect, useState } from 'react';
import { Search, BookOpen, Calendar, MessageCircleQuestion, Lightbulb, ArrowUpRight, FlaskConical, Microscope } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useUiStrings } from '@/contexts/LanguageContext';

interface Paper {
  id: string;
  title: string;
  authors: string | null;
  journal: string | null;
  publication_date: string | null;
  study_type: string | null;
  original_url: string;
  status: string;
  research_summaries: {
    clinical_question: string | null;
    main_findings: string | null;
    why_it_matters: string | null;
  }[];
}

// Colore distintivo per tipo di studio, cosi' il livello di evidenza si riconosce a colpo d'occhio
// (invariato: e' una codifica semantica della gerarchia dell'evidenza, non decorazione di brand).
const STUDY_TYPE_STYLE: Record<string, { text: string; bg: string; border: string }> = {
  rct: { text: '#22D3EE', bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.3)' },
  'randomized controlled trial': { text: '#22D3EE', bg: 'rgba(34,211,238,0.12)', border: 'rgba(34,211,238,0.3)' },
  'systematic review': { text: '#A855F7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' },
  'meta-analysis': { text: '#A855F7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)' },
  cohort: { text: '#32D6A0', bg: 'rgba(50,214,160,0.12)', border: 'rgba(50,214,160,0.3)' },
  'cohort study': { text: '#32D6A0', bg: 'rgba(50,214,160,0.12)', border: 'rgba(50,214,160,0.3)' },
  'case-control': { text: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  'cross-sectional': { text: '#FB7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.3)' },
};
const DEFAULT_STUDY_STYLE = { text: '#4F7CFF', bg: 'rgba(79,124,255,0.12)', border: 'rgba(79,124,255,0.3)' };

function getStudyStyle(studyType: string | null) {
  if (!studyType) return DEFAULT_STUDY_STYLE;
  return STUDY_TYPE_STYLE[studyType.toLowerCase().trim()] || DEFAULT_STUDY_STYLE;
}

// Texture a puntini finissima, stesso trucco usato dai prodotti SaaS premium
// (Linear/Stripe-style) per dare profondità a uno sfondo altrimenti piatto.
const DOT_GRID =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='%23000000' fill-opacity='0.05'/%3E%3C/svg%3E\")";
const DOT_GRID_DARK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='%23ffffff' fill-opacity='0.06'/%3E%3C/svg%3E\")";

// Identità cromatica dedicata dell'Evidence Hub: oro/bronzo invece del ciano-violetto
// di Phygo World, per distinguerla dal resto del sito e richiamare il concetto di
// "gold standard" dell'evidenza scientifica (RCT/revisioni sistematiche).
const GOLD_GRADIENT = 'linear-gradient(90deg, #FDE68A 0%, #F5B942 45%, #B8860B 100%)';
const GOLD = '#F5B942';

export default function SciencePage() {
  const ui = useUiStrings();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('/api/science/list')
      .then((res) => res.json())
      .then((data) => {
        setPapers(data.papers || []);
        setLoading(false);
      });
  }, []);

  const filteredPapers = papers.filter((paper) =>
    paper.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-[#F6F7FB] dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      {/* Texture a puntini — sostituisce il bianco piatto con una superficie che ha profondità */}
      <div
        className="pointer-events-none absolute inset-0 opacity-100 dark:opacity-0"
        style={{ backgroundImage: DOT_GRID }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100"
        style={{ backgroundImage: DOT_GRID_DARK }}
      />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full opacity-20 dark:opacity-25 blur-[150px]"
        style={{
          background: 'radial-gradient(circle, rgba(245,185,66,0.5) 0%, rgba(184,134,11,0.4) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute top-[420px] right-[-200px] w-[600px] h-[600px] rounded-full opacity-[0.1] dark:opacity-[0.12] blur-[130px]"
        style={{ background: 'radial-gradient(circle, rgba(253,230,138,0.6) 0%, rgba(146,64,14,0.4) 100%)' }}
      />

      <div className="relative max-w-4xl mx-auto pt-40 pb-24 px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#B8860B]/30 bg-[#F5B942]/10 shadow-[0_1px_2px_rgba(184,134,11,0.15)] px-3.5 py-1.5 mb-5">
          <Microscope size={13} strokeWidth={2.5} style={{ color: GOLD }} />
          <p className="text-xs font-semibold tracking-[0.15em] uppercase" style={{ color: '#B8860B' }}>{ui.science.badge}</p>
        </div>
        <h1 className="font-display text-6xl font-bold tracking-tight mb-3">
          <span
            className="drop-shadow-[0_2px_28px_rgba(184,134,11,0.3)]"
            style={{ background: GOLD_GRADIENT, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {ui.science.headingLead} {ui.science.headingAccent}
          </span>
        </h1>

        <p className="text-sm text-ink/50 dark:text-white/50 mb-8">
          {ui.science.subtitle}
        </p>

        <div className="relative mb-4">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center justify-center h-6 w-6 rounded-full bg-[#F5B942]/15">
            <Search size={14} strokeWidth={2.5} style={{ color: GOLD }} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ui.science.searchPlaceholder}
            className="relative w-full text-sm rounded-full border border-black/[0.07] dark:border-white/15 bg-white dark:bg-white/[0.06] pl-14 pr-4 py-3.5 outline-none shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-8px_rgba(16,24,40,0.08)] dark:shadow-none focus:border-[#F5B942] focus:shadow-[0_0_0_4px_rgba(245,185,66,0.15)] text-ink dark:text-white placeholder:text-ink/40 dark:placeholder:text-white/40 transition-all"
          />
        </div>

        {!loading && filteredPapers.length > 0 && (
          <p className="text-xs font-medium text-ink/40 dark:text-white/40 mb-6 px-1">
            {filteredPapers.length} {ui.science.resultsCountSuffix}
          </p>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-gradient-to-b from-white to-[#FBFBFE] dark:from-white/[0.05] dark:to-white/[0.02] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_16px_40px_-16px_rgba(16,24,40,0.1)] dark:shadow-none p-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5B942]/10 animate-pulse">
              <FlaskConical size={20} style={{ color: GOLD }} />
            </div>
            <p className="text-sm text-ink/50 dark:text-white/50">{ui.science.loadingText}</p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-gradient-to-b from-white to-[#FBFBFE] dark:from-white/[0.05] dark:to-white/[0.02] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_16px_40px_-16px_rgba(16,24,40,0.1)] dark:shadow-none p-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5B942]/10">
              <Search size={20} className="opacity-70" style={{ color: GOLD }} />
            </div>
            <p className="text-sm text-ink/50 dark:text-white/50">{ui.science.noResultsText}</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredPapers.map((paper) => {
              const summary = paper.research_summaries?.[0];
              const studyStyle = getStudyStyle(paper.study_type);
              return (
                <div
                  key={paper.id}
                  className="group relative rounded-[24px] border border-black/[0.06] dark:border-white/10 bg-gradient-to-b from-white to-[#FBFBFE] dark:from-white/[0.05] dark:to-white/[0.02] overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-14px_rgba(16,24,40,0.1)] dark:shadow-none p-6 pt-[26px] transition-all duration-300 hover:-translate-y-1 hover:border-[#B8860B]/35 hover:shadow-[0_24px_60px_-20px_rgba(184,134,11,0.35)]"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[3px] opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{ background: GOLD_GRADIENT }}
                  />

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {paper.study_type && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-semibold border"
                        style={{ color: studyStyle.text, background: studyStyle.bg, borderColor: studyStyle.border }}
                      >
                        {paper.study_type}
                      </span>
                    )}
                    {paper.status && (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full text-ink/50 dark:text-white/50 bg-black/[0.04] dark:bg-white/[0.06]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#32D6A0]" />
                        {paper.status}
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-semibold text-ink dark:text-white mb-2 leading-snug">
                    {paper.title}
                  </h2>

                  {(paper.journal || paper.publication_date) && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/45 dark:text-white/45 mb-4">
                      {paper.journal && (
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen size={13} strokeWidth={2} />
                          {paper.journal}
                        </span>
                      )}
                      {paper.publication_date && (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar size={13} strokeWidth={2} />
                          {paper.publication_date}
                        </span>
                      )}
                    </div>
                  )}

                  {(summary?.clinical_question || summary?.why_it_matters) && (
                    <div className="space-y-3 mb-5">
                      {summary?.clinical_question && (
                        <div className="rounded-xl border-l-2 pl-3.5 pr-3 py-2.5" style={{ borderColor: 'rgba(184,134,11,0.5)', background: 'rgba(245,185,66,0.06)' }}>
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#B8860B' }}>
                            <MessageCircleQuestion size={12} strokeWidth={2.5} />
                            {ui.science.clinicalQuestionLabel}
                          </p>
                          <p className="text-sm text-ink/75 dark:text-white/75 leading-relaxed">{summary.clinical_question}</p>
                        </div>
                      )}
                      {summary?.why_it_matters && (
                        <div className="rounded-xl border-l-2 border-[#A855F7]/50 bg-[#A855F7]/[0.06] pl-3.5 pr-3 py-2.5">
                          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#A855F7] mb-1">
                            <Lightbulb size={12} strokeWidth={2.5} />
                            {ui.science.whyItMattersLabel}
                          </p>
                          <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">{summary.why_it_matters}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <a
                    href={paper.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-full px-4 py-2 shadow-[0_4px_14px_-4px_rgba(184,134,11,0.5)] transition-transform hover:scale-[1.03]"
                    style={{ background: GOLD_GRADIENT, color: '#1F1400' }}
                  >
                    {ui.science.originalStudyCta}
                    <ArrowUpRight size={14} strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
