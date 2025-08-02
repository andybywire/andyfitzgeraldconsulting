import { createClient } from '@sanity/client';

export const client = createClient({
	projectId: '7v0qvet6',
	dataset: 'production',
	useCdn: false, // bypasses edge cache
	apiVersion: '2025-08-02', // current date targets the latest version
	perspective: 'published',
});
