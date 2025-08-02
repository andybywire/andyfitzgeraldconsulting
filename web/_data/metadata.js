import { client } from '../utils/sanityClient.js';
import groq from 'groq';

export default async function getMetadata() {
	return await client.fetch(groq`
    *[_id == "settings"][0] {
      ...,
      reviews[]->{
        author,
        title,
        excerpt, 
        "employer":employer->name,
        "reviewSlug":employer->slug.current
      },
      featuredClients[]->{
        title,
        description,
        slug
      },
      homeLogos[]->{
        slug,
        tile
      }
    }
  `);
}
