import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { SITE_URL, buildConditionPath } from '@/lib/publicLibrary';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/library/condition`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/en/library/condition`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/es/library/condition`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/fr/library/condition`, changeFrequency: 'weekly', priority: 0.9 },
  ];

  try {
    const { data, error } = await adminSupabase
      .from('knowledge_base')
      .select('id, condition_name, source_date');

    if (error || !data) {
      console.error('Errore generazione sitemap (knowledge_base):', error);
      return staticEntries;
    }

    const conditionEntries: MetadataRoute.Sitemap = data.map((c) => ({
      url: `${SITE_URL}${buildConditionPath(c.id, c.condition_name)}`,
      lastModified: c.source_date ? new Date(c.source_date) : undefined,
      changeFrequency: 'monthly',
      priority: 0.7,
    }));

    // Non-Italian URLs use just the numeric id (no slug) — the id alone
    // resolves correctly and avoids translating all ~250+ names into every
    // language just to build a sitemap.
    const conditionEntriesEN: MetadataRoute.Sitemap = data.map((c) => ({
      url: `${SITE_URL}/en/library/condition/${c.id}`,
      lastModified: c.source_date ? new Date(c.source_date) : undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
    const conditionEntriesES: MetadataRoute.Sitemap = data.map((c) => ({
      url: `${SITE_URL}/es/library/condition/${c.id}`,
      lastModified: c.source_date ? new Date(c.source_date) : undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
    const conditionEntriesFR: MetadataRoute.Sitemap = data.map((c) => ({
      url: `${SITE_URL}/fr/library/condition/${c.id}`,
      lastModified: c.source_date ? new Date(c.source_date) : undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    return [
      ...staticEntries,
      ...conditionEntries,
      ...conditionEntriesEN,
      ...conditionEntriesES,
      ...conditionEntriesFR,
    ];
  } catch (err) {
    console.error('Errore generazione sitemap:', err);
    return staticEntries;
  }
}
