import {GrDocumentText} from 'react-icons/gr'
import {BODY_STYLES, PLAIN_STYLES, MARKS} from '../portableText'
import {defineType, defineField} from 'sanity'
import {uniqueBandTypes} from '../validation'
import {slugField} from '../slug'

export default defineType({
  name: 'page',
  type: 'document',
  icon: GrDocumentText,
  title: 'Generic Pages',
  fields: [
    defineField({
      name: 'title',
      title: 'Page Title',
      type: 'string',
    }),
    slugField(),
    defineField({
      name: 'lede',
      title: 'Page Lede Copy',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: PLAIN_STYLES,
          lists: [],
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
      title: 'Page Hero Image',
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
        {type: 'figure'},
      ],
    }),
    defineField({
      name: 'pageBands',
      title: 'Page Bands',
      type: 'array',
      description: 'Select to include available bands on this page.',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Work With Me', value: 'bandWorkWithMe'},
          {title: 'Get In Touch', value: 'bandGetInTouch'},
        ],
      },
    }),
    defineField({
      name: 'customBands',
      title: 'Custom Bands',
      description:
        'Custom bands provide category-specific overrides for default bands defined in Settings.',
      type: 'array',
      of: [{type: 'bandWorkWithMe'}, {type: 'bandGetInTouch'}],
      validation: (rule) => rule.custom(uniqueBandTypes),
    }),
  ],
})
