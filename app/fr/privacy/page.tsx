import type { Metadata } from "next";
import { LegalDocumentPage, legalMetadata } from "@/components/landing/LegalPage";

export const metadata: Metadata = legalMetadata("fr", "privacy");

export default function Page() {
  return <LegalDocumentPage lang="fr" page="privacy" />;
}
