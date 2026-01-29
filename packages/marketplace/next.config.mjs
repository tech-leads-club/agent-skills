//@ts-check

import { composePlugins, withNx } from '@nx/next/index.js'

const isProd = process.env.NODE_ENV === 'production'

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  output: 'export',
  // Only use basePath in production for GitHub Pages
  basePath: isProd ? '/agent-skills' : '',
  // Required for GitHub Pages dynamic routes to work
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
