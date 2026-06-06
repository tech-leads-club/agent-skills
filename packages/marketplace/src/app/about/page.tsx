import type { Metadata } from 'next'
import Link from 'next/link'
import { CategoryBadge } from '../../components/CategoryBadge'
import { CopyButton } from '../../components/CopyButton'
import { JsonLd } from '../../components/JsonLd'
import marketplaceData from '../../data/skills.json'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about Agent Skills - a secure, validated skill registry for professional AI coding agents. Extend Cursor, Claude Code, GitHub Copilot, Windsurf, and more with confidence.',
  alternates: {
    canonical: '/about',
  },
}

const aboutPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Agent Skills',
  description:
    'Learn about Agent Skills - a secure, validated skill registry for professional AI coding agents. Extend Cursor, Claude Code, GitHub Copilot, Windsurf, and more with confidence.',
  url: 'https://agent-skills.techleads.club/about',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Agent Skills Marketplace',
    url: 'https://agent-skills.techleads.club',
  },
}

const agentTiers = [
  { tier: 'Tier 1 (Full)', agents: 'Cursor, Claude Code', note: 'Full skill support with auto-detection' },
  {
    tier: 'Tier 2 (Good)',
    agents: 'Windsurf, VS Code + Copilot, Cline',
    note: 'Skill loading with manual configuration',
  },
  { tier: 'Tier 3 (Basic)', agents: 'Other MCP clients', note: 'MCP server integration available' },
]

const securityFeatures = [
  { title: 'Code review', desc: 'Every skill undergoes manual code review before publication' },
  { title: 'Content limits', desc: 'Integrity-based verification with standardized content hashing' },
  { title: 'Scoped access', desc: 'No workflow execution or content injection beyond skill bounds' },
  { title: 'Transparency', desc: 'Full source available — inspect any skill before installing' },
]

const howItWorks = [
  {
    step: '1',
    title: 'Browse',
    desc: `Find skills that match your needs from our curated catalog of ${marketplaceData.stats.totalSkills}+ skills across ${marketplaceData.stats.totalCategories} categories.`,
  },
  {
    step: '2',
    title: 'Install',
    desc: "Use the CLI to download and install skills into your coding agent's skills directory.",
  },
  {
    step: '3',
    title: 'Use',
    desc: 'Your AI agent automatically loads installed skills and applies their expertise to relevant tasks.',
  },
]

const mcpTools = [
  { tool: 'list_skills', desc: 'Browse all skills in the catalog' },
  { tool: 'get_skill_details', desc: 'Get full details for a specific skill' },
  { tool: 'search_skills', desc: 'Find skills by keyword or category' },
  { tool: 'install_skill', desc: 'Download and install a skill locally' },
]

