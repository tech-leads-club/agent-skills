'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CategoryFilter } from '../../components/CategoryFilter'
import { Pagination } from '../../components/Pagination'
import { SearchBar } from '../../components/SearchBar'
import { SkillCard } from '../../components/SkillCard'
import { filterAndSortSkillsWithMeta, paginateSkills, type SkillSortOption } from '../../lib/skills-filter'
import { buildSearchIndex } from '../../lib/skills-search'
import type { MarketplaceData } from '../../types'

interface SkillsClientProps {
  data: MarketplaceData
}

const PAGE_SIZE = 12

function isSortOption(value: string | null): value is SkillSortOption {
  return value === 'featured' || value === 'name' || value === 'recent'
}

export function SkillsClient({ data }: SkillsClientProps) {
  // Defaults enable static HTML with page-1 cards (no useSearchParams / Suspense shell).
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<SkillSortOption>('featured')
  const [urlReady, setUrlReady] = useState(false)
  const skipPageReset = useRef(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const search = params.get('search') ?? ''
    const category = params.get('category')
    const page = Number(params.get('page')) || 1
    const sortParam = params.get('sort')
    setSearchQuery(search)
    setSelectedCategory(category)
    setCurrentPage(page)
    setSortBy(isSortOption(sortParam) ? sortParam : 'featured')
    setUrlReady(true)
  }, [])

  // why: normalizing 92 skill bodies on every keystroke would stall typing, so the index is
  // built once per dataset and reused by each query.
  const searchIndex = useMemo(() => buildSearchIndex(data.skills, data.categories), [data.skills, data.categories])

  const { skills: filteredSkills, fullMatchCount } = useMemo(
    () =>
      filterAndSortSkillsWithMeta({
        skills: data.skills,
        searchQuery,
        selectedCategory,
        sortBy,
        searchIndex,
      }),
    [data.skills, searchQuery, selectedCategory, sortBy, searchIndex],
  )

  useEffect(() => {
    if (!urlReady) return
    if (skipPageReset.current) {
      skipPageReset.current = false
      return
    }
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, sortBy, urlReady])

  useEffect(() => {
    if (!urlReady) return
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    if (currentPage > 1) params.set('page', String(currentPage))
    if (sortBy !== 'featured') params.set('sort', sortBy)
    const qs = params.toString()
    window.history.replaceState(null, '', `/skills/${qs ? `?${qs}` : ''}`)
  }, [searchQuery, selectedCategory, currentPage, sortBy, urlReady])

  const totalPages = Math.ceil(filteredSkills.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const paginatedSkills = paginateSkills(filteredSkills, currentPage, PAGE_SIZE)

  // why: only the relevance ordering groups full matches first, so the "related" divider is
  // meaningless (and would land in the wrong place) under an explicit name/recent sort.
  const grouped = searchQuery.trim() !== '' && sortBy === 'featured'
  const exactOnPage = grouped ? paginatedSkills.slice(0, Math.max(0, fullMatchCount - startIndex)) : paginatedSkills
  const relatedOnPage = grouped ? paginatedSkills.slice(exactOnPage.length) : []

  const renderCards = (items: typeof paginatedSkills) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((skill) => {
        const category = data.categories.find((c) => c.id === skill.category)
        return <SkillCard key={skill.id} skill={skill} categoryName={category?.name || skill.category} />
      })}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Browse Skills</h1>
        <p className="text-base text-gray-500 dark:text-gray-400 mt-2">
          Explore our collection of {data.stats.totalSkills} agent skills across {data.stats.totalCategories} categories
        </p>
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex-1">
          <SearchBar onSearch={setSearchQuery} initialValue={searchQuery} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[13px] text-gray-400 dark:text-gray-500 hidden sm:inline">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SkillSortOption)}
            className="px-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-[13px] text-gray-600 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
          >
            <option value="featured">{searchQuery.trim() ? 'Relevance' : 'Featured'}</option>
            <option value="name">Name</option>
            <option value="recent">Recent</option>
          </select>
        </div>
      </div>
      <div className="mb-7">
        <CategoryFilter
          categories={data.categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Results */}
      {filteredSkills.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
            {searchQuery.trim() ? `No skills match “${searchQuery.trim().replace(/^"|"$/g, '')}”` : 'No skills found'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Try fewer words, or search by category, skill name or id
          </p>
          {selectedCategory !== null && (
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="mt-4 px-3.5 py-1.5 rounded-full text-[13px] font-medium bg-blue-600 text-white cursor-pointer"
            >
              Search all categories
            </button>
          )}
        </div>
      ) : (
        <>
          {exactOnPage.length > 0 && renderCards(exactOnPage)}

          {relatedOnPage.length > 0 && (
            <>
              <div className="flex items-center gap-3 mt-8 mb-5">
                <span className="text-[13px] font-medium text-gray-500 dark:text-gray-400 shrink-0">
                  {fullMatchCount === 0 ? 'Closest matches' : 'Related skills'}
                </span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span className="text-[12px] text-gray-400 dark:text-gray-500 shrink-0">
                  matching some of your terms
                </span>
              </div>
              {renderCards(relatedOnPage)}
            </>
          )}

          <div className="mt-2">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            <p className="text-center text-[13px] text-gray-400 dark:text-gray-500 mt-3">
              Showing {startIndex + 1}–{Math.min(endIndex, filteredSkills.length)} of {filteredSkills.length} skills
            </p>
          </div>
        </>
      )}
    </div>
  )
}
