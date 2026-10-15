// PubMed "pubdate" values are free text: "2026 Mar 15", "2026 Mar", "2026",
// "2026 Spring", "2025 Dec-2026 Jan". Returns a YYYY-MM-DD date (missing month
// or day = 01, a season = its first month), or null when there is no year, so
// one unusual value never stops the import of the other papers.
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const SEASONS: Record<string, number> = { winter: 1, spring: 3, summer: 6, fall: 9, autumn: 9 };

export function parsePubDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const m = /^\s*(\d{4})(?:\s+([A-Za-z]+))?(?:\s+(\d{1,2}))?/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const word = m[2]?.toLowerCase() ?? '';
  const monthIndex = MONTHS.indexOf(word.slice(0, 3));
  const month = monthIndex >= 0 ? monthIndex + 1 : SEASONS[word] ?? 1;
  const day = monthIndex >= 0 && m[3] ? Number(m[3]) : 1;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime()) || date.getUTCMonth() !== month - 1) return `${year}-${String(month).padStart(2, '0')}-01`;
  return date.toISOString().slice(0, 10);
}
