const BlocksToMarkdown = require('@sanity/block-content-to-markdown')
const groq = require('groq')
const client = require('../utils/sanityClient.js')
const serializers = require('../utils/serializers')
const overlayDrafts = require('../utils/overlayDrafts')
const hasToken = !!client.config().token

function generateArticle (article) {
  return {
    ...article,
    body: BlocksToMarkdown(article.bodyText, { serializers, ...client.config() }),
    lede: BlocksToMarkdown(article.lede, { serializers, ...client.config() })
  }
}

async function getArticles () {
  // Learn more: https://www.sanity.io/docs/data-store/how-queries-work
  const filter = groq`*[_type == "article" && defined(slug)]`
  const projection = groq`{
    _id,
    title,
    bodyText,
    lede,
    pubDate,
    "published": dateTime(_updatedAt),
    _updatedAt,
    slug,
    heroImage,
    topic[]->{prefLabel},
    "topicTags":topic[]->prefLabel,
    "categoryTag":category->prefLabel,
    "relatedServices": *[_type=='service' && references(^.category._ref)] {
      title,
      heroImage,
      shortDescription,
      slug,
      _type
    }
  }`
  const order = `| order(pubDate asc)`
  const query = [filter, projection, order].join(' ')
  const docs = await client.fetch(query).catch(err => console.error(err))
  const reducedDocs = overlayDrafts(hasToken, docs)
  const prepareArticles = reducedDocs.map(generateArticle)
  return prepareArticles
}

module.exports = getArticles
