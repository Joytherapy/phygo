'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Navbar from '@/components/Navbar';

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

export default function SciencePage() {
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
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,124,255,0.6) 0%, rgba(50,214,160,0.5) 100%)',
        }}
      />

      <div className="relative max-w-4xl mx-auto pt-40 pb-20 px-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#4F7CFF]/20 bg-[#4F7CFF]/10 px-3.5 py-1.5 mb-5">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }} />
          <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#4F7CFF]">Phygo Science</p>
        </div>
        <h1 className="font-display text-6xl font-bold tracking-tight mb-3">
          <span className="text-ink dark:text-white">Latest </span>
          <span style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Evidence</span>
        </h1>

        <p className="text-sm text-ink/50 dark:text-white/50 mb-8">
          Evidence-based research for physiotherapists.
        </p>

        <div className="relative mb-8">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none flex items-center justify-center h-6 w-6 rounded-full bg-[#4F7CFF]/15">
            <Search size={14} strokeWidth={2.5} className="text-[#4F7CFF]" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search studies by title..."
            className="relative w-full text-sm rounded-full border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.06] pl-14 pr-4 py-3.5 outline-none focus:border-[#4F7CFF] text-ink dark:text-white placeholder:text-ink/40 dark:placeholder:text-white/40 transition-colors"
          />
        </div>

        {loading ? (
          <div className="rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-10 text-center">
            <p className="text-sm text-ink/50 dark:text-white/50">Loading research…</p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="rounded-[28px] border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-10 text-center">
            <p className="text-sm text-ink/50 dark:text-white/50">No studies match your search.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPapers.map((paper) => {
              const summary = paper.research_summaries?.[0];
              return (
                <div
                  key={paper.id}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {paper.study_type && (
                      <span
                        className="text-xs px-2.5 py-1 rounded-full text-white font-medium"
                        style={{ background: 'linear-gradient(90deg, #4F7CFF 0%, #32D6A0 100%)' }}
                      >
                        {paper.study_type}
                      </span>
                    )}
                    <span className="text-xs text-ink/40 dark:text-white/40">{paper.status}</span>
                  </div>

                  <h2 className="text-lg font-semibold text-ink dark:text-white mb-1">
                    {paper.title}
                  </h2>
                  <p className="text-sm text-ink/50 dark:text-white/50 mb-3">
                    {paper.journal} {paper.publication_date ? `· ${paper.publication_date}` : ''}
                  </p>

                  {summary?.clinical_question && (
                    <p className="text-sm text-ink/70 dark:text-white/70 mb-1">
                      <span className="font-medium">Clinical question: </span>
                      {summary.clinical_question}
                    </p>
                  )}
                  {summary?.why_it_matters && (
                    <p className="text-sm text-ink/60 dark:text-white/60 mb-3">
                      {summary.why_it_matters}
                    </p>
                  )}

                  <a
                    href={paper.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#4F7CFF] hover:underline"
                  >
                    Original Study →
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
