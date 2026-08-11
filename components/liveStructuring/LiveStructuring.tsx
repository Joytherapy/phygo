"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Square,
  CheckCircle2,
  Sparkles,
  Download,
  Target,
  Stethoscope,
  AlertTriangle,
  Dumbbell,
    FileText,
    ImagePlus,
  MessageCircle,

} from "lucide-react";

import jsPDF from "jspdf";

import {
  CATEGORIES,
  EXAMPLES,
  chunkTranscript,
  type Category,
  type Phrase,
} from "./data";
const CATEGORY_ICONS: Record<string, any> = {
  findings: Stethoscope,
  assessment: Target,
  plan: FileText,
  followup: MessageCircle,
};

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
  const [evidenceLevel, setEvidenceLevel] = useState<string | null>(null);
const [matchedKeyword, setMatchedKeyword] = useState<string | null>(null);
const [showWhy, setShowWhy] = useState(false);
const [showAskPhygo, setShowAskPhygo] = useState(false);
const [askQuestion, setAskQuestion] = useState("");
const [askAnswer, setAskAnswer] = useState<string | null>(null);
const [askLoading, setAskLoading] = useState(false);
const [showTextInput, setShowTextInput] = useState(false);
const [uploadedImage, setUploadedImage] = useState<File | null>(null);
const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
const [scanSummary, setScanSummary] = useState<string | null>(null);
const [clinicalContext, setClinicalContext] = useState("");
const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
const [scanAnalyzing, setScanAnalyzing] = useState(false);

const [textInput, setTextInput] = useState("");

const submitTextInput = () => {
  const raw = textInput.trim();
  if (!raw) return;

  reset();
  setIsLiveVoice(true);
  setActiveLabel("Live Session");
  setShowTextInput(false);
  setTextInput("");

  const chunks = chunkTranscript(raw);
  const transcriptPhrases: Phrase[] = chunks.map((text, i) => ({
    id: `${instanceId}-text-${Date.now()}-${i}`,
    text,
    cat: "findings",
  }));

  setPhrases(transcriptPhrases);
  setTypedIds(new Set(transcriptPhrases.map((p) => p.id)));

  generateRealNote(raw, transcriptPhrases);
};
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  setScanSummary(null);
  setScanAnalyzing(true);

  const fileArray = Array.from(files);
  setUploadedFileNames(fileArray.map((f) => f.name));
  const readers = fileArray.map(
    (file) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      })
  );

  Promise.all(readers)
    .then(async (base64Images) => {
      try {
        const res = await fetch("/api/analyze-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
  images: base64Images,
  language: recordingLang,
  context: [
    finalNote?.subjective,
    finalNote?.assessment,
    finalNote?.plan,
    clinicalContext,
  ]
    .filter(Boolean)
    .join(" "),
}),

        });
        const data = await res.json();
        setScanSummary(data.summary || "Could not analyze document.");
      } catch (err) {
        console.error("Scan analysis failed:", err);
        setScanSummary("Could not analyze document.");
      } finally {
        setScanAnalyzing(false);
      }
    })
    .catch((err) => {
      console.error("Failed to read files:", err);
      setScanAnalyzing(false);
    });
};








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
            }, i * 200)
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
          }, finalPhrases.length * 200 + 500)
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
  const formatPhaseText = (text: string) => {
  if (!text) return "";
  const pattern =
    /\s*((?:Fase\s*\d+|Settimana\s*\d+|Prima settimana|Seconda settimana|Terza settimana|Quarta settimana|Quinta settimana|Sesta settimana|Settima settimana|Ottava settimana|Giorno\s*\d+|Giorni\s*\d+)\s*[:\(])/gi;
  return text.replace(pattern, "\n\n$1").trim();
};

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


if (!res.ok) {
  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    setAiError(
      data.message ||
        "You've already tried the free demo. Sign up to keep using Phygo on unlimited patients."
    );
    setPhase("idle");
    return;
  }
  throw new Error("request failed");
}

        const data = await res.json();
        const note = data.note ?? {};
        setFinalNote(note);

        let rehabPhasesLocal: any[] = [];

        if (note.assessment) {
          try {
            const kbRes = await fetch("/api/knowledge-lookup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
body: JSON.stringify({ assessment: note.assessment, primaryCondition: note.primaryCondition, lang: note.language || 'it' }),
            });
            const kbData = await kbRes.json();
setClinicalInsight(kbData.match || null);
setRehabPhases(kbData.phases || []);
setEvidenceLevel(kbData.evidenceLevel || null);
setMatchedKeyword(kbData.matchedKeyword || null);
rehabPhasesLocal = kbData.phases || [];

          } catch (kbErr) {
            console.error("Knowledge lookup failed:", kbErr);
            setClinicalInsight(null);
            setRehabPhases([]);

          }
        }

                let planText = note.plan;
        if (rehabPhasesLocal.length > 0) {
          try {
            const refineRes = await fetch("/api/refine-plan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                transcript: raw,
                assessment: note.assessment,
                planDraft: note.plan,
                phases: rehabPhasesLocal,
                lang: note.language || recordingLang,
              }),
            });
            const refineData = await refineRes.json();
            if (refineData.plan) {
              planText = refineData.plan;
            }
          } catch (refineErr) {
            console.error("Errore refine-plan:", refineErr);
          }
          let exercisesArr = note.exercises;
