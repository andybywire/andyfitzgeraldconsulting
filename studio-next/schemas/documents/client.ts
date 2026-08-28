import {FiUsers} from 'react-icons/fi'
import {defineType, defineField} from 'sanity'
import {slugField} from '../slug'

export default defineType({
  name: 'client',
  type: 'document',
  title: 'Clients',
  icon: FiUsers,
  fields: [
    defineField({
      name: 'name',
      title: 'Client Name',
      type: 'string',
    }),
    /* `name`, not `title` — this is the one document whose display field is not
       called `title`, which is why slugField takes the source. */
    slugField('name'),
    defineField({
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
        },
      ],
    }),
    defineField({
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
        },
      ],
    }),
  ],
})
