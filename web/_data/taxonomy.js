const groq = require('groq')
const client = require('../utils/sanityClient')

async function getTaxonomies () {
  const filter = groq`*[_type == "skosConcept"]`
  const projection = groq`{
    prefLabel,
    "scheme": scheme->title
  }`
  const order = `| order(prefLabel)`
  const query = [filter, projection, order].join(' ')
  const data = await client.fetch(query).catch(err => console.error(err))
  return data
}

module.exports = getTaxonomies
