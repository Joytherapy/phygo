import { permanentRedirect } from "next/navigation";

// English lives at "/" (the international default); /en/library/* stays as is.
// Rendered on request so the 308 carries a real Location header (a statically
// prerendered redirect would not).
export const dynamic = "force-dynamic";

export default function EnglishLanding() {
  permanentRedirect("/");
}
