const fs = require('fs');
const path = require('path');

// Serve the pdf.js worker from our own domain (see lib/pdfWorker.ts): copy
// the worker of the installed pdfjs-dist, the build react-pdf uses, to
// public/pdfjs/<version>/ before Next collects the public folder.
function copyPdfWorker() {
  // Resolved from react-pdf, so it is the pdfjs-dist react-pdf actually uses.
  const fromReactPdf = require('module').createRequire(require.resolve('react-pdf'));
  const pkg = path.dirname(fromReactPdf.resolve('pdfjs-dist/package.json'));
  const { version } = fromReactPdf('pdfjs-dist/package.json');
  const target = path.join(__dirname, 'public', 'pdfjs', version);
  fs.mkdirSync(target, { recursive: true });
  fs.copyFileSync(path.join(pkg, 'build', 'pdf.worker.min.mjs'), path.join(target, 'pdf.worker.min.mjs'));
}
copyPdfWorker();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    // react-pdf's pdfjs-dist bundles an optional Node "canvas" fallback that
    // Next's webpack build otherwise tries (and fails) to resolve — it's
    // never used client-side (PdfViewer only loads via dynamic ssr:false
    // import), so this just prevents an unnecessary build error.
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
