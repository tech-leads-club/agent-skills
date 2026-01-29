import { SkillsClient } from './SkillsClient';
import marketplaceData from '../../data/skills.json';

export default function SkillsPage() {
  return <SkillsClient data={marketplaceData} />;
}
