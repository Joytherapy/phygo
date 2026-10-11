import type { Metadata } from "next";
import { LegalDocumentPage, legalMetadata } from "@/components/landing/LegalPage";

export const metadata: Metadata = legalMetadata("it", "privacy");

export default function Page() {
  return <LegalDocumentPage lang="it" page="privacy" />;
}
