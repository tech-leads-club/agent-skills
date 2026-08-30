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
  title: 'TLC Spec-Driven — AI Agents That Ship Right, Every Time',
  description:
    '4 adaptive phases, atomic tasks with verification criteria, and requirement traceability from spec to commit.',
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
