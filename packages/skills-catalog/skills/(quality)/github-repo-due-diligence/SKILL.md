---
name: github-repo-due-diligence
description: "Evaluate a GitHub repository for legitimacy, real community engagement, and actual substance using API-first investigation. Detects star inflation, single-person projects masquerading as communities, and buzzword-heavy empty repos. Use when "is this repo legit", "evaluate this project", "should I use this library", "check this open source tool", or "due diligence on this repo". Do NOT use for private repositories or code review."
license: CC-BY-4.0
metadata:
  version: '1.0.0'
  author: github.com/MackDing
---

# GitHub Repository Due Diligence

## When to Use
- User asks if a repo is worth contributing to, using, or PRing
- Evaluating open-source tools before adoption
- Checking if a project is legitimate or AI-generated hype
- Assessing community health before investing time

## Approach: API-First Investigation

Use the GitHub REST API (api.github.com) via terminal curl — no auth needed for public repos, avoids browser bot detection, faster than scraping. Parse JSON output with python3.

## Step 1: Basic Repo Stats
Query: GET /repos/{owner}/{repo}
Key fields: stargazers_count, forks_count, open_issues_count, subscribers_count, created_at, pushed_at, size, language, topics, license

## Step 2: Contributor Distribution
Query: GET /repos/{owner}/{repo}/contributors?per_page=10
Check: What percentage of commits come from the top contributor?

## Step 3: Commit Velocity & Patterns
Query: GET /repos/{owner}/{repo}/commits?per_page=20
Check: Commit frequency, naming patterns, single-day burst counts
Tip: Filter by date with ?since=YYYY-MM-DDT00:00:00Z to count daily commits

## Step 4: PR & Issue Quality
Query: GET /repos/{owner}/{repo}/pulls?state=all&per_page=10&sort=created&direction=desc
Check: Comment count on external PRs, review activity, discussion depth

## Step 5: Code Substance
Query: GET /repos/{owner}/{repo}/contents/ (directory listing)
Also fetch raw package.json or equivalent dependency manifest
Check: Dependency count vs feature claims, directory structure coherence

## Step 6: Author Profile & History
Query: GET /users/{owner}
Check: Account age, follower count, bio, public_repos
Also: Test if repo was renamed (GET /repos/{owner}/{old-name} returns "Moved Permanently" — stars transfer on rename)

## Step 7: Star Growth Timeline (Most Powerful Signal)

Sample stargazers at multiple page offsets to reconstruct the growth curve:
Query: GET /repos/{owner}/{repo}/stargazers?per_page=30&page=N
Header: Accept: application/vnd.github.v3.star+json (returns starred_at timestamps)

Sample pages: 1, 100, 200, 400, 600, 800, 1000+ (each page = 30 stars, so page N ≈ star #N*30)
Calculate stars/day between milestones. Organic projects show:
- Gradual decline after initial spike (HN/trending burst fades)
- Steady 10-50/day for popular projects
- Never sustained 1000+/day without major press coverage

Artificial projects show:
- Sudden acceleration months after creation (bot campaigns started)
- 1000-3000 stars/day with no corresponding HN/Reddit/Twitter virality
- Multiple burst periods (buys happen in batches)

## Step 8: Stargazer Account Quality Check

Sample 10 accounts from burst periods and check:
Query: GET /users/{login}
Red flags: created recently (2025-2026), 0 repos, 0 followers, username patterns like name+number+suffix (e.g., "mengxingdong0211-netizen", "manojkumarabhi0-code")

## Step 9: npm/PyPI Download Cross-Reference

If the project has a package, check actual usage:
npm: curl https://api.npmjs.org/downloads/range/{start}:{end}/{package}
PyPI: curl https://pypistats.org/api/packages/{package}/recent

Compare: 41k stars but only 700k total downloads over a year = stars disproportionate to real usage.

## Step 10: External Visibility Check

Search HN for mentions: https://hn.algolia.com/api/v1/search?query={name}&tags=story
If 40k+ stars but only 1-3 pt HN posts = no organic community awareness exists.

---

## Red Flags Checklist

### Stars & Engagement
- subscribers_count much lower than stargazers_count (healthy: >5%; suspicious: <1%)
- Repo created recently but has massive stars
- Star badge in README points to a different/old repo name (rename inheritance)

### Contributors & Commits
- One person >90% of all commits = personal project, not community
- Bot accounts (e.g., "claude", "copilot") in contributor list
- 30+ commits in one day with mechanical naming (feat/fix/chore prefixes, sequential P1-P11 numbering)
- Version bumps spanning 10+ minor versions in a single day
- Very few external contributors despite high fork count

### PRs & Issues
- External PRs with 0 comments/reviews = no one reviewing
- Bulk PRs from a single external account (sock puppet or AI agent)
- High open issue count with no meaningful discussion

### Code Substance
- Ambitious claims ("enterprise-grade", "60+ agents") but minimal dependencies (e.g., 2 deps)
- No standard src/ directory, code scattered across versioned dirs (v2, v3)
- Excessive documentation/marketing relative to actual code
- Huge repo size (500MB+) for what should be a lightweight tool

### README & Marketing
- Self-proclaimed superlatives ("The leading...", "enterprise-grade")
- Buzzword density: swarm intelligence, federation, RAG, WASM kernels all in one project
- No third-party endorsements, blog posts, or conference talks
- Author bio is vague/hype-oriented ("Unicorn Breeder")

## Legitimacy Scoring Heuristics

| Signal | Healthy | Suspicious |
|--------|---------|------------|
| Subscribers/Stars ratio | >5% | <1% |
| Top contributor share | <70% commits | >90% commits |
| Commits per day | 1-10 | 30+ mechanical |
| External PR review | Comments, discussion | 0 comments |
| Dependencies vs claims | Proportional | Minimal for ambitious claims |
| Repo age vs stars | Gradual growth | Sudden spike |
| Stars/day in bursts | <200 (even after trending) | 1000+ with no press |
| Stargazer accounts | Diverse ages, have repos | New, empty, patterned names |
| Package downloads vs stars | Proportional | Stars >> actual usage |
| HN/Reddit visibility | Posts with 50+ points | 1-3 pts or absent |

## Pitfalls
- GitHub API rate limit: 60 req/hr unauthenticated. Use gh api if authenticated.
- Renamed repos inherit all stars/forks — always check for rename history.
- High star count alone means nothing — cross-reference with subscriber count, contributor diversity, and code substance.
- Some legitimate projects have few contributors early on — combine multiple signals, don't judge on one metric alone.
- Stars can be purchased/botted — the subscribers_count ratio is a much harder metric to fake.
- The star growth timeline (Step 7) is the strongest evidence — organic projects never sustain 1000+ stars/day without major press. Use `execute_code` for the date math to avoid terminal heredoc timeout issues.
- When checking stargazer account quality, focus on burst periods, not early stars which may be organic.
- npm/PyPI downloads are harder to fake than GitHub stars — always cross-reference when a package exists.
