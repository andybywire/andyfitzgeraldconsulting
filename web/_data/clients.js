const groq = require('groq')
const client = require('../utils/sanityClient')

module.exports =  async function() {
  return await client.fetch(groq`
    *[_type == "client"]{
      ...
    }
  `)
}

// async function getClients () {
//   const filter = groq`*[_type == "skosConcept"]`
//   const projection = groq`{
//     prefLabel,
//     "scheme": scheme->title
//   }`
//   const order = `| order(prefLabel)`
//   const query = [filter, projection, order].join(' ')
//   const data = await client.fetch(query).catch(err => console.error(err))
//   return data
// }

// module.exports = getClients