if (rehabPhasesLocal.length > 0) {
  try {
    const exRes = await fetch("/api/refine-exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: raw,
        assessment: note.assessment,
        exercisesDraft: note.exercises,
        phases: rehabPhasesLocal,
        lang: note.language || recordingLang,
      }),
    });
    const exData = await exRes.json();
    if (exData.exercises) {
      exercisesArr = exData.exercises;
    }
  } catch (exErr) {
    console.error("Errore refine-exercises:", exErr);
  }
}
setFinalNote((prev: any) =>
  prev ? { ...prev, plan: planText, exercises: exercisesArr } : prev
);
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
        push(planText, "plan", "plan");

        if (Array.isArray(note.exercises) && note.exercises.length) {
push(`Exercises:\n${note.exercises.map((e: string) => `• ${e}`).join("\n")}`, "plan", "_exercisesText");
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
            }, i * 200)
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
          }, built.length * 200 + 500)
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
const askPhygoAI = async () => {
  if (!askQuestion.trim()) return;
  setAskLoading(true);
  setAskAnswer(null);
  try {
    const noteContext = finalNote
      ? `Subjective: ${finalNote.subjective || ""}. Objective: ${finalNote.objective || ""}. Assessment: ${finalNote.assessment || ""}. Plan: ${finalNote.plan || ""}.`
      : "";
    const res = await fetch("/api/ask-phygo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: askQuestion, noteContext }),
    });
    const data = await res.json();
    setAskAnswer(data.answer || "Non sono riuscito a generare una risposta.");
  } catch (err) {
    console.error("Errore ask-phygo:", err);
    setAskAnswer("Errore durante la richiesta. Riprova.");
  } finally {
    setAskLoading(false);
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

const sanitizeForPdf = (text: string) =>
  text
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, "-");

