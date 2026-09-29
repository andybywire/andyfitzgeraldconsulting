import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {presentationTool} from 'sanity/presentation'
import {taxonomyManager} from 'sanity-plugin-taxonomy-manager'
import {mermaidContentModel} from 'sanity-plugin-mermaid-content-model'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemas'
import {codeInput} from '@sanity/code-input'
import {RiSettings4Line} from 'react-icons/ri'

/**
 * Carried over verbatim from studio/ so the starting point is the current model, not a redesign.
 * `service` and `collection` are in this list despite having no schema file — they are orphan
 * types with live documents (4 and 2), and hiding them is how that has been managed. Whether they
 * are adopted or retired is a phase 1 decision, not something to change while copying.
 *
 * ── `sanity.videoAsset` IS SANITY'S BUG, NOT OURS (found 2026-09-15) ────────────────────
 *
 * It surfaced as a "Video" folder at the top of the Content list, above Note, with no schema
 * file behind it and nothing in this repo naming it. `sanity.videoAsset` is a BUILT-IN type
 * carrying `title: 'Video'`, and it reaches the list because of an allowlist in the structure
 * tool that was never extended:
 *
 *   const BUNDLED_DOC_TYPES = ['sanity.imageAsset', 'sanity.fileAsset']
 *
 * `isBundledDocType()` is what keeps the other two asset types out of `documentTypeListItems()`,
 * and the video asset type is simply missing from it. Read out of sanity 6.9.2's own bundle
 * rather than inferred from behaviour.
 *
 * It is registered by `mediaLibrary` below and by nothing else — measured by toggling
 * `enabled` and re-running `sanity schemas extract`: off, the type is absent from schema.json
 * entirely; on, it is there. So turning Media Library off would also remove the folder, which
 * is not a trade worth making.
 *
 * So this entry is a WORKAROUND with an expiry: if a later sanity release adds the type to
 * BUNDLED_DOC_TYPES, this line becomes dead but harmless. Don't read it as a decision that
 * video assets should be hidden — they are hidden for exactly the reason images and files are,
 * which is that a raw asset list is not content.
 */
const hiddenDocTypes = (listItem: any) =>
  ![
    'media.tag',
    'sanity.videoAsset',
    'settings',
    'skosConcept',
    'skosConceptScheme',
    'service',
    'collection',
  ].includes(listItem.getId())

/**
 * ── WHERE PRESENTATION POINTS: DECIDED BY WHERE THE STUDIO IS RUNNING ─────────────────────
 *
 * The deployed Studio previews the SSR preview host; `sanity dev` on this laptop previews
 * `pnpm --filter web dev:preview` on :4321, so the whole round trip can be exercised before any
 * of it reaches the droplet.
 *
 * `initial` accepts a function of the Studio's own `location.origin`, and that is used instead of
 * the conventional `SANITY_STUDIO_PREVIEW_URL` plus a committed `.env.development`: one place
 * rather than two, nothing to forget to set, and no way for a deployed Studio to end up pointing
 * at localhost — the failure an env var that leaked into `sanity deploy` would produce.
 *
 * NO `previewMode`. That option names a route which switches the front end into draft mode per
 * visitor (a cookie), and this site has no such route by design: the preview host is a separate
 * BUILD that always reads drafts (see web/src/sanity/load-query.ts). So the perspective switcher
 * Presentation shows does not change what the preview renders — it is drafts either way.
 *
 * No `allowOrigins` either: it defaults to the origin of `initial`, which is the only one used.
 */
const PREVIEW_HOST = 'https://preview.andyfitzgeraldconsulting.com'
const LOCAL_PREVIEW = 'http://localhost:4321'

const previewUrlFor = (studioOrigin: string) =>
  new URL(studioOrigin).hostname === 'localhost' ? LOCAL_PREVIEW : PREVIEW_HOST

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
    presentationTool({
      previewUrl: {
        initial: ({origin}) => previewUrlFor(origin),
      },
    }),
    taxonomyManager({
      baseUri: 'https://andyfitzgeraldconsulting.com/',
    }),
    visionTool(),
    codeInput(),
    mermaidContentModel(),
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
