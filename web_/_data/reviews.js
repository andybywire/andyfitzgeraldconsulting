const groq = require('groq')
const client = require('../utils/sanityClient')
const BlocksToMarkdown = require('@sanity/block-content-to-markdown')
const serializers = require('../utils/serializers')
const overlayDrafts = require('../utils/overlayDrafts')
const hasToken = !!client.config().token

function generateReview (review) {
  return {
    ...review,
    body: BlocksToMarkdown(review.body, { serializers, ...client.config() })
  }
}

async function getReview () {
  const filter = groq`*[_type == "review" && !(_id in path("drafts.**"))]`
  const projection = groq`{
    ...,
    employer->
  }`
  const query = [filter, projection].join(' ')
  const docs = await client.fetch(query).catch(err => console.error(err))
  const reducedDocs = overlayDrafts(hasToken, docs)
  const prepareReviews = reducedDocs.map(generateReview)
  return prepareReviews
}

module.exports = getReview