import { toHTML } from '@portabletext/to-html';
import { client } from '../utils/sanityClient.js';
import groq from 'groq';
import { afcComponents } from '../utils/serializers.js';

function generateSingleton(singleton) {
	return {
		...singleton,
		heroCopy: toHTML(singleton.heroCopy, { components: afcComponents }),
		bodyText: toHTML(singleton.bodyText, { components: afcComponents }),
	};
}

async function getSingleton() {
	const filter = groq`*[_type == "singleton" && !(_id in path("drafts.**"))]`;
	const projection = groq`{
    _id,
    title,
    heroCopy,
    slug,
    heroImg,
    bodyText,
  }`;
	const query = [filter, projection].join(' ');
	const docs = await client.fetch(query).catch((err) => console.error(err));
	const prepareSingletons = docs.map(generateSingleton);
	return prepareSingletons;
}

export default getSingleton;
