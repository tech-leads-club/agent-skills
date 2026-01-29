export interface SkillMetadata {
  hasScripts: boolean;
  hasReferences: boolean;
  referenceFiles: string[];
  lastModified: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  path: string;
  content: string;
  metadata: SkillMetadata;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  priority?: number;
}

export interface MarketplaceData {
  skills: Skill[];
  categories: Category[];
  stats: {
    totalSkills: number;
    totalCategories: number;
  };
}
