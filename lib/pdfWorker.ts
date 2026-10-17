// The pdf.js worker used by react-pdf, served from our own domain.
// It used to come from cdnjs.cloudflare.com, so opening a PDF in Workspace
// sent the user's IP and browser to a third party not named in the privacy
// notice. next.config.js copies the worker of the installed pdfjs-dist (the
// build react-pdf uses) to public/pdfjs/<version>/ at build time; the path
// carries the version, so a mismatch shows up as a missing file, not as a
// silently different worker.
export const pdfWorkerSrc = (version: string) => `/pdfjs/${version}/pdf.worker.min.mjs`
