import type { Metadata } from 'next'

import {
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  MAX_META_DESCRIPTION_LENGTH,
  SITE_NAME,
} from './site'
import { truncateForMeta } from './skill-description'

export interface PageMetadataInput {
  /** Page title without the brand suffix — the root layout template appends it. */
  title: string
  description: string
  /** Canonical path, always trailing-slashed; build it with `routes.*`. */
  path: string
  ogType?: 'website' | 'article'
  ogImage?: string
  ogImageWidth?: number
  ogImageHeight?: number
  keywords?: string[]
  /** Set for pages that must stay out of the index but keep passing link equity. */
  noIndex?: boolean
}

/**
 * why: every page previously hand-rolled its own title/description/canonical/OG block, which is
 * how pages silently inherited the homepage canonical or shipped a 900-character description.
 * One factory keeps the invariants (trailing-slash canonical, snippet-length description,
 * complete social card) true for all current and future page types.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  ogImageWidth = DEFAULT_OG_IMAGE_WIDTH,
  ogImageHeight = DEFAULT_OG_IMAGE_HEIGHT,
  keywords,
  noIndex = false,
}: PageMetadataInput): Metadata {
  const snippet = truncateForMeta(description, MAX_META_DESCRIPTION_LENGTH)
  const socialTitle = `${title} | ${SITE_NAME}`

  return {
    title,
    description: snippet,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: { canonical: path },
    openGraph: {
      type: ogType,
      siteName: SITE_NAME,
      locale: 'en_US',
      title: socialTitle,
      description: snippet,
      url: path,
      images: [{ url: ogImage, width: ogImageWidth, height: ogImageHeight, alt: socialTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: snippet,
      images: [ogImage],
    },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
  }
}
