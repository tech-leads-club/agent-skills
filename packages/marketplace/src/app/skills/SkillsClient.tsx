'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { CategoryFilter } from '../../components/CategoryFilter'
import { Pagination } from '../../components/Pagination'
import { SearchBar } from '../../components/SearchBar'
import { SkillCard } from '../../components/SkillCard'
import type { MarketplaceData } from '../../types'

interface SkillsClientProps {
  data: MarketplaceData
}

const PAGE_SIZE = 12
const FEATURED_SKILL_ID = 'tlc-spec-driven'

type SortOption = 'featured' | 'name' | 'recent'

export function SkillsClient({ data }: SkillsClientProps) {
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') ?? '')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category') ?? null)
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1)
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'featured')

  const filteredSkills = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    let result = data.skills.filter((skill) => {
      const matchesSearch =
        normalizedQuery === '' ||
        skill.name.toLowerCase().includes(normalizedQuery) ||
        skill.description.toLowerCase().includes(normalizedQuery)

      const matchesCategory = selectedCategory === null || skill.category === selectedCategory

      return matchesSearch && matchesCategory
    })

    if (sortBy === 'featured') {
      result = [...result].sort((a, b) => {
        if (a.id === FEATURED_SKILL_ID) return -1
        if (b.id === FEATURED_SKILL_ID) return 1
        return a.name.localeCompare(b.name)
      })
    } else if (sortBy === 'recent') {
      result = [...result].sort((a, b) => b.metadata.lastModified.localeCompare(a.metadata.lastModified))
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [data.skills, searchQuery, selectedCategory, sortBy])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, sortBy])

  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    if (currentPage > 1) params.set('page', String(currentPage))
    if (sortBy !== 'featured') params.set('sort', sortBy)
    const qs = params.toString()
    window.history.replaceState(null, '', `/skills/${qs ? `?${qs}` : ''}`)
  }, [searchQuery, selectedCategory, currentPage, sortBy])

  const totalPages = Math.ceil(filteredSkills.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const endIndex = startIndex + PAGE_SIZE
  const paginatedSkills = filteredSkills.slice(startIndex, endIndex)

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
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-[13px] text-gray-600 dark:text-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
          >
            <option value="featured">Featured</option>
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
          <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">No skills found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedSkills.map((skill) => {
              const category = data.categories.find((c) => c.id === skill.category)
              return <SkillCard key={skill.id} skill={skill} categoryName={category?.name || skill.category} />
            })}
          </div>

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
