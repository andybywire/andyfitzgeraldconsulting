export default {
  name: 'client',
  type: 'document',
  title: 'Clients',
  fields: [
    {
      name: 'name',
      title: 'Client Name',
      type: 'string'
    },
    {
      title: 'Slug',
      name: 'slug',
      type: 'slug',
      options: {
        source: 'name',
        slugify: input => input.toLowerCase().replace(/\s+/g, '-').slice(0, 200)
      }
    },
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'Logos should be square and 300px'
    },
    {
      name: 'tile',
      title: 'Tile',
      type: 'image',
      description: 'Client tiles should be 500px by 300px'
    }
  ]
}