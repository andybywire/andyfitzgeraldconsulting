import {defineType, defineField} from 'sanity'

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
      name: 'homeLogos',
      title: 'Home Page Client Logos',
      description:
        'These are the client logos that are displayed alongside the services overview on the home page.',
      type: 'array',
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
      of: [{type: 'reference', to: [{type: 'review'}]}],
    }),
    defineField({
      name: 'insightsBanner',
      title: 'Insights Banner',
      description: 'Used above the Insights section on the home page',
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
    }),
    defineField({
      name: 'clientWorkBanner',
      title: 'Client Work Banner',
      description: 'Used above the Client Work section on the home page',
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
    }),
    defineField({
      name: 'featuredClients',
      title: 'Featured Clients',
      description: 'Used to populate "Featured Client Work" links on the home page.',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'caseStudy'}],
        },
      ],
    }),
  ],
})
