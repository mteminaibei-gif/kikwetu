import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override / extend default ignores from eslint-config-next
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'out/**',
    'build/**',
    'coverage/**',
    'public/**',
  ]),
])

export default eslintConfig
