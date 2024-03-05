/**
 * @todo make main image responsive
 * @todo make figure responsive
 * @todo make image responsive
 */

import urlFor from './imageUrl.js';

export const afcComponents = {
	types: {
		pre: ({ value }) => `<pre>${value}</pre>`,
		mainImage: ({ value }) => `![${value.alt}](${urlFor(value).url()})`,
		image: ({ value }) =>
			`<img src="${urlFor(value).url()}" alt="${value.altText || ''}" ${value.floatLeft ? 'class="left-float"' : ''}>`,
		figure: ({value}) => {
			return `<figure class="illustration">
								<img src="${urlFor(value).url()}" alt="${value.altText || ''}" ${value.outline ? 'class="outline"' : ''}>
								${value.caption ? `<figcaption> ${value.caption} </figcaption>` : ''}</figure>`;
		},
	},
};

