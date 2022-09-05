export default {
  name: 'collection',
  type: 'document',
  title: 'Collection Pages',
  fields: [
    {
      name: 'title',
      title: 'Page Title',
      type: 'string'
    },
    {
      name: 'type',
      title: 'Page Type',
      type: 'string',
      options: {
        list: [
          {title: 'Home', value: 'home'},
          {title: 'Services', value: 'services'},
          {title: 'Case Studies', value: 'studies'},
          {title: 'Speaking', value: 'speaking'},
          {title: 'Reviews', value: 'reviews'}
        ]
      }
    },
    {
      name: 'copy',
      title: 'Introductory Copy',
      hidden: ({parent}) => parent.type == 'home',
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
      name: 'homeCopy',
      title: 'Home Page Hero Copy',
      hidden: ({parent}) => parent.type !== 'home',
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
      name: 'homeHero',
      title: 'Home Page Hero Image',
      hidden: ({parent}) => parent.type !== 'home',
      type: 'image',
      fields: [
        {
          name: 'altText',
          type: 'string',
          title: 'Alt Text',
          options: {
            isHighlighted: true 
          }
        }
      ]
    },
    {
      name: 'banner',
      title: 'Banner',
      type: 'banner',
      description: 'Banner image and caption for this collection type',
      options: {
        collapsible: true,
        collapsed: false
      }
    },
    {
      name: 'servicesBlockTitle',
      title: 'Services Block Title',
      type: 'string',
      hidden: ({parent}) => parent.type !== 'home'
    },
    {
      name: 'servicesBlockCopy',
      title: 'Services Block Copy',
      hidden: ({parent}) => parent.type !== 'home',
      type: 'text',
      rows: 3
    }, 
    {
      name: 'reviewBlockTitle',
      title: 'Review Block Title',
      type: 'string',
      hidden: ({parent}) => {
        if (parent.type == 'home' || parent.type == 'studies') {
            return false
          } else {
            return true
          }
      } 
    },
    {
      name: 'reviewBlockCopy',
      title: 'Review Block Copy',
      hidden: ({parent}) => {
        if (parent.type == 'home' || parent.type == 'studies') {
            return false
          } else {
            return true
          }
      }, 
      type: 'text',
      rows: 3
    },
    {
      name: 'review',
      title: 'Review Block Entries',
      // consider validating based on type — 3 for home, two for everywhere else   
      hidden: ({parent}) => {
        if (parent.type == 'home' || parent.type == 'studies') {
            return false
          } else {
            return true
          }
      },  
      type: 'array',
      of: [
        {type: 'reference',
          to: [
            {type: 'review'}
          ]
        }
      ]
    },
    {
      name: 'clientBlockTitle',
      title: 'Client Grid Block Title',
      type: 'string',
      hidden: ({parent}) => {
        if (parent.type == 'home' || parent.type == 'studies') {
            return false
          } else {
            return true
          }
      }
    },
    {
      name: 'clientBlockCopy',
      title: 'Client Grid Block Copy',
      hidden: ({parent}) => {
        if (parent.type == 'home' || parent.type == 'studies') {
            return false
          } else {
            return true
          }
      },
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
      name: 'cta',
      title: 'Call to Action',
      type: 'cta'
    }
  ]
}