import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

import { colors } from '../theme'

interface SearchInputProps {
  query: string
  onChange: (query: string) => void
  total: number
  filtered: number
  isLoading?: boolean
  focus?: boolean
}

export const SearchInput = ({
  query,
  onChange,
  total,
  filtered,
  isLoading = false,
  focus = true,
}: SearchInputProps) => {
  return (
    <Box borderStyle="round" borderColor={focus ? colors.accent : colors.border} paddingX={1}>
      <Box marginRight={1}>
        <Text>🔍</Text>
      </Box>
      <Box flexGrow={1}>
        <TextInput value={query} onChange={onChange} placeholder="Type to filter skills..." focus={focus} />
      </Box>
      <Box marginLeft={1}>
        <Text color={colors.textDim}>{isLoading ? 'Loading...' : `${filtered}/${total} skills`}</Text>
      </Box>
    </Box>
  )
}
