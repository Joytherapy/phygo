import type { Metadata } from "next";
import { LegalDocumentPage, legalMetadata } from "@/components/landing/LegalPage";

export const metadata: Metadata = legalMetadata("en", "terms");

export default function Page() {
  return <LegalDocumentPage lang="en" page="terms" />;
}
