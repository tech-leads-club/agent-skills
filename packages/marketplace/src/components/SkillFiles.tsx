const GROUP_LABELS: Record<string, string> = {
  '': 'Instructions',
  scripts: 'Scripts the agent runs',
  references: 'References loaded on demand',
  templates: 'Templates',
  assets: 'Assets',
}

const GROUP_ORDER = ['', 'scripts', 'references', 'templates', 'assets']

export function groupSkillFiles(files: string[]): { label: string; files: string[] }[] {
  const groups = new Map<string, string[]>()
  for (const file of files) {
    const slash = file.indexOf('/')
    const key = slash === -1 ? '' : file.slice(0, slash)
    groups.set(key, [...(groups.get(key) ?? []), file])
  }

  const rank = (key: string) => (GROUP_ORDER.includes(key) ? GROUP_ORDER.indexOf(key) : GROUP_ORDER.length)
  return [...groups.entries()]
    .sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
    .map(([key, groupFiles]) => ({ label: GROUP_LABELS[key] ?? `${key}/`, files: groupFiles.sort() }))
}

/**
 * why: copies of this skill elsewhere show only the SKILL.md text. The full folder layout is
 * catalog data only this site has, and it tells a reader what actually lands in their repo.
 */
export function SkillFiles({ skillId, files }: { skillId: string; files: string[] }) {
  if (files.length === 0) return null

  return (
    <section
      aria-labelledby="skill-files"
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm mb-6"
    >
      <h2 id="skill-files" className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
        What&apos;s in the folder
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {files.length} {files.length === 1 ? 'file' : 'files'} installed into <code>{skillId}/</code>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {groupSkillFiles(files).map((group) => (
          <div key={group.label}>
            <h3 className="text-[11px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest mb-2">
              {group.label}
            </h3>
            <ul className="space-y-1">
              {group.files.map((file) => (
                <li key={file}>
                  <code className="text-xs bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 break-all">
                    {file}
                  </code>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
