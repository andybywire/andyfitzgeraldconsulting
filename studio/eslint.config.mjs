import studio from '@sanity/eslint-config-studio'
import globals from 'globals'

export default [
  {ignores: ['dist', 'backups', '.sanity']},
  ...studio,
  {
    files: ['migrations/**/*.{js,mjs,cjs}'],
    languageOptions: {globals: globals.node},
  },
]
