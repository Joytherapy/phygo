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
