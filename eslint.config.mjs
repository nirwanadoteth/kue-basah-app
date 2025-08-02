import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
})

const eslintConfig = [
  ...compat.config({
    extends: [
      'next/core-web-vitals',
      'next/typescript',
      'plugin:tailwindcss/recommended',
      'plugin:prettier/recommended',
    ],
    rules: {
      'tailwindcss/no-custom-classname': 'off',
    },
  }),
]

export default eslintConfig
