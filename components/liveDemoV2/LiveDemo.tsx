"use client";

import { useEffect, useRef, useState } from "react";

type Speaker = "therapist" | "patient";

interface Message {
  id: number;
  speaker: Speaker;
  name: string;
  initials: string;
  time: string;
  text: string;
}

const TRANSCRIPT: Message[] = [
  { id: 1, speaker: "therapist", name: "Dr. Elena Cross", initials: "EC", time: "9:02 AM", text: "Morning — what's going on today?" },
  { id: 2, speaker: "patient", name: "Marco T.", initials: "MT", time: "9:02 AM", text: "Shoulder pain, about three weeks now." },
  { id: 3, speaker: "therapist", name: "Dr. Elena Cross", initials: "EC", time: "9:03 AM", text: "What makes it worse?" },
  { id: 4, speaker: "patient", name: "Marco T.", initials: "MT", time: "9:03 AM", text: "Reaching overhead — like grabbing a shelf." },
  { id: 5, speaker: "therapist", name: "Dr. Elena Cross", initials: "EC", time: "9:04 AM", text: "Affecting daily things?" },
  { id: 6, speaker: "patient", name: "Marco T.", initials: "MT", time: "9:04 AM", text: "Some mornings I can't lift it to get dressed." },
  { id: 7, speaker: "therapist", name: "Dr. Elena Cross", initials: "EC", time: "9:05 AM", text: "Let's check your range and strength." },
  { id: 8, speaker: "patient", name: "Marco T.", initials: "MT", time: "9:05 AM", text: "It feels weak lifting out to the side." },
];

const REVEAL_INTERVAL_MS = 3200;
const PLAN_FINALIZE_DELAY_MS = 1800;
const PROCESSING_BURST_MS = 900;
const TYPE_SPEED_MS = 16;
const VISIBLE_WINDOW = 5;

const FINDINGS = [
  { label: "Shoulder pain", threshold: 2 },
  { label: "Overhead movement", threshold: 4 },
  { label: "3 weeks duration", threshold: 2 },
  { label: "Functional limitation", threshold: 6 },
];

function Icon({ path, className = "h-4 w-4" }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  findings: "M9 4h6l1 3h3v13H5V7h3l1-3Z M9 12h6 M9 16h4",
  soap: "M7 6h10v15H7V6Z M9.5 11l2 2 3.5-3.5",
  assessment: "M11 4a7 7 0 1 0 4.9 12.1L20 20 M11 4a7 7 0 0 1 4.9 12.1",
  treatment: "M4 7h16 M4 7v13h16V7 M8 4v4 M16 4v4 M8 14h3 M8 17h6",
  status: "M12 8v4l2.5 2.5 M12 3a9 9 0 1 0 9 9",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z M6 11a6 6 0 0 0 12 0 M12 17v4 M9 21h6",
};

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function assessmentText(visibleCount: number) {
  if (visibleCount < 3) return null;
  return "Possible rotator cuff tendinopathy. Collecting objective findings…";
}

