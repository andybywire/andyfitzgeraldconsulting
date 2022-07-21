const BlocksToMarkdown = require('@sanity/block-content-to-markdown')
const groq = require('groq')
const client = require('../utils/sanityClient.js')
const serializers = require('../utils/serializers')
const overlayDrafts = require('../utils/overlayDrafts')
const hasToken = !!client.config().token

function generateLanding (landing) {
  return {
    ...landing,
    copy: BlocksToMarkdown(landing.copy, { serializers, ...client.config() })
  }
}

async function getLanding () {
  // Learn more: https://www.sanity.io/docs/data-store/how-queries-work
  const filter = groq`*[_type == "collection" && !(_id in path("drafts.**"))]`
  const projection = groq`{
    _id,
    title,
    type,
    copy,
    type
  }`
  const query = [filter, projection].join(' ')
  const docs = await client.fetch(query).catch(err => console.error(err))
  const reducedDocs = overlayDrafts(hasToken, docs)
  const prepareLandings = reducedDocs.map(generateLanding)
  return prepareLandings
}

module.exports = getLanding
