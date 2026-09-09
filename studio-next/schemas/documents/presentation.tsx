import { PiMicrophone } from "react-icons/pi";
import {
  branchFilter,
  schemeFilter,
  ReferenceHierarchyInput,
  ArrayHierarchyInput,
} from 'sanity-plugin-taxonomy-manager'
import {BODY_STYLES, TRANSCRIPT_STYLES, MARKS} from '../portableText'
import {defineType, defineField} from 'sanity'
import {uniqueBandTypes} from '../validation'
import {slugField} from '../slug'

export default defineType({
  name: 'presentation',
  type: 'document',
  icon: PiMicrophone,
  title: 'Presentations',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
    }),
    slugField(),
    defineField({
      title: 'Date Published',
      name: 'pubDate',
      type: 'date',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'genre',
      title: 'Genre',
      type: 'reference',
      to: [{type: 'skosConcept'}],
      options: {
        filter: branchFilter({schemeId: 'sjEhF9', branchId: 'o4E74A', expanded: true}),
      },
      components: {field: ReferenceHierarchyInput},
    }),
    defineField({
      name: 'topic',
      title: 'Topics',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'skosConcept'}],
          options: {
            filter: schemeFilter({schemeId: '2e73674', expanded: true}),
          },
        },
      ],
      components: {field: ArrayHierarchyInput},
    }),
    defineField({
      title: 'Poster',
      name: 'poster',
      type: 'image',
      description: 'Optional poster for this presentation. If not provided here, the poster of the first available recording will be used.',
      options: {
        hotspot: true,
        collapsible: true,
      },
      fields: [
        {
          name: 'altText',
          type: 'string',
          title: 'Alt Text',
        },
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
          deprecated: {reason: 'No longer used as of 2026 redesign.'}
        },
      ],
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Meta Description',
      description: 'Used for description meta tag. Up to 150 char, likely truncation @ 70',
      rows: 3,
    }),
    defineField({
      title: 'Body',
      name: 'bodyText',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: BODY_STYLES,
          marks: MARKS,
        },
        {type: 'figure'},
      ],
    }),
    defineField({
      title: 'Highlights',
      name: 'highlights',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: BODY_STYLES,
          marks: MARKS,
        },
        {type: 'figure'},
      ],
    }),
    defineField({
      name: 'transcript',
      title: 'Presentation Transcript',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: TRANSCRIPT_STYLES,
          marks: MARKS,
        }
      ],
    }),
    // defineField({
    //   name: 'podcastId',
    //   title: 'Podcast Id',
    //   description:
    //     'Embed link ID for podcast interviews. Currently supports Apple podcasts links. Grab the url after `/us/podcast/`.',
    //   type: 'string',
    // }),
    defineField({
      name: 'presentationDeck',
      title: 'Presentation Deck (PDF)',
      type: 'file',
      options: {
        accept: 'application/pdf'
      }
    }),
    defineField({
      name: 'eventDetail',
      title: 'Event Details',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: {type: 'event'}
        }
      ],
    }),
    defineField({
      name: 'customBands',
      title: 'Custom Bands',
      description:
        'Custom bands provide page-specific overrides for default bands defined in Settings.',
      type: 'array',
      of: [{type: 'bandRss'}],
      validation: (rule) => rule.custom(uniqueBandTypes),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      // subtitle: first location + number of additional locations
      // media: first poster, if present
    },

  },
})
