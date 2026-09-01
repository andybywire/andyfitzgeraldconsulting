import {defineType, defineField} from 'sanity'
import {PLAIN_STYLES, MARKS} from '../portableText'

export default defineType({
  type: 'object',
  name: 'bandRss',
  title: 'RSS Band',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'message',
      type: 'array',
      of: [{type: 'block', styles: PLAIN_STYLES, marks: MARKS}],
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'buttonTarget',
      type: 'string',
      description: 'The relative path of the RSS feed.',
      initialValue: '/feed.xml',
      validation: rule => rule.required(),
    })
  ],
  preview: {
    prepare() {return {title: 'RSS Band'}},
  }  
})