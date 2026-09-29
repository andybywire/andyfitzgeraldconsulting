import {defineType, defineField, isPortableTextSpan, isPortableTextTextBlock} from 'sanity'
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
      validation: (Rule) =>
        Rule.custom((value, context) => {
          // Access the sibling field on the parent object
          const parent = context.parent as {bandCopy?: boolean} | undefined
          const displayBandCopy = parent?.bandCopy

          if (displayBandCopy === true) {
            if (!Array.isArray(value) || value.length === 0) {
              return 'Message is required when band copy is displayed'
            }

            const hasText = value.some((block) => {
              if (isPortableTextTextBlock(block)) {
                return block.children?.some(
                  (child) => isPortableTextSpan(child) && child.text.trim() !== '',
                )
              }
              return false
            })

            if (!hasText) {
              return 'Message is required when band copy is displayed'
            }
          }

          return true
        }),
    }),
    defineField({
      name: 'bandCopy',
      type: 'boolean',
      title: 'Band Copy',
      description:
        'Show the title and message field of the Get in Touch band. Turn this off for the contact page, where the page title and copy does the same work.',
      initialValue: true,
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Get in Touch Band'}
    },
  },
})
