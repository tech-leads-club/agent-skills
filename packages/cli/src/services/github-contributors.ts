import ky from 'ky'

import type { GitHubContributor } from '../types'

const REPO_API = 'https://api.github.com/repos/tech-leads-club/agent-skills'
const CONTRIBUTORS_URL = `${REPO_API}/contributors`

let contributorsCache: GitHubContributor[] | null = null
let starsCache: number | null = null

export async function fetchContributors(): Promise<GitHubContributor[]> {
  if (contributorsCache) return contributorsCache

  try {
    const data = await ky
      .get(CONTRIBUTORS_URL, {
        headers: { Accept: 'application/vnd.github.v3+json' },
        timeout: 10_000,
      })
      .json<Array<{ login: string; avatar_url: string; contributions: number }>>()

    contributorsCache = data
      .filter(({ login }) => !isBot(login))
      .map(({ login, avatar_url, contributions }) => ({
        login,
        avatarUrl: avatar_url,
        contributions,
      }))

    return contributorsCache
  } catch {
    return []
  }
}

export async function fetchRepoStars(): Promise<number> {
  if (starsCache !== null) return starsCache

  try {
    const data = await ky
      .get(REPO_API, {
        headers: { Accept: 'application/vnd.github.v3+json' },
        timeout: 10_000,
      })
      .json<{ stargazers_count: number }>()

    starsCache = data.stargazers_count
    return starsCache
  } catch {
    return 0
  }
}

function isBot(login: string): boolean {
  return login.endsWith('[bot]')
}
