import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {taxonomyManager} from 'sanity-plugin-taxonomy-manager'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'
import {codeInput} from '@sanity/code-input'
import {RiSettings4Line} from 'react-icons/ri'

const hiddenDocTypes = (listItem: any) =>
  !['media.tag','settings','skosConcept','skosConceptScheme','service','collection'].includes(listItem.getId())

export default defineConfig({
  name: 'default',
  title: 'AF Consulting',

  projectId: '7v0qvet6',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) => {
        return S.list()
          .title('Content')
          .items([
            ...S.documentTypeListItems().filter(hiddenDocTypes),
            S.divider(),
            S.listItem()
            .title('Settings')
            .icon(RiSettings4Line)
            .child(S.document().schemaType('settings').documentId('settings')),
            S.divider(),
            S.documentTypeListItem('skosConceptScheme').title('Taxonomy Schemes'),
            S.documentTypeListItem('skosConcept').title('Concepts'),
          ])
      },
    }),
    taxonomyManager({
      baseUri: 'https://andyfitzgeraldconsulting.com/',
    }),
    visionTool(),
    codeInput(),
  ],
  schema: {
    // @ts-expect-error — schema type deprecated does include a reason; this error appears over-ambitious
    types: schemaTypes,
  },
  document: {
    comments: {
      enabled: false,
    },
  },
  tasks: { enabled: false },
  scheduledPublishing: { enabled: false },
})
