import Link from 'next/link'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

import { isInternalHref } from '../lib/editorial-links'
import { SafeMarkdownAnchor } from './SafeMarkdownAnchor'

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { children?: ReactNode; href?: string }

/**
 * ReactMarkdown `a` override for site-authored editorial content. Unlike SKILL.md bodies, these
 * files link to other site pages (`/skills/<id>/`), and those links are checked by generate-data,
 * so root-relative paths become real internal links. Anything else falls back to the safe anchor.
 */
export function EditorialAnchor({ href, children, ...rest }: Props) {
  if (isInternalHref(href)) {
    return <Link href={href}>{children}</Link>
  }
  return (
    <SafeMarkdownAnchor href={href} {...rest}>
      {children}
    </SafeMarkdownAnchor>
  )
}
