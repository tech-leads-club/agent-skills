import { agents, getAgentConfig, getAllAgentTypes } from '../agents'

describe('agents', () => {
  describe('agents configuration', () => {
    it('should have all required agent types defined', () => {
      const expectedAgents = [
        'cursor',
        'claude-code',
        'github-copilot',
        'antigravity',
        'windsurf',
        'cline',
        'aider',
        'codex',
        'gemini',
        'roo',
        'kilocode',
        'amazon-q',
        'augment',
        'tabnine',
        'opencode',
        'sourcegraph',
        'droid',
      ]

      for (const agentName of expectedAgents) {
        expect(agents[agentName as keyof typeof agents]).toBeDefined()
      }
    })

    it('should have valid config structure for each agent', () => {
      for (const [name, config] of Object.entries(agents)) {
        expect(config.name).toBe(name)
        expect(config.displayName).toBeTruthy()
        expect(config.description).toBeTruthy()
        expect(config.skillsDir).toBeTruthy()
        expect(config.globalSkillsDir).toBeTruthy()
        expect(typeof config.detectInstalled).toBe('function')
      }
    })

    it('should have skillsDir starting with a dot', () => {
      for (const [, config] of Object.entries(agents)) {
        expect(config.skillsDir.startsWith('.')).toBe(true)
      }
    })
  })

  describe('getAgentConfig', () => {
    it('should return correct config for cursor', () => {
      const config = getAgentConfig('cursor')
      expect(config.name).toBe('cursor')
      expect(config.displayName).toBe('Cursor')
      expect(config.skillsDir).toBe('.cursor/skills')
    })

    it('should return correct config for antigravity', () => {
      const config = getAgentConfig('antigravity')
      expect(config.name).toBe('antigravity')
      expect(config.displayName).toBe('Antigravity')
      expect(config.skillsDir).toBe('.agent/skills')
    })
  })

  describe('getAllAgentTypes', () => {
    it('should return all agent types sorted alphabetically by display name', () => {
      const types = getAllAgentTypes()
      expect(types.length).toBeGreaterThan(0)

      const displayNames = types.map((t) => agents[t].displayName)
      const sortedDisplayNames = [...displayNames].sort((a, b) => a.localeCompare(b))
      expect(displayNames).toEqual(sortedDisplayNames)
    })
  })
})
