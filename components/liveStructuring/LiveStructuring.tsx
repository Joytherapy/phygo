"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  BookOpen,
  ExternalLink,
  ChevronDown,
  Languages,
  PenLine,
  ShieldCheck,

} from "lucide-react";

import jsPDF from "jspdf";
import { refusalMessage, useVerificationStrings } from "@/lib/i18n/verificationStrings";
import { createBrowserClient } from "@supabase/ssr";

const supabase = lazy(() => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
));

import {
  CATEGORIES,
  EXAMPLES,
  chunkTranscript,
  type Category,
  type Phrase,
} from "./data";
import { lazy } from "@/lib/lazy";
import { useLiveUi, DICTATION_LOCALE } from "@/lib/i18n/liveStructuringStrings";
import { ACCENT, CHIP, ICON_TILE, INPUT_FOCUS, PRIMARY_BTN, SECONDARY_BTN } from "@/components/ui/premium";
import Link from "next/link";
import { CalendarCheck, PlayCircle } from "lucide-react";
import { CARE_STRINGS } from "@/lib/i18n/careStrings";
import { syncProgrammeFromNote, type SyncResult } from "@/lib/care/fromNote";
import { bookletExercises, bookletPapers, bookletPhases, buildPatientBooklet, type BookletSections } from "@/lib/care/patientBooklet";
import { imageAsJpeg } from "@/lib/care/programPdf";
import { usePatientContext } from "@/contexts/PatientContext";
import { localDate } from "@/lib/care/program";
import EvidenceBadge from "@/components/EvidenceBadge";
import { loadClinicianSignature } from "@/lib/care/clinicianSignature";
import { caseOf, checkOutput, type Issue, type SectionName } from "@/lib/clinical/coherence";
import { exerciseFit } from "@/lib/clinical/region";
import { dosingOrigin, exerciseOrigin } from "@/lib/clinical/facts";

// One look for every block of the panel (a quiet tile inside the page card).
const BLOCK = "mt-4 rounded-[22px] border border-black/[0.06] bg-white/70 p-5 sm:p-6 dark:border-white/[0.07] dark:bg-white/[0.025]";
const FIELD = `w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink/35 dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-white/30 ${INPUT_FOCUS}`;
const LABEL = "text-[12px] font-semibold text-ink/60 dark:text-white/50";

