import {MdOutlineReviews} from 'react-icons/md'

export default {
  name: 'review',
  type: 'document',
  title: 'Reviews',
  icon: MdOutlineReviews,
  fields: [
    {
      name: 'author',
      type: 'string',
      title: 'Author',
    },
    {
      title: 'Slug',
      name: 'slug',
      type: 'slug',
      options: {
        source: 'author',
        slugify: (input: string) => input.toLowerCase().replace(/\s+/g, '-').slice(0, 200),
      },
    },
    {
      name: 'title',
      type: 'string',
      title: 'Job Title',
      description: 'Author job title at the time the review was written.',
    },
    {
      name: 'employer',
      type: 'reference',
      title: 'Employer',
      description: 'Author employer at the time the review was written',
      to: [{type: 'client'}],
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
    },
    {
      name: 'condensedBody',
      title: 'Condensed Review Body',
      description: 'A condensed version of the review body is used on Case Study pages.',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'Quote', value: 'blockquote'},
          ],
        },
      ],
    },
    {
      name: 'body',
      title: 'Review Body',
      description: 'The full version of the review as given, used on the Reviews page.',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H1', value: 'h1'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'Quote', value: 'blockquote'},
          ],
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'author',
      subtitle: 'employer.name',
      media: 'employer.logo',
    },
  },
}
