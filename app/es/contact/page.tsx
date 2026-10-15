import type { Metadata } from "next";
import { ContactPageContent, legalMetadata } from "@/components/landing/LegalPage";

export const metadata: Metadata = legalMetadata("es", "contact");

export default function Page() {
  return <ContactPageContent lang="es" />;
}
