const BlocksToMarkdown = require('@sanity/block-content-to-markdown')
const groq = require('groq')
const client = require('../utils/sanityClient.js')
const serializers = require('../utils/serializers')
const overlayDrafts = require('../utils/overlayDrafts')
const hasToken = !!client.config().token

function generateCategory (category) {
  return {
    ...category,
    copy: BlocksToMarkdown(category.copy, { serializers, ...client.config() }),
    clientBlockCopy: BlocksToMarkdown(category.clientBlockCopy, { serializers, ...client.config() })
  }
}

async function getCategory () {
  // Learn more: https://www.sanity.io/docs/data-store/how-queries-work
  const filter = groq`*[_type == "collection" && !(_id in path("drafts.**")) && type != "home"]`
  const projection = groq`{
    _id,
    title,
    type,
    copy,
    type,
    review[]->{
      author,
      title,
      excerpt, 
      "employer":employer->name
    },
    clientBlockTitle,
    clientBlockCopy,
    reviewBlockTitle,
    reviewBlockCopy
  }`
  const query = [filter, projection].join(' ')
  const docs = await client.fetch(query).catch(err => console.error(err))
  const reducedDocs = overlayDrafts(hasToken, docs)
  const prepareCategories = reducedDocs.map(generateCategory)
  return prepareCategories
}

module.exports = getCategory