const addSection = (title: string, content?: string) => {
  if (!content) return;
  content = sanitizeForPdf(content);

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
        const lines = doc.splitTextToSize(`- ${sanitizeForPdf(ex)}`, usableWidth);

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

if (clinicalInsight) {
  addSection(
    "Clinical Insights",
    `${clinicalInsight.condition_name}\n\nGoals: ${clinicalInsight.goals}\nClinical Tests: ${clinicalInsight.clinical_tests}\nRed Flags: ${clinicalInsight.red_flags}\nTypical Exercises: ${clinicalInsight.typical_exercises}\n\nSource: ${clinicalInsight.source} (${clinicalInsight.source_date})`
  );
}

if (rehabPhases.length > 0) {
  const phasesText = rehabPhases
    .map(
      (p) =>
        `Phase ${p.phase_number}: ${p.phase_name} (${p.typical_duration})\nGoals: ${p.phase_goals}\nExercises: ${p.phase_exercises}\nProgress when: ${p.criteria_to_progress}`
    )
    .join("\n\n");
  addSection("Rehab Protocol", phasesText);
}

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
<div className="relative overflow-hidden rounded-[28px] !border-4 !border-red-500 glass-strong shadow-lift p-7 sm:p-9">

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
          <select
  value={recordingLang}
  onChange={(e) => setRecordingLang(e.target.value)}
className="text-[11px] rounded-lg border border-black/15 dark:border-white/10 bg-black/[0.04] dark:bg-white/10 px-2 py-1"
>
  <option value="it-IT">🇮🇹 Italiano</option>
  <option value="en-US">🇬🇧 English</option>
  <option value="es-ES">🇪🇸 Español</option>
  <option value="fr-FR">🇫🇷 Français</option>
</select>


        </div>

<div className={`grid gap-6 items-start ${variant === "full" ? "grid-cols-1" : "sm:grid-cols-2"}`}>

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
                          filter: "blur(0px)",
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          filter: "blur(0px)",
                        }}
                        exit={{
                          opacity: 0,
                          filter: "blur(6px)",
                          transition: { duration: 0.25 },
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

  {CATEGORIES.map((cat) => {

    const items = isLiveVoice
      ? aiPhrases.filter((p) => p.cat === cat.key)
      : phrases.filter(
          (p) => movedIds.has(p.id) && p.cat === cat.key
        );

    const Icon = CATEGORY_ICONS[cat.key] || Stethoscope;

    return (
      <motion.div
        key={cat.key}
        animate={
          justFilled === cat.key
            ? {
                scale: [1, 1.02, 1],
                boxShadow:
                  "0 0 0 2px rgba(50,214,160,.35)",
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
        className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-sm"
      >

        <div className="mb-3 flex items-center justify-between">

          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-electric/10 text-electric">
              <Icon size={14} />
            </span>
            <span className="eyebrow text-ink/40 dark:text-white/40">
              {cat.label}
            </span>
          </div>

          {items.length > 0 && (
            <CheckCircle2
              size={14}
              className="text-emerald"
            />
          )}

        </div>

        <div className="space-y-2.5 min-h-[74px]">

          <AnimatePresence>

            {items.map((p) => (
              <motion.p
                key={p.id}
                layout
                layoutId={`${instanceId}-${p.id}`}
                transition={{
                  duration: .28,
                }}
                contentEditable={isLiveVoice}
                suppressContentEditableWarning
                onBlur={(e) =>
                  updatePhraseText(p.id, e.currentTarget.textContent || "")
                }
className={`text-[13px] leading-relaxed text-ink/70 dark:text-white/70 ${phraseFields[p.id] === "_exercisesText" ? "whitespace-pre-line " : ""}

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
    className="mt-4 relative overflow-hidden rounded-[24px] border border-[#0F1B2E]/10 dark:border-white/10 bg-gradient-to-br from-[#0F1B2E]/[0.02] to-white dark:from-white/[0.02] dark:to-white/[0.03] p-6 shadow-sm"
  >
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald/50 to-transparent" />

    <div className="flex items-start justify-between mb-5 gap-3">
      <div>
        <span className="eyebrow text-emerald-600 dark:text-emerald-400">
          Clinical Insights
        </span>
        <h4 className="mt-1 text-base font-semibold text-ink dark:text-white">
          {clinicalInsight.condition_name}
        </h4>
      </div>
      {evidenceLevel && (
        <span className="shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          {evidenceLevel === "high" ? "★★★★☆ Strong" : "★★★☆☆ Moderate"}
        </span>
      )}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="flex gap-3">
        <Target size={16} className="mt-0.5 shrink-0 text-electric" />
        <div>
          <p className="text-xs font-semibold text-ink/50 dark:text-white/50 mb-1">Goals</p>
          <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">{clinicalInsight.goals}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Stethoscope size={16} className="mt-0.5 shrink-0 text-electric" />
        <div>
          <p className="text-xs font-semibold text-ink/50 dark:text-white/50 mb-1">Clinical Tests</p>
          <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">{clinicalInsight.clinical_tests}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
        <div>
          <p className="text-xs font-semibold text-ink/50 dark:text-white/50 mb-1">Red Flags</p>
          <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">{clinicalInsight.red_flags}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Dumbbell size={16} className="mt-0.5 shrink-0 text-electric" />
        <div>
          <p className="text-xs font-semibold text-ink/50 dark:text-white/50 mb-1">Typical Exercises</p>
          <p className="text-sm text-ink/70 dark:text-white/70 leading-relaxed">{clinicalInsight.typical_exercises}</p>
        </div>
      </div>
    </div>

    <div className="mt-5 pt-4 border-t border-black/5 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
      <p className="font-mono text-[11px] tracking-tight text-ink/45 dark:text-white/45">
        {clinicalInsight.source} ({clinicalInsight.source_date}) — Clinical decision support, not a diagnosis.
      </p>
      {matchedKeyword && (
        <button
          onClick={() => setShowWhy(!showWhy)}
          className="text-xs font-medium text-electric hover:underline"
        >
          Why this suggestion?
        </button>
      )}
    </div>

    {showWhy && matchedKeyword && (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-2 text-xs text-ink/50 dark:text-white/50"
      >
        Suggested because the note mentions: "{matchedKeyword}"
      </motion.p>
    )}

    <div className="mt-4">
      <button
        onClick={() => setShowAskPhygo((prev) => !prev)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-electric hover:underline"
      >
        <Sparkles size={12} />
        Ask Phygo AI for more insight
      </button>
      {showAskPhygo && (
        <div className="mt-3 space-y-2 rounded-2xl bg-mist/60 dark:bg-white/5 p-4">
          <textarea
            value={askQuestion}
            onChange={(e) => setAskQuestion(e.target.value)}
            placeholder="e.g. What else should I consider for this case?"
            className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 p-2.5 text-xs text-ink/80 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-electric/30"
            rows={2}
          />
          <button
            onClick={askPhygoAI}
            disabled={askLoading}
            className="rounded-full bg-ink dark:bg-white px-4 py-1.5 text-[11px] font-semibold text-white dark:text-ink disabled:opacity-50"
          >
            {askLoading ? "Thinking..." : "Ask"}
          </button>
          {askAnswer && (
            <p className="text-xs text-ink/70 dark:text-white/70 whitespace-pre-line leading-relaxed pt-1">
              {askAnswer}
            </p>
          )}
        </div>
      )}
    </div>
  </motion.div>
)}
{rehabPhases.length > 0 && (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay: 0.1 }}
    className="mt-4 rounded-[24px] border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 shadow-sm"
  >
    <span className="eyebrow text-ink/40 dark:text-white/40 mb-4 block">
      Rehab Protocol
    </span>

    <div className="grid gap-4 sm:grid-cols-3">
      {rehabPhases.map((phase) => (
<div
  key={phase.id}
  className={`rounded-2xl bg-mist/60 dark:bg-white/5 p-4 ${
    (phase.phase_exercises?.length || 0) > 300 ? "sm:col-span-3" : ""
  }`}
>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-electric text-[11px] font-bold text-white">
              {phase.phase_number}
            </span>
            <p className="text-sm font-semibold text-ink dark:text-white">
              {phase.phase_name}
            </p>
          </div>
          <p className="text-[11px] text-ink/40 dark:text-white/40 mb-3">
            {phase.typical_duration}
          </p>
          <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-2">
            <span className="font-medium text-ink/70 dark:text-white/70">Goals: </span>
            {phase.phase_goals}
          </p>
          <p className="text-xs text-ink/60 dark:text-white/60 leading-relaxed mb-2">
            <span className="font-medium text-ink/70 dark:text-white/70">Exercises: </span>
<span className="whitespace-pre-line">{formatPhaseText(phase.phase_exercises)}
</span>
          </p>
          <p className="text-[11px] text-ink/40 dark:text-white/40 leading-relaxed">
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
    className="rounded-full px-3 py-1.5 text-[10px] font-medium transition-all hover:scale-[1.02]"
    style={
      activeLabel === ex.label && !isLiveVoice
        ? { background: "#0e0f12", color: "#ffffff" }
        : {
            background: "rgba(168,85,247,0.06)",
            color: "rgba(168,85,247,0.75)",
            border: "1px solid rgba(168,85,247,0.15)",
          }
    }
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
className="ml-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-electric to-emerald px-5 py-2.5 text-[12px] font-bold text-white shadow-[0_8px_24px_rgba(79,124,255,0.4)] transition-transform hover:scale-[1.05]"
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
              
        </>


          )}

                    {variant === "full" &&
            !voiceSupported && (
              <span className="ml-auto flex items-center gap-2 text-[11px] text-ink/35 dark:text-white/35">
                <Sparkles size={12} />
                Voice mode works best in Chrome.
              </span>
          )}

          {variant === "full" && (
            <button
  onClick={() => setShowTextInput((prev) => !prev)}
  data-cursor-hover
className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] font-bold transition-all hover:scale-[1.05] ${voiceSupported ? "" : "ml-auto"}`}
style={{
  background: "rgba(79,124,255,0.16)",
  color: "#4F7CFF",
  border: "1.5px solid rgba(79,124,255,0.35)",
}}

            >
              <FileText size={13} />
Write instead
</button>
)}
{variant === "full" && (
  <div className="w-full flex flex-col gap-2">
  <input
  type="text"
  value={clinicalContext}
  onChange={(e) => setClinicalContext(e.target.value)}
  placeholder="Clinical context (optional): e.g. suspected osteoarthritis, acute trauma"
  className="w-full mb-2 text-[11px] rounded-lg border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/10 px-2 py-1.5"
/>
<p className="text-[10px] text-ink/40 dark:text-white/40 mt-1">
  Tip: hold Cmd (or Ctrl on Windows) and select multiple files together to analyze them as one case.
</p>
 <label
  data-cursor-hover
  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold ${
    !finalNote ? "cursor-not-allowed opacity-40" : ""
  }`}
  style={{
    background: "rgba(50,214,160,0.10)",
    color: "#1a9c74",
    border: "1px solid rgba(50,214,160,0.22)",
  }}
  onClick={(e) => {
    if (!finalNote) e.preventDefault();
  }}
>

    <ImagePlus size={13} />
    Upload scan
    <input
      type="file"
      accept="image/*"
      multiple
      onChange={handleImageUpload}
      disabled={!finalNote}

      className="hidden"
    />
  </label>
  {!finalNote && (
  <p className="text-[10px] text-ink/40 dark:text-white/40 mt-1">
    Available after generating a session note
  </p>
)}

  </div>
  )}
  {uploadedFileNames.length > 0 && (
  <p className="text-[11px] text-ink/50 dark:text-white/50 mt-2">
    {uploadedFileNames.length === 1
      ? `1 file: ${uploadedFileNames[0]}`
      : `${uploadedFileNames.length} files: ${uploadedFileNames.join(", ")}`}
  </p>
)}
{uploadedFileNames.length > 0 && (
  <p className="text-[11px] text-ink/50 dark:text-white/50 mt-2">
    {uploadedFileNames.length === 1
      ? `1 file: ${uploadedFileNames[0]}`
      : `${uploadedFileNames.length} files: ${uploadedFileNames.join(", ")}`}
  </p>
)}

  {scanAnalyzing && (
  <span className="text-[11px] text-ink/50 dark:text-white/50 italic">
    Analyzing document...
  </span>
)}

{scanSummary && !scanAnalyzing && (
  <div
    className="mt-3 w-full rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed"
    style={{
      background: "rgba(50,214,160,0.06)",
      border: "1px solid rgba(50,214,160,0.18)",
      color: "inherit",
    }}
  >
    <span className="font-semibold text-[11px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
      Document summary
    </span>
<p className="mt-1 whitespace-pre-line">{scanSummary}</p>
  </div>
)}



        </div>

        {variant === "full" && showTextInput && (
          <div className="mt-4 space-y-2 rounded-2xl bg-mist/60 dark:bg-white/5 p-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Scrivi qui le tue osservazioni sulla seduta..."
              className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-white/10 p-2.5 text-xs text-ink/80 dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-electric/30"
              rows={4}
            />
            <button
              onClick={submitTextInput}
              disabled={!textInput.trim()}
              data-cursor-hover
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-electric to-emerald px-4 py-2 text-[11px] font-semibold text-white shadow-glow transition-transform hover:scale-[1.03] disabled:opacity-50"
            >
              Genera nota
            </button>
          </div>
        )}


      </div>
    </div>
  );
}
