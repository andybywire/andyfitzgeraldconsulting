import { client } from '../utils/sanityClient.js';
import groq from 'groq';
import { toHTML } from '@portabletext/to-html';
import { afcComponents } from '../utils/serializers.js';

function generateReview(review) {
	return {
		...review,
		body: toHTML(review.body, { components: afcComponents }),
		condensedBody: toHTML(review.condensedBody, { components: afcComponents }),
	};
}

export default async function getReview() {
	const filter = groq`*[_type == "review" && !(_id in path("drafts.**"))]`;
	const projection = groq`{
    ...,
    employer->
  }`;
	const query = [filter, projection].join(' ');
	const docs = await client.fetch(query).catch((err) => console.error(err));
	const prepareReviews = docs.map(generateReview);
	return prepareReviews;
}
