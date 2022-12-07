export default {
  name: 'banner',
  title: 'Header Banner',
  type: 'object',
  description: 'Set a custom banner image and/or caption for this page type. If empty, default values apply. 60 - 75 characters.',
  fieldsets: [
    {
      name: 'position', 
      title: 'Banner Position',
      options: {
        columns: 2
      }
    }
  ],
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
    },
    {
      name: 'horizontal',
      title: 'Horizontal Edge Attached at:',
      type: 'string',
      options: {
        list: [
          {title: 'Left', value: 'left'},
          {title: 'Right', value: 'right'}
        ]
      },
      fieldset: 'position'
    },
    {
      name: 'vertical',
      title: 'Vertical Edge Attached at:',
      type: 'string',
      options: {
        list: [
          {title: 'Top', value: 'top'},
          {title: 'Bottom', value: 'bottom'}
        ]
      },
      fieldset: 'position'
    }
  ]
}
