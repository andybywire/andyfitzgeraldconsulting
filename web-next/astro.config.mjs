// @ts-check
import {defineConfig, envField} from 'astro/config'
import {loadEnv} from 'vite'
import sanity from '@sanity/astro'
import react from '@astrojs/react'
import node from '@astrojs/node'

/**
 * This file runs at config time, BEFORE Astro loads `.env`, so `astro:env` is not
 * importable here. Vite's `loadEnv` reads the same files, and is the only way to hand
 * the Sanity integration a projectId at the moment it is constructed. Application code
 * should never do this — it imports from `astro:env/client` or `astro:env/server`
 * instead, where the values are typed and validated.
 */
const {PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET} = loadEnv(
	process.env.NODE_ENV ?? 'development',
	process.cwd(),
	''
)

/**
 * One flag drives the whole deploy shape. CLAUDE.md's table has production/static/nginx/
 * indexed on one row and preview/server/PM2/noindex on the other, so output target, canonical
 * host and visual-editing state are all functions of the mode rather than independent knobs.
 */
const MODE = process.env.PUBLIC_SITE_MODE === 'preview' ? 'preview' : 'production'
const isPreview = MODE === 'preview'

/**
 * Pinned, not an env var: the API version is a property of the queries we have written and
 * tested, not of the environment they run in.
 */
const SANITY_API_VERSION = '2026-08-18'

export default defineConfig({
	site: isPreview
		? 'https://preview.andyfitzgeraldconsulting.com'
		: 'https://andyfitzgeraldconsulting.com',

	// Static in production so the tar → scp → symlink deploy keeps working. The preview
	// environment needs per-request rendering for visual editing, and only it pays for Node.
	output: isPreview ? 'server' : 'static',
	...(isPreview ? {adapter: node({mode: 'standalone'})} : {}),

	integrations: [
		sanity({
			projectId: PUBLIC_SANITY_PROJECT_ID,
			dataset: PUBLIC_SANITY_DATASET,
			apiVersion: SANITY_API_VERSION,
			// Never the CDN: static builds want fresh content at build time, and the preview
			// build wants drafts. Neither benefits from an edge cache.
			useCdn: false,
		}),
		react(),
	],

	env: {
		schema: {
			PUBLIC_SANITY_PROJECT_ID: envField.string({context: 'client', access: 'public'}),
			PUBLIC_SANITY_DATASET: envField.string({context: 'client', access: 'public'}),
			PUBLIC_SITE_MODE: envField.enum({
				context: 'client',
				access: 'public',
				values: ['production', 'preview'],
				default: 'production',
			}),
			// Only the preview build reads drafts, so this is optional by design — a missing
			// token must not fail a production build.
			SANITY_API_READ_TOKEN: envField.string({
				context: 'server',
				access: 'secret',
				optional: true,
			}),
		},
	},
})