export default function AboutPage() {
  const featuredSkills = [...marketplaceData.skills]
    .sort((a, b) => {
      if (a.id === 'tlc-spec-driven') return -1
      if (b.id === 'tlc-spec-driven') return 1
      return a.name.localeCompare(b.name)
    })
    .slice(0, 8)

  return (
    <>
      <JsonLd data={aboutPageSchema} />

      {/* Header Banner */}
      <section className="hero-gradient relative overflow-hidden py-16 sm:py-20 px-4 sm:px-8 text-center">
        <div className="hero-dots absolute inset-0 pointer-events-none" />
        <div className="relative z-10 max-w-[680px] mx-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/30 mb-5">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M10 22V14l6-4 6 4v8l-6 4-6-4z" fill="white" opacity="0.5" />
              <path d="M16 10l6 4v8l-6 4V10z" fill="white" opacity="0.7" />
              <circle cx="16" cy="16" r="3" fill="white" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-[42px] font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-3">
            Agent Skills
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
            The open-source skill registry for professional AI coding agents
          </p>
        </div>
      </section>

      <div className="max-w-[820px] mx-auto px-4 sm:px-8 py-12 sm:py-16">
        {/* What are Skills */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
            What are Skills?
          </h2>
          <p className="text-[15px] leading-[1.8] text-gray-500 dark:text-gray-400 mb-3">
            Skills are packaged instructions and resources that extend AI agent capabilities. Think of them as plugins
            for your AI assistant — they teach your agent new workflows, patterns, and specialized knowledge.
          </p>
          <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 sm:p-5 my-4">
            <code className="text-[13px] text-sky-400 font-mono whitespace-pre-wrap block leading-relaxed">
              {`my-project/
├── .cursor/skills/          # Cursor skills directory
│   ├── accessibility/       # → Skill: web a11y auditing
│   ├── react-patterns/      # → Skill: React best practices
│   └── system-design/       # → Skill: architecture guidance
└── src/`}
            </code>
          </div>
          <p className="text-[15px] leading-[1.8] text-gray-500 dark:text-gray-400">
            Each skill contains instruction files, optional reference materials, and automation scripts that your AI
            agent uses to provide expert-level assistance in specific domains.
          </p>
        </section>

        {/* Security & Trust */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
            Security & Trust
          </h2>
          <p className="text-[15px] leading-[1.8] text-gray-500 dark:text-gray-400 mb-4">
            Your environment's safety is our top priority. Unlike open marketplaces where 15.4% of skills contain
            critical issues, Agent Skills uses a multi-layered review process:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {securityFeatures.map((item) => (
              <div
                key={item.title}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5"
              >
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5">{item.title}</div>
                <div className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Supported Agents */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
            Supported Agents
          </h2>
          <p className="text-[15px] leading-[1.8] text-gray-500 dark:text-gray-400 mb-4">
            Install skills to any of these AI coding agents:
          </p>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                    Tier
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                    Agents
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                    Support Level
                  </th>
                </tr>
              </thead>
              <tbody>
                {agentTiers.map((t, i) => (
                  <tr
                    key={t.tier}
                    className={i < agentTiers.length - 1 ? 'border-b border-gray-50 dark:border-gray-800/50' : ''}
                  >
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{t.tier}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{t.agents}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{t.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Featured Skills */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-4">
            Featured Skills
          </h2>
          <p className="text-[15px] leading-[1.8] text-gray-500 dark:text-gray-400 mb-4">
            A preview of what's available in our growing catalog:
          </p>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                    Skill
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {featuredSkills.map((s, i) => {
                  const cat = marketplaceData.categories.find((c) => c.id === s.category)
                  return (
                    <tr
                      key={s.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${i < featuredSkills.length - 1 ? 'border-b border-gray-50 dark:border-gray-800/50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/skills/${s.id}`}
                          className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          {s.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <CategoryBadge categoryId={s.category} categoryName={cat?.name || s.category} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{s.metadata.lastModified}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="text-center mt-4">
            <Link
              href="/skills"
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              View all {marketplaceData.stats.totalSkills} skills →
            </Link>
          </div>
        </section>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-4">Quick Start</h2>
          <p className="text-[15px] leading-[1.8] text-gray-500 dark:text-gray-400 mb-4">
            Install skills directly from your CLI:
          </p>
          <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-4 sm:p-5 relative">
            <code className="text-[13px] text-sky-400 font-mono whitespace-pre-wrap block leading-relaxed">
              {`# Install a specific skill
npx @tech-leads-club/agent-skills install --skill accessibility

# Interactive browser
npx @tech-leads-club/agent-skills install

# Install all skills
npx @tech-leads-club/agent-skills install --all`}
            </code>
            <div className="absolute top-3 right-3">
              <CopyButton
                text={`npx @tech-leads-club/agent-skills install --skill accessibility`}
                className="!bg-white/10 !text-white !px-3 !py-1.5 !text-xs hover:!bg-white/20"
              />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-4">How It Works</h2>
          <div className="flex flex-col gap-5">
            {howItWorks.map((item) => (
              <div key={item.step} className="flex gap-5 items-start">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-base font-extrabold text-blue-600 dark:text-blue-400 shrink-0">
                  {item.step}
                </div>
                <div>
                  <div className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">{item.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MCP Server */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-4">MCP Server</h2>
          <p className="text-[15px] leading-[1.8] text-gray-500 dark:text-gray-400 mb-4">
            The included MCP server exposes the skills catalog directly to AI agents via the Model Context Protocol.
            Available tools:
          </p>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                    Tool
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800">
                    Purpose
                  </th>
                </tr>
              </thead>
              <tbody>
                {mcpTools.map((item, i) => (
                  <tr
                    key={item.tool}
                    className={i < mcpTools.length - 1 ? 'border-b border-gray-50 dark:border-gray-800/50' : ''}
                  >
                    <td className="px-4 py-3">
                      <code className="text-[13px] font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {item.tool}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Contributing */}
        <section className="mb-12">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-4">Contributing</h2>
          <p className="text-[15px] leading-[1.8] text-gray-500 dark:text-gray-400 mb-4">
            We welcome contributions! The repository is open-source and community-driven. Visit the GitHub repository
            for detailed guidelines on setting up your local environment, creating new skills, and submitting pull
            requests.
          </p>
          <a
            href="https://github.com/tech-leads-club/agent-skills"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/20 text-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            View Repository
          </a>
        </section>

        {/* License */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight mb-4">License</h2>
          <p className="text-[15px] leading-[1.8] text-gray-500 dark:text-gray-400">
            Agent Skills is licensed under the MIT License. The application source code, CLI tools, and repository
            infrastructure are maintained by Tech Leads Club. Community-contributed skills are credited to their
            respective authors.
          </p>
        </section>
      </div>
    </>
  )
}
