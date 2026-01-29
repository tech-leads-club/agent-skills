import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import type { Skill, Category, MarketplaceData } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKSPACE_ROOT = path.resolve(__dirname, '../../..');
const SKILLS_DIR = path.join(WORKSPACE_ROOT, 'skills');
const CATEGORIES_FILE = path.join(SKILLS_DIR, 'categories.json');
const OUTPUT_FILE = path.join(__dirname, '../src/data/skills.json');

function getAllSkillDirectories(): string[] {
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

function parseSkill(skillId: string): Skill | null {
  const skillDir = path.join(SKILLS_DIR, skillId);
  const skillFile = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(skillFile)) {
    console.warn(`SKILL.md not found for ${skillId}`);
    return null;
  }

  const fileContent = fs.readFileSync(skillFile, 'utf-8');
  const { data, content } = matter(fileContent);

  // Check for scripts and references
  const scriptsDir = path.join(skillDir, 'scripts');
  const referencesDir = path.join(skillDir, 'references');
  
  const hasScripts = fs.existsSync(scriptsDir) && 
    fs.readdirSync(scriptsDir).length > 0;
  
  const hasReferences = fs.existsSync(referencesDir) && 
    fs.readdirSync(referencesDir).length > 0;

  const referenceFiles = hasReferences
    ? fs.readdirSync(referencesDir).filter(f => f.endsWith('.md'))
    : [];

  const stats = fs.statSync(skillFile);
  const lastModified = stats.mtime.toISOString().split('T')[0];

  // Get category from categories.json
  const categoriesData = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'));
  const category = categoriesData.skills[skillId] || 'uncategorized';

  return {
    id: skillId,
    name: data.name || skillId,
    description: data.description || '',
    category,
    path: `skills/${skillId}/SKILL.md`,
    content: content.trim(),
    metadata: {
      hasScripts,
      hasReferences,
      referenceFiles,
      lastModified,
    },
  };
}

function generateMarketplaceData(): MarketplaceData {
  const skillDirs = getAllSkillDirectories();
  const skills: Skill[] = [];

  for (const skillId of skillDirs) {
    const skill = parseSkill(skillId);
    if (skill) {
      skills.push(skill);
    }
  }

  // Load categories
  const categoriesData = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'));
  const categories: Category[] = categoriesData.categories;

  // Sort skills by name
  skills.sort((a, b) => a.name.localeCompare(b.name));

  // Sort categories by priority
  categories.sort((a, b) => (a.priority || 999) - (b.priority || 999));

  return {
    skills,
    categories,
    stats: {
      totalSkills: skills.length,
      totalCategories: categories.length,
    },
  };
}

function main() {
  console.log('Generating marketplace data...');
  
  const data = generateMarketplaceData();
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write JSON file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  
  console.log(`✓ Generated data for ${data.stats.totalSkills} skills`);
  console.log(`✓ Output: ${OUTPUT_FILE}`);
}

main();
