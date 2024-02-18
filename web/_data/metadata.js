import { client } from '../utils/sanityClient.js';
import groq from 'groq';

async function getMetadata() {
	return await client.fetch(groq`
        *[_id == "settings"][0]
    `);
}

export default getMetadata;
