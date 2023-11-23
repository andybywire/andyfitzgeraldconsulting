import {GrArticle} from 'react-icons/gr'
import {schemeFilter} from 'sanity-plugin-taxonomy-manager'

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
      name: 'banner',
      title: 'Banner',
      type: 'banner',
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {
        filter: () => schemeFilter({schemeId: '415dcc'}),
      },
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
        },
      ],
    },
    {
      name: 'shortDescription',
      type: 'text',
      title: 'Short Description',
      description: 'approx. 125 char',
      rows: 3,
    },
    {
      name: 'description',
      type: 'text',
      title: 'Description',
      description: 'up to 150 char, likely truncation @ 70',
      rows: 3,
    },
    {
      name: 'lede',
      title: 'Lede',
      type: 'array',
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
      name: 'cta',
      title: 'Call to Action',
      type: 'cta',
    },
    {
      name: 'canonical',
      title: 'Canonical URL',
      type: 'url',
    },
  ],
}
