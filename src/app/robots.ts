import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/about', '/faq', '/privacy-policy', '/terms-and-conditions', '/sitemap', '/auth/login', '/auth/signup'],
        disallow: ['/admin', '/auth/verify-email', '/dashboard', '/settings', '/api'],
      },
    ],
    sitemap: 'https://gaze-focus.vercel.app/sitemap.xml',
    host: 'https://gaze-focus.vercel.app',
  }
}
