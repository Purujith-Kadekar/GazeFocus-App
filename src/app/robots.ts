import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/fyq', '/privacy-policy', '/terms-and-conditions'],
        disallow: ['/admin', '/auth', '/dashboard', '/settings', '/api'],
      },
    ],
    sitemap: 'https://gaze-focus.vercel.app/sitemap.xml',
    host: 'https://gaze-focus.vercel.app',
  }
}
