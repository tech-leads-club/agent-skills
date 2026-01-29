import Link from 'next/link';
import { StatsCard } from '../components/StatsCard';
import marketplaceData from '../data/skills.json';

export default function HomePage() {
  const { stats, skills } = marketplaceData;
  const featuredSkills = skills.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Agent Skills Marketplace
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          A curated collection of skills for AI coding agents. Extend your agent's capabilities
          with specialized workflows, domain knowledge, and tool integrations.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/skills"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Skills
          </Link>
          <a
            href="https://github.com/tech-leads-club/agent-skills"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <StatsCard label="Total Skills" value={stats.totalSkills} icon="🎯" />
        <StatsCard label="Categories" value={stats.totalCategories} icon="📂" />
      </div>

      {/* Quick Start */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-16 border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Start</h2>
        <p className="text-gray-600 mb-4">
          Install skills directly from the command line:
        </p>
        <div className="bg-gray-50 rounded-md p-4 mb-4">
          <code className="text-sm text-gray-800">
            npx @tech-leads-club/agent-skills --skill [skill-name]
          </code>
        </div>
        <p className="text-sm text-gray-500">
          Skills are installed to your agent's skills directory (e.g., .cursor/skills/, .claude/skills/, etc.)
        </p>
      </div>

      {/* Featured Skills */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Featured Skills</h2>
          <Link
            href="/skills"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredSkills.map((skill) => {
            const category = marketplaceData.categories.find(
              (c) => c.id === skill.category
            );
            return (
              <div
                key={skill.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {skill.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {skill.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {category?.name || skill.category}
                  </span>
                  <Link
                    href={`/skills/${skill.id}`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
