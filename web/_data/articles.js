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
		condensedReviewBody: toHTML(article?.review?.condensedBody, { components: afcComponents }),
		projectGoal: toHTML(article.projectGoal, { components: afcComponents }),
		projectOutcome: toHTML(article.projectOutcome, { components: afcComponents }),
		projectApproach: toHTML(article.projectApproach, { components: afcComponents }),
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
    podcastId,
    lede,
    "metaDescription": description,
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
      slug,
      excerpt, 
      body,
      condensedBody,
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
    "topicTags":topic[]->prefLabel,
    "categoryTag":category->prefLabel,
    canonical,
    "tagCount": length(topic[]),
    "relatedResources": *[
      (_type=='caseStudy' || _type =='article')
      && array::intersects(topic[]._ref, ^.topic[]._ref)
      && _id != ^._id ] 
      {
        title,
        "sharedTags": length(topic[] + ^.topic[]) - count(array::unique(topic[]._ref + ^.topic[]._ref)),
        heroImage,
        shortDescription,
        "insightType": insightType->prefLabel,
        "category": category->prefLabel,
        "topics": topic[]->prefLabel,
        slug,
        pubDate,
        topic,
        _type,
        _type == 'service' => {"tag": "Service", "path":"services"},
        _type == 'study' => {"tag": "Case Study", "path":"case-studies"},
        _type == 'article' => {"tag": "Article", "path":"writing"}
      } 
      // | order(sharedTags desc, pubDate desc) [0..3]
    }
    { 
      ...,
      "relatedResources": relatedResources[]{
        ...,
        "relatedness": round((sharedTags * 2) / (length(topic[]) + ^.tagCount), 2)
      } 
    }
    {
      ...,
      "relatedResources": relatedResources[]{
        ...,
        "relatednessAdj": select(
            insightType == "Interview" => round(relatedness - 0.1, 2),
            insightType == "Case Study" => round(relatedness + 0.2, 2),
            // could max this at 1
            relatedness
        )
      } | order(relatednessAdj desc) [0..3]
    } | order(_createdAt desc)
    `;
	const order = `| order(pubDate desc)`;
	const query = [filter, projection, order].join(' ');
	const docs = await client.fetch(query).catch((err) => console.error(err));
	const prepareArticles = docs.map(generateArticle);
	return prepareArticles;
}

export default getArticles;
