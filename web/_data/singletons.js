import { toHTML } from '@portabletext/to-html';
import { client } from '../utils/sanityClient.js';
import groq from 'groq';
// import serializers from '../utils/serializers';

function generateSingleton(Singleton) {
	return {
		...Singleton,
		heroCopy: toHTML(Singleton.heroCopy),
		bodyText: toHTML(Singleton.bodyText),
		// heroCopy: BlocksToMarkdown(Singleton.heroCopy, { serializers, ...config() }),
		// bodyText: BlocksToMarkdown(Singleton.bodyText, { serializers, ...config() }),
	};
}

async function getSingleton() {
	const filter = groq`*[_type == "singleton" && !(_id in path("drafts.**"))]`;
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
    servicesBlockCopy,
    "bannerCopy": banner.bannerCopy,
    "bannerImg": banner.bannerImg.asset._ref,
    "bannerPosition": coalesce(banner.horizontal, '') + ' ' + coalesce(banner.vertical, '') 
  }`;
	const query = [filter, projection].join(' ');
	const docs = await client.fetch(query).catch((err) => console.error(err));
	const prepareSingletons = docs.map(generateSingleton);
	return prepareSingletons;
}

export default getSingleton;
