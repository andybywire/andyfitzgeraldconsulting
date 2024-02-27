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
        name: 'defaultBanner',
        title: 'Default Banner',
        type: 'banner',
        description: '60 - 75 characters',
        options: {
          collapsible: false
        }
      },
      {
        name: 'defaultCta',
        title: 'Default Call to Action',
        type: 'cta',
        description: '60 - 100 characters',
        deprecated: {reason: 'Design element no longer a part of 2024 site'},
      }
    ]
  }