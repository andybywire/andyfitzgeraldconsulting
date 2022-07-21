const BlocksToMarkdown = require('@sanity/block-content-to-markdown')
const groq = require('groq')
const client = require('../utils/sanityClient.js')
const serializers = require('../utils/serializers')
const overlayDrafts = require('../utils/overlayDrafts')
const hasToken = !!client.config().token

function generateService (service) {
  return {
    ...service,
    body: BlocksToMarkdown(service.bodyText, { serializers, ...client.config() }),
    overview: BlocksToMarkdown(service.serviceOverview, { serializers, ...client.config() })
  }
}

async function getServices () {
  // Learn more: https://www.sanity.io/docs/data-store/how-queries-work
  const filter = groq`*[_type == "service" && defined(slug)]`
  const projection = groq`{
    _id,
    title,
    serviceOverview,
    bodyText,
    pubDate,
    slug,
    heroImage
  }`
  const order = `| order(pubDate asc)`
  const query = [filter, projection, order].join(' ')
  const docs = await client.fetch(query).catch(err => console.error(err))
  const reducedDocs = overlayDrafts(hasToken, docs)
  const prepareServices = reducedDocs.map(generateService)
  return prepareServices
}

module.exports = getServices
