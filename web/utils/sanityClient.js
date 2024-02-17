import { createClient } from '@sanity/client';

export const client = createClient({
	projectId: '7v0qvet6',
	dataset: 'production',
	useCdn: false, // bypasses edge cache
	apiVersion: '2024-01-01', // current date targets the latest version
});
