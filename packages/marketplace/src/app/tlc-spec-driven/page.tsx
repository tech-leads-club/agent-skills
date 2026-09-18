import { SpecDrivenBenchmark } from '../../components/benchmark/SpecDrivenBenchmark'
import { LPFinalCTA } from '../../components/lp/LPFinalCTA'
import { LPHero } from '../../components/lp/LPHero'
import { LPHowItWorks } from '../../components/lp/LPHowItWorks'
import { LPQuality } from '../../components/lp/LPQuality'
import { LPSimplicity } from '../../components/lp/LPSimplicity'
import { LPValueProps } from '../../components/lp/LPValueProps'
import { buildPageMetadata } from '../../lib/seo/metadata'
import { pathFor } from '../../lib/seo/urls'

export const metadata = buildPageMetadata({
  title: 'TLC Spec-Driven — From request to a checked build',
  description:
    'Four adaptive phases that turn a request into testable requirements, atomic commits, and an independent check before you call it done.',
  path: pathFor(['tlc-spec-driven']),
  ogImage: '/og-tlc-spec-driven.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
})

export default function TLCSpecDrivenLandingPage() {
  return (
    <>
      <LPHero />
      <LPValueProps />
      <LPHowItWorks />
      <LPQuality />
      <LPSimplicity />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <SpecDrivenBenchmark skillId="tlc-spec-driven" />
      </div>
      <LPFinalCTA />
    </>
  )
}
