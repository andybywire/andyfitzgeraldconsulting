/**
 * @todo create Figure object with image, alt text, and caption fields. Caption needs to allow for the inclusion of hyperlinks. Future iterations should afford responsive images.
 */

 export default { 
  type: 'image',
  name: 'figure',
  options: {
    hotspot: true
  },
  fields: [
    {
      name: 'caption',
      type: 'text',
      title: 'Caption',
      rows: 2,
      options: {
        isHighlighted: true
      }
    },
    {
      name: 'altText',
      type: 'string',
      title: 'Alt Text',
      options: {
        isHighlighted: true
      }
    },
    {
      name: 'outline',
      type: 'boolean',
      title: 'Outline',
      description: 'Give images with white backgrounds a light outline to help them not disappear onto the page at the edges',
      initialValue: false,
      options: {
        layout: 'checkbox',
        isHighlighted: true
      }
    }
  ]
}