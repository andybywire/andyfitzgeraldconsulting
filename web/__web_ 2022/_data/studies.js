const BlocksToMarkdown = require('@sanity/block-content-to-markdown')
const groq = require('groq')
const client = require('../utils/sanityClient.js')
const serializers = require('../utils/serializers')
const overlayDrafts = require('../utils/overlayDrafts')
const hasToken = !!client.config().token

function generateStudy (study) {
  return {
    ...study,
    body: BlocksToMarkdown(study.bodyText, { serializers, ...client.config() }),
    atGlance: BlocksToMarkdown(study.atGlance, { serializers, ...client.config() }),
    whatDid: BlocksToMarkdown(study.whatDid, { serializers, ...client.config() }),
    projectGoal: BlocksToMarkdown(study.projectGoal, { serializers, ...client.config() }),
    projectOutcome: BlocksToMarkdown(study.projectOutcome, { serializers, ...client.config() }),
    projectApproach: BlocksToMarkdown(study.projectApproach, { serializers, ...client.config() })
  }
}

async function getStudies () {
  // Learn more: https://www.sanity.io/docs/data-store/how-queries-work
  const filter = groq`*[_type == "caseStudy" && defined(slug)]`
  const projection = groq`{
    _id,
    title,
    shortDescription,
    atGlance,
    whatDid,
    review->{
      author,
      title,
      excerpt, 
      "employer":employer->name
    },
    "service":category->prefLabel,
    projectGoal,
    projectOutcome,
    projectApproach,
    pubDate,
    slug,
    heroImage,
    "heroUrl":heroImage.asset->.url,
    beforeImage,
    afterImage,
    "bannerCopy": banner.bannerCopy,
    "bannerImg": banner.bannerImg.asset._ref,
    "bannerPosition": coalesce(banner.horizontal, '') + ' ' + coalesce(banner.vertical, ''),
    cta,
    "relatedResources": *[_type=='service' && references(^.category._ref) || _type=='article' && references(^.category._ref)] {
      title,
      heroImage,
      shortDescription,
      slug,
      pubDate,
      _type,
      _type == 'service' => {"tag": "Service", "path":"services"},
      _type == 'article' => {"tag": "Article", "path":"writing"}
    } | order(_type desc, pubDate desc) [0..3]
  }`
  const order = `| order(pubDate asc)`
  const query = [filter, projection, order].join(' ')
  const docs = await client.fetch(query).catch(err => console.error(err))
  const reducedDocs = overlayDrafts(hasToken, docs)
  const prepareStudies = reducedDocs.map(generateStudy)
  return prepareStudies
}

module.exports = getStudies
