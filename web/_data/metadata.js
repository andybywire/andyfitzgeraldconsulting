import { client } from '../utils/sanityClient.js';
import groq from 'groq';

export default async function getMetadata() {
	return await client.fetch(groq`
    *[_id == "settings"][0] {
      ...,
      featuredClients[]->{
        title,
        description,
        slug
      }
    }
  `);
}
