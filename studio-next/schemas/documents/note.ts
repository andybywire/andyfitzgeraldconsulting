import {GrNote} from 'react-icons/gr'
import {
  schemeFilter,
  ReferenceHierarchyInput,
  ArrayHierarchyInput,
} from 'sanity-plugin-taxonomy-manager'
import {defineType, defineField, type ObjectItem} from 'sanity'
import {BODY_STYLES, MARKS} from '../portableText'
import {slugField} from '../slug'

export default defineType({
  name: 'note',
  type: 'document',
  icon: GrNote,
  title: 'Note',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
    }),
    slugField(),
    defineField({
      name: 'shortDescription',
      type: 'text',
      title: 'Short Description',
      description: 'User for card and social media preview blocks.',
      rows: 3,
    }),
    defineField({
      title: 'Date Published',
      name: 'pubDate',
      type: 'date',
    }),
    defineField({
      name: 'genre',
      title: 'Genre',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {
        filter: schemeFilter({schemeId: 'sjEhF9', expanded: true}),
        disableNew: true,
      },
      initialValue: {
        _ref: '6b925f38-273c-40c3-929a-a4c153e9be3b',
      },
      components: {field: ReferenceHierarchyInput},
    }),
    defineField({
      name: 'topic',
      title: 'Topics',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'skosConcept'}],
          options: {
            filter: schemeFilter({schemeId: '2e73674', expanded: true}),
            disableNew: true,
          },
        },
      ],
      components: {field: ArrayHierarchyInput},
    }),
    defineField({
      title: 'Body',
      name: 'bodyText',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: BODY_STYLES,
          marks: MARKS,
        },
        {type: 'figure'},
      ],
    }),
    defineField({
      name: 'clipRef',
      title: 'Web Clip Reference',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'clipUrl',
          title: 'URL',
          type: 'url',
        }),
        defineField({
          name: 'publisher',
          title: 'Clip Publisher',
          type: 'string',
          description: 'The top level domain of the web clip, displayed to users.',
        }),
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
        }),
        defineField({
          name: 'img',
          title: 'Image',
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'altText',
              type: 'string',
              title: 'Alt Text',
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'bookRef',
      title: 'Book Reference',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        defineField({
          name: 'bookUrl',
          title: 'URL',
          type: 'url',
          description:
            'A URL pointing to an external description and reviews of the book. Ideally GoodReads.',
        }),
        defineField({
          name: 'title',
          title: 'Title',
          type: 'string',
        }),
        defineField({
          name: 'author',
          title: 'Author',
          type: 'string',
        }),
        defineField({
          name: 'img',
          title: 'Image',
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'altText',
              type: 'string',
              title: 'Alt Text',
            },
          ],
        }),
        defineField({
          name: 'publisher',
          title: 'Book Publisher',
          type: 'string',
        }),
        defineField({
          name: 'pubDate',
          title: 'Publication Date',
          type: 'date',
        }),
      ],
    }),
    defineField({
      name: 'bands',
      title: 'Custom Bands',
      description:
        'Custom bands provide category-specific overrides for default bands defined in Settings.',
      type: 'array',
      of: [{type: 'bandRss'}],
      validation: (rule) =>
        rule.custom((items: ObjectItem[] | undefined) => {
          if (!items) return true

          const typesToCheck = ['bandRss', 'bandWorkWithMe', 'bandGetInTouch']
          const invalidPaths: {_key: string}[][] = []

          for (const typeName of typesToCheck) {
            const matches = items.filter((item) => item._type === typeName && item._key)
            if (matches.length > 1) {
              matches.forEach((item) => {
                invalidPaths.push([{_key: item._key}])
              })
            }
          }

          if (invalidPaths.length > 0) {
            return {
              paths: invalidPaths,
              message: 'Each type may only appear once in this array',
            }
          }

          return true
        }),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      icon: 'icon',
      clipImg: 'clipRef.img',
      bookImg: 'bookRef.img',
    },
    prepare(selection) {
      const {title, icon, clipImg, bookImg} = selection
      return {
        title: title,
        subtitle: clipImg ? 'Web Clipping' : bookImg ? 'Book Note' : 'Note',
        media: clipImg ? clipImg : bookImg ? bookImg : icon,
      }
    },
  },
})
