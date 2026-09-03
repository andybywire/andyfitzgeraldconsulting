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
      name: 'relationship',
      type: 'string',
      validation: rule => rule.required(),
      options: {
        list: [
          {title: 'Direct Client', value: 'Direct Client'},
          {title: 'Agency Partner', value: 'Agency Partner'},
          {title: 'Former Employer', value: 'Coworker'},
          {title: 'Teaching Institution', value: 'Student'},
        ]
      }
    }),
    defineField({
      name: 'role',
      type: 'text',
      description: 'The role I played in my engagements with this client.',
      rows: 2,
    }),
    defineField({
      name: 'engagementDates',
      title: 'Engagement Dates',
      type:'array',
      validation: rule => rule.required(),
      of: [
        defineField({
          name: 'engagement',
          title: 'Client Engagement',
          type: 'object',
          fields: [
            defineField({
              name: 'startDate',
              type: 'date',
              validation: rule => rule.required(),
            }),
            defineField({
              name: 'endDate',
              type: 'date',
              validation: rule => rule.required(),
            }),
          ],
          preview: {
            select: {
              date: 'startDate'
            },
            prepare(selection) {
              return {
                title: `Beginning ${selection.date}`
              }
            }
          }
        }),
      ]
    }),
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
