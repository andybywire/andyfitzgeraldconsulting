import dateFilter from 'nunjucks-date-filter'

// Filters & Shortcodes
import responsiveImage from './_11ty/shortcodes/responsiveImage.js';
import bannerImage from './_11ty/shortcodes/bannerImage.js';
import imageUrlFor from './_11ty/shortcodes/imageUrlFor.js';

export default function (eleventyConfig) {
	eleventyConfig.addPassthroughCopy('.htaccess');
	eleventyConfig.addPassthroughCopy('style');
	eleventyConfig.addPassthroughCopy('assets');
	// eleventyConfig.addPassthroughCopy({ 'assets/js': 'js' });
	// eleventyConfig.addPassthroughCopy({ 'assets/icons': 'icons' });
	// eleventyConfig.addPassthroughCopy('manifest.json');
	// eleventyConfig.addPassthroughCopy('serviceworker.js');
	// eleventyConfig.addPassthroughCopy('robots.txt');

	// Shortcodes
	eleventyConfig.addShortcode('bannerImage', bannerImage);
	eleventyConfig.addShortcode('responsiveImage', responsiveImage);
	eleventyConfig.addShortcode('imageUrlFor', imageUrlFor);

	// Filters
	eleventyConfig.addFilter('date', dateFilter); // Moment.js

	eleventyConfig.setServerOptions({
		watch: ['style/**/*.css'],
		showAllHosts: true,
	});

	return {
		htmlTemplateEngine: 'njk',
		dir: {
			data: '../_data',
			input: '_src',
			includes: '../_includes',
			layouts: '../_includes',
		},
	};
}
