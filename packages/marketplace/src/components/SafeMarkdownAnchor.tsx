import type { AnchorHTMLAttributes, ReactNode } from 'react'

import { isPathLikeHref, isSafeMarkdownHref } from '../lib/safe-markdown-href'

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: ReactNode
  href?: string
}

/**
 * ReactMarkdown `a` override: only emit real anchors for safe absolute/hash/mailto hrefs.
 * Relative package paths render as visible text/code with no marketplace `<a href>`.
 */
export function SafeMarkdownAnchor({ href, children, ...rest }: Props) {
  // ReactMarkdown may pass a Hast `node` prop — do not forward it to the DOM.
  const { node: _node, ...anchorProps } = rest as Props & { node?: unknown }

  if (isSafeMarkdownHref(href)) {
    const external = href != null && /^https?:/i.test(href.trim())
    return (
      <a
        {...anchorProps}
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    )
  }

  const label = children ?? href
  if (href && isPathLikeHref(href)) {
    return <code>{label}</code>
  }
  return <span>{label}</span>
}
