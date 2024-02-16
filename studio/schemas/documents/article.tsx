import {GrArticle} from 'react-icons/gr'
import {schemeFilter, HierarchyInput} from 'sanity-plugin-taxonomy-manager'

export default {
  name: 'article',
  type: 'document',
  icon: GrArticle,
  title: 'Articles',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      title: 'Slug',
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
        slugify: (input: string) => input.toLowerCase().replace(/\s+/g, '-').slice(0, 200),
      },
    },
    {
      title: 'Date Published',
      name: 'pubDate',
      type: 'date',
    },
    {
      title: 'Hero Image',
      name: 'heroImage',
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
      name: 'insightType',
      title: 'Insight Type',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {
        filter: () => schemeFilter({schemeId: 'c88ca3'}),
        disableNew: true,
      },
      components: {field: HierarchyInput},
    },
    {
      name: 'topic',
      title: 'Topics',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'skosConcept'}],
          options: {
            filter: () => schemeFilter({schemeId: '0e0d68'}),
          },
          // components: { field: HierarchyInput }, // does not yet support arrays
        },
      ],
    },
    {
      name: 'shortDescription',
      type: 'text',
      title: 'Short Description',
      description: 'Used for related resources list item descriptions. Character count TBD.',
      rows: 3,
    },
    {
      name: 'description',
      type: 'text',
      title: 'Meta Description',
      description: 'Used for description meta tag. Up to 150 char, likely truncation @ 70',
      rows: 3,
    },
    {
      name: 'lede',
      title: 'Lede',
      type: 'array',
      description: 'Used for article teaser paragraph.',
      of: [{type: 'block'}],
    },
    {
      title: 'Body',
      name: 'bodyText',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'H5', value: 'h5'},
            {title: 'Quote', value: 'blockquote'},
          ],
        },
        {type: 'figure'},
        {
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
            {
              name: 'floatLeft',
              type: 'boolean',
              title: 'Float Left',
              initialValue: false,
              options: {
                layout: 'checkbox',
              },
            },
          ],
        },
        {
          name: 'pre',
          title: 'Pre',
          type: 'code',
        },
      ],
    },
    {
      name: 'canonical',
      title: 'Canonical URL',
      type: 'url',
      description: 'External site URL if article was first published elsewhere.'
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {
        filter: () => schemeFilter({schemeId: '415dcc'}),
      },
      components: {field: HierarchyInput},
      deprecated: {reason: 'No longer used in 2024 refresh'}
    },
    {
      name: 'banner',
      title: 'Banner',
      type: 'banner',
    },
    {
      name: 'cta',
      title: 'Call to Action',
      type: 'cta',
      deprecated: {reason: 'Article-specific CTAs are no longer used.'}
    },
  ],
}
