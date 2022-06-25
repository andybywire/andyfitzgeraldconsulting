export default {
  name: 'article',
  type: 'document',
  title: "Articles",
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
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {
        filter: '_type == $type && (scheme->title == $scheme)',
        filterParams: {
          type: 'skosConcept',
          scheme: 'Category'
        }
      }
    },
    {
      name: 'topic',
      title: 'Topics',
      type: 'array',
      of: [
        {type: 'reference',
          to: [{type: 'skosConcept'}],
          options: {
            filter: '_type == $type && (scheme->title == $scheme)',
            filterParams: {
              type: 'skosConcept',
              scheme: 'Topic'
            }
          }
        }
      ]
    },
    {
      name: 'shortDescription',
      type: 'text',
      title: 'Short Description',
      description: 'approx. 125 char',
      rows: 3
    },
    {
      name: 'description',
      type: 'text',
      title: 'Description',
      description: 'up to 150 char, likely truncation @ 70',
      rows: 3
    },
    {
      name: 'lede',
      title: 'Lede',
      type: 'array',
      of: [{type: 'block'}]
    },
    {
      title: 'Body', 
      name: 'bodyText',
      type: 'array', 
      of: [
        {type: 'block'},
        {type: 'image',
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
              options: {
                isHighlighted: true 
              }
            },
            {
              name: 'altText',
              type: 'string',
              title: 'Alt Text',
              options: {
                isHighlighted: true 
              }
            }
          ]
        }
      ]
    }
  ]
}