import { toHTML } from '@portabletext/to-html';
import { client } from '../utils/sanityClient.js';
import groq from 'groq';
// import serializers from '../utils/serializers';

function generateArticle (article) {
  return {
    ...article,
    // body: BlocksToMarkdown(article.bodyText, { serializers, ...client.config() }),
    // lede: BlocksToMarkdown(article.lede, { serializers, ...client.config() })
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
    shortDescription,
    pubDate,
    "published": dateTime(_updatedAt),
    _updatedAt,
    slug,
    heroImage,
    "heroUrl":heroImage.asset->.url,
    topic[]->{prefLabel},
    "topicTags":topic[]->prefLabel,
    "categoryTag":category->prefLabel,
    canonical,
    "relatedResources": *[_type=='service' && references(^.category._ref) || _type=='study' && references(^.category._ref) || _type=='article' && references(^.category._ref) && _id != ^._id] {
      title,
      heroImage,
      shortDescription,
      slug,
      pubDate,
      _type,
      _type == 'service' => {"tag": "Service", "path":"services"},
      _type == 'study' => {"tag": "Case Study", "path":"case-studies"},
      _type == 'article' => {"tag": "Article", "path":"writing"}
    } | order(_type desc, pubDate desc) [0..3]
  }`
  const order = `| order(pubDate desc)`
  const query = [filter, projection, order].join(' ')
  const docs = await client.fetch(query).catch(err => console.error(err))
  const prepareArticles = docs.map(generateArticle)
  return prepareArticles
}

export default getArticles
