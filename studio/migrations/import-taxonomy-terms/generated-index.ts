import {defineMigration, patch, at, setIfMissing} from 'sanity/migrate'

/**
 * this migration will set `Default title` on all documents that are missing a title
 * and make `true` the default value for the `enabled` field
 */
export default defineMigration({
  title: 'import taxonomy terms',
  documentTypes: ["skosConceptScheme", "skosConcept"],

  async *migrate(documents, context) {
    for await (const document of documents()) {
      yield patch(document._id, [
        at('title', setIfMissing('Default title')),
        at('enabled', setIfMissing(true)),
      ])
    }
  }
})



