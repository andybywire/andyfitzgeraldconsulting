import {GrDocumentText} from 'react-icons/gr'
import {BODY_STYLES, PLAIN_STYLES, MARKS} from '../portableText'
import {defineType, defineField, type ObjectItem} from 'sanity'
import {slugField} from '../slug'

export default defineType({
  name: 'singleton',
  type: 'document',
  icon: GrDocumentText,
  title: 'Singleton Pages',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
    }),
    slugField(),
    defineField({
      name: 'heroCopy',
      title: 'Singleton Page Hero Copy',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: PLAIN_STYLES,
          lists: [],
          /* Keeps its OWN narrower decorator set rather than the shared MARKS —
             strong and em only, no code and no strike. This field is a single
             sentence of intro prose, not a document, so the shared set would be
             offering tools with nowhere to be used. Deliberately not consolidated. */
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'heroImg',
      title: 'Singleton Page Hero Image',
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
      title: 'Body',
      name: 'bodyText',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: BODY_STYLES,
          marks: MARKS,
        },
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
            {
              name: 'altText',
              type: 'string',
              title: 'Alt Text',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'bands',
      title: 'Custom Bands',
      description:
        'Custom bands provide category-specific overrides for default bands defined in Settings.',
      type: 'array',
      of: [{type: 'bandRss'}, {type: 'bandWorkWithMe'}, {type: 'bandGetInTouch'}],
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
})
