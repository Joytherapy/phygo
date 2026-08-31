'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { ArrowLeft } from 'lucide-react';

interface TopicDetail {
  id: string;
  slug: string;
  name: string;
  category: string;
  description?: string;
  image_url?: string;
}

interface CountryProtocol {
  id: string;
  topic_id: string;
  country: string;
  emergency_number?: string;
  governing_body?: string;
  protocol?: string;
  notes_on_differences?: string;
  key_source?: string;
}

const ACCENT = {
  gradient: 'linear-gradient(90deg, #EF4444 0%, #F97316 100%)',
  solid: '#EF4444',
};

const COUNTRY_FLAG: Record<string, string> = {
  Italia: '🇮🇹',
  Francia: '🇫🇷',
  'Regno Unito': '🇬🇧',
  Spagna: '🇪🇸',
  USA: '🇺🇸',
};

export default function FirstAidDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [protocols, setProtocols] = useState<CountryProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/first-aid/${slug}`);
        if (!res.ok) throw new Error('Errore nel recupero dell\'argomento');
        const data = await res.json();
        setTopic(data.topic ?? null);
        setProtocols(data.protocols ?? []);
        if (data.protocols?.length) {
          setActiveCountry(data.protocols[0].country);
        }
      } catch (err) {
        setError('Impossibile caricare questo argomento di primo soccorso.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  const activeProtocol = protocols.find((p) => p.country === activeCountry);

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#08090b] text-ink dark:text-white overflow-hidden transition-colors">
      <Navbar />

      <div
        className="pointer-events-none absolute -top-60 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-20 dark:opacity-25 blur-[140px]"
        style={{
          background: 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, rgba(249,115,22,0.5) 100%)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-6 pt-40 pb-24">
        <button
          onClick={() => router.push('/dashboard/first-aid')}
          className="inline-flex items-center gap-2 text-sm text-ink/50 dark:text-white/50 hover:text-ink dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Tutti gli argomenti
        </button>

        {loading && <p className="text-sm text-ink/40 dark:text-white/40">Caricamento...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && topic && (
          <>
            {topic.image_url && (
              <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-[#08090b] mb-8 border border-black/[0.06] dark:border-white/10">
                <img src={topic.image_url} alt={topic.name} className="w-full h-full object-cover" />
              </div>
            )}

            <h1 className="text-3xl font-bold text-ink dark:text-white mb-3">{topic.name}</h1>
            {topic.description && (
              <p className="text-sm text-ink/60 dark:text-white/60 leading-relaxed mb-8">
                {topic.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
              {protocols.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveCountry(p.country)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    activeCountry === p.country
                      ? 'text-white'
                      : 'text-ink/60 dark:text-white/60 border border-black/[0.08] dark:border-white/10 hover:text-ink dark:hover:text-white'
                  }`}
                  style={activeCountry === p.country ? { background: ACCENT.gradient } : undefined}
                >
                  <span>{COUNTRY_FLAG[p.country] ?? ''}</span>
                  {p.country}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeProtocol && (
                <motion.div
                  key={activeProtocol.country}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl p-6 space-y-5"
                >
                  <div className="flex flex-wrap gap-4 text-xs text-ink/50 dark:text-white/50">
                    {activeProtocol.emergency_number && (
                      <div>
                        <span className="font-semibold text-ink/70 dark:text-white/70">Numero di emergenza: </span>
                        {activeProtocol.emergency_number}
                      </div>
                    )}
                    {activeProtocol.governing_body && (
                      <div>
                        <span className="font-semibold text-ink/70 dark:text-white/70">Ente di riferimento: </span>
                        {activeProtocol.governing_body}
                      </div>
                    )}
                  </div>

                  {activeProtocol.protocol && (
                    <div>
                      <p className="text-sm font-semibold text-ink dark:text-white mb-1.5">Protocollo</p>
                      <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                        {activeProtocol.protocol}
                      </p>
                    </div>
                  )}

                  {activeProtocol.notes_on_differences && (
                    <div>
                      <p className="text-sm font-semibold text-[#F97316] mb-1.5">Note sulle differenze</p>
                      <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">
                        {activeProtocol.notes_on_differences}
                      </p>
                    </div>
                  )}

                  {activeProtocol.key_source && (
                    <div className="pt-3 border-t border-black/[0.06] dark:border-white/10">
                      <p className="text-xs text-ink/40 dark:text-white/40">
                        Fonte: {activeProtocol.key_source}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}