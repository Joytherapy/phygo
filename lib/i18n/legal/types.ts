// Shape of the localized legal/informational pages (/privacy, /terms,
// /contact and their /it, /es, /fr equivalents). The English text is the
// original wording of these pages; the other languages are faithful
// translations of it and must not add or remove legal meaning.
//
// Inline conventions inside a block: "**text**" renders bold, and the
// address hello@phygo.app is turned into a mailto link.

export type LegalBlock = string | { list: string[] };

export type LegalSection = { title: string; blocks: LegalBlock[] };

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
