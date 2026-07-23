import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  type: 'object',
  name: 'table',
  fields: [
    defineField({type: 'number', name: 'headerRows'}),
    defineField({
      type: 'array',
      name: 'rows',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'row',
          fields: [
            defineField({
              type: 'array',
              name: 'cells',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'cell',
                  fields: [
                    defineField({
                      type: 'array',
                      name: 'value',
                      of: [defineArrayMember({type: 'block'})],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  ],
})