function BlockTitle({ icon: Icon, children, tone = "neutral" }: { icon: any; children: React.ReactNode; tone?: "neutral" | "amber" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${tone === "amber" ? "border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400" : ICON_TILE}`}>
        <Icon size={15} aria-hidden />
      </span>
      <h3 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-ink dark:text-white">{children}</h3>
    </div>
  );
}
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
  patientId,
  onSaved,
  compact = false,
}: {
  instanceId: string;
  variant?: "hero" | "full";
  className?: string;
  patientId?: string;
  onSaved?: () => void;
  /** Narrow column (beside the video call): one tile per row. */
  compact?: boolean;
}) {
  const verificationUi = useVerificationStrings();
  const { s: t, lang } = useLiveUi();
  const [phase, setPhase] = useState<Phase>("idle");

  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [typedIds, setTypedIds] = useState<Set<string>>(new Set());
  const [movedIds, setMovedIds] = useState<Set<string>>(new Set());

  const [aiPhrases, setAiPhrases] = useState<Phrase[]>([]);
  const [finalNote, setFinalNote] = useState<any>(null);
  const [clinicalInsight, setClinicalInsight] = useState<any>(null);
  const [rehabPhases, setRehabPhases] = useState<any[]>([]);
  const [evidenceLevel, setEvidenceLevel] = useState<string | null>(null);
const [relevantPapers, setRelevantPapers] = useState<any[]>([]);
const [papersLoading, setPapersLoading] = useState(false);
// After a note: whether the evidence and protocol searches have answered, so an
// empty result is said instead of the block silently not appearing.
const [papersChecked, setPapersChecked] = useState(false);
const [kbChecked, setKbChecked] = useState<string | null>(null);
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

const [exerciseEntries, setExerciseEntries] = useState<any[]>([]);
const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
const [editingExercise, setEditingExercise] = useState<string | null>(null);
const [showAddExercise, setShowAddExercise] = useState(false);
const [exerciseSearchQuery, setExerciseSearchQuery] = useState("");
const [exerciseSearchResults, setExerciseSearchResults] = useState<any[]>([]);
const [exerciseSearching, setExerciseSearching] = useState(false);
// What the clinician said for the last generated note, and the exercises the
// draft proposed for another body region (left out, can be added back).
const [noteTranscript, setNoteTranscript] = useState("");
const [excludedExercises, setExcludedExercises] = useState<{ name: string; reason?: string; regions?: string[]; caseRegions?: string[] }[]>([]);
// Whether the condition sheet's region could be verified against the case (/api/knowledge-lookup).
const [insightRelevance, setInsightRelevance] = useState<{ relevance: string | null; reason: string | null }>({ relevance: null, reason: null });
// Condition sheets for the other regions treated today (/api/knowledge-lookup `others`).
const [otherSheets, setOtherSheets] = useState<{ region: string; side: string | null; match: { condition_name: string } | null; relevance?: "verified" | "unverified" | null; relevanceReason?: string | null }[]>([]);
// Statements taken out of the draft because the clinician did not say them (/api/generate-note `removed`).
const [removedFacts, setRemovedFacts] = useState<{ section: string; text: string; kind: string; item: string; replacement?: string }[]>([]);

const [textInput, setTextInput] = useState("");

// Salvataggio sul paziente: esplicito, non automatico. Il fisioterapista
// deve rivedere (ed eventualmente modificare testo/esercizi) prima di
// premere "Save to Patient" — niente scrittura silenziosa sul referto del
// paziente prima che l'output AI sia stato controllato.
const [noteSaveStatus, setNoteSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
const savedNoteIdRef = useRef<string | null>(null);
// "Put in the home programme": the reviewed exercises of the saved note become
// the patient's home programme (lib/care/fromNote.ts), without retyping them.
const care = CARE_STRINGS[lang as keyof typeof CARE_STRINGS] ?? CARE_STRINGS.it;
const [programStatus, setProgramStatus] = useState<"idle" | "sending" | SyncResult>("idle");
// The patient booklet: summary, recovery path, exercises and evidence of this
// note in one document for the patient (lib/care/patientBooklet.ts).
const { currentPatient } = usePatientContext();
const [bookletSections, setBookletSections] = useState<BookletSections>({ summary: true, path: true, exercises: true, evidence: true });
const [currentPhase, setCurrentPhase] = useState<number | null>(null);
const [bookletStatus, setBookletStatus] = useState<"idle" | "working" | "error">("idle");

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
        const data = await res.json().catch(() => ({}));
        setScanSummary(
          data.summary ||
            refusalMessage(verificationUi, res.status, data) ||
            t.scanError
        );
      } catch (err) {
        console.error("Scan analysis failed:", err);
        setScanSummary(t.scanError);
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
const [recordingLang, setRecordingLang] = useState(DICTATION_LOCALE[lang]);
  // Dictation follows the app language until the clinician picks another one.
  const langTouched = useRef(false);
  useEffect(() => {
    if (!langTouched.current) setRecordingLang(DICTATION_LOCALE[lang]);
  }, [lang]);

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

    setExerciseEntries([]);
    setExcludedExercises([]);
    setInsightRelevance({ relevance: null, reason: null });
    setOtherSheets([]);
    setRemovedFacts([]);
    setNoteTranscript("");
    setExpandedExercise(null);
    setEditingExercise(null);
    setShowAddExercise(false);
    setExerciseSearchQuery("");
    setExerciseSearchResults([]);

    setNoteSaveStatus("idle");
    savedNoteIdRef.current = null;

    setRelevantPapers([]);
    setPapersLoading(false);
    setPapersChecked(false);
    setKbChecked(null);
    setProgramStatus("idle");
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
  // Verification required, hourly limit or service unavailable: say which.
  const data = await res.json().catch(() => ({}));
  const refusal = refusalMessage(verificationUi, res.status, data);
  if (refusal) {
    setAiError(refusal);
    setPhase("idle");
    return;
  }
  throw new Error("request failed");
}

        const data = await res.json();
        const note = data.note ?? {};
        setFinalNote(note);
        setNoteTranscript(raw);
        setRemovedFacts(Array.isArray(data.removed) ? data.removed : []);

        // Evidenze scientifiche rilevanti dalla libreria Scienza/PubMed già
        // esistente in Phygo — parte in parallelo (non await) così non
        // aggiunge latenza alla generazione di assessment/piano/esercizi.
        if (note.primaryCondition || note.assessment) {
          setPapersLoading(true);
          fetch("/api/science/relevant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              primaryCondition: note.primaryCondition,
              assessment: note.assessment,
              transcript: raw,
            }),
          })
            .then((r) => r.json())
            .then((d) => setRelevantPapers(Array.isArray(d.papers) ? d.papers : []))
            .catch((err) => {
              console.error("science/relevant failed:", err);
              setRelevantPapers([]);
            })
            .finally(() => {
              setPapersLoading(false);
              setPapersChecked(true);
            });
        }

        let rehabPhasesLocal: any[] = [];

        if (note.assessment) {
          try {
            const kbRes = await fetch("/api/knowledge-lookup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
body: JSON.stringify({ assessment: note.assessment, primaryCondition: note.primaryCondition, lang: note.language || 'it', transcript: raw }),
            });
            const kbData = await kbRes.json();
setClinicalInsight(kbData.match || null);
setInsightRelevance({ relevance: kbData.relevance ?? null, reason: kbData.relevanceReason ?? null });
setOtherSheets(Array.isArray(kbData.others) ? kbData.others : []);
setRehabPhases(kbData.phases || []);
setEvidenceLevel(kbData.evidenceLevel || null);
setMatchedKeyword(kbData.matchedKeyword || null);
rehabPhasesLocal = kbData.phases || [];
setKbChecked(note.primaryCondition || note.assessment.slice(0, 80));

          } catch (kbErr) {
            console.error("Knowledge lookup failed:", kbErr);
            setClinicalInsight(null);
            setRehabPhases([]);

          }
        }

                let planText = note.plan;
        let exercisesArr: any = note.exercises;
        let exerciseEntriesArr: any[] = [];
        // Nota: qui prima veniva chiamato anche /api/refine-plan, ma quella
        // chiamata era un no-op silenzioso — mandava "planDraft" a una route
        // che si aspettava "exercisesDraft", e leggeva "refineData.plan" da
        // una risposta che restituisce solo "exercises". Il risultato non è
        // mai stato usato: era una chiamata OpenAI pagata e inutile ad ogni
        // sessione. Rimossa; refine-plan/route.ts (identico a
        // refine-exercises/route.ts) non è più chiamato da nessuna parte —
        // può essere eliminato dal progetto.
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

if (Array.isArray(exercisesArr) && exercisesArr.length > 0) {
  try {
    const eiRes = await fetch("/api/exercise-intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exercisesDraft: exercisesArr,
        assessment: note.assessment,
        primaryCondition: note.primaryCondition,
        lang: note.language || recordingLang,
        transcript: raw,
      }),
    });
    const eiData = await eiRes.json();
    if (Array.isArray(eiData.exercises)) {
      exerciseEntriesArr = eiData.exercises;
    }
    // Exercises for another body region stay out of the note too; they are
    // listed under the coherence checks, with "Add anyway".
    const excluded: { name: string; reason?: string; regions?: string[]; caseRegions?: string[] }[] = Array.isArray(eiData.excluded) ? eiData.excluded : [];
    setExcludedExercises(excluded);
    if (excluded.length && Array.isArray(exercisesArr)) {
      const out = new Set(excluded.map((e) => e.name));
      exercisesArr = exercisesArr.filter((e: any) => !out.has(typeof e === "string" ? e : e?.name));
    }
  } catch (eiErr) {
    console.error("Errore exercise-intelligence:", eiErr);
  }
}
setExerciseEntries(exerciseEntriesArr);

setFinalNote((prev: any) =>
  prev ? { ...prev, plan: planText, exercises: exercisesArr } : prev
);

        // Nota: NON salviamo più qui in automatico. Il fisioterapista rivede
        // (ed eventualmente modifica testo ed esercizi) nella fase "done",
        // poi salva esplicitamente con saveNoteToPatient() — vedi sotto.

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

        push(note.summaryForPatient, "followup", "summaryForPatient");

        setPhraseFields(fieldMap);

        if (built.length === 0) {
          throw new Error("empty note");
        }

        setPhase("flying");
        setProgress(60);

        setMovedIds(new Set(transcriptPhrases.map((p) => p.id)));

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
        setAiError(t.noteError);
        setPhase("idle");
      }
    },
    [instanceId, recordingLang, patientId, onSaved, t]
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
      setNoteSaveStatus((s) => (s === "saved" ? "idle" : s));
    }
  };

  const updateExerciseDosing = (key: string, field: string, value: string) => {
    setExerciseEntries((prev) =>
      prev.map((ex: any, i: number) => {
        const exKey = ex.internal_id || String(i);
        if (exKey !== key) return ex;
        const numFields = ["sets", "reps", "duration_seconds", "frequency_per_week"];
        const parsedValue = numFields.includes(field)
          ? value === "" ? null : Number(value)
          : value;
        return { ...ex, dosing: { ...ex.dosing, [field]: parsedValue } };
      })
    );
    setNoteSaveStatus((s) => (s === "saved" ? "idle" : s));
  };

  const removeExercise = (key: string) => {
    setExerciseEntries((prev) =>
      prev.filter((ex: any, i: number) => (ex.internal_id || String(i)) !== key)
    );
    setNoteSaveStatus((s) => (s === "saved" ? "idle" : s));
  };

  // Undoes a change to the draft: a statement taken out goes back at the end
  // of its section; a labelled one ("Ipotesi da confermare: …") gets its
  // original wording back. In the clinical reasoning too.
  const restoreRemoved = (r: { section: string; text: string; replacement?: string }) => {
    setRemovedFacts((prev) => prev.filter((x) => x !== r));
    const undo = (current: string) => (r.replacement && current.includes(r.replacement) ? current.replace(r.replacement, r.text) : current ? `${current} ${r.text}` : r.text);
    if (["supportingFindings", "findingsAgainst", "redFlagsPrecautions"].includes(r.section)) {
      setFinalNote((prev: any) => (prev ? { ...prev, clinicalReasoning: { ...(prev.clinicalReasoning ?? {}), [r.section]: undo(((prev.clinicalReasoning ?? {})[r.section] ?? "").trim()) } } : prev));
      setNoteSaveStatus((s) => (s === "saved" ? "idle" : s));
      return;
    }
    const id = Object.keys(phraseFields).find((k) => phraseFields[k] === r.section);
    const current = (finalNote?.[r.section] as string | undefined)?.trim() ?? "";
    const text = undo(current);
    if (id) return updatePhraseText(id, text);
    const newId = `${instanceId}-restored-${Date.now()}`;
    const cat: Category = r.section === "plan" ? "plan" : r.section === "summaryForPatient" ? "followup" : r.section === "assessment" ? "assessment" : "findings";
    setAiPhrases((prev) => [...prev, { id: newId, text, cat }]);
    setPhraseFields((prev) => ({ ...prev, [newId]: r.section }));
    setFinalNote((prev: any) => (prev ? { ...prev, [r.section]: text } : prev));
    setNoteSaveStatus((s) => (s === "saved" ? "idle" : s));
  };

  // Replaces a note exercise with the library exercise suggested for it (an unverified match), keeping its dose.
  const useSuggestedMatch = (key: string) => {
    setExerciseEntries((prev) =>
      prev.map((ex: any, i: number) => {
        if ((ex.internal_id || String(i)) !== key || !ex.suggested_match) return ex;
        return { ...ex.suggested_match, internal_id: `${ex.suggested_match.internal_id}-${Date.now()}`, draft: ex.draft, dosing: ex.dosing, source_type: ex.source_type, clinical_check: null, relevance: ex.relevance, relevance_reason: ex.relevance_reason, match_status: "verified", suggested_match: null };
      })
    );
    setNoteSaveStatus((s) => (s === "saved" ? "idle" : s));
  };

  const addBackExcluded = (name: string) => {
    setExcludedExercises((prev) => prev.filter((e) => e.name !== name));
    setExerciseEntries((prev) => [
      ...prev,
      {
        internal_id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        provider: "custom",
        provider_id: null,
        name,
        draft: name,
        description: null,
        instructions: null,
        body_region: null,
        primary_muscle: null,
        media: null,
        source_type: "professional",
        dosing: { sets: null, reps: null, duration_seconds: null, frequency_per_week: null, notes: null },
        clinical_check: null,
      },
    ]);
    setFinalNote((prev: any) => (prev && Array.isArray(prev.exercises) ? { ...prev, exercises: [...prev.exercises, name] } : prev));
    setNoteSaveStatus((s) => (s === "saved" ? "idle" : s));
  };

  // Deterministic checks of what was generated against what the clinician
  // said (lib/clinical/coherence.ts): region, side, exercises, papers,
  // protocol, measurements not given. Recomputed as the clinician edits.
  // Today's case (regions of the current problem, history, sides) for the badges on exercises.
  const caseView = useMemo(() => (finalNote && noteTranscript ? caseOf(noteTranscript, finalNote) : null), [finalNote, noteTranscript]);

  const coherenceIssues = useMemo(() => {
    if (!finalNote || !noteTranscript) return [];
    return checkOutput({
      transcript: noteTranscript,
      note: finalNote,
      exercises: exerciseEntries.map((e: any) => ({ name: e.name ?? "", draft: e.draft ?? null, body_region: e.body_region, primary_muscle: e.primary_muscle })),
      papers: relevantPapers.map((p: any) => ({ title: p.title ?? "", relevance: p.relevance ?? null, relevance_reason: p.relevance_reason ?? null, regions: p.regions ?? null })),
      protocol: clinicalInsight ? { name: clinicalInsight.condition_name ?? "", keywords: clinicalInsight.condition_keywords ?? null } : null,
      otherProtocols: otherSheets.map((o: any) => ({ region: o.region, name: o.match?.condition_name ?? null })),
    });
  }, [finalNote, noteTranscript, exerciseEntries, relevantPapers, clinicalInsight, otherSheets]);

  // How each check names what it is about: a section by its heading, regions by name.
  const sectionLabel = (name: SectionName): string =>
    ({
      subjective: t.subjective, objective: t.objective, assessment: t.assessment, plan: t.plan, summaryForPatient: t.patientSummary,
      hypotheses: t.hypotheses, differentials: t.differentials, supportingFindings: t.supportingFindings, findingsAgainst: t.findingsAgainst,
      missingInformation: t.missingInfo, suggestedAssessments: t.suggestedAssessments, redFlagsPrecautions: t.redFlagsPrecautions,
    })[name];
  const regionLabel = (regions?: string[]) => (regions ?? []).map((r) => (t.regionNames as Record<string, string>)[r] ?? r).join(", ");
  const issueText = (issue: Issue) => {
    let item = issue.item;
    if (issue.kind === "side" && issue.section) item = sectionLabel(issue.section);
    if ((issue.kind === "section_region" || issue.kind === "history_as_active") && issue.section) item = `${sectionLabel(issue.section)} (${regionLabel(issue.regions)})`;
    if (["invented", "invented_finding", "invented_test", "invented_appointment", "invented_agreement", "invented_treatment", "invented_negative", "unconfirmed_diagnosis", "generated_dosage"].includes(issue.kind) && issue.section) item = `"${issue.item}" (${sectionLabel(issue.section)})`;
    if (issue.kind.startsWith("coverage_")) item = regionLabel([issue.item]);
    return t.coherenceIssue[issue.kind](item);
  };

  const searchExerciseDb = async (query: string) => {
    setExerciseSearchQuery(query);
    if (!query.trim()) {
      setExerciseSearchResults([]);
      return;
    }
    setExerciseSearching(true);
    try {
      const res = await fetch(`/api/exercise-search?q=${encodeURIComponent(query.trim())}&lang=${lang}`);
      const data = await res.json();
      setExerciseSearchResults(data.exercises || []);
    } catch (err) {
      console.error("Errore ricerca esercizio:", err);
      setExerciseSearchResults([]);
    } finally {
      setExerciseSearching(false);
    }
  };

  const addExerciseToList = (entry: any) => {
    setExerciseEntries((prev) => [
      ...prev,
      {
        ...entry,
        internal_id: `${entry.internal_id}-${Date.now()}`,
        source_type: "professional",
        dosing: {
          sets: null,
          reps: null,
          duration_seconds: null,
          frequency_per_week: null,
          notes: null,
        },
        clinical_check: null,
      },
    ]);
    setShowAddExercise(false);
    setExerciseSearchQuery("");
    setExerciseSearchResults([]);
    setNoteSaveStatus((s) => (s === "saved" ? "idle" : s));
  };

  // Salva (o aggiorna, se già salvata in questa sessione) la nota sul
  // paziente. Usa lo stato CORRENTE — finalNote riflette eventuali modifiche
  // fatte col testo editabile (updatePhraseText), ed exerciseEntries riflette
  // aggiunte/rimozioni/dosaggi fatti nella review. Se exerciseEntries è
  // popolato (il caso normale quando ci sono fasi riabilitative note) lo
  // salviamo così com'è: è la stessa forma oggetto (name, dosing, ecc.) che
  // My Phygo (lato paziente) si aspetta già di leggere.
  const saveNoteToPatient = async () => {
    if (!patientId || !finalNote) return;
    setNoteSaveStatus("saving");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Exercises of the Exercises section carry signed media links that expire
      // in 30 minutes: they are not stored; the reference (provider_id) is.
      const exercisesToSave =
        exerciseEntries.length > 0
          ? exerciseEntries.map((ex: any) => {
              // Whose it is: done today, named by the clinician, or the AI's suggestion; and whose its dose is.
              const origin = noteTranscript ? { origin: exerciseOrigin(ex.draft ?? ex.name ?? "", noteTranscript).origin, dosing_origin: dosingOrigin(ex.dosing, noteTranscript) } : {};
              return ex.provider === "exercises" ? { ...ex, ...origin, media: null } : { ...ex, ...origin };
            })
          : finalNote.exercises || null;

      const payload = {
        patient_id: patientId,
        user_id: user?.id,
        subjective: finalNote.subjective || null,
        objective: finalNote.objective || null,
        assessment: finalNote.assessment || null,
        plan: finalNote.plan || null,
        exercises: exercisesToSave,
        summary_for_patient: finalNote.summaryForPatient || null,
        language: finalNote.language || recordingLang,
        clinical_reasoning: finalNote.clinicalReasoning || null,
      };

      if (savedNoteIdRef.current) {
        const { error } = await supabase
          .from("notes")
          .update(payload)
          .eq("id", savedNoteIdRef.current);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("notes")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        savedNoteIdRef.current = data?.id ?? null;
      }

      setNoteSaveStatus("saved");
      setProgramStatus("idle");
      onSaved?.();
    } catch (saveErr) {
      console.error("Errore salvataggio nota:", saveErr);
      setNoteSaveStatus("error");
    }
  };

const sendToProgramme = async () => {
  if (!patientId || noteSaveStatus !== "saved") return;
  setProgramStatus("sending");
  const result = await syncProgrammeFromNote(supabase, {
    patientId,
    noteId: savedNoteIdRef.current,
    exercises: exerciseEntries.length > 0 ? exerciseEntries : finalNote?.exercises,
    title: care.clinician.defaultTitle,
    checkinTitle: care.clinician.checkinsOn,
  });
  if (result.kind === "error") console.error(`home programme from note: ${result.where} failed:`, result.code);
  setProgramStatus(result);
};

const downloadBooklet = async () => {
  if (!finalNote) return;
  setBookletStatus("working");
  try {
    const images = new Map<string, string>();
    await Promise.all(
      exerciseEntries.map(async (ex: any, i: number) => {
        const jpeg = ex.media?.image_url ? await imageAsJpeg(ex.media.image_url) : null;
        if (jpeg) images.set(String(ex.internal_id ?? i), jpeg);
      })
    );
    const doc = buildPatientBooklet({
      patientName: currentPatient && currentPatient.id === patientId ? currentPatient.name : "",
      clinician: await loadClinicianSignature(supabase),
      date: localDate(new Date()),
      summary: finalNote.summaryForPatient || "",
      phases: bookletPhases(rehabPhases),
      currentPhase,
      exercises: bookletExercises(exerciseEntries.length > 0 ? exerciseEntries : finalNote.exercises, care.plan, care.clinician.weekdays, images),
      papers: bookletPapers(relevantPapers),
      guideline: clinicalInsight?.condition_name && clinicalInsight?.source ? { name: clinicalInsight.condition_name, source: clinicalInsight.source, date: clinicalInsight.source_date || null } : null,
      sections: bookletSections,
      appUrl: `${window.location.origin}/my-phygo/home`,
      t: care.booklet,
      plan: care.plan,
      lang,
    });
    doc.save(`phygo-opuscolo-${localDate(new Date())}.pdf`);
    setBookletStatus("idle");
  } catch (err) {
    console.error("patient booklet failed:", err instanceof Error ? err.message : "error");
    setBookletStatus("error");
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
        if (res.status === 429) {
      setAskAnswer(t.askLimit);
      return;
    }
    const data = await res.json();
    setAskAnswer(data.answer || t.askNoAnswer);
  } catch (err) {
    console.error("Errore ask-phygo:", err);
    setAskAnswer(t.askError);
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
    doc.text(t.pdfTitle, marginLeft, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(new Date().toLocaleString(), marginLeft, y);
    y += 12;

    addSection(t.subjective, finalNote.subjective);
    addSection(t.objective, finalNote.objective);
    addSection(t.assessment, finalNote.assessment);
    addSection(t.plan, finalNote.plan);

    if (exerciseEntries.length > 0) {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(t.exercises, marginLeft, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      exerciseEntries.forEach((ex: any) => {
        const dosingParts: string[] = [];
        if (ex.dosing?.sets) dosingParts.push(t.sets(ex.dosing.sets));
        if (ex.dosing?.reps) dosingParts.push(t.reps(ex.dosing.reps));
        if (ex.dosing?.duration_seconds) dosingParts.push(`${ex.dosing.duration_seconds}s`);
        if (ex.dosing?.frequency_per_week) dosingParts.push(t.perWeek(ex.dosing.frequency_per_week));
        const dosingText = dosingParts.length ? ` (${dosingParts.join(", ")})` : "";
        const mainLine = `- ${sanitizeForPdf(ex.name)}${dosingText}`;
        const lines = doc.splitTextToSize(mainLine, usableWidth);
        lines.forEach((line: string) => {
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
          doc.text(line, marginLeft, y);
          y += 6;
        });
        if (ex.dosing?.notes) {
          doc.setFont("helvetica", "italic");
          const noteLines = doc.splitTextToSize(`  ${sanitizeForPdf(ex.dosing.notes)}`, usableWidth);
          noteLines.forEach((line: string) => {
            if (y > 280) {
              doc.addPage();
              y = 20;
            }
            doc.text(line, marginLeft, y);
            y += 6;
          });
          doc.setFont("helvetica", "normal");
        }
      });
      y += 6;
    } else if (finalNote._exercisesText) {
      addSection(t.exercises, finalNote._exercisesText);
    } else if (Array.isArray(finalNote.exercises) && finalNote.exercises.length) {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(t.exercises, marginLeft, y);
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

    addSection(t.patientSummary, finalNote.summaryForPatient);

if (clinicalInsight) {
  addSection(
    t.clinicalInsights,
    `${clinicalInsight.condition_name}\n\n${t.goals}: ${clinicalInsight.goals}\n${t.clinicalTests}: ${clinicalInsight.clinical_tests}\n${t.redFlags}: ${clinicalInsight.red_flags}\n${t.typicalExercises}: ${clinicalInsight.typical_exercises}\n\n${t.source}: ${clinicalInsight.source} (${clinicalInsight.source_date})`
  );
}

if (rehabPhases.length > 0) {
  const phasesText = rehabPhases
    .map(
      (p) =>
        `${t.phase(p.phase_number)}: ${p.phase_name} (${p.typical_duration})\n${t.phaseGoals}${p.phase_goals}\n${t.phaseExercises}${p.phase_exercises}\n${t.progressWhen}${p.criteria_to_progress}`
    )
    .join("\n\n");
  addSection(t.rehabProtocol, phasesText);
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

  const isFull = variant === "full";
  const statusLabel =
    phase === "idle"
      ? t.ready
      : phase === "typing" || phase === "listening"
      ? t.listening
      : phase === "pause"
      ? t.analyzing
      : phase === "flying"
      ? t.generating
      : t.completedIn(elapsed ?? "0");
  const canDictate = isFull && voiceSupported;

  return (
    <div className={className}>
      <div className={isFull ? "relative" : "relative overflow-hidden rounded-[28px] glass-strong shadow-lift p-7 sm:p-9"}>

        {/* Status */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span role="status" className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium ${CHIP}`}>
              <span className="relative flex h-2 w-2">
                {phase !== "idle" && phase !== "done" && (
                  <span className="absolute inset-0 rounded-full bg-[#8B95FF] opacity-60 motion-safe:animate-ping" />
                )}
                <span
                  className={`relative h-2 w-2 rounded-full ${
                    phase === "idle" ? "bg-ink/25 dark:bg-white/30" : phase === "done" ? "bg-emerald-500" : "bg-[#8B95FF]"
                  }`}
                />
              </span>
              {statusLabel}
            </span>
            {activeLabel && phase !== "idle" && (
              <span className={`rounded-full px-3 py-1 text-[12px] font-medium ${CHIP}`}>
                {isLiveVoice ? t.liveSession : t.aiDemo}
              </span>
            )}
          </div>

          <label className="relative inline-flex items-center">
            <span className="sr-only">{t.recordingLanguage}</span>
            <Languages size={13} aria-hidden className="pointer-events-none absolute left-3 text-ink/50 dark:text-white/50" />
            <select
              value={recordingLang}
              onChange={(e) => {
                langTouched.current = true;
                setRecordingLang(e.target.value);
              }}
              className={`appearance-none rounded-full py-1.5 pl-8 pr-8 text-[12px] font-medium outline-none ${CHIP} ${INPUT_FOCUS}`}
            >
              <option value="it-IT">Italiano</option>
              <option value="en-US">English</option>
              <option value="es-ES">Español</option>
              <option value="fr-FR">Français</option>
            </select>
            <ChevronDown size={13} aria-hidden className="pointer-events-none absolute right-3 text-ink/50 dark:text-white/50" />
          </label>
        </div>

        {phase !== "idle" && (
          <div className="mb-6 h-1 w-full overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.06]">
            <motion.div className="h-full rounded-full" style={{ background: ACCENT }} animate={{ width: `${progress}%` }} transition={{ duration: 0.35 }} />
          </div>
        )}

        <div className={`grid items-start gap-6 ${isFull ? "grid-cols-1" : "sm:grid-cols-2"}`}>

          {/* Transcript */}
          <div className="flex min-h-[170px] flex-col">

            {phase === "idle" && (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
                <div className="relative grid h-28 w-28 place-items-center">
                  <span aria-hidden className="absolute inset-2 rounded-full opacity-50 blur-2xl dark:opacity-60" style={{ background: ACCENT }} />
                  <span aria-hidden className="absolute inset-0 rounded-full border border-[#8B95FF]/25 motion-safe:animate-[ping_3.2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  <span aria-hidden className="absolute inset-3 rounded-full border border-[#8B95FF]/20" />
                  {canDictate ? (
                    <button
                      type="button"
                      onClick={startVoice}
                      aria-label={t.startRecording}
                      className="relative grid h-[76px] w-[76px] place-items-center rounded-full text-white shadow-[0_18px_40px_-12px_rgba(124,131,255,0.7),inset_0_1px_0_rgba(255,255,255,0.35)] transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#8B95FF]/30"
                      style={{ background: ACCENT }}
                    >
                      <Mic size={28} aria-hidden />
                    </button>
                  ) : (
                    <span
                      className="relative grid h-[76px] w-[76px] place-items-center rounded-full text-white shadow-[0_18px_40px_-12px_rgba(124,131,255,0.7),inset_0_1px_0_rgba(255,255,255,0.35)]"
                      style={{ background: ACCENT }}
                    >
                      <Mic size={28} aria-hidden />
                    </span>
                  )}
                </div>

                <p className="max-w-[280px] text-[15px] leading-relaxed text-ink/60 dark:text-white/60">
                  {isFull ? t.intro : t.introHero}
                </p>

                {aiError && (
                  <p role="alert" className="max-w-[300px] text-xs text-red-500">
                    {aiError}
                  </p>
                )}
              </div>
            )}

            {isTranscriptPhase && (
              <>
                <div aria-hidden className="mb-4 flex h-8 items-end gap-[3px]">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="w-[3px] rounded-full bg-gradient-to-t from-[#7C83FF] to-[#A78BFA]"
                      animate={{ height: [5, 10 + ((i * 4) % 24), 5] }}
                      transition={{
                        duration: 0.9,
                        repeat: phase === "typing" || phase === "listening" ? Infinity : 0,
                        delay: i * 0.03,
                      }}
                    />
                  ))}
                </div>

                <div className="flex-1 space-y-3">
                  {isLiveVoice && phase === "listening" && (
                    <p className="text-[15px] italic leading-relaxed text-ink/60 dark:text-white/60">
                      {interim || t.startSpeaking}
                    </p>
                  )}

                  <AnimatePresence mode="popLayout">
                    {visiblePhrases.map((p) => (
                      <motion.p
                        key={p.id}
                        layout
                        layoutId={`${instanceId}-${p.id}`}
                        initial={{ opacity: 0, y: 8, filter: "blur(0px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, filter: "blur(6px)", transition: { duration: 0.25 } }}
                        transition={{ duration: 0.4 }}
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
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-1 flex-col items-center justify-center gap-4 py-6 text-center"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                  <CheckCircle2 size={28} aria-hidden />
                </span>

                <div>
                  <h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-ink dark:text-white">{t.docReady}</h3>
                  <p className="mt-1 max-w-[280px] text-sm leading-relaxed text-ink/55 dark:text-white/55">{t.docReadyBody}</p>
                </div>

                {isLiveVoice && finalNote && (
                  <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                    {patientId && (
                      <button
                        type="button"
                        onClick={saveNoteToPatient}
                        disabled={noteSaveStatus === "saving"}
                        className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:opacity-60 ${
                          noteSaveStatus === "error"
                            ? "bg-red-500 text-white"
                            : noteSaveStatus === "saved"
                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : PRIMARY_BTN
                        }`}
                      >
                        <CheckCircle2 size={15} aria-hidden />
                        {noteSaveStatus === "saving"
                          ? t.saving
                          : noteSaveStatus === "saved"
                          ? t.saved
                          : noteSaveStatus === "error"
                          ? t.saveError
                          : t.saveToPatient}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={downloadPdf}
                      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${SECONDARY_BTN}`}
                    >
                      <Download size={15} aria-hidden />
                      {t.downloadPdf}
                    </button>
                  </div>
                )}

                {isLiveVoice && finalNote && patientId && noteSaveStatus === "saved" && (exerciseEntries.length > 0 || (finalNote.exercises || []).length > 0) && (
                  <div className="flex flex-col items-center gap-2" data-testid="note-to-programme">
                    <button
                      type="button"
                      onClick={sendToProgramme}
                      disabled={programStatus === "sending"}
                      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:opacity-60 ${PRIMARY_BTN}`}
                    >
                      <CalendarCheck size={15} aria-hidden />
                      {programStatus === "sending" ? care.plan.sending : care.plan.sendToProgram}
                    </button>
                    {typeof programStatus === "object" && (
                      <p
                        role={programStatus.kind === "error" || programStatus.kind === "missing" ? "alert" : "status"}
                        className={`max-w-[320px] text-xs leading-relaxed ${programStatus.kind === "created" || programStatus.kind === "updated" ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-400"}`}
                      >
                        {programStatus.kind === "created"
                          ? care.plan.created(programStatus.added)
                          : programStatus.kind === "updated"
                          ? care.plan.updated(programStatus.added, programStatus.changed)
                          : programStatus.kind === "empty"
                          ? care.plan.noExercises
                          : programStatus.kind === "missing"
                          ? care.plan.unavailable
                          : care.plan.sendError}{" "}
                        {(programStatus.kind === "created" || programStatus.kind === "updated") && (
                          <Link href={`/dashboard/patients/${patientId}#care-program`} className="font-semibold underline">
                            {care.library.openProgram}
                          </Link>
                        )}
                      </p>
                    )}
                  </div>
                )}

                {patientId && noteSaveStatus === "idle" && (
                  <p className="max-w-[300px] text-xs leading-relaxed text-ink/55 dark:text-white/45">{t.reviewHint}</p>
                )}
              </motion.div>
            )}
          </div>

          {/* Structured note */}
          <div className={`grid grid-cols-1 gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
            {CATEGORIES.map((cat) => {
              const items = isLiveVoice
                ? aiPhrases.filter((p) => p.cat === cat.key)
                : phrases.filter((p) => movedIds.has(p.id) && p.cat === cat.key);
              const Icon = CATEGORY_ICONS[cat.key] || Stethoscope;

              return (
                <motion.div
                  key={cat.key}
                  data-testid={`note-${cat.key}`}
                  animate={
                    justFilled === cat.key
                      ? { scale: [1, 1.015, 1], boxShadow: "0 0 0 2px rgba(139,149,255,.45)" }
                      : { scale: 1, boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
                  }
                  transition={{ duration: 0.45 }}
                  className="rounded-2xl border border-black/[0.06] bg-white/70 p-4 dark:border-white/[0.06] dark:bg-white/[0.025]"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${ICON_TILE}`}>
                        <Icon size={14} aria-hidden />
                      </span>
                      <span className="truncate text-[13px] font-semibold text-ink/80 dark:text-white/80">
                        {t.categories[cat.key]}
                      </span>
                    </div>
                    {items.length > 0 && <CheckCircle2 size={15} aria-hidden className="shrink-0 text-emerald-500" />}
                  </div>

                  <div className="min-h-[52px] space-y-2.5">
                    {items.length === 0 && (
                      <div aria-hidden className="space-y-2 pt-1">
                        <div className="h-2 w-4/5 rounded-full bg-black/[0.045] dark:bg-white/[0.05]" />
                        <div className="h-2 w-1/2 rounded-full bg-black/[0.035] dark:bg-white/[0.04]" />
                      </div>
                    )}
                    <AnimatePresence>
                      {items.map((p) => (
                        <motion.p
                          key={p.id}
                          layout
                          layoutId={`${instanceId}-${p.id}`}
                          transition={{ duration: 0.28 }}
                          contentEditable={isLiveVoice}
                          suppressContentEditableWarning
                          onBlur={(e) => updatePhraseText(p.id, e.currentTarget.textContent || "")}
                          className={`text-[13px] leading-relaxed text-ink/75 dark:text-white/75 ${phraseFields[p.id] === "_exercisesText" ? "whitespace-pre-line " : ""} ${
                            isLiveVoice ? "-mx-1.5 cursor-text rounded-lg px-1.5 outline-none focus:bg-black/[0.04] focus:ring-2 focus:ring-[#8B95FF]/25 dark:focus:bg-white/[0.06]" : ""
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

          {/* Clinical reasoning — distinct from the "assessment" field: hypotheses,
              differentials and missing information as separate items, always in
              cautious language, never an autonomous diagnosis. Red flags are
              always shown and highlighted. */}
          {finalNote?.clinicalReasoning && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className={BLOCK}>
              <BlockTitle icon={Target}>{t.clinicalReasoning}</BlockTitle>

              <div className="mt-5 space-y-5">
                {Array.isArray(finalNote.clinicalReasoning.hypotheses) && finalNote.clinicalReasoning.hypotheses.length > 0 && (
                  <div>
                    <p className={`${LABEL} mb-2`}>{t.hypotheses}</p>
                    <ol className="space-y-2">
                      {finalNote.clinicalReasoning.hypotheses.map((h: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm leading-relaxed text-ink/75 dark:text-white/75">
                          <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${CHIP}`}>{i + 1}</span>
                          {h}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {Array.isArray(finalNote.clinicalReasoning.differentials) && finalNote.clinicalReasoning.differentials.length > 0 && (
                  <div>
                    <p className={`${LABEL} mb-2`}>{t.differentials}</p>
                    <ul className="space-y-1.5">
                      {finalNote.clinicalReasoning.differentials.map((d: string, i: number) => (
                        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink/75 dark:text-white/75">
                          <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#8B95FF]" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className={`grid grid-cols-1 gap-4 ${compact ? "" : "sm:grid-cols-2"}`}>
                  {[
                    [t.supportingFindings, finalNote.clinicalReasoning.supportingFindings],
                    [t.findingsAgainst, finalNote.clinicalReasoning.findingsAgainst],
                    [t.missingInfo, finalNote.clinicalReasoning.missingInformation],
                    [t.suggestedAssessments, finalNote.clinicalReasoning.suggestedAssessments],
                  ]
                    .filter(([, v]) => v)
                    .map(([label, value]) => (
                      <div key={label as string}>
                        <p className={`${LABEL} mb-1`}>{label}</p>
                        <p className="text-sm leading-relaxed text-ink/75 dark:text-white/75">{value}</p>
                      </div>
                    ))}
                </div>

                {finalNote.clinicalReasoning.redFlagsPrecautions && (
                  <div className="flex gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-4">
                    <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0 text-amber-500" />
                    <div>
                      <p className="mb-1 text-[12px] font-semibold text-amber-700 dark:text-amber-400">{t.redFlagsPrecautions}</p>
                      <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200/90">{finalNote.clinicalReasoning.redFlagsPrecautions}</p>
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-5 border-t border-black/[0.06] pt-3 text-[11px] leading-relaxed text-ink/50 dark:border-white/[0.07] dark:text-white/40">{t.reasoningDisclaimer}</p>
            </motion.div>
          )}

          {isLiveVoice && finalNote && noteTranscript && phase === "done" && (
            <motion.div data-testid="coherence-checks" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className={BLOCK}>
              <BlockTitle icon={ShieldCheck}>{t.coherenceTitle}</BlockTitle>
              <p className="mt-2 text-[11px] leading-relaxed text-ink/50 dark:text-white/40">{t.coherenceIntro}</p>
              {coherenceIssues.length === 0 && excludedExercises.length === 0 && removedFacts.length === 0 && (
                <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">{t.coherenceOk}</p>
              )}
              {coherenceIssues.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {coherenceIssues.map((issue, i) => (
                    <li key={`${issue.kind}-${i}`} data-kind={issue.kind} className="flex gap-2 text-sm leading-relaxed text-amber-900 dark:text-amber-200/90">
                      <AlertTriangle size={14} aria-hidden className={`mt-1 shrink-0 ${issue.severity === "high" ? "text-red-500" : "text-amber-500"}`} />
                      <span>{issueText(issue)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {removedFacts.length > 0 && (
                <div data-testid="removed-facts" className="mt-4 border-t border-black/[0.06] pt-3 dark:border-white/[0.07]">
                  <p className={`${LABEL} mb-2`}>{t.removedTitle}</p>
                  <ul className="space-y-2">
                    {removedFacts.map((r, i) => (
                      <li key={`${r.section}-${i}`} data-testid="removed-fact" className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink/75 dark:text-white/75">
                        <span className="min-w-0 break-words">
                          «{r.text}»
                          <span className="block text-[11px] text-ink/55 dark:text-white/45">
                            {sectionLabel(r.section as SectionName)} · {(t.removedReason as Record<string, string>)[r.kind] ?? r.kind}
                          </span>
                          {r.replacement && <span data-testid="removed-fact-replacement" className="block text-[11px] text-ink/55 dark:text-white/45">{t.replacedWith(r.replacement)}</span>}
                        </span>
                        <button type="button" onClick={() => restoreRemoved(r)} className={`inline-flex min-h-[32px] items-center gap-1 rounded-full px-3 text-xs font-semibold ${SECONDARY_BTN}`}>
                          {t.restore}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {excludedExercises.length > 0 && (
                <div className="mt-4 border-t border-black/[0.06] pt-3 dark:border-white/[0.07]">
                  <p className={`${LABEL} mb-2`}>{t.excludedTitle}</p>
                  <ul className="space-y-2">
                    {excludedExercises.map((e) => (
                      <li key={e.name} data-testid="excluded-exercise" className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink/75 dark:text-white/75">
                        <span className="min-w-0 break-words">
                          {e.name}
                          {e.reason === "history_only" ? (
                            <span className="block text-[11px] text-ink/55 dark:text-white/45">{t.excludedHistory(regionLabel(e.regions))}</span>
                          ) : (e.regions?.length || e.caseRegions?.length) ? (
                            <span className="block text-[11px] text-ink/55 dark:text-white/45">{t.excludedReason(regionLabel(e.regions) || "—", regionLabel(e.caseRegions) || "—")}</span>
                          ) : null}
                        </span>
                        <button type="button" onClick={() => addBackExcluded(e.name)} className={`inline-flex min-h-[32px] items-center gap-1 rounded-full px-3 text-xs font-semibold ${SECONDARY_BTN}`}>
                          <Plus size={12} aria-hidden />
                          {t.addBack}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {!clinicalInsight && kbChecked && isLiveVoice && (
            <p data-testid="no-protocol" className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
              {care.plan.noProtocol(kbChecked)}
            </p>
          )}

          {clinicalInsight && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className={`relative overflow-hidden ${BLOCK}`}>
              <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#8B95FF]/60 to-transparent" />

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <BlockTitle icon={Sparkles}>{t.clinicalInsights}</BlockTitle>
                  <p className="mt-3 text-base font-semibold text-ink dark:text-white">{clinicalInsight.condition_name}</p>
                </div>
                {/* Any level, in its colour (lib/evidence.ts); it used to read every non-"high" level as moderate. */}
                {evidenceLevel && <EvidenceBadge level={evidenceLevel} size="md" className="shrink-0" />}
              </div>

              <div className={`mt-5 grid grid-cols-1 gap-5 ${compact ? "" : "sm:grid-cols-2"}`}>
                {[
                  [Target, t.goals, clinicalInsight.goals, false],
                  [Stethoscope, t.clinicalTests, clinicalInsight.clinical_tests, false],
                  [AlertTriangle, t.redFlags, clinicalInsight.red_flags, true],
                  [Dumbbell, t.typicalExercises, clinicalInsight.typical_exercises, false],
                ].map(([Icon, label, value, warn]: any) => (
                  <div key={label} className="flex gap-3">
                    <Icon size={16} aria-hidden className={`mt-0.5 shrink-0 ${warn ? "text-amber-500" : "text-[#8B95FF]"}`} />
                    <div>
                      <p className={`${LABEL} mb-1`}>{label}</p>
                      <p className="text-sm leading-relaxed text-ink/75 dark:text-white/75">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] pt-4 dark:border-white/[0.07]">
                <p className="text-[11px] text-ink/50 dark:text-white/40">
                  {clinicalInsight.source} ({clinicalInsight.source_date}) · {t.insightDisclaimer} {t.protocolIndicative}
                  {insightRelevance.relevance === "unverified" && insightRelevance.reason && (t.unverifiedReason as Record<string, string>)[insightRelevance.reason] && (
                    <span data-testid="insight-unverified" className="mt-1 block font-semibold text-amber-700 dark:text-amber-300">{(t.unverifiedReason as Record<string, string>)[insightRelevance.reason]}</span>
                  )}
                  {otherSheets.length > 0 && (
                    <span data-testid="other-regions" className="mt-2 block">
                      <span className="font-semibold">{t.otherRegionsTitle}: </span>
                      {otherSheets.map((o, i) => (
                        <span key={o.region}>
                          {i > 0 ? " · " : ""}
                          {regionLabel([o.region])}
                          {o.side && o.side !== "both" ? ` (${o.side === "left" ? t.sideLeft : t.sideRight})` : ""}: {o.match?.condition_name ?? t.otherRegionNoSheet}
                          {o.relevanceReason && (t.otherSheetReason as Record<string, string>)[o.relevanceReason] && <span data-testid="other-region-reason"> — {(t.otherSheetReason as Record<string, string>)[o.relevanceReason]}</span>}
                          {o.relevance === "unverified" && o.relevanceReason && (t.unverifiedReason as Record<string, string>)[o.relevanceReason] && (
                            <span data-testid="other-region-unverified" className="block font-semibold text-amber-700 dark:text-amber-300">{(t.unverifiedReason as Record<string, string>)[o.relevanceReason]}</span>
                          )}
                        </span>
                      ))}
                    </span>
                  )}
                </p>
                {matchedKeyword && (
                  <button type="button" onClick={() => setShowWhy(!showWhy)} aria-expanded={showWhy} className="text-xs font-semibold text-[#7C83FF] hover:underline">
                    {t.whySuggestion}
                  </button>
                )}
              </div>

              {showWhy && matchedKeyword && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-ink/60 dark:text-white/50">
                  {t.whyBecause(matchedKeyword)}
                </motion.p>
              )}

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setShowAskPhygo((prev) => !prev)}
                  aria-expanded={showAskPhygo}
                  className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold ${SECONDARY_BTN}`}
                >
                  <Sparkles size={13} aria-hidden className="text-[#8B95FF]" />
                  {t.askMore}
                </button>
                {showAskPhygo && (
                  <div className="mt-3 space-y-2.5 rounded-2xl border border-black/[0.06] bg-black/[0.02] p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                    <textarea value={askQuestion} onChange={(e) => setAskQuestion(e.target.value)} placeholder={t.askPlaceholder} rows={2} className={FIELD} />
                    <button
                      type="button"
                      onClick={askPhygoAI}
                      disabled={askLoading}
                      className={`inline-flex min-h-[36px] items-center rounded-full px-4 text-xs font-semibold disabled:opacity-50 ${PRIMARY_BTN}`}
                    >
                      {askLoading ? t.thinking : t.ask}
                    </button>
                    {askAnswer && <p className="whitespace-pre-line pt-1 text-sm leading-relaxed text-ink/75 dark:text-white/75">{askAnswer}</p>}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Relevant evidence from the existing Science/PubMed library, only
              published papers matching the primary condition, and only the
              structured summary written for this purpose (why_it_matters). */}
          {(papersLoading || relevantPapers.length > 0 || (papersChecked && isLiveVoice)) && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.025 }} className={BLOCK}>
              <BlockTitle icon={BookOpen}>{t.evidenceTitle}</BlockTitle>

              <div className="mt-4">
                {papersLoading && <p className="text-xs text-ink/55 dark:text-white/40">{t.evidenceSearching}</p>}

                {!papersLoading && relevantPapers.length === 0 && <p className="text-xs text-ink/55 dark:text-white/40">{t.evidenceNone}</p>}

                {!papersLoading && relevantPapers.length > 0 && (
                  <div className="space-y-3">
                    {relevantPapers.map((paper: any) => (
                      <div key={paper.id} className="rounded-2xl border border-black/[0.05] bg-black/[0.02] p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                        <div className="mb-1.5 flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold leading-snug text-ink dark:text-white">{paper.title}</p>
                          {paper.study_type && (
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${CHIP}`}>{paper.study_type}</span>
                          )}
                        </div>
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          {paper.evidence_strength && <EvidenceBadge level={paper.evidence_strength} />}
                          {paper.relevance === "indirect" && <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${CHIP}`}>{t.evidenceIndirect}</span>}
                          {paper.relevance === "unverified" && (
                            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">{t.evidenceUnverified}</span>
                          )}
                        </div>
                        {(paper.relevance === "indirect" || paper.relevance === "unverified") && paper.relevance_reason && (t.evidenceReason as Record<string, string>)[paper.relevance_reason] && (
                          <p data-testid="paper-relevance-reason" className="mb-2 text-[11px] leading-relaxed text-ink/60 dark:text-white/50">{(t.evidenceReason as Record<string, string>)[paper.relevance_reason]}</p>
                        )}
                        <p className="mb-2 text-[11px] text-ink/50 dark:text-white/45">
                          {[
                            paper.authors,
                            paper.journal,
                            paper.publication_date ? String(paper.publication_date).slice(0, 4) : null,
                            paper.pmid ? `PMID ${paper.pmid}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        {paper.why_it_matters && (
                          <p className="mb-2 text-xs leading-relaxed text-ink/65 dark:text-white/65">
                            <span className="font-semibold text-ink/80 dark:text-white/80">{t.whyRelevant}</span>
                            {paper.why_it_matters}
                          </p>
                        )}
                        {paper.original_url && (
                          <a href={paper.original_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7C83FF] hover:underline">
                            {t.viewSource}
                            <ExternalLink size={10} aria-hidden />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="mt-4 border-t border-black/[0.06] pt-3 text-[11px] leading-relaxed text-ink/50 dark:border-white/[0.07] dark:text-white/40">{t.evidenceDisclaimer}</p>
            </motion.div>
          )}

          {exerciseEntries.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className={BLOCK}>
              <div className="flex items-center justify-between gap-3">
                <BlockTitle icon={Dumbbell}>{t.exercises}</BlockTitle>
                <button
                  type="button"
                  onClick={() => setShowAddExercise((prev) => !prev)}
                  aria-expanded={showAddExercise}
                  className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${SECONDARY_BTN}`}
                >
                  {showAddExercise ? <X size={13} aria-hidden /> : <Plus size={13} aria-hidden />}
                  {showAddExercise ? t.cancel : t.addExercise}
                </button>
              </div>

              {showAddExercise && (
                <div className="mt-4 rounded-2xl border border-black/[0.06] bg-black/[0.02] p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="relative">
                    <Search size={14} aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35 dark:text-white/35" />
                    <input
                      type="text"
                      value={exerciseSearchQuery}
                      onChange={(e) => searchExerciseDb(e.target.value)}
                      placeholder={t.searchExercises}
                      aria-label={t.searchExercises}
                      autoFocus
                      className={`${FIELD} pl-9`}
                    />
                  </div>
                  {exerciseSearching && <p className="mt-2 text-xs text-ink/55 dark:text-white/40">{t.searching}</p>}
                  {!exerciseSearching && exerciseSearchQuery && exerciseSearchResults.length === 0 && (
                    <p className="mt-2 text-xs text-ink/55 dark:text-white/40">{t.noExercises}</p>
                  )}
                  {exerciseSearchResults.length > 0 && (
                    <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                      {exerciseSearchResults.map((result: any) => (
                        <button
                          type="button"
                          key={result.internal_id}
                          onClick={() => addExerciseToList(result)}
                          className="flex w-full items-center gap-3 rounded-xl border border-black/[0.05] bg-white p-2.5 text-left transition-colors hover:border-[#8B95FF]/40 dark:border-white/[0.06] dark:bg-white/[0.04]"
                        >
                          {result.media?.image_url ? (
                            <img src={result.media.image_url} alt="" className="h-10 w-10 shrink-0 rounded-lg bg-black/5 object-cover dark:bg-white/10" />
                          ) : (
                            <div className="h-10 w-10 shrink-0 rounded-lg bg-black/5 dark:bg-white/10" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-ink dark:text-white">{result.name}</p>
                            {result.primary_muscle && <p className="text-[10px] text-ink/55 dark:text-white/40">{result.primary_muscle}</p>}
                          </div>
                          <Plus size={14} aria-hidden className="shrink-0 text-[#7C83FF]" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className={`mt-4 grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
                {exerciseEntries.map((ex: any, i: number) => {
                  const key = ex.internal_id || String(i);
                  const isOpen = expandedExercise === key;
                  const isEditing = editingExercise === key;
                  const hasDetails = ex.description || (Array.isArray(ex.instructions) && ex.instructions.length > 0) || ex.media?.video_url;
                  return (
                    <div
                      key={key}
                      data-testid="note-exercise"
                      className={`flex flex-col gap-3 rounded-2xl border border-black/[0.05] bg-black/[0.02] p-4 dark:border-white/[0.06] dark:bg-white/[0.03] ${isOpen || isEditing ? "sm:col-span-2" : ""}`}
                    >
                      <div className="flex gap-3">
                        <div
                          onClick={() => !isEditing && hasDetails && setExpandedExercise(isOpen ? null : key)}
                          className={`flex min-w-0 flex-1 gap-3 ${!isEditing && hasDetails ? "cursor-pointer" : ""}`}
                        >
                          {ex.media?.image_url ? (
                            <img src={ex.media.image_url} alt={ex.name} className="h-16 w-16 shrink-0 rounded-xl bg-black/5 object-cover dark:bg-white/10" />
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-black/5 px-1 text-center text-[10px] text-ink/35 dark:bg-white/10 dark:text-white/35">
                              {t.noImage}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink dark:text-white">{ex.name}</p>
                            {/* Matched to a database exercise with another name: say what the note wrote. */}
                            {ex.draft && ex.draft !== ex.name && <p className="mt-0.5 text-[11px] text-ink/50 dark:text-white/40">{t.fromNote(ex.draft)}</p>}
                            {/* A library match that could not be confirmed: the note's exercise stays; a suggestion can be taken on purpose. */}
                            {ex.match_status === "unverified" && (
                              <div data-testid="match-unverified" className="mt-0.5 whitespace-normal text-[11px] text-amber-700 dark:text-amber-300">
                                {t.matchUnverified}
                                {ex.suggested_match?.name && (
                                  <button type="button" onClick={(e) => { e.stopPropagation(); useSuggestedMatch(key); }} className="ml-1 font-semibold underline">
                                    {t.useSuggestion(ex.suggested_match.name)}
                                  </button>
                                )}
                              </div>
                            )}
                            {/* Region against today's case: a general activity is said as such; one not recognised is not verified, the clinician decides. */}
                            {caseView && isLiveVoice && (() => {
                              const fit = exerciseFit(ex, caseView.regions);
                              if (fit === "general") return <p data-testid="exercise-general" className="mt-0.5 text-[11px] text-ink/55 dark:text-white/45">{t.generalActivity}</p>;
                              if (fit !== "unknown") return null;
                              return (
                                <p data-testid="exercise-unverified" className="mt-0.5 whitespace-normal text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                  {t.unverifiedReason[caseView.regions.length ? "exercise_region_unknown" : "case_region_unknown"]}
                                </p>
                              );
                            })()}
                            {/* Whose exercise and dose this is: what the clinician said and did, or the AI's suggestion. */}
                            {noteTranscript && (() => {
                              const origin = exerciseOrigin(ex.draft ?? ex.name ?? "", noteTranscript).origin;
                              const dose = dosingOrigin(ex.dosing, noteTranscript);
                              return (
                                <p data-testid="exercise-origin" data-origin={origin} className={`mt-0.5 whitespace-normal text-[11px] ${origin === "suggested" ? "font-medium text-amber-700 dark:text-amber-300" : "text-ink/55 dark:text-white/45"}`}>
                                  {t.exerciseOrigin[origin]}
                                  {dose === "suggested" && <span data-testid="dosage-suggested" className="block">{t.dosageSuggested}</span>}
                                </p>
                              );
                            })()}
                            {ex.primary_muscle && <p className="mt-0.5 text-[11px] text-ink/55 dark:text-white/45">{ex.primary_muscle}</p>}
                            {!isEditing && (ex.dosing?.sets || ex.dosing?.reps || ex.dosing?.duration_seconds) && (
                              <p className="mt-1 text-[11px] text-ink/65 dark:text-white/55">
                                {[
                                  ex.dosing?.sets ? t.sets(ex.dosing.sets) : null,
                                  ex.dosing?.reps ? t.reps(ex.dosing.reps) : null,
                                  ex.dosing?.duration_seconds ? `${ex.dosing.duration_seconds}s` : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            )}
                            <div className="mt-1.5 flex items-center gap-2">
                              {ex.provider === "custom" && (
                                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">{t.customExercise}</span>
                              )}
                              {ex.provider === "exercises" && (
                                <span data-testid="note-exercise-library" className="inline-flex items-center gap-1 rounded-full bg-[#7C83FF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#5B63E6] dark:text-[#A5B4FF]">
                                  <PlayCircle size={10} aria-hidden />
                                  {care.plan.withVideo}
                                </span>
                              )}
                              {!isEditing && hasDetails && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#7C83FF]">
                                  {isOpen ? t.hideDetails : t.howTo}
                                  <ChevronDown size={12} aria-hidden className={isOpen ? "rotate-180" : ""} />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-start gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingExercise(isEditing ? null : key)}
                            aria-label={t.editExercise}
                            className="rounded-lg p-1.5 text-ink/55 transition-colors hover:bg-black/5 hover:text-[#7C83FF] dark:text-white/45 dark:hover:bg-white/10"
                          >
                            <Pencil size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeExercise(key)}
                            aria-label={t.removeExercise}
                            className="rounded-lg p-1.5 text-ink/55 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-white/45 dark:hover:bg-red-500/10"
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </div>
                      </div>

                      {isEditing && (
                        <div className="grid grid-cols-2 gap-2 border-t border-black/[0.06] pt-3 dark:border-white/[0.07]">
                          {[
                            ["sets", t.setsLabel],
                            ["reps", t.repsLabel],
                            ["duration_seconds", t.durationLabel],
                            ["frequency_per_week", t.freqLabel],
                          ].map(([field, label]) => (
                            <label key={field} className="block">
                              <span className="text-[11px] text-ink/55 dark:text-white/45">{label}</span>
                              <input
                                type="number"
                                value={ex.dosing?.[field] ?? ""}
                                onChange={(e) => updateExerciseDosing(key, field, e.target.value)}
                                className={`${FIELD} mt-1 py-1.5 text-xs`}
                              />
                            </label>
                          ))}
                          <label className="col-span-2 block">
                            <span className="text-[11px] text-ink/55 dark:text-white/45">{t.notesLabel}</span>
                            <textarea
                              value={ex.dosing?.notes ?? ""}
                              onChange={(e) => updateExerciseDosing(key, "notes", e.target.value)}
                              rows={2}
                              className={`${FIELD} mt-1 py-1.5 text-xs`}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setEditingExercise(null)}
                            className={`col-span-2 mt-1 inline-flex min-h-[34px] items-center justify-self-start rounded-full px-4 text-xs font-semibold ${PRIMARY_BTN}`}
                          >
                            {t.done}
                          </button>
                        </div>
                      )}

                      {!isEditing && isOpen && hasDetails && (
                        <div className="border-t border-black/[0.06] pt-3 dark:border-white/[0.07]">
                          {ex.media?.video_url && (
                            <video src={ex.media.video_url} poster={ex.media.image_url ?? undefined} controls playsInline muted loop preload="metadata" className="mb-3 max-h-[320px] w-full rounded-xl bg-black object-contain" />
                          )}
                          {ex.description && <p className="text-xs leading-relaxed text-ink/65 dark:text-white/60">{ex.description}</p>}
                          {Array.isArray(ex.instructions) && ex.instructions.length > 0 && (
                            <ol className="mt-2 list-inside list-decimal space-y-1 text-xs leading-relaxed text-ink/65 dark:text-white/60">
                              {ex.instructions.map((step: string, j: number) => (
                                <li key={j}>{step}</li>
                              ))}
                            </ol>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {rehabPhases.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className={BLOCK}>
              <BlockTitle icon={FileText}>{t.rehabProtocol}</BlockTitle>

              <div className={`mt-4 grid gap-3 ${compact ? "" : "sm:grid-cols-3"}`}>
                {rehabPhases.map((rp) => (
                  <div
                    key={rp.id}
                    className={`rounded-2xl border border-black/[0.05] bg-black/[0.02] p-4 dark:border-white/[0.06] dark:bg-white/[0.03] ${
                      !compact && (rp.phase_exercises?.length || 0) > 300 ? "sm:col-span-3" : ""
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: ACCENT }}>
                        {rp.phase_number}
                      </span>
                      <p className="text-sm font-semibold text-ink dark:text-white">{rp.phase_name}</p>
                    </div>
                    <p className="mb-3 text-[11px] text-ink/55 dark:text-white/45">{rp.typical_duration}</p>
                    <p className="mb-2 text-xs leading-relaxed text-ink/65 dark:text-white/60">
                      <span className="font-semibold text-ink/75 dark:text-white/75">{t.phaseGoals}</span>
                      {rp.phase_goals}
                    </p>
                    <p className="mb-2 text-xs leading-relaxed text-ink/65 dark:text-white/60">
                      <span className="font-semibold text-ink/75 dark:text-white/75">{t.phaseExercises}</span>
                      <span className="whitespace-pre-line">{formatPhaseText(rp.phase_exercises)}</span>
                    </p>
                    <p className="text-[11px] leading-relaxed text-ink/55 dark:text-white/45">
                      <span className="font-semibold">{t.progressWhen}</span>
                      {rp.criteria_to_progress}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {isLiveVoice && finalNote && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className={BLOCK} data-testid="patient-booklet">
              <BlockTitle icon={BookOpen}>{care.booklet.panelTitle}</BlockTitle>
              <p className="mt-2 text-xs leading-relaxed text-ink/55 dark:text-white/45">{care.booklet.panelHint}</p>
              <fieldset className="mt-4">
                <legend className={LABEL}>{care.booklet.include}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {([
                    ["summary", care.booklet.summary, !!finalNote.summaryForPatient],
                    ["path", care.booklet.path, rehabPhases.length > 0],
                    ["exercises", care.booklet.exercises, exerciseEntries.length > 0 || (finalNote.exercises || []).length > 0],
                    ["evidence", care.booklet.evidence, relevantPapers.length > 0 || !!clinicalInsight?.source],
                  ] as [keyof BookletSections, string, boolean][]).filter(([, , available]) => available).map(([key, label]) => (
                    <label key={key} className={`inline-flex min-h-[36px] cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-semibold transition ${bookletSections[key] ? "border-[#7C83FF]/50 bg-[#7C83FF]/10 text-[#5B63E6] dark:text-[#A5B4FF]" : "border-black/10 text-ink/55 dark:border-white/10 dark:text-white/50"}`}>
                      <input type="checkbox" className="h-3.5 w-3.5 accent-[#7C83FF]" checked={bookletSections[key]} onChange={(e) => setBookletSections({ ...bookletSections, [key]: e.target.checked })} />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              {rehabPhases.length > 0 && bookletSections.path && (
                <label className="mt-4 block max-w-sm">
                  <span className={LABEL}>{care.booklet.currentPhase}</span>
                  <select value={currentPhase ?? ""} onChange={(e) => setCurrentPhase(e.target.value === "" ? null : Number(e.target.value))} className={`${FIELD} mt-1.5`}>
                    <option value="">{care.booklet.notSaid}</option>
                    {bookletPhases(rehabPhases).map((p) => (
                      <option key={p.number} value={p.number}>{`${p.number}. ${p.name}`}</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button type="button" onClick={downloadBooklet} disabled={bookletStatus === "working"} className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:opacity-60 ${PRIMARY_BTN}`}>
                  <Download size={15} aria-hidden />
                  {bookletStatus === "working" ? care.booklet.making : care.booklet.button}
                </button>
                {bookletStatus === "error" && <p role="alert" className="text-xs text-red-600 dark:text-red-400">{care.booklet.error}</p>}
              </div>
            </motion.div>
          )}
        </div>

        {/* Controls */}
        {!isFull && (
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-medium text-ink/45 dark:text-white/40">{t.examples}</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => runExample(ex.id)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                  activeLabel === ex.label && !isLiveVoice ? PRIMARY_BTN : SECONDARY_BTN
                }`}
              >
                {ex.label}
              </button>
            ))}
          </div>
        )}

        {isFull && (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {voiceSupported ? (
                <button
                  type="button"
                  onClick={phase === "listening" ? stopVoice : startVoice}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${PRIMARY_BTN}`}
                >
                  {phase === "listening" ? <Square size={12} fill="currentColor" aria-hidden /> : <Mic size={15} aria-hidden />}
                  {phase === "listening" ? t.stopRecording : t.startRecording}
                </button>
              ) : (
                <span className="flex items-center gap-2 text-xs text-ink/50 dark:text-white/40">
                  <Sparkles size={13} aria-hidden />
                  {t.voiceChrome}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowTextInput((prev) => !prev)}
                aria-expanded={showTextInput}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${SECONDARY_BTN}`}
              >
                <PenLine size={15} aria-hidden />
                {t.writeInstead}
              </button>
            </div>

            {showTextInput && (
              <div className="mt-4 space-y-3 rounded-2xl border border-black/[0.06] bg-black/[0.02] p-4 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={t.writePlaceholder}
                  aria-label={t.writePlaceholder}
                  className={FIELD}
                  rows={4}
                />
                <button
                  type="button"
                  onClick={submitTextInput}
                  disabled={!textInput.trim()}
                  className={`inline-flex min-h-[40px] items-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:opacity-50 ${PRIMARY_BTN}`}
                >
                  <Sparkles size={14} aria-hidden />
                  {t.generateNote}
                </button>
              </div>
            )}

            <div className="mt-6 space-y-3 border-t border-black/[0.06] pt-5 dark:border-white/[0.07]">
              <input
                type="text"
                value={clinicalContext}
                onChange={(e) => setClinicalContext(e.target.value)}
                placeholder={t.contextPlaceholder}
                aria-label={t.contextPlaceholder}
                className={`${FIELD} text-xs`}
              />
              <div className="flex flex-wrap items-center gap-3">
                <label
                  className={`inline-flex min-h-[36px] items-center gap-2 rounded-full px-4 text-xs font-semibold ${SECONDARY_BTN} ${
                    !finalNote ? "cursor-not-allowed opacity-45" : "cursor-pointer"
                  }`}
                  onClick={(e) => {
                    if (!finalNote) e.preventDefault();
                  }}
                >
                  <ImagePlus size={14} aria-hidden />
                  {t.uploadScan}
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={!finalNote} className="hidden" />
                </label>
                <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-ink/50 dark:text-white/40">
                  {finalNote ? t.multiFileTip : t.uploadAfterNote}
                </p>
              </div>

              {uploadedFileNames.length > 0 && <p className="text-[11px] text-ink/60 dark:text-white/50">{t.files(uploadedFileNames)}</p>}

              {scanAnalyzing && <p className="text-[11px] italic text-ink/60 dark:text-white/50">{t.analyzingDoc}</p>}

              {scanSummary && !scanAnalyzing && (
                <div className="rounded-2xl border border-black/[0.06] bg-black/[0.02] px-4 py-3 text-[13px] leading-relaxed dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <span className={LABEL}>{t.docSummary}</span>
                  <p className="mt-1 whitespace-pre-line text-ink/75 dark:text-white/75">{scanSummary}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
