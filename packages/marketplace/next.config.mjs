//@ts-check

import { composePlugins, withNx } from '@nx/next/index.js'

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  
}

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
]

export default composePlugins(...plugins)(nextConfig)
