import {defineType, defineField} from 'sanity'
import {PLAIN_STYLES, MARKS} from '../portableText'

export default defineType({
  type: 'object',
  name: 'bandGetInTouch',
  title: 'Get In Touch Band',
  fields: [
    defineField({
      name: 'message',
      type: 'array',
      of: [{type: 'block', styles: PLAIN_STYLES, marks: MARKS}],
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Get in Touch Band'}
    },
  },
})
