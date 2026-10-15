// Plan du site : regroupe les pages publiques indexables.

import type { MetadataRoute } from 'next';

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${APP_URL}/`, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${APP_URL}/documents`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${APP_URL}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${APP_URL}/register`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
