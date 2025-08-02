// TODO: remove this file once the 2025 refresh is complete
// it is not being used in the current version of the site

import { toHTML } from '@portabletext/to-html';
import { client } from '../utils/sanityClient.js';
import groq from 'groq';
import { afcComponents } from '../utils/serializers.js';

function generateStudy(study) {
	return {
		...study,
		body: toHTML(study.bodyText, { components: afcComponents }),
		atGlance: toHTML(study.atGlance, { components: afcComponents }),
		whatDid: toHTML(study.whatDid, { components: afcComponents }),
		projectGoal: toHTML(study.projectGoal, { components: afcComponents }),
		projectOutcome: toHTML(study.projectOutcome, { components: afcComponents }),
		projectApproach: toHTML(study.projectApproach, { components: afcComponents }),
	};
}

async function getStudies() {
	// Learn more: https://www.sanity.io/docs/data-store/how-queries-work
	const filter = groq`*[_type == "caseStudy" && defined(slug)]`;
	const projection = groq`{
    _id,
    title,
    shortDescription,
    description,
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
        _type,
        _type == 'service' => {"tag": "Service", "path":"services"},
        _type == 'study' => {"tag": "Case Study", "path":"case-studies"},
        _type == 'article' => {"tag": "Article", "path":"writing"}
      } | order(sharedTags desc, pubDate desc) [0..3]
  }`;
	const order = `| order(pubDate asc)`;
	const query = [filter, projection, order].join(' ');
	const docs = await client.fetch(query).catch((err) => console.error(err));
	const prepareStudies = docs.map(generateStudy);
	return prepareStudies;
}

export default getStudies;
