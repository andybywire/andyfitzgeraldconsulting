import {defineType, defineField} from 'sanity'

export default defineType({
  type: 'image',
  name: 'figure',
  options: {
    hotspot: true,
  },
  fields: [
    defineField({
      name: 'caption',
      type: 'text',
      title: 'Caption',
      rows: 2,
    }),
    defineField({
      name: 'altText',
      type: 'string',
      title: 'Alt Text',
    }),
    defineField({
      name: 'outline',
      type: 'boolean',
      title: 'Outline',
      description:
        'Give images with white backgrounds a light outline to help them not disappear onto the page at the edges',
      initialValue: false,
      options: {
        layout: 'checkbox',
      },
    }),
    /**
     * Added 2026-08-26, to retire the separate inline `image` block whose
     * `floatLeft` flag did this job. One type, one serializer.
     *
     * NAMED FOR THE INTENT, NOT THE MECHANISM. `floatLeft` — the name it replaces
     * — described only half of what happens and stopped being true at the narrow
     * end: the flag both CONSTRAINS the image to a thumbnail width and floats it,
     * and below the desktop breakpoint it does the first without the second. A
     * name that is false on a phone is worse than a slightly abstract one.
     */
    defineField({
      name: 'thumbnail',
      type: 'boolean',
      title: 'Thumbnail',
      description:
        'Render small (150px) instead of at the full prose width. In an article body it also floats left, with the following text wrapping around it — the treatment used for book covers. On narrow screens, and in case studies, it stays small but does not float.',
      initialValue: false,
      options: {
        layout: 'checkbox',
      },
    }),
  ],
})
