export default {
  name: 'service',
  type: 'document',
  title: 'Service',
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      title: 'Slug',
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
        slugify: input => input.toLowerCase().replace(/\s+/g, '-').slice(0, 200)
      }
    },
    {
      title: 'Date Published',
      name: 'pubDate',
      type: 'date'
    },
    {
      name: 'shortDescription',
      type: 'text',
      title: 'Short Description',
      description: 'approx. 125 char'
    },
    {
      name: 'description',
      type: 'text',
      title: 'Description',
      description: 'up to 150 char, likely truncation @ 70'
    },
    {
      name: 'mediumDescription',
      type: 'text',
      title: 'Medium Description',
      description: 'approx. 250 char'
    },
    {
      name: 'cta',
      type: 'text',
      title: 'Call to Action',
      description: '60 - 100 char'
    },
    {
      title: 'Hero Image',
      name: 'heroImage',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'altText',
          type: 'string',
          title: 'Alt Text'
        }
      ]
    },
    {
      title: 'Service Overview', 
      name: 'serviceOverview',
      type: 'array',
      of: [{type: 'block'}]
    },
    {
      title: 'Body', 
      name: 'bodyText',
      type: 'array', 
      of: [{type: 'block'}]
    }
  ]
}