import marketplaceData from '../../data/skills.json'
import { SkillsClient } from './SkillsClient'

export default function SkillsPage() {
  return <SkillsClient data={marketplaceData} />
}
