import type { Metadata } from "next";
import { LegalDocumentPage, legalMetadata } from "@/components/landing/LegalPage";

export const metadata: Metadata = legalMetadata("en", "privacy");

export default function Page() {
  return <LegalDocumentPage lang="en" page="privacy" />;
}
