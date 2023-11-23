import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {taxonomyManager} from 'sanity-plugin-taxonomy-manager'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'
import {codeInput} from '@sanity/code-input'

export default defineConfig({
  name: 'default',
  title: 'AF Consulting',

  projectId: '7v0qvet6',
  dataset: 'production',

  plugins: [
    deskTool(),
    taxonomyManager({
      baseUri: 'https://andyfitzgeraldconsulting.com/',
    }),
    visionTool(),
    codeInput(),
  ],

  schema: {
    types: schemaTypes,
  },
})
