import {FiUsers} from 'react-icons/fi'

export default {
  name: 'client',
  type: 'document',
  title: 'Clients',
  icon: FiUsers,
  fields: [
    {
      name: 'name',
      title: 'Client Name',
      type: 'string'
    },
    {
      title: 'Slug',
      name: 'slug',
      type: 'slug',
      options: {
        source: 'name',
        slugify: (input: string) => input.toLowerCase().replace(/\s+/g, '-').slice(0, 200),
      }
    },
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'Logos should be square and 300px',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'altText',
          type: 'string',
          title: 'Alt Text',
        }
      ]
    },
    {
      name: 'tile',
      title: 'Tile',
      type: 'image',
      description: 'Client tiles should be 500px by 300px',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'altText',
          type: 'string',
          title: 'Alt Text',
        }
      ]
    }
  ]
}