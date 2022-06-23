import S from '@sanity/desk-tool/structure-builder'
// import { MdSettings } from "react-icons/md";
// import { MdPerson } from "react-icons/md";

const hiddenDocTypes = (listItem) =>
!['media.tag', 'skosConcept', 'skosConceptScheme'].includes(
  listItem.getId()
)

export default () =>
  S.list()
    .title('Content')
    .items([
      ...S.documentTypeListItems().filter(hiddenDocTypes),
      S.divider(),
      S.documentTypeListItem("skosConceptScheme").title("Taxonomy Schemes"),
      S.documentTypeListItem("skosConcept").title("Concepts"),
      // S.divider(),
      // S.listItem()
      //   .title('Settings')
      //   .icon(RiSettings4Line)
      //   .child(
      //     S.document()
      //       .schemaType('siteSettings')
      //       .documentId('siteSettings')
      //   )
    ])