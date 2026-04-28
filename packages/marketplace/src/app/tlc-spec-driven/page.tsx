import type { Metadata } from 'next'
import { LPFinalCTA } from '../../components/lp/LPFinalCTA'
import { LPHero } from '../../components/lp/LPHero'
import { LPHowItWorks } from '../../components/lp/LPHowItWorks'
import { LPQuality } from '../../components/lp/LPQuality'
import { LPSimplicity } from '../../components/lp/LPSimplicity'
import { LPValueProps } from '../../components/lp/LPValueProps'
import { SpecDrivenBenchmark } from '../../components/benchmark/SpecDrivenBenchmark'

export const metadata: Metadata = {
  title: 'TLC Spec-Driven — AI agents that ship right, every time',
  description:
    '4 adaptive phases. Atomic tasks with verification criteria. Requirement traceability from spec to commit. The highest-consistency spec-driven framework in our benchmark.',
  alternates: {
    canonical: '/tlc-spec-driven',
  },
  openGraph: {
    title: 'TLC Spec-Driven — AI agents that ship right, every time',
    description:
      '4 adaptive phases. Atomic tasks with verification criteria. Requirement traceability from spec to commit.',
    type: 'website',
    images: [
      {
        url: '/og-tlc-spec-driven.png',
        width: 1200,
        height: 630,
        alt: 'TLC Spec-Driven — AI agents that ship right, every time',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TLC Spec-Driven — AI agents that ship right, every time',
    description: '4 adaptive phases. Atomic tasks. Requirement traceability. Benchmarked best-in-class.',
    images: ['/og-tlc-spec-driven.png'],
  },
}

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
