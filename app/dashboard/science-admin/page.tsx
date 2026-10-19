'use client';

import { useEffect, useState } from 'react';
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
  relevance_score: number | null;
}

export default function ScienceAdminPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadPapers = () => {
    setLoading(true);
    fetch('/api/science/list')
      .then((res) => res.json())
      .then((data) => {
        const pending = (data.papers || []).filter(
          (p: Paper) => p.status === 'pending_review'
        );
        setPapers(pending);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPapers();
  }, []);

  const handleAction = async (paperId: string, action: 'approve' | 'reject') => {
    setProcessingId(paperId);
    try {
      const res = await fetch('/api/science/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, action }),
      });
      if (!res.ok) {
        alert(res.status === 403 || res.status === 401 ? 'Accesso riservato agli amministratori.' : 'Errore aggiornamento');
        return;
      }
      setPapers((prev) => prev.filter((p) => p.id !== paperId));
    } catch (err) {
      console.error('Errore azione admin:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f7f7f8] dark:bg-[#050608] overflow-hidden transition-colors">
      <Navbar />

      <div className="relative max-w-4xl mx-auto pt-40 pb-20 px-6">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#7C83FF] mb-3">
          Admin
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink dark:text-white mb-2">
          Science Review Queue
        </h1>
        <p className="text-sm text-ink/60 dark:text-white/50 mb-10">
          {papers.length} studies awaiting review.
        </p>

        {loading ? (
          <p className="text-sm text-ink/60 dark:text-white/50">Loading...</p>
        ) : papers.length === 0 ? (
          <div className="rounded-[28px] border border-black/[0.09] dark:border-white/10 bg-white/95 dark:bg-white/[0.03] backdrop-blur-xl p-10 text-center">
            <p className="text-sm text-ink/60 dark:text-white/50">
              Nothing to review right now.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {papers.map((paper) => (
              <div
                key={paper.id}
                className="rounded-2xl border border-black/[0.06] bg-white/90 backdrop-blur-xl dark:border-white/[0.07] dark:bg-white/[0.035] p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  {paper.study_type && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-ink/70 dark:text-white/70 font-medium">
                      {paper.study_type}
                    </span>
                  )}
                  {paper.relevance_score !== null && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-ink/70 dark:text-white/70 font-medium">
                      Score: {paper.relevance_score}
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-semibold text-ink dark:text-white mb-1">
                  {paper.title}
                </h2>
                <p className="text-sm text-ink/60 dark:text-white/50 mb-4">
                  {paper.journal} {paper.publication_date}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAction(paper.id, 'approve')}
                    disabled={processingId === paper.id}
                    className="rounded-full px-4 py-2 text-xs font-semibold bg-ink text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.55)] hover:bg-ink/90 dark:bg-white dark:text-ink dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.25)] dark:hover:bg-white/90 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(paper.id, 'reject')}
                    disabled={processingId === paper.id}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-red-500 border border-red-200 dark:border-red-500/30 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <a href={paper.original_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[#7C83FF] hover:underline ml-auto">
                    View original
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}