export default {
    name: 'settings',
    title: 'Site Settings',
    type: 'document',
    initialValue: {
      title: 'Settings'
    },
    fields: [
      {
        name: 'title',
        title: 'Title',
        type: 'string',
        hidden: true
      },
      {
        name: 'siteTitle',
        title: 'Site Title',
        type: 'string'
      },
      {
        name: 'siteSubtitle',
        title: 'Site Subtitle',
        type: 'string'
      },
      {
        name: 'url',
        title: 'Site Base URL',
        type: 'url'
      },
      {
        name: 'description',
        title: 'Site Meta Description',
        type: 'text',
        rows: 3
      },
      {
        name: 'homeLogos',
        title: 'Home Page Client Logos',
        description: 'These are the client logos that are displayed alongside the services overview on the home page.',
        type: 'array',
        of: [
          {
            type: 'reference',
            to: [
              {type: 'client'}
            ]
          }
        ]
      },
      {
        name: 'reviews',
        title: 'Home PageReview Block Entries',
        description: 'These are the reviews that are displayed on the home page.',
        type: 'array',
        of: [{type: 'reference', to: [{type: 'review'}]}],
      },
      {
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
            title: 'Caption'
          },
          {
            name: 'altText',
            type: 'string',
            title: 'Alt Text'
          }
        ]
      },
      {
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
            title: 'Caption'
          },
          {
            name: 'altText',
            type: 'string',
            title: 'Alt Text'
          }
        ]
      },
      {
        name: 'featuredClients',
        title: 'Featured Clients',
        description: 'Used to populate "Featured Client Work" links on the home page.',
        type: 'array',
        of: [
          {
            type: 'reference',
            to: [
              {type: 'caseStudy'}
            ]
          }
        ]
      },
    ]
  }