// Shape of the localized legal/informational pages (/privacy, /terms,
// /contact and their /it, /es, /fr equivalents). The English text is the
// original wording of these pages; the other languages are faithful
// translations of it and must not add or remove legal meaning.
//
// Inline conventions inside a block: "**text**" renders bold, and the
// address hello@phygo.app is turned into a mailto link.

/** A list item: plain text, or text with a nested list and/or a closing paragraph. */
export type LegalListItem = string | { text: string; list?: string[]; after?: string };

export type LegalBlock = string | { list: LegalListItem[] };

/** id: stable anchor (for example "professional-verification"); default "s<n>". */
export type LegalSection = { title: string; blocks: LegalBlock[]; id?: string };

export type LegalDoc = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  /** Draft status line, kept exactly as in the original (placeholders included). */
  updated: string;
  sections: LegalSection[];
};

export type ContactDoc = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  text: string;
  emailLabel: string;
};

export interface LegalDict {
  privacy: LegalDoc;
  terms: LegalDoc;
  contact: ContactDoc;
  contents: string;
}
