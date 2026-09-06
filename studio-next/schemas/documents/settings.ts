import {defineType, defineField} from 'sanity'
import {uniqueBandTypes, uniqueDocumentTypes} from '../validation'

export default defineType({
  name: 'settings',
  title: 'Site Settings',
  type: 'document',
  initialValue: {
    title: 'Settings',
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'siteTitle',
      title: 'Site Title',
      type: 'string',
    }),
    defineField({
      name: 'siteSubtitle',
      title: 'Site Subtitle',
      type: 'string',
    }),
    defineField({
      name: 'url',
      title: 'Site Base URL',
      type: 'url',
    }),
    defineField({
      name: 'description',
      title: 'Site Meta Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'authorName',
      title: 'Author Name',
      type: 'string',
    }),
    defineField({
      name: 'authorImage',
      title: 'Author Image',
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
      name: 'defaultBands',
      title: 'Default Bands',
      description:
        'Default bands provide global messaging and titles for repeated bands across the site.',
      type: 'array',
      of: [{type: 'bandRss'}, {type: 'bandWorkWithMe'}, {type: 'bandGetInTouch'}],
      validation: (rule) => rule.custom(uniqueBandTypes),
    }),
    defineField({
      name: 'bandOverrides',
      title: 'Page Type Band Overrides',
      type: 'array',
      description:
        'Customize bands for specific page types. These customizations supersede default bands, and are superseded by document level band customization',
      /* One entry per document type. Two entries naming the same type would make
         resolution depend on array order, which the editor cannot see. */
      validation: (rule) => rule.custom(uniqueDocumentTypes),
      of: [
        {
          name: 'bandOverride',
          title: 'Page Type Band Override',
          type: 'object',
          fields: [
            defineField({
              name: 'documentType',
              title: 'Document Type',
              type: 'string',
              validation: (rule) => rule.required(),
              options: {
                list: [
                  {title: 'Note', value: 'note'},
                  {title: 'Article', value: 'article'},
                  {title: 'Case Study', value: 'caseStudy'},
                ],
              },
            }),
            defineField({
              name: 'overrideBands',
              title: 'Page Type Bands',
              type: 'array',
              of: [{type: 'bandRss'}, {type: 'bandWorkWithMe'}, {type: 'bandGetInTouch'}],
              validation: (rule) => rule.custom(uniqueBandTypes),
            }),
          ],
          preview: {
            select: {
              title: 'documentType',
              bands: 'overrideBands',
            },
            prepare(selection) {
              const {title, bands} = selection
              /* `bands` is undefined until the editor adds one, and `.length` on that
                 throws rather than degrading — so an override row created but not yet
                 filled in would break its own preview in the Studio. */
              const count = bands?.length ?? 0
              // expand this in the future to list the individual band types as a subtitle.
              return {
                title: `${title} band`,
                subtitle: count === 1 ? '1 override' : `${count} overrides`,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'homeLogos',
      title: 'Home Page Client Logos',
      description:
        'These are the client logos that are displayed alongside the services overview on the home page.',
      type: 'array',
      deprecated: {
        reason:
          'The bare client logos array will no longer be used in the 2026 redesign. See the Work With Me band instead.',
      },
      of: [
        {
          type: 'reference',
          to: [{type: 'client'}],
        },
      ],
    }),
    defineField({
      name: 'reviews',
      title: 'Home PageReview Block Entries',
      description: 'These are the reviews that are displayed on the home page.',
      type: 'array',
      deprecated: {reason: 'Home page review blocks are no longer be used in the 2026 redesign.'},
      of: [{type: 'reference', to: [{type: 'review'}]}],
    }),
    defineField({
      name: 'insightsBanner',
      title: 'Insights Banner',
      description: 'Used above the Insights section on the home page',
      type: 'image',
      deprecated: {reason: 'The banner will no longer be used in the 2026 redesign.'},
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
    }),
    defineField({
      name: 'clientWorkBanner',
      title: 'Client Work Banner',
      description: 'Used above the Client Work section on the home page',
      type: 'image',
      deprecated: {reason: 'Client work banner will no longer be used in the 2026 redesign.'},
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
    }),
    defineField({
      name: 'featuredClients',
      title: 'Featured Clients',
      description: 'Used to populate "Featured Client Work" links on the home page.',
      type: 'array',
      deprecated: {
        reason: 'The featured clients array will no longer be used in the 2026 redesign.',
      },
      of: [
        {
          type: 'reference',
          to: [{type: 'caseStudy'}],
        },
      ],
    }),
  ],
})
