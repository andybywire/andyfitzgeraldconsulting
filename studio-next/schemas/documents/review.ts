import {MdOutlineReviews} from 'react-icons/md'
import {defineType, defineField} from 'sanity'
import {BODY_STYLES, MARKS} from '../portableText'
import {slugField} from '../slug'

export default defineType({
  name: 'review',
  type: 'document',
  title: 'Reviews',
  icon: MdOutlineReviews,
  fields: [
    defineField({
      name: 'author',
      type: 'string',
      title: 'Author',
    }),
    /* Sourced from the author rather than a title — a review's identity is who
       gave it. */
    slugField('author'),
    defineField({
      name: 'title',
      type: 'string',
      title: 'Job Title',
      description: 'Author job title at the time the review was written.',
    }),
    defineField({
      name: 'linkedIn',
      title: 'LinkedIn Address',
      type: 'url'
    }),
    defineField({
      name: 'employer',
      type: 'reference',
      title: 'Employer',
      description: 'Author employer at the time the review was written',
      to: [{type: 'client'}],
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'condensedBody',
      title: 'Condensed Review Body',
      description: 'A condensed version of the review body is used on Case Study pages.',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: BODY_STYLES,
          marks: MARKS,
        },
      ],
    }),
    defineField({
      name: 'body',
      title: 'Review Body',
      description: 'The full version of the review as given, used on the Reviews page.',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: BODY_STYLES,
          marks: MARKS,
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'author',
      subtitle: 'employer.name',
      media: 'employer.logo',
    },
  },
})
