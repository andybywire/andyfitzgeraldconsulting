import {GrNote} from 'react-icons/gr'
import {
  schemeFilter,
  ReferenceHierarchyInput,
  ArrayHierarchyInput,
} from 'sanity-plugin-taxonomy-manager'
import {defineType, defineField} from 'sanity'
import {uniqueBandTypes} from '../validation'
import {BODY_STYLES, MARKS} from '../portableText'
import {slugField} from '../slug'

export default defineType({
  name: 'note',
  type: 'document',
  icon: GrNote,
  title: 'Notes',
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
            /*
             * The color beside the cover on a link-preview card. A cover is padded into
             * the card's frame rather than cropped to it (see `fit` in
             * web/src/sanity/image.ts), and this picks what fills the padding.
             *
             * It stores a SWATCH NAME, not a color (Andy, 2026-10-22). The values are
             * the keys of Sanity's own `metadata.palette`, so they keep its spelling, and
             * the query resolves a name against whichever asset is current. Replace the
             * cover and the choice re-derives its color from the new one; a stored hex
             * would go on describing the old image. Hotspot is the precedent: an
             * editor's presentation choice, kept on the image it applies to.
             *
             * Unset means neutral gray, the fallback for a swatch the palette lacks too.
             * `vibrant` is not offered: it was the same color as `dominant` on three of
             * the four covers when this was built.
             */
            {
              name: 'cardBackground',
              type: 'string',
              title: 'Share card background',
              description:
                'The color beside the cover when a link to this note is shared. Leave unset for neutral gray.',
              options: {
                list: [
                  {title: 'Dominant', value: 'dominant'},
                  {title: 'Dark muted', value: 'darkMuted'},
                  {title: 'Light muted', value: 'lightMuted'},
                  {title: 'Neutral gray', value: 'neutral'},
                ],
                layout: 'radio',
              },
              hidden: ({parent}) => !parent?.asset,
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
      name: 'customBands',
      title: 'Custom Bands',
      description:
        'Custom bands provide category-specific overrides for default bands defined in Settings.',
      type: 'array',
      of: [{type: 'bandRss'}],
      validation: (rule) => rule.custom(uniqueBandTypes),
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
