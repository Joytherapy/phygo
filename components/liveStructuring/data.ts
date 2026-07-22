export type Category = "findings" | "assessment" | "plan" | "followup";

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: "findings", label: "Findings" },
  { key: "assessment", label: "Assessment" },
  { key: "plan", label: "Plan" },
  { key: "followup", label: "Follow-up" },
];

export type Phrase = {
  id: string;
  text: string;
  cat: Category;
};

export type Example = {
  id: string;
  label: string;
  phrases: Omit<Phrase, "id">[];
};

export const EXAMPLES: Example[] = [
  {
    id: "back",
    label: "Lower back pain",
    phrases: [
      { text: "Patient's lower back pain has really improved this week.", cat: "findings" },
      { text: "Range of motion is noticeably better than last visit.", cat: "assessment" },
      { text: "Continue the stretching routine three times a day.", cat: "plan" },
      { text: "Check in again next week.", cat: "followup" },
    ],
  },
  {
    id: "knee",
    label: "Post-op knee",
    phrases: [
      { text: "The knee is healing well after surgery, swelling has gone down.", cat: "findings" },
      { text: "Still some stiffness in the morning, otherwise stable progress.", cat: "assessment" },
      { text: "Increase mobility exercises starting this week.", cat: "plan" },
      { text: "Schedule a follow-up in two weeks.", cat: "followup" },
    ],
  },
  {
    id: "headache",
    label: "Tension headache",
    phrases: [
      { text: "Headaches are less frequent than the previous session.", cat: "findings" },
      { text: "Patient reports stress at work as the main trigger.", cat: "assessment" },
      { text: "Recommend neck stretches daily and posture breaks.", cat: "plan" },
      { text: "Follow-up call in ten days.", cat: "followup" },
    ],
  },
];

/**
 * Lightweight keyword categorizer for free-form voice input.
 * Not real NLP — a marketing-page heuristic so the live-voice
 * demo never leaves a sentence uncategorized.
 */
export function categorize(text: string): Category {
  const t = text.toLowerCase();
  if (/(recommend|continue|plan is|prescrib|exercise|stretch|advise|suggest)/.test(t)) return "plan";
  if (/(follow.?up|next week|next visit|check in|schedule|in \d+ (day|week)|see (him|her|them) again)/.test(t))
    return "followup";
  if (/(improv|better|range of motion|progress|responding well|healing|stable)/.test(t)) return "assessment";
  return "findings";
}

export function chunkTranscript(raw: string): string[] {
  const bySentence = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (bySentence.length >= 2) return bySentence;

  // Fallback: no punctuation from the recognizer — chunk every ~7 words.
  const words = raw.trim().split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += 7) {
    chunks.push(words.slice(i, i + 7).join(" "));
  }
  return chunks.filter(Boolean);
}
