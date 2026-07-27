"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Square,
  CheckCircle2,
  Sparkles,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";

import {
  CATEGORIES,
  EXAMPLES,
  chunkTranscript,
  type Category,
  type Phrase,
} from "./data";

type Phase =
  | "idle"
  | "typing"
  | "listening"
  | "pause"
  | "flying"
  | "done";

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

  const [aiPhrases, setAiPhrases] = useState<Phrase[]>([]);
  const [finalNote, setFinalNote] = useState<any>(null);
  const [clinicalInsight, setClinicalInsight] = useState<any>(null);
  const [rehabPhases, setRehabPhases] = useState<any[]>([]);


  const [phraseFields, setPhraseFields] = useState<Record<string, string>>({});
  const [aiError, setAiError] = useState<string | null>(null);

  const [justFilled, setJustFilled] = useState<Category | null>(null);

  const [elapsed, setElapsed] = useState<string | null>(null);

  const [activeLabel, setActiveLabel] =
    useState<string | null>(null);

  const [isLiveVoice, setIsLiveVoice] = useState(false);
const [recordingLang, setRecordingLang] = useState("it-IT");

  const [voiceSupported, setVoiceSupported] = useState(false);

  const [interim, setInterim] = useState("");

  const [progress, setProgress] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startedAt = useRef<number>(0);

  const recognitionRef = useRef<any>(null);

  const hasAutoRun = useRef(false);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

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

    setAiPhrases([]);
    setAiError(null);

    setJustFilled(null);

    setElapsed(null);

    setInterim("");

    setProgress(0);
  };

  const runFlyPhase = useCallback((finalPhrases: Phrase[]) => {
    setPhase("pause");

    setProgress(20);

    timers.current.push(
      setTimeout(() => {
        setPhase("flying");

        setProgress(45);

        finalPhrases.forEach((p, i) => {
          timers.current.push(
            setTimeout(() => {
              setMovedIds((prev) => new Set(prev).add(p.id));

              setJustFilled(p.cat);

              setProgress(
                Math.min(
                  90,
                  45 + ((i + 1) / finalPhrases.length) * 45
                )
              );

              timers.current.push(
                setTimeout(() => setJustFilled(null), 550)
              );
            }, i * 420)
          );
        });

        timers.current.push(
          setTimeout(() => {
            setPhase("done");

            setProgress(100);

            setElapsed(
              (
                (performance.now() - startedAt.current) /
                1000
              ).toFixed(1)
            );
          }, finalPhrases.length * 420 + 500)
        );
      }, 550)
    );
  }, []);

  const runExample = useCallback(
    (exampleId: string) => {
      reset();

      setIsLiveVoice(false);

      const example =
        EXAMPLES.find((e) => e.id === exampleId) ?? EXAMPLES[0];

      setActiveLabel(example.label);

      const withIds: Phrase[] = example.phrases.map((p, i) => ({
        ...p,
        id: `${instanceId}-${exampleId}-${i}`,
      }));

      setPhrases(withIds);

      setPhase("typing");

      setProgress(8);

      startedAt.current = performance.now();

      withIds.forEach((p, i) => {
        timers.current.push(
          setTimeout(() => {
            setTypedIds((prev) => new Set(prev).add(p.id));

            setProgress((prev) =>
              Math.min(40, prev + 5)
            );
          }, i * 620)
        );
      });

      timers.current.push(
        setTimeout(
          () => runFlyPhase(withIds),
          withIds.length * 620 + 200
        )
      );
    },
    [instanceId, runFlyPhase]
  );

  useEffect(() => {
    if (variant !== "hero" || hasAutoRun.current) return;

    hasAutoRun.current = true;

    const t = setTimeout(
      () => runExample(EXAMPLES[0].id),
      2500
    );

    return () => clearTimeout(t);
  }, [variant, runExample]);

  // Chiama il vero endpoint AI e trasforma la nota SOAP
  // nelle 4 categorie mostrate a destra.
  const generateRealNote = useCallback(
    async (raw: string, transcriptPhrases: Phrase[]) => {
      setPhase("pause");
      setProgress(30);
      setAiError(null);

      try {
        const res = await fetch("/api/generate-note", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ transcript: raw, lang: recordingLang }),
});


        if (!res.ok) throw new Error("request failed");

        const data = await res.json();
        const note = data.note ?? {};
        setFinalNote(note);
                if (note.assessment) {
          try {
            const kbRes = await fetch("/api/knowledge-lookup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
body: JSON.stringify({ assessment: note.assessment, lang: note.language || 'it' }),
            });
            const kbData = await kbRes.json();
setClinicalInsight(kbData.match || null);
setRehabPhases(kbData.phases || []);
          } catch (kbErr) {
            console.error("Knowledge lookup failed:", kbErr);
            setClinicalInsight(null);
            setRehabPhases([]);

          }
        }


                const built: Phrase[] = [];
        const fieldMap: Record<string, string> = {};
        let idx = 0;

        const push = (text: string | undefined, cat: Category, field?: string) => {
          if (!text) return;
          const id = `${instanceId}-ai-${Date.now()}-${idx++}`;
          built.push({ id, text, cat });
          if (field) fieldMap[id] = field;
        };

        push(note.subjective, "findings", "subjective");
        push(note.objective, "findings", "objective");
        push(note.assessment, "assessment", "assessment");
        push(note.plan, "plan", "plan");

        if (Array.isArray(note.exercises) && note.exercises.length) {
          push(`Exercises: ${note.exercises.join(", ")}`, "plan", "_exercisesText");
        }

        push(note.summaryForPatient, "followup", "summaryForPatient");

        setPhraseFields(fieldMap);

        if (built.length === 0) {
          throw new Error("empty note");
        }

        setPhase("flying");
        setProgress(60);

        // Il transcript "vola via" a sinistra...
        setMovedIds(new Set(transcriptPhrases.map((p) => p.id)));

        // ...e la nota AI compare a destra, una riga alla volta.
        built.forEach((p, i) => {
          timers.current.push(
            setTimeout(() => {
              setAiPhrases((prev) => [...prev, p]);
              setJustFilled(p.cat);

              setProgress(
                Math.min(95, 60 + ((i + 1) / built.length) * 35)
              );

              timers.current.push(
                setTimeout(() => setJustFilled(null), 550)
              );
            }, i * 420)
          );
        });

        timers.current.push(
          setTimeout(() => {
            setPhase("done");
            setProgress(100);
            setElapsed(
              (
                (performance.now() - startedAt.current) /
                1000
              ).toFixed(1)
            );
          }, built.length * 420 + 500)
        );
      } catch (err) {
        console.error("Errore generazione nota reale:", err);
        setAiError(
          "Non sono riuscito a generare la nota clinica. Riprova."
        );
        setPhase("idle");
      }
    },
    [instanceId, recordingLang]
  );

  const startVoice = () => {
    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) return;

    reset();

    setIsLiveVoice(true);

    setActiveLabel("Live Session");

    setPhase("listening");

    setProgress(5);

    startedAt.current = performance.now();

    const recognition = new SR();

    recognition.continuous = true;
    recognition.interimResults = true;
