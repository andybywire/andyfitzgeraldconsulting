import { client } from '../utils/sanityClient.js';
import groq from 'groq';

export default async function() {
  return await client.fetch(groq`
    *[_type == "client"] | order(name desc){
      ...
    }
  `)
}