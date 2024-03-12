import {GrDocumentText} from 'react-icons/gr'

export default {
  name: 'singleton',
  type: 'document',
  icon: GrDocumentText,
  title: 'Singleton Pages',
  fields: [
    {
      name: 'title',
      title: 'Page Title',
      type: 'string',
    },
    {
      title: 'Slug',
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 200, // will be ignored if slugify is set
        slugify: (input: string) => input
                             .toLowerCase()
                             .replace(/\s+/g, '-')
                             .slice(0, 200)
      }
    },
    {
      name: 'heroCopy',
      title: 'Singleton Page Hero Copy',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          lists: [],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
            ],
          },
        },
      ],
    },
    {
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
    },
    {
      name: 'banner',
      title: 'Banner',
      type: 'banner',
      options: {
        collapsible: true,
        collapsed: false,
      },
    },
    {
      title: 'Body',
      name: 'bodyText',
      type: 'array',
      of: [
        {type: 'block'},
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
    },
    {
      name: 'servicesBlockTitle',
      title: 'Services Block Title',
      type: 'string',
      description: 'For home page only',
      deprecated: {reason: 'moved to block for 2024 refresh'},
    },
    {
      name: 'servicesBlockCopy',
      title: 'Services Block Copy',
      description: 'For home page only',
      type: 'text',
      rows: 3,
      deprecated: {reason: 'moved to block for 2024 refresh'},
    },
    {
      name: 'reviewBlockTitle',
      title: 'Review Block Title',
      type: 'string',
      description: 'For home page only',
      deprecated: {reason: 'moved to block for 2024 refresh'},
    },
    {
      name: 'reviewBlockCopy',
      title: 'Review Block Copy',
      description: 'For home page only',
      type: 'text',
      rows: 3,
      deprecated: {reason: 'moved to block for 2024 refresh'},
    },
    {
      name: 'review',
      title: 'Review Block Entries',
      description: 'For home page only. Use 3 references.',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'review'}]}],
      deprecated: {reason: 'moved to block for 2024 refresh'},
    },
    {
      name: 'clientBlockTitle',
      title: 'Client Grid Block Title',
      type: 'string',
      description: 'For home page only',
      deprecated: {reason: 'moved to block for 2024 refresh'},
    },
    {
      name: 'clientBlockCopy',
      title: 'Client Grid Block Copy',
      description: 'For home page only',
      type: 'text',
      rows: 3,
      deprecated: {reason: 'moved to block for 2024 refresh'},
    },
    {
      name: 'cta',
      type: 'text',
      title: 'Call to Action',
      description: '60 - 100 char',
      rows: 2,
      deprecated: {reason: 'moved to block for 2024 refresh'},
    },
  ],
}