recognition.lang = recordingLang;

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interimText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const t = event.results[i][0].transcript;

        if (event.results[i].isFinal)
          finalTranscript += t + " ";
        else interimText += t;
      }

      setProgress((prev) =>
        Math.min(35, prev + 1)
      );

      setInterim(finalTranscript + interimText);
    };

    recognition.onend = () => {
      const raw = finalTranscript.trim();

      if (!raw) {
        setPhase("idle");
        return;
      }

      const chunks = chunkTranscript(raw);

      const transcriptPhrases: Phrase[] = chunks.map((text, i) => ({
        id: `${instanceId}-voice-${Date.now()}-${i}`,
        text,
        cat: "findings",
      }));

      setPhrases(transcriptPhrases);
      setTypedIds(new Set(transcriptPhrases.map((p) => p.id)));

      generateRealNote(raw, transcriptPhrases);
    };

    recognitionRef.current = recognition;

    recognition.start();
  };

  const updatePhraseText = (phraseId: string, newText: string) => {
    setAiPhrases((prev) =>
      prev.map((ph) => (ph.id === phraseId ? { ...ph, text: newText } : ph))
    );
    const field = phraseFields[phraseId];
    if (field) {
      setFinalNote((prev: any) => (prev ? { ...prev, [field]: newText } : prev));
    }
  };

  const stopVoice = () =>
    recognitionRef.current?.stop?.();


  const downloadPdf = () => {
    if (!finalNote) return;

    const doc = new jsPDF();
    const marginLeft = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - marginLeft * 2;
    let y = 20;

    const addSection = (title: string, content?: string) => {
      if (!content) return;
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, marginLeft, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(content, usableWidth);
      lines.forEach((line: string) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, marginLeft, y);
        y += 6;
      });
      y += 6;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Clinical Note - Phygo", marginLeft, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(new Date().toLocaleString(), marginLeft, y);
    y += 12;

    addSection("Subjective", finalNote.subjective);
    addSection("Objective", finalNote.objective);
    addSection("Assessment", finalNote.assessment);
    addSection("Plan", finalNote.plan);

        if (finalNote._exercisesText) {
      addSection("Exercises", finalNote._exercisesText);
    } else if (Array.isArray(finalNote.exercises) && finalNote.exercises.length) {
      if (y > 260) {

        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Exercises", marginLeft, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      finalNote.exercises.forEach((ex: string) => {
        const lines = doc.splitTextToSize(`- ${ex}`, usableWidth);
        lines.forEach((line: string) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, marginLeft, y);
          y += 6;
        });
      });
      y += 6;
    }

    addSection("Patient Summary", finalNote.summaryForPatient);

    doc.save(`phygo-note-${Date.now()}.pdf`);
  };

  const isTranscriptPhase =
    phase === "typing" ||
    phase === "listening" ||
    phase === "pause" ||
    phase === "flying";

  const visiblePhrases = phrases.filter(
    (p) =>
      !movedIds.has(p.id) &&
      (isLiveVoice || typedIds.has(p.id))
  );

  return (
    <div className={className}>
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 glass-strong shadow-lift p-7 sm:p-9">

        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric/60 to-transparent" />

        {/* Status */}
        <div className="mb-6 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <motion.span
              className={`h-2.5 w-2.5 rounded-full ${
                phase === "idle"
                  ? "bg-ink/20 dark:bg-white/20"
                  : "bg-emerald"
              }`}
              animate={
                phase === "idle"
                  ? {}
                  : {
                      scale: [1, 1.6, 1],
                      opacity: [1, .55, 1],
                    }
              }
              transition={{
                duration: 1.2,
                repeat: Infinity,
              }}
            />

            <div className="flex flex-col">

              <span className="eyebrow text-ink/40 dark:text-white/40">

                {phase === "idle" && "Ready"}

                {(phase === "typing" || phase === "listening") &&
                  "Listening..."}

                {phase === "pause" &&
                  "Analyzing conversation..."}

                {phase === "flying" &&
                  "Generating clinical documentation..."}

                {phase === "done" &&
                  `Completed in ${elapsed}s`}

              </span>

              {phase !== "idle" && (
                <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-black/8 dark:bg-white/8">

                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-electric via-[#6E8FFF] to-emerald"
                    animate={{ width: `${progress}%` }}
                    transition={{
                      duration: .35,
                    }}
                  />

                </div>
              )}

            </div>

          </div>

          {activeLabel && phase !== "idle" && (
            <span className="rounded-full bg-mist px-3 py-1 text-[11px] font-semibold text-ink/55 dark:bg-white/10 dark:text-white/60">
              {isLiveVoice ? "LIVE SESSION" : "AI DEMO"}
            </span>
          )}

        </div>

<div className={`grid gap-6 ${variant === "full" ? "grid-cols-1" : "sm:grid-cols-2"}`}>

          {/* Transcript */}

          <div className="flex min-h-[170px] flex-col">

            {phase === "idle" && (
              <div className="flex flex-1 flex-col items-center justify-center gap-5 py-8 text-center">

                <motion.span
                  animate={{
                    scale: [1, 1.08, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-electric to-emerald text-white shadow-glow"
                >
                  <Mic size={24} />
                </motion.span>

                <p className="max-w-[250px] text-sm leading-relaxed text-ink/55 dark:text-white/55">
                  {variant === "full"
                    ? "Speak naturally. Phygo structures everything automatically."
                    : "Watch AI transform a real consultation into structured documentation."}
                </p>

                {aiError && (
                  <p className="max-w-[250px] text-xs text-red-500">
                    {aiError}
                  </p>
                )}

              </div>
            )}

            {isTranscriptPhase && (
              <>

                <div className="mb-4 flex h-8 items-end gap-[3px]">

                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="w-[3px] rounded-full bg-gradient-to-t from-electric to-emerald"
                      animate={{
                        height: [5, 10 + ((i * 4) % 24), 5],
                      }}
                      transition={{
                        duration: .9,
                        repeat:
                          phase === "typing" ||
                          phase === "listening"
                            ? Infinity
                            : 0,
                        delay: i * .03,
                      }}
                    />
                  ))}

                </div>

                <div className="flex-1 space-y-3">

                  {isLiveVoice &&
                    phase === "listening" && (
                      <p className="italic text-sm leading-relaxed text-ink/60 dark:text-white/60">
                        {interim ||
                          "Start speaking... Phygo is listening in real time."}
                      </p>
                  )}

                  <AnimatePresence mode="popLayout">

                    {visiblePhrases.map((p) => (
                      <motion.p
                        key={p.id}
                        layout
                        layoutId={`${instanceId}-${p.id}`}
                        initial={{
                          opacity: 0,
                          y: 8,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                        }}
                        transition={{
                          duration: .4,
                        }}
                        className="text-sm leading-relaxed text-ink/75 dark:text-white/75"
                      >
                        {p.text}
                      </motion.p>
                    ))}

                  </AnimatePresence>

                </div>

              </>
            )}

            {phase === "done" && (
              <motion.div
                initial={{ opacity: 0, scale: .96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-1 flex-col items-center justify-center gap-4 py-7 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald/10">
                  <CheckCircle2
                    className="text-emerald"
                    size={30}
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-ink dark:text-white">
                    Documentation ready
                  </h3>

                  <p className="mt-1 max-w-[250px] text-sm leading-relaxed text-ink/55 dark:text-white/55">
                    SOAP note, treatment plan and clinical summary generated automatically.
                  </p>
                </div>

                {isLiveVoice && finalNote && (
                  <button
                    onClick={downloadPdf}
                    data-cursor-hover
                    className="mt-1 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[11px] font-semibold text-white transition-transform hover:scale-[1.03] dark:bg-white dark:text-ink"
                  >
                    <Download size={13} />
                    Download PDF
                  </button>
                )}

              </motion.div>
            )}
          </div>

          {/* AI Output */}

          <div className="grid grid-cols-2 gap-3">

            {CATEGORIES.map((cat) => {

              const items = isLiveVoice
                ? aiPhrases.filter((p) => p.cat === cat.key)
                : phrases.filter(
                    (p) => movedIds.has(p.id) && p.cat === cat.key
                  );

              return (
                <motion.div
                  key={cat.key}
                  animate={
                    justFilled === cat.key
                      ? {
                          scale: [1, 1.03, 1],
                          boxShadow:
                            "0 0 0 2px rgba(50,214,160,.45)",
                        }
                      : {
                          scale: 1,
                          boxShadow:
                            "0 0 0 0 rgba(0,0,0,0)",
                        }
                  }
                  transition={{
                    duration: .45,
                  }}
                  className="rounded-2xl border border-black/5 bg-mist/70 p-3 dark:border-white/5 dark:bg-white/5"
                >

                  <div className="mb-2 flex items-center justify-between">

                    <span className="eyebrow text-ink/35 dark:text-white/35">
                      {cat.label}
                    </span>

                    {items.length > 0 && (
                      <CheckCircle2
                        size={13}
                        className="text-emerald"
                      />
                    )}

                  </div>

                  <div className="space-y-2 min-h-[74px]">

                    <AnimatePresence>

                      {items.map((p) => (
                        <motion.p
                          key={p.id}
                          layout
                          layoutId={`${instanceId}-${p.id}`}
                          transition={{
                            duration: .45,
                          }}
                          contentEditable={isLiveVoice}
                          suppressContentEditableWarning
                          onBlur={(e) =>
                            updatePhraseText(p.id, e.currentTarget.textContent || "")
                          }
                          className={`text-[11.5px] leading-snug text-ink/70 dark:text-white/70 ${
                            isLiveVoice
                              ? "cursor-text rounded px-1 -mx-1 outline-none focus:bg-black/5 dark:focus:bg-white/10"
                              : ""
                          }`}
                        >
                          {p.text}
                        </motion.p>
                      ))}

                    </AnimatePresence>


                  </div>

                </motion.div>
              );
            })}

          </div>
                  {clinicalInsight && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-5"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="eyebrow text-emerald-700 dark:text-emerald-400">
                Clinical Insights
              </span>
            </div>
            <h4 className="text-sm font-semibold text-ink mb-3">
              {clinicalInsight.condition_name}
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm text-ink/80">
              <div>
                <p className="font-medium mb-1">Goals</p>
                <p className="text-ink/60">{clinicalInsight.goals}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Clinical Tests</p>
                <p className="text-ink/60">{clinicalInsight.clinical_tests}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Red Flags</p>
                <p className="text-ink/60">{clinicalInsight.red_flags}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Typical Exercises</p>
                <p className="text-ink/60">{clinicalInsight.typical_exercises}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-ink/40">
              Source: {clinicalInsight.source} ({clinicalInsight.source_date}) — Clinical decision support, not a diagnosis.
            </p>
          </motion.div>
        )}
                {rehabPhases.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-4 rounded-2xl border border-black/5 bg-mist p-5"
          >
            <span className="eyebrow text-ink/35 dark:text-white/35 mb-3 block">
              Rehab Protocol
            </span>
            <div className="space-y-4">
              {rehabPhases.map((phase, i) => (
                <div key={phase.id} className="relative pl-6">
                  <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-electric" />
                  {i < rehabPhases.length - 1 && (
                    <div className="absolute left-[5px] top-4 w-px h-full bg-black/10" />
                  )}
                  <p className="text-sm font-semibold text-ink">
                    Phase {phase.phase_number}: {phase.phase_name}
                  </p>
                  <p className="text-xs text-ink/40 mb-2">{phase.typical_duration}</p>
                  <p className="text-sm text-ink/70">
                    <span className="font-medium">Goals: </span>
                    {phase.phase_goals}
                  </p>
                  <p className="text-sm text-ink/70 mt-1">
                    <span className="font-medium">Exercises: </span>
                    {phase.phase_exercises}
                  </p>
                  <p className="text-xs text-ink/40 mt-1">
                    <span className="font-medium">Progress when: </span>
                    {phase.criteria_to_progress}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}


        </div>

        {/* Controls */}

        <div className="mt-7 flex flex-wrap items-center gap-2">

          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => runExample(ex.id)}
              data-cursor-hover
              className={`rounded-full px-3.5 py-2 text-[11px] font-semibold transition-all ${
                activeLabel === ex.label &&
                !isLiveVoice
                  ? "bg-ink text-white dark:bg-white dark:text-ink"
                  : "bg-mist text-ink/60 hover:scale-[1.03] hover:bg-mist-dark dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/20"
              }`}
            >
              {ex.label}
            </button>
          ))}

          {variant === "full" &&
            voiceSupported && (
              <>

              <button
                onClick={
                  phase === "listening"
                    ? stopVoice
                    : startVoice
                }
                data-cursor-hover
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-electric to-emerald px-4 py-2 text-[11px] font-semibold text-white shadow-glow transition-transform hover:scale-[1.03]"
              >
                {phase === "listening" ? (
                  <Square
                    size={11}
                    fill="currentColor"
                  />
                ) : (
                  <Mic size={13} />
                )}

                {phase === "listening"
                  ? "Stop Recording"
                  : "Start Recording"}
              </button>
                      <select
          value={recordingLang}
          onChange={(e) => setRecordingLang(e.target.value)}
          className="ml-2 text-[11px] rounded-lg border border-black/10 bg-white/80 dark:bg-white/10 px-2 py-1 text-ink/70 dark:text-white/70"
        >
          <option value="it-IT">🇮🇹 Italiano</option>
          <option value="en-US">🇬🇧 English</option>
          <option value="es-ES">🇪🇸 Español</option>
          <option value="fr-FR">🇫🇷 Français</option>
        </select>
        </>


          )}

          {variant === "full" &&
            !voiceSupported && (
              <span className="ml-auto flex items-center gap-2 text-[11px] text-ink/35 dark:text-white/35">
                <Sparkles size={12} />
                Voice mode works best in Chrome.
              </span>
          )}

        </div>

      </div>
    </div>
  );
}
