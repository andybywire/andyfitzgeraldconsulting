import { client } from '../utils/sanityClient.js';
import groq from 'groq';

export default async function () {
	return await client.fetch(groq`
    *[_type == "event" && !(_id in path("drafts.**"))]| order(date desc){...}
  `);
}
