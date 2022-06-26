export default {
  name: 'banner',
  title: 'Header Banner',
  type: 'object',
  description: 'Set a custom banner image and/or caption for this page type. If empty, default values apply.',
  options: {
    collapsible: true,
    collapsed: true,

  },
  fields: [
    {
      name: 'bannerCopy',
      title: 'Banner Copy',
      type: 'text',
      rows: 3
    },
    {
      name: 'bannerImg',
      title: 'Banner Image',
      type: 'image'
    }
  ]
}
