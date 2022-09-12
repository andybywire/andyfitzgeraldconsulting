const BlocksToMarkdown = require('@sanity/block-content-to-markdown')
const groq = require('groq')
const client = require('../utils/sanityClient.js')
const serializers = require('../utils/serializers')
const overlayDrafts = require('../utils/overlayDrafts')
const hasToken = !!client.config().token

function generateSingleton (Singleton) {
  return {
    ...Singleton,
    heroCopy: BlocksToMarkdown(Singleton.heroCopy, { serializers, ...client.config() }),
    bodyText: BlocksToMarkdown(Singleton.bodyText, { serializers, ...client.config() })
  }
}

async function getSingleton () {
  // Learn more: https://www.sanity.io/docs/data-store/how-queries-work
  const filter = groq`*[_type == "singleton" && !(_id in path("drafts.**"))]`
  const projection = groq`{
    _id,
    title,
    heroCopy,
    heroImg,
    bodyText,
    review[]->{
      author,
      title,
      excerpt, 
      "employer":employer->name
    },
    clientBlockTitle,
    clientBlockCopy,
    reviewBlockTitle,
    reviewBlockCopy,
    servicesBlockTitle,
    servicesBlockCopy
  }`
  const query = [filter, projection].join(' ')
  const docs = await client.fetch(query).catch(err => console.error(err))
  const reducedDocs = overlayDrafts(hasToken, docs)
  const prepareSingletons = reducedDocs.map(generateSingleton)
  return prepareSingletons
}

module.exports = getSingleton
