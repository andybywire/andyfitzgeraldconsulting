import {MdEventAvailable} from 'react-icons/md'
import {defineType, defineField} from 'sanity'

/**
 * A DELIVERY OCCASION, not a presentation.
 *
 * This type records a date and a location at which Andy spoke, with the talk title
 * subordinate to them. The `presentation` type inverts that — see CLAUDE.md → phase
 * 4 → The five content types: a presentation is the delivered work and one
 * presentation has many deliveries, so these 38 documents group under a smaller set
 * of presentations rather than becoming presentations themselves.
 *
 * Which means `title` and `type` here are on borrowed time: both describe the WORK
 * and belong to `presentation` once it exists. No document carries a `genre` today.
 */
export default defineType({
  name: 'event',
  type: 'document',
  title: 'Events',
  icon: MdEventAvailable,
  fields: [
    defineField({
      name: 'event',
      title: 'Event Name',
      type: 'string',
    }),
    defineField({
      name: 'date',
      title: 'Event Date',
      type: 'date',
    }),
    defineField({
      name: 'location',
      title: 'Event Location',
      type: 'object',
      fields: [
        defineField({
          name: 'online',
          title: 'Online Event',
          type: 'boolean',
          description: 'Check if this was and online-only event',
          initialValue: false,
        }),
        defineField({
          name: 'city',
          type: 'string',
          title: 'City',
          hidden: ({parent}) => parent?.online,
        }),
        defineField({
          name: 'state',
          type: 'string',
          title: 'State',
          hidden: ({parent}) => parent?.online,
        }),
        defineField({
          name: 'country',
          type: 'string',
          title: 'Country',
          initialValue: 'USA',
          options: {
            list: [
              {title: 'United States', value: 'USA'},
              {title: 'Canada', value: 'Canada'},
              {title: 'United Kingdom', value: 'UK'},
              {title: 'Switzerland', value: 'Switzerland'},
              {title: 'Italy', value: 'Italy'},
            ],
          },
          hidden: ({parent}) => parent?.online,
        }),
      ],
    }),
    defineField({
      name: 'eventRecordings',
      type: 'array',
      of: [{type: 'recording'}],
    }),
    defineField({
      name: 'link',
      title: 'Event Link',
      description: 'If available, provide a link to the event detail page.',
      type: 'url',
    }),
    defineField({
      name: 'title',
      title: 'Presentation Title',
      type: 'string',
      deprecated: {
        reason: 'As of the 2026 redesign, Presentation Title is carried by Presentation.',
      },
    }),
    /* Overlaps the Genre scheme's Presentation branch — Keynote, Talk, Workshop,
       Panel — without being it. `podcast` here has no Genre counterpart and
       `interview` is the Genre term for what it describes. Reconcile when
       `presentation` lands; a string list and a SKOS scheme should not both be
       classifying the same thing. */
    defineField({
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
      initialValue: 'talk',
      deprecated: {
        reason: 'As of the 2026 redesign, Presentation Type is carried by Presentation.',
      },
    }),
  ],
  preview: {
    select: {
      title: 'event',
      subtitle: 'title',
    },
  },
})
