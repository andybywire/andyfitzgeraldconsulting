import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {taxonomyManager} from 'sanity-plugin-taxonomy-manager'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'
import {codeInput} from '@sanity/code-input'
import {RiSettings4Line} from 'react-icons/ri'

/**
 * Carried over verbatim from studio/ so the starting point is the current model, not a redesign.
 * `service` and `collection` are in this list despite having no schema file — they are orphan
 * types with live documents (4 and 2), and hiding them is how that has been managed. Whether they
 * are adopted or retired is a phase 1 decision, not something to change while copying.
 */
const hiddenDocTypes = (listItem: any) =>
  !['media.tag', 'settings', 'skosConcept', 'skosConceptScheme', 'service', 'collection'].includes(
    listItem.getId(),
  )

export default defineConfig({
  name: 'default',
  // Titled for the dataset, not the business: two studios against two datasets is how you edit
  // the wrong one. studio/ stays "AF Consulting" on `production`.
  title: 'AF Consulting — 2026 build',

  projectId: '7v0qvet6',
  dataset: 'production-26',

  mediaLibrary: {
    enabled: true,
    libraryId: 'mlqhNxrAcmMg',

  },
  auth: {
    loginMethod: 'token',
  },

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
    types: schemaTypes,
  },
  document: {
    comments: {
      enabled: false,
    },
  },
  tasks: {enabled: false},
  releases: {enabled: false},
})
