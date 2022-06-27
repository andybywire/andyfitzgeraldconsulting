import S from '@sanity/desk-tool/structure-builder'
import {RiSettings4Line} from 'react-icons/ri'

const hiddenDocTypes = (listItem) =>
!['media.tag', 'settings', 'skosConcept', 'skosConceptScheme'].includes(
  listItem.getId()
)

export default () =>
  S.list()
    .title('Content')
    .items([
      ...S.documentTypeListItems().filter(hiddenDocTypes),
      S.divider(),
      S.listItem().title("Settings").icon(RiSettings4Line)
        .child(
          S.document().schemaType('settings').documentId('settings')
        ),
      S.documentTypeListItem('skosConceptScheme').title('Taxonomy Schemes'),
      S.documentTypeListItem('skosConcept').title('Concepts')
    ])