import Link from 'next/link'
import { CategoryBadge } from '../components/CategoryBadge'
import { CopyButton } from '../components/CopyButton'
import { JsonLd } from '../components/JsonLd'
import { NpmDownloadsCard } from '../components/NpmDownloadsCard'
import { ShareButton } from '../components/ShareButton'
import { StatsCard } from '../components/StatsCard'
import marketplaceData from '../data/skills.json'

const HERO_SKILL_ID = 'tlc-spec-driven'
const HERO_SKILL_DESCRIPTION =
  'Turn your AI agent into a disciplined engineering partner. Spec-Driven guides every project through 4 adaptive phases — Specify, Design, Tasks, Execute — automatically sizing depth by complexity. From quick bug fixes to full feature builds, it produces atomic commits, requirement traceability, and persistent memory across sessions. Stack-agnostic, zero config, and works with any AI coding agent.'

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Agent Skills Marketplace',
  url: 'https://agent-skills.techleads.club',
  description:
    'A curated collection of skills for AI coding agents. Extend Cursor, Claude Code, GitHub Copilot, Windsurf, and more with reusable, packaged instructions.',
  publisher: {
    '@type': 'Organization',
    name: 'Tech Leads Club',
    url: 'https://github.com/tech-leads-club',
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://agent-skills.techleads.club/skills?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function HomePage() {
  const { stats, skills } = marketplaceData
  const heroSkill = skills.find((s) => s.id === HERO_SKILL_ID)
  const featuredSkills = skills.filter((s) => s.id !== HERO_SKILL_ID).slice(0, 3)

  return (
    <>
      <JsonLd data={websiteSchema} />

      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden py-10 sm:py-10 lg:py-10 px-4 sm:px-5">
        <div className="hero-dots absolute inset-0 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-blue-500/5 dark:bg-blue-400/5 blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-blue-400/4 dark:bg-blue-300/4 blur-[60px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Text side */}
            <div className="flex-1 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-blue-500/6 dark:bg-blue-400/10 border border-blue-500/12 dark:border-blue-400/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {stats.totalSkills} skills available
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-gray-100 leading-[1.1] tracking-tight mb-5">
                Skills for smarter <span className="text-blue-600 dark:text-blue-400">AI agents</span>
              </h1>

              <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-8 max-w-md">
                Extend your agent's capabilities with curated skills — specialized workflows, domain expertise, and tool
                integrations.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/skills"
                  className="px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 hover:-translate-y-0.5"
                >
                  Browse Skills
                </Link>
                <a
                  href="https://github.com/tech-leads-club/agent-skills"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-7 py-3.5 bg-transparent text-gray-600 dark:text-gray-300 font-semibold rounded-xl border-[1.5px] border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex items-center gap-2"
                >
                  View on GitHub
                </a>
              </div>
            </div>

            {/* Illustration side */}
            <div className="flex-1 hidden lg:flex justify-center">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Featured Skills */}
        <section className="py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Featured Skills</h2>
            <Link
              href="/skills"
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              View All →
            </Link>
          </div>

          {/* Featured highlight card */}
          {heroSkill &&
            (() => {
              const heroCategory = marketplaceData.categories.find((c) => c.id === heroSkill.category)
              const heroInstallCommand = `npx @tech-leads-club/agent-skills install --skill ${heroSkill.id}`
              return (
                <div className="mb-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 text-xs font-bold bg-emerald-500 text-white rounded-md tracking-wide">
                      Featured
                    </span>
                    <CategoryBadge
                      categoryId={heroSkill.category}
                      categoryName={heroCategory?.name || heroSkill.category}
                    />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-3 tracking-tight">
                    <Link
                      href={`/skills/${heroSkill.id}`}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {heroSkill.name}
                    </Link>
                  </h3>
                  <p className="text-[15px] text-gray-500 dark:text-gray-400 mb-6 leading-relaxed max-w-3xl">
                    {HERO_SKILL_DESCRIPTION}
                  </p>
                  <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-3.5 sm:p-4 flex items-center justify-between mb-5">
                    <code className="text-sm text-sky-400 font-mono truncate">{heroInstallCommand}</code>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <CopyButton text={heroInstallCommand} />
                    <Link
                      href={`/skills/${heroSkill.id}`}
                      className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 text-sm"
                    >
                      View Skill →
                    </Link>
                    <ShareButton skillId={heroSkill.id} variant="icon" />
                  </div>
                </div>
              )
            })()}

          {/* Other featured skills */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featuredSkills.map((skill) => {
              const category = marketplaceData.categories.find((c) => c.id === skill.category)
              const installCommand = `npx @tech-leads-club/agent-skills install --skill ${skill.id}`
              return (
                <div
                  key={skill.id}
                  className="skill-card-hover bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                      <Link
                        href={`/skills/${skill.id}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {skill.name}
                      </Link>
                    </h3>
                    <CategoryBadge categoryId={skill.category} categoryName={category?.name || skill.category} />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                    {skill.description}
                  </p>
                  <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-2.5 flex items-center justify-between gap-2 mt-auto">
                    <code className="text-xs text-sky-400 font-mono truncate">
                      npx agent-skills install --skill {skill.id}
                    </code>
                    <CopyButton text={installCommand} className="!px-2.5 !py-1 !text-xs" />
                  </div>
                  <div className="flex justify-end">
                    <Link
                      href={`/skills/${skill.id}`}
                      className="text-[13px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      View Details
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M4.646 1.646a.5.5 0 01.708 0l6 6a.5.5 0 010 .708l-6 6a.5.5 0 01-.708-.708L10.293 8 4.646 2.354a.5.5 0 010-.708z"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Stats */}
        <section className="py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatsCard label="Total Skills" value={stats.totalSkills} icon="⚡" />
            <StatsCard label="Categories" value={stats.totalCategories} icon="📂" />
            <NpmDownloadsCard />
          </div>
        </section>

        {/* Quick Start */}
        <section className="pb-16">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Quick Start</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Install skills directly from the command line:
            </p>
            <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 flex items-center justify-between">
              <code className="text-sm text-sky-400 font-mono">
                npx @tech-leads-club/agent-skills install --skill [skill-name]
              </code>
              <CopyButton
                text="npx @tech-leads-club/agent-skills install --skill [skill-name]"
                className="!bg-white/10 !text-white !px-4 !py-1.5 !text-xs hover:!bg-white/20"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              Skills are installed to your agent's skills directory (e.g., .cursor/skills/, .claude/skills/)
            </p>
          </div>
        </section>
      </div>
    </>
  )
}

function HeroIllustration() {
  const skills = ['aws-advisor', 'react-patterns', 'system-design', 'security', 'deploy']
  const positions = [
    { x: 200, y: 40 },
    { x: 340, y: 120 },
    { x: 310, y: 260 },
    { x: 90, y: 260 },
    { x: 60, y: 120 },
  ]

  return (
    <div className="relative w-[400px] h-[340px]">
      {/* Central node */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90px] h-[90px] rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/30 z-10">
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
          <path d="M10 22V14l6-4 6 4v8l-6 4-6-4z" fill="white" opacity="0.5" />
          <path d="M16 10l6 4v8l-6 4V10z" fill="white" opacity="0.7" />
          <circle cx="16" cy="16" r="3" fill="white" />
        </svg>
      </div>

      {/* Connection lines + orbiting nodes */}
      <svg className="absolute inset-0 z-0 pointer-events-none" width="400" height="340">
        {positions.map((pos, i) => (
          <line
            key={`line-${i}`}
            x1="200"
            y1="170"
            x2={pos.x}
            y2={pos.y}
            stroke="currentColor"
            className="text-blue-300 dark:text-blue-600"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.4"
          />
        ))}
      </svg>

      {skills.map((name, i) => (
        <div
          key={name}
          className="absolute bg-white dark:bg-gray-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-blue-100 dark:border-blue-900/40 shadow-md z-[2] whitespace-nowrap"
          style={{ left: positions[i].x - 36, top: positions[i].y - 16 }}
        >
          {name}
        </div>
      ))}
    </div>
  )
}
