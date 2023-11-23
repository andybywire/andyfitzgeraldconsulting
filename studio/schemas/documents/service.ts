import {MdOutlineDesignServices} from 'react-icons/md'
import {schemeFilter, HierarchyInput} from 'sanity-plugin-taxonomy-manager'

export default {
  name: 'service',
  type: 'document',
  title: 'Services',
  icon: MdOutlineDesignServices,
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
      components: {field: HierarchyInput},
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
      name: 'mediumDescription',
      type: 'text',
      title: 'Medium Description',
      description: 'approx. 250 char',
      rows: 5,
    },
    {
      title: 'Service Overview',
      name: 'serviceOverview',
      type: 'array',
      of: [{type: 'block'}],
    },
    {
      title: 'Body',
      name: 'bodyText',
      type: 'array',
      of: [{type: 'block'}],
    },
    {
      name: 'cta',
      title: 'Call to Action',
      type: 'cta',
    },
  ],
}
