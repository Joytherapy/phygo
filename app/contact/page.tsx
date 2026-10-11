import type { Metadata } from "next";
import { ContactPageContent, legalMetadata } from "@/components/landing/LegalPage";

export const metadata: Metadata = legalMetadata("en", "contact");

export default function Page() {
  return <ContactPageContent lang="en" />;
}
