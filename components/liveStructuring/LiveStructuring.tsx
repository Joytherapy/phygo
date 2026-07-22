"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, CheckCircle2, Sparkles } from "lucide-react";
import { CATEGORIES, EXAMPLES, categorize, chunkTranscript, type Category, type Phrase } from "./data";

type Phase = "idle" | "typing" | "listening" | "pause" | "flying" | "done";

export default function LiveStructuring({
  instanceId,
  variant = "hero",
  className = "",
}: {
  instanceId: string;
  variant?: "hero" | "full";
  className?: string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [typedIds, setTypedIds] = useState<Set<string>>(new Set());
  const [movedIds, setMovedIds] = useState<Set<string>>(new Set());
  const [justFilled, setJustFilled] = useState<Category | null>(null);
  const [elapsed, setElapsed] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [isLiveVoice, setIsLiveVoice] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [interim, setInterim] = useState("");

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startedAt = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const hasAutoRun = useRef(false);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(!!SR);
    return () => {
      clearTimers();
      recognitionRef.current?.stop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    clearTimers();
    setPhrases([]);
    setTypedIds(new Set());
    setMovedIds(new Set());
    setJustFilled(null);
    setElapsed(null);
    setInterim("");
  };

  const runFlyPhase = useCallback((finalPhrases: Phrase[]) => {
    setPhase("pause");
    timers.current.push(
      setTimeout(() => {
        setPhase("flying");
        finalPhrases.forEach((p, i) => {
          timers.current.push(
            setTimeout(() => {
              setMovedIds((prev) => new Set(prev).add(p.id));
              setJustFilled(p.cat);
              timers.current.push(setTimeout(() => setJustFilled(null), 550));
            }, i * 420)
          );
        });
        timers.current.push(
          setTimeout(() => {
            setPhase("done");
            setElapsed(((performance.now() - startedAt.current) / 1000).toFixed(1));
          }, finalPhrases.length * 420 + 500)
        );
      }, 550)
    );
  }, []);

  const runExample = useCallback(
    (exampleId: string) => {
      reset();
      setIsLiveVoice(false);
      const example = EXAMPLES.find((e) => e.id === exampleId) ?? EXAMPLES[0];
      setActiveLabel(example.label);
      const withIds: Phrase[] = example.phrases.map((p, i) => ({
        ...p,
        id: `${instanceId}-${exampleId}-${i}`,
      }));
      setPhrases(withIds);
      setPhase("typing");
      startedAt.current = performance.now();

      withIds.forEach((p, i) => {
        timers.current.push(
          setTimeout(() => {
            setTypedIds((prev) => new Set(prev).add(p.id));
          }, i * 620)
        );
      });

      timers.current.push(
        setTimeout(() => runFlyPhase(withIds), withIds.length * 620 + 200)
      );
    },
    [instanceId, runFlyPhase]
  );

  useEffect(() => {
    if (variant !== "hero" || hasAutoRun.current) return;
    hasAutoRun.current = true;
    const t = setTimeout(() => runExample(EXAMPLES[0].id), 2500);
    return () => clearTimeout(t);
  }, [variant, runExample]);

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    reset();
    setIsLiveVoice(true);
    setActiveLabel("Your voice");
    setPhase("listening");
    startedAt.current = performance.now();

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t + " ";
        else interimText += t;
      }
      setInterim(finalTranscript + interimText);
    };
    recognition.onend = () => {
      const raw = finalTranscript.trim();
      if (!raw) {
        setPhase("idle");
        return;
      }
      const chunks = chunkTranscript(raw);
      const withIds: Phrase[] = chunks.map((text, i) => ({
        id: `${instanceId}-voice-${Date.now()}-${i}`,
        text,
        cat: categorize(text),
      }));
      setPhrases(withIds);
      setTypedIds(new Set(withIds.map((p) => p.id)));
      runFlyPhase(withIds);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoice = () => recognitionRef.current?.stop?.();

  const isTranscriptPhase = phase === "typing" || phase === "listening" || phase === "pause" || phase === "flying";
  const visiblePhrases = phrases.filter((p) => !movedIds.has(p.id) && (isLiveVoice || typedIds.has(p.id)));

  return (
    <div className={className}>
      <div className="rounded-xl3 glass-strong shadow-lift p-6 sm:p-8">
        {/* Status row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                phase === "idle" ? "bg-ink/20 dark:bg-white/20" : "bg-emerald animate-pulse"
              }`}
            />
            <span className="eyebrow text-ink/40 dark:text-white/40">
              {phase === "idle" && "Ready"}
              {(phase === "typing" || phase === "listening") && (isLiveVoice ? "Listening…" : "Listening…")}
              {(phase === "pause" || phase === "flying") && "Structuring…"}
              {phase === "done" && `Structured in ${elapsed}s`}
            </span>
          </div>
          {activeLabel && phase !== "idle" && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-mist dark:bg-white/10 text-ink/50 dark:text-white/50">
              {isLiveVoice ? "Live" : "Example"}
            </span>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {/* Transcript / input side */}
          <div className="min-h-[140px] flex flex-col">
            {phase === "idle" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-electric to-emerald text-white shadow-glow">
                  <Mic size={22} />
                </span>
                <p className="text-sm text-ink/50 dark:text-white/50 max-w-[220px]">
                  {variant === "full"
                    ? "Try a real session with your voice, or tap an example."
                    : "Watch a real session structure itself, live."}
                </p>
              </div>
            )}

            {(isTranscriptPhase) && (
              <>
                <div className="flex items-end gap-[3px] h-8 mb-4">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="w-[3px] rounded-full bg-gradient-to-t from-electric to-emerald"
                      animate={{ height: [4, 8 + ((i * 5) % 22), 4] }}
                      transition={{
                        duration: 0.8 + (i % 4) * 0.1,
                        repeat: phase === "typing" || phase === "listening" ? Infinity : 0,
                        delay: i * 0.02,
                      }}
                    />
                  ))}
                </div>
                <div className="space-y-2.5 flex-1">
                  {isLiveVoice && phase === "listening" && (
                    <p className="text-sm text-ink/60 dark:text-white/60 leading-snug italic">
                      {interim || "Say something like you would to a colleague…"}
                    </p>
                  )}
                  <AnimatePresence mode="popLayout">
                    {visiblePhrases.map((p) => (
                      <motion.p
                        key={p.id}
                        layout
                        layoutId={`${instanceId}-${p.id}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="text-sm text-ink/75 dark:text-white/75 leading-snug"
                      >
                        {p.text}
                      </motion.p>
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}

            {phase === "done" && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6 text-center">
                <CheckCircle2 className="text-emerald" size={28} />
                <p className="text-sm text-ink/50 dark:text-white/50">
                  From speech to structured note — untouched by typing.
                </p>
              </div>
            )}
          </div>

          {/* Category board */}
          <div className="grid grid-cols-2 gap-2.5">
            {CATEGORIES.map((cat) => (
              <motion.div
                key={cat.key}
                animate={
                  justFilled === cat.key
                    ? { boxShadow: "0 0 0 2px rgba(50,214,160,0.5)" }
                    : { boxShadow: "0 0 0 0px rgba(50,214,160,0)" }
                }
                transition={{ duration: 0.5 }}
                className="rounded-xl2 bg-mist/70 dark:bg-white/5 p-3 min-h-[110px] flex flex-col"
              >
                <span className="eyebrow text-ink/35 dark:text-white/35 mb-2">{cat.label}</span>
                <div className="space-y-1.5 flex-1">
                  <AnimatePresence>
                    {phrases
                      .filter((p) => movedIds.has(p.id) && p.cat === cat.key)
                      .map((p) => (
                        <motion.p
                          key={p.id}
                          layout
                          layoutId={`${instanceId}-${p.id}`}
                          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                          className="text-[11.5px] leading-snug text-ink/70 dark:text-white/70"
                        >
                          {p.text}
                        </motion.p>
                      ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => runExample(ex.id)}
              data-cursor-hover
              className={`text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors ${
                activeLabel === ex.label && !isLiveVoice
                  ? "bg-ink dark:bg-white text-white dark:text-ink"
                  : "bg-mist dark:bg-white/10 text-ink/60 dark:text-white/60 hover:bg-mist-dark dark:hover:bg-white/20"
              }`}
            >
              {ex.label}
            </button>
          ))}
          {variant === "full" && voiceSupported && (
            <button
              onClick={phase === "listening" ? stopVoice : startVoice}
              data-cursor-hover
              className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-electric to-emerald text-white"
            >
              {phase === "listening" ? <Square size={11} fill="currentColor" /> : <Mic size={12} />}
              {phase === "listening" ? "Stop" : "Use your voice"}
            </button>
          )}
          {variant === "full" && !voiceSupported && (
            <span className="ml-auto flex items-center gap-1.5 text-[11px] text-ink/35 dark:text-white/35">
              <Sparkles size={11} />
              Voice demo works best in Chrome
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