export default function LiveDemo() {
  const [visibleCount, setVisibleCount] = useState(1);
  const [elapsed, setElapsed] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [planDone, setPlanDone] = useState(false);
  const [typed, setTyped] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const total = TRANSCRIPT.length;
  const isComplete = visibleCount >= total;

  useEffect(() => {
    if (isComplete) return;
    const id = setInterval(() => setVisibleCount((c) => Math.min(c + 1, total)), REVEAL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isComplete, total]);

  useEffect(() => {
    if (isComplete) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isComplete]);

  useEffect(() => {
    if (visibleCount <= 1) return;
    setProcessing(true);
    const t = setTimeout(() => setProcessing(false), PROCESSING_BURST_MS);
    return () => clearTimeout(t);
  }, [visibleCount]);

  useEffect(() => {
    if (!isComplete) return;
    const t = setTimeout(() => setPlanDone(true), PLAN_FINALIZE_DELAY_MS);
    return () => clearTimeout(t);
  }, [isComplete]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visibleCount]);

  const assessment = assessmentText(visibleCount);

  useEffect(() => {
    if (!assessment) {
      setTyped("");
      return;
    }
    setTyped("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(assessment.slice(0, i));
      if (i >= assessment.length) clearInterval(id);
    }, TYPE_SPEED_MS);
    return () => clearInterval(id);
  }, [assessment]);

  const windowStart = Math.max(0, visibleCount - VISIBLE_WINDOW);
  const visibleMessages = TRANSCRIPT.slice(windowStart, visibleCount);
  const confidence = Math.min(98, 82 + visibleCount * 2);

  const soapItems = [
    { key: "S", label: "Subjective", done: visibleCount >= 2 },
    { key: "O", label: "Objective", done: visibleCount >= 6 },
    { key: "A", label: "Assessment", done: visibleCount >= 7 },
    { key: "P", label: "Plan", done: planDone },
  ];
  let activeAssigned = false;
  const soapRows = soapItems.map((item) => {
    let status: "done" | "active" | "pending" = "pending";
    if (item.done) status = "done";
    else if (!activeAssigned) {
      status = "active";
      activeAssigned = true;
    }
    return { ...item, status };
  });
  const soapDoneCount = soapItems.filter((i) => i.done).length;
  const showTreatment = visibleCount >= 6;

  return (
    <>
      <section className="w-full bg-white py-16 sm:py-24">
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes softPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
          @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
          @keyframes waveBar { 0%, 100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }
          @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
          @keyframes dotFade { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
          @keyframes pillIn { from { opacity: 0; transform: scale(0.92) translateY(3px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          @keyframes ringPulse { 0% { transform: scale(1); opacity: 0.55; } 100% { transform: scale(2.4); opacity: 0; } }
        `}</style>

        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_28px_64px_-28px_rgba(0,0,0,0.10)] transition-shadow duration-500">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
                  Ph
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-medium text-neutral-900">Live Consultation</p>
                  <p className="text-xs text-neutral-400">Shoulder assessment</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {!isComplete && (
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-emerald-600">
                    LIVE
                  </span>
                )}
                <div className="flex items-center gap-2 text-xs font-medium tabular-nums text-neutral-400">
                  <span className="relative flex h-1.5 w-1.5">
                    {!isComplete && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-70" />}
                    <span
                      className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isComplete ? "bg-emerald-500" : "bg-blue-500"}`}
                      style={isComplete ? { animation: "softPulse 2.2s ease-in-out infinite" } : undefined}
                    />
                  </span>
                  {formatElapsed(elapsed)}
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col">
              <div className="h-[380px] overflow-y-auto px-5 py-6 sm:h-[440px] sm:px-7">
                <div className="flex flex-col gap-5">
                  {visibleMessages.map((m) => (
                    <ChatBubble key={m.id} message={m} />
                  ))}

                  <div className="flex items-center gap-1 pl-10 text-xs text-neutral-400">
                    Listening
                    <span className="flex items-end gap-0.5 pb-0.5">
                      <AnimDot delay="0ms" />
                      <AnimDot delay="200ms" />
                      <AnimDot delay="400ms" />
                    </span>
                  </div>

                  <div ref={chatEndRef} />
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-neutral-100 px-5 py-3.5 sm:px-7">
                {isComplete ? (
                  <Icon path={ICONS.mic} className="h-3.5 w-3.5 text-neutral-300" />
                ) : (
                  <span className="flex h-3.5 items-end gap-0.5">
                    <WaveBar delay="0ms" />
                    <WaveBar delay="120ms" />
                    <WaveBar delay="240ms" />
                  </span>
                )}
                <p className="min-w-0 flex-1 truncate text-xs text-neutral-400">
                  Phygo writes the documentation as you talk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="ai-analysis" className="w-full bg-white pb-16 sm:pb-24">
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03),0_28px_64px_-28px_rgba(0,0,0,0.10)] transition-shadow duration-500">
            <div className="px-5 py-8 sm:px-9">
              <div className="mb-12 flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span
                    className="absolute inline-flex h-full w-full rounded-full bg-blue-500"
                    style={{ animation: "softPulse 2.4s ease-in-out infinite" }}
                  />
                </span>
                <p className="text-sm font-semibold text-neutral-900">Live AI Analysis</p>
              </div>

              <div className="space-y-8">
                <div className="pb-2">
                  <SectionLabel icon={ICONS.findings} title="Findings" emphasized />
                  <div className="mt-1 flex flex-wrap gap-2.5">
                    {FINDINGS.map((f) => (
                      <FindingPill key={f.label} label={f.label} visible={visibleCount >= f.threshold} />
                    ))}
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-8">
                  <SectionLabel icon={ICONS.soap} title="SOAP Progress" />
                  <div className="mb-5 h-0.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="relative h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out"
                      style={{ width: `${(soapDoneCount / soapItems.length) * 100}%` }}
                    >
                      <span
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                        style={{ animation: "shimmer 1.8s ease-in-out infinite" }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {soapRows.map((row) => (
                      <div
                        key={row.key}
                        className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors duration-300 hover:bg-neutral-50"
                      >
                        <span
                          className={`text-sm ${
                            row.status === "done" ? "text-emerald-500" : row.status === "active" ? "text-blue-500" : "text-neutral-300"
                          }`}
                          style={row.status === "active" ? { animation: "softPulse 1.4s ease-in-out infinite" } : undefined}
                        >
                          {row.status === "done" ? "✓" : row.status === "active" ? "●" : "○"}
                        </span>
                        <span className={`text-sm ${row.status === "pending" ? "text-neutral-300" : "text-neutral-700"}`}>
                          {row.label}
                        </span>
                        {row.status === "active" && (
                          <span className="text-xs italic text-neutral-400" style={{ animation: "fadeUp 0.4s ease-out both" }}>
                            Generating…
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-neutral-100 pt-8">
                  <SectionLabel icon={ICONS.assessment} title="AI Assessment" />
                  {assessment ? (
                    <p className="text-xs italic leading-relaxed text-neutral-500">
                      {typed}
                      {typed.length < assessment.length && (
                        <span
                          className="ml-0.5 inline-block h-3 w-[2px] -mb-0.5 bg-neutral-400"
                          style={{ animation: "blink 0.9s step-end infinite" }}
                        />
                      )}
                    </p>
                  ) : (
                    <p className="text-xs italic text-neutral-300">Listening…</p>
                  )}
                </div>

                {showTreatment && (
                  <div className="border-t border-neutral-100 pt-8">
                    <SectionLabel icon={ICONS.treatment} title="Suggested Treatment" />
                    <ul className="space-y-2 text-sm text-neutral-600">
                      {["Rotator cuff strengthening", "Avoid overhead loading", "Reassess in 2 weeks"].map((t, i) => (
                        <li
                          key={t}
                          className="flex gap-2.5 transition-colors duration-300 hover:text-neutral-900"
                          style={{ animation: "fadeUp 0.5s ease-out both", animationDelay: `${i * 120}ms` }}
                        >
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-neutral-300" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="border-t border-neutral-100 pt-8">
                  <SectionLabel icon={ICONS.status} title="Live Status" />
                  <div className="rounded-2xl bg-neutral-50 p-4">
                    <div className="flex flex-col gap-2.5">
                      <MiniStatus label="Recording" active={!isComplete} />
                      <MiniStatus label="Listening" active={!isComplete && !processing} />
                      <MiniStatus label="AI Processing" active={processing || (isComplete && !planDone)} />
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-neutral-200/70 pt-3">
                      <span className="text-xs text-neutral-500">Transcript Confidence</span>
                      <span className="text-xs font-semibold tabular-nums text-neutral-800">{confidence}%</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200/70">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionLabel({ icon, title, emphasized = false }: { icon: string; title: string; emphasized?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${emphasized ? "mb-5" : "mb-4"}`}>
      <Icon path={icon} className={emphasized ? "h-3.5 w-3.5 text-neutral-500" : "h-3 w-3 text-neutral-400"} />
      <h3 className={emphasized ? "text-base font-semibold text-neutral-900" : "text-sm font-medium text-neutral-900"}>{title}</h3>
    </div>
  );
}

function FindingPill({ label, visible }: { label: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-800 shadow-sm transition-colors duration-300 hover:border-neutral-400 hover:bg-neutral-50"
      style={{ animation: "pillIn 0.5s ease-out both" }}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {label}
    </span>
  );
}

function MiniStatus({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        {active && (
          <span
            className="absolute inline-flex h-full w-full rounded-full bg-emerald-400"
            style={{ animation: "ringPulse 2s ease-out infinite" }}
          />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${active ? "bg-emerald-500" : "bg-neutral-300"}`}
          style={active ? { animation: "softPulse 1.8s ease-in-out infinite" } : undefined}
        />
      </span>
      <span className={`text-xs font-medium ${active ? "text-neutral-700" : "text-neutral-400"}`}>{label}</span>
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isTherapist = message.speaker === "therapist";
  return (
    <div className={`flex min-w-0 items-start gap-3 ${isTherapist ? "" : "flex-row-reverse text-right"}`} style={{ animation: "fadeUp 0.4s ease-out both" }}>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
          isTherapist ? "bg-blue-600 text-white" : "bg-neutral-900 text-white"
        }`}
      >
        {message.initials}
      </span>
      <div className={`min-w-0 max-w-[85%] ${isTherapist ? "" : "flex flex-col items-end"}`}>
        <div className={`flex items-baseline gap-2 ${isTherapist ? "" : "flex-row-reverse"}`}>
          <span className="text-xs font-medium text-neutral-900">{message.name}</span>
          <span className="text-[11px] text-neutral-400">{message.time}</span>
        </div>
        <p
          className={`mt-1 inline-block break-words rounded-[18px] px-3 py-2 text-sm leading-snug ${
            isTherapist ? "rounded-tl-sm bg-neutral-100 text-neutral-800" : "rounded-tr-sm bg-blue-600 text-white"
          }`}
        >
          {message.text}
        </p>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return <span className="h-1 w-1 animate-bounce rounded-full bg-neutral-400" style={{ animationDelay: delay }} />;
}

function AnimDot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1 w-1 rounded-full bg-neutral-400"
      style={{ animation: "dotFade 1.2s ease-in-out infinite", animationDelay: delay }}
    />
  );
}

function WaveBar({ delay }: { delay: string }) {
  return (
    <span
      className="h-full w-[2px] rounded-full bg-blue-400"
      style={{ animation: "waveBar 0.9s ease-in-out infinite", animationDelay: delay }}
    />
  );
}