import type { Metadata } from "next";
import { ContactPageContent, legalMetadata } from "@/components/landing/LegalPage";

export const metadata: Metadata = legalMetadata("fr", "contact");

export default function Page() {
  return <ContactPageContent lang="fr" />;
}
