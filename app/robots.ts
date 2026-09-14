import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/publicLibrary';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/my-phygo/', '/onboarding/', '/login'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
