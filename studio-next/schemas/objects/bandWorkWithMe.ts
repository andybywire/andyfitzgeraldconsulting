import {defineType, defineField} from 'sanity'
import {PLAIN_STYLES, MARKS} from '../portableText'

export default defineType({
  type: 'object',
  name: 'bandWorkWithMe',
  title: 'Work with Me Band',
  fields: [
    defineField({
      name: 'message',
      type: 'array',
      of: [{type: 'block', styles: PLAIN_STYLES, marks: MARKS}],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'clientLogos',
      title: 'Client Logos',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{type: 'client'}],
        },
      ],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Work with Me Band'}
    },
  },
})
