import { client } from '../utils/sanityClient.js';
import groq from 'groq';
import { toHTML } from '@portabletext/to-html';
import { afcComponents } from '../utils/serializers.js';

function generateArticle(article) {
	return {
		...article,
		body: toHTML(article.bodyText, { components: afcComponents }),
		lede: toHTML(article.lede, { components: afcComponents }),
    atGlance: toHTML(article.atGlance, { components: afcComponents }),
    whatDid: toHTML(article.whatDid, { components: afcComponents }),
    reviewBody: toHTML(article?.review?.body, { components: afcComponents }),
    projectGoal: toHTML(article.projectGoal, { components: afcComponents }),
    projectOutcome: toHTML(article.projectOutcome, { components: afcComponents }),
    projectApproach: toHTML(article.projectApproach, { components: afcComponents })
	};
}

// Add to Case Study: 

async function getArticles() {
	// Learn more: https://www.sanity.io/docs/data-store/how-queries-work
	const filter = groq`*[(_type == "article" || _type == "caseStudy") && defined(slug)]`;
	const projection = groq`{
    _id,
    _type,
    title,
    bodyText,
    lede,
    shortDescription,
    pubDate,
    "published": dateTime(_updatedAt),
    _updatedAt,
    slug,
    heroImage,
    atGlance,
    whatDid,
    review->{
      author,
      title,
      excerpt, 
      body,
      "employer":employer->name
    },
    "service":category->prefLabel,
    "insightType": insightType->prefLabel,
    "clientLogo": client->logo,
    "clientTile": client->tile,
    projectGoal,
    projectOutcome,
    projectApproach,
    beforeImage,
    afterImage,
    "heroUrl":heroImage.asset->.url,
    topic[]->{prefLabel},
    "topicTags":topic[]->prefLabel,
    "categoryTag":category->prefLabel,
    canonical,
    "relatedResources": *[_type=='service' && references(^.category._ref) || _type=='study' && references(^.category._ref) || _type=='article' && references(^.category._ref) && _id != ^._id] {
      title,
      heroImage,
      shortDescription,
      "insightType": insightType->prefLabel,
      slug,
      pubDate,
      _type,
      _type == 'service' => {"tag": "Service", "path":"services"},
      _type == 'study' => {"tag": "Case Study", "path":"case-studies"},
      _type == 'article' => {"tag": "Article", "path":"writing"}
    } | order(_type desc, pubDate desc) [0..3]
  }`;
	const order = `| order(pubDate desc)`;
	const query = [filter, projection, order].join(' ');
	const docs = await client.fetch(query).catch((err) => console.error(err));
	const prepareArticles = docs.map(generateArticle);
	return prepareArticles;
}

export default getArticles;
