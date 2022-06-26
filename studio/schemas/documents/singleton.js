export default {
  name: 'singleton',
  type: 'document',
  title: 'Singleton Pages',
  fields: [
    {
      name: 'title',
      title: 'Page Title',
      type: 'string'
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
              { title: "Strong", value: "strong" },
              { title: "Emphasis", value: "em" }
            ]
          }
        }
      ]
    },
    {
      name: 'heroImg',
      title: 'Singleton Page Hero Image',
      type: 'image'
    },
    {
      name: 'banner',
      title: 'Banner',
      type: 'banner',
      options: {
        collapsible: true,
        collapsed: false
      }
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
    },
    {
      name: 'cta',
      type: 'text',
      title: 'Call to Action',
      description: '60 - 100 char',
      rows: 2
    }
  ]
}