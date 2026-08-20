import {MdEventAvailable} from 'react-icons/md'

export default {
  name: 'event',
  type: 'document',
  title: 'Events',
  icon: MdEventAvailable,
  initialValue: {
    type: 'talk',
  },
  fields: [
    {
      name: 'event',
      title: 'Event Name',
      type: 'string',
    },
    {
      name: 'date',
      title: 'Event Date',
      type: 'date',
    },
    {
      name: 'location',
      title: 'Event Location',
      type: 'object',
      fields: [
        {name: 'city', type: 'string', title: 'City'},
        {name: 'state', type: 'string', title: 'State'},
        {name: 'country', type: 'string', title: 'Country'},
      ],
    },
    {
      name: 'title',
      title: 'Presentation Title',
      type: 'string',
    },
    {
      name: 'type',
      title: 'Presentation Type',
      type: 'string',
      options: {
        list: [
          {title: 'Talk', value: 'talk'},
          {title: 'Keynote', value: 'keynote'},
          {title: 'Workshop', value: 'workshop'},
          {title: 'Panel', value: 'panel'},
          {title: 'Podcast', value: 'podcast'},
        ],
      },
    },
    {
      name: 'link',
      title: 'Event Link',
      description: 'If available, provide a link to the event detail page.',
      type: 'url',
    },
  ],
  preview: {
    select: {
      title: 'event',
      subtitle: 'title',
    },
  },
}
