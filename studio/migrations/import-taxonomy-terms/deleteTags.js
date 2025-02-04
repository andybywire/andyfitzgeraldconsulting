/**
 * THIS SCRIPT DELETES DATA!
 *
 * To use this script:
 * 1. Put this script in your studio-folder
 * 2. Write a GROQ filter that outputs the documents you want to delete
 * 3. Run `sanity dataset export` to backup your dataset before deleting a bunch of documents
 * 4. Run `sanity exec migrations/deleteDocsByFilter.js --with-user-token` to delete the documents
 *
 * This script requires a token with `manage datasets` permissions
 */

const { createClient } = require('@sanity/client');

const token = "skb5DvW5Vx3Hvdd3ENIvqBhgbCYJurP57SxFBVUZRsnN3KFjTS6tVMs90Lpq9trMOBLJS0cs3DQfAG3W96O9x7E5BFxSWMbWVbHZ4MXZYyLTsAQrr7ZH9XGSQwKXaQQ1eCFH1CLGmbNVxLXOrLrONpxyPv6tWUkAsSVkyN8KxWIvA4hrAfKT"

const client = createClient({
	projectId: '7v0qvet6',
	dataset: 'production',
	token,
	useCdn: false, // `false` if you want to ensure fresh data
});

client.delete({ query: '*[_type in ["skosConcept", "skosConceptScheme"] && _id match "skosConcept**"]' }).then(console.log).catch(console.error);
