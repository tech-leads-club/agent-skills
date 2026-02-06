'use client'

import { useMemo, useState } from 'react'
import { CategoryFilter } from '../../components/CategoryFilter'
import { SearchBar } from '../../components/SearchBar'
import { SkillCard } from '../../components/SkillCard'
import type { MarketplaceData } from '../../types'

interface SkillsClientProps {
  data: MarketplaceData
}

export function SkillsClient({ data }: SkillsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredSkills = useMemo(() => {
    return data.skills.filter((skill) => {
      const matchesSearch =
        searchQuery === '' ||
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategory === null || skill.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [data.skills, searchQuery, selectedCategory])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">Browse Skills</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Explore our collection of {data.stats.totalSkills} agent skills across {data.stats.totalCategories} categories
        </p>
      </div>

      <div className="mb-6">
        <SearchBar onSearch={setSearchQuery} />
      </div>

      <div className="mb-8">
        <CategoryFilter
          categories={data.categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {filteredSkills.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No skills found matching your criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => {
            const category = data.categories.find((c) => c.id === skill.category)
            return <SkillCard key={skill.id} skill={skill} categoryName={category?.name || skill.category} />
          })}
        </div>
      )}

      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Showing {filteredSkills.length} of {data.stats.totalSkills} skills
      </div>
    </div>
  )
}
