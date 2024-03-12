const groq = require('groq')
const client = require('../utils/sanityClient')

module.exports =  async function() {
  return await client.fetch(groq`
  *[_type == "event" && !(_id in path("drafts.**"))]| order(date desc){...}
  `)
}